
/* eslint-disable @typescript-eslint/no-unused-vars */
import useAuth from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import Layout from "@/components/layout";
import TruckTable from "./TruckTable";
import TruckForm from "./TruckForm";

export default function Page() {
  useAuth();
  const [editData, setEditData] = useState(null);
  return (
    <Layout title="Master" subTitle="Truck">
      <div className="p-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-2">
          <TruckTable setEditData={setEditData} />
        </div>
        <div className="col-span-1">
          <TruckForm editData={editData} setEditData={setEditData} />
        </div>
      </div>
    </Layout>
  );
}
