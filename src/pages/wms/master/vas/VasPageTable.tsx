/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { AgGridReact } from "ag-grid-react"
import { AllCommunityModule, ModuleRegistry, type ColDef } from "ag-grid-community"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil, Search } from "lucide-react"
import useSWR from "swr"
import { type ChangeEvent, useCallback, useState } from "react"

ModuleRegistry.registerModules([AllCommunityModule])

const fetcher = (url: string) =>
  api.get(url, { withCredentials: true }).then((res) => {
    if (res.data.success) {
      return res.data.data.map((item: any, key: number) => ({
        ...item,
        no: key + 1,
        edit: true,
      }))
    }
    return []
  })

interface VasPageTableProps {
  setEditData: (data: any) => void
}

const VasPageTable = ({ setEditData }: VasPageTableProps) => {
  const { data: rowData, error, mutate } = useSWR("/vas/page", fetcher)

  const [columnDefs, setColumnDefs] = useState<ColDef[]>([
    {
      field: "no",
      headerName: "No.",
      maxWidth: 80,
      cellStyle: { textAlign: "center" },
    },
    {
      field: "name",
      headerName: "VAS Page Name",
      flex: 1,
      minWidth: 200,
    },
    {
      headerName: "Actions",
      field: "ID",
      width: 120,
      cellRenderer: (params: any) => {
        return (
          <div className="flex gap-1">
            <Button
              onClick={() => {
                setEditData(params.data)
                console.log("Editing:", params.data)
              }}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ])

  const [quickFilterText, setQuickFilterText] = useState<string>("")
  const onFilterTextBoxChanged = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) => setQuickFilterText(value),
    [],
  )
  return (
    <Card>
      <CardHeader>
        <CardTitle>VAS Page List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search VAS Page..."
              value={quickFilterText}
              onChange={onFilterTextBoxChanged}
              className="pl-10"
            />
          </div>
        </div>
        <div className="ag-theme-alpine" style={{ height: "500px", width: "100%" }}>
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            quickFilterText={quickFilterText}
            pagination={true}
            paginationPageSize={10}
            paginationPageSizeSelector={[10, 25, 50]}
            domLayout="normal"
            suppressRowClickSelection={true}
            rowSelection="single"
            animateRows={true}
            defaultColDef={{
              sortable: true,
              filter: true,
              resizable: true,
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default VasPageTable
