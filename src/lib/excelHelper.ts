/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/excelHelper.ts
import ExcelJS from "exceljs";

export const createStyledSheet = (
  workbook: ExcelJS.Workbook,
  sheetName: string,
  data: any[]
) => {
  const sheet = workbook.addWorksheet(sheetName);
  const headers = Object.keys(data[0]);
  sheet.addRow(headers);

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4472C4" }, // biru
    };
    cell.font = { bold: true, color: { argb: "FFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Isi data
  data.forEach((obj) => {
    const row = sheet.addRow(Object.values(obj));
    row.height = 20;
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // Auto width
  sheet.columns.forEach((col) => {
    let maxLength = 0;
    col.eachCell({ includeEmpty: true }, (cell) => {
      const val = cell.value ? cell.value.toString() : "";
      maxLength = Math.max(maxLength, val.length);
    });
    col.width = maxLength < 15 ? 15 : maxLength + 2;
  });

  return sheet;
};

export const createStyledHandlingSheet = (workbook: ExcelJS.Workbook, dataLeft: any[], dataRight: any[]) => {
  const ws = workbook.addWorksheet("report-handling");
  const tgl = new Date(dataLeft[0].tgl_keluar); // parse string ke Date
  const bulan = tgl.toLocaleString("id-ID", { month: "long" }); // September
  const tahun = tgl.getFullYear(); // 2025

  // Judul
  ws.mergeCells("A1:H1");
  ws.getCell("A1").value = `REKAP DATA TAGIHAN, ${bulan} ${tahun}`;
  ws.getCell("A1").font = { bold: true, size: 14 };
  ws.getCell("A1").alignment = { horizontal: "center" };

  // Header kiri
  const headersLeft = ["No", "TGL KELUAR", "NO DO", "DEALER", "ITEM CODE", "QTY", "JENIS PEKERJAAN", "KOLI"];
  ws.addRow(headersLeft);
  ws.getRow(2).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFF" } };
    cell.alignment = { horizontal: "center" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4472C4" } };
    cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
  });

  // Data kiri
  dataLeft.forEach((item) => {
    const row = ws.addRow([
      item.no,
      item.tgl_keluar,
      item.no_do,
      item.dealer,
      item.item_code,
      item.qty,
      item.jenis_pekerjaan,
      item.koli,
    ]);
    row.eachCell((cell) => {
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });
  });

  // Header kanan
  const colStart = 10;
  const headersRight = ["JENIS PEKERJAAN", "QTY (UNIT)/KOLI", "IDR", "TOTAL IDR"];
  headersRight.forEach((val, i) => {
    const cell = ws.getCell(2, colStart + i);
    cell.value = val;
    cell.font = { bold: true, color: { argb: "FFFFFF" } };
    cell.alignment = { horizontal: "center" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4472C4" } };
    cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
  });

  // Data kanan
  dataRight.forEach((item, idx) => {
    const rowNum = 3 + idx;
    ws.getCell(rowNum, colStart + 0).value = item.jenis_pekerjaan;
    ws.getCell(rowNum, colStart + 1).value = item.qty;
    ws.getCell(rowNum, colStart + 2).value = item.idr;
    ws.getCell(rowNum, colStart + 3).value = item.total_idr;

    for (let i = 0; i < 4; i++) {
      const cell = ws.getCell(rowNum, colStart + i);
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    }
  });

  return ws;
};


export const stockSheet = (
  workbook: ExcelJS.Workbook,
  sheetName: string,
  data: any[]
) => {
  const sheet = workbook.addWorksheet(sheetName);
  const headers = Object.keys(data[0]);
  sheet.addRow(headers);

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4472C4" }, // biru
    };
    cell.font = { bold: true, color: { argb: "FFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Isi data dengan deteksi number
  data.forEach((obj) => {
    const rowValues = headers.map((h) => {
      const val = obj[h];
      // kalau number asli, atau string bisa dikonversi ke number → simpan number
      if (typeof val === "number") return val;
      if (!isNaN(Number(val)) && val !== null && val !== "") return Number(val);
      return val; // biarkan string kalau bukan angka
    });

    const row = sheet.addRow(rowValues);
    row.height = 20;
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // Hitung total untuk kolom numeric
  const totals: (number | string)[] = [];
  headers.forEach((h, idx) => {
    const colValues = data.map((row) => row[h]);
    const numericVals = colValues
      .map((v) => (typeof v === "number" ? v : parseFloat(v)))
      .filter((v) => !isNaN(v));

    if (numericVals.length === colValues.length && numericVals.length > 0) {
      const sum = numericVals.reduce((a, b) => a + b, 0);
      totals[idx] = sum;
    } else {
      totals[idx] = idx === 0 ? "TOTAL" : "";
    }
  });

  // Tambah row total
  const totalRow = sheet.addRow(totals);
  totalRow.height = 22;
  totalRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "D9E1F2" }, // abu-abu muda
    };
  });

  // Auto width
  sheet.columns.forEach((col) => {
    let maxLength = 0;
    col.eachCell({ includeEmpty: true }, (cell) => {
      const val = cell.value ? cell.value.toString() : "";
      maxLength = Math.max(maxLength, val.length);
    });
    col.width = maxLength < 15 ? 15 : maxLength + 2;
  });

  return sheet;
};



