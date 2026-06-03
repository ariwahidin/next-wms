/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Plus } from "lucide-react"
import { ReqSaveParam, PARAM_TYPES } from "@/types/rpt-builder/rpt-builder"

interface Props {
  params: ReqSaveParam[]
  onChange: (params: ReqSaveParam[]) => void
}

const emptyParam = (order: number): ReqSaveParam => ({
  param_key: "",
  label: "",
  param_type: "DATE",
  default_value: "",
  options_query: "",
  applicable_sheets: "",
  is_required: false,
  param_order: order,
})

export default function ParamEditor({ params, onChange }: Props) {
  const add = () => onChange([...params, emptyParam(params.length)])

  const remove = (idx: number) => onChange(params.filter((_, i) => i !== idx))

  const update = (idx: number, patch: Partial<ReqSaveParam>) => {
    onChange(params.map((p, i) => i === idx ? { ...p, ...patch } : p))
  }

  return (
    <div className="space-y-3">
      {params.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-4">
          Belum ada parameter. Klik tombol di bawah untuk menambahkan.
        </p>
      )}

      {params.map((param, idx) => (
        <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Param #{idx + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(idx)}
              className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Param Key</Label>
              <Input
                value={param.param_key}
                onChange={(e) => update(idx, { param_key: e.target.value })}
                placeholder="e.g. start_date"
                className="h-8 text-xs font-mono"
              />
              <p className="text-[10px] text-slate-400">Dipakai di SQL sebagai <code className="bg-white px-1 rounded border">:start_date</code></p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Label</Label>
              <Input
                value={param.label}
                onChange={(e) => update(idx, { label: e.target.value })}
                placeholder="e.g. Tanggal Mulai"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <select
                value={param.param_type}
                onChange={(e) => update(idx, { param_type: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {PARAM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Default Value</Label>
              <Input
                value={param.default_value}
                onChange={(e) => update(idx, { default_value: e.target.value })}
                placeholder="Optional"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Order</Label>
              <Input
                type="number"
                value={param.param_order}
                onChange={(e) => update(idx, { param_order: parseInt(e.target.value) || 0 })}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {param.param_type === "SELECT" && (
            <div className="space-y-1">
              <Label className="text-xs">Options Query</Label>
              <textarea
                value={param.options_query}
                onChange={(e) => update(idx, { options_query: e.target.value })}
                placeholder="SELECT id as value, name as label FROM ..."
                rows={2}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`req-${idx}`}
              checked={param.is_required}
              onChange={(e) => update(idx, { is_required: e.target.checked })}
              className="h-4 w-4 cursor-pointer accent-slate-800"
            />
            <Label htmlFor={`req-${idx}`} className="text-xs cursor-pointer">Required</Label>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-colors"
      >
        <Plus className="h-4 w-4" /> Add Parameter
      </button>
    </div>
  )
}