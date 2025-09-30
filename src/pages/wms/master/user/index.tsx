/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, ColDef } from "ag-grid-community";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

ModuleRegistry.registerModules([AllCommunityModule]);

export default function UserListPage() {
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
      valueGetter: (params) => params.node.rowIndex + 1,
    },
    { field: "username", headerName: "Username", flex: 1 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1.5 },
    { field: "base_route", headerName: "Base Route", flex: 1 },
    {
      headerName: "Action",
      field: "action",
      width: 120,
      cellRenderer: (params: any) => {
        return (
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            onClick={() => router.push(`/wms/master/user/edit/${params.data.ID}`)}
          >
            Edit
          </button>
        );
      },
    },
  ];

  const fetchData = async () => {
    try {
      const response = await api.get("/users", {
        withCredentials: true,
      });
      const data = await response.data;
      if (data.success === false) return;
      setRowData(data.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Layout title="User Management" subTitle="User List">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Toolbar */}
          <div className="flex justify-between mb-4">
            <Button
              onClick={() => router.push("/wms/master/user/create")}
            >
              + Add User
            </Button>
            <input
              type="text"
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              placeholder="Search Users..."
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
