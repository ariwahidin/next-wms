/* eslint-disable @typescript-eslint/no-explicit-any */

// app/api/generate-activity-report/route.ts
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { createStyledSheet, stockSheet } from "@/lib/excelHelper";
import { getInbound, getOutbound, getStockSummary } from "@/lib/queries";



// Format ke YYYY-MM-DD supaya SQL friendly
function formatDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Fungsi untuk menulis log
function writeLog(data: Record<string, any>) {
  const logDir = "D:/SendEmailYamaha";
  const logPath = path.join(logDir, "activity-report.log");

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logEntry = `[${new Date().toISOString()}] ${JSON.stringify(data)}\n`;
  fs.appendFileSync(logPath, logEntry, "utf8");
}

export async function GET() {

  // Ambil tanggal otomatis
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const endDate = today;


  const formattedStart = formatDate(startDate);
  const formattedEnd = formatDate(endDate);

  const generateAt = new Date().toISOString();
  const folderPath = "D:/SendEmailYamaha";
  const filePath = path.join(folderPath, "Activity_Report.xlsx");

  try {
    const inbound = await getInbound(formattedStart, formattedEnd);
    const outbound = await getOutbound(formattedStart, formattedEnd);
    const stockSummary = await getStockSummary();

    if (inbound.length === 0 || outbound.length === 0) {
      const result = {
        success: false,
        message: "Inbound or outbound data is empty for this date range.",
        startDate: formattedStart,
        endDate: formattedEnd,
        generateAt,
      };
      writeLog(result);
      return NextResponse.json(result);
    }

    const workbook = new ExcelJS.Workbook();
    createStyledSheet(workbook, "Inbound", inbound);
    createStyledSheet(workbook, "Outbound", outbound);
    stockSheet(workbook, "Stock", stockSummary);

    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
    await workbook.xlsx.writeFile(filePath);

    const result = {
      success: true,
      message: "File berhasil dibuat",
      startDate: formattedStart,
      endDate: formattedEnd,
      path: filePath,
      generateAt,
    };

    writeLog(result);
    return NextResponse.json(result);
  } catch (err: any) {
    const errorResult = {
      success: false,
      message: "Terjadi error saat generate report",
      error: err.message || err,
      startDate: formattedStart,
      endDate: formattedEnd,
      generateAt,
    };
    writeLog(errorResult);
    return NextResponse.json(errorResult, { status: 500 });
  }
}


