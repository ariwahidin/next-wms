/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Select from "react-select";
import { Eye, Pencil, Trash, X } from "lucide-react";
import {
  CombinedOutboundProps,
  ItemFormProps,
  ItemOptions,
} from "@/types/outbound";
import { Product } from "@/types/item";
import api from "@/lib/api";
import ItemSelectionModal from "@/components/order-spk/ItemSelectionModal";
import {
  CombinedSPKProps,
  DetailItemFormPropsSPK,
  MuatanOrderSPK,
} from "@/types/order-spk";
import { Transporter } from "@/types/transporter";
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
import { InventoryPolicy } from "@/types/inventory";

type OrderDetail = {
  item_code: string;
  barcode: string;
  product: { item_name: string } | null;
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
  const [products, setProducts] = useState<Product[]>([]);
  const [pickings, setPickings] = useState<MuatanOrderSPK[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [transporterOptions, setTransporterOptions] = useState<ItemOptions[]>(
    []
  );
  const [vasPages, setVasPages] = useState<any[]>([]);
  const [vasOptions, setVasOptions] = useState<any[]>([]);
  const [itemCodeOptions, setItemCodeOptions] = useState<ItemOptions[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<{
    [id: number]: { [key: string]: string };
  }>({});
  const [defaultUoms, setDefaultUoms] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<ItemFormProps | null>(null);
  const [selectedOutboundNo, setSelectedOutboundNo] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [viewData, setViewData] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [useVas, setUseVas] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      const [pickings] = await Promise.all([api.get("/order/list")]);

      if (pickings.data.success) {
        setPickings(pickings.data.data);
        setUseVas(pickings.data.data[0]?.use_vas || false);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItems = () => {
    setModalMode("create");
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: ItemFormProps) => {
    setModalMode("edit");
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCancel = async (item: MuatanOrderSPK) => {
    console.log("Cancel Item : ", item);

    if (item.mode === "create") {
      setMuatan((prev) => prev.filter((m) => m.ID !== item.ID));
      setSelectedOutboundNo((prev) =>
        prev.filter((no) => no !== item.outbound_no)
      );
    } else {
      try {
        const res = await api.delete(`/order/item/` + item.ID, {
          withCredentials: true,
        });
        console.log("Response dari server:", res);
        if (res.data.success) {
          setMuatan((prev) => prev.filter((m) => m.ID !== item.ID));
          setEditingId(null);
          setErrors({});
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  // Handle apply dari modal
  const handleModalApply = (selectedItems: MuatanOrderSPK[]) => {
    console.log("Pickings Data: ", pickings);
    console.log("Muatan Data: ", muatan);
    console.log("Selected Items On Apply :", selectedItems);
    console.log("Modal Mode: ", modalMode);
    // return;

    if (modalMode === "create") {
      const newPicking: MuatanOrderSPK[] = selectedItems.map((p) => ({
        ID: Date.now() * 1000 + Math.floor(Math.random() * 1000),
        outbound_id: pickings.find((o) => o.outbound_no === p.outbound_no)?.ID,
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
      }));

      setMuatan((prev) => [...prev, ...newPicking]);
    } else if (
      modalMode === "edit" &&
      editingItem &&
      selectedItems.length > 0
    ) {
      const selectedProduct = selectedItems[0];
    }

    setIsModalOpen(false);
  };

  const handleView = (item: MuatanOrderSPK) => {
    console.log("View Item : ", item);
    setLoading(true);
    api
      .get(`/outbound/` + item.outbound_no, { withCredentials: true })
      .then((res) => {
        if (res.data.success) {
          setViewData(res.data.data.items);
          setOpen(true);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          {headerForm.status !== "loaded" && (
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

        <div className="w-full overflow-x-auto relative">
          <table className="w-full border font-normal text-xs whitespace-nowrap">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border w-12 text-center sticky left-0 bg-gray-100 z-20">
                  No.
                </th>

                <th className="p-2 border sticky left-[48px] bg-gray-100 z-20" style={{ width: "120px" }}>
                  Picking No
                </th>

                <th className="p-2 border" style={{ width: "120px" }}>
                  DO No
                </th>
                <th className="p-2 border" style={{ width: "200px" }}>
                  Delivery To
                </th>
                <th className="p-2 border" style={{ width: "130px" }}>
                  Delivery City
                </th>
                <th
                  className="p-2 border"
                  style={{ width: "75px", textAlign: "center" }}
                >
                  Total Koli
                </th>
                {useVas && (
                  <th
                    className="p-2 border"
                    style={{ width: "75px", textAlign: "center" }}
                  >
                    VAS Koli
                  </th>
                )}
                <th className="p-2 border" style={{ width: "65px" }}>
                  Total Item
                </th>
                <th className="p-2 border" style={{ width: "65px" }}>
                  Total Qty
                </th>
                <th className="p-2 border" style={{ width: "85px" }}>
                  Total CBM
                </th>
                <th className="p-2 border" style={{ width: "100px" }}>
                  Remarks
                </th>
                <th className="p-2 border" style={{ width: "50px" }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {muatan?.map((item, index) => {
                return (
                  <tr key={item.outbound_no} className="border-t">
                    <td className="p-2 border text-center sticky left-0 bg-white z-10">
                      {index + 1}
                    </td>

                    <td className="p-2 border sticky left-[48px] bg-white z-10">
                      <Input
                        style={{ fontSize: "12px" }}
                        type="text"
                        value={item.outbound_no}
                        readOnly
                        className="flex-1"
                      />
                    </td>

                    <td className="p-2 border">
                      <Input
                        style={{ fontSize: "12px" }}
                        readOnly
                        type="text"
                        value={item.shipment_id}
                      />
                    </td>
                    <td className="p-2 border">
                      <Input
                        style={{ fontSize: "12px" }}
                        readOnly
                        type="text"
                        value={item.deliv_to_name}
                      />
                    </td>
                    <td className="p-2 border">
                      <div>
                        <Input
                          readOnly
                          style={{ fontSize: "12px", textAlign: "center" }}
                          value={item.deliv_city}
                        />
                      </div>
                    </td>
                    <td className="p-2 border">
                      <Input
                        style={{ fontSize: "12px", textAlign: "center" }}
                        type="number"
                        value={item.qty_koli}
                        onChange={(e) =>
                          setMuatan((prev) =>
                            prev.map((m) =>
                              m.ID === item.ID
                                ? { ...m, qty_koli: Number(e.target.value) }
                                : m
                            )
                          )
                        }
                      />
                    </td>

                    {useVas && (
                      <td className="p-2 border">
                        <Input
                          style={{ fontSize: "12px", textAlign: "center" }}
                          type="number"
                          value={item.vas_koli}
                          onChange={(e) =>
                            setMuatan((prev) =>
                              prev.map((m) =>
                                m.ID === item.ID
                                  ? { ...m, vas_koli: Number(e.target.value) }
                                  : m
                              )
                            )
                          }
                        />
                      </td>
                    )}
                    <td className="p-2 border">
                      <Input
                        style={{ fontSize: "12px", textAlign: "center" }}
                        readOnly
                        type="text"
                        value={item.total_item}
                      />
                    </td>
                    <td className="p-2 border">
                      <Input
                        style={{ fontSize: "12px", textAlign: "center" }}
                        readOnly
                        type="text"
                        value={item.total_qty}
                      />
                    </td>
                    <td className="p-2 border">
                      <Input
                        style={{ fontSize: "12px", textAlign: "center" }}
                        readOnly
                        type="text"
                        value={item.total_cbm}
                      />
                    </td>
                    <td className="p-2 border">
                      <Input
                        style={{ fontSize: "12px", textAlign: "center" }}
                        type="text"
                        value={item.remarks || ""}
                        onChange={(e) =>
                          setMuatan((prev) =>
                            prev.map((m) =>
                              m.ID === item.ID
                                ? { ...m, remarks: e.target.value }
                                : m
                            )
                          )
                        }
                      />
                    </td>
                    <td
                      className="p-2 border space-x-2 text-center"
                      style={{ width: "100px" }}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleView(item);
                        }}
                      >
                        <Eye size={14} />
                      </Button>
                      {headerForm.status !== "loaded" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleCancel(item);
                          }}
                        >
                          <X size={14} />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td className="p-2 border sticky left-0 bg-gray-100 z-20" colSpan={5}>
                  Total
                </td>
                <td className="p-2 border text-center">
                  {muatan.reduce((acc, item) => acc + item.qty_koli, 0)}
                </td>
                {useVas && (
                  <td className="p-2 border text-center">
                    {muatan.reduce((acc, item) => acc + item.vas_koli, 0)}
                  </td>
                )}
                <td className="p-2 border text-center">
                  {muatan.reduce((acc, item) => acc + item.total_item, 0)}
                </td>
                <td className="p-2 border text-center">
                  {muatan.reduce((acc, item) => acc + item.total_qty, 0)}
                </td>
                <td className="p-2 border text-center">
                  {muatan.reduce((acc, item) => acc + item.total_cbm, 0)}
                </td>
                <td className="p-2 border"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <OrderDetailModal
          open={open}
          onOpenChange={setOpen}
          data={viewData}
          loading={loading}
        />
      </div>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                  <TableCell>{item.product.item_name}</TableCell>
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
