"use client";

import { useState } from "react";
import PageHeader from "@/components/mobile/PageHeader";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const dummyStockData = [
  { code: "ITM001", name: "Laptop Lenovo", start: 10, in: 5, out: 3 },
  { code: "ITM002", name: "Printer Canon", start: 15, in: 2, out: 4 },
  { code: "ITM003", name: "Router TP-Link", start: 8, in: 4, out: 1 },
];

export default function StockReportPage() {
  const [search, setSearch] = useState("");

  const filteredData = dummyStockData.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Stock Report" showBackButton />
      <div className="px-4 pt-4 pb-20 min-h-screen bg-gray-50">
        <div className="mb-4">
          <Input
            placeholder="Search item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>In</TableHead>
                <TableHead>Out</TableHead>
                <TableHead>Final</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item, index) => (
                <TableRow key={item.code}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.start}</TableCell>
                  <TableCell>{item.in}</TableCell>
                  <TableCell>{item.out}</TableCell>
                  <TableCell>{item.start + item.in - item.out}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
