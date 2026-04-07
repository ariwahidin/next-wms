import { useState } from "react";
import Layout from "@/components/layout";
import DivisionForm from "./DivisionForm";
import DivisionTable from "./DivisionTable";

export default function Page() {
  const [editData, setEditData] = useState(null);
  return (
    <Layout title="Master" subTitle="Division">
      <div className="p-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-2">
          <DivisionTable setEditData={setEditData} />
        </div>
        <div className="col-span-1">
          <DivisionForm editData={editData} setEditData={setEditData} />
        </div>
      </div>
    </Layout>
  );
}