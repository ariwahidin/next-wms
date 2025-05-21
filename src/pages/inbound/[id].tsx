/* eslint-disable @typescript-eslint/no-unused-vars */
import ProductTable from "./ProductTable";
import ProductForm from "./ProductForm";
import { useState, useEffect } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import Layout from "@/components/layout";
import HeaderForm  from "./HeaderForm";
import eventBus from "@/utils/eventBus";
import { useRouter } from "next/router";

export default function Page() {
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

  const [formHeader, setFormHeader] = useState({});
  const [formItem, setFormItem] = useState({});

  async function handleSave() {
    try {
      const res = await api.post("/inbound", formHeader || {}, {
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

  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [subtitle, setSubtitle] = useState("Inbound");
  useEffect(() => {
    setLoading(true);

    const fecthData = async () => {
      try {
        if (!id) return;
        console.log("ID :", id);
        const [form] = await Promise.all([
          api.get("/inbound/" + id, { withCredentials: true }),
        ]);
        if (form.data.success) {
          setFormHeader(form.data.data?.form_header);
          setFormItem(form.data.data?.form_item);

          console.log(form.data.data?.form_header.inbound_no)

          setSubtitle("" + form.data.data?.form_header.inbound_no);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setTimeout(() => {}, 500);
      }
    };
    fecthData();
  }, [id]);

  return loading ? (
    <p>Loading...</p>
  ) : (
    <Layout title="List inbound" titleLink="/inbound/list" subTitle={subtitle}>
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-1">
        <Tabs defaultValue="account" className="w-full">
          <TabsList>
            <TabsTrigger value="account">Header</TabsTrigger>
            <TabsTrigger value="password">Items</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <Card>
              <CardContent>
                <HeaderForm
                  formHeader={formHeader}
                  setFormHeader={setFormHeader}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="password">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="col-span-2">
                <ProductTable
                  formHeader={formHeader}
                  setFormHeader={setFormHeader}
                  formItem={formItem}
                  setFormItem={setFormItem}
                  setEditData={setEditData}
                  editMode={false}
                  id={0}
                />
              </div>
              <div className="col-span-1">
                <ProductForm
                  editData={editData}
                  setEditData={setEditData}
                  editMode={false}
                  id={0}
                  code={dataHeader.inbound_no}
                  formHeader={formHeader}
                  setFormHeader={setFormHeader}
                  formItem={formItem}
                  setFormItem={setFormItem}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
