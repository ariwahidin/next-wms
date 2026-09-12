/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Download, RefreshCw, Package, MapPin, Grid3x3, CheckCircle2, XCircle, AlertCircle, Clock, ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, Hash, X } from 'lucide-react';
import api from "@/lib/api";
import Layout from '@/components/layout';

// ===== Types =====
interface InventoryGrouped {
    location: string;
    item_code: string;
    item_name: string;
    barcode: string;
    category: string;
    group: string;
    qa_status: string;
    division_code: string;
    uom: string;
    rec_date: string;
    prod_date: string;
    exp_date: string;
    lot_number: string;
    total_qty_available: number;
    total_qty_onhand: number;
    total_qty_allocated: number;
    inventory_count: number;
}

interface InventorySerialDetail {
    item_code: string;
    item_name: string;
    qty_available: number;
    serial_number: string;
}

interface InventoryDetail {
    inventory_number: number;
    location: string;
    whs_code: string;
    division_code: string;
    owner_code: string;
    item_code: string;
    item_name: string;
    barcode: string;
    category: string;
    group: string;
    qa_status: string;
    uom: string;
    rec_date: string;
    prod_date: string;
    exp_date: string;
    lot_number: string;
    pallet: string;
    carton_number: string;
    case_number: string;
    serial_number: string;
    qty_origin: number;
    qty_onhand: number;
    qty_available: number;
    qty_allocated: number;
    qty_suspend: number;
    qty_shipped: number;
}

interface FilterOptions {
    locations: string[];
    categories: string[];
    groups: string[];
    qa_statuses: string[];
}

interface SummaryCards {
    total_groups: number;
    total_records: number;
    total_available: number;
    total_onhand: number;
    total_allocated: number;
}

interface PagedResponse<T> {
    success: boolean;
    message?: string;
    data: T[];
    total: number;
    page: number;
    page_size: number;
}

type SortDirection = 'asc' | 'desc';

// ===== Debounce hook =====
function useDebouncedValue<T>(value: T, delayMs: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(t);
    }, [value, delayMs]);
    return debounced;
}

// ===== Column definitions =====
type ColumnKey =
    | 'location' | 'item_code' | 'item_name' | 'category' | 'group' | 'qa_status'
    | 'division_code' | 'rec_date' | 'prod_date' | 'exp_date' | 'lot_number'
    | 'total_qty_available' | 'total_qty_onhand' | 'total_qty_allocated' | 'inventory_count';

interface ColumnDef<K extends string> {
    key: K;
    label: string;
    align?: 'left' | 'center' | 'right';
    numeric?: boolean;
}

const COLUMNS: ColumnDef<ColumnKey>[] = [
    { key: 'location', label: 'Location', align: 'left' },
    { key: 'item_code', label: 'Item Code', align: 'left' },
    { key: 'item_name', label: 'Item Name', align: 'left' },
    { key: 'category', label: 'Category', align: 'left' },
    { key: 'group', label: 'Group', align: 'left' },
    { key: 'qa_status', label: 'QA Status', align: 'center' },
    { key: 'division_code', label: 'Division', align: 'right' },
    { key: 'rec_date', label: 'Rcv Date', align: 'center' },
    { key: 'prod_date', label: 'Prod Date', align: 'center' },
    { key: 'exp_date', label: 'Exp Date', align: 'center' },
    { key: 'lot_number', label: 'Lot/Batch', align: 'center' },
    { key: 'total_qty_available', label: 'Available', align: 'right', numeric: true },
    { key: 'total_qty_onhand', label: 'Onhand', align: 'right', numeric: true },
    { key: 'total_qty_allocated', label: 'Allocated', align: 'right', numeric: true },
    { key: 'inventory_count', label: 'Records', align: 'center', numeric: true },
];

type DetailColumnKey = keyof InventoryDetail;

const DETAIL_COLUMNS: ColumnDef<DetailColumnKey>[] = [
    { key: 'inventory_number', label: 'Inv No', align: 'center' },
    { key: 'location', label: 'Location', align: 'left' },
    { key: 'item_code', label: 'Item Code', align: 'left' },
    { key: 'item_name', label: 'Item Name', align: 'left' },
    { key: 'division_code', label: 'Division', align: 'center' },
    { key: 'qa_status', label: 'QA Status', align: 'center' },
    { key: 'lot_number', label: 'Lot/Batch', align: 'center' },
    { key: 'pallet', label: 'Pallet', align: 'center' },
    { key: 'carton_number', label: 'Carton No', align: 'center' },
    { key: 'case_number', label: 'Case No', align: 'center' },
    { key: 'qty_onhand', label: 'Onhand', align: 'right', numeric: true },
    { key: 'qty_available', label: 'Available', align: 'right', numeric: true },
    { key: 'qty_allocated', label: 'Allocated', align: 'right', numeric: true },
    { key: 'qty_suspend', label: 'Suspend', align: 'right', numeric: true },
    { key: 'qty_shipped', label: 'Shipped', align: 'right', numeric: true },
];

