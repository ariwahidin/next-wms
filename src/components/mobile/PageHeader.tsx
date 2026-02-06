// components/PageHeader.tsx
import { ArrowLeft, Server } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "../ui/badge";
import { useAppSelector } from "@/hooks/useAppSelector";

type PageHeaderProps = {
  title: string;
  showBackButton?: boolean;
};

export default function PageHeader({
  title,
  showBackButton = false,
}: PageHeaderProps) {
  const router = useRouter();
  const userRedux = useAppSelector((state) => state.user);

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border-b shadow-sm sticky top-0 z-50">
      {showBackButton && (
        <button onClick={() => router.back()} className="text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {/* <span className="mr-2 absolute top-3 right-2">
        <Badge className="bg-gray-500 text-white capitalize">{userRedux.unit}</Badge>
      </span> */}

      <div className="
                    absolute top-4 right-2
                    flex items-center 
                    gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm">
        <Server className="w-2.5 h-2.5" />
        <span className="text-xs font-semibold tracking-wide">
          {userRedux.unit?.replace(/_/g, ' ').toUpperCase() || 'SYSTEM'}
        </span>
      </div>

      <h1 className="text-lg font-semibold">{title}</h1>
    </div>
  );
}
