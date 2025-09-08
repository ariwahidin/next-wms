"use client"

import { useState } from "react"
import Layout from "@/components/layout"
import VasPageTable from "./VasPageTable"
import VasPageForm from "./VasPageForm"

export default function VasPage() {
  const [editData, setEditData] = useState(null)

  const clearEditData = () => {
    setEditData(null)
  }

  return (
    <Layout title="Master" subTitle="VAS Page">
      <div className="p-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-2">
          <VasPageTable setEditData={setEditData} />
        </div>
        <div className="col-span-1">
          <VasPageForm editData={editData} clearEditData={clearEditData} />
        </div>
      </div>
    </Layout>
  )
}
