/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Save, Layers, Settings2 } from "lucide-react"
import api from "@/lib/api"
import { Rpt2Template, ReqSaveSheet, ReqSaveParam, CATEGORIES } from "@/types/rpt-builder/rpt-builder"
import SheetEditor from "./SheetEditor"
import ParamEditor from "./ParamEditor"
import eventBus from "@/utils/eventBus"

interface Props {
  open: boolean
  template: Rpt2Template | null  // null = mode create
  onClose: () => void
  onSaved: () => void
}

type Tab = "sheets" | "params"

export default function TemplateDrawer({ open, template, onClose, onSaved }: Props) {
  const isEdit = !!template

  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("GENERAL")
  const [isActive, setIsActive] = useState(true)
  const [sheets, setSheets] = useState<ReqSaveSheet[]>([{
    sheet_name: "Sheet 1", sql_query: "", sheet_order: 0,
    columns: [{ column_key: "", display_name: "", column_order: 0, excel_width: 120, excel_format: "TEXT", is_default_visible: true, is_toggleable: true }]
  }])
  const [params, setParams] = useState<ReqSaveParam[]>([])
  const [tab, setTab] = useState<Tab>("sheets")
  const [saving, setSaving] = useState(false)

  // Populate saat edit
  useEffect(() => {
    if (template) {
      setCode(template.code)
      setName(template.name)
      setDescription(template.description || "")
      setCategory(template.category || "GENERAL")
      setIsActive(template.is_active)
      setSheets(template.sheets?.map((s) => ({
        sheet_name: s.sheet_name,
        sql_query: s.sql_query,
        sheet_order: s.sheet_order,
        columns: s.columns?.map((c) => ({
          column_key: c.column_key,
          display_name: c.display_name,
          column_order: c.column_order,
          excel_width: c.excel_width,
          excel_format: c.excel_format,
          is_default_visible: c.is_default_visible,
          is_toggleable: c.is_toggleable,
        })) ?? [],
      })) ?? [])
      setParams(template.params?.map((p) => ({
        param_key: p.param_key,
        label: p.label,
        param_type: p.param_type,
        default_value: p.default_value || "",
        options_query: p.options_query || "",
        applicable_sheets: p.applicable_sheets || "",
        is_required: p.is_required,
        param_order: p.param_order,
      })) ?? [])
    } else {
      setCode(""); setName(""); setDescription(""); setCategory("GENERAL")
      setIsActive(true)
      setSheets([{ sheet_name: "Sheet 1", sql_query: "", sheet_order: 0, columns: [{ column_key: "", display_name: "", column_order: 0, excel_width: 120, excel_format: "TEXT", is_default_visible: true, is_toggleable: true }] }])
      setParams([])
    }
    setTab("sheets")
  }, [template, open])

  const handleSave = async () => {
    if (!name.trim()) { eventBus.emit("showAlert", { title: "Error", description: "Name is required", type: "error" }); return }
    if (!isEdit && !code.trim()) { eventBus.emit("showAlert", { title: "Error", description: "Code is required", type: "error" }); return }
    if (sheets.length === 0) { eventBus.emit("showAlert", { title: "Error", description: "Minimal 1 sheet diperlukan", type: "error" }); return }

    setSaving(true)
    try {
      let templateId = template?.id

      // 1. Create atau update template header
      if (!isEdit) {
        const res = await api.post("/rpt-builder/templates", { code, name, description, category })
        if (!res.data?.success) return
        templateId = res.data.data.id
      } else {
        await api.put(`/rpt-builder/templates/${templateId}`, { name, description, category, is_active: isActive })
      }

      // 2. Sync sheets — hapus semua sheet lama lalu insert ulang via UpdateSheet
      //    Untuk simplicity: delete existing sheets dulu via delete endpoint, lalu add baru
      if (isEdit && template?.sheets) {
        for (const s of template.sheets) {
          await api.delete(`/rpt-builder/sheets/${s.id}`)
        }
        // Hapus params lama
        for (const p of template.params ?? []) {
          await api.delete(`/rpt-builder/params/${p.id}`)
        }
      }

      // 3. Add sheets baru
      for (const sheet of sheets) {
        await api.post(`/rpt-builder/templates/${templateId}/sheets`, sheet)
      }

      // 4. Add params baru
      for (const param of params) {
        await api.post(`/rpt-builder/templates/${templateId}/params`, param)
      }

      eventBus.emit("showAlert", { title: "Success", description: `Template ${isEdit ? "updated" : "created"} successfully`, type: "success" })
      onSaved()
      onClose()
    } catch (err: any) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              {isEdit ? `Edit Template — ${template?.code}` : "New Report Template"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEdit ? "Update query, kolom, dan parameter" : "Definisikan query dan struktur output Excel"}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Info dasar */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Template Info</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Code <span className="text-red-500">*</span></Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. RPT_INBOUND_01"
                  className="h-8 text-xs font-mono"
                  disabled={isEdit}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Name <span className="text-red-500">*</span></Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Laporan Detail Inbound"
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            {isEdit && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 cursor-pointer accent-slate-800"
                />
                <Label htmlFor="is-active" className="text-xs cursor-pointer">Active</Label>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            {([
              { key: "sheets", label: "Sheets & Columns", icon: Layers },
              { key: "params", label: "Parameters", icon: Settings2 },
            ] as { key: Tab; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-xs font-medium transition-all
                  ${tab === key ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {key === "sheets" && <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px]">{sheets.length}</span>}
                {key === "params" && params.length > 0 && <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px]">{params.length}</span>}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === "sheets" && <SheetEditor sheets={sheets} onChange={setSheets} />}
          {tab === "params" && <ParamEditor params={params} onChange={setParams} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Save Template</span>
            )}
          </Button>
        </div>
      </div>
    </>
  )
}