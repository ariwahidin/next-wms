/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { use, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/router";
import PageHeader from "@/components/mobile/PageHeader";
import api from "@/lib/api";
import { set } from "date-fns";
import eventBus from "@/utils/eventBus";

interface Item {
  ID: number;
  item_code: string;
  barcode: number;
  quantity: number;
  uom: string;
}

interface KoliItem {
  ID: number;
  item_code: string;
  barcode: number;
  serial_number: string;
  qty: number;
}

interface Koli {
  ID: number;
  no_koli: string;
  details: KoliItem[];
  expanded: boolean;
}

// const dummyItems: Item[] = [
//   { id: 1, name: "Ukulele", quantity: 10 },
//   { id: 2, name: "Drumstick", quantity: 40 },
//   { id: 3, name: "Cajon", quantity: 5 },
// ];

export default function PackinPage() {
  const [kolis, setKolis] = useState<Koli[]>([]);
  const [selectedKoliId, setSelectedKoliId] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [modalQty, setModalQty] = useState<number>(0);
  const router = useRouter();
  const { outbound } = router.query;
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [scanType, setScanType] = useState<string>("SERIAL");
  const [barcode, setBarcode] = useState<string>("");
  const [serialNumber, setSerialNumber] = useState<string>("");
  const [serialNumber2, setSerialNumber2] = useState<string>("");
  const [qty, setQty] = useState<number>(1);
  const [serialInputs, setSerialInputs] = useState([""]);

  const [modalDeleteKoli, setModalDeleteKoli] = useState(false);

  const addKoli = async () => {
    try {
      setIsLoading(true);
      const [response] = await Promise.all([
        api.post(
          "/mobile/packing/generate",
          { outbound_no: outbound },
          {
            withCredentials: true,
          }
        ),
      ]);

      if (response.data.success) {
        const data = response.data.data;
        const newKoli: Koli = {
          ID: data.ID,
          no_koli: data.no_koli,
          details: [],
          expanded: true,
        };
        setKolis((prev) => [...prev, newKoli]);
      }
      // setItems(itemsData);
      //   setKolis(response.data.kolis);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }

    // setKolis([...kolis, { id: Date.now(), items: [], expanded: true }]);
  };

  const removeKoli = async () => {
    console.log("Remove koli:", selectedKoliId);

    if (selectedKoliId === null) return;

    const [response] = await Promise.all([
      api.delete("/mobile/packing/koli/" + selectedKoliId, {
        withCredentials: true,
      }),
    ]);

    // if (!response.data.success) {
    //   throw new Error("Gagal menghapus koli");
    // }

    if (response.data.success) {
      eventBus.emit("showAlert", {
        title: "Success",
        description: response.data.message,
        type: "success",
      });

      fetchData();
      setModalDeleteKoli(false);
    }
  };

  const toggleExpand = (id: number) => {
    setKolis((prev) =>
      prev.map((k) => (k.ID === id ? { ...k, expanded: !k.expanded } : k))
    );
  };

  const openAddItemModal = (koliId: number) => {

    console.log("koli id : ", koliId);
    console.log("items selected : ", items);
    console.log("scan type : ", scanType);
    setSelectedKoliId(koliId);
    setSelectedItemId(items[0].ID);
    // setModalQty(items[0].quantity);
  };

  // const closeAddItemModal = () => {
  //   setSelectedKoliId(null);
  //   setSelectedItemId(null);
  //   setModalQty(0);
  // };

  const handleItemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itemId = Number(e.target.value);
    const found = items.find((i) => i.ID === itemId);
    setSelectedItemId(itemId);
    setModalQty(found?.quantity || 0);
  };

  const addItemToKoli = async () => {

    console.log("run")

    const serialNumberValue =
      serialInputs.length > 1
        ? serialInputs.filter((s) => s.trim() !== "").join("-")
        : serialInputs[0].trim();

    if (selectedKoliId !== null && selectedItemId !== null) {
      const dataToSend = {
        outbound_no: outbound,
        koli_id: selectedKoliId,
        no_koli: kolis.find((k) => k.ID === selectedKoliId)?.no_koli,
        barcode: barcode,
        serial_number: scanType == "BARCODE" ? barcode : serialNumberValue,
        qty: qty,
        scan_type: scanType,
      };

      console.log("Data to send:", dataToSend);

      const [addItemToKoli] = await Promise.all([
        api.post("/mobile/packing/add", dataToSend, {
          withCredentials: true,
        }),
      ]);


      if (addItemToKoli.data.success) {
        eventBus.emit("showAlert", {
          title: "Success",
          description: addItemToKoli.data.message,
          type: "success",
        });

        setBarcode("");
        setSerialNumber("");
        document.getElementById("barcode")?.focus();

        fetchData();
      }
    }
  };

  const removeItemFromKoli = async (koliID: number, itemID: number) => {
    console.log("Remove item from koli:", { koliID, itemID });

    const koliDetailID = itemID;

    try {
      const [deleteItemFromKoli] = await Promise.all([
        api.delete("/mobile/packing/koli/detail/" + koliDetailID, {
          withCredentials: true,
        }),
      ]);

      if (deleteItemFromKoli.data.success) {
        eventBus.emit("showAlert", {
          title: "Success",
          description: deleteItemFromKoli.data.message,
          type: "success",
        });

        fetchData();
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Gagal menghapus item dari koli.");
    }
  };

  const fetchData = async () => {
    try {
      const [detailItems, detailKolis] = await Promise.all([
        api.get("/mobile/outbound/detail/" + outbound, {
          withCredentials: true,
        }),
        api.get("/mobile/packing/koli/" + outbound, {
          withCredentials: true,
        }),
      ]);

      setItems(detailItems.data.data);
      const dataKoli = detailKolis.data.data.map((koli: Koli) => ({
        ...koli,
        expanded: true,
      }));
      setKolis(dataKoli);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (outbound) {
      fetchData();
    }
  }, [outbound]);

  return (
    <>
      <PageHeader title={`Packing ${outbound}`} showBackButton />
      {!outbound && (
        <div className="flex justify-center p-4 items-center">
          <Loader2 className="animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      )}

      {outbound && (
        <div className="p-4 space-y-4 max-w-md mx-auto">
          <div className="space-y-2">
            <h2 className="font-semibold">Order Items</h2>
            {items?.map((item) => (
              <div key={item.ID} className="flex justify-between text-sm">
                <span>{item.item_code}</span>
                <span>
                  {item.quantity} {item.uom}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold">Koli List</h2>
            {kolis?.map((koli) => (
              <Card key={koli.ID} className="shadow-md">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-sm">
                      Koli #{koli.no_koli}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleExpand(koli.ID)}
                      >
                        {koli.expanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setModalDeleteKoli(true);
                          setSelectedKoliId(koli.ID);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  {koli.expanded && (
                    <div className="space-y-2">
                      {koli.details?.map((kItem) => {
                        return (
                          <div
                            key={kItem.ID}
                            className="flex justify-between items-center text-sm border rounded p-2"
                          >
                            <div>
                              <div>
                                {kItem.item_code} - {kItem.barcode}
                              </div>
                              <span
                                style={{ fontSize: "10px" }}
                                className="text-muted-foreground"
                              >
                                {kItem.serial_number}
                              </span>
                              <div
                                style={{ fontSize: "10px" }}
                                className="text-xs text-muted-foreground"
                              >
                                {kItem.qty}{" "}
                                {items
                                  .find((i) => i.item_code === kItem.item_code)
                                  ?.uom.toLowerCase()}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                removeItemFromKoli(koli.ID, kItem.ID)
                              }
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        );
                      })}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAddItemModal(koli.ID)}
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-1" /> Add Item
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-white top-[25%] max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              Koli{" "}
                              {kolis.find((k) => k.ID === koli.ID)?.no_koli}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2">
                            <Label>With Serial</Label>
                            <select
                              className="w-full border rounded px-2 py-1"
                              onChange={(e) => {
                                setScanType(e.target.value);
                                if (e.target.value === "SERIAL") {
                                  setQty(1);
                                }
                              }}
                              value={scanType}
                            >
                              <option value="SERIAL">YES</option>
                              <option value="BARCODE">NO</option>
                              {/* <option value="SET">SET</option> */}
                            </select>
                            <Label>Barcode Ean</Label>
                            <Input
                              id="barcode"
                              type="text"
                              value={barcode}
                              onChange={(e) => setBarcode(e.target.value)}
                            />

                            {scanType === "SERIAL" && (
                              <>
                                <Label>SerialNumber</Label>
                                {/* <Input
                                  id="serialNumber"
                                  type="text"
                                  value={serialNumber}
                                  onChange={(e) =>
                                    setSerialNumber(e.target.value)
                                  }
                                /> */}

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
                                    onClick={() =>
                                      setSerialInputs([...serialInputs, ""])
                                    }
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
                                          (_, i) =>
                                            i !== serialInputs.length - 1
                                        );
                                        setSerialInputs(newSerials);
                                      }}
                                    >
                                      - Remove Last Serial
                                    </button>

                                    {/* Menampilkan gabungan serial */}
                                    <div className="text-sm text-gray-500">
                                      Combined:{" "}
                                      {serialInputs
                                        .filter((s) => s.trim() !== "")
                                        .join("-")}
                                    </div>
                                  </>
                                )}
                              </>
                            )}

                            {scanType === "BARCODE" && (
                              <>
                                <Label>Qty</Label>
                                <Input
                                  // min={1}
                                  type="number"
                                  value={qty}
                                  onChange={(e) =>
                                    setQty(Number(e.target.value))
                                  }
                                />
                              </>
                            )}
                            <Button onClick={addItemToKoli} className="w-full">
                              <Plus className="w-4 h-4 mr-1" /> Add
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Button onClick={addKoli} className="w-full flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Koli
          </Button>

          <Dialog open={modalDeleteKoli} onOpenChange={setModalDeleteKoli}>
            <DialogContent className="sm:max-w-[425px] bg-white">
              <DialogHeader>
                <DialogTitle>Confirmation Delete</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <Label>Are you sure you want to delete this koli?</Label>
                <Button
                  onClick={() => {
                    removeKoli();
                  }}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </>
  );
}
