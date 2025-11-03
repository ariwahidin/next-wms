import { NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { createProductSheet } from "@/lib/excelHelper"
import { getMasterItem } from "@/lib/queries";


export async function GET() {

    // export async function GET(request: NextRequest) {
    // const { searchParams } = new URL(request.url)
    // const viewBy = searchParams.get("viewBy")


    const products = await getMasterItem();

    if (products.length === 0) {
        return NextResponse.json({
            success: false,
            message: "Products data is empty.",
        });
    }

    const workbook = new ExcelJS.Workbook()
    createProductSheet(workbook, "Items", products, {
        title: "Master Item",
        subtitle: `Generated at ${new Date().toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
        })}`,
        // generatedBy : ""
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `MasterItem.xlsx`

    return new NextResponse(buffer, {
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename=${filename}`,
        },
    })
}

