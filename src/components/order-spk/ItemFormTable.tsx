"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Eye, X } from "lucide-react";

import api from "@/lib/api";

import ItemSelectionModal from "@/components/order-spk/ItemSelectionModal";
import DeliveryHubAssignment from "@/components/order-spk/DeliveryHubAssignment";

import {
  CombinedSPKProps,
  MuatanOrderSPK,
} from "@/types/order-spk";

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

import { usePermission } from "@/hooks/usePermission";

type OrderDetail = {
  item_code: string;
  barcode: string;
  product: {
    item_name: string;
  } | null;
  quantity: number;
  uom: string;
  vas_name: string;
};

export default function ItemFormTable({
  muatan,
  setMuatan,
  headerForm,
  setHeaderForm,
}: CombinedSPKProps) {
  const [pickings, setPickings] = useState<MuatanOrderSPK[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [open, setOpen] = useState(false);

  const [viewData, setViewData] = useState<OrderDetail[]>([]);

  const [loading, setLoading] = useState(false);

  const [useVas, setUseVas] = useState<boolean>(false);

  const [selectedOutboundNo, setSelectedOutboundNo] = useState<string[]>([]);

  const { can } = usePermission();

  // =========================================================
  // FETCH PICKING DATA
  // =========================================================

  const fetchData = async () => {
    try {
      const res = await api.get("/order/list", {
        withCredentials: true,
      });

      if (res.data.success) {
        setPickings(res.data.data || []);

        setUseVas(res.data.data?.[0]?.use_vas || false);
      }
    } catch (error) {
      console.error("Error fetching picking data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =========================================================
  // ADD DO
  // =========================================================

  const handleAddItems = () => {
    setIsModalOpen(true);
  };

  // =========================================================
  // CANCEL / DELETE DO
  // =========================================================

  const handleCancel = async (item: MuatanOrderSPK) => {
    if (item.mode === "create") {
      setMuatan((prev) =>
        prev.filter((m) => m.ID !== item.ID)
      );

      setSelectedOutboundNo((prev) =>
        prev.filter((no) => no !== item.outbound_no)
      );

      return;
    }

    try {
      const res = await api.delete(`/order/item/${item.ID}`, {
        withCredentials: true,
      });

      if (res.data.success) {
        setMuatan((prev) =>
          prev.filter((m) => m.ID !== item.ID)
        );

        setSelectedOutboundNo((prev) =>
          prev.filter((no) => no !== item.outbound_no)
        );
      }
    } catch (error) {
      console.error("Error deleting SPK item:", error);
    }
  };

  // =========================================================
  // APPLY SELECTED DO FROM MODAL
  // =========================================================

  const handleModalApply = (selectedItems: MuatanOrderSPK[]) => {
    const newPicking: MuatanOrderSPK[] = selectedItems.map((p) => {
      const selectedPicking = pickings.find(
        (o) => o.outbound_no === p.outbound_no
      );

      return {
        ID:
          Date.now() * 1000 +
          Math.floor(Math.random() * 1000),

        outbound_id: selectedPicking?.ID ?? p.outbound_id,

        outbound_no: p.outbound_no,
        shipment_id: p.shipment_id,

        deliv_to: p.deliv_to,
        deliv_to_name: p.deliv_to_name,
        deliv_address: p.deliv_address,
        deliv_city: p.deliv_city,

        total_item: p.total_item,
        total_qty: p.total_qty,
        qty_koli: p.qty_koli,
        vas_koli: 0,
        total_cbm: p.total_cbm,

        mode: "create",

        order_type: p.order_type,

        remarks: p.remarks || "",

        // Delivery Hub assignment
        delivery_mode: p.delivery_mode || "DIRECT",
        delivery_hub_id: p.delivery_hub_id ?? null,
        delivery_hub_code: p.delivery_hub_code || "",
        delivery_hub_name: p.delivery_hub_name || "",
        delivery_hub_address: p.delivery_hub_address || "",
        delivery_hub_city: p.delivery_hub_city || "",
      };
    });

    setMuatan((prev) => {
      // Hindari memasukkan DO yang sama dua kali.
      const existingKeys = new Set(
        prev.map(
          (item) =>
            `${item.outbound_id}:${item.shipment_id || item.outbound_no}`
        )
      );

      const filtered = newPicking.filter((item) => {
        const key = `${item.outbound_id}:${
          item.shipment_id || item.outbound_no
        }`;

        return !existingKeys.has(key);
      });

      return [...prev, ...filtered];
    });

    setIsModalOpen(false);
  };

  // =========================================================
  // VIEW OUTBOUND DETAIL
  // =========================================================

  const handleView = async (item: MuatanOrderSPK) => {
    setLoading(true);

    try {
      const res = await api.get(
        `/outbound/${item.outbound_no}`,
        {
          withCredentials: true,
        }
      );

      if (res.data.success) {
        setViewData(res.data.data.items || []);
        setOpen(true);
      }
    } catch (error) {
      console.error("Error fetching outbound detail:", error);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UPDATE MUATAN FIELD
  // =========================================================

  const updateMuatan = (
    id: number,
    field: keyof MuatanOrderSPK,
    value: string | number
  ) => {
    setMuatan((prev) =>
      prev.map((item) =>
        item.ID === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  // =========================================================
  // TOTAL CALCULATION
  // =========================================================

  const totalKoli = muatan.reduce(
    (acc, item) => acc + (Number(item.qty_koli) || 0),
    0
  );

  const totalVasKoli = muatan.reduce(
    (acc, item) => acc + (Number(item.vas_koli) || 0),
    0
  );

  const totalItem = muatan.reduce(
    (acc, item) => acc + (Number(item.total_item) || 0),
    0
  );

  const totalQty = muatan.reduce(
    (acc, item) => acc + (Number(item.total_qty) || 0),
    0
  );

  const totalCBM = muatan.reduce(
    (acc, item) => acc + (Number(item.total_cbm) || 0),
    0
  );

  const isReadOnly =
    headerForm.status === "loaded" ||
    headerForm.status === "confirmed";

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      <div className="space-y-4">

        {/* =====================================================
            ADD DO BUTTON
        ===================================================== */}

        <div className="flex items-center justify-between">
          {!isReadOnly &&
            can("shipment", "create") && (
              <div className="space-x-2">
                <Button
                  className="h-8"
                  type="button"
                  disabled={headerForm.status === "picking"}
                  onClick={handleAddItems}
                >
                  Add DO
                </Button>
              </div>
            )}
        </div>

        {/* =====================================================
            DELIVERY HUB ASSIGNMENT
        ===================================================== */}

        <DeliveryHubAssignment
          muatan={muatan}
          setMuatan={setMuatan}
          disabled={isReadOnly}
        />

        {/* =====================================================
            SPK DETAIL TABLE
        ===================================================== */}

        <div className="relative w-full overflow-x-auto">
          <table className="w-full border whitespace-nowrap text-xs font-normal">

            <thead className="bg-gray-100">
              <tr>
                <th
                  className="sticky left-0 z-20 w-12 border bg-gray-100 p-2 text-center"
                >
                  No.
                </th>

                <th
                  className="sticky left-[48px] z-20 border bg-gray-100 p-2"
                  style={{ width: "120px" }}
                >
                  Picking No
                </th>

                <th
                  className="border p-2"
                  style={{ width: "120px" }}
                >
                  DO No
                </th>

                <th
                  className="border p-2"
                  style={{ width: "120px" }}
                >
                  Order Type
                </th>

                <th
                  className="border p-2"
                  style={{ width: "200px" }}
                >
                  Delivery To
                </th>

                <th
                  className="border p-2"
                  style={{ width: "130px" }}
                >
                  Delivery City
                </th>

                <th
                  className="border p-2 text-center"
                  style={{ width: "75px" }}
                >
                  Total Koli
                </th>

                {useVas && (
                  <th
                    className="border p-2 text-center"
                    style={{ width: "75px" }}
                  >
                    VAS Koli
                  </th>
                )}

                <th
                  className="border p-2"
                  style={{ width: "65px" }}
                >
                  Total Item
                </th>

                <th
                  className="border p-2"
                  style={{ width: "65px" }}
                >
                  Total Qty
                </th>

                <th
                  className="border p-2"
                  style={{ width: "85px" }}
                >
                  Total CBM
                </th>

                <th
                  className="border p-2"
                  style={{ width: "100px" }}
                >
                  Remarks
                </th>

                <th
                  className="border p-2"
                  style={{ width: "50px" }}
                >
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {muatan?.map((item, index) => (
                <tr
                  key={item.ID}
                  className="border-t"
                >
                  <td className="sticky left-0 z-10 border bg-white p-2 text-center">
                    {index + 1}
                  </td>

                  <td className="sticky left-[48px] z-10 border bg-white p-2">
                    <span>{item.outbound_no}</span>
                  </td>

                  <td className="border p-2">
                    <span>{item.shipment_id}</span>
                  </td>

                  <td className="border p-2">
                    <span>{item.order_type}</span>
                  </td>

                  <td className="border p-2">
                    <span>{item.deliv_to_name}</span>
                  </td>

                  <td className="border p-2">
                    <span>{item.deliv_city}</span>
                  </td>

                  <td className="border p-2">
                    <Input
                      readOnly
                      className="h-8"
                      style={{
                        fontSize: "12px",
                        textAlign: "center",
                      }}
                      type="number"
                      value={item.qty_koli ?? 0}
                    />
                  </td>

                  {useVas && (
                    <td className="border p-2">
                      <Input
                        className="h-8"
                        disabled={isReadOnly}
                        style={{
                          fontSize: "12px",
                          textAlign: "center",
                        }}
                        type="number"
                        value={item.vas_koli ?? 0}
                        onChange={(e) =>
                          updateMuatan(
                            item.ID,
                            "vas_koli",
                            Number(e.target.value)
                          )
                        }
                      />
                    </td>
                  )}

                  <td className="border p-2">
                    <Input
                      readOnly
                      className="h-8"
                      style={{
                        fontSize: "12px",
                        textAlign: "center",
                      }}
                      type="text"
                      value={item.total_item ?? 0}
                    />
                  </td>

                  <td className="border p-2">
                    <Input
                      readOnly
                      className="h-8"
                      style={{
                        fontSize: "12px",
                        textAlign: "center",
                      }}
                      type="text"
                      value={item.total_qty ?? 0}
                    />
                  </td>

                  <td className="border p-2">
                    <Input
                      readOnly
                      className="h-8"
                      style={{
                        fontSize: "12px",
                        textAlign: "center",
                      }}
                      type="text"
                      value={item.total_cbm ?? 0}
                    />
                  </td>

                  <td className="border p-2">
                    <Input
                      className="h-8"
                      disabled={isReadOnly}
                      style={{
                        fontSize: "12px",
                        textAlign: "center",
                      }}
                      type="text"
                      value={item.remarks || ""}
                      onChange={(e) =>
                        updateMuatan(
                          item.ID,
                          "remarks",
                          e.target.value
                        )
                      }
                    />
                  </td>

                  <td
                    className="space-x-2 border p-2 text-center"
                    style={{ width: "100px" }}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => handleView(item)}
                    >
                      <Eye size={14} />
                    </Button>

                    {!isReadOnly && (
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => handleCancel(item)}
                      >
                        <X size={14} />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}

              {muatan.length === 0 && (
                <tr>
                  <td
                    colSpan={useVas ? 13 : 12}
                    className="border p-6 text-center text-gray-500"
                  >
                    No DO added to this SPK.
                  </td>
                </tr>
              )}
            </tbody>

            {/* =================================================
                TOTAL
            ================================================= */}

            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td
                  className="sticky left-0 z-20 border bg-gray-100 p-2"
                  colSpan={6}
                >
                  Total
                </td>

                <td className="border p-2 text-center">
                  {totalKoli}
                </td>

                {useVas && (
                  <td className="border p-2 text-center">
                    {totalVasKoli}
                  </td>
                )}

                <td className="border p-2 text-center">
                  {totalItem}
                </td>

                <td className="border p-2 text-center">
                  {totalQty}
                </td>

                <td className="border p-2 text-center">
                  {totalCBM}
                </td>

                <td className="border p-2"></td>

                <td className="border p-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* =====================================================
            OUTBOUND DETAIL MODAL
        ===================================================== */}

        <OrderDetailModal
          open={open}
          onOpenChange={setOpen}
          data={viewData}
          loading={loading}
        />
      </div>

      {/* =======================================================
          ITEM SELECTION MODAL
      ======================================================= */}

      <ItemSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        items={pickings}
        onApply={handleModalApply}
        selectedItems={muatan}
      />
    </>
  );
}

// =============================================================
// OUTBOUND DETAIL MODAL
// =============================================================

function OrderDetailModal({
  open,
  onOpenChange,
  data,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: OrderDetail[];
  loading: boolean;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-3xl bg-white">
        <DialogHeader>
          <DialogTitle>Detail Order</DialogTitle>

          <DialogDescription>
            Detail item in the selected order
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Code</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>UOM</TableHead>
                <TableHead>VAS</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data?.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{item.item_code}</TableCell>

                  <TableCell>{item.barcode}</TableCell>

                  <TableCell>
                    {item.product?.item_name || "-"}
                  </TableCell>

                  <TableCell>{item.quantity}</TableCell>

                  <TableCell>{item.uom}</TableCell>

                  <TableCell>{item.vas_name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}