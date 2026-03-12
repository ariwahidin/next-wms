// /* eslint-disable @typescript-eslint/no-unused-vars */
// "use client";

// /* eslint-disable @typescript-eslint/no-explicit-any */
// import type * as React from "react";
// import { useEffect, useMemo, useState } from "react";
// import { mutate } from "swr";
// import { AlertCircle } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardFooter } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";

// import api from "@/lib/api";
// import Select from "react-select";
// import type { ItemOptions } from "@/types/inbound";
// import { set } from "date-fns";

// type Option = { value: string; label: string };

// export default function ProductForm({
//   editData,
//   setEditData,
//   open,
//   setOpen,
// }: any) {
//   // Field states
//   const [ownerCode, setOwnerCode] = useState("");
//   const [itemCode, setItemCode] = useState("");
//   const [itemName, setItemName] = useState("");
//   // Gunakan gmc sebagai "Barcode" (mengikuti payload API yang dipakai sebelumnya)
//   const [gmc, setGmc] = useState("");
//   const [cbm, setCbm] = useState<number | "">("");
//   const [width, setWidth] = useState<number | "">("");
//   const [length, setLength] = useState<number | "">("");
//   const [height, setHeight] = useState<number | "">("");
//   const [weight, setWeight] = useState<number | "">("");
//   const [user_def1, setUser_def1] = useState("");
//   const toNumber = (v: number | "") => (v === "" ? 0 : v);
//   const [color, setColor] = useState<string>("");
//   const [categoryCode, setCategoryCode] = useState<string>("");
//   const [groupCode, setGroupCode] = useState<string>("");
//   const [groupOptions, setGroupOptions] = useState<ItemOptions[]>([
//     { value: "PROMO", label: "PROMO" },
//     { value: "BOOK", label: "BOOK" },
//     { value: "INSTR", label: "INSTR" },
//   ]);
//   const groupCodeSelected = useMemo<Option | null>(() => {
//     const found = groupOptions.find((c) => c.value === groupCode);
//     return found ? { value: found.value, label: found.label } : null;
//   }, [groupOptions, groupCode]);

//   // UOM
//   const [uomOptions, setUomOptions] = useState<Option[]>([]);
//   const [selectedUom, setSelectedUom] = useState<Option | null>(null);

//   // Owner
//   const [ownerOptions, setOwnerOptions] = useState<Option[]>([]);
//   const [selectedOwner, setSelectedOwner] = useState<Option | null>(null);

//   // Flags YES/NO
//   const yesNo: Option[] = useMemo(
//     () => [
//       { value: "Y", label: "YES" },
//       { value: "N", label: "NO" },
//     ],
//     []
//   );
//   const [selectedSerial, setSelectedSerial] = useState<Option>(yesNo[1]);
//   const [selectedWaranty, setSelectedWaranty] = useState<Option>(yesNo[1]);
//   const [selectedAdaptor, setSelectedAdaptor] = useState<Option>(yesNo[1]);
//   const [selectedManualBook, setSelectedManualBook] = useState<Option>(
//     yesNo[1]
//   );

//   // Error
//   const [error, setError] = useState<string | null>(null);

//   // Fetch UOMs
//   const fetchUoms = async () => {
//     try {
//       const res = await api.get("/uoms", { withCredentials: true });
//       return res.data;
//     } catch (err) {
//       console.log("Fetch UOM error:", err);
//       return { success: false, data: [] };
//     }
//   };

//   // Fetch Categories
//   const fetchCategories = async () => {
//     try {
//       const res = await api.get("/categories", { withCredentials: true });
//       return res.data;
//     } catch (err) {
//       console.log("[v0] Fetch Category error:", err);
//       return { success: false, data: [] };
//     }
//   };

//   // Fetch Owners
//   const fetchOwners = async () => {
//     try {
//       const res = await api.get("/owners", { withCredentials: true });
//       return res.data;
//     } catch (err) {
//       console.log("[v0] Fetch Owner error:", err);
//       return { success: false, data: [] };
//     }
//   };

//   useEffect(() => {
//     // parallel fetch
//     (async () => {
//       const [uomRes, catRes, ownerRes] = await Promise.all([
//         fetchUoms(),
//         fetchCategories(),
//         fetchOwners(),
//       ]);
//       if (uomRes?.success) {
//         const opts = (uomRes.data || []).map((u: any) => ({
//           value: u.code,
//           label: u.code,
//         }));
//         setUomOptions(opts);
//         // set default if not editing
//         if (!editData && opts.length > 0) setSelectedUom(opts[0]);
//       }

