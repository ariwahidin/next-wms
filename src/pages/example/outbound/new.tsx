

import { useState } from "react";
import { useRouter } from "next/router";
import { v4 as uuidv4 } from "uuid";
import { products } from "@/types/example/data/dummy";
import { OutboundItem } from "@/types/example";







export default function OutboundCreatePage() {
  const router = useRouter();

  const [customer, setCustomer] = useState("");
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [items, setItems] = useState<OutboundItem[]>([]);

  // Add new item row
  const addItem = () => {
    setItems([...items, { productId: "", qty: 1, uom: "" }]);
  };

  // Update item
  const updateItem = <K extends keyof OutboundItem> (
    index: number,
    key: K,
    value: OutboundItem[K]
  ) => {
    const newItems = [...items];
    newItems[index][key] = value;
    setItems(newItems);
  };

  // Remove item
  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi sederhana
    if (!customer) {
      alert("Customer harus diisi");
      return;
    }
    if (items.length === 0) {
      alert("Minimal ada 1 produk");
      return;
    }
    for (const item of items) {
      if (!item.productId || item.qty <= 0 || !item.uom) {
        alert("Pastikan semua produk terisi dengan benar");
        return;
      }
    }

    // Ambil data outbound lama
    const stored = localStorage.getItem("outbound_orders");
    const outboundOrders = stored ? JSON.parse(stored) : [];

    // Buat data baru
    const newOrder = {
      id: uuidv4(),
      customer,
      date,
      items: items.map((i) => ({
        id: uuidv4(),
        productId: i.productId,
        qty: i.qty,
        uom: i.uom,
      })),
    };

    // Simpan ke localStorage
    localStorage.setItem(
      "outbound_orders",
      JSON.stringify([...outboundOrders, newOrder])
    );

    // Redirect ke daftar
    router.push("/example/outbound");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Buat Outbound Baru</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-1 font-semibold">Customer</label>
          <input
            type="text"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Tanggal</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Produk</label>
          {items.length === 0 && (
            <p className="text-gray-500">Belum ada produk yang ditambahkan.</p>
          )}
          {items.map((item, idx) => {
            const product = products.find((p) => p.id === item.productId);
            return (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <select
                  value={item.productId}
                  onChange={(e) => updateItem(idx, "productId", e.target.value)}
                  className="border rounded px-2 py-1"
                  required
                >
                  <option value="">-- Pilih Produk --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min={1}
                  value={item.qty}
                  onChange={(e) =>
                    updateItem(idx, "qty", Number(e.target.value))
                  }
                  className="w-20 border rounded px-2 py-1"
                  required
                />

                <select
                  value={item.uom}
                  onChange={(e) => updateItem(idx, "uom", e.target.value)}
                  className="border rounded px-2 py-1"
                  required
                  disabled={!product}
                >
                  <option value="">-- Pilih Satuan --</option>
                  {product?.uoms.map((u) => (
                    <option key={u.uom} value={u.uom}>
                      {u.uom}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-red-600 hover:underline"
                >
                  Hapus
                </button>
              </div>
            );
          })}

          <button
            type="button"
            onClick={addItem}
            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded"
          >
            Tambah Produk
          </button>
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Simpan Outbound
        </button>
      </form>
    </div>
  );
}
