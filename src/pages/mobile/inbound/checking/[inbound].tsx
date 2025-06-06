/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/mobile/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Car, Trash2 } from "lucide-react";
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
  inboundNo: string;
  id?: number;
  location: string;
  barcode: string;
  serial: string;
  whsCode: string;
  qaStatus: string;
  scanType: string;
  qtyScan: number;
  uploaded: boolean;
}

interface InboundDetail {
  id: number;
  inbound_no: string;
  inbound_detail_id: number;
  item_code: string;
  barcode: string;
  quantity: number;
  scan_qty: number;
}

interface ScannedItem {
  id?: number;
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

const CheckingPage = () => {
  const router = useRouter();
  const { inbound } = router.query;

  const [scanQa, setScanQa] = useState("A");
  const [scanType, setScanType] = useState("SERIAL");
  const [scanWhs, setScanWhs] = useState("CKY");
  const [scanLocation, setScanLocation] = useState("");
  const [scanBarcode, setScanBarcode] = useState("");
  const [scanSerial, setScanSerial] = useState("");
  const [serialInputs, setSerialInputs] = useState([""]); // mulai dengan 1 input
  const [searchInboundDetail, setSearchInboundDetail] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showModalDetail, setShowModalDetail] = useState(false);
  const [scanQty, setScanQty] = useState(1);

  const [listInboundDetail, setListInboundDetail] = useState<InboundDetail[]>(
    []
  );

  const [listInboundScanned, setListInboundScanned] = useState<ScannedItem[]>(
    []
  );

  const handleScan = async () => {
    // if (!scanLocation.trim() || !scanBarcode.trim() || !scanSerial.trim())
    if (
      !scanLocation.trim() ||
      !scanBarcode.trim() ||
      serialInputs.length === 0
    )
      return;

    let serialNumber =
      serialInputs.length > 1
        ? serialInputs.filter((s) => s.trim() !== "").join("-")
        : serialInputs[0].trim();

    if (scanType === "BARCODE") {
      // setScanSerial(scanBarcode);
      serialNumber = scanBarcode.trim();
    }

    if (serialNumber === "") {
      eventBus.emit("showAlert", {
        title: "Error!",
        description: "Serial number cannot be empty.",
        type: "error",
      });
      return;
    }

    const newItem: ScanItem = {
      inboundNo: Array.isArray(inbound) ? inbound[0] : inbound,
      id: 0,
      location: scanLocation.trim(),
      barcode: scanBarcode.trim(),
      scanType: scanType,
      whsCode: scanWhs,
      qaStatus: scanQa,
      serial: serialNumber,
      qtyScan: scanQty,
      uploaded: false,
    };

    const response = await api.post("/mobile/inbound/scan", newItem, {
      withCredentials: true,
    });
    const data = await response.data;
    if (data.success) {
      eventBus.emit("showAlert", {
        title: "Success!",
        description: data.message,
        type: "success",
      });
      fetchInboundDetail();
    }
  };

  const fetchInboundDetail = async () => {
    const response = await api.get("/mobile/inbound/detail/" + inbound, {
      withCredentials: true,
    });
    const data = await response.data;
    // return data;
    if (data.success) {
      const filtered = data.data.map((item: any) => ({
        id: item.ID,
        inbound_detail_id: item.ID,
        item_code: item.item_code,
        barcode: item.barcode,
        quantity: item.quantity,
        scan_qty: item.scan_qty,
      }));

      setListInboundDetail(filtered);
    }
  };

