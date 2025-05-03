/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { AgGridReact } from "ag-grid-react";
// import { ColDef, ClientSideRowModelModule, GridApi } from "ag-grid-community";
import Layout from "@/components/layout";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

import { AllCommunityModule, ModuleRegistry, ColDef } from "ag-grid-community";
import eventBus from "@/utils/eventBus";
ModuleRegistry.registerModules([AllCommunityModule]);

export default function OrderDetailPage() {
  const [rowData, setRowData] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const gridRef = useRef<AgGridReact>(null);
  const [quickFilterText, setQuickFilterText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const order = params?.order as string | undefined;
  const [showModal, setShowModal] = useState(false);

  const columnDefs: ColDef[] = [
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      field: "ID",
      headerName: "Order ID",
      width: 150,
      pinned: "left",
    },
    { field: "order_no", headerName: "Order ID", flex: 1 },
    { field: "delivery_number", headerName: "Delivery Number", flex: 1 },
    { field: "qty", headerName: "Quantity", width: 120 },
    { field: "volume", headerName: "Volume", width: 120 },
  ];

  const gridOptions = {
    rowSelection: {
      type: "multiple",
      headerCheckbox: true,
    },
  };

  const onSelectionChanged = () => {
    const selected = gridRef.current?.api.getSelectedRows() || [];
    setSelectedRows(selected);
  };

  const handleUngroup = async () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one order to ungroup.");
      return;
    }
    console.log("Ungroup these orders:", selectedRows);

    try {
      const response = await api.post("/shipping/order/ungroup", selectedRows, {
        withCredentials: true,
      });
      const data = await response;
      console.log(data);

      if (data.data.success) {
        eventBus.emit("showAlert", {
          title: "Success!",
          description: data.data.message,
          type: "success",
        });
        setShowModal(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    // Disini kamu bisa lanjut POST ke API ungroup
  };

  const fetchData = async () => {
    try {
      const response = await api.get(`/shipping/order/${order}`, {
        withCredentials: true,
      });
      const data = await response.data;
      if (data.success !== false) {
        setRowData(data.data);
      }
    } catch (error) {
      console.error("Error fetching detail data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (order) {
      fetchData();
    }
  }, []);

  return (
    <Layout title="Shipping" subTitle={`Order Detail #${order}`}>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <button
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded shadow disabled:opacity-50"
              onClick={() => {
                if (selectedRows.length < 1) {
                  alert("Please select at least one order to ungroup.");
                } else {
                  setShowModal(true);
                }
              }}
              disabled={rowData.length === 0}
            >
              Ungroup Selected
            </button>

            <div className="flex justify-end">
              <input
                type="text"
                value={quickFilterText}
                onChange={(e) => setQuickFilterText(e.target.value)}
                placeholder="Search Orders..."
                className="border p-2 rounded w-64"
              />
            </div>
          </div>

          <div
            style={{
              height: 500,
              width: "100%",
              fontSize: "12px",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <AgGridReact
              ref={gridRef}
              // modules={[ClientSideRowModelModule]}
              rowModelType="clientSide"
              rowData={rowData}
              columnDefs={columnDefs}
              rowSelection="multiple"
              pagination={true}
              paginationPageSize={10}
              domLayout="autoHeight"
              // onGridReady={(params) => setGridApi(params.api)}
              onSelectionChanged={onSelectionChanged}
              quickFilterText={quickFilterText}
            />
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Confirm Combine</h3>
            <p className="mb-6">
              Are you sure you want to ungroup{" "}
              <strong>{selectedRows.length}</strong> orders?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded text-gray-700"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
                onClick={handleUngroup}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
