import UserTable from "./UserTable";
import UserForm from "./UserForm";
import Layout from "@/components/layout";
import { useState } from "react";

export default function Page() {
  const [editData, setEditData] = useState(null);
  return (
    <Layout title="Master" subTitle="User">
      <div className="p-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* <div className="col-span-1">
          <UserTable setEditData={setEditData} />
        </div> */}
        {/* <div className="col-span-1">
          <UserForm editData={editData} setEditData={setEditData} />
        </div> */}
      </div>
    </Layout>
  );
}
