import Link from "next/link";
import { ReactNode } from "react";

interface InventoryMenuCardProps {
  icon: ReactNode;
  label: string;
  href: string;
}

export default function InventoryMenuCard({ icon, label, href }: InventoryMenuCardProps) {
  return (
    <Link href={href} className="block">
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow hover:bg-gray-100 transition w-full">
        <div className="text-blue-500">{icon}</div>
        <div className="text-gray-800 font-medium">{label}</div>
      </div>
    </Link>
  );
}
