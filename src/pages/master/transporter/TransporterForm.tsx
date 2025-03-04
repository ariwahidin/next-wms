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

export function TransporterForm({ editData, setEditData }) {
  const [transporterCode, setTransporterCode] = useState("");
  const [transporterName, setTransporterName] = useState("");
  const [transporterAddress, setTransporterAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 🔥 Jika editData berubah, isi form dengan data produk yang dipilih
  // useEffect(() => {
  //   if (editData) {
  //     setSupplierCode(editData.supplier_code);
  //     setSupplierName(editData.supplier_name);
  //   }
  // }, [editData]);

  async function handleSubmit(e) {
    e.preventDefault();

    // Validasi form
    if (!transporterCode || !transporterName || !transporterAddress) {
      setError("Harap isi semua field.");
      // Fokuskan ke field yang kosong
      if (!transporterCode) {
        document.getElementById("transporterCode")?.focus();
      } else if (!transporterName) {
        document.getElementById("transporterName")?.focus();
      } else if (!transporterAddress) {
        document.getElementById("transporterAddress")?.focus();
      }
      return;
    }

    try {
      setError(null); // Reset error message jika form valid

      if (editData) {
        console.log(editData);
        // 🔥 Update produk jika sedang dalam mode edit
        await api.put(
          `/transporters/${editData.ID}`, // ID produk dari editData
          {
            supplier_code: supplierCode,
            supplier_name: supplierName,
          },
          { withCredentials: true }
        );
      } else {
        // 🔥 Tambah produk baru jika tidak sedang edit
        await api.post(
          "/transporters",
          {
            transporter_code: transporterCode,
            transporter_name: transporterName,
            transporter_address: transporterAddress,
          },
          { withCredentials: true }
        );
      }

      mutate("/transporters"); // 🔥 Refresh tabel otomatis tanpa reload
      setEditData(null); // 🔄 Reset editData setelah submit
      // setTransporterCode("");
      // setTransporterName("");
      // setTransporterAddress("");
      document.getElementById("supplierCode")?.focus();
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
    setTransporterCode("");
    setTransporterName("");
    setTransporterAddress("");
  };

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Transporter Form</CardTitle>
        <CardDescription>
          {editData ? "Edit Transporter" : "Add Transporter"}
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
              <Label htmlFor="">Transporter Code</Label>
              <Input
                id="transporterCode"
                onChange={(e) =>
                  setTransporterCode(e.target.value.toUpperCase())
                }
                value={transporterCode}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="">Transporter Name</Label>
              <Input
                id="transporterName"
                onChange={(e) =>
                  setTransporterName(e.target.value.toUpperCase())
                }
                value={transporterName}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="">Transporter Address</Label>
              <Input
                id="transporterAddress"
                onChange={(e) => setTransporterAddress(e.target.value)}
                value={transporterAddress}
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
          {/* Tombol submit */}
          {editData ? "Update" : "Add"}
        </Button>
      </CardFooter>
    </Card>
  );
}
