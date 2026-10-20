/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react";
import {
  AudioWaveform,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Database,
  Archive,
  Truck,
  InboxIcon,
  Box,
  Smartphone,
  Settings2,
  Settings,
  SettingsIcon,
  Wrench,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import * as Icons from "lucide-react";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store"; // Pastikan ini pointing ke konfigurasi store-mu
import packageJson from "../../package.json";

// helper untuk ambil icon berdasarkan nama
function getIcon(name: string) {
  const LucideIcon = Icons[name as keyof typeof Icons];
  return LucideIcon || Icons.HelpCircle; // fallback kalau tidak ada
}

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatar/avatar1.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Master Data",
      url: "#",
      icon: Database,
      isActive: true,
      items: [
        {
          title: "Items",
          url: "/wms/master/product",
        },
        {
          title: "Supplier",
          url: "/wms/master/supplier",
        },
        {
          title: "Customer",
          url: "/wms/master/customer",
        },
        {
          title: "Transporter",
          url: "/wms/master/transporter",
        },
        {
          title: "Truck",
          url: "/wms/master/truck",
        },
        {
          title: "Origin",
          url: "/wms/master/origin",
        },
        {
          title: "Location",
          url: "/wms/master/location",
        },
        {
          title: "Vas Main",
          url: "/wms/master/main-vas",
        },
        {
          title: "Vas",
          url: "/wms/master/vas",
        },
      ],
    },
    {
      title: "Inbound",
      url: "#",
      icon: InboxIcon,
      isActive: true,
      items: [
        {
          title: "Inbound Activity",
          url: "/wms/inbound/data",
        },
      ],
    },
    {
      title: "Inventory",
      url: "#",
      icon: Box,
      isActive: true,
      items: [
        {
          title: "Inventory Stock",
          url: "/wms/inventory/data/inventory-management",
        },
      ],
    },
    {
      title: "Outbound",
      url: "#",
      icon: Archive,
      isActive: true,
      items: [
        {
          title: "Outbound Activity",
          url: "/wms/outbound/data",
        },
      ],
    },
    {
      title: "Report",
      url: "#",
      icon: PieChart,
      isActive: true,
      items: [
        {
          title: "Activity Report",
          url: "/wms/report/activity-report",
        },
        {
          title: "Handling Report",
          url: "/wms/report/handling-report",
        },
        {
          title: "Cycle Count Outbound",
          url: "/wms/report/cyclecount-outbound",
        },
        {
          title: "Inbound",
          url: "/wms/report/inbound",
        },
        {
          title: "Outbound",
          url: "/wms/report/outbound",
        },
        {
          title: "Stock",
          url: "/wms/report/stock",
        },
      ],
    },
    {
      title: "Stock Take",
      url: "#",
      icon: Frame,
      isActive: true,
      items: [
        {
          title: "Stock Take Activity",
          url: "/wms/stock-take/data",
        },
        {
          title: "Stock Card",
          url: "/wms/stock-take/stock-card",
        },
      ],
    },
    {
      title: "Mobile Scanner",
      url: "#",
      icon: Smartphone,
      isActive: true,
      items: [
        {
          title: "Home",
          url: "/mobile/home",
        },
      ],
    },
    {
      title: "Utilities",
      url: "#",
      icon: Wrench,
      isActive: true,
      items: [
        {
          title: "Print ST Location",
          url: "/wms/utilities/print-st-location",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: SettingsIcon,
      isActive: true,
      items: [
        {
          title: "Menu Management",
          url: "/wms/settings/menu",
        },
        {
          title: "Inventory Policy",
          url: "/wms/settings/inventory-policy",
        },
        {
          title: "UoM Conversion",
          url: "/wms/settings/uom-conversion",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const menus = useSelector((state: RootState) => state.user.menus);
  const pathname = usePathname();
  const { setOpen } = useSidebar();
  const hasAutoCollapsed = React.useRef(false); // Flag biar cuma jalan sekali


  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavUser user={data.user} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={menus} />
      </SidebarContent>

      <SidebarFooter>
        <div className="mt-2 px-2 group-data-[collapsible=icon]:hidden">
          <div className="border-t pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">
                WMS
              </span>
              <span className="text-[12px] text-muted-foreground/70">
                v{packageJson.version}
              </span>
            </div>
          </div>
        </div>
      </SidebarFooter >
      <SidebarRail />
    </Sidebar>
  );
}

