"use client";

import bwipjs from "bwip-js";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

import * as XLSX from "xlsx";
import { Barcode, Check, FileSpreadsheet, Layers3, LayoutTemplate, Plus, Printer, QrCode, ScanLine, Search, Settings2, Trash2, Upload, X } from "lucide-react";
import "./barcode-studio.css";

type Role = "barcode" | "qr" | "text" | "ignore";
type TemplateId = "warehouse" | "minimal" | "qr" | "pallet";
type Mapping = { source: string; role: Role; label: boolean; payload: boolean; labelName: string };
type DataRow = { id: string; values: Record<string, string>; copies: number };

const TEMPLATES = [
  { id: "warehouse" as const, name: "Warehouse Pro", description: "Barcode, item details, location", icon: Barcode },
  { id: "minimal" as const, name: "Minimal", description: "Compact and clean", icon: LayoutTemplate },
  { id: "qr" as const, name: "QR Smart", description: "QR with readable details", icon: QrCode },
  { id: "pallet" as const, name: "Pallet & Carton", description: "Large handling-unit identifier", icon: Layers3 },
];
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const norm = (s: string) => s.trim().toLowerCase().replace(/[\s_-]+/g, "");

function payloadFor(row: DataRow, mappings: Mapping[], role: "barcode" | "qr", separator: string) {
  return mappings.filter(m => m.role === role && m.payload)
    .map(m => row.values[m.source] ?? "").filter(Boolean).join(separator);
}

function parseFile(file: File): Promise<{ headers: string[]; rows: DataRow[] }> {
  return file.arrayBuffer().then(buffer => {
    const workbook = XLSX.read(buffer, { type: "array", raw: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) throw new Error("Worksheet tidak ditemukan.");
    const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    if (!records.length) throw new Error("File tidak memiliki baris data.");
    const headers = Object.keys(records[0]).map(h => h.trim()).filter(Boolean);
    if (!headers.length) throw new Error("Header kolom tidak ditemukan.");
    const copiesHeader = headers.find(h => ["copies", "quantity", "qty", "jumlahlabel"].includes(norm(h)));
    const rows = records.map(record => {
      const values = Object.fromEntries(headers.map(h => [h, String(record[h] ?? "").trim()]));
      const rawCopies = copiesHeader ? Number(values[copiesHeader]) : 1;
      const copies = Number.isInteger(rawCopies) && rawCopies > 0 ? Math.min(rawCopies, 9999) : 1;
      return { id: newId(), values, copies };
    });
    return { headers, rows };
  });
}

function BarcodeCanvas({ value, type }: { value: string; type: "code128" | "qrcode" }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (!value.trim()) { canvas.width = 0; canvas.height = 0; setError("Payload kosong"); return; }
    try {
      bwipjs.toCanvas(canvas, {
        bcid: type, text: value, scale: type === "qrcode" ? 4 : 2, height: 13,
        includetext: false, backgroundcolor: "FFFFFF", barcolor: "000000",
        padding: type === "qrcode" ? 3 : 1,
      });
      setError("");
    } catch { canvas.width = 0; canvas.height = 0; setError("Payload tidak valid"); }
  }, [value, type]);
  return error ? <span className="bqs-code-error">{error}</span> :
    <canvas ref={ref} className={type === "qrcode" ? "bqs-qr-canvas" : "bqs-barcode-canvas"} aria-label={`${type} ${value}`} />;
}

