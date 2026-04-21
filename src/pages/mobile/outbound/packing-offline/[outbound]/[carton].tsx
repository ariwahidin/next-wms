/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { Box, List, Loader2, Trash2, Wifi, WifiOff, Clock, CheckCircle2, AlertCircle } from "lucide-react";
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

// ─── IndexedDB Setup ──────────────────────────────────────────────────────────
// Menggunakan native IndexedDB tanpa library tambahan
// untuk menghindari dependency baru

const DB_NAME = "wms_scan_queue";
const DB_VERSION = 1;
const STORE_NAME = "scan_queue";

interface QueuedScan {
  localId: string;           // UUID lokal, primary key
  outboundNo: string;
  payload: ScanItem;
  scannedAt: string;         // ISO timestamp
  synced: boolean;
  syncedAt?: string;
  status?: "ok" | "duplicate" | "invalid" | "pending";
  serverMessage?: string;
  retryCount: number;
}

// Buka / inisialisasi IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "localId" });
        store.createIndex("synced", "synced", { unique: false });
        store.createIndex("outboundNo", "outboundNo", { unique: false });
        store.createIndex("scannedAt", "scannedAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function addToQueue(item: QueuedScan): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getUnsyncedScans(outboundNo: string): Promise<QueuedScan[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const all: QueuedScan[] = req.result;
      resolve(all.filter((s) => !s.synced && s.outboundNo === outboundNo));
    };
    req.onerror = () => reject(req.error);
  });
}

async function getPendingCount(outboundNo: string): Promise<number> {
  const items = await getUnsyncedScans(outboundNo);
  return items.length;
}

async function markAsSynced(localId: string, status: string, message?: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(localId);
    req.onsuccess = () => {
      const item = req.result as QueuedScan;
      if (item) {
        item.synced = true;
        item.syncedAt = new Date().toISOString();
        item.status = status as any;
        item.serverMessage = message;
        store.put(item);
      }
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

async function markRetryIncrement(localId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(localId);
    req.onsuccess = () => {
      const item = req.result as QueuedScan;
      if (item) {
        item.retryCount = (item.retryCount ?? 0) + 1;
        store.put(item);
      }
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

// Hapus scan yang sudah synced lebih dari N hari
async function cleanupOldSynced(daysOld = 3): Promise<void> {
  const db = await openDB();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const items: QueuedScan[] = req.result;
      items.forEach((item) => {
        if (item.synced && item.syncedAt && new Date(item.syncedAt) < cutoff) {
          store.delete(item.localId);
        }
      });
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

// Minta browser tidak hapus storage ini secara diam-diam
async function requestStoragePersistence(): Promise<void> {
  if (navigator.storage && navigator.storage.persist) {
    await navigator.storage.persist();
  }
}

// ─── Audio Feedback ───────────────────────────────────────────────────────────
// Menggunakan Web Audio API — tidak perlu file audio eksternal

function playBeep(type: "ok" | "duplicate" | "error" | "queued") {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const configs = {
      ok:        { freq: 880, duration: 0.12, type: "sine" as OscillatorType },
      queued:    { freq: 660, duration: 0.08, type: "sine" as OscillatorType },
      duplicate: { freq: 440, duration: 0.25, type: "square" as OscillatorType },
      error:     { freq: 220, duration: 0.45, type: "sawtooth" as OscillatorType },
    };

    const { freq, duration, type: oscType } = configs[type];
    osc.frequency.value = freq;
    osc.type = oscType;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Beberapa browser butuh user gesture pertama — diabaikan
  }
}

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
  qr_raw?: string;
  lot_no?: string;
  prod_date?: string;
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

function parseQRCode(raw: string): ParsedQRData | null {
  // Format 2: 12 segment dash-separated
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
      qtyPerCarton: qty && !isNaN(qty) && qty > 0 ? qty : undefined,
      mfgDate,
      labelType: "CARTON",
    };
  }

  // Format 1: (1)KEY=VALUE
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

// ─── Sync Status Badge ────────────────────────────────────────────────────────

interface SyncStatusProps {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
}

const SyncStatusBadge = ({ isOnline, pendingCount, isSyncing }: SyncStatusProps) => {
  if (isSyncing) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700">
        <Loader2 size={11} className="animate-spin" />
        <span>Syncing {pendingCount}...</span>
      </div>
    );
  }
  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-xs font-medium text-orange-700">
        <WifiOff size={11} />
        <span>Offline{pendingCount > 0 ? ` · ${pendingCount} pending` : ""}</span>
      </div>
    );
  }
  if (pendingCount > 0) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 border border-yellow-200 text-xs font-medium text-yellow-700">
        <Clock size={11} />
        <span>{pendingCount} pending</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-xs font-medium text-green-700">
      <CheckCircle2 size={11} />
      <span>Synced</span>
    </div>
  );
};

// ─── Optimistic Scan Item Row ─────────────────────────────────────────────────
// Item yang muncul SEBELUM server konfirmasi (dari local queue)

interface OptimisticItemProps {
  item: QueuedScan;
}

const OptimisticItem = ({ item }: OptimisticItemProps) => {
  const statusConfig = {
    pending:   { bg: "bg-yellow-50 border-yellow-200", dot: "bg-yellow-400", label: "Pending sync" },
    ok:        { bg: "bg-green-50 border-green-200",   dot: "bg-green-500",  label: "Confirmed" },
    duplicate: { bg: "bg-orange-50 border-orange-200", dot: "bg-orange-400", label: "Duplicate" },
    invalid:   { bg: "bg-red-50 border-red-200",       dot: "bg-red-500",    label: "Invalid" },
  };
  const cfg = statusConfig[item.status ?? "pending"];

  return (
    <div className={`p-2 border rounded-md mb-1.5 ${cfg.bg}`}>
      <div className="text-xs font-mono space-y-0.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-700">{item.payload.barcode}</span>
          <span className={`flex items-center gap-1 text-[10px] font-medium`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>
        {item.payload.serial_no && (
          <div className="text-gray-500">SN: {item.payload.serial_no}</div>
        )}
        <div className="text-gray-500">
          QTY: {item.payload.qty} · {new Date(item.scannedAt).toLocaleTimeString("id-ID")}
        </div>
        {item.serverMessage && item.status === "duplicate" && (
          <div className="text-orange-600 text-[10px]">{item.serverMessage}</div>
        )}
      </div>
    </div>
  );
};

// ─── Toggle Component ─────────────────────────────────────────────────────────

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  labelOff?: string;
  labelOn?: string;
}

