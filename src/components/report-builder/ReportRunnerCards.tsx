/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { Download, FileSpreadsheet, Search, ChevronRight } from "lucide-react"
import { Rpt2Template, CATEGORIES } from "@/types/rpt-builder/rpt-builder"
import DownloadModal from "./DownloadModal"

interface Props {
  data: Rpt2Template[]
  loading: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
  INBOUND: "bg-blue-50 text-blue-700 border-blue-200",
  OUTBOUND: "bg-orange-50 text-orange-700 border-orange-200",
  INVENTORY: "bg-green-50 text-green-700 border-green-200",
  "STOCK TAKE": "bg-purple-50 text-purple-700 border-purple-200",
  GENERAL: "bg-slate-100 text-slate-600 border-slate-200",
}

export default function ReportRunnerCards({ data, loading }: Props) {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("ALL")
  const [selected, setSelected] = useState<Rpt2Template | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const allCategories = ["ALL", ...Array.from(new Set(data.map((t) => t.category).filter(Boolean)))]

  const filtered = data.filter((t) => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.code.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === "ALL" || t.category === activeCategory
    return matchSearch && matchCat
  })

  const handleOpen = (t: Rpt2Template) => {
    setSelected(t)
    setModalOpen(true)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
            <div className="mt-4 h-8 w-full animate-pulse rounded-lg bg-slate-100" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Search + Category filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or code..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all
                ${activeCategory === cat
                  ? "border-slate-800 bg-slate-800 text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-700"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-slate-400">
          <FileSpreadsheet className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">Tidak ada report ditemukan</p>
          <p className="text-xs mt-1">Coba ubah filter atau kata kunci pencarian</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <div
              key={t.id}
              onClick={() => handleOpen(t)}
              className="group relative cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-400 hover:shadow-md"
            >
              {/* Category badge */}
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CATEGORY_COLORS[t.category] ?? CATEGORY_COLORS.GENERAL}`}>
                {t.category || "GENERAL"}
              </span>

              {/* Name */}
              <h3 className="mt-3 text-sm font-semibold text-slate-800 leading-snug">{t.name}</h3>
              <p className="mt-0.5 text-xs text-slate-400 font-mono">{t.code}</p>

              {/* Description */}
              {t.description && (
                <p className="mt-2 text-xs text-slate-500 line-clamp-2">{t.description}</p>
              )}

              {/* Meta */}
              <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
                <span>{t.sheets?.length ?? 0} sheet</span>
                <span>·</span>
                <span>{t.params?.length ?? 0} parameter</span>
              </div>

              {/* CTA */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                  <Download className="h-3.5 w-3.5" />
                  Download Excel
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>

              {/* Hover accent */}
              <div className="absolute inset-x-0 bottom-0 h-0.5 rounded-b-2xl bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      )}

      <DownloadModal
        open={modalOpen}
        template={selected}
        onClose={() => { setModalOpen(false); setSelected(null) }}
      />
    </div>
  )
}