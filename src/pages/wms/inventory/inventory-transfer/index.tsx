/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import Select from "react-select";
import { mutate } from "swr";
import api from "@/lib/api";
import Layout from "@/components/layout";
import { Division } from "@/types/division";

// ─── Types ───────────────────────────────────────────────────────────────────

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
    case_number: string;
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
    owner_code: string;
    qa_status: string;
    owner_code_display?: string; // unused, kept out of the way of owner_code above
    uom: string;
    qty_available: number;
    lot_number: string;
    rec_date: string;
    prod_date: string;
    exp_date: string;
    pallet: string;
    carton_number: string;
    case_number: string;
    records: Inventory[];
}

interface CartonGroup {
    carton_number: string;
    item_code: string;
    item_name: string;
    whs_code: string;
    location: string;
    division_code: string;
    owner_code: string;
    qa_status: string;
    uom: string;
    qty_available: number;
    lot_number: string;
    rec_date: string;
    prod_date: string;
    exp_date: string;
    pallet: string;
    case_number: string;
}

interface Product {
    item_code: string;
    item_name: string;
}

interface Warehouse {
    id: number;
    code: string;
    name: string;
}

interface Owner {
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
    owner_code: string;
    from_whs_code: string;
    to_whs_code: string;
    from_location: string;
    to_location: string;
    old_qa_status: string;
    new_qa_status: string;
    from_prod_date: string;
    to_prod_date: string;
    rec_date: string;
    prod_date: string;
    exp_date: string;
    from_lot_number: string;
    lot_number: string;
    pallet: string;
    qty_to_transfer: number;
    reason: string;
    from_division_code: string;
    division_code: string;
    carton_number?: string;
    case_number?: string;
}

const emptyForm: TransferFormData = {
    item_code: "",
    owner_code: "",
    from_whs_code: "",
    to_whs_code: "",
    from_location: "",
    to_location: "",
    old_qa_status: "",
    new_qa_status: "",
    from_prod_date: "",
    to_prod_date: "",
    rec_date: "",
    prod_date: "",
    exp_date: "",
    from_lot_number: "",
    lot_number: "",
    pallet: "",
    qty_to_transfer: 0,
    reason: "",
    from_division_code: "",
    division_code: "",
    carton_number: "",
    case_number: "",
};

type Tab = "by-quantity" | "by-carton" | "multi-item" | "loc-to-loc" | "transfer-from-excel";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const customSelectStyles = {
    control: (base: any, state: any) => ({
        ...base,
        minHeight: "38px",
        borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
        boxShadow: state.isFocused ? "0 0 0 2px rgba(59,130,246,0.5)" : "none",
        "&:hover": { borderColor: state.isFocused ? "#3b82f6" : "#9ca3af" },
    }),
    option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#dbeafe" : "white",
        color: state.isSelected ? "white" : "#111827",
        "&:active": { backgroundColor: "#3b82f6" },
    }),
};

function buildOptions<T>(
    items: T[],
    keyFn: (item: T) => string,
    qtyFn: (item: T) => number
): SelectOption[] {
    const map = new Map<string, number>();
    items.forEach((item) => {
        const key = keyFn(item);
        if (key) map.set(key, (map.get(key) || 0) + qtyFn(item));
    });
    return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([v, qty]) => ({ value: v, label: `${v} (${qty})` }));
}

function buildQaStatusOptions<T>(
    items: T[],
    keyFn: (item: T) => string,
    qtyFn: (item: T) => number,
    qaStatuses: QaStatus[]
): SelectOption[] {
    const map = new Map<string, number>();
    items.forEach((item) => {
        const key = keyFn(item);
        if (key) map.set(key, (map.get(key) || 0) + qtyFn(item));
    });
    return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([v, qty]) => {
            const desc = qaStatuses.find((q) => q.qa_status === v)?.description;
            return { value: v, label: desc ? `${v} - ${desc} (${qty})` : `${v} (${qty})` };
        });
}

// Composite key for cross-item carton selection. carton_number alone is NOT
// globally unique across items/warehouses/locations, so any selection Set
// or React key that spans more than one item MUST use this instead of
// carton_number alone. See MultiItemTab.
// function cartonCompositeKey(c: CartonGroup): string {
//     return `${c.item_code}|${c.carton_number}|${c.whs_code}|${c.location}`;
// }

