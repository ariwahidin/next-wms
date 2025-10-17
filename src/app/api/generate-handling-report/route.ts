import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { createStyledHandlingSheet } from "@/lib/excelHelper";
import { getHandlingOutboundDetail, getOutboundHandlingSummary } from "@/lib/queries";



// Format ke YYYY-MM-DD supaya SQL friendly
function formatDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0"); // bulan +1 karena 0-indexed
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET() {

  // Ambil tanggal otomatis
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1); // tanggal 1 bulan ini
  const endDate = today;

  const formattedStart = formatDate(startDate);
  const formattedEnd = formatDate(endDate);

  const workbook = new ExcelJS.Workbook();
  const dataLeft = await getHandlingOutboundDetail(formattedStart, formattedEnd);
  const dataRight = await getOutboundHandlingSummary(formattedStart, formattedEnd);

  createStyledHandlingSheet(workbook, dataLeft, dataRight);

  // const folderPath = path.join(process.cwd(), "exports");
  // if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
  const folderPath = "D:/SendEmailYamaha";
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
  const filePath = path.join(folderPath, "Rekap_Handling_YMI.xlsx");
  await workbook.xlsx.writeFile(filePath);

  return NextResponse.json({ success: true, path: filePath });
}

