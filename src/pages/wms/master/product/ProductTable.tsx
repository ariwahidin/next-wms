/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  ColDef,
} from "ag-grid-community";

import api from "@/lib/api";

import {
  Download,
  Package,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import useSWR from "swr";

import {
  ChangeEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import Select from "react-select";

import styles from "./ProductTable.module.css";

import { Button } from "@/components/ui/button";
import ProductForm from "./ProductForm";
import router from "next/router";
import ExportProductModal from "./ExportProductModal";
import ProductBundleModal from "./ProductBundleModal";
import ProductTabs from "./ProductTabs";

ModuleRegistry.registerModules([AllCommunityModule]);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SelectOption {
  value: string;
  label: string;
}

type ProductTab = "all" | "bundle";

// ─────────────────────────────────────────────────────────────────────────────
// Fetchers
// ─────────────────────────────────────────────────────────────────────────────

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

const categoriesFetcher = (url: string) =>
  api.get(url, { withCredentials: true }).then((res) => {
    if (res.data.success && res.data.data) {
      return res.data.data.map((c: any) => ({
        value: c.code,
        label: c.name,
      }));
    }

    return [];
  });

// ─────────────────────────────────────────────────────────────────────────────
// React Select Styles
// ─────────────────────────────────────────────────────────────────────────────

const selectStyles = {
  control: (base: any) => ({
    ...base,
    minHeight: 34,
    borderColor: "#e2e8f0",
    boxShadow: "none",

    "&:hover": {
      borderColor: "#94a3b8",
    },
  }),

  menu: (base: any) => ({
    ...base,
    zIndex: 50,
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Filter Bar
// ─────────────────────────────────────────────────────────────────────────────

interface FilterBarProps {
  ownerOptions: SelectOption[];
  categoryOptions: SelectOption[];

  ownersLoading: boolean;
  categoriesLoading: boolean;

  selectedOwner: string;
  selectedCategory: string;

  onOwnerChange: (v: string) => void;
  onCategoryChange: (v: string) => void;

  onReset: () => void;
}

const FilterBar = ({
  ownerOptions,
  categoryOptions,
  ownersLoading,
  categoriesLoading,
  selectedOwner,
  selectedCategory,
  onOwnerChange,
  onCategoryChange,
  onReset,
}: FilterBarProps) => {
  const isFiltered =
    selectedOwner !== "" || selectedCategory !== "";

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5">
        <SlidersHorizontal className="h-4 w-4 text-slate-500" />

        <span
          className="text-sm font-semibold uppercase tracking-wide text-slate-700"
          style={{
            letterSpacing: "0.06em",
            fontSize: "0.7rem",
          }}
        >
          Filter & Search
        </span>

        {isFiltered && (
          <span className="ml-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
            Active
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 px-4 py-3">
        {/* Owner */}
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
            value={
              ownerOptions.find(
                (o) => o.value === selectedOwner
              ) ?? null
            }
            onChange={(selected) =>
              onOwnerChange(
                selected ? selected.value : ""
              )
            }
            styles={selectStyles}
          />
        </div>

        <div className="hidden h-10 w-px bg-slate-200 sm:block" />

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Category
          </label>

          <Select
            isClearable
            placeholder="All categories"
            className="w-48 text-sm"
            classNamePrefix="rs"
            options={categoryOptions}
            isLoading={categoriesLoading}
            value={
              categoryOptions.find(
                (c) => c.value === selectedCategory
              ) ?? null
            }
            onChange={(selected) =>
              onCategoryChange(
                selected ? selected.value : ""
              )
            }
            styles={selectStyles}
          />
        </div>

        {/* Reset */}
        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-all hover:border-slate-400 hover:text-slate-700"
          >
            <X className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {/* Active Filters */}
      {isFiltered && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Active:
          </span>

          {selectedOwner && (
            <span className="flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
              Owner: {selectedOwner}
            </span>
          )}

          {selectedCategory && (
            <span className="flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
              Category: {selectedCategory}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const ProductTable = () => {
  // ───────────────────────────────────────────────────────────────────────────
  // Product Data
  // ───────────────────────────────────────────────────────────────────────────

  const {
    data: rowData,
    error,
    mutate: revalidate,
  } = useSWR("/products", fetcher);

  // ───────────────────────────────────────────────────────────────────────────
  // Master Data
  // ───────────────────────────────────────────────────────────────────────────

  const {
    data: ownerOptions,
    isLoading: ownersLoading,
  } = useSWR("/owners", ownersFetcher);

  const {
    data: categoryOptions,
    isLoading: categoriesLoading,
  } = useSWR("/categories", categoriesFetcher);

  // ───────────────────────────────────────────────────────────────────────────
  // Product State
  // ───────────────────────────────────────────────────────────────────────────

  const [editData, setEditData] =
    useState<any>(null);

  const [isOpen, setIsOpen] =
    useState(false);

  const [exportModalOpen, setExportModalOpen] =
    useState(false);

  // ───────────────────────────────────────────────────────────────────────────
  // Bundle State
  // ───────────────────────────────────────────────────────────────────────────

  const [bundleProduct, setBundleProduct] =
    useState<any>(null);

  const [bundleModalOpen, setBundleModalOpen] =
    useState(false);

  // ───────────────────────────────────────────────────────────────────────────
  // Filter State
  // ───────────────────────────────────────────────────────────────────────────

  const [selectedOwner, setSelectedOwner] =
    useState<string>("");

  const [selectedCategory, setSelectedCategory] =
    useState<string>("");

  // ───────────────────────────────────────────────────────────────────────────
  // Tab State
  // ───────────────────────────────────────────────────────────────────────────

  const [activeTab, setActiveTab] =
    useState<ProductTab>("all");

  // ───────────────────────────────────────────────────────────────────────────
  // Delete protection
  // ───────────────────────────────────────────────────────────────────────────

  const deletingRef =
    useRef<Set<number>>(new Set());

  // ───────────────────────────────────────────────────────────────────────────
  // Product Handlers
  // ───────────────────────────────────────────────────────────────────────────

  const handleAdd = () => {
    setEditData(null);
    setIsOpen(true);
  };

  const handleEdit = useCallback((data: any) => {
    setEditData(data);
    setIsOpen(true);
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Bundle Handler
  // ───────────────────────────────────────────────────────────────────────────

  const handleBundle = useCallback((data: any) => {
    setBundleProduct(data);
    setBundleModalOpen(true);
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Delete
  // ───────────────────────────────────────────────────────────────────────────

  const handleDelete = useCallback(
    async (id: number) => {
      if (deletingRef.current.has(id)) {
        return;
      }

      if (
        !confirm(
          "Are you sure you want to delete this product?"
        )
      ) {
        return;
      }

      deletingRef.current.add(id);

      try {
        const res = await api.delete(
          `/products/${id}`,
          {
            withCredentials: true,
          }
        );

        if (res.data.success) {
          revalidate();
        }
      } catch (err: any) {
        alert(
          err?.response?.data?.error ||
          "Failed to delete product"
        );
      } finally {
        deletingRef.current.delete(id);
      }
    },
    [revalidate]
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Columns
  // ───────────────────────────────────────────────────────────────────────────

  const [columnDefs] = useState<ColDef[]>([
    {
      field: "no",
      headerName: "No.",
      maxWidth: 65,
      sortable: false,
      filter: false,
    },

    {
      field: "owner_code",
      headerName: "Owner",
      width: 100,
    },

    {
      field: "item_code",
      headerName: "Item Code (SKU)",
      width: 150,
    },

    {
      field: "item_name",
      headerName: "Item Name",
      width: 280,
    },

    {
      field: "unit_model",
      headerName: "Unit Model",
      width: 140,
    },

    {
      field: "barcode",
      headerName: "EAN",
      width: 140,
    },

    {
      field: "uom",
      headerName: "UoM",
      width: 80,
    },

    {
      field: "group",
      headerName: "Group",
      width: 120,
    },

    {
      field: "category",
      headerName: "Category",
      width: 120,
    },

    {
      field: "width",
      headerName: "W (cm)",
      width: 120,
    },

    {
      field: "length",
      headerName: "L (cm)",
      width: 120,
    },

    {
      field: "height",
      headerName: "H (cm)",
      width: 120,
    },

    {
      field: "weight",
      headerName: "Wgt (kg)",
      width: 120,
    },

    {
      field: "qty_per_carton",
      headerName: "Qty/Carton",
      width: 120,
    },

    {
      field: "cbm",
      headerName: "CBM",
      width: 120,
    },

    {
      field: "color",
      headerName: "Color",
      width: 120,
    },

    {
      field: "has_serial",
      headerName: "SN",
      width: 65,
      cellStyle: {
        textAlign: "center",
      },
    },

    {
      field: "has_waranty",
      headerName: "Wrnty",
      width: 80,
      cellStyle: {
        textAlign: "center",
      },
    },

    {
      field: "has_adaptor",
      headerName: "Adpt",
      width: 75,
      cellStyle: {
        textAlign: "center",
      },
    },

    {
      field: "manual_book",
      headerName: "Manual",
      width: 85,
      cellStyle: {
        textAlign: "center",
      },
    },

    {
      field: "user_def1",
      headerName: "User Def 1",
      width: 130,
    },

    {
      field: "is_bundle",
      headerName: "Is Bundle",
      width: 130,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Actions
    // ─────────────────────────────────────────────────────────────────────────

    {
      headerName: "Actions",
      field: "ID",
      pinned: "right",
      width: 130,
      sortable: false,
      filter: false,
      editable: false,

      cellStyle: {
        textAlign: "center",
      },

      cellRenderer: (params: any) => {
        const isBundle =
          params.data?.is_bundle === "Y";

        return (
          <div className="flex h-full items-center justify-center gap-1">
            {/* Configure Bundle */}
            {isBundle && (
              <Button
                onClick={() =>
                  handleBundle(params.data)
                }
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-600 hover:text-slate-900"
                title="Configure Bundle"
              >
                <Package className="h-3.5 w-3.5" />
              </Button>
            )}

            {/* Edit */}
            <Button
              onClick={() =>
                handleEdit(params.data)
              }
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>

            {/* Delete */}
            <Button
              onClick={() =>
                handleDelete(params.data.ID)
              }
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-700"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ]);

  // ───────────────────────────────────────────────────────────────────────────
  // Search
  // ───────────────────────────────────────────────────────────────────────────

  const [quickFilterText, setQuickFilterText] =
    useState<string>();

  const onFilterTextBoxChanged = useCallback(
    ({
      target: { value },
    }: ChangeEvent<HTMLInputElement>) => {
      setQuickFilterText(value);
    },
    []
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Product Counts
  // ───────────────────────────────────────────────────────────────────────────

  const productCounts = useMemo(() => {
    if (!rowData) {
      return {
        all: 0,
        bundle: 0,
      };
    }

    return {
      all: rowData.length,

      bundle: rowData.filter(
        (row: any) => row.is_bundle === "Y"
      ).length,
    };
  }, [rowData]);

  // ───────────────────────────────────────────────────────────────────────────
  // Client-side Filtering
  // ───────────────────────────────────────────────────────────────────────────

  const filteredRowData = useMemo(() => {
    if (!rowData) {
      return rowData;
    }

    return rowData.filter((row: any) => {
      // Owner
      const ownerMatch =
        !selectedOwner ||
        row.owner_code === selectedOwner;

      // Category
      const categoryMatch =
        !selectedCategory ||
        row.category === selectedCategory;

      // Tab
      const tabMatch =
        activeTab === "all" ||
        row.is_bundle === "Y";

      return (
        ownerMatch &&
        categoryMatch &&
        tabMatch
      );
    });
  }, [
    rowData,
    selectedOwner,
    selectedCategory,
    activeTab,
  ]);

  // ───────────────────────────────────────────────────────────────────────────
  // Reset Filters
  // ───────────────────────────────────────────────────────────────────────────

  const handleResetFilters = () => {
    setSelectedOwner("");
    setSelectedCategory("");
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <>
      <div style={{ width: "100%" }}>
        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* Tabs */}
        {/* ─────────────────────────────────────────────────────────────────── */}

        <ProductTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          allCount={productCounts.all}
          bundleCount={productCounts.bundle}
        />

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* Toolbar */}
        {/* ─────────────────────────────────────────────────────────────────── */}

        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            {/* Add */}
            <Button
              className="h-8"
              onClick={handleAdd}
            >
              <Plus className="mr-2 w-4" />
              Add Item
            </Button>

            {/* Import */}

            {activeTab === "all" && (
              <Button
                className="h-8 bg-green-500 text-slate-950 hover:bg-green-600"
                onClick={() =>
                  router.push(
                    "/wms/master/product/import-excel"
                  )
                }
              >
                <Upload className="mr-2 w-4" />
                Import Excel
              </Button>
            )}

            {activeTab === "bundle" && (
              <Button
                className="h-8 bg-green-500 text-slate-950 hover:bg-green-600"
                onClick={() =>
                  router.push(
                    "/wms/master/product/import-bundler"
                  )
                }
              >
                <Upload className="mr-2 w-4" />
                Import Bundler
              </Button>
            )}


            {/* Export */}
            <Button
              className="h-8 bg-blue-500 text-white hover:bg-blue-600"
              onClick={() =>
                setExportModalOpen(true)
              }
            >
              <Download className="mr-2 w-4" />
              Export Excel
            </Button>
          </div>

          {/* Search */}
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
                d="M11.5014 7.00039C11.5014 7.59133 11.385 8.1765 11.1588 8.72246C10.9327 9.26843 10.6012 9.7645 10.1833 10.1824C9.76548 10.6002 9.2694 10.9317 8.72344 11.1578C8.17747 11.384 7.59231 11.5004 7.00136 11.5004C6.41041 11.5004 5.82525 11.384 5.27929 11.1578C4.73332 10.9317 4.23725 10.6002 3.81938 10.1824C3.40152 9.7645 3.07005 9.26843 2.8439 8.72246C2.61776 8.1765 2.50136 7.59133 2.50136 7.00039C2.50136 5.80691 2.97547 4.66232 3.81938 3.81841C4.6633 2.97449 5.80789 2.50039 7.00136 2.50039C8.19484 2.50039 9.33943 2.97449 10.1833 3.81841C11.0273 4.66232 11.5014 5.80691 11.5014 7.00039ZM10.6814 11.7404C9.47574 12.6764 7.95873 13.1177 6.43916 12.9745C4.91959 12.8314 3.51171 12.1145 2.50211 10.9698C1.49252 9.8251 0.957113 8.33868 1.0049 6.81314C1.05268 5.28759 1.68006 3.83759 2.75932 2.75834C3.83857 1.67908 5.28856 1.0517 6.81411 1.00392C8.33966 0.956136 9.82608 1.49154 10.9708 2.50114C12.1154 3.51073 12.8323 4.91862 12.9755 6.43819C13.1187 7.95775 12.6773 9.47476 11.7414 10.6804L14.5314 13.4704C14.605 13.539 14.6642 13.6218 14.7051 13.7138C14.746 13.8058 14.768 13.9052 14.7698 14.0059C14.7716 14.1066 14.753 14.2066 14.7153 14.3C14.6776 14.3934 14.6214 14.4782 14.5502 14.5494C14.479 14.6206 14.3942 14.6768 14.3008 14.7145C14.2074 14.7522 14.1073 14.7708 14.0066 14.769C13.9059 14.7672 13.8066 14.7452 13.7146 14.7042C13.6226 14.6632 13.5398 14.6041 13.4712 14.5304L10.6814 11.7404Z"
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

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* Filter */}
        {/* ─────────────────────────────────────────────────────────────────── */}

        <FilterBar
          ownerOptions={ownerOptions ?? []}
          categoryOptions={categoryOptions ?? []}
          ownersLoading={ownersLoading}
          categoriesLoading={categoriesLoading}
          selectedOwner={selectedOwner}
          selectedCategory={selectedCategory}
          onOwnerChange={setSelectedOwner}
          onCategoryChange={setSelectedCategory}
          onReset={handleResetFilters}
        />

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* Product Grid */}
        {/* ─────────────────────────────────────────────────────────────────── */}

        <AgGridReact
          rowData={filteredRowData}
          columnDefs={columnDefs}
          quickFilterText={quickFilterText}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[
            10,
            25,
            50,
          ]}
          domLayout="autoHeight"
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
            editable: false,
          }}
        />
      </div>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* Product Form */}
      {/* ───────────────────────────────────────────────────────────────────── */}

      <ProductForm
        editData={editData}
        setEditData={setEditData}
        open={isOpen}
        setOpen={setIsOpen}
      />

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* Bundle Configuration */}
      {/* ───────────────────────────────────────────────────────────────────── */}

      <ProductBundleModal
        product={bundleProduct}
        open={bundleModalOpen}
        setOpen={setBundleModalOpen}
        onSaved={() => {
          revalidate();
        }}
      />

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* Export */}
      {/* ───────────────────────────────────────────────────────────────────── */}

      <ExportProductModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
      />
    </>
  );
};

export default ProductTable;