/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// components/menu/MenuForm.tsx
"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";

type Props = {
  menu: {
    id: number;
    name: string;
    path: string;
    icon: string;
    menu_order: number;
    parent_id?: number | null;
  } | null;
  onSave: (menu: any) => void;
};

export default function MenuForm({ menu, onSave }: Props) {
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [icon, setIcon] = useState("");
  const [order, setOrder] = useState(0);
  const [parent, setParent] = useState("");

  useEffect(() => {
    if (menu) {
      setName(menu.name);
      setPath(menu.path);
      setIcon(menu.icon);
      setOrder(menu.menu_order);
      setParent(menu.parent_id?.toString() || "");
    } else {
      setName("");
      setPath("");
      setIcon("");
      setOrder(0);
      setParent("");
    }
  }, [menu]);

  const handleSubmit = () => {
    const newMenu = {
      id: menu?.id || Date.now(),
      name,
      path,
      icon,
      order,
      parent_id: parseInt(parent) || undefined,
    };
    onSave(newMenu);
  };

  //   const handleSubmit = async () => {
  //     const newMenu = {
  //       name,
  //       path,
  //       icon,
  //       order,
  //       parent_id: parseInt(parent) || null,
  //     };

  //     try {
  //       if (menu?.id) {
  //         // Update menu
  //         const res = await fetch(`/api/menus/${menu.id}`, {
  //           method: "PUT",
  //           headers: { "Content-Type": "application/json" },
  //           body: JSON.stringify(newMenu),
  //         });
  //         if (!res.ok) throw new Error("Failed to update menu");
  //         const data = await res.json();
  //         onSave(data);
  //       } else {
  //         // Create menu
  //         // const res = await fetch("/api/menus", {
  //         //   method: "POST",
  //         //   headers: { "Content-Type": "application/json" },
  //         //   body: JSON.stringify(newMenu),
  //         // });
  //         // if (!res.ok) throw new Error("Failed to create menu");
  //         // const data = await res.json();
  //         // onSave(data);

  //         const res = await api.post("/menus", newMenu, {
  //           withCredentials: true,
  //         });
  //         if (res.data.success) {
  //           onSave(res.data.data);
  //           eventBus.emit("showAlert", {
  //             title: "Success!",
  //             description: res.data.message,
  //             type: "success",
  //           });
  //         }
  //       }
  //     } catch (error) {
  //       alert((error as Error).message);
  //     }
  //   };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div>
        <Label>Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <Label>Path</Label>
        <Input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          required
        />
      </div>

      <div>
        <Label>Icon</Label>
        <Input value={icon} onChange={(e) => setIcon(e.target.value)} />
      </div>

      <div>
        <Label>Order</Label>
        <Input
          type="number"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
        />
      </div>

      <div>
        <Label>Parent (optional)</Label>
        <Input value={parent} onChange={(e) => setParent(e.target.value)} />
      </div>

      <div className="flex justify-end">
        <Button type="submit">{menu ? "Update" : "Save"}</Button>
      </div>
    </form>
  );
}
