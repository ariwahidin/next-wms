

import { useState } from "react";
import Layout from "@/components/layout";
import OutboundVasTable from "./OutboundVasTable";

export default function Page() {
  const [activeTab, setActiveTab] = useState("Order SPK");

  return (
    <Layout title="Outbound" subTitle={`Outbound Activity - ${activeTab}`}>
      <div className="p-4">
        {/* Tab Header */}
        <div className="flex border-b mb-4">
          <button
            onClick={() => setActiveTab("Picking List")}
            className={`px-4 py-2 ${
              activeTab === "Picking List"
                ? "border-b-2 border-blue-500 font-semibold"
                : "text-gray-500"
            }`}
          >
            Picking List
          </button>
          <button
            onClick={() => setActiveTab("Packing List")}
            className={`px-4 py-2 ${
              activeTab === "Packing List"
                ? "border-b-2 border-blue-500 font-semibold"
                : "text-gray-500"
            }`}
          >
            Packing List
          </button>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
          {activeTab === "Order SPK" && <OutboundVasTable />}
        </div>
      </div>
    </Layout>
  );
}
