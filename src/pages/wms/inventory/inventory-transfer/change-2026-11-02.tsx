/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

import Select from "react-select";

import CreatableSelect from "react-select/creatable";

import { ChevronDown, ChevronRight, RefreshCw, Search, Check, X } from "lucide-react";

import api from "@/lib/api";

import Layout from "@/components/layout";

type ProcessMode = "internal-transfer" | "change-carton-number";

interface Product {

    id?: number;

    ID?: number;

    product_number?: number;

    owner_code?: string;

    item_code?: string;

    item_name?: string;

    unit_model?: string;

    barcode?: string;

    uom?: string;

}

interface Inventory {

    ID: number;

    id?: number;

    item_code: string;

    barcode?: string;

    owner_code: string;

    whs_code: string;

    location: string;

    division_code: string;

    qa_status: string;

    uom: string;

    qty_available: number;

    qty_onhand: number;

    qty_origin?: number;

    qty_allocated?: number;

    qty_suspend?: number;

    qty_shipped?: number;

    lot_number?: string;

    rec_date?: string;

    prod_date?: string;

    exp_date?: string;

    pallet?: string;

    carton_number?: string;

    case_number?: string;

    serial_number?: string;

    product?: Product;

    available_serials: number;

    transfer_mode: "serial" | "quantity" | string;

}

interface InventorySerial {

    ID?: number;

    id?: number;

    inventory_id?: number;

    serial_number: string;

    qty_available: number;

    qty_allocated?: number;

    qty_shipped?: number;

    qty_onhand?: number;

}

interface Owner {

    code: string;

    name?: string;

}

interface Warehouse {

    id?: number;

    code: string;

    name?: string;

}

interface Location {

    id?: number;

    location_code: string;

    name?: string;

    whs_code: string;

}

interface Division {

    code: string;

    name?: string;

}

interface QaStatus {

    id?: number;

    qa_status: string;

    description?: string;

}

interface SelectOption {

    value: string;

    label: string;

}

interface ApiListResponse {

    success: boolean;

    data?: {

        inventories?: Inventory[];

        total?: number;

    };

    error?: string;

    message?: string;

}

interface ApiSerialResponse {

    success: boolean;

    data?: {

        inventory?: Inventory;

        serials?: InventorySerial[];

        total?: number;

    };

    error?: string;

    message?: string;

}

interface ProductOption extends SelectOption {

    itemCode: string;

    itemName: string;

    unitModel: string;

    barcode: string;

}

const selectStyles = {

    control: (base: any) => ({

        ...base,

        minHeight: 36,

        height: 36,

        fontSize: 12,

        borderColor: "#d1d5db",

        boxShadow: "none",

    }),

    valueContainer: (base: any) => ({ ...base, padding: "0 9px" }),

    indicatorsContainer: (base: any) => ({ ...base, height: 34 }),

    menu: (base: any) => ({ ...base, zIndex: 100, fontSize: 12 }),

    option: (base: any, state: any) => ({

        ...base,

        fontSize: 12,

        backgroundColor: state.isFocused ? "#ecfdf5" : "white",

        color: "#111827",

    }),

};

const inputClass =

    "w-full h-9 rounded-md border border-gray-300 bg-white px-2.5 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100 disabled:text-gray-400";

function getId(inv: Inventory) {

    return Number(inv.ID ?? inv.id ?? 0);

}

function text(value: unknown) {

    if (value === null || value === undefined || value === "") return "-";

    return String(value);

}

function formatQty(value: number) {

    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(value || 0);

}

function ProductInfo({

    product,

    fallbackItemCode,

    fallbackBarcode,

}: {

    product?: Product;

    fallbackItemCode?: string;

    fallbackBarcode?: string;

}) {

    return (

        <div className="min-w-0">

            <div className="truncate text-xs font-medium text-gray-700">

                {product?.item_name || "-"}

            </div>

            <div className="mt-0.5 truncate text-[11px] text-gray-500">

                Model: {product?.unit_model || "-"}

            </div>

            <div className="mt-0.5 truncate text-[10px] text-gray-400">

                Barcode:{" "}

                {product?.barcode ||

                    fallbackBarcode ||

                    "-"}

            </div>

        </div>

    );

}

function Spinner() {

    return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;

}

function Alert({ type, message }: { type: "error" | "success"; message: string }) {

    if (!message) return null;

    return (

        <div

            className={`rounded-lg border px-3 py-2.5 text-xs ${type === "error"

                ? "border-red-200 bg-red-50 text-red-700"

                : "border-emerald-200 bg-emerald-50 text-emerald-700"

                }`}

        >

            {message}

        </div>

    );

}

