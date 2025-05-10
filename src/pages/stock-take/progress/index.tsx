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
  //   const generateStockTake = async () => {
  //     setLoading(true);
  //     try {
  //       await api.post("/stock-take/generate", null, { withCredentials: true });
  //       await fetchStockTakes(); // reload data
  //     } catch (err) {
  //       console.error("Generate failed:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  useEffect(() => {
    fetchStockTakes();
  }, []);

  return (
    <Layout title="Stock Take" subTitle="Progress">
      <Card className="p-4 mt-4 mx-auto max-w-5xl">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    No stock take found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((stk, index) => (
                  <TableRow
                    key={stk.code}
                    onClick={() =>
                      router.push(`/stock-take/progress/${stk.code}`)
                    }
                    className="hover:bg-muted cursor-pointer"
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{stk.code}</TableCell>
                    <TableCell>{stk.status}</TableCell>
                    <TableCell>
                      {format(new Date(stk.CreatedAt), "yyyy-MM-dd HH:mm")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Layout>
  );
}
