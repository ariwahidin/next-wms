import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Package, Printer, RotateCcw, Copy } from 'lucide-react';
import api from '@/lib/api';

// =============================================
// INTERFACE
// =============================================

interface PackingItem {
    packing_no: string;
    packing_date: string;

    cust_address: string;
    cust_city: string;

    deliv_to: string;
    deliv_to_name: string;
    deliv_address: string;
    deliv_city: string;

    customer_name: string;

    outbound_no: string;
    shipment_id: string;

    item_id?: number;
    item_code: string;
    item_name: string;

    quantity: number;
    qty_scan: number;
    uom_scan: string;

    pack_ctn_no: string;

    package_type: string;
    package_qty: number;

    barcode_scan: string;

    ctn_length: number;
    ctn_width: number;
    ctn_height: number;

    ctn_max_weight: number;
    ctn_tare_weight: number;
    ctn_volume: number;
}

interface PrintLabel {
    item: PackingItem;
    itemIndex: number;
    copyIndex: number;
}

// =============================================
// PRINT CONFIGURATION
// =============================================

// A4 portrait: 5 labels per page.
const LABELS_PER_PAGE = 5;

// Physical label dimensions.
const LABEL_HEIGHT_MM = 50;
const LABEL_WIDTH_MM = 200;

// A4 dimensions.
const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;

// 5mm top/left/right padding and 2mm gap between labels.
const PAGE_PADDING_MM = 5;
const LABEL_GAP_MM = 2;

// =============================================
// HELPERS
// =============================================

const toFiniteNumber = (value: unknown, fallback = 0): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Keep quantities ungrouped to avoid ambiguity on printed labels.
 * Example: 1728 -> "1728", 1.5 -> "1.5".
 */
const formatQuantity = (value: number): string => {
    if (!Number.isFinite(value)) return '0';

    // String(number) keeps the shortest round-trippable representation.
    // Avoid applying an arbitrary decimal rounding rule to inventory quantities.
    return String(value);
};

const normalizePrintCopies = (value: number): number => {
    if (!Number.isFinite(value) || value <= 0) return 0;

    // A copy is a physical label, so it must be a whole number.
    return Math.floor(value);
};

// =============================================
// MAIN COMPONENT
// =============================================

