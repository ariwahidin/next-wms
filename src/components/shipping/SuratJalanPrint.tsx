/* eslint-disable @next/next/no-img-element */

"use client";

import React, { useEffect, useRef } from "react";
import { printDocument } from "@/lib/print";

type PackageRow = {
  ID: number;
  item_code: string;
  barcode: string;
  serial_number: string;
  package_type: string;
  package_qty: number;
  quantity: number;
  uom: string;
  carton_code: string;
  pack_ctn_no: string;
  product?: {
    item_name?: string;
    qty_per_carton?: number;
  } | null;
};

type SJItem = {
  outbound_no: string;
  shipment_id: string;
  delivery_to: string;
  delivery_to_name: string;
  delivery_address: string;
  delivery_city: string;
  packages?: PackageRow[] | null;
};

type Props = {
  header: {
    sj_no: string;
    sj_date: string;
    order_no: string;
    status: string;
    driver: string;
    driver_phone: string;
    truck_no: string;
    truck_type: string;
    truck_size: string;
    transporter_name: string;
    remarks: string;
  };
  items?: SJItem[] | null;
};

type PackageTotals = {
  ctn: number;
  package: number;
  quantity: number;
};

const formatNumber = (value: number) =>
  value.toLocaleString("en-US");

const getCtnTotal = (
  quantity: number,
  qtyPerCarton: number
): number => {
  const qty = Number(quantity) || 0;
  const perCarton = Number(qtyPerCarton) || 0;

  if (qty <= 0 || perCarton <= 0) {
    return 0;
  }

  return Math.ceil(qty / perCarton);
};

