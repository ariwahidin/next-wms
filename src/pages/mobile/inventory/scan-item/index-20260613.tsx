/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import PageHeader from "@/components/mobile/PageHeader";
import { Input } from "@/components/ui/input";
import { Loader2, XCircle } from "lucide-react";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedQRData {
  sku?: string;
  ean?: string;
  product?: string;
  serial?: string;
  cartonSerial?: string;
  batch?: string;
  mfgDate?: string;
  qtyPerCarton?: number;
  labelType: "UNIT" | "CARTON" | "UNKNOWN";
}

interface ResultItem {
  name: string;
  barcode: string;
  location: string;
  whs_code: string;
  rec_date: string;
  qty: number;
}

// ─── QR Parser (v1 + v2) ─────────────────────────────────────────────────────

function parseQRCode(raw: string): ParsedQRData | null {
  // ── Format v2: 12 segment dash-separated ─────────────────
  if (!raw.startsWith("(") && raw.split("-").length === 12) {
    const segments = raw.split("-");

    const rawDate = segments[9];
    let mfgDate: string | undefined;
    if (rawDate?.length === 8) {
      mfgDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
    }

    const qtyMatch = segments[4].match(/^(\d+)/);
    const qtyPerCarton = qtyMatch ? Number(qtyMatch[1]) : undefined;

    return {
      sku: segments[1] || undefined,
      qtyPerCarton,
      mfgDate,
      labelType: "CARTON",
    };
  }

  // ── Format v1: (1)KEY=VALUE ───────────────────────────────
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
    serial: map["SERIAL"],
    cartonSerial: map["CARTON_SERIAL"],
    batch: map["BATCH"],
    mfgDate,
    qtyPerCarton: map["QTY_PER_CARTON"] ? Number(map["QTY_PER_CARTON"]) : undefined,
    labelType,
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
  // ── State ───────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);

  const [isQrMode, setIsQrMode] = useState(false);
  const [qrRawInput, setQrRawInput] = useState("");
  const [parsedQR, setParsedQR] = useState<ParsedQRData | null>(null);

  // ── QR Helpers ──────────────────────────────────────────────────────────────

  const handleQrInputChange = (raw: string) => {
    setQrRawInput(raw);
    const parsed = parseQRCode(raw);
    if (parsed) {
      setParsedQR(parsed);
      if (parsed.sku) setSearch(parsed.sku);
      else if (parsed.ean) setSearch(parsed.ean);
    } else {
      setParsedQR(null);
      setSearch("");
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

  const clearQr = () => {
    setQrRawInput("");
    setParsedQR(null);
    setSearch("");
    setResults([]);
    document.getElementById("qr-input")?.focus();
  };

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    setLoading(true);
    setResults([]);

    try {
      const response = await api.get("/mobile/inventory/by-item/" + search, {
        withCredentials: true,
      });

      if (response.data?.success) {
        const filtered: ResultItem[] = response.data.data.map((item: any) => ({
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

  // ── Derived ─────────────────────────────────────────────────────────────────

  const totalQty = results.reduce((t, item) => t + item.qty, 0);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader title="Scan Item" showBackButton />
      <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-24 max-w-md mx-auto">

        <form onSubmit={handleScan} className="space-y-3">

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

          {/* EAN mode */}
          {!isQrMode && (
            <div className="relative">
              <Input
                id="search-input"
                autoComplete="off"
                placeholder="Entry item code or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => { setSearch(""); setResults([]); document.getElementById("search-input")?.focus(); }}
                >
                  <XCircle size={16} />
                </button>
              )}
            </div>
          )}

          {/* QR mode */}
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
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={clearQr}
                  >
                    <XCircle size={16} />
                  </button>
                )}
              </div>

              {/* QR Preview */}
              {parsedQR && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs font-mono space-y-0.5">
                  <div>
                    <span className="text-gray-500">Type:</span>{" "}
                    <span className={parsedQR.labelType === "UNIT" ? "text-purple-600 font-semibold" : "text-blue-600 font-semibold"}>
                      {parsedQR.labelType === "UNIT" ? "Unit / Serial" : "Master Carton"}
                    </span>
                  </div>
                  {parsedQR.sku          && <div><span className="text-gray-500">SKU:</span> {parsedQR.sku}</div>}
                  {parsedQR.ean          && <div><span className="text-gray-500">EAN:</span> {parsedQR.ean}</div>}
                  {parsedQR.product      && <div><span className="text-gray-500">Product:</span> {parsedQR.product}</div>}
                  {parsedQR.serial       && <div><span className="text-gray-500">Serial:</span> {parsedQR.serial}</div>}
                  {parsedQR.cartonSerial && <div><span className="text-gray-500">Carton:</span> {parsedQR.cartonSerial}</div>}
                  {parsedQR.batch        && <div><span className="text-gray-500">Batch:</span> {parsedQR.batch}</div>}
                  {parsedQR.mfgDate      && <div><span className="text-gray-500">MFG Date:</span> {parsedQR.mfgDate}</div>}
                  {parsedQR.qtyPerCarton && <div><span className="text-gray-500">Qty/Carton:</span> {parsedQR.qtyPerCarton}</div>}
                </div>
              )}

              {qrRawInput && !parsedQR && (
                <p className="text-xs text-red-500">
                  Format QR tidak dikenali. Pastikan format: (1)SKU=... atau 12-segment dash
                </p>
              )}

              {/* Search term yang akan dipakai */}
              {search && (
                <div className="text-xs text-gray-500 bg-gray-50 border rounded px-2 py-1.5">
                  Search by: <span className="font-mono font-semibold text-gray-800">{search}</span>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={!search.trim() || loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-1.5 rounded text-sm font-medium transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning...
              </span>
            ) : "Check"}
          </button>
        </form>

        {/* Results */}
        {!loading && results.length > 0 && (
          <>
            <p className="text-sm text-gray-600 text-center font-medium">
              Total Qty Available:{" "}
              <span className="font-bold text-gray-900">{totalQty}</span>
            </p>
            <div className="space-y-3">
              {results.map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm p-4 border">
                  <h4 className="font-semibold text-gray-800">{item.name}</h4>
                  <p className="text-sm text-gray-600 font-mono">Barcode: {item.barcode}</p>
                  <div className="flex justify-between mt-1">
                    <p className="text-sm text-gray-600">Location: {item.location}</p>
                    <p className="text-sm text-gray-600">Whs: {item.whs_code}</p>
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <p className="text-sm text-gray-600">
                      Available: <span className="font-semibold text-gray-900">{item.qty}</span>
                    </p>
                    <p className="text-sm text-gray-600">Rec Date: {item.rec_date}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && results.length === 0 && (
          <p className="text-center text-gray-400 text-sm">No items scanned yet.</p>
        )}

      </div>
    </>
  );
}