/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, PlusCircle, RefreshCcw, Save } from "lucide-react";
import Layout from "@/components/layout";
import Select from "react-select";
import { Label } from "@radix-ui/react-label";
import api from "@/lib/api";
import { Product } from "@/types/item";
import { ItemOptions } from "@/types/inbound";
import { Uom, UomConversion } from "@/types/uom";
import { set } from "date-fns";

export default function UomConversionPage() {
  const [form, setForm] = useState<UomConversion>({
    ID: 0,
    item_code: "",
    ean: "",
    from_uom: "",
    to_uom: "",
    conversion_rate: 1,
    is_base: false,
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [uoms, setUoms] = useState<Uom[]>([]);
  const [itemCodeOptions, setItemCodeOptions] = useState<ItemOptions[]>([]);
  const [uomOptions, setUomOptions] = useState<ItemOptions[]>([]);
  const [toUomOptions, setToUomOptions] = useState<ItemOptions[]>([]);
  const [uomConversions, setUomConversions] = useState<UomConversion[]>([]);
  const [uomConversionsFiltered, setUomConversionsFiltered] = useState<
    UomConversion[]
  >([]);

  const fetchData = async () => {
    try {
      const [products, uoms] = await Promise.all([
        api.get("/products", { withCredentials: true }),
        api.get("/uoms", { withCredentials: true }),
      ]);

      if (products.data.success && uoms.data.success) {
        setProducts(products.data.data);
        setItemCodeOptions(
          products.data.data.map((item: Product) => ({
            value: item.item_code,
            label: item.item_code,
          }))
        );
        setUoms(uoms.data.data);
        setUomOptions(
          uoms.data.data.map((item: Uom) => ({
            value: item.code,
            label: item.code,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchUomConversions = async () => {
    try {
      const response = await api.get("/uoms/conversion", {
        withCredentials: true,
      });
      if (response.data.success) {
        setUomConversions(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching UOM conversions:", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchUomConversions();
  }, []);

  const handleEdit = (row: UomConversion) => {
    console.log("Editing row:", row);
    setEditingId(row.ID);
    setForm({ ...row });
  };

  const handleFormChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({
      ...prev,
      [field]: field === "conversion_rate" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const endpoint = editingId
        ? `/uoms/conversion/${editingId}`
        : "/uoms/conversion";
      const method = editingId ? api.put : api.post;

      const response = await method(endpoint, form);
      const data = response.data;

      const action = editingId ? "Updating" : "Saving";
      console.log(`${action} UOM conversion:`, data);

      if (!data.success) {
        console.error(
          `Failed to ${action.toLowerCase()} UOM conversion:`,
          data.message
        );
        return;
      }

      // Optional: Update rows here if you enable setRows later
      // ...
      fetchUomConversions(); // Refresh UOM conversions

      // Reset form
      //   setForm({
      //     ID: 0,
      //     item_code: "",
      //     from_uom: "",
      //     to_uom: "",
      //     conversion_rate: 1,
      //     is_base: false,
      //   });
      setEditingId(null);
    } catch (error) {
      console.error("Error submitting UOM conversion:", error);
    }
  };

  useEffect(() => {
    // Filter UOM conversions based on selected item code
    const filtered = uomConversions.filter(
      (conversion) => conversion.item_code === form.item_code
    );
    setUomConversionsFiltered(filtered);
    console.log("Filtered UOM conversions:", filtered);
    console.log("Products:", products);

    setToUomOptions(
      filtered
        .filter((item) => item.item_code === form.item_code)
        .map((it) => ({
          value: it.from_uom,
          label: it.from_uom,
        }))
    );

  }, [form.item_code, uomConversions, products]);

  const handleReset = () => {
    setForm({
      ID: 0,
      item_code: "",
      ean: "",
      from_uom: "",
      to_uom: "",
      conversion_rate: 1,
      is_base: false,
    });
    setEditingId(null);
  };

  return (
    <Layout title="Settings" subTitle="UOM Conversion Management">
      <div className="p-6 space-y-6">

        {/* FORM */}
        <div className="p-4 border rounded-lg space-y-4 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Select
              value={
                itemCodeOptions.find(
                  (option) => option.value === form.item_code
                ) || null
              }
              placeholder="Select Item Code"
              options={itemCodeOptions}
              onChange={(selectedOption) => {
                if (selectedOption) {
                  setForm((prev) => ({
                    ...prev,
                    item_code: selectedOption.value,
                  }));
                  const filtered = uomConversions.filter(
                    (conversion) =>
                      conversion.item_code === selectedOption.value
                  );
                  console.log("Filtered UOM conversions:", filtered);
                  setUomConversionsFiltered(filtered);
                  // setToUomOptions(
                  //   filtered
                  //     .filter((item) => item.item_code === form.item_code)
                  //     .map((it) => ({
                  //       value: it.from_uom,
                  //       label: it.from_uom,
                  //     }))
                  // );
                }
              }}
            />
            <Input
              type="text"
              placeholder="EAN"
              value={form.ean}
              onChange={(e) => handleFormChange("ean", e.target.value)}
            />
            <Select
              value={
                uomOptions.find((option) => option.value === form.from_uom) ||
                null
              }
              placeholder="Select From UOM"
              options={uomOptions}
              onChange={(selectedOption) => {
                if (selectedOption) {
                  setForm((prev) => ({
                    ...prev,
                    from_uom: selectedOption.value,
                  }));
                }
              }}
            />
            <Select
              value={
                toUomOptions.find((option) => option.value === form.to_uom) ||
                null
              }
              placeholder="Select To UOM"
              options={toUomOptions}
              onChange={(selectedOption) => {
                if (selectedOption) {
                  setForm((prev) => ({
                    ...prev,
                    to_uom: selectedOption.value,
                  }));
                }
              }}
            />
            <Input
              type="number"
              placeholder="Rate"
              value={form.conversion_rate}
              onChange={(e) =>
                handleFormChange("conversion_rate", e.target.value)
              }
            />
          </div>

          <div className="flex items-center space-x-2" style={{ display: 'none' }}>
            <Checkbox
              id="is_base"
              checked={form.is_base}
              onCheckedChange={(checked) =>
                handleFormChange("is_base", checked === true)
              }
            />
            <label htmlFor="is_base">Is Base UOM?</label>
          </div>

          <Button onClick={handleReset} variant="outline" className="mr-2">
            <RefreshCcw className="w-4 h-4 mr-2" /> Reset Form
          </Button>
          <Button onClick={handleSubmit}>
            <Save className="w-4 h-4 mr-2" /> {editingId ? "Update" : "Add"}
          </Button>
        </div>

        {/* TABLE */}
        <div className="overflow-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Item Code</th>
                <th className="p-2 text-left">Ean</th>
                <th className="p-2 text-left">From UOM</th>
                <th className="p-2 text-left">To UOM</th>
                <th className="p-2 text-left">Rate</th>
                {/* <th className="p-2 text-center">Base?</th> */}
                <th className="p-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {uomConversionsFiltered.map((row) => (
                <tr key={row.ID} className="border-t">
                  <td className="p-2">{row.item_code}</td>
                  <td className="p-2">{row.ean || "-"}</td>
                  <td className="p-2">{row.from_uom}</td>
                  <td className="p-2">{row.to_uom}</td>
                  <td className="p-2">{row.conversion_rate}</td>
                  {/* <td className="p-2 text-center">
                    {row.is_base ? "✅" : "❌"}
                  </td> */}
                  <td className="p-2 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(row)}
                    >
                      <Pencil className="w-4 h-4 text-blue-500" />
                    </Button>
                  </td>
                </tr>
              ))}

              {uomConversionsFiltered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    No UOM conversions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
