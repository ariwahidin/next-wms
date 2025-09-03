/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Select from "react-select";
import { Trash, Save, Pencil, X, Plus } from "lucide-react";
import * as yup from "yup";
import {
  CombinedInboundProps,
  HeaderFormProps,
  ItemFormProps,
  ItemFormTableProps,
  ItemOptions,
  PropsHeader,
} from "@/types/inbound";
import { Product } from "@/types/item";
import api from "@/lib/api";
import { Warehouse } from "@/types/warehouse";
import { Supplier } from "@/types/supplier";
import eventBus from "@/utils/eventBus";
import dayjs from "dayjs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import ItemSelectionModal from "./ItemSelectionModal"; // Import modal yang baru dibuat
import { Item } from "@radix-ui/react-dropdown-menu";

// Skema validasi Yup
const muatanSchema = yup.object().shape({
  item_code: yup.string().required("Item code wajib diisi"),
  quantity: yup
    .number()
    .typeError("Qty harus berupa angka")
    .positive("Qty harus lebih dari 0")
    .required("Qty wajib diisi"),
  rec_date: yup
    .string()
    .required("Tanggal penerimaan wajib diisi")
    .test("is-date", "Tanggal tidak valid", (value) => {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }),
  whs_code: yup.string().required("Gudang wajib diisi"),
  remarks: yup.string().optional(),
});

