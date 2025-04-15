"use client";

import PageHeader from "@/components/mobile/PageHeader";

export default function StockReportPage() {
  return (
    <>
      <PageHeader title="Stock Report" showBackButton />
      <div className="px-4 pt-4 pb-20 min-h-screen bg-gray-50">
        <p className="text-gray-600">Generate and export inventory reports.</p>
      </div>
    </>
  );
}
