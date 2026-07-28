import { useState } from "react";
import Layout from "@/components/layout";
import CategoryForm from "./CategoryForm";
import CategoryTable from "./CategoryTable";

export default function Page() {
  const [editData, setEditData] = useState(null);
  return (
    <Layout title="Master" subTitle="Item Category">
      <div className="p-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-2">
          <CategoryTable setEditData={setEditData} />
        </div>
        <div className="col-span-1">
          <CategoryForm editData={editData} setEditData={setEditData} />
        </div>
      </div>
    </Layout>
  );
}