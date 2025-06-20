/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import * as React from "react";
/* eslint-disable @typescript-eslint/no-unused-vars */

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

export default function ProductForm({ editData, setEditData }) {
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

  const [selectedSerial, setSelectedSerial] = useState(serialOptions[1]);

  useEffect(() => {
    if (editData) {
      console.log("Edit Data Di Form : ", editData);

      console.log("uom Options : ", uomOptions);

      setItemCode(editData.item_code);
      setItemName(editData.item_name);
      setGmc(editData.gmc);
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
            cbm: 1.0,
            category: category.value,

            group: "Book",
            serial: selectedSerial.value,
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
            cbm: 1.0,
            category: category.value,
            group: "Book",
            serial: selectedSerial.value,
            uom: selectedUom.value,
          },
          { withCredentials: true }
        );
      }

      mutate("/products");
      // setEditData(null);
      // setItemCode("");
      // setItemName("");
      // setGmc("");
      // document.getElementById("itemCode")?.focus();
    } catch (err: any) {
      // Tangani error dengan cara yang lebih ramah
      if (err.response) {
        // Backend memberikan response error (misal status 400)
        if (err.response.status === 400) {
          setError("Data yang dimasukkan tidak valid.");
        } else {
          setError("Terjadi kesalahan, coba lagi nanti.");
        }
      } else {
        // Tidak ada response dari backend (misalnya jaringan error)
        setError("Tidak ada respon dari server.");
      }
    }
  }

  // Menangani tombol Enter untuk submit
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e); // Submit form saat Enter
    }
  };

  const handleCancel = () => {
    setError(null);
    setEditData(null);
    setItemCode("");
    setItemName("");
    setGmc("");
  };

  return (
    <Card className="w-[400px]">
      <CardHeader>
        {/* <CardTitle>Product Form</CardTitle> */}
        <CardDescription>
          <h1 className="text-1xl font-bold">{editData ? "Edit Product" : "Add Product"}</h1>
        </CardDescription>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="item_code">Item Code</Label>
              <Input
                id="itemCode"
                onChange={(e) => setItemCode(e.target.value)}
                value={itemCode}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="item_name">Item Name</Label>
              <Input
                id="itemName"
                onChange={(e) => setItemName(e.target.value)}
                value={itemName}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label>Barcode</Label>
              <Input
                id="gmc"
                onChange={(e) => setGmc(e.target.value)}
                value={gmc}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label>Base UOM</Label>
              <Select
                options={uomOptions}
                defaultValue={selectedUom}
                onChange={(selectedOption) => setSelectedUom(selectedOption)}
                placeholder="Select base UOM"
                value={selectedUom}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label>Has Serial</Label>
              <Select
                options={serialOptions}
                defaultValue={selectedSerial}
                onChange={(selectedOption) => setSelectedSerial(selectedOption)}
                value={selectedSerial}
                placeholder="Select serial"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label>Category</Label>
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
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} type="submit">
          {" "}
          {/* Tombol submit */}
          {editData ? "Update" : "Add"}
        </Button>
      </CardFooter>
    </Card>
  );
}
