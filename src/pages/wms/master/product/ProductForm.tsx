/* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable react-hooks/exhaustive-deps */
// /* eslint-disable @typescript-eslint/no-unused-vars */
// import * as React from "react";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import api from "@/lib/api";
// import { mutate } from "swr";
// import { useEffect, useState } from "react";
// import { AlertCircle } from "lucide-react";
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { getEnabledCategories } from "trace_events";
// import Select from "react-select";
// import { ItemOptions } from "@/types/inbound";
// import { Category } from "@/types/category";
// import { set } from "date-fns";
// import { ca } from "date-fns/locale";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";

// export default function ProductForm({ editData, setEditData, open, setOpen }: any) {
//   // const [open, setOpen] = useState(false);
//   const [itemCode, setItemCode] = useState("");
//   const [itemName, setItemName] = useState("");
//   const [gmc, setGmc] = useState("");
//   const [error, setError] = useState<string | null>(null);
//   const [categoryOptions, setCategoryOptions] = useState<ItemOptions[]>([]);
//   const [group, setGroup] = useState(null);
//   const [category, setCategory] = useState("");
//   const [serialOptions, setSerialOptions] = useState([
//     { value: "Y", label: "YES" },
//     { value: "N", label: "NO" },
//   ]);
//   const [warantyOptions, setWarantyOptions] = useState([
//     { value: "Y", label: "YES" },
//     { value: "N", label: "NO" },
//   ]);
//   const [adaptorOptions, setAdaptorOptions] = useState([
//     { value: "Y", label: "YES" },
//     { value: "N", label: "NO" },
//   ]);
//   const [manualBookOptions, setManualBookOptions] = useState([
//     { value: "Y", label: "YES" },
//     { value: "N", label: "NO" },
//   ]);
//   const [selectedSerial, setSelectedSerial] = useState(serialOptions[1]);
//   const [selectedWaranty, setSelectedWaranty] = useState(warantyOptions[1]);
//   const [selectedAdaptor, setSelectedAdaptor] = useState(adaptorOptions[1]);
//   const [selectedManualBook, setSelectedManualBook] = useState(
//     manualBookOptions[1]
//   );

//   useEffect(() => {
//     if (editData) {
//       setItemCode(editData.item_code);
//       setItemName(editData.item_name);
//       setGmc(editData.barcode);
//       setCategory(editData.category);
//       setCbm(editData.cbm);
//       // categoryOptions.find((option) => {
//       //   if (option.value === editData.category) {
//       //     setCategory(option);
//       //   }
//       // });
//       serialOptions.find((option) => {
//         if (option.value === editData.has_serial) {
//           setSelectedSerial(option);
//         }
//       });

//       warantyOptions.find((option) => {
//         if (option.value === editData.has_waranty) {
//           setSelectedWaranty(option);
//         }
//       });

//       adaptorOptions.find((option) => {
//         if (option.value === editData.has_adaptor) {
//           setSelectedAdaptor(option);
//         }
//       });

//       manualBookOptions.find((option) => {
//         if (option.value === editData.has_manual_book) {
//           setSelectedManualBook(option);
//         }
//       });

//       uomOptions.find((option) => {
//         if (option.value === editData.uom) {
//           setSelectedUom(option);
//         }
//       });
//     }
//   }, [editData]);

//   const AllUOM = async () => {
//     try {
//       const response = await api.get("/uoms", { withCredentials: true });
//       return response.data;
//     } catch (error) {
//       console.log(error);
//     }
//   };
//   const [uoms, setUoms] = useState([]);
//   const [uomOptions, setUomOptions] = useState([]);
//   const [selectedUom, setSelectedUom] = useState(null);
//   const [cbm, setCbm] = useState(0);
//   useEffect(() => {
//     async function fetchData() {
//       const data = await AllUOM();
//       if (data.success) {
//         setUoms(data.data);
//         setUomOptions(
//           data.data.map((uom) => ({ value: uom.code, label: uom.code }))
//         );
//       }
//     }
//     fetchData();
//   }, []);

//   useEffect(() => {
//     const fetchCategories = async () => {
//       try {
//         const response = await api.get("/categories", {
//           withCredentials: true,
//         });
//         return response.data;
//       } catch (error) {
//         console.log(error);
//       }
//     };

//     fetchCategories().then((categories) => {
//       if (categories.success) {
//         setCategoryOptions(
//           categories.data.map((category: Category) => ({
//             value: category.code,
//             label: category.name,
//           }))
//         );
//       }
//     });
//   }, []);

//   useEffect(() => {
//     if (uoms.length > 0) {
//       setSelectedUom(uomOptions[0]);
//     }
//   }, [uoms]);

