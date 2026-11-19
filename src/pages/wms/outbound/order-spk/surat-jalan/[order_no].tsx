
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import { printDocument } from "@/lib/print";

// ================================================================
// TYPES
// ================================================================

type SuratJalanItem = {
  item_id: number;
  item_code: string;
  item_name: string;
  ctn_total: number;
  qty_pack: number;
  uom: string;
  qty_pcs: number;
  remarks: string;
};

type Shipment = {
  shipment_id: string;
  outbound_no: string;

  delivery_to: string;
  delivery_to_name: string;
  delivery_address: string;
  delivery_city: string;

  total_ctn: number;
  total_qty_pack: number;
  total_qty_pcs: number;
  total_item: number;

  items: SuratJalanItem[];
};

type SuratJalanData = {
  order_no: string;
  order_date: string;
  load_date: string;
  delivery_date: string;

  order_type: string;
  driver: string;
  driver_phone: string;
  truck_type: string;
  truck_size: string;
  truck_no: string;

  transporter_code: string;
  transporter_name: string;

  status: string;
  remarks: string;

  total_shipment: number;
  shipments: Shipment[];
};

// ================================================================
// HELPERS
// ================================================================

const formatNumber = (value: number) =>
  Number(value || 0).toLocaleString("id-ID", {
    maximumFractionDigits: 2,
  });

