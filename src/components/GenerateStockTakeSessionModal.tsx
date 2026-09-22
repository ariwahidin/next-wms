"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Grid, Loader2, Package, Plus, RotateCcw, X } from "lucide-react";
import api from "@/lib/api";

type Batch = { code: string; owner_code: string; description?: string; status: string };
type Location = { row?: string; Row?: string; bay?: string; Bay?: string; level?: string; Level?: string; bin?: string; Bin?: string; area?: string; Area?: string };
type Division = { code?: string; Code?: string; name?: string; Name?: string };
type Filters = { area: string; fromRow: string; toRow: string; fromBay: string; toBay: string; fromLevel: string; toLevel: string; fromBin: string; toBin: string };
type Props = { open: boolean; batch: Batch; onClose: () => void; onGenerated?: () => void | Promise<void> };

const read = (obj: any, lower: string, upper: string) => obj?.[lower] ?? obj?.[upper] ?? "";
const unique = (items: Location[], lower: string, upper: string) => [...new Set(items.map((x) => String(read(x, lower, upper))).filter(Boolean))].sort();

export default function GenerateStockTakeSessionModal({ open, batch, onClose, onGenerated }: Props) {
    const [locations, setLocations] = useState<Location[]>([]);
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [divisionOpen, setDivisionOpen] = useState(false);
    const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
    const [filters, setFilters] = useState<Filters>({ area: "", fromRow: "", toRow: "", fromBay: "", toBay: "", fromLevel: "", toLevel: "", fromBin: "", toBin: "" });

    const areas = useMemo(() => unique(locations, "area", "Area"), [locations]);
    const rows = useMemo(() => unique(locations, "row", "Row"), [locations]);
    const bays = useMemo(() => unique(locations, "bay", "Bay"), [locations]);
    const levels = useMemo(() => unique(locations, "level", "Level"), [locations]);
    const bins = useMemo(() => unique(locations, "bin", "Bin"), [locations]);
    const divisionOptions = useMemo(() => divisions.map((x) => ({ code: String(x.code ?? x.Code ?? "").trim(), name: String(x.name ?? x.Name ?? "").trim() })).filter((x) => x.code).sort((a, b) => a.code.localeCompare(b.code)), [divisions]);

    const divisionLabel = selectedDivisions.includes("ALL") ? "ALL Divisions" : selectedDivisions.length === 0 ? "Select division" : selectedDivisions.length === 1 ? selectedDivisions[0] : `${selectedDivisions.length} divisions selected`;

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const [locationRes, divisionRes] = await Promise.all([
                    api.get("/stock-take/locations", { withCredentials: true }),
                    api.get("/divisions", { withCredentials: true }),
                ]);
                if (cancelled) return;
                if (locationRes.data?.success) setLocations(locationRes.data.data ?? []);
                if (divisionRes.data?.success) setDivisions(Array.isArray(divisionRes.data.data) ? divisionRes.data.data : []);
            } catch (error) {
                console.error("Failed to load generation data", error);
                alert("Failed to load locations or divisions");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [open]);

    useEffect(() => { if (!open) setDivisionOpen(false); }, [open]);

    const setField = (field: keyof Filters, value: string) => setFilters((prev) => ({ ...prev, [field]: value }));
    const reset = () => {
        setFilters({ area: "", fromRow: "", toRow: "", fromBay: "", toBay: "", fromLevel: "", toLevel: "", fromBin: "", toBin: "" });
        setSelectedDivisions([]);
    };
    const toggleDivision = (code: string) => {
        if (code === "ALL") return setSelectedDivisions((prev) => prev.includes("ALL") ? [] : ["ALL"]);
        setSelectedDivisions((prev) => {
            const current = prev.filter((x) => x !== "ALL");
            return current.includes(code) ? current.filter((x) => x !== code) : [...current, code];
        });
    };

    const generate = async (mode: "close" | "new") => {
        if (generating) return;
        setGenerating(true);
        try {
            const response = await api.post("/stock-take/generate", {
                filters: {
                    batchCode: batch.code,
                    ownerCode: batch.owner_code,
                    ...filters,
                    // Temporary format until backend is updated: ALL or comma-separated codes.
                    divisionCode: selectedDivisions.includes("ALL") ? "ALL" : selectedDivisions.join(","),
                },
            }, { withCredentials: true });
            if (!response.data?.success) throw new Error(response.data?.message || "Failed to generate session");
            await onGenerated?.();
            if (mode === "close") onClose();
            else reset();
        } catch (error: any) {
            alert(error?.response?.data?.message || error?.message || "Failed to generate stock take session");
        } finally { setGenerating(false); }
    };

    if (!open) return null;

    const ranges: Array<[string, keyof Filters, keyof Filters, string[]]> = [
        ["Row", "fromRow", "toRow", rows], ["Bay", "fromBay", "toBay", bays], ["Level", "fromLevel", "toLevel", levels], ["Bin", "fromBin", "toBin", bins],
    ];

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !generating) {
                    onClose();
                }
            }}
        >
            <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Generate Stock Take Session
                        </h2>

                        <p className="text-xs text-slate-500">
                            Create a session inside <b>{batch.code}</b>.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={generating}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                    {loading ? (
                        <div className="flex min-h-[320px] items-center justify-center gap-2 text-sm text-slate-500">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Loading locations and divisions...
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Batch Information */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="rounded-lg border bg-slate-50 p-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                        Batch
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {batch.code}
                                    </p>

                                    {batch.description && (
                                        <p className="mt-1 text-xs text-slate-500">
                                            {batch.description}
                                        </p>
                                    )}
                                </div>

                                <div className="rounded-lg border bg-slate-50 p-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                        Customer
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {batch.owner_code}
                                    </p>

                                    <p className="mt-1 text-[11px] text-slate-400">
                                        Inherited from batch.
                                    </p>
                                </div>
                            </div>

                            {/* Location Scope */}
                            <div>
                                <div className="mb-3 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-800">
                                            Location Scope
                                        </h3>

                                        <p className="text-xs text-slate-400">
                                            Select area and location ranges.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={reset}
                                        className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
                                    >
                                        <RotateCcw className="h-3 w-3" />
                                        Reset
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    {/* Area */}
                                    <div>
                                        <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                            <Grid className="h-4 w-4" />
                                            Area
                                        </label>

                                        <select
                                            value={filters.area}
                                            onChange={(e) => setField("area", e.target.value)}
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                        >
                                            <option value="">All Areas</option>

                                            {areas.map((x) => (
                                                <option key={x} value={x}>
                                                    {x}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Location Ranges */}
                                    {ranges.map(([label, fromKey, toKey, options]) => (
                                        <div key={label}>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                                {label} Range
                                            </label>

                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <select
                                                    value={filters[fromKey]}
                                                    onChange={(e) => setField(fromKey, e.target.value)}
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                >
                                                    <option value="">From {label}</option>

                                                    {options.map((x) => (
                                                        <option key={x} value={x}>
                                                            {x}
                                                        </option>
                                                    ))}
                                                </select>

                                                <select
                                                    value={filters[toKey]}
                                                    onChange={(e) => setField(toKey, e.target.value)}
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                >
                                                    <option value="">To {label}</option>

                                                    {options.map((x) => (
                                                        <option key={x} value={x}>
                                                            {x}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Division Code */}
                                    <div>
                                        <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                            <Package className="h-4 w-4" />
                                            Division Code
                                        </label>

                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setDivisionOpen((x) => !x)}
                                                className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm"
                                            >
                                                <span
                                                    className={
                                                        selectedDivisions.length
                                                            ? "text-slate-900"
                                                            : "text-slate-400"
                                                    }
                                                >
                                                    {divisionLabel}
                                                </span>

                                                <ChevronDown className="h-4 w-4 text-slate-400" />
                                            </button>

                                            {divisionOpen && (
                                                <div className="absolute top-full z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border bg-white p-2 shadow-xl">
                                                    {/* ALL */}
                                                    <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-slate-50">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedDivisions.includes("ALL")}
                                                            onChange={() => toggleDivision("ALL")}
                                                        />

                                                        <b>ALL</b>
                                                    </label>

                                                    <div className="my-1 border-t" />

                                                    {/* Division Options */}
                                                    {divisionOptions.length === 0 ? (
                                                        <p className="px-2 py-3 text-xs text-slate-400">
                                                            No divisions found.
                                                        </p>
                                                    ) : (
                                                        divisionOptions.map((x) => (
                                                            <label
                                                                key={x.code}
                                                                className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm hover:bg-slate-50"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedDivisions.includes(x.code)}
                                                                    disabled={selectedDivisions.includes("ALL")}
                                                                    onChange={() => toggleDivision(x.code)}
                                                                />

                                                                <span>
                                                                    <b className="block">{x.code}</b>

                                                                    {x.name && (
                                                                        <span className="text-xs text-slate-400">
                                                                            {x.name}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </label>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <p className="mt-1.5 text-[11px] text-slate-400">
                                            Choose ALL or multiple division codes.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Information */}
                            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
                                <b>Important:</b> This creates a new session inside{" "}
                                <b>{batch.code}</b>.
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex flex-col-reverse gap-3 border-t bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={generating}
                        className="text-sm font-medium text-slate-600"
                    >
                        Cancel
                    </button>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        {/* Generate & New */}
                        <button
                            type="button"
                            onClick={() => generate("new")}
                            disabled={generating || loading}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
                        >
                            <Plus className="h-4 w-4" />
                            Generate &amp; New
                        </button>

                        {/* Generate & Close */}
                        <button
                            type="button"
                            onClick={() => generate("close")}
                            disabled={generating || loading}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:bg-slate-400"
                        >
                            {generating && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}

                            Generate &amp; Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
