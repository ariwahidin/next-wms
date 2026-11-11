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
import { MoreHorizontal, Pencil, Printer, Plus, Package, Loader2, ArrowUpRight } from "lucide-react";
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
import { generateBarcodeDataURL } from "@/utils/generateBarcode";

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

type PickingOutboundOption = {
  outbound_no: string;
  shipment_id?: string;
  customer_name?: string;
  status?: string;
  raw_status?: string;
  [key: string]: any;
};

type MasterCartonOption = {
  id: number;
  name: string;
  code?: string;
  description?: string;
  [key: string]: any;
};

const unwrapList = (responseData: any): any[] => {
  const candidates = [
    responseData?.data,
    responseData?.data?.data,
    responseData?.data?.items,
    responseData?.items,
    responseData?.result,
  ];

  return candidates.find((value) => Array.isArray(value)) ?? [];
};

const getOutboundStatus = (item: any) =>
  String(item?.raw_status ?? item?.status ?? "").trim().toUpperCase();

const getMasterCartonId = (item: any) =>
  Number(item?.master_carton_id ?? item?.ID ?? item?.id ?? item?.carton_type_id ?? 0);

const PackingTable = () => {
  const {
    data: rowData,
    error,
    mutate,
  } = useSWR("/outbound/packing/all", fetcher);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  // Create/open packing workspace dialog
  const [isNewPackingOpen, setIsNewPackingOpen] = useState(false);
  const [isLoadingOutbounds, setIsLoadingOutbounds] = useState(false);
  const [isLoadingCartonTypes, setIsLoadingCartonTypes] = useState(false);
  const [isOpeningWorkspace, setIsOpeningWorkspace] = useState(false);
  const [pickingOutbounds, setPickingOutbounds] = useState<PickingOutboundOption[]>([]);
  const [masterCartonOptions, setMasterCartonOptions] = useState<MasterCartonOption[]>([]);
  const [selectedOutboundNo, setSelectedOutboundNo] = useState("");
  const [selectedMasterCartonId, setSelectedMasterCartonId] = useState("");
  const [outboundSearch, setOutboundSearch] = useState("");

  // Dialog states
  const [isScannedItemDialog, setIsScannedItemDialog] = useState(false);

  useEffect(() => {
    if (!isScannedItemDialog) {
      document.body.style.removeProperty("pointer-events");
    }
  }, [isScannedItemDialog]);

  const showPackingError = (description: string) => {
    eventBus.emit("showAlert", {
      title: "Unable to continue",
      description,
      type: "error",
    });
  };

  const openNewPackingDialog = async () => {
    setIsNewPackingOpen(true);
    setSelectedOutboundNo("");
    setSelectedMasterCartonId("");
    setOutboundSearch("");
    setMasterCartonOptions([]);
    setIsLoadingOutbounds(true);

    try {
      const response = await api.get("/mobile/outbound/list/open", {
        withCredentials: true,
      });

      // Endpoint response yang diberikan backend berbentuk:
      // { "data": [ ... ] } dan tidak selalu menyertakan property `success`.
      // Karena itu, validasi dilakukan berdasarkan keberadaan array data.
      const outboundRows = unwrapList(response.data);
      if (!Array.isArray(outboundRows)) {
        throw new Error(response.data?.message || "Invalid outbound list response");
      }

      const rows = outboundRows
        .filter((item: any) => getOutboundStatus(item) === "PICKING")
        .map((item: any) => ({
          ...item,
          outbound_no: String(item.outbound_no ?? item.OutboundNo ?? ""),
        }))
        .filter((item: PickingOutboundOption) => item.outbound_no);

      setPickingOutbounds(rows);
    } catch (error: any) {
      console.error("Load picking outbound failed:", error);
      showPackingError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load outbound with PICKING status."
      );
    } finally {
      setIsLoadingOutbounds(false);
    }
  };

  const handleOutboundSelection = async (outboundNo: string) => {
    setSelectedOutboundNo(outboundNo);
    setSelectedMasterCartonId("");
    setMasterCartonOptions([]);

    if (!outboundNo) return;

    setIsLoadingCartonTypes(true);
    try {
      const response = await api.get("/mobile/outbound/master-cartons", {
        withCredentials: true,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to load carton types");
      }

      const rows = unwrapList(response.data)
        .map((item: any) => {
          const id = getMasterCartonId(item);
          const name = String(
            item?.carton_type ??
              item?.master_carton_name ??
              item?.carton_name ??
              item?.name ??
              item?.code ??
              item?.description ??
              `Carton Type ${id}`
          );

          return {
            ...item,
            id,
            name,
            code: item?.code ?? item?.carton_code ?? "",
            description: item?.description ?? "",
          };
        })
        .filter((item: MasterCartonOption) => item.id > 0);

      setMasterCartonOptions(rows);
    } catch (error: any) {
      console.error("Load master carton types failed:", error);
      showPackingError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load carton types."
      );
    } finally {
      setIsLoadingCartonTypes(false);
    }
  };

  const startNewPacking = () => {
    if (!selectedOutboundNo) {
      showPackingError("Please select an outbound number.");
      return;
    }

    if (!selectedMasterCartonId) {
      showPackingError("Please select a carton type.");
      return;
    }

    const query = new URLSearchParams({
      outbound: selectedOutboundNo,
      master_carton_id: selectedMasterCartonId,
      carton: "1",
    });

    window.location.href = `/wms/outbound/packing-desktop?${query.toString()}`;
  };

  const openOngoingPacking = async (item: any) => {
    const outboundNo = String(item?.outbound_no ?? item?.OutboundNo ?? "");
    if (!outboundNo) {
      showPackingError("Outbound number is not available in this packing record.");
      return;
    }

    setIsOpeningWorkspace(true);
    try {
      // Resolve the existing active carton so the workspace opens on the
      // carton already being packed instead of creating a new one.
      const response = await api.get(`/mobile/outbound/${encodeURIComponent(outboundNo)}/cartons`, {
        withCredentials: true,
      });

      const cartons = unwrapList(response.data);
      const activeCarton =
        cartons.find((carton: any) =>
          carton?.is_active === true ||
          carton?.active === true ||
          String(carton?.status ?? "").toUpperCase() === "ACTIVE"
        ) ?? cartons[0];

      const masterCartonId =
        getMasterCartonId(activeCarton) ||
        getMasterCartonId(item) ||
        Number(item?.master_carton_id ?? 0);

      if (!masterCartonId) {
        showPackingError(
          "The carton type for this packing record could not be identified. Please open it through Add Packing and select a carton type."
        );
        return;
      }

      const cartonNo =
        activeCarton?.carton_no ??
        activeCarton?.carton_number ??
        activeCarton?.carton ??
        item?.carton ??
        1;

      const query = new URLSearchParams({
        outbound: outboundNo,
        master_carton_id: String(masterCartonId),
        carton: String(cartonNo),
      });

      window.location.href = `/wms/outbound/packing-desktop?${query.toString()}`;
    } catch (error: any) {
      console.error("Open ongoing packing failed:", error);
      showPackingError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load the active carton for this outbound."
      );
    } finally {
      setIsOpeningWorkspace(false);
    }
  };

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
                <img src="${item.barcodeDataUrl}" alt="Barcode ${item.code
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
    { field: "shipment_id", headerName: "DO No.", maxWidth: 150 },
    { field: "customer_name", headerName: "Customer", width: 280 },
    { field: "cust_city", headerName: "Customer City", maxWidth: 150 },
    // { field: "customer_delivery", headerName: "Delivery To", maxWidth: 200 },
    // { field: "deliv_city", headerName: "Delivery City", maxWidth: 150 },
    { field: "total_container", headerName: "Total Ctn.", maxWidth: 120 },
    { field: "tot_item", headerName: "Total Item", maxWidth: 120 },
    { field: "tot_qty", headerName: "Total Qty", maxWidth: 120 },
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
                    openOngoingPacking(params.data);
                  }}
                >
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Continue Packing
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    HandlePreviewPDF(params.data.packing_no, params.data.outbound_id);
                  }}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Packing List
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    HandlePrintSummaryPacking(params.data.packing_no, params.data.outbound_id);
                  }}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Packing Summary
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    HandlePrintLabel(params.data.packing_no, params.data.outbound_id);
                  }}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Packing Label
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    HandlePrintLabelCustom1(params.data.packing_no, params.data.outbound_id);
                  }}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Label Custom 1
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    HandlePrintLabelCustom2(params.data.packing_no, params.data.outbound_id);
                  }}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Label Custom 2
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    HandlePrintLabelByItem(params.data.packing_no, params.data.outbound_id);
                  }}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Label By Item
                </DropdownMenuItem>

                {/* <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    HandleEdit(params.data);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  View / Edit
                </DropdownMenuItem> */}
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

    const HandlePrintSummaryPacking = (packing_no: string, id: number) => {
    console.log("Preview PDF ID:", id);
    window.open(`/wms/outbound/packing/packing-summary/${packing_no}/${id}`, "_blank");

    return
  };

  const HandlePrintLabel = (packing_no: string, id: number) => {
    console.log("Preview PDF ID:", id);
    window.open(`/wms/outbound/packing/packing-label/${packing_no}/${id}`, "_blank");
  };
  const HandlePrintLabelCustom1 = (packing_no: string, id: number) => {
    console.log("Preview PDF ID:", id);
    window.open(`/wms/outbound/packing/label-custom-1/${packing_no}/${id}`, "_blank");
  };

  const HandlePrintLabelCustom2 = (packing_no: string, id: number) => {
    console.log("Preview PDF ID:", id);
    window.open(`/wms/outbound/packing/label-custom-2/${packing_no}/${id}`, "_blank");
  };

  const HandlePrintLabelByItem = (packing_no: string, id: number) => {
    console.log("Preview PDF ID:", id);
    window.open(`/wms/outbound/packing/label-by-item/${packing_no}/${id}`, "_blank");
  };

  return (
    <>
      <div style={{ width: "100%", height: "510px" }}>
        <div className="flex items-center justify-between pb-4">
          <div className="justify-self-start">
            <div className="flex items-center gap-2 h-4">
              <Button
                className="h-8 w-42"
                onClick={() => {
                  generatePacking();
                }}
              >
                Generate Packing No
              </Button>
              <Button
                className="h-8 gap-2"
                variant="outline"
                onClick={openNewPackingDialog}
              >
                <Plus className="h-4 w-4" />
                Add Packing
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
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
            editable: true,
          }}
        />
      </div>

      {isNewPackingOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                  <Package className="h-4 w-4" />
                  NEW OUTBOUND PACKING
                </div>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Create Packing Workspace</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select an outbound with PICKING status, then choose its carton type.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsNewPackingOpen(false)}
                disabled={isOpeningWorkspace}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-5 px-5 py-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Outbound Number</label>
                <input
                  value={outboundSearch}
                  onChange={(event) => setOutboundSearch(event.target.value)}
                  placeholder="Search outbound number..."
                  className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200">
                  {isLoadingOutbounds ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading outbound list...
                    </div>
                  ) : pickingOutbounds.filter((item) =>
                      `${item.outbound_no} ${item.shipment_id ?? ""} ${item.customer_name ?? ""}`
                        .toLowerCase()
                        .includes(outboundSearch.toLowerCase())
                    ).length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-500">
                      No outbound with PICKING status found.
                    </div>
                  ) : (
                    pickingOutbounds
                      .filter((item) =>
                        `${item.outbound_no} ${item.shipment_id ?? ""} ${item.customer_name ?? ""}`
                          .toLowerCase()
                          .includes(outboundSearch.toLowerCase())
                      )
                      .map((item) => (
                        <button
                          key={item.outbound_no}
                          type="button"
                          onClick={() => handleOutboundSelection(item.outbound_no)}
                          className={`flex w-full items-center justify-between border-b border-slate-100 px-3 py-3 text-left last:border-b-0 hover:bg-blue-50 ${
                            selectedOutboundNo === item.outbound_no ? "bg-blue-50 ring-1 ring-inset ring-blue-300" : ""
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-800">{item.outbound_no}</span>
                            <span className="mt-0.5 block truncate text-xs text-slate-500">
                              {item.shipment_id || "No shipment ID"}{item.customer_name ? ` · ${item.customer_name}` : ""}
                            </span>
                          </span>
                          <span className="ml-3 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                            PICKING
                          </span>
                        </button>
                      ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Carton Type</label>
                <select
                  value={selectedMasterCartonId}
                  onChange={(event) => setSelectedMasterCartonId(event.target.value)}
                  disabled={!selectedOutboundNo || isLoadingCartonTypes || masterCartonOptions.length === 0}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">
                    {!selectedOutboundNo
                      ? "Select outbound number first"
                      : isLoadingCartonTypes
                        ? "Loading carton types..."
                        : masterCartonOptions.length === 0
                          ? "No carton type available"
                          : "Select carton type"}
                  </option>
                  {masterCartonOptions.map((carton) => (
                    <option key={carton.id} value={String(carton.id)}>
                      {carton.name}{carton.code && carton.code !== carton.name ? ` (${carton.code})` : ""}
                    </option>
                  ))}
                </select>
                {isLoadingCartonTypes && (
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading carton types...
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewPackingOpen(false)}
                disabled={isOpeningWorkspace}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={startNewPacking}
                disabled={!selectedOutboundNo || !selectedMasterCartonId || isLoadingCartonTypes || isOpeningWorkspace}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {isOpeningWorkspace ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
                Open Packing
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PackingTable;
