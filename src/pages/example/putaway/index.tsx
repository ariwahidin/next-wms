"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { InboundOrder } from "@/types/example/index";

export default function PutawayListPage() {
  const [inbounds, setInbounds] = useState<InboundOrder[]>([]);

  useEffect(() => {
    const data: InboundOrder[] = JSON.parse(
      localStorage.getItem("inbound_orders") || "[]"
    );
    // Filter inbound order yang statusnya 'open', jika tidak ada status anggap semua open
    const filtered = data.filter(
      (order) => order.status === "open" || !order.status
    );
    setInbounds(filtered);
  }, []);

  if (inbounds.length === 0) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">
          Daftar Inbound untuk Putaway
        </h1>
        <p>Tidak ada inbound order yang perlu diputaway.</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Daftar Inbound untuk Putaway</h1>
      <ul>
        {inbounds.map((order) => (
          <li
            key={order.id}
            className="border rounded p-3 mb-3 flex justify-between items-center"
          >
            <div>
              <div>
                <strong>ID:</strong> {order.id}
              </div>
              <div>
                <strong>Tanggal:</strong> {order.date}
              </div>
              <div>
                <strong>Supplier:</strong> {order.supplier}
              </div>
            </div>
            <Link
              href={`/example/putaway/${order.id}`}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Proses Putaway
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
