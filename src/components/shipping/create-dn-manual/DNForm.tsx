/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MuatanTable from "@/components/shipping/create-dn-manual/MuatanForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import {
  AlertDialogContent,
  AlertDialogTitle,
} from "@radix-ui/react-alert-dialog";
import { Button } from "@/components/ui/button";

export default function DnForm() {
  const [alamatPengiriman, setAlamatPengiriman] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [header, setHeader] = useState({
    alamatPengiriman: "",
    tanggalKirim: "",
  });

  const [items, setItems] = useState([
    { id: 1, namaBarang: "Kertas A4", qty: 10, uom: "pcs", status: "active" },
    { id: 2, namaBarang: "Bolpen Hitam", qty: 5, uom: "pcs", status: "active" },
    // Tambahkan item lainnya sesuai kebutuhan
  ]);

  const handleSimpanHeader = () => {
    const data = {
      header: header, // misalnya alamat, tanggal, dll
      muatan: items.filter((item) => item.status !== "deleted"), // atau semua item valid
    };
    console.log("Mengirim data ke backend:", data);
    setShowModal(false);
  };

  return (
    <div className="p-6">
      <form className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="alamat">Alamat Pengiriman</Label>
            <Input
              id="alamat"
              value={alamatPengiriman}
              onChange={(e) => setAlamatPengiriman(e.target.value)}
            />
          </div>
          {/* Tambahkan input header lainnya di sini */}
        </div>
      </form>

      <hr className="my-6" />
      <MuatanTable />
    </div>
  );
}
