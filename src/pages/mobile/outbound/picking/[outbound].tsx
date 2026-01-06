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
import { InventoryPolicy } from "@/types/inventory";
import { is } from "date-fns/locale";

// Types
interface ScanItem {
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
  const { outbound } = router.query;

  const [scanUom, setScanUom] = useState("");
  const [scanQa, setScanQa] = useState("A");
  const [scanType, setScanType] = useState("SERIAL");
  const [scanWhs, setScanWhs] = useState("CKY");
  const [scanLocation, setScanLocation] = useState("");
  const [scanBarcode, setScanBarcode] = useState("");
  const [packingNo, setPackingNo] = useState("");
  const [packCtnNo, setPackCtnNo] = useState("");
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

  const [invPolicy, setInvPolicy] = useState<InventoryPolicy>();

  const handleScan = async () => {

    if (!scanBarcode.trim() || serialInputs.length === 0) return;

    const serialNumber =
      serialInputs.length > 1
        ? serialInputs.filter((s) => s.trim() !== "").join("-")
        : serialInputs[0].trim();

    const newItem: ScanItem = {
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

    // return

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
        owner_code: item.owner_code,
        is_serial: item.is_serial,
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
        barcode_data_scan: item.barcode_data_scan,
        location_scan: item.location_scan,
        qty_data_scan: item.qty_data_scan,
        uom_scan: item.uom_scan,
        is_serial: item.is_serial,
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
      <PageHeader title={`Scan ${outbound}`} showBackButton />
      <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-24 max-w-md mx-auto">
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
                  <div className="flex items-center space-x-2">
                    <label
                      htmlFor="packing_no"
                      className="text-sm text-gray-600 whitespace-nowrap"
                    >
                      Pack No :
                    </label>

                    <div className="relative w-full">
                      <Input
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
                  <div className="flex items-center space-x-2">
                    <label
                      htmlFor="packing_no"
                      className="text-sm text-gray-600 whitespace-nowrap me-2"
                    >
                      Ctn No  :
                    </label>

                    <Input
                      className="text-sm h-8"
                      autoComplete="off"
                      id="ctn_no"
                      placeholder="Entry ctn no..."
                      value={packCtnNo}
                      onChange={(e) => {
                        const val = e.target.value;

                        // optional: cuma boleh angka
                        if (/^\d*$/.test(val)) {
                          setPackCtnNo(val);
                        }
                      }}
                    />

                  </div>
                </>
              )}

              <div className="flex items-center space-x-2">
                <label
                  htmlFor="barcode"
                  className="text-sm text-gray-600 whitespace-nowrap"
                >
                  Barcode :
                </label>

                <div className="relative w-full">
                  <Input
                    className="text-sm h-8"
                    autoComplete="off"
                    id="barcode"
                    placeholder="Entry barcode..."
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
          <span className="ml-2">
            Total Qty :
            {filteredItems.reduce((total, item) => total + item.scan_qty, 0)}/
            {filteredItems.reduce((total, item) => total + item.quantity, 0)}
          </span>
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
                    {/* Info Barang */}
                    <div className="text-xs font-mono space-y-0">
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
              <DialogTitle className="font-mono">Scanned Items</DialogTitle>
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
                          <div className="font-semibold text-sm font-mono mb-2">
                            Item scan: {(items as ScannedItem[])?.length}, Qty scan:{" "}
                            {items?.reduce(
                              (total, item) => total + item.qty_data_scan,
                              0
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
                                  <strong>Barcode:</strong> {item.barcode_data_scan}
                                  <br />
                                  {item.is_serial && (
                                    <>
                                      <strong>Serial:</strong> {item.serial_number}
                                      <br />
                                    </>
                                  )}
                                  <strong>Qty:</strong> {item.qty_data_scan} {item.uom_scan}
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-4 mt-2">
                                <div className="col-span-2 flex items-center">
                                  {item.status === "pending" && (
                                    <Button
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
                                      {/* <Trash2 size={16} /> */}
                                      Delete
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
      </div >

      {/* Modal Dialog */}
      {
        showDialog && (
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
        )
      }
    </>
  );
};

export default CheckingPage;
