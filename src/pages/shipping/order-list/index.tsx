/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
// import { ColDef, GridApi } from "ag-grid-community";
import { useRouter } from "next/navigation"; // Kalau pakai app router Next.js 13+
import Layout from "@/components/layout";
import api from "@/lib/api";
// import { ClientSideRowModelModule } from "ag-grid-community";

import { AllCommunityModule, ModuleRegistry, ColDef } from "ag-grid-community";
import { Button } from "@/components/ui/button";
import { Edit, Eye, LineChart, MapIcon, MapPinCheckInsideIcon, MapPlus, Printer, PrinterIcon, TrainTrackIcon } from "lucide-react";
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

    { field: "order_no", headerName: "SPK No.", width: 200 },
    { field: "status", headerName: "Status", width: 120 },
    { field: "transporter", headerName: "Transporter", width: 200 },
    { field: "driver", headerName: "Driver", width: 200 },
    { field: "truck_no", headerName: "Truck No", width: 120 },
    { field: "total_order", headerName: "Total Order", width: 120 },
    {
      headerName: "Action",
      pinned: "right",
      headerClass: "header-center",
      field: "action",
      width: 150,
      cellRenderer: (params: any) => {
        return (
          <div className="flex justify-center">
            <Button
              onClick={() => {
                router.push(`/shipping/surat-jalan`);
              }}
              className="h-8 w-8 mr-2 bg-blue-200 text-black hover:bg-blue-400"
              variant="ghost"
            >
              <Printer></Printer>
            </Button>
            <Button
              onClick={() =>
                router.push(`/shipping/order-list/${params.data.order_no}`)
              }
              className="h-8 w-8 mr-2 bg-green-500 text-white hover:bg-green-600"
              variant="ghost"
            >
              <Edit />
            </Button>
            <Button
              onClick={() =>
                router.push(`/shipping/tracking/${params.data.order_no}`)
              }
              className="h-8 w-8 mr-2 bg-yellow-500 text-black hover:bg-green-600"
              variant="ghost"
            >
              <Eye />
            </Button>
          </div>
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