//   async function handleSubmit(e) {
//     e.preventDefault();

//     // Validasi form
//     if (!itemCode || !itemName || !gmc || !selectedSerial || !selectedUom) {
//       setError("Harap isi semua field.");
//       if (!itemCode) {
//         document.getElementById("itemCode")?.focus();
//       } else if (!itemName) {
//         document.getElementById("itemName")?.focus();
//       } else if (!gmc) {
//         console.log("Focus set to itemCode");
//         document.getElementById("gmc")?.focus();
//       } else if (!selectedSerial) {
//         console.log("Focus set to itemName");
//         document.getElementById("serial")?.focus();
//       } else if (!selectedUom) {
//         console.log("Focus set to gmc");
//         document.getElementById("uom")?.focus();
//       }
//       console.log("Focus set to serial");
//       return;
//     }
//     console.log("Focus set to uom");

//     try {
//       setError(null); // Reset error message jika form valid;

//       if (editData) {
//         await api.put(
//           `/products/${editData.ID}`, // ID produk dari editData
//           {
//             item_code: itemCode,
//             item_name: itemName,
//             gmc: gmc,
//             cbm: cbm,
//             category: category,
//             group: "Book",
//             serial: selectedSerial.value,
//             waranty: selectedWaranty.value,
//             adaptor: selectedAdaptor.value,
//             manual_book: selectedManualBook.value,
//             uom: selectedUom.value,
//           },
//           { withCredentials: true }
//         );
//       } else {
//         // 🔥 Tambah produk baru jika tidak sedang edit
//         await api.post(
//           "/products",
//           {
//             item_code: itemCode,
//             item_name: itemName,
//             gmc: gmc,
//             cbm: cbm,
//             category: category,
//             group: "Book",
//             serial: selectedSerial.value,
//             waranty: selectedWaranty.value,
//             adaptor: selectedAdaptor.value,
//             manual_book: selectedManualBook.value,
//             uom: selectedUom.value,
//           },
//           { withCredentials: true }
//         );
//       }

//       mutate("/products");
//     } catch (err: any) {
//       if (err.response) {
//         if (err.response.status === 400) {
//           setError("Data yang dimasukkan tidak valid.");
//         } else {
//           setError("Terjadi kesalahan, coba lagi nanti.");
//         }
//       } else {
//         setError("Tidak ada respon dari server.");
//       }
//     }
//   }

//   const handleKeyDown = (e) => {
//     if (e.key === "Enter") {
//       handleSubmit(e);
//     }
//   };

