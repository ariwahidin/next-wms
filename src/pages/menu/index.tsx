// // app/menu/page.tsx
// 'use client'

// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
// import MenuForm from "@/components/menu/MenuForm"
// import { Pencil, Trash2 } from "lucide-react"

// type Menu = {
//   id: number
//   name: string
//   path: string
//   icon: string
//   order: number
//   parent?: string
// }

// const dummyMenus: Menu[] = [
//   { id: 1, name: "Dashboard", path: "/dashboard", icon: "home", order: 1 },
//   { id: 2, name: "User Management", path: "/users", icon: "users", order: 2 },
//   { id: 3, name: "Roles", path: "/roles", icon: "shield", order: 1, parent: "User Management" },
// ]

// export default function MenuPage() {
//   const [menus, setMenus] = useState(dummyMenus)
//   const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null)

//   return (
//     <div className="p-6 space-y-6">
//       <div className="flex justify-between items-center">
//         <h1 className="text-2xl font-bold">Menu Management</h1>
//         <Dialog>
//           <DialogTrigger asChild>
//             <Button onClick={() => setSelectedMenu(null)}>+ Add Menu</Button>
//           </DialogTrigger>
//           <DialogContent className="sm:max-w-2xl bg-white">
//             <MenuForm menu={null} onSave={(newMenu) => {
//               setMenus([...menus, { ...newMenu, id: Date.now() }])
//             }} />
//           </DialogContent>
//         </Dialog>
//       </div>

//       <Table>
//         <TableHeader>
//           <TableRow>
//             <TableHead>Name</TableHead>
//             <TableHead>Path</TableHead>
//             <TableHead>Icon</TableHead>
//             <TableHead>Order</TableHead>
//             <TableHead>Parent</TableHead>
//             <TableHead className="text-right">Actions</TableHead>
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {menus.map(menu => (
//             <TableRow key={menu.id}>
//               <TableCell>{menu.name}</TableCell>
//               <TableCell>{menu.path}</TableCell>
//               <TableCell>{menu.icon}</TableCell>
//               <TableCell>{menu.order}</TableCell>
//               <TableCell>{menu.parent || '-'}</TableCell>
//               <TableCell className="text-right space-x-2">
//                 <Dialog>
//                   <DialogTrigger asChild>
//                     <Button
//                       variant="outline"
//                       size="icon"
//                       onClick={() => setSelectedMenu(menu)}
//                     >
//                       <Pencil className="w-4 h-4" />
//                     </Button>
//                   </DialogTrigger>
//                   <DialogContent className="sm:max-w-2xl bg-white">
//                     <MenuForm
//                       menu={selectedMenu}
//                       onSave={(updatedMenu) => {
//                         setMenus(
//                           menus.map(m => m.id === updatedMenu.id ? updatedMenu : m)
//                         )
//                       }}
//                     />
//                   </DialogContent>
//                 </Dialog>

//                 <Button
//                   variant="destructive"
//                   size="icon"
//                   onClick={() => setMenus(menus.filter(m => m.id !== menu.id))}
//                 >
//                   <Trash2 className="w-4 h-4" />
//                 </Button>
//               </TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>
//     </div>
//   )
// }

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
    // const res = await fetch(`/api/menus/${menu.id}`, {
    //   method: "PUT",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(menu),
    // });
    // if (!res.ok) throw new Error("Failed to update menu");
    // return res.json();

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
      // close dialog
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
          <h1 className="text-2xl font-bold">Menu Management</h1>
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
              {/* <MenuForm
              menu={null}
              onSave={(newMenu) => {
                setMenus([...menus, { ...newMenu, id: Date.now() }]);
              }}
            /> */}
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