const emptyFilters = <K extends string>(cols: ColumnDef<K>[]): Record<K, string> =>
    cols.reduce((acc, c) => ({ ...acc, [c.key]: '' }), {} as Record<K, string>);

// ===== Reusable pagination bar =====
const PaginationBar: React.FC<{
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (p: number) => void;
    onPageSizeChange: (s: number) => void;
}> = ({ page, pageSize, total, onPageChange, onPageSizeChange }) => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    return (
        <div className="flex items-center justify-between px-3 py-2.5 border-t border-slate-200 bg-slate-50 text-xs">
            <div className="text-slate-600">
                {total === 0 ? 'No records' : `Showing ${from?.toLocaleString()}\u2013${to?.toLocaleString()} of ${total?.toLocaleString()}`}
            </div>
            <div className="flex items-center gap-3">
                <select
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    className="px-2 py-1 border border-slate-300 rounded bg-white text-xs"
                >
                    {[25, 50, 100, 200].map(s => <option key={s} value={s}>{s} / page</option>)}
                </select>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                        className="p-1 border border-slate-300 rounded bg-white disabled:opacity-40 hover:bg-slate-100"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 text-slate-700">Page {page} / {totalPages}</span>
                    <button
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= totalPages}
                        className="p-1 border border-slate-300 rounded bg-white disabled:opacity-40 hover:bg-slate-100"
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const InventoryAvailablePage: React.FC = () => {
    // ===== Shared top-level filters (dipakai cards + summary + detail) =====
    const [activeTab, setActiveTab] = useState<'summary' | 'detail'>('summary');
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({ locations: [], categories: [], groups: [], qa_statuses: [] });
    const [filters, setFilters] = useState({ location: '', category: '', group: '', qa_status: '', search: '' });
    const [showFilters, setShowFilters] = useState(false);
    const debouncedSearch = useDebouncedValue(filters.search, 400);

    // ===== Summary cards (independen dari tab & pagination) =====
    const [cards, setCards] = useState<SummaryCards | null>(null);
    const [cardsLoading, setCardsLoading] = useState(false);

    const activeFilterParams = useCallback(() => {
        const p = new URLSearchParams();
        if (filters.location) p.append('location', filters.location);
        if (filters.category) p.append('category', filters.category);
        if (filters.group) p.append('group', filters.group);
        if (filters.qa_status) p.append('qa_status', filters.qa_status);
        if (debouncedSearch) p.append('search', debouncedSearch);
        return p;
    }, [filters.location, filters.category, filters.group, filters.qa_status, debouncedSearch]);

    const fetchCards = async () => {
        setCardsLoading(true);
        try {
            const params = activeFilterParams();
            const res = await api.get<{ success: boolean; data: SummaryCards }>(`/inventory/available/summary?${params.toString()}`, { withCredentials: true });
            if (res.data.success) setCards(res.data.data);
        } catch (err) {
            console.error('Error fetching summary cards:', err);
        } finally {
            setCardsLoading(false);
        }
    };

    useEffect(() => { fetchCards(); }, [filters.location, filters.category, filters.group, filters.qa_status, debouncedSearch]);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get<{ success: boolean; data: FilterOptions }>('/inventory/available/filter-options', { withCredentials: true });
                if (res.data.success) setFilterOptions(res.data.data);
            } catch (err) {
                console.error('Error fetching filter options:', err);
            }
        })();
    }, []);

    // ===== Summary tab state =====
    const [inventories, setInventories] = useState<InventoryGrouped[]>([]);
    const [summaryTotal, setSummaryTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [sortKey, setSortKey] = useState<ColumnKey>('item_code');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [columnFilters, setColumnFilters] = useState<Record<ColumnKey, string>>(emptyFilters(COLUMNS));
    const debouncedColumnFilters = useDebouncedValue(columnFilters, 400);

    const fetchInventory = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = activeFilterParams();
            params.append('page', String(page));
            params.append('page_size', String(pageSize));
            params.append('sort_by', sortKey);
            params.append('sort_dir', sortDirection);
            const activeColFilters = Object.fromEntries(Object.entries(debouncedColumnFilters).filter(([, v]) => v !== ''));
            if (Object.keys(activeColFilters).length > 0) params.append('filters', JSON.stringify(activeColFilters));

            const res = await api.get<PagedResponse<InventoryGrouped>>(`/inventory/available/grouped?${params.toString()}`, { withCredentials: true });
            if (res.data.success) {
                setInventories(res.data.data || []);
                setSummaryTotal(res.data.total || 0);
            } else {
                setError(res.data.message || 'Failed to fetch inventory');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch inventory data');
            setInventories([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'summary') fetchInventory();
    }, [activeTab, page, pageSize, sortKey, sortDirection, filters.location, filters.category, filters.group, filters.qa_status, debouncedSearch, debouncedColumnFilters]);

    // Reset ke halaman 1 setiap kali filter berubah
    useEffect(() => { setPage(1); }, [filters.location, filters.category, filters.group, filters.qa_status, debouncedSearch, debouncedColumnFilters, activeTab]);

    // ===== Detail tab state =====
    const [detailInventories, setDetailInventories] = useState<InventoryDetail[]>([]);
    const [detailTotal, setDetailTotal] = useState(0);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [detailPage, setDetailPage] = useState(1);
    const [detailPageSize, setDetailPageSize] = useState(50);
    const [detailSortKey, setDetailSortKey] = useState<DetailColumnKey>('item_code');
    const [detailSortDirection, setDetailSortDirection] = useState<SortDirection>('asc');
    const [detailColumnFilters, setDetailColumnFilters] = useState<Record<DetailColumnKey, string>>(emptyFilters(DETAIL_COLUMNS));
    const debouncedDetailColumnFilters = useDebouncedValue(detailColumnFilters, 400);

    // ===== Serial modal state =====
    const [serialModalOpen, setSerialModalOpen] = useState(false);
    const [serialLoading, setSerialLoading] = useState(false);
    const [serialError, setSerialError] = useState<string | null>(null);
    const [serialData, setSerialData] = useState<InventorySerialDetail[]>([]);
    const [selectedInventory, setSelectedInventory] = useState<InventoryDetail | null>(null);

    const closeSerialModal = () => {
        setSerialModalOpen(false);
        setSerialLoading(false);
        setSerialError(null);
        setSerialData([]);
        setSelectedInventory(null);
    };

    const fetchInventorySerials = async (inventory: InventoryDetail) => {
        setSelectedInventory(inventory);
        setSerialModalOpen(true);
        setSerialLoading(true);
        setSerialError(null);
        setSerialData([]);

        try {
            const res = await api.get<{ success: boolean; message?: string; data: InventorySerialDetail[] }>(
                `/inventory/available/detail/${encodeURIComponent(String(inventory.inventory_number))}/serials`,
                { withCredentials: true }
            );

            if (res.data.success) {
                setSerialData(res.data.data || []);
            } else {
                setSerialError(res.data.message || 'Failed to fetch serial numbers');
            }
        } catch (err: any) {
            setSerialError(err.response?.data?.message || 'Failed to fetch serial numbers');
        } finally {
            setSerialLoading(false);
        }
    };

    const fetchDetailInventory = async () => {
        setDetailLoading(true);
        setDetailError(null);
        try {
            const params = activeFilterParams();
            params.append('page', String(detailPage));
            params.append('page_size', String(detailPageSize));
            params.append('sort_by', detailSortKey);
            params.append('sort_dir', detailSortDirection);
            const activeColFilters = Object.fromEntries(Object.entries(debouncedDetailColumnFilters).filter(([, v]) => v !== ''));
            if (Object.keys(activeColFilters).length > 0) params.append('filters', JSON.stringify(activeColFilters));

            const res = await api.get<PagedResponse<InventoryDetail>>(`/inventory/available/detail?${params.toString()}`, { withCredentials: true });
            if (res.data.success) {
                setDetailInventories(res.data.data || []);
                setDetailTotal(res.data.total || 0);
            } else {
                setDetailError(res.data.message || 'Failed to fetch detail');
            }
        } catch (err: any) {
            setDetailError(err.response?.data?.message || 'Failed to fetch inventory detail');
            setDetailInventories([]);
        } finally {
            setDetailLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'detail') fetchDetailInventory();
    }, [activeTab, detailPage, detailPageSize, detailSortKey, detailSortDirection, filters.location, filters.category, filters.group, filters.qa_status, debouncedSearch, debouncedDetailColumnFilters]);

    useEffect(() => { setDetailPage(1); }, [filters.location, filters.category, filters.group, filters.qa_status, debouncedSearch, debouncedDetailColumnFilters]);

    // ===== Shared helpers =====
    const getQaStatusIcon = (status: string) => {
        switch (status) {
            case 'PASS': return <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />;
            case 'HOLD': return <AlertCircle className="w-3.5 h-3.5 text-yellow-600" />;
            case 'REJECT': return <XCircle className="w-3.5 h-3.5 text-red-600" />;
            case 'PENDING': return <Clock className="w-3.5 h-3.5 text-blue-600" />;
            default: return null;
        }
    };
    const getQaStatusClass = (status: string) => {
        switch (status) {
            case 'PASS': return 'bg-green-50 text-green-700 border-green-200';
            case 'HOLD': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'REJECT': return 'bg-red-50 text-red-700 border-red-200';
            case 'PENDING': return 'bg-blue-50 text-blue-700 border-blue-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const clearFilters = () => setFilters({ location: '', category: '', group: '', qa_status: '', search: '' });
    const handleFilterChange = (key: keyof typeof filters, value: string) => setFilters(prev => ({ ...prev, [key]: value }));

    // Summary sort/filter handlers
    const handleSort = (key: ColumnKey) => {
        if (sortKey !== key) { setSortKey(key); setSortDirection('asc'); }
        else setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    };
    const handleColumnFilterChange = (key: ColumnKey, value: string) => setColumnFilters(prev => ({ ...prev, [key]: value }));
    const clearColumnFilters = () => setColumnFilters(emptyFilters(COLUMNS));
    const hasActiveColumnFilters = Object.values(columnFilters).some(v => v !== '');
    const renderSortIcon = (key: ColumnKey) => {
        if (sortKey !== key) return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-400" />;
        return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />;
    };

    // Detail sort/filter handlers
    const handleDetailSort = (key: DetailColumnKey) => {
        if (detailSortKey !== key) { setDetailSortKey(key); setDetailSortDirection('asc'); }
        else setDetailSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    };
    const handleDetailColumnFilterChange = (key: DetailColumnKey, value: string) => setDetailColumnFilters(prev => ({ ...prev, [key]: value }));
    const clearDetailColumnFilters = () => setDetailColumnFilters(emptyFilters(DETAIL_COLUMNS));
    const hasActiveDetailColumnFilters = Object.values(detailColumnFilters).some(v => v !== '');
    const renderDetailSortIcon = (key: DetailColumnKey) => {
        if (detailSortKey !== key) return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-400" />;
        return detailSortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />;
    };

    // Export = halaman yang sedang tampil (data sekarang di-page di server, bukan seluruh dataset)
    const downloadCSV = (headers: string[], rows: (string | number)[][], filenamePrefix: string) => {
        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filenamePrefix}_page${activeTab === 'summary' ? page : detailPage}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };
    const exportSummaryToCSV = () => {
        const headers = ['Location', 'Item Code', 'Item Name', 'Barcode', 'Category', 'Group', 'QA Status', 'UOM', 'Qty Available', 'Qty Onhand', 'Qty Allocated', 'Count'];
        const rows = inventories.map(inv => [inv.location, inv.item_code, inv.item_name, inv.barcode, inv.category, inv.group, inv.qa_status, inv.uom, inv.total_qty_available, inv.total_qty_onhand, inv.total_qty_allocated, inv.inventory_count]);
        downloadCSV(headers, rows, 'inventory_summary');
    };
    const exportDetailToCSV = () => {
        const headers = ['Inv No', 'Location', 'Whs', 'Division', 'Owner', 'Item Code', 'Item Name', 'Barcode', 'QA Status', 'Lot/Batch', 'Pallet', 'Carton No', 'Case No', 'UOM', 'Qty Origin', 'Qty Onhand', 'Qty Available', 'Qty Allocated', 'Qty Suspend', 'Qty Shipped'];
        const rows = detailInventories.map(inv => [inv.inventory_number, inv.location, inv.whs_code, inv.division_code, inv.owner_code, inv.item_code, inv.item_name, inv.barcode, inv.qa_status, inv.lot_number, inv.pallet, inv.carton_number, inv.case_number, inv.uom, inv.qty_origin, inv.qty_onhand, inv.qty_available, inv.qty_allocated, inv.qty_suspend, inv.qty_shipped]);
        downloadCSV(headers, rows, 'inventory_detail');
    };

    const isSummaryTab = activeTab === 'summary';
    const currentLoading = isSummaryTab ? loading : detailLoading;
    const currentError = isSummaryTab ? error : detailError;
    const currentCount = isSummaryTab ? inventories.length : detailInventories.length;
    const currentTotal = isSummaryTab ? summaryTotal : detailTotal;

    return (
        <Layout title="Inventory" subTitle="Stock">
            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <div className="bg-white border-b border-slate-200">
                    <div className="max-w-[1600px] mx-auto px-4 py-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-lg font-semibold text-slate-900">Inventory Stock</h1>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {isSummaryTab ? 'Grouped by Location' : 'Detail Records'} {currentCount} of {currentTotal?.toLocaleString()} items
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => isSummaryTab ? fetchInventory() : fetchDetailInventory()}
                                    disabled={currentLoading}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${currentLoading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                                <button
                                    onClick={() => isSummaryTab ? exportSummaryToCSV() : exportDetailToCSV()}
                                    disabled={currentCount === 0}
                                    title="Mengekspor halaman yang sedang tampil"
                                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Export Page
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-[1600px] mx-auto px-4 py-4">
                    {currentError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                            <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <div className="text-sm font-medium text-red-900">Error</div>
                                <div className="text-xs text-red-700 mt-0.5">{currentError}</div>
                            </div>
                        </div>
                    )}

                    {/* Tab switcher */}
                    <div className="flex items-center gap-1 mb-4 bg-white border border-slate-200 rounded-lg p-1 w-fit">
                        <button onClick={() => setActiveTab('summary')} className={`px-4 py-1.5 text-xs font-medium rounded ${activeTab === 'summary' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Summary</button>
                        <button onClick={() => setActiveTab('detail')} className={`px-4 py-1.5 text-xs font-medium rounded ${activeTab === 'detail' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Detail</button>
                    </div>

                    {/* Filters (shared) */}
                    <div className="bg-white rounded-lg border border-slate-200 p-3 mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-slate-600" />
                                <span className="text-sm font-medium text-slate-900">Filters</span>
                            </div>
                            <button onClick={() => setShowFilters(!showFilters)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                {showFilters ? 'Hide' : 'Show'}
                            </button>
                        </div>

                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by item code, name, barcode, location or division..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {showFilters && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1"><MapPin className="w-3 h-3 inline mr-1" />Location</label>
                                    <select value={filters.location} onChange={(e) => handleFilterChange('location', e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded bg-white">
                                        <option value="">All Locations</option>
                                        {filterOptions.locations?.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1"><Package className="w-3 h-3 inline mr-1" />Category</label>
                                    <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded bg-white">
                                        <option value="">All Categories</option>
                                        {filterOptions.categories?.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1"><Grid3x3 className="w-3 h-3 inline mr-1" />Group</label>
                                    <select value={filters.group} onChange={(e) => handleFilterChange('group', e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded bg-white">
                                        <option value="">All Groups</option>
                                        {filterOptions.groups?.map(grp => <option key={grp} value={grp}>{grp}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">QA Status</label>
                                    <select value={filters.qa_status} onChange={(e) => handleFilterChange('qa_status', e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded bg-white">
                                        <option value="">All Status</option>
                                        {filterOptions.qa_statuses?.map(status => <option key={status} value={status}>{status}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        {(filters.location || filters.category || filters.group || filters.qa_status || filters.search) && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                                <button onClick={clearFilters} className="text-xs text-slate-600 hover:text-slate-900 font-medium">Clear all filters</button>
                            </div>
                        )}
                    </div>

                    {/* Summary cards \u2014 SELALU tampil, terlepas dari tab aktif */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                        <div className="bg-white rounded-lg border border-slate-200 p-3">
                            <div className="text-xs text-slate-600 mb-1">Total Groups</div>
                            <div className="text-xl font-bold text-slate-900">
                                {cardsLoading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-400" /> : (cards?.total_groups ?? 0).toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-slate-200 p-3">
                            <div className="text-xs text-slate-600 mb-1">Total Available</div>
                            <div className="text-xl font-bold text-green-600">
                                {cardsLoading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-400" /> : (cards?.total_available ?? 0).toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-slate-200 p-3">
                            <div className="text-xs text-slate-600 mb-1">Total Onhand</div>
                            <div className="text-xl font-bold text-blue-600">
                                {cardsLoading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-400" /> : (cards?.total_onhand ?? 0).toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-slate-200 p-3">
                            <div className="text-xs text-slate-600 mb-1">Total Allocated</div>
                            <div className="text-xl font-bold text-orange-600">
                                {cardsLoading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-400" /> : (cards?.total_allocated ?? 0).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* ===================== SUMMARY TAB ===================== */}
                    {activeTab === 'summary' && (
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            {COLUMNS.map(col => (
                                                <th key={col.key} className={`px-3 py-2.5 text-xs font-semibold text-slate-700 select-none ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`} style={{ whiteSpace: 'nowrap' }}>
                                                    <button type="button" onClick={() => handleSort(col.key)} className={`group inline-flex items-center gap-1 hover:text-slate-900 ${col.align === 'center' ? 'justify-center w-full' : col.align === 'right' ? 'justify-end w-full' : ''}`}>
                                                        {col.label}{renderSortIcon(col.key)}
                                                    </button>
                                                </th>
                                            ))}
                                        </tr>
                                        <tr className="bg-white border-t border-slate-100">
                                            {COLUMNS.map(col => (
                                                <th key={`filter-${col.key}`} className="px-2 py-1.5">
                                                    <input type="text" value={columnFilters[col.key]} onChange={(e) => handleColumnFilterChange(col.key, e.target.value)} placeholder="Search..." className={`w-full min-w-[80px] px-1.5 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`} />
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200" style={{ fontSize: "x-small" }}>
                                        {loading ? (
                                            <tr><td colSpan={COLUMNS.length} className="px-3 py-8 text-center text-sm text-slate-500"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />Loading inventory data...</td></tr>
                                        ) : inventories.length === 0 ? (
                                            <tr><td colSpan={COLUMNS.length} className="px-3 py-8 text-center text-sm text-slate-500">
                                                {error ? 'Failed to load data' : hasActiveColumnFilters ? (
                                                    <span>No results match your column filters.{' '}<button onClick={clearColumnFilters} className="text-blue-600 hover:text-blue-700 font-medium">Clear column filters</button></span>
                                                ) : 'No inventory found'}
                                            </td></tr>
                                        ) : inventories.map((inv, idx) => (
                                            <tr key={`${inv.location}-${inv.item_code}-${inv.barcode}-${idx}`} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-3 py-2.5"><div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /><span className="font-medium text-slate-900">{inv.location}</span></div></td>
                                                <td className="px-3 py-2.5"><span className="font-mono text-xs text-slate-900">{inv.item_code}</span></td>
                                                <td className="px-3 py-2.5" style={{ whiteSpace: 'nowrap' }}><div><div className="text-slate-900 font-medium">{inv.item_name}</div><div className="text-xs text-slate-500 font-mono">{inv.barcode}</div></div></td>
                                                <td className="px-3 py-2.5"><span className="text-slate-700">{inv.category}</span></td>
                                                <td className="px-3 py-2.5"><span className="text-slate-700">{inv.group}</span></td>
                                                <td className="px-3 py-2.5"><div className="flex justify-center"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${getQaStatusClass(inv.qa_status)}`}>{getQaStatusIcon(inv.qa_status)}{inv.qa_status}</span></div></td>
                                                <td className="px-3 py-2.5 text-right" style={{ whiteSpace: 'nowrap' }}><span className="text-slate-900 font-medium">{inv.division_code}</span></td>
                                                <td className="px-3 py-2.5 whitespace-nowrap"><span className="font-normal text-slate-900">{inv.rec_date}</span></td>
                                                <td className="px-3 py-2.5 whitespace-nowrap"><span className="font-normal text-slate-900">{inv.prod_date}</span></td>
                                                <td className="px-3 py-2.5 whitespace-nowrap"><span className="font-normal text-slate-900">{inv.exp_date}</span></td>
                                                <td className="px-3 py-2.5 whitespace-nowrap"><span className="font-normal text-slate-900">{inv.lot_number}</span></td>
                                                <td className="px-3 py-2.5 text-right"><span className="font-semibold text-green-700">{inv.total_qty_available?.toLocaleString()}</span><span className="text-xs text-slate-500 ml-1">{inv.uom}</span></td>
                                                <td className="px-3 py-2.5 text-right"><span className="text-slate-900">{inv.total_qty_onhand?.toLocaleString()}</span><span className="text-xs text-slate-500 ml-1">{inv.uom}</span></td>
                                                <td className="px-3 py-2.5 text-right"><span className="text-slate-700">{inv.total_qty_allocated?.toLocaleString()}</span><span className="text-xs text-slate-500 ml-1">{inv.uom}</span></td>
                                                <td className="px-3 py-2.5 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">{inv.inventory_count}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <PaginationBar page={page} pageSize={pageSize} total={summaryTotal} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
                        </div>
                    )}

                    {/* ===================== DETAIL TAB ===================== */}
                    {activeTab === 'detail' && (
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            {DETAIL_COLUMNS.map(col => (
                                                <th key={col.key} className={`px-3 py-2.5 text-xs font-semibold text-slate-700 select-none ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`} style={{ whiteSpace: 'nowrap' }}>
                                                    <button type="button" onClick={() => handleDetailSort(col.key)} className={`group inline-flex items-center gap-1 hover:text-slate-900 ${col.align === 'center' ? 'justify-center w-full' : col.align === 'right' ? 'justify-end w-full' : ''}`}>
                                                        {col.label}{renderDetailSortIcon(col.key)}
                                                    </button>
                                                </th>
                                            ))}
                                            <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-700 whitespace-nowrap">SN</th>
                                        </tr>
                                        <tr className="bg-white border-t border-slate-100">
                                            {DETAIL_COLUMNS.map(col => (
                                                <th key={`filter-${col.key}`} className="px-2 py-1.5">
                                                    <input type="text" value={detailColumnFilters[col.key]} onChange={(e) => handleDetailColumnFilterChange(col.key, e.target.value)} placeholder="Search..." className={`w-full min-w-[80px] px-1.5 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`} />
                                                </th>
                                            ))}
                                            <th className="px-2 py-1.5"><div className="h-[26px]" /></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200" style={{ fontSize: "x-small" }}>
                                        {detailLoading ? (
                                            <tr><td colSpan={DETAIL_COLUMNS.length + 1} className="px-3 py-8 text-center text-sm text-slate-500"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />Loading detail data...</td></tr>
                                        ) : detailInventories.length === 0 ? (
                                            <tr><td colSpan={DETAIL_COLUMNS.length + 1} className="px-3 py-8 text-center text-sm text-slate-500">
                                                {detailError ? 'Failed to load data' : hasActiveDetailColumnFilters ? (
                                                    <span>No results match your column filters.{' '}<button onClick={clearDetailColumnFilters} className="text-blue-600 hover:text-blue-700 font-medium">Clear column filters</button></span>
                                                ) : 'No detail records found'}
                                            </td></tr>
                                        ) : detailInventories.map((inv, idx) => (
                                            <tr key={`${inv.inventory_number}-${idx}`} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-3 py-2.5 text-center"><span className="font-mono text-xs text-slate-900">{inv.inventory_number}</span></td>
                                                <td className="px-3 py-2.5"><div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /><span className="font-medium text-slate-900">{inv.location}</span></div></td>
                                                <td className="px-3 py-2.5"><span className="font-mono text-xs text-slate-900">{inv.item_code}</span></td>
                                                <td className="px-3 py-2.5" style={{ whiteSpace: 'nowrap' }}><div><div className="text-slate-900 font-medium">{inv.item_name}</div><div className="text-xs text-slate-500 font-mono">{inv.barcode}</div></div></td>
                                                <td className="px-3 py-2.5 text-center"><span className="text-slate-700">{inv.division_code}</span></td>
                                                <td className="px-3 py-2.5"><div className="flex justify-center"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${getQaStatusClass(inv.qa_status)}`}>{getQaStatusIcon(inv.qa_status)}{inv.qa_status}</span></div></td>
                                                <td className="px-3 py-2.5 text-center whitespace-nowrap"><span className="font-normal text-slate-900">{inv.lot_number}</span></td>
                                                <td className="px-3 py-2.5 text-center whitespace-nowrap"><span className="font-normal text-slate-900">{inv.pallet}</span></td>
                                                <td className="px-3 py-2.5 text-center whitespace-nowrap"><span className="font-mono text-xs text-slate-900">{inv.carton_number}</span></td>
                                                <td className="px-3 py-2.5 text-center whitespace-nowrap"><span className="font-mono text-xs text-slate-900">{inv.case_number}</span></td>
                                                <td className="px-3 py-2.5 text-right"><span className="text-slate-900">{inv.qty_onhand?.toLocaleString()}</span><span className="text-xs text-slate-500 ml-1">{inv.uom}</span></td>
                                                <td className="px-3 py-2.5 text-right"><span className="font-semibold text-green-700">{inv.qty_available?.toLocaleString()}</span><span className="text-xs text-slate-500 ml-1">{inv.uom}</span></td>
                                                <td className="px-3 py-2.5 text-right"><span className="text-slate-700">{inv.qty_allocated?.toLocaleString()}</span><span className="text-xs text-slate-500 ml-1">{inv.uom}</span></td>
                                                <td className="px-3 py-2.5 text-right"><span className="text-slate-700">{inv.qty_suspend?.toLocaleString()}</span><span className="text-xs text-slate-500 ml-1">{inv.uom}</span></td>
                                                <td className="px-3 py-2.5 text-right"><span className="text-slate-700">{inv.qty_shipped?.toLocaleString()}</span><span className="text-xs text-slate-500 ml-1">{inv.uom}</span></td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => fetchInventorySerials(inv)}
                                                        className="inline-flex items-center justify-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-colors"
                                                        title="View serial numbers"
                                                    >
                                                        <Hash className="w-3 h-3" />
                                                        SN
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <PaginationBar page={detailPage} pageSize={detailPageSize} total={detailTotal} onPageChange={setDetailPage} onPageSizeChange={(s) => { setDetailPageSize(s); setDetailPage(1); }} />
                        </div>
                    )}
                </div>
            </div>
            {/* Serial Number Modal */}
            {serialModalOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) closeSerialModal();
                    }}
                >
                    <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-blue-600" />
                                    <h2 className="text-sm font-semibold text-slate-900">Serial Numbers</h2>
                                </div>
                                {selectedInventory && (
                                    <div className="mt-1 text-xs text-slate-500">
                                        Inventory #{selectedInventory.inventory_number}
                                        <span className="mx-1.5">•</span>
                                        {selectedInventory.item_code}
                                        <span className="mx-1.5">•</span>
                                        {selectedInventory.item_name}
                                    </div>
                                )}
                            </div>
                            <button type="button" onClick={closeSerialModal} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {selectedInventory && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-5 py-4 bg-slate-50 border-b border-slate-200">
                                <div><div className="text-[11px] text-slate-500">Item Code</div><div className="text-xs font-semibold text-slate-900 font-mono mt-0.5">{selectedInventory.item_code || '-'}</div></div>
                                <div><div className="text-[11px] text-slate-500">Item Name</div><div className="text-xs font-medium text-slate-900 mt-0.5 truncate">{selectedInventory.item_name || '-'}</div></div>
                                <div><div className="text-[11px] text-slate-500">Available</div><div className="text-xs font-bold text-green-700 mt-0.5">{selectedInventory.qty_available?.toLocaleString()} {selectedInventory.uom}</div></div>
                                <div><div className="text-[11px] text-slate-500">Location</div><div className="text-xs font-medium text-slate-900 mt-0.5">{selectedInventory.location || '-'}</div></div>
                            </div>
                        )}

                        <div className="p-5">
                            {serialLoading ? (
                                <div className="py-12 text-center text-sm text-slate-500">
                                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                                    Loading serial numbers...
                                </div>
                            ) : serialError ? (
                                <div className="py-8 text-center">
                                    <XCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
                                    <div className="text-sm font-medium text-red-900">Failed to load serial numbers</div>
                                    <div className="text-xs text-red-600 mt-1">{serialError}</div>
                                </div>
                            ) : serialData.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Hash className="w-7 h-7 mx-auto mb-2 text-slate-300" />
                                    <div className="text-sm font-medium text-slate-700">No serial numbers found</div>
                                    <div className="text-xs text-slate-500 mt-1">This inventory does not have serial records.</div>
                                </div>
                            ) : (
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <div className="max-h-[420px] overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                                                <tr>
                                                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-700 w-16">#</th>
                                                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-700">Item Code</th>
                                                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-700">Item Name</th>
                                                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-700">Available</th>
                                                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-700">Serial Number</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {serialData.map((serial, index) => (
                                                    <tr key={`${serial.serial_number}-${index}`} className="hover:bg-slate-50">
                                                        <td className="px-3 py-2.5 text-xs text-slate-500">{index + 1}</td>
                                                        <td className="px-3 py-2.5 font-mono text-xs text-slate-900">{serial.item_code || '-'}</td>
                                                        <td className="px-3 py-2.5 text-xs text-slate-700">{serial.item_name || '-'}</td>
                                                        <td className="px-3 py-2.5 text-right text-xs font-semibold text-green-700">{serial.qty_available?.toLocaleString()}</td>
                                                        <td className="px-3 py-2.5"><span className="inline-flex px-2 py-1 rounded bg-slate-100 text-slate-900 font-mono text-xs">{serial.serial_number || '-'}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
                                        {serialData.length.toLocaleString()} serial record{serialData.length === 1 ? '' : 's'}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end px-5 py-3 border-t border-slate-200 bg-slate-50">
                            <button type="button" onClick={closeSerialModal} className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default InventoryAvailablePage;