/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import Layout from "@/components/layout";
import { usePermission } from "@/hooks/usePermission";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Inventory {
    ID: number;
    inventory_number: number;
    whs_code: string;
    location: string;
    item_code: string;
    barcode: string;
    qa_status: string;
    uom: string;
    qty_available: number;
    qty_onhand: number;
    lot_number: string;
    pallet: string;
    division_code: string;
    owner_code: string;
    product: {
        item_code: string;
        item_name: string;
    };
}

interface ReasonCode {
    code: string;
    description: string;
    direction: "in" | "out" | "both";
    require_note: boolean;
}

interface Adjustment {
    ID: number;
    adj_number: string;
    item_code: string;
    whs_code: string;
    location: string;
    reason_code: string;
    notes: string;
    qty_before: number;
    qty_adjust: number;
    qty_after: number;
    uom: string;
    status: string;
    requested_by: number;
    requested_at: string;
    approved_by?: number;
    approved_at?: string;
    rejected_by?: number;
    rejected_at?: string;
    reject_note?: string;
    applied_at?: string;
    inventory: {
        item_code: string;
        product: { item_name: string };
    };
}

interface Pagination {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
    draft: { label: "Draft", cls: "bg-gray-100 text-gray-700" },
    pending: { label: "Pending", cls: "bg-yellow-100 text-yellow-800" },
    approved: { label: "Approved", cls: "bg-blue-100 text-blue-800" },
    rejected: { label: "Rejected", cls: "bg-red-100 text-red-800" },
    applied: { label: "Applied", cls: "bg-green-100 text-green-800" },
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function InventoryAdjustmentPage() {
    // ── Tab state ──────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<"request" | "list">("request");

    // ── Inventory picker ───────────────────────────────────────────────────
    const [inventories, setInventories] = useState<Inventory[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);

    // ── Reason codes ───────────────────────────────────────────────────────
    const [reasonCodes, setReasonCodes] = useState<ReasonCode[]>([]);

    // ── Form ───────────────────────────────────────────────────────────────
    const [formData, setFormData] = useState({
        inventory_id: 0,
        reason_code: "",
        qty_adjust: 0,
        notes: "",
    });
    const [adjustDirection, setAdjustDirection] = useState<"in" | "out">("out");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");

    // ── Adjustment list ────────────────────────────────────────────────────
    const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, page_size: 20, total: 0, total_pages: 0 });
    const [listFilters, setListFilters] = useState({ status: "", search: "", page: 1 });
    const [listLoading, setListLoading] = useState(false);

    // ── Reject modal ───────────────────────────────────────────────────────
    const [rejectModal, setRejectModal] = useState<{ open: boolean; adjID: number | null }>({ open: false, adjID: null });
    const [rejectNote, setRejectNote] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    // ─── FETCH ────────────────────────────────────────────────────────────

    const fetchInventories = useCallback(async () => {
        try {
            const res = await api.get("/inventory/all", { withCredentials: true });
            if (res.data.success) setInventories(res.data.data.inventories || []);
        } catch (e) { console.error(e); }
    }, []);

    const fetchReasonCodes = useCallback(async () => {
        try {
            const res = await api.get("/inventory/adjustments/reason-codes", { withCredentials: true });
            if (res.data.success) setReasonCodes(res.data.data || []);
        } catch (e) { console.error(e); }
    }, []);

    const { can } = usePermission()

    const fetchAdjustments = useCallback(async () => {
        setListLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(listFilters.page),
                page_size: "20",
                ...(listFilters.status && { status: listFilters.status }),
                ...(listFilters.search && { search: listFilters.search }),
            });
            const res = await api.get(`/inventory/adjustments?${params}`, { withCredentials: true });
            if (res.data.success) {
                setAdjustments(res.data.data || []);
                setPagination(res.data.pagination);
            }
        } catch (e) { console.error(e); }
        finally { setListLoading(false); }
    }, [listFilters]);

    useEffect(() => { fetchInventories(); fetchReasonCodes(); }, [fetchInventories, fetchReasonCodes]);
    useEffect(() => { if (activeTab === "list") fetchAdjustments(); }, [activeTab, fetchAdjustments]);

    // ─── HANDLERS ─────────────────────────────────────────────────────────

    const handleInventorySelect = (inv: Inventory) => {
        setSelectedInventory(inv);
        setFormData(prev => ({ ...prev, inventory_id: inv.ID, reason_code: "", qty_adjust: 0, notes: "" }));
        setFormError("");
        setFormSuccess("");
    };

    const handleReasonCodeChange = (code: string) => {
        const rc = reasonCodes.find(r => r.code === code);
        setFormData(prev => ({ ...prev, reason_code: code, qty_adjust: 0 }));
        if (rc) {
            if (rc.direction === "in") setAdjustDirection("in");
            else if (rc.direction === "out") setAdjustDirection("out");
            // "both" → biarkan user pilih sendiri
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        setFormSuccess("");

        if (!selectedInventory) return setFormError("Please select an inventory");
        if (!formData.reason_code) return setFormError("Reason code is required");
        if (formData.qty_adjust <= 0) return setFormError("Quantity must be greater than 0");

        const selectedRC = reasonCodes.find(r => r.code === formData.reason_code);
        if (selectedRC?.require_note && !formData.notes.trim()) {
            return setFormError("Notes are required for this reason code");
        }

        const finalQty = adjustDirection === "out" ? -Math.abs(formData.qty_adjust) : Math.abs(formData.qty_adjust);
        if (adjustDirection === "out" && Math.abs(finalQty) > selectedInventory.qty_onhand) {
            return setFormError(`Insufficient stock. Onhand: ${selectedInventory.qty_onhand} ${selectedInventory.uom}`);
        }

        setSubmitting(true);
        try {
            const res = await api.post("/inventory/adjustments", {
                inventory_id: formData.inventory_id,
                reason_code: formData.reason_code,
                qty_adjust: finalQty,
                notes: formData.notes,
            }, { withCredentials: true });

            if (res.data.success) {
                setFormSuccess(`Adjustment ${res.data.data.adj_number} submitted for approval`);
                setSelectedInventory(null);
                setFormData({ inventory_id: 0, reason_code: "", qty_adjust: 0, notes: "" });
                fetchInventories();
            }
        } catch (err: any) {
            setFormError(err.response?.data?.message || "Failed to submit adjustment");
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async (adjID: number) => {
        if (!confirm("Approve this adjustment? Stock will be updated immediately.")) return;
        setActionLoading(true);
        try {
            await api.post(`/inventory/adjustments/${adjID}/approve`, {}, { withCredentials: true });
            fetchAdjustments();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to approve");
        } finally { setActionLoading(false); }
    };

    const handleReject = async () => {
        if (!rejectModal.adjID || !rejectNote.trim()) return;
        setActionLoading(true);
        try {
            await api.post(`/inventory/adjustments/${rejectModal.adjID}/reject`, { reject_note: rejectNote }, { withCredentials: true });
            setRejectModal({ open: false, adjID: null });
            setRejectNote("");
            fetchAdjustments();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to reject");
        } finally { setActionLoading(false); }
    };

    // ─── DERIVED ──────────────────────────────────────────────────────────

    const filteredInventories = inventories.filter(inv =>
        inv.item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.product?.item_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedRC = reasonCodes.find(r => r.code === formData.reason_code);
    const showDirectionToggle = selectedRC?.direction === "both";

    const qtyPreview = selectedInventory
        ? selectedInventory.qty_onhand + (adjustDirection === "out" ? -formData.qty_adjust : formData.qty_adjust)
        : 0;

    // ─── RENDER ───────────────────────────────────────────────────────────

    return (
        <Layout title="Inventory" subTitle="Inventory Adjustment">
            {/* Reject Modal */}
            {rejectModal.open && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Reject Adjustment</h3>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for rejection <span className="text-red-500">*</span></label>
                        <textarea
                            rows={3}
                            value={rejectNote}
                            onChange={e => setRejectNote(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                            placeholder="Explain why this adjustment is rejected..."
                        />
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => { setRejectModal({ open: false, adjID: null }); setRejectNote(""); }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleReject} disabled={!rejectNote.trim() || actionLoading}
                                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50">
                                {actionLoading ? "Processing..." : "Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto p-6">
                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                    {(["request", "list"] as const).map(tab => (
                        <button key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                            {tab === "request" ? "Request Adjustment" : "Adjustment List"}
                        </button>
                    ))}
                </div>

                {/* ─── TAB: REQUEST ───────────────────────────────────────────── */}
                {activeTab === "request" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Inventory picker */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
                                <div className="border-b border-gray-200 px-4 py-3">
                                    <h3 className="text-sm font-semibold text-gray-900">Select Inventory</h3>
                                </div>
                                <div className="p-4">
                                    <input
                                        type="text"
                                        placeholder="Search item code, name, location..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                                    />
                                    <div className="space-y-2 max-h-[580px] overflow-y-auto">
                                        {filteredInventories.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-8">No inventories found</p>
                                        ) : filteredInventories.map(inv => (
                                            <button key={inv.ID} onClick={() => handleInventorySelect(inv)}
                                                className={`w-full text-left p-3 rounded-lg border transition-all ${selectedInventory?.ID === inv.ID
                                                    ? "border-blue-500 bg-blue-50"
                                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs font-semibold text-gray-900">{inv.item_code}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded ${inv.qty_onhand > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                        {inv.qty_onhand} {inv.uom}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mb-1">📦 {inv.product?.item_name}</p>
                                                <p className="text-xs text-gray-500">📍 {inv.whs_code} | {inv.location}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Form */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                <div className="border-b border-gray-200 px-6 py-4">
                                    <h2 className="text-xl font-semibold text-gray-900">Adjustment Request</h2>
                                    <p className="text-sm text-gray-500 mt-1">Submit a stock adjustment for supervisor approval</p>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6">
                                    {/* Selected inventory info */}
                                    {selectedInventory && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                            <h3 className="text-sm font-semibold text-blue-900 mb-2">Selected Inventory</h3>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div><span className="text-blue-700 font-medium">Item:</span><span className="text-blue-900 ml-2">{selectedInventory.item_code}</span></div>
                                                <div><span className="text-blue-700 font-medium">Name:</span><span className="text-blue-900 ml-2">{selectedInventory.product?.item_name}</span></div>
                                                <div><span className="text-blue-700 font-medium">Location:</span><span className="text-blue-900 ml-2">{selectedInventory.whs_code} / {selectedInventory.location}</span></div>
                                                <div><span className="text-blue-700 font-medium">Qty Onhand:</span><span className="text-blue-900 ml-2 font-semibold">{selectedInventory.qty_onhand} {selectedInventory.uom}</span></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Reason code */}
                                    <div className="mb-5">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Reason Code <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.reason_code}
                                            onChange={e => handleReasonCodeChange(e.target.value)}
                                            disabled={!selectedInventory}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                        >
                                            <option value="">— Select reason —</option>
                                            {reasonCodes.map(rc => (
                                                <option key={rc.code} value={rc.code}>
                                                    {rc.code} — {rc.description}
                                                </option>
                                            ))}
                                        </select>
                                        {selectedRC && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Direction: <span className={`font-medium ${selectedRC.direction === "out" ? "text-red-600" : selectedRC.direction === "in" ? "text-green-600" : "text-blue-600"}`}>
                                                    {selectedRC.direction === "out" ? "Stock Out (−)" : selectedRC.direction === "in" ? "Stock In (+)" : "Both"}
                                                </span>
                                                {selectedRC.require_note && <span className="ml-2 text-orange-600">· Notes required</span>}
                                            </p>
                                        )}
                                    </div>

                                    {/* Direction toggle — hanya tampil untuk "both" */}
                                    {showDirectionToggle && (
                                        <div className="mb-5">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Direction</label>
                                            <div className="flex gap-3">
                                                {(["out", "in"] as const).map(dir => (
                                                    <button key={dir} type="button"
                                                        onClick={() => setAdjustDirection(dir)}
                                                        className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors ${adjustDirection === dir
                                                            ? dir === "out" ? "bg-red-50 border-red-400 text-red-700" : "bg-green-50 border-green-400 text-green-700"
                                                            : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
                                                        {dir === "out" ? "▼ Stock Out (−)" : "▲ Stock In (+)"}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quantity */}
                                    <div className="mb-5">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Quantity to Adjust <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            step={1}
                                            inputMode="numeric"
                                            onWheel={e => e.currentTarget.blur()}
                                            value={formData.qty_adjust || ""}
                                            onChange={e => {
                                                const v = e.target.value;
                                                if (v === "" || /^[0-9]+$/.test(v)) {
                                                    setFormData(prev => ({ ...prev, qty_adjust: parseInt(v) || 0 }));
                                                }
                                            }}
                                            disabled={!selectedInventory || !formData.reason_code}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                        />
                                        {/* Preview */}
                                        {selectedInventory && formData.qty_adjust > 0 && (
                                            <div className={`mt-2 px-3 py-2 rounded-md text-sm ${qtyPreview < 0 ? "bg-red-50 border border-red-200" : "bg-gray-50 border border-gray-200"}`}>
                                                <span className="text-gray-600">Preview: </span>
                                                <span className="font-medium">{selectedInventory.qty_onhand}</span>
                                                <span className={`mx-1 font-semibold ${adjustDirection === "out" ? "text-red-600" : "text-green-600"}`}>
                                                    {adjustDirection === "out" ? `− ${formData.qty_adjust}` : `+ ${formData.qty_adjust}`}
                                                </span>
                                                <span className="text-gray-400 mx-1">=</span>
                                                <span className={`font-bold ${qtyPreview < 0 ? "text-red-600" : "text-gray-900"}`}>{qtyPreview} {selectedInventory.uom}</span>
                                                {qtyPreview < 0 && <span className="ml-2 text-red-600 text-xs">⚠ Cannot go below 0</span>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Notes {selectedRC?.require_note && <span className="text-red-500">*</span>}
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={formData.notes}
                                            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                            disabled={!selectedInventory}
                                            placeholder={selectedRC?.require_note ? "Required — explain the reason in detail..." : "Optional notes..."}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                        />
                                    </div>

                                    {/* Alerts */}
                                    {formError && (
                                        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                                            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                            <p className="text-sm text-red-700">{formError}</p>
                                        </div>
                                    )}
                                    {formSuccess && (
                                        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                                            <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <p className="text-sm text-green-700">{formSuccess}</p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <button type="submit" disabled={submitting || !selectedInventory || !formData.reason_code || formData.qty_adjust <= 0 || qtyPreview < 0}
                                            className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                            {submitting ? (
                                                <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>Submitting...</>
                                            ) : "Submit for Approval"}
                                        </button>
                                        <button type="button" onClick={() => { setSelectedInventory(null); setFormData({ inventory_id: 0, reason_code: "", qty_adjust: 0, notes: "" }); setFormError(""); setFormSuccess(""); }}
                                            disabled={submitting}
                                            className="px-6 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                                            Reset
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── TAB: LIST ──────────────────────────────────────────────── */}
                {activeTab === "list" && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        {/* Filter bar */}
                        <div className="border-b border-gray-200 px-6 py-4 flex flex-wrap gap-3 items-center">
                            <input
                                type="text"
                                placeholder="Search adj. number or item code..."
                                value={listFilters.search}
                                onChange={e => setListFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                            />
                            <select
                                value={listFilters.status}
                                onChange={e => setListFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Status</option>
                                {Object.entries(STATUS_BADGE).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                ))}
                            </select>
                            <button onClick={fetchAdjustments}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                                Refresh
                            </button>
                            <span className="ml-auto text-sm text-gray-500">{pagination.total} records</span>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        {["Adj Number", "Item", "Location", "Reason", "Qty Before", "Adjust", "Qty After", "Status", "Requested At", "Actions"].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {listLoading ? (
                                        <tr><td colSpan={10} className="text-center py-10 text-gray-500">Loading...</td></tr>
                                    ) : adjustments.length === 0 ? (
                                        <tr><td colSpan={10} className="text-center py-10 text-gray-500">No adjustments found</td></tr>
                                    ) : adjustments.map(adj => {
                                        const badge = STATUS_BADGE[adj.status] || { label: adj.status, cls: "bg-gray-100 text-gray-700" };
                                        return (
                                            <tr key={adj.ID} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-mono text-xs font-medium text-blue-700">{adj.adj_number}</td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-900">{adj.item_code}</div>
                                                    <div className="text-xs text-gray-500">{adj.inventory?.product?.item_name}</div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 text-xs">{adj.whs_code} / {adj.location}</td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono">{adj.reason_code}</span>
                                                    {adj.notes && <div className="text-xs text-gray-500 mt-0.5 max-w-[140px] truncate">{adj.notes}</div>}
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-700">{adj.qty_before}</td>
                                                <td className={`px-4 py-3 text-right font-semibold ${adj.qty_adjust < 0 ? "text-red-600" : "text-green-600"}`}>
                                                    {adj.qty_adjust > 0 ? "+" : ""}{adj.qty_adjust} {adj.uom}
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-700">{adj.qty_after}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                                                    {adj.reject_note && <div className="text-xs text-red-500 mt-0.5 max-w-[120px] truncate">{adj.reject_note}</div>}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                                    {new Date(adj.requested_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {can("outbound_sync_ecom", "create") && adj.status === "pending" && (
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleApprove(adj.ID)} disabled={actionLoading}
                                                                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50">
                                                                Approve
                                                            </button>
                                                            <button onClick={() => setRejectModal({ open: true, adjID: adj.ID })} disabled={actionLoading}
                                                                className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 disabled:opacity-50">
                                                                Reject
                                                            </button>
                                                        </div>
                                                    )}

                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.total_pages > 1 && (
                            <div className="border-t border-gray-200 px-6 py-3 flex items-center justify-between">
                                <span className="text-sm text-gray-500">
                                    Page {pagination.page} of {pagination.total_pages}
                                </span>
                                <div className="flex gap-2">
                                    <button disabled={pagination.page <= 1}
                                        onClick={() => setListFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                                        className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                                        Prev
                                    </button>
                                    <button disabled={pagination.page >= pagination.total_pages}
                                        onClick={() => setListFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                                        className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}