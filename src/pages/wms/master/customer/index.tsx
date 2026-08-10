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
import { useEffect } from "react";
import CustomerTable from "./CustomerTable";
import Layout from "@/components/layout";

export default function Page() {
  useEffect(() => {
    document.title = "Master Customer";
  }, []);

  return (
    <Layout title="Master" subTitle="Customer">
      <div className="p-4">
        <CustomerTable />
      </div>
    </Layout>
  );
}