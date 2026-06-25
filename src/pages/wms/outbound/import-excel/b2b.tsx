/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from 'react';
import ExcelJS from 'exceljs';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import router from 'next/router';
import { ArrowLeft, AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react';
import Layout from '@/components/layout';
import Select from 'react-select';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelectOption {
    value: string;
    label: string;
}

interface ExcelPreviewData {
    headers: string[];
    rows: string[][];
    fileName: string;
    fileSize: string;
    totalDataRows: number;
    uniqueMemoPOs: number;
}

interface UnknownCustomer {
    outbound_no: string;
    memo_po: string;
    customer_name: string;
}

interface SkippedOrder {
    order_number: string;
    reason: string;
}

interface UploadResponse {
    success: boolean;
    message: string;
    total_rows?: number;
    success_count?: number;
    failed_count?: number;
    outbound_numbers?: string[];
    skipped_orders?: SkippedOrder[];
    unknown_customers?: UnknownCustomer[];
    errors?: Array<{ row: number; message: string; detail: string }>;
    validation_errors?: Array<{ field: string; message: string; row: number }>;
}

// ─── Column config untuk preview (sesuai Template B2B) ────────────────────────
// Col 0: No | Col 1: Date | Col 3: Memo PO | Col 4: SKU
// Col 5: Customer | Col 6: Goods | Col 7: Qty | Col 9: Delivery Address | Col 10: Order Type
const PREVIEW_COL_INDICES = [1, 3, 4, 5, 6, 7, 9, 10];
const PREVIEW_COL_LABELS = ['Date', 'Memo PO', 'SKU', 'Customer', 'Goods', 'Qty', 'Delivery Address', 'Type'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const isValidExcel = (f: File) =>
    f.name.endsWith('.xlsx') || f.name.endsWith('.xls');

// Excel serial date → string
const excelSerialToDate = (serial: number): string => {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const ms = serial * 24 * 60 * 60 * 1000;
    const date = new Date(epoch.getTime() + ms);
    return date.toISOString().split('T')[0];
};

// ─── Component ────────────────────────────────────────────────────────────────

const B2BExcelUpload: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<ExcelPreviewData | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Master data options
    const [ownerOptions, setOwnerOptions] = useState<SelectOption[]>([]);
    const [whsOptions, setWhsOptions] = useState<SelectOption[]>([]);
    const [selectedOwner, setSelectedOwner] = useState<string>('');
    const [selectedWhs, setSelectedWhs] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const alertRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchOwners();
        fetchWarehouses();
    }, []);

    const fetchOwners = async () => {
        try {
            const res = await api.get('/owners');
            if (res.data.success) {
                setOwnerOptions(
                    res.data.data.map((item: any) => ({
                        value: item.code,
                        label: `${item.code} - ${item.code}`,
                    }))
                );
            }
        } catch (e) {
            console.error('Error fetching owners:', e);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const res = await api.get('/warehouses');
            if (res.data.success) {
                setWhsOptions(
                    res.data.data.map((item: any) => ({
                        value: item.code,
                        label: `${item.code} - ${item.name}`,
                    }))
                );
            }
        } catch (e) {
            console.error('Error fetching warehouses:', e);
        }
    };

    // ── File handling ──────────────────────────────────────────────────────

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;
        if (!isValidExcel(selected)) { alert('Please select a valid Excel file (.xlsx or .xls)'); return; }
        setFile(selected);
        await generatePreview(selected);
    };

    const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (!dropped || !isValidExcel(dropped)) { alert('Please select a valid Excel file (.xlsx or .xls)'); return; }
        setFile(dropped);
        await generatePreview(dropped);
    };

    const clearFile = () => {
        setFile(null); setPreview(null); setUploadResult(null); setShowAlert(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── Preview ────────────────────────────────────────────────────────────

    const generatePreview = async (f: File) => {
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(await f.arrayBuffer());

            const worksheet = workbook.worksheets.find(
                (ws) => ws.name.toLowerCase() === 'form ke yusen'
            );

            if (!worksheet) {
                const available = workbook.worksheets.map((ws) => ws.name).join(', ');
                alert(`Sheet "Form Ke Yusen" tidak ditemukan.\nSheet tersedia: ${available}`);
                clearFile();
                return;
            }

            // Header row
            const headerRow = worksheet.getRow(1);
            const allHeaders: string[] = [];
            headerRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
                allHeaders[colNum - 1] = cell.value?.toString() || '';
            });

            const previewHeaders = PREVIEW_COL_INDICES.map((i, idx) =>
                allHeaders[i] || PREVIEW_COL_LABELS[idx]
            );

            // Data rows (skip row 1 header)
            const dataStartRow = 2;
            const totalDataRows = Math.max(0, worksheet.rowCount - 1);
            const maxPreview = Math.min(worksheet.rowCount, dataStartRow + 9);

            const rows: string[][] = [];
            const memoPOSet = new Set<string>();

            const getCellStr = (row: ExcelJS.Row, colIdx: number): string => {
                const cell = row.getCell(colIdx + 1);
                const val = cell.value;
                if (val === null || val === undefined) return '';
                if (val instanceof Date) return val.toISOString().split('T')[0];
                if (typeof val === 'object' && 'result' in val) return String((val as any).result ?? '');
                // Handle Excel serial date (number in date column)
                if (typeof val === 'number' && colIdx === 1 && val > 40000) {
                    return excelSerialToDate(val);
                }
                return val.toString().trim();
            };

            for (let i = dataStartRow; i <= maxPreview; i++) {
                const row = worksheet.getRow(i);
                const memoPO = getCellStr(row, 3); // col 3
                if (!memoPO) continue;

                const rowData = PREVIEW_COL_INDICES.map((colIdx) => getCellStr(row, colIdx));
                rows.push(rowData);
                memoPOSet.add(memoPO);
            }

            // Count all unique Memo POs in full file
            for (let i = dataStartRow; i <= worksheet.rowCount; i++) {
                const row = worksheet.getRow(i);
                const memoPO = getCellStr(row, 3);
                if (memoPO) memoPOSet.add(memoPO);
            }

            setPreview({
                headers: previewHeaders,
                rows,
                fileName: f.name,
                fileSize: formatFileSize(f.size),
                totalDataRows,
                uniqueMemoPOs: memoPOSet.size,
            });
        } catch (err) {
            console.error('Error previewing:', err);
            alert('Failed to preview file. Please ensure it is a valid Excel file.');
            clearFile();
        }
    };

    // ── Upload ─────────────────────────────────────────────────────────────

    const handleUpload = async () => {
        if (!file) { alert('Please select a file first'); return; }
        if (!selectedOwner) { alert('Please select Owner first'); return; }
        if (!selectedWhs) { alert('Please select Warehouse first'); return; }

        setLoading(true); setUploadResult(null); setShowAlert(false);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('owner_code', selectedOwner);
            formData.append('whs_code', selectedWhs);

            const res = await api.post('/outbound/upload-b2b-excel', formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setUploadResult(res.data);
            setShowAlert(true);
        } catch (error: any) {
            const errorData = error.response?.data;
            setUploadResult(errorData || {
                success: false,
                message: 'Upload failed. Please try again.',
                errors: [{ row: 0, message: 'Network Error', detail: error.message }],
            });
            setShowAlert(true);
        } finally {
            setLoading(false);
            setTimeout(() => {
                alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <Layout title="Outbound" subTitle="Import B2B Excel">
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">

                    {/* Back */}
                    <div className="mb-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-28 text-white bg-black hover:bg-slate-600"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="ml-1">Back</span>
                        </Button>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">

                        {/* ── Step 1: Config (Owner + Warehouse) ── */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
                                <h2 className="text-lg font-semibold text-gray-900">Konfigurasi</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Owner */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Owner <span className="text-red-500">*</span>
                                    </label>
                                    <Select
                                        placeholder="Pilih Owner..."
                                        options={ownerOptions}
                                        value={ownerOptions.find((o) => o.value === selectedOwner) || null}
                                        onChange={(opt) => opt && setSelectedOwner(opt.value)}
                                    />
                                    <p className="mt-1 text-xs text-gray-400">
                                        Owner/principal pemilik stock (e.g. YUWELL)
                                    </p>
                                </div>

                                {/* Warehouse */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Warehouse <span className="text-red-500">*</span>
                                    </label>
                                    <Select
                                        placeholder="Pilih Warehouse..."
                                        options={whsOptions}
                                        value={whsOptions.find((o) => o.value === selectedWhs) || null}
                                        onChange={(opt) => opt && setSelectedWhs(opt.value)}
                                    />
                                </div>
                            </div>

                            {/* Info box */}
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex gap-2">
                                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-blue-800">
                                        <p className="font-medium mb-1">Format Template B2B (Form Ke Yusen):</p>
                                        <ul className="list-disc list-inside space-y-1 text-xs">
                                            <li>Upload langsung file Excel template B2B <strong>tanpa perlu edit format</strong></li>
                                            <li>1 <strong>Memo PO</strong> = 1 Outbound document</li>
                                            <li>Baris dengan Memo PO sama = multi-item dalam 1 Outbound</li>
                                            <li>Customer Name akan dicocokkan ke master — jika tidak ditemukan, tetap dibuat dan perlu dilengkapi via Edit</li>
                                            <li>Memo PO yang sudah ada di sistem akan dilewati (skip)</li>
                                            <li>Maximum file size: 10MB</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Step 2: Upload File ── */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
                                <h2 className="text-lg font-semibold text-gray-900">Upload File</h2>
                            </div>

                            {/* Drop Zone */}
                            <div
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
                                    ${isDragging ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300 hover:border-blue-400'}`}
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
                                    id="b2b-file-upload"
                                />
                                <label htmlFor="b2b-file-upload" className="cursor-pointer inline-flex flex-col items-center">
                                    <svg
                                        className={`w-12 h-12 mb-3 transition-all duration-200 ${isDragging ? 'text-blue-600 animate-bounce' : 'text-gray-400'}`}
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span className={`text-sm font-medium mb-1 ${isDragging ? 'text-blue-700' : 'text-gray-700'}`}>
                                        {isDragging ? '📂 Drop file di sini!' : 'Klik untuk upload atau drag & drop'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        File Excel Template B2B (.xlsx, .xls) — maks 10MB
                                    </span>
                                </label>
                            </div>

                            {/* Selected file info */}
                            {file && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
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
                                    <button onClick={clearFile} className="text-red-500 hover:text-red-700 transition-colors">
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            {/* Upload actions */}
                            {file && (
                                <div className="mt-4 flex gap-3">
                                    <button
                                        onClick={handleUpload}
                                        disabled={loading || !selectedOwner || !selectedWhs}
                                        className="flex-1 h-10 inline-flex items-center justify-center gap-2 px-6 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                                Upload &amp; Buat Outbound
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={clearFile}
                                        disabled={loading}
                                        className="px-6 h-10 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}

                            {/* Validation warning jika owner/whs belum dipilih */}
                            {file && (!selectedOwner || !selectedWhs) && (
                                <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Pilih Owner dan Warehouse terlebih dahulu sebelum upload
                                </p>
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
                                            (menampilkan {preview.rows.length} dari {preview.totalDataRows} baris data)
                                        </span>
                                    </h2>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-blue-700">{preview.totalDataRows}</p>
                                        <p className="text-xs text-blue-600">Total Baris</p>
                                    </div>
                                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-purple-700">{preview.uniqueMemoPOs}</p>
                                        <p className="text-xs text-purple-600">Unique Memo PO → Outbound</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-green-700">{preview.fileSize}</p>
                                        <p className="text-xs text-green-600">File Size</p>
                                    </div>
                                </div>

                                {/* Table preview */}
                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                                {preview.headers.map((h, i) => (
                                                    <th key={i} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
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
                                                        <td
                                                            key={ci}
                                                            className={`px-3 py-2 text-sm text-gray-900 whitespace-nowrap max-w-xs truncate
                                                                ${ci === 1 ? 'font-mono font-semibold text-blue-700' : ''}
                                                                ${ci === 2 ? 'font-mono text-slate-600' : ''}
                                                            `}
                                                        >
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
                            <div ref={alertRef} className="p-6">
                                <div className={`rounded-lg p-4 ${uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                    <div className="flex">
                                        <div className="flex-shrink-0 mt-0.5">
                                            {uploadResult.success
                                                ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                : <XCircle className="h-5 w-5 text-red-600" />
                                            }
                                        </div>
                                        <div className="ml-3 flex-1 min-w-0">
                                            <h3 className={`text-sm font-semibold ${uploadResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                                {uploadResult.message}
                                            </h3>

                                            {/* ── Success content ── */}
                                            {uploadResult.success && (
                                                <div className="mt-3 space-y-3 text-sm text-green-700">

                                                    {/* Stats */}
                                                    <div className="flex flex-wrap gap-6">
                                                        <p>📦 Total Items: <strong>{uploadResult.total_rows}</strong></p>
                                                        <p>✅ Berhasil: <strong>{uploadResult.success_count} item</strong></p>
                                                        {uploadResult.failed_count != null && uploadResult.failed_count > 0 && (
                                                            <p>⚠️ Skipped: <strong>{uploadResult.failed_count} Memo PO</strong></p>
                                                        )}
                                                    </div>

                                                    {/* Outbound Numbers */}
                                                    {uploadResult.outbound_numbers && uploadResult.outbound_numbers.length > 0 && (
                                                        <div>
                                                            <p className="font-medium mb-2">
                                                                Outbound Numbers ({uploadResult.outbound_numbers.length}):
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

                                                    {/* Unknown customers — perlu lengkapi manual */}
                                                    {uploadResult.unknown_customers && uploadResult.unknown_customers.length > 0 && (
                                                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                                                            <div className="flex items-start gap-2 mb-2">
                                                                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                                                <p className="text-sm font-semibold text-amber-800">
                                                                    {uploadResult.unknown_customers.length} Outbound dengan Customer tidak ditemukan di master
                                                                </p>
                                                            </div>
                                                            <p className="text-xs text-amber-700 mb-2">
                                                                Outbound tetap dibuat. Silakan lengkapi Customer Code via menu <strong>Edit</strong>.
                                                            </p>
                                                            <div className="max-h-48 overflow-y-auto space-y-1">
                                                                {uploadResult.unknown_customers.map((uc, idx) => (
                                                                    <div key={idx} className="flex items-start gap-2 py-1 border-b border-amber-100 last:border-b-0">
                                                                        <span className="font-mono text-xs bg-white text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded whitespace-nowrap">
                                                                            {uc.outbound_no}
                                                                        </span>
                                                                        <span className="text-xs text-amber-700">
                                                                            Memo PO: <strong>{uc.memo_po}</strong>
                                                                        </span>
                                                                        <span className="text-xs text-amber-600">
                                                                            → Customer: <em>{uc.customer_name}</em>
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Skipped orders */}
                                                    {uploadResult.skipped_orders && uploadResult.skipped_orders.length > 0 && (
                                                        <div>
                                                            <p className="font-medium mb-2 text-yellow-800">
                                                                ⚠️ {uploadResult.skipped_orders.length} Memo PO Diskip:
                                                            </p>
                                                            <div className="max-h-48 overflow-y-auto bg-white rounded p-2 border border-yellow-200 space-y-1">
                                                                {uploadResult.skipped_orders.map((s, idx) => (
                                                                    <div key={idx} className="flex items-start gap-2 pb-1 border-b border-yellow-100 last:border-b-0">
                                                                        <span className="font-mono text-xs bg-yellow-50 text-yellow-800 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                                                                            {s.order_number}
                                                                        </span>
                                                                        <span className="text-xs text-yellow-700">{s.reason}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Tombol ke Outbound Data */}
                                                    <div className="pt-3 border-t border-green-200">
                                                        <button
                                                            onClick={() => router.push('/wms/outbound/data')}
                                                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                            </svg>
                                                            Lihat Outbound Data
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ── Error content ── */}
                                            {!uploadResult.success && (
                                                <div className="mt-3 text-sm text-red-700 space-y-3">

                                                    {uploadResult.validation_errors && uploadResult.validation_errors.length > 0 && (
                                                        <div>
                                                            <p className="font-medium mb-2">Validation Errors ({uploadResult.validation_errors.length}):</p>
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

                                                    {/* Skipped dalam error response juga */}
                                                    {uploadResult.skipped_orders && uploadResult.skipped_orders.length > 0 && (
                                                        <div>
                                                            <p className="font-medium mb-2 text-yellow-800">
                                                                ⚠️ {uploadResult.skipped_orders.length} Memo PO Diskip:
                                                            </p>
                                                            <div className="max-h-48 overflow-y-auto bg-white rounded p-2 border border-yellow-200 space-y-1">
                                                                {uploadResult.skipped_orders.map((s, idx) => (
                                                                    <div key={idx} className="flex items-start gap-2 pb-1 border-b border-yellow-100 last:border-b-0">
                                                                        <span className="font-mono text-xs bg-yellow-50 text-yellow-800 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                                                                            {s.order_number}
                                                                        </span>
                                                                        <span className="text-xs text-yellow-700">{s.reason}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Close button */}
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

export default B2BExcelUpload;