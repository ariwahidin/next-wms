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
import { Badge, Boxes, Check, Trash2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { XCircle } from "lucide-react"; // untuk icon clear
import api from "@/lib/api";

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

interface Pallet {
  id: string;
  items: ScanItem[];
}

const CheckingPage = () => {
  const router = useRouter();
  const { inbound } = router.query;

  const [pallets, setPallets] = useState<Pallet[]>([
    { id: "Pallet 1", items: [] },
  ]);

  const [activePallet, setActivePallet] = useState("Pallet 1");
  const [scanQa, setScanQa] = useState("A");
  const [scanType, setScanType] = useState("SERIAL");
  const [scanWhs, setScanWhs] = useState("CKY");
  const [scanLocation, setScanLocation] = useState("");
  const [scanBarcode, setScanBarcode] = useState("");
  const [scanSerial, setScanSerial] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [listInboundScanned, setListInboundScanned] = useState<ScannedItem[]>(
    []
  );

  const handleScan = async () => {
    if (!scanLocation.trim() || !scanBarcode.trim() || !scanSerial.trim())
      return;

    const newItem: ScanItem = {
      inboundNo: Array.isArray(inbound) ? inbound[0] : inbound,
      id: 0,
      location: scanLocation.trim(),
      barcode: scanBarcode.trim(),
      scanType: scanType,
      whsCode: scanWhs,
      qaStatus: scanQa,
      serial: scanSerial.trim(),
      qtyScan: 1,
      uploaded: false,
    };

    const response = await api.post("/mobile/inbound/scan", newItem, {
      withCredentials: true,
    });
    const data = await response.data;
    if (data.success) {
      fetchScannedItems();
    }

    console.log("List Inbound Scanned:", listInboundScanned);

    // setPallets((prev) =>
    //   prev.map((p) =>
    //     p.id === activePallet ? { ...p, items: [...p.items, newItem] } : p
    //   )
    // );

    // setScanLocation("");
    // setScanBarcode("");
    // setScanSerial("");
  };

  const fetchScannedItems = async () => {
    const response = await api.get("/mobile/inbound/scan/" + inbound, {
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
      console.log("Filtered scanned items:", filtered);
    }
  };

  const handleRemoveItem = async (index: number) => {
    console.log("ID Inbound BaRCODE:", index);

    try {
      const response = await api.delete("/mobile/inbound/scan/" + index, {
        withCredentials: true,
      });
      const data = await response.data;
      if (data.success) {
        fetchScannedItems();
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    // setPallets((prev) =>
    //   prev.map((p) =>
    //     p.id === activePallet
    //       ? { ...p, items: p.items.filter((_, i) => i !== index) }
    //       : p
    //   )
    // );
  };

  // const handleAddPallet = () => {
  //   const newId = `Pallet ${pallets.length + 1}`;
  //   setPallets([...pallets, { id: newId, items: [] }]);
  //   setActivePallet(newId);
  // };

  const handleConfirmPutaway = async (inbound_no : string) => {

    console.log(inbound_no);

    const dataToPost = {
      inboundNo: inbound_no,
      location : scanLocation
    }

    try{
      const response = await api.put("/mobile/inbound/scan/putaway/" + inbound_no, dataToPost, {
        withCredentials: true,
      })
  
      const data = await response.data;
  
      if (data.success) {
        fetchScannedItems();
        setShowConfirmModal(false);
      }
    }catch (error) {
      console.error("Error fetching data:", error);
    }



    // const dataUpload = pallets.map((pallet) => ({
    //   inbound_no: inbound,
    //   pallet_id: pallet.id,
    //   items: pallet.items.map((item) => ({
    //     id: item.id,
    //     location: item.location,
    //     barcode: item.barcode,
    //     serial: item.serial,
    //   })),
    // }));

    // console.log(dataUpload);

    // const updatedPallets = pallets.map((pallet) => {
    //   if (pallet.id === activePallet) {
    //     const uploadedItems = pallet.items.map((item) => ({
    //       ...item,
    //       uploaded: true,
    //       id: Math.floor(Math.random() * 10000),
    //     }));
    //     return { ...pallet, items: uploadedItems };
    //   }
    //   return pallet;
    // });

    // setPallets(updatedPallets);
    // setShowConfirmModal(false);
  };

  const currentPallet = pallets.find((p) => p.id === activePallet);
  const filteredItems =
    listInboundScanned.filter(
      (item) =>
        item?.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item?.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item?.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  useEffect(() => {
    if (inbound) fetchScannedItems();
  }, [inbound]);

  useEffect(() => {
    console.log("Data terbaru:", listInboundScanned);
  }, [listInboundScanned]);

  return (
    <>
      <PageHeader title={`Checking ${inbound}`} showBackButton />
      <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-24">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="relative flex gap-2">
              <Select value={scanType} onValueChange={setScanType}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Scan Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SERIAL">Serial</SelectItem>
                  <SelectItem value="BARCODE">Barcode</SelectItem>
                </SelectContent>
              </Select>

              <Select value={scanWhs} onValueChange={setScanWhs}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Scan Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CKY">CKY</SelectItem>
                  <SelectItem value="CKZ">CKZ</SelectItem>
                </SelectContent>
              </Select>

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
            <div className="relative">
              <Input
                id="location"
                placeholder="Location..."
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

            <div className="relative">
              <Input
                id="barcode"
                placeholder="Scan barcode barang..."
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

            <div className="relative">
              <Input
                id="serial"
                placeholder="Serial Number..."
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
                placeholder="Cari barang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* List Items */}
            {filteredItems.length > 0 ? (
              <ul className="space-y-3">
                {filteredItems.map((item, idx) => (
                  <li
                    key={idx}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between border p-3 rounded ${
                      item.status === "in stock"
                        ? "bg-green-100"
                        : "bg-blue-100"
                    }`}
                  >
                    {/* Info Barang */}
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
                            onClick={() => handleRemoveItem(item.id)}
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

        {/* Floating Upload Button */}
        <Button
          onClick={() => setShowConfirmModal(true)}
          className="fixed bottom-6 right-6 rounded-full shadow-lg h-14 w-14 p-0"
        >
          <Check size={28} />
        </Button>

        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Putaway Confirmation</DialogTitle>
            </DialogHeader>
            <p>
              Are you sure you want to confirm the putaway in location {scanLocation}?
            </p>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setShowConfirmModal(false)}
              >
                Batal
              </Button>
              <Button onClick={() => {
                console.log(typeof inbound, inbound)
                if(inbound){
                  handleConfirmPutaway(Array.isArray(inbound) ? inbound[0] : inbound);
                }
              }}>Upload</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default CheckingPage;
