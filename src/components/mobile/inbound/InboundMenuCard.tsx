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

const InboundMenuCard: React.FC<InboundMenuCardProps> = ({ icon, label, href }) => {
  return (
    <Card className="flex items-center space-x-4 p-4 shadow-lg rounded-lg bg-white">
      <div className="text-2xl">{icon}</div>
      <div className="flex-1">
        <h4 className="text-lg font-semibold">{label}</h4>
      </div>
      <Link href={href}>
        <Button variant="ghost" size="icon" className="text-primary">
          <ArrowRightCircle size={24} />
        </Button>
      </Link>
    </Card>
  );
};

export default InboundMenuCard;
