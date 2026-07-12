"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import api from "@/lib/api";

type StockTake = {
  id: number;
  code: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type StockTakePrintItem = {
  location: string;
  item_code: string;
  item_name: string;
  system_qty: number;
  counted_qty: number;
  difference: number;
};

export default function StockTakePrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const id = params?.id ? String(params.id) : null;
  const rowsParam = searchParams.get("rows") || "";

  const [stockTake, setStockTake] = useState<StockTake | null>(null);
  const [items, setItems] = useState<StockTakePrintItem[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const printDate = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    if (!id) return;

    const fetchItems = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/stock-take/${id}/print`, {
          params: rowsParam ? { rows: rowsParam } : {},
          withCredentials: true,
        });

        if (res.data.success) {
          setItems(Array.isArray(res.data.data) ? res.data.data : []);
          setSelectedRows(Array.isArray(res.data.rows) ? res.data.rows : []);
          setStockTake(res.data.stock_take);
        }
      } catch (err) {
        console.error("Failed to fetch detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [id, rowsParam]);

  useEffect(() => {
    if (!loading && items.length > 0) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [loading, items]);

  // Kosongkan cell kalau nilainya 0, biar sheet buat lapangan gak penuh angka "0"
  const displayQty = (val: number) => (val === 0 ? "" : val);

  return (
    <div className="p-2 text-black text-sm">
      {/* <h1 className="text-md font-bold text-center mb-2">STOCK COUNT</h1> */}
      <p className="text-left">Cycle count ID : {id}</p>
      <p className="text-left">Location : {selectedRows.join(", ")}</p>
      <p className="text-left">Generated on : {stockTake?.created_at ? new Date(stockTake.created_at).toLocaleString() : "N/A"}</p>
      {/* <div className=" gap-6 mb-4 text-left">
        <p>
          Row: {selectedRows.length > 0 ? selectedRows.join(", ") : "All Rows"}
        </p>
        <p>Date: {printDate}</p>
      </div> */}

      <table className="w-full border border-black border-collapse text-sm mt-1">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-black px-2 py-1">No.</th>
            <th className="border border-black px-2 py-1">Location</th>
            {/* <th className="border border-black px-2 py-1">SKU</th> */}
            <th className="border border-black px-2 py-1">Item Name</th>
            <th className="border border-black px-2 py-1">Stock</th>
            <th className="border border-black px-2 py-1">Count</th>
            <th className="border border-black px-2 py-1">Diff</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="border border-black text-center py-3">
                No item found.
              </td>
            </tr>
          ) : (
            items.map((item, index) => (
              <tr key={`${item.location}-${item.item_code}-${index}`}>
                <td className="border border-black px-2 py-1">{index + 1}</td>
                <td className="border border-black px-2 py-1">
                  {item.location}
                </td>
                {/* <td className="border border-black px-2 py-1">
                  {item.item_code}
                </td> */}
                <td className="border  border-black px-2 py-1">
                  <span className="text-sm">{item.item_name}</span>
                  <span className="text-xs text-gray-400 block">
                    {item.item_code}
                  </span>
                </td>
                <td className="border border-black px-2 py-1 text-right w-20">
                  {item.system_qty}
                </td>
                <td className="border border-black px-2 py-1 text-right w-20">
                  {displayQty(item.counted_qty)}
                </td>
                <td className="border border-black px-2 py-1 text-right w-20">
                  {displayQty(item.difference)}
                </td>
              </tr>
            ))
          )}
        </tbody>
        {/* <tfoot>
          <tr>
            <td colSpan={3} className="border border-black px-2 py-1 text-right font-bold">
              Total
            </td>
            <td className="border border-black px-2 py-1 text-right font-bold">
              {items.reduce((acc, item) => acc + item.system_qty, 0)}
            </td>
            <td className="border border-black px-2 py-1 text-right font-bold">
              {items.reduce((acc, item) => acc + item.counted_qty, 0)}
            </td>
            <td className="border border-black px-2 py-1 text-right font-bold">
              {items.reduce((acc, item) => acc + item.difference, 0)}
            </td>
          </tr>
        </tfoot> */}
      </table>

      {/* <div className="mt-4 text-left">
        <p>Total Stock System Row {selectedRows.length > 0 ? selectedRows.join(", ") : "All Rows"} : {items.reduce((acc, item) => acc + item.system_qty, 0)}</p>
      </div> */}

      {/* <div className="mt-4 text-right">
        <p>Printed on: {printDate}</p>
      </div> */}

      <div className="mt-10 flex justify-between">
        <div>
          <p>Counted By:</p>
          <br />
          <br />
          <p>_____________________</p>
        </div>
        <div>
          <p>Supervisor By:</p>
          <br />
          <br />
          <p>_____________________</p>
        </div>
        <div>
          <p>Date:</p>
          <br />
          <br />
          <p>_____________________</p>
        </div>
      </div>
    </div>
  );
}