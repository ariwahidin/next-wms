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
import { Customer } from "@/types/customer";

export default function CustomerForm({ editData, setEditData }) {
  const [customer, setCustomer] = useState<Customer>({
    ID: 0,
    customer_code: "",
    customer_name: "",
    cust_addr1: "",
    cust_addr2: "",
    cust_city: "",
    cust_area: "",
  });

  const [error, setError] = useState<string | null>(null);

  // 🔥 Jika editData berubah, isi form dengan data produk yang dipilih
  useEffect(() => {
    if (editData) {
      setCustomer(editData);
    }
  }, [editData]);

  async function handleSubmit(e) {
    e.preventDefault();
    

    try {
      setError(null); // Reset error message jika form valid

      if (editData) {
        console.log(editData);
        // 🔥 Update produk jika sedang dalam mode edit
        await api.put(
          `/customers/${editData.ID}`,customer,
          { withCredentials: true }
        );
      } else {
        // 🔥 Tambah produk baru jika tidak sedang edit
        await api.post(
          "/customers",customer,
          { withCredentials: true }
        );
      }

      mutate("/customers");
      setEditData(null); 
      setCustomer({ ID: 0, customer_code: "", customer_name: "", cust_addr1: "", cust_addr2: "", cust_city: "", cust_area: "", cust_country: "", cust_phone: "", cust_email: "" });
      
      document.getElementById("customerCode")?.focus();
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
    setCustomer({ ID: 0, customer_code: "", customer_name: "", cust_addr1: "", cust_addr2: "", cust_city: "", cust_area: "" });
  };

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>{editData ? "Edit Customer" : "Add Customer"}</CardTitle>
        {/* <CardDescription>
          {editData ? "Edit Customer" : "Add Customer"}
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
            <div className="flex flex-col space-y-1">
              <Label htmlFor="item_code">Customer Code</Label>
              <Input
                readOnly = {editData ? true : false}
                id="customerCode"
                onChange={(e) => setCustomer({ ...customer, customer_code: e.target.value })}
                value={customer.customer_code}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1">
              <Label htmlFor="item_name">Name</Label>
              <Input
                id="customerName"
                onChange={(e) => setCustomer({ ...customer, customer_name: e.target.value })}
                value={customer.customer_name}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1">
              <Label htmlFor="item_name">Address</Label>
              <textarea
                className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                id="customerAddr1"
                onChange={(e) => setCustomer({ ...customer, cust_addr1: e.target.value })}
                value={customer.cust_addr1}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1">
              <Label htmlFor="item_name">City</Label>
              <Input
                id="customerCity"
                onChange={(e) => setCustomer({ ...customer, cust_city: e.target.value })}
                value={customer.cust_city}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1">
              <Label htmlFor="item_name">Country</Label>
              <Input
                id="customerCountry"
                onChange={(e) => setCustomer({ ...customer, cust_country: e.target.value })}
                value={customer.cust_country}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1">
              <Label htmlFor="item_name">Phone</Label>
              <Input
                id="customerPhone"
                onChange={(e) => setCustomer({ ...customer, cust_phone: e.target.value })}
                value={customer.cust_phone}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1">
              <Label htmlFor="item_name">Email</Label>
              <Input
                id="customerEmail"
                onChange={(e) => setCustomer({ ...customer, cust_email: e.target.value })}
                value={customer.cust_email}
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

