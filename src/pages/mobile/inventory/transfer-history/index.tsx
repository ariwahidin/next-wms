"use client";

import { useMemo, useState, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import PageHeader from "@/components/mobile/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    ArrowRight,
    Calendar,
    Check,
    ChevronDown,
    ChevronsUpDown,
    Filter,
    Loader2,
    Search,
    X,
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TransferRecord {
    item_code: string;
    item_name: string;
    from_division: string;
    to_division: string;
    from_location: string;
    to_location: string;
    old_qa_status: string;
    new_qa_status: string;
    qty: number;
    username: string;
    created_by: number;
    created_at: string;
}

type PresetKey = "today" | "this_week" | "this_month" | "custom";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function formatDate(raw?: string): string {
    if (!raw) return "-";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getPresetRange(preset: PresetKey): { from: string; to: string } {
    const today = new Date();
    const todayStr = toDateStr(today);
    if (preset === "today") return { from: todayStr, to: todayStr };
    if (preset === "this_week") {
        const day = today.getDay();
        const diffToMon = day === 0 ? -6 : 1 - day;
        const mon = new Date(today);
        mon.setDate(today.getDate() + diffToMon);
        return { from: toDateStr(mon), to: todayStr };
    }
    if (preset === "this_month") {
        const first = new Date(today.getFullYear(), today.getMonth(), 1);
        return { from: toDateStr(first), to: todayStr };
    }
    return { from: "", to: "" };
}

const PRESETS: { key: PresetKey; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "this_week", label: "This Week" },
    { key: "this_month", label: "This Month" },
    { key: "custom", label: "Custom" },
];

const qaLabel = (status: string) => {
    if (status === "A") return { text: "Good", cls: "bg-green-100 text-green-700" };
    if (status === "H") return { text: "Hold", cls: "bg-yellow-100 text-yellow-700" };
    return { text: status || "-", cls: "bg-gray-100 text-gray-600" };
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, accent = "bg-blue-500" }: { label: string; value: string | number; accent?: string }) => (
    <div className="flex-1 bg-white border border-gray-100 rounded-lg p-2.5 shadow-sm overflow-hidden relative">
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${accent} rounded-l-lg`} />
        <p className="text-xs text-gray-400 truncate pl-1">{label}</p>
        <p className="text-base font-bold text-gray-800 pl-1 leading-tight">{value}</p>
    </div>
);

// ─── Filter Select ────────────────────────────────────────────────────────────

interface FilterSelectProps {
    label: string;
    placeholder: string;
    options: { value: string; label: string; count: number }[];
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;
    allLabel?: string;
    allCount?: number;
}

const FilterSelect = ({
    label, placeholder, options, value, onChange,
    disabled = false, allLabel = "All", allCount,
}: FilterSelectProps) => {
    const [open, setOpen] = useState(false);
    const displayLabel = value === "all" ? allLabel : options.find((o) => o.value === value)?.label ?? value;

    return (
        <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
            <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        disabled={disabled}
                        className={`flex h-9 w-full items-center justify-between rounded-md border border-input px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${disabled
                            ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                            : "bg-white cursor-pointer hover:border-gray-400"}`}
                    >
                        <span className={value === "all" ? "text-gray-400" : "font-semibold text-gray-800"}>{displayLabel}</span>
                        <ChevronsUpDown size={14} className="text-gray-400 shrink-0 ml-2" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white z-50" align="start" sideOffset={4}>
                    <Command>
                        <CommandInput placeholder={placeholder} className="h-9" />
                        <CommandList>
                            <CommandEmpty>No option found.</CommandEmpty>
                            <CommandGroup>
                                <CommandItem value="all" onSelect={() => { onChange("all"); setOpen(false); }} className="cursor-pointer">
                                    <span className={value === "all" ? "font-semibold" : ""}>{allLabel}</span>
                                    <div className="ml-auto flex items-center gap-1.5">
                                        {allCount !== undefined && <span className="text-xs text-gray-400 tabular-nums">{allCount}</span>}
                                        {value === "all" && <Check size={14} className="text-blue-500" />}
                                    </div>
                                </CommandItem>
                                {options.map((opt) => (
                                    <CommandItem key={opt.value} value={opt.value} onSelect={() => { onChange(opt.value); setOpen(false); }} className="cursor-pointer">
                                        <span className={value === opt.value ? "font-semibold" : ""}>{opt.label}</span>
                                        <div className="ml-auto flex items-center gap-1.5">
                                            <span className="text-xs text-gray-400 tabular-nums">{opt.count}</span>
                                            {value === opt.value && <Check size={14} className="text-blue-500" />}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
};

// ─── Filter Chip ──────────────────────────────────────────────────────────────

const FilterChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
    <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-full px-2 py-0.5">
        {label}
        <button type="button" onClick={onRemove} className="text-blue-400 hover:text-blue-600"><X size={10} /></button>
    </span>
);

// ─── Transfer Card ────────────────────────────────────────────────────────────

const TransferCard = ({
    item, measureRef, virtualStart, dataIndex,
}: {
    item: TransferRecord;
    measureRef: (el: Element | null) => void;
    virtualStart: number;
    dataIndex: number;
}) => {
    const oldQa = qaLabel(item.old_qa_status);
    const newQa = qaLabel(item.new_qa_status);

    return (
        <div
            data-index={dataIndex}
            ref={measureRef}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${virtualStart}px)` }}
            className="pb-2"
        >
            <div className="p-3 border border-gray-200 rounded-lg bg-white">

                {/* ── Header: item + date ── */}
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{item.item_code}</p>
                        <p className="text-xs text-gray-500 truncate">{item.item_name}</p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-400 tabular-nums whitespace-nowrap">
                        {formatDate(item.created_at)}
                    </span>
                </div>

                {/* ── From → To ── */}
                <div className="flex items-center gap-1.5 mb-2">
                    <div className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded p-1.5">
                        <p className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">From</p>
                        <p className="text-xs font-mono font-semibold text-gray-800 truncate">{item.from_location || "-"}</p>
                        <p className="text-[10px] text-gray-400 truncate">{item.from_division || "-"}</p>
                    </div>
                    <ArrowRight size={14} className="text-blue-400 shrink-0" />
                    <div className="flex-1 min-w-0 bg-blue-50 border border-blue-200 rounded p-1.5">
                        <p className="text-[10px] text-blue-400 uppercase font-semibold mb-0.5">To</p>
                        <p className="text-xs font-mono font-semibold text-blue-800 truncate">{item.to_location || "-"}</p>
                        <p className="text-[10px] text-blue-500 truncate">{item.to_division || "-"}</p>
                    </div>
                </div>

                {/* ── QA + User ── */}
                <div className="grid grid-cols-2 gap-x-3 text-xs mb-2">
                    <div className="flex items-center gap-1">
                        <span className="text-gray-400">QA:</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${oldQa.cls}`}>{oldQa.text}</span>
                        <ArrowRight size={10} className="text-gray-300" />
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${newQa.cls}`}>{newQa.text}</span>
                    </div>
                    <div className="font-mono"><span className="text-gray-400">User:</span> <span className="text-gray-700">{item.username || "-"}</span></div>
                </div>

                {/* ── Qty footer ── */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Qty Transferred</span>
                    <span className="text-sm font-bold text-gray-800">{item.qty}</span>
                </div>
            </div>
        </div>
    );
};

