/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Download, RefreshCw, ArrowRightLeft, TrendingUp, TrendingDown, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import api from "@/lib/api";
import Layout from '@/components/layout';

// Types
interface InventoryMovement {
    id: number;
    movement_id: string;
    item_code: string;
    item_name: string;
    ref_type: string;
    ref_id: number;
    qty_onhand_change: number;
    qty_available_change: number;
    qty_allocated_change: number;
    qty_suspend_change: number;
    qty_shipped_change: number;
    from_whs_code: string;
    to_whs_code: string;
    from_location: string;
    to_location: string;
    old_qa_status: string;
    new_qa_status: string;
    reason: string;
    created_by: number;
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
}

interface ApiResponse {
    success: boolean;
    message: string;
    data: InventoryMovement[];
    pagination: Pagination;
    filters: FilterOptions;
}

const InventoryMovementLedger: React.FC = () => {
    const [movements, setMovements] = useState<InventoryMovement[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        page_size: 50,
        total_records: 0,
        total_pages: 0
    });
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        ref_types: [],
        locations: [],
        whs_codes: [],
        qa_statuses: []
    });

    const [filters, setFilters] = useState({
        ref_type: '',
        item_code: '',
        location: '',
        whs_code: '',
        qa_status: '',
        search: '',
        date_from: '',
        date_to: ''
    });

    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMovements = useCallback(async (page: number = 1) => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('page_size', pagination.page_size.toString());

            if (filters.ref_type) params.append('ref_type', filters.ref_type);
            if (filters.item_code) params.append('item_code', filters.item_code);
            if (filters.location) params.append('location', filters.location);
            if (filters.whs_code) params.append('whs_code', filters.whs_code);
            if (filters.qa_status) params.append('qa_status', filters.qa_status);
            if (filters.search) params.append('search', filters.search);
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);

            const response = await api.get<ApiResponse>(
                `/inventory/movements?${params.toString()}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                setMovements(response.data.data || []);
                setPagination(response.data.pagination);
                setFilterOptions(response.data.filters || {
                    ref_types: [],
                    locations: [],
                    whs_codes: [],
                    qa_statuses: []
                });
            } else {
                setError(response.data.message || 'Failed to fetch movements');
            }
        } catch (err: any) {
            console.error("Error fetching movements:", err);
            setError(err.response?.data?.message || 'Failed to fetch data');
            setMovements([]);
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.page_size]);

    useEffect(() => {
        fetchMovements(1);
    }, [filters]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.total_pages) {
            fetchMovements(newPage);
        }
    };

    const handlePageSizeChange = (size: number) => {
        setPagination(prev => ({ ...prev, page_size: size }));
        fetchMovements(1);
    };

    const getRefTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            'inbound': 'bg-green-50 text-green-700 border-green-200',
            'outbound': 'bg-red-50 text-red-700 border-red-200',
            'allocate': 'bg-blue-50 text-blue-700 border-blue-200',
            'release': 'bg-purple-50 text-purple-700 border-purple-200',
            'transfer': 'bg-orange-50 text-orange-700 border-orange-200',
            'adjust': 'bg-yellow-50 text-yellow-700 border-yellow-200',
            'qc': 'bg-indigo-50 text-indigo-700 border-indigo-200'
        };
        return colors[type.toLowerCase()] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderQuantityChange = (value: number, label: string) => {
        if (value === 0) return null;

        const isPositive = value > 0;
        return (
            <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span className="font-medium">{isPositive ? '+' : ''}{value.toLocaleString()}</span>
                <span className="text-slate-500">{label}</span>
            </div>
        );
    };

    const clearFilters = () => {
        setFilters({
            ref_type: '',
            item_code: '',
            location: '',
            whs_code: '',
            qa_status: '',
            search: '',
            date_from: '',
            date_to: ''
        });
    };

    const exportToCSV = () => {
        const headers = ['Movement ID', 'Date', 'Item Code', 'Item Name', 'Ref Type', 'Ref ID', 'From Loc', 'To Loc', 'Onhand Δ', 'Available Δ', 'Allocated Δ', 'Reason'];
        const rows = movements.map(m => [
            m.movement_id,
            formatDateTime(m.created_at),
            m.item_code,
            m.item_name,
            m.ref_type,
            m.ref_id,
            m.from_location,
            m.to_location,
            m.qty_onhand_change,
            m.qty_available_change,
            m.qty_allocated_change,
            m.reason
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory_movements_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const PageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (pagination.total_pages <= maxVisible + 2) {
            for (let i = 1; i <= pagination.total_pages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            if (pagination.page > 3) {
                pages.push('...');
            }

            const start = Math.max(2, pagination.page - 1);
            const end = Math.min(pagination.total_pages - 1, pagination.page + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (pagination.page < pagination.total_pages - 2) {
                pages.push('...');
            }

            pages.push(pagination.total_pages);
        }

        return (
            <div className="flex items-center gap-1">
                {pages.map((page, idx) => (
                    page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">...</span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page as number)}
                            className={`px-3 py-1 text-xs font-medium rounded ${pagination.page === page
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            {page}
                        </button>
                    )
                ))}
            </div>
        );
    };

    return (
        <Layout title="Inventory" subTitle="Movement Ledger">
            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <div className="bg-white border-b border-slate-200">
                    <div className="max-w-[1600px] mx-auto px-4 py-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-lg font-semibold text-slate-900">Inventory Movement Ledger</h1>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {pagination.total_records.toLocaleString()} total records • Page {pagination.page} of {pagination.total_pages}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={pagination.page_size}
                                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                    className="px-2 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="25">25 / page</option>
                                    <option value="50">50 / page</option>
                                    <option value="100">100 / page</option>
                                </select>
                                <button
                                    onClick={() => fetchMovements(pagination.page)}
                                    disabled={loading}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                                <button
                                    onClick={exportToCSV}
                                    disabled={movements.length === 0}
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
                            <div className="text-sm font-medium text-red-900">Error: {error}</div>
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
                                placeholder="Search by movement ID, item code, or item name..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {showFilters && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            <ArrowRightLeft className="w-3 h-3 inline mr-1" />
                                            Ref Type
                                        </label>
                                        <select
                                            value={filters.ref_type}
                                            onChange={(e) => setFilters({ ...filters, ref_type: e.target.value })}
                                            className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        >
                                            <option value="">All Types</option>
                                            {filterOptions.ref_types.map(type => (
                                                <option key={type} value={type}>{type.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
                                        <select
                                            value={filters.location}
                                            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                            className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        >
                                            <option value="">All Locations</option>
                                            {filterOptions.locations.map(loc => (
                                                <option key={loc} value={loc}>{loc}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Warehouse</label>
                                        <select
                                            value={filters.whs_code}
                                            onChange={(e) => setFilters({ ...filters, whs_code: e.target.value })}
                                            className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        >
                                            <option value="">All Warehouses</option>
                                            {filterOptions.whs_codes.map(whs => (
                                                <option key={whs} value={whs}>{whs}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">QA Status</label>
                                        <select
                                            value={filters.qa_status}
                                            onChange={(e) => setFilters({ ...filters, qa_status: e.target.value })}
                                            className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        >
                                            <option value="">All Status</option>
                                            {filterOptions.qa_statuses.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            <Calendar className="w-3 h-3 inline mr-1" />
                                            Date From
                                        </label>
                                        <input
                                            type="date"
                                            value={filters.date_from}
                                            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                                            className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Date To</label>
                                        <input
                                            type="date"
                                            value={filters.date_to}
                                            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                                            className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {(filters.ref_type || filters.location || filters.whs_code || filters.qa_status || filters.search || filters.date_from || filters.date_to) && (
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

                    {/* Table */}
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Date</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Movement ID</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Item</th>
                                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700">Type</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Movement</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Quantity Changes</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Reason</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-500">
                                                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                                                Loading movements...
                                            </td>
                                        </tr>
                                    ) : movements.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-500">
                                                No movements found
                                            </td>
                                        </tr>
                                    ) : (
                                        movements.map((mov) => (
                                            <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-3 py-2.5">
                                                    <div className="text-slate-900 font-medium">{formatDateTime(mov.created_at).split(',')[0]}</div>
                                                    <div className="text-slate-500">{formatDateTime(mov.created_at).split(',')[1]}</div>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className="font-mono text-slate-900">{mov.movement_id}</span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="text-slate-900 font-medium">{mov.item_name}</div>
                                                    <div className="text-slate-500 font-mono">{mov.item_code}</div>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex justify-center">
                                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${getRefTypeColor(mov.ref_type)}`}>
                                                            {mov.ref_type.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    {mov.from_location && mov.to_location && (
                                                        <div className="flex items-center gap-1 text-slate-700">
                                                            <span className="font-medium">{mov.from_location}</span>
                                                            <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                                                            <span className="font-medium">{mov.to_location}</span>
                                                        </div>
                                                    )}
                                                    {mov.old_qa_status && mov.new_qa_status && mov.old_qa_status !== mov.new_qa_status && (
                                                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                                            QA: {mov.old_qa_status} → {mov.new_qa_status}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="space-y-0.5">
                                                        {renderQuantityChange(mov.qty_onhand_change, 'Onhand')}
                                                        {renderQuantityChange(mov.qty_available_change, 'Available')}
                                                        {renderQuantityChange(mov.qty_allocated_change, 'Allocated')}
                                                        {renderQuantityChange(mov.qty_suspend_change, 'Suspend')}
                                                        {renderQuantityChange(mov.qty_shipped_change, 'Shipped')}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="text-slate-700 max-w-xs truncate" title={mov.reason}>
                                                        {mov.reason || '-'}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {pagination.total_pages > 1 && (
                        <div className="bg-white rounded-lg border border-slate-200 p-3 mt-4">
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-slate-600">
                                    Showing {((pagination.page - 1) * pagination.page_size) + 1} to {Math.min(pagination.page * pagination.page_size, pagination.total_records)} of {pagination.total_records.toLocaleString()} records
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                        className="px-2 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                        Prev
                                    </button>

                                    <PageNumbers />

                                    <button
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page === pagination.total_pages}
                                        className="px-2 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                        Next
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default InventoryMovementLedger;