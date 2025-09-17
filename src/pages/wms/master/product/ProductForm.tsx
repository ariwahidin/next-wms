/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { mutate } from "swr";
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getEnabledCategories } from "trace_events";
import Select from "react-select";
import { ItemOptions } from "@/types/inbound";
import { Category } from "@/types/category";
import { set } from "date-fns";

export default function ProductForm({ editData, setEditData, onClose }) {
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [gmc, setGmc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<ItemOptions[]>([]);
  const [category, setCategory] = useState(null);

  const [serialOptions, setSerialOptions] = useState([
    { value: "Y", label: "YES" },
    { value: "N", label: "NO" },
  ]);
  const [warantyOptions, setWarantyOptions] = useState([
    { value: "Y", label: "YES" },
    { value: "N", label: "NO" },
  ]);
  const [adaptorOptions, setAdaptorOptions] = useState([
    { value: "Y", label: "YES" },
    { value: "N", label: "NO" },
  ]);
  const [manualBookOptions, setManualBookOptions] = useState([
    { value: "Y", label: "YES" },
    { value: "N", label: "NO" },
  ]);

  const [selectedSerial, setSelectedSerial] = useState(serialOptions[1]);
  const [selectedWaranty, setSelectedWaranty] = useState(warantyOptions[1]);
  const [selectedAdaptor, setSelectedAdaptor] = useState(adaptorOptions[1]);
  const [selectedManualBook, setSelectedManualBook] = useState(manualBookOptions[1]);

  useEffect(() => {
    if (editData) {
      setItemCode(editData.item_code);
      setItemName(editData.item_name);
      setGmc(editData.barcode);
      setCategory({ value: editData.category, label: editData.category });
      setCbm(editData.cbm);
      categoryOptions.find((option) => {
        if (option.value === editData.category) {
          setCategory(option);
        }
      });
      serialOptions.find((option) => {
        if (option.value === editData.has_serial) {
          setSelectedSerial(option);
        }
      });

      warantyOptions.find((option) => {
        if (option.value === editData.has_waranty) {
          setSelectedWaranty(option);
        }
      });

      adaptorOptions.find((option) => {
        if (option.value === editData.has_adaptor) {
          setSelectedAdaptor(option);
        }
      });

      manualBookOptions.find((option) => {
        if (option.value === editData.has_manual_book) {
          setSelectedManualBook(option);
        }
      });

      uomOptions.find((option) => {
        if (option.value === editData.uom) {
          setSelectedUom(option);
        }
      });
    }
  }, [editData]);

  const AllUOM = async () => {
    try {
      const response = await api.get("/uoms", { withCredentials: true });
      return response.data;
    } catch (error) {
      console.log(error);
    }
  };
  const [uoms, setUoms] = useState([]);
  const [uomOptions, setUomOptions] = useState([]);
  const [selectedUom, setSelectedUom] = useState(null);
  const [cbm, setCbm] = useState(0);
  useEffect(() => {
    async function fetchData() {
      const data = await AllUOM();
      if (data.success) {
        setUoms(data.data);
        setUomOptions(
          data.data.map((uom) => ({ value: uom.code, label: uom.code }))
        );
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories", {
          withCredentials: true,
        });
        return response.data;
      } catch (error) {
        console.log(error);
      }
    };

    fetchCategories().then((categories) => {
      if (categories.success) {
        setCategoryOptions(
          categories.data.map((category: Category) => ({
            value: category.code,
            label: category.name,
          }))
        );
      }
    });
  }, []);

  useEffect(() => {
    if (uoms.length > 0) {
      setSelectedUom(uomOptions[0]);
    }
  }, [uoms]);

  async function handleSubmit(e) {
    e.preventDefault();

    // Validasi form
    if (!itemCode || !itemName || !gmc || !selectedSerial || !selectedUom) {
      setError("Harap isi semua field.");
      if (!itemCode) {
        document.getElementById("itemCode")?.focus();
      } else if (!itemName) {
        document.getElementById("itemName")?.focus();
      } else if (!gmc) {
        console.log("Focus set to itemCode");
        document.getElementById("gmc")?.focus();
      } else if (!selectedSerial) {
        console.log("Focus set to itemName");
        document.getElementById("serial")?.focus();
      } else if (!selectedUom) {
        console.log("Focus set to gmc");
        document.getElementById("uom")?.focus();
      }
      console.log("Focus set to serial");
      return;
    }
    console.log("Focus set to uom");

    try {
      setError(null); // Reset error message jika form valid;

      if (editData) {
        await api.put(
          `/products/${editData.ID}`, // ID produk dari editData
          {
            item_code: itemCode,
            item_name: itemName,
            gmc: gmc,
            cbm: cbm,
            category: category.value,
            group: "Book",
            serial: selectedSerial.value,
            waranty : selectedWaranty.value,
            adaptor : selectedAdaptor.value,
            manual_book : selectedManualBook.value,
            uom: selectedUom.value,
          },
          { withCredentials: true }
        );
      } else {
        // 🔥 Tambah produk baru jika tidak sedang edit
        await api.post(
          "/products",
          {
            item_code: itemCode,
            item_name: itemName,
            gmc: gmc,
            cbm: cbm,
            category: category.value,
            group: "Book",
            serial: selectedSerial.value,
            waranty : selectedWaranty.value,
            adaptor : selectedAdaptor.value,
            manual_book : selectedManualBook.value,
            uom: selectedUom.value,
          },
          { withCredentials: true }
        );
      }

      mutate("/products");
      onClose(); // Tutup modal
    } catch (err: any) {
      if (err.response) {
        if (err.response.status === 400) {
          setError("Data yang dimasukkan tidak valid.");
        } else {
          setError("Terjadi kesalahan, coba lagi nanti.");
        }
      } else {
        setError("Tidak ada respon dari server.");
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  const handleCancel = () => {
    setError(null);
    setEditData(null);
    setItemCode("");
    setItemName("");
    setGmc("");
    onClose(); // Tutup modal
  };

  return (
    <Card>
      <CardHeader style={{ paddingBottom: "0" }}>
        <CardDescription style={{ display: "none" }}>
          {/* <h1 className="text-1xl font-bold">
            {editData ? "Edit Product" : "Add Product"}
          </h1> */}
        </CardDescription>
        
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          <div className="grid w-full items-center gap-4">
            <div className="flex items-center gap-4">
              <Label className="w-24 text-left shrink-0" htmlFor="item_code">
                Item Code
              </Label>
              <span className="shrink-0">:</span>
              <Input
                id="itemCode"
                onChange={(e) => setItemCode(e.target.value)}
                value={itemCode}
                placeholder=""
              />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-24 text-left shrink-0" htmlFor="item_name">
                Item Name
              </Label>
              <span className="shrink-0">:</span>
              <Input
                id="itemName"
                onChange={(e) => setItemName(e.target.value)}
                value={itemName}
                placeholder=""
              />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-24 text-left shrink-0" htmlFor="gmc">
                Barcode
              </Label>
              <span className="shrink-0">:</span>
              <Input
                id="gmc"
                onChange={(e) => setGmc(e.target.value)}
                value={gmc}
                placeholder=""
              />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-24 text-left shrink-0">Category</Label>
              <span className="shrink-0">:</span>
              <Select
                options={categoryOptions}
                defaultValue={category}
                onChange={(selectedOption) => {
                  setCategory(selectedOption);
                }}
                value={category}
                placeholder="Select category"
              />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-24 text-left shrink-0">Base UOM</Label>
              <span className="shrink-0">:</span>
              <Select
                options={uomOptions}
                defaultValue={selectedUom}
                onChange={(selectedOption) => setSelectedUom(selectedOption)}
                placeholder="Select base UOM"
                value={selectedUom}
              />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-24 text-left shrink-0">SN</Label>
              <span className="shrink-0">:</span>
              <Select
                options={serialOptions}
                defaultValue={selectedSerial}
                onChange={(selectedOption) => setSelectedSerial(selectedOption)}
                value={selectedSerial}
                placeholder="Choose..."
              />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-24 text-left shrink-0">Waranty</Label>
              <span className="shrink-0">:</span>
              <Select
                options={warantyOptions}
                defaultValue={selectedWaranty}
                onChange={(selectedOption) => setSelectedWaranty(selectedOption)}
                value={selectedWaranty}
                placeholder="Choose..."
              />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-24 text-left shrink-0">Adaptor</Label>
              <span className="shrink-0">:</span>
              <Select
                options={adaptorOptions}
                defaultValue={selectedAdaptor}
                onChange={(selectedOption) => setSelectedAdaptor(selectedOption)}
                value={selectedAdaptor}
                placeholder="Choose..."
              />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-24 text-left shrink-0">Manual Book</Label>
              <span className="shrink-0">:</span>
              <Select
                options={manualBookOptions}
                defaultValue={selectedManualBook}
                onChange={(selectedOption) => setSelectedManualBook(selectedOption)}
                value={selectedManualBook}
                placeholder="Choose..."
              />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-24 text-left shrink-0">CBM</Label>
              <span className="shrink-0">:</span>
              <Input
                id="cbm"
                onChange={(e) => setCbm(Number(e.target.value))}
                value={cbm}
                type="number"
                placeholder=""
              />
            </div>
            
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} type="submit">
          {" "}
          {editData ? "Update" : "Add"}
        </Button>
      </CardFooter>
    </Card>
  );
}
