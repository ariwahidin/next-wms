
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import JsBarcode from "jsbarcode";
import api from "@/lib/api";
import { printDocument } from "@/lib/print";
import React from "react";
import { HeaderSPK } from "@/types/order-spk";

// ============================================================
// TYPES
// ============================================================

type OrderDetailItem = {
  shipment_id: string;
  deliv_to_name: string;
  deliv_city: string;
  total_koli: number;
  remarks: string;
  quantity: number;
  total_cbm: number;

  delivery_mode?: "DIRECT" | "VIA_HUB" | string;
  delivery_hub_id?: number | null;
  delivery_hub_code?: string;
  delivery_hub_name?: string;
  delivery_hub_address?: string;
  delivery_hub_city?: string;
};

type ShipmentSummary = {
  shipment_id: string;
  deliv_to_name: string;
  deliv_city: string;
  total_qty: number;
  total_cbm: number;
  total_koli: number;
  remarks: string;

  delivery_mode: string;
  delivery_hub_id: number | null;
  delivery_hub_code: string;
  delivery_hub_name: string;
  delivery_hub_address: string;
  delivery_hub_city: string;
};

type DeliveryGroup = {
  key: string;
  delivery_mode: string;
  delivery_hub_code: string;
  delivery_hub_name: string;
  delivery_hub_address: string;
  delivery_hub_city: string;
  items: ShipmentSummary[];
};

// ============================================================
// COMPONENT
// ============================================================

