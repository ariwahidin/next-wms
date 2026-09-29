/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useRef, useState } from 'react';
import ExcelJS from 'exceljs';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import router from 'next/router';
import {
    ArrowLeft,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Info,
    Upload,
    FileSpreadsheet,
    Trash2,
    RefreshCw,
} from 'lucide-react';
import Layout from '@/components/layout';
import Select from 'react-select';

// ============================================================================
// Types
// ============================================================================

interface SelectOption {
    value: string;
    label: string;
}

interface FurunoPreviewRow {
    excelRow: number;
    doNumber: string;
    doDate: string;
    packingList: string;
    vesselRemarks: string;
    customerName: string;
    customerReference: string;
    modelPartNumber: string;
    itemCode: string;
    modelName: string;
    quantity: string;
    vendorSerial: string;
    fsgSerial: string;
    fsgSerialQuantity: string;
    remarksForDO: string;
}

interface ExcelPreviewData {
    headers: string[];
    rows: FurunoPreviewRow[];
    fileName: string;
    fileSize: string;
    totalDataRows: number;
    uniqueDONumbers: number;
    serialRows: number;
}

interface UploadError {
    row: number;
    message: string;
    detail?: string;
}

interface ValidationError {
    field: string;
    message: string;
    row: number;
}

interface UploadResponse {
    success: boolean;
    message: string;
    total_rows?: number;
    processed_rows?: number;
    skipped_rows?: number;
    success_count?: number;
    failed_count?: number;
    inbound_numbers?: string[];
    errors?: UploadError[];
    validation_errors?: ValidationError[];
}

// ============================================================================
// Constants
// ============================================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_PREVIEW_ROWS = 25;
const TARGET_SHEET_NAME = 'MonthlyDOIssuedDetailReportWit';

const REQUIRED_HEADERS = [
    'DO Number',
    'DO Date',
    'Packing List #',
    'Vessel Related Remarks',
    'Customer Name',
    'Cust. Ref No.',
    'Model/Part No',
    'Item code',
    'Model Name',
    'DO Quantity',
    'Vendor Serial Number',
    'FSG Serial Number',
    'FSG Serial Number Quantity',
    'Remarks For DO',
] as const;

const PREVIEW_HEADERS = [
    'DO Number',
    'DO Date',
    'Packing List #',
    'Customer',
    'Cust. Ref No.',
    'Item Code',
    'Model',
    'Qty',
    'Vendor Serial',
    'FSG Serial',
    'FSG Serial Qty',
    'Remarks',
] as const;

const DEFAULT_TYPE = 'NORMAL';
const DEFAULT_UOM = 'PCS';

// ============================================================================
// Helpers
// ============================================================================

