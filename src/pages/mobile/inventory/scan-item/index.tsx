/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import PageHeader from "@/components/mobile/PageHeader";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";

// ─── QR Parser ────────────────────────────────────────────────────────────────

interface ParsedQRData {
  sku?: string;
  ean?: string;
  product?: string;
  serial?: string;
  cartonSerial?: string;
  batch?: string;
  mfgDate?: string;
  qtyPerCarton?: number;
  labelType?: "UNIT" | "CARTON" | "UNKNOWN";
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
    serial: map["SERIAL"],
    cartonSerial: map["CARTON_SERIAL"],
    batch: map["BATCH"],
    mfgDate,
    qtyPerCarton: map["QTY_PER_CARTON"] ? Number(map["QTY_PER_CARTON"]) : undefined,
    labelType: map["SERIAL"] ? "UNIT" : map["CARTON_SERIAL"] ? "CARTON" : "UNKNOWN",
  };
}

// ─── Toggle Component ─────────────────────────────────────────────────────────

const ToggleSwitch = ({
  checked,
  onChange,
  labelOff = "Off",
  labelOn = "On",
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  labelOff?: string;
  labelOn?: string;
}) => (
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

export default function ScanItemPage() {
  // ── Existing state ─────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // ── QR state ───────────────────────────────────────────────────────────────
  const [isQrMode, setIsQrMode] = useState(false);
  const [qrRawInput, setQrRawInput] = useState("");
  const [parsedQR, setParsedQR] = useState<ParsedQRData | null>(null);

  // ── QR Helpers ─────────────────────────────────────────────────────────────

  const handleQrInputChange = (raw: string) => {
    setQrRawInput(raw);
    const parsed = parseQRCode(raw);
    if (parsed) {
      setParsedQR(parsed);
      // pakai SKU sebagai search term karena endpoint /by-item/ terima item_code atau barcode
      if (parsed.sku) setSearch(parsed.sku);
      else if (parsed.ean) setSearch(parsed.ean);
    } else {
      setParsedQR(null);
    }
  };

  const handleModeToggle = (qr: boolean) => {
    setIsQrMode(qr);
    setQrRawInput("");
    setParsedQR(null);
    setSearch("");
    setResults([]);
    setTimeout(() => {
      document.getElementById(qr ? "qr-input" : "search-input")?.focus();
    }, 50);
  };

  // ── Existing handler (tidak diubah) ────────────────────────────────────────

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    setLoading(true);
    setResults([]);

    try {
      const response = await api.get("/mobile/inventory/by-item/" + search, {
        withCredentials: true,
      });

      if (response.data && response.data.success) {
        const filtered = response.data.data.map((item: any) => ({
          name: item.item_code,
          barcode: item.barcode,
          location: item.location,
          whs_code: item.whs_code,
          rec_date: item.rec_date,
          qty: item.qty_available,
        }));
        setResults(filtered);
      } else {
        console.warn("Data tidak ditemukan atau response tidak sesuai format");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader title="Scan Item" showBackButton />
      <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-24 max-w-md mx-auto">

        <form onSubmit={handleScan} className="space-y-2">

          {/* Mode Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Scan Mode</span>
            <ToggleSwitch
              checked={isQrMode}
              onChange={handleModeToggle}
              labelOff="EAN / Item Code"
              labelOn="QR Code"
            />
          </div>

          {/* EAN mode — tidak berubah */}
          {!isQrMode && (
            <Input
              id="search-input"
              placeholder="Entry item code or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}

          {/* QR mode */}
          {isQrMode && (
            <div className="space-y-2">
              <Input
                id="qr-input"
                autoComplete="off"
                className="font-mono text-xs"
                placeholder="Scan QR code here..."
                value={qrRawInput}
                onChange={(e) => handleQrInputChange(e.target.value)}
                autoFocus
              />

              {/* Preview */}
              {parsedQR && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs font-mono space-y-0.5">
                  <div>
                    <span className="text-gray-500">Type:</span>{" "}
                    <span className={parsedQR.labelType === "UNIT" ? "text-purple-600 font-semibold" : "text-blue-600 font-semibold"}>
                      {parsedQR.labelType === "UNIT" ? "Unit / Serial" : "Master Carton"}
                    </span>
                  </div>
                  {parsedQR.sku     && <div><span className="text-gray-500">SKU:</span> {parsedQR.sku}</div>}
                  {parsedQR.ean     && <div><span className="text-gray-500">EAN:</span> {parsedQR.ean}</div>}
                  {parsedQR.product && <div><span className="text-gray-500">Product:</span> {parsedQR.product}</div>}
                  {parsedQR.serial  && <div><span className="text-gray-500">Serial:</span> {parsedQR.serial}</div>}
                  {parsedQR.batch   && <div><span className="text-gray-500">Batch:</span> {parsedQR.batch}</div>}
                </div>
              )}

              {qrRawInput && !parsedQR && (
                <p className="text-xs text-red-500">
                  Format QR tidak dikenali. Pastikan format: (1)SKU=...
                </p>
              )}

              {/* Konfirmasi search term yang akan dipakai */}
              {search && (
                <div className="text-xs text-gray-500 bg-gray-50 border rounded px-2 py-1.5">
                  Search by: <span className="font-mono font-semibold text-gray-800">{search}</span>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={!search.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-1 rounded"
          >
            Check
          </button>
        </form>

        {/* Loading — tidak berubah */}
        {loading && (
          <div className="flex justify-center items-center text-gray-500 text-sm">
            <Loader2 className="animate-spin mr-2 w-4 h-4" />
            Scanning...
          </div>
        )}

        {/* Results — tidak berubah */}
        {!loading && results.length > 0 && (
          <>
            <p className="text-sm text-gray-600 text-center font-medium">
              Total Qty Available: {results.reduce((total, item) => total + item.qty, 0)}
            </p>
            <div className="space-y-3">
              {results.map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm p-4 border">
                  <h4 className="font-semibold text-gray-800">{item.name}</h4>
                  <p className="text-sm text-gray-600">Barcode: {item.barcode}</p>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Location: {item.location}</p>
                    <p className="text-sm text-gray-600">Whs Code: {item.whs_code}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Available: {item.qty}</p>
                    <p className="text-sm text-gray-600">Rec Date: {item.rec_date}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && !results.length && (
          <p className="text-center text-gray-400 text-sm">No items scanned yet.</p>
        )}
      </div>
    </>
  );
}