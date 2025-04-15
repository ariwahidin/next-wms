"use client";

import PageHeader from "@/components/mobile/PageHeader";

export default function StockOpnamePage() {
  return (
    <>
      <PageHeader title="Stock Opname" showBackButton />
      <div className="px-4 pt-4 pb-20 min-h-screen bg-gray-50">
        <p className="text-gray-600">Start and manage physical stock counts.</p>
      </div>
    </>
  );
}
