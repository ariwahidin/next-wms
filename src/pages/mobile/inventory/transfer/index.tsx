// /* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useRouter } from "next/router";
// import { useEffect, useState } from "react";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import PageHeader from "@/components/mobile/PageHeader";

// import { Check, CheckCheck, Loader2, Search, X } from "lucide-react";
// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { XCircle } from "lucide-react"; // untuk icon clear
// import api from "@/lib/api";
// import eventBus from "@/utils/eventBus";
// import { Label } from "@radix-ui/react-dropdown-menu";
// import { InventoryPolicy } from "@/types/inventory";

// interface ScannedItem {
//   id?: number;
//   inbound_no: string;
//   inbound_id: number;
//   inbound_detail_id: number;
//   barcode: string;
//   serial_number: string;
//   serial_number_2?: string;
//   pallet: string;
//   location: string;
//   qa_status: string;
//   whs_code: string;
//   scan_type: string;
//   quantity: number;
//   status?: string;
//   rec_date?: string;
//   prod_date?: string;
//   exp_date?: string;
//   lot_number?: string;
//   uom?: string;
//   qty_display?: number;
//   ean_display?: string;
//   uom_display?: string;
//   owner_code?: string;
// }

// const TransferPage = () => {
//   const router = useRouter();
//   const { inbound } = router.query;

//   const [scanLocation, setScanLocation] = useState("");
//   const [scanLocation2, setScanLocation2] = useState("");
//   const [qtyTransfer, setQtyTransfer] = useState(0);
//   const [eanTransfer, setEanTransfer] = useState("");
//   const [uomTransfer, setUomTransfer] = useState("");

//   const [scanBarcode, setScanBarcode] = useState("");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [showConfirmModalMoveTo, setShowConfirmModalMoveTo] = useState(false);
//   const [showConfirmModal, setShowConfirmModal] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [invPolicy, setInvPolicy] = useState<InventoryPolicy>();
//   const [itemSelected, setItemSelected] = useState<ScannedItem | null>(null);
//   const [listInboundScanned, setListInboundScanned] = useState<ScannedItem[]>(
//     []
//   );
//   const [isSubmit, setIsSubmit] = useState(false);

//   const [showForm, setShowForm] = useState(true);

//   const fetchPolicy = async (owner: string) => {
//     try {
//       const response = await api.get("/inventory/policy?owner=" + owner);
//       const data = await response.data;
//       if (data.success) {
//         setInvPolicy(data.data.inventory_policy);
//       }
//     } catch (error) {
//       console.error("Error fetching data:", error);
//     }
//   };

//   useEffect(() => {
//     if (listInboundScanned.length > 0) fetchPolicy(listInboundScanned[0].owner_code);
//   }, [listInboundScanned]);

//   const handleSearch = async () => {
//     setLoading(true);

//     try {
//       const response = await api.post(
//         "/mobile/inventory/location/barcode",
//         {
//           location: scanLocation,
//           barcode: scanBarcode,
//         },
//         {
//           withCredentials: true,
//         }
//       );
//       const data = await response.data;
//       if (data.success) {
//         const filtered = data.data.map((item: any) => ({
//           id: item.ID,
//           inbound_no: inbound,
//           inbound_id: item.inbound_id,
//           inbound_detail_id: item.inbound_detail_id,
//           barcode: item.barcode,
//           serial_number: item.serial_number,
//           serial_number_2: item.serial_number_2,
//           pallet: item.pallet,
//           location: item.location,
//           qa_status: item.qa_status,
//           whs_code: item.whs_code,
//           scan_type: item.scan_type,
//           quantity: item.qty_available,
//           status: item.status,
//           rec_date: item.rec_date,
//           prod_date: item.prod_date,
//           exp_date: item.exp_date,
//           lot_number: item.lot_number,
//           uom: item.uom,
//           qty_display: item.qty_display,
//           ean_display: item.ean_display,
//           uom_display: item.uom_display,
//           owner_code: item.owner_code
//         }));

//         if (filtered.length === 0) {
//           // eventBus.emit("showAlert", {
//           //   title: "Not Found",
//           //   description: "Item Not Found",
//           //   type: "error",
//           // });
//           setListInboundScanned([]);
//           return;
//         }
//         setShowForm(false);
//         setListInboundScanned(filtered);
//       }
//     } catch (error) {
//       console.error("Error fetching data:", error);
//     } finally {
//       setTimeout(() => {
//         setLoading(false);
//       }, 1000); // Simulate a delay of 1 second
//     }
//   };

//   const handleConfirmTransfer = async () => {
//     console.log("List Inbound Scanned:", listInboundScanned);

