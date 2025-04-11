import useAuth from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import Layout from "@/components/layout";
import TransporterTable from "./TransporterTable";
import TransporterForm from "./TransporterForm";

export default function Page() {
  useAuth();
  const [editData, setEditData] = useState(null);
  useEffect(() => {
    document.title = "Master Supplier";
  }, []);

  return (
    <Layout title="Master" subTitle="Transporter">
      <div className="p-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-2">
          <TransporterTable setEditData={setEditData} />
        </div>
        <div className="col-span-1">
          <TransporterForm editData={editData} setEditData={setEditData} />
        </div>
      </div>
    </Layout>
  );
}
