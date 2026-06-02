"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/mobile/PageHeader";
import api from "@/lib/api";
import OutboundCard from "@/components/mobile/outbound/order-views/OutboundCard";
import { OutboundItem } from "@/types/outbound";
import { MasterCarton } from "@/types/master-carton";


export default function InboundListPage() {
  const [search, setSearch] = useState("");
  const [listInbound, setListInbound] = useState<OutboundItem[]>([]);
  const [masterCartons, setMasterCartons] = useState<MasterCarton[]>([]);

  const filtered = listInbound.filter(
    (item) =>
      item.outbound_no.toLowerCase().includes(search.toLowerCase()) ||
      item.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [outboundRes, cartonRes] = await Promise.all([
          api.get("/mobile/outbound/list/open", { withCredentials: true }),
          api.get("/mobile/outbound/master-cartons", { withCredentials: true }),
        ]);

        if (outboundRes.data.data) setListInbound(outboundRes.data.data);
        if (cartonRes.data.success) setMasterCartons(cartonRes.data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <PageHeader title="Outbound Orders" showBackButton />
      <div className="min-h-screen pb-20 px-4 pt-4 bg-gray-50 max-w-md mx-auto">
        <Input
          placeholder="Search Outbound No"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />

        <div className="space-y-3">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <OutboundCard key={item.id} data={item} masterCartons={masterCartons} />
            ))
          ) : (
            <p className="text-center text-gray-500">Data not found</p>
          )}
        </div>
      </div>
    </>
  );
}
