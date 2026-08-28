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
  CheckCheck,
  Package,
  Blocks,
  X,
  Copy,
  RefreshCcw,
  Upload,
  ShoppingCart,
  Truck,
  Search,
  Calendar,
  SlidersHorizontal,
  Package2,
  Tag,
} from "lucide-react";
import useSWR from "swr";
import {
  ChangeEvent,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";
import styles from "./OutboundTable.module.css";
import router, { useRouter } from "next/router";
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
import SyncEcommerceModal from "@/components/outbound/SyncEcommerceModal";
import ArrangeShipmentModal from "@/components/outbound/ArrangeShipmentModal.patch";
import { usePermission } from "@/hooks/usePermission";
import Select from "react-select";

ModuleRegistry.registerModules([AllCommunityModule]);

// ─── Types ───────────────────────────────────────────────────────────────────

type OutboundStatus = "open" | "picking" | "packing" | "packed" | "complete" | "cancel";

interface ItemOptions {
  value: string;
  label: string;
}

interface FilterParams {
  startDate: Date;
  endDate: Date;
  search: string;
  searchItem: string;
  statuses: OutboundStatus[];
  orderTypes: string[];
  owner: string;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: OutboundStatus; label: string; color: string; dot: string }[] = [
  { value: "open", label: "Open", color: "bg-blue-50 border-blue-200 text-blue-700", dot: "bg-blue-500" },
  { value: "picking", label: "Picking", color: "bg-yellow-50 border-yellow-200 text-yellow-700", dot: "bg-yellow-500" },
  { value: "packing", label: "Packing", color: "bg-orange-50 border-orange-200 text-orange-700", dot: "bg-orange-500" },
  { value: "packed", label: "Packed", color: "bg-purple-50 border-purple-200 text-purple-700", dot: "bg-purple-500" },
  { value: "complete", label: "Completed", color: "bg-green-50 border-green-200 text-green-700", dot: "bg-green-500" },
  { value: "cancel", label: "Cancel", color: "bg-red-50 border-red-200 text-red-700", dot: "bg-red-500" },
];

// ─── Order Type config ────────────────────────────────────────────────────────

const ORDERTYPE_OPTIONS: ItemOptions[] = [
  { value: "B2B - Consignment", label: "B2B - Consignment" },
  { value: "B2B - Normal", label: "B2B - Normal" },
  { value: "B2C - Marketplace", label: "B2C - Marketplace" },
  { value: "ADJUSTMENT", label: "Adjustment" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (d: Date) => format(d, "yyyy-MM-dd");

const buildUrl = (filters: FilterParams) => {
  const params = new URLSearchParams({
    start_date: fmt(filters.startDate),
    end_date: fmt(filters.endDate),
  });
  if (filters.search) params.set("search", filters.search);
  if (filters.searchItem) params.set("search_item", filters.searchItem);
  if (filters.statuses.length > 0) params.set("statuses", filters.statuses.join(","));
  if (filters.orderTypes.length > 0) params.set("order_types", filters.orderTypes.join(","));
  if (filters.owner) params.set("owners", filters.owner); // ← tambahan
  return `/outbound/filter?${params.toString()}`;
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

// ─── Outside-component handlers (tidak perlu state) ──────────────────────────

const ownersFetcher = (url: string) =>
  api.get(url, { withCredentials: true }).then((res) => {
    if (res.data.success && res.data.data) {
      return res.data.data.map((o: any) => ({
        value: o.code,
        label: `${o.code} - ${o.description}`,
      }));
    }
    return [];
  });

const HandleCopy = (item: any) => {
  router.push(`/wms/outbound/copy/${item.outbound_no}`);
};

const HandleDelete = (id: number) => {
  try {
    api.delete(`/outbound/${id}`, { withCredentials: true });
  } catch (error) {
    console.error("Gagal menghapus produk:", error);
  }
};

const HandlePreviewPDF = (id: number) => {
  window.open(`/wms/outbound/picking-sheet/${id}`, "_blank");
};

const HandlePrintSerial = (outbound_no: string) => {
  const printWindow = window.open(`/wms/outbound/sn-sheet/${outbound_no}`, "_blank");
  if (printWindow) {
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 1000);
  }
};

const HandlePrintWaranty = (outbound_no: string) => {
  window.open(`/wms/outbound/waranty/${outbound_no}`, "_blank");
};

// ─── Date Range Picker ───────────────────────────────────────────────────────

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onStartChange: (d: Date) => void;
  onEndChange: (d: Date) => void;
}

const DateRangePicker = ({ startDate, endDate, onStartChange, onEndChange }: DateRangePickerProps) => {
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);

  return (
    <div className="flex items-center gap-1.5">
      {/* Start date */}
      <Popover open={openStart} onOpenChange={setOpenStart}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:shadow focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1">
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

      {/* End date */}
      <Popover open={openEnd} onOpenChange={setOpenEnd}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:shadow focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1">
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

// ─── Filter Bar ──────────────────────────────────────────────────────────────

interface FilterBarProps {
  filters: FilterParams;
  onChange: (f: FilterParams) => void;
  onApply: () => void;
  loading: boolean;
}

const FilterBar = ({ filters, onChange, onApply, loading }: FilterBarProps) => {
  const [localSearch, setLocalSearch] = useState(filters.search);
  const [localItem, setLocalItem] = useState(filters.searchItem);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: ownerOptions, isLoading: ownersLoading } = useSWR("/owners", ownersFetcher);

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      onChange({ ...filters, search: val });
    }, 500);
  };

  const handleItemChange = (val: string) => {
    setLocalItem(val);
    clearTimeout(itemDebounce.current);
    itemDebounce.current = setTimeout(() => {
      onChange({ ...filters, searchItem: val });
    }, 500);
  };

  const toggleStatus = (status: OutboundStatus) => {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onChange({ ...filters, statuses: next });
  };

  const toggleOrderType = (orderType: string) => {
    const next = filters.orderTypes.includes(orderType)
      ? filters.orderTypes.filter((s) => s !== orderType)
      : [...filters.orderTypes, orderType];
    onChange({ ...filters, orderTypes: next });
  };

  const handleReset = () => {
    const reset: FilterParams = {
      startDate: subDays(new Date(), 7),
      endDate: new Date(),
      search: "",
      searchItem: "",
      statuses: [],
      orderTypes: [],
      owner: "", // ← tambahan
    };
    setLocalSearch("");
    setLocalItem("");
    onChange(reset);
  };

  const isFiltered =
    filters.search !== "" ||
    filters.searchItem !== "" ||
    filters.statuses.length > 0 ||
    filters.orderTypes.length > 0 ||
    filters.owner !== "" || // ← tambahan
    fmt(filters.startDate) !== fmt(subDays(new Date(), 7)) ||
    fmt(filters.endDate) !== fmt(new Date());

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header bar */}
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

      {/* Filter controls */}
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
            onEndChange={(d) => onChange({ ...filters, endDate: d })}
          />
        </div>

        {/* Divider */}
        <div className="hidden h-10 w-px bg-slate-200 sm:block" />

        {/* Status multi-select dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Status
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex min-w-[160px] items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-all hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1">
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
            <PopoverContent className="w-48 p-1.5 bg-white shadow-xl border border-slate-200" align="start">
              {STATUS_OPTIONS.map((opt) => {
                const active = filters.statuses.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleStatus(opt.value)}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-slate-50"
                  >
                    {/* Checkbox */}
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

        {/* Divider */}
        <div className="hidden h-10 w-px bg-slate-200 sm:block" />

        {/* Order Type multi-select dropdown — NEW */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Order Type
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex min-w-[170px] items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-all hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1">
                <span className="text-slate-600 truncate">
                  {filters.orderTypes.length === 0
                    ? <span className="text-slate-400">All order types</span>
                    : filters.orderTypes.length === 1
                      ? <span className="truncate">{filters.orderTypes[0]}</span>
                      : <span className="text-slate-600">{filters.orderTypes.length} selected</span>
                  }
                </span>
                <svg className="h-3.5 w-3.5 text-slate-400 shrink-0" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-1.5 bg-white shadow-xl border border-slate-200" align="start">
              {ORDERTYPE_OPTIONS.map((opt) => {
                const active = filters.orderTypes.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleOrderType(opt.value)}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-slate-50"
                  >
                    {/* Checkbox */}
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border-2 transition-all
                      ${active ? "border-slate-800 bg-slate-800" : "border-slate-300 bg-white"}`}>
                      {active && (
                        <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5.5L3.5 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <Tag className="h-3 w-3 shrink-0 text-slate-400" />
                    <span className="text-slate-700 font-medium truncate">{opt.label}</span>
                  </button>
                );
              })}
              {filters.orderTypes.length > 0 && (
                <>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, orderTypes: [] })}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
                  >
                    <X className="h-3 w-3" /> Clear selection
                  </button>
                </>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Divider */}
        <div className="hidden h-10 w-px bg-slate-200 sm:block" />

        {/* Owner filter — NEW */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Owner
          </label>
          <Select
            isClearable
            placeholder="All owners"
            className="w-48 text-sm"
            classNamePrefix="rs"
            options={ownerOptions ?? []}
            isLoading={ownersLoading}
            value={ownerOptions?.find((o: any) => o.value === filters.owner) ?? null}
            onChange={(selected) =>
              onChange({ ...filters, owner: selected ? selected.value : "" })
            }
            styles={{
              control: (base) => ({
                ...base,
                minHeight: 34,
                borderColor: "#e2e8f0",
                boxShadow: "none",
                "&:hover": { borderColor: "#94a3b8" },
              }),
              menu: (base) => ({ ...base, zIndex: 50 }),
            }}
          />
        </div>

        {/* Divider */}
        <div className="hidden h-10 w-px bg-slate-200 sm:block" />

        {/* Header search */}
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Search Order
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Outbound No, Customer, DO No, SPK..."
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm text-slate-700 placeholder-slate-400 transition-all focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
            />
          </div>
        </div>

        {/* Item search */}
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Search Item in Order
          </label>
          <div className="relative">
            <Package2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={localItem}
              onChange={(e) => handleItemChange(e.target.value)}
              placeholder="Item Code, Barcode, Item Name..."
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm text-slate-700 placeholder-slate-400 transition-all focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
            />
          </div>
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
          {filters.orderTypes.length > 0 && filters.orderTypes.map((ot) => (
            <span key={ot} className="flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
              <Tag className="h-3 w-3" />
              {ot}
            </span>
          ))}
          {filters.owner && (
            <span className="flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
              Owner: {filters.owner}
            </span>
          )}
          {filters.search && (
            <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white">
              `{filters.search}`
            </span>
          )}
          {filters.searchItem && (
            <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-white">
              Item: `{filters.searchItem}`
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const OutboundTable = () => {
  const { showAlert, notify } = useAlert();
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  // Filter state — default 7 hari ke belakang, semua status
  const [filters, setFilters] = useState<FilterParams>({
    startDate: subDays(new Date(), 7),
    endDate: new Date(),
    search: "",
    searchItem: "",
    statuses: [],
    orderTypes: [],
    owner: "", // ← tambahan
  });

  // SWR dengan URL yang berubah sesuai filter
  const swrKey = buildUrl(filters);
  const { data: rowData, error, mutate, isValidating } = useSWR(swrKey, fetcher);

  // Dialog states
  const [isScannedItemDialog, setIsScannedItemDialog] = useState(false);
  const [scannedItemData, setScannedItemData] = useState<any>(null);
  const [tempLocationName, setTempLocationName] = useState("");
  const [showTempLocationInput, setShowTempLocationInput] = useState(false);
  const [changeStatus, setChangeStatus] = useState("open");
  const [isSubmit, setIsSubmit] = useState(false);
  const [openImportModal, setOpenImportModal] = useState(false);

  const isSubmittingRef = useRef(false);
  const gridRef = useRef<AgGridReact>(null);
  const currentPageRef = useRef<number>(0);
  const isRestoringRef = useRef<boolean>(false);
  const gridApiRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [arrangeModalOpen, setArrangeModalOpen] = useState(false);
  const [arrangeOrderSN, setArrangeOrderSN] = useState("");
  const [arrangeOutboundNo, setArrangeOutboundNo] = useState("");
  const { can } = usePermission();

  const HandleEdit = (item: any) => {
    router.push(`/wms/outbound/edit/${item.outbound_no}`);
    localStorage.setItem("outbound_page", currentPageRef.current.toString());
  };

  useEffect(() => {
    if (!rowData) return;
    const savedPage = parseInt(localStorage.getItem("outbound_page") || "0");
    if (savedPage === 0) return;
    const tryRestore = () => {
      if (gridApiRef.current) {
        gridApiRef.current.paginationGoToPage(savedPage);
        localStorage.removeItem("outbound_page");
      } else {
        setTimeout(tryRestore, 100);
      }
    };
    setTimeout(tryRestore, 200);
  }, [rowData]);

  const HandlePicking = (id: number) => {
    if (isSubmittingRef.current) return;
    showAlert(
      "Picking Confirmation",
      "The picking process is carried out by the system, are you sure to continue?",
      "error",
      async () => {
        eventBus.emit("loading", true);
        isSubmittingRef.current = true;
        try {
          const res = await api.post(
            `/outbound/picking/${id}`,
            { inbound_id: id },
            { withCredentials: true }
          );
          if (res.data.success) {
            eventBus.emit("showAlert", { title: "Success!", description: res.data.message, type: "success" });
            mutate();
          }
        } catch (error) {
          console.error("Error saving inbound:", error);
        } finally {
          setTimeout(() => { eventBus.emit("loading", false); isSubmittingRef.current = false; }, 1500);
        }
      }
    );
  };

  const HandlePackingWithoutScan = (id: number) => {
    showAlert(
      "Packing Confirmation",
      "The packing process is carried out by the system, are you sure to continue?",
      "error",
      async () => {
        eventBus.emit("loading", true);
        isSubmittingRef.current = true;
        try {
          const res = await api.post(
            `/outbound/packing-all/${id}`,
            {},
            { withCredentials: true }
          );
          if (res.data.success) {
            eventBus.emit("showAlert", { title: "Success!", description: res.data.message, type: "success" });
            mutate();
          }
        } catch (error) {
          console.error("Error saving inbound:", error);
        } finally {
          setTimeout(() => { eventBus.emit("loading", false); isSubmittingRef.current = false; }, 1500);
        }
      }
    )
  }

  const HandlePickingComplete = (id: number) => {
    showAlert("Complete Confirmation", "Are you sure you want to save this data?", "error", () => {
      eventBus.emit("loading", true);
      api.post(`/outbound/picking/complete/${id}`, { outbound_id: id }, { withCredentials: true })
        .then((res) => {
          eventBus.emit("loading", false);
          if (res.data.success) {
            eventBus.emit("showAlert", { title: "Success!", description: res.data.message, type: "success" });
            mutate();
          }
        })
        .catch((error) => { eventBus.emit("loading", false); console.error(error); });
    });
  };

  const handleOpenSingle = (rowData: any, status: string) => {
    setChangeStatus(status);
    try {
      eventBus.emit("loading", true);
      api.post("/outbound/open", { outbound_no: rowData.outbound_no, status })
        .then((response) => {
          eventBus.emit("loading", false);
          if (response.data.success) {
            setScannedItemData({ outbound_no: rowData.outbound_no, scanned_items: rowData.scanned_items || [] });
            setIsScannedItemDialog(true);
          }
        })
        .catch((error) => { console.error("Error open outbound:", error); });
    } catch (error) {
      eventBus.emit("loading", false);
    }
  };

  const handleScannedItemChoice = (choice: string) => {
    if (choice === "temp_location") setShowTempLocationInput(true);
    else if (choice === "return_to_rack") processScannedItems("return_to_rack");
  };

  const processScannedItems = useCallback(
    (action: string, locationName: string | null = null) => {
      const payload = { outbound_no: scannedItemData?.outbound_no, action, temp_location_name: locationName, status: changeStatus };
      eventBus.emit("loading", true);
      setIsSubmit(true);
      api.post("/outbound/open/process", payload, { withCredentials: true })
        .then((response) => {
          eventBus.emit("loading", false);
          if (response.data.success) {
            notify("Success", response.data.message, "success");
            mutate();
            closeScannedItemDialog();
          }
        })
        .catch((error) => { eventBus.emit("loading", false); setIsSubmit(false); console.error(error); })
        .then(() => { eventBus.emit("loading", false); setIsSubmit(false); });
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

  const HandlePrintShopeeLabel = async (orderSN: string, outboundNo: string) => {
    if (!orderSN) { notify("Error", "Order SN tidak ditemukan untuk outbound ini", "error"); return; }
    try {
      eventBus.emit("loading", true);
      const res = await api.get(`/outbound/shopee/label/${orderSN}`, { withCredentials: true, responseType: "blob" });
      const contentType = res.headers["content-type"] || "";
      if (contentType.includes("application/json")) {
        const text = await res.data.text();
        const json = JSON.parse(text);
        notify("Error", json.message || "Gagal mendapat label", "error");
        return;
      }
      const blob = new Blob([res.data], { type: "application/pdf" });
      window.open(URL.createObjectURL(blob), "_blank");
    } catch (err: any) {
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try { const json = JSON.parse(text); notify("Error", json.message || "Gagal membuka label Shopee", "error"); }
        catch { notify("Error", "Gagal membuka label Shopee", "error"); }
      } else { notify("Error", "Gagal membuka label Shopee", "error"); }
    } finally { eventBus.emit("loading", false); }
  };

  const HandleArrangeShipment = (orderSN: string, outboundNo: string) => {
    setArrangeOrderSN(orderSN);
    setArrangeOutboundNo(outboundNo);
    setArrangeModalOpen(true);
  };

  useEffect(() => {
    if (!isScannedItemDialog) document.body.style.removeProperty("pointer-events");
  }, [isScannedItemDialog]);

  useEffect(() => {
    if (!isScannedItemDialog) { setScannedItemData(null); setTempLocationName(""); }
  }, [isScannedItemDialog]);

  const ScannedItemDialog = () => (
    <Dialog open={isScannedItemDialog} onOpenChange={closeScannedItemDialog}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Confirm to {changeStatus} this transaction</DialogTitle>
          <DialogDescription>
            Stock inventory has been picked for outbound number {scannedItemData?.outbound_no}. Select the action to perform:
          </DialogDescription>
        </DialogHeader>
        {!showTempLocationInput ? (
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button disabled={isSubmit} onClick={() => handleScannedItemChoice("return_to_rack")} variant="outline" className="w-full" type="button">
              Return to origin location
            </Button>
            <Button disabled={isSubmit} onClick={() => handleScannedItemChoice("temp_location")} className="w-full" type="button">
              Move to Temporary Location
            </Button>
          </DialogFooter>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleTempLocationSubmit(); }}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="temp-location">Temporary Location Name</Label>
                <Input ref={inputRef} id="temp-location" placeholder="Enter the name of the temporary location..." defaultValue="" autoComplete="off" autoFocus required />
              </div>
              <DialogFooter className="gap-2">
                <Button disabled={isSubmit} variant="outline" onClick={handleBackToChoice} type="button">Back</Button>
                <Button disabled={isSubmit} type="submit">Submit</Button>
              </DialogFooter>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );

  const [columnDefs] = useState<ColDef[]>([
    { field: "no", headerName: "No.", maxWidth: 70 },
    { field: "owner_code", headerName: "Owner", maxWidth: 100 },
    { field: "outbound_no", headerName: "Picking No", maxWidth: 140 },
    {
      headerName: "Actions",
      pinned: "right",
      headerClass: "header-center",
      cellStyle: { textAlign: "center" },
      field: "ID",
      maxWidth: 80,
      cellRenderer: (params: any) => (
        <div className="flex justify-center pt-2" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); HandleEdit(params.data); }}>
                <Pencil className="mr-2 h-4 w-4" /> View / Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); HandleCopy(params.data); }}>
                <Copy className="mr-2 h-4 w-4" /> Copy
              </DropdownMenuItem>

              {params.data.status === "open" && (
                <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); HandlePicking(params.data.ID); }}>
                  <Blocks className="mr-2 h-4 w-4" /> Picking
                </DropdownMenuItem>
              )}

              {!params.data.require_packing_scan && params.data.status != "packed" && params.data.status != "complete" && (
                <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); HandlePackingWithoutScan(params.data.ID); }}>
                  <CheckCheck className="mr-2 h-4 w-4" /> Confirm Packing Without Scan
                </DropdownMenuItem>
              )}

              {(params.data.status === "packing" || params.data.status === "packed") && (
                <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); HandlePickingComplete(params.data.ID); }}>
                  <CheckCheck className="mr-2 h-4 w-4" /> Complete
                </DropdownMenuItem>
              )}

              {/* {(params.data.status === "packing" || params.data.status === "packed") && (
                <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); HandlePickingComplete(params.data.ID); }}>
                  <CheckCheck className="mr-2 h-4 w-4" /> Complete
                </DropdownMenuItem>
              )} */}

              {params.data.status !== "open" && params.data.status !== "cancel" && (
                <>
                  <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); HandlePreviewPDF(params.data.ID); }}>
                    <Printer className="mr-2 h-4 w-4" /> Print Picking Sheet
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); HandlePrintSerial(params.data.outbound_no); }}>
                    <Printer className="mr-2 h-4 w-4" /> Print Serial Number
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); HandlePrintWaranty(params.data.outbound_no); }}>
                    <Printer className="mr-2 h-4 w-4" /> Print Label Waranty
                  </DropdownMenuItem>
                </>
              )}

              {params.data.status !== "open" && params.data.status !== "cancel" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleOpenSingle(params.data, "open"); }}>
                    <RefreshCcw className="mr-2 h-4 w-4" /> Change to Open
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleOpenSingle(params.data, "cancel"); }}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {params.data.source === "SHOPEE" && params.data.status !== "cancel" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-orange-600" onClick={(e) => { e.stopPropagation(); HandleArrangeShipment(params.data.shipment_id, params.data.outbound_no); }}>
                    <Truck className="mr-2 h-4 w-4" /> Arrange Shipment
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer text-orange-600" onClick={(e) => { e.stopPropagation(); HandlePrintShopeeLabel(params.data.shipment_id, params.data.outbound_no); }}>
                    <Printer className="mr-2 h-4 w-4" /> Print Shopee Label
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
    {
      field: "outbound_date",
      headerName: "Date",
      width: 140,
      valueFormatter: (params: any) => {
        if (!params.value) return "";
        const date = new Date(params.value);
        return date.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
      },
    },
    { field: "shipment_id", headerName: "DO No.", width: 150 },
    { field: "order_type", headerName: "Order Type", width: 150 },
    { field: "order_no", headerName: "SPK No.", width: 150 },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      cellRenderer: (params: any) => {
        if (!params.value) return null;
        let color = "bg-gray-500";
        switch (params.value.toLowerCase()) {
          case "open": color = "bg-blue-500 text-white"; break;
          case "picking": color = "bg-yellow-500 text-black"; break;
          case "packing": color = "bg-orange-500 text-white"; break;
          case "packed": color = "bg-purple-500 text-white"; break;
          case "complete": color = "bg-green-500"; break;
          case "cancel": color = "bg-red-500"; break;
        }
        return <Badge className={`${color} capitalize`}>{params.value}</Badge>;
      },
    },
    { field: "customer_name", headerName: "Customer", width: 320 },
    { field: "total_item", headerName: "Total Item", width: 100 },
    { field: "qty_req", headerName: "Qty Req", width: 100 },
    { field: "qty_plan", headerName: "Qty Pick", width: 100 },
    { field: "qty_pack", headerName: "Qty Pack", width: 100 },
  ]);

  // isLoading = first load; isRefetching = filter change / refresh saat data sudah ada
  const isLoading = !rowData && !error;
  const isRefetching = isValidating && !!rowData;

  return (
    <>
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Button className="h-8" onClick={() => router.push("/wms/outbound/add")}>
            <Plus className="mr-1 w-4" /> Add
          </Button>
          <Button
            className="h-8 bg-green-500 text-slate-950"
            onClick={() => setOpenImportModal(true)}
          >
            <Upload className="mr-2 w-4" /> Import Excel
          </Button>
          <Button
            className="h-8"
            variant="outline"
            onClick={() => mutate()}
          >
            🔄 Refresh
          </Button>
          {can("outbound_sync_ecom", "create") && (
            <Button
              className="h-8 bg-green-500 text-slate-950"
              variant="outline"
              onClick={() => setSyncModalOpen(true)}
            >
              🔄 Sync E-Commerce
            </Button>
          )}
        </div>

        {/* Result count */}
        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="text-xs text-slate-400 animate-pulse">Loading...</span>
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {rowData?.length ?? 0} records
            </span>
          )}
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        onApply={() => mutate()}
        loading={isLoading}
      />

      {/* ── Grid ── */}
      <div className="relative">
        {/* ── Skeleton: first load (no data yet) ── */}
        {isLoading && (
          <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
            {/* Fake header */}
            <div className="flex items-center gap-0 border-b border-slate-200 bg-slate-50 px-3 py-2.5">
              {[70, 140, 80, 140, 150, 150, 150, 120, 320, 100, 100, 100, 100].map((w, i) => (
                <div
                  key={i}
                  className="mr-2 h-3 shrink-0 animate-pulse rounded bg-slate-200"
                  style={{ width: w, minWidth: w }}
                />
              ))}
            </div>
            {/* Fake rows */}
            {Array.from({ length: 10 }).map((_, rowIdx) => (
              <div
                key={rowIdx}
                className="flex items-center gap-0 border-b border-slate-100 px-3 py-3 last:border-0"
                style={{ animationDelay: `${rowIdx * 60}ms` }}
              >
                {[70, 140, 80, 140, 150, 150, 150, 120, 320, 100, 100, 100, 100].map((w, colIdx) => (
                  <div
                    key={colIdx}
                    className="mr-2 shrink-0 animate-pulse rounded bg-slate-100"
                    style={{
                      width: w,
                      minWidth: w,
                      height: colIdx === 7 ? 20 : 12, // status badge lebih tinggi
                      animationDelay: `${rowIdx * 60 + colIdx * 20}ms`,
                    }}
                  />
                ))}
              </div>
            ))}
            {/* Fake pagination */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2">
              <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-6 w-6 animate-pulse rounded bg-slate-200" />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Real grid (always rendered to keep AG Grid state, hidden when first loading) ── */}
        <div
          className={`relative transition-opacity duration-200 ${isLoading ? "invisible absolute inset-0 h-0 overflow-hidden" : ""}`}
          style={{ width: "100%" }}
        >
          {/* ── Refetch overlay (filter changed, data already exists) ── */}
          {isRefetching && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-white/70 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-8 py-5 shadow-lg">
                {/* Animated spinner */}
                <div className="relative h-8 w-8">
                  <div className="absolute inset-0 animate-spin rounded-full border-2 border-slate-200" />
                  <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-slate-800" style={{ animationDuration: "0.7s" }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700">Fetching data...</p>
                  <p className="mt-0.5 text-xs text-slate-400">Applying your filters</p>
                </div>
                {/* Animated progress bar */}
                <div className="h-0.5 w-32 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full animate-pulse rounded-full bg-slate-800"
                    style={{
                      animation: "progressSlide 1.2s ease-in-out infinite",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <style>{`
            @keyframes progressSlide {
              0%   { width: 0%;   margin-left: 0%; }
              50%  { width: 60%;  margin-left: 20%; }
              100% { width: 0%;   margin-left: 100%; }
            }
          `}</style>

          <AgGridReact
            ref={gridRef}
            onGridReady={(params) => { gridApiRef.current = params.api; }}
            onPaginationChanged={(e) => {
              if (e.newPage && !isRestoringRef.current) {
                currentPageRef.current = e.api.paginationGetCurrentPage();
              }
            }}
            rowData={rowData ?? []}
            columnDefs={columnDefs}
            pagination={true}
            paginationPageSize={10}
            paginationPageSizeSelector={[10, 25, 50]}
            domLayout="autoHeight"
            onSelectionChanged={(e) => setSelectedRows(e.api.getSelectedRows())}
            rowSelection={undefined}
            overlayNoRowsTemplate='<span style="color:#94a3b8;font-size:13px">No outbound records found for the selected filters.</span>'
          />
        </div>
      </div>

      {/* ── Dialogs & Modals ── */}
      <ScannedItemDialog />

      <Dialog open={openImportModal} onOpenChange={setOpenImportModal}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader><DialogTitle>Select the type of import</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <button
              onClick={() => { setOpenImportModal(false); router.push("/wms/outbound/import-excel"); }}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-slate-200 p-6 transition-all hover:border-green-500 hover:bg-green-50"
            >
              <Package className="h-10 w-10 text-slate-600" />
              <span className="text-sm font-semibold text-slate-700">Default</span>
            </button>
            <button
              onClick={() => { setOpenImportModal(false); router.push("/wms/outbound/import-excel/ecom"); }}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-slate-200 p-6 transition-all hover:border-blue-500 hover:bg-blue-50"
            >
              <ShoppingCart className="h-10 w-10 text-slate-600" />
              <span className="text-sm font-semibold text-slate-700">E-Commerce</span>
            </button>

            {/* B2B — NEW */}
            <button
              onClick={() => { setOpenImportModal(false); router.push("/wms/outbound/import-excel/b2b"); }}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-slate-200 p-6 transition-all hover:border-green-500 hover:bg-green-50"
            >
              <Truck className="h-10 w-10 text-slate-600" />
              <span className="text-sm font-semibold text-slate-700">B2B</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <SyncEcommerceModal
        open={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        onSyncSuccess={(result) => { mutate(); console.log("Sync success:", result); }}
      />

      <ArrangeShipmentModal
        open={arrangeModalOpen}
        orderSN={arrangeOrderSN}
        outboundNo={arrangeOutboundNo}
        onClose={() => setArrangeModalOpen(false)}
        onSuccess={() => mutate()}
      />
    </>
  );
};

export default OutboundTable;