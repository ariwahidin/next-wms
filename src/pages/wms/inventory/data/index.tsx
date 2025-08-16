// /* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable @typescript-eslint/no-unused-vars */
// import useAuth from "@/hooks/useAuth";
// import Layout from "@/components/layout";
// import { AgGridReact } from "ag-grid-react";
// import { AllCommunityModule, ModuleRegistry, ColDef } from "ag-grid-community";
// import useSWR, { mutate } from "swr";
// import { ChangeEvent, useCallback, useEffect, useState } from "react";
// import styles from "./InventoryTable.module.css";
// import { useAlert } from "@/contexts/AlertContext";
// import { Button } from "@/components/ui/button";
// import api from "@/lib/api";

// ModuleRegistry.registerModules([AllCommunityModule]);

// const fetcher = (url: string) =>
//   api.get(url, { withCredentials: true }).then((res) => {
//     if (res.data.success && res.data.data.inventories) {
//       return res.data.data.inventories.map((item: any, key: number) => ({
//         ...item,
//         no: key + 1,
//         edit: true,
//       }));
//     }
//     return [];
//   });

// const handleDownload = async () => {
//   const response = await api.get("/inventory/excel", {
//     responseType: "blob",
//     withCredentials: true,
//   });
//   const blob = await response.data;

//   // Buat URL untuk download
//   const url = window.URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = "report.xlsx";
//   document.body.appendChild(a);
//   a.click();
//   document.body.removeChild(a);
// };

// const InventoryTable = ({ setEditData }) => {
//   const { data: rowData, error, mutate } = useSWR("/inventory", fetcher);
//   const { showAlert, notify } = useAlert();
//   const [columnDefs, setColumnDefs] = useState<ColDef[]>([
//     { field: "no", headerName: "No. ", maxWidth: 70 },
//     { field: "item_code", headerName: "Item Code", width: 120 },
//     { field: "item_name", headerName: "Item Name", width: 170 },
//     { field: "location", headerName: "Location", width: 170 },
//     { field: "qa_status", headerName: "QA", width: 170 },
//     { field: "whs_code", headerName: "Whs Code", width: 170 },
//     { field: "qty_onhand", headerName: "On Hand", width: 140 },
//     { field: "qty_available", headerName: "Qty Avaliable", width: 140 },
//     { field: "qty_allocated", headerName: "Qty Allocated", width: 140 },
//   ]);

//   const [quickFilterText, setQuickFilterText] = useState<string>();
//   const onFilterTextBoxChanged = useCallback(
//     ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
//       setQuickFilterText(value),
//     []
//   );

//   return (
//     <div style={{ width: "100%", height: "510px" }}>
//       <div className="flex justify-between items-center">
//         <div className="justify-self-start">
//           <div className={styles.inputWrapper} style={{ marginBottom: "1rem" }}>
//             <svg
//               className={styles.searchIcon}
//               width="16"
//               height="16"
//               viewBox="0 0 16 16"
//               fill="none"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path
//                 fillRule="evenodd"
//                 clipRule="evenodd"
//                 d="M11.5014 7.00039C11.5014 7.59133 11.385 8.1765 11.1588 8.72246C10.9327 9.26843 10.6012 9.7645 10.1833 10.1824C9.76548 10.6002 9.2694 10.9317 8.72344 11.1578C8.17747 11.384 7.59231 11.5004 7.00136 11.5004C6.41041 11.5004 5.82525 11.384 5.27929 11.1578C4.73332 10.9317 4.23725 10.6002 3.81938 10.1824C3.40152 9.7645 3.07005 9.26843 2.8439 8.72246C2.61776 8.1765 2.50136 7.59133 2.50136 7.00039C2.50136 5.80691 2.97547 4.66232 3.81938 3.81841C4.6633 2.97449 5.80789 2.50039 7.00136 2.50039C8.19484 2.50039 9.33943 2.97449 10.1833 3.81841C11.0273 4.66232 11.5014 5.80691 11.5014 7.00039ZM10.6814 11.7404C9.47574 12.6764 7.95873 13.1177 6.43916 12.9745C4.91959 12.8314 3.51171 12.1145 2.50211 10.9698C1.49252 9.8251 0.957113 8.33868 1.0049 6.81314C1.05268 5.28759 1.68006 3.83759 2.75932 2.75834C3.83857 1.67908 5.28856 1.0517 6.81411 1.00392C8.33966 0.956136 9.82608 1.49154 10.9708 2.50114C12.1154 3.51073 12.8323 4.91862 12.9755 6.43819C13.1187 7.95775 12.6773 9.47476 11.7414 10.6804L14.5314 13.4704C14.605 13.539 14.6642 13.6218 14.7051 13.7138C14.7461 13.8058 14.7682 13.9052 14.77 14.0059C14.7717 14.1066 14.7532 14.2066 14.7155 14.3C14.6778 14.3934 14.6216 14.4782 14.5504 14.5494C14.4792 14.6206 14.3943 14.6768 14.301 14.7145C14.2076 14.7522 14.1075 14.7708 14.0068 14.769C13.9061 14.7672 13.8068 14.7452 13.7148 14.7042C13.6228 14.6632 13.54 14.6041 13.4714 14.5304L10.6814 11.7404Z"
//                 fill="currentColor"
//               />
//             </svg>

