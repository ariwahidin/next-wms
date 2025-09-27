/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import PageHeader from "@/components/mobile/PageHeader";
import BottomNavbar from "@/components/mobile/BottomNavbar";
import InboundMenuCard from "@/components/mobile/inbound/InboundMenuCard";

import {
  Package,
  Truck,
  Archive,
  ClipboardCheck,
  FileText,
  Calendar,
  Scan,
  InboxIcon,
} from "lucide-react";

const inboundMenus = [
  // {
  //   label: "Create Inbound Order",
  //   icon: <Package />,
  //   href: "/mobile/inbound/create-order",
  // },
  {
    label: "Inbound Orders",
    icon: <InboxIcon />,
    href: "/mobile/inbound/view-orders",
  },
  // {
  //   label: "Goods Receipt",
  //   icon: <ClipboardCheck />,
  //   href: "/mobile/inbound/goods-receipt",
  // },
  // {
  //   label: "Inventory Receipt Report",
  //   icon: <FileText />,
  //   href: "/mobile/inbound/inventory-receipt-report",
  // },
  // {
  //   label: "Goods Arrival Confirmation",
  //   icon: <Archive />,
  //   href: "/mobile/inbound/goods-arrival-confirmation",
  // },
  // {
  //   label: "Inbound History",
  //   icon: <ClipboardCheck />,
  //   href: "/mobile/inbound/history",
  // },
  // {
  //   label: "Inbound Calendar",
  //   icon: <Calendar />,
  //   href: "/mobile/inbound/calendar",
  // },
  // {
  //   label: "Scan Inbound Items",
  //   icon: <Scan />,
  //   href: "/mobile/inbound/scan-items",
  // },
];

export default function InboundMenuPage() {
  return (
    <>
      <PageHeader title="Inbound" showBackButton />
      <div className="min-h-screen bg-gray-50 px-4 pt-4 pb-20 max-w-md mx-auto">
        <div className="space-y-3">
          {inboundMenus.map((menu, idx) => (
            <InboundMenuCard
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
