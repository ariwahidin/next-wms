/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";
import { mutate } from "swr";
import api from "@/lib/api";
import Layout from "@/components/layout";
import { Division } from "@/types/division";

interface Inventory {
    ID: number;
    whs_code: string;
    location: string;
    item_code: string;
    barcode: string;
    qa_status: string;
    uom: string;
    qty_available: number;
    qty_onhand: number;
    lot_number: string;
    rec_date: string;
    prod_date: string;
    exp_date: string;
    pallet: string;
    division_code: string;
    owner_code: string;
    carton_number: string;
    product: {
        item_code: string;
        item_name: string;
    };
}

interface GroupedInventory {
    item_code: string;
    item_name: string;
    whs_code: string;
    location: string;
    division_code: string;
    qa_status: string;
    owner_code: string;
    uom: string;
    qty_available: number;
    lot_number: string;
    rec_date: string;
    prod_date: string;
    exp_date: string;
    pallet: string;
    carton_number: string;
    records: Inventory[];
}

interface Warehouse {
    id: number;
    code: string;
    name: string;
}

interface QaStatus {
    id: number;
    qa_status: string;
    description: string;
}

interface Location {
    id: number;
    location_code: string;
    name: string;
    whs_code: string;
}

interface SelectOption {
    value: string;
    label: string;
}

interface TransferFormData {
    item_code: string;
    from_whs_code: string;
    to_whs_code: string;
    from_location: string;
    to_location: string;
    old_qa_status: string;
    new_qa_status: string;
    rec_date: string;
    prod_date: string;
    exp_date: string;
    lot_number: string;
    pallet: string;
    qty_to_transfer: number;
    reason: string;
    from_division_code: string;
    division_code: string;
    carton_number?: string;
}

const emptyForm: TransferFormData = {
    item_code: "",
    from_whs_code: "",
    to_whs_code: "",
    from_location: "",
    to_location: "",
    old_qa_status: "",
    new_qa_status: "",
    rec_date: "",
    prod_date: "",
    exp_date: "",
    lot_number: "",
    pallet: "",
    qty_to_transfer: 0,
    reason: "",
    from_division_code: "",
    division_code: "",
    carton_number: "",
};

