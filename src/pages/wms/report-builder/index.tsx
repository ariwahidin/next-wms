"use client"

import Layout from "@/components/layout"
import TemplateTable from "@/components/report-builder/TemplateTable"
import TemplateDrawer from "@/components/report-builder/TemplateDrawer"
import api from "@/lib/api"
import { Rpt2Template } from "@/types/rpt-builder/rpt-builder"
import { useState } from "react"
import useSWR from "swr"
import { useAlert } from "@/contexts/AlertContext"

const fetcher = (url: string) =>
  api.get(url, { withCredentials: true }).then((res) => res.data?.data ?? [])

export default function ReportBuilderPage() {
  const { showAlert } = useAlert()
  const { data, isLoading, mutate } = useSWR<Rpt2Template[]>("/rpt-builder/templates", fetcher)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selected, setSelected] = useState<Rpt2Template | null>(null)

  const handleAdd = () => { setSelected(null); setDrawerOpen(true) }
  const handleEdit = (t: Rpt2Template) => { setSelected(t); setDrawerOpen(true) }

  const handleDelete = (t: Rpt2Template) => {
    showAlert(
      "Deactivate Template",
      `Template "${t.name}" akan dinonaktifkan. Lanjutkan?`,
      "error",
      async () => {
        await api.delete(`/rpt-builder/templates/${t.id}`)
        mutate()
      }
    )
  }

  return (
    <Layout title="Report Builder" subTitle="Manage Report Templates">
      <div className="p-4">
        <TemplateTable
          data={data ?? []}
          loading={isLoading}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRefresh={() => mutate()}
        />
      </div>

      <TemplateDrawer
        open={drawerOpen}
        template={selected}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => mutate()}
      />
    </Layout>
  )
}