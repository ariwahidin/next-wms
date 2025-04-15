"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import router from "next/router";

type InboundItem = {
  id: number;
  inbound_no: string;
  supplier_name: string;
  receive_status: string;
  status: "fully received" | "partial" | "open";
};

export default function InboundCard({ data }: { data: InboundItem }) {
  const { inbound_no, supplier_name, receive_status, status } = data;

  const statusColor = {
    "open": "bg-red-100 text-red-600",
    "partial": "bg-yellow-100 text-yellow-600",
    "fully Received": "bg-green-100 text-green-600",
  };

  const handleCheckingClick = (noDO: string) => {
    router.push(`/mobile/inbound/checking/${noDO}`); // Arahkan ke halaman checking
  };

  return (
    <Card className="p-3">
      <CardContent className="p-0 space-y-1">
        <div className="text-sm font-semibold">{inbound_no}</div>
        <div className="text-sm text-gray-500">{supplier_name}</div>
        <div className="text-sm text-gray-400">{receive_status}</div>

        <div
          className={`text-xs rounded px-2 py-1 w-max mt-1 ${statusColor[status]}`}
        >
          {status}
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            className="w-full"
            onClick={() => handleCheckingClick(inbound_no)}
          >
            Checking
          </Button>
          <Button className="w-full">Putaway</Button>
        </div>
      </CardContent>
    </Card>
  );
}
