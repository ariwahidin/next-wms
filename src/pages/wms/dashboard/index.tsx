/* eslint-disable @typescript-eslint/no-unused-vars */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Layout from "@/components/layout";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Transactions } from "@/types/dashboard";
import dayjs from "dayjs";
import {
  ArrowUpRight, ArrowDownRight, Activity, Calendar,
  Clock, CheckCircle, XCircle, Loader2, ShoppingCart, Package,
  Filter, RotateCcw,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import OutboundPipeline from "./OutboundPipeline";

// ── Types ─────────────────────────────────────────────────────
type TrendItem = { date: string; inbound: number; outbound: number };
type TypeMixItem = { name: string; value: number };
type ChartData = {
  trend: TrendItem[];
  type_mix: TypeMixItem[];
  total: { total_order: number; total_qty: number };
};
type Owner = { ID: number; code: string; name: string };

// ── Filter state ──────────────────────────────────────────────
type FilterState = {
  preset: "all" | "today" | "this_week" | "this_month" | "custom";
  dateFrom: string;
  dateTo: string;
  ownerCode: string;
  trendPeriod: number; // hanya aktif jika preset !== "custom"
};

const PRESET_LABELS: Record<string, string> = {
  all: "All Time",
  today: "Today",
  this_week: "This Week",
  this_month: "This Month",
  custom: "Custom Range",
};

const TYPE_MIX_COLORS = ["#3b82f6", "#f97316", "#eab308", "#10b981", "#8b5cf6"];

// Hitung dateFrom/dateTo dari preset
function resolveDates(preset: FilterState["preset"]): { dateFrom: string; dateTo: string } {
  const today = dayjs().format("YYYY-MM-DD");
  if (preset === "today") return { dateFrom: today, dateTo: today };
  if (preset === "this_week") return { dateFrom: dayjs().startOf("week").format("YYYY-MM-DD"), dateTo: today };
  if (preset === "this_month") return { dateFrom: dayjs().startOf("month").format("YYYY-MM-DD"), dateTo: today };
  return { dateFrom: "", dateTo: "" }; // "all" dan "custom" — custom dihandle terpisah
}

export default function Page() {
  // ── State ───────────────────────────────────────────────────
  const [transactions, setTransactions] = useState<Transactions[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  const [chartData, setChartData] = useState<ChartData>({
    trend: [], type_mix: [], total: { total_order: 0, total_qty: 0 },
  });
  const [loadingChart, setLoadingChart] = useState(true);

  // Null-safe — API bisa return null bukan [] saat data kosong
  const safeTrend = chartData?.trend ?? [];
  const safeTypeMix = chartData?.type_mix ?? [];
  const safeTotal = chartData?.total ?? { total_order: 0, total_qty: 0 };

  const [owners, setOwners] = useState<Owner[]>([]);

  const [filter, setFilter] = useState<FilterState>({
    preset: "all",
    dateFrom: "",
    dateTo: "",
    ownerCode: "all",
    trendPeriod: 7,
  });

  // ── Fetch owners sekali saja ────────────────────────────────
  useEffect(() => {
    api.get("/owners", { withCredentials: true })
      .then((res) => { if (res.data.success) setOwners(res.data.data ?? []); })
      .catch(console.error);
  }, []);

  // ── Build query params dari filter ─────────────────────────
  const buildParams = useCallback((f: FilterState) => {
    const params: Record<string, string> = {};

    let dateFrom = f.dateFrom;
    let dateTo = f.dateTo;

    if (f.preset !== "custom" && f.preset !== "all") {
      const resolved = resolveDates(f.preset);
      dateFrom = resolved.dateFrom;
      dateTo = resolved.dateTo;
    }

    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (f.ownerCode && f.ownerCode !== "all") params.owner_code = f.ownerCode;
    // period hanya dikirim jika tidak pakai date range eksplisit
    if (!dateFrom && !dateTo) params.period = String(f.trendPeriod);

    return params;
  }, []);

  // ── Fetch transactions ──────────────────────────────────────
  const fetchTransactions = useCallback(async (f: FilterState) => {
    setLoadingTx(true);
    try {
      const res = await api.get("/dashboard", {
        params: buildParams(f),
        withCredentials: true,
      });
      if (res.data.success) {
        setTransactions(res.data.data?.transactions ?? []);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoadingTx(false);
    }
  }, [buildParams]);

  // ── Fetch chart ─────────────────────────────────────────────
  const fetchChart = useCallback(async (f: FilterState) => {
    setLoadingChart(true);
    try {
      const res = await api.get("/dashboard/chart", {
        params: buildParams(f),
        withCredentials: true,
      });
      if (res.data.success) setChartData(res.data.data);
    } catch (err) {
      console.error("Error fetching chart data:", err);
    } finally {
      setLoadingChart(false);
    }
  }, [buildParams]);

  // ── Fetch semua saat filter berubah ────────────────────────
  useEffect(() => {
    fetchTransactions(filter);
    fetchChart(filter);
  }, [filter, fetchTransactions, fetchChart]);

  // ── Computed dari transactions ──────────────────────────────
  const inboundCount = transactions?.filter((t) => t.trans_type === "inbound").length ?? 0;
  const outboundCount = transactions?.filter((t) => t.trans_type === "outbound").length ?? 0;
  const totalTypeMix = safeTypeMix.reduce((s, d) => s + d.value, 0);

  // ── Filter handlers ─────────────────────────────────────────
  const setPreset = (preset: FilterState["preset"]) => {
    setFilter((f) => ({ ...f, preset, dateFrom: "", dateTo: "" }));
  };

  const resetFilter = () => {
    setFilter({ preset: "all", dateFrom: "", dateTo: "", ownerCode: "all", trendPeriod: 7 });
  };

  // ── Helpers render ──────────────────────────────────────────
  const renderStatus = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "completed") return (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium px-2 py-0.5 text-xs">
        <CheckCircle className="w-3 h-3 mr-1" />Completed
      </Badge>
    );
    if (s === "pending") return (
      <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-medium px-2 py-0.5 text-xs">
        <Clock className="w-3 h-3 mr-1" />Pending
      </Badge>
    );
    if (s === "cancelled") return (
      <Badge className="bg-red-50 text-red-700 border-red-200 font-medium px-2 py-0.5 text-xs">
        <XCircle className="w-3 h-3 mr-1" />Cancelled
      </Badge>
    );
    return (
      <Badge className="bg-slate-50 text-slate-600 border-slate-200 font-medium px-2 py-0.5 text-xs">
        {status}
      </Badge>
    );
  };

  const renderTransType = (type: string) => (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${type === "inbound" ? "bg-blue-500" : "bg-orange-500"}`} />
      <span className={`text-sm font-medium ${type === "inbound" ? "text-blue-700" : "text-orange-700"}`}>
        {type === "inbound" ? "Inbound" : "Outbound"}
      </span>
    </div>
  );

  const ChartTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: { color: string; name: string; value: number }[];
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
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
  };

  const isFiltered = filter.preset !== "all" || filter.ownerCode !== "all";

  // ── Render ──────────────────────────────────────────────────
  return (
    <Layout title="WMS" subTitle="Dashboard">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
        <div className="pt-2 px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Dashboard 📊</h1>
              {/* <h1 className="text-2xl font-bold text-slate-900 mb-1">WMS Dashboard 📊</h1> */}
              <p className="text-slate-600 text-sm">Monitor your warehouse operations and transactions</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="w-4 h-4" />
              {dayjs().format("dddd, MMMM D, YYYY")}
            </div>
          </div>

          {/* ── Filter Bar ─────────────────────────────────────── */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-4 mb-6 flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mr-1">
              <Filter className="w-4 h-4" />
              Filters
            </div>

            {/* Preset buttons */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              {(["all", "today", "this_week", "this_month", "custom"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    filter.preset === p
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {PRESET_LABELS[p]}
                </button>
              ))}
            </div>

            {/* Custom date range — tampil hanya saat preset = custom */}
            {filter.preset === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filter.dateFrom}
                  max={filter.dateTo || undefined}
                  onChange={(e) => setFilter((f) => ({ ...f, dateFrom: e.target.value }))}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-400">–</span>
                <input
                  type="date"
                  value={filter.dateTo}
                  min={filter.dateFrom || undefined}
                  onChange={(e) => setFilter((f) => ({ ...f, dateTo: e.target.value }))}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Trend period — tampil hanya saat preset = all */}
            {filter.preset === "all" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Trend:</span>
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                  {[7, 14, 30].map((d) => (
                    <button
                      key={d}
                      onClick={() => setFilter((f) => ({ ...f, trendPeriod: d }))}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        filter.trendPeriod === d
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {d}D
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Owner */}
            <Select
              value={filter.ownerCode}
              onValueChange={(v) => setFilter((f) => ({ ...f, ownerCode: v }))}
            >
              <SelectTrigger className="w-44 h-8 text-xs border-slate-200 bg-white">
                <SelectValue placeholder="All Owners" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                {owners.map((o) => (
                  <SelectItem key={o.ID} value={o.code}>
                    {o.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Reset */}
            {isFiltered && (
              <button
                onClick={resetFilter}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>

          {/* ── Stats Cards ────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Inbound Pending</p>
                    <p className="text-2xl font-bold text-slate-900">{loadingTx ? "—" : inboundCount}</p>
                    {/* <div className="flex items-center gap-1 mt-2">
                      <div className="w-1 h-1 bg-blue-500 rounded-full" />
                      <span className="text-xs text-slate-500">Active transactions</span>
                    </div> */}
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <ArrowDownRight className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Outbound Pending</p>
                    <p className="text-2xl font-bold text-slate-900">{loadingTx ? "—" : outboundCount}</p>
                    {/* <div className="flex items-center gap-1 mt-2">
                      <div className="w-1 h-1 bg-orange-500 rounded-full" />
                      <span className="text-xs text-slate-500">Active transactions</span>
                    </div> */}
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <ArrowUpRight className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Total Outbound Orders</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {loadingChart ? <Loader2 className="animate-spin w-5 h-5 text-slate-400" /> : safeTotal.total_order.toLocaleString()}
                    </p>
                    {/* <div className="flex items-center gap-1 mt-2">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                      <span className="text-xs text-slate-500">All time</span>
                    </div> */}
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <ShoppingCart className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Total Outbound Qty</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {loadingChart ? <Loader2 className="animate-spin w-5 h-5 text-slate-400" /> : safeTotal.total_qty.toLocaleString()}
                    </p>
                    {/* <div className="flex items-center gap-1 mt-2">
                      <div className="w-1 h-1 bg-purple-500 rounded-full" />
                      <span className="text-xs text-slate-500">Total items shipped</span>
                    </div> */}
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <OutboundPipeline filter={filter} />

          {/* ── Charts ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

            {/* Line Chart */}
            <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900">Transaction Trend</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {filter.preset === "custom" && filter.dateFrom && filter.dateTo
                    ? `${dayjs(filter.dateFrom).format("DD MMM")} – ${dayjs(filter.dateTo).format("DD MMM YYYY")}`
                    : filter.preset === "all"
                    ? `Last ${filter.trendPeriod} days`
                    : PRESET_LABELS[filter.preset]}
                </p>
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
              {loadingChart ? (
                <div className="h-[220px] flex items-center justify-center">
                  <Loader2 className="animate-spin w-5 h-5 text-slate-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={safeTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => dayjs(v).format("DD MMM")} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }} />
                    <Line type="monotone" dataKey="inbound" stroke="#3b82f6" strokeWidth={2.5}
                      dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="outbound" stroke="#f97316" strokeWidth={2.5}
                      dot={{ r: 3, fill: "#f97316", strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Donut Chart */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900">Transaction Type Mix</h3>
                <p className="text-xs text-slate-500 mt-0.5">Share of total outbound orders</p>
              </div>
              {loadingChart ? (
                <div className="h-[200px] flex items-center justify-center">
                  <Loader2 className="animate-spin w-5 h-5 text-slate-400" />
                </div>
              ) : safeTypeMix.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center">
                  <p className="text-xs text-slate-400">No data available</p>
                </div>
              ) : (
                <div className="relative">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={safeTypeMix} cx="50%" cy="50%"
                        innerRadius={58} outerRadius={82} paddingAngle={3}
                        dataKey="value" nameKey="name">
                        {safeTypeMix.map((_, index) => (
                          <Cell key={index} fill={TYPE_MIX_COLORS[index % TYPE_MIX_COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-slate-900">{totalTypeMix}</span>
                    <span className="text-xs text-slate-500">Orders</span>
                  </div>
                </div>
              )}
              <div className="space-y-2.5 mt-3">
                {safeTypeMix.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: TYPE_MIX_COLORS[index % TYPE_MIX_COLORS.length] }} />
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

          {/* ── Recent Transactions ─────────────────────────────── */}
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-100 p-6">
              <CardTitle className="text-lg font-semibold text-slate-900">Recent Transactions</CardTitle>
              <p className="text-sm text-slate-600 mt-1">Latest warehouse operations</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 bg-slate-50/50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 px-6">#</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">Date</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">Type</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">Order ID</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">Reference No</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">Items</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingTx ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-12">
                          <div className="flex flex-col items-center justify-center text-center">
                            <Loader2 className="animate-spin w-6 h-6 text-slate-400 mb-2" />
                            <p className="text-slate-500 font-medium text-sm">Loading transactions...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : transactions?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-12">
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                              <Activity className="w-6 h-6 text-slate-400" />
                            </div>
                            <p className="text-slate-600 font-medium mb-1 text-sm">No transactions found</p>
                            <p className="text-slate-400 text-xs">Try adjusting the filters above</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions?.map((order, index) => (
                        <TableRow key={order.id}
                          className="hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-b-0">
                          <TableCell className="py-3 px-6">
                            <span className="text-slate-400 font-medium text-xs">{String(index + 1).padStart(2, "0")}</span>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span className="text-sm font-medium text-slate-900">
                                {dayjs(order.trans_date).format("MMM DD, YYYY")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">{renderTransType(order.trans_type)}</TableCell>
                          <TableCell className="py-3">
                            <span className="text-sm font-semibold text-slate-900 font-mono">{order.no_ref}</span>
                          </TableCell>
                          <TableCell className="py-3">
                            <span className="text-sm font-semibold text-slate-900 font-mono">{order.reference_no}</span>
                          </TableCell>
                          <TableCell className="py-3">{renderStatus(order.status)}</TableCell>
                          <TableCell className="py-3">
                            <span className="text-sm font-medium text-slate-700">{order.tot_item}</span>
                          </TableCell>
                          <TableCell className="py-3">
                            <span className="text-sm font-bold text-slate-900">{order.tot_qty?.toLocaleString()}</span>
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