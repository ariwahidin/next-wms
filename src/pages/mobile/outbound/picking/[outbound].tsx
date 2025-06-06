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
import { Loader2, Trash2 } from "lucide-react";
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
import { set } from "date-fns";

// Types
interface ScanItem {
  scan_type?: string;
  outbound_no: string;
  barcode: string;
  serial_no: string;
  qty?: number;
  seq_box?: number;
  location?: string;
}

interface OutboundDetail {
  id: number;
  outbound_no: string;
  outbound_detail_id: number;
  item_code: string;
  barcode: string;
  quantity: number;
  scan_qty: number;
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
  status?: string;
}

const CheckingPage = () => {
  const router = useRouter();
  const { outbound } = router.query;

  const [scanQa, setScanQa] = useState("A");
  const [scanType, setScanType] = useState("SERIAL");
  const [scanWhs, setScanWhs] = useState("CKY");
  const [scanLocation, setScanLocation] = useState("");
  const [scanBarcode, setScanBarcode] = useState("");
  const [scanSerial, setScanSerial] = useState("");
  const [qtyScan, setQtyScan] = useState<number>(1);
  


  const [searchOutboundDetail, setSearchOutboundDetail] = useState("");


  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showModalDetail, setShowModalDetail] = useState(false);
  const [seqBox, setSeqBox] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);

  const [listOutboundDetail, setListOutboundDetail] = useState<
    OutboundDetail[]
  >([]);

  const [listOutboundScanned, setListOutboundScanned] = useState<ScannedItem[]>(
    []
  );

  const handleScan = async () => {
    if (scanType === "BARCODE") {
      setScanSerial(scanBarcode);
      if (!scanLocation.trim()) {
        return eventBus.emit("showAlert", {
          title: "Error!",
          description: "Please input location",
          type: "error",
        })
      };
    }

    if (!scanBarcode.trim() || !scanSerial.trim()) return;

    const newItem: ScanItem = {
      scan_type: scanType,
      outbound_no: Array.isArray(outbound) ? outbound[0] : outbound,
      barcode: scanBarcode,
      serial_no: scanSerial,
      qty: qtyScan,
      seq_box: seqBox,
      location : scanLocation
    };

    setIsLoading(true);

    try {
      const response = await api.post(
        "/mobile/outbound/picking/scan",
        newItem,
        {
          withCredentials: true,
        }
      );
      const data = await response.data;
      setIsLoading(false);
      if (data.success) {
        eventBus.emit("showAlert", {
          title: "Success!",
          description: data.message,
          type: "success",
        });
        // setScanBarcode("");
        // setScanSerial("");
        document.getElementById("barcode")?.focus();
        fetchOutboundDetail();
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error during scan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOutboundDetail = async () => {
    const response = await api.get("/mobile/outbound/detail/" + outbound, {
      withCredentials: true,
    });
    const data = await response.data;
    // return data;
    if (data.success) {
      const filtered = data.data.map((item: any) => ({
        id: item.ID,
        outbound_detail_id: item.ID,
        item_code: item.item_code,
        barcode: item.barcode,
        quantity: item.quantity,
        scan_qty: item.scan_qty,
      }));

      setListOutboundDetail(filtered);
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
      }));

      setListOutboundScanned(filtered);
    }
  };

  const handleRemoveItem = async (
    index: number,
    outbound_detail_id: number
  ) => {
    // console.log("ID Outbound Barcode :", index, outbound_detail_id);
    // console.log("ID Outbound Detail :", outbound_detail_id);
    // fetchScannedItems(outbound_detail_id);
    // fetchOutboundDetail();

    // return;

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
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const filteredItems =
    listOutboundDetail.filter(
      (item) =>
        item?.item_code.toLowerCase().includes(searchOutboundDetail.toLowerCase()) ||
        item?.barcode.toLowerCase().includes(searchOutboundDetail.toLowerCase()) ||
        item?.quantity.toString().includes(searchOutboundDetail.toLowerCase()) ||
        item?.scan_qty.toString().includes(searchOutboundDetail.toLowerCase())
    ) || [];

  const filteredScannedItems =
    listOutboundScanned.filter(
      (item) =>
        item?.id.toString().includes(searchTerm.toLowerCase()) ||
        item?.outbound_detail_id
          .toString()
          .includes(searchTerm.toLowerCase()) ||
        item?.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item?.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item?.location.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

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
  }, [outbound]);

  useEffect(() => {
    if (scanType === "SERIAL") {
      setScanSerial("");
      setScanLocation("");
      setQtyScan(1);
    }
  }, [scanType]);

  return (
    <>
      <PageHeader title={`Picking ${outbound}`} showBackButton />
      <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-24">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="relative flex gap-2">
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="serial"
                  className="text-sm text-gray-600 whitespace-nowrap"
                >
                  Scan Type :
                </label>

                <Select value={scanType} onValueChange={setScanType}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Scan Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SERIAL">Serial</SelectItem>
                    <SelectItem value="BARCODE">Barcode</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <label
                  htmlFor="serial"
                  className="text-sm text-gray-600 whitespace-nowrap"
                >
                  Koli :
                </label>

                <div className="relative">
                  <Input
                    type="number"
                    id="seq_box"
                    placeholder="Koli..."
                    value={seqBox}
                    onChange={(e) => setSeqBox(Number(e.target.value))}
                  />
                  {seqBox && (
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => {
                        setSeqBox(0);
                        document.getElementById("seq_box")?.focus();
                      }}
                    >
                      <XCircle size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <label
                htmlFor="serial"
                className="text-sm text-gray-600 whitespace-nowrap"
              >
                Barcode :
              </label>

              <div className="relative w-full">
                <Input
                  autoComplete="off"
                  id="barcode"
                  placeholder="Scan barcode..."
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

            {scanType === "SERIAL" && (
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="serial"
                  className="text-sm text-gray-600 whitespace-nowrap"
                >
                  Serial No :
                </label>
                <div className="relative w-full">
                  <Input
                    id="serial"
                    autoComplete="off"
                    placeholder="Serial number..."
                    value={scanSerial}
                    onChange={(e) => setScanSerial(e.target.value)}
                  />
                  {scanSerial && (
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => {
                        setScanSerial("");
                        document.getElementById("serial")?.focus();
                      }}
                    >
                      <XCircle size={18} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {scanType === "BARCODE" && (
              <>
                <div className="flex items-center space-x-2">
                  <label
                    htmlFor="location"
                    className="text-sm text-gray-600 whitespace-nowrap"
                  >
                    Location :
                  </label>

                  <div className="relative w-full">
                    <Input
                      type="text"
                      id="location"
                      placeholder="Enter location ..."
                      value={scanLocation}
                      onChange={(e) => setScanLocation(e.target.value)}
                    />
                    {scanLocation.length > 0 && (
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
                <div className="flex items-center space-x-2">
                  <label
                    htmlFor="qtyScan"
                    className="text-sm text-gray-600 whitespace-nowrap"
                  >
                    Qty Scan :
                  </label>

                  <div className="relative w-full">
                    <Input
                      type="number"
                      id="qtyScan"
                      placeholder="Quantity to scan..."
                      value={qtyScan}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        // agar 0 diawal tidak ditampilkan
                        if (value.length > 0 && value[0] === "0") {
                          e.target.value = value.slice(1);
                          setQtyScan(Number(value.slice(1)));
                        } else {
                          setQtyScan(Number(value));
                        }
                      }}
                    />
                    {qtyScan > 0 && (
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => {
                          setQtyScan(0);
                          document.getElementById("qtyScan")?.focus();
                        }}
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            <Button onClick={handleScan} className="w-full">
              Add
            </Button>
          </CardContent>
        </Card>

        {/* loading */}
        {isLoading && (
          <div className="flex justify-center">
            <Loader2 className="animate-spin" />
            <span className="ml-2">Loading...</span>
          </div>
        )}

        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <Input
                className="w-full"
                placeholder="Search items..."
                value={searchOutboundDetail}
                onChange={(e) => setSearchOutboundDetail(e.target.value)}
              />
            </div>

            {/* List Items */}
            {filteredItems.length > 0 ? (
              <ul className="space-y-3">
                {filteredItems.map((item, idx) => (
                  <li
                    onClick={() => {
                      fetchScannedItems(item.outbound_detail_id);
                      setShowModalDetail(true);
                    }}
                    key={idx}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between border p-3 rounded cursor-pointer hover:bg-gray-100`}
                  >
                    {/* Info Barang */}
                    <div className="text-sm space-y-1">
                      <div>
                        <strong>Item Code:</strong> {item.item_code}
                      </div>
                      <div>
                        <strong>Barcode:</strong> {item.barcode}
                      </div>
                      <div>
                        <strong>Scanned:</strong> {item.scan_qty} /{" "}
                        {item.quantity}
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

        {/* <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Putaway Confirmation</DialogTitle>
            </DialogHeader>
            <p>
              Are you sure you want to confirm the putaway in location{" "}
              {scanLocation}?
            </p>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setShowConfirmModal(false)}
              >
                Batal
              </Button>
              <Button
                onClick={() => {
                  if (outbound) {
                    handleConfirmPutaway(
                      Array.isArray(outbound) ? outbound[0] : outbound
                    );
                  }
                }}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog> */}

        <Dialog open={showModalDetail} onOpenChange={setShowModalDetail}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Detail picked items</DialogTitle>
            </DialogHeader>

            <Input
              className="w-full"
              placeholder="Cari barang..."
              // value={searchTerm}
              // onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* <div className="text-sm">
              <span>Total Scanned: {filteredScannedItems.length}</span>
            </div> */}

            {/* ListView */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {filteredScannedItems.length > 0 ? (
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {Object.keys(groupedItems).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(groupedItems).map(([koli, items]) => (
                        <div
                          key={koli}
                          className="p-2 border rounded-md bg-gray-50"
                        >
                          <div className="font-semibold text-sm mb-2">
                            Koli: {koli}, Items:{" "}
                            {(items as ScannedItem[])?.length}, Qty:{" "}
                            {items?.reduce(
                              (total, item) => total + item.quantity,
                              0
                            )}
                          </div>
                          {items?.map((item, index) => (
                            <div
                              key={index}
                              className={`p-2 border rounded-md cursor-pointer mb-2 ${
                                item.status === "in stock"
                                  ? "bg-green-100"
                                  : "bg-blue-100"
                              }`}
                            >
                              <div className="text-sm space-y-1">
                                <div>
                                  <strong>Barcode:</strong> {item.barcode}
                                  <br />
                                  <strong>Serial:</strong> {item.serial_number}
                                  <br />
                                  <strong>Location:</strong> {item.location}
                                  <br />
                                  <strong>Qty:</strong> {item.quantity}
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-4 mt-2">
                                <div className="col-span-2 flex items-center">
                                  {item.status === "picking" && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() =>
                                        handleRemoveItem(
                                          item.id,
                                          item.outbound_detail_id
                                        )
                                      }
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  )}
                                </div>
                                <div className="col-span-1 flex justify-end items-end">
                                  {item.status && (
                                    <span className="text-xs text-gray-400">
                                      {item.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">
                      Tidak ada barang ditemukan.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  Tidak ada barang ditemukan.
                </div>
              )}
            </div>

            <DialogFooter>
              {/* Kosongkan atau tambahkan tombol lain di sini */}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default CheckingPage;
