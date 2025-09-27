/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import PageHeader from "@/components/mobile/PageHeader";
import { Input } from "@/components/ui/input";
import MenuCard from "@/components/mobile/ItemMenuCard";
import BottomNavbar from "@/components/mobile/BottomNavbar";
import {
  Truck,
  Boxes,
  Settings,
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
    href: "/mobile/outbound",
  },
  {
    label: "Inventory",
    icon: <Boxes />,
    href: "/mobile/inventory",
  },
  // {
  //   label: "Returns",
  //   icon: <Undo2 />,
  //   href: "/returns",
  // },
  // {
  //   label: "Reports",
  //   icon: <FileText />,
  //   href: "/reports",
  // },
  // {
  //   label: "Settings",
  //   icon: <Settings />,
  //   href: "/settings",
  // },
];

export default function MenuPage() {
  const [search, setSearch] = useState("");

  
  const filteredMenus = menus.filter((menu) =>
    menu.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Menu"/>
      <div className="min-h-screen pb-20 px-4 pt-4 bg-gray-50 max-w-md mx-auto">
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
