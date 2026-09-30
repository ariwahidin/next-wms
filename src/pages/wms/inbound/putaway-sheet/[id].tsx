/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import JsBarcode from "jsbarcode";
import api from "@/lib/api";
import { InventoryPolicy } from "@/types/inventory";

interface PutawaySheetItem {
  item_code: string;
  item_name: string;
  barcode: string;
  quantity: number;
  uom: string;

  imd?: string;
  serial_number?: string;

  case_no?: string;
  carton_no?: string;
  location?: string;
}

interface PutawaySheetData extends PutawaySheetItem {
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

  bl_no?: string;
  container?: string;
  remarks?: string;
  koli?: number;
}

const PutawaySheetPrint = () => {
  const router = useRouter();
  const { id } = router.query;

  const [sheet, setSheet] = useState<PutawaySheetData[]>([]);
  const [inventoryPolicy, setInventoryPolicy] =
    useState<InventoryPolicy | null>(null);

  const barcodeRef = useRef<HTMLCanvasElement>(null);

  // =========================================================
  // FETCH DATA
  // =========================================================

  useEffect(() => {
    if (id) {
      fetchData(id as string);
    }
  }, [id]);

  const fetchData = async (id: string) => {
    try {
      const res = await api.get(`/inbound/putaway/sheet/${id}`, {
        withCredentials: true,
      });

      setSheet(res.data.data.putaway_sheet || []);

      setInventoryPolicy(
        res.data.data.inventory_policy || null
      );
    } catch (error) {
      console.error(
        "Failed to fetch putaway sheet:",
        error
      );
    }
  };

  // =========================================================
  // BARCODE + AUTO PRINT
  // =========================================================

  useEffect(() => {
    if (
      sheet.length === 0 ||
      !barcodeRef.current
    ) {
      return;
    }

    JsBarcode(
      barcodeRef.current,
      sheet[0].inbound_no,
      {
        format: "CODE128",
        displayValue: false,
        width: 1.5,
        height: 28,
        margin: 0,
      }
    );

    const timer = setTimeout(() => {
      window.print();
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [sheet]);

  // =========================================================
  // LOADING
  // =========================================================

  if (sheet.length === 0) {
    return (
      <div className="print-loading">
        Loading...
      </div>
    );
  }

  const data = sheet[0];

  // =========================================================
  // TOTAL
  // =========================================================

  const totalQty = sheet.reduce(
    (acc, item) =>
      acc + Number(item.quantity || 0),
    0
  );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 7mm;
        }

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          font-size: 9px;
          color: #000;
          background: #fff;
        }

        .print-page {
          width: 100%;
          margin: 0;
          padding: 0;
        }

        /* =====================================================
           HEADER
        ===================================================== */

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;

          height: 32px;
          margin-bottom: 3px;
        }

        .logo {
          width: 75px;
          height: auto;
          object-fit: contain;
        }

        .barcode-wrapper {
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .title {
          text-align: center;

          font-size: 15px;
          font-weight: bold;

          margin: 2px 0 5px;

          line-height: 1.1;
        }

        /* =====================================================
           INFORMATION
        ===================================================== */

        .info-table {
          width: 100%;

          border-collapse: collapse;

          margin-bottom: 5px;

          table-layout: fixed;
        }

        .info-table td {
          padding: 2px 4px;

          line-height: 1.1;

          vertical-align: middle;
        }

        .info-label {
          width: 11%;

          font-weight: bold;

          white-space: nowrap;
        }

        .info-value {
          width: 39%;

          border-bottom:
            1px solid #999;

          min-height: 14px;
        }

        /* =====================================================
           MAIN TABLE
        ===================================================== */

        .main-table {
          width: 100%;

          border-collapse: collapse;

          table-layout: fixed;

          font-size: 8px;
        }

        .main-table th {
          border: 1px solid #000;

          padding: 3px 2px;

          background: #e9e9e9;

          text-align: center;

          font-weight: bold;

          line-height: 1.1;
        }

        .main-table td {
          border: 1px solid #000;

          padding: 2px 3px;

          height: 28px;

          line-height: 1.1;

          vertical-align: middle;
        }

        .main-table tbody tr {
          page-break-inside: avoid;
        }

        /* =====================================================
           COLUMN WIDTH
        ===================================================== */

        .no {
          width: 4%;

          text-align: center;
        }

        .item {
          width: 21%;

          text-align: left;
        }

        .imd {
          width: 9%;

          text-align: center;

          word-break: break-word;
        }

        .qty {
          width: 6%;

          text-align: center;
        }

        .serial-number {
          width: 18%;

          text-align: left;

          font-size: 7.5px;

          word-break: break-word;

          overflow-wrap: anywhere;
        }

        .case-no {
          width: 12%;

          text-align: center;
        }

        .carton-no {
          width: 12%;

          text-align: center;
        }

        .location {
          width: 13%;

          text-align: center;
        }

        /* =====================================================
           ITEM
        ===================================================== */

        .item-code {
          font-weight: bold;

          font-size: 8px;

          line-height: 1.1;
        }

        .item-name {
          font-size: 7px;

          margin-top: 1px;

          line-height: 1.1;
        }

        /* =====================================================
           INPUT AREA
        ===================================================== */

        .input-cell {
          height: 28px;

          background: #fff;
        }

        /* =====================================================
           TOTAL
        ===================================================== */

        .total-row td {
          height: 20px;

          font-weight: bold;

          padding: 2px;
        }

        /* =====================================================
           SIGNATURE
        ===================================================== */

        .signature-section {
          display: flex;

          justify-content: space-between;

          margin-top: 13px;

          padding: 0 30px;
        }

        .signature-box {
          width: 120px;

          text-align: center;
        }

        .signature-line {
          height: 25px;

          border-bottom:
            1px solid #000;

          margin-bottom: 2px;
        }

        .signature-name {
          font-size: 8px;

          font-weight: bold;
        }

        /* =====================================================
           SCREEN
        ===================================================== */

        @media screen {
          body {
            background: #ddd;
          }

          .print-page {
            background: #fff;

            width: 210mm;

            min-height: 297mm;

            margin: 15px auto;

            padding: 7mm;

            box-shadow:
              0 0 5px
              rgba(0, 0, 0, 0.15);
          }
        }

        /* =====================================================
           PRINT
        ===================================================== */

        @media print {
          body {
            background: #fff;
          }

          .print-page {
            width: 100%;

            min-height: auto;

            padding: 0;

            margin: 0;
          }
        }
      `}</style>

      <div className="print-page">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="header-top">

          <img
            src="/images/yusen001.jpeg"
            alt="Logo"
            className="logo"
          />

          <div className="barcode-wrapper">
            <canvas ref={barcodeRef} />
          </div>

        </div>

        {/* TITLE */}

        <div className="title">
          RECEIVING TALLY SHEET
        </div>

        {/* =====================================================
            HEADER INFORMATION
        ===================================================== */}

        <table className="info-table">

          <tbody>

            <tr>
              <td className="info-label">
                Owner
              </td>

              <td className="info-value">
                {data.owner_code || "-"}
              </td>

              <td className="info-label">
                Transporter
              </td>

              <td className="info-value">
                {data.transporter || "-"}
              </td>
            </tr>

            <tr>
              <td className="info-label">
                Inbound ID
              </td>

              <td className="info-value">
                {data.inbound_no || "-"}
              </td>

              <td className="info-label">
                Truck No
              </td>

              <td className="info-value">
                {data.no_truck || "-"}
              </td>
            </tr>

            <tr>
              <td className="info-label">
                Receipt ID
              </td>

              <td className="info-value">
                {data.receipt_id || "-"}
              </td>

              <td className="info-label">
                Driver
              </td>

              <td className="info-value">
                {data.driver || "-"}
              </td>
            </tr>

            <tr>
              <td className="info-label">
                Supplier
              </td>

              <td className="info-value">
                {data.supplier_name || "-"}
              </td>

              <td className="info-label">
                Truck Size
              </td>

              <td className="info-value">
                {data.truck_size || "-"}
              </td>
            </tr>

            <tr>
              <td className="info-label">
                Date
              </td>

              <td className="info-value">
                {data.inbound_date || "-"}
              </td>

              <td className="info-label">
                Arrival
              </td>

              <td className="info-value">
                {data.arrival_time || "-"}
              </td>
            </tr>

            <tr>
              <td className="info-label">
                Start Unload
              </td>

              <td className="info-value">
                {data.start_unloading || "-"}
              </td>

              <td className="info-label">
                End Unload
              </td>

              <td className="info-value">
                {data.end_unloading || "-"}
              </td>
            </tr>

            <tr>
              <td className="info-label">
                BL No
              </td>

              <td className="info-value">
                {data.bl_no || "-"}
              </td>

              <td className="info-label">
                Container
              </td>

              <td className="info-value">
                {data.container || "-"}
              </td>
            </tr>

            <tr>
              <td className="info-label">
                Remarks
              </td>

              <td className="info-value">
                {data.remarks || "-"}
              </td>

              <td className="info-label">
                Koli
              </td>

              <td className="info-value">
                {data.koli || "-"}
              </td>
            </tr>

          </tbody>

        </table>

        {/* =====================================================
            ITEM TABLE
        ===================================================== */}

        <table className="main-table">

          <thead>

            <tr>

              <th className="no">
                NO
              </th>

              <th className="item">
                ITEM
              </th>

              <th className="imd">
                IMD
              </th>

              <th className="qty">
                QTY
              </th>

              <th className="serial-number">
                SERIAL NUMBER
              </th>

              <th className="case-no">
                CASE NO
              </th>

              <th className="carton-no">
                CARTON NO
              </th>

              <th className="location">
                LOCATION
              </th>

            </tr>

          </thead>

          <tbody>

            {sheet.map((item, index) => (

              <tr key={index}>

                {/* NO */}

                <td className="no">
                  {index + 1}
                </td>

                {/* ITEM */}

                <td className="item">

                  <div className="item-code">
                    {item.item_code}
                  </div>

                  <div className="item-name">
                    {item.item_name}
                  </div>

                </td>

                {/* IMD */}

                <td className="imd">
                  {item.imd || "-"}
                </td>

                {/* QTY */}

                <td className="qty">
                  {item.quantity}
                </td>

                {/* SERIAL NUMBER */}

                <td className="serial-number">
                  {item.serial_number || "-"}
                </td>

                {/* CASE NO */}

                <td className="case-no input-cell">
                  {item.case_no || ""}
                </td>

                {/* CARTON NO */}

                <td className="carton-no input-cell">
                  {item.carton_no || ""}
                </td>

                {/* LOCATION */}

                <td className="location input-cell">
                  {item.location || ""}
                </td>

              </tr>

            ))}

            {/* =================================================
                TOTAL
            ================================================= */}

            <tr className="total-row">

              <td
                colSpan={3}
                style={{
                  textAlign: "center",
                }}
              >
                TOTAL
              </td>

              <td
                style={{
                  textAlign: "center",
                }}
              >
                {totalQty}
              </td>

              <td></td>

              <td></td>

              <td></td>

              <td></td>

            </tr>

          </tbody>

        </table>

        {/* =====================================================
            SIGNATURE
        ===================================================== */}

        <div className="signature-section">

          <div className="signature-box">

            <div className="signature-line"></div>

            <div className="signature-name">
              ADMIN
            </div>

          </div>

          <div className="signature-box">

            <div className="signature-line"></div>

            <div className="signature-name">
              CHECKER
            </div>

          </div>

          <div className="signature-box">

            <div className="signature-line"></div>

            <div className="signature-name">
              SCANNER
            </div>

          </div>

        </div>

      </div>
    </>
  );
};

export default PutawaySheetPrint;