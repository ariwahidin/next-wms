/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Select from "react-select";
import { Copy, Pencil, Trash, X } from "lucide-react";
import {
  CombinedOutboundProps,
  ItemFormProps,
  ItemOptions,
} from "@/types/outbound";
import { Product } from "@/types/item";
import api from "@/lib/api";
import ItemSelectionModal from "@/components/outbound/create-manual/ItemSelectionModal";
import { useRouter } from "next/router";
import { InventoryPolicy } from "@/types/inventory";
import { UomConversion } from "@/types/uom";
import { tr } from "date-fns/locale";

export default function ItemFormTable({
  muatan,
  setMuatan,
  headerForm,
  setHeaderForm,
  outboundScan,
  setOutboundScan,
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
  const [defaultOptions, setDefaultOptions] = useState([]);
  const [selectStates, setSelectStates] = useState({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<ItemFormProps | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [invPolicy, setInvPolicy] = useState<InventoryPolicy>();
  const [uomConversion, setUomConversion] = useState<UomConversion>();
  const router = useRouter();
  const path = router.pathname;
  let modeForm: "add" | "edit" | "copy" = "add";
  if (path.includes("/copy/")) {
    modeForm = "copy";
  } else if (path.includes("/edit/")) {
    modeForm = "edit";
  } else if (path.includes("/add")) {
    modeForm = "add";
  }

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


  // const handleSelect = (id: number, checked: boolean) => {
  //   setSelectedIds((prev) =>
  //     checked ? [...prev, id] : prev.filter((sid) => sid !== id)
  //   );
  // };

  const fetchData = async () => {
    try {
      const [products, uoms, vasPages, policies] = await Promise.all([
        api.get("/products?owner=" + headerForm.owner_code),
        api.get("/uoms"),
        api.get("/vas/page"),
        api.get("/inventory/policy?owner=" + headerForm.owner_code),
      ]);

      if (products.data.success
        && uoms.data.success
        && vasPages.data.success
        && policies.data.success
      ) {
        setProducts(products.data.data);
        setItemCodeOptions(
          products.data.data.map((item: Product) => ({
            value: item.item_code,
            label: item.item_code,
          }))
        );

        // const defaultUoms = uoms.data.data.map((item: any) => ({
        //   value: item.code,
        //   label: item.code,
        // }));
        // setDefaultUoms(defaultUoms);

        setVasPages(vasPages.data.data);
        const vasOptions = vasPages.data.data.map((item: any) => ({
          value: item.ID,
          label: item.name,
        }));
        setVasOptions(vasOptions);

        // Set default UOM options
        const defaultUoms = uoms.data.data.map((item: any) => ({
          value: item.code,
          label: item.code,
        }));

        setDefaultOptions(defaultUoms);
        setInvPolicy(policies.data.data.inventory_policy);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [headerForm.owner_code]);

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

  const handleChange = async (
    id: number,
    field: keyof ItemFormProps,
    value: string | number
  ) => {
    console.log("ID:", id);
    console.log("Field:", field);
    console.log("Value:", value);

    if (field === "uom") {
      console.log("UOM:", value);
      console.log("ID:", id);
      console.log("ITEM: ", muatan.find((item) => item.ID === id)?.item_code);

      try {
        const res = await api.post("/uoms/uom-item", {
          item_code: muatan.find((item) => item.ID === id)?.item_code,
          from_uom: value,
        });
        if (res.data.success) {
          console.log("Response:", res.data.data);
          console.log("Ean:", res.data.data.ean);

          setMuatan((prev) =>
            prev.map((m) =>
              m.ID === id
                ? {
                  ...m,
                  barcode: res.data.data.ean,
                  uom: res.data.data.from_uom
                  // uom: value,
                }
                : m
            )
          );

          // const selectedProduct = await products.find(
          //   (product) => product.item_code === value
          // );
          // console.log("Produk yang dipilih:", selectedProduct);
          // if (selectedProduct) {
          //   setMuatan((prev) =>
          //     prev.map((m) =>
          //       m.ID === id
          //         ? {
          //           ...m,
          //           barcode: res.data.data.ean,
          //           uom : res.data.data.from_uom
          //           // uom: value,
          //         }
          //         : m
          //     )
          //   );
          // }
        }
      } catch (error) {
        console.error("Error:", error);
      }
    } else if (field === "item_code") {
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
    if (item.mode === "create" || modeForm === "copy") {
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

  const handleCopy = (id: number) => {
    setMuatan((prevItems) => {
      const index = prevItems.findIndex((item) => item.ID === id);
      if (index === -1) return prevItems; // item tidak ditemukan

      const itemToCopy = prevItems[index];

      // Buat ID baru unik (bisa pakai UUID juga kalau mau)
      const newID = Math.max(...prevItems.map((i) => i.ID), 0) + 1;

      const duplicatedItem = {
        ...itemToCopy,
        ID: newID,
        mode: "create",
        exp_date: "",
        lot_number: "",
      };

      // Sisipkan hasil copy di posisi setelah item yang dicopy
      const newItems = [
        ...prevItems.slice(0, index + 1),
        duplicatedItem,
        ...prevItems.slice(index + 1),
      ];

      return newItems;
    });
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
        barcode: product.barcode,
        remarks: "",
        mode: "create",
        sn: product.has_serial,
        vas_id: vasOptions.find((item) => item.label === "NO")?.value,
        exp_date: "",
        lot_number: "",
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
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          {/* <h2 className="text-lg font-semibold">Requested Items</h2> */}
          {headerForm.status !== "complete" && (
            <div className="space-x-2">
              <Button
                type="button"
                disabled={headerForm.status === "picking" || headerForm.status === "cancel"}
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
                Item
              </th>
              {/* <th className="p-2 border" style={{ width: "300px" }}>
                  Item Name
                </th> */}
              {/* <th className="p-2 border" style={{ width: "150px" }}>
                Barcode
              </th> */}
              <th className="p-2 border" style={{ width: "100px" }}>
                Qty
              </th>
              <th className="p-2 border" style={{ width: "100px" }}>
                Qty Scan
              </th>
              {/* <th className="p-2 border" style={{ width: "55px" }}>
                SN
              </th> */}
              {/* <th className="p-2 border" style={{ width: "120px" }}>
              UoM
            </th> */}
              {/* <th className="p-2 border">Inv. Location</th> */}

              <th className="p-2 border" style={{ width: "30px" }}>
                UoM
              </th>

              {invPolicy?.use_vas && (
                <th className="p-2 border" style={{ width: "140px" }}>VAS</th>
              )}

              {invPolicy?.use_lot_no &&
                (invPolicy?.allocation_lot_by_order ||
                  invPolicy?.require_lot_number) && (
                  <th className="p-2 border" style={{ width: "140px" }}>
                    Lot No.
                  </th>
                )}


              <th className="p-2 border" style={{ width: "130px" }}>
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
                  {/* <td className="p-2 border">
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
                      value={
                        products.find((p) => p.item_code === item.item_code)
                          ?.item_name || ""
                      }
                    />
                  </td> */}
                  <td className="p-2 border"><span className="text-xs">SKU : {item.item_code} <br /> {products.find(
                    (p) => p.item_code === item.item_code
                  )?.item_name || ""}</span> <br /></td>
                  {/* <td className="p-2 border">
                    <Input
                      style={{ fontSize: "12px" }}
                      readOnly
                      type="text"
                      value={item.barcode}
                    />
                  </td> */}
                  <td className="p-2 border">
                    <div>
                      <Input
                        // readOnly={headerForm.status != "open"}
                        style={{ fontSize: "12px", textAlign: "center" }}
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleChange(item.ID, "quantity", e.target.value)
                        }
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      />
                    </div>
                    {errors[item.ID]?.item_code && (
                      <small className="text-red-500">
                        {errors[item.ID].item_code}
                      </small>
                    )}
                  </td>
                  <td className="p-2 border">
                    <div>
                      <Input
                        readOnly={true}
                        style={{ fontSize: "12px", textAlign: "center" }}
                        type="number"
                        value={outboundScan?.find((scan) => scan.outbound_detail_id === item.ID)?.scan_qty || 0}
                        // onChange={(e) =>
                        //   handleChange(item.ID, "weight", e.target.value)
                        // }
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      />
                    </div>
                  </td>
                  <td className="p-2 border">
                    <Select
                      className="w-28"
                      key={item.ID}
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



                  {invPolicy?.use_lot_no &&
                    (invPolicy?.allocation_lot_by_order ||
                      invPolicy?.require_lot_number) && (
                      <td className="p-2 border">
                        <Input
                          style={{ fontSize: "12px" }}
                          type="text"
                          value={item.lot_number}
                          onChange={(e) =>
                            handleChange(item.ID, "lot_number", e.target.value)
                          }
                        />
                        {errors[item.ID]?.remarks && (
                          <small className="text-red-500">
                            {errors[item.ID].lot_number}
                          </small>
                        )}
                      </td>
                    )}


                  {/* <td className="p-2 border">
                    <Input
                      style={{ fontSize: "12px" }}
                      readOnly
                      type="text"
                      value={item.sn}
                    />
                  </td> */}


                  {invPolicy?.use_vas && (
                    <td
                      className="p-2 border space-x-2 text-center"
                      style={{ width: "130px" }}
                    >
                      <Select
                        // isDisabled={headerForm.status == "complete"}
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
                    </td>
                  )}

                  <td
                    className="p-2 border space-x-2 text-center"
                    style={{ width: "130px" }}
                  >
                    {headerForm.status == "open" || item.mode == "create" || modeForm == "copy" ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleCancel(item);
                          }}
                        >
                          <X size={14} />
                        </Button>
                        {invPolicy?.use_lot_no && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopy(item.ID)}
                          >
                            <Copy size={14} />
                          </Button>
                        )}

                      </>
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
              <td className="p-2 border" colSpan={2}>
                Total
              </td>
              <td className="p-2 border text-center">
                {muatan.reduce((acc, item) => acc + item.quantity, 0)}
              </td>
              <td className="p-2 border text-center">
                {outboundScan.reduce((acc, item) => acc + item.scan_qty, 0)}
              </td>
              <td className="p-2 border" colSpan={3}></td>
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