function Label({
  row, mappings, template, barcodeType, separator, humanReadable,
}: {
  row: DataRow; mappings: Mapping[]; template: TemplateId;
  barcodeType: "code128" | "qrcode"; separator: string; humanReadable: boolean;
}) {
  const effectiveType = template === "qr" ? "qrcode" : barcodeType;
  const role = effectiveType === "qrcode" ? "qr" : "barcode";
  const value = payloadFor(row, mappings, role, separator);
  const textFields = mappings.filter(m => m.role === "text" && m.label);
  return <article className={`bqs-label bqs-template-${template}`}>
    {template === "warehouse" && <div className="bqs-label-heading"><span>WAREHOUSE LABEL</span><span>{row.copies > 1 ? `COPIES: ${row.copies}` : ""}</span></div>}
    {template === "pallet" && <div className="bqs-label-heading">PALLET / CARTON ID</div>}
    <div className="bqs-label-text-fields">
      {textFields.map(m => <div className={`bqs-text-field ${template === "pallet" ? "bqs-large-field" : ""}`} key={m.source}>
        <span className="bqs-field-name">{m.labelName || m.source}</span>
        <span className="bqs-field-value">{row.values[m.source] || "—"}</span>
      </div>)}
    </div>
    <div className={`bqs-label-code-area ${effectiveType === "qrcode" ? "bqs-code-area-qr" : ""}`}>
      {value ? <BarcodeCanvas value={value} type={effectiveType} /> :
        <span className="bqs-code-error">Map at least one column to {role === "qr" ? "QR" : "barcode"} payload.</span>}
    </div>
    {humanReadable && value && <div className="bqs-human-readable">{value}</div>}
  </article>;
}