//       if (ownerRes?.success) {
//         setOwnerOptions(
//           (ownerRes.data || []).map((o: any) => ({
//             value: o.code,
//             label: o.code,
//           }))
//         );
//       }

//       // if (catRes?.success) {
//       //   setCategoryOptions(
//       //     (catRes.data || []).map((c: Category) => ({
//       //       value: c.code,
//       //       label: c.name,
//       //     }))
//       //   );
//       // }
//     })();
//   }, [editData]);

//   // Prefill when editing
//   useEffect(() => {
//     if (!editData) return;
//     console.log("Edit data:", editData);

//     setSelectedOwner({ value: editData.owner_code, label: editData.owner_code });
//     setItemCode(editData.item_code || "");
//     setItemName(editData.item_name || "");
//     setGmc(editData.barcode || editData.gmc || "");
//     setCbm(typeof editData.cbm === "number" ? editData.cbm : "");
//     setLength(typeof editData.length === "number" ? editData.length : "");
//     setWidth(typeof editData.width === "number" ? editData.width : "");
//     setHeight(typeof editData.height === "number" ? editData.height : "");
//     setWeight(typeof editData.weight === "number" ? editData.weight : "");
//     setColor(editData.color || "");

//     // group
//     if (editData.group) setGroupCode(editData.group);

//     // category
//     if (editData.category) setCategoryCode(editData.category);

//     // flags
//     const pick = (val?: string) => (val === "Y" ? yesNo[0] : yesNo[1]);
//     setSelectedSerial(pick(editData.has_serial ?? editData.serial));
//     setSelectedWaranty(pick(editData.has_waranty ?? editData.waranty));
//     setSelectedAdaptor(pick(editData.has_adaptor ?? editData.adaptor));
//     setSelectedManualBook(
//       pick(editData.has_manual_book ?? editData.manual_book)
//     );

//     // uom
//     if (uomOptions.length > 0) {
//       const found = uomOptions.find(
//         (o) => o.value === (editData.uom || editData.base_uom)
//       );
//       if (found) setSelectedUom(found);
//     }

//     // user def 1
//     setUser_def1(editData.user_def1 || "");
//   }, [editData, uomOptions, yesNo]);

//   const resetForm = () => {
//     setError(null);
//     setEditData?.(null);
//     setItemCode("");
//     setItemName("");
//     setGmc("");
//     setCbm("");
//     setHeight("");
//     setWidth("");
//     setLength("");
//     setWeight("");
//     setColor("");
//     setGroupCode("");
//     setCategoryCode("");
//     setSelectedUom(uomOptions[0] ?? null);
//     setSelectedSerial(yesNo[1]);
//     setSelectedWaranty(yesNo[1]);
//     setSelectedAdaptor(yesNo[1]);
//     setSelectedManualBook(yesNo[1]);
//     setUser_def1("");
//   };

//   const handleCancel = () => {
//     resetForm();
//     setOpen?.(false);
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // Validasi minimal
//     if (!itemCode || !itemName || !gmc || !selectedSerial || !selectedUom) {
//       setError(
//         "Harap isi field wajib: Item Code, Item Name, Barcode, Serial, dan UOM."
//       );
//       // Fokus ke field pertama yang kosong
//       if (!itemCode) {
//         document.getElementById("item-code")?.focus();
//       } else if (!itemName) {
//         document.getElementById("item-name")?.focus();
//       } else if (!gmc) {
//         document.getElementById("barcode")?.focus();
//       } else if (!selectedSerial) {
//         document.getElementById("serial")?.focus();
//       } else if (!selectedUom) {
//         document.getElementById("uom")?.focus();
//       }
//       return;
//     }

//     try {
//       setError(null);

//       const payload = {
//         item_code: itemCode,
//         item_name: itemName,
//         gmc, // backend sebelumnya menggunakan key gmc
//         cbm: cbm === "" ? 0 : Number(cbm),
//         width: width === "" ? 0 : Number(width),
//         length: length === "" ? 0 : Number(length),
//         height: height === "" ? 0 : Number(height),
//         weight: weight === "" ? 0 : Number(weight),
//         color,
//         category: categoryCode,
//         group: groupCode,
//         serial: selectedSerial.value,
//         waranty: selectedWaranty.value,
//         adaptor: selectedAdaptor.value,
//         manual_book: selectedManualBook.value,
//         uom: selectedUom.value,
//         owner_code: selectedOwner.value,
//         user_def1: user_def1,
//       };

//       let response;
//       if (editData) {
//         response = await api.put(`/products/${editData.ID}`, payload, {
//           withCredentials: true,
//         });
//       } else {
//         response = await api.post("/products", payload, { withCredentials: true });
//       }

