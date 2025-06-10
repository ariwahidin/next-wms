"use client";

import { useEffect, useState } from "react";
import { InboundOrder } from "@/types/example/index";
import { products } from "@/types/example/data/dummy";

export default function InboundListPage() {
  const [inbounds, setInbounds] = useState<InboundOrder[]>([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("inbound_orders") || "[]");
    setInbounds(data);
  }, []);

  const handleDelete = (id: string) => {
    if (!confirm("Yakin ingin menghapus inbound order ini?")) return;
    const updated = inbounds.filter((order) => order.id !== id);
    setInbounds(updated);
    localStorage.setItem("inbound_orders", JSON.stringify(updated));
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Daftar Inbound Orders</h1>

      {inbounds.length === 0 && <p>Belum ada inbound order.</p>}

      <ul>
        {inbounds.map((order) => (
          <li key={order.id} className="border rounded p-3 mb-3">
            <div className="flex justify-between mb-2">
              <div>
                <strong>Tanggal:</strong> {order.date} <br />
                <strong>Supplier:</strong> {order.supplier}
              </div>
              <button
                onClick={() => handleDelete(order.id)}
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                Hapus
              </button>
            </div>

            <table className="w-full border-collapse border">
              <thead>
                <tr>
                  <th className="border p-1 text-left">Produk</th>
                  <th className="border p-1 text-right">Qty</th>
                  <th className="border p-1 text-left">UOM</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => {
                  const p = products.find((prod) => prod.id === item.productId);
                  return (
                    <tr key={item.id}>
                      <td className="border p-1">{p?.name || "Unknown"}</td>
                      <td className="border p-1 text-right">{item.qty}</td>
                      <td className="border p-1">{item.uom}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </li>
        ))}
      </ul>
    </div>
  );
}
