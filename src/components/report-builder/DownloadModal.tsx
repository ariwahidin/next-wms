/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Download, Eye, ChevronDown } from "lucide-react"
import api from "@/lib/api"
import { Rpt2Template, Rpt2Column } from "@/types/rpt-builder/rpt-builder"
import eventBus from "@/utils/eventBus"
import { format, subDays } from "date-fns"

interface Props {
  open: boolean
  template: Rpt2Template | null
  onClose: () => void
}

interface ColumnPref {
  column_key: string
  display_name: string
  is_visible: boolean
  is_toggleable: boolean
  column_order: number
}

interface SheetPrefs {
  sheet_id: number
  sheet_name: string
  prefs: ColumnPref[]
}

export default function DownloadModal({ open, template, onClose }: Props) {
  const [params, setParams] = useState<Record<string, string>>({})
  const [sheetPrefs, setSheetPrefs] = useState<SheetPrefs[]>([])
  const [expandedSheet, setExpandedSheet] = useState<number>(0)
  const [downloading, setDownloading] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [previewData, setPreviewData] = useState<any[] | null>(null)
  const [selectOptions, setSelectOptions] = useState<Record<string, { label: string; value: string }[]>>({})

  useEffect(() => {
    if (!template || !open) return

    // Init params dari default value
    const initParams: Record<string, string> = {}
    template.params?.forEach((p) => {
      if (p.param_type === "DATERANGE") {
        initParams[p.param_key + "_start"] = format(subDays(new Date(), 7), "yyyy-MM-dd")
        initParams[p.param_key + "_end"] = format(new Date(), "yyyy-MM-dd")
      } else {
        initParams[p.param_key] = p.default_value || ""
      }
    })
    setParams(initParams)

    // ✅ Tambah ini — fetch options untuk SELECT params
    const fetchOptions = async () => {
      const selectParams = template.params?.filter((p) => p.param_type === "SELECT") ?? []
      for (const p of selectParams) {
        try {
          const res = await api.post("/rpt-builder/resolve-options", {
            template_id: template.id,
            param_key: p.param_key,
          })
          if (res.data?.success) {
            setSelectOptions((prev) => ({ ...prev, [p.param_key]: res.data.data }))
          }
        } catch (err) {
          console.error(`Failed to load options for ${p.param_key}`, err)
        }
      }
    }
    fetchOptions()

    // Init column prefs dari default sheet columns
    const prefs: SheetPrefs[] = template.sheets?.map((s) => ({
      sheet_id: s.id,
      sheet_name: s.sheet_name,
      prefs: s.columns?.map((c, i) => ({
        column_key: c.column_key,
        display_name: c.display_name,
        is_visible: c.is_default_visible,
        is_toggleable: c.is_toggleable,
        column_order: i,
      })) ?? [],
    })) ?? []
    setSheetPrefs(prefs)
    setExpandedSheet(0)
    setPreviewData(null)
  }, [template, open])

  const setParam = (key: string, val: string) => setParams((p) => ({ ...p, [key]: val }))

  const toggleColumn = (sheetIdx: number, colKey: string) => {
    setSheetPrefs((prev) => prev.map((s, i) =>
      i !== sheetIdx ? s : {
        ...s,
        prefs: s.prefs.map((c) =>
          c.column_key === colKey && c.is_toggleable ? { ...c, is_visible: !c.is_visible } : c
        ),
      }
    ))
  }

  const buildColumnPrefs = () => {
    const result: Record<string, string[]> = {}
    sheetPrefs.forEach((s) => {
      result[String(s.sheet_id)] = s.prefs.filter((c) => c.is_visible).map((c) => c.column_key)
    })
    return result
  }

  const handlePreview = async () => {
    if (!template) return
    setPreviewing(true)
    setPreviewData(null)
    try {
      const res = await api.post("/rpt-builder/rpt-preview", {
        template_id: template.id,
        params,
        column_prefs: buildColumnPrefs(),
      })
      if (res.data?.success) {
        setPreviewData(res.data.data.rows ?? [])
      }
    } finally {
      setPreviewing(false)
    }
  }

  const handleDownload = async () => {
    if (!template) return

    setDownloading(true)
    try {
      // Step 1 — check dulu
      const check = await api.post("/rpt-builder/download/check", {
        template_id: template.id,
        params,
        column_prefs: buildColumnPrefs(),
      })

      if (!check.data?.success) {
        // eventBus.emit("showAlert", {
        //   title: "Error",
        //   description: check.data?.message || "Validation failed",
        //   type: "error",
        // })
        return
      }

      // Step 2 — simpan column prefs
      for (const s of sheetPrefs) {
        await api.put("/rpt-builder/column-prefs", {
          sheet_id: s.sheet_id,
          column_prefs: s.prefs.map((c) => ({
            column_key: c.column_key,
            is_visible: c.is_visible,
            column_order: c.column_order,
          })),
        })
      }

      // Step 3 — download blob (sudah pasti clean, tidak perlu parse error)
      const res = await api.post("/rpt-builder/download", {
        template_id: template.id,
        params,
        column_prefs: buildColumnPrefs(),
      }, { responseType: "blob" })

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${template.code}_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      onClose()
    } finally {
      setDownloading(false)
    }
  }

  if (!open || !template) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">{template.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{template.code} · {template.sheets?.length} sheet</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {/* Parameters */}
            {template.params && template.params.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Parameters</p>
                {template.params.sort((a, b) => a.param_order - b.param_order).map((p) => (
                  <div key={p.id} className="space-y-1">
                    <Label className="text-xs">
                      {p.label}
                      {p.is_required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {p.param_type === "DATE" && (
                      <Input type="date" value={params[p.param_key] || ""} onChange={(e) => setParam(p.param_key, e.target.value)} className="h-8 text-xs" />
                    )}
                    {p.param_type === "DATERANGE" && (
                      <div className="flex items-center gap-2">
                        <Input type="date" value={params[p.param_key + "_start"] || ""} onChange={(e) => setParam(p.param_key + "_start", e.target.value)} className="h-8 text-xs" />
                        <span className="text-slate-400 text-xs">to</span>
                        <Input type="date" value={params[p.param_key + "_end"] || ""} onChange={(e) => setParam(p.param_key + "_end", e.target.value)} className="h-8 text-xs" />
                      </div>
                    )}
                    {(p.param_type === "TEXT" || p.param_type === "NUMBER") && (
                      <Input type={p.param_type === "NUMBER" ? "number" : "text"} value={params[p.param_key] || ""} onChange={(e) => setParam(p.param_key, e.target.value)} className="h-8 text-xs" />
                    )}

                    {p.param_type === "SELECT" && (
                      <select
                        value={params[p.param_key] || ""}
                        onChange={(e) => setParam(p.param_key, e.target.value)}
                        className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">-- Pilih {p.label} --</option>
                        {(selectOptions[p.param_key] ?? []).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Column prefs per sheet */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Columns</p>
              {sheetPrefs.map((s, sIdx) => (
                <div key={s.sheet_id} className="rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedSheet(expandedSheet === sIdx ? -1 : sIdx)}
                    className="flex w-full items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                  >
                    <span className="text-xs font-semibold text-slate-700">{s.sheet_name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">
                        {s.prefs.filter((c) => c.is_visible).length}/{s.prefs.length} visible
                      </span>
                      <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${expandedSheet === sIdx ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {expandedSheet === sIdx && (
                    <div className="divide-y divide-slate-100 px-4 py-2">
                      {s.prefs.map((col) => (
                        <div key={col.column_key} className="flex items-center justify-between py-1.5">
                          <span className={`text-xs ${col.is_visible ? "text-slate-700" : "text-slate-400"}`}>
                            {col.display_name}
                          </span>
                          {col.is_toggleable ? (
                            <button
                              type="button"
                              onClick={() => toggleColumn(sIdx, col.column_key)}
                              className={`relative h-5 w-9 rounded-full transition-colors ${col.is_visible ? "bg-slate-800" : "bg-slate-200"}`}
                            >
                              <span className={`absolute top-1 left-1 h-3 w-3 rounded-full bg-white shadow transition-transform ${col.is_visible ? "translate-x-4" : "translate-x-0"}`} />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">fixed</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Preview result */}
            {previewData && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Preview — {previewData.length} rows (max 100)
                </p>
                {previewData.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No data</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="bg-slate-800 text-white">
                          {Object.keys(previewData[0]).map((k) => (
                            <th key={k} className="px-3 py-2 text-left font-medium whitespace-nowrap">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.slice(0, 10).map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                            {Object.values(row).map((v: any, j) => (
                              <td key={j} className="px-3 py-1.5 text-slate-600 whitespace-nowrap">{v ?? ""}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {previewData.length > 10 && (
                      <p className="px-3 py-2 text-[10px] text-slate-400 border-t border-slate-100">
                        Menampilkan 10 dari {previewData.length} rows
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
            <Button variant="outline" onClick={handlePreview} disabled={previewing} className="h-8 text-xs">
              {previewing
                ? <span className="flex items-center gap-1.5"><div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />Preview...</span>
                : <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />Preview</span>
              }
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose} className="h-8 text-xs">Cancel</Button>
              <Button onClick={handleDownload} disabled={downloading} className="h-8 text-xs bg-slate-800 hover:bg-slate-900 text-white">
                {downloading
                  ? <span className="flex items-center gap-1.5"><div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />Generating...</span>
                  : <span className="flex items-center gap-1.5"><Download className="h-3.5 w-3.5" />Download Excel</span>
                }
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}