function cartonCompositeKey(c: CartonGroup): string {
    return JSON.stringify([
        c.item_code ?? "",
        c.owner_code ?? "",
        c.whs_code ?? "",
        c.location ?? "",
        c.division_code ?? "",
        c.qa_status ?? "",
        c.lot_number ?? "",
        c.rec_date ?? "",
        c.prod_date ?? "",
        c.exp_date ?? "",
        c.pallet ?? "",
        c.carton_number ?? "",
        c.case_number ?? "",
        c.uom ?? "",
    ]);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InventoryTransferPage() {
    const [activeTab, setActiveTab] = useState<Tab>("by-quantity");

    const [qaStatuses, setQaStatuses] = useState<QaStatus[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [owners, setOwners] = useState<Owner[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [masterLoading, setMasterLoading] = useState(false);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setMasterLoading(true);
        await Promise.all([fetchWarehouses(), fetchLocations(), fetchQaStatus(), fetchDivisions(), fetchOwners()]);
        setMasterLoading(false);
    };

    const fetchQaStatus = async () => {
        try {
            const res = await api.get("/qa-status", { withCredentials: true });
            if (res.data.success) setQaStatuses(res.data.data || []);
        } catch { }
    };

    const fetchDivisions = async () => {
        try {
            const res = await api.get("/divisions", { withCredentials: true });
            if (res.data.success) setDivisions(res.data.data || []);
        } catch { }
    };

    // NOTE: assumes GET /owners exists and returns [{code, name}], same shape
    // as /divisions. If this endpoint doesn't exist yet on the backend, this
    // silently leaves `owners` empty and the Owner Code dropdowns below will
    // show no options — flag this to be added if missing.
    const fetchOwners = async () => {
        try {
            const res = await api.get("/owners", { withCredentials: true });
            if (res.data.success) setOwners(res.data.data || []);
        } catch { }
    };

    const fetchWarehouses = async () => {
        try {
            const res = await api.get("/warehouses", { withCredentials: true });
            if (res.data.success) setWarehouses(res.data.data || []);
        } catch { }
    };

    const fetchLocations = async () => {
        try {
            const res = await api.get("/locations", { withCredentials: true });
            if (res.data.success) setLocations(res.data.data || []);
        } catch { }
    };

    const warehouseOptions: SelectOption[] = warehouses.map((w) => ({ value: w.code, label: w.code }));
    const divisionOptions: SelectOption[] = divisions.map((d) => ({ value: d.code, label: d.code }));
    const ownerOptions: SelectOption[] = owners.map((o) => ({ value: o.code, label: `${o.code} — ${o.name}` }));

    const sharedProps = {
        qaStatuses, warehouses, locations, divisions, owners,
        warehouseOptions, divisionOptions, ownerOptions, customSelectStyles,
        masterLoading, onRefresh: fetchAll,
    };

    return (
        <Layout title="Inventory" subTitle="Inventory Transfer">
            <div className="max-w-screen-2xl mx-auto p-6">
                <div className="flex border-b border-gray-200 mb-6">
                    <TabButton active={activeTab === "by-quantity"} onClick={() => setActiveTab("by-quantity")}>
                        By Quantity
                    </TabButton>
                    <TabButton active={activeTab === "by-carton"} onClick={() => setActiveTab("by-carton")}>
                        By Carton
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">multi</span>
                    </TabButton>
                    <TabButton active={activeTab === "multi-item"} onClick={() => setActiveTab("multi-item")}>
                        Multi Item
                        <span className="ml-2 text-xs bg-purple-100 text-purple-700 rounded-full px-2 py-0.5">multi</span>
                    </TabButton>
                    <TabButton active={activeTab === "loc-to-loc"} onClick={() => setActiveTab("loc-to-loc")}>
                        Loc to Loc
                    </TabButton>
                    <TabButton active={activeTab === "transfer-from-excel"} onClick={() => setActiveTab("transfer-from-excel")}>
                        Transfer From Excel
                    </TabButton>
                </div>
                {activeTab === "by-quantity" && <ByQuantityTab {...sharedProps} />}
                {activeTab === "by-carton" && <ByCartonTab {...sharedProps} />}
                {activeTab === "multi-item" && <MultiItemTab {...sharedProps} />}
                {activeTab === "loc-to-loc" && <LocToLocTab {...sharedProps} />}
                {activeTab === "transfer-from-excel" && <TransferFromExcelTab {...sharedProps} />}
            </div>
        </Layout>
    );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button onClick={onClick}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${active ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
            {children}
        </button>
    );
}

// ─── BY QUANTITY TAB ──────────────────────────────────────────────────────────
// ★ CHANGED: Owner Code added as an optional cross-filter, sejajar Division/
// Location/Pallet/QA Status. formData.owner_code is set from the selected
// group and is NOT independently editable (owner is fixed source→destination,
// enforced by the backend guard).

function ByQuantityTab({ qaStatuses, warehouseOptions, locations, divisionOptions, ownerOptions, customSelectStyles, masterLoading, onRefresh }: any) {
    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [filterItem, setFilterItem] = useState<SelectOption | null>(null);
    const [inventories, setInventories] = useState<GroupedInventory[]>([]);
    const [inventoriesLoading, setInventoriesLoading] = useState(false);

    const [filterDivision, setFilterDivision] = useState<SelectOption | null>(null);
    const [filterOwner, setFilterOwner] = useState<SelectOption | null>(null);
    const [filterLocation, setFilterLocation] = useState<SelectOption | null>(null);
    const [filterPallet, setFilterPallet] = useState<SelectOption | null>(null);
    const [filterQaStatus, setFilterQaStatus] = useState<SelectOption | null>(null);

    const [selectedGroup, setSelectedGroup] = useState<GroupedInventory | null>(null);
    const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [formData, setFormData] = useState<TransferFormData>(emptyForm);

    const [filterLot, setFilterLot] = useState<SelectOption | null>(null);

    useEffect(() => {
        const load = async () => {
            setProductsLoading(true);
            try {
                const res = await api.get("/products", { withCredentials: true });
                if (res.data.success) setProducts(res.data.data || []);
            } catch { } finally { setProductsLoading(false); }
        };
        load();
    }, []);

    const resetAllFilters = () => {
        setSelectedGroup(null);
        setFormData(emptyForm);
        setFilterDivision(null);
        setFilterOwner(null);
        setFilterLocation(null);
        setFilterPallet(null);
        setFilterQaStatus(null);
        setFilterLot(null);
        setError("");
        setSuccess("");
    };

    useEffect(() => {
        if (!filterItem) {
            setInventories([]);
            resetAllFilters();
            return;
        }
        const fetch = async () => {
            setInventoriesLoading(true);
            resetAllFilters();
            try {
                const res = await api.get("/inventory/grouped-by-item", {
                    params: { item_code: filterItem.value },
                    withCredentials: true,
                });
                if (res.data.success) setInventories(res.data.data.inventories || []);
                else setInventories([]);
            } catch { setInventories([]); } finally { setInventoriesLoading(false); }
        };
        fetch();
    }, [filterItem]);

    useEffect(() => {
        if (formData.to_whs_code) {
            setFilteredLocations(locations.filter((loc: Location) => loc.whs_code === formData.to_whs_code));
        } else {
            setFilteredLocations(locations);
        }
    }, [formData.to_whs_code, locations]);

    // ── Cross-filter: each option set is built from data filtered by the OTHER filters ──

    const forDivision = useMemo(() => inventories.filter((g) => {
        if (filterOwner && g.owner_code !== filterOwner.value) return false;
        if (filterLocation && g.location !== filterLocation.value) return false;
        if (filterPallet && g.pallet !== filterPallet.value) return false;
        if (filterQaStatus && g.qa_status !== filterQaStatus.value) return false;
        if (filterLot && g.lot_number !== filterLot.value) return false;
        return true;
    }), [inventories, filterOwner, filterLocation, filterPallet, filterQaStatus, filterLot]);

    const forOwner = useMemo(() => inventories.filter((g) => {
        if (filterDivision && g.division_code !== filterDivision.value) return false;
        if (filterLocation && g.location !== filterLocation.value) return false;
        if (filterPallet && g.pallet !== filterPallet.value) return false;
        if (filterQaStatus && g.qa_status !== filterQaStatus.value) return false;
        if (filterLot && g.lot_number !== filterLot.value) return false;
        return true;
    }), [inventories, filterDivision, filterLocation, filterPallet, filterQaStatus, filterLot]);

    const forLocation = useMemo(() => inventories.filter((g) => {
        if (filterDivision && g.division_code !== filterDivision.value) return false;
        if (filterOwner && g.owner_code !== filterOwner.value) return false;
        if (filterPallet && g.pallet !== filterPallet.value) return false;
        if (filterQaStatus && g.qa_status !== filterQaStatus.value) return false;
        if (filterLot && g.lot_number !== filterLot.value) return false;
        return true;
    }), [inventories, filterDivision, filterOwner, filterPallet, filterQaStatus, filterLot]);

    const forPallet = useMemo(() => inventories.filter((g) => {
        if (filterDivision && g.division_code !== filterDivision.value) return false;
        if (filterOwner && g.owner_code !== filterOwner.value) return false;
        if (filterLocation && g.location !== filterLocation.value) return false;
        if (filterQaStatus && g.qa_status !== filterQaStatus.value) return false;
        if (filterLot && g.lot_number !== filterLot.value) return false;
        return true;
    }), [inventories, filterDivision, filterOwner, filterLocation, filterQaStatus, filterLot]);

    const forQaStatus = useMemo(() => inventories.filter((g) => {
        if (filterDivision && g.division_code !== filterDivision.value) return false;
        if (filterOwner && g.owner_code !== filterOwner.value) return false;
        if (filterLocation && g.location !== filterLocation.value) return false;
        if (filterPallet && g.pallet !== filterPallet.value) return false;
        if (filterLot && g.lot_number !== filterLot.value) return false;
        return true;
    }), [inventories, filterDivision, filterOwner, filterLocation, filterPallet, filterQaStatus, filterLot]);

    const divisionFilterOptions = useMemo(() => buildOptions(forDivision, (g) => g.division_code, (g) => g.qty_available), [forDivision]);
    const ownerFilterOptions = useMemo(() => buildOptions(forOwner, (g) => g.owner_code, (g) => g.qty_available), [forOwner]);
    const locationFilterOptions = useMemo(() => buildOptions(forLocation, (g) => g.location, (g) => g.qty_available), [forLocation]);
    const palletFilterOptions = useMemo(() => buildOptions(forPallet, (g) => g.pallet, (g) => g.qty_available), [forPallet]);

    const forLot = useMemo(() => inventories.filter((g) => {
        if (filterDivision && g.division_code !== filterDivision.value) return false;
        if (filterOwner && g.owner_code !== filterOwner.value) return false;
        if (filterLocation && g.location !== filterLocation.value) return false;
        if (filterPallet && g.pallet !== filterPallet.value) return false;
        if (filterQaStatus && g.qa_status !== filterQaStatus.value) return false;
        return true;
    }), [
        inventories,
        filterDivision,
        filterOwner,
        filterLocation,
        filterPallet,
        filterQaStatus,
        filterLot
    ]);

    const lotFilterOptions = useMemo(
        () => buildOptions(forLot, (g) => g.lot_number, (g) => g.qty_available),
        [forLot]
    );

    const qaStatusFilterOptions = useMemo(
        () => buildQaStatusOptions(forQaStatus, (g) => g.qa_status, (g) => g.qty_available, qaStatuses),
        [forQaStatus, qaStatuses]
    );

    useEffect(() => {
        if (filterDivision && !divisionFilterOptions.find((o) => o.value === filterDivision.value)) {
            setFilterDivision(null); setSelectedGroup(null); setFormData(emptyForm);
        }
    }, [divisionFilterOptions]);

    useEffect(() => {
        if (filterOwner && !ownerFilterOptions.find((o) => o.value === filterOwner.value)) {
            setFilterOwner(null); setSelectedGroup(null); setFormData(emptyForm);
        }
    }, [ownerFilterOptions]);

    useEffect(() => {
        if (filterLocation && !locationFilterOptions.find((o) => o.value === filterLocation.value)) {
            setFilterLocation(null); setSelectedGroup(null); setFormData(emptyForm);
        }
    }, [locationFilterOptions]);

    useEffect(() => {
        if (filterPallet && !palletFilterOptions.find((o) => o.value === filterPallet.value)) {
            setFilterPallet(null); setSelectedGroup(null); setFormData(emptyForm);
        }
    }, [palletFilterOptions]);

    useEffect(() => {
        if (filterQaStatus && !qaStatusFilterOptions.find((o) => o.value === filterQaStatus.value)) {
            setFilterQaStatus(null); setSelectedGroup(null); setFormData(emptyForm);
        }
    }, [qaStatusFilterOptions]);

    useEffect(() => {
        if (
            filterLot &&
            !lotFilterOptions.some((o) => o.value === filterLot.value)
        ) {
            setFilterLot(null);
            setSelectedGroup(null);
            setFormData(emptyForm);
        }
    }, [lotFilterOptions]);

    const displayedInventories = useMemo(() => inventories.filter((g) => {
        if (filterDivision && g.division_code !== filterDivision.value) return false;
        if (filterOwner && g.owner_code !== filterOwner.value) return false;
        if (filterLocation && g.location !== filterLocation.value) return false;
        if (filterPallet && g.pallet !== filterPallet.value) return false;
        if (filterQaStatus && g.qa_status !== filterQaStatus.value) return false;
        if (filterLot && g.lot_number !== filterLot.value) return false;
        return true;
    }), [inventories, filterDivision, filterOwner, filterLocation, filterPallet, filterQaStatus, filterLot]);

    const totalQtyDisplayed = useMemo(() => displayedInventories.reduce((sum, g) => sum + g.qty_available, 0), [displayedInventories]);
    const displayedUom = displayedInventories[0]?.uom ?? "";

    const productOptions: SelectOption[] = products.map((p) => ({ value: p.item_code, label: `${p.item_code} — ${p.item_name}` }));
    const locationOptions: SelectOption[] = filteredLocations.map((loc: Location) => ({ value: loc.location_code, label: loc.location_code }));

    const handleGroupSelect = (group: GroupedInventory) => {
        setSelectedGroup(group);
        setFormData({
            ...emptyForm,
            item_code: group.item_code,
            owner_code: group.owner_code,
            from_whs_code: group.whs_code,
            to_whs_code: group.whs_code,
            from_location: group.location,
            old_qa_status: group.qa_status,
            new_qa_status: group.qa_status,
            from_prod_date: group.prod_date,
            to_prod_date: group.prod_date,
            from_division_code: group.division_code,
            division_code: group.division_code,
            rec_date: group.rec_date || "",
            prod_date: group.prod_date || "",
            exp_date: group.exp_date || "",
            from_lot_number: group.lot_number || "",
            lot_number: group.lot_number || "",
            pallet: group.pallet || "",
            carton_number: group.carton_number || "",
            case_number: group.case_number || "",
            to_location: group.location || "",
        });
        setError("");
        setSuccess("");
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: name === "qty_to_transfer" ? parseFloat(value) || 0 : value }));
    };

    const handleWarehouseChange = (option: SelectOption | null) => {
        setFormData((prev) => ({ ...prev, to_whs_code: option?.value || "", to_location: "" }));
    };

    const handleLocationChange = (option: SelectOption | null) => {
        setFormData((prev) => ({ ...prev, to_location: option?.value || "" }));
    };

    const validateForm = (): boolean => {

        console.log("Validating form data:", formData);

        if (!selectedGroup) { setError("Please select an inventory to transfer"); return false; }
        if (!formData.to_whs_code || !formData.to_location) { setError("Destination warehouse and location are required"); return false; }
        if (formData.qty_to_transfer <= 0) { setError("Quantity to transfer must be greater than 0"); return false; }
        if (formData.qty_to_transfer > selectedGroup.qty_available) {
            setError(`Insufficient quantity. Available: ${selectedGroup.qty_available}, Requested: ${formData.qty_to_transfer}`);
            return false;
        }
        if (formData.from_whs_code === formData.to_whs_code &&
            formData.from_location === formData.to_location &&
            formData.old_qa_status === formData.new_qa_status &&
            formData.from_division_code === formData.division_code &&
            formData.from_lot_number === formData.lot_number &&
            formData.from_prod_date === formData.prod_date
        ) {
            setError("Source and destination are the same. Please select different attributes.");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setSuccess("");
        if (!validateForm()) return;
        setSubmitting(true);
        formData.to_prod_date = formData.prod_date; // ensure to_prod_date is set for backend
        try {
            const res = await api.post("/inventory/transfer", formData, { withCredentials: true });
            if (res.data.success) {
                setSuccess(res.data.message);
                setTimeout(async () => {
                    if (filterItem) {
                        setInventoriesLoading(true);
                        setSelectedGroup(null);
                        setFormData(emptyForm);
                        try {
                            const r = await api.get("/inventory/grouped-by-item", { params: { item_code: filterItem.value }, withCredentials: true });
                            if (r.data.success) setInventories(r.data.data.inventories || []);
                        } catch { } finally { setInventoriesLoading(false); }
                    }
                    onRefresh();
                    mutate("/inventories");
                }, 2000);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to transfer inventory. Please try again.");
        } finally { setSubmitting(false); }
    };

    const handleReset = () => {
        setFilterItem(null);
        resetAllFilters();
    };

    const emptyMessage = !filterItem ? "Select an item to view inventory"
        : inventoriesLoading ? ""
            : displayedInventories.length === 0 && inventories.length > 0 ? "No inventory matches the selected filters"
                : "No inventory found for this item";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
                    <div className="border-b border-gray-200 px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-900">Select Inventory</h3>
                    </div>
                    <div className="p-4 space-y-3">
                        <div>
                            <FieldLabel required>Item Code</FieldLabel>
                            <Select options={productOptions} value={filterItem} onChange={(opt) => setFilterItem(opt)}
                                placeholder="Search item code or name..." isClearable isSearchable
                                isLoading={productsLoading || masterLoading} styles={customSelectStyles} className="text-sm" />
                        </div>

                        {inventories.length > 0 && (
                            <>
                                <div className="border-t border-gray-100 pt-3">
                                    <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Optional filters</p>
                                </div>
                                <div>
                                    <FieldLabel>Owner Code</FieldLabel>
                                    <Select options={ownerFilterOptions} value={filterOwner}
                                        onChange={(opt) => { setFilterOwner(opt); setSelectedGroup(null); setFormData(emptyForm); }}
                                        placeholder="All owners" isClearable isSearchable styles={customSelectStyles} className="text-sm" />
                                </div>
                                <div>
                                    <FieldLabel>Division</FieldLabel>
                                    <Select options={divisionFilterOptions} value={filterDivision}
                                        onChange={(opt) => { setFilterDivision(opt); setSelectedGroup(null); setFormData(emptyForm); }}
                                        placeholder="All divisions" isClearable isSearchable styles={customSelectStyles} className="text-sm" />
                                </div>
                                <div>
                                    <FieldLabel>Location</FieldLabel>
                                    <Select options={locationFilterOptions} value={filterLocation}
                                        onChange={(opt) => { setFilterLocation(opt); setSelectedGroup(null); setFormData(emptyForm); }}
                                        placeholder="All locations" isClearable isSearchable styles={customSelectStyles} className="text-sm" />
                                </div>
                                <div>
                                    <FieldLabel>Pallet</FieldLabel>
                                    <Select options={palletFilterOptions} value={filterPallet}
                                        onChange={(opt) => { setFilterPallet(opt); setSelectedGroup(null); setFormData(emptyForm); }}
                                        placeholder="All pallets" isClearable isSearchable styles={customSelectStyles} className="text-sm" />
                                </div>
                                <div>
                                    <FieldLabel>Lot Number</FieldLabel>
                                    <Select
                                        options={lotFilterOptions}
                                        value={filterLot}
                                        onChange={(opt) => {
                                            setFilterLot(opt);
                                            setSelectedGroup(null);
                                            setFormData(emptyForm);
                                        }}
                                        placeholder="All lot numbers"
                                        isClearable
                                        isSearchable
                                        styles={customSelectStyles}
                                        className="text-sm"
                                    />
                                </div>
                                <div>
                                    <FieldLabel>QA Status</FieldLabel>
                                    <Select options={qaStatusFilterOptions} value={filterQaStatus}
                                        onChange={(opt) => { setFilterQaStatus(opt); setSelectedGroup(null); setFormData(emptyForm); }}
                                        placeholder="All QA statuses" isClearable isSearchable styles={customSelectStyles} className="text-sm" />
                                </div>
                            </>
                        )}

                        {!inventoriesLoading && displayedInventories.length > 0 && (
                            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                                <span className="text-xs text-gray-500">{displayedInventories.length} group(s)</span>
                                <span className="text-xs font-semibold text-gray-800">Total: {totalQtyDisplayed} {displayedUom}</span>
                            </div>
                        )}

                        <div className="space-y-2 max-h-[480px] overflow-y-auto">
                            {inventoriesLoading ? <LoadingSpinner />
                                : !filterItem || displayedInventories.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-8">{emptyMessage}</p>
                                ) : displayedInventories.map((group: GroupedInventory, idx: number) => {
                                    const isSelected =
                                        selectedGroup?.item_code === group.item_code &&
                                        selectedGroup?.whs_code === group.whs_code &&
                                        selectedGroup?.location === group.location &&
                                        selectedGroup?.division_code === group.division_code &&
                                        selectedGroup?.owner_code === group.owner_code &&
                                        selectedGroup?.qa_status === group.qa_status &&
                                        selectedGroup?.uom === group.uom &&
                                        selectedGroup?.lot_number === group.lot_number &&
                                        selectedGroup?.rec_date === group.rec_date &&
                                        selectedGroup?.prod_date === group.prod_date &&
                                        selectedGroup?.exp_date === group.exp_date &&
                                        selectedGroup?.pallet === group.pallet &&
                                        selectedGroup?.carton_number === group.carton_number &&
                                        selectedGroup?.case_number === group.case_number;
                                    return (
                                        <button key={idx} onClick={() => handleGroupSelect(group)}
                                            className={`w-full text-left p-3 rounded-lg border transition-all ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-semibold text-gray-900">{group.item_code}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded ${group.qty_available > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                    {group.qty_available} {group.uom}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 mb-1">📦 {group.item_name}</p>
                                            <p className="text-xs text-gray-500">📍 {group.owner_code} | {group.whs_code} | {group.location} | {group.division_code}</p>
                                            <p className="text-xs text-gray-500">📅 rd: {group.rec_date} | pd: {group.prod_date} | ed: {group.exp_date}</p>
                                            <p className="text-xs text-gray-500">🏷️ lot: {group.lot_number} | ctn: {group.carton_number} | pallet: {group.pallet} | case: {group.case_number}</p>
                                            <p className="text-xs text-gray-500">✓ {group.qa_status} - {qaStatuses.find((q: QaStatus) => q.qa_status === group.qa_status)?.description || "Unknown"}</p>
                                        </button>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-xl font-semibold text-gray-900">Transfer Inventory</h2>
                        <p className="text-sm text-gray-500 mt-1">Move inventory between warehouses or locations</p>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6">
                        {selectedGroup && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <h3 className="text-sm font-semibold text-blue-900 mb-2">Selected Inventory</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <InfoRow label="Item" value={`${selectedGroup.item_code}`} />
                                    <InfoRow label="Owner" value={selectedGroup.owner_code} />
                                    <InfoRow label="Available" value={`${selectedGroup.qty_available} ${selectedGroup.uom}`} />
                                    <InfoRow label="Whs | Location | Division" value={`${selectedGroup.whs_code} | ${selectedGroup.location} | ${selectedGroup.division_code}`} />
                                    <InfoRow label="QA Status" value={`${selectedGroup.qa_status} - ${qaStatuses.find((q: QaStatus) => q.qa_status === selectedGroup.qa_status)?.description || "Unknown"}`} />
                                    <InfoRow label="Case Number" value={selectedGroup.case_number || "N/A"} />
                                    <InfoRow label="Records" value={`${selectedGroup.records?.length ?? 1} lot(s)`} />
                                    <InfoRow
                                        label="Source Lot Number"
                                        value={selectedGroup.lot_number || "N/A"}
                                    />
                                </div>
                            </div>
                        )}
                        {!selectedGroup && (
                            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 mb-6 text-center">
                                <p className="text-sm text-gray-500">{!filterItem ? "Select an item from the left panel first" : "Select an inventory group from the left panel"}</p>
                            </div>
                        )}

                        <SectionTitle>Destination Information</SectionTitle>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <FieldLabel required>To Warehouse</FieldLabel>
                                <Select options={warehouseOptions} value={warehouseOptions.find((o: SelectOption) => o.value === formData.to_whs_code) || null}
                                    onChange={handleWarehouseChange} placeholder="Select warehouse..." isClearable isSearchable isDisabled={!selectedGroup}
                                    styles={customSelectStyles} className="text-sm" />
                            </div>
                            <div>
                                <FieldLabel required>To Location</FieldLabel>
                                <Select options={locationOptions} value={locationOptions.find((o: SelectOption) => o.value === formData.to_location) || null}
                                    onChange={handleLocationChange} placeholder="Select location..." isClearable isSearchable
                                    isDisabled={!selectedGroup || !formData.to_whs_code} styles={customSelectStyles} className="text-sm"
                                    noOptionsMessage={() => formData.to_whs_code ? "No locations found" : "Select warehouse first"} />
                            </div>
                            <div>
                                <FieldLabel>New QA Status</FieldLabel>
                                <select name="new_qa_status" value={formData.new_qa_status} onChange={handleInputChange} disabled={!selectedGroup}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100">
                                    <option value="">Keep Current Status</option>
                                    {qaStatuses.map((opt: QaStatus) => <option key={opt.qa_status} value={opt.qa_status}>{opt.description} ({opt.qa_status})</option>)}
                                </select>
                            </div>
                            <div>
                                <FieldLabel required>To Division</FieldLabel>
                                <select name="division_code" value={formData.division_code} onChange={handleInputChange} disabled={!selectedGroup}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100">
                                    <option value="">Keep Current Division</option>
                                    {divisionOptions.map((opt: SelectOption) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <SectionTitle>Transfer Details</SectionTitle>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <FieldLabel required>Quantity to Transfer</FieldLabel>
                                <input type="number" name="qty_to_transfer" value={formData.qty_to_transfer} min={0} step={1} inputMode="numeric"
                                    onWheel={(e) => e.currentTarget.blur()}
                                    onChange={(e) => { if (e.target.value === "" || /^[0-9]+$/.test(e.target.value)) handleInputChange(e); }}
                                    required disabled={!selectedGroup}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100" />
                                {selectedGroup && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Max: {selectedGroup.qty_available} {selectedGroup.uom}
                                        {selectedGroup.records && selectedGroup.records.length > 1 && (
                                            <span className="ml-2 text-blue-500">({selectedGroup.records.length} lots, FIFO)</span>
                                        )}
                                    </p>
                                )}
                            </div>
                            <ReadOnlyField label="Owner Code" value={formData.owner_code} />
                            {/* <ReadOnlyField label="Lot Number" value={formData.lot_number} /> */}
                            <div>
                                <FieldLabel>Destination Lot Number</FieldLabel>
                                <input
                                    type="text"
                                    name="lot_number"
                                    value={formData.lot_number}
                                    onChange={handleInputChange}
                                    disabled={!selectedGroup}
                                    placeholder="Enter destination lot number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Leave unchanged to keep the source lot number.
                                </p>
                            </div>
                            <ReadOnlyField label="Pallet" value={formData.pallet} />
                            <ReadOnlyField label="Carton Number" value={formData.carton_number || ""} />
                            <ReadOnlyField label="Case Number" value={formData.case_number || ""} />
                            <div>
                                <FieldLabel>Production Date</FieldLabel>
                                <input type="date" name="prod_date" value={formData.prod_date} onChange={handleInputChange} disabled={!selectedGroup}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100" />
                            </div>
                            <div>
                                <FieldLabel>Expiry Date</FieldLabel>
                                <input type="date" name="exp_date" value={formData.exp_date} onChange={handleInputChange} disabled={!selectedGroup}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100" />
                            </div>
                        </div>

                        <div className="mb-6">
                            <FieldLabel>Reason for Transfer</FieldLabel>
                            <textarea name="reason" value={formData.reason} onChange={handleInputChange} rows={3} disabled={!selectedGroup}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                                placeholder="Enter reason for transfer..." />
                        </div>

                        <AlertBanner type="error" message={error} />
                        <AlertBanner type="success" message={success} />

                        <div className="flex space-x-3">
                            <button type="submit" disabled={submitting || !selectedGroup}
                                className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                {submitting ? <><SpinIcon />Processing...</> : <><TransferIcon />Transfer Inventory</>}
                            </button>
                            <button type="button" onClick={handleReset} disabled={submitting}
                                className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50">
                                Reset
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ─── BY CARTON TAB ────────────────────────────────────────────────────────────
// ★ CHANGED: Owner Code added as a REQUIRED filter positioned after Whs Code,
// before Item Code — mirrors the natural "warehouse → owner → item" flow in a
// multi-tenant WMS. /inventory/cartons is now called with owner_code, and the
// transfer payload carries owner_code (fixed, read-only downstream — the
// backend rejects any mismatch between it and the source records' owner).

function ByCartonTab({ qaStatuses, locations, ownerOptions, customSelectStyles, onRefresh }: any) {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [masterLoading, setMasterLoading] = useState(false);

    const [filterWhs, setFilterWhs] = useState<SelectOption | null>(null);
    const [filterOwner, setFilterOwner] = useState<SelectOption | null>(null);
    const [filterProduct, setFilterProduct] = useState<SelectOption | null>(null);

    const [filterDivision, setFilterDivision] = useState<SelectOption | null>(null);
    const [filterLocation, setFilterLocation] = useState<SelectOption | null>(null);
    const [filterPallet, setFilterPallet] = useState<SelectOption | null>(null);
    const [filterRecDate, setFilterRecDate] = useState("");
    const [filterLot, setFilterLot] = useState<SelectOption | null>(null);
    const [filterQaStatus, setFilterQaStatus] = useState<SelectOption | null>(null);

    const [cartons, setCartons] = useState<CartonGroup[]>([]);
    const [cartonsLoading, setCartonsLoading] = useState(false);
    const [selectedCartons, setSelectedCartons] = useState<Set<string>>(new Set());

    const [toWhsCode, setToWhsCode] = useState("");
    const [toLocation, setToLocation] = useState("");
    const [newQaStatus, setNewQaStatus] = useState("");
    const [divisionCode, setDivisionCode] = useState("");
    const [newLotNumber, setNewLotNumber] = useState("");
    const [reason, setReason] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

    useEffect(() => {
        const load = async () => {
            setMasterLoading(true);
            try {
                const [whsRes, prodRes, divRes] = await Promise.all([
                    api.get("/warehouses", { withCredentials: true }),
                    api.get("/products", { withCredentials: true }),
                    api.get("/divisions", { withCredentials: true }),
                ]);
                if (whsRes.data.success) setWarehouses(whsRes.data.data || []);
                if (prodRes.data.success) setProducts(prodRes.data.data || []);
                if (divRes.data.success) setDivisions(divRes.data.data || []);
            } catch { } finally { setMasterLoading(false); }
        };
        load();
    }, []);

    // Warehouse + Owner + Item Code are all required to fetch, in that order.
    const canFetch = !!(filterWhs && filterOwner && filterProduct);

    useEffect(() => {
        if (!canFetch) {
            setCartons([]);
            setSelectedCartons(new Set());
            setFilterDivision(null);
            setFilterLocation(null);
            setFilterPallet(null);
            setFilterRecDate("");
            setFilterLot(null);
            setFilterQaStatus(null);
            return;
        }
        const fetch = async () => {
            setCartonsLoading(true);
            setSelectedCartons(new Set());
            try {
                const params: Record<string, string> = {
                    item_code: filterProduct!.value,
                    whs_code: filterWhs!.value,
                    owner_code: filterOwner!.value,
                };
                if (filterDivision) params.division_code = filterDivision.value;
                if (filterLocation) params.location = filterLocation.value;
                if (filterPallet) params.pallet = filterPallet.value;
                if (filterRecDate) params.rec_date = filterRecDate;
                if (filterLot) params.lot_number = filterLot.value;
                if (filterQaStatus) params.qa_status = filterQaStatus.value;
                const res = await api.get("/inventory/cartons", { params, withCredentials: true });
                if (res.data.success) setCartons(res.data.data.cartons || []);
            } catch { setCartons([]); } finally { setCartonsLoading(false); }
        };
        fetch();
    }, [filterWhs, filterOwner, filterProduct, filterDivision, filterLocation, filterPallet, filterRecDate, filterLot, filterQaStatus]);



    const forDivision = useMemo(() => cartons.filter((c) => {
        if (filterLocation && c.location !== filterLocation.value) return false;
        if (filterPallet && c.pallet !== filterPallet.value) return false;
        if (filterLot && c.lot_number !== filterLot.value) return false;
        if (filterQaStatus && c.qa_status !== filterQaStatus.value) return false;
        return true;
    }), [cartons, filterLocation, filterPallet, filterLot, filterQaStatus]);

    const forLocation = useMemo(() => cartons.filter((c) => {
        if (filterDivision && c.division_code !== filterDivision.value) return false;
        if (filterPallet && c.pallet !== filterPallet.value) return false;
        if (filterLot && c.lot_number !== filterLot.value) return false;
        if (filterQaStatus && c.qa_status !== filterQaStatus.value) return false;
        return true;
    }), [cartons, filterDivision, filterPallet, filterLot, filterQaStatus]);

    const forPallet = useMemo(() => cartons.filter((c) => {
        if (filterDivision && c.division_code !== filterDivision.value) return false;
        if (filterLocation && c.location !== filterLocation.value) return false;
        if (filterLot && c.lot_number !== filterLot.value) return false;
        if (filterQaStatus && c.qa_status !== filterQaStatus.value) return false;
        return true;
    }), [cartons, filterDivision, filterLocation, filterLot, filterQaStatus]);

    const forLot = useMemo(() => cartons.filter((c) => {
        if (filterDivision && c.division_code !== filterDivision.value) return false;
        if (filterLocation && c.location !== filterLocation.value) return false;
        if (filterPallet && c.pallet !== filterPallet.value) return false;
        if (filterQaStatus && c.qa_status !== filterQaStatus.value) return false;
        return true;
    }), [cartons, filterDivision, filterLocation, filterPallet, filterQaStatus]);

    const forQaStatus = useMemo(() => cartons.filter((c) => {
        if (filterDivision && c.division_code !== filterDivision.value) return false;
        if (filterLocation && c.location !== filterLocation.value) return false;
        if (filterPallet && c.pallet !== filterPallet.value) return false;
        if (filterLot && c.lot_number !== filterLot.value) return false;
        return true;
    }), [cartons, filterDivision, filterLocation, filterPallet, filterLot]);

    const divisionFilterOptions = useMemo(() => buildOptions(forDivision, (c) => c.division_code, (c) => c.qty_available), [forDivision]);
    const locationFilterOptions = useMemo(() => buildOptions(forLocation, (c) => c.location, (c) => c.qty_available), [forLocation]);
    const palletOptions = useMemo(() => buildOptions(forPallet, (c) => c.pallet, (c) => c.qty_available), [forPallet]);
    const lotOptions = useMemo(() => buildOptions(forLot, (c) => c.lot_number, (c) => c.qty_available), [forLot]);
    const qaStatusFilterOptions = useMemo(
        () => buildQaStatusOptions(forQaStatus, (c) => c.qa_status, (c) => c.qty_available, qaStatuses),
        [forQaStatus, qaStatuses]
    );

    useEffect(() => {
        if (filterDivision && !divisionFilterOptions.find((o) => o.value === filterDivision.value)) setFilterDivision(null);
    }, [divisionFilterOptions]);

    useEffect(() => {
        if (filterLocation && !locationFilterOptions.find((o) => o.value === filterLocation.value)) setFilterLocation(null);
    }, [locationFilterOptions]);

    useEffect(() => {
        if (filterPallet && !palletOptions.find((o) => o.value === filterPallet.value)) setFilterPallet(null);
    }, [palletOptions]);

    useEffect(() => {
        if (filterLot && !lotOptions.find((o) => o.value === filterLot.value)) setFilterLot(null);
    }, [lotOptions]);

    useEffect(() => {
        if (filterQaStatus && !qaStatusFilterOptions.find((o) => o.value === filterQaStatus.value)) setFilterQaStatus(null);
    }, [qaStatusFilterOptions]);



    const displayedCartons = useMemo(() => cartons.filter((c) => {
        if (filterDivision && c.division_code !== filterDivision.value) return false;
        if (filterLocation && c.location !== filterLocation.value) return false;
        if (filterPallet && c.pallet !== filterPallet.value) return false;
        if (filterLot && c.lot_number !== filterLot.value) return false;
        if (filterQaStatus && c.qa_status !== filterQaStatus.value) return false;
        return true;
    }), [cartons, filterDivision, filterLocation, filterPallet, filterLot, filterQaStatus]);

    const warehouseOptions: SelectOption[] = warehouses.map((w) => ({ value: w.code, label: `${w.code} — ${w.name}` }));
    const productOptions: SelectOption[] = products.map((p) => ({ value: p.item_code, label: `${p.item_code} — ${p.item_name}` }));
    const divisionOptions: SelectOption[] = divisions.map((d) => ({ value: d.code, label: d.code }));


    const toggleCarton = (key: string) => {
        setSelectedCartons((prev) => {
            const next = new Set(prev);

            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }

            return next;
        });
    };

    const selectAll = () => {
        setSelectedCartons(
            new Set(displayedCartons.map(cartonCompositeKey))
        );
    };

    const clearAll = () => setSelectedCartons(new Set());

    const selectedCartonData = displayedCartons.filter(
        (c) => selectedCartons.has(cartonCompositeKey(c))
    );



    const totalQty = selectedCartonData.reduce((sum, c) => sum + c.qty_available, 0);
    const totalQtyAll = useMemo(() => displayedCartons.reduce((sum, c) => sum + c.qty_available, 0), [displayedCartons]);
    const cartonsUom = displayedCartons[0]?.uom ?? "";

    const isMixedSource = useMemo(() => {
        if (selectedCartonData.length < 2) return false;
        const first = selectedCartonData[0];
        return selectedCartonData.some((c) => c.whs_code !== first.whs_code || c.location !== first.location);
    }, [selectedCartonData]);

    const filteredDestLocations = useMemo(
        () => (toWhsCode ? locations.filter((l: Location) => l.whs_code === toWhsCode) : locations),
        [toWhsCode, locations]
    );
    const destLocationOptions: SelectOption[] = filteredDestLocations.map((l: Location) => ({ value: l.location_code, label: l.location_code }));

    useEffect(() => {
        setToLocation("");
    }, [toWhsCode]);



    const trimmedNewLotNumber = newLotNumber.trim();
    const hasSelection = selectedCartonData.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setSuccess("");
        if (selectedCartonData.length === 0) { setError("Please select at least one carton."); return; }

        const plannedTransfers = selectedCartonData.map((carton) => {
            const effWhsCode = toWhsCode || carton.whs_code;
            const effLocation = toLocation || carton.location;
            const effQaStatus = newQaStatus || carton.qa_status;
            const effDivisionCode = divisionCode || carton.division_code;
            const effLotNumber = trimmedNewLotNumber || carton.lot_number;
            const isNoop =
                effWhsCode === carton.whs_code &&
                effLocation === carton.location &&
                effQaStatus === carton.qa_status &&
                effDivisionCode === carton.division_code &&
                effLotNumber === carton.lot_number;
            return { carton, effWhsCode, effLocation, effQaStatus, effDivisionCode, effLotNumber, isNoop };
        });

        const toProcess = plannedTransfers.filter((p) => !p.isNoop);
        const skipped = plannedTransfers.filter((p) => p.isNoop);

        if (toProcess.length === 0) {
            setError("No changes to apply — source and destination are identical for every selected carton.");
            return;
        }

        setSubmitting(true);
        setProgress({ done: 0, total: toProcess.length });
        const failedCartons: string[] = [];

        for (let i = 0; i < toProcess.length; i++) {
            const { carton, effWhsCode, effLocation, effQaStatus, effDivisionCode, effLotNumber } = toProcess[i];
            const payload: TransferFormData = {
                item_code: carton.item_code,
                owner_code: carton.owner_code,
                from_whs_code: carton.whs_code,
                to_whs_code: effWhsCode,
                from_location: carton.location,
                from_prod_date: carton.prod_date,
                to_prod_date: carton.prod_date,
                to_location: effLocation,
                old_qa_status: carton.qa_status,
                new_qa_status: effQaStatus,
                rec_date: carton.rec_date || "",
                prod_date: carton.prod_date || "",
                exp_date: carton.exp_date || "",
                from_lot_number: carton.lot_number || "",
                lot_number: effLotNumber || "",
                pallet: carton.pallet || "",
                qty_to_transfer: carton.qty_available,
                reason,
                from_division_code: carton.division_code,
                division_code: effDivisionCode,
                carton_number: carton.carton_number,
                case_number: carton.case_number || "",
            };
            try {
                await api.post("/inventory/transfer", payload, { withCredentials: true });
            } catch { failedCartons.push(carton.carton_number); }
            setProgress({ done: i + 1, total: toProcess.length });
        }

        setSubmitting(false);
        setProgress(null);

        const succeededCount = toProcess.length - failedCartons.length;
        const parts: string[] = [];
        if (succeededCount > 0) parts.push(`${succeededCount} carton(s) transferred`);
        if (skipped.length > 0) parts.push(`${skipped.length} carton(s) skipped (no changes)`);
        if (failedCartons.length > 0) parts.push(`${failedCartons.length} carton(s) failed (${failedCartons.join(", ")})`);

        if (failedCartons.length === 0) {
            setSuccess(parts.join(" · "));
            setSelectedCartons(new Set());
            setToWhsCode(""); setToLocation(""); setNewQaStatus(""); setDivisionCode(""); setNewLotNumber(""); setReason("");
            onRefresh();
            mutate("/inventories");
            if (canFetch) {
                setCartonsLoading(true);
                try {
                    const params: Record<string, string> = { item_code: filterProduct!.value, whs_code: filterWhs!.value, owner_code: filterOwner!.value };
                    if (filterDivision) params.division_code = filterDivision.value;
                    if (filterLocation) params.location = filterLocation.value;
                    if (filterPallet) params.pallet = filterPallet.value;
                    if (filterRecDate) params.rec_date = filterRecDate;
                    if (filterLot) params.lot_number = filterLot.value;
                    if (filterQaStatus) params.qa_status = filterQaStatus.value;
                    const res = await api.get("/inventory/cartons", { params, withCredentials: true });
                    if (res.data.success) setCartons(res.data.data.cartons || []);
                } catch { } finally { setCartonsLoading(false); }
            }
        } else {
            setError(`Transfer completed with errors. ${parts.join(" · ")}`);
            onRefresh();
        }
    };

    const handleReset = () => {
        setFilterWhs(null); setFilterOwner(null); setFilterProduct(null); setFilterDivision(null);
        setFilterLocation(null); setFilterPallet(null); setFilterRecDate(""); setFilterLot(null);
        setFilterQaStatus(null);
        setSelectedCartons(new Set());
        setToWhsCode(""); setToLocation(""); setNewQaStatus(""); setDivisionCode(""); setNewLotNumber(""); setReason("");
        setCartons([]);
        setError(""); setSuccess("");
    };

    const emptyMessage = !filterWhs ? "Select a warehouse to start"
        : !filterOwner ? "Select an owner code"
            : !filterProduct ? "Select an item code"
                : cartonsLoading ? ""
                    : displayedCartons.length === 0 && cartons.length > 0 ? "No cartons match the selected filters"
                        : "No cartons found";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* ── Column 1: Filters (small) ── */}
            <div className="lg:col-span-3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
                    <div className="border-b border-gray-200 px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
                    </div>
                    <div className="p-4 space-y-3">
                        <div>
                            <FieldLabel required>Warehouse</FieldLabel>
                            <Select options={warehouseOptions} value={filterWhs}
                                onChange={(opt) => { setFilterWhs(opt); setFilterOwner(null); setFilterProduct(null); setFilterDivision(null); setFilterLocation(null); setFilterPallet(null); setFilterRecDate(""); setFilterLot(null); setFilterQaStatus(null); }}
                                placeholder="Search warehouse..." isClearable isSearchable isLoading={masterLoading} styles={customSelectStyles} className="text-sm" />
                        </div>
                        <div>
                            <FieldLabel required>Owner Code</FieldLabel>
                            <Select options={ownerOptions} value={filterOwner}
                                onChange={(opt) => { setFilterOwner(opt); setFilterProduct(null); setFilterDivision(null); setFilterLocation(null); setFilterPallet(null); setFilterRecDate(""); setFilterLot(null); setFilterQaStatus(null); }}
                                placeholder="Search owner..." isClearable isSearchable isDisabled={!filterWhs} isLoading={masterLoading} styles={customSelectStyles} className="text-sm" />
                        </div>
                        <div>
                            <FieldLabel required>Item Code</FieldLabel>
                            <Select options={productOptions} value={filterProduct}
                                onChange={(opt) => { setFilterProduct(opt); setFilterDivision(null); setFilterLocation(null); setFilterPallet(null); setFilterRecDate(""); setFilterLot(null); setFilterQaStatus(null); }}
                                placeholder="Search item..." isClearable isSearchable isDisabled={!filterOwner} isLoading={masterLoading} styles={customSelectStyles} className="text-sm" />
                        </div>

                        {cartons.length > 0 && (
                            <>
                                <div className="border-t border-gray-100 pt-3">
                                    <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Optional filters — pick any, in any order</p>
                                </div>
                                <div>
                                    <FieldLabel>Division</FieldLabel>
                                    <Select options={divisionFilterOptions} value={filterDivision} onChange={(opt) => setFilterDivision(opt)}
                                        placeholder="Search division..." isClearable isSearchable styles={customSelectStyles} className="text-sm" />
                                </div>
                                <div>
                                    <FieldLabel>Location</FieldLabel>
                                    <Select options={locationFilterOptions} value={filterLocation} onChange={(opt) => setFilterLocation(opt)}
                                        placeholder="Search location..." isClearable isSearchable styles={customSelectStyles} className="text-sm" />
                                </div>
                                <div>
                                    <FieldLabel>Pallet</FieldLabel>
                                    <Select options={palletOptions} value={filterPallet} onChange={(opt) => setFilterPallet(opt)}
                                        placeholder="Search pallet..." isClearable isSearchable styles={customSelectStyles} className="text-sm" />
                                </div>
                                <div>
                                    <FieldLabel>Lot Number</FieldLabel>
                                    <Select options={lotOptions} value={filterLot} onChange={(opt) => setFilterLot(opt)}
                                        placeholder="Search lot number..." isClearable isSearchable styles={customSelectStyles} className="text-sm" />
                                </div>
                                <div>
                                    <FieldLabel>QA Status</FieldLabel>
                                    <Select options={qaStatusFilterOptions} value={filterQaStatus} onChange={(opt) => setFilterQaStatus(opt)}
                                        placeholder="Search QA status..." isClearable isSearchable styles={customSelectStyles} className="text-sm" />
                                </div>
                                <div>
                                    <FieldLabel>Receive Date</FieldLabel>
                                    <input type="date" value={filterRecDate} onChange={(e) => setFilterRecDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Column 2: Carton cards (medium, spacious grid) ── */}
            <div className="lg:col-span-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
                    <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">Cartons</h3>
                        <span className="text-xs text-gray-500">{selectedCartons.size} selected</span>
                    </div>
                    <div className="p-4 space-y-3">
                        {displayedCartons.length > 0 && (
                            <div className="flex gap-2">
                                <button onClick={selectAll} type="button"
                                    className="flex-1 text-xs px-2 py-1.5 rounded border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors">
                                    Select all ({displayedCartons.length})
                                </button>
                                <button onClick={clearAll} type="button"
                                    className="flex-1 text-xs px-2 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
                                    Clear
                                </button>
                            </div>
                        )}

                        {!cartonsLoading && displayedCartons.length > 0 && (
                            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                                <span className="text-xs text-gray-500">{displayedCartons.length} carton(s)</span>
                                <span className="text-xs font-semibold text-gray-800">Total: {totalQtyAll} {cartonsUom}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 max-h-[75vh] overflow-y-auto pr-1">
                            {cartonsLoading ? (
                                <div className="col-span-full"><LoadingSpinner /></div>
                            ) : !canFetch || displayedCartons.length === 0 ? (
                                <p className="col-span-full text-sm text-gray-400 text-center py-6">{emptyMessage}</p>
                            ) : displayedCartons.map((carton) => {
                                // const checked = selectedCartons.has(carton.carton_number);
                                const selectionKey = cartonCompositeKey(carton);
                                const checked = selectedCartons.has(selectionKey);
                                const qaDesc = qaStatuses.find((q: QaStatus) => q.qa_status === carton.qa_status)?.description;
                                return (
                                    // <label key={carton.carton_number + carton.item_code + carton.location + carton.whs_code + carton.pallet}
                                    //     className={`flex flex-col gap-1.5 p-3 rounded-lg border cursor-pointer transition-all ${checked ? "border-blue-500 bg-blue-50 ring-1 ring-blue-300" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
                                    <label
                                        key={selectionKey}
                                        className={`flex flex-col gap-1.5 p-3 rounded-lg border cursor-pointer transition-all ${checked
                                            ? "border-blue-500 bg-blue-50 ring-1 ring-blue-300"
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                            }`}
                                    >
                                        {/* <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <input type="checkbox" checked={checked} onChange={() => toggleCarton(carton.carton_number)} className="accent-blue-600 shrink-0" />
                                                <span className="text-xs font-semibold text-gray-900 truncate">📦 {carton.carton_number}</span>
                                            </div>

                                            <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${carton.qty_available > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                {carton.qty_available} {carton.uom}
                                            </span>
                                        </div> */}

                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleCarton(selectionKey)}
                                                    className="accent-blue-600 shrink-0"
                                                />
                                                <span className="text-xs font-semibold text-gray-900 truncate">
                                                    📦 {carton.carton_number || "No Carton Number"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-600 space-y-0.5 pl-6">
                                            <p className="truncate">
                                                <span className="text-gray-400">Item:</span> {carton.item_code}</p>
                                            <p className="truncate text-gray-500">{carton.item_name}</p>
                                            <p><span className="text-gray-400">Owner:</span> {carton.owner_code}</p>
                                            <p><span className="text-gray-400">Whs:</span> {carton.whs_code} · <span className="text-gray-400">Loc:</span> {carton.location}</p>
                                            <p><span className="text-gray-400">Div:</span> {carton.division_code}</p>
                                            <p><span className="text-gray-400">Lot:</span> {carton.lot_number} · <span className="text-gray-400">Pallet:</span> {carton.pallet}</p>
                                            <p><span className="text-gray-400">Case:</span> {carton.case_number || "N/A"}</p>
                                            <p><span className="text-gray-400">Rec:</span> {carton.rec_date}</p>
                                            {(carton.prod_date || carton.exp_date) && (
                                                <p><span className="text-gray-400">Prod/Exp:</span> {carton.prod_date || "-"} / {carton.exp_date || "-"}</p>
                                            )}
                                            <p><span className="text-gray-400">QA:</span> {carton.qa_status}{qaDesc ? ` - ${qaDesc}` : ""}</p>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Column 3: Destination form (large) ── */}
            <div className="lg:col-span-5">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-xl font-semibold text-gray-900">Transfer by Carton</h2>
                        <p className="text-sm text-gray-500 mt-1">Transfer full cartons — no partial qty. Multiple cartons in one action, even from different warehouses/locations.</p>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6">
                        {hasSelection && (
                            <div className="rounded-lg p-4 mb-6 border bg-blue-50 border-blue-200">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-sm font-semibold text-blue-900">Selected Cartons</h3>
                                    <span className="text-xs text-gray-600">{selectedCartonData.length} carton(s) · {totalQty} units total</span>
                                </div>
                                {isMixedSource && (
                                    <p className="text-xs text-blue-800 mb-2">
                                        ℹ️ These cartons come from different warehouses/locations. Each keeps its own source
                                        warehouse/location unless you set a destination below — in that case, it applies to all of them.
                                    </p>
                                )}
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                    {selectedCartonData.map((c: CartonGroup) => (
                                        <div key={c.carton_number} className="flex items-center justify-between text-xs text-gray-700 bg-white rounded px-2 py-1 border border-gray-100">
                                            {/* <span className="font-medium">{c.carton_number}</span>
                                            <span className="text-gray-500">{c.item_code} | {c.whs_code} → {c.location}</span> */}
                                            <div className="min-w-0">
                                                <p className="font-medium">
                                                    {c.item_code} · Carton: {c.carton_number || "N/A"}
                                                </p>
                                                <p className="text-gray-500">
                                                    Lot: {c.lot_number || "N/A"} · Case: {c.case_number || "N/A"}
                                                </p>
                                                <p className="text-gray-500">
                                                    {c.whs_code} / {c.location} · Pallet: {c.pallet || "N/A"}
                                                </p>
                                            </div>
                                            <span className="font-semibold text-green-700">{c.qty_available} {c.uom}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {!hasSelection && (
                            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 mb-6 text-center">
                                <p className="text-sm text-gray-500">Select one or more cartons from the left panel</p>
                            </div>
                        )}

                        <SectionTitle>Destination Information</SectionTitle>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <FieldLabel>To Warehouse</FieldLabel>
                                <Select options={warehouseOptions} value={warehouseOptions.find((o: SelectOption) => o.value === toWhsCode) || null}
                                    onChange={(opt: SelectOption | null) => setToWhsCode(opt?.value || "")}
                                    placeholder="Keep Current Warehouse" isClearable isSearchable isDisabled={!hasSelection} styles={customSelectStyles} className="text-sm" />
                                {hasSelection && toWhsCode === "" && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {isMixedSource ? "Keeps each carton's own source warehouse" : `Keeps current warehouse (${selectedCartonData[0]?.whs_code})`}
                                    </p>
                                )}
                            </div>
                            <div>
                                <FieldLabel>To Location</FieldLabel>
                                <Select options={destLocationOptions} value={destLocationOptions.find((o: SelectOption) => o.value === toLocation) || null}
                                    onChange={(opt: SelectOption | null) => setToLocation(opt?.value || "")}
                                    placeholder="Keep Current Location" isClearable isSearchable isDisabled={!hasSelection}
                                    styles={customSelectStyles} className="text-sm"
                                    noOptionsMessage={() => toWhsCode ? "No locations found" : "Showing all locations — select a warehouse to narrow down"} />
                                {hasSelection && toLocation === "" && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {isMixedSource ? "Keeps each carton's own source location" : `Keeps current location (${selectedCartonData[0]?.location})`}
                                    </p>
                                )}
                            </div>
                            <div>
                                <FieldLabel>New QA Status</FieldLabel>
                                <select value={newQaStatus} onChange={(e) => setNewQaStatus(e.target.value)} disabled={!hasSelection}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100">
                                    <option value="">Keep Current Status</option>
                                    {qaStatuses.map((opt: QaStatus) => <option key={opt.qa_status} value={opt.qa_status}>{opt.description} ({opt.qa_status})</option>)}
                                </select>
                            </div>
                            <div>
                                <FieldLabel>To Division</FieldLabel>
                                <select value={divisionCode} onChange={(e) => setDivisionCode(e.target.value)} disabled={!hasSelection}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100">
                                    <option value="">Keep Current Division</option>
                                    {divisionOptions.map((opt: SelectOption) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <FieldLabel>New Lot Number</FieldLabel>
                                <input type="text" value={newLotNumber} onChange={(e) => setNewLotNumber(e.target.value)} disabled={!hasSelection}
                                    placeholder="Keep Current Lot Number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100" />
                                {hasSelection && trimmedNewLotNumber !== "" && (
                                    <p className="text-xs text-blue-600 mt-1">
                                        Will apply to all {selectedCartonData.length} selected carton(s)
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mb-6">
                            <FieldLabel>Reason for Transfer</FieldLabel>
                            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} disabled={!hasSelection}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                                placeholder="Enter reason for transfer..." />
                        </div>

                        {progress && (
                            <div className="mb-4">
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Transferring cartons...</span>
                                    <span>{progress.done} / {progress.total}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
                                </div>
                            </div>
                        )}

                        <AlertBanner type="error" message={error} />
                        <AlertBanner type="success" message={success} />

                        <div className="flex space-x-3">
                            <button type="submit" disabled={submitting || !hasSelection}
                                className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                {submitting
                                    ? <><SpinIcon />Processing {progress?.done ?? 0}/{progress?.total ?? selectedCartonData.length}...</>
                                    : <><TransferIcon />Transfer {selectedCartons.size > 0 ? `${selectedCartons.size} Carton(s)` : "Cartons"}</>}
                            </button>
                            <button type="button" onClick={handleReset} disabled={submitting}
                                className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50">
                                Reset
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ─── MULTI ITEM TAB (NEW) ──────────────────────────────────────────────────────
// Full-carton transfer across MULTIPLE items in one submission, scoped to a
// single Warehouse + single Owner Code (owner is fixed source→destination —
// enforced both here in the UI, by restricting item selection to one owner,
// and by the backend guard). Flow: Warehouse → Owner Code → Items (multi) →
// pick cartons across those items → one shared destination → submit loop.
//
// ★ Key difference from ByCartonTab: because cartons can come from several
// items, `carton_number` alone is NOT a safe selection/React key (two
// different items could coincidentally share the same carton_number). Every
// selection Set entry and every React `key` here uses cartonCompositeKey()
// instead.

function MultiItemTab({ qaStatuses, locations, ownerOptions, customSelectStyles, onRefresh }: any) {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [masterLoading, setMasterLoading] = useState(false);

    const [filterWhs, setFilterWhs] = useState<SelectOption | null>(null);
    const [filterOwner, setFilterOwner] = useState<SelectOption | null>(null);
    const [filterItems, setFilterItems] = useState<SelectOption[]>([]); // multi-select

    const [filterDivision, setFilterDivision] = useState<SelectOption | null>(null);
    const [filterLocation, setFilterLocation] = useState<SelectOption | null>(null);
    const [filterPallet, setFilterPallet] = useState<SelectOption | null>(null);
    const [filterRecDate, setFilterRecDate] = useState("");
    const [filterLot, setFilterLot] = useState<SelectOption | null>(null);
    const [filterQaStatus, setFilterQaStatus] = useState<SelectOption | null>(null);

    const [cartons, setCartons] = useState<CartonGroup[]>([]);
    const [cartonsLoading, setCartonsLoading] = useState(false);
    const [selectedCartons, setSelectedCartons] = useState<Set<string>>(new Set()); // composite keys

    const [toWhsCode, setToWhsCode] = useState("");
    const [toLocation, setToLocation] = useState("");
    const [newQaStatus, setNewQaStatus] = useState("");
    const [divisionCode, setDivisionCode] = useState("");
    const [newLotNumber, setNewLotNumber] = useState("");
    const [reason, setReason] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

    useEffect(() => {
        const load = async () => {
            setMasterLoading(true);
            try {
                const [whsRes, prodRes, divRes] = await Promise.all([
                    api.get("/warehouses", { withCredentials: true }),
                    api.get("/products", { withCredentials: true }),
                    api.get("/divisions", { withCredentials: true }),
                ]);
                if (whsRes.data.success) setWarehouses(whsRes.data.data || []);
                if (prodRes.data.success) setProducts(prodRes.data.data || []);
                if (divRes.data.success) setDivisions(divRes.data.data || []);
            } catch { } finally { setMasterLoading(false); }
        };
        load();
    }, []);

    const canFetch = !!(filterWhs && filterOwner && filterItems.length > 0);

    useEffect(() => {
        if (!canFetch) {
            setCartons([]);
            setSelectedCartons(new Set());
            setFilterDivision(null);
            setFilterLocation(null);
            setFilterPallet(null);
            setFilterRecDate("");
            setFilterLot(null);
            setFilterQaStatus(null);
            return;
        }
        const fetch = async () => {
            setCartonsLoading(true);
            setSelectedCartons(new Set());
            try {
                // /inventory/cartons only accepts ONE item_code per call — fetch
                // per selected item in parallel, then merge. Every item shares
                // the same whs_code/owner_code (both fixed above the item picker).
                const results = await Promise.all(
                    filterItems.map((item) => {
                        const params: Record<string, string> = {
                            item_code: item.value,
                            whs_code: filterWhs!.value,
                            owner_code: filterOwner!.value,
                        };
                        if (filterDivision) params.division_code = filterDivision.value;
                        if (filterLocation) params.location = filterLocation.value;
                        if (filterPallet) params.pallet = filterPallet.value;
                        if (filterRecDate) params.rec_date = filterRecDate;
                        if (filterLot) params.lot_number = filterLot.value;
                        if (filterQaStatus) params.qa_status = filterQaStatus.value;
                        return api.get("/inventory/cartons", { params, withCredentials: true }).catch(() => null);
                    })
                );
                const merged: CartonGroup[] = [];
                results.forEach((res) => {
                    if (res?.data?.success) merged.push(...(res.data.data.cartons || []));
                });
                setCartons(merged);
            } catch { setCartons([]); } finally { setCartonsLoading(false); }
        };
        fetch();
    }, [filterWhs, filterOwner, filterItems, filterDivision, filterLocation, filterPallet, filterRecDate, filterLot, filterQaStatus]);

    // ── Cross-filter for optional filters (same pattern as ByCartonTab) ──

    const forDivision = useMemo(() => cartons.filter((c) => {
        if (filterLocation && c.location !== filterLocation.value) return false;
        if (filterPallet && c.pallet !== filterPallet.value) return false;
        if (filterLot && c.lot_number !== filterLot.value) return false;
        if (filterQaStatus && c.qa_status !== filterQaStatus.value) return false;
        return true;
    }), [cartons, filterLocation, filterPallet, filterLot, filterQaStatus]);

    const forLocation = useMemo(() => cartons.filter((c) => {
        if (filterDivision && c.division_code !== filterDivision.value) return false;
        if (filterPallet && c.pallet !== filterPallet.value) return false;
        if (filterLot && c.lot_number !== filterLot.value) return false;
        if (filterQaStatus && c.qa_status !== filterQaStatus.value) return false;
        return true;
    }), [cartons, filterDivision, filterPallet, filterLot, filterQaStatus]);

    const forPallet = useMemo(() => cartons.filter((c) => {
        if (filterDivision && c.division_code !== filterDivision.value) return false;
        if (filterLocation && c.location !== filterLocation.value) return false;
        if (filterLot && c.lot_number !== filterLot.value) return false;
        if (filterQaStatus && c.qa_status !== filterQaStatus.value) return false;
        return true;
    }), [cartons, filterDivision, filterLocation, filterLot, filterQaStatus]);

    const forLot = useMemo(() => cartons.filter((c) => {
        if (filterDivision && c.division_code !== filterDivision.value) return false;
        if (filterLocation && c.location !== filterLocation.value) return false;
        if (filterPallet && c.pallet !== filterPallet.value) return false;
        if (filterQaStatus && c.qa_status !== filterQaStatus.value) return false;
        return true;
    }), [cartons, filterDivision, filterLocation, filterPallet, filterQaStatus]);

    const forQaStatus = useMemo(() => cartons.filter((c) => {
        if (filterDivision && c.division_code !== filterDivision.value) return false;
        if (filterLocation && c.location !== filterLocation.value) return false;
        if (filterPallet && c.pallet !== filterPallet.value) return false;
        if (filterLot && c.lot_number !== filterLot.value) return false;
        return true;
    }), [cartons, filterDivision, filterLocation, filterPallet, filterLot]);

    const divisionFilterOptions = useMemo(() => buildOptions(forDivision, (c) => c.division_code, (c) => c.qty_available), [forDivision]);
    const locationFilterOptions = useMemo(() => buildOptions(forLocation, (c) => c.location, (c) => c.qty_available), [forLocation]);
    const palletOptions = useMemo(() => buildOptions(forPallet, (c) => c.pallet, (c) => c.qty_available), [forPallet]);
    const lotOptions = useMemo(() => buildOptions(forLot, (c) => c.lot_number, (c) => c.qty_available), [forLot]);
    const qaStatusFilterOptions = useMemo(
        () => buildQaStatusOptions(forQaStatus, (c) => c.qa_status, (c) => c.qty_available, qaStatuses),
        [forQaStatus, qaStatuses]
    );

    useEffect(() => {
        if (filterDivision && !divisionFilterOptions.find((o) => o.value === filterDivision.value)) setFilterDivision(null);
    }, [divisionFilterOptions]);

    useEffect(() => {
        if (filterLocation && !locationFilterOptions.find((o) => o.value === filterLocation.value)) setFilterLocation(null);
    }, [locationFilterOptions]);

    useEffect(() => {
        if (filterPallet && !palletOptions.find((o) => o.value === filterPallet.value)) setFilterPallet(null);
    }, [palletOptions]);

    useEffect(() => {
        if (filterLot && !lotOptions.find((o) => o.value === filterLot.value)) setFilterLot(null);
    }, [lotOptions]);

    useEffect(() => {
        if (filterQaStatus && !qaStatusFilterOptions.find((o) => o.value === filterQaStatus.value)) setFilterQaStatus(null);
    }, [qaStatusFilterOptions]);

    const displayedCartons = useMemo(() => cartons.filter((c) => {
        if (filterDivision && c.division_code !== filterDivision.value) return false;
        if (filterLocation && c.location !== filterLocation.value) return false;
        if (filterPallet && c.pallet !== filterPallet.value) return false;
        if (filterLot && c.lot_number !== filterLot.value) return false;
        if (filterQaStatus && c.qa_status !== filterQaStatus.value) return false;
        return true;
    }), [cartons, filterDivision, filterLocation, filterPallet, filterLot, filterQaStatus]);

    useEffect(() => {
        const visibleKeys = new Set(
            displayedCartons.map((carton) => cartonCompositeKey(carton))
        );

        setSelectedCartons((previous) => {
            const next = new Set(
                [...previous].filter((key) => visibleKeys.has(key))
            );

            return next.size === previous.size ? previous : next;
        });
    }, [displayedCartons]);

    // Group displayed cartons by item, purely for a clearer list UI.
    const cartonsByItem = useMemo(() => {
        const map = new Map<string, CartonGroup[]>();
        displayedCartons.forEach((c) => {
            if (!map.has(c.item_code)) map.set(c.item_code, []);
            map.get(c.item_code)!.push(c);
        });
        return Array.from(map.entries());
    }, [displayedCartons]);

    const warehouseOptions: SelectOption[] = warehouses.map((w) => ({ value: w.code, label: `${w.code} — ${w.name}` }));
    const productOptions: SelectOption[] = products.map((p) => ({ value: p.item_code, label: `${p.item_code} — ${p.item_name}` }));
    const divisionOptions: SelectOption[] = divisions.map((d) => ({ value: d.code, label: d.code }));

    const toggleCarton = (key: string) => {
        setSelectedCartons((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };
    const selectAll = () => setSelectedCartons(new Set(displayedCartons.map(cartonCompositeKey)));
    const clearAll = () => setSelectedCartons(new Set());

    const selectedCartonData = displayedCartons.filter((c) => selectedCartons.has(cartonCompositeKey(c)));
    const totalQty = selectedCartonData.reduce((sum, c) => sum + c.qty_available, 0);
    const totalQtyAll = useMemo(() => displayedCartons.reduce((sum, c) => sum + c.qty_available, 0), [displayedCartons]);
    const cartonsUom = displayedCartons[0]?.uom ?? "";
    const selectedItemCount = useMemo(() => new Set(selectedCartonData.map((c) => c.item_code)).size, [selectedCartonData]);

    const isMixedSource = useMemo(() => {
        if (selectedCartonData.length < 2) return false;
        const first = selectedCartonData[0];
        return selectedCartonData.some((c) => c.whs_code !== first.whs_code || c.location !== first.location);
    }, [selectedCartonData]);

    const filteredDestLocations = useMemo(
        () => (toWhsCode ? locations.filter((l: Location) => l.whs_code === toWhsCode) : locations),
        [toWhsCode, locations]
    );
    const destLocationOptions: SelectOption[] = filteredDestLocations.map((l: Location) => ({ value: l.location_code, label: l.location_code }));

    useEffect(() => {
        setToLocation("");
    }, [toWhsCode]);

    const trimmedNewLotNumber = newLotNumber.trim();
    const hasSelection = selectedCartonData.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setSuccess("");
        if (selectedCartonData.length === 0) { setError("Please select at least one carton."); return; }

        const plannedTransfers = selectedCartonData.map((carton) => {
            const effWhsCode = toWhsCode || carton.whs_code;
            const effLocation = toLocation || carton.location;
            const effQaStatus = newQaStatus || carton.qa_status;
            const effDivisionCode = divisionCode || carton.division_code;
            const effLotNumber = trimmedNewLotNumber || carton.lot_number;
            const isNoop =
                effWhsCode === carton.whs_code &&
                effLocation === carton.location &&
                effQaStatus === carton.qa_status &&
                effDivisionCode === carton.division_code &&
                effLotNumber === carton.lot_number;
            return { carton, effWhsCode, effLocation, effQaStatus, effDivisionCode, effLotNumber, isNoop };
        });

        const toProcess = plannedTransfers.filter((p) => !p.isNoop);
        const skipped = plannedTransfers.filter((p) => p.isNoop);

        if (toProcess.length === 0) {
            setError("No changes to apply — source and destination are identical for every selected carton.");
            return;
        }

        setSubmitting(true);
        setProgress({ done: 0, total: toProcess.length });
        const failedCartons: string[] = [];

        for (let i = 0; i < toProcess.length; i++) {
            const { carton, effWhsCode, effLocation, effQaStatus, effDivisionCode, effLotNumber } = toProcess[i];
            const payload: TransferFormData = {
                item_code: carton.item_code,
                owner_code: carton.owner_code, // same for every carton — enforced by the Owner Code filter above
                from_whs_code: carton.whs_code,
                to_whs_code: effWhsCode,
                from_location: carton.location,
                to_location: effLocation,
                old_qa_status: carton.qa_status,
                new_qa_status: effQaStatus,
                from_prod_date: carton.prod_date || "",
                to_prod_date: carton.prod_date || "",
                rec_date: carton.rec_date || "",
                prod_date: carton.prod_date || "",
                exp_date: carton.exp_date || "",
                from_lot_number: carton.lot_number || "",
                lot_number: effLotNumber || "",
                pallet: carton.pallet || "",
                qty_to_transfer: carton.qty_available,
                reason,
                from_division_code: carton.division_code,
                division_code: effDivisionCode,
                carton_number: carton.carton_number,
                case_number: carton.case_number || "",
            };
            try {
                await api.post("/inventory/transfer", payload, { withCredentials: true });
            } catch { failedCartons.push(`${carton.item_code}/${carton.carton_number}`); }
            setProgress({ done: i + 1, total: toProcess.length });
        }

        setSubmitting(false);
        setProgress(null);

        const succeededCount = toProcess.length - failedCartons.length;
        const parts: string[] = [];
        if (succeededCount > 0) parts.push(`${succeededCount} carton(s) transferred`);
        if (skipped.length > 0) parts.push(`${skipped.length} carton(s) skipped (no changes)`);
        if (failedCartons.length > 0) parts.push(`${failedCartons.length} carton(s) failed (${failedCartons.join(", ")})`);

        if (failedCartons.length === 0) {
            setSuccess(parts.join(" · "));
            setSelectedCartons(new Set());
            setToWhsCode(""); setToLocation(""); setNewQaStatus(""); setDivisionCode(""); setNewLotNumber(""); setReason("");
            onRefresh();
            mutate("/inventories");
            if (canFetch) {
                setCartonsLoading(true);
                try {
                    const results = await Promise.all(
                        filterItems.map((item) => {
                            const params: Record<string, string> = { item_code: item.value, whs_code: filterWhs!.value, owner_code: filterOwner!.value };
                            if (filterDivision) params.division_code = filterDivision.value;
                            if (filterLocation) params.location = filterLocation.value;
                            if (filterPallet) params.pallet = filterPallet.value;
                            if (filterRecDate) params.rec_date = filterRecDate;
                            if (filterLot) params.lot_number = filterLot.value;
                            if (filterQaStatus) params.qa_status = filterQaStatus.value;
                            return api.get("/inventory/cartons", { params, withCredentials: true }).catch(() => null);
                        })
                    );
                    const merged: CartonGroup[] = [];
                    results.forEach((res) => { if (res?.data?.success) merged.push(...(res.data.data.cartons || [])); });
                    setCartons(merged);
                } catch { } finally { setCartonsLoading(false); }
            }
        } else {
            setError(`Transfer completed with errors. ${parts.join(" · ")}`);
            onRefresh();
        }
    };

    const handleReset = () => {
        setFilterWhs(null); setFilterOwner(null); setFilterItems([]); setFilterDivision(null);
        setFilterLocation(null); setFilterPallet(null); setFilterRecDate(""); setFilterLot(null);
        setFilterQaStatus(null);
        setSelectedCartons(new Set());
        setToWhsCode(""); setToLocation(""); setNewQaStatus(""); setDivisionCode(""); setNewLotNumber(""); setReason("");
        setCartons([]);
        setError(""); setSuccess("");
    };

    const emptyMessage = !filterWhs ? "Select a warehouse to start"
        : !filterOwner ? "Select an owner code"
            : filterItems.length === 0 ? "Select one or more item codes"
                : cartonsLoading ? ""
                    : displayedCartons.length === 0 && cartons.length > 0 ? "No cartons match the selected filters"
                        : "No cartons found";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* ── Column 1: Filters ── */}
            <div className="lg:col-span-3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
                    <div className="border-b border-gray-200 px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
                    </div>
                    <div className="p-4 space-y-3">
                        <div>
                            <FieldLabel required>Warehouse</FieldLabel>
                            <Select options={warehouseOptions} value={filterWhs}
                                onChange={(opt) => { setFilterWhs(opt); setFilterOwner(null); setFilterItems([]); setFilterDivision(null); setFilterLocation(null); setFilterPallet(null); setFilterRecDate(""); setFilterLot(null); setFilterQaStatus(null); }}
                                placeholder="Search warehouse..." isClearable isSearchable isLoading={masterLoading} styles={customSelectStyles} className="text-sm" />
                        </div>
                        <div>
                            <FieldLabel required>Owner Code</FieldLabel>
                            <Select options={ownerOptions} value={filterOwner}
                                onChange={(opt) => { setFilterOwner(opt); setFilterItems([]); setFilterDivision(null); setFilterLocation(null); setFilterPallet(null); setFilterRecDate(""); setFilterLot(null); setFilterQaStatus(null); }}
                                placeholder="Search owner..." isClearable isSearchable isDisabled={!filterWhs} isLoading={masterLoading} styles={customSelectStyles} className="text-sm" />
                            <p className="text-xs text-gray-400 mt-1">One owner per submit — cartons can't be mixed across owners.</p>
                        </div>
                        <div>
                            <FieldLabel required>Item Codes</FieldLabel>
                            <Select options={productOptions} value={filterItems} isMulti
                                onChange={(opts) => { setFilterItems((opts as SelectOption[]) || []); setFilterDivision(null); setFilterLocation(null); setFilterPallet(null); setFilterRecDate(""); setFilterLot(null); setFilterQaStatus(null); }}
                                placeholder="Search and select items..." isClearable isSearchable isDisabled={!filterOwner} isLoading={masterLoading} styles={customSelectStyles} className="text-sm" />
                        </div>

                        {cartons.length > 0 && (
                            <>
                                <div className="border-t border-gray-100 pt-3">
                                    <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Optional filters — pick any, in any order</p>
                                </div>
                                <div>
                                    <FieldLabel>Division</FieldLabel>
                                    <Select options={divisionFilterOptions} value={filterDivision} onChange={(opt) => setFilterDivision(opt)}
                                        placeholder="Search division..." isClearable isSearchable styles={customSelectStyles} className="text-sm" />
                                </div>
                                <div>
                                    <FieldLabel>Location</FieldLabel>
                                    <Select options={locationFilterOptions} value={filterLocation} onChange={(opt) => setFilterLocation(opt)}
                                        placeholder="Search location..." isClearable isSearchable styles={customSelectStyles} className="text-sm" />
                                </div>
                                <div>
                                    <FieldLabel>Pallet</FieldLabel>
                                    <Select options={palletOptions} value={filterPallet} onChange={(opt) => setFilterPallet(opt)}
                                        placeholder="Search pallet..." isClearable isSearchable styles={customSelectStyles} className="text-sm" />
                                </div>
                                <div>
                                    <FieldLabel>Lot Number</FieldLabel>
                                    <Select options={lotOptions} value={filterLot} onChange={(opt) => setFilterLot(opt)}
                                        placeholder="Search lot number..." isClearable isSearchable styles={customSelectStyles} className="text-sm" />
                                </div>
                                <div>
                                    <FieldLabel>QA Status</FieldLabel>
                                    <Select options={qaStatusFilterOptions} value={filterQaStatus} onChange={(opt) => setFilterQaStatus(opt)}
                                        placeholder="Search QA status..." isClearable isSearchable styles={customSelectStyles} className="text-sm" />
                                </div>
                                <div>
                                    <FieldLabel>Receive Date</FieldLabel>
                                    <input type="date" value={filterRecDate} onChange={(e) => setFilterRecDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Column 2: Carton cards, grouped by item ── */}
            <div className="lg:col-span-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
                    <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">Cartons</h3>
                        <span className="text-xs text-gray-500">{selectedCartons.size} selected · {selectedItemCount} item(s)</span>
                    </div>
                    <div className="p-4 space-y-3">
                        {displayedCartons.length > 0 && (
                            <div className="flex gap-2">
                                <button onClick={selectAll} type="button"
                                    className="flex-1 text-xs px-2 py-1.5 rounded border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors">
                                    Select all ({displayedCartons.length})
                                </button>
                                <button onClick={clearAll} type="button"
                                    className="flex-1 text-xs px-2 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
                                    Clear
                                </button>
                            </div>
                        )}

                        {!cartonsLoading && displayedCartons.length > 0 && (
                            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                                <span className="text-xs text-gray-500">{displayedCartons.length} carton(s) · {cartonsByItem.length} item(s)</span>
                                <span className="text-xs font-semibold text-gray-800">Total: {totalQtyAll} {cartonsUom}</span>
                            </div>
                        )}

                        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                            {cartonsLoading ? (
                                <LoadingSpinner />
                            ) : !canFetch || displayedCartons.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-6">{emptyMessage}</p>
                            ) : cartonsByItem.map(([itemCode, itemCartons]) => (
                                <div key={itemCode}>
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                        <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded px-2 py-0.5">
                                            {itemCode}
                                        </span>
                                        <span className="text-xs text-gray-400">{itemCartons.length} carton(s)</span>
                                    </div>
                                    <div className="space-y-2">
                                        {itemCartons.map((carton) => {
                                            const key = cartonCompositeKey(carton);
                                            const checked = selectedCartons.has(key);
                                            const qaDesc = qaStatuses.find((q: QaStatus) => q.qa_status === carton.qa_status)?.description;
                                            return (
                                                <label key={key}
                                                    className={`flex flex-col gap-1.5 p-3 rounded-lg border cursor-pointer transition-all ${checked ? "border-blue-500 bg-blue-50 ring-1 ring-blue-300" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <input type="checkbox" checked={checked} onChange={() => toggleCarton(key)} className="accent-blue-600 shrink-0" />
                                                            {/* <span className="text-xs font-semibold text-gray-900 truncate">📦 {carton.carton_number}</span> */}
                                                            <span className="text-xs font-semibold text-gray-900 truncate">
                                                                📦 {carton.carton_number || "No Carton Number"}
                                                            </span>
                                                        </div>
                                                        <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${carton.qty_available > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                            {carton.qty_available} {carton.uom}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-600 space-y-0.5 pl-6">
                                                        <p className="truncate text-gray-500">{carton.item_name}</p>

                                                        <p><span className="text-gray-400">Owner:</span> {carton.owner_code}</p>
                                                        <p><span className="text-gray-400">Whs:</span> {carton.whs_code} · <span className="text-gray-400">Loc:</span> {carton.location}</p>
                                                        <p><span className="text-gray-400">Div:</span> {carton.division_code}</p>
                                                        <p><span className="text-gray-400">Lot:</span> {carton.lot_number} · <span className="text-gray-400">Pallet:</span> {carton.pallet}</p>
                                                        <p><span className="text-gray-400">Case:</span> {carton.case_number || "N/A"}</p>
                                                        <p><span className="text-gray-400">Rec:</span> {carton.rec_date}</p>
                                                        {(carton.prod_date || carton.exp_date) && (
                                                            <p><span className="text-gray-400">Prod/Exp:</span> {carton.prod_date || "-"} / {carton.exp_date || "-"}</p>
                                                        )}
                                                        <p><span className="text-gray-400">QA:</span> {carton.qa_status}{qaDesc ? ` - ${qaDesc}` : ""}</p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Column 3: Destination form ── */}
            <div className="lg:col-span-5">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-xl font-semibold text-gray-900">Transfer Multi Item</h2>
                        <p className="text-sm text-gray-500 mt-1">Transfer full cartons across multiple items in one action — single owner, one shared destination.</p>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6">
                        {hasSelection && (
                            <div className="rounded-lg p-4 mb-6 border bg-purple-50 border-purple-200">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-sm font-semibold text-purple-900">Selected Cartons</h3>
                                    <span className="text-xs text-gray-600">{selectedCartonData.length} carton(s) · {selectedItemCount} item(s) · {totalQty} units total</span>
                                </div>
                                {isMixedSource && (
                                    <p className="text-xs text-purple-800 mb-2">
                                        ℹ️ These cartons come from different warehouses/locations. Each keeps its own source
                                        warehouse/location unless you set a destination below — in that case, it applies to all of them.
                                    </p>
                                )}
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                    {selectedCartonData.map((c: CartonGroup) => (
                                        <div key={cartonCompositeKey(c)} className="flex items-center justify-between text-xs text-gray-700 bg-white rounded px-2 py-1 border border-gray-100">
                                            {/* <span className="font-medium">{c.item_code} · {c.carton_number}</span>
                                            <span className="text-gray-500">{c.whs_code} → {c.location}</span> */}
                                            <div className="min-w-0">
                                                <p className="font-medium">
                                                    {c.item_code} · Carton: {c.carton_number || "N/A"}
                                                </p>
                                                <p className="text-gray-500">
                                                    Lot: {c.lot_number || "N/A"} · Case: {c.case_number || "N/A"}
                                                </p>
                                                <p className="text-gray-500">
                                                    {c.whs_code} / {c.location} · Pallet: {c.pallet || "N/A"}
                                                </p>
                                            </div>
                                            <span className="font-semibold text-green-700">{c.qty_available} {c.uom}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {!hasSelection && (
                            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 mb-6 text-center">
                                <p className="text-sm text-gray-500">Select one or more cartons from the left panel</p>
                            </div>
                        )}

                        <SectionTitle>Destination Information</SectionTitle>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <FieldLabel>To Warehouse</FieldLabel>
                                <Select options={warehouseOptions} value={warehouseOptions.find((o: SelectOption) => o.value === toWhsCode) || null}
                                    onChange={(opt: SelectOption | null) => setToWhsCode(opt?.value || "")}
                                    placeholder="Keep Current Warehouse" isClearable isSearchable isDisabled={!hasSelection} styles={customSelectStyles} className="text-sm" />
                                {hasSelection && toWhsCode === "" && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {isMixedSource ? "Keeps each carton's own source warehouse" : `Keeps current warehouse (${selectedCartonData[0]?.whs_code})`}
                                    </p>
                                )}
                            </div>
                            <div>
                                <FieldLabel>To Location</FieldLabel>
                                <Select options={destLocationOptions} value={destLocationOptions.find((o: SelectOption) => o.value === toLocation) || null}
                                    onChange={(opt: SelectOption | null) => setToLocation(opt?.value || "")}
                                    placeholder="Keep Current Location" isClearable isSearchable isDisabled={!hasSelection}
                                    styles={customSelectStyles} className="text-sm"
                                    noOptionsMessage={() => toWhsCode ? "No locations found" : "Showing all locations — select a warehouse to narrow down"} />
                                {hasSelection && toLocation === "" && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {isMixedSource ? "Keeps each carton's own source location" : `Keeps current location (${selectedCartonData[0]?.location})`}
                                    </p>
                                )}
                            </div>
                            <div>
                                <FieldLabel>New QA Status</FieldLabel>
                                <select value={newQaStatus} onChange={(e) => setNewQaStatus(e.target.value)} disabled={!hasSelection}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100">
                                    <option value="">Keep Current Status</option>
                                    {qaStatuses.map((opt: QaStatus) => <option key={opt.qa_status} value={opt.qa_status}>{opt.description} ({opt.qa_status})</option>)}
                                </select>
                            </div>
                            <div>
                                <FieldLabel>To Division</FieldLabel>
                                <select value={divisionCode} onChange={(e) => setDivisionCode(e.target.value)} disabled={!hasSelection}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100">
                                    <option value="">Keep Current Division</option>
                                    {divisionOptions.map((opt: SelectOption) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <FieldLabel>New Lot Number</FieldLabel>
                                <input type="text" value={newLotNumber} onChange={(e) => setNewLotNumber(e.target.value)} disabled={!hasSelection}
                                    placeholder="Keep Current Lot Number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100" />
                                {hasSelection && trimmedNewLotNumber !== "" && (
                                    <p className="text-xs text-blue-600 mt-1">
                                        Will apply to all {selectedCartonData.length} selected carton(s)
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mb-6">
                            <FieldLabel>Reason for Transfer</FieldLabel>
                            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} disabled={!hasSelection}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                                placeholder="Enter reason for transfer..." />
                        </div>

                        {progress && (
                            <div className="mb-4">
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Transferring cartons...</span>
                                    <span>{progress.done} / {progress.total}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-purple-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
                                </div>
                            </div>
                        )}

                        <AlertBanner type="error" message={error} />
                        <AlertBanner type="success" message={success} />

                        <div className="flex space-x-3">
                            <button type="submit" disabled={submitting || !hasSelection}
                                className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                {submitting
                                    ? <><SpinIcon />Processing {progress?.done ?? 0}/{progress?.total ?? selectedCartonData.length}...</>
                                    : <><TransferIcon />Transfer {selectedCartons.size > 0 ? `${selectedCartons.size} Carton(s)` : "Cartons"}</>}
                            </button>
                            <button type="button" onClick={handleReset} disabled={submitting}
                                className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50">
                                Reset
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}


// ─── NEW: LOCATION-BASED TRANSFER HELPERS ─────────────────────────────────────
// These helpers/components are intentionally isolated from the three existing
// production tabs. They reuse the existing /inventory/grouped-by-item read API
// and /inventory/transfer write API; no backend changes are required.

type LocationTransferRow = {
    item_code: string;
    item_name: string;
    owner_code: string;
    from_whs_code: string;
    from_location: string;
    old_qa_status: string;
    from_division_code: string;
    from_lot_number: string;
    rec_date: string;
    prod_date: string;
    exp_date: string;
    pallet: string;
    carton_number: string;
    case_number: string;
    uom: string;
    qty_available: number;
    qty_to_transfer: number;
    // Editable destination attributes used by the Excel transfer tab.
    new_qa_status?: string;
    division_code?: string;
    lot_number?: string;
    to_prod_date?: string;
    to_whs_code?: string;
    to_location?: string;
    excel_row_number?: number;
};

const EXCEL_TRANSFER_HEADERS = [
    "item_code", "item_name", "owner_code", "from_whs_code", "from_location",
    "old_qa_status", "from_division_code", "from_lot_number", "from_prod_date",
    "rec_date", "exp_date", "pallet", "carton_number", "case_number", "uom",
    "qty_available", "qty_to_transfer", "new_qa_status", "division_code",
    "lot_number", "to_prod_date", "to_whs_code", "to_location",
];

function toLocationTransferRow(g: GroupedInventory): LocationTransferRow {
    return {
        item_code: g.item_code || "",
        item_name: g.item_name || "",
        owner_code: g.owner_code || "",
        from_whs_code: g.whs_code || "",
        from_location: g.location || "",
        old_qa_status: g.qa_status || "",
        from_division_code: g.division_code || "",
        from_lot_number: g.lot_number || "",
        rec_date: g.rec_date || "",
        prod_date: g.prod_date || "",
        exp_date: g.exp_date || "",
        pallet: g.pallet || "",
        carton_number: g.carton_number || "",
        case_number: g.case_number || "",
        uom: g.uom || "",
        qty_available: Number(g.qty_available) || 0,
        qty_to_transfer: Number(g.qty_available) || 0,
    };
}

async function fetchInventoryAtLocation(whsCode: string, location: string | string[]): Promise<LocationTransferRow[]> {
    const productsRes = await api.get("/products", { withCredentials: true });
    if (!productsRes.data?.success) throw new Error("Failed to load product master.");
    const products: Product[] = productsRes.data.data || [];
    const allGroups: GroupedInventory[] = [];
    const chunkSize = 8;

    // The existing read API is item-scoped. Fetch in small batches to avoid
    // sending an unbounded number of concurrent requests to the production API.
    for (let i = 0; i < products.length; i += chunkSize) {
        const chunk = products.slice(i, i + chunkSize);
        const results = await Promise.all(chunk.map(async (product) => {
            try {
                const res = await api.get("/inventory/grouped-by-item", {
                    params: { item_code: product.item_code },
                    withCredentials: true,
                });
                if (!res.data?.success) throw new Error(res.data?.error || `API returned unsuccessful response for ${product.item_code}`);
                return { itemCode: product.item_code, groups: (res.data.data?.inventories || []) as GroupedInventory[] };
            } catch (error: any) {
                return { itemCode: product.item_code, error: getTransferErrorMessage(error) };
            }
        }));
        const failedProducts = results.filter((result: any) => "error" in result);
        if (failedProducts.length) {
            const sample = failedProducts.slice(0, 5).map((item: any) => `${item.itemCode}: ${item.error}`).join("; ");
            throw new Error(`Failed to load inventory for ${failedProducts.length} SKU(s). No partial inventory list was returned. ${sample}${failedProducts.length > 5 ? "; ..." : ""}`);
        }
        results.forEach((result: any) => allGroups.push(...result.groups));
    }

    const selectedLocations = Array.isArray(location) ? location : [location];
    return allGroups
        .filter((g) => g.whs_code === whsCode && (!selectedLocations.length || selectedLocations.includes(g.location)) && Number(g.qty_available) > 0)
        .map(toLocationTransferRow);
}

function buildLocationTransferPayload(
    row: LocationTransferRow,
    toWhsCode: string,
    toLocation: string,
    reason: string,
    qty: number
): TransferFormData {
    return {
        item_code: row.item_code,
        owner_code: row.owner_code,
        from_whs_code: row.from_whs_code,
        to_whs_code: toWhsCode,
        from_location: row.from_location,
        to_location: toLocation,
        old_qa_status: row.old_qa_status,
        new_qa_status: row.new_qa_status || row.old_qa_status,
        from_prod_date: row.prod_date || "",
        to_prod_date: row.to_prod_date || row.prod_date || "",
        rec_date: row.rec_date || "",
        prod_date: row.to_prod_date || row.prod_date || "",
        exp_date: row.exp_date || "",
        from_lot_number: row.from_lot_number || "",
        lot_number: row.lot_number ?? row.from_lot_number ?? "",
        pallet: row.pallet || "",
        qty_to_transfer: qty,
        reason,
        from_division_code: row.from_division_code || "",
        division_code: row.division_code ?? row.from_division_code ?? "",
        carton_number: row.carton_number || "",
        case_number: row.case_number || "",
    };
}

function locationOptionsForWarehouse(locations: Location[], whsCode: string): SelectOption[] {
    return locations
        .filter((location) => location.whs_code === whsCode)
        .map((location) => ({ value: location.location_code, label: location.location_code }));
}

type TransferLoopError = {
    loop: number;
    reference: string;
    message: string;
};

function getTransferErrorMessage(err: any): string {
    const data = err?.response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (data?.error) return String(data.error);
    if (data?.message) return String(data.message);
    if (data?.errors) {
        if (Array.isArray(data.errors)) return data.errors.map((x: any) => typeof x === "string" ? x : x.message || JSON.stringify(x)).join("; ");
        if (typeof data.errors === "object") return Object.entries(data.errors).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`).join("; ");
    }
    return err?.message || "An unexpected error occurred.";
}

function TransferErrorList({ errors }: { errors: TransferLoopError[] }) {
    if (!errors.length) return null;
    return (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 space-y-3" role="alert">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-red-900">Some transfer operations failed</h3>
                    <p className="text-xs text-red-800 mt-1">Check the loop number and item reference below. Successful transfers are not rolled back.</p>
                </div>
                <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">{errors.length} error(s)</span>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-2">
                {errors.map((item, index) => (
                    <div key={`${item.loop}-${index}`} className="rounded-md border border-red-200 bg-white p-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">Loop #{item.loop}</span>
                            <span className="text-sm font-semibold text-gray-900">{item.reference}</span>
                        </div>
                        <p className="mt-1 text-sm text-red-800 break-words">{item.message}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LocToLocTab({ warehouses, locations, customSelectStyles, onRefresh }: any) {
    const [fromWhs, setFromWhs] = useState("");
    const [fromLocation, setFromLocation] = useState("");
    const [toWhs, setToWhs] = useState("");
    const [toLocation, setToLocation] = useState("");
    const [reason, setReason] = useState("");
    const [rows, setRows] = useState<LocationTransferRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const [error, setError] = useState("");
    const [errorDetails, setErrorDetails] = useState<TransferLoopError[]>([]);
    const [success, setSuccess] = useState("");

    const warehouseOptions: SelectOption[] = warehouses.map((w: Warehouse) => ({ value: w.code, label: `${w.code} — ${w.name}` }));
    const fromLocationOptions = locationOptionsForWarehouse(locations, fromWhs);
    const toLocationOptions = locationOptionsForWarehouse(locations, toWhs);
    const totalAvailable = rows.reduce((sum, row) => sum + row.qty_available, 0);
    const totalTransfer = rows.reduce((sum, row) => sum + (Number(row.qty_to_transfer) || 0), 0);

    const loadInventory = async () => {
        setError(""); setErrorDetails([]); setSuccess(""); setRows([]);
        if (!fromWhs || !fromLocation) { setError("Please select source warehouse and location."); return; }
        setLoading(true);
        try {
            const data = await fetchInventoryAtLocation(fromWhs, fromLocation);
            setRows(data);
            if (!data.length) setError("No available inventory found in the selected source location.");
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || "Failed to load source inventory.");
        } finally { setLoading(false); }
    };

    const updateQty = (index: number, value: string) => {
        setRows((previous) => previous.map((row, i) => i === index
            ? { ...row, qty_to_transfer: value === "" ? 0 : Number(value) }
            : row));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setError(""); setErrorDetails([]); setSuccess("");
        if (!rows.length) { setError("Load source inventory first."); return; }
        if (!toWhs || !toLocation) { setError("Please select destination warehouse and location."); return; }
        if (fromWhs === toWhs && fromLocation === toLocation) { setError("Source and destination locations must be different."); return; }
        const invalid = rows.find((row) => !Number.isFinite(Number(row.qty_to_transfer)) || row.qty_to_transfer < 0 || row.qty_to_transfer > row.qty_available);
        if (invalid) { setError(`Invalid transfer quantity for ${invalid.item_code}. Quantity must be between 0 and ${invalid.qty_available}.`); return; }
        const selected = rows.filter((row) => row.qty_to_transfer > 0);
        if (!selected.length) { setError("Enter at least one quantity greater than zero."); return; }

        setSubmitting(true); setProgress({ done: 0, total: selected.length });
        const failures: TransferLoopError[] = [];
        let succeeded = 0;
        for (let i = 0; i < selected.length; i++) {
            const row = selected[i];
            try {
                await api.post("/inventory/transfer", buildLocationTransferPayload(row, toWhs, toLocation, reason, Number(row.qty_to_transfer)), { withCredentials: true });
                succeeded++;
            } catch (err: any) {
                failures.push({
                    loop: i + 1,
                    reference: `${row.item_code} | ${row.from_whs_code}/${row.from_location} | Lot: ${row.from_lot_number || "-"}`,
                    message: getTransferErrorMessage(err),
                });
            }
            setProgress({ done: i + 1, total: selected.length });
        }
        setSubmitting(false);
        if (succeeded > 0) {
            onRefresh?.();
            mutate("/inventories");
        }
        if (failures.length) {
            setError(`${succeeded} item group(s) transferred successfully; ${failures.length} item group(s) failed.`);
            setErrorDetails(failures);
            if (succeeded > 0) setRows((previous) => previous.filter((row) => !selected.some((doneRow) => doneRow === row)));
        } else {
            setSuccess(`${succeeded} inventory group(s) transferred successfully.`);
            setRows([]);
        }
    };

    return (
        <div className="space-y-5">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Location to Location Transfer</h2>
                    <p className="text-sm text-gray-500">Transfer any available inventory from one source location to another.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div><FieldLabel required>From Warehouse</FieldLabel><Select options={warehouseOptions} value={warehouseOptions.find(o => o.value === fromWhs) || null} onChange={(o: SelectOption | null) => { setFromWhs(o?.value || ""); setFromLocation(""); setRows([]); }} isClearable isSearchable styles={customSelectStyles} placeholder="Select warehouse" /></div>
                    <div><FieldLabel required>From Location</FieldLabel><Select options={fromLocationOptions} value={fromLocationOptions.find(o => o.value === fromLocation) || null} onChange={(o: SelectOption | null) => { setFromLocation(o?.value || ""); setRows([]); }} isClearable isSearchable isDisabled={!fromWhs} styles={customSelectStyles} placeholder="Select source location" /></div>
                    <div><FieldLabel required>To Warehouse</FieldLabel><Select options={warehouseOptions} value={warehouseOptions.find(o => o.value === toWhs) || null} onChange={(o: SelectOption | null) => { setToWhs(o?.value || ""); setToLocation(""); }} isClearable isSearchable styles={customSelectStyles} placeholder="Select destination warehouse" /></div>
                    <div><FieldLabel required>To Location</FieldLabel><Select options={toLocationOptions} value={toLocationOptions.find(o => o.value === toLocation) || null} onChange={(o: SelectOption | null) => setToLocation(o?.value || "")} isClearable isSearchable isDisabled={!toWhs} styles={customSelectStyles} placeholder="Select destination location" /></div>
                </div>
                <div className="flex flex-wrap items-end gap-3 mt-4">
                    <button type="button" onClick={loadInventory} disabled={loading || submitting || !fromWhs || !fromLocation} className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{loading ? "Loading inventory..." : "Load Inventory"}</button>
                    <div className="flex-1 min-w-[240px]"><FieldLabel>Reason for Transfer</FieldLabel><input value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="Optional reason" /></div>
                    {rows.length > 0 && <div className="text-xs text-gray-600 pb-2">{rows.length} group(s) · Available: <b>{totalAvailable}</b> · Transfer: <b>{totalTransfer}</b></div>}
                </div>
            </div>

            {rows.length > 0 && <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-200 flex justify-between items-center"><h3 className="font-semibold text-sm text-gray-800">Available Inventory</h3><span className="text-xs text-gray-500">Set quantity to transfer per inventory group</span></div>
                <div className="overflow-x-auto"><table className="min-w-full text-xs">
                    <thead className="bg-gray-50 text-gray-600"><tr>{["Item / Description", "Owner", "Source", "Division", "QA", "Lot", "Pallet / Carton", "Available", "Qty to Transfer"].map(h => <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-gray-100">{rows.map((row, index) => <tr key={`${row.item_code}-${row.owner_code}-${row.from_location}-${row.from_lot_number}-${index}`} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap"><b>{row.item_code}</b><div className="text-gray-500">{row.item_name}</div></td>
                        <td className="px-3 py-2">{row.owner_code}</td><td className="px-3 py-2">{row.from_whs_code} / {row.from_location}</td><td className="px-3 py-2">{row.from_division_code}</td><td className="px-3 py-2">{row.old_qa_status}</td><td className="px-3 py-2">{row.from_lot_number || "-"}</td><td className="px-3 py-2">{row.pallet || "-"} / {row.carton_number || "-"}</td><td className="px-3 py-2 font-semibold">{row.qty_available} {row.uom}</td>
                        <td className="px-3 py-2"><input type="number" min="0" max={row.qty_available} step="any" value={row.qty_to_transfer} onChange={(e) => updateQty(index, e.target.value)} className="w-28 px-2 py-1.5 border border-gray-300 rounded text-right" /></td>
                    </tr>)}</tbody>
                </table></div>
                {progress.total > 0 && <div className="px-5 py-3 text-xs text-gray-600">Processing {progress.done}/{progress.total}</div>}
                <div className="p-5 border-t border-gray-100 flex justify-end"><button type="submit" disabled={submitting || !toWhs || !toLocation} className="px-5 py-2.5 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">{submitting ? `Transferring ${progress.done}/${progress.total}...` : "Submit Location Transfer"}</button></div>
            </form>}
            <AlertBanner type="error" message={error} /><TransferErrorList errors={errorDetails} /><AlertBanner type="success" message={success} />
        </div>
    );
}

function TransferFromExcelTab({ warehouses, locations, divisions, owners, qaStatuses, customSelectStyles, onRefresh }: any) {
    const [fromWhs, setFromWhs] = useState("");
    // Empty location selection means all locations in the selected source warehouse.
    const [fromLocations, setFromLocations] = useState<string[]>([]);
    const [reason, setReason] = useState("");
    const [ownerFilter, setOwnerFilter] = useState("");
    const [divisionFilter, setDivisionFilter] = useState("");
    const [itemCodeFilters, setItemCodeFilters] = useState<string[]>([]);
    const [productMaster, setProductMaster] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [qaFilter, setQaFilter] = useState("");
    const [lotFilter, setLotFilter] = useState("");
    const [palletCartonFilter, setPalletCartonFilter] = useState("");
    const [prodDateFrom, setProdDateFrom] = useState("");
    const [prodDateTo, setProdDateTo] = useState("");
    const [expDateFrom, setExpDateFrom] = useState("");
    const [expDateTo, setExpDateTo] = useState("");
    const [rows, setRows] = useState<LocationTransferRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const [error, setError] = useState("");
    const [errorDetails, setErrorDetails] = useState<TransferLoopError[]>([]);
    const [success, setSuccess] = useState("");
    const [fileName, setFileName] = useState("");

    const warehouseOptions: SelectOption[] = warehouses.map((w: Warehouse) => ({ value: w.code, label: `${w.code} — ${w.name}` }));
    const fromLocationOptions: SelectOption[] = locationOptionsForWarehouse(locations, fromWhs);
    const ownerOptions: SelectOption[] = owners.map((o: Owner) => ({ value: o.code, label: `${o.code} — ${o.name}` }));
    const divisionOptions: SelectOption[] = divisions.map((d: Division) => ({ value: d.code, label: d.code }));
    const qaOptions: SelectOption[] = qaStatuses.map((q: QaStatus) => ({ value: q.qa_status, label: `${q.qa_status} — ${q.description}` }));
    const itemCodeOptions: SelectOption[] = productMaster.map((p) => ({
        value: p.item_code,
        label: `${p.item_code} — ${p.item_name}`,
    }));
    const totalQty = rows.reduce((sum, row) => sum + (Number(row.qty_to_transfer) || 0), 0);
    const totalAvailable = rows.reduce((sum, row) => sum + (Number(row.qty_available) || 0), 0);

    const resetFileState = () => { setRows([]); setFileName(""); };

    // Load product master for the searchable multi-select Item Code filter.
    useEffect(() => {
        let active = true;
        const loadProducts = async () => {
            setProductsLoading(true);
            try {
                const response = await api.get("/products", { withCredentials: true });
                if (!response.data?.success) throw new Error(response.data?.error || "Failed to load product master.");
                if (active) setProductMaster((response.data.data || []) as Product[]);
            } catch (err: any) {
                if (active) setError(`Unable to load Item Code options: ${getTransferErrorMessage(err)}`);
            } finally {
                if (active) setProductsLoading(false);
            }
        };
        loadProducts();
        return () => { active = false; };
    }, []);

    const isWithinDateRange = (value: string, from: string, to: string) => {
        if (!from && !to) return true;
        if (!value) return false;
        const date = String(value).slice(0, 10);
        return (!from || date >= from) && (!to || date <= to);
    };

    const applyInventoryFilters = (inventory: LocationTransferRow[]) => inventory.filter((r) =>
        (!ownerFilter || r.owner_code === ownerFilter) &&
        (!divisionFilter || r.from_division_code === divisionFilter) &&
        (!itemCodeFilters.length || itemCodeFilters.includes(r.item_code)) &&
        (!qaFilter || r.old_qa_status === qaFilter) &&
        (!lotFilter || r.from_lot_number.toLowerCase().includes(lotFilter.trim().toLowerCase())) &&
        (!palletCartonFilter || `${r.pallet} ${r.carton_number} ${r.case_number}`.toLowerCase().includes(palletCartonFilter.trim().toLowerCase())) &&
        isWithinDateRange(r.prod_date, prodDateFrom, prodDateTo) &&
        isWithinDateRange(r.exp_date, expDateFrom, expDateTo)
    );

    const downloadExcel = async () => {
        setError(""); setErrorDetails([]); setSuccess(""); resetFileState();
        if (!fromWhs) { setError("Select source warehouse first."); return; }
        setLoading(true);
        try {
            const inventory = await fetchInventoryAtLocation(fromWhs, fromLocations);
            const filtered = applyInventoryFilters(inventory);
            if (!filtered.length) { setError("No available inventory matches the selected filters."); return; }

            // Excel is a working template: source columns are references, while destination columns are editable.
            const exportRows = filtered.map((row) => ({
                ...Object.fromEntries(EXCEL_TRANSFER_HEADERS.map((key) => [key, (row as any)[key] ?? ""])),
                from_prod_date: row.prod_date,
                new_qa_status: row.old_qa_status,
                division_code: row.from_division_code,
                lot_number: row.from_lot_number,
                to_prod_date: row.prod_date,
                qty_to_transfer: 0,
            }));
            const worksheet = XLSX.utils.json_to_sheet(exportRows, { header: EXCEL_TRANSFER_HEADERS });
            worksheet["!cols"] = EXCEL_TRANSFER_HEADERS.map((h) => ({ wch: Math.max(14, h.length + 2) }));
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Transfer");
            XLSX.writeFile(workbook, `Inventory_Transfer_${fromWhs}_${new Date().toISOString().slice(0, 10)}.xlsx`);
            setSuccess(`${filtered.length} inventory row(s) exported from ${fromLocations.length ? fromLocations.length + " selected location(s)" : "all locations"}. Set qty_to_transfer and edit destination attributes in Excel, then upload it.`);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || "Failed to generate Excel file.");
        } finally { setLoading(false); }
    };

    const handleUpload = async (file?: File) => {
        setError(""); setErrorDetails([]); setSuccess(""); resetFileState();
        if (!file) return;
        if (!fromWhs) { setError("Select source warehouse before uploading Excel."); return; }
        if (!/\.(xlsx|xls)$/i.test(file.name)) { setError("Please upload an Excel file (.xlsx or .xls)."); return; }
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
            const firstSheet = workbook.SheetNames[0];
            if (!firstSheet) { setError("The Excel file does not contain a worksheet."); return; }
            const sheet = workbook.Sheets[firstSheet];
            // Read as a matrix so physical worksheet row numbers remain accurate.
            const matrix = XLSX.utils.sheet_to_json<any[]>(sheet, {
                header: 1,
                defval: "",
                raw: false,
                blankrows: true,
            });
            if (!matrix.length) { setError("The Excel worksheet is empty."); return; }

            const headers = (matrix[0] || []).map((h: any) => String(h ?? "").trim().toLowerCase());
            const required = ["item_code", "owner_code", "from_whs_code", "from_location", "qty_available", "qty_to_transfer", "to_whs_code", "to_location"];
            const missing = required.filter((key) => !headers.includes(key));
            if (missing.length) { setError(`Invalid template. Missing column(s): ${missing.join(", ")}`); return; }

            const parsed: Array<Record<string, any> & { __excel_row_number: number }> = matrix.slice(1)
                .map((values: any[], index: number) => ({
                    excelRow: index + 2,
                    values: values || [],
                }))
                .filter(({ values }) => {
                    const record: Record<string, any> = {};
                    headers.forEach((header, columnIndex) => {
                        if (header) record[header] = values[columnIndex] ?? "";
                    });

                    // Ignore empty rows and stray characters outside the core inventory identity/transfer fields.
                    const coreFields = [
                        "item_code", "owner_code", "from_whs_code",
                        "qty_available", "qty_to_transfer", "to_whs_code", "to_location",
                    ];
                    return coreFields.some((field) => String(record[field] ?? "").trim() !== "");
                })
                .map(({ excelRow, values }) => {
                    const record: Record<string, any> = {};
                    headers.forEach((header, columnIndex) => {
                        if (header) record[header] = values[columnIndex] ?? "";
                    });
                    return { ...record, __excel_row_number: excelRow };
                });

            if (!parsed.length) { setError("The Excel worksheet does not contain any inventory rows."); return; }

            const mapped: LocationTransferRow[] = parsed.map((r) => ({
                excel_row_number: r.__excel_row_number,
                item_code: String(r.item_code || "").trim(), item_name: String(r.item_name || ""),
                owner_code: String(r.owner_code || "").trim(), from_whs_code: String(r.from_whs_code || "").trim(),
                from_location: String(r.from_location || "").trim(), old_qa_status: String(r.old_qa_status || "").trim(),
                from_division_code: String(r.from_division_code || "").trim(), from_lot_number: String(r.from_lot_number || ""),
                rec_date: String(r.rec_date || ""), prod_date: String(r.from_prod_date || r.prod_date || ""),
                exp_date: String(r.exp_date || ""), pallet: String(r.pallet || ""), carton_number: String(r.carton_number || ""),
                case_number: String(r.case_number || ""), uom: String(r.uom || ""),
                qty_available: Number(String(r.qty_available).replace(/,/g, "")),
                qty_to_transfer: Number(String(r.qty_to_transfer).replace(/,/g, "")),
                new_qa_status: String(r.new_qa_status || r.old_qa_status || "").trim(),
                division_code: String(r.division_code || r.from_division_code || "").trim(),
                lot_number: String(r.lot_number ?? r.from_lot_number ?? ""),
                to_prod_date: String(r.to_prod_date || r.from_prod_date || r.prod_date || ""),
                to_whs_code: String(r.to_whs_code || "").trim(),
                to_location: String(r.to_location || "").trim(),
            }));
            const validationErrors: TransferLoopError[] = [];
            mapped.forEach((r, index) => {
                const issues: string[] = [];
                if (!r.item_code) issues.push("Item Code is empty");
                if (!r.owner_code) issues.push("Owner Code is empty");
                if (r.from_whs_code !== fromWhs) issues.push(`Source warehouse ${r.from_whs_code || "(empty)"} does not match selected warehouse ${fromWhs}`);
                if (fromLocations.length > 0 && !fromLocations.includes(r.from_location)) issues.push(`Source location ${r.from_location || "(empty)"} is not in selected locations`);
                if (!r.to_whs_code) issues.push("Destination warehouse (to_whs_code) is empty");
                else if (!warehouses.some((w: Warehouse) => w.code === r.to_whs_code)) issues.push(`Destination warehouse ${r.to_whs_code} does not exist`);
                if (!r.to_location) issues.push("Destination location (to_location) is empty");
                else if (!locations.some((loc: Location) => loc.whs_code === r.to_whs_code && loc.location_code === r.to_location)) issues.push(`Destination location ${r.to_location} does not belong to warehouse ${r.to_whs_code} or does not exist`);
                if (r.to_whs_code === r.from_whs_code && r.to_location === r.from_location) issues.push("Destination cannot be the same as source location");
                if (!Number.isFinite(r.qty_available)) issues.push("Available Qty is not a valid number");
                if (!Number.isFinite(r.qty_to_transfer)) issues.push("Transfer Qty is not a valid number");
                else if (r.qty_to_transfer < 0 || r.qty_to_transfer > r.qty_available) issues.push(`Transfer Qty must be between 0 and ${r.qty_available}`);
                if (issues.length) validationErrors.push({
                    loop: index + 1,
                    reference: `Excel row ${r.excel_row_number || index + 2} | ${r.item_code || "(empty item)"} | ${r.from_location || "(no location)"}`,
                    message: issues.join(". "),
                });
            });
            if (validationErrors.length) {
                setError(`${validationErrors.length} invalid Excel row(s) found. Correct the listed rows and upload again.`);
                setErrorDetails(validationErrors);
                return;
            }
            const selected = mapped.filter((r) => r.qty_to_transfer > 0);
            if (!selected.length) { setError("No rows have qty_to_transfer greater than zero."); return; }
            setRows(selected);
            setFileName(file.name);
            setSuccess(`${mapped.length} row(s) read; ${selected.length} row(s) will be transferred. Destination warehouse, location, and editable transfer attributes are taken from the Excel rows.`);
        } catch (err: any) {
            setError(err.message || "Unable to read the Excel file.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setError(""); setErrorDetails([]); setSuccess("");
        if (!rows.length) { setError("Upload a valid Excel file first."); return; }
        const invalid = rows.find((r) => r.qty_to_transfer <= 0 || r.qty_to_transfer > r.qty_available);
        if (invalid) { setError(`Invalid quantity for ${invalid.item_code}.`); return; }

        setSubmitting(true); setProgress({ done: 0, total: rows.length });
        const failures: TransferLoopError[] = []; let succeeded = 0;
        const succeededRows = new Set<number>();
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                await api.post("/inventory/transfer", buildLocationTransferPayload(row, row.to_whs_code || "", row.to_location || "", reason, row.qty_to_transfer), { withCredentials: true });
                succeeded++;
                succeededRows.add(i);
            } catch (err: any) {
                failures.push({
                    loop: i + 1,
                    reference: `Excel row ${row.excel_row_number || "?"} | ${row.item_code} | ${row.from_whs_code}/${row.from_location} | Lot: ${row.from_lot_number || "-"}`,
                    message: getTransferErrorMessage(err),
                });
            }
            setProgress({ done: i + 1, total: rows.length });
        }
        setSubmitting(false);
        if (succeeded > 0) { onRefresh?.(); mutate("/inventories"); }
        if (failures.length) {
            setError(`${succeeded} row(s) transferred successfully; ${failures.length} row(s) failed. Failed rows remain in the preview so you can review and retry them.`);
            setErrorDetails(failures);
            setRows((previous) => previous.filter((_, index) => !succeededRows.has(index)));
        } else {
            setSuccess(`${succeeded} row(s) transferred successfully.`);
            resetFileState();
        }
    };

    const clearFilters = () => {
        setOwnerFilter(""); setDivisionFilter(""); setItemCodeFilters([]); setQaFilter(""); setLotFilter("");
        setPalletCartonFilter(""); setProdDateFrom(""); setProdDateTo(""); setExpDateFrom(""); setExpDateTo("");
    };

    return (
        <div className="space-y-5">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 space-y-5">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Transfer From Excel</h2>
                    <p className="text-sm text-gray-500 mt-1">Filter source inventory, download the Excel template, edit transfer quantity and destination attributes, then upload for validation.</p>
                </div>

                <section>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">1. Source Inventory</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <div><FieldLabel required>From Warehouse</FieldLabel><Select options={warehouseOptions} value={warehouseOptions.find(o => o.value === fromWhs) || null} onChange={(o: SelectOption | null) => { setFromWhs(o?.value || ""); setFromLocations([]); resetFileState(); }} isClearable isSearchable styles={customSelectStyles} placeholder="Select source warehouse" /></div>
                        <div className="md:col-span-1 xl:col-span-2"><FieldLabel>From Location(s)</FieldLabel><Select isMulti options={fromLocationOptions} value={fromLocationOptions.filter(o => fromLocations.includes(o.value))} onChange={(selected: any) => { setFromLocations((selected || []).map((o: SelectOption) => o.value)); resetFileState(); }} isClearable isSearchable styles={customSelectStyles} isDisabled={!fromWhs} placeholder="All locations (leave empty)" /></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Pilih satu atau beberapa lokasi. Jika dikosongkan, inventory dari semua lokasi di warehouse terpilih akan digunakan.</p>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-gray-800">2. Inventory Filters <span className="font-normal text-gray-400">(optional)</span></h3><button type="button" onClick={clearFilters} className="text-xs text-blue-600 hover:text-blue-800">Clear filters</button></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        <div><FieldLabel>Owner</FieldLabel><Select options={ownerOptions} value={ownerOptions.find(o => o.value === ownerFilter) || null} onChange={(o: SelectOption | null) => setOwnerFilter(o?.value || "")} isClearable isSearchable styles={customSelectStyles} placeholder="All owners" /></div>
                        <div><FieldLabel>Division</FieldLabel><Select options={divisionOptions} value={divisionOptions.find(o => o.value === divisionFilter) || null} onChange={(o: SelectOption | null) => setDivisionFilter(o?.value || "")} isClearable isSearchable styles={customSelectStyles} placeholder="All divisions" /></div>
                        <div><FieldLabel>QA Status</FieldLabel><Select options={qaOptions} value={qaOptions.find(o => o.value === qaFilter) || null} onChange={(o: SelectOption | null) => setQaFilter(o?.value || "")} isClearable isSearchable styles={customSelectStyles} placeholder="All QA statuses" /></div>
                        <div>
                            <FieldLabel>Item Code / Name</FieldLabel>
                            <Select
                                isMulti
                                options={itemCodeOptions}
                                value={itemCodeOptions.filter((option) => itemCodeFilters.includes(option.value))}
                                onChange={(selected: any) => {
                                    setItemCodeFilters((selected || []).map((option: SelectOption) => option.value));
                                    resetFileState();
                                }}
                                isClearable
                                isSearchable
                                isLoading={productsLoading}
                                closeMenuOnSelect={false}
                                hideSelectedOptions={false}
                                styles={customSelectStyles}
                                placeholder={productsLoading ? "Loading items..." : "All items (search and select multiple)"}
                                noOptionsMessage={() => "No matching item found"}
                            />
                        </div>
                        <div><FieldLabel>Lot Number</FieldLabel><input value={lotFilter} onChange={(e) => setLotFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="Search lot number" /></div>
                        <div><FieldLabel>Pallet / Carton / Case</FieldLabel><input value={palletCartonFilter} onChange={(e) => setPalletCartonFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="Search pallet, carton or case" /></div>
                        <div><FieldLabel>Production Date From</FieldLabel><input type="date" value={prodDateFrom} onChange={(e) => setProdDateFrom(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
                        <div><FieldLabel>Production Date To</FieldLabel><input type="date" value={prodDateTo} onChange={(e) => setProdDateTo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
                        <div><FieldLabel>Expiry Date From</FieldLabel><input type="date" value={expDateFrom} onChange={(e) => setExpDateFrom(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
                        <div><FieldLabel>Expiry Date To</FieldLabel><input type="date" value={expDateTo} onChange={(e) => setExpDateTo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
                    </div>
                </section>

                <section>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">3. Download & Upload</h3>
                    <p className="text-xs text-gray-500 mb-3">Destination is defined per inventory row in the Excel file using <b>to_whs_code</b> and <b>to_location</b>. Different rows may have different destinations.</p>
                    <div className="max-w-xl"><FieldLabel>Reason for Transfer (applies to all rows)</FieldLabel><input value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="Optional transfer reason" /></div>
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                        <button type="button" onClick={downloadExcel} disabled={loading || submitting || !fromWhs} className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">{loading ? "Preparing Excel..." : "Download Filtered Inventory"}</button>
                        <div><FieldLabel>Upload Edited Excel</FieldLabel><input type="file" accept=".xlsx,.xls" disabled={!fromWhs || submitting} onChange={(e) => handleUpload(e.target.files?.[0])} className="block text-sm text-gray-600 file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-blue-700" /></div>
                        {fileName && <span className="text-xs text-gray-500">{fileName}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">Excel columns <b>from_*</b>, item, owner, source, and qty_available are reference data. Edit <b>qty_to_transfer</b>, <b>new_qa_status</b>, <b>division_code</b>, <b>lot_number</b>, and <b>to_prod_date</b>. Receiving and expiry dates can also be adjusted. Set <b>to_whs_code</b> and <b>to_location</b> for each row to define its destination.</p>
                </section>
            </div>

            {rows.length > 0 && <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-sm">Excel Transfer Preview</h3><span className="text-xs text-gray-500">{rows.length} row(s) · Transfer Qty: {totalQty}</span></div>
                <div className="overflow-x-auto"><table className="min-w-full text-xs"><thead className="bg-gray-50"><tr>{["Item", "Owner", "Source", "Destination", "Available", "Transfer Qty", "QA → New QA", "Division → New", "Lot → New", "Prod Date → New"].map(h => <th key={h} className="px-3 py-3 text-left whitespace-nowrap">{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{rows.map((r, i) => <tr key={`${r.item_code}-${r.owner_code}-${r.from_location}-${r.from_lot_number}-${i}`} className="hover:bg-gray-50"><td className="px-3 py-2 whitespace-nowrap"><b>{r.item_code}</b><div className="text-gray-500">{r.item_name}</div></td><td className="px-3 py-2">{r.owner_code}</td><td className="px-3 py-2">{r.from_whs_code}/{r.from_location}</td><td className="px-3 py-2">{r.to_whs_code}/{r.to_location}</td><td className="px-3 py-2">{r.qty_available} {r.uom}</td><td className="px-3 py-2 font-semibold">{r.qty_to_transfer} {r.uom}</td><td className="px-3 py-2">{r.old_qa_status} → {r.new_qa_status || r.old_qa_status}</td><td className="px-3 py-2">{r.from_division_code} → {r.division_code || r.from_division_code}</td><td className="px-3 py-2">{r.from_lot_number || "-"} → {r.lot_number || r.from_lot_number || "-"}</td><td className="px-3 py-2">{r.prod_date || "-"} → {r.to_prod_date || r.prod_date || "-"}</td></tr>)}</tbody></table></div>
                <div className="p-5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-gray-500">{progress.total > 0 ? `Processing ${progress.done}/${progress.total}` : `Available in preview: ${totalAvailable}. Review the destination attributes before submitting.`}</span><button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">{submitting ? `Submitting ${progress.done}/${progress.total}...` : "Submit Excel Transfer"}</button></div>
            </form>}
            <AlertBanner type="error" message={error} /><TransferErrorList errors={errorDetails} /><AlertBanner type="success" message={success} />
        </div>
    );
}

// ─── Small shared UI primitives ───────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h3 className="text-sm font-semibold text-gray-700 mb-3">{children}</h3>;
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
    return (
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {children} {required && <span className="text-red-500">*</span>}
        </label>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <span className="text-blue-700 font-medium">{label}:</span>
            <span className="text-blue-900 ml-2">{value}</span>
        </div>
    );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <FieldLabel>{label}</FieldLabel>
            <input readOnly type="text" value={value} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50" />
        </div>
    );
}

function AlertBanner({ type, message }: { type: "error" | "success"; message: string }) {
    if (!message) return null;
    const isError = type === "error";
    return (
        <div className={`mb-6 rounded-lg p-4 border ${isError ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
            <div className="flex">
                <svg className={`w-5 h-5 mr-3 flex-shrink-0 ${isError ? "text-red-400" : "text-green-400"}`} fill="currentColor" viewBox="0 0 20 20">
                    {isError
                        ? <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        : <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    }
                </svg>
                <div>
                    <h3 className={`text-sm font-medium ${isError ? "text-red-800" : "text-green-800"}`}>{isError ? "Error" : "Success"}</h3>
                    <p className={`text-sm mt-1 ${isError ? "text-red-700" : "text-green-700"}`}>{message}</p>
                </div>
            </div>
        </div>
    );
}

function LoadingSpinner() {
    return (
        <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading...</p>
        </div>
    );
}

function SpinIcon() {
    return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />;
}

function TransferIcon() {
    return (
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
    );
}