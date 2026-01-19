/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import PageHeader from "@/components/mobile/PageHeader";
import { Input } from "@/components/ui/input";
import { Loader2, X } from "lucide-react";
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

export default function RegisterProductPage() {
    const [ownerCode, setOwnerCode] = useState("");
    const [sku, setSku] = useState("");
    const [unitModel, setUnitModel] = useState("");
    const [ean, setEan] = useState("");
    const [uom, setUom] = useState("");
    const [loading, setLoading] = useState(false);
    const [owners, setOwners] = useState<Owner[]>([]);
    const [uoms, setUoms] = useState<Uom[]>([]);

    const skuRef = useRef<HTMLInputElement>(null);
    const unitModelRef = useRef<HTMLInputElement>(null);
    const eanRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchOwners();
        fetchUoms();
    }, []);

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

    return (
        <>
            <PageHeader title="Register New Product" showBackButton />
            <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-24 max-w-md mx-auto">
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
                                        {owner.code}
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
        </>
    );
}