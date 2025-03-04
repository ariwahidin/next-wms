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

export function TruckForm({ editData, setEditData }) {
  const [truckName, setTruckName] = useState("");
  const [truckDescription, setTruckDescription] = useState("");
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
    if (!truckName || !truckDescription) {
      setError("Harap isi semua field.");
      // Fokuskan ke field yang kosong
      if (!truckName) {
        document.getElementById("truckName")?.focus();
      } else if (!truckDescription) {
        document.getElementById("truckDescription")?.focus();
      } 
      return;
    }

    try {
      setError(null); // Reset error message jika form valid

      if (editData) {
        console.log(editData);
        // 🔥 Update produk jika sedang dalam mode edit
        await api.put(
          `/trucks/${editData.ID}`, // ID produk dari editData
          {
            truck_name : truckName,
            truck_description : truckDescription
          },
          { withCredentials: true }
        );
      } else {
        // 🔥 Tambah produk baru jika tidak sedang edit
        await api.post(
          "/trucks",
          {
            truck_name : truckName,
            truck_description : truckDescription
          },
          { withCredentials: true }
        );
      }

      mutate("/trucks"); // 🔥 Refresh tabel otomatis tanpa reload
      setEditData(null); // 🔄 Reset editData setelah submit
      // setTransporterCode("");
      // setTransporterName("");
      // setTransporterAddress("");
      document.getElementById("truckName")?.focus();
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
    setTruckName("");
    setTruckDescription("");
  };

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Truck Form</CardTitle>
        <CardDescription>
          {editData ? "Edit Truck" : "Add Truck"}
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
              <Label htmlFor="">Truck Name</Label>
              <Input
                id="truckName"
                onChange={(e) =>
                  setTruckName(e.target.value.toUpperCase())
                }
                value={truckName}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="">Description</Label>
              <Input
                id="truckDescription"
                onChange={(e) =>
                  setTruckDescription(e.target.value.toUpperCase())
                }
                value={truckDescription}
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
