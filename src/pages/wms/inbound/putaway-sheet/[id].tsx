
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import JsBarcode from "jsbarcode";
import api from "@/lib/api";
import { InventoryPolicy } from "@/types/inventory";
import { printDocument } from "@/lib/print";

interface PutawaySheetItem {
  inbound_no: string;
  owner_code: string;
  transporter: string;
  no_truck: string;
  receipt_id: string;
  driver: string;
  supplier_name: string;
  truck_size: string;
  inbound_date: string;
  start_unloading: string;
  arrival_time: string;
  end_unloading: string;
  bl_no: string;
  container: string;
  remarks: string;
  koli: number;
  item_code: string;
  item_name: string;
  barcode: string;
  quantity: number;
  uom: string;
  lot_number?: string;
  exp_date?: string;
}

const PutawaySheetPrint = () => {
  const router = useRouter();
  const { id } = router.query;

  const [sheet, setSheet] = useState<PutawaySheetItem[]>([]);
  const [inventoryPolicy, setInventoryPolicy] =
    useState<InventoryPolicy | null>(null);

  const [loading, setLoading] = useState(true);
  const [printError, setPrintError] = useState("");

  const barcodeRef = useRef<HTMLCanvasElement>(null);

  const barcodeItemRef = useRef<
    Array<HTMLCanvasElement | null>
  >([]);

  const barcodeLocationRef = useRef<
    Array<HTMLCanvasElement | null>
  >([]);

  // Prevent duplicate print requests
  const printStartedRef = useRef(false);

  // ============================================================
  // FETCH DATA
  // ============================================================

  useEffect(() => {
    if (!id) return;

    let active = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setPrintError("");
        printStartedRef.current = false;

        setSheet([]);
        barcodeItemRef.current = [];

        const res = await api.get(
          `/inbound/putaway/sheet/${id}`,
          {
            withCredentials: true,
          }
        );

        if (!active) return;

        const sheetData: PutawaySheetItem[] =
          res.data.data.putaway_sheet || [];

        setSheet(sheetData);

        setInventoryPolicy(
          res.data.data.inventory_policy
        );
      } catch (error) {
        console.error("Failed to fetch putaway sheet:", error);

        if (active) {
          setPrintError("Failed to load putaway sheet.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [id]);

  // ============================================================
  // GENERATE BARCODE & PRINT
  // ============================================================

  useEffect(() => {
    if (sheet.length === 0) return;
    if (!barcodeRef.current) return;

    if (printStartedRef.current) return;

    printStartedRef.current = true;

    try {
      // Generate inbound barcode
      JsBarcode(
        barcodeRef.current,
        sheet[0].inbound_no,
        {
          format: "CODE128",
          displayValue: false,
          width: 2,
          height: 10,
        }
      );

      // Generate item barcodes
      sheet.forEach((item, index) => {
        const canvasBarcodeItem =
          barcodeItemRef.current[index];

        if (canvasBarcodeItem && item.barcode) {
          JsBarcode(
            canvasBarcodeItem,
            item.barcode,
            {
              format: "CODE128",
              displayValue: false,
              width: 1.5,
              height: 20,
              margin: 0,
            }
          );
        }
      });
    } catch (error) {
      console.error("Barcode generation failed:", error);

      printStartedRef.current = false;
      setPrintError("Failed to generate barcode.");

      return;
    }

    // Wait until barcode rendering is ready
    const timer = window.setTimeout(async () => {
      try {
        setPrintError("");

        const result = await printDocument({
          documentType: "PUTAWAY_SHEET",
          documentNo: sheet[0].inbound_no,
          module: "INBOUND",
          printMethod: "BROWSER",
          printFormat: "PDF",
          copyCount: 1,
        });

        console.log("Print activity recorded:", result);
      } catch (error) {
        console.error("Print logging failed:", error);

        printStartedRef.current = false;

        setPrintError(
          "Unable to register print activity. Please try again."
        );
      }
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [sheet]);

  // ============================================================
  // LOADING & ERROR
  // ============================================================

  if (loading) {
    return <p>Loading Receiving Tally Sheet...</p>;
  }

  if (printError && sheet.length === 0) {
    return (
      <div className="p-5 text-red-600">
        {printError}
      </div>
    );
  }

  if (sheet.length === 0) {
    return <p>No putaway sheet data found.</p>;
  }

  const data = sheet[0];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      {printError && (
        <div className="mb-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 print:hidden">
          {printError}

          <button
            type="button"
            className="ml-3 font-semibold underline"
            onClick={() => {
              printStartedRef.current = false;
              setPrintError("");

              // Retry logging and printing
              const retry = async () => {
                try {
                  printStartedRef.current = true;

                  await printDocument({
                    documentType: "PUTAWAY_SHEET",
                    documentNo: data.inbound_no,
                    module: "INBOUND",
                    printMethod: "BROWSER",
                    printFormat: "PDF",
                    copyCount: 1,
                  });
                } catch (error) {
                  console.error(error);

                  printStartedRef.current = false;

                  setPrintError(
                    "Unable to register print activity. Please try again."
                  );
                }
              };

              retry();
            }}
          >
            Retry Print
          </button>
        </div>
      )}

      <div
        style={{
          padding: "20px",
          fontFamily: "Arial",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <img
            src="/images/yusen001.jpeg"
            alt="Logo"
            width="100"
          />

          <canvas ref={barcodeRef}></canvas>
        </div>

        <h2
          style={{ textAlign: "center" }}
          className="mb-5"
        >
          Receiving Tally Sheet
        </h2>

        {/* DOCUMENT INFORMATION */}
        <div
          style={{
            fontSize: "12px",
            marginTop: "10px",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <tbody>
              <tr>
                <td style={headerLabel}>Owner</td>
                <td style={headerValue}>
                  {data.owner_code}
                </td>

                <td style={headerLabel}>Transporter</td>
                <td style={headerValue}>
                  {data.transporter}
                </td>
              </tr>

              <tr>
                <td style={headerLabel}>Inbound ID</td>
                <td style={headerValue}>
                  {data.inbound_no}
                </td>

                <td style={headerLabel}>Truck No</td>
                <td style={headerValue}>
                  {data.no_truck}
                </td>
              </tr>

              <tr>
                <td style={headerLabel}>Receipt ID</td>
                <td style={headerValue}>
                  {data.receipt_id}
                </td>

                <td style={headerLabel}>Driver</td>
                <td style={headerValue}>
                  {data.driver}
                </td>
              </tr>

              <tr>
                <td style={headerLabel}>Supplier</td>
                <td style={headerValue}>
                  {data.supplier_name}
                </td>

                <td style={headerLabel}>Truck Size</td>
                <td style={headerValue}>
                  {data.truck_size}
                </td>
              </tr>

              <tr>
                <td style={headerLabel}>Date</td>
                <td style={headerValue}>
                  {data.inbound_date}
                </td>

                <td style={headerLabel}>
                  Start Unloading
                </td>
                <td style={headerValue}>
                  {data.start_unloading}
                </td>
              </tr>

              <tr>
                <td style={headerLabel}>Arrival Time</td>
                <td style={headerValue}>
                  {data.arrival_time}
                </td>

                <td style={headerLabel}>
                  End Unloading
                </td>
                <td style={headerValue}>
                  {data.end_unloading}
                </td>
              </tr>

              <tr>
                <td style={headerLabel}>BL No</td>
                <td style={headerValue}>
                  {data.bl_no || "-"}
                </td>

                <td style={headerLabel}>Container</td>
                <td style={headerValue}>
                  {data.container || "-"}
                </td>
              </tr>

              <tr>
                <td style={headerLabel}>Remarks</td>
                <td style={headerValue}>
                  {data.remarks}
                </td>

                <td style={headerLabel}>Koli</td>
                <td style={headerValue}>
                  {data.koli || "-"}
                </td>
              </tr>

              <tr>
                <td></td>
                <td></td>
                <td style={headerLabel}></td>
                <td style={headerValue}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ITEM DETAILS */}
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
              <th style={th}>NO</th>
              <th style={th}>ITEM</th>
              <th style={th}>EAN</th>
              <th style={th}>QTY</th>
            </tr>
          </thead>

          <tbody>
            {sheet.map((item, i) => (
              <tr key={i}>
                <td
                  style={{
                    ...td,
                    textAlign: "center",
                  }}
                >
                  {i + 1}
                </td>

                <td style={td}>
                  <span className="text-xs text-gray-500 font-bold">
                    {item.item_code}
                  </span>

                  <br />

                  <span className="text-xs text-gray-500">
                    {item.item_name}
                  </span>
                </td>

                <td style={td}>
                  <span className="text-xs text-gray-500">
                    {item.barcode}
                  </span>

                  <canvas
                    ref={(
                      el: HTMLCanvasElement | null
                    ) => {
                      barcodeItemRef.current[i] = el;
                    }}
                  ></canvas>
                </td>

                <td
                  style={{
                    ...td,
                    textAlign: "center",
                  }}
                >
                  {item.quantity} {item.uom}
                </td>
              </tr>
            ))}

            {/* TOTAL */}
            <tr>
              <td
                colSpan={2}
                style={{
                  ...td,
                  textAlign: "center",
                }}
              >
                Total
              </td>

              <td style={td}></td>

              <td
                style={{
                  ...td,
                  textAlign: "center",
                }}
              >
                {sheet.reduce(
                  (acc, item) =>
                    acc + Number(item.quantity || 0),
                  0
                )}
              </td>
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
          <div>
            <div style={signatureLine}></div>

            <p style={{ textAlign: "center" }}>
              Admin
            </p>
          </div>

          <div>
            <div style={signatureLine}></div>

            <p style={{ textAlign: "center" }}>
              Checker
            </p>
          </div>

          <div>
            <div style={signatureLine}></div>

            <p style={{ textAlign: "center" }}>
              Scanner
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================================
// STYLES
// ============================================================

const th = {
  border: "1px solid #000",
  padding: "4px",
  backgroundColor: "#eee",
};

const td = {
  border: "1px solid #000",
  padding: "4px",
};

const signatureLine = {
  borderBottom: "1px solid black",
  width: "150px",
  height: "40px",
  marginBottom: "5px",
};

const headerLabel = {
  padding: "2px 10px 2px 0",
  fontWeight: "bold",
  whiteSpace: "nowrap" as const,
  verticalAlign: "top" as const,
};

const headerValue = {
  padding: "2px 0",
};

export default PutawaySheetPrint;