export default function InventoryTransferForm() {
    const [inventories, setInventories] = useState<GroupedInventory[]>([]);
    const [qaStatuses, setQaStatuses] = useState<QaStatus[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<GroupedInventory | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [formData, setFormData] = useState<TransferFormData>(emptyForm);

    useEffect(() => {
        fetchInventories();
        fetchWarehouses();
        fetchLocations();
        fetchQaStatus();
        fetchDivisions();
    }, []);

    useEffect(() => {
        if (formData.to_whs_code) {
            setFilteredLocations(locations.filter((loc) => loc.whs_code === formData.to_whs_code));
        } else {
            setFilteredLocations(locations);
        }
    }, [formData.to_whs_code, locations]);

    const fetchInventories = async () => {
        setLoading(true);
        try {
            const response = await api.get("/inventory/grouped", { withCredentials: true });
            if (response.data.success) {
                setInventories(response.data.data.inventories || []);
            }
        } catch (err: any) {
            setError("Failed to fetch inventories");
        } finally {
            setLoading(false);
        }
    };

    const fetchQaStatus = async () => {
        try {
            const response = await api.get("/qa-status", { withCredentials: true });
            if (response.data.success) setQaStatuses(response.data.data || []);
        } catch (err: any) {
            console.error("Failed to fetch qa statuses", err);
        }
    };

    const fetchDivisions = async () => {
        try {
            const response = await api.get("/divisions", { withCredentials: true });
            if (response.data.success) setDivisions(response.data.data || []);
        } catch (err: any) {
            console.error("Failed to fetch divisions", err);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const response = await api.get("/warehouses", { withCredentials: true });
            if (response.data.success) setWarehouses(response.data.data || []);
        } catch (err: any) {
            console.error("Failed to fetch warehouses", err);
        }
    };

    const fetchLocations = async () => {
        try {
            const response = await api.get("/locations", { withCredentials: true });
            if (response.data.success) setLocations(response.data.data || []);
        } catch (err: any) {
            console.error("Failed to fetch locations", err);
        }
    };

    const handleGroupSelect = (group: GroupedInventory) => {
        console.log("Selected group:", group);
        setSelectedGroup(group);
        setFormData({
            ...emptyForm,
            item_code: group.item_code,
            from_whs_code: group.whs_code,
            to_whs_code: group.whs_code,
            from_location: group.location,
            old_qa_status: group.qa_status,
            new_qa_status: group.qa_status,
            from_division_code: group.division_code,
            division_code: group.division_code,
            rec_date: group.rec_date || "",
            prod_date: group.prod_date || "",
            exp_date: group.exp_date || "",
            lot_number: group.lot_number || "",
            pallet: group.pallet || "",
            carton_number: group.carton_number || "",
            to_location: group.location || "",
        });
        setError("");
        setSuccess("");
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "qty_to_transfer" ? parseFloat(value) || 0 : value,
        }));
    };

    const handleWarehouseChange = (option: SelectOption | null) => {
        setFormData((prev) => ({
            ...prev,
            to_whs_code: option?.value || "",
            to_location: "",
        }));
    };

    const handleLocationChange = (option: SelectOption | null) => {
        setFormData((prev) => ({
            ...prev,
            to_location: option?.value || "",
        }));
    };

    const validateForm = (): boolean => {
        if (!selectedGroup) {
            setError("Please select an inventory to transfer");
            return false;
        }
        if (!formData.to_whs_code || !formData.to_location) {
            setError("Destination warehouse and location are required");
            return false;
        }
        if (formData.qty_to_transfer <= 0) {
            setError("Quantity to transfer must be greater than 0");
            return false;
        }
        if (formData.qty_to_transfer > selectedGroup.qty_available) {
            setError(
                `Insufficient quantity. Available: ${selectedGroup.qty_available}, Requested: ${formData.qty_to_transfer}`
            );
            return false;
        }
        if (
            formData.from_whs_code === formData.to_whs_code &&
            formData.from_location === formData.to_location &&
            formData.old_qa_status === formData.new_qa_status &&
            formData.from_division_code === formData.division_code
        ) {
            setError("Source and destination are the same. Please select different attributes.");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!validateForm()) return;

        console.log("Submitting transfer with data:", formData);
        // return;

        setSubmitting(true);
        try {
            const response = await api.post("/inventory/transfer", formData, {
                withCredentials: true,
            });
            if (response.data.success) {
                setSuccess(response.data.message);
                setTimeout(() => {
                    setSelectedGroup(null);
                    setFormData(emptyForm);
                    fetchInventories();
                    mutate("/inventories");
                }, 2000);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to transfer inventory. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        setSelectedGroup(null);
        setFormData(emptyForm);
        setError("");
        setSuccess("");
    };

    const filteredInventories = inventories.filter(
        (inv) =>
            inv.item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.whs_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.division_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.qa_status.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.owner_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.lot_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.carton_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const warehouseOptions: SelectOption[] = warehouses.map((wh) => ({
        value: wh.code,
        label: wh.code,
    }));

    const locationOptions: SelectOption[] = filteredLocations.map((loc) => ({
        value: loc.location_code,
        label: loc.location_code,
    }));

    const divisionOptions: SelectOption[] = divisions.map((div) => ({
        value: div.code,
        label: div.code,
    }));

    const customSelectStyles = {
        control: (base: any, state: any) => ({
            ...base,
            minHeight: "38px",
            borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
            boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.5)" : "none",
            "&:hover": { borderColor: state.isFocused ? "#3b82f6" : "#9ca3af" },
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#dbeafe" : "white",
            color: state.isSelected ? "white" : "#111827",
            "&:active": { backgroundColor: "#3b82f6" },
        }),
    };

    return (
        <Layout title="Inventory" subTitle="Inventory Transfer">
            <div className="max-w-7xl mx-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Panel - Grouped Inventory Selection */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
                            <div className="border-b border-gray-200 px-4 py-3">
                                <h3 className="text-sm font-semibold text-gray-900">Select Inventory</h3>
                            </div>
                            <div className="p-4">
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Search by item code, location, warehouse..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                    {loading ? (
                                        <div className="text-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                            <p className="text-sm text-gray-500 mt-2">Loading...</p>
                                        </div>
                                    ) : filteredInventories.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-8">No inventories found</p>
                                    ) : (
                                        filteredInventories.map((group, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleGroupSelect(group)}
                                                className={`w-full text-left p-3 rounded-lg border transition-all ${selectedGroup?.item_code === group.item_code &&
                                                    selectedGroup?.whs_code === group.whs_code &&
                                                    selectedGroup?.location === group.location &&
                                                    selectedGroup?.division_code === group.division_code &&
                                                    selectedGroup?.qa_status === group.qa_status &&
                                                    selectedGroup?.owner_code === group.owner_code &&
                                                    selectedGroup?.uom === group.uom &&
                                                    selectedGroup?.lot_number === group.lot_number &&
                                                    selectedGroup?.rec_date === group.rec_date &&
                                                    selectedGroup?.prod_date === group.prod_date &&
                                                    selectedGroup?.exp_date === group.exp_date &&
                                                    selectedGroup?.pallet === group.pallet && 
                                                    selectedGroup?.carton_number === group.carton_number
                                                    ? "border-blue-500 bg-blue-50"
                                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs font-semibold text-gray-900">{group.item_code}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded ${group.qty_available > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                        {group.qty_available} {group.uom}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mb-1">📦 {group.item_name}</p>
                                                <p className="text-xs text-gray-500">📍 {group.owner_code} | {group.whs_code} | {group.location} | {group.division_code}</p>
                                                <p className="text-xs text-gray-500"> 📅 rd : {group.rec_date} | 🕒 pd : {group.prod_date} | 🕒 ed : {group.exp_date}</p>
                                                <p className="text-xs text-gray-500"> 🏷️ lot : {group.lot_number} | ctn : {group.carton_number} | Pallet : {group.pallet}</p>
                                                <p className="text-xs text-gray-500">
                                                    ✓ {group.qa_status} - {qaStatuses.find((q) => q.qa_status === group.qa_status)?.description || "Unknown QA Status"}
                                                </p>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Transfer Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="border-b border-gray-200 px-6 py-4">
                                <h2 className="text-xl font-semibold text-gray-900">Transfer Inventory</h2>
                                <p className="text-sm text-gray-500 mt-1">Move inventory between warehouses or locations</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6">
                                {/* Selected Inventory Info */}
                                {selectedGroup && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                        <h3 className="text-sm font-semibold text-blue-900 mb-2">Selected Inventory</h3>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-blue-700 font-medium">Item:</span>
                                                <span className="text-blue-900 ml-2">{selectedGroup.item_code}</span>
                                            </div>
                                            <div>
                                                <span className="text-blue-700 font-medium">Available:</span>
                                                <span className="text-blue-900 ml-2">{selectedGroup.qty_available} {selectedGroup.uom}</span>
                                            </div>
                                            <div>
                                                <span className="text-blue-700 font-medium">Whs | Location | Division:</span>
                                                <span className="text-blue-900 ml-2">{selectedGroup.whs_code} | {selectedGroup.location} | {selectedGroup.division_code}</span>
                                            </div>
                                            <div>
                                                <span className="text-blue-700 font-medium">QA Status:</span>
                                                <span className="text-blue-900 ml-2">
                                                    {selectedGroup.qa_status} - {qaStatuses.find((q) => q.qa_status === selectedGroup.qa_status)?.description || "Unknown QA Status"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-blue-700 font-medium">Records:</span>
                                                <span className="text-blue-900 ml-2">{selectedGroup.records.length} lot(s)</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Destination Information */}
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Destination Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                To Warehouse <span className="text-red-500">*</span>
                                            </label>
                                            <Select
                                                options={warehouseOptions}
                                                value={warehouseOptions.find((opt) => opt.value === formData.to_whs_code) || null}
                                                onChange={handleWarehouseChange}
                                                placeholder="Select warehouse..."
                                                isClearable
                                                isSearchable
                                                isDisabled={!selectedGroup}
                                                styles={customSelectStyles}
                                                className="text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                To Location <span className="text-red-500">*</span>
                                            </label>
                                            <Select
                                                options={locationOptions}
                                                value={locationOptions.find((opt) => opt.value === formData.to_location) || null}
                                                onChange={handleLocationChange}
                                                placeholder="Select location..."
                                                isClearable
                                                isSearchable
                                                isDisabled={!selectedGroup || !formData.to_whs_code}
                                                styles={customSelectStyles}
                                                className="text-sm"
                                                noOptionsMessage={() =>
                                                    formData.to_whs_code ? "No locations found" : "Select warehouse first"
                                                }
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">New QA Status</label>
                                            <select
                                                name="new_qa_status"
                                                value={formData.new_qa_status}
                                                onChange={handleInputChange}
                                                disabled={!selectedGroup}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                                            >
                                                <option value="">Keep Current Status</option>
                                                {qaStatuses.map((opt) => (
                                                    <option key={opt.qa_status} value={opt.qa_status}>
                                                        {opt.description} ({opt.qa_status})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                To Division <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="division_code"
                                                value={formData.division_code}
                                                onChange={handleInputChange}
                                                disabled={!selectedGroup}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                                            >
                                                <option value="">Keep Current Division</option>
                                                {divisionOptions.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Transfer Details */}
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Transfer Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Quantity to Transfer <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="qty_to_transfer"
                                                value={formData.qty_to_transfer}
                                                min={0}
                                                step={1}
                                                inputMode="numeric"
                                                onWheel={(e) => e.currentTarget.blur()}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === "" || /^[0-9]+$/.test(value)) {
                                                        handleInputChange(e);
                                                    }
                                                }}
                                                required
                                                disabled={!selectedGroup}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                                            />
                                            {selectedGroup && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Max: {selectedGroup.qty_available} {selectedGroup.uom}
                                                    {selectedGroup.records.length > 1 && (
                                                        <span className="ml-2 text-blue-500">({selectedGroup.records.length} lots, FIFO)</span>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Lot Number</label>
                                            <input
                                                readOnly
                                                type="text"
                                                name="lot_number"
                                                value={formData.lot_number}
                                                onChange={handleInputChange}
                                                disabled={!selectedGroup}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Pallet</label>
                                            <input
                                                readOnly
                                                type="text"
                                                name="pallet"
                                                value={formData.pallet}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Carton Number</label>
                                            <input
                                                readOnly
                                                type="text"
                                                name="carton_number"
                                                value={formData.carton_number}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Receive Date</label>
                                            <input
                                                readOnly
                                                type="date"
                                                name="rec_date"
                                                value={formData.rec_date}
                                                onChange={handleInputChange}
                                                disabled={!selectedGroup}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Production Date</label>
                                            <input
                                                type="date"
                                                name="prod_date"
                                                value={formData.prod_date}
                                                onChange={handleInputChange}
                                                disabled={!selectedGroup}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                            <input
                                                type="date"
                                                name="exp_date"
                                                value={formData.exp_date}
                                                onChange={handleInputChange}
                                                disabled={!selectedGroup}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Reason */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Transfer</label>
                                    <textarea
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleInputChange}
                                        rows={3}
                                        disabled={!selectedGroup}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                                        placeholder="Enter reason for transfer..."
                                    />
                                </div>

                                {/* Error Alert */}
                                {error && (
                                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex">
                                            <svg className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                            <div>
                                                <h3 className="text-sm font-medium text-red-800">Error</h3>
                                                <p className="text-sm text-red-700 mt-1">{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Success Alert */}
                                {success && (
                                    <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex">
                                            <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <div>
                                                <h3 className="text-sm font-medium text-green-800">Success</h3>
                                                <p className="text-sm text-green-700 mt-1">{success}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex space-x-3">
                                    <button
                                        type="submit"
                                        disabled={submitting || !selectedGroup}
                                        className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                </svg>
                                                Transfer Inventory
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        disabled={submitting}
                                        className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}