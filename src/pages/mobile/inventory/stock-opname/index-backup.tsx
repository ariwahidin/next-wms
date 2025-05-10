"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/mobile/PageHeader";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


type Item = {
  id: number;
  name: string;
  barcode: string;
  location: string;
  systemQty: number;
  physicalQty: number;
};

const dummyItems: Item[] = [
  {
    id: 1,
    name: "Item A",
    barcode: "1234567890",
    location: "Warehouse A",
    systemQty: 10,
    physicalQty: 0,
  },
  {
    id: 2,
    name: "Item B",
    barcode: "9876543210",
    location: "Warehouse B",
    systemQty: 5,
    physicalQty: 0,
  },
  {
    id: 3,
    name: "Item C",
    barcode: "5678901234",
    location: "Warehouse A",
    systemQty: 8,
    physicalQty: 0,
  },
];

export default function StockOpnamePage() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const draft = localStorage.getItem("stockOpnameDraft");
    if (draft) {
      setItems(JSON.parse(draft));
    } else {
      setItems(dummyItems);
    }
  }, []);

  const handleQtyChange = (id: number, value: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, physicalQty: value } : item
      )
    );
  };

  const handleSaveDraft = () => {
    localStorage.setItem("stockOpnameDraft", JSON.stringify(items));
    alert("Draft disimpan.");
  };

  const handleSubmit = () => {
    localStorage.removeItem("stockOpnameDraft");
    alert("Hasil stock opname berhasil dikirim (simulasi).");
    console.log("Submitted data:", items);
  };

  const handleExportExcel = () => {
    const data = items.map((item) => ({
      Name: item.name,
      Barcode: item.barcode,
      Location: item.location,
      "System Qty": item.systemQty,
      "Physical Qty": item.physicalQty,
      Difference: item.physicalQty - item.systemQty,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Opname");
    XLSX.writeFile(workbook, "stock_opname.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
  
    // Tambahkan judul
    doc.setFontSize(16);
    doc.text("Stock Opname Report", 14, 15);
  
    // Table - Menggunakan autoTable untuk membuat tabel
    autoTable(doc, {
      head: [["Item Name", "Barcode", "Location", "System Qty", "Physical Qty", "Difference"]],
      body: dummyItems.map((item) => [
        item.name,
        item.barcode,
        item.location,
        item.systemQty,
        item.physicalQty,
        item.physicalQty - item.systemQty
      ]),
    });
  
    // Menentukan posisi Y untuk bagian tanda tangan
    const yPositionForSignatures = doc.internal.pageSize.height - 60; // Posisi sebelum bagian tanda tangan
  
    // Nama-nama yang akan menandatangani
    const signatories = ["Person 1", "Person 2", "Person 3"];
  
    // Menambahkan garis untuk tanda tangan
    signatories.forEach((name, index) => {
      const yPosition = yPositionForSignatures + index * 20; // Menambahkan jarak antar garis
      doc.text(name, 14, yPosition); // Menulis nama orang yang menandatangani
      doc.line(50, yPosition + 2, 150, yPosition + 2); // Garis tanda tangan
    });
  
    // Simpan file PDF
    doc.save("stock-opname.pdf");
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Stock Opname" showBackButton />
      <div className="px-4 pt-4 pb-20 min-h-screen bg-gray-50">
        <Input
          placeholder="Search item..."
          className="mb-4"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {filteredItems.length > 0 && (
          <p className="text-sm text-gray-500 mb-3">
            {filteredItems.length} item{filteredItems.length > 1 && "s"} found
          </p>
        )}

        <div className="space-y-4">
          {filteredItems.map((item) => {
            const difference = item.physicalQty - item.systemQty;
            const differenceColor =
              difference === 0
                ? "text-green-600"
                : difference > 0
                ? "text-blue-600"
                : "text-red-600";

            return (
              <Card key={item.id} className="p-4">
                <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                <p className="text-sm text-gray-500">Barcode: {item.barcode}</p>
                <p className="text-sm text-gray-500 mb-2">
                  Location: {item.location}
                </p>
                <div className="flex items-center justify-between gap-4 mb-2">
                  <p className="text-sm text-gray-700">
                    System Qty: {item.systemQty}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Physical:</span>
                    <Input
                      type="number"
                      className="w-20"
                      value={item.physicalQty}
                      onChange={(e) =>
                        handleQtyChange(item.id, Number(e.target.value))
                      }
                    />
                  </div>
                </div>
                <p className={`text-sm font-medium ${differenceColor}`}>
                  Difference: {difference}
                </p>
              </Card>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <p className="text-center text-gray-500 mt-8">No items found.</p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <Button onClick={handleSaveDraft} variant="outline">
            Simpan sebagai Draft
          </Button>
          <Button onClick={handleSubmit} variant="default">
            Submit Stock Opname
          </Button>
          <Button onClick={handleExportExcel} variant="outline">
            Export ke Excel
          </Button>
          <Button onClick={handleExportPDF} variant="outline">
            Export ke PDF
          </Button>
        </div>
      </div>
    </>
  );
}
