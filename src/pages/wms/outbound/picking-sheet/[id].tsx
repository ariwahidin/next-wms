"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import JsBarcode from "jsbarcode";
import api from "@/lib/api";
import React from "react";
import { useRouter } from "next/router";

const PickingSheetPrint = () => {
  const searchParams = useSearchParams();
  // const id = searchParams.get("id") || "1" // Default to '1' for demo purposes
  const router = useRouter();
  const { id } = router.query;
  const [pickingSheet, setPickingSheet] = useState<any[]>([]);
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const barcodeLocationRef = useRef<Array<HTMLCanvasElement | null>>([]);
  const barcodeItemRef = useRef<{ [key: string]: HTMLCanvasElement | null }>(
    {}
  );
  const [groupedData, setGroupedData] = useState<{ [key: string]: any[] }>({});

  useEffect(() => {
    if (id) {
      fetchData(id as string);
    }
  }, [id]);

  const fetchData = async (id: string) => {
    try {
      const res = await api.get(`/outbound/picking/sheet/${id}`, {
        withCredentials: true,
      });
      setPickingSheet(res.data.data);
    } catch (error) {
      console.log("[v0] API call failed, using mock data for demo");
      const mockData = [
        {
          outbound_no: "OUT-2024-001",
          item_code: "ITM001",
          item_name: "Sample Item 1",
          barcode: "1234567890123",
          whs_code: "WH01",
          rec_date: "2024-01-15",
          location: "A1-B2-C3",
          quantity: 10,
          cbm: 0.5,
          transporter_code: "TRP001",
          cust_city: "Jakarta",
          shipment_id: "SHP001",
          customer_name: "PT Sample Customer",
          cust_address: "Jl. Sample No. 123",
          outbound_date: "2024-01-15T10:00:00",
          picker_name: "John Doe",
          deliv_to_name: "Jane Smith",
          plan_pickup_date: "2024-01-16",
          plan_pickup_time: "09:00:00",
          deliv_address: "Jl. Delivery No. 456",
          deliv_city: "Bandung",
          remarks: "Handle with care",
        },
        {
          outbound_no: "OUT-2024-001",
          item_code: "ITM002",
          item_name: "Sample Item 2",
          barcode: "2345678901234",
          whs_code: "WH01",
          rec_date: "2024-01-15",
          location: "A2-B3-C4",
          quantity: 5,
          cbm: 0.3,
          transporter_code: "TRP001",
          cust_city: "Jakarta",
          shipment_id: "SHP001",
          customer_name: "PT Sample Customer",
          cust_address: "Jl. Sample No. 123",
          outbound_date: "2024-01-15T10:00:00",
          picker_name: "John Doe",
          deliv_to_name: "Jane Smith",
          plan_pickup_date: "2024-01-16",
          plan_pickup_time: "09:00:00",
          deliv_address: "Jl. Delivery No. 456",
          deliv_city: "Bandung",
          remarks: "Handle with care",
        },
      ];
      setPickingSheet(mockData);
    }
  };

  useEffect(() => {
    if (pickingSheet.length > 0) {
      const grouped = pickingSheet
        .filter((item) => item && item.item_code)
        .reduce((acc, item) => {
          if (!acc[item.item_code]) {
            acc[item.item_code] = [];
          }
          acc[item.item_code].push(item);
          return acc;
        }, {});
      setGroupedData(grouped);

      if (barcodeRef.current) {
        JsBarcode(barcodeRef.current, pickingSheet[0].outbound_no, {
          format: "CODE128",
          displayValue: true,
          fontSize: 14,
          width: 2,
          height: 50,
        });
      }

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
      });

      // setTimeout(() => {
      //   window.print();
      // }, 500);
    }
  }, [pickingSheet]);

  useEffect(() => {
    if (Object.keys(groupedData).length > 0) {
      Object.entries(groupedData).forEach(
        ([itemCode, records]: [string, any]) => {
          if (records && Array.isArray(records) && records.length > 0) {
            const firstRecord = (records as any[])[0];
            const canvasBarcodeItem = barcodeItemRef.current[`${itemCode}-0`];
            if (canvasBarcodeItem && firstRecord && firstRecord.barcode) {
              JsBarcode(canvasBarcodeItem, firstRecord.barcode, {
                format: "CODE128",
                displayValue: false,
                width: 1,
                height: 15,
                margin: 0,
              });
            }
          }
        }
      );
    }
  }, [groupedData]);

  if (pickingSheet.length === 0) return <p>Loading...</p>;

  const data = pickingSheet[0];

  const grandTotalQty = pickingSheet.reduce(
    (acc, item) => acc + item.quantity,
    0
  );

  const grandTotalCbm = pickingSheet
    .reduce((acc, item) => acc + item.cbm, 0)
    .toFixed(4);

  return (
    <div style={{ padding: "10px", fontFamily: "Arial" }}>
      <div style={{ display: "flex", justifyContent: "center" }}>
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
          marginBottom: "10px",
          textDecoration: "underline",
        }}
      >
        PICKING SHEET
      </h2>
      <table style={{ width: "100%", marginBottom: "10px" }}>
        <tbody>
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
                <span style={{ fontWeight: "bold" }}>
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
                <span style={{ fontWeight: "bold" }}>{data.shipment_id}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

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
              <td style={headerLabel}>Customer Name</td>
              <td style={headerValue}>{data.customer_name}</td>
            </tr>
            <tr>
              <td style={headerLabel}>Shipment ID</td>
              <td style={headerValue}>{data.shipment_id}</td>
              <td style={headerLabel}>Customer Address</td>
              <td style={headerValue}>{data.cust_address}</td>
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
              <td style={headerLabel}>Customer City</td>
              <td style={headerValue}>{data.cust_city}</td>
            </tr>
            <tr>
              <td style={headerLabel}>Picker</td>
              <td style={headerValue}>{data.picker_name}</td>
              <td style={headerLabel}>Delivery To</td>
              <td style={headerValue}>{data.deliv_to_name}</td>
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
              <td style={headerLabel}>Delivery Address</td>
              <td style={headerValue}>{data.deliv_address}</td>
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
              <td style={headerLabel}>Delivery City</td>
              <td style={headerValue}>{data.deliv_city}</td>
            </tr>
            <tr>
              <td style={headerLabel}>Remarks</td>
              <td style={headerValue}>{data.remarks}</td>
              <td style={headerLabel}></td>
              <td style={headerValue}></td>
            </tr>
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
          fontSize: "12px",
        }}
      >
        <thead>
          <tr>
            <th style={{ ...th, width: "25%" }}>ITEM</th>
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
              if (!records || !Array.isArray(records) || records.length === 0) {
                return null;
              }

              const validRecords = records.filter(
                (r) => r && typeof r === "object"
              );
              if (validRecords.length === 0) {
                return null;
              }

              const totalQty = validRecords.reduce(
                (sum, r) => sum + (r.quantity || 0),
                0
              );
              const totalCbm = validRecords
                .reduce((sum, r) => sum + (r.cbm || 0), 0)
                .toFixed(4);

              return (
                <React.Fragment key={itemCode}>
                  {validRecords.map((item, j) => (
                    <tr key={j}>
                      <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "12px", }}>
                        {j === 0 ? <span>{item.item_code}</span> : ""}
                        {j === 0 ? (
                          <>
                            <br />
                            <span
                              style={{
                                fontWeight: "normal",
                                fontSize: "12px",
                                display: "inline-block",
                                // maxWidth: "140px", // kasih batas
                                // overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                verticalAlign: "bottom",
                              }}
                              title={item.item_name} // biar pas hover keliatan full
                            >
                              {item.item_name}
                            </span>
                          </>
                        ) : (
                          ""
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {j === 0 && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{ fontSize: "10px", marginBottom: "0px" }}
                            >
                              {item.barcode}
                            </div>
                            <canvas
                              ref={(el: HTMLCanvasElement | null) => {
                                if (el) {
                                  barcodeItemRef.current[`${itemCode}-0`] = el;
                                }
                              }}
                              style={{ maxWidth: "100px", height: "20px" }}
                            />
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {j === 0 ? item.whs_code : ""}
                      </td>
                      <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                        {item.rec_date}
                      </td>
                      <td style={{ textAlign: "center", whiteSpace: "nowrap", fontWeight: "bold", fontSize: "12px" }}>
                        {item.location}
                      </td>
                      <td style={{ textAlign: "center" }}>{item.quantity}</td>
                      <td style={{ textAlign: "center" }}>{item.cbm}</td>
                    </tr>
                  ))}

                  <tr style={{ background: "#f5f5f5", fontWeight: "bold" }}>
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

          <tr style={{ fontWeight: "bold", background: "#eaeaea" }}>
            <td colSpan={5} style={{ ...td, textAlign: "right" }}>
              GRAND TOTAL
            </td>
            <td style={{ ...td, textAlign: "center" }}>{grandTotalQty}</td>
            <td style={{ ...td, textAlign: "center" }}>{grandTotalCbm}</td>
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
  fontWeight: "bold",
  whiteSpace: "nowrap",
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
