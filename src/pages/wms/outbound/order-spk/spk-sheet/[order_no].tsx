/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import JsBarcode from "jsbarcode";
import api from "@/lib/api";
import React from "react";
import { Header } from "next/dist/lib/load-custom-routes";
import { HeaderSPK, MuatanOrderSPK } from "@/types/order-spk";

type OrderDetailItem = {
  outbound_id: number;
  outbound_no: string;
  deliv_to: string;
  deliv_to_name: string;
  deliv_city: string;
  shipment_id: string;
  total_koli: number;
  remarks: string;
  item_code: string;
  quantity: number;
  cbm: number;
  total_cbm: number;
};

type GroupedData = {
  [shipmentId: string]: OrderDetailItem[];
};

const SPKSheetPrint = () => {
  const router = useRouter();
  const { order_no } = router.query;
  const [order, setOrder] = useState<HeaderSPK>();
  const [orderItems, setOrderItems] = useState<MuatanOrderSPK[]>([]);
  const [orderDetailItems, setOrderDetailItems] = useState<OrderDetailItem[]>(
    []
  );
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const barcodeItemRef = useRef<Array<HTMLCanvasElement | null>>([]);
  const barcodeLocationRef = useRef<Array<HTMLCanvasElement | null>>([]);

  useEffect(() => {
    if (order_no) {
      fetchData(order_no as string);
      console.log(order_no);
    } else {
      return;
    }
  }, [order_no]);

  const fetchData = async (order_no: string) => {
    const res = await api.get(`/order/detail/${order_no}`);
    setOrder(res.data.data.order);
    setOrderItems(res.data.data.order.items);
    setOrderDetailItems(res.data.data.detail_items);
  };

  useEffect(() => {
    setTimeout(() => {
      window.print();
    }, 500);
  }, []);

  const groupedData = orderDetailItems.reduce((acc, item) => {
    if (!acc[item.shipment_id]) {
      acc[item.shipment_id] = [];
    }
    acc[item.shipment_id].push(item);
    return acc;
  }, {});

  const grandTotalKoli = Object.values(groupedData as GroupedData).reduce(
    (sum, records) => sum + records[0].total_koli,
    0
  );

  const grandTotalQty = Object.values(groupedData as GroupedData).reduce(
    (sum, records) => sum + records.reduce((s, r) => s + r.quantity, 0),
    0
  );

  const grandTotalCbm = Object.values(groupedData as GroupedData).reduce(
    (sum, records) => sum + records.reduce((s, r) => s + r.total_cbm, 0),
    0
  ).toFixed(4);

  useEffect(() => {
    console.log("groupedData : ", groupedData);
  }, [groupedData]);


  return (

    <div style={{ padding: "10px", fontFamily: "Arial" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        {/* <img src="/images/yusen001.jpeg" alt="Logo" width="100" /> */}
        {/* <canvas ref={barcodeRef}></canvas> */}
        <p
          style={{ fontSize: "16px", textAlign: "center", fontWeight: "bold" }}
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
            <th style={th}>Delivery To</th>
            <th style={th}>Delivery City</th>
            <th style={th}>DO No</th>
            <th style={th}>Item Code</th>
            <th style={th}>QTY</th>
            <th style={th}>Total CBM</th>
            <th style={th}>Total Koli</th>
            <th style={th}>Remarks</th>
          </tr>
        </thead>
        <tbody>

          {Object.entries(groupedData as GroupedData).length > 0 ? (
            Object.entries(groupedData as GroupedData).map(
              ([shipmentId, records], i) => {
                const totalQty = (records as any[]).reduce(
                  (sum, r) => sum + r.quantity,
                  0
                );
                const totalCbm = (records as any[]).reduce(
                  (sum, r) => sum + r.total_cbm,
                  0
                ).toFixed(4);
                const totalKoli = (records as any[]).reduce(
                  (sum, r) => records[0].total_koli,
                  0
                );

                return (
                  <React.Fragment key={shipmentId}>
                    {records.map((item, j) => (
                      <tr key={j}>
                        <td style={{ textAlign: "left" }}>
                          {j === 0 ? item.deliv_to_name : ""}
                        </td>
                        <td style={{ textAlign: "left" }}>
                          {j === 0 ? item.deliv_city : ""}
                        </td>
                        <td style={{ textAlign: "left" }}>
                          {item.shipment_id}
                        </td>
                        <td style={{ textAlign: "left" }}>{item.item_code}</td>
                        <td style={{ textAlign: "center" }}>{item.quantity}</td>
                        <td style={{ textAlign: "left" }}>
                          {item.total_cbm}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {j === 0 ? item.total_koli : ""}
                        </td>
                        <td style={{ textAlign: "center" }}>{item.remarks}</td>
                      </tr>
                    ))}
                    <tr style={{ background: "#f5f5f5", fontWeight: "bold" }}>
                      <td colSpan={4} style={{ ...td, textAlign: "right" }}>
                        TOTAL
                      </td>
                      <td style={{ ...td, textAlign: "center" }}>{totalQty}</td>
                      <td style={{ ...td, textAlign: "left" }}>{totalCbm}</td>
                      <td style={{ ...td, textAlign: "center" }}>
                        {totalKoli}
                      </td>
                      <td style={{ ...td, textAlign: "center" }}></td>
                    </tr>
                  </React.Fragment>
                );
              }
            )
          ) : (
            <tr>
              <td colSpan={5} style={{ textAlign: "center" }}>
                No data
              </td>
            </tr>
          )}

          <tr style={{ fontWeight: "bold", background: "#eaeaea" }}>
            <td colSpan={4} style={{ ...td, textAlign: "right" }}>
              GRAND TOTAL
            </td>
            <td style={{ ...td, textAlign: "center" }}>{grandTotalQty}</td>
            <td style={{ ...td, textAlign: "left" }}>{grandTotalCbm}</td>
            <td style={{ ...td, textAlign: "center" }}>{grandTotalKoli}</td>
            <td style={{ ...td, textAlign: "center" }}>{}</td>
          </tr>
        </tbody>
      </table>

      <div
        style={{
          marginTop: "50px",
          display: "flex",
          justifyContent: "space-around",
        }}
      >
        <div>
          <p style={{ textAlign: "center", fontSize: "10px" }}>Checker</p>
          <div style={signatureLine}></div>
          <p style={{ textAlign: "center", fontSize: "10px" }}>Name & Sign</p>
          <p style={{ textAlign: "left", fontSize: "10px" }}>Date : </p>
          <p style={{ textAlign: "left", fontSize: "10px" }}>Time : </p>
        </div>
        <div>
          <p style={{ textAlign: "center", fontSize: "10px" }}>Dispatcher</p>
          <div style={signatureLine}></div>
          <p style={{ textAlign: "center", fontSize: "10px" }}>Name & Sign</p>
          <p style={{ textAlign: "left", fontSize: "10px" }}>Date : </p>
          <p style={{ textAlign: "left", fontSize: "10px" }}>Time : </p>
        </div>
        <div>
          <p style={{ textAlign: "center", fontSize: "10px" }}>Transporter</p>
          <div style={signatureLine}></div>
          <p style={{ textAlign: "center", fontSize: "10px" }}>Name & Sign</p>
          <p style={{ textAlign: "left", fontSize: "10px" }}>Date : </p>
          <p style={{ textAlign: "left", fontSize: "10px" }}>Time : </p>
        </div>
      </div>
      <div
        style={{
          marginTop: "50px",
          width: "100%",
          height: "100px",
          border: "1px solid #000",
          padding: "10px",
        }}
      >
        <p style={{ textAlign: "left", fontSize: "12px", fontWeight: "bold" }}>
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
