"use client";

import { useState } from "react";
import PageHeader from "@/components/mobile/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";
import { Package, ClipboardCheck, ScanLine, RotateCcw } from "lucide-react";

import { useRouter } from "next/navigation";

type StockTake = {
  ID: number;
  code: string;
  status: string;
  CreatedAt: string;
  total_system_qty: number;
  total_counted_qty: number;
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  closed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[status] || "bg-gray-100 text-gray-600"
      }`}
  >
    {status.replace("_", " ")}
  </span>
);

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
  const [scanValue, setScanValue] = useState("");
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [data, setData] = useState<StockTake[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSearch = async (code: string) => {
    const trimmed = code.trim();
    if (trimmed.length < 3) {
      setError("Minimum 3 characters");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/stock-take/summary", {
        params: { code: trimmed },
        withCredentials: true,
      });
      if (res.data.success) {
        setData(res.data.data);
        setSubmittedCode(trimmed);
      }
    } catch (err) {
      console.error("Fetch failed:", err);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmittedCode(null);
    setData([]);
    setScanValue("");
    setError(null);
  };

// ─── Step 1: no scan yet — show scan/input form ─────────────────────────
  if (!submittedCode) {
    return (
      <>
        <PageHeader title="Cycle Count" showBackButton />
        <div className="min-h-screen bg-gray-50 px-4 pt-4 pb-20 max-w-md mx-auto">
          <div className="flex flex-col items-center justify-center mt-16 space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <ScanLine className="text-gray-400" size={28} />
            </div>
            <p className="text-gray-500 text-sm text-center max-w-xs">
              Scan or enter a cycle count code to begin
            </p>

            <div className="w-full space-y-2">
              <Input
                placeholder="Scan or enter code..."
                value={scanValue}
                autoFocus
                onChange={(e) => setScanValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch(scanValue);
                }}
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <Button
                className="w-full"
                disabled={isLoading}
                onClick={() => handleSearch(scanValue)}
              >
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Step 2: search results ──────────────────────────────────────────
  return (
    <>
      <PageHeader title="Cycle Count" showBackButton />

      <div className="min-h-screen bg-gray-50 px-4 pt-4 pb-20 max-w-md mx-auto">
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">
              Results for "<span className="font-medium text-gray-700">{submittedCode}</span>"
            </p>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-sm text-blue-600"
            >
              <RotateCcw size={14} />
              New scan
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((item) => (
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

              {data.length === 0 && (
                <p className="text-center text-gray-500 mt-8">
                  No stock take found for that code.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
