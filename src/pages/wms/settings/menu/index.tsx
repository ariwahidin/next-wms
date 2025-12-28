// "use client";

// import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
// import MenuForm from "@/components/menu/MenuForm";
// import { Pencil, Trash2 } from "lucide-react";
// import api from "@/lib/api";
// import eventBus from "@/utils/eventBus";
// import Layout from "@/components/layout";

// type Menu = {
//   id: number;
//   name: string;
//   path: string;
//   icon: string;
//   menu_order: number;
//   parent_id?: number | null;
//   parent_name?: string; // opsional, untuk tampilkan nama parent di tabel
// };

// export default function MenuPage() {
//   const [menus, setMenus] = useState<Menu[]>([]);
//   const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
//   const [loading, setLoading] = useState(false);

//   // Fetch menus dari backend
//   async function fetchMenus() {
//     setLoading(true);
//     try {
//       const res = await api.get("/menus", { withCredentials: true });
//       if (res.data.success) {
//         setMenus(res.data.data);
//       }
//     } catch (error) {
//       console.error(error);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     fetchMenus();
//   }, []);

//   // Create menu
//   async function createMenu(menu: Partial<Menu>) {
//     const res = await api.post("/menus", menu, { withCredentials: true });
//     if (!res.data.success) throw new Error("Failed to create menu");
//     if (res.data.success) {
//       eventBus.emit("showAlert", {
//         title: "Success!",
//         description: res.data.message,
//         type: "success",
//       });
//       fetchMenus();
//       setSelectedMenu(null);
//       // close dialog
//     }
//     return res.data.data;
//   }

//   // Update menu
//   async function updateMenu(menu: Menu) {

//     const res = await api.put(`/menus/${menu.id}`, menu, {
//       withCredentials: true,
//     });
//     if (!res.data.success) throw new Error("Failed to update menu");
//     if (res.data.success) {
//       eventBus.emit("showAlert", {
//         title: "Success!",
//         description: res.data.message,
//         type: "success",
//       });
//       fetchMenus();
//       setSelectedMenu(null);
//     }
//     return res.data.data;
//   }

//   // Delete menu
//   async function deleteMenu(id: number) {
//     const res = await api.delete(`/menus/${id}`, { withCredentials: true });
//     if (!res.data.success) throw new Error("Failed to delete menu");
//     if (res.data.success) {
//       eventBus.emit("showAlert", {
//         title: "Success!",
//         description: res.data.message,
//         type: "success",
//       });
//       fetchMenus();
//     }
//   }

//   return (
//     <Layout title={"Settings"} subTitle="Menu Management">
//       <div className="p-6 space-y-6">
//         <div className="flex justify-between items-center">
//           <h1 className="text-2xl font-bold">Menu Management</h1>
//           <Dialog>
//             <DialogTrigger asChild>
//               <Button onClick={() => setSelectedMenu(null)}>+ Add Menu</Button>
//             </DialogTrigger>
//             <DialogContent className="sm:max-w-2xl bg-white">
//               <MenuForm
//                 menu={null}
//                 onSave={async (newMenu) => {
//                   try {
//                     const created = await createMenu(newMenu);
//                     setMenus([...menus, created]);
//                   } catch (error) {
//                     alert((error as Error).message);
//                   }
//                 }}
//               />
//             </DialogContent>
//           </Dialog>
//         </div>

//         {loading ? (
//           <p>Loading...</p>
//         ) : (
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>ID</TableHead>
//                 <TableHead>Name</TableHead>
//                 <TableHead>Path</TableHead>
//                 <TableHead>Icon</TableHead>
//                 <TableHead>Order</TableHead>
//                 <TableHead>Parent ID</TableHead>
//                 <TableHead className="text-right">Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {menus.map((menu) => (
//                 <TableRow key={menu.id}>
//                   <TableCell>{menu.id}</TableCell>
//                   <TableCell>{menu.name}</TableCell>
//                   <TableCell>{menu.path}</TableCell>
//                   <TableCell>{menu.icon}</TableCell>
//                   <TableCell>{menu.menu_order}</TableCell>
//                   <TableCell>{menu.parent_id || "-"}</TableCell>
//                   <TableCell className="text-right space-x-2">
//                     <Dialog>
//                       <DialogTrigger asChild>
//                         <Button
//                           variant="outline"
//                           size="icon"
//                           onClick={() => setSelectedMenu(menu)}
//                         >
//                           <Pencil className="w-4 h-4" />
//                         </Button>
//                       </DialogTrigger>
//                       <DialogContent className="sm:max-w-2xl bg-white">
//                         <MenuForm
//                           menu={selectedMenu}
//                           onSave={async (updatedMenu) => {
//                             try {
//                               const updated = await updateMenu(
//                                 updatedMenu as Menu
//                               );
//                               setMenus(
//                                 menus.map((m) =>
//                                   m.id === updated.id ? updated : m
//                                 )
//                               );
//                             } catch (error) {
//                               alert((error as Error).message);
//                             }
//                           }}
//                         />
//                       </DialogContent>
//                     </Dialog>

