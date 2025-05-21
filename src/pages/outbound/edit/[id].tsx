/* eslint-disable @typescript-eslint/no-explicit-any */

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
import ProductForm from "../ProductForm";
import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";

import { useRouter } from "next/router";
import HeaderForm from "../HeaderForm";
import { useAlert } from "@/contexts/AlertContext";
import Layout from "@/components/layout";

export default function Page() {
  useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [headerData, setHeaderData] = useState({}) as any;
  const [formHeader, setFormHeader] = useState({}) as any;
  const [formItem, setFormItem] = useState({});
  const { showAlert, notify } = useAlert();

  async function handleSave() {
    showAlert(
      "Konfirmasi Simpan",
      "Apakah Anda yakin ingin menyimpan data ini?",
      "error",
      () => {
        api
          .put(`/outbound/${id}`, formHeader, { withCredentials: true })
          .then((res) => {
            if (res.data.success) {
              notify("Berhasil!", "Data telah disimpan.", "success");
              setTimeout(() => {
                window.location.href = "/outbound/list";
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
        const res = await api.get(`/outbound/${id}`, { withCredentials: true });
        if (res.data.success) {
          if (res.data.data.header) {
            setFormHeader(res.data.data.form_header);
            setFormItem(res.data.data.form_items);
            setHeaderData(res.data.data.header);
            document.title = res.data.data.form_header.outbound_no;
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
    <Layout title="Outbound" titleLink="/outbound/list" subTitle="Edit">
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-1">
        <Tabs defaultValue="account" className="w-full">
          <TabsList>
            <TabsTrigger value="account">Header</TabsTrigger>
            <TabsTrigger value="password">Items</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <Card>
              {/* <CardHeader></CardHeader> */}
              <CardContent>
                <HeaderForm
                  formHeader={formHeader}
                  setFormHeader={setFormHeader}
                  dataForm={undefined}
                  setDataForm={undefined}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="password">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="col-span-2">
                <ProductTable
                  headerData={headerData}
                  formItem={formItem}
                  setFormItem={setFormItem}
                />
              </div>

              {headerData.status === "open" && (
                <div className="col-span-1">
                  <ProductForm
                    formHeader={formHeader}
                    setFormHeader={setFormHeader}
                    formItem={formItem}
                    setFormItem={setFormItem}
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
