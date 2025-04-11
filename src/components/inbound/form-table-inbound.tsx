// import React, { useState, useRef, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Trash2 } from "lucide-react";
// import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// const masterItems = [
//   { itemCode: "ITM001", itemName: "Laptop Asus ROG", price: 15000000 },
//   { itemCode: "ITM002", itemName: "Mechanical Keyboard", price: 1200000 },
//   { itemCode: "ITM003", itemName: "Gaming Mouse", price: 800000 },
//   { itemCode: "ITM004", itemName: 'Monitor 27"', price: 3500000 },
//   { itemCode: "ITM005", itemName: "USB Hub", price: 250000 },
//   { itemCode: "ITM006", itemName: "Headset Gaming", price: 950000 },
// ];

// const FormTableInbound = () => {
//   const [orderInfo, setOrderInfo] = useState({
//     orderNo: generateOrderNumber(),
//     date: new Date().toISOString().split("T")[0],
//     customerName: "",
//     phone: "",
//     email: "",
//     address: "",
//   });

//   const [rows, setRows] = useState([
//     { id: 1, itemCode: "", itemName: "", price: "", qty: 1, total: 0 },
//   ]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [activeRowId, setActiveRowId] = useState(null);
//   const [selectedIndex, setSelectedIndex] = useState(0);
//   const dropdownRef = useRef(null);

//   function generateOrderNumber() {
//     const date = new Date();
//     const year = date.getFullYear().toString().slice(-2);
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const day = String(date.getDate()).padStart(2, "0");
//     const random = Math.floor(Math.random() * 1000)
//       .toString()
//       .padStart(3, "0");
//     return `ORD${year}${month}${day}${random}`;
//   }

//   const handleOrderInfoChange = (field, value) => {
//     setOrderInfo((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   const addRow = () => {
//     const newRow = {
//       id: rows.length + 1,
//       itemCode: "",
//       itemName: "",
//       price: "",
//       qty: 1,
//       total: 0,
//     };
//     setRows([...rows, newRow]);
//   };

//   const deleteRow = (id) => {
//     setRows(rows.filter((row) => row.id !== id));
//   };

//   const handleItemSelect = (id, itemCode) => {
//     const selectedItem = masterItems.find((item) => item.itemCode === itemCode);

//     setRows(
//       rows.map((row) => {
//         if (row.id === id) {
//           return {
//             ...row,
//             itemCode,
//             itemName: selectedItem ? selectedItem.itemName : "",
//             price: selectedItem ? selectedItem.price : "",
//             total: selectedItem ? selectedItem.price * row.qty : 0,
//           };
//         }
//         return row;
//       })
//     );
//     setActiveRowId(null);
//     setSearchTerm("");
//     setSelectedIndex(0);
//   };

//   const handleQtyChange = (id, qty) => {
//     setRows(
//       rows.map((row) => {
//         if (row.id === id) {
//           const newQty = parseInt(qty) || 0;
//           return {
//             ...row,
//             qty: newQty,
//             total: row.price * newQty,
//           };
//         }
//         return row;
//       })
//     );
//   };

//   const [open, setOpen] = useState(false);



//   const handleSaveOrder = async () => {
//     // Prepare the order data
//     const orderData = {
//       orderInfo,
//       items: rows.filter((row) => row.itemCode), // Only include rows with selected items
//       grandTotal,
//       createdAt: new Date().toISOString(),
//     };

//     // Log the data to console
//     console.log("Order Data:", orderData);
//     window.location.href = `/dashboard`;


//   };

//   const filteredItems = masterItems.filter(
//     (item) =>
//       item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const handleKeyDown = (e, rowId) => {
//     if (!searchTerm) return;

//     switch (e.key) {
//       case "ArrowDown":
//         e.preventDefault();
//         setSelectedIndex((prev) =>
//           prev < filteredItems.length - 1 ? prev + 1 : prev
//         );
//         break;
//       case "ArrowUp":
//         e.preventDefault();
//         setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
//         break;
//       case "Enter":
//         e.preventDefault();
//         if (filteredItems[selectedIndex]) {
//           handleItemSelect(rowId, filteredItems[selectedIndex].itemCode);
//         }
//         break;
//       case "Escape":
//         setActiveRowId(null);
//         setSearchTerm("");
//         setSelectedIndex(0);
//         break;
//     }
//   };

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setActiveRowId(null);
//         setSearchTerm("");
//         setSelectedIndex(0);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);

//   return (
//     <div className="p-4 space-y-6">
//       {/* Header/Order Information */}
//       <div className="grid grid-cols-2 gap-6">
//         <div className="space-y-4">
//           <h2 className="text-xl font-semibold">Order Information</h2>
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Order No
//               </label>
//               <Input
//                 type="text"
//                 value={orderInfo.orderNo}
//                 readOnly
//                 className="bg-gray-50"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Date
//               </label>
//               <Input
//                 type="date"
//                 value={orderInfo.date}
//                 onChange={(e) => handleOrderInfoChange("date", e.target.value)}
//               />
//             </div>
//           </div>
//         </div>

