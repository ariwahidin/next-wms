/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { Box, List, Loader2, Trash2 } from "lucide-react";
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScanItem {
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
}

interface ScannedItem {
  id?: number;
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
  barcode_data_scan?: string;
  qty_data_scan?: number;
  uom_scan?: string;
  is_serial?: boolean;
  packing_no?: string;
  pack_ctn_no?: string;
}

// ─── QR Parser ────────────────────────────────────────────────────────────────

interface ParsedQRData {
  sku?: string;        // item_code
  ean?: string;        // barcode / EAN
  product?: string;
  brand?: string;
  model?: string;
  cartonSerial?: string;
  batch?: string;
  mfgDate?: string;    // prod_date (yyyyMMdd → yyyy-MM-dd)
  qtyPerCarton?: number;
}

function parseQRCode(raw: string): ParsedQRData | null {
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

  return {
    sku: map["SKU"],
    ean: map["EAN"],
    product: map["PRODUCT"],
    brand: map["BRAND"],
    model: map["MODEL"],
    cartonSerial: map["CARTON_SERIAL"],
    batch: map["BATCH"],
    mfgDate,
    qtyPerCarton: map["QTY_PER_CARTON"] ? Number(map["QTY_PER_CARTON"]) : undefined,
  };
}

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
  const { outbound, carton, master_carton_id } = router.query;

  // ── Scan mode ──────────────────────────────────────────────────────────────
  const [isQrMode, setIsQrMode] = useState(false);
  const [qrRawInput, setQrRawInput] = useState("");
  const [parsedQR, setParsedQR] = useState<ParsedQRData | null>(null);

  // ── Scan fields ────────────────────────────────────────────────────────────
  const [scanUom, setScanUom] = useState("");
  const [scanLocation, setScanLocation] = useState("");
  const [scanBarcode, setScanBarcode] = useState("");
  const [packingNo, setPackingNo] = useState("");
  const [packCtnNo, setPackCtnNo] = useState("");
  const [serialInputs, setSerialInputs] = useState([""]);
  const [scanQty, setScanQty] = useState<string | number>(1);

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
  const [listOutboundDetail, setListOutboundDetail] = useState<OutboundDetail[]>([]);
  const [listOutboundScanned, setListOutboundScanned] = useState<ScannedItem[]>([]);
  const [invPolicy, setInvPolicy] = useState<InventoryPolicy | undefined>();

  const outboundNo = Array.isArray(outbound) ? outbound[0] : (outbound ?? "");

  // ── QR Helpers ─────────────────────────────────────────────────────────────

  const handleQrInputChange = (raw: string) => {
    setQrRawInput(raw);
    const parsed = parseQRCode(raw);
    if (parsed) {
      setParsedQR(parsed);
      if (parsed.ean) setScanBarcode(parsed.ean);
      if (parsed.qtyPerCarton) setScanQty(parsed.qtyPerCarton);
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
        const filtered: OutboundDetail[] = data.data.map((item: any) => ({
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
          barcode: item.barcode,
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
        }));
        setListOutboundScanned(filtered);
        setSelectedCarton("all");
      }
    } catch (error) {
      console.error("Error fetching scanned items:", error);
    }
  }, []);

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

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (outbound) fetchOutboundDetail();
    if (carton) {
      setPackCtnNo(carton as string);
      setPackingNo(outboundNo);
    }
  }, [outbound, carton]);

  useEffect(() => {
    if (master_carton_id) fetchMasterCartonDetails(master_carton_id as string);
  }, [master_carton_id]);

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

  const handleScan = async () => {
    if (!scanBarcode.trim()) return;

    const serialNumber =
      serialInputs.length > 1
        ? serialInputs.filter((s) => s.trim() !== "").join("-")
        : serialInputs[0]?.trim() ?? "";

    const newItem: ScanItem = {
      carton_id: masterCarton?.id ?? null,
      carton_code: masterCarton?.carton_code ?? null,
      outbound_no: outboundNo,
      location: scanLocation,
      barcode: scanBarcode,
      serial_no: serialNumber,
      qty: scanQty as number,
      uom: scanUom,
      packing_no: packingNo,
      pack_ctn_no: packCtnNo === "" ? null : packCtnNo,
      qr_raw: isQrMode ? qrRawInput : undefined,
    };

    if (isSubmit) return;
    setIsLoading(true);
    setIsSubmit(true);

    try {
      const response = await api.post("/mobile/outbound/picking/scan/" + outboundNo, newItem);
      const data = await response.data;
      if (data.success) {
        eventBus.emit("showAlert", { title: "Success!", description: data.message, type: "success" });
        fetchOutboundDetail();
        closeDialog();
      }
    } catch (error) {
      console.error("Error during scan:", error);
    } finally {
      setIsLoading(false);
      setIsSubmit(false);
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scanBarcode.trim()) {
      document.getElementById(isQrMode ? "qr-input" : "barcode")?.focus();
      return;
    }

    const newItem: ScanItem = {
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
        if (res.is_serial) {
          setIsSerial(true);
          setShowDialog(true);
        } else {
          setIsSerial(false);
          setScanUom(res.data?.uom?.from_uom ?? "");
          if (invPolicy?.picking_single_scan) {
            handleScan();
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
    handleScan();
  };

  const closeDialog = () => {
    setShowDialog(false);
    setSerialInputs([""]);
    setScanBarcode("");
    setScanQty(1);
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

  // ── Derived ────────────────────────────────────────────────────────────────

  const filteredItems = listOutboundDetail.filter(
    (item) =>
      item.item_name.toLowerCase().includes(searchOutboundDetail.toLowerCase()) ||
      item.item_code.toLowerCase().includes(searchOutboundDetail.toLowerCase()) ||
      item.barcode.toLowerCase().includes(searchOutboundDetail.toLowerCase()) ||
      item.quantity.toString().includes(searchOutboundDetail) ||
      item.scan_qty?.toString().includes(searchOutboundDetail)
  );

  const filteredScannedItems = listOutboundScanned.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      item.id?.toString().includes(term) ||
      item.outbound_detail_id.toString().includes(term) ||
      item.barcode.toLowerCase().includes(term) ||
      item.serial_number.toLowerCase().includes(term) ||
      item.location.toLowerCase().includes(term);
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
    <>
      <PageHeader title={outboundNo} showBackButton />

      <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-40 max-w-md mx-auto">

        {/* ── Scan Input Card ── */}
        <Card>
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
              {/* Location */}
              {invPolicy?.require_scan_pick_location && (
                <div className="flex items-center space-x-2">
                  <label htmlFor="location" className="text-sm text-gray-600 whitespace-nowrap">
                    Location :
                  </label>
                  <div className="relative w-full">
                    <Input
                      className="text-sm h-8"
                      autoComplete="off"
                      id="location"
                      placeholder="Entry location..."
                      value={scanLocation}
                      onChange={(e) => setScanLocation(e.target.value)}
                    />
                    {scanLocation && (
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => { setScanLocation(""); document.getElementById("location")?.focus(); }}>
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Packing No (hidden) */}
              {invPolicy?.require_packing_scan && (
                <div className="flex items-center space-x-1" style={{ display: "none" }}>
                  <label htmlFor="packing_no" className="text-sm text-gray-600 whitespace-nowrap">Pack No :</label>
                  <Input readOnly className="text-sm h-8" id="packing_no" value={packingNo} onChange={(e) => setPackingNo(e.target.value)} />
                </div>
              )}

              {/* EAN mode */}
              {!isQrMode && (
                <div className="flex items-center space-x-2">
                  <label htmlFor="barcode" className="text-sm text-gray-600 whitespace-nowrap">EAN :</label>
                  <div className="relative w-full">
                    <Input
                      className="text-sm h-8"
                      autoComplete="off"
                      id="barcode"
                      placeholder="Entry barcode ean..."
                      value={scanBarcode}
                      onChange={(e) => setScanBarcode(e.target.value)}
                    />
                    {scanBarcode && (
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => { setScanBarcode(""); document.getElementById("barcode")?.focus(); }}>
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
                    <label htmlFor="qr-input" className="text-sm text-gray-600 whitespace-nowrap">QR Code :</label>
                    <div className="relative w-full">
                      <Input
                        className="text-sm h-8 font-mono pr-8"
                        autoComplete="off"
                        id="qr-input"
                        placeholder="Scan QR code here..."
                        value={qrRawInput}
                        onChange={(e) => handleQrInputChange(e.target.value)}
                        autoFocus
                      />
                      {qrRawInput && (
                        <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => { setQrRawInput(""); setParsedQR(null); setScanBarcode(""); document.getElementById("qr-input")?.focus(); }}>
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* QR Preview */}
                  {parsedQR && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs font-mono space-y-0.5">
                      {parsedQR.sku && <div><span className="text-gray-500">SKU:</span> {parsedQR.sku}</div>}
                      {parsedQR.ean && <div><span className="text-gray-500">EAN:</span> {parsedQR.ean}</div>}
                      {parsedQR.product && <div><span className="text-gray-500">Product:</span> {parsedQR.product}</div>}
                      {parsedQR.mfgDate && <div><span className="text-gray-500">MFG Date:</span> {parsedQR.mfgDate}</div>}
                      {parsedQR.batch && <div><span className="text-gray-500">Batch:</span> {parsedQR.batch}</div>}
                      {parsedQR.cartonSerial && <div><span className="text-gray-500">Carton Serial:</span> {parsedQR.cartonSerial}</div>}
                      {parsedQR.qtyPerCarton && <div><span className="text-gray-500">Qty/Carton:</span> {parsedQR.qtyPerCarton}</div>}
                    </div>
                  )}
                  {qrRawInput && !parsedQR && (
                    <p className="text-xs text-red-500">Format QR tidak dikenali. Pastikan format: (1)SKU=...</p>
                  )}
                </div>
              )}

              <Button disabled={isSubmit || !scanBarcode.trim()} type="submit" className="w-full" size="sm">
                {isSubmit ? (
                  <><Loader2 className="mr-2 w-4 h-4 animate-spin" />Scanning...</>
                ) : "Scan"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex justify-center items-center text-sm text-gray-500">
            <Loader2 className="animate-spin mr-2" size={16} />
            Loading...
          </div>
        )}

        {/* ── Total Qty ── */}
        <div className="flex justify-center">
          <span className="text-sm text-gray-600">
            Total Qty : <span className="font-semibold">{totalScanQty} / {totalPlanQty}</span>
          </span>
        </div>

        {/* ── Outbound Detail List ── */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Show Pending</span>
              <ToggleSwitch
                checked={showAllOutboundDetail}
                onChange={setShowAllOutboundDetail}
                labelOff="Pending"
                labelOn="All"
              />
            </div>

            <Input
              className="w-full"
              placeholder="Search items..."
              value={searchOutboundDetail}
              onChange={(e) => setSearchOutboundDetail(e.target.value)}
            />

            {filteredItems.length > 0 ? (
              <ul className="space-y-2">
                {filteredItems.map((item, idx) => (
                  <li
                    key={idx}
                    onClick={() => { fetchScannedItems(item.outbound_detail_id); setShowModalDetail(true); }}
                    className="flex flex-col border p-3 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="text-xs font-mono space-y-0.5">
                      <div><strong>Item Code :</strong> {item.item_code}</div>
                      <div><strong>Item Name :</strong> {item.item_name}</div>
                      <div><strong>EAN :</strong> {item.barcode}</div>
                      <div>
                        <strong>Scanned:</strong>{" "}
                        <span className={(item.scan_qty ?? 0) >= item.quantity ? "text-green-600 font-semibold" : "text-orange-500 font-semibold"}>
                          {item.scan_qty ?? 0}
                        </span>
                        {" / "}{item.quantity} {item.uom}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-400 text-center py-4">Tidak ada barang ditemukan</div>
            )}
          </CardContent>
        </Card>

        {/* ── Seal Container Dialog — Input Weight ── */}
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
                            {item.is_serial && <div><strong>Serial:</strong> {item.serial_number}</div>}
                            <div><strong>QTY:</strong> {item.qty_data_scan} {item.uom_scan}</div>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            {item.status === "pending" && (
                              <Button disabled={isSubmit} className="h-6" variant="destructive" size="sm"
                                onClick={() => handleRemoveItem(item.id!, item.outbound_detail_id)}>
                                {isSubmit ? "Deleting..." : "Delete"}
                              </Button>
                            )}
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
                listContainerSummary.map(({ pack_ctn_no, qty: totalQty, items: barcodes }) => {
                  const isCurrent = pack_ctn_no === packCtnNo;
                  return (
                    <div key={pack_ctn_no} className={`rounded-lg border p-3 space-y-1.5 ${isCurrent ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50"}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Box size={13} className={isCurrent ? "text-blue-600" : "text-gray-500"} />
                          <span className={`text-xs font-bold font-mono ${isCurrent ? "text-blue-700" : "text-gray-700"}`}>CTN # {pack_ctn_no}</span>
                          {isCurrent && <span className="text-[10px] bg-blue-600 text-white rounded px-1.5 py-0.5 font-medium">Active</span>}
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
                    </div>
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
      </div>

      {/* ── Fixed Bottom Bar ── */}
      {invPolicy?.require_packing_scan && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg px-4 pt-3 pb-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1 flex-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">CTN #</span>
              <span className="flex-1 text-center text-lg font-bold text-gray-800 tabular-nums min-w-[2rem]">{packCtnNo}</span>
            </div>
            {masterCarton && (
              <button type="button" onClick={() => setShowEditCartonDialog(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline truncate block w-full text-left">
                {masterCarton.display_name}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={isCreatingCarton}
              className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
              onClick={handleNewCarton}>
              {isCreatingCarton ? <Loader2 size={14} className="animate-spin" /> : <Box size={14} />}
              New Ctn
            </Button>
            <Button type="button" variant="outline" size="sm"
              className="w-full h-8 bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md"
              onClick={() => setShowListContainerDialog(true)}>
              <List size={14} />
              List
            </Button>
            <Button type="button" variant="outline" size="sm"
              className="w-full h-8 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md"
              onClick={() => { setContainerWeight(""); setShowSealContainerDialog(true); }}>
              <Box size={14} />
              Seal
            </Button>
          </div>
        </div>
      )}

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
                {invPolicy?.require_scan_pick_location && <p>Location : <span className="font-medium">{scanLocation}</span></p>}
                <p>EAN : <span className="font-mono font-medium">{scanBarcode}</span></p>
                {parsedQR?.product && <p>Product : <span className="font-mono font-medium">{parsedQR.product}</span></p>}
                {isQrMode && parsedQR?.cartonSerial && <p>Carton Serial : <span className="font-mono font-medium">{parsedQR.cartonSerial}</span></p>}
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
                  <div className="flex items-center space-x-2">
                    <label htmlFor="qty" className="text-sm font-bold text-gray-700 whitespace-nowrap">Qty / Unit</label>
                    <Input min={1} type="number" id="qty" className="h-8 text-sm" value={scanQty} autoComplete="off"
                      onChange={(e) => { const v = e.target.value; if (v === "") { setScanQty(""); return; } const n = Number(v); setScanQty(n < 1 ? 1 : n); }}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()} />
                    <Input readOnly type="text" id="uom" className="h-8 text-sm w-20" value={scanUom} />
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
    </>
  );
};

export default CheckingPage;