/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from 'react';
import ExcelJS from 'exceljs';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import router from 'next/router';
import { ArrowLeft, AlertTriangle, CheckCircle2, XCircle, Info, Download } from 'lucide-react';
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
}

interface UploadResponse {
    success: boolean;
    message: string;
    movement_id?: string;
    total_rows?: number;
    success_count?: number;
    failed_count?: number;
    errors?: Array<{ row: number; message: string; detail?: string }>;
    validation_errors?: Array<{ field: string; message: string; row: number }>;
}

// ─── Column config untuk preview ───────────────────────────────────────────
// Col 0: item_code | Col 1: location | Col 2: batch
const PREVIEW_COL_INDICES = [0, 1, 2];
const PREVIEW_COL_LABELS = ['Item Code', 'Location', 'Batch / Lot Number'];

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

// ── Download Template ─────────────────────────────────────────────────

const handleDownloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Template');

    worksheet.columns = [
        { header: 'item_code', key: 'item_code', width: 20 },
        { header: 'location', key: 'location', width: 20 },
        { header: 'batch', key: 'batch', width: 20 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });

    // Contoh baris data
    worksheet.addRow({ item_code: 'SKU00123', location: 'A-01-01', batch: 'BATCH20260810' });
    worksheet.addRow({ item_code: 'SKU00456', location: 'A-01-02', batch: 'BATCH20260810' });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_bulk_update_lot_number.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
};


// ─── Component ────────────────────────────────────────────────────────────────

const BulkUpdateLotExcel: React.FC = () => {
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
    const [reason, setReason] = useState<string>('');

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

            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                alert('Sheet tidak ditemukan di file Excel.');
                clearFile();
                return;
            }

            // Header row (row 1) — dipakai buat label preview kalau ada
            const headerRow = worksheet.getRow(1);
            const allHeaders: string[] = [];
            headerRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
                allHeaders[colNum - 1] = cell.value?.toString() || '';
            });

            const previewHeaders = PREVIEW_COL_INDICES.map((i, idx) =>
                allHeaders[i] || PREVIEW_COL_LABELS[idx]
            );

            const dataStartRow = 2;
            const totalDataRows = Math.max(0, worksheet.rowCount - 1);
            const maxPreview = Math.min(worksheet.rowCount, dataStartRow + 9);

            const rows: string[][] = [];

            const getCellStr = (row: ExcelJS.Row, colIdx: number): string => {
                const cell = row.getCell(colIdx + 1);
                const val = cell.value;
                if (val === null || val === undefined) return '';
                if (typeof val === 'object' && 'result' in val) return String((val as any).result ?? '');
                return val.toString().trim();
            };

            for (let i = dataStartRow; i <= maxPreview; i++) {
                const row = worksheet.getRow(i);
                const itemCode = getCellStr(row, 0);
                if (!itemCode) continue;

                const rowData = PREVIEW_COL_INDICES.map((colIdx) => getCellStr(row, colIdx));
                rows.push(rowData);
            }

            setPreview({
                headers: previewHeaders,
                rows,
                fileName: f.name,
                fileSize: formatFileSize(f.size),
                totalDataRows,
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

        setLoading(true); setUploadResult(null); setShowAlert(false);

        try {
            const formData = new FormData();
            formData.append('file', file);
            if (selectedOwner) formData.append('owner_code', selectedOwner);
            if (selectedWhs) formData.append('whs_code', selectedWhs);
            if (reason) formData.append('reason', reason);

            const res = await api.post('/inventory/bulk-update-lot-excel', formData, {
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
        <Layout title="Inventory" subTitle="Bulk Update Lot Number">
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

                        {/* ── Step 1: Config (Owner + Warehouse, optional) ── */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
                                <h2 className="text-lg font-semibold text-gray-900">Konfigurasi</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Owner */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Owner <span className="text-gray-400">(optional)</span>
                                    </label>
                                    <Select
                                        placeholder="Semua Owner..."
                                        options={ownerOptions}
                                        value={ownerOptions.find((o) => o.value === selectedOwner) || null}
                                        onChange={(opt) => setSelectedOwner(opt?.value || '')}
                                        isClearable
                                    />
                                    <p className="mt-1 text-xs text-gray-400">
                                        Buat scoping, hindari salah gudang/owner saat matching
                                    </p>
                                </div>

                                {/* Warehouse */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Warehouse <span className="text-gray-400">(optional)</span>
                                    </label>
                                    <Select
                                        placeholder="Semua Warehouse..."
                                        options={whsOptions}
                                        value={whsOptions.find((o) => o.value === selectedWhs) || null}
                                        onChange={(opt) => setSelectedWhs(opt?.value || '')}
                                        isClearable
                                    />
                                </div>

                                {/* Reason */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Reason <span className="text-gray-400">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Bulk lot number update via Excel"
                                        className="w-full h-[38px] rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Info box */}
                            {/* Info box */}
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex gap-2">
                                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-blue-800 flex-1">
                                        <div className="flex items-start justify-between gap-3 mb-1">
                                            <p className="font-medium">Format Template Bulk Update Lot Number:</p>
                                            <button
                                                onClick={handleDownloadTemplate}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-100 transition-colors whitespace-nowrap"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                Download Template
                                            </button>
                                        </div>
                                        <ul className="list-disc list-inside space-y-1 text-xs">
                                            <li>Kolom A: <strong>Item Code</strong>, Kolom B: <strong>Location</strong>, Kolom C: <strong>Batch / Lot Number</strong></li>
                                            <li>Row 1 dianggap header dan akan dilewati</li>
                                            <li>Pasangan item_code + location yang tidak ditemukan di inventory akan gagal dan tidak ada yang di-update (all-or-nothing per file)</li>
                                            <li>Setiap update akan tercatat di history pergerakan inventory (Movement ID)</li>
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
                                    id="lot-update-file-upload"
                                />
                                <label htmlFor="lot-update-file-upload" className="cursor-pointer inline-flex flex-col items-center">
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
                                        File Excel Bulk Update Lot Number (.xlsx, .xls) — maks 10MB
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
                                        disabled={loading}
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
                                                Upload &amp; Update Lot Number
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
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-blue-700">{preview.totalDataRows}</p>
                                        <p className="text-xs text-blue-600">Total Baris</p>
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
                                                                ${ci === 0 ? 'font-mono font-semibold text-blue-700' : ''}
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
                                                    <div className="flex flex-wrap gap-6">
                                                        <p>📦 Total Rows: <strong>{uploadResult.total_rows}</strong></p>
                                                        <p>✅ Updated: <strong>{uploadResult.success_count} row</strong></p>
                                                        {uploadResult.failed_count != null && uploadResult.failed_count > 0 && (
                                                            <p>⚠️ Failed: <strong>{uploadResult.failed_count} row</strong></p>
                                                        )}
                                                    </div>

                                                    {uploadResult.movement_id && (
                                                        <p className="text-xs text-green-600">
                                                            Movement ID: <span className="font-mono font-medium">{uploadResult.movement_id}</span>
                                                        </p>
                                                    )}

                                                    <div className="pt-3 border-t border-green-200">
                                                        <button
                                                            onClick={() => router.push('/wms/inventory/stock')}
                                                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                            </svg>
                                                            Lihat Inventory Data
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
                                                                        {e.detail && <p className="text-xs text-red-500 mt-0.5">{e.detail}</p>}
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

export default BulkUpdateLotExcel;