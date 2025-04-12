"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import PageHeader from "../components/PageHeader"
import InboundCard from "./InboundCard"

const dummyInbound = [
  {
    id: "1",
    noDO: "DO-001234",
    supplier: "PT. ABC",
    tanggal: "2025-04-12",
    status: "Belum Diterima",
  },
  {
    id: "2",
    noDO: "DO-001235",
    supplier: "PT. XYZ",
    tanggal: "2025-04-10",
    status: "Sebagian",
  },
  {
    id: "3",
    noDO: "DO-001236",
    supplier: "PT. DEF",
    tanggal: "2025-04-09",
    status: "Selesai",
  },
]

export default function InboundListPage() {
  const [search, setSearch] = useState("")

  const filtered = dummyInbound.filter((item) =>
    item.noDO.toLowerCase().includes(search.toLowerCase()) ||
    item.supplier.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <PageHeader title="Inbound" />
      <div className="min-h-screen pb-20 px-4 pt-4 bg-gray-50">
        <Input
          placeholder="Cari No DO atau Supplier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />

        <div className="space-y-3">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <InboundCard key={item.id} data={item} />
            ))
          ) : (
            <p className="text-center text-gray-500">Data tidak ditemukan</p>
          )}
        </div>
      </div>
    </>
  )
}
