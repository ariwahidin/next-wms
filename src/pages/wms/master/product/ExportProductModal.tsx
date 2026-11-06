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
  qty_per_carton: number;
  item_code2: string;
  item_code3: string;
  pcs_per_box: number;
  pcs_per_dozen: number;
  pcs_per_set: number;
  pcs_per_pack: number;
  pcs_per_case: number;
  pcs_per_gross: number;
  cbm_per_carton: number;
  cbm_per_pcs: number;
  tonnage_per_carton: number;
  tonnage_per_pcs: number;
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

        // Keep this column order identical to the downloadable import template.
        // The export can therefore be used directly as an import workbook.
        const exportData = products.map((p) => ({
          ITEM_CODE: p.item_code ?? "",
          ITEM_NAME: p.item_name ?? "",
          UNIT_MODEL: p.unit_model ?? "",
          WIDTH_CM: p.width ?? 0,
          LENGTH_CM: p.length ?? 0,
          HEIGHT_CM: p.height ?? 0,
          EAN: p.gmc || p.barcode || "",
          WEIGHT_KG: p.weight ?? 0,
          COLOR: p.color ?? "",
          GROUP: p.group ?? "",
          CATEGORY: p.category ?? "",
          SERIAL: p.has_serial ?? "N",
          WARRANTY: p.has_waranty ?? "N",
          ADAPTOR: p.has_adaptor ?? "N",
          MANUAL_BOOK: p.manual_book ?? "N",
          UOM: p.uom ?? "",
          OWNER_CODE: p.owner_code ?? "",
          ITEM_CODE2: p.item_code2 ?? "",
          ITEM_CODE3: p.item_code3 ?? "",
          PCS_PER_BOX: p.pcs_per_box ?? 0,
          PCS_PER_DOZEN: p.pcs_per_dozen ?? 0,
          PCS_PER_SET: p.pcs_per_set ?? 0,
          PCS_PER_PACK: p.pcs_per_pack ?? 0,
          PCS_PER_CASE: p.pcs_per_case ?? 0,
          PCS_PER_GROSS: p.pcs_per_gross ?? 0,
          CBM_PER_CARTON: p.cbm_per_carton ?? 0,
          CBM_PER_PCS: p.cbm_per_pcs ?? 0,
          TONAGE_PER_CARTON: p.tonnage_per_carton ?? 0,
          TONAGE_PER_PCS: p.tonnage_per_pcs ?? 0,
          QTY_PER_CARTON: p.qty_per_carton ?? 0,
        }));

        const ws = utils.json_to_sheet(exportData);
        ws["!cols"] = [
          { wch: 18 }, // ITEM_CODE
          { wch: 35 }, // ITEM_NAME
          { wch: 18 }, // UNIT_MODEL
          { wch: 12 }, // WIDTH_CM
          { wch: 12 }, // LENGTH_CM
          { wch: 12 }, // HEIGHT_CM
          { wch: 18 }, // EAN
          { wch: 12 }, // WEIGHT_KG
          { wch: 14 }, // COLOR
          { wch: 18 }, // GROUP
          { wch: 18 }, // CATEGORY
          { wch: 12 }, // SERIAL
          { wch: 12 }, // WARRANTY
          { wch: 12 }, // ADAPTOR
          { wch: 14 }, // MANUAL_BOOK
          { wch: 10 }, // UOM
          { wch: 15 }, // OWNER_CODE
          { wch: 18 }, // ITEM_CODE2
          { wch: 18 }, // ITEM_CODE3
          { wch: 14 }, // PCS_PER_BOX
          { wch: 16 }, // PCS_PER_DOZEN
          { wch: 14 }, // PCS_PER_SET
          { wch: 14 }, // PCS_PER_PACK
          { wch: 14 }, // PCS_PER_CASE
          { wch: 15 }, // PCS_PER_GROSS
          { wch: 18 }, // CBM_PER_CARTON
          { wch: 15 }, // CBM_PER_PCS
          { wch: 20 }, // TONAGE_PER_CARTON
          { wch: 18 }, // TONAGE_PER_PCS
          { wch: 16 }, // QTY_PER_CARTON
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