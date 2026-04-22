/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRouter } from "next/router";
import { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/mobile/PageHeader";
import { Loader2 } from "lucide-react";
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
import { Product } from "@/types/item";
import DateInputMobile from "@/components/mobile/DateInputMobile";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScanItem {
    inboundNo: string;
    id?: number;
    location: string;
    barcode: string;
    serial: string;
    qaStatus: string;
    scanType?: string;
    qtyScan: number;
    RecDate?: string;
    prodDate?: string;
    expDate?: string;
    lotNo?: string;
    caseNumber?: string;
    itemModel?: string;
    qrRaw?: string;
    uploaded: boolean;
    uom?: string;
    innerSerials?: string[];
}

interface ResultCheckItem {
    ID: number;
    inbound_no: string;
    item_code: string;
    barcode: string;
    quantity: number;
    owner_code?: string;
    uom?: string;
    exp_date?: string;
    prod_date?: string;
    lot_number?: string;
}

interface InboundDetail {
    id: number;
    inbound_no: string;
    inbound_detail_id: number;
    item_name?: string;
    item_code: string;
    barcode: string;
    quantity: number;
    scan_qty: number;
    is_serial: boolean;
    owner_code?: string;
    uom?: string;
    exp_date?: string;
    prod_date?: string;
    lot_number?: string;
}

interface ScannedItem {
    id?: number;
    inbound_detail_id: number;
    barcode: string;
    serial_number: string;
    serial_number_2?: string;
    pallet: string;
    location: string;
    qa_status: string;
    whs_code: string;
    scan_type: string;
    quantity: number;
    status?: string;
    is_serial?: boolean;
    prod_date?: string;
    exp_date?: string;
    lot_number?: string;
    case_number?: string;
    item_model?: string;
    uom?: string;
    product?: Product;
}

// ─── QR Code Parser ───────────────────────────────────────────────────────────

/**
 * Parse QR code format: (1)SKU=30047334(2)EAN=6933257941045(3)PRODUCT=...
 * Returns null if format tidak cocok.
 */
interface ParsedQRData {
    sku?: string;       // item_code
    ean?: string;       // barcode
    product?: string;   // item_name
    brand?: string;
    model?: string;
    serial?: string;
    cartonSerial?: string; // case_number
    batch?: string;        // lot_number
    mfgDate?: string;      // prod_date (yyyyMMdd → yyyy-MM-dd)
    qtyPerCarton?: number; // qty suggestion
    labelType?: "UNIT" | "CARTON" | "UNKNOWN";
    innerSerialStart?: string;
    innerSerialEnd?: string;
    innerSerials?: string[];
    innerSerialRangeError?: string;
}

// function parseQRCode(raw: string): ParsedQRData | null {
//   // Pola: (N)KEY=VALUE — bisa multiline atau inline
//   const pattern = /\((\d+)\)([A-Z_]+)=([^(]*)/g;
//   const map: Record<string, string> = {};
//   let match: RegExpExecArray | null;
//   let found = false;

//   while ((match = pattern.exec(raw)) !== null) {
//     found = true;
//     map[match[2].trim()] = match[3].trim();
//   }

//   if (!found) return null;

//   // Format MFG_DATE dari yyyyMMdd → yyyy-MM-dd
//   let mfgDate: string | undefined;
//   if (map["MFG_DATE"] && map["MFG_DATE"].length === 8) {
//     const d = map["MFG_DATE"];
//     mfgDate = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
//   }

//   return {
//     sku: map["SKU"],
//     ean: map["EAN"],
//     product: map["PRODUCT"],
//     brand: map["BRAND"],
//     model: map["MODEL"],
//     cartonSerial: map["CARTON_SERIAL"],
//     batch: map["BATCH"],
//     mfgDate,
//     qtyPerCarton: map["QTY_PER_CARTON"] ? Number(map["QTY_PER_CARTON"]) : undefined,
//   };
// }

// function parseQRCode(raw: string): ParsedQRData | null {
//     const pattern = /\((\d+)\)([A-Z_]+)=([^(]*)/g
//     const map: Record<string, string> = {}
//     let match: RegExpExecArray | null
//     let found = false

//     while ((match = pattern.exec(raw)) !== null) {
//         found = true
//         map[match[2].trim()] = match[3].trim()
//     }

//     if (!found) return null

//     let mfgDate: string | undefined
//     if (map["MFG_DATE"]?.length === 8) {
//         const d = map["MFG_DATE"]
//         mfgDate = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
//     }

//     // ← deteksi tipe label
//     const labelType = map["SERIAL"]
//         ? "UNIT"
//         : map["CARTON_SERIAL"]
//             ? "CARTON"
//             : "UNKNOWN"

//     return {
//         sku: map["SKU"],
//         ean: map["EAN"],
//         product: map["PRODUCT"],
//         brand: map["BRAND"],
//         model: map["MODEL"],
//         serial: map["SERIAL"],          // ← tambah
//         cartonSerial: map["CARTON_SERIAL"],
//         batch: map["BATCH"],
//         mfgDate,
//         qtyPerCarton: map["QTY_PER_CARTON"] ? Number(map["QTY_PER_CARTON"]) : undefined,
//         labelType,                            // ← tambah
//     }
// }

function parseQRCode(raw: string): ParsedQRData | null {
    const pattern = /\((\d+)\)([A-Z_]+)=([^(]*)/g
    const map: Record<string, string> = {}
    let match: RegExpExecArray | null
    let found = false

    while ((match = pattern.exec(raw)) !== null) {
        found = true
        map[match[2].trim()] = match[3].trim()
    }

    if (!found) return null

    let mfgDate: string | undefined
    if (map["MFG_DATE"]?.length === 8) {
        const d = map["MFG_DATE"]
        mfgDate = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
    }

    const labelType = map["SERIAL"]
        ? "UNIT"
        : map["CARTON_SERIAL"]
            ? "CARTON"
            : "UNKNOWN"

    // ── Generate inner serials dari range ──────────────────────────────
    // ── Generate inner serials ─────────────────────────────────────────────
    let innerSerials: string[] | undefined
    let innerSerialRangeError: string | undefined
    const start = map["INNER_SERIAL_START"]
    const end = map["INNER_SERIAL_END"]
    const qty = map["QTY_PER_CARTON"] ? Number(map["QTY_PER_CARTON"]) : undefined

    if (start) {
        const numMatch = start.match(/^(.*?)(\d+)$/)

        if (numMatch) {
            const prefix = numMatch[1]
            const startNum = parseInt(numMatch[2], 10)
            const padLen = numMatch[2].length

            let endNum: number | undefined

            if (end) {
                // Prioritas 1: pakai INNER_SERIAL_END
                endNum = parseInt(end.replace(prefix, ""), 10)
            } else if (qty && qty > 0) {
                // Prioritas 2: hitung dari QTY_PER_CARTON
                endNum = startNum + qty - 1
            }

            if (endNum !== undefined && !isNaN(startNum) && !isNaN(endNum) && endNum >= startNum) {
                innerSerials = []
                for (let i = startNum; i <= endNum; i++) {
                    innerSerials.push(prefix + String(i).padStart(padLen, "0"))
                }

                // ── Validasi silang ───────────────────────────────────────
                const lastGenerated = innerSerials[innerSerials.length - 1]

                // Cek END jika ada
                if (end && lastGenerated !== end) {
                    innerSerialRangeError = `Range tidak valid: last generated "${lastGenerated}" ≠ INNER_SERIAL_END "${end}"`
                    innerSerials = undefined
                }

                // Cek QTY jika ada
                if (!innerSerialRangeError && qty && innerSerials && innerSerials.length !== qty) {
                    innerSerialRangeError = `Jumlah serial ${innerSerials.length} ≠ QTY_PER_CARTON ${qty}`
                    innerSerials = undefined
                }

            } else if (start) {
                innerSerialRangeError = "Cannot parse INNER_SERIAL_END / Invalid number format in INNER_SERIAL_START or END"
            }
        } else {
            innerSerialRangeError = "Cannot parse INNER_SERIAL_START format (expecting prefix + number)"
        }
    }

    return {
        sku: map["SKU"],
        ean: map["EAN"],
        product: map["PRODUCT"],
        brand: map["BRAND"],
        model: map["MODEL"],
        serial: map["SERIAL"],
        cartonSerial: map["CARTON_SERIAL"],
        batch: map["BATCH"],
        mfgDate,
        qtyPerCarton: qty,
        labelType,
        innerSerialStart: start,
        innerSerialEnd: end,
        innerSerials,
        innerSerialRangeError,
    }
}

// ─── Toggle Component ────────────────────────────────────────────────────────

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (val: boolean) => void;
    labelOff?: string;
    labelOn?: string;
}

const ToggleSwitch = ({ checked, onChange, labelOff = "Off", labelOn = "On" }: ToggleSwitchProps) => (
    <div className="flex items-center gap-2 text-sm">
        <span className={`${!checked ? "font-semibold text-gray-800" : "text-gray-400"}`}>{labelOff}</span>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-blue-500" : "bg-gray-300"
                }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"
                    }`}
            />
        </button>
        <span className={`${checked ? "font-semibold text-gray-800" : "text-gray-400"}`}>{labelOn}</span>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const CheckingPage = () => {
    const router = useRouter();
    const { inbound } = router.query;

    // ── Scan mode ──────────────────────────────────────────────────────────────
    const [isQrMode, setIsQrMode] = useState(false);
    const [qrRawInput, setQrRawInput] = useState("");
    const [parsedQR, setParsedQR] = useState<ParsedQRData | null>(null);

    // ── Scan fields ────────────────────────────────────────────────────────────
    const [scanQa, setScanQa] = useState("A");
    const [scanLocation, setScanLocation] = useState("");
    const [scanBarcode, setScanBarcode] = useState("");

    const [serialInputs, setSerialInputs] = useState([""]);
    const [searchInboundDetail, setSearchInboundDetail] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showModalDetail, setShowModalDetail] = useState(false);
    const [invPolicy, setInvPolicy] = useState<InventoryPolicy | undefined>();

    const [prodDate, setProdDate] = useState("");
    const [itemModel, setItemModel] = useState("");
    const [expDate, setExpDate] = useState("");
    const [lotNo, setLotNo] = useState("");
    const [caseNumber, setCaseNumber] = useState("");
    const [uom, setUom] = useState("");
    const [scanQty, setScanQty] = useState<string | number>(1);

    const [uniqueProdDates, setUniqueProdDates] = useState<string[]>([]);
    const [uniqueExpDates, setUniqueExpDates] = useState<string[]>([]);
    const [uniqueLotNos, setUniqueLotNos] = useState<string[]>([]);
    const [uniqueQtys, setUniqueQtys] = useState<number[]>([]);

    const [showDialog, setShowDialog] = useState(false);
    const [isSerial, setIsSerial] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmit, setIsSubmit] = useState(false);

    const [listInboundDetailAll, setListInboundDetailAll] = useState<InboundDetail[]>([]);
    const [listInboundDetail, setListInboundDetail] = useState<InboundDetail[]>([]);
    const [listInboundScanned, setListInboundScanned] = useState<ScannedItem[]>([]);
    const [showAllInboundDetails, setShowAllInboundDetails] = useState(true);
    const [resultCheckItems, setResultCheckItems] = useState<ResultCheckItem[]>([]);
    const [innerSerialError, setInnerSerialError] = useState(false)


    const handleQrInputChange = (raw: string) => {
        setQrRawInput(raw)
        const parsed = parseQRCode(raw)

        if (parsed) {
            setParsedQR(parsed)

            if (parsed.innerSerialRangeError) {
                setInnerSerialError(true) // ← block submit
                eventBus.emit("showAlert", {
                    title: "Serial Range Error!",
                    description: parsed.innerSerialRangeError,
                    type: "error",
                })
                return
            }

            // Reset error jika QR valid
            setInnerSerialError(false)

            if (parsed.ean) setScanBarcode(parsed.ean)
            if (parsed.mfgDate) setProdDate(parsed.mfgDate)
            if (parsed.batch) setLotNo(parsed.batch)

            if (parsed.labelType === "UNIT") {
                if (parsed.serial) setSerialInputs([parsed.serial])
                setScanQty(1)
            }

            if (parsed.labelType === "CARTON") {
                if (parsed.cartonSerial) setCaseNumber(parsed.cartonSerial)
                if (parsed.innerSerials && parsed.innerSerials.length > 0) {
                    setSerialInputs(parsed.innerSerials)
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

    // Reset QR state saat toggle mode
    const handleModeToggle = (qr: boolean) => {
        setIsQrMode(qr);
        setQrRawInput("");
        setParsedQR(null);
        setScanBarcode("");
        setProdDate("");
        setLotNo("");
        setCaseNumber("");
        setScanQty(1);
        setItemModel("");
        setInnerSerialError(false)
        setTimeout(() => {
            const id = qr ? "qr-input" : "barcode";
            document.getElementById(id)?.focus();
        }, 50);
    };

    // ── Fetch helpers ──────────────────────────────────────────────────────────
    const fetchInboundDetail = useCallback(async () => {
        try {
            const response = await api.get("/mobile/inbound/detail/" + inbound);
            const data = await response.data;
            if (data.success) {
                const filtered: InboundDetail[] = data.data.map((item: any) => ({
                    id: item.ID,
                    inbound_detail_id: item.ID,
                    item_code: item.item_code,
                    item_name: item.item_name,
                    barcode: item.barcode,
                    quantity: item.quantity,
                    scan_qty: item.scan_qty,
                    is_serial: item.is_serial,
                    uom: item.uom,
                    owner_code: item.owner_code,
                    exp_date: item.exp_date,
                    prod_date: item.prod_date,
                    lot_number: item.lot_number,
                }));
                setListInboundDetailAll(filtered);
            }
        } catch (error) {
            console.error("Error fetching inbound detail:", error);
        }
    }, [inbound]);

    const fetchScannedItems = useCallback(async (id?: number) => {
        if (!id) return;
        try {
            const response = await api.get("/mobile/inbound/scan/" + id);
            const data = await response.data;
            if (data.success) {
                const filtered: ScannedItem[] = data.data.map((item: any) => ({
                    id: item.ID,
                    inbound_detail_id: item.inbound_detail_id,
                    barcode: item.barcode,
                    serial_number: item.serial_number,
                    serial_number_2: item.serial_number_2,
                    pallet: item.pallet,
                    location: item.location,
                    qa_status: item.qa_status,
                    whs_code: item.whs_code,
                    scan_type: item.scan_type,
                    quantity: item.quantity,
                    status: item.status,
                    prod_date: item.prod_date,
                    uom: item.uom,
                    product: item.product,
                    lot_number: item.lot_number,
                    case_number: item.case_number,
                    item_model: item.item_model,
                }));
                setListInboundScanned(filtered);
            }
        } catch (error) {
            console.error("Error fetching scanned items:", error);
        }
    }, []);

    const fetchPolicy = useCallback(async (owner?: string) => {
        if (!owner) return;
        try {
            const response = await api.get("/inventory/policy?owner=" + owner);
            const data = await response.data;
            if (data.success) {
                setInvPolicy(data.data.inventory_policy);
            }
        } catch (error) {
            console.error("Error fetching policy:", error);
        }
    }, []);

    // ── Effects ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (inbound) fetchInboundDetail();
    }, [inbound]);

    // Single unified filter effect — fix bug double useEffect + filter not applied
    useEffect(() => {
        let result = showAllInboundDetails
            ? listInboundDetailAll
            : listInboundDetailAll.filter((item) => item.quantity !== item.scan_qty);

        if (searchInboundDetail.trim()) {
            const term = searchInboundDetail.toLowerCase();
            result = result.filter((item) =>
                item.item_name.toLowerCase().includes(term) ||
                item.item_code.toLowerCase().includes(term) ||
                item.barcode.toLowerCase().includes(term)
            );
        }

        setListInboundDetail(result);
    }, [listInboundDetailAll, showAllInboundDetails, searchInboundDetail]);

    useEffect(() => {
        if (listInboundDetailAll.length > 0) {
            fetchPolicy(listInboundDetailAll[0].owner_code);
        }
    }, [listInboundDetailAll]);

    useEffect(() => {
        if (!showModalDetail && inbound) {
            fetchInboundDetail();
        }
    }, [showModalDetail]);

    // Auto-focus saat dialog terbuka
    useEffect(() => {
        if (!showDialog) return;
        const timeoutId = setTimeout(() => {
            if (isSerial) {
                (document.getElementById("serial-0") as HTMLInputElement)?.focus();
            } else {
                (document.getElementById("qty") as HTMLInputElement)?.focus();
            }
        }, 100);
        return () => clearTimeout(timeoutId);
    }, [showDialog, isSerial]);

    // ── Scan handlers ──────────────────────────────────────────────────────────
    const handleScan = async () => {
        if (!scanLocation.trim() || !scanBarcode.trim()) return;
        if (isSerial && serialInputs.every((s) => s.trim() === "")) {
            eventBus.emit("showAlert", {
                title: "Error!",
                description: "Serial number cannot be empty.",
                type: "error",
            });
            return;
        }

        let serialNumber =
            serialInputs.length > 1
                ? serialInputs.filter((s) => s.trim() !== "").join("-")
                : serialInputs[0]?.trim() ?? "";

        if (isLoading || isSubmit) return;
        setIsLoading(true);
        setIsSubmit(true);

        const newItem: ScanItem = {
            inboundNo: Array.isArray(inbound) ? inbound[0] : (inbound ?? ""),
            id: 0,
            location: scanLocation.trim(),
            barcode: scanBarcode.trim(),
            qaStatus: scanQa,
            serial: serialNumber,
            qtyScan: scanQty as number,
            prodDate: prodDate,
            expDate: expDate,
            lotNo: lotNo,
            caseNumber: caseNumber,
            qrRaw: isQrMode ? qrRawInput : undefined,
            itemModel: parsedQR?.model ?? "",
            innerSerials: parsedQR?.innerSerials ?? [],
            uploaded: false,
        };

        console.log("Submitting scan:", newItem);
        // return; // <-- untuk testing, comment out saat sudah siap

        try {
            const response = await api.post("/mobile/inbound/scan", newItem);
            const data = await response.data;
            if (data.success) {
                eventBus.emit("showAlert", {
                    title: "Success!",
                    description: data.message,
                    type: "success",
                });
                fetchInboundDetail();
                if (isSerial) {
                    setSerialInputs(serialInputs.map(() => ""));
                    (document.getElementById("serial-0") as HTMLInputElement)?.focus();
                } else {
                    closeDialog();
                }
            }
        } catch (error) {
            console.error("Error submitting scan:", error);
        } finally {
            setTimeout(() => {
                setIsLoading(false);
                setIsSubmit(false);
            }, 900);
        }
    };

    const handleBarcodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!scanBarcode.trim()) {
            document.getElementById(isQrMode ? "qr-input" : "barcode")?.focus();
            return;
        }
        if (!scanLocation.trim()) {
            document.getElementById("location")?.focus();
            return;
        }

        const newItem = {
            inboundNo: Array.isArray(inbound) ? inbound[0] : (inbound ?? ""),
            id: 0,
            location: scanLocation.trim(),
            barcode: scanBarcode.trim(),
            scanType: "BARCODE",
            qaStatus: scanQa,
            serial: "",
            qtyScan: scanQty as number,
            uploaded: false,
        };

        if (isSubmit) return;
        setIsSubmit(true);

        try {
            const response = await api.post("/mobile/inbound/check", newItem);
            const res = await response.data;
            if (res.success) {
                const data = (res.data ?? []) as Array<{
                    prod_date: string;
                    exp_date: string;
                    lot_number: string;
                    quantity: number;
                    uom: string;
                }>;

                if (res.data?.length > 0) setResultCheckItems(res.data);

                const prodDates: string[] = [...new Set(data.map((d) => d.prod_date))];
                const expDates: string[] = [...new Set(data.map((d) => d.exp_date))];
                const lotNos: string[] = [...new Set(data.map((d) => d.lot_number))];
                const qtys: number[] = [...new Set(data.map((d) => d.quantity))];

                setUniqueProdDates(prodDates);
                setUniqueExpDates(expDates);
                setUniqueLotNos(lotNos);
                setUniqueQtys(qtys);

                if (data.length > 0) {
                    setUom(data[0].uom);
                    // Auto-fill satu nilai unik
                    if (prodDates.length === 1 && !prodDate) setProdDate(prodDates[0]);
                    if (expDates.length === 1 && !expDate) setExpDate(expDates[0]);
                    if (lotNos.length === 1 && !lotNo) setLotNo(lotNos[0]);
                }

                // QR mode: field sudah di-fill dari parseQRCode, jangan overwrite kecuali kosong
                setIsSerial(!!res.is_serial);
                if (res.is_serial) setScanQty(1);
                setShowDialog(true);
            }
        } catch (error) {
            console.error("Error checking item:", error);
        } finally {
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
        handleScan();
    };

    const handleRemoveItem = async (id: number, inbound_detail_id: number) => {
        if (isSubmit) return;
        setIsSubmit(true);
        try {
            const response = await api.delete("/mobile/inbound/scan/" + id);
            const data = await response.data;
            if (data.success) {
                fetchScannedItems(inbound_detail_id);
                fetchInboundDetail();
            }
        } catch (error) {
            console.error("Error deleting item:", error);
        } finally {
            setIsSubmit(false);
        }
    };

    const handleConfirmPutaway = async (inbound_no: string) => {
        try {
            const response = await api.put(
                "/mobile/inbound/scan/putaway/" + inbound_no,
                { inboundNo: inbound_no }
            );
            const data = await response.data;
            if (data.success) {
                setShowConfirmModal(false);
                eventBus.emit("showAlert", {
                    title: "Success!",
                    description: data.message ?? "Putaway confirmed",
                    type: "success",
                });
            }
        } catch (error) {
            console.error("Error putaway:", error);
        }
    };

    const closeDialog = () => {
        setShowDialog(false);
        setSerialInputs([""]);
        setScanBarcode("");
        setScanQty(1);
        setProdDate("");
        setExpDate("");
        setLotNo("");
        setCaseNumber("");
        setQrRawInput("");
        setParsedQR(null);
        setInnerSerialError(false);
        setTimeout(() => {
            document.getElementById(isQrMode ? "qr-input" : "barcode")?.focus();
        }, 50);
    };

    // ── Derived ────────────────────────────────────────────────────────────────
    const filteredScannedItems = listInboundScanned.filter((item) => {
        const term = searchTerm.toLowerCase();
        if (!term) return true;
        return (
            item.id?.toString().includes(term) ||
            item.inbound_detail_id.toString().includes(term) ||
            item.barcode.toLowerCase().includes(term) ||
            item.serial_number.toLowerCase().includes(term) ||
            item.location.toLowerCase().includes(term) ||
            item.lot_number.toLowerCase().includes(term) ||
            item.pallet.toLowerCase().includes(term) ||
            item.case_number.toLowerCase().includes(term) ||
            item.item_model?.toLowerCase().includes(term) ||
            (item.prod_date ?? "").toLowerCase().includes(term)
        );
    });

    const totalScanQty = listInboundDetail.reduce((t, i) => t + i.scan_qty, 0);
    const totalPlanQty = listInboundDetail.reduce((t, i) => t + i.quantity, 0);
    const inboundNo = Array.isArray(inbound) ? inbound[0] : (inbound ?? "");

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <>
            <PageHeader title={`Checking ${inboundNo}`} showBackButton />

            <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-24 max-w-md mx-auto">

                {/* ── Scan Input Card ── */}
                <Card className="mb-4">
                    <CardContent className="p-4 space-y-3">
                        {/* Mode Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Scan Mode</span>
                            <ToggleSwitch
                                checked={isQrMode}
                                onChange={handleModeToggle}
                                labelOff="EAN"
                                labelOn="QR Code"
                            />
                        </div>

                        <form onSubmit={handleBarcodeSubmit} className="space-y-2">
                            {/* Pallet ID */}
                            <div className="relative">
                                <label htmlFor="location" className="text-sm text-gray-600">
                                    Pallet ID :
                                </label>
                                <div className="flex items-center mt-1">
                                    <Input
                                        autoComplete="off"
                                        autoCorrect="off"
                                        autoCapitalize="off"
                                        spellCheck={false}
                                        id="location"
                                        className="w-full pr-10"
                                        value={scanLocation}
                                        onChange={(e) => setScanLocation(e.target.value)}
                                        autoFocus
                                    />
                                    {scanLocation && (
                                        <button
                                            type="button"
                                            className="absolute right-2 top-11 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            onClick={() => {
                                                setScanLocation("");
                                                document.getElementById("location")?.focus();
                                            }}
                                        >
                                            <XCircle size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* EAN Mode */}
                            {!isQrMode && (
                                <div className="relative">
                                    <label htmlFor="barcode" className="text-sm text-gray-600">
                                        EAN :
                                    </label>
                                    <Input
                                        autoComplete="off"
                                        id="barcode"
                                        className="w-full mt-1 pr-10"
                                        value={scanBarcode}
                                        onChange={(e) => setScanBarcode(e.target.value)}
                                    />
                                    {scanBarcode && (
                                        <button
                                            type="button"
                                            className="absolute right-2 top-11 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            onClick={() => {
                                                setScanBarcode("");
                                                document.getElementById("barcode")?.focus();
                                            }}
                                        >
                                            <XCircle size={18} />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* QR Code Mode */}
                            {isQrMode && (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <label htmlFor="qr-input" className="text-sm text-gray-600">
                                            QR Code :
                                        </label>
                                        <Input
                                            autoComplete="off"
                                            id="qr-input"
                                            className="w-full mt-1 pr-10 font-mono text-xs"
                                            placeholder="Scan QR code here..."
                                            value={qrRawInput}
                                            onChange={(e) => handleQrInputChange(e.target.value)}
                                        />
                                        {qrRawInput && (
                                            <button
                                                type="button"
                                                className="absolute right-2 top-11 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                onClick={() => {
                                                    setQrRawInput("");
                                                    setParsedQR(null);
                                                    setScanBarcode("");
                                                    setInnerSerialError(false);
                                                    document.getElementById("qr-input")?.focus();
                                                }}
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Preview hasil parse QR */}
                                    {parsedQR && (
                                        <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs font-mono space-y-0.5">
                                            {parsedQR.labelType && (
                                                <div>
                                                    <span className="text-gray-500">Type:</span>{" "}
                                                    <span className={parsedQR.labelType === "UNIT" ? "text-purple-600 font-semibold" : "text-blue-600 font-semibold"}>
                                                        {parsedQR.labelType === "UNIT" ? "Unit / Serial" : "Master Carton"}
                                                    </span>
                                                </div>
                                            )}
                                            {parsedQR.sku && <div><span className="text-gray-500">SKU:</span> {parsedQR.sku}</div>}
                                            {parsedQR.ean && <div><span className="text-gray-500">EAN:</span> {parsedQR.ean}</div>}
                                            {parsedQR.product && <div><span className="text-gray-500">Product:</span> {parsedQR.product}</div>}
                                            {parsedQR.model && <div><span className="text-gray-500">Model:</span> {parsedQR.model}</div>}
                                            {parsedQR.serial && <div><span className="text-gray-500">Serial:</span> {parsedQR.serial}</div>}        {/* ← tambah */}
                                            {parsedQR.mfgDate && <div><span className="text-gray-500">MFG Date:</span> {parsedQR.mfgDate}</div>}
                                            {parsedQR.batch && <div><span className="text-gray-500">Batch:</span> {parsedQR.batch}</div>}
                                            {parsedQR.cartonSerial && <div><span className="text-gray-500">Carton Serial:</span> {parsedQR.cartonSerial}</div>}
                                            {parsedQR.qtyPerCarton && <div><span className="text-gray-500">Qty/Carton:</span> {parsedQR.qtyPerCarton}</div>}
                                            {parsedQR?.innerSerialStart && (
                                                <div>
                                                    <span className="text-gray-500">Serial Range:</span>{" "}
                                                    <span className="text-green-700 font-semibold">
                                                        {parsedQR.innerSerialStart} → {parsedQR.innerSerialEnd}
                                                    </span>
                                                </div>
                                            )}
                                            {parsedQR?.innerSerials && (
                                                <div>
                                                    <span className="text-gray-500">Generated:</span>{" "}
                                                    <span className="text-green-600">{parsedQR.innerSerials.length} serials</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {qrRawInput && !parsedQR && (
                                        <div className="text-xs text-red-500">
                                            Format QR tidak dikenali. Pastikan format: (1)SKU=...
                                        </div>
                                    )}
                                </div>
                            )}

                            <Button
                                disabled={isSubmit || (!scanBarcode.trim()) || innerSerialError}
                                type="submit"
                                className="w-full mt-2"
                            >
                                {isSubmit ? (
                                    <>
                                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                                        Loading...
                                    </>
                                ) : "Submit"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* ── Total Qty ── */}
                <div className="flex justify-center">
                    <span className="text-sm text-gray-600">
                        Total Qty :{" "}
                        <span className="font-semibold">
                            {totalScanQty} / {totalPlanQty}
                        </span>
                    </span>
                </div>

                {/* ── Inbound Detail List ── */}
                <Card>
                    <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">Show Pending</span>
                            <ToggleSwitch
                                checked={showAllInboundDetails}
                                onChange={setShowAllInboundDetails}
                                labelOff="Pending"
                                labelOn="All"
                            />
                        </div>

                        <Input
                            className="w-full"
                            placeholder="Search item code / barcode..."
                            value={searchInboundDetail}
                            onChange={(e) => setSearchInboundDetail(e.target.value)}
                        />

                        {listInboundDetail.length > 0 ? (
                            <ul className="space-y-3">
                                {listInboundDetail.map((item, idx) => (
                                    <li
                                        key={idx}
                                        onClick={() => {
                                            fetchScannedItems(item.inbound_detail_id);
                                            setShowModalDetail(true);
                                        }}
                                        className="flex flex-col border p-3 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="text-sm space-y-1">
                                            <div className="flex justify-between">
                                                <div className="font-mono text-xs space-y-0.5">
                                                    <div><span className="text-gray-500">Item Name:</span> {item.item_name}</div>
                                                    <div><span className="text-gray-500">Item Code:</span> {item.item_code}</div>
                                                    <div><span className="text-gray-500">EAN:</span> {item.barcode}</div>
                                                    {/* {invPolicy?.use_production_date && item.prod_date && (
                                                        <div><span className="text-gray-500">Prod Date:</span> {item.prod_date}</div>
                                                    )}
                                                    {invPolicy?.require_expiry_date && item.exp_date && (
                                                        <div><span className="text-gray-500">Exp Date:</span> {item.exp_date}</div>
                                                    )}
                                                    {invPolicy?.use_lot_no && item.lot_number && (
                                                        <div><span className="text-gray-500">Lot No:</span> {item.lot_number}</div>
                                                    )} */}
                                                    <div>
                                                        <span className="text-gray-500">Scanned:</span>{" "}
                                                        <span className={item.scan_qty >= item.quantity ? "text-green-600 font-semibold" : "text-orange-500 font-semibold"}>
                                                            {item.scan_qty}
                                                        </span>
                                                        {" / "}{item.quantity}{" "}
                                                        <span className="text-gray-500">{item.uom}</span>
                                                    </div>
                                                </div>
                                                {item.is_serial && (
                                                    <div className="text-xs text-right">
                                                        <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-xs">SN</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-sm text-gray-400 text-center py-4">Item not found.</div>
                        )}
                    </CardContent>
                </Card>

                {/* ── Putaway Confirmation Dialog ── */}
                <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
                    <DialogContent className="bg-white">
                        <DialogHeader>
                            <DialogTitle>Putaway Confirmation</DialogTitle>
                        </DialogHeader>
                        <p>Are you sure you want to confirm putaway for <strong>{inboundNo}</strong>?</p>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setShowConfirmModal(false)}>
                                Batal
                            </Button>
                            <Button onClick={() => handleConfirmPutaway(inboundNo)}>
                                Confirm
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ── Detail Scanned Items Dialog ── */}
                <Dialog open={showModalDetail} onOpenChange={setShowModalDetail}>
                    <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="bg-white">
                        <DialogHeader>
                            <DialogTitle>Detail Scanned Items</DialogTitle>
                        </DialogHeader>

                        <Input
                            className="w-full"
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        <div className="text-sm text-gray-500">
                            Total Scanned: {filteredScannedItems.length}
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-2">
                            {filteredScannedItems.length > 0 ? (
                                filteredScannedItems.map((item, index) => (
                                    <div
                                        key={index}
                                        className={`p-3 border rounded-lg transition-colors ${item.status === "in stock" ? "bg-green-50" : "bg-blue-50"
                                            }`}
                                    >
                                        <div className="text-xs space-y-1">
                                            <div className="flex justify-between">
                                                <span><strong>EAN:</strong> {item.barcode}</span>
                                                <span className="text-gray-400 text-xs">{item.status}</span>
                                            </div>
                                            {/* {item.product?.has_serial === "Y" && ( */}
                                            {"Y" === "Y" && (
                                                <div><strong>Serial:</strong> {item.serial_number}</div>
                                            )}
                                            {"Y" === "Y" && (
                                                <div><strong>CTN No:</strong> {item.case_number}</div>
                                            )}
                                            {/* {invPolicy?.use_production_date && item.prod_date && ( */}
                                            {"Y" === "Y" && item.prod_date && (
                                                <div><strong>Mfg Date:</strong> {item.prod_date}</div>
                                            )}
                                            <div><strong>Pallet ID:</strong> {item.location}</div>
                                            <div><strong>Lot No:</strong> {item.lot_number}</div>
                                            <div>
                                                <strong>Qty / Unit:</strong> {item.quantity} {item.uom}
                                            </div>
                                        </div>

                                        {item.status === "pending" && (
                                            <div className="mt-2">
                                                <Button
                                                    className="h-6"
                                                    disabled={isSubmit}
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleRemoveItem(item.id!, item.inbound_detail_id)}
                                                >
                                                    {isSubmit ? "Deleting..." : "Delete"}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-500 text-sm text-center py-4">No items found</div>
                            )}
                        </div>

                        <DialogFooter />
                    </DialogContent>
                </Dialog>
            </div>

            {/* ── Scan Detail Dialog (Serial / Qty) ── */}
            {showDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex sm:items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
                            <h2 className="text-base font-semibold text-gray-800">Scan Detail</h2>
                            <button
                                onClick={closeDialog}
                                className="text-gray-400 hover:text-gray-600 text-2xl p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                aria-label="Close dialog"
                            >
                                ×
                            </button>
                        </div>

                        <div className="px-4 py-4 pb-6 space-y-4">
                            {/* Item Info */}
                            <div className="p-3 bg-gray-50 rounded-md space-y-1">
                                <p className="text-xs text-gray-600">
                                    EAN : <span className="font-mono font-semibold">{scanBarcode}</span>
                                </p>
                                {resultCheckItems[0]?.item_code && (
                                    <p className="text-xs text-gray-600">
                                        Item Code : <span className="font-mono font-semibold">{resultCheckItems[0].item_code}</span>
                                    </p>
                                )}
                                {parsedQR?.product && (
                                    <p className="text-xs text-gray-600">
                                        Product : <span className="font-mono font-semibold">{parsedQR.product}</span>
                                    </p>
                                )}
                                {parsedQR?.model && (
                                    <p className="text-xs text-gray-600">
                                        Model : <span className="font-mono font-semibold">{parsedQR.model}</span>
                                    </p>
                                )}
                                {scanLocation && (
                                    <p className="text-xs text-gray-600">
                                        Pallet ID : <span className="font-mono font-semibold">{scanLocation}</span>
                                    </p>
                                )}
                                {caseNumber && (
                                    <p className="text-xs text-gray-600">
                                        Carton Serial : <span className="font-mono font-semibold">{caseNumber}</span>
                                    </p>
                                )}
                                {parsedQR?.innerSerials && (
                                    <p className="text-xs text-gray-600">
                                        Inner Serial : <span className="font-mono font-semibold">
                                            {parsedQR.innerSerialStart + " → " + parsedQR.innerSerialEnd}
                                        </span>
                                    </p>
                                )}
                            </div>

                            {/* Serial Form */}
                            {isSerial ? (
                                <form onSubmit={handleSerialSubmit} className="space-y-3">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Serial Numbers :</label>
                                        {serialInputs.map((serial, index) => (
                                            <div key={index} className="relative">
                                                <Input
                                                    autoComplete="off"
                                                    id={`serial-${index}`}
                                                    className="w-full pr-10"
                                                    value={serial}
                                                    onChange={(e) => {
                                                        const newSerials = [...serialInputs];
                                                        newSerials[index] = e.target.value;
                                                        setSerialInputs(newSerials);
                                                    }}
                                                />
                                                {serial && (
                                                    <button
                                                        type="button"
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                        onClick={() => {
                                                            const newSerials = [...serialInputs];
                                                            newSerials[index] = "";
                                                            setSerialInputs(newSerials);
                                                            (document.getElementById(`serial-${index}`) as HTMLInputElement)?.focus();
                                                        }}
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        <div className="flex gap-4">
                                            <button
                                                type="button"
                                                className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                                                onClick={() => setSerialInputs([...serialInputs, ""])}
                                            >
                                                + Add Serial
                                            </button>
                                            {serialInputs.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="text-red-600 hover:text-red-800 text-sm font-semibold"
                                                    onClick={() => setSerialInputs(serialInputs.slice(0, -1))}
                                                >
                                                    − Remove Last
                                                </button>
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
                                        <Button type="button" className="w-full" variant="outline" onClick={closeDialog}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                /* Quantity Form */
                                <form onSubmit={handleQuantitySubmit} className="space-y-3">

                                    {invPolicy?.use_production_date && (
                                        <div className="flex flex-col">
                                            <DateInputMobile
                                                label="Prod Date :"
                                                value={prodDate}
                                                onChange={(e) => setProdDate(e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {invPolicy?.require_expiry_date && (
                                        <div className="flex flex-col">
                                            <DateInputMobile
                                                label="Exp Date :"
                                                value={expDate}
                                                onChange={(e) => setExpDate(e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {invPolicy?.use_lot_no && (
                                        <div className="flex flex-col">
                                            <label htmlFor="lot_no" className="text-sm font-bold text-gray-700">
                                                Lot No :
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type="text"
                                                    id="lot_no"
                                                    list="lotNoOptions"
                                                    className="w-full text-xs"
                                                    value={lotNo}
                                                    onChange={(e) => setLotNo(e.target.value)}
                                                    placeholder="Enter lot number..."
                                                    autoComplete="off"
                                                />
                                                <datalist id="lotNoOptions">
                                                    {uniqueLotNos.map((d, i) => <option key={i} value={d} />)}
                                                </datalist>
                                                {lotNo && (
                                                    <button
                                                        type="button"
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                        onClick={() => {
                                                            setLotNo("");
                                                            document.getElementById("lot_no")?.focus();
                                                        }}
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Qty + UoM */}
                                    <div className="flex flex-col">
                                        <label htmlFor="qty" className="text-sm font-bold text-gray-700">
                                            Qty / Unit :
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                min={1}
                                                type="number"
                                                id="qty"
                                                list="qtyOptions"
                                                className="w-28 text-xs"
                                                value={scanQty}
                                                autoComplete="off"
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === "") { setScanQty(""); return; }
                                                    const num = Number(val);
                                                    setScanQty(num < 1 ? 1 : num);
                                                }}
                                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                            />
                                            <datalist id="qtyOptions">
                                                {uniqueQtys.map((d, i) => <option key={i} value={d} />)}
                                            </datalist>
                                            <Input
                                                type="text"
                                                id="unit"
                                                className="w-20 text-xs"
                                                readOnly
                                                value={uom}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Button type="submit" className="w-full" disabled={isSubmit}>
                                            {isSubmit ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" />Loading...</> : "Submit"}
                                        </Button>
                                        <Button type="button" className="w-full" variant="outline" onClick={closeDialog}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CheckingPage;