// // components/ExportProductModal.tsx
// "use client";

// import { useState, useEffect } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Label } from "@/components/ui/label";
// import { Download, Loader2 } from "lucide-react";
// import api from "@/lib/api";
// import { utils, writeFile } from "xlsx";
// import { toast } from "sonner";

// interface ExportProductModalProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
// }

// interface Product {
//   ID: number;
//   product_number: number;
//   owner_code: string;
//   item_code: string;
//   item_name: string;
//   barcode: string;
//   gmc: string;
//   width: number;
//   length: number;
//   height: number;
//   weight: number;
//   color: string;
//   uom: string;
//   cbm: number;
//   group: string;
//   category: string;
//   has_waranty: string;
//   has_serial: string;
//   manual_book: string;
//   has_adaptor: string;
//   remarks: string;
//   CreatedAt: string;
// }

// export default function ExportProductModal({
//   open,
//   onOpenChange,
// }: ExportProductModalProps) {
//   const [ownerCodes, setOwnerCodes] = useState<string[]>([]);
//   const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [fetchingOwners, setFetchingOwners] = useState(false);
//   const [selectAll, setSelectAll] = useState(false);

//   useEffect(() => {
//     if (open) {
//       fetchOwnerCodes();
//     } else {
//       setSelectedOwners([]);
//       setSelectAll(false);
//     }
//   }, [open]);

//   const fetchOwnerCodes = async () => {
//     setFetchingOwners(true);
//     try {
//       const response = await api.get("/products/owner-codes", {
//         withCredentials: true,
//       });
//       if (response.data.success) {
//         setOwnerCodes(response.data.data || []);
//       }
//     } catch (error) {
//       console.error("Failed to fetch owner codes:", error);
//       toast.error("Failed to load owner codes");
//     } finally {
//       setFetchingOwners(false);
//     }
//   };

//   const handleOwnerToggle = (ownerCode: string) => {
//     setSelectedOwners((prev) =>
//       prev.includes(ownerCode)
//         ? prev.filter((code) => code !== ownerCode)
//         : [...prev, ownerCode]
//     );
//   };

//   const handleSelectAll = () => {
//     if (selectAll) {
//       setSelectedOwners([]);
//     } else {
//       setSelectedOwners([...ownerCodes]);
//     }
//     setSelectAll(!selectAll);
//   };

//   useEffect(() => {
//     setSelectAll(
//       ownerCodes.length > 0 && selectedOwners.length === ownerCodes.length
//     );
//   }, [selectedOwners, ownerCodes]);

