/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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
    PackageSearch,
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
import { ParsedQRData, parseQRCode } from "@/utils/qrParser";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventoryItem {
    ID?: number;
    barcode: string;
    division_code?: string;
    serial_number?: string;
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

// ─── QR Parser ────────────────────────────────────────────────────────────────



// ─── Stat Card ────────────────────────────────────────────────────────────────

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

// ─── Toggle Switch ────────────────────────────────────────────────────────────

const ToggleSwitch = ({
    checked,
    onChange,
    labelOff = "Off",
    labelOn = "On",
}: {
    checked: boolean;
    onChange: (val: boolean) => void;
    labelOff?: string;
    labelOn?: string;
}) => (
    <div className="flex items-center gap-2 text-sm">
        <span className={!checked ? "font-semibold text-gray-800" : "text-gray-400"}>{labelOff}</span>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-blue-500" : "bg-gray-300"}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
        </button>
        <span className={checked ? "font-semibold text-gray-800" : "text-gray-400"}>{labelOn}</span>
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

// ─── Item Card ────────────────────────────────────────────────────────────────

interface ItemCardProps {
    item: InventoryItem;
    measureRef: (el: Element | null) => void;
    virtualStart: number;
    dataIndex: number;
}

const ItemCard = ({ item, measureRef, virtualStart, dataIndex }: ItemCardProps) => (
    <div
        data-index={dataIndex}
        ref={measureRef}
        style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transform: `translateY(${virtualStart}px)`,
        }}
        className="pb-2"
    >
        <div
            className={`p-3 border rounded-lg ${item.qa_status === "A"
                ? "bg-green-50 border-green-200"
                : "bg-white border-gray-200"
                }`}
        >
            {/* ── Header row ── */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{item.location}</p>
                    <p className="text-xs text-gray-500 truncate">{item.pallet}</p>
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
                <div><span className="text-gray-400">EAN:</span> <span className="text-gray-700">{item.ean_display ?? "-"}</span></div>
                <div><span className="text-gray-400">Division:</span> <span className="text-gray-700">{item.division_code ?? "-"}</span></div>
                <div><span className="text-gray-400">Pallet:</span> <span className="text-gray-700">{item.pallet ?? "-"}</span></div>
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
                    {item.qty_display}{" "}
                    <span className="font-normal text-gray-500">{item.uom_display}</span>
                </span>
            </div>
        </div>
    </div>
);

// ─── Virtual Item List ────────────────────────────────────────────────────────

interface VirtualItemListProps {
    items: InventoryItem[];
}

const VirtualItemList = ({ items }: VirtualItemListProps) => {
    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 160,
        overscan: 5,
        measureElement:
            typeof window !== "undefined" &&
                navigator.userAgent.indexOf("Firefox") === -1
                ? (el) => el?.getBoundingClientRect().height ?? 160
                : undefined,
    });

    if (items.length === 0) {
        return (
            <div className="text-center text-gray-400 text-sm py-6">
                No items match the current filter.
            </div>
        );
    }

    return (
        <div
            ref={parentRef}
            className="overflow-y-auto rounded-lg"
            style={{ height: "60vh" }}
        >
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                    <ItemCard
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

export default function ItemQueryPage() {
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<InventoryItem[]>([]);
    const [queriedItem, setQueriedItem] = useState<{ code: string; name: string } | null>(null);

    // ── QR mode ───────────────────────────────────────────────────────────────
    const [isQrMode, setIsQrMode] = useState(false);
    const [qrRawInput, setQrRawInput] = useState("");
    const [parsedQR, setParsedQR] = useState<ParsedQRData | null>(null);

    // ── Filter panel ──────────────────────────────────────────────────────────
    const [showFilterPanel, setShowFilterPanel] = useState(false);

    // ── Cascade filters ───────────────────────────────────────────────────────
    const [filterDivision, setFilterDivision] = useState("all");
    const [filterLocation, setFilterLocation] = useState("all");
    const [filterRecDate, setFilterRecDate] = useState("all");
    const [filterPallet, setFilterPallet] = useState("all");

    // ── Reset helpers ─────────────────────────────────────────────────────────
    const resetAllFilters = () => {
        setFilterDivision("all");
        setFilterLocation("all");
        setFilterRecDate("all");
        setFilterPallet("all");
    };

    const handleDivisionChange = (v: string) => { setFilterDivision(v); setFilterLocation("all"); setFilterRecDate("all"); setFilterPallet("all"); };
    const handleLocationChange = (v: string) => { setFilterLocation(v); setFilterRecDate("all"); setFilterPallet("all"); };
    const handleRecDateChange = (v: string) => { setFilterRecDate(v); setFilterPallet("all"); };

    // ── QR helpers ────────────────────────────────────────────────────────────
    const handleQrInputChange = (raw: string) => {
        setQrRawInput(raw);
        const parsed = parseQRCode(raw);
        if (parsed) {
            setParsedQR(parsed);
            setSearch(parsed.sku ?? parsed.ean ?? "");
        } else {
            setParsedQR(null);
            setSearch("");
        }
    };

    const handleModeToggle = (qr: boolean) => {
        setIsQrMode(qr);
        setQrRawInput("");
        setParsedQR(null);
        setSearch("");
        setResults([]);
        setQueriedItem(null);
        resetAllFilters();
        setTimeout(() => {
            document.getElementById(qr ? "qr-input" : "search-input")?.focus();
        }, 50);
    };

    const clearQr = () => {
        setQrRawInput("");
        setParsedQR(null);
        setSearch("");
        setResults([]);
        setQueriedItem(null);
        resetAllFilters();
        document.getElementById("qr-input")?.focus();
    };

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!search.trim()) return;

        setLoading(true);
        setResults([]);
        setQueriedItem(null);
        resetAllFilters();
        setShowFilterPanel(false);

        try {
            const response = await api.post(
                "/mobile/inventory/item/barcode",
                { barcode: search.trim() },
                { withCredentials: true }
            );
            const data = response.data;
            if (data.success) {
                const mapped: InventoryItem[] = (data.data as any[]).map((item) => ({
                    ID: item.ID,
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
                setResults(mapped);
                // Ambil item info dari record pertama
                if (mapped.length > 0) {
                    setQueriedItem({
                        code: mapped[0].item_code ?? search.trim(),
                        name: mapped[0].item_name ?? "",
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // ── Cascade derived lists ─────────────────────────────────────────────────

    const afterDivision = useMemo(() => {
        if (filterDivision === "all") return results;
        return results.filter((i) => i.division_code === filterDivision);
    }, [results, filterDivision]);

    const afterLocation = useMemo(() => {
        if (filterLocation === "all") return afterDivision;
        return afterDivision.filter((i) => i.location === filterLocation);
    }, [afterDivision, filterLocation]);

    const afterRecDate = useMemo(() => {
        if (filterRecDate === "all") return afterLocation;
        return afterLocation.filter((i) => (i.rec_date ?? "") === filterRecDate);
    }, [afterLocation, filterRecDate]);

    const filteredItems = useMemo(() => {
        if (filterPallet === "all") return afterRecDate;
        return afterRecDate.filter((i) => i.pallet === filterPallet);
    }, [afterRecDate, filterPallet]);

    // ── Cascade options ───────────────────────────────────────────────────────

    const divisionOptions = useMemo(() => {
        const map = new Map<string, number>();
        results.forEach((i) => { if (i.division_code) map.set(i.division_code, (map.get(i.division_code) ?? 0) + (i.qty_display ?? 0)); });
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([value, qty]) => ({ value, label: value, qty }));
    }, [results]);

    const locationOptions = useMemo(() => {
        const map = new Map<string, number>();
        afterDivision.forEach((i) => { if (i.location) map.set(i.location, (map.get(i.location) ?? 0) + (i.qty_display ?? 0)); });
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([value, qty]) => ({ value, label: value, qty }));
    }, [afterDivision]);

    const recDateOptions = useMemo(() => {
        const map = new Map<string, number>();
        afterLocation.forEach((i) => { if (i.rec_date) map.set(i.rec_date, (map.get(i.rec_date) ?? 0) + (i.qty_display ?? 0)); });
        return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0])).map(([value, qty]) => ({ value, label: formatRecDate(value), qty }));
    }, [afterLocation]);

    const palletOptions = useMemo(() => {
        const map = new Map<string, number>();
        afterRecDate.forEach((i) => { if (i.pallet) map.set(i.pallet, (map.get(i.pallet) ?? 0) + (i.qty_display ?? 0)); });
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([value, qty]) => ({ value, label: value, qty }));
    }, [afterRecDate]);

    // ── Stats ─────────────────────────────────────────────────────────────────

    const distinctLocations = useMemo(() => new Set(filteredItems.map((i) => i.location).filter(Boolean)).size, [filteredItems]);
    const totalQty = useMemo(() => filteredItems.reduce((s, i) => s + (i.qty_display ?? 0), 0), [filteredItems]);
    const activeFilterCount = [filterDivision, filterLocation, filterRecDate, filterPallet].filter((f) => f !== "all").length;

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <PageHeader title="Item Query" showBackButton />
            <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-24 max-w-md mx-auto">

                {/* ── Search Form ── */}
                <Card>
                    <CardContent className="p-4">
                        <form onSubmit={handleSearch} className="space-y-3">

                            {/* Mode toggle */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Scan Mode</span>
                                <ToggleSwitch
                                    checked={isQrMode}
                                    onChange={handleModeToggle}
                                    labelOff="EAN / SKU"
                                    labelOn="QR Code"
                                />
                            </div>

                            {/* EAN / SKU mode */}
                            {!isQrMode && (
                                <div className="relative">
                                    <PackageSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        id="search-input"
                                        placeholder="Scan or type item code / EAN..."
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
                                            onClick={() => { setSearch(""); setResults([]); setQueriedItem(null); resetAllFilters(); }}
                                        >
                                            <XCircle size={16} />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* QR mode */}
                            {isQrMode && (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Input
                                            id="qr-input"
                                            autoComplete="off"
                                            className="font-mono text-xs pr-8"
                                            placeholder="Scan QR code here..."
                                            value={qrRawInput}
                                            onChange={(e) => handleQrInputChange(e.target.value)}
                                            autoFocus
                                        />
                                        {qrRawInput && (
                                            <button
                                                type="button"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                onClick={clearQr}
                                            >
                                                <XCircle size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {/* QR Preview */}
                                    {parsedQR && (
                                        <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs font-mono space-y-0.5">
                                            <div>
                                                <span className="text-gray-500">Type:</span>{" "}
                                                <span className={parsedQR.labelType === "UNIT" ? "text-purple-600 font-semibold" : "text-blue-600 font-semibold"}>
                                                    {parsedQR.labelType === "UNIT" ? "Unit / Serial" : "Master Carton"}
                                                </span>
                                            </div>
                                            {parsedQR.sku && <div><span className="text-gray-500">SKU:</span> {parsedQR.sku}</div>}
                                            {parsedQR.ean && <div><span className="text-gray-500">EAN:</span> {parsedQR.ean}</div>}
                                            {parsedQR.product && <div><span className="text-gray-500">Product:</span> {parsedQR.product}</div>}
                                            {parsedQR.serial && <div><span className="text-gray-500">Serial:</span> {parsedQR.serial}</div>}
                                            {parsedQR.cartonSerial && <div><span className="text-gray-500">Carton:</span> {parsedQR.cartonSerial}</div>}
                                            {parsedQR.batch && <div><span className="text-gray-500">Batch:</span> {parsedQR.batch}</div>}
                                            {parsedQR.mfgDate && <div><span className="text-gray-500">MFG Date:</span> {parsedQR.mfgDate}</div>}
                                            {parsedQR.qtyPerCarton && <div><span className="text-gray-500">Qty/Carton:</span> {parsedQR.qtyPerCarton}</div>}
                                        </div>
                                    )}

                                    {qrRawInput && !parsedQR && (
                                        <p className="text-xs text-red-500">
                                            Format QR tidak dikenali. Pastikan format: (1)SKU=... atau 12-segment dash
                                        </p>
                                    )}

                                    {search && (
                                        <div className="text-xs text-gray-500 bg-gray-50 border rounded px-2 py-1.5">
                                            Search by: <span className="font-mono font-semibold text-gray-800">{search}</span>
                                        </div>
                                    )}
                                </div>
                            )}

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
                        <Loader2 className="animate-spin w-4 h-4" />Scanning item...
                    </div>
                )}

                {/* ── Results ── */}
                {!loading && results.length > 0 && (
                    <div className="space-y-3">

                        {/* ── Item badge ── */}
                        {queriedItem && (
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                <PackageSearch size={14} className="text-blue-500 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                    <span className="font-bold text-gray-800">{queriedItem.code}</span>
                                    {queriedItem.name && (
                                        <p className="text-xs text-gray-500 truncate">{queriedItem.name}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Stat Cards ── */}
                        <div className="flex gap-2">
                            <StatCard label="Records" value={filteredItems.length} accent="bg-slate-500" />
                            <StatCard label="Locations" value={distinctLocations} accent="bg-violet-500" />
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
                                {filterLocation !== "all" && <FilterChip label={`Loc: ${filterLocation}`} onRemove={() => handleLocationChange("all")} />}
                                {filterRecDate !== "all" && <FilterChip label={`Rcv: ${formatRecDate(filterRecDate)}`} onRemove={() => handleRecDateChange("all")} />}
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
                                        label="Location"
                                        placeholder="Search location..."
                                        options={locationOptions}
                                        value={filterLocation}
                                        onChange={handleLocationChange}
                                        disabled={filterDivision === "all" && divisionOptions.length > 1}
                                        allLabel="All Locations"
                                        allQty={afterDivision.reduce((s, i) => s + (i.qty_display ?? 0), 0)}
                                    />
                                    <FilterSelect
                                        label="Receive Date"
                                        placeholder="Search date..."
                                        options={recDateOptions}
                                        value={filterRecDate}
                                        onChange={handleRecDateChange}
                                        disabled={filterLocation === "all" && locationOptions.length > 1}
                                        allLabel="All Dates"
                                        allQty={afterLocation.reduce((s, i) => s + (i.qty_display ?? 0), 0)}
                                    />
                                    <FilterSelect
                                        label="Pallet"
                                        placeholder="Search pallet..."
                                        options={palletOptions}
                                        value={filterPallet}
                                        onChange={setFilterPallet}
                                        disabled={filterRecDate === "all" && recDateOptions.length > 1}
                                        allLabel="All Pallets"
                                        allQty={afterRecDate.reduce((s, i) => s + (i.qty_display ?? 0), 0)}
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

                        {/* ── Virtual Item List ── */}
                        <VirtualItemList items={filteredItems} />

                    </div>
                )}

                {/* ── Empty state ── */}
                {!loading && results.length === 0 && queriedItem && (
                    <div className="text-center text-gray-400 text-sm py-8">
                        No inventory found for item <strong className="text-gray-600">{queriedItem.code}</strong>.
                    </div>
                )}

                {/* ── Initial state ── */}
                {!loading && !queriedItem && (
                    <div className="text-center text-gray-400 text-sm py-8">
                        Scan or enter an item code / EAN to view its stock.
                    </div>
                )}

            </div>
        </>
    );
}