//     const dataToPost = {
//       from_location: scanLocation,
//       to_location: scanLocation2,
//       list_inventory: listInboundScanned,
//     };

//     console.log("Data to Post:", dataToPost);
//     setIsSubmit(true);
//     // return;

//     try {
//       const response = await api.post(
//         "/mobile/inventory/transfer/location/barcode",
//         dataToPost,
//         {
//           withCredentials: true,
//         }
//       );

//       const data = await response.data;

//       if (data.success) {
//         setShowConfirmModal(false);
//         setListInboundScanned([]);
//         setScanLocation2("");
//         setShowForm(true);
//         eventBus.emit("showAlert", {
//           title: "Success!",
//           description: data.message,
//           type: "success",
//         });

//         // handleSearch();
//       }
//     } catch (error) {
//       console.error("Error fetching data:", error);
//     } finally {
//       setTimeout(() => {
//         setIsSubmit(false);
//       }, 1500);
//     }
//   };

//   const filteredScannedItems =
//     listInboundScanned.filter(
//       (item) =>
//         item?.id.toString().includes(searchTerm.toLowerCase()) ||
//         item?.inbound_detail_id.toString().includes(searchTerm.toLowerCase()) ||
//         item?.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         item?.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         item?.location.toLowerCase().includes(searchTerm.toLowerCase())
//     ) || [];

//   const moveItemToLocation = async () => {
//     const dataToPost = {
//       from_location: scanLocation,
//       to_location: scanLocation2,
//       qty_transfer: qtyTransfer,
//       ean_transfer: eanTransfer,
//       uom_transfer: uomTransfer,
//       inventory_id: itemSelected?.id,
//       list_inventory: [itemSelected],
//     };

//     if (qtyTransfer <= 0) {
//       eventBus.emit("showAlert", {
//         title: "Error!",
//         description: "Qty transfer must be greater than 0",
//         type: "error",
//       });
//       return;
//     }

//     if (qtyTransfer > itemSelected?.quantity) {
//       eventBus.emit("showAlert", {
//         title: "Error!",
//         description: "Qty transfer must be less than available qty",
//         type: "error",
//       });
//       return;
//     }

//     if (scanLocation2.trim() === "") {
//       eventBus.emit("showAlert", {
//         title: "Error!",
//         description: "Destination location cannot be empty",
//         type: "error",
//       });
//       return;
//     }

//     console.log("Data to Post:", dataToPost);
//     setIsSubmit(true);
//     // return;

//     try {
//       const response = await api.post(
//         "/mobile/inventory/transfer-by-inventory-id",
//         dataToPost,
//         {
//           withCredentials: true,
//         }
//       );

//       const data = await response.data;

//       if (data.success) {
//         eventBus.emit("showAlert", {
//           title: "Success!",
//           description: data.message,
//           type: "success",
//         });
//         setShowConfirmModalMoveTo(false);
//         setScanLocation2("");
//         setListInboundScanned([]);
//         setShowForm(true);
//         // handleSearch();
//       } else {
//         console.error("Transfer failed:", data.message);
//       }
//     } catch (error) {
//       console.error("Error during transfer:", error);
//     } finally {
//       setTimeout(() => {
//         setIsSubmit(false);
//       }, 1500);
//     }
//   };

//   useEffect(() => {
//     console.log("Data terbaru:", listInboundScanned);
//   }, [listInboundScanned]);

//   useEffect(() => {
//     if (showConfirmModalMoveTo) {
//       setTimeout(() => {
//         document.getElementById("locationTransfer")?.focus();
//       }, 100); // delay kecil supaya nunggu dialog benar-benar render
//     }
//   }, [showConfirmModalMoveTo]);

//   return (
//     <>
//       <PageHeader title={`Internal Transfer`} showBackButton />
//       <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-24 max-w-md mx-auto">

//         {showForm && (

//           <Card>
//             <CardContent className="p-4 space-y-3">
//               <div>
//                 <Label className="mb-1 font-semibold text-gray-700 text-sm">
//                   Origin Location :
//                 </Label>
//                 <div className="relative">
//                   <Input
//                     id="location"
//                     placeholder="Entry origin location..."
//                     value={scanLocation}
//                     onChange={(e) => setScanLocation(e.target.value)}
//                   />
//                   {scanLocation && (
//                     <button
//                       type="button"
//                       className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                       onClick={() => {
//                         setScanLocation("");
//                         setListInboundScanned([]);
//                         document.getElementById("location")?.focus();
//                       }}
//                     >
//                       <XCircle size={18} />
//                     </button>
//                   )}
//                 </div>
//               </div>