//   const handleExport = async () => {
//     if (selectedOwners.length === 0) {
//       toast.error("Please select at least one owner");
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await api.post(
//         "/products/export",
//         { owner_codes: selectedOwners },
//         { withCredentials: true }
//       );

//       if (response.data.success) {
//         const products: Product[] = response.data.data;

//         if (products.length === 0) {
//           toast.error("No data found for selected owners");
//           return;
//         }

//         const exportData = products.map((product, index) => ({
//           No: index + 1,
//           "Product Number": product.product_number,
//           "Owner Code": product.owner_code,
//           "Item Code": product.item_code,
//           "Item Name": product.item_name,
//           "Barcode": product.barcode,
//           "GMC": product.gmc,
//           "UoM": product.uom,
//           "Group": product.group,
//           "Category": product.category,
//           "Width (cm)": product.width,
//           "Length (cm)": product.length,
//           "Height (cm)": product.height,
//           "Weight (kg)": product.weight,
//           "CBM": product.cbm,
//           "Color": product.color,
//           "Has Serial": product.has_serial,
//           "Has Waranty": product.has_waranty,
//           "Has Adaptor": product.has_adaptor,
//           "Manual Book": product.manual_book,
//           "Remarks": product.remarks,
//           "Created At": new Date(product.CreatedAt).toLocaleString("id-ID"),
//         }));

//         const ws = utils.json_to_sheet(exportData);

//         const colWidths = [
//           { wch: 5 },  // No
//           { wch: 15 }, // Product Number
//           { wch: 12 }, // Owner Code
//           { wch: 15 }, // Item Code
//           { wch: 35 }, // Item Name
//           { wch: 15 }, // Barcode
//           { wch: 15 }, // GMC
//           { wch: 8 },  // UoM
//           { wch: 15 }, // Group
//           { wch: 15 }, // Category
//           { wch: 12 }, // Width
//           { wch: 12 }, // Length
//           { wch: 12 }, // Height
//           { wch: 12 }, // Weight
//           { wch: 10 }, // CBM
//           { wch: 12 }, // Color
//           { wch: 12 }, // Has Serial
//           { wch: 12 }, // Has Waranty
//           { wch: 12 }, // Has Adaptor
//           { wch: 12 }, // Manual Book
//           { wch: 25 }, // Remarks
//           { wch: 20 }, // Created At
//         ];
//         ws["!cols"] = colWidths;

//         const wb = utils.book_new();
//         utils.book_append_sheet(wb, ws, "Products");

//         const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
//         const filename = `Products_Export_${timestamp}.xlsx`;

//         writeFile(wb, filename);

//         toast.success(`Successfully exported ${products.length} products`);
//         onOpenChange(false);
//       }
//     } catch (error) {
//       console.error("Failed to export products:", error);
//       toast.error("Failed to export data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[500px] bg-white">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             <Download className="h-5 w-5" />
//             Export Products to Excel
//           </DialogTitle>
//           <DialogDescription>
//             Select owner codes to export. You can select multiple owners.
//           </DialogDescription>
//         </DialogHeader>

//         <div className="py-4">
//           {fetchingOwners ? (
//             <div className="flex items-center justify-center py-8">
//               <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
//             </div>
//           ) : ownerCodes.length === 0 ? (
//             <div className="text-center py-8 text-muted-foreground">
//               No owner codes found
//             </div>
//           ) : (
//             <>
//               <div className="flex items-center justify-between mb-3 pb-3 border-b">
//                 <Label className="text-sm font-medium">Owner Codes</Label>
//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   onClick={handleSelectAll}
//                   className="h-8"
//                 >
//                   {selectAll ? "Deselect All" : "Select All"}
//                 </Button>
//               </div>

//               <div className="max-h-[300px] overflow-y-auto space-y-3 px-1">
//                 {ownerCodes.map((ownerCode) => (
//                   <div
//                     key={ownerCode}
//                     className="flex items-center space-x-3 hover:bg-accent rounded-md p-2 transition-colors"
//                   >
//                     <Checkbox
//                       id={`owner-${ownerCode}`}
//                       checked={selectedOwners.includes(ownerCode)}
//                       onCheckedChange={() => handleOwnerToggle(ownerCode)}
//                     />
//                     <Label
//                       htmlFor={`owner-${ownerCode}`}
//                       className="flex-1 cursor-pointer font-normal"
//                     >
//                       {ownerCode}
//                     </Label>
//                   </div>
//                 ))}
//               </div>

//               {selectedOwners.length > 0 && (
//                 <div className="mt-4 pt-3 border-t">
//                   <p className="text-sm text-muted-foreground">
//                     Selected: <span className="font-medium text-foreground">{selectedOwners.length}</span> owner
//                     {selectedOwners.length !== 1 && "s"}
//                   </p>
//                 </div>
//               )}
//             </>
//           )}
//         </div>

//         <DialogFooter>
//           <Button
//             type="button"
//             variant="outline"
//             onClick={() => onOpenChange(false)}
//             disabled={loading}
//           >
//             Cancel
//           </Button>
//           <Button
//             type="button"
//             onClick={handleExport}
//             disabled={loading || selectedOwners.length === 0}
//             className="bg-green-600 hover:bg-green-700"
//           >
//             {loading ? (
//               <>
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 Exporting...
//               </>
//             ) : (
//               <>
//                 <Download className="mr-2 h-4 w-4" />
//                 Export Excel
//               </>
//             )}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }

// components/ExportProductModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { utils, writeFile } from "xlsx";
import { toast } from "sonner";

interface ExportProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Product {
  ID: number;
  product_number: number;
  owner_code: string;
  item_code: string;
  item_name: string;
  unit_model: string;
  barcode: string;
  gmc: string;
  width: number;
  length: number;
  height: number;
  weight: number;
  color: string;
  uom: string;
  cbm: number;
  group: string;
  category: string;
  has_waranty: string;
  has_serial: string;
  manual_book: string;
  has_adaptor: string;
  remarks: string;
  user_def1: string;
  CreatedAt: string;
}

export default function ExportProductModal({
  open,
  onOpenChange,
}: ExportProductModalProps) {
  const [ownerCodes, setOwnerCodes] = useState<string[]>([]);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingOwners, setFetchingOwners] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (open) {
      fetchOwnerCodes();
    } else {
      setSelectedOwners([]);
      setSelectAll(false);
    }
  }, [open]);

  const fetchOwnerCodes = async () => {
    setFetchingOwners(true);
    try {
      const response = await api.get("/products/owner-codes", { withCredentials: true });
      if (response.data.success) {
        setOwnerCodes(response.data.data || []);
      }
    } catch (error) {
      toast.error("Failed to load owner codes");
    } finally {
      setFetchingOwners(false);
    }
  };

  const handleOwnerToggle = (ownerCode: string) => {
    setSelectedOwners((prev) =>
      prev.includes(ownerCode) ? prev.filter((c) => c !== ownerCode) : [...prev, ownerCode]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedOwners([]);
    } else {
      setSelectedOwners([...ownerCodes]);
    }
    setSelectAll(!selectAll);
  };

  useEffect(() => {
    setSelectAll(ownerCodes.length > 0 && selectedOwners.length === ownerCodes.length);
  }, [selectedOwners, ownerCodes]);

  const handleExport = async () => {
    if (selectedOwners.length === 0 || loading) return;

    setLoading(true);
    try {
      const response = await api.post(
        "/products/export",
        { owner_codes: selectedOwners },
        { withCredentials: true }
      );

      if (response.data.success) {
        const products: Product[] = response.data.data;

        if (products.length === 0) {
          toast.error("No data found for selected owners");
          return;
        }

        const exportData = products.map((p, index) => ({
          No: index + 1,
          "Product Number": p.product_number,
          "Owner Code": p.owner_code,
          "Item Code": p.item_code,
          "Item Name": p.item_name,
          "Unit Model": p.unit_model,
          "Barcode": p.barcode,
          "GMC": p.gmc,
          "UoM": p.uom,
          "Group": p.group,
          "Category": p.category,
          "Width (cm)": p.width,
          "Length (cm)": p.length,
          "Height (cm)": p.height,
          "Weight (kg)": p.weight,
          "CBM": p.cbm,
          "Color": p.color,
          "Has Serial": p.has_serial,
          "Has Warranty": p.has_waranty,
          "Has Adaptor": p.has_adaptor,
          "Manual Book": p.manual_book,
          "User Def 1": p.user_def1,
          "Remarks": p.remarks,
          "Created At": new Date(p.CreatedAt).toLocaleString("id-ID"),
        }));

        const ws = utils.json_to_sheet(exportData);
        ws["!cols"] = [
          { wch: 5 },   // No
          { wch: 15 },  // Product Number
          { wch: 12 },  // Owner Code
          { wch: 15 },  // Item Code
          { wch: 35 },  // Item Name
          { wch: 18 },  // Unit Model
          { wch: 15 },  // Barcode
          { wch: 15 },  // GMC
          { wch: 8 },   // UoM
          { wch: 15 },  // Group
          { wch: 15 },  // Category
          { wch: 12 },  // Width
          { wch: 12 },  // Length
          { wch: 12 },  // Height
          { wch: 12 },  // Weight
          { wch: 10 },  // CBM
          { wch: 12 },  // Color
          { wch: 12 },  // Has Serial
          { wch: 14 },  // Has Warranty
          { wch: 12 },  // Has Adaptor
          { wch: 12 },  // Manual Book
          { wch: 15 },  // User Def 1
          { wch: 25 },  // Remarks
          { wch: 20 },  // Created At
        ];

        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Products");

        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
        writeFile(wb, `Products_Export_${timestamp}.xlsx`);

        toast.success(`Successfully exported ${products.length} products`);
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("Failed to export data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Products to Excel
          </DialogTitle>
          <DialogDescription>
            Select owner codes to export. You can select multiple owners.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {fetchingOwners ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : ownerCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No owner codes found</div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3 pb-3 border-b">
                <Label className="text-sm font-medium">Owner Codes</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleSelectAll} className="h-8">
                  {selectAll ? "Deselect All" : "Select All"}
                </Button>
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-3 px-1">
                {ownerCodes.map((ownerCode) => (
                  <div
                    key={ownerCode}
                    className="flex items-center space-x-3 hover:bg-accent rounded-md p-2 transition-colors"
                  >
                    <Checkbox
                      id={`owner-${ownerCode}`}
                      checked={selectedOwners.includes(ownerCode)}
                      onCheckedChange={() => handleOwnerToggle(ownerCode)}
                    />
                    <Label htmlFor={`owner-${ownerCode}`} className="flex-1 cursor-pointer font-normal">
                      {ownerCode}
                    </Label>
                  </div>
                ))}
              </div>

              {selectedOwners.length > 0 && (
                <div className="mt-4 pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Selected: <span className="font-medium text-foreground">{selectedOwners.length}</span>{" "}
                    owner{selectedOwners.length !== 1 && "s"}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={loading || selectedOwners.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}