export default function ItemFormTable({
  muatan,
  setMuatan,
  headerForm,
  setHeaderForm,
  inboundReferences,
  setInboundReferences,
}: CombinedInboundProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [itemCodeOptions, setItemCodeOptions] = useState<ItemOptions[]>([]);
  const [whsCodeOptions, setWhsCodeOptions] = useState<ItemOptions[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<{
    [id: number]: { [key: string]: string };
  }>({});

  const [defaultOptions, setDefaultOptions] = useState([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<ItemFormProps | null>(null);

  const fetchData = async () => {
    try {
      const [products, warehouses, uoms] = await Promise.all([
        api.get("/products"),
        api.get("/warehouses"),
        api.get("/uoms"),
      ]);

      if (
        products.data.success &&
        warehouses.data.success &&
        uoms.data.success
      ) {
        setProducts(products.data.data);
        setItemCodeOptions(
          products.data.data.map((item: Product) => ({
            value: item.item_code,
            label: item.item_code,
          }))
        );
        setWarehouses(warehouses.data.data);
        setWhsCodeOptions(
          warehouses.data.data.map((item: Warehouse) => ({
            value: item.code,
            label: item.code,
          }))
        );
        // Set default UOM options
        const defaultUoms = uoms.data.data.map((item: any) => ({
          value: item.code,
          label: item.code,
        }));

        setDefaultOptions(defaultUoms);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle modal untuk add items
  const handleAddItems = () => {
    setModalMode("create");
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Handle modal untuk edit item
  const handleEditItem = (item: ItemFormProps) => {
    setModalMode("edit");
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Handle apply dari modal
  const handleModalApply = (selectedItems: Product[]) => {
    console.log("Selected Items:", selectedItems);

    // return

    if (modalMode === "create") {
      // Add mode - tambah items baru
      const newItems = selectedItems.map((product) => ({
        // ID: Date.now() + Math.random(), // Unique ID
        ID: Date.now() * 1000 + Math.floor(Math.random() * 1000),
        item_id: product.ID,
        inbound_id: headerForm.ID > 0 ? headerForm.ID : 0,
        item_code: product.item_code,
        quantity: 1, // Default quantity
        rcv_location: "",
        ref_id: inboundReferences.ID,
        ref_no: inboundReferences.ref_no,
        uom: product.uom,
        division: "REGULAR",
        rec_date: new Date().toISOString().split("T")[0],
        remarks: "",
        mode: "create",
        is_serial: product.has_serial,
      }));

      setMuatan((prev) => [...prev, ...newItems]);
    } else if (
      modalMode === "edit" &&
      editingItem &&
      selectedItems.length > 0
    ) {
      // Edit mode - update item yang sedang diedit
      const selectedProduct = selectedItems[0]; // Ambil item pertama untuk edit
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

  const handleChange = (
    id: number,
    field: keyof ItemFormProps,
    value: string | number
  ) => {
    console.log("ID:", id);
    console.log("Field:", field);
    console.log("Value:", value);

    setMuatan((prev) =>
      prev.map((m) =>
        m.ID === id
          ? { ...m, [field]: field === "quantity" ? Number(value) : value }
          : m
      )
    );
  };

  const handleSaveItem = async () => {
    const editingItemData = muatan.find((m) => m.ID === editingId);

    console.log("Item yang akan diedit:", editingItemData);

    if (!editingItemData) return;

    console.log("Item yang sedang diedit:", editingItemData);

    try {
      await muatanSchema.validate(editingItemData, { abortEarly: false });

      console.log("Data yang dikirim:", editingItemData);

      const res = await api.post(
        `/inbound/item/` + editingItemData.inbound_id,
        editingItemData,
        { withCredentials: true }
      );
      if (res.data.success) {
        console.log("Data yang telah disimpan:", res.data.data);
        eventBus.emit("showAlert", {
          title: "Success!",
          description: res.data.message,
          type: "success",
        });

        eventBus.emit("refreshData");
        setErrors((prev) => ({ ...prev, [editingItemData.ID]: {} }));
        setEditingId(null);
      }
    } catch (validationError: any) {
      const fieldErrors: { [key: string]: string } = {};
      validationError.inner.forEach((err: any) => {
        if (err.path) {
          fieldErrors[err.path] = err.message;
        }
      });

      setErrors((prev) => ({
        ...prev,
        [editingItemData.ID]: fieldErrors,
      }));
    }
  };

  const handleEdit = (id: number) => {
    console.log("Editing item with ID:", id);
    setEditingId(id);
  };

  const handleCancel = async (item: ItemFormProps) => {
    if (item.mode === "create") {
      setMuatan((prev) => prev.filter((m) => m.ID !== item.ID));
    } else {
      eventBus.emit("refreshData");
      setErrors((prev) => ({ ...prev, [item.ID]: {} }));
      setEditingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    console.log("Deleting item with ID:", id);

    try {
      const res = await api.delete(`/inbound/item/` + id, {
        withCredentials: true,
      });
      if (res.data.success) {
        setMuatan((prev) => prev.filter((m) => m.ID !== id));
        setSelectedIds((prev) => prev.filter((sid) => sid !== id));
        if (editingId === id) setEditingId(null);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleSelect = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((sid) => sid !== id)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? muatan.map((m) => m.ID) : []);
  };

  const handleDeleteSelected = () => {
    console.log("Deleting selected items with IDs:", selectedIds);

    try {
      selectedIds.forEach(async (id) => {
        const res = await api.delete(`/inbound/item/` + id, {
          withCredentials: true,
        });
        if (res.data.success) {
          setMuatan((prev) => prev.filter((m) => m.ID !== id));
          setSelectedIds((prev) => prev.filter((sid) => sid !== id));
          if (editingId === id) setEditingId(null);
        }
      });
    } catch (error) {
      console.error("Error deleting selected items:", error);
    }
  };

  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectStates, setSelectStates] = useState({});

  const handleFocus = async (itemCode: string, itemId: string | number) => {
    if (!itemCode || itemCode.trim() === "") return;

    // Set loading true untuk item tertentu
    setSelectStates((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        loading: true,
      },
    }));

    try {
      const response = await api.post("/uoms/item", { item_code: itemCode });
      const uoms = response?.data?.data || [];

      const mappedOptions = uoms.map((item) => ({
        value: item.from_uom,
        label: item.from_uom,
      }));

      // Update options hanya untuk item tersebut
      setSelectStates((prev) => ({
        ...prev,
        [itemId]: {
          loading: false,
          options: mappedOptions,
        },
      }));
    } catch (error) {
      console.error("Failed to fetch UOMs:", error);
      // Tetap kosongkan jika gagal
      setSelectStates((prev) => ({
        ...prev,
        [itemId]: {
          loading: false,
          options: [],
        },
      }));
    }
  };

  const totalQty = muatan?.reduce((sum, item) => sum + item.quantity, 0);
  const allSelected =
    muatan?.length > 0 && selectedIds.length === muatan.length;

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          {headerForm.status !== "complete" && (
            <div className="flex space-x-2">
              <Button
                variant="destructive"
                onClick={handleDeleteSelected}
                disabled={selectedIds.length === 0}
                className="flex items-center gap-2 w-auto"
              >
                Delete Selected
              </Button>
              <Button
                type="button"
                onClick={handleAddItems}
                className="flex items-center gap-2 w-auto"
              >
                Add Items
              </Button>
            </div>
          )}
        </div>

        <table
          className="w-full border font-normal text-sm"
          style={{ fontSize: "12px" }}
        >
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border text-center w-8">
                <input
                  disabled={headerForm.status === "complete"}
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th className="p-2 border w-12 text-center">No.</th>
              <th className="p-2 border" style={{ width: "300px" }}>
                Item Code
              </th>
              <th className="p-2 border" style={{ width: "300px" }}>
                Barcode
              </th>
              <th className="p-2 border" style={{ width: "300px" }}>
                Description
              </th>
              <th className="p-2 border" style={{ width: "30px" }}>
                SN
              </th>
              <th className="p-2 border" style={{ width: "50px" }}>
                UoM
              </th>
              <th className="p-2 border" style={{ width: "100px" }}>
                Qty
              </th>
              <th className="p-2 border" style={{ width: "130px" }}>
                Rcv Location
              </th>
              <th className="p-2 border" style={{ width: "140px" }}>
                Rcv Date
              </th>
              <th className="p-2 border" style={{ width: "140px" }}>
                Remarks
              </th>
              <th className="p-2 border" style={{ width: "100px" }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {muatan
              .filter((item) => item.ref_id === inboundReferences.ID)
              .map((item, index) => {
                const isEditing = editingId === item.ID;
                return (
                  <tr key={item.ID} className="border-t">
                    <td className="p-2 border text-center">
                      <input
                        disabled={headerForm.status === "complete"}
                        type="checkbox"
                        checked={selectedIds.includes(item.ID)}
                        onChange={(e) =>
                          handleSelect(item.ID, e.target.checked)
                        }
                      />
                    </td>
                    <td className="p-2 border text-center">{index + 1}</td>

                    {headerForm.status == "open" ||
                    headerForm.mode == "create" ? (
                      <>
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
                            //   className="w-14"
                            value={
                              products.find(
                                (p) => p.item_code === item.item_code
                              )?.barcode || ""
                            }
                          />
                        </td>
                        <td className="p-2 border">
                          <Input
                            style={{ fontSize: "12px" }}
                            readOnly
                            //   className="w-100"
                            type="text"
                            //   className="w-14"
                            value={
                              products.find(
                                (p) => p.item_code === item.item_code
                              )?.item_name || ""
                            }
                          />
                        </td>
                        <td className="p-2 border">
                          <Input
                            style={{ fontSize: "12px" }}
                            readOnly
                            type="text"
                            className="w-14"
                            value={item.is_serial || ""}
                          />
                        </td>
                        <td className="p-2 border">
                          <Select
                            key={item.ID}
                            className="w-40"
                            options={
                              selectStates[item.ID]?.options ?? defaultOptions
                            }
                            onFocus={() => handleFocus(item.item_code, item.ID)}
                            isLoading={selectStates[item.ID]?.loading ?? false}
                            value={(
                              selectStates[item.ID]?.options ?? defaultOptions
                            ).find((option) => option.value === item.uom)}
                            onChange={(value) =>
                              handleChange(item.ID, "uom", value?.value)
                            }
                          />
                        </td>
                        <td className="p-2 border">
                          <div>
                            <Input
                              className="w-20"
                              style={{ fontSize: "12px" }}
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleChange(
                                  item.ID,
                                  "quantity",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          {errors[item.ID]?.quantity && (
                            <small className="text-red-500">
                              {errors[item.ID].quantity}
                            </small>
                          )}
                        </td>
                        <td className="p-2 border">
                          <div>
                            <Input
                              style={{ fontSize: "12px" }}
                              type="text"
                              value={item.rcv_location || "STAGING"}
                              onChange={(e) =>
                                handleChange(
                                  item.ID,
                                  "rcv_location",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </td>
                        <td className="p-2 border">
                          <DatePicker
                            selected={
                              item.rec_date ? parseISO(item.rec_date) : null
                            }
                            onChange={(date: Date | null) => {
                              if (date) {
                                handleChange(
                                  item.ID,
                                  "rec_date",
                                  format(date, "yyyy-MM-dd")
                                );
                              }
                            }}
                            dateFormat="dd/MM/yyyy"
                            locale={id}
                            customInput={
                              <Input
                                className="w-[120px] cursor-pointer"
                                style={{ fontSize: "12px" }}
                              />
                            }
                            placeholderText="Pilih tanggal"
                            popperPlacement="bottom-start"
                          />
                          {errors[item.ID]?.rec_date && (
                            <small className="text-red-500">
                              {errors[item.ID].rec_date}
                            </small>
                          )}
                        </td>
                        <td className="p-2 border">
                          <Input
                            style={{ fontSize: "12px" }}
                            className="w-full"
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
                        </td>
                        <td
                          className="p-2 border space-x-2 text-center"
                          style={{ width: "100px" }}
                        >
                          {item.mode == "create" ? (
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
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(item.ID)}
                            >
                              <Trash size={14} />
                            </Button>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2 border">{item.item_code}</td>

                        <td className="p-2 border text-center">
                          {
                            products.find((p) => p.item_code === item.item_code)
                              ?.barcode
                          }
                        </td>

                        <td className="p-2 border text-center">
                          {
                            products.find((p) => p.item_code === item.item_code)
                              ?.item_name
                          }
                        </td>
                        <td className="p-2 border text-center">
                          {item.is_serial}
                        </td>
                        <td className="p-2 border text-center">{item.uom}</td>
                        <td className="p-2 border text-center">
                          {item.quantity}
                        </td>
                        <td className="p-2 border text-center">
                          {item.rcv_location}
                        </td>
                        <td className="p-2 border text-center">
                          {dayjs(item.rec_date).format("D MMMM YYYY")}
                        </td>
                        <td className="p-2 border">{item.remarks}</td>
                        <td
                          className="p-2 border space-x-2 text-center"
                          style={{ width: "160px" }}
                        >
                          {headerForm.status !== "complete" && <></>}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-semibold">
              <td className="p-2 border" colSpan={7}>
                Total
              </td>
              <td className="p-2 border text-center">
                {muatan.reduce((acc, item) => acc + item.quantity, 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <ItemSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        products={products}
        onApply={handleModalApply}
        selectedItems={muatan}
      />
    </>
  );
}
