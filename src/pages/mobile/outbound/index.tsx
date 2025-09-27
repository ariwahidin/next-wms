/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import PageHeader from "@/components/mobile/PageHeader";
import BottomNavbar from "@/components/mobile/BottomNavbar";
import OutboundMenuCard from "@/components/mobile/outbound/OutboundMenuCard";

import {
  Package,
  Truck,
  ClipboardCheck,
  ArrowRightCircle,
  FileText,
  Calendar,
  CheckCircle,
  Scan,
} from "lucide-react";

const outboundMenus = [
  // {
  //   label: "Create Outbound Order",
  //   icon: <Package />,
  //   href: "/mobile/outbound/create-order",
  // },
  {
    label: "Outbound Orders",
    icon: <Truck />,
    href: "/mobile/outbound/view-orders",
  },
  // {
  //   label: "Schedule Pickup",
  //   icon: <ClipboardCheck />,
  //   href: "/mobile/outbound/schedule-pickup",
  // },
  // {
  //   label: "Shipping Report",
  //   icon: <FileText />,
  //   href: "/mobile/outbound/shipping-report",
  // },
  // {
  //   label: "Track Shipment",
  //   icon: <ArrowRightCircle />,
  //   href: "/mobile/outbound/track-shipment",
  // },
  // {
  //   label: "Outbound History",
  //   icon: <ClipboardCheck />,
  //   href: "/mobile/outbound/history",
  // },
  // {
  //   label: "Outbound Calendar",
  //   icon: <Calendar />,
  //   href: "/mobile/outbound/calendar",
  // },
  // {
  //   label: "Scan Shipment",
  //   icon: <Scan />,
  //   href: "/mobile/outbound/scan-shipment",
  // },
];

export default function OutboundMenuPage() {
  return (
    <>
      <PageHeader title="Outbound" showBackButton />
      <div className="min-h-screen bg-gray-50 px-4 pt-4 pb-20 max-w-md mx-auto">
        <div className="space-y-3">
          {outboundMenus.map((menu, idx) => (
            <OutboundMenuCard
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
