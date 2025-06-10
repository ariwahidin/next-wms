// pages/outbound/index.tsx
import { useEffect, useState } from "react";
import Link from "next/link";

type OutboundItem = {
  id: string;
  productId: string;
  qty: number;
  uom: string;
};

type OutboundOrder = {
  id: string;
  date: string;
  customer: string;
  items: OutboundItem[];
};

export default function OutboundListPage() {
  const [outboundOrders, setOutboundOrders] = useState<OutboundOrder[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("outbound_orders");
    if (stored) {
      setOutboundOrders(JSON.parse(stored));
    }
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Daftar Outbound Orders</h1>

      {outboundOrders.length === 0 ? (
        <p className="text-gray-500">Belum ada outbound order.</p>
      ) : (
        <table className="w-full border border-gray-300 rounded-md overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border-b border-gray-300 text-left">ID</th>
              <th className="p-3 border-b border-gray-300 text-left">
                Tanggal
              </th>
              <th className="p-3 border-b border-gray-300 text-left">
                Customer
              </th>
              <th className="p-3 border-b border-gray-300 text-left">
                Jumlah Item
              </th>
              <th className="p-3 border-b border-gray-300 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {outboundOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="p-3 border-b border-gray-300">{order.id}</td>
                <td className="p-3 border-b border-gray-300">{order.date}</td>
                <td className="p-3 border-b border-gray-300">
                  {order.customer}
                </td>
                <td className="p-3 border-b border-gray-300">
                  {order.items.length}
                </td>
                <td className="p-3 border-b border-gray-300">
                  <Link
                    href={`/example/outbound/${order.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Detail
                  </Link>
                  <Link
                    href={`/example/outbound/pick/${order.id}`}
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    Pick
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
