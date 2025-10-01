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
  serial_no?: string;
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
  scan_qty?: number;
  has_serial?: string;
  uom?: string;
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
  // const [qtyScan, setQtyScan] = useState<number>(1);

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

  const [listOutboundDetail, setListOutboundDetail] = useState<
    OutboundDetail[]
  >([]);

  const [listOutboundScanned, setListOutboundScanned] = useState<ScannedItem[]>(
    []
  );

  const handleScan = async () => {
    // if (scanType === "BARCODE") {
    //   setScanSerial(scanBarcode);
    //   if (!scanLocation.trim()) {
    //     return eventBus.emit("showAlert", {
    //       title: "Error!",
    //       description: "Please input location",
    //       type: "error",
    //     });
    //   }
    // }

    // if (!scanBarcode.trim() || !scanSerial.trim()) return;

    if (!scanBarcode.trim() || serialInputs.length === 0) return;

    const serialNumber =
      serialInputs.length > 1
        ? serialInputs.filter((s) => s.trim() !== "").join("-")
        : serialInputs[0].trim();

    const newItem: ScanItem = {
      outbound_no: Array.isArray(outbound) ? outbound[0] : outbound,
      barcode: scanBarcode,
      serial_no: serialNumber,
      qty: scanQty as number,
    };

    setIsLoading(true);

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
        // document.getElementById("barcode")?.focus();
        fetchOutboundDetail();
        closeDialog();
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
        outbound_detail_id: item.outbound_detail_id,
        item_code: item.item_code,
        barcode: item.barcode,
        quantity: item.quantity,
        scan_qty: item.scan_qty,
        has_serial: item.has_serial,
        uom: item.uom,
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

  // useEffect(() => {
  //   if (scanType === "SERIAL") {
  //     setScanSerial("");
  //     setScanLocation("");
  //     setQtyScan(1);
  //   }
  // }, [scanType]);

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
        console.log("Item requires serial:", res);
        setIsSerial(res.is_serial);
        setScanSerial("");
        setShowDialog(true);
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

  return (
    <>
      <PageHeader title={`Scan Pick List ${outbound}`} showBackButton />
      <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-24 max-w-md mx-auto">
        <form onSubmit={handleBarcodeSubmit} className="mb-0">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="barcode"
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
              <Button type="submit" className="w-full">
                Check
              </Button>
            </CardContent>
          </Card>
        </form>

        {/* {scanType === "SERIAL" && (
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
        )} */}

        {/* loading */}
        {isLoading && (
          <div className="flex justify-center">
            <Loader2 className="animate-spin" />
            <span className="ml-2">Loading...</span>
          </div>
        )}

        <div className="flex justify-center">
          {/* <Loader2 className="animate-spin" /> */}
          <span className="ml-2">Total Qty : {filteredItems.reduce((total, item) => total + item.quantity, 0)}</span>
        </div>

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

        <Dialog open={showModalDetail} onOpenChange={setShowModalDetail}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Scanned Items</DialogTitle>
            </DialogHeader>

            <Input className="w-full" placeholder="Search ..." />

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
                            Items: {(items as ScannedItem[])?.length}, Qty:{" "}
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
                                  <strong>Qty:</strong> {item.quantity}
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-4 mt-2">
                                <div className="col-span-2 flex items-center">
                                  {item.status === "pending" && (
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
                      This item has not been scanned.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  This item has not been scanned.
                </div>
              )}
            </div>

            <DialogFooter>
              {/* Kosongkan atau tambahkan tombol lain di sini */}
            </DialogFooter>
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
                {outbound && (
                  <p className="text-sm text-gray-600 mt-1">
                    Picking ID : <span className="font-medium">{outbound}</span>
                  </p>
                )}
                <p className="text-sm text-gray-600 break-all">
                  Barcode : <span className="font-mono">{scanBarcode}</span>
                </p>
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
                          if (val === "") {
                            setScanQty("");
                            return;
                          }
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
