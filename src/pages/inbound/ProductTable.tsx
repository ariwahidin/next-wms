/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, ColDef } from "ag-grid-community";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import useSWR, { mutate } from "swr";
import { ChangeEvent, useCallback, useState } from "react";
import styles from "./ProductTable.module.css";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import router from "next/router";

ModuleRegistry.registerModules([AllCommunityModule]);

const fetcher = (url: string) =>
  api.get(url, { withCredentials: true }).then((res) => {
    if (res.data.success && res.data.data.details) {
      return res.data.data.details.map((item: any, key: number) => ({
        ...item,
        no: key + 1,
        edit: true,
      }));
    }
    return [];
  });

const ProductTable = ({
  formHeader,
  setFormHeader,
  formItem,
  setFormItem,
  setEditData,
  editMode,
  id,
}: {
  formHeader: any;
  setFormHeader: any;
  formItem: any;
  setFormItem: any;
  setEditData: any;
  editMode: boolean;
  id: number;
}) => {
  console.log(formHeader, formItem);

  const url = "/inbound/" + formHeader?.inbound_id;
  const { data: rowData, error, mutate } = useSWR(url, fetcher);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([
    { field: "no", headerName: "No. ", maxWidth: 60 },
    { field: "rec_date", headerName: "Rec Date", width: 120 },
    { field: "item_code", headerName: "Item Code", width: 120 },
    { field: "location", headerName: "Location", width: 120 },
    { field: "item_name", headerName: "Item Name", width: 120 },
    { field: "barcode", headerName: "GMC", width: 110 },
    { field: "whs_code", headerName: "Whs Code", width: 120 },
    { field: "remarks", headerName: "Remarks", width: 120 },
    { field: "quantity", headerName: "Qty", width: 80 },
    { field: "handling_used", headerName: "Handling", width: 140 },
    { field: "total_vas", headerName: "VAS", width: 140 },
    {
      headerName: "Actions",
      field: "ID",
      pinned: "right",
      headerClass: "header-center",
      width: 100,
      cellRenderer: (params) => {
        return (
          <div style={{ textAlign: "center" }}>
            <Button
              onClick={() => {
                setFormItem(params.data);
                // setEditData(params.data);
                // console.log(params.data);
              }}
              variant="ghost"
              size="icon"
              className="h-8 w-8 mr-2 bg-green-500 text-white hover:bg-green-600"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => HandleDelete(params.data.inbound_detail_id)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 mr-2 bg-red-500 text-white hover:bg-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ]);

  const [quickFilterText, setQuickFilterText] = useState<string>();
  const onFilterTextBoxChanged = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
      setQuickFilterText(value),
    []
  );

  const HandleDelete = (id: number) => {
    try {
      api
        .delete(`/inbound/detail/${id}`, { withCredentials: true })
        .then((res) => {
          if (res.data.success === true) {
            mutate("/inbound/" + formHeader?.inbound_id);
          }
        });
    } catch (error) {
      console.error("Gagal menghapus produk:", error);
    }
  };

  

  return (
    <Card>
      <CardTitle></CardTitle>
      <CardContent className="pt-5">
        <div
          style={{ height: "500px", overflow: "auto", marginBottom: "1rem" }}
        >
          <div className="justify-self-end">
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
          <AgGridReact
            domLayout="autoHeight"
            headerHeight={35}
            rowHeight={35}
            alwaysShowVerticalScroll={true} // Paksa scrollbar vertikal selalu muncul
            suppressHorizontalScroll={true} // Cegah horizontal scrollbar
            rowData={rowData}
            columnDefs={columnDefs}
            quickFilterText={quickFilterText}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductTable;
