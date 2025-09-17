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
import { Supplier } from "@/types/supplier";
import { set } from "date-fns";

export default function SupplierForm({ editData, setEditData }) {
  const [supplier, setSupplier] = useState<Supplier>({
    ID: 0,
    supplier_code: "",
    supplier_name: "",
    supp_addr1: "",
    supp_city: "",
    supp_country: "",
    supp_phone: "",
    supp_email: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editData) {
      setSupplier(editData);
    }
  }, [editData]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (supplier.supplier_name === "" || supplier.supplier_code === "") {
      setError("Please fill all the fields.");
      return;
    }

    try {
      setError(null); // Reset error message jika form valid

      if (editData) {
        console.log(editData);
        await api.put(`/suppliers/${editData.ID}`, supplier);
      } else {
        await api.post("/suppliers", supplier);
      }

      mutate("/suppliers");
      setEditData(null);
      setError(null);
      setSupplier({
        ID: 0,
        supplier_code: "",
        supplier_name: "",
        supp_addr1: "",
        supp_city: "",
        supp_country: "",
        supp_phone: "",
        supp_email: "",
      });
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
    setSupplier({
      ID: 0,
      supplier_code: "",
      supplier_name: "",
      supp_addr1: "",
      supp_city: "",
      supp_country: "",
      supp_phone: "",
      supp_email: "",
    });
  };

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>{editData ? "Edit Supplier" : "Add Supplier"}</CardTitle>
        {/* <CardDescription>
          {editData ? "Edit Supplier" : "Add Supplier"}
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
              <Label htmlFor="supplier_code">Supplier Code</Label>
              <Input
                id="supplierCode"
                onChange={(e) =>
                  setSupplier({ ...supplier, supplier_code: e.target.value })
                }
                value={supplier.supplier_code}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="supplier_name">Name</Label>
              <Input
                id="supplierName"
                onChange={(e) =>
                  setSupplier({ ...supplier, supplier_name: e.target.value })
                }
                value={supplier.supplier_name}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="suppAddr1">Address</Label>
              <textarea
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                id="suppAddr1"
                onChange={(e) =>
                  setSupplier({ ...supplier, supp_addr1: e.target.value })
                }
                value={supplier.supp_addr1}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="suppCity">City</Label>
              <Input
                id="suppCity"
                onChange={(e) =>
                  setSupplier({ ...supplier, supp_city: e.target.value })
                }
                value={supplier.supp_city}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="suppCountry">Country</Label>
              <Input
                id="suppCountry"
                onChange={(e) =>
                  setSupplier({ ...supplier, supp_country: e.target.value })
                }
                value={supplier.supp_country}
                placeholder=""
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="suppPhone">Phone</Label>
              <Input
                id="suppPhone"
                onChange={(e) =>
                  setSupplier({ ...supplier, supp_phone: e.target.value })
                }
                value={supplier.supp_phone}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="suppEmail">Email</Label>
              <Input
                id="suppEmail"
                onChange={(e) =>
                  setSupplier({ ...supplier, supp_email: e.target.value })
                }
                value={supplier.supp_email}
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
          {editData ? "Update" : "Add"}
        </Button>
      </CardFooter>
    </Card>
  );
}
