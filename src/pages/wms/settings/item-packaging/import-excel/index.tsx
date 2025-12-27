/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import * as XLSX from "exceljs";
import { mutate } from "swr";
import api from "@/lib/api";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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

export default function ItemPackagingExcelUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<UploadResult | null>(null);
    const [error, setError] = useState<string>("");

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validate file type
        if (
            !selectedFile.name.endsWith(".xlsx") &&
            !selectedFile.name.endsWith(".xls")
        ) {
            setError("Only Excel files (.xlsx, .xls) are allowed");
            return;
        }

        setFile(selectedFile);
        setError("");
        setResult(null);
        setLoading(true);

        try {
            // Preview Excel file
            const buffer = await selectedFile.arrayBuffer();
            const workbook = new XLSX.Workbook();
            await workbook.xlsx.load(buffer);

            const worksheet = workbook.worksheets[0];
            const rows: any[][] = [];

            worksheet.eachRow((row, rowNumber) => {
                const rowData: any[] = [];
                row.eachCell({ includeEmpty: true }, (cell) => {
                    rowData.push(cell.value);
                });
                rows.push(rowData);
            });

            if (rows.length > 0) {
                setPreview({
                    headers: rows[0],
                    rows: rows.slice(1, Math.min(11, rows.length)), // Show first 10 data rows
                });
            }
        } catch (err) {
            setError("Failed to read Excel file");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadTemplate = () => {
        const workbook = new XLSX.Workbook();
        const worksheet = workbook.addWorksheet("Item Packaging");

        // Define headers
        const headers = [
            "ITEM_CODE",
            "UOM",
            "EAN",
            "LENGTH_CM",
            "WIDTH_CM",
            "HEIGHT_CM",
            "NET_WEIGHT_KG",
            "GROSS_WEIGHT_KG",
        ];

        // Add header row with styling
        const headerRow = worksheet.addRow(headers);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4B5563" },
        };
        headerRow.font = { color: { argb: "FFFFFFFF" }, bold: true };

        // Add sample data
        worksheet.addRow([
            "PRD001",
            "PCS",
            "1234567890123",
            "30",
            "20",
            "15",
            "2.5",
            "3.0",
        ]);
        worksheet.addRow([
            "PRD001",
            "BOX",
            "1234567890124",
            "65",
            "45",
            "35",
            "30.0",
            "32.5",
        ]);
        worksheet.addRow([
            "PRD002",
            "CARTON",
            "9876543210987",
            "120",
            "80",
            "60",
            "85.5",
            "90.0",
        ]);

        // Set column widths
        worksheet.columns = [
            { width: 15 }, // ITEM_CODE
            { width: 10 }, // UOM
            { width: 16 }, // EAN
            { width: 12 }, // LENGTH_CM
            { width: 12 }, // WIDTH_CM
            { width: 12 }, // HEIGHT_CM
            { width: 16 }, // NET_WEIGHT_KG
            { width: 18 }, // GROSS_WEIGHT_KG
        ];

        // Generate and download
        workbook.xlsx.writeBuffer().then((buffer) => {
            const blob = new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "item_packaging_upload_template.xlsx";
            a.click();
            window.URL.revokeObjectURL(url);
        });
    };

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

            const response = await api.post("/product/item-packaging/upload-excel", formData, {
                withCredentials: true,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.success) {
                setResult(response.data.data);
                setTimeout(() => {
                    mutate("/item-packaging");
                }, 1500);
            }
        } catch (err: any) {
            setError(
                err.response?.data?.error || "Failed to upload file. Please try again."
            );
        } finally {
            setUploading(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setPreview(null);
        setResult(null);
        setError("");
    };

    return (
        <Layout title="Settings" subTitle="Item Packaging - Import Excel">
            <div className="max-w-6xl mx-auto p-6">
                <div className="mb-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-28 text-white bg-black outline-slate-500 hover:bg-slate-600"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="ml-1">Back</span>
                    </Button>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {/* Header */}
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Upload Item Packaging from Excel
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Upload an Excel file to create multiple item packaging records at once
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <h3 className="text-sm font-semibold text-blue-900 mb-2">
                                📋 Instructions
                            </h3>
                            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                <li>Download the template and fill in your item packaging data</li>
                                <li>All text fields will be converted to UPPERCASE automatically</li>
                                <li>
                                    <strong>ITEM_CODE must exist</strong> in the Products table
                                </li>
                                <li>
                                    <strong>UOM must exist</strong> in the UOM master
                                </li>
                                <li>
                                    Duplicate packaging (same ITEM_CODE, UOM, EAN) will be skipped
                                </li>
                                <li>All dimensions must be in <strong>CM (centimeters)</strong></li>
                                <li>All weights must be in <strong>KG (kilograms)</strong></li>
                                <li>
                                    <strong>Net Weight</strong> must be less than or equal to{" "}
                                    <strong>Gross Weight</strong>
                                </li>
                                <li>All dimensions and weights must be greater than 0</li>
                            </ul>
                        </div>

                        {/* Download Template Button */}
                        <div className="mb-6">
                            <button
                                onClick={handleDownloadTemplate}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg
                                    className="w-5 h-5 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                Download Template
                            </button>
                        </div>

                        {/* File Upload */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Excel File
                            </label>
                            <div className="flex items-center space-x-4">
                                <label className="flex-1">
                                    <div
                                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${file
                                            ? "border-green-400 bg-green-50"
                                            : "border-gray-300 hover:border-gray-400"
                                            }`}
                                    >
                                        <input
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            disabled={uploading}
                                        />
                                        <div className="flex flex-col items-center">
                                            <svg
                                                className={`w-12 h-12 mb-3 ${file ? "text-green-500" : "text-gray-400"
                                                    }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                />
                                            </svg>
                                            {file ? (
                                                <div>
                                                    <p className="text-sm font-medium text-green-700">
                                                        {file.name}
                                                    </p>
                                                    <p className="text-xs text-green-600 mt-1">
                                                        Click to change file
                                                    </p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">
                                                        Click to upload or drag and drop
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Excel files only (.xlsx, .xls)
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Loading Preview */}
                        {loading && (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="ml-3 text-gray-600">Loading preview...</span>
                            </div>
                        )}

                        {/* Preview Table */}
                        {preview && !loading && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                    Preview (First 10 rows)
                                </h3>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    {preview.headers.map((header, idx) => (
                                                        <th
                                                            key={idx}
                                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                                        >
                                                            {header}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {preview.rows.map((row, rowIdx) => (
                                                    <tr key={rowIdx} className="hover:bg-gray-50">
                                                        {row.map((cell, cellIdx) => (
                                                            <td
                                                                key={cellIdx}
                                                                className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
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

                        {/* Upload Button */}
                        {file && !loading && (
                            <div className="flex space-x-3">
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <svg
                                                className="w-5 h-5 mr-2"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                                />
                                            </svg>
                                            Upload Item Packaging
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleReset}
                                    disabled={uploading}
                                    className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Reset
                                </button>
                            </div>
                        )}

                        {/* Error Alert */}
                        {error && (
                            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex">
                                    <svg
                                        className="w-5 h-5 text-red-400 mr-3 flex-shrink-0"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <div>
                                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                                        <p className="text-sm text-red-700 mt-1">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Success Result */}
                        {result && (
                            <div className="mt-6 space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex">
                                        <svg
                                            className="w-5 h-5 text-green-400 mr-3 flex-shrink-0"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-green-800">
                                                Upload Completed Successfully
                                            </h3>
                                            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-white rounded p-3 border border-green-200">
                                                    <p className="text-xs text-gray-500">Total Rows</p>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {result.total_rows}
                                                    </p>
                                                </div>
                                                <div className="bg-white rounded p-3 border border-green-200">
                                                    <p className="text-xs text-gray-500">Success</p>
                                                    <p className="text-2xl font-bold text-green-600">
                                                        {result.success_count}
                                                    </p>
                                                </div>
                                                <div className="bg-white rounded p-3 border border-yellow-200">
                                                    <p className="text-xs text-gray-500">Skipped</p>
                                                    <p className="text-2xl font-bold text-yellow-600">
                                                        {result.skipped_count}
                                                    </p>
                                                </div>
                                                <div className="bg-white rounded p-3 border border-red-200">
                                                    <p className="text-xs text-gray-500">Errors</p>
                                                    <p className="text-2xl font-bold text-red-600">
                                                        {result.error_count}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Skipped Items */}
                                {result.skipped_items.length > 0 && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <h4 className="text-sm font-medium text-yellow-800 mb-2">
                                            ⚠️ Skipped Items (Already Exist)
                                        </h4>
                                        <div className="max-h-40 overflow-y-auto">
                                            <div className="flex flex-wrap gap-2">
                                                {result.skipped_items.map((item, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"
                                                    >
                                                        {item}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Error Messages */}
                                {result.error_messages.length > 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <h4 className="text-sm font-medium text-red-800 mb-2">
                                            ❌ Error Details
                                        </h4>
                                        <div className="max-h-60 overflow-y-auto">
                                            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                                                {result.error_messages.map((msg, idx) => (
                                                    <li key={idx}>{msg}</li>
                                                ))}
                                            </ul>
                                        </div>
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