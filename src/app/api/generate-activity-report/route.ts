// app/api/generate-activity-report/route.ts
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { createStyledSheet } from "@/lib/excelHelper";
import { getInbound, getOutbound } from "@/lib/queries";

// Ambil tanggal otomatis
const today = new Date();
const startDate = new Date(today.getFullYear(), today.getMonth(), 1); // tanggal 1 bulan ini
const endDate = today;

// Format ke YYYY-MM-DD supaya SQL friendly
function formatDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0"); // bulan +1 karena 0-indexed
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET() {
  const formattedStart = formatDate(startDate);
  const formattedEnd = formatDate(endDate);

  // Ambil data
  const inbound = await getInbound(formattedStart, formattedEnd);
  const outbound = await getOutbound(formattedStart, formattedEnd);

  const workbook = new ExcelJS.Workbook();
  createStyledSheet(workbook, "Inbound", inbound);
  createStyledSheet(workbook, "Outbound", outbound);

  const folderPath = path.join(process.cwd(), "exports");
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
  const filePath = path.join(folderPath, "Activity_Report.xlsx");

  await workbook.xlsx.writeFile(filePath);

  return NextResponse.json({
    success: true,
    message: "File berhasil dibuat",
    path: filePath,
  });
}

