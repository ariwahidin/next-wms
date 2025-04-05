

import BarcodeTable from "./BarcodeTable";
import { ScanForm } from "./ScanForm";
import { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import Layout from "@/components/layout";
import { HeaderForm } from "../HeaderForm";
import eventBus from "@/utils/eventBus";
import DataTableModal from "./DataTableModal";
import PalletTable from "./PalletTable";
import { Label } from "@radix-ui/react-label";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  Trash2,
  ArrowRight,
  MoveRight,
  Search,
} from "lucide-react";
import { Select } from "@radix-ui/react-select";
import error from "next/error";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Page() {
  const [dataToPost, setDataToPost] = useState({
    subtitle: "Transfer Location",
    pallet: "",
    location: "",
  });

  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetLocation, setTargetLocation] = useState("");
  const [targetPallet, setTargetPallet] = useState("");
  const [transferItems, setTransferItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // set title
  useEffect(() => {
    setLoading(true);
    document.title = "Scan Inbound";
    setLoading(false);
  }, []);

  // Fetch inventory data when pallet and location are provided
  useEffect(() => {
    if (dataToPost.pallet && dataToPost.location) {
      fetchInventoryData();
    } else {
      setInventoryItems([]);
      setFilteredItems([]);
      setSelectedItems([]);
    }
  }, [dataToPost.pallet, dataToPost.location]);

  // Filter items based on search term
  useEffect(() => {
    if (inventoryItems && inventoryItems.length > 0) {
      if (!searchTerm) {
        setFilteredItems(inventoryItems);
      } else {
        const searchTermLower = searchTerm.toLowerCase();
        const filtered = inventoryItems.filter(
          (item) =>
            (item?.item_code &&
              item.item_code.toLowerCase().includes(searchTermLower)) ||
            (item?.serial_number &&
              item.serial_number.toLowerCase().includes(searchTermLower))
        );
        setFilteredItems(filtered);
      }
    } else {
      setFilteredItems([]);
    }
  }, [searchTerm, inventoryItems]);

  const fetchInventoryData = async () => {
    try {
      // Simulating API call - replace with actual API call
      const response = await api.post(
        "/inventory/rf/pallet",
        { pallet: dataToPost.pallet, location: dataToPost.location },
        { withCredentials: true }
      );
      setInventoryItems(response.data.data?.inventories);
      setFilteredItems(response.data.data?.inventories);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      setInventoryItems([]);
      setFilteredItems([]);
    }
  };

  const handleItemSelect = (itemId) => {
    setSelectedItems((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(filteredItems.map((item) => item?.ID));
    } else {
      setSelectedItems([]);
    }
  };

  const prepareTransferItems = () => {
    const items = inventoryItems
      .filter((item) => selectedItems.includes(item?.ID))
      .map((item) => ({
        ...item,
        transferQuantity: item?.qty_available,
      }));

    setTransferItems(items);
    setTargetLocation("");
    setIsModalOpen(true);
  };

  const updateTransferQuantity = (itemId, quantity) => {
    setTransferItems((prev) =>
      prev.map((item) =>
        item?.ID === itemId ? { ...item, transferQuantity: quantity } : item
      )
    );
  };

  const handleTransferSubmit = async () => {
    // Prepare payload for backend
    const payload = {
      sourcePallet: dataToPost.pallet,
      sourceLocation: dataToPost.location,
      targetPallet: targetPallet,
      targetLocation: targetLocation,
      items: transferItems.map((item) => ({
        inventory_id: item?.ID,
        item_id: item?.item_id,
        quantity: parseInt(item?.transferQuantity),
      })),
      timestamp: new Date().toISOString(),
    };

    // Log payload (as requested)
    console.log("Transfer Payload:", payload);

    // Here you would normally send this to backend

    try {
      const response = await api.post("/inventory/rf/move", payload, {
        withCredentials: true,
      });
      if (response.data.success) {
        eventBus.emit("showAlert", {
          title: "Success!",
          description: "Transfer successful",
          type: "success",
        });
        // Close modal and reset state
        setIsModalOpen(false);
        // setSelectedItems([]);
        // setTransferItems([]);
        // setTargetLocation("");
        // setTargetPallet("");
        // Refresh inventory data
        fetchInventoryData();
      } else {
        // eventBus.emit("showAlert", {
        //   title: "Error!",
        //   description: response.data.message,
        //   type: "error",
        // });
      }
    } catch (error) {
      console.error("Error during transfer:", error);
    //   eventBus.emit("showAlert", {
    //     title: "Error!",
    //     description: "Failed to transfer items",
    //     type: "error",
    //   });
    }
  };

  const handleInputChange = (e) => {
    setDataToPost({
      ...dataToPost,
      [e.target.id]: e.target.value,
    });
    if (e.target.id === "pallet") {
      setTargetPallet(e.target.value);
    }
  };

  const clearInput = (field) => {
    setDataToPost({
      ...dataToPost,
      [field]: "",
    });
    document.getElementById(field)?.focus();
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
    document.getElementById("searchInput")?.focus();
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter" && filteredItems.length === 1) {
      // Auto-select the item if only one result is found
      handleItemSelect(filteredItems[0]?.ID);
    }
  };

  return loading ? (
    <p>Loading...</p>
  ) : (
    <Layout title="Inbound" subTitle={dataToPost.subtitle}>
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-1">
        <Tabs defaultValue="scan" className="w-full">
          <TabsList>
            <TabsTrigger value="scan">Scan</TabsTrigger>
          </TabsList>
          <TabsContent value="scan">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="w-full">
                {/* <CardHeader>
                  <CardTitle>Scan Form</CardTitle>
                </CardHeader> */}
                <CardContent>
                  <form>
                    <div className="grid w-full items-center gap-4">
                      <div className="grid grid-cols-1 gap-2">
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex flex-col space-y-1.5 pt-4">
                            <Label>Pallet</Label>
                            <div className="flex w-full max-w-sm items-center space-x-2">
                              <Input
                                id="pallet"
                                type="text"
                                onChange={handleInputChange}
                                value={dataToPost.pallet}
                                placeholder="Enter Pallet No"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => clearInput("pallet")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex flex-col space-y-1.5">
                            <Label>Location</Label>
                            <div className="flex w-full max-w-sm items-center space-x-2">
                              <Input
                                id="location"
                                type="text"
                                onChange={handleInputChange}
                                value={dataToPost.location}
                                placeholder="Enter Location"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => clearInput("location")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>

                  {/* Inventory List Section */}
                  {dataToPost.pallet && dataToPost.location && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold mb-2">
                        Inventory Items
                      </h3>

                      {/* Search Input */}
                      <div className="mb-4">
                        <div className="flex w-full items-center space-x-2">
                          <div className="relative flex-grow">
                            <Input
                              id="searchInput"
                              type="text"
                              placeholder="Search by item code or serial number"
                              value={searchTerm}
                              onChange={handleSearchChange}
                              onKeyPress={handleSearchKeyPress}
                              className="pl-8"
                            />
                            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-400" />
                          </div>
                          {searchTerm && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={clearSearch}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {filteredItems && filteredItems.length > 0 ? (
                        <div className="border rounded-md overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">
                                  <Checkbox
                                    checked={
                                      selectedItems.length ===
                                        filteredItems.length &&
                                      filteredItems.length > 0
                                    }
                                    onCheckedChange={handleSelectAll}
                                  />
                                </TableHead>
                                <TableHead>Item Code</TableHead>
                                <TableHead>Serial Number</TableHead>
                                <TableHead className="text-right">
                                  Quantity
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredItems.map((item) => (
                                <TableRow
                                  key={item?.ID}
                                  className="hover:bg-gray-50"
                                >
                                  <TableCell
                                    className="w-12"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Checkbox
                                      checked={selectedItems.includes(item?.ID)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedItems((prev) => [
                                            ...prev,
                                            item?.ID,
                                          ]);
                                        } else {
                                          setSelectedItems((prev) =>
                                            prev.filter((id) => id !== item?.ID)
                                          );
                                        }
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell
                                    className="cursor-pointer"
                                    onClick={() => handleItemSelect(item?.ID)}
                                  >
                                    {item?.item_code}
                                  </TableCell>
                                  <TableCell
                                    className="cursor-pointer"
                                    onClick={() => handleItemSelect(item?.ID)}
                                  >
                                    {item?.serial_number}
                                  </TableCell>
                                  <TableCell
                                    className="text-right cursor-pointer"
                                    onClick={() => handleItemSelect(item?.ID)}
                                  >
                                    {item?.qty_available}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center p-4 border rounded-md bg-gray-50">
                          <p className="text-gray-500">
                            {inventoryItems.length > 0
                              ? "No items match your search"
                              : "No inventory items found"}
                          </p>
                        </div>
                      )}

                      {/* Transfer Button */}
                      {selectedItems.length > 0 && (
                        <div className="mt-4 flex justify-end">
                          <Button
                            onClick={prepareTransferItems}
                            className="flex items-center gap-2"
                          >
                            Transfer Selected <MoveRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Transfer Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl bg-white">
          <DialogHeader>
            <DialogTitle>Transfer Items</DialogTitle>
            <DialogDescription>
              Transfer selected items to a new location
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetLocation" className="text-right">
                Target Pallet
              </Label>
              <Input
                id="targetPallet"
                placeholder="Enter destination pallet"
                className="col-span-3"
                value={targetPallet}
                onChange={(e) => setTargetPallet(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetLocation" className="text-right">
                Target Location
              </Label>
              <Input
                id="targetLocation"
                placeholder="Enter destination location"
                className="col-span-3"
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value)}
              />
            </div>

            <div className="mt-2">
              <Label className="mb-2 block">Selected Items</Label>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Transfer Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transferItems?.map((item) => (
                      <TableRow key={item?.ID}>
                        <TableCell>{item?.item_code}</TableCell>
                        <TableCell>{item?.serial_number}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            readOnly
                            max={item?.qty_available}
                            value={item?.transferQuantity}
                            onChange={(e) =>
                              updateTransferQuantity(item?.ID, e.target.value)
                            }
                            className="w-24"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleTransferSubmit}
              disabled={
                !targetLocation || transferItems.length === 0 || !targetPallet
              }
            >
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