const SPKSheetPrint = () => {
  const router = useRouter();
  const { order_no } = router.query;

  const [order, setOrder] = useState<HeaderSPK>();
  const [orderDetailItems, setOrderDetailItems] = useState<OrderDetailItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const printStartedRef = useRef(false);

  // ============================================================
  // FETCH DATA
  // ============================================================

  useEffect(() => {
    if (order_no) {
      fetchData(order_no as string);
    }
  }, [order_no]);

  const fetchData = async (orderNo: string) => {
    try {
      const res = await api.get(`/order/detail/${orderNo}`);

      setOrder(res.data.data.order);
      setOrderDetailItems(res.data.data.detail_items || []);
    } catch (error) {
      console.error("Failed to fetch SPK data:", error);
      window.alert("Failed to load SPK data.");
    }
  };

  // ============================================================
  // GENERATE SPK BARCODE & PRINT
  // ============================================================

  useEffect(() => {
    if (!order?.order_no || !barcodeRef.current) return;

    JsBarcode(barcodeRef.current, order.order_no, {
      format: "CODE128",
      displayValue: true,
      fontSize: 14,
      width: 2,
      height: 50,
    });

    const printTimer = window.setTimeout(async () => {
      if (printStartedRef.current) return;

      printStartedRef.current = true;

      try {
        await printDocument({
          documentType: "SPK_SHEET_CUSTOM_1",
          documentNo: order.order_no,
          module: "OUTBOUND",
          printMethod: "BROWSER",
          printFormat: "PDF",
          copyCount: 1,
        });

        window.print();
      } catch (error) {
        printStartedRef.current = false;

        console.error("SPK sheet print error:", error);

        window.alert(
          error instanceof Error
            ? error.message
            : "Failed to process print request."
        );
      }
    }, 700);

    return () => window.clearTimeout(printTimer);
  }, [order?.order_no]);

  // ============================================================
  // GROUP DATA BY SHIPMENT / DO
  // ============================================================

  const groupedData = orderDetailItems.reduce(
    (acc, item) => {
      const shipmentId = item.shipment_id;

      if (!acc[shipmentId]) {
        acc[shipmentId] = {
          shipment_id: shipmentId,
          deliv_to_name: item.deliv_to_name,
          deliv_city: item.deliv_city,
          total_qty: 0,
          total_cbm: 0,
          total_koli: Number(item.total_koli) || 0,
          remarks: item.remarks || "",

          delivery_mode:
            item.delivery_mode?.toUpperCase() === "VIA_HUB"
              ? "VIA_HUB"
              : "DIRECT",

          delivery_hub_id: item.delivery_hub_id ?? null,
          delivery_hub_code: item.delivery_hub_code || "",
          delivery_hub_name: item.delivery_hub_name || "",
          delivery_hub_address: item.delivery_hub_address || "",
          delivery_hub_city: item.delivery_hub_city || "",
        };
      }

      acc[shipmentId].total_qty += Number(item.quantity) || 0;
      acc[shipmentId].total_cbm += Number(item.total_cbm) || 0;

      return acc;
    },
    {} as Record<string, ShipmentSummary>
  );

  const shipmentSummaries = Object.values(groupedData);

  // ============================================================
  // GROUP BY DELIVERY HUB
  // ============================================================

  const deliveryGroups = shipmentSummaries.reduce<DeliveryGroup[]>(
    (groups, item) => {
      const isViaHub = item.delivery_mode === "VIA_HUB";

      const hubIdentifier =
        item.delivery_hub_id ??
        item.delivery_hub_code ??
        item.delivery_hub_name ??
        "UNKNOWN";

      const key = isViaHub
        ? `HUB-${hubIdentifier}`
        : "DIRECT";

      let group = groups.find((g) => g.key === key);

      if (!group) {
        group = {
          key,
          delivery_mode: isViaHub ? "VIA_HUB" : "DIRECT",
          delivery_hub_code: item.delivery_hub_code,
          delivery_hub_name: item.delivery_hub_name,
          delivery_hub_address: item.delivery_hub_address,
          delivery_hub_city: item.delivery_hub_city,
          items: [],
        };

        groups.push(group);
      }

      group.items.push(item);

      return groups;
    },
    []
  );

  // ============================================================
  // GRAND TOTAL
  // ============================================================

  const grandTotalQty = shipmentSummaries.reduce(
    (sum, item) => sum + item.total_qty,
    0
  );

  const grandTotalCbm = shipmentSummaries
    .reduce((sum, item) => sum + item.total_cbm, 0)
    .toFixed(4);

  const grandTotalKoli = shipmentSummaries.reduce(
    (sum, item) => sum + item.total_koli,
    0
  );

  // ============================================================
  // EXPORT TO EXCEL
  // ============================================================

  const handleExportExcel = async () => {
    if (!order) {
      window.alert("SPK data is not available.");
      return;
    }

    try {
      setIsExporting(true);

      // Dynamic import: ExcelJS only loads when exporting.
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();

      workbook.creator = "WMS";
      workbook.lastModifiedBy = "WMS";
      workbook.created = new Date();
      workbook.modified = new Date();

      const worksheet = workbook.addWorksheet("SPK", {
        pageSetup: {
          paperSize: 9,
          orientation: "portrait",
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
          margins: {
            left: 0.25,
            right: 0.25,
            top: 0.5,
            bottom: 0.5,
            header: 0.2,
            footer: 0.2,
          },
        },
      });

      // --------------------------------------------------------
      // COLUMN WIDTHS
      // --------------------------------------------------------

      worksheet.columns = [
        { width: 7 },   // A - No
        { width: 17 },  // B - DO No
        { width: 27 },  // C - Delivery To
        { width: 20 },  // D - Delivery City
        { width: 14 },  // E - Qty
        { width: 14 },  // F - CBM
        { width: 12 },  // G - Koli
        { width: 25 },  // H - Remarks
      ];

      const thinBorder = {
        style: "thin" as const,
        color: { argb: "FF000000" },
      };

      const dottedBorder = {
        style: "dotted" as const,
        color: { argb: "FF000000" },
      };

      // const noBorder = {
      //   style: "none" as const,
      // };

      // --------------------------------------------------------
      // TITLE
      // --------------------------------------------------------

      worksheet.mergeCells("A1:H1");

      const titleCell = worksheet.getCell("A1");
      titleCell.value = "PT YUSEN LOGISTICS INTERLINK INDONESIA";
      titleCell.font = {
        name: "Arial",
        size: 14,
        bold: true,
      };
      titleCell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      worksheet.getRow(1).height = 25;

      worksheet.mergeCells("A2:H2");

      const documentTitle = worksheet.getCell("A2");
      documentTitle.value = "SURAT PERINTAH KIRIM";
      documentTitle.font = {
        name: "Arial",
        size: 13,
        bold: true,
        underline: true,
      };
      documentTitle.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      worksheet.getRow(2).height = 25;

      // --------------------------------------------------------
      // ORDER INFORMATION
      // --------------------------------------------------------

      const headerRows = [
        [
          "No. SPK/Order",
          order.order_no || "",
          "",
          "",
          "Transporter",
          order.transporter_name || "",
          "",
          "",
        ],
        [
          "Order Date",
          order.order_date || "",
          "",
          "",
          "Driver",
          order.driver || "",
          "",
          "",
        ],
        [
          "Truck Type",
          order.truck_type || "",
          "",
          "",
          "Truck No",
          order.truck_no || "",
          "",
          "",
        ],
        [
          "Load Date",
          order.load_date || "",
          "",
          "",
          "Arrival Date",
          order.arrival_date || "",
          "",
          "",
        ],
        [
          "Load Start Time",
          order.load_start_time || "",
          "",
          "",
          "Arrival Start Time",
          order.arrival_start_time || "",
          "",
          "",
        ],
        [
          "Load End Time",
          order.load_end_time || "",
          "",
          "",
          "Arrival End Time",
          order.arrival_end_time || "",
          "",
          "",
        ],
        [
          "Remarks",
          order.remarks || "",
          "",
          "",
          "",
          "",
          "",
          "",
        ],
      ];

      headerRows.forEach((values, index) => {
        const rowNumber = index + 4;

        worksheet.addRow(values);

        worksheet.mergeCells(`B${rowNumber}:D${rowNumber}`);
        worksheet.mergeCells(`F${rowNumber}:H${rowNumber}`);

        const row = worksheet.getRow(rowNumber);
        row.height = 20;

        [1, 5].forEach((col) => {
          row.getCell(col).font = {
            name: "Arial",
            size: 10,
            bold: true,
          };
        });

        [2, 6].forEach((col) => {
          row.getCell(col).font = {
            name: "Arial",
            size: 10,
          };
        });

        row.alignment = {
          vertical: "middle",
        };
      });

      // --------------------------------------------------------
      // BARCODE IMAGE
      // --------------------------------------------------------

      const barcodeRow = 12;

      if (barcodeRef.current) {
        const barcodeBase64 = barcodeRef.current.toDataURL("image/png");

        const imageId = workbook.addImage({
          base64: barcodeBase64,
          extension: "png",
        });

        worksheet.addImage(imageId, {
          tl: { col: 0, row: barcodeRow - 1 },
          ext: {
            width: 190,
            height: 55,
          },
        });
      }

      worksheet.getRow(barcodeRow).height = 25;
      worksheet.getRow(barcodeRow + 1).height = 25;

      // --------------------------------------------------------
      // TABLE HEADER
      // --------------------------------------------------------

      const tableHeaderRow = 15;

      worksheet.addRow([]);
      worksheet.addRow([
        "NO",
        "DO No",
        "Delivery To",
        "Delivery City",
        "Total Qty",
        "Total CBM",
        "Total Koli",
        "Remarks",
      ]);

      const tableHeader = worksheet.getRow(tableHeaderRow);

      tableHeader.height = 25;

      tableHeader.eachCell((cell) => {
        cell.font = {
          name: "Arial",
          size: 10,
          bold: true,
        };

        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEEEEEE" },
        };

        cell.border = {
          top: thinBorder,
          bottom: thinBorder,
          left: thinBorder,
          right: thinBorder,
        };
      });

      // --------------------------------------------------------
      // DELIVERY GROUPS
      // --------------------------------------------------------

      let rowNumber = tableHeaderRow;
      const subtotalRows: number[] = [];

      deliveryGroups.forEach((group) => {
        // ------------------------------------------------------
        // GROUP HEADER
        // ------------------------------------------------------

        rowNumber++;

        worksheet.mergeCells(`A${rowNumber}:H${rowNumber}`);

        const hubHeader = worksheet.getCell(`A${rowNumber}`);

        if (group.delivery_mode === "VIA_HUB") {
          hubHeader.value = [
            `VIA HUB - ${group.delivery_hub_code} - ${group.delivery_hub_name}`,
            group.delivery_hub_city,
            group.delivery_hub_address,
          ]
            .filter(Boolean)
            .join("\n");
        } else {
          hubHeader.value = "DIRECT DELIVERY";
        }

        hubHeader.font = {
          name: "Arial",
          size: 10,
          bold: true,
        };

        hubHeader.alignment = {
          horizontal: "left",
          vertical: "middle",
          wrapText: true,
        };

        // Top, left, right only.
        for (let col = 1; col <= 8; col++) {
          const cell = worksheet.getCell(rowNumber, col);

          // cell.border = {
          //   top: thinBorder,
          //   left: col === 1 ? thinBorder : noBorder,
          //   right: col === 8 ? thinBorder : noBorder,
          // };

          cell.border = {
            top: thinBorder,
            ...(col === 1 ? { left: thinBorder } : {}),
            ...(col === 8 ? { right: thinBorder } : {}),
          };
        }

        worksheet.getRow(rowNumber).height =
          group.delivery_mode === "VIA_HUB" ? 48 : 22;

        // ------------------------------------------------------
        // DO ROWS
        // ------------------------------------------------------

        const firstDetailRow = rowNumber + 1;

        group.items.forEach((item) => {
          rowNumber++;

          const index = shipmentSummaries.indexOf(item) + 1;

          const row = worksheet.addRow([
            index,
            item.shipment_id,
            item.deliv_to_name,
            item.deliv_city,
            item.total_qty,
            item.total_cbm,
            item.total_koli,
            item.remarks,
          ]);

          row.height = 22;

          row.eachCell((cell, colNumber) => {
            cell.font = {
              name: "Arial",
              size: 9,
            };

            cell.alignment = {
              vertical: "middle",
              horizontal:
                colNumber === 1 || colNumber === 7
                  ? "center"
                  : colNumber >= 5 && colNumber <= 6
                    ? "right"
                    : "left",
              wrapText: true,
            };

            // cell.border = {
            //   bottom: dottedBorder,
            //   left: colNumber === 1 ? thinBorder : noBorder,
            //   right: colNumber === 8 ? thinBorder : noBorder,
            // };

            cell.border = {
              bottom: dottedBorder,
              ...(colNumber === 1 ? { left: thinBorder } : {}),
              ...(colNumber === 8 ? { right: thinBorder } : {}),
            };
          });

          row.getCell(5).numFmt = "#,##0.##";
          row.getCell(6).numFmt = "0.0000";
          row.getCell(7).numFmt = "#,##0";
        });

        const lastDetailRow = rowNumber;

        // ------------------------------------------------------
        // SUBTOTAL HUB
        // ------------------------------------------------------

        rowNumber++;

        worksheet.mergeCells(`A${rowNumber}:D${rowNumber}`);

        const subtotalLabel = worksheet.getCell(`A${rowNumber}`);
        subtotalLabel.value = "SUBTOTAL HUB";

        subtotalLabel.font = {
          name: "Arial",
          size: 10,
          bold: true,
        };

        subtotalLabel.alignment = {
          horizontal: "right",
          vertical: "middle",
        };

        worksheet.getCell(`E${rowNumber}`).value = {
          formula: `SUM(E${firstDetailRow}:E${lastDetailRow})`,
        };

        worksheet.getCell(`F${rowNumber}`).value = {
          formula: `SUM(F${firstDetailRow}:F${lastDetailRow})`,
        };

        worksheet.getCell(`G${rowNumber}`).value = {
          formula: `SUM(G${firstDetailRow}:G${lastDetailRow})`,
        };

        worksheet.getCell(`F${rowNumber}`).numFmt = "0.0000";

        for (let col = 1; col <= 8; col++) {
          const cell = worksheet.getCell(rowNumber, col);

          cell.font = {
            name: "Arial",
            size: 10,
            bold: true,
          };

          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF5F5F5" },
          };

          // cell.border = {
          //   top: thinBorder,
          //   left: col === 1 ? thinBorder : noBorder,
          //   right: col === 8 ? thinBorder : noBorder,
          // };

          cell.border = {
            top: thinBorder,
            ...(col === 1 ? { left: thinBorder } : {}),
            ...(col === 8 ? { right: thinBorder } : {}),
          };

          if (col >= 5 && col <= 7) {
            cell.alignment = {
              horizontal: "right",
              vertical: "middle",
            };
          }
        }

        worksheet.getRow(rowNumber).height = 23;

        subtotalRows.push(rowNumber);
      });

      // --------------------------------------------------------
      // GRAND TOTAL
      // --------------------------------------------------------

      rowNumber++;

      worksheet.mergeCells(`A${rowNumber}:D${rowNumber}`);

      const grandTotalCell = worksheet.getCell(`A${rowNumber}`);
      grandTotalCell.value = "GRAND TOTAL";
      grandTotalCell.font = {
        name: "Arial",
        size: 10,
        bold: true,
      };

      grandTotalCell.alignment = {
        horizontal: "right",
        vertical: "middle",
      };

      const sumFormula = (column: string) => {
        if (subtotalRows.length === 0) return "0";

        return subtotalRows
          .map((row) => `${column}${row}`)
          .join("+");
      };

      worksheet.getCell(`E${rowNumber}`).value = {
        formula: sumFormula("E"),
      };

      worksheet.getCell(`F${rowNumber}`).value = {
        formula: sumFormula("F"),
      };

      worksheet.getCell(`G${rowNumber}`).value = {
        formula: sumFormula("G"),
      };

      worksheet.getCell(`F${rowNumber}`).numFmt = "0.0000";

      for (let col = 1; col <= 8; col++) {
        const cell = worksheet.getCell(rowNumber, col);

        cell.font = {
          name: "Arial",
          size: 10,
          bold: true,
        };

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEAEAEA" },
        };

        cell.border = {
          top: {
            style: "medium",
            color: { argb: "FF000000" },
          },
          bottom: thinBorder,
        };

        if (col >= 5 && col <= 7) {
          cell.alignment = {
            horizontal: "right",
            vertical: "middle",
          };
        }
      }

      worksheet.getRow(rowNumber).height = 25;

      // --------------------------------------------------------
      // SIGNATURE
      // --------------------------------------------------------

      rowNumber += 3;

      const signatureStartRow = rowNumber;

      const signaturePositions = [
        { start: 1, end: 2, title: "Supervisor" },
        { start: 4, end: 5, title: "Dispatcher" },
        { start: 7, end: 8, title: "Transporter" },
      ];

      signaturePositions.forEach((position) => {
        worksheet.mergeCells(
          signatureStartRow,
          position.start,
          signatureStartRow,
          position.end
        );

        const cell = worksheet.getCell(
          signatureStartRow,
          position.start
        );

        cell.value = position.title;
        cell.font = {
          name: "Arial",
          size: 10,
        };

        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
        };

        worksheet.mergeCells(
          signatureStartRow + 3,
          position.start,
          signatureStartRow + 3,
          position.end
        );

        const signCell = worksheet.getCell(
          signatureStartRow + 3,
          position.start
        );

        signCell.value = "________________";
        signCell.alignment = {
          horizontal: "center",
        };

        worksheet.mergeCells(
          signatureStartRow + 4,
          position.start,
          signatureStartRow + 4,
          position.end
        );

        const nameCell = worksheet.getCell(
          signatureStartRow + 4,
          position.start
        );

        nameCell.value = "Name & Sign";
        nameCell.alignment = {
          horizontal: "center",
        };

        worksheet.mergeCells(
          signatureStartRow + 5,
          position.start,
          signatureStartRow + 5,
          position.end
        );

        worksheet.getCell(
          signatureStartRow + 5,
          position.start
        ).value = "Date :";

        worksheet.mergeCells(
          signatureStartRow + 6,
          position.start,
          signatureStartRow + 6,
          position.end
        );

        worksheet.getCell(
          signatureStartRow + 6,
          position.start
        ).value = "Time :";
      });

      rowNumber = signatureStartRow + 9;

      // --------------------------------------------------------
      // NOTE
      // --------------------------------------------------------

      worksheet.mergeCells(`A${rowNumber}:H${rowNumber + 4}`);

      const noteCell = worksheet.getCell(`A${rowNumber}`);
      noteCell.value = "Note :";

      noteCell.font = {
        name: "Arial",
        size: 10,
        bold: true,
      };

      noteCell.alignment = {
        vertical: "top",
        horizontal: "left",
        wrapText: true,
      };

      for (let row = rowNumber; row <= rowNumber + 4; row++) {
        for (let col = 1; col <= 8; col++) {
          const cell = worksheet.getCell(row, col);

          // cell.border = {
          //   top: row === rowNumber ? thinBorder : noBorder,
          //   bottom: row === rowNumber + 4 ? thinBorder : noBorder,
          //   left: col === 1 ? thinBorder : noBorder,
          //   right: col === 8 ? thinBorder : noBorder,
          // };


          cell.border = {
            ...(row === rowNumber ? { top: thinBorder } : {}),
            ...(row === rowNumber + 4 ? { bottom: thinBorder } : {}),
            ...(col === 1 ? { left: thinBorder } : {}),
            ...(col === 8 ? { right: thinBorder } : {}),
          };
        }
      }

      worksheet.getRow(rowNumber).height = 25;

      // --------------------------------------------------------
      // GENERAL WORKSHEET SETTINGS
      // --------------------------------------------------------

      worksheet.views = [
        {
          state: "normal",
          showGridLines: false,
        },
      ];

      worksheet.properties.defaultRowHeight = 18;

      // --------------------------------------------------------
      // DOWNLOAD FILE
      // --------------------------------------------------------

      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `SPK_${order.order_no || "EXPORT"}.xlsx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export Excel error:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to export SPK to Excel."
      );
    } finally {
      setIsExporting(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div style={{ padding: "10px", fontFamily: "Arial" }}>
      {/* EXPORT BUTTON */}
      <div className="no-print" style={actionContainer}>
        <button
          type="button"
          onClick={handleExportExcel}
          disabled={isExporting || !order}
          style={{
            ...exportButton,
            opacity: isExporting || !order ? 0.6 : 1,
            cursor: isExporting || !order ? "not-allowed" : "pointer",
          }}
        >
          {isExporting ? "Exporting..." : "Export Excel"}
        </button>
      </div>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <p
          style={{
            fontSize: "16px",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          PT YUSEN LOGISTICS INTERLINK INDONESIA
        </p>
      </div>

      <hr
        style={{
          border: "1px solid black",
          marginBottom: "10px",
          marginTop: "10px",
        }}
      />

      <h2
        style={{
          textAlign: "center",
          marginBottom: "20px",
          marginTop: "10px",
          textDecoration: "underline",
        }}
      >
        SURAT PERINTAH KIRIM
      </h2>

      {/* BARCODE */}
      <div
        style={{
          width: "278px",
          height: "52px",
          marginTop: "4px",
          marginBottom: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          overflow: "hidden",
        }}
      >
        {order?.order_no && (
          <canvas
            ref={barcodeRef}
            aria-label={`Barcode for SPK ${order.order_no}`}
            style={{ width: "200px", height: "50px" }}
          />
        )}
      </div>

      {/* ORDER INFORMATION */}
      <div style={{ fontSize: "12px", marginTop: "10px" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
          }}
        >
          <tbody>
            <tr>
              <td style={headerLabel}>No. SPK/Order</td>
              <td style={headerValue}>: {order?.order_no}</td>
              <td style={headerLabel}>Transporter</td>
              <td style={headerValue}>: {order?.transporter_name}</td>
            </tr>

            <tr>
              <td style={headerLabel}>Order Date</td>
              <td style={headerValue}>: {order?.order_date}</td>
              <td style={headerLabel}>Driver</td>
              <td style={headerValue}>: {order?.driver}</td>
            </tr>

            <tr>
              <td style={headerLabel}>Truck Type</td>
              <td style={headerValue}>: {order?.truck_type}</td>
              <td style={headerLabel}>Truck No</td>
              <td style={headerValue}>: {order?.truck_no}</td>
            </tr>

            <tr>
              <td style={headerLabel}>Load Date</td>
              <td style={headerValue}>: {order?.load_date}</td>
              <td style={headerLabel}>Arrival Date</td>
              <td style={headerValue}>: {order?.arrival_date}</td>
            </tr>

            <tr>
              <td style={headerLabel}>Load Start Time</td>
              <td style={headerValue}>: {order?.load_start_time}</td>
              <td style={headerLabel}>Arrival Start Time</td>
              <td style={headerValue}>: {order?.arrival_start_time}</td>
            </tr>

            <tr>
              <td style={headerLabel}>Load End Time</td>
              <td style={headerValue}>: {order?.load_end_time}</td>
              <td style={headerLabel}>Arrival End Time</td>
              <td style={headerValue}>: {order?.arrival_end_time}</td>
            </tr>

            <tr>
              <td style={headerLabel}>Remarks</td>
              <td style={headerValue}>: {order?.remarks}</td>
              <td style={headerLabel}></td>
              <td style={headerValue}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* DELIVERY SUMMARY */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
          fontSize: "11px",
        }}
      >
        <thead>
          <tr>
            <th style={{ ...th, width: "4%" }}>NO</th>
            <th style={th}>DO No</th>
            <th style={th}>Delivery To</th>
            <th style={th}>Delivery City</th>
            <th style={th}>Total Qty</th>
            <th style={th}>Total CBM</th>
            <th style={th}>Total Koli</th>
            <th style={th}>Remarks</th>
          </tr>
        </thead>

        <tbody>
          {deliveryGroups.length > 0 ? (
            deliveryGroups.map((group) => {
              const subtotalQty = group.items.reduce(
                (sum, item) => sum + item.total_qty,
                0
              );

              const subtotalCbm = group.items
                .reduce((sum, item) => sum + item.total_cbm, 0)
                .toFixed(4);

              const subtotalKoli = group.items.reduce(
                (sum, item) => sum + item.total_koli,
                0
              );

              return (
                <React.Fragment key={group.key}>
                  {/* GROUP HEADER */}
                  <tr>
                    <td colSpan={8} style={groupHeader}>
                      {group.delivery_mode === "VIA_HUB" ? (
                        <>
                          <div style={{ fontWeight: "bold" }}>
                            VIA HUB -{" "}
                            {group.delivery_hub_name}
                          </div>

                          <div style={groupCity}>
                            {group.delivery_hub_city}
                          </div>

                          <div style={groupAddress}>
                            {group.delivery_hub_address}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontWeight: "bold" }}>
                          DIRECT DELIVERY
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* DO ROWS */}
                  {group.items.map((item) => {
                    const index = shipmentSummaries.indexOf(item);

                    return (
                      <tr key={item.shipment_id}>
                        <td
                          style={{
                            ...groupCell,
                            textAlign: "center",
                            borderLeft: "1px solid #000",
                          }}
                        >
                          {index + 1}
                        </td>

                        <td style={{ ...groupCell, textAlign: "left" }}>
                          {item.shipment_id}
                        </td>

                        <td style={{ ...groupCell, textAlign: "left" }}>
                          {item.deliv_to_name}
                        </td>

                        <td style={{ ...groupCell, textAlign: "left" }}>
                          {item.deliv_city}
                        </td>

                        <td style={{ ...groupCell, textAlign: "right" }}>
                          {item.total_qty}
                        </td>

                        <td style={{ ...groupCell, textAlign: "right" }}>
                          {item.total_cbm.toFixed(4)}
                        </td>

                        <td style={{ ...groupCell, textAlign: "center" }}>
                          {item.total_koli}
                        </td>

                        <td
                          style={{
                            ...groupCell,
                            textAlign: "left",
                            borderRight: "1px solid #000",
                          }}
                        >
                          {item.remarks}
                        </td>
                      </tr>
                    );
                  })}

                  {/* SUBTOTAL HUB */}
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        ...subtotalLabel,
                        borderLeft: "1px solid #000",
                      }}
                    >
                      SUBTOTAL HUB
                    </td>

                    <td style={subtotalValue}>{subtotalQty}</td>
                    <td style={subtotalValue}>{subtotalCbm}</td>
                    <td style={subtotalValue}>{subtotalKoli}</td>

                    <td
                      style={{
                        ...subtotalValue,
                        borderRight: "1px solid #000",
                      }}
                    ></td>
                  </tr>
                </React.Fragment>
              );
            })
          ) : (
            <tr>
              <td colSpan={8} style={{ ...td, textAlign: "center" }}>
                No data
              </td>
            </tr>
          )}

          {/* GRAND TOTAL */}
          <tr>
            <td colSpan={4} style={grandTotalLabel}>
              GRAND TOTAL
            </td>

            <td style={grandTotalValue}>{grandTotalQty}</td>
            <td style={grandTotalValue}>{grandTotalCbm}</td>
            <td style={grandTotalValue}>{grandTotalKoli}</td>
            <td style={grandTotalValue}></td>
          </tr>
        </tbody>
      </table>

      {/* SIGNATURE */}
      <div
        style={{
          marginTop: "50px",
          display: "flex",
          justifyContent: "space-around",
        }}
      >
        {["Supervisor", "Dispatcher", "Transporter"].map((role) => (
          <div key={role}>
            <p
              style={{
                textAlign: "center",
                fontSize: "10px",
              }}
            >
              {role}
            </p>

            <div style={signatureLine}></div>

            <p
              style={{
                textAlign: "center",
                fontSize: "10px",
              }}
            >
              Name & Sign
            </p>

            <p style={{ textAlign: "left", fontSize: "10px" }}>
              Date :
            </p>

            <p style={{ textAlign: "left", fontSize: "10px" }}>
              Time :
            </p>
          </div>
        ))}
      </div>

      {/* NOTE */}
      <div
        style={{
          marginTop: "50px",
          width: "100%",
          height: "100px",
          border: "1px solid #000",
          padding: "10px",
        }}
      >
        <p
          style={{
            textAlign: "left",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          Note :
        </p>
      </div>

      {/* PRINT STYLE */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================

const actionContainer = {
  display: "flex",
  justifyContent: "flex-end",
  marginBottom: "12px",
};

const exportButton = {
  backgroundColor: "#217346",
  color: "#ffffff",
  border: "none",
  borderRadius: "4px",
  padding: "9px 18px",
  fontSize: "12px",
  fontWeight: "bold" as const,
};

const th = {
  border: "1px solid #000",
  padding: "5px 4px",
  backgroundColor: "#eee",
  textAlign: "center" as const,
};

const td = {
  borderBottom: "1px dashed #000",
  padding: "5px 4px",
};

const groupHeader = {
  borderTop: "1px solid #000",
  borderLeft: "1px solid #000",
  borderRight: "1px solid #000",
  padding: "6px",
  textAlign: "left" as const,
};

const groupCity = {
  fontSize: "10px",
  marginTop: "2px",
  fontWeight: "normal" as const,
};

const groupAddress = {
  fontSize: "9px",
  marginTop: "2px",
  fontWeight: "normal" as const,
};

const groupCell = {
  borderBottom: "1px dashed #000",
  padding: "5px 4px",
};

const subtotalLabel = {
  borderTop: "1px solid #000",
  padding: "5px 4px",
  textAlign: "right" as const,
  fontWeight: "bold" as const,
  backgroundColor: "#f5f5f5",
};

const subtotalValue = {
  borderTop: "1px solid #000",
  padding: "5px 4px",
  textAlign: "right" as const,
  fontWeight: "bold" as const,
  backgroundColor: "#f5f5f5",
};

const grandTotalLabel = {
  borderTop: "2px solid #000",
  borderBottom: "1px solid #000",
  padding: "6px 4px",
  textAlign: "right" as const,
  fontWeight: "bold" as const,
  backgroundColor: "#eaeaea",
};

const grandTotalValue = {
  borderTop: "2px solid #000",
  borderBottom: "1px solid #000",
  padding: "6px 4px",
  textAlign: "right" as const,
  fontWeight: "bold" as const,
  backgroundColor: "#eaeaea",
};

const headerLabel = {
  padding: "2px 6px",
  fontWeight: "bold" as const,
  whiteSpace: "nowrap" as const,
  width: "20%",
};

const headerValue = {
  padding: "2px 6px",
  width: "30%",
};

const signatureLine = {
  borderBottom: "1px solid black",
  width: "100px",
  height: "55px",
  marginBottom: "5px",
};

export default SPKSheetPrint;
