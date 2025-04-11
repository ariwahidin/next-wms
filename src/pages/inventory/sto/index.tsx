"use client";

import { useState } from "react";
import Layout from "@/components/layout";
import StockTakeForm from "./form-sto";
import StockTakeList from "./list-sto";
import BottomNav from "./bottom-nav";
import UploadedList from "./uploaded-list"; // import baru

// const handleUpload = async () => {
//   const data = await getAllAktivitas();
//   const res = await fetch("/api/upload", {
//     method: "POST",
//     body: JSON.stringify(data),
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });

//   if (res.ok) {
//     alert("Upload berhasil!");
//     await clearAktivitas(); // hapus dari IDB
//     setRefreshSignal(Date.now()); // refresh list
//   } else {
//     alert("Gagal upload.");
//   }
// };

export default function Page() {
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [active, setActive] = useState("aktivitas");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = () => {
    setRefreshSignal((prev) => prev + 1);
  };

  const handleUpload = async () => {
    setUploading(true);
    // await uploadToServer(); // simulasi upload ke server
    setUploading(false);
    setShowUploadDialog(false);
    handleSave(); // refresh list
  };

  const refresh = () => setRefreshSignal((prev) => prev + 1);

  return (
    <Layout title="STO" subTitle="Stock Take">
      <div className="p-4 max-w-md mx-auto">
        {active === "listSto" && <UploadedList />}
        {active === "aktivitas" && (
          <>
            <StockTakeForm onSave={handleSave} />
            <StockTakeList refreshSignal={refreshSignal} />
          </>
        )}
        {/* <StockTakeForm onSave={refresh} />
        <StockTakeList refreshSignal={refreshSignal} /> */}
        <BottomNav active={active} setActive={setActive} onUpload={refresh} />
      </div>
    </Layout>
  );
}
