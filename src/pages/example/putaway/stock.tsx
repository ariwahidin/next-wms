"use client";

import React, { useEffect, useState } from "react";
import { products } from "@/types/example/data/dummy";

type Stock = {
  productId: string;
  location: string;
  totalQty: number;
};

type PutawayItem = {
  id: string;
  productId: string;
  qtyBaseUnit: number;
  location: string;
};

type PutawayRecord = {
  id: string;
  inboundOrderId: string;
  date: string;
  items: PutawayItem[];
};

export default function StockPage() {
  const [stockData, setStockData] = useState<Stock[]>([]);

  useEffect(() => {
    const recordsRaw = localStorage.getItem("putaway_records");
    if (!recordsRaw) return;

    const records: PutawayRecord[] = JSON.parse(recordsRaw);
    const stockMap = new Map<string, Stock>();

    records.forEach((record) => {
      record.items.forEach((item) => {
        const key = `${item.productId}_${item.location}`;
        if (!stockMap.has(key)) {
          stockMap.set(key, {
            productId: item.productId,
            location: item.location,
            totalQty: 0,
          });
        }
        const existing = stockMap.get(key)!;
        existing.totalQty += item.qtyBaseUnit;
      });
    });

    setStockData(Array.from(stockMap.values()));
  }, []);

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.name : "Unknown";
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Stok Akhir per Lokasi</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="py-3 px-4 border-b">Produk</th>
              <th className="py-3 px-4 border-b">Lokasi</th>
              <th className="py-3 px-4 border-b text-right">Qty (Base Unit)</th>
            </tr>
          </thead>
          <tbody>
            {stockData.map((stock, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="py-3 px-4 border-b">
                  {getProductName(stock.productId)}
                </td>
                <td className="py-3 px-4 border-b">{stock.location}</td>
                <td className="py-3 px-4 border-b text-right">
                  {stock.totalQty}
                </td>
              </tr>
            ))}
            {stockData.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-6 text-gray-500">
                  Belum ada data stok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
