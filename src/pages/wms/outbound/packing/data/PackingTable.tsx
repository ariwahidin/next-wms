/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
} from "ag-grid-community";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Printer } from "lucide-react";
import useSWR from "swr";
import { type ChangeEvent, useCallback, useState, useEffect } from "react";
import styles from "./OutboundTable.module.css";
import eventBus from "@/utils/eventBus";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateBarcodeDataURL } from "@/utils/generate-barcode";

ModuleRegistry.registerModules([AllCommunityModule]);
// ModuleRegistry.registerModules([ MasterDetailModule ]);

const fetcher = (url: string) =>
  api.get(url, { withCredentials: true }).then((res) => {
    if (res.data.success && res.data.data) {
      return res.data.data.map((item: any, key: number) => ({
        ...item,
        no: key + 1,
        edit: true,
      }));
    }
    return [];
  });

const HandleEdit = (item: any) => {
  console.log("Edit ID:", item.outbound_no);
  window.location.href = `/wms/outbound/edit/${item.outbound_no}`;
};

const PackingTable = () => {
  const {
    data: rowData,
    error,
    mutate,
  } = useSWR("/outbound/packing/all", fetcher);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  // Dialog states
  const [isScannedItemDialog, setIsScannedItemDialog] = useState(false);

  useEffect(() => {
    if (!isScannedItemDialog) {
      document.body.style.removeProperty("pointer-events");
    }
  }, [isScannedItemDialog]);

  const printPackingNo = async () => {
    if (selectedRows.length === 0) {
      eventBus.emit("showAlert", {
        title: "Warning!",
        description: "Please select packing numbers to print",
        type: "error",
      });
      return;
    }

    // Generate all barcode data URLs first
    const barcodeDataUrls = selectedRows.map((item) => ({
      ...item,
      code: item.packing_no,
      barcodeDataUrl: generateBarcodeDataURL(item.packing_no),
      timestamp: item.CreatedAt || new Date().toISOString(),
    }));

    const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Packing Numbers</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: white;
          }

          .page {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 277mm;
            box-sizing: border-box;
            page-break-after: always;
          }

          .packing-item {
            flex: 1;
            border: 1px solid #333;
            border-radius: 6px;
            margin: 2mm 0;
            padding: 4mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            background: white;
            box-sizing: border-box;
          }

          .packing-code {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 4mm;
            font-family: 'Courier New', monospace;
            color: #333;
          }

          .barcode-container {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .barcode-image {
            min-width: 120%;
            max-width: 150%;
            max-height: 60%;
          }

          .packing-info {
            font-size: 11px;
            color: #666;
            margin-top: 2mm;
          }
        </style>
      </head>
      <body>
  ${(() => {
    const pages = [];
    for (let i = 0; i < barcodeDataUrls.length; i += 4) {
      const items = barcodeDataUrls.slice(i, i + 4);

      // Fill remaining slots with empty items if less than 4
      while (items.length < 4) {
        items.push(null);
      }

      const htmlItems = items
        .map((item) => {
          if (!item) {
            return `
              <div class="packing-item" style="border: none; background: transparent;"></div>
            `;
          }
          return `
            <div class="packing-item">
              <div class="packing-code">${item.code}</div>
              <div class="barcode-container">
                <img src="${item.barcodeDataUrl}" alt="Barcode ${
            item.code
          }" class="barcode-image" />
              </div>
              <div class="packing-info">
                Packing Number<br>
                Generated: ${new Date(item.timestamp).toLocaleDateString(
                  "id-ID"
                )}
              </div>
            </div>
          `;
        })
        .join("");

      pages.push(`<div class="page">${htmlItems}</div>`);
    }
    return pages.join("");
  })()}
      </body>
    </html>
  `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();

      // Wait for images to load before printing
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const [columnDefs, setColumnDefs] = useState<ColDef[]>([
    {
      headerName: "",
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 50,
      pinned: "left",
      lockPosition: "left",
      suppressMovable: true,
    },
    { field: "no", headerName: "No. ", maxWidth: 70 },
    { field: "packing_no", headerName: "Packing No", maxWidth: 150 },
    { field: "customer_name", headerName: "Customer", maxWidth: 200 },
    { field: "cust_city", headerName: "Customer City", maxWidth: 150 },
    { field: "customer_delivery", headerName: "Delivery To", maxWidth: 200 },
    { field: "deliv_city", headerName: "Delivery City", maxWidth: 150 },
    { field: "tot_item", headerName: "Total Item", maxWidth: 150 },
    { field: "tot_qty", headerName: "Total Qty", maxWidth: 150 },
    {
      headerName: "Actions",
      pinned: "right",
      headerClass: "header-center",
      cellStyle: { textAlign: "center" },
      field: "ID",
      maxWidth: 80,
      cellRenderer: (params: any) => {
        return (
          <div
            className="flex justify-center pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    HandlePreviewPDF(params.data.packing_no, params.data.outbound_id);
                  }}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Packing
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    HandleEdit(params.data);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  View / Edit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
    {
      field: "created_at",
      headerName: "Generate Date",
      width: 160,
      valueFormatter: (params: any) => {
        if (!params.value) return "";
        const date = new Date(params.value);
        return date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          year: "numeric",
        });
      },
    },
  ]);

  const [quickFilterText, setQuickFilterText] = useState<string>();
  const onFilterTextBoxChanged = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
      setQuickFilterText(value),
    []
  );

  const generatePacking = () => {
    try {
      const response = api.post("/outbound/packing/generate");
      response.then((res) => {
        if (res.data.success === true) {
          eventBus.emit("showAlert", {
            title: "Success!",
            description: res.data.message,
            type: "success",
          });
          mutate("/outbound/packing/all");
        }
      });
    } catch (error) {
      console.error("Error open outbound:", error);
    }
  };

  const HandlePreviewPDF = (packing_no: string, id: number) => {
    console.log("Preview PDF ID:", id);
    window.open(`/wms/outbound/packing/packing-sheet/${packing_no}/${id}`, "_blank");

    return

    const printWindow = window.open(
      `/wms/outbound/packing-sheet/${packing_no}/${id}`,
      "_blank"
    );
    if (printWindow) {
      // printWindow.document.write(printContent);
      printWindow.document.close();

      // Wait for images to load before printing
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1000);
    }
  };

  return (
    <>
      <div style={{ width: "100%", height: "510px" }}>
        <div className="flex items-center justify-between pb-4">
          <div className="justify-self-start">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  generatePacking();
                }}
              >
                Generate Packing No
              </Button>
              {selectedRows.length > 0 && (
                <Button
                  onClick={printPackingNo}
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Printer className="h-4 w-4" />
                  Print Packing No ({selectedRows.length})
                </Button>
              )}
            </div>
          </div>

          <div className="justify-self-end">
            <div className={styles.inputWrapper}>
              <svg
                className={styles.searchIcon}
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M11.5014 7.00039C11.5014 7.59133 11.385 8.1765 11.1588 8.72246C10.9327 9.26843 10.6012 9.7645 10.1833 10.1824C9.76548 10.6002 9.2694 10.9317 8.72344 11.1578C8.17747 11.384 7.59231 11.5004 7.00136 11.5004C6.41041 11.5004 5.82525 11.384 5.27929 11.1578C4.73332 10.9317 4.23725 10.6002 3.81938 10.1824C3.40152 9.7645 3.07005 9.26843 2.8439 8.72246C2.61776 8.1765 2.50136 7.59133 2.50136 7.00039C2.50136 5.80691 2.97547 4.66232 3.81938 3.81841C4.6633 2.97449 5.80789 2.50039 7.00136 2.50039C8.19484 2.50039 9.33943 2.97449 10.1833 3.81841C11.0273 4.66232 11.5014 5.80691 11.5014 7.00039ZM10.6814 11.7404C9.47574 12.6764 7.95873 13.1177 6.43916 12.9745C4.91959 12.8314 3.51171 12.1145 2.50211 10.9698C1.49252 9.8251 0.957113 8.33868 1.0049 6.81314C1.05268 5.28759 1.68006 3.83759 2.75932 2.75834C3.83857 1.67908 5.28856 1.0517 6.81411 1.00392C8.33966 0.956136 9.82608 1.49154 10.9708 2.50114C12.1154 3.51073 12.8323 4.91862 12.9755 6.43819C13.1187 7.95775 12.6773 9.47476 11.7414 10.6804L14.5314 13.4704C14.605 13.539 14.6642 13.6218 14.7051 13.7138C14.7461 13.8058 14.7682 13.9052 14.77 14.0059C14.7717 14.1066 14.7532 14.2066 14.7155 14.3C14.6778 14.3934 14.6216 14.4782 14.5504 14.5494C14.4792 14.6206 14.3943 14.6768 14.301 14.7145C14.2076 14.7522 14.1075 14.7708 14.0068 14.769C13.9061 14.7672 13.8068 14.7452 13.7148 14.7042C13.6228 14.6632 13.54 14.6041 13.4714 14.5304L10.6814 11.7404Z"
                  fill="currentColor"
                />
              </svg>

              <input
                type="text"
                id="filter-text-box"
                placeholder="Search ..."
                onInput={onFilterTextBoxChanged}
              />
            </div>
          </div>
        </div>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          quickFilterText={quickFilterText}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 25, 50]}
          domLayout="autoHeight"
          onSelectionChanged={(e) => {
            const selected = e.api.getSelectedRows();
            setSelectedRows(selected);
          }}
          rowSelection="multiple"
        />
      </div>
    </>
  );
};

export default PackingTable;
