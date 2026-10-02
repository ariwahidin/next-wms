/* eslint-disable @typescript-eslint/no-explicit-any */

import React, {
    useEffect,
    useRef,
    useState,
} from 'react';

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
// TYPES
// ============================================================================

interface SelectOption {
    value: string;
    label: string;
}

interface FurunoPreviewRow {
    excelRow: number;

    receiptId: string;

    code: string;

    partCode: string;

    itemName: string;

    modelName: string;

    quantity: string;

    unit: string;

    date: string;

    supplierId: string;

    supplier: string;

    serialNumber: string;

    eligible: boolean;
}

interface ExcelPreviewData {
    headers: string[];

    rows: FurunoPreviewRow[];

    fileName: string;

    fileSize: string;

    totalDataRows: number;

    validRows: number;

    skippedRows: number;

    uniqueReceiptNumbers: number;
}

interface SkippedReceipt {
    receipt_id?: string;

    reason: string;
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

    success_count?: number;

    failed_count?: number;

    inbound_numbers?: string[];

    skipped_receipts?: SkippedReceipt[];

    errors?: UploadError[];

    validation_errors?: ValidationError[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_FILE_SIZE =
    10 * 1024 * 1024;

const MAX_PREVIEW_ROWS = 20;

const TARGET_SHEET_NAME =
    'Receive Item Detail';

const REQUIRED_HEADERS = [
    'Receive No Receive Item',
    'Date',
    'Code#',
    'Part Code Item',
    'Item Name',
    'Model Name',
    'Quantity',
    'Unit',
    'Supplier ID Supplier Receive Item',
    'Supplier',
    'Serial/Production Number',
] as const;

const PREVIEW_HEADERS = [
    'Receive No',
    'Code#',
    'Part Code',
    'Item Name',
    'Model Name',
    'Qty',
    'Unit',
    'Date',
    'Supplier ID',
    'Supplier',
    'Serial / Production Number',
] as const;

// ============================================================================
// UTILITY
// ============================================================================

const formatFileSize = (
    bytes: number
): string => {
    if (bytes === 0) {
        return '0 Bytes';
    }

    const k = 1024;

    const sizes = [
        'Bytes',
        'KB',
        'MB',
        'GB',
    ];

    const i = Math.floor(
        Math.log(bytes) /
        Math.log(k)
    );

    return (
        Math.round(
            (bytes /
                Math.pow(k, i)) *
            100
        ) /
        100 +
        ' ' +
        sizes[i]
    );
};

const isValidExcel = (
    file: File
): boolean => {
    return file.name
        .toLowerCase()
        .endsWith('.xlsx');
};

const excelSerialToDate = (
    serial: number
): string => {
    const epoch = new Date(
        Date.UTC(
            1899,
            11,
            30
        )
    );

    const milliseconds =
        serial *
        24 *
        60 *
        60 *
        1000;

    const date = new Date(
        epoch.getTime() +
        milliseconds
    );

    return date
        .toISOString()
        .split('T')[0];
};

const normalizeHeader = (
    value: unknown
): string => {
    return String(value ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
};

// ============================================================================
// CELL STRING
// ============================================================================

const getCellString = (
    row: ExcelJS.Row,
    columnNumber: number,
    headerName?: string
): string => {
    if (!columnNumber) {
        return '';
    }

    const cell =
        row.getCell(
            columnNumber
        );

    const value =
        cell.value;

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

    // Formula / rich text / hyperlink
    if (
        typeof value ===
        'object' &&
        value !== null
    ) {
        if ('result' in value) {
            const result =
                (
                    value as any
                ).result;

            if (
                typeof result ===
                'number' &&
                headerName &&
                normalizeHeader(
                    headerName
                ) ===
                normalizeHeader(
                    'Date'
                )
            ) {
                return excelSerialToDate(
                    result
                );
            }

            return String(
                result ?? ''
            ).trim();
        }

        if (
            'richText' in
            value
        ) {
            const richText =
                (
                    value as any
                ).richText;

            if (
                Array.isArray(
                    richText
                )
            ) {
                return richText
                    .map(
                        (
                            item: any
                        ) =>
                            String(
                                item?.text ??
                                ''
                            )
                    )
                    .join('')
                    .trim();
            }
        }

        if (
            'text' in value
        ) {
            return String(
                (
                    value as any
                ).text ?? ''
            ).trim();
        }

        if (
            'hyperlink' in
            value
        ) {
            return String(
                (
                    value as any
                ).text ??
                (
                    value as any
                ).hyperlink ??
                ''
            ).trim();
        }
    }

    // Excel serial date
    if (
        typeof value ===
        'number' &&
        headerName &&
        normalizeHeader(
            headerName
        ) ===
        normalizeHeader(
            'Date'
        ) &&
        value > 40000
    ) {
        return excelSerialToDate(
            value
        );
    }

    return String(
        value
    ).trim();
};

// ============================================================================
// GET CELL BY HEADER
// ============================================================================

const getCellByHeader = (
    row: ExcelJS.Row,
    headerMap: Record<
        string,
        number
    >,
    headerName: string
): string => {
    const columnNumber =
        headerMap[
        normalizeHeader(
            headerName
        )
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

// ============================================================================
// GET RAW CELL
// ============================================================================

const getRawCellByHeader = (
    row: ExcelJS.Row,
    headerMap: Record<
        string,
        number
    >,
    headerName: string
): ExcelJS.CellValue => {
    const columnNumber =
        headerMap[
        normalizeHeader(
            headerName
        )
        ];

    if (!columnNumber) {
        return '';
    }

    return (
        row.getCell(
            columnNumber
        ).value ?? ''
    );
};

// ============================================================================
// BUILD HEADER MAP
// ============================================================================

const buildHeaderMap = (
    worksheet: ExcelJS.Worksheet
): {
    headerMap: Record<
        string,
        number
    >;

    actualHeaders: string[];

    headerRowNumber: number;
} => {
    let bestHeaderMap: Record<
        string,
        number
    > = {};

    let bestActualHeaders: string[] =
        [];

    let bestHeaderRowNumber = 1;

    let bestScore = -1;

    const knownHeaders = [
        ...REQUIRED_HEADERS,
    ];

    const maxHeaderScanRows =
        Math.min(
            worksheet.rowCount,
            10
        );

    for (
        let rowNumber = 1;
        rowNumber <=
        maxHeaderScanRows;
        rowNumber++
    ) {
        const row =
            worksheet.getRow(
                rowNumber
            );

        const candidateMap: Record<
            string,
            number
        > = {};

        const candidateHeaders: string[] =
            [];

        row.eachCell(
            {
                includeEmpty: true,
            },
            (
                cell,
                columnNumber
            ) => {
                const header =
                    getCellString(
                        row,
                        columnNumber
                    );

                if (!header) {
                    return;
                }

                candidateHeaders.push(
                    header
                );

                const normalized =
                    normalizeHeader(
                        header
                    );

                if (
                    !candidateMap[
                    normalized
                    ]
                ) {
                    candidateMap[
                        normalized
                    ] =
                        columnNumber;
                }
            }
        );

        const score =
            knownHeaders.reduce(
                (
                    total,
                    header
                ) =>
                    total +
                    (candidateMap[
                        normalizeHeader(
                            header
                        )
                    ]
                        ? 1
                        : 0),
                0
            );

        if (
            score >
            bestScore
        ) {
            bestScore =
                score;

            bestHeaderMap =
                candidateMap;

            bestActualHeaders =
                candidateHeaders;

            bestHeaderRowNumber =
                rowNumber;
        }
    }

    return {
        headerMap:
            bestHeaderMap,

        actualHeaders:
            bestActualHeaders,

        headerRowNumber:
            bestHeaderRowNumber,
    };
};

// ============================================================================
// MEANINGFUL ROW
// ============================================================================

const isMeaningfulRow = (
    row: FurunoPreviewRow
): boolean => {
    return Boolean(
        row.receiptId ||
        row.code ||
        row.partCode ||
        row.itemName ||
        row.modelName ||
        row.quantity ||
        row.unit ||
        row.date ||
        row.supplierId ||
        row.supplier ||
        row.serialNumber
    );
};

// ============================================================================
// NORMALIZE ITEM CODE
// ============================================================================

const normalizeItemCode = (
    value: string
): string => {
    const raw =
        value.trim();

    if (!raw) {
        return '';
    }

    // Excel sometimes converts:
    // 12345 -> "12345"
    // 12345.0 -> "12345.0"
    //
    // We remove ".0" only when
    // the decimal part consists
    // entirely of zeroes.

    if (
        raw.includes('.')
    ) {
        const parts =
            raw.split('.');

        if (
            parts.length ===
            2 &&
            /^0+$/.test(
                parts[1]
            )
        ) {
            return parts[0];
        }
    }

    return raw;
};

// ============================================================================
// NORMALIZE WORKBOOK
// ============================================================================

const normalizeFurunoWorkbookForUpload =
    async (
        sourceFile: File
    ): Promise<File> => {
        const workbook =
            new ExcelJS.Workbook();

        await workbook.xlsx.load(
            await sourceFile.arrayBuffer()
        );

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
            throw new Error(
                `Required worksheet "${TARGET_SHEET_NAME}" was not found.`
            );
        }

        const {
            headerMap,
        } =
            buildHeaderMap(
                worksheet
            );

        const outputWorkbook =
            new ExcelJS.Workbook();

        const outputWorksheet =
            outputWorkbook.addWorksheet(
                TARGET_SHEET_NAME
            );

        // Keep exactly the backend
        // expected headers.

        const outputHeaders = [
            'Receive No Receive Item',
            'Date',
            'Code#',
            'Part Code Item',
            'Item Name',
            'Model Name',
            'Quantity',
            'Unit',
            'Supplier ID Supplier Receive Item',
            'Supplier',
            'Serial/Production Number',
        ];

        outputWorksheet.addRow(
            outputHeaders
        );

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

            const values: ExcelJS.CellValue[] =
                [
                    getRawCellByHeader(
                        row,
                        headerMap,
                        'Receive No Receive Item'
                    ),

                    getRawCellByHeader(
                        row,
                        headerMap,
                        'Date'
                    ),

                    getRawCellByHeader(
                        row,
                        headerMap,
                        'Code#'
                    ),

                    getRawCellByHeader(
                        row,
                        headerMap,
                        'Part Code Item'
                    ),

                    getRawCellByHeader(
                        row,
                        headerMap,
                        'Item Name'
                    ),

                    getRawCellByHeader(
                        row,
                        headerMap,
                        'Model Name'
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
                        'Supplier ID Supplier Receive Item'
                    ),

                    getRawCellByHeader(
                        row,
                        headerMap,
                        'Supplier'
                    ),

                    getRawCellByHeader(
                        row,
                        headerMap,
                        'Serial/Production Number'
                    ),
                ];

            const hasData =
                values.some(
                    (
                        value
                    ) =>
                        String(
                            value ??
                            ''
                        ).trim() !==
                        ''
                );

            if (
                hasData
            ) {
                outputWorksheet.addRow(
                    values
                );
            }
        }

        outputWorksheet.columns.forEach(
            (column) => {
                column.width =
                    24;
            }
        );

        const headerRow =
            outputWorksheet.getRow(
                1
            );

        headerRow.font = {
            bold: true,
        };

        headerRow.alignment = {
            vertical:
                'middle',
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
// COMPONENT
// ============================================================================

const FurunoExcelUpload: React.FC =
    () => {
        // =====================================================================
        // FILE
        // =====================================================================

        const [
            file,
            setFile,
        ] =
            useState<File | null>(
                null
            );

        // =====================================================================
        // PREVIEW
        // =====================================================================

        const [
            preview,
            setPreview,
        ] =
            useState<ExcelPreviewData | null>(
                null
            );

        // =====================================================================
        // UPLOAD
        // =====================================================================

        const [
            loading,
            setLoading,
        ] =
            useState(false);

        const [
            uploadResult,
            setUploadResult,
        ] =
            useState<UploadResponse | null>(
                null
            );

        // =====================================================================
        // UI
        // =====================================================================

        const [
            showAlert,
            setShowAlert,
        ] =
            useState(false);

        const [
            isDragging,
            setIsDragging,
        ] =
            useState(false);

        // =====================================================================
        // MASTER
        // =====================================================================

        const [
            ownerOptions,
            setOwnerOptions,
        ] =
            useState<SelectOption[]>(
                []
            );

        const [
            whsOptions,
            setWhsOptions,
        ] =
            useState<SelectOption[]>(
                []
            );

        const [
            selectedOwner,
            setSelectedOwner,
        ] =
            useState('');

        const [
            selectedWhs,
            setSelectedWhs,
        ] =
            useState('');

        // =====================================================================
        // HANDLING
        // =====================================================================

        const [
            handlingId,
            setHandlingId,
        ] =
            useState('');

        // =====================================================================
        // REFS
        // =====================================================================

        const fileInputRef =
            useRef<HTMLInputElement>(
                null
            );

        const alertRef =
            useRef<HTMLDivElement>(
                null
            );

        // =====================================================================
        // INITIAL LOAD
        // =====================================================================

        useEffect(() => {
            fetchOwners();

            fetchWarehouses();
        }, []);

        // =====================================================================
        // FETCH OWNERS
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
                                    .data ??
                                []
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
                } catch (
                error
                ) {
                    console.error(
                        'Failed to fetch owners:',
                        error
                    );
                }
            };

        // =====================================================================
        // FETCH WAREHOUSES
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
                                    .data ??
                                []
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
                } catch (
                error
                ) {
                    console.error(
                        'Failed to fetch warehouses:',
                        error
                    );
                }
            };

        // =====================================================================
        // CLEAR
        // =====================================================================

        const clearFile =
            () => {
                setFile(null);

                setPreview(null);

                setUploadResult(
                    null
                );

                setShowAlert(false);

                if (
                    fileInputRef.current
                ) {
                    fileInputRef.current.value =
                        '';
                }
            };

        // =====================================================================
        // VALIDATE FILE
        // =====================================================================

        const validateFile =
            (
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
                    selectedFile.size ===
                    0
                ) {
                    alert(
                        'The selected file is empty.'
                    );

                    return false;
                }

                return true;
            };

