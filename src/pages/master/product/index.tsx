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
import ProductTable from "./ProductTable";
import ProductForm from "./ProductForm";
import { useState, useEffect } from "react";
import Layout from "@/components/layout";

export default function Page() {
  const [editData, setEditData] = useState(null);
  return (
    <Layout title="Master" subTitle="Product">
      <div className="p-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-2">
          <ProductTable setEditData={setEditData} />
        </div>
        <div className="col-span-1">
          <ProductForm editData={editData} setEditData={setEditData} />
        </div>
      </div>
    </Layout>
  );
}