//             <input
//               type="text"
//               id="filter-text-box"
//               placeholder="Search ..."
//               onInput={onFilterTextBoxChanged}
//             />
//           </div>
//         </div>
//         <div className="justify-self-end">
//           <Button onClick={handleDownload}>Excel</Button>
//         </div>
//       </div>
//       <AgGridReact
//         rowData={rowData}
//         columnDefs={columnDefs}
//         quickFilterText={quickFilterText}
//         pagination={true} // Mengaktifkan pagination
//         paginationPageSize={10} // Set jumlah data per halaman
//         paginationPageSizeSelector={[10, 25, 50]} // Opsional: Dropdown pilihan page size
//         domLayout="autoHeight"
//       />
//     </div>
//   );
// };

// const InventorySummaryTable = () => {
//   const [rowData, setRowData] = useState<any[]>([]);

//   const [quickFilterText, setQuickFilterText] = useState<string>();
//   const onFilterTextBoxChanged = useCallback(
//     ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
//       setQuickFilterText(value),
//     []
//   );

//   // Ambil data inventaris dan agregasi berdasarkan item_code
//   useEffect(() => {
//     const fetchData = async () => {
//       const response = await api.get("/inventory", { withCredentials: true });
//       if (response.data.success && response.data.data.inventories) {
//         const inventories = response.data.data.inventories;

//         // Agregasi data berdasarkan item_code
//         const aggregatedData = inventories.reduce((acc: any, item: any) => {
//           const existingItem = acc.find(
//             (i: any) => i.item_code === item.item_code
//           );
//           if (existingItem) {
//             existingItem.qty_onhand += item.qty_onhand; // Menambahkan qty
//           } else {
//             acc.push({
//               ...item,
//               qty_onhand: item.qty_onhand, // Inisialisasi qty
//             });
//           }
//           return acc;
//         }, []);

//         setRowData(aggregatedData);
//       }
//     };

//     fetchData();
//   }, []);

//   // Kolom untuk tabel rekap
//   const columnDefs: ColDef[] = [
//     {
//       headerName: "No.",
//       maxWidth: 70,
//       valueGetter: (params) => params.node.rowIndex + 1, // Menampilkan nomor urut
//     },
//     { field: "item_code", headerName: "Item Code", width: 120 },
//     { field: "item_name", headerName: "Item Name", width: 170 },
//     { field: "qty_onhand", headerName: "Qty On Hand", width: 170 },
//   ];

