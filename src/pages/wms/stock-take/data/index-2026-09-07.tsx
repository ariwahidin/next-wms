/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { format, subDays } from "date-fns";
import api from "@/lib/api";
import Layout from "@/components/layout";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Calendar,
  Hash,
  TrendingUp,
  Plus,
  Eye,
  Edit3,
  Trash2,
  ChartBar,
  X,
  Filter,
  MapPin,
  Layers,
  Grid,
  Package,
  Box,
  AlertTriangle,
  XCircle,
  MoreVertical,
  LockIcon,
  SlidersHorizontal,
  Search,
} from "lucide-react";
import { createPortal } from "react-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

type StockTake = {
  ID: number;
  code: string;
  status: string;
  created_at: string;
  updated_at: string;
  total_system_qty: number;
  total_counted_qty: number;
  counted_location: number;
  planned_location: number;
  counted_item: number;
  planned_item: number;
};

type StockTakeStatus = "open" | "in_progress" | "cancelled" | "closed";

interface FilterParams {
  startDate: Date;
  endDate: Date;
  searchLocation: string;
  code: string;
  statuses: StockTakeStatus[];
}

const PAGE_SIZE = 20;

const buildBaseParams = (filters: FilterParams) => {
  const params = new URLSearchParams({
    start_date: fmt(filters.startDate),
    end_date: fmt(filters.endDate),
  });
  if (filters.searchLocation) params.set("search_location", filters.searchLocation);
  if (filters.code) params.set("code", filters.code);
  if (filters.statuses.length > 0) params.set("statuses", filters.statuses.join(","));
  return params;
};

const buildListUrl = (filters: FilterParams, page: number) => {
  const params = buildBaseParams(filters);
  params.set("page", String(page));
  params.set("page_size", String(PAGE_SIZE));
  return `/stock-take?${params.toString()}`;
};

const buildStatsUrl = (filters: FilterParams) => `/stock-take/stats?${buildBaseParams(filters).toString()}`;