// ─── Virtual List ─────────────────────────────────────────────────────────────

const VirtualTransferList = ({ items }: { items: TransferRecord[] }) => {
    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 175,
        overscan: 5,
        measureElement:
            typeof window !== "undefined" && navigator.userAgent.indexOf("Firefox") === -1
                ? (el) => el?.getBoundingClientRect().height ?? 175
                : undefined,
    });

    if (items.length === 0) {
        return <div className="text-center text-gray-400 text-sm py-6">No records match the current filter.</div>;
    }

    return (
        <div ref={parentRef} className="overflow-y-auto rounded-lg" style={{ height: "60vh" }}>
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                    <TransferCard
                        key={virtualRow.key}
                        item={items[virtualRow.index]}
                        measureRef={rowVirtualizer.measureElement}
                        virtualStart={virtualRow.start}
                        dataIndex={virtualRow.index}
                    />
                ))}
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TransferHistoryPage() {

    // ── Date range ────────────────────────────────────────────────────────────
    const [activePreset, setActivePreset] = useState<PresetKey>("today");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");

    const dateRange = useMemo(() => {
        if (activePreset !== "custom") return getPresetRange(activePreset);
        return { from: customFrom, to: customTo };
    }, [activePreset, customFrom, customTo]);

    const isDateRangeValid = dateRange.from !== "" && dateRange.to !== "";

    // ── Data ──────────────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<TransferRecord[]>([]);
    const [queriedRange, setQueriedRange] = useState<{ from: string; to: string } | null>(null);

    // ── Filter panel ──────────────────────────────────────────────────────────
    const [showFilterPanel, setShowFilterPanel] = useState(false);

    // ── Cascade filters: User → From Location → To Location ──────────────────
    const [filterUser, setFilterUser] = useState("all");
    const [filterFromLoc, setFilterFromLoc] = useState("all");
    const [filterToLoc, setFilterToLoc] = useState("all");

    const resetAllFilters = () => {
        setFilterUser("all");
        setFilterFromLoc("all");
        setFilterToLoc("all");
    };

    const handleUserChange = (v: string) => { setFilterUser(v); setFilterFromLoc("all"); setFilterToLoc("all"); };
    const handleFromLocChange = (v: string) => { setFilterFromLoc(v); setFilterToLoc("all"); };

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isDateRangeValid) return;
        setLoading(true);
        setResults([]);
        resetAllFilters();
        setShowFilterPanel(false);
        try {
            const response = await api.post(
                "/mobile/inventory/transfer/history",
                { date_from: dateRange.from, date_to: dateRange.to },
                { withCredentials: true }
            );
            const data = response.data;
            if (data.success) {
                setResults(data.data as TransferRecord[]);
                setQueriedRange({ from: dateRange.from, to: dateRange.to });
            }
        } catch (error) {
            console.error("Error fetching transfer history:", error);
        } finally {
            setLoading(false);
        }
    };

    // ── Cascade derived lists ─────────────────────────────────────────────────

    const afterUser = useMemo(() => {
        if (filterUser === "all") return results;
        return results.filter((i) => i.username === filterUser);
    }, [results, filterUser]);

    const afterFromLoc = useMemo(() => {
        if (filterFromLoc === "all") return afterUser;
        return afterUser.filter((i) => i.from_location === filterFromLoc);
    }, [afterUser, filterFromLoc]);

    const filteredItems = useMemo(() => {
        if (filterToLoc === "all") return afterFromLoc;
        return afterFromLoc.filter((i) => i.to_location === filterToLoc);
    }, [afterFromLoc, filterToLoc]);

    // ── Cascade options ───────────────────────────────────────────────────────

    const userOptions = useMemo(() => {
        const map = new Map<string, number>();
        results.forEach((i) => { if (i.username) map.set(i.username, (map.get(i.username) ?? 0) + 1); });
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([value, count]) => ({ value, label: value, count }));
    }, [results]);

    const fromLocOptions = useMemo(() => {
        const map = new Map<string, number>();
        afterUser.forEach((i) => { if (i.from_location) map.set(i.from_location, (map.get(i.from_location) ?? 0) + 1); });
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([value, count]) => ({ value, label: value, count }));
    }, [afterUser]);

    const toLocOptions = useMemo(() => {
        const map = new Map<string, number>();
        afterFromLoc.forEach((i) => { if (i.to_location) map.set(i.to_location, (map.get(i.to_location) ?? 0) + 1); });
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([value, count]) => ({ value, label: value, count }));
    }, [afterFromLoc]);

    // ── Stats ─────────────────────────────────────────────────────────────────

    const totalQty = useMemo(() => filteredItems.reduce((s, i) => s + i.qty, 0), [filteredItems]);
    const distinctItems = useMemo(() => new Set(filteredItems.map((i) => i.item_code)).size, [filteredItems]);
    const activeFilterCount = [filterUser, filterFromLoc, filterToLoc].filter((f) => f !== "all").length;

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <PageHeader title="Transfer History" showBackButton />
            <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-24 max-w-md mx-auto">

                {/* ── Date Range Form ── */}
                <Card>
                    <CardContent className="p-4">
                        <form onSubmit={handleSearch} className="space-y-3">

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                                    <Calendar size={12} /> Date Range
                                </label>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {PRESETS.map((p) => (
                                        <button
                                            key={p.key}
                                            type="button"
                                            onClick={() => setActivePreset(p.key)}
                                            className={`py-1.5 rounded-md text-xs font-medium border transition-colors ${activePreset === p.key
                                                ? "bg-blue-500 border-blue-500 text-white"
                                                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                                                }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {activePreset === "custom" ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500">From</label>
                                        <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="text-sm h-9" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500">To</label>
                                        <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="text-sm h-9" />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 bg-gray-50 border rounded px-3 py-2">
                                    <span className="font-mono font-semibold text-gray-700">{formatDate(dateRange.from)}</span>
                                    <ArrowRight size={12} className="text-gray-400" />
                                    <span className="font-mono font-semibold text-gray-700">{formatDate(dateRange.to)}</span>
                                </div>
                            )}

                            <Button type="submit" className="w-full" disabled={loading || !isDateRangeValid}>
                                {loading
                                    ? <><Loader2 className="animate-spin w-4 h-4 mr-2" />Loading...</>
                                    : <><Search size={16} className="mr-2" />Search</>
                                }
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* ── Loading ── */}
                {loading && (
                    <div className="flex items-center justify-center text-gray-500 text-sm gap-2">
                        <Loader2 className="animate-spin w-4 h-4" />Fetching transfer records...
                    </div>
                )}

                {/* ── Results ── */}
                {!loading && results.length > 0 && (
                    <div className="space-y-3">

                        {/* ── Range badge ── */}
                        {queriedRange && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar size={14} className="text-blue-500 shrink-0" />
                                <span className="font-semibold text-gray-800">{formatDate(queriedRange.from)}</span>
                                <ArrowRight size={12} className="text-gray-400" />
                                <span className="font-semibold text-gray-800">{formatDate(queriedRange.to)}</span>
                            </div>
                        )}

                        {/* ── Stat Cards ── */}
                        <div className="flex gap-2">
                            <StatCard label="Records" value={filteredItems.length} accent="bg-slate-500" />
                            <StatCard label="SKUs" value={distinctItems} accent="bg-violet-500" />
                            <StatCard label="Total Qty" value={totalQty} accent="bg-emerald-500" />
                        </div>

                        {/* ── Filter Toggle ── */}
                        <button
                            type="button"
                            onClick={() => setShowFilterPanel((p) => !p)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${showFilterPanel
                                ? "bg-blue-50 border-blue-300 text-blue-700"
                                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Filter size={15} />
                                <span>Filter</span>
                                {activeFilterCount > 0 && (
                                    <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </div>
                            <ChevronDown size={15} className={`transition-transform ${showFilterPanel ? "rotate-180" : ""}`} />
                        </button>

                        {/* ── Active Chips ── */}
                        {activeFilterCount > 0 && !showFilterPanel && (
                            <div className="flex flex-wrap gap-1.5">
                                {filterUser !== "all" && <FilterChip label={`User: ${filterUser}`} onRemove={() => handleUserChange("all")} />}
                                {filterFromLoc !== "all" && <FilterChip label={`From: ${filterFromLoc}`} onRemove={() => handleFromLocChange("all")} />}
                                {filterToLoc !== "all" && <FilterChip label={`To: ${filterToLoc}`} onRemove={() => setFilterToLoc("all")} />}
                            </div>
                        )}

                        {/* ── Filter Panel ── */}
                        {showFilterPanel && (
                            <Card>
                                <CardContent className="p-3 space-y-3">
                                    <FilterSelect
                                        label="User"
                                        placeholder="Search user..."
                                        options={userOptions}
                                        value={filterUser}
                                        onChange={handleUserChange}
                                        allLabel="All Users"
                                        allCount={results.length}
                                    />
                                    <FilterSelect
                                        label="From Location"
                                        placeholder="Search location..."
                                        options={fromLocOptions}
                                        value={filterFromLoc}
                                        onChange={handleFromLocChange}
                                        disabled={filterUser === "all" && userOptions.length > 1}
                                        allLabel="All From Locations"
                                        allCount={afterUser.length}
                                    />
                                    <FilterSelect
                                        label="To Location"
                                        placeholder="Search location..."
                                        options={toLocOptions}
                                        value={filterToLoc}
                                        onChange={setFilterToLoc}
                                        disabled={filterFromLoc === "all" && fromLocOptions.length > 1}
                                        allLabel="All To Locations"
                                        allCount={afterFromLoc.length}
                                    />
                                    {activeFilterCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={resetAllFilters}
                                            className="w-full text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-md py-1.5 transition-colors"
                                        >
                                            Reset All Filters
                                        </button>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* ── Virtual List ── */}
                        <VirtualTransferList items={filteredItems} />

                    </div>
                )}

                {/* ── Empty state ── */}
                {!loading && results.length === 0 && queriedRange && (
                    <div className="text-center text-gray-400 text-sm py-8">
                        No transfer records found for{" "}
                        <strong className="text-gray-600">
                            {formatDate(queriedRange.from)} – {formatDate(queriedRange.to)}
                        </strong>.
                    </div>
                )}

                {/* ── Initial state ── */}
                {!loading && !queriedRange && (
                    <div className="text-center text-gray-400 text-sm py-8">
                        Select a date range to view transfer history.
                    </div>
                )}

            </div>
        </>
    );
}