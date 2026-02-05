/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import PageHeader from "@/components/mobile/PageHeader";
import { Input } from "@/components/ui/input";
import { Loader2, X, Edit, Trash2, Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import eventBus from "@/utils/eventBus";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Owner {
    id: number;
    code: string;
    name: string;
}

interface Uom {
    id: number;
    code: string;
    name: string;
}

interface Product {
    ID: number;
    owner_code: string;
    sku: string;
    unit_model: string;
    ean: string;
    uom: string;
    CreatedAt: string;
}

export default function RegisterProductPage() {
    // Form states
    const [ownerCode, setOwnerCode] = useState("");
    const [sku, setSku] = useState("");
    const [unitModel, setUnitModel] = useState("");
    const [ean, setEan] = useState("");
    const [uom, setUom] = useState("");
    const [loading, setLoading] = useState(false);
    
    // Data states
    const [owners, setOwners] = useState<Owner[]>([]);
    const [uoms, setUoms] = useState<Uom[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    
    // UI states
    const [activeTab, setActiveTab] = useState<"register" | "list">("register");
    const [searchQuery, setSearchQuery] = useState("");
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    
    // Edit form states
    const [editOwnerCode, setEditOwnerCode] = useState("");
    const [editSku, setEditSku] = useState("");
    const [editUnitModel, setEditUnitModel] = useState("");
    const [editEan, setEditEan] = useState("");
    const [editUom, setEditUom] = useState("");
    const [editLoading, setEditLoading] = useState(false);
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const skuRef = useRef<HTMLInputElement>(null);
    const unitModelRef = useRef<HTMLInputElement>(null);
    const eanRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchOwners();
        fetchUoms();
        fetchProducts();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [searchQuery, products]);

    const fetchOwners = async () => {
        try {
            const response = await api.get("/owners/", {
                withCredentials: true,
            });
            setOwners(response.data.data);
        } catch (error) {
            console.error("Error fetching owners:", error);
        }
    };

    const fetchUoms = async () => {
        try {
            const response = await api.get("/uoms/", {
                withCredentials: true,
            });
            setUoms(response.data.data);
        } catch (error) {
            console.error("Error fetching UOMs:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await api.get("/mobile/inventory/products/", {
                withCredentials: true,
            });
            setProducts(response.data.data || []);
        } catch (error) {
            console.error("Error fetching products:", error);
            setProducts([]);
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
                product.uom.toLowerCase().includes(query)
        );
        setFilteredProducts(filtered);
        setCurrentPage(1);
    };

    const handleKeyPress = (
        e: React.KeyboardEvent<HTMLInputElement>,
        nextRef: React.RefObject<HTMLInputElement> | null
    ) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (nextRef && nextRef.current) {
                nextRef.current.focus();
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!ownerCode || !sku.trim() || !unitModel.trim() || !ean.trim() || !uom) {
            eventBus.emit("showAlert", {
                title: "Error!",
                description: "All fields are required",
                type: "error",
            });
            return;
        }

        const dataToPost = {
            owner_code: ownerCode,
            sku: sku.toUpperCase(),
            unit_model: unitModel.toUpperCase(),
            ean: ean.toUpperCase(),
            uom: uom,
        };

        try {
            setLoading(true);
            const response = await api.post(
                "/mobile/inventory/add-item/",
                dataToPost,
                {
                    withCredentials: true,
                }
            );
            const data = await response.data;
            if (data.success) {
                eventBus.emit("showAlert", {
                    title: "Success!",
                    description: data.message,
                    type: "success",
                });
                setSku("");
                setUnitModel("");
                setEan("");
                skuRef.current?.focus();
                fetchProducts(); // Refresh product list
            }
        } catch (error: any) {
            console.error("Error saving data:", error);
            const errorMessage =
                error.response?.data?.message || "Failed to register product";
            eventBus.emit("showAlert", {
                title: "Error!",
                description: errorMessage,
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setEditOwnerCode(product.owner_code);
        setEditSku(product.sku);
        setEditUnitModel(product.unit_model);
        setEditEan(product.ean);
        setEditUom(product.uom);
        setEditDialogOpen(true);
    };

    const handleUpdate = async () => {
        if (!editOwnerCode || !editSku.trim() || !editUnitModel.trim() || !editEan.trim() || !editUom) {
            eventBus.emit("showAlert", {
                title: "Error!",
                description: "All fields are required",
                type: "error",
            });
            return;
        }

        const dataToUpdate = {
            owner_code: editOwnerCode,
            sku: editSku.toUpperCase(),
            unit_model: editUnitModel.toUpperCase(),
            ean: editEan.toUpperCase(),
            uom: editUom,
        };

        try {
            setEditLoading(true);
            const response = await api.put(
                `/mobile/inventory/products/${selectedProduct?.ID}`,
                dataToUpdate,
                {
                    withCredentials: true,
                }
            );
            const data = await response.data;
            if (data.success) {
                eventBus.emit("showAlert", {
                    title: "Success!",
                    description: "Product updated successfully",
                    type: "success",
                });
                setEditDialogOpen(false);
                fetchProducts();
            }
        } catch (error: any) {
            console.error("Error updating data:", error);
            const errorMessage =
                error.response?.data?.message || "Failed to update product";
            eventBus.emit("showAlert", {
                title: "Error!",
                description: errorMessage,
                type: "error",
            });
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = (product: Product) => {
        setSelectedProduct(product);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await api.delete(
                `/mobile/inventory/products/${selectedProduct?.ID}`,
                {
                    withCredentials: true,
                }
            );
            const data = await response.data;
            if (data.success) {
                eventBus.emit("showAlert", {
                    title: "Success!",
                    description: "Product deleted successfully",
                    type: "success",
                });
                setDeleteDialogOpen(false);
                fetchProducts();
            }
        } catch (error: any) {
            console.error("Error deleting data:", error);
            const errorMessage =
                error.response?.data?.message || "Failed to delete product";
            eventBus.emit("showAlert", {
                title: "Error!",
                description: errorMessage,
                type: "error",
            });
        }
    };

    // Pagination logic
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = filteredProducts.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <>
            <PageHeader title="Product Management" showBackButton />
            <div className="min-h-screen bg-gray-50">
                {/* Tab Navigation */}
                <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
                    <div className="flex max-w-md mx-auto">
                        <button
                            onClick={() => setActiveTab("register")}
                            className={`flex-1 py-4 text-sm font-medium transition-colors ${
                                activeTab === "register"
                                    ? "text-blue-600 border-b-2 border-blue-600"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            <Plus className="inline-block w-4 h-4 mr-1" />
                            Register Product
                        </button>
                        <button
                            onClick={() => setActiveTab("list")}
                            className={`flex-1 py-4 text-sm font-medium transition-colors ${
                                activeTab === "list"
                                    ? "text-blue-600 border-b-2 border-blue-600"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            <Search className="inline-block w-4 h-4 mr-1" />
                            Product List ({products.length})
                        </button>
                    </div>
                </div>

                {/* Register Tab */}
                {activeTab === "register" && (
                    <div className="p-4 space-y-4 pb-24 max-w-md mx-auto">
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">OWNER</label>
                                <Select value={ownerCode} onValueChange={setOwnerCode}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Owner" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {owners.map((owner) => (
                                            <SelectItem key={owner.id} value={owner.code}>
                                                {owner.code} - {owner.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">UOM</label>
                                <Select value={uom} onValueChange={setUom}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select UOM" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {uoms.map((uomItem) => (
                                            <SelectItem key={uomItem.id} value={uomItem.code}>
                                                {uomItem.code}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">SKU</label>
                                <div className="relative">
                                    <Input
                                        ref={skuRef}
                                        placeholder="Scan or enter SKU"
                                        value={sku}
                                        onChange={(e) => setSku(e.target.value.toUpperCase())}
                                        onKeyPress={(e) => handleKeyPress(e, unitModelRef)}
                                    />
                                    {sku && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSku("");
                                                skuRef.current?.focus();
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">MODEL</label>
                                <div className="relative">
                                    <Input
                                        ref={unitModelRef}
                                        placeholder="Scan or enter Model"
                                        value={unitModel}
                                        onChange={(e) => setUnitModel(e.target.value.toUpperCase())}
                                        onKeyPress={(e) => handleKeyPress(e, eanRef)}
                                    />
                                    {unitModel && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUnitModel("");
                                                unitModelRef.current?.focus();
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">EAN</label>
                                <div className="relative">
                                    <Input
                                        ref={eanRef}
                                        placeholder="Scan or enter EAN"
                                        value={ean}
                                        onChange={(e) => setEan(e.target.value.toUpperCase())}
                                        onKeyPress={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                            }
                                        }}
                                    />
                                    {ean && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEan("");
                                                eanRef.current?.focus();
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {loading ? "SAVING..." : "REGISTER PRODUCT"}
                            </Button>
                        </form>
                    </div>
                )}

                {/* List Tab */}
                {activeTab === "list" && (
                    <div className="p-4 space-y-4 pb-24 max-w-4xl mx-auto">
                        {/* Search Bar */}
                        <div className="sticky top-[57px] z-10 bg-gray-50 pb-4">
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

                        {/* Product List */}
                        {currentProducts.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg shadow">
                                <p className="text-gray-500">
                                    {searchQuery
                                        ? "No products found matching your search"
                                        : "No products registered yet"}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {currentProducts.map((product) => (
                                    <div
                                        key={product.ID}
                                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 text-lg">
                                                    {product.sku}
                                                </h3>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Model: {product.unit_model}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-500">EAN:</span>
                                                <p className="font-medium text-gray-900">{product.ean}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Owner:</span>
                                                <p className="font-medium text-gray-900">{product.owner_code}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">UOM:</span>
                                                <p className="font-medium text-gray-900">{product.uom}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Created:</span>
                                                <p className="font-medium text-gray-900">
                                                    {new Date(product.CreatedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </button>
                                
                                <span className="text-sm text-gray-700">
                                    Page {currentPage} of {totalPages}
                                </span>
                                
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 gap-0 bg-slate-50">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b">
                        <DialogTitle>Edit Product</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto flex-1 px-6 py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">OWNER</label>
                                <Select value={editOwnerCode} onValueChange={setEditOwnerCode}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Owner" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {owners.map((owner) => (
                                            <SelectItem key={owner.id} value={owner.code}>
                                                {owner.code} - {owner.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">UOM</label>
                                <Select value={editUom} onValueChange={setEditUom}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select UOM" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {uoms.map((uomItem) => (
                                            <SelectItem key={uomItem.id} value={uomItem.code}>
                                                {uomItem.code}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">SKU</label>
                                <Input
                                    placeholder="Enter SKU"
                                    value={editSku}
                                    onChange={(e) => setEditSku(e.target.value.toUpperCase())}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">MODEL</label>
                                <Input
                                    placeholder="Enter Model"
                                    value={editUnitModel}
                                    onChange={(e) => setEditUnitModel(e.target.value.toUpperCase())}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">EAN</label>
                                <Input
                                    placeholder="Enter EAN"
                                    value={editEan}
                                    onChange={(e) => setEditEan(e.target.value.toUpperCase())}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 border-t bg-gray-50 flex-row gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setEditDialogOpen(false)}
                            disabled={editLoading}
                            className="flex-1 sm:flex-none"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={editLoading}
                            className="bg-blue-500 hover:bg-blue-600 flex-1 sm:flex-none"
                        >
                            {editLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Updating...
                                </>
                            ) : (
                                "Update Product"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-slate-50">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Product</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4">
                            <span className="block">Are you sure you want to delete this product?</span>
                            <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                                <p className="font-medium text-gray-900 break-words">{selectedProduct?.sku}</p>
                                <p className="text-sm text-gray-600 break-words">Model: {selectedProduct?.unit_model}</p>
                                <p className="text-sm text-gray-600 break-words">EAN: {selectedProduct?.ean}</p>
                            </div>
                            <span className="block text-sm text-red-600">
                                This action cannot be undone.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                        <AlertDialogCancel className="w-full sm:w-auto mt-0">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-500 hover:bg-red-600 w-full sm:w-auto"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}