/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { HeaderFormProps } from "@/types/inbound";
import dayjs from "dayjs";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";
import { ChevronDown, ChevronRight, Loader2, Search } from "lucide-react";
import InventoryModal from "./inventoryModal";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/router";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ItemReceivedFull {
    ID: string;
    item_code: string;
    barcode: string;
    serial_number: string;
    pallet?: string;
    location: string;
    whs_code: string;
    status: string;
    qa_status: string;
    quantity: number;
    created_at: string;
    uom?: string;
    product?: { item_name?: string; has_serial?: string };
    exp_date?: string;
    prod_date?: string;
    lot_number?: string;
    case_number?: string;
    carton_number?: string;
    item_model?: string;
    scan_type?: string;
    scan_data?: string;
}

interface PalletSummary {
    pallet: string;
    item_count: number;
    carton_count: number;
    total_qty: number;
    pending_count: number;
    in_stock_count: number;
}

interface CaseSummary {
    case_number: string;
    item_count: number;
    carton_count: number;
    total_qty: number;
    all_in_stock: number;
}

interface CartonSummary {
    carton_number: string;
    pallet: string;
    item_count: number;
    total_qty: number;
    all_in_stock: number;
}

interface MetaPagination {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
}

interface ItemScannedTableProps {
    headerForm: HeaderFormProps;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonRow = ({ cols }: { cols: number }) => (
    <TableRow>
        {Array.from({ length: cols }).map((_, i) => (
            <TableCell key={i}>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-full" />
            </TableCell>
        ))}
    </TableRow>
);

const SkeletonCard = () => (
    <div className="border rounded-lg p-4 space-y-2 animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
);

// ─── Status badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
    const color =
        status === "in stock"
            ? "bg-green-100 text-green-700"
            : status === "pending"
                ? "bg-orange-100 text-orange-700"
                : "bg-gray-100 text-gray-600";
    return (
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${color}`}>
            {status}
        </span>
    );
};

// ─── Tab definitions ──────────────────────────────────────────────────────────

type TabKey = "byItem" | "byPallet" | "byCarton" | "byCase";

const TABS: { key: TabKey; label: string }[] = [
    { key: "byItem", label: "By Item" },
    { key: "byPallet", label: "By Pallet" },
    { key: "byCarton", label: "By Carton" },
    { key: "byCase", label: "By Case" },
];

const ITEM_LIMIT = 100;
const CARTON_LIMIT = 50;

// ─── Main Component ───────────────────────────────────────────────────────────

const ItemScannedTable: React.FC<ItemScannedTableProps> = ({ headerForm }) => {
    const router = useRouter();
    const { no } = router.query;
    const inbound_no = Array.isArray(no) ? no[0] : no ?? "";

    // ── By Item state ──────────────────────────────────────────────────────────
    const [items, setItems] = useState<ItemReceivedFull[]>([]);
    const [meta, setMeta] = useState<MetaPagination>({ page: 1, limit: ITEM_LIMIT, total: 0, total_pages: 0 });
    const [loadingItems, setLoadingItems] = useState(false);
    const [page, setPage] = useState(1);

    // ── By Pallet state ────────────────────────────────────────────────────────
    const [palletSummaries, setPalletSummaries] = useState<PalletSummary[]>([]);
    const [palletItems, setPalletItems] = useState<Record<string, ItemReceivedFull[]>>({});
    const [loadingPallet, setLoadingPallet] = useState(false);
    const [loadingPalletItems, setLoadingPalletItems] = useState<Record<string, boolean>>({});
    const [expandedPallets, setExpandedPallets] = useState<Set<string>>(new Set());


    // ─── By Case state ────────────────────────────────────────────────────────
    const [caseSummaries, setCaseSummaries] = useState<CaseSummary[]>([]);
    const [caseMeta, setCaseMeta] = useState<MetaPagination>({
        page: 1,
        limit: 50,
        total: 0,
        total_pages: 0,
    });
    const [casePage, setCasePage] = useState(1);

    const [caseItems, setCaseItems] = useState<Record<string, ItemReceivedFull[]>>({});
    const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());
    const [loadingCase, setLoadingCase] = useState(false);
    const [loadingCaseItems, setLoadingCaseItems] = useState<Record<string, boolean>>({});


    // ── By Carton state ────────────────────────────────────────────────────────
    const [cartonSummaries, setCartonSummaries] = useState<CartonSummary[]>([]);
    const [cartonMeta, setCartonMeta] = useState<MetaPagination>({ page: 1, limit: CARTON_LIMIT, total: 0, total_pages: 0 });
    const [cartonPage, setCartonPage] = useState(1);
    const [loadingCarton, setLoadingCarton] = useState(false);
    const [cartonItems, setCartonItems] = useState<Record<string, ItemReceivedFull[]>>({});
    const [loadingCartonItems, setLoadingCartonItems] = useState<Record<string, boolean>>({});
    const [expandedCartons, setExpandedCartons] = useState<Set<string>>(new Set());

    // ── UI state ───────────────────────────────────────────────────────────────
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const [isPutawayLoading, setIsPutawayLoading] = useState(false);
    const [clicked, setClicked] = useState(false);
    const [showInventory, setShowInventory] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<TabKey>("byItem");

    // ── Fetch By Item ──────────────────────────────────────────────────────────
    const fetchItems = useCallback(async (p: number, search?: string) => {
        if (!inbound_no) return;
        setLoadingItems(true);
        try {
            const params = new URLSearchParams({ page: String(p), limit: String(ITEM_LIMIT) });
            if (search?.trim()) params.set("search", search.trim());
            const res = await api.get(`/inbound/${inbound_no}/received?${params}`);
            if (res.data.success) {
                setItems(res.data.data ?? []);
                setMeta(res.data.meta);
            }
        } catch (err) {
            console.error("Error fetching received items:", err);
        } finally {
            setLoadingItems(false);
        }
    }, [inbound_no]);

    // ── Fetch By Pallet summary ────────────────────────────────────────────────
    const fetchPalletSummaries = useCallback(async () => {
        if (!inbound_no) return;
        setLoadingPallet(true);
        try {
            const res = await api.get(`/inbound/${inbound_no}/received/pallet-summary`);
            if (res.data.success) setPalletSummaries(res.data.data ?? []);
        } catch (err) {
            console.error("Error fetching pallet summaries:", err);
        } finally {
            setLoadingPallet(false);
        }
    }, [inbound_no]);

    // ── Fetch items dalam 1 pallet saat expand ─────────────────────────────────
    const fetchPalletItems = useCallback(async (pallet: string) => {
        if (palletItems[pallet]) return;
        setLoadingPalletItems((prev) => ({ ...prev, [pallet]: true }));
        try {
            const res = await api.get(
                `/inbound/${inbound_no}/received?pallet=${encodeURIComponent(pallet)}&limit=9999`
            );
            if (res.data.success) {
                setPalletItems((prev) => ({ ...prev, [pallet]: res.data.data ?? [] }));
            }
        } catch (err) {
            console.error("Error fetching pallet items:", err);
        } finally {
            setLoadingPalletItems((prev) => ({ ...prev, [pallet]: false }));
        }
    }, [inbound_no, palletItems]);


    // ── Fetch By Case summary (paginated + search) ─────────────────────────────
    const fetchCaseSummaries = useCallback(async (p: number, search?: string) => {
        if (!inbound_no) return;

        setLoadingCase(true);

        try {
            const params = new URLSearchParams({
                page: String(p),
                limit: "50",
            });

            if (search?.trim()) {
                params.set("search", search.trim());
            }

            const res = await api.get(
                `/inbound/${inbound_no}/received/case-summary?${params}`
            );

            if (res.data.success) {
                setCaseSummaries(res.data.data ?? []);
                setCaseMeta(res.data.meta);
            }
        } catch (err) {
            console.error("Error fetching case summaries:", err);
        } finally {
            setLoadingCase(false);
        }
    }, [inbound_no]);

    // ── Fetch items dalam 1 case saat expand ─────────────────────────────────
    const fetchCaseItems = useCallback(async (caseNumber: string) => {
        if (caseItems[caseNumber]) return;

        setLoadingCaseItems((prev) => ({
            ...prev,
            [caseNumber]: true,
        }));

        try {
            const res = await api.get(
                `/inbound/${inbound_no}/received?case_number=${encodeURIComponent(caseNumber)}&limit=9999`
            );

            if (res.data.success) {
                setCaseItems((prev) => ({
                    ...prev,
                    [caseNumber]: res.data.data ?? [],
                }));
            }
        } catch (err) {
            console.error("Error fetching case items:", err);
        } finally {
            setLoadingCaseItems((prev) => ({
                ...prev,
                [caseNumber]: false,
            }));
        }
    }, [inbound_no, caseItems]);

    // ── Fetch By Carton summary (paginated + search) ───────────────────────────
    const fetchCartonSummaries = useCallback(async (p: number, search?: string) => {
        if (!inbound_no) return;
        setLoadingCarton(true);
        try {
            const params = new URLSearchParams({ page: String(p), limit: String(CARTON_LIMIT) });
            if (search?.trim()) params.set("search", search.trim());
            const res = await api.get(`/inbound/${inbound_no}/received/carton-summary?${params}`);
            if (res.data.success) {
                setCartonSummaries(res.data.data ?? []);
                setCartonMeta(res.data.meta);
            }
        } catch (err) {
            console.error("Error fetching carton summaries:", err);
        } finally {
            setLoadingCarton(false);
        }
    }, [inbound_no]);

    // ── Fetch items dalam 1 carton saat expand ─────────────────────────────────
    const fetchCartonItems = useCallback(async (carton: string) => {
        if (cartonItems[carton]) return;
        setLoadingCartonItems((prev) => ({ ...prev, [carton]: true }));
        try {
            const res = await api.get(
                `/inbound/${inbound_no}/received?carton_number=${encodeURIComponent(carton)}&limit=9999`
            );
            if (res.data.success) {
                setCartonItems((prev) => ({ ...prev, [carton]: res.data.data ?? [] }));
            }
        } catch (err) {
            console.error("Error fetching carton items:", err);
        } finally {
            setLoadingCartonItems((prev) => ({ ...prev, [carton]: false }));
        }
    }, [inbound_no, cartonItems]);



    // ── Initial load ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (!inbound_no) return;
        fetchItems(1);
    }, [inbound_no]);

    // ── Tab switch ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (activeTab === "byPallet" && palletSummaries.length === 0) {
            fetchPalletSummaries();
        }

        if (activeTab === "byCarton" && cartonSummaries.length === 0) {
            fetchCartonSummaries(1);
        }

        if (activeTab === "byCase" && caseSummaries.length === 0) {
            fetchCaseSummaries(1);
        }

        setSearchTerm("");
        setSelectedItems([]);
        setSelectAll(false);
    }, [activeTab]);

    // ── Refresh event ──────────────────────────────────────────────────────────
    useEffect(() => {
        const handleRefresh = () => {
            fetchItems(page, searchTerm);
            setPalletItems({});
            setCartonItems({});
            if (activeTab === "byPallet") fetchPalletSummaries();
            if (activeTab === "byCarton") fetchCartonSummaries(cartonPage, searchTerm);
            if (activeTab === "byCase") fetchCaseSummaries(casePage, searchTerm);
        };
        eventBus.on("refreshData", handleRefresh);
        return () => eventBus.off("refreshData", handleRefresh);
    }, [page, searchTerm, activeTab, cartonPage]);

    // ── Search debounce ────────────────────────────────────────────────────────
    useEffect(() => {
        if (activeTab === "byItem") {
            const t = setTimeout(() => { setPage(1); fetchItems(1, searchTerm); }, 400);
            return () => clearTimeout(t);
        }
        if (activeTab === "byCarton") {
            const t = setTimeout(() => { setCartonPage(1); fetchCartonSummaries(1, searchTerm); }, 400);
            return () => clearTimeout(t);
        }
        if (activeTab === "byCase") {
            const t = setTimeout(() => {
                fetchCaseSummaries(1, searchTerm);
            }, 400);

            return () => clearTimeout(t);
        }
    }, [searchTerm, activeTab]);

    // ── Toggle expand pallet ───────────────────────────────────────────────────
    const togglePallet = (pallet: string) => {
        setExpandedPallets((prev) => {
            const next = new Set(prev);
            if (next.has(pallet)) { next.delete(pallet); } else { next.add(pallet); fetchPalletItems(pallet); }
            return next;
        });
    };

    // ── Toggle expand case ───────────────────────────────────────────────────
    const toggleCase = (caseNumber: string) => {
        setExpandedCases((prev) => {
            const next = new Set(prev);

            if (next.has(caseNumber)) {
                next.delete(caseNumber);
            } else {
                next.add(caseNumber);
                fetchCaseItems(caseNumber);
            }

            return next;
        });
    };

    // ── Toggle expand carton ───────────────────────────────────────────────────
    const toggleCarton = (carton: string) => {
        setExpandedCartons((prev) => {
            const next = new Set(prev);
            if (next.has(carton)) { next.delete(carton); } else { next.add(carton); fetchCartonItems(carton); }
            return next;
        });
    };

    // ── Putaway helpers ────────────────────────────────────────────────────────
    const pendingItems = useMemo(() => items.filter((i) => i.status === "pending"), [items]);

    const toggleSelectAll = () => {
        const next = !selectAll;
        setSelectAll(next);
        setSelectedItems(next ? pendingItems.map((i) => String(i.ID)) : []);
    };

    const toggleSelectItem = (id: string) => {
        setSelectedItems((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };

    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) return;

        setIsDeleteLoading(true);

        try {
            const res = await api.delete("/inbound/barcodes", {
                data: {
                    ids: selectedItems,
                },
                withCredentials: true,
            });

            if (res.data.success === true) {
                eventBus.emit("showAlert", {
                    title: "Success!",
                    description: res.data.message,
                    type: "success",
                });

                setShowDeleteModal(false);
                setSelectedItems([]);
                setSelectAll(false);

                eventBus.emit("refreshData");
            }
        } catch (err: any) {
            eventBus.emit("showAlert", {
                title: "Error",
                description:
                    err.response?.data?.message ||
                    "Failed to delete selected items",
                type: "error",
            });
        } finally {
            setIsDeleteLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (clicked) return;
        setClicked(true);
        setIsPutawayLoading(true);
        try {
            const res = await api.post(`/inbound/putaway-bulk`, { item_ids: selectedItems }, { withCredentials: true });
            if (res.data.success === true) {
                eventBus.emit("showAlert", { title: "Success!", description: res.data.message, type: "success" });
                eventBus.emit("refreshData");
                setShowModal(false);
                setSelectedItems([]);
                setSelectAll(false);
            }
        } catch (err: any) {
            eventBus.emit("showAlert", { title: "Error", description: err.response?.data?.message || "An error occurred", type: "error" });
        } finally {
            setIsPutawayLoading(false);
            setClicked(false);
        }
    };

    const formatDate = (val?: string) => {
        if (!val) return "-";
        const d = dayjs(val);
        return d.isValid() ? d.format("DD/MM/YYYY") : "-";
    };

    // ── Filter pallet by search (client-side) ──────────────────────────────────
    const filteredPallets = useMemo(() => {
        if (!searchTerm.trim()) return palletSummaries;
        const t = searchTerm.toLowerCase();
        return palletSummaries.filter((p) => p.pallet.toLowerCase().includes(t));
    }, [palletSummaries, searchTerm]);

    const totalQty = useMemo(() => items.reduce((acc, i) => acc + Number(i.quantity), 0), [items]);

    // ── Pagination renderer (shared) ───────────────────────────────────────────
    const renderPagination = (
        currentPage: number,
        totalPages: number,
        total: number,
        loading: boolean,
        onPageChange: (p: number) => void
    ) => {
        if (totalPages <= 1) return null;
        const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
            .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
            }, []);
        return (
            <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-500">
                    Page {currentPage} / {totalPages} — {total} total
                </span>
                <div className="flex gap-1">
                    <Button size="sm" variant="outline" disabled={currentPage <= 1 || loading} onClick={() => onPageChange(currentPage - 1)}>
                        Prev
                    </Button>
                    {pages.map((p, i) =>
                        p === "..." ? (
                            <span key={`ellipsis-${i}`} className="px-2 py-1 text-xs text-gray-400">...</span>
                        ) : (
                            <Button
                                key={p}
                                size="sm"
                                variant={p === currentPage ? "default" : "outline"}
                                disabled={loading}
                                onClick={() => onPageChange(p as number)}
                            >
                                {p}
                            </Button>
                        )
                    )}
                    <Button size="sm" variant="outline" disabled={currentPage >= totalPages || loading} onClick={() => onPageChange(currentPage + 1)}>
                        Next
                    </Button>
                </div>
            </div>
        );
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <>
            <div className="space-y-4 mt-4 mb-4">

                {/* Header bar */}
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">
                        Received Items
                        {meta.total > 0 && (
                            <span className="ml-2 text-sm text-gray-400 font-normal">({meta.total} total)</span>
                        )}
                    </h2>
                    <div className="flex gap-2">
                        {selectedItems.length > 0 && (
                            <>
                                <Button
                                    variant="destructive"
                                    onClick={() => setShowDeleteModal(true)}
                                    disabled={isPutawayLoading || isDeleteLoading}
                                >
                                    Delete Selected ({selectedItems.length})
                                </Button>

                                <Button
                                    onClick={() => setShowModal(true)}
                                    disabled={isPutawayLoading || isDeleteLoading}
                                >
                                    {isPutawayLoading && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {isPutawayLoading
                                        ? "Processing..."
                                        : `Putaway Confirm (${selectedItems.length})`}
                                </Button>
                            </>
                        )}

                        {meta.total > 0 && (
                            <Button
                                variant="outline"
                                onClick={() => setShowInventory(true)}
                            >
                                View Inventory
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    {TABS.map((tab) => {
                        const count =
                            tab.key === "byItem"
                                ? meta.total
                                : tab.key === "byPallet"
                                    ? palletSummaries.length
                                    : tab.key === "byCarton"
                                        ? cartonMeta.total
                                        : caseMeta.total;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.key
                                    ? "border-b-2 border-blue-500 text-blue-600"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                {tab.label}
                                {count > 0 && (
                                    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder={
                            activeTab === "byItem"
                                ? "Search SKU, EAN, serial, pallet, carton..."
                                : activeTab === "byPallet"
                                    ? "Search pallet..."
                                    : activeTab === "byCarton"
                                        ? "Search carton, pallet..."
                                        : "Search case..."
                        }
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 text-sm"
                    />
                </div>

                {/* ══════════════════ BY ITEM TAB ══════════════════ */}
                {activeTab === "byItem" && (
                    <>
                        {loadingItems ? (
                            <Table className="border rounded-md text-sm">
                                <TableHeader>
                                    <TableRow>
                                        {Array.from({ length: 16 }).map((_, i) => (
                                            <TableHead key={i}><div className="h-3 bg-gray-200 rounded animate-pulse w-16" /></TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={16} />)}
                                </TableBody>
                            </Table>
                        ) : (
                            <>
                                <Table className="border rounded-md text-sm">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                {pendingItems.length > 0 && (
                                                    <Checkbox checked={selectAll} onCheckedChange={toggleSelectAll} />
                                                )}
                                            </TableHead>
                                            <TableHead>No</TableHead>
                                            {/* <TableHead>Item Code</TableHead> */}
                                            <TableHead>Item Name</TableHead>
                                            {/* <TableHead>Barcode / EAN</TableHead> */}
                                            <TableHead>Serial Number</TableHead>
                                            <TableHead>Pallet</TableHead>
                                            <TableHead>Case</TableHead>
                                            <TableHead>Carton</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Qty</TableHead>
                                            {/* <TableHead>UoM</TableHead> */}
                                            <TableHead>Lot Number</TableHead>
                                            <TableHead>Exp Date</TableHead>
                                            {/* <TableHead>Prod Date</TableHead> */}
                                            <TableHead>Created At</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="text-xs">
                                        {items.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={16} className="text-center py-8 text-gray-400">
                                                    No items found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            items.map((item, index) => (
                                                <TableRow key={item.ID}>
                                                    <TableCell>
                                                        {item.status === "pending" && (
                                                            <Checkbox
                                                                checked={selectedItems.includes(String(item.ID))}
                                                                onCheckedChange={() => toggleSelectItem(String(item.ID))}
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{(page - 1) * ITEM_LIMIT + index + 1}</TableCell>
                                                    {/* <TableCell className="font-mono">{item.item_code}</TableCell> */}
                                                    <TableCell>
                                                        SKU : {item.item_code} <br />
                                                        EAN : {item.barcode} <br />
                                                        {item.product?.item_name}
                                                    </TableCell>
                                                    {/* <TableCell>{item.barcode}</TableCell> */}
                                                    <TableCell className="font-mono">
                                                        {item.serial_number ? item.serial_number : "-"}
                                                    </TableCell>
                                                    <TableCell className="font-medium">{item.pallet || item.location || "-"}</TableCell>
                                                    <TableCell className="font-mono text-xs">{item.case_number || "-"}</TableCell>
                                                    <TableCell className="font-mono text-xs">{item.carton_number || "-"}</TableCell>
                                                    {/* <TableCell>{item.whs_code}</TableCell> */}
                                                    <TableCell><StatusBadge status={item.status} /></TableCell>
                                                    <TableCell>{item.quantity}</TableCell>
                                                    {/* <TableCell>{item.uom}</TableCell> */}
                                                    <TableCell>{item.lot_number || "-"}</TableCell>
                                                    <TableCell>{formatDate(item.exp_date)}</TableCell>
                                                    {/* <TableCell>{formatDate(item.prod_date)}</TableCell> */}
                                                    <TableCell>{dayjs(item.created_at).format("DD/MM/YYYY, HH:mm")}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-left font-semibold">
                                                Page {page} of {meta.total_pages} — {items.length} rows shown / {meta.total} total
                                            </TableCell>
                                            <TableCell className="font-bold">{totalQty}</TableCell>
                                            <TableCell colSpan={5} />
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                                {renderPagination(
                                    casePage,
                                    caseMeta.total_pages,
                                    caseMeta.total,
                                    loadingCase,
                                    (p) => {
                                        setCasePage(p);
                                        fetchCaseSummaries(p, searchTerm);
                                    }
                                )}
                            </>
                        )}
                    </>
                )}

                {/* ══════════════════ BY PALLET TAB ══════════════════ */}
                {activeTab === "byPallet" && (
                    <div className="space-y-2">
                        {loadingPallet ? (
                            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                        ) : filteredPallets.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">No pallet data found.</div>
                        ) : (
                            filteredPallets.map((summary) => {
                                const isExpanded = expandedPallets.has(summary.pallet);
                                const isLoadingExpand = loadingPalletItems[summary.pallet];
                                const expandedData = palletItems[summary.pallet];
                                return (
                                    <div key={summary.pallet} className="border rounded-lg overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => togglePallet(summary.pallet)}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                {isExpanded
                                                    ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                                                    : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                                                }
                                                <div>
                                                    <span className="font-semibold text-sm text-gray-800">
                                                        Pallet: {summary.pallet}
                                                    </span>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        {summary.item_count} items · {summary.carton_count} cartons · qty {summary.total_qty}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {summary.pending_count > 0 && (
                                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                                        {summary.pending_count} pending
                                                    </span>
                                                )}
                                                {summary.in_stock_count > 0 && (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                        {summary.in_stock_count} in stock
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                        {isExpanded && (
                                            <div className="overflow-x-auto">
                                                {isLoadingExpand ? (
                                                    <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-500">
                                                        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                                                    </div>
                                                ) : (
                                                    <table className="w-full text-xs border-t">
                                                        <thead className="bg-white">
                                                            <tr className="border-b">
                                                                <th className="px-3 py-2 text-left font-medium text-gray-500 w-8">#</th>
                                                                <th className="px-3 py-2 text-left font-medium text-gray-500">SKU</th>
                                                                <th className="px-3 py-2 text-left font-medium text-gray-500">Item Name</th>
                                                                <th className="px-3 py-2 text-left font-medium text-gray-500">Serial</th>
                                                                <th className="px-3 py-2 text-left font-medium text-gray-500">Carton</th>
                                                                <th className="px-3 py-2 text-left font-medium text-gray-500">Lot No</th>
                                                                <th className="px-3 py-2 text-left font-medium text-gray-500">Prod Date</th>
                                                                <th className="px-3 py-2 text-center font-medium text-gray-500">Qty</th>
                                                                <th className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {(expandedData ?? []).map((item, idx) => (
                                                                <tr key={item.ID} className="hover:bg-gray-50">
                                                                    <td className="px-3 py-1.5 text-gray-400">{idx + 1}</td>
                                                                    <td className="px-3 py-1.5 font-mono">{item.item_code}</td>
                                                                    <td className="px-3 py-1.5">{item.product?.item_name}</td>
                                                                    <td className="px-3 py-1.5 font-mono">{item.serial_number || "-"}</td>
                                                                    <td className="px-3 py-1.5 font-mono text-gray-500">{item.carton_number || "-"}</td>
                                                                    <td className="px-3 py-1.5">{item.lot_number || "-"}</td>
                                                                    <td className="px-3 py-1.5">{formatDate(item.prod_date)}</td>
                                                                    <td className="px-3 py-1.5 text-center">{item.quantity}</td>
                                                                    <td className="px-3 py-1.5"><StatusBadge status={item.status} /></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr className="border-t bg-gray-50">
                                                                <td colSpan={7} className="px-3 py-1.5 text-xs font-semibold text-gray-600">Total</td>
                                                                <td className="px-3 py-1.5 text-center text-xs font-bold">
                                                                    {(expandedData ?? []).reduce((s, i) => s + Number(i.quantity), 0)}
                                                                </td>
                                                                <td />
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* ══════════════════ BY CARTON TAB ══════════════════ */}
                {activeTab === "byCarton" && (
                    <div className="space-y-2">
                        {loadingCarton ? (
                            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                        ) : cartonSummaries.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">No carton data found.</div>
                        ) : (
                            <>
                                {cartonSummaries.map((summary) => {
                                    const isExpanded = expandedCartons.has(summary.carton_number);
                                    const isLoadingExpand = loadingCartonItems[summary.carton_number];
                                    const expandedData = cartonItems[summary.carton_number];
                                    return (
                                        <div
                                            key={summary.carton_number}
                                            className={`border rounded-lg overflow-hidden ${summary.all_in_stock === 1 ? "border-green-200" : "border-gray-200"}`}
                                        >
                                            {/* ── Card header / toggle button ── */}
                                            <button
                                                type="button"
                                                onClick={() => toggleCarton(summary.carton_number)}
                                                className={`w-full flex items-center justify-between px-4 py-3 transition-colors text-left ${summary.all_in_stock === 1
                                                    ? "bg-green-50 hover:bg-green-100"
                                                    : "bg-gray-50 hover:bg-gray-100"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {isExpanded
                                                        ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                                                        : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                                                    }
                                                    <div>
                                                        <span className="font-semibold text-sm font-mono text-gray-800">
                                                            {summary.carton_number}
                                                        </span>
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            {summary.item_count} items · qty {summary.total_qty}
                                                            {summary.pallet ? ` · Pallet: ${summary.pallet}` : ""}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${summary.all_in_stock === 1
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-orange-100 text-orange-700"
                                                    }`}>
                                                    {summary.all_in_stock === 1 ? "In Stock" : "Pending"}
                                                </span>
                                            </button>

                                            {/* ── Expanded detail table ── */}
                                            {isExpanded && (
                                                <div className="overflow-x-auto">
                                                    {isLoadingExpand ? (
                                                        <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-500">
                                                            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                                                        </div>
                                                    ) : (
                                                        <table className="w-full text-xs border-t">
                                                            <thead className="bg-white">
                                                                <tr className="border-b">
                                                                    <th className="px-3 py-2 text-left font-medium text-gray-500 w-8">#</th>
                                                                    <th className="px-3 py-2 text-left font-medium text-gray-500">Serial</th>
                                                                    <th className="px-3 py-2 text-left font-medium text-gray-500">SKU</th>
                                                                    <th className="px-3 py-2 text-left font-medium text-gray-500">Pallet</th>
                                                                    <th className="px-3 py-2 text-left font-medium text-gray-500">Lot No</th>
                                                                    <th className="px-3 py-2 text-left font-medium text-gray-500">Prod Date</th>
                                                                    <th className="px-3 py-2 text-center font-medium text-gray-500">Qty</th>
                                                                    <th className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {(expandedData ?? []).map((item, idx) => (
                                                                    <tr key={item.ID} className="hover:bg-gray-50">
                                                                        <td className="px-3 py-1.5 text-gray-400">{idx + 1}</td>
                                                                        <td className="px-3 py-1.5 font-mono">{item.serial_number || "-"}</td>
                                                                        <td className="px-3 py-1.5 font-mono">{item.item_code}</td>
                                                                        <td className="px-3 py-1.5 font-medium">{item.pallet || item.location || "-"}</td>
                                                                        <td className="px-3 py-1.5">{item.lot_number || "-"}</td>
                                                                        <td className="px-3 py-1.5">{formatDate(item.prod_date)}</td>
                                                                        <td className="px-3 py-1.5 text-center">{item.quantity}</td>
                                                                        <td className="px-3 py-1.5"><StatusBadge status={item.status} /></td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                            <tfoot>
                                                                <tr className="border-t bg-gray-50">
                                                                    <td colSpan={6} className="px-3 py-1.5 text-xs font-semibold text-gray-600">Total</td>
                                                                    <td className="px-3 py-1.5 text-center text-xs font-bold">
                                                                        {(expandedData ?? []).reduce((s, i) => s + Number(i.quantity), 0)}
                                                                    </td>
                                                                    <td />
                                                                </tr>
                                                            </tfoot>
                                                        </table>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* ── Pagination By Carton ── */}
                                {renderPagination(cartonPage, cartonMeta.total_pages, cartonMeta.total, loadingCarton, (p) => {
                                    setCartonPage(p);
                                    fetchCartonSummaries(p, searchTerm);
                                })}
                            </>
                        )}
                    </div>
                )}


                {/* ══════════════════ BY CASE TAB ══════════════════ */}
                {activeTab === "byCase" && (
                    <div className="space-y-2">
                        {loadingCase ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <SkeletonCard key={i} />
                            ))
                        ) : caseSummaries.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                No case data found.
                            </div>
                        ) : (
                            <>
                                {caseSummaries.map((summary) => {
                                    const isExpanded = expandedCases.has(summary.case_number);
                                    const isLoadingExpand =
                                        loadingCaseItems[summary.case_number];
                                    const expandedData =
                                        caseItems[summary.case_number];

                                    return (
                                        <div
                                            key={summary.case_number}
                                            className={`border rounded-lg overflow-hidden ${summary.all_in_stock === 1
                                                ? "border-green-200"
                                                : "border-gray-200"
                                                }`}
                                        >
                                            {/* ── Case header ── */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleCase(summary.case_number)
                                                }
                                                className={`w-full flex items-center justify-between px-4 py-3 transition-colors text-left ${summary.all_in_stock === 1
                                                    ? "bg-green-50 hover:bg-green-100"
                                                    : "bg-gray-50 hover:bg-gray-100"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {isExpanded ? (
                                                        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                                                    )}

                                                    <div>
                                                        <span className="font-semibold text-sm font-mono text-gray-800">
                                                            {summary.case_number}
                                                        </span>

                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            {summary.item_count} items
                                                            {" · "}
                                                            {summary.carton_count} cartons
                                                            {" · qty "}
                                                            {summary.total_qty}
                                                        </div>
                                                    </div>
                                                </div>

                                                <span
                                                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${summary.all_in_stock === 1
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-orange-100 text-orange-700"
                                                        }`}
                                                >
                                                    {summary.all_in_stock === 1
                                                        ? "In Stock"
                                                        : "Pending"}
                                                </span>
                                            </button>

                                            {/* ── Expanded Case detail ── */}
                                            {isExpanded && (
                                                <div className="overflow-x-auto">
                                                    {isLoadingExpand ? (
                                                        <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-500">
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Loading...
                                                        </div>
                                                    ) : (
                                                        <table className="w-full text-xs border-t">
                                                            <thead className="bg-white">
                                                                <tr className="border-b">
                                                                    <th className="px-3 py-2 text-left font-medium text-gray-500 w-8">
                                                                        #
                                                                    </th>
                                                                    <th className="px-3 py-2 text-left font-medium text-gray-500">
                                                                        Serial
                                                                    </th>
                                                                    <th className="px-3 py-2 text-left font-medium text-gray-500">
                                                                        SKU
                                                                    </th>
                                                                    <th className="px-3 py-2 text-left font-medium text-gray-500">
                                                                        Item Name
                                                                    </th>
                                                                    <th className="px-3 py-2 text-left font-medium text-gray-500">
                                                                        Carton
                                                                    </th>
                                                                    <th className="px-3 py-2 text-left font-medium text-gray-500">
                                                                        Pallet
                                                                    </th>
                                                                    <th className="px-3 py-2 text-left font-medium text-gray-500">
                                                                        Lot No
                                                                    </th>
                                                                    <th className="px-3 py-2 text-left font-medium text-gray-500">
                                                                        Prod Date
                                                                    </th>
                                                                    <th className="px-3 py-2 text-center font-medium text-gray-500">
                                                                        Qty
                                                                    </th>
                                                                    <th className="px-3 py-2 text-left font-medium text-gray-500">
                                                                        Status
                                                                    </th>
                                                                </tr>
                                                            </thead>

                                                            <tbody className="divide-y divide-gray-100">
                                                                {(expandedData ?? []).map(
                                                                    (item, idx) => (
                                                                        <tr
                                                                            key={item.ID}
                                                                            className="hover:bg-gray-50"
                                                                        >
                                                                            <td className="px-3 py-1.5 text-gray-400">
                                                                                {idx + 1}
                                                                            </td>

                                                                            <td className="px-3 py-1.5 font-mono">
                                                                                {item.serial_number ||
                                                                                    "-"}
                                                                            </td>

                                                                            <td className="px-3 py-1.5 font-mono">
                                                                                {item.item_code}
                                                                            </td>

                                                                            <td className="px-3 py-1.5">
                                                                                {
                                                                                    item.product
                                                                                        ?.item_name
                                                                                }
                                                                            </td>

                                                                            <td className="px-3 py-1.5 font-mono text-gray-500">
                                                                                {item.carton_number ||
                                                                                    "-"}
                                                                            </td>

                                                                            <td className="px-3 py-1.5 font-medium">
                                                                                {item.pallet ||
                                                                                    item.location ||
                                                                                    "-"}
                                                                            </td>

                                                                            <td className="px-3 py-1.5">
                                                                                {item.lot_number ||
                                                                                    "-"}
                                                                            </td>

                                                                            <td className="px-3 py-1.5">
                                                                                {formatDate(
                                                                                    item.prod_date
                                                                                )}
                                                                            </td>

                                                                            <td className="px-3 py-1.5 text-center">
                                                                                {item.quantity}
                                                                            </td>

                                                                            <td className="px-3 py-1.5">
                                                                                <StatusBadge
                                                                                    status={
                                                                                        item.status
                                                                                    }
                                                                                />
                                                                            </td>
                                                                        </tr>
                                                                    )
                                                                )}
                                                            </tbody>

                                                            <tfoot>
                                                                <tr className="border-t bg-gray-50">
                                                                    <td
                                                                        colSpan={8}
                                                                        className="px-3 py-1.5 text-xs font-semibold text-gray-600"
                                                                    >
                                                                        Total
                                                                    </td>

                                                                    <td className="px-3 py-1.5 text-center text-xs font-bold">
                                                                        {(
                                                                            expandedData ?? []
                                                                        ).reduce(
                                                                            (s, i) =>
                                                                                s +
                                                                                Number(
                                                                                    i.quantity
                                                                                ),
                                                                            0
                                                                        )}
                                                                    </td>

                                                                    <td />
                                                                </tr>
                                                            </tfoot>
                                                        </table>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* ── Pagination By Case ── */}
                                {renderPagination(
                                    caseMeta.page,
                                    caseMeta.total_pages,
                                    caseMeta.total,
                                    loadingCase,
                                    (p) => {
                                        fetchCaseSummaries(p, searchTerm);
                                        setCaseMeta((prev) => ({
                                            ...prev,
                                            page: p,
                                        }));
                                    }
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Putaway confirm modal */}
                <Dialog open={showModal} onOpenChange={setShowModal}>
                    <DialogContent className="sm:max-w-md bg-white">
                        <DialogHeader>
                            <DialogTitle>Putaway Confirmation</DialogTitle>
                        </DialogHeader>
                        <div className="text-sm text-muted-foreground">
                            Are you sure you want to putaway <strong>{selectedItems.length}</strong> item{selectedItems.length === 1 ? "" : "s"}?
                        </div>
                        <DialogFooter className="mt-4">
                            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button onClick={handleConfirm} disabled={isPutawayLoading}>
                                {isPutawayLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isPutawayLoading ? "Processing..." : "Confirm"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>


                <Dialog
                    open={showDeleteModal}
                    onOpenChange={setShowDeleteModal}
                >
                    <DialogContent className="sm:max-w-md bg-white">
                        <DialogHeader>
                            <DialogTitle>Delete Confirmation</DialogTitle>
                        </DialogHeader>

                        <div className="text-sm text-muted-foreground">
                            Are you sure you want to delete{" "}
                            <strong>{selectedItems.length}</strong>{" "}
                            selected item
                            {selectedItems.length === 1 ? "" : "s"}?
                        </div>

                        <DialogFooter className="mt-4">
                            <Button
                                variant="secondary"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleteLoading}
                            >
                                Cancel
                            </Button>

                            <Button
                                variant="destructive"
                                onClick={handleDeleteSelected}
                                disabled={isDeleteLoading}
                            >
                                {isDeleteLoading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {isDeleteLoading ? "Deleting..." : "Delete"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <InventoryModal onClose={() => setShowInventory(false)} isOpen={showInventory} />
        </>
    );
};

export default ItemScannedTable;