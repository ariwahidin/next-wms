"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import MenuForm from "@/components/menu/MenuForm";
import { Pencil, Trash2 } from "lucide-react";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";
import Layout from "@/components/layout";

type Menu = {
  id: number;
  name: string;
  path: string;
  icon: string;
  menu_order: number;
  parent_id?: number | null;
  parent_name?: string; // opsional, untuk tampilkan nama parent di tabel
};

export default function MenuPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch menus dari backend
  async function fetchMenus() {
    setLoading(true);
    try {
      const res = await api.get("/menus", { withCredentials: true });
      if (res.data.success) {
        setMenus(res.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMenus();
  }, []);

  // Create menu
  async function createMenu(menu: Partial<Menu>) {
    const res = await api.post("/menus", menu, { withCredentials: true });
    if (!res.data.success) throw new Error("Failed to create menu");
    if (res.data.success) {
      eventBus.emit("showAlert", {
        title: "Success!",
        description: res.data.message,
        type: "success",
      });
      fetchMenus();
      setSelectedMenu(null);
      // close dialog
    }
    return res.data.data;
  }

  // Update menu
  async function updateMenu(menu: Menu) {

    const res = await api.put(`/menus/${menu.id}`, menu, {
      withCredentials: true,
    });
    if (!res.data.success) throw new Error("Failed to update menu");
    if (res.data.success) {
      eventBus.emit("showAlert", {
        title: "Success!",
        description: res.data.message,
        type: "success",
      });
      fetchMenus();
      setSelectedMenu(null);
    }
    return res.data.data;
  }

  // Delete menu
  async function deleteMenu(id: number) {
    const res = await api.delete(`/menus/${id}`, { withCredentials: true });
    if (!res.data.success) throw new Error("Failed to delete menu");
    if (res.data.success) {
      eventBus.emit("showAlert", {
        title: "Success!",
        description: res.data.message,
        type: "success",
      });
      fetchMenus();
    }
  }

  return (
    <Layout title={"Configuration"} subTitle="Menu">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Menu Management S</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedMenu(null)}>+ Add Menu</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl bg-white">
              <MenuForm
                menu={null}
                onSave={async (newMenu) => {
                  try {
                    const created = await createMenu(newMenu);
                    setMenus([...menus, created]);
                  } catch (error) {
                    alert((error as Error).message);
                  }
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Parent ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menus.map((menu) => (
                <TableRow key={menu.id}>
                  <TableCell>{menu.id}</TableCell>
                  <TableCell>{menu.name}</TableCell>
                  <TableCell>{menu.path}</TableCell>
                  <TableCell>{menu.icon}</TableCell>
                  <TableCell>{menu.menu_order}</TableCell>
                  <TableCell>{menu.parent_id || "-"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setSelectedMenu(menu)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl bg-white">
                        <MenuForm
                          menu={selectedMenu}
                          onSave={async (updatedMenu) => {
                            try {
                              const updated = await updateMenu(
                                updatedMenu as Menu
                              );
                              setMenus(
                                menus.map((m) =>
                                  m.id === updated.id ? updated : m
                                )
                              );
                            } catch (error) {
                              alert((error as Error).message);
                            }
                          }}
                        />
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={async () => {
                        if (
                          confirm("Are you sure you want to delete this menu?")
                        ) {
                          try {
                            await deleteMenu(menu.id);
                            setMenus(menus.filter((m) => m.id !== menu.id));
                          } catch (error) {
                            alert((error as Error).message);
                          }
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </Layout>
  );
}
