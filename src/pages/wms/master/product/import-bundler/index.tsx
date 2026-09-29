/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useRef, useState } from "react";
import * as XLSX from "exceljs";
import api from "@/lib/api";
import Layout from "@/components/layout";
import { ArrowLeft, CheckCircle2, Download, FileSpreadsheet, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import router from "next/router";

interface PreviewRow {
  row: number;
  bundle_item_code?: string;
  component_item_code?: string;
  qty?: number;
}

interface PreviewResponse {
  success: boolean;
  total_rows: number;
  bundle_count: number;
  valid_rows: number;
  error_rows: number;
  will_set_bundle: number;
  errors: {
    row: number;
    bundle_item_code?: string;
    component_item_code?: string;
    column?: string;
    message: string;
  }[];
}

interface ImportResult {
  total_rows: number;
  bundle_count: number;
  component_count: number;
  updated_is_bundle: boolean;
}

const TEMPLATE_HEADERS = [
  "Bundle Item Code",
  "Component Item Code",
  "Qty",
];

export default function ProductBundleExcelUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<any[][]>([]);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const importingRef = useRef(false);

  const reset = () => {
    setFile(null);
    setPreviewRows([]);
    setPreview(null);
    setResult(null);
    setError("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const readExcelPreview = async (selectedFile: File) => {
    setLoadingFile(true);
    setError("");
    setResult(null);
    setPreview(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = new XLSX.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        throw new Error("Worksheet tidak ditemukan.");
      }

      const rows: any[][] = [];

      worksheet.eachRow((row) => {
        const values = row.values as any[];

        // ExcelJS row.values biasanya dimulai dari index 1.
        const normalized = Array.isArray(values)
          ? values.slice(1)
          : [];

        rows.push(normalized);
      });

      if (rows.length === 0) {
        throw new Error("Excel tidak memiliki data.");
      }

      const headers = rows[0].map((value) =>
        String(value ?? "").trim()
      );

      const normalizedHeaders = headers.map(normalizeHeader);

      const expectedHeaders = TEMPLATE_HEADERS.map(normalizeHeader);

      const isValidHeader =
        expectedHeaders.every((header, index) =>
          normalizedHeaders[index] === header
        );

      if (!isValidHeader) {
        throw new Error(
          `Format header tidak sesuai. Gunakan: ${TEMPLATE_HEADERS.join(
            " | "
          )}`
        );
      }

      const dataRows = rows
        .slice(1)
        .filter((row) =>
          row.some((value) => String(value ?? "").trim() !== "")
        );

      setPreviewRows(dataRows.slice(0, 10));
    } catch (err: any) {
      setFile(null);
      setPreviewRows([]);
      setError(
        err?.message || "Gagal membaca file Excel."
      );
    } finally {
      setLoadingFile(false);
    }
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    const isExcel =
      selectedFile.name.toLowerCase().endsWith(".xlsx") ||
      selectedFile.name.toLowerCase().endsWith(".xls");

    if (!isExcel) {
      setError("Hanya file Excel (.xlsx / .xls) yang diperbolehkan.");
      e.target.value = "";
      return;
    }

    setFile(selectedFile);
    await readExcelPreview(selectedFile);
  };

  const handleDownloadTemplate = async () => {
    try {
      setError("");

      // Gunakan template dari backend supaya frontend dan backend
      // selalu menggunakan format yang sama.
      const response = await api.get(
        "/products/bundles/import/template",
        {
          withCredentials: true,
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = "product_bundle_import_template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      // Fallback membuat template dari frontend jika endpoint belum
      // tersedia di server.
      try {
        const workbook = new XLSX.Workbook();
        const worksheet = workbook.addWorksheet("Bundle Import");

        worksheet.addRow(TEMPLATE_HEADERS);
        worksheet.addRow([
          "BUNDLE001",
          "ITEM001",
          1,
        ]);
        worksheet.addRow([
          "BUNDLE001",
          "ITEM002",
          2,
        ]);
        worksheet.addRow([
          "BUNDLE002",
          "ITEM010",
          1,
        ]);

        const headerRow = worksheet.getRow(1);
        headerRow.font = {
          bold: true,
          color: { argb: "FFFFFFFF" },
        };
        headerRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4B5563" },
        };

        worksheet.columns = [
          { width: 25 },
          { width: 25 },
          { width: 12 },
        ];

        const buffer = await workbook.xlsx.writeBuffer();

        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = "product_bundle_import_template.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();

        window.URL.revokeObjectURL(url);
      } catch (fallbackError: any) {
        setError(
          fallbackError?.message ||
            "Gagal membuat template Excel."
        );
      }
    }
  };

  const handlePreview = async () => {
    if (!file || previewing || importing) return;

    setPreviewing(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(
        "/products/bundles/import/preview",
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setPreview(response.data);

      if (!response.data.success) {
        setError(
          `Ditemukan ${response.data.error_rows ?? 0} error pada file.`
        );
      }
    } catch (err: any) {
      const data = err?.response?.data;

      if (data) {
        setPreview(data);
        setError(
          data.message ||
            `Ditemukan ${data.error_rows ?? 0} error pada file.`
        );
      } else {
        setError(
          "Gagal melakukan preview Excel. Silakan coba lagi."
        );
      }
    } finally {
      setPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!file || importingRef.current) return;

    // Import hanya boleh dilakukan setelah preview valid.
    if (!preview?.success) {
      setError(
        "Lakukan preview terlebih dahulu dan pastikan tidak ada error."
      );
      return;
    }

    importingRef.current = true;
    setImporting(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(
        "/products/bundles/import",
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message ||
            "Import bundle gagal."
        );
      }

      setResult(response.data.data);
    } catch (err: any) {
      const data = err?.response?.data;

      if (data?.errors) {
        setPreview(data);
      }

      setError(
        data?.message ||
          data?.error ||
          "Gagal melakukan import bundle."
      );
    } finally {
      importingRef.current = false;
      setImporting(false);
    }
  };

  const canImport =
    !!file &&
    !!preview &&
    preview.success &&
    !previewing &&
    !importing;

  return (
    <Layout
      title="Master Items"
      subTitle="Import Bundle Excel"
    >
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-4">
          <Button
            variant="ghost"
            className="h-8 w-28 text-white bg-black hover:bg-slate-600"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-6 w-6 text-green-600" />

              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Import Product Bundle
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Import bundle component dari Excel.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                📋 Format Excel
              </h3>

              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>
                  Satu Bundle Item Code dapat memiliki banyak component.
                </li>

                <li>
                  Component Item Code harus sudah tersedia di Master Item.
                </li>

                <li>
                  Qty harus lebih besar dari 0.
                </li>

                <li>
                  Jika IsBundle sebelumnya N, kosong, atau NULL,
                  setelah import berhasil akan otomatis menjadi Y.
                </li>

                <li>
                  Import menggunakan mode Replace: component bundle
                  existing akan diganti dengan isi Excel.
                </li>

                <li>
                  Jangan memasukkan Bundle Item Code sebagai component
                  dirinya sendiri.
                </li>

                <li>
                  Lakukan Preview terlebih dahulu sebelum Import.
                </li>
              </ul>
            </div>

            {/* Template */}
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                disabled={loadingFile || previewing || importing}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>

            {/* Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Excel File
              </label>

              <label className="block cursor-pointer">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    file
                      ? "border-green-400 bg-green-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={loadingFile || previewing || importing}
                  />

                  <UploadCloud
                    className={`mx-auto h-12 w-12 mb-3 ${
                      file
                        ? "text-green-500"
                        : "text-gray-400"
                    }`}
                  />

                  {file ? (
                    <>
                      <p className="text-sm font-medium text-green-700">
                        {file.name}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Click untuk mengganti file
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-700">
                        Click to upload atau drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Excel files only (.xlsx / .xls)
                      </p>
                    </>
                  )}
                </div>
              </label>
            </div>

            {/* Local preview */}
            {loadingFile && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
                <span className="ml-3 text-gray-600">
                  Reading Excel...
                </span>
              </div>
            )}

            {previewRows.length > 0 && !loadingFile && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Excel Preview
                  <span className="font-normal text-gray-500 ml-2">
                    (first 10 rows)
                  </span>
                </h3>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                            #
                          </th>

                          {TEMPLATE_HEADERS.map((header) => (
                            <th
                              key={header}
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody className="bg-white divide-y divide-gray-200">
                        {previewRows.map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {rowIndex + 2}
                            </td>

                            {[0, 1, 2].map((cellIndex) => (
                              <td
                                key={cellIndex}
                                className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                              >
                                {row[cellIndex] !== undefined &&
                                row[cellIndex] !== null &&
                                String(row[cellIndex]).trim() !== ""
                                  ? String(row[cellIndex])
                                  : "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {file && !loadingFile && (
              <div className="flex gap-3">
                <Button
                  onClick={handlePreview}
                  disabled={previewing || importing}
                  className="flex-1"
                >
                  {previewing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Preview & Validate
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleImport}
                  disabled={!canImport}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4 mr-2" />
                      Import Bundle
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={reset}
                  disabled={previewing || importing}
                >
                  Reset
                </Button>
              </div>
            )}

            {/* Validation Summary */}
            {preview && (
              <div className="mt-6">
                <div
                  className={`rounded-lg border p-4 ${
                    preview.success
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-start">
                    {preview.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs mr-3 mt-0.5">
                        !
                      </div>
                    )}

                    <div className="flex-1">
                      <h3
                        className={`text-sm font-semibold ${
                          preview.success
                            ? "text-green-800"
                            : "text-red-800"
                        }`}
                      >
                        {preview.success
                          ? "Excel is valid"
                          : "Excel contains validation errors"}
                      </h3>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                        <SummaryCard
                          label="Total Rows"
                          value={preview.total_rows}
                        />

                        <SummaryCard
                          label="Bundles"
                          value={preview.bundle_count}
                        />

                        <SummaryCard
                          label="Valid Rows"
                          value={preview.valid_rows}
                          valueClass="text-green-600"
                        />

                        <SummaryCard
                          label="Errors"
                          value={preview.error_rows}
                          valueClass={
                            preview.error_rows > 0
                              ? "text-red-600"
                              : "text-gray-900"
                          }
                        />

                        <SummaryCard
                          label="Will Set Y"
                          value={preview.will_set_bundle}
                          valueClass="text-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {preview.errors.length > 0 && (
                  <div className="mt-4 border border-red-200 rounded-lg overflow-hidden">
                    <div className="bg-red-50 px-4 py-3">
                      <h4 className="text-sm font-semibold text-red-800">
                        Validation Errors
                      </h4>
                    </div>

                    <div className="overflow-x-auto max-h-[400px]">
                      <table className="min-w-full divide-y divide-red-100">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                              Row
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                              Bundle
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                              Component
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                              Column
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                              Error
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100 bg-white">
                          {preview.errors.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {item.row || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {item.bundle_item_code || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {item.component_item_code || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {item.column || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm text-red-700">
                                {item.message}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Import Result */}
            {result && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mr-3 mt-0.5" />

                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-green-800">
                      Bundle Import Completed Successfully
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <SummaryCard
                        label="Total Rows"
                        value={result.total_rows}
                      />

                      <SummaryCard
                        label="Bundles"
                        value={result.bundle_count}
                        valueClass="text-blue-600"
                      />

                      <SummaryCard
                        label="Components"
                        value={result.component_count}
                        valueClass="text-green-600"
                      />

                      <SummaryCard
                        label="IsBundle Updated"
                        value={result.updated_is_bundle ? "YES" : "NO"}
                        valueClass="text-green-600"
                      />
                    </div>

                    <p className="text-xs text-green-700 mt-4">
                      Bundle configuration berhasil di-import.
                      Product dengan IsBundle N/kosong otomatis menjadi Y.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-800">
                  Error
                </h3>

                <p className="text-sm text-red-700 mt-1 whitespace-pre-wrap">
                  {error}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function SummaryCard({
  label,
  value,
  valueClass = "text-gray-900",
}: {
  label: string;
  value: string | number;
  valueClass?: string;
}) {
  return (
    <div className="bg-white rounded border border-gray-200 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-bold mt-1 ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/_/g, " ");
}
