/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OutboundItem } from "@/types/outbound";
import { Package, ScanBarcode } from "lucide-react";
import router from "next/router";


export default function OutboundCard({ data }: { data: OutboundItem }) {
  const { outbound_no, customer_name, status, qty_req, qty_scan, qty_pack, delivery_no } = data;
  
  // const statusColor = {
  //   "open": "bg-red-100 text-red-600",
  //   "partial": "bg-yellow-100 text-yellow-600",
  //   "fully Received": "bg-green-100 text-green-600",
  // };

  const handlePickingClick = (outbound_no: string) => {
    router.push(`/mobile/outbound/picking/${outbound_no}`); // Arahkan ke halaman checking
  };
  const handlePackingClick = (outbound_no: string) => {
    router.push(`/mobile/outbound/packing/${outbound_no}`); // Arahkan ke halaman checking
  };

  return (
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
        <div className="text-sm font-semibold">{outbound_no}
        <span className="ml-2 text-xs text-gray-500 rounded px-2 py-1 w-max mt-1 bg-green-100">{status}</span>
        </div>
        <div className="text-sm text-gray-500">{customer_name}</div>
        <div className="text-sm text-gray-500">{delivery_no}</div>

        <div className="mt-3 flex gap-2">
          <Button
            style={{ display: "none" }}
            disabled
            className="w-full"
            onClick={() => handlePickingClick(outbound_no)}
          >
            Picking
          </Button>
          <Button className="w-full" onClick={() => handlePackingClick(outbound_no)}>Packing</Button>
        </div>
      </CardContent>
    </Card>
  );
}
