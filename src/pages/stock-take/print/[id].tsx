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
  division: string;
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

  const barcodeRef = useRef<SVGSVGElement | null>(null);

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

  return (
    <div className="p-2 text-black text-sm relative">

      <div className="absolute top-2 right-2">
        <svg ref={barcodeRef}></svg>
      </div>


      {/* <h1 className="text-md font-bold text-center mb-2">STOCK COUNT</h1> */}
      <p className="text-left" style={{ fontSize: "10px" }}>Cycle count ID : {id}</p>
      <p className="text-left" style={{ fontSize: "10px" }}>Location : {selectedRows.join(", ")}</p>
      <p className="text-left" style={{ fontSize: "10px" }}>Generated on : {stockTake?.created_at ? new Date(stockTake.created_at).toLocaleString() : "N/A"}</p>
      <table className="w-full border border-black border-collapse text-sm mt-1">
        <thead style={{ fontSize: "10px" }}>
          <tr className="bg-gray-200">
            <th className="border border-black   py-0">No.</th>
            <th className="border border-black px-2 py-0">Location</th>
            {/* <th className="border border-black px-2 py-0">SKU</th> */}
            <th className="border border-black px-2 py-0">Item</th>
            {/* <th className="border border-black px-2 py-0">Division</th> */}
            <th className="border border-black px-2 py-0">Stock</th>
            <th className="border border-black px-2 py-0">Count</th>
            <th className="border border-black px-2 py-0">Diff</th>
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
                <td className="border border-black px-2 py-0 w-5" style={{ fontSize: "10px" }}>{index + 1}</td>
                <td className="border border-black px-2 py-0 w-20" style={{ fontSize: "10px" }}>
                  <span style={{ fontSize: "10px" }}>{item.location}</span>
                </td>
                {/* <td className="border border-black px-2 py-0">
                  <span style={{ fontSize: "10px" }}>{item.item_code}</span>
                </td> */}
                <td
                  className="border border-black"
                  style={{
                    maxWidth: "150px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontSize: "10px",
                    lineHeight: "1.2",   // kunci utama: kecilin line-height
                    padding: "1px 4px",
                  }}
                >
                  <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.item_name}
                  </div>
                  <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.item_code}
                  </div>
                  <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.division}
                  </div>
                </td>
                {/* <td className="border border-black px-2 py-0" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  <span style={{ fontSize: "10px" }}>{item.division}</span>
                </td> */}
                <td className="border border-black px-2 py-0 text-right w-10" style={{ fontSize: "10px" }}>
                  {item.system_qty}
                </td>
                <td className="border border-black px-2 py-0 text-right w-20" style={{ fontSize: "0px" }}>
                  {displayQty(item.counted_qty)}
                </td>
                <td className="border border-black px-2 py-0 text-right w-10" style={{ fontSize: "10px" }}>
                  {displayQty(item.difference)}
                </td>
              </tr>
            ))
          )}
        </tbody>
        {/* <tfoot>
          <tr>
            <td colSpan={3} className="border border-black px-2 py-0 text-right font-bold">
              Total
            </td>
            <td className="border border-black px-2 py-0 text-right font-bold">
              {items.reduce((acc, item) => acc + item.system_qty, 0)}
            </td>
            <td className="border border-black px-2 py-0 text-right font-bold">
              {items.reduce((acc, item) => acc + item.counted_qty, 0)}
            </td>
            <td className="border border-black px-2 py-0 text-right font-bold">
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