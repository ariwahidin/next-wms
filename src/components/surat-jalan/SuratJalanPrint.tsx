/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import ReactQRCode from "react-qr-code";

export default function SuratJalanPrint() {
  const [qrValue, setQrValue] = useState("");

  const suratJalanData = {
    nomor: "SJ-001/2025",
    tanggal: "2025-05-02",
    pengirim: "PT. Logistik Maju Jaya",
    penerima: "CV. Sukses Abadi",
    alamat: "Jl. Raya Industri No. 123, Jakarta",
    details: [
      { ship_to_code: "SHP908",  ship_to_name: "CV. Sukses Abadi", city: "Jakarta", do: "DO-001", total_item: 5, total_qty: 10, total_vol: 2.5, total_gross_weight: 100 },
      { ship_to_code: "SHP909",  ship_to_name: "PT. Maju Mundur", city: "Bandung", do: "DO-002", total_item: 3, total_qty: 6, total_vol: 1.5, total_gross_weight: 50 },
      { ship_to_code: "SHP910",  ship_to_name: "PT. Jaya Abadi", city: "Surabaya", do: "DO-003", total_item: 4, total_qty: 8, total_vol: 2.0, total_gross_weight: 80 },
      { ship_to_code: "SHP911",  ship_to_name: "CV. Sejahtera", city: "Semarang", do: "DO-004", total_item: 2, total_qty: 4, total_vol: 1.0, total_gross_weight: 30 },
    ],
  };

  const { nomor, tanggal, pengirim, penerima, alamat, details } = suratJalanData;

  // Extract SPK number from the SJ number (assuming format is consistent)
  const spkNumber = nomor.replace("SJ-", "SPK");

  useEffect(() => {
    // Generate QR code URL with dynamic SPK
    setQrValue(`http://127.0.0.1:3000/mobile/tracking/guest?spk=SPKYM25050001`);
  }, []);

  // Calculate totals for footer
  const totalQty = details.reduce((sum, item) => sum + item.total_qty, 0);
  const totalItems = details.reduce((sum, item) => sum + item.total_item, 0);
  const totalVolume = details.reduce((sum, item) => sum + item.total_vol, 0);
  const totalWeight = details.reduce((sum, item) => sum + item.total_gross_weight, 0);

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white text-black">
      {/* Kop Surat */}
      <div className="flex items-center justify-between border-b pb-4 mb-6">
        <div className="flex items-center">
          <Image src="/images/yusen001.jpeg" alt="Logo" width={80} height={80} />
          <div className="ml-4">
            <h2 className="text-xl font-bold">PT Yusen Logistics Puninar Indonesia</h2>
            <p className="text-sm">Jl. Raya Industri No. 123, Jakarta</p>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center">
          <div className="mb-1" style={{ background: "white", padding: "8px" }}>
            <ReactQRCode value={qrValue} size={80} />
          </div>
          <p className="text-xs text-center">Scan untuk tracking</p>
        </div>
      </div>

      {/* Judul */}
      <h2 className="text-center font-bold underline mb-3">
        SURAT PERINTAH KIRIM
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
      </div>

      {/* Tabel Barang */}
      <table className="w-full border border-collapse text-sm">
        <thead className="bg-gray-100" style={{ fontSize: "12px" }}>
          <tr>
            <th className="border px-4 py-1">No</th>
            <th className="border px-4">Ship To</th>
            <th className="border px-4" style={{ width: "200px" }}>Ship To Name</th>
            <th className="border px-4">City</th>
            <th className="border px-4" style={{ width: "100px" }}>DO</th>
            <th className="border px-4">Total Item</th>
            <th className="border px-4">Total Qty</th>
            <th className="border px-4">Total Vol.</th>
            <th className="border px-4">Total Gross Weight</th>
          </tr>
        </thead>
        <tbody className="text-center" style={{ fontSize: "12px" }}>
          {details.map((item, index) => (
            <tr key={index} style={{ height: "30px" }}>
              <td className="border px-4  text-center">{index + 1}</td>
              <td className="border px-4">{item.ship_to_code}</td>
              <td className="border px-4">{item.ship_to_name}</td>
              <td className="border px-4">{item.city}</td>
              <td className="border px-4">{item.do}</td>
              <td className="border px-4">{item.total_item}</td>
              <td className="border px-4">{item.total_qty}</td>
              <td className="border px-4">{item.total_vol}</td>
              <td className="border px-4">{item.total_gross_weight}</td>
            </tr>
          ))}
        </tbody>
        {/* Footer for totals */}
        <tfoot className="bg-gray-50 font-semibold" style={{ fontSize: "12px" }}>
          <tr>
            <td className="border px-4 py-2" colSpan={5} style={{ textAlign: "right" }}>Total:</td>
            <td className="border px-4">{totalItems}</td>
            <td className="border px-4">{totalQty}</td>
            <td className="border px-4">{totalVolume.toFixed(2)}</td>
            <td className="border px-4">{totalWeight}</td>
          </tr>
        </tfoot>
      </table>

      {/* Catatan Section */}
      <div className="mt-4 border border-gray-300 p-3">
        <p className="font-semibold mb-1" style={{ fontSize: "12px" }}>Catatan:</p>
        <div className="h-16" style={{ fontSize: "12px" }}></div>
      </div>

      {/* Tanda Tangan */}
      <div className="flex justify-between mt-8 text-sm">
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
