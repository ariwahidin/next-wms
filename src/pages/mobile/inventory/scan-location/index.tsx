"use client";

import { useState } from "react";
import PageHeader from "@/components/mobile/PageHeader";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function ScanItemPage() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!search.trim()) return;

    try {
      setLoading(true);
      const response = await api.get(
        "/mobile/inventory/location/" + search,
        {
          withCredentials: true,
        }
      );
      const data = await response.data;

      if (data.success) {
        const filtered = data.data.map((item: any) => ({
          name: item.item_code,
          barcode: item.barcode,
          location: item.location,
          qty: item.qty_available,
        }));
        setResults(filtered);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }

    // setLoading(true);
    // setResults([]);

    // // Simulasi delay scan (misalnya call API)
    // setTimeout(() => {
    //   setLoading(false);
    //   // Data dummy hasil scan
    //   const dummyData = [
    //     {
    //       name: "Item A",
    //       barcode: "ABC123456",
    //       location: "YMK001",
    //       qty: 10,
    //     },
    //     {
    //       name: "Item B",
    //       barcode: "XYZ987654",
    //       location: "YMI001",
    //       qty: 5,
    //     },
    //   ];

    //   // Filter jika search bukan barcode kosong
    //   const filtered = dummyData.filter((item) =>
    //     item.location.toLowerCase().includes(search.toLowerCase())
    //   );

    //   setResults(filtered);
    // }, 1500);
  };

  return (
    <>
      <PageHeader title="Scan Location" showBackButton />
      <div className="px-4 pt-4 pb-20 min-h-screen bg-gray-50 space-y-4">
        <form onSubmit={handleScan}>
          <Input
            placeholder="Scan or search location"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2"
          />
        </form>

        {loading && (
          <div className="flex justify-center items-center text-gray-500 text-sm">
            <Loader2 className="animate-spin mr-2 w-4 h-4" />
            Scanning...
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <p className="text-sm text-gray-600 font-medium">
              {results.length} {results.length === 1 ? "item" : "items"} found
            </p>
            <div className="space-y-3">
              {results.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl shadow-sm p-4 border"
                >
                  <h3 className="font-semibold text-gray-800">{item.name}</h3>
                  <p className="text-sm text-gray-600">
                    Barcode: {item.barcode}
                  </p>
                  <p className="text-sm text-gray-600">
                    Location: {item.location}
                  </p>
                  <p className="text-sm text-gray-600">Quantity: {item.qty}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && !results.length && (
          <p className="text-center text-gray-400 text-sm">
            No items scanned yet.
          </p>
        )}
      </div>
    </>
  );
}
