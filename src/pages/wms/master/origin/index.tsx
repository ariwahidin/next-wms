
import { useState } from "react";
import Layout from "@/components/layout";
import OriginForm from "./OriginForm";
import OriginTable from "./OriginTable";

export default function Page() {
  const [editData, setEditData] = useState(null);
  return (
    <Layout title="Master" subTitle="Origin">
      <div className="p-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-2">
          <OriginTable setEditData={setEditData} />
        </div>
        <div className="col-span-1">
          <OriginForm editData={editData} setEditData={setEditData} />
        </div>
      </div>
    </Layout>
  );
}
