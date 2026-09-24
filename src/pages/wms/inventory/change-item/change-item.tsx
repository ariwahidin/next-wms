/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import Select from "react-select";

import {
    Check,
    ChevronDown,
    ChevronRight,
    RefreshCw,
    Search,
    X,
    AlertTriangle,
} from "lucide-react";

import api from "@/lib/api";
import Layout from "@/components/layout";

// ============================================================================
// TYPES
// ============================================================================

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

    item_id?: number;
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

    change_mode: "serial" | "quantity" | string;
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

interface ProductOption extends SelectOption {
    itemId: number;
    itemCode: string;
    itemName: string;
    unitModel: string;
    barcode: string;
}

interface ApiListResponse {
    success: boolean;

    data?: {
        inventories?: Inventory[];
        total?: number;
        page?: number;
        page_size?: number;
        total_pages?: number;
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

// ============================================================================
// STYLES
// ============================================================================

const selectStyles = {
    control: (base: any) => ({
        ...base,
        minHeight: 36,
        height: 36,
        fontSize: 12,
        borderColor: "#d1d5db",
        boxShadow: "none",
    }),

    valueContainer: (base: any) => ({
        ...base,
        padding: "0 9px",
    }),

    indicatorsContainer: (base: any) => ({
        ...base,
        height: 34,
    }),

    menu: (base: any) => ({
        ...base,
        zIndex: 100,
        fontSize: 12,
    }),

    option: (base: any, state: any) => ({
        ...base,
        fontSize: 12,
        backgroundColor: state.isFocused
            ? "#f3f4f6"
            : "#ffffff",
        color: "#111827",
    }),
};

const inputClass =
    "h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-xs outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-300";

const fieldClass =
    "mb-1 block text-[11px] font-medium text-gray-600";

// ============================================================================
// HELPERS
// ============================================================================

function getId<T extends { ID?: number; id?: number }>(
    row: T,
): number {
    return Number(row.ID ?? row.id ?? 0);
}

function formatQty(value: number | undefined) {
    return Number(value || 0).toLocaleString(
        "en-US",
        {
            maximumFractionDigits: 4,
        },
    );
}

function text(value: unknown) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "-";
    }

    return String(value);
}

// ============================================================================
// PRODUCT OPTION
// ============================================================================

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
                Model: {option.unitModel || "-"}
                {" · "}
                Barcode: {option.barcode || "-"}
            </div>
        </div>
    );
}

// ============================================================================
// ALERT
// ============================================================================

