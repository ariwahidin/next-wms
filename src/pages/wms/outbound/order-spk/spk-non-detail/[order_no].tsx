
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import JsBarcode from "jsbarcode";
import api from "@/lib/api";
import { printDocument } from "@/lib/print";
import React from "react";
import { HeaderSPK } from "@/types/order-spk";

type OrderDetailItem = {
  shipment_id: string;
  deliv_to_name: string;
  deliv_city: string;
  total_koli: number;
  remarks: string;
  quantity: number;
  total_cbm: number;
};

type ShipmentSummary = {
  shipment_id: string;
  deliv_to_name: string;
  deliv_city: string;
  total_qty: number;
  total_cbm: number;
  total_koli: number;
  remarks: string;
};

const SPKSheetPrint = () => {
  const router = useRouter();
  const { order_no } = router.query;

  const [order, setOrder] = useState<HeaderSPK>();
  const [orderDetailItems, setOrderDetailItems] = useState<OrderDetailItem[]>([]);

  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const printStartedRef = useRef(false);

  useEffect(() => {
    if (order_no) {
      fetchData(order_no as string);
    }
  }, [order_no]);

  const fetchData = async (order_no: string) => {
    const res = await api.get(`/order/detail/${order_no}`);

    setOrder(res.data.data.order);
    setOrderDetailItems(res.data.data.detail_items || []);
  };

  // Generate SPK Barcode
  useEffect(() => {
    if (!order?.order_no || !barcodeRef.current) return;

    JsBarcode(barcodeRef.current, order.order_no, {
      format: "CODE128",
      displayValue: true,
      fontSize: 14,
      width: 2,
      height: 50,
    });

    const printTimer = window.setTimeout(async () => {
      if (printStartedRef.current) return;

      printStartedRef.current = true;

      try {
        await printDocument({
          documentType: "SPK_SHEET_NON_DETAIL",
          documentNo: order.order_no,
          module: "OUTBOUND",
          printMethod: "BROWSER",
          printFormat: "PDF",
          copyCount: 1,
        });

        window.print();
      } catch (error) {
        printStartedRef.current = false;
        console.error("SPK sheet print error:", error);
        window.alert(
          error instanceof Error
            ? error.message
            : "Failed to process print request."
        );
      }
    }, 700);

    return () => window.clearTimeout(printTimer);
  }, [order?.order_no]);

  // ============================================================
  // GROUP DATA BY SHIPMENT / DO
  // ============================================================

  const groupedData = orderDetailItems.reduce(
    (acc, item) => {
      const shipmentId = item.shipment_id;

      if (!acc[shipmentId]) {
        acc[shipmentId] = {
          shipment_id: shipmentId,
          deliv_to_name: item.deliv_to_name,
          deliv_city: item.deliv_city,
          total_qty: 0,
          total_cbm: 0,
          total_koli: Number(item.total_koli) || 0,
          remarks: item.remarks || "",
        };
      }

      acc[shipmentId].total_qty += Number(item.quantity) || 0;
      acc[shipmentId].total_cbm += Number(item.total_cbm) || 0;

      return acc;
    },
    {} as Record<string, ShipmentSummary>
  );

  const shipmentSummaries = Object.values(groupedData);

  // ============================================================
  // GRAND TOTAL
  // ============================================================

  const grandTotalQty = shipmentSummaries.reduce(
    (sum, item) => sum + item.total_qty,
    0
  );

  const grandTotalCbm = shipmentSummaries
    .reduce((sum, item) => sum + item.total_cbm, 0)
    .toFixed(4);

  const grandTotalKoli = shipmentSummaries.reduce(
    (sum, item) => sum + item.total_koli,
    0
  );

  return (
    <div style={{ padding: "10px", fontFamily: "Arial" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <p
          style={{
            fontSize: "16px",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          PT YUSEN LOGISTICS INTERLINK INDONESIA
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
          marginBottom: "20px",
          marginTop: "10px",
          textDecoration: "underline",
        }}
      >
        SURAT PERINTAH KIRIM
      </h2>

      {/* SPK BARCODE */}
      <div
        style={{
          width: "278px",
          height: "52px",
          marginTop: "4px",
          marginBottom: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          overflow: "hidden",
        }}
      >
        {order?.order_no && (
          <canvas
            ref={barcodeRef}
            aria-label={`Barcode for SPK ${order.order_no}`}
            style={{ width: "200px", height: "50px" }}
          />
        )}
      </div>

      {/* ORDER INFORMATION */}
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
              <td style={headerLabel}>No. SPK/Order</td>
              <td style={headerValue}>: {order?.order_no}</td>
              <td style={headerLabel}>Transporter</td>
              <td style={headerValue}>: {order?.transporter_name}</td>
            </tr>

            <tr>
              <td style={headerLabel}>Order Date</td>
              <td style={headerValue}>: {order?.order_date}</td>
              <td style={headerLabel}>Driver</td>
              <td style={headerValue}>: {order?.driver}</td>
            </tr>

            <tr>
              <td style={headerLabel}>Truck Type</td>
              <td style={headerValue}>: {order?.truck_type}</td>
              <td style={headerLabel}>Truck No</td>
              <td style={headerValue}>: {order?.truck_no}</td>
            </tr>

            <tr>
              <td style={headerLabel}>Load Date</td>
              <td style={headerValue}>: {order?.load_date}</td>
              <td style={headerLabel}>Arrival Date</td>
              <td style={headerValue}>:</td>
            </tr>

            <tr>
              <td style={headerLabel}>Load Start Time</td>
              <td style={headerValue}>: {order?.load_start_time}</td>
              <td style={headerLabel}>Arrival Time</td>
              <td style={headerValue}>:</td>
            </tr>

            <tr>
              <td style={headerLabel}>Load End Time</td>
              <td style={headerValue}>: {order?.load_end_time}</td>
              <td style={headerLabel}></td>
              <td style={headerValue}></td>
            </tr>

            <tr>
              <td style={headerLabel}>Remarks</td>
              <td style={headerValue}>: {order?.remarks}</td>
              <td style={headerLabel}></td>
              <td style={headerValue}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ======================================================
          SHIPMENT SUMMARY - WITHOUT ITEM DETAILS
      ====================================================== */}

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
          fontSize: "12px",
        }}
      >
        <thead>
          <tr>
            <th style={{ ...th, width: "4%" }}>NO</th>
            <th style={th}>Delivery To</th>
            <th style={th}>Delivery City</th>
            <th style={th}>DO No</th>
            <th style={th}>Total Qty</th>
            <th style={th}>Total CBM</th>
            <th style={th}>Total Koli</th>
            <th style={th}>Remarks</th>
          </tr>
        </thead>

        <tbody>
          {shipmentSummaries.length > 0 ? (
            shipmentSummaries.map((item, index) => (
              <tr key={item.shipment_id}>
                <td style={{ ...td, textAlign: "center" }}>
                  {index + 1}
                </td>

                <td style={{ ...td, textAlign: "left" }}>
                  {item.deliv_to_name}
                </td>

                <td style={{ ...td, textAlign: "left" }}>
                  {item.deliv_city}
                </td>

                <td style={{ ...td, textAlign: "left" }}>
                  {item.shipment_id}
                </td>

                <td style={{ ...td, textAlign: "center" }}>
                  {item.total_qty}
                </td>

                <td style={{ ...td, textAlign: "center" }}>
                  {item.total_cbm.toFixed(4)}
                </td>

                <td style={{ ...td, textAlign: "center" }}>
                  {item.total_koli}
                </td>

                <td style={{ ...td, textAlign: "left" }}>
                  {item.remarks}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} style={{ ...td, textAlign: "center" }}>
                No data
              </td>
            </tr>
          )}

          {/* GRAND TOTAL */}
          <tr
            style={{
              fontWeight: "bold",
              background: "#eaeaea",
            }}
          >
            <td colSpan={4} style={{ ...td, textAlign: "right" }}>
              GRAND TOTAL
            </td>

            <td style={{ ...td, textAlign: "center" }}>
              {grandTotalQty}
            </td>

            <td style={{ ...td, textAlign: "center" }}>
              {grandTotalCbm}
            </td>

            <td style={{ ...td, textAlign: "center" }}>
              {grandTotalKoli}
            </td>

            <td style={td}></td>
          </tr>
        </tbody>
      </table>

      {/* SIGNATURE */}
      <div
        style={{
          marginTop: "50px",
          display: "flex",
          justifyContent: "space-around",
        }}
      >
        {["Supervisor", "Dispatcher", "Transporter"].map((role) => (
          <div key={role}>
            <p
              style={{
                textAlign: "center",
                fontSize: "10px",
              }}
            >
              {role}
            </p>

            <div style={signatureLine}></div>

            <p style={{ textAlign: "center", fontSize: "10px" }}>
              Name & Sign
            </p>

            <p style={{ textAlign: "left", fontSize: "10px" }}>
              Date :
            </p>

            <p style={{ textAlign: "left", fontSize: "10px" }}>
              Time :
            </p>
          </div>
        ))}
      </div>

      {/* NOTE */}
      <div
        style={{
          marginTop: "50px",
          width: "100%",
          height: "100px",
          border: "1px solid #000",
          padding: "10px",
        }}
      >
        <p
          style={{
            textAlign: "left",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          Note :
        </p>
      </div>
    </div>
  );
};

const th = {
  border: "1px solid #000",
  padding: "4px",
  backgroundColor: "#eee",
  textAlign: "center" as const,
};

const td = {
  borderBottom: "1px dashed #000",
  padding: "4px",
};

const headerLabel = {
  padding: "2px 6px",
  fontWeight: "bold" as const,
  whiteSpace: "nowrap" as const,
  width: "20%",
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

export default SPKSheetPrint;