//               <div>
//                 <Label className="mb-1 font-semibold text-gray-700 text-sm">
//                   Item Barcode :
//                 </Label>
//                 <div className="relative">
//                   <Input
//                     id="barcode"
//                     placeholder="Entry item barcode..."
//                     value={scanBarcode}
//                     onChange={(e) => setScanBarcode(e.target.value)}
//                   />
//                   {scanBarcode && (
//                     <button
//                       type="button"
//                       className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                       onClick={() => {
//                         setScanBarcode("");
//                         setListInboundScanned([]); // Clear the scanned items
//                         document.getElementById("barcode")?.focus();
//                       }}
//                     >
//                       <XCircle size={18} />
//                     </button>
//                   )}
//                 </div>
//               </div>

//               <Button onClick={handleSearch} className="w-full">
//                 <Search size={18} />
//                 Search
//               </Button>
//             </CardContent>
//           </Card>

//         )}

//         {/* Loading Indicator */}

//         {loading && (
//           <div className="flex items-center justify-center">
//             <Loader2 className="animate-spin" size={24} />
//             <span className="ml-2 text-gray-600">Searching...</span>
//           </div>
//         )}

//         {/* ListView */}

//         {!loading && (
//           <Card>
//             <CardContent className="p-4 space-y-4">
//               {/* <div className="relative">
//                 <Input
//                   id="search"
//                   className="w-full"
//                   placeholder="Search..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                 />

//                 {searchTerm && (
//                   <button
//                     type="button"
//                     className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                     onClick={() => {
//                       setSearchTerm("");
//                       document.getElementById("search")?.focus();
//                     }}
//                   >
//                     <XCircle size={18} />
//                   </button>
//                 )}
//               </div> */}

//               {/* Item Count */}
//               <div className="text-sm">
//                 <span className="text-gray-600">
//                   Item : {filteredScannedItems.length}
//                 </span>
//               </div>

//               {/* ListView */}
//               <div className="max-h-60 overflow-y-auto space-y-2">
//                 {filteredScannedItems.length > 0 ? (
//                   filteredScannedItems.map((item, index) => (
//                     <div
//                       key={index}
//                       className={`p-2 border rounded-md cursor-pointer ${item.qa_status === "A" ? "bg-green-100" : "bg-blue-100"
//                         }`}
//                     >
//                       <div className="flex justify-between items-start text-sm">
//                         <div className="space-y-1">
//                           <div>
//                             <span className="text-gray-600">Location:</span>{" "}
//                             {item.location}
//                             <br />
//                             <span className="text-gray-600">Barcode:</span>{" "}
//                             {item.ean_display}
//                             <br />


//                             {invPolicy?.show_rec_date && (
//                               <>
//                                 <span className="text-gray-600">Rcv Date:</span>{" "}
//                                 {item.rec_date}
//                                 <br />
//                               </>
//                             )}

//                             {invPolicy?.require_expiry_date && (
//                               <>
//                                 <span className="text-gray-600">Exp Date:</span>{" "}
//                                 {item.exp_date}
//                                 <br />
//                               </>
//                             )}



//                           </div>
//                         </div>
//                         <div className="text-right">
//                           {invPolicy?.require_lot_number && (
//                             <>
//                               <span className="text-gray-600">Lot:</span>{" "}
//                               {item.lot_number}
//                               <br />
//                             </>
//                           )}
//                           {/* <span className="text-gray-600">QA: </span>{" "}
//                           {item.qa_status}
//                           <br /> */}
//                           <span className="text-gray-600">Whs Code: </span>{" "}
//                           {item.whs_code}
//                           <br />
//                           <span className="text-gray-600">Available:</span>{" "}
//                           {item.qty_display} {item.uom_display}
//                         </div>
//                       </div>

//                       <Button
//                         className="w-full"
//                         onClick={() => {
//                           setShowConfirmModalMoveTo(true);
//                           setItemSelected(item);
//                           setQtyTransfer(item.qty_display);
//                           setUomTransfer(item.uom_display);
//                           setEanTransfer(item.ean_display);
//                         }}
//                       >
//                         <Check size={18} />
//                         Transfer
//                       </Button>
//                     </div>
//                   ))
//                 ) : (
//                   <div className="text-gray-500 text-sm">No items found.</div>
//                 )}
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         {/* Floating Upload Button */}

//         {listInboundScanned.length > 0 && !loading && (
//           // <div className="items-center justify-center fixed bottom-0 left-0 right-0 bg-white shadow-md">
//           //   <Button
//           //     onClick={() => setShowConfirmModal(true)}
//           //     className="fixed bottom-6 w-90 left-2 right-2"
//           //   >
//           //     <CheckCheck size={28} />
//           //     Transfer All
//           //   </Button>
//           // </div>

