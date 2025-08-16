"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InboundItem } from "@/types/inbound";
import { Package, BoxesIcon, ScanBarcode } from "lucide-react"; // Import icon
import router from "next/router";



export default function InboundCard({ data }: { data: InboundItem }) {
  const {
    inbound_no,
    supplier_name,
    receipt_id,
    receive_status,
    req_qty,
    qty_stock,
    scan_qty,
    status,
  } = data;

  const handleCheckingClick = (noDO: string) => {
    router.push(`/mobile/inbound/checking/${noDO}`);
  };
  const handlePutawayClick = (noDO: string) => {
    router.push(`/mobile/inbound/putaway/${noDO}`);
  };

  return (
    <Card className="p-3 relative">
      <div className="absolute top-2 right-2 flex gap-3">
        <div className="flex items-center space-x-1 text-gray-500 text-xs">
          <Package size={16} />
          <span>{req_qty}</span>
        </div>
        <div className="flex items-center space-x-1 text-gray-500 text-xs">
          <ScanBarcode size={16} />
          <span>{scan_qty}</span>
        </div>
        <div className="flex items-center space-x-1 text-gray-500 text-xs">
          <BoxesIcon size={16} />
          <span>{qty_stock}</span>
        </div>
      </div>

      <CardContent className="p-0 space-y-1 pt-6" style={{ height: "100px" }}>
        <div className="absolute top-2">
          <div className="text-sm font-semibold">
            {inbound_no}
            <span className="ml-2 text-xs text-gray-500 rounded px-2 py-1 w-max mt-1 bg-green-100">
              {status}
            </span>
          </div>
          <div className="text-sm text-gray-500">{supplier_name}</div>
          <div className="text-sm text-gray-500">{receipt_id}</div>
          <div className="text-sm text-gray-400">{receive_status}</div>
        </div>
        <div className="pt-9">
          <Button
            className="w-full"
            onClick={() => handleCheckingClick(inbound_no)}
          >
            Checking
          </Button>
          <Button
            style={{ display: "none" }}
            className="w-100"
            onClick={() => handlePutawayClick(inbound_no)}
          >
            Putaway
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
