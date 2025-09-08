"use client"

import { useState } from "react"
import Layout from "@/components/layout"
import MainVasTable from "./MainVasTable"
import MainVasForm from "./MainVasForm"

export default function Page() {
  const [editData, setEditData] = useState(null)

  const clearEditData = () => {
    setEditData(null)
  }

  return (
    <Layout title="Master" subTitle="Main VAS">
      <div className="p-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-2">
          <MainVasTable setEditData={setEditData} />
        </div>
        <div className="col-span-1">
          <MainVasForm editData={editData} clearEditData={clearEditData} />
        </div>
      </div>
    </Layout>
  )
}
