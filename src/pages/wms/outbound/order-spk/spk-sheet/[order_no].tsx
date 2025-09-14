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
    // if (orderDetailItems.length > 0 && barcodeRef.current) {
    //   JsBarcode(barcodeRef.current, pickingSheet[0].outbound_no, {
    //     format: "CODE128",
    //     displayValue: true,
    //     fontSize: 14,
    //     width: 2,
    //     height: 50,
    //   });

    //   pickingSheet.forEach((item, index) => {
    //     const canvasBarcode = barcodeLocationRef.current[index];
    //     if (canvasBarcode) {
    //       JsBarcode(canvasBarcode, item.location, {
    //         format: "CODE128",
    //         displayValue: false,
    //         width: 1.5,
    //         height: 20,
    //         margin: 0,
    //       });
    //     }

    //     const canvasBarcodeItem = barcodeItemRef.current[index];
    //     if (canvasBarcodeItem) {
    //       JsBarcode(canvasBarcodeItem, item.barcode, {
    //         format: "CODE128",
    //         displayValue: false,
    //         width: 1.5,
    //         height: 20,
    //         margin: 0,
    //       });
    //     }
    // });

    setTimeout(() => {
      window.print();
    }, 500);
  }, []);

  // if (pickingSheet.length === 0) return <p>Loading...</p>;

  //   const data = pickingSheet[0];

  // sebelum return JSX
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
  );

  useEffect(() => {
    console.log("groupedData : ", groupedData);
  }, [groupedData]);

  //   const grandTotalQty = pickingSheet.reduce(
  //     (acc, item) => acc + item.quantity,
  //     0
  //   );

  //   const grandTotalCbm = pickingSheet
  //     .reduce((acc, item) => acc + item.cbm, 0)
  //     .toFixed(3);

  return (
    // {order.length === 0 ? (
    //   <p>Loading...</p>
    // ) : (<>

    //   </>)}

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
        SURAT PERINTAH KIRIM
      </h2>
      {/* <table style={{ width: "100%", marginBottom: "10px" }}>
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
      </table> */}

      {/* Header Info */}
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
            {/* <tr>
              <td style={headerLabel}>Shipment ID</td>
              <td style={headerValue}>{data.shipment_id}</td>
              <td style={headerLabel}>Customer Name</td>
              <td style={headerValue}>{data.customer_name}</td>
            </tr>
            <tr>
              <td style={headerLabel}>Picking Date</td>
              <td style={headerValue}>
                {new Date(data.outbound_date).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>

              <td style={headerLabel}>Customer Address</td>
              <td style={headerValue}>{data.cust_address}</td>
            </tr>
            <tr>
              <td style={headerLabel}>Picker</td>
              <td style={headerValue}>{data.picker_name}</td>
              <td style={headerLabel}>Customer City</td>
              <td style={headerValue}>{data.cust_city}</td>
            </tr>
            <tr></tr>
            <tr>
              <td style={headerLabel}>Plan Pickup</td>
              <td style={headerValue}>
                {new Date(
                  `${data.plan_pickup_date}T${data.plan_pickup_time}`
                ).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>

              <td style={headerLabel}>Delivery To</td>
              <td style={headerValue}>{data.deliv_to_name}</td>
            </tr>
            <tr>
              <td style={headerLabel}>Print Date/Time</td>
              <td style={headerValue}>
                {new Date().toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td style={headerLabel}>Delivery Address</td>
              <td style={headerValue}>{data.deliv_address}</td>
            </tr>
            <tr>
              <td style={headerLabel}>Remarks</td>
              <td style={headerValue}>{data.remarks}</td>
              <td style={headerLabel}>Delivery City</td>
              <td style={headerValue}>{data.deliv_city}</td>
            </tr>
            <tr>
              <td style={headerLabel}></td>
              <td style={headerValue}></td>
            </tr> */}
          </tbody>
        </table>
      </div>

      {/* Items Info */}
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
          {/* {Object.entries(groupedData).map(
            ([shipmentId, records]: [string, any], i) => {
              const totalQty = (records as any[]).reduce(
                (sum, r) => sum + r.quantity,
                0
              );
              const totalCbm = (records as any[]).reduce(
                (sum, r) => sum + r.cbm,
                0
              );
              return (
                <React.Fragment key={shipmentId}>
                  {records.map((item, j) => (
                    <tr key={j}>
                      <td style={{ textAlign: "center" }}>
                        {item.delivery_to}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            }
          )} */}

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

          {/* grand total */}
          <tr style={{ fontWeight: "bold", background: "#eaeaea" }}>
            <td colSpan={4} style={{ ...td, textAlign: "right" }}>
              GRAND TOTAL
            </td>
            <td style={{ ...td, textAlign: "center" }}>{grandTotalQty}</td>
            <td style={{ ...td, textAlign: "left" }}>{grandTotalCbm}</td>
            <td style={{ ...td, textAlign: "center" }}>{grandTotalKoli}</td>
            <td style={{ ...td, textAlign: "center" }}>{}</td>
          </tr>
          {/* {orderDetailItems.map((item, i) => (
            <tr key={i}>
              <td style={{ textAlign: "left" }}>{item.deliv_to_name}</td>
              <td style={{ textAlign: "center" }}>{item.deliv_city}</td>
              <td style={{ textAlign: "left" }}>{item.shipment_id}</td>
              <td style={{ textAlign: "left" }}>{item.item_code}</td>
              <td style={{ textAlign: "center" }}>{item.quantity}</td>
              <td style={{ textAlign: "center" }}>{item.total_cbm}</td>
              <td style={{ textAlign: "center" }}>{item.total_koli}</td>
              <td style={{ textAlign: "center" }}>{item.remarks}</td>
            </tr>
          ))}
          <tr style={{ fontWeight: "bold", background: "#eaeaea" }}>
            <td colSpan={4} style={{ ...td, textAlign: "left" }}>
              GRAND TOTAL
            </td>
            <td style={{ ...td, textAlign: "center" }}>
              {orderDetailItems.reduce((sum, r) => sum + r.quantity, 0)}
            </td>
            <td style={{ ...td, textAlign: "center" }}>
              {orderDetailItems.reduce((sum, r) => sum + r.total_cbm, 0)}
            </td>
          </tr> */}
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
        {/* <div>
            <p style={{ textAlign: "center", fontSize: "10px" }}>
              Staging Verify by <br /> Scanner Personnel
            </p>
            <div style={signatureLine}></div>
            <p style={{ textAlign: "center", fontSize: "10px" }}>Name & Sign</p>
            <p style={{ textAlign: "left", fontSize: "10px" }}>Date : </p>
            <p style={{ textAlign: "left", fontSize: "10px" }}>Time : </p>
          </div> */}
        {/* <div>
            <p style={{ textAlign: "center", fontSize: "10px" }}>
              Checked by <br /> Checker Personnel
            </p>
            <div style={signatureLine}></div>
            <p style={{ textAlign: "center", fontSize: "10px" }}>Name & Sign</p>
            <p style={{ textAlign: "left", fontSize: "10px" }}>Date : </p>
            <p style={{ textAlign: "left", fontSize: "10px" }}>Time : </p>
          </div>
          <div>
            <p style={{ textAlign: "center", fontSize: "10px" }}>
              Loading Checked by <br /> Delivery Driver
            </p>
            <div style={signatureLine}></div>
            <p style={{ textAlign: "center", fontSize: "10px" }}>Name & Sign</p>
            <p style={{ textAlign: "left", fontSize: "10px" }}>Date : </p>
            <p style={{ textAlign: "left", fontSize: "10px" }}>Time : </p>
          </div> */}
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
