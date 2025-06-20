/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, PlusCircle, Save } from "lucide-react";

type UomRow = {
  id: number;
  item_code: string;
  from_uom: string;
  to_uom: string;
  conversion_rate: number;
  is_base: boolean;
};

const initialData: UomRow[] = [
  {
    id: 1,
    item_code: "AQUA1L",
    from_uom: "BOX",
    to_uom: "PCS",
    conversion_rate: 12,
    is_base: true,
  },
  {
    id: 2,
    item_code: "AQUA1L",
    from_uom: "PALLET",
    to_uom: "BOX",
    conversion_rate: 20,
    is_base: false,
  },
  {
    id: 3,
    item_code: "AQUA1L",
    from_uom: "PALLET",
    to_uom: "PCS",
    conversion_rate: 240,
    is_base: true,
  },
];

export default function UomConversionPage() {
  const [rows, setRows] = useState<UomRow[]>(initialData);
  const [form, setForm] = useState<Omit<UomRow, "id">>({
    item_code: "",
    from_uom: "",
    to_uom: "",
    conversion_rate: 1,
    is_base: false,
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleEdit = (row: UomRow) => {
    setEditingId(row.id);
    setForm({ ...row });
  };

  const handleFormChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({
      ...prev,
      [field]: field === "conversion_rate" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = () => {
    if (editingId) {
      setRows((prev) =>
        prev.map((r) => (r.id === editingId ? { ...form, id: editingId } : r))
      );
    } else {
      const newId =
        rows.length > 0 ? Math.max(...rows.map((r) => r.id)) + 1 : 1;
      setRows([...rows, { ...form, id: newId }]);
    }

    setForm({
      item_code: "",
      from_uom: "",
      to_uom: "",
      conversion_rate: 1,
      is_base: false,
    });
    setEditingId(null);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">UOM Conversion Management</h1>

      {/* TABLE */}
      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Item Code</th>
              <th className="p-2 text-left">From UOM</th>
              <th className="p-2 text-left">To UOM</th>
              <th className="p-2 text-left">Rate</th>
              <th className="p-2 text-center">Base?</th>
              <th className="p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-2">{row.item_code}</td>
                <td className="p-2">{row.from_uom}</td>
                <td className="p-2">{row.to_uom}</td>
                <td className="p-2">{row.conversion_rate}</td>
                <td className="p-2 text-center">{row.is_base ? "✅" : "❌"}</td>
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
          </tbody>
        </table>
      </div>

      {/* FORM */}
      <div className="p-4 border rounded-lg space-y-4 bg-gray-50">
        <h2 className="text-lg font-medium flex items-center gap-2">
          {editingId ? (
            <>
              <Pencil className="w-4 h-4" /> Edit Conversion
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" /> Add New Conversion
            </>
          )}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Input
            placeholder="Item Code"
            value={form.item_code}
            onChange={(e) => handleFormChange("item_code", e.target.value)}
          />
          <Input
            placeholder="From UOM"
            value={form.from_uom}
            onChange={(e) => handleFormChange("from_uom", e.target.value)}
          />
          <Input
            placeholder="To UOM"
            value={form.to_uom}
            onChange={(e) => handleFormChange("to_uom", e.target.value)}
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

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_base"
            checked={form.is_base}
            onCheckedChange={(checked) =>
              handleFormChange("is_base", checked === true)
            }
          />
          <label htmlFor="is_base">Is Base UOM?</label>
        </div>

        <Button onClick={handleSubmit}>
          <Save className="w-4 h-4 mr-2" /> {editingId ? "Update" : "Save"}
        </Button>
      </div>
    </div>
  );
}
