/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import JsBarcode from "jsbarcode";
import api from "@/lib/api";
import React from "react";

const PickingSheetPrint = () => {
    const router = useRouter();
    const { packing, id } = router.query;
    const [packingItems, setPackingItems] = useState<any[]>([]);
    const barcodeRef = useRef<HTMLCanvasElement>(null);
    const barcodeItemRef = useRef<Array<HTMLCanvasElement | null>>([]);
    const barcodeLocationRef = useRef<Array<HTMLCanvasElement | null>>([]);

    useEffect(() => {
        if (packing && id) {
            console.log("packing : ", packing);
            console.log("id : ", id);
            fetchData(id as string);
        }
    }, [packing, id]);

    const fetchData = async (id: string) => {
        const res = await api.get(`/outbound/${id}/packing/${packing}`, {
            withCredentials: true,
        });
        setPackingItems(res.data.data.list);
    };

    useEffect(() => {
        if (packingItems.length > 0 && barcodeRef.current) {
            JsBarcode(barcodeRef.current, packingItems[0].packing_no, {
                format: "CODE128",
                displayValue: true,
                fontSize: 14,
                width: 2,
                height: 50,
            });

            packingItems.forEach((item, index) => {
                const canvasBarcode = barcodeLocationRef.current[index];
                if (canvasBarcode) {
                    JsBarcode(canvasBarcode, item.location, {
                        format: "CODE128",
                        displayValue: false,
                        width: 1.5,
                        height: 20,
                        margin: 0,
                    });
                }

                const canvasBarcodeItem = barcodeItemRef.current[index];
                if (canvasBarcodeItem) {
                    JsBarcode(canvasBarcodeItem, item.barcode, {
                        format: "CODE128",
                        displayValue: false,
                        width: 1.5,
                        height: 20,
                        margin: 0,
                    });
                }
            });

            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [packingItems]);

    if (packingItems.length === 0) return <p>Loading...</p>;

    const data = packingItems[0];

    // sebelum return JSX
    //   const groupedData = packingItems.reduce((acc, item) => {
    //     if (!acc[item.item_code]) {
    //       acc[item.item_code] = [];
    //     }
    //     acc[item.item_code].push(item);
    //     return acc;
    //   }, {});

    //   const grandTotalQty = packingItems.reduce(
    //     (acc, item) => acc + item.quantity,
    //     0
    //   );

    //   const grandTotalCbm = packingItems
    //     .reduce((acc, item) => acc + item.cbm, 0)
    //     .toFixed(3);

    const groupedData = Object.values(
        packingItems.reduce((acc: any, item: any) => {
            const key = `${item.item_code}_${item.package_type}`;

            if (!acc[key]) {
                acc[key] = {
                    item_code: item.item_code,
                    item_name: item.item_name,
                    package_type: item.package_type,
                    cartons: new Set<string>(),
                    qty_pack: 0,
                    qty_pcs: 0,
                };
            }

            const group = acc[key];

            // Unique carton
            group.cartons.add(String(item.pack_ctn_no));

            // Total package quantity
            group.qty_pack += Number(item.package_qty || 0);

            // Total PCS
            group.qty_pcs += Number(item.quantity || 0);

            return acc;
        }, {})
    );

    const grandTotalQtyPack = groupedData.reduce(
        (sum: number, item: any) => sum + item.qty_pack,
        0
    );

    const grandTotalQtyPcs = groupedData.reduce(
        (sum: number, item: any) => sum + item.qty_pcs,
        0
    );

    // let numbering = 1;

    return (
        <div style={{ padding: "10px", fontFamily: "Arial" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "center" }}>
                <p
                    style={{ fontSize: "16px", textAlign: "center", fontWeight: "bold" }}
                >
                    PT Yusen Logistics Interlink Indonesia
                </p>
            </div>

            <hr
                style={{
                    border: "1px solid black",
                    marginBottom: "10px",
                    marginTop: "10px",
                }}
            />

            <h2
                style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    marginBottom: "10px",
                }}
            >
                PACKING LIST SUMMARY
            </h2>

            <hr
                style={{
                    border: "1px solid black",
                    marginBottom: "10px",
                    marginTop: "10px",
                }}
            />

            <table style={{ display: "none", width: "100%", marginBottom: "10px" }}>
                <tr>
                    <td style={{ textAlign: "center", width: "33%" }}>
                        <canvas
                            style={{ width: "200px", height: "50px" }}
                            ref={barcodeRef}
                        ></canvas>
                    </td>
                    <td style={{ textAlign: "center" }}>
                        <div
                            style={{
                                fontSize: "12px",
                                border: "1px solid black",
                                padding: "5px",
                                width: "220px",
                            }}
                        >
                            <span {...{ style: { fontWeight: "bold" } }}>
                                {data.transporter_code}
                                {" to "}
                                {data.cust_city}
                            </span>
                        </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                        <div
                            style={{
                                fontSize: "12px",
                                border: "1px solid black",
                                padding: "5px",
                                width: "100px",
                            }}
                        >
                            <span {...{ style: { fontWeight: "bold" } }}>
                                {data.shipment_id}
                            </span>
                        </div>
                    </td>
                </tr>
            </table>

            {/* Outbound Info */}
            <div style={{ fontSize: "12px", marginTop: "10px" }}>
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "12px",
                    }}
                >
                    <tbody>
                        <tr>
                            <td style={headerLabel}>Packing No</td>
                            <td style={headerValue}>{data.packing_no}</td>
                        </tr>
                        <tr>
                            <td style={headerLabel}>Shipment ID</td>
                            <td style={headerValue}>{data.shipment_id}</td>
                        </tr>
                        <tr>
                            <td style={headerLabel}>Packing Date</td>
                            <td style={headerValue}>
                                {new Date(data.packing_date).toLocaleDateString("id-ID", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </td>
                        </tr>
                        <tr>
                            <td style={headerLabel}>Customer Name</td>
                            <td style={headerValue}>{data.customer_name}</td>
                        </tr>
                        <tr>
                            <td style={headerLabel}>Customer Address</td>
                            <td style={headerValue}>{data.cust_address}</td>
                        </tr>
                        <tr>
                            <td style={headerLabel}>Customer City</td>
                            <td style={headerValue}>{data.cust_city}</td>
                        </tr>
                        <tr></tr>
                        {/* <tr>
                            <td style={headerLabel}>Delivery To</td>
                            <td style={headerValue}>{data.deliv_to_name}</td>
                        </tr>
                        <tr>
                            <td style={headerLabel}>Delivery Address</td>
                            <td style={headerValue}>{data.deliv_address}</td>
                        </tr>
                        <tr>
                            <td style={headerLabel}>Delivery City</td>
                            <td style={headerValue}>{data.deliv_city}</td>
                        </tr> */}
                        <tr>
                            <td style={headerLabel}></td>
                            <td style={headerValue}></td>
                        </tr>
                    </tbody>
                </table>
            </div>


            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginTop: "20px",
                    fontSize: "10px",
                    tableLayout: "fixed",
                }}
            >
                <thead>
                    <tr>
                        <th style={{ ...th, width: "5%" }}>No</th>
                        <th style={{ ...th, width: "10%" }}>CTN total</th>
                        <th style={{ ...th, width: "18%" }}>Item Code</th>
                        <th style={{ ...th, width: "35%" }}>Description</th>
                        <th style={{ ...th, width: "10%" }}>QTY PACK</th>
                        <th style={{ ...th, width: "8%" }}>UOM</th>
                        <th style={{ ...th, width: "14%" }}>QTY PCS</th>
                    </tr>
                </thead>

                <tbody>
                    {groupedData.map((item: any, index: number) => (
                        <tr key={`${item.item_code}-${item.package_type}`}>
                            <td style={{ ...td, textAlign: "center" }}>
                                {index + 1}
                            </td>

                            <td style={{ ...td, textAlign: "center" }}>
                                {item.cartons.size}
                            </td>

                            <td style={{ ...td, textAlign: "center" }}>
                                {item.item_code}
                            </td>

                            <td
                                style={{
                                    ...td,
                                    textAlign: "left",
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                    lineHeight: "1.2",
                                }}
                            >
                                {item.item_name}
                            </td>

                            <td style={{ ...td, textAlign: "center" }}>
                                {item.qty_pack.toLocaleString("en-US")}
                            </td>

                            <td style={{ ...td, textAlign: "center" }}>
                                {item.package_type}
                            </td>

                            <td style={{ ...td, textAlign: "center" }}>
                                {item.qty_pcs.toLocaleString("en-US")}
                            </td>
                        </tr>
                    ))}

                    <tr style={{ fontWeight: "bold" }}>
                        <td colSpan={4} style={{ ...td, textAlign: "right" }}>
                            GRAND TOTAL
                        </td>

                        <td style={{ ...td, textAlign: "center" }}>
                            {grandTotalQtyPack.toLocaleString()}
                        </td>

                        <td style={{ ...td, textAlign: "center" }}>
                            -
                        </td>

                        <td style={{ ...td, textAlign: "center" }}>
                            {grandTotalQtyPcs.toLocaleString()}
                        </td>
                    </tr>
                </tbody>
            </table>


            {/* Signatures */}
            <div
                style={{
                    marginTop: "50px",
                    display: "flex",
                    justifyContent: "space-around",
                }}
            >
                <div>
                    <p style={{ textAlign: "center", fontSize: "10px" }}>
                        Checker
                    </p>
                    <div style={signatureLine}></div>
                    <p style={{ textAlign: "center", fontSize: "10px" }}>Name & Sign</p>
                    <p style={{ textAlign: "left", fontSize: "10px" }}>Date : </p>
                    <p style={{ textAlign: "left", fontSize: "10px" }}>Time : </p>
                </div>
                <div>
                    <p style={{ textAlign: "center", fontSize: "10px" }}>
                        Supervisor
                    </p>
                    <div style={signatureLine}></div>
                    <p style={{ textAlign: "center", fontSize: "10px" }}>Name & Sign</p>
                    <p style={{ textAlign: "left", fontSize: "10px" }}>Date : </p>
                    <p style={{ textAlign: "left", fontSize: "10px" }}>Time : </p>
                </div>
                <div>
                    <p style={{ textAlign: "center", fontSize: "10px" }}>
                        Driver
                    </p>
                    <div style={signatureLine}></div>
                    <p style={{ textAlign: "center", fontSize: "10px" }}>Name & Sign</p>
                    <p style={{ textAlign: "left", fontSize: "10px" }}>Date : </p>
                    <p style={{ textAlign: "left", fontSize: "10px" }}>Time : </p>
                </div>
                <div>
                    <p style={{ textAlign: "center", fontSize: "10px" }}>
                        Receiver
                    </p>
                    <div style={signatureLine}></div>
                    <p style={{ textAlign: "center", fontSize: "10px" }}>Name & Sign</p>
                    <p style={{ textAlign: "left", fontSize: "10px" }}>Date : </p>
                    <p style={{ textAlign: "left", fontSize: "10px" }}>Time : </p>
                </div>
            </div>
        </div>
    );
};

const th = {
    border: "1px solid #000",
    padding: "4px",
    backgroundColor: "#eee",
};

const td = {
    borderBottom: "1px dashed #000",
    padding: "4px",
};

const headerLabel = {
    padding: "2px 6px",
    fontWeight: "bold" as const,
    whiteSpace: "nowrap" as const,
    width: "7%",
};

const headerValue = {
    padding: "2px 6px",
    width: "30%",
};

const signatureLine = {
    borderBottom: "1px solid black",
    width: "100px",
    height: "55px",
    marginBottom: "5px",
};

export default PickingSheetPrint;
