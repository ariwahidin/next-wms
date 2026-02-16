/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Package, MapPin, Calendar, User, Hash, Barcode, Box } from 'lucide-react';
import { useRouter } from 'next/router';
import JsBarcode from 'jsbarcode';
import api from '@/lib/api';
import Layout from '@/components/layout';

interface PackingItem {
  packing_no: string;
  packing_date: string;
  cust_address: string;
  cust_city: string;
  deliv_to: string;
  deliv_address: string;
  deliv_city: string;
  customer_name: string;
  deliv_to_name: string;
  outbound_no: string;
  shipment_id: string;
  item_code: string;
  item_name: string;
  quantity: number;
  pack_ctn_no: string;
  barcode_scan: string;
  plan_pickup_date: string;
  transporter_code: string;
  user_def1?: string;
}

interface GroupedCarton {
  pack_ctn_no: string;
  packing_no: string;
  packing_date: string;
  cust_address: string;
  cust_city: string;
  deliv_to: string;
  deliv_address: string;
  deliv_city: string;
  customer_name: string;
  deliv_to_name: string;
  outbound_no: string;
  shipment_id: string;
  plan_pickup_date: string;
  transporter_code: string;
  items: Array<{
    item_code: string;
    item_name: string;
    quantity: number;
    barcode_scan: string;
    user_def1?: string;
  }>;
  total_items: number;
  total_quantity: number;
}

