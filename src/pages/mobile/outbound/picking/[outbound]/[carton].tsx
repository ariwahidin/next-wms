/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useRouter } from "next/router";
import { use, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import PageHeader from "@/components/mobile/PageHeader";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Box, List, Loader2, Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { XCircle } from "lucide-react";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";
import { set } from "date-fns";
import { InventoryPolicy } from "@/types/inventory";
import { is, tr } from "date-fns/locale";

// Types
interface ScanItem {
    carton_id?: number | null;
    carton_code?: string | null;
    scan_type?: string;
    outbound_no: string;
    barcode: string;
    serial_no?: string;
    qty?: number;
    seq_box?: number;
    location?: string;
    uom?: string;
    packing_no?: string;
    pack_ctn_no?: string;
}

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
    dimensions: string;
    display_name: string;
}

interface OutboundDetail {
    id: number;
    outbound_no: string;
    outbound_detail_id: number;
    item_code: string;
    barcode: string;
    quantity: number;
    scan_qty?: number;
    has_serial?: string;
    uom?: string;
    owner_code?: string;
    is_serial?: boolean;
}

interface ScannedItem {
    id?: number;
    outbound_detail_id: number;
    barcode: string;
    serial_number: string;
    serial_number_2?: string;
    pallet: string;
    location: string;
    seq_box: number;
    qa_status: string;
    whs_code: string;
    scan_type: string;
    quantity: number;
    location_scan?: string;
    status?: string;
    barcode_data_scan?: string;
    qty_data_scan?: number;
    uom_scan?: string;
    is_serial?: boolean;
    packing_no?: string;
    pack_ctn_no?: string;
}