//           <div className="fixed bottom-6 left-2 right-2 flex gap-4">
//             <Button
//               onClick={() => setShowConfirmModal(true)}
//               className="flex-1"
//             >
//               <CheckCheck size={28} />
//               Transfer All
//             </Button>

//             <Button
//               onClick={() => {
//                 setShowForm(true);
//                 setListInboundScanned([]);
//               }}
//               className="flex-1"
//               variant="destructive"
//             >
//               <X size={28} />
//               Cancel
//             </Button>
//           </div>
//         )}

//         <Dialog
//           open={showConfirmModalMoveTo}
//           onOpenChange={setShowConfirmModalMoveTo}
//         >
//           <DialogContent className="bg-white">
//             <DialogHeader>
//               <DialogTitle>Confirmation</DialogTitle>
//             </DialogHeader>

//             <p>
//               Item <strong>{scanBarcode}</strong> in{" "}
//               <strong>{scanLocation}</strong> will be moved to the destination
//               location?
//             </p>

//             <div>
//               <Label className="mb-1 font-semibold text-gray-700 text-sm">
//                 Qty Transfer :
//               </Label>
//               <div className="relative flex">
//                 <Input
//                   className="mb-2"
//                   id="qtyTransfer"
//                   autoComplete="off"
//                   placeholder="Qty..."
//                   type="number"
//                   value={qtyTransfer}
//                   onChange={(e) => setQtyTransfer(Number(e.target.value))}
//                 />
//                 <Input
//                   readOnly
//                   className="mb-2 ml-2"
//                   id="uomTransfer"
//                   autoComplete="off"
//                   placeholder="UOM..."
//                   type="text"
//                   value={uomTransfer}
//                   onChange={(e) => setUomTransfer(e.target.value)}
//                 />
//               </div>
//               <span className="text-xs text-gray-700">Max Qty: {itemSelected?.qty_display} {itemSelected?.uom_display}</span>
//             </div>

//             <div>
//               <Label className="mb-1 font-semibold text-gray-700 text-sm">
//                 Destination Location :
//               </Label>
//               <div className="relative">
//                 <Input
//                   id="locationTransfer"
//                   autoComplete="off"
//                   placeholder="Entry destination location..."
//                   value={scanLocation2}
//                   onChange={(e) => setScanLocation2(e.target.value)}
//                 />

//                 {scanLocation2 && (
//                   <button
//                     type="button"
//                     className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                     onClick={() => {
//                       setScanLocation2("");
//                       document.getElementById("locationTransfer")?.focus();
//                     }}
//                   >
//                     <XCircle size={18} />
//                   </button>
//                 )}
//               </div>
//             </div>

//             <DialogFooter>
//               <Button
//                 variant="ghost"
//                 onClick={() => setShowConfirmModalMoveTo(false)}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 disabled={isSubmit}
//                 onClick={moveItemToLocation}
//               >
//                 {isSubmit ? (
//                   <>
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                     Please wait ...
//                   </>
//                 ) : 'Transfer'}
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>

//         <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
//           <DialogContent className="bg-white">
//             <DialogHeader>
//               <DialogTitle>Confirmation</DialogTitle>
//             </DialogHeader>

//             <p>
//               All items of <strong>{scanBarcode}</strong> in{" "}
//               <strong>{scanLocation}</strong> will be moved to the destination
//               location?
//             </p>

//             <div>
//               <Label className="mb-1 font-semibold text-gray-700 text-sm">
//                 Destination Location :
//               </Label>
//               <div className="relative">
//                 <Input
//                   id="location2"
//                   autoComplete="off"
//                   placeholder="Entry destination location..."
//                   value={scanLocation2}
//                   onChange={(e) => setScanLocation2(e.target.value)}
//                 />

//                 {scanLocation2 && (
//                   <button
//                     type="button"
//                     className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                     onClick={() => {
//                       setScanLocation2("");
//                       document.getElementById("location2")?.focus();
//                     }}
//                   >
//                     <XCircle size={18} />
//                   </button>
//                 )}
//               </div>
//             </div>

//             <DialogFooter>
//               <Button
//                 variant="ghost"
//                 onClick={() => setShowConfirmModal(false)}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 disabled={isSubmit}
//                 onClick={handleConfirmTransfer}
//               >
//                 {isSubmit ? (
//                   <>
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                     Please wait ...
//                   </>
//                 ) : 'Transfer'}
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>
//       </div>
//     </>
//   );
// };

