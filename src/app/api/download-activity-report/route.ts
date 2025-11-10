import { type NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { createInboundSheet, createOutboundSheet, stockSheet } from "@/lib/excelHelper"
import { getInboundDev, getOutboundDev, getStockSummary } from "@/lib/queries";


export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Validate date parameters
    if (!startDate || !endDate) {
        return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    }

    const inbound = await getInboundDev(startDate, endDate);
    const outbound = await getOutboundDev(startDate, endDate);
    const stockSummary = await getStockSummary();

    // if (inbound.length === 0 || outbound.length === 0) {
    //     return NextResponse.json({
    //         success: false,
    //         message: "Inbound or outbound data is empty for this date range.",
    //     });
    // }

    const workbook = new ExcelJS.Workbook()
    createInboundSheet(workbook, "Inbound", inbound)
    createOutboundSheet(workbook, "Outbound", outbound)
    stockSheet(workbook, "Stock", stockSummary)

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `Activity_Report_${startDate}_to_${endDate}.xlsx`

    return new NextResponse(buffer, {
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename=${filename}`,
        },
    })
}

