
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
    Search,
    Filter,
    Download,
    RefreshCw,
    ArrowRight,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    Calendar,
    X,
    Package,
    Warehouse,
    User,
    Clock,
    ClipboardList,
    MapPin,
    Layers,
    Tag,
    Activity,
} from "lucide-react";

import api from "@/lib/api";
import Layout from "@/components/layout";

// ================================================================
// TYPES
// ================================================================

interface InventoryMovement {
    id: number;
    movement_id: string;
    inventory_id: number;

    item_id: number;
    item_code: string;
    item_name: string;

    ref_type: string;
    ref_id: number;

    qty_onhand_change: number;
    qty_available_change: number;
    qty_allocated_change: number;
    qty_suspend_change: number;
    qty_shipped_change: number;

    qty_onhand_before: number | null;
    qty_onhand_after: number | null;
    qty_available_before: number | null;
    qty_available_after: number | null;

    owner_code: string;

    from_whs_code: string;
    to_whs_code: string;

    from_location: string;
    to_location: string;

    from_division: string;
    to_division: string;

    from_pallet: string;
    to_pallet: string;

    from_lot_number: string;
    to_lot_number: string;

    from_prod_date: string;
    to_prod_date: string;

    old_qa_status: string;
    new_qa_status: string;

    action_type: string;
    reason: string;

    created_by: number;
    created_by_name: string;
    created_at: string;
}

interface Pagination {
    page: number;
    page_size: number;
    total_records: number;
    total_pages: number;
}

interface FilterOptions {
    ref_types: string[];
    locations: string[];
    whs_codes: string[];
    qa_statuses: string[];
    owner_codes: string[];
    action_types: string[];
    divisions: string[];
}

interface Filters {
    ref_type: string;
    item_code: string;
    location: string;
    whs_code: string;
    qa_status: string;
    owner_code: string;
    action_type: string;
    division: string;
    search: string;
    date_from: string;
    date_to: string;
}

interface ApiResponse {
    success: boolean;
    message: string;
    data: InventoryMovement[];
    pagination: Pagination;
    filters: FilterOptions;
}

// ================================================================
// CONSTANTS
// ================================================================

const INITIAL_FILTERS: Filters = {
    ref_type: "",
    item_code: "",
    location: "",
    whs_code: "",
    qa_status: "",
    owner_code: "",
    action_type: "",
    division: "",
    search: "",
    date_from: "",
    date_to: "",
};

const INITIAL_OPTIONS: FilterOptions = {
    ref_types: [],
    locations: [],
    whs_codes: [],
    qa_statuses: [],
    owner_codes: [],
    action_types: [],
    divisions: [],
};

// ================================================================
// MAIN COMPONENT
// ================================================================

