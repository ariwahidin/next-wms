/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRouter } from "next/router";
import { use, useEffect, useRef, useState } from "react";
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
import { InventoryPolicy } from "@/types/inventory";
import { Product } from "@/types/item";

// Types
interface ScanItem {
  inboundNo: string;
  id?: number;
  location: string;
  barcode: string;
  serial: string;
  qaStatus: string;
  scanType?: string;
  qtyScan: number;
  RecDate?: string;
  prodDate?: string;
  expDate?: string;
  lotNo?: string;
  uploaded: boolean;
  uom?: string;
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
  owner_code?: string;
  uom?: string;
  exp_date?: string;
  prod_date?: string;
  lot_number?: string;
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
  prod_date?: string;
  exp_date?: string;
  lot_number?: string;
  uom?: string;
  product?: Product;
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

  const [invPolicy, setInvPolicy] = useState<InventoryPolicy>();



  const [prodDate, setProdDate] = useState("");
  const [expDate, setExpDate] = useState("");
  const [lotNo, setLotNo] = useState("");
  const [uom, setUom] = useState("");
  const [scanQty, setScanQty] = useState<string | number>(1);

  const [uniqueProdDates, setUniqueProdDates] = useState([]);
  const [uniqueExpDates, setUniqueExpDates] = useState([]);
  const [uniqueLotNos, setUniqueLotNos] = useState([]);
  const [uniqueQtys, setUniqueQtys] = useState([]);


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
      qaStatus: scanQa,
      serial: serialNumber,
      qtyScan: scanQty as number,
      prodDate: prodDate,
      expDate: expDate,
      lotNo: lotNo,
      uploaded: false,
    };

    console.log("Submitting Scan Item:", newItem);
    // return;

    const response = await api.post("/mobile/inbound/scan", newItem);
    const data = await response.data;
    if (data.success) {
      eventBus.emit("showAlert", {
        title: "Success!",
        description: data.message,
        type: "success",
      });
      fetchInboundDetail();
      if (isSerial) {
        const newSerials = serialInputs.map(() => "");
        setSerialInputs(newSerials);
        const emptyIndex = serialInputs.findIndex((s) => s.trim() === "");
        if (emptyIndex !== -1) {
          // fokus ke input yang kosong
          const target = document.getElementById(`serial-${emptyIndex}`);
          target?.focus();
          return; // stop submit
        }
      }else{
        closeDialog();
      }
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
        owner_code: item.owner_code,
        exp_date: item.exp_date,
        prod_date: item.prod_date,
        lot_number: item.lot_number,
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
        prod_date: item.prod_date,
        uom: item.uom,
        product: item.product,
      }));

      console.log("Filtered Scanned Items:", filtered);

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
        item?.scan_qty.toString().includes(searchInboundDetail.toLowerCase()) ||
        item?.prod_date
    ) || [];

  const filteredScannedItems =
    listInboundScanned.filter(
      (item) =>
        item?.id.toString().includes(searchTerm.toLowerCase()) ||
        item?.inbound_detail_id.toString().includes(searchTerm.toLowerCase()) ||
        item?.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item?.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item?.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item?.prod_date
    ) || [];

  useEffect(() => {
    if (inbound) fetchInboundDetail();
  }, [inbound]);


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
    if (listInboundDetail.length > 0) fetchPolicy(listInboundDetail[0].owner_code);
  }, [listInboundDetail]);



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

      const data = (res.data ?? []) as Array<{
        prod_date: string;
        exp_date: string;
        lot_number: string;
        quantity: number;
        uom: string;
      }>;

      console.log("Check result: ", data);

      // ambil nilai unik
      const prodDates = [...new Set(data.map(d => d.prod_date))];
      const expDates = [...new Set(data.map(d => d.exp_date))];
      const lotNos = [...new Set(data.map(d => d.lot_number))];
      const qtys = [...new Set(data.map(d => d.quantity))];

      console.log("Unique values: ", prodDates, expDates, lotNos, qtys);

      setUniqueProdDates(prodDates);
      setUniqueExpDates(expDates);
      setUniqueLotNos(lotNos);
      setUniqueQtys(qtys);

      // kalau cuma satu data unik, langsung auto-fill
      // if (prodDates.length === 1) setProdDate(prodDates[0]);
      // if (expDates.length === 1) setExpDate(expDates[0]);
      // if (lotNos.length === 1) setLotNo(lotNos[0]);
      // if (qtys.length === 1) setScanQty(qtys[0]);
      if (data.length === 1) {
        setProdDate(data[0].prod_date);
        setExpDate(data[0].exp_date);
        setLotNo(data[0].lot_number);
        setScanQty(data[0].quantity);
        setUom(data[0].uom);
      } else {
        setUom(data[0].uom);
      }

      if (res.is_serial) {
        console.log("Item requires serial:", res);
        setIsSerial(res.is_serial);
        setScanSerial("");
        setScanQty(1);
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
                  EAN :{" "}
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
                        <div className="font-mono text-xs">
                          <span className="text-gray-600">Item Code:</span>{" "}
                          {item.item_code} <br />
                          <span className="text-gray-600">EAN:</span>{" "}
                          {item.barcode} <br />

                          {invPolicy?.use_production_date && (
                            <>
                              <span className="text-gray-600">Prod Date:</span>{" "}
                              {item.prod_date} <br />
                            </>
                          )}
                          {invPolicy?.require_expiry_date && (
                            <>
                              <span className="text-gray-600">Exp Date:</span>{" "}
                              {item.exp_date} <br />
                            </>
                          )}
                          {invPolicy?.use_lot_no && (
                            <>
                              <span className="text-gray-600">Lot No:</span>{" "}
                              {item.lot_number} <br />
                            </>
                          )}

                          <span className="text-gray-600">Scanned:</span>{" "}
                          {item.scan_qty} / {item.quantity}{" "}
                          <span className="text-gray-600">
                            {item.uom}
                          </span>



                        </div>

                        {item.is_serial && (
                          <div className="text-right">
                            <span className="text-gray-600">SN :</span>{" "}
                            {item.is_serial ? "Yes" : "No"}
                          </div>
                        )}




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
                    className={`p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${item.status === "in stock" ? "bg-green-50" : "bg-blue-50"
                      }`}
                  >
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>
                          <strong>EAN:</strong> {item.barcode}
                        </span>
                        <span className="text-gray-400">{item.status}</span>
                      </div>
                      {item.product.has_serial == "Y" && (
                        <div>
                          <strong>Serial:</strong> {item.serial_number}
                        </div>
                      )}
                      {invPolicy?.use_production_date && (
                        <div>
                          <strong>Prod Date:</strong>{" "}
                          {item.prod_date}
                        </div>
                      )}

                      <div>
                        <strong>Location:</strong> {item.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <strong>Qty / Unit:</strong>
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
                          item.quantity + ' ' + item.uom
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
                  EAN: <span className="font-mono">{scanBarcode}</span>
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


                  <div className="space-y-3 mb-6">

                    {invPolicy?.use_production_date && (
                      // Prod Date
                      <>
                        {/* Exp Date */}
                        <div className="flex items-center gap-3">
                          <label htmlFor="prod_date" className="text-sm text-gray-600 w-24 text-right">
                            Prod Date :
                          </label>
                          <div className="relative flex-1">

                            {uniqueProdDates.length > 1 ? (
                              // Kalau banyak, pakai <select> saja
                              <select
                                id="prod_date"
                                className="w-full border rounded p-2"
                                value={prodDate}
                                onChange={(e) => setProdDate(e.target.value)}
                              >
                                <option value="">Choose Production Date...</option>
                                {uniqueProdDates.map((d, i) => (
                                  <option key={i} value={d}>
                                    {d}
                                  </option>
                                ))}
                                {/* <option value="other">Other (manual)</option> */}
                              </select>
                            ) : (
                              // Kalau cuma satu, tetap pakai input date
                              <Input
                                type="date"
                                id="prod_date"
                                className="w-full"
                                value={prodDate}
                                onChange={(e) => setProdDate(e.target.value)}
                              />
                            )}

                            {prodDate && (
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                onClick={() => {
                                  setProdDate("");
                                  document.getElementById("prod_date")?.focus();
                                }}
                              >
                                <XCircle size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}


                    {invPolicy?.require_expiry_date && (
                      <>
                        {/* Exp Date */}
                        <div className="flex items-center gap-3">
                          <label htmlFor="exp_date" className="text-sm text-gray-600 w-24 text-right">
                            Exp Date :
                          </label>
                          <div className="relative flex-1">

                            {uniqueExpDates.length > 0 ? (
                              // Kalau banyak, pakai <select> saja
                              <select
                                id="exp_date"
                                className="w-full border rounded p-2 text-xs"
                                value={expDate}
                                onChange={(e) => setExpDate(e.target.value)}
                              >
                                <option value="">Choose Exp Date...</option>
                                {uniqueExpDates.map((d, i) => (
                                  <option key={i} value={d}>
                                    {d}
                                  </option>
                                ))}
                                {/* <option value="other">Other (manual)</option> */}
                              </select>
                            ) : (
                              // Kalau cuma satu, tetap pakai input date
                              <Input

                                type="date"
                                id="exp_date"
                                className="w-full text-xs"
                                value={expDate}
                                onChange={(e) => setExpDate(e.target.value)}
                              />
                            )}

                            {expDate && (
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                onClick={() => {
                                  setExpDate("");
                                  document.getElementById("exp_date")?.focus();
                                }}
                              >
                                <XCircle size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {invPolicy?.use_lot_no && (
                      <>
                        {/* Lot No */}
                        <div className="flex items-center gap-3">
                          <label htmlFor="lot_no" className="text-sm text-gray-600 w-24 text-right">
                            Lot No :
                          </label>
                          <div className="relative flex-1">
                            <Input
                              type="text"
                              className="w-full text-xs"
                              id="lot_no"
                              list="lotNoOptions"
                              value={lotNo}
                              onChange={(e) => setLotNo(e.target.value)}
                              placeholder="Enter lot number..."
                              autoComplete="off"
                            />
                            <datalist id="lotNoOptions">
                              {uniqueLotNos.map((d, i) => (
                                <option key={i} value={d} />
                              ))}
                            </datalist>
                            {lotNo && (
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                onClick={() => {
                                  setLotNo("");
                                  document.getElementById("lot_no")?.focus();
                                }}
                              >
                                <XCircle size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}




                    {/* Qty */}
                    <div className="mb-6 space-y-1">
                      <div className="flex items-center gap-4">
                        <label htmlFor="qty" className="text-sm text-gray-600 w-24 text-right">
                          Qty / Unit :
                        </label>
                        <div className="flex items-center space-x-3">
                          <Input
                            min={1}
                            type="number"
                            className="w-20 text-xs"
                            id="qty"
                            list="qtyOptions"
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
                          <datalist id="qtyOptions">
                            {uniqueQtys.map((d, i) => (
                              <option key={i} value={d} />
                            ))}
                          </datalist>
                          {/* {scanQty && (
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              onClick={() => {
                                setScanQty(1);
                                document.getElementById("qty")?.focus();
                              }}
                            >
                              <XCircle size={18} />
                            </button>
                          )} */}

                          <Input
                            type="text"
                            className="w-20 text-xs"
                            id="unit"
                            // list="unitOptions"
                            readOnly
                            value={uom}
                            autoComplete="off"
                          // onChange={(e) => setScanUnit(e.target.value)}
                          />
                          {/* <datalist id="unitOptions">
                            {uniqueUnits.map((d, i) => (
                              <option key={i} value={d} />
                            ))}
                          </datalist> */}
                        </div>
                      </div>
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