const formatDate = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);

  if (isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ================================================================
// COMPONENT
// ================================================================

const SuratJalanPrint = () => {
  const router = useRouter();
  const { order_no } = router.query;

  const [data, setData] = useState<SuratJalanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const printStartedRef = useRef(false);

  // ==============================================================
  // FETCH DATA
  // ==============================================================

  useEffect(() => {
    if (!router.isReady || !order_no) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get(
          `/order/surat-jalan/${encodeURIComponent(
            order_no as string
          )}`,
          {
            withCredentials: true,
          }
        );

        if (!res.data.success) {
          throw new Error(
            res.data.message || "Failed to retrieve delivery note"
          );
        }

        setData(res.data.data);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
          err.message ||
          "Failed to load delivery note"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router.isReady, order_no]);

  // ==============================================================
  // PRINT
  // ==============================================================

  const handlePrint = async () => {
    if (printStartedRef.current) return;

    printStartedRef.current = true;

    try {
      await printDocument({
        documentType: "SURAT_JALAN",
        documentNo: data?.order_no || "",
        module: "OUTBOUND",
        printMethod: "BROWSER",
        printFormat: "PDF",
        copyCount: 1,
      });

      window.print();
    } catch (err) {
      console.error("Surat Jalan print error:", err);
      window.alert(
        err instanceof Error
          ? err.message
          : "Failed to process print request."
      );
    } finally {
      printStartedRef.current = false;
    }
  };

  // ==============================================================
  // LOADING / ERROR
  // ==============================================================

  if (loading) {
    return (
      <div className="screen-message">
        Loading delivery note...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="screen-message error">
        {error || "Delivery note not found"}
      </div>
    );
  }

  if (!data.shipments?.length) {
    return (
      <div className="screen-message">
        No shipment found for this SPK.
      </div>
    );
  }

  // ==============================================================
  // RENDER
  // ==============================================================

  return (
    <div className="print-container">

      {/* PRINT ACTION */}
      <div className="print-toolbar">
        <div>
          <strong>Surat Jalan</strong>
          <div className="toolbar-subtitle">
            SPK: {data.order_no} | {data.total_shipment} Shipment
          </div>
        </div>

        <button onClick={handlePrint}>
          Print All Surat Jalan
        </button>
      </div>

      {/* ONE PAGE PER SHIPMENT */}
      {data.shipments.map((shipment, index) => (

        <section
          className="surat-jalan-page"
          key={shipment.shipment_id}
        >

          {/* ================================================== */}
          {/* COMPANY HEADER */}
          {/* ================================================== */}

          <header className="company-header">

            <div className="company-info">
              <div className="company-name">
                PT YUSEN LOGISTICS INTERLINK INDONESIA
              </div>

              <div>
                Jl. Raya Cakung Cilincing KM 1.6
              </div>

              <div>
                Jakarta - Indonesia
              </div>

              <div>
                TEL: 021-4607620 | FAX: 021-4607622
              </div>
            </div>

            {/* <div className="company-logo">
              Yusen
              <strong>Logistics</strong>
            </div> */}

          </header>

          <div className="header-divider" />

          {/* ================================================== */}
          {/* DOCUMENT TITLE */}
          {/* ================================================== */}

          <div className="document-title">
            <h1>SURAT JALAN</h1>
          </div>

          {/* ================================================== */}
          {/* DOCUMENT INFORMATION */}
          {/* ================================================== */}

          <div className="document-info">

            <div className="info-left">

              <InfoRow
                label="No. Surat Jalan"
                value={shipment.shipment_id}
              />

              <InfoRow
                label="No. SPK / Order"
                value={data.order_no}
              />

              <InfoRow
                label="Tanggal"
                value={formatDate(data.delivery_date)}
              />

              <InfoRow
                label="Dari Gudang / Lap"
                value="-"
              />

              <InfoRow
                label="Ex Kapal"
                value="-"
              />

              <InfoRow
                label="Tanggal Tiba"
                value="-"
              />

              <InfoRow
                label="Truck No. / Pol."
                value={data.truck_no}
              />

              <InfoRow
                label="Pemilik Angkutan"
                value={data.transporter_name}
              />

              <InfoRow
                label="No. DO / B/L"
                value="-"
              />

              <InfoRow
                label="EMKL / Per. Pel."
                value="-"
              />

            </div>

            <div className="info-right">

              <div className="delivery-label">
                DIKIRIM KEPADA
              </div>

              <div className="delivery-name">
                {shipment.delivery_to_name || "-"}
              </div>

              <div className="delivery-address">
                {shipment.delivery_address || "-"}
              </div>

              <div className="delivery-city">
                {shipment.delivery_city || ""}
              </div>

              <div className="delivery-extra">
                <InfoRow
                  label="Kode Customer"
                  value={shipment.delivery_to}
                />

                <InfoRow
                  label="Driver"
                  value={data.driver}
                />

                <InfoRow
                  label="No. Polisi"
                  value={data.truck_no}
                />

                <InfoRow
                  label="No. Outbound"
                  value={shipment.outbound_no}
                />

              </div>

            </div>

          </div>

          {/* ================================================== */}
          {/* ITEMS TABLE */}
          {/* ================================================== */}

          <table className="items-table">

            <thead>
              <tr>
                <th className="col-no">No</th>
                <th className="col-ctn">CTN Total</th>
                <th className="col-item">Item Code</th>
                <th className="col-pack">QTY PACK</th>
                <th className="col-uom">UOM</th>
                <th className="col-pcs">QTY PCS</th>
                <th className="col-remarks">KETERANGAN</th>
              </tr>
            </thead>

            <tbody>

              {shipment.items.map((item, itemIndex) => (

                <tr key={`${item.item_id}-${item.item_code}-${itemIndex}`}>

                  <td className="text-center">
                    {itemIndex + 1}
                  </td>

                  <td className="text-center">
                    {formatNumber(item.ctn_total)}
                  </td>

                  <td>
                    {item.item_code}
                  </td>

                  <td className="text-right">
                    {formatNumber(item.qty_pack)}
                  </td>

                  <td className="text-center">
                    {item.uom}
                  </td>

                  <td className="text-right">
                    {formatNumber(item.qty_pcs)}
                  </td>

                  <td>
                    {item.remarks || ""}
                  </td>

                </tr>

              ))}

              {/* GRAND TOTAL */}

              <tr className="grand-total">

                <td colSpan={1}></td>

                <td className="text-center">
                  {formatNumber(shipment.total_ctn)}
                </td>

                <td className="text-right">
                  GRAND TOTAL
                </td>

                <td className="text-right">
                  {formatNumber(shipment.total_qty_pack)}
                </td>

                <td></td>

                <td className="text-right">
                  {formatNumber(shipment.total_qty_pcs)}
                </td>

                <td></td>

              </tr>

            </tbody>

          </table>

          {/* ================================================== */}
          {/* TOTAL CTN */}
          {/* ================================================== */}

          <div className="total-ctn">
            Total : <strong>{formatNumber(shipment.total_ctn)} CTN</strong>
          </div>

          {/* ================================================== */}
          {/* DOCUMENT FOOTER */}
          {/* ================================================== */}

          <div className="document-date">
            Jakarta, {formatDate(data.delivery_date)}
          </div>

          {/* ================================================== */}
          {/* SIGNATURE */}
          {/* ================================================== */}

          <div className="signature-section">

            <SignatureBlock title="Penerima" />

            <SignatureBlock title="Supir Truck" />

            <SignatureBlock title="Gudang" />

          </div>

          {/* ================================================== */}
          {/* DOCUMENT REMARKS */}
          {/* ================================================== */}

          <div className="document-remarks">
            <strong>Catatan :</strong>
            <div>{data.remarks || ""}</div>
          </div>

          {/* PAGE NUMBER */}
          <div className="page-number">
            {index + 1} / {data.total_shipment}
          </div>

        </section>

      ))}

      {/* ======================================================== */}
      {/* STYLES */}
      {/* ======================================================== */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        .print-container {
          background: #e5e7eb;
          min-height: 100vh;
          padding: 24px;
          font-family: Arial, Helvetica, sans-serif;
          color: #111;
        }

        .print-toolbar {
          max-width: 210mm;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #fff;
          padding: 14px 20px;
          border-radius: 8px;
        }

        .toolbar-subtitle {
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }

        .print-toolbar button {
          background: #1d4ed8;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px 18px;
          font-weight: 600;
          cursor: pointer;
        }

        .surat-jalan-page {
          position: relative;
          background: white;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto 24px;
          padding: 13mm 13mm 12mm;
          font-size: 11px;
          page-break-after: always;
          break-after: page;
        }

        .surat-jalan-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }

        /* COMPANY HEADER */

        .company-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 45px;
        }

        .company-info {
          font-size: 9px;
          line-height: 1.5;
          color: #333;
        }

        .company-name {
          font-size: 11px;
          font-weight: bold;
          color: #1e4785;
          margin-bottom: 3px;
        }

        .company-logo {
          font-size: 20px;
          color: #1e4785;
          font-style: italic;
          letter-spacing: -1px;
        }

        .company-logo strong {
          margin-left: 4px;
          font-size: 16px;
        }

        .header-divider {
          border-bottom: 1px solid #315a9a;
          margin-top: 9px;
        }

        /* TITLE */

        .document-title {
          text-align: center;
          margin: 9px 0 17px;
        }

        .document-title h1 {
          font-size: 16px;
          font-weight: bold;
          text-decoration: underline;
          margin: 0;
          letter-spacing: 1px;
        }

        /* DOCUMENT INFORMATION */

        .document-info {
          display: grid;
          grid-template-columns: 57% 43%;
          min-height: 165px;
          font-size: 10px;
        }

        .info-left {
          padding-right: 15px;
        }

        .info-right {
          border-left: 1px solid #ddd;
          padding-left: 14px;
        }

        .info-row {
          display: grid;
          grid-template-columns: 112px 10px 1fr;
          min-height: 17px;
          align-items: start;
        }

        .info-label {
          white-space: nowrap;
          font-weight: 500;
        }

        .info-value {
          font-weight: 500;
          overflow-wrap: anywhere;
        }

        .delivery-label {
          font-size: 9px;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .delivery-name {
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 3px;
        }

        .delivery-address,
        .delivery-city {
          font-size: 10px;
          line-height: 1.5;
        }

        .delivery-extra {
          margin-top: 12px;
        }

        .delivery-extra .info-row {
          min-height: 16px;
        }

        /* TABLE */

        .items-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 10px;
          margin-top: 10px;
        }

        .items-table th,
        .items-table td {
          border: 1px solid #315a9a;
          padding: 5px 4px;
          overflow-wrap: anywhere;
        }

        .items-table th {
          text-align: center;
          font-weight: bold;
          background: #edf2f8;
          color: #183d79;
          height: 29px;
        }

        .items-table td {
          height: 25px;
          vertical-align: middle;
        }

        .col-no {
          width: 6%;
        }

        .col-ctn {
          width: 12%;
        }

        .col-item {
          width: 23%;
        }

        .col-pack {
          width: 13%;
        }

        .col-uom {
          width: 10%;
        }

        .col-pcs {
          width: 15%;
        }

        .col-remarks {
          width: 21%;
        }

        .text-center {
          text-align: center;
        }

        .text-right {
          text-align: right;
        }

        .grand-total {
          font-weight: bold;
          background: #f3f5f8;
        }

        .grand-total td {
          height: 29px;
        }

        .total-ctn {
          text-align: right;
          margin-top: 9px;
          font-size: 11px;
        }

        /* DATE */

        .document-date {
          text-align: right;
          margin-top: 35px;
          margin-right: 30px;
          font-size: 10px;
        }

        /* SIGNATURE */

        .signature-section {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 25px;
          margin-top: 30px;
          text-align: center;
        }

        .signature-block {
          min-height: 100px;
        }

        .signature-title {
          font-size: 10px;
          font-weight: bold;
          margin-bottom: 3px;
        }

        .signature-space {
          height: 65px;
        }

        .signature-line {
          border-bottom: 1px dotted #555;
          margin: 0 15px 5px;
        }

        .signature-caption {
          font-size: 9px;
        }

        /* REMARKS */

        .document-remarks {
          margin-top: 25px;
          min-height: 65px;
          border: 1px solid #555;
          padding: 8px;
          font-size: 10px;
        }

        .document-remarks div {
          margin-top: 8px;
        }

        .page-number {
          position: absolute;
          bottom: 5mm;
          right: 13mm;
          font-size: 9px;
          color: #777;
        }

        .screen-message {
          padding: 50px;
          text-align: center;
          font-family: Arial;
        }

        .screen-message.error {
          color: #dc2626;
        }

        /* PRINT */

        @page {
          size: A4 portrait;
          margin: 0;
        }

        @media print {

            html,
            body {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                height: auto !important;
                overflow: visible !important;
            }

            .print-container {
                padding: 0 !important;
                margin: 0 !important;
                background: white !important;
                overflow: visible !important;
            }

            .print-toolbar {
                display: none !important;
            }

            .surat-jalan-page {
                position: relative;
                width: 210mm;
                height: auto !important;
                min-height: 297mm;
                max-height: none !important;
                margin: 0;
                padding: 13mm 13mm 12mm;
                box-shadow: none;
                overflow: visible !important;

                page-break-after: always;
                break-after: page;
            }

            .surat-jalan-page:last-child {
                page-break-after: auto;
                break-after: auto;
            }

            /* Table pagination */
            .items-table {
                width: 100%;
                border-collapse: collapse;
                page-break-inside: auto;
                break-inside: auto;
            }

            .items-table thead {
                display: table-header-group;
            }

            .items-table tfoot {
                display: table-footer-group;
            }

            .items-table tr {
                page-break-inside: avoid;
                break-inside: avoid;
            }

            .items-table th,
            .items-table td {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }

      `}</style>

    </div>
  );
};

// ================================================================
// SUB COMPONENTS
// ================================================================

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | number;
}) => (
  <div className="info-row">
    <span className="info-label">{label}</span>
    <span>:</span>
    <span className="info-value">{value || "-"}</span>
  </div>
);

const SignatureBlock = ({
  title,
}: {
  title: string;
}) => (
  <div className="signature-block">
    <div className="signature-title">{title}</div>

    <div className="signature-space" />

    <div className="signature-line" />

    <div className="signature-caption">
      Nama & Tanda Tangan
    </div>
  </div>
);

export default SuratJalanPrint;
