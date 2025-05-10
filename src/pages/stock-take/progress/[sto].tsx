/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
// import ProgressStockTable from "@/components/ProgressStockTable";

import Layout from "@/components/layout";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { useRouter } from 'next/router';

// const data = [
//   {
//     category: "Electronics",
//     system: { location: "A1", barcode: "123456", qty: 100 },
//     sto: { location: "A1", barcode: "123456", qty: 90 },
//   },
//   {
//     category: "Furniture",
//     system: { location: "B2", barcode: "654321", qty: 50 },
//     sto: { location: "B2", barcode: "654321", qty: 50 },
//   },
//   {
//     category: "Stationery",
//     system: { location: "C3", barcode: "789012", qty: 30 },
//     sto: { location: "C3", barcode: "789012", qty: 10 },
//   },
// ];

type StockTakeItem = {
  ID: number;
  ProductID: number;
  Location: string;
  Pallet: string;
  Barcode: string;
  SerialNumber: string;
  SystemQty: number;
  CountedQty: number;
  Difference: number;
  Notes: string;
};

type ProgressStockTake = {
  barcode_system: string;
  count_barcode_system: number;
  count_location_system: number;
  total_qty_system: number;
  barcode_sto: string;
  count_barcode_sto: number;
  count_location_sto: number;
  total_qty_sto: number;
  progress_barcode: number;
  progress_location: number;
  progress_qty: number;
};

function ProgressStockTable({ sto }: { sto: string }) {
  // const totalSTOQty = data.reduce((sum, d) => sum + d.sto.qty, 0);
  // const progress = (sto: number, system: number) =>
  //   system === 0 ? 0 : Math.round((sto / system) * 100);

  const [progressStockTake, setProgressStockTake] = useState<
    ProgressStockTake[]
  >([]);

  const total_barcode_system = progressStockTake.reduce(
    (sum, d) => sum + d.count_barcode_system,
    0
  );

  const total_location_system = progressStockTake.reduce(
    (sum, d) => sum + d.count_location_system,
    0
  );

  const total_qty_system = progressStockTake.reduce(
    (sum, d) => sum + d.total_qty_system,
    0
  );

  const total_barcode_sto = progressStockTake.reduce(
    (sum, d) => sum + d.count_barcode_sto,
    0
  );

  const total_location_sto = progressStockTake.reduce(
    (sum, d) => sum + d.count_location_sto,
    0
  );

  const total_qty_sto = progressStockTake.reduce(
    (sum, d) => sum + d.total_qty_sto,
    0
  );

  let total_progress_barcode =
    progressStockTake.reduce((sum, d) => sum + d.progress_barcode, 0) /
    progressStockTake.length;
  total_progress_barcode = Math.round(total_progress_barcode * 100) / 100;

  let total_progress_location =
    progressStockTake.reduce((sum, d) => sum + d.progress_location, 0) /
    progressStockTake.length;
  total_progress_location = Math.round(total_progress_location * 100) / 100;


  let total_progress_qty =
    progressStockTake.reduce((sum, d) => sum + d.progress_qty, 0) /
    progressStockTake.length;
  total_progress_qty = Math.round(total_progress_qty * 100) / 100;

  const fetchData = async () => {
    try {
      const res = await api.get(`/stock-take/progress/${sto}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setProgressStockTake(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch detail:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="overflow-auto rounded-xl border shadow-sm">
      <Table className="text-sm border border-gray-200">
        <TableHeader>
          <TableRow>
            <TableHead rowSpan={2} className="border border-gray-200">
              Category
            </TableHead>
            <TableHead
              colSpan={3}
              className="text-center border border-gray-200"
            >
              Stock System
            </TableHead>
            <TableHead
              colSpan={3}
              className="text-center border border-gray-200"
            >
              Data STO
            </TableHead>
            <TableHead
              colSpan={3}
              className="text-center border border-gray-200"
            >
              Progress (%)
            </TableHead>
          </TableRow>
          <TableRow>
            <TableHead className="border border-gray-200">Location</TableHead>
            <TableHead className="border border-gray-200">Barcode</TableHead>
            <TableHead className="border border-gray-200">Qty</TableHead>
            <TableHead className="border border-gray-200">Location</TableHead>
            <TableHead className="border border-gray-200">Barcode</TableHead>
            <TableHead className="border border-gray-200">Qty</TableHead>
            <TableHead className="border border-gray-200">Location</TableHead>
            <TableHead className="border border-gray-200">Barcode</TableHead>
            <TableHead className="border border-gray-200">Qty</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {progressStockTake.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell className="border border-gray-200">
                {row.barcode_system}
              </TableCell>
              <TableCell className="border border-gray-200">
                {row.count_location_system}
              </TableCell>
              <TableCell className="border border-gray-200">
                {row.count_barcode_system}
              </TableCell>
              <TableCell className="border border-gray-200">
                {row.total_qty_system}
              </TableCell>
              <TableCell className="border border-gray-200">
                {row.count_location_sto}
              </TableCell>
              <TableCell className="border border-gray-200">
                {row.count_barcode_sto}
              </TableCell>
              <TableCell className="border border-gray-200">
                {row.total_qty_sto}
              </TableCell>
              <TableCell className="border border-gray-200">
                {row.progress_location}%
              </TableCell>
              <TableCell className="border border-gray-200">
                {row.progress_barcode}%
              </TableCell>
              <TableCell className="border border-gray-200">
                {row.progress_qty}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="font-semibold bg-muted">
            <TableCell className="border border-gray-200">Total</TableCell>
            {/* <TableCell
              colSpan={2}
              className="border border-gray-200"
            ></TableCell> */}
            <TableCell className="border border-gray-200">
              {total_location_system}
            </TableCell>
            <TableCell className="border border-gray-200">
              {total_barcode_system}
            </TableCell>
            <TableCell className="border border-gray-200">
              {total_qty_system}
            </TableCell>
            <TableCell className="border border-gray-200">
              {total_location_sto}
            </TableCell>
            <TableCell className="border border-gray-200">
              {total_barcode_sto}
            </TableCell>

            <TableCell className="border border-gray-200">
              {total_qty_sto}
            </TableCell>
            <TableCell className="border border-gray-200">
              {total_progress_location}%
            </TableCell>
            <TableCell className="border border-gray-200">
              {total_progress_barcode}%
            </TableCell>
            <TableCell className="border border-gray-200">
              {total_progress_qty}%
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

export default function ProgressPage() {
  const params = useParams();
  // const sto = params.sto as string | null;
  const router = useRouter();

  const { sto } = router.query;
  const stoValue = Array.isArray(sto) ? sto[0] : sto; // pastikan string

  const [items, setItems] = useState<StockTakeItem[]>([]);
  const [subtitle, setSubtitle] = useState("");

  useEffect(() => {
    if (sto) {
      setSubtitle(`Progress - ID: ${sto}`);
    }
  }, []);

  return (
    <Layout title="Stock Take" subTitle={subtitle}>
      <div className="p-4">
        <ProgressStockTable sto={stoValue} />
      </div>
    </Layout>
  );
}
