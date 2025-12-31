
import { useState } from "react";
import Layout from "@/components/layout";
import Form from "./Form";
import Table from "./Table";

export default function Page() {
  const [editData, setEditData] = useState(null);
  return (
    <Layout title="Master" subTitle="Warehouse">
      <div className="p-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-2">
          <Table setEditData={setEditData} />
        </div>
        <div className="col-span-1">
          <Form editData={editData} setEditData={setEditData} />
        </div>
      </div>
    </Layout>
  );
}
