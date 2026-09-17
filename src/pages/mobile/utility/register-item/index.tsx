/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PageHeader from "@/components/mobile/PageHeader";
import { Input } from "@/components/ui/input";
import {
  Loader2, X, Edit, Trash2, Search, Filter, CheckSquare, Square,
  Plus, ChevronLeft, ChevronRight, XCircle, Camera,
  CheckCircle2, AlertCircle, RotateCcw,
} from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import eventBus from "@/utils/eventBus";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ParsedQRData, parseQRCode } from "@/utils/qrParser";
import CartonLabelOcrDialog, { type CartonOcrPayload } from "@/components/CartonLabelOcrDialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Owner {
  id: number;
  code: string;
  name: string;
}

interface Uom {
  id: number;
  code: string;
  name: string;
}

interface Product {
  ID: number;
  owner_code: string;
  sku: string;
  unit_model: string;
  description: string;
  ean: string;
  uom: string;
  location: string;
  quantity: number;
  case_number?: string | null;
  ctn_no?: number | null;
  total_ctn?: number | null;
  created_at: string;
  created_by_name?: string;
}


// ─── Toggle Component ─────────────────────────────────────────────────────────

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  labelOff?: string;
  labelOn?: string;
}

const ToggleSwitch = ({ checked, onChange, labelOff = "Off", labelOn = "On" }: ToggleSwitchProps) => (
  <div className="flex items-center gap-2 text-sm">
    <span className={!checked ? "font-semibold text-gray-800" : "text-gray-400"}>{labelOff}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-blue-500" : "bg-gray-300"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
    <span className={checked ? "font-semibold text-gray-800" : "text-gray-400"}>{labelOn}</span>
  </div>
);

// ─── Field Component (reusable) ───────────────────────────────────────────────

interface ClearableInputProps {
  id?: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  autoFocus?: boolean;
}

