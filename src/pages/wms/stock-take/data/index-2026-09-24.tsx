/* app/stock-take/page.tsx */
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format, subDays } from "date-fns";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Hash,
  Layers,
  Loader2,
  MapPin,
  MoreVertical,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  X,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

type BatchStatus = "open" | "in_progress" | "completed" | "cancelled";

type Batch = {
  ID: number;
  id?: number;
  code: string;
  owner_code: string;
  description?: string;
  status: BatchStatus;
  created_at: string;
  updated_at?: string;
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

type FilterParams = {
  startDate: Date;
  endDate: Date;
  search: string;
  statuses: BatchStatus[];
};

const PAGE_SIZE = 20;

const STATUS_OPTIONS: {
  value: BatchStatus;
  label: string;
  color: string;
  dot: string;
}[] = [
  {
    value: "open",
    label: "Open",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    dot: "bg-blue-500",
  },
  {
    value: "in_progress",
    label: "In Progress",
    color: "bg-amber-50 border-amber-200 text-amber-700",
    dot: "bg-amber-500",
  },
  {
    value: "completed",
    label: "Completed",
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    dot: "bg-emerald-500",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    color: "bg-red-50 border-red-200 text-red-700",
    dot: "bg-red-500",
  },
];

const fmt = (d: Date) => format(d, "yyyy-MM-dd");

function statusMeta(status: string) {
  return STATUS_OPTIONS.find((x) => x.value === status?.toLowerCase());
}

function numberValue(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function extractRows(payload: any): Batch[] {
  const rows =
    payload?.data?.data ??
    payload?.data?.batches ??
    payload?.data ??
    [];
  return Array.isArray(rows) ? rows : [];
}

function extractMeta(payload: any) {
  return payload?.meta ?? payload?.data?.meta ?? {};
}

function normalizeBatch(raw: any): Batch {
  return {
    ...raw,
    ID: numberValue(raw?.ID ?? raw?.id),
    id: numberValue(raw?.id ?? raw?.ID),
    code: raw?.code ?? "",
    owner_code: raw?.owner_code ?? "",
    description: raw?.description ?? "",
    status: raw?.status ?? "open",
    created_at: raw?.created_at ?? new Date().toISOString(),
    total_sessions: numberValue(raw?.total_sessions),
    completed_sessions: numberValue(raw?.completed_sessions),
    in_progress_sessions: numberValue(raw?.in_progress_sessions),
    open_sessions: numberValue(raw?.open_sessions),
    cancelled_sessions: numberValue(raw?.cancelled_sessions),
    total_locations: numberValue(raw?.total_locations),
    counted_locations: numberValue(raw?.counted_locations),
    total_system_qty: numberValue(raw?.total_system_qty),
    total_counted_qty: numberValue(raw?.total_counted_qty),
    total_difference: numberValue(raw?.total_difference),
  };
}

function buildListUrl(filters: FilterParams, page: number) {
  const params = new URLSearchParams({
    start_date: fmt(filters.startDate),
    end_date: fmt(filters.endDate),
    page: String(page),
    page_size: String(PAGE_SIZE),
  });

  if (filters.search) params.set("search", filters.search);
  if (filters.statuses.length) {
    params.set("statuses", filters.statuses.join(","));
  }

  return `/stock-take-batches?${params.toString()}`;
}

function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  variant = "default",
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  variant?: "default" | "warning" | "danger";
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  const styles = {
    default: {
      icon: "bg-slate-50 text-slate-700",
      button: "bg-slate-900 hover:bg-slate-800",
    },
    warning: {
      icon: "bg-amber-50 text-amber-700",
      button: "bg-amber-600 hover:bg-amber-700",
    },
    danger: {
      icon: "bg-red-50 text-red-700",
      button: "bg-red-600 hover:bg-red-700",
    },
  }[variant];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={loading ? undefined : onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${styles.icon}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            disabled={loading}
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={onConfirm}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${styles.button}`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}: {
  startDate: Date;
  endDate: Date;
  onStartChange: (d: Date) => void;
  onEndChange: (d: Date) => void;
}) {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  return (
    <div className="flex items-center gap-1.5">
      <Popover open={startOpen} onOpenChange={setStartOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium">{format(startDate, "dd MMM yyyy")}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto bg-white p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={startDate}
            onSelect={(d) => {
              if (d) {
                onStartChange(d);
                setStartOpen(false);
              }
            }}
            disabled={(d) => d > endDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <span className="text-xs font-medium text-slate-400">to</span>

      <Popover open={endOpen} onOpenChange={setEndOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium">{format(endDate, "dd MMM yyyy")}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto bg-white p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={endDate}
            onSelect={(d) => {
              if (d) {
                onEndChange(d);
                setEndOpen(false);
              }
            }}
            disabled={(d) => d < startDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function FilterBar({
  filters,
  onChange,
}: {
  filters: FilterParams;
  onChange: (filters: FilterParams) => void;
}) {
  const [localSearch, setLocalSearch] = useState(filters.search);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  const updateSearch = (value: string) => {
    setLocalSearch(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onChange({ ...filters, search: value });
    }, 400);
  };

  const toggleStatus = (status: BatchStatus) => {
    const statuses = filters.statuses.includes(status)
      ? filters.statuses.filter((x) => x !== status)
      : [...filters.statuses, status];

    onChange({ ...filters, statuses });
  };

  const reset = () => {
    setLocalSearch("");
    onChange({
      startDate: subDays(new Date(), 14),
      endDate: new Date(),
      search: "",
      statuses: [],
    });
  };

  const active =
    filters.search ||
    filters.statuses.length > 0 ||
    fmt(filters.startDate) !== fmt(subDays(new Date(), 14)) ||
    fmt(filters.endDate) !== fmt(new Date());

  return (
    <Card className="mb-5 border-0 bg-white/80 shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5">
        <SlidersHorizontal className="h-4 w-4 text-slate-500" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-600">
          Filter & Search
        </span>
        {active && (
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
            Active
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3 px-4 py-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Date Range
          </label>
          <DateRangePicker
            startDate={filters.startDate}
            endDate={filters.endDate}
            onStartChange={(d) => onChange({ ...filters, startDate: d })}
            onEndChange={(d) => onChange({ ...filters, endDate: d })}
          />
        </div>

        <div className="hidden h-10 w-px bg-slate-200 sm:block" />

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Status
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex min-w-[160px] items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm">
                <span className="text-slate-600">
                  {filters.statuses.length === 0
                    ? "All statuses"
                    : `${filters.statuses.length} selected`}
                </span>
                <ChevronRight className="h-3.5 w-3.5 rotate-90 text-slate-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 bg-white p-1.5" align="start">
              {STATUS_OPTIONS.map((opt) => {
                const checked = filters.statuses.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleStatus(opt.value)}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm hover:bg-slate-50"
                  >
                    <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
                    <span className="flex-1 text-left text-slate-700">{opt.label}</span>
                    {checked && <CheckCircle2 className="h-3.5 w-3.5 text-slate-800" />}
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex min-w-[220px] flex-1 flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Search Batch
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={localSearch}
              onChange={(e) => updateSearch(e.target.value)}
              placeholder="Batch code, customer, description..."
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm text-slate-700 outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        {active && (
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-slate-400 hover:text-slate-700"
          >
            <X className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>
    </Card>
  );
}

function CreateBatchModal({
  open,
  loading,
  onClose,
  onCreated,
}: {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onCreated: (batch: Batch) => void;
}) {
  const [owners, setOwners] = useState<any[]>([]);
  const [ownerCode, setOwnerCode] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setOwnerCode("");
    setDescription("");

    api
      .get("/owners")
      .then((res) => {
        if (res.data?.success) setOwners(res.data.data ?? []);
      })
      .catch((err) => console.error("Failed to load owners", err));
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    if (!ownerCode) return;

    try {
      const res = await api.post(
        "/stock-take-batches",
        {
          owner_code: ownerCode,
          description: description.trim(),
        },
        { withCredentials: true }
      );

      if (!res.data?.success) {
        throw new Error(res.data?.message || "Failed to create batch");
      }

      const raw = res.data?.data?.batch ?? res.data?.data;
      onCreated(normalizeBatch(raw));
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to create batch");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={loading ? undefined : onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">New Cycle Count Batch</h3>
              <p className="mt-0.5 text-sm text-slate-500">
                Create the parent activity before generating sessions.
              </p>
            </div>
            <button onClick={onClose} disabled={loading} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-5 px-6 py-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={ownerCode}
                onChange={(e) => setOwnerCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              >
                <option value="">Select Customer</option>
                {owners.map((owner) => {
                  const code = owner.code ?? owner.Code;
                  const name = owner.name ?? owner.Name;
                  return (
                    <option key={code} value={code}>
                      {name} ({code})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Monthly Stock Opname - September 2026"
                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="rounded-lg bg-slate-50 p-4 text-xs text-slate-500">
              The batch will receive a code such as <b>STB202609070001</b>.
              Sessions generated later will have their own <b>ST...</b> session codes.
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              disabled={loading}
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              disabled={loading || !ownerCode}
              onClick={submit}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Batch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StockTakePage() {
  const router = useRouter();

  const [data, setData] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState<FilterParams>({
    startDate: subDays(new Date(), 14),
    endDate: new Date(),
    search: "",
    statuses: [],
  });

  const [confirm, setConfirm] = useState<{
    type: "cancel" | "complete";
    batch: Batch;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchBatches = async (currentFilters = filters, currentPage = page) => {
    setLoading(currentPage === 1 && data.length === 0);
    setRefetching(currentPage !== 1 || data.length > 0);

    try {
      const res = await api.get(buildListUrl(currentFilters, currentPage), {
        withCredentials: true,
      });

      if (res.data?.success) {
        const rows = extractRows(res.data).map(normalizeBatch);
        const meta = extractMeta(res.data);

        setData(rows);
        setTotalPages(numberValue(meta?.total_pages ?? meta?.totalPages) || 1);
        setTotalCount(numberValue(meta?.total));
      }
    } catch (err) {
      console.error("Failed to fetch stock take batches", err);
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  };

  useEffect(() => {
    fetchBatches(filters, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  const changeFilters = (next: FilterParams) => {
    setPage(1);
    setFilters(next);
  };

  const createBatch = async (batch: Batch) => {
    setCreateLoading(false);
    setIsCreateOpen(false);
    await fetchBatches(filters, 1);
    router.push(`/wms/stock-take/batch/${batch.code}`);
  };

  const cancelBatch = async (batch: Batch) => {
    setConfirmLoading(true);
    try {
      const res = await api.post(
        `/stock-take-batches/${batch.code}/cancel`,
        {},
        { withCredentials: true }
      );
      if (!res.data?.success) throw new Error(res.data?.message || "Failed to cancel batch");
      await fetchBatches(filters, page);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to cancel batch");
    } finally {
      setConfirmLoading(false);
      setConfirm(null);
    }
  };

  const completeBatch = async (batch: Batch) => {
    setConfirmLoading(true);
    try {
      const res = await api.post(
        `/stock-take-batches/${batch.code}/complete`,
        {},
        { withCredentials: true }
      );
      if (!res.data?.success) throw new Error(res.data?.message || "Failed to complete batch");
      await fetchBatches(filters, page);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to complete batch");
    } finally {
      setConfirmLoading(false);
      setConfirm(null);
    }
  };

  const batchProgress = (batch: Batch) => {
    const planned = numberValue(batch.total_locations);
    const counted = numberValue(batch.counted_locations);
    if (planned <= 0) return 0;
    return Math.min(100, Math.round((counted / planned) * 1000) / 10);
  };

  return (
    <Layout title="Cycle Count" subTitle="Cycle Count Activity" className="w-full">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900">
                  <Layers className="h-3.5 w-3.5 text-white" />
                </div>
                <h1 className="text-lg font-semibold text-slate-900">Cycle Count Batches</h1>
              </div>
              <p className="text-xs text-slate-600">
                Manage stock count activities and their sessions
              </p>
            </div>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              New Cycle Count Batch
            </button>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
              {
                label: "Total Batches",
                value: data.length,
                icon: Layers,
              },
              {
                label: "Open",
                value: data.filter((x) => x.status === "open").length,
                icon: Clock3,
              },
              {
                label: "In Progress",
                value: data.filter((x) => x.status === "in_progress").length,
                icon: Loader2,
              },
              {
                label: "Completed",
                value: data.filter((x) => x.status === "completed").length,
                icon: CheckCircle2,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label} className="border-0 bg-white/80 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-500">{item.label}</p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">{item.value}</p>
                      </div>
                      <Icon className="h-5 w-5 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <FilterBar filters={filters} onChange={changeFilters} />

          <Card className="relative overflow-hidden border-0 bg-white/80 shadow-sm">
            {refetching && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching data...
                </div>
              </div>
            )}

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 bg-slate-50/70">
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600">#</TableHead>
                      <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-600">Batch</TableHead>
                      <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-600">Customer</TableHead>
                      <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-600">Sessions</TableHead>
                      <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-600">Location Progress</TableHead>
                      <TableHead className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Qty</TableHead>
                      <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-600">Status</TableHead>
                      <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-600">Created</TableHead>
                      <TableHead className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="py-14">
                          <div className="flex flex-col items-center">
                            <Loader2 className="mb-2 h-6 w-6 animate-spin text-slate-400" />
                            <p className="text-sm font-medium text-slate-500">Loading batches...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="py-14">
                          <div className="flex flex-col items-center text-center">
                            <Layers className="mb-3 h-10 w-10 text-slate-300" />
                            <p className="text-sm font-medium text-slate-600">No cycle count batches found</p>
                            <p className="mt-1 text-xs text-slate-400">Create a new batch or adjust your filters.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.map((batch, index) => {
                        const meta = statusMeta(batch.status);
                        const progress = batchProgress(batch);
                        const sessions = numberValue(batch.total_sessions);
                        const completedSessions = numberValue(batch.completed_sessions);

                        return (
                          <TableRow
                            key={batch.ID || batch.code}
                            className="group border-b border-slate-50 hover:bg-slate-50/80"
                          >
                            <TableCell className="px-4 py-3 text-xs font-medium text-slate-400">
                              {String((page - 1) * PAGE_SIZE + index + 1).padStart(2, "0")}
                            </TableCell>

                            <TableCell
                              className="cursor-pointer py-3"
                              onClick={() => router.push(`/wms/stock-take/batch/${batch.code}`)}
                            >
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100">
                                  <Layers className="h-3.5 w-3.5 text-slate-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-slate-900">{batch.code}</div>
                                  {batch.description && (
                                    <div className="max-w-[220px] truncate text-[11px] text-slate-400">
                                      {batch.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="py-3">
                              <div className="flex items-center gap-2 text-sm text-slate-700">
                                <Package className="h-3.5 w-3.5 text-slate-400" />
                                {batch.owner_code || "-"}
                              </div>
                            </TableCell>

                            <TableCell className="py-3">
                              <div className="text-sm font-semibold text-slate-800">
                                {completedSessions} / {sessions}
                              </div>
                              <div className="text-[11px] text-slate-400">closed / total</div>
                            </TableCell>

                            <TableCell className="min-w-[180px] py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      progress >= 100
                                        ? "bg-emerald-500"
                                        : progress >= 50
                                          ? "bg-amber-500"
                                          : "bg-slate-400"
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="w-10 text-right text-xs font-medium text-slate-600">
                                  {progress}%
                                </span>
                              </div>
                              <div className="mt-1 text-[11px] text-slate-400">
                                {numberValue(batch.counted_locations).toLocaleString("id-ID")} /{" "}
                                {numberValue(batch.total_locations).toLocaleString("id-ID")} locations
                              </div>
                            </TableCell>

                            <TableCell className="py-3 text-right">
                              <div className="text-sm font-semibold text-slate-800">
                                {numberValue(batch.total_counted_qty).toLocaleString("id-ID")}
                                <span className="font-normal text-slate-400">
                                  {" / "}
                                  {numberValue(batch.total_system_qty).toLocaleString("id-ID")}
                                </span>
                              </div>
                              {numberValue(batch.total_difference) !== 0 && (
                                <div
                                  className={`text-[11px] font-medium ${
                                    numberValue(batch.total_difference) < 0
                                      ? "text-red-500"
                                      : "text-blue-500"
                                  }`}
                                >
                                  {numberValue(batch.total_difference) > 0 ? "+" : ""}
                                  {numberValue(batch.total_difference).toLocaleString("id-ID")}
                                </div>
                              )}
                            </TableCell>

                            <TableCell className="py-3">
                              {meta ? (
                                <Badge className={`${meta.color} border px-2 py-0.5 text-xs font-medium`}>
                                  {meta.label}
                                </Badge>
                              ) : (
                                <Badge>{batch.status}</Badge>
                              )}
                            </TableCell>

                            <TableCell className="py-3">
                              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                {format(new Date(batch.created_at), "dd MMM yyyy")}
                              </div>
                              <div className="pl-4.5 text-[11px] text-slate-400">
                                {format(new Date(batch.created_at), "HH:mm")}
                              </div>
                            </TableCell>

                            <TableCell className="py-3 text-center">
                              <div className="flex justify-center">
                                <button
                                  title="Open batch"
                                  onClick={() => router.push(`/wms/stock-take/batch/${batch.code}`)}
                                  className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                >
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </button>
                              </div>
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

          {!loading && data.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of{" "}
                {totalCount} batches
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateBatchModal
        open={isCreateOpen}
        loading={createLoading}
        onClose={() => {
          if (!createLoading) setIsCreateOpen(false);
        }}
        onCreated={createBatch}
      />

      <ConfirmModal
        open={!!confirm}
        loading={confirmLoading}
        title={
          confirm?.type === "complete"
            ? "Complete Cycle Count Batch"
            : "Cancel Cycle Count Batch"
        }
        description={
          confirm?.type === "complete"
            ? `Complete batch ${confirm?.batch.code}? The batch must have no open or in-progress sessions.`
            : `Cancel batch ${confirm?.batch.code}? Existing session records will remain as historical records.`
        }
        confirmLabel={confirm?.type === "complete" ? "Complete Batch" : "Cancel Batch"}
        variant={confirm?.type === "complete" ? "default" : "warning"}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.type === "complete") completeBatch(confirm.batch);
          else cancelBatch(confirm.batch);
        }}
      />
    </Layout>
  );
}
