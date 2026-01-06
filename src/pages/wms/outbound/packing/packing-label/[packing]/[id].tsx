/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Package, MapPin, Calendar, User, Hash, Barcode, Box } from 'lucide-react';
import { useRouter } from 'next/router';
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
                    total_quantity: 0
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
                    barcode_scan: item.barcode_scan
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
            setTimeout(() => {
                window.print();
            }, 1500);
        }
    })

    return (
        <>
            {/* Screen View - Control Panel */}

            {/* <Layout title="Outbound" subTitle="Packing Order"> */}
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
            {/* </Layout> */}

            {/* Print View - Labels */}
            <div ref={printRef} className="print-only">
                {groupedCartons.map((carton, index) => (
                    <div key={carton.pack_ctn_no} className="label-container">
                        <div className="label-page">
                            {/* Header with Logo Area and Carton Number */}
                            <div className="label-header">
                                <div className="header-left">
                                    <div className="company-logo">
                                        <Package size={32} strokeWidth={2} />
                                    </div>
                                    <div className="header-title">
                                        <div className="title-main">PACKING LABEL</div>
                                        <div className="title-sub">Carton Identification</div>
                                    </div>
                                </div>
                                <div className="carton-badge">
                                    <div className="badge-label">CARTON</div>
                                    <div className="badge-number">{carton.pack_ctn_no} / {totalCartons}</div>
                                </div>
                                {/* <div className="badge-number">Ctn : {carton.pack_ctn_no} / {totalCartons}</div> */}
                            </div>

                            {/* Main Content Grid */}
                            <div className="label-body">
                                {/* Left Section - Order Details */}
                                <div className="section-left">
                                    <div className="info-block">
                                        <div className="block-title">ORDER INFORMATION</div>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <span className="item-label">Packing No</span>
                                                <span className="item-value">{carton.packing_no}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="item-label">Outbound No</span>
                                                <span className="item-value">{carton.outbound_no}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="item-label">Shipment ID</span>
                                                <span className="item-value">{carton.shipment_id}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="info-block">
                                        <div className="block-title">CUSTOMER DETAILS</div>
                                        <div className="customer-name">{carton.customer_name}</div>
                                        <div className="customer-address">
                                            {carton.deliv_address}
                                            <br />
                                            {carton.deliv_city}
                                        </div>
                                    </div>

                                    <div className="info-block">
                                        <div className="block-title">SHIPPING INFORMATION</div>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <span className="item-label">Transporter</span>
                                                <span className="item-value">{carton.transporter_code}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="item-label">Pickup Date</span>
                                                <span className="item-value">{formatDate(carton.plan_pickup_date)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Section - Contents */}
                                <div className="section-right">
                                    <div className="contents-block">
                                        <div className="contents-header">
                                            <div className="contents-title">CARTON CONTENTS</div>
                                            <div className="contents-summary">
                                                {carton.total_items} SKU | {carton.total_quantity} Total Units
                                            </div>
                                        </div>

                                        <table className="contents-table">
                                            <thead>
                                                <tr>
                                                    <th className="th-no">No</th>
                                                    <th className="th-code">Item Code</th>
                                                    <th className="th-desc">Description</th>
                                                    <th className="th-qty">Qty</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {carton.items.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="td-no">{idx + 1}</td>
                                                        <td className="td-code">{item.item_code}</td>
                                                        <td className="td-desc">{item.item_name}</td>
                                                        <td className="td-qty">{item.quantity}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <td colSpan={3} className="tf-label">TOTAL</td>
                                                    <td className="tf-total">{carton.total_quantity}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="label-footer">
                                <div className="footer-note">
                                    Please verify contents before accepting delivery | Handle with care
                                </div>
                                <div className="footer-date">
                                    Printed: {new Date().toLocaleString('id-ID')}
                                </div>
                            </div>
                        </div>
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
            size: A4 portrait;
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

          .label-container {
            width: 210mm;
            // height: 297mm;
            // page-break-after: always;
            position: relative;
            background: white;
          }

          .label-container:last-child {
            page-break-after: auto;
          }

          .label-page {
            width: 270mm;
            height: 150mm;
            // position: absolute;
            // top: 50%;
            // left: 50%;
            // transform: translate(-50%, -50%) rotate(90deg);
            transform-origin: center center;
            border: 3px solid #1a1a1a;
            box-sizing: border-box;
            background: white;
            padding: 8mm;
            font-family: 'Segoe UI', Arial, sans-serif;
          }

          .label-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 5mm;
            border-bottom: 3px solid #1a1a1a;
            margin-bottom: 5mm;
          }

          .header-left {
            display: flex;
            align-items: center;
            gap: 4mm;
          }

          .company-logo {
            width: 16mm;
            height: 16mm;
            background: #1a1a1a;
            border-radius: 2mm;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }

          .header-title {
            display: flex;
            flex-direction: column;
          }

          .title-main {
            font-size: 18pt;
            font-weight: 700;
            letter-spacing: 1px;
            color: #1a1a1a;
          }

          .title-sub {
            font-size: 9pt;
            color: #666;
            font-weight: 500;
            margin-top: 1mm;
          }

          .carton-badge {
            // background: #1a1a1a;
            color: black;
            padding: 3mm 6mm;
            border-radius: 2mm;
            text-align: center;
          }

          .badge-label {
            font-size: 8pt;
            font-weight: 600;
            letter-spacing: 1px;
            margin-bottom: 1mm;
          }

          .badge-number {
            font-size: 20pt;
            font-weight: 700;
            letter-spacing: 0.5px;
          }

          .label-body {
            display: flex;
            gap: 6mm;
            margin-bottom: 5mm;
          }

          .section-left {
            width: 85mm;
            display: flex;
            flex-direction: column;
            gap: 4mm;
          }

          .section-right {
            flex: 1;
          }

          .info-block {
            background: #f8f9fa;
            border: 2px solid #e0e0e0;
            border-radius: 2mm;
            padding: 3mm;
          }

          .block-title {
            font-size: 8pt;
            font-weight: 700;
            color: #1a1a1a;
            letter-spacing: 0.5px;
            margin-bottom: 2mm;
            padding-bottom: 2mm;
            border-bottom: 2px solid #1a1a1a;
          }

          .info-grid {
            display: flex;
            flex-direction: column;
            gap: 2mm;
          }

          .info-item {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
          }

          .item-label {
            font-size: 8pt;
            color: #666;
            font-weight: 600;
          }

          .item-value {
            font-size: 9pt;
            font-weight: 700;
            color: #1a1a1a;
          }

          .customer-name {
            font-size: 11pt;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 2mm;
          }

          .customer-address {
            font-size: 9pt;
            color: #333;
            line-height: 1.4;
          }

          .contents-block {
            background: white;
            border: 2px solid #1a1a1a;
            border-radius: 2mm;
            height: 100%;
            display: flex;
            flex-direction: column;
          }

          .contents-header {
            // background: #1a1a1a;
            color: black;
            padding: 3mm 4mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .contents-title {
            font-size: 10pt;
            font-weight: 700;
            letter-spacing: 0.5px;
          }

          .contents-summary {
            font-size: 9pt;
            font-weight: 600;
            opacity: 0.9;
          }

          .contents-table {
            width: 100%;
            border-collapse: collapse;
          }

          .contents-table thead {
            background: #f0f0f0;
          }

          .contents-table th {
            padding: 2mm 3mm;
            text-align: left;
            font-size: 8pt;
            font-weight: 700;
            border-bottom: 2px solid #1a1a1a;
            color: #1a1a1a;
          }

          .th-no {
            width: 10mm;
            text-align: center;
          }

          .th-code {
            width: 30mm;
          }

          .th-desc {
            width: auto;
          }

          .th-qty {
            width: 20mm;
            text-align: right;
          }

          .contents-table td {
            padding: 2mm 3mm;
            font-size: 9pt;
            border-bottom: 1px solid #e0e0e0;
          }

          .td-no {
            text-align: center;
            font-weight: 600;
            color: #666;
          }

          .td-code {
            font-family: 'Courier New', monospace;
            font-weight: 600;
            color: #1a1a1a;
          }

          .td-desc {
            color: #333;
          }

          .td-qty {
            text-align: right;
            font-weight: 700;
            color: #1a1a1a;
          }

          .contents-table tfoot {
            background: #f8f9fa;
            border-top: 3px solid #1a1a1a;
          }

          .contents-table tfoot td {
            padding: 3mm;
            font-weight: 700;
            border-bottom: none;
          }

          .tf-label {
            text-align: right;
            font-size: 10pt;
            color: #1a1a1a;
          }

          .tf-total {
            text-align: right;
            font-size: 12pt;
            color: #1a1a1a;
          }

          .label-footer {
            border-top: 2px solid #e0e0e0;
            padding-top: 3mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .footer-note {
            font-size: 7pt;
            color: #666;
            font-style: italic;
          }

          .footer-date {
            font-size: 7pt;
            color: #999;
          }
        }
      `}</style>
        </>
    );
};

export default CartonLabelPrinter;


// import React, { useRef, useMemo, useEffect, useState } from 'react';
// import { Package, MapPin, Calendar, User, Hash, Barcode, Box } from 'lucide-react';
// import { useRouter } from 'next/router';
// import api from '@/lib/api';
// import Layout from '@/components/layout';

// interface PackingItem {
//     packing_no: string;
//     packing_date: string;
//     cust_address: string;
//     cust_city: string;
//     deliv_to: string;
//     deliv_address: string;
//     deliv_city: string;
//     customer_name: string;
//     deliv_to_name: string;
//     outbound_no: string;
//     shipment_id: string;
//     item_code: string;
//     item_name: string;
//     quantity: number;
//     pack_ctn_no: string;
//     barcode_scan: string;
//     plan_pickup_date: string;
//     transporter_code: string;
// }

// interface GroupedCarton {
//     pack_ctn_no: string;
//     packing_no: string;
//     packing_date: string;
//     cust_address: string;
//     cust_city: string;
//     deliv_to: string;
//     deliv_address: string;
//     deliv_city: string;
//     customer_name: string;
//     deliv_to_name: string;
//     outbound_no: string;
//     shipment_id: string;
//     plan_pickup_date: string;
//     transporter_code: string;
//     items: Array<{
//         item_code: string;
//         item_name: string;
//         quantity: number;
//         barcode_scan: string;
//     }>;
//     total_items: number;
//     total_quantity: number;
// }

// const CartonLabelPrinter: React.FC = () => {
//     const router = useRouter();
//     const { packing, id } = router.query;
//     const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
//     const [selectedCartons, setSelectedCartons] = useState<Set<string>>(new Set());
//     const printRef = useRef<HTMLDivElement>(null);

//     useEffect(() => {
//         if (packing && id) {
//             console.log("packing : ", packing);
//             console.log("id : ", id);
//             fetchData(id as string);
//         }
//     }, [packing, id]);

//     const fetchData = async (id: string) => {
//         const res = await api.get(`/outbound/${id}/packing/${packing}`, {
//             withCredentials: true,
//         });
//         setPackingItems(res.data.data.list);
//     };

//     // Group items by pack_ctn_no and sum quantities for duplicate items
//     const groupedCartons = useMemo(() => {
//         const grouped = new Map<string, GroupedCarton>();

//         packingItems.forEach(item => {
//             if (!grouped.has(item.pack_ctn_no)) {
//                 grouped.set(item.pack_ctn_no, {
//                     pack_ctn_no: item.pack_ctn_no,
//                     packing_no: item.packing_no,
//                     packing_date: item.packing_date,
//                     cust_address: item.cust_address,
//                     cust_city: item.cust_city,
//                     deliv_to: item.deliv_to,
//                     deliv_address: item.deliv_address,
//                     deliv_city: item.deliv_city,
//                     customer_name: item.customer_name,
//                     deliv_to_name: item.deliv_to_name,
//                     outbound_no: item.outbound_no,
//                     shipment_id: item.shipment_id,
//                     plan_pickup_date: item.plan_pickup_date,
//                     transporter_code: item.transporter_code,
//                     items: [],
//                     total_items: 0,
//                     total_quantity: 0
//                 });
//             }

//             const carton = grouped.get(item.pack_ctn_no)!;

//             // Check if item already exists, if yes, sum the quantity
//             const existingItem = carton.items.find(i => i.item_code === item.item_code);
//             if (existingItem) {
//                 existingItem.quantity += item.quantity;
//             } else {
//                 carton.items.push({
//                     item_code: item.item_code,
//                     item_name: item.item_name,
//                     quantity: item.quantity,
//                     barcode_scan: item.barcode_scan
//                 });
//             }
//             carton.total_quantity += item.quantity;
//         });

//         // Calculate total items and sort
//         grouped.forEach(carton => {
//             carton.total_items = carton.items.length;
//         });

//         return Array.from(grouped.values()).sort((a, b) =>
//             parseInt(a.pack_ctn_no) - parseInt(b.pack_ctn_no)
//         );
//     }, [packingItems]);

//     // Initialize selectedCartons when groupedCartons changes
//     useEffect(() => {
//         if (groupedCartons.length > 0 && selectedCartons.size === 0) {
//             setSelectedCartons(new Set(groupedCartons.map(c => c.pack_ctn_no)));
//         }
//     }, [groupedCartons]);

//     const toggleCartonSelection = (cartonNo: string) => {
//         const newSelection = new Set(selectedCartons);
//         if (newSelection.has(cartonNo)) {
//             newSelection.delete(cartonNo);
//         } else {
//             newSelection.add(cartonNo);
//         }
//         setSelectedCartons(newSelection);
//     };

//     const toggleSelectAll = () => {
//         if (selectedCartons.size === groupedCartons.length) {
//             setSelectedCartons(new Set());
//         } else {
//             setSelectedCartons(new Set(groupedCartons.map(c => c.pack_ctn_no)));
//         }
//     };

//     const filteredCartons = groupedCartons.filter(carton =>
//         selectedCartons.has(carton.pack_ctn_no)
//     );

//     const formatDate = (dateString: string) => {
//         const date = new Date(dateString);
//         return date.toLocaleDateString('id-ID', {
//             day: '2-digit',
//             month: 'short',
//             year: 'numeric'
//         });
//     };

//     const handlePrint = () => {
//         window.print();
//     };

//     const totalCartons = groupedCartons.length;

//     useEffect(() => {
//         if (groupedCartons.length > 0 && filteredCartons.length > 0 && selectedCartons.size > 0) {
//             setTimeout(() => {
//                 window.print();
//             }, 1500);
//         }
//     }, [filteredCartons])

//     return (
//         <>
//             {/* Screen View - Control Panel */}
//             <div className="screen-only p-6 bg-gray-50 min-h-screen">
//                 <div className="max-w-4xl mx-auto">
//                     <div className="bg-white rounded-lg shadow-lg p-6">
//                         <div className="flex items-center justify-between mb-6">
//                             <div>
//                                 <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
//                                     <Package className="w-8 h-8 text-blue-600" />
//                                     Carton Label Generator
//                                 </h1>
//                                 <p className="text-gray-600 mt-2">
//                                     {selectedCartons.size} dari {totalCartons} carton dipilih • {packingItems.length} total items
//                                 </p>
//                             </div>
//                             <button
//                                 onClick={handlePrint}
//                                 disabled={selectedCartons.size === 0}
//                                 className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors flex items-center gap-2"
//                             >
//                                 <Package className="w-5 h-5" />
//                                 Print {selectedCartons.size} Label{selectedCartons.size !== 1 ? 's' : ''}
//                             </button>
//                         </div>

//                         {/* Carton Selection */}
//                         <div className="border-t pt-4">
//                             <div className="flex items-center justify-between mb-4">
//                                 <h2 className="text-lg font-semibold text-gray-800">Pilih Carton untuk Print</h2>
//                                 <button
//                                     onClick={toggleSelectAll}
//                                     className="text-sm text-blue-600 hover:text-blue-700 font-medium"
//                                 >
//                                     {selectedCartons.size === groupedCartons.length ? 'Deselect All' : 'Select All'}
//                                 </button>
//                             </div>
//                             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                                 {groupedCartons.map(carton => (
//                                     <label
//                                         key={carton.pack_ctn_no}
//                                         className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${selectedCartons.has(carton.pack_ctn_no)
//                                                 ? 'border-blue-600 bg-blue-50'
//                                                 : 'border-gray-200 hover:border-gray-300'
//                                             }`}
//                                     >
//                                         <input
//                                             type="checkbox"
//                                             checked={selectedCartons.has(carton.pack_ctn_no)}
//                                             onChange={() => toggleCartonSelection(carton.pack_ctn_no)}
//                                             className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
//                                         />
//                                         <div className="flex-1">
//                                             <div className="font-semibold text-gray-800">Carton {carton.pack_ctn_no}</div>
//                                             <div className="text-xs text-gray-600">{carton.total_items} items</div>
//                                         </div>
//                                     </label>
//                                 ))}
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Print View - Labels */}
//             <div ref={printRef} className="print-only">
//                 {filteredCartons.map((carton, index) => (
//                     <div
//                         key={carton.pack_ctn_no}
//                         className="label-page"
//                         style={{ pageBreakAfter: 'always' }}
//                     >
//                         {/* Header with Logo Area and Carton Number */}
//                         <div className="flex justify-between items-start mb-4 pb-3 border-b-2 border-gray-800">
//                             <div className="flex items-center gap-3">
//                                 <div className="w-16 h-16 border-2 border-gray-300 rounded flex items-center justify-center bg-gray-50">
//                                     <Package className="w-10 h-10 text-gray-400" />
//                                 </div>
//                                 <div>
//                                     <div className="text-2xl font-bold text-gray-800">PACKING LABEL</div>
//                                     <div className="text-sm text-gray-600 mt-1">Carton Identification</div>
//                                 </div>
//                             </div>
//                             <div className="text-right bg-blue-600 text-white px-6 py-3 rounded-lg">
//                                 <div className="text-xs font-semibold mb-1">CARTON</div>
//                                 <div className="text-3xl font-bold leading-none">
//                                     {carton.pack_ctn_no} / {totalCartons}
//                                 </div>
//                             </div>
//                             {/*
//               <div className="text-right">
//                 <div className="text-xs text-gray-500 mb-1">CARTON NUMBER</div>
//                 <div className="text-4xl font-bold text-blue-600">
//                   Ctn : {carton.pack_ctn_no} / {totalCartons}
//                 </div>
//               </div>
//               */}
//                         </div>

//                         {/* Main Content Grid */}
//                         <div className="grid grid-cols-2 gap-6 mb-4">
//                             {/* Left Section - Order Details */}
//                             <div className="space-y-4">
//                                 <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
//                                     <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
//                                         <Hash className="w-4 h-4" />
//                                         ORDER INFORMATION
//                                     </h3>
//                                     <div className="space-y-2">
//                                         <div className="flex justify-between text-sm">
//                                             <span className="text-gray-600">Packing No</span>
//                                             <span className="font-semibold text-gray-800">{carton.packing_no}</span>
//                                         </div>
//                                         <div className="flex justify-between text-sm">
//                                             <span className="text-gray-600">Outbound No</span>
//                                             <span className="font-semibold text-gray-800">{carton.outbound_no}</span>
//                                         </div>
//                                         <div className="flex justify-between text-sm">
//                                             <span className="text-gray-600">Shipment ID</span>
//                                             <span className="font-semibold text-gray-800">{carton.shipment_id}</span>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
//                                     <h3 className="text-xs font-bold text-blue-700 uppercase mb-3 flex items-center gap-2">
//                                         <User className="w-4 h-4" />
//                                         CUSTOMER DETAILS
//                                     </h3>
//                                     <div className="text-sm">
//                                         <div className="font-bold text-gray-800 mb-2">{carton.customer_name}</div>
//                                         <div className="text-gray-600 flex items-start gap-2">
//                                             <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
//                                             <span>{carton.deliv_address} {carton.deliv_city}</span>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 <div className="bg-green-50 p-4 rounded-lg border border-green-200">
//                                     <h3 className="text-xs font-bold text-green-700 uppercase mb-3 flex items-center gap-2">
//                                         <Calendar className="w-4 h-4" />
//                                         SHIPPING INFORMATION
//                                     </h3>
//                                     <div className="space-y-2">
//                                         <div className="flex justify-between text-sm">
//                                             <span className="text-gray-600">Transporter</span>
//                                             <span className="font-semibold text-gray-800">{carton.transporter_code}</span>
//                                         </div>
//                                         <div className="flex justify-between text-sm">
//                                             <span className="text-gray-600">Pickup Date</span>
//                                             <span className="font-semibold text-gray-800">{formatDate(carton.plan_pickup_date)}</span>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* Right Section - Contents */}
//                             <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
//                                 <h3 className="text-xs font-bold text-gray-700 uppercase mb-3 flex items-center justify-between">
//                                     <span className="flex items-center gap-2">
//                                         <Box className="w-4 h-4" />
//                                         CARTON CONTENTS
//                                     </span>
//                                     <span className="text-blue-600">
//                                         {carton.total_items} SKU | {carton.total_quantity} Total Units
//                                     </span>
//                                 </h3>
//                                 <div className="border border-gray-300 rounded overflow-hidden">
//                                     <table className="w-full text-xs">
//                                         <thead className="bg-gray-100">
//                                             <tr>
//                                                 <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b border-gray-300 w-8">No</th>
//                                                 <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">Item Code</th>
//                                                 <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">Description</th>
//                                                 <th className="px-2 py-2 text-right font-semibold text-gray-700 border-b border-gray-300 w-16">Qty</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {carton.items.map((item, idx) => (
//                                                 <tr key={idx} className="border-b border-gray-200 last:border-0 hover:bg-gray-50">
//                                                     <td className="px-2 py-2 text-gray-600">{idx + 1}</td>
//                                                     <td className="px-2 py-2 font-mono text-gray-800">{item.item_code}</td>
//                                                     <td className="px-2 py-2 text-gray-700">{item.item_name}</td>
//                                                     <td className="px-2 py-2 text-right font-semibold text-gray-800">{item.quantity}</td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                         <tfoot className="bg-gray-800 text-white font-bold">
//                                             <tr>
//                                                 <td colSpan={3} className="px-2 py-2 text-right">TOTAL</td>
//                                                 <td className="px-2 py-2 text-right">{carton.total_quantity}</td>
//                                             </tr>
//                                         </tfoot>
//                                     </table>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Footer */}
//                         <div className="mt-4 pt-3 border-t border-gray-300 text-xs text-gray-600">
//                             <div className="flex justify-between items-center">
//                                 <span>⚠️ Please verify contents before accepting delivery | Handle with care</span>
//                                 <span>Printed: {new Date().toLocaleString('id-ID')}</span>
//                             </div>
//                         </div>
//                     </div>
//                 ))}
//             </div>

//             {/* Print Styles */}
//             <style jsx>{`
//         @media screen {
//           .print-only {
//             display: none;
//           }
//         }

//         @media print {
//           .screen-only {
//             display: none !important;
//           }

//           .print-only {
//             display: block;
//           }

//           .label-page {
//             width: 210mm;
//             height: 297mm;
//             padding: 15mm;
//             margin: 0;
//             box-sizing: border-box;
//           }

//           body {
//             margin: 0;
//             padding: 0;
//           }

//           * {
//             -webkit-print-color-adjust: exact !important;
//             print-color-adjust: exact !important;
//           }
//         }
//       `}</style>
//         </>
//     );
// };

// export default CartonLabelPrinter;