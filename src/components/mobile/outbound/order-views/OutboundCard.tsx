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
import api from "@/lib/api";
import { OutboundItem } from "@/types/outbound";
import { Box, Package, RefreshCcw, ScanBarcode } from "lucide-react";
import router from "next/router";
import { useState } from "react";

interface CartonData {
  pack_ctn_no: string;
  qty: number;
  count: number;
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
  const [isLoading, setIsLoading] = useState(false);
  const [targetPage, setTargetPage] = useState<string>("");

  // Fungsi untuk fetch data karton dari API
  const fetchCartonData = async (outbound_no: string) => {
    try {
      setIsLoading(true);
      // Sesuaikan dengan route API yang benar
      // const response = await fetch(`/api/outbound/${outbound_no}/carton`);
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
    setIsDialogOpen(true);
  };

  // Handler untuk tombol Override
  const handleOverrideClick = async (outbound_no: string) => {
    setTargetPage("override");
    const cartons = await fetchCartonData(outbound_no);
    setCartonList(cartons);
    setIsDialogOpen(true);
  };

  // Handler untuk tombol Packing
  const handlePackingClick = async (outbound_no: string) => {
    setTargetPage("packing");
    const cartons = await fetchCartonData(outbound_no);
    setCartonList(cartons);
    setIsDialogOpen(true);
  };

  // Handler untuk memilih karton existing
  const handleSelectCarton = (pack_ctn_no: string) => {
    router.push(`/mobile/outbound/${targetPage}/${outbound_no}/${pack_ctn_no}`);
  };

  // Handler untuk membuat karton baru
  const handleNewCarton = () => {
    const newCartonNo = cartonList.length + 1;
    router.push(`/mobile/outbound/${targetPage}/${outbound_no}/${newCartonNo}`);
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
            <DialogTitle>Choose Carton</DialogTitle>
            <DialogDescription>
              
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <>
                {/* Tombol New Karton di atas */}
                <Button
                  className="w-full"
                  variant="default"
                  onClick={handleNewCarton}
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
                        onClick={() => handleSelectCarton(carton.pack_ctn_no)}
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
                    No carton found
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
// import { OutboundItem } from "@/types/outbound";
// import { Box, Package, RefreshCcw, ScanBarcode } from "lucide-react";
// import router from "next/router";

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

//   // const statusColor = {
//   //   "open": "bg-red-100 text-red-600",
//   //   "partial": "bg-yellow-100 text-yellow-600",
//   //   "fully Received": "bg-green-100 text-green-600",
//   // };

//   const handlePickingClick = (outbound_no: string) => {
//     router.push(`/mobile/outbound/picking/${outbound_no}`); // Arahkan ke halaman checking
//   };
//   const handleOverrideClick = (outbound_no: string) => {
//     router.push(`/mobile/outbound/override/${outbound_no}`); // Arahkan ke halaman override
//   };
//   const handlePackingClick = (outbound_no: string) => {
//     router.push(`/mobile/outbound/packing/${outbound_no}`); // Arahkan ke halaman checking
//   };

//   return (
//     <Card className="p-3 relative">
//       <div className="absolute top-2 right-2 flex gap-3">
//         <div className="flex items-center space-x-1 text-gray-500 text-xs">
//           <Package size={16} />
//           <span>{qty_req}</span>
//         </div>
//         <div className="flex items-center space-x-1 text-gray-500 text-xs">
//           <ScanBarcode size={16} />
//           <span>{qty_pack}</span>
//         </div>
//       </div>
//       <CardContent className="p-0 space-y-1">
//         <div className="text-sm font-semibold">
//           {outbound_no}
//           <span className="ml-2 text-xs text-gray-500 rounded px-2 py-1 w-max mt-1 bg-green-100">
//             {status}
//           </span>
//         </div>
//         <div className="text-sm text-gray-500">{customer_name}</div>
//         <div className="text-sm text-gray-500">{shipment_id}</div>

//         <div className="mt-3 flex gap-2">
//           <Button
//             style={{ display: "" }}
//             // disabled
//             className="w-full"
//             onClick={() => handlePickingClick(outbound_no)}
//           >
//           <ScanBarcode size={16} />
//             Scan Pick List
//           </Button>
//           <Button
//             className="w-full"
//             onClick={() => handleOverrideClick(outbound_no)}
//           >
//           <RefreshCcw size={16} />
//             Override
//           </Button>
//           <Button
//             style={{ display: "none" }}
//             className="w-full"
//             onClick={() => handlePackingClick(outbound_no)}
//           >
//             <Box size={16} />
//             Packing
//           </Button>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
