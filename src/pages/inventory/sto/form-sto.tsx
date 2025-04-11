// "use client";

// import { useState } from "react";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { addAktivitas } from "@/lib/db";

// export default function StockTakeForm({ onSave }) {
//   const [form, setForm] = useState({
//     kodeLokasi: "",
//     kodeBarang: "",
//     serialNumber: "",
//     jumlahFisik: 1,
//     catatan: "",
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const newData = { ...form, createdAt: new Date().toISOString() };
//     await addAktivitas(newData);
//     setForm({ kodeLokasi: "", kodeBarang: "", jumlahFisik: "", catatan: "" });
//     onSave(); // refresh list
//   };

//   return (
//     <Card className="mb-4">
//       <CardHeader>
//         <CardTitle>Form Activity</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <form onSubmit={handleSubmit} className="space-y-3">
//           <div>
//             <Label>Location</Label>
//             <Input
//               name="kodeLokasi"
//               value={form.kodeLokasi}
//               onChange={handleChange}
//               required
//             />
//           </div>
//           <div>
//             <Label>Barcode</Label>
//             <Input
//               name="kodeBarang"
//               value={form.kodeBarang}
//               onChange={handleChange}
//               required
//             />
//           </div>
//           <div>
//             <Label>Serial Number</Label>
//             <Input
//               name="serialNumber"
//               value={form.serialNumber}
//               onChange={handleChange}
//               required
//             />
//           </div>

//           <div>
//             <Label>Qty</Label>
//             <Input
//               defaultValue={form.jumlahFisik}
//               type="number"
//               name="jumlahFisik"
//               value={form.jumlahFisik}
//               onChange={handleChange}
//               required
//             />
//           </div>
//           <div>
//             <Label>Catatan</Label>
//             <Textarea
//               name="catatan"
//               value={form.catatan}
//               onChange={handleChange}
//             />
//           </div>
//           <Button type="submit" className="w-full">
//             Simpan
//           </Button>
//         </form>
//       </CardContent>
//     </Card>
//   );
// }

"use client";

import { useRef, useState } from "react";
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
    serialNumber: "",
    jumlahFisik: 1,
    catatan: "",
  });

  const kodeBarangRef = useRef(null);
  const serialNumberRef = useRef(null);
  const jumlahFisikRef = useRef(null);
  const catatanRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAutoSubmit = async () => {
    // Pastikan semua field selain kodeLokasi terisi
    const { kodeBarang, serialNumber, jumlahFisik } = form;
    if (kodeBarang && serialNumber && jumlahFisik > 0) {
      const newData = { ...form, createdAt: new Date().toISOString() };
      await addAktivitas(newData);

      // Reset field kecuali kodeLokasi
      setForm((prev) => ({
        ...prev,
        kodeBarang: "",
        serialNumber: "",
        jumlahFisik: 1,
        catatan: "",
      }));

      // Fokus kembali ke barcode
      kodeBarangRef.current?.focus();
      onSave(); // refresh list
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Form Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
          <div>
            <Label>Location</Label>
            <Input
              name="kodeLokasi"
              value={form.kodeLokasi}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label>Barcode</Label>
            <Input
              name="kodeBarang"
              value={form.kodeBarang}
              onChange={handleChange}
              ref={kodeBarangRef}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  serialNumberRef.current?.focus();
                }
              }}
              required
            />
          </div>
          <div>
            <Label>Serial Number</Label>
            <Input
              name="serialNumber"
              value={form.serialNumber}
              onChange={handleChange}
              ref={serialNumberRef}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  jumlahFisikRef.current?.focus();
                }
              }}
              required
            />
          </div>

          <div>
            <Label>Qty</Label>
            <Input
              type="number"
              name="jumlahFisik"
              value={form.jumlahFisik}
              ref={jumlahFisikRef}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  catatanRef.current?.focus();
                }
              }}
              required
            />
          </div>
          <div>
            <Label>Catatan</Label>
            <Textarea
              name="catatan"
              value={form.catatan}
              onChange={handleChange}
              ref={catatanRef}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAutoSubmit();
                }
              }}
            />
          </div>

          {/* Tombol manual kalau diperlukan */}
          <Button
            type="button"
            className="w-full"
            onClick={handleAutoSubmit}
          >
            Simpan
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

