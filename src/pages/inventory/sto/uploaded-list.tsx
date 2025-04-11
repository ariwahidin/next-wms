"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const dummyData = [
  {
    id: 1,
    kodeLokasi: "LOC-001",
    kodeBarang: "BRG-123",
    serialNumber: "SN001",
    jumlahFisik: 10,
    catatan: "OK",
    createdAt: "2024-08-01T10:00:00",
    oleh: "Tim A"
  },
  {
    id: 2,
    kodeLokasi: "LOC-002",
    kodeBarang: "BRG-456",
    serialNumber: "SN002",
    jumlahFisik: 5,
    catatan: "Rusak",
    createdAt: "2024-08-02T14:00:00",
    oleh: "Tim B"
  },
  {
    id: 3,
    kodeLokasi: "LOC-001",
    kodeBarang: "BRG-789",
    serialNumber: "SN003",
    jumlahFisik: 20,
    catatan: "",
    createdAt: "2024-08-03T08:00:00",
    oleh: "Tim A"
  },
];

export default function UploadedList() {
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState(dummyData);

  useEffect(() => {
    const s = search.toLowerCase();
    const result = dummyData.filter(
      (item) =>
        item.kodeBarang.toLowerCase().includes(s) ||
        item.kodeLokasi.toLowerCase().includes(s) ||
        item.serialNumber.toLowerCase().includes(s) ||
        item.catatan.toLowerCase().includes(s)
    );
    setFiltered(result);
  }, [search]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Cari kode lokasi / barang / serial"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
      />
      {filtered.length === 0 && (
        <p className="text-sm text-gray-500">Data tidak ditemukan.</p>
      )}
      {filtered.map((item) => (
        <Card key={item.id} className="p-4 space-y-1 text-sm">
          <div className="font-semibold">
            {item.kodeLokasi} • {item.kodeBarang}
          </div>
          <div>SN: {item.serialNumber}</div>
          <div>Qty: {item.jumlahFisik}</div>
          {item.catatan && <div>Catatan: {item.catatan}</div>}
          <div className="text-xs text-gray-500">
            Oleh {item.oleh} • {new Date(item.createdAt).toLocaleString()}
          </div>
        </Card>
      ))}
    </div>
  );
}
