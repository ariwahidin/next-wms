/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { AgGridReact } from "ag-grid-react"
import { AllCommunityModule, ModuleRegistry, ColDef } from "ag-grid-community"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Pencil, Trash2, Plus, RefreshCcw, FileText } from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Rpt2Template } from "@/types/rpt-builder/rpt-builder"
import { useState } from "react"

ModuleRegistry.registerModules([AllCommunityModule])

interface Props {
  data: Rpt2Template[]
  loading: boolean
  onAdd: () => void
  onEdit: (t: Rpt2Template) => void
  onDelete: (t: Rpt2Template) => void
  onRefresh: () => void
}

export default function TemplateTable({ data, loading, onAdd, onEdit, onDelete, onRefresh }: Props) {
  const [columnDefs] = useState<ColDef[]>([
    { field: "no", headerName: "No.", maxWidth: 60,
      valueGetter: (p) => p.node?.rowIndex != null ? p.node.rowIndex + 1 : "" },
    { field: "code", headerName: "Code", width: 140 },
    { field: "name", headerName: "Name", flex: 1, minWidth: 180 },
    { field: "category", headerName: "Category", width: 130,
      cellRenderer: (p: any) => p.value
        ? <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{p.value}</span>
        : null
    },
    { field: "sheets", headerName: "Sheets", width: 90,
      valueGetter: (p) => p.data?.sheets?.length ?? 0,
      cellStyle: { textAlign: "center" },
    },
    { field: "params", headerName: "Params", width: 90,
      valueGetter: (p) => p.data?.params?.length ?? 0,
      cellStyle: { textAlign: "center" },
    },
    { field: "is_active", headerName: "Status", width: 100,
      cellRenderer: (p: any) => (
        <Badge className={p.value
          ? "bg-green-50 border-green-200 text-green-700"
          : "bg-red-50 border-red-200 text-red-700"}>
          {p.value ? "Active" : "Inactive"}
        </Badge>
      )
    },
    {
      headerName: "Actions", pinned: "right", maxWidth: 80,
      headerClass: "header-center", cellStyle: { textAlign: "center" },
      cellRenderer: (p: any) => (
        <div className="flex justify-center pt-2" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-gray-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => onEdit(p.data)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit Template
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600" onClick={() => onDelete(p.data)}>
                <Trash2 className="mr-2 h-4 w-4" /> Deactivate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ])

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Button className="h-8" onClick={onAdd}>
            <Plus className="mr-1 w-4" /> New Template
          </Button>
          <Button className="h-8" variant="outline" onClick={onRefresh}>
            <RefreshCcw className="mr-1 w-4" /> Refresh
          </Button>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {data.length} templates
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2.5">
            {[60, 140, 200, 130, 90, 90, 100, 80].map((w, i) => (
              <div key={i} className="h-3 animate-pulse rounded bg-slate-200" style={{ width: w, minWidth: w }} />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 border-b border-slate-100 px-3 py-3">
              {[60, 140, 200, 130, 90, 90, 100, 80].map((w, j) => (
                <div key={j} className="h-3 animate-pulse rounded bg-slate-100" style={{ width: w, minWidth: w }} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <AgGridReact
          rowData={data}
          columnDefs={columnDefs}
          pagination
          paginationPageSize={15}
          paginationPageSizeSelector={[15, 30, 50]}
          domLayout="autoHeight"
          overlayNoRowsTemplate='<span style="color:#94a3b8;font-size:13px">No templates found.</span>'
        />
      )}
    </div>
  )
}