import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ItemReceived } from "@/types/inbound";
import dayjs from "dayjs";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";
import { Loader2 } from "lucide-react";

interface ItemScannedTableProps {
  itemsReceived: ItemReceived[];
}

const ItemScannedTable: React.FC<ItemScannedTableProps> = ({
  itemsReceived,
}) => {
  console.log("Items Received:", itemsReceived);

  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [clicked, setClicked] = useState(false);

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setSelectedItems(
      newSelectAll
        ? itemsReceived
            .filter((item) => item.status === "pending")
            .map((item) => item.ID)
        : []
    );
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const confirmPutaway = () => {
    setShowModal(true);
  };

  const handleConfirm = async () => {
    console.log("Confirming putaway for items:", selectedItems);
    if (clicked) return; // blokir klik kedua
    setClicked(true);
    setIsLoading(true);
    try {
      const res = await api.post(
        `/inbound/putaway-bulk`,
        { item_ids: selectedItems },
        { withCredentials: true }
      );
      console.log("Success:", res.data);
      eventBus.emit("showAlert", {
        title: "Success!",
        description: res.data.message,
        type: "success",
      });
      eventBus.emit("refreshData");
      setShowModal(false);
      setSelectedItems([]);
      setIsLoading(false);
    } catch (err) {
      console.error("Error:", err.response?.data || err.message);
      eventBus.emit("showAlert", {
        title: "Error",
        description: err.response?.data.message || "An error occurred",
        type: "error",
      });
      setIsLoading(false);
    } finally {
      setIsLoading(false);
      setClicked(false); // kalau mau bisa klik lagi nanti
    }
  };

  const totalQty = itemsReceived.reduce(
    (acc, item) => acc + Number(item.quantity),
    0
  );

  return (
    <div className="space-y-4 mt-4 mb-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Received Items</h2>
        {selectedItems.length > 0 && (
          <div>
            <Button
              onClick={confirmPutaway}
              disabled={isLoading || selectedItems.length === 0}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Processing..." : "Putaway Confirm"}
            </Button>
          </div>
        )}
      </div>

      <Table className="border rounded-md">
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox checked={selectAll} onCheckedChange={toggleSelectAll} />
            </TableHead>
            <TableHead>No</TableHead>
            <TableHead>Item Code</TableHead>
            <TableHead>Barcode</TableHead>
            <TableHead>Serial Number</TableHead>
            <TableHead>Received Location</TableHead>
            <TableHead>Whs Code</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {itemsReceived.map((item, index) => (
            <TableRow key={item.ID}>
              <TableCell>
                {item.status == "pending" && (
                  <Checkbox
                    checked={selectedItems.includes(item.ID)}
                    onCheckedChange={() => toggleSelectItem(item.ID)}
                  />
                )}
              </TableCell>
              <TableCell className="text-sm">{index + 1}</TableCell>
              <TableCell className="text-sm">{item.item_code}</TableCell>
              <TableCell className="text-sm">{item.barcode}</TableCell>
              <TableCell className="text-sm">{item.serial_number}</TableCell>
              <TableCell className="text-sm">{item.location}</TableCell>
              <TableCell className="text-sm">{item.whs_code}</TableCell>
              <TableCell className="text-sm">{item.status}</TableCell>
              <TableCell className="text-sm">{item.quantity}</TableCell>
              <TableCell className="text-sm">
                {dayjs(item.created_at).format("D MMMM YYYY, HH:mm")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={8} className="text-left font-semibold">
              Total
            </TableCell>
            <TableCell className="font-bold">{totalQty}</TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Putaway Confirmation</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            Are you sure you want to putaway {selectedItems.length} item
            {selectedItems.length === 1 ? "" : "s"}?
          </div>
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemScannedTable;
