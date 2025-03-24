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

export default function Page() {
  const [scanForm, setScanForm] = useState({});
  const [listOutbound, setListOutbound] = useState([]);

  const [loading, setLoading] = useState(true);

  // set title
  useEffect(() => {

    async function fetchData() {
      try {
        const [scanForm] = await Promise.all([
          api.get("/rf/outbound/scan/form", { withCredentials: true }),
        ]);
        if (scanForm.data.success) {
          setScanForm(scanForm.data.data?.scan_form);
          setListOutbound(scanForm.data.data?.list_outbound);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    }
    fetchData();
  }, []);

  return loading ? (
    <p>Loading...</p>
  ) : (
    <Layout title="Inbound" subTitle="Scan Outbound">
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-1">
        <Tabs defaultValue="account" className="w-full">
          <TabsList>
            <TabsTrigger value="account">Scan</TabsTrigger>
            <TabsTrigger value="password">Actual</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 ">
              <ScanForm
                scanForm={scanForm}
                setScanForm={setScanForm}
                listOutbound={listOutbound}
                setListOutbound={setListOutbound}
              />
            </div>
          </TabsContent>
          <TabsContent value="password">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="col-span-2">
                {/* <BarcodeTable dataToPost={dataToPost} /> */}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
