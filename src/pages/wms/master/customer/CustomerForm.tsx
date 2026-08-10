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
import { Customer } from "@/types/customer";
import Select from "react-select";

type Option = { value: string; label: string };

const emptyCustomer: Customer = {
  ID: 0,
  owner_code: "",
  customer_code: "",
  customer_name: "",
  cust_addr1: "",
  cust_addr2: "",
  cust_city: "",
  cust_area: "",
  cust_country: "",
  cust_phone: "",
  cust_email: "",
};

interface CustomerFormProps {
  editData: any;
  setEditData: (data: any) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function CustomerForm({ editData, setEditData, open, setOpen }: CustomerFormProps) {
  const [customer, setCustomer] = useState<Customer>(emptyCustomer);

  const [error, setError] = useState<string | null>(null);
  // Owner
  const [ownerOptions, setOwnerOptions] = useState<Option[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<Option | null>(null);

  // 🔥 Isi form dengan data customer yang dipilih saat modal dibuka untuk edit,
  // atau kosongkan saat dibuka untuk tambah baru
  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editData) {
      setCustomer(editData);
    } else {
      setCustomer(emptyCustomer);
    }
  }, [open, editData]);

  useEffect(() => {
    (async () => {
      const [ownerRes] = await Promise.all([
        fetchOwners(),
      ]);

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
      setError(null); // Reset error message jika form valid

      if (editData) {
        // 🔥 Update customer jika sedang dalam mode edit
        await api.put(
          `/customers/${editData.ID}`, customer,
          { withCredentials: true }
        );
      } else {
        // 🔥 Tambah customer baru jika tidak sedang edit
        await api.post(
          "/customers", customer,
          { withCredentials: true }
        );
      }

      mutate("/customers");
      setEditData(null);
      setCustomer(emptyCustomer);
      setOpen(false);
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
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e as any); // Submit form saat Enter
    }
  };

  const handleCancel = () => {
    setError(null);
    setEditData(null);
    setCustomer(emptyCustomer);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); else setOpen(o); }}>
      <DialogContent className="max-w-2xl bg-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit Customer" : "Add Customer"}</DialogTitle>
          <DialogDescription>
            {editData ? "Update the customer details below." : "Fill in the details for the new customer."}
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

            {/* Owner */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="owner">Owner</Label>
              <Select<Option>
                inputId="owner"
                classNamePrefix="rs"
                placeholder="Select owner"
                options={ownerOptions}
                value={ownerOptions.find(o => o.value === customer.owner_code) || null}
                onChange={(opt: Option | null) => {
                  setSelectedOwner(opt);
                  setCustomer({ ...customer, owner_code: opt?.value || "" });
                }}
                isClearable
              />
            </div>

            <div className="flex flex-col space-y-1">
              <Label htmlFor="customerCode">Customer Code</Label>
              <Input
                readOnly={editData ? true : false}
                id="customerCode"
                onChange={(e) => setCustomer({ ...customer, customer_code: e.target.value.toLocaleUpperCase() })}
                value={customer.customer_code}
                placeholder=""
              />
            </div>

            <div className="flex flex-col space-y-1 col-span-2">
              <Label htmlFor="customerName">Name</Label>
              <Input
                id="customerName"
                onChange={(e) => setCustomer({ ...customer, customer_name: e.target.value })}
                value={customer.customer_name}
                placeholder=""
              />
            </div>

            <div className="flex flex-col space-y-1 col-span-2">
              <Label htmlFor="customerAddr1">Address</Label>
              <textarea
                className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                id="customerAddr1"
                onChange={(e) => setCustomer({ ...customer, cust_addr1: e.target.value })}
                value={customer.cust_addr1}
                placeholder=""
              />
            </div>

            <div className="flex flex-col space-y-1">
              <Label htmlFor="customerCity">City</Label>
              <Input
                id="customerCity"
                onChange={(e) => setCustomer({ ...customer, cust_city: e.target.value })}
                value={customer.cust_city}
                placeholder=""
              />
            </div>

            <div className="flex flex-col space-y-1">
              <Label htmlFor="customerCountry">Country</Label>
              <Input
                id="customerCountry"
                onChange={(e) => setCustomer({ ...customer, cust_country: e.target.value })}
                value={customer.cust_country}
                placeholder=""
              />
            </div>

            <div className="flex flex-col space-y-1">
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                onChange={(e) => setCustomer({ ...customer, cust_phone: e.target.value })}
                value={customer.cust_phone}
                placeholder=""
              />
            </div>

            <div className="flex flex-col space-y-1">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                onChange={(e) => setCustomer({ ...customer, cust_email: e.target.value })}
                value={customer.cust_email}
                placeholder=""
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