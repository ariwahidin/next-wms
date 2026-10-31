/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable react-hooks/exhaustive-deps */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import {
    AlertCircle,
    CheckCircle2,
    Circle,
    Clock,
    History,
    Loader2,
    PackageCheck,
    RefreshCw,
    ScanBarcode,
    Search,
    ShieldCheck,
    Trash2,
    Truck,
    XCircle,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import PageHeader from "@/components/mobile/PageHeader";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";

// ============================================================
// Types
// ============================================================

interface VerificationSummary {
    order_id: number;
    order_no: string;
    status: string;
    total_expected: number;
    total_scanned: number;
    total_pending: number;
    is_complete: boolean;
}

interface VerificationItem {
    order_detail_id: number;
    shipment_id: string;
    outbound_id: string;
    outbound_no: string;

    qty_koli: number;
    total_item: number;
    total_qty: number;

    deliv_to: string;
    deliv_to_name: string;

    is_scanned: boolean;
    scanned_by: string | null;
    scanned_at: string | null;
}

interface VerificationHistory {
    ID: number;
    order_no: string;
    shipment_id: string;
    order_detail_id: number;
    scanned_by: string;
    scanned_at: string;
    status: string;
    remarks: string;
}

interface VerificationResponse {
    summary: VerificationSummary;
    items: VerificationItem[];
}

// ============================================================
// Helpers
// ============================================================

const formatDate = (value?: string | null) => {
    if (!value) return "-";

    const date = new Date(value);

    if (isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

const getErrorMessage = (
    err: any,
    fallback: string
): string => {
    return err?.response?.data?.message ?? fallback;
};

const isConfirmed = (status?: string) => {
    return status?.toLowerCase() === "confirmed";
};

// ============================================================
// Status Badge
// ============================================================

const StatusBadge = ({
    status,
}: {
    status: string;
}) => {
    const confirmed = isConfirmed(status);

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${confirmed
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}
        >
            {confirmed ? (
                <CheckCircle2 size={13} />
            ) : (
                <Clock size={13} />
            )}

            {status.toUpperCase()}
        </span>
    );
};

// ============================================================
// Progress Bar
// ============================================================

const ProgressBar = ({
    scanned,
    expected,
}: {
    scanned: number;
    expected: number;
}) => {
    const percentage =
        expected > 0
            ? Math.min((scanned / expected) * 100, 100)
            : 0;

    const complete =
        expected > 0 && scanned >= expected;

    return (
        <div className="w-full">
            <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-gray-500">
                    Verification Progress
                </span>

                <span
                    className={`font-semibold ${complete
                            ? "text-green-600"
                            : "text-blue-600"
                        }`}
                >
                    {percentage.toFixed(0)}%
                </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${complete
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }`}
                    style={{
                        width: `${percentage}%`,
                    }}
                />
            </div>
        </div>
    );
};

// ============================================================
// Summary Card
// ============================================================

const SummaryCard = ({
    summary,
}: {
    summary: VerificationSummary;
}) => {
    return (
        <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-green-100 bg-green-50 p-2.5">
                <div className="mb-1 flex items-center gap-1.5 text-green-600">
                    <CheckCircle2 size={15} />
                    <span className="text-xs font-medium">
                        Verified
                    </span>
                </div>

                <div className="text-xl font-bold text-green-700">
                    {summary.total_scanned}
                </div>
            </div>

            <div className="rounded-lg border border-orange-100 bg-orange-50 p-2.5">
                <div className="mb-1 flex items-center gap-1.5 text-orange-600">
                    <Clock size={15} />
                    <span className="text-xs font-medium">
                        Pending
                    </span>
                </div>

                <div className="text-xl font-bold text-orange-700">
                    {summary.total_pending}
                </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-2.5">
                <div className="mb-1 flex items-center gap-1.5 text-blue-600">
                    <PackageCheck size={15} />
                    <span className="text-xs font-medium">
                        Expected
                    </span>
                </div>

                <div className="text-xl font-bold text-blue-700">
                    {summary.total_expected}
                </div>
            </div>
        </div>
    );
};

// ============================================================
// Toggle Switch
// ============================================================

const ToggleSwitch = ({
    checked,
    onChange,
    labelOff = "Pending",
    labelOn = "All",
}: {
    checked: boolean;
    onChange: (value: boolean) => void;
    labelOff?: string;
    labelOn?: string;
}) => {
    return (
        <div className="flex items-center gap-2 text-xs">
            <span
                className={
                    !checked
                        ? "font-semibold text-gray-800"
                        : "text-gray-400"
                }
            >
                {labelOff}
            </span>

            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-gray-300"
                    }`}
                aria-label="Toggle shipment filter"
            >
                <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked
                            ? "translate-x-[18px]"
                            : "translate-x-1"
                        }`}
                />
            </button>

            <span
                className={
                    checked
                        ? "font-semibold text-gray-800"
                        : "text-gray-400"
                }
            >
                {labelOn}
            </span>
        </div>
    );
};

// ============================================================
// Main Component
// ============================================================

const OutboundVerificationPage = () => {

    // --------------------------------------------------------
    // Refs
    // --------------------------------------------------------

    const spkInputRef = useRef<HTMLInputElement>(null);
    const shipmentInputRef = useRef<HTMLInputElement>(null);

    const scanLockRef = useRef(false);
    const confirmLockRef = useRef(false);

    // --------------------------------------------------------
    // SPK State
    // --------------------------------------------------------

    const [orderNoInput, setOrderNoInput] = useState("");
    const [activeOrderNo, setActiveOrderNo] = useState("");

    // --------------------------------------------------------
    // Verification State
    // --------------------------------------------------------

    const [summary, setSummary] =
        useState<VerificationSummary | null>(null);

    const [verificationItems, setVerificationItems] =
        useState<VerificationItem[]>([]);

    // --------------------------------------------------------
    // Scan State
    // --------------------------------------------------------

    const [shipmentInput, setShipmentInput] = useState("");
    const [isScanning, setIsScanning] = useState(false);

    // --------------------------------------------------------
    // Search / Filter
    // --------------------------------------------------------

    const [searchTerm, setSearchTerm] = useState("");
    const [showAll, setShowAll] = useState(false);

    // --------------------------------------------------------
    // History
    // --------------------------------------------------------

    const [showHistoryDialog, setShowHistoryDialog] =
        useState(false);

    const [scanHistory, setScanHistory] =
        useState<VerificationHistory[]>([]);

    const [isLoadingHistory, setIsLoadingHistory] =
        useState(false);

    // --------------------------------------------------------
    // UI State
    // --------------------------------------------------------

    const [isLoading, setIsLoading] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);

    const [showConfirmDialog, setShowConfirmDialog] =
        useState(false);

    const [shipmentToDelete, setShipmentToDelete] =
        useState<VerificationItem | null>(null);
    const [isDeletingShipment, setIsDeletingShipment] =
        useState(false);

    // ========================================================
    // Fetch Verification
    // ========================================================

    const fetchVerification = useCallback(
        async (orderNo: string) => {

            if (!orderNo.trim()) return false;

            setIsLoading(true);

            try {

                const res = await api.get(
                    `/mobile/outbound/verification/${encodeURIComponent(
                        orderNo
                    )}`,
                    {
                        withCredentials: true,
                    }
                );

                if (!res.data.success) {
                    throw new Error(
                        res.data.message ??
                        "Failed to retrieve verification"
                    );
                }

                const data: VerificationResponse =
                    res.data.data;

                setSummary(data.summary);
                setVerificationItems(data.items ?? []);

                setActiveOrderNo(data.summary.order_no);

                setOrderNoInput(data.summary.order_no);

                // Preserve the current list filter and search query.
                // Only refresh server-backed shipment data and progress.
                setShipmentInput("");

                return true;

            } catch (err: any) {

                eventBus.emit("showAlert", {
                    title: "Verification Error",
                    description: getErrorMessage(
                        err,
                        "Failed to retrieve SPK information"
                    ),
                    type: "error",
                });

                return false;

            } finally {

                setIsLoading(false);

            }

        },
        []
    );

    // ========================================================
    // Scan SPK
    // ========================================================

    const handleLoadSPK = async (
        e: FormEvent<HTMLFormElement>
    ) => {

        e.preventDefault();

        const orderNo = orderNoInput.trim();

        if (!orderNo) {
            spkInputRef.current?.focus();
            return;
        }

        if (isLoading || isScanning || isConfirming) return;

        const success = await fetchVerification(orderNo);

        if (success) {

            eventBus.emit("showAlert", {
                title: "SPK Loaded",
                description:
                    "SPK information retrieved successfully",
                type: "success",
            });

            setTimeout(() => {
                shipmentInputRef.current?.focus();
            }, 100);

        }

    };

    // ========================================================
    // Scan Shipment ID
    // ========================================================

    const handleScanShipment = async (
        e: FormEvent<HTMLFormElement>
    ) => {

        e.preventDefault();

        if (!activeOrderNo || !summary) return;

        if (scanLockRef.current || isConfirmed(summary.status)) {
            return;
        }

        const shipmentID = shipmentInput.trim();

        if (!shipmentID) {
            shipmentInputRef.current?.focus();
            return;
        }

        scanLockRef.current = true;
        setIsScanning(true);

        try {

            const res = await api.post(
                `/mobile/outbound/verification/${encodeURIComponent(
                    activeOrderNo
                )}/scan`,
                {
                    shipment_id: shipmentID,
                    remarks: "",
                },
                {
                    withCredentials: true,
                }
            );

            if (!res.data.success) {
                throw new Error(
                    res.data.message ?? "Shipment verification failed"
                );
            }

            const scannedShipmentID =
                res.data.data?.shipment_id ?? shipmentID;

            setShipmentInput("");

            eventBus.emit("showAlert", {
                title: "Shipment Verified",
                description: `${scannedShipmentID} has been verified successfully`,
                type: "success",
            });

            // Reload server-authoritative progress and item status.
            await fetchVerification(activeOrderNo);

            setTimeout(() => {
                shipmentInputRef.current?.focus();
            }, 100);

        } catch (err: any) {

            // eventBus.emit("showAlert", {
            //     title: "Scan Failed",
            //     description: getErrorMessage(
            //         err,
            //         "Unable to verify Shipment ID"
            //     ),
            //     type: "error",
            // });

            console.error(err);

            // setShipmentInput("");

            // setTimeout(() => {
            //     shipmentInputRef.current?.focus();
            // }, 100);

        } finally {

            scanLockRef.current = false;
            setIsScanning(false);

        }

    };

    // ========================================================
    // Refresh
    // ========================================================

    const handleRefresh = async () => {

        if (!activeOrderNo || isLoading || isScanning) return;

        await fetchVerification(activeOrderNo);

    };

    // ========================================================
    // Scan History
    // ========================================================

    const fetchScanHistory = async () => {

        if (!activeOrderNo) return;

        setIsLoadingHistory(true);

        try {

            const res = await api.get(
                `/mobile/outbound/verification/${encodeURIComponent(
                    activeOrderNo
                )}/history`,
                {
                    withCredentials: true,
                }
            );

            if (res.data.success) {
                setScanHistory(res.data.data ?? []);
            }

        } catch (err: any) {

            eventBus.emit("showAlert", {
                title: "History Error",
                description: getErrorMessage(
                    err,
                    "Failed to retrieve scan history"
                ),
                type: "error",
            });

        } finally {

            setIsLoadingHistory(false);

        }

    };

    const openHistoryDialog = () => {

        setShowHistoryDialog(true);
        setScanHistory([]);

        fetchScanHistory();

    };

    // ========================================================
    // Delete Shipment ID (Hard Delete)
    // ========================================================

    const handleDeleteShipment = async () => {
        if (!activeOrderNo || !shipmentToDelete || isOrderConfirmed) return;
        if (isDeletingShipment) return;

        setIsDeletingShipment(true);

        try {
            const res = await api.delete(
                `/mobile/outbound/verification/${encodeURIComponent(
                    activeOrderNo
                )}/shipments/${shipmentToDelete.order_detail_id}`,
                {
                    withCredentials: true,
                }
            );

            if (!res.data.success) {
                throw new Error(
                    res.data.message ?? "Failed to delete Shipment ID"
                );
            }

            const deletedShipmentID = shipmentToDelete.shipment_id;
            setShipmentToDelete(null);

            eventBus.emit("showAlert", {
                title: "Shipment Deleted",
                description: `${deletedShipmentID} has been permanently deleted`,
                type: "success",
            });

            await fetchVerification(activeOrderNo);

            if (showHistoryDialog) {
                await fetchScanHistory();
            }
        } catch (err: any) {
            eventBus.emit("showAlert", {
                title: "Delete Failed",
                description: getErrorMessage(
                    err,
                    "Unable to delete Shipment ID"
                ),
                type: "error",
            });
        } finally {
            setIsDeletingShipment(false);
        }
    };

    // ========================================================
    // Confirm Verification
    // ========================================================

    const handleConfirmVerification = async () => {

        if (!activeOrderNo || !summary) return;

        if (confirmLockRef.current) return;

        if (
            !summary.is_complete ||
            summary.total_expected === 0 ||
            summary.status.toLowerCase() !== "open"
        ) {
            return;
        }

        confirmLockRef.current = true;
        setIsConfirming(true);

        try {

            const res = await api.post(
                `/mobile/outbound/verification/${encodeURIComponent(
                    activeOrderNo
                )}/confirm`,
                {},
                {
                    withCredentials: true,
                }
            );

            if (!res.data.success) {
                throw new Error(
                    res.data.message ??
                    "Verification confirmation failed"
                );
            }

            setShowConfirmDialog(false);

            eventBus.emit("showAlert", {
                title: "Verification Confirmed",
                description:
                    "SPK has been successfully confirmed",
                type: "success",
            });

            // Reload the final server status.
            await fetchVerification(activeOrderNo);

            setShipmentInput("");

        } catch (err: any) {

            // eventBus.emit("showAlert", {
            //     title: "Confirmation Failed",
            //     description: getErrorMessage(
            //         err,
            //         "Unable to confirm verification"
            //     ),
            //     type: "error",
            // });

            console.error(err);

        } finally {

            confirmLockRef.current = false;
            setIsConfirming(false);

        }

    };

    // ========================================================
    // Derived Data
    // ========================================================

    const allComplete =
        summary?.is_complete ?? false;

    const isOrderConfirmed =
        isConfirmed(summary?.status);

    const filteredItems = useMemo(() => {

        return verificationItems.filter((item) => {

            if (!showAll && item.is_scanned) {
                return false;
            }

            if (!searchTerm.trim()) {
                return true;
            }

            const term = searchTerm.toLowerCase();

            return (
                item.shipment_id.toLowerCase().includes(term) ||
                item.outbound_no.toLowerCase().includes(term) ||
                item.deliv_to.toLowerCase().includes(term) ||
                item.deliv_to_name.toLowerCase().includes(term)
            );

        });

    }, [verificationItems, searchTerm, showAll]);

    // ========================================================
    // Initial Focus
    // ========================================================

    useEffect(() => {

        const timer = setTimeout(() => {
            spkInputRef.current?.focus();
        }, 300);

        return () => clearTimeout(timer);

    }, []);

    // ========================================================
    // Render
    // ========================================================

    return (
        <>
            <PageHeader
                title="Outbound Loading Verification"
                showBackButton
            />

            <div className="mx-auto min-h-screen max-w-md space-y-3 bg-gray-50 p-3 pb-28">

                {/* ================================================== */}
                {/* STEP 1 - SPK SCANNING */}
                {/* ================================================== */}

                <Card>
                    <CardContent className="space-y-2.5 p-3">

                        <div className="flex items-center justify-between">

                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                    <ScanBarcode size={19} />
                                </div>

                                <div>
                                    <div className="text-xs font-semibold text-gray-800">
                                        Step 1 — Scan SPK
                                    </div>

                                    <div className="text-xs text-gray-400">
                                        Scan the order barcode
                                    </div>
                                </div>
                            </div>

                            {summary && (
                                <StatusBadge status={summary.status} />
                            )}

                        </div>

                        <form
                            onSubmit={handleLoadSPK}
                            className="space-y-2"
                        >

                            <div className="relative">

                                <Input
                                    ref={spkInputRef}
                                    id="spk-verification"
                                    autoComplete="off"
                                    placeholder="Scan SPK / Order Number..."
                                    value={orderNoInput}
                                    onChange={(e) =>
                                        setOrderNoInput(e.target.value)
                                    }
                                    disabled={isLoading || isScanning}
                                    className="h-9 pr-10 text-xs font-mono"
                                />

                                {orderNoInput && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOrderNoInput("");
                                            spkInputRef.current?.focus();
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <XCircle size={17} />
                                    </button>
                                )}

                            </div>

                            <Button
                                type="submit"
                                className="h-9 w-full"
                                disabled={
                                    isLoading ||
                                    !orderNoInput.trim()
                                }
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2
                                            size={16}
                                            className="mr-2 animate-spin"
                                        />
                                        Loading SPK...
                                    </>
                                ) : (
                                    <>
                                        <ScanBarcode
                                            size={16}
                                            className="mr-2"
                                        />
                                        Load SPK
                                    </>
                                )}
                            </Button>

                        </form>

                    </CardContent>
                </Card>

                {/* ================================================== */}
                {/* LOADING STATE */}
                {/* ================================================== */}

                {isLoading && !summary && (
                    <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-12 text-gray-400">
                        <Loader2
                            size={28}
                            className="mb-3 animate-spin"
                        />

                        <span className="text-sm">
                            Retrieving SPK information...
                        </span>
                    </div>
                )}

                {/* ================================================== */}
                {/* VERIFICATION CONTENT */}
                {/* ================================================== */}

                {summary && (

                    <>

                        {/* ========================================== */}
                        {/* ORDER INFORMATION */}
                        {/* ========================================== */}

                        <Card>
                            <CardContent className="space-y-2.5 p-3">

                                <div className="flex items-center justify-between">

                                    <div className="flex items-center gap-2">
                                        <Truck
                                            size={18}
                                            className="text-gray-500"
                                        />

                                        <span className="text-xs font-semibold text-gray-800">
                                            SPK Information
                                        </span>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={handleRefresh}
                                        disabled={isLoading || isScanning}
                                    >
                                        <RefreshCw
                                            size={15}
                                            className={
                                                isLoading
                                                    ? "animate-spin"
                                                    : ""
                                            }
                                        />
                                    </Button>

                                </div>

                                <div className="rounded-lg border bg-gray-50 p-3">

                                    <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">
                                        Order Number
                                    </div>

                                    <div className="break-all font-mono text-xs font-bold text-gray-800">
                                        {summary.order_no}
                                    </div>

                                    <div className="mt-2 flex items-center justify-between border-t pt-2">
                                        <span className="text-xs text-gray-500">
                                            Order ID
                                        </span>

                                        <span className="text-xs font-semibold text-gray-700">
                                            {summary.order_id}
                                        </span>
                                    </div>

                                </div>

                                {isOrderConfirmed && (
                                    <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-green-700">

                                        <ShieldCheck
                                            size={18}
                                            className="mt-0.5 shrink-0"
                                        />

                                        <div>
                                            <div className="text-xs font-semibold">
                                                Verification Confirmed
                                            </div>

                                            <div className="mt-0.5 text-xs">
                                                This SPK has been successfully verified and confirmed. Further scanning is disabled.
                                            </div>
                                        </div>

                                    </div>
                                )}

                            </CardContent>
                        </Card>

                        {/* ========================================== */}
                        {/* VERIFICATION SUMMARY */}
                        {/* ========================================== */}

                        <Card>
                            <CardContent className="space-y-3 p-3">

                                <div className="flex items-center justify-between">

                                    <div className="text-xs font-semibold text-gray-800">
                                        Verification Summary
                                    </div>

                                    {allComplete && (
                                        <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                                            <CheckCircle2 size={14} />
                                            All Verified
                                        </span>
                                    )}

                                </div>

                                <SummaryCard summary={summary} />

                                <ProgressBar
                                    scanned={summary.total_scanned}
                                    expected={summary.total_expected}
                                />

                            </CardContent>
                        </Card>

                        {/* ========================================== */}
                        {/* STEP 2 - SHIPMENT SCANNING */}
                        {/* ========================================== */}

                        <Card>
                            <CardContent className="space-y-2.5 p-3">

                                <div className="flex items-center justify-between">

                                    <div className="flex items-center gap-2">

                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                                            <ScanBarcode size={19} />
                                        </div>

                                        <div>
                                            <div className="text-xs font-semibold text-gray-800">
                                                Step 2 — Scan Shipment
                                            </div>

                                            <div className="text-xs text-gray-400">
                                                Scan each Shipment ID
                                            </div>
                                        </div>

                                    </div>

                                    {isOrderConfirmed && (
                                        <span className="text-xs font-semibold text-green-600">
                                            Locked
                                        </span>
                                    )}

                                </div>

                                {!isOrderConfirmed && !allComplete && (
                                    <form
                                        onSubmit={handleScanShipment}
                                        className="space-y-2"
                                    >

                                        <div className="relative">

                                            <Input
                                                ref={shipmentInputRef}
                                                id="shipment-verification"
                                                autoComplete="off"
                                                placeholder="Scan Shipment ID..."
                                                value={shipmentInput}
                                                onChange={(e) =>
                                                    setShipmentInput(
                                                        e.target.value
                                                    )
                                                }
                                                disabled={
                                                    isScanning ||
                                                    isConfirming
                                                }
                                                className="h-10 pr-10 font-mono text-xs"
                                            />

                                            {shipmentInput && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShipmentInput("");
                                                        shipmentInputRef.current?.focus();
                                                    }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                                >
                                                    <XCircle size={17} />
                                                </button>
                                            )}

                                        </div>

                                        <Button
                                            type="submit"
                                            className="h-9 w-full"
                                            disabled={
                                                isScanning ||
                                                !shipmentInput.trim()
                                            }
                                        >
                                            {isScanning ? (
                                                <>
                                                    <Loader2
                                                        size={16}
                                                        className="mr-2 animate-spin"
                                                    />
                                                    Verifying Shipment...
                                                </>
                                            ) : (
                                                <>
                                                    <ScanBarcode
                                                        size={16}
                                                        className="mr-2"
                                                    />
                                                    Verify Shipment
                                                </>
                                            )}
                                        </Button>

                                    </form>
                                )}

                                {allComplete && !isOrderConfirmed && (
                                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">

                                        <div className="flex items-center gap-2 text-xs font-semibold text-green-700">
                                            <CheckCircle2 size={18} />
                                            All Shipments Verified
                                        </div>

                                        <p className="mt-1 text-xs text-green-600">
                                            All expected Shipment IDs have been scanned. You can now confirm this SPK.
                                        </p>

                                    </div>
                                )}

                                {isOrderConfirmed && (
                                    <div className="rounded-lg border bg-gray-50 p-3 text-center text-xs text-gray-500">
                                        Shipment scanning is disabled because this SPK has already been confirmed.
                                    </div>
                                )}

                            </CardContent>
                        </Card>

                        {/* ========================================== */}
                        {/* SHIPMENT LIST */}
                        {/* ========================================== */}

                        <Card>
                            <CardContent className="space-y-2.5 p-3">

                                <div className="flex items-center justify-between">

                                    <div className="flex items-center gap-2">
                                        <PackageCheck
                                            size={18}
                                            className="text-gray-500"
                                        />

                                        <span className="text-xs font-semibold text-gray-800">
                                            Shipment List
                                        </span>
                                    </div>

                                    <ToggleSwitch
                                        checked={showAll}
                                        onChange={setShowAll}
                                        labelOff="Pending"
                                        labelOn="All"
                                    />

                                </div>

                                <div className="relative">

                                    <Search
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    />

                                    <Input
                                        placeholder="Search Shipment ID / Outbound..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className="h-9 pl-9 text-xs"
                                    />

                                </div>

                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <span>
                                        {filteredItems.length} shipments displayed
                                    </span>

                                    <span>
                                        {verificationItems.length} total
                                    </span>
                                </div>

                                {filteredItems.length === 0 ? (

                                    <div className="flex flex-col items-center justify-center py-8 text-center">

                                        {verificationItems.length === 0 ? (
                                            <>
                                                <AlertCircle
                                                    size={28}
                                                    className="mb-2 text-orange-400"
                                                />

                                                <p className="text-sm font-medium text-gray-600">
                                                    No Shipments Found
                                                </p>

                                                <p className="mt-1 text-xs text-gray-400">
                                                    This SPK does not contain any Shipment IDs.
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <Search
                                                    size={25}
                                                    className="mb-2 text-gray-300"
                                                />

                                                <p className="text-sm text-gray-500">
                                                    No matching shipments found
                                                </p>
                                            </>
                                        )}

                                    </div>

                                ) : (

                                    <div className="space-y-2">

                                        {filteredItems.map((item) => (

                                            <div
                                                key={item.order_detail_id}
                                                className={`rounded-md border p-2.5 transition-colors ${item.is_scanned
                                                        ? "border-green-200 bg-green-50/60"
                                                        : "border-gray-200 bg-white"
                                                    }`}
                                            >

                                                <div className="flex items-start justify-between gap-2">

                                                    <div className="min-w-0 flex-1 space-y-1">

                                                        <div className="break-all font-mono text-xs font-bold text-gray-800">
                                                            {item.shipment_id}
                                                        </div>

                                                        <div className="text-xs text-gray-500">
                                                            Outbound:{" "}
                                                            <span className="font-medium text-gray-700">
                                                                {item.outbound_no || "-"}
                                                            </span>
                                                        </div>

                                                        {item.deliv_to_name && (
                                                            <div className="truncate text-xs text-gray-500">
                                                                Delivery To:{" "}
                                                                <span className="font-medium text-gray-700">
                                                                    {item.deliv_to_name}
                                                                </span>
                                                            </div>
                                                        )}

                                                        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[11px] text-gray-400">
                                                            <span>
                                                                Koli: {item.qty_koli}
                                                            </span>

                                                            <span>
                                                                Items: {item.total_item}
                                                            </span>

                                                            <span>
                                                                Qty: {item.total_qty}
                                                            </span>
                                                        </div>

                                                    </div>

                                                    <div className="flex shrink-0 flex-col items-end gap-2">

                                                        {item.is_scanned ? (
                                                            <div className="flex flex-col items-end gap-1">
                                                                <CheckCircle2
                                                                    size={18}
                                                                    className="text-green-600"
                                                                />

                                                                <span className="text-[10px] font-semibold text-green-600">
                                                                    VERIFIED
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-end gap-1">
                                                                <Circle
                                                                    size={18}
                                                                    className="text-gray-300"
                                                                />

                                                                <span className="text-[10px] font-semibold text-gray-400">
                                                                    PENDING
                                                                </span>
                                                            </div>
                                                        )}

                                                        {!isOrderConfirmed && item.is_scanned && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600"
                                                                title="Delete Verified Shipment"
                                                                disabled={isDeletingShipment || isScanning || isConfirming}
                                                                onClick={() => setShipmentToDelete(item)}
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        )}

                                                    </div>

                                                </div>

                                                {item.is_scanned && item.scanned_at && (
                                                    <div className="mt-2 border-t border-green-100 pt-2 text-[10px] text-green-700">
                                                        <Clock
                                                            size={11}
                                                            className="mr-1 inline"
                                                        />

                                                        Scanned: {formatDate(item.scanned_at)}

                                                        {item.scanned_by && (
                                                            <span className="ml-2">
                                                                By: {item.scanned_by}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                            </div>

                                        ))}

                                    </div>

                                )}

                            </CardContent>
                        </Card>

                        {/* ========================================== */}
                        {/* SCAN HISTORY */}
                        {/* ========================================== */}

                        <Button
                            type="button"
                            variant="outline"
                            className="h-9 w-full bg-white"
                            onClick={openHistoryDialog}
                        >
                            <History
                                size={16}
                                className="mr-2"
                            />

                            View Scan History
                        </Button>

                    </>
                )}

            </div>

            {/* ================================================== */}
            {/* FIXED BOTTOM CONFIRMATION BAR */}
            {/* ================================================== */}

            {summary && (

                <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">

                    <div className="mx-auto max-w-md space-y-2">

                        {!isOrderConfirmed ? (

                            <>

                                <Button
                                    type="button"
                                    className={`h-9 w-full font-semibold ${allComplete
                                            ? "bg-green-600 text-white hover:bg-green-700"
                                            : "bg-gray-200 text-gray-500 hover:bg-gray-200"
                                        }`}
                                    disabled={
                                        !allComplete ||
                                        isConfirming ||
                                        isLoading ||
                                        isScanning
                                    }
                                    onClick={() =>
                                        setShowConfirmDialog(true)
                                    }
                                >

                                    {isConfirming ? (
                                        <>
                                            <Loader2
                                                size={17}
                                                className="mr-2 animate-spin"
                                            />

                                            Confirming...
                                        </>
                                    ) : allComplete ? (
                                        <>
                                            <ShieldCheck
                                                size={18}
                                                className="mr-2"
                                            />

                                            Confirm Verification
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle
                                                size={17}
                                                className="mr-2"
                                            />

                                            {summary.total_pending} Shipments Pending
                                        </>
                                    )}

                                </Button>

                                <p className="text-center text-[10px] text-gray-400">
                                    All shipments must be verified before confirmation.
                                </p>

                            </>

                        ) : (

                            <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 py-3 text-xs font-semibold text-green-700">
                                <CheckCircle2 size={18} />
                                Verification Successfully Confirmed
                            </div>

                        )}

                    </div>

                </div>

            )}

            {/* ================================================== */}
            {/* DELETE SHIPMENT DIALOG */}
            {/* ================================================== */}

            <Dialog
                open={!!shipmentToDelete}
                onOpenChange={(open) => {
                    if (!open && !isDeletingShipment) {
                        setShipmentToDelete(null);
                    }
                }}
            >
                <DialogContent className="max-w-sm bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-sm">
                            <Trash2 size={17} className="text-red-600" />
                            Delete Shipment ID
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 text-xs">
                        <p className="text-gray-600">
                            Are you sure you want to permanently delete this verified Shipment ID?
                        </p>

                        <div className="rounded-md border border-red-200 bg-red-50 p-3">
                            <div className="break-all font-mono text-xs font-semibold text-gray-800">
                                {shipmentToDelete?.shipment_id}
                            </div>
                            <p className="mt-1 text-[11px] text-red-600">
                                The shipment record and its verification scan record will be permanently deleted.
                            </p>
                        </div>

                        <p className="text-[11px] text-gray-500">
                            This action cannot be undone. The SPK progress will be recalculated after deletion.
                        </p>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled={isDeletingShipment}
                            onClick={() => setShipmentToDelete(null)}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            size="sm"
                            className="flex-1 bg-red-600 text-white hover:bg-red-700"
                            disabled={isDeletingShipment}
                            onClick={handleDeleteShipment}
                        >
                            {isDeletingShipment ? (
                                <>
                                    <Loader2 size={14} className="mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 size={14} className="mr-2" />
                                    Delete Permanently
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ================================================== */}
            {/* CONFIRMATION DIALOG */}
            {/* ================================================== */}

            <Dialog
                open={showConfirmDialog}
                onOpenChange={(open) => {
                    if (!isConfirming) {
                        setShowConfirmDialog(open);
                    }
                }}
            >

                <DialogContent className="max-w-md bg-white">

                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldCheck
                                size={20}
                                className="text-green-600"
                            />

                            Confirm Verification
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">

                        <div className="rounded-lg border border-green-200 bg-green-50 p-3">

                            <div className="flex items-center gap-2 text-xs font-semibold text-green-700">
                                <CheckCircle2 size={18} />
                                All Shipments Verified
                            </div>

                            <p className="mt-1 text-xs text-green-600">
                                All expected Shipment IDs have been successfully scanned.
                            </p>

                        </div>

                        <div className="space-y-2 rounded-md border p-2.5 text-sm">

                            <div className="flex justify-between gap-3">
                                <span className="text-gray-500">
                                    SPK Number
                                </span>

                                <span className="break-all text-right font-semibold">
                                    {summary?.order_no}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-500">
                                    Expected Shipments
                                </span>

                                <span className="font-semibold">
                                    {summary?.total_expected}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-500">
                                    Verified Shipments
                                </span>

                                <span className="font-semibold text-green-600">
                                    {summary?.total_scanned}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-500">
                                    Pending Shipments
                                </span>

                                <span className="font-semibold">
                                    {summary?.total_pending}
                                </span>
                            </div>

                            <div className="flex justify-between border-t pt-2">
                                <span className="text-gray-500">
                                    New Status
                                </span>

                                <span className="font-bold text-green-600">
                                    CONFIRMED
                                </span>
                            </div>

                        </div>

                        <div className="rounded-lg bg-orange-50 p-3 text-xs text-orange-700">
                            <AlertCircle
                                size={15}
                                className="mr-1 inline"
                            />

                            This action cannot be undone. The SPK will be marked as confirmed.
                        </div>

                    </div>

                    <DialogFooter className="flex gap-2">

                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            disabled={isConfirming}
                            onClick={() =>
                                setShowConfirmDialog(false)
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            disabled={isConfirming}
                            onClick={handleConfirmVerification}
                        >
                            {isConfirming ? (
                                <>
                                    <Loader2
                                        size={15}
                                        className="mr-2 animate-spin"
                                    />
                                    Confirming...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck
                                        size={16}
                                        className="mr-2"
                                    />
                                    Confirm
                                </>
                            )}
                        </Button>

                    </DialogFooter>

                </DialogContent>

            </Dialog>

            {/* ================================================== */}
            {/* SCAN HISTORY DIALOG */}
            {/* ================================================== */}

            <Dialog
                open={showHistoryDialog}
                onOpenChange={setShowHistoryDialog}
            >

                <DialogContent className="max-h-[85vh] max-w-md overflow-hidden bg-white">

                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History size={19} />
                            Scan History
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3">

                        <div className="rounded-lg bg-gray-50 p-3">

                            <div className="text-[10px] font-medium uppercase text-gray-400">
                                SPK Number
                            </div>

                            <div className="mt-1 break-all font-mono text-xs font-semibold text-gray-800">
                                {activeOrderNo}
                            </div>

                            <div className="mt-2 flex justify-between border-t pt-2 text-xs">
                                <span className="text-gray-500">
                                    Total Scanned
                                </span>

                                <span className="font-semibold text-green-600">
                                    {scanHistory.length}
                                </span>
                            </div>

                        </div>

                        <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">

                            {isLoadingHistory ? (

                                <div className="flex justify-center py-8">
                                    <Loader2
                                        size={23}
                                        className="animate-spin text-gray-400"
                                    />
                                </div>

                            ) : scanHistory.length === 0 ? (

                                <div className="py-8 text-center text-sm text-gray-400">
                                    No scan history available
                                </div>

                            ) : (

                                scanHistory.map((scan) => (

                                    <div
                                        key={scan.ID}
                                        className="rounded-lg border bg-white p-3"
                                    >

                                        <div className="flex items-start justify-between gap-2">

                                            <div className="min-w-0 flex-1">

                                                <div className="break-all font-mono text-xs font-semibold text-gray-800">
                                                    {scan.shipment_id}
                                                </div>

                                                <div className="mt-1 text-[11px] text-gray-400">
                                                    Detail ID: {scan.order_detail_id}
                                                </div>

                                            </div>

                                            <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-green-700">
                                                VERIFIED
                                            </span>

                                        </div>

                                        <div className="mt-2 space-y-1 border-t pt-2 text-[11px] text-gray-500">

                                            <div>
                                                <Clock
                                                    size={11}
                                                    className="mr-1 inline"
                                                />

                                                {formatDate(scan.scanned_at)}
                                            </div>

                                            <div>
                                                Scanned By: {scan.scanned_by || "-"}
                                            </div>

                                            {scan.remarks && (
                                                <div>
                                                    Remarks: {scan.remarks}
                                                </div>
                                            )}

                                        </div>

                                    </div>

                                ))

                            )}

                        </div>

                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() =>
                                setShowHistoryDialog(false)
                            }
                        >
                            Close
                        </Button>
                    </DialogFooter>

                </DialogContent>

            </Dialog>

        </>
    );
};

export default OutboundVerificationPage;
