/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Layout from "@/components/layout";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/mobile/PageHeader";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Box, CheckCircle2Icon, List, Loader2, Trash2, Package, Search, Check, Clock3, RefreshCw, ArrowRight, ArrowBigLeftIcon } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { XCircle } from "lucide-react";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";
import { InventoryPolicy } from "@/types/inventory";
import { ParsedQRData, parseQRCode } from "@/utils/qrParser";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScanItem {
    sku?: string;
    carton_id?: number | null;
    carton_code?: string | null;
    scan_type?: string;
    outbound_no: string;
    barcode: string;
    serial_no?: string;
    qty?: number;
    seq_box?: number;
    location?: string;
    uom?: string;
    packing_no?: string;
    pack_ctn_no?: string;
    qr_raw?: string; // raw QR string untuk ScanData
    lot_no?: string; // untuk menyimpan batch/lot number dari QR jika ada
    prod_date?: string; // untuk menyimpan prod date dari QR jika ada
    inner_serials?: string[]      // ← tambah
    inner_serial_end?: string     // ← tambah untuk validasi backend
    case_number?: string
    item_model?: string
    package_type?: string;
    package_qty?: number;
}

interface PackageOption {
    type: string;
    conversion: number;
}

interface MasterCarton {
    id: number;
    carton_code: string;
    carton_name: string;
    description: string;
    length: number;
    width: number;
    height: number;
    max_weight: number;
    tare_weight: number;
    volume: number;
    is_default: boolean;
    material: string;
    dimensions: string;
    display_name: string;
}

interface OutboundDetail {
    id: number;
    outbound_no: string;
    outbound_detail_id: number;
    item_code: string;
    item_name?: string;
    barcode: string;
    quantity: number;
    scan_qty?: number;
    has_serial?: string;
    uom?: string;
    owner_code?: string;
    is_serial?: boolean;
    lot_number?: string;
}

interface OutboundHeader {
    shipment_id?: string;
    status?: string;
    deliv_to?: string;
    deliv_address?: string;
    deliv_city?: string;
}

interface ScannedItem {
    id?: number;
    item_code?: string;
    outbound_detail_id: number;
    barcode: string;
    serial_number: string;
    serial_number_2?: string;
    pallet: string;
    location: string;
    seq_box: number;
    qa_status: string;
    whs_code: string;
    scan_type: string;
    quantity: number;
    location_scan?: string;
    status?: string;
    case_number?: string;
    barcode_data_scan?: string;
    qty_data_scan?: number;
    uom_scan?: string;
    is_serial?: boolean;
    packing_no?: string;
    pack_ctn_no?: string;
    item_model?: string;
    lot_number?: string;
    package_type?: string;
    package_qty?: number;
}

// ─── QR Parser ────────────────────────────────────────────────────────────────
type LabelType = "UNIT" | "CARTON" | "UNKNOWN"
// interface ParsedQRData {
//   sku?: string;       // item_code
//   ean?: string;       // barcode
//   product?: string;   // item_name
//   brand?: string;
//   model?: string;
//   serial?: string;
//   cartonSerial?: string; // case_number
//   batch?: string;        // lot_number
//   mfgDate?: string;      // prod_date (yyyyMMdd → yyyy-MM-dd)
//   qtyPerCarton?: number; // qty suggestion
//   labelType?: "UNIT" | "CARTON" | "UNKNOWN";
//   innerSerialStart?: string;
//   innerSerialEnd?: string;
//   innerSerials?: string[];
//   innerSerialRangeError?: string;
// }

// function parseQRCode(raw: string): ParsedQRData | null {

//   // ── Format v2: 12 segment dash-separated ──────────────────
//   if (!raw.startsWith("(") && raw.split("-").length === 12) {
//     const segments = raw.split("-")

//     const rawDate = segments[9]
//     let mfgDate: string | undefined
//     if (rawDate?.length === 8) {
//       mfgDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
//     }

//     const qtyMatch = segments[4].match(/^(\d+)/)
//     const qty = qtyMatch ? Number(qtyMatch[1]) : undefined

//     // ← tambah inner serial untuk format v2
//     const start = segments[10] || undefined  // sesuaikan index segment
//     const end = segments[11] || undefined

//     let innerSerials: string[] | undefined
//     let innerSerialRangeError: string | undefined

//     if (start) {
//       const numMatch = start.match(/^(.*?)(\d+)$/)
//       if (numMatch) {
//         const prefix = numMatch[1]
//         const startNum = parseInt(numMatch[2], 10)
//         const padLen = numMatch[2].length
//         let endNum: number | undefined

//         if (end) {
//           endNum = parseInt(end.replace(prefix, ""), 10)
//         } else if (qty && qty > 0) {
//           endNum = startNum + qty - 1
//         }

//         if (endNum !== undefined && !isNaN(startNum) && !isNaN(endNum) && endNum >= startNum) {
//           innerSerials = []
//           for (let i = startNum; i <= endNum; i++) {
//             innerSerials.push(prefix + String(i).padStart(padLen, "0"))
//           }

//           const lastGenerated = innerSerials[innerSerials.length - 1]
//           if (end && lastGenerated !== end) {
//             innerSerialRangeError = `Range invalid: "${lastGenerated}" ≠ "${end}"`
//             innerSerials = undefined
//           }
//           if (!innerSerialRangeError && qty && innerSerials && innerSerials.length !== qty) {
//             innerSerialRangeError = `Total inner serial ${innerSerials.length} ≠ QTY_PER_CARTON ${qty}`
//             innerSerials = undefined
//           }
//         }
//       }
//     }

//     return {
//       sku: segments[1] || undefined,
//       qtyPerCarton: !isNaN(qty) && qty > 0 ? qty : undefined,
//       mfgDate,
//       labelType: "CARTON",
//       innerSerialStart: start,
//       innerSerialEnd: end,
//       innerSerials,
//       innerSerialRangeError,
//     }
//   }

//   // ── Format v1: (1)KEY=VALUE ────────────────────────────────
//   const pattern = /\((\d+)\)([A-Z_]+)=([^(]*)/g
//   const map: Record<string, string> = {}
//   let match: RegExpExecArray | null
//   let found = false

//   while ((match = pattern.exec(raw)) !== null) {
//     found = true
//     map[match[2].trim()] = match[3].trim()
//   }

//   if (!found) return null

//   let mfgDate: string | undefined
//   if (map["MFG_DATE"]?.length === 8) {
//     const d = map["MFG_DATE"]
//     mfgDate = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
//   }

//   const labelType: LabelType = map["SERIAL"]
//     ? "UNIT"
//     : (map["CARTON_SERIAL"] || map["CARTON"])
//       ? "CARTON"
//       : "UNKNOWN"

//   // ← generate inner serials (sama persis dengan inbound)
//   let innerSerials: string[] | undefined
//   let innerSerialRangeError: string | undefined
//   const start = map["INNER_SERIAL_START"]
//   const end = map["INNER_SERIAL_END"]
//   // const qty = map["QTY_PER_CARTON"] ? Number(map["QTY_PER_CARTON"]) : undefined
//   const qty = map["QTY_PER_CARTON"] ? parseInt(map["QTY_PER_CARTON"], 10) : undefined

//   if (start) {
//     const numMatch = start.match(/^(.*?)(\d+)$/)
//     if (numMatch) {
//       const prefix = numMatch[1]
//       const startNum = parseInt(numMatch[2], 10)
//       const padLen = numMatch[2].length
//       let endNum: number | undefined

//       if (end) {
//         endNum = parseInt(end.replace(prefix, ""), 10)
//       } else if (qty && qty > 0) {
//         endNum = startNum + qty - 1
//       }

//       if (endNum !== undefined && !isNaN(startNum) && !isNaN(endNum) && endNum >= startNum) {
//         innerSerials = []
//         for (let i = startNum; i <= endNum; i++) {
//           innerSerials.push(prefix + String(i).padStart(padLen, "0"))
//         }

//         const lastGenerated = innerSerials[innerSerials.length - 1]
//         if (end && lastGenerated !== end) {
//           innerSerialRangeError = `Range tidak valid: "${lastGenerated}" ≠ "${end}"`
//           innerSerials = undefined
//         }
//         if (!innerSerialRangeError && qty && innerSerials && innerSerials.length !== qty) {
//           innerSerialRangeError = `Total inner serial ${innerSerials.length} ≠ QTY_PER_CARTON ${qty}`
//           innerSerials = undefined
//         }
//       } else if (start) {
//         innerSerialRangeError = "Cannot parse INNER_SERIAL_END / Invalid number format"
//       }
//     } else {
//       innerSerialRangeError = "Cannot parse INNER_SERIAL_START format"
//     }
//   }

//   return {
//     sku: map["SKU"],
//     ean: map["EAN"],
//     product: map["PRODUCT"],
//     brand: map["BRAND"],
//     model: map["MODEL"],
//     serial: map["SERIAL"],
//     cartonSerial: map["CARTON_SERIAL"] ?? map["CARTON"],
//     batch: map["BATCH"],
//     mfgDate,
//     qtyPerCarton: qty,
//     labelType,
//     innerSerialStart: start,
//     innerSerialEnd: end,
//     innerSerials,
//     innerSerialRangeError,
//   }
// }

// ─── Toggle Component ─────────────────────────────────────────────────────────

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (val: boolean) => void;
    labelOff?: string;
    labelOn?: string;
}

