

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import useAuth from "@/hooks/useAuth";
import Layout from "@/components/layout";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, ColDef } from "ag-grid-community";
import useSWR, { mutate } from "swr";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { useAlert } from "@/contexts/AlertContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import {
  Search,
  Download,
  Package,
  MapPin,
  BarChart3,
  FileSpreadsheet,
  Loader2,
  Filter,
  Grid3X3,
  List,
} from "lucide-react";
import { text } from "stream/consumers";
import { te } from "date-fns/locale";

ModuleRegistry.registerModules([AllCommunityModule]);

const fetcher = (url: string) =>
  api.get(url, { withCredentials: true }).then((res) => {
    if (res.data.success && res.data.data.inventories) {
      return res.data.data.inventories.map((item: any, key: number) => ({
        ...item,
        no: key + 1,
        edit: true,
      }));
    }
    return [];
  });

const handleDownload = async () => {
  try {
    const response = await api.get("/inventory/excel", {
      responseType: "blob",
      withCredentials: true,
    });
    const blob = await response.data;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_report.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download failed:", error);
  }
};

const InventoryTable = ({ setEditData }) => {
  const { data: rowData, error, mutate } = useSWR("/inventory", fetcher);
  const { showAlert, notify } = useAlert();
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([
    {
      field: "no",
      headerName: "No.",
      maxWidth: 70,
      cellStyle: { textAlign: "center", color: "#64748b", fontWeight: "500" },
    },
    {
      field: "item_code",
      headerName: "Item Code",
      width: 140,
      cellStyle: { fontWeight: "600", color: "#1e293b" },
    },
    {
      field: "item_name",
      headerName: "Item Name",
      width: 300,
      cellStyle: { color: "#334155" },
    },
    {
      field: "location",
      headerName: "Location",
      width: 150,
      cellStyle: { color: "#475569" },
    },
    {
      field: "qa_status",
      headerName: "QA Status",
      width: 120,
      cellStyle: { color: "#475569", fontWeight: "500", textAlign: "center" },
    },

    {
      field: "whs_code",
      headerName: "Warehouse",
      width: 120,
      cellStyle: { fontWeight: "500", color: "#475569" },
    },
    {
      field: "qty_onhand",
      headerName: "On Hand",
      width: 110,
      cellStyle: { textAlign: "right", fontWeight: "600", color: "#0f172a" },
    },
    {
      field: "qty_available",
      headerName: "Available",
      width: 110,
      cellStyle: { textAlign: "right", fontWeight: "600", color: "#059669" },
    },
    {
      field: "qty_allocated",
      headerName: "Allocated",
      width: 110,
      cellStyle: { textAlign: "right", fontWeight: "600", color: "#dc2626" },
    },
  ]);

  const [quickFilterText, setQuickFilterText] = useState<string>();
  const onFilterTextBoxChanged = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
      setQuickFilterText(value),
    []
  );

  return (
    <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Inventory by Location
              </h3>
              <p className="text-sm text-slate-600">
                Detailed view of items across all locations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search inventory..."
                onInput={onFilterTextBoxChanged}
                className="pl-10 pr-4 py-2 w-64 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
            <Button
              onClick={handleDownload}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-medium"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        <div
          className="ag-theme-alpine"
          style={{ height: "500px", width: "100%" }}
        >
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            quickFilterText={quickFilterText}
            pagination={true}
            paginationPageSize={15}
            paginationPageSizeSelector={[15, 25, 50, 100]}
            domLayout="normal"
            suppressRowHoverHighlight={false}
            rowHeight={48}
            headerHeight={48}
            animateRows={true}
            suppressCellFocus={true}
          />
        </div>
      </CardContent>
    </Card>
  );
};

