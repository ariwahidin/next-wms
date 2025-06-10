/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, ColDef } from "ag-grid-community";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Check,
  CheckCheck,
  CheckCircle2,
  CheckSquareIcon,
  Forklift,
  Hand,
  HandIcon,
  Pencil,
  Printer,
  Trash2,
} from "lucide-react";
import useSWR, { mutate } from "swr";
import { ChangeEvent, useCallback, useState } from "react";
import styles from "./InboundTable.module.css";
import router, { useRouter } from "next/router";
import { useAlert } from "@/contexts/AlertContext";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { emit } from "process";
import eventBus from "@/utils/eventBus";

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
  window.location.href = `/outbound/edit-manual/${item.outbound_no}`;
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
  window.open(`/outbound/print/picking_sheet/${id}`, "_blank");
  // router.push(`/outbound/print/picking_sheet/${id}`);
};

// const handleCompletePicking = async (id: number) => {
//   console.log("Complete Picking ID:", id);

//   try {
//     const response = await api.post(
//       `/outbound/picking/complete/${id}`,
//       { outbound_id: id },
//       { withCredentials: true }
//     );

//     console.log("Response Object:", response); // Debugging

//     const data = await response.data;

//     if (data.success) {
//       eventBus.emit("showAlert", {
//         title: "Success!",
//         description: data.message,
//         type: "success",
//       });

//       setTimeout(() => {
//         window.location.href = "/outbound/list";
//       }, 500);
//     }

//     return data;
//   } catch (error) {
//     console.error("Error saving inbound:", error);
//   }
// };

const OutboundTable = ({ setEditData }) => {
  const { data: rowData, error, mutate } = useSWR("/outbound", fetcher);

  const { showAlert, notify } = useAlert();

  const HandlePicking = (id: number) => {
    showAlert(
      "Picking Confirmation",
      "Are you sure you want to save this data?",
      "error",
      () => {
        console.log(id);
        api
          .post(
            `/outbound/picking/${id}`,
            { inbound_id: id },
            { withCredentials: true }
          )
          .then((res) => {
            if (res.data.success) {
              eventBus.emit("showAlert", {
                title: "Success!",
                description: res.data.message,
                type: "success",
              });

              // reload data
              mutate("/outbound");
            }
          })
          .catch((error) => {
            console.error("Error saving inbound:", error);
            alert("Gagal menyimpan inbound");
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
        api
          .post(
            `/outbound/picking/complete/${id}`,
            { outbound_id: id },
            { withCredentials: true }
          )
          .then((res) => {
            if (res.data.success) {
              eventBus.emit("showAlert", {
                title: "Success!",
                description: res.data.message,
                type: "success",
              });

              // reload data
              mutate("/outbound");
            }
          })
          .catch((error) => {
            console.error("Error saving inbound:", error);
            alert("Gagal menyimpan inbound");
          });
      }
    );
  };

  const [columnDefs, setColumnDefs] = useState<ColDef[]>([
    { field: "no", headerName: "No. ", maxWidth: 70 },
    {
      headerName: "Actions",
      pinned: "right",
      headerClass: "header-center",
      cellStyle: { textAlign: "center" },
      field: "ID",
      maxWidth: 160,
      cellRenderer: (params) => {
        return (
          <div className="flex justify-center space-x-1 pt-2">
            {params.data.status === "open" && (
              <Button
                onClick={() => HandlePicking(params.data.ID)}
                variant="ghost"
                size="icon"
                className="h-6 w-6 mr-2 bg-green-200 text-black hover:bg-green-600"
                title="Picking"
              >
                <Forklift className="h-4 w-4" />
              </Button>
            )}

            {params.data.status === "picking" && (
              <>
                <Button
                  onClick={() => HandlePickingComplete(params.data.ID)}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 mr-2 bg-blue-500 text-white hover:bg-blue-600"
                  title="Complete Picking"
                >
                  <CheckCheck className="h-4 w-4" />
                </Button>
              </>
            )}

            {params.data.status != "open" && (
              <>
                <Button
                  onClick={() => HandlePreviewPDF(params.data.ID)}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 mr-2 bg-blue-100 text-black hover:bg-blue-200"
                  title="Print Picking Sheet"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </>
            )}

            <Button
              title="View or Edit"
              onClick={() => HandleEdit(params.data)}
              variant="ghost"
              size="icon"
              className="h-6 w-6 mr-2 bg-green-500 text-white hover:bg-green-600"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
    {
      field: "outbound_date",
      headerName: "Outbound Date",
      width: 140,
      valueFormatter: (params) => {
        if (!params.value) return ""; // Mencegah error jika null atau undefined
        const date = new Date(params.value);
        return date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      },
    },
    { field: "outbound_no", headerName: "Outbound No", width: 170 },
    { field: "delivery_no", headerName: "Delivery No", width: 170 },
    // { field: "status", headerName: "Status", width: 100 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      cellRenderer: (params) => {
        if (!params.value) return null;

        let color = "bg-gray-500"; // Default warna abu-abu
        switch (params.value.toLowerCase()) {
          case "open":
            color = "bg-blue-500 text-white"; // Biru]"; // Kuning
            break;
          case "picking":
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
    { field: "customer_code", headerName: "Customer Code", width: 140 },
    { field: "customer_name", headerName: "Customer Name", width: 180 },
    { field: "total_item", headerName: "Total Item", width: 100 },
    { field: "qty_req", headerName: "Qty Req", width: 100 },
    { field: "qty_plan", headerName: "Qty Pick", width: 100 },
    { field: "qty_pack", headerName: "Qty Pack", width: 100 },
    // { field: "total_line", headerName: "Total Line", width: 100 },
    // { field: "total_qty_req", headerName: "Req Qty", width: 100 },
    // { field: "plan_pick", headerName: "Plan Pick", width: 100 },
    // { field: "picked_qty", headerName: "Picked Qty", width: 100 },
  ]);

  const [quickFilterText, setQuickFilterText] = useState<string>();
  const onFilterTextBoxChanged = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
      setQuickFilterText(value),
    []
  );

  return (
    <div style={{ width: "100%", height: "510px" }}>
      <div className="justify-self-end">
        <div className={styles.inputWrapper} style={{ marginBottom: "1rem" }}>
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
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        quickFilterText={quickFilterText}
        pagination={true} // Mengaktifkan pagination
        paginationPageSize={10} // Set jumlah data per halaman
        paginationPageSizeSelector={[10, 25, 50]} // Opsional: Dropdown pilihan page size
        domLayout="autoHeight"
      />
    </div>
  );
};

export default OutboundTable;
