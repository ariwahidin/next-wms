"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/mobile/PageHeader";
import api from "@/lib/api";
import OutboundCard from "@/components/mobile/outbound/order-views/OutboundCard";

interface OutboundItem {
  id: number;
  delivery_no : string, 
  qty_req : number, 
  qty_scan : number,
  outbound_no: string;
  customer_name: string;
  status: "fully received" | "partial" | "open";
}

export default function InboundListPage() {
  const [search, setSearch] = useState("");
  const [listInbound, setListInbound] = useState<OutboundItem[]>([]);

  const filtered = listInbound.filter(
    (item) =>
      item.outbound_no.toLowerCase().includes(search.toLowerCase()) ||
      item.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/mobile/outbound/list/open", {
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
      <PageHeader title="Outbound Orders" showBackButton />
      <div className="min-h-screen pb-20 px-4 pt-4 bg-gray-50">
        <Input
          placeholder="Search Outbound No"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />

        <div className="space-y-3">
          {filtered.length > 0 ? (
              filtered.map((item : OutboundItem) => <OutboundCard key={item.id} data={item} />)
          ) : (
            <p className="text-center text-gray-500">Data not found</p>
          )}
        </div>
      </div>
    </>
  );
}
