"use client";
import SuratJalanManager from "@/components/shipping/SuratJalanManager";

// Add this as a new tab/section on the existing SPK detail screen.
// Do not replace the current ManualForm or ItemFormTable.
export default function SPKSuratJalanSection({ orderNo }: { orderNo: string }) {
  return <SuratJalanManager orderNo={orderNo} />;
}
