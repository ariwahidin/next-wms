"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, ColDef } from "ag-grid-community";
import Layout from "@/components/layout";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";
import { useRouter } from "next/navigation";

ModuleRegistry.registerModules([AllCommunityModule]);

export default function AddToOrderPage() {
  const [newOrders, setNewOrders] = useState<any[]>([]);
  const [existingOrders, setExistingOrders] = useState<any[]>([]);
  const [selectedNewOrders, setSelectedNewOrders] = useState<any[]>([]);
  const [selectedExistingOrder, setSelectedExistingOrder] = useState<
    any | null
  >(null);
  const [showModal, setShowModal] = useState(false);
  const gridRefNew = useRef<AgGridReact>(null);
  const gridRefExisting = useRef<AgGridReact>(null);
  const [quickFilterText, setQuickFilterText] = useState("");
  const [quickFilterTextOrder, setQuickFilterTextOrder] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const newOrdersColumnDefs: ColDef[] = [
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      field: "order_id",
      headerName: "Order ID",
      pinned: "left",
      width: 150,
    },
    { field: "customer_name", headerName: "Customer", flex: 1 },
    { field: "item_code", headerName: "Product", flex: 1 },
    { field: "qty", headerName: "Qty", width: 100 },
  ];

  const existingOrdersColumnDefs: ColDef[] = [
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      field: "ID",
      headerName: "Order ID",
      pinned: "left",
      width: 150,
    },
    { field: "order_no", headerName: "Order No", flex: 1 },
    { field: "status", headerName: "Status", flex: 1 },
  ];

  const fetchOrders = async () => {
    try {
      const [newOrdersRes, existingOrdersRes] = await Promise.all([
        api.get("/shipping/list-order-part", { withCredentials: true }),
        api.get("/shipping/list-order", { withCredentials: true }),
      ]);

      setNewOrders(newOrdersRes.data.data || []);
      setExistingOrders(existingOrdersRes.data.data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectionChangedNew = () => {
    const selected = gridRefNew.current?.api.getSelectedRows() || [];
    setSelectedNewOrders(selected);
  };

  const onSelectionChangedExisting = () => {
    const selected = gridRefExisting.current?.api.getSelectedRows() || [];
    setSelectedExistingOrder(selected[0] || null);
  };

  const handleAddToOrder = () => {
    if (selectedNewOrders.length === 0) {
      alert("Please select at least one new order.");
      return;
    }
    setShowModal(true);
  };

  const handleConfirmAdd = async () => {
    if (!selectedExistingOrder) {
      alert("Please select an existing order to add into.");
      return;
    }

    try {
      const payload = {
        targetOrderId: selectedExistingOrder.ID,
        ordersToAdd: selectedNewOrders.map((o) => o.ID),
      };

      console.log(payload);

      const response = await api.post("/shipping/add-to-order", payload, {
        withCredentials: true,
      });

      if (response.data.success) {
        eventBus.emit("showAlert", {
          title: "Success!",
          description: "Orders added successfully.",
          type: "success",
        });
        setShowModal(false);
        fetchOrders();
        router.push("/shipping/order-list");
      } else {
        console.error(response.data.message);
      }
    } catch (error) {
      console.error("Error adding orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <Layout title="Shipping" subTitle="Add Orders to Existing Order">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow disabled:opacity-50 w-1/4"
              onClick={handleAddToOrder}
              disabled={newOrders.length === 0}
            >
              Add to Order
            </button>

            <input
              type="text"
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              placeholder="Search New Orders..."
              className="border p-2 rounded w-full ml-4"
            />
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
              ref={gridRefNew}
              rowData={newOrders}
              columnDefs={newOrdersColumnDefs}
              rowSelection="multiple"
              pagination={true}
              paginationPageSize={10}
              onSelectionChanged={onSelectionChangedNew}
              quickFilterText={quickFilterText}
            />
          </div>

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
                <h3 className="text-xl font-semibold mb-4">
                  Select Existing Order
                </h3>

                <div className="pb-4 flex">
                  <input
                    type="text"
                    value={quickFilterTextOrder}
                    onChange={(e) => setQuickFilterTextOrder(e.target.value)}
                    placeholder="Search Existing Orders..."
                    className="border p-2 rounded w-full"
                  />
                </div>

                <div style={{ height: 300 }}>
                  <AgGridReact
                    ref={gridRefExisting}
                    rowData={existingOrders}
                    columnDefs={existingOrdersColumnDefs}
                    rowSelection="single"
                    pagination={true}
                    paginationPageSize={5}
                    onSelectionChanged={onSelectionChangedExisting}
                    quickFilterText={quickFilterTextOrder}
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded text-gray-700"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
                    onClick={handleConfirmAdd}
                  >
                    Confirm Add
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