//                     <Button
//                       variant="destructive"
//                       size="icon"
//                       onClick={async () => {
//                         if (
//                           confirm("Are you sure you want to delete this menu?")
//                         ) {
//                           try {
//                             await deleteMenu(menu.id);
//                             setMenus(menus.filter((m) => m.id !== menu.id));
//                           } catch (error) {
//                             alert((error as Error).message);
//                           }
//                         }
//                       }}
//                     >
//                       <Trash2 className="w-4 h-4" />
//                     </Button>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         )}
//       </div>
//     </Layout>
//   );
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
import { Input } from "@/components/ui/input";
import MenuForm from "@/components/menu/MenuForm";
import { Pencil, Trash2, Search, Plus, Filter } from "lucide-react";
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
  parent_name?: string;
};

export default function MenuPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [filteredMenus, setFilteredMenus] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch menus dari backend
  async function fetchMenus() {
    setLoading(true);
    try {
      const res = await api.get("/menus", { withCredentials: true });
      if (res.data.success) {
        setMenus(res.data.data);
        setFilteredMenus(res.data.data);
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

  // Search filter
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMenus(menus);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = menus.filter(
        (menu) =>
          menu.name.toLowerCase().includes(query) ||
          menu.path.toLowerCase().includes(query) ||
          menu.icon.toLowerCase().includes(query) ||
          menu.id.toString().includes(query)
      );
      setFilteredMenus(filtered);
    }
  }, [searchQuery, menus]);

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
      setIsDialogOpen(false);
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
      setIsDialogOpen(false);
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
    <Layout title={"Settings"} subTitle="Menu Management">
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Menu Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your application menus and navigation
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setSelectedMenu(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Menu
              </Button>
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

        {/* Search and Filter Section */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by name, path, icon, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            <span>
              Showing <span className="font-semibold">{filteredMenus.length}</span> of{" "}
              <span className="font-semibold">{menus.length}</span> menus
            </span>
          </div>
        </div>

        {/* Table Section */}
        {loading ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">Loading menus...</p>
            </div>
          </div>
        ) : filteredMenus.length === 0 ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
            <div className="text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No menus found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchQuery ? "Try adjusting your search" : "Get started by adding a new menu"}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">ID</TableHead>
                  <TableHead className="font-semibold text-gray-700">Name</TableHead>
                  <TableHead className="font-semibold text-gray-700">Path</TableHead>
                  <TableHead className="font-semibold text-gray-700">Icon</TableHead>
                  <TableHead className="font-semibold text-gray-700">Order</TableHead>
                  <TableHead className="font-semibold text-gray-700">Parent ID</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMenus.map((menu, index) => (
                  <TableRow
                    key={menu.id}
                    className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                  >
                    <TableCell className="font-medium text-gray-900">{menu.id}</TableCell>
                    <TableCell className="font-medium text-gray-900">{menu.name}</TableCell>
                    <TableCell className="text-gray-600 font-mono text-sm">{menu.path}</TableCell>
                    <TableCell className="text-gray-600">{menu.icon}</TableCell>
                    <TableCell className="text-gray-600">{menu.menu_order}</TableCell>
                    <TableCell className="text-gray-600">
                      {menu.parent_id ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                          {menu.parent_id}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setSelectedMenu(menu)}
                              className="h-8 w-8 border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
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
                          variant="outline"
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
                          className="h-8 w-8 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Layout>
  );
}