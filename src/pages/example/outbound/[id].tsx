// pages/outbound/[id].tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type OutboundItem = {
  id: string;
  productId: string;
  qty: number;
  uom: string;
};

type OutboundOrder = {
  id: string;
  customer: string;
  date: string;
  items: OutboundItem[];
};

const products = [
  {
    id: "P001",
    name: "Aqua Galon",
    uoms: [
      { uom: "pcs", conversion: 1, is_base: true },
      { uom: "dus", conversion: 6, is_base: false },
      { uom: "pallet", conversion: 120, is_base: false },
    ],
  },
  {
    id: "P002",
    name: "Indomie Goreng",
    uoms: [
      { uom: "pcs", conversion: 1, is_base: true },
      { uom: "dus", conversion: 40, is_base: false },
      { uom: "pallet", conversion: 1000, is_base: false },
    ],
  },
];

export default function OutboundDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [order, setOrder] = useState<OutboundOrder | null>(null);

  useEffect(() => {
    if (!id) return;

    const stored = localStorage.getItem("outbound_orders");
    if (!stored) return;

    const outboundOrders: OutboundOrder[] = JSON.parse(stored);
    const foundOrder = outboundOrders.find((o) => o.id === id);
    setOrder(foundOrder || null);
  }, [id]);

  if (!order) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p>Loading atau data tidak ditemukan...</p>
        <button
          onClick={() => router.push("/example/outbound")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Kembali ke Daftar Outbound
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Detail Outbound</h1>

      <div className="mb-6">
        <p>
          <strong>Customer:</strong> {order.customer}
        </p>
        <p>
          <strong>Tanggal:</strong> {order.date}
        </p>
      </div>

      <table className="min-w-full border border-gray-300 rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-left">
              Produk
            </th>
            <th className="border border-gray-300 px-4 py-2 text-right">Qty</th>
            <th className="border border-gray-300 px-4 py-2 text-left">
              Satuan
            </th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            return (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">
                  {product?.name || item.productId}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-right">
                  {item.qty}
                </td>
                <td className="border border-gray-300 px-4 py-2">{item.uom}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button
        onClick={() => router.push("/example/outbound")}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Kembali ke Daftar Outbound
      </button>
    </div>
  );
}