function Alert({
    type,
    message,
}: {
    type: "success" | "error";
    message: string;
}) {
    if (!message) {
        return null;
    }

    return (
        <div
            className={`rounded-md border px-3 py-2 text-xs ${type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
        >
            {message}
        </div>
    );
}

// ============================================================================
// SPINNER
// ============================================================================

function Spinner() {
    return (
        <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
    );
}

// ============================================================================
// MAIN
// ============================================================================

export default function ChangeItemPage() {
    // ------------------------------------------------------------------------
    // MASTER DATA
    // ------------------------------------------------------------------------

    const [products, setProducts] =
        useState<Product[]>([]);

    const [owners, setOwners] =
        useState<Owner[]>([]);

    const [warehouses, setWarehouses] =
        useState<Warehouse[]>([]);

    const [locations, setLocations] =
        useState<Location[]>([]);

    const [divisions, setDivisions] =
        useState<Division[]>([]);

    const [qaStatuses, setQaStatuses] =
        useState<QaStatus[]>([]);

    const [loadingMaster, setLoadingMaster] =
        useState(true);

    // ------------------------------------------------------------------------
    // SOURCE FILTER
    // ------------------------------------------------------------------------

    const [search, setSearch] =
        useState("");

    const [itemCode, setItemCode] =
        useState("");

    const [ownerCode, setOwnerCode] =
        useState("");

    const [sourceWhs, setSourceWhs] =
        useState("");

    const [sourceLocation, setSourceLocation] =
        useState("");

    const [sourceDivision, setSourceDivision] =
        useState("");

    const [sourceQa, setSourceQa] =
        useState("");

    const [sourcePallet, setSourcePallet] =
        useState("");

    // ------------------------------------------------------------------------
    // INVENTORIES
    // ------------------------------------------------------------------------

    const [inventories, setInventories] =
        useState<Inventory[]>([]);

    const [loadingInventories, setLoadingInventories] =
        useState(false);

    // Inventory is loaded only after the user explicitly searches.
    const [hasSearched, setHasSearched] =
        useState(false);

    const [inventoryPage, setInventoryPage] =
        useState(1);

    const [inventoryTotal, setInventoryTotal] =
        useState(0);

    const [inventoryTotalPages, setInventoryTotalPages] =
        useState(0);

    const inventoryPageSize = 100;

    const [expandedId, setExpandedId] =
        useState<number | null>(null);

    const [selectedInventory, setSelectedInventory] =
        useState<Inventory | null>(null);

    // ------------------------------------------------------------------------
    // SERIAL
    // ------------------------------------------------------------------------

    const [serials, setSerials] =
        useState<InventorySerial[]>([]);

    const [selectedSerials, setSelectedSerials] =
        useState<Set<string>>(new Set());

    const [loadingSerials, setLoadingSerials] =
        useState(false);

    // ------------------------------------------------------------------------
    // CHANGE ITEM
    // ------------------------------------------------------------------------

    const [targetItemId, setTargetItemId] =
        useState<number | null>(null);

    const [qtyToChange, setQtyToChange] =
        useState("");

    const [reason, setReason] =
        useState("");

    // ------------------------------------------------------------------------
    // STATUS
    // ------------------------------------------------------------------------

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    // ------------------------------------------------------------------------
    // CONFIRMATION MODAL
    // ------------------------------------------------------------------------

    const [showConfirmModal, setShowConfirmModal] =
        useState(false);

    // ========================================================================
    // MASTER DATA
    // ========================================================================

    const loadMasterData = useCallback(
        async () => {
            setLoadingMaster(true);

            try {
                const requests = await Promise.allSettled([
                    api.get(
                        "/products",
                        {
                            withCredentials: true,
                        },
                    ),

                    api.get(
                        "/owners",
                        {
                            withCredentials: true,
                        },
                    ),

                    api.get(
                        "/warehouses",
                        {
                            withCredentials: true,
                        },
                    ),

                    api.get(
                        "/locations",
                        {
                            withCredentials: true,
                        },
                    ),

                    api.get(
                        "/divisions",
                        {
                            withCredentials: true,
                        },
                    ),

                    api.get(
                        "/qa-status",
                        {
                            withCredentials: true,
                        },
                    ),
                ]);

                const [
                    productsRes,
                    ownersRes,
                    warehousesRes,
                    locationsRes,
                    divisionsRes,
                    qaRes,
                ] = requests;

                if (
                    productsRes.status ===
                    "fulfilled" &&
                    productsRes.value.data?.success
                ) {
                    setProducts(
                        productsRes.value.data.data ||
                        [],
                    );
                }

                if (
                    ownersRes.status ===
                    "fulfilled" &&
                    ownersRes.value.data?.success
                ) {
                    setOwners(
                        ownersRes.value.data.data ||
                        [],
                    );
                }

                if (
                    warehousesRes.status ===
                    "fulfilled" &&
                    warehousesRes.value.data?.success
                ) {
                    setWarehouses(
                        warehousesRes.value.data.data ||
                        [],
                    );
                }

                if (
                    locationsRes.status ===
                    "fulfilled" &&
                    locationsRes.value.data?.success
                ) {
                    setLocations(
                        locationsRes.value.data.data ||
                        [],
                    );
                }

                if (
                    divisionsRes.status ===
                    "fulfilled" &&
                    divisionsRes.value.data?.success
                ) {
                    setDivisions(
                        divisionsRes.value.data.data ||
                        [],
                    );
                }

                if (
                    qaRes.status ===
                    "fulfilled" &&
                    qaRes.value.data?.success
                ) {
                    setQaStatuses(
                        qaRes.value.data.data ||
                        [],
                    );
                }
            } catch (err) {
                console.error(
                    "Failed to load master data:",
                    err,
                );
            } finally {
                setLoadingMaster(false);
            }
        },
        [],
    );

    // ========================================================================
    // FETCH INVENTORIES
    // ========================================================================

    const fetchInventories = useCallback(
        async (page = 1) => {
            // Never allow an accidental unfiltered inventory request.
            const hasFilter = [
                itemCode,
                ownerCode,
                sourceWhs,
                sourceLocation,
                sourceDivision,
                sourceQa,
                sourcePallet,
                search,
            ].some((value) => value.trim() !== "");

            if (!hasFilter) {
                setError(
                    "Please select at least one filter before searching inventory.",
                );
                setInventories([]);
                setInventoryTotal(0);
                setInventoryTotalPages(0);
                setHasSearched(false);
                return;
            }

            setLoadingInventories(true);
            setError("");
            setExpandedId(null);
            setSelectedInventory(null);
            setSerials([]);
            setSelectedSerials(new Set());

            try {
                const params = new URLSearchParams();
                params.set("page", String(page));
                params.set("page_size", String(inventoryPageSize));

                if (itemCode.trim()) {
                    params.set("item_code", itemCode.trim());
                }

                if (ownerCode.trim()) {
                    params.set("owner_code", ownerCode.trim());
                }

                if (sourceWhs.trim()) {
                    params.set("whs_code", sourceWhs.trim());
                }

                if (sourceLocation.trim()) {
                    params.set("location", sourceLocation.trim());
                }

                if (sourceDivision.trim()) {
                    params.set("division_code", sourceDivision.trim());
                }

                if (sourceQa.trim()) {
                    params.set("qa_status", sourceQa.trim());
                }

                if (sourcePallet.trim()) {
                    params.set("pallet", sourcePallet.trim());
                }

                if (search.trim()) {
                    params.set("search", search.trim());
                }

                const response = await api.get<ApiListResponse>(
                    `/inventory/change-item/inventories?${params.toString()}`,
                );

                if (!response.data?.success) {
                    throw new Error(
                        response.data?.error ||
                        response.data?.message ||
                        "Failed to fetch inventory",
                    );
                }

                const data = response.data.data;

                setInventories(data?.inventories || []);
                setInventoryPage(data?.page || page);
                setInventoryTotal(data?.total || 0);
                setInventoryTotalPages(data?.total_pages || 0);
                setHasSearched(true);
            } catch (err: any) {
                console.error(
                    "Failed to fetch change item inventories:",
                    err,
                );

                setError(
                    err?.response?.data?.error ||
                    err?.response?.data?.message ||
                    err?.message ||
                    "Failed to fetch inventory",
                );

                setInventories([]);
                setInventoryTotal(0);
                setInventoryTotalPages(0);
            } finally {
                setLoadingInventories(false);
            }
        },
        [
            itemCode,
            ownerCode,
            sourceWhs,
            sourceLocation,
            sourceDivision,
            sourceQa,
            sourcePallet,
            search,
        ],
    );

    // ========================================================================
    // CLEAR
    // ========================================================================

    const clearSelection = useCallback(
        () => {
            setExpandedId(null);

            setSelectedInventory(null);

            setSerials([]);

            setSelectedSerials(
                new Set(),
            );

            setQtyToChange("");

            setTargetItemId(null);

            setReason("");

            setError("");

            setSuccess("");
        },
        [],
    );

    // ========================================================================
    // SELECT INVENTORY
    // ========================================================================

    const selectInventory = useCallback(
        async (inventory: Inventory) => {
            const id = getId(inventory);

            setError("");
            setSuccess("");

            setExpandedId(
                expandedId === id
                    ? null
                    : id,
            );

            setSelectedInventory(
                inventory,
            );

            setTargetItemId(null);

            setQtyToChange("");

            setReason("");

            setSelectedSerials(
                new Set(),
            );

            setSerials([]);

            if (
                inventory.change_mode !==
                "serial"
            ) {
                return;
            }

            setLoadingSerials(true);

            try {
                const response =
                    await api.get<ApiSerialResponse>(
                        `/inventory/change-item/serials?inventory_id=${id}`,
                    );

                if (
                    !response.data?.success
                ) {
                    throw new Error(
                        response.data?.error ||
                        response.data?.message ||
                        "Failed to fetch serials",
                    );
                }

                setSerials(
                    response.data.data
                        ?.serials || [],
                );
            } catch (err: any) {
                console.error(
                    "Failed to fetch serials:",
                    err,
                );

                setError(
                    err?.response?.data?.error ||
                    err?.response?.data?.message ||
                    err?.message ||
                    "Failed to fetch serials",
                );
            } finally {
                setLoadingSerials(false);
            }
        },
        [expandedId],
    );

    // ========================================================================
    // INITIAL LOAD
    // ========================================================================

    useEffect(() => {
        loadMasterData();
    }, [loadMasterData]);

    // ========================================================================
    // OPTIONS
    // ========================================================================

    const productOptions =
        useMemo<ProductOption[]>(
            () =>
                products
                    .map((product) => {
                        const itemId =
                            Number(
                                product.id ??
                                product.ID ??
                                0,
                            );

                        const itemCode =
                            product.item_code ||
                            "";

                        const itemName =
                            product.item_name ||
                            "";

                        const unitModel =
                            product.unit_model ||
                            "";

                        const barcode =
                            product.barcode ||
                            "";

                        return {
                            value: itemCode,
                            label: itemName
                                ? `${itemCode} — ${itemName}`
                                : itemCode,
                            itemId,
                            itemCode,
                            itemName,
                            unitModel,
                            barcode,
                        };
                    })
                    .filter(
                        (option) =>
                            option.value &&
                            option.itemId > 0,
                    ),
            [products],
        );

    const targetProductOptions =
        useMemo(
            () =>
                productOptions.filter(
                    (option) =>
                        option.itemCode !==
                        selectedInventory?.item_code,
                ),
            [
                productOptions,
                selectedInventory?.item_code,
            ],
        );

    const ownerOptions =
        useMemo<SelectOption[]>(
            () =>
                owners
                    .map((owner) => ({
                        value: owner.code,
                        label: owner.name
                            ? `${owner.code} — ${owner.name}`
                            : owner.code,
                    }))
                    .filter(
                        (option) =>
                            option.value,
                    ),
            [owners],
        );

    const warehouseOptions =
        useMemo<SelectOption[]>(
            () =>
                warehouses
                    .map((warehouse) => ({
                        value: warehouse.code,
                        label: warehouse.name
                            ? `${warehouse.code} — ${warehouse.name}`
                            : warehouse.code,
                    }))
                    .filter(
                        (option) =>
                            option.value,
                    ),
            [warehouses],
        );

    const sourceLocationOptions =
        useMemo<SelectOption[]>(
            () =>
                locations
                    .filter(
                        (location) =>
                            !sourceWhs ||
                            location.whs_code ===
                            sourceWhs,
                    )
                    .map((location) => ({
                        value:
                            location.location_code,
                        label:
                            location.name
                                ? `${location.location_code} — ${location.name}`
                                : location.location_code,
                    }))
                    .filter(
                        (option) =>
                            option.value,
                    ),
            [
                locations,
                sourceWhs,
            ],
        );

    const divisionOptions =
        useMemo<SelectOption[]>(
            () =>
                divisions
                    .map((division) => ({
                        value: division.code,
                        label: division.name
                            ? `${division.code} — ${division.name}`
                            : division.code,
                    }))
                    .filter(
                        (option) =>
                            option.value,
                    ),
            [divisions],
        );

    const qaOptions =
        useMemo<SelectOption[]>(
            () =>
                qaStatuses
                    .map((qa) => ({
                        value:
                            qa.qa_status,
                        label:
                            qa.description
                                ? `${qa.qa_status} — ${qa.description}`
                                : qa.qa_status,
                    }))
                    .filter(
                        (option) =>
                            option.value,
                    ),
            [qaStatuses],
        );

    // ========================================================================
    // SELECTED TARGET PRODUCT
    // ========================================================================

    const selectedTargetProduct =
        useMemo(
            () =>
                productOptions.find(
                    (option) =>
                        option.itemId ===
                        targetItemId,
                ) || null,
            [
                productOptions,
                targetItemId,
            ],
        );

    // ========================================================================
    // SERIAL HELPERS
    // ========================================================================

    const toggleSerial = (
        serialNumber: string,
    ) => {
        setSelectedSerials((previous) => {
            const next =
                new Set(previous);

            if (
                next.has(
                    serialNumber,
                )
            ) {
                next.delete(
                    serialNumber,
                );
            } else {
                next.add(
                    serialNumber,
                );
            }

            return next;
        });
    };

    const selectAllSerials = () => {
        setSelectedSerials(
            new Set(
                serials.map(
                    (serial) =>
                        serial.serial_number,
                ),
            ),
        );
    };

    const clearAllSerials = () => {
        setSelectedSerials(
            new Set(),
        );
    };

    // ========================================================================
    // VALIDATION
    // ========================================================================

    const canSubmit = useMemo(() => {
        if (
            !selectedInventory
        ) {
            return false;
        }

        if (!targetItemId) {
            return false;
        }

        if (
            selectedInventory.change_mode ===
            "serial"
        ) {
            return (
                selectedSerials.size >
                0
            );
        }

        const qty =
            Number(qtyToChange);

        return (
            qty > 0 &&
            qty <=
            Number(
                selectedInventory.qty_available ||
                0,
            )
        );
    }, [
        selectedInventory,
        targetItemId,
        selectedSerials,
        qtyToChange,
    ]);

    // ========================================================================
    // SUBMIT
    // ========================================================================

    const submitChangeItem =
        async () => {
            if (!selectedInventory) {
                return;
            }

            if (!targetItemId) {
                setError(
                    "Please select target item.",
                );

                return;
            }

            setError("");
            setSuccess("");

            const isSerial =
                selectedInventory.change_mode ===
                "serial";

            const quantity = isSerial
                ? selectedSerials.size
                : Number(
                    qtyToChange,
                );

            if (quantity <= 0) {
                setError(
                    isSerial
                        ? "Please select at least one serial."
                        : "Quantity must be greater than 0.",
                );

                return;
            }

            if (
                !isSerial &&
                quantity >
                selectedInventory.qty_available
            ) {
                setError(
                    "Quantity exceeds available stock.",
                );

                return;
            }

            setShowConfirmModal(true);
        };

    // ========================================================================
    // EXECUTE CHANGE ITEM AFTER CUSTOM CONFIRMATION
    // ========================================================================

    const confirmChangeItem = async () => {
        if (!selectedInventory || !targetItemId) {
            setShowConfirmModal(false);
            return;
        }

        const isSerial =
            selectedInventory.change_mode ===
            "serial";

        const quantity = isSerial
            ? selectedSerials.size
            : Number(qtyToChange);

        setShowConfirmModal(false);
        setSubmitting(true);

        try {
                const payload = {
                    inventory_id:
                        getId(
                            selectedInventory,
                        ),

                    target_item_id:
                        targetItemId,

                    target_item_code:
                        selectedTargetProduct?.itemCode ||
                        "",

                    qty_to_change:
                        quantity,

                    serial_numbers:
                        isSerial
                            ? Array.from(
                                selectedSerials,
                            )
                            : [],

                    reason:
                        reason.trim(),
                };

                const response =
                    await api.post(
                        "/inventory/change-item",
                        payload,
                        {
                            withCredentials: true,
                        },
                    );

                if (
                    !response.data?.success
                ) {
                    throw new Error(
                        response.data?.error ||
                        response.data?.message ||
                        "Change item failed",
                    );
                }

                setSuccess(
                    response.data
                        ?.message ||
                    "Change Item completed successfully.",
                );

                setSelectedInventory(
                    null,
                );

                setExpandedId(
                    null,
                );

                setSerials([]);

                setSelectedSerials(
                    new Set(),
                );

                setQtyToChange("");

                setTargetItemId(
                    null,
                );

                setReason("");

                if (hasSearched) {
                    await fetchInventories(1);
                }
            } catch (err: any) {
                console.error(
                    "Change item failed:",
                    err,
                );

                setError(
                    err?.response?.data?.error ||
                    err?.response?.data?.message ||
                    err?.message ||
                    "Change item failed.",
                );
            } finally {
                setSubmitting(false);
            }
        };

    // ========================================================================
    // CONFIRMATION DISPLAY DATA
    // ========================================================================

    const confirmationQuantity = selectedInventory
        ? selectedInventory.change_mode === "serial"
            ? selectedSerials.size
            : Number(qtyToChange || 0)
        : 0;

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <Layout
            title="Inventory"
            subTitle="Change Item"
        >
            <div className="space-y-4 p-4">
                {/* ---------------------------------------------------------- */}
                {/* ALERT */}
                {/* ---------------------------------------------------------- */}

                <div className="space-y-2">
                    <Alert
                        type="error"
                        message={
                            error
                        }
                    />

                    <Alert
                        type="success"
                        message={
                            success
                        }
                    />
                </div>

                {/* ---------------------------------------------------------- */}
                {/* CONTENT */}
                {/* ---------------------------------------------------------- */}

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                    {/* ====================================================== */}
                    {/* SOURCE */}
                    {/* ====================================================== */}

                    <div className="xl:col-span-8">
                        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                            {/* HEADER */}

                            <div className="border-b border-gray-100 px-4 py-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-sm font-semibold text-gray-900">
                                            Source Inventory
                                        </h2>

                                        <p className="mt-1 text-xs text-gray-500">
                                            {!hasSearched
                                                ? "Search inventory by filter to load stock"
                                                : `${inventoryTotal.toLocaleString()} inventory record(s) found`}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {loadingInventories && (
                                            <Spinner />
                                        )}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                fetchInventories(1)
                                            }
                                            disabled={
                                                loadingInventories
                                            }
                                            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            <RefreshCw className="h-3.5 w-3.5" />

                                            Refresh
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* FILTER */}

                            <div className="border-b border-gray-100 bg-gray-50 p-3">
                                <div className="mb-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] text-blue-700">
                                    Stock is loaded only after you search. Use Item Code or another filter to avoid loading the entire inventory.
                                </div>

                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
                                    {/* SEARCH */}

                                    <div>
                                        <label
                                            className={
                                                fieldClass
                                            }
                                        >
                                            Search
                                        </label>

                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />

                                            <input
                                                value={
                                                    search
                                                }
                                                onChange={(
                                                    e,
                                                ) =>
                                                    setSearch(
                                                        e
                                                            .target
                                                            .value,
                                                    )
                                                }
                                                onKeyDown={(
                                                    e,
                                                ) =>
                                                    e.key ===
                                                    "Enter" &&
                                                    fetchInventories()
                                                }
                                                className={`${inputClass} pl-8`}
                                                placeholder="Item / model /barcode / pallet..."
                                            />
                                        </div>
                                    </div>

                                    {/* ITEM */}

                                    <div>
                                        <label
                                            className={
                                                fieldClass
                                            }
                                        >
                                            Item Code
                                        </label>

                                        <Select
                                            options={
                                                productOptions
                                            }
                                            value={
                                                productOptions.find(
                                                    (
                                                        option,
                                                    ) =>
                                                        option.value ===
                                                        itemCode,
                                                ) ||
                                                null
                                            }
                                            onChange={(
                                                option,
                                            ) =>
                                                setItemCode(
                                                    option?.value ||
                                                    "",
                                                )
                                            }
                                            isClearable
                                            isSearchable
                                            isLoading={
                                                loadingMaster
                                            }
                                            placeholder="All items"
                                            styles={
                                                selectStyles
                                            }
                                            formatOptionLabel={(
                                                option,
                                            ) => (
                                                <ProductOptionLabel
                                                    option={
                                                        option as ProductOption
                                                    }
                                                />
                                            )}
                                        />
                                    </div>

                                    {/* OWNER */}

                                    <div>
                                        <label
                                            className={
                                                fieldClass
                                            }
                                        >
                                            Owner
                                        </label>

                                        <Select
                                            options={
                                                ownerOptions
                                            }
                                            value={
                                                ownerOptions.find(
                                                    (
                                                        option,
                                                    ) =>
                                                        option.value ===
                                                        ownerCode,
                                                ) ||
                                                null
                                            }
                                            onChange={(
                                                option,
                                            ) =>
                                                setOwnerCode(
                                                    option?.value ||
                                                    "",
                                                )
                                            }
                                            isClearable
                                            isSearchable
                                            isLoading={
                                                loadingMaster
                                            }
                                            placeholder="All owners"
                                            styles={
                                                selectStyles
                                            }
                                        />
                                    </div>

                                    {/* WAREHOUSE */}

                                    <div>
                                        <label
                                            className={
                                                fieldClass
                                            }
                                        >
                                            Warehouse
                                        </label>

                                        <Select
                                            options={
                                                warehouseOptions
                                            }
                                            value={
                                                warehouseOptions.find(
                                                    (
                                                        option,
                                                    ) =>
                                                        option.value ===
                                                        sourceWhs,
                                                ) ||
                                                null
                                            }
                                            onChange={(
                                                option,
                                            ) => {
                                                setSourceWhs(
                                                    option?.value ||
                                                    "",
                                                );

                                                setSourceLocation(
                                                    "",
                                                );
                                            }}
                                            isClearable
                                            isSearchable
                                            isLoading={
                                                loadingMaster
                                            }
                                            placeholder="All warehouses"
                                            styles={
                                                selectStyles
                                            }
                                        />
                                    </div>

                                    {/* LOCATION */}

                                    <div>
                                        <label
                                            className={
                                                fieldClass
                                            }
                                        >
                                            Location
                                        </label>

                                        <Select
                                            options={
                                                sourceLocationOptions
                                            }
                                            value={
                                                sourceLocationOptions.find(
                                                    (
                                                        option,
                                                    ) =>
                                                        option.value ===
                                                        sourceLocation,
                                                ) ||
                                                null
                                            }
                                            onChange={(
                                                option,
                                            ) =>
                                                setSourceLocation(
                                                    option?.value ||
                                                    "",
                                                )
                                            }
                                            isClearable
                                            isSearchable
                                            isLoading={
                                                loadingMaster
                                            }
                                            placeholder="All locations"
                                            styles={
                                                selectStyles
                                            }
                                        />
                                    </div>

                                    {/* DIVISION */}

                                    <div>
                                        <label
                                            className={
                                                fieldClass
                                            }
                                        >
                                            Division
                                        </label>

                                        <Select
                                            options={
                                                divisionOptions
                                            }
                                            value={
                                                divisionOptions.find(
                                                    (
                                                        option,
                                                    ) =>
                                                        option.value ===
                                                        sourceDivision,
                                                ) ||
                                                null
                                            }
                                            onChange={(
                                                option,
                                            ) =>
                                                setSourceDivision(
                                                    option?.value ||
                                                    "",
                                                )
                                            }
                                            isClearable
                                            isSearchable
                                            isLoading={
                                                loadingMaster
                                            }
                                            placeholder="All divisions"
                                            styles={
                                                selectStyles
                                            }
                                        />
                                    </div>

                                    {/* QA */}

                                    <div>
                                        <label
                                            className={
                                                fieldClass
                                            }
                                        >
                                            QA Status
                                        </label>

                                        <Select
                                            options={
                                                qaOptions
                                            }
                                            value={
                                                qaOptions.find(
                                                    (
                                                        option,
                                                    ) =>
                                                        option.value ===
                                                        sourceQa,
                                                ) ||
                                                null
                                            }
                                            onChange={(
                                                option,
                                            ) =>
                                                setSourceQa(
                                                    option?.value ||
                                                    "",
                                                )
                                            }
                                            isClearable
                                            isSearchable
                                            isLoading={
                                                loadingMaster
                                            }
                                            placeholder="All QA"
                                            styles={
                                                selectStyles
                                            }
                                        />
                                    </div>

                                    {/* PALLET */}

                                    <div>
                                        <label
                                            className={fieldClass}
                                        >
                                            Pallet
                                        </label>

                                        <input
                                            value={sourcePallet}
                                            onChange={(e) =>
                                                setSourcePallet(
                                                    e.target.value,
                                                )
                                            }
                                            onKeyDown={(e) =>
                                                e.key === "Enter" &&
                                                fetchInventories(1)
                                            }
                                            className={inputClass}
                                            placeholder="Pallet"
                                        />
                                    </div>
                                </div>

                                <div className="mt-3 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch(
                                                "",
                                            );

                                            setItemCode(
                                                "",
                                            );

                                            setOwnerCode(
                                                "",
                                            );

                                            setSourceWhs(
                                                "",
                                            );

                                            setSourceLocation(
                                                "",
                                            );

                                            setSourceDivision(
                                                "",
                                            );

                                            setSourceQa(
                                                "",
                                            );

                                            setSourcePallet(
                                                "",
                                            );

                                            setInventories([]);
                                            setInventoryTotal(0);
                                            setInventoryTotalPages(0);
                                            setInventoryPage(1);
                                            setHasSearched(false);
                                            setExpandedId(null);
                                            setSelectedInventory(null);
                                            setSerials([]);
                                            setSelectedSerials(new Set());
                                        }}
                                        className="h-8 rounded-md border border-gray-300 bg-white px-4 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Clear
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            fetchInventories(1)
                                        }
                                        disabled={
                                            loadingInventories
                                        }
                                        className="h-8 rounded-md bg-gray-900 px-4 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                                    >
                                        Search Inventory
                                    </button>
                                </div>
                            </div>

                            {/* INVENTORY LIST */}

                            <div className="max-h-[calc(100vh-330px)] overflow-y-auto p-3">
                                {!hasSearched && !loadingInventories ? (
                                    <div className="py-16 text-center">
                                        <div className="text-sm font-medium text-gray-600">
                                            Inventory not loaded
                                        </div>
                                        <div className="mt-1 text-xs text-gray-400">
                                            Select a filter above, then click Search Inventory.
                                        </div>
                                    </div>
                                ) : !loadingInventories && inventories.length === 0 ? (
                                    <div className="py-16 text-center text-xs text-gray-400">
                                        No available inventory found for the selected filter.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {inventories.map(
                                            (
                                                inventory,
                                            ) => {
                                                const id =
                                                    getId(
                                                        inventory,
                                                    );

                                                const open =
                                                    expandedId ===
                                                    id;

                                                const selected =
                                                    selectedInventory
                                                        ? getId(
                                                            selectedInventory,
                                                        ) ===
                                                        id
                                                        : false;

                                                const serialMode =
                                                    inventory.change_mode ===
                                                    "serial";

                                                return (
                                                    <div
                                                        key={
                                                            id
                                                        }
                                                        className={`overflow-hidden rounded-lg border ${selected
                                                                ? "border-emerald-400"
                                                                : "border-gray-200"
                                                            }`}
                                                    >
                                                        {/* CARD HEADER */}

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                selectInventory(
                                                                    inventory,
                                                                )
                                                            }
                                                            className={`w-full px-3 py-3 text-left transition ${open
                                                                    ? "bg-emerald-50"
                                                                    : "bg-white hover:bg-gray-50"
                                                                }`}
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
                                                                            {
                                                                                inventory.item_code
                                                                            }
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

                                                                    <div className="mt-1 pl-6 text-xs font-medium text-gray-700">
                                                                        {inventory.product
                                                                            ?.item_name ||
                                                                            "-"}
                                                                    </div>

                                                                    <div className="mt-0.5 pl-6 text-[11px] text-gray-500">
                                                                        Model:{" "}
                                                                        {inventory
                                                                            .product
                                                                            ?.unit_model ||
                                                                            "-"}
                                                                    </div>

                                                                    <div className="mt-0.5 pl-6 text-[11px] text-gray-400">
                                                                        Barcode:{" "}
                                                                        {inventory
                                                                            .product
                                                                            ?.barcode ||
                                                                            inventory.barcode ||
                                                                            "-"}
                                                                    </div>

                                                                    <div className="mt-1 pl-6 text-xs text-gray-500">
                                                                        {
                                                                            inventory.owner_code
                                                                        }{" "}
                                                                        ·{" "}
                                                                        {
                                                                            inventory.whs_code
                                                                        }{" "}
                                                                        ·{" "}
                                                                        {
                                                                            inventory.location
                                                                        }{" "}
                                                                        ·{" "}
                                                                        {
                                                                            inventory.division_code
                                                                        }{" "}
                                                                        ·
                                                                        QA{" "}
                                                                        {
                                                                            inventory.qa_status
                                                                        }
                                                                    </div>

                                                                    <div className="mt-1 pl-6 text-[11px] text-gray-400">
                                                                        Lot{" "}
                                                                        {text(
                                                                            inventory.lot_number,
                                                                        )}{" "}
                                                                        ·
                                                                        Pallet{" "}
                                                                        {text(
                                                                            inventory.pallet,
                                                                        )}{" "}
                                                                        ·
                                                                        Carton{" "}
                                                                        {text(
                                                                            inventory.carton_number,
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="shrink-0 text-right">
                                                                    <div className="text-sm font-semibold text-gray-900">
                                                                        {formatQty(
                                                                            inventory.qty_available,
                                                                        )}
                                                                    </div>

                                                                    <div className="text-[10px] text-gray-400">
                                                                        {
                                                                            inventory.uom
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </button>

                                                        {/* EXPANDED SERIAL */}

                                                        {open &&
                                                            serialMode && (
                                                                <div className="border-t border-gray-200 bg-white p-3">
                                                                    <div className="mb-2 flex items-center justify-between">
                                                                        <div>
                                                                            <div className="text-xs font-semibold text-gray-800">
                                                                                Available
                                                                                Serial
                                                                            </div>

                                                                            <div className="text-[10px] text-gray-400">
                                                                                {
                                                                                    serials.length
                                                                                }{" "}
                                                                                serial(s)
                                                                                available
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex gap-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={
                                                                                    selectAllSerials
                                                                                }
                                                                                className="rounded border border-gray-300 px-2 py-1 text-[10px] text-gray-600 hover:bg-gray-50"
                                                                            >
                                                                                Select
                                                                                All
                                                                            </button>

                                                                            <button
                                                                                type="button"
                                                                                onClick={
                                                                                    clearAllSerials
                                                                                }
                                                                                className="rounded border border-gray-300 px-2 py-1 text-[10px] text-gray-600 hover:bg-gray-50"
                                                                            >
                                                                                Clear
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {loadingSerials ? (
                                                                        <div className="flex justify-center py-6">
                                                                            <Spinner />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="max-h-56 overflow-y-auto rounded border border-gray-200">
                                                                            {serials.map(
                                                                                (
                                                                                    serial,
                                                                                ) => {
                                                                                    const checked =
                                                                                        selectedSerials.has(
                                                                                            serial.serial_number,
                                                                                        );

                                                                                    return (
                                                                                        <label
                                                                                            key={
                                                                                                serial.serial_number
                                                                                            }
                                                                                            className={`flex cursor-pointer items-center justify-between border-b border-gray-100 px-3 py-2 last:border-b-0 ${checked
                                                                                                    ? "bg-emerald-50"
                                                                                                    : "hover:bg-gray-50"
                                                                                                }`}
                                                                                        >
                                                                                            <div className="flex items-center gap-2">
                                                                                                <input
                                                                                                    type="checkbox"
                                                                                                    checked={
                                                                                                        checked
                                                                                                    }
                                                                                                    onChange={() =>
                                                                                                        toggleSerial(
                                                                                                            serial.serial_number,
                                                                                                        )
                                                                                                    }
                                                                                                    className="h-3.5 w-3.5 rounded border-gray-300"
                                                                                                />

                                                                                                <span className="font-mono text-xs text-gray-800">
                                                                                                    {
                                                                                                        serial.serial_number
                                                                                                    }
                                                                                                </span>
                                                                                            </div>

                                                                                            <span className="text-[10px] text-gray-400">
                                                                                                Available{" "}
                                                                                                {formatQty(
                                                                                                    serial.qty_available,
                                                                                                )}
                                                                                            </span>
                                                                                        </label>
                                                                                    );
                                                                                },
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                )}
                            </div>

                            {hasSearched && inventoryTotalPages > 1 && (
                                <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2">
                                    <div className="text-[11px] text-gray-500">
                                        Page {inventoryPage} of {inventoryTotalPages}
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                fetchInventories(inventoryPage - 1)
                                            }
                                            disabled={
                                                loadingInventories ||
                                                inventoryPage <= 1
                                            }
                                            className="h-7 rounded border border-gray-300 bg-white px-2.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Previous
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                fetchInventories(inventoryPage + 1)
                                            }
                                            disabled={
                                                loadingInventories ||
                                                inventoryPage >= inventoryTotalPages
                                            }
                                            className="h-7 rounded border border-gray-300 bg-white px-2.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ====================================================== */}
                    {/* RIGHT PANEL */}
                    {/* ====================================================== */}

                    <div className="xl:col-span-4">
                        <div className="sticky top-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                            {/* HEADER */}

                            <div className="border-b border-gray-100 px-4 py-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-sm font-semibold text-gray-900">
                                            Change Item
                                        </h2>

                                        <p className="mt-1 text-xs text-gray-500">
                                            Change source
                                            item into
                                            another item
                                        </p>
                                    </div>

                                    {selectedInventory && (
                                        <button
                                            type="button"
                                            onClick={
                                                clearSelection
                                            }
                                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {!selectedInventory ? (
                                <div className="px-4 py-12 text-center">
                                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                                        <Search className="h-5 w-5 text-gray-400" />
                                    </div>

                                    <p className="text-xs text-gray-500">
                                        Select an inventory
                                        from the left panel
                                        to start Change
                                        Item.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4 p-4">
                                    {/* SOURCE ITEM */}

                                    <div>
                                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                            Source Item
                                        </div>

                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <div className="text-sm font-semibold text-gray-900">
                                                {
                                                    selectedInventory.item_code
                                                }
                                            </div>

                                            <div className="mt-1 text-xs font-medium text-gray-700">
                                                {selectedInventory
                                                    .product
                                                    ?.item_name ||
                                                    "-"}
                                            </div>

                                            <div className="mt-1 text-[11px] text-gray-500">
                                                Model:{" "}
                                                {selectedInventory
                                                    .product
                                                    ?.unit_model ||
                                                    "-"}
                                            </div>

                                            <div className="mt-1 text-[11px] text-gray-500">
                                                Barcode:{" "}
                                                {selectedInventory
                                                    .product
                                                    ?.barcode ||
                                                    selectedInventory.barcode ||
                                                    "-"}
                                            </div>

                                            <div className="mt-3 grid grid-cols-2 gap-2">
                                                <div>
                                                    <div className="text-[10px] text-gray-400">
                                                        Available
                                                    </div>

                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {formatQty(
                                                            selectedInventory.qty_available,
                                                        )}{" "}
                                                        {
                                                            selectedInventory.uom
                                                        }
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-[10px] text-gray-400">
                                                        Mode
                                                    </div>

                                                    <div className="text-xs font-semibold uppercase text-gray-700">
                                                        {
                                                            selectedInventory.change_mode
                                                        }
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 border-t border-gray-200 pt-2 text-[10px] text-gray-500">
                                                <div>
                                                    {
                                                        selectedInventory.whs_code
                                                    }{" "}
                                                    ·{" "}
                                                    {
                                                        selectedInventory.location
                                                    }
                                                </div>

                                                <div className="mt-0.5">
                                                    Division{" "}
                                                    {
                                                        selectedInventory.division_code
                                                    }{" "}
                                                    · QA{" "}
                                                    {
                                                        selectedInventory.qa_status
                                                    }
                                                </div>

                                                <div className="mt-0.5">
                                                    Pallet{" "}
                                                    {text(
                                                        selectedInventory.pallet,
                                                    )}{" "}
                                                    · Lot{" "}
                                                    {text(
                                                        selectedInventory.lot_number,
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ARROW */}

                                    <div className="flex justify-center">
                                        <div className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                            Change To
                                        </div>
                                    </div>

                                    {/* TARGET ITEM */}

                                    <div>
                                        <label
                                            className={
                                                fieldClass
                                            }
                                        >
                                            Target Item
                                        </label>

                                        <Select
                                            options={
                                                targetProductOptions
                                            }
                                            value={
                                                selectedTargetProduct
                                            }
                                            onChange={(
                                                option,
                                            ) =>
                                                setTargetItemId(
                                                    option
                                                        ? (
                                                            option as ProductOption
                                                        )
                                                            .itemId
                                                        : null,
                                                )
                                            }
                                            isClearable
                                            isSearchable
                                            isLoading={
                                                loadingMaster
                                            }
                                            placeholder="Select target item..."
                                            styles={
                                                selectStyles
                                            }
                                            formatOptionLabel={(
                                                option,
                                            ) => (
                                                <ProductOptionLabel
                                                    option={
                                                        option as ProductOption
                                                    }
                                                />
                                            )}
                                        />
                                    </div>

                                    {/* TARGET PREVIEW */}

                                    {selectedTargetProduct && (
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                            <div className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">
                                                Target Item
                                            </div>

                                            <div className="mt-1 text-sm font-semibold text-gray-900">
                                                {
                                                    selectedTargetProduct.itemCode
                                                }
                                            </div>

                                            <div className="mt-1 text-xs font-medium text-gray-700">
                                                {
                                                    selectedTargetProduct.itemName
                                                }
                                            </div>

                                            <div className="mt-1 text-[11px] text-gray-500">
                                                Model:{" "}
                                                {
                                                    selectedTargetProduct.unitModel
                                                }
                                            </div>

                                            <div className="mt-1 text-[11px] text-gray-500">
                                                Barcode:{" "}
                                                {
                                                    selectedTargetProduct.barcode
                                                }
                                            </div>

                                            <div className="mt-2 text-[10px] text-blue-600">
                                                Warehouse,
                                                location,
                                                pallet, lot,
                                                division and QA
                                                will remain the
                                                same.
                                            </div>
                                        </div>
                                    )}

                                    {/* QUANTITY */}

                                    {selectedInventory.change_mode ===
                                        "quantity" && (
                                            <div>
                                                <label
                                                    className={
                                                        fieldClass
                                                    }
                                                >
                                                    Quantity
                                                </label>

                                                <input
                                                    onWheel={(e) =>
                                                        e.currentTarget.blur()
                                                    }
                                                    type="number"
                                                    min="0"
                                                    max={selectedInventory.qty_available}
                                                    step="0.0001"
                                                    value={
                                                        qtyToChange
                                                    }
                                                    onChange={(
                                                        e,
                                                    ) =>
                                                        setQtyToChange(
                                                            e
                                                                .target
                                                                .value,
                                                        )
                                                    }
                                                    className={
                                                        inputClass
                                                    }
                                                    placeholder={`Max ${formatQty(
                                                        selectedInventory.qty_available,
                                                    )}`}
                                                />

                                                <div className="mt-1 text-[10px] text-gray-400">
                                                    Available:{" "}
                                                    {formatQty(
                                                        selectedInventory.qty_available,
                                                    )}{" "}
                                                    {
                                                        selectedInventory.uom
                                                    }
                                                </div>
                                            </div>
                                        )}

                                    {/* SERIAL */}

                                    {selectedInventory.change_mode ===
                                        "serial" && (
                                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                                                            Selected
                                                            Serial
                                                        </div>

                                                        <div className="mt-1 text-lg font-semibold text-emerald-800">
                                                            {
                                                                selectedSerials.size
                                                            }
                                                        </div>
                                                    </div>

                                                    <div className="text-right text-[10px] text-emerald-600">
                                                        serial(s)
                                                        selected
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    {/* REASON */}

                                    <div>
                                        <label
                                            className={
                                                fieldClass
                                            }
                                        >
                                            Reason
                                        </label>

                                        <textarea
                                            value={
                                                reason
                                            }
                                            onChange={(
                                                e,
                                            ) =>
                                                setReason(
                                                    e
                                                        .target
                                                        .value,
                                                )
                                            }
                                            rows={3}
                                            className="w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-xs outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
                                            placeholder="Reason for changing item..."
                                        />
                                    </div>

                                    {/* SUMMARY */}

                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                            Summary
                                        </div>

                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between gap-3">
                                                <span className="text-gray-500">
                                                    Source
                                                </span>

                                                <span className="font-medium text-gray-800">
                                                    {
                                                        selectedInventory.item_code
                                                    }
                                                </span>
                                            </div>

                                            <div className="flex justify-between gap-3">
                                                <span className="text-gray-500">
                                                    Target
                                                </span>

                                                <span className="font-medium text-gray-800">
                                                    {selectedTargetProduct?.itemCode ||
                                                        "-"}
                                                </span>
                                            </div>

                                            <div className="flex justify-between gap-3">
                                                <span className="text-gray-500">
                                                    Quantity
                                                </span>

                                                <span className="font-medium text-gray-800">
                                                    {selectedInventory.change_mode ===
                                                        "serial"
                                                        ? selectedSerials.size
                                                        : formatQty(
                                                            Number(
                                                                qtyToChange ||
                                                                0,
                                                            ),
                                                        )}
                                                </span>
                                            </div>

                                            <div className="flex justify-between gap-3">
                                                <span className="text-gray-500">
                                                    Location
                                                </span>

                                                <span className="font-medium text-gray-800">
                                                    {
                                                        selectedInventory.location
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SUBMIT */}

                                    <button
                                        type="button"
                                        onClick={
                                            submitChangeItem
                                        }
                                        disabled={
                                            !canSubmit ||
                                            submitting
                                        }
                                        className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-gray-900 px-4 text-xs font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {submitting ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 animate-spin" />

                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-4 w-4" />

                                                Confirm
                                                Change Item
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* CUSTOM CONFIRMATION MODAL */}
            {/* ============================================================ */}

            {showConfirmModal && selectedInventory && (
                <div
                    className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="change-item-confirm-title"
                >
                    <div className="w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
                        {/* MODAL HEADER */}
                        <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                                <AlertTriangle className="h-5 w-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <h3
                                    id="change-item-confirm-title"
                                    className="text-sm font-semibold text-gray-900"
                                >
                                    Confirm Change Item
                                </h3>
                                <p className="mt-0.5 text-xs text-gray-500">
                                    Please review the change before continuing.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                disabled={submitting}
                                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* SOURCE / TARGET */}
                        <div className="space-y-3 px-5 py-4">
                            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                                <div className="min-w-0 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                    <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                        Source
                                    </div>
                                    <div className="mt-1 truncate text-sm font-semibold text-gray-900">
                                        {selectedInventory.item_code}
                                    </div>
                                    <div className="mt-0.5 truncate text-[11px] text-gray-500">
                                        {selectedInventory.product?.item_name || "-"}
                                    </div>
                                </div>

                                <div className="text-xs font-semibold text-gray-300">
                                    →
                                </div>

                                <div className="min-w-0 rounded-lg border border-blue-200 bg-blue-50 p-3">
                                    <div className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">
                                        Target
                                    </div>
                                    <div className="mt-1 truncate text-sm font-semibold text-gray-900">
                                        {selectedTargetProduct?.itemCode || "-"}
                                    </div>
                                    <div className="mt-0.5 truncate text-[11px] text-gray-500">
                                        {selectedTargetProduct?.itemName || "-"}
                                    </div>
                                </div>
                            </div>

                            {/* DETAILS */}
                            <div className="rounded-lg border border-gray-200 bg-white">
                                <div className="grid grid-cols-2 divide-x divide-gray-200">
                                    <div className="p-3">
                                        <div className="text-[10px] text-gray-400">
                                            Change Mode
                                        </div>
                                        <div className="mt-1 text-xs font-semibold uppercase text-gray-800">
                                            {selectedInventory.change_mode}
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <div className="text-[10px] text-gray-400">
                                            Quantity
                                        </div>
                                        <div className="mt-1 text-xs font-semibold text-gray-800">
                                            {formatQty(confirmationQuantity)} {selectedInventory.uom}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 px-3 py-2.5 text-[11px] text-gray-500">
                                    <div className="flex justify-between gap-3">
                                        <span>Warehouse</span>
                                        <span className="font-medium text-gray-700">
                                            {text(selectedInventory.whs_code)}
                                        </span>
                                    </div>
                                    <div className="mt-1 flex justify-between gap-3">
                                        <span>Location</span>
                                        <span className="font-medium text-gray-700">
                                            {text(selectedInventory.location)}
                                        </span>
                                    </div>
                                    <div className="mt-1 flex justify-between gap-3">
                                        <span>Pallet</span>
                                        <span className="font-medium text-gray-700">
                                            {text(selectedInventory.pallet)}
                                        </span>
                                    </div>
                                    <div className="mt-1 flex justify-between gap-3">
                                        <span>Lot</span>
                                        <span className="font-medium text-gray-700">
                                            {text(selectedInventory.lot_number)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* WARNING */}
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                                <div className="flex gap-2">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                                    <div className="text-[11px] leading-4 text-amber-800">
                                        This action will change the source item while keeping the physical warehouse location, pallet, lot, division and QA status unchanged.
                                    </div>
                                </div>
                            </div>

                            {reason.trim() && (
                                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                                    <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                        Reason
                                    </div>
                                    <div className="mt-1 whitespace-pre-wrap text-[11px] leading-4 text-gray-700">
                                        {reason.trim()}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* MODAL FOOTER */}
                        <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3">
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                disabled={submitting}
                                className="h-9 rounded-md border border-gray-300 bg-white px-4 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={confirmChangeItem}
                                disabled={submitting}
                                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-gray-900 px-4 text-xs font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {submitting ? (
                                    <>
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-3.5 w-3.5" />
                                        Confirm Change
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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