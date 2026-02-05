/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { Download, Loader2, Search, X, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import eventBus from "@/utils/eventBus";
import * as XLSX from "xlsx";
import Layout from "@/components/layout";

interface Product {
    ID: number;
    owner_code: string;
    sku: string;
    unit_model: string;
    ean: string;
    uom: string;
    CreatedAt: string;
    created_by_name: string;
    UpdatedAt: string;
}

export default function ProductTablePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [searchQuery, products]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get("/mobile/inventory/products/", {
                withCredentials: true,
            });
            setProducts(response.data.data || []);
        } catch (error) {
            console.error("Error fetching products:", error);
            eventBus.emit("showAlert", {
                title: "Error!",
                description: "Failed to fetch products",
                type: "error",
            });
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const filterProducts = () => {
        if (!searchQuery.trim()) {
            setFilteredProducts(products);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = products.filter(
            (product) =>
                product.sku.toLowerCase().includes(query) ||
                product.unit_model.toLowerCase().includes(query) ||
                product.ean.toLowerCase().includes(query) ||
                product.owner_code.toLowerCase().includes(query) ||
                product.uom.toLowerCase().includes(query) ||
                product.created_by_name.toLowerCase().includes(query)
        );
        setFilteredProducts(filtered);
    };

    const downloadExcel = () => {
        try {
            setDownloading(true);

            // Prepare data for Excel
            const excelData = filteredProducts.map((product, index) => ({
                No: index + 1,
                "Owner Code": product.owner_code,
                SKU: product.sku,
                Model: product.unit_model,
                EAN: product.ean,
                UOM: product.uom,
                "Created At": new Date(product.CreatedAt).toLocaleString("id-ID"),
                "Updated At": product.UpdatedAt
                    ? new Date(product.UpdatedAt).toLocaleString("id-ID")
                    : "-",
            }));

            // Create worksheet
            const worksheet = XLSX.utils.json_to_sheet(excelData);

            // Set column widths
            const columnWidths = [
                { wch: 5 },  // No
                { wch: 15 }, // Owner Code
                { wch: 20 }, // SKU
                { wch: 20 }, // Model
                { wch: 18 }, // EAN
                { wch: 10 }, // UOM
                { wch: 20 }, // Created At
                { wch: 20 }, // Updated At
            ];
            worksheet["!cols"] = columnWidths;

            // Create workbook
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().split("T")[0];
            const filename = `RegisterItemData_${timestamp}.xlsx`;

            // Download file
            XLSX.writeFile(workbook, filename);

            eventBus.emit("showAlert", {
                title: "Success!",
                description: `Downloaded ${filteredProducts.length} items`,
                type: "success",
            });
        } catch (error) {
            console.error("Error downloading Excel:", error);
            eventBus.emit("showAlert", {
                title: "Error!",
                description: "Failed to download Excel file",
                type: "error",
            });
        } finally {
            setDownloading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("id-ID", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <>
            <Layout title="Utilities" subTitle="Register Item Data">
                <div className="min-h-screen bg-gray-50 p-4 pb-24">
                    <div className="max-w-7xl mx-auto space-y-4">
                        {/* Header Section */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Item List
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Total: {filteredProducts.length} items
                                        {searchQuery && ` (filtered from ${products.length})`}
                                    </p>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button
                                        onClick={fetchProducts}
                                        variant="outline"
                                        disabled={loading}
                                        className="flex-1 sm:flex-none"
                                    >
                                        <RefreshCw
                                            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                                        />
                                        Refresh
                                    </Button>
                                    <Button
                                        onClick={downloadExcel}
                                        disabled={downloading || filteredProducts.length === 0}
                                        className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                                    >
                                        {downloading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Downloading...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="h-4 w-4 mr-2" />
                                                Download Excel
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Search Bar */}
                            <div className="mt-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search by SKU, Model, EAN, Owner, or UOM..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Table Section */}
                        {loading ? (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                                <p className="text-gray-500">Loading products...</p>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                                <p className="text-gray-500">
                                    {searchQuery
                                        ? "No products found matching your search"
                                        : "No products available"}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                {/* Desktop Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    No
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Owner Code
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    SKU
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Model
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    EAN
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    UOM
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Created At
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Created By
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {filteredProducts.map((product, index) => (
                                                <tr
                                                    key={product.ID}
                                                    className="hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                        {product.owner_code}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {product.sku}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {product.unit_model}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {product.ean}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {product.uom}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">
                                                        {formatDate(product.CreatedAt)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">
                                                        {product.created_by_name}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Cards */}
                                <div className="md:hidden divide-y divide-gray-200">
                                    {filteredProducts.map((product, index) => (
                                        <div key={product.ID} className="p-4 hover:bg-gray-50">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 text-xs font-semibold rounded">
                                                            {index + 1}
                                                        </span>
                                                        <span className="font-semibold text-gray-900">
                                                            {product.sku}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600">
                                                        {product.unit_model}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Owner:</span>
                                                    <p className="font-medium text-gray-900">
                                                        {product.owner_code}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">UOM:</span>
                                                    <p className="font-medium text-gray-900">
                                                        {product.uom}
                                                    </p>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-gray-500">EAN:</span>
                                                    <p className="font-medium text-gray-900">
                                                        {product.ean}
                                                    </p>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-gray-500">Created:</span>
                                                    <p className="text-gray-900">
                                                        {formatDate(product.CreatedAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Layout>
        </>
    );
}