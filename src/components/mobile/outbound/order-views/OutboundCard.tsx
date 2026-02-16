/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { OutboundItem } from "@/types/outbound";
import { Box, Package, RefreshCcw, ScanBarcode, Ruler } from "lucide-react";
import router from "next/router";
import { useState, useEffect } from "react";

interface CartonData {
  pack_ctn_no: string;
  qty: number;
  count: number;
  carton_id?: number | null;
}

interface MasterCarton {
  id: number;
  carton_code: string;
  carton_name: string;
  description: string;
  length: number;
  width: number;
  height: number;
  max_weight: number;
  tare_weight: number;
  volume: number;
  is_default: boolean;
  material: string;
  dimensions: string;
  display_name: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    outbound_no: string;
    cartons: CartonData[];
    total: number;
  };
}

interface MasterCartonResponse {
  success: boolean;
  message: string;
  data: MasterCarton[];
}

export default function OutboundCard({ data }: { data: OutboundItem }) {
  const {
    outbound_no,
    customer_name,
    status,
    qty_req,
    qty_scan,
    qty_pack,
    shipment_id,
  } = data;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cartonList, setCartonList] = useState<CartonData[]>([]);
  const [masterCartons, setMasterCartons] = useState<MasterCarton[]>([]);
  const [selectedMasterCarton, setSelectedMasterCarton] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [targetPage, setTargetPage] = useState<string>("");
  const [showMasterCartonSelect, setShowMasterCartonSelect] = useState(false);

  // Fetch master cartons saat component mount
  useEffect(() => {
    fetchMasterCartons();
  }, []);

  // Fungsi untuk fetch master cartons dari API
  const fetchMasterCartons = async () => {
    try {
      const response = await api.get("/mobile/outbound/master-cartons", {
        withCredentials: true,
      });

      if (response.data.success) {
        const result: MasterCartonResponse = response.data;
        setMasterCartons(result.data);
        
        // Set default carton jika ada
        const defaultCarton = result.data.find((c) => c.is_default);
        if (defaultCarton) {
          setSelectedMasterCarton(defaultCarton.id.toString());
        }
      }
    } catch (error) {
      console.error("Error fetching master cartons:", error);
    }
  };

  // Fungsi untuk fetch data karton dari API
  const fetchCartonData = async (outbound_no: string) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/mobile/outbound/${outbound_no}/cartons`, {
        withCredentials: true,
      });

      if (!response.data.success) {
        throw new Error("Failed to fetch carton data");
      }

      const result: ApiResponse = response.data;
      if (result.success) {
        return result.data.cartons || [];
      } else {
        console.error("API Error:", result.message);
        return [];
      }
    } catch (error) {
      console.error("Error fetching carton data:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Handler untuk tombol Picking
  const handlePickingClick = async (outbound_no: string) => {
    setTargetPage("picking");
    const cartons = await fetchCartonData(outbound_no);
    setCartonList(cartons);
    setShowMasterCartonSelect(false);
    setIsDialogOpen(true);
  };

  // Handler untuk tombol Override
  const handleOverrideClick = async (outbound_no: string) => {
    setTargetPage("override");
    const cartons = await fetchCartonData(outbound_no);
    setCartonList(cartons);
    setShowMasterCartonSelect(false);
    setIsDialogOpen(true);
  };

  // Handler untuk tombol Packing
  const handlePackingClick = async (outbound_no: string) => {
    setTargetPage("packing");
    const cartons = await fetchCartonData(outbound_no);
    setCartonList(cartons);
    setShowMasterCartonSelect(false);
    setIsDialogOpen(true);
  };

  // Handler untuk memilih karton existing
  const handleSelectCarton = (pack_ctn_no: string, carton_id: number) => {
    router.push(`/mobile/outbound/${targetPage}/${outbound_no}/${pack_ctn_no}?master_carton_id=${carton_id}`);
  };

  // Handler untuk show master carton selection
  const handleShowMasterCartonSelect = () => {
    setShowMasterCartonSelect(true);
  };

  // Handler untuk membuat karton baru dengan master carton yang dipilih
  const handleNewCartonWithMaster = () => {
    if (!selectedMasterCarton) {
      alert("Please select a carton type");
      return;
    }
    
    const newCartonNo = cartonList.length + 1;
    // Pass master carton ID sebagai query parameter
    router.push(
      `/mobile/outbound/${targetPage}/${outbound_no}/${newCartonNo}?master_carton_id=${selectedMasterCarton}`
    );
  };

  // Handler untuk back dari master carton selection
  const handleBackFromMasterSelect = () => {
    setShowMasterCartonSelect(false);
  };

  // Get selected master carton details
  const getSelectedMasterCartonDetails = () => {
    if (!selectedMasterCarton) return null;
    return masterCartons.find((c) => c.id.toString() === selectedMasterCarton);
  };

  return (
    <>
      <Card className="p-3 relative">
        <div className="absolute top-2 right-2 flex gap-3">
          <div className="flex items-center space-x-1 text-gray-500 text-xs">
            <Package size={16} />
            <span>{qty_req}</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-500 text-xs">
            <ScanBarcode size={16} />
            <span>{qty_pack}</span>
          </div>
        </div>
        <CardContent className="p-0 space-y-1">
          <div className="text-sm font-semibold">
            {outbound_no}
            <span className="ml-2 text-xs text-gray-500 rounded px-2 py-1 w-max mt-1 bg-green-100">
              {status}
            </span>
          </div>
          <div className="text-sm text-gray-500">{customer_name}</div>
          <div className="text-sm text-gray-500">{shipment_id}</div>

          <div className="mt-3 flex gap-2">
            <Button
              style={{ display: "" }}
              className="w-full"
              onClick={() => handlePickingClick(outbound_no)}
              disabled={isLoading}
            >
              <ScanBarcode size={16} />
              Process
            </Button>
            <Button
              className="w-full"
              onClick={() => handleOverrideClick(outbound_no)}
              disabled={isLoading}
            >
              <RefreshCcw size={16} />
              Override
            </Button>
            <Button
              style={{ display: "none" }}
              className="w-full"
              onClick={() => handlePackingClick(outbound_no)}
              disabled={isLoading}
            >
              <Box size={16} />
              Packing
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog untuk pilih karton */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>
              {showMasterCartonSelect ? "Select Carton Type" : "Choose Carton"}
            </DialogTitle>
            <DialogDescription>
              {showMasterCartonSelect
                ? "Select the type of carton for packing"
                : "Create new carton or continue with existing one"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : showMasterCartonSelect ? (
              // Master Carton Selection View
              <>
                <div className="space-y-3">
                  <Select
                    value={selectedMasterCarton}
                    onValueChange={setSelectedMasterCarton}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select carton type" />
                    </SelectTrigger>
                    <SelectContent>
                      {masterCartons.map((carton) => (
                        <SelectItem
                          key={carton.id}
                          value={carton.id.toString()}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {carton.carton_name}
                              {carton.is_default && (
                                <span className="ml-2 text-xs text-blue-500">
                                  (Default)
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-gray-500">
                              {carton.dimensions} - Max: {carton.max_weight}kg
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Show selected carton details */}
                  {getSelectedMasterCartonDetails() && (
                    <Card className="p-3 bg-blue-50 border-blue-200">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Ruler size={16} className="text-blue-600" />
                          <span className="font-semibold text-blue-900">
                            {getSelectedMasterCartonDetails()?.carton_name}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                          <div>
                            <span className="font-medium">Size:</span>{" "}
                            {getSelectedMasterCartonDetails()?.dimensions}
                          </div>
                          <div>
                            <span className="font-medium">Max Weight:</span>{" "}
                            {getSelectedMasterCartonDetails()?.max_weight}kg
                          </div>
                          <div>
                            <span className="font-medium">Volume:</span>{" "}
                            {getSelectedMasterCartonDetails()?.volume.toLocaleString()}
                            cm³
                          </div>
                          <div>
                            <span className="font-medium">Material:</span>{" "}
                            {getSelectedMasterCartonDetails()?.material}
                          </div>
                        </div>
                        {getSelectedMasterCartonDetails()?.description && (
                          <p className="text-xs text-gray-600 italic">
                            {getSelectedMasterCartonDetails()?.description}
                          </p>
                        )}
                      </div>
                    </Card>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={handleBackFromMasterSelect}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleNewCartonWithMaster}
                    disabled={!selectedMasterCarton}
                  >
                    Continue
                  </Button>
                </div>
              </>
            ) : (
              // Carton List View
              <>
                {/* Tombol New Karton di atas */}
                <Button
                  className="w-full"
                  variant="default"
                  onClick={handleShowMasterCartonSelect}
                >
                  <Package size={16} className="mr-2" />
                  New Carton
                </Button>

                {/* Daftar karton existing */}
                {cartonList.length > 0 ? (
                  <>
                    <div className="text-sm font-medium text-gray-500 mt-4 mb-2">
                      Or continue existing carton:
                    </div>
                    {cartonList.map((carton) => (
                      <Button
                        key={carton.pack_ctn_no}
                        className="w-full justify-between"
                        variant="outline"
                        onClick={() => handleSelectCarton(carton.pack_ctn_no, carton.carton_id || 0)}
                      >
                        <span>Carton {carton.pack_ctn_no}</span>
                        <div className="flex gap-2 text-xs text-gray-500">
                          <span>Qty: {carton.qty}</span>
                          <span>Items: {carton.count}</span>
                        </div>
                      </Button>
                    ))}
                  </>
                ) : (
                  <div className="text-center text-sm text-gray-500 py-4">
                    No existing carton found
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// /* eslint-disable @typescript-eslint/no-unused-vars */
// "use client";

// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import api from "@/lib/api";
// import { OutboundItem } from "@/types/outbound";
// import { Box, Package, RefreshCcw, ScanBarcode } from "lucide-react";
// import router from "next/router";
// import { useState } from "react";

// interface CartonData {
//   pack_ctn_no: string;
//   qty: number;
//   count: number;
// }

// interface ApiResponse {
//   success: boolean;
//   message: string;
//   data: {
//     outbound_no: string;
//     cartons: CartonData[];
//     total: number;
//   };
// }

// export default function OutboundCard({ data }: { data: OutboundItem }) {
//   const {
//     outbound_no,
//     customer_name,
//     status,
//     qty_req,
//     qty_scan,
//     qty_pack,
//     shipment_id,
//   } = data;

//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [cartonList, setCartonList] = useState<CartonData[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [targetPage, setTargetPage] = useState<string>("");

//   // Fungsi untuk fetch data karton dari API
//   const fetchCartonData = async (outbound_no: string) => {
//     try {
//       setIsLoading(true);
//       // Sesuaikan dengan route API yang benar
//       const response = await api.get(`/mobile/outbound/${outbound_no}/cartons`, {
//         withCredentials: true,
//       });

//       if (!response.data.success) {
//         throw new Error("Failed to fetch carton data");
//       }

//       const result: ApiResponse = response.data;
//       if (result.success) {
//         return result.data.cartons || [];
//       } else {
//         console.error("API Error:", result.message);
//         return [];
//       }
//     } catch (error) {
//       console.error("Error fetching carton data:", error);
//       return [];
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Handler untuk tombol Picking
//   const handlePickingClick = async (outbound_no: string) => {
//     setTargetPage("picking");
//     const cartons = await fetchCartonData(outbound_no);
//     setCartonList(cartons);
//     setIsDialogOpen(true);
//   };

//   // Handler untuk tombol Override
//   const handleOverrideClick = async (outbound_no: string) => {
//     setTargetPage("override");
//     const cartons = await fetchCartonData(outbound_no);
//     setCartonList(cartons);
//     setIsDialogOpen(true);
//   };

//   // Handler untuk tombol Packing
//   const handlePackingClick = async (outbound_no: string) => {
//     setTargetPage("packing");
//     const cartons = await fetchCartonData(outbound_no);
//     setCartonList(cartons);
//     setIsDialogOpen(true);
//   };

//   // Handler untuk memilih karton existing
//   const handleSelectCarton = (pack_ctn_no: string) => {
//     router.push(`/mobile/outbound/${targetPage}/${outbound_no}/${pack_ctn_no}`);
//   };

//   // Handler untuk membuat karton baru
//   const handleNewCarton = () => {
//     const newCartonNo = cartonList.length + 1;
//     router.push(`/mobile/outbound/${targetPage}/${outbound_no}/${newCartonNo}`);
//   };

//   return (
//     <>
//       <Card className="p-3 relative">
//         <div className="absolute top-2 right-2 flex gap-3">
//           <div className="flex items-center space-x-1 text-gray-500 text-xs">
//             <Package size={16} />
//             <span>{qty_req}</span>
//           </div>
//           <div className="flex items-center space-x-1 text-gray-500 text-xs">
//             <ScanBarcode size={16} />
//             <span>{qty_pack}</span>
//           </div>
//         </div>
//         <CardContent className="p-0 space-y-1">
//           <div className="text-sm font-semibold">
//             {outbound_no}
//             <span className="ml-2 text-xs text-gray-500 rounded px-2 py-1 w-max mt-1 bg-green-100">
//               {status}
//             </span>
//           </div>
//           <div className="text-sm text-gray-500">{customer_name}</div>
//           <div className="text-sm text-gray-500">{shipment_id}</div>

//           <div className="mt-3 flex gap-2">
//             <Button
//               style={{ display: "" }}
//               className="w-full"
//               onClick={() => handlePickingClick(outbound_no)}
//               disabled={isLoading}
//             >
//               <ScanBarcode size={16} />
//               Process
//             </Button>
//             <Button
//               className="w-full"
//               onClick={() => handleOverrideClick(outbound_no)}
//               disabled={isLoading}
//             >
//               <RefreshCcw size={16} />
//               Override
//             </Button>
//             <Button
//               style={{ display: "none" }}
//               className="w-full"
//               onClick={() => handlePackingClick(outbound_no)}
//               disabled={isLoading}
//             >
//               <Box size={16} />
//               Packing
//             </Button>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Dialog untuk pilih karton */}
//       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//         <DialogContent className="sm:max-w-md bg-white">
//           <DialogHeader>
//             <DialogTitle>Choose Carton</DialogTitle>
//             <DialogDescription>
              
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-2 max-h-96 overflow-y-auto">
//             {isLoading ? (
//               <div className="text-center py-4">Loading...</div>
//             ) : (
//               <>
//                 {/* Tombol New Karton di atas */}
//                 <Button
//                   className="w-full"
//                   variant="default"
//                   onClick={handleNewCarton}
//                 >
//                   <Package size={16} className="mr-2" />
//                   New Carton
//                 </Button>

//                 {/* Daftar karton existing */}
//                 {cartonList.length > 0 ? (
//                   <>
//                     <div className="text-sm font-medium text-gray-500 mt-4 mb-2">
//                       Or continue existing carton:
//                     </div>
//                     {cartonList.map((carton) => (
//                       <Button
//                         key={carton.pack_ctn_no}
//                         className="w-full justify-between"
//                         variant="outline"
//                         onClick={() => handleSelectCarton(carton.pack_ctn_no)}
//                       >
//                         <span>Carton {carton.pack_ctn_no}</span>
//                         <div className="flex gap-2 text-xs text-gray-500">
//                           <span>Qty: {carton.qty}</span>
//                           <span>Items: {carton.count}</span>
//                         </div>
//                       </Button>
//                     ))}
//                   </>
//                 ) : (
//                   <div className="text-center text-sm text-gray-500 py-4">
//                     No carton found
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }
