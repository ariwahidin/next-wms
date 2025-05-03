// app/surat-jalan/SuratJalanPrint.tsx
"use client";

import Image from "next/image";

export default function SuratJalanPrint() {
  // const { nomor, tanggal, pengirim, penerima, alamat, barang } = suratJalanData;

  const suratJalanData = {
    nomor: "SJ-001/2025",
    tanggal: "2025-05-02",
    pengirim: "PT. Logistik Maju Jaya",
    penerima: "CV. Sukses Abadi",
    alamat: "Jl. Raya Industri No. 123, Jakarta",
    barang: [
      { nama: "Box Kardus", jumlah: 10, satuan: "pcs" },
      { nama: "Pallet Kayu", jumlah: 5, satuan: "unit" },
    ],
  };

  const { nomor, tanggal, pengirim, penerima, alamat, barang } = suratJalanData;

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white text-black">
      {/* Kop Surat */}
      <div className="flex items-center border-b pb-4 mb-6">
        <Image src="/images/yusen001.jpeg" alt="Logo" width={80} height={80} />
        <div className="ml-4">
          <h1 className="text-xl font-bold">PT. LOGISTIK MAJU JAYA</h1>
          <p className="text-sm">Jl. Raya Industri No. 123, Jakarta</p>
        </div>
      </div>

      {/* Judul */}
      <h2 className="text-center text-2xl font-bold underline mb-6">
        SURAT JALAN
      </h2>

      {/* Info Pengiriman */}
      <div className="mb-6 text-sm">
        <p>
          <strong>No. Surat Jalan:</strong> {nomor}
        </p>
        <p>
          <strong>Tanggal:</strong> {tanggal}
        </p>
        <p>
          <strong>Pengirim:</strong> {pengirim}
        </p>
        <p>
          <strong>Penerima:</strong> {penerima}
        </p>
        <p>
          <strong>Alamat Tujuan:</strong> {alamat}
        </p>
      </div>

      {/* Tabel Barang */}
      <table className="w-full border border-collapse text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">No</th>
            <th className="border px-4 py-2">Nama Barang</th>
            <th className="border px-4 py-2">Jumlah</th>
            <th className="border px-4 py-2">Satuan</th>
          </tr>
        </thead>
        <tbody>
          {barang.map((item, index) => (
            <tr key={index}>
              <td className="border px-4 py-2 text-center">{index + 1}</td>
              <td className="border px-4 py-2">{item.nama}</td>
              <td className="border px-4 py-2 text-center">{item.jumlah}</td>
              <td className="border px-4 py-2 text-center">{item.satuan}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tanda Tangan */}
      <div className="flex justify-between mt-12 text-sm">
        <div className="text-center">
          <p>Pengirim</p>
          <div className="h-16"></div>
          <p>_____________________</p>
        </div>
        <div className="text-center">
          <p>Penerima</p>
          <div className="h-16"></div>
          <p>_____________________</p>
        </div>
      </div>
    </div>
  );
}
