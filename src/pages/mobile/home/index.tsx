// app/menu/page.tsx
"use client";

import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { Input } from "@/components/ui/input";
import MenuCard from "./MenuCard";
import BottomNavbar from "../components/BottomNavbar";
import {
  Truck,
  Package,
  Boxes,
  ClipboardList,
  Settings,
  Info,
  PackagePlus,
  Undo2,
  FileText,
} from "lucide-react";

const menus = [
  {
    label: "Inbound",
    icon: <PackagePlus />,
    href: "/mobile/inbound",
  },
  {
    label: "Outbound",
    icon: <Truck />,
    href: "/outbound",
  },
  {
    label: "Inventory",
    icon: <Boxes />,
    href: "/inventory",
  },
  {
    label: "Returns",
    icon: <Undo2 />,
    href: "/returns",
  },
  {
    label: "Reports",
    icon: <FileText />,
    href: "/reports",
  },
  {
    label: "Settings",
    icon: <Settings />,
    href: "/settings",
  },
];

export default function MenuPage() {
  const [search, setSearch] = useState("");

  const filteredMenus = menus.filter((menu) =>
    menu.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Menu" showBackButton />
      <div className="min-h-screen pb-20 px-4 pt-4 bg-gray-50">
        <Input
          placeholder="Cari menu..."
          className="mb-4"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4 justify-items-center">
          {filteredMenus.length > 0 ? (
            filteredMenus.map((menu, idx) => (
              <MenuCard key={idx} icon={menu.icon} label={menu.label} href={menu.href} />
            ))
          ) : (
            <p className="col-span-2 text-center text-gray-500">
              Menu tidak ditemukan
            </p>
          )}
        </div>

        <BottomNavbar />
      </div>
    </>
  );
}
