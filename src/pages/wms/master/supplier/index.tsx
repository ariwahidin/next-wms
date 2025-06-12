
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
import SupplierTable from "./SupplierTable";
import SupplierForm from "./SupplierForm";
import { useEffect, useState } from "react";
import Layout from "@/components/layout";

export default function Page() {
  const [editData, setEditData] = useState(null);
  useEffect(() => {
    document.title = "Master Supplier";
  }, []);

  return (
    <Layout title="Master" subTitle="Supplier">
      <div className="p-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-2">
          <SupplierTable setEditData={setEditData} />
        </div>
        <div className="col-span-1">
          <SupplierForm editData={editData} setEditData={setEditData} />
        </div>
      </div>
    </Layout>
  );
}
