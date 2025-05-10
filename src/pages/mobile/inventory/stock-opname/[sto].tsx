/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/mobile/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";

type StockTakeBarcode = {
  ID: number;
  barcode: string;
  location: string;
  counted_qty: number;
  CreatedAt: string;
};

export default function StockOpnamePage() {
  const [location, setLocation] = useState("");
  const [barcode, setBarcode] = useState("");
  const [qty, setQty] = useState(1);
  const params = useParams();
  const [title, setTitle] = useState("Stock Take");
  const [dataStockTakeBarcode, setDataStockTakeBarcode] = useState<
    StockTakeBarcode[]
  >([]);

  const [search, setSearch] = useState("");

  const getStockTakeBarcode = async () => {
    try {
      const res = await api.get(`/stock-take/barcode/${params.sto}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setDataStockTakeBarcode(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch barcode:", err);
    }
  };

  useEffect(() => {
    if (params?.sto) {
      setTitle(`Stock Take - ${params.sto}`);
      getStockTakeBarcode();
    }
  }, [params]);

  const filteredData = dataStockTakeBarcode.filter(
    (item) =>
      item.barcode.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!location || !barcode || qty < 1) {
      alert("Please fill in all fields correctly.");
      return;
    }

    try {
      const res = await api.post(
        "/stock-take/scan",
        {
          stock_take_code: params.sto,
          location,
          barcode,
          qty,
        },
        {
          withCredentials: true,
        }
      );

      if (res.data.success) {
        eventBus.emit("showAlert", {
          title: "Success!",
          description: res.data.message,
          type: "success",
        });
        getStockTakeBarcode();
      } else {
        alert("Failed to submit data.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("An error occurred while submitting data.");
    }
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = confirm("Are you sure you want to delete this item?");
    if (!confirmDelete) return;

    try {
      const res = await api.delete(`/stock-take/barcode/delete/${id}`, {
        withCredentials: true,
      });

      if (res.data.success) {
        eventBus.emit("showAlert", {
          title: "Deleted",
          description: res.data.message,
          type: "success",
        });
        // refresh data
        getStockTakeBarcode();
      } else {
        alert("Failed to delete.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("An error occurred while deleting.");
    }
  };

  return (
    <>
      <PageHeader title={title} showBackButton />
      <div className="px-4 py-6 min-h-screen bg-gray-50">
        <Card className="p-4 space-y-4 shadow-md">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Scan / Enter Barcode
            </label>
            <Input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Enter item barcode"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Quantity
            </label>
            <Input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              placeholder="Enter quantity"
            />
          </div>

          <div className="pt-4">
            <Button className="w-full" onClick={handleSubmit}>
              Submit
            </Button>
          </div>
        </Card>

        <div className="mt-6">
          {/* Info total scanned */}
          <div className="text-center text-sm text-gray-600 mb-2">
            Total scanned items:{" "}
            <span className="font-semibold">{filteredData.length}</span>
          </div>

          <div className="mb-3">
            <Input
              placeholder="Search barcode or location..."
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <Card
                  key={item.ID}
                  className="p-3 flex items-center justify-between bg-white shadow-sm"
                >
                  <div>
                    <p className="font-medium text-gray-800">{item.barcode}</p>
                    <p className="text-sm text-gray-500">
                      {item.location} | Qty: {item.counted_qty}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(item.ID)}
                  >
                    Delete
                  </Button>
                </Card>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center">
                No data found.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
