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

  // // Header kiri
  // const headersLeft = ["No", "TGL KELUAR", "SPK NO", "NO DO", "DEALER", "ITEM CODE", "QTY", "JENIS PEKERJAAN", "VAS KOLI"];
  // ws.addRow(headersLeft);
  // ws.getRow(2).eachCell((cell) => {
  //   cell.font = { bold: true, color: { argb: "FFFFFF" } };
  //   cell.alignment = { horizontal: "center" };
  //   cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4472C4" } };
  //   cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
  // });

  // // Data kiri
  // dataLeft.forEach((item) => {
  //   const row = ws.addRow([
  //     item.no,
  //     item.tgl_keluar,
  //     item.spk_no,
  //     item.no_do,
  //     item.dealer,
  //     item.item_code,
  //     item.qty,
  //     item.jenis_pekerjaan,
  //     item.vas_koli,
  //   ]);
  //   row.eachCell((cell) => {
  //     cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
  //   });
  // });


  // Tambahkan header
  const headersLeft = ["No", "TGL KELUAR", "SPK NO", "NO DO", "DEALER", "ITEM CODE", "QTY", "JENIS PEKERJAAN", "VAS KOLI"];
  ws.addRow(headersLeft);

  // Style header
  ws.getRow(2).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFF" } };
    cell.alignment = { horizontal: "center" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4472C4" } };
    cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
  });

  // Tambahkan data
  const startRow = 3; // data mulai dari baris ke-3
  dataLeft.forEach((item) => {
    const row = ws.addRow([
      item.no,
      item.tgl_keluar,
      item.spk_no,
      item.no_do,
      item.dealer,
      item.item_code,
      item.qty,
      item.jenis_pekerjaan,
      item.vas_koli,
    ]);
    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      // Rata tengah hanya kolom ke-9 (VAS KOLI)
      if (colNumber === 9) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }

      // Optional: ubah text jadi number kalau kolom numerik (biar gak mencong)
      if ([1, 7, 9].includes(colNumber)) {
        const value = Number(cell.value);
        if (!isNaN(value)) cell.value = value;
      }
    });

  });

  // Setelah semua data ditulis, baru lakukan merge berdasarkan NO DO
  let rowStart = startRow;
  for (let i = startRow; i < ws.lastRow.number; i++) {
    const currentNoDo = ws.getRow(i).getCell(4).value; // kolom NO DO
    const nextNoDo = ws.getRow(i + 1)?.getCell(4)?.value;

    if (currentNoDo !== nextNoDo) {
      const rowEnd = i;
      if (rowEnd > rowStart) {
        // Kolom ke-9 = VAS KOLI
        ws.mergeCells(rowStart, 9, rowEnd, 9);
        // Atur alignment tengah untuk hasil merge
        const mergedCell = ws.getCell(rowStart, 9);
        mergedCell.alignment = { vertical: "middle", horizontal: "center" };
      }
      rowStart = i + 1;
    }
  }


  // Header kanan
  const colStart = 11;
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
      // Optional: ubah text jadi number kalau kolom numerik (biar gak mencong)
      if ([12, 13, 14].includes(colStart + i)) {
        const value = Number(cell.value);
        if (!isNaN(value)) cell.value = value;
      }

      if ([colStart + 2, colStart + 3].includes(colStart + i)) {
        cell.numFmt = '#,##0'; // Format ribuan tanpa desimal
      }
    }
  });

  // Tambah total di bawah data kanan
  const totalRowNum = 3 + dataRight.length;
  const totalQty = dataRight.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  // const totalIdr = dataRight.reduce((sum, item) => sum + (Number(item.idr) || 0), 0);
  const totalIdr = '';
  const totalTotalIdr = dataRight.reduce((sum, item) => sum + (Number(item.total_idr) || 0), 0);

  // Label "TOTAL"
  const totalLabelCell = ws.getCell(totalRowNum, colStart);
  totalLabelCell.value = "TOTAL";
  totalLabelCell.font = { bold: true };
  totalLabelCell.alignment = { horizontal: "center" };
  totalLabelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D9E1F2" } };

  // Nilai total di kolom 12–14
  ws.getCell(totalRowNum, colStart + 1).value = totalQty;
  ws.getCell(totalRowNum, colStart + 2).value = totalIdr;
  ws.getCell(totalRowNum, colStart + 3).value = totalTotalIdr;

  // Styling semua cell baris total
  for (let i = 0; i < 4; i++) {
    const cell = ws.getCell(totalRowNum, colStart + i);
    cell.font = { bold: true };
    cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    cell.alignment = { horizontal: "center" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D9E1F2" } };

    // Format ribuan untuk kolom IDR & TOTAL IDR
    if ([colStart + 2, colStart + 3].includes(colStart + i)) {
      cell.numFmt = '#,##0';
    }
  }


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

// export const createCyleCountSheet = (workbook: ExcelJS.Workbook, dataLeft: any[], startDate: string, endDate: string) => {
//   const ws = workbook.addWorksheet("Cycle Count Outbound");

//   // Judul
//   ws.mergeCells("A1:L1");
//   ws.getCell("A1").value = `Cycle Count by Outbound`;
//   ws.getCell("A1").font = { bold: true, size: 14 };
//   ws.getCell("A1").alignment = { horizontal: "center" };

//   ws.mergeCells("A2:L2");
//   ws.getCell("A2").value = `${startDate} to ${endDate}`;
//   ws.getCell("A2").font = { bold: true, size: 12 };
//   ws.getCell("A2").alignment = { horizontal: "center" };

//   ws.mergeCells("A3:L3");
//   ws.getCell("A3").value = `Generated at ${new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}`;
//   ws.getCell("A3").font = { bold: true, size: 10 };
//   ws.getCell("A3").alignment = { horizontal: "center" };

//   // Header kiri
//   const headersLeft = ["OUTBOUND NO", "OUTBOUND DATE", "LOCATION", "ITEM CODE", "BARCODE/GMC", "ITEM NAME", "WHS CODE", "ON HAND", "AVAILABLE", "ALLOCATED", "ACTUAL", "OUT"];
//   ws.addRow(headersLeft);
//   ws.getRow(5).eachCell((cell) => {
//     cell.font = { bold: true, color: { argb: "FFFFFF" } };
//     cell.alignment = { horizontal: "center" };
//     cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4472C4" } };
//     cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
//   });

//   // Data kiri
//   dataLeft.forEach((item) => {
//     const row = ws.addRow([
//       item.outbound_no,
//       item.outbound_date,
//       item.location,
//       item.item_code,
//       item.barcode,
//       item.item_name,
//       item.whs_code,
//       item.qty_onhand,
//       item.qty_allocated,
//       item.qty_available,
//       item.qty_actual,
//       item.qty_out
//     ]);
//     row.eachCell((cell) => {
//       cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
//     });
//   });

//   return ws;
// };


export const createCyleCountSheet = (
  workbook: ExcelJS.Workbook,
  dataLeft: any[],
  startDate: string,
  endDate: string
) => {
  const ws = workbook.addWorksheet("Cycle Count Outbound");

  // ===== JUDUL UTAMA =====
  ws.mergeCells("A1:K1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "CYCLE COUNT BY OUTBOUND";
  titleCell.font = { bold: true, size: 18, color: { argb: "FFFFFF" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "0070C0" }, // Biru primer
  };
  ws.getRow(1).height = 35;

  // ===== PERIODE =====
  ws.mergeCells("A2:K2");
  const dateCell = ws.getCell("A2");
  dateCell.value = `Periode: ${startDate} - ${endDate}`;
  dateCell.font = { bold: true, size: 12, color: { argb: "FFFFFF" } };
  dateCell.alignment = { horizontal: "center", vertical: "middle" };
  dateCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "0090E0" }, // Biru lebih terang
  };
  ws.getRow(2).height = 25;

  // ===== TIMESTAMP =====
  ws.mergeCells("A3:K3");
  const timeCell = ws.getCell("A3");
  timeCell.value = `Generated at ${new Date().toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  })}`;
  timeCell.font = { italic: true, size: 10, color: { argb: "666666" } };
  timeCell.alignment = { horizontal: "center", vertical: "middle" };
  timeCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "E8F4FB" }, // Biru sangat muda
  };
  ws.getRow(3).height = 20;

  // Spasi sebelum header
  ws.addRow([]);

  // ===== HEADER TABEL =====
  const headersLeft = [
    "NO",
    "LOCATION",
    "ITEM CODE",
    "BARCODE/GMC",
    "ITEM NAME",
    "WHS CODE",
    "ON HAND",
    "AVAILABLE",
    "ALLOCATED",
    "ACTUAL",
    "OUT",
  ];

  ws.addRow(headersLeft);
  const headerRow = ws.getRow(5);
  headerRow.height = 30;

  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 11, color: { argb: "FFFFFF" } };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "0070C0" }, // Biru header
    };
    cell.border = {
      top: { style: "medium", color: { argb: "FFFFFF" } },
      left: { style: "medium", color: { argb: "FFFFFF" } },
      bottom: { style: "medium", color: { argb: "FFFFFF" } },
      right: { style: "medium", color: { argb: "FFFFFF" } },
    };
  });

  // ===== DATA ROWS =====
  dataLeft.forEach((item, index) => {
    const row = ws.addRow([
      index + 1,
      item.location,
      item.item_code,
      item.barcode,
      item.item_name,
      item.whs_code,
      item.qty_onhand,
      item.qty_available,
      item.qty_allocated,
      item.qty_actual,
      item.qty_out,
    ]);

    row.height = 22;

    // Alternating row colors untuk kemudahan membaca
    const fillColor = index % 2 === 0 ? "FFFFFF" : "F5F9FC";

    row.eachCell((cell, colNumber) => {
      cell.alignment = {
        vertical: "middle",
        horizontal: colNumber >= 8 ? "center" : "left" // Angka di tengah
      };
      cell.border = {
        top: { style: "thin", color: { argb: "D0D0D0" } },
        left: { style: "thin", color: { argb: "D0D0D0" } },
        bottom: { style: "thin", color: { argb: "D0D0D0" } },
        right: { style: "thin", color: { argb: "D0D0D0" } },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: fillColor },
      };
    });
  });

  // ===== AUTO WIDTH COLUMNS =====
  // ws.columns.forEach((col, index) => {
  //   let maxLength = 0;
  //   col.eachCell({ includeEmpty: true }, (cell) => {
  //     const val = cell.value ? cell.value.toString() : "";
  //     maxLength = Math.max(maxLength, val.length);
  //   });
  //   // Minimum width berdasarkan kolom
  //   const minWidth = index === 5 ? 25 : 15; // ITEM NAME lebih lebar
  //   col.width = maxLength < minWidth ? minWidth : maxLength + 3;
  // });

  // ===== SET COLUMN WIDTHS =====
  const columnWidths = [
    5, // NO
    // 15, // OUTBOUND NO
    // 18, // OUTBOUND DATE
    12, // LOCATION
    12, // ITEM CODE
    15, // BARCODE/GMC
    30, // ITEM NAME
    12, // WHS CODE
    12, // ON HAND
    12, // AVAILABLE
    12, // ALLOCATED
    12, // ACTUAL
    10,  // OUT
  ];

  ws.columns.forEach((col, index) => {
    col.width = columnWidths[index] || 12;
  });

  return ws;
};
