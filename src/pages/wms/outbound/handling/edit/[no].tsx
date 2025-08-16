// import ManualForm from "@/components/outbound/create-manual/ManualForm";
import Layout from "@/components/layout";
// import { useRouter } from "next/router";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowBigLeftIcon, List, RefreshCcw, Save, View } from "lucide-react";
import { HeaderFormProps, ItemFormProps, ItemOptions } from "@/types/outbound";
import { Customer } from "@/types/customer";
import api from "@/lib/api";
import Select from "react-select";
import eventBus from "@/utils/eventBus";
import { useRouter } from "next/router";
import DatePicker from "react-datepicker";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { Trash, Pencil, X, Plus } from "lucide-react";
import * as yup from "yup";
import { CombinedOutboundProps, PropsHeader } from "@/types/outbound";
import { Product } from "@/types/item";
import { Warehouse } from "@/types/warehouse";
import BillModal from "./BillModal";

// Skema validasi Yup
const muatanSchema = yup.object().shape({
  item_code: yup.string().required("Item code wajib diisi"),
  quantity: yup
    .number()
    .typeError("Qty harus berupa angka")
    .positive("Qty harus lebih dari 0")
    .required("Qty wajib diisi"),
  whs_code: yup.string().required("Gudang wajib diisi"),
  remarks: yup.string().optional(),
});

