/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useCallback } from "react";
import QRCode from "qrcode";
import Layout from "@/components/layout";

type QRType = "carton" | "unit" | "free";

interface CartonForm {
  sku: string;
  ean: string;
  product: string;
  brand: string;
  model: string;
  carton_serial: string;
  batch: string;
  mfg_date: string;
  qty_per_carton: string;
}

interface UnitForm {
  sku: string;
  ean: string;
  product: string;
  brand: string;
  model: string;
  serial: string;
  batch: string;
  mfg_date: string;
}

interface QRItem {
  dataUrl: string;
  label: string;
  type: QRType;
}

const DEFAULT_CARTON: CartonForm = {
  sku: "", ean: "", product: "", brand: "", model: "",
  carton_serial: "", batch: "", mfg_date: "", qty_per_carton: "",
};

const DEFAULT_UNIT: UnitForm = {
  sku: "", ean: "", product: "", brand: "", model: "",
  serial: "", batch: "", mfg_date: "",
};

function buildCartonString(f: CartonForm) {
  return `(1)SKU=${f.sku}(2)EAN=${f.ean}(3)PRODUCT=${f.product}(4)BRAND=${f.brand}(5)MODEL=${f.model}(6)CARTON_SERIAL=${f.carton_serial}(7)BATCH=${f.batch}(8)MFG_DATE=${f.mfg_date}(9)QTY_PER_CARTON=${f.qty_per_carton}`;
}

function buildUnitString(f: UnitForm) {
  return `(1)SKU=${f.sku}(2)EAN=${f.ean}(3)PRODUCT=${f.product}(4)BRAND=${f.brand}(5)MODEL=${f.model}(6)SERIAL=${f.serial}(7)BATCH=${f.batch}(8)MFG_DATE=${f.mfg_date}`;
}

const COLS_OPTIONS = [2, 3, 4, 6] as const;
const QR_SIZE_OPTIONS = [
  { label: "S (80px)", value: 80 },
  { label: "M (110px)", value: 110 },
  { label: "L (150px)", value: 150 },
  { label: "XL (200px)", value: 200 },
  { label: "XXL (300px)", value: 300 },
] as const;

const TYPE_TABS: { type: QRType; label: string; icon: string }[] = [
  { type: "carton", label: "QR Carton", icon: "📦" },
  { type: "unit",   label: "QR Unit",   icon: "🏷️" },
  { type: "free",   label: "Free Text", icon: "✏️" },
];

