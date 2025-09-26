import { type NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { createStyledHandlingSheet } from "@/lib/excelHelper"
import { getHandlingOutboundDetail, getOutboundHandlingSummary } from "@/lib/queries";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Validate date parameters
    if (!startDate || !endDate) {
        return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    }

    const workbook = new ExcelJS.Workbook()
    const dataLeft = await getHandlingOutboundDetail(startDate, endDate);
    const dataRight = await getOutboundHandlingSummary(startDate, endDate);

    createStyledHandlingSheet(workbook, dataLeft, dataRight);

    const buffer = await workbook.xlsx.writeBuffer()

    const filename = `Handling_Report_${startDate}_to_${endDate}.xlsx`

    return new NextResponse(buffer, {
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename=${filename}`,
        },
    })
}

