"use client";

import PageHeader from "@/components/mobile/PageHeader";

export default function LocationTransferPage() {
  return (
    <>
      <PageHeader title="Location Transfer" showBackButton />
      <div className="px-4 pt-4 pb-20 min-h-screen bg-gray-50">
        {/* Contoh isi */}
        <p className="text-gray-600">List of location transfer requests will be shown here.</p>
      </div>
    </>
  );
}