export default function SuratJalanPrint({
  header,
  items,
}: Props) {
  const safeItems = Array.isArray(items) ? items : [];

  const normalizedItems = safeItems.map((item) => ({
    ...item,
    packages: Array.isArray(item.packages)
      ? item.packages
      : [],
  }));

  const packageCount = normalizedItems.reduce(
    (total, item) => total + item.packages.length,
    0
  );

  // ==========================================
  // PRINT LOG
  // ==========================================

  const printStartedRef = useRef(false);

  useEffect(() => {
    if (!header?.sj_no || printStartedRef.current) return;

    printStartedRef.current = true;

    const executePrint = async () => {
      try {
        await printDocument({
          documentType: "SURAT_JALAN",
          documentNo: header.sj_no,
          module: "OUTBOUND",
          printMethod: "BROWSER",
          printFormat: "PDF",
          copyCount: 1,
        });

        window.onafterprint = () => window.close();

        window.addEventListener(
          "beforeunload",
          () => {
            window.close();
          }
        );
      } catch (error) {
        console.error("Surat Jalan print error:", error);

        printStartedRef.current = false;

        alert(
          error instanceof Error
            ? error.message
            : "Failed to process print request."
        );
      }
    };

    executePrint();
  }, [header?.sj_no]);

  // ==========================================
  // GRAND TOTAL
  // ==========================================

  const grandTotal = normalizedItems.reduce<PackageTotals>(
    (total, item) => {
      item.packages.forEach((p) => {
        total.ctn += getCtnTotal(
          p.quantity,
          Number(p.product?.qty_per_carton) || 0
        );

        total.package += Number(p.package_qty) || 0;
        total.quantity += Number(p.quantity) || 0;
      });

      return total;
    },
    {
      ctn: 0,
      package: 0,
      quantity: 0,
    }
  );

  return (
    <div className="sj-print bg-white text-black">

      {/* COMPANY LETTERHEAD */}
      <div className="sj-letterhead">
        <div className="sj-company-info">
          <div className="sj-company-name">
            PT YUSEN LOGISTICS INTERLINK INDONESIA
          </div>

          <div>Jl. Raya Cakung Cilincing KM 1.6</div>
          <div>Jakarta - Indonesia</div>
          <div>
            TEL: 021-4607620 | FAX: 021-4607622
          </div>
        </div>

        <div className="sj-company-logo">
          <img
            src="/images/logo.svg"
            alt="Company Logo"
          />
        </div>
      </div>

      <div className="sj-blue-line" />

      {/* DOCUMENT TITLE */}
      <div className="sj-document-title">
        SURAT JALAN
      </div>

      {/* DOCUMENT & TRANSPORT INFORMATION */}
      <div className="sj-info-container">

        {/* LEFT COLUMN */}
        <div className="sj-info-column">

          <div className="sj-info-row">
            <span>No. Surat Jalan</span>
            <span>:</span>
            <span>{header.sj_no || "-"}</span>
          </div>

          <div className="sj-info-row">
            <span>Date</span>
            <span>:</span>
            <span>
              {String(header.sj_date || "").slice(0, 10) || "-"}
            </span>
          </div>

          <div className="sj-info-row">
            <span>SPK / Order</span>
            <span>:</span>
            <span>{header.order_no || "-"}</span>
          </div>

          <div className="sj-info-row sj-info-section">
            <span>Transporter</span>
            <span>:</span>
            <span>{header.transporter_name || "-"}</span>
          </div>

          <div className="sj-info-row">
            <span>Driver</span>
            <span>:</span>
            <span>{header.driver || "-"}</span>
          </div>

          <div className="sj-info-row">
            <span>Phone</span>
            <span>:</span>
            <span>{header.driver_phone || "-"}</span>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="sj-info-column">

          <div className="sj-info-row sj-info-section">
            <span>Vehicle</span>
            <span></span>
            <span></span>
          </div>

          <div className="sj-info-row">
            <span>Truck No</span>
            <span>:</span>
            <span>{header.truck_no || "-"}</span>
          </div>

          <div className="sj-info-row">
            <span>Truck Type</span>
            <span>:</span>
            <span>{header.truck_type || "-"}</span>
          </div>

          <div className="sj-info-row">
            <span>Truck Size</span>
            <span>:</span>
            <span>{header.truck_size || "-"}</span>
          </div>

          <div className="sj-info-row">
            <span>Total Package</span>
            <span>:</span>
            <span>{packageCount}</span>
          </div>

        </div>
      </div>

      {/* DO & PACKAGE DETAILS */}
      {normalizedItems.map((d, i) => {

        // SUBTOTAL PER DO
        const subtotal = d.packages.reduce<PackageTotals>(
          (total, p) => {
            total.ctn += getCtnTotal(
              p.quantity,
              Number(p.product?.qty_per_carton) || 0
            );

            total.package += Number(p.package_qty) || 0;
            total.quantity += Number(p.quantity) || 0;

            return total;
          },
          {
            ctn: 0,
            package: 0,
            quantity: 0,
          }
        );

        return (
          <section
            key={`${d.outbound_no}-${i}`}
            className="mb-5 sj-package-section"
          >

            {/* DELIVERY INFORMATION */}
            <div className="sj-delivery-info">

              <div className="sj-delivery-top">
                <div>
                  <b>Deliver To:</b>{" "}
                  {d.delivery_to_name || d.delivery_to || "-"}
                  {" · "}
                  {d.delivery_city || "-"}
                </div>

                <div className="sj-order-number">
                  <b>Order Number:</b>{" "}
                  {d.shipment_id || "-"}
                </div>
              </div>

              <div className="sj-delivery-address">
                {d.delivery_address || "-"}
              </div>

            </div>

            {/* PACKAGE TABLE */}
            <table className="sj-table">

              <colgroup>
                <col style={{ width: "6%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "28%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "26%" }} />
              </colgroup>

              <thead>
                <tr>
                  <th>No</th>
                  <th>CTN Total</th>
                  <th>Item Code</th>
                  <th>Package</th>
                  <th>Qty Pcs</th>
                  <th>Note</th>
                </tr>
              </thead>

              <tbody>
                {d.packages.map((p, j) => {
                  const ctnTotal = getCtnTotal(
                    p.quantity,
                    Number(p.product?.qty_per_carton) || 0
                  );

                  return (
                    <tr key={p.ID || j}>

                      <td className="text-center">
                        {j + 1}
                      </td>

                      <td className="text-center">
                        {formatNumber(ctnTotal)}
                      </td>

                      <td>
                        {p.item_code || "-"}
                      </td>

                      <td className="text-center">
                        {p.package_qty ?? 0}{" "}
                        {p.package_type || "-"}
                      </td>

                      <td className="text-right">
                        {formatNumber(Number(p.quantity) || 0)}
                      </td>

                      <td></td>

                    </tr>
                  );
                })}

                {d.packages.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center">
                      No package data
                    </td>
                  </tr>
                )}

                {/* SUBTOTAL */}
                <tr className="sj-subtotal-row">
                  <td className="text-right">
                    SUBTOTAL
                  </td>

                  <td className="text-center">
                    {formatNumber(subtotal.ctn)}
                  </td>

                  <td></td>

                  <td className="text-center">
                    {formatNumber(subtotal.package)}
                  </td>

                  <td className="text-right">
                    {formatNumber(subtotal.quantity)}
                  </td>

                  <td></td>
                </tr>

              </tbody>
            </table>

          </section>
        );
      })}

      {/* GRAND TOTAL */}
      {normalizedItems.length > 0 && (
        <table className="sj-table sj-grand-total-table">

          <colgroup>
            <col style={{ width: "6%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "28%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "26%" }} />
          </colgroup>

          <tbody>
            <tr className="sj-grand-total-row">
              <td className="text-right">
                GRAND TOTAL
              </td>

              <td className="text-center">
                {formatNumber(grandTotal.ctn)}
              </td>

              <td></td>

              <td className="text-center">
                {formatNumber(grandTotal.package)}
              </td>

              <td className="text-right">
                {formatNumber(grandTotal.quantity)}
              </td>

              <td></td>
            </tr>
          </tbody>

        </table>
      )}

      {/* REMARKS */}
      <div className="sj-remarks">
        <b>Remarks:</b> {header.remarks || "-"}
      </div>

      {/* SIGNATURE */}
      <div className="sj-signature">

        <div>
          Prepared By
          <br /><br /><br />
          __________________
        </div>

        <div>
          Driver
          <br /><br /><br />
          __________________
        </div>

        <div>
          Received By
          <br /><br /><br />
          __________________
          <br />
          Name / Date / Stamp
        </div>

      </div>

      {/* PRINT STYLING */}
      <style jsx global>{`

        .sj-print {
          width: 100%;
          background: #fff;
          color: #000;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
        }

        /* COMPANY LETTERHEAD */

        .sj-letterhead {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          line-height: 1.5;
          color: #333;
          padding: 5px 0 8px;
          gap: 20px;
        }

        .sj-company-info {
          flex: 1;
          min-width: 0;
        }

        .sj-company-name {
          font-size: 13px;
          font-weight: 900;
          color: #173d78;
          margin-bottom: 2px;
        }

        .sj-company-logo {
          width: 130px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          flex-shrink: 0;
        }

        .sj-company-logo img {
          max-width: 120px;
          max-height: 65px;
          object-fit: contain;
        }

        .sj-blue-line {
          width: 100%;
          height: 1px;
          background: #173d78;
          margin-bottom: 10px;
        }

        /* DOCUMENT TITLE */

        .sj-document-title {
          text-align: center;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin: 8px 0 12px;
        }

        /* DOCUMENT INFORMATION */

        .sj-info-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          column-gap: 22px;
          width: 100%;
          margin-bottom: 15px;
          padding-bottom: 12px;
          border-bottom: 1px solid #000;
        }

        .sj-info-column {
          min-width: 0;
        }

        .sj-info-row {
          display: grid;
          grid-template-columns: 105px 10px minmax(0, 1fr);
          align-items: start;
          font-size: 11px;
          line-height: 1.65;
        }

        .sj-info-section {
          font-weight: 700;
          margin-top: 2px;
        }

        /* DELIVERY INFORMATION */

        .sj-delivery-info {
          font-size: 11px;
          line-height: 1.6;
          padding-bottom: 8px;
          margin-bottom: 8px;
          border-bottom: 1px solid #000;
        }

        .sj-delivery-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .sj-order-number {
          white-space: nowrap;
        }

        .sj-delivery-address {
          margin-top: 2px;
        }

        /* PACKAGE TABLE */

        .sj-table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          font-size: 10px;
        }

        .sj-table th,
        .sj-table td {
          border: 1px solid #000;
          padding: 6px 7px;
          vertical-align: middle;
          overflow-wrap: anywhere;
        }

        .sj-table th {
          font-weight: 700;
          text-align: center;
          background: #f3f3f3;
          height: 25px;
        }

        .sj-table td.text-center {
          text-align: center;
        }

        .sj-table td.text-right {
          text-align: right;
        }

        .sj-package-section {
          break-inside: auto;
        }

        /* SUBTOTAL */

        .sj-subtotal-row {
          font-weight: 700;
          background: #f3f3f3;
        }

        .sj-subtotal-row td {
          border-top: 1.5px solid #000;
        }

        /* GRAND TOTAL */

        .sj-grand-total-table {
          margin-top: -12px;
        }

        .sj-grand-total-row {
          font-weight: 700;
          background: #e9edf3;
        }

        .sj-grand-total-row td {
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
        }

        /* REMARKS */

        .sj-remarks {
          margin-top: 20px;
          font-size: 11px;
        }

        /* SIGNATURE */

        .sj-signature {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 25px;
          margin-top: 45px;
          text-align: center;
          font-size: 11px;
        }

        /* PRINT */

        @media print {

          @page {
            size: A4;
            margin: 12mm;
          }

          body {
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .sj-print {
            width: 100%;
            font-size: 10pt;
          }

          .sj-letterhead {
            font-size: 8px;
          }

          .sj-company-name {
            font-size: 11px;
          }

          .sj-company-logo img {
            max-width: 110px;
            max-height: 55px;
          }

          .sj-document-title {
            font-size: 15px;
          }

          .sj-info-row {
            font-size: 9px;
            grid-template-columns: 95px 9px minmax(0, 1fr);
          }

          .sj-delivery-info {
            font-size: 9px;
          }

          .sj-table {
            font-size: 9px;
          }

          .sj-table th,
          .sj-table td {
            padding: 5px 6px;
          }

          .sj-table thead {
            display: table-header-group;
          }

          .sj-table tr {
            break-inside: avoid;
          }

          .sj-print button {
            display: none !important;
          }

        }

      `}</style>

    </div>
  );
}
