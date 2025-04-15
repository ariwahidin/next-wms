"use client";

import PageHeader from "@/components/mobile/PageHeader";

export default function ItemMutationPage() {
  return (
    <>
      <PageHeader title="Item Mutation" showBackButton />
      <div className="px-4 pt-4 pb-20 min-h-screen bg-gray-50">
        <p className="text-gray-600">Record and view item mutations.</p>
      </div>
    </>
  );
}
