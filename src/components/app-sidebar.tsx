import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Database,
  Archive,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
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
    avatar: "/avatars/shadcn.jpg",
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
          title: "Users",
          url: "/master/user",
        },
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
        {
          title: "Master Items",
          url: "/master/item",
        },
        {
          title: "Dashboard",
          url: "/dashboard",
        },
      ],
    },
    {
      title: "Inbound",
      url: "#",
      icon: Archive,
      isActive: true,
      items: [
        {
          title: "Create Inbound",
          url: "/inbound/create",
        },
        {
          title: "List Inbound",
          url: "/inbound/list",
        },
        {
          title: "Scan Inbound",
          url: "/inbound/scan",
        },
      ],
    },
    {
      title: "Inventory",
      url: "#",
      icon: Archive,
      isActive: true,
      items: [
        {
          title: "List Inventory",
          url: "/inventory/list",
        },
        {
          title: "Transfer Location",
          url: "/inventory/transfer",
        },
        {
          title: "STO",
          url: "/inventory/sto",
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
        {
          title: "Scan Outbound",
          url: "/outbound/scan",
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