//         {/* Customer Information */}
//         <div className="space-y-4">
//           <h2 className="text-xl font-semibold">Customer Information</h2>
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Customer Name
//               </label>
//               <Input
//                 type="text"
//                 value={orderInfo.customerName}
//                 onChange={(e) =>
//                   handleOrderInfoChange("customerName", e.target.value)
//                 }
//                 placeholder="Enter customer name"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Phone
//               </label>
//               <Input
//                 type="tel"
//                 value={orderInfo.phone}
//                 onChange={(e) => handleOrderInfoChange("phone", e.target.value)}
//                 placeholder="Enter phone number"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Email
//               </label>
//               <Input
//                 type="email"
//                 value={orderInfo.email}
//                 onChange={(e) => handleOrderInfoChange("email", e.target.value)}
//                 placeholder="Enter email address"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Address
//               </label>
//               <Input
//                 type="text"
//                 value={orderInfo.address}
//                 onChange={(e) =>
//                   handleOrderInfoChange("address", e.target.value)
//                 }
//                 placeholder="Enter address"
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Divider */}
//       <div className="border-t border-gray-200"></div>

//       {/* Order Items Table */}
//       <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
//         <table className="w-full text-sm text-left">
//           <thead className="text-xs uppercase bg-gray-100">
//             <tr>
//               <th className="px-6 py-3">Item Code</th>
//               <th className="px-6 py-3">Item Name</th>
//               <th className="px-6 py-3">Price</th>
//               <th className="px-6 py-3 w-24">Qty</th>
//               <th className="px-6 py-3">Total</th>
//               <th className="px-6 py-3 w-12">Action</th>
//             </tr>
//           </thead>
//           <tbody>
//             {rows.map((row) => (
//               <tr key={row.id} className="bg-white border-b hover:bg-gray-50">
//                 <td className="px-6 py-2">
//                   <div className="relative" ref={dropdownRef}>
//                     <Input
//                       type="text"
//                       value={activeRowId === row.id ? searchTerm : row.itemCode}
//                       onChange={(e) => {
//                         setSearchTerm(e.target.value);
//                         setActiveRowId(row.id);
//                         setSelectedIndex(0);
//                       }}
//                       onFocus={() => {
//                         setActiveRowId(row.id);
//                         setSearchTerm("");
//                       }}
//                       onKeyDown={(e) => handleKeyDown(e, row.id)}
//                       placeholder="Search item..."
//                       className="w-full"
//                     />
//                     {activeRowId === row.id && searchTerm && (
//                       <div className="fixed z-50 w-96 bg-white border rounded-md shadow-lg mt-1 max-h-96 overflow-auto">
//                         {filteredItems.map((item, index) => (
//                           <div
//                             key={item.itemCode}
//                             className={`px-4 py-2 cursor-pointer ${
//                               index === selectedIndex
//                                 ? "bg-blue-100"
//                                 : "hover:bg-gray-100"
//                             }`}
//                             onClick={() =>
//                               handleItemSelect(row.id, item.itemCode)
//                             }
//                             onMouseEnter={() => setSelectedIndex(index)}
//                           >
//                             <div className="font-medium">{item.itemCode}</div>
//                             <div className="text-sm text-gray-600">
//                               {item.itemName}
//                             </div>
//                             <div className="text-sm text-gray-500">
//                               Rp {item.price.toLocaleString("id-ID")}
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 </td>
//                 <td className="px-6 py-2">
//                   <Input
//                     type="text"
//                     value={row.itemName}
//                     readOnly
//                     className="w-full bg-gray-50"
//                   />
//                 </td>
//                 <td className="px-6 py-2">
//                   <Input
//                     type="text"
//                     value={
//                       row.price ? `Rp ${row.price.toLocaleString("id-ID")}` : ""
//                     }
//                     readOnly
//                     className="w-full bg-gray-50"
//                   />
//                 </td>
//                 <td className="px-6 py-2">
//                   <Input
//                     type="number"
//                     value={row.qty}
//                     onChange={(e) => handleQtyChange(row.id, e.target.value)}
//                     min="1"
//                     className="w-full"
//                   />
//                 </td>
//                 <td className="px-6 py-2">
//                   <Input
//                     type="text"
//                     value={
//                       row.total ? `Rp ${row.total.toLocaleString("id-ID")}` : ""
//                     }
//                     readOnly
//                     className="w-full bg-gray-50"
//                   />
//                 </td>
//                 <td className="px-6 py-2">
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     onClick={() => deleteRow(row.id)}
//                     disabled={rows.length === 1}
//                     className="h-8 w-8"
//                   >
//                     <Trash2 className="h-4 w-4" />
//                   </Button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//           <tfoot>
//             <tr className="bg-gray-50">
//               <td colSpan="4" className="px-6 py-3 text-right font-semibold">
//                 Grand Total:
//               </td>
//               <td className="px-6 py-3 font-semibold">
//                 Rp {grandTotal.toLocaleString("id-ID")}
//               </td>
//               <td></td>
//             </tr>
//           </tfoot>
//         </table>
//       </div>

//       <div className="flex justify-between items-center">
//         <Button onClick={addRow} className="mt-4">
//           Add Row
//         </Button>
//         <Button
//           onClick={() => setOpen(true)}
//           className="mt-4 bg-green-600 hover:bg-green-700"
//           disabled={
//             !orderInfo.customerName || rows.every((row) => !row.itemCode)
//           }
//         >
//           Save Order
//         </Button>

//         <Dialog open={open} onOpenChange={setOpen}>
//         <DialogContent className="sm:max-w-lg bg-white">
//           <DialogHeader>
//             <DialogTitle>Konfirmasi</DialogTitle>
//           </DialogHeader>
//           <p>Apakah Anda yakin ingin menyimpan order ini?</p>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
//             <Button onClick={handleSaveOrder}>Ya, Simpan</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//       </div>
//     </div>
//   );
// };

// export default FormTableInbound;