export default function QRGenerator() {
  const [qrType, setQrType] = useState<QRType>("carton");
  const [cartonForm, setCartonForm] = useState<CartonForm>(DEFAULT_CARTON);
  const [unitForm, setUnitForm] = useState<UnitForm>(DEFAULT_UNIT);
  const [freeText, setFreeText] = useState("");
  const [freeLabel, setFreeLabel] = useState("");
  const [qrList, setQrList] = useState<QRItem[]>([]);
  const [cols, setCols] = useState<number>(4);
  const [qrSize, setQrSize] = useState<number>(110);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const handleCartonChange = (k: keyof CartonForm, v: string) =>
    setCartonForm((p) => ({ ...p, [k]: v }));

  const handleUnitChange = (k: keyof UnitForm, v: string) =>
    setUnitForm((p) => ({ ...p, [k]: v }));

  const handleGenerate = useCallback(async () => {
    setError("");
    setGenerating(true);
    try {
      let text = "";
      let label = "";

      if (qrType === "carton") {
        const f = cartonForm;
        if (!f.sku || !f.carton_serial) {
          setError("SKU and CARTON_SERIAL are required.");
          setGenerating(false);
          return;
        }
        text = buildCartonString(f);
        label = f.carton_serial;
      } else if (qrType === "unit") {
        const f = unitForm;
        if (!f.sku || !f.serial) {
          setError("SKU and SERIAL are required.");
          setGenerating(false);
          return;
        }
        text = buildUnitString(f);
        label = f.serial;
      } else {
        if (!freeText.trim()) {
          setError("Text cannot be empty.");
          setGenerating(false);
          return;
        }
        text = freeText.trim();
        const raw = freeLabel.trim() || text;
        label = raw.length > 40 ? raw.slice(0, 40) + "…" : raw;
      }

      const dataUrl = await QRCode.toDataURL(text, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 400,
        color: { dark: "#000000", light: "#ffffff" },
      });
      setQrList((prev) => [...prev, { dataUrl, label, type: qrType }]);
    } catch {
      setError("Failed to generate QR code.");
    }
    setGenerating(false);
  }, [qrType, cartonForm, unitForm, freeText, freeLabel]);

  const handleRemove = (idx: number) =>
    setQrList((prev) => prev.filter((_, i) => i !== idx));

  const handleClear = () => setQrList([]);

  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>QR Print</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Courier New', monospace; background: #fff; }
  .grid {
    display: grid;
    grid-template-columns: repeat(${cols}, 1fr);
    gap: 8px;
    padding: 8px;
  }
  .cell {
    border: 1px solid #ccc;
    border-radius: 6px;
    padding: 6px 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    page-break-inside: avoid;
  }
  .cell img { width: ${qrSize}px; height: ${qrSize}px; display: block; }
  .type-badge {
    font-size: 7px;
    font-weight: bold;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 1px 5px;
    border-radius: 3px;
  }
  .badge-carton { background: #e0edff; color: #1a4e8a; }
  .badge-unit   { background: #e0f5e9; color: #1a6a38; }
  .badge-free   { background: #f3f0ff; color: #5b21b6; }
  .serial {
    font-size: 9px;
    font-weight: bold;
    text-align: center;
    color: #222;
    word-break: break-all;
    max-width: ${qrSize + 8}px;
  }
  @media print {
    @page { margin: 6mm; size: A4; }
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }
</style></head><body><div class="grid">
${qrList.map((q) => `<div class="cell">
  <img src="${q.dataUrl}" />
  <span class="serial">${q.label}</span>
</div>`).join("")}
</div></body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 600);
  };

  const cartonFields: { key: keyof CartonForm; label: string; placeholder?: string }[] = [
    { key: "sku",           label: "SKU *",           placeholder: "30046277" },
    { key: "ean",           label: "EAN",             placeholder: "6933257913004" },
    { key: "product",       label: "Product",         placeholder: "Upper Arm Digital Tensimeter..." },
    { key: "brand",         label: "Brand",           placeholder: "Yuwell" },
    { key: "model",         label: "Model",           placeholder: "YE660D USB Gold" },
    { key: "carton_serial", label: "Carton Serial *", placeholder: "YE660D26030911271" },
    { key: "batch",         label: "Batch",           placeholder: "YN2603091" },
    { key: "mfg_date",      label: "MFG Date",        placeholder: "20260410" },
    { key: "qty_per_carton",label: "Qty/Carton",      placeholder: "10" },
  ];

  const unitFields: { key: keyof UnitForm; label: string; placeholder?: string }[] = [
    { key: "sku",     label: "SKU *",         placeholder: "30046277" },
    { key: "ean",     label: "EAN",           placeholder: "6933257913004" },
    { key: "product", label: "Product",       placeholder: "Upper Arm Digital Tensimeter..." },
    { key: "brand",   label: "Brand",         placeholder: "Yuwell" },
    { key: "model",   label: "Model",         placeholder: "YE660D USB Gold" },
    { key: "serial",  label: "Unit Serial *", placeholder: "B2604002179" },
    { key: "batch",   label: "Batch",         placeholder: "YN2603091" },
    { key: "mfg_date",label: "MFG Date",      placeholder: "20260410" },
  ];

  const ringClass = {
    carton: "focus:ring-blue-500",
    unit:   "focus:ring-emerald-500",
    free:   "focus:ring-violet-500",
  }[qrType];

  const btnClass = {
    carton: "bg-blue-600 hover:bg-blue-700",
    unit:   "bg-emerald-600 hover:bg-emerald-700",
    free:   "bg-violet-600 hover:bg-violet-700",
  }[qrType];

  return (
    <Layout title="Utilities" subTitle="QR Generator" description="Generate QR code untuk label carton, unit, atau free text.">
      <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">

        {/* LEFT: Form */}
        <div className="flex flex-col gap-4">

          {/* Type Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 p-1 flex gap-1">
            {TYPE_TABS.map(({ type, label, icon }) => (
              <button
                key={type}
                onClick={() => { setQrType(type); setError(""); }}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  qrType === type
                    ? type === "carton"
                      ? "bg-blue-600 text-white shadow-sm"
                      : type === "unit"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-violet-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Form Fields */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              {qrType === "carton" ? "Carton Data" : qrType === "unit" ? "Unit Data" : "Free Text"}
            </p>

            {qrType === "free" ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Content *</label>
                  <textarea
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    placeholder="Enter any text, URL, or data to encode..."
                    rows={5}
                    className={`w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none font-mono ${ringClass}`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    Label{" "}
                    <span className="text-gray-300 font-normal">(optional — shown below QR)</span>
                  </label>
                  <input
                    type="text"
                    value={freeLabel}
                    onChange={(e) => setFreeLabel(e.target.value)}
                    placeholder="e.g. https://logspeedy.com"
                    className={`w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${ringClass}`}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {(qrType === "carton" ? cartonFields : unitFields).map(({ key, label, placeholder }) => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">{label}</label>
                    <input
                      type="text"
                      value={qrType === "carton" ? cartonForm[key as keyof CartonForm] : (unitForm as any)[key]}
                      onChange={(e) =>
                        qrType === "carton"
                          ? handleCartonChange(key as keyof CartonForm, e.target.value)
                          : handleUnitChange(key as keyof UnitForm, e.target.value)
                      }
                      placeholder={placeholder}
                      className={`w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${ringClass}`}
                    />
                  </div>
                ))}
              </div>
            )}

            {error && (
              <p className="mt-3 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`mt-4 w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 active:scale-[0.98] ${btnClass}`}
            >
              {generating ? "Generating..." : "+ Add to Queue"}
            </button>
          </div>

          {/* Print Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Print Settings</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Columns per Row</label>
                <div className="flex gap-2">
                  {COLS_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCols(c)}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                        cols === c
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">QR Size</label>
                <div className="flex gap-2 flex-wrap">
                  {QR_SIZE_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setQrSize(s.value)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        qrSize === s.value
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Preview + Actions */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              Preview ({qrList.length} label)
            </p>
            <div className="flex gap-2">
              {qrList.length > 0 && (
                <>
                  <button
                    onClick={handleClear}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Clear Queue
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-4 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-all flex items-center gap-1.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                      <rect x="6" y="14" width="12" height="8"/>
                    </svg>
                    Print
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 min-h-[400px] p-4">
            {qrList.length === 0 ? (
              <div className="h-full min-h-[350px] flex flex-col items-center justify-center gap-3 text-gray-300">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="3" height="3" rx="0.5"/><rect x="18" y="14" width="3" height="3" rx="0.5"/><rect x="14" y="18" width="3" height="3" rx="0.5"/><rect x="18" y="18" width="3" height="3" rx="0.5"/>
                </svg>
                <p className="text-sm font-medium text-gray-400">No QR in queue</p>
                <p className="text-xs text-gray-300">Fill out the form on the left, then click "+ Add to Queue"</p>
              </div>
            ) : (
              <div
                ref={printRef}
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                  gap: "10px",
                }}
              >
                {qrList.map((q, idx) => (
                  <div
                    key={idx}
                    className="group relative border border-gray-200 rounded-lg p-2 flex flex-col items-center gap-1.5 hover:border-gray-300 transition-all"
                  >
                    <button
                      onClick={() => handleRemove(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs hidden group-hover:flex items-center justify-center hover:bg-red-600 transition-all"
                      title="Remove"
                    >
                      ×
                    </button>
                    <span
                      className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        q.type === "carton"
                          ? "bg-blue-50 text-blue-700"
                          : q.type === "unit"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-violet-50 text-violet-700"
                      }`}
                    >
                      {/* {q.type} */}
                    </span>
                    <img
                      src={q.dataUrl}
                      alt={q.label}
                      style={{ width: qrSize, height: qrSize }}
                      className="block"
                    />
                    <span className="text-[7px] font-mono font-bold text-gray-700 text-center break-all max-w-full leading-tight">
                      {q.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {qrList.length > 0 && (
            <div className="flex items-center gap-4 text-xs text-gray-400 px-1 flex-wrap">
              <span>📦 Carton: <strong className="text-blue-600">{qrList.filter((q) => q.type === "carton").length}</strong></span>
              <span>🏷️ Unit: <strong className="text-emerald-600">{qrList.filter((q) => q.type === "unit").length}</strong></span>
              <span>✏️ Free: <strong className="text-violet-600">{qrList.filter((q) => q.type === "free").length}</strong></span>
              <span>·</span>
              <span>Layout: <strong className="text-gray-600">{cols} columns × {Math.ceil(qrList.length / cols)} rows</strong></span>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}