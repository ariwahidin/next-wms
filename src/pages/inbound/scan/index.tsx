import BarcodeTable from "./BarcodeTable";
import { ScanForm } from "./ScanForm";
import { useState, useEffect } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import Layout from "@/components/layout";
import { HeaderForm } from "../HeaderForm";
import eventBus from "@/utils/eventBus";
import DataTableModal from "./DataTableModal";
import PalletTable from "./PalletTable";

export default function Page() {
  const [dataToPost, setDataToPost] = useState({
    subtitle : "Scan Inbound",
    scan_type: null,
    item_info : null,
    detail_inbound: [],
    item_options: [],
    scanned_item: null,
    inbound: null,
    inbound_id: null,
    inbound_detail_id: null,
    item_code: null,
    pallet: "",
    location: "RCVDOCK",
    gmc: "",
    serial_number: "",
    serial_number_2: "",
    whs_code: "",
    qa_status: "",
    quantity: 1,
  });
  const [editData, setEditData] = useState(null);
  const [dataHeader, setDataHeader] = useState({
    inbound_no: "Auto Generate",
    supplier_code: null,
    invoice: "",
    transporter_code: null,
    driver_name: "",
    truck_size: null,
    truck_no: "",
    inbound_date: new Date().toISOString().split("T")[0],
    container_no: "",
    bl_no: "",
    po_no: "",
    po_date: new Date().toISOString().split("T")[0],
    sj_no: "",
    origin: null,
    time_arrival: "00:00",
    start_unloading: "00:00",
    finish_unloading: "00:00",
    remarks_header: "",
  });

  async function handleSave() {
    try {
      const res = await api.post("/inbound", dataHeader || {}, {
        withCredentials: true,
      });
      if (res.data.success) {
        // alert("Inbound berhasil disimpan");

        eventBus.emit("showAlert", {
          title: "Success!",
          description: "Saved",
          type: "success",
        });

        window.location.href = "/inbound/list";
      }
    } catch (error) {
      console.error("Error saving inbound:", error);
      // alert("Error saving inbound");
    }
  }

  const [loading, setLoading] = useState(true);

  // set title
  useEffect(() => {
    setLoading(true);
    document.title = "Scan Inbound";
    setLoading(false);
    console.log("Data Barcode : ", editData);
  }, [editData]);

  return loading ? (
    <p>Loading...</p>
  ) : (
    <Layout title="Inbound" subTitle={dataToPost.subtitle}>
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-1">
        <Tabs defaultValue="scan" className="w-full">
          <TabsList>
            <TabsTrigger value="scan">Scan</TabsTrigger>
            <TabsTrigger value="pallet">Pallet</TabsTrigger>
            <TabsTrigger value="actual">Actual</TabsTrigger>
          </TabsList>
          <TabsContent value="scan">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 ">
              <ScanForm dataToPost={dataToPost} setDataToPost={setDataToPost} />
            </div>
          </TabsContent>
          <TabsContent value="pallet">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="col-span-2">
                <PalletTable dataToPost={dataToPost} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="actual">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="col-span-2">
                <BarcodeTable dataToPost={dataToPost} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
