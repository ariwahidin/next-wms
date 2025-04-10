"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addAktivitas } from "@/lib/db";

export default function StockTakeForm({ onSave }) {
  const [form, setForm] = useState({
    kodeLokasi: "",
    kodeBarang: "",
    jumlahFisik: "",
    catatan: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newData = { ...form, createdAt: new Date().toISOString() };
    await addAktivitas(newData);
    setForm({ kodeLokasi: "", kodeBarang: "", jumlahFisik: "", catatan: "" });
    onSave(); // refresh list
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Input Aktivitas</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Kode Lokasi</Label>
            <Input
              name="kodeLokasi"
              value={form.kodeLokasi}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label>Kode Barang</Label>
            <Input
              name="kodeBarang"
              value={form.kodeBarang}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label>Jumlah Fisik</Label>
            <Input
              type="number"
              name="jumlahFisik"
              value={form.jumlahFisik}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label>Catatan</Label>
            <Textarea
              name="catatan"
              value={form.catatan}
              onChange={handleChange}
            />
          </div>
          <Button type="submit" className="w-full">
            Simpan
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
