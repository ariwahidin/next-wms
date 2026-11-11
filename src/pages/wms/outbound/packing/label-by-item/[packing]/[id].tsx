
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Package, Printer } from 'lucide-react';
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

// =============================================
// CONFIGURATION
// =============================================

// A4 portrait: 5 labels per page
const LABELS_PER_PAGE = 5;

// Label dimensions
const LABEL_HEIGHT = '50mm';
const LABEL_WIDTH = '200mm';

// =============================================
// MAIN COMPONENT
// =============================================

const CartonLabelPrinter: React.FC = () => {
    const router = useRouter();

    const { packing, id } = router.query;

    const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // =============================================
    // FETCH DATA
    // =============================================

    useEffect(() => {
        if (!packing || !id) return;

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

                setPackingItems(res.data.data?.list || []);

            } catch (err) {
                console.error('Failed to fetch packing items:', err);
                setError('Failed to load packing items.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [packing, id]);

    // =============================================
    // CARTON NUMBERING
    // =============================================

    const cartonMap = useMemo(() => {
        const cartons = Array.from(
            new Set(
                packingItems.map(item => item.pack_ctn_no)
            )
        ).sort((a, b) => {
            return Number(a) - Number(b);
        });

        return new Map(
            cartons.map((carton, index) => [
                carton,
                index + 1,
            ])
        );
    }, [packingItems]);

    const totalCartons = cartonMap.size;

    // =============================================
    // LABEL DATA
    // ONE RECORD = ONE LABEL
    // =============================================

    const labels = useMemo(() => {
        return packingItems;
    }, [packingItems]);

    // =============================================
    // PAGINATION
    // =============================================

    const pages = useMemo(() => {
        const result: PackingItem[][] = [];

        for (
            let i = 0;
            i < labels.length;
            i += LABELS_PER_PAGE
        ) {
            result.push(
                labels.slice(i, i + LABELS_PER_PAGE)
            );
        }

        return result;
    }, [labels]);

    // =============================================
    // HELPERS
    // =============================================

    const formatDimension = (item: PackingItem) => {
        const {
            ctn_length,
            ctn_width,
            ctn_height,
        } = item;

        if (
            !ctn_length &&
            !ctn_width &&
            !ctn_height
        ) {
            return '-';
        }

        return `${ctn_length || 0} x ${ctn_width || 0} x ${ctn_height || 0}`;
    };

    const getDeliveryName = (item: PackingItem) => {
        return (
            item.deliv_to_name ||
            item.customer_name ||
            '-'
        );
    };

    const getDeliveryAddress = (item: PackingItem) => {
        return [
            item.deliv_address,
            item.deliv_city,
        ]
            .filter(Boolean)
            .join(', ') || '-';
    };

    const getQuantityPcs = (item: PackingItem) => {
        return item.qty_scan ?? item.quantity ?? 0;
    };

    const getQuantityUom = (item: PackingItem) => {
        return item.package_qty ?? 0;
    };

    const getUom = (item: PackingItem) => {
        return item.package_type || item.uom_scan || '-';
    };

    // =============================================
    // PRINT
    // =============================================

    const handlePrint = () => {
        if (!labels.length) return;

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

                    <div className="mb-6 flex items-center justify-between">

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
                            onClick={handlePrint}
                            disabled={!labels.length}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Printer className="h-5 w-5" />
                            Print Labels
                        </button>

                    </div>

                    {/* SUMMARY */}

                    <div className="mb-6 grid grid-cols-3 gap-4">

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
                                Total Labels
                            </p>

                            <p className="mt-2 text-2xl font-bold text-blue-600">
                                {labels.length}
                            </p>
                        </div>

                    </div>

                    {/* PRINT INFORMATION */}

                    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">

                        <div className="flex items-start gap-3">

                            <Printer className="mt-0.5 h-5 w-5 text-blue-600" />

                            <div>
                                <p className="font-semibold text-blue-900">
                                    Print Configuration
                                </p>

                                <p className="mt-1 text-sm text-blue-800">
                                    Paper: A4 Portrait | Labels per page: 5 |
                                    Label size: 200 x 50 mm
                                </p>

                                <p className="mt-1 text-xs text-blue-700">
                                    Set printer margins to None and scale to 100%.
                                </p>
                            </div>

                        </div>

                    </div>

                    {/* LABEL PREVIEW */}

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

                                    <span className="text-xs text-gray-400">
                                        Carton {cartonMap.get(item.pack_ctn_no)} of {totalCartons}
                                    </span>

                                </div>

                                <LabelContent
                                    item={item}
                                    cartonNumber={cartonMap.get(item.pack_ctn_no) || 1}
                                    totalCartons={totalCartons}
                                    formatDimension={formatDimension}
                                    getDeliveryName={getDeliveryName}
                                    getDeliveryAddress={getDeliveryAddress}
                                    getQuantityPcs={getQuantityPcs}
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
      ========================================= */}

            <div className="print-only">

                {pages.map((page, pageIndex) => (

                    <div
                        className="print-page"
                        key={pageIndex}
                    >

                        {page.map((item, index) => (

                            <div
                                className="label-container"
                                key={`${item.pack_ctn_no}-${item.item_code}-${pageIndex}-${index}`}
                            >

                                <LabelContent
                                    item={item}
                                    cartonNumber={cartonMap.get(item.pack_ctn_no) || 1}
                                    totalCartons={totalCartons}
                                    formatDimension={formatDimension}
                                    getDeliveryName={getDeliveryName}
                                    getDeliveryAddress={getDeliveryAddress}
                                    getQuantityPcs={getQuantityPcs}
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
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .screen-only {
            display: none !important;
          }

          .print-only {
            display: block !important;
          }

          /* =====================================
             A4 PAGE
          ===================================== */

          .print-page {
            width: 210mm;
            height: 297mm;

            box-sizing: border-box;

            padding: 5mm;

            display: grid;

            grid-template-columns: 200mm;
            grid-template-rows: repeat(5, 50mm);

            column-gap: 0;
            row-gap: 2mm;

            align-content: start;

            background: white;

            page-break-after: always;
            break-after: page;

            overflow: hidden;
          }

          .print-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          /* =====================================
             LABEL CONTAINER
          ===================================== */

          .label-container {
            width: 200mm;
            height: 50mm;

            box-sizing: border-box;

            overflow: hidden;

            border: 1px solid #000;

            padding: 2mm;

            background: white;
            color: black;

            font-family: Arial, sans-serif;
          }

          /* =====================================
             DELIVERY HEADER
          ===================================== */

          .label-container .label-header {
            display: grid;

            grid-template-columns: 32mm 1fr;

            border-bottom: 1px solid #999;

            padding-bottom: 2mm;

            min-height: 11mm;
          }

          .label-container .label-header-title {
            font-size: 10pt;
            font-weight: bold;
          }

          .label-container .label-customer {
            font-size: 9pt;
            line-height: 1.3;
          }

          .label-container .label-customer-name {
            font-size: 10pt;
            font-weight: bold;
            text-transform: uppercase;
          }

          /* =====================================
             CARTON INFORMATION
          ===================================== */

          .label-container .label-info {
            display: grid;

            grid-template-columns: 1fr 1fr 1fr;

            align-items: center;

            border-bottom: 1px solid #999;

            padding: 2mm 0;

            font-size: 9pt;
            font-weight: bold;
          }

          .label-container .label-info-center {
            text-align: center;
          }

          .label-container .label-info-right {
            text-align: right;
          }

          /* =====================================
             DIMENSION AND WEIGHT
          ===================================== */

          .label-container .label-dimension {
            display: grid;

            grid-template-columns: 2fr 1fr;

            border-bottom: 1px solid #999;

            padding: 2mm 0;

            font-size: 9pt;
          }

          /* =====================================
             ITEM TABLE
          ===================================== */

         .label-container .label-table-header,
            .label-container .label-table-value {
            display: grid;
            grid-template-columns: 1.6fr 1.4fr 0.7fr 0.7fr 0.5fr;
            }

            .label-container .label-table-header {
            border-bottom: 1px solid #999;
            padding: 1.5mm 0;
            font-size: 9pt;
            font-weight: bold;
            }

            .label-container .label-table-value {
            padding: 1.5mm 0;
            font-size: 9pt;
            line-height: 1.3;
            }

          .label-container .label-bold {
            font-weight: bold;
          }

          .label-container .label-uom {
            font-size: 9pt;
            font-weight: bold;
            margin-top: 1mm;
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

    getQuantityPcs: (item: PackingItem) => number;

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

    getQuantityPcs,
    getQuantityUom,
    getUom,

}) => {

    return (

        <div className="h-full w-full text-black">

            {/* =====================================
          DELIVERY TO
      ===================================== */}

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

            {/* =====================================
          CARTON INFORMATION
      ===================================== */}

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

            {/* =====================================
          DIMENSION AND WEIGHT
      ===================================== */}

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

            {/* =====================================
          ITEM INFORMATION HEADER
      ===================================== */}

            <div className="label-table-header grid grid-cols-[1.6fr_1.4fr_.7fr_.7fr_.5fr] border-b border-gray-400 py-2 text-xs font-bold">

                <div>Do No</div>
                <div>Item_code</div>
                <div>Qty_Pcs</div>
                <div>Qty_UOM</div>
                <div>UOM</div>

            </div>

            {/* =====================================
          ITEM INFORMATION VALUE
      ===================================== */}

            <div className="label-table-value grid grid-cols-[1.6fr_1.4fr_.7fr_.7fr_.5fr] py-2 text-xs">

                <div className="font-bold">
                    {item.outbound_no}
                </div>

                <div className="font-bold">
                    {item.item_code}
                </div>

                <div>
                    {getQuantityPcs(item)}
                </div>

                <div>
                    {getQuantityUom(item)}
                </div>

                <div>
                    {getUom(item)}
                </div>

            </div>

            {/* =====================================
          UOM
      ===================================== */}

            {/* <div className="label-uom mt-1 text-xs font-bold">
        UOM : {getUom(item)}
      </div> */}

        </div>

    );
};

export default CartonLabelPrinter;
