/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";

type InventoryItem = {
  item_code: string;
  item_name: string;
  location: string;
  whs_code: string;
  qa_status: string;
  qty_onhand: number;
  qty_available: number;
  qty_allocated: number;
};

const StockList = () => {
  const [stocks, setStocks] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter/sort related states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'A', etc.
  const [categoryFilter, setCategoryFilter] = useState("all"); // customize later
  const [sortBy, setSortBy] = useState<keyof InventoryItem>("item_code");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Fetch from API
  const fetchStockData = async () => {
    try {
      const response = await api.get('/inventory');
      setStocks(response.data.data.inventories);
    } catch (error) {
      console.error("Error fetching stock data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  // Filter & sort data
  const filteredAndSortedStock = useMemo(() => {
    const filtered = stocks.filter((item) => {
      const matchesSearch =
        item.item_code.toLowerCase().includes(search.toLowerCase()) ||
        item.item_name.toLowerCase().includes(search.toLowerCase()) ||
        item.whs_code.toLowerCase().includes(search.toLowerCase()) ||
        item.location.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || item.qa_status === statusFilter;
      const matchesCategory = categoryFilter === "all" || item.item_code === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    // Sorting logic
    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

    return sorted;
  }, [stocks, search, statusFilter, categoryFilter, sortBy, sortOrder]);

  // For demo: simple rendering
  return (
    <div className="container">
      <input
        type="text"
        placeholder="Search item..."
        className="form-control my-2"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table className="table table-bordered table-sm">
        <thead>
          <tr>
            <th>Item Code</th>
            <th>Item Name</th>
            <th>Location</th>
            <th>Warehouse</th>
            <th>QA Status</th>
            <th>On Hand</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedStock.map((item, index) => (
            <tr key={index}>
              <td>{item.item_code}</td>
              <td>{item.item_name}</td>
              <td>{item.location}</td>
              <td>{item.whs_code}</td>
              <td>{item.qa_status}</td>
              <td>{item.qty_onhand}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StockList;
