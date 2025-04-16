"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils"; // optional
import { LucideIcon } from "lucide-react";

interface BottomNavItemProps {
  label: string;
  icon: LucideIcon;
  href: string;
}

const BottomNavItem: React.FC<BottomNavItemProps> = ({
  label,
  icon: Icon,
  href,
}) => {
  const router = useRouter();
  const isActive = router.pathname === href;

  return (
    <Link href={href}>
      <div
        className={cn(
          "flex flex-col items-center text-sm transition-colors",
          isActive ? "text-blue-600 font-semibold" : "text-gray-500"
        )}
      >
        <Icon className={cn("w-6 h-6 mb-1", isActive && "animate-bounce")} />
        {label}
      </div>
    </Link>
  );
};

export default BottomNavItem;
