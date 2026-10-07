/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Select from "react-select";
import { Trash, Save, Pencil, X, Plus, Copy, RefreshCcw, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import * as yup from "yup";
import {
  CombinedInboundProps,
  HeaderFormProps,
  InboundDetails,
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
import { InventoryPolicy } from "@/types/inventory";
import { useRouter } from "next/navigation";
import { QrCode } from "lucide-react";
import SerialNumberModal from "./SerialNumberModal";


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
  qa_status: yup.string().required("Status wajib diisi"),
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
  inboundDetails,
  setInboundDetails,
}: CombinedInboundProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [invPolicy, setInvPolicy] = useState<InventoryPolicy>();
  const [itemCodeOptions, setItemCodeOptions] = useState<ItemOptions[]>([]);
  const [whsCodeOptions, setWhsCodeOptions] = useState<ItemOptions[]>([]);
  const [optionsStatus, setOptionsStatus] = useState<ItemOptions[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<{
    [id: number]: { [key: string]: string };
  }>({});

  const [defaultOptions, setDefaultOptions] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<ItemFormProps | null>(null);

  const [searchTermMuatan, setSearchTermMuatan] = useState<string>("");
  const [filteredMuatan, setFilteredMuatan] = useState<ItemFormProps[]>([]);
  const [showCheckingPending, setShowCheckingPending] = useState(false);
  const [divisionOptions, setDivisionOptions] = useState([]);

  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [serialModalItem, setSerialModalItem] = useState<ItemFormProps | null>(null);

  const [isTableOpen, setIsTableOpen] = useState(true);

  const handleOpenSerialModal = (item: ItemFormProps) => {
    setSerialModalItem(item);
    setIsSerialModalOpen(true);
  };

  const handleSaveSerialNumbers = (serials: string[]) => {
    if (!serialModalItem) return;

    setMuatan((prev) =>
      prev.map((m) =>
        m.ID === serialModalItem.ID ? { ...m, serial_numbers: serials } : m
      )
    );
    setFilteredMuatan((prev) =>
      prev.map((m) =>
        m.ID === serialModalItem.ID ? { ...m, serial_numbers: serials } : m
      )
    );

    setIsSerialModalOpen(false);
    setSerialModalItem(null);
  };

  console.log("INBOUND DETAILS ", inboundDetails);

  const fetchData = async () => {
    try {
      const [products, warehouses, uoms, policies, qa_status, divisions] = await Promise.all([
        api.get("/products?owner=" + headerForm.owner_code),
        api.get("/warehouses"),
        api.get("/uoms"),
        api.get("/inventory/policy?owner=" + headerForm.owner_code),
        api.get("/qa-status"),
        api.get("/divisions"),
      ]);

      if (
        products.data.success &&
        warehouses.data.success &&
        uoms.data.success &&
        policies.data.success &&
        qa_status.data.success &&
        divisions.data.success
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
        setInvPolicy(policies.data.data.inventory_policy);

        setOptionsStatus(
          qa_status.data.data.map((item: any) => ({
            value: item.qa_status,
            label: item.qa_status,
          }))
        );

        const divisionOptions = divisions.data.data.map((item: any) => ({
          value: item.code,
          label: item.code,
        }));
        setDivisionOptions(divisionOptions);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [headerForm.owner_code]);

  // Handle modal untuk add items
  const handleAddItems = () => {
    setModalMode("create");
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Handle modal untuk edit item
  const handleEditItem = (item: ItemFormProps) => {
    console.log("Item yang akan diedit:", item);
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
        ID: Date.now() * 1000 + Math.floor(Math.random() * 1000),
        item_id: product.ID,
        inbound_id: headerForm.ID > 0 ? headerForm.ID : 0,
        item_code: product.item_code,
        quantity: 1,
        qa_status: "A",
        location: "STAGING",
        ref_id: inboundReferences.ID,
        ref_no: inboundReferences.ref_no,
        uom: product.uom,
        division: "REGULAR",
        rec_date: new Date().toISOString().split("T")[0],
        // prod_date: new Date().toISOString().split("T")[0],
        prod_date: "",
        exp_date: "",
        lot_number: "",
        remarks: "",
        mode: "create",
        is_serial: product.has_serial,
        division_code: "REGULAR",
        serial_number: "", // Initialize serial_number as an empty string
        serial_numbers: [] as string[],
        carton_number: "",
        case_number: "",
      }));

      setMuatan((prev) => [...prev, ...newItems]);
      setFilteredMuatan((prev) => [...prev, ...newItems]);
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
      setFilteredMuatan((prev) =>
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

  // const handleChange = (
  //   id: number,
  //   field: keyof ItemFormProps,
  //   value: string | number
  // ) => {
  //   console.log("ID:", id);
  //   console.log("Field:", field);
  //   console.log("Value:", value);

  //   setMuatan((prev) =>
  //     prev.map((m) =>
  //       m.ID === id
  //         ? {
  //           ...m,
  //           [field]:
  //             field === "quantity"
  //               ? value === "" ? "" : Number(value)
  //               : value,
  //         }
  //         : m
  //     )
  //   );

  //   setFilteredMuatan((prev) =>
  //     prev.map((m) =>
  //       m.ID === id
  //         ? {
  //           ...m,
  //           [field]:
  //             field === "quantity"
  //               ? value === "" ? "" : Number(value)
  //               : value,
  //         }
  //         : m
  //     )
  //   );


  // };

  // const handleChange = (
  //   id: number,
  //   field: keyof ItemFormProps,
  //   value: string | number
  // ) => {
  //   const applyUpdate = (m: ItemFormProps) => {
  //     if (field === "quantity") {
  //       const rawQty = value === "" ? "" : Number(value);
  //       const qty = rawQty === "" ? "" : Math.floor(rawQty as number);

  //       let nextSerials = m.serial_numbers ?? [];
  //       if (m.is_serial && typeof qty === "number" && nextSerials.length > qty) {
  //         const removed = nextSerials.length - qty;
  //         nextSerials = nextSerials.slice(0, qty);
  //         eventBus.emit("showAlert", {
  //           title: "Perhatian",
  //           description: `${removed} serial number dihapus karena qty diubah`,
  //           type: "info",
  //         });
  //       }

  //       return { ...m, quantity: qty, serial_numbers: nextSerials };
  //     }

  //     return { ...m, [field]: value };
  //   };

  //   setMuatan((prev) => prev.map((m) => (m.ID === id ? applyUpdate(m) : m)));
  //   setFilteredMuatan((prev) => prev.map((m) => (m.ID === id ? applyUpdate(m) : m)));
  // };

  const handleChange = (
    id: number,
    field: keyof ItemFormProps,
    value: string | number
  ) => {
    const applyUpdate = (m: ItemFormProps): ItemFormProps => {
      if (field === "quantity") {
        const rawQty = value === "" ? "" : Number(value);
        // const qty: number | "" = rawQty === "" ? "" : Math.floor(rawQty as number);
        const qty = rawQty === "" ? 0 : Math.floor(rawQty as number);

        let nextSerials = m.serial_numbers ?? [];
        if (m.is_serial && typeof qty === "number" && nextSerials.length > qty) {
          const removed = nextSerials.length - qty;
          nextSerials = nextSerials.slice(0, qty);
          eventBus.emit("showAlert", {
            title: "Perhatian",
            description: `${removed} serial number dihapus karena qty diubah`,
            type: "info",
          });
        }

        return { ...m, quantity: qty, serial_numbers: nextSerials };
      }

      return { ...m, [field]: value };
    };

    setMuatan((prev) => prev.map((m) => (m.ID === id ? applyUpdate(m) : m)));
    setFilteredMuatan((prev) => prev.map((m) => (m.ID === id ? applyUpdate(m) : m)));
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
      setFilteredMuatan((prev) => prev.filter((m) => m.ID !== item.ID));
    } else {
      eventBus.emit("refreshData");
      setErrors((prev) => ({ ...prev, [item.ID]: {} }));
      setEditingId(null);
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
        serial_number: "",
        carton_number: "",
        case_number: "",
      };

      // Sisipkan hasil copy di posisi setelah item yang dicopy
      const newItems = [
        ...prevItems.slice(0, index + 1),
        duplicatedItem,
        ...prevItems.slice(index + 1),
      ];

      return newItems;
    });

    setFilteredMuatan((prevItems) => {
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
        serial_number: "",
        carton_number: "",
        case_number: "",
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

  const handleDelete = async (id: number) => {
    console.log("Deleting item with ID:", id);

    try {
      const res = await api.delete(`/inbound/item/` + id, {
        withCredentials: true,
      });
      if (res.data.success) {
        setMuatan((prev) => prev.filter((m) => m.ID !== id));
        setFilteredMuatan((prev) => prev.filter((m) => m.ID !== id));
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
          setFilteredMuatan((prev) => prev.filter((m) => m.ID !== id));
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

  // useEffect(() => {
  //   if (searchTermMuatan) {
  //     const filtered = muatan.filter((item) =>
  //       item.item_code.toLowerCase().includes(searchTermMuatan.toLowerCase())
  //       || item.lot_number.toLowerCase().includes(searchTermMuatan.toLowerCase())
  //       || products.find((product) => product.item_code === item.item_code)?.item_name.toLowerCase().includes(searchTermMuatan.toLowerCase())
  //     );
  //     setFilteredMuatan(filtered);
  //   } else {
  //     setFilteredMuatan(muatan);
  //   }
  // }, [searchTermMuatan])

  useEffect(() => {
    let filtered = muatan;

    // Search
    if (searchTermMuatan) {
      const search = searchTermMuatan.toLowerCase();

      filtered = filtered.filter((item) =>
        item.item_code.toLowerCase().includes(search) ||
        item.lot_number.toLowerCase().includes(search) ||
        products
          .find((product) => product.item_code === item.item_code)
          ?.item_name?.toLowerCase()
          .includes(search)
      );
    }

    // Checking Pending
    // if (headerForm.status === "checking" && showCheckingPending) {

    if (
      ["open", "checking"].includes(headerForm.status) &&
      showCheckingPending
    ) {
      filtered = filtered.filter((item) => {
        const detail = inboundDetails.find(
          (d) => d.id === item.ID
        );

        const planQty = Number(item.quantity) || 0;
        const scanQty = Number(detail?.qty_scan) || 0;

        return planQty !== scanQty;
      });
    }

    setFilteredMuatan(filtered);
  }, [
    muatan,
    searchTermMuatan,
    products,
    headerForm.status,
    showCheckingPending,
    inboundDetails,
  ]);

  const router = useRouter();

  const handleGenerateQR = (item: ItemFormProps) => {
    router.push(`/wms/utilities/qr-generator?item_id=${item.item_id}`);
  };

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

  const allSelected =
    muatan?.length > 0 && selectedIds.length === muatan.length;

  // Kolom utama dibuat fixed supaya layout konsisten seperti tabel outbound.
  // Field policy tambahan tetap ditampilkan di bawah Item sebagai informasi compact,
  // sehingga tabel utama tidak melebar ke kanan.
  const filteredItems = filteredMuatan.filter(
    (item) => item.ref_id === inboundReferences.ID
  );

  const getSerials = (item: ItemFormProps): string[] =>
    (item.serial_numbers ?? [])
      .map((serial) => serial?.trim())
      .filter((serial): serial is string => Boolean(serial));

  const isEditableRow = (item: ItemFormProps) =>
    headerForm.status === "open" ||
    headerForm.status === "draft" ||
    headerForm.mode === "create" ||
    item.mode === "create";

  const footerColSpan = 9;

  return (
    <>
      <div className="w-full space-y-3">
        {/* =========================================================
            TOOLBAR
        ========================================================== */}
        <div className="flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsTableOpen((prev) => !prev)}
              className="h-9 gap-2 px-2"
              title={isTableOpen ? "Close Table" : "Open Table"}
            >
              {isTableOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              <span className="font-semibold">
                {isTableOpen ? "Minimize" : "Maximize"}
              </span>
            </Button>

            {['open', 'checking'].includes(headerForm.status) && (
              <div className="flex h-9 items-center gap-2 rounded-md px-1">
                <span className="whitespace-nowrap text-sm font-medium">
                  {headerForm.status === "open"
                    ? "Unreceived"
                    : "Checking Pending"}
                </span>

                <button
                  type="button"
                  onClick={() => setShowCheckingPending((prev) => !prev)}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${showCheckingPending ? "bg-blue-600" : "bg-gray-300"
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${showCheckingPending ? "translate-x-4" : "translate-x-0.5"
                      }`}
                  />
                </button>
              </div>
            )}

            {headerForm.status !== "complete" &&
              (headerForm.status === "open" ||
                headerForm.status === "draft") && (
                <Button
                  type="button"
                  onClick={handleAddItems}
                  className="h-9 gap-2 rounded-md px-4"
                >
                  Add Items
                </Button>
              )}
          </div>

          {isTableOpen && (
            <div className="w-full sm:w-[220px] md:w-[260px]">
              <input
                type="text"
                placeholder="Search..."
                className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                value={searchTermMuatan}
                onChange={(e) => setSearchTermMuatan(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* =========================================================
            TABLE
        ========================================================== */}
        {isTableOpen && (
          <div className="w-full overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm">
            <table
              className="w-full min-w-[1180px] border-collapse text-[12px]"
              style={{ tableLayout: "fixed" }}
            >
              <colgroup>
                <col style={{ width: "3.2%" }} />   {/* No */}
                <col style={{ width: "20%" }} />    {/* Item */}
                <col style={{ width: "6%" }} />     {/* Qty */}
                <col style={{ width: "6%" }} />     {/* Pack */}
                <col style={{ width: "9%" }} />    {/* Division */}
                <col style={{ width: "10%" }} />     {/* Rec Date */}
                <col style={{ width: "15%" }} />    {/* Case */}
                <col style={{ width: "7%" }} />    {/* Carton */}
                <col style={{ width: "8%" }} />    {/* Location */}
                <col style={{ width: "11%" }} />    {/* Serial */}
                <col style={{ width: "11.8%" }} />  {/* Action */}
              </colgroup>

              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-center font-semibold whitespace-nowrap">
                    No.
                  </th>
                  <th className="border p-2 text-center font-semibold">
                    Item
                  </th>
                  <th className="border p-2 text-center font-semibold whitespace-nowrap">
                    Qty
                  </th>
                  <th className="border p-2 text-center font-semibold whitespace-nowrap">
                    Pack
                  </th>
                  <th className="border p-2 text-center font-semibold whitespace-nowrap">
                    Division
                  </th>
                  <th className="border p-2 text-center font-semibold whitespace-nowrap">
                    Rec Date
                  </th>
                  <th className="border p-2 text-center font-semibold whitespace-nowrap">
                    Case No.
                  </th>
                  <th className="border p-2 text-center font-semibold whitespace-nowrap">
                    Carton No.
                  </th>
                  <th className="border p-2 text-center font-semibold whitespace-nowrap">
                    Location
                  </th>
                  <th className="border p-2 text-center font-semibold whitespace-nowrap">
                    Serial No.
                  </th>
                  <th className="border p-2 text-center font-semibold whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item, index) => {
                  const isEditing = editingId === item.ID;
                  const editable = isEditableRow(item);
                  const serials = getSerials(item);
                  const quantity = Number(item.quantity) || 0;
                  const packQty = Number(
                    inboundDetails.find((d) => d.id === item.ID)?.qty_scan ?? 0
                  );

                  return (
                    <tr
                      key={item.ID}
                      className="border-t transition-colors hover:bg-gray-50"
                    >
                      {/* NO */}
                      <td className="border p-2 text-center align-middle">
                        {index + 1}
                      </td>

                      {/* ITEM */}
                      <td className="border p-2 align-middle">
                        <div className="min-w-0">
                          <div className="break-words leading-tight">
                            <span className="font-medium text-gray-800">
                              SKU : {item.item_code}
                            </span>
                            <br />
                            <span className="text-gray-700">
                              {products.find(
                                (p) => p.item_code === item.item_code
                              )?.item_name || ""}
                            </span>
                            <span className="text-blue-700 ms-3 text-[11px]">
                              {products.find(
                                (p) => p.item_code === item.item_code
                              )?.unit_model || ""}
                            </span>
                          </div>

                          {item.bundle_product_code && (
                            <div className="mt-0.5 break-words text-[11px] text-gray-400">
                              Bundling for item : {item.bundle_product_code}
                            </div>
                          )}

                          {errors[item.ID]?.item_code && (
                            <small className="mt-1 block text-red-500">
                              {errors[item.ID].item_code}
                            </small>
                          )}
                        </div>
                      </td>

                      {/* QTY */}
                      <td className="border p-2 align-middle">
                        {editable ? (
                          <>
                            <Input
                              className="h-8 w-full min-w-0 text-center text-xs"
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
                                (e.target as HTMLInputElement).blur()
                              }
                            />
                            {errors[item.ID]?.quantity && (
                              <small className="mt-1 block text-red-500">
                                {errors[item.ID].quantity}
                              </small>
                            )}
                          </>
                        ) : (
                          <div className="text-center font-medium">
                            {quantity}
                          </div>
                        )}
                      </td>

                      {/* PACK / SCANNED */}
                      <td className="border p-2 align-middle">
                        <div className="text-center">
                          <Input
                            className="h-8 w-full min-w-0 text-center text-xs"
                            type="number"
                            value={packQty}
                            readOnly
                          />
                        </div>
                      </td>

                      {/* DIVISION */}
                      <td className="border p-2 align-middle">
                        {editable ? (
                          <Select
                            key={`division-${item.ID}`}
                            className="text-xs"
                            classNamePrefix="wms-select"
                            options={divisionOptions}
                            value={divisionOptions.find(
                              (option) =>
                                option.value === item.division_code
                            )}
                            onChange={(value) =>
                              handleChange(
                                item.ID,
                                "division_code",
                                value?.value ?? ""
                              )
                            }
                            menuPortalTarget={
                              typeof document !== "undefined"
                                ? document.body
                                : undefined
                            }
                            styles={{
                              control: (base) => ({
                                ...base,
                                minHeight: 32,
                                height: 32,
                                fontSize: 12,
                                borderColor: "#d1d5db",
                                boxShadow: "none",
                              }),
                              valueContainer: (base) => ({
                                ...base,
                                padding: "0 8px",
                              }),
                              indicatorsContainer: (base) => ({
                                ...base,
                                height: 30,
                              }),
                              menuPortal: (base) => ({
                                ...base,
                                zIndex: 9999,
                              }),
                            }}
                          />
                        ) : (
                          <div className="text-center">
                            {item.division_code || "-"}
                          </div>
                        )}
                      </td>

                      {/* Rec Date */}

                      <td className="border p-2 align-middle">
                        {editable ? (
                          <Input
                            className="h-8 w-full min-w-0 text-center text-xs"
                            type="date"
                            value={item.rec_date}
                            onChange={(e) =>
                              handleChange(item.ID, "rec_date", e.target.value)
                            }
                          />
                        ) : (
                          <div className="text-center">
                            {item.rec_date || "-"}
                          </div>
                        )}
                      </td>


                      {/* UOM */}
                      {/* <td className="border p-2 align-middle">
                        {editable ? (
                          <Select
                            key={`uom-${item.ID}`}
                            className="text-xs"
                            classNamePrefix="wms-select"
                            options={
                              selectStates[item.ID]?.options ?? defaultOptions
                            }
                            onFocus={() =>
                              handleFocus(item.item_code, item.ID)
                            }
                            isLoading={
                              selectStates[item.ID]?.loading ?? false
                            }
                            value={(
                              selectStates[item.ID]?.options ?? defaultOptions
                            ).find(
                              (option) => option.value === item.uom
                            )}
                            onChange={(value) =>
                              handleChange(
                                item.ID,
                                "uom",
                                value?.value ?? ""
                              )
                            }
                            menuPortalTarget={
                              typeof document !== "undefined"
                                ? document.body
                                : undefined
                            }
                            styles={{
                              control: (base) => ({
                                ...base,
                                minHeight: 32,
                                height: 32,
                                fontSize: 12,
                                borderColor: "#d1d5db",
                                boxShadow: "none",
                              }),
                              valueContainer: (base) => ({
                                ...base,
                                padding: "0 8px",
                              }),
                              indicatorsContainer: (base) => ({
                                ...base,
                                height: 30,
                              }),
                              menuPortal: (base) => ({
                                ...base,
                                zIndex: 9999,
                              }),
                            }}
                          />
                        ) : (
                          <div className="text-center">{item.uom || "-"}</div>
                        )}
                      </td> */}

                      {/* CASE NUMBER */}
                      <td className="border p-2 align-middle w-200">
                        {invPolicy?.use_case_number ? (
                          editable ? (
                            <Input
                              className="h-8 w-full text-xs"
                              type="text"
                              value={item.case_number || ""}
                              onChange={(e) =>
                                handleChange(
                                  item.ID,
                                  "case_number",
                                  e.target.value.toUpperCase()
                                )
                              }
                            />
                          ) : (
                            <div className="break-words text-center">
                              {item.case_number || ""}
                            </div>
                          )
                        ) : (
                          <div className="text-center text-gray-300">-</div>
                        )}
                      </td>

                      {/* CARTON NUMBER */}
                      <td className="border p-2 align-middle">
                        {invPolicy?.use_carton_number ? (
                          editable ? (
                            <Input
                              className="h-8 w-full text-xs"
                              type="text"
                              value={item.carton_number || ""}
                              onChange={(e) =>
                                handleChange(
                                  item.ID,
                                  "carton_number",
                                  e.target.value
                                )
                              }
                            />
                          ) : (
                            <div className="break-words text-center">
                              {item.carton_number || ""}
                            </div>
                          )
                        ) : (
                          <div className="text-center text-gray-300">-</div>
                        )}
                      </td>

                      {/* LOCATION */}
                      <td className="border p-2 align-middle">
                        {editable ? (
                          <Input
                            className="h-8 w-full text-xs"
                            type="text"
                            value={item.location || ""}
                            onChange={(e) =>
                              handleChange(
                                item.ID,
                                "location",
                                e.target.value.toUpperCase()
                              )
                            }
                          />
                        ) : (
                          <div className="break-words text-center">
                            {item.location || ""}
                          </div>
                        )
                        }
                      </td>


                      {/* SERIAL NUMBER */}
                      <td className="border p-2 align-middle">
                        {invPolicy?.inbound_can_input_serial ? (
                          serials.length > 0 ? (
                            <div className="space-y-1 text-[11px] leading-tight">
                              {serials.map((serial, serialIndex) => (
                                <div
                                  key={`${item.ID}-serial-${serialIndex}`}
                                  className="break-all rounded border border-gray-200 bg-gray-50 px-1.5 py-1 text-gray-700"
                                >
                                  {serial}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-gray-300">-</div>
                          )
                        ) : (
                          <div className="text-center text-gray-300">-</div>
                        )}
                      </td>

                      {/* ACTION */}
                      <td className="border p-2 align-middle">
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {editable ? (
                            <>
                              {item.mode === "create" ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleCancel(item) }
                                  title="Delete"
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(item.ID)}
                                  title="Delete"
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash size={14} />
                                </Button>
                              )}

                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopy(item.ID)}
                                title="Copy"
                                className="h-8 w-8 p-0"
                              >
                                <Copy size={14} />
                              </Button>

                              {/* <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleGenerateQR(item)}
                                title="Generate QR"
                                className="h-8 w-8 p-0"
                              >
                                <QrCode size={14} />
                              </Button> */}

                              <Button
                                type="button"
                                size="sm"
                                variant={
                                  serials.length === quantity &&
                                    quantity > 0
                                    ? "default"
                                    : "outline"
                                }
                                onClick={() =>
                                  handleOpenSerialModal(item)
                                }
                                title="Isi Serial Number"
                                className="h-8 min-w-[58px] px-2 text-[11px]"
                              >
                                SN {serials.length}/{quantity}
                              </Button>
                            </>
                          ) : (
                            <>
                              {headerForm.status !== "complete" && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(item.ID)}
                                  title="Delete"
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash size={14} />
                                </Button>
                              )}

                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopy(item.ID)}
                                title="Copy"
                                className="h-8 w-8 p-0"
                              >
                                <Copy size={14} />
                              </Button>

                              {/* <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleGenerateQR(item)}
                                title="Generate QR"
                                className="h-8 w-8 p-0"
                              >
                                <QrCode size={14} />
                              </Button> */}

                              {invPolicy?.inbound_can_input_serial && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={
                                    serials.length === quantity &&
                                      quantity > 0
                                      ? "default"
                                      : "outline"
                                  }
                                  onClick={() =>
                                    handleOpenSerialModal(item)
                                  }
                                  title="Isi Serial Number"
                                  className="h-8 min-w-[58px] px-2 text-[11px]"
                                >
                                  SN {serials.length}/{quantity}
                                </Button>
                              )}
                            </>
                          )}
                        </div>

                        {/* Informasi field inbound yang tidak ditaruh sebagai kolom
                            supaya layout tetap compact seperti outbound. */}
                        {/* {editable && (
                          <div className="mt-1 flex flex-wrap justify-center gap-x-2 gap-y-0.5 text-[9px] text-gray-400">
                            {item.qa_status && <span>Status: {item.qa_status}</span>}
                            {item.location && <span>Loc: {item.location}</span>}
                            {item.lot_number && <span>Lot: {item.lot_number}</span>}
                          </div>
                        )} */}
                      </td>
                    </tr>
                  );
                })}

                {filteredItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={footerColSpan}
                      className="border p-6 text-center text-sm text-gray-400"
                    >
                      No items found.
                    </td>
                  </tr>
                )}
              </tbody>

              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td className="border p-2" colSpan={2}>
                    Total
                  </td>
                  <td className="border p-2 text-center">
                    {filteredItems.reduce(
                      (acc, item) =>
                        acc +
                        (((item.quantity as unknown as string) === ""
                          ? 0
                          : Number(item.quantity)) || 0),
                      0
                    )}
                  </td>
                  <td className="border p-2 text-center">
                    {filteredItems.reduce(
                      (acc, item) =>
                        acc +
                        Number(
                          inboundDetails.find((d) => d.id === item.ID)
                            ?.qty_scan ?? 0
                        ),
                      0
                    )}
                  </td>
                  <td className="border p-2" colSpan={footerColSpan - 4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
      <ItemSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        products={products}
        onApply={handleModalApply}
        selectedItems={muatan}
        mode={modalMode}
        editData={editingItem}
      />
      <SerialNumberModal
        isOpen={isSerialModalOpen}
        onClose={() => {
          setIsSerialModalOpen(false);
          setSerialModalItem(null);
        }}
        onSave={handleSaveSerialNumbers}
        quantity={Number(serialModalItem?.quantity) || 0}
        initialValue={serialModalItem?.serial_numbers ?? []}
        itemCode={serialModalItem?.item_code ?? ""}
      />
    </>
  );
}