const STATUS_OPTIONS: { value: StockTakeStatus; label: string; color: string; dot: string }[] = [
  { value: "open", label: "Open", color: "bg-blue-50 border-blue-200 text-blue-700", dot: "bg-blue-500" },
  { value: "in_progress", label: "In Progress", color: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-500" },
  { value: "closed", label: "Closed", color: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-50 border-red-200 text-red-700", dot: "bg-red-500" },
];

const fmt = (d: Date) => format(d, "yyyy-MM-dd");

const buildUrl = (filters: FilterParams) => {
  const params = new URLSearchParams({
    start_date: fmt(filters.startDate),
    end_date: fmt(filters.endDate),
  });
  if (filters.searchLocation) params.set("search_location", filters.searchLocation);
  if (filters.statuses.length > 0) params.set("statuses", filters.statuses.join(","));
  return `/stock-take?${params.toString()}`;
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
}

const FilterBar = ({ filters, onChange }: FilterBarProps) => {
  const [localLocation, setLocalLocation] = useState(filters.searchLocation);
  const [localCode, setLocalCode] = useState(filters.code);
  const locationDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const codeDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLocationChange = (val: string) => {
    setLocalLocation(val);
    if (locationDebounce.current) clearTimeout(locationDebounce.current);
    locationDebounce.current = setTimeout(() => {
      onChange({ ...filters, searchLocation: val });
    }, 500);
  };

  const handleCodeChange = (val: string) => {
    setLocalCode(val);
    if (codeDebounce.current) clearTimeout(codeDebounce.current);
    codeDebounce.current = setTimeout(() => {
      onChange({ ...filters, code: val });
    }, 500);
  };

  const toggleStatus = (status: StockTakeStatus) => {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onChange({ ...filters, statuses: next });
  };

  const handleReset = () => {
    setLocalLocation("");
    setLocalCode("");
    onChange({
      startDate: subDays(new Date(), 14),
      endDate: new Date(),
      searchLocation: "",
      code: "",
      statuses: [],
    });
  };

  const isFiltered =
    filters.searchLocation !== "" ||
    filters.code !== "" ||
    filters.statuses.length > 0 ||
    fmt(filters.startDate) !== fmt(subDays(new Date(), 14)) ||
    fmt(filters.endDate) !== fmt(new Date());

  return (
    <Card className="mb-4 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5">
        <SlidersHorizontal className="h-4 w-4 text-slate-500" />
        <span
          className="text-sm font-semibold text-slate-700 uppercase"
          style={{ letterSpacing: "0.06em", fontSize: "0.7rem" }}
        >
          Filter & Search
        </span>
        {isFiltered && (
          <span className="ml-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
            Active
          </span>
        )}
      </div>

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

        {/* Status multi-select */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Status
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex min-w-[160px] items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-all hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1">
                <span className="text-slate-600">
                  {filters.statuses.length === 0 ? (
                    <span className="text-slate-400">All statuses</span>
                  ) : filters.statuses.length === 1 ? (
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${STATUS_OPTIONS.find((o) => o.value === filters.statuses[0])?.dot}`}
                      />
                      {STATUS_OPTIONS.find((o) => o.value === filters.statuses[0])?.label}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      {filters.statuses.slice(0, 2).map((s) => (
                        <span
                          key={s}
                          className={`h-1.5 w-1.5 rounded-full ${STATUS_OPTIONS.find((o) => o.value === s)?.dot}`}
                        />
                      ))}
                      <span className="text-slate-600">{filters.statuses.length} selected</span>
                    </span>
                  )}
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
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border-2 transition-all ${active ? "border-slate-800 bg-slate-800" : "border-slate-300 bg-white"
                        }`}
                    >
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

        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Session Code
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={localCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="Search session code..."
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm text-slate-700 placeholder-slate-400 transition-all focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
            />
          </div>
        </div>

        {/* Search location */}
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Search Location in Task
          </label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={localLocation}
              onChange={(e) => handleLocationChange(e.target.value)}
              placeholder="Rack, Zone, Location code..."
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm text-slate-700 placeholder-slate-400 transition-all focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
            />
          </div>
        </div>

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

      {isFiltered && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Active:</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {format(filters.startDate, "dd MMM")} – {format(filters.endDate, "dd MMM yyyy")}
          </span>
          {filters.statuses.map((s) => {
            const opt = STATUS_OPTIONS.find((o) => o.value === s)!;
            return (
              <span key={s} className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${opt.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${opt.dot}`} />
                {opt.label}
              </span>
            );
          })}
          {filters.searchLocation && (
            <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white">
              Location: `{filters.searchLocation}`
            </span>
          )}

          {filters.code && (
            <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white">
              Code: `{filters.code}`
            </span>
          )}
        </div>


      )}
    </Card>
  );
};

// ─── Generate Cycle Count Modal ──────────────────────────────────────────────

const StockTakeModal = ({ isOpen, onClose, onGenerate }) => {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [owners, setOwners] = useState([]);
  const [filters, setFilters] = useState({
    ownerCode: "",
    fromRow: "",
    toRow: "",
    fromBay: "",
    toBay: "",
    fromLevel: "",
    toLevel: "",
    fromBin: "",
    toBin: "",
    area: "",
  });

  const getUniqueValues = (key) => {
    const values = locations.map((loc) => loc[key]).filter(Boolean);
    return [...new Set(values)].sort();
  };

  const rows = getUniqueValues("row");
  const bays = getUniqueValues("bay");
  const levels = getUniqueValues("level");
  const bins = getUniqueValues("bin");
  const areas = getUniqueValues("area");

  useEffect(() => {
    if (isOpen) {
      fetchLocations();
      fetchOwners();
    }
  }, [isOpen]);

  const fetchOwners = async () => {
    try {
      const res = await api.get("/owners");
      if (res.data.success) {
        setOwners(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch owners:", err);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await api.get("/stock-take/locations");
      if (res.data.success) {
        setLocations(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch locations:", err);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await onGenerate(filters);
      onClose();
    } catch (err) {
      console.error("Generate failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      ownerCode: "",
      fromRow: "",
      toRow: "",
      fromBay: "",
      toBay: "",
      fromLevel: "",
      toLevel: "",
      fromBin: "",
      toBin: "",
      area: "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all sm:w-full sm:max-w-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <Package className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Generate Cycle Count
                </h3>
                <p className="text-sm text-gray-500">
                  Set location filters for cycle count generation
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-6 py-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="inline h-4 w-4 mr-1" />
                  Customer <span className="text-red-500">*</span>
                </label>
                <select
                  value={filters.ownerCode}
                  onChange={(e) => handleFilterChange("ownerCode", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                >
                  <option value="">Select Customer</option>
                  {owners.map((owner) => (
                    <option key={owner.code} value={owner.code}>
                      {owner.name}
                    </option>
                  ))}
                </select>
                {!filters.ownerCode && (
                  <p className="text-xs text-red-500 mt-1">
                    Please select a customer to continue
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Grid className="inline h-4 w-4 mr-1" />
                  Row Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From Row</label>
                    <select
                      value={filters.fromRow}
                      onChange={(e) => handleFilterChange("fromRow", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">Select</option>
                      {rows.map((row) => (
                        <option key={row} value={row}>{row}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">To Row</label>
                    <select
                      value={filters.toRow}
                      onChange={(e) => handleFilterChange("toRow", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">Select</option>
                      {rows.map((row) => (
                        <option key={row} value={row}>{row}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Grid className="inline h-4 w-4 mr-1" />
                  Bay Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From Bay</label>
                    <select
                      value={filters.fromBay}
                      onChange={(e) => handleFilterChange("fromBay", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">Select</option>
                      {bays.map((bay) => (
                        <option key={bay} value={bay}>{bay}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">To Bay</label>
                    <select
                      value={filters.toBay}
                      onChange={(e) => handleFilterChange("toBay", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">Select</option>
                      {bays.map((bay) => (
                        <option key={bay} value={bay}>{bay}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Layers className="inline h-4 w-4 mr-1" />
                  Level Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From Level</label>
                    <select
                      value={filters.fromLevel}
                      onChange={(e) => handleFilterChange("fromLevel", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">Select</option>
                      {levels.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">To Level</label>
                    <select
                      value={filters.toLevel}
                      onChange={(e) => handleFilterChange("toLevel", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">Select</option>
                      {levels.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="inline h-4 w-4 mr-1" />
                  Bin Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From Bin</label>
                    <select
                      value={filters.fromBin}
                      onChange={(e) => handleFilterChange("fromBin", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">Select</option>
                      {bins.map((bin) => (
                        <option key={bin} value={bin}>{bin}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">To Bin</label>
                    <select
                      value={filters.toBin}
                      onChange={(e) => handleFilterChange("toBin", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">Select</option>
                      {bins.map((bin) => (
                        <option key={bin} value={bin}>{bin}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Filter Summary:</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  {filters.ownerCode && (
                    <div className="font-medium text-slate-900">
                      Customer: {owners.find((o) => o.Code === filters.ownerCode)?.Name || filters.ownerCode}
                    </div>
                  )}
                  {filters.area && <div>Area: {filters.area}</div>}
                  {(filters.fromRow || filters.toRow) && (
                    <div>Row: {filters.fromRow || "All"} to {filters.toRow || "All"}</div>
                  )}
                  {(filters.fromBay || filters.toBay) && (
                    <div>Bay: {filters.fromBay || "All"} to {filters.toBay || "All"}</div>
                  )}
                  {(filters.fromLevel || filters.toLevel) && (
                    <div>Level: {filters.fromLevel || "All"} to {filters.toLevel || "All"}</div>
                  )}
                  {(filters.fromBin || filters.toBin) && (
                    <div>Bin: {filters.fromBin || "All"} to {filters.toBin || "All"}</div>
                  )}
                  {!Object.values(filters).some((v) => v) && (
                    <div className="text-gray-400">No filters applied - All locations will be included</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Filter className="h-4 w-4" />
              Reset Filters
            </button>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading || !filters.ownerCode}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, description, confirmLabel, variant = "danger", loading }) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: "text-red-600 bg-red-50",
      button: "bg-red-600 hover:bg-red-700 disabled:bg-red-300",
    },
    warning: {
      icon: "text-amber-600 bg-amber-50",
      button: "bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300",
    },
    default: {
      icon: "text-slate-600 bg-slate-50",
      button: "bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400",
    },
  };
  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all sm:w-full sm:max-w-sm">
          <div className="px-6 py-5">
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.icon}`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed ${style.button}`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : null}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

type StockTakeStats = {
  total_sessions: number;
  total_system_qty: number;
  total_counted_qty: number;
  total_planned_location: number;
  total_counted_location: number;
  total_planned_item: number;
  total_counted_item: number;
};

const EMPTY_STATS: StockTakeStats = {
  total_sessions: 0,
  total_system_qty: 0,
  total_counted_qty: 0,
  total_planned_location: 0,
  total_counted_location: 0,
  total_planned_item: 0,
  total_counted_item: 0,
};
export default function StockTakePage() {
  const [data, setData] = useState<StockTake[]>([]);
  const [stats, setStats] = useState<StockTakeStats>(EMPTY_STATS);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const router = useRouter();
  const isFirstLoad = useRef(true);

  const [filters, setFilters] = useState<FilterParams>({
    startDate: subDays(new Date(), 14),
    endDate: new Date(),
    searchLocation: "",
    code: "",
    statuses: [],
  });

  const [openActionMenu, setOpenActionMenu] = useState<{ id: number; code: string; top: number; left: number } | null>(null);


  const handleFilterChange = (f: FilterParams) => {
    setPage(1); // filter baru → balik ke halaman 1
    setFilters(f);
  };

  const fetchStats = async (currentFilters: FilterParams) => {
    try {
      const res = await api.get(buildStatsUrl(currentFilters), { withCredentials: true });
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Fetch stats failed:", err);
    }
  };

  const [confirmAction, setConfirmAction] = useState<{
    type: "cancel" | "close" | "delete";
    code: string;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleNewStockTake = () => {
    setIsModalOpen(true);
  };

  const generateStockTake = async (genFilters) => {
    setIsRefetching(true);
    try {
      const res = await api.post("/stock-take/generate", { filters: genFilters }, { withCredentials: true });
      if (res.data.success) {
        // fetchStockTakes(filters);
        fetchStockTakes(filters, page);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to generate cycle count");
    } finally {
      setIsRefetching(false);
    }
  };

  const handleCancelSession = async (code: string) => {
    setConfirmLoading(true);
    try {
      const res = await api.post(`/stock-take/${code}/cancel`, {}, { withCredentials: true });
      if (res.data.success) {
        // fetchStockTakes(filters);
        fetchStockTakes(filters, page);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to cancel session");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCloseSession = async (code: string) => {
    setConfirmLoading(true);
    try {
      const res = await api.post(`/stock-take/${code}/close`, {}, { withCredentials: true });
      if (res.data.success) {
        // fetchStockTakes(filters);
        fetchStockTakes(filters, page);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to close session");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleDelete = async (code: string) => {
    setConfirmLoading(true);
    try {
      const res = await api.delete(`/stock-take/${code}`, { withCredentials: true });
      if (res.data.success) {
        // fetchStockTakes(filters);
        fetchStockTakes(filters, page);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete cycle count");
    } finally {
      setConfirmLoading(false);
    }
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;
    const { type, code } = confirmAction;
    if (type === "cancel") await handleCancelSession(code);
    else if (type === "close") await handleCloseSession(code);
    else if (type === "delete") await handleDelete(code);
    setConfirmAction(null);
  };

  const confirmModalConfig = () => {
    if (!confirmAction) return null;
    const { type, code } = confirmAction;
    if (type === "cancel") {
      return {
        title: "Cancel Cycle Count Session",
        description: `Are you sure you want to cancel session ${code}? Progress will be marked as cancelled.`,
        confirmLabel: "Cancel Session",
        variant: "warning" as const,
      };
    }
    if (type === "close") {
      return {
        title: "Close Cycle Count Session",
        description: `Are you sure you want to close session ${code}? No further scanning will be allowed after this.`,
        confirmLabel: "Close Session",
        variant: "default" as const,
      };
    }
    return {
      title: "Delete Cycle Count Session",
      description: `Delete session ${code}? This cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger" as const,
    };
  };

  // const fetchStockTakes = async (currentFilters: FilterParams) => {
  //   if (isFirstLoad.current) {
  //     setLoading(true);
  //   } else {
  //     setIsRefetching(true);
  //   }
  //   try {
  //     const res = await api.get(buildUrl(currentFilters), { withCredentials: true });
  //     if (res.data.success) {
  //       setData(res.data.data);
  //     }
  //   } catch (err) {
  //     console.error("Fetch failed:", err);
  //   } finally {
  //     setLoading(false);
  //     setIsRefetching(false);
  //     isFirstLoad.current = false;
  //   }
  // };

  const fetchStockTakes = async (currentFilters: FilterParams, currentPage: number) => {
    if (isFirstLoad.current) {
      setLoading(true);
    } else {
      setIsRefetching(true);
    }
    try {
      const res = await api.get(buildListUrl(currentFilters, currentPage), { withCredentials: true });
      if (res.data.success) {
        setData(res.data.data);
        setTotalPages(res.data.meta?.total_pages || 1);
        setTotalCount(res.data.meta?.total || 0);
      }
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
      setIsRefetching(false);
      isFirstLoad.current = false;
    }
  };

  // useEffect(() => {
  //   fetchStockTakes(filters);
  // }, [filters]);

  useEffect(() => {
    fetchStats(filters);
  }, [filters]);

  useEffect(() => {
    fetchStockTakes(filters, page);
  }, [filters, page]);

  const refetchCurrent = () => {
    fetchStockTakes(filters, page);
    fetchStats(filters);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        !(e.target as HTMLElement).closest(".action-menu-wrapper") &&
        !(e.target as HTMLElement).closest(".action-menu-portal")
      ) {
        setOpenActionMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    const handleScroll = () => setOpenActionMenu(null);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  const renderStatus = (status: string) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === status.toLowerCase());
    if (opt) {
      return (
        <Badge className={`${opt.color} border font-medium px-2 py-0.5 text-xs`}>
          {opt.label}
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 font-medium px-2 py-0.5 text-xs">
        {status}
      </Badge>
    );
  };

  const getProgressPercent = (counted: number, system: number) => {
    if (!system || system === 0) return 0;
    const pct = (counted / system) * 100;
    return Math.min(Math.round(pct * 10) / 10, 100);
  };

  const getVariance = (counted: number, system: number) => {
    return counted - system;
  };

  return (
    <Layout title="Cycle Count" subTitle="Cycle Count Activity" className="w-full">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-slate-900 rounded-md flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 text-white" />
                  </div>
                  <h1 className="text-lg font-semibold text-slate-900">Cycle Count Sessions</h1>
                </div>
                <p className="text-slate-600 text-xs">
                  Monitor and track your inventory cycle count sessions
                </p>
              </div>
              <button
                onClick={handleNewStockTake}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Cycle Count
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

            <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">Total Sessions</p>
                    <p className="text-lg font-semibold text-slate-900">{stats.total_sessions}</p>
                  </div>
                  <Hash className="w-5 h-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">Location Counted / Planned</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {stats.total_counted_location}
                      <span className="text-slate-400 font-normal text-sm"> / {stats.total_planned_location}</span>
                    </p>
                  </div>
                  <MapPin className="w-5 h-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">Qty Counted / Planned</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {stats.total_counted_qty.toLocaleString("id-ID")}
                      <span className="text-slate-400 font-normal text-sm"> / {stats.total_system_qty.toLocaleString("id-ID")}</span>
                    </p>
                  </div>
                  <Package className="w-5 h-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">Item Counted / Planned</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {stats.total_counted_item}
                      <span className="text-slate-400 font-normal text-sm"> / {stats.total_planned_item}</span>
                    </p>
                  </div>
                  <Box className="w-5 h-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>

            {/* <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">Total Sessions</p>
                    <p className="text-lg font-semibold text-slate-900">{data.length}</p>
                  </div>
                  <Hash className="w-5 h-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">Location Counted / Planned</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {data.reduce((sum, item) => sum + (item.counted_location || 0), 0)}
                      <span className="text-slate-400 font-normal text-sm">
                        {" "}/ {data.reduce((sum, item) => sum + (item.planned_location || 0), 0)}
                      </span>
                    </p>
                  </div>
                  <MapPin className="w-5 h-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">Qty Counted / Planned</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {data.reduce((sum, item) => sum + (item.total_counted_qty || 0), 0).toLocaleString("id-ID")}
                      <span className="text-slate-400 font-normal text-sm">
                        {" "}/ {data.reduce((sum, item) => sum + (item.total_system_qty || 0), 0).toLocaleString("id-ID")}
                      </span>
                    </p>
                  </div>
                  <Package className="w-5 h-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">Item Counted / Planned</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {data.reduce((sum, item) => sum + (item.counted_item || 0), 0)}
                      <span className="text-slate-400 font-normal text-sm">
                        {" "}/ {data.reduce((sum, item) => sum + (item.planned_item || 0), 0)}
                      </span>
                    </p>
                  </div>
                  <Box className="w-5 h-5 text-slate-400" />
                </div>
              </CardContent>
            </Card> */}
          </div>

          {/* Filter Bar */}
          {/* <FilterBar filters={filters} onChange={setFilters} /> */}
          <FilterBar filters={filters} onChange={handleFilterChange} />

          {/* Main Table */}
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm overflow-hidden relative">
            {isRefetching && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-white/70 backdrop-blur-[2px]">
                <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-8 py-5 shadow-lg">
                  <div className="relative h-8 w-8">
                    <div className="absolute inset-0 animate-spin rounded-full border-2 border-slate-200" />
                    <div
                      className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-slate-800"
                      style={{ animationDuration: "0.7s" }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">Fetching data...</p>
                    <p className="mt-0.5 text-xs text-slate-400">Applying your filters</p>
                  </div>
                </div>
              </div>
            )}

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 bg-slate-50/50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 px-4">#</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">Session Code</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">Progress</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 text-right">Qty (Counted / System)</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">Created</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12">
                          <div className="flex flex-col items-center justify-center text-center">
                            <Loader2 className="animate-spin w-6 h-6 text-slate-400 mb-2" />
                            <p className="text-slate-500 font-medium text-sm">Loading sessions...</p>
                            <p className="text-slate-400 text-xs">Please wait a moment</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12">
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                              <TrendingUp className="w-6 h-6 text-slate-400" />
                            </div>
                            <p className="text-slate-600 font-medium mb-1 text-sm">No cycle count sessions found</p>
                            <p className="text-slate-400 text-xs">Try adjusting your filters</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.map((stk, index) => (
                        <TableRow
                          key={stk.ID}
                          className="group hover:bg-slate-50/80 transition-all duration-200 border-b border-slate-50 last:border-b-0"
                        >
                          <TableCell className="py-3 px-4">
                            <span className="text-slate-400 font-medium text-xs">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                          </TableCell>
                          <TableCell
                            className="py-3 cursor-pointer"
                            onClick={() => router.push(`/stock-take/progress/${stk.code}`)}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                                <Hash className="w-3 h-3 text-slate-600" />
                              </div>
                              <span className="font-semibold text-slate-900 group-hover:text-slate-700 text-sm">
                                {stk.code}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell
                            className="py-3 cursor-pointer"
                            onClick={() => router.push(`/stock-take/progress/${stk.code}`)}
                          >
                            {renderStatus(stk.status)}
                          </TableCell>

                          <TableCell
                            className="py-3 cursor-pointer"
                            onClick={() => router.push(`/stock-take/progress/${stk.code}`)}
                          >
                            {(() => {
                              const pct = getProgressPercent(stk.total_counted_qty, stk.total_system_qty);
                              const barColor =
                                pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-slate-400";
                              return (
                                <div className="flex items-center gap-2 min-w-[110px]">
                                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${barColor} transition-all`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium text-slate-600 w-10 text-right">{pct}%</span>
                                </div>
                              );
                            })()}
                          </TableCell>

                          <TableCell
                            className="py-3 text-right cursor-pointer"
                            onClick={() => router.push(`/stock-take/progress/${stk.code}`)}
                          >
                            {(() => {
                              const variance = getVariance(stk.total_counted_qty, stk.total_system_qty);
                              return (
                                <div className="flex flex-col items-end">
                                  <span className="text-sm font-semibold text-slate-900">
                                    {stk.total_counted_qty?.toLocaleString("id-ID")}
                                    <span className="text-slate-400 font-normal"> / {stk.total_system_qty?.toLocaleString("id-ID")}</span>
                                  </span>
                                  {variance !== 0 && (
                                    <span className={`text-xs font-medium ${variance < 0 ? "text-red-500" : "text-blue-500"}`}>
                                      {variance > 0 ? "+" : ""}
                                      {variance.toLocaleString("id-ID")}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </TableCell>

                          <TableCell
                            className="py-3 cursor-pointer"
                            onClick={() => router.push(`/stock-take/progress/${stk.code}`)}
                          >
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span className="font-medium text-xs">
                                {format(new Date(stk.created_at), "MMM dd, yyyy")}
                              </span>
                              <span className="text-slate-400 text-xs">
                                {format(new Date(stk.created_at), "HH:mm")}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="py-3">
                            <div className="flex items-center justify-center action-menu-wrapper">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  if (openActionMenu?.id === stk.ID) {
                                    setOpenActionMenu(null);
                                  } else {
                                    const menuWidth = 192;
                                    const menuHeight = 220;
                                    const spaceBelow = window.innerHeight - rect.bottom;
                                    const openUpward = spaceBelow < menuHeight;

                                    let left = rect.right - menuWidth;
                                    if (left < 8) left = 8;
                                    if (left + menuWidth > window.innerWidth - 8) {
                                      left = window.innerWidth - menuWidth - 8;
                                    }

                                    const top = openUpward ? rect.top - menuHeight - 4 : rect.bottom + 4;

                                    setOpenActionMenu({ id: stk.ID, code: stk.code, top, left });
                                  }
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                                title="Actions"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {openActionMenu &&
            typeof window !== "undefined" &&
            createPortal(
              <div
                className="action-menu-portal fixed z-[100] w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1"
                style={{ top: openActionMenu.top, left: openActionMenu.left }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const code = openActionMenu.code;
                    setOpenActionMenu(null);
                    router.push(`/stock-take/progress/${code}`);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ChartBar className="w-3.5 h-3.5 text-blue-600" />
                  View Progress
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const code = openActionMenu.code;
                    setOpenActionMenu(null);
                    router.push(`/stock-take/${code}`);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Box className="w-3.5 h-3.5 text-amber-600" />
                  View Detail / Print
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const code = openActionMenu.code;
                    setOpenActionMenu(null);
                    setConfirmAction({ type: "cancel", code });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5 text-orange-600" />
                  Cancel Session
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const code = openActionMenu.code;
                    setOpenActionMenu(null);
                    setConfirmAction({ type: "close", code });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <LockIcon className="w-3.5 h-3.5 text-slate-600" />
                  Close Session
                </button>
              </div>,
              document.body
            )}

          {/* {data.length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500">
                Showing {data.length} cycle count session{data.length !== 1 ? "s" : ""} • Click any row to view detailed progress
              </p>
            </div>
          )} */}

          {!loading && data.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} sessions
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-400 disabled:opacity-40 disabled:hover:border-slate-200"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-400 disabled:opacity-40 disabled:hover:border-slate-200"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <StockTakeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerate={generateStockTake}
      />

      {confirmAction && (
        <ConfirmModal
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={executeConfirmAction}
          loading={confirmLoading}
          {...confirmModalConfig()}
        />
      )}
    </Layout>
  );
}