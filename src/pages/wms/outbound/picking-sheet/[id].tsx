/* eslint-disable react-hooks/exhaustive-deps */
"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import JsBarcode from "jsbarcode";
import api from "@/lib/api";
import React from "react";
import { useRouter } from "next/router";
import { InventoryPolicy } from "@/types/inventory";
import { HeaderFormProps } from "@/types/outbound";

const PickingSheetPrint = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { id } = router.query;
  const [pickingSheet, setPickingSheet] = useState<any[]>([]);
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const barcodeLocationRef = useRef<Array<HTMLCanvasElement | null>>([]);
  const barcodeItemRef = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const [groupedData, setGroupedData] = useState<{ [key: string]: any[] }>({});
  const [invPolicy, setInvPolicy] = useState<InventoryPolicy>();
  const [data, setData] = useState<HeaderFormProps>();
  const [isLoaded, setIsLoaded] = useState(false);

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
      setData(res.data.data[0]);
      if (res.data.data[0]) {
        fetchInvPolicy(res.data.data[0].owner_code);
      }
    } catch (error) {
      console.log("[v0] API call failed, using mock data for demo");
      const mockData = [];
      setPickingSheet(mockData);
    }
  };

  const fetchInvPolicy = async (owwner_code: string) => {
    try {
      const res = await api.get(`/inventory/policy?owner=${owwner_code}`, {
        withCredentials: true,
      });
      setInvPolicy(res.data.data.inventory_policy);
    } catch (error) {
      console.log("[v0] API call failed, using mock data for demo");
    }
  };

  useEffect(() => {
    if (!pickingSheet.length) return;

    const grouped = pickingSheet
      .filter((item) => item?.item_code)
      .reduce((acc, item) => {
        (acc[item.item_code] ??= []).push(item);
        return acc;
      }, {} as Record<string, typeof pickingSheet>);

    setGroupedData(grouped);
  }, [pickingSheet]);

  useEffect(() => {
    setTimeout(() => {
      if (!pickingSheet.length) return;

      requestAnimationFrame(() => {
        if (barcodeRef.current) {
          JsBarcode(barcodeRef.current, pickingSheet[0].outbound_no, {
            format: "CODE128",
            displayValue: true,
            fontSize: 14,
            width: 2,
            height: 50,
          });
          setIsLoaded(true);
        }
      });
    }, 3000);
  }, [pickingSheet]);

  useEffect(() => {
    if (Object.keys(groupedData).length > 0) {
      Object.entries(groupedData).forEach(([itemCode, records]: [string, any]) => {
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
      });
    }
  }, [groupedData, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    window.print();
    window.onafterprint = () => window.close();
    window.addEventListener("beforeunload", () => {
      window.close();
    });
  }, [isLoaded]);

  if (pickingSheet.length === 0) return <p>Loading...</p>;
  if (!invPolicy) return <p>Loading...</p>;
  if (!data) return <p>Loading...</p>;

  const grandTotalQty = pickingSheet.reduce((acc, item) => acc + item.quantity, 0);
  const grandTotalCbm = pickingSheet.reduce((acc, item) => acc + item.cbm, 0).toFixed(4);

  // Row number counter across all item groups
  let rowNumber = 0;

  return (
    <>
      {/* Page number CSS via @page rule */}
      <style>{`
        @media print {
          @page {
            margin: 10mm;
            size: A4 portrait;
          }
        }

        /* Page number footer shown on every printed page */
        .page-footer {
          display: none;
        }

        @media print {
          .page-footer {
            display: block;
            position: fixed;
            bottom: 5mm;
            right: 10mm;
            font-size: 10px;
            font-family: Arial, sans-serif;
            color: #000;
          }

          /* Counter-based page numbering via CSS */
          .page-number::before {
            // content: "Page " counter(page) " of " counter(pages);
          }
        }

        /* Fallback visible page number for screen preview */
        @media screen {
          .page-footer {
            display: block;
            text-align: right;
            font-size: 10px;
            margin-top: 20px;
            color: #555;
          }
          .page-number::before {
            // content: "(Page numbers visible on print)";
          }
        }
      `}</style>

      {/* Fixed footer for page number — printed on every page */}
      <div className="page-footer">
        <span className="page-number"></span>
      </div>

      <div style={{ padding: "10px", fontFamily: "Arial" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <p style={{ fontSize: "16px", textAlign: "center", fontWeight: "bold" }}>
            PT YUSEN LOGISTICS INTERLINK INDONESIA
          </p>
        </div>

        <hr style={{ border: "1px solid black", marginBottom: "10px", marginTop: "10px" }} />

        <h2 style={{ textAlign: "center", marginBottom: "10px", textDecoration: "underline" }}>
          PICKING SHEET
        </h2>

        <table style={{ width: "100%", marginBottom: "10px" }}>
          <tbody>
            <tr>
              <td style={{ textAlign: "center", width: "33%" }}>
                <canvas style={{ width: "200px", height: "50px" }} ref={barcodeRef}></canvas>
              </td>
              <td style={{ textAlign: "center" }}>
                <div style={{ fontSize: "12px", padding: "5px", width: "220px" }}></div>
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
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
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
                  })}
                </td>
                <td style={headerLabel}>Customer City</td>
                <td style={headerValue}>{data.cust_city}</td>
              </tr>
              <tr>
                <td style={headerLabel}></td>
                <td style={headerValue}></td>
                <td style={headerLabel}>Delivery To</td>
                <td style={headerValue}>{data.deliv_to_name}</td>
              </tr>
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
              {/* ── NO column ── */}
              <th style={{ ...th, width: "4%" }}>NO</th>
              <th style={{ ...th, width: "22%" }}>ITEM</th>
              <th style={th}>EAN</th>

              {invPolicy.show_rec_date && <th style={th}>REC DATE</th>}
              {invPolicy.use_production_date && <th style={th}>PROD DATE</th>}
              {invPolicy.require_expiry_date && <th style={th}>EXP DATE</th>}
              {invPolicy.use_lot_no && <th style={th}>LOT NO</th>}

              <th style={th}>LOCATION</th>
              <th style={th}>QTY</th>
              <th style={th}>CBM</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedData).map(([itemCode, records]: [string, any], i) => {
              if (!records || !Array.isArray(records) || records.length === 0) return null;

              const validRecords = records.filter((r) => r && typeof r === "object");
              if (validRecords.length === 0) return null;

              // Increment row number per item group
              rowNumber++;
              const currentNo = rowNumber;

              const totalQty = validRecords.reduce((sum, r) => sum + (r.quantity || 0), 0);
              const totalCbm = validRecords
                .reduce((sum, r) => sum + (r.cbm || 0), 0)
                .toFixed(4);

              return (
                <React.Fragment key={itemCode}>
                  {validRecords.map((item, j) => (
                    <tr key={j}>
                      {/* ── Row number: only shown on first sub-row of each item group ── */}
                      <td
                        style={{
                          ...td,
                          textAlign: "center",
                          fontWeight: "bold",
                          verticalAlign: "top",
                        }}
                      >
                        {j === 0 ? currentNo : ""}
                      </td>

                      <td
                        style={{
                          ...td,
                          textAlign: "center",
                          fontWeight: "bold",
                          fontSize: "12px",
                          verticalAlign: "top",
                        }}
                      >
                        {j === 0 && (
                          <>
                            <span>{item.item_code}</span>
                            <br />
                            <span
                              style={{
                                fontWeight: "normal",
                                fontSize: "12px",
                                display: "inline-block",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                verticalAlign: "bottom",
                              }}
                              title={item.item_name}
                            >
                              {item.item_name}
                            </span>
                          </>
                        )}
                      </td>

                      <td style={{ ...td, textAlign: "center" }}>
                        {j === 0 && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                            }}
                          >
                            <div style={{ fontSize: "10px", marginBottom: "0px" }}>
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

                      {invPolicy.show_rec_date && (
                        <td style={{ ...td, textAlign: "center", whiteSpace: "nowrap" }}>
                          {item.rec_date}
                        </td>
                      )}
                      {invPolicy.use_production_date && (
                        <td style={{ ...td, textAlign: "center", whiteSpace: "nowrap" }}>
                          {item.prod_date}
                        </td>
                      )}
                      {invPolicy.require_expiry_date && (
                        <td style={{ ...td, textAlign: "center", whiteSpace: "nowrap" }}>
                          {item.exp_date}
                        </td>
                      )}
                      {invPolicy.use_lot_no && (
                        <td style={{ ...td, textAlign: "center", whiteSpace: "nowrap" }}>
                          {item.lot_number}
                        </td>
                      )}

                      <td
                        style={{
                          ...td,
                          textAlign: "center",
                          whiteSpace: "nowrap",
                          fontWeight: "bold",
                          fontSize: "12px",
                        }}
                      >
                        {item.location}
                      </td>
                      <td style={{ ...td, textAlign: "center" }}>
                        {item.quantity} {item.uom}
                      </td>
                      <td style={{ ...td, textAlign: "center" }}>{item.cbm}</td>
                    </tr>
                  ))}

                  {/* Sub-total per item group */}
                  <tr style={{ background: "#f5f5f5", fontWeight: "bold" }}>
                    {/* NO + ITEM + EAN = 3 cols always */}
                    <td colSpan={3} style={{ ...td }}></td>

                    {invPolicy.show_rec_date && <td style={{ ...td }}></td>}
                    {invPolicy.use_production_date && <td style={{ ...td }}></td>}
                    {invPolicy.require_expiry_date && <td style={{ ...td }}></td>}
                    {invPolicy.use_lot_no && <td style={{ ...td }}></td>}

                    <td style={{ ...td, textAlign: "right" }}>TOTAL</td>
                    <td style={{ ...td, textAlign: "center" }}>{totalQty}</td>
                    <td style={{ ...td, textAlign: "center" }}>{totalCbm}</td>
                  </tr>
                </React.Fragment>
              );
            })}

            {/* Grand total */}
            <tr style={{ fontWeight: "bold", background: "#eaeaea" }}>
              <td colSpan={3} style={{ ...td }}></td>

              {invPolicy.show_rec_date && <td style={{ ...td }}></td>}
              {invPolicy.use_production_date && <td style={{ ...td }}></td>}
              {invPolicy.require_expiry_date && <td style={{ ...td }}></td>}
              {invPolicy.use_lot_no && <td style={{ ...td }}></td>}

              <td style={{ ...td, textAlign: "right" }}>GRAND TOTAL</td>
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
          {[
            { title: "System Proccess by", role: "Admin" },
            { title: "Approved by", role: "Supervisor" },
            { title: "Picked by", role: "Picking Personnel" },
            { title: "Staging Verify by", role: "Scanner Personnel" },
            { title: "Checked by", role: "Checker Personnel" },
          ].map(({ title, role }) => (
            <div key={role}>
              <p style={{ textAlign: "center", fontSize: "10px" }}>
                {title} <br /> {role}
              </p>
              <div style={signatureLine}></div>
              <p style={{ textAlign: "center", fontSize: "10px" }}>Name & Sign</p>
              <p style={{ textAlign: "left", fontSize: "10px" }}>Date : </p>
              <p style={{ textAlign: "left", fontSize: "10px" }}>Time : </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

const th: React.CSSProperties = {
  border: "1px solid #000",
  padding: "4px",
  backgroundColor: "#eee",
  textAlign: "center",
};

const td: React.CSSProperties = {
  borderBottom: "1px dashed #000",
  padding: "4px",
};

const headerLabel: React.CSSProperties = {
  padding: "2px 6px",
  fontWeight: "bold",
  whiteSpace: "nowrap",
  width: "20%",
};

const headerValue: React.CSSProperties = {
  padding: "2px 6px",
  width: "30%",
};

const signatureLine: React.CSSProperties = {
  borderBottom: "1px solid black",
  width: "100px",
  height: "55px",
  marginBottom: "5px",
};

export default PickingSheetPrint;