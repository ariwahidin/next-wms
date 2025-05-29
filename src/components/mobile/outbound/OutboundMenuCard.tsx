"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JSX } from "react";
import { ArrowRightCircle } from "lucide-react";

interface OutboundMenuCardProps {
  icon: JSX.Element;
  label: string;
  href: string;
}

const OutboundMenuCard: React.FC<OutboundMenuCardProps> = ({
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

export default OutboundMenuCard;