//       // kalau sukses (status 200 atau 201)
//       if (response.status === 200 || response.status === 201) {
//         mutate("/products");
//         resetForm();
//         setOpen?.(false);
//       }

//       // if (editData) {
//       //   await api.put(`/products/${editData.ID}`, payload, {
//       //     withCredentials: true,
//       //   });
//       // } else {
//       //   await api.post("/products", payload, { withCredentials: true });
//       // }

//       // mutate("/products");
//       // resetForm();
//       // setOpen?.(false);
//     } catch (err: any) {
//       if (err?.response?.status === 400) {
//         setError("Data yang dimasukkan tidak valid.");
//       } else if (err?.response) {
//         setError("Terjadi kesalahan, coba lagi nanti.");
//       } else {
//         setError("Tidak ada respon dari server.");
//       }
//     }
//   };

//   // Styling untuk react-select agar tinggi konsisten dengan Input
//   const selectStyles = {
//     control: (base: any) => ({
//       ...base,
//       minHeight: 36,
//       borderColor: "hsl(var(--border))",
//       background: "hsl(var(--background))",
//       boxShadow: "none",
//       ":hover": { borderColor: "hsl(var(--border))" },
//     }),
//     menu: (base: any) => ({
//       ...base,
//       zIndex: 50,
//     }),
//   };

//   useEffect(() => {
//     const l = toNumber(length);
//     const w = toNumber(width);
//     const h = toNumber(height);

//     if (l > 0 && w > 0 && h > 0) {
//       const result = (l * w * h) / 1_000_000;
//       setCbm(Number(result.toFixed(6)));
//     } else {
//       setCbm("");
//     }
//   }, [length, width, height]);


//   return (
//     <Dialog
//       open={open}
//       onOpenChange={(next) => {
//         setOpen?.(next);
//         if (!next) resetForm();
//       }}
//     >
//       <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-white">
//         <DialogHeader className="px-6 pt-6">
//           <DialogTitle className="text-balance">
//             {editData ? "Edit Item" : "Add New Item"}
//           </DialogTitle>
//         </DialogHeader>

//         <Card className="border-0 shadow-none">
//           <CardContent className="px-6 pb-0">
//             {error && (
//               <Alert variant="destructive" className="mb-4">
//                 <AlertCircle className="h-4 w-4" />
//                 <AlertTitle>Error</AlertTitle>
//                 <AlertDescription>{error}</AlertDescription>
//               </Alert>
//             )}

//             <form
//               onSubmit={handleSubmit}
//               className="grid grid-cols-1 md:grid-cols-2 gap-4"
//             >

//               {/* Owner */}
//               <div className="flex flex-col gap-2">
//                 <Label htmlFor="Owner">Owner</Label>
//                 <Select
//                   inputId="owner"
//                   classNamePrefix="rs"
//                   styles={selectStyles}
//                   placeholder="Select owner"
//                   options={ownerOptions}
//                   value={selectedOwner}
//                   onChange={(opt: any) => setSelectedOwner(opt)}
//                   isClearable
//                 />

//                 {/* <Select
//                   inputId="uom"
//                   classNamePrefix="rs"
//                   styles={selectStyles}
//                   placeholder="Select base UOM"
//                   options={uomOptions}
//                   value={selectedUom}
//                   onChange={(opt: any) => setSelectedUom(opt)}
//                 /> */}
//               </div>

//               {/* Item Code */}
//               <div className="flex flex-col gap-2">
//                 <Label htmlFor="item-code">Item Code</Label>
//                 <Input
//                   id="item-code"
//                   value={itemCode}
//                   onChange={(e) => setItemCode(e.target.value)}
//                   aria-required
//                   aria-invalid={!!error && !itemCode}
//                   placeholder="Entry Item Code"
//                 />
//               </div>

//               {/* Item Name */}
//               <div className="flex flex-col gap-2">
//                 <Label htmlFor="item-name">Item Name</Label>
//                 <Input
//                   id="item-name"
//                   value={itemName}
//                   onChange={(e) => setItemName(e.target.value)}
//                   aria-required
//                   aria-invalid={!!error && !itemName}
//                   placeholder="Entry Item Name"
//                 />
//               </div>

//               {/* Barcode (gmc) */}
//               <div className="flex flex-col gap-2">
//                 <Label htmlFor="barcode">Ean / Barcode / GMC</Label>
//                 <Input
//                   id="barcode"
//                   value={gmc}
//                   onChange={(e) => setGmc(e.target.value)}
//                   aria-required
//                   aria-invalid={!!error && !gmc}
//                   placeholder="Entry Ean / Barcode / GMC"
//                 />
//               </div>

