/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import JsBarcode from "jsbarcode";
import api from "@/lib/api";

const PutawaySheetPrint = () => {
  const router = useRouter();
  const { id } = router.query;
  const [sheet, setSheet] = useState([]);
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const barcodeItemRef = useRef<Array<HTMLCanvasElement | null>>([]);
  const barcodeLocationRef = useRef<Array<HTMLCanvasElement | null>>([]);

  useEffect(() => {
    if (id) {
      fetchData(id as string);
    }
  }, [id]);

  const fetchData = async (id: string) => {
    const res = await api.get(`/inbound/putaway/sheet/${id}`, {
      withCredentials: true,
    });
    setSheet(res.data.data);
  };

  useEffect(() => {
    if (sheet.length > 0 && barcodeRef.current) {
      JsBarcode(barcodeRef.current, sheet[0].inbound_no, {
        format: "CODE128",
        displayValue: false,
        width: 2,
        height: 10,
      });

      sheet.forEach((item, index) => {
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

      // Panggil print setelah barcode digambar
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [sheet]);

  if (sheet.length === 0) return <p>Loading...</p>;

  const data = sheet[0];

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <img src="/images/yusen001.jpeg" alt="Logo" width="100" />
        <canvas ref={barcodeRef}></canvas>
      </div>

      <h2 style={{ textAlign: "center" }} className="mb-5">
        Receiving Tally Sheet
      </h2>

      {/* <div style={{ fontSize: "12px" }}>
        <p>
          <strong>Inbound ID:</strong> {data.inbound_no}
        </p>
        <p>
          <strong>Receipt ID:</strong> {data.receipt_id}
        </p>
        <p>
          <strong>Supplier:</strong> {data.supplier_name}
        </p>
        <p>
          <strong>Date:</strong> {data.inbound_date}
        </p>
      </div> */}

      <div style={{ fontSize: "12px", marginTop: "10px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={headerLabel}>Inbound ID</td>
              <td style={headerValue}>{data.inbound_no}</td>
              <td style={headerLabel}>Transporter</td>
              <td style={headerValue}>{data.transporter}</td>
            </tr>
            <tr>
              <td style={headerLabel}>Receipt ID</td>
              <td style={headerValue}>{data.receipt_id}</td>
              <td style={headerLabel}>Truck No</td>
              <td style={headerValue}>{data.no_truck}</td>
            </tr>
            <tr>
              <td style={headerLabel}>Supplier</td>
              <td style={headerValue}>{data.supplier_name}</td>
              <td style={headerLabel}>Driver</td>
              <td style={headerValue}>{data.driver}</td>
            </tr>
            <tr>
              <td style={headerLabel}>Date</td>
              <td style={headerValue}>{data.inbound_date}</td>
              <td style={headerLabel}>Truck Size</td>
              <td style={headerValue}>{data.truck_size}</td>
            </tr>
            <tr>
              <td style={headerLabel}>Arrival Time</td>
              <td style={headerValue}>{data.arrival_time}</td>
              <td style={headerLabel}>Start Unloading</td>
              <td style={headerValue}>{data.start_unloading}</td>
            </tr>
            <tr>
              <td style={headerLabel}>BL No</td>
              <td style={headerValue}>{data.bl_no || "-"}</td>
              <td style={headerLabel}>End Unloading</td>
              <td style={headerValue}>{data.end_unloading}</td>
            </tr>
            <tr>
              <td style={headerLabel}>Remarks</td>
              <td style={headerValue}>{data.remarks}</td>
              <td style={headerLabel}>Container</td>
              <td style={headerValue}>{data.container || "-"}</td>
            </tr>
            <tr>
              {/* <td style={headerLabel}>End Unloading</td>
              <td style={headerValue}>{data.end_unloading}</td> */}
              {/* <td style={headerLabel}>Total CBM</td>
              <td style={headerValue}>
                {sheet.reduce((acc, item) => acc + item.cbm, 0).toFixed(4)}
              </td> */}
              <td></td>
              <td></td>
              <td style={headerLabel}>Koli</td>
              <td style={headerValue}>{data.koli || "-"}</td>
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
            <th style={th}>Item Code</th>
            <th style={th}>Barcode</th>
            <th style={th}>Whs Code</th>
            <th style={th}>Qty</th>
            <th style={th}>CBM</th>
          </tr>
        </thead>
        <tbody>
          {sheet.map((item, i) => (
            <tr key={i}>
              <td style={{ ...td, textAlign: "center" }}>{i + 1}</td>
              <td style={td}>{item.item_code}</td>
              <td style={td}>
                <span className="text-xs text-gray-500">{item.barcode}</span>
                <canvas
                  ref={(el: HTMLCanvasElement | null) => {
                    barcodeItemRef.current[i] = el;
                  }}
                ></canvas>
              </td>
              <td style={{ ...td, textAlign: "center" }}>{item.whs_code}</td>
              <td style={{ ...td, textAlign: "center" }}>{item.quantity}</td>
              <td style={{ ...td, textAlign: "center" }}>{item.cbm}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={4} style={{ ...td, textAlign: "center" }}>
              Total
            </td>
            <td style={{ ...td, textAlign: "center" }}>
              {sheet.reduce((acc, item) => acc + item.quantity, 0)}
            </td>
            <td style={{ ...td, textAlign: "center" }}>
              {sheet.reduce((acc, item) => acc + item.cbm, 0).toFixed(4)}
            </td>
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
          <div style={signatureLine}></div>
          <p style={{ textAlign: "center" }}>Admin</p>
        </div>
        <div>
          <div style={signatureLine}></div>
          <p style={{ textAlign: "center" }}>Checker</p>
        </div>
        <div>
          <div style={signatureLine}></div>
          <p style={{ textAlign: "center" }}>Scanner</p>
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
  verticalAlign: "top",
};

const headerValue = {
  padding: "2px 0",
};

export default PutawaySheetPrint;
