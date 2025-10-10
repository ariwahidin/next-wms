/* eslint-disable @typescript-eslint/no-explicit-any */
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

    setLoading(true);
    setResults([]);

    try {
      const response = await api.get("/mobile/inventory/by-item/" + search, {
        withCredentials: true,
      });

      // Pastikan struktur response sesuai
      if (response.data && response.data.success) {
        const filtered = response.data.data.map((item: any) => ({
          name: item.item_code,
          barcode: item.barcode,
          location: item.location,
          whs_code: item.whs_code,
          rec_date: item.rec_date,
          qty: item.qty_available,
        }));

        setResults(filtered);
      } else {
        console.warn("Data tidak ditemukan atau response tidak sesuai format");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <PageHeader title="Scan Item" showBackButton />
      <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-24 max-w-md mx-auto">
        <form onSubmit={handleScan}>
          <Input
            placeholder="Entry item code or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2"
          />
                    <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-1 rounded"
          >
            Check
          </button>
        </form>

        {loading && (
          <div className="flex justify-center items-center text-gray-500 text-sm">
            <Loader2 className="animate-spin mr-2 w-4 h-4" />
            Scanning...
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <p className="text-sm text-gray-600 text-center font-medium">
              Total Qty Available: {results.reduce((total, item) => total + item.qty, 0)}
            </p>
            <div className="space-y-3">
              {results.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl shadow-sm p-4 border"
                >
                  <h4 className="font-semibold text-gray-800">{item.name}</h4>
                  <p className="text-sm text-gray-600">
                    Barcode: {item.barcode}
                  </p>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Location: {item.location}</p>
                    <p className="text-sm text-gray-600">Whs Code: {item.whs_code}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600 ">Available: {item.qty} </p>
                    <p className="text-sm text-gray-600 ">Rec Date: {item.rec_date} </p>
                  </div>
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
