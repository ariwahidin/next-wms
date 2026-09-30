/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Select from "react-select";
import { Copy, Pencil, X } from "lucide-react";

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
import SerialNumberModal from "./SerialNumberModal";

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

  const [defaultUoms, setDefaultUoms] = useState<any[]>([]);
  const [defaultOptions, setDefaultOptions] = useState<any[]>([]);
  const [divisionOptions, setDivisionOptions] = useState<any[]>([]);
  const [selectStates, setSelectStates] = useState<any>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<ItemFormProps | null>(null);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [invPolicy, setInvPolicy] = useState<InventoryPolicy>();
  const [uomConversion, setUomConversion] = useState<UomConversion>();

  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [serialModalItem, setSerialModalItem] =
    useState<ItemFormProps | null>(null);

  const [savingSerial, setSavingSerial] = useState(false);
  const [isReloadingItems, setIsReloadingItems] = useState(false);

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

  // =========================================================
  // SERIAL NUMBER HELPER
  // =========================================================
  //
  // Backend sekarang bisa mengirim:
  //
  // "SN001,SN002,SN003"
  //
  // atau kalau suatu saat berubah menjadi:
  //
  // ["SN001", "SN002", "SN003"]
  //
  // Di frontend kita selalu normalisasi menjadi string[].
  // =========================================================

  const normalizeSerialNumbers = (value: any): string[] => {
    if (Array.isArray(value)) {
      return value
        .map((serial) => String(serial ?? "").trim())
        .filter((serial) => serial !== "");
    }

    if (typeof value === "string") {
      return value
        .split(",")
        .map((serial) => serial.trim())
        .filter((serial) => serial !== "");
    }

    return [];
  };

  // =========================================================
  // OPEN SERIAL MODAL
  // =========================================================

  const handleOpenSerialModal = (item: ItemFormProps) => {
    const normalizedItem = {
      ...item,
      serial_numbers: normalizeSerialNumbers(item.serial_numbers),
    };

    setSerialModalItem(normalizedItem);
    setIsSerialModalOpen(true);
  };

  // =========================================================
  // SAVE SERIAL NUMBER FROM MODAL
  // =========================================================

  const handleSaveSerialNumbers = (serials: string[]) => {
    if (!serialModalItem) return;

    const normalizedSerials = normalizeSerialNumbers(serials);

    setMuatan((prev) =>
      prev.map((m) =>
        m.ID === serialModalItem.ID
          ? {
              ...m,
              serial_numbers: normalizedSerials,
            }
          : m
      )
    );

    setIsSerialModalOpen(false);
    setSerialModalItem(null);
  };

  // =========================================================
  // RELOAD ITEMS FROM SERVER
  // =========================================================

  const reloadItemsFromServer = useCallback(async () => {
    const outboundNo =
      typeof router.query.no === "string"
        ? router.query.no
        : String(headerForm.outbound_no || "");

    // Tidak ada outbound yang tersimpan di server
    // pada mode add/copy.
    if (
      !outboundNo ||
      outboundNo === "Auto Generate" ||
      headerForm.ID <= 0 ||
      modeForm === "add" ||
      modeForm === "copy"
    ) {
      return;
    }

    setIsReloadingItems(true);

    try {
      const res = await api.get(
        `/outbound/${encodeURIComponent(outboundNo)}`,
        {
          withCredentials: true,
        }
      );

      if (!res.data?.success) {
        throw new Error(
          res.data?.message || "Failed to reload outbound items"
        );
      }

      const data = res.data?.data?.outbound;
      const detailsWithSerial = res.data?.data?.details ?? [];
      const serverScans = res.data?.data?.barcodes ?? [];

      // =====================================================
      // BUILD SERIAL MAP
      // =====================================================

      const serialMap = new Map<number, string[]>();

      if (Array.isArray(detailsWithSerial)) {
        detailsWithSerial.forEach((detail: any) => {
          const detailId = Number(detail?.ID);

          if (!detailId) {
            return;
          }

          const serials = normalizeSerialNumbers(
            detail?.serial_numbers
          );

          serialMap.set(detailId, serials);
        });
      }

      // =====================================================
      // BUILD SERVER ITEMS
      // =====================================================

      const serverItems: ItemFormProps[] = Array.isArray(data?.items)
        ? data.items.map((serverItem: any) => {
            const serialNumbers = serialMap.get(
              Number(serverItem.ID)
            ) ?? normalizeSerialNumbers(serverItem.serial_numbers);

            return {
              ...serverItem,

              item_name:
                serverItem.product?.item_name ||
                serverItem.item_name ||
                "",

              // PENTING:
              // Selalu array di frontend.
              serial_numbers: serialNumbers,

              mode: "edit",
            };
          })
        : [];

      // =====================================================
      // REPLACE STATE
      // =====================================================

      setMuatan(serverItems);

      setOutboundScan(
        Array.isArray(serverScans) ? serverScans : []
      );

      // =====================================================
      // RESET TEMPORARY STATE
      // =====================================================

      setSelectedIds([]);
      setErrors({});
      setEditingId(null);
      setSelectStates({});
      setEditingItem(null);

      setIsModalOpen(false);
      setIsSerialModalOpen(false);
      setSerialModalItem(null);
    } catch (error) {
      console.error(
        "Failed to reload outbound items from server:",
        error
      );

      throw error;
    } finally {
      setIsReloadingItems(false);
    }
  }, [
    headerForm.ID,
    headerForm.outbound_no,
    modeForm,
    router.query.no,
    setMuatan,
    setOutboundScan,
  ]);

  // =========================================================
  // HANDLE UOM FOCUS
  // =========================================================

  const handleFocus = async (
    itemCode: string,
    itemId: string | number
  ) => {
    if (!itemCode || itemCode.trim() === "") {
      return;
    }

    setSelectStates((prev: any) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        loading: true,
      },
    }));

    try {
      const response = await api.post("/uoms/item", {
        item_code: itemCode,
      });

      const uoms = response?.data?.data || [];

      const mappedOptions = uoms.map((item: any) => ({
        value: item.from_uom,
        label: item.from_uom,
      }));

      setSelectStates((prev: any) => ({
        ...prev,
        [itemId]: {
          loading: false,
          options: mappedOptions,
        },
      }));
    } catch (error) {
      console.error("Failed to fetch UOMs:", error);

      setSelectStates((prev: any) => ({
        ...prev,
        [itemId]: {
          loading: false,
          options: [],
        },
      }));
    }
  };

  // =========================================================
  // FETCH MASTER DATA
  // =========================================================

  const fetchData = async () => {
    try {
      const [
        productsResponse,
        uomsResponse,
        vasPagesResponse,
        policiesResponse,
        divisionsResponse,
      ] = await Promise.all([
        api.get(
          "/products/stock-available?owner=" +
            headerForm.owner_code
        ),
        api.get("/uoms"),
        api.get("/vas/page"),
        api.get(
          "/inventory/policy?owner=" +
            headerForm.owner_code
        ),
        api.get("/divisions"),
      ]);

      if (
        productsResponse.data.success &&
        uomsResponse.data.success &&
        vasPagesResponse.data.success &&
        policiesResponse.data.success &&
        divisionsResponse.data.success
      ) {
        // ===================================================
        // PRODUCTS
        // ===================================================

        const productData = productsResponse.data.data || [];

        setProducts(productData);

        setItemCodeOptions(
          productData.map((item: Product) => ({
            value: item.item_code,
            label: item.item_code,
          }))
        );

        // ===================================================
        // VAS
        // ===================================================

        const vasData = vasPagesResponse.data.data || [];

        setVasPages(vasData);

        const mappedVasOptions = vasData.map(
          (item: any) => ({
            value: item.ID,
            label: item.name,
          })
        );

        setVasOptions(mappedVasOptions);

        // ===================================================
        // UOM
        // ===================================================

        const uomData = uomsResponse.data.data || [];

        const mappedUomOptions = uomData.map(
          (item: any) => ({
            value: item.code,
            label: item.code,
          })
        );

        setDefaultOptions(mappedUomOptions);

        // ===================================================
        // INVENTORY POLICY
        // ===================================================

        setInvPolicy(
          policiesResponse.data.data.inventory_policy
        );

        // ===================================================
        // DIVISION
        // ===================================================

        const divisionData =
          divisionsResponse.data.data || [];

        const mappedDivisionOptions = divisionData.map(
          (item: any) => ({
            value: item.code,
            label: item.code,
          })
        );

        setDivisionOptions(mappedDivisionOptions);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [headerForm.owner_code]);

  // =========================================================
  // ADD ITEM
  // =========================================================

  const handleAddItems = () => {
    setModalMode("create");
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // =========================================================
  // EDIT ITEM
  // =========================================================

  const handleEditItem = (item: ItemFormProps) => {
    setModalMode("edit");
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // =========================================================
  // HANDLE CHANGE
  // =========================================================

  const handleChange = async (
    id: number,
    field: keyof ItemFormProps,
    value: string | number
  ) => {
    console.log("ID:", id);
    console.log("Field:", field);
    console.log("Value:", value);

    // =====================================================
    // UOM
    // =====================================================

    if (field === "uom") {
      const currentItem = muatan.find(
        (item) => item.ID === id
      );

      try {
        const res = await api.post("/uoms/uom-item", {
          item_code: currentItem?.item_code,
          from_uom: value,
        });

        if (res.data.success) {
          setMuatan((prev) =>
            prev.map((m) =>
              m.ID === id
                ? {
                    ...m,
                    barcode: res.data.data.ean,
                    uom: res.data.data.from_uom,
                  }
                : m
            )
          );
        }
      } catch (error) {
        console.error("Error:", error);
      }

      return;
    }

    // =====================================================
    // ITEM CODE
    // =====================================================

    if (field === "item_code") {
      const selectedProduct = products.find(
        (product) => product.item_code === value
      );

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

                  // Jangan pernah mewariskan serial lama
                  // ketika item diganti.
                  serial_numbers: [],
                  serial_number: "",
                }
              : m
          )
        );
      }

      return;
    }

    // =====================================================
    // OTHER FIELD
    // =====================================================

    setMuatan((prev) =>
      prev.map((m) =>
        m.ID === id
          ? {
              ...m,
              [field]:
                field === "quantity"
                  ? Number(value)
                  : value,
            }
          : m
      )
    );
  };

  // =========================================================
  // CANCEL / DELETE ITEM
  // =========================================================

  const handleCancel = async (item: ItemFormProps) => {
    const isLocalOnly =
      item.mode === "create" || modeForm === "copy";

    // =====================================================
    // LOCAL ITEM
    // =====================================================

    if (isLocalOnly) {
      setMuatan((prev) =>
        prev.filter((m) => m.ID !== item.ID)
      );

      setSelectedIds((prev) =>
        prev.filter((sid) => sid !== item.ID)
      );

      setErrors((prev) => {
        const next = { ...prev };
        delete next[item.ID];
        return next;
      });

      return;
    }

    // =====================================================
    // EXISTING ITEM
    // =====================================================

    if (isReloadingItems) {
      return;
    }

    try {
      const res = await api.delete(
        `/outbound/item/${item.ID}`,
        {
          withCredentials: true,
        }
      );

      if (!res.data?.success) {
        throw new Error(
          res.data?.message ||
            "Failed to delete outbound item"
        );
      }

      // Setelah delete, reload dari server.
      await reloadItemsFromServer();
    } catch (error) {
      console.error(
        "Failed to delete outbound item:",
        error
      );
    } finally {
      setIsReloadingItems(false);
    }
  };

  // =========================================================
  // COPY ITEM
  // =========================================================

  const handleCopy = (id: number) => {
    setMuatan((prevItems) => {
      const index = prevItems.findIndex(
        (item) => item.ID === id
      );

      if (index === -1) {
        return prevItems;
      }

      const itemToCopy = prevItems[index];

      const newID =
        Math.max(
          ...prevItems.map((item) => item.ID),
          0
        ) + 1;

      const duplicatedItem = {
        ...itemToCopy,

        ID: newID,

        mode: "create",

        exp_date: "",
        lot_number: "",

        serial_number: "",
        serial_numbers: [],

        carton_number: "",
        case_number: "",
      };

      const newItems = [
        ...prevItems.slice(0, index + 1),
        duplicatedItem,
        ...prevItems.slice(index + 1),
      ];

      return newItems;
    });
  };

  // =========================================================
  // APPLY ITEM SELECTION MODAL
  // =========================================================

  const handleModalApply = (
    selectedItems: Product[]
  ) => {
    console.log("Selected Items:", selectedItems);

    // =====================================================
    // CREATE
    // =====================================================

    if (modalMode === "create") {
      const newItems = selectedItems.map(
        (product) => ({
          ID:
            Date.now() * 1000 +
            Math.floor(Math.random() * 1000),

          item_id: product.ID,

          outbound_id:
            headerForm.ID > 0
              ? headerForm.ID
              : 0,

          item_code: product.item_code,

          quantity: 1,

          location: "",

          uom: product.uom,

          barcode: product.barcode,

          remarks: "",

          mode: "create",

          sn: product.has_serial,

          vas_id: vasOptions.find(
            (item) => item.label === "NO"
          )?.value,

          exp_date: "",

          lot_number: "",

          serial_number: "",

          // Selalu array
          serial_numbers: [],

          carton_number: "",

          case_number: "",

          division_code:
            headerForm.order_type ===
            "B2C - Marketplace"
              ? "E-COMMERCE"
              : "REGULAR",
        })
      );

      setMuatan((prev) => [
        ...prev,
        ...newItems,
      ]);
    }

    // =====================================================
    // EDIT
    // =====================================================

    else if (
      modalMode === "edit" &&
      editingItem &&
      selectedItems.length > 0
    ) {
      const selectedProduct =
        selectedItems[0];

      setMuatan((prev) =>
        prev.map((m) =>
          m.ID === editingItem.ID
            ? {
                ...m,
                item_code:
                  selectedProduct.item_code,
                uom:
                  selectedProduct.uom,
                is_serial:
                  selectedProduct.has_serial,

                // Item berubah,
                // serial lama jangan ikut.
                serial_numbers: [],
                serial_number: "",
              }
            : m
        )
      );
    }

    setIsModalOpen(false);
  };

  // =========================================================
  // COLUMN COUNT
  // =========================================================

  const outboundPolicyColCount = [
    invPolicy?.use_vas,

    invPolicy?.use_lot_no &&
      (invPolicy?.allocation_lot_by_order ||
        invPolicy?.require_lot_number),

    invPolicy?.allocation_location_by_order,
  ].filter(Boolean).length;

  const footerColSpan =
    2 + outboundPolicyColCount + 1;

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      <div className="space-y-4">

        {/* ================================================= */}
        {/* HEADER / ADD ITEM */}
        {/* ================================================= */}

        <div className="flex justify-between items-center">
          {headerForm.status !== "complete" && (
            <div className="space-x-2">
              <Button
                type="button"
                disabled={
                  headerForm.status === "picking" ||
                  headerForm.status === "cancel" ||
                  headerForm.status === "packed"
                }
                onClick={handleAddItems}
              >
                Add Item
              </Button>
            </div>
          )}
        </div>

        {/* ================================================= */}
        {/* TABLE */}
        {/* ================================================= */}

        <table className="w-full border font-normal text-xs">

          {/* ================================================= */}
          {/* THEAD */}
          {/* ================================================= */}

          <thead className="bg-gray-100">
            <tr>

              <th className="p-2 border w-12 text-center">
                No.
              </th>

              <th
                className="p-2 border"
                style={{ width: "300px" }}
              >
                Item
              </th>

              <th
                className="p-2 border"
                style={{ width: "100px" }}
              >
                Qty
              </th>

              <th
                className="p-2 border"
                style={{ width: "100px" }}
              >
                Pack
              </th>

              <th
                className="p-2 border"
                style={{ width: "30px" }}
              >
                Division
              </th>

              <th
                className="p-2 border"
                style={{ width: "30px" }}
              >
                UoM
              </th>

              {invPolicy?.use_vas && (
                <th
                  className="p-2 border"
                  style={{ width: "140px" }}
                >
                  VAS
                </th>
              )}

              {invPolicy?.allocation_lot_by_order && (
                <th
                  className="p-2 border"
                  style={{ width: "140px" }}
                >
                  Lot No.
                </th>
              )}

              {invPolicy?.allocation_case_by_order && (
                <th
                  className="p-2 border"
                  style={{ width: "140px" }}
                >
                  Case No.
                </th>
              )}

              {invPolicy?.allocation_carton_by_order && (
                <th
                  className="p-2 border"
                  style={{ width: "140px" }}
                >
                  Carton No.
                </th>
              )}

              {invPolicy?.allocation_serial_by_order && (
                <th
                  className="p-2 border"
                  style={{ width: "180px" }}
                >
                  Serial No.
                </th>
              )}

              {invPolicy?.allocation_location_by_order && (
                <th
                  className="p-2 border"
                  style={{ width: "140px" }}
                >
                  Location
                </th>
              )}

              <th
                className="p-2 border"
                style={{ width: "130px" }}
              >
                Action
              </th>

            </tr>
          </thead>

          {/* ================================================= */}
          {/* TBODY */}
          {/* ================================================= */}

          <tbody>
            {muatan?.map((item, index) => {

              const isEditableRow =
                headerForm.status === "open" ||
                item.mode === "create" ||
                modeForm === "copy";

              // =================================================
              // SERIAL COUNT
              // =================================================

              const serialNumbers =
                normalizeSerialNumbers(
                  item.serial_numbers
                );

              const serialCount =
                serialNumbers.length;

              return (
                <tr
                  key={item.ID}
                  className="border-t"
                >

                  {/* ========================================= */}
                  {/* NO */}
                  {/* ========================================= */}

                  <td className="p-2 border text-center">
                    {index + 1}
                  </td>

                  {/* ========================================= */}
                  {/* ITEM */}
                  {/* ========================================= */}

                  <td className="p-2 border">

                    <span className="text-xs">
                      SKU : {item.item_code}
                      <br />

                      {products.find(
                        (p) =>
                          p.item_code ===
                          item.item_code
                      )?.item_name || ""}
                    </span>

                    <br />

                    {item.bundle_product_code !== "" && (
                      <span className="text-xs text-gray-400">
                        Bundling for item :{" "}
                        {item.bundle_product_code || ""}
                      </span>
                    )}

                  </td>

                  {/* ========================================= */}
                  {/* QTY */}
                  {/* ========================================= */}

                  <td className="p-2 border">

                    {isEditableRow ? (
                      <Input
                        style={{
                          fontSize: "12px",
                          textAlign: "center",
                        }}
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleChange(
                            item.ID,
                            "quantity",
                            e.target.value
                          )
                        }
                        onWheel={(e) =>
                          (
                            e.target as HTMLInputElement
                          ).blur()
                        }
                      />
                    ) : (
                      <div className="text-center">
                        {item.quantity}
                      </div>
                    )}

                  </td>

                  {/* ========================================= */}
                  {/* PACK */}
                  {/* ========================================= */}

                  <td className="p-2 border">

                    <div>
                      <Input
                        readOnly={true}
                        style={{
                          fontSize: "12px",
                          textAlign: "center",
                        }}
                        type="number"
                        value={
                          outboundScan?.find(
                            (scan) =>
                              scan.outbound_detail_id ===
                              item.ID
                          )?.scan_qty || 0
                        }
                        onWheel={(e) =>
                          (
                            e.target as HTMLInputElement
                          ).blur()
                        }
                      />
                    </div>

                  </td>

                  {/* ========================================= */}
                  {/* DIVISION */}
                  {/* ========================================= */}

                  <td className="p-2 border">

                    <Select
                      className="w-40"
                      key={item.ID}
                      options={divisionOptions}
                      value={divisionOptions.find(
                        (option) =>
                          option.value ===
                          item.division_code
                      )}
                      onChange={(value) =>
                        handleChange(
                          item.ID,
                          "division_code",
                          value?.value
                        )
                      }
                    />

                  </td>

                  {/* ========================================= */}
                  {/* UOM */}
                  {/* ========================================= */}

                  <td className="p-2 border">

                    <Select
                      className="w-28"
                      key={item.ID}
                      options={
                        selectStates[item.ID]
                          ?.options ??
                        defaultOptions
                      }
                      onFocus={() =>
                        handleFocus(
                          item.item_code,
                          item.ID
                        )
                      }
                      isLoading={
                        selectStates[item.ID]
                          ?.loading ?? false
                      }
                      value={(
                        selectStates[item.ID]
                          ?.options ??
                        defaultOptions
                      ).find(
                        (option: any) =>
                          option.value ===
                          item.uom
                      )}
                      onChange={(value) =>
                        handleChange(
                          item.ID,
                          "uom",
                          value?.value
                        )
                      }
                    />

                  </td>

                  {/* ========================================= */}
                  {/* VAS */}
                  {/* ========================================= */}

                  {invPolicy?.use_vas && (
                    <td
                      className="p-2 border space-x-2 text-center"
                      style={{ width: "130px" }}
                    >

                      <Select
                        className="text-sm w-34"
                        isSearchable
                        value={vasOptions.find(
                          (option) =>
                            option.value ===
                            item.vas_id
                        )}
                        options={vasOptions}
                        onChange={(value) =>
                          handleChange(
                            item.ID,
                            "vas_id",
                            value?.value
                          )
                        }
                      />

                    </td>
                  )}

                  {/* ========================================= */}
                  {/* LOT NUMBER */}
                  {/* ========================================= */}

                  {invPolicy?.allocation_lot_by_order && (
                    <td className="p-2 border">

                      <Input
                        style={{
                          fontSize: "12px",
                        }}
                        type="text"
                        value={
                          item.lot_number
                        }
                        onChange={(e) =>
                          handleChange(
                            item.ID,
                            "lot_number",
                            e.target.value
                          )
                        }
                      />

                      {errors[item.ID]?.lot_number && (
                        <small className="text-red-500">
                          {errors[item.ID].lot_number}
                        </small>
                      )}

                    </td>
                  )}

                  {/* ========================================= */}
                  {/* CASE NUMBER */}
                  {/* ========================================= */}

                  {invPolicy?.allocation_case_by_order && (
                    <td className="p-2 border">

                      <Input
                        style={{
                          fontSize: "12px",
                        }}
                        type="text"
                        value={
                          item.case_number
                        }
                        onChange={(e) =>
                          handleChange(
                            item.ID,
                            "case_number",
                            e.target.value
                          )
                        }
                      />

                      {errors[item.ID]?.case_number && (
                        <small className="text-red-500">
                          {
                            errors[item.ID]
                              .case_number
                          }
                        </small>
                      )}

                    </td>
                  )}

                  {/* ========================================= */}
                  {/* CARTON NUMBER */}
                  {/* ========================================= */}

                  {invPolicy?.allocation_carton_by_order && (
                    <td className="p-2 border">

                      <Input
                        style={{
                          fontSize: "12px",
                        }}
                        type="text"
                        value={
                          item.carton_number
                        }
                        onChange={(e) =>
                          handleChange(
                            item.ID,
                            "carton_number",
                            e.target.value
                          )
                        }
                      />

                      {errors[item.ID]?.carton_number && (
                        <small className="text-red-500">
                          {
                            errors[item.ID]
                              .carton_number
                          }
                        </small>
                      )}

                    </td>
                  )}

                  {/* ========================================= */}
                  {/* SERIAL NUMBER */}
                  {/* ========================================= */}
                  {/*
                    PENTING:

                    Tidak ada Input di sini.

                    Data serial berasal dari:
                    outbound_serials

                    Backend mengirim:
                    "SN001,SN002,SN003"

                    frontend normalize menjadi:
                    ["SN001", "SN002", "SN003"]

                    Editing dilakukan lewat SerialNumberModal.
                  */}

                  {invPolicy?.allocation_serial_by_order && (
                    <td className="p-2 border align-top">

                      {serialNumbers.length > 0 ? (
                        <div
                          className="
                            text-xs
                            whitespace-normal
                            break-all
                            leading-5
                          "
                        >
                          {serialNumbers.join(", ")}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          -
                        </span>
                      )}

                    </td>
                  )}

                  {/* ========================================= */}
                  {/* LOCATION */}
                  {/* ========================================= */}

                  {invPolicy?.allocation_location_by_order && (
                    <td className="p-2 border">

                      <Input
                        style={{
                          fontSize: "12px",
                        }}
                        type="text"
                        value={
                          item.location
                        }
                        onChange={(e) =>
                          handleChange(
                            item.ID,
                            "location",
                            e.target.value
                          )
                        }
                      />

                      {errors[item.ID]?.location && (
                        <small className="text-red-500">
                          {errors[item.ID].location}
                        </small>
                      )}

                    </td>
                  )}

                  {/* ========================================= */}
                  {/* ACTION */}
                  {/* ========================================= */}

                  <td
                    className="
                      p-2
                      border
                      space-x-2
                      text-center
                    "
                    style={{
                      width: "130px",
                    }}
                  >

                    {/* ======================================= */}
                    {/* EDITABLE ROW */}
                    {/* ======================================= */}

                    {headerForm.status === "open" ||
                    item.mode === "create" ||
                    modeForm === "copy" ? (
                      <>
                        {/* DELETE */}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleCancel(item)
                          }
                          disabled={
                            isReloadingItems
                          }
                          title="Delete item"
                        >
                          <X size={14} />
                        </Button>

                        {/* COPY */}

                        {(invPolicy?.allocation_lot_by_order ||
                          invPolicy?.allocation_location_by_order ||
                          invPolicy?.allocation_case_by_order ||
                          invPolicy?.allocation_carton_by_order ||
                          invPolicy?.allocation_serial_by_order) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleCopy(item.ID)
                            }
                            title="Copy item"
                          >
                            <Copy size={14} />
                          </Button>
                        )}

                        {/* SERIAL MODAL */}

                        {(headerForm.status ===
                          "open" ||
                          headerForm.status ===
                            "picking" ||
                          headerForm.status ===
                            "packed") && (
                          <Button
                            size="sm"
                            variant={
                              serialCount ===
                              Number(
                                item.quantity
                              )
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              handleOpenSerialModal(
                                item
                              )
                            }
                            title="Isi Serial Number"
                          >
                            SN {serialCount}/
                            {item.quantity}
                          </Button>
                        )}
                      </>
                    ) : (
                      /* ===================================== */
                      /* NON EDITABLE ROW */
                      /* ===================================== */

                      <>
                        {(headerForm.status ===
                          "open" ||
                          headerForm.status ===
                            "picking" ||
                          headerForm.status ===
                            "packed") && (
                          <Button
                            size="sm"
                            variant={
                              serialCount ===
                              Number(
                                item.quantity
                              )
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              handleOpenSerialModal(
                                item
                              )
                            }
                            title="Isi Serial Number"
                          >
                            SN {serialCount}/
                            {item.quantity}
                          </Button>
                        )}
                      </>
                    )}

                  </td>

                </tr>
              );
            })}
          </tbody>

          {/* ================================================= */}
          {/* TFOOT */}
          {/* ================================================= */}

          <tfoot>
            <tr className="bg-gray-100 font-semibold">

              <td
                className="p-2 border"
                colSpan={2}
              >
                Total
              </td>

              <td className="p-2 border text-center">
                {muatan.reduce(
                  (acc, item) =>
                    acc +
                    Number(item.quantity || 0),
                  0
                )}
              </td>

              <td className="p-2 border text-center">
                {outboundScan.reduce(
                  (acc, item) =>
                    acc +
                    Number(item.scan_qty || 0),
                  0
                )}
              </td>

              <td
                className="p-2 border"
                colSpan={footerColSpan}
              />

            </tr>
          </tfoot>

        </table>
      </div>

      {/* ===================================================== */}
      {/* ITEM SELECTION MODAL */}
      {/* ===================================================== */}

      <ItemSelectionModal
        isOpen={isModalOpen}
        onClose={() =>
          setIsModalOpen(false)
        }
        products={products}
        onApply={handleModalApply}
        selectedItems={muatan}
      />

      {/* ===================================================== */}
      {/* SERIAL NUMBER MODAL */}
      {/* ===================================================== */}

      <SerialNumberModal
        isOpen={isSerialModalOpen}
        onClose={() => {
          setIsSerialModalOpen(false);
          setSerialModalItem(null);
        }}
        onSave={handleSaveSerialNumbers}
        quantity={
          Number(
            serialModalItem?.quantity
          ) || 0
        }
        initialValue={
          normalizeSerialNumbers(
            serialModalItem?.serial_numbers
          )
        }
        itemCode={
          serialModalItem?.item_code ?? ""
        }
      />
    </>
  );
}