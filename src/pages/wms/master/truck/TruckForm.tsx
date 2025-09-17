/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Truck } from "@/types/truck";

export default function TruckForm({ editData, setEditData }) {
  const [truck, setTruck] = useState<Truck>({
    ID: 0,
    name : "",
    description : "",
    cbm : 0
  });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e) {
    e.preventDefault();

    // Validasi form
    if (truck.name.trim() === "" || truck.description.trim() === "") {
      return;
    }

    try {
      setError(null); // Reset error message jika form valid

      if (editData) {
        await api.put(
          `/trucks/${editData.ID}`,
          truck
        );
      } else {
        // 🔥 Tambah produk baru jika tidak sedang edit
        await api.post(
          "/trucks",
          truck
        );
      }
      mutate("/trucks");
      setEditData(null);
      setTruck({ ID: 0, name : "", description : "", cbm : 0 }); 
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
    setTruck({ ID: 0, name : "", description : "", cbm : 0 });
  };

  useEffect(() => {
    if (editData) {
      setTruck(editData);
    }
  }, [editData]);

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>{editData ? "Edit Truck" : "Add Truck"}</CardTitle>
        {/* <CardDescription>
          {editData ? "Edit Truck" : "Add Truck"}
        </CardDescription> */}
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
                  setTruck({...truck, name : e.target.value.toUpperCase()})
                }
                value={truck.name}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="">Description</Label>
              <Input
                id="truckDescription"
                onChange={(e) =>
                  setTruck({...truck, description : e.target.value.toUpperCase()})
                }
                value={truck.description}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="">CBM</Label>
              <Input
                type="number"
                id="truckCBM"
                onChange={(e) =>
                  setTruck({...truck, cbm : Number(e.target.value)})
                }
                value={truck.cbm}
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
