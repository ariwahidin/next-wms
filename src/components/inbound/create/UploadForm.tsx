"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";
import router from "next/router";

interface InboundRow {
  Date: string;
  Invoice: string;
  SupplierCode: string;
  ItemCode: string;
  Barcode: string;
  Qty: number;
}

export default function UploadForm() {
  const [data, setData] = useState<InboundRow[]>([]);
  const [fileName, setFileName] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(ws) as InboundRow[];
      setData(jsonData);
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async () => {
    const res = await api.post("/inbound/upload", data, { withCredentials: true });
    console.log(res);

    if (res.data.success) {
      eventBus.emit("showAlert", {
        title: "Success!",
        description: res.data.message,
        type: "success",
      })
      router.push("/inbound/list");
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
          <Input type="file" accept=".xlsx" onChange={handleFileUpload} />
          {fileName && (
            <span className="text-sm text-gray-600">{fileName}</span>
          )}
        </div>

        {data.length > 0 && (
          <>
            <div className="max-h-96 overflow-auto border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>ItemCode</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.Date}</TableCell>
                      <TableCell>{row.Invoice}</TableCell>
                      <TableCell>{row.SupplierCode}</TableCell>
                      <TableCell>{row.ItemCode}</TableCell>
                      <TableCell>{row.Barcode}</TableCell>
                      <TableCell>{row.Qty}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button className="mt-4" onClick={handleSubmit}>
              Submit
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
