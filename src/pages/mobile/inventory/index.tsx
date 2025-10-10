/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import PageHeader from "@/components/mobile/PageHeader";
import BottomNavbar from "@/components/mobile/BottomNavbar";
import InventoryMenuCard from "@/components/mobile/inventory/InventoryMenuCard";

import {
  MoveRight,
  Barcode,
  ClipboardList,
  SlidersHorizontal,
  Repeat,
  History,
  FileText,
  ScanBarcode,
  SearchCheck,
  SearchCheckIcon,
  SearchXIcon,
  Search,
  LocateFixedIcon,
  FileQuestion,
  LocateIcon,
  MailQuestion,
  BoxSelect,
  BadgeXIcon,
  ScalingIcon,
  ScanBarcodeIcon,
  PlusIcon,
} from "lucide-react";

const inventoryMenus = [
  {
    label: "Internal Transfer",
    icon: <MoveRight />,
    href: "/mobile/inventory/transfer",
  },
  // {
  //   label: "Location Transfer by Serial",
  //   icon: <Barcode />,
  //   href: "/mobile/inventory/transfer-serial",
  // },

  // {
  //   label: "Stock Adjustment",
  //   icon: <SlidersHorizontal />,
  //   href: "/mobile/inventory/adjustment",
  // },
  // {
  //   label: "Item Mutation",
  //   icon: <Repeat />,
  //   href: "/mobile/inventory/mutation",
  // }, // bisa juga "Item Movement"
  // {
  //   label: "Stock History",
  //   icon: <History />,
  //   href: "/mobile/inventory/history",
  // },
  {
    label: "Location Query",
    icon: <ScanBarcodeIcon />,
    href: "/mobile/inventory/scan-location",
  },
  {
    label: "Item Query",
    icon: <ScanBarcode />,
    href: "/mobile/inventory/scan-item"
  },
  {
    label: "Add Location",
    icon: <PlusIcon />,
    href: "/mobile/inventory/add-location",
  },

  // { label: "Search Location", icon: <LocateFixedIcon />, href: "/mobile/inventory/scan-location" },
  {
    label: "Stock Take",
    icon: <ClipboardList />,
    href: "/mobile/inventory/stock-opname",
  }, // bisa juga diganti jadi "Physical Stock Count"
];

export default function InventoryMenuPage() {
  return (
    <>
      <PageHeader title="Inventory" showBackButton />
      <div className="min-h-screen bg-gray-50 px-4 pt-4 pb-20 max-w-md mx-auto">
        <div className="space-y-3">
          {inventoryMenus.map((menu, idx) => (
            <InventoryMenuCard
              key={idx}
              icon={menu.icon}
              label={menu.label}
              href={menu.href}
            />
          ))}
        </div>
        <BottomNavbar />
      </div>
    </>
  );
}
