/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import type * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { mutate } from "swr";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import api from "@/lib/api";
import Select from "react-select";

type Option = { value: string; label: string };

interface ProductFormProps {
  editData: any;
  setEditData: (data: any) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function ProductForm({
  editData,
  setEditData,
  open,
  setOpen,
}: ProductFormProps) {
  const submittingRef = useRef(false); // Prevent double submit

  // Field states
  const [ownerCode, setOwnerCode] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [unitModel, setUnitModel] = useState("");
  const [gmc, setGmc] = useState("");
  const [cbm, setCbm] = useState<number | "">("");
  const [width, setWidth] = useState<number | "">("");
  const [length, setLength] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [qtyPerCarton, setQtyPerCarton] = useState<number | "">("");
  const [user_def1, setUser_def1] = useState("");

  // Additional product fields
  const [itemCode2, setItemCode2] = useState("");
  const [itemCode3, setItemCode3] = useState("");
  const [pcsPerBox, setPcsPerBox] = useState<number | "">("");
  const [pcsPerDozen, setPcsPerDozen] = useState<number | "">("");
  const [pcsPerSet, setPcsPerSet] = useState<number | "">("");
  const [pcsPerPack, setPcsPerPack] = useState<number | "">("");
  const [pcsPerCase, setPcsPerCase] = useState<number | "">("");
  const [pcsPerGross, setPcsPerGross] = useState<number | "">("");
  const [cbmPerCarton, setCbmPerCarton] = useState<number | "">("");
  const [cbmPerPcs, setCbmPerPcs] = useState<number | "">("");
  const [tonagePerCarton, setTonagePerCarton] = useState<number | "">("");
  const [tonagePerPcs, setTonagePerPcs] = useState<number | "">("");

  const [color, setColor] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [groupCode, setGroupCode] = useState("");

  // UOM
  const [uomOptions, setUomOptions] = useState<Option[]>([]);
  const [selectedUom, setSelectedUom] = useState<Option | null>(null);

  // Category
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Option | null>(null);

  // Owner
  const [ownerOptions, setOwnerOptions] = useState<Option[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<Option | null>(null);

  // Flags YES/NO
  const yesNo: Option[] = useMemo(
    () => [
      { value: "Y", label: "YES" },
      { value: "N", label: "NO" },
    ],
    []
  );
  const [selectedSerial, setSelectedSerial] = useState<Option>(yesNo[1]);
  const [selectedWaranty, setSelectedWaranty] = useState<Option>(yesNo[1]);
  const [selectedAdaptor, setSelectedAdaptor] = useState<Option>(yesNo[1]);
  const [selectedManualBook, setSelectedManualBook] = useState<Option>(yesNo[1]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch UOMs & Owners on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [uomRes, ownerRes, categoryRes] = await Promise.all([
          api.get("/uoms", { withCredentials: true }),
          api.get("/owners", { withCredentials: true }),
          api.get("/categories", { withCredentials: true }),
        ]);

        if (uomRes.data?.success) {
          const opts: Option[] = (uomRes.data.data || []).map((u: any) => ({
            value: u.code,
            label: u.code,
          }));
          setUomOptions(opts);
          if (!editData && opts.length > 0) setSelectedUom(opts[0]);
        }

        if (ownerRes.data?.success) {
          setOwnerOptions(
            (ownerRes.data.data || []).map((o: any) => ({
              value: o.code,
              label: o.code,
            }))
          );
        }

        if (categoryRes.data?.success) {
          setCategoryOptions(
            (categoryRes.data.data || []).map((c: any) => ({
              value: c.code,
              label: c.code,
            }))
          );
        }

      } catch (err) {
        console.error("Failed to fetch options:", err);
      }
    };

    fetchOptions();
  }, []); // Only run on mount

  // Prefill when editing
  useEffect(() => {
    if (!open || !editData) return;

    setSelectedOwner({ value: editData.owner_code, label: editData.owner_code });
    setItemCode(editData.item_code || "");
    setItemName(editData.item_name || "");
    setUnitModel(editData.unit_model || "");
    setGmc(editData.barcode || editData.gmc || "");
    setCbm(typeof editData.cbm === "number" ? editData.cbm : "");
    setLength(typeof editData.length === "number" ? editData.length : "");
    setWidth(typeof editData.width === "number" ? editData.width : "");
    setHeight(typeof editData.height === "number" ? editData.height : "");
    setWeight(typeof editData.weight === "number" ? editData.weight : "");
    setColor(editData.color || "");
    setQtyPerCarton(typeof editData.qty_per_carton === "number" ? editData.qty_per_carton : "");
    setGroupCode(editData.group || "");
    setCategoryCode(editData.category || "");
    setUser_def1(editData.user_def1 || "");

    setItemCode2(editData.item_code2 || "");
    setItemCode3(editData.item_code3 || "");
    setPcsPerBox(typeof editData.pcs_per_box === "number" ? editData.pcs_per_box : "");
    setPcsPerDozen(typeof editData.pcs_per_dozen === "number" ? editData.pcs_per_dozen : "");
    setPcsPerSet(typeof editData.pcs_per_set === "number" ? editData.pcs_per_set : "");
    setPcsPerPack(typeof editData.pcs_per_pack === "number" ? editData.pcs_per_pack : "");
    setPcsPerCase(typeof editData.pcs_per_case === "number" ? editData.pcs_per_case : "");
    setPcsPerGross(typeof editData.pcs_per_gross === "number" ? editData.pcs_per_gross : "");
    setCbmPerCarton(typeof editData.cbm_per_carton === "number" ? editData.cbm_per_carton : "");
    setCbmPerPcs(typeof editData.cbm_per_pcs === "number" ? editData.cbm_per_pcs : "");
    setTonagePerCarton(typeof editData.tonnage_per_carton === "number" ? editData.tonnage_per_carton : "");
    setTonagePerPcs(typeof editData.tonnage_per_pcs === "number" ? editData.tonnage_per_pcs : "");

    const pick = (val?: string): Option => (val === "Y" ? yesNo[0] : yesNo[1]);
    setSelectedSerial(pick(editData.has_serial));
    setSelectedWaranty(pick(editData.has_waranty));
    setSelectedAdaptor(pick(editData.has_adaptor));
    setSelectedManualBook(pick(editData.manual_book));

    if (uomOptions.length > 0) {
      const found = uomOptions.find((o) => o.value === editData.uom);
      if (found) setSelectedUom(found);
    }

    if (categoryOptions.length > 0) {
      const found = categoryOptions.find((o) => o.value === editData.category);
      if (found) setSelectedCategory(found);
    }
  }, [open, editData, uomOptions, yesNo]);

  // Auto-calculate CBM from dimensions
  useEffect(() => {
    const l = typeof length === "number" ? length : 0;
    const w = typeof width === "number" ? width : 0;
    const h = typeof height === "number" ? height : 0;

    if (l > 0 && w > 0 && h > 0) {
      setCbm(Number(((l * w * h) / 1_000_000).toFixed(6)));
    } else {
      setCbm("");
    }
  }, [length, width, height]);

  const resetForm = () => {
    setError(null);
    setItemCode("");
    setItemName("");
    setUnitModel("");
    setGmc("");
    setCbm("");
    setHeight("");
    setWidth("");
    setLength("");
    setWeight("");
    setColor("");
    setGroupCode("");
    setCategoryCode("");
    setSelectedUom(uomOptions[0] ?? null);
    setSelectedOwner(null);
    setSelectedSerial(yesNo[1]);
    setSelectedWaranty(yesNo[1]);
    setSelectedAdaptor(yesNo[1]);
    setSelectedManualBook(yesNo[1]);
    setUser_def1("");
    setItemCode2("");
    setItemCode3("");
    setPcsPerBox("");
    setPcsPerDozen("");
    setPcsPerSet("");
    setPcsPerPack("");
    setPcsPerCase("");
    setPcsPerGross("");
    setCbmPerCarton("");
    setCbmPerPcs("");
    setTonagePerCarton("");
    setTonagePerPcs("");
    submittingRef.current = false;
    setSubmitting(false);
  };

  const handleCancel = () => {
    resetForm();
    setEditData?.(null);
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent double submission
    if (submittingRef.current) return;

    // Validate
    if (!itemCode || !itemName || !gmc || !selectedUom || !selectedOwner) {
      setError("Please fill in all required fields: Owner, ItemCode/SKU, Item Name, Barcode, dan UOM.");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        item_code: itemCode.toUpperCase(),
        item_name: itemName,
        unit_model: unitModel,
        gmc: gmc.toUpperCase(),
        cbm: cbm === "" ? 0 : Number(cbm),
        width: width === "" ? 0 : Number(width),
        length: length === "" ? 0 : Number(length),
        height: height === "" ? 0 : Number(height),
        weight: weight === "" ? 0 : Number(weight),
        color: color.toUpperCase(),
        // category: categoryCode.toUpperCase(),
        category: selectedCategory.value,
        group: groupCode.toUpperCase(),
        serial: selectedSerial.value,
        waranty: selectedWaranty.value,
        adaptor: selectedAdaptor.value,
        manual_book: selectedManualBook.value,
        uom: selectedUom.value,
        owner_code: selectedOwner.value,
        qty_per_carton: qtyPerCarton === "" ? 0 : Number(qtyPerCarton),
        user_def1: user_def1,
        item_code2: itemCode2.toUpperCase(),
        item_code3: itemCode3.toUpperCase(),
        pcs_per_box: pcsPerBox === "" ? 0 : Number(pcsPerBox),
        pcs_per_dozen: pcsPerDozen === "" ? 0 : Number(pcsPerDozen),
        pcs_per_set: pcsPerSet === "" ? 0 : Number(pcsPerSet),
        pcs_per_pack: pcsPerPack === "" ? 0 : Number(pcsPerPack),
        pcs_per_case: pcsPerCase === "" ? 0 : Number(pcsPerCase),
        pcs_per_gross: pcsPerGross === "" ? 0 : Number(pcsPerGross),
        cbm_per_carton: cbmPerCarton === "" ? 0 : Number(cbmPerCarton),
        cbm_per_pcs: cbmPerPcs === "" ? 0 : Number(cbmPerPcs),
        tonage_per_carton: tonagePerCarton === "" ? 0 : Number(tonagePerCarton),
        tonage_per_pcs: tonagePerPcs === "" ? 0 : Number(tonagePerPcs),
      };

      let response;
      if (editData) {
        response = await api.put(`/products/${editData.ID}`, payload, { withCredentials: true });
      } else {
        response = await api.post("/products", payload, { withCredentials: true });
      }

      if (response.status === 200 || response.status === 201) {
        await mutate("/products");
        resetForm();
        setEditData?.(null);
        setOpen(false);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Terjadi kesalahan, coba lagi nanti.";
      setError(msg);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: 36,
      borderColor: "hsl(var(--border))",
      background: "hsl(var(--background))",
      boxShadow: "none",
      ":hover": { borderColor: "hsl(var(--border))" },
    }),
    menu: (base: any) => ({ ...base, zIndex: 50 }),
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          resetForm();
          setEditData?.(null);
        }
        setOpen(next);
      }}
    >
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 bg-white">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{editData ? "Edit Item" : "Add New Item"}</DialogTitle>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardContent className="px-6 pb-0">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Owner */}
              <div className="flex flex-col gap-2">
                <Label>Owner <span className="text-red-500">*</span></Label>
                <Select
                  inputId="owner"
                  classNamePrefix="rs"
                  styles={selectStyles}
                  placeholder="Select owner"
                  options={ownerOptions}
                  value={selectedOwner}
                  onChange={(opt: any) => setSelectedOwner(opt)}
                  isClearable
                  isDisabled={!!editData}
                />
              </div>

              {/* Item Code */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="item-code">Item Code (SKU) <span className="text-red-500">*</span></Label>
                <Input
                  id="item-code"
                  value={itemCode}
                  onChange={(e) => !editData && setItemCode(e.target.value.toUpperCase())}
                  placeholder="Entry ItemCode/SKU"
                  readOnly={!!editData}
                  className={editData ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>

              {/* Item Name */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="item-name">Item Name <span className="text-red-500">*</span></Label>
                <Input
                  id="item-name"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Entry Item Name"
                />
              </div>

              {/* Unit Model */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="unit-model">Unit Model</Label>
                <Input
                  id="unit-model"
                  value={unitModel}
                  onChange={(e) => setUnitModel(e.target.value.toUpperCase())}
                  placeholder="Entry Unit Model"
                />
              </div>

              {/* Barcode / GMC */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="barcode">Ean / Barcode / GMC <span className="text-red-500">*</span></Label>
                <Input
                  id="barcode"
                  value={gmc}
                  onChange={(e) => setGmc(e.target.value.toUpperCase())}
                  placeholder="Entry Ean / Barcode / GMC"
                />
              </div>

              {/* Base UOM */}
              <div className="flex flex-col gap-2">
                <Label>Base UOM <span className="text-red-500">*</span></Label>
                <Select
                  inputId="uom"
                  classNamePrefix="rs"
                  styles={selectStyles}
                  placeholder="Select base UOM"
                  options={uomOptions}
                  value={selectedUom}
                  onChange={(opt: any) => setSelectedUom(opt)}
                />
              </div>

              {/* Group */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="group">Group</Label>
                <Input
                  id="group"
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                  placeholder="Entry Group"
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-2">
                <Label>Category <span className="text-red-500">*</span></Label>
                <Select
                  inputId="category"
                  classNamePrefix="rs"
                  styles={selectStyles}
                  placeholder="Select category"
                  options={categoryOptions}
                  value={selectedCategory}
                  onChange={(opt: any) => setSelectedCategory(opt)}
                />
              </div>


              {/* <div className="flex flex-col gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={categoryCode}
                  onChange={(e) => setCategoryCode(e.target.value.toUpperCase())}
                  placeholder="Entry Category"
                />
              </div> */}

              {/* Width */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="width">Width (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  inputMode="decimal"
                  value={width}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => setWidth(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="0.00"
                  min={0}
                  step="0.01"
                />
              </div>

              {/* Length */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="length">Length (cm)</Label>
                <Input
                  id="length"
                  type="number"
                  inputMode="decimal"
                  value={length}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => setLength(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="0.00"
                  min={0}
                  step="0.01"
                />
              </div>

              {/* Height */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  inputMode="decimal"
                  value={height}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => setHeight(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="0.00"
                  min={0}
                  step="0.01"
                />
              </div>

              {/* Weight */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  inputMode="decimal"
                  value={weight}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="0.00"
                  min={0}
                  step="0.01"
                />
              </div>

              {/* CBM (read-only, auto-calculated) */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="cbm">CBM <span className="text-xs text-muted-foreground">(auto)</span></Label>
                <Input
                  readOnly
                  id="cbm"
                  type="number"
                  value={cbm}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="Auto calculated"
                  className="bg-muted cursor-not-allowed"
                />
              </div>

              {/* Qty Per Carton */}
              {/* <div className="flex flex-col gap-2">
                <Label htmlFor="qtyPerCarton">Qty/Carton</Label>
                <Input
                  inputMode="numeric"
                  type="number"
                  value={qtyPerCarton}
                  onChange={(e) => setQtyPerCarton(e.target.value === "" ? "" : Number(e.target.value))}
                  onWheel={(e) => e.currentTarget.blur()}
                  id="qtyPerCarton"
                  placeholder="Entry Qty Per Carton (e.g. 12)"
                />
              </div> */}

              {/* Color */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value.toUpperCase())}
                  placeholder="Entry Color"
                />
              </div>

              {/* Flags */}
              <div className="flex flex-col gap-2">
                <Label>Serial Number</Label>
                <Select
                  inputId="serial"
                  classNamePrefix="rs"
                  styles={selectStyles}
                  options={yesNo}
                  value={selectedSerial}
                  onChange={(opt: any) => setSelectedSerial(opt)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Warranty</Label>
                <Select
                  inputId="waranty"
                  classNamePrefix="rs"
                  styles={selectStyles}
                  options={yesNo}
                  value={selectedWaranty}
                  onChange={(opt: any) => setSelectedWaranty(opt)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Adaptor</Label>
                <Select
                  inputId="adaptor"
                  classNamePrefix="rs"
                  styles={selectStyles}
                  options={yesNo}
                  value={selectedAdaptor}
                  onChange={(opt: any) => setSelectedAdaptor(opt)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Manual Book</Label>
                <Select
                  inputId="manualBook"
                  classNamePrefix="rs"
                  styles={selectStyles}
                  options={yesNo}
                  value={selectedManualBook}
                  onChange={(opt: any) => setSelectedManualBook(opt)}
                />
              </div>

              {/* Additional Product Fields */}
              <div className="md:col-span-2 mt-2 border-t pt-4">
                <h3 className="text-sm font-semibold text-slate-700">Additional Product Information</h3>
                <p className="text-xs text-muted-foreground mt-1">Optional alternate item codes, unit quantities, CBM and tonnage conversions.</p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="item-code2">Item Code 2</Label>
                <Input id="item-code2" value={itemCode2} onChange={(e) => setItemCode2(e.target.value.toUpperCase())} placeholder="Entry Item Code 2" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="item-code3">Item Code 3</Label>
                <Input id="item-code3" value={itemCode3} onChange={(e) => setItemCode3(e.target.value.toUpperCase())} placeholder="Entry Item Code 3" />
              </div>

              {[
                { id: "qty-per-carton", label: "Pcs Per Carton", value: qtyPerCarton, setter: setQtyPerCarton },
                { id: "pcs-per-box", label: "Pcs Per Box", value: pcsPerBox, setter: setPcsPerBox },
                { id: "pcs-per-dozen", label: "Pcs Per Dozen", value: pcsPerDozen, setter: setPcsPerDozen },
                { id: "pcs-per-set", label: "Pcs Per Set", value: pcsPerSet, setter: setPcsPerSet },
                { id: "pcs-per-pack", label: "Pcs Per Pack", value: pcsPerPack, setter: setPcsPerPack },
                { id: "pcs-per-case", label: "Pcs Per Case", value: pcsPerCase, setter: setPcsPerCase },
                { id: "pcs-per-gross", label: "Pcs Per Gross", value: pcsPerGross, setter: setPcsPerGross },
                { id: "cbm-per-carton", label: "CBM Per Carton", value: cbmPerCarton, setter: setCbmPerCarton },
                { id: "cbm-per-pcs", label: "CBM Per Pcs", value: cbmPerPcs, setter: setCbmPerPcs },
                { id: "tonage-per-carton", label: "Tonage Per Carton", value: tonagePerCarton, setter: setTonagePerCarton },
                { id: "tonage-per-pcs", label: "Tonage Per Pcs", value: tonagePerPcs, setter: setTonagePerPcs },
              ].map((field) => (
                <div className="flex flex-col gap-2" key={field.id}>
                  <Label htmlFor={field.id}>{field.label}</Label>
                  <Input
                    id={field.id}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    value={field.value}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) => field.setter(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
              ))}

              {/* User Def 1 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="user_def1">User Def 1</Label>
                <Input
                  id="user_def1"
                  value={user_def1}
                  onChange={(e) => setUser_def1(e.target.value)}
                  placeholder="Entry User Def 1"
                />
              </div>

              <div className="hidden md:block" />
            </form>
          </CardContent>

          <CardFooter className="px-6 py-6 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
            <Button variant="outline" onClick={handleCancel} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} type="button">
              {submitting ? "Saving..." : editData ? "Update" : "Add"}
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}