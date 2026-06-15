/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/mobile/PageHeader";
import {
  Check,
  CheckCheck,
  ChevronDown,
  ChevronsUpDown,
  Filter,
  Loader2,
  Minus,
  Search,
  X,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";
import { InventoryPolicy } from "@/types/inventory";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScannedItem {
  id?: number;
  inbound_no: string;
  inbound_id: number;
  inbound_detail_id: number;
  barcode: string;
  division_code?: string;
  serial_number: string;
  serial_number_2?: string;
  pallet: string;
  location: string;
  qa_status: string;
  whs_code: string;
  scan_type: string;
  quantity: number;
  status?: string;
  rec_date?: string;
  prod_date?: string;
  exp_date?: string;
  lot_number?: string;
  uom?: string;
  qty_display?: number;
  ean_display?: string;
  uom_display?: string;
  owner_code?: string;
  item_code?: string;
  item_name?: string;
}

// ─── QR Parser (v1 + v2) ─────────────────────────────────────────────────────

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
  labelType: "UNIT" | "CARTON" | "UNKNOWN";
}

function parseQRCode(raw: string): ParsedQRData | null {
  if (!raw.startsWith("(") && raw.split("-").length === 12) {
    const segments = raw.split("-");
    const rawDate = segments[9];
    let mfgDate: string | undefined;
    if (rawDate?.length === 8) {
      mfgDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
    }
    const qtyMatch = segments[4].match(/^(\d+)/);
    const qtyPerCarton = qtyMatch ? Number(qtyMatch[1]) : undefined;
    return { sku: segments[1] || undefined, qtyPerCarton, mfgDate, labelType: "CARTON" };
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

  const labelType: "UNIT" | "CARTON" | "UNKNOWN" = map["SERIAL"]
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRecDate(raw?: string): string {
  if (!raw) return "-";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

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
    <span className={!checked ? "font-semibold text-gray-800" : "text-gray-400"}>{labelOff}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-blue-500" : "bg-gray-300"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
    <span className={checked ? "font-semibold text-gray-800" : "text-gray-400"}>{labelOn}</span>
  </div>
);

// ─── Generic Filter Select ────────────────────────────────────────────────────

interface FilterSelectProps {
  label: string;
  placeholder: string;
  options: { value: string; label: string; qty: number }[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  allLabel?: string;
  allQty?: number;
}

const FilterSelect = ({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  allLabel = "All",
  allQty,
}: FilterSelectProps) => {
  const [open, setOpen] = useState(false);
  const displayLabel = value === "all" ? allLabel : options.find((o) => o.value === value)?.label ?? value;

  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={`flex h-9 w-full items-center justify-between rounded-md border border-input px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors ${
              disabled
                ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                : "bg-white cursor-pointer hover:border-gray-400"
            }`}
          >
            <span className={value === "all" ? "text-gray-400" : "font-semibold text-gray-800"}>
              {displayLabel}
            </span>
            <ChevronsUpDown size={14} className="text-gray-400 shrink-0 ml-2" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0 bg-white z-50"
          align="start"
          sideOffset={4}
        >
          <Command>
            <CommandInput placeholder={placeholder} className="h-9" />
            <CommandList>
              <CommandEmpty>No option found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all"
                  onSelect={() => { onChange("all"); setOpen(false); }}
                  className="cursor-pointer"
                >
                  <span className={value === "all" ? "font-semibold" : ""}>{allLabel}</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    {allQty !== undefined && (
                      <span className="text-xs text-gray-400 tabular-nums">{allQty}</span>
                    )}
                    {value === "all" && <Check size={14} className="text-blue-500" />}
                  </div>
                </CommandItem>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={() => { onChange(opt.value); setOpen(false); }}
                    className="cursor-pointer"
                  >
                    <span className={value === opt.value ? "font-semibold" : ""}>{opt.label}</span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <span className="text-xs text-gray-400 tabular-nums">{opt.qty}</span>
                      {value === opt.value && <Check size={14} className="text-blue-500" />}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// ─── Mini Stat Card ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: string; // tailwind bg class
}

const StatCard = ({ label, value, accent = "bg-blue-500" }: StatCardProps) => (
  <div className="flex-1 bg-white border border-gray-100 rounded-lg p-2.5 shadow-sm overflow-hidden relative">
    <div className={`absolute left-0 top-0 bottom-0 w-1 ${accent} rounded-l-lg`} />
    <p className="text-xs text-gray-400 truncate pl-1">{label}</p>
    <p className="text-base font-bold text-gray-800 pl-1 leading-tight">{value}</p>
  </div>
);

// ─── Search Mode Type ─────────────────────────────────────────────────────────

type SearchMode = "barcode" | "pallet";

// ─── Active Filter Chip ───────────────────────────────────────────────────────

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}
const FilterChip = ({ label, onRemove }: FilterChipProps) => (
  <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-full px-2 py-0.5">
    {label}
    <button type="button" onClick={onRemove} className="text-blue-400 hover:text-blue-600">
      <X size={10} />
    </button>
  </span>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const TransferPage = () => {
  const router = useRouter();
  const { inbound } = router.query;

  // ── State ───────────────────────────────────────────────────────────────────
  const [scanLocation, setScanLocation] = useState("");
  const [scanPalletId, setScanPalletId] = useState("");
  const [scanLocation2, setScanLocation2] = useState("");
  const [qtyTransfer, setQtyTransfer] = useState(0);
  const [eanTransfer, setEanTransfer] = useState("");
  const [uomTransfer, setUomTransfer] = useState("");
  const [scanBarcode, setScanBarcode] = useState("");
  const [scanSku, setScanSku] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmModalMoveTo, setShowConfirmModalMoveTo] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showConfirmModalSelected, setShowConfirmModalSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invPolicy, setInvPolicy] = useState<InventoryPolicy | undefined>();
  const [itemSelected, setItemSelected] = useState<ScannedItem | null>(null);
  const [listInboundScanned, setListInboundScanned] = useState<ScannedItem[]>([]);
  const [isSubmit, setIsSubmit] = useState(false);
  const [showForm, setShowForm] = useState(true);

  // ── Filter Panel ─────────────────────────────────────────────────────────────
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // ── Cascade Filters ───────────────────────────────────────────────────────────
  const [filterDivision, setFilterDivision] = useState("all");
  const [filterRecDate, setFilterRecDate] = useState("all");
  const [filterItem, setFilterItem] = useState("all");
  const [filterPallet, setFilterPallet] = useState("all");

  // ── Search Mode toggle ───────────────────────────────────────────────────────
  const [searchMode, setSearchMode] = useState<SearchMode>("barcode");

  // ── QR state ────────────────────────────────────────────────────────────────
  const [isQrMode, setIsQrMode] = useState(false);
  const [qrRawInput, setQrRawInput] = useState("");
  const [parsedQR, setParsedQR] = useState<ParsedQRData | null>(null);

  // ── Multi-select state ───────────────────────────────────────────────────────
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // ── Helper: generate unique key per item ─────────────────────────────────────
  const itemKey = (item: ScannedItem) =>
    `${item.id ?? ""}_${item.inbound_detail_id}_${item.serial_number}`;

  // ── Reset all filters ─────────────────────────────────────────────────────────
  const resetAllFilters = () => {
    setFilterDivision("all");
    setFilterRecDate("all");
    setFilterItem("all");
    setFilterPallet("all");
    setSelectedKeys(new Set());
  };

  // ── Cascade: reset downstream when upstream changes ───────────────────────────
  useEffect(() => { setFilterRecDate("all"); setFilterItem("all"); setFilterPallet("all"); setSelectedKeys(new Set()); }, [filterDivision]);
  useEffect(() => { setFilterItem("all"); setFilterPallet("all"); setSelectedKeys(new Set()); }, [filterRecDate]);
  useEffect(() => { setFilterPallet("all"); setSelectedKeys(new Set()); }, [filterItem]);
  useEffect(() => { setSelectedKeys(new Set()); }, [filterPallet]);

  // Reset all filters & selection when raw data changes
  useEffect(() => { resetAllFilters(); }, [listInboundScanned]);

  // ── Cascade-aware option derivation ───────────────────────────────────────────

  // After division filter
  const afterDivision = useMemo(() => {
    if (filterDivision === "all") return listInboundScanned;
    return listInboundScanned.filter((i) => i.division_code === filterDivision);
  }, [listInboundScanned, filterDivision]);

  // After rec_date filter
  const afterRecDate = useMemo(() => {
    if (filterRecDate === "all") return afterDivision;
    return afterDivision.filter((i) => (i.rec_date ?? "") === filterRecDate);
  }, [afterDivision, filterRecDate]);

  // After item filter
  const afterItem = useMemo(() => {
    if (filterItem === "all") return afterRecDate;
    return afterRecDate.filter((i) => i.item_code === filterItem);
  }, [afterRecDate, filterItem]);

  // Final filtered list (after pallet)
  const filteredScannedItems = useMemo(() => {
    if (filterPallet === "all") return afterItem;
    return afterItem.filter((i) => i.pallet === filterPallet);
  }, [afterItem, filterPallet]);

  // ── Dropdown options (cascade-aware) ─────────────────────────────────────────

  const divisionOptions = useMemo(() => {
    const map = new Map<string, number>();
    listInboundScanned.forEach((i) => {
      if (i.division_code) map.set(i.division_code, (map.get(i.division_code) ?? 0) + (i.qty_display ?? 0));
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([value, qty]) => ({ value, label: value, qty }));
  }, [listInboundScanned]);

  const recDateOptions = useMemo(() => {
    const map = new Map<string, number>();
    afterDivision.forEach((i) => {
      if (i.rec_date) map.set(i.rec_date, (map.get(i.rec_date) ?? 0) + (i.qty_display ?? 0));
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0])).map(([value, qty]) => ({ value, label: formatRecDate(value), qty }));
  }, [afterDivision]);

  const itemOptions = useMemo(() => {
    const nameMap = new Map<string, string>();
    const qtyMap = new Map<string, number>();
    afterRecDate.forEach((i) => {
      if (i.item_code) {
        nameMap.set(i.item_code, i.item_name ?? i.item_code);
        qtyMap.set(i.item_code, (qtyMap.get(i.item_code) ?? 0) + (i.qty_display ?? 0));
      }
    });
    return Array.from(nameMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([value, name]) => ({
      value,
      label: `${value} — ${name}`,
      qty: qtyMap.get(value) ?? 0,
    }));
  }, [afterRecDate]);

  const palletOptions = useMemo(() => {
    const map = new Map<string, number>();
    afterItem.forEach((i) => {
      if (i.pallet) map.set(i.pallet, (map.get(i.pallet) ?? 0) + (i.qty_display ?? 0));
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([value, qty]) => ({ value, label: value, qty }));
  }, [afterItem]);

  // ── Active filter count ───────────────────────────────────────────────────────
  const activeFilterCount = [filterDivision, filterRecDate, filterItem, filterPallet].filter((f) => f !== "all").length;

  // ── QR Helpers ──────────────────────────────────────────────────────────────

  const handleQrInputChange = (raw: string) => {
    setQrRawInput(raw);
    const parsed = parseQRCode(raw);
    if (parsed) {
      setParsedQR(parsed);
      if (parsed.ean) setScanBarcode(parsed.ean);
      else if (parsed.sku) setScanBarcode(parsed.sku);
      if (parsed.sku) setScanSku(parsed.sku);
    } else {
      setParsedQR(null);
      setScanBarcode("");
    }
  };

  const handleModeToggle = (qr: boolean) => {
    setIsQrMode(qr);
    setQrRawInput("");
    setParsedQR(null);
    setScanBarcode("");
    setListInboundScanned([]);
    setTimeout(() => { document.getElementById(qr ? "qr-input" : "barcode")?.focus(); }, 50);
  };

  const clearQr = () => {
    setQrRawInput("");
    setParsedQR(null);
    setScanBarcode("");
    setListInboundScanned([]);
    document.getElementById("qr-input")?.focus();
  };

  // ── Search Mode Switch ───────────────────────────────────────────────────────

  const handleSearchModeToggle = (toPallet: boolean) => {
    const newMode: SearchMode = toPallet ? "pallet" : "barcode";
    setSearchMode(newMode);
    setScanLocation("");
    setScanPalletId("");
    setScanBarcode("");
    setQrRawInput("");
    setParsedQR(null);
    setListInboundScanned([]);
    setShowForm(true);
    setIsQrMode(false);
    setSelectedKeys(new Set());
    setTimeout(() => { document.getElementById(toPallet ? "pallet-id" : "location")?.focus(); }, 50);
  };

  // ── Fetch helpers ────────────────────────────────────────────────────────────

  const fetchPolicy = useCallback(async (owner: string) => {
    try {
      const response = await api.get("/inventory/policy?owner=" + owner);
      const data = await response.data;
      if (data.success) setInvPolicy(data.data.inventory_policy);
    } catch (error) {
      console.error("Error fetching policy:", error);
    }
  }, []);

  useEffect(() => {
    if (listInboundScanned.length > 0) fetchPolicy(listInboundScanned[0].owner_code!);
  }, [listInboundScanned, fetchPolicy]);

  // ── Derived: is search button disabled ──────────────────────────────────────

  const isSearchDisabled = (() => {
    if (loading) return true;
    if (searchMode === "pallet") return !scanPalletId.trim();
    if (location) return !scanLocation.trim();
    return !scanBarcode.trim() || !scanLocation.trim();
  })();

  // ── handleSearch ─────────────────────────────────────────────────────────────

  const handleSearch = async () => {
    if (isSearchDisabled) return;
    setLoading(true);
    try {
      let payload: { location?: string; barcode?: string; sku?: string; pallet?: string; };

      if (searchMode === "pallet") {
        payload = { pallet: scanPalletId.trim() };
      } else if (parsedQR?.sku && !parsedQR?.ean) {
        payload = { location: scanLocation, sku: parsedQR.sku };
      } else if (location && !scanBarcode.trim()) {
        payload = { location: scanLocation };
      } else {
        payload = { location: scanLocation, barcode: scanBarcode, sku: scanSku };
      }

      const response = await api.post("/mobile/inventory/location/barcode", payload, { withCredentials: true });
      const data = await response.data;
      if (data.success) {
        const filtered: ScannedItem[] = data.data.map((item: any) => ({
          id: item.ID,
          inbound_no: inbound,
          inbound_id: item.inbound_id,
          inbound_detail_id: item.inbound_detail_id,
          barcode: item.barcode,
          serial_number: item.serial_number,
          serial_number_2: item.serial_number_2,
          pallet: item.pallet,
          location: item.location,
          qa_status: item.qa_status,
          whs_code: item.whs_code,
          scan_type: item.scan_type,
          quantity: item.qty_available,
          status: item.status,
          rec_date: item.rec_date,
          prod_date: item.prod_date,
          exp_date: item.exp_date,
          lot_number: item.lot_number,
          uom: item.uom,
          qty_display: item.qty_display,
          ean_display: item.ean_display,
          uom_display: item.uom_display,
          owner_code: item.owner_code,
          item_code: item.item_code,
          item_name: item.item_name,
          division_code: item.division_code,
        }));

        if (filtered.length === 0) { setListInboundScanned([]); return; }
        setShowForm(false);
        setListInboundScanned(filtered);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  // ── Multi-select helpers ─────────────────────────────────────────────────────

  const toggleSelectItem = (item: ScannedItem) => {
    const key = itemKey(item);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const allFilteredKeys = useMemo(() => filteredScannedItems.map(itemKey), [filteredScannedItems]);

  const selectAllState: "all" | "none" | "indeterminate" = useMemo(() => {
    if (filteredScannedItems.length === 0) return "none";
    const checkedCount = allFilteredKeys.filter((k) => selectedKeys.has(k)).length;
    if (checkedCount === 0) return "none";
    if (checkedCount === filteredScannedItems.length) return "all";
    return "indeterminate";
  }, [allFilteredKeys, selectedKeys, filteredScannedItems]);

  const handleSelectAll = () => {
    if (selectAllState === "all") {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        allFilteredKeys.forEach((k) => next.delete(k));
        return next;
      });
    } else {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        allFilteredKeys.forEach((k) => next.add(k));
        return next;
      });
    }
  };

  const selectedItems = useMemo(() => filteredScannedItems.filter((item) => selectedKeys.has(itemKey(item))), [filteredScannedItems, selectedKeys]);
  const selectedCount = selectedItems.length;

  // ── Stats ─────────────────────────────────────────────────────────────────────

  const distinctItemCodes = useMemo(() => Array.from(new Set(filteredScannedItems.map((i) => i.item_code).filter(Boolean))), [filteredScannedItems]);
  const totalQty = useMemo(() => filteredScannedItems.reduce((sum, i) => sum + (i.qty_display ?? 0), 0), [filteredScannedItems]);
  const selectedTotalQty = useMemo(() => selectedItems.reduce((sum, i) => sum + (i.qty_display ?? 0), 0), [selectedItems]);

  // ── Confirm transfer handlers ─────────────────────────────────────────────────

  const handleConfirmTransfer = async () => {
    const dataToPost = {
      from_location: searchMode === "pallet" ? undefined : scanLocation,
      from_pallet: searchMode === "pallet" ? scanPalletId : undefined,
      to_location: scanLocation2,
      list_inventory: filteredScannedItems,
    };
    setIsSubmit(true);
    try {
      const response = await api.post("/mobile/inventory/transfer/location/barcode", dataToPost, { withCredentials: true });
      const data = await response.data;
      if (data.success) {
        setShowConfirmModal(false);
        setListInboundScanned([]);
        setScanLocation2("");
        setShowForm(true);
        setSelectedKeys(new Set());
        eventBus.emit("showAlert", { title: "Success!", description: data.message, type: "success" });
      }
    } catch (error) {
      console.error("Error during transfer all:", error);
    } finally {
      setTimeout(() => setIsSubmit(false), 1500);
    }
  };

  const handleConfirmTransferSelected = async () => {
    if (selectedItems.length === 0) return;
    const dataToPost = {
      from_location: searchMode === "pallet" ? undefined : scanLocation,
      from_pallet: searchMode === "pallet" ? scanPalletId : undefined,
      to_location: scanLocation2,
      list_inventory: selectedItems,
    };
    setIsSubmit(true);
    try {
      const response = await api.post("/mobile/inventory/transfer/location/barcode", dataToPost, { withCredentials: true });
      const data = await response.data;
      if (data.success) {
        setShowConfirmModalSelected(false);
        setListInboundScanned([]);
        setScanLocation2("");
        setShowForm(true);
        setSelectedKeys(new Set());
        eventBus.emit("showAlert", { title: "Success!", description: data.message, type: "success" });
      }
    } catch (error) {
      console.error("Error during transfer selected:", error);
    } finally {
      setTimeout(() => setIsSubmit(false), 1500);
    }
  };

  const moveItemToLocation = async () => {
    if (qtyTransfer <= 0) {
      eventBus.emit("showAlert", { title: "Error!", description: "Qty transfer must be greater than 0", type: "error" });
      return;
    }
    if (qtyTransfer > (itemSelected?.qty_display ?? 0)) {
      eventBus.emit("showAlert", { title: "Error!", description: "Qty transfer must be less than available qty", type: "error" });
      return;
    }
    if (!scanLocation2.trim()) {
      eventBus.emit("showAlert", { title: "Error!", description: "Destination location cannot be empty", type: "error" });
      return;
    }

    const dataToPost = {
      from_location: searchMode === "pallet" ? undefined : scanLocation,
      from_pallet: searchMode === "pallet" ? scanPalletId : undefined,
      to_location: scanLocation2,
      qty_transfer: qtyTransfer,
      ean_transfer: eanTransfer,
      uom_transfer: uomTransfer,
      inventory_id: itemSelected?.id,
      list_inventory: [itemSelected],
    };

    setIsSubmit(true);
    try {
      const response = await api.post("/mobile/inventory/transfer-by-inventory-id", dataToPost, { withCredentials: true });
      const data = await response.data;
      if (data.success) {
        eventBus.emit("showAlert", { title: "Success!", description: data.message, type: "success" });
        setShowConfirmModalMoveTo(false);
        setScanLocation2("");
        setListInboundScanned([]);
        setShowForm(true);
        setSelectedKeys(new Set());
      }
    } catch (error) {
      console.error("Error during transfer:", error);
    } finally {
      setTimeout(() => setIsSubmit(false), 1500);
    }
  };

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (showConfirmModalMoveTo || showConfirmModal || showConfirmModalSelected) {
      setTimeout(() => {
        document.getElementById("locationTransfer")?.focus();
        document.getElementById("location2")?.focus();
        document.getElementById("locationSelected")?.focus();
      }, 100);
    }
  }, [showConfirmModalMoveTo, showConfirmModal, showConfirmModalSelected]);

  // ── Confirm dialog label ──────────────────────────────────────────────────────

  const transferAllLabel =
    searchMode === "pallet"
      ? `All items in pallet ${scanPalletId}`
      : `All items of ${scanBarcode} in ${scanLocation}`;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader title="Internal Transfer" showBackButton />
      <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-36 max-w-md mx-auto">

        {/* ── Search Form ── */}
        {showForm && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-gray-700 text-sm">Search By :</label>
                <ToggleSwitch
                  checked={searchMode === "pallet"}
                  onChange={handleSearchModeToggle}
                  labelOff="Location"
                  labelOn="Pallet ID"
                />
              </div>

              {searchMode === "barcode" && (
                <>
                  <div>
                    <label className="mb-1 block font-semibold text-gray-700 text-sm">Origin Location :</label>
                    <div className="relative">
                      <Input
                        id="location"
                        autoComplete="off"
                        placeholder="Entry origin location..."
                        value={scanLocation}
                        onChange={(e) => setScanLocation(e.target.value)}
                      />
                      {scanLocation && (
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => { setScanLocation(""); setListInboundScanned([]); document.getElementById("location")?.focus(); }}
                        >
                          <XCircle size={18} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-gray-700 text-sm">Item Barcode :</label>
                    <ToggleSwitch checked={isQrMode} onChange={handleModeToggle} labelOff="EAN" labelOn="QR Code" />
                  </div>

                  {!isQrMode && (
                    <div className="relative">
                      <Input
                        id="barcode"
                        autoComplete="off"
                        placeholder="Entry item barcode..."
                        value={scanBarcode}
                        onChange={(e) => setScanBarcode(e.target.value)}
                      />
                      {scanBarcode && (
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => { setScanBarcode(""); setListInboundScanned([]); document.getElementById("barcode")?.focus(); }}
                        >
                          <XCircle size={18} />
                        </button>
                      )}
                    </div>
                  )}

                  {isQrMode && (
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          id="qr-input"
                          autoComplete="off"
                          className="font-mono text-xs pr-8"
                          placeholder="Scan QR code here..."
                          value={qrRawInput}
                          onChange={(e) => handleQrInputChange(e.target.value)}
                          autoFocus
                        />
                        {qrRawInput && (
                          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={clearQr}>
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>

                      {parsedQR && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs font-mono space-y-0.5">
                          <div>
                            <span className="text-gray-500">Type:</span>{" "}
                            <span className={parsedQR.labelType === "UNIT" ? "text-purple-600 font-semibold" : "text-blue-600 font-semibold"}>
                              {parsedQR.labelType === "UNIT" ? "Unit / Serial" : "Master Carton"}
                            </span>
                          </div>
                          {parsedQR.sku && <div><span className="text-gray-500">SKU:</span> {parsedQR.sku}</div>}
                          {parsedQR.ean && <div><span className="text-gray-500">EAN:</span> {parsedQR.ean}</div>}
                          {parsedQR.product && <div><span className="text-gray-500">Product:</span> {parsedQR.product}</div>}
                          {parsedQR.serial && <div><span className="text-gray-500">Serial:</span> {parsedQR.serial}</div>}
                          {parsedQR.batch && <div><span className="text-gray-500">Batch:</span> {parsedQR.batch}</div>}
                          {parsedQR.cartonSerial && <div><span className="text-gray-500">Carton:</span> {parsedQR.cartonSerial}</div>}
                          {parsedQR.mfgDate && <div><span className="text-gray-500">MFG Date:</span> {parsedQR.mfgDate}</div>}
                          {parsedQR.qtyPerCarton && <div><span className="text-gray-500">Qty/Carton:</span> {parsedQR.qtyPerCarton}</div>}
                        </div>
                      )}

                      {qrRawInput && !parsedQR && (
                        <p className="text-xs text-red-500">Format QR tidak dikenali. Pastikan format: (1)SKU=... atau 12-segment dash</p>
                      )}

                      {scanBarcode && (
                        <>
                          <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 border rounded px-2 py-1.5">
                            <span className="text-gray-400">SKU parsed:</span>
                            <span className="font-mono font-semibold text-gray-800">{scanSku}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 border rounded px-2 py-1.5">
                            <span className="text-gray-400">EAN parsed:</span>
                            <span className="font-mono font-semibold text-gray-800">{scanBarcode}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}

              {searchMode === "pallet" && (
                <div>
                  <label className="mb-1 block font-semibold text-gray-700 text-sm">Pallet ID :</label>
                  <div className="relative">
                    <Input
                      id="pallet-id"
                      autoComplete="off"
                      placeholder="Scan or entry pallet ID..."
                      value={scanPalletId}
                      onChange={(e) => setScanPalletId(e.target.value)}
                      autoFocus
                    />
                    {scanPalletId && (
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => { setScanPalletId(""); setListInboundScanned([]); document.getElementById("pallet-id")?.focus(); }}
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              <Button onClick={handleSearch} className="w-full" disabled={isSearchDisabled}>
                {loading
                  ? <><Loader2 className="animate-spin w-4 h-4 mr-2" />Searching...</>
                  : <><Search size={18} className="mr-2" />Search</>
                }
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center text-gray-600 text-sm">
            <Loader2 className="animate-spin mr-2" size={20} />Searching...
          </div>
        )}

        {/* ── Result Section ── */}
        {!loading && listInboundScanned.length > 0 && (
          <div className="space-y-3">

            {/* ── Mini Stat Cards ── */}
            <div className="flex gap-2">
              <StatCard label="Records" value={filteredScannedItems.length} accent="bg-slate-500" />
              <StatCard label="SKUs" value={distinctItemCodes.length} accent="bg-violet-500" />
              <StatCard label={`Qty (${filteredScannedItems[0]?.uom_display ?? ""})`} value={totalQty} accent="bg-emerald-500" />
            </div>

            {/* ── Filter Toggle Button ── */}
            <button
              type="button"
              onClick={() => setShowFilterPanel((p) => !p)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                showFilterPanel
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Filter size={15} />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <ChevronDown
                size={15}
                className={`transition-transform ${showFilterPanel ? "rotate-180" : ""}`}
              />
            </button>

            {/* ── Active Filter Chips (always visible when filter active) ── */}
            {activeFilterCount > 0 && !showFilterPanel && (
              <div className="flex flex-wrap gap-1.5">
                {filterDivision !== "all" && (
                  <FilterChip label={`Div: ${filterDivision}`} onRemove={() => setFilterDivision("all")} />
                )}
                {filterRecDate !== "all" && (
                  <FilterChip label={`Rcv: ${formatRecDate(filterRecDate)}`} onRemove={() => setFilterRecDate("all")} />
                )}
                {filterItem !== "all" && (
                  <FilterChip label={`Item: ${filterItem}`} onRemove={() => setFilterItem("all")} />
                )}
                {filterPallet !== "all" && (
                  <FilterChip label={`Pallet: ${filterPallet}`} onRemove={() => setFilterPallet("all")} />
                )}
              </div>
            )}

            {/* ── Filter Panel ── */}
            {showFilterPanel && (
              <Card>
                <CardContent className="p-3 space-y-3">
                  <FilterSelect
                    label="Division"
                    placeholder="Search division..."
                    options={divisionOptions}
                    value={filterDivision}
                    onChange={setFilterDivision}
                    allLabel="All Divisions"
                    allQty={listInboundScanned.reduce((s, i) => s + (i.qty_display ?? 0), 0)}
                  />
                  <FilterSelect
                    label="Receive Date"
                    placeholder="Search date..."
                    options={recDateOptions}
                    value={filterRecDate}
                    onChange={setFilterRecDate}
                    disabled={filterDivision === "all" && divisionOptions.length > 1}
                    allLabel="All Dates"
                    allQty={afterDivision.reduce((s, i) => s + (i.qty_display ?? 0), 0)}
                  />
                  <FilterSelect
                    label="Item / SKU"
                    placeholder="Search item..."
                    options={itemOptions}
                    value={filterItem}
                    onChange={setFilterItem}
                    disabled={false}
                    allLabel="All Items"
                    allQty={afterRecDate.reduce((s, i) => s + (i.qty_display ?? 0), 0)}
                  />
                  <FilterSelect
                    label="Pallet"
                    placeholder="Search pallet..."
                    options={palletOptions}
                    value={filterPallet}
                    onChange={setFilterPallet}
                    disabled={filterItem === "all" && itemOptions.length > 1}
                    allLabel="All Pallets"
                    allQty={afterItem.reduce((s, i) => s + (i.qty_display ?? 0), 0)}
                  />

                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="w-full text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-md py-1.5 transition-colors"
                    >
                      Reset All Filters
                    </button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Result Card ── */}
            <Card>
              <CardContent className="p-4 space-y-3">

                {/* ── Selected Summary Banner ── */}
                {selectedCount > 0 && (
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded px-3 py-2 text-xs text-blue-700">
                    <span>
                      <strong>{selectedCount}</strong> selected — qty{" "}
                      <strong>{selectedTotalQty}</strong>{" "}
                      {filteredScannedItems[0]?.uom_display}
                    </span>
                    <button type="button" onClick={() => setSelectedKeys(new Set())} className="text-blue-400 hover:text-blue-600 ml-2">
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* ── Select All Header ── */}
                {filteredScannedItems.length > 0 && (
                  <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        selectAllState === "all"
                          ? "bg-blue-500 border-blue-500"
                          : selectAllState === "indeterminate"
                            ? "bg-blue-100 border-blue-400"
                            : "bg-white border-gray-300"
                      }`}
                    >
                      {selectAllState === "all" && <Check size={12} className="text-white" />}
                      {selectAllState === "indeterminate" && <Minus size={12} className="text-blue-500" />}
                    </button>
                    <span className="text-xs font-semibold text-gray-600">
                      Select All ({filteredScannedItems.length})
                    </span>
                  </div>
                )}

                {/* ── Item Cards ── */}
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredScannedItems.length > 0 ? (
                    filteredScannedItems.map((item, index) => {
                      const key = itemKey(item);
                      const isChecked = selectedKeys.has(key);
                      return (
                        <div
                          key={index}
                          className={`p-2 border rounded-md transition-all ${
                            isChecked
                              ? "border-blue-400 bg-blue-50 ring-1 ring-blue-300"
                              : item.qa_status === "A"
                                ? "bg-green-50 border-green-200"
                                : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <button
                              type="button"
                              onClick={() => toggleSelectItem(item)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                isChecked ? "bg-blue-500 border-blue-500" : "bg-white border-gray-300"
                              }`}
                            >
                              {isChecked && <Check size={12} className="text-white" />}
                            </button>
                            <span className="text-xs text-gray-400 font-mono">#{index + 1}</span>
                          </div>

                          <div className="flex justify-between items-start text-sm">
                            <div className="space-y-0.5">
                              <div className="text-xs font-mono">
                                <span className="text-gray-500">Location:</span> {item.location}<br />
                                <span className="text-gray-500">Pallet:</span> {item.pallet}<br />
                                <span className="text-gray-500">SKU:</span> {item.item_code}<br />
                                <span className="text-gray-500">EAN:</span> {item.ean_display}<br />
                                <span className="text-gray-500">Name:</span> {item.item_name}<br />
                                {invPolicy?.require_expiry_date && (
                                  <><span className="text-gray-500">Exp Date:</span> {item.exp_date}<br /></>
                                )}
                              </div>
                            </div>
                            <div className="text-right text-xs font-mono">
                              {invPolicy?.require_lot_number && (
                                <><span className="text-gray-500">Lot:</span> {item.lot_number}<br /></>
                              )}
                              <span className="text-gray-500">Whs:</span> {item.whs_code}<br />
                              <span className="text-gray-500">Division:</span> {item.division_code}<br />
                              <span className="text-gray-500">Available:</span>{" "}
                              <span className="font-semibold">{item.qty_display}</span> {item.uom_display}<br />
                              {invPolicy?.show_rec_date && (
                                <><span className="text-gray-500">Rcv:</span> {formatRecDate(item.rec_date)}<br /></>
                              )}
                            </div>
                          </div>

                          <Button
                            className="w-full mt-2"
                            size="sm"
                            variant={isChecked ? "outline" : "default"}
                            onClick={() => {
                              setShowConfirmModalMoveTo(true);
                              setItemSelected(item);
                              setQtyTransfer(item.qty_display ?? 0);
                              setUomTransfer(item.uom_display ?? "");
                              setEanTransfer(item.ean_display ?? "");
                            }}
                          >
                            <Check size={16} className="mr-1" />Transfer
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-gray-400 text-sm text-center py-6">
                      No items match the current filter.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Floating Buttons ── */}
        {listInboundScanned.length > 0 && !loading && (
          <div className="fixed bottom-6 left-2 right-2 flex flex-col gap-2">
            {selectedCount > 0 && (
              <Button
                onClick={() => { setScanLocation2(""); setShowConfirmModalSelected(true); }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Check size={18} className="mr-1.5" />
                Transfer Selected
                <span className="ml-2 bg-white/20 text-white text-xs rounded-full px-2 py-0.5 font-semibold">
                  {selectedCount}
                </span>
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => { setScanLocation2(""); setShowConfirmModal(true); }}
                className="flex-1"
              >
                <CheckCheck size={20} className="mr-1" />
                Transfer All
                {activeFilterCount > 0 && (
                  <span className="ml-1.5 bg-white/20 text-white text-xs rounded px-1.5 py-0.5">
                    filtered
                  </span>
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowForm(true);
                  setListInboundScanned([]);
                  setScanBarcode("");
                  setScanPalletId("");
                  setQrRawInput("");
                  setParsedQR(null);
                  resetAllFilters();
                }}
                className="flex-1"
                variant="destructive"
              >
                <X size={20} className="mr-1" />Cancel
              </Button>
            </div>
          </div>
        )}

        {/* ── Dialog Transfer per Item ── */}
        <Dialog open={showConfirmModalMoveTo} onOpenChange={setShowConfirmModalMoveTo}>
          <DialogContent className="bg-white">
            <DialogHeader><DialogTitle>Confirmation</DialogTitle></DialogHeader>
            <p className="text-sm text-gray-700">
              Item <strong>{eanTransfer}</strong> in{" "}
              <strong>{searchMode === "pallet" ? `pallet ${scanPalletId}` : scanLocation}</strong>{" "}
              will be moved to destination location?
            </p>
            <div className="space-y-1">
              <label className="font-semibold text-gray-700 text-sm block">Qty Transfer :</label>
              <div className="flex gap-2">
                <Input id="qtyTransfer" autoComplete="off" placeholder="Qty..." type="number" value={qtyTransfer} onChange={(e) => setQtyTransfer(Number(e.target.value))} />
                <Input readOnly id="uomTransfer" className="w-24" placeholder="UOM..." value={uomTransfer} />
              </div>
              <span className="text-xs text-gray-500">Max Qty: {itemSelected?.qty_display} {itemSelected?.uom_display}</span>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-gray-700 text-sm block">Destination Location :</label>
              <div className="relative">
                <Input id="locationTransfer" autoComplete="off" placeholder="Entry destination location..." value={scanLocation2} onChange={(e) => setScanLocation2(e.target.value)} />
                {scanLocation2 && (
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => { setScanLocation2(""); document.getElementById("locationTransfer")?.focus(); }}>
                    <XCircle size={18} />
                  </button>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowConfirmModalMoveTo(false)}>Cancel</Button>
              <Button disabled={isSubmit} onClick={moveItemToLocation}>
                {isSubmit ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Please wait...</> : "Transfer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Dialog Transfer All ── */}
        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="bg-white">
            <DialogHeader><DialogTitle>Confirmation</DialogTitle></DialogHeader>
            <p className="text-sm text-gray-700">
              <strong>{transferAllLabel}</strong> will be moved to destination location?
            </p>
            {activeFilterCount > 0 && (
              <div className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-1.5">
                ⚠ Active filter applied — only {filteredScannedItems.length} record(s), qty {totalQty} will be transferred.
              </div>
            )}
            <div className="space-y-1">
              <label className="font-semibold text-gray-700 text-sm block">Destination Location :</label>
              <div className="relative">
                <Input id="location2" autoComplete="off" placeholder="Entry destination location..." value={scanLocation2} onChange={(e) => setScanLocation2(e.target.value)} />
                {scanLocation2 && (
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => { setScanLocation2(""); document.getElementById("location2")?.focus(); }}>
                    <XCircle size={18} />
                  </button>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
              <Button disabled={isSubmit} onClick={handleConfirmTransfer}>
                {isSubmit ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Please wait...</> : "Transfer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Dialog Transfer Selected ── */}
        <Dialog open={showConfirmModalSelected} onOpenChange={setShowConfirmModalSelected}>
          <DialogContent className="bg-white">
            <DialogHeader><DialogTitle>Confirmation</DialogTitle></DialogHeader>
            <p className="text-sm text-gray-700">
              <strong>{selectedCount} selected item(s)</strong> from{" "}
              <strong>{searchMode === "pallet" ? `pallet ${scanPalletId}` : scanLocation}</strong>{" "}
              will be moved to destination location?
            </p>
            <div className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-1.5">
              {selectedCount} record(s) — total qty <strong>{selectedTotalQty}</strong>{" "}
              {filteredScannedItems[0]?.uom_display}. Backend will generate new pallet ID for split items.
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-gray-700 text-sm block">Destination Location :</label>
              <div className="relative">
                <Input id="locationSelected" autoComplete="off" placeholder="Entry destination location..." value={scanLocation2} onChange={(e) => setScanLocation2(e.target.value)} autoFocus />
                {scanLocation2 && (
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => { setScanLocation2(""); document.getElementById("locationSelected")?.focus(); }}>
                    <XCircle size={18} />
                  </button>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowConfirmModalSelected(false)}>Cancel</Button>
              <Button disabled={isSubmit || !scanLocation2.trim()} onClick={handleConfirmTransferSelected}>
                {isSubmit ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Please wait...</> : "Transfer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </>
  );
};

export default TransferPage;