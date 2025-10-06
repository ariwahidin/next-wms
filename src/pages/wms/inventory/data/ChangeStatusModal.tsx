/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import eventBus from "@/utils/eventBus";
import api from "@/lib/api";
import { useEffect } from "react";

export type Item = {
  id?: number;
  barcode: string;
  item_code: string;
  item_name: string;
  location: string;
  category: string;
  rec_date: string;
  owner_code: string;
  whs_code: string;
  qa_status: string;
  qty_in?: number;
  qty_onhand?: number;
  qty_available?: number;
  qty_allocated?: number;
  qty_out?: number;
  cbm_pcs?: number;
  cbm_total?: number;
};

export type ChangeStatusPayload = {
  ids: number[];
  whs_code?: string;
  qa_status?: string;
  reason?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: Item[];
  onSuccess?: () => void;
  className?: string;
};

export default function ChangeStatusModal({
  open,
  onOpenChange,
  selectedItems,
  onSuccess,
  className,
}: Props) {
  const [whsCode, setWhsCode] = React.useState<string>("");
  const [qaStatus, setQaStatus] = React.useState<string>("");
  const [reason, setReason] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);
  const [whsOptions, setWhsOptions] = React.useState<string[]>([]);

  const ids = React.useMemo(
    () => selectedItems.map((it) => it.id),
    [selectedItems]
  );

  const reset = () => {
    setWhsCode("");
    setQaStatus("");
    setReason("");
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get("/warehouses", { withCredentials: true });
      if (response.data.success) {
        setWhsOptions(response.data.data.map((it: any) => it.code));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleClose = (val: boolean) => {
    if (!submitting) onOpenChange(val);
  };

  const handleConfirm = async () => {
    if (!whsCode && !qaStatus) {
      eventBus.emit("showAlert", {
        title: "Gagal",
        description: "Anda belum memilih status",
        type: "error",
      });
      return;
    }

    const dataToPost = {
      items: selectedItems,
      new_whs_code: whsCode || undefined,
      new_qa_status: qaStatus || undefined,
      new_reason: reason || undefined,
    };

    console.log(dataToPost);

    setSubmitting(true);
    try {
      const response = await api.post("/inventory/change", dataToPost, {
        withCredentials: true,
      });
      const data = await response.data;
      console.log(data);
      if (data.success) {
        eventBus.emit("showAlert", {
          title: "Success",
          description: data.message,
          type: "success",
        });
        reset();
        onOpenChange(false);
        onSuccess?.();
      }

    } catch (err: any) {
      eventBus.emit("showAlert", {
        title: "Gagal",
        description: err.message,
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn("sm:max-w-2xl bg-white", className)}>
        <DialogHeader>
          <DialogTitle>Change Status Confirmation</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="whsCode">WHS Code (new)</Label>
              <Select value={whsCode} onValueChange={setWhsCode}>
                <SelectTrigger aria-label="Select status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {whsOptions.map((whs) => (
                    <SelectItem key={whs} value={whs}>
                      {whs}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>QA Status (new)</Label>
              <Select value={qaStatus} onValueChange={setQaStatus}>
                <SelectTrigger aria-label="Select status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* <div className="space-y-2 md:col-span-1">
              <Label htmlFor="reason">Reason for Change</Label>
              <Textarea
                id="reason"
                placeholder="Optional, explain the reason for the change..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div> */}
          </div>

          <div className="space-y-2">
            <Label>Selected Item Summary</Label>
            <div className="rounded-md border">
              <div className="max-h-56 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="text-left">
                      <th className="px-3 py-2">Location</th>
                      <th className="px-3 py-2">WHS Code</th>
                      <th className="px-3 py-2">Item Code</th>
                      <th className="px-3 py-2">Barcode/GMC</th>
                      <th className="px-3 py-2">QA</th>
                      <th className="px-3 py-2 text-center">Qty Avail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((it) => (
                      <tr key={it.id} className="border-t">
                        <td className="px-3 py-2">{it.location}</td>
                        <td className="px-3 py-2">{it.whs_code}</td>
                        <td className="px-3 py-2">{it.item_code}</td>
                        <td className="px-3 py-2">{it.barcode}</td>
                        <td className="px-3 py-2">{it.qa_status}</td>
                        <td className="px-3 py-2 text-center">{it.qty_available}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-3 py-2 text-xs text-muted-foreground border-t">
                {ids.length} item selected
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => handleClose(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={submitting}>
            {submitting ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
