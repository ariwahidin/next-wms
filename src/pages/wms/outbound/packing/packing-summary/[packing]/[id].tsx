
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import JsBarcode from "jsbarcode";
import api from "@/lib/api";
import { printDocument } from "@/lib/print";

const PickingSheetPrint = () => {
    const router = useRouter();
    const { packing, id } = router.query;

    const [packingItems, setPackingItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const barcodeRef = useRef<HTMLCanvasElement>(null);
    const barcodeItemRef = useRef<Array<HTMLCanvasElement | null>>([]);
    const barcodeLocationRef = useRef<Array<HTMLCanvasElement | null>>([]);

    const printStartedRef = useRef(false);

    useEffect(() => {
        if (packing && id) {
            fetchData(id as string);
        }
    }, [packing, id]);

    const fetchData = async (id: string) => {
        try {
            setLoading(true);

            const res = await api.get(
                `/outbound/${id}/packing/${packing}`,
                {
                    withCredentials: true,
                }
            );

            setPackingItems(res.data.data.list || []);
        } catch (error) {
            console.error("Failed to fetch packing data:", error);
            alert("Failed to load packing data.");
        } finally {
            setLoading(false);
        }
    };

    // Generate barcode
    useEffect(() => {
        if (packingItems.length === 0) return;

        if (barcodeRef.current) {
            JsBarcode(
                barcodeRef.current,
                packingItems[0].packing_no,
                {
                    format: "CODE128",
                    displayValue: true,
                    fontSize: 14,
                    width: 2,
                    height: 50,
                    margin: 0,
                }
            );
        }

        packingItems.forEach((item, index) => {
            const canvasLocation = barcodeLocationRef.current[index];

            if (canvasLocation && item.location) {
                JsBarcode(canvasLocation, item.location, {
                    format: "CODE128",
                    displayValue: false,
                    width: 1.5,
                    height: 20,
                    margin: 0,
                });
            }

            const canvasItem = barcodeItemRef.current[index];

            if (canvasItem && item.barcode) {
                JsBarcode(canvasItem, item.barcode, {
                    format: "CODE128",
                    displayValue: false,
                    width: 1.5,
                    height: 20,
                    margin: 0,
                });
            }
        });
    }, [packingItems]);

    // Printing log
    useEffect(() => {
        if (packingItems.length === 0) return;

        if (printStartedRef.current) return;

        printStartedRef.current = true;

        const timer = setTimeout(async () => {
            try {
                await printDocument({
                    documentType: "PACKING_LIST_SUMMARY",
                    documentNo: packingItems[0].packing_no,
                    module: "OUTBOUND",
                    printMethod: "BROWSER",
                    printFormat: "PDF",
                    copyCount: 1,
                });
            } catch (error) {
                console.error(
                    "Packing List Summary print error:",
                    error
                );

                printStartedRef.current = false;

                alert(
                    error instanceof Error
                        ? error.message
                        : "Failed to process print request."
                );
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [packingItems]);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (packingItems.length === 0) {
        return <p>No packing data found.</p>;
    }

    const data = packingItems[0];

    // Grouping data by Item Code and Package Type
    const groupedData = Object.values(
        packingItems.reduce((acc: any, item: any) => {
            const key = `${item.item_code}_${item.package_type}`;

            if (!acc[key]) {
                acc[key] = {
                    item_code: item.item_code,
                    item_name: item.item_name,
                    package_type: item.package_type,
                    qty_pack: 0,
                    qty_pcs: 0,
                    ctn_total: 0,
                };
            }

            const group = acc[key];

            group.qty_pack += Number(item.package_qty || 0);

            group.qty_pcs += Number(item.quantity || 0);

            const qtyScan = Number(item.qty_scan || 0);
            const qtyPerCarton = Number(item.qty_per_carton || 0);

            if (qtyPerCarton > 0) {
                group.ctn_total += qtyScan / qtyPerCarton;
            }

            return acc;
        }, {})
    ) as any[];

    // Grand Total
    const grandTotalQtyPack = groupedData.reduce(
        (sum: number, item: any) => sum + item.qty_pack,
        0
    );

    const grandTotalQtyPcs = groupedData.reduce(
        (sum: number, item: any) => sum + item.qty_pcs,
        0
    );

    // Round CTN Total up
    const formatCtnTotal = (value: number) => {
        return Math.ceil(value).toLocaleString("en-US");
    };

    return (
        <>
            <style jsx global>{`
                /* ===============================
                   GENERAL
                =============================== */

                * {
                    box-sizing: border-box;
                }

                .packing-document {
                    padding: 15px;
                    font-family: Arial, Helvetica, sans-serif;
                    font-size: 12px;
                    font-weight: 500;
                    color: #000;
                    background: #fff;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    text-rendering: geometricPrecision;
                }

                .company-name {
                    text-align: center;
                    font-size: 17px;
                    font-weight: 800;
                    margin: 0;
                    letter-spacing: 0.3px;
                }

                .document-title {
                    text-align: center;
                    font-size: 18px;
                    font-weight: 800;
                    margin: 12px 0;
                    letter-spacing: 0.5px;
                }

                .document-divider {
                    border: none;
                    border-top: 2px solid #000;
                    margin: 10px 0;
                }

                /* ===============================
                   HEADER INFORMATION
                =============================== */

                .info-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                    font-weight: 600;
                    margin-top: 12px;
                }

                .info-table td {
                    padding: 4px 6px;
                    vertical-align: top;
                    line-height: 1.4;
                    color: #000;
                }

                .info-label {
                    width: 125px;
                    font-weight: 800;
                    white-space: nowrap;
                }

                .info-value {
                    font-weight: 600;
                }

                /* ===============================
                   DETAIL TABLE
                =============================== */

                .packing-table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                    margin-top: 22px;
                    font-size: 11px;
                    color: #000;
                }

                .packing-table thead {
                    display: table-header-group;
                }

                .packing-table th {
                    border: 1px solid #000;
                    background: #e5e5e5 !important;
                    padding: 7px 5px;
                    text-align: center;
                    font-size: 11px;
                    font-weight: 800;
                    line-height: 1.3;
                    color: #000;
                }

                .packing-table td {
                    border: 1px solid #000;
                    padding: 6px 5px;
                    font-size: 11px;
                    font-weight: 600;
                    line-height: 1.35;
                    color: #000;
                    vertical-align: middle;
                }

                .packing-table tbody tr {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }

                .packing-table .text-center {
                    text-align: center;
                }

                .packing-table .text-left {
                    text-align: left;
                    white-space: normal;
                    overflow-wrap: anywhere;
                }

                /* ===============================
                   GRAND TOTAL
                =============================== */

                .grand-total td {
                    font-weight: 900 !important;
                    font-size: 12px !important;
                    border-top: 2px solid #000 !important;
                    border-bottom: 2px solid #000 !important;
                    padding: 8px 5px !important;
                    background: #f0f0f0 !important;
                }

                /* ===============================
                   SIGNATURE
                =============================== */

                .signature-container {
                    display: flex;
                    justify-content: space-around;
                    gap: 15px;
                    margin-top: 45px;
                    page-break-inside: avoid;
                    break-inside: avoid;
                }

                .signature-box {
                    flex: 1;
                    min-width: 0;
                    text-align: center;
                }

                .signature-title {
                    font-size: 11px;
                    font-weight: 800;
                    margin-bottom: 5px;
                }

                .signature-line {
                    width: 110px;
                    height: 55px;
                    border-bottom: 1.5px solid #000;
                    margin: 0 auto 5px;
                }

                .signature-description {
                    font-size: 10px;
                    font-weight: 600;
                    margin: 4px 0;
                }

                .signature-date {
                    text-align: left;
                    font-size: 10px;
                    font-weight: 600;
                    margin: 5px 0;
                }

                /* ===============================
                   PRINT SETTINGS
                =============================== */

                @page {
                    size: A4 portrait;
                    margin: 10mm;
                }

                @media print {
                    html,
                    body {
                        width: 100%;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                        color: #000 !important;
                    }

                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .packing-document {
                        width: 100%;
                        padding: 0 !important;
                        margin: 0 !important;
                        font-family: Arial, Helvetica, sans-serif;
                        color: #000 !important;
                    }

                    .company-name {
                        font-size: 17px !important;
                        font-weight: 800 !important;
                    }

                    .document-title {
                        font-size: 18px !important;
                        font-weight: 800 !important;
                    }

                    .info-table td {
                        color: #000 !important;
                        font-weight: 600 !important;
                    }

                    .info-label {
                        font-weight: 800 !important;
                    }

                    .packing-table th {
                        color: #000 !important;
                        font-weight: 900 !important;
                        background: #e5e5e5 !important;
                        border: 1px solid #000 !important;
                    }

                    .packing-table td {
                        color: #000 !important;
                        font-weight: 600 !important;
                        border: 1px solid #000 !important;
                    }

                    .grand-total td {
                        font-weight: 900 !important;
                        background: #eee !important;
                        border-top: 2px solid #000 !important;
                        border-bottom: 2px solid #000 !important;
                    }

                    .signature-title {
                        font-weight: 800 !important;
                    }

                    .signature-description,
                    .signature-date {
                        font-weight: 600 !important;
                    }

                    .packing-table tr {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }

                    .signature-container {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }

                    canvas {
                        image-rendering: crisp-edges;
                    }
                }
            `}</style>

            <div className="packing-document">

                {/* ===============================
                    COMPANY HEADER
                =============================== */}

                <div>
                    <p className="company-name">
                        PT Yusen Logistics Interlink Indonesia
                    </p>
                </div>

                <hr className="document-divider" />

                <h2 className="document-title">
                    PACKING LIST SUMMARY
                </h2>

                <hr className="document-divider" />

                {/* Hidden Barcode */}

                <table style={{ display: "none", width: "100%" }}>
                    <tbody>
                        <tr>
                            <td>
                                <canvas ref={barcodeRef} />
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* ===============================
                    PACKING INFORMATION
                =============================== */}

                <table className="info-table">
                    <tbody>
                        <tr>
                            <td className="info-label">
                                Packing No
                            </td>
                            <td className="info-value">
                                : {data.packing_no}
                            </td>
                        </tr>

                        <tr>
                            <td className="info-label">
                                Shipment ID
                            </td>
                            <td className="info-value">
                                : {data.shipment_id}
                            </td>
                        </tr>

                        <tr>
                            <td className="info-label">
                                Packing Date
                            </td>
                            <td className="info-value">
                                :{" "}
                                {data.packing_date
                                    ? new Date(
                                          data.packing_date
                                      ).toLocaleString("id-ID", {
                                          day: "2-digit",
                                          month: "2-digit",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                      })
                                    : "-"}
                            </td>
                        </tr>

                        <tr>
                            <td className="info-label">
                                Customer Name
                            </td>
                            <td className="info-value">
                                : {data.customer_name}
                            </td>
                        </tr>

                        <tr>
                            <td className="info-label">
                                Customer Address
                            </td>
                            <td className="info-value">
                                : {data.cust_address}
                            </td>
                        </tr>

                        <tr>
                            <td className="info-label">
                                Customer City
                            </td>
                            <td className="info-value">
                                : {data.cust_city}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* ===============================
                    PACKING DETAIL
                =============================== */}

                <table className="packing-table">
                    <thead>
                        <tr>
                            <th style={{ width: "5%" }}>
                                No
                            </th>

                            <th style={{ width: "10%" }}>
                                CTN Total
                            </th>

                            <th style={{ width: "18%" }}>
                                Item Code
                            </th>

                            <th style={{ width: "35%" }}>
                                Description
                            </th>

                            <th style={{ width: "10%" }}>
                                QTY PACK
                            </th>

                            <th style={{ width: "8%" }}>
                                UOM
                            </th>

                            <th style={{ width: "14%" }}>
                                QTY PCS
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {groupedData.map(
                            (item: any, index: number) => (
                                <tr
                                    key={`${item.item_code}-${item.package_type}`}
                                >
                                    <td className="text-center">
                                        {index + 1}
                                    </td>

                                    <td className="text-center">
                                        {formatCtnTotal(
                                            item.ctn_total
                                        )}
                                    </td>

                                    <td className="text-center">
                                        {item.item_code}
                                    </td>

                                    <td className="text-left">
                                        {item.item_name}
                                    </td>

                                    <td className="text-center">
                                        {item.qty_pack.toLocaleString(
                                            "en-US"
                                        )}
                                    </td>

                                    <td className="text-center">
                                        {item.package_type}
                                    </td>

                                    <td className="text-center">
                                        {item.qty_pcs.toLocaleString(
                                            "en-US"
                                        )}
                                    </td>
                                </tr>
                            )
                        )}

                        {/* GRAND TOTAL */}

                        <tr className="grand-total">
                            <td
                                colSpan={4}
                                style={{ textAlign: "right" }}
                            >
                                GRAND TOTAL
                            </td>

                            <td className="text-center">
                                {grandTotalQtyPack.toLocaleString(
                                    "en-US"
                                )}
                            </td>

                            <td className="text-center">
                                -
                            </td>

                            <td className="text-center">
                                {grandTotalQtyPcs.toLocaleString(
                                    "en-US"
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* ===============================
                    SIGNATURES
                =============================== */}

                <div className="signature-container">

                    <div className="signature-box">
                        <p className="signature-title">
                            Checker
                        </p>

                        <div className="signature-line" />

                        <p className="signature-description">
                            Name & Sign
                        </p>

                        <p className="signature-date">
                            Date :
                        </p>

                        <p className="signature-date">
                            Time :
                        </p>
                    </div>

                    <div className="signature-box">
                        <p className="signature-title">
                            Supervisor
                        </p>

                        <div className="signature-line" />

                        <p className="signature-description">
                            Name & Sign
                        </p>

                        <p className="signature-date">
                            Date :
                        </p>

                        <p className="signature-date">
                            Time :
                        </p>
                    </div>

                    <div className="signature-box">
                        <p className="signature-title">
                            Driver
                        </p>

                        <div className="signature-line" />

                        <p className="signature-description">
                            Name & Sign
                        </p>

                        <p className="signature-date">
                            Date :
                        </p>

                        <p className="signature-date">
                            Time :
                        </p>
                    </div>

                    <div className="signature-box">
                        <p className="signature-title">
                            Receiver
                        </p>

                        <div className="signature-line" />

                        <p className="signature-description">
                            Name & Sign
                        </p>

                        <p className="signature-date">
                            Date :
                        </p>

                        <p className="signature-date">
                            Time :
                        </p>
                    </div>

                </div>

            </div>
        </>
    );
};

export default PickingSheetPrint;
