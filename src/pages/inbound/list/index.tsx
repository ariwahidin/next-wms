/* eslint-disable @typescript-eslint/no-unused-vars */


import useAuth from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import InboundTable from "./InboundTable";
import Layout from "@/components/layout";

export default function Page() {
  const [editData, setEditData] = useState(null);
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
    // const newDetailItems = await getDetailItems(); 
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
    <Layout title="Inbound" subTitle="List inbound">
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-1">
        <InboundTable setEditData={setEditData} />
      </div>
    </Layout>
  );
}
