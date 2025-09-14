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

import { useEffect, useState } from "react";
import OutboundTable from "./OutboundTable";
import Layout from "@/components/layout";
import PackingTable from "../packing/data/PackingTable";
import OrderTable from "../order-spk/data/OrderTable";
// import { useSearchParams } from "react-router-dom";
// import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";

export default function Page() {
  const router = useRouter();
  const { tab } = router.query;
  const [activeTab, setActiveTab] = useState("Picking List");
  useEffect(() => {
    if (typeof tab === "string") {
      setActiveTab(tab);
    }
  }, [tab]);
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
          <button
            onClick={() => setActiveTab("Order SPK")}
            className={`px-4 py-2 ${
              activeTab === "Order SPK"
                ? "border-b-2 border-blue-500 font-semibold"
                : "text-gray-500"
            }`}
          >
            Order SPK
          </button>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
          {activeTab === "Picking List" && <OutboundTable />}
          {activeTab === "Packing List" && <PackingTable />}
          {activeTab === "Order SPK" && <OrderTable />}
        </div>
      </div>
    </Layout>
  );
}
