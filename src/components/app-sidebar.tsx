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
          title: "Product",
          url: "/master/product",
        },
        {
          title: "Supplier",
          url: "/master/supplier",
        },
        {
          title: "Customer",
          url: "/master/customer",
        },
        {
          title: "Handling",
          url: "/master/handling",
        },
        {
          title: "Transporter",
          url: "/master/transporter",
        },
        {
          title: "Truck",
          url: "/master/truck",
        },
        {
          title: "Origin",
          url: "/master/origin",
        },

        // {
        //   title: "Master Items",
        //   url: "/master/item",
        // },
        // {
        //   title: "Dashboard",
        //   url: "/dashboard",
        // },
      ],
    },
    {
      title: "Inbound",
      url: "#",
      icon: InboxIcon,
      isActive: true,
      items: [
        {
          title: "Create Inbound",
          url: "/inbound/create",
        },
        {
          title: "Upload Inbound",
          url: "/inbound/create/upload",
        },
        {
          title: "List Inbound",
          url: "/inbound/list",
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
          title: "List Inventory",
          url: "/inventory/list",
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
          title: "Create Outbound",
          url: "/outbound/create",
        },
        {
          title: "List Outbound",
          url: "/outbound/list",
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
      title: "Configuration",
      url: "#",
      icon: SettingsIcon,
      isActive: true,
      items: [
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
          url: "/master/permissions",
        },
        {
          title: "Role Permissions",
          url: "/master/role-permission",
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
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavUser user={data.user} />
        {/* <TeamSwitcher teams={data.teams} /> */}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>{/* <NavUser user={data.user} /> */}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
