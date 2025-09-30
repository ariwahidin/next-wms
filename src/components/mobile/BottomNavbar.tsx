"use client";

import { Home, Menu, User } from "lucide-react";
import BottomNavItem from "./BottomNavItem";

const navItems = [
  {
    label: "Home",
    icon: Home,
    href: "/mobile/home",
  },
  {
    label: "Menu",
    icon: Menu,
    href: "/mobile/menu",
  },
  {
    label: "Profile",
    icon: User,
    href: "/mobile/profile",
  },
];

export default function BottomNavbar() {
  // const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-2 flex justify-around items-center shadow-lg z-50">
      {navItems.map((item) => (
        <BottomNavItem
          key={item.label}
          label={item.label}
          href={item.href}
          icon={item.icon}
          // active={pathname === item.href}
        />
      ))}
    </nav>
  );
}
