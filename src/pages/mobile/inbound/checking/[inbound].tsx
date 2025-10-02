/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
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
import { Car, Edit, Save, Trash2 } from "lucide-react";
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
import data from "@/pages/wms/stock-take/data";
import { se } from "date-fns/locale";

// Types
interface ScanItem {
  inboundNo: string;
  id?: number;
  location: string;
  barcode: string;
  serial: string;
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
  is_serial: boolean;
  uom?: string;
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
  is_serial?: boolean;
}

const CheckingPage = () => {
  const router = useRouter();
  const { inbound } = router.query;

  const [scanQa, setScanQa] = useState("A");
  const [scanType, setScanType] = useState("SERIAL");
  const [scanLocation, setScanLocation] = useState("");
  const [scanBarcode, setScanBarcode] = useState("");
  const [scanSerial, setScanSerial] = useState("");
  const [serialInputs, setSerialInputs] = useState([""]);
  const [searchInboundDetail, setSearchInboundDetail] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showModalDetail, setShowModalDetail] = useState(false);
  const [scanQty, setScanQty] = useState<string | number>(1);

  const [editInboundBarcode, setEditInboundBarcode] = useState(false);
  const [itemEditBarcode, setItemEditBarcode] = useState<ScannedItem>(null);

  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [isSerial, setIsSerial] = useState<boolean>(false);
  const qtyRef = useRef<HTMLInputElement>(null);
  const serialRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
      serialNumber = scanBarcode.trim();
    }

    if (isSerial && serialNumber === "") {
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
      qaStatus: scanQa,
      serial: serialNumber,
      qtyScan: scanQty as number,
      uploaded: false,
    };

    const response = await api.post("/mobile/inbound/scan", newItem);
    const data = await response.data;
    if (data.success) {
      eventBus.emit("showAlert", {
        title: "Success!",
        description: data.message,
        type: "success",
      });
      fetchInboundDetail();
      closeDialog();
    }
  };

  const fetchInboundDetail = async () => {
    const response = await api.get("/mobile/inbound/detail/" + inbound);
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
        is_serial: item.is_serial,
        uom: item.uom,
      }));

      setListInboundDetail(filtered);
    }
  };

  const fetchScannedItems = async (id?: number) => {
    console.log("ID Inbound Detail:", id);

    const response = await api.get("/mobile/inbound/scan/" + id);
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
      const response = await api.delete("/mobile/inbound/scan/" + index);
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
        dataToPost
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

  useEffect(() => {
    if (!showModalDetail && inbound) {
      fetchInboundDetail();
    }
  }, [showModalDetail]);

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Barcode submitted:");

    if (scanBarcode.trim() === "") {
      document.getElementById("barcode")?.focus();
      return;
    }

    if (scanLocation.trim() === "") {
      document.getElementById("location")?.focus();
      return;
    }

    const newItem: ScanItem = {
      inboundNo: Array.isArray(inbound) ? inbound[0] : inbound,
      id: 0,
      location: scanLocation.trim(),
      barcode: scanBarcode.trim(),
      scanType: scanType,
      qaStatus: scanQa,
      serial: "",
      qtyScan: scanQty as number,
      uploaded: false,
    };

    const response = await api.post("/mobile/inbound/check", newItem);
    const res = await response.data;

    if (res.success) {
      if (res.is_serial) {
        console.log("Item requires serial:", res);
        setIsSerial(res.is_serial);
        setScanSerial("");
        setShowDialog(true);
      } else {
        console.log("Item requires serial:", res);
        setIsSerial(res.is_serial);
        setShowDialog(true);
      }
    }
  };

  const handleSerialSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // ⬅️ cegah submit default
    // cari index pertama yang kosong
    const emptyIndex = serialInputs.findIndex((s) => s.trim() === "");

    if (emptyIndex !== -1) {
      // fokus ke input yang kosong
      const target = document.getElementById(`serial-${emptyIndex}`);
      target?.focus();
      return; // stop submit
    }

    // kalau semua sudah terisi
    console.log("Submit:", serialInputs);

    handleScan();
  };
  const handleQuantitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Quantity submitted:", scanQty);
    handleScan();
  };

  const closeDialog = () => {
    setShowDialog(false);
    const newSerials = serialInputs.map(() => "");
    setSerialInputs(newSerials);
    setScanBarcode("");
    setScanBarcode("");
    setScanQty(1);
    document.getElementById("barcode")?.focus();
  };

  const [initialFocusDone, setInitialFocusDone] = useState(false);
  useEffect(() => {
    if (isSerial) {
      if (
        showDialog &&
        isSerial &&
        !initialFocusDone &&
        serialInputs.length > 1
      ) {
        const firstInput = document.getElementById(
          "serial-0"
        ) as HTMLInputElement;
        firstInput?.focus();
        setInitialFocusDone(true);
      } else {
        const firstInput = document.getElementById(
          "serial-0"
        ) as HTMLInputElement;
        firstInput?.focus();
        setInitialFocusDone(false);
      }
    } else {
      const firstInput = document.getElementById("qty") as HTMLInputElement;
      firstInput?.focus();
    }
  }, [showDialog, isSerial, initialFocusDone]);

  return (
    <>
      <PageHeader title={`Checking ${inbound}`} showBackButton />
      <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-24 max-w-md mx-auto">
        <Card className="mb-4">
          <CardContent className="p-4 space-y-3">
            <form onSubmit={handleBarcodeSubmit} className="mb-0">
              <div className="relative mb-2">
                <label htmlFor="location" className="text-sm text-gray-600">
                  Receive Location :
                </label>
                <div className="flex items-center mt-1">
                  <Input
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    className="w-full pr-10"
                    id="location"
                    value={scanLocation}
                    onChange={(e) => setScanLocation(e.target.value)}
                    onInput={(e) =>
                      setScanLocation((e.target as HTMLInputElement).value)
                    }
                    onPaste={(e) => {
                      const pastedData = e.clipboardData.getData("text");
                      setScanLocation(pastedData);
                    }}
                    inputMode="text"
                    autoFocus
                  />
                </div>

                {scanLocation && (
                  <button
                    type="button"
                    className="absolute right-2 top-11 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => {
                      setScanLocation("");
                      document.getElementById("location")?.focus();
                    }}
                  >
                    <XCircle size={18} />
                  </button>
                )}
              </div>

              <div className="relative mb-2">
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
                    className="absolute right-2 top-11 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => {
                      setScanBarcode("");
                      document.getElementById("barcode")?.focus();
                    }}
                  >
                    <XCircle size={18} />
                  </button>
                )}
              </div>

              <Button type="submit" className="w-full mt-2">
                Check Item
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <span className="ml-2">
            Total Qty :{" "}
            {filteredItems.reduce((total, item) => total + item.quantity, 0)}
          </span>
        </div>

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
                    <div className="text-sm space-y-1 relative">
                      <div className="flex justify-between">
                        <div>
                          <span className="text-gray-600">Item Code:</span>{" "}
                          {item.item_code} <br />
                          <span className="text-gray-600">Barcode:</span>{" "}
                          {item.barcode} <br />
                          <span className="text-gray-600">Scanned:</span>{" "}
                          {item.scan_qty} / {item.quantity}{" "}
                          <span className="text-gray-600">
                            {item.uom.toLowerCase()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-600">SN :</span>{" "}
                          {item.is_serial ? "Yes" : "No"}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-400">Item not found.</div>
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
          <DialogContent
            onOpenAutoFocus={(e) => e.preventDefault()}
            className="bg-white"
          >
            <DialogHeader>
              <DialogTitle>Detail Scanned Items</DialogTitle>
            </DialogHeader>

            <Input
              className="w-full"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="text-sm">
              <span>Total Scanned: {filteredScannedItems.length}</span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredScannedItems.length > 0 ? (
                filteredScannedItems.map((item, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                      item.status === "in stock" ? "bg-green-50" : "bg-blue-50"
                    }`}
                  >
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>
                          <strong>Barcode:</strong> {item.barcode}
                        </span>
                        <span className="text-gray-400">{item.status}</span>
                      </div>
                      <div>
                        <strong>Serial:</strong> {item.serial_number}
                      </div>
                      <div>
                        <strong>Location:</strong> {item.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <strong>Qty:</strong>
                        {editInboundBarcode ? (
                          <Input
                            key={item.id}
                            defaultValue={item.quantity}
                            type="number"
                            className="w-16 h-6 text-xs text-center"
                            onChange={(e) =>
                              setItemEditBarcode({
                                ...item,
                                quantity: Number.parseInt(e.target.value),
                              })
                            }
                          />
                        ) : (
                          item.quantity
                        )}
                      </div>
                    </div>

                    {item.status === "pending" && (
                      <div className="mt-2 flex justify-start">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleRemoveItem(item.id, item.inbound_detail_id)
                          }
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm text-center py-4">
                  No items found
                </div>
              )}
            </div>

            <DialogFooter></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modal Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex  sm:items-center justify-center z-50 p-4 ">
          <div className="bg-white rounded-b-lg  rounded-t-lg sm:rounded-lg shadow-xl w-full max-w-md max-h-[80vh] sm:max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-2 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800 pr-4">
                {/* {currentItem.name} */}
              </h2>
              <button
                onClick={closeDialog}
                className="text-gray-400 hover:text-gray-600 text-2xl sm:text-xl p-1 -m-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                // disabled={isLoading}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            <div className="px-4 sm:px-6 py-4 pb-6">
              <div className="mb-4 p-3 bg-gray-100 rounded-md">
                <p className="text-sm text-gray-600 break-all">
                  Barcode: <span className="font-mono">{scanBarcode}</span>
                </p>
                {/* Location Display in Modal */}
                {location && (
                  <p className="text-sm text-gray-600 mt-1">
                    Location:{" "}
                    <span className="font-medium">{scanLocation}</span>
                  </p>
                )}
              </div>

              {isSerial ? (
                /* Serial Number Input */
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
                  <div className="mb-6">
                    <div className="relative">
                      <label htmlFor="qty" className="text-sm text-gray-600">
                        Qty :{" "}
                      </label>
                      <Input
                        min={1}
                        type="number"
                        className="w-full mt-1"
                        id="qty"
                        value={scanQty}
                        autoComplete="off"
                        onChange={(e) => {
                          const val = e.target.value;

                          // kalau kosong biarkan kosong
                          if (val === "") {
                            setScanQty("");
                            return;
                          }

                          // kalau angka, paksa minimal 1
                          const num = Number(val);
                          setScanQty(num < 1 ? 1 : num);
                        }}
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
