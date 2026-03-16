/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/mobile/PageHeader";
import { CheckCircle2, Circle, Loader2, Trash2 } from "lucide-react";
import { XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";
import { InventoryPolicy } from "@/types/inventory";

// ─── Types ────────────────────────────────────────────────────────────────────

type LabelType = "UNIT" | "CARTON" | "UNKNOWN";

interface ParsedQRData {
  sku?: string;
  ean?: string;
  product?: string;
  brand?: string;
  model?: string;
  serial?: string;
  cartonSerial?: string;
  batch?: string;
  mfgDate?: string;
  qtyPerCarton?: number;
  labelType?: LabelType;
}

interface PickingSheetItem {
  outbound_picking_id: number;
  outbound_detail_id: number;
  outbound_no: string;
  item_id: number;
  item_code: string;
  item_name: string;
  barcode: string;
  location: string;
  pallet: string;
  uom: string;
  qty_required: number;
  qty_picked: number;
  is_complete: boolean;
  lot_number: string;
  prod_date: string;
  exp_date: string;
}

interface PickingSummary {
  total_required: number;
  total_picked: number;
  is_complete: boolean;
}

interface ScanRecord {
  ID: number;
  outbound_picking_id: number;
  barcode: string;
  scan_type: string;
  label_type: string;
  quantity: number;
  uom: string;
  location: string;
  serial_number: string;
  case_number: string;
  lot_number: string;
  prod_date: string;
  status: string;
  created_at: string;
}

// ─── QR Parser ────────────────────────────────────────────────────────────────

function parseQRCode(raw: string): ParsedQRData | null {
  if (!raw.startsWith("(") && raw.split("-").length === 12) {
    const segments = raw.split("-");
    const rawDate = segments[9];
    let mfgDate: string | undefined;
    if (rawDate?.length === 8) {
      mfgDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
    }
    const qtyMatch = segments[4].match(/^(\d+)/);
    const qty = qtyMatch ? Number(qtyMatch[1]) : undefined;
    return {
      sku: segments[1] || undefined,
      qtyPerCarton: !isNaN(qty!) && qty! > 0 ? qty : undefined,
      mfgDate,
      labelType: "CARTON",
    };
  }

  const pattern = /\((\d+)\)([A-Z_]+)=([^(]*)/g;
  const map: Record<string, string> = {};
  let match: RegExpExecArray | null;
  let found = false;

  while ((match = pattern.exec(raw)) !== null) {
    found = true;
    map[match[2].trim()] = match[3].trim();
  }

  if (!found) return null;

  let mfgDate: string | undefined;
  if (map["MFG_DATE"]?.length === 8) {
    const d = map["MFG_DATE"];
    mfgDate = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  }

  const labelType: LabelType = map["SERIAL"]
    ? "UNIT"
    : map["CARTON_SERIAL"]
    ? "CARTON"
    : "UNKNOWN";

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
    qtyPerCarton: map["QTY_PER_CARTON"] ? Number(map["QTY_PER_CARTON"]) : undefined,
    labelType,
  };
}

// ─── ToggleSwitch ─────────────────────────────────────────────────────────────

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
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? "bg-blue-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
    <span className={checked ? "font-semibold text-gray-800" : "text-gray-400"}>{labelOn}</span>
  </div>
);

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const ProgressBar = ({ picked, required }: { picked: number; required: number }) => {
  const pct = required > 0 ? Math.min((picked / required) * 100, 100) : 0;
  return (
    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
      <div
        className={`h-1.5 rounded-full transition-all ${pct >= 100 ? "bg-green-500" : "bg-blue-500"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const OutboundPickingPage = () => {
  const router = useRouter();
  const { outbound } = router.query;
  const outboundNo = Array.isArray(outbound) ? outbound[0] : (outbound ?? "");

  // ── Inventory policy ───────────────────────────────────────────────────────
  const [invPolicy, setInvPolicy] = useState<InventoryPolicy | undefined>();

  // ── Scan mode ──────────────────────────────────────────────────────────────
  const [isQrMode, setIsQrMode] = useState(false);
  const [qrRawInput, setQrRawInput] = useState("");
  const [parsedQR, setParsedQR] = useState<ParsedQRData | null>(null);
  const [scanBarcode, setScanBarcode] = useState("");
  const [scanLocation, setScanLocation] = useState("");
  const [scanQty, setScanQty] = useState<number>(1);

  // auto-submit: kalau on → setelah barcode cocok langsung submit qty=1 tanpa buka dialog
  const [autoSubmit, setAutoSubmit] = useState(false);

  // ── Picking state ──────────────────────────────────────────────────────────
  const [pickingSheet, setPickingSheet] = useState<PickingSheetItem[]>([]);
  const [summary, setSummary] = useState<PickingSummary | null>(null);
  const [selectedItem, setSelectedItem] = useState<PickingSheetItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPendingOnly, setShowPendingOnly] = useState(true);

  // ── Scan history ───────────────────────────────────────────────────────────
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historyItem, setHistoryItem] = useState<PickingSheetItem | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmit, setIsSubmit] = useState(false);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch policy ───────────────────────────────────────────────────────────

  const fetchPolicy = useCallback(async (ownerCode: string) => {
    try {
      const res = await api.get("/inventory/policy?owner=" + ownerCode);
      if (res.data.success) setInvPolicy(res.data.data.inventory_policy);
    } catch (err) {
      console.error("Error fetching policy:", err);
    }
  }, []);

  // ── Fetch picking sheet ────────────────────────────────────────────────────

  const fetchPickingSheet = useCallback(async () => {
    if (!outboundNo) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/mobile/outbound/picking/${outboundNo}`, { withCredentials: true });
      if (res.data.success) {
        setPickingSheet(res.data.data ?? []);
        setSummary(res.data.summary ?? null);
      }
    } catch (err) {
      console.error("Error fetching picking sheet:", err);
    } finally {
      setIsLoading(false);
    }
  }, [outboundNo]);

  // ── Fetch scan history ─────────────────────────────────────────────────────

  const fetchScanHistory = useCallback(async (outboundPickingId: number) => {
    setIsLoadingHistory(true);
    try {
      const res = await api.get(`/mobile/outbound/picking/scans/${outboundPickingId}`, {
        withCredentials: true,
      });
      if (res.data.success) setScanHistory(res.data.data ?? []);
    } catch (err) {
      console.error("Error fetching scan history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (outboundNo) fetchPickingSheet();
  }, [outboundNo]);

  // Fetch policy via outbound detail (owner_code)
  useEffect(() => {
    if (!outboundNo || invPolicy) return;
    const fetchOwner = async () => {
      try {
        const res = await api.get(`/mobile/outbound/detail/${outboundNo}`, {
          withCredentials: true,
        });
        if (res.data.success && res.data.data?.length > 0) {
          fetchPolicy(res.data.data[0].owner_code);
        }
      } catch (_) {}
    };
    fetchOwner();
  }, [outboundNo]);

  // Auto-focus qty saat dialog scan buka
  useEffect(() => {
    if (!showScanDialog) return;
    const t = setTimeout(() => {
      (document.getElementById("qty-picking") as HTMLInputElement)?.focus();
    }, 100);
    return () => clearTimeout(t);
  }, [showScanDialog]);

  // ── QR Handler ─────────────────────────────────────────────────────────────

  const handleQrInputChange = (raw: string) => {
    setQrRawInput(raw);
    const parsed = parseQRCode(raw);
    if (parsed) {
      setParsedQR(parsed);
      if (parsed.ean) setScanBarcode(parsed.ean);
      if (parsed.labelType === "CARTON" && parsed.qtyPerCarton) setScanQty(parsed.qtyPerCarton);
      else if (parsed.labelType === "UNIT") setScanQty(1);
    } else {
      setParsedQR(null);
    }
  };

  const handleModeToggle = (qr: boolean) => {
    setIsQrMode(qr);
    setQrRawInput("");
    setParsedQR(null);
    setScanBarcode("");
    setScanQty(1);
    setTimeout(() => {
      document.getElementById(qr ? "qr-input-pick" : "barcode-pick")?.focus();
    }, 50);
  };

  // ── Barcode submit ─────────────────────────────────────────────────────────

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (requireLocation && !scanLocation.trim()) {
      eventBus.emit("showAlert", {
        title: "Lokasi Wajib",
        description: "Scan lokasi terlebih dahulu sebelum scan barcode",
        type: "error",
      });
      document.getElementById("location-pick")?.focus();
      return;
    }

    const barcode = isQrMode ? (parsedQR?.ean ?? scanBarcode) : scanBarcode;
    if (!barcode.trim()) {
      document.getElementById(isQrMode ? "qr-input-pick" : "barcode-pick")?.focus();
      return;
    }

    const matched = pickingSheet.find((item) => item.barcode === barcode && !item.is_complete);

    if (!matched) {
      const anyMatch = pickingSheet.find((item) => item.barcode === barcode);
      eventBus.emit("showAlert", {
        title: anyMatch?.is_complete ? "Sudah Selesai" : "Tidak Ditemukan",
        description: anyMatch?.is_complete
          ? `Item ${barcode} sudah selesai dipick (${anyMatch.qty_picked}/${anyMatch.qty_required} ${anyMatch.uom})`
          : `Barcode ${barcode} tidak ada di picking list order ini`,
        type: "error",
      });
      resetScanInput();
      return;
    }

    setSelectedItem(matched);

    if (autoSubmit) {
      submitScan(matched, 1);
    } else {
      setShowScanDialog(true);
    }
  };

  // ── Core submit ────────────────────────────────────────────────────────────

  const submitScan = async (item: PickingSheetItem, qty: number) => {
    if (isSubmit) return;
    if (debounceRef.current) return;
    debounceRef.current = setTimeout(() => { debounceRef.current = null; }, 300);

    const remaining = item.qty_required - item.qty_picked;
    if (qty > remaining) {
      eventBus.emit("showAlert", {
        title: "Over-pick!",
        description: `Qty tersisa: ${remaining} ${item.uom}. Tidak bisa scan ${qty}.`,
        type: "error",
      });
      return;
    }

    const barcode = isQrMode ? (parsedQR?.ean ?? scanBarcode) : scanBarcode;

    const payload = {
      outbound_picking_id: item.outbound_picking_id,
      barcode,
      barcode_raw: isQrMode ? qrRawInput : "",
      scan_type: isQrMode
        ? parsedQR?.labelType === "CARTON" ? "QR_CARTON" : "QR_UNIT"
        : "EAN",
      label_type: parsedQR?.labelType ?? "",
      quantity: qty,
      location: scanLocation,
      serial_number: parsedQR?.serial ?? "",
      case_number: parsedQR?.cartonSerial ?? "",
      lot_number: parsedQR?.batch ?? "",
      prod_date: parsedQR?.mfgDate ?? "",
    };

    setIsSubmit(true);
    try {
      const res = await api.post(`/mobile/outbound/picking/${outboundNo}/scan`, payload, {
        withCredentials: true,
      });
      if (res.data.success) {
        eventBus.emit("showAlert", {
          title: "Scan Berhasil!",
          description: res.data.message,
          type: "success",
        });
        closeScanDialog();
        fetchPickingSheet();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Gagal submit scan";
      eventBus.emit("showAlert", { title: "Error", description: msg, type: "error" });
    } finally {
      setIsSubmit(false);
    }
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    submitScan(selectedItem, scanQty);
  };

  // ── Reset & close ──────────────────────────────────────────────────────────

  const resetScanInput = () => {
    setScanBarcode("");
    setQrRawInput("");
    setParsedQR(null);
    setScanQty(1);
    setTimeout(() => {
      document.getElementById(isQrMode ? "qr-input-pick" : "barcode-pick")?.focus();
    }, 50);
  };

  const closeScanDialog = () => {
    setShowScanDialog(false);
    setSelectedItem(null);
    resetScanInput();
  };

  // ── History dialog ─────────────────────────────────────────────────────────

  const openHistoryDialog = (item: PickingSheetItem) => {
    setHistoryItem(item);
    setScanHistory([]);
    setShowHistoryDialog(true);
    fetchScanHistory(item.outbound_picking_id);
  };

  const handleDeleteScan = async (scanId: number) => {
    if (deletingId !== null) return;
    setDeletingId(scanId);
    try {
      const res = await api.delete(`/mobile/outbound/picking/scans/${scanId}`, { withCredentials: true });
      if (res.data.success) {
        eventBus.emit("showAlert", { title: "Deleted", description: "Scan dihapus", type: "success" });
        if (historyItem) fetchScanHistory(historyItem.outbound_picking_id);
        fetchPickingSheet();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Gagal menghapus scan";
      eventBus.emit("showAlert", { title: "Error", description: msg, type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  // ── Confirm Picking ────────────────────────────────────────────────────────

  const handleConfirmPicking = async () => {
    if (isConfirming) return;
    setIsConfirming(true);
    try {
      const res = await api.post(`/mobile/outbound/picking/${outboundNo}/confirm`, {}, { withCredentials: true });
      if (res.data.success) {
        eventBus.emit("showAlert", {
          title: "Picking Confirmed!",
          description: res.data.message,
          type: "success",
        });
        setShowConfirmDialog(false);
        router.back();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Gagal konfirmasi picking";
      eventBus.emit("showAlert", { title: "Error", description: msg, type: "error" });
    } finally {
      setIsConfirming(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const filteredSheet = pickingSheet.filter((item) => {
    if (showPendingOnly && item.is_complete) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.item_code.toLowerCase().includes(term) ||
      item.item_name.toLowerCase().includes(term) ||
      item.barcode.toLowerCase().includes(term) ||
      item.location.toLowerCase().includes(term)
    );
  });

  const allComplete = summary?.is_complete ?? false;
  const requireLocation = invPolicy?.require_scan_pick_location ?? false;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader title={`Picking — ${outboundNo}`} showBackButton />

      <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-32 max-w-md mx-auto">

        {/* ── Scan Input Card ── */}
        <Card>
          <CardContent className="p-4 space-y-3">

            {/* Toggles row */}
            <div className="flex items-center justify-between">
              <ToggleSwitch checked={isQrMode} onChange={handleModeToggle} labelOff="EAN" labelOn="QR" />
              <ToggleSwitch checked={autoSubmit} onChange={setAutoSubmit} labelOff="Manual" labelOn="Auto" />
            </div>

            <form onSubmit={handleBarcodeSubmit} className="space-y-2">

              {/* Lokasi — hanya jika policy aktif */}
              {requireLocation && (
                <div className="flex items-center space-x-2">
                  <label htmlFor="location-pick" className="text-sm text-gray-600 whitespace-nowrap">
                    Lokasi :
                  </label>
                  <div className="relative w-full">
                    <Input
                      className="text-sm h-8"
                      autoComplete="off"
                      id="location-pick"
                      placeholder="Scan lokasi..."
                      value={scanLocation}
                      onChange={(e) => setScanLocation(e.target.value)}
                    />
                    {scanLocation && (
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => { setScanLocation(""); document.getElementById("location-pick")?.focus(); }}
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* EAN mode */}
              {!isQrMode && (
                <div className="flex items-center space-x-2">
                  <label htmlFor="barcode-pick" className="text-sm text-gray-600 whitespace-nowrap">
                    EAN :
                  </label>
                  <div className="relative w-full">
                    <Input
                      className="text-sm h-8"
                      autoComplete="off"
                      id="barcode-pick"
                      placeholder="Scan barcode EAN..."
                      value={scanBarcode}
                      onChange={(e) => setScanBarcode(e.target.value)}
                      autoFocus={!requireLocation}
                    />
                    {scanBarcode && (
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => { setScanBarcode(""); document.getElementById("barcode-pick")?.focus(); }}
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* QR mode */}
              {isQrMode && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <label htmlFor="qr-input-pick" className="text-sm text-gray-600 whitespace-nowrap">
                      QR :
                    </label>
                    <div className="relative w-full">
                      <Input
                        className="text-sm h-8 font-mono pr-8"
                        autoComplete="off"
                        id="qr-input-pick"
                        placeholder="Scan QR code..."
                        value={qrRawInput}
                        onChange={(e) => handleQrInputChange(e.target.value)}
                        autoFocus={!requireLocation}
                      />
                      {qrRawInput && (
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => { setQrRawInput(""); setParsedQR(null); setScanBarcode(""); document.getElementById("qr-input-pick")?.focus(); }}
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                  </div>

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
                      {parsedQR.serial && <div><span className="text-gray-500">Serial:</span> {parsedQR.serial}</div>}
                      {parsedQR.cartonSerial && <div><span className="text-gray-500">Carton Serial:</span> {parsedQR.cartonSerial}</div>}
                      {parsedQR.batch && <div><span className="text-gray-500">Batch:</span> {parsedQR.batch}</div>}
                      {parsedQR.mfgDate && <div><span className="text-gray-500">MFG Date:</span> {parsedQR.mfgDate}</div>}
                      {parsedQR.qtyPerCarton && <div><span className="text-gray-500">Qty/Carton:</span> {parsedQR.qtyPerCarton}</div>}
                    </div>
                  )}
                  {qrRawInput && !parsedQR && (
                    <p className="text-xs text-red-500">Format QR tidak dikenali.</p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="sm"
                disabled={isSubmit || (!scanBarcode.trim() && !qrRawInput.trim())}
              >
                {isSubmit
                  ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" />Scanning...</>
                  : autoSubmit ? "Scan (Auto)" : "Scan"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── Progress Summary ── */}
        {summary && (
          <div className="flex items-center justify-between bg-white border rounded-lg px-4 py-2 text-sm">
            <span className="text-gray-600">Total Progress</span>
            <span className={`font-semibold ${allComplete ? "text-green-600" : "text-orange-500"}`}>
              {summary.total_picked} / {summary.total_required}
            </span>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center text-sm text-gray-500">
            <Loader2 className="animate-spin mr-2" size={16} /> Loading...
          </div>
        )}

        {/* ── Picking Sheet List ── */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Picking List</span>
              <ToggleSwitch
                checked={!showPendingOnly}
                onChange={(v) => setShowPendingOnly(!v)}
                labelOff="Pending"
                labelOn="All"
              />
            </div>

            <Input
              className="w-full text-sm"
              placeholder="Search item / barcode / lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {filteredSheet.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-4">
                {showPendingOnly ? "Semua item sudah selesai dipick 🎉" : "Tidak ada item ditemukan"}
              </div>
            ) : (
              <ul className="space-y-2">
                {filteredSheet.map((item) => (
                  <li
                    key={item.outbound_picking_id}
                    onClick={() => openHistoryDialog(item)}
                    className={`border rounded-lg p-3 text-xs font-mono space-y-1 cursor-pointer active:scale-[0.99] transition-transform ${
                      item.is_complete
                        ? "bg-green-50 border-green-200"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 truncate">
                          {item.item_name || item.item_code}
                        </div>
                        <div className="text-gray-500">{item.item_code}</div>
                        <div><span className="text-gray-400">EAN:</span> {item.barcode}</div>
                        {item.location && <div><span className="text-gray-400">Lokasi:</span> {item.location}</div>}
                        {item.lot_number && <div><span className="text-gray-400">Batch:</span> {item.lot_number}</div>}
                      </div>
                      <div className="flex-shrink-0 pt-0.5">
                        {item.is_complete
                          ? <CheckCircle2 size={20} className="text-green-500" />
                          : <Circle size={20} className="text-gray-300" />}
                      </div>
                    </div>

                    <div className="pt-1">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-gray-400">Picked</span>
                        <span className={item.is_complete ? "text-green-600 font-semibold" : "text-orange-500 font-semibold"}>
                          {item.qty_picked} / {item.qty_required} {item.uom}
                        </span>
                      </div>
                      <ProgressBar picked={item.qty_picked} required={item.qty_required} />
                    </div>

                    <div className="text-gray-300 text-right pt-0.5">tap untuk lihat scan →</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Fixed Bottom Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg px-4 py-3">
        <Button
          className={`w-full font-semibold ${
            allComplete ? "bg-green-600 hover:bg-green-700" : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          disabled={!allComplete || isConfirming}
          onClick={() => allComplete && setShowConfirmDialog(true)}
        >
          {allComplete
            ? "✓ Confirm Picking"
            : `Picking Belum Selesai (${summary?.total_picked ?? 0}/${summary?.total_required ?? 0})`}
        </Button>
      </div>

      {/* ── Scan Qty Dialog ── */}
      {showScanDialog && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-800">Konfirmasi Scan</h2>
              <button
                onClick={closeScanDialog}
                className="text-gray-400 hover:text-gray-600 text-2xl p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <div className="px-4 py-4 space-y-4">
              <div className="p-3 bg-gray-50 rounded-md space-y-1 text-sm text-gray-600 font-mono">
                <p><span className="text-gray-400">Item:</span> {selectedItem.item_name || selectedItem.item_code}</p>
                <p><span className="text-gray-400">EAN:</span> {selectedItem.barcode}</p>
                {requireLocation && scanLocation && (
                  <p><span className="text-gray-400">Lokasi:</span> {scanLocation}</p>
                )}
                <p>
                  <span className="text-gray-400">Sisa:</span>{" "}
                  <span className="font-semibold text-orange-500">
                    {selectedItem.qty_required - selectedItem.qty_picked} {selectedItem.uom}
                  </span>
                </p>
                {parsedQR?.serial && <p><span className="text-gray-400">Serial:</span> {parsedQR.serial}</p>}
                {parsedQR?.cartonSerial && <p><span className="text-gray-400">Carton Serial:</span> {parsedQR.cartonSerial}</p>}
                {parsedQR?.batch && <p><span className="text-gray-400">Batch:</span> {parsedQR.batch}</p>}
                {parsedQR?.mfgDate && <p><span className="text-gray-400">MFG Date:</span> {parsedQR.mfgDate}</p>}
              </div>

              <form onSubmit={handleScanSubmit} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <label htmlFor="qty-picking" className="text-sm font-bold text-gray-700 whitespace-nowrap">Qty</label>
                  <Input
                    min={1}
                    max={selectedItem.qty_required - selectedItem.qty_picked}
                    type="number"
                    id="qty-picking"
                    className="h-8 text-sm"
                    value={scanQty}
                    autoComplete="off"
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "") { setScanQty(1); return; }
                      const n = Number(v);
                      setScanQty(n < 1 ? 1 : n);
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  />
                  <span className="text-sm text-gray-500">{selectedItem.uom}</span>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="w-full" disabled={isSubmit}>
                    {isSubmit ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" />Saving...</> : "Submit"}
                  </Button>
                  <Button type="button" variant="outline" className="w-full" onClick={closeScanDialog}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Scan History Dialog ── */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold font-mono">Scan History</DialogTitle>
          </DialogHeader>

          {historyItem && (
            <div className="bg-gray-50 rounded-md p-3 text-xs font-mono space-y-0.5">
              <div className="font-semibold text-gray-800 truncate">
                {historyItem.item_name || historyItem.item_code}
              </div>
              <div><span className="text-gray-400">EAN:</span> {historyItem.barcode}</div>
              <div>
                <span className="text-gray-400">Progress:</span>{" "}
                <span className={historyItem.is_complete ? "text-green-600 font-semibold" : "text-orange-500 font-semibold"}>
                  {historyItem.qty_picked} / {historyItem.qty_required} {historyItem.uom}
                </span>
              </div>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto space-y-2">
            {isLoadingHistory ? (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin text-gray-400" size={20} />
              </div>
            ) : scanHistory.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-6">Belum ada scan untuk item ini</div>
            ) : (
              scanHistory.map((scan) => (
                <div key={scan.ID} className="border rounded-md p-2.5 bg-white text-xs font-mono">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 flex-1">
                      <div><span className="text-gray-400">EAN:</span> {scan.barcode}</div>
                      {scan.location && <div><span className="text-gray-400">Lokasi:</span> {scan.location}</div>}
                      <div>
                        <span className="text-gray-400">Qty:</span>{" "}
                        <span className="font-semibold">{scan.quantity} {scan.uom}</span>
                      </div>
                      <div><span className="text-gray-400">Type:</span> {scan.scan_type}</div>
                      {scan.serial_number && <div><span className="text-gray-400">Serial:</span> {scan.serial_number}</div>}
                      {scan.case_number && <div><span className="text-gray-400">Case:</span> {scan.case_number}</div>}
                      {scan.lot_number && <div><span className="text-gray-400">Batch:</span> {scan.lot_number}</div>}
                      {scan.prod_date && <div><span className="text-gray-400">MFG:</span> {scan.prod_date}</div>}
                      <div className="text-gray-300 text-[10px]">{scan.created_at}</div>
                    </div>
                    <button
                      disabled={deletingId !== null}
                      onClick={() => handleDeleteScan(scan.ID)}
                      className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors flex-shrink-0 mt-0.5"
                    >
                      {deletingId === scan.ID
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" className="w-full text-xs h-8" onClick={() => setShowHistoryDialog(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Picking Dialog ── */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Picking</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm font-semibold text-gray-800 mb-1">✓ Semua item sudah dipick</p>
              <p className="text-sm text-gray-600">
                Konfirmasi picking akan mengubah status outbound menjadi <strong>Packing</strong>.
              </p>
            </div>
            <div className="border rounded-md p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Outbound No:</span>
                <span className="font-semibold">{outboundNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Qty:</span>
                <span className="font-semibold text-green-600">
                  {summary?.total_picked} / {summary?.total_required}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 italic">Aksi ini tidak dapat dibatalkan.</p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" disabled={isConfirming} onClick={() => setShowConfirmDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleConfirmPicking} disabled={isConfirming} className="bg-green-600 hover:bg-green-700">
              {isConfirming
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Confirming...</>
                : "Confirm Picking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OutboundPickingPage;