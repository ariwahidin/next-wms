"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import router from "next/router";

type InboundItem = {
  id: string;
  noDO: string;
  supplier: string;
  tanggal: string;
  status: "Belum Diterima" | "Sebagian" | "Selesai";
};

export default function InboundCard({ data }: { data: InboundItem }) {
  const { noDO, supplier, tanggal, status } = data;

  const statusColor = {
    "Belum Diterima": "bg-red-100 text-red-600",
    Sebagian: "bg-yellow-100 text-yellow-600",
    Selesai: "bg-green-100 text-green-600",
  };

  const handleCheckingClick = (noDO: string) => {
    router.push(`/mobile/inbound/checking/${noDO}`); // Arahkan ke halaman checking
  };

  return (
    <Card className="p-3">
      <CardContent className="p-0 space-y-1">
        <div className="text-sm font-semibold">{noDO}</div>
        <div className="text-sm text-gray-500">{supplier}</div>
        <div className="text-sm text-gray-400">{tanggal}</div>

        <div
          className={`text-xs rounded px-2 py-1 w-max mt-1 ${statusColor[status]}`}
        >
          {status}
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            className="w-full"
            onClick={() => handleCheckingClick(noDO)}
          >
            Checking
          </Button>
          <Button className="w-full">Putaway</Button>
        </div>
      </CardContent>
    </Card>
  );
}
