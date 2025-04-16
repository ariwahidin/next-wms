"use client";

import { useState } from "react";
import PageHeader from "@/components/mobile/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Data dummy untuk barang dan lokasi
const items = [
  { label: "Sepatu Kets", barcode: "SKU12345", stock: 150 },
  { label: "Tas Punggung", barcode: "SKU67890", stock: 120 },
  { label: "Kemeja Pria", barcode: "SKU11223", stock: 200 },
];

const locations = ["Gudang A", "Gudang B", "Gudang C"];

export default function LocationTransferPage() {
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedFromLocation, setSelectedFromLocation] = useState("");
  const [selectedToLocation, setSelectedToLocation] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [message, setMessage] = useState("");
  const [barcode, setBarcode] = useState<string>("");

  // Fungsi untuk menangani pemindahan stok
  const handleTransfer = () => {
    if (!selectedItem || !selectedFromLocation || !selectedToLocation || quantity <= 0) {
      setMessage("Pastikan semua kolom diisi dengan benar.");
      return;
    }

    const item = items.find(item => item.barcode === barcode);
    if (item && quantity <= item.stock) {
      item.stock -= quantity; // Mengurangi stok di lokasi asal
      setMessage(`Berhasil memindahkan ${quantity} ${item.label} dari ${selectedFromLocation} ke ${selectedToLocation}.`);
    } else {
      setMessage("Jumlah yang dipindahkan melebihi stok yang tersedia.");
    }
  };

  // Fungsi untuk menangani input barcode
  const handleBarcodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const scannedBarcode = e.target.value;
    setBarcode(scannedBarcode);

    // Mencari item berdasarkan barcode
    const foundItem = items.find(item => item.barcode === scannedBarcode);
    if (foundItem) {
      setSelectedItem(foundItem.label); // Mengisi otomatis nama barang berdasarkan barcode
    } else {
      setMessage("Barang tidak ditemukan.");
    }
  };

  return (
    <>
      <PageHeader title="Location Transfer" showBackButton />
      <div className="px-4 pt-4 pb-20 min-h-screen bg-gray-50">
        <p className="text-gray-600 mb-4">Pindahkan barang antar lokasi.</p>

        {/* Input Barcode Manual */}
        <div className="mb-4">
          <Input
            type="text"
            value={barcode}
            onChange={handleBarcodeInput}
            placeholder="Scan Barcode"
          />
        </div>

        <div className="mb-4">
          <Select value={selectedFromLocation} onValueChange={setSelectedFromLocation}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih Lokasi Asal" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location, idx) => (
                <SelectItem key={idx} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mb-4">
          <Select value={selectedToLocation} onValueChange={setSelectedToLocation}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih Lokasi Tujuan" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location, idx) => (
                <SelectItem key={idx} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mb-4">
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
            placeholder="Jumlah yang Dipindahkan"
          />
        </div>

        <Button onClick={handleTransfer} className="w-full">Pindahkan Barang</Button>

        {message && <p className="mt-4 text-center text-gray-600">{message}</p>}
      </div>
    </>
  );
}
