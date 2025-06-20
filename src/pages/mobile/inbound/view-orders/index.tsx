"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/mobile/PageHeader";
import InboundCard from "@/components/mobile/inbound/order-views/InboundCard";
import api from "@/lib/api";
import { InboundItem } from "@/types/inbound";



export default function InboundListPage() {
  const [search, setSearch] = useState("");
  const [listInbound, setListInbound] = useState<InboundItem[]>([]);

  const filtered = listInbound.filter(
    (item) =>
      item.inbound_no.toLowerCase().includes(search.toLowerCase()) ||
      item.supplier_name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/mobile/inbound/list/open", {
          withCredentials: true,
        });
        const data = await response.data;

        if (data.data === null) {
          return;
        }
        setListInbound(data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <PageHeader title="Inbound Orders" showBackButton />
      <div className="min-h-screen pb-20 px-4 pt-4 bg-gray-50 max-w-md mx-auto">
        <Input
          placeholder="Search Inbound No. or Supplier Name"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />

        <div className="space-y-3">
          {filtered.length > 0 ? (
            filtered.map((item : InboundItem) => <InboundCard key={item.id} data={item} />)
          ) : (
            <p className="text-center text-gray-500">Data tidak ditemukan</p>
          )}
        </div>
      </div>
    </>
  );
}
