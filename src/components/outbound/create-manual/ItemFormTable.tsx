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
import ItemSelectionModal from "@/components/outbound/create-manual/ItemSelectionModal";

export default function ItemFormTable({
  muatan,
  setMuatan,
  headerForm,
  setHeaderForm,
}: CombinedOutboundProps) {
  const [products, setProducts] = useState<Product[]>([]);
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
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // const handleSelect = (id: number, checked: boolean) => {
  //   setSelectedIds((prev) =>
  //     checked ? [...prev, id] : prev.filter((sid) => sid !== id)
  //   );
  // };

  const fetchData = async () => {
    try {
      const [products, uoms, vasPages] = await Promise.all([
        api.get("/products"),
        api.get("/uoms"),
        api.get("/vas/page"),
      ]);

      if (products.data.success && uoms.data.success && vasPages.data.success) {
        setProducts(products.data.data);
        setItemCodeOptions(
          products.data.data.map((item: Product) => ({
            value: item.item_code,
            label: item.item_code,
          }))
        );

        const defaultUoms = uoms.data.data.map((item: any) => ({
          value: item.code,
          label: item.code,
        }));
        setDefaultUoms(defaultUoms);

        setVasPages(vasPages.data.data);
        const vasOptions = vasPages.data.data.map((item: any) => ({
          value: item.ID,
          label: item.name,
        }));
        setVasOptions(vasOptions);
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

  const handleChange = (
    id: number,
    field: keyof ItemFormProps,
    value: string | number
  ) => {
    console.log("ID:", id);
    console.log("Field:", field);
    console.log("Value:", value);

    if (field === "item_code") {
      const selectedProduct = products.find(
        (product) => product.item_code === value
      );
      console.log("Produk yang dipilih:", selectedProduct);
      if (selectedProduct) {
        setMuatan((prev) =>
          prev.map((m) =>
            m.ID === id
              ? {
                  ...m,
                  item_code: selectedProduct.item_code,
                  uom: selectedProduct.uom,
                  item_name: selectedProduct.item_name,
                  barcode: selectedProduct.barcode,
                  sn: selectedProduct.has_serial,
                }
              : m
          )
        );
      }
    } else {
      setMuatan((prev) =>
        prev.map((m) =>
          m.ID === id
            ? { ...m, [field]: field === "quantity" ? Number(value) : value }
            : m
        )
      );
    }
  };

  const handleCancel = async (item: ItemFormProps) => {
    if (item.mode === "create") {
      setMuatan((prev) => prev.filter((m) => m.ID !== item.ID));
      setSelectedIds((prev) => prev.filter((sid) => sid !== item.ID));
    } else {
      try {
        const res = await api.delete(`/outbound/item/` + item.ID, {
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
  const handleModalApply = (selectedItems: Product[]) => {
    console.log("Selected Items:", selectedItems);
    // return;

    if (modalMode === "create") {
      const newItems = selectedItems.map((product) => ({
        ID: Date.now() * 1000 + Math.floor(Math.random() * 1000),
        item_id: product.ID,
        outbound_id: headerForm.ID > 0 ? headerForm.ID : 0,
        item_code: product.item_code,
        quantity: 1,
        location: "",
        uom: product.uom,
        remarks: "",
        mode: "create",
        sn: product.has_serial,
        vas_id: 0,
      }));

      setMuatan((prev) => [...prev, ...newItems]);
    } else if (
      modalMode === "edit" &&
      editingItem &&
      selectedItems.length > 0
    ) {
      const selectedProduct = selectedItems[0];
      setMuatan((prev) =>
        prev.map((m) =>
          m.ID === editingItem.ID
            ? {
                ...m,
                item_code: selectedProduct.item_code,
                uom: selectedProduct.uom,
                is_serial: selectedProduct.has_serial,
              }
            : m
        )
      );
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {/* <h2 className="text-lg font-semibold">Requested Items</h2> */}
        {headerForm.status !== "complete" && (
          <div className="space-x-2">
            <Button
              type="button"
              disabled={headerForm.status === "picking"}
              onClick={handleAddItems}
            >
              Add Item
            </Button>
          </div>
        )}
      </div>

      <table className="w-full border font-normal text-xs">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border w-12 text-center">No.</th>
            <th className="p-2 border" style={{ width: "300px" }}>
              Item Code
            </th>
            <th className="p-2 border" style={{ width: "300px" }}>
              Item Name
            </th>
            <th className="p-2 border" style={{ width: "150px" }}>
              Barcode
            </th>
            <th className="p-2 border" style={{ width: "100px" }}>
              Qty
            </th>
            <th className="p-2 border" style={{ width: "55px" }}>
              SN
            </th>
            {/* <th className="p-2 border" style={{ width: "120px" }}>
              UoM
            </th> */}
            {/* <th className="p-2 border">Inv. Location</th> */}
            <th className="p-2 border">VAS</th>
            <th className="p-2 border" style={{ width: "160px" }}>
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {muatan?.map((item, index) => {
            return (
              <tr key={item.ID} className="border-t">
                <td className="p-2 border text-center">{index + 1}</td>
                {/* <td className="p-2 border">
                  <div key={item.ID}>
                    <Select
                      value={itemCodeOptions.find(
                        (option) => option.value === item.item_code
                      )}
                      options={itemCodeOptions}
                      onChange={(value) =>
                        handleChange(item.ID, "item_code", value?.value)
                      }
                    />
                  </div>
                  {errors[item.ID]?.item_code && (
                    <small className="text-red-500">
                      {errors[item.ID].item_code}
                    </small>
                  )}
                </td> */}
                <td className="p-2 border">
                  <div className="flex items-center gap-2">
                    <Input
                      style={{ fontSize: "12px" }}
                      type="text"
                      value={item.item_code}
                      readOnly
                      className="flex-1"
                      placeholder="Click edit to select item..."
                    />
                    {item.mode === "create" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditItem(item)}
                        title="Select item"
                      >
                        <Pencil size={12} />
                      </Button>
                    )}
                  </div>
                  {errors[item.ID]?.item_code && (
                    <small className="text-red-500">
                      {errors[item.ID].item_code}
                    </small>
                  )}
                </td>
                <td className="p-2 border">
                  <Input
                    style={{ fontSize: "12px" }}
                    readOnly
                    type="text"
                    // value={item.item_name}
                    value={
                      products.find((p) => p.item_code === item.item_code)
                        ?.item_name || ""
                    }
                  />
                </td>
                <td className="p-2 border">
                  <Input
                    style={{ fontSize: "12px" }}
                    readOnly
                    type="text"
                    // value={item.barcode}
                    value={
                      products.find((p) => p.item_code === item.item_code)
                        ?.barcode || ""
                    }
                  />
                </td>
                <td className="p-2 border">
                  <div>
                    <Input
                      readOnly={headerForm.status != "open"}
                      style={{ fontSize: "12px", textAlign: "center" }}
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleChange(item.ID, "quantity", e.target.value)
                      }
                    />
                  </div>
                  {errors[item.ID]?.item_code && (
                    <small className="text-red-500">
                      {errors[item.ID].item_code}
                    </small>
                  )}
                </td>
                <td className="p-2 border">
                  <Input
                    style={{ fontSize: "12px" }}
                    readOnly
                    type="text"
                    value={item.sn}
                  />
                </td>
                {/* <td className="p-2 border">
                  <Select
                    value={defaultUoms.find(
                      (option) => option.value === item.uom
                    )}
                    options={defaultUoms}
                    onChange={(value) =>
                      handleChange(item.ID, "uom", value?.value)
                    }
                  />
                </td> */}
                {/* <td className="p-2 border">
                  <Input
                    type="text"
                    value={item.location}
                    onChange={(e) =>
                      handleChange(item.ID, "location", e.target.value)
                    }
                  />
                </td> */}
                {/* <td className="p-2 border">
                  <Input
                    type="text"
                    value={item.remarks}
                    onChange={(e) =>
                      handleChange(item.ID, "remarks", e.target.value)
                    }
                  />
                  {errors[item.ID]?.remarks && (
                    <small className="text-red-500">
                      {errors[item.ID].remarks}
                    </small>
                  )}
                </td> */}
                <td className="p-2 border">
                  <Select
                    className="text-sm w-34"
                    isSearchable
                    value={vasOptions.find(
                      (option) => option.value === item.vas_id
                    )}
                    options={vasOptions}
                    onChange={(value) =>
                      handleChange(item.ID, "vas_id", value?.value)
                    }
                  />
                  {/* <Input
                    type="text"
                    value={item.vas}
                    onChange={(e) =>
                      handleChange(item.ID, "vas", e.target.value)
                    }
                  /> */}
                  {/* {errors[item.ID]?.vas && (
                    <small className="text-red-500">
                      {errors[item.ID].vas}
                    </small>
                  )} */}
                </td>
                <td
                  className="p-2 border space-x-2 text-center"
                  style={{ width: "160px" }}
                >
                  {headerForm.status == "open" || item.mode == "create" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleCancel(item);
                      }}
                    >
                      <X size={14} />
                    </Button>
                  ) : (
                    <>
                      {/* <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item.ID)}
                      >
                        <Trash size={14} />
                      </Button> */}
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-semibold">
            <td className="p-2 border" colSpan={4}>
              Total
            </td>
            <td className="p-2 border text-center">
              {muatan.reduce((acc, item) => acc + item.quantity, 0)}
            </td>
            <td className="p-2 border" colSpan={2}></td>
          </tr>
        </tfoot>
      </table>

      <ItemSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        products={products}
        onApply={handleModalApply}
        selectedItems={muatan}
      />
    </div>
  );
}
