/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Select from "react-select";
import { Pencil, Trash, X } from "lucide-react";
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
  //   const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedOutboundNo, setSelectedOutboundNo] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      const [pickings] = await Promise.all([api.get("/order/list")]);

      if (pickings.data.success) {
        setPickings(pickings.data.data);
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

  //   const handleChange = (
  //     id: number,
  //     field: keyof ItemFormProps,
  //     value: string | number
  //   ) => {
  //     console.log("ID:", id);
  //     console.log("Field:", field);
  //     console.log("Value:", value);

  //     if (field === "item_code") {
  //       const selectedProduct = products.find(
  //         (product) => product.item_code === value
  //       );
  //       console.log("Produk yang dipilih:", selectedProduct);
  //       if (selectedProduct) {
  //         setMuatan((prev) =>
  //           prev.map((m) =>
  //             m.ID === id
  //               ? {
  //                   ...m,
  //                   item_code: selectedProduct.item_code,
  //                   uom: selectedProduct.uom,
  //                   item_name: selectedProduct.item_name,
  //                   barcode: selectedProduct.barcode,
  //                   sn: selectedProduct.has_serial,
  //                 }
  //               : m
  //           )
  //         );
  //       }
  //     } else {
  //       setMuatan((prev) =>
  //         prev.map((m) =>
  //           m.ID === id
  //             ? { ...m, [field]: field === "quantity" ? Number(value) : value }
  //             : m
  //         )
  //       );
  //     }
  //   };

  const handleCancel = async (item: MuatanOrderSPK) => {
    console.log("Cancel Item : ", item);
    // return;

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
      //   setMuatan((prev) =>
      //     prev.map((m) =>
      //       m.ID === editingItem.ID
      //         ? {
      //             ...m,
      //             item_code: selectedProduct.item_code,
      //             uom: selectedProduct.uom,
      //             is_serial: selectedProduct.has_serial,
      //           }
      //         : m
      //     )
      //   );
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {headerForm.status !== "complete" && (
          <div className="space-x-2">
            <Button
              type="button"
              disabled={headerForm.status === "picking"}
              onClick={handleAddItems}
            >
              Add DO
            </Button>
          </div>
        )}
      </div>

      <table className="w-full border font-normal text-xs">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border w-12 text-center">No.</th>
            <th className="p-2 border" style={{ width: "120px" }}>
              Picking No
            </th>
            <th className="p-2 border" style={{ width: "120px" }}>
              DO No
            </th>
            <th className="p-2 border" style={{ width: "200px" }}>
              Delivery To
            </th>
            <th className="p-2 border" style={{ width: "200px" }}>
              Delivery City
            </th>
            <th className="p-2 border" style={{ width: "65px" }}>
              Total Koli
            </th>
            <th className="p-2 border" style={{ width: "65px" }}>
              Total Item
            </th>
            <th className="p-2 border" style={{ width: "65px" }}>
              Total Qty
            </th>
            <th className="p-2 border" style={{ width: "65px" }}>
              Total CBM
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
                <td className="p-2 border text-center">{index + 1}</td>
                <td className="p-2 border">
                  <div className="flex items-center gap-2">
                    <Input
                      style={{ fontSize: "12px" }}
                      type="text"
                      value={item.outbound_no}
                      readOnly
                      className="flex-1"
                      placeholder="Click edit to select item..."
                    />
                  </div>
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
                    readOnly
                    type="text"
                    value={item.qty_koli}
                  />
                </td>
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
                <td
                  className="p-2 border space-x-2 text-center"
                  style={{ width: "55px" }}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleCancel(item);
                    }}
                  >
                    <X size={14} />
                  </Button>
                  {/* {headerForm.status == "open" || item.mode === "create" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // handleCancel(item);
                      }}
                    >
                      <X size={14} />
                    </Button>
                  ) : (
                    <></>
                  )} */}
                </td>
              </tr>
            );
          })}
        </tbody>
        {/* <tfoot>
          <tr className="bg-gray-100 font-semibold">
            <td className="p-2 border" colSpan={4}>
              Total
            </td>
            <td className="p-2 border text-center">
              {muatan.reduce((acc, item) => acc + item.quantity, 0)}
            </td>
            <td className="p-2 border" colSpan={2}></td>
          </tr>
        </tfoot> */}
      </table>

      <ItemSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        items={pickings}
        onApply={handleModalApply}
        selectedItems={muatan}
      />
    </div>
  );
}
