"use client"

import { useState } from "react"
import type { DateRange } from "react-day-picker"
import { format, differenceInMonths } from "date-fns"
import Layout from "@/components/layout"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/date-range-picker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Download } from "lucide-react"

export default function DownloadActivityReport() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [error, setError] = useState<string>("")
  const [status, setStatus] = useState<string>("all")
  const [viewBy, setViewBy] = useState<string>("item")

  const handleDownload = () => {
    setError("")

    if (!dateRange?.from || !dateRange?.to) {
      setError("Please select both start and end dates")
      return
    }

    const monthsDiff = differenceInMonths(dateRange.to, dateRange.from)
    if (monthsDiff > 3) {
      setError("Date range cannot exceed 3 months")
      return
    }

    const startDate = format(dateRange.from, "yyyy-MM-dd")
    const endDate = format(dateRange.to, "yyyy-MM-dd")

    const url = `/api/download-outbound-report?startDate=${startDate}&endDate=${endDate}&status=${status}&viewBy=${viewBy}`
    window.open(url, "_blank")
  }

  const isValidRange = dateRange?.from && dateRange?.to && differenceInMonths(dateRange.to, dateRange.from) <= 3

  return (
    <Layout title="Report" titleLink="/wms/report/outbound" subTitle="Outbound Report">
      <div className="p-6 space-y-6">
        <div className="space-y-4">

          {/* Filter Date Range */}
          <div>
            <h3 className="text-lg font-medium mb-2">Select Date Range</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose a date range for the outbound report. Maximum range is 3 months.
            </p>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Select date range (max 3 months)"
            />
          </div>

          {/* Filter Status */}
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              className="w-full sm:w-60 border border-input rounded-md p-2 text-sm bg-background"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="picking">Picking</option>
              <option value="complete">Complete</option>
              <option value="cancel">Cancel</option>
            </select>
          </div>

          {/* Filter View By */}
          <div>
            <label className="block text-sm font-medium mb-2">View By</label>
            <select
              className="w-full sm:w-60 border border-input rounded-md p-2 text-sm bg-background"
              value={viewBy}
              onChange={(e) => setViewBy(e.target.value)}
            >
              <option value="item">By Item</option>
              <option value="barcode">By Serial</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Selected Range Summary */}
          {dateRange?.from && dateRange?.to && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Selected Range:</strong> {format(dateRange.from, "MMM dd, yyyy")} to{" "}
                {format(dateRange.to, "MMM dd, yyyy")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Duration: {differenceInMonths(dateRange.to, dateRange.from) + 1} month(s)
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={handleDownload}
          disabled={!isValidRange}
          className="w-full sm:w-auto"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Outbound Report
        </Button>
      </div>
    </Layout>
  )
}