//               {/* Group */}
//               <div className="flex flex-col gap-2">
//                 <Label htmlFor="group">Group</Label>
//                 {/* <Select
//                   inputId="group"
//                   classNamePrefix="rs"
//                   styles={selectStyles}
//                   placeholder="Select group"
//                   options={groupOptions as Option[]}
//                   value={groupCodeSelected}
//                   onChange={(opt: any) => setGroupCode(opt?.value || "")}
//                   isClearable
//                 /> */}

//                 <Input
//                   id="group"
//                   value={groupCode}
//                   onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
//                   aria-required
//                   aria-invalid={!!error && !groupCode}
//                   placeholder="Entry Group"
//                 />
//               </div>

//               {/* Category */}
//               <div className="flex flex-col gap-2">
//                 <Label htmlFor="category">Category</Label>
//                 <Input
//                   id="category"
//                   value={categoryCode}
//                   onChange={(e) => setCategoryCode(e.target.value.toUpperCase())}
//                   aria-required
//                   aria-invalid={!!error && !categoryCode}
//                   placeholder="Entry Category"
//                 />
//               </div>

//               {/* Base UOM */}
//               <div className="flex flex-col gap-2">
//                 <Label htmlFor="uom">Base UOM</Label>
//                 <Select
//                   inputId="uom"
//                   classNamePrefix="rs"
//                   styles={selectStyles}
//                   placeholder="Select base UOM"
//                   options={uomOptions}
//                   value={selectedUom}
//                   onChange={(opt: any) => setSelectedUom(opt)}
//                 />
//               </div>

//               {/* Width */}
//               <div className="flex flex-col gap-2">
//                 <Label htmlFor="width">Width (cm)</Label>
//                 <Input
//                   id="width"
//                   type="number"
//                   inputMode="decimal"
//                   value={width}
//                   onChange={(e) =>
//                     setWidth(
//                       e.target.value === "" ? "" : Number(e.target.value)
//                     )
//                   }
//                   placeholder="0.00"
//                   min={0}
//                   step="0.01"
//                 />
//               </div>

//               {/* Length */}
//               <div className="flex flex-col gap-2">
//                 <Label htmlFor="length">Length (cm)</Label>
//                 <Input
//                   id="length"
//                   type="number"
//                   inputMode="decimal"
//                   value={length}
//                   onChange={(e) =>
//                     setLength(
//                       e.target.value === "" ? "" : Number(e.target.value)
//                     )
//                   }
//                   placeholder="0.00"
//                   min={0}
//                   step="0.01"
//                 />
//               </div>

//               {/* Height */}
//               <div className="flex flex-col gap-2">
//                 <Label htmlFor="height">Height (cm)</Label>
//                 <Input
//                   id="height"
//                   type="number"
//                   inputMode="decimal"
//                   value={height}
//                   onChange={(e) =>
//                     setHeight(
//                       e.target.value === "" ? "" : Number(e.target.value)
//                     )
//                   }
//                   placeholder="0.00"
//                   min={0}
//                   step="0.01"
//                 />
//               </div>

//               {/* Weight */}
//               <div className="flex flex-col gap-2">
//                 <Label htmlFor="weight">Weight (kg)</Label>
//                 <Input
//                   id="weight"
//                   type="number"
//                   inputMode="decimal"
//                   value={weight}
//                   onChange={(e) =>
//                     setWeight(
//                       e.target.value === "" ? "" : Number(e.target.value)
//                     )
//                   }
//                   placeholder="0.00"
//                   min={0}
//                   step="0.01"
//                 />
//               </div>

//               {/* CBM */}
//               <div className="flex flex-col gap-2">
//                 <Label htmlFor="cbm">CBM</Label>
//                 <Input
//                   readOnly
//                   id="cbm"
//                   type="number"
//                   inputMode="decimal"
//                   value={cbm}
//                   onChange={(e) =>
//                     setCbm(e.target.value === "" ? "" : Number(e.target.value))
//                   }
//                   placeholder="0.00"
//                   min={0}
//                   step="0.01"
//                 />
//               </div>

//               {/* Color */}
//               <div className="flex flex-col gap-2">
//                 <Label htmlFor="height">Color</Label>
//                 <Input
//                   id="color"
//                   type="text"
//                   value={color}
//                   onChange={(e) =>
//                     setColor(
//                       e.target.value === "" ? "" : e.target.value.toUpperCase()
//                     )
//                   }
//                   placeholder="Entry Color"
//                 />
//               </div>