const normalizeHeader = (value: unknown): string =>
    String(value ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const units = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${units[i]}`;
};

const excelSerialToDate = (serial: number): string => {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(epoch.getTime() + serial * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
};

const richValueToString = (value: any): string => {
    if (value === null || value === undefined) return '';

    if (value instanceof Date) {
        return value.toISOString().split('T')[0];
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value).trim();
    }

    if (typeof value === 'object') {
        if (Array.isArray(value.richText)) {
            return value.richText
                .map((part: any) => String(part?.text ?? ''))
                .join('')
                .trim();
        }

        if ('result' in value) {
            return richValueToString(value.result);
        }

        if ('text' in value) {
            return String(value.text ?? '').trim();
        }

        if ('hyperlink' in value) {
            return String(value.text ?? value.hyperlink ?? '').trim();
        }
    }

    return String(value).trim();
};

const getCellString = (row: ExcelJS.Row, columnNumber: number, headerName?: string): string => {
    if (!columnNumber) return '';

    const value = row.getCell(columnNumber).value as any;

    if (value instanceof Date) {
        return value.toISOString().split('T')[0];
    }

    if (
        typeof value === 'number' &&
        headerName &&
        normalizeHeader(headerName) === normalizeHeader('DO Date') &&
        value > 40000
    ) {
        return excelSerialToDate(value);
    }

    if (typeof value === 'object' && value !== null && 'result' in value) {
        const result = (value as any).result;
        if (
            typeof result === 'number' &&
            headerName &&
            normalizeHeader(headerName) === normalizeHeader('DO Date') &&
            result > 40000
        ) {
            return excelSerialToDate(result);
        }
    }

    return richValueToString(value);
};

const isValidExcel = (file: File): boolean =>
    file.name.toLowerCase().endsWith('.xlsx');

const isMeaningfulRow = (row: FurunoPreviewRow): boolean =>
    Boolean(
        row.doNumber ||
            row.itemCode ||
            row.modelName ||
            row.quantity ||
            row.fsgSerial ||
            row.vendorSerial
    );

const buildHeaderMap = (
    worksheet: ExcelJS.Worksheet
): { headerMap: Record<string, number>; headerRowNumber: number; actualHeaders: string[] } => {
    let best: {
        headerMap: Record<string, number>;
        headerRowNumber: number;
        actualHeaders: string[];
        matched: number;
    } = {
        headerMap: {},
        headerRowNumber: 1,
        actualHeaders: [],
        matched: 0,
    };

    for (let rowNumber = 1; rowNumber <= Math.min(10, worksheet.rowCount); rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const headerMap: Record<string, number> = {};
        const actualHeaders: string[] = [];

        row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
            const header = richValueToString(cell.value);
            if (!header) return;

            actualHeaders.push(header);
            const normalized = normalizeHeader(header);
            if (!headerMap[normalized]) {
                headerMap[normalized] = columnNumber;
            }
        });

        const matched = REQUIRED_HEADERS.reduce(
            (count, header) => count + (headerMap[normalizeHeader(header)] ? 1 : 0),
            0
        );

        if (matched > best.matched) {
            best = { headerMap, headerRowNumber: rowNumber, actualHeaders, matched };
        }
    }

    return best;
};

const getByHeader = (
    row: ExcelJS.Row,
    headerMap: Record<string, number>,
    header: string
): string => getCellString(row, headerMap[normalizeHeader(header)] || 0, header);

const parseFurunoPreview = async (file: File): Promise<ExcelPreviewData> => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());

    const worksheet = workbook.worksheets.find(
        (ws) => normalizeHeader(ws.name) === normalizeHeader(TARGET_SHEET_NAME)
    );

    if (!worksheet) {
        const availableSheets = workbook.worksheets.map((ws) => ws.name).join(', ');
        throw new Error(
            `Required worksheet "${TARGET_SHEET_NAME}" was not found. Available worksheets: ${availableSheets || 'None'}`
        );
    }

    const { headerMap, headerRowNumber, actualHeaders } = buildHeaderMap(worksheet);

    const missingHeaders = REQUIRED_HEADERS.filter(
        (header) => !headerMap[normalizeHeader(header)]
    );

    if (missingHeaders.length > 0) {
        throw new Error(
            `Invalid Furuno inbound template. Missing required headers: ${missingHeaders.join(', ')}. Detected headers: ${actualHeaders.join(', ')}`
        );
    }

    const previewRows: FurunoPreviewRow[] = [];
    const doNumbers = new Set<string>();
    let totalDataRows = 0;
    let serialRows = 0;

    for (let rowNumber = headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        const previewRow: FurunoPreviewRow = {
            excelRow: rowNumber,
            doNumber: getByHeader(row, headerMap, 'DO Number'),
            doDate: getByHeader(row, headerMap, 'DO Date'),
            packingList: getByHeader(row, headerMap, 'Packing List #'),
            vesselRemarks: getByHeader(row, headerMap, 'Vessel Related Remarks'),
            customerName: getByHeader(row, headerMap, 'Customer Name'),
            customerReference: getByHeader(row, headerMap, 'Cust. Ref No.'),
            modelPartNumber: getByHeader(row, headerMap, 'Model/Part No'),
            itemCode: getByHeader(row, headerMap, 'Item code'),
            modelName: getByHeader(row, headerMap, 'Model Name'),
            quantity: getByHeader(row, headerMap, 'DO Quantity'),
            vendorSerial: getByHeader(row, headerMap, 'Vendor Serial Number'),
            fsgSerial: getByHeader(row, headerMap, 'FSG Serial Number'),
            fsgSerialQuantity: getByHeader(row, headerMap, 'FSG Serial Number Quantity'),
            remarksForDO: getByHeader(row, headerMap, 'Remarks For DO'),
        };

        if (!isMeaningfulRow(previewRow)) continue;

        totalDataRows++;
        if (previewRow.doNumber) doNumbers.add(previewRow.doNumber);
        if (previewRow.fsgSerial || previewRow.vendorSerial) serialRows++;

        if (previewRows.length < MAX_PREVIEW_ROWS) {
            previewRows.push(previewRow);
        }
    }

    return {
        headers: [...PREVIEW_HEADERS],
        rows: previewRows,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        totalDataRows,
        uniqueDONumbers: doNumbers.size,
        serialRows,
    };
};

// ============================================================================
// Component
// ============================================================================

const ImportInboundFuruno: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<ExcelPreviewData | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const [ownerOptions, setOwnerOptions] = useState<SelectOption[]>([]);
    const [whsOptions, setWhsOptions] = useState<SelectOption[]>([]);
    const [supplierOptions, setSupplierOptions] = useState<SelectOption[]>([]);
    const [originOptions, setOriginOptions] = useState<SelectOption[]>([]);
    const [uomOptions, setUomOptions] = useState<SelectOption[]>([]);
    const [locationOptions, setLocationOptions] = useState<SelectOption[]>([]);
    const [qaStatusOptions, setQaStatusOptions] = useState<SelectOption[]>([]);
    const [supplierMasterRows, setSupplierMasterRows] = useState<any[]>([]);
    const [locationMasterRows, setLocationMasterRows] = useState<any[]>([]);
    const [masterLoading, setMasterLoading] = useState(false);
    const [masterError, setMasterError] = useState('');

    const [selectedOwner, setSelectedOwner] = useState('');
    const [selectedWhs, setSelectedWhs] = useState('');
    const [supplierCode, setSupplierCode] = useState('');
    const [origin, setOrigin] = useState('');
    const [type, setType] = useState(DEFAULT_TYPE);
    const [uom, setUom] = useState(DEFAULT_UOM);
    const [location, setLocation] = useState('');
    const [qaStatus, setQaStatus] = useState('');
    const [division, setDivision] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const alertRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchMasterData();
    }, []);

    const toOption = (
        value: unknown,
        label?: unknown,
    ): SelectOption | null => {
        const normalizedValue = String(value ?? '').trim();
        if (!normalizedValue) return null;

        const normalizedLabel = String(label ?? normalizedValue).trim();
        return {
            value: normalizedValue,
            label: normalizedLabel || normalizedValue,
        };
    };

    const extractArray = (responseData: any): any[] => {
        if (Array.isArray(responseData)) return responseData;
        if (Array.isArray(responseData?.data)) return responseData.data;
        if (Array.isArray(responseData?.data?.data)) return responseData.data.data;
        return [];
    };

    const fetchMasterData = async () => {
        setMasterLoading(true);
        setMasterError('');

        try {
            const [ownersRes, warehousesRes, suppliersRes, originsRes, uomsRes, locationsRes, qaRes] =
                await Promise.all([
                    api.get('/owners'),
                    api.get('/warehouses'),
                    api.get('/suppliers'),
                    api.get('/origins'),
                    api.get('/uoms'),
                    api.get('/locations'),
                    api.get('/qa-status'),
                ]);

            const owners = extractArray(ownersRes.data);
            const warehouses = extractArray(warehousesRes.data);
            const suppliers = extractArray(suppliersRes.data);
            setSupplierMasterRows(suppliers);
            const origins = extractArray(originsRes.data);
            const uoms = extractArray(uomsRes.data);
            const locations = extractArray(locationsRes.data);
            setLocationMasterRows(locations);
            const qaStatuses = extractArray(qaRes.data);

            setOwnerOptions(
                owners
                    .map((item: any) =>
                        toOption(
                            item.code ?? item.owner_code,
                            item.name || item.owner_name || item.description
                                ? `${item.code ?? item.owner_code} - ${item.name ?? item.owner_name ?? item.description}`
                                : item.code ?? item.owner_code,
                        ),
                    )
                    .filter(Boolean) as SelectOption[],
            );

            setWhsOptions(
                warehouses
                    .map((item: any) =>
                        toOption(
                            item.code ?? item.whs_code,
                            item.name || item.warehouse_name || item.description
                                ? `${item.code ?? item.whs_code} - ${item.name ?? item.warehouse_name ?? item.description}`
                                : item.code ?? item.whs_code,
                        ),
                    )
                    .filter(Boolean) as SelectOption[],
            );

            setSupplierOptions(
                suppliers
                    .map((item: any) =>
                        toOption(
                            item.supplier_code ?? item.code,
                            item.supplier_name
                                ? `${item.supplier_code ?? item.code} - ${item.supplier_name}`
                                : item.supplier_code ?? item.code,
                        ),
                    )
                    .filter(Boolean) as SelectOption[],
            );

            setOriginOptions(
                origins
                    .map((item: any) =>
                        toOption(
                            item.country ?? item.origin ?? item.code,
                            item.country ?? item.origin ?? item.name ?? item.description,
                        ),
                    )
                    .filter(Boolean) as SelectOption[],
            );

            setUomOptions(
                uoms
                    .map((item: any) =>
                        toOption(
                            item.uom ?? item.uom_code ?? item.code,
                            item.uom_name || item.name || item.description
                                ? `${item.uom ?? item.uom_code ?? item.code} - ${item.uom_name ?? item.name ?? item.description}`
                                : item.uom ?? item.uom_code ?? item.code,
                        ),
                    )
                    .filter(Boolean) as SelectOption[],
            );

            const masterUomOptions = uoms
                .map((item: any) =>
                    toOption(
                        item.uom ?? item.uom_code ?? item.code,
                        item.uom_name || item.name || item.description
                            ? `${item.uom ?? item.uom_code ?? item.code} - ${item.uom_name ?? item.name ?? item.description}`
                            : item.uom ?? item.uom_code ?? item.code,
                    ),
                )
                .filter(Boolean) as SelectOption[];

            if (masterUomOptions.some((option) => option.value === DEFAULT_UOM)) {
                setUom(DEFAULT_UOM);
            } else {
                setUom('');
            }

            setLocationOptions(
                locations
                    .map((item: any) =>
                        toOption(
                            item.location_code ?? item.code,
                            item.location_code ?? item.code,
                        ),
                    )
                    .filter(Boolean) as SelectOption[],
            );

            setQaStatusOptions(
                qaStatuses
                    .map((item: any) =>
                        toOption(
                            item.qa_status ?? item.code,
                            item.description
                                ? `${item.qa_status ?? item.code} - ${item.description}`
                                : item.qa_status ?? item.code,
                        ),
                    )
                    .filter(Boolean) as SelectOption[],
            );
        } catch (error: any) {
            console.error('Failed to fetch inbound Furuno master data:', error);
            setMasterError(
                error?.response?.data?.message ||
                    error?.response?.data?.error ||
                    'Failed to load master data. Please refresh the page and try again.',
            );
        } finally {
            setMasterLoading(false);
        }
    };

    const filteredSupplierOptions = supplierOptions.filter((option) => {
        if (!selectedOwner) return true;
        const item = supplierMasterRows.find(
            (supplier: any) =>
                String(supplier?.supplier_code ?? supplier?.code ?? '').trim() === option.value,
        );
        if (!item?.owner_code) return true;
        return String(item.owner_code).trim() === selectedOwner;
    });

    const filteredLocationOptions = locationOptions.filter((option) => {
        const item = locationMasterRows.find(
            (locationItem: any) =>
                String(locationItem?.location_code ?? locationItem?.code ?? '').trim() === option.value,
        );
        if (!item) return true;

        const ownerMatches = !selectedOwner || String(item.owner_code ?? '').trim() === selectedOwner;
        const warehouseMatches = !selectedWhs || String(item.whs_code ?? '').trim() === selectedWhs;
        return ownerMatches && warehouseMatches;
    });

    const clearFile = () => {
        setFile(null);
        setPreview(null);
        setUploadResult(null);
        setShowAlert(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const validateFile = (selectedFile: File): boolean => {
        if (!isValidExcel(selectedFile)) {
            alert('Invalid file format. Only .xlsx Excel files are supported.');
            return false;
        }

        if (selectedFile.size === 0) {
            alert('The selected file is empty.');
            return false;
        }

        if (selectedFile.size > MAX_FILE_SIZE) {
            alert(`File size exceeds the 10 MB limit. Current size: ${formatFileSize(selectedFile.size)}.`);
            return false;
        }

        return true;
    };

    const generatePreview = async (selectedFile: File) => {
        try {
            const data = await parseFurunoPreview(selectedFile);
            setPreview(data);
        } catch (error: any) {
            console.error('Failed to preview Furuno inbound Excel:', error);
            alert(error?.message || 'Failed to preview the Excel file.');
            clearFile();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;
        if (!validateFile(selected)) {
            e.target.value = '';
            return;
        }

        setFile(selected);
        setPreview(null);
        setUploadResult(null);
        setShowAlert(false);
        await generatePreview(selected);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const dropped = e.dataTransfer.files[0];
        if (!dropped) return;
        if (!validateFile(dropped)) return;

        setFile(dropped);
        setPreview(null);
        setUploadResult(null);
        setShowAlert(false);
        await generatePreview(dropped);
    };

    const handleUpload = async () => {
        if (!file) {
            alert('Please select an Excel file before uploading.');
            return;
        }

        if (!preview) {
            alert('Please wait until the file preview is ready.');
            return;
        }

        if (!selectedOwner) {
            alert('Please select an Owner before uploading.');
            return;
        }

        if (!selectedWhs) {
            alert('Please select a Warehouse before uploading.');
            return;
        }

        if (!supplierCode.trim()) {
            alert('Please select Supplier Code before uploading.');
            return;
        }

        if (!origin.trim()) {
            alert('Please select Origin before uploading.');
            return;
        }

        setLoading(true);
        setUploadResult(null);
        setShowAlert(false);

        try {
            const formData = new FormData();

            formData.append('file', file);
            formData.append('owner_code', selectedOwner);
            formData.append('whs_code', selectedWhs);
            formData.append('supplier_code', supplierCode.trim());
            formData.append('origin', origin.trim());
            formData.append('type', type);
            formData.append('uom', uom.trim());
            formData.append('location', location.trim());
            formData.append('qa_status', qaStatus.trim());
            formData.append('division', division.trim());

            const res = await api.post('/inbound/upload-furuno-excel', formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setUploadResult(res.data);
            setShowAlert(true);
        } catch (error: any) {
            console.error('Furuno inbound upload error:', error);

            const errorData = error.response?.data;

            setUploadResult(
                errorData || {
                    success: false,
                    message: 'Upload failed. Please try again.',
                    errors: [
                        {
                            row: 0,
                            message: 'Network Error',
                            detail: error.message,
                        },
                    ],
                }
            );

            setShowAlert(true);
        } finally {
            setLoading(false);
            setTimeout(() => {
                alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    };

    return (
        <Layout title="Inbound" subTitle="Import Furuno Excel">
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-4">
                        <Button
                            variant="ghost"
                            className="h-9 px-4 text-white bg-black hover:bg-slate-700"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {/* STEP 1 */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-2 mb-5">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
                                <h2 className="text-lg font-semibold text-gray-900">Import Configuration</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner *</label>
                                    <Select
                                        placeholder="Select Owner..."
                                        options={ownerOptions}
                                        value={ownerOptions.find((option) => option.value === selectedOwner) || null}
                                        onChange={(option) => {
                                            const value = option?.value || '';
                                            setSelectedOwner(value);
                                            setSupplierCode('');
                                            setLocation('');
                                        }}
                                        isDisabled={loading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse *</label>
                                    <Select
                                        placeholder="Select Warehouse..."
                                        options={whsOptions}
                                        value={whsOptions.find((option) => option.value === selectedWhs) || null}
                                        onChange={(option) => {
                                            const value = option?.value || '';
                                            setSelectedWhs(value);
                                            setLocation('');
                                        }}
                                        isDisabled={loading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Code *</label>
                                    <Select
                                        placeholder={masterLoading ? 'Loading Supplier...' : 'Select Supplier...'}
                                        options={filteredSupplierOptions}
                                        value={supplierCode
                                            ? filteredSupplierOptions.find((option) => option.value === supplierCode) || null
                                            : null}
                                        onChange={(option) => setSupplierCode(option?.value || '')}
                                        isDisabled={loading || masterLoading || !selectedOwner}
                                        isLoading={masterLoading}
                                        noOptionsMessage={() => selectedOwner ? 'No supplier found for selected owner' : 'Select Owner first'}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Origin *</label>
                                    <Select
                                        placeholder={masterLoading ? 'Loading Origin...' : 'Select Origin...'}
                                        options={originOptions}
                                        value={originOptions.find((option) => option.value === origin) || null}
                                        onChange={(option) => setOrigin(option?.value || '')}
                                        isDisabled={loading || masterLoading}
                                        isLoading={masterLoading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Inbound Type</label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        disabled={loading}
                                        className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="NORMAL">NORMAL</option>
                                        <option value="RETURN">RETURN</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Default UOM</label>
                                    <Select
                                        placeholder={masterLoading ? 'Loading UOM...' : 'Select UOM...'}
                                        options={uomOptions}
                                        value={uomOptions.find((option) => option.value === uom) || null}
                                        onChange={(option) => setUom(option?.value || '')}
                                        isDisabled={loading || masterLoading}
                                        isLoading={masterLoading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Location</label>
                                    <Select
                                        placeholder={masterLoading ? 'Loading Location...' : 'Optional - Select Location...'}
                                        options={filteredLocationOptions}
                                        value={location
                                            ? filteredLocationOptions.find((option) => option.value === location) || null
                                            : null}
                                        onChange={(option) => setLocation(option?.value || '')}
                                        isDisabled={loading || masterLoading || !selectedOwner || !selectedWhs}
                                        isClearable
                                        isLoading={masterLoading}
                                        noOptionsMessage={() => 'No location found for selected owner/warehouse'}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">QA Status</label>
                                    <Select
                                        placeholder={masterLoading ? 'Loading QA Status...' : 'Optional - Select QA Status...'}
                                        options={qaStatusOptions}
                                        value={qaStatus
                                            ? qaStatusOptions.find((option) => option.value === qaStatus) || null
                                            : null}
                                        onChange={(option) => setQaStatus(option?.value || '')}
                                        isDisabled={loading || masterLoading}
                                        isClearable
                                        isLoading={masterLoading}
                                    />
                                </div>

                                <div className="lg:col-span-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
                                    <input
                                        value={division}
                                        onChange={(e) => setDivision(e.target.value)}
                                        disabled={loading}
                                        placeholder="Optional"
                                        className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {masterError && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                        <span>{masterError}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={fetchMasterData}
                                        disabled={masterLoading}
                                        className="text-xs font-medium px-3 py-1.5 rounded-md border border-red-300 hover:bg-red-100 disabled:opacity-50"
                                    >
                                        Reload Master
                                    </button>
                                </div>
                            )}

                            <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex gap-3">
                                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-blue-800">
                                        <p className="font-semibold mb-2">Furuno Inbound Excel Import Rules</p>
                                        <ul className="list-disc list-inside space-y-1 text-xs">
                                            <li>Required worksheet: <strong>{TARGET_SHEET_NAME}</strong></li>
                                            <li>Headers are detected automatically by name, not by fixed position.</li>
                                            <li>Header rich text and blank spacer columns are supported.</li>
                                            <li>Packing List # is used as Receipt ID / transaction grouping key. DO Number is informational only and is kept in remarks.</li>
                                            <li>FSG Serial Number is imported as the primary serial number. Vendor Serial Number is used as fallback when FSG Serial Number is empty.</li>
                                            <li>Configuration fields such as Owner, Warehouse, Supplier, Origin, UOM, Location, and QA Status are selected from master data.</li>
                                            <li>DO Date supports Excel dates and standard date strings including DD-MM-YY.</li>
                                            <li>Maximum file size: <strong>10 MB</strong></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* STEP 2 */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-2 mb-5">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
                                <h2 className="text-lg font-semibold text-gray-900">Upload Excel File</h2>
                            </div>

                            <div
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                                    isDragging
                                        ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                                        : 'border-gray-300 hover:border-blue-400'
                                }`}
                                onDragEnter={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDragLeave={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                }}
                                onDrop={handleDrop}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="furuno-inbound-file-upload"
                                />

                                <label htmlFor="furuno-inbound-file-upload" className="cursor-pointer inline-flex flex-col items-center">
                                    <Upload className={`w-12 h-12 mb-3 ${isDragging ? 'text-blue-600 animate-bounce' : 'text-gray-400'}`} />
                                    <span className="text-sm font-medium mb-1 text-gray-700">
                                        {isDragging ? 'Drop the Excel file here' : 'Click to upload or drag & drop'}
                                    </span>
                                    <span className="text-xs text-gray-500">Furuno inbound workbook (.xlsx) — maximum 10 MB</span>
                                </label>
                            </div>

                            {file && (
                                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <FileSpreadsheet className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>{file.name}</p>
                                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={clearFile}
                                        disabled={loading}
                                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
                                        title="Remove file"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            {file && (
                                <div className="mt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handleUpload}
                                        disabled={
                                            loading ||
                                            masterLoading ||
                                            !preview ||
                                            !selectedOwner ||
                                            !selectedWhs ||
                                            !supplierCode.trim() ||
                                            !origin.trim()
                                        }
                                        className="flex-1 h-10 inline-flex items-center justify-center gap-2 px-6 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loading ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4" />
                                                Upload & Create Inbound
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={clearFile}
                                        disabled={loading}
                                        className="px-6 h-10 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}

                            {file && (!selectedOwner || !selectedWhs || !supplierCode.trim() || !origin.trim()) && (
                                <div className="mt-3 flex items-center gap-2 text-xs text-amber-600">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Complete Owner, Warehouse, Supplier, and Origin before uploading.</span>
                                </div>
                            )}
                        </div>

                        {/* STEP 3 */}
                        {preview && (
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">3</span>
                                        <h2 className="text-lg font-semibold text-gray-900">File Preview</h2>
                                        <span className="text-sm text-gray-500">
                                            ({preview.rows.length} of {preview.totalDataRows} rows shown)
                                        </span>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-md bg-purple-50 border border-purple-200 text-xs font-medium text-purple-700">
                                        Furuno Template
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-blue-700">{preview.totalDataRows}</p>
                                        <p className="text-xs text-blue-600">Total Rows</p>
                                    </div>
                                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-purple-700">{preview.uniqueDONumbers}</p>
                                        <p className="text-xs text-purple-600">Unique DOs</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-green-700">{preview.serialRows}</p>
                                        <p className="text-xs text-green-600">Serial Rows</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                        <p className="text-lg font-bold text-gray-700">{preview.fileSize}</p>
                                        <p className="text-xs text-gray-500">File Size</p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                                {preview.headers.map((header, index) => (
                                                    <th key={`${header}-${index}`} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {preview.rows.map((row, index) => (
                                                <tr key={`${row.excelRow}-${index}`} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2 text-sm text-gray-400">{row.excelRow}</td>
                                                    <td className="px-3 py-2 text-sm font-mono font-semibold text-purple-700 whitespace-nowrap">{row.doNumber || '—'}</td>
                                                    <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{row.doDate || '—'}</td>
                                                    <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{row.packingList || '—'}</td>
                                                    <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">{row.customerName || '—'}</td>
                                                    <td className="px-3 py-2 text-sm text-gray-700 max-w-xs"><div className="truncate" title={row.customerReference}>{row.customerReference || '—'}</div></td>
                                                    <td className="px-3 py-2 text-sm font-mono font-semibold text-blue-700 whitespace-nowrap">{row.itemCode || '—'}</td>
                                                    <td className="px-3 py-2 text-sm text-gray-700 max-w-xs"><div className="truncate" title={row.modelName}>{row.modelName || '—'}</div></td>
                                                    <td className="px-3 py-2 text-sm text-right font-semibold text-gray-900 whitespace-nowrap">{row.quantity || '—'}</td>
                                                    <td className="px-3 py-2 text-sm font-mono text-slate-600 whitespace-nowrap">{row.vendorSerial || '—'}</td>
                                                    <td className="px-3 py-2 text-sm font-mono font-medium text-indigo-700 whitespace-nowrap">{row.fsgSerial || '—'}</td>
                                                    <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{row.fsgSerialQuantity || '—'}</td>
                                                    <td className="px-3 py-2 text-sm text-gray-700 max-w-xs"><div className="truncate" title={row.remarksForDO}>{row.remarksForDO || '—'}</div></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {preview.rows.length === MAX_PREVIEW_ROWS && preview.totalDataRows > MAX_PREVIEW_ROWS && (
                                    <p className="mt-2 text-xs text-gray-400">
                                        Only the first {MAX_PREVIEW_ROWS} rows are displayed. The complete file will be processed by the backend.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* STEP 4 */}
                        {showAlert && uploadResult && (
                            <div ref={alertRef} className="p-6">
                                <div className={`rounded-lg p-4 ${uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                    <div className="flex">
                                        <div className="flex-shrink-0 mt-0.5">
                                            {uploadResult.success ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-600" />
                                            )}
                                        </div>

                                        <div className="ml-3 flex-1 min-w-0">
                                            <h3 className={`text-sm font-semibold ${uploadResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                                {uploadResult.message}
                                            </h3>

                                            {uploadResult.success ? (
                                                <div className="mt-3 space-y-4 text-sm text-green-700">
                                                    <div className="flex flex-wrap gap-6">
                                                        {uploadResult.total_rows !== undefined && (
                                                            <p>Total Rows: <strong>{uploadResult.total_rows}</strong></p>
                                                        )}
                                                        {uploadResult.processed_rows !== undefined && (
                                                            <p>Processed Rows: <strong>{uploadResult.processed_rows}</strong></p>
                                                        )}
                                                        {uploadResult.success_count !== undefined && (
                                                            <p>Success Count: <strong>{uploadResult.success_count}</strong></p>
                                                        )}
                                                        {uploadResult.skipped_rows !== undefined && uploadResult.skipped_rows > 0 && (
                                                            <p>Skipped Rows: <strong>{uploadResult.skipped_rows}</strong></p>
                                                        )}
                                                    </div>

                                                    {uploadResult.inbound_numbers && uploadResult.inbound_numbers.length > 0 && (
                                                        <div>
                                                            <p className="font-medium mb-2">Created Inbound Numbers:</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {uploadResult.inbound_numbers.map((number, index) => (
                                                                    <span key={`${number}-${index}`} className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-mono font-medium">
                                                                        {number}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="pt-3 border-t border-green-200">
                                                        <button
                                                            type="button"
                                                            onClick={() => router.push('/wms/inbound/data')}
                                                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                                                        >
                                                            <FileSpreadsheet className="w-4 h-4" />
                                                            View Inbound Data
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mt-3 text-sm text-red-700 space-y-4">
                                                    {uploadResult.validation_errors && uploadResult.validation_errors.length > 0 && (
                                                        <div>
                                                            <p className="font-medium mb-2">Validation Errors ({uploadResult.validation_errors.length})</p>
                                                            <div className="max-h-72 overflow-y-auto bg-white rounded p-2 border border-red-200 space-y-2">
                                                                {uploadResult.validation_errors.map((validation, index) => (
                                                                    <div key={index} className="pb-2 border-b border-red-100 last:border-b-0">
                                                                        <p>
                                                                            <span className="font-medium">Row {validation.row}</span>
                                                                            <span className="mx-1 text-red-400">·</span>
                                                                            <span className="font-medium">{validation.field}</span>
                                                                        </p>
                                                                        <p className="text-xs text-red-600 mt-0.5">{validation.message}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                                                        <div>
                                                            <p className="font-medium mb-2">Processing Errors ({uploadResult.errors.length})</p>
                                                            <div className="max-h-60 overflow-y-auto bg-white rounded p-2 border border-red-200 space-y-2">
                                                                {uploadResult.errors.map((error, index) => (
                                                                    <div key={index} className="pb-2 border-b border-red-100 last:border-b-0">
                                                                        <p className="font-medium">Row {error.row}: {error.message}</p>
                                                                        {error.detail && <p className="text-xs text-red-500 mt-0.5">{error.detail}</p>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowAlert(false)}
                                            className="ml-3 flex-shrink-0"
                                            title="Close"
                                        >
                                            <XCircle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
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

export default ImportInboundFuruno;
