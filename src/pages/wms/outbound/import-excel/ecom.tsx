/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from 'react';
import ExcelJS from 'exceljs';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import router from 'next/router';
import { ArrowLeft } from 'lucide-react';
import Layout from '@/components/layout';
import Select from "react-select";
import { Customer } from '@/types/customer';
import { ItemOptions } from '@/types/outbound';
import { set } from 'date-fns';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type Platform = 'SHOPEE' | 'TOKOPEDIA' | 'LAZADA' | 'TIKTOK';

interface PlatformOption {
    value: Platform;
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    logo: string; // emoji placeholder
}

interface ExcelPreviewData {
    headers: string[];
    rows: string[][];
    fileName: string;
    fileSize: string;
    totalDataRows: number;
}

interface UploadResponse {
    success: boolean;
    message: string;
    total_rows?: number;
    success_count?: number;
    failed_count?: number;
    outbound_numbers?: string[];
    errors?: Array<{ row: number; message: string; detail: string }>;
    validation_errors?: Array<{ field: string; message: string; row: number }>;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const PLATFORM_OPTIONS: PlatformOption[] = [
    {
        value: 'SHOPEE',
        label: 'Shopee',
        color: 'text-orange-700',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-400',
        logo: '🛍️',
    },
    // {
    //     value: 'TOKOPEDIA',
    //     label: 'Tokopedia',
    //     color: 'text-green-700',
    //     bgColor: 'bg-green-50',
    //     borderColor: 'border-green-400',
    //     logo: '🟢',
    // },
    // {
    //     value: 'LAZADA',
    //     label: 'Lazada',
    //     color: 'text-blue-700',
    //     bgColor: 'bg-blue-50',
    //     borderColor: 'border-blue-400',
    //     logo: '🔵',
    // },
    // {
    //     value: 'TIKTOK',
    //     label: 'TikTok Shop',
    //     color: 'text-pink-700',
    //     bgColor: 'bg-pink-50',
    //     borderColor: 'border-pink-400',
    //     logo: '🎵',
    // },
];

const EXPECTED_HEADERS = ['No', 'Date', 'Platform', 'Order Number', 'AWB Number', 'Product Name', 'Qty', 'SKU'];

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const EcommerceExcelUpload: React.FC = () => {
    const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<ExcelPreviewData | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [customer, setCustomer] = useState<Customer[]>([]);
    const [customerOptions, setCustomerOptions] = useState<ItemOptions[]>([]);
    const [customerSelected, setCustomerSelected] = useState<string>("");

    useEffect(() => {
        setSelectedPlatform(PLATFORM_OPTIONS[0].value);
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [customers
                // , warehouses,
                // owners,
                // transporters
            ] = await Promise.all([
                api.get("/customers"),
                // api.get("/warehouses"),
                // api.get("/owners/user"),
                // api.get("/transporters"),
            ]);

            if (
                customers.data.success
                // warehouses.data.success &&
                // owners.data.success &&
                // transporters.data.success
            ) {
                setCustomer(customers.data.data);
                setCustomerOptions(
                    customers.data.data.map((item: Customer) => ({
                        value: item.customer_code,
                        label: item.customer_name,
                    }))
                );
                // setWhsOptions(
                //   warehouses.data.data.map((item: any) => ({
                //     value: item.code,
                //     label: item.code,
                //   }))
                // );
                // setOwnerOptions(
                //   owners.data.data.map((item: any) => ({
                //     value: item.owner_code,
                //     label: item.owner_code,
                //   }))
                // );
                // setTransporter(transporters.data.data);
                // setTransporterOptions(
                //   transporters.data.data.map((item: Transporter) => ({
                //     value: item.transporter_code,
                //     label: item.transporter_name,
                //   }))
                // );
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    // ── Utilities ──────────────────────────────

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const isValidExcelFile = (f: File): boolean => {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
        ];
        return (
            validTypes.includes(f.type) ||
            f.name.endsWith('.xlsx') ||
            f.name.endsWith('.xls')
        );
    };

    const getPlatformConfig = (p: Platform): PlatformOption =>
        PLATFORM_OPTIONS.find((o) => o.value === p)!;

    // ── File Handling ──────────────────────────

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;
        if (!isValidExcelFile(selected)) {
            alert('Please select a valid Excel file (.xlsx or .xls)');
            return;
        }
        setFile(selected);
        await previewExcelFile(selected);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (!dropped) return;
        if (!isValidExcelFile(dropped)) {
            alert('Please select a valid Excel file (.xlsx or .xls)');
            return;
        }
        setFile(dropped);
        await previewExcelFile(dropped);
    };

    const clearFile = () => {
        setFile(null);
        setPreview(null);
        setUploadResult(null);
        setShowAlert(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── Preview ────────────────────────────────

    const previewExcelFile = async (f: File) => {
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(await f.arrayBuffer());

            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                alert('No worksheet found in the file');
                return;
            }

            // Headers from row 1
            const headers: string[] = [];
            worksheet.getRow(1).eachCell((cell) => {
                headers.push(cell.value?.toString() || '');
            });

            // Up to 10 preview data rows
            const totalDataRows = worksheet.rowCount - 1;
            const maxPreview = Math.min(worksheet.rowCount, 11);
            const rows: string[][] = [];
            for (let i = 2; i <= maxPreview; i++) {
                const row = worksheet.getRow(i);
                const rowData: string[] = headers.map((_, idx) => {
                    const cell = row.getCell(idx + 1);
                    const val = cell.value;
                    if (val instanceof Date) return val.toISOString().split('T')[0];
                    if (val && typeof val === 'object' && 'result' in val)
                        return String((val as any).result ?? '');
                    return val?.toString() || '';
                });
                rows.push(rowData);
            }

            setPreview({
                headers,
                rows,
                fileName: f.name,
                fileSize: formatFileSize(f.size),
                totalDataRows,
            });
        } catch (err) {
            console.error('Error previewing file:', err);
            alert('Failed to preview file. Please ensure it is a valid Excel file.');
        }
    };

    // ── Template Download ──────────────────────

    const downloadTemplate = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Ecommerce Orders');

        worksheet.columns = [
            { header: 'No', key: 'no', width: 6 },
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Platform', key: 'platform', width: 15 },
            { header: 'Order Number', key: 'order_number', width: 25 },
            { header: 'AWB Number', key: 'awb_number', width: 25 },
            { header: 'Product Name', key: 'product_name', width: 50 },
            { header: 'Qty', key: 'qty', width: 8 },
            { header: 'SKU', key: 'sku', width: 20 },
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEE4D2D' }, // Shopee orange
        };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Sample rows
        const sampleRows = [
            {
                no: 1,
                date: '2026-02-19 19:01:00',
                platform: 'Shopee',
                order_number: '2602195UU5AFKB',
                awb_number: 'JNE001234567890',
                product_name: 'Yuwell YE660D + USB | Tensimeter Digital',
                qty: 1,
                sku: '30001063',
            },
            {
                no: 2,
                date: '2026-02-19 20:15:00',
                platform: 'Shopee',
                order_number: '2602195UU5AFKB',
                awb_number: 'JNE001234567890',
                product_name: 'Contoh Produk Kedua Dalam 1 Order',
                qty: 2,
                sku: '30001064',
            },
            {
                no: 3,
                date: '2026-02-20 09:30:00',
                platform: 'Shopee',
                order_number: '2602205XYZABC',
                awb_number: '',
                product_name: 'Produk di Order Berbeda',
                qty: 3,
                sku: '30001065',
            },
        ];

        sampleRows.forEach((row) => worksheet.addRow(row));

        // Add note row
        const noteRow = worksheet.addRow(['', '', '', '', '', '← Tiap Order Number unik = 1 Outbound', '', '']);
        noteRow.font = { italic: true, color: { argb: 'FF888888' } };

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Ecommerce_Outbound_Upload_Template.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
    };

    // ── Upload ─────────────────────────────────

    const handleUpload = async () => {
        if (!file) { alert('Please select a file first'); return; }
        if (!selectedPlatform) { alert('Please select a platform first'); return; }

        setLoading(true);
        setUploadResult(null);
        setShowAlert(false);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('platform', selectedPlatform);
            if (customerSelected) {
                formData.append('customer', customerSelected);
            }

            const response = await api.post('/outbound/upload-ecommerce-excel', formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setUploadResult(response.data);
            setShowAlert(true);

            if (response.data.success) {
                setFile(null);
                setPreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                setTimeout(() => {
                    router.push('/wms/outbound/data');
                }, 1500);
            }
        } catch (error: any) {
            const errorData = error.response?.data;
            setUploadResult(
                errorData || {
                    success: false,
                    message: 'Upload failed. Please try again.',
                    errors: [{ row: 0, message: 'Network Error', detail: error.message }],
                }
            );
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    // ── Render ─────────────────────────────────

    const activePlatformConfig = selectedPlatform ? getPlatformConfig(selectedPlatform) : null;

    return (
        <Layout title="Outbound" subTitle="Import Ecommerce Excel">
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">

                    {/* Back Button */}
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

                    {/* Page Header */}
                    <div className="mb-8" style={{ display: "none" }}>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Upload Ecommerce Orders to Outbound
                        </h1>
                        <p className="text-gray-600">
                            Upload order data from Shopee, Tokopedia, Lazada, or TikTok Shop —
                            each Order Number will automatically create a separate Outbound.
                        </p>
                    </div>

                    {/* Main Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">

                        {/* ── Step 1: Select Platform ── */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
                                    <h2 className="text-lg font-semibold text-gray-900">Select Platform</h2>
                                </div>
                                <button
                                    onClick={downloadTemplate}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download Template
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {PLATFORM_OPTIONS.map((p) => (
                                    <button
                                        key={p.value}
                                        onClick={() => setSelectedPlatform(p.value)}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all font-medium text-sm
                                            ${selectedPlatform === p.value
                                                ? `${p.bgColor} ${p.borderColor} ${p.color} shadow-md scale-105`
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="text-3xl">{p.logo}</span>
                                        <span>{p.label}</span>
                                        {selectedPlatform === p.value && (
                                            <span className="text-xs font-normal opacity-75">Selected ✓</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Info Notes */}
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex">
                                    <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <div className="text-sm text-blue-800">
                                        <p className="font-medium mb-1">Important Notes:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Download and use the provided template</li>
                                            <li>Required columns: <span className="font-mono text-xs">{EXPECTED_HEADERS.join(', ')}</span></li>
                                            <li>Each unique <strong>Order Number</strong> = 1 separate Outbound document</li>
                                            <li>Multiple rows with the same Order Number = multiple items in one Outbound</li>
                                            <li>SKU must match an existing product item code in the system</li>
                                            <li>Date format: <span className="font-mono text-xs">YYYY-MM-DD</span> or <span className="font-mono text-xs">YYYY-MM-DD HH:mm:ss</span></li>
                                            <li>Maximum file size: 10MB</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Step 2: Upload File ── */}
                        <div className={`p-6 border-b border-gray-200 transition-opacity ${!selectedPlatform ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Upload File
                                    {activePlatformConfig && (
                                        <span className={`ml-2 text-sm font-normal px-2 py-0.5 rounded-full ${activePlatformConfig.bgColor} ${activePlatformConfig.color}`}>
                                            {activePlatformConfig.logo} {activePlatformConfig.label}
                                        </span>
                                    )}
                                </h2>
                            </div>

                            {/* Drop Zone */}
                            <div
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
                                    ${isDragging
                                        ? 'border-blue-500 bg-blue-50 scale-105'
                                        : 'border-gray-300 hover:border-blue-400'
                                    }`}
                                onDragEnter={handleDragEnter}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="ecommerce-file-upload"
                                />
                                <label htmlFor="ecommerce-file-upload" className="cursor-pointer inline-flex flex-col items-center">
                                    <svg
                                        className={`w-12 h-12 mb-3 transition-all duration-200 ${isDragging ? 'text-blue-600 animate-bounce' : 'text-gray-400'}`}
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span className={`text-sm font-medium mb-1 ${isDragging ? 'text-blue-700' : 'text-gray-700'}`}>
                                        {isDragging ? '📂 Drop your file here!' : 'Click to upload or drag and drop'}
                                    </span>
                                    <span className="text-xs text-gray-500">Excel files (.xlsx, .xls) up to 10MB</span>
                                </label>
                            </div>

                            {/* Selected File Info */}
                            {file && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                        </div>
                                    </div>
                                    <button onClick={clearFile} className="text-red-600 hover:text-red-800 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {file && (
                                <div className="mt-4 flex gap-3">
                                    <div className="flex-1">
                                        <Select
                                            placeholder="Select Customer (optional)"
                                            value={customerOptions.find(
                                                (option) => option.value === customerSelected
                                            )}
                                            options={customerOptions}
                                            onChange={(selectedOption) => {
                                                if (selectedOption) {
                                                    setCustomerSelected(selectedOption.value);
                                                }
                                            }}
                                        // formatOptionLabel={(option, { context }) => {
                                        //     const cust = customer.find(
                                        //         (c) => c.customer_code === option.value
                                        //     );

                                        //     if (context === "menu") {
                                        //         // tampil di dropdown
                                        //         return (
                                        //             <div>
                                        //                 <div>{option.label}</div>
                                        //                 <div className="text-xs text-gray-500">
                                        //                     {cust?.cust_addr1}, {cust?.cust_city}
                                        //                 </div>
                                        //             </div>
                                        //         );
                                        //     }

                                        //     // tampil setelah kepilih (hanya label utama)
                                        //     return <div>{option.label}</div>;
                                        // }}
                                        />
                                    </div>
                                    <button
                                        onClick={handleUpload}
                                        disabled={loading || !selectedPlatform}
                                        className="flex-1 h-9 inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                                Upload &amp; Create Outbound
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={clearFile}
                                        disabled={loading}
                                        className="px-6 h-9 py-0 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ── Step 3: Preview ── */}
                        {preview && (
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">3</span>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Preview
                                        <span className="ml-2 text-sm font-normal text-gray-500">
                                            (showing first {preview.rows.length} of {preview.totalDataRows} data rows)
                                        </span>
                                    </h2>
                                </div>

                                {/* Stats bar */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-blue-700">{preview.totalDataRows}</p>
                                        <p className="text-xs text-blue-600">Total Rows</p>
                                    </div>
                                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-purple-700">
                                            {new Set(preview.rows.map(r => r[3])).size}
                                        </p>
                                        <p className="text-xs text-purple-600">Unique Orders (preview)</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-green-700">{preview.fileSize}</p>
                                        <p className="text-xs text-green-600">File Size</p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                                {preview.headers.map((h, i) => (
                                                    <th key={i} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {preview.rows.map((row, ri) => (
                                                <tr key={ri} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2 text-sm text-gray-400">{ri + 1}</td>
                                                    {row.map((cell, ci) => (
                                                        <td key={ci} className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap max-w-xs truncate">
                                                            {cell || <span className="text-gray-300">—</span>}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ── Result Alert ── */}
                        {showAlert && uploadResult && (
                            <div className="p-6">
                                <div className={`rounded-lg p-4 ${uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            {uploadResult.success ? (
                                                <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>

                                        <div className="ml-3 flex-1">
                                            <h3 className={`text-sm font-medium ${uploadResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                                {uploadResult.message}
                                            </h3>

                                            {/* Success Details */}
                                            {uploadResult.success && (
                                                <div className="mt-3 text-sm text-green-700 space-y-1">
                                                    <div className="flex gap-6">
                                                        <p>📦 Total Items: <strong>{uploadResult.total_rows}</strong></p>
                                                        <p>✅ Success: <strong>{uploadResult.success_count}</strong></p>
                                                    </div>
                                                    {uploadResult.outbound_numbers && uploadResult.outbound_numbers.length > 0 && (
                                                        <div className="mt-3">
                                                            <p className="font-medium mb-2">
                                                                Generated Outbound Numbers ({uploadResult.outbound_numbers.length}):
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {uploadResult.outbound_numbers.map((num, idx) => (
                                                                    <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-mono font-medium">
                                                                        {num}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Error Details */}
                                            {!uploadResult.success && (uploadResult.validation_errors?.length || uploadResult.errors?.length) ? (
                                                <div className="mt-3 text-sm text-red-700 space-y-3">
                                                    {uploadResult.validation_errors && uploadResult.validation_errors.length > 0 && (
                                                        <div>
                                                            <p className="font-medium mb-2">
                                                                Validation Errors ({uploadResult.validation_errors.length}):
                                                            </p>
                                                            <div className="max-h-60 overflow-y-auto bg-white rounded p-2 border border-red-200 space-y-2">
                                                                {uploadResult.validation_errors.map((e, idx) => (
                                                                    <div key={idx} className="pb-2 border-b border-red-100 last:border-b-0">
                                                                        <p>
                                                                            <span className="font-medium">Row {e.row}</span>
                                                                            <span className="mx-1 text-red-400">·</span>
                                                                            <span className="font-mono text-xs bg-red-50 px-1 rounded">{e.field}</span>
                                                                        </p>
                                                                        <p className="text-xs text-red-600 mt-0.5">{e.message}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                                                        <div>
                                                            <p className="font-medium mb-2">Errors ({uploadResult.errors.length}):</p>
                                                            <div className="max-h-60 overflow-y-auto bg-white rounded p-2 border border-red-200 space-y-2">
                                                                {uploadResult.errors.map((e, idx) => (
                                                                    <div key={idx} className="pb-2 border-b border-red-100 last:border-b-0">
                                                                        <p><span className="font-medium">Row {e.row}:</span> {e.message}</p>
                                                                        <p className="text-xs text-red-500 mt-0.5">{e.detail}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>

                                        <button onClick={() => setShowAlert(false)} className="ml-3 flex-shrink-0">
                                            <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default EcommerceExcelUpload;