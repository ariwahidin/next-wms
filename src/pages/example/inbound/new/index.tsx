"use client";

import { useState } from "react";
import { products } from "@/types/example/data/dummy";
import { InboundOrder, InboundItem, UOM } from "@/types/example/index";
import { v4 as uuidv4 } from "uuid";

export default function InboundNewPage() {
  const [date, setDate] = useState("");
  const [supplier, setSupplier] = useState("");
  const [items, setItems] = useState<InboundItem[]>([]);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState(1);
  const [uom, setUom] = useState<UOM>("pcs");

  const handleAddItem = () => {
    if (!selectedProduct || !qty) return;

    const newItem: InboundItem = {
      id: uuidv4(),
      productId: selectedProduct,
      qty,
      uom,
    };

    setItems([...items, newItem]);
    setQty(1);
    setUom("pcs");
  };

  const handleSave = () => {
    const order: InboundOrder = {
      id: uuidv4(),
      date,
      supplier,
      status: "open",
      items,
    };

    const existing = JSON.parse(localStorage.getItem("inbound_orders") || "[]");
    localStorage.setItem(
      "inbound_orders",
      JSON.stringify([...existing, order])
    );

    alert("Inbound order saved!");
    setDate("");
    setSupplier("");
    setItems([]);
  };

  const selectedProductData = products.find((p) => p.id === selectedProduct);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Inbound Order Baru</h1>

      <div className="mb-2">
        <label className="block">Tanggal</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border p-1 w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block">Supplier</label>
        <input
          type="text"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          className="border p-1 w-full"
        />
      </div>

      <hr className="my-4" />

      <h2 className="text-xl font-semibold mb-2">Tambah Item</h2>

      <div className="flex gap-2 mb-2">
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          className="border p-1 w-full"
        >
          <option value="">Pilih Produk</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="border p-1 w-20"
          placeholder="Qty"
        />

        <select
          value={uom}
          onChange={(e) => setUom(e.target.value as UOM)}
          className="border p-1 w-28"
        >
          {selectedProductData?.uoms.map((u) => (
            <option key={u.uom} value={u.uom}>
              {u.uom}
            </option>
          ))}
        </select>

        <button
          onClick={handleAddItem}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Tambah
        </button>
      </div>

      <ul className="mb-4">
        {items.map((item) => {
          const p = products.find((x) => x.id === item.productId);
          return (
            <li key={item.id} className="border p-2 my-1">
              {p?.name} - {item.qty} {item.uom}
            </li>
          );
        })}
      </ul>

      <button
        onClick={handleSave}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Simpan Inbound
      </button>
    </div>
  );
}
