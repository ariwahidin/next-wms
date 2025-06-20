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
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

import * as Icons from "lucide-react";
import api from "@/lib/api";
import { useEffect, useState } from "react";

import { useSelector } from "react-redux";
import { RootState } from "@/store"; // Pastikan ini pointing ke konfigurasi store-mu

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
          title: "UoM Conversion",
          url: "/wms/master/uom-conversion",
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
          title: "Handling",
          url: "/wms/master/handling",
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
      ],
    },
    {
      title: "Inbound",
      url: "#",
      icon: InboxIcon,
      isActive: true,
      items: [
        {
          title: "Data",
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
          title: "Data",
          url: "/wms/inventory/data",
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
          title: "Data",
          url: "/wms/outbound/data",
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
          title: "Generate Stock Take",
          url: "/stock-take/generate",
        },
        {
          title: "Progress Stock Take",
          url: "/stock-take/progress",
        },
        {
          title: "List Stock Take",
          url: "/stock-take/list",
        },
      ],
    },
    {
      title: "Shipping",
      url: "#",
      icon: Truck,
      isActive: true,
      items: [
        {
          title: "Create DN Manual",
          url: "/shipping/create-dn-manual",
        },
        {
          title: "Combine DN",
          url: "/shipping/combine-dn",
        },
        {
          title: "Combine Existing Order",
          url: "/shipping/combine-existing",
        },
        {
          title: "List Order",
          url: "/shipping/order-list",
        },
      ],
    },
    {
      title: "Mobile RF",
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
      title: "Settings",
      url: "#",
      icon: SettingsIcon,
      isActive: true,
      items: [
        {
          title: "User Manual",
          url: "/wms/settings/user-manual",
        },
        {
          title: "Users",
          url: "/master/user",
        },
        {
          title: "Roles",
          url: "/master/role",
        },
        {
          title: "Permissions",
          url: "/configuration/permissions",
        },
        {
          title: "Role Permissions",
          url: "/master/role-permission",
        },
        {
          title: "Menu",
          url: "/menu",
        },
      ],
    },
    {
      title: "Example Pages",
      url: "#",
      icon: Settings2,
      isActive: true,
      items: [
        {
          title: "Tanstack Table",
          url: "/example/table/tanstack",
        },
        {
          title: "New Inbound",
          url: "/example/inbound/new",
        },
        {
          title: "List Inbound",
          url: "/example/inbound/list",
        },
        {
          title: "Putaway",
          url: "/example/putaway",
        },
        {
          title: "Stock",
          url: "/example/putaway/stock",
        },
        {
          title: "Outbound",
          url: "/example/outbound",
        },
        {
          title: "New Outbound",
          url: "/example/outbound/new",
        },
        {
          title: "Picking",
          url: "/example/picking",
        },
        {
          title: "New BU",
          url: "/example/create-bu",
        },
        {
          title: "DB Migrate",
          url: "/example/db-migrate",
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

  // const [menus, setMenus] = useState<any[]>([]);

  // useEffect(() => {
  //   const fetchMenus = async () => {
  //     try {
  //       const roleId = 1; // atau ambil dari context/auth
  //       const res = await api.get(`/menus/user`, { withCredentials: true });
  //       setMenus(res.data.data);
  //     } catch (err) {
  //       console.error("Failed to fetch menus", err);
  //     }
  //   };

  //   fetchMenus();
  // }, []);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavUser user={data.user} />
        {/* <TeamSwitcher teams={data.teams} /> */}
      </SidebarHeader>
      <SidebarContent>
        {/* <NavMain items={menus} /> */}
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>{/* <NavUser user={data.user} /> */}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
