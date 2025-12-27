/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { ItemPackagingForm } from "@/components/item-packaging/ItemPackagingForm";
import { ItemPackagingTable } from "@/components/item-packaging/ItemPackagingTable";
import { itemPackagingAPI } from "@/lib/api/itemPackaging";
import type { ItemPackaging, ItemCodeOption } from "@/types/itemPackaging";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import router from "next/router";

export default function ItemPackagingPage() {
    const [items, setItems] = useState<ItemPackaging[]>([]);
    const [itemCodeOptions, setItemCodeOptions] = useState<ItemCodeOption[]>([]);
    const [selectedItem, setSelectedItem] = useState<ItemPackaging | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchItems();
        fetchItemCodeOptions();
    }, [page, search]);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await itemPackagingAPI.getAll(page, 10, search);
            setItems(response.data);
            setTotalPages(response.meta.total_pages);
        } catch (error) {
            console.error("Failed to fetch items:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchItemCodeOptions = async () => {
        try {
            const response = await itemPackagingAPI.getItemCodeOptions();
            setItemCodeOptions(response.data);
        } catch (error) {
            console.error("Failed to fetch item codes:", error);
        }
    };

    const handleCreate = () => {
        setSelectedItem(null);
        setIsFormOpen(true);
    };

    const handleEdit = (item: ItemPackaging) => {
        setSelectedItem(item);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this item?")) return;

        try {
            await itemPackagingAPI.delete(id);
            fetchItems();
        } catch (error) {
            console.error("Failed to delete item:", error);
            alert("Failed to delete item");
        }
    };

    const handleSubmit = async (data: Partial<ItemPackaging>) => {
        try {
            if (selectedItem) {
                await itemPackagingAPI.update(selectedItem.id, data);
            } else {
                await itemPackagingAPI.create(data);
            }
            setIsFormOpen(false);
            fetchItems();
        } catch (error) {
            console.error("Failed to save item:", error);
            alert("Failed to save item");
        }
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    return (
        <Layout title="Settings" subTitle="Item Packaging">
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-semibold text-gray-900">
                                Item Packaging Management
                            </h1>

                            <div className="flex gap-4">
                                <Button className="left-6 top-18"
                                    onClick={handleCreate}>
                                    <Plus className="mr-2 w-4" />
                                    Add New
                                </Button>
                                <Button className="left-6 top-18 bg-green-500 text-slate-950 outline-green-600" onClick={() => { router.push('/wms/settings/item-packaging/import-excel') }}>
                                    <Upload className="mr-2 w-4" />
                                    Import Excel
                                </Button>
                            </div>



                        </div>

                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search by item code, EAN, or UOM..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                            </div>
                        ) : (
                            <>
                                <ItemPackagingTable
                                    items={items}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />

                                <div className="flex justify-between items-center mt-6">
                                    <div className="text-sm text-gray-600">
                                        Page {page} of {totalPages}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {isFormOpen && (
                    <ItemPackagingForm
                        item={selectedItem}
                        itemCodeOptions={itemCodeOptions}
                        onSubmit={handleSubmit}
                        onClose={() => setIsFormOpen(false)}
                    />
                )}
            </div>
        </Layout>
    );
}