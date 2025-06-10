"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import {
  InboundOrder,
  PutawayRecord,
  PutawayItem,
} from "@/types/example/index";
import { products } from "@/types/example/data/dummy";
import { v4 as uuidv4 } from "uuid";

// Fungsi konversi qty ke base unit
function convertToBaseUnit(
  productId: string,
  qty: number,
  uom: string
): number {
  const product = products.find((p) => p.id === productId);
  if (!product) return 0;
  const uomData = product.uoms.find((u) => u.uom === uom);
  if (!uomData) return 0;
  return qty * uomData.conversion;
}

export default function PutawayFormPage() {
  // const { id } = params;
  // const router = useRouter();

  const router = useRouter();
  const { id } = router.query;

  const [inbound, setInbound] = useState<InboundOrder | null>(null);
  const [location, setLocation] = useState("");
  const [putawayQtys, setPutawayQtys] = useState<{ [itemId: string]: number }>(
    {}
  );

  useEffect(() => {
    const data: InboundOrder[] = JSON.parse(
      localStorage.getItem("inbound_orders") || "[]"
    );
    const found = data.find((order) => order.id === id);
    if (!found) {
      alert("Inbound order tidak ditemukan");
      router.push("/putaway");
      return;
    }
    setInbound(found);
  }, [id, router]);

  if (!inbound) return <p>Loading...</p>;

  const handleQtyChange = (itemId: string, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return;
    setPutawayQtys((prev) => ({ ...prev, [itemId]: num }));
  };

  const handleSubmit = () => {
    if (!location.trim()) {
      alert("Lokasi penempatan harus diisi");
      return;
    }

    // Validasi qty putaway tidak boleh lebih dari qty inbound per item
    for (const item of inbound.items) {
      const putQty = putawayQtys[item.id] || 0;
      if (putQty > item.qty) {
        alert(
          `Qty putaway untuk produk ${item.productId} tidak boleh lebih dari qty inbound (${item.qty})`
        );
        return;
      }
    }

    // Simpan putaway record
    const putawayItems: PutawayItem[] = inbound.items.map((item) => {
      const putQty = putawayQtys[item.id] || 0;
      const qtyBaseUnit = convertToBaseUnit(item.productId, putQty, item.uom);
      return {
        id: uuidv4(),
        productId: item.productId,
        qtyBaseUnit,
        location,
      };
    });

    const newPutawayRecord: PutawayRecord = {
      id: uuidv4(),
      inboundOrderId: inbound.id,
      date: new Date().toISOString().split("T")[0],
      items: putawayItems,
    };

    // Simpan ke localStorage
    const existingRecords: PutawayRecord[] = JSON.parse(
      localStorage.getItem("putaway_records") || "[]"
    );
    localStorage.setItem(
      "putaway_records",
      JSON.stringify([...existingRecords, newPutawayRecord])
    );

    // Update inbound order status jika semua qty sudah diputaway penuh
    // Cara sederhana: cek total qty putaway per produk
    let allPutawayDone = true;
    for (const item of inbound.items) {
      const totalPutawayQty = putawayQtys[item.id] || 0;
      if (totalPutawayQty < item.qty) {
        allPutawayDone = false;
        break;
      }
    }

    // Update inbound_orders di localStorage
    const inboundOrders: InboundOrder[] = JSON.parse(
      localStorage.getItem("inbound_orders") || "[]"
    );
    const updatedOrders = inboundOrders.map((order) => {
      if (order.id === inbound.id) {
        return {
          ...order,
          status: allPutawayDone ? "done" : "open",
        };
      }
      return order;
    });
    localStorage.setItem("inbound_orders", JSON.stringify(updatedOrders));

    alert("Putaway berhasil disimpan!");
    router.push("/example/putaway/stock");
  };

  if (!id) return <p>Loading...</p>;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Putaway untuk Inbound ID: {inbound.id}
      </h1>
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Lokasi Penempatan</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="border rounded px-3 py-2 w-full"
          placeholder="Masukkan lokasi storage"
        />
      </div>

      <table className="w-full border-collapse border mb-4">
        <thead>
          <tr>
            <th className="border p-2 text-left">Produk</th>
            <th className="border p-2 text-right">Qty Inbound</th>
            <th className="border p-2 text-left">UOM</th>
            <th className="border p-2 text-right">Qty Putaway</th>
          </tr>
        </thead>
        <tbody>
          {inbound.items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            return (
              <tr key={item.id}>
                <td className="border p-2">{product?.name || "Unknown"}</td>
                <td className="border p-2 text-right">{item.qty}</td>
                <td className="border p-2">{item.uom}</td>
                <td className="border p-2 text-right">
                  <input
                    type="number"
                    min={0}
                    max={item.qty}
                    step={0.01}
                    value={putawayQtys[item.id] ?? ""}
                    onChange={(e) => handleQtyChange(item.id, e.target.value)}
                    className="border rounded px-2 py-1 w-24 text-right"
                    placeholder="0"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button
        onClick={handleSubmit}
        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
      >
        Simpan Putaway
      </button>
    </div>
  );
}