//   return (
//     <div style={{ width: "100%", height: "510px" }}>
//       <div className="flex justify-between items-center">
//         <div className="justify-self-start">
//           <div className={styles.inputWrapper} style={{ marginBottom: "1rem" }}>
//             <svg
//               className={styles.searchIcon}
//               width="16"
//               height="16"
//               viewBox="0 0 16 16"
//               fill="none"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path
//                 fillRule="evenodd"
//                 clipRule="evenodd"
//                 d="M11.5014 7.00039C11.5014 7.59133 11.385 8.1765 11.1588 8.72246C10.9327 9.26843 10.6012 9.7645 10.1833 10.1824C9.76548 10.6002 9.2694 10.9317 8.72344 11.1578C8.17747 11.384 7.59231 11.5004 7.00136 11.5004C6.41041 11.5004 5.82525 11.384 5.27929 11.1578C4.73332 10.9317 4.23725 10.6002 3.81938 10.1824C3.40152 9.7645 3.07005 9.26843 2.8439 8.72246C2.61776 8.1765 2.50136 7.59133 2.50136 7.00039C2.50136 5.80691 2.97547 4.66232 3.81938 3.81841C4.6633 2.97449 5.80789 2.50039 7.00136 2.50039C8.19484 2.50039 9.33943 2.97449 10.1833 3.81841C11.0273 4.66232 11.5014 5.80691 11.5014 7.00039ZM10.6814 11.7404C9.47574 12.6764 7.95873 13.1177 6.43916 12.9745C4.91959 12.8314 3.51171 12.1145 2.50211 10.9698C1.49252 9.8251 0.957113 8.33868 1.0049 6.81314C1.05268 5.28759 1.68006 3.83759 2.75932 2.75834C3.83857 1.67908 5.28856 1.0517 6.81411 1.00392C8.33966 0.956136 9.82608 1.49154 10.9708 2.50114C12.1154 3.51073 12.8323 4.91862 12.9755 6.43819C13.1187 7.95775 12.6773 9.47476 11.7414 10.6804L14.5314 13.4704C14.605 13.539 14.6642 13.6218 14.7051 13.7138C14.7461 13.8058 14.7682 13.9052 14.77 14.0059C14.7717 14.1066 14.7532 14.2066 14.7155 14.3C14.6778 14.3934 14.6216 14.4782 14.5504 14.5494C14.4792 14.6206 14.3943 14.6768 14.301 14.7145C14.2076 14.7522 14.1075 14.7708 14.0068 14.769C13.9061 14.7672 13.8068 14.7452 13.7148 14.7042C13.6228 14.6632 13.54 14.6041 13.4714 14.5304L10.6814 11.7404Z"
//                 fill="currentColor"
//               />
//             </svg>

//             <input
//               type="text"
//               id="filter-text-box"
//               placeholder="Search ..."
//               onInput={onFilterTextBoxChanged}
//             />
//           </div>
//         </div>
//         {/* <div className="justify-self-end">
//           <Button onClick={handleDownload}>Excel</Button>
//         </div> */}
//       </div>
//       <AgGridReact
//         rowData={rowData}
//         columnDefs={columnDefs}
//         quickFilterText={quickFilterText}
//         pagination={true}
//         paginationPageSize={10}
//         paginationPageSizeSelector={[10, 25, 50]}
//         domLayout="autoHeight"
//       />
//     </div>
//   );
// };

// export default function Page() {
//   const [editData, setEditData] = useState(null);
//   const [activeTab, setActiveTab] = useState<"location" | "item">("location");

//   return (
//     <Layout title="Inventory" subTitle="Inventory Data">
//       <div className="flex border-b mb-4">
//         <button
//           className={`px-4 py-2 ${
//             activeTab === "location"
//               ? "border-b-2 border-blue-500 font-bold"
//               : ""
//           }`}
//           onClick={() => setActiveTab("location")}
//         >
//           By Location
//         </button>
//         <button
//           className={`px-4 py-2 ${
//             activeTab === "item" ? "border-b-2 border-blue-500 font-bold" : ""
//           }`}
//           onClick={() => setActiveTab("item")}
//         >
//           By Item
//         </button>
//       </div>

//       <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-1">
//         {activeTab === "location" ? (
//           <InventoryTable setEditData={setEditData} />
//         ) : (
//           <InventorySummaryTable />
//         )}
//       </div>
//     </Layout>
//   );
// }

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
