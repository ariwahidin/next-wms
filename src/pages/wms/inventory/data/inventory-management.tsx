/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  Printer,
  CheckSquare,
  Square,
  Filter,
  Download,
  Loader2,
  ArrowDown01,
  ArrowDown,
  Truck,
} from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  GridReadyEvent,
  SelectionChangedEvent,
} from "ag-grid-community";
// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-alpine.css";
import api from "@/lib/api";
import StockCardPage from "./StockCardPage";
import ReactDOM from "react-dom/client";
import Layout from "@/components/layout";
// All Community Features
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

type InventoryItem = {
  id?: number;
  barcode: string;
  item_code: string;
  item_name: string;
  location: string;
  category: string;
  rec_date: string;
  owner_code: string;
  whs_code: string;
  qa_status: string;
  qty_in?: number;
  qty_onhand?: number;
  qty_available?: number;
  qty_allocated?: number;
  qty_out?: number;
  cbm_pcs?: number;
  cbm_total?: number;
};

const InventoryPage = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const [stocks, setStocks] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter/sort related states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [whsCodeFilter, setWhsCodeFilter] = useState("all");

  // Status Badge Component
  const StatusBadge = ({ value }: { value: string }) => {
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "a":
        case "active":
          return "text-green-600 bg-green-50 border-green-200";
        case "low":
          return "text-yellow-600 bg-yellow-50 border-yellow-200";
        case "out":
          return "text-red-600 bg-red-50 border-red-200";
        default:
          return "text-gray-600 bg-gray-50 border-gray-200";
      }
    };

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
          value
        )}`}
      >
        {value.toUpperCase()}
      </span>
    );
  };

  // Category Badge Component
  const CategoryBadge = ({ value }: { value: string }) => (
    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 border border-slate-200">
      {value}
    </span>
  );

  // AG Grid Column Definitions
  const columnDefs: ColDef[] = [
    {
      headerName: "",
      field: "selected",
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 50,
      pinned: "left",
      resizable: false,
      sortable: false,
      filter: false,
      // suppressMenu: true,
    },
    {
      headerName: "GMC CODE",
      field: "barcode",
      width: 140,
      pinned: "left",
      cellClass: "font-medium text-slate-900",
    },
    {
      headerName: "ITEM CODE",
      field: "item_code",
      width: 130,
      cellClass: "font-mono text-slate-700 bg-slate-50",
    },
    {
      headerName: "ITEM NAME",
      field: "item_name",
      width: 200,
      tooltipField: "item_name",
    },
    {
      headerName: "WH CODE",
      field: "whs_code",
      width: 130,
    },
    {
      headerName: "LOCATION",
      field: "location",
      width: 130,
    },
    {
      headerName: "REC DATE",
      field: "rec_date",
      width: 120,
    },
    {
      headerName: "ON HAND",
      field: "qty_onhand",
      width: 130,
      type: "numericColumn",
      cellClass: "text-right font-medium",
    },
    {
      headerName: "AVAILABLE",
      field: "qty_available",
      width: 130,
      type: "numericColumn",
      cellClass: "text-right font-medium text-green-600",
    },
    {
      headerName: "ALLOCATED",
      field: "qty_allocated",
      width: 130,
      type: "numericColumn",
      cellClass: "text-right font-medium text-red-600",
    },
    {
      headerName: "CBM/PCS",
      field: "cbm_pcs",
      width: 130,
      type: "numericColumn",
      cellClass: "text-right font-medium text-red-600",
    },
    {
      headerName: "CBM TOTAL",
      field: "cbm_total",
      width: 130,
      type: "numericColumn",
      cellClass: "text-right font-medium text-red-600",
    },
  ];

  // Fetch from API
  const fetchStockData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/inventory");
      const inventories = response.data.data.inventories?.map(
        (item: InventoryItem, index: number) => ({
          ...item,
          id: index,
        })
      );
      setStocks(inventories);
    } catch (error) {
      console.error("Error fetching stock data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  // Filtered data
  const filteredStock = useMemo(() => {
    const filtered = stocks?.filter((item) => {
      const matchesSearch =
        search === "" ||
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(search.toLowerCase())
        );

      const matchesStatus =
        statusFilter === "all" || item.qa_status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;
      const matchesWhsCode =
        whsCodeFilter === "all" || item.whs_code === whsCodeFilter;

      return (
        matchesSearch && matchesStatus && matchesCategory && matchesWhsCode
      );
    });

    // Calculate totals

    const totalQtyIn = filtered?.reduce(
      (sum, item) => sum + (item.qty_in || 0),
      0
    );

    const totalQtyOut = filtered?.reduce(
      (sum, item) => sum + (item.qty_out || 0),
      0
    );

    const totalQtyOnHand = filtered?.reduce(
      (sum, item) => sum + (item.qty_onhand || 0),
      0
    );
    const totalQtyAvailable = filtered?.reduce(
      (sum, item) => sum + (item.qty_available || 0),
      0
    );
    const totalQtyAllocated = filtered?.reduce(
      (sum, item) => sum + (item.qty_allocated || 0),
      0
    );

    return {
      data: filtered || [],
      totalQtyIn,
      totalQtyOut,
      totalQtyOnHand,
      totalQtyAvailable,
      totalQtyAllocated,
    };
  }, [stocks, search, statusFilter, categoryFilter, whsCodeFilter]);

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    const selectedRows = event.api.getSelectedRows();
    const selectedRowIds = selectedRows.map((row) => row.id);
    setSelectedIds(selectedRowIds);
  }, []);

  // Export and Print handlers
  const exportCSV = () => {
    const selectedCards = stocks.filter((item) =>
      selectedIds.includes(item.id)
    );
    if (selectedCards.length === 0) {
      alert("Please select at least one item to export");
      return;
    }

    const headers = [
      "GMC CODE",
      "ITEM CODE",
      // "Item Name",
      "WH CODE",
      "LOCATION",
      "REC DATE",
      "ON HAND",
      "AVAILABLE",
      "ALLOCATED",
      "CBM/PCS",
      "CBM TOTAL",
    ];
    const csvContent = [
      headers.join(","),
      ...selectedCards.map((item) =>
        [
          item.barcode,
          item.item_code,
          item.whs_code,
          item.location,
          item.rec_date,
          item.qty_onhand || 0,
          item.qty_available || 0,
          item.qty_allocated || 0,
          item.cbm_pcs || 0,
          item.cbm_total || 0,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const selectedCards: InventoryItem[] = stocks
      .filter((item) => selectedIds.includes(item.id))
      .map((item, index) => ({
        ...item,
        page: index + 1,
        desc: item.item_name,
      }));

    if (selectedCards.length === 0) {
      alert("Please select at least one item to print");
      return;
    }

    const printWindow = window.open("", "_blank", "width=800,height=1000");
    if (!printWindow) return;

    printWindow.document.write(`
    <html>
      <head>
        <title>Stock Card Print</title>
      </head>
      <body>
        <div id="print-root"></div>
      </body>
    </html>
  `);
    printWindow.document.close();

    const interval = setInterval(() => {
      const container = printWindow.document.getElementById("print-root");
      if (container) {
        clearInterval(interval);
        const root = ReactDOM.createRoot(container);
        root.render(<StockCardPage data={selectedCards} />);

        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }, 100);
  };

  const categories = Array.from(new Set(stocks?.map((item) => item.category)));

  if (loading) {
    return (
      <Layout title="Inventory" subTitle="Stock">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              Loading Inventory Data
            </h3>
            <p className="text-slate-500">
              Please wait while we fetch your data...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Inventory" subTitle="Inventory Stock">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header with Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="all">All Status</option>
                  <option value="A">A</option>
                </select> */}

                <select
                  value={whsCodeFilter}
                  onChange={(e) => setWhsCodeFilter(e.target.value)}
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="all">All WHS Codes</option>
                  {Array.from(
                    new Set(stocks?.map((item) => item.whs_code))
                  ).map((whsCode) => (
                    <option key={whsCode} value={whsCode}>
                      {whsCode}
                    </option>
                  ))}
                </select>

                {/* <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select> */}

                <button
                  onClick={() => {
                    setSearch("");
                    setWhsCodeFilter("all");
                    setStatusFilter("all");
                    setCategoryFilter("all");
                  }}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

              {/* <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">
                      Total Items
                    </p>
                    <p className="text-3xl font-bold text-slate-800 mt-2">
                      {filteredStock.data.length.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Filter className="text-blue-600" size={24} />
                  </div>
                </div>
              </div> */}

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">In</p>
                    <p className="text-2xl font-bold text-slate-800 mt-2">
                      {filteredStock.totalQtyIn.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-100 rounded-lg">
                    <ArrowDown className="text-slate-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">
                      On Hand
                    </p>
                    <p className="text-2xl font-bold text-slate-800 mt-2">
                      {filteredStock.totalQtyOnHand.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-100 rounded-lg">
                    <CheckSquare className="text-slate-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">
                      Available
                    </p>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      {filteredStock.totalQtyAvailable.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckSquare className="text-green-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">
                      Allocated
                    </p>
                    <p className="text-2xl font-bold text-red-600 mt-2">
                      {filteredStock.totalQtyAllocated.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <CheckSquare className="text-red-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Out</p>
                    <p className="text-2xl font-bold text-slate-800 mt-2">
                      {filteredStock.totalQtyOut.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-100 rounded-lg">
                    <Truck className="text-slate-600" size={24} />
                  </div>
                </div>
              </div>

            </div>

            {/* Actions Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* <button
                    onClick={() => {
                      if (selectedIds.length === filteredStock.data.length) {
                        setSelectedIds([]);
                      } else {
                        setSelectedIds(
                          filteredStock.data.map((item) => item.id)
                        );
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  >
                    {selectedIds.length === filteredStock.data.length &&
                    selectedIds.length > 0 ? (
                      <CheckSquare size={18} />
                    ) : (
                      <Square size={18} />
                    )}
                    {selectedIds.length === filteredStock.data.length &&
                    selectedIds.length > 0
                      ? "Deselect All"
                      : "Select All"}
                  </button> */}

                  <span className="text-slate-600 font-medium">
                    {selectedIds.length} of {filteredStock.data.length} selected
                  </span>
                </div>

                <div className="flex gap-3">
                  {/* <button
                    onClick={handlePrint}
                    disabled={selectedIds.length === 0}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    <Printer size={18} />
                    Print Cards
                  </button> */}
                  <button
                    onClick={exportCSV}
                    disabled={selectedIds.length === 0}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    <Download size={18} />
                    Export CSV
                  </button>
                </div>
              </div>
            </div>

            {/* AG Grid Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div
                className="ag-theme-alpine"
                style={{ height: 600, width: "100%" }}
              >
                <AgGridReact
                  columnDefs={columnDefs}
                  rowData={filteredStock.data}
                  onSelectionChanged={onSelectionChanged}
                  rowSelection="multiple"
                  // suppressRowClickSelection={true}
                  defaultColDef={{
                    sortable: true,
                    filter: true,
                    resizable: true,
                    minWidth: 80,
                  }}
                  animateRows={true}
                  pagination={true}
                  paginationPageSize={100}
                  suppressCellFocus={true}
                  headerHeight={48}
                  rowHeight={50}
                  getRowStyle={(params) => {
                    if (selectedIds.includes(params.data.id)) {
                      return {
                        backgroundColor: "#eff6ff",
                        borderLeft: "4px solid #3b82f6",
                      };
                    }
                    return {};
                  }}
                />
              </div>
            </div>

            {/* Empty State */}
            {filteredStock.data.length === 0 && !loading && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <div className="text-slate-400 mb-4">
                  <Search size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-slate-600 mb-2">
                  No items found
                </h3>
                <p className="text-slate-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InventoryPage;
