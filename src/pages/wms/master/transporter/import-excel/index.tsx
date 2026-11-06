
"use client";

import React, { useState } from "react";
import * as ExcelJS from "exceljs";
import { mutate } from "swr";
import api from "@/lib/api";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, FileSpreadsheet, Download } from "lucide-react";
import router from "next/router";

interface PreviewData {
    headers: string[];
    rows: any[][];
}

interface UploadResult {
    total_rows: number;
    success_count: number;
    skipped_count: number;
    error_count: number;
    skipped_items: string[];
    error_messages: string[];
}

export default function TransporterExcelUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<UploadResult | null>(null);
    const [error, setError] = useState("");

    // Download Template
    const handleDownloadTemplate = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Transporters");

        const headers = [
            "TRANSPORTER_CODE",
            "TRANSPORTER_NAME",
            "ADDRESS",
            "CITY",
            "PIC",
            "PHONE",
            "EMAIL",
            "FAX",
            "IS_ACTIVE",
        ];

        const headerRow = worksheet.addRow(headers);

        headerRow.font = {
            color: { argb: "FFFFFFFF" },
            bold: true,
        };

        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4B5563" },
        };

        worksheet.addRow([
            "TRP001",
            "PT. Global Transport",
            "Jl. Industri Raya No. 45",
            "Jakarta",
            "Budi Santoso",
            "081234567890",
            "transport@global.com",
            "021-5551234",
            true,
        ]);

        worksheet.addRow([
            "TRP002",
            "CV. Prima Logistics",
            "Jl. Raya Bekasi KM 18",
            "Bekasi",
            "Andi Wijaya",
            "081298765432",
            "info@primalogistics.co.id",
            "021-8889876",
            true,
        ]);

        worksheet.columns = [
            { width: 20 },
            { width: 30 },
            { width: 35 },
            { width: 20 },
            { width: 25 },
            { width: 20 },
            { width: 35 },
            { width: 20 },
            { width: 15 },
        ];

        const buffer = await workbook.xlsx.writeBuffer();

        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = "transporter_upload_template.xlsx";
        a.click();

        window.URL.revokeObjectURL(url);
    };

    // Preview Excel
    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedFile.name.toLowerCase().endsWith(".xlsx")) {
            setError("Only Excel .xlsx files are allowed");
            e.target.value = "";
            return;
        }

        setFile(selectedFile);
        setPreview(null);
        setResult(null);
        setError("");
        setLoading(true);

        try {
            const buffer = await selectedFile.arrayBuffer();

            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);

            const worksheet = workbook.worksheets[0];

            if (!worksheet) {
                throw new Error("No worksheet found");
            }

            const rows: any[][] = [];

            worksheet.eachRow({ includeEmpty: false }, (row) => {
                const rowData: any[] = [];

                for (let i = 1; i <= 9; i++) {
                    rowData.push(row.getCell(i).value);
                }

                rows.push(rowData);
            });

            if (rows.length < 2) {
                throw new Error(
                    "Excel must contain header and at least one data row"
                );
            }

            setPreview({
                headers: rows[0].map((v) => String(v ?? "")),
                rows: rows.slice(1, 11),
            });

        } catch (err: any) {
            setError(err.message || "Failed to read Excel file");
            setFile(null);
        } finally {
            setLoading(false);
        }
    };

    // Upload Excel
    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file");
            return;
        }

        setUploading(true);
        setError("");
        setResult(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await api.post(
                "/transporters/upload-excel",
                formData,
                {
                    withCredentials: true,
                }
            );

            if (response.data.success) {
                setResult(response.data.data);

                await mutate("/transporters");
            } else {
                setError(
                    response.data.error || "Failed to upload file"
                );
            }
        } catch (err: any) {
            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Failed to upload file. Please try again."
            );
        } finally {
            setUploading(false);
        }
    };

    // Reset
    const handleReset = () => {
        setFile(null);
        setPreview(null);
        setResult(null);
        setError("");

        const input = document.getElementById(
            "transporter-file"
        ) as HTMLInputElement;

        if (input) input.value = "";
    };

    return (
        <Layout
            title="Master Transporter"
            subTitle="Import from Excel"
        >
            <div className="max-w-6xl mx-auto p-6">

                {/* Back */}
                <div className="mb-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white bg-black hover:bg-slate-600"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back
                    </Button>
                </div>

                <div className="bg-white rounded-lg shadow-sm border">

                    {/* Header */}
                    <div className="border-b px-6 py-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Upload Transporters from Excel
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            Import multiple transporter records at once.
                        </p>
                    </div>

                    <div className="p-6">

                        {/* Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <h3 className="text-sm font-semibold text-blue-900 mb-2">
                                Import Instructions
                            </h3>

                            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                <li>Download the Excel template before importing.</li>
                                <li>TRANSPORTER_CODE and TRANSPORTER_NAME are required.</li>
                                <li>TRANSPORTER_CODE will automatically be converted to uppercase.</li>
                                <li>Existing transporter codes will be skipped, not updated.</li>
                                <li>Email format will be validated if provided.</li>
                                <li>IS_ACTIVE accepts TRUE or FALSE. Default is TRUE.</li>
                                <li>Address, City, PIC, Phone and Fax are optional.</li>
                            </ul>
                        </div>

                        {/* Download Template */}
                        <div className="mb-6">
                            <Button
                                variant="outline"
                                onClick={handleDownloadTemplate}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download Excel Template
                            </Button>
                        </div>

                        {/* Upload File */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Excel File
                            </label>

                            <label
                                htmlFor="transporter-file"
                                className={`block border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                                    file
                                        ? "border-green-400 bg-green-50"
                                        : "border-gray-300 hover:border-blue-400"
                                }`}
                            >
                                <input
                                    id="transporter-file"
                                    type="file"
                                    accept=".xlsx"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    disabled={uploading}
                                />

                                <div className="flex flex-col items-center">
                                    {file ? (
                                        <FileSpreadsheet className="h-12 w-12 text-green-500 mb-3" />
                                    ) : (
                                        <Upload className="h-12 w-12 text-gray-400 mb-3" />
                                    )}

                                    <p className="text-sm font-medium text-gray-700">
                                        {file
                                            ? file.name
                                            : "Click to upload Excel file"}
                                    </p>

                                    <p className="text-xs text-gray-500 mt-1">
                                        Excel .xlsx only
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Loading */}
                        {loading && (
                            <div className="text-center py-8 text-gray-500">
                                Reading Excel file...
                            </div>
                        )}

                        {/* Preview */}
                        {preview && !loading && (
                            <div className="mb-6">
                                <h3 className="font-semibold text-sm mb-3">
                                    Preview (First 10 rows)
                                </h3>

                                <div className="border rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    {preview.headers.map((header, i) => (
                                                        <th
                                                            key={i}
                                                            className="px-4 py-3 text-left text-xs font-semibold uppercase whitespace-nowrap"
                                                        >
                                                            {header}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y">
                                                {preview.rows.map((row, i) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        {row.map((cell, j) => (
                                                            <td
                                                                key={j}
                                                                className="px-4 py-3 whitespace-nowrap"
                                                            >
                                                                {cell?.toString() || "-"}
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
                        {file && !loading && (
                            <div className="flex gap-3">
                                <Button
                                    className="flex-1"
                                    onClick={handleUpload}
                                    disabled={uploading}
                                >
                                    {uploading
                                        ? "Uploading..."
                                        : "Upload Transporters"}
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={handleReset}
                                    disabled={uploading}
                                >
                                    Reset
                                </Button>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                                <strong>Error:</strong> {error}
                            </div>
                        )}

                        {/* Result */}
                        {result && (
                            <div className="mt-6 space-y-4">

                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-green-800">
                                        Upload Completed
                                    </h3>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                                        {[
                                            {
                                                label: "Total Rows",
                                                value: result.total_rows,
                                                color: "text-gray-900",
                                            },
                                            {
                                                label: "Success",
                                                value: result.success_count,
                                                color: "text-green-600",
                                            },
                                            {
                                                label: "Skipped",
                                                value: result.skipped_count,
                                                color: "text-yellow-600",
                                            },
                                            {
                                                label: "Errors",
                                                value: result.error_count,
                                                color: "text-red-600",
                                            },
                                        ].map((item) => (
                                            <div
                                                key={item.label}
                                                className="bg-white border rounded p-3"
                                            >
                                                <p className="text-xs text-gray-500">
                                                    {item.label}
                                                </p>
                                                <p className={`text-2xl font-bold ${item.color}`}>
                                                    {item.value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Skipped */}
                                {result.skipped_items.length > 0 && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-yellow-800 mb-2">
                                            Skipped Transporters
                                        </h4>

                                        <div className="flex flex-wrap gap-2">
                                            {result.skipped_items.map((item, i) => (
                                                <span
                                                    key={i}
                                                    className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs"
                                                >
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Errors */}
                                {result.error_messages.length > 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-red-800 mb-2">
                                            Error Details
                                        </h4>

                                        <ul className="list-disc list-inside text-sm text-red-700 space-y-1 max-h-60 overflow-y-auto">
                                            {result.error_messages.map((msg, i) => (
                                                <li key={i}>{msg}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
