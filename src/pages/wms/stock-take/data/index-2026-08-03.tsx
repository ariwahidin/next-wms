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
  Box,
  AlertTriangle,
  XCircle,
  MoreVertical,
  LockIcon,
} from "lucide-react";
import { createPortal } from "react-dom";


// type StockTake = {
//   ID: number;
//   code: string;
//   status: string;
//   created_at: string;
// };

type StockTake = {
  ID: number;
  code: string;
  status: string;
  created_at: string;
  updated_at: string;
  total_system_qty: number;
  total_counted_qty: number;
};

// start modal component
const StockTakeModal = ({ isOpen, onClose, onGenerate }) => {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [owners, setOwners] = useState([]);
  const [filters, setFilters] = useState({
    ownerCode: "",
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
      fetchOwners();
    }
  }, [isOpen]);

  const fetchOwners = async () => {
    try {
      const res = await api.get("/owners");
      if (res.data.success) {
        setOwners(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch owners:", err);
    }
  };

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
      ownerCode: "",
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
                  Generate Cycle Count
                </h3>
                <p className="text-sm text-gray-500">
                  Set location filters for cycle count generation
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

              {/* Customer/Owner Selection - WAJIB */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="inline h-4 w-4 mr-1" />
                  Customer <span className="text-red-500">*</span>
                </label>
                <select
                  value={filters.ownerCode}
                  onChange={(e) => handleFilterChange("ownerCode", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                >
                  <option value="">Select Customer</option>
                  {owners.map((owner) => (
                    <option key={owner.code} value={owner.code}>
                      {owner.name}
                    </option>
                  ))}
                </select>
                {!filters.ownerCode && (
                  <p className="text-xs text-red-500 mt-1">
                    Please select a customer to continue
                  </p>
                )}
              </div>

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
                  {filters.ownerCode && (
                    <div className="font-medium text-slate-900">
                      Customer: {owners.find((o) => o.Code === filters.ownerCode)?.Name || filters.ownerCode}
                    </div>
                  )}
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
                disabled={loading || !filters.ownerCode}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Generate
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


// Confirm Modal component
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, description, confirmLabel, variant = "danger", loading }) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: "text-red-600 bg-red-50",
      button: "bg-red-600 hover:bg-red-700 disabled:bg-red-300",
    },
    warning: {
      icon: "text-amber-600 bg-amber-50",
      button: "bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300",
    },
    default: {
      icon: "text-slate-600 bg-slate-50",
      button: "bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400",
    },
  };
  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all sm:w-full sm:max-w-sm">
          <div className="px-6 py-5">
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.icon}`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed ${style.button}`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : null}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// End confirm modal

