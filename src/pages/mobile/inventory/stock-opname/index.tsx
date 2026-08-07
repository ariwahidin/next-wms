"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/mobile/PageHeader";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";
import { Package, ClipboardCheck } from "lucide-react";

import { useRouter } from "next/navigation";

type StockTake = {
  ID: number;
  code: string;
  status: string;
  CreatedAt: string;
  total_system_qty: number;
  total_counted_qty: number;
};

// ─── Status badge (biar konsisten & gampang di-scan mata) ────────────────────

const STATUS_STYLES: Record<string, string> = {
  open: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  closed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
      STATUS_STYLES[status] || "bg-gray-100 text-gray-600"
    }`}
  >
    {status.replace("_", " ")}
  </span>
);

// ─── Qty summary — minimalis, dua angka + icon, gak makan tempat ─────────────

const QtySummary = ({ systemQty, countedQty }: { systemQty: number; countedQty: number }) => (
  <div className="flex items-center gap-4 mt-2 text-sm">
    <div className="flex items-center gap-1.5 text-gray-500">
      <Package size={14} />
      <span>
        System: <span className="font-medium text-gray-700">{systemQty}</span>
      </span>
    </div>
    <div className="flex items-center gap-1.5 text-gray-500">
      <ClipboardCheck size={14} />
      <span>
        Counted: <span className="font-medium text-gray-700">{countedQty}</span>
      </span>
    </div>
  </div>
);

export default function StockOpnamePage() {
  const [search, setSearch] = useState("");
  const [data, setData] = useState<StockTake[]>([]);
  const [isLoading, setLoading] = useState(true);
  const router = useRouter();

  const fetchStockTakes = async () => {
    try {
      const res = await api.get("/stock-take/summary", {
        withCredentials: true,
      });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
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
      <PageHeader title="Cycle Count" showBackButton />

      <div className="min-h-screen bg-gray-50 px-4 pt-4 pb-20 max-w-md mx-auto">
        <div className="space-y-3">
          <Input
            placeholder="Search Cycle Count..."
            className="mb-4"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {filteredItems.length > 0 && (
            <p className="text-sm text-gray-500 mb-3">
              {filteredItems.length} item{filteredItems.length > 1 && "s"} found
            </p>
          )}

          <div className="space-y-3">
            {filteredItems.map((item) => (
              <Card
                key={item.ID}
                className="p-4 cursor-pointer active:bg-gray-50 transition-colors"
                onClick={() =>
                  router.push(`/mobile/inventory/stock-opname/${item.code}`)
                }
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{item.code}</h3>
                  <StatusBadge status={item.status} />
                </div>
                <QtySummary
                  systemQty={item.total_system_qty}
                  countedQty={item.total_counted_qty}
                />
              </Card>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <p className="text-center text-gray-500 mt-8">No items found.</p>
          )}
        </div>
      </div>
    </>
  );
}