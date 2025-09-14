/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import JsBarcode from "jsbarcode";
import api from "@/lib/api";
import React from "react";

const PickingSheetPrint = () => {
  const router = useRouter();
  const { id } = router.query;
  const [pickingSheet, setPickingSheet] = useState<any[]>([]);
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const barcodeItemRef = useRef<Array<HTMLCanvasElement | null>>([]);
  const barcodeLocationRef = useRef<Array<HTMLCanvasElement | null>>([]);

  useEffect(() => {
    if (id) {
      fetchData(id as string);
    }
  }, [id]);

  const fetchData = async (id: string) => {
    const res = await api.get(`/outbound/picking/sheet/${id}`, {
      withCredentials: true,
    });
    setPickingSheet(res.data.data);
  };

  useEffect(() => {
    if (pickingSheet.length > 0 && barcodeRef.current) {
      JsBarcode(barcodeRef.current, pickingSheet[0].outbound_no, {
        format: "CODE128",
        displayValue: true,
        fontSize: 14,
        width: 2,
        height: 50,
      });

      pickingSheet.forEach((item, index) => {
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
  }, [pickingSheet]);

  if (pickingSheet.length === 0) return <p>Loading...</p>;

  const data = pickingSheet[0];

  // sebelum return JSX
  const groupedData = pickingSheet.reduce((acc, item) => {
    if (!acc[item.item_code]) {
      acc[item.item_code] = [];
    }
    acc[item.item_code].push(item);
    return acc;
  }, {});

  const grandTotalQty = pickingSheet.reduce(
    (acc, item) => acc + item.quantity,
    0
  );
  //   const grandTotalCbm = pickingSheet.reduce((acc, item) => acc + item.cbm, 0);

  const grandTotalCbm = pickingSheet
    .reduce((acc, item) => acc + item.cbm, 0)
    .toFixed(3);

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

      <h2 style={{ textAlign: "center", marginBottom: "10px" }}>
        PICKING SHEET
      </h2>
      <table style={{ width: "100%", marginBottom: "10px" }}>
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
              <td style={headerLabel}>Picking No</td>
              <td style={headerValue}>{data.outbound_no}</td>
              <td style={headerLabel}>Qty Koli</td>
              <td style={headerValue}>
                {data.qty_koli}
                {/* (Seal: {data.qty_koli_seal}) */}
              </td>
            </tr>
            <tr>
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
            </tr>
          </tbody>
        </table>
      </div>

      {/* Items Table */}
      {/* <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
          fontSize: "12px",
        }}
      >
        <thead>
          <tr>
            <th style={th}>NO</th>
            <th style={th}>ITEM</th>
            <th style={th}>DESCRIPTION</th>
            <th style={th}>GMC</th>
            <th style={th}>WH CODE</th>

            <th style={th}>REC DATE</th>
            <th style={th}>LOCATION</th>
            <th style={th}>QTY</th>
            <th style={th}>CBM</th>
          </tr>
        </thead>
        <tbody>
          {pickingSheet.map((item, i) => (
            <tr key={i}>
              <td style={{ ...td, textAlign: "center" }}>{i + 1}</td>
              <td style={td}>{item.item_code}</td>
              <td style={td}>{item.item_name}</td>
              <td style={td}>{item.barcode}</td>
              <td style={{ ...td, textAlign: "center" }}>{item.whs_code}</td>

              <td style={{ ...td, textAlign: "center", whiteSpace: "nowrap" }}>
                {item.rec_date}
              </td>
              <td style={{ ...td, textAlign: "center", whiteSpace: "nowrap" }}>
                {item.location}
              </td>
              <td style={{ ...td, textAlign: "center" }}>{item.quantity}</td>
              <td style={{ ...td, textAlign: "center" }}>{item.cbm}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={7} style={{ ...td, textAlign: "center" }}>
              Total
            </td>
            <td style={{ ...td, textAlign: "center" }}>
              {pickingSheet.reduce((acc, item) => acc + item.quantity, 0)}
            </td>
            <td style={{ ...td, textAlign: "center" }}>
              {pickingSheet.reduce((acc, item) => acc + item.cbm, 0)}
            </td>
          </tr>
        </tbody>
      </table> */}

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
            {/* <th style={th}>NO</th> */}
            <th style={th}>ITEM</th>
            <th style={th}>DESCRIPTION</th>
            <th style={th}>GMC</th>
            <th style={th}>WH CODE</th>
            <th style={th}>REC DATE</th>
            <th style={th}>LOCATION</th>
            <th style={th}>QTY</th>
            <th style={th}>CBM</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedData).map(
            ([itemCode, records]: [string, any], i) => {
              const totalQty = (records as any[]).reduce(
                (sum, r) => sum + r.quantity,
                0
              );
              const totalCbm = (records as any[]).reduce(
                (sum, r) => sum + r.cbm,
                0
              );

              return (
                <React.Fragment key={itemCode}>
                  {/* header item */}

                  {/* detail per lokasi */}
                  {/* {records.map((item, j) => (
                    <tr key={j}>
                      <td style={{ ...td, textAlign: "center" }}>
                        {item.item_code}
                      </td>
                      <td
                        style={{
                          ...td,
                          maxWidth: "150px", // atur sesuai kebutuhan
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={records[0].item_name} // biar muncul tooltip full text kalau dihover
                      >
                        {records[0].item_name}
                      </td>
                      <td style={{ ...td, textAlign: "center" }}>
                        {item.barcode}
                      </td>
                      <td style={{ ...td, textAlign: "center" }}>
                        {item.whs_code}
                      </td>
                      <td
                        style={{
                          ...td,
                          textAlign: "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.rec_date}
                      </td>
                      <td
                        style={{
                          ...td,
                          textAlign: "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.location}
                      </td>
                      <td style={{ ...td, textAlign: "center" }}>
                        {item.quantity}
                      </td>
                      <td style={{ ...td, textAlign: "center" }}>{item.cbm}</td>
                    </tr>
                  ))} */}

                  {records.map((item, j) => (
                    <tr key={j}>
                      {/* ITEM CODE */}
                      <td style={{ textAlign: "center" }}>
                        {j === 0 ? item.item_code : ""}
                      </td>

                      {/* ITEM NAME */}
                      <td
                        style={{
                          maxWidth: "150px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={j === 0 ? item.item_name : ""}
                      >
                        {j === 0 ? item.item_name : ""}
                      </td>

                      {/* BARCODE */}
                      <td style={{ textAlign: "center" }}>
                        {j === 0 ? item.barcode : ""}
                      </td>

                      {/* WH CODE */}
                      <td style={{ textAlign: "center" }}>
                        {j === 0 ? item.whs_code : ""}
                      </td>

                      {/* REC DATE */}
                      <td
                        style={{
                          textAlign: "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.rec_date}
                      </td>

                      {/* LOCATION */}
                      <td
                        style={{
                          textAlign: "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.location}
                      </td>

                      {/* QTY */}
                      <td style={{ textAlign: "center" }}>{item.quantity}</td>

                      {/* CBM */}
                      <td style={{ textAlign: "center" }}>{item.cbm}</td>
                    </tr>
                  ))}

                  <tr style={{ background: "#f5f5f5", fontWeight: "bold" }}>
                    <td style={{ ...td, textAlign: "center" }}>{itemCode}</td>
                    <td colSpan={5} style={{ ...td, textAlign: "right" }}>
                      TOTAL
                    </td>
                    <td style={{ ...td, textAlign: "center" }}>{totalQty}</td>
                    <td style={{ ...td, textAlign: "center" }}>{totalCbm}</td>
                  </tr>
                </React.Fragment>
              );
            }
          )}

          {/* grand total */}
          <tr style={{ fontWeight: "bold", background: "#eaeaea" }}>
            <td colSpan={6} style={{ ...td, textAlign: "right" }}>
              GRAND TOTAL
            </td>
            <td style={{ ...td, textAlign: "center" }}>{grandTotalQty}</td>
            <td style={{ ...td, textAlign: "center" }}>{grandTotalCbm}</td>
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
            System Proccess by <br /> Admin
          </p>
          <div style={signatureLine}></div>
          <p style={{ textAlign: "center", fontSize: "10px" }}>Name & Sign</p>
          <p style={{ textAlign: "left", fontSize: "10px" }}>Date : </p>
          <p style={{ textAlign: "left", fontSize: "10px" }}>Time : </p>
        </div>
        <div>
          <p style={{ textAlign: "center", fontSize: "10px" }}>
            Approved by <br /> Supervisor
          </p>
          <div style={signatureLine}></div>
          <p style={{ textAlign: "center", fontSize: "10px" }}>Name & Sign</p>
          <p style={{ textAlign: "left", fontSize: "10px" }}>Date : </p>
          <p style={{ textAlign: "left", fontSize: "10px" }}>Time : </p>
        </div>
        <div>
          <p style={{ textAlign: "center", fontSize: "10px" }}>
            Picked by <br /> Picking Personnel
          </p>
          <div style={signatureLine}></div>
          <p style={{ textAlign: "center", fontSize: "10px" }}>Name & Sign</p>
          <p style={{ textAlign: "left", fontSize: "10px" }}>Date : </p>
          <p style={{ textAlign: "left", fontSize: "10px" }}>Time : </p>
        </div>
        <div>
          <p style={{ textAlign: "center", fontSize: "10px" }}>
            Staging Verify by <br /> Scanner Personnel
          </p>
          <div style={signatureLine}></div>
          <p style={{ textAlign: "center", fontSize: "10px" }}>Name & Sign</p>
          <p style={{ textAlign: "left", fontSize: "10px" }}>Date : </p>
          <p style={{ textAlign: "left", fontSize: "10px" }}>Time : </p>
        </div>
        <div>
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

export default PickingSheetPrint;
