/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Owner } from "@/types/owner";
import { set } from "date-fns";
import { Warehouse } from "@/types/warehouse";

export default function Form({ editData, setEditData }) {
  const [warehouse, setWarehouse] = useState<Warehouse>({
    ID: 0,
    id: 0,
    code: "",
    name: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editData) {
      setWarehouse(editData);
    }
  }, [editData]);

  async function handleSubmit(e) {
    e.preventDefault();

    // Validasi form
    if (warehouse.code.trim() === "" || warehouse.name.trim() === "") {
      setError("Please fill all the fields.");
      return;
    }

    try {
      setError(null); // Reset error message jika form valid
      if (editData) {
        console.log(editData);
        // 🔥 Update produk jika sedang dalam mode edit
        await api.put(
          `/warehouses/${editData.id}`, warehouse);
      } else {
        // 🔥 Tambah produk baru jika tidak sedang edit
        await api.post(
          "/warehouses", warehouse
        );
      }

      mutate("/warehouses"); // 🔥 Refresh tabel otomatis tanpa reload
      setEditData(null);
      setWarehouse({ ID: 0, id: 0, code: "", name: "", description: "" });
      setError(null);
      document.getElementById("code")?.focus();
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
    setWarehouse({ ID: 0, id: 0, code: "", name: "", description: "" });
    document.getElementById("qa_status")?.focus();
  };

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle> {editData ? "Edit Warehouse" : "Add Warehouse"}</CardTitle>
        {/* <CardDescription></CardDescription> */}
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
              <Label htmlFor="">Code</Label>
              <Input
                id="code"
                value={warehouse.code}
                onChange={(e) => setWarehouse({ ...warehouse, code: e.target.value })}
                placeholder="Enter owner code"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="">Name</Label>
              <Input
                id="name"
                value={warehouse.name}
                onChange={(e) => setWarehouse({ ...warehouse, name: e.target.value })}
                placeholder="Enter owner code"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="">Description</Label>
              <Input
                id="description"
                value={warehouse.description}
                onChange={(e) => setWarehouse({ ...warehouse, description: e.target.value })}
                placeholder="Enter Description"
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
