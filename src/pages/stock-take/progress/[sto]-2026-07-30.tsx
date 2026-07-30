/* eslint-disable react-hooks/exhaustive-deps */
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
import { Input } from "@/components/ui/input";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowBigLeft, Search, PackageCheck, MapPin, TrendingUp, Download } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────

type ProgressBySKU = {
  item_id: number;
  item_name: string;
  sku: string;
  count_location_system: number;
  total_qty_system: number;
  count_location_sto: number;
  total_qty_sto: number;
  progress_location: number;
  progress_qty: number;
};

// Matches backend DivisionDayProgress (harian, bukan cumulative).
// location_counted/qty_counted: null kalau division tsb gak ada aktivitas
// di tanggal itu (render sebagai "-" di UI, bukan 0).
type DivisionDayProgress = {
  location_counted: number | null;
  qty_counted: number | null;
  location_percent: number | null;
  qty_percent: number | null;
};

// Matches backend DivisionPivotRow
type DivisionPivotRow = {
  division_code: string;
  system_location: number;
  system_qty: number;
  daily: Record<string, DivisionDayProgress>;
  total_location_counted: number;
  total_qty_counted: number;
  total_location_percent: number;
  total_qty_percent: number;
};

// Matches backend GrandTotalRow — dipakai buat baris "Total" (gabungan
// semua division) dan "Total % Counting" paling bawah.
type GrandTotalRow = {
  system_location: number;
  system_qty: number;
  daily: Record<string, DivisionDayProgress>;
  total_location_counted: number;
  total_qty_counted: number;
  total_location_percent: number;
  total_qty_percent: number;
};

type ProgressByDivisionResult = {
  dates: string[];
  divisions: DivisionPivotRow[];
  grand_total: GrandTotalRow;
};

type ResultTab = "bySku" | "byDivision" | "byLocation" | "byPic";


type LocationItemDetail = {
  item_id: number;
  item_name: string;
  sku: string;
  system_qty: number;
  counted_qty: number;
  variance: number;
  status: "matched" | "over" | "under" | "not_counted" | "extra";
};

type LocationPivotRow = {
  location: string;
  division_code: string;
  system_item_count: number;
  system_qty: number;
  counted_item_count: number;
  counted_qty: number;
  status: "not_started" | "partial" | "done";
  has_discrepancy: boolean;
  items: LocationItemDetail[];
};


type PicQualityBreakdown = {
  matched: number;
  over: number;
  under: number;
  extra: number;
};

type PicProgress = {
  user_id: number;
  user_name: string;
  location_count: number;
  item_count: number;
  scan_count: number;
  qty_counted: number;
  first_scan_at: string | null;
  last_scan_at: string | null;
  quality: PicQualityBreakdown;
};


// ─── Helpers ────────────────────────────────────────────────────────────

const formatDateLabel = (isoDate: string) => {
  const d = new Date(isoDate);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
};

const progressColor = (pct: number) => {
  if (pct >= 100) return "text-green-600";
  if (pct >= 50) return "text-blue-600";
  return "text-amber-600";
};

const formatDateTime = (iso: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatNum = (n: number | null | undefined) =>
  n == null ? "-" : n.toLocaleString("id-ID");

const formatPct = (n: number | null | undefined) => (n == null ? "-" : `${n.toFixed(2)}%`);

// ─── KPI Summary Cards ──────────────────────────────────────────────────

function SummaryCards({ data }: { data: ProgressBySKU[] }) {
  const totalQtySystem = data.reduce((s, d) => s + d.total_qty_system, 0);
  const totalQtySto = data.reduce((s, d) => s + d.total_qty_sto, 0);
  const overallProgress =
    totalQtySystem > 0 ? Math.round((totalQtySto / totalQtySystem) * 10000) / 100 : 0;

  const totalSku = data.length;
  const skuCounted = data.filter((d) => d.total_qty_sto > 0).length;

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
          <TrendingUp size={14} />
          Qty Progress
        </div>
        <div className={`text-2xl font-bold ${progressColor(overallProgress)}`}>
          {overallProgress}%
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          {totalQtySto.toLocaleString()} / {totalQtySystem.toLocaleString()}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
          <PackageCheck size={14} />
          SKU Counted
        </div>
        <div className="text-2xl font-bold text-gray-800">
          {skuCounted} / {totalSku}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">unique items</div>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
          <MapPin size={14} />
          Locations
        </div>
        <div className="text-2xl font-bold text-gray-800">
          {data.reduce((s, d) => s + d.count_location_sto, 0).toLocaleString()}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">scan entries (location x item)</div>
      </div>
    </div>
  );
}

