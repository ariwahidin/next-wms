/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
// import { ColDef, ClientSideRowModelModule } from "ag-grid-community";



import Layout from "@/components/layout";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";

import { AllCommunityModule, ModuleRegistry, ColDef } from "ag-grid-community";
import { useRouter } from "next/navigation";
ModuleRegistry.registerModules([AllCommunityModule]);

export default function OrderPage() {
  const [rowData, setRowData] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const gridRef = useRef<AgGridReact>(null);
  const [quickFilterText, setQuickFilterText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();


  // Column definitions for AG-Grid
  const columnDefs: ColDef[] = [
    {
      headerCheckboxSelection: true, // Checkbox in the header to select all rows
      checkboxSelection: true, // Checkbox in each row for individual selection
      field: "outbound_id",
      headerName: "Delivery No.",
      width: 150,
      pinned: "left",
      valueGetter: (params) => {
        return params.data.delivery_number;
      },
    },
    { field: "customer_name", headerName: "Customer", width: 300 },
    { field: "total_item", headerName: "Total Item", width: 100 },
    { field: "total_qty", headerName: "Quantity", width: 100 },
    { field: "volume", headerName: "Volume", width: 100 },
  ];

  // Fetch data function
  const fetchData = async () => {
    try {
      const response = await api.get("/shipping/list-order-part", {
        withCredentials: true,
      });
      const data = await response.data;
      if (data.success === false) {
        return;
      }
      setRowData(data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Selection change handler
  const onSelectionChanged = () => {
    const selected = gridRef.current?.api.getSelectedRows() || [];
    setSelectedRows(selected);
  };

  // Combine order handler
  const handleCombineOrder = () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one order to combine.");
      return;
    }
    setShowModal(true);
  };

  const rowSelection = useMemo(() => { 
    return {
          mode: 'singleRow',
      };
  }, []);
  

  // Confirm combine handler
  const handleConfirmCombine = async () => {
    console.log("Combining orders:", selectedRows);
    try {
      const response = await api.post("/shipping/combine-order", selectedRows, {
        withCredentials: true,
      });
      const data = await response;

      if (data.data.success === false) {
        return;
      }

      eventBus.emit("showAlert", {
        title: "Success!",
        description: data.data.message,
        type: "success",
      });

      setShowModal(false);
      fetchData();
      router.push(
        `/shipping/order-list`
      )
      
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Search input handler
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuickFilterText(event.target.value);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Layout title="Shipping" subTitle="Combine Picking">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow disabled:opacity-50"
              onClick={handleCombineOrder}
              disabled={rowData.length === 0}
            >
              Combine Order
            </button>
            <div className="flex items-center">
              <input
                type="text"
                value={quickFilterText}
                onChange={handleSearchChange}
                placeholder="Search Orders..."
                className="border p-2 rounded w-full"
              />
            </div>
          </div>

          <div
            style={{
              height: 400,
              width: "100%",
              fontSize: "12px",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <AgGridReact
              // modules={[ClientSideRowModelModule]}
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              // rowSelection="single"
              rowSelection="multiple"
              pagination={true}
              paginationPageSize={10}
              onSelectionChanged={onSelectionChanged}
              // domLayout="autoHeight"
              quickFilterText={quickFilterText}
            />
          </div>

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-semibold mb-4">Confirm Combine</h3>
                <p className="mb-6">
                  Are you sure you want to combine{" "}
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
                    onClick={handleConfirmCombine}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
