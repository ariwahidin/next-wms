/* eslint-disable @typescript-eslint/no-unused-vars */
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import useAuth from "@/hooks/useAuth";
import ProductTable from "../ProductTable";
import ProductForm  from "../ProductForm";
import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";

import { useRouter } from "next/router";
import HeaderForm from "../HeaderForm";
import { useAlert } from "@/contexts/AlertContext";

export default function Page() {
  useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [code] = useState("");
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


  const { showAlert, notify } = useAlert();

  async function handleSave() {

    if (!dataHeader || Object.keys(dataHeader).length === 0) {
      alert("Data tidak boleh kosong!");
      return;
    }

    showAlert(
      "Konfirmasi Simpan",
      "Apakah Anda yakin ingin menyimpan data ini?",
      "error",
      () => {
        api
          .put(`/inbound/${id}`, dataHeader, { withCredentials: true })
          .then((res) => {
            if (res.data.success) {
              notify("Berhasil!", "Data telah disimpan.", "success");
              setTimeout(() => {
                window.location.href = "/inbound/list";
              }, 1000);
            }
          })
          .catch((error) => {
            console.error("Error saving inbound:", error);
            alert("Gagal menyimpan inbound");
          });
      }
    );
  }


  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return; // Hindari fetch kalau ID belum ada
        const res = await api.get(`/inbound/${id}`, { withCredentials: true });

        if (res.data.success) {
          console.log("API Response:", res.data.data); // Debugging
          if (res.data.data.header) {
            setDataHeader(res.data.data.header);
          } else {
            console.error("Header data is missing!");
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [id]);

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Inbound</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Edit</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <Button
              variant="outline"
              className="me-2"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="me-4">
              Save
            </Button>
          </div>
        </header>
        <div className="border-t border-gray-200"></div>

        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-1">
          <Tabs defaultValue="account" className="w-full">
            <TabsList>
              <TabsTrigger value="account">Header</TabsTrigger>
              <TabsTrigger value="password">Detail</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
              <Card>
                {/* <CardHeader></CardHeader> */}
                <CardContent>
                  <HeaderForm
                    formHeader={dataHeader}
                    setFormHeader={setDataHeader}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="password">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="col-span-2">
                  {/* <ProductTable
                    setEditData={setEditData}
                    editMode={true}
                    id={id}
                  /> */}
                </div>
                <div className="col-span-1">
                  {/* <ProductForm
                    editData={editData}
                    setEditData={setEditData}
                    editMode={true}
                    id={id}
                    code={code}
                  /> */}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
