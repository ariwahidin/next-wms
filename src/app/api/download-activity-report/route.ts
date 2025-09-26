import { type NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { createStyledSheet } from "@/lib/excelHelper"
import { getInbound, getOutbound } from "@/lib/queries";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Validate date parameters
    if (!startDate || !endDate) {
        return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    }

    const inbound = await getInbound(startDate, endDate);
    const outbound = await getOutbound(startDate, endDate);

    const workbook = new ExcelJS.Workbook()
    createStyledSheet(workbook, "Inbound", inbound)
    createStyledSheet(workbook, "Outbound", outbound)

    const buffer = await workbook.xlsx.writeBuffer()

    const filename = `Activity_Report_${startDate}_to_${endDate}.xlsx`

    return new NextResponse(buffer, {
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename=${filename}`,
        },
    })
}