//   const handleCancel = () => {
//     setError(null);
//     setEditData(null);
//     setItemCode("");
//     setItemName("");
//     setGmc("");
//   };

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogContent className="max-w-3xl bg-white p-6">
//         <DialogHeader>
//           <DialogTitle>{editData ? "Edit item" : "Add new item"}</DialogTitle>
//         </DialogHeader>
//         <Card>
//           <CardHeader style={{ paddingBottom: "0" }}>
//             <CardDescription style={{ display: "none" }}></CardDescription>
//           </CardHeader>
//           <CardContent>
//             {error && (
//               <Alert variant="destructive" className="mb-4">
//                 <AlertCircle className="h-4 w-4" />
//                 <AlertTitle>Error</AlertTitle>
//                 <AlertDescription>{error}</AlertDescription>
//               </Alert>
//             )}
//             <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
//               <div className="grid w-full items-center gap-4">
//                 <div className="flex items-center gap-4">
//                   <Label
//                     className="w-24 text-left shrink-0"
//                     htmlFor="item_code"
//                   >
//                     Item Code
//                   </Label>
//                   <span className="shrink-0">:</span>
//                   <Input
//                     id="itemCode"
//                     onChange={(e) => setItemCode(e.target.value)}
//                     value={itemCode}
//                     placeholder=""
//                   />
//                 </div>
//                 <div className="flex items-center gap-4">
//                   <Label
//                     className="w-24 text-left shrink-0"
//                     htmlFor="item_name"
//                   >
//                     Item Name
//                   </Label>
//                   <span className="shrink-0">:</span>
//                   <Input
//                     id="itemName"
//                     onChange={(e) => setItemName(e.target.value)}
//                     value={itemName}
//                     placeholder=""
//                   />
//                 </div>
//                 <div className="flex items-center gap-4">
//                   <Label className="w-24 text-left shrink-0" htmlFor="gmc">
//                     Barcode
//                   </Label>
//                   <span className="shrink-0">:</span>
//                   <Input
//                     id="gmc"
//                     onChange={(e) => setGmc(e.target.value)}
//                     value={gmc}
//                     placeholder=""
//                   />
//                 </div>
//                 <div className="flex items-center gap-4">
//                   <Label className="w-24 text-left shrink-0">Group</Label>
//                   <span className="shrink-0">:</span>
//                   <Select
//                     // options={categoryOptions}
//                     // defaultValue={category}
//                     // onChange={(selectedOption) => {
//                     //   setCategory(selectedOption);
//                     // }}
//                     // value={category}
//                     placeholder="Select category"
//                   />
//                 </div>
//                 <div className="flex items-center gap-4">
//                   <Label className="w-24 text-left shrink-0" htmlFor="category">
//                     Category
//                   </Label>
//                   <span className="shrink-0">:</span>
//                   <Input
//                     id="category"
//                     onChange={(e) => setCategory(e.target.value.toUpperCase())}
//                     value={category}
//                     placeholder=""
//                   />
//                 </div>
//                 <div className="flex items-center gap-4">
//                   <Label className="w-24 text-left shrink-0">Base UOM</Label>
//                   <span className="shrink-0">:</span>
//                   <Select
//                     options={uomOptions}
//                     defaultValue={selectedUom}
//                     onChange={(selectedOption) =>
//                       setSelectedUom(selectedOption)
//                     }
//                     placeholder="Select base UOM"
//                     value={selectedUom}
//                   />
//                 </div>
//                 <div className="flex items-center gap-4">
//                   <Label className="w-24 text-left shrink-0">SN</Label>
//                   <span className="shrink-0">:</span>
//                   <Select
//                     options={serialOptions}
//                     defaultValue={selectedSerial}
//                     onChange={(selectedOption) =>
//                       setSelectedSerial(selectedOption)
//                     }
//                     value={selectedSerial}
//                     placeholder="Choose..."
//                   />
//                 </div>
//                 <div className="flex items-center gap-4">
//                   <Label className="w-24 text-left shrink-0">Waranty</Label>
//                   <span className="shrink-0">:</span>
//                   <Select
//                     options={warantyOptions}
//                     defaultValue={selectedWaranty}
//                     onChange={(selectedOption) =>
//                       setSelectedWaranty(selectedOption)
//                     }
//                     value={selectedWaranty}
//                     placeholder="Choose..."
//                   />
//                 </div>
//                 <div className="flex items-center gap-4">
//                   <Label className="w-24 text-left shrink-0">Adaptor</Label>
//                   <span className="shrink-0">:</span>
//                   <Select
//                     options={adaptorOptions}
//                     defaultValue={selectedAdaptor}
//                     onChange={(selectedOption) =>
//                       setSelectedAdaptor(selectedOption)
//                     }
//                     value={selectedAdaptor}
//                     placeholder="Choose..."
//                   />
//                 </div>
//                 <div className="flex items-center gap-4">
//                   <Label className="w-24 text-left shrink-0">Manual Book</Label>
//                   <span className="shrink-0">:</span>
//                   <Select
//                     options={manualBookOptions}
//                     defaultValue={selectedManualBook}
//                     onChange={(selectedOption) =>
//                       setSelectedManualBook(selectedOption)
//                     }
//                     value={selectedManualBook}
//                     placeholder="Choose..."
//                   />
//                 </div>
//                 <div className="flex items-center gap-4">
//                   <Label className="w-24 text-left shrink-0">CBM</Label>
//                   <span className="shrink-0">:</span>
//                   <Input
//                     id="cbm"
//                     onChange={(e) => setCbm(Number(e.target.value))}
//                     value={cbm}
//                     type="number"
//                     placeholder=""
//                   />
//                 </div>
//               </div>
//             </form>
//           </CardContent>
//           <CardFooter className="flex justify-between">
//             <Button variant="outline" onClick={handleCancel}>
//               Cancel
//             </Button>
//             <Button onClick={handleSubmit} type="submit">
//               {" "}
//               {editData ? "Update" : "Add"}
//             </Button>
//           </CardFooter>
//         </Card>
//       </DialogContent>
//     </Dialog>
//   );
// }

"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import type * as React from "react";
import { useEffect, useMemo, useState } from "react";
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
import type { ItemOptions } from "@/types/inbound";

type Option = { value: string; label: string };