        // =====================================================================
        // FILE CHANGE
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

                setFile(
                    selected
                );

                setPreview(
                    null
                );

                setUploadResult(
                    null
                );

                setShowAlert(
                    false
                );

                await generatePreview(
                    selected
                );
            };

        // =====================================================================
        // DRAG
        // =====================================================================

        const handleDragEnter =
            (
                e: React.DragEvent
            ) => {
                e.preventDefault();

                e.stopPropagation();

                setIsDragging(
                    true
                );
            };

        const handleDragLeave =
            (
                e: React.DragEvent
            ) => {
                e.preventDefault();

                e.stopPropagation();

                setIsDragging(
                    false
                );
            };

        const handleDragOver =
            (
                e: React.DragEvent
            ) => {
                e.preventDefault();

                e.stopPropagation();
            };

        const handleDrop =
            async (
                e: React.DragEvent
            ) => {
                e.preventDefault();

                e.stopPropagation();

                setIsDragging(
                    false
                );

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

                setFile(
                    dropped
                );

                setPreview(
                    null
                );

                setUploadResult(
                    null
                );

                setShowAlert(
                    false
                );

                await generatePreview(
                    dropped
                );
            };

        // =====================================================================
        // GENERATE PREVIEW
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
                    // FIND SHEET
                    // ---------------------------------------------------------

                    const worksheet =
                        workbook.worksheets.find(
                            (
                                ws
                            ) =>
                                normalizeHeader(
                                    ws.name
                                ) ===
                                normalizeHeader(
                                    TARGET_SHEET_NAME
                                )
                        );

                    if (
                        !worksheet
                    ) {
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
                    // HEADER
                    // ---------------------------------------------------------

                    const {
                        headerMap,
                        actualHeaders,
                    } =
                        buildHeaderMap(
                            worksheet
                        );

                    // ---------------------------------------------------------
                    // VALIDATE REQUIRED HEADERS
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
                            `Invalid Furuno inbound Excel template.\n\nMissing required headers:\n${missingHeaders
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
                    // READ DATA
                    // ---------------------------------------------------------

                    const rows: FurunoPreviewRow[] =
                        [];

                    const receiptSet =
                        new Set<string>();

                    let totalDataRows =
                        0;

                    let validRows =
                        0;

                    let skippedRows =
                        0;

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

                        // =====================================================
                        // READ
                        // =====================================================

                        const receiptId =
                            getCellByHeader(
                                row,
                                headerMap,
                                'Receive No Receive Item'
                            );

                        const codeRaw =
                            getCellByHeader(
                                row,
                                headerMap,
                                'Code#'
                            );

                        const code =
                            normalizeItemCode(
                                codeRaw
                            );

                        const partCode =
                            getCellByHeader(
                                row,
                                headerMap,
                                'Part Code Item'
                            );

                        const itemName =
                            getCellByHeader(
                                row,
                                headerMap,
                                'Item Name'
                            );

                        const modelName =
                            getCellByHeader(
                                row,
                                headerMap,
                                'Model Name'
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

                        const date =
                            getCellByHeader(
                                row,
                                headerMap,
                                'Date'
                            );

                        const supplierId =
                            getCellByHeader(
                                row,
                                headerMap,
                                'Supplier ID Supplier Receive Item'
                            );

                        const supplier =
                            getCellByHeader(
                                row,
                                headerMap,
                                'Supplier'
                            );

                        const serialNumber =
                            getCellByHeader(
                                row,
                                headerMap,
                                'Serial/Production Number'
                            );

                        // =====================================================
                        // PREVIEW ROW
                        // =====================================================

                        const previewRow:
                            FurunoPreviewRow =
                        {
                            excelRow:
                                rowNumber,

                            receiptId,

                            code,

                            partCode,

                            itemName,

                            modelName,

                            quantity,

                            unit,

                            date,

                            supplierId,

                            supplier,

                            serialNumber,

                            eligible:
                                false,
                        };

                        // =====================================================
                        // EMPTY ROW
                        // =====================================================

                        if (
                            !isMeaningfulRow(
                                previewRow
                            )
                        ) {
                            continue;
                        }

                        totalDataRows++;

                        // =====================================================
                        // BASIC VALIDATION
                        // =====================================================

                        const isValid =
                            Boolean(
                                receiptId &&
                                code &&
                                quantity &&
                                unit &&
                                date &&
                                supplierId &&
                                supplier
                            );

                        previewRow.eligible =
                            isValid;

                        if (
                            isValid
                        ) {
                            validRows++;
                        } else {
                            skippedRows++;
                        }

                        // =====================================================
                        // UNIQUE RECEIPT
                        // =====================================================

                        if (
                            receiptId
                        ) {
                            receiptSet.add(
                                receiptId
                            );
                        }

                        // =====================================================
                        // PREVIEW LIMIT
                        // =====================================================

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
                    // SET PREVIEW
                    // ---------------------------------------------------------

                    setPreview(
                        {
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

                            validRows,

                            skippedRows,

                            uniqueReceiptNumbers:
                                receiptSet.size,
                        }
                    );
                } catch (
                error
                ) {
                    console.error(
                        'Failed to preview Furuno inbound Excel:',
                        error
                    );

                    alert(
                        'Failed to read the Excel file. Please verify that the file is a valid .xlsx workbook and follows the Furuno inbound template.'
                    );

                    clearFile();
                }
            };

        // =====================================================================
        // UPLOAD
        // =====================================================================

        const handleUpload =
            async () => {
                if (!file) {
                    alert(
                        'Please select an Excel file before uploading.'
                    );

                    return;
                }

                if (
                    !selectedOwner
                ) {
                    alert(
                        'Please select an Owner before uploading.'
                    );

                    return;
                }

                if (
                    !selectedWhs
                ) {
                    alert(
                        'Please select a Warehouse before uploading.'
                    );

                    return;
                }

                // if (
                //     !handlingId
                // ) {
                //     alert(
                //         'Please enter Handling ID before uploading.'
                //     );

                //     return;
                // }

                const parsedHandlingId =
                    Number(
                        handlingId
                    );

                // if (
                //     !Number.isInteger(
                //         parsedHandlingId
                //     ) ||
                //     parsedHandlingId <=
                //     0
                // ) {
                //     alert(
                //         'Handling ID must be a positive integer.'
                //     );

                //     return;
                // }

                if (!preview) {
                    alert(
                        'Please wait until the file preview is ready.'
                    );

                    return;
                }

                if (
                    preview.validRows ===
                    0
                ) {
                    alert(
                        'No valid records were found in the Excel file.'
                    );

                    return;
                }

                setLoading(
                    true
                );

                setUploadResult(
                    null
                );

                setShowAlert(
                    false
                );

                try {
                    const formData =
                        new FormData();

                    // ---------------------------------------------------------
                    // Normalize workbook
                    // ---------------------------------------------------------

                    const normalizedFile =
                        await normalizeFurunoWorkbookForUpload(
                            file
                        );

                    formData.append(
                        'file',
                        normalizedFile
                    );

                    // ---------------------------------------------------------
                    // Configuration
                    // ---------------------------------------------------------

                    formData.append(
                        'owner_code',
                        selectedOwner
                    );

                    formData.append(
                        'whs_code',
                        selectedWhs
                    );

                    formData.append(
                        'handling_id',
                        String(
                            parsedHandlingId
                        )
                    );

                    // ---------------------------------------------------------
                    // API
                    // ---------------------------------------------------------

                    const res =
                        await api.post(
                            '/inbound/upload-furuno-excel',
                            formData,
                            {
                                withCredentials:
                                    true,

                                headers:
                                {
                                    'Content-Type':
                                        'multipart/form-data',
                                },
                            }
                        );

                    setUploadResult(
                        res.data
                    );

                    setShowAlert(
                        true
                    );
                } catch (
                error: any
                ) {
                    console.error(
                        'Furuno inbound upload error:',
                        error
                    );

                    const errorData =
                        error
                            .response
                            ?.data;

                    setUploadResult(
                        errorData ||
                        {
                            success:
                                false,

                            message:
                                'Upload failed. Please try again.',

                            errors:
                                [
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

                    setShowAlert(
                        true
                    );
                } finally {
                    setLoading(
                        false
                    );
                }
            };

        // =====================================================================
        // RENDER
        // =====================================================================

        return (
            <Layout
                title="Inbound"
                subTitle="Import Furuno Excel"
            >
                <div className="min-h-screen bg-gray-50 p-6">
                    <div className="max-w-7xl mx-auto">

                        {/* =====================================================
                            BACK
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

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                    {/* =================================================
                                        OWNER
                                    ================================================= */}

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

                                    {/* =================================================
                                        WAREHOUSE
                                    ================================================= */}

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
                                            Target warehouse
                                        </p>

                                    </div>

                                    {/* =================================================
                                        HANDLING ID
                                    ================================================= */}

                                    {/* <div>

                                        <label className="block text-sm font-medium text-gray-700 mb-1">

                                            Handling ID{' '}

                                            <span className="text-red-500">
                                                *
                                            </span>

                                        </label>

                                        <input
                                            type="number"
                                            min={1}
                                            value={
                                                handlingId
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setHandlingId(
                                                    e.target
                                                        .value
                                                )
                                            }
                                            disabled={
                                                loading
                                            }
                                            placeholder="e.g. 1"
                                            className="
                                                w-full
                                                h-[38px]
                                                rounded-md
                                                border
                                                border-gray-300
                                                px-3
                                                text-sm
                                                outline-none
                                                focus:border-blue-500
                                                focus:ring-1
                                                focus:ring-blue-500
                                                disabled:bg-gray-100
                                            "
                                        />

                                        <p className="mt-1 text-xs text-gray-400">
                                            Handling master ID
                                        </p>

                                    </div> */}

                                </div>

                                {/* =================================================
                                    IMPORT RULES
                                ================================================= */}

                                <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-lg">

                                    <div className="flex gap-3">

                                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />

                                        <div className="text-sm text-blue-800">

                                            <p className="font-semibold mb-2">
                                                Furuno Inbound Excel Import Rules
                                            </p>

                                            <ul className="list-disc list-inside space-y-1 text-xs">

                                                <li>
                                                    Required worksheet:
                                                    <strong className="ml-1">
                                                        Receive Item Detail
                                                    </strong>
                                                </li>

                                                <li>
                                                    <strong>
                                                        Receive No Receive Item
                                                    </strong>
                                                    {' '}
                                                    is used as Receipt ID.
                                                </li>

                                                <li>
                                                    <strong>
                                                        Code#
                                                    </strong>
                                                    {' '}
                                                    is used as Item Code.
                                                </li>

                                                <li>
                                                    <strong>
                                                        Part Code Item
                                                    </strong>
                                                    {' '}
                                                    is stored as Remarks.
                                                </li>

                                                <li>
                                                    Quantity and Unit are taken directly from Excel.
                                                </li>

                                                <li>
                                                    Supplier ID and Supplier are taken from Excel.
                                                </li>

                                                <li>
                                                    Serial/Production Number supports comma-separated serial numbers.
                                                </li>

                                                <li>
                                                    One unique Receive No creates one Inbound Header.
                                                </li>

                                                <li>
                                                    Each Excel item row creates one Inbound Detail.
                                                </li>

                                                <li>
                                                    Duplicate Receipt IDs already existing in the database will be skipped by backend.
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

                                {/* DROP ZONE */}

                                <div
                                    className={`
                                        border-2 border-dashed rounded-lg p-8 text-center
                                        transition-all duration-200
                                        ${isDragging
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
                                        id="furuno-inbound-file-upload"
                                    />

                                    <label
                                        htmlFor="furuno-inbound-file-upload"
                                        className="cursor-pointer inline-flex flex-col items-center"
                                    >

                                        <Upload
                                            className={`
                                                w-12 h-12 mb-3
                                                ${isDragging
                                                    ? 'text-blue-600 animate-bounce'
                                                    : 'text-gray-400'
                                                }
                                            `}
                                        />

                                        <span
                                            className={`
                                                text-sm font-medium mb-1
                                                ${isDragging
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
                                            Furuno Inbound Excel workbook (.xlsx) — maximum 10 MB
                                        </span>

                                    </label>

                                </div>

                                {/* SELECTED FILE */}

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

                                {/* ACTIONS */}

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
                                                // !handlingId ||
                                                !preview ||
                                                preview.validRows ===
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

                                                    Upload & Create Inbound
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

                                {/* CONFIG WARNING */}

                                {file &&
                                    (
                                        !selectedOwner ||
                                        !selectedWhs ||
                                        !handlingId
                                    ) && (
                                        <div className="mt-3 flex items-center gap-2 text-xs text-amber-600">

                                            <AlertTriangle className="w-4 h-4" />

                                            <span>
                                                Select Owner, Warehouse before uploading.
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

                                    </div>

                                    {/* =================================================
                                        STATS
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
                                                    preview.validRows
                                                }
                                            </p>

                                            <p className="text-xs text-green-600">
                                                Valid Rows
                                            </p>

                                        </div>

                                        <div className="bg-yellow-50 rounded-lg p-3 text-center">

                                            <p className="text-2xl font-bold text-yellow-700">
                                                {
                                                    preview.skippedRows
                                                }
                                            </p>

                                            <p className="text-xs text-yellow-600">
                                                Invalid Rows
                                            </p>

                                        </div>

                                        <div className="bg-purple-50 rounded-lg p-3 text-center">

                                            <p className="text-2xl font-bold text-purple-700">
                                                {
                                                    preview.uniqueReceiptNumbers
                                                }
                                            </p>

                                            <p className="text-xs text-purple-600">
                                                Unique Receipts
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
                                        INVALID WARNING
                                    ================================================= */}

                                    {preview.skippedRows >
                                        0 && (
                                            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">

                                                <div className="flex gap-2">

                                                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />

                                                    <div className="text-xs text-yellow-800">

                                                        <p className="font-semibold">
                                                            Some rows need attention
                                                        </p>

                                                        <p className="mt-1">
                                                            {
                                                                preview.skippedRows
                                                            }{' '}
                                                            row(s) are missing one or more required values.
                                                        </p>

                                                    </div>

                                                </div>

                                            </div>
                                        )}

                                    {/* =================================================
                                        NO DATA
                                    ================================================= */}

                                    {preview.validRows ===
                                        0 && (
                                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">

                                                <div className="flex gap-2">

                                                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />

                                                    <div className="text-xs text-red-800">

                                                        <p className="font-semibold">
                                                            No valid records found
                                                        </p>

                                                        <p className="mt-1">
                                                            Please check the required Excel fields.
                                                        </p>

                                                    </div>

                                                </div>

                                            </div>
                                        )}

                                    {/* =================================================
                                        PREVIEW TABLE
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
                                                                key={`${header}-${index}`}
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
                                                                ${row.eligible
                                                                    ? ''
                                                                    : 'bg-yellow-50'
                                                                }
                                                            `}
                                                        >

                                                            {/* ROW */}

                                                            <td className="px-3 py-2 text-sm text-gray-400">
                                                                {
                                                                    row.excelRow
                                                                }
                                                            </td>

                                                            {/* RECEIPT */}

                                                            <td className="px-3 py-2 text-sm font-mono font-semibold text-purple-700 whitespace-nowrap">
                                                                {
                                                                    row.receiptId ||
                                                                    '—'
                                                                }
                                                            </td>

                                                            {/* CODE */}

                                                            <td className="px-3 py-2 text-sm font-mono font-semibold text-blue-700 whitespace-nowrap">
                                                                {
                                                                    row.code ||
                                                                    '—'
                                                                }
                                                            </td>

                                                            {/* PART CODE */}

                                                            <td className="px-3 py-2 text-sm font-mono font-medium text-emerald-700 whitespace-nowrap">
                                                                {
                                                                    row.partCode ||
                                                                    '—'
                                                                }
                                                            </td>

                                                            {/* ITEM */}

                                                            <td className="px-3 py-2 text-sm text-gray-900 max-w-xs">

                                                                <div
                                                                    className="truncate"
                                                                    title={
                                                                        row.itemName
                                                                    }
                                                                >
                                                                    {
                                                                        row.itemName ||
                                                                        '—'
                                                                    }
                                                                </div>

                                                            </td>

                                                            {/* MODEL */}

                                                            <td className="px-3 py-2 text-sm text-gray-700 max-w-xs">

                                                                <div
                                                                    className="truncate"
                                                                    title={
                                                                        row.modelName
                                                                    }
                                                                >
                                                                    {
                                                                        row.modelName ||
                                                                        '—'
                                                                    }
                                                                </div>

                                                            </td>

                                                            {/* QTY */}

                                                            <td className="px-3 py-2 text-sm text-right font-semibold text-gray-900 whitespace-nowrap">
                                                                {
                                                                    row.quantity ||
                                                                    '—'
                                                                }
                                                            </td>

                                                            {/* UNIT */}

                                                            <td className="px-3 py-2 text-sm text-gray-600 whitespace-nowrap">
                                                                {
                                                                    row.unit ||
                                                                    '—'
                                                                }
                                                            </td>

                                                            {/* DATE */}

                                                            <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                                                                {
                                                                    row.date ||
                                                                    '—'
                                                                }
                                                            </td>

                                                            {/* SUPPLIER ID */}

                                                            <td className="px-3 py-2 text-sm font-mono font-medium text-indigo-700 whitespace-nowrap">
                                                                {
                                                                    row.supplierId ||
                                                                    '—'
                                                                }
                                                            </td>

                                                            {/* SUPPLIER */}

                                                            <td className="px-3 py-2 text-sm text-gray-900 max-w-xs">

                                                                <div
                                                                    className="truncate"
                                                                    title={
                                                                        row.supplier
                                                                    }
                                                                >
                                                                    {
                                                                        row.supplier ||
                                                                        '—'
                                                                    }
                                                                </div>

                                                            </td>

                                                            {/* SERIAL */}

                                                            <td className="px-3 py-2 text-sm font-mono text-slate-600 whitespace-nowrap max-w-xs">

                                                                <div
                                                                    className="truncate"
                                                                    title={
                                                                        row.serialNumber
                                                                    }
                                                                >
                                                                    {
                                                                        row.serialNumber ||
                                                                        '—'
                                                                    }
                                                                </div>

                                                            </td>

                                                            {/* STATUS */}

                                                            <td className="px-3 py-2 text-center whitespace-nowrap">

                                                                {row.eligible ? (
                                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">

                                                                        <CheckCircle2 className="w-4 h-4" />

                                                                        Import

                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700">

                                                                        <AlertTriangle className="w-4 h-4" />

                                                                        Check

                                                                    </span>
                                                                )}

                                                            </td>

                                                        </tr>
                                                    )
                                                )}

                                            </tbody>

                                        </table>

                                    </div>

                                    {preview.rows.length ===
                                        MAX_PREVIEW_ROWS &&
                                        preview.totalDataRows >
                                        MAX_PREVIEW_ROWS && (
                                            <p className="mt-2 text-xs text-gray-400">
                                                Only the first{' '}
                                                {
                                                    MAX_PREVIEW_ROWS
                                                }{' '}
                                                rows are displayed. The complete file will be processed by the backend.
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
                                                ${uploadResult.success
                                                    ? 'bg-green-50 border border-green-200'
                                                    : 'bg-red-50 border border-red-200'
                                                }
                                            `}
                                        >

                                            <div className="flex">

                                                {/* ICON */}

                                                <div className="flex-shrink-0 mt-0.5">

                                                    {uploadResult.success ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                    ) : (
                                                        <XCircle className="h-5 w-5 text-red-600" />
                                                    )}

                                                </div>

                                                {/* CONTENT */}

                                                <div className="ml-3 flex-1 min-w-0">

                                                    <h3
                                                        className={`
                                                            text-sm font-semibold
                                                            ${uploadResult.success
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
                                                        SUCCESS STATS
                                                    ================================================= */}

                                                    {uploadResult.success && (
                                                        <div className="mt-3 space-y-4 text-sm text-green-700">

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

                                                                {uploadResult.processed_rows !==
                                                                    undefined && (
                                                                        <p>
                                                                            Processed Rows:{' '}
                                                                            <strong>
                                                                                {
                                                                                    uploadResult.processed_rows
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

                                                            {/* =================================================
                                                                INBOUND NUMBERS
                                                            ================================================= */}

                                                            {uploadResult.inbound_numbers &&
                                                                uploadResult
                                                                    .inbound_numbers
                                                                    .length >
                                                                0 && (
                                                                    <div>

                                                                        <p className="font-medium mb-2">
                                                                            Created Inbound Numbers (
                                                                            {
                                                                                uploadResult
                                                                                    .inbound_numbers
                                                                                    .length
                                                                            }
                                                                            ):
                                                                        </p>

                                                                        <div className="flex flex-wrap gap-2">

                                                                            {uploadResult.inbound_numbers.map(
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

                                                            {/* =================================================
                                                                SKIPPED RECEIPTS
                                                            ================================================= */}

                                                            {uploadResult.skipped_receipts &&
                                                                uploadResult
                                                                    .skipped_receipts
                                                                    .length >
                                                                0 && (
                                                                    <div className="mt-3">

                                                                        <p className="font-medium mb-2">
                                                                            Skipped Receipts:
                                                                        </p>

                                                                        <div className="space-y-1">

                                                                            {uploadResult.skipped_receipts.map(
                                                                                (
                                                                                    item,
                                                                                    index
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            index
                                                                                        }
                                                                                        className="text-xs"
                                                                                    >
                                                                                        <strong>
                                                                                            {
                                                                                                item.receipt_id ||
                                                                                                '-'
                                                                                            }
                                                                                        </strong>
                                                                                        {' — '}
                                                                                        {
                                                                                            item.reason
                                                                                        }
                                                                                    </div>
                                                                                )
                                                                            )}

                                                                        </div>

                                                                    </div>
                                                                )}

                                                        </div>
                                                    )}

                                                    {/* =================================================
                                                        VALIDATION ERRORS
                                                    ================================================= */}

                                                    {uploadResult.validation_errors &&
                                                        uploadResult
                                                            .validation_errors
                                                            .length >
                                                        0 && (
                                                            <div className="mt-4">

                                                                <p className="text-sm font-semibold text-red-800 mb-2">
                                                                    Validation Errors
                                                                </p>

                                                                <div className="max-h-60 overflow-y-auto space-y-2">

                                                                    {uploadResult.validation_errors.map(
                                                                        (
                                                                            error,
                                                                            index
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    index
                                                                                }
                                                                                className="p-2 bg-red-100 rounded text-xs text-red-800"
                                                                            >

                                                                                <strong>
                                                                                    Row{' '}
                                                                                    {
                                                                                        error.row
                                                                                    }
                                                                                </strong>

                                                                                {' — '}

                                                                                <strong>
                                                                                    {
                                                                                        error.field
                                                                                    }
                                                                                </strong>

                                                                                {': '}

                                                                                {
                                                                                    error.message
                                                                                }

                                                                            </div>
                                                                        )
                                                                    )}

                                                                </div>

                                                            </div>
                                                        )}

                                                    {/* =================================================
                                                        ERRORS
                                                    ================================================= */}

                                                    {uploadResult.errors &&
                                                        uploadResult
                                                            .errors
                                                            .length >
                                                        0 && (
                                                            <div className="mt-4">

                                                                <p className="text-sm font-semibold text-red-800 mb-2">
                                                                    Errors
                                                                </p>

                                                                <div className="max-h-60 overflow-y-auto space-y-2">

                                                                    {uploadResult.errors.map(
                                                                        (
                                                                            error,
                                                                            index
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    index
                                                                                }
                                                                                className="p-2 bg-red-100 rounded text-xs text-red-800">

                                                                                <strong>
                                                                                    Row{' '}
                                                                                    {
                                                                                        error.row
                                                                                    }
                                                                                </strong>

                                                                                {' — '}

                                                                                {
                                                                                    error.message
                                                                                }

                                                                                {error.detail && (
                                                                                    <>
                                                                                        {' — '}
                                                                                        {
                                                                                            error.detail
                                                                                        }
                                                                                    </>
                                                                                )}

                                                                            </div>
                                                                        )
                                                                    )}

                                                                </div>

                                                            </div>
                                                        )}

                                                </div>

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

