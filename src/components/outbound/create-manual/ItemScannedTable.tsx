/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import React, { useEffect, useState } from "react";
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
import { useRouter } from "next/router";
import { KoliItem } from "@/types/outbound";

interface ItemScannedTableProps {
  itemsReceived: ItemReceived[];
}

const ItemScannedTable: React.FC<ItemScannedTableProps> = ({
  itemsReceived,
}) => {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [koliItems, setKoliItems] = useState<KoliItem[]>([]);

  const router = useRouter();

  const {no} = router.query

  console.log('no', no);
  


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
    if (selectedItems.length === 0) return;

    setIsLoading(true);

    try {
      const results = await Promise.allSettled(
        selectedItems.map((id) =>
          api.put(
            `/inbound/putaway/item/${id}`,
            { ID: id },
            { withCredentials: true }
          )
        )
      );

      let successCount = 0;
      let failedIDs: number[] = [];

      results.forEach((result, index) => {
        const id = selectedItems[index];
        if (result.status === "fulfilled" && result.value.data.success) {
          successCount++;
        } else {
          failedIDs.push(id);
        }
      });

      if (successCount > 0) {
        eventBus.emit("showAlert", {
          title: "Success!",
          description: `${successCount} item berhasil diputaway.`,
          type: "success",
        });
        eventBus.emit("refreshData");
        setShowModal(false);
        setSelectedItems([]);
      }

      if (failedIDs.length > 0) {
        eventBus.emit("showAlert", {
          title: "Error",
          description: `Gagal putaway ID: ${failedIDs.join(", ")}`,
          type: "error",
        });
      }

      setSelectedItems([]);
    } catch (error) {
      eventBus.emit("showAlert", {
        title: "Error",
        description: "Terjadi kesalahan saat putaway " + error,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalQty = koliItems?.reduce(
    (acc, item) => acc + Number(item.qty),
    0
  );

  useEffect(() => {

    const fetchData = async () => {
      try {
        const response = await api.get(
          `/outbound/koli-details/${no}`,
          { withCredentials: true }
        );
        console.log('response', response);

        const data = await response.data;
        if (data.success === false) return;
        setKoliItems(data.data);

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    // fetchData();

    if (no) {
      fetchData();
    }

  }, [no]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Picked Items</h2>
        {/* {selectedItems.length > 0 && (
          <div>
            <Button
              onClick={confirmPutaway}
              disabled={isLoading || selectedItems.length === 0}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Processing..." : "Putaway Confirm"}
            </Button>
          </div>
        )} */}
      </div>

      <Table className="border rounded-md">
        <TableHeader>
          <TableRow>
            {/* <TableHead>
              <Checkbox checked={selectAll} onCheckedChange={toggleSelectAll} />
            </TableHead> */}
            <TableHead>No</TableHead>
            <TableHead>Item Code</TableHead>
            <TableHead>Barcode</TableHead>
            <TableHead>Serial Number</TableHead>
            {/* <TableHead>Received Location</TableHead>
            <TableHead>Whs Code</TableHead>
            <TableHead>Status</TableHead> */}
            <TableHead>Qty</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {koliItems?.map((item, index) => (
            <TableRow key={item.ID}>
              {/* <TableCell>
                {item.status == "pending" && (
                  <Checkbox
                    checked={selectedItems.includes(item.ID)}
                    onCheckedChange={() => toggleSelectItem(item.ID)}
                  />
                )}
              </TableCell> */}
              <TableCell className="text-sm">{index + 1}</TableCell>
              <TableCell className="text-sm">{item.item_code}</TableCell>
              <TableCell className="text-sm">{item.barcode}</TableCell>
              <TableCell className="text-sm">{item.serial_number}</TableCell>
              {/* <TableCell className="text-sm">{item.location}</TableCell>
              <TableCell className="text-sm">{item.whs_code}</TableCell>
              <TableCell className="text-sm">{item.status}</TableCell> */}
              <TableCell className="text-sm">{item.qty}</TableCell>
              <TableCell className="text-sm">
                {dayjs(item.created_at).format("D MMMM YYYY, HH:mm")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4} className="text-left font-semibold">
              Total
            </TableCell>
            <TableCell className="font-bold">{totalQty}</TableCell>
            <TableCell /> {/* kosongkan sel terakhir */}
          </TableRow>
        </TableFooter>
      </Table>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Putaway Confirmation</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            Are you sure you want to putaway {selectedItems.length} item?
          </div>
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button onClick={handleConfirm}>Konfirmasi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemScannedTable;
