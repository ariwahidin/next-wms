"use client"

import { useState } from "react"
import Layout from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Download } from "lucide-react"

export default function DownloadStockReport() {
  const [error, setError] = useState<string>("")
  const [viewBy, setViewBy] = useState<string>("location")

  const handleDownload = () => {
    setError("")

    const url = `/api/download-stock-report-yuewell?viewBy=${viewBy}`
    window.open(url, "_blank")
  }


  return (
    <Layout title="Report" titleLink="/wms/report/stock-yuwell" subTitle="Stock Report">
      <div className="p-6 space-y-6">
        <div className="space-y-4">

          {/* Filter Date Range */}
          <div>
            <h3 className="text-lg font-medium mb-2">Stock Report</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Download stock report.
            </p>
          </div>

          {/* Filter View By */}
          <div>
            <label className="block text-sm font-medium mb-2">View By</label>
            <select
              className="w-full sm:w-60 border border-input rounded-md p-2 text-sm bg-background"
              value={viewBy}
              onChange={(e) => setViewBy(e.target.value)}
            >
              <option value="location">Location</option>
              <option value="item">Item</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <Button
          onClick={handleDownload}
          // disabled={!isValidRange}
          className="w-full sm:w-auto"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Stock Report
        </Button>
      </div>
    </Layout>
  )
}