const ToggleSwitch = ({ checked, onChange, labelOff = "Off", labelOn = "On" }: ToggleSwitchProps) => (
    <div className="flex items-center gap-2 text-sm">
        <span className={!checked ? "font-semibold text-gray-800" : "text-gray-400"}>{labelOff}</span>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-blue-500" : "bg-gray-300"}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
        </button>
        <span className={checked ? "font-semibold text-gray-800" : "text-gray-400"}>{labelOn}</span>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const CheckingPage = () => {
    const router = useRouter();
    // Continue Packing sends `carton_id`; new packing sends `master_carton_id`.
    // Accept both so the selected carton type is restored when resuming a carton.
    const { outbound, carton, master_carton_id, carton_id } = router.query;
    const selectedMasterCartonId = master_carton_id ?? carton_id;

    // ── Scan mode ──────────────────────────────────────────────────────────────
    const [isQrMode, setIsQrMode] = useState(false);
    const [qrRawInput, setQrRawInput] = useState("");
    const [parsedQR, setParsedQR] = useState<ParsedQRData | null>(null);

    // ── Scan fields ────────────────────────────────────────────────────────────
    const [scanUom, setScanUom] = useState("");
    const [scanLocation, setScanLocation] = useState("");
    const [scanSku, setScanSku] = useState("");
    const [scanBarcode, setScanBarcode] = useState("");
    const [packingNo, setPackingNo] = useState("");
    const [packCtnNo, setPackCtnNo] = useState("");
    const [serialInputs, setSerialInputs] = useState([""]);
    // scanQty always stores the final quantity in the base UOM (PCS).
    const [scanQty, setScanQty] = useState<string | number>(1);
    const [packageOptions, setPackageOptions] = useState<PackageOption[]>([{ type: "PCS", conversion: 1 }]);
    const [selectedPackageType, setSelectedPackageType] = useState("PCS");
    const [packageQty, setPackageQty] = useState<string | number>(1);
    const [desktopActiveDetail, setDesktopActiveDetail] = useState<OutboundDetail | null>(null);

    // ── UI state ───────────────────────────────────────────────────────────────
    const [searchOutboundDetail, setSearchOutboundDetail] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [showModalDetail, setShowModalDetail] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSerial, setIsSerial] = useState(false);
    const [showDialog, setShowDialog] = useState(false);
    const [isSubmit, setIsSubmit] = useState(false);
    const [showAllOutboundDetail, setShowAllOutboundDetail] = useState(true);

    // ── Carton state ───────────────────────────────────────────────────────────
    const [selectedCarton, setSelectedCarton] = useState<string | "all">("all");
    const [showDeleteCartonConfirm, setShowDeleteCartonConfirm] = useState(false);
    const [cartonToDelete, setCartonToDelete] = useState("");
    const [masterCarton, setMasterCarton] = useState<MasterCarton | null>(null);
    const [isLoadingMasterCarton, setIsLoadingMasterCarton] = useState(false);
    const [masterCartonsList, setMasterCartonsList] = useState<MasterCarton[]>([]);
    const [selectedNewCartonId, setSelectedNewCartonId] = useState("");
    const [isUpdatingCarton, setIsUpdatingCarton] = useState(false);
    const [isCreatingCarton, setIsCreatingCarton] = useState(false);
    const [showEditCartonDialog, setShowEditCartonDialog] = useState(false);
    const [showConfirmUpdateCarton, setShowConfirmUpdateCarton] = useState(false);

    // ── Seal container state ───────────────────────────────────────────────────
    const [showSealContainerDialog, setShowSealContainerDialog] = useState(false);
    const [showConfirmSealContainer, setShowConfirmSealContainer] = useState(false);
    const [containerWeight, setContainerWeight] = useState("");
    const [isSealingContainer, setIsSealingContainer] = useState(false);

    // ── List container state ───────────────────────────────────────────────────
    const [showListContainerDialog, setShowListContainerDialog] = useState(false);
    const [listContainerSummary, setListContainerSummary] = useState<any[]>([]);

    // ── Data state ─────────────────────────────────────────────────────────────
    const [originalListOutboundDetail, setOriginalListOutboundDetail] = useState<OutboundDetail[]>([]);
    const [outboundHeader, setOutboundHeader] = useState<OutboundHeader | null>(null);
    const [listOutboundDetail, setListOutboundDetail] = useState<OutboundDetail[]>([]);
    const [listOutboundScanned, setListOutboundScanned] = useState<ScannedItem[]>([]);
    const [invPolicy, setInvPolicy] = useState<InventoryPolicy | undefined>();

    const outboundNo = Array.isArray(outbound) ? outbound[0] : (outbound ?? "");

    // Desktop workbench state
    const [desktopSearch, setDesktopSearch] = useState("");
    const [desktopResultSearch, setDesktopResultSearch] = useState("");
    const [desktopCartonFilter, setDesktopCartonFilter] = useState<"active" | "all">("active");
    const [desktopScannedItems, setDesktopScannedItems] = useState<ScannedItem[]>([]);
    const [isLoadingDesktopResults, setIsLoadingDesktopResults] = useState(false);
    const [processingDetailId, setProcessingDetailId] = useState<number | null>(null);

    // tambah state
    const [innerSerialError, setInnerSerialError] = useState(false)

    const [showConfirmPackingDialog, setShowConfirmPackingDialog] = useState(false);
    const [isConfirmingPacking, setIsConfirmingPacking] = useState(false);


    const handleQrInputChange = (raw: string) => {
        setQrRawInput(raw)
        const parsed = parseQRCode(raw)

        if (parsed) {
            setParsedQR(parsed)

            // ← block jika range error
            if (parsed.innerSerialRangeError) {
                setInnerSerialError(true)
                eventBus.emit("showAlert", {
                    title: "Serial Range Error!",
                    description: parsed.innerSerialRangeError,
                    type: "error",
                })
                return
            }

            setInnerSerialError(false)

            if (parsed.ean) setScanBarcode(parsed.ean)
            if (parsed.sku) setScanSku(parsed.sku)

            if (parsed.labelType === "UNIT") {
                if (parsed.serial) setSerialInputs([parsed.serial])
                setScanQty(1)
            }

            if (parsed.labelType === "CARTON") {
                if (parsed.innerSerials && parsed.innerSerials.length > 0) {
                    // ← ada inner serials → set qty
                    setScanQty(parsed.innerSerials.length)
                } else if (parsed.qtyPerCarton) {
                    setScanQty(parsed.qtyPerCarton)
                }
            }

        } else {
            setParsedQR(null)
            setInnerSerialError(false)
        }
    }

    const handleModeToggle = (qr: boolean) => {
        setIsQrMode(qr);
        setQrRawInput("");
        setParsedQR(null);
        setScanSku("");
        setScanBarcode("");
        setScanQty(1);
        setInnerSerialError(false);
        setTimeout(() => {
            document.getElementById(qr ? "qr-input" : "barcode")?.focus();
        }, 50);
    };

    // ── Fetch helpers ──────────────────────────────────────────────────────────

    const fetchPolicy = useCallback(async (owner: string) => {
        try {
            const response = await api.get("/inventory/policy?owner=" + owner);
            const data = await response.data;
            if (data.success) setInvPolicy(data.data.inventory_policy);
        } catch (error) {
            console.error("Error fetching policy:", error);
        }
    }, []);

    const fetchOutboundDetail = useCallback(async () => {
        try {
            const response = await api.get("/mobile/outbound/detail/" + outboundNo, { withCredentials: true });
            const data = await response.data;
            if (data.success) {
                // Detail items are returned in `data`; outbound metadata is in `header`.
                const header = data.header ?? data.data?.header ?? null;
                const detailRows = Array.isArray(data.data)
                    ? data.data
                    : Array.isArray(data.data?.data)
                        ? data.data.data
                        : [];

                setOutboundHeader(header ? {
                    shipment_id: header.shipment_id ?? "",
                    status: header.status ?? "",
                    deliv_to: header.deliv_to ?? "",
                    deliv_address: header.deliv_address ?? header.deliv_to_address ?? "",
                    deliv_city: header.deliv_city ?? header.deliv_to_city ?? "",
                } : null);

                const filtered: OutboundDetail[] = detailRows.map((item: any) => ({
                    outbound_detail_id: item.outbound_detail_id,
                    item_code: item.item_code,
                    item_name: item.item_name,
                    barcode: item.barcode,
                    quantity: item.quantity,
                    scan_qty: item.scan_qty,
                    has_serial: item.has_serial,
                    uom: item.uom,
                    owner_code: item.owner_code,
                    is_serial: item.is_serial,
                    lot_number: item.lot_number,
                    package_type: item.package_type,
                    package_qty: item.package_qty,
                }));
                setOriginalListOutboundDetail(filtered);
            }
        } catch (error) {
            console.error("Error fetching outbound detail:", error);
        }
    }, [outboundNo]);

    const fetchScannedItems = useCallback(async (id?: number) => {
        if (!id) return;
        try {
            const response = await api.get("/mobile/outbound/picking/scan/" + id, { withCredentials: true });
            const data = await response.data;
            if (data.success) {
                const filtered: ScannedItem[] = data.data.map((item: any) => ({
                    id: item.ID,
                    outbound_detail_id: item.outbound_detail_id,
                    item_code: item.item_code,
                    barcode: item.barcode,
                    case_number: item.case_number,
                    serial_number: item.serial_number,
                    serial_number_2: item.serial_number_2,
                    pallet: item.pallet,
                    location: item.location,
                    seq_box: item.seq_box,
                    qa_status: item.qa_status,
                    whs_code: item.whs_code,
                    scan_type: item.scan_type,
                    quantity: item.quantity,
                    status: item.status,
                    barcode_data_scan: item.barcode_data_scan,
                    location_scan: item.location_scan,
                    qty_data_scan: item.qty_data_scan,
                    uom_scan: item.uom_scan,
                    is_serial: item.is_serial,
                    packing_no: item.packing_no,
                    pack_ctn_no: item.pack_ctn_no,
                    item_model: item.item_model,
                    lot_number: item.lot_number,
                }));
                setListOutboundScanned(filtered);
                setSelectedCarton("all");
            }
        } catch (error) {
            console.error("Error fetching scanned items:", error);
        }
    }, []);

    // Load picking result for each outbound detail using the existing API contract.
    const fetchAllDesktopScannedItems = useCallback(async () => {
        if (!originalListOutboundDetail.length) {
            setDesktopScannedItems([]);
            return;
        }

        setIsLoadingDesktopResults(true);
        try {
            const results = await Promise.all(
                originalListOutboundDetail.map(async (detail) => {
                    try {
                        const response = await api.get(
                            "/mobile/outbound/picking/scan/" + detail.outbound_detail_id,
                            { withCredentials: true }
                        );
                        if (!response.data.success) return [];
                        return (response.data.data ?? []).map((item: any) => ({
                            id: item.ID,
                            outbound_detail_id: item.outbound_detail_id,
                            item_code: item.item_code,
                            barcode: item.barcode,
                            case_number: item.case_number,
                            serial_number: item.serial_number,
                            serial_number_2: item.serial_number_2,
                            pallet: item.pallet,
                            location: item.location,
                            seq_box: item.seq_box,
                            qa_status: item.qa_status,
                            whs_code: item.whs_code,
                            scan_type: item.scan_type,
                            quantity: item.quantity,
                            status: item.status,
                            barcode_data_scan: item.barcode_data_scan,
                            location_scan: item.location_scan,
                            qty_data_scan: item.qty_data_scan,
                            uom_scan: item.uom_scan,
                            is_serial: item.is_serial,
                            packing_no: item.packing_no,
                            pack_ctn_no: item.pack_ctn_no,
                            item_model: item.item_model,
                            lot_number: item.lot_number,
                            package_type: item.package_type,
                            package_qty: item.package_qty,
                        })) as ScannedItem[];
                    } catch (error) {
                        console.error("Failed to load picking detail:", detail.outbound_detail_id, error);
                        return [];
                    }
                })
            );
            setDesktopScannedItems(results.flat());
        } finally {
            setIsLoadingDesktopResults(false);
        }
    }, [originalListOutboundDetail]);

    const fetchMasterCartonDetails = useCallback(async (id: string) => {
        setIsLoadingMasterCarton(true);
        try {
            const response = await api.get(`/mobile/outbound/master-cartons/${id}`, { withCredentials: true });
            if (response.data.success) setMasterCarton(response.data.data);
        } catch (error) {
            console.error("Error fetching master carton:", error);
            eventBus.emit("showAlert", { title: "Warning", description: "Failed to load carton information", type: "error" });
        } finally {
            setIsLoadingMasterCarton(false);
        }
    }, []);

    const fetchAllMasterCartons = useCallback(async () => {
        try {
            const response = await api.get("/mobile/outbound/master-cartons", { withCredentials: true });
            if (response.data.success) setMasterCartonsList(response.data.data);
        } catch (error) {
            console.error("Error fetching master cartons list:", error);
        }
    }, []);

    const fetchCartonByOutboundNo = useCallback(async () => {
        const cartonID = masterCarton?.id ?? null;
        // const cartonTypeId = container?.master_carton_id ?? container?.carton_id ?? container?.carton?.id;
        try {
            const [r1, r2] = await Promise.all([
                api.get(`/mobile/outbound/${outboundNo}/cartons`, { withCredentials: true }),
                api.get(`/mobile/outbound/${outboundNo}/cartons/items`, { withCredentials: true }),
            ]);
            if (r1.data.success && r2.data.success) {
                const cartons = r1.data.data.cartons;
                const items = r2.data.data.cartons;
                cartons.forEach((c: any) => {
                    c.items = items
                        .filter((i: any) => i.pack_ctn_no === c.pack_ctn_no)
                        .map((i: any) => `${i.barcode} -> ${i.total_qty}`);
                });
                setListContainerSummary(cartons);
            }
        } catch (error) {
            console.error("Error fetching carton summary:", error);
        }
    }, [outboundNo]);

    // Switch the active carton without creating a new carton number.
    const handleSelectContainer = async (container: any) => {
        const nextCartonNo = String(container?.pack_ctn_no ?? "");
        if (!nextCartonNo) return;

        setPackCtnNo(nextCartonNo);
        setPackingNo(outboundNo);
        setDesktopCartonFilter("active");
        setDesktopResultSearch("");
        setShowListContainerDialog(false);

        // Carton summary APIs may expose the master carton id under either key.
        const cartonTypeId = container?.master_carton_id ?? container?.carton_id ?? container?.carton?.id;
        if (cartonTypeId) {
            const id = String(cartonTypeId);
            await fetchMasterCartonDetails(id);
            router.replace(
                { pathname: router.pathname, query: { ...router.query, master_carton_id: id, carton: nextCartonNo } },
                undefined,
                { shallow: true }
            );
        } else {
            router.replace(
                { pathname: router.pathname, query: { ...router.query, carton: nextCartonNo } },
                undefined,
                { shallow: true }
            );
        }
        await fetchAllDesktopScannedItems();
    };

    // ── Effects ────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (outbound) fetchOutboundDetail();
        if (carton) {
            setPackCtnNo(carton as string);
            setPackingNo(outboundNo);
        }
    }, [outbound, carton]);

    useEffect(() => {
        if (selectedMasterCartonId) {
            fetchMasterCartonDetails(selectedMasterCartonId as string);
        } else {
            setMasterCarton(null);
        }
    }, [selectedMasterCartonId, fetchMasterCartonDetails]);

    useEffect(() => {
        if (originalListOutboundDetail.length > 0) {
            fetchPolicy(originalListOutboundDetail[0].owner_code!);
        }
    }, [originalListOutboundDetail]);

    useEffect(() => {
        const base = showAllOutboundDetail
            ? originalListOutboundDetail
            : originalListOutboundDetail.filter((item) => item.quantity !== item.scan_qty);
        setListOutboundDetail(base);
    }, [originalListOutboundDetail, showAllOutboundDetail]);

    useEffect(() => {
        fetchAllMasterCartons();
    }, []);

    useEffect(() => {
        if (originalListOutboundDetail.length > 0) {
            fetchAllDesktopScannedItems();
        } else {
            setDesktopScannedItems([]);
        }
    }, [originalListOutboundDetail, fetchAllDesktopScannedItems]);

    useEffect(() => {
        if (showListContainerDialog) fetchCartonByOutboundNo();
    }, [showListContainerDialog]);

    // Auto-focus saat dialog terbuka
    useEffect(() => {
        if (!showDialog) return;
        const id = setTimeout(() => {
            if (isSerial) {
                (document.getElementById("serial-0") as HTMLInputElement)?.focus();
            } else {
                (document.getElementById("qty") as HTMLInputElement)?.focus();
            }
        }, 100);
        return () => clearTimeout(id);
    }, [showDialog, isSerial]);

    // ── Scan handlers ──────────────────────────────────────────────────────────

    const buildPackageOptions = (product: any): PackageOption[] => {
        const fields: Array<[string, string]> = [
            ["PCS", "1"],
            ["CARTON", "qty_per_carton"],
            ["BOX", "pcs_per_box"],
            ["DOZEN", "pcs_per_dozen"],
            ["SET", "pcs_per_set"],
            ["PACK", "pcs_per_pack"],
            ["CASE", "pcs_per_case"],
            ["GROSS", "pcs_per_gross"],
        ];
        return fields
            .map(([type, field]) => ({ type, conversion: field === "1" ? 1 : Number(product?.[field] ?? 0) }))
            .filter((option) => Number.isFinite(option.conversion) && option.conversion > 0);
    };

    const getSelectedPackageConversion = () =>
        packageOptions.find((option) => option.type === selectedPackageType)?.conversion ?? 1;

    const updatePackageQuantity = (value: string) => {
        setPackageQty(value);
        if (value === "") {
            setScanQty("");
            return;
        }
        const count = Math.max(1, Math.floor(Number(value) || 1));
        setPackageQty(count);
        setScanQty(count * getSelectedPackageConversion());
    };

    const handlePackageTypeChange = (value: string) => {
        setSelectedPackageType(value);
        const conversion = packageOptions.find((option) => option.type === value)?.conversion ?? 1;
        const count = Math.max(1, Number(packageQty) || 1);
        setScanQty(count * conversion);
    };

    const handleScan = async (
        overrideBarcode?: string,
        overrideUom?: string
    ) => {

        const barcode = overrideBarcode ?? scanBarcode;
        const uom = overrideUom ?? scanUom;

        if (!barcode.trim()) return;

        let serialNumber =
            serialInputs.length > 1
                ? serialInputs.filter((s) => s.trim() !== "").join("-")
                : serialInputs[0]?.trim() ?? "";

        if (isQrMode && parsedQR?.cartonSerial) {
            serialNumber = parsedQR.cartonSerial;
        }


        const newItem: ScanItem = {
            carton_id: masterCarton?.id ?? null,
            carton_code: masterCarton?.carton_code ?? null,
            outbound_no: outboundNo,
            location: scanLocation,
            sku: scanSku,
            barcode: barcode,
            serial_no: serialNumber,
            qty: scanQty as number,
            package_type: selectedPackageType,
            package_qty: Number(packageQty) || 1,
            uom: uom,
            packing_no: packingNo,
            pack_ctn_no: packCtnNo === "" ? null : packCtnNo,
            qr_raw: isQrMode ? qrRawInput : undefined,
            lot_no: isQrMode ? parsedQR?.batch : undefined,
            prod_date: isQrMode ? parsedQR?.mfgDate : undefined,
            inner_serials: parsedQR?.innerSerials ?? [],
            inner_serial_end: parsedQR?.innerSerialEnd ?? "",
            case_number: parsedQR?.cartonSerial ?? "",
            item_model: parsedQR?.model ?? ""
        };

        console.log("Submitting with values:", newItem);
        // return;

        if (isSubmit) return;
        setIsLoading(true);
        setIsSubmit(true);

        try {
            const response = await api.post("/mobile/outbound/picking/scan/" + outboundNo, newItem);
            const data = await response.data;
            if (data.success) {
                eventBus.emit("showAlert", { title: "Success!", description: data.message, type: "success" });
                fetchOutboundDetail();
                fetchAllDesktopScannedItems();
                closeDialog();
            }
        } catch (error) {
            console.error("Error during scan:", error);
        } finally {
            setIsLoading(false);
            setIsSubmit(false);
        }
    };

    // Desktop: click Process performs the same item-check validation as scanner flow.
    const handleDesktopProcess = async (item: OutboundDetail) => {
        if (isSubmit || processingDetailId !== null) return;

        const remaining = item.quantity - (item.scan_qty ?? 0);
        if (remaining <= 0) return;

        setProcessingDetailId(item.outbound_detail_id);
        setIsLoading(true);
        try {
            const checkPayload: ScanItem = {
                outbound_no: outboundNo,
                sku: item.item_code,
                barcode: item.barcode,
                qty: 1,
            };
            const response = await api.post(
                "/mobile/outbound/item-check/" + outboundNo,
                checkPayload
            );
            const res = response.data;
            if (!res.success) return;

            const resolvedBarcode = res.data?.product?.barcode ?? item.barcode;
            const resolvedUom = res.data?.uom?.from_uom ?? item.uom ?? "";
            setScanSku(item.item_code);
            setScanBarcode(resolvedBarcode);
            setScanUom(resolvedUom);
            const availablePackages = buildPackageOptions(res.data?.product);
            setPackageOptions(availablePackages);
            setSelectedPackageType("PCS");
            setPackageQty(1);
            setScanQty(1);
            setDesktopActiveDetail(item);
            setPackingNo(outboundNo);
            setSerialInputs([""]);
            setParsedQR(null);
            setQrRawInput("");
            setIsQrMode(false);
            setIsSerial(Boolean(res.is_serial));

            if (res.is_serial || !invPolicy?.picking_single_scan) {
                setShowDialog(true);
                return;
            }

            const payload: ScanItem = {
                carton_id: masterCarton?.id ?? null,
                carton_code: masterCarton?.carton_code ?? null,
                outbound_no: outboundNo,
                location: scanLocation,
                sku: item.item_code,
                barcode: resolvedBarcode,
                serial_no: "",
                qty: 1,
                package_type: "PCS",
                package_qty: 1,
                uom: resolvedUom,
                packing_no: packingNo || outboundNo,
                pack_ctn_no: packCtnNo === "" ? null : packCtnNo,
            };
            const saveResponse = await api.post(
                "/mobile/outbound/picking/scan/" + outboundNo,
                payload
            );
            if (saveResponse.data.success) {
                eventBus.emit("showAlert", {
                    title: "Success!",
                    description: saveResponse.data.message || "Item processed successfully",
                    type: "success",
                });
                await fetchOutboundDetail();
                await fetchScannedItems(item.outbound_detail_id);
                await fetchAllDesktopScannedItems();
            }
        } catch (error: any) {
            console.error("Desktop item process error:", error);
            eventBus.emit("showAlert", {
                title: "Process Failed",
                description: error.response?.data?.message || "Failed to process item",
                type: "error",
            });
        } finally {
            setIsLoading(false);
            setProcessingDetailId(null);
        }
    };

    const handleBarcodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        console.log("Submitting with values:", {
            scanBarcode,
            scanSku,
            scanQty,
            isQrMode,
            parsedQR,
        });

        if (!scanBarcode.trim() && !scanSku.trim()) {
            document.getElementById(isQrMode ? "qr-input" : "barcode")?.focus();
            return;
        }

        const newItem: ScanItem = {
            sku: scanSku,
            outbound_no: outboundNo,
            barcode: scanBarcode,
            qty: scanQty as number,
        };

        if (isSubmit) return;
        setIsLoading(true);
        setIsSubmit(true);

        try {
            const response = await api.post("/mobile/outbound/item-check/" + outboundNo, newItem);
            const res = await response.data;

            if (res.success) {

                const resolvedBarcode = qrRawInput
                    ? (res.data.product?.barcode ?? scanBarcode)
                    : scanBarcode;

                const resolvedUom = res.data?.uom?.from_uom ?? "";
                // Set state untuk UI
                setScanBarcode(resolvedBarcode);
                setScanUom(resolvedUom);

                if (res.is_serial) {
                    setIsSerial(true);
                    setShowDialog(true);
                } else {
                    setIsSerial(false);
                    setScanUom(res.data?.uom?.from_uom ?? "");
                    if (invPolicy?.picking_single_scan) {
                        handleScan(resolvedBarcode, resolvedUom);
                    } else {
                        setShowDialog(true);
                    }
                }
            }
        } catch (error) {
            console.error("Error checking item:", error);
        } finally {
            setIsLoading(false);
            setIsSubmit(false);
        }
    };

    const handleSerialSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const emptyIndex = serialInputs.findIndex((s) => s.trim() === "");
        if (emptyIndex !== -1) {
            (document.getElementById(`serial-${emptyIndex}`) as HTMLInputElement)?.focus();
            return;
        }
        handleScan();
    };

    const handleQuantitySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const totalQty = Number(scanQty);
        const remaining = desktopActiveDetail
            ? desktopActiveDetail.quantity - (desktopActiveDetail.scan_qty ?? 0)
            : Number.POSITIVE_INFINITY;
        if (!Number.isFinite(totalQty) || totalQty <= 0) {
            eventBus.emit("showAlert", { title: "Invalid Quantity", description: "Please enter a valid package quantity.", type: "error" });
            return;
        }
        if (totalQty > remaining) {
            eventBus.emit("showAlert", { title: "Quantity Exceeded", description: `Total quantity is ${totalQty} PCS, but only ${remaining} PCS remaining.`, type: "error" });
            return;
        }
        handleScan();
    };

    const closeDialog = () => {
        setShowDialog(false);
        setSerialInputs([""]);
        setScanBarcode("");
        setScanSku("");
        setScanQty(1);
        setPackageQty(1);
        setSelectedPackageType("PCS");
        setPackageOptions([{ type: "PCS", conversion: 1 }]);
        setDesktopActiveDetail(null);
        setQrRawInput("");
        setParsedQR(null);
        setTimeout(() => {
            document.getElementById(isQrMode ? "qr-input" : "barcode")?.focus();
        }, 50);
    };

    // ── Remove handlers ────────────────────────────────────────────────────────

    const handleRemoveItem = async (id: number, outbound_detail_id: number) => {
        if (isSubmit) return;
        setIsSubmit(true);
        try {
            const response = await api.delete("/mobile/outbound/picking/scan/" + id, { withCredentials: true });
            const data = await response.data;
            if (data.success) {
                fetchScannedItems(outbound_detail_id);
                fetchOutboundDetail();
                eventBus.emit("showAlert", { title: "Success!", description: "Item deleted successfully", type: "success" });
            }
        } catch (error) {
            console.error("Error deleting item:", error);
        } finally {
            setIsSubmit(false);
        }
    };

    const handleRemoveCarton = async (cartonNo: string, outbound_detail_id: number) => {
        if (isSubmit) return;
        setIsSubmit(true);
        try {
            const itemsToDelete = listOutboundScanned.filter((item) => item.pack_ctn_no === cartonNo);
            for (const item of itemsToDelete) {
                await api.delete("/mobile/outbound/picking/scan/" + item.id, { withCredentials: true });
            }
            fetchScannedItems(outbound_detail_id);
            fetchOutboundDetail();
            setShowDeleteCartonConfirm(false);
            setCartonToDelete("");
            eventBus.emit("showAlert", { title: "Success!", description: `Carton ${cartonNo} deleted`, type: "success" });
        } catch (error) {
            console.error("Error deleting carton:", error);
            eventBus.emit("showAlert", { title: "Error!", description: "Failed to delete container", type: "error" });
        } finally {
            setIsSubmit(false);
        }
    };

    // ── Carton handlers ────────────────────────────────────────────────────────

    const handleNewCarton = async () => {
        if (isCreatingCarton) return;
        setIsCreatingCarton(true);
        try {
            const response = await api.get(`/mobile/outbound/picking/${outboundNo}/cartons/next`, { withCredentials: true });
            if (response.data.success) {
                const next = response.data.next_ctn_no.toString();
                setPackCtnNo(next);
                eventBus.emit("showAlert", { title: "Success!", description: `Moved to Carton #${next}`, type: "success" });
            }
        } catch (error) {
            console.error("Error creating new carton:", error);
            eventBus.emit("showAlert", { title: "Error!", description: "Failed to create new carton", type: "error" });
        } finally {
            setIsCreatingCarton(false);
        }
    };

    const handleUpdateCarton = () => {
        if (!selectedNewCartonId) {
            eventBus.emit("showAlert", { title: "Warning", description: "Please select a carton type", type: "error" });
            return;
        }
        if (selectedNewCartonId === masterCarton?.id.toString()) {
            setShowEditCartonDialog(false);
            return;
        }
        setShowConfirmUpdateCarton(true);
    };

    const handleConfirmUpdateCarton = async () => {
        setIsUpdatingCarton(true);
        try {
            const response = await api.put(
                `/mobile/outbound/picking/update-carton/${outboundNo}`,
                { pack_ctn_no: packCtnNo, new_carton_id: parseInt(selectedNewCartonId), outbound_no: outboundNo },
                { withCredentials: true }
            );
            if (response.data.success) {
                await fetchMasterCartonDetails(selectedNewCartonId);
                router.replace({ pathname: router.pathname, query: { ...router.query, master_carton_id: selectedNewCartonId } }, undefined, { shallow: true });
                setShowEditCartonDialog(false);
                setShowConfirmUpdateCarton(false);
                eventBus.emit("showAlert", { title: "Success!", description: "Carton type updated successfully", type: "success" });
            }
        } catch (error: any) {
            console.error("Error updating carton:", error);
            eventBus.emit("showAlert", { title: "Error!", description: error.response?.data?.message || "Failed to update carton type", type: "error" });
        } finally {
            setIsUpdatingCarton(false);
        }
    };

    // ── Seal container handlers ────────────────────────────────────────────────

    const handleConfirmSeal = () => {
        if (!containerWeight || parseFloat(containerWeight) <= 0) {
            eventBus.emit("showAlert", { title: "Warning", description: "Please enter a valid weight", type: "error" });
            return;
        }
        setShowSealContainerDialog(false);
        setShowConfirmSealContainer(true);
    };

    const handleSealContainerSubmit = async () => {
        setIsSealingContainer(true);
        try {
            const payload = { outbound_no: outboundNo, packing_no: packingNo, ctn_no: packCtnNo, weight: parseFloat(containerWeight) };
            const response = await api.post("/mobile/outbound/picking/seal-container/" + outboundNo, payload, { withCredentials: true });
            if (response.data.success) {
                setShowConfirmSealContainer(false);
                setContainerWeight("");
                eventBus.emit("showAlert", { title: "Success!", description: `Container ${packCtnNo} sealed successfully`, type: "success" });
            }
        } catch (error: any) {
            console.error("Error sealing container:", error);
            eventBus.emit("showAlert", { title: "Error!", description: error.response?.data?.message || "Failed to seal container", type: "error" });
        } finally {
            setIsSealingContainer(false);
        }
    };

    const handleConfirmPacking = async () => {
        setIsConfirmingPacking(true);
        try {
            const response = await api.post(
                `/mobile/outbound/packing/confirm/${outboundNo}`,
                { outbound_no: outboundNo },
                { withCredentials: true }
            );
            if (response.data.success) {
                setShowConfirmPackingDialog(false);
                eventBus.emit("showAlert", {
                    title: "Success!",
                    description: response.data.message || `Outbound ${outboundNo} confirmed successfully`,
                    type: "success",
                });
                router.back();
            }
        } catch (error: any) {
            console.error("Error confirming packing:", error);
            eventBus.emit("showAlert", {
                title: "Error!",
                description: error.response?.data?.message || "Failed to confirm packing",
                type: "error",
            });
        } finally {
            setIsConfirmingPacking(false);
        }
    };

    // ── Derived ────────────────────────────────────────────────────────────────

    const filteredItems = listOutboundDetail.filter((item) => {
        const term = desktopSearch.toLowerCase();
        return (
            (item.item_name ?? "").toLowerCase().includes(term) ||
            (item.item_code ?? "").toLowerCase().includes(term) ||
            (item.barcode ?? "").toLowerCase().includes(term) ||
            item.quantity.toString().includes(term) ||
            (item.scan_qty ?? 0).toString().includes(term) ||
            (item.lot_number ?? "").toLowerCase().includes(term)
        );
    });

    const filteredScannedItems = listOutboundScanned.filter((item) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
            !term ||
            item.id?.toString().includes(term) ||
            item.outbound_detail_id.toString().includes(term) ||
            item.barcode.toLowerCase().includes(term) ||
            item.serial_number.toLowerCase().includes(term) ||
            item.location?.toLowerCase().includes(term);
        const matchesCarton = selectedCarton === "all" || item.pack_ctn_no === selectedCarton;
        return matchesSearch && matchesCarton;
    });

    const uniqueCartons = Array.from(
        new Set(listOutboundScanned.map((item) => item.pack_ctn_no).filter(Boolean))
    ).sort() as string[];

    const groupedItems = filteredScannedItems.reduce<Record<number, ScannedItem[]>>((groups, item) => {
        const key = item.seq_box;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
        return groups;
    }, {});

    const getSelectedNewCartonDetails = () =>
        masterCartonsList.find((c) => c.id.toString() === selectedNewCartonId) ?? null;

    const totalScanQty = filteredItems.reduce((t, i) => t + (i.scan_qty ?? 0), 0);
    const totalPlanQty = filteredItems.reduce((t, i) => t + i.quantity, 0);

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <Layout title="Outbound" subTitle="Outbound Packing Workbench">




            <main className="min-h-screen w-full bg-slate-50 p-3 sm:p-4 lg:p-5">

                <div className="flex justify-between items-center mb-4">
                    <div className="space-x-1">
                        <Button
                            variant="outline"
                            className="bg-black-500 text-black hover:bg-gray-200"
                            onClick={() => {
                                router.push("/wms/outbound/packing/data");
                            }}
                        >
                            <ArrowBigLeftIcon className="mr-0" />
                            Back
                        </Button>

                    </div>
                </div>

                <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0 xl:w-[34%]">
                            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
                                <Package size={14} /> Outbound Fulfillment
                            </div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900">{outboundNo || "Outbound"}</h1>
                            <p className="mt-1 text-sm text-slate-500">Select an item on the left to process packing. Results appear on the right.</p>
                        </div>

                        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2 xl:mx-4 xl:min-w-[300px]">
                            <div className="min-w-0">
                                <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Shipment ID</p>
                                <p className="truncate text-xs font-semibold text-slate-700" title={outboundHeader?.shipment_id || "-"}>{outboundHeader?.shipment_id || "-"}</p>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Deliver To</p>
                                <p className="truncate text-xs font-semibold text-slate-700" title={outboundHeader?.deliv_to || "-"}>{outboundHeader?.deliv_to || "-"}</p>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Delivery Address</p>
                                <p className="truncate text-xs text-slate-600" title={outboundHeader?.deliv_address || "-"}>{outboundHeader?.deliv_address || "-"}</p>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Delivery City</p>
                                <p className="truncate text-xs text-slate-600" title={outboundHeader?.deliv_city || "-"}>{outboundHeader?.deliv_city || "-"}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 xl:min-w-[390px]">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <p className="text-[10px] font-semibold uppercase text-slate-500">Processed</p>
                                <p className="mt-1 text-xl font-bold tabular-nums text-blue-700">{originalListOutboundDetail.reduce((sum, item) => sum + (item.scan_qty ?? 0), 0)}</p>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <p className="text-[10px] font-semibold uppercase text-slate-500">Planned</p>
                                <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{originalListOutboundDetail.reduce((sum, item) => sum + item.quantity, 0)}</p>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <p className="text-[10px] font-semibold uppercase text-slate-500">Completion</p>
                                <p className="mt-1 text-xl font-bold tabular-nums text-green-700">{(() => { const plan = originalListOutboundDetail.reduce((sum, item) => sum + item.quantity, 0); const done = originalListOutboundDetail.reduce((sum, item) => sum + (item.scan_qty ?? 0), 0); return plan > 0 ? Math.min(100, Math.round(done / plan * 100)) : 0; })()}%</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${(() => { const plan = originalListOutboundDetail.reduce((sum, item) => sum + item.quantity, 0); const done = originalListOutboundDetail.reduce((sum, item) => sum + (item.scan_qty ?? 0), 0); return plan > 0 ? Math.min(100, done / plan * 100) : 0; })()}%` }} />
                    </div>
                </section>

                <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-2">
                    {/* LEFT PANEL: OUTBOUND DETAILS */}
                    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h2 className="font-semibold text-slate-900">Outbound Details</h2>
                                    <p className="mt-1 text-xs text-slate-500">Click Process to check and pack an item</p>
                                </div>
                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{filteredItems.length} items</span>
                            </div>
                            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                <div className="relative min-w-0 flex-1">
                                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input value={desktopSearch} onChange={(e) => setDesktopSearch(e.target.value)} placeholder="Search SKU, name, barcode, lot..." className="h-9 pl-9" />
                                </div>
                                <Select value={showAllOutboundDetail ? "all" : "pending"} onValueChange={(value) => setShowAllOutboundDetail(value === "all")}>
                                    <SelectTrigger className="h-9 w-full sm:w-[135px]"><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="all">All Items</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="max-h-[calc(100vh-310px)] min-h-[360px] space-y-2 overflow-y-auto p-3">
                            {isLoading && originalListOutboundDetail.length === 0 ? (
                                <div className="flex justify-center py-12 text-sm text-slate-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading outbound details...</div>
                            ) : filteredItems.length ? filteredItems.map((item) => {
                                const processed = item.scan_qty ?? 0;
                                const remaining = Math.max(0, item.quantity - processed);
                                const completed = remaining === 0;
                                const progress = item.quantity > 0 ? Math.min(100, processed / item.quantity * 100) : 0;
                                const busy = processingDetailId === item.outbound_detail_id;
                                return (
                                    <article key={item.outbound_detail_id} className={`rounded-lg border p-3 transition-colors ${completed ? "border-green-200 bg-green-50/40" : "border-slate-200 bg-white hover:border-blue-300"}`}>
                                        <div className="flex min-w-0 items-start gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-semibold text-slate-900">{item.item_code}</span>
                                                    {completed ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">Completed</span> : <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700">Pending</span>}
                                                    {item.is_serial && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">Serial</span>}
                                                </div>
                                                <p className="mt-1 break-words text-xs text-slate-600">{item.item_name || "-"}</p>
                                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                                                    <span>Barcode: {item.barcode || "-"}</span>{item.lot_number && <span>Lot: {item.lot_number}</span>}
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-5">
                                                    <div><p className="text-[10px] uppercase text-slate-400">Processed</p><p className="text-sm font-bold tabular-nums text-slate-800">{processed}<span className="ml-1 text-xs font-normal text-slate-400">/ {item.quantity} {item.uom}</span></p></div>
                                                    <div><p className="text-[10px] uppercase text-slate-400">Remaining</p><p className={`text-sm font-bold tabular-nums ${remaining ? "text-orange-600" : "text-green-700"}`}>{remaining}</p></div>
                                                </div>
                                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${completed ? "bg-green-500" : "bg-blue-600"}`} style={{ width: `${progress}%` }} /></div>
                                            </div>
                                            <Button size="sm" disabled={completed || busy || processingDetailId !== null || isSubmit} onClick={() => handleDesktopProcess(item)} className="mt-1 h-9 min-w-[88px] shrink-0 bg-blue-600 hover:bg-blue-700">
                                                {busy ? <Loader2 size={15} className="animate-spin" /> : completed ? <><Check size={14} className="mr-1" />Done</> : <>Process <ArrowRight size={14} className="ml-1" /></>}
                                            </Button>
                                        </div>
                                    </article>
                                );
                            }) : <div className="py-12 text-center text-sm text-slate-400">No outbound items found</div>}
                        </div>
                    </section>

                    {/* RIGHT PANEL: PACKING RESULTS */}
                    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div><h2 className="font-semibold text-slate-900">Packing Results</h2><p className="mt-1 text-xs text-slate-500">Saved picking transactions</p></div>
                                <div className="flex items-center gap-2"><span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">{desktopScannedItems.length} records</span><Button variant="outline" size="icon" className="h-8 w-8" disabled={isLoadingDesktopResults} onClick={() => { fetchOutboundDetail(); fetchAllDesktopScannedItems(); }}><RefreshCw size={14} className={isLoadingDesktopResults ? "animate-spin" : ""} /></Button></div>
                            </div>
                            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_170px]">
                                <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><Input value={desktopResultSearch} onChange={(e) => setDesktopResultSearch(e.target.value)} placeholder="Search SKU, serial, barcode, carton..." className="h-9 pl-9" /></div>
                                <Select value={desktopCartonFilter} onValueChange={(value: "active" | "all") => setDesktopCartonFilter(value)}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Carton view" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active Carton</SelectItem>
                                        <SelectItem value="all">All Cartons</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="mt-2 text-[11px] text-slate-500">{desktopCartonFilter === "active" ? `Showing active carton: ${packCtnNo || "not selected"}` : "Showing packing records from all cartons"}</p>
                            {invPolicy?.require_packing_scan && <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">Active Container</p><p className="mt-1 text-lg font-bold text-slate-900">CTN #{packCtnNo || "-"}</p><p className="text-xs text-slate-500">{masterCarton?.display_name || "Carton type not selected"}</p></div><div className="flex flex-wrap gap-1.5">
                                <Button size="sm" className="h-8 bg-blue-600" disabled={isCreatingCarton || outboundHeader.status !== "packing"} onClick={handleNewCarton}><Box size={14} className="mr-1" />New</Button><Button size="sm" variant="outline" className="h-8" onClick={() => setShowListContainerDialog(true)}><List size={14} className="mr-1" />List</Button><Button size="sm" variant="outline" className="h-8" onClick={() => setShowEditCartonDialog(true)}>Change Type</Button></div></div></div>}
                        </div>
                        <div className="max-h-[calc(100vh-390px)] min-h-[360px] overflow-y-auto p-3">
                            {isLoadingDesktopResults ? <div className="flex justify-center py-12 text-sm text-slate-500"><Loader2 size={16} className="mr-2 animate-spin" />Loading packing results...</div> : (() => {
                                const term = desktopResultSearch.toLowerCase();
                                const cartonRows = desktopCartonFilter === "all"
                                    ? desktopScannedItems
                                    : desktopScannedItems.filter((item) => (item.pack_ctn_no ?? "") === (packCtnNo ?? ""));
                                const rows = cartonRows.filter((item) => !term || [item.item_code, item.barcode, item.barcode_data_scan, item.serial_number, item.pack_ctn_no, item.lot_number, item.location_scan, item.package_type].some((value) => String(value ?? "").toLowerCase().includes(term)));
                                return rows.length ? <div className="space-y-2">{rows.map((item, index) => <article key={item.id ?? `${item.outbound_detail_id}-${index}`} className="rounded-lg border border-slate-200 p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-slate-900">{item.item_code || "-"}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.status === "in stock" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{outboundHeader?.status || "processed"}</span></div><div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-xs text-slate-500 sm:grid-cols-2"><p>Barcode: {item.barcode_data_scan || item.barcode || "-"}</p><p>Serial: {item.serial_number || "-"}</p><p>Carton: {item.pack_ctn_no || "-"}</p><p>Location: {item.location_scan || item.location || "-"}</p><p>Quantity: {item.qty_data_scan ?? item.quantity} {item.uom_scan || ""}</p><p>Package: {item.package_qty ?? "-"} {item.package_type || ""}</p><p>Lot: {item.lot_number || "-"}</p></div></div>{outboundHeader?.status === "packing" && item.id && <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-red-500 hover:bg-red-50" disabled={isSubmit} onClick={async () => { await handleRemoveItem(item.id!, item.outbound_detail_id); await fetchAllDesktopScannedItems(); }}><Trash2 size={15} /></Button>}</div></article>)}</div> : <div className="flex flex-col items-center justify-center py-14 text-center"><Clock3 className="h-9 w-9 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-600">No packing results yet</p><p className="mt-1 max-w-xs text-xs text-slate-400">Select an outbound item from the left panel to start processing.</p></div>;
                            })()}
                        </div>
                        {invPolicy?.require_packing_scan && outboundHeader?.status === "packing" && <div className="border-t border-slate-200 bg-slate-50 p-3"><div className="grid grid-cols-2 gap-2"><Button variant="outline" className="w-full" onClick={() => { setContainerWeight(""); setShowSealContainerDialog(true); }}><Box size={15} className="mr-2" />Seal Container</Button><Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setShowConfirmPackingDialog(true)}><CheckCircle2Icon size={15} className="mr-2" />Confirm Packing</Button></div></div>}
                    </section>
                </div>
            </main>

            <Dialog open={showConfirmPackingDialog} onOpenChange={setShowConfirmPackingDialog}>
                <DialogContent className="bg-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Packing</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        {/* Summary validasi */}
                        {originalListOutboundDetail.some((item) => (item.scan_qty ?? 0) < item.quantity) ? (
                            <div className="space-y-2">
                                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                    <p className="text-sm font-semibold text-red-700 mb-1">⚠️ Incomplete Items</p>
                                    <p className="text-sm text-red-600">
                                        Some items have not been fully scanned. Please complete scanning before confirming.
                                    </p>
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-1">
                                    {originalListOutboundDetail
                                        .filter((item) => (item.scan_qty ?? 0) < item.quantity)
                                        .map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center border rounded px-3 py-2 text-xs font-mono bg-gray-50">
                                                <div className="space-y-0.5">
                                                    <div className="font-semibold text-gray-800">{item.item_code}</div>
                                                    <div className="text-gray-500 truncate max-w-[180px]">{item.item_name}</div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-orange-600 font-bold">{item.scan_qty ?? 0}</span>
                                                    <span className="text-gray-400"> / </span>
                                                    <span className="text-gray-700 font-semibold">{item.quantity}</span>
                                                    <div className="text-gray-400">{item.uom}</div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                    <p className="text-sm font-semibold text-green-700 mb-1">✓ All items complete</p>
                                    <p className="text-sm text-green-600">All items have been fully scanned and ready to confirm.</p>
                                </div>
                                <div className="border rounded-md p-3 space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Outbound No:</span>
                                        <span className="font-semibold">{outboundNo}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Items:</span>
                                        <span className="font-semibold">{originalListOutboundDetail.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Qty:</span>
                                        <span className="font-semibold text-green-600">
                                            {originalListOutboundDetail.reduce((t, i) => t + (i.scan_qty ?? 0), 0)}
                                            {" / "}
                                            {originalListOutboundDetail.reduce((t, i) => t + i.quantity, 0)}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 italic">
                                    This action will finalize the packing for this outbound. Please verify before confirming.
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            disabled={isConfirmingPacking}
                            onClick={() => setShowConfirmPackingDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmPacking}
                            disabled={
                                isConfirmingPacking ||
                                originalListOutboundDetail.some((item) => (item.scan_qty ?? 0) < item.quantity)
                            }
                            className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                            {isConfirmingPacking ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Confirming...</>
                            ) : (
                                "Confirm Packing"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showSealContainerDialog} onOpenChange={setShowSealContainerDialog}>
                <DialogContent className="bg-white sm:max-w-md">
                    <DialogHeader><DialogTitle>Seal Container</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 space-y-1 text-sm">
                            <div className="flex justify-between"><span className="text-gray-600">Outbound No:</span><span className="font-semibold">{outboundNo}</span></div>
                            <div className="flex justify-between"><span className="text-gray-600">Packing No:</span><span className="font-semibold">{packingNo}</span></div>
                            <div className="flex justify-between"><span className="text-gray-600">Container No:</span><span className="font-semibold">{packCtnNo}</span></div>
                            {masterCarton && <div className="flex justify-between"><span className="text-gray-600">Carton Type:</span><span className="font-semibold">{masterCarton.carton_name}</span></div>}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="container_weight" className="text-sm font-medium text-gray-700">
                                Container Weight (kg) <span className="text-red-500">*</span>
                            </label>
                            <Input id="container_weight" type="number" step="0.01" min="0" placeholder="Enter weight in kg..." value={containerWeight} onChange={(e) => setContainerWeight(e.target.value)} autoFocus />
                            {masterCarton && <p className="text-xs text-gray-500">Max weight: {masterCarton.max_weight} kg | Tare weight: {masterCarton.tare_weight} kg</p>}
                        </div>
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={() => { setShowSealContainerDialog(false); setContainerWeight(""); }}>Cancel</Button>
                        <Button onClick={handleConfirmSeal} className="bg-green-600 hover:bg-green-700">Next</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Seal Container Confirmation ── */}
            <Dialog open={showConfirmSealContainer} onOpenChange={setShowConfirmSealContainer}>
                <DialogContent className="bg-white sm:max-w-md">
                    <DialogHeader><DialogTitle>Confirm Seal Container</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                            <p className="text-sm font-semibold text-gray-800 mb-1">⚠️ Confirmation Required</p>
                            <p className="text-sm text-gray-700">Sealing <strong>Container #{packCtnNo}</strong> will prevent adding more items.</p>
                        </div>
                        <div className="border rounded-md p-3 space-y-1 text-sm">
                            <div className="flex justify-between"><span className="text-gray-600">Outbound No:</span><span className="font-medium">{outboundNo}</span></div>
                            <div className="flex justify-between"><span className="text-gray-600">Packing No:</span><span className="font-medium">{packingNo}</span></div>
                            <div className="flex justify-between"><span className="text-gray-600">Container No:</span><span className="font-medium">{packCtnNo}</span></div>
                            <div className="flex justify-between"><span className="text-gray-600">Weight:</span><span className="font-medium text-green-600">{containerWeight} kg</span></div>
                            {masterCarton && <div className="flex justify-between"><span className="text-gray-600">Carton Type:</span><span className="font-medium">{masterCarton.carton_name}</span></div>}
                        </div>
                        <p className="text-xs text-gray-500 italic">Please verify all information before confirming.</p>
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" disabled={isSealingContainer} onClick={() => { setShowConfirmSealContainer(false); setShowSealContainerDialog(true); }}>Back</Button>
                        <Button onClick={handleSealContainerSubmit} disabled={isSealingContainer} className="bg-green-600 hover:bg-green-700">
                            {isSealingContainer ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sealing...</> : "Confirm Seal"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Edit Carton Dialog ── */}
            <Dialog open={showEditCartonDialog} onOpenChange={setShowEditCartonDialog}>
                <DialogContent className="bg-white sm:max-w-md">
                    <DialogHeader><DialogTitle>Change Carton Type</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <Select value={selectedNewCartonId} onValueChange={setSelectedNewCartonId}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="Select new carton type" /></SelectTrigger>
                            <SelectContent>
                                {masterCartonsList.map((c) => (
                                    <SelectItem key={c.id} value={c.id.toString()}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {c.carton_name}
                                                {c.is_default && <span className="ml-2 text-xs text-blue-500">(Default)</span>}
                                                {c.id === masterCarton?.id && <span className="ml-2 text-xs text-green-600">(Current)</span>}
                                            </span>
                                            <span className="text-xs text-gray-500">{c.dimensions} - Max: {c.max_weight}kg</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {getSelectedNewCartonDetails() && (
                            <Card className="p-3 bg-blue-50 border-blue-200">
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Box size={16} className="text-blue-600" />
                                        <span className="font-semibold text-blue-900">{getSelectedNewCartonDetails()?.carton_name}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                                        <div><span className="font-medium">Size:</span> {getSelectedNewCartonDetails()?.dimensions}</div>
                                        <div><span className="font-medium">Max Weight:</span> {getSelectedNewCartonDetails()?.max_weight}kg</div>
                                        <div><span className="font-medium">Volume:</span> {getSelectedNewCartonDetails()?.volume.toLocaleString()} cm³</div>
                                        <div><span className="font-medium">Material:</span> {getSelectedNewCartonDetails()?.material}</div>
                                    </div>
                                    {getSelectedNewCartonDetails()?.description && (
                                        <p className="text-xs text-gray-600 italic">{getSelectedNewCartonDetails()?.description}</p>
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" disabled={isUpdatingCarton} onClick={() => { setShowEditCartonDialog(false); setSelectedNewCartonId(masterCarton?.id.toString() ?? ""); }}>Cancel</Button>
                        <Button onClick={handleUpdateCarton} disabled={isUpdatingCarton || !selectedNewCartonId}>
                            {isUpdatingCarton ? "Updating..." : "Update Carton"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Confirm Update Carton ── */}
            <Dialog open={showConfirmUpdateCarton} onOpenChange={setShowConfirmUpdateCarton}>
                <DialogContent className="bg-white sm:max-w-md">
                    <DialogHeader><DialogTitle>Confirm Change Carton Type</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                            <p className="text-sm font-semibold text-gray-800 mb-1">⚠️ Important Notice</p>
                            <p className="text-sm text-gray-700">All items in <strong>Carton #{packCtnNo}</strong> will be updated to the new carton type.</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center py-2 border-b text-sm">
                                <span className="text-gray-600">Current Carton:</span>
                                <span className="font-semibold text-gray-800">{masterCarton?.carton_name}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b text-sm">
                                <span className="text-gray-600">New Carton:</span>
                                <span className="font-semibold text-blue-600">{getSelectedNewCartonDetails()?.carton_name}</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 italic">This action cannot be undone.</p>
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" disabled={isUpdatingCarton} onClick={() => setShowConfirmUpdateCarton(false)}>Cancel</Button>
                        <Button onClick={handleConfirmUpdateCarton} disabled={isUpdatingCarton} className="bg-blue-600 hover:bg-blue-700">
                            {isUpdatingCarton ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : "Confirm Update"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Detail Scanned Items Dialog ── */}
            <Dialog open={showModalDetail} onOpenChange={setShowModalDetail}>
                <DialogContent className="bg-white max-w-lg">
                    <DialogHeader><DialogTitle className="font-mono">Scanned Items</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <Input className="w-full" placeholder="Search ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        {invPolicy?.require_packing_scan && uniqueCartons.length > 0 && (
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600 whitespace-nowrap">Filter Container:</label>
                                <Select value={selectedCarton} onValueChange={setSelectedCarton}>
                                    <SelectTrigger className="w-full"><SelectValue placeholder="Select carton" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Container</SelectItem>
                                        {uniqueCartons.map((c) => <SelectItem key={c} value={c}>Container {c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2">
                        {filteredScannedItems.length > 0 ? (
                            Object.entries(groupedItems).map(([koli, items]) => {
                                const cartonNo = selectedCarton === "all" ? "ALL" : (items as ScannedItem[])[0]?.pack_ctn_no;
                                return (
                                    <div key={koli} className="p-2 border rounded-md bg-gray-50">
                                        <div className="font-semibold text-sm font-mono mb-2 flex justify-between items-center">
                                            <div>
                                                {invPolicy?.require_packing_scan && cartonNo && cartonNo !== "ALL" && (
                                                    <div className="text-sm text-gray-600">CTN : {cartonNo}</div>
                                                )}
                                                ITEM : {(items as ScannedItem[]).length}, QTY :{" "}
                                                {(items as ScannedItem[]).reduce((t, i) => t + (i.qty_data_scan ?? 0), 0)}
                                            </div>
                                            {invPolicy?.require_packing_scan && cartonNo && cartonNo !== "ALL" && (
                                                <Button variant="destructive" size="sm" className="h-7 text-xs" disabled={isSubmit}
                                                    onClick={() => { setCartonToDelete(cartonNo); setShowDeleteCartonConfirm(true); }}>
                                                    Delete Container
                                                </Button>
                                            )}
                                        </div>

                                        {(items as ScannedItem[]).map((item, index) => (
                                            <div key={index} className={`p-2 border rounded-md mb-2 ${item.status === "in stock" ? "bg-green-100" : "bg-blue-100"}`}>
                                                <div className="text-xs space-y-0.5 font-mono">
                                                    {invPolicy?.require_scan_pick_location && (
                                                        <div><strong>Location:</strong> {item.location_scan}</div>
                                                    )}
                                                    {invPolicy?.require_packing_scan && (
                                                        <>
                                                            <div><strong>PACK:</strong> {item.packing_no}</div>
                                                            <div><strong>CTN:</strong> {item.pack_ctn_no}</div>
                                                        </>
                                                    )}
                                                    <div><strong>EAN:</strong> {item.barcode_data_scan}</div>
                                                    <div><strong>SKU:</strong> {item.item_code}</div>
                                                    {/* {item.is_serial && <div><strong>Serial:</strong> {item.serial_number}</div>} */}
                                                    <div><strong>UNIT SERIAL:</strong> {item.serial_number}</div>
                                                    <div><strong>CTN SERIAL:</strong> {item.case_number}</div>
                                                    <div><strong>QTY:</strong> {item.qty_data_scan} {item.uom_scan} <strong>Lot:</strong> {item.lot_number}</div>
                                                </div>
                                                <div className="flex justify-between items-center mt-2">
                                                    {item.status === "pending" && (
                                                        <Button disabled={isSubmit} className="h-6" variant="destructive" size="sm"
                                                            onClick={() => handleRemoveItem(item.id!, item.outbound_detail_id)}>
                                                            {isSubmit ? "Deleting..." : "Delete"}
                                                        </Button>
                                                    )}
                                                    {/* {outboundHeader.status === "packing" && (
                                                        <Button disabled={isSubmit} className="h-6" variant="destructive" size="sm"
                                                            onClick={() => handleRemoveItem(item.id!, item.outbound_detail_id)}>
                                                            {isSubmit ? "Deleting..." : "Delete"}
                                                        </Button>
                                                    )} */}
                                                    {item.status && <span className="text-xs text-gray-400 font-mono ml-auto">{item.status}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-gray-500 text-sm text-center py-4">
                                {selectedCarton !== "all" ? `No items found in Carton ${selectedCarton}` : "This item has not been scanned."}
                            </div>
                        )}
                    </div>
                    <DialogFooter />
                </DialogContent>
            </Dialog>

            {/* ── Delete Carton Confirmation ── */}
            <Dialog open={showDeleteCartonConfirm} onOpenChange={setShowDeleteCartonConfirm}>
                <DialogContent className="bg-white">
                    <DialogHeader><DialogTitle>Confirm Delete Container</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-2">
                        <p className="text-sm text-gray-600">Are you sure you want to delete all items in Container <strong>{cartonToDelete}</strong>?</p>
                        <p className="text-sm text-red-600">This action cannot be undone.</p>
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" disabled={isSubmit} onClick={() => { setShowDeleteCartonConfirm(false); setCartonToDelete(""); }}>Cancel</Button>
                        <Button variant="destructive" disabled={isSubmit}
                            onClick={() => {
                                const detailId = listOutboundScanned.find((i) => i.pack_ctn_no === cartonToDelete)?.outbound_detail_id;
                                if (detailId) handleRemoveCarton(cartonToDelete, detailId);
                            }}>
                            {isSubmit ? "Deleting..." : "Delete Container"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── List Container Dialog ── */}
            <Dialog open={showListContainerDialog} onOpenChange={setShowListContainerDialog}>
                <DialogContent className="bg-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-semibold text-gray-800">List Container — {outboundNo}</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
                        {listContainerSummary.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-xs">No container data found</div>
                        ) : (
                            listContainerSummary.map((container: any) => {
                                const { pack_ctn_no, qty: totalQty, items: barcodes } = container;
                                const isCurrent = String(pack_ctn_no) === String(packCtnNo);
                                return (
                                    <button
                                        type="button"
                                        key={pack_ctn_no}
                                        disabled={isCurrent}
                                        onClick={() => handleSelectContainer(container)}
                                        className={`w-full rounded-lg border p-3 space-y-1.5 text-left transition-colors ${isCurrent ? "border-blue-400 bg-blue-50 cursor-default" : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/60 cursor-pointer"}`}
                                        title={isCurrent ? "Currently active container" : `Switch active container to CTN #${pack_ctn_no}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Box size={13} className={isCurrent ? "text-blue-600" : "text-gray-500"} />
                                                <span className={`text-xs font-bold font-mono ${isCurrent ? "text-blue-700" : "text-gray-700"}`}>CTN # {pack_ctn_no}</span>
                                                {isCurrent
                                                    ? <span className="text-[10px] bg-blue-600 text-white rounded px-1.5 py-0.5 font-medium">Active</span>
                                                    : <span className="text-[10px] text-blue-600 font-medium">Click to activate</span>}
                                            </div>
                                            <span className="text-xs font-bold text-gray-800">{totalQty} <span className="font-normal text-gray-500">qty</span></span>
                                        </div>
                                        {(barcodes as string[]).length > 0 && (
                                            <div className="flex flex-wrap gap-1 pt-0.5">
                                                {(barcodes as string[]).map((bc, i) => (
                                                    <span key={i} className="text-[10px] font-mono bg-white border border-gray-200 text-gray-600 rounded px-1.5 py-0.5">{bc}</span>
                                                ))}
                                            </div>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                    {listContainerSummary.length > 0 && (
                        <div className="border-t pt-3 flex justify-between text-xs text-gray-600">
                            <span>{listContainerSummary.length} container{listContainerSummary.length !== 1 ? "s" : ""} total</span>
                            <span className="font-semibold text-gray-800">
                                {listContainerSummary.reduce((sum, c) => sum + c.qty, 0)} total qty
                            </span>
                        </div>
                    )}
                    <DialogFooter>
                        <Button size="sm" variant="outline" className="w-full text-xs h-8" onClick={() => setShowListContainerDialog(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* </main> */}



            {/* ── Scan Detail Dialog ── */}
            {showDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex sm:items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center">
                            <h2 className="text-base font-semibold text-gray-800">Scan Detail</h2>
                            <button onClick={closeDialog} className="text-gray-400 hover:text-gray-600 text-2xl p-1 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Close">×</button>
                        </div>

                        <div className="px-4 py-4 pb-6 space-y-4">
                            {/* Item Info */}
                            <div className="p-3 bg-gray-100 rounded-md space-y-1 text-sm text-gray-600">
                                {outboundNo && <p>Picking ID : <span className="font-medium text-gray-800">{outboundNo}</span></p>}
                                {invPolicy?.require_packing_scan && <p>Packing No : <span className="font-medium">{packingNo}</span></p>}
                                {invPolicy?.require_packing_scan && <p>Carton No : <span className="font-semibold text-blue-700">CTN # {packCtnNo || "-"}</span></p>}
                                {invPolicy?.require_scan_pick_location && <p>Location : <span className="font-medium">{scanLocation}</span></p>}
                                <p>EAN : <span className="font-mono font-medium">{scanBarcode}</span></p>
                                {parsedQR?.product && <p>Product : <span className="font-mono font-medium">{parsedQR.product}</span></p>}
                                {isQrMode && parsedQR?.cartonSerial && <p>Carton : <span className="font-mono font-medium">{parsedQR.cartonSerial}</span></p>}
                            </div>

                            {/* Serial Form */}
                            {isSerial ? (
                                <form onSubmit={handleSerialSubmit} className="space-y-3">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Serial Numbers :</label>
                                        {serialInputs.map((serial, index) => (
                                            <div key={index} className="relative">
                                                <Input autoComplete="off" id={`serial-${index}`} className="w-full pr-10" value={serial}
                                                    onChange={(e) => { const n = [...serialInputs]; n[index] = e.target.value; setSerialInputs(n); }} />
                                                {serial && (
                                                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                        onClick={() => { const n = [...serialInputs]; n[index] = ""; setSerialInputs(n); (document.getElementById(`serial-${index}`) as HTMLInputElement)?.focus(); }}>
                                                        <XCircle size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <div className="flex gap-4">
                                            <button type="button" className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                                                onClick={() => setSerialInputs([...serialInputs, ""])}>+ Add Serial</button>
                                            {serialInputs.length > 1 && (
                                                <button type="button" className="text-red-600 hover:text-red-800 text-sm font-semibold"
                                                    onClick={() => setSerialInputs(serialInputs.slice(0, -1))}>− Remove Last</button>
                                            )}
                                        </div>
                                        {serialInputs.length > 1 && (
                                            <div className="text-xs text-gray-500 break-all">
                                                Combined: {serialInputs.filter((s) => s.trim() !== "").join("-")}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Button type="submit" className="w-full" disabled={isSubmit}>
                                            {isSubmit ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" />Loading...</> : "Submit"}
                                        </Button>
                                        <Button type="button" className="w-full" variant="outline" onClick={closeDialog}>Cancel</Button>
                                    </div>
                                </form>
                            ) : (
                                /* Quantity Form */
                                <form onSubmit={handleQuantitySubmit} className="space-y-3">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-600">Package Type</label>
                                            <Select value={selectedPackageType} onValueChange={handlePackageTypeChange}>
                                                <SelectTrigger className="h-10"><SelectValue placeholder="Select package" /></SelectTrigger>
                                                <SelectContent>
                                                    {packageOptions.map((option) => <SelectItem key={option.type} value={option.type}>{option.type} · {option.conversion} {scanUom || "PCS"}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="packageQty" className="text-xs font-semibold text-gray-600">Package Quantity</label>
                                            <Input min={1} step={1} type="number" id="packageQty" className="h-10" value={packageQty} autoComplete="off"
                                                onChange={(e) => updatePackageQuantity(e.target.value)}
                                                onWheel={(e) => (e.target as HTMLInputElement).blur()} />
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3">
                                        <div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-wide text-blue-700">Calculated Quantity</span><span className="text-xl font-bold text-blue-900">{Number(scanQty) || 0} {scanUom || "PCS"}</span></div>
                                        <p className="mt-1 text-xs text-blue-700">{Number(packageQty) || 0} {selectedPackageType} × {getSelectedPackageConversion()} {scanUom || "PCS"}</p>
                                        {desktopActiveDetail && <p className="mt-2 border-t border-blue-100 pt-2 text-xs text-blue-700">Remaining outbound quantity: <strong>{desktopActiveDetail.quantity - (desktopActiveDetail.scan_qty ?? 0)} {desktopActiveDetail.uom || scanUom}</strong></p>}
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Button type="submit" className="w-full" disabled={isSubmit}>
                                            {isSubmit ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" />Loading...</> : "Submit"}
                                        </Button>
                                        <Button type="button" className="w-full" variant="outline" onClick={closeDialog}>Cancel</Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default CheckingPage;
