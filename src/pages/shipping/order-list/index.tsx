"use client";

import { useEffect, useState, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
// import { ColDef, GridApi } from "ag-grid-community";
import { useRouter } from "next/navigation"; // Kalau pakai app router Next.js 13+
import Layout from "@/components/layout";
import api from "@/lib/api";
// import { ClientSideRowModelModule } from "ag-grid-community";

import { AllCommunityModule, ModuleRegistry, ColDef } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

export default function OrderListPage() {
  const [rowData, setRowData] = useState<any[]>([]);
  const gridRef = useRef<AgGridReact>(null);
  const [quickFilterText, setQuickFilterText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const columnDefs: ColDef[] = [
    {
      field: "ID",
      headerName: "No",
      width: 60,
      pinned: "left",
      // tampilkan nomor urut saja
      valueGetter: (params) => {
        return params.node.rowIndex + 1;
      },
    },

    { field: "order_no", headerName: "Order ID", flex: 1 },
    // { field: "delivery_number", headerName: "Delivery Number", flex: 1 },
    { field: "qty", headerName: "Quantity", width: 120 },
    { field: "volume", headerName: "Volume", width: 120 },
    {
      headerName: "Action",
      field: "action",
      width: 120,
      cellRenderer: (params: any) => {
        return (
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            onClick={() =>
              router.push(
                `/shipping/order-list/${params.data.order_no}`
              )
            }
          >
            Edit
          </button>
        );
      },
    },
  ];

  const fetchData = async () => {
    try {
      const response = await api.get("/shipping/list-order", {
        withCredentials: true,
      });
      const data = await response.data;
      if (data.success === false) {
        return;
      }
      setRowData(data.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Layout title="Shipping" subTitle="Order List">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Search */}
          <div className="flex justify-end mb-4">
            <input
              type="text"
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              placeholder="Search Orders..."
              className="border p-2 rounded w-64"
            />

            
          </div>

          {/* Grid */}
          <div style={{ height: 400, width: "100%", fontSize: "12px" }}>
            <AgGridReact
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              pagination={true}
              paginationPageSize={10}
              domLayout="autoHeight"
              quickFilterText={quickFilterText}
            />
          </div>
        </div>
      )}
    </Layout>
  );
}
