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
        // {
        //   title: "Item & Handling",
        //   url: "/wms/master/item-handling",
        // },
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
          title: "UoM Conversion",
          url: "/wms/master/uom-conversion",
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
        // {
        //   title: "Data",
        //   url: "/wms/inventory/data",
        // },
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
        // {
        //   title: "Outbound Handling",
        //   url: "/wms/outbound/handling",
        // },
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
        // {
        //   title: "List Stock Take",
        //   url: "/stock-take/list",
        // },
      ],
    },
    // {
    //   title: "Shipping",
    //   url: "#",
    //   icon: Truck,
    //   isActive: true,
    //   items: [
    //     {
    //       title: "Create DN Manual",
    //       url: "/shipping/create-dn-manual",
    //     },
    //     {
    //       title: "Combine DN",
    //       url: "/shipping/combine-dn",
    //     },
    //     {
    //       title: "Combine Existing Order",
    //       url: "/shipping/combine-existing",
    //     },
    //     {
    //       title: "List Order",
    //       url: "/shipping/order-list",
    //     },
    //   ],
    // },
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
    // {
    //   title: "Settings",
    //   url: "#",
    //   icon: SettingsIcon,
    //   isActive: true,
    //   items: [
    //     {
    //       title: "User Manual",
    //       url: "/wms/settings/user-manual",
    //     },
    //     {
    //       title: "Users",
    //       url: "/master/user",
    //     },
    //     {
    //       title: "Roles",
    //       url: "/master/role",
    //     },
    //     {
    //       title: "Permissions",
    //       url: "/configuration/permissions",
    //     },
    //     {
    //       title: "Role Permissions",
    //       url: "/master/role-permission",
    //     },
    //     {
    //       title: "Menu",
    //       url: "/menu",
    //     },
    //   ],
    // },
    // {
    //   title: "Example Pages",
    //   url: "#",
    //   icon: Settings2,
    //   isActive: true,
    //   items: [
    //     {
    //       title: "Tanstack Table",
    //       url: "/example/table/tanstack",
    //     },
    //     {
    //       title: "New Inbound",
    //       url: "/example/inbound/new",
    //     },
    //     {
    //       title: "List Inbound",
    //       url: "/example/inbound/list",
    //     },
    //     {
    //       title: "Putaway",
    //       url: "/example/putaway",
    //     },
    //     {
    //       title: "Stock",
    //       url: "/example/putaway/stock",
    //     },
    //     {
    //       title: "Outbound",
    //       url: "/example/outbound",
    //     },
    //     {
    //       title: "New Outbound",
    //       url: "/example/outbound/new",
    //     },
    //     {
    //       title: "Picking",
    //       url: "/example/picking",
    //     },
    //     {
    //       title: "New BU",
    //       url: "/example/create-bu",
    //     },
    //     {
    //       title: "DB Migrate",
    //       url: "/example/db-migrate",
    //     },
    //   ],
    // },
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

  useEffect(() => {
    const collapsedPaths = [
      "/wms/inbound/add",
      "/wms/outbound/add",
      "/wms/outbound/edit",
      "/wms/outbound/waranty",
      "/wms/outbound/handling/edit",
      "/wms/inbound/edit",
    ];

    if (
      collapsedPaths.some((path) => pathname.startsWith(path)) &&
      !hasAutoCollapsed.current
    ) {
      setOpen(false); // Tutup sekali saja
      hasAutoCollapsed.current = true; // Tandai sudah auto collapse
    } else if (!collapsedPaths.some((path) => pathname.startsWith(path))) {
      hasAutoCollapsed.current = false; // Reset flag kalau keluar dari path itu
    }
  }, [pathname, setOpen]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavUser user={data.user} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  );
}

// export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
//   const menus = useSelector((state: RootState) => state.user.menus);

//   const pathname = usePathname();
//   const { open, setOpen } = useSidebar()

//   useEffect(() => {
//     if (pathname.startsWith("/wms/outbound/edit") || pathname.startsWith("/wms/inbound/edit")) {
//       setOpen(true); // false = collapse, true = expand
//     }

//     // setOpen(false);
//   }, [pathname, setOpen]);

//   return (
//     <Sidebar collapsible="icon" {...props}>
//       <SidebarHeader>
//         {/* <SidebarTrigger /> */}
//         <NavUser user={data.user} />
//         {/* <TeamSwitcher teams={data.teams} /> */}
//       </SidebarHeader>
//       <SidebarContent>
//         {/* <NavMain items={menus} /> */}
//         <NavMain items={data.navMain} />
//         {/* <NavProjects projects={data.projects} /> */}
//       </SidebarContent>
//       <SidebarFooter>{/* <NavUser user={data.user} /> */}</SidebarFooter>
//       <SidebarRail />
//     </Sidebar>
//   );
// }