export default function ProductForm({
  editData,
  setEditData,
  open,
  setOpen,
}: any) {
  // Field states
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  // Gunakan gmc sebagai "Barcode" (mengikuti payload API yang dipakai sebelumnya)
  const [gmc, setGmc] = useState("");
  const [cbm, setCbm] = useState<number | "">("");
  const [width, setWidth] = useState<number | "">("");
  const [length, setLength] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [categoryCode, setCategoryCode] = useState<string>("");
  const [groupCode, setGroupCode] = useState<string>("");
  const [groupOptions, setGroupOptions] = useState<ItemOptions[]>([
    { value: "PROMO", label: "PROMO" },
    { value: "BOOK", label: "BOOK" },
    { value: "INSTR", label: "INSTR" },
  ]);
  const groupCodeSelected = useMemo<Option | null>(() => {
    const found = groupOptions.find((c) => c.value === groupCode);
    return found ? { value: found.value, label: found.label } : null;
  }, [groupOptions, groupCode]);

  // UOM
  const [uomOptions, setUomOptions] = useState<Option[]>([]);
  const [selectedUom, setSelectedUom] = useState<Option | null>(null);

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
  const [selectedManualBook, setSelectedManualBook] = useState<Option>(
    yesNo[1]
  );

  // Error
  const [error, setError] = useState<string | null>(null);

  // Fetch UOMs
  const fetchUoms = async () => {
    try {
      const res = await api.get("/uoms", { withCredentials: true });
      return res.data;
    } catch (err) {
      console.log("[v0] Fetch UOM error:", err);
      return { success: false, data: [] };
    }
  };

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories", { withCredentials: true });
      return res.data;
    } catch (err) {
      console.log("[v0] Fetch Category error:", err);
      return { success: false, data: [] };
    }
  };

  useEffect(() => {
    // parallel fetch
    (async () => {
      const [uomRes, catRes] = await Promise.all([
        fetchUoms(),
        fetchCategories(),
      ]);
      if (uomRes?.success) {
        const opts = (uomRes.data || []).map((u: any) => ({
          value: u.code,
          label: u.code,
        }));
        setUomOptions(opts);
        // set default if not editing
        if (!editData && opts.length > 0) setSelectedUom(opts[0]);
      }
      // if (catRes?.success) {
      //   setCategoryOptions(
      //     (catRes.data || []).map((c: Category) => ({
      //       value: c.code,
      //       label: c.name,
      //     }))
      //   );
      // }
    })();
  }, [editData]);

  // Prefill when editing
  useEffect(() => {
    if (!editData) return;
    console.log("Edit data:", editData);

    setItemCode(editData.item_code || "");
    setItemName(editData.item_name || "");
    setGmc(editData.barcode || editData.gmc || "");
    setCbm(typeof editData.cbm === "number" ? editData.cbm : "");
    setLength(typeof editData.length === "number" ? editData.length : "");
    setWidth(typeof editData.width === "number" ? editData.width : "");
    setHeight(typeof editData.height === "number" ? editData.height : "");

    // group
    if (editData.group) setGroupCode(editData.group);

    // category
    if (editData.category) setCategoryCode(editData.category);

    // flags
    const pick = (val?: string) => (val === "Y" ? yesNo[0] : yesNo[1]);
    setSelectedSerial(pick(editData.has_serial ?? editData.serial));
    setSelectedWaranty(pick(editData.has_waranty ?? editData.waranty));
    setSelectedAdaptor(pick(editData.has_adaptor ?? editData.adaptor));
    setSelectedManualBook(
      pick(editData.has_manual_book ?? editData.manual_book)
    );

    // uom
    if (uomOptions.length > 0) {
      const found = uomOptions.find(
        (o) => o.value === (editData.uom || editData.base_uom)
      );
      if (found) setSelectedUom(found);
    }
  }, [editData, uomOptions, yesNo]);

  const resetForm = () => {
    setError(null);
    setEditData?.(null);
    setItemCode("");
    setItemName("");
    setGmc("");
    setCbm("");
    setHeight("");
    setWidth("");
    setLength("");
    setGroupCode("");
    setCategoryCode("");
    setSelectedUom(uomOptions[0] ?? null);
    setSelectedSerial(yesNo[1]);
    setSelectedWaranty(yesNo[1]);
    setSelectedAdaptor(yesNo[1]);
    setSelectedManualBook(yesNo[1]);
  };

  const handleCancel = () => {
    resetForm();
    setOpen?.(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi minimal
    if (!itemCode || !itemName || !gmc || !selectedSerial || !selectedUom) {
      setError(
        "Harap isi field wajib: Item Code, Item Name, Barcode, Serial, dan UOM."
      );
      // Fokus ke field pertama yang kosong
      if (!itemCode) {
        document.getElementById("item-code")?.focus();
      } else if (!itemName) {
        document.getElementById("item-name")?.focus();
      } else if (!gmc) {
        document.getElementById("barcode")?.focus();
      } else if (!selectedSerial) {
        document.getElementById("serial")?.focus();
      } else if (!selectedUom) {
        document.getElementById("uom")?.focus();
      }
      return;
    }

    try {
      setError(null);

      const payload = {
        item_code: itemCode,
        item_name: itemName,
        gmc, // backend sebelumnya menggunakan key gmc
        cbm: cbm === "" ? 0 : Number(cbm),
        width: width === "" ? 0 : Number(width),
        length: length === "" ? 0 : Number(length),
        height: height === "" ? 0 : Number(height),
        category: categoryCode,
        group: groupCode,
        serial: selectedSerial.value,
        waranty: selectedWaranty.value,
        adaptor: selectedAdaptor.value,
        manual_book: selectedManualBook.value,
        uom: selectedUom.value,
        owner_code : "YMID"
      };

      if (editData) {
        await api.put(`/products/${editData.ID}`, payload, {
          withCredentials: true,
        });
      } else {
        await api.post("/products", payload, { withCredentials: true });
      }

      mutate("/products");
      resetForm();
      setOpen?.(false);
    } catch (err: any) {
      if (err?.response?.status === 400) {
        setError("Data yang dimasukkan tidak valid.");
      } else if (err?.response) {
        setError("Terjadi kesalahan, coba lagi nanti.");
      } else {
        setError("Tidak ada respon dari server.");
      }
    }
  };

  // Styling untuk react-select agar tinggi konsisten dengan Input
  const selectStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: 36,
      borderColor: "hsl(var(--border))",
      background: "hsl(var(--background))",
      boxShadow: "none",
      ":hover": { borderColor: "hsl(var(--border))" },
    }),
    menu: (base: any) => ({
      ...base,
      zIndex: 50,
    }),
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen?.(next);
        if (!next) resetForm();
      }}
    >
      <DialogContent className="max-w-3xl p-0 bg-white">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-balance">
            {editData ? "Edit Item" : "Add New Item"}
          </DialogTitle>
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
              {/* Item Code */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="item-code">Item Code</Label>
                <Input
                  id="item-code"
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value)}
                  aria-required
                  aria-invalid={!!error && !itemCode}
                  placeholder="Contoh: ITM-001"
                />
              </div>

              {/* Item Name */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="item-name">Item Name</Label>
                <Input
                  id="item-name"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  aria-required
                  aria-invalid={!!error && !itemName}
                  placeholder="Entry Item Name"
                />
              </div>

              {/* Barcode (gmc) */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={gmc}
                  onChange={(e) => setGmc(e.target.value)}
                  aria-required
                  aria-invalid={!!error && !gmc}
                  placeholder="Barcode / GMC"
                />
              </div>

              {/* Group */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="category">Group</Label>
                <Select
                  inputId="category"
                  classNamePrefix="rs"
                  styles={selectStyles}
                  placeholder="Select group"
                  options={groupOptions as Option[]}
                  value={groupCodeSelected}
                  onChange={(opt: any) => setGroupCode(opt?.value || "")}
                  isClearable
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={categoryCode}
                  onChange={(e) => setCategoryCode(e.target.value.toUpperCase())}
                  aria-required
                  aria-invalid={!!error && !categoryCode}
                  placeholder="Category"
                />
              </div>

              {/* Base UOM */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="uom">Base UOM</Label>
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

              {/* CBM */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="cbm">CBM</Label>
                <Input
                  id="cbm"
                  type="number"
                  inputMode="decimal"
                  value={cbm}
                  onChange={(e) =>
                    setCbm(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="0.00"
                  min={0}
                  step="0.01"
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
                  onChange={(e) =>
                    setWidth(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
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
                  onChange={(e) =>
                    setLength(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
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
                  onChange={(e) =>
                    setHeight(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  placeholder="0.00"
                  min={0}
                  step="0.01"
                />
              </div>

              {/* Flags */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="serial">Serial Number</Label>
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
                <Label htmlFor="waranty">Waranty</Label>
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
                <Label htmlFor="adaptor">Adaptor</Label>
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
                <Label htmlFor="manualBook">Manual Book</Label>
                <Select
                  inputId="manualBook"
                  classNamePrefix="rs"
                  styles={selectStyles}
                  options={yesNo}
                  value={selectedManualBook}
                  onChange={(opt: any) => setSelectedManualBook(opt)}
                />
              </div>

              {/* Spacer for grid alignment */}
              <div className="hidden md:block" />
            </form>
          </CardContent>

          <CardFooter className="px-6 py-6 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} type="submit">
              {editData ? "Update" : "Add"}
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