const CartonLabelPrinter: React.FC = () => {
  const router = useRouter();
  const { packing, id } = router.query;
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const printRef = useRef(null);

  useEffect(() => {
    if (packing && id) {
      console.log("packing : ", packing);
      console.log("id : ", id);
      fetchData(id as string);
    }
  }, [packing, id]);

  const fetchData = async (id: string) => {
    const res = await api.get(`/outbound/${id}/packing/${packing}`, {
      withCredentials: true,
    });
    setPackingItems(res.data.data.list);
  };

  // Group items by pack_ctn_no and sum quantities for duplicate items
  const groupedCartons = useMemo(() => {
    const grouped = new Map<string, GroupedCarton>();

    packingItems.forEach(item => {
      if (!grouped.has(item.pack_ctn_no)) {
        grouped.set(item.pack_ctn_no, {
          pack_ctn_no: item.pack_ctn_no,
          packing_no: item.packing_no,
          packing_date: item.packing_date,
          cust_address: item.cust_address,
          cust_city: item.cust_city,
          deliv_to: item.deliv_to,
          deliv_address: item.deliv_address,
          deliv_city: item.deliv_city,
          customer_name: item.customer_name,
          deliv_to_name: item.deliv_to_name,
          outbound_no: item.outbound_no,
          shipment_id: item.shipment_id,
          plan_pickup_date: item.plan_pickup_date,
          transporter_code: item.transporter_code,
          items: [],
          total_items: 0,
          total_quantity: 0,
        });
      }

      const carton = grouped.get(item.pack_ctn_no)!;

      // Check if item already exists, if yes, sum the quantity
      const existingItem = carton.items.find(i => i.item_code === item.item_code);
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        carton.items.push({
          item_code: item.item_code,
          item_name: item.item_name,
          quantity: item.quantity,
          barcode_scan: item.barcode_scan,
          user_def1: item.user_def1
        });
      }

      carton.total_quantity += item.quantity;
    });

    // Calculate total items and sort
    grouped.forEach(carton => {
      carton.total_items = carton.items.length;
    });

    return Array.from(grouped.values()).sort((a, b) =>
      parseInt(a.pack_ctn_no) - parseInt(b.pack_ctn_no)
    );
  }, [packingItems]);

  // Group cartons into pages of 4
  const groupedPages = useMemo(() => {
    const pages: GroupedCarton[][] = [];
    for (let i = 0; i < groupedCartons.length; i += 4) {
      pages.push(groupedCartons.slice(i, i + 4));
    }
    return pages;
  }, [groupedCartons]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const totalCartons = groupedCartons.length;

  useEffect(() => {
    if (groupedCartons.length > 0) {
      // Generate barcodes after cartons are loaded
      groupedCartons.forEach((carton, index) => {
        const shipmentBarcode = document.getElementById(`barcode-shipment-${index}`);
        const caseBarcode = document.getElementById(`barcode-case-${index}`);

        if (shipmentBarcode) {
          try {
            JsBarcode(shipmentBarcode, carton.shipment_id, {
              format: 'CODE128',
              width: 1.5,
              height: 30,
              displayValue: false,
              margin: 0
            });
          } catch (e) {
            console.error('Error generating shipment barcode:', e);
          }
        }

        if (caseBarcode) {
          try {
            JsBarcode(caseBarcode, `${carton.outbound_no}${carton.pack_ctn_no.padStart(2, '0')}`, {
              format: 'CODE128',
              width: 1.5,
              height: 30,
              displayValue: false,
              margin: 0
            });
          } catch (e) {
            console.error('Error generating case barcode:', e);
          }
        }
      });

      // Auto print after barcodes are generated
      setTimeout(() => {
        window.print();
      }, 1500);
    }
  }, [groupedCartons]);

  return (
    <>
      {/* Screen View - Control Panel */}
      <div className="screen-only p-8 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Package className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Carton Label Generator</h1>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 font-medium">
                {totalCartons} label siap dicetak • {packingItems.length} total items
              </p>
            </div>

            <button
              onClick={handlePrint}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Package className="w-5 h-5" />
              Print Labels
            </button>
          </div>
        </div>
      </div>

      {/* Print View - Labels */}
      <div ref={printRef} className="print-only">
        {groupedPages.map((page, pageIndex) => (
          <div key={pageIndex} className="print-page">
            {page.map((carton, labelIndex) => {
              const globalIndex = pageIndex * 4 + labelIndex;
              return (
                <div key={carton.pack_ctn_no} className="label-container">
                  <div className="label-page">
                    {/* Header Section - To */}
                    <div className="label-header">
                      <div className="header-to">To :</div>
                      <div className="header-customer">
                        <div className="customer-name">{carton.customer_name}</div>
                        <div className="customer-address">{carton.deliv_address}</div>
                      </div>
                    </div>

                    {/* Order Number Section */}
                    <div className="order-section">
                      <div className="order-title">Order No. / Shipment ID.</div>
                      <div className="order-number">{carton.shipment_id}</div>
                    </div>

                    {/* Grid Section - Qty and Case Number */}
                    <div className="grid-section">
                      <div className="grid-left">
                        <div className="grid-label">Qty This Case</div>
                        <div className="grid-value">{carton.total_quantity}</div>
                      </div>
                      <div className="grid-right">
                        <div className="grid-label">Case <span className="case-number">{carton.pack_ctn_no} of {totalCartons}</span></div>
                      </div>
                    </div>

                    {/* Barcode Section */}
                    <div className="barcode-section">
                      <div className="barcode-left">
                        <div className="barcode-title">Shipment Order No.</div>
                        <svg id={`barcode-shipment-${globalIndex}`} className="barcode-svg"></svg>
                        <div className="barcode-text">{carton.shipment_id}</div>
                      </div>
                      <div className="barcode-right">
                        <div className="barcode-title">Case Mark</div>
                        <svg id={`barcode-case-${globalIndex}`} className="barcode-svg"></svg>
                        <div className="barcode-text">{carton.outbound_no}{carton.pack_ctn_no.padStart(2, '0')}</div>
                      </div>
                    </div>

                    {/* Bottom Grid Section */}
                    <div className="bottom-section">
                      {carton.items.map((item, idx) => (
                        <div className="bottom-label" key={idx}>
                          <span>{item.item_code}</span> {' - '}<span>{item.item_name}</span>
                        </div>
                      ))}
                    </div>

                    <div className="footer-section-delivered">
                      <div className="footer-left-delivered">
                        Delivered By : <br />
                        <span style={{ fontWeight: "bold" }}>YUWELL Warehouse</span> <br />
                        Jl. Raya Cakung Cilincing KM. 1.5, Cakung, Jakarta 13910 <br />
                      </div>
                    </div>

                    {/* Footer Section */}
                    <div className="footer-section">
                      {/* <div className="footer-left">Dimension : {carton.items.map(item => item.user_def1).join(' , ')}</div> */}
                      <div className="footer-left">
                        Dimension : {carton.items.length > 1
                          ? ''
                          : carton.items[0]?.user_def1 || ''}
                      </div>
                      <div className="footer-right">{new Date().toLocaleString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                      })}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Print Styles */}
      <style jsx>{`
        .screen-only {
          display: block;
        }
        .print-only {
          display: none;
        }

        @media print {
          .screen-only {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }

          @page {
            size: A4;
            margin: 0;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          body {
            margin: 0;
            padding: 0;
          }

          .print-page {
            width: 210mm;
            height: 297mm;
            position: relative;
            background: white;
            page-break-after: always;
            page-break-inside: avoid;
            display: grid;
            grid-template-columns: 100mm 100mm;
            grid-template-rows: 148.5mm 148.5mm;
            gap: 5mm;
            padding: 0 5mm;
          }

          .print-page:last-child {
            page-break-after: auto;
          }

          .label-container {
            width: 100mm;
            height: 142mm;
            position: relative;
            background: white;
          }

          .label-page {
            width: 100%;
            height: 100%;
            border: 1px solid #000;
            box-sizing: border-box;
            background: white;
            padding: 3mm;
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
          }

          /* Header Section */
          .label-header {
            border: 1px solid #000;
            padding: 2mm;
            margin-bottom: 2mm;
          }

          .header-to {
            font-size: 8pt;
            font-weight: bold;
            margin-bottom: 1mm;
          }

          .header-customer {
            font-size: 7pt;
            line-height: 1.3;
          }

          .customer-name {
            font-weight: bold;
            font-size: 10pt;
            margin-bottom: 1mm;
          }

          .customer-details {
            margin: 1mm 0;
          }

          .customer-details div {
            margin-bottom: 0.5mm;
          }

          .customer-address {
            margin-top: 1mm;
            line-height: 1.4;
            font-size: 9pt;
          }

          /* From Section */
          .label-from {
            border: 1px solid #000;
            border-top: none;
            padding: 2mm;
            margin-bottom: 2mm;
            font-size: 8pt;
          }

          .from-label {
            font-weight: normal;
          }

          .from-company {
            font-weight: bold;
            font-size: 11pt;
            margin-left: 2mm;
          }

          /* Order Section */
          .order-section {
            border: 1px solid #000;
            padding: 2mm;
            text-align: center;
            margin-bottom: 2mm;
          }

          .order-title {
            font-size: 7pt;
            margin-bottom: 1mm;
          }

          .order-number {
            font-family: 'Calibri';
            font-size: 22pt;
            font-weight: bold;
            letter-spacing: 1px;
          }

          /* Grid Section */
          .grid-section {
            display: flex;
            border: 1px solid #000;
            margin-bottom: 2mm;
          }

          .grid-left {
            flex: 1;
            border-right: 1px solid #000;
            padding: 2mm;
            text-align: center;
          }

          .grid-right {
            flex: 1;
            padding: 2mm;
            text-align: center;
          }

          .grid-label {
            font-size: 7pt;
            margin-bottom: 1mm;
          }

          .grid-value {
            font-size: 20pt;
            font-weight: bold;
          }

          .case-number {
            font-size: 16pt;
            font-weight: bold;
          }

          /* Barcode Section */
          .barcode-section {
            display: flex;
            border: 1px solid #000;
            margin-bottom: 2mm;
          }

          .barcode-left {
            flex: 1;
            border-right: 1px solid #000;
            padding: 2mm;
            text-align: center;
          }

          .barcode-right {
            flex: 1;
            padding: 2mm;
            text-align: center;
          }

          .barcode-title {
            font-size: 6pt;
            margin-bottom: 1mm;
          }

          .barcode-svg {
            width: 100%;
            height: auto;
            margin: 1mm 0;
          }

          .barcode-text {
            font-size: 7pt;
            font-weight: bold;
            margin-top: 1mm;
          }

          /* Bottom Section */
          .bottom-section {
            display: flex;
            flex-direction: column;
            margin-bottom: 2mm;
          }

          .bottom-left {
            flex: 1;
            border-right: 1px solid #000;
            padding: 2mm;
          }

          .bottom-right {
            flex: 1;
            padding: 2mm;
          }

          .bottom-label {
            font-size: 7pt;
            margin-bottom: 1mm;
          }

          .bottom-value {
            font-size: 9pt;
            font-weight: bold;
          }

          .footer-section-delivered {
            display: flex;
            // margin-top: 10mm;
            margin-bottom: 2mm;
          }

          /* Footer Section */
          .footer-section {
            display: flex;
            border: 1px solid #000;
            margin-top: auto;
          }

          .footer-left-delivered {
            flex: 1;
            padding: 2mm;
            font-size: 7pt;
          }

          .footer-left {
            flex: 1;
            border-right: 1px solid #000;
            padding: 2mm;
            font-size: 7pt;
          }

          .footer-right {
            flex: 1;
            padding: 2mm;
            font-size: 7pt;
          }
        }
      `}</style>
    </>
  );
};

export default CartonLabelPrinter;