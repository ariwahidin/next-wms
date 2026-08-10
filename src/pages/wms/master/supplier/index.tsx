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
import { useEffect } from "react";
import Layout from "@/components/layout";

export default function Page() {
  useEffect(() => {
    document.title = "Master Supplier";
  }, []);

  return (
    <Layout title="Master" subTitle="Supplier">
      <div className="p-4">
        <SupplierTable />
      </div>
    </Layout>
  );
}