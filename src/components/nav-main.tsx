/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { ChevronRight, Icon, LayoutDashboard, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { iconMap } from "@/lib/icon-registry";


import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

// import {
//   Database,
//   InboxIcon,
//   Box,
//   Archive,
//   PieChart,
//   Frame,
//   Smartphone,
//   Wrench,
//   SettingsIcon
// } from "lucide-react"

export type IconName = keyof typeof iconMap;

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: IconName;   // ✅ BUKAN LucideIcon
    // icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname(); // Mendapatkan path halaman saat ini
  console.log("Items NavMain:", items);

  // const Icon = item.icon ? iconMap[item.icon] : null;


  // const iconMap = {
  //   Database,
  //   InboxIcon,
  //   Box,
  //   Archive,
  //   PieChart,
  //   Frame,
  //   Smartphone,
  //   Wrench,
  //   SettingsIcon,
  // };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/wms/dashboard">
              <LayoutDashboard />
              Dashboard
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <SidebarMenu>
        {items.map((item) => {
          // Cek apakah URL utama atau salah satu sub-item cocok dengan path saat ini
          const isActive =
            pathname === item.url ||
            (item.items?.some((subItem) => pathname === subItem.url) ?? false);

            const Icon = item.icon ? iconMap[item.icon] : null;

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isActive} // Hanya buka jika halaman aktif
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {/* {item.icon && <item.icon />} */}
                    {Icon && <Icon />}
                    <span>{item.title}</span>
                    <ChevronRight
                      className={`ml-auto transition-transform duration-200 ${isActive ? "rotate-90" : ""
                        }`}
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          className={`${pathname === subItem.url
                              ? "bg-gray-200 dark:bg-gray-700"
                              : ""
                            }`}
                        >
                          <Link href={subItem.url}>{subItem.title}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
