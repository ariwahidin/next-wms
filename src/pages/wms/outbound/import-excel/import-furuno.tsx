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

type FurunoTemplate =
    | 'STANDARD'
    | 'CUSTOMER_NO_LAYOUT';

interface FurunoPreviewRow {
    excelRow: number;
    code: string;
    itemName: string;
    quantity: string;
    unit: string;
    number: string;
    date: string;
    customerNo: string;
    customer: string;
    serialNumber: string;
    warehouse: string;
    eligible: boolean;
}

interface ExcelPreviewData {
    headers: string[];
    rows: FurunoPreviewRow[];

    fileName: string;
    fileSize: string;

    totalDataRows: number;
    yusenRows: number;
    skippedRows: number;
    uniqueDONumbers: number;

    template: FurunoTemplate;
    customerNoAvailable: boolean;
}

interface SkippedOrder {
    order_number?: string;
    reason: string;
}

interface UnknownCustomer {
    outbound_no: string;
    memo_po: string;
    customer_name: string;
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
    success_count?: number;
    failed_count?: number;

    outbound_numbers?: string[];

    skipped_orders?: SkippedOrder[];

    unknown_customers?: UnknownCustomer[];

    errors?: UploadError[];

    validation_errors?: ValidationError[];
}

// ============================================================================
// Constants
// ============================================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_PREVIEW_ROWS = 20;

const TARGET_SHEET_NAME = 'Delivery Order Detail';

const TARGET_WAREHOUSE = 'Yusen WH';

const REQUIRED_HEADERS = [
    'Code#',
    'Item Name',
    'Quantity',
    'Unit',
    'Number',
    'Date',
    'Customer',
    'Serial/Production Number',
    'Name Warehouse',
] as const;

/**
 * Customer No is optional.
 *
 * Furuno has two known variants:
 *
 * Template 1:
 *   Customer No
 *
 * Template 2:
 *   Customer No Customer Delivery Order
 *
 * Both are treated as the same logical field.
 */
const CUSTOMER_NO_ALIASES = [
    'Customer No',
    'Customer No Customer Delivery Order',
] as const;

const PREVIEW_HEADERS = [
    'Code#',
    'Item Name',
    'Qty',
    'Unit',
    'DO Number',
    'Date',
    'Customer No',
    'Customer',
    'Serial / Production Number',
    'Warehouse',
] as const;

// ============================================================================
// Utility Helpers
// ============================================================================

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {
        return '0 Bytes';
    }

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return (
        Math.round((bytes / Math.pow(k, i)) * 100) / 100 +
        ' ' +
        sizes[i]
    );
};

const isValidExcel = (file: File): boolean => {
    return file.name.toLowerCase().endsWith('.xlsx');
};

const excelSerialToDate = (serial: number): string => {
    const epoch = new Date(Date.UTC(1899, 11, 30));

    const milliseconds =
        serial * 24 * 60 * 60 * 1000;

    const date = new Date(
        epoch.getTime() + milliseconds
    );

    return date.toISOString().split('T')[0];
};

