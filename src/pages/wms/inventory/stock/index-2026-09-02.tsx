/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Download, RefreshCw, Package, MapPin, Grid3x3, CheckCircle2, XCircle, AlertCircle, Clock, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import api from "@/lib/api";
import Layout from '@/components/layout';

// Types
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

interface FilterOptions {
    locations: string[];
    categories: string[];
    groups: string[];
    qa_statuses: string[];
}

interface ApiResponse {
    success: boolean;
    message: string;
    data: InventoryGrouped[];
    total: number;
    filters: FilterOptions;
}

// Column definitions used for sort + per-column search
type ColumnKey =
    | 'location' | 'item_code' | 'item_name' | 'category' | 'group' | 'qa_status'
    | 'division_code' | 'rec_date' | 'prod_date' | 'exp_date' | 'lot_number'
    | 'total_qty_available' | 'total_qty_onhand' | 'total_qty_allocated' | 'inventory_count';

interface ColumnDef {
    key: ColumnKey;
    label: string;
    align?: 'left' | 'center' | 'right';
    numeric?: boolean;
}

const COLUMNS: ColumnDef[] = [
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

type SortDirection = 'asc' | 'desc' | null;

const InventoryAvailablePage: React.FC = () => {
    const [inventories, setInventories] = useState<InventoryGrouped[]>([]);
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        locations: [],
        categories: [],
        groups: [],
        qa_statuses: []
    });

    const [filters, setFilters] = useState({
        location: '',
        category: '',
        group: '',
        qa_status: '',
        search: ''
    });

    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Per-column search text
    const [columnFilters, setColumnFilters] = useState<Record<ColumnKey, string>>({
        location: '', item_code: '', item_name: '', category: '', group: '', qa_status: '',
        division_code: '', rec_date: '', prod_date: '', exp_date: '', lot_number: '',
        total_qty_available: '', total_qty_onhand: '', total_qty_allocated: '', inventory_count: ''
    });

    // Sort state
    const [sortKey, setSortKey] = useState<ColumnKey | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    const fetchInventory = async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (filters.location) params.append('location', filters.location);
            if (filters.category) params.append('category', filters.category);
            if (filters.group) params.append('group', filters.group);
            if (filters.qa_status) params.append('qa_status', filters.qa_status);
            if (filters.search) params.append('search', filters.search);

            const response = await api.get<ApiResponse>(
                `/inventory/available/grouped?${params.toString()}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                setInventories(response.data.data || []);
                setFilterOptions(response.data.filters || {
                    locations: [],
                    categories: [],
                    groups: [],
                    qa_statuses: []
                });
            } else {
                setError(response.data.message || 'Failed to fetch inventory');
            }
        } catch (err: any) {
            console.error("Error fetching inventory:", err);
            setError(err.response?.data?.message || 'Failed to fetch inventory data');
            setInventories([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, [filters]);

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

    const clearFilters = () => {
        setFilters({
            location: '',
            category: '',
            group: '',
            qa_status: '',
            search: ''
        });
    };

    const clearColumnFilters = () => {
        setColumnFilters({
            location: '', item_code: '', item_name: '', category: '', group: '', qa_status: '',
            division_code: '', rec_date: '', prod_date: '', exp_date: '', lot_number: '',
            total_qty_available: '', total_qty_onhand: '', total_qty_allocated: '', inventory_count: ''
        });
    };

    const handleColumnFilterChange = (key: ColumnKey, value: string) => {
        setColumnFilters(prev => ({ ...prev, [key]: value }));
    };

    // Cycles: none -> asc -> desc -> none
    const handleSort = (key: ColumnKey) => {
        if (sortKey !== key) {
            setSortKey(key);
            setSortDirection('asc');
        } else if (sortDirection === 'asc') {
            setSortDirection('desc');
        } else if (sortDirection === 'desc') {
            setSortKey(null);
            setSortDirection(null);
        } else {
            setSortDirection('asc');
        }
    };

    const hasActiveColumnFilters = Object.values(columnFilters).some(v => v !== '');

    // Apply per-column search + sort on top of the server-fetched data
    const displayedInventories = useMemo(() => {
        let result = [...inventories];

        // Per-column text filters (case-insensitive "contains")
        (Object.keys(columnFilters) as ColumnKey[]).forEach((key) => {
            const val = columnFilters[key].trim().toLowerCase();
            if (!val) return;
            result = result.filter(inv => {
                const cell = inv[key];
                return String(cell ?? '').toLowerCase().includes(val);
            });
        });

        // Sort
        if (sortKey && sortDirection) {
            const colDef = COLUMNS.find(c => c.key === sortKey);
            result.sort((a, b) => {
                const aVal = a[sortKey];
                const bVal = b[sortKey];

                let cmp = 0;
                if (colDef?.numeric) {
                    cmp = (Number(aVal) || 0) - (Number(bVal) || 0);
                } else {
                    cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''), undefined, { numeric: true, sensitivity: 'base' });
                }
                return sortDirection === 'asc' ? cmp : -cmp;
            });
        }

        return result;
    }, [inventories, columnFilters, sortKey, sortDirection]);

    const exportToCSV = () => {
        const headers = ['Location', 'Item Code', 'Item Name', 'Barcode', 'Category', 'Group', 'QA Status', 'UOM', 'Qty Available', 'Qty Onhand', 'Qty Allocated', 'Count'];
        const rows = displayedInventories.map(inv => [
            inv.location,
            inv.item_code,
            inv.item_name,
            inv.barcode,
            inv.category,
            inv.group,
            inv.qa_status,
            inv.uom,
            inv.total_qty_available,
            inv.total_qty_onhand,
            inv.total_qty_allocated,
            inv.inventory_count
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const renderSortIcon = (key: ColumnKey) => {
        if (sortKey !== key) return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-400" />;
        if (sortDirection === 'asc') return <ArrowUp className="w-3 h-3 text-blue-600" />;
        if (sortDirection === 'desc') return <ArrowDown className="w-3 h-3 text-blue-600" />;
        return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
    };

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
                                    Grouped by Location • {displayedInventories.length} of {inventories.length} items
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => fetchInventory()}
                                    disabled={loading}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                                <button
                                    onClick={exportToCSV}
                                    disabled={displayedInventories.length === 0}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Export
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-[1600px] mx-auto px-4 py-4">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                            <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <div className="text-sm font-medium text-red-900">Error</div>
                                <div className="text-xs text-red-700 mt-0.5">{error}</div>
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="bg-white rounded-lg border border-slate-200 p-3 mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-slate-600" />
                                <span className="text-sm font-medium text-slate-900">Filters</span>
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                                {showFilters ? 'Hide' : 'Show'}
                            </button>
                        </div>

                        {/* Search Bar */}
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
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        <MapPin className="w-3 h-3 inline mr-1" />
                                        Location
                                    </label>
                                    <select
                                        value={filters.location}
                                        onChange={(e) => handleFilterChange('location', e.target.value)}
                                        className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                    >
                                        <option value="">All Locations</option>
                                        {filterOptions.locations?.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        <Package className="w-3 h-3 inline mr-1" />
                                        Category
                                    </label>
                                    <select
                                        value={filters.category}
                                        onChange={(e) => handleFilterChange('category', e.target.value)}
                                        className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                    >
                                        <option value="">All Categories</option>
                                        {filterOptions.categories?.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        <Grid3x3 className="w-3 h-3 inline mr-1" />
                                        Group
                                    </label>
                                    <select
                                        value={filters.group}
                                        onChange={(e) => handleFilterChange('group', e.target.value)}
                                        className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                    >
                                        <option value="">All Groups</option>
                                        {filterOptions.groups?.map(grp => (
                                            <option key={grp} value={grp}>{grp}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">QA Status</label>
                                    <select
                                        value={filters.qa_status}
                                        onChange={(e) => handleFilterChange('qa_status', e.target.value)}
                                        className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                    >
                                        <option value="">All Status</option>
                                        {filterOptions.qa_statuses?.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {(filters.location || filters.category || filters.group || filters.qa_status || filters.search) && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                                <button
                                    onClick={clearFilters}
                                    className="text-xs text-slate-600 hover:text-slate-900 font-medium"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Summary Cards */}
                    {displayedInventories.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 mb-4">
                            <div className="bg-white rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-600 mb-1">Total Items</div>
                                <div className="text-xl font-bold text-slate-900">{displayedInventories.length}</div>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-600 mb-1">Total Available</div>
                                <div className="text-xl font-bold text-green-600">
                                    {displayedInventories.reduce((sum, inv) => sum + inv.total_qty_available, 0).toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-600 mb-1">Total Onhand</div>
                                <div className="text-xl font-bold text-blue-600">
                                    {displayedInventories.reduce((sum, inv) => sum + inv.total_qty_onhand, 0).toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-600 mb-1">Total Allocated</div>
                                <div className="text-xl font-bold text-orange-600">
                                    {displayedInventories.reduce((sum, inv) => sum + inv.total_qty_allocated, 0).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        {COLUMNS.map(col => (
                                            <th
                                                key={col.key}
                                                className={`px-3 py-2.5 text-xs font-semibold text-slate-700 select-none ${
                                                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                                                }`}
                                                style={{ whiteSpace: 'nowrap' }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => handleSort(col.key)}
                                                    className={`group inline-flex items-center gap-1 hover:text-slate-900 ${
                                                        col.align === 'center' ? 'justify-center w-full' : col.align === 'right' ? 'justify-end w-full' : ''
                                                    }`}
                                                >
                                                    {col.label}
                                                    {renderSortIcon(col.key)}
                                                </button>
                                            </th>
                                        ))}
                                    </tr>
                                    {/* Per-column search row */}
                                    <tr className="bg-white border-t border-slate-100">
                                        {COLUMNS.map(col => (
                                            <th key={`filter-${col.key}`} className="px-2 py-1.5">
                                                <input
                                                    type="text"
                                                    value={columnFilters[col.key]}
                                                    onChange={(e) => handleColumnFilterChange(col.key, e.target.value)}
                                                    placeholder="Search..."
                                                    className={`w-full min-w-[80px] px-1.5 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                                                        col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                                                    }`}
                                                />
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200" style={{fontSize : "x-small"}}>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={COLUMNS.length} className="px-3 py-8 text-center text-sm text-slate-500">
                                                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                                                Loading inventory data...
                                            </td>
                                        </tr>
                                    ) : displayedInventories.length === 0 ? (
                                        <tr>
                                            <td colSpan={COLUMNS.length} className="px-3 py-8 text-center text-sm text-slate-500">
                                                {error
                                                    ? 'Failed to load data'
                                                    : hasActiveColumnFilters
                                                        ? (
                                                            <span>
                                                                No results match your column filters.{' '}
                                                                <button
                                                                    onClick={clearColumnFilters}
                                                                    className="text-blue-600 hover:text-blue-700 font-medium"
                                                                >
                                                                    Clear column filters
                                                                </button>
                                                            </span>
                                                        )
                                                        : 'No inventory found'}
                                            </td>
                                        </tr>
                                    ) : (
                                        displayedInventories.map((inv, idx) => (
                                            <tr key={`${inv.location}-${inv.item_code}-${inv.barcode}-${idx}`} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="font-medium text-slate-900">{inv.location}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className="font-mono text-xs text-slate-900">{inv.item_code}</span>
                                                </td>
                                                <td className="px-3 py-2.5" style={{ whiteSpace: 'nowrap' }}>
                                                    <div>
                                                        <div className="text-slate-900 font-medium">{inv.item_name}</div>
                                                        <div className="text-xs text-slate-500 font-mono">{inv.barcode}</div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className="text-slate-700">{inv.category}</span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className="text-slate-700">{inv.group}</span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex justify-center">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${getQaStatusClass(inv.qa_status)}`}>
                                                            {getQaStatusIcon(inv.qa_status)}
                                                            {inv.qa_status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 text-right" style={{ whiteSpace: 'nowrap' }}>
                                                    <span className="text-slate-900 font-medium">{inv.division_code}</span>
                                                </td>
                                                <td className="px-3 py-2.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-normal text-slate-900">{inv.rec_date}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-normal text-slate-900">{inv.prod_date}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-normal text-slate-900">{inv.exp_date}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-normal text-slate-900">{inv.lot_number}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 text-right">
                                                    <span className="font-semibold text-green-700">{inv.total_qty_available.toLocaleString()}</span>
                                                    <span className="text-xs text-slate-500 ml-1">{inv.uom}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-right">
                                                    <span className="text-slate-900">{inv.total_qty_onhand.toLocaleString()}</span>
                                                    <span className="text-xs text-slate-500 ml-1">{inv.uom}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-right">
                                                    <span className="text-slate-700">{inv.total_qty_allocated.toLocaleString()}</span>
                                                    <span className="text-xs text-slate-500 ml-1">{inv.uom}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                                                        {inv.inventory_count}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>


                </div>
            </div>
        </Layout>
    );
};

export default InventoryAvailablePage;