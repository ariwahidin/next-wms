// components/ExportSupplierModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { utils, writeFile } from "xlsx";
import { toast } from "sonner";

interface ExportSupplierModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface Supplier {
    ID: number;
    supplier_code: string;
    supplier_name: string;
    owner_code: string;
    supp_addr1: string;
    supp_city: string;
    supp_country: string;
    supp_phone: string;
    supp_email: string;
    is_active: boolean;
    CreatedAt: string;
}

export default function ExportSupplierModal({
    open,
    onOpenChange,
}: ExportSupplierModalProps) {
    const [ownerCodes, setOwnerCodes] = useState<string[]>([]);
    const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingOwners, setFetchingOwners] = useState(false);
    const [selectAll, setSelectAll] = useState(false);

    // Fetch owner codes when modal opens
    useEffect(() => {
        if (open) {
            fetchOwnerCodes();
        } else {
            // Reset state when modal closes
            setSelectedOwners([]);
            setSelectAll(false);
        }
    }, [open]);

    const fetchOwnerCodes = async () => {
        setFetchingOwners(true);
        try {
            const response = await api.get("/suppliers/owner-codes", {
                withCredentials: true,
            });
            if (response.data.success) {
                setOwnerCodes(response.data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch owner codes:", error);
            toast.error("Failed to load owner codes");
        } finally {
            setFetchingOwners(false);
        }
    };

    const handleOwnerToggle = (ownerCode: string) => {
        setSelectedOwners((prev) =>
            prev.includes(ownerCode)
                ? prev.filter((code) => code !== ownerCode)
                : [...prev, ownerCode]
        );
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedOwners([]);
        } else {
            setSelectedOwners([...ownerCodes]);
        }
        setSelectAll(!selectAll);
    };

    useEffect(() => {
        setSelectAll(
            ownerCodes.length > 0 && selectedOwners.length === ownerCodes.length
        );
    }, [selectedOwners, ownerCodes]);

    const handleExport = async () => {
        if (selectedOwners.length === 0) {
            toast.error("Please select at least one owner");
            return;
        }

        setLoading(true);
        try {
            const response = await api.post(
                "/suppliers/export",
                { owner_codes: selectedOwners },
                { withCredentials: true }
            );

            if (response.data.success) {
                const suppliers: Supplier[] = response.data.data;

                if (suppliers.length === 0) {
                    toast.error("No data found for selected owners");
                    return;
                }

                // Prepare data for Excel
                const exportData = suppliers.map((supplier, index) => ({
                    No: index + 1,
                    "Owner Code": supplier.owner_code,
                    "Supplier Code": supplier.supplier_code,
                    "Supplier Name": supplier.supplier_name,
                    Address: supplier.supp_addr1,
                    City: supplier.supp_city,
                    Country: supplier.supp_country,
                    Phone: supplier.supp_phone,
                    Email: supplier.supp_email,
                    Status: supplier.is_active ? "Active" : "Inactive",
                    "Created At": new Date(supplier.CreatedAt).toLocaleString("id-ID"),
                }));

                // Create workbook and worksheet
                const ws = utils.json_to_sheet(exportData);

                // Set column widths
                const colWidths = [
                    { wch: 5 },  // No
                    { wch: 12 }, // Owner Code
                    { wch: 15 }, // Supplier Code
                    { wch: 30 }, // Supplier Name
                    { wch: 35 }, // Address
                    { wch: 15 }, // City
                    { wch: 15 }, // Country
                    { wch: 15 }, // Phone
                    { wch: 25 }, // Email
                    { wch: 10 }, // Status
                    { wch: 20 }, // Created At
                ];
                ws["!cols"] = colWidths;

                const wb = utils.book_new();
                utils.book_append_sheet(wb, ws, "Suppliers");

                // Generate filename with timestamp
                const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
                const filename = `Suppliers_Export_${timestamp}.xlsx`;

                // Download file
                writeFile(wb, filename);

                toast.success(`Successfully exported ${suppliers.length} suppliers`);
                onOpenChange(false);
            }
        } catch (error) {
            console.error("Failed to export suppliers:", error);
            toast.error("Failed to export data");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Export Suppliers to Excel
                    </DialogTitle>
                    <DialogDescription>
                        Select owner codes to export. You can select multiple owners.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {fetchingOwners ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : ownerCodes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No owner codes found
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-3 pb-3 border-b">
                                <Label className="text-sm font-medium">Owner Codes</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSelectAll}
                                    className="h-8"
                                >
                                    {selectAll ? "Deselect All" : "Select All"}
                                </Button>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto space-y-3 px-1">
                                {ownerCodes.map((ownerCode) => (
                                    <div
                                        key={ownerCode}
                                        className="flex items-center space-x-3 hover:bg-accent rounded-md p-2 transition-colors"
                                    >
                                        <Checkbox
                                            id={`owner-${ownerCode}`}
                                            checked={selectedOwners.includes(ownerCode)}
                                            onCheckedChange={() => handleOwnerToggle(ownerCode)}
                                        />
                                        <Label
                                            htmlFor={`owner-${ownerCode}`}
                                            className="flex-1 cursor-pointer font-normal"
                                        >
                                            {ownerCode}
                                        </Label>
                                    </div>
                                ))}
                            </div>

                            {selectedOwners.length > 0 && (
                                <div className="mt-4 pt-3 border-t">
                                    <p className="text-sm text-muted-foreground">
                                        Selected: <span className="font-medium text-foreground">{selectedOwners.length}</span> owner
                                        {selectedOwners.length !== 1 && "s"}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleExport}
                        disabled={loading || selectedOwners.length === 0}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Export Excel
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}