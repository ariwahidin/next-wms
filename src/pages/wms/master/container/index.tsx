import { useState } from "react";
import Layout from "@/components/layout";
import MasterCartonForm from "./MasterCartonForm";
import MasterCartonTable from "./MasterCartonTable";

export default function Page() {
    const [editData, setEditData] = useState(null);

    return (
        <Layout title="Master" subTitle="Container">
            <div className="p-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <MasterCartonTable setEditData={setEditData} />
                </div>
                <div className="lg:col-span-1">
                    <MasterCartonForm editData={editData} setEditData={setEditData} />
                </div>
            </div>
        </Layout>
    );
}