const InventorySummaryTable = () => {
  const [rowData, setRowData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [quickFilterText, setQuickFilterText] = useState<string>();
  const onFilterTextBoxChanged = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
      setQuickFilterText(value),
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/inventory", { withCredentials: true });
        if (response.data.success && response.data.data.inventories) {
          const inventories = response.data.data.inventories;

          const aggregatedData = inventories.reduce((acc: any, item: any) => {
            const existingItem = acc.find(
              (i: any) => i.item_code === item.item_code
            );
            if (existingItem) {
              existingItem.qty_onhand += item.qty_onhand;
              existingItem.qty_available += item.qty_available || 0;
              existingItem.qty_allocated += item.qty_allocated || 0;
              existingItem.locations = (existingItem.locations || 1) + 1;
            } else {
              acc.push({
                ...item,
                qty_onhand: item.qty_onhand,
                qty_available: item.qty_available || 0,
                qty_allocated: item.qty_allocated || 0,
                locations: 1,
              });
            }
            return acc;
          }, []);

          setRowData(aggregatedData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const columnDefs: ColDef[] = [
    {
      headerName: "No.",
      maxWidth: 70,
      valueGetter: (params) => params.node!.rowIndex! + 1,
      cellStyle: { textAlign: "center", color: "#64748b", fontWeight: "500" },
    },
    {
      field: "item_code",
      headerName: "Item Code",
      width: 140,
      cellStyle: { fontWeight: "600", color: "#1e293b" },
    },
    {
      field: "item_name",
      headerName: "Item Name",
      width: 250,
      cellStyle: { color: "#334155" },
    },
    {
      field: "locations",
      headerName: "Locations",
      width: 100,
      cellStyle: { textAlign: "center", fontWeight: "500", color: "#475569" },
    },
    {
      field: "qty_onhand",
      headerName: "Total On Hand",
      width: 130,
      cellStyle: { textAlign: "right", fontWeight: "600", color: "#0f172a" },
      valueFormatter: (params) => params.value?.toLocaleString() || "0",
    },
    {
      field: "qty_available",
      headerName: "Total Available",
      width: 130,
      cellStyle: { textAlign: "right", fontWeight: "600", color: "#059669" },
      valueFormatter: (params) => params.value?.toLocaleString() || "0",
    },
    {
      field: "qty_allocated",
      headerName: "Total Allocated",
      width: 130,
      cellStyle: { textAlign: "right", fontWeight: "600", color: "#dc2626" },
      valueFormatter: (params) => params.value?.toLocaleString() || "0",
    },
  ];

  return (
    <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Inventory by Item
              </h3>
              <p className="text-sm text-slate-600">
                Aggregated view of items across all locations
              </p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search items..."
              onInput={onFilterTextBoxChanged}
              className="pl-10 pr-4 py-2 w-64 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center">
              <Loader2 className="animate-spin w-8 h-8 text-slate-400 mb-3" />
              <p className="text-slate-500 font-medium">
                Loading inventory data...
              </p>
            </div>
          </div>
        ) : (
          <div
            className="ag-theme-alpine"
            style={{ height: "500px", width: "100%" }}
          >
            <AgGridReact
              rowData={rowData}
              columnDefs={columnDefs}
              quickFilterText={quickFilterText}
              pagination={true}
              paginationPageSize={15}
              paginationPageSizeSelector={[15, 25, 50, 100]}
              domLayout="normal"
              suppressRowHoverHighlight={false}
              rowHeight={48}
              headerHeight={48}
              animateRows={true}
              suppressCellFocus={true}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function Page() {
  const [editData, setEditData] = useState(null);
  const [activeTab, setActiveTab] = useState<"location" | "item">("location");

  return (
    <Layout title="Inventory" subTitle="Inventory Stock">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
        <div className="p-6">
          {/* Header Section */}
          {/* <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                Inventory Management 📦
              </h1>
              <p className="text-slate-600 text-sm">
                Monitor and manage your warehouse inventory across all locations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-white">
                Real-time Data
              </Badge>
            </div>
          </div> */}

          {/* Tabs Navigation */}
          <div className="mb-6">
            <div className="border-b border-slate-200 bg-white rounded-t-lg">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab("location")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "location"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    By Location
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("item")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "item"
                      ? "border-purple-500 text-purple-600"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    By Item
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 gap-6">
            {activeTab === "location" ? (
              <InventoryTable setEditData={setEditData} />
            ) : (
              <InventorySummaryTable />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
