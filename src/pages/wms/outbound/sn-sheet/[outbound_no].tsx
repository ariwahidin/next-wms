
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import React from "react";


const SerialNumberSheet = () => {
  const router = useRouter();
  const { outbound_no } = router.query;
  const [header, setHeader] = useState<any>();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (outbound_no) {
      fetchData(outbound_no as string);
      console.log("OUTBOUND NO:", outbound_no);
    }
  }, [outbound_no]);

  const fetchData = async (outbound_no: string) => {
    const res = await api.get(`/outbound/serial/${outbound_no}`);
    setHeader(res.data.data?.header);
    setItems(res.data.data?.items || []);
  };

  const maxItemsPerPage = 8; // batas maksimal item untuk dianggap "muat di 1 halaman"
  const shouldDuplicate = items && items.length <= maxItemsPerPage;

  return (
    <div style={{ padding: "10px", fontFamily: "Arial" }}>
      <PrintableSheet header={header} items={items} />

      {shouldDuplicate && (
        <>
          <div className="page-break" />
          <PrintableSheet header={header} items={items} />
        </>
      )}

      <style jsx global>{`
        @media print {
          .page-break {
            page-break-before: always;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

// ---------------- Komponen Print ----------------

const PrintableSheet = ({ header, items }: any) => (
  <div>
    {/* Header */}
    <div style={{ display: "flex", justifyContent: "center" }}>
      <p style={{ fontSize: "16px", textAlign: "center", fontWeight: "bold" }}>
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
      SERIAL NUMBER LIST
    </h2>

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
            <td style={{ ...headerLabel, width: "6%" }}>Picking No.</td>
            <td style={headerValue}>: {header?.outbound_no}</td>
          </tr>
          <tr>
            <td style={{ ...headerLabel, width: "6%" }}>Delivery No.</td>
            <td style={headerValue}>: {header?.shipment_id}</td>
          </tr>
          <tr>
            <td style={{ ...headerLabel, width: "6%" }}>Customer</td>
            <td style={headerValue}>: {header?.customer_name}</td>
          </tr>
          <tr>
            <td style={{ ...headerLabel, width: "6%" }}>Customer Address</td>
            <td style={headerValue}>: {header?.customer_address}</td>
          </tr>
          <tr>
            <td style={{ ...headerLabel, width: "6%" }}>Transporter</td>
            <td style={headerValue}>: {header?.transporter_name}</td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* Items Table */}
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
          <th style={th}>GMC</th>
          <th style={th}>SN</th>
        </tr>
      </thead>
      <tbody>
        {items?.length > 0 ? (
          items.map((item: any, i: number) => (
            <tr key={i}>
              <td style={{ ...td, textAlign: "center" }}>{i + 1}</td>
              <td style={td}>{item.item_code}</td>
              <td style={td}>{item.barcode}</td>
              <td style={td}>{item.serial_number}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={6} style={td}>
              No data found
            </td>
          </tr>
        )}

        <tr style={{ fontWeight: "bold", background: "#eaeaea" }}>
          <td colSpan={3} style={{ ...td, textAlign: "right" }}>
            GRAND TOTAL
          </td>
          <td style={{ ...td, textAlign: "center" }}>{items?.length}</td>
        </tr>
      </tbody>
    </table>
  </div>
);

// ---------------- Styling ----------------

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

export default SerialNumberSheet;