// export default TransferPage;

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/mobile/PageHeader";
import { Check, CheckCheck, Loader2, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { XCircle } from "lucide-react";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";
import { Label } from "@radix-ui/react-dropdown-menu";
import { InventoryPolicy } from "@/types/inventory";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScannedItem {
  id?: number;
  inbound_no: string;
  inbound_id: number;
  inbound_detail_id: number;
  barcode: string;
  serial_number: string;
  serial_number_2?: string;
  pallet: string;
  location: string;
  qa_status: string;
  whs_code: string;
  scan_type: string;
  quantity: number;
  status?: string;
  rec_date?: string;
  prod_date?: string;
  exp_date?: string;
  lot_number?: string;
  uom?: string;
  qty_display?: number;
  ean_display?: string;
  uom_display?: string;
  owner_code?: string;
}

// ─── QR Parser (sama dengan inbound/outbound) ─────────────────────────────────

interface ParsedQRData {
  sku?: string;
  ean?: string;
  product?: string;
  brand?: string;
  model?: string;
  serial?: string;
  cartonSerial?: string;
  batch?: string;
  mfgDate?: string;
  qtyPerCarton?: number;
  labelType?: "UNIT" | "CARTON" | "UNKNOWN";
}

function parseQRCode(raw: string): ParsedQRData | null {
  const pattern = /\((\d+)\)([A-Z_]+)=([^(]*)/g;
  const map: Record<string, string> = {};
  let match: RegExpExecArray | null;
  let found = false;

  while ((match = pattern.exec(raw)) !== null) {
    found = true;
    map[match[2].trim()] = match[3].trim();
  }

  if (!found) return null;

  let mfgDate: string | undefined;
  if (map["MFG_DATE"]?.length === 8) {
    const d = map["MFG_DATE"];
    mfgDate = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  }

  const labelType = map["SERIAL"]
    ? "UNIT"
    : map["CARTON_SERIAL"]
      ? "CARTON"
      : "UNKNOWN";

  return {
    sku: map["SKU"],
    ean: map["EAN"],
    product: map["PRODUCT"],
    brand: map["BRAND"],
    model: map["MODEL"],
    serial: map["SERIAL"],
    cartonSerial: map["CARTON_SERIAL"],
    batch: map["BATCH"],
    mfgDate,
    qtyPerCarton: map["QTY_PER_CARTON"] ? Number(map["QTY_PER_CARTON"]) : undefined,
    labelType,
  };
}

// ─── Toggle Component ─────────────────────────────────────────────────────────

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  labelOff?: string;
  labelOn?: string;
}

const ToggleSwitch = ({ checked, onChange, labelOff = "Off", labelOn = "On" }: ToggleSwitchProps) => (
  <div className="flex items-center gap-2 text-sm">
    <span className={!checked ? "font-semibold text-gray-800" : "text-gray-400"}>{labelOff}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-blue-500" : "bg-gray-300"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
    <span className={checked ? "font-semibold text-gray-800" : "text-gray-400"}>{labelOn}</span>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const TransferPage = () => {
  const router = useRouter();
  const { inbound } = router.query;

  // ── Existing state (tidak diubah) ──────────────────────────────────────────
  const [scanLocation, setScanLocation] = useState("");
  const [scanLocation2, setScanLocation2] = useState("");
  const [qtyTransfer, setQtyTransfer] = useState(0);
  const [eanTransfer, setEanTransfer] = useState("");
  const [uomTransfer, setUomTransfer] = useState("");
  const [scanBarcode, setScanBarcode] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmModalMoveTo, setShowConfirmModalMoveTo] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invPolicy, setInvPolicy] = useState<InventoryPolicy>();
  const [itemSelected, setItemSelected] = useState<ScannedItem | null>(null);
  const [listInboundScanned, setListInboundScanned] = useState<ScannedItem[]>([]);
  const [isSubmit, setIsSubmit] = useState(false);
  const [showForm, setShowForm] = useState(true);

  // ── QR mode state (tambahan) ───────────────────────────────────────────────
  const [isQrMode, setIsQrMode] = useState(false);
  const [qrRawInput, setQrRawInput] = useState("");
  const [parsedQR, setParsedQR] = useState<ParsedQRData | null>(null);

  // ── QR Helpers ─────────────────────────────────────────────────────────────

  const handleQrInputChange = (raw: string) => {
    setQrRawInput(raw);
    const parsed = parseQRCode(raw);
    if (parsed) {
      setParsedQR(parsed);
      // mapping ke scanBarcode — sama seperti EAN mode
      if (parsed.ean) setScanBarcode(parsed.ean);
    } else {
      setParsedQR(null);
    }
  };

  const handleModeToggle = (qr: boolean) => {
    setIsQrMode(qr);
    setQrRawInput("");
    setParsedQR(null);
    setScanBarcode("");
    setTimeout(() => {
      document.getElementById(qr ? "qr-input" : "barcode")?.focus();
    }, 50);
  };

  // ── Existing handlers (tidak diubah) ───────────────────────────────────────

  const fetchPolicy = async (owner: string) => {
    try {
      const response = await api.get("/inventory/policy?owner=" + owner);
      const data = await response.data;
      if (data.success) setInvPolicy(data.data.inventory_policy);
    } catch (error) {
      console.error("Error fetching policy:", error);
    }
  };

  useEffect(() => {
    if (listInboundScanned.length > 0) fetchPolicy(listInboundScanned[0].owner_code);
  }, [listInboundScanned]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await api.post(
        "/mobile/inventory/location/barcode",
        { location: scanLocation, barcode: scanBarcode },
        { withCredentials: true }
      );
      const data = await response.data;
      if (data.success) {
        const filtered = data.data.map((item: any) => ({
          id: item.ID,
          inbound_no: inbound,
          inbound_id: item.inbound_id,
          inbound_detail_id: item.inbound_detail_id,
          barcode: item.barcode,
          serial_number: item.serial_number,
          serial_number_2: item.serial_number_2,
          pallet: item.pallet,
          location: item.location,
          qa_status: item.qa_status,
          whs_code: item.whs_code,
          scan_type: item.scan_type,
          quantity: item.qty_available,
          status: item.status,
          rec_date: item.rec_date,
          prod_date: item.prod_date,
          exp_date: item.exp_date,
          lot_number: item.lot_number,
          uom: item.uom,
          qty_display: item.qty_display,
          ean_display: item.ean_display,
          uom_display: item.uom_display,
          owner_code: item.owner_code,
        }));

        if (filtered.length === 0) {
          setListInboundScanned([]);
          return;
        }
        setShowForm(false);
        setListInboundScanned(filtered);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const handleConfirmTransfer = async () => {
    const dataToPost = {
      from_location: scanLocation,
      to_location: scanLocation2,
      list_inventory: listInboundScanned,
    };
    setIsSubmit(true);
    try {
      const response = await api.post(
        "/mobile/inventory/transfer/location/barcode",
        dataToPost,
        { withCredentials: true }
      );
      const data = await response.data;
      if (data.success) {
        setShowConfirmModal(false);
        setListInboundScanned([]);
        setScanLocation2("");
        setShowForm(true);
        eventBus.emit("showAlert", { title: "Success!", description: data.message, type: "success" });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setTimeout(() => setIsSubmit(false), 1500);
    }
  };

  const moveItemToLocation = async () => {
    if (qtyTransfer <= 0) {
      eventBus.emit("showAlert", { title: "Error!", description: "Qty transfer must be greater than 0", type: "error" });
      return;
    }
    if (qtyTransfer > itemSelected?.quantity) {
      eventBus.emit("showAlert", { title: "Error!", description: "Qty transfer must be less than available qty", type: "error" });
      return;
    }
    if (scanLocation2.trim() === "") {
      eventBus.emit("showAlert", { title: "Error!", description: "Destination location cannot be empty", type: "error" });
      return;
    }

    const dataToPost = {
      from_location: scanLocation,
      to_location: scanLocation2,
      qty_transfer: qtyTransfer,
      ean_transfer: eanTransfer,
      uom_transfer: uomTransfer,
      inventory_id: itemSelected?.id,
      list_inventory: [itemSelected],
    };

    setIsSubmit(true);
    try {
      const response = await api.post(
        "/mobile/inventory/transfer-by-inventory-id",
        dataToPost,
        { withCredentials: true }
      );
      const data = await response.data;
      if (data.success) {
        eventBus.emit("showAlert", { title: "Success!", description: data.message, type: "success" });
        setShowConfirmModalMoveTo(false);
        setScanLocation2("");
        setListInboundScanned([]);
        setShowForm(true);
      }
    } catch (error) {
      console.error("Error during transfer:", error);
    } finally {
      setTimeout(() => setIsSubmit(false), 1500);
    }
  };

  const filteredScannedItems = listInboundScanned.filter(
    (item) =>
      !searchTerm ||
      item?.id?.toString().includes(searchTerm.toLowerCase()) ||
      item?.inbound_detail_id.toString().includes(searchTerm.toLowerCase()) ||
      item?.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item?.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item?.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (showConfirmModalMoveTo) {
      setTimeout(() => {
        document.getElementById("locationTransfer")?.focus();
      }, 100);
    }
  }, [showConfirmModalMoveTo]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader title="Internal Transfer" showBackButton />
      <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-24 max-w-md mx-auto">

        {/* ── Search Form ── */}
        {showForm && (
          <Card>
            <CardContent className="p-4 space-y-3">

              {/* Origin Location — tidak berubah */}
              <div>
                <Label className="mb-1 font-semibold text-gray-700 text-sm">
                  Origin Location :
                </Label>
                <div className="relative">
                  <Input
                    id="location"
                    placeholder="Entry origin location..."
                    value={scanLocation}
                    onChange={(e) => setScanLocation(e.target.value)}
                  />
                  {scanLocation && (
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => { setScanLocation(""); setListInboundScanned([]); document.getElementById("location")?.focus(); }}>
                      <XCircle size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Scan Mode Toggle */}
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-gray-700 text-sm">Item Barcode :</Label>
                <ToggleSwitch
                  checked={isQrMode}
                  onChange={handleModeToggle}
                  labelOff="EAN"
                  labelOn="QR Code"
                />
              </div>

              {/* EAN mode — tidak berubah */}
              {!isQrMode && (
                <div className="relative">
                  <Input
                    id="barcode"
                    placeholder="Entry item barcode..."
                    value={scanBarcode}
                    onChange={(e) => setScanBarcode(e.target.value)}
                  />
                  {scanBarcode && (
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => { setScanBarcode(""); setListInboundScanned([]); document.getElementById("barcode")?.focus(); }}>
                      <XCircle size={18} />
                    </button>
                  )}
                </div>
              )}

              {/* QR mode — tambahan */}
              {isQrMode && (
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="qr-input"
                      autoComplete="off"
                      className="font-mono text-xs pr-8"
                      placeholder="Scan QR code here..."
                      value={qrRawInput}
                      onChange={(e) => handleQrInputChange(e.target.value)}
                      autoFocus
                    />
                    {qrRawInput && (
                      <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => { setQrRawInput(""); setParsedQR(null); setScanBarcode(""); document.getElementById("qr-input")?.focus(); }}>
                        <XCircle size={16} />
                      </button>
                    )}
                  </div>

                  {/* Preview hasil parse */}
                  {parsedQR && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs font-mono space-y-0.5">
                      <div>
                        <span className="text-gray-500">Type:</span>{" "}
                        <span className={parsedQR.labelType === "UNIT" ? "text-purple-600 font-semibold" : "text-blue-600 font-semibold"}>
                          {parsedQR.labelType === "UNIT" ? "Unit / Serial" : "Master Carton"}
                        </span>
                      </div>
                      {parsedQR.sku && <div><span className="text-gray-500">SKU:</span> {parsedQR.sku}</div>}
                      {parsedQR.ean && <div><span className="text-gray-500">EAN:</span> {parsedQR.ean}</div>}
                      {parsedQR.product && <div><span className="text-gray-500">Product:</span> {parsedQR.product}</div>}
                      {parsedQR.serial && <div><span className="text-gray-500">Serial:</span> {parsedQR.serial}</div>}
                      {parsedQR.batch && <div><span className="text-gray-500">Batch:</span> {parsedQR.batch}</div>}
                      {parsedQR.cartonSerial && <div><span className="text-gray-500">Carton:</span> {parsedQR.cartonSerial}</div>}
                    </div>
                  )}

                  {qrRawInput && !parsedQR && (
                    <p className="text-xs text-red-500">
                      Format QR tidak dikenali. Pastikan format: (1)SKU=...
                    </p>
                  )}

                  {/* EAN hasil parse — tampil sebagai read-only konfirmasi */}
                  {scanBarcode && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 border rounded px-2 py-1.5">
                      <span className="text-gray-400">EAN parsed:</span>
                      <span className="font-mono font-semibold text-gray-800">{scanBarcode}</span>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={handleSearch}
                className="w-full"
                disabled={!scanBarcode.trim() || !scanLocation.trim()}
              >
                <Search size={18} />
                Search
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin" size={24} />
            <span className="ml-2 text-gray-600">Searching...</span>
          </div>
        )}

        {/* ── Result List — tidak berubah ── */}
        {!loading && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="text-sm">
                <span className="text-gray-600">Item : {filteredScannedItems.length}</span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredScannedItems.length > 0 ? (
                  filteredScannedItems.map((item, index) => (
                    <div
                      key={index}
                      className={`p-2 border rounded-md cursor-pointer ${item.qa_status === "A" ? "bg-green-100" : "bg-blue-100"}`}
                    >
                      <div className="flex justify-between items-start text-sm">
                        <div className="space-y-1">
                          <div>
                            <span className="text-gray-600">Location:</span> {item.location}<br />
                            <span className="text-gray-600">Barcode:</span> {item.ean_display}<br />
                            {invPolicy?.show_rec_date && (
                              <><span className="text-gray-600">Rcv Date:</span> {item.rec_date}<br /></>
                            )}
                            {invPolicy?.require_expiry_date && (
                              <><span className="text-gray-600">Exp Date:</span> {item.exp_date}<br /></>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {invPolicy?.require_lot_number && (
                            <><span className="text-gray-600">Lot:</span> {item.lot_number}<br /></>
                          )}
                          <span className="text-gray-600">Whs Code:</span> {item.whs_code}<br />
                          <span className="text-gray-600">Available:</span> {item.qty_display} {item.uom_display}
                        </div>
                      </div>

                      <Button
                        className="w-full mt-2"
                        onClick={() => {
                          setShowConfirmModalMoveTo(true);
                          setItemSelected(item);
                          setQtyTransfer(item.qty_display);
                          setUomTransfer(item.uom_display);
                          setEanTransfer(item.ean_display);
                        }}
                      >
                        <Check size={18} />
                        Transfer
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm">No items found.</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Floating Buttons — tidak berubah ── */}
        {listInboundScanned.length > 0 && !loading && (
          <div className="fixed bottom-6 left-2 right-2 flex gap-4">
            <Button onClick={() => setShowConfirmModal(true)} className="flex-1">
              <CheckCheck size={28} />
              Transfer All
            </Button>
            <Button onClick={() => { setShowForm(true); setListInboundScanned([]); }} className="flex-1" variant="destructive">
              <X size={28} />
              Cancel
            </Button>
          </div>
        )}

        {/* ── Dialog Transfer per Item — tidak berubah ── */}
        <Dialog open={showConfirmModalMoveTo} onOpenChange={setShowConfirmModalMoveTo}>
          <DialogContent className="bg-white">
            <DialogHeader><DialogTitle>Confirmation</DialogTitle></DialogHeader>
            <p>
              Item <strong>{scanBarcode}</strong> in <strong>{scanLocation}</strong> will be moved to the destination location?
            </p>
            <div>
              <Label className="mb-1 font-semibold text-gray-700 text-sm">Qty Transfer :</Label>
              <div className="relative flex">
                <Input
                  className="mb-2"
                  id="qtyTransfer"
                  autoComplete="off"
                  placeholder="Qty..."
                  type="number"
                  value={qtyTransfer}
                  onChange={(e) => setQtyTransfer(Number(e.target.value))}
                />
                <Input
                  readOnly
                  className="mb-2 ml-2"
                  id="uomTransfer"
                  autoComplete="off"
                  placeholder="UOM..."
                  type="text"
                  value={uomTransfer}
                />
              </div>
              <span className="text-xs text-gray-700">Max Qty: {itemSelected?.qty_display} {itemSelected?.uom_display}</span>
            </div>
            <div>
              <Label className="mb-1 font-semibold text-gray-700 text-sm">Destination Location :</Label>
              <div className="relative">
                <Input
                  id="locationTransfer"
                  autoComplete="off"
                  placeholder="Entry destination location..."
                  value={scanLocation2}
                  onChange={(e) => setScanLocation2(e.target.value)}
                />
                {scanLocation2 && (
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => { setScanLocation2(""); document.getElementById("locationTransfer")?.focus(); }}>
                    <XCircle size={18} />
                  </button>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowConfirmModalMoveTo(false)}>Cancel</Button>
              <Button disabled={isSubmit} onClick={moveItemToLocation}>
                {isSubmit ? <><Loader2 className="h-4 w-4 animate-spin" />Please wait ...</> : "Transfer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Dialog Transfer All — tidak berubah ── */}
        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="bg-white">
            <DialogHeader><DialogTitle>Confirmation</DialogTitle></DialogHeader>
            <p>
              All items of <strong>{scanBarcode}</strong> in <strong>{scanLocation}</strong> will be moved to the destination location?
            </p>
            <div>
              <Label className="mb-1 font-semibold text-gray-700 text-sm">Destination Location :</Label>
              <div className="relative">
                <Input
                  id="location2"
                  autoComplete="off"
                  placeholder="Entry destination location..."
                  value={scanLocation2}
                  onChange={(e) => setScanLocation2(e.target.value)}
                />
                {scanLocation2 && (
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => { setScanLocation2(""); document.getElementById("location2")?.focus(); }}>
                    <XCircle size={18} />
                  </button>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
              <Button disabled={isSubmit} onClick={handleConfirmTransfer}>
                {isSubmit ? <><Loader2 className="h-4 w-4 animate-spin" />Please wait ...</> : "Transfer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </>
  );
};

export default TransferPage;
