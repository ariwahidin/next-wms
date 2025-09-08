import Layout from "@/components/layout";
import HandlingTable from "./HandlingTable";
import HandlingForm from "./HandlingForm";
import { useState } from "react";

export default function Handling() {
  const [editData, setEditData] = useState(null);
  return (
    <Layout title="Master" subTitle="VAS">
      <div className="p-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-2">
          <HandlingTable setEditData={setEditData} />
        </div>
        <div className="col-span-1">
          <HandlingForm editData={editData} setEditData={setEditData} />
        </div>
      </div>
    </Layout>
  );
}
