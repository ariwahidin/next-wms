// import Link from "next/link";
// import { ReactNode } from "react";

// interface InventoryMenuCardProps {
//   icon: ReactNode;
//   label: string;
//   href: string;
// }

// export default function InventoryMenuCard({ icon, label, href }: InventoryMenuCardProps) {
//   return (
//     <Link href={href} className="block">
//       <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow hover:bg-gray-100 transition w-full">
//         <div className="text-blue-500">{icon}</div>
//         <div className="text-gray-800 font-medium">{label}</div>
//       </div>
//     </Link>
//   );
// }

"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRightCircle } from "lucide-react";
import { JSX } from "react";

interface InboundMenuCardProps {
  icon: JSX.Element;
  label: string;
  href: string;
}

const InboundMenuCard: React.FC<InboundMenuCardProps> = ({
  icon,
  label,
  href,
}) => {
  return (
    <Link href={href}>
      <Card className="flex items-center space-x-4 p-4 shadow-lg rounded-lg bg-white mb-2">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold">{label}</h4>
        </div>
        <ArrowRightCircle size={24} />
      </Card>
    </Link>
  );
};

export default InboundMenuCard;
