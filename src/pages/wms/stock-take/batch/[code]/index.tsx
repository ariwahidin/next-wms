/* app/stock-take/batch/[code]/page.tsx */
"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Layers,
  Loader2,
  Lock,
  MapPin,
  MoreVertical,
  Package,
  Plus,
  Printer,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";

import api from "@/lib/api";
import Layout from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type BatchStatus = "open" | "in_progress" | "completed" | "cancelled";
type SessionStatus = "open" | "in_progress" | "closed" | "cancelled";

type Batch = {
  ID: number;
  code: string;
  owner_code: string;
  description?: string;
  status: BatchStatus;
  created_at: string;
  started_at?: string | null;
  closed_at?: string | null;
  total_sessions?: number;
  completed_sessions?: number;
  in_progress_sessions?: number;
  open_sessions?: number;
  cancelled_sessions?: number;
  total_locations?: number;
  counted_locations?: number;
  total_system_qty?: number;
  total_counted_qty?: number;
  total_difference?: number;
};

type LocationLookup = {
  location: string;
  session_code: string;
  session_status: SessionStatus;
  total_system_qty: number;
  counted_qty: number;
  counted: boolean;
};

type Session = {
  ID: number;
  id?: number;
  code: string;
  status: SessionStatus;
  created_by?: number;
  created_at: string;
  started_at?: string | null;
  closed_at?: string | null;
  total_locations?: number;
  counted_locations?: number;
  total_system_qty?: number;
  total_counted_qty?: number;
  total_difference?: number;
};

const SESSION_STATUS: Record<
  SessionStatus,
  { label: string; className: string }
> = {
  open: {
    label: "Open",
    className: "bg-blue-50 border-blue-200 text-blue-700",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-amber-50 border-amber-200 text-amber-700",
  },
  closed: {
    label: "Closed",
    className: "bg-emerald-50 border-emerald-200 text-emerald-700",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 border-red-200 text-red-700",
  },
};

const BATCH_STATUS: Record<
  BatchStatus,
  { label: string; className: string }
> = {
  open: {
    label: "Open",
    className: "bg-blue-50 border-blue-200 text-blue-700",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-amber-50 border-amber-200 text-amber-700",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-50 border-emerald-200 text-emerald-700",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 border-red-200 text-red-700",
  },
};

function n(v: unknown) {
  const x = Number(v ?? 0);
  return Number.isFinite(x) ? x : 0;
}

function normalizeBatch(raw: any): Batch {
  return {
    ...raw,
    ID: n(raw?.ID ?? raw?.id),
    code: raw?.code ?? "",
    owner_code: raw?.owner_code ?? "",
    description: raw?.description ?? "",
    status: raw?.status ?? "open",
    created_at: raw?.created_at ?? new Date().toISOString(),
    total_sessions: n(raw?.total_sessions),
    completed_sessions: n(raw?.completed_sessions),
    in_progress_sessions: n(raw?.in_progress_sessions),
    open_sessions: n(raw?.open_sessions),
    cancelled_sessions: n(raw?.cancelled_sessions),
    total_locations: n(raw?.total_locations),
    counted_locations: n(raw?.counted_locations),
    total_system_qty: n(raw?.total_system_qty),
    total_counted_qty: n(raw?.total_counted_qty),
    total_difference: n(raw?.total_difference),
  };
}

function normalizeSession(raw: any): Session {
  return {
    ...raw,
    ID: n(raw?.ID ?? raw?.id),
    id: n(raw?.id ?? raw?.ID),
    code: raw?.code ?? "",
    status: raw?.status ?? "open",
    created_at: raw?.created_at ?? new Date().toISOString(),
    total_locations: n(raw?.total_locations),
    counted_locations: n(raw?.counted_locations),
    total_system_qty: n(raw?.total_system_qty),
    total_counted_qty: n(raw?.total_counted_qty),
    total_difference: n(raw?.total_difference),
  };
}

function extractBatch(payload: any) {
  return normalizeBatch(
    payload?.data?.batch ??
      payload?.data?.stock_take_batch ??
      payload?.data ??
      {}
  );
}

function extractSessions(payload: any): Session[] {
  const rows =
    payload?.data?.sessions ??
    payload?.data?.data ??
    payload?.data ??
    [];
  return Array.isArray(rows) ? rows.map(normalizeSession) : [];
}