const CheckingPage = () => {
    const router = useRouter();
    // const { outbound, carton } = router.query;
    const { outbound, carton, master_carton_id } = router.query;

    const [scanUom, setScanUom] = useState("");
    const [scanQa, setScanQa] = useState("A");
    const [scanType, setScanType] = useState("SERIAL");
    const [scanWhs, setScanWhs] = useState("CKY");
    const [scanLocation, setScanLocation] = useState("");
    const [scanBarcode, setScanBarcode] = useState("");
    const [packingNo, setPackingNo] = useState("");
    const [packCtnNo, setPackCtnNo] = useState("");
    const [scanSerial, setScanSerial] = useState("");

    const [searchOutboundDetail, setSearchOutboundDetail] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showModalDetail, setShowModalDetail] = useState(false);
    const [seqBox, setSeqBox] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isSerial, setIsSerial] = useState<boolean>(false);
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const [serialInputs, setSerialInputs] = useState([""]);
    const [scanQty, setScanQty] = useState<string | number>(1);

    // New states for carton filtering
    const [selectedCarton, setSelectedCarton] = useState<string | "all">("all");
    const [showDeleteCartonConfirm, setShowDeleteCartonConfirm] = useState(false);
    const [cartonToDelete, setCartonToDelete] = useState<string>("");

    // States for Seal Container
    const [showSealContainerDialog, setShowSealContainerDialog] = useState(false);
    const [showConfirmSealContainer, setShowConfirmSealContainer] = useState(false);
    const [containerWeight, setContainerWeight] = useState<string>("");
    const [isSealingContainer, setIsSealingContainer] = useState(false);

    const [listOutboundDetail, setListOutboundDetail] = useState<
        OutboundDetail[]
    >([]);

    const [listOutboundScanned, setListOutboundScanned] = useState<ScannedItem[]>(
        []
    );

    const [isSubmit, setIsSubmit] = useState(false);
    const [invPolicy, setInvPolicy] = useState<InventoryPolicy>();

    const [showAllOutboundDetail, setShowAllOutboundDetail] = useState(true);
    const [originalListOutboundDetail, setOriginalListOutboundDetail] = useState<
        OutboundDetail[]
    >([]);
    // const [masterCarton, setMasterCarton] = useState<MasterCarton | null>(null);

    // State untuk master carton
    const [masterCarton, setMasterCarton] = useState<MasterCarton | null>(null);
    const [isLoadingMasterCarton, setIsLoadingMasterCarton] = useState(false);

    // States for List Container
    const [showListContainerDialog, setShowListContainerDialog] = useState(false);


    // State untuk edit carton
    const [showEditCartonDialog, setShowEditCartonDialog] = useState(false);
    const [showConfirmUpdateCarton, setShowConfirmUpdateCarton] = useState(false);

    const [masterCartonsList, setMasterCartonsList] = useState<MasterCarton[]>([]);
    const [selectedNewCartonId, setSelectedNewCartonId] = useState<string>("");
    const [isUpdatingCarton, setIsUpdatingCarton] = useState(false);
    const [listContainerSummary, setListContainerSummary] = useState([]);

    const [isCreatingCarton, setIsCreatingCarton] = useState(false);

    const handleNewCarton = async () => {
        if (isCreatingCarton) return;
        setIsCreatingCarton(true);

        try {
            const response = await api.get(
                `/mobile/outbound/picking/${outbound}/cartons/next`,
                { withCredentials: true }
            );

            if (response.data.success) {
                const next = response.data.next_ctn_no.toString();
                setPackCtnNo(next);
                eventBus.emit("showAlert", {
                    title: "Success!",
                    description: `Moved to Carton #${next}`,
                    type: "success",
                });
            }
        } catch (error) {
            console.error("Error creating new carton:", error);
            eventBus.emit("showAlert", {
                title: "Error!",
                description: "Failed to create new carton",
                type: "error",
            });
        } finally {
            setIsCreatingCarton(false);
        }
    };

    // Fetch master carton details
    useEffect(() => {
        if (master_carton_id) {
            fetchMasterCartonDetails(master_carton_id as string);
        }
    }, [master_carton_id]);

    const fetchMasterCartonDetails = async (id: string) => {
        try {
            setIsLoadingMasterCarton(true);
            const response = await api.get(`/mobile/outbound/master-cartons/${id}`, {
                withCredentials: true,
            });

            if (response.data.success) {
                setMasterCarton(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching master carton:", error);
            eventBus.emit("showAlert", {
                title: "Warning",
                description: "Failed to load carton information",
                type: "error",
            });
        } finally {
            setIsLoadingMasterCarton(false);
        }
    };


    const handleScan = async () => {

        if (!scanBarcode.trim() || serialInputs.length === 0) return;

        const serialNumber =
            serialInputs.length > 1
                ? serialInputs.filter((s) => s.trim() !== "").join("-")
                : serialInputs[0].trim();

        const newItem: ScanItem = {
            carton_id: masterCarton?.id || null,
            carton_code: masterCarton?.carton_code || null,
            outbound_no: Array.isArray(outbound) ? outbound[0] : outbound,
            location: scanLocation,
            barcode: scanBarcode,
            serial_no: serialNumber,
            qty: scanQty as number,
            uom: scanUom,
            packing_no: packingNo,
            pack_ctn_no: packCtnNo === "" ? null : packCtnNo
        };

        console.log("New item:", newItem);
        setIsLoading(true);
        if (!isSubmit) {
            setIsSubmit(true);
            try {
                const response = await api.post(
                    "/mobile/outbound/picking/scan/" + outbound,
                    newItem
                );
                const data = await response.data;
                setIsLoading(false);
                if (data.success) {
                    eventBus.emit("showAlert", {
                        title: "Success!",
                        description: data.message,
                        type: "success",
                    });
                    fetchOutboundDetail();
                    closeDialog();
                }
            } catch (error) {
                console.error("Error during scan:", error);
                setIsLoading(false);
                setIsSubmit(false);
            } finally {
                setIsLoading(false);
                setIsSubmit(false);
            }
        }
    };

    const fetchPolicy = async (owner: string) => {
        try {
            const response = await api.get("/inventory/policy?owner=" + owner);
            const data = await response.data;
            if (data.success) {
                setInvPolicy(data.data.inventory_policy);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        if (listOutboundDetail.length > 0) fetchPolicy(listOutboundDetail[0].owner_code!);
    }, [listOutboundDetail]);

    const fetchOutboundDetail = async () => {
        const response = await api.get("/mobile/outbound/detail/" + outbound, {
            withCredentials: true,
        });
        const data = await response.data;
        if (data.success) {
            const filtered = data.data.map((item: any) => ({
                outbound_detail_id: item.outbound_detail_id,
                item_code: item.item_code,
                barcode: item.barcode,
                quantity: item.quantity,
                scan_qty: item.scan_qty,
                has_serial: item.has_serial,
                uom: item.uom,
                owner_code: item.owner_code,
                is_serial: item.is_serial,
            }));
            setOriginalListOutboundDetail(filtered);
        }
    };

    const fetchScannedItems = async (id?: number) => {
        console.log("ID Inbound Detail:", id);

        const response = await api.get("/mobile/outbound/picking/scan/" + id, {
            withCredentials: true,
        });
        const data = await response.data;
        if (data.success) {
            const filtered = data.data.map((item: any) => ({
                id: item.ID,
                outbound_detail_id: item.outbound_detail_id,
                barcode: item.barcode,
                serial_number: item.serial_number,
                serial_number_2: item.serial_number_2,
                pallet: item.pallet,
                location: item.location,
                seq_box: item.seq_box,
                qa_status: item.qa_status,
                whs_code: item.whs_code,
                scan_type: item.scan_type,
                quantity: item.quantity,
                status: item.status,
                barcode_data_scan: item.barcode_data_scan,
                location_scan: item.location_scan,
                qty_data_scan: item.qty_data_scan,
                uom_scan: item.uom_scan,
                is_serial: item.is_serial,
                packing_no: item.packing_no,
                pack_ctn_no: item.pack_ctn_no
            }));

            setListOutboundScanned(filtered);
            // Reset selected carton when fetching new data
            setSelectedCarton("all");
        }
    };

    const handleRemoveItem = async (
        index: number,
        outbound_detail_id: number
    ) => {

        if (!isSubmit) {
            setIsSubmit(true);
            try {
                const response = await api.delete(
                    "/mobile/outbound/picking/scan/" + index,
                    {
                        withCredentials: true,
                    }
                );
                const data = await response.data;
                if (data.success) {
                    fetchScannedItems(outbound_detail_id);
                    fetchOutboundDetail();
                    eventBus.emit("showAlert", {
                        title: "Success!",
                        description: "Item deleted successfully",
                        type: "success",
                    });
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsSubmit(false);
            }
        }
    };

    // New function to delete entire carton
    const handleRemoveCarton = async (cartonNo: string, outbound_detail_id: number) => {
        if (!isSubmit) {
            setIsSubmit(true);
            try {
                // Get all items with this carton number
                const itemsToDelete = listOutboundScanned.filter(
                    item => item.pack_ctn_no === cartonNo
                );

                // Delete all items in the carton
                for (const item of itemsToDelete) {
                    await api.delete(
                        "/mobile/outbound/picking/scan/" + item.id,
                        {
                            withCredentials: true,
                        }
                    );
                }

                fetchScannedItems(outbound_detail_id);
                fetchOutboundDetail();
                setShowDeleteCartonConfirm(false);
                setCartonToDelete("");
                eventBus.emit("showAlert", {
                    title: "Success!",
                    description: `Carton ${cartonNo} deleted successfully`,
                    type: "success",
                });
            } catch (error) {
                console.error("Error deleting carton:", error);
                eventBus.emit("showAlert", {
                    title: "Error!",
                    description: "Failed to delete container",
                    type: "error",
                });
            } finally {
                setIsSubmit(false);
            }
        }
    };

    // Handle Seal Container
    const handleSealContainer = () => {
        // if (!packCtnNo) {
        //     eventBus.emit("showAlert", {
        //         title: "Warning",
        //         description: "No container number found",
        //         type: "error",
        //     });
        //     return;
        // }

        // // Check if there are items in this container
        // const containerItems = listOutboundScanned.filter(
        //     item => item.pack_ctn_no === packCtnNo
        // );

        // if (containerItems.length === 0) {
        //     eventBus.emit("showAlert", {
        //         title: "Warning",
        //         description: "No items found in this container",
        //         type: "error",
        //     });
        //     return;
        // }

        setContainerWeight("");
        setShowSealContainerDialog(true);
    };

    const handleConfirmSeal = () => {
        if (!containerWeight || parseFloat(containerWeight) <= 0) {
            eventBus.emit("showAlert", {
                title: "Warning",
                description: "Please enter a valid weight",
                type: "error",
            });
            return;
        }

        setShowSealContainerDialog(false);
        setShowConfirmSealContainer(true);
    };

    const handleSealContainerSubmit = async () => {
        setIsSealingContainer(true);

        try {
            const payload = {
                outbound_no: Array.isArray(outbound) ? outbound[0] : outbound,
                packing_no: packingNo,
                ctn_no: packCtnNo,
                weight: parseFloat(containerWeight)
            };

            const response = await api.post(
                "/mobile/outbound/picking/seal-container/" + outbound,
                payload,
                { withCredentials: true }
            );

            if (response.data.success) {
                setShowConfirmSealContainer(false);
                setContainerWeight("");

                eventBus.emit("showAlert", {
                    title: "Success!",
                    description: `Container ${packCtnNo} sealed successfully`,
                    type: "success",
                });

                // Optionally redirect or refresh data
                // router.back();
            }
        } catch (error: any) {
            console.error("Error sealing container:", error);
            eventBus.emit("showAlert", {
                title: "Error!",
                description: error.response?.data?.message || "Failed to seal container",
                type: "error",
            });
        } finally {
            setIsSealingContainer(false);
        }
    };

    const filteredItems =
        listOutboundDetail.filter(
            (item) =>
                item?.item_code
                    .toLowerCase()
                    .includes(searchOutboundDetail.toLowerCase()) ||
                item?.barcode
                    .toLowerCase()
                    .includes(searchOutboundDetail.toLowerCase()) ||
                item?.quantity
                    .toString()
                    .includes(searchOutboundDetail.toLowerCase()) ||
                item?.scan_qty.toString().includes(searchOutboundDetail.toLowerCase())
        ) || [];

    // Filter scanned items by search term AND selected carton
    const filteredScannedItems =
        listOutboundScanned.filter(
            (item) => {
                // Search term filter
                const matchesSearch =
                    item?.id.toString().includes(searchTerm.toLowerCase()) ||
                    item?.outbound_detail_id
                        .toString()
                        .includes(searchTerm.toLowerCase()) ||
                    item?.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item?.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item?.location.toLowerCase().includes(searchTerm.toLowerCase());

                // Carton filter
                const matchesCarton =
                    selectedCarton === "all" ||
                    item?.pack_ctn_no === selectedCarton;

                return matchesSearch && matchesCarton;
            }
        ) || [];

    // Get unique carton numbers for the filter dropdown
    const uniqueCartons = Array.from(
        new Set(
            listOutboundScanned
                .map(item => item.pack_ctn_no)
                .filter(carton => carton && carton !== "")
        )
    ).sort();

    const groupedItems = filteredScannedItems.reduce<
        Record<number, ScannedItem[]>
    >((groups, item) => {
        const { seq_box } = item;
        if (!groups[seq_box]) {
            groups[seq_box] = [];
        }
        groups[seq_box].push(item);
        return groups;
    }, {});

    useEffect(() => {
        if (outbound) fetchOutboundDetail();
        if (carton) {
            setPackCtnNo(carton as string);
            setPackingNo(outbound as string);
        };
    }, [outbound, carton]);

    useEffect(() => {
        const filtered = originalListOutboundDetail.filter((item) => item.quantity != item.scan_qty);
        if (!showAllOutboundDetail) {
            setListOutboundDetail(filtered);
        } else {
            setListOutboundDetail(originalListOutboundDetail);
        }
    }, [originalListOutboundDetail, showAllOutboundDetail]);

    const handleBarcodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Barcode submitted:");

        if (scanBarcode.trim() === "") {
            document.getElementById("barcode")?.focus();
            return;
        }

        const newItem: ScanItem = {
            outbound_no: Array.isArray(outbound) ? outbound[0] : outbound,
            barcode: scanBarcode,
            qty: scanQty as number,
        };

        setIsLoading(true);
        setIsSubmit(true);

        if (!isSubmit) {
            try {
                const response = await api.post(
                    "/mobile/outbound/item-check/" + outbound,
                    newItem
                );
                const res = await response.data;

                if (res.success) {
                    setIsLoading(false);
                    if (res.is_serial) {
                        console.log("Item requires serial:", res);
                        setIsSerial(res.is_serial);
                        setScanSerial("");
                        setShowDialog(true);
                        setTimeout(() => {
                            if (serialInputs.length === 1) {
                                console.log("focus serial 0");
                                document.getElementById("serial-0")?.focus();
                            }
                        }, 100);
                    } else {
                        setIsSerial(res.is_serial);
                        setScanUom(res.data.uom.from_uom);
                        setScanSerial("");
                        if (invPolicy.picking_single_scan) {
                            handleScan();
                        } else {
                            setShowDialog(true);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
                setIsSubmit(false);
            }
        }
    };

    const closeDialog = () => {
        setShowDialog(false);
        const newSerials = serialInputs.map(() => "");
        setSerialInputs(newSerials);
        setScanBarcode("");
        setScanQty(1);
        document.getElementById("barcode")?.focus();
    };

    const handleSerialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const emptyIndex = serialInputs.findIndex((s) => s.trim() === "");

        if (emptyIndex !== -1) {
            const target = document.getElementById(`serial-${emptyIndex}`);
            target?.focus();
            return;
        }

        console.log("Submit:", serialInputs);
        handleScan();
    };

    const handleQuantitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Quantity submitted:", scanQty);
        handleScan();
    };

    const handleEditCarton = () => {
        setShowEditCartonDialog(true);
    };

    const handleUpdateCarton = () => {
        if (!selectedNewCartonId) {
            eventBus.emit("showAlert", {
                title: "Warning",
                description: "Please select a carton type",
                type: "error",
            });
            return;
        }

        // Jika carton yang dipilih sama dengan yang sekarang
        if (selectedNewCartonId === masterCarton?.id.toString()) {
            setShowEditCartonDialog(false);
            return;
        }

        // Show confirmation dialog
        setShowConfirmUpdateCarton(true);
    };

    const handleConfirmUpdateCarton = async () => {
        setIsUpdatingCarton(true);

        try {
            // Update all scanned items with new carton
            const response = await api.put(
                `/mobile/outbound/picking/update-carton/${outbound}`,
                {
                    pack_ctn_no: packCtnNo,
                    new_carton_id: parseInt(selectedNewCartonId),
                    outbound_no: outbound
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                // Fetch new carton details
                await fetchMasterCartonDetails(selectedNewCartonId);

                // Update URL with new master_carton_id
                router.replace({
                    pathname: router.pathname,
                    query: {
                        ...router.query,
                        master_carton_id: selectedNewCartonId,
                    },
                }, undefined, { shallow: true });

                setShowEditCartonDialog(false);
                setShowConfirmUpdateCarton(false);

                eventBus.emit("showAlert", {
                    title: "Success!",
                    description: "Carton type updated successfully",
                    type: "success",
                });
            }
        } catch (error: any) {
            console.error("Error updating carton:", error);
            eventBus.emit("showAlert", {
                title: "Error!",
                description: error.response?.data?.message || "Failed to update carton type",
                type: "error",
            });
        } finally {
            setIsUpdatingCarton(false);
        }
    };

    const getSelectedNewCartonDetails = () => {
        if (!selectedNewCartonId) return null;
        return masterCartonsList.find((c) => c.id.toString() === selectedNewCartonId);
    };

    // Fetch all master cartons for edit dialog
    useEffect(() => {
        fetchAllMasterCartons();
    }, []);

    const fetchAllMasterCartons = async () => {
        try {
            const response = await api.get("/mobile/outbound/master-cartons", {
                withCredentials: true,
            });

            if (response.data.success) {
                setMasterCartonsList(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching master cartons list:", error);
        }
    };


    const fetchCartonByOutboundNo = async () => {
        try {
            const response = await api.get(`/mobile/outbound/${outbound}/cartons`, {
                withCredentials: true,
            });

            const response2 = await api.get(`/mobile/outbound/${outbound}/cartons/items`, {
                withCredentials: true,
            });

            if (response.data.success && response2.data.success) {
                const cartons = response.data.data.cartons;
                const items = response2.data.data.cartons;

                cartons.forEach((carton) => {
                    carton.items = items.filter((item) => item.pack_ctn_no === carton.pack_ctn_no).map((item) => `${item.barcode} -> ${item.total_qty}`);
                })

                setListContainerSummary(cartons)
            }
        } catch (error) {
            console.error("Error fetching carton by outbound no:", error);
        } finally {
            // setIsLoadingMasterCarton(false);
        }
    }

    useEffect(() => {
        if (showListContainerDialog) {
            fetchCartonByOutboundNo();
        }

    }, [showListContainerDialog])

    return (
        <>
            <PageHeader title={`${outbound}`} showBackButton />
            <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-40 max-w-md mx-auto">
                <form onSubmit={handleBarcodeSubmit} className="mb-0">
                    <Card>
                        <CardContent className="p-4 space-y-3">

                            {invPolicy?.require_scan_pick_location && (
                                <div className="flex items-center space-x-2">
                                    <label
                                        htmlFor="location"
                                        className="text-sm text-gray-600 whitespace-nowrap"
                                    >
                                        Location :
                                    </label>

                                    <div className="relative w-full">
                                        <Input
                                            className="text-sm h-8"
                                            autoComplete="off"
                                            id="location"
                                            placeholder="Entry location..."
                                            value={scanLocation}
                                            onChange={(e) => setScanLocation(e.target.value)}
                                        />
                                        {scanLocation && (
                                            <button
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                onClick={() => {
                                                    setScanLocation("");
                                                    document.getElementById("location")?.focus();
                                                }}
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}


                            {invPolicy?.require_packing_scan && (
                                <>
                                    <div className="flex items-center space-x-1" style={{ display: 'none' }}>
                                        <label
                                            htmlFor="packing_no"
                                            className="text-sm text-gray-600 whitespace-nowrap"
                                        >
                                            Pack No :
                                        </label>

                                        <div className="relative w-full">
                                            <Input
                                                readOnly
                                                className="text-sm h-8"
                                                autoComplete="off"
                                                id="packing_no"
                                                placeholder="Entry packing no..."
                                                value={packingNo}
                                                onChange={(e) => setPackingNo(e.target.value)}
                                            />
                                            {packingNo && (
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                    onClick={() => {
                                                        setPackingNo("");
                                                        document.getElementById("packing_no")?.focus();
                                                    }}
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                </>
                            )}

                            <div className="flex items-center space-x-2">
                                <label
                                    htmlFor="barcode"
                                    className="text-sm text-gray-600 whitespace-nowrap"
                                >
                                    EAN :
                                </label>

                                <div className="relative w-full">
                                    <Input
                                        className="text-sm h-8"
                                        autoComplete="off"
                                        id="barcode"
                                        placeholder="Entry barcode ean..."
                                        value={scanBarcode}
                                        onChange={(e) => setScanBarcode(e.target.value)}
                                    />
                                    {scanBarcode && (
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            onClick={() => {
                                                setScanBarcode("");
                                                document.getElementById("barcode")?.focus();
                                            }}
                                        >
                                            <XCircle size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <Button disabled={isSubmit} type="submit" className="w-full" size="sm">
                                {isSubmit ? "Scanning..." : "Scan"}
                            </Button>
                        </CardContent>
                    </Card>
                </form>

                {isLoading && (
                    <div className="flex justify-center">
                        <Loader2 className="animate-spin" />
                        <span className="ml-2">Loading...</span>
                    </div>
                )}

                <div className="flex justify-center">
                    <span className="ml-2">
                        Total Qty :
                        {filteredItems.reduce((total, item) => total + item.scan_qty, 0)}/
                        {filteredItems.reduce((total, item) => total + item.quantity, 0)}
                    </span>
                </div>

                <Card>
                    <CardContent className="p-4 space-y-4">

                        <div className="flex items-center gap-2">
                            <span className="text-sm">Show Pending</span>
                            <button
                                type="button"
                                onClick={() => setShowAllOutboundDetail(!showAllOutboundDetail)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showAllOutboundDetail ? 'bg-blue-500' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showAllOutboundDetail ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                            <span className="text-sm">Show All</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Input
                                className="w-full"
                                placeholder="Search items..."
                                value={searchOutboundDetail}
                                onChange={(e) => setSearchOutboundDetail(e.target.value)}
                            />
                        </div>

                        {filteredItems.length > 0 ? (
                            <ul className="space-y-2">
                                {filteredItems.map((item, idx) => (
                                    <li
                                        onClick={() => {
                                            fetchScannedItems(item.outbound_detail_id);
                                            setShowModalDetail(true);
                                        }}
                                        key={idx}
                                        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between border p-3 rounded cursor-pointer hover:bg-gray-100`}
                                    >
                                        <div className="text-xs font-mono space-y-0">
                                            <div>
                                                <strong>Item Code :</strong> {item.item_code}
                                            </div>
                                            <div>
                                                <strong>EAN :</strong> {item.barcode}
                                            </div>
                                            <div>
                                                <strong>Scanned:</strong> {item.scan_qty} /{" "}
                                                {item.quantity} {item.uom}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-sm text-gray-400">
                                Tidak ada barang ditemukan
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Seal Container Dialog - Input Weight */}
                <Dialog open={showSealContainerDialog} onOpenChange={setShowSealContainerDialog}>
                    <DialogContent className="bg-white sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Seal Container</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Outbound No:</span>
                                        <span className="font-semibold">{outbound}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Packing No:</span>
                                        <span className="font-semibold">{packingNo}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Container No:</span>
                                        <span className="font-semibold">{packCtnNo}</span>
                                    </div>
                                    {masterCarton && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Carton Type:</span>
                                            <span className="font-semibold">{masterCarton.carton_name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="container_weight" className="text-sm font-medium text-gray-700">
                                    Container Weight (kg) <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    id="container_weight"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Enter weight in kg..."
                                    value={containerWeight}
                                    onChange={(e) => setContainerWeight(e.target.value)}
                                    autoFocus
                                    className="w-full"
                                />
                                {masterCarton && (
                                    <p className="text-xs text-gray-500">
                                        Max weight: {masterCarton.max_weight} kg | Tare weight: {masterCarton.tare_weight} kg
                                    </p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowSealContainerDialog(false);
                                    setContainerWeight("");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirmSeal}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                Next
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Seal Container Confirmation Dialog */}
                <Dialog open={showConfirmSealContainer} onOpenChange={setShowConfirmSealContainer}>
                    <DialogContent className="bg-white sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Confirm Seal Container</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-3">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                <p className="text-sm text-gray-800 font-semibold mb-2">
                                    ⚠️ Confirmation Required
                                </p>
                                <p className="text-sm text-gray-700">
                                    You are about to seal <strong>Container #{packCtnNo}</strong>.
                                    Once sealed, you cannot add more items to this container.
                                </p>
                            </div>

                            <div className="space-y-2 border rounded-md p-3">
                                <h4 className="font-semibold text-sm text-gray-800">Container Details:</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-gray-600">Outbound No:</div>
                                    <div className="font-medium text-right">{outbound}</div>

                                    <div className="text-gray-600">Packing No:</div>
                                    <div className="font-medium text-right">{packingNo}</div>

                                    <div className="text-gray-600">Container No:</div>
                                    <div className="font-medium text-right">{packCtnNo}</div>

                                    <div className="text-gray-600">Weight:</div>
                                    <div className="font-medium text-right text-green-600">{containerWeight} kg</div>

                                    {masterCarton && (
                                        <>
                                            <div className="text-gray-600">Carton Type:</div>
                                            <div className="font-medium text-right">{masterCarton.carton_name}</div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 italic">
                                Please verify all information is correct before confirming.
                            </p>
                        </div>

                        <DialogFooter className="flex gap-2">

                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowConfirmSealContainer(false);
                                    setShowSealContainerDialog(true);
                                }}
                                disabled={isSealingContainer}
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleSealContainerSubmit}
                                disabled={isSealingContainer}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {isSealingContainer ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sealing...
                                    </>
                                ) : (
                                    "Confirm Seal"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Carton Dialog */}
                <Dialog open={showEditCartonDialog} onOpenChange={setShowEditCartonDialog}>
                    <DialogContent className="bg-white sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Change Carton Type</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-3">
                            <Select
                                value={selectedNewCartonId}
                                onValueChange={setSelectedNewCartonId}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select new carton type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {masterCartonsList.map((carton) => (
                                        <SelectItem
                                            key={carton.id}
                                            value={carton.id.toString()}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {carton.carton_name}
                                                    {carton.is_default && (
                                                        <span className="ml-2 text-xs text-blue-500">
                                                            (Default)
                                                        </span>
                                                    )}
                                                    {carton.id === masterCarton?.id && (
                                                        <span className="ml-2 text-xs text-green-600">
                                                            (Current)
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {carton.dimensions} - Max: {carton.max_weight}kg
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Preview new carton */}
                            {getSelectedNewCartonDetails() && (
                                <Card className="p-3 bg-blue-50 border-blue-200">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Box size={16} className="text-blue-600" />
                                            <span className="font-semibold text-blue-900">
                                                {getSelectedNewCartonDetails()?.carton_name}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                                            <div>
                                                <span className="font-medium">Size:</span>{" "}
                                                {getSelectedNewCartonDetails()?.dimensions}
                                            </div>
                                            <div>
                                                <span className="font-medium">Max Weight:</span>{" "}
                                                {getSelectedNewCartonDetails()?.max_weight}kg
                                            </div>
                                            <div>
                                                <span className="font-medium">Volume:</span>{" "}
                                                {getSelectedNewCartonDetails()?.volume.toLocaleString()}
                                                cm³
                                            </div>
                                            <div>
                                                <span className="font-medium">Material:</span>{" "}
                                                {getSelectedNewCartonDetails()?.material}
                                            </div>
                                        </div>
                                        {getSelectedNewCartonDetails()?.description && (
                                            <p className="text-xs text-gray-600 italic">
                                                {getSelectedNewCartonDetails()?.description}
                                            </p>
                                        )}
                                    </div>
                                </Card>
                            )}
                        </div>

                        <DialogFooter className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowEditCartonDialog(false);
                                    setSelectedNewCartonId(masterCarton?.id.toString() || "");
                                }}
                                disabled={isUpdatingCarton}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdateCarton}
                                disabled={isUpdatingCarton || !selectedNewCartonId}
                            >
                                {isUpdatingCarton ? "Updating..." : "Update Carton"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Confirmation Dialog for Update Carton */}
                <Dialog open={showConfirmUpdateCarton} onOpenChange={setShowConfirmUpdateCarton}>
                    <DialogContent className="bg-white sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Confirm Change Carton Type</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-3">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                <p className="text-sm text-gray-800 font-semibold mb-2">
                                    ⚠️ Important Notice
                                </p>
                                <p className="text-sm text-gray-700">
                                    All items in <strong>Carton #{packCtnNo}</strong> will be updated to the new carton type.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-sm text-gray-600">Current Carton:</span>
                                    <span className="text-sm font-semibold text-gray-800">
                                        {masterCarton?.carton_name}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-sm text-gray-600">New Carton:</span>
                                    <span className="text-sm font-semibold text-blue-600">
                                        {getSelectedNewCartonDetails()?.carton_name}
                                    </span>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 italic">
                                This action will update all scanned items in this carton. You cannot undo this change.
                            </p>
                        </div>

                        <DialogFooter className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowConfirmUpdateCarton(false)}
                                disabled={isUpdatingCarton}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirmUpdateCarton}
                                disabled={isUpdatingCarton}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {isUpdatingCarton ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Confirm Update"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Modal Detail dengan filter carton */}
                <Dialog open={showModalDetail} onOpenChange={setShowModalDetail}>
                    <DialogContent className="bg-white max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="font-mono">Scanned Items</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-3">
                            {/* Search input */}
                            <Input
                                className="w-full"
                                placeholder="Search ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />

                            {/* Carton filter */}
                            {invPolicy?.require_packing_scan && uniqueCartons.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-600 whitespace-nowrap">
                                        Filter Container:
                                    </label>
                                    <Select
                                        value={selectedCarton}
                                        onValueChange={(value) => setSelectedCarton(value)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select carton" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Container</SelectItem>
                                            {uniqueCartons.map((carton) => (
                                                <SelectItem key={carton} value={carton}>
                                                    Container {carton}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="max-h-80 overflow-y-auto space-y-2">
                            {filteredScannedItems.length > 0 ? (
                                <div className="max-h-80 overflow-y-auto space-y-2">
                                    {Object.keys(groupedItems).length > 0 ? (
                                        <div className="space-y-2">
                                            {Object.entries(groupedItems).map(([koli, items]) => {
                                                let cartonNo = (items as ScannedItem[])[0]?.pack_ctn_no;

                                                if (selectedCarton == "all") {
                                                    // Tampilkan semua carton
                                                    cartonNo = "ALL";
                                                } else if (cartonNo !== selectedCarton) {
                                                    // Sembunyikan carton yang tidak sesuai filter
                                                    // return null;
                                                }

                                                return (
                                                    <div
                                                        key={koli}
                                                        className="p-2 border rounded-md bg-gray-50"
                                                    >
                                                        <div className="font-semibold text-sm font-mono mb-2 flex justify-between items-center">
                                                            <div>
                                                                {invPolicy?.require_packing_scan && cartonNo && (
                                                                    <div className="text-sm text-gray-600">
                                                                        CTN : {cartonNo}
                                                                    </div>
                                                                )}
                                                                ITEM : {(items as ScannedItem[])?.length}, QTY : {" "}
                                                                {items?.reduce(
                                                                    (total, item) => total + item.qty_data_scan,
                                                                    0
                                                                )}
                                                            </div>




                                                            {invPolicy?.require_packing_scan && cartonNo && cartonNo !== "ALL" && (
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    className="h-7 text-xs"
                                                                    disabled={isSubmit}
                                                                    onClick={() => {
                                                                        setCartonToDelete(cartonNo);
                                                                        setShowDeleteCartonConfirm(true);
                                                                    }}
                                                                >
                                                                    {/* <Trash2 size={14} className="mr-1" /> */}
                                                                    Delete Container
                                                                </Button>
                                                            )}
                                                        </div>
                                                        {items?.map((item, index) => (
                                                            <div
                                                                key={index}
                                                                className={`p-2 border rounded-md cursor-pointer mb-2 ${item.status === "in stock"
                                                                    ? "bg-green-100"
                                                                    : "bg-blue-100"
                                                                    }`}
                                                            >
                                                                <div className="text-xs space-y-1 font-mono">
                                                                    <div>
                                                                        {invPolicy.require_scan_pick_location && (
                                                                            <>
                                                                                <strong>Location:</strong>{" "}
                                                                                {item.location_scan}
                                                                                <br />
                                                                            </>
                                                                        )}

                                                                        {invPolicy.require_packing_scan && (
                                                                            <>
                                                                                <strong>PACK : </strong>{item.packing_no}<br />
                                                                                <strong>CTN : </strong>{item.pack_ctn_no} <br />
                                                                            </>
                                                                        )}

                                                                        <strong>EAN :</strong> {item.barcode_data_scan}
                                                                        <br />
                                                                        {item.is_serial && (
                                                                            <>
                                                                                <strong>Serial:</strong> {item.serial_number}
                                                                                <br />
                                                                            </>
                                                                        )}
                                                                        <strong>QTY:</strong> {item.qty_data_scan} {item.uom_scan}
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-3 gap-4 mt-2">
                                                                    <div className="col-span-2 flex items-center">
                                                                        {item.status === "pending" && (
                                                                            <Button
                                                                                disabled={isSubmit}
                                                                                className="h-6 bg-red-500 text-white hover:bg-red-600"
                                                                                variant="destructive"
                                                                                size="sm"
                                                                                onClick={() =>
                                                                                    handleRemoveItem(
                                                                                        item.id,
                                                                                        item.outbound_detail_id
                                                                                    )
                                                                                }
                                                                            >
                                                                                {isSubmit ? "Deleting..." : "Delete"}
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                    <div className="col-span-1 flex justify-end items-end">
                                                                        {item.status && (
                                                                            <span className="text-xs text-gray-400 font-mono">
                                                                                {item.status}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-gray-500 text-sm">
                                            This item has not been scanned.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-gray-500 text-sm">
                                    {selectedCarton !== "all"
                                        ? `No items found in Carton ${selectedCarton}`
                                        : "This item has not been scanned."}
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            {/* Kosongkan atau tambahkan tombol lain di sini */}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Confirmation Dialog for Deleting Carton */}
                <Dialog open={showDeleteCartonConfirm} onOpenChange={setShowDeleteCartonConfirm}>
                    <DialogContent className="bg-white">
                        <DialogHeader>
                            <DialogTitle>Confirm Delete Container</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <p className="text-sm text-gray-600">
                                Are you sure you want to delete all items in Container <strong>{cartonToDelete}</strong>?
                            </p>
                            <p className="text-sm text-red-600 mt-2">
                                This action cannot be undone.
                            </p>
                        </div>
                        <DialogFooter className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowDeleteCartonConfirm(false);
                                    setCartonToDelete("");
                                }}
                                disabled={isSubmit}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    const outboundDetailId = listOutboundScanned.find(
                                        item => item.pack_ctn_no === cartonToDelete
                                    )?.outbound_detail_id;
                                    if (outboundDetailId) {
                                        handleRemoveCarton(cartonToDelete, outboundDetailId);
                                    }
                                }}
                                disabled={isSubmit}
                            >
                                {isSubmit ? "Deleting..." : "Delete Container"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>


                {/* List Container Dialog */}
                <Dialog open={showListContainerDialog} onOpenChange={setShowListContainerDialog}>
                    <DialogContent className="bg-white sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-semibold text-gray-800">
                                List Container — {outbound}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
                            {listContainerSummary.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-xs">
                                    No container data found
                                </div>
                            ) : (
                                listContainerSummary.map(({ pack_ctn_no, qty: totalQty, totalItems, items: barcodes }) => {
                                    const isCurrent = pack_ctn_no === packCtnNo;
                                    return (
                                        <div
                                            key={pack_ctn_no}
                                            className={`rounded-lg border p-3 space-y-1.5 ${isCurrent
                                                ? "border-blue-400 bg-blue-50"
                                                : "border-gray-200 bg-gray-50"
                                                }`}
                                        >
                                            {/* Header row */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <Box size={13} className={isCurrent ? "text-blue-600" : "text-gray-500"} />
                                                    <span className={`text-xs font-bold font-mono ${isCurrent ? "text-blue-700" : "text-gray-700"}`}>
                                                        CTN # {pack_ctn_no}
                                                    </span>
                                                    {isCurrent && (
                                                        <span className="text-[10px] bg-blue-600 text-white rounded px-1.5 py-0.5 font-medium leading-none">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-bold text-gray-800">
                                                        {totalQty} <span className="font-normal text-gray-500">qty</span>
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Stats row */}
                                            {/* <div className="flex gap-3 text-[11px] text-gray-500">
                                                <span>{totalItems} item{totalItems !== 1 ? "s" : ""} scanned</span>
                                            </div> */}

                                            {/* Barcodes */}
                                            {barcodes.length > 0 && (
                                                <div className="flex flex-wrap gap-1 pt-0.5">
                                                    {barcodes.map((bc, i) => (
                                                        <span
                                                            key={i}
                                                            className="text-[10px] font-mono bg-white border border-gray-200 text-gray-600 rounded px-1.5 py-0.5"
                                                        >
                                                            {bc}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Summary footer */}
                        {listContainerSummary.length > 0 && (
                            <div className="border-t pt-3 flex justify-between text-xs text-gray-600">
                                <span>{listContainerSummary.length} container{listContainerSummary.length !== 1 ? "s" : ""} total</span>
                                <span className="font-semibold text-gray-800">
                                    {listContainerSummary.reduce((sum, c) => sum + c.qty, 0)} total qty
                                </span>
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs h-8"
                                onClick={() => setShowListContainerDialog(false)}
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Fixed Bottom Bar - CTN & Seal Container */}
            {invPolicy?.require_packing_scan && (
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg px-4 pt-3 pb-4 space-y-3">

                    {/* Container Info Row */}
                    <div className="flex items-center justify-between gap-3">

                        {/* CTN # Counter */}
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1 flex-1">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                CTN #
                            </span>

                            {/* Decrement Button */}
                            {/* <button
                                onClick={() => {
                                    let newVal: number | string = parseInt(packCtnNo) - 1;
                                    if (newVal < 1) newVal = "";
                                    setPackCtnNo(newVal.toString());
                                }}
                                disabled={parseInt(packCtnNo) <= 0}
                                className={`
            w-6 h-6 rounded-lg flex items-center justify-center font-bold text-lg leading-none transition-all duration-150 select-none
            ${parseInt(packCtnNo) <= 0
                                        ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                        : "bg-white border border-gray-300 text-gray-600 active:scale-90 active:bg-gray-100 shadow-sm"
                                    }
          `}
                            >
                                −
                            </button> */}

                            {/* Value Display */}
                            <span className="flex-1 text-center text-lg font-bold text-gray-800 tabular-nums min-w-[2rem]">
                                {packCtnNo}
                            </span>

                            {/* Increment Button */}
                            {/* <button
                                onClick={() => setPackCtnNo((prev) => {
                                    const current = parseInt(prev) || 0;
                                    return (current + 1).toString();
                                })}
                                className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-lg leading-none bg-blue-600 text-white active:scale-90 active:bg-blue-700 shadow-sm transition-all duration-150 select-none"
                            >
                                +
                            </button> */}
                        </div>

                        {/* Master Carton Badge */}
                        {masterCarton && (
                            <button
                                type="button"
                                onClick={handleEditCarton}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline truncate block w-full text-left"
                            >
                                {masterCarton.display_name}
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-md disabled:opacity-60"
                            onClick={handleNewCarton}
                            disabled={isCreatingCarton}
                        >
                            {isCreatingCarton ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Box size={14} />
                            )}
                            New Ctn
                        </Button>
                        {/* Seal Button Row */}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full h-8 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-base shadow-md"
                            onClick={() => setShowListContainerDialog(true)}
                        // onClick={fetchCartonByOutboundNo}
                        >
                            <List size={14} className="mr-0" />
                            List
                        </Button>
                        {/* Seal Button Row */}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full h-8 bg-green-600 hover:bg-green-700 text-white font-semibold text-base shadow-md"
                            onClick={handleSealContainer}
                        >
                            <Box size={14} className="mr-0" />
                            Seal
                        </Button>
                    </div>



                </div>
            )}

            {/* Modal Dialog untuk Scan */}
            {showDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex  sm:items-center justify-center z-50 p-4 ">
                    <div className="bg-white rounded-b-lg  rounded-t-lg sm:rounded-lg shadow-xl w-full max-w-md max-h-[80vh] sm:max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-2 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-800 pr-4">
                            </h2>
                            <button
                                onClick={closeDialog}
                                className="text-gray-400 hover:text-gray-600 text-2xl sm:text-xl p-1 -m-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                aria-label="Close dialog"
                            >
                                ×
                            </button>
                        </div>

                        <div className="px-4 sm:px-6 py-4 pb-6">
                            <div className="mb-4 p-3 bg-gray-100 rounded-md">
                                {outbound && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        Picking ID : <span className="text-gray-800 text-">{outbound}</span>
                                    </p>
                                )}

                                {invPolicy?.require_packing_scan && (
                                    <p className="text-sm text-gray-600">
                                        Packing No : <span className="font-medium">{packingNo}</span>
                                    </p>
                                )}

                                {invPolicy?.require_scan_pick_location && (
                                    <p className="text-sm text-gray-600">
                                        Location :{" "}
                                        <span className="font-medium">{scanLocation}</span>
                                    </p>
                                )}

                                <p className="text-sm text-gray-600 break-all">
                                    EAN : <span className="font-mono">{scanBarcode}</span>
                                </p>
                            </div>

                            {isSerial ? (
                                <form onSubmit={handleSerialSubmit}>
                                    <div className="space-y-1">
                                        <label className="text-sm text-gray-600">
                                            Serial Numbers:
                                        </label>

                                        {serialInputs.map((serial, index) => (
                                            <div key={index} className="relative">
                                                <Input
                                                    autoComplete="off"
                                                    className="w-full pr-20"
                                                    id={`serial-${index}`}
                                                    value={serial}
                                                    onChange={(e) => {
                                                        const newSerials = [...serialInputs];
                                                        newSerials[index] = e.target.value;
                                                        setSerialInputs(newSerials);
                                                    }}
                                                />
                                                {serial && (
                                                    <button
                                                        type="button"
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                        onClick={() => {
                                                            const newSerials = [...serialInputs];
                                                            newSerials[index] = "";
                                                            setSerialInputs(newSerials);
                                                            document
                                                                .getElementById(`serial-${index}`)
                                                                ?.focus();
                                                        }}
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        <div className="flex justify-between items-center">
                                            <button
                                                type="button"
                                                className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                                                onClick={() => setSerialInputs([...serialInputs, ""])}
                                            >
                                                + Add Serial
                                            </button>
                                        </div>

                                        {serialInputs.length > 1 && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="text-red-600 hover:text-red-800 text-sm font-semibold mt-2"
                                                    onClick={() => {
                                                        const newSerials = serialInputs.filter(
                                                            (_, i) => i !== serialInputs.length - 1
                                                        );
                                                        setSerialInputs(newSerials);
                                                    }}
                                                >
                                                    - Remove Last Serial
                                                </button>

                                                <div className="text-sm text-gray-500">
                                                    Combined:{" "}
                                                    {serialInputs
                                                        .filter((s) => s.trim() !== "")
                                                        .join("-")}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                                        <Button type="submit" className="w-full">
                                            Submit
                                        </Button>
                                        <Button
                                            type="button"
                                            className="w-full"
                                            variant="outline"
                                            onClick={closeDialog}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleQuantitySubmit}>
                                    <div className="mb-6 space-y-1">
                                        <div className="flex items-center space-x-2">
                                            <label htmlFor="qty" className="text-sm text-gray-600 ">
                                                Qty/Unit
                                            </label>
                                            <Input

                                                min={1}
                                                type="number"
                                                className="h-8 text-sm mt-1"
                                                id="qty"
                                                value={scanQty}
                                                autoComplete="off"
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === "") {
                                                        setScanQty("");
                                                        return;
                                                    }
                                                    const num = Number(val);
                                                    setScanQty(num < 1 ? 1 : num);
                                                }}
                                            />

                                            <Input
                                                readOnly
                                                type="text"
                                                className="h-8 text-sm mt-1"
                                                id="uom"
                                                value={scanUom}
                                                autoComplete="off"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Button type="submit" className="w-full">
                                            Submit
                                        </Button>
                                        <Button
                                            type="button"
                                            className="w-full"
                                            variant="outline"
                                            onClick={closeDialog}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CheckingPage;

