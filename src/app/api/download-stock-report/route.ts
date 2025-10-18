import { type NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { createStockSheet, } from "@/lib/excelHelper"
import { getStockReport } from "@/lib/queries";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const viewBy = searchParams.get("viewBy")

    // Validate date parameters
    // if (!startDate || !endDate) {
    //     return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    // }

    const stock = await getStockReport(viewBy);

    if (stock.length === 0) {
        return NextResponse.json({
            success: false,
            message: "Stock data is empty.",
        });
    }

    const workbook = new ExcelJS.Workbook()
    createStockSheet(workbook, "Stock", stock, {
        title: "STOCK REPORT By " + viewBy.toUpperCase(),
        subtitle: `Generated at ${new Date().toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
        })}`,
        // generatedBy : ""
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `Stock_report_by_${viewBy}.xlsx`

    return new NextResponse(buffer, {
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename=${filename}`,
        },
    })
}

