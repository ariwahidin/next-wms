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
  CheckCircle2Icon,
  CheckSquareIcon,
  FireExtinguisher,
  Forklift,
  ForkliftIcon,
  LucideForklift,
  Pencil,
  Printer,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import useSWR, { mutate } from "swr";
import { ChangeEvent, useCallback, useState } from "react";
import styles from "./InboundTable.module.css";
import { useAlert } from "@/contexts/AlertContext";
import { useRouter } from "next/router";
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

const InboundTable = ({ setEditData }) => {
  const { data: rowData, error, mutate } = useSWR("/inbound", fetcher);
  const { showAlert, notify } = useAlert();
  const router = useRouter();

  const HandleEdit = (no : string) => {
    router.push(`/inbound/edit-manual/${no}`);
  };

  const HandleComplete = (id: number) => {
    showAlert(
      "Confirm Putaway",
      "Are you sure you want to save this data?",
      "error",
      async () => {
        const response = await api.post(
          `/inbound/complete/${id}`,
          { inbound_id: id },
          { withCredentials: true }
        );

        if (response.data.success) {
          eventBus.emit("showAlert", {
            title: "Success!",
            description: "berhassss",
            type: "success",
          });

          // reload data
          mutate("/inbound");
        }
      }
    );
  };

  const HandlePreviewPDF = (id: number) => {
    window.open(`/inbound/putaway-sheet/${id}`, "_blank");
    // router.push(`/inbound/putaway-sheet/${id}`);
  };

  const [columnDefs] = useState<ColDef[]>([
    { field: "no", headerName: "No. ", maxWidth: 70 },
    {
      headerName: "Actions",
      pinned: "right",
      headerClass: "header-center",
      width: 200,
      field: "ID",
      cellRenderer: (params) => {
        return (
          <div style={{ textAlign: "center" }}>
            {params.data.status === "open" && (
              <Button
                title="Confirm Putaway"
                onClick={() => HandleComplete(params.data.id)}
                variant="ghost"
                size="icon"
                className="h-8 w-8 mr-2  bg-blue-500 text-white hover:bg-blue-600"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}

            <Button
              title="View or Edit"
              onClick={() => HandleEdit(params.data.inbound_no)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 mr-2 bg-green-500 text-white hover:bg-green-600"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              title="Print Putaway Slip"
              onClick={() => HandlePreviewPDF(params.data.id)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 mr-2 bg-green-100 text-black hover:bg-green-600"
            >
              <Printer className="h-4 w-4" />
            </Button>
            <Button
              title="Delete or Cancel"
              onClick={() => HandleDelete(params.data.id)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-red-500 text-white hover:bg-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
    { field: "inbound_date", headerName: "Date", width: 120 },
    { field: "inbound_no", headerName: "Inbound No.", width: 170 },
    { field: "po_number", headerName: "PO Number", width: 150 },
    { field: "supplier_name", headerName: "Supplier" },
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
    { field: "total_line", headerName: "Total Line", width: 100 },
    { field: "total_qty", headerName: "Total Qty", width: 100 },
    { field: "qty_scan", headerName: "Scan Qty", width: 100 },
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

export default InboundTable;

// ===============================================================================================================================================

