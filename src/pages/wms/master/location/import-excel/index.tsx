import React, { useState, useRef } from 'react';
import ExcelJS from 'exceljs';
import api from '@/lib/api';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import router from 'next/router';
import { ArrowLeft, WarehouseIcon } from 'lucide-react';
import { Warning } from 'postcss';
import Link from 'next/link';

interface ExcelPreviewData {
    headers: string[];
    rows: string[][];
    fileName: string;
    fileSize: string;
}

interface UploadResponse {
    success: boolean;
    message: string;
    total_rows?: number;
    success_count?: number;
    failed_count?: number;
    created_locations?: string[];
    errors?: Array<{
        row: number;
        message: string;
        detail: string;
    }>;
    validation_errors?: Array<{
        field: string;
        message: string;
        row: number;
    }>;
}

const LocationExcelUpload: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<ExcelPreviewData | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) return;

        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];

        if (!validTypes.includes(selectedFile.type) &&
            !selectedFile.name.endsWith('.xlsx') &&
            !selectedFile.name.endsWith('.xls')) {
            alert('Please select a valid Excel file (.xlsx or .xls)');
            return;
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
            alert('File size exceeds 10MB limit');
            return;
        }

        setFile(selectedFile);
        await previewExcelFile(selectedFile);
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

        const droppedFile = e.dataTransfer.files[0];
        if (!droppedFile) return;

        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];

        if (!validTypes.includes(droppedFile.type) &&
            !droppedFile.name.endsWith('.xlsx') &&
            !droppedFile.name.endsWith('.xls')) {
            alert('Please select a valid Excel file (.xlsx or .xls)');
            return;
        }

        if (droppedFile.size > 10 * 1024 * 1024) {
            alert('File size exceeds 10MB limit');
            return;
        }

        setFile(droppedFile);
        await previewExcelFile(droppedFile);
    };

    const previewExcelFile = async (file: File) => {
        try {
            const workbook = new ExcelJS.Workbook();
            const arrayBuffer = await file.arrayBuffer();
            await workbook.xlsx.load(arrayBuffer);

            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                alert('No worksheet found in the file');
                return;
            }

            const headers: string[] = [];
            const rows: string[][] = [];

            const headerRow = worksheet.getRow(1);
            headerRow.eachCell((cell) => {
                headers.push(cell.value?.toString() || '');
            });

            const maxRows = Math.min(worksheet.rowCount, 21); // Show up to 20 rows
            for (let i = 2; i <= maxRows; i++) {
                const row = worksheet.getRow(i);
                const rowData: string[] = [];

                headers.forEach((_, index) => {
                    const cell = row.getCell(index + 1);
                    rowData.push(cell.value?.toString() || '');
                });

                rows.push(rowData);
            }

            const fileSize = formatFileSize(file.size);

            setPreview({
                headers,
                rows,
                fileName: file.name,
                fileSize
            });
        } catch (error) {
            console.error('Error previewing file:', error);
            alert('Failed to preview file. Please ensure it is a valid Excel file.');
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const downloadTemplate = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Location Template');

        // Define columns
        worksheet.columns = [
            { header: 'Location Code', key: 'location_code', width: 20 },
            { header: 'Warehouse Code', key: 'whs_code', width: 20 }
        ];

        // Style header row
        const headerRowStyle = worksheet.getRow(1);
        headerRowStyle.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRowStyle.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF059669' }
        };
        headerRowStyle.alignment = { vertical: 'middle', horizontal: 'center' };

        // Add sample data with explanation
        worksheet.addRow({
            location_code: 'YM090102',
            whs_code: 'WH01'
        });

        worksheet.addRow({
            location_code: 'YM080105',
            whs_code: 'WH01'
        });

        worksheet.addRow({
            location_code: 'AB060201',
            whs_code: 'WH02'
        });

        // Add notes below data
        // worksheet.addRow([]);
        // worksheet.addRow(['Notes:']);
        // worksheet.addRow(['Location Code Format: RRRBBLNN (9 characters)']);
        // worksheet.addRow(['- RRR: Row (3 characters, e.g., YMK, ABC)']);
        // worksheet.addRow(['- BB: Bay (2 digits, e.g., 49, 50)']);
        // worksheet.addRow(['- L: Level (1 character, e.g., A, B, C)']);
        // worksheet.addRow(['- NN: Bin (2 digits, e.g., 02, 05)']);
        // worksheet.addRow(['Example: YMK49B102']);
        // worksheet.addRow(['  - Row: YMK']);
        // worksheet.addRow(['  - Bay: 49 (odd = area ganjil)']);
        // worksheet.addRow(['  - Level: B1']);
        // worksheet.addRow(['  - Bin: 02']);

        // Style notes
        // for (let i = 5; i <= 13; i++) {
        //   const row = worksheet.getRow(i);
        //   row.font = { italic: true, color: { argb: 'FF6B7280' } };
        // }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Location_Upload_Template.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
    };

    const handleUpload = async () => {
        if (!file) {
            alert('Please select a file first');
            return;
        }

        setLoading(true);
        setUploadResult(null);
        setShowAlert(false);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/locations/upload-excel', formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setUploadResult(response.data);
            setShowAlert(true);

            if (response.data.success) {
                setFile(null);
                setPreview(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        } catch (error: any) {
            const errorData = error.response?.data;
            setUploadResult(errorData || {
                success: false,
                message: 'Upload failed. Please try again.',
                errors: [{ row: 0, message: 'Network Error', detail: error.message }]
            });
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    const clearFile = () => {
        setFile(null);
        setPreview(null);
        setUploadResult(null);
        setShowAlert(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Layout title="Master Location" subTitle="Import Excel">
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-6">
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
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Bulk Upload Locations
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Upload warehouse locations from Excel file
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Main Card */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        {/* Upload Section */}
                        <div className="p-8 border-b border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        File Upload
                                    </h2>
                                </div>
                                <button
                                    onClick={downloadTemplate}
                                    className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl hover:from-emerald-700 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-200"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download Template
                                </button>
                            </div>

                            {/* Info Note */}
                            <div className="mb-6 p-5 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl">
                                <div className="flex">
                                    <svg className="w-6 h-6 text-emerald-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <div className="text-sm text-emerald-900">
                                        <p className="font-semibold mb-2 text-base">📍 Location Code Format Guidelines:</p>
                                        <div className="space-y-2">
                                            <div className="bg-white/60 rounded-lg p-3 border border-emerald-200">
                                                <p className="font-mono font-bold text-emerald-800 mb-1">Format: RRBBLLNN (8 characters)</p>
                                                <ul className="space-y-1 text-emerald-700">
                                                    <li className="flex items-start">
                                                        <span className="mr-2 font-bold">•</span>
                                                        <span><strong>RR:</strong> Row (2 characters, e.g., AA, A1)</span>
                                                    </li>
                                                    <li className="flex items-start">
                                                        <span className="mr-2 font-bold">•</span>
                                                        <span><strong>BB:</strong> Bay (2 digits, e.g., 01, 02, 03)</span>
                                                    </li>
                                                    <li className="flex items-start">
                                                        <span className="mr-2 font-bold">•</span>
                                                        <span><strong>LL:</strong> Level (2 digits, e.g., 01, 02, 03)</span>
                                                    </li>
                                                    <li className="flex items-start">
                                                        <span className="mr-2 font-bold">•</span>
                                                        <span><strong>NN:</strong> Bin (2 digits, e.g., 01, 02, 03)</span>
                                                    </li>
                                                </ul>
                                            </div>
                                            <p className="flex items-start">
                                                <span className="mr-2">💡</span>
                                                <span><strong>Example:</strong> <code className="bg-emerald-100 px-2 py-0.5 rounded font-mono">A1010201</code> = Row: A1, Bay: 01 , Level: 02, Bin: 01</span>
                                            </p>
                                            <p className="flex items-start">
                                                <span className="mr-2"><WarehouseIcon className="w-4 h-4" /></span>
                                                <span>Warehouse code, please check your warehouse code on <Link href="/wms/master/warehouse" className="text-blue-600 hover:underline">Warehouse Master</Link></span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* File Input */}
                            <div
                                className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ${isDragging
                                    ? 'border-emerald-500 bg-emerald-100 scale-105'
                                    : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/30'
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
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="cursor-pointer inline-flex flex-col items-center"
                                >
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-200 ${isDragging
                                        ? 'bg-emerald-200 scale-110'
                                        : 'bg-emerald-100'
                                        }`}>
                                        <svg className={`w-8 h-8 transition-all duration-200 ${isDragging
                                            ? 'text-emerald-700 animate-bounce'
                                            : 'text-emerald-600'
                                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <span className={`text-base font-semibold mb-2 transition-colors ${isDragging
                                        ? 'text-emerald-700'
                                        : 'text-gray-700'
                                        }`}>
                                        {isDragging ? '📂 Drop your file here!' : 'Click to upload or drag and drop'}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        Excel files (.xlsx, .xls) up to 10MB
                                    </span>
                                </label>
                            </div>

                            {/* Selected File Info */}
                            {file && (
                                <div className="mt-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                                            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-base font-semibold text-gray-900">{file.name}</p>
                                            <p className="text-sm text-gray-600 mt-0.5">{formatFileSize(file.size)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={clearFile}
                                        className="text-red-600 hover:text-red-800 hover:bg-red-100 p-2 rounded-lg transition-all duration-200"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {file && (
                                <div className="mt-6 flex gap-4">
                                    <button
                                        onClick={handleUpload}
                                        disabled={loading}
                                        className="flex-1 inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl hover:from-emerald-700 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Processing Locations...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                                Upload & Create Locations
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={clearFile}
                                        disabled={loading}
                                        className="px-6 py-3.5 text-base font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Preview Section */}
                        {preview && (
                            <div className="p-8 bg-gray-50">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </div>
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            Data Preview
                                        </h2>
                                    </div>
                                    <span className="px-4 py-2 bg-emerald-100 text-emerald-800 text-sm font-semibold rounded-lg">
                                        {preview.rows.length} locations
                                    </span>
                                </div>
                                <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gradient-to-r from-emerald-100 to-green-50">
                                            <tr>
                                                <th className="px-4 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider">
                                                    #
                                                </th>
                                                {preview.headers.map((header, index) => (
                                                    <th
                                                        key={index}
                                                        className="px-4 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider whitespace-nowrap"
                                                    >
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {preview.rows.map((row, rowIndex) => (
                                                <tr key={rowIndex} className="hover:bg-emerald-50 transition-colors">
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-600">
                                                        {rowIndex + 1}
                                                    </td>
                                                    {row.map((cell, cellIndex) => (
                                                        <td
                                                            key={cellIndex}
                                                            className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap font-mono"
                                                        >
                                                            {cell || <span className="text-gray-400">-</span>}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Result Alert */}
                        {showAlert && uploadResult && (
                            <div className="p-8 bg-gray-50">
                                <div className={`rounded-xl p-6 shadow-lg border-2 ${uploadResult.success
                                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                                    : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300'
                                    }`}>
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            {uploadResult.success ? (
                                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                                    <svg className="h-7 w-7 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                                    <svg className="h-7 w-7 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <h3 className={`text-lg font-bold mb-2 ${uploadResult.success ? 'text-green-900' : 'text-red-900'
                                                }`}>
                                                {uploadResult.message}
                                            </h3>

                                            {uploadResult.success && (
                                                <div className="mt-3 space-y-2">
                                                    <div className="flex items-center space-x-6 text-sm">
                                                        <div className="flex items-center">
                                                            <span className="font-semibold text-green-900">Total Rows:</span>
                                                            <span className="ml-2 px-3 py-1 bg-green-100 text-green-800 rounded-lg font-bold">
                                                                {uploadResult.total_rows}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <span className="font-semibold text-green-900">Created:</span>
                                                            <span className="ml-2 px-3 py-1 bg-green-100 text-green-800 rounded-lg font-bold">
                                                                {uploadResult.success_count}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {uploadResult.created_locations && uploadResult.created_locations.length > 0 && (
                                                        <div className="mt-4 p-4 bg-white rounded-lg border border-green-200 max-h-64 overflow-y-auto">
                                                            <p className="font-semibold text-green-900 mb-3 flex items-center">
                                                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                                </svg>
                                                                Created Locations:
                                                            </p>
                                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                                {uploadResult.created_locations.map((loc, idx) => (
                                                                    <div key={idx} className="text-green-800 font-mono text-sm font-semibold bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                                                                        ✓ {loc}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {!uploadResult.success && (uploadResult.errors || uploadResult.validation_errors) && (
                                                <div className="mt-4 space-y-3 text-sm">
                                                    {uploadResult.validation_errors && uploadResult.validation_errors.length > 0 && (
                                                        <div>
                                                            <p className="font-semibold text-red-900 mb-3 flex items-center">
                                                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                </svg>
                                                                Validation Errors ({uploadResult.validation_errors.length}):
                                                            </p>
                                                            <div className="max-h-72 overflow-y-auto bg-white rounded-lg p-4 border border-red-200 space-y-3">
                                                                {uploadResult.validation_errors.map((error, idx) => (
                                                                    <div key={idx} className="pb-3 border-b border-red-100 last:border-b-0">
                                                                        <div className="flex items-start">
                                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-100 text-red-800 mr-2">
                                                                                Row {error.row}
                                                                            </span>
                                                                            <div className="flex-1">
                                                                                <p className="font-semibold text-red-900">{error.field}</p>
                                                                                <p className="text-red-700 mt-1">{error.message}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                                                        <div>
                                                            <p className="font-semibold text-red-900 mb-3 flex items-center">
                                                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                                </svg>
                                                                Processing Errors ({uploadResult.errors.length}):
                                                            </p>
                                                            <div className="max-h-72 overflow-y-auto bg-white rounded-lg p-4 border border-red-200 space-y-3">
                                                                {uploadResult.errors.map((error, idx) => (
                                                                    <div key={idx} className="pb-3 border-b border-red-100 last:border-b-0">
                                                                        <div className="flex items-start">
                                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-100 text-red-800 mr-2">
                                                                                Row {error.row}
                                                                            </span>
                                                                            <div className="flex-1">
                                                                                <p className="font-semibold text-red-900">{error.message}</p>
                                                                                <p className="text-red-700 text-xs mt-1">{error.detail}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setShowAlert(false)}
                                            className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                                        >
                                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
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

export default LocationExcelUpload;