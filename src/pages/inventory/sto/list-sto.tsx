"use client";

import { useEffect, useState } from "react";
import { getAllAktivitas, deleteAktivitas, updateAktivitas } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2, Search } from "lucide-react";

export default function StockTakeList({ refreshSignal }) {
  const [list, setList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const load = async () => {
    const data = await getAllAktivitas();
    setList(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  };

  useEffect(() => {
    load();
  }, [refreshSignal]);

  const handleDelete = async (id) => {
    await deleteAktivitas(id);
    load();
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    await updateAktivitas(editForm);
    setEditingId(null);
    load();
  };

  const filteredList = list.filter((item) =>
    [item.kodeLokasi, item.kodeBarang, item.catatan]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Input Pencarian */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Cari aktivitas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* List Aktivitas */}
      {filteredList.map((item) => (
        <Card key={item.id} className="p-3 rounded-xl shadow-sm">
          <CardContent className="p-0">
            {editingId === item.id ? (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  name="kodeLokasi"
                  value={editForm.kodeLokasi}
                  onChange={handleChange}
                  placeholder="Lokasi"
                />
                <Input
                  name="kodeBarang"
                  value={editForm.kodeBarang}
                  onChange={handleChange}
                  placeholder="Barang"
                />
                <Input
                  name="jumlahFisik"
                  value={editForm.jumlahFisik}
                  onChange={handleChange}
                  placeholder="Jumlah"
                />
                <Input
                  name="catatan"
                  value={editForm.catatan}
                  onChange={handleChange}
                  placeholder="Catatan"
                />
                <div className="col-span-2 flex justify-end gap-2 mt-1">
                  <Button size="sm" onClick={handleUpdate}>
                    Simpan
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                  >
                    Batal
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div className="text-sm space-y-1">
                  <div className="font-semibold">
                    {item.kodeBarang}{" "}
                    <span className="text-muted-foreground">
                      ({item.kodeLokasi})
                    </span>
                  </div>
                  <div className="text-xs">Jumlah: {item.jumlahFisik}</div>
                  {item.catatan && (
                    <div className="text-xs italic text-muted-foreground">
                      {item.catatan}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handleEdit(item)}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
