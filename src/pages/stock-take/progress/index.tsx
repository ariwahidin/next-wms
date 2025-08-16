// /* eslint-disable @typescript-eslint/no-unused-vars */
// "use client";

// import { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Card, CardContent } from "@/components/ui/card";
// import { format } from "date-fns";
// import api from "@/lib/api";
// import Layout from "@/components/layout";

// import { useRouter } from "next/navigation";

// // Type definition
// type StockTake = {
//   ID: number;
//   code: string;
//   status: string;
//   CreatedAt: string;
// };

// // Component
// export default function StockTakePage() {
//   const [data, setData] = useState<StockTake[]>([]);
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();

//   // Fetch stock takes
//   const fetchStockTakes = async () => {
//     try {
//       const res = await api.get("/stock-take", {
//         withCredentials: true,
//       });
//       if (res.data.success) {
//         setData(res.data.data);
//       }
//     } catch (err) {
//       console.error("Fetch failed:", err);
//     }
//   };


//   useEffect(() => {
//     fetchStockTakes();
//   }, []);

//   return (
//     <Layout title="Stock Take" subTitle="Progress">
//       <Card className="p-4 mt-4 mx-auto max-w-5xl">
//         <CardContent>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>No</TableHead>
//                 <TableHead>Code</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead>Created At</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {data.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={3} className="text-center">
//                     No stock take found.
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 data.map((stk, index) => (
//                   <TableRow
//                     key={stk.code}
//                     onClick={() =>
//                       router.push(`/stock-take/progress/${stk.code}`)
//                     }
//                     className="hover:bg-muted cursor-pointer"
//                   >
//                     <TableCell>{index + 1}</TableCell>
//                     <TableCell>{stk.code}</TableCell>
//                     <TableCell>{stk.status}</TableCell>
//                     <TableCell>
//                       {format(new Date(stk.CreatedAt), "yyyy-MM-dd HH:mm")}
//                     </TableCell>
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

/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import api from "@/lib/api";
import Layout from "@/components/layout";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Hash, TrendingUp, Plus, Eye, Edit3, Trash2, ChartBar } from "lucide-react";

type StockTake = {
  ID: number;
  code: string;
  status: string;
  CreatedAt: string;
};

export default function StockTakePage() {
  const [data, setData] = useState<StockTake[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleNewStockTake = () => {
    // Navigate to create new stock take page
    // router.push('/stock-take/create');
    // Or you can add your create logic here
    generateStockTake();
  };

  // Generate stock take
  const generateStockTake = async () => {
    setLoading(true);
    try {
      const res = await api.post("/stock-take/generate", null, { withCredentials: true });
      if (res.data.success) {
        // await fetchStockTakes(); // reload data
        // router.push("/stock-take/list");
        fetchStockTakes(); // reload data
      }
    } catch (err) {
      console.error("Generate failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockTakes = async () => {
    try {
      const res = await api.get("/stock-take", {
        withCredentials: true,
      });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockTakes();
  }, []);

  const renderStatus = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed") {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-medium px-2 py-0.5 text-xs">
          Completed
        </Badge>
      );
    }
    if (s === "in progress") {
      return (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 font-medium px-2 py-0.5 text-xs">
          In Progress
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 font-medium px-2 py-0.5 text-xs">
        {status}
      </Badge>
    );
  };

  return (
    <Layout title="Stock Take" subTitle="Progress">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-slate-900 rounded-md flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 text-white" />
                  </div>
                  <h1 className="text-lg font-semibold text-slate-900">Stock Take Progress</h1>
                </div>
                <p className="text-slate-600 text-xs">
                  Monitor and track your inventory stock take sessions
                </p>
              </div>
              <button 
                onClick={handleNewStockTake}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Stock Take
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">Total Sessions</p>
                    <p className="text-lg font-semibold text-slate-900">{data.length}</p>
                  </div>
                  <Hash className="w-5 h-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">Completed</p>
                    <p className="text-lg font-semibold text-emerald-600">
                      {data.filter(item => item.status.toLowerCase() === 'completed').length}
                    </p>
                  </div>
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">In Progress</p>
                    <p className="text-lg font-semibold text-amber-600">
                      {data.filter(item => item.status.toLowerCase() === 'in progress').length}
                    </p>
                  </div>
                  <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Table */}
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 bg-slate-50/50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 px-4">
                        #
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">
                        Session Code
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">
                        Created
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 text-center">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-12">
                          <div className="flex flex-col items-center justify-center text-center">
                            <Loader2 className="animate-spin w-6 h-6 text-slate-400 mb-2" />
                            <p className="text-slate-500 font-medium text-sm">Loading sessions...</p>
                            <p className="text-slate-400 text-xs">Please wait a moment</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-12">
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                              <TrendingUp className="w-6 h-6 text-slate-400" />
                            </div>
                            <p className="text-slate-600 font-medium mb-1 text-sm">No stock take sessions found</p>
                            <p className="text-slate-400 text-xs">Create your first session to get started</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.map((stk, index) => (
                        <TableRow
                          key={stk.ID}
                          className="group hover:bg-slate-50/80 transition-all duration-200 border-b border-slate-50 last:border-b-0"
                        >
                          <TableCell className="py-3 px-4">
                            <span className="text-slate-400 font-medium text-xs">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                          </TableCell>
                          <TableCell 
                            className="py-3 cursor-pointer"
                            onClick={() => router.push(`/stock-take/progress/${stk.code}`)}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                                <Hash className="w-3 h-3 text-slate-600" />
                              </div>
                              <span className="font-semibold text-slate-900 group-hover:text-slate-700 text-sm">
                                {stk.code}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell 
                            className="py-3 cursor-pointer"
                            onClick={() => router.push(`/stock-take/progress/${stk.code}`)}
                          >
                            {renderStatus(stk.status)}
                          </TableCell>
                          <TableCell 
                            className="py-3 cursor-pointer"
                            onClick={() => router.push(`/stock-take/progress/${stk.code}`)}
                          >
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span className="font-medium text-xs">
                                {format(new Date(stk.CreatedAt), "MMM dd, yyyy")}
                              </span>
                              <span className="text-slate-400 text-xs">
                                {format(new Date(stk.CreatedAt), "HH:mm")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/stock-take/progress/${stk.code}`);
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                                title="View Progress"
                              >
                                <ChartBar className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/stock-take/${stk.code}`);
                                  // Handle edit action
                                  // console.log('Edit', stk.code);
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-amber-50 text-amber-600 hover:text-amber-700 transition-colors"
                                title="View Detail"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle delete action
                                  console.log('Delete', stk.code);
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          {data.length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500">
                Showing {data.length} stock take session{data.length !== 1 ? 's' : ''} • 
                Click any row to view detailed progress
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
