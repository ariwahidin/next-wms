"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/mobile/PageHeader";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";

import { useRouter } from "next/navigation"; // Pastikan import ini ditambahkan

type StockTake = {
  ID: number;
  code: string;
  status: string;
  CreatedAt: string;
};

export default function StockOpnamePage() {
  const [search, setSearch] = useState("");
  const [data, setData] = useState<StockTake[]>([]);
  const [isLoading, setLoading] = useState(true);
  // Di dalam komponen:
  const router = useRouter();

  const fetchStockTakes = async () => {
    try {
      const res = await api.get("/stock-take", {
        withCredentials: true,
      });
      if (res.data.success) {
        setLoading(false);
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchStockTakes();
  }, []);

  const filteredItems = data.filter((item) =>
    item.code.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Stock Opname" showBackButton />

      <div className="min-h-screen bg-gray-50 px-4 pt-4 pb-20 max-w-md mx-auto">
        <div className="space-y-3">
          <Input
            placeholder="Search STO..."
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
              return (
                <Card
                  key={item.ID}
                  className="p-4"
                  onClick={() =>
                    router.push(`/mobile/inventory/stock-opname/${item.code}`)
                  }
                >
                  <h3 className="font-semibold text-lg mb-1">{item.code}</h3>
                  <p className="text-sm text-gray-500">{item.status}</p>
                </Card>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <p className="text-center text-gray-500 mt-8">No items found.</p>
          )}
        </div>
      </div>
    </>
  );
}
