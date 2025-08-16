/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import api from "@/lib/api";
import Layout from "@/components/layout";

import { useRouter } from "next/navigation";


// Type definition
type StockTake = {
  ID: number;
  code: string;
  status: string;
  CreatedAt: string;
};

// Component
export default function StockTakePage() {
  const [data, setData] = useState<StockTake[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch stock takes
  const fetchStockTakes = async () => {
    try {
      const res = await api.get("/stock-take", {
        withCredentials: true,
      });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Fetch failed:", err);
    }
  };

  // Generate stock take
  const generateStockTake = async () => {
    setLoading(true);
    try {
      const res = await api.post("/stock-take/generate", null, { withCredentials: true });
      if (res.data.success) {
        await fetchStockTakes(); // reload data
        router.push("/stock-take/list");
      }
    } catch (err) {
      console.error("Generate failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockTakes();
  }, []);

  return (
    <Layout title="Stock Take" subTitle="Generate">
      <Card className="p-4 mt-4 mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-4">
          {/* <h1 className="text-xl font-semibold">Stock Take</h1> */}
          <Button onClick={generateStockTake} disabled={loading}>
            {loading ? "Processing..." : "Generate Stock Take"}
          </Button>
        </div>
      </Card>
    </Layout>
  );
}
