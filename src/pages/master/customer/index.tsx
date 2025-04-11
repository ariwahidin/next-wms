
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
import CustomerForm  from "./CustomerForm";
import { useState } from "react";
import Layout from "@/components/layout";

export default function Page() {
  useAuth();
  const [editData, setEditData] = useState(null);
  useEffect(() => {
    document.title = "Master Supplier";
  }, []);

  return (
    <Layout title="Master" subTitle="Customer">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-2">
          <CustomerTable setEditData={setEditData} />
        </div>
        <div className="col-span-1">
          <CustomerForm editData={editData} setEditData={setEditData} />
        </div>
      </div>
    </Layout>
  );
}
