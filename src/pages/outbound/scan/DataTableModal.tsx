/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useRef, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AgGridReact } from "ag-grid-react";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import api from "@/lib/api";
import { Trash2 } from "lucide-react";
import { ChangeEvent, useCallback } from "react";
import styles from "./BarcodeTable.module.css";
import { emit } from "process";
import eventBus from "@/utils/eventBus";

type AgGridModalProps = {
  data?: any;
  modalIsOpen: boolean;
  setModalIsOpen: (open: boolean) => void;
};

const TestButton = () => {
  const testFunction = () => {
    console.log("function test di render");
  };

  console.log("Komponen Button test di render");
  return (
    <div>
      <Button onClick={testFunction}>Test</Button>
    </div>
  );
};

const AgGridModal = ({
  data,
  modalIsOpen,
  setModalIsOpen,
}: AgGridModalProps) => {
  const gridRef = useRef<AgGridReact>(null);

  console.log("Data Modal :", data);

  const [rowData, setRowData] = useState<any[]>([]);

  const [quickFilterText, setQuickFilterText] = useState<string>();
  const onFilterTextBoxChanged = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
      setQuickFilterText(value),
    []
  );

  const getDataBarcode = async (
    inbound_id: number,
    inbound_detail_id: number
  ) => {
    api
      .get(
        "/rf/inbound/detail/barcode/" + inbound_id + "/" + inbound_detail_id,
        { withCredentials: true }
      )
      .then((res) => {
        if (res.data.success) {
          console.log("Data Modal SSS :", res.data.data.detail);
          if (res.data.data.detail) {
            setRowData(res.data.data.detail);
          } else {
            setRowData([]);
          }
        }
      });
  };

  const handleDelete = async (actionType: string) => {
    const selectedIds = selectedRows.map((row) => row.id);
    if (selectedIds.length === 0) return;

    console.log(selectedIds);

    api
      .post(
        "/rf/inbound/barcode/delete",
        {
          selected_ids: selectedIds,
          action_type: actionType,
        },
        { withCredentials: true }
      )
      .then((res) => {
        if (res.data.success) {
          getDataBarcode(data.inbound_id, data.inbound_detail_id);
          eventBus.emit("showAlert", {
            title: "Success!",
            description: res.data.message,
            type: "success",
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
    // try {
    //   api
    //     .delete(`rf/inbound/detail/scanned/${id}`, { withCredentials: true })
    //     .then((res) => {
    //       if (res.data.success === true) {
    //         getDataBarcode(data.inbound_id, data.inbound_detail_id);
    //       }
    //     });
    // } catch (error) {
    //   console.error("Gagal menghapus produk:", error);
    // }
  };

  useEffect(() => {
    if (!data) return;
    getDataBarcode(data.inbound_id, data.inbound_detail_id);
  }, [data]);

  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  const columnDefs = useMemo(
    () => [
      // {
      //   headerCheckboxSelection: true,
      //   checkboxSelection: true,
      //   width: 50,
      // },
      {
        headerCheckboxSelection: true,
        checkboxSelection: (params) => {
          // Return false if status is "in_stock", true otherwise
          return params.data.status !== "in_stock";
        },
        width: 50,
      },
      {
        headerName: "No.",
        maxWidth: 60,
        valueGetter: (params) => params.node?.rowIndex + 1, // Gunakan node.rowIndex
      },
      { field: "status", headerName: "Status", width: 100 },

      { field: "item_code", headerName: "Item Code", width: 120 },
      { field: "quantity", headerName: "Qty", width: 70 },
      { field: "bracode", headerName: "Barcode", width: 120 },
      { field: "serial_number", headerName: "Serial Number", width: 140 },
      { field: "item_name", headerName: "Item Name", width: 140 },

      { field: "location", headerName: "Location", width: 110 },

      { field: "inbound_no", headerName: "Inbound No", width: 140 },

      // {
      //   headerName: "Actions",
      //   field: "ID",
      //   width: 100,
      //   cellRenderer: (params) => {
      //     return (
      //       <div>
      //         <Button
      //           onClick={() => HandleDelete(params.data.id)}
      //           variant="ghost"
      //           size="icon"
      //           className="h-8 w-8"
      //         >
      //           <Trash2 className="h-4 w-4" />
      //         </Button>
      //       </div>
      //     );
      //   },
      // },
    ],
    []
  );

  // Handle perubahan checkbox
  const onSelectionChanged = useCallback((event: any) => {
    setSelectedRows(event.api.getSelectedRows());
  }, []);

  // Kirim data ke backend
  const handleAction = async (actionType: string) => {
    const selectedIds = selectedRows.map((row) => row.id);
    if (selectedIds.length === 0) return;

    console.log(selectedIds);

    api
      .post(
        "/rf/inbound/confirm/putaway",
        {
          selected_ids: selectedIds,
          action_type: actionType,
        },
        { withCredentials: true }
      )
      .then((res) => {
        if (res.data.success) {
          getDataBarcode(data.inbound_id, data.inbound_detail_id);
          eventBus.emit("showAlert", {
            title: "Success!",
            description: res.data.message,
            type: "success",
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <Dialog open={modalIsOpen} onOpenChange={setModalIsOpen}>
      <DialogTitle></DialogTitle>
      <DialogDescription></DialogDescription>
      <DialogContent className="max-w-4xl bg-white">
        <div
          className="ag-theme-alpine"
          style={{ height: 300, width: "100%", overflow: "auto" }}
        >
          <div className="justify-self-start">
            <div
              className={styles.inputWrapper}
              style={{ marginBottom: "1rem" }}
            >
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

          {/* Tombol Aksi */}
          {selectedRows.length > 0 && (
            <div className="mb-4 flex gap-2">
              <Button
                onClick={() => handleDelete("delete")}
                variant="destructive"
              >
                Delete
              </Button>
              <Button onClick={() => handleAction("complete")}>
                Confirm Putaway
              </Button>
            </div>
          )}
          <AgGridReact
            domLayout="autoHeight"
            headerHeight={35}
            rowHeight={35}
            onRowClicked={(e) => console.log(e)}
            ref={gridRef}
            columnDefs={columnDefs}
            rowData={rowData}
            suppressHorizontalScroll={true}
            quickFilterText={quickFilterText}
            rowSelection="multiple"
            onSelectionChanged={onSelectionChanged}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgGridModal;
