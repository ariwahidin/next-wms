// /* eslint-disable @typescript-eslint/no-unused-vars */
// import { AppSidebar } from "@/components/app-sidebar";
// import {
//   Breadcrumb,
//   BreadcrumbItem,
//   BreadcrumbLink,
//   BreadcrumbList,
//   BreadcrumbPage,
//   BreadcrumbSeparator,
// } from "@/components/ui/breadcrumb";
// import { Separator } from "@/components/ui/separator";
// import {
//   SidebarInset,
//   SidebarProvider,
//   SidebarTrigger,
// } from "@/components/ui/sidebar";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Button } from "@/components/ui/button";
// import Layout from "@/components/layout";
// import { use, useEffect, useState } from "react";
// import api from "@/lib/api";
// import { Transactions } from "@/types/dashboard";
// import dayjs from "dayjs";

// export default function Page() {
//   const [transactions, setTransactions] = useState<Transactions[]>([]);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await api.get("/dashboard", {
//           withCredentials: true,
//         });
//         const data = await response.data;
//         if (data.success === false) {
//           return;
//         }
//         setTransactions(data.data?.transactions);
//       } catch (error) {
//         console.error("Error fetching orders:", error);
//       } finally {
//         // setIsLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   return (
//     <Layout title="WMS" subTitle="Dashboard">
//       <div className="p-4 grid grid-cols-1 gap-4 md:grid-cols-3"></div>
//       {/* Content */}
//       <div className="flex flex-1 flex-col gap-6 p-6 pt-4">
//         {/* Stats */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           <Card key={"inbound"}>
//             <CardHeader>
//               <CardTitle>{"Inbound Pending"}</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p className="text-2xl font-bold">
//                 {transactions?.reduce((total, order) => {
//                   if (order.trans_type === "inbound") {
//                     return total + 1;
//                   }
//                   return total;
//                 }, 0)}
//               </p>
//             </CardContent>
//           </Card>
//           <Card key={"outbound"}>
//             <CardHeader>
//               <CardTitle>{"Outbound Pending"}</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p className="text-2xl font-bold">
//                 {transactions?.reduce((total, order) => {
//                   if (order.trans_type === "outbound") {
//                     return total + 1;
//                   }
//                   return total;
//                 }, 0)}
//               </p>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Recent Orders */}
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between">
//             <CardTitle>Recent Orders</CardTitle>
//             {/* <Button variant="outline" size="sm">
//               View All
//             </Button> */}
//           </CardHeader>
//           <CardContent>
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>No.</TableHead>
//                   <TableHead>Date</TableHead>
//                   <TableHead>Trans Type</TableHead>
//                   <TableHead>Order ID</TableHead>
//                   <TableHead>Status</TableHead>
//                   <TableHead>Total Item</TableHead>
//                   <TableHead>Total Qty</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {transactions?.map((order, index) => (
//                   <TableRow key={order.id}>
//                     <TableCell>{index + 1}</TableCell>
//                     <TableCell>
//                       {dayjs(order.trans_date).format("D MMMM YYYY")}
//                     </TableCell>
//                     <TableCell>
//                       <span className="text-sm">{order.trans_type}</span>
//                     </TableCell>
//                     <TableCell>{order.no_ref}</TableCell>
//                     <TableCell>{order.status}</TableCell>
//                     <TableCell>{order.tot_item}</TableCell>
//                     <TableCell>{order.tot_qty}</TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </CardContent>
//         </Card>
//       </div>
//     </Layout>
//   );
// }

/* eslint-disable @typescript-eslint/no-unused-vars */
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout";
import { use, useEffect, useState } from "react";
import api from "@/lib/api";
import { Transactions } from "@/types/dashboard";
import dayjs from "dayjs";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