  const fetchScannedItems = async (id?: number) => {
    console.log("ID Inbound Detail:", id);

    const response = await api.get("/mobile/inbound/scan/" + id, {
      withCredentials: true,
    });
    const data = await response.data;
    if (data.success) {
      const filtered = data.data.map((item: any) => ({
        id: item.ID,
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
  };

  const handleRemoveItem = async (index: number, inbound_detail_id: number) => {
    console.log("ID Inbound Barcod :", index, inbound_detail_id);

    try {
      const response = await api.delete("/mobile/inbound/scan/" + index, {
        withCredentials: true,
      });
      const data = await response.data;
      if (data.success) {
        fetchScannedItems(inbound_detail_id);
        fetchInboundDetail();
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleConfirmPutaway = async (inbound_no: string) => {
    const dataToPost = {
      inboundNo: inbound_no,
      location: scanLocation,
    };

    try {
      const response = await api.put(
        "/mobile/inbound/scan/putaway/" + inbound_no,
        dataToPost,
        {
          withCredentials: true,
        }
      );

      const data = await response.data;

      if (data.success) {
        // fetchScannedItems();
        setShowConfirmModal(false);

        eventBus.emit("showAlert", {
          title: "Success!",
          description: data,
          type: "success",
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const filteredItems =
    listInboundDetail.filter(
      (item) =>
        item?.item_code
          .toLowerCase()
          .includes(searchInboundDetail.toLowerCase()) ||
        item?.barcode
          .toLowerCase()
          .includes(searchInboundDetail.toLowerCase()) ||
        item?.quantity.toString().includes(searchInboundDetail.toLowerCase()) ||
        item?.scan_qty.toString().includes(searchInboundDetail.toLowerCase())
    ) || [];

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
    if (inbound) fetchInboundDetail();
  }, [inbound]);

  useEffect(() => {
    console.log("Data terbaru:", listInboundScanned);
  }, [listInboundScanned]);

  useEffect(() => {
    if (scanType === "SERIAL") {
      setScanQty(1);
      setScanSerial("");
    }
  }, [scanType]);

  return (
    <>
      <PageHeader title={`Checking ${inbound}`} showBackButton />
      <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-24 max-w-md mx-auto">
        <Card className="mb-4">
          <CardContent className="p-4 space-y-3">
            <div className="relative flex gap-2">
              <div className="flex items-center gap-2 flex-1">
                <label className="text-sm text-gray-600">Type : </label>
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

              {/* <Select value={scanWhs} onValueChange={setScanWhs}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Scan Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CKY">CKY</SelectItem>
                  <SelectItem value="CKZ">CKZ</SelectItem>
                </SelectContent>
              </Select> */}

              <div className="flex items-center gap-2 flex-1">
                <label htmlFor="scanQa" className="text-sm text-gray-600">
                  Status :
                </label>
                <Select value={scanQa} onValueChange={setScanQa}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Scan Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="relative">
              <label htmlFor="location" className="text-sm text-gray-600">
                Receive Location :{" "}
              </label>
              <Input
                autoComplete="off"
                className="w-full mt-1"
                id="location"
                // placeholder="Location ..."
                value={scanLocation}
                onChange={(e) => setScanLocation(e.target.value)}
              />
              {scanLocation && (
                <button
                  type="button"
                  className="absolute right-3 top-11 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setScanLocation("");
                    document.getElementById("location")?.focus();
                  }}
                >
                  <XCircle size={18} />
                </button>
              )}
            </div>

            <div className="relative">
              <label htmlFor="barcode" className="text-sm text-gray-600">
                Barcode :{" "}
              </label>
              <Input
                autoComplete="off"
                id="barcode"
                className="w-full mt-1"
                // placeholder="Scan barcode ..."
                value={scanBarcode}
                onChange={(e) => setScanBarcode(e.target.value)}
              />
              {scanBarcode && (
                <button
                  type="button"
                  className="absolute right-3 top-11 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setScanBarcode("");
                    document.getElementById("barcode")?.focus();
                  }}
                >
                  <XCircle size={18} />
                </button>
              )}
            </div>

            {scanType === "BARCODE" && (
              <div className="relative">
                <label htmlFor="qty" className="text-sm text-gray-600">
                  Qty :{" "}
                </label>
                <Input
                  className="w-full mt-1"
                  id="qty"
                  // placeholder="Qty ..."
                  value={scanQty}
                  onChange={(e) => setScanQty(Number(e.target.value))}
                />
                {scanQty && (
                  <button
                    type="button"
                    className="absolute right-3 top-11 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => {
                      setScanQty(1);
                      document.getElementById("qty")?.focus();
                    }}
                  >
                    <XCircle size={18} />
                  </button>
                )}
              </div>
            )}

            {/* {scanType === "SERIAL" && (
              <div className="relative">
                <label htmlFor="serial" className="text-sm text-gray-600">Serial Number : </label>
                <Input
                  autoComplete="off"
                  className="w-full mt-1"
                  id="serial"
                  // placeholder="Serial number ..."
                  value={scanSerial}
                  onChange={(e) => setScanSerial(e.target.value)}
                />
                {scanSerial && (
                  <button
                    type="button"
                    className="absolute right-3 top-11 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => {
                      setScanSerial("");
                      document.getElementById("serial")?.focus();
                    }}
                  >
                    <XCircle size={18} />
                  </button>
                )}
              </div>
            )} */}

            {scanType === "SERIAL" && (
              <div className="space-y-3">
                <label className="text-sm text-gray-600">Serial Numbers:</label>

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
                          document.getElementById(`serial-${index}`)?.focus();
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

                    {/* Menampilkan gabungan serial */}
                    <div className="text-sm text-gray-500">
                      Combined:{" "}
                      {serialInputs.filter((s) => s.trim() !== "").join("-")}
                    </div>
                  </>
                )}
              </div>
            )}

            <Button onClick={handleScan} className="w-full">
              Add
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <Input
                className="w-full"
                placeholder="Search ..."
                value={searchInboundDetail}
                onChange={(e) => setSearchInboundDetail(e.target.value)}
              />
            </div>

            {/* List Items */}
            {filteredItems.length > 0 ? (
              <ul className="space-y-3">
                {filteredItems.map((item, idx) => (
                  <li
                    onClick={() => {
                      fetchScannedItems(item.inbound_detail_id);
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

        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
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

        <Dialog open={showModalDetail} onOpenChange={setShowModalDetail}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Detail Scanned Items</DialogTitle>
            </DialogHeader>

            <Input
              className="w-full"
              placeholder="Cari barang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="text-sm">
              <span>Total Scanned: {filteredScannedItems.length}</span>
            </div>

            {/* ListView */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredScannedItems.length > 0 ? (
                filteredScannedItems.map((item, index) => (
                  <div
                    key={index}
                    className={`p-2 border rounded-md hover:bg-gray-100 cursor-pointer ${
                      item.status === "in stock"
                        ? "bg-green-100"
                        : "bg-blue-100"
                    }`}
                  >
                    <div className="text-sm space-y-1">
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
                      <div className="col-span-2 flex items-center">
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
                      </div>

                      {/* Status di kolom 3, menggunakan flex untuk posisikan di bawah */}
                      <div className="col-span-1 flex justify-end items-end">
                        {item.status && (
                          <span className="text-xs text-gray-400">
                            {item.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
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
