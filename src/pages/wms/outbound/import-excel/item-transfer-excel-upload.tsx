/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useRef, useState } from "react";
import ExcelJS from "exceljs";
import api from "@/lib/api";
import router from "next/router";
import Layout from "@/components/layout";
import Select from "react-select";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, AlertCircle, CheckCircle2, FileSpreadsheet, RefreshCw,
  Trash2, Upload, XCircle, Info,
} from "lucide-react";

type SelectOption = { value: string; label: string };

type PreviewRow = {
  excelRow: number;
  transferNo: string;
  date: string;
  originalWarehouse: string;
  destinationWarehouse: string;
  itemCode: string;
  partCodeItem: string;
  itemName: string;
  modelName: string;
  quantity: string;
  unit: string;
  serialNumber: string;
  process: string;
  eligible: boolean;
};

type PreviewInfo = {
  rows: PreviewRow[];
  totalRows: number;
  eligibleRows: number;
  skippedRows: number;
  uniqueTransfers: number;
  fileName: string;
  fileSize: string;
};

type UploadResponse = {
  success: boolean;
  message: string;
  total_rows?: number;
  processed_rows?: number;
  skipped_rows?: number;
  success_count?: number;
  failed_count?: number;
  outbound_numbers?: string[];
  skipped_transfers?: { transfer_no: string; reason: string }[];
  validation_errors?: { row: number; field: string; message: string }[];
  errors?: { row: number; message: string; detail?: string }[];
};

const SHEET_NAME = "Item Transfer Detail";
const SOURCE_WAREHOUSE = "Yusen WH";
const PROCESS_NAME = "Transfer Out";
const MAX_SIZE = 10 * 1024 * 1024;
const PREVIEW_LIMIT = 30;

const REQUIRED_HEADERS = [
  "Transfer No", "Date", "Original Warehouse", "Transfer To Warehouse",
  "Item Code", "Part Code Item", "Item Name", "Model Name Item",
  "Quantity", "Unit", "Serial Number/Production", "Process Item Transfer",
];

const normalize = (value: unknown) =>
  String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();

const fileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const cellText = (value: ExcelJS.CellValue): string => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("result" in value) return cellText((value as any).result ?? "");
    if ("richText" in value && Array.isArray((value as any).richText))
      return (value as any).richText.map((x: any) => x.text ?? "").join("").trim();
    if ("text" in value) return String((value as any).text ?? "").trim();
    if ("hyperlink" in value) return String((value as any).text ?? (value as any).hyperlink ?? "").trim();
  }
  return String(value).trim();
};

const excelDate = (value: string) => {
  if (!value) return "";
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 20000 && numeric < 80000) {
    const date = new Date(Date.UTC(1899, 11, 30) + numeric * 86400000);
    return date.toISOString().slice(0, 10);
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime()) && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return parsed.toISOString().slice(0, 10);
  }
  return value;
};

const getCell = (
  row: ExcelJS.Row,
  headerMap: Record<string, number>,
  header: string
) => {
  const index = headerMap[normalize(header)];
  return index ? cellText(row.getCell(index).value) : "";
};

const makeHeaderMap = (worksheet: ExcelJS.Worksheet) => {
  const headerRow = worksheet.getRow(1);
  const map: Record<string, number> = {};
  headerRow.eachCell((cell, col) => {
    const key = normalize(cellText(cell.value));
    if (key) {
      if (map[key]) throw new Error(`Duplicate Excel header: ${cellText(cell.value)}`);
      map[key] = col;
    }
  });
  const missing = REQUIRED_HEADERS.filter((h) => !map[normalize(h)]);
  if (missing.length) throw new Error(`Missing required headers:\n${missing.map((x) => `• ${x}`).join("\n")}`);
  return map;
};

const ItemTransferExcelUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewInfo | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const [ownerOptions, setOwnerOptions] = useState<SelectOption[]>([]);
  const [warehouseOptions, setWarehouseOptions] = useState<SelectOption[]>([]);
  const [ownerCode, setOwnerCode] = useState("");
  const [warehouseCode, setWarehouseCode] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadMasters();
  }, []);

  const loadMasters = async () => {
    try {
      const [owners, warehouses] = await Promise.all([
        api.get("/owners"),
        api.get("/warehouses"),
      ]);
      if (owners.data?.success) {
        setOwnerOptions((owners.data.data ?? []).map((x: any) => ({
          value: x.code, label: `${x.code} - ${x.name ?? x.code}`,
        })));
      }
      if (warehouses.data?.success) {
        setWarehouseOptions((warehouses.data.data ?? []).map((x: any) => ({
          value: x.code, label: `${x.code} - ${x.name}`,
        })));
      }
    } catch (error) {
      console.error("Failed to load owner/warehouse master:", error);
      setErrorMessage("Unable to load Owner and Warehouse master data.");
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setUploadResult(null);
    setErrorMessage("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const buildPreview = async (selected: File) => {
    setPreviewLoading(true);
    setErrorMessage("");
    setUploadResult(null);
    try {
      if (!selected.name.toLowerCase().endsWith(".xlsx")) {
        throw new Error("Only .xlsx Excel files are supported.");
      }
      if (!selected.size || selected.size > MAX_SIZE) {
        throw new Error("The Excel file must be greater than 0 and not exceed 10 MB.");
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await selected.arrayBuffer());
      const worksheet = workbook.worksheets.find((x) => normalize(x.name) === normalize(SHEET_NAME));
      if (!worksheet) {
        throw new Error(`Worksheet "${SHEET_NAME}" was not found. Available sheets: ${workbook.worksheets.map(x => x.name).join(", ")}`);
      }
      const headerMap = makeHeaderMap(worksheet);
      const parsed: PreviewRow[] = [];
      const transfers = new Set<string>();
      let totalRows = 0;
      let eligibleRows = 0;
      let skippedRows = 0;

      for (let rowNo = 2; rowNo <= worksheet.rowCount; rowNo++) {
        const row = worksheet.getRow(rowNo);
        const values = REQUIRED_HEADERS.map((h) => getCell(row, headerMap, h));
        if (values.every((v) => !v.trim())) continue;
        totalRows++;

        const originalWarehouse = getCell(row, headerMap, "Original Warehouse");
        const process = getCell(row, headerMap, "Process Item Transfer");
        const eligible =
          normalize(originalWarehouse) === normalize(SOURCE_WAREHOUSE) &&
          normalize(process) === normalize(PROCESS_NAME);

        const transferNo = getCell(row, headerMap, "Transfer No");
        if (eligible) {
          eligibleRows++;
          if (transferNo) transfers.add(transferNo);
        } else {
          skippedRows++;
        }

        if (parsed.length < PREVIEW_LIMIT) {
          parsed.push({
            excelRow: rowNo,
            transferNo,
            date: excelDate(getCell(row, headerMap, "Date")),
            originalWarehouse,
            destinationWarehouse: getCell(row, headerMap, "Transfer To Warehouse"),
            itemCode: getCell(row, headerMap, "Item Code"),
            partCodeItem: getCell(row, headerMap, "Part Code Item"),
            itemName: getCell(row, headerMap, "Item Name"),
            modelName: getCell(row, headerMap, "Model Name Item"),
            quantity: getCell(row, headerMap, "Quantity"),
            unit: getCell(row, headerMap, "Unit"),
            serialNumber: getCell(row, headerMap, "Serial Number/Production"),
            process,
            eligible,
          });
        }
      }

      if (totalRows === 0) throw new Error("The worksheet does not contain any data rows.");
      setPreview({
        rows: parsed, totalRows, eligibleRows, skippedRows,
        uniqueTransfers: transfers.size, fileName: selected.name,
        fileSize: fileSize(selected.size),
      });
      setFile(selected);
    } catch (error: any) {
      setFile(null);
      setPreview(null);
      setErrorMessage(error?.message || "Unable to read this Excel file.");
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleFile = (selected?: File) => {
    if (!selected) return;
    void buildPreview(selected);
  };

  const handleUpload = async () => {
    if (!file || !preview) {
      setErrorMessage("Please select a valid Item Transfer Excel file first.");
      return;
    }
    if (!ownerCode || !warehouseCode) {
      setErrorMessage("Please select both Owner and Warehouse.");
      return;
    }
    if (preview.eligibleRows === 0) {
      setErrorMessage(`No eligible rows found. Only "${SOURCE_WAREHOUSE}" + "${PROCESS_NAME}" rows can be imported.`);
      return;
    }

    setUploadLoading(true);
    setUploadResult(null);
    setErrorMessage("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("owner_code", ownerCode);
      form.append("whs_code", warehouseCode);
      const response = await api.post("/outbound/upload-item-transfer-excel", form, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadResult(response.data);
    } catch (error: any) {
      console.error("Item Transfer upload failed:", error);
      setUploadResult(error?.response?.data ?? {
        success: false,
        message: error?.message || "Upload failed. Please try again.",
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const eligiblePreviewRows = useMemo(
    () => preview?.rows.filter((row) => row.eligible) ?? [],
    [preview]
  );

  return (
    <Layout title="Outbound" subTitle="Import Item Transfer Excel">
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Item Transfer Import</h1>
              <p className="mt-1 text-sm text-slate-500">
                Create outbound orders from the Item Transfer Detail Excel template.
              </p>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>

          <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Owner <span className="text-red-500">*</span></label>
              <Select
                options={ownerOptions}
                value={ownerOptions.find(x => x.value === ownerCode) ?? null}
                onChange={(option) => setOwnerCode(option?.value ?? "")}
                placeholder="Select owner..."
                isClearable
                classNamePrefix="react-select"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Outbound Warehouse <span className="text-red-500">*</span></label>
              <Select
                options={warehouseOptions}
                value={warehouseOptions.find(x => x.value === warehouseCode) ?? null}
                onChange={(option) => setWarehouseCode(option?.value ?? "")}
                placeholder="Select warehouse..."
                isClearable
                classNamePrefix="react-select"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="whitespace-pre-line">{errorMessage}</span>
              <button className="ml-auto" onClick={() => setErrorMessage("")} aria-label="Dismiss error"><XCircle className="h-4 w-4" /></button>
            </div>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              <div>
                <h2 className="font-semibold text-slate-900">Excel File</h2>
                <p className="text-xs text-slate-500">Template: {SHEET_NAME} · Maximum file size 10 MB · .xlsx only</p>
              </div>
            </div>

            {!file ? (
              <div
                onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
                onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
                className={`rounded-xl border-2 border-dashed p-8 text-center transition ${dragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50 hover:border-slate-400"}`}
              >
                <Upload className="mx-auto h-9 w-9 text-slate-400" />
                <p className="mt-3 font-medium text-slate-800">Drag and drop your Excel file here</p>
                <p className="mt-1 text-sm text-slate-500">or browse from your computer</p>
                <Button className="mt-4" onClick={() => fileRef.current?.click()} disabled={previewLoading}>
                  {previewLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Browse Excel
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </div>
            ) : (
              <div className="flex flex-col justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 shrink-0 text-emerald-700" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{preview?.fileName}</p>
                    <p className="text-xs text-slate-500">{preview?.fileSize} · Preview ready</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={reset}>
                  <Trash2 className="mr-2 h-4 w-4" /> Remove file
                </Button>
              </div>
            )}
          </section>

          {preview && (
            <>
              <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  ["Total Rows", preview.totalRows],
                  ["Eligible Rows", preview.eligibleRows],
                  ["Skipped Rows", preview.skippedRows],
                  ["Unique Transfers", preview.uniqueTransfers],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
                  </div>
                ))}
              </section>

              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-2 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="font-semibold text-slate-900">Data Preview</h2>
                    <p className="text-xs text-slate-500">Showing up to {PREVIEW_LIMIT} rows from the worksheet.</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Eligible
                    <span className="ml-2 inline-block h-2 w-2 rounded-full bg-amber-500" /> Skipped
                  </div>
                </div>
                <div className="max-h-[520px] overflow-auto">
                  <table className="w-full min-w-[1500px] border-collapse text-left text-xs">
                    <thead className="sticky top-0 z-10 bg-slate-100 text-slate-600">
                      <tr>
                        {["Excel Row", "Transfer No", "Date", "From Warehouse", "To Warehouse", "Item Code", "Part Code Item", "Item Name", "Model", "Qty", "Unit", "Serial / Production", "Process", "Status"].map((h) => (
                          <th key={h} className="whitespace-nowrap border-b border-slate-200 px-3 py-3 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row) => (
                        <tr key={row.excelRow} className={row.eligible ? "bg-white" : "bg-amber-50/60"}>
                          <td className="border-b border-slate-100 px-3 py-2 tabular-nums">{row.excelRow}</td>
                          <td className="border-b border-slate-100 px-3 py-2 font-medium">{row.transferNo || "-"}</td>
                          <td className="border-b border-slate-100 px-3 py-2 whitespace-nowrap">{row.date || "-"}</td>
                          <td className="border-b border-slate-100 px-3 py-2">{row.originalWarehouse || "-"}</td>
                          <td className="border-b border-slate-100 px-3 py-2">{row.destinationWarehouse || "-"}</td>
                          <td className="border-b border-slate-100 px-3 py-2 font-mono">{row.itemCode || "-"}</td>
                          <td className="border-b border-slate-100 px-3 py-2">{row.partCodeItem || "-"}</td>
                          <td className="border-b border-slate-100 px-3 py-2">{row.itemName || "-"}</td>
                          <td className="border-b border-slate-100 px-3 py-2">{row.modelName || "-"}</td>
                          <td className="border-b border-slate-100 px-3 py-2 text-right tabular-nums">{row.quantity || "-"}</td>
                          <td className="border-b border-slate-100 px-3 py-2">{row.unit || "-"}</td>
                          <td className="max-w-[260px] border-b border-slate-100 px-3 py-2">{row.serialNumber || "-"}</td>
                          <td className="border-b border-slate-100 px-3 py-2">{row.process || "-"}</td>
                          <td className="border-b border-slate-100 px-3 py-2">
                            {row.eligible ? (
                              <span className="inline-flex items-center gap-1 font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Eligible</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-medium text-amber-700"><Info className="h-3.5 w-3.5" /> Skipped</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preview.totalRows > PREVIEW_LIMIT && (
                  <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
                    Preview is limited to {PREVIEW_LIMIT} rows. All {preview.totalRows} rows will be validated by the backend.
                  </p>
                )}
              </section>

              <section className="flex flex-col justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center">
                <div className="flex items-start gap-2 text-sm text-blue-900">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Only rows where <strong>Original Warehouse = {SOURCE_WAREHOUSE}</strong> and
                    <strong> Process Item Transfer = {PROCESS_NAME}</strong> will create outbound.
                    One Transfer No creates one Outbound Header.
                  </p>
                </div>
                <Button onClick={handleUpload} disabled={uploadLoading || previewLoading || preview.eligibleRows === 0} className="shrink-0">
                  {uploadLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {uploadLoading ? "Creating Outbound..." : "Create Outbound"}
                </Button>
              </section>
            </>
          )}

          {uploadResult && (
            <section className={`rounded-xl border bg-white p-5 shadow-sm ${uploadResult.success ? "border-emerald-200" : "border-red-200"}`}>
              <div className="flex items-start gap-3">
                {uploadResult.success ? <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" /> : <XCircle className="mt-0.5 h-6 w-6 text-red-600" />}
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-slate-900">{uploadResult.success ? "Import Completed" : "Import Failed"}</h2>
                  <p className="mt-1 text-sm text-slate-600">{uploadResult.message}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  ["Processed Rows", uploadResult.processed_rows ?? 0],
                  ["Created Details", uploadResult.success_count ?? 0],
                  ["Skipped Rows", uploadResult.skipped_rows ?? 0],
                  ["Skipped Transfers", uploadResult.failed_count ?? 0],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">{value}</p>
                  </div>
                ))}
              </div>

              {!!uploadResult.outbound_numbers?.length && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium text-slate-700">Created Outbound Numbers</p>
                  <div className="flex flex-wrap gap-2">
                    {uploadResult.outbound_numbers.map((number) => (
                      <span key={number} className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-xs text-emerald-800">{number}</span>
                    ))}
                  </div>
                </div>
              )}

              {!!uploadResult.skipped_transfers?.length && (
                <div className="mt-4 overflow-x-auto">
                  <p className="mb-2 text-sm font-medium text-slate-700">Skipped Transfers</p>
                  <table className="w-full text-left text-sm">
                    <thead><tr className="border-b text-xs text-slate-500"><th className="py-2">Transfer No</th><th className="py-2">Reason</th></tr></thead>
                    <tbody>{uploadResult.skipped_transfers.map((x) => <tr key={x.transfer_no} className="border-b border-slate-100"><td className="py-2 font-mono">{x.transfer_no}</td><td className="py-2">{x.reason}</td></tr>)}</tbody>
                  </table>
                </div>
              )}

              {!!uploadResult.validation_errors?.length && (
                <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3">
                  <p className="mb-2 text-sm font-semibold text-red-800">Validation Errors</p>
                  {uploadResult.validation_errors.map((x, i) => <p key={i} className="text-xs text-red-700">Row {x.row} · {x.field}: {x.message}</p>)}
                </div>
              )}
              {!!uploadResult.errors?.length && (
                <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3">
                  <p className="mb-2 text-sm font-semibold text-red-800">Errors</p>
                  {uploadResult.errors.map((x, i) => <p key={i} className="text-xs text-red-700">Row {x.row || "-"} · {x.message}{x.detail ? ` — ${x.detail}` : ""}</p>)}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ItemTransferExcelUpload;
