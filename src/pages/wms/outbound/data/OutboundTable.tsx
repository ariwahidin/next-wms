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
  Forklift,
  CheckCheck,
  CheckCircle2,
  Package,
  Package2,
  Blocks,
  X,
  Copy,
  RefreshCcw,
} from "lucide-react";
import useSWR, { mutate } from "swr";
import {
  ChangeEvent,
  useCallback,
  useState,
  useMemo,
  useRef,
  use,
  useEffect,
} from "react";
import styles from "./OutboundTable.module.css";
import router, { useRouter } from "next/router";
import { useAlert } from "@/contexts/AlertContext";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { emit } from "process";
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
import { stat } from "fs";

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
  console.log("Edit ID:", item.outbound_no);
  router.push(`/wms/outbound/edit/${item.outbound_no}`);
  // window.location.href = `/wms/outbound/edit/${item.outbound_no}`;
};
const HandleCopy = (item: any) => {
  console.log("Copy ID:", item.outbound_no);
  router.push(`/wms/outbound/copy/${item.outbound_no}`);
  // window.location.href = `/wms/outbound/edit/${item.outbound_no}`;
};

const HandleDelete = (id: number) => {
  try {
    api.delete(`/outbound/${id}`, { withCredentials: true }).then((res) => {
      if (res.data.success === true) {
        // mutate("/inbound/detail/draft"); // 🔥 Auto-refresh tabel tanpa reload halaman
      }
    });
  } catch (error) {
    console.error("Gagal menghapus produk:", error);
  }
};

