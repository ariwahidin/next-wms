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
} from "lucide-react";

const inventoryMenus = [
  {
    label: "Location Transfer",
    icon: <MoveRight />,
    href: "/inventory/transfer",
  },
  {
    label: "Location Transfer by Serial",
    icon: <Barcode />,
    href: "/inventory/transfer-serial",
  },
  {
    label: "Stock Opname",
    icon: <ClipboardList />,
    href: "/inventory/stock-opname",
  }, // bisa juga diganti jadi "Physical Stock Count"
  {
    label: "Stock Adjustment",
    icon: <SlidersHorizontal />,
    href: "/inventory/adjustment",
  },
  { label: "Item Mutation", icon: <Repeat />, href: "/inventory/mutation" }, // bisa juga "Item Movement"
  { label: "Stock History", icon: <History />, href: "/inventory/history" },
  { label: "Stock Report", icon: <FileText />, href: "/inventory/report" },
  { label: "Scan Item", icon: <ScanBarcode />, href: "/inventory/scan" },
];

export default function InventoryMenuPage() {
  return (
    <>
      <PageHeader title="Inventory" showBackButton />
      <div className="min-h-screen bg-gray-50 px-4 pt-4 pb-20">
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
