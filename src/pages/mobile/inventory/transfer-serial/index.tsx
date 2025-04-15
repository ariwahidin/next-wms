"use client";

import PageHeader from "@/components/mobile/PageHeader";

export default function TransferBySerialPage() {
  return (
    <>
      <PageHeader title="Transfer by Serial" showBackButton />
      <div className="px-4 pt-4 pb-20 min-h-screen bg-gray-50">
        <p className="text-gray-600">Scan and manage serial-based transfers here.</p>
      </div>
    </>
  );
}