export default function BarcodeStudioPage() {
  const [template, setTemplate] = useState<TemplateId>("warehouse");
  const [barcodeType, setBarcodeType] = useState<"code128" | "qrcode">("code128");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<DataRow[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [separator, setSeparator] = useState("|");
  const [humanReadable, setHumanReadable] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [bulkPreview, setBulkPreview] = useState(false);

  const filteredRows = useMemo(() => rows.filter(row =>
    headers.some(h => (row.values[h] ?? "").toLowerCase().includes(search.toLowerCase()))
  ), [rows, headers, search]);
  const totalLabels = rows.reduce((sum, row) => sum + row.copies, 0);
  const activeRole = template === "qr" || barcodeType === "qrcode" ? "qr" : "barcode";
  const missingPayloadRows = rows.filter(row => !payloadFor(row, mappings, activeRole, separator).trim());
  const duplicatePayloadCount = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach(row => {
      const p = payloadFor(row, mappings, activeRole, separator).trim();
      if (p) counts.set(p, (counts.get(p) ?? 0) + 1);
    });
    return [...counts.values()].filter(count => count > 1).length;
  }, [rows, mappings, activeRole, separator]);

  function setDetectedHeaders(nextHeaders: string[]) {
    setHeaders(nextHeaders);
    setMappings(nextHeaders.map((source, i) => ({
      source, role: i === 0 ? "barcode" : "text", label: i !== 0,
      payload: i === 0, labelName: source,
    })));
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImporting(true); setError(""); setMessage("");
    try {
      const result = await parseFile(file);
      setDetectedHeaders(result.headers);
      setRows(result.rows); setSelected([]);
      setMessage(`${result.rows.length} baris berhasil diimpor. Periksa mapping sebelum mencetak.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membaca file.");
    } finally { setImporting(false); }
  }

  function updateMapping(source: string, patch: Partial<Mapping>) {
    setMappings(current => current.map(m => {
      if (m.source !== source) return m;
      const next = { ...m, ...patch };
      if (patch.role === "ignore") return { ...next, label: false, payload: false };
      if (patch.role === "text") return { ...next, label: true, payload: false };
      if (patch.role === "barcode" || patch.role === "qr") return { ...next, label: true, payload: true };
      return next;
    }));
  }

  function addRow() {
    if (!headers.length) { setError("Import Excel/CSV terlebih dahulu agar header terdeteksi."); return; }
    setRows(current => [...current, { id: newId(), values: Object.fromEntries(headers.map(h => [h, ""])), copies: 1 }]);
    setError("");
  }

  function pasteRows() {
    if (!headers.length) { setError("Import Excel/CSV terlebih dahulu."); return; }
    const input = window.prompt(`Paste data in this column order:\n${headers.join(" | ")}`);
    if (!input) return;
    const added = input.split(/\r?\n/).filter(Boolean).map(line => {
      const cells = line.split("|").map(v => v.trim());
      const values = Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""]));
      const qtyHeader = headers.find(h => ["copies", "quantity", "qty", "jumlahlabel"].includes(norm(h)));
      const copies = qtyHeader ? Math.max(1, Math.min(9999, Number(values[qtyHeader]) || 1)) : 1;
      return { id: newId(), values, copies };
    });
    setRows(current => [...current, ...added]); setError(""); setMessage(`${added.length} baris ditambahkan.`);
  }

  function downloadTemplate() {
    const sample = [
      { "Print Carton": "CTN-00001", CaseMark: "CM-1001", Customer: "Customer A", Qty: 12 },
      { "Print Carton": "CTN-00002", CaseMark: "CM-1001", Customer: "Customer A", Qty: 8 },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    ws["!cols"] = Object.keys(sample[0]).map(h => ({ wch: Math.max(16, h.length + 5) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Label Data");
    XLSX.writeFile(wb, "WMS_Dynamic_Label_Template.xlsx");
  }

  function exportCsv() {
    const quote = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.map(quote).join(","), ...rows.map(r => headers.map(h => quote(r.values[h])).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = "WMS_Label_Data.csv"; a.click(); URL.revokeObjectURL(url);
  }

  function printLabels() {
    if (!rows.length) { setError("Import atau tambahkan data terlebih dahulu."); return; }
    if (!mappings.some(m => (m.role === "barcode" || m.role === "qr") && m.payload)) {
      setError("Pilih minimal satu kolom sebagai payload barcode atau QR."); return;
    }
    if (missingPayloadRows.length) { setError(`${missingPayloadRows.length} baris memiliki payload kosong. Periksa mapping.`); return; }
    setError("");
    window.setTimeout(() => window.print(), 400);
  }

  const labelRows = rows.flatMap(row => Array.from({ length: row.copies }, (_, i) => ({ ...row, id: `${row.id}-${i}` })));
  const firstRow = rows[0];

  return <main className="bqs-page">
    <header className="bqs-header">
      <div className="bqs-title-wrap"><div className="bqs-title-icon"><ScanLine size={24} /></div><div>
        <h1>Barcode & QR Studio</h1><p>Dynamic column mapping, templates, bulk generation and print</p>
      </div></div>
      <div className="bqs-header-actions">
        <button className="bqs-button bqs-button-secondary" onClick={downloadTemplate}><FileSpreadsheet size={16} /> Download Excel Template</button>
        <button className="bqs-button bqs-button-primary" onClick={printLabels} disabled={!rows.length || !!missingPayloadRows.length}><Printer size={16} /> Generate & Print</button>
      </div>
    </header>

    <div className="bqs-stats">
      <div><span>Data rows</span><strong>{rows.length}</strong></div>
      <div><span>Total labels</span><strong>{totalLabels.toLocaleString()}</strong></div>
      <div><span>Empty payload rows</span><strong>{missingPayloadRows.length}</strong></div>
      <div><span>Repeated payload values</span><strong>{duplicatePayloadCount}</strong></div>
    </div>
    {message && <div className="bqs-message" role="status"><Check size={16} />{message}</div>}
    {error && <div className="bqs-error" role="alert">{error}</div>}

    <div className="bqs-layout">
      <div className="bqs-main-column">
        <section className="bqs-panel">
          <div className="bqs-section-heading"><div><h2>1. Choose label style</h2><p>Style changes the layout, not the encoded data.</p></div><LayoutTemplate size={20} /></div>
          <div className="bqs-template-grid">{TEMPLATES.map(item => {
            const Icon = item.icon;
            return <button key={item.id} className={`bqs-template-card ${template === item.id ? "is-active" : ""}`} onClick={() => setTemplate(item.id)}>
              <div className="bqs-template-card-top"><Icon size={21} />{template === item.id && <Check size={17} />}</div><strong>{item.name}</strong><span>{item.description}</span>
            </button>;
          })}</div>
        </section>

        <section className="bqs-panel">
          <div className="bqs-section-heading"><div><h2>2. Import and manage data</h2><p>Headers are detected from the first row. No fixed column names are required.</p></div><FileSpreadsheet size={20} /></div>
          <div className="bqs-toolbar">
            <label className="bqs-button bqs-button-secondary bqs-upload-button"><Upload size={16} />{importing ? "Importing..." : "Import Excel / CSV"}<input type="file" accept=".xlsx,.xls,.csv" disabled={importing} onChange={handleImport} /></label>
            <button className="bqs-button bqs-button-secondary" onClick={pasteRows}>Paste rows</button>
            <button className="bqs-button bqs-button-secondary" onClick={addRow}><Plus size={16} /> Add row</button>
            <button className="bqs-button bqs-button-secondary" onClick={exportCsv} disabled={!rows.length}>Export CSV</button>
          </div>
          <div className="bqs-search"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search across any column..." /></div>
          {!headers.length ? <div className="bqs-empty"><FileSpreadsheet size={28} /><strong>Import your spreadsheet to begin</strong><span>All column headers will be detected automatically.</span></div> :
            <div className="bqs-table-wrap"><table className="bqs-table"><thead><tr><th>Select</th>{headers.map(h => <th key={h}>{h}</th>)}<th>Copies</th><th /></tr></thead><tbody>
              {filteredRows.map(row => <tr key={row.id}><td><input type="checkbox" aria-label="Select row" checked={selected.includes(row.id)} onChange={e => setSelected(old => e.target.checked ? [...old, row.id] : old.filter(id => id !== row.id))} /></td>
                {headers.map(h => <td key={h}><input className="bqs-cell-input" aria-label={`${h} value`} value={row.values[h] ?? ""} onChange={e => setRows(old => old.map(r => r.id === row.id ? { ...r, values: { ...r.values, [h]: e.target.value } } : r))} /></td>)}
                <td><input className="bqs-copies-input" type="number" min={1} max={9999} value={row.copies} onChange={e => setRows(old => old.map(r => r.id === row.id ? { ...r, copies: Math.max(1, Math.min(9999, Number(e.target.value) || 1)) } : r))} /></td>
                <td><button className="bqs-icon-button" aria-label="Delete row" onClick={() => setRows(old => old.filter(r => r.id !== row.id))}><X size={16} /></button></td>
              </tr>)}
            </tbody></table></div>}
          {selected.length > 0 && <div className="bqs-selection-footer"><span>{selected.length} selected</span><button className="bqs-button bqs-button-danger" onClick={() => { setRows(old => old.filter(r => !selected.includes(r.id))); setSelected([]); }}><Trash2 size={15} /> Delete selected</button></div>}
        </section>

        <section className="bqs-panel">
          <div className="bqs-section-heading"><div><h2>3. Map columns</h2><p>Choose payload, visible label text, or ignore for every column.</p></div><Settings2 size={20} /></div>
          {!headers.length ? <p className="bqs-muted">Import a file to configure mapping.</p> :
            <>
              <div className="bqs-mapping-list">{mappings.map(m => <div className="bqs-mapping-row" key={m.source}>
                <div className="bqs-mapping-source"><strong>{m.source}</strong><span>Example: {firstRow?.values[m.source] || "—"}</span></div>
                <div className="bqs-mapping-control"><label>Role</label><select value={m.role} onChange={e => setMappings(old => old.map(x => {
                  if (x.source !== m.source) return x;
                  const role = e.target.value as Role;
                  return { ...x, role, label: role !== "ignore" && role !== "barcode" && role !== "qr" ? true : role !== "ignore", payload: role === "barcode" || role === "qr" };
                }))}>
                  <option value="barcode">Barcode payload</option><option value="qr">QR payload</option><option value="text">Label text</option><option value="ignore">Ignore</option>
                </select></div>
                <div className="bqs-mapping-control"><label>Display name</label><input disabled={m.role === "ignore"} value={m.labelName} onChange={e => setMappings(old => old.map(x => x.source === m.source ? { ...x, labelName: e.target.value } : x))} /></div>
                <label className="bqs-checkbox-label"><input type="checkbox" disabled={m.role === "ignore" || m.role === "text"} checked={m.payload} onChange={e => setMappings(old => old.map(x => x.source === m.source ? { ...x, payload: e.target.checked } : x))} />Include in payload</label>
                <label className="bqs-checkbox-label"><input type="checkbox" disabled={m.role === "ignore"} checked={m.label} onChange={e => setMappings(old => old.map(x => x.source === m.source ? { ...x, label: e.target.checked } : x))} />Show on label</label>
              </div>)}</div>
              <div className="bqs-mapping-footer"><div className="bqs-mapping-control"><label>Payload separator</label><select value={separator} onChange={e => setSeparator(e.target.value)}><option value="|">Pipe ( | )</option><option value="-">Hyphen ( - )</option><option value="_">Underscore ( _ )</option><option value=" ">Space</option><option value="">No separator</option></select></div><p>Payload columns are concatenated in mapping order. Confirm the format with the system that will scan or consume the value.</p></div>
            </>}
        </section>
      </div>

      <aside className="bqs-side-column">
        <section className="bqs-panel">
          <div className="bqs-section-heading"><div><h2>4. Output settings</h2><p>Label size: 100 × 50 mm</p></div><Settings2 size={20} /></div>
          <label className="bqs-field-label">Barcode format</label>
          <select className="bqs-full-select" value={barcodeType} onChange={e => setBarcodeType(e.target.value as "code128" | "qrcode")}><option value="code128">Code 128</option><option value="qrcode">QR Code</option></select>
          <label className="bqs-toggle-row"><span>Show human-readable payload</span><input type="checkbox" checked={humanReadable} onChange={e => setHumanReadable(e.target.checked)} /></label>
          <div className="bqs-summary"><span>Barcode payload columns</span><strong>{mappings.filter(m => m.role === "barcode" && m.payload).length}</strong><span>QR payload columns</span><strong>{mappings.filter(m => m.role === "qr" && m.payload).length}</strong><span>Label text columns</span><strong>{mappings.filter(m => m.role === "text" && m.label).length}</strong><span>Total labels</span><strong>{totalLabels.toLocaleString()}</strong></div>
          <button className="bqs-button bqs-button-primary bqs-full-button" onClick={printLabels} disabled={!rows.length || !!missingPayloadRows.length}><Printer size={16} /> Generate & Print</button>
          <p className="bqs-small-note">Print dialog: select 100 × 50 mm paper, scale 100%, and disable headers/footers.</p>
        </section>

        <section className="bqs-panel">
          <div className="bqs-section-heading"><div><h2>Live preview</h2><p>Rendered with bwip-js</p></div><ScanLine size={20} /></div>
          {firstRow ? <div className="bqs-preview-stage"><Label row={firstRow} mappings={mappings} template={template} barcodeType={barcodeType} separator={separator} humanReadable={humanReadable} /></div> : <div className="bqs-empty"><ScanLine size={28} /><span>Import data to preview a label.</span></div>}
          <button className="bqs-button bqs-button-secondary bqs-full-button" disabled={!rows.length} onClick={() => setBulkPreview(v => !v)}>{bulkPreview ? "Hide bulk preview" : "Preview bulk labels"}</button>
          {bulkPreview && <div className="bqs-bulk-preview">{labelRows.slice(0, 30).map(row => <div key={row.id} className="bqs-preview-stage"><Label row={row} mappings={mappings} template={template} barcodeType={barcodeType} separator={separator} humanReadable={humanReadable} /></div>)}{totalLabels > 30 && <p className="bqs-muted">Showing first 30 preview labels. Print includes all labels.</p>}</div>}
        </section>
      </aside>
    </div>

    <div id="bqs-print-root">{labelRows.map(row => <Label key={row.id} row={row} mappings={mappings} template={template} barcodeType={barcodeType} separator={separator} humanReadable={humanReadable} />)}</div>
  </main>;
}
