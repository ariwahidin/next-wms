"use client";

import PageHeader from "@/components/mobile/PageHeader";

export default function StockAdjustmentPage() {
  return (
    <>
      <PageHeader title="Stock Adjustment" showBackButton />
      <div className="px-4 pt-4 pb-20 min-h-screen bg-gray-50">
        <p className="text-gray-600">Adjust stock levels and track changes.</p>
      </div>
    </>
  );
}
