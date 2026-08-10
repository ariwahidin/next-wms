/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { mutate } from "swr";
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Supplier } from "@/types/supplier";
import Select from "react-select";

type Option = { value: string; label: string };

const emptySupplier: Supplier = {
  ID: 0,
  owner_code: "",
  supplier_code: "",
  supplier_name: "",
  supp_addr1: "",
  supp_addr2: "",
  supp_city: "",
  supp_area: "",
  supp_country: "",
  supp_phone: "",
  supp_email: "",
};

interface SupplierFormProps {
  editData: any;
  setEditData: (data: any) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function SupplierForm({ editData, setEditData, open, setOpen }: SupplierFormProps) {
  const [supplier, setSupplier] = useState<Supplier>(emptySupplier);

  const [error, setError] = useState<string | null>(null);
  // Owner
  const [ownerOptions, setOwnerOptions] = useState<Option[]>([]);

  // 🔥 Isi form dengan data supplier yang dipilih saat modal dibuka untuk edit,
  // atau kosongkan saat dibuka untuk tambah baru
  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editData) {
      setSupplier(editData);
    } else {
      setSupplier(emptySupplier);
    }
  }, [open, editData]);

  useEffect(() => {
    (async () => {
      const ownerRes = await fetchOwners();
      if (ownerRes?.success) {
        setOwnerOptions(
          (ownerRes.data || []).map((o: any) => ({
            value: o.code,
            label: o.code,
          }))
        );
      }
    })();
  }, []);

  const fetchOwners = async () => {
    try {
      const res = await api.get("/owners", { withCredentials: true });
      return res.data;
    } catch (err) {
      console.log("Fetch Owner error:", err);
      return { success: false, data: [] };
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setError(null);

      if (editData) {
        // 🔥 Update supplier jika sedang dalam mode edit
        await api.put(`/suppliers/${editData.ID}`, supplier, { withCredentials: true });
      } else {
        // 🔥 Tambah supplier baru jika tidak sedang edit
        await api.post("/suppliers", supplier, { withCredentials: true });
      }

      mutate("/suppliers");
      setEditData(null);
      setSupplier(emptySupplier);
      setOpen(false);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e as any);
    }
  };

  const handleCancel = () => {
    setError(null);
    setEditData(null);
    setSupplier(emptySupplier);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); else setOpen(o); }}>
      <DialogContent className="max-w-2xl bg-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
          <DialogDescription>
            {editData ? "Update the supplier details below." : "Fill in the details for the new supplier."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="owner">Owner</Label>
              <Select<Option>
                inputId="owner"
                classNamePrefix="rs"
                placeholder="Select owner"
                options={ownerOptions}
                value={ownerOptions.find((o) => o.value === supplier.owner_code) || null}
                onChange={(opt: Option | null) =>
                  setSupplier({ ...supplier, owner_code: opt?.value || "" })
                }
                isClearable
              />
            </div>

            <div className="flex flex-col space-y-1">
              <Label htmlFor="supplierCode">Supplier Code</Label>
              <Input
                readOnly={editData ? true : false}
                id="supplierCode"
                onChange={(e) =>
                  setSupplier({ ...supplier, supplier_code: e.target.value.toLocaleUpperCase() })
                }
                value={supplier.supplier_code}
              />
            </div>

            <div className="flex flex-col space-y-1 col-span-2">
              <Label htmlFor="supplierName">Name</Label>
              <Input
                id="supplierName"
                onChange={(e) => setSupplier({ ...supplier, supplier_name: e.target.value })}
                value={supplier.supplier_name}
              />
            </div>

            <div className="flex flex-col space-y-1 col-span-2">
              <Label htmlFor="supplierAddr1">Address</Label>
              <textarea
                className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                id="supplierAddr1"
                onChange={(e) => setSupplier({ ...supplier, supp_addr1: e.target.value })}
                value={supplier.supp_addr1}
              />
            </div>

            <div className="flex flex-col space-y-1">
              <Label htmlFor="supplierCity">City</Label>
              <Input
                id="supplierCity"
                onChange={(e) => setSupplier({ ...supplier, supp_city: e.target.value })}
                value={supplier.supp_city}
              />
            </div>

            <div className="flex flex-col space-y-1">
              <Label htmlFor="supplierCountry">Country</Label>
              <Input
                id="supplierCountry"
                onChange={(e) => setSupplier({ ...supplier, supp_country: e.target.value })}
                value={supplier.supp_country}
              />
            </div>

            <div className="flex flex-col space-y-1">
              <Label htmlFor="supplierPhone">Phone</Label>
              <Input
                id="supplierPhone"
                onChange={(e) => setSupplier({ ...supplier, supp_phone: e.target.value })}
                value={supplier.supp_phone}
              />
            </div>

            <div className="flex flex-col space-y-1">
              <Label htmlFor="supplierEmail">Email</Label>
              <Input
                id="supplierEmail"
                onChange={(e) => setSupplier({ ...supplier, supp_email: e.target.value })}
                value={supplier.supp_email}
              />
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} type="submit">
            {editData ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}