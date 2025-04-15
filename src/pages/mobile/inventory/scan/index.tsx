"use client";

import PageHeader from "@/components/mobile/PageHeader";

export default function ScanItemPage() {
  return (
    <>
      <PageHeader title="Scan Item" showBackButton />
      <div className="px-4 pt-4 pb-20 min-h-screen bg-gray-50">
        <p className="text-gray-600">Scan items for tracking or transfers.</p>
      </div>
    </>
  );
}
