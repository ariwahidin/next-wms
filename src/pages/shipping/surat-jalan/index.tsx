"use client";

import SuratJalanPrint from "@/components/surat-jalan/SuratJalanPrint";
import { useEffect } from "react";
// import "./surat-jalan.css";

export default function SuratJalanPage() {
  const handlePrint = () => window.print();

  useEffect(() => {
    setTimeout(() => {
      handlePrint();
    }, 1000);
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="no-print mb-4 text-right">
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Print Surat Jalan
        </button>
      </div>
      <SuratJalanPrint />
    </div>
  );
}
