/* eslint-disable react-hooks/exhaustive-deps */
// /* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable react-hooks/exhaustive-deps */
// "use client";

// import { useEffect, useState } from "react";
// import { useParams } from "next/navigation";
// import { Card, CardContent, CardHeader } from "@/components/ui/card";
// import {
//   Table,
//   TableHeader,
//   TableRow,
//   TableHead,
//   TableBody,
//   TableCell,
// } from "@/components/ui/table";
// import api from "@/lib/api";
// import Layout from "@/components/layout";
// import { useRouter } from 'next/router';
// import { Printer } from "lucide-react";

// type StockTakeItem = {
//   ID: number;
//   ProductID: number;
//   Location: string;
//   Pallet: string;
//   Barcode: string;
//   SerialNumber: string;
//   SystemQty: number;
//   CountedQty: number;
//   Difference: number;
//   Notes: string;
// };

// export default function StockTakeDetailPage() {
//   const router = useRouter();
//   const { id } = router.query;

//   const [items, setItems] = useState<StockTakeItem[]>([]);

//   const fetchItems = async () => {
//     try {
//       const res = await api.get(`/stock-take/${id}`, { withCredentials: true });
//       if (res.data.success) {
//         setItems(res.data.data);
//       }
//     } catch (err) {
//       console.error("Failed to fetch detail:", err);
//     }
//   };

//   useEffect(() => {
//     if (id) {
//       fetchItems();
//     }
//   }, [id]);

//   return (
//     <Layout title="Stock Take Detail" subTitle={`ID: ${id}`}>
//       <Card className="p-4 mt-4 mx-auto max-w-5xl">
//         <CardHeader>
//           <a
//             href={`/stock-take/print/${id}`}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="w-40 py-2 rounded text-center py-2 bg-green-600 text-white hover:bg-green-700"
//           >
//             <Printer className="inline mr-2" />
//             Print
//           </a>
//         </CardHeader>
//         <CardContent>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>No.</TableHead>
//                 <TableHead>Location</TableHead>
//                 <TableHead>Barcode</TableHead>
//                 <TableHead>System Qty</TableHead>
//                 <TableHead>Counted Qty</TableHead>
//                 <TableHead>Diff</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {items.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={7} className="text-center">
//                     No item found.
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 items.map((item, index) => (
//                   <TableRow key={item.ID}>
//                     <TableCell>{index + 1}</TableCell>
//                     <TableCell>{item.Location}</TableCell>
//                     <TableCell>{item.Barcode}</TableCell>
//                     <TableCell>{item.SystemQty}</TableCell>
//                     <TableCell>{item.CountedQty}</TableCell>
//                     <TableCell>{item.Difference}</TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>
//     </Layout>
//   );
// }

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
} from "@/components/ui/table";
import api from "@/lib/api";
import Layout from "@/components/layout";
import { ArrowBigLeft, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function StockTakeDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [items, setItems] = useState<StockTakeItem[]>([]);
  const [filtered, setFiltered] = useState<StockTakeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchItems = async () => {
    try {
      const res = await api.get(`/stock-take/${id}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setItems(res.data.data);
        setFiltered(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchItems();
  }, [id]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      items.filter(
        (item) =>
          item.Barcode.toLowerCase().includes(q) ||
          item.Location.toLowerCase().includes(q)
      )
    );
  }, [search, items]);

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

  return (
    <Layout title="Stock Take Detail" subTitle={`Stock Take ID: ${id}`}>
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
                Detail Data Stock
              </h2>
              <p className="text-sm text-gray-500">
                Total item: {filtered.length}
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto flex-col md:flex-row">
              <Input
                placeholder="Search by barcode or location"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-64"
              />
              <a
                href={`/stock-take/print/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </a>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white shadow-sm z-10">
                  <TableRow>
                    <TableHead className="w-12">No.</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>System Qty</TableHead>
                    <TableHead>Counted Qty</TableHead>
                    <TableHead>Diff</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        <Loader2 className="animate-spin w-6 h-6 mx-auto text-gray-400" />
                        <div className="text-gray-500 mt-2">Loading...</div>
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-6 text-gray-500"
                      >
                        No item found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((item, index) => (
                      <TableRow
                        key={item.ID}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium text-gray-800">
                          {item.Location}
                        </TableCell>
                        <TableCell>{item.Barcode}</TableCell>
                        <TableCell>{item.SystemQty}</TableCell>
                        <TableCell>{item.CountedQty}</TableCell>
                        <TableCell>
                          {renderDifference(item.Difference)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
