/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { mutate } from "swr";
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MasterCarton } from "@/types/master-carton";

export default function MasterCartonForm({ editData, setEditData }) {
    const [carton, setCarton] = useState<MasterCarton>({
        id: 0,
        carton_code: "",
        carton_name: "",
        description: "",
        length: 0,
        width: 0,
        height: 0,
        max_weight: 0,
        tare_weight: 0,
        volume: 0,
        is_default: false,
        material: "",
    });
    const [error, setError] = useState<string | null>(null);

    // Calculate volume automatically when dimensions change
    useEffect(() => {
        const calculatedVolume = carton.length * carton.width * carton.height;
        setCarton((prev) => ({ ...prev, volume: calculatedVolume }));
    }, [carton.length, carton.width, carton.height]);

    // Fill form with edit data
    useEffect(() => {
        if (editData) {
            setCarton(editData);
        }
    }, [editData]);

    async function handleSubmit(e) {
        e.preventDefault();

        // Form validation
        if (
            carton.carton_code.trim() === "" ||
            carton.carton_name.trim() === "" ||
            carton.length <= 0 ||
            carton.width <= 0 ||
            carton.height <= 0
        ) {
            setError("Please fill all required fields with valid values.");
            return;
        }

        try {
            setError(null);

            if (editData) {
                // Update carton
                await api.put(`/master-cartons/${editData.id}`, carton);
            } else {
                // Create new carton
                await api.post("/master-cartons", carton);
            }

            mutate("/master-cartons"); // Refresh table
            setEditData(null);
            setCarton({
                id: 0,
                carton_code: "",
                carton_name: "",
                description: "",
                length: 0,
                width: 0,
                height: 0,
                max_weight: 0,
                tare_weight: 0,
                volume: 0,
                is_default: false,
                material: "",
            });
            setError(null);
            document.getElementById("carton_code")?.focus();
        } catch (err: any) {
            if (err.response) {
                if (err.response.status === 400) {
                    setError("Data yang dimasukkan tidak valid.");
                } else {
                    setError("Terjadi kesalahan, coba lagi nanti.");
                }
            } else {
                setError("Tidak ada respon dari server.");
            }
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault(); // Prevent default to avoid unwanted submission
        }
    };

    const handleCancel = () => {
        setError(null);
        setEditData(null);
        setCarton({
            id: 0,
            carton_code: "",
            carton_name: "",
            description: "",
            length: 0,
            width: 0,
            height: 0,
            max_weight: 0,
            tare_weight: 0,
            volume: 0,
            is_default: false,
            material: "",
        });
        document.getElementById("carton_code")?.focus();
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>
                    {editData ? "Edit Master Carton" : "Add Master Carton"}
                </CardTitle>
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
                    <div className="grid w-full items-center gap-4">
                        {/* Carton Code */}
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="carton_code">
                                Carton Code <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="carton_code"
                                value={carton.carton_code}
                                onChange={(e) =>
                                    setCarton({ ...carton, carton_code: e.target.value.toUpperCase() })
                                }
                                placeholder="e.g., CTN-001"
                            />
                        </div>

                        {/* Carton Name */}
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="carton_name">
                                Carton Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="carton_name"
                                value={carton.carton_name}
                                onChange={(e) =>
                                    setCarton({ ...carton, carton_name: e.target.value })
                                }
                                placeholder="e.g., Small Box"
                            />
                        </div>

                        {/* Description */}
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={carton.description}
                                onChange={(e) =>
                                    setCarton({ ...carton, description: e.target.value })
                                }
                                placeholder="Optional description"
                                rows={3}
                            />
                        </div>

                        {/* Dimensions */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="length">
                                    Length (cm) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="length"
                                    type="number"
                                    step="0.01"
                                    value={carton.length || ""}
                                    onChange={(e) =>
                                        setCarton({ ...carton, length: parseFloat(e.target.value) || 0 })
                                    }
                                    placeholder="0"
                                />
                            </div>

                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="width">
                                    Width (cm) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="width"
                                    type="number"
                                    step="0.01"
                                    value={carton.width || ""}
                                    onChange={(e) =>
                                        setCarton({ ...carton, width: parseFloat(e.target.value) || 0 })
                                    }
                                    placeholder="0"
                                />
                            </div>

                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="height">
                                    Height (cm) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="height"
                                    type="number"
                                    step="0.01"
                                    value={carton.height || ""}
                                    onChange={(e) =>
                                        setCarton({ ...carton, height: parseFloat(e.target.value) || 0 })
                                    }
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Volume (Auto-calculated, read-only) */}
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="volume">Volume (cm³)</Label>
                            <Input
                                id="volume"
                                type="number"
                                value={carton.volume.toFixed(2)}
                                readOnly
                                disabled
                                className="bg-gray-100"
                            />
                        </div>

                        {/* Weights */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="max_weight">Max Weight (kg)</Label>
                                <Input
                                    id="max_weight"
                                    type="number"
                                    step="0.01"
                                    value={carton.max_weight || ""}
                                    onChange={(e) =>
                                        setCarton({ ...carton, max_weight: parseFloat(e.target.value) || 0 })
                                    }
                                    placeholder="0"
                                />
                            </div>

                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="tare_weight">Tare Weight (kg)</Label>
                                <Input
                                    id="tare_weight"
                                    type="number"
                                    step="0.01"
                                    value={carton.tare_weight || ""}
                                    onChange={(e) =>
                                        setCarton({ ...carton, tare_weight: parseFloat(e.target.value) || 0 })
                                    }
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Material */}
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="material">Material</Label>
                            <Input
                                id="material"
                                value={carton.material}
                                onChange={(e) =>
                                    setCarton({ ...carton, material: e.target.value })
                                }
                                placeholder="e.g., Cardboard, Plastic"
                            />
                        </div>

                        {/* Is Default */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_default"
                                checked={carton.is_default}
                                onCheckedChange={(checked) =>
                                    setCarton({ ...carton, is_default: checked as boolean })
                                }
                            />
                            <Label htmlFor="is_default" className="cursor-pointer">
                                Set as default carton
                            </Label>
                        </div>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleCancel}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} type="submit">
                    {editData ? "Update" : "Add"}
                </Button>
            </CardFooter>
        </Card>
    );
}