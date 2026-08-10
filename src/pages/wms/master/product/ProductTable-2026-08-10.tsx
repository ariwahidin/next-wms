

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, ColDef } from "ag-grid-community";
import api from "@/lib/api";
import { Download, Pencil, Plus, Trash2, Upload } from "lucide-react";
import useSWR, { mutate } from "swr";
import { ChangeEvent, useCallback, useRef, useState } from "react";
import styles from "./ProductTable.module.css";
import { Button } from "@/components/ui/button";
import ProductForm from "./ProductForm";
import router from "next/router";
import ExportProductModal from "./ExportProductModal";

ModuleRegistry.registerModules([AllCommunityModule]);

const fetcher = (url: string) =>
  api.get(url).then((res) => {
    if (res.data.success) {
      return res.data.data.map((item: any, key: number) => ({
        ...item,
        no: key + 1,
      }));
    }
    return [];
  });

const ProductTable = () => {
  const { data: rowData, error, mutate: revalidate } = useSWR("/products", fetcher);
  const [editData, setEditData] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Prevent double-click on action buttons
  const deletingRef = useRef<Set<number>>(new Set());

  const handleAdd = () => {
    setEditData(null);
    setIsOpen(true);
  };

  const handleEdit = useCallback((data: any) => {
    setEditData(data);
    setIsOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (deletingRef.current.has(id)) return; // Already deleting
    if (!confirm("Are you sure you want to delete this product?")) return;

    deletingRef.current.add(id);
    try {
      const res = await api.delete(`/products/${id}`, { withCredentials: true });
      if (res.data.success) {
        revalidate();
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || "Failed to delete product");
    } finally {
      deletingRef.current.delete(id);
    }
  }, [revalidate]);

  const [columnDefs] = useState<ColDef[]>([
    { field: "no", headerName: "No.", maxWidth: 65, sortable: false, filter: false },
    { field: "owner_code", headerName: "Owner", width: 100 },
    { field: "item_code", headerName: "Item Code (SKU)", width: 150 },
    { field: "item_name", headerName: "Item Name", width: 280 },
    { field: "unit_model", headerName: "Unit Model", width: 140 },
    { field: "barcode", headerName: "EAN", width: 140 },
    { field: "uom", headerName: "UoM", width: 80 },
    { field: "group", headerName: "Group", width: 120 },
    { field: "category", headerName: "Category", width: 120 },
    { field: "width", headerName: "W (cm)", width: 120 },
    { field: "length", headerName: "L (cm)", width: 120 },
    { field: "height", headerName: "H (cm)", width: 120 },
    { field: "weight", headerName: "Wgt (kg)", width: 120 },
    { field: "qty_per_carton", headerName: "Qty/Carton", width: 120 },
    { field: "cbm", headerName: "CBM", width: 120 },
    { field: "color", headerName: "Color", width: 120 },
    { field: "has_serial", headerName: "SN", width: 65, cellStyle: { textAlign: "center" } },
    { field: "has_waranty", headerName: "Wrnty", width: 80, cellStyle: { textAlign: "center" } },
    { field: "has_adaptor", headerName: "Adpt", width: 75, cellStyle: { textAlign: "center" } },
    { field: "manual_book", headerName: "Manual", width: 85, cellStyle: { textAlign: "center" } },
    { field: "user_def1", headerName: "User Def 1", width: 130 },
    {
      headerName: "Actions",
      field: "ID",
      pinned: "right",
      width: 95,
      sortable: false,
      filter: false,
      editable: false,
      cellStyle: { textAlign: "center" },
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-center gap-1 h-full">
          <Button
            onClick={() => handleEdit(params.data)}
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={() => handleDelete(params.data.ID)}
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-500 hover:text-red-700"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]);

  const [quickFilterText, setQuickFilterText] = useState<string>();
  const onFilterTextBoxChanged = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) => setQuickFilterText(value),
    []
  );

  return (
    <>
      <div style={{ width: "100%" }}>
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <Button className="h-8" onClick={handleAdd}>
              <Plus className="mr-2 w-4" />
              Add Item
            </Button>
            <Button
              className="bg-green-500 text-slate-950 hover:bg-green-600 h-8"
              onClick={() => router.push("/wms/master/product/import-excel")}
            >
              <Upload className="mr-2 w-4" />
              Import Excel
            </Button>
            <Button
              className="bg-blue-500 text-white hover:bg-blue-600 h-8"
              onClick={() => setExportModalOpen(true)}
            >
              <Download className="mr-2 w-4" />
              Export Excel
            </Button>
          </div>

          <div className={styles.inputWrapper}>
            <svg
              className={styles.searchIcon}
              width="16"
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
              placeholder="Search..."
              onInput={onFilterTextBoxChanged}
            />
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
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
            editable: false, // Disable inline editing by default
          }}
        />
      </div>

      <ProductForm
        editData={editData}
        setEditData={setEditData}
        open={isOpen}
        setOpen={setIsOpen}
      />
      <ExportProductModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
      />
    </>
  );
};

export default ProductTable;