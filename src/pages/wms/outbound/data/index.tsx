// import OutboundTable from "./OutboundTable";
// import Layout from "@/components/layout";

// export default function Page() {
//   return (
//     <Layout title="Outbound" subTitle="Outbound Activity">
//       <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-1">
//         <OutboundTable />
//       </div>
//     </Layout>
//   );
// }

import { useState } from "react";
import OutboundTable from "./OutboundTable";
import Layout from "@/components/layout";
import PackingTable from "../packing/data/PackingTable";

export default function Page() {
  const [activeTab, setActiveTab] = useState("Picking List");

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
          {activeTab === "Picking List" && <OutboundTable />}
          {activeTab === "Packing List" && <PackingTable />}
        </div>
      </div>
    </Layout>
  );
}
