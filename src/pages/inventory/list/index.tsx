import useAuth from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import InboundTable from "./InventoryTable";
import Layout from "@/components/layout";

export default function Page() {
  useAuth();
  const [editData, setEditData] = useState(null);

  return (
    <Layout title="Inventory" subTitle="List Inventory">
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-1">
        <InboundTable setEditData={setEditData} />
      </div>
      {/* <InboundTable /> */}
    </Layout>
  );
}
