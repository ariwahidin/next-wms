/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRightCircle } from "lucide-react";

interface InboundMenuCardProps {
  icon: React.ReactNode;
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
      <Card className="flex items-center space-x-4 p-4 shadow-lg rounded-lg bg-white hover:bg-gray-100 transition cursor-pointer mb-2">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold">{label}</h4>
        </div>
        <ArrowRightCircle size={24} className="text-primary" />
      </Card>
    </Link>
  );
};

export default InboundMenuCard;