const CartonLabelPrinter: React.FC = () => {
    const router = useRouter();
    const { packing, id } = router.query;

    const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
    const [printCopies, setPrintCopies] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // =============================================
    // FETCH DATA
    // =============================================

    useEffect(() => {
        if (!packing || !id) return;

        let isMounted = true;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');

                const res = await api.get(
                    `/outbound/${id}/packing/${packing}`,
                    {
                        withCredentials: true,
                    }
                );

                if (!isMounted) return;

                const list: PackingItem[] = res.data.data?.list || [];

                setPackingItems(list);

                // Safe default: each API record is printed once.
                // User can set an individual row to package_qty using the quick action.
                setPrintCopies(list.map(() => 1));
            } catch (err) {
                console.error('Failed to fetch packing items:', err);

                if (isMounted) {
                    setError('Failed to load packing items.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [packing, id]);

    // =============================================
    // CARTON NUMBERING
    // =============================================

    const cartonMap = useMemo(() => {
        const cartons = Array.from(
            new Set(packingItems.map(item => item.pack_ctn_no))
        ).sort((a, b) => {
            const numberA = Number(a);
            const numberB = Number(b);

            if (Number.isFinite(numberA) && Number.isFinite(numberB)) {
                return numberA - numberB;
            }

            return String(a).localeCompare(String(b));
        });

        return new Map(
            cartons.map((carton, index) => [carton, index + 1])
        );
    }, [packingItems]);

    const totalCartons = cartonMap.size;

    // =============================================
    // LABEL DATA
    // One API record = one preview label.
    // Print copies are expanded separately for print view.
    // =============================================

    const labels = packingItems;

    // =============================================
    // PRINT COPY CONFIGURATION
    // =============================================

    const updatePrintCopies = (index: number, value: number) => {
        setPrintCopies(previous => {
            const updated = [...previous];
            updated[index] = normalizePrintCopies(value);
            return updated;
        });
    };

    const setCopiesToPackageQty = (index: number, item: PackingItem) => {
        updatePrintCopies(index, toFiniteNumber(item.package_qty));
    };

    const setAllCopiesToOne = () => {
        setPrintCopies(packingItems.map(() => 1));
    };

    const setAllCopiesToPackageQty = () => {
        setPrintCopies(
            packingItems.map(item =>
                normalizePrintCopies(toFiniteNumber(item.package_qty))
            )
        );
    };

    const totalPrintLabels = useMemo(() => {
        return packingItems.reduce((total, _item, index) => {
            return total + normalizePrintCopies(printCopies[index] ?? 1);
        }, 0);
    }, [packingItems, printCopies]);

    // Expand only the print data. The screen preview remains one card per API record.
    const printLabels = useMemo<PrintLabel[]>(() => {
        const result: PrintLabel[] = [];

        packingItems.forEach((item, itemIndex) => {
            const copies = normalizePrintCopies(printCopies[itemIndex] ?? 1);

            for (let copyIndex = 0; copyIndex < copies; copyIndex += 1) {
                result.push({
                    item,
                    itemIndex,
                    copyIndex,
                });
            }
        });

        return result;
    }, [packingItems, printCopies]);

    // =============================================
    // PAGINATION
    // =============================================

    const pages = useMemo(() => {
        const result: PrintLabel[][] = [];

        for (
            let index = 0;
            index < printLabels.length;
            index += LABELS_PER_PAGE
        ) {
            result.push(
                printLabels.slice(index, index + LABELS_PER_PAGE)
            );
        }

        return result;
    }, [printLabels]);

    // =============================================
    // QUANTITY HELPERS
    // =============================================

    const getQuantityPcs = (
        item: PackingItem,
        copies: number
    ): number | null => {
        const qtyScan = toFiniteNumber(
            item.qty_scan ?? item.quantity
        );

        const safeCopies = normalizePrintCopies(copies);

        // If this row is not being printed, there is no quantity per label.
        if (safeCopies <= 0) {
            return null;
        }

        // Each printed copy represents an equal share of the scanned quantity.
        // Do not round here: rounding could make the printed total differ from Qty Scan.
        return qtyScan / safeCopies;
    };

    const getQuantityUom = (item: PackingItem): number => {
        return toFiniteNumber(item.package_qty);
    };

    const getUom = (item: PackingItem): string => {
        return item.package_type || item.uom_scan || '-';
    };

    // =============================================
    // GENERAL HELPERS
    // =============================================

    const formatDimension = (item: PackingItem): string => {
        const length = toFiniteNumber(item.ctn_length);
        const width = toFiniteNumber(item.ctn_width);
        const height = toFiniteNumber(item.ctn_height);

        if (!length && !width && !height) {
            return '-';
        }

        return `${formatQuantity(length)} x ${formatQuantity(width)} x ${formatQuantity(height)}`;
    };

    const getDeliveryName = (item: PackingItem): string => {
        return item.deliv_to_name || item.customer_name || '-';
    };

    const getDeliveryAddress = (item: PackingItem): string => {
        return [
            item.deliv_address,
            item.deliv_city,
        ]
            .filter(Boolean)
            .join(', ') || '-';
    };

    // =============================================
    // PRINT
    // =============================================

    const handlePrint = () => {
        if (totalPrintLabels <= 0) return;

        // Print dialog settings should be:
        // Paper: A4, Orientation: Portrait, Scale: 100%, Margins: None.
        window.print();
    };

    // =============================================
    // LOADING
    // =============================================

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Package className="mx-auto mb-3 h-10 w-10 animate-pulse text-blue-600" />

                    <p className="text-sm text-gray-500">
                        Loading packing labels...
                    </p>
                </div>
            </div>
        );
    }

    // =============================================
    // ERROR
    // =============================================

    if (error) {
        return (
            <div className="p-10 text-center text-red-600">
                {error}
            </div>
        );
    }

    // =============================================
    // RENDER
    // =============================================

    return (
        <>
            {/* =========================================
                SCREEN VIEW
            ========================================= */}

            <div className="screen-only min-h-screen bg-gray-100 p-8">
                <div className="mx-auto max-w-6xl">

                    {/* HEADER */}

                    <div className="mb-6 flex items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-blue-100 p-3">
                                    <Package className="h-7 w-7 text-blue-600" />
                                </div>

                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">
                                        Item Packing Label
                                    </h1>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Individual item packing label generator
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handlePrint}
                            disabled={totalPrintLabels <= 0}
                            className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Printer className="h-5 w-5" />
                            Print {totalPrintLabels > 0 ? `${totalPrintLabels} Labels` : 'Labels'}
                        </button>
                    </div>

                    {/* SUMMARY */}

                    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-xl border bg-white p-5 shadow-sm">
                            <p className="text-sm text-gray-500">
                                Packing Number
                            </p>

                            <p className="mt-2 font-bold text-gray-800">
                                {packingItems[0]?.packing_no || '-'}
                            </p>
                        </div>

                        <div className="rounded-xl border bg-white p-5 shadow-sm">
                            <p className="text-sm text-gray-500">
                                Total Cartons
                            </p>

                            <p className="mt-2 text-2xl font-bold text-gray-800">
                                {totalCartons}
                            </p>
                        </div>

                        <div className="rounded-xl border bg-white p-5 shadow-sm">
                            <p className="text-sm text-gray-500">
                                Total Labels to Print
                            </p>

                            <p className="mt-2 text-2xl font-bold text-blue-600">
                                {totalPrintLabels.toLocaleString('en-US')}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                                {pages.length} A4 page(s), maximum 5 labels per page
                            </p>
                        </div>
                    </div>

                    {/* PRINT INFORMATION */}

                    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-start gap-3">
                            <Printer className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                            <div>
                                <p className="font-semibold text-blue-900">
                                    Print Configuration
                                </p>

                                <p className="mt-1 text-sm text-blue-800">
                                    Paper: A4 Portrait | Labels per page: 5 | Label size: 200 x 50 mm
                                </p>

                                <p className="mt-1 text-xs text-blue-700">
                                    In the print dialog, select A4, Portrait, Scale 100%, and Margins None.
                                    Disable browser headers and footers.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* PRINT COPY CONTROLS */}

                    <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="font-semibold text-gray-800">
                                    Print Quantity Settings
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Set how many copies should be printed for each label.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={setAllCopiesToOne}
                                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Reset all to 1
                                </button>

                                <button
                                    type="button"
                                    onClick={setAllCopiesToPackageQty}
                                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                                >
                                    <Copy className="h-4 w-4" />
                                    All = Package Qty
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px] text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                                        <th className="px-3 py-3">Label</th>
                                        <th className="px-3 py-3">Item Code</th>
                                        <th className="px-3 py-3 text-right">Qty Scan</th>
                                        <th className="px-3 py-3 text-right">Package Qty</th>
                                        <th className="px-3 py-3 text-right">Qty per Label</th>
                                        <th className="px-3 py-3 text-center">Print Copies</th>
                                        <th className="px-3 py-3 text-right">Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {packingItems.map((item, index) => (
                                        <tr
                                            key={`${item.pack_ctn_no}-${item.item_code}-${index}`}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-3 py-3 font-semibold text-gray-700">
                                                LABEL #{index + 1}
                                                <div className="mt-1 text-xs font-normal text-gray-400">
                                                    Carton {cartonMap.get(item.pack_ctn_no) || 1} of {totalCartons}
                                                </div>
                                            </td>

                                            <td className="px-3 py-3 font-medium text-gray-800">
                                                {item.item_code}
                                                <div className="mt-1 text-xs text-gray-500">
                                                    {getUom(item)}
                                                </div>
                                            </td>

                                            <td className="px-3 py-3 text-right tabular-nums">
                                                {formatQuantity(
                                                    toFiniteNumber(item.qty_scan ?? item.quantity)
                                                )}
                                            </td>

                                            <td className="px-3 py-3 text-right tabular-nums">
                                                {formatQuantity(
                                                    toFiniteNumber(item.package_qty)
                                                )}
                                            </td>

                                            <td className="px-3 py-3 text-right font-semibold tabular-nums text-gray-800">
                                                {(() => {
                                                    const qtyPerLabel = getQuantityPcs(
                                                        item,
                                                        printCopies[index] ?? 1
                                                    );

                                                    return qtyPerLabel === null
                                                        ? '-'
                                                        : formatQuantity(qtyPerLabel);
                                                })()}
                                            </td>

                                            <td className="px-3 py-3 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    inputMode="numeric"
                                                    value={printCopies[index] ?? 1}
                                                    onChange={event =>
                                                        updatePrintCopies(
                                                            index,
                                                            Number(event.target.value)
                                                        )
                                                    }
                                                    className="w-24 rounded-md border border-gray-300 px-3 py-2 text-center font-semibold tabular-nums outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                    aria-label={`Print copies for label ${index + 1}`}
                                                />
                                            </td>

                                            <td className="px-3 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setCopiesToPackageQty(index, item)
                                                    }
                                                    className="whitespace-nowrap rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                                >
                                                    Use Package Qty
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                            <p className="text-sm text-gray-500">
                                Setting 0 means this label will not be printed.
                            </p>

                            <p className="text-sm font-semibold text-gray-800">
                                Total copies:{' '}
                                <span className="text-blue-600 tabular-nums">
                                    {totalPrintLabels.toLocaleString('en-US')}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* LABEL PREVIEW */}

                    <div className="mb-3">
                        <h2 className="font-semibold text-gray-800">
                            Label Preview
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Preview displays one label per API record. Copies are expanded only in print output.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {labels.map((item, index) => (
                            <div
                                key={`${item.pack_ctn_no}-${item.item_code}-${index}`}
                                className="mx-auto max-w-4xl rounded-lg border border-gray-300 bg-white p-4 shadow-sm"
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-500">
                                        LABEL #{index + 1}
                                    </span>

                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-400">
                                            Carton {cartonMap.get(item.pack_ctn_no) || 1} of {totalCartons}
                                        </span>

                                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                            {normalizePrintCopies(printCopies[index] ?? 1)} copies
                                        </span>
                                    </div>
                                </div>

                                <LabelContent
                                    item={item}
                                    cartonNumber={cartonMap.get(item.pack_ctn_no) || 1}
                                    totalCartons={totalCartons}
                                    formatDimension={formatDimension}
                                    getDeliveryName={getDeliveryName}
                                    getDeliveryAddress={getDeliveryAddress}
                                    quantityPcs={getQuantityPcs(
                                        item,
                                        printCopies[index] ?? 1
                                    )}
                                    getQuantityUom={getQuantityUom}
                                    getUom={getUom}
                                />
                            </div>
                        ))}

                        {!labels.length && (
                            <div className="rounded-xl border bg-white p-12 text-center text-gray-500">
                                No packing items found.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* =========================================
                PRINT VIEW
                Every configured copy becomes one physical label.
            ========================================= */}

            <div className="print-only">
                {pages.map((page, pageIndex) => (
                    <div
                        className="print-page"
                        key={`print-page-${pageIndex}`}
                    >
                        {page.map(printLabel => (
                            <div
                                className="label-container"
                                key={`${printLabel.itemIndex}-${printLabel.copyIndex}`}
                            >
                                <LabelContent
                                    item={printLabel.item}
                                    cartonNumber={
                                        cartonMap.get(printLabel.item.pack_ctn_no) || 1
                                    }
                                    totalCartons={totalCartons}
                                    formatDimension={formatDimension}
                                    getDeliveryName={getDeliveryName}
                                    getDeliveryAddress={getDeliveryAddress}
                                    quantityPcs={getQuantityPcs(
                                        printLabel.item,
                                        printCopies[printLabel.itemIndex] ?? 1
                                    )}
                                    getQuantityUom={getQuantityUom}
                                    getUom={getUom}
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* =========================================
                PRINT CSS
            ========================================= */}

            <style jsx global>{`
                .print-only {
                    display: none;
                }

                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }

                    html,
                    body {
                        width: ${PAGE_WIDTH_MM}mm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                    }

                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    *,
                    *::before,
                    *::after {
                        box-sizing: border-box !important;
                    }

                    .screen-only {
                        display: none !important;
                    }

                    .print-only {
                        display: block !important;
                        width: ${PAGE_WIDTH_MM}mm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    /*
                     * Physical A4 page:
                     * 210mm wide x 297mm high.
                     * 5mm left/right padding gives 200mm label width.
                     */
                    .print-page {
                        width: ${PAGE_WIDTH_MM}mm !important;
                        height: ${PAGE_HEIGHT_MM}mm !important;
                        min-height: ${PAGE_HEIGHT_MM}mm !important;
                        max-height: ${PAGE_HEIGHT_MM}mm !important;

                        margin: 0 !important;
                        padding: ${PAGE_PADDING_MM}mm !important;

                        display: grid !important;
                        grid-template-columns: ${LABEL_WIDTH_MM}mm !important;
                        grid-template-rows: repeat(${LABELS_PER_PAGE}, ${LABEL_HEIGHT_MM}mm) !important;

                        column-gap: 0 !important;
                        row-gap: ${LABEL_GAP_MM}mm !important;

                        align-content: start !important;
                        justify-content: start !important;

                        overflow: hidden !important;
                        background: #fff !important;

                        page-break-after: always !important;
                        break-after: page !important;
                    }

                    .print-page:last-child {
                        page-break-after: auto !important;
                        break-after: auto !important;
                    }

                    /*
                     * Each physical label is exactly 200mm x 50mm.
                     * Avoid flex shrinking or grid item stretching.
                     */
                    .label-container {
                        width: ${LABEL_WIDTH_MM}mm !important;
                        height: ${LABEL_HEIGHT_MM}mm !important;
                        min-width: ${LABEL_WIDTH_MM}mm !important;
                        max-width: ${LABEL_WIDTH_MM}mm !important;
                        min-height: ${LABEL_HEIGHT_MM}mm !important;
                        max-height: ${LABEL_HEIGHT_MM}mm !important;

                        margin: 0 !important;
                        padding: 2mm !important;

                        overflow: hidden !important;
                        border: 1px solid #000 !important;

                        background: #fff !important;
                        color: #000 !important;

                        font-family: Arial, sans-serif !important;

                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }

                    .label-container .label-header {
                        display: grid !important;
                        grid-template-columns: 32mm 1fr !important;

                        border-bottom: 1px solid #999 !important;
                        padding-bottom: 2mm !important;
                        min-height: 11mm !important;
                    }

                    .label-container .label-header-title {
                        font-size: 10pt !important;
                        font-weight: bold !important;
                    }

                    .label-container .label-customer {
                        font-size: 9pt !important;
                        line-height: 1.3 !important;
                    }

                    .label-container .label-customer-name {
                        font-size: 10pt !important;
                        font-weight: bold !important;
                        text-transform: uppercase !important;
                    }

                    .label-container .label-info {
                        display: grid !important;
                        grid-template-columns: 1fr 1fr 1fr !important;
                        align-items: center !important;

                        border-bottom: 1px solid #999 !important;
                        padding: 2mm 0 !important;

                        font-size: 9pt !important;
                        font-weight: bold !important;
                    }

                    .label-container .label-info-center {
                        text-align: center !important;
                    }

                    .label-container .label-info-right {
                        text-align: right !important;
                    }

                    .label-container .label-dimension {
                        display: grid !important;
                        grid-template-columns: 2fr 1fr !important;

                        border-bottom: 1px solid #999 !important;
                        padding: 2mm 0 !important;

                        font-size: 9pt !important;
                    }

                    .label-container .label-table-header,
                    .label-container .label-table-value {
                        display: grid !important;
                        grid-template-columns: 1.6fr 1.4fr 0.7fr 0.7fr 0.5fr !important;
                    }

                    .label-container .label-table-header {
                        border-bottom: 1px solid #999 !important;
                        padding: 1.5mm 0 !important;

                        font-size: 9pt !important;
                        font-weight: bold !important;
                    }

                    .label-container .label-table-value {
                        padding: 1.5mm 0 !important;

                        font-size: 9pt !important;
                        line-height: 1.3 !important;
                    }

                    .label-container .label-bold {
                        font-weight: bold !important;
                    }

                    .label-container .label-uom {
                        margin-top: 1mm !important;
                        font-size: 9pt !important;
                        font-weight: bold !important;
                    }
                }
            `}</style>
        </>
    );
};

// =============================================
// REUSABLE LABEL COMPONENT
// =============================================

interface LabelContentProps {
    item: PackingItem;

    cartonNumber: number;
    totalCartons: number;

    formatDimension: (item: PackingItem) => string;

    getDeliveryName: (item: PackingItem) => string;
    getDeliveryAddress: (item: PackingItem) => string;

    quantityPcs: number | null;
    getQuantityUom: (item: PackingItem) => number;
    getUom: (item: PackingItem) => string;
}

// =============================================
// LABEL CONTENT
// =============================================

const LabelContent: React.FC<LabelContentProps> = ({
    item,
    cartonNumber,
    totalCartons,
    formatDimension,
    getDeliveryName,
    getDeliveryAddress,
    quantityPcs,
    getQuantityUom,
    getUom,
}) => {
    return (
        <div className="h-full w-full text-black">
            {/* DELIVERY TO */}

            <div className="label-header grid grid-cols-[32%_68%] border-b border-gray-400 pb-2">
                <div className="label-header-title text-sm font-bold">
                    Delivery To (Tujuan) :
                </div>

                <div className="label-customer text-xs leading-tight">
                    <div className="label-customer-name font-bold uppercase">
                        {getDeliveryName(item)}
                    </div>

                    <div>
                        {getDeliveryAddress(item)}
                    </div>
                </div>
            </div>

            {/* CARTON INFORMATION */}

            <div className="label-info grid grid-cols-3 items-center border-b border-gray-400 py-2 text-xs">
                <div>
                    <span className="font-bold">
                        QTY This Case :
                    </span>{' '}
                    1
                </div>

                <div className="label-info-center text-center font-bold">
                    Carton {cartonNumber} of {totalCartons}
                </div>

                <div className="label-info-right text-right font-bold">
                    {item.packing_no}
                </div>
            </div>

            {/* DIMENSION AND WEIGHT */}

            <div className="label-dimension grid grid-cols-2 border-b border-gray-400 py-2 text-xs">
                <div>
                    <div className="font-bold">
                        Dimension L x W x H (cm)
                    </div>

                    <div>
                        {formatDimension(item)}
                    </div>
                </div>

                <div>
                    <div className="font-bold">
                        Weight
                    </div>

                    <div>
                        {item.ctn_max_weight || '-'}
                    </div>
                </div>
            </div>

            {/* ITEM INFORMATION HEADER */}

            <div className="label-table-header grid grid-cols-[1.6fr_1.4fr_.7fr_.7fr_.5fr] border-b border-gray-400 py-2 text-xs font-bold">
                <div>Do No</div>
                <div>Item_code</div>
                <div>Qty_Pcs</div>
                <div>Qty_UOM</div>
                <div>UOM</div>
            </div>

            {/* ITEM INFORMATION VALUE */}

            <div className="label-table-value grid grid-cols-[1.6fr_1.4fr_.7fr_.7fr_.5fr] py-2 text-xs">
                <div className="font-bold">
                    {item.outbound_no}
                </div>

                <div className="font-bold">
                    {item.item_code}
                </div>

                <div>
                    {quantityPcs === null ? '-' : formatQuantity(quantityPcs)}
                </div>

                <div>
                    {formatQuantity(getQuantityUom(item))}
                </div>

                <div>
                    {getUom(item)}
                </div>
            </div>
        </div>
    );
};

export default CartonLabelPrinter;
