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
import { ProductForm } from "./ProductForm";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

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
import Select from "react-select";
import InboundTable from "./InboundTable";
import Layout from "@/components/layout";

export default function Page() {
  useAuth();
  const [editData, setEditData] = useState(null);

  const [orderInfo, setOrderInfo] = useState({
    orderNo: generateOrderNumber(),
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    phone: "",
    email: "",
    address: "",
  });

  const [listSuppliers, setListSuppliers] = useState([]);
  const [optionsSupplier, setOptionsSupplier] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [inboundDate, setInboundDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [detailItems, setDetailItems] = useState([]);

  const [editMode, setEditMode] = useState(false);

  const handleSupplierChange = (selectedOption) => {
    setSelectedSupplier(selectedOption.value);
    console.log(selectedSupplier);
  };

  function generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `ORD${year}${month}${day}${random}`;
  }

  async function getDetailItems() {
    try {
      const res = await api.get("/inbound/cart", { withCredentials: true });
      if (res.data.success) {
        setDetailItems(res.data.data.details);
        return res.data.data.details; // Mengembalikan hasil supaya bisa digunakan
      }
    } catch (error) {
      console.error("Error fetching detail items:", error);
      alert("Error fetching detail items");
    }
  }

  async function handleSave() {
    console.log("Supplier Selected : ", selectedSupplier);
    console.log("Inbound Date : ", inboundDate);
    const newDetailItems = await getDetailItems(); // Menunggu hasil API
    console.log("Detail Items : ", newDetailItems);

    try {
      const res = await api.post(
        "/inbound",
        {
          supplier_code: selectedSupplier,
          inbound_date: inboundDate,
        },
        { withCredentials: true }
      );
      if (res.data.success) {
        alert("Inbound berhasil disimpan");
      }
    } catch (error) {
      console.error("Error saving inbound:", error);
      alert("Error saving inbound");
    }
  }

  // set title
  useEffect(() => {
    document.title = "Create Inbound";

    // Fetch list suppliers
    api.get("/suppliers", { withCredentials: true }).then((res) => {
      setListSuppliers(res.data.data);
      setOptionsSupplier(
        res.data.data.map((item) => ({
          value: item.supplier_code,
          label: item.supplier_code + " - " + item.supplier_name,
        }))
      );
    });
  }, []);

  return (
    <Layout title="Create Inbound" subTitle="Create Inbound">
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-1">
        <InboundTable setEditData={setEditData} />
      </div>
    </Layout>
  );
}
