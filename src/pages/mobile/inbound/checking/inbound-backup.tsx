import { useRouter } from "next/router";
import { useState } from "react";
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
import { Trash2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { XCircle } from "lucide-react"; // untuk icon clear

// Types
interface ScanItem {
  id?: number;
  location: string;
  barcode: string;
  serial: string;
  uploaded: boolean;
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

  const handleScan = () => {
    if (!scanLocation.trim() || !scanBarcode.trim() || !scanSerial.trim())
      return;

    const newItem: ScanItem = {
      location: scanLocation.trim(),
      barcode: scanBarcode.trim(),
      serial: scanSerial.trim(),
      uploaded: false,
    };

    setPallets((prev) =>
      prev.map((p) =>
        p.id === activePallet ? { ...p, items: [...p.items, newItem] } : p
      )
    );

    setScanLocation("");
    setScanBarcode("");
    setScanSerial("");
  };

  const handleRemoveItem = (index: number) => {
    setPallets((prev) =>
      prev.map((p) =>
        p.id === activePallet
          ? { ...p, items: p.items.filter((_, i) => i !== index) }
          : p
      )
    );
  };

  const handleAddPallet = () => {
    const newId = `Pallet ${pallets.length + 1}`;
    setPallets([...pallets, { id: newId, items: [] }]);
    setActivePallet(newId);
  };

  const handleUpload = () => {
    const dataUpload = pallets.map((pallet) => ({
      inbound_no: inbound,
      pallet_id: pallet.id,
      items: pallet.items.map((item) => ({
        id: item.id,
        location: item.location,
        barcode: item.barcode,
        serial: item.serial,
      })),
    }));

    console.log(dataUpload);

    const updatedPallets = pallets.map((pallet) => {
      if (pallet.id === activePallet) {
        const uploadedItems = pallet.items.map((item) => ({
          ...item,
          uploaded: true,
          id: Math.floor(Math.random() * 10000),
        }));
        return { ...pallet, items: uploadedItems };
      }
      return pallet;
    });

    setPallets(updatedPallets);
    setShowConfirmModal(false);
  };

  const currentPallet = pallets.find((p) => p.id === activePallet);
  const filteredItems =
    currentPallet?.items.filter(
      (item) =>
        item.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serial.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  return (
    <>
      <PageHeader title={`Checking ${inbound}`} showBackButton />
      <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-24">
        <div className="flex items-center gap-2">
          <Select value={activePallet} onValueChange={setActivePallet}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Pilih Pallet" />
            </SelectTrigger>
            <SelectContent>
              {pallets.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddPallet}>+ Pallet</Button>
        </div>

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
                placeholder="Location..."
                value={scanLocation}
                onChange={(e) => setScanLocation(e.target.value)}
              />
              {scanLocation && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setScanLocation("")}
                >
                  <XCircle size={18} />
                </button>
              )}
            </div>

            <div className="relative">
              <Input
                placeholder="Scan barcode barang..."
                value={scanBarcode}
                onChange={(e) => setScanBarcode(e.target.value)}
              />
              {scanBarcode && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setScanBarcode("")}
                >
                  <XCircle size={18} />
                </button>
              )}
            </div>

            <div className="relative">
              <Input
                placeholder="Serial Number..."
                value={scanSerial}
                onChange={(e) => setScanSerial(e.target.value)}
              />
              {scanSerial && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setScanSerial("")}
                >
                  <XCircle size={18} />
                </button>
              )}
            </div>
            <Button onClick={handleScan} className="w-full">
              Tambah ke {activePallet}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="font-semibold w-full">
                Barang di {activePallet} (Total:{" "}
                {currentPallet?.items.length || 0})
              </div>
              <Input
                className="w-full"
                placeholder="Cari barang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {filteredItems.length ? (
              <ul className="space-y-2">
                {filteredItems.map((item, idx) => (
                  <li
                    key={idx}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between border p-3 rounded ${
                      item.uploaded ? "bg-green-100" : "bg-blue-100"
                    }`}
                  >
                    <div className="text-sm">
                      <div>
                        <strong>Barcode:</strong> {item.barcode}
                      </div>
                      <div>
                        <strong>Serial:</strong> {item.serial}
                      </div>
                      <div>
                        <strong>Location:</strong> {item.location}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2 sm:mt-0">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          handleRemoveItem(currentPallet!.items.indexOf(item))
                        }
                      >
                        <Trash2 size={16} />
                      </Button>
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
          <Upload size={28} />
        </Button>

        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Konfirmasi Upload</DialogTitle>
            </DialogHeader>
            <p>
              Apakah Anda yakin ingin mengupload semua data pada {activePallet}?
            </p>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setShowConfirmModal(false)}
              >
                Batal
              </Button>
              <Button onClick={handleUpload}>Upload</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default CheckingPage;
