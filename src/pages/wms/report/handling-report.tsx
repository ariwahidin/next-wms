"use client"

import { useState } from "react"
import type { DateRange } from "react-day-picker"
import { format, differenceInMonths } from "date-fns"
import Layout from "@/components/layout"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/date-range-picker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Download } from "lucide-react"

export default function DownloadHandlingReport() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [error, setError] = useState<string>("")

  const handleDownload = () => {
    // Reset error
    setError("")

    // Validate date range
    if (!dateRange?.from || !dateRange?.to) {
      setError("Please select both start and end dates")
      return
    }

    // Check if range is more than 3 months
    const monthsDiff = differenceInMonths(dateRange.to, dateRange.from)
    if (monthsDiff > 3) {
      setError("Date range cannot exceed 3 months")
      return
    }

    // Format dates for API
    const startDate = format(dateRange.from, "yyyy-MM-dd")
    const endDate = format(dateRange.to, "yyyy-MM-dd")

    // Open download with date parameters
    const url = `/api/download-handling-report?startDate=${startDate}&endDate=${endDate}`
    window.open(url, "_blank")
  }

  const isValidRange = dateRange?.from && dateRange?.to && differenceInMonths(dateRange.to, dateRange.from) <= 3

  return (
    <Layout title="Report" titleLink="/wms/report/handling-report" subTitle="Handling Report">
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Select Date Range</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose a date range for the handling report. Maximum range is 3 months.
            </p>
            <DateRangePicker value={dateRange} onChange={setDateRange} placeholder="Select date range (max 3 months)" />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

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

        <Button onClick={handleDownload} disabled={!isValidRange} className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Download Handling Report
        </Button>
      </div>
    </Layout>
  )
}