const ClearableInput = ({
  id, label, value, onChange, placeholder, inputRef, onKeyDown, readOnly, autoFocus,
}: ClearableInputProps) => (
  <div className="space-y-0">
    <label htmlFor={id} className="text-[11px] leading-4 font-medium text-gray-600">{label}</label>
    <div className="relative">
      <Input
        id={id}
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        readOnly={readOnly}
        autoFocus={autoFocus}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        onKeyDown={onKeyDown}
        className={`h-9 text-sm ${readOnly ? "bg-gray-50 text-gray-500" : ""}`}
      />
      {value && !readOnly && (
        <button
          type="button"
          onClick={() => { onChange(""); inputRef?.current?.focus(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

export default function RegisterProductPage() {
  // ── Form states ─────────────────────────────────────────────────────────────
  const [ownerCode, setOwnerCode] = useState("");
  const [location, setLocation] = useState("");
  const [sku, setSku] = useState("");
  const [unitModel, setUnitModel] = useState("");
  const [ean, setEan] = useState("");
  const [description, setDescription] = useState("");
  const [uom, setUom] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);

  // ── QR mode ─────────────────────────────────────────────────────────────────
  const [isQrMode, setIsQrMode] = useState(false);
  const [qrRawInput, setQrRawInput] = useState("");
  const [parsedQR, setParsedQR] = useState<ParsedQRData | null>(null);

  // ── Optional Carton Label OCR ───────────────────────────────────────────────
  const [cartonOcrOpen, setCartonOcrOpen] = useState(false);
  const [caseNumber, setCaseNumber] = useState("");
  const [ctnNo, setCtnNo] = useState<number | null>(null);
  const [totalCtn, setTotalCtn] = useState<number | null>(null);

  // ── Data states ──────────────────────────────────────────────────────────────
  const [owners, setOwners] = useState<Owner[]>([]);
  const [uoms, setUoms] = useState<Uom[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // ── UI states ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"register" | "list">("register");
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Item List filter / selection states ─────────────────────────────────────
  const [filterLocation, setFilterLocation] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // ── Edit form states ─────────────────────────────────────────────────────────
  const [editOwnerCode, setEditOwnerCode] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editUnitModel, setEditUnitModel] = useState("");
  const [editEan, setEditEan] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editUom, setEditUom] = useState("");
  const [editQuantity, setEditQuantity] = useState("1");
  const [editCaseNumber, setEditCaseNumber] = useState("");
  const [editCtnNo, setEditCtnNo] = useState<number | null>(null);
  const [editTotalCtn, setEditTotalCtn] = useState<number | null>(null);
  const [editCartonOcrOpen, setEditCartonOcrOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const locationRef = useRef<HTMLInputElement>(null);
  const skuRef = useRef<HTMLInputElement>(null);
  const unitModelRef = useRef<HTMLInputElement>(null);
  const caseNumberRef = useRef<HTMLInputElement>(null);
  const eanRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLInputElement>(null);

  // ── Fetch helpers ─────────────────────────────────────────────────────────────

  const fetchOwners = useCallback(async () => {
    try {
      const response = await api.get("/owners/", { withCredentials: true });
      setOwners(response.data.data ?? []);
    } catch (error) {
      console.error("Error fetching owners:", error);
    }
  }, []);

  const fetchUoms = useCallback(async () => {
    try {
      const response = await api.get("/uoms/", { withCredentials: true });
      setUoms(response.data.data ?? []);
    } catch (error) {
      console.error("Error fetching UOMs:", error);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get("/mobile/inventory/products/", { withCredentials: true });
      const nextProducts = response.data.data ?? [];
      setProducts(nextProducts);
      setSelectedIds((prev) =>
        prev.filter((id) => nextProducts.some((product: Product) => product.ID === id))
      );
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    }
  }, []);

  // ── Effects ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchOwners();
    fetchUoms();
    fetchProducts();
  }, []);

  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();

    const result = products.filter((p) => {
      const matchesSearch =
        !q ||
        p.sku.toLowerCase().includes(q) ||
        p.unit_model.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        p.ean.toLowerCase().includes(q) ||
        p.owner_code.toLowerCase().includes(q) ||
        p.uom.toLowerCase().includes(q) ||
        (p.location ?? "").toLowerCase().includes(q);

      const matchesLocation =
        !filterLocation || (p.location ?? "") === filterLocation;

      const matchesModel =
        !filterModel || p.unit_model === filterModel;

      const matchesOwner =
        !filterOwner || p.owner_code === filterOwner;

      return matchesSearch && matchesLocation && matchesModel && matchesOwner;
    });

    setFilteredProducts(result);
    setCurrentPage(1);
  }, [searchQuery, products, filterLocation, filterModel, filterOwner]);

  const locations = [...new Set(
    products.map((p) => p.location).filter(Boolean)
  )].sort();

  const models = [...new Set(
    products.map((p) => p.unit_model).filter(Boolean)
  )].sort();

  const ownerCodes = [...new Set(
    products.map((p) => p.owner_code).filter(Boolean)
  )].sort();

  const activeFilterCount =
    Number(!!filterLocation) +
    Number(!!filterModel) +
    Number(!!filterOwner);

  const clearFilters = () => {
    setFilterLocation("");
    setFilterModel("");
    setFilterOwner("");
    setSelectedIds([]);
    setCurrentPage(1);
  };

  const toggleProductSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id]
    );
  };

  const toggleCurrentPageSelection = () => {
    const currentIds = currentProducts.map((p) => p.ID);
    const allSelected = currentIds.length > 0 &&
      currentIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !currentIds.includes(id))
      );
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...currentIds])]);
    }
  };

  const selectAllFiltered = () => {
    setSelectedIds(filteredProducts.map((p) => p.ID));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  // ── QR Helpers ────────────────────────────────────────────────────────────────

  const resetForm = () => {
    // Location sengaja tidak di-reset agar scanner bisa register
    // item berikutnya di lokasi yang sama.
    setSku("");
    // setUnitModel("");
    setEan("");
    setDescription("");
    setQuantity("1");
    setQrRawInput("");
    setParsedQR(null);
    setCaseNumber("");
    setCtnNo(null);
    setTotalCtn(null);
  };

  const handleCartonOcrDetected = (payload: CartonOcrPayload) => {
    setCaseNumber(payload.case_number ?? "");
    setCtnNo(payload.ctn_no ?? null);
    setTotalCtn(payload.total_ctn ?? null);
    setCartonOcrOpen(false);
  };

  const handleEditCartonOcrDetected = (payload: CartonOcrPayload) => {
    setEditCaseNumber(payload.case_number ?? "");
    setEditCtnNo(payload.ctn_no ?? null);
    setEditTotalCtn(payload.total_ctn ?? null);
    setEditCartonOcrOpen(false);
  };

  const clearCartonData = () => {
    setCaseNumber("");
    setCtnNo(null);
    setTotalCtn(null);
  };

  const handleQrInputChange = (raw: string) => {
    setQrRawInput(raw);
    const parsed = parseQRCode(raw);
    if (parsed) {
      setParsedQR(parsed);
      // Mapping QR fields → form fields
      if (parsed.sku) setSku(parsed.sku.toUpperCase());
      if (parsed.ean) setEan(parsed.ean.toUpperCase());
      if (parsed.model) setUnitModel(parsed.model.toUpperCase());
      if (parsed.product) setDescription(parsed.product.toUpperCase());
    } else {
      setParsedQR(null);
    }
  };

  const handleModeToggle = (qr: boolean) => {
    setIsQrMode(qr);
    resetForm();
    setTimeout(() => {
      if (qr) qrRef.current?.focus();
      else locationRef.current?.focus();
    }, 50);
  };

  // ── Keyboard navigation (Enter → next field) ──────────────────────────────────

  const focusNext = (ref: React.RefObject<HTMLInputElement>) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); ref.current?.focus(); }
  };

  // ── CRUD Handlers ─────────────────────────────────────────────────────────────

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ownerCode || !location.trim() || !sku.trim() || !unitModel.trim() || !uom) {
      eventBus.emit("showAlert", {
        title: "Error!",
        description: "Owner, Location, Item, Model, and UOM are required",
        type: "error",
      });
      return;
    }

    const dataToPost = {
      owner_code: ownerCode,
      location: location.toUpperCase().trim(),
      sku: sku.toUpperCase(),
      unit_model: unitModel.toUpperCase(),
      ean: ean.toUpperCase(),
      description: description.toUpperCase(),
      uom,
      quantity: Math.max(1, Number(quantity) || 1),

      // Optional carton label data from OCR.
      case_number: caseNumber.trim() || null,
      ctn_no: ctnNo,
      total_ctn: totalCtn,
    };

    try {
      setLoading(true);
      const response = await api.post("/mobile/inventory/add-item/", dataToPost, { withCredentials: true });
      const data = await response.data;
      if (data.success) {
        eventBus.emit("showAlert", { title: "Success!", description: data.message, type: "success" });
        resetForm();
        skuRef.current?.focus();
        fetchProducts();
      }
    } catch (error: any) {
      console.error("Error saving data:", error);
      eventBus.emit("showAlert", {
        title: "Error!",
        description: error.response?.data?.message || "Failed to register product",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditOwnerCode(product.owner_code ?? "");
    setEditLocation(product.location ?? "");
    setEditSku(product.sku ?? "");
    setEditUnitModel(product.unit_model ?? "");
    setEditEan(product.ean ?? "");
    setEditDescription(product.description ?? "");
    setEditUom(product.uom ?? "");
    setEditQuantity(String(product.quantity > 0 ? product.quantity : 1));
    setEditCaseNumber(product.case_number ?? "");
    setEditCtnNo(product.ctn_no ?? null);
    setEditTotalCtn(product.total_ctn ?? null);
    setEditDialogOpen(true);
  };

  const clearEditCartonData = () => {
    setEditCaseNumber("");
    setEditCtnNo(null);
    setEditTotalCtn(null);
  };

  const handleUpdate = async () => {
    // Keep the same required fields and default behavior as CreateRegisterProduct.
    const normalizedOwnerCode = editOwnerCode.trim().toUpperCase();
    const normalizedLocation = editLocation.trim().toUpperCase();
    const normalizedSku = editSku.trim().toUpperCase();
    const normalizedUnitModel = editUnitModel.trim().toUpperCase();
    const normalizedEan = editEan.trim().toUpperCase();
    const normalizedDescription = editDescription.trim().toUpperCase();
    const normalizedUom = editUom.trim().toUpperCase();
    const normalizedCaseNumber = editCaseNumber.trim().toUpperCase();

    if (
      !normalizedOwnerCode ||
      !normalizedLocation ||
      !normalizedSku ||
      !normalizedUnitModel ||
      !normalizedUom
    ) {
      eventBus.emit("showAlert", {
        title: "Error!",
        description: "Owner, Location, Item, Model, and UOM are required",
        type: "error",
      });
      return;
    }

    const dataToUpdate = {
      owner_code: normalizedOwnerCode,
      location: normalizedLocation,
      sku: normalizedSku,
      unit_model: normalizedUnitModel,
      ean: normalizedEan,
      description: normalizedDescription,
      uom: normalizedUom,
      quantity: Math.max(1, Number(editQuantity) || 1),
      case_number: normalizedCaseNumber || null,
      ctn_no: editCtnNo,
      total_ctn: editTotalCtn,
    };

    try {
      setEditLoading(true);
      const response = await api.put(
        `/mobile/inventory/products/${selectedProduct?.ID}`,
        dataToUpdate,
        { withCredentials: true }
      );
      const data = await response.data;
      if (data.success) {
        eventBus.emit("showAlert", {
          title: "Success!",
          description: data.message || "Product updated successfully",
          type: "success",
        });
        setEditDialogOpen(false);
        await fetchProducts();
      }
    } catch (error: any) {
      console.error("Error updating:", error);
      eventBus.emit("showAlert", {
        title: "Error!",
        description: error.response?.data?.message || "Failed to update product",
        type: "error",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await api.delete(
        `/mobile/inventory/products/${selectedProduct?.ID}`,
        { withCredentials: true }
      );
      const data = await response.data;
      if (data.success) {
        eventBus.emit("showAlert", { title: "Success!", description: "Product deleted successfully", type: "success" });
        setDeleteDialogOpen(false);
        if (selectedProduct) {
          setSelectedIds((prev) => prev.filter((id) => id !== selectedProduct.ID));
        }
        fetchProducts();
      }
    } catch (error: any) {
      console.error("Error deleting:", error);
      eventBus.emit("showAlert", {
        title: "Error!",
        description: error.response?.data?.message || "Failed to delete product",
        type: "error",
      });
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      setBulkDeleteLoading(true);

      // Reuse the existing per-item DELETE endpoint.
      // No backend changes are required.
      const results = await Promise.allSettled(
        selectedIds.map((id) =>
          api.delete(`/mobile/inventory/products/${id}`, {
            withCredentials: true,
          })
        )
      );

      const failed = results.filter(
        (result) => result.status === "rejected"
      ).length;
      const successCount = results.length - failed;

      if (failed === 0) {
        eventBus.emit("showAlert", {
          title: "Success!",
          description: `${successCount} products deleted successfully`,
          type: "success",
        });
      } else {
        eventBus.emit("showAlert", {
          title: "Completed with errors",
          description: `${successCount} deleted, ${failed} failed`,
          type: "error",
        });
      }

      setSelectedIds([]);
      setBulkDeleteDialogOpen(false);
      await fetchProducts();
    } catch (error: any) {
      console.error("Bulk delete error:", error);
      eventBus.emit("showAlert", {
        title: "Error!",
        description:
          error.response?.data?.message || "Failed to delete selected products",
        type: "error",
      });
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  // ── Pagination ────────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader title="Register Item" showBackButton />

      <div className="min-h-screen bg-gray-50 text-[13px]">

        {/* ── Tab Navigation ── */}
        <div className="sticky top-0 z-10 bg-white border-b">
          <div className="flex max-w-md mx-auto">
            <button
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${activeTab === "register" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              <Plus className="inline-block w-4 h-4 mr-1" />
              Register Item
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${activeTab === "list" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              <Search className="inline-block w-4 h-4 mr-1" />
              Item List ({products.length})
            </button>
          </div>
        </div>

        {/* ── Register Tab ── */}
        {activeTab === "register" && (
          <div className="px-2.5 py-2 space-y-2 pb-16 max-w-md mx-auto">

            {/* Mode Toggle */}
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-2.5 py-1.5">
              <span className="text-sm font-medium text-gray-700">Input Mode</span>
              <ToggleSwitch
                checked={isQrMode}
                onChange={handleModeToggle}
                labelOff="Manual"
                labelOn="QR Code"
              />
            </div>

            <form onSubmit={handleSave} className="space-y-2">

              {/* ── QR Mode ── */}
              {isQrMode && (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label htmlFor="qr-input" className="text-sm font-medium text-gray-700">
                      QR Code <span className="text-gray-400 font-normal">(scan here)</span>
                    </label>
                    <div className="relative">
                      <Input
                        id="qr-input"
                        ref={qrRef}
                        autoFocus
                        autoComplete="off"
                        className="h-9 font-mono text-xs pr-8"
                        placeholder="Scan QR Code here"
                        value={qrRawInput}
                        onChange={(e) => handleQrInputChange(e.target.value)}
                      />
                      {qrRawInput && (
                        <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => {
                            setQrRawInput("");
                            setParsedQR(null);
                            setSku("");
                            setUnitModel("");
                            setEan("");
                            setDescription("");
                            qrRef.current?.focus();
                          }}>
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>

                    {/* QR Preview */}
                    {parsedQR && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-[11px] font-mono space-y-0.5">
                        <p className="text-blue-700 font-semibold text-xs mb-1">✓ QR berhasil dibaca</p>
                        {parsedQR.sku && <div><span className="text-gray-500 w-20 inline-block">ITEM:</span> <span className="font-semibold">{parsedQR.sku}</span></div>}
                        {parsedQR.ean && <div><span className="text-gray-500 w-20 inline-block">EAN:</span> <span className="font-semibold">{parsedQR.ean}</span></div>}
                        {parsedQR.model && <div><span className="text-gray-500 w-20 inline-block">Model:</span> <span className="font-semibold">{parsedQR.model}</span></div>}
                        {parsedQR.product && <div><span className="text-gray-500 w-20 inline-block">Product:</span> <span className="font-semibold">{parsedQR.product}</span></div>}
                        {parsedQR.brand && <div><span className="text-gray-500 w-20 inline-block">Brand:</span> {parsedQR.brand}</div>}
                        {parsedQR.mfgDate && <div><span className="text-gray-500 w-20 inline-block">MFG Date:</span> {parsedQR.mfgDate}</div>}
                      </div>
                    )}
                    {qrRawInput && !parsedQR && (
                      <p className="text-xs text-red-500">Format QR tidak dikenali. Pastikan format: (1)SKU=...(2)EAN=...</p>
                    )}
                  </div>

                  {/* Divider */}
                  {parsedQR && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <div className="flex-1 border-t" />
                      <span>Hasil mapping — lengkapi Owner & UOM</span>
                      <div className="flex-1 border-t" />
                    </div>
                  )}
                </div>
              )}

              {/* ── Owner + UOM ── */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0">
                  <label className="text-[11px] leading-4 font-medium text-gray-600">
                    OWNER <span className="text-red-500">*</span>
                  </label>
                  <Select value={ownerCode} onValueChange={setOwnerCode}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {owners.map((owner) => (
                        <SelectItem key={owner.id} value={owner.code}>
                          {owner.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-0">
                  <label className="text-[11px] leading-4 font-medium text-gray-600">
                    UOM <span className="text-red-500">*</span>
                  </label>
                  <Select value={uom} onValueChange={setUom}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="UOM" />
                    </SelectTrigger>
                    <SelectContent>
                      {uoms.map((u) => (
                        <SelectItem key={u.id} value={u.code}>
                          {u.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ClearableInput
                id="location"
                label="LOCATION *"
                value={location}
                onChange={setLocation}
                placeholder="Scan or enter Location"
                inputRef={locationRef}
                onKeyDown={focusNext(unitModelRef)}
              />

              <ClearableInput
                id="unit_model"
                label="MODEL *"
                value={unitModel}
                onChange={setUnitModel}
                placeholder="Scan or enter Model"
                inputRef={unitModelRef}
                readOnly={isQrMode && !!parsedQR?.model}
                onKeyDown={focusNext(skuRef)}
              />


              <div className="grid grid-cols-[1fr_88px] gap-2">
                <ClearableInput
                  id="sku"
                  label="ITEM *"
                  value={sku}
                  onChange={setSku}
                  placeholder="Scan or enter Item"
                  inputRef={skuRef}
                  readOnly={isQrMode && !!parsedQR?.sku}
                  onKeyDown={focusNext(caseNumberRef)}
                />

                <div className="space-y-0">
                  <label htmlFor="quantity" className="text-[11px] leading-4 font-medium text-gray-600">
                    QTY *
                  </label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>


              {/* ── Optional Carton Label ── */}
              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-gray-50">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700">
                      Carton Information
                      <span className="ml-1 font-normal text-gray-400">(Optional)</span>
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Case Number &amp; Carton No
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCartonOcrOpen(true)}
                    disabled={loading}
                    title="Scan carton label"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-3">
                  <div className="space-y-2">
                    <div>
                      {/* <label
                        htmlFor="case-number"
                        className="text-[11px] leading-4 font-medium text-gray-600"
                      >
                        CASE NUMBER
                      </label> */}
                      {/* <ClearableInput
                        id="case-number"
                        value={caseNumber}
                        onChange={setCaseNumber}
                        placeholder="Enter case number"
                        inputRef={caseNumberRef}
                      /> */}
                      <ClearableInput
                        id="case-number"
                        label="CASE NUMBER"
                        value={caseNumber}
                        onChange={setCaseNumber}
                        placeholder="Enter case number"
                        inputRef={caseNumberRef}
                        // readOnly={isQrMode && !!parsedQR?.model}
                        // onKeyDown={focusNext(skuRef)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label
                          htmlFor="ctn-no"
                          className="text-[11px] leading-4 font-medium text-gray-600"
                        >
                          CTN NO
                        </label>
                        <Input
                          id="ctn-no"
                          type="number"
                          min={1}
                          step={1}
                          inputMode="numeric"
                          value={ctnNo ?? ""}
                          onChange={(e) =>
                            setCtnNo(e.target.value ? Number(e.target.value) : null)
                          }
                          placeholder=""
                          className="h-9 font-mono text-sm"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="total-ctn"
                          className="text-[11px] leading-4 font-medium text-gray-600"
                        >
                          TOTAL CTN
                        </label>
                        <Input
                          id="total-ctn"
                          type="number"
                          min={1}
                          step={1}
                          inputMode="numeric"
                          value={totalCtn ?? ""}
                          onChange={(e) =>
                            setTotalCtn(e.target.value ? Number(e.target.value) : null)
                          }
                          placeholder=""
                          className="h-9 font-mono text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[10px] text-gray-400">
                        Enter manually or scan the carton label.
                      </span>

                      {(caseNumber || ctnNo !== null || totalCtn !== null) && (
                        <button
                          type="button"
                          onClick={clearCartonData}
                          className="text-[11px] font-medium text-gray-500 hover:text-red-600"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>



              <ClearableInput
                id="ean"
                label="EAN (Optional)"
                value={ean}
                onChange={setEan}
                placeholder="Scan or enter EAN"
                inputRef={eanRef}
                readOnly={isQrMode && !!parsedQR?.ean}
                onKeyDown={focusNext(descriptionRef)}
              />

              <ClearableInput
                id="description"
                label="DESCRIPTION (Optional)"
                value={description}
                onChange={setDescription}
                placeholder="Enter Description"
                inputRef={descriptionRef}
                readOnly={isQrMode && !!parsedQR?.product}
              />

              <Button
                type="submit"
                className="w-full h-9 bg-blue-500 hover:bg-blue-600 text-white text-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    SAVING...
                  </>
                ) : (
                  "SAVE ITEM"
                )}
              </Button>
            </form>
          </div>
        )}

        {/* ── List Tab ── */}
        {activeTab === "list" && (
          <div className="px-2.5 py-2 space-y-2 pb-16 max-w-4xl mx-auto">

            {/* Search + Filters */}
            <div className="sticky top-[57px] z-10 bg-gray-50 pb-2 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search Item, Model, EAN, Location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 h-10 bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setFilterOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Filter</span>
                    {activeFilterCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold">
                        {activeFilterCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {filterOpen ? "Hide" : "Show"}
                  </span>
                </button>

                {filterOpen && (
                  <div className="border-t px-3 py-3 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-gray-500">
                          LOCATION
                        </label>
                        <Select value={filterLocation || "__all__"} onValueChange={(v) => setFilterLocation(v === "__all__" ? "" : v)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="All Location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__all__">All Location</SelectItem>
                            {locations.map((value) => (
                              <SelectItem key={value} value={value}>
                                {value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-gray-500">
                          MODEL
                        </label>
                        <Select value={filterModel || "__all__"} onValueChange={(v) => setFilterModel(v === "__all__" ? "" : v)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="All Model" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__all__">All Model</SelectItem>
                            {models.map((value) => (
                              <SelectItem key={value} value={value}>
                                {value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-gray-500">
                          OWNER
                        </label>
                        <Select value={filterOwner || "__all__"} onValueChange={(v) => setFilterOwner(v === "__all__" ? "" : v)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="All Owner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__all__">All Owner</SelectItem>
                            {ownerCodes.map((value) => (
                              <SelectItem key={value} value={value}>
                                {value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="text-xs font-medium text-gray-500 hover:text-gray-800"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between px-1 text-xs text-gray-500">
                <span>
                  Showing <span className="font-semibold text-gray-700">{filteredProducts.length}</span> items
                  {activeFilterCount > 0 && " · filtered"}
                </span>
                {selectedIds.length > 0 && (
                  <span className="font-semibold text-blue-600">
                    {selectedIds.length} selected
                  </span>
                )}
              </div>

              {selectedIds.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckSquare className="h-4 w-4 text-blue-600 shrink-0" />
                      <span className="text-xs font-semibold text-blue-800 truncate">
                        {selectedIds.length} item{selectedIds.length !== 1 ? "s" : ""} selected
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-xs text-gray-500 hover:text-gray-700 shrink-0"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {selectedIds.length < filteredProducts.length && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={selectAllFiltered}
                        className="flex-1 h-8 text-xs bg-white"
                      >
                        Select all filtered ({filteredProducts.length})
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setBulkDeleteDialogOpen(true)}
                      className="h-8 text-xs bg-red-500 hover:bg-red-600 text-white"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete ({selectedIds.length})
                    </Button>
                  </div>
                </div>
              )}

              {filteredProducts.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <button
                    type="button"
                    onClick={toggleCurrentPageSelection}
                    className="flex items-center gap-2 text-xs font-medium text-gray-700"
                  >
                    {currentProducts.length > 0 &&
                      currentProducts.every((p) => selectedIds.includes(p.ID)) ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                    Select current page ({currentProducts.length})
                  </button>
                </div>
              )}
            </div>

            {/* Product List */}
            {currentProducts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">
                  {searchQuery || activeFilterCount > 0
                    ? "No products found with the current search/filter"
                    : "No products registered yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentProducts.map((product) => {
                  const isSelected = selectedIds.includes(product.ID);
                  const hasCarton = Boolean(
                    product.case_number ||
                    product.ctn_no !== null && product.ctn_no !== undefined ||
                    product.total_ctn !== null && product.total_ctn !== undefined
                  );

                  return (
                    <div
                      key={product.ID}
                      className={`bg-white rounded-md border px-2.5 py-2 transition-colors ${isSelected
                        ? "border-blue-300 bg-blue-50/30"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      {/* Header */}
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => toggleProductSelection(product.ID)}
                          className="mt-0.5 shrink-0 rounded hover:bg-blue-50"
                          aria-label={isSelected ? "Deselect item" : "Select item"}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-4 text-gray-900">
                              {product.sku}
                            </h3>
                            <div className="flex shrink-0 items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleEdit(product)}
                                className="rounded p-1 text-blue-600 hover:bg-blue-50"
                                aria-label="Edit product"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(product)}
                                className="rounded p-1 text-red-600 hover:bg-red-50"
                                aria-label="Delete product"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="mt-0.5 truncate text-[11px] leading-3.5 text-blue-700">
                            Model: {product.unit_model}
                          </p>
                        </div>
                      </div>

                      {/* Compact details */}
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-gray-100 pt-2">
                        <div className="min-w-0">
                          <span className="block text-[9px] leading-3 text-gray-400">LOCATION</span>
                          <p className="truncate text-[11px] font-medium leading-4 text-gray-800">
                            {product.location || "-"}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <span className="block text-[9px] leading-3 text-gray-400">EAN</span>
                          <p className="truncate font-mono text-[11px] font-medium leading-4 text-gray-800">
                            {product.ean || "-"}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <span className="block text-[9px] leading-3 text-gray-400">OWNER</span>
                          <p className="truncate text-[11px] font-medium leading-4 text-gray-800">
                            {product.owner_code || "-"}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <span className="block text-[9px] leading-3 text-gray-400">UOM</span>
                          <p className="truncate text-[11px] font-medium leading-4 text-gray-800">
                            {product.uom || "-"}
                          </p>
                        </div>

                        <div>
                          <span className="block text-[9px] leading-3 text-gray-400">QTY</span>
                          <p className="text-[11px] font-medium leading-4 text-gray-800">
                            {product.quantity}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <span className="block text-[9px] leading-3 text-gray-400">CREATED</span>
                          <p className="truncate text-[11px] font-medium leading-4 text-gray-800">
                            {new Date(product.created_at).toLocaleDateString("id-ID")}
                            {product.created_by_name && (
                              <span className="font-normal text-gray-400"> · {product.created_by_name}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Carton data from manual input / OCR */}
                      {hasCarton && (
                        <div className="mt-2 flex min-w-0 items-center gap-2 rounded-md bg-blue-50 px-2 py-1.5">
                          <div className="min-w-0 flex-1">
                            <span className="block text-[9px] leading-3 text-blue-500">CASE NUMBER</span>
                            <p className="truncate font-mono text-[11px] font-semibold leading-4 text-blue-800">
                              {product.case_number || "-"}
                            </p>
                          </div>

                          <div className="shrink-0 border-l border-blue-100 pl-2 text-right">
                            <span className="block text-[9px] leading-3 text-blue-500">CTN</span>
                            <p className="text-[11px] font-semibold leading-4 text-blue-800">
                              {product.ctn_no ?? "-"}
                              {product.total_ctn !== null && product.total_ctn !== undefined && (
                                <span className="font-normal text-blue-500"> / {product.total_ctn}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {product.description && (
                        <p className="mt-1 truncate text-[10px] leading-3.5 text-gray-400">
                          {product.description}
                        </p>
                      )}
                    </div>
                  );
                })}              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                  <span className="text-gray-400 ml-1">({filteredProducts.length} items)</span>
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Carton Label OCR Dialog ── */}
      <CartonLabelOcrDialog
        open={cartonOcrOpen}
        onOpenChange={setCartonOcrOpen}
        onDetected={handleCartonOcrDetected}
      />

      <CartonLabelOcrDialog
        open={editCartonOcrOpen}
        onOpenChange={setEditCartonOcrOpen}
        onDetected={handleEditCartonOcrDetected}
      />

      {/* ── Edit Dialog ── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 gap-0 bg-slate-50">
          <DialogHeader className="px-4 pt-4 pb-3 border-b">
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0">
                <label className="text-[11px] leading-4 font-medium text-gray-600">OWNER *</label>
                <Select value={editOwnerCode} onValueChange={setEditOwnerCode}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.code}>
                        {owner.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-0">
                <label className="text-[11px] leading-4 font-medium text-gray-600">UOM *</label>
                <Select value={editUom} onValueChange={setEditUom}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="UOM" />
                  </SelectTrigger>
                  <SelectContent>
                    {uoms.map((u) => (
                      <SelectItem key={u.id} value={u.code}>
                        {u.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ClearableInput id="edit-location" label="LOCATION *" value={editLocation} onChange={setEditLocation} placeholder="Enter Location" />
            <ClearableInput id="edit-model" label="MODEL *" value={editUnitModel} onChange={setEditUnitModel} placeholder="Enter Model" />

            <div className="grid grid-cols-[1fr_88px] gap-2">
              <ClearableInput id="edit-sku" label="ITEM *" value={editSku} onChange={setEditSku} placeholder="Enter Item" />

              <div className="space-y-0">
                <label htmlFor="edit-quantity" className="text-[11px] leading-4 font-medium text-gray-600">
                  QTY *
                </label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Optional carton information */}
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-gray-50">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-700">
                    Carton Information
                    <span className="ml-1 font-normal text-gray-400">(Optional)</span>
                  </p>
                  <p className="text-[10px] text-gray-400">Case Number &amp; Carton No</p>
                </div>

                <button
                  type="button"
                  onClick={() => setEditCartonOcrOpen(true)}
                  disabled={editLoading}
                  title="Scan carton label"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3 space-y-2">
                <ClearableInput
                  id="edit-case-number"
                  label="CASE NUMBER"
                  value={editCaseNumber}
                  onChange={setEditCaseNumber}
                  placeholder="Enter case number"
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="edit-ctn-no" className="text-[11px] leading-4 font-medium text-gray-600">
                      CTN NO
                    </label>
                    <Input
                      id="edit-ctn-no"
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      value={editCtnNo ?? ""}
                      onChange={(e) => setEditCtnNo(e.target.value ? Number(e.target.value) : null)}
                      className="h-9 font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-total-ctn" className="text-[11px] leading-4 font-medium text-gray-600">
                      TOTAL CTN
                    </label>
                    <Input
                      id="edit-total-ctn"
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      value={editTotalCtn ?? ""}
                      onChange={(e) => setEditTotalCtn(e.target.value ? Number(e.target.value) : null)}
                      className="h-9 font-mono text-sm"
                    />
                  </div>
                </div>

                {(editCaseNumber || editCtnNo !== null || editTotalCtn !== null) && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={clearEditCartonData}
                      className="text-[11px] font-medium text-gray-500 hover:text-red-600"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>

            <ClearableInput id="edit-ean" label="EAN (Optional)" value={editEan} onChange={setEditEan} placeholder="Enter EAN" />
            <ClearableInput id="edit-desc" label="DESCRIPTION (Optional)" value={editDescription} onChange={setEditDescription} placeholder="Optional" />
          </div>

          <DialogFooter className="px-4 py-3 border-t bg-gray-50 flex-row gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={editLoading} className="flex-1">Cancel</Button>
            <Button onClick={handleUpdate} disabled={editLoading} className="bg-blue-500 hover:bg-blue-600 flex-1">
              {editLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Updating...</> : "Update Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md bg-slate-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Are you sure you want to delete this product?</p>
                <div className="p-3 bg-gray-100 rounded-lg space-y-1 text-sm">
                  <p className="font-semibold text-gray-900">Item: {selectedProduct?.sku}</p>
                  <p className="text-gray-600">Location: {selectedProduct?.location || "-"}</p>
                  <p className="text-gray-600">Model: {selectedProduct?.unit_model}</p>
                  {selectedProduct?.description && (
                    <p className="text-gray-600">Desc: {selectedProduct.description}</p>
                  )}
                  <p className="text-gray-600">EAN: {selectedProduct?.ean}</p>
                  <p className="text-gray-600">Owner: {selectedProduct?.owner_code} | UOM: {selectedProduct?.uom}</p>
                  <p className="text-gray-600">Qty: {selectedProduct?.quantity}</p>
                </div>
                <p className="text-sm text-red-600 font-medium">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 w-full sm:w-auto">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Bulk Delete Confirmation ── */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md bg-slate-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Products</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-gray-900">
                    {selectedIds.length} selected item{selectedIds.length !== 1 ? "s" : ""}
                  </span>
                  ?
                </p>

                <div className="p-3 bg-gray-100 rounded-lg text-sm space-y-1">
                  {filterLocation && (
                    <p className="text-gray-600">
                      Location: <span className="font-medium text-gray-900">{filterLocation}</span>
                    </p>
                  )}
                  {filterModel && (
                    <p className="text-gray-600">
                      Model: <span className="font-medium text-gray-900">{filterModel}</span>
                    </p>
                  )}
                  {filterOwner && (
                    <p className="text-gray-600">
                      Owner: <span className="font-medium text-gray-900">{filterOwner}</span>
                    </p>
                  )}
                  <p className="text-gray-600">
                    Selected: <span className="font-medium text-gray-900">{selectedIds.length}</span>
                  </p>
                </div>

                <p className="text-sm text-red-600 font-medium">
                  This action cannot be undone.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              className="w-full sm:w-auto mt-0"
              disabled={bulkDeleteLoading}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmBulkDelete();
              }}
              disabled={bulkDeleteLoading}
              className="bg-red-500 hover:bg-red-600 w-full sm:w-auto"
            >
              {bulkDeleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                `Delete ${selectedIds.length} Items`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}