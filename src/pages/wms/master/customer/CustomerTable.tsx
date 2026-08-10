/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, ColDef } from "ag-grid-community";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Download, Pencil, Plus, SlidersHorizontal, Trash2, Upload, X } from "lucide-react";
import useSWR, { mutate } from "swr";
import { ChangeEvent, useCallback, useMemo, useRef, useState } from "react";
import Select from "react-select";
import styles from "./CustomerTable.module.css";
import router from "next/router";
import ExportExcelModal from "./ExportExcelModal";
import CustomerForm from "./CustomerForm";

ModuleRegistry.registerModules([AllCommunityModule]);

// ─── Types ───────────────────────────────────────────────────────────────────

interface SelectOption {
  value: string;
  label: string;
}

// ─── Fetchers ────────────────────────────────────────────────────────────────

const fetcher = (url: string) =>
  api.get(url, { withCredentials: true }).then((res) => {
    if (res.data.success) {
      return res.data.data.map((item: any, key: number) => ({
        ...item,
        no: key + 1,
        edit: true,
      }));
    }
    return [];
  });

const ownersFetcher = (url: string) =>
  api.get(url, { withCredentials: true }).then((res) => {
    if (res.data.success && res.data.data) {
      return res.data.data.map((o: any) => ({
        value: o.code,
        label: `${o.code} - ${o.description}`,
      }));
    }
    return [];
  });

// ─── react-select shared styles ───────────────────────────────────────────────

const selectStyles = {
  control: (base: any) => ({
    ...base,
    minHeight: 34,
    borderColor: "#e2e8f0",
    boxShadow: "none",
    "&:hover": { borderColor: "#94a3b8" },
  }),
  menu: (base: any) => ({ ...base, zIndex: 50 }),
};

// ─── Filter Bar ──────────────────────────────────────────────────────────────

interface FilterBarProps {
  ownerOptions: SelectOption[];
  ownersLoading: boolean;
  selectedOwner: string;
  onOwnerChange: (v: string) => void;
  onReset: () => void;
}

const FilterBar = ({
  ownerOptions,
  ownersLoading,
  selectedOwner,
  onOwnerChange,
  onReset,
}: FilterBarProps) => {
  const isFiltered = selectedOwner !== "";

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5">
        <SlidersHorizontal className="h-4 w-4 text-slate-500" />
        <span
          className="text-sm font-semibold text-slate-700 tracking-wide uppercase"
          style={{ letterSpacing: "0.06em", fontSize: "0.7rem" }}
        >
          Filter & Search
        </span>
        {isFiltered && (
          <span className="ml-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
            Active
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3 px-4 py-3">
        {/* Owner filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Owner
          </label>
          <Select
            isClearable
            placeholder="All owners"
            className="w-48 text-sm"
            classNamePrefix="rs"
            options={ownerOptions}
            isLoading={ownersLoading}
            value={ownerOptions.find((o) => o.value === selectedOwner) ?? null}
            onChange={(selected) => onOwnerChange(selected ? selected.value : "")}
            styles={selectStyles}
          />
        </div>

        {isFiltered && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-all hover:border-slate-400 hover:text-slate-700"
          >
            <X className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {isFiltered && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            Active:
          </span>
          <span className="flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
            Owner: {selectedOwner}
          </span>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const CustomerTable = () => {
  const { data: rowData, error, mutate: revalidate } = useSWR("/customers", fetcher);
  const { data: ownerOptions, isLoading: ownersLoading } = useSWR("/owners", ownersFetcher);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [selectedOwner, setSelectedOwner] = useState<string>("");

  const deletingRef = useRef<Set<number>>(new Set());

  const handleAdd = () => {
    setEditData(null);
    setIsFormOpen(true);
  };

  const handleEdit = useCallback((data: any) => {
    setEditData(data);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (deletingRef.current.has(id)) return; // Already deleting
    if (!confirm("Are you sure you want to delete this customer?")) return;

    deletingRef.current.add(id);
    try {
      const res = await api.delete(`/customers/${id}`, { withCredentials: true });
      if (res.data.success === true) {
        mutate("/customers"); // 🔥 Auto-refresh tabel tanpa reload halaman
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || "Failed to delete customer");
    } finally {
      deletingRef.current.delete(id);
    }
  }, []);

  const [columnDefs] = useState<ColDef[]>([
    { field: "no", headerName: "No. ", maxWidth: 70 },
    { field: "owner_code", headerName: "Owner", maxWidth: 100 },
    { field: "customer_code", headerName: "Customer Code" },
    { field: "customer_name", headerName: "Customer Name" },
    { field: "cust_addr1", headerName: "Address", cellRenderer: (params: any) => {
        const addr = params.data.cust_addr1 || "";
        const addr2 = params.data.cust_addr2 || "";
        return `${addr} ${addr2}`.trim();
      },
    },
    { field: "cust_city", headerName: "City" },
    { field: "cust_country", headerName: "Country", maxWidth: 120 },
    { field: "cust_phone", headerName: "Phone", maxWidth: 120 },
    { field: "cust_email", headerName: "Email" },
    {
      headerName: "Actions",
      field: "ID",
      pinned: "right",
      maxWidth: 100,
      cellRenderer: (params: any) => {
        return (
          <div>
            <Button
              onClick={() => handleEdit(params.data)}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleDelete(params.data.ID)}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
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

  // Client-side filter by Owner (backend /customers has no filter query params yet)
  const filteredRowData = useMemo(() => {
    if (!rowData) return rowData;
    return rowData.filter((row: any) => {
      return !selectedOwner || row.owner_code === selectedOwner;
    });
  }, [rowData, selectedOwner]);

  const handleResetFilters = () => {
    setSelectedOwner("");
  };

  return (
    <div style={{ width: "100%" }}>
      <div className="flex justify-between items-center">
        <div className="justify-self-start">
          <div className="flex items-center gap-2">
            <Button className="h-8 mb-4" onClick={handleAdd}>
              <Plus className="mr-2 w-4" />
              Add Customer
            </Button>

            <Button
              className="h-8 bg-green-500 mb-4 text-slate-950 hover:bg-green-600 outline-green-600"
              onClick={() => {
                router.push("/wms/master/customer/import-excel");
              }}
            >
              <Upload className="mr-2 w-4" />
              Import Excel
            </Button>

            <Button
              className="h-8 bg-blue-500 mb-4 text-white hover:bg-blue-600"
              onClick={() => setExportModalOpen(true)}
            >
              <Download className="mr-2 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

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
              className=""
              type="text"
              id="filter-text-box"
              placeholder="Search ..."
              onInput={onFilterTextBoxChanged}
            />
          </div>
        </div>
      </div>

      {/* ── Filter Bar (Owner) ── */}
      <FilterBar
        ownerOptions={ownerOptions ?? []}
        ownersLoading={ownersLoading}
        selectedOwner={selectedOwner}
        onOwnerChange={setSelectedOwner}
        onReset={handleResetFilters}
      />

      <AgGridReact
        rowData={filteredRowData}
        columnDefs={columnDefs}
        quickFilterText={quickFilterText}
        pagination={true}
        paginationPageSize={10}
        paginationPageSizeSelector={[10, 25, 50]}
        domLayout="autoHeight"
      />

      <ExportExcelModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
      />

      <CustomerForm
        editData={editData}
        setEditData={setEditData}
        open={isFormOpen}
        setOpen={setIsFormOpen}
      />
    </div>
  );
};

export default CustomerTable;