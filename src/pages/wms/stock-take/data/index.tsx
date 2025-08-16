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
import {
  Loader2,
  Calendar,
  Hash,
  TrendingUp,
  Plus,
  Eye,
  Edit3,
  Trash2,
  ChartBar,
  X,
  Filter,
  MapPin,
  Layers,
  Grid,
  Package,
} from "lucide-react";


type StockTake = {
  ID: number;
  code: string;
  status: string;
  CreatedAt: string;
};

// start modal component
const StockTakeModal = ({ isOpen, onClose, onGenerate }) => {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [filters, setFilters] = useState({
    fromRow: "",
    toRow: "",
    fromBay: "",
    toBay: "",
    fromLevel: "",
    toLevel: "",
    fromBin: "",
    toBin: "",
    area: "",
  });


  // Get unique values for dropdowns
  const getUniqueValues = (key) => {
    const values = locations.map((loc) => loc[key]).filter(Boolean);
    return [...new Set(values)].sort();
  };

  const rows = getUniqueValues("row");
  const bays = getUniqueValues("bay");
  const levels = getUniqueValues("level");
  const bins = getUniqueValues("bin");
  const areas = getUniqueValues("area");

  // Fetch locations on modal open
  useEffect(() => {
    if (isOpen) {
      fetchLocations();
    }
  }, [isOpen]);

  const fetchLocations = async () => {
    try {
      const res = await api.get("/stock-take/locations");
      if (res.data.success) {
        setLocations(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch locations:", err);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Call API dengan filter parameters
      await onGenerate(filters);
      onClose();
    } catch (err) {
      console.error("Generate failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      fromRow: "",
      toRow: "",
      fromBay: "",
      toBay: "",
      fromLevel: "",
      toLevel: "",
      fromBin: "",
      toBin: "",
      area: "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all sm:w-full sm:max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <Package className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Generate Stock Take
                </h3>
                <p className="text-sm text-gray-500">
                  Set location filters for stock take generation
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="space-y-6">
              {/* Area Filter */}
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />sq
                  Area
                </label>
                <select
                  value={filters.area}
                  onChange={(e) => handleFilterChange("area", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                >
                  <option value="">All Areas</option>
                  {areas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div> */}

              {/* Row Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Grid className="inline h-4 w-4 mr-1" />
                  Row Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      From Row
                    </label>
                    <select
                      value={filters.fromRow}
                      onChange={(e) =>
                        handleFilterChange("fromRow", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">Select</option>
                      {rows.map((row) => (
                        <option key={row} value={row}>
                          {row}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      To Row
                    </label>
                    <select
                      value={filters.toRow}
                      onChange={(e) =>
                        handleFilterChange("toRow", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">Select</option>
                      {rows.map((row) => (
                        <option key={row} value={row}>
                          {row}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Bay Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Grid className="inline h-4 w-4 mr-1" />
                  Bay Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      From Bay
                    </label>
                    <select
                      value={filters.fromBay}
                      onChange={(e) =>
                        handleFilterChange("fromBay", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">Select</option>
                      {bays.map((bay) => (
                        <option key={bay} value={bay}>
                          {bay}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      To Bay
                    </label>
                    <select
                      value={filters.toBay}
                      onChange={(e) =>
                        handleFilterChange("toBay", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">Select</option>
                      {bays.map((bay) => (
                        <option key={bay} value={bay}>
                          {bay}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Level Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Layers className="inline h-4 w-4 mr-1" />
                  Level Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      From Level
                    </label>
                    <select
                      value={filters.fromLevel}
                      onChange={(e) =>
                        handleFilterChange("fromLevel", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">Select</option>
                      {levels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      To Level
                    </label>
                    <select
                      value={filters.toLevel}
                      onChange={(e) =>
                        handleFilterChange("toLevel", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">Select</option>
                      {levels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Bin Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="inline h-4 w-4 mr-1" />
                  Bin Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      From Bin
                    </label>
                    <select
                      value={filters.fromBin}
                      onChange={(e) =>
                        handleFilterChange("fromBin", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">Select</option>
                      {bins.map((bin) => (
                        <option key={bin} value={bin}>
                          {bin}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      To Bin
                    </label>
                    <select
                      value={filters.toBin}
                      onChange={(e) =>
                        handleFilterChange("toBin", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">Select</option>
                      {bins.map((bin) => (
                        <option key={bin} value={bin}>
                          {bin}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Filter Summary */}
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Filter Summary:
                </h4>
                <div className="text-xs text-gray-600 space-y-1">
                  {filters.area && <div>Area: {filters.area}</div>}
                  {(filters.fromRow || filters.toRow) && (
                    <div>
                      Row: {filters.fromRow || "All"} to{" "}
                      {filters.toRow || "All"}
                    </div>
                  )}
                  {(filters.fromBay || filters.toBay) && (
                    <div>
                      Bay: {filters.fromBay || "All"} to{" "}
                      {filters.toBay || "All"}
                    </div>
                  )}
                  {(filters.fromLevel || filters.toLevel) && (
                    <div>
                      Level: {filters.fromLevel || "All"} to{" "}
                      {filters.toLevel || "All"}
                    </div>
                  )}
                  {(filters.fromBin || filters.toBin) && (
                    <div>
                      Bin: {filters.fromBin || "All"} to{" "}
                      {filters.toBin || "All"}
                    </div>
                  )}
                  {!Object.values(filters).some((v) => v) && (
                    <div className="text-gray-400">
                      No filters applied - All locations will be included
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Filter className="h-4 w-4" />
              Reset Filters
            </button>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Generate Stock Take
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// End modal component

export default function StockTakePage() {
  const [data, setData] = useState<StockTake[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleNewStockTake = () => {
    setIsModalOpen(true);
  };

  const generateStockTake = async (filters) => {
    setLoading(true);
    try {
      // Ganti dengan API call yang sebenarnya
      console.log("Generating stock take with filters:", filters);

      const res = await api.post("/stock-take/generate", { filters }, { withCredentials: true });
      if (res.data.success) {
        fetchStockTakes(); // reload data
      }

      // Simulasi delay
      // await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Stock take generated successfully!");
    } catch (err) {
      console.error("Generate failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // const handleNewStockTake = () => {
  //   // Navigate to create new stock take page
  //   // router.push('/stock-take/create');
  //   // Or you can add your create logic here
  //   generateStockTake();
  // };

  // Generate stock take
  // const generateStockTake = async () => {
  //   setLoading(true);
  //   try {
  //     const res = await api.post("/stock-take/generate", null, { withCredentials: true });
  //     if (res.data.success) {
  //       // await fetchStockTakes(); // reload data
  //       // router.push("/stock-take/list");
  //       fetchStockTakes(); // reload data
  //     }
  //   } catch (err) {
  //     console.error("Generate failed:", err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

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
    <Layout title="Stock Take" subTitle="Stock Take Activity" className="w-full">
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
                  <h1 className="text-lg font-semibold text-slate-900">
                    Stock Take Activity
                  </h1>
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
                    <p className="text-xs font-medium text-slate-600">
                      Total Sessions
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {data.length}
                    </p>
                  </div>
                  <Hash className="w-5 h-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">
                      Completed
                    </p>
                    <p className="text-lg font-semibold text-emerald-600">
                      {
                        data.filter(
                          (item) => item.status.toLowerCase() === "completed"
                        ).length
                      }
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
                    <p className="text-xs font-medium text-slate-600">
                      In Progress
                    </p>
                    <p className="text-lg font-semibold text-amber-600">
                      {
                        data.filter(
                          (item) => item.status.toLowerCase() === "in progress"
                        ).length
                      }
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
                            <p className="text-slate-500 font-medium text-sm">
                              Loading sessions...
                            </p>
                            <p className="text-slate-400 text-xs">
                              Please wait a moment
                            </p>
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
                            <p className="text-slate-600 font-medium mb-1 text-sm">
                              No stock take sessions found
                            </p>
                            <p className="text-slate-400 text-xs">
                              Create your first session to get started
                            </p>
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
                              {String(index + 1).padStart(2, "0")}
                            </span>
                          </TableCell>
                          <TableCell
                            className="py-3 cursor-pointer"
                            onClick={() =>
                              router.push(`/stock-take/progress/${stk.code}`)
                            }
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
                            onClick={() =>
                              router.push(`/stock-take/progress/${stk.code}`)
                            }
                          >
                            {renderStatus(stk.status)}
                          </TableCell>
                          <TableCell
                            className="py-3 cursor-pointer"
                            onClick={() =>
                              router.push(`/stock-take/progress/${stk.code}`)
                            }
                          >
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span className="font-medium text-xs">
                                {format(
                                  new Date(stk.CreatedAt),
                                  "MMM dd, yyyy"
                                )}
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
                                  router.push(
                                    `/stock-take/progress/${stk.code}`
                                  );
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
                                  console.log("Delete", stk.code);
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
                Showing {data.length} stock take session
                {data.length !== 1 ? "s" : ""} • Click any row to view detailed
                progress
              </p>
            </div>
          )}
        </div>
      </div>

      <StockTakeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerate={generateStockTake}
      />
    </Layout>
  );
}
