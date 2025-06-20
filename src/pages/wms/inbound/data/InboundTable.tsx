/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, ColDef } from "ag-grid-community";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  CheckCheck,
  Pencil,
  Plus,
  Printer,
  Trash2,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import useSWR, { mutate } from "swr";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import styles from "./InboundTable.module.css";
import { useAlert } from "@/contexts/AlertContext";
import { useRouter } from "next/router";
import eventBus from "@/utils/eventBus";
import dayjs from "dayjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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

const HandleDelete = (id: number) => {
  try {
    api.delete(`/inbound/${id}`, { withCredentials: true }).then((res) => {
      if (res.data.success === true) {
      }
    });
  } catch (error) {
    console.error("Gagal menghapus produk:", error);
  }
};

const InboundTable = () => {
  const { data: rowData, error, mutate } = useSWR("/inbound", fetcher);
  const { showAlert, notify } = useAlert();
  const router = useRouter();

  const HandleEdit = (no: string) => {
    router.push(`/wms/inbound/edit/${no}`);
  };

  // const HandleComplete = (id: number) => {
  //   showAlert(
  //     "Inbound Complete Confirmation",
  //     "Are you sure you want to save this data?",
  //     "error",
  //     async () => {
  //       const response = await api.post(
  //         `/inbound/complete/${id}`,
  //         { inbound_id: id },
  //         { withCredentials: true }
  //       );

  //       if (response.data.success) {
  //         eventBus.emit("showAlert", {
  //           title: "Success!",
  //           description: response.data.message,
  //           type: "success",
  //         });

  //         // reload data
  //         mutate("/inbound");
  //       }
  //     }
  //   );
  // };

  const HandlePreviewPDF = (id: number) => {
    window.open(`/wms/inbound/putaway-sheet/${id}`, "_blank");
    // router.push(`/inbound/putaway-sheet/${id}`);
  };

  const [columnDefs] = useState<ColDef[]>([
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      width: 50,
      pinned: "left",
      suppressSizeToFit: true,
    },
    { field: "no", headerName: "No. ", maxWidth: 60 },
    {
      headerName: "Actions",
      pinned: "right",
      headerClass: "header-center",
      width: 150,
      field: "ID",
      cellRenderer: (params) => {
        return (
          <div
            className="flex justify-center space-x-1 pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* {params.data.status === "open" && (
              <Button
                title="Complete Inbound"
                onClick={() => HandleComplete(params.data.id)}
                variant="ghost"
                size="icon"
                className="h-6 w-6 bg-blue-500 text-white hover:bg-blue-600"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )} */}

            <Button
              title="View or Edit"
              onClick={() => HandleEdit(params.data.inbound_no)}
              variant="ghost"
              size="icon"
              className="h-6 w-6 bg-green-500 text-white hover:bg-green-600"
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              title="Print Putaway Slip"
              onClick={() => HandlePreviewPDF(params.data.id)}
              variant="ghost"
              size="icon"
              className="h-6 w-6 bg-green-100 text-black hover:bg-green-600"
            >
              <Printer className="h-4 w-4" />
            </Button>

            <Button
              title="Delete or Cancel"
              onClick={() => HandleDelete(params.data.id)}
              variant="ghost"
              size="icon"
              className="h-6 w-6 bg-red-500 text-white hover:bg-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
    {
      field: "inbound_date",
      headerName: "Date",
      width: 120,
      cellRenderer: (params) => {
        return <div>{dayjs(params.value).format("D MMMM YYYY")}</div>;
      },
    },
    { field: "inbound_no", headerName: "Inbound No.", width: 130 },
    {
      field: "type",
      headerName: "IB Type",
      width: 120,
      cellRenderer: (params) => params.value.toUpperCase(),
    },
    { field: "supplier_name", headerName: "Supplier", width: 250 },
    { field: "invoice", headerName: "Invoice", width: 180 },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      cellRenderer: (params) => {
        if (!params.value) return null;

        let color = "bg-gray-500"; // Default warna abu-abu
        switch (params.value.toLowerCase()) {
          case "open":
            color = "bg-blue-500 text-white"; // Biru]"; // Kuning
            break;
          case "complete":
            color = "bg-yellow-500 text-black";
            break;
          case "completed":
            color = "bg-green-500"; // Hijau
            break;
          case "canceled":
            color = "bg-red-500"; // Merah
            break;
        }

        return <Badge className={`${color} capitalize`}>{params.value}</Badge>;
      },
    },
    { field: "total_line", headerName: "Items", width: 80 },
    { field: "total_qty", headerName: "Request", width: 90 },
    { field: "qty_scan", headerName: "Received", width: 90 },
  ]);

  const [quickFilterText, setQuickFilterText] = useState<string>();
  const onFilterTextBoxChanged = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
      setQuickFilterText(value),
    []
  );

  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [dialogType, setDialogType] = useState<
    "complete" | "cancel" | "checking" | null
  >(null);
  const exportToExcel = () => {
    // contoh dummy
    console.log("Exporting rows:", selectedRows);
    notify("Success", "Export feature not implemented yet!");
  };

  const handleAction = (type: string) => {
    // setDialogType("checking");
    // setIsDialogOpen(true);
    switch (type) {
      case "checking":
        setDialogType("checking");
        setIsDialogOpen(true);
        break;
      case "complete":
        setDialogType("complete");
        setIsDialogOpen(true);
        break;
      case "cancel":
        setDialogType("cancel");
        setIsDialogOpen(true);
        break;
      case "export":
        exportToExcel();
        break;
    }
  };

  const handleChecking = () => {
    // setIsDialogOpen(true);
    console.log("handleChecking");
    console.log(selectedRows);

    for (const row of selectedRows) {
      api
        .post("/inbound/checking", { inbound_no: row.inbound_no })
        .then((response) => {
          if (response.data.success) {
            notify("Success", response.data.message, "success");
            mutate("/inbound");
          } else {
            // notify("Error", response.data.message, "error");
          }
        })
        .catch((error) => {
          console.error("Error checking inbound:", error);
        });
    }
  };
  const handleOpen = () => {
    // setIsDialogOpen(true);
    console.log("handleOpen");
    console.log(selectedRows);

    for (const row of selectedRows) {
      api
        .post("/inbound/open", { inbound_no: row.inbound_no })
        .then((response) => {
          if (response.data.success) {
            notify("Success", response.data.message, "success");
            mutate("/inbound");
          } else {
            // notify("Error", response.data.message, "error");
          }
        })
        .catch((error) => {
          console.error("Error open inbound:", error);
        });
    }
  };

  const handleComplete = () => {
    console.log("handleComplete");
    console.log(selectedRows);

    for (const row of selectedRows) {
      api
        .post("/inbound/complete/" + row.id, { inbound_id: row.id })
        .then((response) => {
          if (response.data.success) {
            notify("Success", response.data.message);
            mutate("/inbound");
          } else {
            // notify("Error", response.data.message, "error");
          }
        })
        .catch((error) => {
          console.error("Error completing inbound:", error);
        });
    }
  };

  useEffect(() => {
    if (!isDialogOpen) {
      setDialogType(null);
    }
  }, [isDialogOpen]);

  return (
    <div style={{ width: "100%", height: "510px" }}>
      <div className="flex items-center justify-between pb-4">
        <div className="justify-self-start">
          <div className="flex items-center">
            {" "}
            <Button
              onClick={() => {
                router.push("/wms/inbound/add");
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
            <Button
              className="ml-2"
              onClick={() => {
                router.push("/wms/inbound/import");
              }}
            >
              <Upload className="mr-1 h-4 w-4" />
              Import
            </Button>
            {selectedRows.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" className="ml-2">
                    Process Selected ({selectedRows.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handleOpen()}
                  >
                    Mark as Open
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handleChecking()}
                  >
                    Mark as Checking
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handleComplete()}
                  >
                    Mark as Complete
                  </DropdownMenuItem>

                  {/* <DropdownMenuItem onClick={() => handleAction("cancel")}>
                    Cancel Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction("export")}>
                    Export to Excel
                  </DropdownMenuItem> */}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="flex items-center">
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
        pagination={true} // Mengaktifkan pagination
        paginationPageSize={10} // Set jumlah data per halaman
        paginationPageSizeSelector={[10, 25, 50]} // Opsional: Dropdown pilihan page size
        domLayout="autoHeight"
        onSelectionChanged={(e) => {
          const selected = e.api.getSelectedRows();
          setSelectedRows(selected);
        }}
        rowSelection="multiple"
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "checking"
                ? "Confirm Checking"
                : "Confirm Cancellation"}
            </DialogTitle>

            <DialogDescription>
              This action will affect {selectedRows.length} selected item(s).
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                // for (const row of selectedRows) {
                //   if (dialogType === "complete") {
                //     await api.post(...);
                //   } else if (dialogType === "cancel") {
                //     await api.post(...);
                //   }
                // }
                console.log(selectedRows);

                setIsDialogOpen(false);
                setSelectedRows([]);
                // mutate("/inbound");
                notify("Success", "Data saved successfully!");
              }}
            >
              Yes, Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InboundTable;
