/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, ColDef } from "ag-grid-community";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Printer,
  Truck,
  CheckCheck,
  RotateCcw,
} from "lucide-react";
import useSWR, { mutate } from "swr";
import {
  ChangeEvent,
  useCallback,
  useState,
  useMemo,
  useRef,
  useEffect,
} from "react";
import styles from "./OrderTable.module.css";
import router, { useRouter } from "next/router";
import { useAlert } from "@/contexts/AlertContext";
import { Badge } from "@/components/ui/badge";
import eventBus from "@/utils/eventBus";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MuatanOrderSPK } from "@/types/order-spk";
import { useAppSelector } from "@/hooks/useAppSelector";

ModuleRegistry.registerModules([AllCommunityModule]);

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
  router.push(`/wms/outbound/order-spk/edit/${item.order_no}`);
};

const HandlePreviewPDF = (item: MuatanOrderSPK) => {
  window.open(
    `/wms/outbound/order-spk/spk-sheet/${item.order_no}`,
    "_blank"
  );
};

// Badge warna berdasarkan status
const StatusBadge = ({ status }: { status: string }) => {
  const statusMap: Record<string, { label: string; className: string }> = {
    open: {
      label: "Open",
      className: "bg-blue-100 text-blue-700 border border-blue-300",
    },
    loaded: {
      label: "Loaded",
      className: "bg-green-100 text-green-700 border border-green-300",
    },
  };

  const config = statusMap[status?.toLowerCase()] ?? {
    label: status ?? "-",
    className: "bg-gray-100 text-gray-600 border border-gray-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
};

const OrderTable = () => {
  const { data: rowData, error, mutate } = useSWR("/order", fetcher);
  const { showAlert, notify } = useAlert();
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const gridRef = useRef<AgGridReact>(null);

  // Dialog states (existing)
  const [isScannedItemDialog, setIsScannedItemDialog] = useState(false);
  const [scannedItemData, setScannedItemData] = useState<any>(null);
  const [tempLocationName, setTempLocationName] = useState("");
  const [showTempLocationInput, setShowTempLocationInput] = useState(false);
  const userRedux = useAppSelector((state) => state.user);

  // ─── Update Status ──────────────────────────────────────────────────────────

  /**
   * Update status satu order (dari dropdown action)
   */
  const handleUpdateStatusSingle = useCallback(
    (orderNo: string, newStatus: string) => {
      const label = newStatus === "loaded" ? "Mark as Loaded" : "Reopen";
      showAlert(
        `${label} Confirmation`,
        `Are you sure you want to change the status of order ${orderNo} to "${newStatus}"?`,
        "error",
        async () => {
          try {
            const res = await api.patch(
              "/order/status",
              { order_nos: [orderNo], status: newStatus },
              { withCredentials: true }
            );
            if (res.data.success) {
              eventBus.emit("showAlert", {
                title: "Success!",
                description: res.data.message,
                type: "success",
              });
              mutate("/order");
            }
          } catch (err) {
            eventBus.emit("showAlert", {
              title: "Error",
              description: "Failed to update status",
              type: "error",
            });
          }
        }
      );
    },
    [showAlert, mutate]
  );

  /**
   * Update status banyak order sekaligus (bulk)
   */
  const handleBulkUpdateStatus = useCallback(
    (newStatus: string) => {
      if (selectedRows.length === 0) {
        notify("Warning", "Please select at least one order first", "error");
        return;
      }
      const orderNos = selectedRows.map((r) => r.order_no);
      const label = newStatus === "loaded" ? "Mark as Loaded" : "Reopen";
      showAlert(
        `${label} - Bulk Action`,
        `Update ${orderNos.length} selected order(s) to "${newStatus}"?`,
        "error",
        async () => {
          try {
            const res = await api.patch(
              "/order/status",
              { order_nos: orderNos, status: newStatus },
              { withCredentials: true }
            );
            if (res.data.success) {
              eventBus.emit("showAlert", {
                title: "Success!",
                description: res.data.message,
                type: "success",
              });
              mutate("/order");
              // Clear selection
              gridRef.current?.api?.deselectAll();
              setSelectedRows([]);
            }
          } catch (err) {
            eventBus.emit("showAlert", {
              title: "Error",
              description: "Failed to bulk update status",
              type: "error",
            });
          }
        }
      );
    },
    [selectedRows, showAlert, notify, mutate]
  );

  // ─── Existing scanned item dialog logic ─────────────────────────────────────

  const handleOpenSingle = (rowData: any) => {
    try {
      api
        .post("/outbound/open", { outbound_no: rowData.outbound_no })
        .then((response) => {
          if (response.data.success) {
            setScannedItemData({
              outbound_no: rowData.outbound_no,
              scanned_items: rowData.scanned_items || [],
            });
            setIsScannedItemDialog(true);
          }
        })
        .catch((error) => {
          console.error("Error open outbound:", error);
        });
    } catch (error) {
      console.error("Error open outbound:", error);
    }
  };

  const handleScannedItemChoice = (choice: string) => {
    if (choice === "temp_location") {
      setShowTempLocationInput(true);
    } else if (choice === "return_to_rack") {
      processScannedItems("return_to_rack");
    }
  };

  const processScannedItems = useCallback(
    (action: string, locationName: string | null = null) => {
      const payload = {
        outbound_no: scannedItemData?.outbound_no,
        action: action,
        temp_location_name: locationName,
      };
      api
        .post("/outbound/open/process", payload, { withCredentials: true })
        .then((response) => {
          if (response.data.success) {
            notify("Success", response.data.message, "success");
            mutate("/outbound");
            closeScannedItemDialog();
          } else {
            notify("Error", response.data.message, "error");
          }
        })
        .catch((error) => {
          console.error("Error handling scanned items:", error);
          notify("Error", "Terjadi kesalahan saat memproses item", "error");
        });
    },
    [scannedItemData?.outbound_no, notify, mutate]
  );

  const inputRef = useRef<HTMLInputElement>(null);

  const handleTempLocationSubmit = useCallback(() => {
    const currentValue = inputRef.current?.value || tempLocationName;
    if (!currentValue.trim()) {
      notify("Error", "Temporary location name is required", "error");
      return;
    }
    processScannedItems("temp_location", currentValue.trim());
  }, [processScannedItems, notify, tempLocationName]);

  const closeScannedItemDialog = useCallback(() => {
    setIsScannedItemDialog(false);
    setScannedItemData(null);
    setTempLocationName("");
    setShowTempLocationInput(false);
  }, []);

  const handleBackToChoice = useCallback(() => {
    setShowTempLocationInput(false);
  }, []);

  useEffect(() => {
    if (!isScannedItemDialog) {
      document.body.style.removeProperty("pointer-events");
    }
  }, [isScannedItemDialog]);

  useEffect(() => {
    if (!isScannedItemDialog) {
      setScannedItemData(null);
      setTempLocationName("");
    }
  }, [isScannedItemDialog]);

  // ─── Scanned Item Dialog ─────────────────────────────────────────────────────

  const ScannedItemDialog = () => (
    <Dialog open={isScannedItemDialog} onOpenChange={closeScannedItemDialog}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>This outbound has been picked</DialogTitle>
          <DialogDescription>
            Stock inventory has been picked for outbound number{" "}
            {scannedItemData?.outbound_no}. Select the action to perform:
          </DialogDescription>
        </DialogHeader>
        {!showTempLocationInput ? (
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              onClick={() => handleScannedItemChoice("return_to_rack")}
              variant="outline"
              className="w-full"
              type="button"
            >
              Return to origin location
            </Button>
            <Button
              onClick={() => handleScannedItemChoice("temp_location")}
              className="w-full"
              type="button"
            >
              Move to Temporary Location
            </Button>
          </DialogFooter>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTempLocationSubmit();
            }}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="temp-location">Temporary Location Name</Label>
                <Input
                  ref={inputRef}
                  id="temp-location"
                  placeholder="Enter the name of the temporary location..."
                  defaultValue=""
                  autoComplete="off"
                  autoFocus
                  required
                />
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={handleBackToChoice}
                  type="button"
                >
                  Back
                </Button>
                <Button type="submit">Submit</Button>
              </DialogFooter>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );

  // ─── Column Defs ─────────────────────────────────────────────────────────────

  const [columnDefs] = useState<ColDef[]>([
    {
      headerCheckboxSelection: true,
      checkboxSelection: (params) => {
        return params.data?.status !== "loaded"
      },
      maxWidth: 48,
      pinned: "left",
      suppressMovable: true,
      resizable: false,
      headerName: "",
    },
    { field: "no", headerName: "No.", maxWidth: 60 },
    { field: "order_no", headerName: "Order No", maxWidth: 160 },
    {
      field: "status",
      headerName: "Status",
      maxWidth: 110,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <StatusBadge status={params.value} />
        </div>
      ),
    },
    {
      headerName: "Actions",
      pinned: "right",
      headerClass: "header-center",
      cellStyle: { textAlign: "center" },
      field: "ID",
      maxWidth: 80,
      cellRenderer: (params: any) => {
        const status = params.data?.status?.toLowerCase();
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
                className="w-52"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* View / Edit */}
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

                {/* Print SPK */}
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    HandlePreviewPDF(params.data);
                  }}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print SPK
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Mark as Loaded - hanya tampil jika status open */}
                {status === "open" && (
                  <DropdownMenuItem
                    className="cursor-pointer text-green-600 focus:text-green-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateStatusSingle(params.data.order_no, "loaded");
                    }}
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    Mark as Loaded
                  </DropdownMenuItem>
                )}

                {/* Reopen - hanya tampil jika status loaded */}
                {status === "loaded"  && userRedux.roles.some((role) => role.name === "SUPERADMIN") && (
                  <DropdownMenuItem
                    className="cursor-pointer text-blue-600 focus:text-blue-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateStatusSingle(params.data.order_no, "open");
                    }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reopen
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
    {
      field: "order_date",
      headerName: "Order Date",
      width: 130,
      valueFormatter: (params: any) => {
        if (!params.value) return "";
        const date = new Date(params.value);
        return date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      },
    },
    { field: "transporter_name", headerName: "Transporter", maxWidth: 250 },
    { field: "truck_no", headerName: "Truck No", maxWidth: 120 },
    { field: "driver", headerName: "Driver", maxWidth: 120 },
    { field: "order_type", headerName: "Order Type", maxWidth: 150 },
    {
      field: "total_do",
      headerName: "Total DO",
      maxWidth: 100,
      cellStyle: { textAlign: "center" },
    },
    {
      field: "total_drop",
      headerName: "Total Drop",
      maxWidth: 100,
      cellStyle: { textAlign: "center" },
    },
    {
      field: "total_koli",
      headerName: "Total Koli",
      maxWidth: 100,
      cellStyle: { textAlign: "center" },
    },
    {
      field: "total_item",
      headerName: "Total Item",
      maxWidth: 100,
      cellStyle: { textAlign: "center" },
    },
    {
      field: "total_qty",
      headerName: "Total Qty",
      maxWidth: 100,
      cellStyle: { textAlign: "center" },
    },
    {
      field: "total_cbm",
      headerName: "Total CBM",
      maxWidth: 100,
      cellStyle: { textAlign: "center" },
    },
  ]);

  const [quickFilterText, setQuickFilterText] = useState<string>();
  const onFilterTextBoxChanged = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
      setQuickFilterText(value),
    []
  );

  const hasSelected = selectedRows.length > 0;

  return (
    <>
      <div style={{ width: "100%", height: "510px" }}>
        <div className="flex items-center justify-between pb-4">
          {/* Left: Add + Bulk Actions */}
          <div className="flex items-center gap-2">
            <Button
              className="h-8 bg-green-500 text-slate-950 outline-green-600"
              onClick={() => {
                router.push("/wms/outbound/order-spk/add");
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>

            {/* Bulk action buttons - muncul jika ada baris terpilih */}
            {hasSelected && (
              <>
                <div className="h-5 w-px bg-gray-300 mx-1" />
                <span className="text-xs text-gray-500 mr-1">
                  {selectedRows.length} selected
                </span>
                <Button
                  className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  onClick={() => handleBulkUpdateStatus("loaded")}
                >
                  <Truck className="mr-1 h-3.5 w-3.5" />
                  Mark as Loaded
                </Button>
                <Button
                  variant="outline"
                  className="h-8 text-xs border-blue-400 text-blue-600 hover:bg-blue-50"
                  onClick={() => handleBulkUpdateStatus("open")}
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Reopen
                </Button>
              </>
            )}
          </div>

          {/* Right: Search */}
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
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          quickFilterText={quickFilterText}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 25, 50]}
          domLayout="autoHeight"
          rowSelection="multiple"
          suppressRowClickSelection={true}
          isRowSelectable={(params) => params.data.status !== "loaded"}
          onSelectionChanged={(e) => {
            const selected = e.api.getSelectedRows();
            setSelectedRows(selected);
          }}
        />
      </div>
      <ScannedItemDialog />
    </>
  );
};

export default OrderTable;