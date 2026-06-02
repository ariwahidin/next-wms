/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, ColDef } from "ag-grid-community";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Printer,
  Truck,
  CheckCheck,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
  Calendar,
  FileSearch,
  Highlighter,
} from "lucide-react";
import useSWR from "swr";
import {
  ChangeEvent,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";
import router from "next/router";
import { useAlert } from "@/contexts/AlertContext";
import { Badge } from "@/components/ui/badge";
import eventBus from "@/utils/eventBus";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, subDays } from "date-fns";
import { MuatanOrderSPK } from "@/types/order-spk";
import { useAppSelector } from "@/hooks/useAppSelector";
import { usePermission } from "@/hooks/usePermission";

ModuleRegistry.registerModules([AllCommunityModule]);

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = "open" | "loaded";

interface FilterParams {
  startDate: Date;
  endDate: Date;
  search: string;       // search by order_no, transporter, truck, driver
  searchDO: string;     // search by DO No inside SPK → NEW
  statuses: OrderStatus[];
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: OrderStatus; label: string; color: string; dot: string }[] = [
  { value: "open",   label: "Open",   color: "bg-blue-50 border-blue-200 text-blue-700",   dot: "bg-blue-500"  },
  { value: "loaded", label: "Loaded", color: "bg-green-50 border-green-200 text-green-700", dot: "bg-green-500" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (d: Date) => format(d, "yyyy-MM-dd");

const buildUrl = (filters: FilterParams) => {
  const params = new URLSearchParams({
    start_date: fmt(filters.startDate),
    end_date:   fmt(filters.endDate),
  });
  if (filters.search)   params.set("search",    filters.search);
  if (filters.searchDO) params.set("search_do", filters.searchDO);
  if (filters.statuses.length > 0) params.set("statuses", filters.statuses.join(","));
  return `/order/filter?${params.toString()}`;
};

const fetcher = (url: string) =>
  api.get(url, { withCredentials: true }).then((res) => {
    if (res.data.success && res.data.data) {
      return res.data.data.map((item: any, key: number) => ({
        ...item,
        no: key + 1,
        edit: true,
      }));
    }
    return [];
  });

// ─── Outside-component handlers ───────────────────────────────────────────────

const HandleEdit = (item: any) => {
  router.push(`/wms/outbound/order-spk/edit/${item.order_no}`);
};

const HandlePreviewPDF = (item: MuatanOrderSPK) => {
  window.open(`/wms/outbound/order-spk/spk-sheet/${item.order_no}`, "_blank");
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const statusMap: Record<string, { label: string; color: string; dot: string }> = {
    open:   { label: "Open",   color: "bg-blue-50 border-blue-200 text-blue-700",   dot: "bg-blue-500"  },
    loaded: { label: "Loaded", color: "bg-green-50 border-green-200 text-green-700", dot: "bg-green-500" },
  };
  const cfg = statusMap[status?.toLowerCase()] ?? {
    label: status ?? "-",
    color: "bg-gray-50 border-gray-200 text-gray-600",
    dot:   "bg-gray-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─── Date Range Picker ────────────────────────────────────────────────────────

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onStartChange: (d: Date) => void;
  onEndChange: (d: Date) => void;
}

const DateRangePicker = ({ startDate, endDate, onStartChange, onEndChange }: DateRangePickerProps) => {
  const [openStart, setOpenStart] = useState(false);
  const [openEnd,   setOpenEnd]   = useState(false);

  return (
    <div className="flex items-center gap-1.5">
      <Popover open={openStart} onOpenChange={setOpenStart}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition-all hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="tabular-nums font-medium">{format(startDate, "dd MMM yyyy")}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white shadow-xl border border-slate-200" align="start">
          <CalendarComponent
            mode="single"
            selected={startDate}
            onSelect={(d) => { if (d) { onStartChange(d); setOpenStart(false); } }}
            disabled={(d) => d > endDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <span className="text-slate-400 text-xs font-medium">to</span>

      <Popover open={openEnd} onOpenChange={setOpenEnd}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition-all hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="tabular-nums font-medium">{format(endDate, "dd MMM yyyy")}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white shadow-xl border border-slate-200" align="start">
          <CalendarComponent
            mode="single"
            selected={endDate}
            onSelect={(d) => { if (d) { onEndChange(d); setOpenEnd(false); } }}
            disabled={(d) => d < startDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  filters: FilterParams;
  onChange: (f: FilterParams) => void;
  loading: boolean;
  // untuk highlight DO result
  doMatchCount: number | null;
}

const FilterBar = ({ filters, onChange, loading, doMatchCount }: FilterBarProps) => {
  const [localSearch, setLocalSearch] = useState(filters.search);
  const [localDO,     setLocalDO]     = useState(filters.searchDO);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doDebounce     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    clearTimeout(searchDebounce.current!);
    searchDebounce.current = setTimeout(() => {
      onChange({ ...filters, search: val });
    }, 500);
  };

  const handleDOChange = (val: string) => {
    setLocalDO(val);
    clearTimeout(doDebounce.current!);
    doDebounce.current = setTimeout(() => {
      onChange({ ...filters, searchDO: val });
    }, 500);
  };

  const toggleStatus = (status: OrderStatus) => {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onChange({ ...filters, statuses: next });
  };

  const handleReset = () => {
    const reset: FilterParams = {
      startDate: subDays(new Date(), 7),
      endDate:   new Date(),
      search:    "",
      searchDO:  "",
      statuses:  [],
    };
    setLocalSearch("");
    setLocalDO("");
    onChange(reset);
  };

  const isFiltered =
    filters.search !== "" ||
    filters.searchDO !== "" ||
    filters.statuses.length > 0 ||
    fmt(filters.startDate) !== fmt(subDays(new Date(), 7)) ||
    fmt(filters.endDate)   !== fmt(new Date());

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5">
        <SlidersHorizontal className="h-4 w-4 text-slate-500" />
        <span className="text-sm font-semibold text-slate-700 tracking-wide uppercase" style={{ letterSpacing: "0.06em", fontSize: "0.7rem" }}>
          Filter & Search
        </span>
        {isFiltered && (
          <span className="ml-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
            Active
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3 px-4 py-3">

        {/* Date range */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Date Range
          </label>
          <DateRangePicker
            startDate={filters.startDate}
            endDate={filters.endDate}
            onStartChange={(d) => onChange({ ...filters, startDate: d })}
            onEndChange={(d)   => onChange({ ...filters, endDate:   d })}
          />
        </div>

        <div className="hidden h-10 w-px bg-slate-200 sm:block" />

        {/* Status */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Status
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex min-w-[150px] items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-all hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1">
                <span className="text-slate-600">
                  {filters.statuses.length === 0
                    ? <span className="text-slate-400">All statuses</span>
                    : filters.statuses.length === 1
                      ? <span className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_OPTIONS.find(o => o.value === filters.statuses[0])?.dot}`} />
                          <span className="capitalize">{filters.statuses[0]}</span>
                        </span>
                      : <span className="flex items-center gap-1">
                          {filters.statuses.slice(0, 2).map(s => (
                            <span key={s} className={`h-1.5 w-1.5 rounded-full ${STATUS_OPTIONS.find(o => o.value === s)?.dot}`} />
                          ))}
                          <span className="text-slate-600">{filters.statuses.length} selected</span>
                        </span>
                  }
                </span>
                <svg className="h-3.5 w-3.5 text-slate-400 shrink-0" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-1.5 bg-white shadow-xl border border-slate-200" align="start">
              {STATUS_OPTIONS.map((opt) => {
                const active = filters.statuses.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleStatus(opt.value)}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-slate-50"
                  >
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border-2 transition-all
                      ${active ? "border-slate-800 bg-slate-800" : "border-slate-300 bg-white"}`}>
                      {active && (
                        <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5.5L3.5 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className={`h-2 w-2 rounded-full shrink-0 ${opt.dot}`} />
                    <span className="text-slate-700 font-medium">{opt.label}</span>
                  </button>
                );
              })}
              {filters.statuses.length > 0 && (
                <>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, statuses: [] })}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
                  >
                    <X className="h-3 w-3" /> Clear selection
                  </button>
                </>
              )}
            </PopoverContent>
          </Popover>
        </div>

        <div className="hidden h-10 w-px bg-slate-200 sm:block" />

        {/* Search Order (order_no, transporter, truck, driver) */}
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Search Order
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Order No, Transporter, Truck, Driver..."
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm text-slate-700 placeholder-slate-400 transition-all focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
            />
          </div>
        </div>

        {/* ── NEW: Search by DO No ── */}
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <FileSearch className="h-3 w-3" />
            Search by DO No
            {/* <span className="rounded-full bg-slate-800 px-1.5 py-0 text-[9px] font-bold text-white leading-4">
              NEW
            </span> */}
          </label>
          <div className="relative">
            <FileSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-500" />
            <input
              value={localDO}
              onChange={(e) => handleDOChange(e.target.value)}
              placeholder="Search by DO..."
              className={`w-full rounded-md border py-1.5 pl-8 pr-3 text-sm text-slate-700 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1
                ${localDO
                  ? "border-amber-400 bg-amber-50 focus:border-amber-500 focus:ring-amber-400"
                  : "border-slate-200 bg-slate-50 focus:border-slate-900 focus:ring-slate-900"
                }`}
            />
            {/* Result badge — tampil setelah server respond */}
            {localDO && doMatchCount !== null && (
              <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full px-1.5 py-0 text-[10px] font-semibold leading-5
                ${doMatchCount > 0 ? "bg-amber-500 text-white" : "bg-red-100 text-red-600"}`}>
                {doMatchCount > 0 ? `${doMatchCount} SPK` : "Not found"}
              </span>
            )}
          </div>
          {/* Helper text */}
          {localDO && doMatchCount !== null && doMatchCount > 0 && (
            <p className="text-[10px] text-amber-600 font-medium mt-0.5">
              ✓ DO No ini ditemukan di {doMatchCount} SPK — lihat highlight di tabel
            </p>
          )}
        </div>

        {/* Reset */}
        {isFiltered && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-all hover:border-slate-400 hover:text-slate-700"
          >
            <X className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {/* Active filter summary */}
      {isFiltered && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Active:</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {format(filters.startDate, "dd MMM")} – {format(filters.endDate, "dd MMM yyyy")}
          </span>
          {filters.statuses.length > 0 && filters.statuses.map((s) => {
            const opt = STATUS_OPTIONS.find((o) => o.value === s)!;
            return (
              <span key={s} className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${opt.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${opt.dot}`} />
                {opt.label}
              </span>
            );
          })}
          {filters.search && (
            <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white">
              `{filters.search}`
            </span>
          )}
          {filters.searchDO && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-medium text-white">
              <FileSearch className="h-3 w-3" />
              DO: `{filters.searchDO}`
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ─── DO Match Info Banner ─────────────────────────────────────────────────────

/**
 * Banner yang muncul di atas grid saat filter DO aktif,
 * menunjukkan SPK mana saja yang contain DO No tersebut.
 */
const DOMatchBanner = ({
  doNo,
  matchedRows,
}: {
  doNo: string;
  matchedRows: any[];
}) => {
  if (!doNo || matchedRows.length === 0) return null;
  return (
    <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-start gap-2.5">
        <FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-800">
            DO No <span className="font-mono bg-amber-200 rounded px-1">{doNo}</span> ditemukan di {matchedRows.length} SPK:
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {matchedRows.map((row) => (
              <span
                key={row.order_no}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-white px-2.5 py-0.5 text-xs font-semibold text-amber-700 cursor-pointer hover:bg-amber-100 transition-colors"
                onClick={() => HandleEdit(row)}
                title="Click to open SPK"
              >
                {row.order_no}
                {row.transporter_name && (
                  <span className="text-amber-400 font-normal">· {row.transporter_name}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const GRID_COLS = [48, 60, 160, 110, 80, 130, 250, 120, 120, 150, 100, 100, 100, 100, 100, 100];

const GridSkeleton = () => (
  <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
    <div className="flex items-center gap-0 border-b border-slate-200 bg-slate-50 px-3 py-2.5">
      {GRID_COLS.map((w, i) => (
        <div key={i} className="mr-2 h-3 shrink-0 animate-pulse rounded bg-slate-200" style={{ width: w, minWidth: w }} />
      ))}
    </div>
    {Array.from({ length: 10 }).map((_, rowIdx) => (
      <div key={rowIdx} className="flex items-center gap-0 border-b border-slate-100 px-3 py-3 last:border-0" style={{ animationDelay: `${rowIdx * 60}ms` }}>
        {GRID_COLS.map((w, colIdx) => (
          <div
            key={colIdx}
            className="mr-2 shrink-0 animate-pulse rounded bg-slate-100"
            style={{ width: w, minWidth: w, height: colIdx === 3 ? 20 : 12, animationDelay: `${rowIdx * 60 + colIdx * 20}ms` }}
          />
        ))}
      </div>
    ))}
    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2">
      <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-6 w-6 animate-pulse rounded bg-slate-200" />
        ))}
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const OrderTable = () => {
  const { showAlert, notify } = useAlert();
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const userRedux = useAppSelector((state) => state.user);
  const { can } = usePermission();

  // Filter state
  const [filters, setFilters] = useState<FilterParams>({
    startDate: subDays(new Date(), 7),
    endDate:   new Date(),
    search:    "",
    searchDO:  "",
    statuses:  [],
  });

  const swrKey = buildUrl(filters);
  const { data: rowData, error, mutate, isValidating } = useSWR(swrKey, fetcher);

  // Dialog states
  const [isScannedItemDialog, setIsScannedItemDialog]   = useState(false);
  const [scannedItemData,      setScannedItemData]       = useState<any>(null);
  const [tempLocationName,     setTempLocationName]      = useState("");
  const [showTempLocationInput, setShowTempLocationInput] = useState(false);

  const gridRef    = useRef<AgGridReact>(null);
  const gridApiRef = useRef<any>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  // ── Derived: rows that contain the searched DO No ──────────────────────────
  // Backend memfilter baris ini; di sisi frontend kita tinggal highlight semua
  // baris yang ada (karena backend sudah return hanya yang match).
  // doMatchCount = jumlah baris hasil filter saat searchDO aktif.
  const doMatchCount: number | null =
    filters.searchDO && rowData ? rowData.length : null;

  // Baris yang di-highlight (semua hasil saat searchDO aktif)
  const doMatchedRows: any[] = filters.searchDO && rowData ? rowData : [];

  // ── Status update: single ──────────────────────────────────────────────────

  const handleUpdateStatusSingle = useCallback(
    (orderNo: string, newStatus: string) => {
      const label = newStatus === "loaded" ? "Mark as Loaded" : "Reopen";
      showAlert(
        `${label} Confirmation`,
        `Are you sure you want to change the status of order ${orderNo} to "${newStatus}"?`,
        "error",
        async () => {
          try {
            const res = await api.patch(
              "/order/status",
              { order_nos: [orderNo], status: newStatus },
              { withCredentials: true }
            );
            if (res.data.success) {
              eventBus.emit("showAlert", { title: "Success!", description: res.data.message, type: "success" });
              mutate();
            }
          } catch {
            eventBus.emit("showAlert", { title: "Error", description: "Failed to update status", type: "error" });
          }
        }
      );
    },
    [showAlert, mutate]
  );

  // ── Status update: bulk ────────────────────────────────────────────────────

  const handleBulkUpdateStatus = useCallback(
    (newStatus: string) => {
      if (selectedRows.length === 0) {
        notify("Warning", "Please select at least one order first", "error");
        return;
      }
      const orderNos = selectedRows.map((r) => r.order_no);
      const label = newStatus === "loaded" ? "Mark as Loaded" : "Reopen";
      showAlert(
        `${label} - Bulk Action`,
        `Update ${orderNos.length} selected order(s) to "${newStatus}"?`,
        "error",
        async () => {
          try {
            const res = await api.patch(
              "/order/status",
              { order_nos: orderNos, status: newStatus },
              { withCredentials: true }
            );
            if (res.data.success) {
              eventBus.emit("showAlert", { title: "Success!", description: res.data.message, type: "success" });
              mutate();
              gridRef.current?.api?.deselectAll();
              setSelectedRows([]);
            }
          } catch {
            eventBus.emit("showAlert", { title: "Error", description: "Failed to bulk update status", type: "error" });
          }
        }
      );
    },
    [selectedRows, showAlert, notify, mutate]
  );

  // ── Scanned item dialog ────────────────────────────────────────────────────

  const handleOpenSingle = (rowData: any) => {
    try {
      api.post("/outbound/open", { outbound_no: rowData.outbound_no })
        .then((response) => {
          if (response.data.success) {
            setScannedItemData({ outbound_no: rowData.outbound_no, scanned_items: rowData.scanned_items || [] });
            setIsScannedItemDialog(true);
          }
        })
        .catch((error) => console.error("Error open outbound:", error));
    } catch (error) {
      console.error("Error open outbound:", error);
    }
  };

  const handleScannedItemChoice = (choice: string) => {
    if (choice === "temp_location") setShowTempLocationInput(true);
    else if (choice === "return_to_rack") processScannedItems("return_to_rack");
  };

  const processScannedItems = useCallback(
    (action: string, locationName: string | null = null) => {
      const payload = { outbound_no: scannedItemData?.outbound_no, action, temp_location_name: locationName };
      api.post("/outbound/open/process", payload, { withCredentials: true })
        .then((response) => {
          if (response.data.success) {
            notify("Success", response.data.message, "success");
            mutate();
            closeScannedItemDialog();
          } else {
            notify("Error", response.data.message, "error");
          }
        })
        .catch((error) => {
          console.error(error);
          notify("Error", "Terjadi kesalahan saat memproses item", "error");
        });
    },
    [scannedItemData?.outbound_no, notify, mutate]
  );

  const handleTempLocationSubmit = useCallback(() => {
    const currentValue = inputRef.current?.value || tempLocationName;
    if (!currentValue.trim()) { notify("Error", "Temporary location name is required", "error"); return; }
    processScannedItems("temp_location", currentValue.trim());
  }, [processScannedItems, notify, tempLocationName]);

  const closeScannedItemDialog = useCallback(() => {
    setIsScannedItemDialog(false);
    setScannedItemData(null);
    setTempLocationName("");
    setShowTempLocationInput(false);
  }, []);

  const handleBackToChoice = useCallback(() => setShowTempLocationInput(false), []);

  useEffect(() => {
    if (!isScannedItemDialog) document.body.style.removeProperty("pointer-events");
  }, [isScannedItemDialog]);

  useEffect(() => {
    if (!isScannedItemDialog) { setScannedItemData(null); setTempLocationName(""); }
  }, [isScannedItemDialog]);

  // ── Column Defs ────────────────────────────────────────────────────────────

  const [columnDefs] = useState<ColDef[]>([
    {
      headerCheckboxSelection: true,
      checkboxSelection: (params) => params.data?.status !== "loaded",
      maxWidth: 48,
      pinned: "left",
      suppressMovable: true,
      resizable: false,
      headerName: "",
    },
    { field: "no",       headerName: "No.",      maxWidth: 60  },
    { field: "order_no", headerName: "Order No", maxWidth: 160 },
    {
      field: "status",
      headerName: "Status",
      maxWidth: 110,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <StatusBadge status={params.value} />
        </div>
      ),
    },
    {
      headerName: "Actions",
      pinned: "right",
      headerClass: "header-center",
      cellStyle: { textAlign: "center" },
      field: "ID",
      maxWidth: 80,
      cellRenderer: (params: any) => {
        const status = params.data?.status?.toLowerCase();
        return (
          <div className="flex justify-center pt-2" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-gray-100"
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); HandleEdit(params.data); }}>
                  <Pencil className="mr-2 h-4 w-4" /> View / Edit
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); HandlePreviewPDF(params.data); }}>
                  <Printer className="mr-2 h-4 w-4" /> Print SPK
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {status === "open" && (
                  <DropdownMenuItem className="cursor-pointer text-green-600 focus:text-green-700"
                    onClick={(e) => { e.stopPropagation(); handleUpdateStatusSingle(params.data.order_no, "loaded"); }}>
                    <Truck className="mr-2 h-4 w-4" /> Mark as Loaded
                  </DropdownMenuItem>
                )}

                {status === "loaded" && userRedux.roles.some((role) => role.name === "SUPERADMIN") && (
                  <DropdownMenuItem className="cursor-pointer text-blue-600 focus:text-blue-700"
                    onClick={(e) => { e.stopPropagation(); handleUpdateStatusSingle(params.data.order_no, "open"); }}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Reopen
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
    {
      field: "order_date",
      headerName: "Order Date",
      width: 130,
      valueFormatter: (params: any) => {
        if (!params.value) return "";
        return new Date(params.value).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
      },
    },
    { field: "transporter_name", headerName: "Transporter", maxWidth: 250 },
    { field: "truck_no",         headerName: "Truck No",    maxWidth: 120 },
    { field: "driver",           headerName: "Driver",      maxWidth: 120 },
    { field: "order_type",       headerName: "Order Type",  maxWidth: 150 },
    { field: "total_do",   headerName: "Total DO",   maxWidth: 100, cellStyle: { textAlign: "center" } },
    { field: "total_drop", headerName: "Total Drop", maxWidth: 100, cellStyle: { textAlign: "center" } },
    { field: "total_koli", headerName: "Total Koli", maxWidth: 100, cellStyle: { textAlign: "center" } },
    { field: "total_item", headerName: "Total Item", maxWidth: 100, cellStyle: { textAlign: "center" } },
    { field: "total_qty",  headerName: "Total Qty",  maxWidth: 100, cellStyle: { textAlign: "center" } },
    { field: "total_cbm",  headerName: "Total CBM",  maxWidth: 100, cellStyle: { textAlign: "center" } },
  ]);

  // ── Derived booleans ───────────────────────────────────────────────────────
  const isLoading    = !rowData && !error;
  const isRefetching = isValidating && !!rowData;
  const hasSelected  = selectedRows.length > 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  const ScannedItemDialog = () => (
    <Dialog open={isScannedItemDialog} onOpenChange={closeScannedItemDialog}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>This outbound has been picked</DialogTitle>
          <DialogDescription>
            Stock inventory has been picked for outbound number {scannedItemData?.outbound_no}. Select the action to perform:
          </DialogDescription>
        </DialogHeader>
        {!showTempLocationInput ? (
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button onClick={() => handleScannedItemChoice("return_to_rack")} variant="outline" className="w-full" type="button">
              Return to origin location
            </Button>
            <Button onClick={() => handleScannedItemChoice("temp_location")} className="w-full" type="button">
              Move to Temporary Location
            </Button>
          </DialogFooter>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleTempLocationSubmit(); }}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="temp-location">Temporary Location Name</Label>
                <Input ref={inputRef} id="temp-location" placeholder="Enter the name of the temporary location..."
                  defaultValue="" autoComplete="off" autoFocus required />
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={handleBackToChoice} type="button">Back</Button>
                <Button type="submit">Submit</Button>
              </DialogFooter>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          {can("shipment", "create") && (
            <Button className="h-8 bg-green-500 text-slate-950 outline-green-600"
              onClick={() => router.push("/wms/outbound/order-spk/add")}>
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          )}

          <Button className="h-8" variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>

          {/* Bulk action buttons */}
          {hasSelected && (
            <>
              <div className="h-5 w-px bg-gray-300 mx-1" />
              <span className="text-xs text-gray-500 mr-1">{selectedRows.length} selected</span>
              <Button className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                onClick={() => handleBulkUpdateStatus("loaded")}>
                <Truck className="mr-1 h-3.5 w-3.5" /> Mark as Loaded
              </Button>
              <Button variant="outline" className="h-8 text-xs border-blue-400 text-blue-600 hover:bg-blue-50"
                onClick={() => handleBulkUpdateStatus("open")}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reopen
              </Button>
            </>
          )}
        </div>

        {/* Record count */}
        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="text-xs text-slate-400 animate-pulse">Loading...</span>
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {rowData?.length ?? 0} records
              {filters.searchDO && doMatchCount !== null && doMatchCount > 0 && (
                <span className="ml-1.5 text-amber-600">· {doMatchCount} match DO</span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        loading={isLoading}
        doMatchCount={doMatchCount}
      />

      {/* ── DO Match Banner ── */}
      {filters.searchDO && !isLoading && (
        <DOMatchBanner doNo={filters.searchDO} matchedRows={doMatchedRows} />
      )}

      {/* ── Grid ── */}
      <div className="relative">
        {/* Skeleton: first load */}
        {isLoading && <GridSkeleton />}

        {/* Real grid */}
        <div
          className={`relative transition-opacity duration-200 ${isLoading ? "invisible absolute inset-0 h-0 overflow-hidden" : ""}`}
          style={{ width: "100%" }}
        >
          {/* Refetch overlay */}
          {isRefetching && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-white/70 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-8 py-5 shadow-lg">
                <div className="relative h-8 w-8">
                  <div className="absolute inset-0 animate-spin rounded-full border-2 border-slate-200" />
                  <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-slate-800" style={{ animationDuration: "0.7s" }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700">Fetching data...</p>
                  <p className="mt-0.5 text-xs text-slate-400">Applying your filters</p>
                </div>
                <div className="h-0.5 w-32 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-slate-800" style={{ animation: "progressSlide 1.2s ease-in-out infinite" }} />
                </div>
              </div>
            </div>
          )}

          <style>{`
            @keyframes progressSlide {
              0%   { width: 0%;  margin-left: 0%;    }
              50%  { width: 60%; margin-left: 20%;   }
              100% { width: 0%;  margin-left: 100%;  }
            }
            /* Highlight rows saat DO search aktif */
            .do-highlight-row {
              background-color: #fffbeb !important;
              border-left: 3px solid #f59e0b !important;
            }
          `}</style>

          <AgGridReact
            ref={gridRef}
            onGridReady={(params) => { gridApiRef.current = params.api; }}
            rowData={rowData ?? []}
            columnDefs={columnDefs}
            pagination={true}
            paginationPageSize={10}
            paginationPageSizeSelector={[10, 25, 50]}
            domLayout="autoHeight"
            rowSelection="multiple"
            suppressRowClickSelection={true}
            isRowSelectable={(params) => params.data?.status !== "loaded"}
            onSelectionChanged={(e) => setSelectedRows(e.api.getSelectedRows())}
            // Highlight semua baris hasil saat searchDO aktif
            getRowClass={(params) =>
              filters.searchDO ? "do-highlight-row" : ""
            }
            overlayNoRowsTemplate={
              filters.searchDO
                ? `<span style="color:#d97706;font-size:13px">DO No "<b>${filters.searchDO}</b>" tidak ditemukan di SPK manapun.</span>`
                : '<span style="color:#94a3b8;font-size:13px">No order records found for the selected filters.</span>'
            }
          />
        </div>
      </div>

      {/* ── Dialogs ── */}
      <ScannedItemDialog />
    </>
  );
};

export default OrderTable;