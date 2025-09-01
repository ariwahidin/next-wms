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
        // const canvasBarcode = barcodeLocationRef.current[index];
        // if (canvasBarcode) {
        //   JsBarcode(canvasBarcode, item.location, {
        //     format: "CODE128",
        //     displayValue: false,
        //     width: 1.5,
        //     height: 20,
        //     margin: 0,
        //   });
        // }

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

      <h2 style={{ textAlign: "center" }}>Putaway Slip</h2>

      <div style={{ fontSize: "12px" }}>
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
            <th style={th}>Qty</th>
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
              <td style={{ ...td, textAlign: "center" }}>{item.quantity}</td>
              {/* <td style={td}>
                <span className="text-xs text-gray-500">{item.location}</span>
                <canvas
                  ref={(el: HTMLCanvasElement | null) => {
                    barcodeLocationRef.current[i] = el;
                  }}
                ></canvas>
              </td> */}
            </tr>
          ))}
          <tr>
            <td colSpan={3} style={{ ...td, textAlign: "center" }}>
              Total
            </td>
            <td style={{ ...td, textAlign: "center" }}>
              {sheet.reduce((acc, item) => acc + item.quantity, 0)}
            </td>
            {/* <td colSpan={1} style={{ ...td, textAlign: "center" }}></td> */}
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
          <p style={{ textAlign: "center" }}>Manager</p>
        </div>
        <div>
          <div style={signatureLine}></div>
          <p style={{ textAlign: "center" }}>Supervisor</p>
        </div>
        <div>
          <div style={signatureLine}></div>
          <p style={{ textAlign: "center" }}>Staff</p>
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

export default PutawaySheetPrint;
