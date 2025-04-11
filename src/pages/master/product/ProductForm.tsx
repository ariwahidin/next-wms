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

export default function ProductForm({ editData, setEditData }) {
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [gmc, setGmc] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [serialOptions, setSerialOptions] = useState([
    { value: "Y", label: "YES" },
    { value: "N", label: "NO" },
  ]);

  const [selectedSerial, setSelectedSerial] = useState(serialOptions[1]);

  // 🔥 Jika editData berubah, isi form dengan data produk yang dipilih
  useEffect(() => {
    if (editData) {
      setItemCode(editData.item_code);
      setItemName(editData.item_name);
      setGmc(editData.gmc);
      serialOptions.find((option) => {
        console.log(editData.has_serial);
        if (option.value === editData.has_serial) {
          setSelectedSerial(option);
        }
      });
    }
  }, [editData]);

  async function handleSubmit(e) {
    e.preventDefault();

    // Validasi form
    if (!itemCode || !itemName || !gmc) {
      setError("Harap isi semua field.");
      // Fokuskan ke field yang kosong
      if (!itemCode) {
        document.getElementById("itemCode")?.focus();
      } else if (!itemName) {
        document.getElementById("itemName")?.focus();
      } else if (!gmc) {
        document.getElementById("gmc")?.focus();
      }
      return;
    }

    try {
      setError(null); // Reset error message jika form valid

      if (editData) {
        console.log(editData);
        // 🔥 Update produk jika sedang dalam mode edit
        await api.put(
          `/products/${editData.ID}`, // ID produk dari editData
          {
            item_code: itemCode,
            item_name: itemName,
            gmc: gmc,
            cbm: 1.0,
            category: "Book",
            group: "Book",
            serial: selectedSerial.value,
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
            category: "Book",
            group: "Book",
            serial: selectedSerial.value,
          },
          { withCredentials: true }
        );
      }

      mutate("/products"); // 🔥 Refresh tabel otomatis tanpa reload
      setEditData(null); // 🔄 Reset editData setelah submit
      setItemCode("");
      setItemName("");
      setGmc("");
      document.getElementById("itemCode")?.focus();
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
        <CardTitle>Product Form</CardTitle>
        <CardDescription>
          {editData ? "Edit Product" : "Add Product"}
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
              <Label>GMC</Label>
              <Input
                id="gmc"
                onChange={(e) => setGmc(e.target.value)}
                value={gmc}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label>Has Serial</Label>
              <Select
                options={serialOptions}
                defaultValue={selectedSerial}
                onChange={(selectedOption) =>
                  setSelectedSerial(selectedOption)
                }
                value={selectedSerial}
                placeholder="Select serial"
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
