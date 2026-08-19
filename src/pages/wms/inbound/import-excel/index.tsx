/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from 'react';
import ExcelJS from 'exceljs';
import api from '@/lib/api'; // Sesuaikan dengan path lib api Anda
import { Button } from '@/components/ui/button';
import router from 'next/router';
import { ArrowLeft } from 'lucide-react';
import Layout from '@/components/layout';

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
    inbound_numbers?: string[];
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

const InboundExcelUpload: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<ExcelPreviewData | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle file selection
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) return;

        // Validate file type
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

        setFile(selectedFile);
        await previewExcelFile(selectedFile);
    };

    // Handle drag events
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

        setFile(droppedFile);
        await previewExcelFile(droppedFile);
    };

    // Preview Excel file
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

            // Get headers from first row
            const headerRow = worksheet.getRow(1);
            headerRow.eachCell((cell) => {
                headers.push(cell.value?.toString() || '');
            });

            // Get preview rows (max 10 rows)
            const maxRows = Math.min(worksheet.rowCount, 11); // 1 header + 10 data rows
            for (let i = 2; i <= maxRows; i++) {
                const row = worksheet.getRow(i);
                const rowData: string[] = [];

                headers.forEach((_, index) => {
                    const cell = row.getCell(index + 1);
                    rowData.push(cell.value?.toString() || '');
                });

                rows.push(rowData);
            }

            // Format file size
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

    // Format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    // Download template
    // NOTE: Urutan kolom WAJIB sama dengan urutan index kolom yang dibaca
    // backend (lihat konstanta colReceiptID, colInboundDate, dst di
    // controller Go). Header dulu (Receipt ID s/d Remarks), baru kolom
   // detail (Item Code s/d Division) menyusul.
   // detail (Item Code s/d Division) menyusul, lalu Carton Number,
   // Case Number, Serial Number (conditional sesuai inventory policy)..
    const downloadTemplate = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Inbound Template');

        // Define columns
        worksheet.columns = [
            // ---- Header fields ----
            { header: 'Receipt ID', key: 'receipt_id', width: 18 },
            { header: 'Inbound Date', key: 'inbound_date', width: 14 },
            { header: 'IB Type', key: 'ib_type', width: 12 },
            { header: 'Supplier', key: 'supplier', width: 14 },
            { header: 'Trucker', key: 'trucker', width: 20 },
            { header: 'Driver', key: 'driver', width: 12 },
            { header: 'Warehouse Code', key: 'whs_code', width: 14 },
            { header: 'Owner Code', key: 'owner_code', width: 14 },
            { header: 'Origin', key: 'origin', width: 16 },
            { header: 'PO Date', key: 'po_date', width: 14 },
            { header: 'Truck No.', key: 'no_truck', width: 12 },
            { header: 'Container No.', key: 'container', width: 14 },
            { header: 'Truck Size', key: 'truck_size', width: 12 },
            { header: 'Arrival Time', key: 'arrival_time', width: 12 },
            { header: 'Start Unloading', key: 'start_unloading', width: 14 },
            { header: 'Finish Unloading', key: 'end_unloading', width: 14 },
            { header: 'BL No.', key: 'bl_no', width: 12 },
            { header: 'Koli', key: 'koli', width: 10 },
            { header: 'Remarks', key: 'remarks', width: 20 },
            // ---- Detail fields ----
            { header: 'Item Code', key: 'item_code', width: 16 },
            { header: 'UOM', key: 'uom', width: 10 },
            { header: 'Quantity', key: 'quantity', width: 12 },
            { header: 'Location', key: 'location', width: 14 },
            { header: 'QA Status', key: 'qa_status', width: 12 },
            { header: 'Receive Date', key: 'rec_date', width: 14 },
            { header: 'Production Date', key: 'prod_date', width: 15 },
            { header: 'Expiration Date', key: 'exp_date', width: 15 },
            { header: 'Lot Number', key: 'lot_number', width: 16 },
            { header: 'Division', key: 'division', width: 16 },
            { header: 'Carton Number', key: 'carton_number', width: 16 },
            { header: 'Case Number', key: 'case_number', width: 16 },
            { header: 'Serial Number', key: 'serial_number', width: 16 }
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Sample data: 2 Receipt ID berbeda dalam satu file (RCP-2026-001
        // dan RCP-2026-002), masing-masing 7 baris item, untuk
        // mendemonstrasikan bahwa satu file bisa menghasilkan lebih dari
        // satu Inbound (satu Inbound per Receipt ID).
        const sampleRows = [
            // ---- RCP-2026-001 ----
            { receipt_id: 'RCP-2026-001', inbound_date: '2026-04-24', ib_type: 'NORMAL', supplier: 'JYME', trucker: 'AA_REG - ANTERA', driver: 'B123', whs_code: 'WH-B', owner_code: 'YUWELL', origin: 'SHANGHAI', po_date: '2026-04-20', no_truck: 'B2', container: '1', truck_size: '2', arrival_time: '09:25', start_unloading: '09:25', end_unloading: '15:54', bl_no: '1', koli: 1, remarks: '', item_code: 30037791, uom: 'PCS', quantity: 100, location: 'STAGING', qa_status: 'A', rec_date: '2026-04-24', prod_date: '', exp_date: '', lot_number: 'LOT01', division: 'E-COMMERCE', carton_number: '', case_number: '', serial_number: '' },
            { receipt_id: 'RCP-2026-001', inbound_date: '2026-04-24', ib_type: 'NORMAL', supplier: 'JYME', trucker: 'AA_REG - ANTERA', driver: 'B123', whs_code: 'WH-B', owner_code: 'YUWELL', origin: 'SHANGHAI', po_date: '2026-04-20', no_truck: 'B2', container: '1', truck_size: '2', arrival_time: '09:25', start_unloading: '09:25', end_unloading: '15:54', bl_no: '1', koli: 1, remarks: '', item_code: 30047340, uom: 'PCS', quantity: 100, location: 'STAGING', qa_status: 'A', rec_date: '2026-04-24', prod_date: '', exp_date: '', lot_number: 'LOT01', division: 'E-COMMERCE', carton_number: '', case_number: '', serial_number: '' },
            { receipt_id: 'RCP-2026-001', inbound_date: '2026-04-24', ib_type: 'NORMAL', supplier: 'JYME', trucker: 'AA_REG - ANTERA', driver: 'B123', whs_code: 'WH-B', owner_code: 'YUWELL', origin: 'SHANGHAI', po_date: '2026-04-20', no_truck: 'B2', container: '1', truck_size: '2', arrival_time: '09:25', start_unloading: '09:25', end_unloading: '15:54', bl_no: '1', koli: 1, remarks: '', item_code: 10030875, uom: 'PCS', quantity: 100, location: 'STAGING', qa_status: 'A', rec_date: '2026-04-24', prod_date: '', exp_date: '', lot_number: 'LOT01', division: 'E-COMMERCE', carton_number: '', case_number: '', serial_number: '' },
            { receipt_id: 'RCP-2026-001', inbound_date: '2026-04-24', ib_type: 'NORMAL', supplier: 'JYME', trucker: 'AA_REG - ANTERA', driver: 'B123', whs_code: 'WH-B', owner_code: 'YUWELL', origin: 'SHANGHAI', po_date: '2026-04-20', no_truck: 'B2', container: '1', truck_size: '2', arrival_time: '09:25', start_unloading: '09:25', end_unloading: '15:54', bl_no: '1', koli: 1, remarks: '', item_code: 10030873, uom: 'PCS', quantity: 100, location: 'STAGING', qa_status: 'A', rec_date: '2026-04-24', prod_date: '', exp_date: '', lot_number: 'LOT01', division: 'E-COMMERCE', carton_number: '', case_number: '', serial_number: '' },
            { receipt_id: 'RCP-2026-001', inbound_date: '2026-04-24', ib_type: 'NORMAL', supplier: 'JYME', trucker: 'AA_REG - ANTERA', driver: 'B123', whs_code: 'WH-B', owner_code: 'YUWELL', origin: 'SHANGHAI', po_date: '2026-04-20', no_truck: 'B2', container: '1', truck_size: '2', arrival_time: '09:25', start_unloading: '09:25', end_unloading: '15:54', bl_no: '1', koli: 1, remarks: '', item_code: 10029911, uom: 'PCS', quantity: 100, location: 'STAGING', qa_status: 'A', rec_date: '2026-04-24', prod_date: '', exp_date: '', lot_number: 'LOT01', division: 'E-COMMERCE', carton_number: '', case_number: '', serial_number: '' },
            { receipt_id: 'RCP-2026-001', inbound_date: '2026-04-24', ib_type: 'NORMAL', supplier: 'JYME', trucker: 'AA_REG - ANTERA', driver: 'B123', whs_code: 'WH-B', owner_code: 'YUWELL', origin: 'SHANGHAI', po_date: '2026-04-20', no_truck: 'B2', container: '1', truck_size: '2', arrival_time: '09:25', start_unloading: '09:25', end_unloading: '15:54', bl_no: '1', koli: 1, remarks: '', item_code: 10022884, uom: 'PCS', quantity: 100, location: 'STAGING', qa_status: 'A', rec_date: '2026-04-24', prod_date: '', exp_date: '', lot_number: 'LOT01', division: 'E-COMMERCE', carton_number: '', case_number: '', serial_number: '' },
            { receipt_id: 'RCP-2026-001', inbound_date: '2026-04-24', ib_type: 'NORMAL', supplier: 'JYME', trucker: 'AA_REG - ANTERA', driver: 'B123', whs_code: 'WH-B', owner_code: 'YUWELL', origin: 'SHANGHAI', po_date: '2026-04-20', no_truck: 'B2', container: '1', truck_size: '2', arrival_time: '09:25', start_unloading: '09:25', end_unloading: '15:54', bl_no: '1', koli: 1, remarks: '', item_code: 10036340, uom: 'PCS', quantity: 100, location: 'STAGING', qa_status: 'A', rec_date: '2026-04-24', prod_date: '', exp_date: '', lot_number: 'LOT01', division: 'E-COMMERCE', carton_number: '', case_number: '', serial_number: '' },
            // ---- RCP-2026-002 ----
            { receipt_id: 'RCP-2026-002', inbound_date: '2026-04-24', ib_type: 'NORMAL', supplier: 'JYME', trucker: 'AA_REG - ANTERA', driver: 'B123', whs_code: 'WH-B', owner_code: 'YUWELL', origin: 'SHANGHAI', po_date: '2026-04-20', no_truck: 'B2', container: '1', truck_size: '2', arrival_time: '09:25', start_unloading: '09:25', end_unloading: '15:54', bl_no: '1', koli: 1, remarks: '', item_code: 10036342, uom: 'PCS', quantity: 100, location: 'STAGING', qa_status: 'A', rec_date: '2026-04-24', prod_date: '', exp_date: '', lot_number: 'LOT01', division: 'E-COMMERCE', carton_number: '', case_number: '', serial_number: '' },
            { receipt_id: 'RCP-2026-002', inbound_date: '2026-04-24', ib_type: 'NORMAL', supplier: 'JYME', trucker: 'AA_REG - ANTERA', driver: 'B123', whs_code: 'WH-B', owner_code: 'YUWELL', origin: 'SHANGHAI', po_date: '2026-04-20', no_truck: 'B2', container: '1', truck_size: '2', arrival_time: '09:25', start_unloading: '09:25', end_unloading: '15:54', bl_no: '1', koli: 1, remarks: '', item_code: 10035319, uom: 'PCS', quantity: 100, location: 'STAGING', qa_status: 'A', rec_date: '2026-04-24', prod_date: '', exp_date: '', lot_number: 'LOT01', division: 'E-COMMERCE', carton_number: '', case_number: '', serial_number: '' },
            { receipt_id: 'RCP-2026-002', inbound_date: '2026-04-24', ib_type: 'NORMAL', supplier: 'JYME', trucker: 'AA_REG - ANTERA', driver: 'B123', whs_code: 'WH-B', owner_code: 'YUWELL', origin: 'SHANGHAI', po_date: '2026-04-20', no_truck: 'B2', container: '1', truck_size: '2', arrival_time: '09:25', start_unloading: '09:25', end_unloading: '15:54', bl_no: '1', koli: 1, remarks: '', item_code: 10099486, uom: 'PCS', quantity: 100, location: 'STAGING', qa_status: 'A', rec_date: '2026-04-24', prod_date: '', exp_date: '', lot_number: 'LOT01', division: 'E-COMMERCE', carton_number: '', case_number: '', serial_number: '' },
            { receipt_id: 'RCP-2026-002', inbound_date: '2026-04-24', ib_type: 'NORMAL', supplier: 'JYME', trucker: 'AA_REG - ANTERA', driver: 'B123', whs_code: 'WH-B', owner_code: 'YUWELL', origin: 'SHANGHAI', po_date: '2026-04-20', no_truck: 'B2', container: '1', truck_size: '2', arrival_time: '09:25', start_unloading: '09:25', end_unloading: '15:54', bl_no: '1', koli: 1, remarks: '', item_code: 10099485, uom: 'PCS', quantity: 100, location: 'STAGING', qa_status: 'A', rec_date: '2026-04-24', prod_date: '', exp_date: '', lot_number: 'LOT01', division: 'E-COMMERCE', carton_number: '', case_number: '', serial_number: '' },
            { receipt_id: 'RCP-2026-002', inbound_date: '2026-04-24', ib_type: 'NORMAL', supplier: 'JYME', trucker: 'AA_REG - ANTERA', driver: 'B123', whs_code: 'WH-B', owner_code: 'YUWELL', origin: 'SHANGHAI', po_date: '2026-04-20', no_truck: 'B2', container: '1', truck_size: '2', arrival_time: '09:25', start_unloading: '09:25', end_unloading: '15:54', bl_no: '1', koli: 1, remarks: '', item_code: 10099487, uom: 'PCS', quantity: 100, location: 'STAGING', qa_status: 'A', rec_date: '2026-04-24', prod_date: '', exp_date: '', lot_number: 'LOT01', division: 'E-COMMERCE', carton_number: '', case_number: '', serial_number: '' },
            { receipt_id: 'RCP-2026-002', inbound_date: '2026-04-24', ib_type: 'NORMAL', supplier: 'JYME', trucker: 'AA_REG - ANTERA', driver: 'B123', whs_code: 'WH-B', owner_code: 'YUWELL', origin: 'SHANGHAI', po_date: '2026-04-20', no_truck: 'B2', container: '1', truck_size: '2', arrival_time: '09:25', start_unloading: '09:25', end_unloading: '15:54', bl_no: '1', koli: 1, remarks: '', item_code: 10030420, uom: 'PCS', quantity: 100, location: 'STAGING', qa_status: 'A', rec_date: '2026-04-24', prod_date: '', exp_date: '', lot_number: 'LOT01', division: 'E-COMMERCE', carton_number: '', case_number: '', serial_number: '' },
            { receipt_id: 'RCP-2026-002', inbound_date: '2026-04-24', ib_type: 'NORMAL', supplier: 'JYME', trucker: 'AA_REG - ANTERA', driver: 'B123', whs_code: 'WH-B', owner_code: 'YUWELL', origin: 'SHANGHAI', po_date: '2026-04-20', no_truck: 'B2', container: '1', truck_size: '2', arrival_time: '09:25', start_unloading: '09:25', end_unloading: '15:54', bl_no: '1', koli: 1, remarks: '', item_code: 10030432, uom: 'PCS', quantity: 100, location: 'STAGING', qa_status: 'A', rec_date: '2026-04-24', prod_date: '', exp_date: '', lot_number: 'LOT01', division: 'E-COMMERCE', carton_number: '', case_number: '', serial_number: '' },
        ];

        sampleRows.forEach((row) => worksheet.addRow(row));

        // Generate Excel file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Inbound_Upload_Template.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
    };

    // Handle upload
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

            const response = await api.post('/inbound/upload-excel', formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setUploadResult(response.data);
            setShowAlert(true);

            // Clear file if successful
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

    // Clear file
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
        <Layout title="Inbound" subTitle="Import Excel">
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">

                    {/* Button Back */}
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
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Upload Inbound from Excel
                        </h1>
                        <p className="text-gray-600">
                            Upload your inbound data using our Excel template
                        </p>
                    </div>

                    {/* Main Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {/* Upload Section */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    File Upload
                                </h2>
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

                            {/* Info Note */}
                            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex">
                                    <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <div className="text-sm text-blue-800">
                                        <p className="font-medium mb-1">Important Notes:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Download and use the provided template</li>
                                            <li>Fill in all required fields according to your inventory policy</li>
                                            <li>One Receipt ID = one Inbound. Rows with the same Receipt ID must have identical header info (Inbound Date, IB Type, Supplier, Trucker, Warehouse Code, Owner Code, Origin, etc.)</li>
                                            <li><span className="font-medium">Required fields:</span> Receipt ID, Inbound Date, IB Type, Supplier, Trucker, Warehouse Code, Owner Code, Origin, PO Date</li>
                                            <li><span className="font-medium">IB Type</span> must be exactly <code className="px-1 bg-blue-100 rounded">RETURN</code> or <code className="px-1 bg-blue-100 rounded">NORMAL</code> (case-sensitive)</li>
                                            <li>Carton Number, Case Number, and Serial Number are required only if enabled in the owner's inventory policy</li>
                                            <li>Date format: <code className="px-1 bg-blue-100 rounded">YYYY-MM-DD</code> (e.g. 2026-04-24)</li>
                                            <li>Time format (Arrival Time, Start/Finish Unloading): <code className="px-1 bg-blue-100 rounded">HH:mm</code> 24-hour, e.g. 09:25 — leave blank if not applicable</li>
                                            <li>Ensure no duplicate items with same attributes within the same Receipt ID</li>
                                            <li>Maximum file size: 10MB</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* File Input */}
                            <div
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${isDragging
                                    ? 'border-blue-500 bg-blue-100 scale-105'
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
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="cursor-pointer inline-flex flex-col items-center"
                                >
                                    <svg className={`w-12 h-12 mb-3 transition-all duration-200 ${isDragging
                                        ? 'text-blue-600 animate-bounce'
                                        : 'text-gray-400'
                                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span className={`text-sm font-medium mb-1 transition-colors ${isDragging
                                        ? 'text-blue-700'
                                        : 'text-gray-700'
                                        }`}>
                                        {isDragging ? '📂 Drop your file here!' : 'Click to upload or drag and drop'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        Excel files (.xlsx, .xls) up to 10MB
                                    </span>
                                </label>
                            </div>

                            {/* Selected File Info */}
                            {file && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={clearFile}
                                        className="text-red-600 hover:text-red-800 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {file && (
                                <div className="mt-4 flex gap-3">
                                    <button
                                        onClick={handleUpload}
                                        disabled={loading}
                                        className="flex-1 inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                                Upload File
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={clearFile}
                                        disabled={loading}
                                        className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Preview Section */}
                        {preview && (
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    Preview ({preview.rows.length} rows)
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    #
                                                </th>
                                                {preview.headers.map((header, index) => (
                                                    <th
                                                        key={index}
                                                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                                    >
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {preview.rows.map((row, rowIndex) => (
                                                <tr key={rowIndex} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2 text-sm text-gray-500">
                                                        {rowIndex + 1}
                                                    </td>
                                                    {row.map((cell, cellIndex) => (
                                                        <td
                                                            key={cellIndex}
                                                            className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap"
                                                        >
                                                            {cell || '-'}
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
                            <div className="p-6">
                                <div className={`rounded-lg p-4 ${uploadResult.success
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-red-50 border border-red-200'
                                    }`}>
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
                                            <h3 className={`text-sm font-medium ${uploadResult.success ? 'text-green-800' : 'text-red-800'
                                                }`}>
                                                {uploadResult.message}
                                            </h3>

                                            {uploadResult.success && (
                                                <div className="mt-2 text-sm text-green-700">
                                                    <p>Total Rows: {uploadResult.total_rows}</p>
                                                    <p>Success: {uploadResult.success_count}</p>
                                                    {uploadResult.inbound_numbers && uploadResult.inbound_numbers.length > 0 && (
                                                        <div className="mt-2">
                                                            <p className="font-medium">Generated Inbound Numbers:</p>
                                                            <ul className="list-disc list-inside ml-2">
                                                                {uploadResult.inbound_numbers.map((num, idx) => (
                                                                    <li key={idx}>{num}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {!uploadResult.success && (uploadResult.errors || uploadResult.validation_errors) && (
                                                <div className="mt-3 text-sm text-red-700">
                                                    {uploadResult.validation_errors && uploadResult.validation_errors.length > 0 && (
                                                        <div className="mb-3">
                                                            <p className="font-medium mb-2">Validation Errors:</p>
                                                            <div className="max-h-60 overflow-y-auto bg-white rounded p-2 border border-red-200">
                                                                {uploadResult.validation_errors.map((error, idx) => (
                                                                    <div key={idx} className="mb-2 pb-2 border-b border-red-100 last:border-b-0">
                                                                        <p><span className="font-medium">Row {error.row}:</span> {error.field}</p>
                                                                        <p className="text-xs">{error.message}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                                                        <div>
                                                            <p className="font-medium mb-2">Errors:</p>
                                                            <div className="max-h-60 overflow-y-auto bg-white rounded p-2 border border-red-200">
                                                                {uploadResult.errors.map((error, idx) => (
                                                                    <div key={idx} className="mb-2 pb-2 border-b border-red-100 last:border-b-0">
                                                                        <p><span className="font-medium">Row {error.row}:</span> {error.message}</p>
                                                                        <p className="text-xs">{error.detail}</p>
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
                                            className="ml-3 flex-shrink-0"
                                        >
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

export default InboundExcelUpload;