const ToggleSwitch = ({
  checked,
  onChange,
  labelOff = "Off",
  labelOn = "On",
}: ToggleSwitchProps) => (
  <div className="flex items-center gap-2 text-sm">
    <span className={!checked ? "font-semibold text-gray-800" : "text-gray-400"}>
      {labelOff}
    </span>
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
    <span className={checked ? "font-semibold text-gray-800" : "text-gray-400"}>
      {labelOn}
    </span>
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
  const [scanSku, setScanSku] = useState("");
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

  // ── Local-First Queue state ────────────────────────────────────────────────
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  // Optimistic items: scan yang sudah masuk queue lokal tapi belum/sedang sync
  const [optimisticScans, setOptimisticScans] = useState<QueuedScan[]>([]);

  // Anti-ghosting: ref untuk track scan terakhir
  const lastScanRef = useRef<{ value: string; time: number }>({ value: "", time: 0 });
  const SCAN_COOLDOWN_MS = 500;

  // Sync debounce timer
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const outboundNo = Array.isArray(outbound) ? outbound[0] : (outbound ?? "");

  // ─── Refresh pending count dari IndexedDB ─────────────────────────────────

  const refreshPendingCount = useCallback(async () => {
    if (!outboundNo) return;
    const count = await getPendingCount(outboundNo);
    setPendingCount(count);
  }, [outboundNo]);

  // ─── Batch Sync ke Server ─────────────────────────────────────────────────
  // Kirim semua unsynced scan dalam SATU request batch

  const syncQueue = useCallback(async () => {
    if (!outboundNo || !navigator.onLine) return;

    const unsynced = await getUnsyncedScans(outboundNo);
    if (unsynced.length === 0) return;

    setIsSyncing(true);

    try {
      // Kirim batch ke endpoint khusus
      // Format: { scans: [{ localId, payload }] }
      const response = await api.post(
        `/mobile/outbound/picking/scan-batch/${outboundNo}`,
        { scans: unsynced.map((s) => ({ localId: s.localId, payload: s.payload })) }
      );

      const data = await response.data;

      if (data.success && Array.isArray(data.results)) {
        // Process tiap result dari server
        for (const result of data.results) {
          await markAsSynced(result.localId, result.status, result.message);

          if (result.status === "ok") {
            playBeep("ok");
          } else if (result.status === "duplicate") {
            playBeep("duplicate");
            eventBus.emit("showAlert", {
              title: "Duplicate",
              description: result.message ?? "Serial sudah pernah discan",
              type: "error",
            });
          } else if (result.status === "invalid") {
            playBeep("error");
            eventBus.emit("showAlert", {
              title: "Invalid Scan",
              description: result.message ?? "Barcode tidak valid",
              type: "error",
            });
          }
        }

        // Update optimistic items status
        setOptimisticScans((prev) =>
          prev.map((item) => {
            const found = data.results.find((r: any) => r.localId === item.localId);
            if (found) return { ...item, synced: true, status: found.status, serverMessage: found.message };
            return item;
          })
        );

        // Refresh data dari server setelah sync berhasil
        fetchOutboundDetail();
      }
    } catch (err) {
      // Offline atau error — akan retry saat online kembali
      console.warn("Sync failed, will retry:", err);
      // Increment retry counter untuk semua yang gagal
      for (const s of unsynced) {
        await markRetryIncrement(s.localId);
      }
    } finally {
      setIsSyncing(false);
      await refreshPendingCount();
    }
  }, [outboundNo]);

  // Trigger sync dengan debounce 300ms
  // Mengumpulkan scan dalam window 300ms sebelum kirim batch
  const triggerSync = useCallback(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      syncQueue();
    }, 300);
  }, [syncQueue]);

  // ─── Anti-ghosting Check ──────────────────────────────────────────────────

  const isDuplicateScan = useCallback((value: string): boolean => {
    const now = Date.now();
    if (
      value === lastScanRef.current.value &&
      now - lastScanRef.current.time < SCAN_COOLDOWN_MS
    ) {
      return true;
    }
    lastScanRef.current = { value, time: now };
    return false;
  }, []);

  // ─── QR Helpers ───────────────────────────────────────────────────────────

  const handleQrInputChange = (raw: string) => {
    setQrRawInput(raw);
    const parsed = parseQRCode(raw);

    if (parsed) {
      console.log("Parsed QR Data:", parsed);
      setParsedQR(parsed);

      if (parsed.ean) setScanBarcode(parsed.ean);
      if (parsed.sku) setScanSku(parsed.sku);

      if (parsed.labelType === "UNIT") {
        if (parsed.serial) setSerialInputs([parsed.serial]);
        setScanQty(1);
      }

      if (parsed.labelType === "CARTON") {
        if (parsed.qtyPerCarton) setScanQty(parsed.qtyPerCarton);
      }
    } else {
      setParsedQR(null);
    }
  };

  const handleModeToggle = (qr: boolean) => {
    setIsQrMode(qr);
    setQrRawInput("");
    setParsedQR(null);
    setScanSku("");
    setScanBarcode("");
    setScanQty(1);
    setTimeout(() => {
      document.getElementById(qr ? "qr-input" : "barcode")?.focus();
    }, 50);
  };

  // ─── Fetch helpers ────────────────────────────────────────────────────────

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
      const response = await api.get("/mobile/outbound/detail/" + outboundNo, {
        withCredentials: true,
      });
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
      const response = await api.get("/mobile/outbound/picking/scan/" + id, {
        withCredentials: true,
      });
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
      const response = await api.get(`/mobile/outbound/master-cartons/${id}`, {
        withCredentials: true,
      });
      if (response.data.success) setMasterCarton(response.data.data);
    } catch (error) {
      console.error("Error fetching master carton:", error);
      eventBus.emit("showAlert", {
        title: "Warning",
        description: "Failed to load carton information",
        type: "error",
      });
    } finally {
      setIsLoadingMasterCarton(false);
    }
  }, []);

  const fetchAllMasterCartons = useCallback(async () => {
    try {
      const response = await api.get("/mobile/outbound/master-cartons", {
        withCredentials: true,
      });
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

  // ─── Effects ──────────────────────────────────────────────────────────────

  // Init: storage persistence + cleanup + pending count
  useEffect(() => {
    requestStoragePersistence();
    cleanupOldSynced(3);
    if (outboundNo) refreshPendingCount();
  }, [outboundNo]);

  // Online/offline event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync saat koneksi kembali
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [triggerSync]);

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

  // ─── LOCAL-FIRST SCAN HANDLER ─────────────────────────────────────────────
  // Ini versi baru handleScan yang pakai local queue
  // Alur: Validasi lokal → Simpan IndexedDB → Optimistic UI → Trigger sync background

  const handleScan = async (
    overrideBarcode?: string,
    overrideUom?: string
  ) => {
    const barcode = overrideBarcode ?? scanBarcode;
    const uom = overrideUom ?? scanUom;

    if (!barcode.trim()) return;

    // Anti-ghosting: cegah scan duplikat dalam 500ms
    // if (isDuplicateScan(barcode + (serialInputs[0] ?? ""))) {
    //   console.log("Ghost scan ignored:", barcode);
    //   return;
    // }

    let serialNumber =
      serialInputs.length > 1
        ? serialInputs.filter((s) => s.trim() !== "").join("-")
        : serialInputs[0]?.trim() ?? "";

    if (isQrMode && parsedQR?.cartonSerial) {
      serialNumber = parsedQR.cartonSerial;
    }

    const payload: ScanItem = {
      carton_id: masterCarton?.id ?? null,
      carton_code: masterCarton?.carton_code ?? null,
      outbound_no: outboundNo,
      location: scanLocation,
      barcode: barcode,
      serial_no: serialNumber,
      qty: scanQty as number,
      uom: uom,
      packing_no: packingNo,
      pack_ctn_no: packCtnNo === "" ? null : packCtnNo,
      qr_raw: isQrMode ? qrRawInput : undefined,
      lot_no: isQrMode ? parsedQR?.batch : undefined,
      prod_date: isQrMode ? parsedQR?.mfgDate : undefined,
    };

    // Buat entry queue lokal
    const queueEntry: QueuedScan = {
      localId: crypto.randomUUID(),
      outboundNo,
      payload,
      scannedAt: new Date().toISOString(),
      synced: false,
      status: "pending",
      retryCount: 0,
    };

    try {
      // 1. Simpan ke IndexedDB (non-blocking dari perspektif UI)
      await addToQueue(queueEntry);

      // 2. OPTIMISTIC UI: tampilkan scan langsung tanpa tunggu server
      setOptimisticScans((prev) => [queueEntry, ...prev]);
      playBeep("queued"); // beep singkat: scan diterima lokal

      // 3. Refresh pending count
      await refreshPendingCount();

      // 4. Tutup dialog & reset field — operator bisa langsung scan berikutnya
      closeDialog();

      // 5. Trigger background sync (debounced 300ms)
      triggerSync();

    } catch (err) {
      console.error("Failed to queue scan:", err);
      playBeep("error");
      eventBus.emit("showAlert", {
        title: "Error",
        description: "Gagal menyimpan scan ke antrian lokal",
        type: "error",
      });
    }
  };

  // ─── Item Check (validasi ke server sebelum tampil form detail) ───────────
  // Alur ini tetap ONLINE karena butuh konfirmasi is_serial dari server
  // Tapi jika offline, kita skip validasi dan langsung ke dialog

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scanBarcode.trim() && !scanSku.trim()) {
      document.getElementById(isQrMode ? "qr-input" : "barcode")?.focus();
      return;
    }

    // Anti-ghosting check
    if (isDuplicateScan(scanBarcode + scanSku)) return;

    const newItem: ScanItem = {
      sku: scanSku,
      outbound_no: outboundNo,
      barcode: scanBarcode,
      qty: scanQty as number,
    };

    if (isSubmit) return;
    setIsLoading(true);
    setIsSubmit(true);

    // Jika offline: skip validasi server, langsung ke dialog dengan asumsi non-serial
    // Validasi akan terjadi saat sync (server bisa reject kalau invalid)
    // if (!navigator.onLine) {
    if (1 == 1) {
      setIsLoading(false);
      setIsSubmit(false);
      setIsSerial(false);

      if (invPolicy?.picking_single_scan) {
        // Auto-scan tanpa dialog
        console.warn("Offline mode: skipping server validation, assuming non-serial");
        await handleScan(scanBarcode, scanUom);
      } else {
        setShowDialog(true);
      }
      return;
    }

    // try {
    //   const response = await api.post(
    //     "/mobile/outbound/item-check/" + outboundNo,
    //     newItem
    //   );
    //   const res = await response.data;

    //   if (res.success) {
    //     const resolvedBarcode = qrRawInput
    //       ? (res.data.product?.barcode ?? scanBarcode)
    //       : scanBarcode;

    //     const resolvedUom = res.data?.uom?.from_uom ?? "";

    //     setScanBarcode(resolvedBarcode);
    //     setScanUom(resolvedUom);

    //     if (res.is_serial) {
    //       setIsSerial(true);
    //       setShowDialog(true);
    //     } else {
    //       setIsSerial(false);
    //       setScanUom(res.data?.uom?.from_uom ?? "");
    //       if (invPolicy?.picking_single_scan) {
    //         handleScan(resolvedBarcode, resolvedUom);
    //       } else {
    //         setShowDialog(true);
    //       }
    //     }
    //   }
    // } catch (error) {
    //   console.error("Error checking item:", error);
    // } finally {
    //   setIsLoading(false);
    //   setIsSubmit(false);
    // }
  };

  const handleSerialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emptyIndex = serialInputs.findIndex((s) => s.trim() === "");
    if (emptyIndex !== -1) {
      (
        document.getElementById(`serial-${emptyIndex}`) as HTMLInputElement
      )?.focus();
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
    setScanSku("");
    setScanQty(1);
    setQrRawInput("");
    setParsedQR(null);
    setTimeout(() => {
      document.getElementById(isQrMode ? "qr-input" : "barcode")?.focus();
    }, 50);
  };

  // ─── Remove handlers ──────────────────────────────────────────────────────

  const handleRemoveItem = async (id: number, outbound_detail_id: number) => {
    if (isSubmit) return;
    setIsSubmit(true);
    try {
      const response = await api.delete("/mobile/outbound/picking/scan/" + id, {
        withCredentials: true,
      });
      const data = await response.data;
      if (data.success) {
        fetchScannedItems(outbound_detail_id);
        fetchOutboundDetail();
        eventBus.emit("showAlert", {
          title: "Success!",
          description: "Item deleted successfully",
          type: "success",
        });
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setIsSubmit(false);
    }
  };

  const handleRemoveCarton = async (
    cartonNo: string,
    outbound_detail_id: number
  ) => {
    if (isSubmit) return;
    setIsSubmit(true);
    try {
      const itemsToDelete = listOutboundScanned.filter(
        (item) => item.pack_ctn_no === cartonNo
      );
      for (const item of itemsToDelete) {
        await api.delete("/mobile/outbound/picking/scan/" + item.id, {
          withCredentials: true,
        });
      }
      fetchScannedItems(outbound_detail_id);
      fetchOutboundDetail();
      setShowDeleteCartonConfirm(false);
      setCartonToDelete("");
      eventBus.emit("showAlert", {
        title: "Success!",
        description: `Carton ${cartonNo} deleted`,
        type: "success",
      });
    } catch (error) {
      console.error("Error deleting carton:", error);
      eventBus.emit("showAlert", {
        title: "Error!",
        description: "Failed to delete container",
        type: "error",
      });
    } finally {
      setIsSubmit(false);
    }
  };

  // ─── Carton handlers ──────────────────────────────────────────────────────

  const handleNewCarton = async () => {
    if (isCreatingCarton) return;
    setIsCreatingCarton(true);
    try {
      const response = await api.get(
        `/mobile/outbound/picking/${outboundNo}/cartons/next`,
        { withCredentials: true }
      );
      if (response.data.success) {
        const next = response.data.next_ctn_no.toString();
        setPackCtnNo(next);
        eventBus.emit("showAlert", {
          title: "Success!",
          description: `Moved to Carton #${next}`,
          type: "success",
        });
      }
    } catch (error) {
      console.error("Error creating new carton:", error);
      eventBus.emit("showAlert", {
        title: "Error!",
        description: "Failed to create new carton",
        type: "error",
      });
    } finally {
      setIsCreatingCarton(false);
    }
  };

  const handleUpdateCarton = () => {
    if (!selectedNewCartonId) {
      eventBus.emit("showAlert", {
        title: "Warning",
        description: "Please select a carton type",
        type: "error",
      });
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
        {
          pack_ctn_no: packCtnNo,
          new_carton_id: parseInt(selectedNewCartonId),
          outbound_no: outboundNo,
        },
        { withCredentials: true }
      );
      if (response.data.success) {
        await fetchMasterCartonDetails(selectedNewCartonId);
        router.replace(
          {
            pathname: router.pathname,
            query: { ...router.query, master_carton_id: selectedNewCartonId },
          },
          undefined,
          { shallow: true }
        );
        setShowEditCartonDialog(false);
        setShowConfirmUpdateCarton(false);
        eventBus.emit("showAlert", {
          title: "Success!",
          description: "Carton type updated successfully",
          type: "success",
        });
      }
    } catch (error: any) {
      console.error("Error updating carton:", error);
      eventBus.emit("showAlert", {
        title: "Error!",
        description:
          error.response?.data?.message || "Failed to update carton type",
        type: "error",
      });
    } finally {
      setIsUpdatingCarton(false);
    }
  };

  // ─── Seal container handlers ──────────────────────────────────────────────

  const handleConfirmSeal = () => {
    if (!containerWeight || parseFloat(containerWeight) <= 0) {
      eventBus.emit("showAlert", {
        title: "Warning",
        description: "Please enter a valid weight",
        type: "error",
      });
      return;
    }
    setShowSealContainerDialog(false);
    setShowConfirmSealContainer(true);
  };

  const handleSealContainerSubmit = async () => {
    setIsSealingContainer(true);
    try {
      const payload = {
        outbound_no: outboundNo,
        packing_no: packingNo,
        ctn_no: packCtnNo,
        weight: parseFloat(containerWeight),
      };
      const response = await api.post(
        "/mobile/outbound/picking/seal-container/" + outboundNo,
        payload,
        { withCredentials: true }
      );
      if (response.data.success) {
        setShowConfirmSealContainer(false);
        setContainerWeight("");
        eventBus.emit("showAlert", {
          title: "Success!",
          description: `Container ${packCtnNo} sealed successfully`,
          type: "success",
        });
      }
    } catch (error: any) {
      console.error("Error sealing container:", error);
      eventBus.emit("showAlert", {
        title: "Error!",
        description:
          error.response?.data?.message || "Failed to seal container",
        type: "error",
      });
    } finally {
      setIsSealingContainer(false);
    }
  };

  // ─── Derived ──────────────────────────────────────────────────────────────

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
    const matchesCarton =
      selectedCarton === "all" || item.pack_ctn_no === selectedCarton;
    return matchesSearch && matchesCarton;
  });

  const uniqueCartons = Array.from(
    new Set(
      listOutboundScanned.map((item) => item.pack_ctn_no).filter(Boolean)
    )
  ).sort() as string[];

  const groupedItems = filteredScannedItems.reduce<Record<number, ScannedItem[]>>(
    (groups, item) => {
      const key = item.seq_box;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    },
    {}
  );

  const getSelectedNewCartonDetails = () =>
    masterCartonsList.find((c) => c.id.toString() === selectedNewCartonId) ?? null;

  const totalScanQty = filteredItems.reduce((t, i) => t + (i.scan_qty ?? 0), 0);
  const totalPlanQty = filteredItems.reduce((t, i) => t + i.quantity, 0);

  // Optimistic scans yang relevan untuk outbound ini (pending saja)
  const pendingOptimisticScans = optimisticScans.filter(
    (s) => s.outboundNo === outboundNo
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader title={outboundNo} showBackButton />

      <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-40 max-w-md mx-auto">

        {/* ── Sync Status Bar ── */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {outboundNo}
          </span>
          <SyncStatusBadge
            isOnline={isOnline}
            pendingCount={pendingCount}
            isSyncing={isSyncing}
          />
        </div>

        {/* ── Offline Warning Banner ── */}
        {!isOnline && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-700">
            <WifiOff size={13} />
            <span>
              Mode offline — scan tetap bisa dilakukan, akan otomatis sync saat koneksi kembali.
            </span>
          </div>
        )}

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
              {/* EAN mode */}
              {!isQrMode && (
                <div className="flex items-center space-x-2">
                  <label
                    htmlFor="barcode"
                    className="text-sm text-gray-600 whitespace-nowrap"
                  >
                    EAN :
                  </label>
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
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => {
                          setScanBarcode("");
                          setScanSku("");
                          document.getElementById("barcode")?.focus();
                        }}
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
                    <label
                      htmlFor="qr-input"
                      className="text-sm text-gray-600 whitespace-nowrap"
                    >
                      QR Code :
                    </label>
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
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => {
                            setQrRawInput("");
                            setParsedQR(null);
                            setScanBarcode("");
                            setScanSku("");
                            document.getElementById("qr-input")?.focus();
                          }}
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* QR Preview */}
                  {parsedQR && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs font-mono space-y-0.5">
                      {parsedQR.labelType && (
                        <div>
                          <span className="text-gray-500">Type:</span>{" "}
                          <span
                            className={
                              parsedQR.labelType === "UNIT"
                                ? "text-purple-600 font-semibold"
                                : "text-blue-600 font-semibold"
                            }
                          >
                            {parsedQR.labelType === "UNIT"
                              ? "Unit / Serial"
                              : "Master Carton"}
                          </span>
                        </div>
                      )}
                      {parsedQR.sku && (
                        <div>
                          <span className="text-gray-500">SKU:</span>{" "}
                          {parsedQR.sku}
                        </div>
                      )}
                      {parsedQR.ean && (
                        <div>
                          <span className="text-gray-500">EAN:</span>{" "}
                          {parsedQR.ean}
                        </div>
                      )}
                      {parsedQR.product && (
                        <div>
                          <span className="text-gray-500">Product:</span>{" "}
                          {parsedQR.product}
                        </div>
                      )}
                      {parsedQR.serial && (
                        <div>
                          <span className="text-gray-500">Serial:</span>{" "}
                          {parsedQR.serial}
                        </div>
                      )}
                      {parsedQR.mfgDate && (
                        <div>
                          <span className="text-gray-500">MFG Date:</span>{" "}
                          {parsedQR.mfgDate}
                        </div>
                      )}
                      {parsedQR.batch && (
                        <div>
                          <span className="text-gray-500">Batch:</span>{" "}
                          {parsedQR.batch}
                        </div>
                      )}
                      {parsedQR.cartonSerial && (
                        <div>
                          <span className="text-gray-500">Carton Serial:</span>{" "}
                          {parsedQR.cartonSerial}
                        </div>
                      )}
                      {parsedQR.qtyPerCarton && (
                        <div>
                          <span className="text-gray-500">Qty/Carton:</span>{" "}
                          {parsedQR.qtyPerCarton}
                        </div>
                      )}
                    </div>
                  )}
                  {qrRawInput && !parsedQR && (
                    <p className="text-xs text-red-500">
                      Format QR tidak dikenali. Pastikan format: (1)SKU=...
                    </p>
                  )}
                </div>
              )}

              <Button
                disabled={isSubmit || (!scanSku.trim() && !scanBarcode.trim())}
                type="submit"
                className="w-full"
                size="sm"
              >
                {isSubmit ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  "Scan"
                )}
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
            Total Qty :{" "}
            <span className="font-semibold">
              {totalScanQty} / {totalPlanQty}
            </span>
          </span>
        </div>

        {/* ── Optimistic Scan Feed (pending + baru discan) ── */}
        {pendingOptimisticScans.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Recent Scans
                </span>
                {isSyncing && (
                  <span className="text-xs text-blue-500 flex items-center gap-1">
                    <Loader2 size={10} className="animate-spin" />
                    Syncing...
                  </span>
                )}
              </div>
              {pendingOptimisticScans.slice(0, 10).map((scan) => (
                <OptimisticItem key={scan.localId} item={scan} />
              ))}
              {pendingOptimisticScans.length > 10 && (
                <p className="text-xs text-gray-400 text-center">
                  +{pendingOptimisticScans.length - 10} item lainnya
                </p>
              )}
            </CardContent>
          </Card>
        )}

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
                    onClick={() => {
                      fetchScannedItems(item.outbound_detail_id);
                      setShowModalDetail(true);
                    }}
                    className="flex flex-col border p-3 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="text-xs font-mono space-y-0.5">
                      <div>
                        <strong>Item Code :</strong> {item.item_code}
                      </div>
                      <div>
                        <strong>Item Name :</strong> {item.item_name}
                      </div>
                      <div>
                        <strong>EAN :</strong> {item.barcode}
                      </div>
                      <div>
                        <strong>Scanned:</strong>{" "}
                        <span
                          className={
                            (item.scan_qty ?? 0) >= item.quantity
                              ? "text-green-600 font-semibold"
                              : "text-orange-500 font-semibold"
                          }
                        >
                          {item.scan_qty ?? 0}
                        </span>
                        {" / "}
                        {item.quantity} {item.uom}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-400 text-center py-4">
                Tidak ada barang ditemukan
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Seal Container Dialog — Input Weight ── */}
        <Dialog
          open={showSealContainerDialog}
          onOpenChange={setShowSealContainerDialog}
        >
          <DialogContent className="bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Seal Container</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Outbound No:</span>
                  <span className="font-semibold">{outboundNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Packing No:</span>
                  <span className="font-semibold">{packingNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Container No:</span>
                  <span className="font-semibold">{packCtnNo}</span>
                </div>
                {masterCarton && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Carton Type:</span>
                    <span className="font-semibold">
                      {masterCarton.carton_name}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="container_weight"
                  className="text-sm font-medium text-gray-700"
                >
                  Container Weight (kg){" "}
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  id="container_weight"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter weight in kg..."
                  value={containerWeight}
                  onChange={(e) => setContainerWeight(e.target.value)}
                  autoFocus
                />
                {masterCarton && (
                  <p className="text-xs text-gray-500">
                    Max weight: {masterCarton.max_weight} kg | Tare weight:{" "}
                    {masterCarton.tare_weight} kg
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSealContainerDialog(false);
                  setContainerWeight("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSeal}
                className="bg-green-600 hover:bg-green-700"
              >
                Next
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Seal Container Confirmation ── */}
        <Dialog
          open={showConfirmSealContainer}
          onOpenChange={setShowConfirmSealContainer}
        >
          <DialogContent className="bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Seal Container</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  ⚠️ Confirmation Required
                </p>
                <p className="text-sm text-gray-700">
                  Sealing <strong>Container #{packCtnNo}</strong> will prevent
                  adding more items.
                </p>
              </div>
              <div className="border rounded-md p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Outbound No:</span>
                  <span className="font-medium">{outboundNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Packing No:</span>
                  <span className="font-medium">{packingNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Container No:</span>
                  <span className="font-medium">{packCtnNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight:</span>
                  <span className="font-medium text-green-600">
                    {containerWeight} kg
                  </span>
                </div>
                {masterCarton && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Carton Type:</span>
                    <span className="font-medium">
                      {masterCarton.carton_name}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 italic">
                Please verify all information before confirming.
              </p>
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                disabled={isSealingContainer}
                onClick={() => {
                  setShowConfirmSealContainer(false);
                  setShowSealContainerDialog(true);
                }}
              >
                Back
              </Button>
              <Button
                onClick={handleSealContainerSubmit}
                disabled={isSealingContainer}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSealingContainer ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sealing...
                  </>
                ) : (
                  "Confirm Seal"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Edit Carton Dialog ── */}
        <Dialog
          open={showEditCartonDialog}
          onOpenChange={setShowEditCartonDialog}
        >
          <DialogContent className="bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Change Carton Type</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Select
                value={selectedNewCartonId}
                onValueChange={setSelectedNewCartonId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select new carton type" />
                </SelectTrigger>
                <SelectContent>
                  {masterCartonsList.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {c.carton_name}
                          {c.is_default && (
                            <span className="ml-2 text-xs text-blue-500">
                              (Default)
                            </span>
                          )}
                          {c.id === masterCarton?.id && (
                            <span className="ml-2 text-xs text-green-600">
                              (Current)
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-gray-500">
                          {c.dimensions} - Max: {c.max_weight}kg
                        </span>
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
                      <span className="font-semibold text-blue-900">
                        {getSelectedNewCartonDetails()?.carton_name}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                      <div>
                        <span className="font-medium">Size:</span>{" "}
                        {getSelectedNewCartonDetails()?.dimensions}
                      </div>
                      <div>
                        <span className="font-medium">Max Weight:</span>{" "}
                        {getSelectedNewCartonDetails()?.max_weight}kg
                      </div>
                      <div>
                        <span className="font-medium">Volume:</span>{" "}
                        {getSelectedNewCartonDetails()?.volume.toLocaleString()}{" "}
                        cm³
                      </div>
                      <div>
                        <span className="font-medium">Material:</span>{" "}
                        {getSelectedNewCartonDetails()?.material}
                      </div>
                    </div>
                    {getSelectedNewCartonDetails()?.description && (
                      <p className="text-xs text-gray-600 italic">
                        {getSelectedNewCartonDetails()?.description}
                      </p>
                    )}
                  </div>
                </Card>
              )}
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                disabled={isUpdatingCarton}
                onClick={() => {
                  setShowEditCartonDialog(false);
                  setSelectedNewCartonId(
                    masterCarton?.id.toString() ?? ""
                  );
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateCarton}
                disabled={isUpdatingCarton || !selectedNewCartonId}
              >
                {isUpdatingCarton ? "Updating..." : "Update Carton"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Confirm Update Carton ── */}
        <Dialog
          open={showConfirmUpdateCarton}
          onOpenChange={setShowConfirmUpdateCarton}
        >
          <DialogContent className="bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Change Carton Type</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  ⚠️ Important Notice
                </p>
                <p className="text-sm text-gray-700">
                  All items in <strong>Carton #{packCtnNo}</strong> will be
                  updated to the new carton type.
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center py-2 border-b text-sm">
                  <span className="text-gray-600">Current Carton:</span>
                  <span className="font-semibold text-gray-800">
                    {masterCarton?.carton_name}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b text-sm">
                  <span className="text-gray-600">New Carton:</span>
                  <span className="font-semibold text-blue-600">
                    {getSelectedNewCartonDetails()?.carton_name}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 italic">
                This action cannot be undone.
              </p>
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                disabled={isUpdatingCarton}
                onClick={() => setShowConfirmUpdateCarton(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmUpdateCarton}
                disabled={isUpdatingCarton}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUpdatingCarton ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Confirm Update"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Detail Scanned Items Dialog ── */}
        <Dialog open={showModalDetail} onOpenChange={setShowModalDetail}>
          <DialogContent className="bg-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-mono">Scanned Items</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                className="w-full"
                placeholder="Search ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {invPolicy?.require_packing_scan && uniqueCartons.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 whitespace-nowrap">
                    Filter Container:
                  </label>
                  <Select
                    value={selectedCarton}
                    onValueChange={setSelectedCarton}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select carton" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Container</SelectItem>
                      {uniqueCartons.map((c) => (
                        <SelectItem key={c} value={c}>
                          Container {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {filteredScannedItems.length > 0 ? (
                Object.entries(groupedItems).map(([koli, items]) => {
                  const cartonNo =
                    selectedCarton === "all"
                      ? "ALL"
                      : (items as ScannedItem[])[0]?.pack_ctn_no;
                  return (
                    <div
                      key={koli}
                      className="p-2 border rounded-md bg-gray-50"
                    >
                      <div className="font-semibold text-sm font-mono mb-2 flex justify-between items-center">
                        <div>
                          {invPolicy?.require_packing_scan &&
                            cartonNo &&
                            cartonNo !== "ALL" && (
                              <div className="text-sm text-gray-600">
                                CTN : {cartonNo}
                              </div>
                            )}
                          ITEM : {(items as ScannedItem[]).length}, QTY :{" "}
                          {(items as ScannedItem[]).reduce(
                            (t, i) => t + (i.qty_data_scan ?? 0),
                            0
                          )}
                        </div>
                        {invPolicy?.require_packing_scan &&
                          cartonNo &&
                          cartonNo !== "ALL" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-7 text-xs"
                              disabled={isSubmit}
                              onClick={() => {
                                setCartonToDelete(cartonNo);
                                setShowDeleteCartonConfirm(true);
                              }}
                            >
                              Delete Container
                            </Button>
                          )}
                      </div>

                      {(items as ScannedItem[]).map((item, index) => (
                        <div
                          key={index}
                          className={`p-2 border rounded-md mb-2 ${
                            item.status === "in stock"
                              ? "bg-green-100"
                              : "bg-blue-100"
                          }`}
                        >
                          <div className="text-xs space-y-0.5 font-mono">
                            {invPolicy?.require_scan_pick_location && (
                              <div>
                                <strong>Location:</strong> {item.location_scan}
                              </div>
                            )}
                            {invPolicy?.require_packing_scan && (
                              <>
                                <div>
                                  <strong>PACK:</strong> {item.packing_no}
                                </div>
                                <div>
                                  <strong>CTN:</strong> {item.pack_ctn_no}
                                </div>
                              </>
                            )}
                            <div>
                              <strong>EAN:</strong> {item.barcode_data_scan}
                            </div>
                            {item.is_serial && (
                              <div>
                                <strong>Serial:</strong> {item.serial_number}
                              </div>
                            )}
                            <div>
                              <strong>QTY:</strong> {item.qty_data_scan}{" "}
                              {item.uom_scan}
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            {item.status === "pending" && (
                              <Button
                                disabled={isSubmit}
                                className="h-6"
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleRemoveItem(
                                    item.id!,
                                    item.outbound_detail_id
                                  )
                                }
                              >
                                {isSubmit ? "Deleting..." : "Delete"}
                              </Button>
                            )}
                            {item.status && (
                              <span className="text-xs text-gray-400 font-mono ml-auto">
                                {item.status}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })
              ) : (
                <div className="text-gray-500 text-sm text-center py-4">
                  {selectedCarton !== "all"
                    ? `No items found in Carton ${selectedCarton}`
                    : "This item has not been scanned."}
                </div>
              )}
            </div>
            <DialogFooter />
          </DialogContent>
        </Dialog>

        {/* ── Delete Carton Confirmation ── */}
        <Dialog
          open={showDeleteCartonConfirm}
          onOpenChange={setShowDeleteCartonConfirm}
        >
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Confirm Delete Container</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete all items in Container{" "}
                <strong>{cartonToDelete}</strong>?
              </p>
              <p className="text-sm text-red-600">
                This action cannot be undone.
              </p>
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                disabled={isSubmit}
                onClick={() => {
                  setShowDeleteCartonConfirm(false);
                  setCartonToDelete("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={isSubmit}
                onClick={() => {
                  const detailId = listOutboundScanned.find(
                    (i) => i.pack_ctn_no === cartonToDelete
                  )?.outbound_detail_id;
                  if (detailId)
                    handleRemoveCarton(cartonToDelete, detailId);
                }}
              >
                {isSubmit ? "Deleting..." : "Delete Container"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── List Container Dialog ── */}
        <Dialog
          open={showListContainerDialog}
          onOpenChange={setShowListContainerDialog}
        >
          <DialogContent className="bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold text-gray-800">
                List Container — {outboundNo}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
              {listContainerSummary.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No container data found
                </div>
              ) : (
                listContainerSummary.map(
                  ({ pack_ctn_no, qty: totalQty, items: barcodes }) => {
                    const isCurrent = pack_ctn_no === packCtnNo;
                    return (
                      <div
                        key={pack_ctn_no}
                        className={`rounded-lg border p-3 space-y-1.5 ${
                          isCurrent
                            ? "border-blue-400 bg-blue-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Box
                              size={13}
                              className={
                                isCurrent ? "text-blue-600" : "text-gray-500"
                              }
                            />
                            <span
                              className={`text-xs font-bold font-mono ${
                                isCurrent
                                  ? "text-blue-700"
                                  : "text-gray-700"
                              }`}
                            >
                              CTN # {pack_ctn_no}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] bg-blue-600 text-white rounded px-1.5 py-0.5 font-medium">
                                Active
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-gray-800">
                            {totalQty}{" "}
                            <span className="font-normal text-gray-500">
                              qty
                            </span>
                          </span>
                        </div>
                        {(barcodes as string[]).length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {(barcodes as string[]).map((bc, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-mono bg-white border border-gray-200 text-gray-600 rounded px-1.5 py-0.5"
                              >
                                {bc}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                )
              )}
            </div>
            {listContainerSummary.length > 0 && (
              <div className="border-t pt-3 flex justify-between text-xs text-gray-600">
                <span>
                  {listContainerSummary.length} container
                  {listContainerSummary.length !== 1 ? "s" : ""} total
                </span>
                <span className="font-semibold text-gray-800">
                  {listContainerSummary.reduce((sum, c) => sum + c.qty, 0)}{" "}
                  total qty
                </span>
              </div>
            )}
            <DialogFooter>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs h-8"
                onClick={() => setShowListContainerDialog(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Fixed Bottom Bar ── */}
      {invPolicy?.require_packing_scan && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg px-4 pt-3 pb-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1 flex-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                CTN #
              </span>
              <span className="flex-1 text-center text-lg font-bold text-gray-800 tabular-nums min-w-[2rem]">
                {packCtnNo}
              </span>
            </div>
            {masterCarton && (
              <button
                type="button"
                onClick={() => setShowEditCartonDialog(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline truncate block w-full text-left"
              >
                {masterCarton.display_name}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isCreatingCarton}
              className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
              onClick={handleNewCarton}
            >
              {isCreatingCarton ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Box size={14} />
              )}
              New Ctn
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full h-8 bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md"
              onClick={() => setShowListContainerDialog(true)}
            >
              <List size={14} />
              List
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full h-8 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md"
              onClick={() => {
                setContainerWeight("");
                setShowSealContainerDialog(true);
              }}
            >
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
              <h2 className="text-base font-semibold text-gray-800">
                Scan Detail
              </h2>
              <button
                onClick={closeDialog}
                className="text-gray-400 hover:text-gray-600 text-2xl p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="px-4 py-4 pb-6 space-y-4">
              {/* Item Info */}
              <div className="p-3 bg-gray-100 rounded-md space-y-1 text-sm text-gray-600">
                {outboundNo && (
                  <p>
                    Picking ID :{" "}
                    <span className="font-medium text-gray-800">
                      {outboundNo}
                    </span>
                  </p>
                )}
                {invPolicy?.require_packing_scan && (
                  <p>
                    Packing No :{" "}
                    <span className="font-medium">{packingNo}</span>
                  </p>
                )}
                {invPolicy?.require_scan_pick_location && (
                  <p>
                    Location :{" "}
                    <span className="font-medium">{scanLocation}</span>
                  </p>
                )}
                <p>
                  EAN :{" "}
                  <span className="font-mono font-medium">{scanBarcode}</span>
                </p>
                {parsedQR?.product && (
                  <p>
                    Product :{" "}
                    <span className="font-mono font-medium">
                      {parsedQR.product}
                    </span>
                  </p>
                )}
                {isQrMode && parsedQR?.cartonSerial && (
                  <p>
                    Carton Serial :{" "}
                    <span className="font-mono font-medium">
                      {parsedQR.cartonSerial}
                    </span>
                  </p>
                )}

                {/* Sync status info di dialog */}
                {!isOnline && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-orange-600 bg-orange-50 rounded px-2 py-1">
                    <WifiOff size={11} />
                    <span>Offline — akan disync saat koneksi kembali</span>
                  </div>
                )}
              </div>

              {/* Serial Form */}
              {isSerial ? (
                <form onSubmit={handleSerialSubmit} className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                      Serial Numbers :
                    </label>
                    {serialInputs.map((serial, index) => (
                      <div key={index} className="relative">
                        <Input
                          autoComplete="off"
                          id={`serial-${index}`}
                          className="w-full pr-10"
                          value={serial}
                          onChange={(e) => {
                            const n = [...serialInputs];
                            n[index] = e.target.value;
                            setSerialInputs(n);
                          }}
                        />
                        {serial && (
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            onClick={() => {
                              const n = [...serialInputs];
                              n[index] = "";
                              setSerialInputs(n);
                              (
                                document.getElementById(
                                  `serial-${index}`
                                ) as HTMLInputElement
                              )?.focus();
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
                        onClick={() =>
                          setSerialInputs([...serialInputs, ""])
                        }
                      >
                        + Add Serial
                      </button>
                      {serialInputs.length > 1 && (
                        <button
                          type="button"
                          className="text-red-600 hover:text-red-800 text-sm font-semibold"
                          onClick={() =>
                            setSerialInputs(serialInputs.slice(0, -1))
                          }
                        >
                          − Remove Last
                        </button>
                      )}
                    </div>
                    {serialInputs.length > 1 && (
                      <div className="text-xs text-gray-500 break-all">
                        Combined:{" "}
                        {serialInputs
                          .filter((s) => s.trim() !== "")
                          .join("-")}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmit}
                    >
                      {isSubmit ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Submit"
                      )}
                    </Button>
                    <Button
                      type="button"
                      className="w-full"
                      variant="outline"
                      onClick={closeDialog}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                /* Quantity Form */
                <form onSubmit={handleQuantitySubmit} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <label
                      htmlFor="qty"
                      className="text-sm font-bold text-gray-700 whitespace-nowrap"
                    >
                      Qty / Unit
                    </label>
                    <Input
                      min={1}
                      type="number"
                      id="qty"
                      className="h-8 text-sm"
                      value={scanQty}
                      autoComplete="off"
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") {
                          setScanQty("");
                          return;
                        }
                        const n = Number(v);
                        setScanQty(n < 1 ? 1 : n);
                      }}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    />
                    <Input
                      readOnly
                      type="text"
                      id="uom"
                      className="h-8 text-sm w-20"
                      value={scanUom}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmit}
                    >
                      {isSubmit ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Submit"
                      )}
                    </Button>
                    <Button
                      type="button"
                      className="w-full"
                      variant="outline"
                      onClick={closeDialog}
                    >
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