export default function StockTakePage() {
  const [data, setData] = useState<StockTake[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState<{ id: number; code: string; top: number; left: number } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "cancel" | "close" | "delete";
    code: string;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleNewStockTake = () => {
    setIsModalOpen(true);
  };

  const generateStockTake = async (filters) => {
    setLoading(true);
    try {
      const res = await api.post("/stock-take/generate", { filters }, { withCredentials: true });
      if (res.data.success) {
        fetchStockTakes();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate cycle count");
    } finally {
      setLoading(false);
    }
  };

  // const handleDelete = async (code) => {
  //   if (!confirm(`Delete cycle count session ${code}? This cannot be undone.`)) return;
  //   try {
  //     const res = await api.delete(`/stock-take/${code}`, { withCredentials: true });
  //     if (res.data.success) {
  //       fetchStockTakes();
  //     }
  //   } catch (err) {
  //     alert(err.response?.data?.message || "Failed to delete cycle count");
  //   }
  // };

  const handleCancelSession = async (code: string) => {
    setConfirmLoading(true);
    try {
      const res = await api.post(`/stock-take/${code}/cancel`, {}, { withCredentials: true });
      if (res.data.success) {
        fetchStockTakes();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to cancel session");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCloseSession = async (code: string) => {
    setConfirmLoading(true);
    try {
      const res = await api.post(`/stock-take/${code}/close`, {}, { withCredentials: true });
      if (res.data.success) {
        fetchStockTakes();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to close session");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleDelete = async (code: string) => {
    setConfirmLoading(true);
    try {
      const res = await api.delete(`/stock-take/${code}`, { withCredentials: true });
      if (res.data.success) {
        fetchStockTakes();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete cycle count");
    } finally {
      setConfirmLoading(false);
    }
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;
    const { type, code } = confirmAction;
    if (type === "cancel") await handleCancelSession(code);
    else if (type === "close") await handleCloseSession(code);
    else if (type === "delete") await handleDelete(code);
    setConfirmAction(null);
  };

  const confirmModalConfig = () => {
    if (!confirmAction) return null;
    const { type, code } = confirmAction;
    if (type === "cancel") {
      return {
        title: "Cancel Cycle Count Session",
        description: `Are you sure you want to cancel session ${code}? Progress will be marked as cancelled.`,
        confirmLabel: "Cancel Session",
        variant: "warning" as const,
      };
    }
    if (type === "close") {
      return {
        title: "Close Cycle Count Session",
        description: `Are you sure you want to close session ${code}? No further scanning will be allowed after this.`,
        confirmLabel: "Close Session",
        variant: "default" as const,
      };
    }
    return {
      title: "Delete Cycle Count Session",
      description: `Delete session ${code}? This cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger" as const,
    };
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        !(e.target as HTMLElement).closest(".action-menu-wrapper") &&
        !(e.target as HTMLElement).closest(".action-menu-portal")
      ) {
        setOpenActionMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    const handleScroll = () => setOpenActionMenu(null);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  const renderStatus = (status: string) => {
    const s = status.toLowerCase();
    if (s === "closed" || s === "completed") {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-medium px-2 py-0.5 text-xs">
          Closed
        </Badge>
      );
    }
    if (s === "in_progress") {
      return (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 font-medium px-2 py-0.5 text-xs">
          In Progress
        </Badge>
      );
    }
    if (s === "cancelled" || s === "canceled") {
      return (
        <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 font-medium px-2 py-0.5 text-xs">
          Cancelled
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 font-medium px-2 py-0.5 text-xs">
        {status}
      </Badge>
    );
  };

  const getProgressPercent = (counted: number, system: number) => {
    if (!system || system === 0) return 0;
    const pct = (counted / system) * 100;
    return Math.min(Math.round(pct * 10) / 10, 100); // cap di 100%, 1 desimal
  };

  const getVariance = (counted: number, system: number) => {
    return counted - system;
  };

  return (
    <Layout title="Cycle Count" subTitle="Cycle Count Activity" className="w-full">
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
                    Cycle Count Sessions
                  </h1>
                </div>
                <p className="text-slate-600 text-xs">
                  Monitor and track your inventory cycle count sessions
                </p>
              </div>
              <button
                onClick={handleNewStockTake}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Cycle Count
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                    <p className="text-xs font-medium text-slate-600">In Progress</p>
                    <p className="text-lg font-semibold text-amber-600">
                      {data.filter((item) => item.status.toLowerCase() === "in_progress").length}
                    </p>
                  </div>
                  <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">Completed</p>
                    <p className="text-lg font-semibold text-emerald-600">
                      {data.filter((item) => item.status.toLowerCase() === "closed").length}
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
                    <p className="text-xs font-medium text-slate-600">Total Qty Counted</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {data
                        .reduce((sum, item) => sum + (item.total_counted_qty || 0), 0)
                        .toLocaleString("id-ID")}
                    </p>
                  </div>
                  <Package className="w-5 h-5 text-slate-400" />
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
                        Progress
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 text-right">
                        Qty (Counted / System)
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
                              No cycle count sessions found
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

                          {/* Progress */}
                          <TableCell
                            className="py-3 cursor-pointer"
                            onClick={() => router.push(`/stock-take/progress/${stk.code}`)}
                          >
                            {(() => {
                              const pct = getProgressPercent(stk.total_counted_qty, stk.total_system_qty);
                              const barColor =
                                pct >= 100
                                  ? "bg-emerald-500"
                                  : pct >= 50
                                    ? "bg-amber-500"
                                    : "bg-slate-400";
                              return (
                                <div className="flex items-center gap-2 min-w-[110px]">
                                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${barColor} transition-all`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium text-slate-600 w-10 text-right">
                                    {pct}%
                                  </span>
                                </div>
                              );
                            })()}
                          </TableCell>

                          {/* Qty */}
                          <TableCell
                            className="py-3 text-right cursor-pointer"
                            onClick={() => router.push(`/stock-take/progress/${stk.code}`)}
                          >
                            {(() => {
                              const variance = getVariance(stk.total_counted_qty, stk.total_system_qty);
                              return (
                                <div className="flex flex-col items-end">
                                  <span className="text-sm font-semibold text-slate-900">
                                    {stk.total_counted_qty?.toLocaleString("id-ID")}
                                    <span className="text-slate-400 font-normal">
                                      {" "}/ {stk.total_system_qty?.toLocaleString("id-ID")}
                                    </span>
                                  </span>
                                  {variance !== 0 && (
                                    <span
                                      className={`text-xs font-medium ${variance < 0 ? "text-red-500" : "text-blue-500"
                                        }`}
                                    >
                                      {variance > 0 ? "+" : ""}
                                      {variance.toLocaleString("id-ID")}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
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
                                  new Date(stk.created_at),
                                  "MMM dd, yyyy"
                                )}
                              </span>
                              <span className="text-slate-400 text-xs">
                                {format(new Date(stk.created_at), "HH:mm")}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="py-3">
                            <div className="flex items-center justify-center action-menu-wrapper">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  if (openActionMenu?.id === stk.ID) {
                                    setOpenActionMenu(null);
                                  } else {
                                    const menuWidth = 192; // w-48
                                    const menuHeight = 220; // estimasi tinggi menu
                                    const spaceBelow = window.innerHeight - rect.bottom;
                                    const openUpward = spaceBelow < menuHeight;

                                    let left = rect.right - menuWidth;
                                    if (left < 8) left = 8;
                                    if (left + menuWidth > window.innerWidth - 8) {
                                      left = window.innerWidth - menuWidth - 8;
                                    }

                                    const top = openUpward
                                      ? rect.top - menuHeight - 4
                                      : rect.bottom + 4;

                                    setOpenActionMenu({ id: stk.ID, code: stk.code, top, left });
                                  }
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                                title="Actions"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </TableCell>

                          {/* <TableCell className="py-3">
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
                                <Box className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(stk.code);
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </TableCell> */}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {openActionMenu &&
            typeof window !== "undefined" &&
            createPortal(
              <div
                className="action-menu-portal fixed z-[100] w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1"
                style={{ top: openActionMenu.top, left: openActionMenu.left }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const code = openActionMenu.code;
                    setOpenActionMenu(null);
                    router.push(`/stock-take/progress/${code}`);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ChartBar className="w-3.5 h-3.5 text-blue-600" />
                  View Progress
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const code = openActionMenu.code;
                    setOpenActionMenu(null);
                    router.push(`/stock-take/${code}`);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Box className="w-3.5 h-3.5 text-amber-600" />
                  View Detail / Print
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const code = openActionMenu.code;
                    setOpenActionMenu(null);
                    setConfirmAction({ type: "cancel", code });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5 text-orange-600" />
                  Cancel Session
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const code = openActionMenu.code;
                    setOpenActionMenu(null);
                    setConfirmAction({ type: "close", code });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <LockIcon className="w-3.5 h-3.5 text-slate-600" />
                  Close Session
                </button>

                {/* <div className="my-1 border-t border-slate-100" /> */}

                {/* <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const code = openActionMenu.code;
                    setOpenActionMenu(null);
                    setConfirmAction({ type: "delete", code });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button> */}
              </div>,
              document.body
            )}

          {/* Footer */}
          {data.length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500">
                Showing {data.length} cycle count session
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

      {confirmAction && (
        <ConfirmModal
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={executeConfirmAction}
          loading={confirmLoading}
          {...confirmModalConfig()}
        />
      )}
    </Layout>
  );
}
