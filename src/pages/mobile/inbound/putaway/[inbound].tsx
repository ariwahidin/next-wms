/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/mobile/PageHeader";

import { Check, Loader2, ScanBarcode, Search } from "lucide-react";
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
}

const PutawayPage = () => {
  const router = useRouter();
  const { inbound } = router.query;

  const [scanLocation, setScanLocation] = useState("");
  const [scanLocation2, setScanLocation2] = useState("");

  const [scanBarcode, setScanBarcode] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [listInboundScanned, setListInboundScanned] = useState<ScannedItem[]>(
    []
  );

  const handleSearch = async () => {
    setLoading(true);

    try {
      const response = await api.post(
        "/mobile/inbound/search/location",
        {
          location: scanLocation,
          inbound_no: inbound,
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
          quantity: item.quantity,
          status: item.status,
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

  const handleConfirmPutaway = async (inbound_no: string) => {
    console.log("List Inbound Scanned:", listInboundScanned);

    const dataToPost = {
      inbound_no: inbound_no,
      from_location: scanLocation,
      to_location: scanLocation2,
      list_inbound_scanned: listInboundScanned,
    };

    console.log("Data to Post:", dataToPost);

    try {
      const response = await api.post(
        "/mobile/inbound/putaway/location/" + inbound_no,
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

  useEffect(() => {
    console.log("Data terbaru:", listInboundScanned);
  }, [listInboundScanned]);

  return (
    <>
      <PageHeader title={`Putaway ${inbound}`} showBackButton />
      <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-24">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="relative">
              <label htmlFor="location" className="text-sm text-gray-600">Receive Location : </label>
              <Input
                className="w-full mt-1"
                autoComplete="off"
                id="location"
                // placeholder="From Location..."
                value={scanLocation}
                onChange={(e) => setScanLocation(e.target.value)}
              />
              {scanLocation && (
                <button
                  type="button"
                  className="absolute right-3 top-11 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              <label htmlFor="barcode" className="text-sm text-gray-600">Barcode : </label>
              <Input
                className="w-full mt-1"
                autoComplete="off"
                id="barcode"
                // placeholder="Barcode..."
                value={scanBarcode}
                onChange={(e) => setScanBarcode(e.target.value)}
              />
              {scanBarcode && (
                <button
                  type="button"
                  className="absolute right-3 top-11 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              <Search size={18} className="mr-2" />
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
              <Input
                className="w-full"
                placeholder="Cari barang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div className="text-sm">
                <span>Item : {filteredScannedItems.length}, Qty: {filteredScannedItems.reduce((total, item) => total + item.quantity, 0)}</span>
              </div>

              {/* ListView */}
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredScannedItems.length > 0 ? (
                  filteredScannedItems.map((item, index) => (
                    <div
                      key={index}
                      className={`p-2 border rounded-md cursor-pointer ${
                        item.status === "in stock"
                          ? "bg-green-100"
                          : "bg-blue-100"
                      }`}
                    >
                      <div className="text-sm space-y-1">
                        <div className="top-2 right-2 flex gap-3">
                          <div className="flex items-center space-x-1 text-gray-500 text-xs">
                            <ScanBarcode size={16} />
                            <span>{item.quantity}</span>
                          </div>
                        </div>

                        <div>
                          <strong>Barcode:</strong> {item.barcode}
                        </div>
                        <div>
                          <strong>Serial:</strong> {item.serial_number}
                        </div>
                        <div>
                          <strong>Location:</strong> {item.location}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        {/* Tombol berada di kolom 1 dan 2 */}
                        {/* <div className="col-span-2 flex items-center">
                        {item.status === "pending" ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleRemoveItem(item.id, item.inbound_detail_id)
                            }
                          >
                            <Trash2 size={16} />
                          </Button>
                        ) : (
                          <></>
                        )}
                      </div> */}

                        {/* Status di kolom 3, menggunakan flex untuk posisikan di bawah */}
                        {/* <div className="col-span-1 flex justify-end items-end">
                        {item.status && (
                          <span className="text-xs text-gray-400">
                            {item.status}
                          </span>
                        )}
                      </div> */}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm">
                    Tidak ada barang ditemukan.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Floating Upload Button */}

        {listInboundScanned.length > 0 && (
          <Button
            onClick={() => setShowConfirmModal(true)}
            className="fixed bottom-6 right-6 rounded-full shadow-lg h-14 w-14 p-0"
          >
            <Check size={28} />
          </Button>
        )}

        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Putaway Confirmation</DialogTitle>
            </DialogHeader>

            <div className="relative">
              <label htmlFor="location2" className="text-sm text-gray-600">Destination Location</label>
              <Input
                className="w-full mt-1 relative"
                autoComplete="off"
                id="location2"
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
              <Button
                onClick={() => {
                  console.log(typeof inbound, inbound);
                  if (inbound) {
                    handleConfirmPutaway(
                      Array.isArray(inbound) ? inbound[0] : inbound
                    );
                  }
                }}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default PutawayPage;
