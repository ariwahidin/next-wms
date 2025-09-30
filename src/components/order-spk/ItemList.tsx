"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type MuatanOrderSPK = {
  item_code: string;
  barcode: string;
  item_name: string;
  qty: number;
  uom: string;
};

// ✅ Modal terpisah
function OrderDetailModal({
  open,
  onOpenChange,
  data,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: MuatanOrderSPK[];
  loading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detail Order</DialogTitle>
          <DialogDescription>
            Informasi detail item dalam order
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Item</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Nama Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>UOM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{item.item_code}</TableCell>
                  <TableCell>{item.barcode}</TableCell>
                  <TableCell>{item.item_name}</TableCell>
                  <TableCell>{item.qty}</TableCell>
                  <TableCell>{item.uom}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default OrderDetailModal;