export default function Page() {
  const [transactions, setTransactions] = useState<Transactions[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/dashboard", {
          withCredentials: true,
        });
        const data = await response.data;
        if (data.success === false) {
          return;
        }
        setTransactions(data.data?.transactions);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const inboundCount =
    transactions?.reduce((total, order) => {
      if (order.trans_type === "inbound") return total + 1;
      return total;
    }, 0) || 0;

  const outboundCount =
    transactions?.reduce((total, order) => {
      if (order.trans_type === "outbound") return total + 1;
      return total;
    }, 0) || 0;

  const completedCount =
    transactions?.reduce((total, order) => {
      if (order.status?.toLowerCase() === "completed") return total + 1;
      return total;
    }, 0) || 0;

  const totalQty =
    transactions?.reduce((total, order) => {
      return total + (order.tot_qty || 0);
    }, 0) || 0;

  const renderStatus = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "completed") {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium px-2 py-0.5 text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    }
    if (s === "pending") {
      return (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-medium px-2 py-0.5 text-xs">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    }
    if (s === "cancelled") {
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200 font-medium px-2 py-0.5 text-xs">
          <XCircle className="w-3 h-3 mr-1" />
          Cancelled
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-50 text-slate-600 border-slate-200 font-medium px-2 py-0.5 text-xs">
        {status}
      </Badge>
    );
  };

  const renderTransType = (type: string) => {
    if (type === "inbound") {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium text-blue-700">Inbound</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
        <span className="text-sm font-medium text-orange-700">Outbound</span>
      </div>
    );
  };

  return (
    <Layout title="WMS" subTitle="Dashboard">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
        <div className="p-6">
          {/* Welcome Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                WMS Dashboard 📊
              </h1>
              <p className="text-slate-600 text-sm">
                Monitor your warehouse operations and transactions
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="w-4 h-4" />
              {dayjs().format("dddd, MMMM D, YYYY")}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">
                      Inbound Pending
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {inboundCount}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                      <span className="text-xs text-slate-500">
                        Active transactions
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <ArrowDownRight className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">
                      Outbound Pending
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {outboundCount}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                      <span className="text-xs text-slate-500">
                        Active transactions
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <ArrowUpRight className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">
                      Completed Orders
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {completedCount}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                      <span className="text-xs text-slate-500">
                        Successfully processed
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card> */}

            {/* <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">
                      Total Quantity
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {totalQty.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <div className="w-1 h-1 bg-purple-500 rounded-full"></div>
                      <span className="text-xs text-slate-500">
                        Items processed
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card> */}
          </div>

          {/* Recent Orders */}
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    Recent Transactions
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-1">
                    Latest warehouse operations
                  </p>
                </div>
                {/* <Button
                  variant="outline"
                  size="sm"
                  className="text-slate-600 border-slate-200 hover:bg-slate-50"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View All
                </Button> */}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 bg-slate-50/50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 px-6">
                        #
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">
                        Date
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">
                        Type
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">
                        Order ID
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">
                        Items
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">
                        Quantity
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12">
                          <div className="flex flex-col items-center justify-center text-center">
                            <Loader2 className="animate-spin w-6 h-6 text-slate-400 mb-2" />
                            <p className="text-slate-500 font-medium text-sm">
                              Loading transactions...
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : transactions?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12">
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                              <Activity className="w-6 h-6 text-slate-400" />
                            </div>
                            <p className="text-slate-600 font-medium mb-1 text-sm">
                              No transactions found
                            </p>
                            <p className="text-slate-400 text-xs">
                              Transactions will appear here once created
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions?.map((order, index) => (
                        <TableRow
                          key={order.id}
                          className="hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-b-0"
                        >
                          <TableCell className="py-3 px-6">
                            <span className="text-slate-400 font-medium text-xs">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span className="text-sm font-medium text-slate-900">
                                {dayjs(order.trans_date).format("MMM DD, YYYY")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            {renderTransType(order.trans_type)}
                          </TableCell>
                          <TableCell className="py-3">
                            <span className="text-sm font-semibold text-slate-900 font-mono">
                              {order.no_ref}
                            </span>
                          </TableCell>
                          <TableCell className="py-3">
                            {renderStatus(order.status)}
                          </TableCell>
                          <TableCell className="py-3">
                            <span className="text-sm font-medium text-slate-700">
                              {order.tot_item}
                            </span>
                          </TableCell>
                          <TableCell className="py-3">
                            <span className="text-sm font-bold text-slate-900">
                              {order.tot_qty?.toLocaleString()}
                            </span>
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
      </div>
    </Layout>
  );
}
