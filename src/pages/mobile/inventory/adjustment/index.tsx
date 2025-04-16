"use client";

import { useState } from "react";
import PageHeader from "@/components/mobile/PageHeader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type Item = {
  id: number;
  name: string;
  barcode: string;
  location: string;
  systemQty: number;
};

const dummyItems: Item[] = [
  {
    id: 1,
    name: "Item A",
    barcode: "1234567890",
    location: "Rak A1",
    systemQty: 10,
  },
  {
    id: 2,
    name: "Item B",
    barcode: "0987654321",
    location: "Rak B2",
    systemQty: 5,
  },
];

export default function StockAdjustmentPage() {
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [newQty, setNewQty] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [adjustedItems, setAdjustedItems] = useState<any[]>([]);

  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => {
      const found = dummyItems.find(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.barcode.includes(search)
      );
      setSelectedItem(found || null);
      setLoading(false);
    }, 1000);
  };

  const handleSubmit = () => {
    if (!selectedItem || newQty === "") return;

    const adjusted = {
      ...selectedItem,
      newQty: parseInt(newQty),
      note,
    };

    setAdjustedItems([...adjustedItems, adjusted]);
    setSelectedItem(null);
    setNewQty("");
    setNote("");
    setSearch("");
  };

  return (
    <>
      <PageHeader title="Stock Adjustment" showBackButton />
      <div className="px-4 pt-4 pb-28 min-h-screen bg-gray-50">
        <div className="mb-4 space-y-2">
          <Input
            placeholder="Search by item name or barcode"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button onClick={handleSearch} className="w-full">
            Search Item
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center my-6 text-gray-600">
            <Loader2 className="animate-spin mr-2" size={20} />
            Loading item...
          </div>
        )}

        {selectedItem && (
          <Card className="p-4 mb-6 space-y-3">
            <div>
              <p className="font-semibold text-lg">{selectedItem.name}</p>
              <p className="text-sm text-gray-500">Barcode: {selectedItem.barcode}</p>
              <p className="text-sm text-gray-500">Location: {selectedItem.location}</p>
              <p className="text-sm text-gray-500">
                Current Qty: <span className="font-medium">{selectedItem.systemQty}</span>
              </p>
            </div>

            <Input
              type="number"
              placeholder="New Qty"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
            />
            <Textarea
              placeholder="Adjustment reason"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button className="w-full" onClick={handleSubmit}>
              Submit Adjustment
            </Button>
          </Card>
        )}

        {adjustedItems.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              {adjustedItems.length} item{adjustedItems.length > 1 && "s"} adjusted
            </p>
            {adjustedItems.map((item, idx) => (
              <Card key={idx} className="p-3">
                <div className="font-semibold">{item.name}</div>
                <p className="text-sm text-gray-500">Barcode: {item.barcode}</p>
                <p className="text-sm text-gray-500">From: {item.systemQty} → To: {item.newQty}</p>
                <p className="text-sm text-gray-500">Location: {item.location}</p>
                <p className="text-sm text-gray-500">Note: {item.note}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