const HandlePreviewPDF = (id: number) => {
  console.log("Preview PDF ID:", id);
  // window.open(`/wms/outbound/picking-sheet/${id}`, "_blank");

  const printWindow = window.open(
    `/wms/outbound/picking-sheet/${id}`,
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

const HandlePrintSerial = (outbound_no: string) => {
  console.log("Print Serial ID:", outbound_no);
  // window.open(`/wms/outbound/sn-sheet/${outbound_no}`, "_blank");

  const printWindow = window.open(
    `/wms/outbound/sn-sheet/${outbound_no}`,
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

const HandlePrintWaranty = (outbound_no: string) => {
  window.open(`/wms/outbound/waranty/${outbound_no}`, "_blank");

  // const printWindow = window.open(
  //   `/wms/outbound/waranty/${outbound_no}`,
  //   "_blank"
  // );
  // if (printWindow) {
  //   // printWindow.document.write(printContent);
  //   printWindow.document.close();

  //   // Wait for images to load before printing
  //   setTimeout(() => {
  //     printWindow.print();
  //     printWindow.close();
  //   }, 1000);
  // }
};

const OutboundTable = () => {
  const { data: rowData, error, mutate } = useSWR("/outbound", fetcher);
  const { showAlert, notify } = useAlert();
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  // Dialog states
  const [isScannedItemDialog, setIsScannedItemDialog] = useState(false);
  const [scannedItemData, setScannedItemData] = useState<any>(null);
  const [tempLocationName, setTempLocationName] = useState("");
  const [showTempLocationInput, setShowTempLocationInput] = useState(false);
  const [changeStatus, setChangeStatus] = useState("open");

  const HandlePicking = (id: number) => {
    showAlert(
      "Picking Confirmation",
      "The picking process is carried out by the system, are you sure to continue?",
      "error",
      () => {
        eventBus.emit("loading", true);
        api
          .post(
            `/outbound/picking/${id}`,
            { inbound_id: id },
            { withCredentials: true }
          )
          .then((res) => {
            eventBus.emit("loading", false);
            if (res.data.success) {
              eventBus.emit("showAlert", {
                title: "Success!",
                description: res.data.message,
                type: "success",
              });
              mutate("/outbound");
            }
          })
          .catch((error) => {
            eventBus.emit("loading", false);
            console.error("Error saving inbound:", error);
            // alert("Gagal menyimpan inbound");
          });
      }
    );
  };

  const HandlePickingComplete = (id: number) => {
    showAlert(
      "Picking Complete Confirmation",
      "Are you sure you want to save this data?",
      "error",
      () => {
        eventBus.emit("loading", true);
        api
          .post(
            `/outbound/picking/complete/${id}`,
            { outbound_id: id },
            { withCredentials: true }
          )
          .then((res) => {
            eventBus.emit("loading", false);
            if (res.data.success) {
              eventBus.emit("showAlert", {
                title: "Success!",
                description: res.data.message,
                type: "success",
              });
              mutate("/outbound");
            }
          })
          .catch((error) => {
            eventBus.emit("loading", false);
            console.error("Error saving inbound:", error);
            // alert("Gagal menyimpan inbound");
          });
      }
    );
  };

  // Handle open untuk single row dari dropdown action
  const handleOpenSingle = (rowData: any, status: string) => {
    console.log("handleOpenSingle", rowData);
    setChangeStatus(status);

    try {
      eventBus.emit("loading", true);
      api
        .post("/outbound/open", { outbound_no: rowData.outbound_no, status : status })
        .then((response) => {
          eventBus.emit("loading", false);
          if (response.data.success) {
            // notify("Success", response.data.message, "success");
            // mutate("/outbound");
            setScannedItemData({
              outbound_no: rowData.outbound_no,
              scanned_items: rowData.scanned_items || [],
            });
            setIsScannedItemDialog(true);
          } else {
            // notify("Error", response.data.message, "error");
          }
        })
        .catch((error) => {
          console.error("Error open outbound:", error);
        });
    } catch (error) {
      eventBus.emit("loading", false);
      console.error("Error open outbound:", error);
    }
  };

  // Handle pilihan user untuk item yang sudah di-scan
  const handleScannedItemChoice = (choice: string) => {
    if (choice === "temp_location") {
      setShowTempLocationInput(true);
    } else if (choice === "return_to_rack") {
      processScannedItems("return_to_rack");
    }
  };

  // Process pilihan user
  const processScannedItems = useCallback(
    (action: string, locationName: string | null = null) => {
      const payload = {
        outbound_no: scannedItemData?.outbound_no,
        action: action,
        temp_location_name: locationName,
        status : changeStatus
      };

      eventBus.emit("loading", true);
      api
        .post("/outbound/open/process", payload, { withCredentials: true })
        .then((response) => {
          eventBus.emit("loading", false);
          if (response.data.success) {
            notify("Success", response.data.message, "success");
            mutate("/outbound");
            closeScannedItemDialog();
          } else {
            // notify("Error", response.data.message, "error");
          }
        })
        .catch((error) => {
          eventBus.emit("loading", false);
          console.error("Error handling scanned items:", error);
          // notify("Error", "Terjadi kesalahan saat memproses item", "error");
        });
    },
    [scannedItemData?.outbound_no, notify, mutate]
  );

  // Handle input change dengan ref untuk menghindari re-render
  const inputRef = useRef<HTMLInputElement>(null);

  // Submit temp location tanpa dependency tempLocationName
  const handleTempLocationSubmit = useCallback(() => {
    const currentValue = inputRef.current?.value || tempLocationName;
    console.log("tempLocationName:", currentValue);

    if (!currentValue.trim()) {
      notify("Error", "Temporary location name is required", "error");
      return;
    }
    processScannedItems("temp_location", currentValue.trim());
  }, [processScannedItems, notify, tempLocationName]);

  // Close dialog dan reset state
  const closeScannedItemDialog = useCallback(() => {
    setIsScannedItemDialog(false);
    setScannedItemData(null);
    setTempLocationName("");
    setShowTempLocationInput(false);
  }, []);

  // Handle back button
  const handleBackToChoice = useCallback(() => {
    setShowTempLocationInput(false);
  }, []);

  useEffect(() => {
    if (!isScannedItemDialog) {
      document.body.style.removeProperty("pointer-events");
    }
  }, [isScannedItemDialog]);

  // Simplest approach - no complex memoization
  const ScannedItemDialog = () => (
    <Dialog open={isScannedItemDialog} onOpenChange={closeScannedItemDialog}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Confirm to {changeStatus} this transaction</DialogTitle>
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

  const [columnDefs, setColumnDefs] = useState<ColDef[]>([
    { field: "no", headerName: "No. ", maxWidth: 70 },
    { field: "outbound_no", headerName: "Picking No", maxWidth: 140 },
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
                    HandleEdit(params.data);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  View / Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    HandleCopy(params.data);
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </DropdownMenuItem>

                {/* Mark as Open - untuk status yang bukan open */}

                {/* Conditional Actions based on status */}
                {params.data.status === "open" && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      HandlePicking(params.data.ID);
                    }}
                  >
                    <Blocks className="mr-2 h-4 w-4" />
                    Picking
                  </DropdownMenuItem>
                )}

                {params.data.status === "picking" && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      HandlePickingComplete(params.data.ID);
                    }}
                  >
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Complete Picking
                  </DropdownMenuItem>
                )}

                {params.data.status !== "open" && params.data.status !== "cancel" && (
                  <>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        HandlePreviewPDF(params.data.ID);
                      }}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print Picking Sheet
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        HandlePrintSerial(params.data.outbound_no);
                      }}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print Serial Number
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        HandlePrintWaranty(params.data.outbound_no);
                      }}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print Label Waranty
                    </DropdownMenuItem>
                  </>
                )}

                {params.data.status !== "open" && params.data.status !== "cancel" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenSingle(params.data, 'open');
                      }}
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Change to Open
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenSingle(params.data, 'cancel');
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
    {
      field: "outbound_date",
      headerName: "Outbound Date",
      width: 140,
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
    { field: "shipment_id", headerName: "DO No", width: 120 },
    { field: "order_no", headerName: "SPK No.", width: 150 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      cellRenderer: (params: any) => {
        if (!params.value) return null;

        let color = "bg-gray-500";
        switch (params.value.toLowerCase()) {
          case "open":
            color = "bg-blue-500 text-white";
            break;
          case "picking":
            color = "bg-yellow-500 text-black";
            break;
          case "completed":
            color = "bg-green-500";
            break;
          case "cancel":
            color = "bg-red-500";
            break;
        }

        return <Badge className={`${color} capitalize`}>{params.value}</Badge>;
      },
    },
    { field: "customer_code", headerName: "Customer Code", width: 140 },
    { field: "customer_name", headerName: "Customer Name", width: 320 },
    { field: "total_item", headerName: "Total Item", width: 100 },
    { field: "qty_req", headerName: "Qty Req", width: 100 },
    { field: "qty_plan", headerName: "Qty Pick", width: 100 },
    { field: "qty_pack", headerName: "Qty Scan", width: 100 },
  ]);

  const [quickFilterText, setQuickFilterText] = useState<string>();
  const onFilterTextBoxChanged = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
      setQuickFilterText(value),
    []
  );

  useEffect(() => {
    console.log("isScannedItemDialog", isScannedItemDialog);
    if (!isScannedItemDialog) {
      setScannedItemData(null);
      setTempLocationName("");
    }
  }, [isScannedItemDialog]);

  return (
    <>
      <div style={{ width: "100%", height: "510px" }}>
        <div className="flex items-center justify-between pb-4">
          <div className="justify-self-start">
            <div className="flex items-center">
              <Button
                onClick={() => {
                  router.push("/wms/outbound/add");
                }}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
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
          rowSelection={undefined}
        />
      </div>
      <ScannedItemDialog />
    </>
  );
};

export default OutboundTable;
