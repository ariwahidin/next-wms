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
import { Transporter } from "@/types/transporter";

export default function TransporterForm({ editData, setEditData }) {
  const [transporter, setTransporter] = useState<Transporter>({
    ID: 0,
    transporter_code: "",
    transporter_name: "",
    transporter_address: "",
    city: "",
    phone: "",
    email: "",
    pic: "",
  });
  const [error, setError] = useState<string | null>(null);

  // 🔥 Jika editData berubah, isi form dengan data produk yang dipilih
  useEffect(() => {
    if (editData) {
      setTransporter(editData);
    }
  }, [editData]);

  async function handleSubmit(e) {
    e.preventDefault();

    // Validasi form
    if (
      transporter.transporter_code === "" ||
      transporter.transporter_name === "" ||
      transporter.transporter_address === ""
    ) {
      setError("Please fill all the fields.");
      return;
    }

    try {
      setError(null); // Reset error message jika form valid

      if (editData) {
        console.log(editData);
        // 🔥 Update produk jika sedang dalam mode edit
        await api.put(`/transporters/${editData.ID}`, transporter);
      } else {
        // 🔥 Tambah produk baru jika tidak sedang edit
        await api.post("/transporters", transporter);
      }

      mutate("/transporters");
      setEditData(null);
      setError(null);
      setTransporter({
        ID: 0,
        transporter_code: "",
        transporter_name: "",
        transporter_address: "",
        city: "",
        phone: "",
        email: "",
        pic: "",
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
    setTransporter({
      ID: 0,
      transporter_code: "",
      transporter_name: "",
      transporter_address: "",
      city: "",
      phone: "",
      email: "",
      pic: "",
    });
  };

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>
          {editData ? "Edit Transporter" : "Add Transporter"}
        </CardTitle>
        {/* <CardDescription>
          {editData ? "Edit Transporter" : "Add Transporter"}
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
              <Label htmlFor="">Transporter Code</Label>
              <Input
                id="transporterCode"
                onChange={(e) =>
                  setTransporter({
                    ...transporter,
                    transporter_code: e.target.value.toUpperCase(),
                  })
                }
                value={transporter.transporter_code}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="">Name</Label>
              <Input
                id="transporterName"
                onChange={(e) =>
                  setTransporter({
                    ...transporter,
                    transporter_name: e.target.value,
                  })
                }
                value={transporter.transporter_name}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="">Address</Label>
              <textarea
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                id="transporterAddress"
                onChange={(e) =>
                  setTransporter({
                    ...transporter,
                    transporter_address: e.target.value,
                  })
                }
                value={transporter.transporter_address}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="">City</Label>
              <Input
                id="transporterCity"
                onChange={(e) =>
                  setTransporter({
                    ...transporter,
                    city: e.target.value,
                  })
                }
                value={transporter.city}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="">Phone</Label>
              <Input
                id="transporterCity"
                onChange={(e) =>
                  setTransporter({
                    ...transporter,
                    phone: e.target.value,
                  })
                }
                value={transporter.phone}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="">Email</Label>
              <Input
                id="transporterEmail"
                onChange={(e) =>
                  setTransporter({
                    ...transporter,
                    email: e.target.value,
                  })
                }
                value={transporter.email}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="">PIC</Label>
              <Input
                id="transporterPic"
                onChange={(e) =>
                  setTransporter({
                    ...transporter,
                    pic: e.target.value,
                  })
                }
                value={transporter.pic}
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