export default function InventoryInternalTransferPage() {

    const [processMode, setProcessMode] = useState<ProcessMode>("internal-transfer");
    const [selectedCartonInventories, setSelectedCartonInventories] = useState<Map<number, Inventory>>(new Map());
    const [toCartonNumber, setToCartonNumber] = useState("");

    const [inventories, setInventories] = useState<Inventory[]>([]);

    const [loadingInventories, setLoadingInventories] = useState(false);

    const [loadingSerials, setLoadingSerials] = useState(false);

    const [products, setProducts] = useState<Product[]>([]);

    const [owners, setOwners] = useState<Owner[]>([]);

    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

    const [locations, setLocations] = useState<Location[]>([]);

    const [divisions, setDivisions] = useState<Division[]>([]);

    const [qaStatuses, setQaStatuses] = useState<QaStatus[]>([]);

    const [loadingMaster, setLoadingMaster] = useState(false);

    const [search, setSearch] = useState("");

    // Draft input is not sent until the user submits the filter, preventing
    // a request on every keystroke for this dedicated carton search.
    const [cartonNumberSearch, setCartonNumberSearch] = useState("");
    const [appliedCartonNumberSearch, setAppliedCartonNumberSearch] = useState("");

    const [itemCode, setItemCode] = useState("");

    const [ownerCode, setOwnerCode] = useState("");

    const [sourceWhs, setSourceWhs] = useState("");

    const [sourceLocation, setSourceLocation] = useState("");

    const [sourceDivision, setSourceDivision] = useState("");

    const [sourceQa, setSourceQa] = useState("");

    const [sourcePallet, setSourcePallet] = useState("");

    const [expandedId, setExpandedId] = useState<number | null>(null);

    const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);

    const [serials, setSerials] = useState<InventorySerial[]>([]);

    const [selectedSerials, setSelectedSerials] = useState<Set<string>>(new Set());

    const [qtyToTransfer, setQtyToTransfer] = useState("");

    const [toWhsCode, setToWhsCode] = useState("");

    const [toLocation, setToLocation] = useState("");

    const [divisionCode, setDivisionCode] = useState("");

    const [newQaStatus, setNewQaStatus] = useState("");

    const [lotNumber, setLotNumber] = useState("");

    const [reason, setReason] = useState("");

    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    const loadMasterData = useCallback(async () => {

        setLoadingMaster(true);

        const requests = await Promise.allSettled([

            api.get("/products", { withCredentials: true }),

            api.get("/owners", { withCredentials: true }),

            api.get("/warehouses", { withCredentials: true }),

            api.get("/locations", { withCredentials: true }),

            api.get("/divisions", { withCredentials: true }),

            api.get("/qa-status", { withCredentials: true }),

        ]);

        const [productsRes, ownersRes, warehousesRes, locationsRes, divisionsRes, qaRes] = requests;

        if (productsRes.status === "fulfilled" && productsRes.value.data?.success) {

            setProducts(productsRes.value.data.data || []);

        }

        if (ownersRes.status === "fulfilled" && ownersRes.value.data?.success) {

            setOwners(ownersRes.value.data.data || []);

        }

        if (warehousesRes.status === "fulfilled" && warehousesRes.value.data?.success) {

            setWarehouses(warehousesRes.value.data.data || []);

        }

        if (locationsRes.status === "fulfilled" && locationsRes.value.data?.success) {

            setLocations(locationsRes.value.data.data || []);

        }

        if (divisionsRes.status === "fulfilled" && divisionsRes.value.data?.success) {

            setDivisions(divisionsRes.value.data.data || []);

        }

        if (qaRes.status === "fulfilled" && qaRes.value.data?.success) {

            setQaStatuses(qaRes.value.data.data || []);

        }

        setLoadingMaster(false);

    }, []);

    const fetchInventories = useCallback(async () => {

        setLoadingInventories(true);

        setError("");

        try {

            const params = new URLSearchParams();

            if (itemCode.trim()) params.set("item_code", itemCode.trim());

            if (ownerCode.trim()) params.set("owner_code", ownerCode.trim());

            if (sourceWhs.trim()) params.set("whs_code", sourceWhs.trim());

            if (sourceLocation.trim()) params.set("location", sourceLocation.trim());

            if (sourceDivision.trim()) params.set("division_code", sourceDivision.trim());

            if (sourceQa.trim()) params.set("qa_status", sourceQa.trim());

            if (sourcePallet.trim()) params.set("pallet", sourcePallet.trim());

            if (search.trim()) params.set("search", search.trim());

            // This is a dedicated current-carton filter, not a broad search.
            if (processMode === "change-carton-number" && appliedCartonNumberSearch.trim()) {
                params.set("carton_number", appliedCartonNumberSearch.trim());
            }

            const response = await api.get<ApiListResponse>(

                `/inventory/internal-transfer/inventories${params.toString() ? `?${params.toString()}` : ""}`

            );

            if (!response.data?.success) {

                throw new Error(response.data?.error || response.data?.message || "Failed to fetch inventory");

            }

            setInventories(response.data.data?.inventories || []);

        } catch (err: any) {

            console.error("Failed to fetch internal transfer inventories:", err);

            setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to fetch inventory");

            setInventories([]);

        } finally {

            setLoadingInventories(false);

        }

    }, [itemCode, ownerCode, sourceWhs, sourceLocation, sourceDivision, sourceQa, sourcePallet, search, processMode, appliedCartonNumberSearch]);

    const clearSelection = useCallback(() => {

        setExpandedId(null);

        setSelectedInventory(null);

        setSerials([]);

        setSelectedSerials(new Set());

        setQtyToTransfer("");

    }, []);

    const clearCartonSelection = useCallback(() => {
        setSelectedCartonInventories(new Map());
    }, []);

    const toggleCartonInventory = useCallback((inventory: Inventory) => {
        const id = getId(inventory);
        if (!id) return;

        setSelectedCartonInventories((previous) => {
            const next = new Map(previous);
            if (next.has(id)) next.delete(id);
            else next.set(id, inventory);
            return next;
        });
    }, []);

    const allVisibleCartonInventoriesSelected = inventories.length > 0 &&
        inventories.every((inventory) => selectedCartonInventories.has(getId(inventory)));

    const toggleAllVisibleCartonInventories = () => {
        setSelectedCartonInventories((previous) => {
            const next = new Map(previous);
            const visibleIDs = inventories.map(getId).filter(Boolean);
            const allVisibleSelected = visibleIDs.length > 0 && visibleIDs.every((id) => next.has(id));

            if (allVisibleSelected) {
                visibleIDs.forEach((id) => next.delete(id));
            } else {
                inventories.forEach((inventory) => {
                    const id = getId(inventory);
                    if (id) next.set(id, inventory);
                });
            }
            return next;
        });
    };

    const handleProcessModeChange = (nextMode: ProcessMode) => {
        setProcessMode(nextMode);
        setError("");
        setSuccess("");
        clearSelection();
        clearCartonSelection();
        setToCartonNumber("");
        setReason("");
        setCartonNumberSearch("");
        setAppliedCartonNumberSearch("");
    };

    useEffect(() => {

        loadMasterData();

        fetchInventories();

    }, [loadMasterData, fetchInventories]);

    const productOptions =

        useMemo<ProductOption[]>(

            () =>

                products

                    .map((product) => ({

                        value:

                            product.item_code || "",

                        label:

                            product.item_name

                                ? `${product.item_code} — ${product.item_name}`

                                : product.item_code || "",

                        itemCode:

                            product.item_code || "",

                        itemName:

                            product.item_name || "",

                        unitModel:

                            product.unit_model || "",

                        barcode:

                            product.barcode || "",

                    }))

                    .filter(

                        (option) =>

                            option.value,

                    ),

            [products],

        );

    function ProductOptionLabel({

        option,

    }: {

        option: ProductOption;

    }) {

        return (

            <div className="min-w-0 py-1">

                <div className="truncate text-xs font-semibold text-gray-900">

                    {option.itemCode}

                </div>

                <div className="truncate text-[11px] text-gray-700">

                    {option.itemName || "-"}

                </div>

                <div className="truncate text-[10px] text-gray-500">

                    Model:{" "}

                    {option.unitModel || "-"}

                    {" · "}

                    Barcode:{" "}

                    {option.barcode || "-"}

                </div>

            </div>

        );

    }

    const ownerOptions = useMemo<SelectOption[]>(() =>

        owners.map((owner) => ({

            value: owner.code,

            label: owner.name ? `${owner.code} — ${owner.name}` : owner.code,

        })).filter((option) => option.value),

        [owners]

    );

    const warehouseOptions = useMemo<SelectOption[]>(() =>

        warehouses.map((warehouse) => ({

            value: warehouse.code,

            label: warehouse.name ? `${warehouse.code} — ${warehouse.name}` : warehouse.code,

        })).filter((option) => option.value),

        [warehouses]

    );

    const divisionOptions = useMemo<SelectOption[]>(() =>

        divisions.map((division) => ({

            value: division.code,

            label: division.name ? `${division.code} — ${division.name}` : division.code,

        })).filter((option) => option.value),

        [divisions]

    );

    const qaOptions = useMemo<SelectOption[]>(() =>

        qaStatuses.map((qa) => ({

            value: qa.qa_status,

            label: qa.description ? `${qa.qa_status} — ${qa.description}` : qa.qa_status,

        })).filter((option) => option.value),

        [qaStatuses]

    );

    const sourceLocationOptions = useMemo<SelectOption[]>(() =>

        locations

            .filter((location) => !sourceWhs || location.whs_code === sourceWhs)

            .map((location) => ({

                value: location.location_code,

                label: location.name ? `${location.location_code} — ${location.name}` : location.location_code,

            }))

            .filter((option) => option.value),

        [locations, sourceWhs]

    );

    const destinationLocationOptions = useMemo<SelectOption[]>(() =>

        locations

            .filter((location) => !toWhsCode || location.whs_code === toWhsCode)

            .map((location) => ({

                value: location.location_code,

                label: location.name ? `${location.location_code} — ${location.name}` : location.location_code,

            }))

            .filter((option) => option.value),

        [locations, toWhsCode]

    );

    const palletOptions = useMemo<SelectOption[]>(() => {

        const values = Array.from(new Set(inventories.map((inventory) => (inventory.pallet || "").trim()).filter(Boolean)));

        return values.map((value) => ({ value, label: value }));

    }, [inventories]);

    const lotOptions = useMemo<SelectOption[]>(() => {

        const values = new Set<string>();

        inventories.forEach((inventory) => {

            const lot = (inventory.lot_number || "").trim();

            if (lot) values.add(lot);

        });

        if (selectedInventory?.lot_number?.trim()) values.add(selectedInventory.lot_number.trim());

        return Array.from(values).map((value) => ({ value, label: value }));

    }, [inventories, selectedInventory]);

    const selectInventory = async (inventory: Inventory) => {

        const id = getId(inventory);

        if (!id) return;

        setError("");

        setSuccess("");

        setSelectedInventory(inventory);

        setExpandedId((prev) => (prev === id ? null : id));

        setSelectedSerials(new Set());

        setQtyToTransfer("");

        if (expandedId === id) {

            setSerials([]);

            return;

        }

        if (inventory.transfer_mode !== "serial") {

            setSerials([]);

            return;

        }

        setLoadingSerials(true);

        try {

            const response = await api.get<ApiSerialResponse>(

                `/inventory/internal-transfer/serials?inventory_id=${id}`

            );

            if (!response.data?.success) {

                throw new Error(response.data?.error || response.data?.message || "Failed to fetch serials");

            }

            setSerials(response.data.data?.serials || []);

        } catch (err: any) {

            console.error("Failed to fetch inventory serials:", err);

            setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to fetch serials");

            setSerials([]);

        } finally {

            setLoadingSerials(false);

        }

    };

    const availableSerials = useMemo(

        () => serials.filter((serial) => serial.qty_available > 0),

        [serials]

    );

    const selectableSerials = useMemo(

        () => availableSerials.filter((serial) => {

            return serial.qty_available === 1 && (serial.qty_allocated || 0) <= 0 && (serial.qty_shipped || 0) <= 0;

        }),

        [availableSerials]

    );

    const allSelected =

        selectableSerials.length > 0 && selectableSerials.every((serial) => selectedSerials.has(serial.serial_number));

    const toggleSerial = (serialNumber: string) => {

        setSelectedSerials((previous) => {

            const next = new Set(previous);

            if (next.has(serialNumber)) next.delete(serialNumber);

            else next.add(serialNumber);

            return next;

        });

    };

    const toggleAllSerials = () => {

        setSelectedSerials((previous) => {

            if (allSelected) return new Set();

            return new Set(selectableSerials.map((serial) => serial.serial_number));

        });

    };

    const resetFilters = () => {

        setSearch("");

        setItemCode("");

        setOwnerCode("");

        setSourceWhs("");

        setSourceLocation("");

        setSourceDivision("");

        setSourceQa("");

        setSourcePallet("");

        setCartonNumberSearch("");
        setAppliedCartonNumberSearch("");

    };

    const resetAll = () => {

        resetFilters();

        clearSelection();

        setToWhsCode("");

        setToLocation("");

        setDivisionCode("");

        setNewQaStatus("");

        setLotNumber("");

        setReason("");

        setError("");

        setSuccess("");

    };

    const selectedQuantity = selectedInventory?.transfer_mode === "serial"

        ? selectedSerials.size

        : Number(qtyToTransfer || 0);

    const canSubmit = useMemo(() => {

        if (!selectedInventory || submitting) return false;

        if (!toWhsCode.trim() || !toLocation.trim() || !divisionCode.trim()) return false;

        if (selectedInventory.transfer_mode === "serial") {

            return selectedSerials.size > 0;

        }

        return Number(qtyToTransfer) > 0 && Number(qtyToTransfer) <= selectedInventory.qty_available;

    }, [selectedInventory, submitting, toWhsCode, toLocation, divisionCode, selectedSerials, qtyToTransfer]);

    const submit = async () => {

        if (!selectedInventory) return;

        setError("");

        setSuccess("");

        const destinationQa = newQaStatus.trim() || selectedInventory.qa_status;

        const destinationLot = lotNumber.trim() || selectedInventory.lot_number || "";

        const sourceSameAsDestination =

            selectedInventory.whs_code === toWhsCode.trim() &&

            selectedInventory.location === toLocation.trim() &&

            selectedInventory.division_code === divisionCode.trim() &&

            selectedInventory.qa_status === destinationQa &&

            (selectedInventory.lot_number || "") === destinationLot;

        if (sourceSameAsDestination) {

            setError("Destination is the same as source.");

            return;

        }

        if (selectedInventory.transfer_mode === "quantity") {

            const qty = Number(qtyToTransfer);

            if (!Number.isFinite(qty) || qty <= 0) {

                setError("Transfer quantity must be greater than 0.");

                return;

            }

            if (qty > selectedInventory.qty_available) {

                setError(`Transfer quantity exceeds available quantity (${formatQty(selectedInventory.qty_available)}).`);

                return;

            }

        }

        setSubmitting(true);

        try {

            const payload = {

                inventory_id: getId(selectedInventory),

                to_whs_code: toWhsCode.trim(),

                to_location: toLocation.trim(),

                division_code: divisionCode.trim(),

                new_qa_status: destinationQa,

                lot_number: destinationLot,

                reason: reason.trim(),

                qty_to_transfer:

                    selectedInventory.transfer_mode === "quantity"

                        ? Number(qtyToTransfer)

                        : selectedSerials.size,

                serial_numbers:

                    selectedInventory.transfer_mode === "serial"

                        ? Array.from(selectedSerials)

                        : [],

            };

            const response = await api.post("/inventory/internal-transfer", payload);

            if (!response.data?.success) {

                throw new Error(response.data?.error || response.data?.message || "Transfer failed");

            }

            setSuccess(response.data.message || "Inventory transfer completed successfully.");

            clearSelection();

            await fetchInventories();

        } catch (err: any) {

            console.error("Internal transfer failed:", err);

            setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Transfer failed");

        } finally {

            setSubmitting(false);

        }

    };

    const normalizedDestinationCarton = toCartonNumber.trim();
    const sameCartonSelectionCount = normalizedDestinationCarton
        ? Array.from(selectedCartonInventories.values()).filter(
            (inventory) => (inventory.carton_number || "").trim() === normalizedDestinationCarton
        ).length
        : 0;

    const canSubmitCartonChange =
        selectedCartonInventories.size > 0 &&
        selectedCartonInventories.size <= 500 &&
        toCartonNumber.trim().length > 0 &&
        toCartonNumber.trim().length <= 100 &&
        reason.trim().length > 0 &&
        reason.trim().length <= 255 &&
        sameCartonSelectionCount === 0 &&
        !submitting;

    const submitChangeCartonNumber = async () => {
        const inventoryIDs = Array.from(selectedCartonInventories.keys());
        const destinationCarton = toCartonNumber.trim();
        const reasonValue = reason.trim();

        setError("");
        setSuccess("");

        if (inventoryIDs.length === 0) {
            setError("Select at least one inventory record.");
            return;
        }
        if (inventoryIDs.length > 500) {
            setError("Select no more than 500 inventory records per request.");
            return;
        }
        if (!destinationCarton) {
            setError("Destination carton number is required.");
            return;
        }
        if (destinationCarton.length > 100) {
            setError("Carton number cannot exceed 100 characters.");
            return;
        }
        if (!reasonValue) {
            setError("Reason is required for audit purposes.");
            return;
        }
        if (reasonValue.length > 255) {
            setError("Reason cannot exceed 255 characters.");
            return;
        }
        if (sameCartonSelectionCount > 0) {
            setError("Some selected inventory already has this carton number. Remove those records or choose another carton number.");
            return;
        }

        const confirmed = window.confirm(
            `Change carton number for ${inventoryIDs.length} inventory record(s) to "${destinationCarton}"? Warehouse, location, division, QA status, pallet, lot, and quantities will remain unchanged.`
        );
        if (!confirmed) return;

        setSubmitting(true);
        try {
            const response = await api.post("/inventory/change-carton-number", {
                inventory_ids: inventoryIDs,
                to_carton_number: destinationCarton,
                reason: reasonValue,
            });

            if (!response.data?.success) {
                throw new Error(response.data?.error || response.data?.message || "Change carton number failed");
            }

            setSuccess(response.data.message || `Carton number updated for ${inventoryIDs.length} inventory record(s).`);
            clearCartonSelection();
            setToCartonNumber("");
            setReason("");
            await fetchInventories();
        } catch (err: any) {
            console.error("Change carton number failed:", err);
            setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Change carton number failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (

        <Layout title="Inventory"

            subTitle={processMode === "internal-transfer" ? "Internal Transfer" : "Change Carton Number"}>

            {/* <div className="mx-auto max-w-screen-2xl p-4 md:p-6"> */}

            <div className="space-y-4 p-4">

                <div className="mb-4">

                    <div className="flex items-center justify-between gap-3">

                        <div>

                            <h1 className="text-lg font-semibold text-gray-900">
                                {processMode === "internal-transfer" ? "Internal Inventory Transfer" : "Change Carton Number"}
                            </h1>

                            <p className="mt-1 text-xs text-gray-500">
                                {processMode === "internal-transfer"
                                    ? "Transfer serial or non-serial inventory to another warehouse, location, or division."
                                    : "Select multiple inventory records and assign one destination carton number without changing stock quantities or inventory location."}
                            </p>

                        </div>

                        <div className="flex items-end gap-2">
                            <div className="min-w-[190px]">
                                <label htmlFor="inventory-process-mode" className="field">Process Type</label>
                                <select
                                    id="inventory-process-mode"
                                    value={processMode}
                                    onChange={(event) => handleProcessModeChange(event.target.value as ProcessMode)}
                                    disabled={submitting}
                                    className={inputClass}
                                >
                                    <option value="internal-transfer">Internal Transfer</option>
                                    <option value="change-carton-number">Change Carton Number</option>
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={() => void fetchInventories()}
                                disabled={loadingInventories || submitting}
                                className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${loadingInventories ? "animate-spin" : ""}`} />
                                Refresh
                            </button>
                        </div>

                    </div>

                </div>

                <div className="mb-4 space-y-2">

                    <Alert type="error" message={error} />

                    <Alert type="success" message={success} />

                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">

                    {/* SOURCE */}

                    <div className="xl:col-span-8">

                        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">

                            <div className="border-b border-gray-200 px-4 py-3">

                                <div className="flex items-center justify-between">

                                    <div>

                                        <h2 className="text-sm font-semibold text-gray-900">
                                            {processMode === "internal-transfer" ? "Source Inventory" : "Select Inventory"}
                                        </h2>

                                        <p className="mt-1 text-xs text-gray-500">
                                            {inventories.length} inventory record(s) available
                                            {processMode === "change-carton-number" ? ` · ${selectedCartonInventories.size} selected` : ""}
                                        </p>
                                        {processMode === "change-carton-number" && appliedCartonNumberSearch && (
                                            <p className="mt-1 text-[11px] text-emerald-700">
                                                Carton filter: <span className="font-semibold">{appliedCartonNumberSearch}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCartonNumberSearch("");
                                                        setAppliedCartonNumberSearch("");
                                                    }}
                                                    className="ml-2 underline underline-offset-2 hover:text-emerald-900"
                                                    disabled={loadingInventories || submitting}
                                                >
                                                    Clear
                                                </button>
                                            </p>
                                        )}

                                    </div>

                                    <div className="flex items-center gap-3">
                                        {processMode === "change-carton-number" && inventories.length > 0 && (
                                            <label className="flex items-center gap-1.5 text-[11px] text-gray-600">
                                                <input
                                                    type="checkbox"
                                                    checked={allVisibleCartonInventoriesSelected}
                                                    onChange={toggleAllVisibleCartonInventories}
                                                    disabled={submitting}
                                                    className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                Select all visible
                                            </label>
                                        )}
                                        {loadingInventories && <Spinner />}
                                    </div>

                                </div>

                            </div>

                            <div className="border-b border-gray-100 bg-gray-50 p-3">

                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">

                                    <div>

                                        <label className="field">Search</label>

                                        <div className="relative">

                                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />

                                            <input

                                                value={search}

                                                onChange={(e) => setSearch(e.target.value)}

                                                onKeyDown={(e) => e.key === "Enter" && fetchInventories()}

                                                className={`${inputClass} pl-8`}

                                                placeholder="Item / Model / Barcode / Pallet..."

                                            />

                                        </div>

                                    </div>

                                    {processMode === "change-carton-number" && (
                                        <div>
                                            <label htmlFor="current-carton-search" className="field">
                                                Current Carton Number
                                            </label>
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                                                <input
                                                    id="current-carton-search"
                                                    value={cartonNumberSearch}
                                                    onChange={(event) => setCartonNumberSearch(event.target.value)}
                                                    onKeyDown={(event) => {
                                                        if (event.key === "Enter") {
                                                            const nextFilter = cartonNumberSearch.trim();
                                                            if (nextFilter === appliedCartonNumberSearch) {
                                                                void fetchInventories();
                                                            } else {
                                                                setAppliedCartonNumberSearch(nextFilter);
                                                            }
                                                        }
                                                    }}
                                                    disabled={loadingInventories || submitting}
                                                    className={`${inputClass} pl-8`}
                                                    placeholder="Enter existing carton number..."
                                                    maxLength={100}
                                                    autoComplete="off"
                                                />
                                            </div>
                                            <p className="mt-1 text-[10px] text-gray-400">
                                                Partial match supported. Press Enter or Search Inventory.
                                            </p>
                                        </div>
                                    )}

                                    <div>

                                        <label className="field">Item Code</label>

                                        <Select

                                            options={productOptions}

                                            value={

                                                productOptions.find(

                                                    (option) =>

                                                        option.value ===

                                                        itemCode,

                                                ) || null

                                            }

                                            onChange={(option) =>

                                                setItemCode(

                                                    option?.value || "",

                                                )

                                            }

                                            isClearable

                                            isSearchable

                                            isLoading={loadingMaster}

                                            placeholder="All items"

                                            styles={selectStyles}

                                            formatOptionLabel={(option) => (

                                                <ProductOptionLabel

                                                    option={

                                                        option as ProductOption

                                                    }

                                                />

                                            )}

                                        />

                                    </div>

                                    <div>

                                        <label className="field">Owner</label>

                                        <Select

                                            options={ownerOptions}

                                            value={ownerOptions.find((option) => option.value === ownerCode) || null}

                                            onChange={(option) => setOwnerCode(option?.value || "")}

                                            isClearable

                                            isSearchable

                                            isLoading={loadingMaster}

                                            placeholder="All owners"

                                            styles={selectStyles}

                                        />

                                    </div>

                                    <div>

                                        <label className="field">Warehouse</label>

                                        <Select

                                            options={warehouseOptions}

                                            value={warehouseOptions.find((option) => option.value === sourceWhs) || null}

                                            onChange={(option) => { setSourceWhs(option?.value || ""); setSourceLocation(""); }}

                                            isClearable

                                            isSearchable

                                            isLoading={loadingMaster}

                                            placeholder="All warehouses"

                                            styles={selectStyles}

                                        />

                                    </div>

                                    <div>

                                        <label className="field">Location</label>

                                        <Select

                                            options={sourceLocationOptions}

                                            value={sourceLocationOptions.find((option) => option.value === sourceLocation) || null}

                                            onChange={(option) => setSourceLocation(option?.value || "")}

                                            isClearable

                                            isSearchable

                                            isLoading={loadingMaster}

                                            placeholder="All locations"

                                            styles={selectStyles}

                                        />

                                    </div>

                                    <div>

                                        <label className="field">Division</label>

                                        <Select

                                            options={divisionOptions}

                                            value={divisionOptions.find((option) => option.value === sourceDivision) || null}

                                            onChange={(option) => setSourceDivision(option?.value || "")}

                                            isClearable

                                            isSearchable

                                            isLoading={loadingMaster}

                                            placeholder="All divisions"

                                            styles={selectStyles}

                                        />

                                    </div>

                                    <div>

                                        <label className="field">QA Status</label>

                                        <Select

                                            options={qaOptions}

                                            value={qaOptions.find((option) => option.value === sourceQa) || null}

                                            onChange={(option) => setSourceQa(option?.value || "")}

                                            isClearable

                                            isSearchable

                                            isLoading={loadingMaster}

                                            placeholder="All QA"

                                            styles={selectStyles}

                                        />

                                    </div>

                                    <div>

                                        <label className="field">Pallet</label>

                                        <Select

                                            options={palletOptions}

                                            value={palletOptions.find((option) => option.value === sourcePallet) || null}

                                            onChange={(option) => setSourcePallet(option?.value || "")}

                                            isClearable

                                            isSearchable

                                            placeholder="All pallets"

                                            styles={selectStyles}

                                        />

                                    </div>

                                </div>

                                <div className="mt-3 flex items-center justify-end gap-2">

                                    <button onClick={resetFilters} className="h-8 rounded-md border border-gray-300 bg-white px-3 text-xs text-gray-600 hover:bg-gray-100">

                                        Clear Filter

                                    </button>

                                    <button
                                        onClick={() => {
                                            if (processMode === "change-carton-number") {
                                                const nextFilter = cartonNumberSearch.trim();
                                                if (nextFilter === appliedCartonNumberSearch) {
                                                    void fetchInventories();
                                                } else {
                                                    setAppliedCartonNumberSearch(nextFilter);
                                                }
                                            } else {
                                                void fetchInventories();
                                            }
                                        }}
                                        disabled={loadingInventories || submitting}
                                        className="h-8 rounded-md bg-gray-900 px-4 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                                    >
                                        Search Inventory
                                    </button>

                                </div>

                            </div>

                            <div className="max-h-[calc(100vh-330px)] overflow-y-auto p-3">

                                {!loadingInventories && inventories.length === 0 ? (

                                    <div className="py-16 text-center text-xs text-gray-400">

                                        No available inventory found.

                                    </div>

                                ) : (

                                    <div className="space-y-2">

                                        {inventories.map((inventory) => {

                                            const id = getId(inventory);

                                            const open = processMode === "internal-transfer" && expandedId === id;

                                            const selected = processMode === "change-carton-number"
                                                ? selectedCartonInventories.has(id)
                                                : selectedInventory ? getId(selectedInventory) === id : false;

                                            const serialMode = inventory.transfer_mode === "serial";

                                            return (

                                                <div

                                                    key={id}

                                                    className={`overflow-hidden rounded-lg border ${selected ? "border-emerald-400" : "border-gray-200"

                                                        }`}

                                                >
                                                    <div className="flex items-stretch">
                                                        {processMode === "change-carton-number" && (
                                                            <label
                                                                className="flex shrink-0 cursor-pointer items-center border-r border-gray-100 px-3 hover:bg-emerald-50"
                                                                title={`Select inventory #${id}`}
                                                                onClick={(event) => event.stopPropagation()}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedCartonInventories.has(id)}
                                                                    onChange={() => toggleCartonInventory(inventory)}
                                                                    disabled={submitting}
                                                                    aria-label={`Select inventory ${inventory.item_code}, ID ${id}`}
                                                                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                                />
                                                            </label>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (submitting) return;
                                                                if (processMode === "internal-transfer") void selectInventory(inventory);
                                                                else toggleCartonInventory(inventory);
                                                            }}
                                                            aria-expanded={processMode === "internal-transfer" ? open : undefined}
                                                            className={`flex-1 px-3 py-3 text-left transition ${open || selected ? "bg-emerald-50" : "bg-white hover:bg-gray-50"}`}
                                                        >

                                                        <div className="flex items-start justify-between gap-4">

                                                            <div className="min-w-0 flex-1">

                                                                <div className="flex items-center gap-2">

                                                                    {open ? (

                                                                        <ChevronDown className="h-4 w-4 text-emerald-600" />

                                                                    ) : (

                                                                        <ChevronRight className="h-4 w-4 text-gray-400" />

                                                                    )}

                                                                    <span className="truncate text-sm font-semibold text-gray-900">

                                                                        {inventory.item_code}

                                                                    </span>

                                                                    <span

                                                                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${serialMode

                                                                            ? "bg-emerald-100 text-emerald-700"

                                                                            : "bg-gray-100 text-gray-600"

                                                                            }`}

                                                                    >

                                                                        {serialMode

                                                                            ? "SERIAL"

                                                                            : "QUANTITY"}

                                                                    </span>

                                                                </div>

                                                                <div className="mt-1 pl-6">

                                                                    <ProductInfo

                                                                        product={

                                                                            inventory.product

                                                                        }

                                                                        fallbackItemCode={

                                                                            inventory.item_code

                                                                        }

                                                                        fallbackBarcode={

                                                                            inventory.barcode

                                                                        }

                                                                    />

                                                                </div>

                                                                <div className="mt-1 pl-6 text-xs text-gray-600">

                                                                    {inventory.product?.item_name || "-"}

                                                                </div>

                                                                <div className="mt-1 pl-6 text-xs text-gray-500">

                                                                    {inventory.owner_code} · {inventory.whs_code} · {inventory.location} · {inventory.division_code} · QA {inventory.qa_status}

                                                                </div>

                                                                <div className="mt-1 pl-6 text-[11px] text-gray-400">

                                                                    Lot {text(inventory.lot_number)} · Pallet {text(inventory.pallet)} · Carton {text(inventory.carton_number)}

                                                                </div>

                                                            </div>

                                                            <div className="shrink-0 text-right">

                                                                <div className="text-sm font-semibold text-gray-900">

                                                                    {formatQty(inventory.qty_available)} {inventory.uom}

                                                                </div>

                                                                {serialMode ? (

                                                                    <div className="mt-1 text-[11px] text-emerald-700">

                                                                        {inventory.available_serials} available serial(s)

                                                                    </div>

                                                                ) : (

                                                                    <div className="mt-1 text-[11px] text-gray-400">No serial rows</div>

                                                                )}

                                                            </div>

                                                        </div>

                                                        </button>
                                                    </div>

                                                    {processMode === "internal-transfer" && open && serialMode && (

                                                        <div className="border-t border-gray-200 bg-gray-50 p-3">

                                                            {loadingSerials ? (

                                                                <div className="flex items-center justify-center py-8 text-gray-400">

                                                                    <Spinner />

                                                                </div>

                                                            ) : serials.length === 0 ? (

                                                                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">

                                                                    This inventory has InventorySerial rows but none are currently available.

                                                                </div>

                                                            ) : (

                                                                <>

                                                                    <div className="mb-2 flex items-center justify-between">

                                                                        <div>

                                                                            <div className="text-xs font-semibold text-gray-800">Available Serial Numbers</div>

                                                                            <div className="mt-0.5 text-[11px] text-gray-400">

                                                                                {selectableSerials.length} selectable / {availableSerials.length} available

                                                                            </div>

                                                                        </div>

                                                                        <button

                                                                            type="button"

                                                                            onClick={(e) => {

                                                                                e.stopPropagation();

                                                                                toggleAllSerials();

                                                                            }}

                                                                            disabled={selectableSerials.length === 0}

                                                                            className="text-xs font-medium text-emerald-700 hover:underline disabled:text-gray-400"

                                                                        >

                                                                            {allSelected ? "Clear all" : "Select all"}

                                                                        </button>

                                                                    </div>

                                                                    <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white">

                                                                        {serials.map((serial) => {

                                                                            const disabled = serial.qty_available !== 1 || (serial.qty_allocated || 0) > 0 || (serial.qty_shipped || 0) > 0;

                                                                            const checked = selectedSerials.has(serial.serial_number);

                                                                            return (

                                                                                <label

                                                                                    key={serial.serial_number}

                                                                                    className={`flex items-center justify-between border-b border-gray-100 px-3 py-2 text-xs last:border-b-0 ${disabled

                                                                                        ? "cursor-not-allowed bg-gray-50 text-gray-400"

                                                                                        : checked

                                                                                            ? "cursor-pointer bg-emerald-50"

                                                                                            : "cursor-pointer hover:bg-gray-50"

                                                                                        }`}

                                                                                >

                                                                                    <span className="flex min-w-0 items-center gap-2">

                                                                                        <input

                                                                                            type="checkbox"

                                                                                            checked={checked}

                                                                                            disabled={disabled}

                                                                                            onChange={() => toggleSerial(serial.serial_number)}

                                                                                            className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"

                                                                                        />

                                                                                        <span className="truncate font-mono">{serial.serial_number}</span>

                                                                                    </span>

                                                                                    <span className="ml-3 shrink-0 text-[11px]">

                                                                                        {disabled ? "Unavailable" : "Qty 1"}

                                                                                    </span>

                                                                                </label>

                                                                            );

                                                                        })}

                                                                    </div>

                                                                </>

                                                            )}

                                                        </div>

                                                    )}

                                                    {processMode === "internal-transfer" && open && !serialMode && (

                                                        <div className="border-t border-gray-200 bg-gray-50 p-3">

                                                            <div className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">

                                                                <div><span className="text-gray-400">Onhand</span><div className="font-medium text-gray-700">{formatQty(inventory.qty_onhand)} {inventory.uom}</div></div>

                                                                <div><span className="text-gray-400">Available</span><div className="font-medium text-emerald-700">{formatQty(inventory.qty_available)} {inventory.uom}</div></div>

                                                                <div><span className="text-gray-400">Allocated</span><div className="font-medium text-gray-700">{formatQty(inventory.qty_allocated || 0)} {inventory.uom}</div></div>

                                                                <div><span className="text-gray-400">Shipped</span><div className="font-medium text-gray-700">{formatQty(inventory.qty_shipped || 0)} {inventory.uom}</div></div>

                                                            </div>

                                                        </div>

                                                    )}

                                                </div>

                                            );

                                        })}

                                    </div>

                                )}

                            </div>

                        </div>

                    </div>

                    {/* PROCESS FORM */}
                    {processMode === "internal-transfer" ? (
                    <div className="xl:col-span-4">

                        <div className="sticky top-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">

                            <div className="border-b border-gray-200 px-4 py-3">

                                <div className="flex items-center justify-between">

                                    <div>

                                        <h2 className="text-sm font-semibold text-gray-900">Transfer</h2>

                                        <p className="mt-1 text-xs text-gray-500">

                                            {selectedInventory?.transfer_mode === "serial"

                                                ? `${selectedSerials.size} serial(s) selected`

                                                : selectedInventory

                                                    ? `${formatQty(Number(qtyToTransfer || 0))} ${selectedInventory.uom} selected`

                                                    : "Select source inventory"}

                                        </p>

                                    </div>

                                    {selectedInventory && (

                                        <button type="button" onClick={clearSelection} className="text-gray-400 hover:text-gray-700">

                                            <X className="h-4 w-4" />

                                        </button>

                                    )}

                                </div>

                            </div>

                            <div className="space-y-4 p-4">

                                {selectedInventory ? (

                                    <>

                                        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs">

                                            <div className="font-semibold text-blue-900">

                                                Source Inventory #{getId(selectedInventory)}

                                            </div>

                                            <div className="mt-2 text-sm font-semibold text-blue-900">

                                                {selectedInventory.item_code}

                                            </div>

                                            <div className="mt-1 text-xs font-medium text-blue-800">

                                                {selectedInventory.product?.item_name ||

                                                    "-"}

                                            </div>

                                            <div className="mt-1 text-[11px] text-blue-700">

                                                Model:{" "}

                                                {selectedInventory.product?.unit_model ||

                                                    "-"}

                                            </div>

                                            <div className="mt-1 text-[10px] text-blue-600">

                                                Barcode:{" "}

                                                {selectedInventory.product?.barcode ||

                                                    selectedInventory.barcode ||

                                                    "-"}

                                            </div>

                                            <div className="mt-2 text-blue-700">

                                                {selectedInventory.owner_code} ·{" "}

                                                {selectedInventory.whs_code} /{" "}

                                                {selectedInventory.location}

                                            </div>

                                            <div className="mt-1 text-blue-700">

                                                {formatQty(

                                                    selectedInventory.qty_available,

                                                )}{" "}

                                                {selectedInventory.uom} available ·{" "}

                                                {selectedInventory.transfer_mode ===

                                                    "serial"

                                                    ? "Serial"

                                                    : "Quantity"}{" "}

                                                mode

                                            </div>

                                        </div>

                                        {selectedInventory.transfer_mode === "quantity" && (

                                            <div>

                                                <label className="field">Transfer Quantity *</label>

                                                <input

                                                    type="number"

                                                    min="0.0001"

                                                    max={selectedInventory.qty_available}

                                                    step="any"

                                                    value={qtyToTransfer}

                                                    onChange={(e) => setQtyToTransfer(e.target.value)}

                                                    className={inputClass}

                                                    placeholder={`Max ${selectedInventory.qty_available}`}

                                                />

                                                <div className="mt-1 text-[10px] text-gray-400">

                                                    Maximum: {formatQty(selectedInventory.qty_available)} {selectedInventory.uom}

                                                </div>

                                            </div>

                                        )}

                                        {selectedInventory.transfer_mode === "serial" && (

                                            <div className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">

                                                <div className="flex items-center gap-2 font-medium">

                                                    <Check className="h-3.5 w-3.5" />

                                                    {selectedSerials.size} serial(s) selected = {selectedSerials.size} PCS

                                                </div>

                                            </div>

                                        )}

                                        <div>

                                            <label className="field">Destination Warehouse *</label>

                                            <Select

                                                options={warehouseOptions}

                                                value={warehouseOptions.find((option) => option.value === toWhsCode) || null}

                                                onChange={(option) => { setToWhsCode(option?.value || ""); setToLocation(""); }}

                                                isClearable

                                                isSearchable

                                                isLoading={loadingMaster}

                                                placeholder="Select warehouse"

                                                styles={selectStyles}

                                            />

                                        </div>

                                        <div>

                                            <label className="field">Destination Location *</label>

                                            <Select

                                                options={destinationLocationOptions}

                                                value={destinationLocationOptions.find((option) => option.value === toLocation) || null}

                                                onChange={(option) => setToLocation(option?.value || "")}

                                                isClearable

                                                isSearchable

                                                isLoading={loadingMaster}

                                                isDisabled={!toWhsCode}

                                                placeholder={toWhsCode ? "Select location" : "Select warehouse first"}

                                                styles={selectStyles}

                                            />

                                        </div>

                                        <div>

                                            <label className="field">Destination Division *</label>

                                            <Select

                                                options={divisionOptions}

                                                value={divisionOptions.find((option) => option.value === divisionCode) || null}

                                                onChange={(option) => setDivisionCode(option?.value || "")}

                                                isClearable

                                                isSearchable

                                                isLoading={loadingMaster}

                                                placeholder="Select division"

                                                styles={selectStyles}

                                            />

                                        </div>

                                        <div>

                                            <label className="field">Destination QA Status</label>

                                            <Select

                                                options={qaOptions}

                                                value={qaOptions.find((option) => option.value === newQaStatus) || null}

                                                onChange={(option) => setNewQaStatus(option?.value || "")}

                                                isClearable

                                                isSearchable

                                                isLoading={loadingMaster}

                                                placeholder={`Keep source: ${selectedInventory.qa_status}`}

                                                styles={selectStyles}

                                            />

                                        </div>

                                        <div>

                                            <label className="field">Destination Lot</label>

                                            <CreatableSelect

                                                options={lotOptions}

                                                value={lotNumber ? { value: lotNumber, label: lotNumber } : null}

                                                onChange={(option) => setLotNumber(option?.value || "")}

                                                onCreateOption={(value) => setLotNumber(value.trim())}

                                                isClearable

                                                isSearchable

                                                placeholder={`Keep source: ${selectedInventory.lot_number || "-"}`}

                                                styles={selectStyles}

                                            />

                                        </div>

                                        <div>

                                            <label className="field">Reason</label>

                                            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className={`${inputClass} h-auto py-2 resize-none`} placeholder="Reason for internal transfer..." />

                                        </div>

                                        <div className="border-t border-gray-200 pt-4">

                                            <button

                                                type="button"

                                                onClick={submit}

                                                disabled={!canSubmit}

                                                className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"

                                            >

                                                {submitting && <Spinner />}

                                                {submitting ? "Transferring..." : `Transfer ${formatQty(selectedQuantity)} ${selectedInventory.uom || "PCS"}`}

                                            </button>

                                        </div>

                                    </>

                                ) : (

                                    <div className="py-12 text-center text-xs text-gray-400">

                                        Expand and select an inventory record from the left.

                                    </div>

                                )}

                            </div>

                        </div>
                    </div>
                    ) : (
                        <div className="xl:col-span-4">
                            <div className="sticky top-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                                <div className="border-b border-gray-200 px-4 py-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-sm font-semibold text-gray-900">Change Carton Number</h2>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {selectedCartonInventories.size} inventory record(s) selected
                                            </p>
                                        </div>
                                        {selectedCartonInventories.size > 0 && (
                                            <button
                                                type="button"
                                                onClick={clearCartonSelection}
                                                disabled={submitting}
                                                className="text-xs font-medium text-gray-500 hover:text-gray-900 disabled:opacity-50"
                                            >
                                                Clear selection
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 p-4">
                                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                        Only the carton number will change. Warehouse, location, division, owner, QA status, pallet, lot, and quantities will remain unchanged.
                                    </div>

                                    <div>
                                        <label htmlFor="to-carton-number" className="field">Destination Carton Number <span className="text-red-600">*</span></label>
                                        <input
                                            id="to-carton-number"
                                            type="text"
                                            value={toCartonNumber}
                                            onChange={(event) => setToCartonNumber(event.target.value)}
                                            maxLength={100}
                                            disabled={submitting}
                                            autoComplete="off"
                                            className={inputClass}
                                            placeholder="Enter destination carton number"
                                        />
                                        <p className="mt-1 text-[10px] text-gray-400">Maximum 100 characters.</p>
                                    </div>

                                    <div>
                                        <label htmlFor="carton-change-reason" className="field">Reason <span className="text-red-600">*</span></label>
                                        <textarea
                                            id="carton-change-reason"
                                            value={reason}
                                            onChange={(event) => setReason(event.target.value)}
                                            rows={3}
                                            maxLength={255}
                                            disabled={submitting}
                                            required
                                            className={`${inputClass} h-auto resize-y py-2`}
                                            placeholder="Explain why the carton number is changing..."
                                        />
                                        <div className="mt-1 flex justify-end text-[10px] text-gray-400">{reason.length}/255</div>
                                    </div>

                                    {sameCartonSelectionCount > 0 && (
                                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
                                            {sameCartonSelectionCount} selected inventory record(s) already have this carton number. Choose another number or deselect them.
                                        </div>
                                    )}
                                    {selectedCartonInventories.size > 500 && (
                                        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800" role="alert">
                                            The maximum is 500 inventory records per request. Remove {selectedCartonInventories.size - 500} record(s) before submitting.
                                        </div>
                                    )}

                                    <div className="overflow-hidden rounded-md border border-gray-200">
                                        <div className="border-b border-gray-100 bg-gray-50 px-3 py-2 text-[11px] font-semibold text-gray-600">
                                            Selected inventory preview
                                        </div>
                                        {selectedCartonInventories.size === 0 ? (
                                            <div className="px-3 py-7 text-center text-xs text-gray-400">
                                                Select one or more records from the inventory list.
                                            </div>
                                        ) : (
                                            <div className="max-h-56 divide-y divide-gray-100 overflow-y-auto">
                                                {Array.from(selectedCartonInventories.entries()).map(([id, inventory]) => (
                                                    <div key={id} className="flex items-start justify-between gap-3 px-3 py-2.5 text-xs">
                                                        <div className="min-w-0">
                                                            <div className="truncate font-semibold text-gray-800">{inventory.item_code || "-"}</div>
                                                            <div className="mt-0.5 truncate text-[10px] text-gray-500">ID {id} · {inventory.whs_code} / {inventory.location}</div>
                                                            <div className="mt-0.5 truncate text-[10px] text-gray-400">Carton: {text(inventory.carton_number)}</div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleCartonInventory(inventory)}
                                                            disabled={submitting}
                                                            aria-label={`Remove inventory ${id} from selection`}
                                                            className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 disabled:opacity-50"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-gray-200 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => void submitChangeCartonNumber()}
                                            disabled={!canSubmitCartonChange}
                                            className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {submitting && <Spinner />}
                                            {submitting ? "Updating carton number..." : `Change carton for ${selectedCartonInventories.size} record(s)`}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`

                .field {

                    display: block;

                    margin-bottom: 5px;

                    font-size: 11px;

                    font-weight: 500;

                    color: #374151;

                }

            `}</style>

        </Layout>

    );

}