function ItemFormTable({
  muatan,
  setMuatan,
  headerForm,
  setHeaderForm,
}: CombinedOutboundProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [itemCodeOptions, setItemCodeOptions] = useState<ItemOptions[]>([]);
  const [whsCodeOptions, setWhsCodeOptions] = useState<ItemOptions[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<{
    [id: number]: { [key: string]: string };
  }>({});

  const [handlingOptions, setHandlingOptions] = useState<ItemOptions[]>([]);
  const fetchHandlings = async () => {
    try {
      const response = await api.get("/handling", { withCredentials: true });
      console.log("Handling Response:", response.data); // Debug log

      let handlingData = [];

      // Handle different possible response structures
      if (response.data.success && response.data.data) {
        handlingData = response.data.data;
      } else if (Array.isArray(response.data)) {
        handlingData = response.data;
      } else if (response.data && Array.isArray(response.data.handlings)) {
        handlingData = response.data.handlings;
      }

      console.log("Handling Data:", handlingData); // Debug log

      const options = handlingData.map((handling: any) => ({
        value: handling.name,
        label: handling.name,
      }));

      console.log("Handling Options:", options); // Debug log
      setHandlingOptions(options);
    } catch (error) {
      console.error("Error fetching handlings:", error);
      // Set some dummy data for testing if API fails
      setHandlingOptions([
        { value: "NORMAL", label: "Normal Handling" },
        { value: "FRAGILE", label: "Fragile Handling" },
        { value: "HAZMAT", label: "Hazmat Handling" },
      ]);
    }
  };

  useEffect(() => {
    // fetchData();
    fetchHandlings();
  }, []);

  const handleChange = (
    id: number,
    field: keyof ItemFormProps,
    value: string | number | string[]
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
            ? {
                ...m,
                [field]:
                  field === "quantity" || field === "ID"
                    ? Number(value)
                    : field === "handling"
                    ? value // handling sudah berupa array dari onChange
                    : value,
              }
            : m
        )
      );
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? muatan.map((m) => m.ID) : []);
  };

  const totalQty = muatan?.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
          <h2 className="text-lg font-medium text-gray-800">Outbound Items</h2>
          <span className="text-sm text-gray-500">
            ({muatan?.length || 0} items)
          </span>
        </div>
      </div>

      {/* Table Container with Responsive Wrapper */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="p-1 text-center w-16 font-medium text-gray-700">
                  #
                </th>
                <th className="p-2 text-left min-w-[200px] font-medium text-gray-700">
                  Item Code
                </th>
                <th className="p-2 text-left min-w-[200px] font-medium text-gray-700">
                  Item Name
                </th>
                <th className="p-2 text-left min-w-[120px] font-medium text-gray-700">
                  Barcode
                </th>
                <th className="p-2 text-center w-20 font-medium text-gray-700">
                  Qty Item
                </th>
                <th className="p-2 text-center min-w-[140px] font-medium text-gray-700">
                  Handling
                </th>
                {/* <th className="p-2 text-left min-w-[150px] font-medium text-gray-700">
                  Remarks
                </th> */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {muatan?.map((item, index) => {
                return (
                  <tr
                    key={item.ID}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="p-2 text-center text-gray-600 font-mono text-xs">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="p-2">
                      <Input
                        style={{ fontSize: "12px" }}
                        readOnly
                        type="text"
                        value={item.item_code}
                        className="h-9 text-sm bg-gray-50 border-gray-200 read-only:cursor-not-allowed"
                        placeholder="Auto-filled"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        style={{ fontSize: "12px" }}
                        readOnly
                        type="text"
                        value={item.item_name}
                        className="h-9 text-sm bg-gray-50 border-gray-200 read-only:cursor-not-allowed"
                        placeholder="Auto-filled"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        style={{ fontSize: "12px" }}
                        readOnly
                        type="text"
                        value={item.barcode}
                        className="h-9 text-sm bg-gray-50 border-gray-200 font-mono"
                        placeholder="Auto-filled"
                      />
                    </td>
                    <td className="p-2">
                      <div className="space-y-1">
                        <Input
                          readOnly
                          type="text"
                          value={item.quantity}
                          className="h-9 text-sm text-center bg-gray-50 border-gray-200 font-mono"
                          placeholder="Auto-filled"
                        />
                      </div>
                    </td>
                    <td className="p-2">
                      <Select
                        isMulti
                        value={handlingOptions.filter((option) =>
                          Array.isArray(item.handling)
                            ? (item.handling as string[]).includes(option.value)
                            : item.handling === option.value
                        )}
                        // value={handlingOptions.filter((option) =>
                        //   Array.isArray(item.handling)
                        //     ? item.handling
                        //         .map((h) => h.HandlingUsed)
                        //         .includes(option.value)
                        //     : item.handling === option.value
                        // )}
                        options={handlingOptions}
                        onChange={(selectedOptions) => {
                          // Convert selected options to array of strings
                          const handlingValues = selectedOptions
                            ? selectedOptions.map((option) => option.value)
                            : [];
                          handleChange(item.ID, "handling", handlingValues);
                        }}
                        className="text-sm"
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: "36px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }),
                          multiValue: (base) => ({
                            ...base,
                            backgroundColor: "#e0f2fe",
                            color: "#0369a1",
                          }),
                          multiValueLabel: (base) => ({
                            ...base,
                            color: "#0369a1",
                            fontSize: "12px",
                          }),
                        }}
                        placeholder="Select handling..."
                      />
                    </td>
                    {/* <td className="p-2">
                      <div className="space-y-1">
                        <Input
                          type="text"
                          value={item.remarks}
                          onChange={(e) =>
                            handleChange(item.ID, "remarks", e.target.value)
                          }
                          className="h-9 text-sm"
                          placeholder="Add notes..."
                        />
                        {errors[item.ID]?.remarks && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors[item.ID].remarks}
                          </p>
                        )}
                      </div>
                    </td> */}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50/80 border-t border-gray-200">
                <td className="p-2" colSpan={4}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      Total Items:
                    </span>
                    <span className="text-sm font-mono text-blue-600">
                      {muatan?.length || 0}
                    </span>
                  </div>
                </td>
                <td className="p-2 text-center">
                  <span className="text-sm font-mono font-medium text-blue-600">
                    {totalQty}
                  </span>
                </td>
                <td className="p-2" colSpan={4}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function ManualForm() {
  const router = useRouter();
  const { no } = router.query;
  console.log("outbound_no", no);

  const [formData, setFormData] = useState<HeaderFormProps>({
    ID: 0,
    outbound_no: no ? no.toString() : "Auto Generate",
    outbound_date: new Date().toISOString().split("T")[0],
    customer_code: "",
    shipment_id: "",
    whs_code: "",
    owner_code: "",
    mode: "create",
  });

  const [muatan, setMuatan] = useState<ItemFormProps[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [billData, setBillData] = useState([]);

  const handleSave = async () => {
    console.log("Data outbound yang disimpan:", formData, muatan);

    try {
      const res = await api.put("/outbound/handling/" + no, {
        items: muatan,
      });
      if (res.data.success) {
        console.log("Outbound data saved successfully:", res.data.data);
        // Redirect or show success message
        eventBus.emit("showAlert", {
          title: "Success!",
          description: res.data.message,
          type: "success",
        });
        // router.push("/wms/outbound/handling");
      }
    } catch (error) {
      console.error("Error saving outbound data:", error);
    }
  };

  const viewBill = async () => {
    try {
      const res = await api.get(`/outbound/handling/bill/${no}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        console.log("Fetched outbound data:", res.data.data);
        setBillData(res.data.data);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error fetching outbound:", error);
    }
  };

  useEffect(() => {
    if (no) {
      const fetchOutbound = async () => {
        try {
          const res = await api.get(`/outbound/handling/${no}`, {
            withCredentials: true,
          });
          if (res.data.success) {
            console.log("Fetched outbound data:", res.data.data);
            setFormData(res.data.data);
            setMuatan(
              res.data.data.items.map((item) => ({
                ...item,
                item_name: item.product?.item_name || "",
                handling: Array.isArray(item.handling)
                  ? item.handling.map((h) =>
                      typeof h === "string" ? h : h.HandlingUsed || ""
                    )
                  : [],
              }))
            );
          }
        } catch (error) {
          console.error("Error fetching outbound:", error);
        }
      };
      fetchOutbound();
    }
  }, [no]);

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            {/* Date Picker */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg border">
                <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Date
                </Label>
                <DatePicker
                  selected={
                    formData.outbound_date
                      ? parseISO(formData.outbound_date)
                      : null
                  }
                  onChange={(date: Date | null) => {
                    if (date) {
                      setFormData({
                        ...formData,
                        outbound_date: format(date, "yyyy-MM-dd"),
                      });
                    }
                  }}
                  dateFormat="dd/MM/yyyy"
                  locale={id}
                  customInput={<Input className="h-9 w-36 text-sm font-mono" />}
                  placeholderText="Select date..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/wms/outbound/handling")}
                className="h-9 px-4 text-sm border-gray-300 hover:bg-gray-50"
              >
                <ArrowBigLeftIcon size={16} className="mr-2" />
                Back
              </Button>
              <Button
                onClick={viewBill}
                variant="outline"
                className="h-9 px-4 text-sm border-green-300 text-green-700 hover:bg-green-50"
              >
                <List size={16} className="mr-2" />
                View Bill
              </Button>
              <Button
                onClick={handleSave}
                className="h-9 px-6 text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                <Save size={16} className="mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6 max-w-full">
        {/* Hidden Form Fields */}
        <form className="hidden">
          <Input
            value={formData.ID}
            onChange={(e) =>
              setFormData({ ...formData, ID: Number(e.target.value) })
            }
          />
          <Input
            value={formData.mode}
            onChange={(e) =>
              setFormData({
                ...formData,
                mode: e.target.value as "create" | "edit",
              })
            }
          />
        </form>

        {/* Items Table */}
        <ItemFormTable
          muatan={muatan}
          setMuatan={setMuatan}
          headerForm={formData}
          setHeaderForm={setFormData}
        />
      </div>

      <BillModal
        show={showModal}
        onClose={() => setShowModal(false)}
        billData={billData}
      />
    </div>
  );
}

export default function EditPage() {
  const router = useRouter();
  const { no } = router.query;
  if (!no) return null;
  return (
    <Layout
      title="Outbound"
      titleLink="/wms/outbound/data"
      subTitle={"Handling " + no}
    >
      <ManualForm />
    </Layout>
  );
}
