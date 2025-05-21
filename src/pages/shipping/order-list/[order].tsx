/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { AgGridReact } from "ag-grid-react";
import Layout from "@/components/layout";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

import { AllCommunityModule, ModuleRegistry, ColDef } from "ag-grid-community";
import eventBus from "@/utils/eventBus";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
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
  const [editData, setEditData] = useState<any | null>(null);
  const [dataHeader, setDataHeader] = useState<any | null>(null);

  // const [header, setHeader] = useState({
  //   order_no: order,
  //   driver: "John Doe",
  //   truckNumber: "AB1234CD",
  //   deliveryDate: "2025-05-20",
  // });

  const handleSaveHeader = async () => {
    console.log("Header Data:", dataHeader);

    const response = await api.put(
      `/shipping/order/${dataHeader.ID}`,
      dataHeader,
      {
        withCredentials: true,
      }
    );

    const data = await response.data;
    if (data.success === false) {
      return;
    }

    if (data.success) {
      eventBus.emit("showAlert", {
        title: "Header Saved",
        description: data.message,
        type: "success",
      });
    }
  };

  const handleEdit = (data: any) => {
    setEditData(data);
    setShowModal(false); // Pastikan modal ungroup tertutup kalau sedang terbuka
  };

  const columnDefs: ColDef[] = [
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      field: "delivery_number",
      headerName: "Delivery No.",
      width: 150,
      pinned: "left",
    },
    { field: "customer", headerName: "Customer", width: 300 },
    { field: "ship_to", headerName: "Ship To", width: 300 },
    { field: "total_item", headerName: "Total Item", width: 120 },
    { field: "total_qty", headerName: "Total Qty", width: 120 },
    {
      headerName: "Actions",
      pinned: "right",
      headerClass: "header-center",
      width: 100,
      field: "ID",
      cellRenderer: (params) => {
        return (
          <div style={{ textAlign: "center" }}>
            <Button
              title="View or Edit"
              onClick={() => handleEdit(params.data)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 mr-2 bg-green-500 text-white hover:bg-green-600"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
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
  };

  const fetchData = async () => {
    try {
      const response = await api.get(`/shipping/order/${order}`, {
        withCredentials: true,
      });
      const data = await response.data;
      if (data.success !== false) {
        setRowData(data.data.order_details);
        setDataHeader(data.data.order_header);
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
  }, [order]);

  return (
    <Layout
      title="List Order"
      titleLink="/shipping/order-list"
      subTitle={`#${order}`}
    >
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          {/* Header Form Section */}

          <div className="p-4 space-y-4">
            <div className="bg-white shadow-md rounded-md p-6 space-y-4 border">
              <h2 className="text-lg font-semibold">{order}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="transporter"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Transporter
                  </label>
                  <input
                    type="text"
                    id="transporter"
                    value={dataHeader.transporter}
                    onChange={(e) =>
                      setDataHeader({ ...dataHeader, transporter: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="Enter transporter name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="driver"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Driver Name
                  </label>
                  <input
                    type="text"
                    id="driver"
                    value={dataHeader.driver}
                    onChange={(e) =>
                      setDataHeader({ ...dataHeader, driver: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="Enter driver name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="truckNumber"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Truck Number
                  </label>
                  <input
                    type="text"
                    id="truckNumber"
                    value={dataHeader.truck_no}
                    onChange={(e) =>
                      setDataHeader({
                        ...dataHeader,
                        truck_no: e.target.value,
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="Enter truck number"
                  />
                </div>
                <div>
                  <label
                    htmlFor="deliveryDate"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    id="deliveryDate"
                    value={dataHeader.delivery_date}
                    onChange={(e) =>
                      setDataHeader({
                        ...dataHeader,
                        delivery_date: e.target.value,
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSaveHeader}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Save Header
                </button>
              </div>
            </div>

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
                rowModelType="clientSide"
                rowData={rowData}
                columnDefs={columnDefs}
                rowSelection="multiple"
                pagination={true}
                paginationPageSize={10}
                domLayout="autoHeight"
                onSelectionChanged={onSelectionChanged}
                quickFilterText={quickFilterText}
              />
            </div>
          </div>
        </>
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

      {editData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-semibold mb-4">Edit Order</h3>

            <div className="space-y-4">
              <div>
                <label className="block font-medium">Delivery Number</label>
                <input
                  type="text"
                  className="border p-2 rounded w-full"
                  value={editData.delivery_number}
                  readOnly
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      delivery_number: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block font-medium">Customer</label>
                <input
                  type="text"
                  className="border p-2 rounded w-full"
                  value={editData.customer}
                  onChange={(e) =>
                    setEditData({ ...editData, customer: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block font-medium">Ship To</label>
                <textarea
                  className="border p-2 rounded w-full"
                  value={editData.ship_to}
                  onChange={(e) =>
                    setEditData({ ...editData, ship_to: e.target.value })
                  }
                />
              </div>
              {/* Tambahkan field lain sesuai kebutuhan */}
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <button
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded text-gray-700"
                onClick={() => setEditData(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                onClick={async () => {
                  try {
                    const response = await api.put(
                      `/shipping/order/detail/${editData.id}`,
                      editData,
                      { withCredentials: true }
                    );
                    if (response.data.success) {
                      eventBus.emit("showAlert", {
                        title: "Success!",
                        description: "Order updated successfully.",
                        type: "success",
                      });
                      setEditData(null);
                      fetchData();
                    }
                  } catch (error) {
                    console.error("Error updating order:", error);
                    eventBus.emit("showAlert", {
                      title: "Error!",
                      description: "Failed to update order.",
                      type: "error",
                    });
                  }
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
