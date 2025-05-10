"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

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

export default function StockTakePrintPage() {
  const params = useParams();
  const id = params?.id ? String(params.id) : null;
  const [items, setItems] = useState<StockTakeItem[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchItems = async () => {
      try {
        const res = await api.get(`/stock-take/${id}`, {
          withCredentials: true,
        });
        if (res.data.success) {
          setItems(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch detail:", err);
      }
    };

    fetchItems();

    // optional: auto print
    setTimeout(() => {
      window.print();
    }, 1000);
  }, [id]);

  return (
    <div className="p-6 text-black text-sm">
      <h1 className="text-xl font-bold text-center mb-2">STOCK TAKE REPORT</h1>
      <p className="text-center mb-4">Stock Take ID: {id}</p>

      <table className="w-full border border-black border-collapse text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-black px-2 py-1">No.</th>
            <th className="border border-black px-2 py-1">Location</th>
            <th className="border border-black px-2 py-1">Pallet</th>
            <th className="border border-black px-2 py-1">Barcode</th>
            <th className="border border-black px-2 py-1">System Qty</th>
            <th className="border border-black px-2 py-1">Counted Qty</th>
            <th className="border border-black px-2 py-1">Diff</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.ID}>
              <td className="border border-black px-2 py-1">{index + 1}</td>
              <td className="border border-black px-2 py-1">{item.Location}</td>
              <td className="border border-black px-2 py-1">{item.Pallet}</td>
              <td className="border border-black px-2 py-1">{item.Barcode}</td>
              <td className="border border-black px-2 py-1">
                {item.SystemQty}
              </td>
              <td className="border border-black px-2 py-1">
                {item.CountedQty}
              </td>
              <td className="border border-black px-2 py-1">
                {item.Difference}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-10 flex justify-between">
        <div>
          <p>Petugas:</p>
          <br />
          <p>_____________________</p>
        </div>
        <div>
          <p>Tanggal:</p>
          <br />
          <p>_____________________</p>
        </div>
      </div>
    </div>
  );
}
