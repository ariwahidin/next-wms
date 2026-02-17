/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import PageHeader from "@/components/mobile/PageHeader";
import { Input } from "@/components/ui/input";
import { Loader2, X, Edit, Trash2, Search, Plus, ChevronLeft, ChevronRight, Package } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import eventBus from "@/utils/eventBus";
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

interface MasterCarton {
    id: number;
    carton_code: string;
    carton_name: string;
    description: string;
    length: number;
    width: number;
    height: number;
    max_weight: number;
    tare_weight: number;
    volume: number;
    is_default: boolean;
    material: string;
    created_at: string;
}

export default function MasterCartonPage() {
    // Form states
    const [cartonCode, setCartonCode] = useState("");
    const [cartonName, setCartonName] = useState("");
    const [description, setDescription] = useState("");
    const [length, setLength] = useState("");
    const [width, setWidth] = useState("");
    const [height, setHeight] = useState("");
    const [maxWeight, setMaxWeight] = useState("");
    const [tareWeight, setTareWeight] = useState("");
    const [material, setMaterial] = useState("");
    const [isDefault, setIsDefault] = useState(false);
    const [volume, setVolume] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    
    // Data states
    const [cartons, setCartons] = useState<MasterCarton[]>([]);
    const [filteredCartons, setFilteredCartons] = useState<MasterCarton[]>([]);
    
    // UI states
    const [activeTab, setActiveTab] = useState<"register" | "list">("register");
    const [searchQuery, setSearchQuery] = useState("");
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedCarton, setSelectedCarton] = useState<MasterCarton | null>(null);
    
    // Edit form states
    const [editCartonCode, setEditCartonCode] = useState("");
    const [editCartonName, setEditCartonName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editLength, setEditLength] = useState("");
    const [editWidth, setEditWidth] = useState("");
    const [editHeight, setEditHeight] = useState("");
    const [editMaxWeight, setEditMaxWeight] = useState("");
    const [editTareWeight, setEditTareWeight] = useState("");
    const [editMaterial, setEditMaterial] = useState("");
    const [editIsDefault, setEditIsDefault] = useState(false);
    const [editVolume, setEditVolume] = useState<number>(0);
    const [editLoading, setEditLoading] = useState(false);
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const cartonCodeRef = useRef<HTMLInputElement>(null);
    const cartonNameRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLInputElement>(null);
    const lengthRef = useRef<HTMLInputElement>(null);
    const widthRef = useRef<HTMLInputElement>(null);
    const heightRef = useRef<HTMLInputElement>(null);
    const maxWeightRef = useRef<HTMLInputElement>(null);
    const tareWeightRef = useRef<HTMLInputElement>(null);
    const materialRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchCartons();
    }, []);

    useEffect(() => {
        filterCartons();
    }, [searchQuery, cartons]);

    // Auto-calculate volume when dimensions change
    useEffect(() => {
        const l = parseFloat(length) || 0;
        const w = parseFloat(width) || 0;
        const h = parseFloat(height) || 0;
        setVolume(l * w * h);
    }, [length, width, height]);

    useEffect(() => {
        const l = parseFloat(editLength) || 0;
        const w = parseFloat(editWidth) || 0;
        const h = parseFloat(editHeight) || 0;
        setEditVolume(l * w * h);
    }, [editLength, editWidth, editHeight]);

    const fetchCartons = async () => {
        try {
            const response = await api.get("/master-cartons/", {
                withCredentials: true,
            });
            setCartons(response.data.data || []);
        } catch (error) {
            console.error("Error fetching cartons:", error);
            setCartons([]);
        }
    };

    const filterCartons = () => {
        if (!searchQuery.trim()) {
            setFilteredCartons(cartons);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = cartons.filter(
            (carton) =>
                carton.carton_code.toLowerCase().includes(query) ||
                carton.carton_name.toLowerCase().includes(query) ||
                carton.description.toLowerCase().includes(query) ||
                carton.material.toLowerCase().includes(query) ||
                carton.length.toString().includes(query) ||
                carton.width.toString().includes(query) ||
                carton.height.toString().includes(query) ||
                carton.volume.toString().includes(query)
        );
        setFilteredCartons(filtered);
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

        if (!cartonCode.trim() || !cartonName.trim() || !length || !width || !height) {
            eventBus.emit("showAlert", {
                title: "Error!",
                description: "Container Code, Container Name, and all dimensions are required",
                type: "error",
            });
            return;
        }

        const l = parseFloat(length);
        const w = parseFloat(width);
        const h = parseFloat(height);

        if (l <= 0 || w <= 0 || h <= 0) {
            eventBus.emit("showAlert", {
                title: "Error!",
                description: "Dimensions must be greater than 0",
                type: "error",
            });
            return;
        }

        const dataToPost = {
            carton_code: cartonCode.toUpperCase(),
            carton_name: cartonName,
            description: description,
            length: l,
            width: w,
            height: h,
            max_weight: maxWeight ? parseFloat(maxWeight) : 0,
            tare_weight: tareWeight ? parseFloat(tareWeight) : 0,
            material: material,
            is_default: isDefault,
        };

        try {
            setLoading(true);
            const response = await api.post(
                "/master-cartons/",
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
                setCartonCode("");
                setCartonName("");
                setDescription("");
                setLength("");
                setWidth("");
                setHeight("");
                setMaxWeight("");
                setTareWeight("");
                setMaterial("");
                setIsDefault(false);
                setVolume(0);
                cartonCodeRef.current?.focus();
                fetchCartons();
            }
        } catch (error: any) {
            console.error("Error saving data:", error);
            const errorMessage =
                error.response?.data?.message || "Failed to register master carton";
            eventBus.emit("showAlert", {
                title: "Error!",
                description: errorMessage,
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (carton: MasterCarton) => {
        setSelectedCarton(carton);
        setEditCartonCode(carton.carton_code);
        setEditCartonName(carton.carton_name);
        setEditDescription(carton.description);
        setEditLength(carton.length.toString());
        setEditWidth(carton.width.toString());
        setEditHeight(carton.height.toString());
        setEditMaxWeight(carton.max_weight.toString());
        setEditTareWeight(carton.tare_weight.toString());
        setEditMaterial(carton.material);
        setEditIsDefault(carton.is_default);
        setEditVolume(carton.volume);
        setEditDialogOpen(true);
    };

    const handleUpdate = async () => {
        if (!editCartonCode.trim() || !editCartonName.trim() || !editLength || !editWidth || !editHeight) {
            eventBus.emit("showAlert", {
                title: "Error!",
                description: "Container Code, Container Name, and all dimensions are required",
                type: "error",
            });
            return;
        }

        const l = parseFloat(editLength);
        const w = parseFloat(editWidth);
        const h = parseFloat(editHeight);

        if (l <= 0 || w <= 0 || h <= 0) {
            eventBus.emit("showAlert", {
                title: "Error!",
                description: "Dimensions must be greater than 0",
                type: "error",
            });
            return;
        }

        const dataToUpdate = {
            carton_code: editCartonCode.toUpperCase(),
            carton_name: editCartonName,
            description: editDescription,
            length: l,
            width: w,
            height: h,
            max_weight: editMaxWeight ? parseFloat(editMaxWeight) : 0,
            tare_weight: editTareWeight ? parseFloat(editTareWeight) : 0,
            material: editMaterial,
            is_default: editIsDefault,
        };

        try {
            setEditLoading(true);
            const response = await api.put(
                `/master-cartons/${selectedCarton?.id}`,
                dataToUpdate,
                {
                    withCredentials: true,
                }
            );
            const data = await response.data;
            if (data.success) {
                eventBus.emit("showAlert", {
                    title: "Success!",
                    description: "Master Container updated successfully",
                    type: "success",
                });
                setEditDialogOpen(false);
                fetchCartons();
            }
        } catch (error: any) {
            console.error("Error updating data:", error);
            const errorMessage =
                error.response?.data?.message || "Failed to update master carton";
            eventBus.emit("showAlert", {
                title: "Error!",
                description: errorMessage,
                type: "error",
            });
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = (carton: MasterCarton) => {
        setSelectedCarton(carton);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await api.delete(
                `/master-cartons/${selectedCarton?.id}`,
                {
                    withCredentials: true,
                }
            );
            const data = await response.data;
            if (data.success) {
                eventBus.emit("showAlert", {
                    title: "Success!",
                    description: "Master Container deleted successfully",
                    type: "success",
                });
                setDeleteDialogOpen(false);
                fetchCartons();
            }
        } catch (error: any) {
            console.error("Error deleting data:", error);
            const errorMessage =
                error.response?.data?.message || "Failed to delete master carton";
            eventBus.emit("showAlert", {
                title: "Error!",
                description: errorMessage,
                type: "error",
            });
        }
    };

    // Pagination logic
    const totalPages = Math.ceil(filteredCartons.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentCartons = filteredCartons.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <>
            <PageHeader title="Master Container" showBackButton />
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
                            Register Container
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
                            Container List ({cartons.length})
                        </button>
                    </div>
                </div>

                {/* Register Tab */}
                {activeTab === "register" && (
                    <div className="p-4 space-y-4 pb-24 max-w-md mx-auto">
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">CARTON CODE *</label>
                                <div className="relative">
                                    <Input
                                        ref={cartonCodeRef}
                                        placeholder="Enter Container Code"
                                        value={cartonCode}
                                        onChange={(e) => setCartonCode(e.target.value.toUpperCase())}
                                        onKeyPress={(e) => handleKeyPress(e, cartonNameRef)}
                                    />
                                    {cartonCode && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCartonCode("");
                                                cartonCodeRef.current?.focus();
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">CARTON NAME *</label>
                                <div className="relative">
                                    <Input
                                        ref={cartonNameRef}
                                        placeholder="Enter Container Name"
                                        value={cartonName}
                                        onChange={(e) => setCartonName(e.target.value)}
                                        onKeyPress={(e) => handleKeyPress(e, descriptionRef)}
                                    />
                                    {cartonName && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCartonName("");
                                                cartonNameRef.current?.focus();
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">DESCRIPTION</label>
                                <div className="relative">
                                    <Input
                                        ref={descriptionRef}
                                        placeholder="Enter Description (Optional)"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        onKeyPress={(e) => handleKeyPress(e, lengthRef)}
                                    />
                                    {description && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDescription("");
                                                descriptionRef.current?.focus();
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">DIMENSIONS *</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-600">Length (cm)</label>
                                        <div className="relative">
                                            <Input
                                                ref={lengthRef}
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={length}
                                                onChange={(e) => setLength(e.target.value)}
                                                onKeyPress={(e) => handleKeyPress(e, widthRef)}
                                            />
                                            {length && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setLength("");
                                                        lengthRef.current?.focus();
                                                    }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-600">Width (cm)</label>
                                        <div className="relative">
                                            <Input
                                                ref={widthRef}
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={width}
                                                onChange={(e) => setWidth(e.target.value)}
                                                onKeyPress={(e) => handleKeyPress(e, heightRef)}
                                            />
                                            {width && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setWidth("");
                                                        widthRef.current?.focus();
                                                    }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-600">Height (cm)</label>
                                        <div className="relative">
                                            <Input
                                                ref={heightRef}
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={height}
                                                onChange={(e) => setHeight(e.target.value)}
                                                onKeyPress={(e) => handleKeyPress(e, maxWeightRef)}
                                            />
                                            {height && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setHeight("");
                                                        heightRef.current?.focus();
                                                    }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-5 w-5 text-blue-600" />
                                        <span className="text-sm font-medium text-gray-700">Volume</span>
                                    </div>
                                    <span className="text-lg font-bold text-blue-600">
                                        {volume.toFixed(2)} cm³
                                    </span>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">WEIGHT</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-600">Max Weight (kg)</label>
                                        <div className="relative">
                                            <Input
                                                ref={maxWeightRef}
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={maxWeight}
                                                onChange={(e) => setMaxWeight(e.target.value)}
                                                onKeyPress={(e) => handleKeyPress(e, tareWeightRef)}
                                            />
                                            {maxWeight && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setMaxWeight("");
                                                        maxWeightRef.current?.focus();
                                                    }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-600">Tare Weight (kg)</label>
                                        <div className="relative">
                                            <Input
                                                ref={tareWeightRef}
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={tareWeight}
                                                onChange={(e) => setTareWeight(e.target.value)}
                                                onKeyPress={(e) => handleKeyPress(e, materialRef)}
                                            />
                                            {tareWeight && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setTareWeight("");
                                                        tareWeightRef.current?.focus();
                                                    }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">MATERIAL</label>
                                <div className="relative">
                                    <Input
                                        ref={materialRef}
                                        placeholder="Enter Material (e.g., Cardboard, Plastic)"
                                        value={material}
                                        onChange={(e) => setMaterial(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                            }
                                        }}
                                    />
                                    {material && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMaterial("");
                                                materialRef.current?.focus();
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="isDefault"
                                    checked={isDefault}
                                    onChange={(e) => setIsDefault(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Set as Default Container
                                </label>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {loading ? "SAVING..." : "SAVE CARTON"}
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
                                    placeholder="Search by Container Code, Dimensions, or Volume..."
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

                        {/* Container List */}
                        {currentCartons.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg shadow">
                                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-500">
                                    {searchQuery
                                        ? "No cartons found matching your search"
                                        : "No cartons registered yet"}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {currentCartons.map((carton) => (
                                    <div
                                        key={carton.id}
                                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Package className="h-5 w-5 text-blue-600" />
                                                    <h3 className="font-semibold text-gray-900 text-lg">
                                                        {carton.carton_code}
                                                    </h3>
                                                    {carton.is_default && (
                                                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-medium text-gray-700">
                                                    {carton.carton_name}
                                                </p>
                                                {carton.description && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {carton.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(carton)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(carton)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="col-span-2 bg-gray-50 rounded-lg p-3">
                                                <span className="text-gray-500 block mb-1">Dimensions (L × W × H):</span>
                                                <p className="font-bold text-gray-900 text-lg">
                                                    {carton.length} × {carton.width} × {carton.height} cm
                                                </p>
                                            </div>
                                            <div className="bg-blue-50 rounded-lg p-3">
                                                <span className="text-gray-500 block mb-1">Volume:</span>
                                                <p className="font-bold text-blue-600 text-base">
                                                    {carton.volume.toFixed(2)} cm³
                                                </p>
                                            </div>
                                            <div className="bg-purple-50 rounded-lg p-3">
                                                <span className="text-gray-500 block mb-1">Max Weight:</span>
                                                <p className="font-bold text-purple-600 text-base">
                                                    {carton.max_weight > 0 ? `${carton.max_weight} kg` : 'N/A'}
                                                </p>
                                            </div>
                                            <div className="bg-amber-50 rounded-lg p-3">
                                                <span className="text-gray-500 block mb-1">Tare Weight:</span>
                                                <p className="font-medium text-gray-900">
                                                    {carton.tare_weight > 0 ? `${carton.tare_weight} kg` : 'N/A'}
                                                </p>
                                            </div>
                                            <div className="bg-green-50 rounded-lg p-3">
                                                <span className="text-gray-500 block mb-1">Material:</span>
                                                <p className="font-medium text-gray-900">
                                                    {carton.material || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <span className="text-xs text-gray-500">
                                                Created: {new Date(carton.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </span>
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
                        <DialogTitle>Edit Master Container</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto flex-1 px-6 py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">CARTON CODE *</label>
                                <Input
                                    placeholder="Enter Container Code"
                                    value={editCartonCode}
                                    onChange={(e) => setEditCartonCode(e.target.value.toUpperCase())}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">CARTON NAME *</label>
                                <Input
                                    placeholder="Enter Container Name"
                                    value={editCartonName}
                                    onChange={(e) => setEditCartonName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">DESCRIPTION</label>
                                <Input
                                    placeholder="Enter Description (Optional)"
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                />
                            </div>

                            <div className="border-t pt-3">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">DIMENSIONS *</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-600">Length (cm)</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={editLength}
                                            onChange={(e) => setEditLength(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-600">Width (cm)</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={editWidth}
                                            onChange={(e) => setEditWidth(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-600">Height (cm)</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={editHeight}
                                            onChange={(e) => setEditHeight(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-5 w-5 text-blue-600" />
                                        <span className="text-sm font-medium text-gray-700">Volume</span>
                                    </div>
                                    <span className="text-lg font-bold text-blue-600">
                                        {editVolume.toFixed(2)} cm³
                                    </span>
                                </div>
                            </div>

                            <div className="border-t pt-3">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">WEIGHT</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-600">Max Weight (kg)</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={editMaxWeight}
                                            onChange={(e) => setEditMaxWeight(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-600">Tare Weight (kg)</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={editTareWeight}
                                            onChange={(e) => setEditTareWeight(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">MATERIAL</label>
                                <Input
                                    placeholder="Enter Material"
                                    value={editMaterial}
                                    onChange={(e) => setEditMaterial(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="editIsDefault"
                                    checked={editIsDefault}
                                    onChange={(e) => setEditIsDefault(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="editIsDefault" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Set as Default Container
                                </label>
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
                                "Update Container"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-slate-50">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Master Container</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4">
                            <span className="block">Are you sure you want to delete this master carton?</span>
                            <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-blue-600" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 break-words">{selectedCarton?.carton_code}</p>
                                        <p className="text-sm text-gray-600">{selectedCarton?.carton_name}</p>
                                    </div>
                                    {selectedCarton?.is_default && (
                                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                            Default
                                        </span>
                                    )}
                                </div>
                                {selectedCarton?.description && (
                                    <p className="text-xs text-gray-500 italic">{selectedCarton.description}</p>
                                )}
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                                    <div>
                                        <p className="text-xs text-gray-500">Dimensions:</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedCarton?.length} × {selectedCarton?.width} × {selectedCarton?.height} cm
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Volume:</p>
                                        <p className="text-sm font-medium text-blue-600">
                                            {selectedCarton?.volume.toFixed(2)} cm³
                                        </p>
                                    </div>
                                    {selectedCarton && selectedCarton.max_weight > 0 && (
                                        <div>
                                            <p className="text-xs text-gray-500">Max Weight:</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {selectedCarton.max_weight} kg
                                            </p>
                                        </div>
                                    )}
                                    {selectedCarton?.material && (
                                        <div>
                                            <p className="text-xs text-gray-500">Material:</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {selectedCarton.material}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span className="block text-sm text-red-600 font-medium">
                                ⚠️ This action cannot be undone.
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