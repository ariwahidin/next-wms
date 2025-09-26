// app/api/generate-report-handling/route.ts
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

export async function GET() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("report-handling");

  // Judul
  worksheet.mergeCells("A1:H1");
  worksheet.getCell("A1").value =
    "REKAP DATA TAGIHAN GARANSI, PACKING SMALL ITEM, BOOK PACKING DAN ADAPTOR IN, September 2025";
  worksheet.getCell("A1").font = { bold: true, size: 14 };
  worksheet.getCell("A1").alignment = { horizontal: "center" };

  // Header tabel kiri
  const headerLeft = [
    "No",
    "TGL KELUAR",
    "NO DO",
    "DEALER",
    "ITEM CODE",
    "QTY (UNIT)/KOLI",
    "JENIS PEKERJAAN",
    "KOLI",
  ];
  worksheet.addRow(headerLeft);
  worksheet.getRow(2).eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFF00" },
    };
    cell.font = { bold: true };
    cell.alignment = { horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Data kiri
  const dataLeft = [
    [1, "2025-09-20", "567105", "PT. SUARA SORGA INTERNASIONAL", "DPDGX670WH", 1, "VAS LABELING", ""],
    [2, "2025-09-20", "567105", "PT. SUARA SORGA INTERNASIONAL", "DPDGX670B", 2, "VAS LABELING", ""],
    [3, "2025-09-20", "567104", "PT VISIONEER", "PAVXC5FW", 14, "WARRANTY", ""],
    [4, "2025-09-19", "567102", "PT VISIONEER", "PATF3//E", 2, "WARRANTY", ""],
    [5, "2025-09-19", "567101", "MUSIK KINGDOM", "MPAS4C//ID", 3, "PACKING SMALL ITEM", ""],
    [6, "2025-09-19", "567101", "MUSIK KINGDOM", "PA300CY", 5, "ADAPTOR IN", ""],
  ];

  dataLeft.forEach((row, idx) => {
    const excelRow = worksheet.addRow(row);
    excelRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    if ([3, 5, 6].includes(idx + 1)) {
      excelRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "CCFFCC" }, // hijau muda
        };
      });
    }
  });

  // Header kanan
  const colStart = 10; // mulai kolom J
  const headerRight = ["JENIS PEKERJAAN", "QTY (UNIT)/KOLI", "IDR", "TOTAL IDR"];
  headerRight.forEach((val, i) => {
    const cell = worksheet.getCell(2, colStart + i);
    cell.value = val;
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFF00" },
    };
    cell.font = { bold: true };
    cell.alignment = { horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Data kanan
  const dataRight = [
    ["ADAPTOR IN", 110, 1500, 165000],
    ["BOOK PACKING", 89, 1500, 133500],
    ["PACKING SMALL ITEM", 345, 1500, 517500],
    ["SIDE UP LABEL", 5, 2400, 12000],
    ["VAS LABELING", 160, 1200, 192000],
    ["WARRANTY", 1681, 1200, 2017200],
    ["TOTAL", 2390, "", 3037200],
  ];

  dataRight.forEach((row, rIndex) => {
    row.forEach((val, i) => {
      const cell = worksheet.getCell(3 + rIndex, colStart + i);
      cell.value = val;
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // Tentukan path folder export
  const folderPath = path.join(process.cwd(), "exports");
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const filePath = path.join(folderPath, "report-handling.xlsx");

  await workbook.xlsx.writeFile(filePath);

  return NextResponse.json({
    success: true,
    message: "File report-handling.xlsx berhasil dibuat",
    path: filePath,
  });
}
