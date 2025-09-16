/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import JsBarcode from "jsbarcode";
import api from "@/lib/api";
import React from "react";
import { Header } from "next/dist/lib/load-custom-routes";
import { HeaderSPK, MuatanOrderSPK } from "@/types/order-spk";

// type OrderDetailItem = {
//   outbound_id: number;
//   outbound_no: string;
//   deliv_to: string;
//   deliv_to_name: string;
//   deliv_city: string;
//   shipment_id: string;
//   total_koli: number;
//   remarks: string;
//   item_code: string;
//   quantity: number;
//   cbm: number;
//   total_cbm: number;
// };

// type GroupedData = {
//   [shipmentId: string]: OrderDetailItem[];
// };

const SerialNumberSheet = () => {
  const router = useRouter();
  const { outbound_no } = router.query;
  const [header, setHeader] = useState<any>();
  const [items, setItems] = useState<any[]>();
  //   const [orderItems, setOrderItems] = useState<MuatanOrderSPK[]>([]);
  //   const [orderDetailItems, setOrderDetailItems] = useState<OrderDetailItem[]>(
  //     []
  //   );
  //   const barcodeRef = useRef<HTMLCanvasElement>(null);
  //   const barcodeItemRef = useRef<Array<HTMLCanvasElement | null>>([]);
  //   const barcodeLocationRef = useRef<Array<HTMLCanvasElement | null>>([]);

  useEffect(() => {
    if (outbound_no) {
      fetchData(outbound_no as string);
      console.log("OUTBOUND ID : ", outbound_no);
    } else {
      return;
    }
  }, [outbound_no]);

  const fetchData = async (outbound_no: string) => {
    const res = await api.get(`/outbound/serial/${outbound_no}`);
    setHeader(res.data.data?.header);
    setItems(res.data.data?.items);
    // setOrderItems(res.data.data.order.items);
    // setOrderDetailItems(res.data.data.detail_items);
  };

    useEffect(() => {
      setTimeout(() => {
        window.print();
      }, 500);
    }, []);

  //   const groupedData = orderDetailItems.reduce((acc, item) => {
  //     if (!acc[item.shipment_id]) {
  //       acc[item.shipment_id] = [];
  //     }
  //     acc[item.shipment_id].push(item);
  //     return acc;
  //   }, {});

  //   const grandTotalKoli = Object.values(groupedData as GroupedData).reduce(
  //     (sum, records) => sum + records[0].total_koli,
  //     0
  //   );

  //   const grandTotalQty = Object.values(groupedData as GroupedData).reduce(
  //     (sum, records) => sum + records.reduce((s, r) => s + r.quantity, 0),
  //     0
  //   );

  //   const grandTotalCbm = Object.values(groupedData as GroupedData).reduce(
  //     (sum, records) => sum + records.reduce((s, r) => s + r.total_cbm, 0),
  //     0
  //   );

  //   useEffect(() => {
  //     console.log("groupedData : ", groupedData);
  //   }, [groupedData]);

  return (
    <div style={{ padding: "10px", fontFamily: "Arial" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        {/* <img src="/images/yusen001.jpeg" alt="Logo" width="100" /> */}
        {/* <canvas ref={barcodeRef}></canvas> */}
        <p
          style={{ fontSize: "16px", textAlign: "center", fontWeight: "bold" }}
        >
          PT YUSEN LOGISTICS PUNINAR INDONESIA
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
        SERIAL NUMBER LIST
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
              <td style={{ ...headerLabel, fontWeight: "bold", width: "8%" }}>
                Customer
              </td>
              <td style={headerValue}>: {header?.customer_name}</td>
              {/* <td style={headerLabel}></td>
              <td style={headerValue}></td> */}
            </tr>
            <tr>
              <td style={{ ...headerLabel, fontWeight: "bold", width: "8%" }}>
                Customer Address
              </td>
              <td style={headerValue}>: {header?.customer_address}</td>
              {/* <td style={headerLabel}></td>
              <td style={headerValue}></td> */}
            </tr>
            <tr>
              <td style={{ ...headerLabel, fontWeight: "bold", width: "8%" }}>
                Delivery To
              </td>
              <td style={headerValue}>: {header?.deliv_to_name}</td>
              {/* <td style={headerLabel}></td>
              <td style={headerValue}></td> */}
            </tr>
            <tr>
              <td style={{ ...headerLabel, fontWeight: "bold", width: "8%" }}>
                Delivery Address
              </td>
              <td style={headerValue}>: {header?.customer_address}</td>
              {/* <td style={headerLabel}></td>
              <td style={headerValue}></td> */}
            </tr>
            <tr>
              <td style={{ ...headerLabel, fontWeight: "bold", width: "8%" }}>
                Transporter
              </td>
              <td style={headerValue}>: {header?.transporter_name}</td>
              {/* <td style={headerLabel}></td>
              <td style={headerValue}></td> */}
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
            <th style={th}>No</th>
            <th style={th}>Delivery No</th>
            <th style={th}>Picking No</th>
            <th style={th}>Item Code</th>
            <th style={th}>Description</th>
            <th style={th}>SN</th>
          </tr>
        </thead>
        <tbody>
          {items?.length > 0 ? (
            items.map((item, i) => (
              <tr key={i}>
                <td style={{ ...td, textAlign: "center" }}>{i + 1}</td>
                <td style={td}>{header.shipment_id}</td>
                <td style={td}>{header.outbound_no}</td>
                <td style={td}>{item.item_code}</td>
                <td style={td}>{item.item_name}</td>
                <td style={td}>{item.serial_number}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} style={td}>
                No data found
              </td>
            </tr>
          )}

          {/* {Object.entries(groupedData as GroupedData).length > 0 ? (
            Object.entries(groupedData as GroupedData).map(
              ([shipmentId, records], i) => {
                const totalQty = (records as any[]).reduce(
                  (sum, r) => sum + r.quantity,
                  0
                );
                const totalCbm = (records as any[]).reduce(
                  (sum, r) => sum + r.total_cbm,
                  0
                );
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
                        <td style={{ textAlign: "left" }}>{item.total_cbm}</td>
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
          )} */}

          <tr style={{ fontWeight: "bold", background: "#eaeaea" }}>
            <td colSpan={5} style={{ ...td, textAlign: "right" }}>
              GRAND TOTAL
            </td>
            <td style={{ ...td, textAlign: "center" }}>{items?.length}</td>
          </tr>
        </tbody>
      </table>

      {/* <div
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
      </div> */}
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

export default SerialNumberSheet;
