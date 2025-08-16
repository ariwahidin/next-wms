import React from "react";

interface BillItem {
  outbound_no: string;
  item_code: string;
  handling_used: string;
  rate_idr: number;
  qty_handling: number;
  total_price: number;
}

interface BillModalProps {
  show: boolean;
  onClose: () => void;
  billData: BillItem[];
}

const BillModal: React.FC<BillModalProps> = ({ show, onClose, billData }) => {
  if (!show) return null;

  const handlePrint = () => {
    const printContent = document.getElementById("print-area")?.innerHTML;
    if (!printContent) return;

    const win = window.open("", "_blank", "width=800,height=600");
    win!.document.write(`
      <html>
        <head>
          <title>Bill</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; }
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
            th { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    win!.document.close();
    win!.print();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b p-3">
          <h2 className="text-sm font-semibold">Outbound Bill</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 text-[12px]" id="print-area">
          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Outbound No</th>
                <th className="border p-2">Item Code</th>
                <th className="border p-2">Handling Used</th>
                <th className="border p-2">Rate IDR</th>
                <th className="border">Qty Handling</th>
                <th className="border p-2">Total Price</th>
              </tr>
            </thead>
            <tbody>
              {billData && billData.length > 0 ? (
                billData.map((item, index) => (
                  <tr key={index}>
                    <td className="border p-2">{item.outbound_no}</td>
                    <td className="border p-2">{item.item_code}</td>
                    <td className="border p-2">{item.handling_used}</td>
                    <td className="border p-2">
                      {item.rate_idr.toLocaleString()}
                    </td>
                    <td className="border p-2 border p-2 text-right font-bold">{item.qty_handling}</td>
                    <td className="border p-2 border p-2 text-right font-bold">
                      {item.total_price.toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="border p-2 text-center">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="border p-2 text-right font-bold">
                  Grand Total:
                </td>
                <td className="border p-2 text-right font-bold">
                  {billData.reduce(
                    (total, item) => total + item.qty_handling,
                    0
                  ).toLocaleString()}
                </td>
                <td className="border p-2 text-right font-bold">
                  {billData.reduce(
                    (total, item) => total + item.total_price,
                    0
                  ).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t p-3">
          <button
            onClick={onClose}
            className="px-4 py-1 bg-gray-300 hover:bg-gray-400 rounded text-[12px]"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded text-[12px]"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillModal;
// import React from "react";

// interface BillItem {
//   outbound_no: string;
//   item_code: string;
//   handling_used: string;
//   rate_idr: number;
//   qty_handling: number;
//   total_price: number;
// }

// interface BillModalProps {
//   show: boolean;
//   onClose: () => void;
//   billData: BillItem[];
// }

// const BillModal: React.FC<BillModalProps> = ({ show, onClose, billData }) => {
//   if (!show) return null;

//   // Group items by handling_used
//   const groupedData = billData.reduce((acc, item) => {
//     const handling = item.handling_used;
//     if (!acc[handling]) {
//       acc[handling] = [];
//     }
//     acc[handling].push(item);
//     return acc;
//   }, {} as Record<string, BillItem[]>);

//   // Calculate grand total
//   const grandTotal = billData.reduce((sum, item) => sum + item.total_price, 0);

//   const handlePrint = () => {
//     const printContent = document.getElementById("print-area")?.innerHTML;
//     if (!printContent) return;

//     const win = window.open("", "_blank", "width=800,height=600");
//     win!.document.write(`
//       <html>
//         <head>
//           <title>Outbound Bill</title>
//           <style>
//             body { 
//               font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
//               font-size: 12px; 
//               margin: 0;
//               padding: 20px;
//               color: #333;
//             }
//             .bill-header {
//               text-align: center;
//               margin-bottom: 30px;
//               padding-bottom: 15px;
//               border-bottom: 2px solid #2563eb;
//             }
//             .company-name {
//               font-size: 18px;
//               font-weight: bold;
//               color: #1e40af;
//               margin-bottom: 5px;
//             }
//             .bill-title {
//               font-size: 16px;
//               color: #374151;
//               margin-bottom: 10px;
//             }
//             .bill-date {
//               font-size: 12px;
//               color: #6b7280;
//             }
//             table { 
//               border-collapse: collapse; 
//               width: 100%; 
//               font-size: 12px;
//               margin-bottom: 20px;
//             }
//             .group-header {
//               background-color: #f3f4f6;
//               font-weight: bold;
//               color: #374151;
//             }
//             .group-header td {
//               padding: 8px;
//               border: 1px solid #d1d5db;
//               text-transform: uppercase;
//               letter-spacing: 0.5px;
//             }
//             th { 
//               background-color: #2563eb;
//               color: white;
//               padding: 10px 8px;
//               text-align: left;
//               font-weight: 600;
//               border: 1px solid #1d4ed8;
//             }
//             td { 
//               border: 1px solid #e5e7eb; 
//               padding: 8px; 
//               text-align: left;
//             }
//             .number-cell {
//               text-align: right;
//             }
//             .subtotal-row {
//               background-color: #f9fafb;
//               font-weight: bold;
//             }
//             .grand-total {
//               background-color: #2563eb;
//               color: white;
//               font-weight: bold;
//               font-size: 14px;
//             }
//             @media print {
//               body { margin: 0; }
//             }
//           </style>
//         </head>
//         <body>
//           ${printContent}
//         </body>
//       </html>
//     `);
//     win!.document.close();
//     win!.print();
//   };

//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//       <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
//         {/* Header */}
//         <div className="flex justify-between items-center border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
//           <h2 className="text-lg font-semibold">Outbound Bill</h2>
//           <button
//             onClick={onClose}
//             className="text-white hover:text-gray-200 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
//           >
//             ×
//           </button>
//         </div>

//         {/* Body */}
//         <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
//           <div className="p-6 text-[12px]" id="print-area">
//             {/* Bill Header */}
//             <div className="text-center mb-8 pb-4 border-b-2 border-blue-600">
//               <div className="text-lg font-bold text-blue-800 mb-1">PT. COMPANY NAME</div>
//               <div className="text-base text-gray-700 mb-2">OUTBOUND BILL</div>
//               <div className="text-[12px] text-gray-500">
//                 Date: {new Date().toLocaleDateString('id-ID', { 
//                   year: 'numeric', 
//                   month: 'long', 
//                   day: 'numeric' 
//                 })}
//               </div>
//             </div>

//             {billData && billData.length > 0 ? (
//               <>
//                 <table className="w-full border border-gray-300">
//                   <thead>
//                     <tr className="bg-blue-600 text-white">
//                       <th className="border border-blue-700 p-3">Outbound No</th>
//                       <th className="border border-blue-700 p-3">Item Code</th>
//                       <th className="border border-blue-700 p-3 text-right">Rate IDR</th>
//                       <th className="border border-blue-700 p-3 text-right">Qty</th>
//                       <th className="border border-blue-700 p-3 text-right">Total Price</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {Object.entries(groupedData).map(([handling, items]) => {
//                       const handlingTotal = items.reduce((sum, item) => sum + item.total_price, 0);
                      
//                       return (
//                         <React.Fragment key={handling}>
//                           {/* Group Header */}
//                           <tr className="bg-gray-100">
//                             <td colSpan={5} className="border p-3 font-bold text-gray-700 uppercase tracking-wide">
//                               {handling} ({items.length} items)
//                             </td>
//                           </tr>
                          
//                           {/* Group Items */}
//                           {items.map((item, index) => (
//                             <tr key={`${handling}-${index}`} className="hover:bg-gray-50">
//                               <td className="border p-2">{item.outbound_no}</td>
//                               <td className="border p-2">{item.item_code}</td>
//                               <td className="border p-2 text-right">
//                                 {item.rate_idr.toLocaleString('id-ID')}
//                               </td>
//                               <td className="border p-2 text-right">
//                                 {item.qty_handling.toLocaleString('id-ID')}
//                               </td>
//                               <td className="border p-2 text-right">
//                                 {item.total_price.toLocaleString('id-ID')}
//                               </td>
//                             </tr>
//                           ))}
                          
//                           {/* Subtotal for handling group */}
//                           <tr className="bg-gray-50">
//                             <td colSpan={4} className="border p-2 text-right font-semibold text-gray-700">
//                               Subtotal {handling}:
//                             </td>
//                             <td className="border p-2 text-right font-bold">
//                               {handlingTotal.toLocaleString('id-ID')}
//                             </td>
//                           </tr>
//                         </React.Fragment>
//                       );
//                     })}
                    
//                     {/* Grand Total Row */}
//                     <tr className="bg-blue-600 text-white">
//                       <td colSpan={4} className="border border-blue-700 p-3 text-right font-bold text-sm">
//                         GRAND TOTAL:
//                       </td>
//                       <td className="border border-blue-700 p-3 text-right font-bold text-sm">
//                         {grandTotal.toLocaleString('id-ID')}
//                       </td>
//                     </tr>
//                   </tbody>
//                 </table>

//                 {/* Summary Info */}
//                 <div className="mt-6 pt-4 border-t border-gray-200 text-[11px] text-gray-600">
//                   <div className="flex justify-between">
//                     <div>Total Items: {billData.length}</div>
//                     <div>Total Handling Types: {Object.keys(groupedData).length}</div>
//                   </div>
//                 </div>
//               </>
//             ) : (
//               <div className="text-center py-12">
//                 <div className="text-gray-500">No data available</div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="flex justify-end gap-3 border-t bg-gray-50 p-4">
//           <button
//             onClick={onClose}
//             className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-md text-[12px] font-medium transition-colors"
//           >
//             Close
//           </button>
//           <button
//             onClick={handlePrint}
//             className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-[12px] font-medium transition-colors"
//           >
//             Print
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BillModal;