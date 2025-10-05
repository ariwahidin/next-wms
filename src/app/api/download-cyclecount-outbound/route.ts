import { type NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { createCyleCountSheet } from "@/lib/excelHelper"
import { getCycleCountOutbound} from "@/lib/queries";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Validate date parameters
    if (!startDate || !endDate) {
        return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    }

    const dataLeft = await getCycleCountOutbound(startDate, endDate);

    if (dataLeft.length === 0) {
        return NextResponse.json({
            success: false,
            message: "Cycle count data is empty for this date range.",
        });
    }

    const workbook = new ExcelJS.Workbook()
    createCyleCountSheet(workbook, dataLeft, startDate, endDate);
    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `CycleCount_Outbound_${startDate}_to_${endDate}.xlsx`

    return new NextResponse(buffer, {
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename=${filename}`,
        },
    })
}