export default function StockTakeBatchDetailPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();

  const rawCode = params?.code;
  const code = rawCode ? decodeURIComponent(rawCode) : "";
//   const code = decodeURIComponent(params.code);

  const [batch, setBatch] = useState<Batch | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [action, setAction] = useState<
    "complete" | "cancel" | null
  >(null);

  const [sessionMenu, setSessionMenu] = useState<{
    code: string;
    top: number;
    left: number;
  } | null>(null);

  const [sessionAction, setSessionAction] = useState<
    "close" | "cancel" | null
  >(null);

  const [sessionActionCode, setSessionActionCode] = useState<string | null>(
    null
  );

  const [locationSearch, setLocationSearch] = useState("");
  const [locationResults, setLocationResults] = useState<LocationLookup[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationSearched, setLocationSearched] = useState(false);

  const fetchData = async (silent = false) => {
    if (silent) setRefetching(true);
    else setLoading(true);

    try {
      const [batchRes, sessionRes] = await Promise.all([
        api.get(`/stock-take-batches/${code}`, { withCredentials: true }),
        api.get(`/stock-take-batches/${code}/sessions`, {
          withCredentials: true,
        }),
      ]);

      if (batchRes.data?.success) setBatch(extractBatch(batchRes.data));
      if (sessionRes.data?.success) setSessions(extractSessions(sessionRes.data));
    } catch (err) {
      console.error("Failed to fetch batch detail", err);
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  };

//   useEffect(() => {
//     fetchData();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [code]);

useEffect(() => {
  if (!code) return;

  fetchData();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [code]);

  const findLocations = async () => {
    const search = locationSearch.trim();
    if (!search) {
      setLocationResults([]);
      setLocationSearched(false);
      return;
    }

    setLocationLoading(true);
    setLocationSearched(true);

    try {
      const res = await api.get(
        `/stock-take-batches/${encodeURIComponent(code)}/locations`,
        {
          params: { search },
          withCredentials: true,
        }
      );

      if (res.data?.success) {
        const rows = res.data?.data ?? [];
        setLocationResults(Array.isArray(rows) ? rows : []);
      } else {
        setLocationResults([]);
      }
    } catch (err) {
      console.error("Failed to find stock take locations", err);
      setLocationResults([]);
    } finally {
      setLocationLoading(false);
    }
  };

  const activeSessions = useMemo(
    () =>
      sessions.filter(
        (x) => x.status === "open" || x.status === "in_progress"
      ),
    [sessions]
  );

  const canGenerateSession =
    !!batch && batch.status !== "completed" && batch.status !== "cancelled";

  const canComplete =
    !!batch &&
    batch.status !== "completed" &&
    batch.status !== "cancelled" &&
    sessions.length > 0 &&
    activeSessions.length === 0 &&
    sessions.every((x) => x.status === "closed");

  const progress = useMemo(() => {
    const planned = n(batch?.total_locations);
    const counted = n(batch?.counted_locations);
    return planned > 0 ? Math.min(100, Math.round((counted / planned) * 1000) / 10) : 0;
  }, [batch]);

  const completeBatch = async () => {
    if (!batch) return;
    setActionLoading(true);
    try {
      const res = await api.post(
        `/stock-take-batches/${batch.code}/complete`,
        {},
        { withCredentials: true }
      );
      if (!res.data?.success) {
        throw new Error(res.data?.message || "Failed to complete batch");
      }
      setAction(null);
      await fetchData(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to complete batch");
    } finally {
      setActionLoading(false);
    }
  };

  const cancelBatch = async () => {
    if (!batch) return;
    setActionLoading(true);
    try {
      const res = await api.post(
        `/stock-take-batches/${batch.code}/cancel`,
        {},
        { withCredentials: true }
      );
      if (!res.data?.success) {
        throw new Error(res.data?.message || "Failed to cancel batch");
      }
      setAction(null);
      await fetchData(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to cancel batch");
    } finally {
      setActionLoading(false);
    }
  };

  const openSessionMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    sessionCode: string
  ) => {
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 210;
    const menuHeight = 180;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < menuHeight;

    let left = rect.right - menuWidth;
    if (left < 8) left = 8;
    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }

    const top = openUpward
      ? rect.top - menuHeight - 4
      : rect.bottom + 4;

    setSessionMenu({
      code: sessionCode,
      top,
      left,
    });
  };

  const runSessionAction = async () => {
    if (!sessionAction || !sessionActionCode) return;

    setActionLoading(true);

    try {
      const endpoint =
        sessionAction === "close"
          ? `/stock-take/${sessionActionCode}/close`
          : `/stock-take/${sessionActionCode}/cancel`;

      const res = await api.post(
        endpoint,
        {},
        { withCredentials: true }
      );

      if (!res.data?.success) {
        throw new Error(
          res.data?.message ||
            `Failed to ${sessionAction} session`
        );
      }

      setSessionAction(null);
      setSessionActionCode(null);
      await fetchData(true);
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          err?.message ||
          `Failed to ${sessionAction} session`
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Cycle Count" subTitle="Batch Detail" className="w-full">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading batch...
          </div>
        </div>
      </Layout>
    );
  }

  if (!batch) {
    return (
      <Layout title="Cycle Count" subTitle="Batch Detail" className="w-full">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center py-14 text-center">
              <XCircle className="mb-3 h-10 w-10 text-red-300" />
              <p className="font-medium text-slate-700">Batch not found</p>
              <button
                onClick={() => router.push("/stock-take")}
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                Back to Cycle Count
              </button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const batchStatus = BATCH_STATUS[batch.status];

  return (
    <Layout title="Cycle Count" subTitle="Batch Detail" className="w-full">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <button
                onClick={() => router.push("/wms/stock-take/data")}
                className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Batches
              </button>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900">
                  <Layers className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold text-slate-900">
                      {batch.code}
                    </h1>
                    <Badge className={`${batchStatus.className} border`}>
                      {batchStatus.label}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Customer: <b>{batch.owner_code}</b>
                    {batch.description ? ` • ${batch.description}` : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchData(true)}
                disabled={refetching}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refetching ? "animate-spin" : ""}`} />
                Refresh
              </button>

              {canGenerateSession && (
                <button
                  onClick={() => router.push(`/wms/stock-take/batch/${batch.code}/generate`)}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  Generate Session
                </button>
              )}
            </div>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card className="border-0 bg-white/80 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-slate-500">Sessions</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {n(batch.completed_sessions)} / {n(batch.total_sessions)}
                </p>
                <p className="text-[11px] text-slate-400">closed / total</p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/80 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-slate-500">Location Progress</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {progress}%
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      progress >= 100 ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {n(batch.counted_locations).toLocaleString("id-ID")} /{" "}
                  {n(batch.total_locations).toLocaleString("id-ID")} locations
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/80 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-slate-500">Quantity</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {n(batch.total_counted_qty).toLocaleString("id-ID")}
                </p>
                <p className="text-[11px] text-slate-400">
                  of {n(batch.total_system_qty).toLocaleString("id-ID")} system qty
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/80 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-slate-500">Difference</p>
                <p
                  className={`mt-1 text-xl font-semibold ${
                    n(batch.total_difference) === 0
                      ? "text-slate-900"
                      : n(batch.total_difference) < 0
                        ? "text-red-600"
                        : "text-blue-600"
                  }`}
                >
                  {n(batch.total_difference) > 0 ? "+" : ""}
                  {n(batch.total_difference).toLocaleString("id-ID")}
                </p>
                <p className="text-[11px] text-slate-400">counted - system</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-5 border-0 bg-white/80 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Batch Lifecycle
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    A batch is completed only after every session is closed.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {canComplete && (
                    <button
                      onClick={() => setAction("complete")}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Complete Batch
                    </button>
                  )}

                  {batch.status !== "completed" && batch.status !== "cancelled" && (
                    <button
                      onClick={() => setAction("cancel")}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel Batch
                    </button>
                  )}
                </div>
              </div>

              {batch.status === "in_progress" && activeSessions.length > 0 && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                  {activeSessions.length} session(s) still open or in progress.
                  Close all sessions before completing the batch.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-5 border-0 bg-white/80 shadow-sm">
            <CardContent className="p-0">
              <div className="border-b border-slate-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                    <MapPin className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800">
                      Find Location
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Find which stock take session is assigned to a location.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    findLocations();
                  }}
                  className="flex flex-col gap-2 sm:flex-row"
                >
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      placeholder="Search location... e.g. A01020304"
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={locationLoading || !locationSearch.trim()}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {locationLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Find
                  </button>
                </form>

                {locationSearched && !locationLoading && (
                  <div className="mt-4">
                    {locationResults.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                        <MapPin className="mx-auto mb-2 h-7 w-7 text-slate-300" />
                        <p className="text-sm font-medium text-slate-600">
                          Location not found
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          No location matching "{locationSearch.trim()}" was found in this batch.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-lg border border-slate-200">
                        <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500">
                          {locationResults.length} location{locationResults.length !== 1 ? "s" : ""} found
                        </div>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-white">
                                <TableHead className="px-4 py-2.5 text-xs font-semibold text-slate-600">Location</TableHead>
                                <TableHead className="py-2.5 text-xs font-semibold text-slate-600">Session</TableHead>
                                <TableHead className="py-2.5 text-xs font-semibold text-slate-600">Status</TableHead>
                                <TableHead className="py-2.5 text-right text-xs font-semibold text-slate-600">System</TableHead>
                                <TableHead className="py-2.5 text-right text-xs font-semibold text-slate-600">Counted</TableHead>
                                <TableHead className="px-4 py-2.5 text-center text-xs font-semibold text-slate-600">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {locationResults.map((row) => {
                                const meta = SESSION_STATUS[row.session_status] ?? SESSION_STATUS.open;
                                return (
                                  <TableRow key={`${row.session_code}-${row.location}`} className="hover:bg-slate-50">
                                    <TableCell className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                        <span className="text-sm font-semibold text-slate-900">{row.location}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <button
                                        onClick={() => router.push(`/stock-take/progress/${row.session_code}`)}
                                        className="text-sm font-semibold text-slate-700 hover:text-slate-900 hover:underline"
                                      >
                                        {row.session_code}
                                      </button>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <Badge className={`${meta.className} border`}>{meta.label}</Badge>
                                    </TableCell>
                                    <TableCell className="py-3 text-right text-sm text-slate-700">
                                      {n(row.total_system_qty).toLocaleString("id-ID")}
                                    </TableCell>
                                    <TableCell className="py-3 text-right text-sm font-medium text-slate-700">
                                      {n(row.counted_qty).toLocaleString("id-ID")}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-center">
                                      <button
                                        onClick={(e) =>
                                          openSessionMenu(e, row.session_code)
                                        }
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                        title="Session actions"
                                      >
                                        <MoreVertical className="h-3.5 w-3.5" />
                                      </button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">
                    Stock Take Sessions
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Sessions belonging to {batch.code}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {sessions.length} sessions
                </span>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 bg-slate-50/60">
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600">#</TableHead>
                      <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-600">Session Code</TableHead>
                      <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-600">Status</TableHead>
                      <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-600">Locations</TableHead>
                      <TableHead className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Qty</TableHead>
                      <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-600">Created</TableHead>
                      <TableHead className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">Action</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {sessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-14">
                          <div className="flex flex-col items-center text-center">
                            <Layers className="mb-3 h-10 w-10 text-slate-300" />
                            <p className="text-sm font-medium text-slate-600">
                              No sessions yet
                            </p>
                            {canGenerateSession && (
                              <button
                                onClick={() =>
                                  router.push(`/wms/stock-take/batch/${batch.code}/generate`)
                                }
                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                              >
                                <Plus className="h-4 w-4" />
                                Generate First Session
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      sessions.map((session, index) => {
                        const meta = SESSION_STATUS[session.status];
                        const locPlanned = n(session.total_locations);
                        const locCounted = n(session.counted_locations);
                        const pct =
                          locPlanned > 0
                            ? Math.min(
                                100,
                                Math.round((locCounted / locPlanned) * 1000) / 10
                              )
                            : 0;

                        return (
                          <TableRow
                            key={session.ID || session.code}
                            className="group border-b border-slate-50 hover:bg-slate-50/70"
                          >
                            <TableCell className="px-4 py-3 text-xs font-medium text-slate-400">
                              {String(index + 1).padStart(2, "0")}
                            </TableCell>

                            <TableCell
                              className="cursor-pointer py-3"
                              onClick={() =>
                                router.push(`/stock-take/progress/${session.code}`)
                              }
                            >
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100">
                                  <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {session.code}
                                  </p>
                                  <p className="text-[11px] text-slate-400">
                                    Session
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="py-3">
                              <Badge className={`${meta.className} border`}>
                                {meta.label}
                              </Badge>
                            </TableCell>

                            <TableCell className="min-w-[170px] py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full bg-slate-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="w-10 text-right text-xs text-slate-600">
                                  {pct}%
                                </span>
                              </div>
                              <p className="mt-1 text-[11px] text-slate-400">
                                {locCounted} / {locPlanned}
                              </p>
                            </TableCell>

                            <TableCell className="py-3 text-right">
                              <p className="text-sm font-semibold text-slate-800">
                                {n(session.total_counted_qty).toLocaleString("id-ID")}
                                <span className="font-normal text-slate-400">
                                  {" / "}
                                  {n(session.total_system_qty).toLocaleString("id-ID")}
                                </span>
                              </p>
                              {n(session.total_difference) !== 0 && (
                                <p
                                  className={`text-[11px] ${
                                    n(session.total_difference) < 0
                                      ? "text-red-500"
                                      : "text-blue-500"
                                  }`}
                                >
                                  {n(session.total_difference) > 0 ? "+" : ""}
                                  {n(session.total_difference).toLocaleString("id-ID")}
                                </p>
                              )}
                            </TableCell>

                            <TableCell className="py-3 text-xs text-slate-600">
                              {new Date(session.created_at).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </TableCell>

                            <TableCell className="py-3 text-center">
                              <button
                                onClick={(e) =>
                                  openSessionMenu(e, session.code)
                                }
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                title="Session actions"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>


      {sessionMenu &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className="fixed z-[200] w-[210px] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
            style={{
              top: sessionMenu.top,
              left: sessionMenu.left,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                const code = sessionMenu.code;
                setSessionMenu(null);
                router.push(`/stock-take/progress/${code}`);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
              View Progress
            </button>

            <button
              onClick={() => {
                const code = sessionMenu.code;
                setSessionMenu(null);
                router.push(`/stock-take/${code}`);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Printer className="h-3.5 w-3.5 text-amber-600" />
              View Detail / Print
            </button>

            <div className="my-1 border-t border-slate-100" />

            <button
              onClick={() => {
                const code = sessionMenu.code;
                setSessionMenu(null);
                setSessionActionCode(code);
                setSessionAction("cancel");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <XCircle className="h-3.5 w-3.5 text-orange-600" />
              Cancel Session
            </button>

            <button
              onClick={() => {
                const code = sessionMenu.code;
                setSessionMenu(null);
                setSessionActionCode(code);
                setSessionAction("close");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Lock className="h-3.5 w-3.5 text-slate-600" />
              Close Session
            </button>
          </div>,
          document.body
        )}

      {sessionAction && sessionActionCode && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={
              actionLoading
                ? undefined
                : () => {
                    setSessionAction(null);
                    setSessionActionCode(null);
                  }
            }
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  {sessionAction === "close" ? (
                    <Lock className="h-5 w-5 text-slate-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>

                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {sessionAction === "close"
                      ? "Close Stock Take Session"
                      : "Cancel Stock Take Session"}
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    {sessionAction === "close"
                      ? `Close session ${sessionActionCode}? The session will no longer accept counting updates.`
                      : `Cancel session ${sessionActionCode}? This action will mark the session as cancelled.`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                disabled={actionLoading}
                onClick={() => {
                  setSessionAction(null);
                  setSessionActionCode(null);
                }}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                disabled={actionLoading}
                onClick={runSessionAction}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  sessionAction === "close"
                    ? "bg-slate-800 hover:bg-slate-900"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {actionLoading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {sessionAction === "close"
                  ? "Close Session"
                  : "Cancel Session"}
              </button>
            </div>
          </div>
        </div>
      )}

      {action && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={actionLoading ? undefined : () => setAction(null)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  {action === "complete" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {action === "complete"
                      ? "Complete Cycle Count Batch"
                      : "Cancel Cycle Count Batch"}
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    {action === "complete"
                      ? `Complete ${batch.code}? This permanently marks the batch as completed.`
                      : `Cancel ${batch.code}? All open and in-progress sessions will also be cancelled. Closed sessions will remain closed for history.`}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                disabled={actionLoading}
                onClick={() => setAction(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading || (action === "complete" && !canComplete)}
                onClick={action === "complete" ? completeBatch : cancelBatch}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white ${
                  action === "complete"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                } disabled:opacity-50`}
              >
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {action === "complete" ? "Complete Batch" : "Cancel Batch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