// ─── By SKU Table ───────────────────────────────────────────────────────

function BySkuTable({ data }: { data: ProgressBySKU[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const term = search.toLowerCase();
    return data.filter(
      (row) =>
        row.item_name?.toLowerCase().includes(term) ||
        row.sku?.toLowerCase().includes(term)
    );
  }, [data, search]);

  const totals = useMemo(
    () => ({
      locationSystem: filtered.reduce((s, d) => s + d.count_location_system, 0),
      qtySystem: filtered.reduce((s, d) => s + d.total_qty_system, 0),
      locationSto: filtered.reduce((s, d) => s + d.count_location_sto, 0),
      qtySto: filtered.reduce((s, d) => s + d.total_qty_sto, 0),
    }),
    [filtered]
  );

  const totalProgressLocation =
    totals.locationSystem > 0
      ? Math.round((totals.locationSto / totals.locationSystem) * 10000) / 100
      : 0;
  const totalProgressQty =
    totals.qtySystem > 0 ? Math.round((totals.qtySto / totals.qtySystem) * 10000) / 100 : 0;

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
        <Input
          placeholder="Search item name or SKU..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-auto rounded-xl border shadow-sm">
        <Table className="text-sm">
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2} className="border border-gray-200 align-bottom">
                Item
              </TableHead>
              <TableHead colSpan={2} className="text-center border border-gray-200">
                Stock System
              </TableHead>
              <TableHead colSpan={2} className="text-center border border-gray-200">
                Data STO
              </TableHead>
              <TableHead colSpan={2} className="text-center border border-gray-200">
                Progress (%)
              </TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="border border-gray-200">Location</TableHead>
              <TableHead className="border border-gray-200">Qty</TableHead>
              <TableHead className="border border-gray-200">Location</TableHead>
              <TableHead className="border border-gray-200">Qty</TableHead>
              <TableHead className="border border-gray-200">Location</TableHead>
              <TableHead className="border border-gray-200">Qty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((row) => (
                <TableRow key={row.item_id}>
                  <TableCell className="border border-gray-200">
                    <div className="font-medium text-gray-800">{row.item_name || "-"}</div>
                    <div className="text-xs text-gray-400 font-mono">{row.sku || "-"}</div>
                  </TableCell>
                  <TableCell className="border border-gray-200">
                    {row.count_location_system}
                  </TableCell>
                  <TableCell className="border border-gray-200">{row.total_qty_system}</TableCell>
                  <TableCell className="border border-gray-200">
                    {row.count_location_sto}
                  </TableCell>
                  <TableCell className="border border-gray-200">{row.total_qty_sto}</TableCell>
                  <TableCell
                    className={`border border-gray-200 font-medium ${progressColor(
                      row.progress_location
                    )}`}
                  >
                    {row.progress_location}%
                  </TableCell>
                  <TableCell
                    className={`border border-gray-200 font-medium ${progressColor(
                      row.progress_qty
                    )}`}
                  >
                    {row.progress_qty}%
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-gray-500 py-6 border border-gray-200"
                >
                  No items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {filtered.length > 0 && (
            <TableFooter>
              <TableRow className="font-semibold bg-muted">
                <TableCell className="border border-gray-200">Total</TableCell>
                <TableCell className="border border-gray-200">{totals.locationSystem}</TableCell>
                <TableCell className="border border-gray-200">{totals.qtySystem}</TableCell>
                <TableCell className="border border-gray-200">{totals.locationSto}</TableCell>
                <TableCell className="border border-gray-200">{totals.qtySto}</TableCell>
                <TableCell
                  className={`border border-gray-200 ${progressColor(totalProgressLocation)}`}
                >
                  {totalProgressLocation}%
                </TableCell>
                <TableCell className={`border border-gray-200 ${progressColor(totalProgressQty)}`}>
                  {totalProgressQty}%
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}

// ─── By Division Pivot Table (mirrors "Report Daily Progress STO" Excel) ──
//
// Layout persis kayak Excel:
//   Header:   Inventory Stock | [tanggal: Loc, Qty]... | Total (Loc, Qty)
//   Body:     1 row per division -> Count Location & Count Qty (harian, bukan cumulative)
//   Row Total: gabungan semua division (dari grand_total)
//   Row Achievement per division: % (location_percent / qty_percent) per tanggal
//   Row Total % Counting: % gabungan semua division (dari grand_total)

function ByDivisionTable({ data, sto }: { data: ProgressByDivisionResult | null; sto: string }) {
  if (!data || data.divisions.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-6">No division data found.</p>;
  }

  const { dates, divisions, grand_total } = data;

  const handleExport = async () => {
    try {
      const res = await api.get(`/stock-take/export-division/${sto}`, {
        withCredentials: true,
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Report_Daily_Progress_STO_${sto}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export excel:", err);
    }
  };

  return (

    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download size={14} className="mr-1.5" />
          Download Excel
        </Button>
      </div>
      <div className="overflow-auto rounded-xl border shadow-sm">
        <Table className="text-sm">
          <TableHeader>
            {/* Row 1: group headers */}
            <TableRow>
              <TableHead
                rowSpan={2}
                className="border border-gray-200 align-bottom sticky left-0 bg-white z-10"
              >
                Category
              </TableHead>
              <TableHead
                colSpan={2}
                className="text-center border border-gray-200 bg-purple-50 sticky left-[120px] bg-white z-10"
              >
                Inventory Stock
              </TableHead>
              {dates.map((date) => (
                <TableHead
                  key={date}
                  colSpan={2}
                  className="text-center border border-gray-200 bg-blue-50"
                >
                  {formatDateLabel(date)}
                </TableHead>
              ))}
              <TableHead colSpan={2} className="text-center border border-gray-200 bg-orange-50">
                Total
              </TableHead>
            </TableRow>
            {/* Row 2: sub headers */}
            <TableRow>
              <TableHead className="border border-gray-200 sticky left-[120px] bg-white z-10">
                Loc
              </TableHead>
              <TableHead className="border border-gray-200 sticky left-[184px] bg-white z-10">
                Qty
              </TableHead>
              {dates.map((date) => (
                <Fragment key={date}>
                  <TableHead className="border border-gray-200">Loc</TableHead>
                  <TableHead className="border border-gray-200">Qty</TableHead>
                </Fragment>
              ))}
              <TableHead className="border border-gray-200 font-semibold">Loc</TableHead>
              <TableHead className="border border-gray-200 font-semibold">Qty</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* ── Body: 1 baris per division, angka harian (bukan cumulative) ── */}
            {divisions.map((division) => (
              <TableRow key={division.division_code}>
                <TableCell className="border border-gray-200 font-medium sticky left-0 bg-white z-10">
                  {division.division_code}
                </TableCell>
                <TableCell className="border border-gray-200 sticky left-[120px] bg-white z-10">
                  {formatNum(division.system_location)}
                </TableCell>
                <TableCell className="border border-gray-200 sticky left-[184px] bg-white z-10">
                  {formatNum(division.system_qty)}
                </TableCell>
                {dates.map((date) => {
                  const day = division.daily[date];
                  return (
                    <Fragment key={date}>
                      <TableCell className="border border-gray-200 text-center">
                        {day ? formatNum(day.location_counted) : "-"}
                      </TableCell>
                      <TableCell className="border border-gray-200 text-center">
                        {day ? formatNum(day.qty_counted) : "-"}
                      </TableCell>
                    </Fragment>
                  );
                })}
                <TableCell className="border border-gray-200 text-center font-medium">
                  {formatNum(division.total_location_counted)}
                </TableCell>
                <TableCell className="border border-gray-200 text-center font-medium">
                  {formatNum(division.total_qty_counted)}
                </TableCell>
              </TableRow>
            ))}

            {/* ── Row: Total (gabungan semua division) ── */}
            <TableRow className="bg-orange-50 font-semibold">
              <TableCell className="border border-gray-200 sticky left-0 bg-orange-50 z-10">
                Total
              </TableCell>
              <TableCell className="border border-gray-200 sticky left-[120px] bg-orange-50 z-10">
                {formatNum(grand_total.system_location)}
              </TableCell>
              <TableCell className="border border-gray-200 sticky left-[184px] bg-orange-50 z-10">
                {formatNum(grand_total.system_qty)}
              </TableCell>
              {dates.map((date) => {
                const day = grand_total.daily[date];
                return (
                  <Fragment key={date}>
                    <TableCell className="border border-gray-200 text-center">
                      {formatNum(day?.location_counted)}
                    </TableCell>
                    <TableCell className="border border-gray-200 text-center">
                      {formatNum(day?.qty_counted)}
                    </TableCell>
                  </Fragment>
                );
              })}
              <TableCell className="border border-gray-200 text-center">
                {formatNum(grand_total.total_location_counted)}
              </TableCell>
              <TableCell className="border border-gray-200 text-center">
                {formatNum(grand_total.total_qty_counted)}
              </TableCell>
            </TableRow>

            {/* ── Rows: Achievement per division (%) ── */}
            {divisions.map((division) => (
              <TableRow key={`ach-${division.division_code}`} className="bg-blue-50/60 text-xs">
                <TableCell className="border border-gray-200 sticky left-0 bg-blue-50/60 z-10">
                  Achievement {division.division_code}
                </TableCell>
                <TableCell className="border border-gray-200 sticky left-[120px] bg-blue-50/60 z-10" />
                <TableCell className="border border-gray-200 sticky left-[184px] bg-blue-50/60 z-10" />
                {dates.map((date) => {
                  const day = division.daily[date];
                  return (
                    <Fragment key={date}>
                      <TableCell
                        className={`border border-gray-200 text-center ${day?.location_percent != null ? progressColor(day.location_percent) : ""
                          }`}
                      >
                        {day ? formatPct(day.location_percent) : "-"}
                      </TableCell>
                      <TableCell
                        className={`border border-gray-200 text-center ${day?.qty_percent != null ? progressColor(day.qty_percent) : ""
                          }`}
                      >
                        {day ? formatPct(day.qty_percent) : "-"}
                      </TableCell>
                    </Fragment>
                  );
                })}
                <TableCell
                  className={`border border-gray-200 text-center font-medium ${progressColor(
                    division.total_location_percent
                  )}`}
                >
                  {formatPct(division.total_location_percent)}
                </TableCell>
                <TableCell
                  className={`border border-gray-200 text-center font-medium ${progressColor(
                    division.total_qty_percent
                  )}`}
                >
                  {formatPct(division.total_qty_percent)}
                </TableCell>
              </TableRow>
            ))}

            {/* ── Row: Total % Counting (gabungan semua division) ── */}
            <TableRow className="bg-blue-100 font-semibold">
              <TableCell className="border border-gray-200 sticky left-0 bg-blue-100 z-10">
                Total % Counting
              </TableCell>
              <TableCell className="border border-gray-200 sticky left-[120px] bg-blue-100 z-10" />
              <TableCell className="border border-gray-200 sticky left-[184px] bg-blue-100 z-10" />
              {dates.map((date) => {
                const day = grand_total.daily[date];
                return (
                  <Fragment key={date}>
                    <TableCell
                      className={`border border-gray-200 text-center ${day?.location_percent != null ? progressColor(day.location_percent) : ""
                        }`}
                    >
                      {formatPct(day?.location_percent)}
                    </TableCell>
                    <TableCell
                      className={`border border-gray-200 text-center ${day?.qty_percent != null ? progressColor(day.qty_percent) : ""
                        }`}
                    >
                      {formatPct(day?.qty_percent)}
                    </TableCell>
                  </Fragment>
                );
              })}
              <TableCell
                className={`border border-gray-200 text-center ${progressColor(
                  grand_total.total_location_percent
                )}`}
              >
                {formatPct(grand_total.total_location_percent)}
              </TableCell>
              <TableCell
                className={`border border-gray-200 text-center ${progressColor(
                  grand_total.total_qty_percent
                )}`}
              >
                {formatPct(grand_total.total_qty_percent)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Main Progress Dashboard ─────────────────────────────────────────────

function ProgressDashboard({ sto }: { sto: string }) {
  const [tab, setTab] = useState<ResultTab>("bySku");
  const [bySkuData, setBySkuData] = useState<ProgressBySKU[]>([]);
  const [byDivisionData, setByDivisionData] = useState<ProgressByDivisionResult | null>(null);
  const [byLocationData, setByLocationData] = useState<LocationPivotRow[]>([]);
  const [byPicData, setByPicData] = useState<PicProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!sto) return;
    setIsLoading(true);
    try {
      const [skuRes, divisionRes, locationRes, picRes] = await Promise.all([
        api.get(`/stock-take/progress-sku/${sto}`, { withCredentials: true }),
        api.get(`/stock-take/progress-division/${sto}`, { withCredentials: true }),
        api.get(`/stock-take/progress-location/${sto}`, { withCredentials: true }),
        api.get(`/stock-take/progress-pic/${sto}`, { withCredentials: true }),
      ]);
      if (skuRes.data.success) setBySkuData(skuRes.data.data);
      if (divisionRes.data.success) setByDivisionData(divisionRes.data.data);
      if (locationRes.data.success) setByLocationData(locationRes.data.data);
      if (picRes.data.success) setByPicData(picRes.data.data);
    } catch (err) {
      console.error("Failed to fetch progress:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sto) fetchData();
  }, [sto]);

  return (
    <>
      <div className="pb-4">
        <Button variant="outline" onClick={() => history.back()}>
          <ArrowBigLeft />
          Back
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          <SummaryCards data={bySkuData} />

          <div className="flex border-b border-gray-200 mb-4">
            <button
              type="button"
              onClick={() => setTab("bySku")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${tab === "bySku"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              By SKU
            </button>
            <button
              type="button"
              onClick={() => setTab("byDivision")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${tab === "byDivision"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              By Division
            </button>
            <button
              type="button"
              onClick={() => setTab("byLocation")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${tab === "byLocation"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              By Location
            </button>
            <button
              type="button"
              onClick={() => setTab("byPic")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${tab === "byPic"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              By PIC
            </button>
          </div>

          {tab === "bySku" && <BySkuTable data={bySkuData} />}
          {tab === "byDivision" && <ByDivisionTable data={byDivisionData} sto={sto} />}
          {tab === "byLocation" && <ByLocationTable data={byLocationData} />}
          {tab === "byPic" && <ByPicTable data={byPicData} />}
        </>
      )}
    </>
  );
}

const locationStatusBadge = (status: LocationPivotRow["status"]) => {
  const map = {
    not_started: "bg-gray-100 text-gray-600",
    partial: "bg-amber-100 text-amber-700",
    done: "bg-green-100 text-green-700",
  };
  const label = { not_started: "Not Started", partial: "Partial", done: "Done" };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {label[status]}
    </span>
  );
};

const itemStatusBadge = (status: LocationItemDetail["status"]) => {
  const map = {
    matched: "bg-green-100 text-green-700",
    over: "bg-blue-100 text-blue-700",
    under: "bg-red-100 text-red-700",
    not_counted: "bg-gray-100 text-gray-500",
    extra: "bg-purple-100 text-purple-700",
  };
  const label = {
    matched: "Matched",
    over: "Over",
    under: "Under",
    not_counted: "Not Counted",
    extra: "Extra (Unplanned)",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {label[status]}
    </span>
  );
};

function ByLocationTable({ data }: { data: LocationPivotRow[] }) {
  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | LocationPivotRow["status"]>("all");
  const [discrepancyOnly, setDiscrepancyOnly] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const divisions = useMemo(
    () => Array.from(new Set(data.map((d) => d.division_code))).sort(),
    [data]
  );

  const filtered = useMemo(() => {
    return data.filter((row) => {
      if (search.trim() && !row.location.toLowerCase().includes(search.toLowerCase())) return false;
      if (divisionFilter !== "all" && row.division_code !== divisionFilter) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (discrepancyOnly && !row.has_discrepancy) return false;
      return true;
    });
  }, [data, search, divisionFilter, statusFilter, discrepancyOnly]);

  const toggleExpand = (location: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(location) ? next.delete(location) : next.add(location);
      return next;
    });
  };

  const statusTabs: { key: "all" | LocationPivotRow["status"]; label: string }[] = [
    { key: "all", label: "All" },
    { key: "not_started", label: "Not Started" },
    { key: "partial", label: "Partial" },
    { key: "done", label: "Done" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
          <Input
            placeholder="Search location..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="border rounded-md px-2 py-2 text-sm"
          value={divisionFilter}
          onChange={(e) => setDivisionFilter(e.target.value)}
        >
          <option value="all">All Divisions</option>
          {divisions.map((div) => (
            <option key={div} value={div}>
              {div}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={discrepancyOnly}
            onChange={(e) => setDiscrepancyOnly(e.target.checked)}
          />
          Discrepancies only
        </label>
      </div>

      <div className="flex gap-1">
        {statusTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setStatusFilter(t.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${statusFilter === t.key
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-auto rounded-xl border shadow-sm">
        <Table className="text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="border border-gray-200 w-8" />
              <TableHead className="border border-gray-200">Location</TableHead>
              <TableHead className="border border-gray-200">Division</TableHead>
              <TableHead className="border border-gray-200">Items (Sys/Counted)</TableHead>
              <TableHead className="border border-gray-200">Qty (Sys/Counted)</TableHead>
              <TableHead className="border border-gray-200">Status</TableHead>
              <TableHead className="border border-gray-200">Variance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((row) => (
                <Fragment key={row.location}>
                  <TableRow
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleExpand(row.location)}
                  >
                    <TableCell className="border border-gray-200 text-center text-gray-400">
                      {expanded.has(row.location) ? "▾" : "▸"}
                    </TableCell>
                    <TableCell className="border border-gray-200 font-medium">
                      {row.location}
                    </TableCell>
                    <TableCell className="border border-gray-200">{row.division_code}</TableCell>
                    <TableCell className="border border-gray-200">
                      {row.system_item_count} / {row.counted_item_count}
                    </TableCell>
                    <TableCell className="border border-gray-200">
                      {row.system_qty} / {row.counted_qty}
                    </TableCell>
                    <TableCell className="border border-gray-200">
                      {locationStatusBadge(row.status)}
                    </TableCell>
                    <TableCell className="border border-gray-200">
                      {row.has_discrepancy ? (
                        <span className="text-red-600 font-medium">Has Variance</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>

                  {expanded.has(row.location) && (
                    <TableRow>
                      <TableCell colSpan={7} className="border border-gray-200 bg-gray-50 p-3">
                        <Table className="text-xs">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead>SKU</TableHead>
                              <TableHead>System Qty</TableHead>
                              <TableHead>Counted Qty</TableHead>
                              <TableHead>Variance</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {row.items.map((item) => (
                              <TableRow key={item.item_id}>
                                <TableCell>{item.item_name || "-"}</TableCell>
                                <TableCell className="font-mono">{item.sku || "-"}</TableCell>
                                <TableCell>{item.system_qty}</TableCell>
                                <TableCell>{item.counted_qty}</TableCell>
                                <TableCell
                                  className={
                                    item.variance === 0
                                      ? "text-gray-400"
                                      : item.variance > 0
                                        ? "text-blue-600 font-medium"
                                        : "text-red-600 font-medium"
                                  }
                                >
                                  {item.variance > 0 ? `+${item.variance}` : item.variance}
                                </TableCell>
                                <TableCell>{itemStatusBadge(item.status)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-6 border border-gray-200">
                  No locations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function QualityBar({ quality, total }: { quality: PicQualityBreakdown; total: number }) {
  if (total === 0) return <span className="text-xs text-gray-400">No data</span>;

  const segments = [
    { key: "matched", value: quality.matched, color: "bg-green-500" },
    { key: "over", value: quality.over, color: "bg-blue-500" },
    { key: "under", value: quality.under, color: "bg-red-500" },
    { key: "extra", value: quality.extra, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-1 min-w-[140px]">
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
        {segments.map(
          (seg) =>
            seg.value > 0 && (
              <div
                key={seg.key}
                className={seg.color}
                style={{ width: `${(seg.value / total) * 100}%` }}
                title={`${seg.key}: ${seg.value}`}
              />
            )
        )}
      </div>
      <div className="flex gap-2 text-[10px] text-gray-500">
        <span>✓{quality.matched}</span>
        {quality.over > 0 && <span className="text-blue-600">▲{quality.over}</span>}
        {quality.under > 0 && <span className="text-red-600">▼{quality.under}</span>}
        {quality.extra > 0 && <span className="text-purple-600">?{quality.extra}</span>}
      </div>
    </div>
  );
}

type PicSortKey = "qty_counted" | "location_count" | "scan_count";

function ByPicTable({ data }: { data: PicProgress[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<PicSortKey>("qty_counted");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = term
      ? data.filter((row) => row.user_name?.toLowerCase().includes(term))
      : data;
    return [...rows].sort((a, b) => b[sortKey] - a[sortKey]);
  }, [data, search, sortKey]);

  const sortOptions: { key: PicSortKey; label: string }[] = [
    { key: "qty_counted", label: "Qty Counted" },
    { key: "location_count", label: "Locations" },
    { key: "scan_count", label: "Scan Count" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
          <Input
            placeholder="Search PIC name..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-1">
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSortKey(opt.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${sortKey === opt.key
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
              Sort: {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-auto rounded-xl border shadow-sm">
        <Table className="text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="border border-gray-200 w-8">#</TableHead>
              <TableHead className="border border-gray-200">PIC</TableHead>
              <TableHead className="border border-gray-200">Locations</TableHead>
              <TableHead className="border border-gray-200">Items</TableHead>
              <TableHead className="border border-gray-200">Scans</TableHead>
              <TableHead className="border border-gray-200">Qty Counted</TableHead>
              <TableHead className="border border-gray-200">Quality</TableHead>
              <TableHead className="border border-gray-200">First / Last Scan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((row, idx) => {
                const qualityTotal =
                  row.quality.matched + row.quality.over + row.quality.under + row.quality.extra;
                return (
                  <TableRow key={row.user_id}>
                    <TableCell className="border border-gray-200 text-gray-400">{idx + 1}</TableCell>
                    <TableCell className="border border-gray-200 font-medium">
                      {row.user_name || "-"}
                    </TableCell>
                    <TableCell className="border border-gray-200">{row.location_count}</TableCell>
                    <TableCell className="border border-gray-200">{row.item_count}</TableCell>
                    <TableCell className="border border-gray-200">{row.scan_count}</TableCell>
                    <TableCell className="border border-gray-200 font-medium">
                      {row.qty_counted.toLocaleString()}
                    </TableCell>
                    <TableCell className="border border-gray-200">
                      <QualityBar quality={row.quality} total={qualityTotal} />
                    </TableCell>
                    <TableCell className="border border-gray-200 text-xs text-gray-500">
                      <div>{formatDateTime(row.first_scan_at)}</div>
                      <div>{formatDateTime(row.last_scan_at)}</div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500 py-6 border border-gray-200">
                  No PIC data found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const router = useRouter();
  const { sto } = router.query;
  const stoValue = Array.isArray(sto) ? sto[0] : sto ?? "";

  const [subtitle, setSubtitle] = useState("");

  useEffect(() => {
    if (sto) {
      setSubtitle(`Progress - ID: ${sto}`);
    }
  }, [sto]);

  return (
    <Layout title="Cycle Count" subTitle={subtitle}>
      <div className="p-4">
        <ProgressDashboard sto={stoValue} />
      </div>
    </Layout>
  );
}