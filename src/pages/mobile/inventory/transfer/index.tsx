/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/mobile/PageHeader";

import {
  Check,
  CheckCheck,
  Loader2,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { XCircle } from "lucide-react"; // untuk icon clear
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";

interface ScannedItem {
  id?: number;
  inbound_no: string;
  inbound_id: number;
  inbound_detail_id: number;
  barcode: string;
  serial_number: string;
  serial_number_2?: string;
  pallet: string;
  location: string;
  qa_status: string;
  whs_code: string;
  scan_type: string;
  quantity: number;
  status?: string;
  rec_date?: string;
}

const TransferPage = () => {
  const router = useRouter();
  const { inbound } = router.query;

  const [scanLocation, setScanLocation] = useState("");
  const [scanLocation2, setScanLocation2] = useState("");
  const [qtyTransfer, setQtyTransfer] = useState(0);

  const [scanBarcode, setScanBarcode] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmModalMoveTo, setShowConfirmModalMoveTo] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [itemSelected, setItemSelected] = useState<ScannedItem | null>(null);
  const [listInboundScanned, setListInboundScanned] = useState<ScannedItem[]>(
    []
  );

  const handleSearch = async () => {
    setLoading(true);

    try {
      const response = await api.post(
        "/mobile/inventory/location/barcode",
        {
          location: scanLocation,
          barcode: scanBarcode,
        },
        {
          withCredentials: true,
        }
      );
      const data = await response.data;
      if (data.success) {
        const filtered = data.data.map((item: any) => ({
          id: item.ID,
          inbound_no: inbound,
          inbound_id: item.inbound_id,
          inbound_detail_id: item.inbound_detail_id,
          barcode: item.barcode,
          serial_number: item.serial_number,
          serial_number_2: item.serial_number_2,
          pallet: item.pallet,
          location: item.location,
          qa_status: item.qa_status,
          whs_code: item.whs_code,
          scan_type: item.scan_type,
          quantity: item.qty_available,
          status: item.status,
          rec_date: item.rec_date,
        }));

        setListInboundScanned(filtered);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1000); // Simulate a delay of 1 second
    }
  };

  const handleConfirmTransfer = async () => {
    console.log("List Inbound Scanned:", listInboundScanned);

    const dataToPost = {
      from_location: scanLocation,
      to_location: scanLocation2,
      list_inventory: listInboundScanned,
    };

    console.log("Data to Post:", dataToPost);

    try {
      const response = await api.post(
        "/mobile/inventory/transfer/location/barcode",
        dataToPost,
        {
          withCredentials: true,
        }
      );

      const data = await response.data;

      if (data.success) {
        setShowConfirmModal(false);

        eventBus.emit("showAlert", {
          title: "Success!",
          description: data.message,
          type: "success",
        });

        handleSearch();
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const filteredScannedItems =
    listInboundScanned.filter(
      (item) =>
        item?.id.toString().includes(searchTerm.toLowerCase()) ||
        item?.inbound_detail_id.toString().includes(searchTerm.toLowerCase()) ||
        item?.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item?.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item?.location.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const moveItemToLocation = async () => {
    const dataToPost = {
      from_location: scanLocation,
      to_location: scanLocation2,
      qty_transfer: qtyTransfer,
      inventory_id: itemSelected?.id,
      list_inventory: [itemSelected],
    };

    console.log("Data to Post:", dataToPost);

    // return;

    if (qtyTransfer <= 0) {
      eventBus.emit("showAlert", {
        title: "Error!",
        description: "Qty transfer must be greater than 0",
        type: "error",
      });
      return;
    }

    if (qtyTransfer > itemSelected?.quantity) {
      eventBus.emit("showAlert", {
        title: "Error!",
        description: "Qty transfer must be less than available qty",
        type: "error",
      });
      return;
    }

    if (scanLocation2.trim() === "") {
      eventBus.emit("showAlert", {
        title: "Error!",
        description: "Destination location cannot be empty",
        type: "error",
      });
      return;
    }

    try {
      const response = await api.post(
        "/mobile/inventory/transfer-by-inventory-id",
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
        setShowConfirmModalMoveTo(false);
        setScanLocation2("");
        handleSearch();
      } else {
        console.error("Transfer failed:", data.message);
      }
    } catch (error) {
      console.error("Error during transfer:", error);
    }
  };

  useEffect(() => {
    console.log("Data terbaru:", listInboundScanned);
  }, [listInboundScanned]);

  useEffect(() => {
    if (showConfirmModalMoveTo) {
      setTimeout(() => {
        document.getElementById("locationTransfer")?.focus();
      }, 100); // delay kecil supaya nunggu dialog benar-benar render
    }
  }, [showConfirmModalMoveTo]);

  return (
    <>
      <PageHeader title={`Internal Transfer`} showBackButton />
      <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-24 max-w-md mx-auto">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="relative">
              <Input
                id="location"
                placeholder="From Location..."
                value={scanLocation}
                onChange={(e) => setScanLocation(e.target.value)}
              />
              {scanLocation && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setScanLocation("");
                    setListInboundScanned([]);
                    document.getElementById("location")?.focus();
                  }}
                >
                  <XCircle size={18} />
                </button>
              )}
            </div>

            <div className="relative">
              <Input
                id="barcode"
                placeholder="Barcode..."
                value={scanBarcode}
                onChange={(e) => setScanBarcode(e.target.value)}
              />
              {scanBarcode && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setScanBarcode("");
                    setListInboundScanned([]); // Clear the scanned items
                    document.getElementById("barcode")?.focus();
                  }}
                >
                  <XCircle size={18} />
                </button>
              )}
            </div>

            <Button onClick={handleSearch} className="w-full">
              <Search size={18} />
              Search
            </Button>
          </CardContent>
        </Card>

        {/* Loading Indicator */}

        {loading && (
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin" size={24} />
            <span className="ml-2 text-gray-600">Searching...</span>
          </div>
        )}

        {/* ListView */}

        {!loading && (
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* <div className="relative">
                <Input
                  id="search"
                  className="w-full"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                {searchTerm && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => {
                      setSearchTerm("");
                      document.getElementById("search")?.focus();
                    }}
                  >
                    <XCircle size={18} />
                  </button>
                )}
              </div> */}

              {/* Item Count */}
              <div className="text-sm">
                <span className="text-gray-600">
                  Item : {filteredScannedItems.length}
                </span>
              </div>

              {/* ListView */}
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredScannedItems.length > 0 ? (
                  filteredScannedItems.map((item, index) => (
                    <div
                      key={index}
                      className={`p-2 border rounded-md cursor-pointer ${
                        item.qa_status === "A"
                          ? "bg-green-100"
                          : "bg-blue-100"
                      }`}
                    >
                      <div className="flex justify-between items-start text-sm">
                        <div className="space-y-1">
                          <div>
                            <span className="text-gray-600">Location:</span>{" "}
                            {item.location}
                            <br />
                            <span className="text-gray-600">Barcode:</span>{" "}
                            {item.barcode}
                            <br />
                            {/* <span className="text-gray-600">Serial:</span>{" "}
                            {item.serial_number}
                            <br /> */}
                            <span className="text-gray-600">
                              Rcv Date:
                            </span>{" "}
                            {item.rec_date}
                            <br />
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-600">QA: </span>{" "}
                          {item.qa_status}
                          <br />
                          <span className="text-gray-600">Whs: </span>{" "}
                          {item.whs_code}
                          <br />
                          <span className="text-gray-600">Available:</span>{" "}
                          {item.quantity}
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => {
                          setShowConfirmModalMoveTo(true);
                          setItemSelected(item);
                          setQtyTransfer(item.quantity);
                        }}
                      >
                        <Check size={18} />
                        Transfer
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm">
                    No items found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Floating Upload Button */}

        {listInboundScanned.length > 0 && !loading && (
          <div className="items-center justify-center fixed bottom-0 left-0 right-0 bg-white shadow-md">
            <Button
              onClick={() => setShowConfirmModal(true)}
              className="fixed bottom-6 w-90 left-2 right-2"
            >
              <CheckCheck size={28} />
              Transfer All
            </Button>
          </div>
        )}

        <Dialog
          open={showConfirmModalMoveTo}
          onOpenChange={setShowConfirmModalMoveTo}
        >
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Confirmation</DialogTitle>
            </DialogHeader>

            <p>
              Item with serial <strong>{itemSelected?.serial_number}</strong>,
              barcode <strong>{scanBarcode}</strong> in{" "}
              <strong>{scanLocation}</strong> will be moved to the destination
              location?
            </p>

            <div className="relative">
              <Input
                // readOnly
                className="mb-2"
                id="qtyTransfer"
                autoComplete="off"
                placeholder="Qty..."
                type="number"
                value={qtyTransfer}
                onChange={(e) => setQtyTransfer(Number(e.target.value))}
              />
            </div>

            <div className="relative">
              <Input
                id="locationTransfer"
                autoComplete="off"
                placeholder="Destination Location..."
                value={scanLocation2}
                onChange={(e) => setScanLocation2(e.target.value)}
              />

              {scanLocation2 && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setScanLocation2("");
                    document.getElementById("locationTransfer")?.focus();
                  }}
                >
                  <XCircle size={18} />
                </button>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setShowConfirmModalMoveTo(false)}
              >
                Batal
              </Button>
              <Button onClick={moveItemToLocation}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Confirmation</DialogTitle>
            </DialogHeader>

            <p>
              All items of <strong>{scanBarcode}</strong> in{" "}
              <strong>{scanLocation}</strong> will be moved to the destination
              location?
            </p>

            <div className="relative">
              <Input
                id="location2"
                autoComplete="off"
                placeholder="Destination Location..."
                value={scanLocation2}
                onChange={(e) => setScanLocation2(e.target.value)}
              />

              {scanLocation2 && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setScanLocation2("");
                    document.getElementById("location2")?.focus();
                  }}
                >
                  <XCircle size={18} />
                </button>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setShowConfirmModal(false)}
              >
                Batal
              </Button>
              <Button onClick={handleConfirmTransfer}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default TransferPage;
