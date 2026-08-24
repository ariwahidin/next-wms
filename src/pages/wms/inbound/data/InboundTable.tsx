/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, ColDef } from "ag-grid-community";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Blocks,
  CheckCheck,
  CheckCircle2,
  MoreHorizontal,
  Package,
  Package2,
  Pencil,
  Plus,
  Printer,
  PrinterIcon,
  RefreshCcw,
  Trash2,
  Upload,
  X,
  Search,
  Calendar,
  SlidersHorizontal,
  Tag,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import useSWR, { mutate } from "swr";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import styles from "./InboundTable.module.css";
import { useAlert } from "@/contexts/AlertContext";
import { useRouter } from "next/router";
import eventBus from "@/utils/eventBus";
import dayjs from "dayjs";
import { format, subDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { set } from "date-fns";
import JsBarcode from "jsbarcode";
import Select from "react-select";

ModuleRegistry.registerModules([AllCommunityModule]);

// ─── Types ───────────────────────────────────────────────────────────────────

interface ItemOptions {
  value: string;
  label: string;
}

interface FilterParams {
  startDate: Date;
  endDate: Date;
  search: string;
  searchItem: string;
  statuses: string[];
  types: string[];
  owner: string;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: string; label: string; color: string; dot: string }[] = [
  { value: "open", label: "Open", color: "bg-blue-50 border-blue-200 text-blue-700", dot: "bg-blue-500" },
  { value: "checking", label: "Checking", color: "bg-yellow-50 border-yellow-200 text-yellow-700", dot: "bg-yellow-500" },
  { value: "partially received", label: "Partially Received", color: "bg-orange-50 border-orange-200 text-orange-700", dot: "bg-orange-500" },
  { value: "fully received", label: "Fully Received", color: "bg-purple-50 border-purple-200 text-purple-700", dot: "bg-purple-500" },
  { value: "complete", label: "Complete", color: "bg-green-50 border-green-200 text-green-700", dot: "bg-green-500" },
  { value: "canceled", label: "Canceled", color: "bg-red-50 border-red-200 text-red-700", dot: "bg-red-500" },
];

// ─── IB Type config ───────────────────────────────────────────────────────────

const INBOUND_TYPE_OPTIONS: ItemOptions[] = [
  { value: "NORMAL", label: "Normal" },
  { value: "RETURN", label: "Return" },
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
  if (filters.types.length > 0) params.set("types", filters.types.join(","));
  if (filters.owner) params.set("owners", filters.owner);
  return `/inbound/filter?${params.toString()}`;
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
// ─── Printable Labels Component ───────────────────────────────────────────────

const PrintableLabels = ({ palletIDs }) => {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const pages = [];
  for (let i = 0; i < palletIDs.length; i += 4) {
    pages.push(palletIDs.slice(i, i + 4));
  }

  return (
    <div className="printable-area">
      {pages.map((pageLabels, pageIndex) => (
        <div
          key={pageIndex}
          className="print-page"
          style={{
            pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'auto',
            pageBreakInside: 'avoid'
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            {pageLabels.map((palletID, labelIndex) => (
              <LabelCard key={`${pageIndex}-${labelIndex}`} palletID={palletID} date={currentDate} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Pallet ID Print Modal Component ──────────────────────────────────────────

const PalletIDPrintModal = ({ open, onOpenChange, inboundNo }) => {
  const [startNumber, setStartNumber] = useState(1);
  const [endNumber, setEndNumber] = useState(4);

  const handleGenerate = () => {
    const url = `/wms/inbound/data/print-pallet-id?inbound_no=${inboundNo}&start=${startNumber}&end=${endNumber}`;
    window.open(url, '_blank');
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open) {
      setStartNumber(1);
      setEndNumber(4);
    }
  }, [open]);

  const totalLabels = Math.max(0, endNumber - startNumber + 1);
  const totalPages = Math.ceil(totalLabels / 4);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-white">
        <DialogHeader>
          <DialogTitle>Generate Pallet ID Labels</DialogTitle>
          <DialogDescription>
            Generate barcode labels for inbound: {inboundNo}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Carton No.</label>
              <input
                type="number"
                min="1"
                value={startNumber}
                onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Carton No.</label>
              <input
                type="number"
                min={startNumber}
                value={endNumber}
                onChange={(e) => setEndNumber(parseInt(e.target.value) || startNumber)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-800">
              <strong>Total Labels:</strong> {totalLabels} labels ({totalPages} pages)
            </p>
            <p className="text-sm text-blue-600 mt-1">
              4 labels per A4 page (2 columns × 2 rows)
            </p>
          </div>

          <div className="border rounded p-4 bg-gray-50">
            <h3 className="font-semibold mb-2">Preview Labels:</h3>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: Math.min(totalLabels, 20) }, (_, i) => (
                <span key={i} className="bg-white border px-3 py-1 rounded text-sm">
                  {inboundNo}-{startNumber + i}
                </span>
              ))}
              {totalLabels > 20 && (
                <span className="text-sm text-gray-500 px-3 py-1">
                  ... and {totalLabels - 20} more
                </span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate}>
            <Printer className="mr-2 h-4 w-4" />
            Generate & Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Individual Label Card Component ──────────────────────────────────────────

const LabelCard = ({ palletID, date }) => {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, palletID, {
          format: 'CODE128',
          width: 1,
          height: 60,
          displayValue: false,
          margin: 10,
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }
  }, [palletID]);

  return (
    <div className="border-2 border-black p-4 h-[13.5cm] flex flex-col">
      <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-black">
        <div className="flex items-center gap-2">
          <div>
            <img src="/images/yl-logo.jpeg" alt="Logo" width="80" />
            <span style={{ fontSize: "11px" }}>PT Yusen Logistics Interlink Indonesia</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-gray-600" style={{ fontSize: "10px" }}>Generated:</div>
          <div className="font-semibold" style={{ fontSize: "10px" }}>{date}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="mb-2">
          <svg ref={barcodeRef} className="w-full max-w-[850px] min-w-[550px]"></svg>
        </div>
        <div className="font-bold text-2xl tracking-wider mb-1">{palletID}</div>
        <div className="text-sm text-gray-600">PALLET ID</div>
      </div>

      <div className="border-2 border-gray-400 rounded p-3 mt-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">Qty Carton:</span>
          <div className="border-b-2 border-gray-400 w-32 h-8"></div>
        </div>
        <div className="text-xs text-gray-500 mt-1">Fill manually</div>
      </div>
    </div>
  );
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
  loading: boolean;
}

const FilterBar = ({ filters, onChange, loading }: FilterBarProps) => {
  const [localSearch, setLocalSearch] = useState(filters.search);
  const [localItem, setLocalItem] = useState(filters.searchItem);
  // const [localOwner, setLocalOwner] = useState(filters.owner);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  // const ownerDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: ownerOptions } = useSWR("/owners", ownersFetcher);

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

  // const handleOwnerChange = (val: string) => {
  //   setLocalOwner(val);
  //   clearTimeout(ownerDebounce.current);
  //   ownerDebounce.current = setTimeout(() => {
  //     onChange({ ...filters, owner: val });
  //   }, 500);
  // };

  const toggleStatus = (status: string) => {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onChange({ ...filters, statuses: next });
  };

  const toggleType = (type: string) => {
    const next = filters.types.includes(type)
      ? filters.types.filter((s) => s !== type)
      : [...filters.types, type];
    onChange({ ...filters, types: next });
  };

  const handleReset = () => {
    const reset: FilterParams = {
      startDate: subDays(new Date(), 90),
      endDate: new Date(),
      search: "",
      searchItem: "",
      statuses: [],
      types: [],
      owner: "",
    };
    setLocalSearch("");
    setLocalItem("");
    // setLocalOwner("");

    onChange(reset);
  };

  const isFiltered =
    filters.search !== "" ||
    filters.searchItem !== "" ||
    filters.owner !== "" ||
    filters.statuses.length > 0 ||
    filters.types.length > 0 ||
    fmt(filters.startDate) !== fmt(subDays(new Date(), 90)) ||
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

        <div className="hidden h-10 w-px bg-slate-200 sm:block" />

        {/* Status multi-select dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Status
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex min-w-[170px] items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-all hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1">
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
            <PopoverContent className="w-56 p-1.5 bg-white shadow-xl border border-slate-200" align="start">
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

        {/* IB Type multi-select dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            IB Type
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex min-w-[150px] items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-all hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1">
                <span className="text-slate-600 truncate">
                  {filters.types.length === 0
                    ? <span className="text-slate-400">All types</span>
                    : filters.types.length === 1
                      ? <span className="truncate">{INBOUND_TYPE_OPTIONS.find(o => o.value === filters.types[0])?.label}</span>
                      : <span className="text-slate-600">{filters.types.length} selected</span>
                  }
                </span>
                <svg className="h-3.5 w-3.5 text-slate-400 shrink-0" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1.5 bg-white shadow-xl border border-slate-200" align="start">
              {INBOUND_TYPE_OPTIONS.map((opt) => {
                const active = filters.types.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleType(opt.value)}
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
                    <Tag className="h-3 w-3 shrink-0 text-slate-400" />
                    <span className="text-slate-700 font-medium truncate">{opt.label}</span>
                  </button>
                );
              })}
              {filters.types.length > 0 && (
                <>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, types: [] })}
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

        {/* Owner text filter */}
        {/* <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Owner
          </label>
          <div className="relative">
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={localOwner}
              onChange={(e) => handleOwnerChange(e.target.value)}
              placeholder="Owner code..."
              className="w-32 rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm text-slate-700 placeholder-slate-400 transition-all focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
            />
          </div>
        </div> */}

        {/* Owner filter */}
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
            isLoading={!ownerOptions}
            value={
              ownerOptions?.find((o: any) => o.value === filters.owner) ?? null
            }
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

        <div className="hidden h-10 w-px bg-slate-200 sm:block" />

        {/* Header search */}
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Search Inbound
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Inbound No, Receipt ID, Supplier..."
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm text-slate-700 placeholder-slate-400 transition-all focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
            />
          </div>
        </div>

        {/* Item search */}
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Search Item in Inbound
          </label>
          <div className="relative">
            <Package2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={localItem}
              onChange={(e) => handleItemChange(e.target.value)}
              placeholder="Item Code, Item Name..."
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
          {filters.types.length > 0 && filters.types.map((t) => {
            const opt = INBOUND_TYPE_OPTIONS.find((o) => o.value === t)!;
            return (
              <span key={t} className="flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                <Tag className="h-3 w-3" />
                {opt?.label ?? t}
              </span>
            );
          })}
          {filters.owner && (
            <span className="flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
              <User className="h-3 w-3" />
              Owner: `{filters.owner}`
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

const InboundTable = () => {
  const { showAlert, notify } = useAlert();
  const router = useRouter();

  // Filter state — default 7 hari ke belakang, semua status
  const [filters, setFilters] = useState<FilterParams>({
    startDate: subDays(new Date(), 90),
    endDate: new Date(),
    search: "",
    searchItem: "",
    statuses: [],
    types: [],
    owner: "",
  });

  const swrKey = buildUrl(filters);
  const { data: rowData, error, mutate: mutateData, isValidating } = useSWR(swrKey, fetcher);

  const HandleEdit = (no: string) => {
    router.push(`/wms/inbound/edit/${no}`);
  };

  const HandlePreviewPDF = (id: number) => {
    window.open(`/wms/inbound/putaway-sheet/${id}`, "_blank");
  };

  const [columnDefs] = useState<ColDef[]>([
    { field: "no", headerName: "No. ", maxWidth: 60 },
    { field: "inbound_no", headerName: "Inbound No. ", maxWidth: 150 },
    {
      headerName: "Actions",
      pinned: "right",
      headerClass: "header-center",
      cellStyle: { textAlign: "center" },
      field: "ID",
      maxWidth: 80,
      cellRenderer: (params: any) => {
        return (
          <div
            className="flex justify-center pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {params.data.status === "open" && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmAction({ type: "checking", inbound_no: params.data.inbound_no });
                      // handleChecking(params.data.inbound_no);
                    }}
                  >
                    <Blocks className="mr-2 h-4 w-4" />
                    Start Checking
                  </DropdownMenuItem>
                )}

                {/* {(params.data.status === "checking" ||
                  params.data.status === "partially received") && (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmAction({ type: "putaway", inbound_no: params.data.inbound_no });
                        // handlePutaway(params.data.inbound_no);
                      }}
                    >
                      <Blocks className="mr-2 h-4 w-4" />
                      Confirm Putaway
                    </DropdownMenuItem>
                  )} */}

                {(params.data.status === "checking" ||
                  params.data.status === "partially received") && (
                    <>
                      {}
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmAction({ type: "check_putaway", inbound_no: params.data.inbound_no });
                        }}
                      >
                        <Blocks className="mr-2 h-4 w-4" />
                        Check All Items
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmAction({ type: "putaway", inbound_no: params.data.inbound_no });
                        }}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Confirm Putaway
                      </DropdownMenuItem>
                    </>
                  )}

                {params.data.status === "fully received" && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmAction({ type: "complete", inbound_no: params.data.inbound_no });
                      // handleComplete(params.data.inbound_no);
                    }}
                  >
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Confirm Complete
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    HandlePreviewPDF(params.data.id);
                  }}
                >
                  <PrinterIcon className="mr-2 h-4 w-4" />
                  Print Tally Sheet
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => handlePrintPalletID(params.data.inbound_no)}>
                  <Package className="mr-2 h-4 w-4" />
                  Print Pallet ID
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    HandleEdit(params.data.inbound_no);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  View / Edit
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                {(params.data.status === "checking" || params.data.status === "partially received" || params.data.status === "fully received") && (
                  <>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmAction({ type: "open", inbound_no: params.data.inbound_no });
                        // handleOpen(params.data.inbound_no);
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Return to Open
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
    {
      field: "inbound_date",
      headerName: "Date",
      width: 120,
      cellRenderer: (params) => {
        return <div>{dayjs(params.value).format("DD MMM YYYY")}</div>;
      },
    },
    { field: "receipt_id", headerName: "Receipt ID", width: 130 },
    {
      field: "type",
      headerName: "IB Type",
      width: 120,
      cellRenderer: (params) => params.value?.toUpperCase(),
    },
    {
      field: "owner_code",
      headerName: "Owner",
      width: 120,
      cellRenderer: (params) => params.value?.toUpperCase(),
    },
    { field: "supplier_name", headerName: "Supplier", width: 250 },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      cellRenderer: (params) => {
        if (!params.value) return null;

        let color = "bg-gray-500";
        switch (params.value.toLowerCase()) {
          case "open":
            color = "bg-blue-500 text-white";
            break;
          case "checking":
            color = "bg-yellow-500 text-black";
            break;
          case "partially received":
            color = "bg-orange-500 text-white";
            break;
          case "fully received":
            color = "bg-purple-500 text-white";
            break;
          case "complete":
            color = "bg-green-500";
            break;
          case "canceled":
            color = "bg-red-500";
            break;
        }

        return <Badge className={`${color} capitalize`}>{params.value}</Badge>;
      },
    },
    { field: "total_line", headerName: "Items", width: 80 },
    { field: "total_qty", headerName: "Request", width: 90 },
    { field: "qty_scan", headerName: "Scan", width: 90 },
    { field: "qty_putaway", headerName: "Putaway", width: 90 },
  ]);

  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // FIX: kurang tanda "<" sebelum generic type di useState, sehingga
  // baris ini di-parse sebagai ekspresi biasa (bukan generic call),
  // membuat useState(...) tidak mengembalikan array/iterable -> error
  // "function is not iterable" saat di-destructure.
  const [dialogType, setDialogType] = useState<
    "complete" | "cancel" | "checking" | null
  >(null);

  const [palletModalOpen, setPalletModalOpen] = useState(false);
  const [selectedInbound, setSelectedInbound] = useState(null);


  type ConfirmActionType = "checking" | "check_putaway" | "putaway" | "complete" | "open";

  type ConfirmConfigItem = {
    title: string;
    description: string;
    confirmText: string;
  };

  const CONFIRM_CONFIG: Record<ConfirmActionType, ConfirmConfigItem> = {
    checking: {
      title: "Start Checking?",
      description: "This inbound will move to Checking status.",
      confirmText: "Start Checking",
    },
    check_putaway: {
      title: "Check All Items?",
      description: "This will generate pallet ID and insert scanned items. You can still review before confirming putaway.",
      confirmText: "Check All",
    },
    putaway: {
      title: "Confirm Putaway?",
      description: "This will finalize putaway to the assigned locations.",
      confirmText: "Confirm Putaway",
    },
    complete: {
      title: "Confirm Complete?",
      description: "This inbound will be marked as Complete.",
      confirmText: "Confirm Complete",
    },
    open: {
      title: "Return to Open?",
      description: "This inbound will be reverted back to Open status.",
      confirmText: "Return to Open",
    },
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    const { type, inbound_no } = confirmAction;
    setConfirmAction(null);
    if (type === "checking") handleChecking(inbound_no);
    if (type === "check_putaway") handleCheckPutaway(inbound_no);
    if (type === "putaway") handlePutaway(inbound_no);
    if (type === "complete") handleComplete(inbound_no);
    if (type === "open") handleOpen(inbound_no);
  };

  const [confirmAction, setConfirmAction] = useState<{
    type: ConfirmActionType;
    inbound_no: string;
  } | null>(null);

  const handlePrintPalletID = (inbound_no: string) => {
    setSelectedInbound(inbound_no);
    setPalletModalOpen(true);
  };

  useEffect(() => {
    document.body.style.pointerEvents = "auto";
  }, [palletModalOpen, confirmAction]);

  const handleChecking = (inbound_no: string) => {
    eventBus.emit("loading", true);
    api
      .post("/inbound/checking", { inbound_no: inbound_no })
      .then((response) => {
        eventBus.emit("loading", false);
        if (response.data.success) {
          notify("Success", response.data.message, "success");
          mutateData();
        }
      })
      .catch((error) => {
        console.error("Error checking inbound:", error);
      });
  };

  const handleOpen = (inbound_no: string) => {
    api
      .post("/inbound/open", { inbound_no: inbound_no })
      .then((response) => {
        if (response.data.success) {
          notify("Success", response.data.message, "success");
          mutateData();
        }
      })
      .catch((error) => {
        console.error("Error open inbound:", error);
      });
  };

  const handleCheckPutaway = (inbound_no: string) => {
    eventBus.emit("loading", true);
    api
      .post("/inbound/check-putaway", { inbound_no })
      .then((response) => {
        eventBus.emit("loading", false);
        if (response.data.success) {
          notify("Success", "Items checked, pallet generated. Please confirm putaway.", "success");
          mutateData();
        }
      })
      .catch((error) => {
        eventBus.emit("loading", false);
        notify("Error", error?.response?.data?.error ?? "Failed to check items", "error");
      });
  };

  const handlePutaway = (inbound_no: string) => {
    eventBus.emit("loading", true);
    api
      // .post("/inbound/handle-putaway", { inbound_no: inbound_no })
      .post("/inbound/confirm-putaway", { inbound_no })
      .then((response) => {
        eventBus.emit("loading", false);
        if (response.data.success) {
          notify("Success", response.data.message, "success");
          mutateData();
        }
      })
      .catch((error) => {
        eventBus.emit("loading", false);
        console.error("Error putaway inbound:", error);
      });
  };

  const handleComplete = (inbound_no: string) => {
    eventBus.emit("loading", true);
    api
      .post("/inbound/complete/" + inbound_no, { inbound_no: inbound_no })
      .then((response) => {
        eventBus.emit("loading", false);
        if (response.data.success) {
          notify("Success", response.data.message, "success");
          mutateData();
        }
      })
      .catch((error) => {
        eventBus.emit("loading", false);
        console.error("Error completing inbound:", error);
      });
  };

  useEffect(() => {
    if (!isDialogOpen) {
      setDialogType(null);
    }
  }, [isDialogOpen]);

  const isLoading = !rowData && !error;
  const isRefetching = isValidating && !!rowData;

  return (
    <div>
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Button
            className="h-8"
            onClick={() => {
              router.push("/wms/inbound/add");
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
          <Button
            className="h-8 bg-green-500 text-slate-950 outline-green-600"
            onClick={() => { router.push('/wms/inbound/import-excel') }}
          >
            <Upload className="mr-2 w-4" />
            Import Excel
          </Button>
          <Button
            className="h-8"
            variant="outline"
            onClick={() => mutateData()}
          >
            🔄 Refresh
          </Button>
        </div>

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
        loading={isLoading}
      />

      {/* ── Grid ── */}
      <div className="relative">
        {isLoading && (
          <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center gap-0 border-b border-slate-200 bg-slate-50 px-3 py-2.5">
              {[60, 150, 80, 120, 130, 120, 120, 250, 150, 80, 90, 90, 90].map((w, i) => (
                <div
                  key={i}
                  className="mr-2 h-3 shrink-0 animate-pulse rounded bg-slate-200"
                  style={{ width: w, minWidth: w }}
                />
              ))}
            </div>
            {Array.from({ length: 10 }).map((_, rowIdx) => (
              <div
                key={rowIdx}
                className="flex items-center gap-0 border-b border-slate-100 px-3 py-3 last:border-0"
                style={{ animationDelay: `${rowIdx * 60}ms` }}
              >
                {[60, 150, 80, 120, 130, 120, 120, 250, 150, 80, 90, 90, 90].map((w, colIdx) => (
                  <div
                    key={colIdx}
                    className="mr-2 shrink-0 animate-pulse rounded bg-slate-100"
                    style={{
                      width: w,
                      minWidth: w,
                      height: colIdx === 8 ? 20 : 12,
                      animationDelay: `${rowIdx * 60 + colIdx * 20}ms`,
                    }}
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
        )}

        <div
          className={`relative transition-opacity duration-200 ${isLoading ? "invisible absolute inset-0 h-0 overflow-hidden" : ""}`}
          style={{ width: "100%" }}
        >
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
                  <div
                    className="h-full animate-pulse rounded-full bg-slate-800"
                    style={{ animation: "progressSlide 1.2s ease-in-out infinite" }}
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
            rowData={rowData ?? []}
            columnDefs={columnDefs}
            pagination={true}
            paginationPageSize={10}
            paginationPageSizeSelector={[10, 25, 50]}
            domLayout="autoHeight"
            onSelectionChanged={(e) => {
              const selected = e.api.getSelectedRows();
              setSelectedRows(selected);
            }}
            rowSelection="multiple"
            overlayNoRowsTemplate='<span style="color:#94a3b8;font-size:13px">No inbound records found for the selected filters.</span>'
          />
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "checking"
                ? "Confirm Checking"
                : "Confirm Cancellation"}
            </DialogTitle>

            <DialogDescription>
              This action will affect {selectedRows.length} selected item(s).
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                console.log(selectedRows);
                setIsDialogOpen(false);
                setSelectedRows([]);
                notify("Success", "Data saved successfully!");
              }}
            >
              Yes, Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PalletIDPrintModal
        open={palletModalOpen}
        onOpenChange={setPalletModalOpen}
        inboundNo={selectedInbound}
      />

      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmAction && CONFIRM_CONFIG[confirmAction.type].title}</DialogTitle>
            <DialogDescription>
              {confirmAction && CONFIRM_CONFIG[confirmAction.type].description}
              {confirmAction && (
                <>
                  <br />
                  <span className="font-medium text-slate-700">
                    Inbound No: {confirmAction.inbound_no}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAction}>
              {confirmAction && CONFIRM_CONFIG[confirmAction.type].confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InboundTable;