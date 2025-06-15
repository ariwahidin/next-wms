/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Select from "react-select";
import { Trash, Save, Pencil, X } from "lucide-react";
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

// Skema validasi Yup
const muatanSchema = yup.object().shape({
  item_code: yup.string().required("Item code wajib diisi"),
  quantity: yup
    .number()
    .typeError("Qty harus berupa angka")
    .positive("Qty harus lebih dari 0")
    .required("Qty wajib diisi"),
  // uom: yup.string().required("UOM wajib diisi"),
  received_date: yup
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

  const fetchData = async () => {
    try {
      const [products, warehouses] = await Promise.all([
        api.get("/products", { withCredentials: true }),
        api.get("/warehouses", { withCredentials: true }),
      ]);

      if (products.data.success && warehouses.data.success) {
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
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // useEffect(() => {
  //   console.log("Muatan:", muatan);
  //   muatan.map((m) => {
  //     if (m.item_code) {
  //       const selectedProduct = products.find(
  //         (product) => product.item_code === m.item_code
  //       );
  //       if (selectedProduct) {
  //         m.uom = selectedProduct.uom;
  //         m.is_serial = selectedProduct.has_serial == "Y" ? "Yes" : "No";
  //       }
  //     }
  //   });
  // }, [muatan, products]);

  const handleAdd = () => {
    const newRow = {
      ID: Date.now(), // Gunakan timestamp sebagai ID unik
      inbound_id: headerForm.ID > 0 ? headerForm.ID : 0,
      item_code: "",
      quantity: 0,
      whs_code: "",
      uom: "",
      received_date: new Date().toISOString().split("T")[0], // Tanggal hari ini
      remarks: "",
      mode: "create",
    };
    setMuatan([...muatan, newRow]);
    setEditingId(newRow.ID);
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
                  is_serial: selectedProduct.has_serial,
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

  const handleSaveItem = async () => {
    const editingItem = muatan.find((m) => m.ID === editingId);

    console.log("Item yang akan diedit:", editingItem);

    if (!editingItem) return;

    console.log("Item yang sedang diedit:", editingItem);

    try {
      await muatanSchema.validate(editingItem, { abortEarly: false });

      // validasi lolos

      console.log("Data yang dikirim:", editingItem);

      // Simpan ke backend di sini jika mau

      const res = await api.post(
        `/inbound/item/` + editingItem.inbound_id,
        editingItem,
        { withCredentials: true }
      );
      if (res.data.success) {
        console.log("Data yang telah disimpan:", res.data.data);

        eventBus.emit("showAlert", {
          title: "Success!",
          description: res.data.message,
          type: "success",
        });

        setMuatan((prev) =>
          prev.map((m) => (m.ID === editingItem.ID ? res.data.data : m))
        );
        setErrors((prev) => ({ ...prev, [editingItem.ID]: {} }));
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
        [editingItem.ID]: fieldErrors,
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
      try {
        const res = await api.get(`/inbound/item/` + item.ID, {
          withCredentials: true,
        });
        if (res.data.success) {
          setMuatan((prev) =>
            prev.map((m) => (m.ID === item.ID ? res.data.data : m))
          );
          setEditingId(null);
          setErrors({});
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
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

    // setMuatan((prev) => prev.filter((m) => m.ID !== id));
    // setSelectedIds((prev) => prev.filter((sid) => sid !== id));
    // if (editingId === id) setEditingId(null);
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

    // setMuatan((prev) => prev.filter((m) => !selectedIds.includes(m.ID)));
    // setSelectedIds([]);
  };

  const totalQty = muatan?.reduce((sum, item) => sum + item.quantity, 0);
  const allSelected =
    muatan?.length > 0 && selectedIds.length === muatan.length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Requested Items</h2>
        {headerForm.status !== "complete" && (
          <div className="space-x-2">
            <Button
              variant="destructive"
              onClick={handleDeleteSelected}
              disabled={selectedIds.length === 0}
            >
              Delete Selected
            </Button>
            <Button type="button" onClick={handleAdd}>
              Add Item
            </Button>
          </div>
        )}
      </div>

      <table className="w-full border font-normal text-sm">
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
            <th className="p-2 border" style={{ width: "30px" }}>
              Serial
            </th>
            <th className="p-2 border" style={{ width: "50px" }}>
              UoM
            </th>
            <th className="p-2 border" style={{ width: "100px" }}>
              Qty
            </th>
            <th className="p-2 border" style={{ width: "160px" }}>
              Whs Code
            </th>
            <th className="p-2 border" style={{ width: "140px" }}>
              Rcv Date
            </th>
            <th className="p-2 border">Remarks</th>
            <th className="p-2 border" style={{ width: "160px" }}>
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {muatan?.map((item, index) => {
            const isEditing = editingId === item.ID;
            return (
              <tr key={item.ID} className="border-t">
                <td className="p-2 border text-center">
                  <input
                    disabled={headerForm.status === "complete"}
                    type="checkbox"
                    checked={selectedIds.includes(item.ID)}
                    onChange={(e) => handleSelect(item.ID, e.target.checked)}
                  />
                </td>
                <td className="p-2 border text-center">{index + 1}</td>

                {isEditing || item.mode === "create" ? (
                  <>
                    <td className="p-2 border">
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
                    </td>
                    <td className="p-2 border">
                      <Input
                        readOnly
                        type="text"
                        className="w-14"
                        value={item.is_serial}
                        // onChange={(e) =>
                        //   handleChange(item.ID, "remarks", e.target.value)
                        // }
                      />
                      {/* {errors[item.ID]?.remarks && (
                        <small className="text-red-500">
                          {errors[item.ID].remarks}
                        </small>
                      )} */}
                    </td>
                    <td className="p-2 border">
                      <Input
                        readOnly
                        type="text"
                        className="w-14"
                        value={item.uom}
                        // onChange={(e) =>
                        //   handleChange(item.ID, "remarks", e.target.value)
                        // }
                      />
                      {/* {errors[item.ID]?.remarks && (
                        <small className="text-red-500">
                          {errors[item.ID].remarks}
                        </small>
                      )} */}
                    </td>
                    <td className="p-2 border">
                      <div>
                        <Input
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
                      <Select
                        value={whsCodeOptions.find(
                          (option) => option.value === item.whs_code
                        )}
                        options={whsCodeOptions}
                        onChange={(value) =>
                          handleChange(item.ID, "whs_code", value?.value)
                        }
                      />

                      {errors[item.ID]?.whs_code && (
                        <small className="text-red-500">
                          {errors[item.ID].whs_code}
                        </small>
                      )}
                    </td>
                    <td className="p-2 border">
                      <Input
                        type="date"
                        value={item.received_date}
                        onChange={(e) =>
                          handleChange(item.ID, "received_date", e.target.value)
                        }
                      />
                      {errors[item.ID]?.received_date && (
                        <small className="text-red-500">
                          {errors[item.ID].received_date}
                        </small>
                      )}
                    </td>
                    <td className="p-2 border">
                      <Input
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
                      style={{ width: "160px" }}
                    >
                      {headerForm.mode != "create" && (
                        <Button size="sm" onClick={handleSaveItem}>
                          <Save size={14} />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleCancel(item);
                        }}
                      >
                        <X size={14} />
                      </Button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2 border">{item.item_code}</td>
                    <td className="p-2 border text-center">{item.is_serial}</td>
                    <td className="p-2 border text-center">{item.uom}</td>
                    <td className="p-2 border text-center">{item.quantity}</td>
                    <td className="p-2 border text-center">{item.whs_code}</td>
                    <td className="p-2 border text-center">
                      {dayjs(item.received_date).format("D MMMM YYYY")}
                    </td>
                    <td className="p-2 border">{item.remarks}</td>
                    <td
                      className="p-2 border space-x-2 text-center"
                      style={{ width: "160px" }}
                    >
                      {headerForm.status !== "complete" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item.ID)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item.ID)}
                          >
                            <Trash size={14} />
                          </Button>
                        </>
                      )}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-semibold">
            <td className="p-2 border" colSpan={5}>
              Total
            </td>
            <td className="p-2 border text-center">{totalQty}</td>
            <td className="p-2 border" colSpan={2}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
