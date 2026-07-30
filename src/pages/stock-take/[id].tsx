/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from "@/components/ui/table";
import api from "@/lib/api";
import Layout from "@/components/layout";
import { ArrowBigLeft, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

// Field name mengikuti persis JSON tag di StockTakeDetailRow (backend, sudah di-GROUP BY)
type StockTakeItem = {
  item_id: number;
  item_code: string;
  item_name: string;
  unit_model: string;
  location: string;
  division_code: string;
  system_qty: number;
  counted_qty: number;
  difference: number;
};

type StockTake = {
  id: number;
  code: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export default function StockTakeDetailPage() {
  const router = useRouter();
  const { id: code } = router.query; // route param sebenarnya "code" (mis. ST202607110001)
  const [items, setItems] = useState<StockTakeItem[]>([]);
  const [filtered, setFiltered] = useState<StockTakeItem[]>([]);
  const [stockTake, setStockTake] = useState<StockTake | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // --- Print modal state ---
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [availableRows, setAvailableRows] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [rowsLoading, setRowsLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/stock-take/${code}`, {
        withCredentials: true,
      });

      const stockTake: StockTake = res.data?.data.stock_take;

      if (stockTake) {
        setStockTake(stockTake);
      }

      const data: StockTakeItem[] = Array.isArray(res.data?.data.rows)
        ? res.data.data.rows
        : [];

      if (res.data?.success) {
        setItems(data);
        setFiltered(data);
      } else {
        setItems([]);
        setFiltered([]);
      }
    } catch (err) {
      console.error("Failed to fetch detail:", err);
      setItems([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!router.isReady || !code) return;
    fetchItems();
  }, [router.isReady, code]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      (items || []).filter(
        (item) =>
          item?.location?.toLowerCase().includes(q) ||
          item?.item_code?.toLowerCase().includes(q) ||
          item?.item_name?.toLowerCase().includes(q)
      )
    );
  }, [search, items]);

  const openPrintModal = async () => {
    setPrintModalOpen(true);
    setRowsLoading(true);
    try {
      const res = await api.get(`/locations/rows`, { withCredentials: true });
      const rows: string[] = Array.isArray(res.data?.data) ? res.data.data : [];
      setAvailableRows(rows);
    } catch (err) {
      console.error("Failed to fetch rows:", err);
      setAvailableRows([]);
    } finally {
      setRowsLoading(false);
    }
  };

  const toggleRow = (row: string) => {
    setSelectedRows((prev) =>
      prev.includes(row) ? prev.filter((r) => r !== row) : [...prev, row]
    );
  };

  const confirmPrint = () => {
    const rowsQuery = selectedRows.join(",");
    const url = `/stock-take/print/${code}?rows=${encodeURIComponent(rowsQuery)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setPrintModalOpen(false);
  };

  const renderDifference = (diff: number) => {
    if (diff === 0)
      return (
        <Badge variant="outline" className="text-gray-500">
          0
        </Badge>
      );
    if (diff > 0) return <Badge variant="destructive">+{diff}</Badge>;
    return <Badge className="bg-blue-600 text-white">−{Math.abs(diff)}</Badge>;
  };

  const totalLocation = new Set(filtered.filter((item) => item.location).map((item) => item.location)).size;

  const totalItem = new Set(
    filtered.filter((item) => item.item_code).map((item) => item.item_code)
  ).size;



  return (
    <Layout title="Stock Take Detail" subTitle={`Stock Take ID: ${code}`}>
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="pb-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowBigLeft className="" />
            Back
          </Button>
        </div>
        <Card className="shadow-lg rounded-xl border border-gray-200">
          <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Stock Data for Cycle Count ID: {stockTake?.code || code}
              </h2>

              <p className="text-sm text-gray-500">
              </p>
              <p className="text-sm text-gray-500">
                Total Location: {totalLocation}
              </p>
              <p className="text-sm text-gray-500">
                Total SKU: {totalItem}
              </p>
              <p className="text-sm text-gray-500">
                Total System Qty: {filtered.reduce((acc, item) => acc + item.system_qty, 0)}
              </p>
              <p className="text-sm text-gray-500">
                {/* Date YYYY-MM-DD And Time */}
                Generated on:{" "}
                {stockTake?.created_at
                  ? new Date(stockTake.created_at).toLocaleString()
                  : "N/A"}
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto flex-col md:flex-row">
              <Input
                placeholder="Search by SKU, name, or location"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-72"
              />
              <Button
                onClick={openPrintModal}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white shadow-sm z-10">
                  <TableRow>
                    <TableHead className="w-12">No.</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Division</TableHead>
                    <TableHead className="text-right">System Qty</TableHead>
                    {/* <TableHead className="text-right">Counted Qty</TableHead> */}
                    {/* <TableHead>Diff</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        <Loader2 className="animate-spin w-6 h-6 mx-auto text-gray-400" />
                        <div className="text-gray-500 mt-2">Loading...</div>
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-6 text-gray-500"
                      >
                        No item found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((item, index) => (
                      <TableRow
                        key={`${item.item_id}-${item.location}`}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium text-gray-800">
                          {item.location}
                        </TableCell>
                        <TableCell>{item.item_code}</TableCell>
                        <TableCell>
                          <div className="text-gray-800">{item.item_name}</div>
                          {item.unit_model && (
                            <div className="text-xs text-gray-400">
                              {item.unit_model}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{item.division_code}</TableCell>
                        <TableCell className="text-right">
                          {item.system_qty}
                        </TableCell>
                        {/* <TableCell className="text-right">
                          {item.counted_qty}
                        </TableCell> */}
                        {/* <TableCell>
                          {renderDifference(item.difference)}
                        </TableCell> */}
                      </TableRow>
                    ))
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-semibold">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {filtered.reduce(
                        (total, item) => total + item.system_qty,
                        0
                      )}
                    </TableCell>
                    {/* <TableCell className="text-right font-semibold">
                      {filtered.reduce(
                        (total, item) => total + item.counted_qty,
                        0
                      )}
                    </TableCell> */}
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print by Row modal */}
      <Dialog open={printModalOpen} onOpenChange={setPrintModalOpen}>
        <DialogContent className="sm:max-w-md bg-slate-50">
          <DialogHeader>
            <DialogTitle>Print by Row</DialogTitle>
          </DialogHeader>

          {rowsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin w-5 h-5 text-gray-400" />
            </div>
          ) : availableRows.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No row found.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 max-h-72 overflow-y-auto py-2">
              {availableRows.map((row) => (
                <label
                  key={row}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Checkbox
                    checked={selectedRows.includes(row)}
                    onCheckedChange={() => toggleRow(row)}
                  />
                  {row}
                </label>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPrintModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmPrint}
              disabled={selectedRows.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print ({selectedRows.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}