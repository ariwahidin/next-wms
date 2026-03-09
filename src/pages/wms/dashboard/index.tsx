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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ── TYPE ─────────────────────────────────────────────────────
// Tambahkan ke @/types/dashboard.ts atau langsung di page.tsx:

type TrendItem = {
  date: string;    // "2025-03-03"
  inbound: number;
  outbound: number;
};

type TypeMixItem = {
  name: string;   // "B2B Normal", "B2B Consignment", dst
  value: number;
};

type ChartData = {
  trend: TrendItem[];
  type_mix: TypeMixItem[];
  total: {
    total_order: number;
    total_qty: number;
  };
};

export default function Page() {
  const [transactions, setTransactions] = useState<Transactions[]>([]);
  const [loading, setLoading] = useState(true);
  // dan update initial state:
  const [chartData, setChartData] = useState<ChartData>({
    trend: [],
    type_mix: [],
    total: { total_order: 0, total_qty: 0 },
  });
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const res = await api.get("/dashboard/chart", { withCredentials: true });
        if (res.data.success) {
          setChartData(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching chart data:", err);
      } finally {
        setChartLoading(false);
      }
    };
    fetchChartData();
  }, []);

  // ── CONSTANTS ─────────────────────────────────────────────────
  // Warna untuk donut chart — tambah sesuai jumlah order_type
  const TYPE_MIX_COLORS = ["#3b82f6", "#f97316", "#eab308", "#10b981", "#8b5cf6"];
  const totalTypeMix = chartData.type_mix.reduce((s, d) => s + d.value, 0);

  // ── CUSTOM TOOLTIP ────────────────────────────────────────────
  const ChartTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { color: string; name: string; value: number }[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
          <p className="font-semibold text-slate-700 mb-2">{label}</p>
          {payload.map((p) => (
            <div key={p.name} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="text-slate-600 capitalize">{p.name}:</span>
              <span className="font-bold text-slate-900">{p.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

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

  const totalOutboundCount = transactions?.reduce((total, order) => {
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

            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Total Outbound Orders</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {chartLoading ? <Loader2 className="animate-spin w-5 h-5 text-slate-400" /> : chartData.total.total_order.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                      <span className="text-xs text-slate-500">All time</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <ShoppingCart className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Total Outbound Qty</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {chartLoading ? <Loader2 className="animate-spin w-5 h-5 text-slate-400" /> : chartData.total.total_qty.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <div className="w-1 h-1 bg-purple-500 rounded-full" />
                      <span className="text-xs text-slate-500">Total items shipped</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

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



          {/* Chart Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

            {/* Line Chart — Transaction Trend */}
            <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900">Transaction Trend</h3>
                <p className="text-xs text-slate-500 mt-0.5">Transactions by date (last 7 days)</p>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-0.5 bg-blue-500 rounded-full" />
                  <span className="text-xs text-slate-600">Inbound</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-0.5 bg-orange-500 rounded-full" />
                  <span className="text-xs text-slate-600">Outbound</span>
                </div>
              </div>

              {chartLoading ? (
                <div className="h-[220px] flex items-center justify-center">
                  <Loader2 className="animate-spin w-5 h-5 text-slate-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart
                    data={chartData.trend}
                    margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      // Format tanggal dari "2025-03-03" jadi "03 Mar"
                      tickFormatter={(v) => dayjs(v).format("DD MMM")}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }} />
                    <Line
                      type="monotone"
                      dataKey="inbound"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="outbound"
                      stroke="#f97316"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#f97316", strokeWidth: 0 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Donut Chart — Transaction Type Mix */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900">Transaction Type Mix</h3>
                <p className="text-xs text-slate-500 mt-0.5">Share of total outbound orders</p>
              </div>

              {chartLoading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <Loader2 className="animate-spin w-5 h-5 text-slate-400" />
                </div>
              ) : chartData.type_mix.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center">
                  <p className="text-xs text-slate-400">No data available</p>
                </div>
              ) : (
                <div className="relative">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={chartData.type_mix}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={82}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                      >
                        {chartData.type_mix.map((_, index) => (
                          <Cell
                            key={index}
                            fill={TYPE_MIX_COLORS[index % TYPE_MIX_COLORS.length]}
                            stroke="none"
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-slate-900">{totalTypeMix}</span>
                    <span className="text-xs text-slate-500">Orders</span>
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="space-y-2.5 mt-3">
                {chartData.type_mix.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: TYPE_MIX_COLORS[index % TYPE_MIX_COLORS.length] }}
                      />
                      <span className="text-xs text-slate-600">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">{item.value}</span>
                      <span className="text-xs text-slate-400">
                        ({totalTypeMix > 0 ? Math.round((item.value / totalTypeMix) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
                        Reference No
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
                            <span className="text-sm font-semibold text-slate-900 font-mono">
                              {order.reference_no}
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

