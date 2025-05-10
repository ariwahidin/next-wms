/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import api from "@/lib/api";
import Layout from "@/components/layout";
import { useRouter } from 'next/router';

type StockTakeItem = {
  ID: number;
  ProductID: number;
  Location: string;
  Pallet: string;
  Barcode: string;
  SerialNumber: string;
  SystemQty: number;
  CountedQty: number;
  Difference: number;
  Notes: string;
};

export default function StockTakeDetailPage() {
  const params = useParams();
  // const id = params.id as string | null;
  const router = useRouter();
  const { id } = router.query;

  const [items, setItems] = useState<StockTakeItem[]>([]);

  const fetchItems = async () => {
    try {
      const res = await api.get(`/stock-take/${id}`, { withCredentials: true });
      if (res.data.success) {
        setItems(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch detail:", err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchItems();
    }
  }, [id]);

  return (
    <Layout title="Stock Take Detail" subTitle={`ID: ${id}`}>
      <Card className="p-4 mt-4 mx-auto max-w-5xl">
        <CardHeader>
          <a
            href={`/stock-take/print/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 w-40 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Print Stock Take
          </a>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Pallet</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>System Qty</TableHead>
                <TableHead>Counted Qty</TableHead>
                <TableHead>Diff</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No item found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <TableRow key={item.ID}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.Location}</TableCell>
                    <TableCell>{item.Pallet}</TableCell>
                    <TableCell>{item.Barcode}</TableCell>
                    <TableCell>{item.SystemQty}</TableCell>
                    <TableCell>{item.CountedQty}</TableCell>
                    <TableCell>{item.Difference}</TableCell>
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
