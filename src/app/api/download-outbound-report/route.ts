import { type NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { createStyledSheet } from "@/lib/excelHelper"
import { getItemOutboundByKoli, getOutboundReport } from "@/lib/queries";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const status = searchParams.get("status")
    const viewBy = searchParams.get("viewBy")

    // Validate date parameters
    if (!startDate || !endDate) {
        return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    }

    const outbound = await getOutboundReport(startDate, endDate, status, viewBy);
    const outboundByKoli = await getItemOutboundByKoli(startDate, endDate);

    if (outbound.length === 0) {
        return NextResponse.json({
            success: false,
            message: "Outbound data is empty for this date range.",
        });
    }

    const workbook = new ExcelJS.Workbook()
    createStyledSheet(workbook, "outbound_by_" + viewBy, outbound)
    createStyledSheet(workbook, "item_details", outboundByKoli);

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `Outbound_Report_By_${viewBy}_${startDate}_to_${endDate}.xlsx`

    return new NextResponse(buffer, {
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename=${filename}`,
        },
    })
}

