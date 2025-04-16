"use client";

import { useState } from "react";
import PageHeader from "@/components/mobile/PageHeader";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

const dummyHistory = [
  {
    date: "2025-04-16",
    barcode: "ABC123",
    name: "Laptop Asus",
    action: "Transfer",
    from: "Warehouse A",
    to: "IT Department",
    user: "Andi",
  },
  {
    date: "2025-04-15",
    barcode: "XYZ456",
    name: "Keyboard Razer",
    action: "Inbound",
    from: "-",
    to: "Warehouse A",
    user: "Admin",
  },
  {
    date: "2025-04-13",
    barcode: "ABC123",
    name: "Laptop Asus",
    action: "Outbound",
    from: "IT Department",
    to: "-",
    user: "Budi",
  },
];

export default function StockHistoryPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const filteredData = dummyHistory.filter((item) => {
    const matchesSearch =
      item.barcode.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter ? item.action === actionFilter : true;
    return matchesSearch && matchesAction;
  });

  return (
    <>
      <PageHeader title="Stock History" showBackButton />
      <div className="px-4 pt-4 pb-20 min-h-screen bg-gray-50 space-y-4">
        <p className="text-gray-600 mb-2">View stock movement history.</p>

        <Input
          placeholder="Search by barcode or item name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Warehouse A">Warehouse A</SelectItem>
            <SelectItem value="Warehouse B">Warehouse B</SelectItem>
            <SelectItem value="Storefront">Storefront</SelectItem>
          </SelectContent>
        </Select>

        <p className="text-sm text-gray-500">
          {filteredData.length} history record(s) found
        </p>

        {filteredData.map((item, idx) => (
          <Card key={idx} className="p-4 space-y-1">
            <p className="text-sm text-gray-800 font-semibold">{item.name}</p>
            <p className="text-xs text-gray-500">Barcode: {item.barcode}</p>
            <p className="text-xs text-gray-500">Action: {item.action}</p>
            <p className="text-xs text-gray-500">
              From: {item.from} ➝ To: {item.to}
            </p>
            <p className="text-xs text-gray-400">
              {format(new Date(item.date), "dd MMM yyyy")} by {item.user}
            </p>
          </Card>
        ))}
      </div>
    </>
  );
}
