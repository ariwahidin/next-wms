/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/mobile/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Check,
    ChevronDown,
    ChevronsUpDown,
    Filter,
    Loader2,
    MapPin,
    Search,
    X,
    XCircle,
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

interface InventoryItem {
    id?: number;
    barcode: string;
    division_code?: string;
    serial_number: string;
    pallet: string;
    location: string;
    qa_status: string;
    whs_code: string;
    qty_available: number;
    rec_date?: string;
    prod_date?: string;
    exp_date?: string;
    lot_number?: string;
    qty_display?: number;
    uom_display?: string;
    ean_display?: string;
    owner_code?: string;
    item_code?: string;
    item_name?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRecDate(raw?: string): string {
    if (!raw) return "-";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Mini Stat Card ───────────────────────────────────────────────────────────

interface StatCardProps {
    label: string;
    value: string | number;
    accent?: string;
}

const StatCard = ({ label, value, accent = "bg-blue-500" }: StatCardProps) => (
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
    options: { value: string; label: string; qty: number }[];
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;
    allLabel?: string;
    allQty?: number;
}

const FilterSelect = ({
    label,
    placeholder,
    options,
    value,
    onChange,
    disabled = false,
    allLabel = "All",
    allQty,
}: FilterSelectProps) => {
    const [open, setOpen] = useState(false);
    const displayLabel =
        value === "all" ? allLabel : options.find((o) => o.value === value)?.label ?? value;

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
                                : "bg-white cursor-pointer hover:border-gray-400"
                            }`}
                    >
                        <span className={value === "all" ? "text-gray-400" : "font-semibold text-gray-800"}>
                            {displayLabel}
                        </span>
                        <ChevronsUpDown size={14} className="text-gray-400 shrink-0 ml-2" />
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0 bg-white z-50"
                    align="start"
                    sideOffset={4}
                >
                    <Command>
                        <CommandInput placeholder={placeholder} className="h-9" />
                        <CommandList>
                            <CommandEmpty>No option found.</CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                    value="all"
                                    onSelect={() => { onChange("all"); setOpen(false); }}
                                    className="cursor-pointer"
                                >
                                    <span className={value === "all" ? "font-semibold" : ""}>{allLabel}</span>
                                    <div className="ml-auto flex items-center gap-1.5">
                                        {allQty !== undefined && (
                                            <span className="text-xs text-gray-400 tabular-nums">{allQty}</span>
                                        )}
                                        {value === "all" && <Check size={14} className="text-blue-500" />}
                                    </div>
                                </CommandItem>
                                {options.map((opt) => (
                                    <CommandItem
                                        key={opt.value}
                                        value={opt.value}
                                        onSelect={() => { onChange(opt.value); setOpen(false); }}
                                        className="cursor-pointer"
                                    >
                                        <span className={value === opt.value ? "font-semibold" : ""}>{opt.label}</span>
                                        <div className="ml-auto flex items-center gap-1.5">
                                            <span className="text-xs text-gray-400 tabular-nums">{opt.qty}</span>
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

interface FilterChipProps {
    label: string;
    onRemove: () => void;
}

const FilterChip = ({ label, onRemove }: FilterChipProps) => (
    <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-full px-2 py-0.5">
        {label}
        <button type="button" onClick={onRemove} className="text-blue-400 hover:text-blue-600">
            <X size={10} />
        </button>
    </span>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LocationQueryPage() {
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<InventoryItem[]>([]);
    const [queriedLocation, setQueriedLocation] = useState("");

    // ── Filter panel ─────────────────────────────────────────────────────────────
    const [showFilterPanel, setShowFilterPanel] = useState(false);

    // ── Cascade filters ───────────────────────────────────────────────────────────
    const [filterDivision, setFilterDivision] = useState("all");
    const [filterRecDate, setFilterRecDate] = useState("all");
    const [filterItem, setFilterItem] = useState("all");
    const [filterPallet, setFilterPallet] = useState("all");

    // ── Reset helpers ─────────────────────────────────────────────────────────────
    const resetAllFilters = () => {
        setFilterDivision("all");
        setFilterRecDate("all");
        setFilterItem("all");
        setFilterPallet("all");
    };

    const handleDivisionChange = (v: string) => { setFilterDivision(v); setFilterRecDate("all"); setFilterItem("all"); setFilterPallet("all"); };
    const handleRecDateChange = (v: string) => { setFilterRecDate(v); setFilterItem("all"); setFilterPallet("all"); };
    const handleItemChange = (v: string) => { setFilterItem(v); setFilterPallet("all"); };

    // ── Fetch ─────────────────────────────────────────────────────────────────────
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!search.trim()) return;

        setLoading(true);
        setResults([]);
        resetAllFilters();
        setShowFilterPanel(false);

        try {
            const response = await api.post(
                "/mobile/inventory/location/barcode",
                { location: search.trim() },
                { withCredentials: true }
            );
            const data = await response.data;
            if (data.success) {
                const mapped: InventoryItem[] = (data.data as any[]).map((item) => ({
                    id: item.ID,
                    barcode: item.barcode,
                    division_code: item.division_code,
                    serial_number: item.serial_number,
                    pallet: item.pallet,
                    location: item.location,
                    qa_status: item.qa_status,
                    whs_code: item.whs_code,
                    qty_available: item.qty_available,
                    rec_date: item.rec_date,
                    prod_date: item.prod_date,
                    exp_date: item.exp_date,
                    lot_number: item.lot_number,
                    qty_display: item.qty_display,
                    uom_display: item.uom_display,
                    ean_display: item.ean_display,
                    owner_code: item.owner_code,
                    item_code: item.item_code,
                    item_name: item.item_name,
                }));
                setQueriedLocation(search.trim());
                setResults(mapped);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // ── Cascade derived lists ─────────────────────────────────────────────────────

    const afterDivision = useMemo(() => {
        if (filterDivision === "all") return results;
        return results.filter((i) => i.division_code === filterDivision);
    }, [results, filterDivision]);

    const afterRecDate = useMemo(() => {
        if (filterRecDate === "all") return afterDivision;
        return afterDivision.filter((i) => (i.rec_date ?? "") === filterRecDate);
    }, [afterDivision, filterRecDate]);

    const afterItem = useMemo(() => {
        if (filterItem === "all") return afterRecDate;
        return afterRecDate.filter((i) => i.item_code === filterItem);
    }, [afterRecDate, filterItem]);

    const filteredItems = useMemo(() => {
        if (filterPallet === "all") return afterItem;
        return afterItem.filter((i) => i.pallet === filterPallet);
    }, [afterItem, filterPallet]);

    // ── Cascade options ───────────────────────────────────────────────────────────

    const divisionOptions = useMemo(() => {
        const map = new Map<string, number>();
        results.forEach((i) => { if (i.division_code) map.set(i.division_code, (map.get(i.division_code) ?? 0) + (i.qty_display ?? 0)); });
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([value, qty]) => ({ value, label: value, qty }));
    }, [results]);

    const recDateOptions = useMemo(() => {
        const map = new Map<string, number>();
        afterDivision.forEach((i) => { if (i.rec_date) map.set(i.rec_date, (map.get(i.rec_date) ?? 0) + (i.qty_display ?? 0)); });
        return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0])).map(([value, qty]) => ({ value, label: formatRecDate(value), qty }));
    }, [afterDivision]);

    const itemOptions = useMemo(() => {
        const nameMap = new Map<string, string>();
        const qtyMap = new Map<string, number>();
        afterRecDate.forEach((i) => {
            if (i.item_code) {
                nameMap.set(i.item_code, i.item_name ?? i.item_code);
                qtyMap.set(i.item_code, (qtyMap.get(i.item_code) ?? 0) + (i.qty_display ?? 0));
            }
        });
        return Array.from(nameMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([value, name]) => ({
            value, label: `${value} — ${name}`, qty: qtyMap.get(value) ?? 0,
        }));
    }, [afterRecDate]);

    const palletOptions = useMemo(() => {
        const map = new Map<string, number>();
        afterItem.forEach((i) => { if (i.pallet) map.set(i.pallet, (map.get(i.pallet) ?? 0) + (i.qty_display ?? 0)); });
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([value, qty]) => ({ value, label: value, qty }));
    }, [afterItem]);

    // ── Stats ─────────────────────────────────────────────────────────────────────

    const distinctSKUs = useMemo(() => new Set(filteredItems.map((i) => i.item_code).filter(Boolean)).size, [filteredItems]);
    const totalQty = useMemo(() => filteredItems.reduce((s, i) => s + (i.qty_display ?? 0), 0), [filteredItems]);
    const activeFilterCount = [filterDivision, filterRecDate, filterItem, filterPallet].filter((f) => f !== "all").length;

    // ─── Render ───────────────────────────────────────────────────────────────────

    return (
        <>
            <PageHeader title="Location Query" showBackButton />
            <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-24 max-w-md mx-auto">

                {/* ── Search Form ── */}
                <Card>
                    <CardContent className="p-4">
                        <form onSubmit={handleSearch} className="space-y-3">
                            <div className="relative">
                                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Scan or type location..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 pr-9"
                                    autoComplete="off"
                                    autoFocus
                                />
                                {search && (
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        onClick={() => { setSearch(""); setResults([]); resetAllFilters(); }}
                                    >
                                        <XCircle size={16} />
                                    </button>
                                )}
                            </div>
                            <Button type="submit" className="w-full" disabled={loading || !search.trim()}>
                                {loading
                                    ? <><Loader2 className="animate-spin w-4 h-4 mr-2" />Searching...</>
                                    : <><Search size={16} className="mr-2" />Search</>
                                }
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* ── Loading ── */}
                {loading && (
                    <div className="flex items-center justify-center text-gray-500 text-sm gap-2">
                        <Loader2 className="animate-spin w-4 h-4" />Scanning location...
                    </div>
                )}

                {/* ── Results ── */}
                {!loading && results.length > 0 && (
                    <div className="space-y-3">

                        {/* ── Location badge ── */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin size={14} className="text-blue-500 shrink-0" />
                            <span>Location</span>
                            <span className="font-bold text-gray-800">{queriedLocation}</span>
                        </div>

                        {/* ── Stat Cards ── */}
                        <div className="flex gap-2">
                            <StatCard label="Records" value={filteredItems.length} accent="bg-slate-500" />
                            <StatCard label="SKUs" value={distinctSKUs} accent="bg-violet-500" />
                            <StatCard label={`Qty (${filteredItems[0]?.uom_display ?? ""})`} value={totalQty} accent="bg-emerald-500" />
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

                        {/* ── Active Chips (panel closed) ── */}
                        {activeFilterCount > 0 && !showFilterPanel && (
                            <div className="flex flex-wrap gap-1.5">
                                {filterDivision !== "all" && <FilterChip label={`Div: ${filterDivision}`} onRemove={() => handleDivisionChange("all")} />}
                                {filterRecDate !== "all" && <FilterChip label={`Rcv: ${formatRecDate(filterRecDate)}`} onRemove={() => handleRecDateChange("all")} />}
                                {filterItem !== "all" && <FilterChip label={`Item: ${filterItem}`} onRemove={() => handleItemChange("all")} />}
                                {filterPallet !== "all" && <FilterChip label={`Pallet: ${filterPallet}`} onRemove={() => setFilterPallet("all")} />}
                            </div>
                        )}

                        {/* ── Filter Panel ── */}
                        {showFilterPanel && (
                            <Card>
                                <CardContent className="p-3 space-y-3">
                                    <FilterSelect
                                        label="Division"
                                        placeholder="Search division..."
                                        options={divisionOptions}
                                        value={filterDivision}
                                        onChange={handleDivisionChange}
                                        allLabel="All Divisions"
                                        allQty={results.reduce((s, i) => s + (i.qty_display ?? 0), 0)}
                                    />
                                    <FilterSelect
                                        label="Receive Date"
                                        placeholder="Search date..."
                                        options={recDateOptions}
                                        value={filterRecDate}
                                        onChange={handleRecDateChange}
                                        disabled={filterDivision === "all" && divisionOptions.length > 1}
                                        allLabel="All Dates"
                                        allQty={afterDivision.reduce((s, i) => s + (i.qty_display ?? 0), 0)}
                                    />
                                    <FilterSelect
                                        label="Item / SKU"
                                        placeholder="Search item..."
                                        options={itemOptions}
                                        value={filterItem}
                                        onChange={handleItemChange}
                                        allLabel="All Items"
                                        allQty={afterRecDate.reduce((s, i) => s + (i.qty_display ?? 0), 0)}
                                    />
                                    <FilterSelect
                                        label="Pallet"
                                        placeholder="Search pallet..."
                                        options={palletOptions}
                                        value={filterPallet}
                                        onChange={setFilterPallet}
                                        disabled={filterItem === "all" && itemOptions.length > 1}
                                        allLabel="All Pallets"
                                        allQty={afterItem.reduce((s, i) => s + (i.qty_display ?? 0), 0)}
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

                        {/* ── Item Cards ── */}
                        <div className="space-y-2">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-3 border rounded-lg ${item.qa_status === "A"
                                                ? "bg-green-50 border-green-200"
                                                : "bg-white border-gray-200"
                                            }`}
                                    >
                                        {/* ── Header row ── */}
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-800 truncate">{item.item_code}</p>
                                                <p className="text-xs text-gray-500 truncate">{item.item_name}</p>
                                            </div>
                                            <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${item.qa_status === "A"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                                }`}>
                                                {item.qa_status === "A" ? "Good" : item.qa_status}
                                            </span>
                                        </div>

                                        {/* ── Detail grid ── */}
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs font-mono">
                                            <div><span className="text-gray-400">EAN:</span> <span className="text-gray-700">{item.ean_display}</span></div>
                                            <div><span className="text-gray-400">Division:</span> <span className="text-gray-700">{item.division_code ?? "-"}</span></div>
                                            <div><span className="text-gray-400">Pallet:</span> <span className="text-gray-700">{item.pallet}</span></div>
                                            <div><span className="text-gray-400">Whs:</span> <span className="text-gray-700">{item.whs_code}</span></div>
                                            <div><span className="text-gray-400">Rcv Date:</span> <span className="text-gray-700">{formatRecDate(item.rec_date)}</span></div>
                                            <div><span className="text-gray-400">Lot:</span> <span className="text-gray-700">{item.lot_number ?? "-"}</span></div>
                                            <div><span className="text-gray-400">Exp Date:</span> <span className="text-gray-700">{item.exp_date ?? "-"}</span></div>
                                            <div><span className="text-gray-400">Prod Date:</span> <span className="text-gray-700">{item.prod_date ?? "-"}</span></div>
                                        </div>

                                        {/* ── Qty footer ── */}
                                        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                                            <span className="text-xs text-gray-400">Available Qty</span>
                                            <span className="text-sm font-bold text-gray-800">
                                                {item.qty_display} <span className="font-normal text-gray-500">{item.uom_display}</span>
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-400 text-sm py-6">
                                    No items match the current filter.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Empty state ── */}
                {!loading && results.length === 0 && queriedLocation && (
                    <div className="text-center text-gray-400 text-sm py-8">
                        No inventory found for location <strong className="text-gray-600">{queriedLocation}</strong>.
                    </div>
                )}

                {/* ── Initial state ── */}
                {!loading && !queriedLocation && (
                    <div className="text-center text-gray-400 text-sm py-8">
                        Scan or enter a location to view its inventory.
                    </div>
                )}

            </div>
        </>
    );
}