const InventoryMovementLedger: React.FC = () => {

    // ============================================================
    // STATE
    // ============================================================

    const [movements, setMovements] = useState<InventoryMovement[]>([]);

    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        page_size: 50,
        total_records: 0,
        total_pages: 0,
    });

    const [filterOptions, setFilterOptions] =
        useState<FilterOptions>(INITIAL_OPTIONS);

    const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);

    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const [expandedId, setExpandedId] = useState<number | null>(null);

    const [error, setError] = useState<string | null>(null);

    const [refreshKey, setRefreshKey] = useState(0);

    // ============================================================
    // FETCH DATA
    // ============================================================

    const fetchMovements = useCallback(async () => {

        setLoading(true);
        setError(null);

        try {

            const params = new URLSearchParams();

            params.append("page", pagination.page.toString());
            params.append("page_size", pagination.page_size.toString());

            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    params.append(key, value);
                }
            });

            const response = await api.get<ApiResponse>(
                `/inventory/movements?${params.toString()}`,
                { withCredentials: true }
            );

            if (response.data.success) {

                setMovements(response.data.data || []);

                setPagination(prev => ({
                    ...prev,
                    ...response.data.pagination,
                }));

                setFilterOptions({
                    ...INITIAL_OPTIONS,
                    ...(response.data.filters || {}),
                });

                setExpandedId(null);

            } else {

                setError(
                    response.data.message || "Failed to fetch movements"
                );

                setMovements([]);
            }

        } catch (err: any) {

            console.error("Error fetching movements:", err);

            setError(
                err.response?.data?.message ||
                "Failed to retrieve inventory movements"
            );

            setMovements([]);

        } finally {

            setLoading(false);
        }

    }, [filters, pagination.page, pagination.page_size, refreshKey]);

    // ============================================================
    // DEBOUNCED FILTER / FETCH
    // ============================================================

    useEffect(() => {

        const timer = setTimeout(() => {
            fetchMovements();
        }, 350);

        return () => clearTimeout(timer);

    }, [fetchMovements]);

    // ============================================================
    // HANDLERS
    // ============================================================

    const updateFilter = (key: keyof Filters, value: string) => {

        setFilters(prev => ({
            ...prev,
            [key]: value,
        }));

        setPagination(prev => ({
            ...prev,
            page: 1,
        }));
    };

    const clearFilters = () => {

        setFilters(INITIAL_FILTERS);

        setPagination(prev => ({
            ...prev,
            page: 1,
        }));
    };

    const handlePageChange = (page: number) => {

        if (
            page >= 1 &&
            page <= pagination.total_pages &&
            !loading
        ) {
            setPagination(prev => ({
                ...prev,
                page,
            }));
        }
    };

    const handlePageSizeChange = (size: number) => {

        setPagination(prev => ({
            ...prev,
            page_size: size,
            page: 1,
        }));
    };

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    const toggleExpanded = (id: number) => {

        setExpandedId(prev => prev === id ? null : id);
    };

    const hasActiveFilters = Object.values(filters).some(Boolean);

    // ============================================================
    // FORMATTERS
    // ============================================================

    const formatNumber = (value: number | null | undefined) => {

        if (value === null || value === undefined) return "-";

        return Number(value).toLocaleString("id-ID", {
            maximumFractionDigits: 4,
        });
    };

    const formatDateTime = (value: string) => {

        if (!value) return "-";

        const date = new Date(value);

        if (isNaN(date.getTime())) return "-";

        return date.toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDate = (value: string) => {

        if (!value) return "-";

        const date = new Date(value);

        if (isNaN(date.getTime())) return value;

        return date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getRefTypeColor = (type: string) => {

        const colors: Record<string, string> = {
            inbound: "bg-emerald-50 text-emerald-700 border-emerald-200",
            outbound: "bg-red-50 text-red-700 border-red-200",
            allocate: "bg-blue-50 text-blue-700 border-blue-200",
            release: "bg-purple-50 text-purple-700 border-purple-200",
            transfer: "bg-orange-50 text-orange-700 border-orange-200",
            adjust: "bg-amber-50 text-amber-700 border-amber-200",
            qc: "bg-indigo-50 text-indigo-700 border-indigo-200",
        };

        return (
            colors[type?.toLowerCase()] ||
            "bg-slate-100 text-slate-700 border-slate-200"
        );
    };

    const getQaColor = (status: string) => {

        const colors: Record<string, string> = {
            A: "bg-emerald-50 text-emerald-700",
            R: "bg-red-50 text-red-700",
            Q: "bg-amber-50 text-amber-700",
        };

        return colors[status] || "bg-slate-100 text-slate-600";
    };

    // ============================================================
    // QUANTITY CHANGE
    // ============================================================

    const QuantityValue = ({
        value,
        label,
    }: {
        value: number;
        label: string;
    }) => {

        if (value === 0) return null;

        const positive = value > 0;

        return (
            <div className="flex items-center justify-between gap-2">

                <span className="text-[11px] text-slate-500">
                    {label}
                </span>

                <span className={`text-xs font-semibold tabular-nums ${
                    positive ? "text-emerald-600" : "text-red-600"
                }`}>
                    {positive ? "+" : ""}
                    {formatNumber(value)}
                </span>

            </div>
        );
    };

    // ============================================================
    // BEFORE / AFTER
    // ============================================================

    const BeforeAfter = ({
        before,
        after,
    }: {
        before: number | null;
        after: number | null;
    }) => {

        return (
            <div className="flex items-center gap-2 text-xs">

                <span className="text-slate-500 tabular-nums">
                    {formatNumber(before)}
                </span>

                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />

                <span className="font-semibold text-slate-800 tabular-nums">
                    {formatNumber(after)}
                </span>

            </div>
        );
    };

    // ============================================================
    // DETAIL CELL
    // ============================================================

    const DetailCell = ({
        label,
        value,
        icon: Icon,
    }: {
        label: string;
        value: React.ReactNode;
        icon?: React.ElementType;
    }) => {

        return (
            <div className="min-w-0">

                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">

                    {Icon && <Icon className="w-3 h-3" />}

                    {label}

                </div>

                <div className="text-xs text-slate-700 font-medium break-words">
                    {value || "-"}
                </div>

            </div>
        );
    };

    // ============================================================
    // EXPORT CSV
    // ============================================================

    const exportToCSV = () => {

        if (!movements.length) return;

        const headers = [
            "Movement ID",
            "Date",
            "Inventory ID",
            "Item ID",
            "Item Code",
            "Item Name",
            "Ref Type",
            "Ref ID",
            "Action Type",
            "Owner Code",

            "Onhand Change",
            "Onhand Before",
            "Onhand After",

            "Available Change",
            "Available Before",
            "Available After",

            "Allocated Change",
            "Suspend Change",
            "Shipped Change",

            "From Warehouse",
            "To Warehouse",

            "From Location",
            "To Location",

            "From Division",
            "To Division",

            "From Pallet",
            "To Pallet",

            "From Lot",
            "To Lot",

            "From Production Date",
            "To Production Date",

            "Old QA Status",
            "New QA Status",

            "Reason",
            "Created By",
            "Created By Name",
        ];

        const rows = movements.map(m => [

            m.movement_id,
            m.created_at,

            m.inventory_id,
            m.item_id,
            m.item_code,
            m.item_name,

            m.ref_type,
            m.ref_id,
            m.action_type,
            m.owner_code,

            m.qty_onhand_change,
            m.qty_onhand_before,
            m.qty_onhand_after,

            m.qty_available_change,
            m.qty_available_before,
            m.qty_available_after,

            m.qty_allocated_change,
            m.qty_suspend_change,
            m.qty_shipped_change,

            m.from_whs_code,
            m.to_whs_code,

            m.from_location,
            m.to_location,

            m.from_division,
            m.to_division,

            m.from_pallet,
            m.to_pallet,

            m.from_lot_number,
            m.to_lot_number,

            m.from_prod_date,
            m.to_prod_date,

            m.old_qa_status,
            m.new_qa_status,

            m.reason,
            m.created_by,
            m.created_by_name,

        ]);

        const escapeCSV = (value: any) => {

            const text = value === null || value === undefined
                ? ""
                : String(value);

            return `"${text.replace(/"/g, '""')}"`;
        };

        const csv = [
            headers.map(escapeCSV).join(","),
            ...rows.map(row => row.map(escapeCSV).join(",")),
        ].join("\r\n");

        const blob = new Blob(
            ["\uFEFF" + csv],
            { type: "text/csv;charset=utf-8;" }
        );

        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download =
            `inventory_movements_${new Date().toISOString().split("T")[0]}.csv`;

        link.click();

        window.URL.revokeObjectURL(url);
    };

    // ================================================================
    // PAGINATION NUMBERS
    // ================================================================

    const getPageNumbers = () => {

        const pages: (number | string)[] = [];

        const total = pagination.total_pages;
        const current = pagination.page;

        if (total <= 5) {

            for (let i = 1; i <= total; i++) {
                pages.push(i);
            }

        } else {

            pages.push(1);

            if (current > 3) {
                pages.push("...");
            }

            const start = Math.max(2, current - 1);
            const end = Math.min(total - 1, current + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (current < total - 2) {
                pages.push("...");
            }

            pages.push(total);
        }

        return pages;
    };

    // ================================================================
    // RENDER
    // ================================================================

    return (

        <Layout title="Inventory" subTitle="Movement Ledger">

            <div className="min-h-screen bg-slate-50">

                <div className="max-w-[1800px] mx-auto px-4 py-4 space-y-4">

                    {/* ==================================================
                        HEADER
                    ================================================== */}

                    <div className="flex flex-wrap items-center justify-between gap-3">

                        <div>

                            <div className="flex items-center gap-2">

                                <h1 className="text-lg font-semibold text-slate-900">
                                    Inventory Movement Ledger
                                </h1>

                                <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-[10px] font-semibold text-blue-700">
                                    AUDIT TRAIL
                                </span>

                            </div>

                            <p className="text-xs text-slate-500 mt-1">

                                Track inventory transactions, stock changes
                                and warehouse activities.

                            </p>

                            <div className="text-[11px] text-slate-400 mt-1">

                                {pagination.total_records.toLocaleString("id-ID")} records

                                <span className="mx-1.5">·</span>

                                Page {pagination.page} of {pagination.total_pages}

                            </div>

                        </div>

                        <div className="flex items-center gap-2">

                            <select
                                value={pagination.page_size}
                                onChange={e => handlePageSizeChange(Number(e.target.value))}
                                className="h-8 px-2 text-xs border border-slate-200 rounded-md bg-white outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={25}>25 / page</option>
                                <option value={50}>50 / page</option>
                                <option value={100}>100 / page</option>
                            </select>

                            <button
                                onClick={handleRefresh}
                                disabled={loading}
                                className="h-8 px-3 flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                                Refresh
                            </button>

                            <button
                                onClick={exportToCSV}
                                disabled={!movements.length}
                                className="h-8 px-3 flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Export
                            </button>

                        </div>

                    </div>

                    {/* ==================================================
                        ERROR
                    ================================================== */}

                    {error && (

                        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-md px-3 py-2">

                            <span className="text-xs text-red-700">
                                {error}
                            </span>

                            <button
                                onClick={handleRefresh}
                                className="text-xs font-medium text-red-700 hover:underline"
                            >
                                Retry
                            </button>

                        </div>

                    )}

                    {/* ==================================================
                        FILTERS
                    ================================================== */}

                    <div className="bg-white border border-slate-200 rounded-lg">

                        <div className="p-3">

                            <div className="flex flex-col lg:flex-row gap-2">

                                {/* Search */}

                                <div className="relative flex-1">

                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                                    <input
                                        type="text"
                                        value={filters.search}
                                        onChange={e => updateFilter("search", e.target.value)}
                                        placeholder="Search movement ID, SKU, product, operator, location, pallet..."
                                        className="w-full h-9 pl-9 pr-9 text-xs border border-slate-200 rounded-md outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                                    />

                                    {filters.search && (

                                        <button
                                            onClick={() => updateFilter("search", "")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>

                                    )}

                                </div>

                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`h-9 px-3 flex items-center justify-center gap-2 text-xs font-medium border rounded-md ${
                                        showFilters || hasActiveFilters
                                            ? "bg-blue-50 border-blue-200 text-blue-700"
                                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                    }`}
                                >
                                    <Filter className="w-3.5 h-3.5" />

                                    Advanced Filters

                                    {hasActiveFilters && (
                                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center">
                                            {Object.values(filters).filter(Boolean).length}
                                        </span>
                                    )}

                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />

                                </button>

                            </div>

                            {/* Advanced Filters */}

                            {showFilters && (

                                <div className="pt-3 mt-3 border-t border-slate-100">

                                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">

                                        {/* Reference Type */}

                                        <div>

                                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                                Reference Type
                                            </label>

                                            <select
                                                value={filters.ref_type}
                                                onChange={e => updateFilter("ref_type", e.target.value)}
                                                className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white outline-none"
                                            >
                                                <option value="">All Types</option>

                                                {filterOptions.ref_types.map(type => (
                                                    <option key={type} value={type}>
                                                        {type.toUpperCase()}
                                                    </option>
                                                ))}
                                            </select>

                                        </div>

                                        {/* Action Type */}

                                        <div>

                                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                                Action Type
                                            </label>

                                            <select
                                                value={filters.action_type}
                                                onChange={e => updateFilter("action_type", e.target.value)}
                                                className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white outline-none"
                                            >
                                                <option value="">All Actions</option>

                                                {filterOptions.action_types.map(type => (
                                                    <option key={type} value={type}>
                                                        {type}
                                                    </option>
                                                ))}
                                            </select>

                                        </div>

                                        {/* Owner */}

                                        <div>

                                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                                Owner
                                            </label>

                                            <select
                                                value={filters.owner_code}
                                                onChange={e => updateFilter("owner_code", e.target.value)}
                                                className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white outline-none"
                                            >
                                                <option value="">All Owners</option>

                                                {filterOptions.owner_codes.map(owner => (
                                                    <option key={owner} value={owner}>
                                                        {owner}
                                                    </option>
                                                ))}
                                            </select>

                                        </div>

                                        {/* Warehouse */}

                                        <div>

                                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                                Warehouse
                                            </label>

                                            <select
                                                value={filters.whs_code}
                                                onChange={e => updateFilter("whs_code", e.target.value)}
                                                className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white outline-none"
                                            >
                                                <option value="">All Warehouses</option>

                                                {filterOptions.whs_codes.map(whs => (
                                                    <option key={whs} value={whs}>
                                                        {whs}
                                                    </option>
                                                ))}
                                            </select>

                                        </div>

                                        {/* Location */}

                                        <div>

                                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                                Location
                                            </label>

                                            <select
                                                value={filters.location}
                                                onChange={e => updateFilter("location", e.target.value)}
                                                className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white outline-none"
                                            >
                                                <option value="">All Locations</option>

                                                {filterOptions.locations.map(loc => (
                                                    <option key={loc} value={loc}>
                                                        {loc}
                                                    </option>
                                                ))}
                                            </select>

                                        </div>

                                        {/* Division */}

                                        <div>

                                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                                Division
                                            </label>

                                            <select
                                                value={filters.division}
                                                onChange={e => updateFilter("division", e.target.value)}
                                                className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white outline-none"
                                            >
                                                <option value="">All Divisions</option>

                                                {filterOptions.divisions.map(division => (
                                                    <option key={division} value={division}>
                                                        {division}
                                                    </option>
                                                ))}
                                            </select>

                                        </div>

                                        {/* QA Status */}

                                        <div>

                                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                                QA Status
                                            </label>

                                            <select
                                                value={filters.qa_status}
                                                onChange={e => updateFilter("qa_status", e.target.value)}
                                                className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white outline-none"
                                            >
                                                <option value="">All QA Status</option>

                                                {filterOptions.qa_statuses.map(status => (
                                                    <option key={status} value={status}>
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>

                                        </div>

                                        {/* Date From */}

                                        <div>

                                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                                Date From
                                            </label>

                                            <input
                                                type="date"
                                                value={filters.date_from}
                                                onChange={e => updateFilter("date_from", e.target.value)}
                                                className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md outline-none"
                                            />

                                        </div>

                                        {/* Date To */}

                                        <div>

                                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                                Date To
                                            </label>

                                            <input
                                                type="date"
                                                value={filters.date_to}
                                                min={filters.date_from || undefined}
                                                onChange={e => updateFilter("date_to", e.target.value)}
                                                className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md outline-none"
                                            />

                                        </div>

                                    </div>

                                    {hasActiveFilters && (

                                        <div className="flex justify-end mt-3">

                                            <button
                                                onClick={clearFilters}
                                                className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                                Clear all filters
                                            </button>

                                        </div>

                                    )}

                                </div>

                            )}

                        </div>

                    </div>

                    {/* ==================================================
                        MOVEMENT TABLE
                    ================================================== */}

                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">

                        <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200">

                            <div className="flex items-center gap-2">

                                <Activity className="w-4 h-4 text-slate-500" />

                                <span className="text-xs font-semibold text-slate-800">
                                    Movement Records
                                </span>

                                <span className="text-[10px] text-slate-400">
                                    ({pagination.total_records.toLocaleString("id-ID")})
                                </span>

                            </div>

                            <span className="text-[10px] text-slate-400">
                                Click a record to view full details
                            </span>

                        </div>

                        <div className="overflow-x-auto">

                            <table className="w-full text-xs min-w-[1050px]">

                                <thead className="bg-slate-50 border-b border-slate-200">

                                    <tr>

                                        <th className="w-8 px-3 py-2"></th>

                                        <th className="px-3 py-2 text-left font-semibold text-slate-500">
                                            Date / Movement
                                        </th>

                                        <th className="px-3 py-2 text-left font-semibold text-slate-500">
                                            Product
                                        </th>

                                        <th className="px-3 py-2 text-center font-semibold text-slate-500">
                                            Transaction
                                        </th>

                                        <th className="px-3 py-2 text-left font-semibold text-slate-500">
                                            Location Movement
                                        </th>

                                        <th className="px-3 py-2 text-left font-semibold text-slate-500 min-w-[155px]">
                                            Stock Impact
                                        </th>

                                        <th className="px-3 py-2 text-left font-semibold text-slate-500">
                                            Operator
                                        </th>

                                    </tr>

                                </thead>

                                <tbody className="divide-y divide-slate-100">

                                    {loading ? (

                                        <tr>

                                            <td colSpan={7} className="py-16 text-center">

                                                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mx-auto mb-2" />

                                                <p className="text-xs text-slate-500">
                                                    Loading inventory movements...
                                                </p>

                                            </td>

                                        </tr>

                                    ) : movements.length === 0 ? (

                                        <tr>

                                            <td colSpan={7} className="py-16 text-center">

                                                <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />

                                                <p className="text-sm font-medium text-slate-600">
                                                    No movements found
                                                </p>

                                                <p className="text-xs text-slate-400 mt-1">
                                                    Try adjusting your search or filters.
                                                </p>

                                            </td>

                                        </tr>

                                    ) : (

                                        movements.map(mov => {

                                            const expanded = expandedId === mov.id;

                                            const quantityChanges = [
                                                mov.qty_onhand_change,
                                                mov.qty_available_change,
                                                mov.qty_allocated_change,
                                                mov.qty_suspend_change,
                                                mov.qty_shipped_change,
                                            ];

                                            const hasQuantityChange = quantityChanges.some(v => v !== 0);

                                            return (

                                                <React.Fragment key={mov.id}>

                                                    {/* MAIN ROW */}

                                                    <tr
                                                        onClick={() => toggleExpanded(mov.id)}
                                                        className={`cursor-pointer transition-colors ${
                                                            expanded
                                                                ? "bg-blue-50/50"
                                                                : "hover:bg-slate-50"
                                                        }`}
                                                    >

                                                        {/* Expand */}

                                                        <td className="px-3 py-3 align-top">

                                                            {expanded ? (
                                                                <ChevronDown className="w-4 h-4 text-blue-600" />
                                                            ) : (
                                                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                                            )}

                                                        </td>

                                                        {/* Date / Movement */}

                                                        <td className="px-3 py-3 align-top whitespace-nowrap">

                                                            <div className="font-medium text-slate-800">
                                                                {formatDate(mov.created_at)}
                                                            </div>

                                                            <div className="text-[10px] text-slate-400 mt-0.5">
                                                                {new Date(mov.created_at).toLocaleTimeString("id-ID", {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </div>

                                                            <div className="font-mono text-[10px] text-blue-600 mt-1">
                                                                {mov.movement_id}
                                                            </div>

                                                        </td>

                                                        {/* Product */}

                                                        <td className="px-3 py-3 align-top min-w-[180px]">

                                                            <div className="font-semibold text-slate-800">
                                                                {mov.item_name || "-"}
                                                            </div>

                                                            <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                                                                {mov.item_code}
                                                            </div>

                                                            <div className="text-[10px] text-slate-400 mt-1">
                                                                Inventory #{mov.inventory_id}
                                                            </div>

                                                        </td>

                                                        {/* Transaction */}

                                                        <td className="px-3 py-3 align-top text-center">

                                                            <span className={`inline-flex px-2 py-1 rounded border text-[10px] font-semibold ${getRefTypeColor(mov.ref_type)}`}>
                                                                {mov.ref_type?.toUpperCase() || "UNKNOWN"}
                                                            </span>

                                                            {mov.action_type && (
                                                                <div className="text-[10px] text-slate-500 mt-1">
                                                                    {mov.action_type}
                                                                </div>
                                                            )}

                                                            <div className="text-[10px] text-slate-400 mt-1">
                                                                Ref #{mov.ref_id}
                                                            </div>

                                                        </td>

                                                        {/* Location Movement */}

                                                        <td className="px-3 py-3 align-top min-w-[200px]">

                                                            <div className="flex items-center gap-1.5">

                                                                <span className="font-medium text-slate-700 break-all">
                                                                    {mov.from_location || "-"}
                                                                </span>

                                                                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />

                                                                <span className="font-medium text-slate-700 break-all">
                                                                    {mov.to_location || "-"}
                                                                </span>

                                                            </div>

                                                            <div className="text-[10px] text-slate-400 mt-1">
                                                                {mov.from_whs_code || "-"}
                                                                {" → "}
                                                                {mov.to_whs_code || "-"}
                                                            </div>

                                                            {(mov.old_qa_status || mov.new_qa_status) && (

                                                                <div className="flex items-center gap-1.5 mt-1.5">

                                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${getQaColor(mov.old_qa_status)}`}>
                                                                        {mov.old_qa_status || "-"}
                                                                    </span>

                                                                    {mov.old_qa_status !== mov.new_qa_status && (
                                                                        <>
                                                                            <ArrowRight className="w-2.5 h-2.5 text-slate-400" />

                                                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${getQaColor(mov.new_qa_status)}`}>
                                                                                {mov.new_qa_status || "-"}
                                                                            </span>
                                                                        </>
                                                                    )}

                                                                    <span className="text-[9px] text-slate-400">
                                                                        QA
                                                                    </span>

                                                                </div>

                                                            )}

                                                        </td>

                                                        {/* Stock Impact */}

                                                        <td className="px-3 py-3 align-top min-w-[155px]">

                                                            {hasQuantityChange ? (

                                                                <div className="space-y-1">

                                                                    <QuantityValue value={mov.qty_onhand_change} label="Onhand" />

                                                                    <QuantityValue value={mov.qty_available_change} label="Available" />

                                                                    <QuantityValue value={mov.qty_allocated_change} label="Allocated" />

                                                                    <QuantityValue value={mov.qty_suspend_change} label="Suspend" />

                                                                    <QuantityValue value={mov.qty_shipped_change} label="Shipped" />

                                                                </div>

                                                            ) : (

                                                                <span className="text-[10px] text-slate-400">
                                                                    No quantity change
                                                                </span>

                                                            )}

                                                        </td>

                                                        {/* Operator */}

                                                        <td className="px-3 py-3 align-top whitespace-nowrap">

                                                            <div className="flex items-center gap-1.5 text-slate-700">

                                                                <User className="w-3.5 h-3.5 text-slate-400" />

                                                                <span className="font-medium">
                                                                    {mov.created_by_name || `User #${mov.created_by}`}
                                                                </span>

                                                            </div>

                                                            {/* <div className="text-[10px] text-slate-400 mt-1">
                                                                ID: {mov.created_by}
                                                            </div> */}

                                                        </td>

                                                    </tr>

                                                    {/* ==================================================
                                                        EXPANDED DETAIL
                                                    ================================================== */}

                                                    {expanded && (

                                                        <tr className="bg-slate-50/80">

                                                            <td colSpan={7} className="px-5 py-4">

                                                                <div className="border border-slate-200 bg-white rounded-lg overflow-hidden">

                                                                    {/* Detail Header */}

                                                                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">

                                                                        <div className="flex items-center gap-2">

                                                                            <ClipboardList className="w-4 h-4 text-blue-600" />

                                                                            <span className="text-xs font-semibold text-slate-800">
                                                                                Movement Details
                                                                            </span>

                                                                        </div>

                                                                        <span className="font-mono text-[10px] text-slate-500">
                                                                            {mov.movement_id}
                                                                        </span>

                                                                    </div>

                                                                    <div className="p-4 space-y-4">

                                                                        {/* Transaction Information */}

                                                                        <section>

                                                                            <div className="flex items-center gap-2 mb-3">

                                                                                <Activity className="w-3.5 h-3.5 text-slate-400" />

                                                                                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                                                    Transaction Information
                                                                                </h3>

                                                                            </div>

                                                                            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">

                                                                                <DetailCell
                                                                                    label="Reference Type"
                                                                                    value={mov.ref_type}
                                                                                />

                                                                                <DetailCell
                                                                                    label="Reference ID"
                                                                                    value={mov.ref_id}
                                                                                />

                                                                                <DetailCell
                                                                                    label="Action Type"
                                                                                    value={mov.action_type}
                                                                                />

                                                                                <DetailCell
                                                                                    label="Owner Code"
                                                                                    value={mov.owner_code}
                                                                                />

                                                                                <DetailCell
                                                                                    label="Inventory ID"
                                                                                    value={mov.inventory_id}
                                                                                />

                                                                                <DetailCell
                                                                                    label="Item ID"
                                                                                    value={mov.item_id}
                                                                                />

                                                                            </div>

                                                                        </section>

                                                                        <div className="border-t border-slate-100" />

                                                                        {/* Warehouse Information */}

                                                                        <section>

                                                                            <div className="flex items-center gap-2 mb-3">

                                                                                <Warehouse className="w-3.5 h-3.5 text-slate-400" />

                                                                                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                                                    Warehouse & Location
                                                                                </h3>

                                                                            </div>

                                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                                                                                <DetailCell
                                                                                    label="From Warehouse"
                                                                                    value={mov.from_whs_code}
                                                                                />

                                                                                <DetailCell
                                                                                    label="To Warehouse"
                                                                                    value={mov.to_whs_code}
                                                                                />

                                                                                <DetailCell
                                                                                    label="From Location"
                                                                                    value={mov.from_location}
                                                                                />

                                                                                <DetailCell
                                                                                    label="To Location"
                                                                                    value={mov.to_location}
                                                                                />

                                                                            </div>

                                                                        </section>

                                                                        <div className="border-t border-slate-100" />

                                                                        {/* Stock Snapshot */}

                                                                        <section>

                                                                            <div className="flex items-center gap-2 mb-3">

                                                                                <Package className="w-3.5 h-3.5 text-slate-400" />

                                                                                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                                                    Stock Snapshot
                                                                                </h3>

                                                                                <span className="text-[9px] text-slate-400">
                                                                                    Before → After
                                                                                </span>

                                                                            </div>

                                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                                                                                <div className="p-3 bg-slate-50 rounded-md border border-slate-100">

                                                                                    <div className="text-[10px] text-slate-500 mb-2">
                                                                                        Onhand
                                                                                    </div>

                                                                                    <BeforeAfter
                                                                                        before={mov.qty_onhand_before}
                                                                                        after={mov.qty_onhand_after}
                                                                                    />

                                                                                    <div className={`text-[10px] font-semibold mt-2 ${
                                                                                        mov.qty_onhand_change > 0
                                                                                            ? "text-emerald-600"
                                                                                            : mov.qty_onhand_change < 0
                                                                                                ? "text-red-600"
                                                                                                : "text-slate-400"
                                                                                    }`}>
                                                                                        Change: {mov.qty_onhand_change > 0 ? "+" : ""}
                                                                                        {formatNumber(mov.qty_onhand_change)}
                                                                                    </div>

                                                                                </div>

                                                                                <div className="p-3 bg-slate-50 rounded-md border border-slate-100">

                                                                                    <div className="text-[10px] text-slate-500 mb-2">
                                                                                        Available
                                                                                    </div>

                                                                                    <BeforeAfter
                                                                                        before={mov.qty_available_before}
                                                                                        after={mov.qty_available_after}
                                                                                    />

                                                                                    <div className={`text-[10px] font-semibold mt-2 ${
                                                                                        mov.qty_available_change > 0
                                                                                            ? "text-emerald-600"
                                                                                            : mov.qty_available_change < 0
                                                                                                ? "text-red-600"
                                                                                                : "text-slate-400"
                                                                                    }`}>
                                                                                        Change: {mov.qty_available_change > 0 ? "+" : ""}
                                                                                        {formatNumber(mov.qty_available_change)}
                                                                                    </div>

                                                                                </div>

                                                                                <div className="p-3 bg-slate-50 rounded-md border border-slate-100">

                                                                                    <div className="text-[10px] text-slate-500 mb-2">
                                                                                        Allocated Change
                                                                                    </div>

                                                                                    <div className="text-sm font-semibold text-slate-800 tabular-nums">
                                                                                        {mov.qty_allocated_change > 0 ? "+" : ""}
                                                                                        {formatNumber(mov.qty_allocated_change)}
                                                                                    </div>

                                                                                </div>

                                                                                <div className="p-3 bg-slate-50 rounded-md border border-slate-100">

                                                                                    <div className="text-[10px] text-slate-500 mb-2">
                                                                                        Suspend / Shipped
                                                                                    </div>

                                                                                    <div className="text-xs font-semibold text-slate-800">
                                                                                        {formatNumber(mov.qty_suspend_change)}
                                                                                        {" / "}
                                                                                        {formatNumber(mov.qty_shipped_change)}
                                                                                    </div>

                                                                                    <div className="text-[10px] text-slate-400 mt-1">
                                                                                        Suspend / Shipped
                                                                                    </div>

                                                                                </div>

                                                                            </div>

                                                                        </section>

                                                                        <div className="border-t border-slate-100" />

                                                                        {/* Physical Inventory */}

                                                                        <section>

                                                                            <div className="flex items-center gap-2 mb-3">

                                                                                <Layers className="w-3.5 h-3.5 text-slate-400" />

                                                                                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                                                    Physical Inventory Details
                                                                                </h3>

                                                                            </div>

                                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                                                                                <DetailCell
                                                                                    label="From Division"
                                                                                    value={mov.from_division}
                                                                                />

                                                                                <DetailCell
                                                                                    label="To Division"
                                                                                    value={mov.to_division}
                                                                                />

                                                                                <DetailCell
                                                                                    label="From Pallet"
                                                                                    value={mov.from_pallet}
                                                                                />

                                                                                <DetailCell
                                                                                    label="To Pallet"
                                                                                    value={mov.to_pallet}
                                                                                />

                                                                                <DetailCell
                                                                                    label="From Lot Number"
                                                                                    value={mov.from_lot_number}
                                                                                />

                                                                                <DetailCell
                                                                                    label="To Lot Number"
                                                                                    value={mov.to_lot_number}
                                                                                />

                                                                                <DetailCell
                                                                                    label="From Production Date"
                                                                                    value={formatDate(mov.from_prod_date)}
                                                                                />

                                                                                <DetailCell
                                                                                    label="To Production Date"
                                                                                    value={formatDate(mov.to_prod_date)}
                                                                                />

                                                                            </div>

                                                                        </section>

                                                                        <div className="border-t border-slate-100" />

                                                                        {/* QA Information */}

                                                                        <section>

                                                                            <div className="flex items-center gap-2 mb-3">

                                                                                <Tag className="w-3.5 h-3.5 text-slate-400" />

                                                                                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                                                    Quality Information
                                                                                </h3>

                                                                            </div>

                                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                                                                                <DetailCell
                                                                                    label="Old QA Status"
                                                                                    value={
                                                                                        mov.old_qa_status ? (
                                                                                            <span className={`px-2 py-0.5 rounded text-[10px] ${getQaColor(mov.old_qa_status)}`}>
                                                                                                {mov.old_qa_status}
                                                                                            </span>
                                                                                        ) : "-"
                                                                                    }
                                                                                />

                                                                                <DetailCell
                                                                                    label="New QA Status"
                                                                                    value={
                                                                                        mov.new_qa_status ? (
                                                                                            <span className={`px-2 py-0.5 rounded text-[10px] ${getQaColor(mov.new_qa_status)}`}>
                                                                                                {mov.new_qa_status}
                                                                                            </span>
                                                                                        ) : "-"
                                                                                    }
                                                                                />

                                                                            </div>

                                                                        </section>

                                                                        <div className="border-t border-slate-100" />

                                                                        {/* Audit */}

                                                                        <section>

                                                                            <div className="flex items-center gap-2 mb-3">

                                                                                <User className="w-3.5 h-3.5 text-slate-400" />

                                                                                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                                                    Audit Information
                                                                                </h3>

                                                                            </div>

                                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                                                                                <DetailCell
                                                                                    label="Created By"
                                                                                    value={mov.created_by_name || `User #${mov.created_by}`}
                                                                                />

                                                                                <DetailCell
                                                                                    label="User ID"
                                                                                    value={mov.created_by}
                                                                                />

                                                                                <DetailCell
                                                                                    label="Created At"
                                                                                    value={formatDateTime(mov.created_at)}
                                                                                    icon={Clock}
                                                                                />

                                                                                <DetailCell
                                                                                    label="Movement ID"
                                                                                    value={mov.movement_id}
                                                                                />

                                                                            </div>

                                                                        </section>

                                                                        {/* Reason */}

                                                                        {mov.reason && (

                                                                            <div className="bg-amber-50 border border-amber-100 rounded-md p-3">

                                                                                <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 mb-1">
                                                                                    Transaction Reason
                                                                                </div>

                                                                                <p className="text-xs text-amber-900">
                                                                                    {mov.reason}
                                                                                </p>

                                                                            </div>

                                                                        )}

                                                                    </div>

                                                                </div>

                                                            </td>

                                                        </tr>

                                                    )}

                                                </React.Fragment>

                                            );
                                        })

                                    )}

                                </tbody>

                            </table>

                        </div>

                        {/* ==================================================
                            PAGINATION
                        ================================================== */}

                        <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 border-t border-slate-200">

                            <div className="text-[11px] text-slate-500">

                                {pagination.total_records > 0 ? (

                                    <>
                                        Showing{" "}
                                        <span className="font-semibold text-slate-700">
                                            {((pagination.page - 1) * pagination.page_size) + 1}
                                        </span>

                                        {" - "}

                                        <span className="font-semibold text-slate-700">
                                            {Math.min(
                                                pagination.page * pagination.page_size,
                                                pagination.total_records
                                            )}
                                        </span>

                                        {" of "}

                                        <span className="font-semibold text-slate-700">
                                            {pagination.total_records.toLocaleString("id-ID")}
                                        </span>

                                        {" records"}
                                    </>

                                ) : "No records"}

                            </div>

                            <div className="flex items-center gap-1">

                                <button
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page <= 1 || loading}
                                    className="h-7 px-2 flex items-center gap-1 border border-slate-200 rounded text-[11px] text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    Prev
                                </button>

                                {getPageNumbers().map((page, index) => (

                                    page === "..." ? (

                                        <span key={`ellipsis-${index}`} className="px-2 text-xs text-slate-400">
                                            ...
                                        </span>

                                    ) : (

                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page as number)}
                                            disabled={loading}
                                            className={`min-w-7 h-7 px-2 rounded text-[11px] font-medium ${
                                                pagination.page === page
                                                    ? "bg-blue-600 text-white"
                                                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                        >
                                            {page}
                                        </button>

                                    )

                                ))}

                                <button
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.total_pages || loading}
                                    className="h-7 px-2 flex items-center gap-1 border border-slate-200 rounded text-[11px] text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                >
                                    Next
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>

                            </div>

                        </div>

                    </div>

                    {/* ==================================================
                        FOOTER
                    ================================================== */}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">

                        <span>
                            Inventory Management · Movement Audit Trail
                        </span>

                        <span>
                            {movements.length} records loaded
                        </span>

                    </div>

                </div>

            </div>

        </Layout>

    );
};

export default InventoryMovementLedger;
