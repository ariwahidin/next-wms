/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Plus, ChevronDown, ChevronUp, GripVertical } from "lucide-react"
import { ReqSaveSheet, ReqSaveColumn, EXCEL_FORMATS } from "@/types/rpt-builder/rpt-builder"

interface Props {
  sheets: ReqSaveSheet[]
  onChange: (sheets: ReqSaveSheet[]) => void
}

const emptyColumn = (): ReqSaveColumn => ({
  column_key: "",
  display_name: "",
  column_order: 0,
  excel_width: 120,
  excel_format: "TEXT",
  is_default_visible: true,
  is_toggleable: true,
})

const emptySheet = (order: number): ReqSaveSheet => ({
  sheet_name: `Sheet ${order + 1}`,
  sql_query: "",
  sheet_order: order,
  columns: [emptyColumn()],
})

export default function SheetEditor({ sheets, onChange }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number>(0)

  const addSheet = () => {
    onChange([...sheets, emptySheet(sheets.length)])
    setExpandedIdx(sheets.length)
  }

  const removeSheet = (idx: number) => {
    const next = sheets.filter((_, i) => i !== idx)
    onChange(next)
    setExpandedIdx(Math.max(0, idx - 1))
  }

  const updateSheet = (idx: number, patch: Partial<ReqSaveSheet>) => {
    const next = sheets.map((s, i) => i === idx ? { ...s, ...patch } : s)
    onChange(next)
  }

  const addColumn = (sheetIdx: number) => {
    const cols = [...sheets[sheetIdx].columns, { ...emptyColumn(), column_order: sheets[sheetIdx].columns.length }]
    updateSheet(sheetIdx, { columns: cols })
  }

  const removeColumn = (sheetIdx: number, colIdx: number) => {
    const cols = sheets[sheetIdx].columns.filter((_, i) => i !== colIdx)
    updateSheet(sheetIdx, { columns: cols })
  }

  const updateColumn = (sheetIdx: number, colIdx: number, patch: Partial<ReqSaveColumn>) => {
    const cols = sheets[sheetIdx].columns.map((c, i) => i === colIdx ? { ...c, ...patch } : c)
    updateSheet(sheetIdx, { columns: cols })
  }

  return (
    <div className="space-y-3">
      {sheets.map((sheet, idx) => (
        <div key={idx} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {/* Sheet header */}
          <div
            className="flex items-center gap-3 px-4 py-3 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
            onClick={() => setExpandedIdx(expandedIdx === idx ? -1 : idx)}
          >
            <GripVertical className="h-4 w-4 text-slate-300" />
            <span className="flex-1 text-sm font-semibold text-slate-700">
              {sheet.sheet_name || `Sheet ${idx + 1}`}
            </span>
            <span className="text-xs text-slate-400">{sheet.columns.length} columns</span>
            {sheets.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeSheet(idx) }}
                className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            {expandedIdx === idx
              ? <ChevronUp className="h-4 w-4 text-slate-400" />
              : <ChevronDown className="h-4 w-4 text-slate-400" />
            }
          </div>

          {/* Sheet body */}
          {expandedIdx === idx && (
            <div className="p-4 space-y-4 border-t border-slate-100">
              {/* Sheet name + order */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Sheet Name</Label>
                  <Input
                    value={sheet.sheet_name}
                    onChange={(e) => updateSheet(idx, { sheet_name: e.target.value })}
                    placeholder="e.g. Detail Inbound"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Order</Label>
                  <Input
                    type="number"
                    value={sheet.sheet_order}
                    onChange={(e) => updateSheet(idx, { sheet_order: parseInt(e.target.value) || 0 })}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* SQL Query */}
              <div className="space-y-1">
                <Label className="text-xs">SQL Query</Label>
                <textarea
                  value={sheet.sql_query}
                  onChange={(e) => updateSheet(idx, { sql_query: e.target.value })}
                  placeholder="SELECT ..."
                  rows={6}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800 placeholder-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 resize-y"
                  spellCheck={false}
                />
                <p className="text-[10px] text-slate-400">
                  Gunakan <code className="bg-slate-100 px-1 rounded">:param_key</code> untuk parameter dinamis. Hanya SELECT/WITH yang diizinkan.
                </p>
              </div>

              {/* Columns */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Columns</Label>
                  <button
                    type="button"
                    onClick={() => addColumn(idx)}
                    className="flex items-center gap-1 rounded-md border border-dashed border-slate-300 px-2.5 py-1 text-xs text-slate-500 hover:border-slate-500 hover:text-slate-700 transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Add Column
                  </button>
                </div>

                {/* Column header */}
                <div className="grid grid-cols-12 gap-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  <div className="col-span-3">Column Key</div>
                  <div className="col-span-3">Display Name</div>
                  <div className="col-span-2">Format</div>
                  <div className="col-span-1">Width</div>
                  <div className="col-span-1 text-center">Visible</div>
                  <div className="col-span-1 text-center">Toggle</div>
                  <div className="col-span-1" />
                </div>

                {sheet.columns.map((col, colIdx) => (
                  <div key={colIdx} className="grid grid-cols-12 gap-1.5 items-center rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
                    <div className="col-span-3">
                      <Input
                        value={col.column_key}
                        onChange={(e) => updateColumn(idx, colIdx, { column_key: e.target.value })}
                        placeholder="e.g. item_code"
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        value={col.display_name}
                        onChange={(e) => updateColumn(idx, colIdx, { display_name: e.target.value })}
                        placeholder="e.g. Item Code"
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        value={col.excel_format}
                        onChange={(e) => updateColumn(idx, colIdx, { excel_format: e.target.value })}
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 h-7"
                      >
                        {EXCEL_FORMATS.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1">
                      <Input
                        type="number"
                        value={col.excel_width}
                        onChange={(e) => updateColumn(idx, colIdx, { excel_width: parseInt(e.target.value) || 120 })}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <input
                        type="checkbox"
                        checked={col.is_default_visible}
                        onChange={(e) => updateColumn(idx, colIdx, { is_default_visible: e.target.checked })}
                        className="h-4 w-4 cursor-pointer accent-slate-800"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <input
                        type="checkbox"
                        checked={col.is_toggleable}
                        onChange={(e) => updateColumn(idx, colIdx, { is_toggleable: e.target.checked })}
                        className="h-4 w-4 cursor-pointer accent-slate-800"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {sheet.columns.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeColumn(idx, colIdx)}
                          className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add sheet button */}
      <button
        type="button"
        onClick={addSheet}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-colors"
      >
        <Plus className="h-4 w-4" /> Add Sheet
      </button>
    </div>
  )
}