import { useRouter } from "next/router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "../../components/PageHeader";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Pallet = {
  id: string;
  items: string[];
};

const CheckingPage = () => {
  const router = useRouter();
  const { noDO } = router.query;

  const [pallets, setPallets] = useState<Pallet[]>([
    { id: "Pallet 1", items: [] },
  ]);
  const [activePallet, setActivePallet] = useState("Pallet 1");
  const [scanInput, setScanInput] = useState("");

  const handleScan = () => {
    if (!scanInput.trim()) return;

    setPallets((prev) =>
      prev.map((p) =>
        p.id === activePallet
          ? { ...p, items: [...p.items, scanInput.trim()] }
          : p
      )
    );
    setScanInput("");
  };

  const handleRemoveItem = (itemIndex: number) => {
    setPallets((prev) =>
      prev.map((p) =>
        p.id === activePallet
          ? {
              ...p,
              items: p.items.filter((_, index) => index !== itemIndex),
            }
          : p
      )
    );
  };

  const handleAddPallet = () => {
    const newId = `Pallet ${pallets.length + 1}`;
    setPallets([...pallets, { id: newId, items: [] }]);
    setActivePallet(newId);
  };

  const currentPallet = pallets.find((p) => p.id === activePallet);

  return (
    <>
      <PageHeader title={`Checking ${noDO}`} />
      <div className="min-h-screen bg-gray-50 p-4 space-y-4">
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
            <Input
              placeholder="Scan barcode barang..."
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
            />
            <Button onClick={handleScan} className="w-full">
              Tambah ke {activePallet}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="font-semibold mb-2">Barang di {activePallet}:</div>
            {currentPallet?.items.length ? (
              <ul className="space-y-2">
                {currentPallet.items.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between border p-2 rounded"
                  >
                    <span className="text-sm">{item}</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveItem(idx)}
                    >
                      Hapus
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-400">
                Belum ada barang di {activePallet}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CheckingPage;