const normalizeHeader = (value: unknown): string => {
    return String(value ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
};

/**
 * Converts Excel cell values into safe strings.
 *
 * Handles:
 * - string
 * - number
 * - Date
 * - formula result
 * - rich text
 * - hyperlinks
 */
const getCellString = (
    row: ExcelJS.Row,
    columnNumber: number,
    headerName?: string
): string => {
    if (!columnNumber) {
        return '';
    }

    const cell = row.getCell(columnNumber);

    const value = cell.value;

    if (
        value === null ||
        value === undefined
    ) {
        return '';
    }

    // Date object
    if (value instanceof Date) {
        return value
            .toISOString()
            .split('T')[0];
    }

    // Excel formula / rich object
    if (
        typeof value === 'object' &&
        value !== null
    ) {
        if ('result' in value) {
            const result = (value as any).result;

            if (
                typeof result === 'number' &&
                headerName &&
                normalizeHeader(headerName) ===
                    normalizeHeader('Date')
            ) {
                return excelSerialToDate(result);
            }

            return String(
                result ?? ''
            ).trim();
        }

        if ('richText' in value) {
            const richText = (value as any).richText;
            if (Array.isArray(richText)) {
                return richText
                    .map((item: any) => String(item?.text ?? ''))
                    .join('')
                    .trim();
            }
        }

        if ('text' in value) {
            return String(
                (value as any).text ?? ''
            ).trim();
        }

        if ('hyperlink' in value) {
            return String(
                (value as any).text ??
                    (value as any).hyperlink ??
                    ''
            ).trim();
        }
    }

    // Excel serial date
    if (
        typeof value === 'number' &&
        headerName &&
        normalizeHeader(headerName) ===
            normalizeHeader('Date') &&
        value > 40000
    ) {
        return excelSerialToDate(value);
    }

    return String(value).trim();
};

/**
 * Read a cell using the normalized header map.
 */
const getCellByHeader = (
    row: ExcelJS.Row,
    headerMap: Record<string, number>,
    headerName: string
): string => {
    const columnNumber =
        headerMap[
            normalizeHeader(headerName)
        ];

    if (!columnNumber) {
        return '';
    }

    return getCellString(
        row,
        columnNumber,
        headerName
    );
};

/**
 * Read the raw ExcelJS value from a header-mapped cell.
 *
 * This is used when rebuilding the workbook for upload so dates/numbers keep
 * their original Excel value types instead of being converted to strings.
 */
const getRawCellByHeader = (
    row: ExcelJS.Row,
    headerMap: Record<string, number>,
    headerName: string
): ExcelJS.CellValue => {
    const columnNumber =
        headerMap[
            normalizeHeader(headerName)
        ];

    if (!columnNumber) {
        return '';
    }

    return row.getCell(columnNumber).value ?? '';
};

/**
 * Find first available header from aliases.
 */
const getCellByHeaderAliases = (
    row: ExcelJS.Row,
    headerMap: Record<string, number>,
    aliases: readonly string[]
): {
    value: string;
    matchedHeader: string | null;
} => {
    for (const alias of aliases) {
        const columnNumber =
            headerMap[
                normalizeHeader(alias)
            ];

        if (columnNumber) {
            return {
                value: getCellString(
                    row,
                    columnNumber,
                    alias
                ),
                matchedHeader: alias,
            };
        }
    }

    return {
        value: '',
        matchedHeader: null,
    };
};

/**
 * Build header map from row 1.
 */
const buildHeaderMap = (
    worksheet: ExcelJS.Worksheet
): {
    headerMap: Record<string, number>;
    actualHeaders: string[];
    headerRowNumber: number;
} => {
    let bestHeaderMap: Record<string, number> = {};
    let bestActualHeaders: string[] = [];
    let bestHeaderRowNumber = 1;
    let bestScore = -1;

    const knownHeaders = [
        ...REQUIRED_HEADERS,
        ...CUSTOMER_NO_ALIASES,
    ];

    // Furuno templates may contain blank/spacer columns and, in some
    // exports, the actual header can start on a later row. Scan the
    // first few rows and select the row containing the most known headers.
    const maxHeaderScanRows = Math.min(worksheet.rowCount, 10);

    for (let rowNumber = 1; rowNumber <= maxHeaderScanRows; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const candidateMap: Record<string, number> = {};
        const candidateHeaders: string[] = [];

        row.eachCell(
            { includeEmpty: true },
            (cell, columnNumber) => {
                const header = getCellString(
                    row,
                    columnNumber
                );

                if (!header) {
                    return;
                }

                candidateHeaders.push(header);

                const normalized = normalizeHeader(header);

                if (!candidateMap[normalized]) {
                    candidateMap[normalized] = columnNumber;
                }
            }
        );

        const score = knownHeaders.reduce(
            (total, header) =>
                total +
                (candidateMap[normalizeHeader(header)] ? 1 : 0),
            0
        );

        if (score > bestScore) {
            bestScore = score;
            bestHeaderMap = candidateMap;
            bestActualHeaders = candidateHeaders;
            bestHeaderRowNumber = rowNumber;
        }
    }

    return {
        headerMap: bestHeaderMap,
        actualHeaders: bestActualHeaders,
        headerRowNumber: bestHeaderRowNumber,
    };
};

/**
 * Detect which Furuno template is being used.
 *
 * Template 2 is identified by:
 *   Customer No Customer Delivery Order
 *
 * Template 1:
 *   Standard layout
 *   Optional Customer No
 */
const detectTemplate = (
    headerMap: Record<string, number>
): {
    template: FurunoTemplate;
    customerNoAvailable: boolean;
} => {
    const customerNoDeliveryOrder =
        headerMap[
            normalizeHeader(
                'Customer No Customer Delivery Order'
            )
        ];

    const customerNo =
        headerMap[
            normalizeHeader('Customer No')
        ];

    if (
        customerNoDeliveryOrder
    ) {
        return {
            template:
                'CUSTOMER_NO_LAYOUT',
            customerNoAvailable: true,
        };
    }

    if (customerNo) {
        return {
            template: 'STANDARD',
            customerNoAvailable: true,
        };
    }

    return {
        template: 'STANDARD',
        customerNoAvailable: false,
    };
};

/**
 * Check if row contains meaningful data.
 */
const isMeaningfulRow = (
    row: FurunoPreviewRow
): boolean => {
    return Boolean(
        row.code ||
            row.itemName ||
            row.quantity ||
            row.number ||
            row.customerNo ||
            row.customer ||
            row.serialNumber ||
            row.warehouse
    );
};

/**
 * Format template label for UI.
 */
const getTemplateLabel = (
    template: FurunoTemplate
): string => {
    switch (template) {
        case 'CUSTOMER_NO_LAYOUT':
            return 'Furuno Template 2';

        case 'STANDARD':
        default:
            return 'Furuno Template 1';
    }
};

/**
 * Normalize the Furuno workbook before upload.
 *
 * Some Furuno files intentionally contain spacer columns, for example:
 *   A blank | B Code# | C blank | D Item Name | E blank | F Quantity ...
 *
 * The browser preview can read those columns correctly, but the backend may
 * expect the fields to start from column A. We therefore create a compact
 * workbook for upload while keeping the original file untouched.
 */
const normalizeFurunoWorkbookForUpload = async (
    sourceFile: File
): Promise<File> => {
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(
        await sourceFile.arrayBuffer()
    );

    const worksheet = workbook.worksheets.find(
        (ws) =>
            normalizeHeader(ws.name) ===
            normalizeHeader(TARGET_SHEET_NAME)
    );

    if (!worksheet) {
        throw new Error(
            `Required worksheet "${TARGET_SHEET_NAME}" was not found.`
        );
    }

    const { headerMap } = buildHeaderMap(worksheet);

    const outputWorkbook = new ExcelJS.Workbook();
    const outputWorksheet =
        outputWorkbook.addWorksheet(
            TARGET_SHEET_NAME
        );

    const customerNoResult =
        CUSTOMER_NO_ALIASES.find(
            (alias) =>
                Boolean(
                    headerMap[
                        normalizeHeader(alias)
                    ]
                )
        );

    const outputHeaders = [
        'Code#',
        'Item Name',
        'Quantity',
        'Unit',
        'Number',
        'Date',
        ...(customerNoResult
            ? [customerNoResult]
            : []),
        'Customer',
        'Serial/Production Number',
        'Name Warehouse',
    ];

    outputWorksheet.addRow(
        outputHeaders
    );

    for (
        let rowNumber = 2;
        rowNumber <= worksheet.rowCount;
        rowNumber++
    ) {
        const row = worksheet.getRow(
            rowNumber
        );

        const values: ExcelJS.CellValue[] = [
            getRawCellByHeader(
                row,
                headerMap,
                'Code#'
            ),
            getRawCellByHeader(
                row,
                headerMap,
                'Item Name'
            ),
            getRawCellByHeader(
                row,
                headerMap,
                'Quantity'
            ),
            getRawCellByHeader(
                row,
                headerMap,
                'Unit'
            ),
            getRawCellByHeader(
                row,
                headerMap,
                'Number'
            ),
            getRawCellByHeader(
                row,
                headerMap,
                'Date'
            ),
        ];

        if (customerNoResult) {
            values.push(
                getRawCellByHeader(
                    row,
                    headerMap,
                    customerNoResult
                )
            );
        }

        values.push(
            getRawCellByHeader(
                row,
                headerMap,
                'Customer'
            )
        );

        values.push(
            getRawCellByHeader(
                row,
                headerMap,
                'Serial/Production Number'
            )
        );

        values.push(
            getRawCellByHeader(
                row,
                headerMap,
                'Name Warehouse'
            )
        );

        const hasData = values.some(
            (value) =>
                String(value ?? '').trim() !== ''
        );

        if (hasData) {
            outputWorksheet.addRow(
                values
            );
        }
    }

    // Keep the compact workbook readable and consistent.
    outputWorksheet.columns.forEach(
        (column) => {
            column.width = 22;
        }
    );

    const headerRow =
        outputWorksheet.getRow(1);

    headerRow.font = {
        bold: true,
    };

    headerRow.alignment = {
        vertical: 'middle',
    };

    const buffer =
        await outputWorkbook.xlsx.writeBuffer();

    return new File(
        [buffer],
        sourceFile.name,
        {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            lastModified:
                sourceFile.lastModified,
        }
    );
};

// ============================================================================
// Component
// ============================================================================

const FurunoExcelUpload: React.FC =
    () => {
        // ---------------------------------------------------------------------
        // File
        // ---------------------------------------------------------------------

        const [file, setFile] =
            useState<File | null>(null);

        // ---------------------------------------------------------------------
        // Preview
        // ---------------------------------------------------------------------

        const [
            preview,
            setPreview,
        ] =
            useState<ExcelPreviewData | null>(
                null
            );

        // ---------------------------------------------------------------------
        // Upload
        // ---------------------------------------------------------------------

        const [
            loading,
            setLoading,
        ] = useState(false);

        const [
            uploadResult,
            setUploadResult,
        ] =
            useState<UploadResponse | null>(
                null
            );

        // ---------------------------------------------------------------------
        // UI
        // ---------------------------------------------------------------------

        const [
            showAlert,
            setShowAlert,
        ] = useState(false);

        const [
            isDragging,
            setIsDragging,
        ] = useState(false);

        // ---------------------------------------------------------------------
        // Master Data
        // ---------------------------------------------------------------------

        const [
            ownerOptions,
            setOwnerOptions,
        ] = useState<SelectOption[]>(
            []
        );

        const [
            whsOptions,
            setWhsOptions,
        ] = useState<SelectOption[]>(
            []
        );

        const [
            selectedOwner,
            setSelectedOwner,
        ] = useState('');

        const [
            selectedWhs,
            setSelectedWhs,
        ] = useState('');

        // ---------------------------------------------------------------------
        // Refs
        // ---------------------------------------------------------------------

        const fileInputRef =
            useRef<HTMLInputElement>(
                null
            );

        const alertRef =
            useRef<HTMLDivElement>(
                null
            );

        // =====================================================================
        // Initial Load
        // =====================================================================

        useEffect(() => {
            fetchOwners();
            fetchWarehouses();
        }, []);

        // =====================================================================
        // Fetch Owners
        // =====================================================================

        const fetchOwners =
            async () => {
                try {
                    const res =
                        await api.get(
                            '/owners'
                        );

                    if (
                        res.data?.success
                    ) {
                        setOwnerOptions(
                            (
                                res.data
                                    .data ?? []
                            ).map(
                                (
                                    item: any
                                ) => ({
                                    value:
                                        item.code,
                                    label:
                                        `${item.code} - ${item.code}`,
                                })
                            )
                        );
                    }
                } catch (error) {
                    console.error(
                        'Failed to fetch owners:',
                        error
                    );
                }
            };

        // =====================================================================
        // Fetch Warehouses
        // =====================================================================

        const fetchWarehouses =
            async () => {
                try {
                    const res =
                        await api.get(
                            '/warehouses'
                        );

                    if (
                        res.data?.success
                    ) {
                        setWhsOptions(
                            (
                                res.data
                                    .data ?? []
                            ).map(
                                (
                                    item: any
                                ) => ({
                                    value:
                                        item.code,
                                    label:
                                        `${item.code} - ${item.name}`,
                                })
                            )
                        );
                    }
                } catch (error) {
                    console.error(
                        'Failed to fetch warehouses:',
                        error
                    );
                }
            };

        // =====================================================================
        // Reset
        // =====================================================================

        const clearFile = () => {
            setFile(null);
            setPreview(null);
            setUploadResult(null);
            setShowAlert(false);

            if (
                fileInputRef.current
            ) {
                fileInputRef.current.value =
                    '';
            }
        };

        // =====================================================================
        // Validate File
        // =====================================================================

        const validateFile = (
            selectedFile: File
        ): boolean => {
            if (
                !isValidExcel(
                    selectedFile
                )
            ) {
                alert(
                    'Invalid file format. Only .xlsx Excel files are supported.'
                );

                return false;
            }

            if (
                selectedFile.size >
                MAX_FILE_SIZE
            ) {
                alert(
                    `File size exceeds the 10 MB limit. Current file size: ${formatFileSize(
                        selectedFile.size
                    )}.`
                );

                return false;
            }

            if (
                selectedFile.size === 0
            ) {
                alert(
                    'The selected file is empty.'
                );

                return false;
            }

            return true;
        };

        // =====================================================================
        // File Change
        // =====================================================================

        const handleFileChange =
            async (
                e: React.ChangeEvent<HTMLInputElement>
            ) => {
                const selected =
                    e.target.files?.[0];

                if (!selected) {
                    return;
                }

                if (
                    !validateFile(
                        selected
                    )
                ) {
                    e.target.value =
                        '';

                    return;
                }

                setFile(selected);
                setPreview(null);
                setUploadResult(null);
                setShowAlert(false);

                await generatePreview(
                    selected
                );
            };

        // =====================================================================
        // Drag Enter
        // =====================================================================

        const handleDragEnter =
            (
                e: React.DragEvent
            ) => {
                e.preventDefault();
                e.stopPropagation();

                setIsDragging(true);
            };

        // =====================================================================
        // Drag Leave
        // =====================================================================

        const handleDragLeave =
            (
                e: React.DragEvent
            ) => {
                e.preventDefault();
                e.stopPropagation();

                setIsDragging(false);
            };

        // =====================================================================
        // Drag Over
        // =====================================================================

        const handleDragOver =
            (
                e: React.DragEvent
            ) => {
                e.preventDefault();
                e.stopPropagation();
            };

        // =====================================================================
        // Drop
        // =====================================================================

        const handleDrop =
            async (
                e: React.DragEvent
            ) => {
                e.preventDefault();
                e.stopPropagation();

                setIsDragging(false);

                const dropped =
                    e.dataTransfer.files[0];

                if (!dropped) {
                    return;
                }

                if (
                    !validateFile(
                        dropped
                    )
                ) {
                    return;
                }

                setFile(dropped);
                setPreview(null);
                setUploadResult(null);
                setShowAlert(false);

                await generatePreview(
                    dropped
                );
            };

        // =====================================================================
        // Generate Preview
        // =====================================================================

        const generatePreview =
            async (
                selectedFile: File
            ) => {
                try {
                    const workbook =
                        new ExcelJS.Workbook();

                    await workbook.xlsx.load(
                        await selectedFile.arrayBuffer()
                    );

                    // ---------------------------------------------------------
                    // Find Sheet
                    // ---------------------------------------------------------

                    const worksheet =
                        workbook.worksheets.find(
                            (ws) =>
                                normalizeHeader(
                                    ws.name
                                ) ===
                                normalizeHeader(
                                    TARGET_SHEET_NAME
                                )
                        );

                    if (!worksheet) {
                        const availableSheets =
                            workbook.worksheets
                                .map(
                                    (
                                        ws
                                    ) =>
                                        ws.name
                                )
                                .join(
                                    ', '
                                );

                        alert(
                            `Required worksheet "${TARGET_SHEET_NAME}" was not found.\n\nAvailable worksheets:\n${availableSheets || 'None'}`
                        );

                        clearFile();

                        return;
                    }

                    // ---------------------------------------------------------
                    // Header
                    // ---------------------------------------------------------

                    const {
                        headerMap,
                        actualHeaders,
                    } =
                        buildHeaderMap(
                            worksheet
                        );

                    // ---------------------------------------------------------
                    // Required Header Validation
                    // ---------------------------------------------------------

                    const missingHeaders =
                        REQUIRED_HEADERS.filter(
                            (
                                required
                            ) =>
                                !headerMap[
                                    normalizeHeader(
                                        required
                                    )
                                ]
                        );

                    if (
                        missingHeaders.length >
                        0
                    ) {
                        const available =
                            actualHeaders.filter(
                                Boolean
                            );

                        alert(
                            `Invalid Furuno Excel template.\n\nMissing required headers:\n${missingHeaders
                                .map(
                                    (
                                        header
                                    ) =>
                                        `• ${header}`
                                )
                                .join(
                                    '\n'
                                )}\n\nAvailable headers:\n${available
                                .map(
                                    (
                                        header
                                    ) =>
                                        `• ${header}`
                                )
                                .join(
                                    '\n'
                                )}`
                        );

                        clearFile();

                        return;
                    }

                    // ---------------------------------------------------------
                    // Detect Template
                    // ---------------------------------------------------------

                    const {
                        template,
                        customerNoAvailable,
                    } =
                        detectTemplate(
                            headerMap
                        );

                    // ---------------------------------------------------------
                    // Read Data
                    // ---------------------------------------------------------

                    const rows: FurunoPreviewRow[] =
                        [];

                    const doNumberSet =
                        new Set<string>();

                    let totalDataRows =
                        0;

                    let yusenRows = 0;

                    let skippedRows = 0;

                    for (
                        let rowNumber = 2;
                        rowNumber <=
                        worksheet.rowCount;
                        rowNumber++
                    ) {
                        const row =
                            worksheet.getRow(
                                rowNumber
                            );

                        const code =
                            getCellByHeader(
                                row,
                                headerMap,
                                'Code#'
                            );

                        const itemName =
                            getCellByHeader(
                                row,
                                headerMap,
                                'Item Name'
                            );

                        const quantity =
                            getCellByHeader(
                                row,
                                headerMap,
                                'Quantity'
                            );

                        const unit =
                            getCellByHeader(
                                row,
                                headerMap,
                                'Unit'
                            );

                        const number =
                            getCellByHeader(
                                row,
                                headerMap,
                                'Number'
                            );

                        const date =
                            getCellByHeader(
                                row,
                                headerMap,
                                'Date'
                            );

                        const customerNoResult =
                            getCellByHeaderAliases(
                                row,
                                headerMap,
                                CUSTOMER_NO_ALIASES
                            );

                        const customerNo =
                            customerNoResult.value;

                        const customer =
                            getCellByHeader(
                                row,
                                headerMap,
                                'Customer'
                            );

                        const serialNumber =
                            getCellByHeader(
                                row,
                                headerMap,
                                'Serial/Production Number'
                            );

                        const warehouse =
                            getCellByHeader(
                                row,
                                headerMap,
                                'Name Warehouse'
                            );

                        const previewRow: FurunoPreviewRow =
                            {
                                excelRow:
                                    rowNumber,
                                code,
                                itemName,
                                quantity,
                                unit,
                                number,
                                date,
                                customerNo,
                                customer,
                                serialNumber,
                                warehouse,
                                eligible: false,
                            };

                        // -----------------------------------------------------
                        // Empty Row
                        // -----------------------------------------------------

                        if (
                            !isMeaningfulRow(
                                previewRow
                            )
                        ) {
                            continue;
                        }

                        totalDataRows++;

                        // -----------------------------------------------------
                        // Warehouse Eligibility
                        // -----------------------------------------------------

                        const isYusen =
                            warehouse
                                .trim()
                                .toLowerCase() ===
                            TARGET_WAREHOUSE.toLowerCase();

                        previewRow.eligible =
                            isYusen;

                        if (isYusen) {
                            yusenRows++;
                        } else {
                            skippedRows++;
                        }

                        // -----------------------------------------------------
                        // Unique DO
                        // -----------------------------------------------------

                        if (number) {
                            doNumberSet.add(
                                number
                            );
                        }

                        // -----------------------------------------------------
                        // Preview
                        // -----------------------------------------------------

                        if (
                            rows.length <
                            MAX_PREVIEW_ROWS
                        ) {
                            rows.push(
                                previewRow
                            );
                        }
                    }

                    // ---------------------------------------------------------
                    // Set Preview
                    // ---------------------------------------------------------

                    setPreview({
                        headers:
                            PREVIEW_HEADERS as unknown as string[],
                        rows,
                        fileName:
                            selectedFile.name,
                        fileSize:
                            formatFileSize(
                                selectedFile.size
                            ),
                        totalDataRows,
                        yusenRows,
                        skippedRows,
                        uniqueDONumbers:
                            doNumberSet.size,
                        template,
                        customerNoAvailable,
                    });
                } catch (error) {
                    console.error(
                        'Failed to preview Furuno Excel:',
                        error
                    );

                    alert(
                        'Failed to read the Excel file. Please verify that the file is a valid .xlsx workbook and follows the Furuno template.'
                    );

                    clearFile();
                }
            };

        // =====================================================================
        // Upload
        // =====================================================================

        const handleUpload =
            async () => {
                if (!file) {
                    alert(
                        'Please select an Excel file before uploading.'
                    );

                    return;
                }

                if (!selectedOwner) {
                    alert(
                        'Please select an Owner before uploading.'
                    );

                    return;
                }

                if (!selectedWhs) {
                    alert(
                        'Please select a Warehouse before uploading.'
                    );

                    return;
                }

                if (!preview) {
                    alert(
                        'Please wait until the file preview is ready.'
                    );

                    return;
                }

                if (
                    preview.yusenRows ===
                    0
                ) {
                    alert(
                        `No eligible records were found.\n\nOnly records with "${TARGET_WAREHOUSE}" in the "Name Warehouse" column can be imported.`
                    );

                    return;
                }

                setLoading(true);
                setUploadResult(null);
                setShowAlert(false);

                try {
                    const formData =
                        new FormData();

                    /**
                     * Normalize spacer columns before sending the workbook.
                     *
                     * This allows files such as:
                     *   A blank | B Code# | C blank | D Item Name | ...
                     *
                     * to be uploaded without manually deleting blank columns.
                     */
                    const normalizedFile =
                        await normalizeFurunoWorkbookForUpload(
                            file
                        );

                    formData.append(
                        'file',
                        normalizedFile
                    );

                    formData.append(
                        'owner_code',
                        selectedOwner
                    );

                    formData.append(
                        'whs_code',
                        selectedWhs
                    );

                    const res = await api.post(
                        '/outbound/upload-furuno-excel',
                        formData,
                        {
                            withCredentials: true,
                            headers: {
                                'Content-Type':
                                    'multipart/form-data',
                            },
                        }
                    );

                    setUploadResult(res.data);
                    setShowAlert(true);
                } catch (error: any) {
                    console.error(
                        'Furuno upload error:',
                        error
                    );

                    const errorData =
                        error.response?.data;

                    setUploadResult(
                        errorData || {
                            success: false,
                            message:
                                'Upload failed. Please try again.',
                            errors: [
                                {
                                    row: 0,
                                    message:
                                        'Network request failed.',
                                    detail:
                                        error.message,
                                },
                            ],
                        }
                    );

                    setShowAlert(true);
                } finally {
                    setLoading(false);
                }
            };

        // =====================================================================
        // Render
        // =====================================================================

        return (
            <Layout
                title="Outbound"
                subTitle="Import Furuno Excel"
            >
                <div className="min-h-screen bg-gray-50 p-6">
                    <div className="max-w-7xl mx-auto">

                        {/* =====================================================
                            Back
                        ===================================================== */}

                        <div className="mb-4">
                            <Button
                                variant="ghost"
                                className="h-9 px-4 text-white bg-black hover:bg-slate-700"
                                onClick={() =>
                                    router.back()
                                }
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">

                            {/* =================================================
                                STEP 1
                            ================================================= */}

                            <div className="p-6 border-b border-gray-200">

                                <div className="flex items-center gap-2 mb-5">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">
                                        1
                                    </span>

                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Import Configuration
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    {/* Owner */}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Owner{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <Select
                                            placeholder="Select Owner..."
                                            options={
                                                ownerOptions
                                            }
                                            value={
                                                ownerOptions.find(
                                                    (
                                                        option
                                                    ) =>
                                                        option.value ===
                                                        selectedOwner
                                                ) ||
                                                null
                                            }
                                            onChange={(
                                                option
                                            ) =>
                                                setSelectedOwner(
                                                    option?.value ||
                                                        ''
                                                )
                                            }
                                            isDisabled={
                                                loading
                                            }
                                        />

                                        <p className="mt-1 text-xs text-gray-400">
                                            Stock owner / principal
                                        </p>
                                    </div>

                                    {/* Warehouse */}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Warehouse{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <Select
                                            placeholder="Select Warehouse..."
                                            options={
                                                whsOptions
                                            }
                                            value={
                                                whsOptions.find(
                                                    (
                                                        option
                                                    ) =>
                                                        option.value ===
                                                        selectedWhs
                                                ) ||
                                                null
                                            }
                                            onChange={(
                                                option
                                            ) =>
                                                setSelectedWhs(
                                                    option?.value ||
                                                        ''
                                                )
                                            }
                                            isDisabled={
                                                loading
                                            }
                                        />

                                        <p className="mt-1 text-xs text-gray-400">
                                            Target warehouse for outbound creation
                                        </p>
                                    </div>
                                </div>

                                {/* =================================================
                                    Import Rules
                                ================================================= */}

                                <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex gap-3">

                                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />

                                        <div className="text-sm text-blue-800">

                                            <p className="font-semibold mb-2">
                                                Furuno Excel Import Rules
                                            </p>

                                            <ul className="list-disc list-inside space-y-1 text-xs">

                                                <li>
                                                    Required worksheet:
                                                    <strong className="ml-1">
                                                        Delivery Order Detail
                                                    </strong>
                                                </li>

                                                <li>
                                                    Both supported Furuno Excel layouts are detected automatically.
                                                </li>

                                                <li>
                                                    Only rows where
                                                    <strong className="mx-1">
                                                        Name Warehouse = Yusen WH
                                                    </strong>
                                                    will be imported.
                                                </li>

                                                <li>
                                                    Rows belonging to other warehouses will be skipped.
                                                </li>

                                                <li>
                                                    The
                                                    <strong className="mx-1">
                                                        Number
                                                    </strong>
                                                    column is used as the Delivery Order number.
                                                </li>

                                                <li>
                                                    Customer No is optional.
                                                </li>

                                                <li>
                                                    Supported Customer No headers:
                                                    <strong className="mx-1">
                                                        Customer No
                                                    </strong>
                                                    and
                                                    <strong className="ml-1">
                                                        Customer No Customer Delivery Order
                                                    </strong>
                                                </li>

                                                <li>
                                                    Maximum file size:
                                                    <strong className="ml-1">
                                                        10 MB
                                                    </strong>
                                                </li>

                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* =================================================
                                STEP 2
                            ================================================= */}

                            <div className="p-6 border-b border-gray-200">

                                <div className="flex items-center gap-2 mb-5">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">
                                        2
                                    </span>

                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Upload Excel File
                                    </h2>
                                </div>

                                {/* Drop Zone */}

                                <div
                                    className={`
                                        border-2 border-dashed rounded-lg p-8 text-center
                                        transition-all duration-200
                                        ${
                                            isDragging
                                                ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                                                : 'border-gray-300 hover:border-blue-400'
                                        }
                                    `}
                                    onDragEnter={
                                        handleDragEnter
                                    }
                                    onDragOver={
                                        handleDragOver
                                    }
                                    onDragLeave={
                                        handleDragLeave
                                    }
                                    onDrop={
                                        handleDrop
                                    }
                                >
                                    <input
                                        ref={
                                            fileInputRef
                                        }
                                        type="file"
                                        accept=".xlsx"
                                        onChange={
                                            handleFileChange
                                        }
                                        className="hidden"
                                        id="furuno-file-upload"
                                    />

                                    <label
                                        htmlFor="furuno-file-upload"
                                        className="cursor-pointer inline-flex flex-col items-center"
                                    >
                                        <Upload
                                            className={`
                                                w-12 h-12 mb-3
                                                ${
                                                    isDragging
                                                        ? 'text-blue-600 animate-bounce'
                                                        : 'text-gray-400'
                                                }
                                            `}
                                        />

                                        <span
                                            className={`
                                                text-sm font-medium mb-1
                                                ${
                                                    isDragging
                                                        ? 'text-blue-700'
                                                        : 'text-gray-700'
                                                }
                                            `}
                                        >
                                            {isDragging
                                                ? 'Drop the Excel file here'
                                                : 'Click to upload or drag & drop'}
                                        </span>

                                        <span className="text-xs text-gray-500">
                                            Furuno Excel workbook (.xlsx) — maximum 10 MB
                                        </span>
                                    </label>
                                </div>

                                {/* Selected File */}

                                {file && (
                                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">

                                        <div className="flex items-center gap-3 min-w-0">

                                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <FileSpreadsheet className="w-6 h-6 text-green-600" />
                                            </div>

                                            <div className="min-w-0">
                                                <p
                                                    className="text-sm font-medium text-gray-900 truncate"
                                                    title={
                                                        file.name
                                                    }
                                                >
                                                    {
                                                        file.name
                                                    }
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    {formatFileSize(
                                                        file.size
                                                    )}
                                                </p>
                                            </div>

                                        </div>

                                        <button
                                            type="button"
                                            onClick={
                                                clearFile
                                            }
                                            disabled={
                                                loading
                                            }
                                            className="text-red-500 hover:text-red-700 disabled:opacity-50"
                                            title="Remove file"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}

                                {/* Upload Actions */}

                                {file && (
                                    <div className="mt-4 flex gap-3">

                                        <button
                                            type="button"
                                            onClick={
                                                handleUpload
                                            }
                                            disabled={
                                                loading ||
                                                !selectedOwner ||
                                                !selectedWhs ||
                                                !preview ||
                                                preview.yusenRows ===
                                                    0
                                            }
                                            className="
                                                flex-1 h-10
                                                inline-flex items-center justify-center gap-2
                                                px-6 text-sm font-medium text-white
                                                bg-blue-600 rounded-lg
                                                hover:bg-blue-700
                                                disabled:bg-gray-400
                                                disabled:cursor-not-allowed
                                                transition-colors
                                            "
                                        >
                                            {loading ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-4 h-4" />
                                                    Upload & Create Outbound
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={
                                                clearFile
                                            }
                                            disabled={
                                                loading
                                            }
                                            className="
                                                px-6 h-10
                                                text-sm font-medium text-gray-700
                                                bg-white border border-gray-300
                                                rounded-lg
                                                hover:bg-gray-50
                                                disabled:opacity-50
                                                transition-colors
                                            "
                                        >
                                            Clear
                                        </button>

                                    </div>
                                )}

                                {/* Configuration Warning */}

                                {file &&
                                    (!selectedOwner ||
                                        !selectedWhs) && (
                                        <div className="mt-3 flex items-center gap-2 text-xs text-amber-600">
                                            <AlertTriangle className="w-4 h-4" />

                                            <span>
                                                Select both Owner and Warehouse before uploading.
                                            </span>
                                        </div>
                                    )}
                            </div>

                            {/* =================================================
                                STEP 3 - PREVIEW
                            ================================================= */}

                            {preview && (
                                <div className="p-6 border-b border-gray-200">

                                    <div className="flex items-center justify-between mb-5">

                                        <div className="flex items-center gap-2">

                                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">
                                                3
                                            </span>

                                            <h2 className="text-lg font-semibold text-gray-900">
                                                File Preview
                                            </h2>

                                            <span className="text-sm text-gray-500">
                                                (
                                                {
                                                    preview.rows.length
                                                }{' '}
                                                of{' '}
                                                {
                                                    preview.totalDataRows
                                                }{' '}
                                                rows shown
                                                )
                                            </span>

                                        </div>

                                        <div className="flex items-center gap-2">

                                            <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700">
                                                {getTemplateLabel(
                                                    preview.template
                                                )}
                                            </span>

                                            {preview.customerNoAvailable && (
                                                <span className="px-2.5 py-1 rounded-md bg-purple-50 border border-purple-200 text-xs font-medium text-purple-700">
                                                    Customer No detected
                                                </span>
                                            )}

                                        </div>
                                    </div>

                                    {/* =================================================
                                        Stats
                                    ================================================= */}

                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">

                                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                                            <p className="text-2xl font-bold text-blue-700">
                                                {
                                                    preview.totalDataRows
                                                }
                                            </p>

                                            <p className="text-xs text-blue-600">
                                                Total Rows
                                            </p>
                                        </div>

                                        <div className="bg-green-50 rounded-lg p-3 text-center">
                                            <p className="text-2xl font-bold text-green-700">
                                                {
                                                    preview.yusenRows
                                                }
                                            </p>

                                            <p className="text-xs text-green-600">
                                                Eligible Rows
                                            </p>
                                        </div>

                                        <div className="bg-yellow-50 rounded-lg p-3 text-center">
                                            <p className="text-2xl font-bold text-yellow-700">
                                                {
                                                    preview.skippedRows
                                                }
                                            </p>

                                            <p className="text-xs text-yellow-600">
                                                Rows to Skip
                                            </p>
                                        </div>

                                        <div className="bg-purple-50 rounded-lg p-3 text-center">
                                            <p className="text-2xl font-bold text-purple-700">
                                                {
                                                    preview.uniqueDONumbers
                                                }
                                            </p>

                                            <p className="text-xs text-purple-600">
                                                Unique DOs
                                            </p>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                                            <p className="text-lg font-bold text-gray-700">
                                                {
                                                    preview.fileSize
                                                }
                                            </p>

                                            <p className="text-xs text-gray-500">
                                                File Size
                                            </p>
                                        </div>

                                    </div>

                                    {/* =================================================
                                        Skip Warning
                                    ================================================= */}

                                    {preview.skippedRows >
                                        0 && (
                                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">

                                            <div className="flex gap-2">

                                                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />

                                                <div className="text-xs text-yellow-800">

                                                    <p className="font-semibold">
                                                        Some rows will be skipped
                                                    </p>

                                                    <p className="mt-1">
                                                        {
                                                            preview.totalDataRows
                                                        }{' '}
                                                        data rows were detected.
                                                        Only{' '}
                                                        <strong>
                                                            {
                                                                preview.yusenRows
                                                            }
                                                        </strong>{' '}
                                                        rows where{' '}
                                                        <strong>
                                                            Name Warehouse = Yusen WH
                                                        </strong>{' '}
                                                        will be imported.
                                                    </p>

                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* =================================================
                                        No Eligible Data
                                    ================================================= */}

                                    {preview.yusenRows ===
                                        0 && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">

                                            <div className="flex gap-2">

                                                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />

                                                <div className="text-xs text-red-800">

                                                    <p className="font-semibold">
                                                        No eligible records found
                                                    </p>

                                                    <p className="mt-1">
                                                        No rows with{' '}
                                                        <strong>
                                                            Name Warehouse = Yusen WH
                                                        </strong>{' '}
                                                        were found. The file cannot be imported.
                                                    </p>

                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* =================================================
                                        Preview Table
                                    ================================================= */}

                                    <div className="overflow-x-auto rounded-lg border border-gray-200">

                                        <table className="min-w-full divide-y divide-gray-200">

                                            <thead className="bg-gray-50">

                                                <tr>

                                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        #
                                                    </th>

                                                    {preview.headers.map(
                                                        (
                                                            header,
                                                            index
                                                        ) => (
                                                            <th
                                                                key={
                                                                    `${header}-${index}`
                                                                }
                                                                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap"
                                                            >
                                                                {
                                                                    header
                                                                }
                                                            </th>
                                                        )
                                                    )}

                                                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                        Status
                                                    </th>

                                                </tr>

                                            </thead>

                                            <tbody className="bg-white divide-y divide-gray-200">

                                                {preview.rows.map(
                                                    (
                                                        row,
                                                        index
                                                    ) => (
                                                        <tr
                                                            key={`${row.excelRow}-${index}`}
                                                            className={`
                                                                hover:bg-gray-50
                                                                ${
                                                                    row.eligible
                                                                        ? ''
                                                                        : 'bg-yellow-50'
                                                                }
                                                            `}
                                                        >

                                                            {/* Excel Row */}

                                                            <td className="px-3 py-2 text-sm text-gray-400">
                                                                {
                                                                    row.excelRow
                                                                }
                                                            </td>

                                                            {/* Code */}

                                                            <td className="px-3 py-2 text-sm font-mono font-semibold text-blue-700 whitespace-nowrap">
                                                                {row.code ||
                                                                    '—'}
                                                            </td>

                                                            {/* Item */}

                                                            <td className="px-3 py-2 text-sm text-gray-900 max-w-xs">

                                                                <div
                                                                    className="truncate"
                                                                    title={
                                                                        row.itemName
                                                                    }
                                                                >
                                                                    {row.itemName ||
                                                                        '—'}
                                                                </div>

                                                            </td>

                                                            {/* Qty */}

                                                            <td className="px-3 py-2 text-sm text-right font-semibold text-gray-900 whitespace-nowrap">
                                                                {row.quantity ||
                                                                    '—'}
                                                            </td>

                                                            {/* Unit */}

                                                            <td className="px-3 py-2 text-sm text-gray-600 whitespace-nowrap">
                                                                {row.unit ||
                                                                    '—'}
                                                            </td>

                                                            {/* DO */}

                                                            <td className="px-3 py-2 text-sm font-mono font-semibold text-purple-700 whitespace-nowrap">
                                                                {row.number ||
                                                                    '—'}
                                                            </td>

                                                            {/* Date */}

                                                            <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                                                                {row.date ||
                                                                    '—'}
                                                            </td>

                                                            {/* Customer No */}

                                                            <td className="px-3 py-2 text-sm font-mono font-medium text-indigo-700 whitespace-nowrap">
                                                                {row.customerNo ||
                                                                    '—'}
                                                            </td>

                                                            {/* Customer */}

                                                            <td className="px-3 py-2 text-sm text-gray-900 max-w-xs">

                                                                <div
                                                                    className="truncate"
                                                                    title={
                                                                        row.customer
                                                                    }
                                                                >
                                                                    {row.customer ||
                                                                        '—'}
                                                                </div>

                                                            </td>

                                                            {/* Serial */}

                                                            <td className="px-3 py-2 text-sm font-mono text-slate-600 whitespace-nowrap">
                                                                {row.serialNumber ||
                                                                    '—'}
                                                            </td>

                                                            {/* Warehouse */}

                                                            <td className="px-3 py-2 text-sm whitespace-nowrap">

                                                                <span
                                                                    className={`
                                                                        inline-flex px-2 py-1 rounded-md text-xs font-medium
                                                                        ${
                                                                            row.eligible
                                                                                ? 'bg-green-100 text-green-800'
                                                                                : 'bg-yellow-100 text-yellow-800'
                                                                        }
                                                                    `}
                                                                >
                                                                    {row.warehouse ||
                                                                        '—'}
                                                                </span>

                                                            </td>

                                                            {/* Status */}

                                                            <td className="px-3 py-2 text-center whitespace-nowrap">

                                                                {row.eligible ? (
                                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                                                                        <CheckCircle2 className="w-4 h-4" />
                                                                        Import
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700">
                                                                        <AlertTriangle className="w-4 h-4" />
                                                                        Skip
                                                                    </span>
                                                                )}

                                                            </td>

                                                        </tr>
                                                    )
                                                )}

                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Preview Note */}

                                    {preview.rows.length ===
                                        MAX_PREVIEW_ROWS &&
                                        preview.totalDataRows >
                                            MAX_PREVIEW_ROWS && (
                                            <p className="mt-2 text-xs text-gray-400">
                                                Only the first{' '}
                                                {
                                                    MAX_PREVIEW_ROWS
                                                }{' '}
                                                rows are displayed. The complete file will be processed by the backend using the Yusen WH rule.
                                            </p>
                                        )}
                                </div>
                            )}

                            {/* =================================================
                                STEP 4 - RESULT
                            ================================================= */}

                            {showAlert &&
                                uploadResult && (
                                    <div
                                        ref={
                                            alertRef
                                        }
                                        className="p-6"
                                    >
                                        <div
                                            className={`
                                                rounded-lg p-4
                                                ${
                                                    uploadResult.success
                                                        ? 'bg-green-50 border border-green-200'
                                                        : 'bg-red-50 border border-red-200'
                                                }
                                            `}
                                        >
                                            <div className="flex">

                                                {/* Icon */}

                                                <div className="flex-shrink-0 mt-0.5">

                                                    {uploadResult.success ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                    ) : (
                                                        <XCircle className="h-5 w-5 text-red-600" />
                                                    )}

                                                </div>

                                                {/* Content */}

                                                <div className="ml-3 flex-1 min-w-0">

                                                    <h3
                                                        className={`
                                                            text-sm font-semibold
                                                            ${
                                                                uploadResult.success
                                                                    ? 'text-green-800'
                                                                    : 'text-red-800'
                                                            }
                                                        `}
                                                    >
                                                        {
                                                            uploadResult.message
                                                        }
                                                    </h3>

                                                    {/* =================================================
                                                        SUCCESS
                                                    ================================================= */}

                                                    {uploadResult.success && (
                                                        <div className="mt-3 space-y-4 text-sm text-green-700">

                                                            {/* Stats */}

                                                            <div className="flex flex-wrap gap-6">

                                                                {uploadResult.total_rows !==
                                                                    undefined && (
                                                                    <p>
                                                                        Total Rows:{' '}
                                                                        <strong>
                                                                            {
                                                                                uploadResult.total_rows
                                                                            }
                                                                        </strong>
                                                                    </p>
                                                                )}

                                                                {uploadResult.success_count !==
                                                                    undefined && (
                                                                    <p>
                                                                        Successfully Processed:{' '}
                                                                        <strong>
                                                                            {
                                                                                uploadResult.success_count
                                                                            }
                                                                        </strong>
                                                                    </p>
                                                                )}

                                                                {uploadResult.failed_count !==
                                                                    undefined &&
                                                                    uploadResult.failed_count >
                                                                        0 && (
                                                                        <p>
                                                                            Skipped / Failed:{' '}
                                                                            <strong>
                                                                                {
                                                                                    uploadResult.failed_count
                                                                                }
                                                                            </strong>
                                                                        </p>
                                                                    )}

                                                            </div>

                                                            {/* Outbound Numbers */}

                                                            {uploadResult.outbound_numbers &&
                                                                uploadResult
                                                                    .outbound_numbers
                                                                    .length >
                                                                    0 && (
                                                                    <div>

                                                                        <p className="font-medium mb-2">
                                                                            Created Outbound Numbers (
                                                                            {
                                                                                uploadResult
                                                                                    .outbound_numbers
                                                                                    .length
                                                                            }
                                                                            ):
                                                                        </p>

                                                                        <div className="flex flex-wrap gap-2">

                                                                            {uploadResult.outbound_numbers.map(
                                                                                (
                                                                                    number,
                                                                                    index
                                                                                ) => (
                                                                                    <span
                                                                                        key={
                                                                                            index
                                                                                        }
                                                                                        className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-mono font-medium"
                                                                                    >
                                                                                        {
                                                                                            number
                                                                                        }
                                                                                    </span>
                                                                                )
                                                                            )}

                                                                        </div>
                                                                    </div>
                                                                )}

                                                            {/* Unknown Customer */}

                                                            {uploadResult.unknown_customers &&
                                                                uploadResult
                                                                    .unknown_customers
                                                                    .length >
                                                                    0 && (
                                                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">

                                                                        <div className="flex items-start gap-2 mb-2">

                                                                            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />

                                                                            <p className="text-sm font-semibold text-amber-800">
                                                                                {
                                                                                    uploadResult
                                                                                        .unknown_customers
                                                                                        .length
                                                                                }{' '}
                                                                                outbound record(s) have an unresolved customer
                                                                            </p>

                                                                        </div>

                                                                        <div className="max-h-48 overflow-y-auto space-y-1">

                                                                            {uploadResult.unknown_customers.map(
                                                                                (
                                                                                    customer,
                                                                                    index
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            index
                                                                                        }
                                                                                        className="flex flex-wrap items-center gap-2 py-1 border-b border-amber-100 last:border-b-0"
                                                                                    >

                                                                                        <span className="font-mono text-xs bg-white text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded whitespace-nowrap">
                                                                                            {
                                                                                                customer.outbound_no
                                                                                            }
                                                                                        </span>

                                                                                        <span className="text-xs text-amber-700">
                                                                                            Memo PO:{' '}
                                                                                            <strong>
                                                                                                {
                                                                                                    customer.memo_po
                                                                                                }
                                                                                            </strong>
                                                                                        </span>

                                                                                        <span className="text-xs text-amber-600">
                                                                                            Customer:{' '}
                                                                                            <em>
                                                                                                {
                                                                                                    customer.customer_name
                                                                                                }
                                                                                            </em>
                                                                                        </span>

                                                                                    </div>
                                                                                )
                                                                            )}

                                                                        </div>
                                                                    </div>
                                                                )}

                                                            {/* Skipped Orders */}

                                                            {uploadResult.skipped_orders &&
                                                                uploadResult
                                                                    .skipped_orders
                                                                    .length >
                                                                    0 && (
                                                                    <div>

                                                                        <p className="font-medium mb-2 text-yellow-800">
                                                                            {
                                                                                uploadResult
                                                                                    .skipped_orders
                                                                                    .length
                                                                            }{' '}
                                                                            order(s) were skipped
                                                                        </p>

                                                                        <div className="max-h-48 overflow-y-auto bg-white rounded p-2 border border-yellow-200 space-y-1">

                                                                            {uploadResult.skipped_orders.map(
                                                                                (
                                                                                    skipped,
                                                                                    index
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            index
                                                                                        }
                                                                                        className="flex items-start gap-2 pb-1 border-b border-yellow-100 last:border-b-0"
                                                                                    >

                                                                                        <span className="font-mono text-xs bg-yellow-50 text-yellow-800 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                                                                                            {
                                                                                                skipped.order_number ||
                                                                                                '-'
                                                                                            }
                                                                                        </span>

                                                                                        <span className="text-xs text-yellow-700">
                                                                                            {
                                                                                                skipped.reason
                                                                                            }
                                                                                        </span>

                                                                                    </div>
                                                                                )
                                                                            )}

                                                                        </div>
                                                                    </div>
                                                                )}

                                                            {/* Go To Outbound */}

                                                            <div className="pt-3 border-t border-green-200">

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        router.push(
                                                                            '/wms/outbound/data'
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                                                                >
                                                                    <FileSpreadsheet className="w-4 h-4" />
                                                                    View Outbound Data
                                                                </button>

                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* =================================================
                                                        ERROR
                                                    ================================================= */}

                                                    {!uploadResult.success && (
                                                        <div className="mt-3 text-sm text-red-700 space-y-4">

                                                            {/* Validation Errors */}

                                                            {uploadResult.validation_errors &&
                                                                uploadResult
                                                                    .validation_errors
                                                                    .length >
                                                                    0 && (
                                                                    <div>

                                                                        <p className="font-medium mb-2">
                                                                            Validation Errors (
                                                                            {
                                                                                uploadResult
                                                                                    .validation_errors
                                                                                    .length
                                                                            }
                                                                            )
                                                                        </p>

                                                                        <div className="max-h-60 overflow-y-auto bg-white rounded p-2 border border-red-200 space-y-2">

                                                                            {uploadResult.validation_errors.map(
                                                                                (
                                                                                    validation,
                                                                                    index
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            index
                                                                                        }
                                                                                        className="pb-2 border-b border-red-100 last:border-b-0"
                                                                                    >

                                                                                        <p>

                                                                                            <span className="font-medium">
                                                                                                Row{' '}
                                                                                                {
                                                                                                    validation.row
                                                                                                }
                                                                                            </span>

                                                                                            <span className="mx-1 text-red-400">
                                                                                                ·
                                                                                            </span>

                                                                                            <span className="font-mono text-xs bg-red-50 px-1 rounded">
                                                                                                {
                                                                                                    validation.field
                                                                                                }
                                                                                            </span>

                                                                                        </p>

                                                                                        <p className="text-xs text-red-600 mt-0.5">
                                                                                            {
                                                                                                validation.message
                                                                                            }
                                                                                        </p>

                                                                                    </div>
                                                                                )
                                                                            )}

                                                                        </div>
                                                                    </div>
                                                                )}

                                                            {/* Errors */}

                                                            {uploadResult.errors &&
                                                                uploadResult
                                                                    .errors
                                                                    .length >
                                                                    0 && (
                                                                    <div>

                                                                        <p className="font-medium mb-2">
                                                                            Processing Errors (
                                                                            {
                                                                                uploadResult
                                                                                    .errors
                                                                                    .length
                                                                            }
                                                                            )
                                                                        </p>

                                                                        <div className="max-h-60 overflow-y-auto bg-white rounded p-2 border border-red-200 space-y-2">

                                                                            {uploadResult.errors.map(
                                                                                (
                                                                                    error,
                                                                                    index
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            index
                                                                                        }
                                                                                        className="pb-2 border-b border-red-100 last:border-b-0"
                                                                                    >

                                                                                        <p>

                                                                                            <span className="font-medium">
                                                                                                Row{' '}
                                                                                                {
                                                                                                    error.row
                                                                                                }
                                                                                                :
                                                                                            </span>{' '}

                                                                                            {
                                                                                                error.message
                                                                                            }

                                                                                        </p>

                                                                                        {error.detail && (
                                                                                            <p className="text-xs text-red-500 mt-0.5">
                                                                                                {
                                                                                                    error.detail
                                                                                                }
                                                                                            </p>
                                                                                        )}

                                                                                    </div>
                                                                                )
                                                                            )}

                                                                        </div>
                                                                    </div>
                                                                )}

                                                            {/* Skipped Orders */}

                                                            {uploadResult.skipped_orders &&
                                                                uploadResult
                                                                    .skipped_orders
                                                                    .length >
                                                                    0 && (
                                                                    <div>

                                                                        <p className="font-medium mb-2 text-yellow-800">
                                                                            {
                                                                                uploadResult
                                                                                    .skipped_orders
                                                                                    .length
                                                                            }{' '}
                                                                            order(s) were skipped
                                                                        </p>

                                                                        <div className="max-h-48 overflow-y-auto bg-white rounded p-2 border border-yellow-200 space-y-1">

                                                                            {uploadResult.skipped_orders.map(
                                                                                (
                                                                                    skipped,
                                                                                    index
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            index
                                                                                        }
                                                                                        className="flex items-start gap-2 pb-1 border-b border-yellow-100 last:border-b-0"
                                                                                    >

                                                                                        <span className="font-mono text-xs bg-yellow-50 text-yellow-800 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                                                                                            {
                                                                                                skipped.order_number ||
                                                                                                '-'
                                                                                            }
                                                                                        </span>

                                                                                        <span className="text-xs text-yellow-700">
                                                                                            {
                                                                                                skipped.reason
                                                                                            }
                                                                                        </span>

                                                                                    </div>
                                                                                )
                                                                            )}

                                                                        </div>
                                                                    </div>
                                                                )}

                                                        </div>
                                                    )}
                                                </div>

                                                {/* Close */}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowAlert(
                                                            false
                                                        )
                                                    }
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

export default FurunoExcelUpload;