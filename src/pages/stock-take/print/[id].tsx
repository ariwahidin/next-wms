"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import JsBarcode from "jsbarcode";

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
  division?: string;
  lot_number?: string;
  system_qty: number;
  counted_qty: number;
  difference: number;
};

export default function StockTakePrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const id = params?.id ? String(params.id) : null;
  const rowsParam = searchParams.get("rows") || "";
  const columnsParam = searchParams.get("columns") || "";

  const [stockTake, setStockTake] = useState<StockTake | null>(null);
  const [items, setItems] = useState<StockTakePrintItem[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  // Fallback ke request kalau backend gak balikin "columns" (backward compat)
  const [showDivision, setShowDivision] = useState(
    columnsParam === "" || columnsParam.includes("division")
  );
  const [showLot, setShowLot] = useState(
    columnsParam === "" || columnsParam.includes("lot_number")
  );
  const [loading, setLoading] = useState(true);

  const barcodeRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchItems = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/stock-take/${id}/print`, {
          params: {
            ...(rowsParam ? { rows: rowsParam } : {}),
            ...(columnsParam ? { columns: columnsParam } : {}),
          },
          withCredentials: true,
        });

        if (res.data.success) {
          setItems(Array.isArray(res.data.data) ? res.data.data : []);
          setSelectedRows(Array.isArray(res.data.rows) ? res.data.rows : []);
          setStockTake(res.data.stock_take);
          // Backend mengonfirmasi kolom mana yang benar-benar dipakai untuk grouping
          if (res.data.columns) {
            setShowDivision(!!res.data.columns.division);
            setShowLot(!!res.data.columns.lot_number);
          }
        }
      } catch (err) {
        console.error("Failed to fetch detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [id, rowsParam, columnsParam]);

  useEffect(() => {
    if (barcodeRef.current && id) {
      JsBarcode(barcodeRef.current, stockTake?.code || id, {
        format: "CODE128",
        width: 1.3,
        height: 30,
        fontSize: 10,
        margin: 0,
        displayValue: true,
      });
    }
  }, [id, stockTake]);

  useEffect(() => {
    if (!loading && items.length > 0) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [loading, items]);

  // Kosongkan cell kalau nilainya 0, biar sheet buat lapangan gak penuh angka "0"
  const displayQty = (val: number) => (val === 0 ? "" : val);

  const totalLocation = new Set(
    items.filter((item) => item.location).map((item) => item.location)
  ).size;

  // Baris pertama dari sebuah lokasi baru (beda dari lokasi row sebelumnya) ->
  // border atas ditebalin, biar keliatan batas antar lokasi. Selama masih
  // satu lokasi yang sama, border antar row tetap tipis (normal) kayak biasa.
  const isNewLocationGroup = (index: number) =>
    index === 0 || items[index].location !== items[index - 1].location;

  const groupBorderStyle = (index: number): React.CSSProperties =>
    isNewLocationGroup(index) ? { borderTop: "2px solid black" } : {};

  // Total kolom di table: No, Location, Item, Stock, Count, Diff = 6, + Lot kalau ditampilkan
  const totalColSpan = 6 + (showLot ? 1 : 0);

  return (
    <div className="p-2 text-black text-sm relative">

      <div className="absolute top-2 right-2">
        <svg ref={barcodeRef}></svg>
      </div>

      <p className="text-left" style={{ fontSize: "10px" }}>Cycle count ID : {id}</p>
      <p className="text-left" style={{ fontSize: "10px" }}>Total location : {totalLocation}</p>
      <p className="text-left" style={{ fontSize: "10px" }}>Location : {selectedRows.join(", ")}</p>
      <p className="text-left" style={{ fontSize: "10px" }}>Generated on : {stockTake?.created_at ? new Date(stockTake.created_at).toLocaleString() : "N/A"}</p>
      <table className="w-full border border-black border-collapse text-sm mt-1">
        <thead style={{ fontSize: "10px" }}>
          <tr className="bg-gray-200">
            <th className="border border-black   py-0">No.</th>
            <th className="border border-black px-2 py-0">Location</th>
            <th className="border border-black px-2 py-0">Item</th>
            {showLot && (
              <th className="border border-black px-2 py-0">Lot/Batch</th>
            )}
            <th className="border border-black px-2 py-0">Stock</th>
            <th className="border border-black px-2 py-0">Count</th>
            <th className="border border-black px-2 py-0">Diff</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={totalColSpan} className="border border-black text-center py-3">
                No item found.
              </td>
            </tr>
          ) : (
            items.map((item, index) => (
              <tr key={`${item.location}-${item.item_code}-${index}`}>
                <td
                  className="border border-black px-2 py-0 w-5"
                  style={{ fontSize: "10px", ...groupBorderStyle(index) }}
                >
                  {index + 1}
                </td>
                <td
                  className="border border-black px-2 py-0 w-20"
                  style={{ fontSize: "10px", ...groupBorderStyle(index) }}
                >
                  <span style={{ fontSize: "10px" }}>{item.location}</span>
                </td>
                <td
                  className="border border-black"
                  style={{
                    maxWidth: "150px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontSize: "10px",
                    lineHeight: "1.2",
                    padding: "1px 4px",
                    ...groupBorderStyle(index),
                  }}
                >
                  <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.item_name}
                  </div>
                  <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.item_code}
                  </div>
                  {showDivision && (
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.division}
                    </div>
                  )}
                </td>
                {showLot && (
                  <td
                    className="border border-black px-2 py-0 w-12"
                    style={{ fontSize: "10px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", ...groupBorderStyle(index) }}
                  >
                    {item.lot_number}
                  </td>
                )}
                <td
                  className="border border-black px-2 py-0 text-right w-10"
                  style={{ fontSize: "10px", ...groupBorderStyle(index) }}
                >
                  {item.system_qty}
                </td>
                <td
                  className="border border-black px-2 py-0 text-right w-20"
                  style={{ fontSize: "0px", ...groupBorderStyle(index) }}
                >
                  {displayQty(item.counted_qty)}
                </td>
                <td
                  className="border border-black px-2 py-0 text-right w-10"
                  style={{ fontSize: "10px", ...groupBorderStyle(index) }}
                >
                  {displayQty(item.difference)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

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