//               {/* Flags */}
//               <div className="flex flex-col gap-2">
//                 <Label htmlFor="serial">Serial Number</Label>
//                 <Select
//                   inputId="serial"
//                   classNamePrefix="rs"
//                   styles={selectStyles}
//                   options={yesNo}
//                   value={selectedSerial}
//                   onChange={(opt: any) => setSelectedSerial(opt)}
//                 />
//               </div>

//               <div className="flex flex-col gap-2">
//                 <Label htmlFor="waranty">Waranty</Label>
//                 <Select
//                   inputId="waranty"
//                   classNamePrefix="rs"
//                   styles={selectStyles}
//                   options={yesNo}
//                   value={selectedWaranty}
//                   onChange={(opt: any) => setSelectedWaranty(opt)}
//                 />
//               </div>

//               <div className="flex flex-col gap-2">
//                 <Label htmlFor="adaptor">Adaptor</Label>
//                 <Select
//                   inputId="adaptor"
//                   classNamePrefix="rs"
//                   styles={selectStyles}
//                   options={yesNo}
//                   value={selectedAdaptor}
//                   onChange={(opt: any) => setSelectedAdaptor(opt)}
//                 />
//               </div>

//               <div className="flex flex-col gap-2">
//                 <Label htmlFor="manualBook">Manual Book</Label>
//                 <Select
//                   inputId="manualBook"
//                   classNamePrefix="rs"
//                   styles={selectStyles}
//                   options={yesNo}
//                   value={selectedManualBook}
//                   onChange={(opt: any) => setSelectedManualBook(opt)}
//                 />
//               </div>


//               {/* User Def 1 */}
//               <div className="flex flex-col gap-2">
//                 <Label htmlFor="user_def1">User Def 1</Label>
//                 <Input
//                   id="user_def1"
//                   type="text"
//                   value={user_def1}
//                   onChange={(e) => setUser_def1(e.target.value)}
//                   placeholder="Entry User Def 1"
//                 />
//               </div>

//               {/* Spacer for grid alignment */}
//               <div className="hidden md:block" />
//             </form>
//           </CardContent>

//           <CardFooter className="px-6 py-6 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
//             <Button variant="outline" onClick={handleCancel}>
//               Cancel
//             </Button>
//             <Button onClick={handleSubmit} type="submit">
//               {editData ? "Update" : "Add"}
//             </Button>
//           </CardFooter>
//         </Card>
//       </DialogContent>
//     </Dialog>
//   );
// }
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
  const [user_def1, setUser_def1] = useState("");
  const [color, setColor] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [groupCode, setGroupCode] = useState("");

  // UOM
  const [uomOptions, setUomOptions] = useState<Option[]>([]);
  const [selectedUom, setSelectedUom] = useState<Option | null>(null);

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
        const [uomRes, ownerRes] = await Promise.all([
          api.get("/uoms", { withCredentials: true }),
          api.get("/owners", { withCredentials: true }),
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
    setGroupCode(editData.group || "");
    setCategoryCode(editData.category || "");
    setUser_def1(editData.user_def1 || "");

    const pick = (val?: string): Option => (val === "Y" ? yesNo[0] : yesNo[1]);
    setSelectedSerial(pick(editData.has_serial));
    setSelectedWaranty(pick(editData.has_waranty));
    setSelectedAdaptor(pick(editData.has_adaptor));
    setSelectedManualBook(pick(editData.manual_book));

    if (uomOptions.length > 0) {
      const found = uomOptions.find((o) => o.value === editData.uom);
      if (found) setSelectedUom(found);
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
      setError("Harap isi field wajib: Owner, Item Code, Item Name, Barcode, dan UOM.");
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
        category: categoryCode.toUpperCase(),
        group: groupCode.toUpperCase(),
        serial: selectedSerial.value,
        waranty: selectedWaranty.value,
        adaptor: selectedAdaptor.value,
        manual_book: selectedManualBook.value,
        uom: selectedUom.value,
        owner_code: selectedOwner.value,
        user_def1: user_def1,
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-white">
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
                />
              </div>

              {/* Item Code */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="item-code">Item Code <span className="text-red-500">*</span></Label>
                <Input
                  id="item-code"
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value.toUpperCase())}
                  placeholder="Entry Item Code"
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
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={categoryCode}
                  onChange={(e) => setCategoryCode(e.target.value.toUpperCase())}
                  placeholder="Entry Category"
                />
              </div>

              {/* Width */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="width">Width (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  inputMode="decimal"
                  value={width}
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
                  placeholder="Auto calculated"
                  className="bg-muted cursor-not-allowed"
                />
              </div>

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