import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash, Save, Pencil, X } from "lucide-react";
import { Combobox } from "./Combobox";

interface Muatan {
  id: number;
  namaBarang: string;
  qty: number;
  uom: string;
}

const namaBarangOptions = [
  "Kertas A4",
  "Bolpen Hitam",
  "Tinta Printer",
  "Stempel",
  "Map Folder",
];

const uomOptions = ["pcs", "kg", "liter", "box"];

export default function MuatanTable() {
  const [muatan, setMuatan] = useState<Muatan[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const handleAdd = () => {
    const newRow: Muatan = {
      id: Date.now(),
      namaBarang: "",
      qty: 1,
      uom: "pcs",
    };
    setMuatan([...muatan, newRow]);
    setEditingId(newRow.id);
  };

  const handleChange = (
    id: number,
    field: keyof Muatan,
    value: string | number
  ) => {
    setMuatan((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, [field]: field === "qty" ? Number(value) : value }
          : m
      )
    );
  };

  const handleSave = () => {
    setEditingId(null);
  };

  const handleEdit = (id: number) => {
    setEditingId(id);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    setMuatan((prev) => prev.filter((m) => m.id !== id));
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleSelect = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((sid) => sid !== id)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? muatan.map((m) => m.id) : []);
  };

  const handleDeleteSelected = () => {
    setMuatan((prev) => prev.filter((m) => !selectedIds.includes(m.id)));
    setSelectedIds([]);
  };

  const totalQty = muatan.reduce((sum, item) => sum + item.qty, 0);
  const allSelected = muatan.length > 0 && selectedIds.length === muatan.length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Inputan Muatan</h2>
        <div className="space-x-2">
          <Button
            variant="destructive"
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0}
          >
            Hapus Terpilih
          </Button>
          <Button type="button" onClick={handleAdd}>
            Tambah Muatan
          </Button>
        </div>
      </div>

      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border text-center w-8">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </th>
            <th className="p-2 border w-12 text-center">No.</th>
            <th className="p-2 border">Nama Barang</th>
            <th className="p-2 border" style={{ width: "100px" }}>Qty</th>
            <th className="p-2 border" style={{ width: "100px" }}>UOM</th>
            <th className="p-2 border">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {muatan.map((item, index) => {
            const isEditing = editingId === item.id;
            return (
              <tr key={item.id} className="border-t">
                <td className="p-2 border text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={(e) => handleSelect(item.id, e.target.checked)}
                  />
                </td>
                <td className="p-2 border text-center">{index + 1}</td>
                {isEditing ? (
                  <>
                    <td className="p-2 border">
                      <Combobox
                        value={item.namaBarang}
                        options={namaBarangOptions}
                        onChange={(value) =>
                          handleChange(item.id, "namaBarang", value)
                        }
                      />
                    </td>
                    <td className="p-2 border">
                      <Input
                        type="number"
                        value={item.qty}
                        onChange={(e) =>
                          handleChange(item.id, "qty", e.target.value)
                        }
                      />
                    </td>
                    <td className="p-2 border">
                      <Select
                        value={item.uom}
                        onValueChange={(value) =>
                          handleChange(item.id, "uom", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih UOM" />
                        </SelectTrigger>
                        <SelectContent>
                          {uomOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2 border space-x-2 text-center" style={{ width: "160px" }}>
                      <Button size="sm" onClick={handleSave}>
                        <Save className="mr-1" size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                      >
                        <X className="mr-1" size={16} />
                      </Button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2 border">{item.namaBarang}</td>
                    <td className="p-2 border text-center">{item.qty}</td>
                    <td className="p-2 border text-center">{item.uom}</td>
                    <td className="p-2 border space-x-2 text-center" style={{ width: "160px" }}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item.id)}
                      >
                        <Pencil className="mr-1" size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash className="mr-1" size={16} />
                      </Button>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-semibold">
            <td className="p-2 border" colSpan={3}>
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
