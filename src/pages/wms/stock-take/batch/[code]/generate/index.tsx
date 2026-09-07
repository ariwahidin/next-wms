/* app/stock-take/batch/[code]/generate/page.tsx */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Filter,
  Grid,
  Layers,
  Loader2,
  Package,
  Plus,
  RotateCcw,
} from "lucide-react";

import api from "@/lib/api";
import Layout from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";

type Batch = {
  code: string;
  owner_code: string;
  description?: string;
  status: string;
};

type Location = {
  location_code?: string;
  LocationCode?: string;
  row?: string;
  Row?: string;
  bay?: string;
  Bay?: string;
  level?: string;
  Level?: string;
  bin?: string;
  Bin?: string;
  area?: string;
  Area?: string;
};

type Filters = {
  batchCode: string;
  ownerCode: string;
  area: string;
  fromRow: string;
  toRow: string;
  fromBay: string;
  toBay: string;
  fromLevel: string;
  toLevel: string;
  fromBin: string;
  toBin: string;
  divisionCode: string;
};

function val(obj: any, lower: string, upper: string) {
  return obj?.[lower] ?? obj?.[upper] ?? "";
}

function uniqueSorted(items: Location[], lower: string, upper: string) {
  return [
    ...new Set(items.map((x) => String(val(x, lower, upper))).filter(Boolean)),
  ].sort();
}

export default function GenerateStockTakeSessionPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = decodeURIComponent(params.code);

  const [batch, setBatch] = useState<Batch | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    batchCode: code,
    ownerCode: "",
    area: "",
    fromRow: "",
    toRow: "",
    fromBay: "",
    toBay: "",
    fromLevel: "",
    toLevel: "",
    fromBin: "",
    toBin: "",
    divisionCode: "",
  });

  const rows = useMemo(() => uniqueSorted(locations, "row", "Row"), [locations]);
  const bays = useMemo(() => uniqueSorted(locations, "bay", "Bay"), [locations]);
  const levels = useMemo(() => uniqueSorted(locations, "level", "Level"), [locations]);
  const bins = useMemo(() => uniqueSorted(locations, "bin", "Bin"), [locations]);
  const areas = useMemo(() => uniqueSorted(locations, "area", "Area"), [locations]);

  const load = async () => {
    setLoading(true);
    try {
      const [batchRes, locationRes] = await Promise.all([
        api.get(`/stock-take-batches/${code}`, { withCredentials: true }),
        api.get("/stock-take/locations", { withCredentials: true }),
      ]);

      if (!batchRes.data?.success) {
        throw new Error(batchRes.data?.message || "Batch not found");
      }

      const raw =
        batchRes.data?.data?.batch ??
        batchRes.data?.data?.stock_take_batch ??
        batchRes.data?.data;

      const loadedBatch: Batch = {
        code: raw?.code ?? code,
        owner_code: raw?.owner_code ?? "",
        description: raw?.description ?? "",
        status: raw?.status ?? "open",
      };

      setBatch(loadedBatch);
      setFilters((prev) => ({
        ...prev,
        batchCode: loadedBatch.code,
        ownerCode: loadedBatch.owner_code,
      }));

      if (locationRes.data?.success) {
        setLocations(locationRes.data.data ?? []);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to load batch");
      router.push("/stock-take");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const setField = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const reset = () => {
    setFilters((prev) => ({
      ...prev,
      area: "",
      fromRow: "",
      toRow: "",
      fromBay: "",
      toBay: "",
      fromLevel: "",
      toLevel: "",
      fromBin: "",
      toBin: "",
      divisionCode: "",
    }));
  };

  const generate = async () => {
    if (!batch) return;

    setGenerating(true);
    try {
      const payload = {
        filters: {
          batchCode: batch.code,
          ownerCode: batch.owner_code,
          area: filters.area,
          fromRow: filters.fromRow,
          toRow: filters.toRow,
          fromBay: filters.fromBay,
          toBay: filters.toBay,
          fromLevel: filters.fromLevel,
          toLevel: filters.toLevel,
          fromBin: filters.fromBin,
          toBin: filters.toBin,
          divisionCode: filters.divisionCode,
        },
      };

      const res = await api.post("/stock-take/generate", payload, {
        withCredentials: true,
      });

      if (!res.data?.success) {
        throw new Error(res.data?.message || "Failed to generate session");
      }

      const sessionCode =
        res.data?.data?.stock_take?.code ??
        res.data?.data?.stockTake?.code;

      if (sessionCode) {
        router.push(`/stock-take/${sessionCode}`);
      } else {
        router.push(`/wms/stock-take/batch/${batch.code}`);
      }
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to generate stock take session"
      );
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Cycle Count" subTitle="Generate Session" className="w-full">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading batch...
          </div>
        </div>
      </Layout>
    );
  }

  if (!batch) return null;

  if (batch.status === "completed" || batch.status === "cancelled") {
    return (
      <Layout title="Cycle Count" subTitle="Generate Session" className="w-full">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="py-14 text-center">
              <Layers className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <h2 className="text-base font-semibold text-slate-800">
                Session generation is not available
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Batch <b>{batch.code}</b> is already {batch.status}.
              </p>
              <button
                onClick={() => router.push(`/wms/stock-take/batch/${batch.code}`)}
                className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                Back to Batch
              </button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Cycle Count" subTitle="Generate Session" className="w-full">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <button
            onClick={() => router.push(`/wms/stock-take/batch/${batch.code}`)}
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to {batch.code}
          </button>

          <Card className="overflow-hidden border-0 bg-white/90 shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">
                    Generate Stock Take Session
                  </h1>
                  <p className="text-xs text-slate-500">
                    Create a session under the selected batch.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Batch
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {batch.code}
                  </p>
                  {batch.description && (
                    <p className="mt-1 text-xs text-slate-500">{batch.description}</p>
                  )}
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Customer
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {batch.owner_code}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Customer is inherited from the batch.
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800">
                      Location Scope
                    </h2>
                    <p className="text-xs text-slate-400">
                      Select the warehouse area/range for this session.
                    </p>
                  </div>
                  <button
                    onClick={reset}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <Grid className="h-4 w-4" />
                      Area
                    </label>
                    <select
                      value={filters.area}
                      onChange={(e) => setField("area", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="">All Areas</option>
                      {areas.map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                  </div>

                  {[
                    ["Row", "fromRow", "toRow", rows],
                    ["Bay", "fromBay", "toBay", bays],
                    ["Level", "fromLevel", "toLevel", levels],
                    ["Bin", "fromBin", "toBin", bins],
                  ].map(([label, fromKey, toKey, options]) => (
                    <div key={String(label)}>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        {label} Range
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={filters[fromKey as keyof Filters] as string}
                          onChange={(e) => setField(fromKey as keyof Filters, e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                        >
                          <option value="">From {label}</option>
                          {(options as string[]).map((x) => (
                            <option key={x} value={x}>{x}</option>
                          ))}
                        </select>

                        <select
                          value={filters[toKey as keyof Filters] as string}
                          onChange={(e) => setField(toKey as keyof Filters, e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                        >
                          <option value="">To {label}</option>
                          {(options as string[]).map((x) => (
                            <option key={x} value={x}>{x}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  <div>
                    <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <Package className="h-4 w-4" />
                      Division Code
                    </label>
                    <input
                      value={filters.divisionCode}
                      onChange={(e) => setField("divisionCode", e.target.value)}
                      placeholder="Optional"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
                <b>Important:</b> this creates a new session inside{" "}
                <b>{batch.code}</b>. The session will receive its own{" "}
                <b>STYYYYMMDD0001</b> code and remains compatible with the
                existing scanner/progress pages.
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                onClick={() => router.push(`/wms/stock-take/batch/${batch.code}`)}
                disabled={generating}
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>

              <button
                onClick={generate}
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {generating ? "Generating..." : "Generate Session"}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
