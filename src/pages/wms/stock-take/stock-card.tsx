/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useMemo, useEffect } from "react";
import { Search, Printer, Check, IdCard } from "lucide-react";
import Layout from "@/components/layout";
import api from "@/lib/api";

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

type ItemStock = {
  id?: number; // Optional ID for mock data
  location: string;
  item_code: string;
  barcode?: string;
  item_name: string;
  quantity: number;
  unit?: string;
  row?: string;
  bay?: string;
  level?: string;
  bin?: string;
  whs_code?: string;
};

const StockTakeModal = ({ isOpen, onClose, onFilter }) => {
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

  const handleFilter = async () => {
    setLoading(true);
    try {
      // Call API dengan filter parameters
      await onFilter(filters);
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
                  Filter Location
                </h3>
                <p className="text-sm text-gray-500">
                  Set location filters for stock card generation
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
                onClick={handleFilter}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Filtering...
                  </>
                ) : (
                  <>
                    <Filter className="h-4 w-4" />
                    Filter
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

// function StockCardPrinter() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedItems, setSelectedItems] = useState(new Set());
//   const [checkAll, setCheckAll] = useState(true);
//   const [itemStocks, setItemStocks] = useState<ItemStock[]>([]);
//   const [loading, setLoading] = useState(true);

//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const [filters, setFilters] = useState({
//     rowFrom: "",
//     rowTo: "",
//     bayFrom: "",
//     bayTo: "",
//     levelFrom: "",
//     levelTo: "",
//     binFrom: "",
//     binTo: "",
//   });

//   const fetchStockData = async () => {
//     try {
//       const response = await api.get("/stock-take/stock-card");
//       console.log("Fetched stock data:", response.data.data);
//       // manipulate id here
//       const inventories = response.data.data.map(
//         (item: ItemStock, index: number) => ({
//           ...item,
//           id: index, // Assign a unique ID based on index
//         })
//       );
//       setItemStocks(inventories);
//     } catch (error) {
//       console.error("Error fetching stock data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     // fetchStockData();
//   }, []);

//   // Filter data berdasarkan kriteria
//   const filteredData = useMemo(() => {
//     return itemStocks.filter((item) => {
//       const rowMatch =
//         (!filters.rowFrom || item.row >= filters.rowFrom) &&
//         (!filters.rowTo || item.row <= filters.rowTo);
//       const bayMatch =
//         (!filters.bayFrom || item.bay >= filters.bayFrom) &&
//         (!filters.bayTo || item.bay <= filters.bayTo);
//       const levelMatch =
//         (!filters.levelFrom || item.level >= filters.levelFrom) &&
//         (!filters.levelTo || item.level <= filters.levelTo);
//       const binMatch =
//         (!filters.binFrom || item.bin >= filters.binFrom) &&
//         (!filters.binTo || item.bin <= filters.binTo);

//       const searchMatch =
//         searchTerm === "" ||
//         item.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         item.item_name.toLowerCase().includes(searchTerm.toLowerCase());

//       return rowMatch && bayMatch && levelMatch && binMatch && searchMatch;
//     });
//   }, [filters, searchTerm, itemStocks]);

//   // Update selected items ketika data berubah atau check all berubah
//   React.useEffect(() => {
//     if (checkAll) {
//       setSelectedItems(new Set(filteredData.map((item) => item.id)));
//     } else {
//       setSelectedItems(new Set());
//     }
//   }, [filteredData, checkAll]);

//   const handleFilterChange = (field, value) => {
//     setFilters((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleItemCheck = (itemId, checked) => {
//     const newSelected = new Set(selectedItems);
//     if (checked) {
//       newSelected.add(itemId);
//     } else {
//       newSelected.delete(itemId);
//       setCheckAll(false);
//     }
//     setSelectedItems(newSelected);
//   };

//   const handleCheckAll = (checked) => {
//     setCheckAll(checked);
//     if (checked) {
//       setSelectedItems(new Set(filteredData.map((item) => item.id)));
//     } else {
//       setSelectedItems(new Set());
//     }
//   };

//   const handlePrint = () => {
//     const selectedStockItems = filteredData.filter((item) =>
//       selectedItems.has(item.id)
//     );
//     if (selectedStockItems.length === 0) {
//       alert("Pilih minimal satu item untuk dicetak");
//       return;
//     }

//     // Transform data untuk StockCardPage
//     const stockCardData = selectedStockItems.map((item, index) => ({
//       page: index + 1,
//       item_code: item.item_code,
//       barcode: item.barcode,
//       item_name: item.item_name,
//       location:
//         item.location || `${item.row}${item.bay}${item.level}${item.bin}`,
//       qa_status: "", // Tambahkan sesuai kebutuhan
//       whs_code: item.whs_code || "",
//     }));

//     // Simpan data ke sessionStorage
//     sessionStorage.setItem("stockCardData", JSON.stringify(stockCardData));

//     // Buka halaman print di tab/window baru
//     window.open("/wms/stock-take/stock-card-print-page", "_blank");
//   };

//   return (
//     <Layout title="Stock Take" subTitle="Stock Card">
//       {/* {loading && (
//         <div className="flex items-center justify-center min-h-screen">
//           <div className="text-gray-500">Loading... {itemStocks.length}</div>
//         </div>
//       )} */}

//       <div className="min-h-screen bg-gray-50 p-6">
//         <div className="max-w-7xl mx-auto">
//           {/* <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
//             <h2 className="text-lg font-medium text-gray-900 mb-4">
//               Filter Location
//             </h2>

//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
//               <div className="space-y-3">
//                 <label className="text-sm font-medium text-gray-700">Row</label>
//                 <div className="flex space-x-2">
//                   <input
//                     type="text"
//                     placeholder="From"
//                     value={filters.rowFrom}
//                     onChange={(e) =>
//                       handleFilterChange("rowFrom", e.target.value)
//                     }
//                     className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   />
//                   <input
//                     type="text"
//                     placeholder="To"
//                     value={filters.rowTo}
//                     onChange={(e) =>
//                       handleFilterChange("rowTo", e.target.value)
//                     }
//                     className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   />
//                 </div>
//               </div>

//               <div className="space-y-3">
//                 <label className="text-sm font-medium text-gray-700">Bay</label>
//                 <div className="flex space-x-2">
//                   <input
//                     type="text"
//                     placeholder="From"
//                     value={filters.bayFrom}
//                     onChange={(e) =>
//                       handleFilterChange("bayFrom", e.target.value)
//                     }
//                     className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   />
//                   <input
//                     type="text"
//                     placeholder="To"
//                     value={filters.bayTo}
//                     onChange={(e) =>
//                       handleFilterChange("bayTo", e.target.value)
//                     }
//                     className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   />
//                 </div>
//               </div>

//               <div className="space-y-3">
//                 <label className="text-sm font-medium text-gray-700">
//                   Level
//                 </label>
//                 <div className="flex space-x-2">
//                   <input
//                     type="text"
//                     placeholder="From"
//                     value={filters.levelFrom}
//                     onChange={(e) =>
//                       handleFilterChange("levelFrom", e.target.value)
//                     }
//                     className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   />
//                   <input
//                     type="text"
//                     placeholder="To"
//                     value={filters.levelTo}
//                     onChange={(e) =>
//                       handleFilterChange("levelTo", e.target.value)
//                     }
//                     className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   />
//                 </div>
//               </div>

//               <div className="space-y-3">
//                 <label className="text-sm font-medium text-gray-700">Bin</label>
//                 <div className="flex space-x-2">
//                   <input
//                     type="text"
//                     placeholder="From"
//                     value={filters.binFrom}
//                     onChange={(e) =>
//                       handleFilterChange("binFrom", e.target.value)
//                     }
//                     className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   />
//                   <input
//                     type="text"
//                     placeholder="To"
//                     value={filters.binTo}
//                     onChange={(e) =>
//                       handleFilterChange("binTo", e.target.value)
//                     }
//                     className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div> */}

//           {itemStocks.length > 0 && (
//             <>
//               <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
//                 <div className="relative">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                   <input
//                     type="text"
//                     placeholder="Search by Item Code or Name"
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   />
//                 </div>
//               </div>

//               <div className="bg-white rounded-lg shadow-sm border">
//                 <div className="p-6 border-b border-gray-200">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center space-x-4">
//                       <h3 className="text-lg font-medium text-gray-900">
//                         Stock Items
//                       </h3>
//                       <span className="text-sm text-gray-500">
//                         ({filteredData.length} items found)
//                       </span>
//                     </div>

//                     <div className="flex items-center space-x-4">
//                       <label className="flex items-center space-x-2 text-sm">
//                         <input
//                           type="checkbox"
//                           checked={checkAll}
//                           onChange={(e) => handleCheckAll(e.target.checked)}
//                           className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//                         />
//                         <span className="text-gray-700">Select All</span>
//                       </label>

//                       <button
//                         onClick={handlePrint}
//                         disabled={selectedItems.size === 0}
//                         className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
//                       >
//                         <Printer className="w-4 h-4" />
//                         <span>Print ({selectedItems.size})</span>
//                       </button>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Table Content */}
//                 <div className="overflow-x-auto">
//                   <table className="w-full">
//                     <thead className="bg-gray-50">
//                       <tr>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           <input
//                             type="checkbox"
//                             checked={checkAll}
//                             onChange={(e) => handleCheckAll(e.target.checked)}
//                             className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//                           />
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Location
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Item Code
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Barcode
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Item Name
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Qty
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Whs Code
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-gray-200">
//                       {filteredData.map((item) => (
//                         <tr key={item.id} className="hover:bg-gray-50">
//                           <td className="px-6 py-4">
//                             <input
//                               type="checkbox"
//                               checked={selectedItems.has(item.id)}
//                               onChange={(e) =>
//                                 handleItemCheck(item.id, e.target.checked)
//                               }
//                               className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//                             />
//                           </td>
//                           <td className="px-6 py-4 text-sm text-gray-900">
//                             {item.location ||
//                               `${item.row}${item.bay}${item.level}${item.bin}`}
//                           </td>
//                           <td className="px-6 py-4 text-sm font-medium text-gray-900">
//                             {item.item_code}
//                           </td>
//                           <td className="px-6 py-4 text-sm font-medium text-gray-900">
//                             {item.barcode}
//                           </td>
//                           <td className="px-6 py-4 text-sm text-gray-900">
//                             {item.item_name}
//                           </td>
//                           <td className="px-6 py-4 text-sm text-gray-900">
//                             {item.quantity.toLocaleString()}
//                           </td>
//                           <td className="px-6 py-4 text-sm text-gray-500">
//                             {item.whs_code}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>

//                   {filteredData.length === 0 && (
//                     <div className="text-center py-12">
//                       <div className="text-gray-400 mb-2">
//                         <Search className="w-12 h-12 mx-auto" />
//                       </div>
//                       <p className="text-gray-500 text-sm">
//                         Tidak ada data yang ditemukan
//                       </p>
//                       <p className="text-gray-400 text-xs mt-1">
//                         Coba ubah kriteria pencarian Anda
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </Layout>
//   );
// }

function StockTableComponent({ itemStocks, setItemStocks }) {
  useEffect(() => {
    console.log("Stock Data:", itemStocks);
  }, [itemStocks]);

  // return (
  //   <div className="flex items-center justify-center min-h-screen">
  //     <div className="text-gray-500">Stock Table Component Placeholder</div>
  //   </div>
  // );

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [checkAll, setCheckAll] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    rowFrom: "",
    rowTo: "",
    bayFrom: "",
    bayTo: "",
    levelFrom: "",
    levelTo: "",
    binFrom: "",
    binTo: "",
  });

  // const fetchStockData = async () => {
  //   try {
  //     const response = await api.get("/stock-take/stock-card");
  //     console.log("Fetched stock data:", response.data.data);
  //     // manipulate id here
  //     const inventories = response.data.data.map(
  //       (item: ItemStock, index: number) => ({
  //         ...item,
  //         id: index, // Assign a unique ID based on index
  //       })
  //     );
  //     setItemStocks(inventories);
  //   } catch (error) {
  //     console.error("Error fetching stock data:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   fetchStockData();
  // }, []);

  // Filter data berdasarkan kriteria
  const filteredData = useMemo(() => {
    return itemStocks.filter((item) => {
      const rowMatch =
        (!filters.rowFrom || item.row >= filters.rowFrom) &&
        (!filters.rowTo || item.row <= filters.rowTo);
      const bayMatch =
        (!filters.bayFrom || item.bay >= filters.bayFrom) &&
        (!filters.bayTo || item.bay <= filters.bayTo);
      const levelMatch =
        (!filters.levelFrom || item.level >= filters.levelFrom) &&
        (!filters.levelTo || item.level <= filters.levelTo);
      const binMatch =
        (!filters.binFrom || item.bin >= filters.binFrom) &&
        (!filters.binTo || item.bin <= filters.binTo);

      const searchMatch =
        searchTerm === "" ||
        item.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase());

      return rowMatch && bayMatch && levelMatch && binMatch && searchMatch;
    });
  }, [filters, searchTerm, itemStocks]);

  // Update selected items ketika data berubah atau check all berubah
  React.useEffect(() => {
    if (checkAll) {
      setSelectedItems(new Set(filteredData.map((item) => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  }, [filteredData, checkAll]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemCheck = (itemId, checked) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
      setCheckAll(false);
    }
    setSelectedItems(newSelected);
  };

  const handleCheckAll = (checked) => {
    setCheckAll(checked);
    if (checked) {
      setSelectedItems(new Set(filteredData.map((item) => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handlePrint = () => {
    const selectedStockItems = filteredData.filter((item) =>
      selectedItems.has(item.id)
    );
    if (selectedStockItems.length === 0) {
      alert("Pilih minimal satu item untuk dicetak");
      return;
    }

    // Transform data untuk StockCardPage
    const stockCardData = selectedStockItems.map((item, index) => ({
      page: index + 1,
      item_code: item.item_code,
      barcode: item.barcode,
      item_name: item.item_name,
      location:
        item.location || `${item.row}${item.bay}${item.level}${item.bin}`,
      qa_status: "", // Tambahkan sesuai kebutuhan
      whs_code: item.whs_code || "",
    }));

    // Simpan data ke sessionStorage
    sessionStorage.setItem("stockCardData", JSON.stringify(stockCardData));

    // Buka halaman print di tab/window baru
    window.open("/wms/stock-take/stock-card-print-page", "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 ps-6 pe-6">
      <div className="max-w-7xl mx-auto">
        {itemStocks.length > 0 && (
          <>
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by Item Code or Name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Stock Items
                    </h3>
                    <span className="text-sm text-gray-500">
                      ({filteredData.length} items found)
                    </span>
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checkAll}
                        onChange={(e) => handleCheckAll(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Select All</span>
                    </label>

                    <button
                      onClick={handlePrint}
                      disabled={selectedItems.size === 0}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print ({selectedItems.size})</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Content */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={checkAll}
                          onChange={(e) => handleCheckAll(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Barcode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Whs Code
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={(e) =>
                              handleItemCheck(item.id, e.target.checked)
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.location ||
                            `${item.row}${item.bay}${item.level}${item.bin}`}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {item.item_code}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {item.barcode}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.item_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.quantity.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {item.whs_code}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredData.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-2">
                      <Search className="w-12 h-12 mx-auto" />
                    </div>
                    <p className="text-gray-500 text-sm">
                      Tidak ada data yang ditemukan
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Coba ubah kriteria pencarian Anda
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function StockCardPage() {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemStocks, setStockItems] = useState<ItemStock[]>([]);
  const openFilterModal = () => {
    setIsModalOpen(true);
  };

  const getStockItem = async (filters) => {
    console.log("Filters received:", filters);
    setLoading(true);
    try {
      const response = await api.post("/stock-take/stock-card", { filters });
      const inventories = response.data.data.map(
        (item: ItemStock, index: number) => ({
          ...item,
          id: index, // Assign a unique ID based on index
        })
      );
      setStockItems(inventories);
    } catch (error) {
      console.error("Error fetching stock data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Stock Take" subTitle="Stock Card">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-slate-900 rounded-md flex items-center justify-center">
                <IdCard className="w-3 h-3 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-slate-900">
                Stock Card
              </h1>
            </div>
            <p className="text-slate-600 text-xs">
              Print stock card for each item in the warehouse
            </p>
          </div>
          <button
            onClick={openFilterModal}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Filter className="w-4 h-4" />
            Filter Location
          </button>
        </div>
      </div>

      <StockTableComponent
        itemStocks={itemStocks}
        setItemStocks={setStockItems}
      />
      <StockTakeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFilter={getStockItem}
      />
    </Layout>
  );
}
