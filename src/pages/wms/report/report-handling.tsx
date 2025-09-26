"use client";

import { Button } from "@/components/ui/button";
import ExcelJS from "exceljs";

export default function ReportHandling() {
  const generateExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("report-handling");

    // Judul
    worksheet.mergeCells("A1:H1");
    worksheet.getCell("A1").value =
      "REKAP DATA TAGIHAN GARANSI, PACKING SMALL ITEM, BOOK PACKING DAN ADAPTOR IN, September 2025";
    worksheet.getCell("A1").font = { bold: true, size: 14 };
    worksheet.getCell("A1").alignment = { horizontal: "center" };

    // Header tabel kiri
    const header = [
      "No",
      "TGL KELUAR",
      "NO DO",
      "DEALER",
      "ITEM CODE",
      "QTY (UNIT)/KOLI",
      "JENIS PEKERJAAN",
      "KOLI",
    ];
    worksheet.addRow(header);
    worksheet.getRow(2).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF00" }, // kuning
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

    // Data dummy kiri
    const dataLeft = [
      [
        1,
        "2025-09-20",
        "567105",
        "PT. SUARA SORGA INTERNASIONAL",
        "DPDGX670WH",
        1,
        "VAS LABELING",
        "",
      ],
      [
        2,
        "2025-09-20",
        "567105",
        "PT. SUARA SORGA INTERNASIONAL",
        "DPDGX670B",
        2,
        "VAS LABELING",
        "",
      ],
      [
        3,
        "2025-09-20",
        "567104",
        "PT VISIONEER",
        "PAVXC5FW",
        14,
        "WARRANTY",
        "",
      ],
      [
        4,
        "2025-09-19",
        "567102",
        "PT VISIONEER",
        "PATF3//E",
        2,
        "WARRANTY",
        "",
      ],
      [
        5,
        "2025-09-19",
        "567101",
        "MUSIK KINGDOM",
        "MPAS4C//ID",
        3,
        "PACKING SMALL ITEM",
        "",
      ],
      [
        6,
        "2025-09-19",
        "567101",
        "MUSIK KINGDOM",
        "PA300CY",
        5,
        "ADAPTOR IN",
        "",
      ],
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

      // Highlight hijau utk baris contoh
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

    // Table kanan (summary)
    const colStart = 10; // mulai kolom J
    const headerRight = [
      "JENIS PEKERJAAN",
      "QTY (UNIT)/KOLI",
      "IDR",
      "TOTAL IDR",
    ];
    worksheet.spliceRows(2, 0, []); // biar posisi aman

    // tulis header kanan
    headerRight.forEach((val, i) => {
      const cell = worksheet.getCell(2, colStart + i);
      cell.value = val;
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF00" }, // kuning
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

    // Data summary kanan dimulai dari row 3
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

    // Download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "report-handling.xlsx";
    link.click();
  };

  return (
    <div className="p-4">
      <Button onClick={generateExcel}>Download Report Handling</Button>
    </div>
  );
}
