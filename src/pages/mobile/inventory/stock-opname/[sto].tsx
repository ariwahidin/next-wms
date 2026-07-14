/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import PageHeader from "@/components/mobile/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";
import { ParsedQRData, parseQRCode } from "@/utils/qrParser";
import { XCircle, Loader2, CheckCircle2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Division = {
  ID: number;
  code: string;
  name: string;
};

type Product = {
  ID: number;
  item_code: string;
  item_name: string;
  barcode: string;
};

type StockTakeBarcode = {
  ID: number;
  division_code: string;
  location: string;
  barcode: string;
  sku: string;
  lot_number?: string;
  carton_number?: string;
  counted_qty: number;
  item_id: number;
  item?: Product;
  CreatedAt: string;
};

type ScanMode = "ean" | "sku" | "qr";
type ResultTab = "byItem" | "byLocation" | "byCarton";

// ─── Scan Mode Selector (3-way segmented control) ────────────────────────────

const SCAN_MODES: { value: ScanMode; label: string }[] = [
  { value: "ean", label: "EAN" },
  { value: "sku", label: "SKU" },
  { value: "qr", label: "QR Code" },
];

interface ScanModeToggleProps {
  value: ScanMode;
  onChange: (mode: ScanMode) => void;
}

const ScanModeToggle = ({ value, onChange }: ScanModeToggleProps) => (
  <div className="inline-flex rounded-lg bg-gray-100 p-1">
    {SCAN_MODES.map((mode) => (
      <button
        key={mode.value}
        type="button"
        onClick={() => onChange(mode.value)}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${value === mode.value ? "bg-blue-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
      >
        {mode.label}
      </button>
    ))}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StockOpnamePage() {
  const params = useParams();
  const [title, setTitle] = useState("Cycle Count");

  // Division — persist antar submit, bebas diganti
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [divisionCode, setDivisionCode] = useState("");

  // Scan mode
  const [scanMode, setScanMode] = useState<ScanMode>("ean");
  const [qrRawInput, setQrRawInput] = useState("");
  const [parsedQR, setParsedQR] = useState<ParsedQRData | null>(null);

  // Scan fields
  const [location, setLocation] = useState("");
  const [barcode, setBarcode] = useState(""); // dipakai untuk mode EAN & QR (hasil ean/sku dari parse)
  const [skuInput, setSkuInput] = useState(""); // dipakai khusus mode SKU
  const [lotNo, setLotNo] = useState("");
  const [cartonNumber, setCartonNumber] = useState("");
  const [qty, setQty] = useState<number | string>(1);

  // EAN/SKU mode: lookup produk real-time (satu state dipakai bareng, tinggal beda parameter query)
  const [lookupProduct, setLookupProduct] = useState<Product | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const [isSubmit, setIsSubmit] = useState(false);
  const [dataStockTakeBarcode, setDataStockTakeBarcode] = useState<StockTakeBarcode[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<ResultTab>("byItem");

  // Bulk delete (per grup, di tab By Location & By Carton) — pakai endpoint delete
  // yang sama, dipanggil berulang per item, dengan progres dalam persentase.
  const [deletingGroupKey, setDeletingGroupKey] = useState<string | null>(null);
  const [deleteProgress, setDeleteProgress] = useState(0); // 0-100

  // ── Virtualized list scroll containers (ref-callback state; hanya tab aktif yang ke-mount) ──
  const [itemScrollEl, setItemScrollEl] = useState<HTMLDivElement | null>(null);
  const [locationScrollEl, setLocationScrollEl] = useState<HTMLDivElement | null>(null);
  const [cartonScrollEl, setCartonScrollEl] = useState<HTMLDivElement | null>(null);

  // ── Fetch helpers ──────────────────────────────────────────────────────────
  const fetchDivisions = async () => {
    try {
      const res = await api.get("/divisions");
      if (res.data.success) {
        setDivisions(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch divisions:", err);
    }
  };

  const getStockTakeBarcode = async () => {
    try {
      const res = await api.get(`/stock-take/barcode/${params.sto}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setDataStockTakeBarcode(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch barcode:", err);
    }
  };

  useEffect(() => {
    fetchDivisions();
  }, []);

  useEffect(() => {
    if (params?.sto) {
      setTitle(`Cycle Count - ${params.sto}`);
      getStockTakeBarcode();
    }
  }, [params]);

  // ── EAN/SKU mode: lookup product (debounced) ───────────────────────────────
  useEffect(() => {
    if (scanMode === "qr") {
      setLookupProduct(null);
      setLookupError("");
      return;
    }


    const value = scanMode === "ean" ? barcode : skuInput;
    if (!value.trim()) {
      setLookupProduct(null);
      setLookupError("");
      return;
    }

    setLookupLoading(true);
    const timer = setTimeout(async () => {
      try {
        const queryParams = scanMode === "ean" ? { barcode: value.trim() } : { sku: value.trim() };
        const res = await api.get("/products/lookup", {
          params: queryParams,
          withCredentials: true,
        });
        if (res.data.success) {
          setLookupProduct(res.data.data);
          setLookupError("");
        } else {
          setLookupProduct(null);
          setLookupError(`Product not found for this ${scanMode === "ean" ? "barcode" : "SKU"}.`);
        }
      } catch (err) {
        setLookupProduct(null);
        setLookupError(`Product not found for this ${scanMode === "ean" ? "barcode" : "SKU"}.`);
      } finally {
        setLookupLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [barcode, skuInput, scanMode]);

  // ── QR Parsing ─────────────────────────────────────────────────────────────
  const handleQrInputChange = (raw: string) => {

    console.log("QR raw input:", raw);
    setQrRawInput(raw);
    const parsed = parseQRCode(raw);

    console.log("QR parsed:", parsed);

    if (parsed) {
      setParsedQR(parsed);

      if (parsed.innerSerialRangeError) {
        eventBus.emit("showAlert", {
          title: "Serial Range Error!",
          description: parsed.innerSerialRangeError,
          type: "error",
        });
        return;
      }

      setBarcode(parsed.ean || parsed.sku || "");
      setLotNo(parsed.batch || "");

      if (parsed.labelType === "CARTON") {
        setCartonNumber(parsed.cartonSerial || "");
        setQty(parsed.innerSerials?.length || parsed.qtyPerCarton || 1);
      } else {
        setCartonNumber("");
        setQty(1);
      }
    } else {
      setParsedQR(null);
    }
  };

  const handleSKUInputChange = (raw: string) => {
    const parsed = parseQRCode(raw);
    setSkuInput(parsed?.sku || raw);
  };


  const handleModeChange = (mode: ScanMode) => {
    setScanMode(mode);
    resetScanFields();
    setTimeout(() => {
      const focusId = mode === "qr" ? "qr-input" : mode === "sku" ? "sku-input" : "barcode";
      document.getElementById(focusId)?.focus();
      // document.getElementById(focusId)?.focus();
    }, 50);
  };

  const resetScanFields = () => {
    // setLocation("");
    setQrRawInput("");
    setParsedQR(null);
    setBarcode("");
    setSkuInput("");
    setLotNo("");
    setCartonNumber("");
    setQty(1);
    setLookupProduct(null);
    setLookupError("");
    // location & divisionCode sengaja TIDAK direset — user biasanya lanjut di lokasi/division yang sama
  };


  const lookupProductNow = async (mode: "ean" | "sku", value: string) => {
    try {
      const queryParams = mode === "ean" ? { barcode: value.trim() } : { sku: value.trim() };
      const res = await api.get("/products/lookup", {
        params: queryParams,
        withCredentials: true,
      });
      if (res.data.success) {
        setLookupProduct(res.data.data);
        setLookupError("");
        return res.data.data;
      } else {
        setLookupProduct(null);
        setLookupError(`Product not found for this ${mode === "ean" ? "barcode" : "SKU"}.`);
        return null;
      }
    } catch {
      setLookupProduct(null);
      setLookupError(`Product not found for this ${mode === "ean" ? "barcode" : "SKU"}.`);
      return null;
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!divisionCode) {
      eventBus.emit("showAlert", {
        title: "Error!",
        description: "Please select a division first.",
        type: "error",
      });
      return;
    }

    const primaryValue = scanMode === "sku" ? skuInput : barcode;
    if (!location.trim() || !primaryValue.trim() || Number(qty) < 1) {
      eventBus.emit("showAlert", {
        title: "Error!",
        description: `Please fill in location, ${scanMode === "sku" ? "SKU" : "barcode"}, and a valid quantity.`,
        type: "error",
      });
      return;
    }

    // Validasi produk di sisi client sebelum hit API, biar gak bolak-balik request gagal
    if (scanMode === "qr") {
      if (!parsedQR?.sku) {
        eventBus.emit("showAlert", {
          title: "Error!",
          description: "QR code does not contain a valid SKU.",
          type: "error",
        });
        return;
      }
    } else {
      if (lookupLoading) {
        eventBus.emit("showAlert", {
          title: "Please wait",
          description: "Still validating against product master.",
          type: "error",
        });
        return;
      }

      let product = lookupProduct;
      if (!product) {
        // debounce belum sempet jalan, lookup langsung sebelum reject
        setLookupLoading(true);
        product = await lookupProductNow(scanMode as "ean" | "sku", primaryValue);
        setLookupLoading(false);
      }

      if (!product) {
        eventBus.emit("showAlert", {
          title: "Error!",
          description: lookupError || "Not registered in product master.",
          type: "error",
        });
        return;
      }

      // if (!lookupProduct) {
      //   eventBus.emit("showAlert", {
      //     title: "Error!",
      //     description: lookupError || "Not registered in product master.",
      //     type: "error",
      //   });
      //   return;
      // }
    }

    if (isSubmit) return;
    setIsSubmit(true);

    try {
      const res = await api.post(
        "/stock-take/scan",
        {
          stock_take_code: params.sto,
          division_code: divisionCode,
          location: location.trim(),
          barcode: scanMode === "sku" ? "" : barcode.trim(),
          sku: scanMode === "sku" ? skuInput.trim() : scanMode === "qr" ? parsedQR?.sku || "" : "",
          lot_number: lotNo,
          carton_number: cartonNumber,
          qty: Number(qty),
          qr_raw: scanMode === "qr" ? qrRawInput : undefined,
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        eventBus.emit("showAlert", {
          title: "Success!",
          description: res.data.message,
          type: "success",
        });
        resetScanFields();
        getStockTakeBarcode();
        setTimeout(() => {
          const focusId = scanMode === "qr" ? "qr-input" : scanMode === "sku" ? "sku-input" : "barcode";
          document.getElementById(focusId)?.focus();
          // document.getElementById("location")?.focus();
        }, 50);
      } else {
        // eventBus.emit("showAlert", {
        //   title: "Failed",
        //   description: res.data.message || "Failed to submit scan.",
        //   type: "error",
        // });
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      eventBus.emit("showAlert", {
        title: "Error!",
        description: err.response?.data?.message || "An error occurred while submitting data.",
        type: "error",
      });
    } finally {
      setIsSubmit(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = confirm("Are you sure you want to delete this item?");
    if (!confirmDelete) return;

    try {
      const res = await api.delete(`/stock-take/barcode/delete/${id}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        eventBus.emit("showAlert", {
          title: "Deleted",
          description: res.data.message,
          type: "success",
        });
        getStockTakeBarcode();
      }
    } catch (err) {
      console.error("Delete error:", err);
      eventBus.emit("showAlert", {
        title: "Error!",
        description: "An error occurred while deleting.",
        type: "error",
      });
    }
  };

  // Delete satu grup sekaligus (By Location / By Carton) — endpoint sama dengan
  // handleDelete, dipanggil berurutan per item supaya progres persentase akurat.
  const handleGroupDelete = async (groupKey: string, items: StockTakeBarcode[]) => {
    const confirmDelete = confirm(
      `Are you sure you want to delete all ${items.length} scan(s) in "${groupKey}"?`
    );
    if (!confirmDelete) return;

    setDeletingGroupKey(groupKey);
    setDeleteProgress(0);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < items.length; i++) {
      try {
        const res = await api.delete(`/stock-take/barcode/delete/${items[i].ID}`, {
          withCredentials: true,
        });
        if (res.data.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error("Delete error:", err);
        failCount++;
      }
      setDeleteProgress(Math.round(((i + 1) / items.length) * 100));
    }

    setDeletingGroupKey(null);
    setDeleteProgress(0);

    eventBus.emit("showAlert", {
      title: failCount === 0 ? "Deleted" : "Partially Deleted",
      description:
        failCount === 0
          ? `Successfully deleted ${successCount} scan(s).`
          : `Deleted ${successCount} scan(s), ${failCount} failed.`,
      type: failCount === 0 ? "success" : "error",
    });

    getStockTakeBarcode();
  };

  // ── Derived: filter & grouping ────────────────────────────────────────────
  const filteredData = dataStockTakeBarcode.filter(
    (item) =>
      item.barcode?.toLowerCase().includes(search.toLowerCase()) ||
      item.location?.toLowerCase().includes(search.toLowerCase()) ||
      item.carton_number?.toLowerCase().includes(search.toLowerCase()) ||
      item.item?.item_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.item?.item_code?.toLowerCase().includes(search.toLowerCase())
  );

  const locationGroups = dataStockTakeBarcode.reduce<Record<string, StockTakeBarcode[]>>((acc, item) => {
    const key = item.location?.trim() || "(No Location)";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const filteredLocationGroups = Object.entries(locationGroups).filter(([loc, items]) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      loc.toLowerCase().includes(term) ||
      items.some(
        (i) =>
          i.barcode?.toLowerCase().includes(term) ||
          i.carton_number?.toLowerCase().includes(term) ||
          i.item?.item_name?.toLowerCase().includes(term) ||
          i.item?.item_code?.toLowerCase().includes(term)
      )
    );
  });

  const cartonGroups = dataStockTakeBarcode
    .filter((item) => item.carton_number && item.carton_number.trim() !== "")
    .reduce<Record<string, StockTakeBarcode[]>>((acc, item) => {
      const key = item.carton_number!;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

  const filteredCartonGroups = Object.entries(cartonGroups).filter(([cartonNo, items]) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      cartonNo.toLowerCase().includes(term) ||
      items.some(
        (i) =>
          i.barcode?.toLowerCase().includes(term) ||
          i.location?.toLowerCase().includes(term) ||
          i.item?.item_name?.toLowerCase().includes(term) ||
          i.item?.item_code?.toLowerCase().includes(term)
      )
    );
  });

  // ── Virtualizers ─────────────────────────────────────────────────────────
  // By Item: tinggi tiap card relatif konsisten → estimasi statis cukup, tapi tetap
  // pakai measureElement biar akurat kalau ada wrapping teks panjang.
  const itemVirtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => itemScrollEl,
    estimateSize: () => 96,
    overscan: 8,
  });

  // By Location & By Carton: tinggi tiap group card bervariasi (tergantung jumlah
  // item di dalamnya) → wajib measureElement supaya tidak ada gap/overlap.
  const locationVirtualizer = useVirtualizer({
    count: filteredLocationGroups.length,
    getScrollElement: () => locationScrollEl,
    estimateSize: () => 110,
    overscan: 5,
  });

  const cartonVirtualizer = useVirtualizer({
    count: filteredCartonGroups.length,
    getScrollElement: () => cartonScrollEl,
    estimateSize: () => 110,
    overscan: 5,
  });

  // Tinggi area scroll list, biar konsisten & gak makan seluruh halaman
  const LIST_HEIGHT = "calc(100vh - 420px)";
  const LIST_MIN_HEIGHT = 320;

  return (
    <>
      <PageHeader title={title} showBackButton />
      <div className="min-h-screen bg-gray-50 px-4 pt-4 pb-20 max-w-md mx-auto">
        <div className="space-y-3">
          <Card className="p-4 space-y-4 shadow-md">
            {/* Division — wajib, persist antar submit */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Division <span className="text-red-500">*</span>
              </label>
              <Select value={divisionCode} onValueChange={setDivisionCode}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((d) => (
                    <SelectItem key={d.code} value={d.code}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm font-medium text-gray-700">Scan Mode</span>
              <ScanModeToggle value={scanMode} onChange={handleModeChange} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Location */}
              <div className="relative">
                <label htmlFor="location" className="text-sm text-gray-600">
                  Location
                </label>
                <div className="flex items-center mt-1">
                  <Input
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    id="location"
                    className="w-full pr-10"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault(); // cegah native form submit langsung
                      }
                    }}
                    autoFocus
                  />
                  {location && (
                    <button
                      type="button"
                      className="absolute right-2 top-9 text-gray-400 hover:text-gray-600"
                      onClick={() => {
                        setLocation("");
                        document.getElementById("location")?.focus();
                      }}
                    >
                      <XCircle size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* EAN mode */}
              {scanMode === "ean" && (
                <div className="space-y-2">
                  <div className="relative">
                    <label htmlFor="barcode" className="text-sm text-gray-600">
                      EAN
                    </label>
                    <Input
                      autoComplete="off"
                      id="barcode"
                      className="w-full mt-1 pr-10"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault(); // cegah native form submit langsung
                        }
                      }}
                    />
                    {barcode && (
                      <button
                        type="button"
                        className="absolute right-2 top-9 text-gray-400 hover:text-gray-600"
                        onClick={() => {
                          setBarcode("");
                          document.getElementById("barcode")?.focus();
                        }}
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>

                  {lookupLoading && (
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Checking product master...
                    </div>
                  )}

                  {!lookupLoading && lookupProduct && (
                    <div className="bg-green-50 border border-green-200 rounded p-2 text-xs font-mono space-y-0.5">
                      <div className="flex items-center gap-1 text-green-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Product found
                      </div>
                      <div><span className="text-gray-500">Item Name:</span> {lookupProduct.item_name}</div>
                      <div><span className="text-gray-500">SKU:</span> {lookupProduct.item_code}</div>
                    </div>
                  )}

                  {!lookupLoading && !lookupProduct && lookupError && (
                    <div className="text-xs text-red-500">{lookupError}</div>
                  )}
                </div>
              )}

              {/* SKU mode */}
              {scanMode === "sku" && (
                <div className="space-y-2">
                  <div className="relative">
                    <label htmlFor="sku-input" className="text-sm text-gray-600">
                      SKU
                    </label>
                    <Input
                      autoComplete="off"
                      id="sku-input"
                      className="w-full mt-1 pr-10"
                      value={skuInput}
                      onChange={(e) => {
                        handleSKUInputChange(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault(); // cegah native form submit langsung
                        }
                      }}
                    />
                    {skuInput && (
                      <button
                        type="button"
                        className="absolute right-2 top-9 text-gray-400 hover:text-gray-600"
                        onClick={() => {
                          setSkuInput("");
                          document.getElementById("sku-input")?.focus();
                        }}
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>

                  {lookupLoading && (
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Checking product master...
                    </div>
                  )}

                  {!lookupLoading && lookupProduct && (
                    <div className="bg-green-50 border border-green-200 rounded p-2 text-xs font-mono space-y-0.5">
                      <div className="flex items-center gap-1 text-green-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Product found
                      </div>
                      <div><span className="text-gray-500">Item Name:</span> {lookupProduct.item_name}</div>
                      <div><span className="text-gray-500">Barcode:</span> {lookupProduct.barcode}</div>
                    </div>
                  )}

                  {!lookupLoading && !lookupProduct && lookupError && (
                    <div className="text-xs text-red-500">{lookupError}</div>
                  )}
                </div>
              )}

              {/* QR mode */}
              {scanMode === "qr" && (
                <div className="space-y-2">
                  <div className="relative">
                    <label htmlFor="qr-input" className="text-sm text-gray-600">
                      QR Code
                    </label>
                    <Input
                      autoComplete="off"
                      id="qr-input"
                      className="w-full mt-1 pr-10 font-mono text-xs"
                      placeholder="Scan QR code here..."
                      value={qrRawInput}
                      onChange={(e) => handleQrInputChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault(); // cegah native form submit langsung
                        }
                      }}
                    />
                    {qrRawInput && (
                      <button
                        type="button"
                        className="absolute right-2 top-9 text-gray-400 hover:text-gray-600"
                        onClick={() => {
                          setQrRawInput("");
                          setParsedQR(null);
                          setBarcode("");
                        }}
                      >
                        <XCircle size={18} />
                      </button>
                    )}
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
                      {parsedQR.batch && <div><span className="text-gray-500">Batch:</span> {parsedQR.batch}</div>}
                      {parsedQR.cartonSerial && <div><span className="text-gray-500">Carton:</span> {parsedQR.cartonSerial}</div>}
                      {parsedQR.qtyPerCarton && <div><span className="text-gray-500">Qty/Carton:</span> {parsedQR.qtyPerCarton}</div>}
                    </div>
                  )}
                  {qrRawInput && !parsedQR && (
                    <div className="text-xs text-red-500">QR format is not recognized.</div>
                  )}
                  {parsedQR && !parsedQR.sku && (
                    <div className="text-xs text-red-500">QR does not contain a SKU — cannot be validated.</div>
                  )}
                </div>
              )}

              {/* Qty */}
              <div className="space-y-2">
                <label htmlFor="qty" className="text-sm text-gray-600">
                  Quantity
                </label>
                <Input
                  type="number"
                  id="qty"
                  min={1}
                  value={qty}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") { setQty(""); return; }
                    const num = Number(val);
                    setQty(num < 1 ? 1 : num);
                  }}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmit}>
                {isSubmit ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </form>
          </Card>

          {/* ── Result List (virtualized) ── */}
          <div className="mt-4">
            <div className="text-center text-sm text-gray-600 mb-2">
              Total scanned items: <span className="font-semibold">{dataStockTakeBarcode.length}</span>
            </div>

            <Input
              placeholder="Search item name, SKU, barcode, location, carton..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full mb-3"
            />

            <div className="flex border-b border-gray-200 mb-3">
              <button
                type="button"
                onClick={() => setTab("byItem")}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === "byItem" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"
                  }`}
              >
                By Item
              </button>
              <button
                type="button"
                onClick={() => setTab("byLocation")}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === "byLocation" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"
                  }`}
              >
                By Location
                {Object.keys(locationGroups).length > 0 && (
                  <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                    {Object.keys(locationGroups).length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setTab("byCarton")}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === "byCarton" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"
                  }`}
              >
                By Carton
                {Object.keys(cartonGroups).length > 0 && (
                  <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                    {Object.keys(cartonGroups).length}
                  </span>
                )}
              </button>
            </div>

            {/* ── By Item ── */}
            {tab === "byItem" && (
              filteredData.length > 0 ? (
                <div
                  ref={setItemScrollEl}
                  className="overflow-y-auto rounded-md border border-gray-100"
                  style={{ height: LIST_HEIGHT, minHeight: LIST_MIN_HEIGHT }}
                >
                  <div
                    style={{
                      height: `${itemVirtualizer.getTotalSize()}px`,
                      width: "100%",
                      position: "relative",
                    }}
                  >
                    {itemVirtualizer.getVirtualItems().map((virtualRow) => {
                      const item = filteredData[virtualRow.index];
                      return (
                        <div
                          key={item.ID}
                          data-index={virtualRow.index}
                          ref={itemVirtualizer.measureElement}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${virtualRow.start}px)`,
                            paddingBottom: 8,
                          }}
                        >
                          <Card className="p-3 flex items-center justify-between bg-white shadow-sm">
                            <div>
                              <p className="font-medium text-gray-800">{item.item?.item_name || "Unknown Item"}</p>
                              <p className="text-sm text-gray-600">
                                SKU: {item.item?.item_code || "-"} · {item.barcode}
                              </p>
                              <p className="text-sm text-gray-500">
                                {item.location} | Qty: {item.counted_qty}
                              </p>
                              <p className="text-xs text-gray-400">
                                Div: {item.division_code}
                                {item.lot_number && ` · Lot: ${item.lot_number}`}
                                {item.carton_number && ` · Carton: ${item.carton_number}`}
                              </p>
                            </div>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(item.ID)}>
                              Delete
                            </Button>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-6">No data found.</p>
              )
            )}

            {/* ── By Location ── */}
            {tab === "byLocation" && (
              filteredLocationGroups.length > 0 ? (
                <div
                  ref={setLocationScrollEl}
                  className="overflow-y-auto rounded-md border border-gray-100"
                  style={{ height: LIST_HEIGHT, minHeight: LIST_MIN_HEIGHT }}
                >
                  <div
                    style={{
                      height: `${locationVirtualizer.getTotalSize()}px`,
                      width: "100%",
                      position: "relative",
                    }}
                  >
                    {locationVirtualizer.getVirtualItems().map((virtualRow) => {
                      const [loc, items] = filteredLocationGroups[virtualRow.index];
                      return (
                        <div
                          key={loc}
                          data-index={virtualRow.index}
                          ref={locationVirtualizer.measureElement}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${virtualRow.start}px)`,
                            paddingBottom: 8,
                          }}
                        >
                          <Card className="overflow-hidden">
                            <div className="bg-amber-50 px-3 py-2 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-xs font-semibold font-mono text-gray-800 truncate">{loc}</div>
                                <div className="text-xs text-gray-500">
                                  {items.length} scan{items.length !== 1 ? "s" : ""} · Total qty:{" "}
                                  {items.reduce((s, i) => s + i.counted_qty, 0)}
                                </div>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="shrink-0"
                                disabled={deletingGroupKey !== null}
                                onClick={() => handleGroupDelete(loc, items)}
                              >
                                {deletingGroupKey === loc ? (
                                  <>
                                    <Loader2 className="mr-1 w-3 h-3 animate-spin" />
                                    {deleteProgress}%
                                  </>
                                ) : (
                                  "Delete All"
                                )}
                              </Button>
                            </div>
                            <div className="divide-y divide-gray-100">
                              {items.map((item) => (
                                <div key={item.ID} className="px-3 py-1.5 text-xs font-mono text-gray-700 bg-white flex items-center justify-between gap-2">
                                  <span className="truncate">
                                    {item.item?.item_name || item.barcode}
                                    {item.item?.item_code && ` (${item.item.item_code})`}
                                    {item.carton_number && ` · Carton: ${item.carton_number}`}
                                    {" · "}Qty: {item.counted_qty}
                                  </span>
                                  <button
                                    type="button"
                                    className="shrink-0 text-red-500 hover:text-red-700 disabled:opacity-40"
                                    disabled={deletingGroupKey !== null}
                                    onClick={() => handleDelete(item.ID)}
                                    title="Delete this scan"
                                  >
                                    <XCircle size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-6">No locations found.</p>
              )
            )}

            {/* ── By Carton ── */}
            {tab === "byCarton" && (
              filteredCartonGroups.length > 0 ? (
                <div
                  ref={setCartonScrollEl}
                  className="overflow-y-auto rounded-md border border-gray-100"
                  style={{ height: LIST_HEIGHT, minHeight: LIST_MIN_HEIGHT }}
                >
                  <div
                    style={{
                      height: `${cartonVirtualizer.getTotalSize()}px`,
                      width: "100%",
                      position: "relative",
                    }}
                  >
                    {cartonVirtualizer.getVirtualItems().map((virtualRow) => {
                      const [cartonNo, items] = filteredCartonGroups[virtualRow.index];
                      return (
                        <div
                          key={cartonNo}
                          data-index={virtualRow.index}
                          ref={cartonVirtualizer.measureElement}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${virtualRow.start}px)`,
                            paddingBottom: 8,
                          }}
                        >
                          <Card className="overflow-hidden">
                            <div className="bg-blue-50 px-3 py-2 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-xs font-semibold font-mono text-gray-800 truncate">{cartonNo}</div>
                                <div className="text-xs text-gray-500">
                                  {items.length} scan{items.length !== 1 ? "s" : ""} · Total qty:{" "}
                                  {items.reduce((s, i) => s + i.counted_qty, 0)}
                                </div>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="shrink-0"
                                disabled={deletingGroupKey !== null}
                                onClick={() => handleGroupDelete(cartonNo, items)}
                              >
                                {deletingGroupKey === cartonNo ? (
                                  <>
                                    <Loader2 className="mr-1 w-3 h-3 animate-spin" />
                                    {deleteProgress}%
                                  </>
                                ) : (
                                  "Delete All"
                                )}
                              </Button>
                            </div>
                            <div className="divide-y divide-gray-100">
                              {items.map((item) => (
                                <div key={item.ID} className="px-3 py-1.5 text-xs font-mono text-gray-700 bg-white flex items-center justify-between gap-2">
                                  <span className="truncate">
                                    {item.item?.item_name || item.barcode}
                                    {item.item?.item_code && ` (${item.item.item_code})`} · {item.location}
                                    {" · "}Qty: {item.counted_qty}
                                  </span>
                                  <button
                                    type="button"
                                    className="shrink-0 text-red-500 hover:text-red-700 disabled:opacity-40"
                                    disabled={deletingGroupKey !== null}
                                    onClick={() => handleDelete(item.ID)}
                                    title="Delete this scan"
                                  >
                                    <XCircle size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-6">No cartons found.</p>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}