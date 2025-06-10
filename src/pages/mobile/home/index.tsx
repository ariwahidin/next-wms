"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/mobile/PageHeader";
import BottomNavbar from "@/components/mobile/BottomNavbar";
import {
  PackageCheck,
  Truck,
  Inbox,
  ScanBarcode,
  Bell,
  Clock,
} from "lucide-react";
import { useAppSelector } from "@/hooks/useAppSelector";

export default function HomePage() {
  const [greeting, setGreeting] = useState("");
  const userRedux = useAppSelector((state) => state.user);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Selamat pagi");
    else if (hour < 18) setGreeting("Selamat siang");
    else setGreeting("Selamat malam");
  }, []);

  return (
    <>
      <PageHeader title="Beranda" />
      <div className="min-h-screen bg-gray-50 pb-20 px-4 pt-4 space-y-6 max-w-md mx-auto">
        {/* Greeting */}
        <div className="text-lg font-semibold">{greeting}, {userRedux.name} 👋</div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard icon={<PackageCheck className="text-blue-600" />} label="Total Stok" value="1.250" />
          <SummaryCard icon={<Truck className="text-green-600" />} label="Outbound Hari Ini" value="14" />
          <SummaryCard icon={<Inbox className="text-yellow-600" />} label="Inbound Hari Ini" value="8" />
          <SummaryCard icon={<ScanBarcode className="text-purple-600" />} label="Perlu Scan" value="5" />
        </div>

        {/* Quick Access */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Akses Cepat</h2>
          <div className="grid grid-cols-2 gap-4">
            <QuickAccessButton label="Inventory" href="/mobile/inventory" icon={<PackageCheck />} />
            <QuickAccessButton label="Outbound" href="/mobile/outbound" icon={<Truck />} />
            <QuickAccessButton label="Inbound" href="/mobile/inbound" icon={<Inbox />} />
            <QuickAccessButton label="Scan" href="/mobile/inventory/scan" icon={<ScanBarcode />} />
          </div>
        </div>

        {/* Activity Log */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Aktivitas Terakhir</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <ActivityItem time="10:32" action="Transfer ABC ke Rak D" />
            <ActivityItem time="09:20" action="Outbound #INV2025 dikirim" />
            <ActivityItem time="08:45" action="Inbound #INB2025 diterima" />
          </div>
        </div>

        {/* Notification */}
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2 mt-2 shadow-sm">
          <Bell className="w-4 h-4" />
          Ada 2 stok item yang hampir habis!
        </div>
      </div>

      <BottomNavbar />
    </>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white shadow-sm p-3 rounded-xl flex items-center gap-3">
      <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full">
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-lg font-bold text-gray-700">{value}</div>
      </div>
    </div>
  );
}

function QuickAccessButton({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex flex-col items-center justify-center bg-white p-4 rounded-xl shadow-sm text-sm text-gray-700 hover:bg-gray-100"
    >
      <div className="w-10 h-10 mb-2 flex items-center justify-center bg-gray-100 rounded-full">
        {icon}
      </div>
      {label}
    </a>
  );
}

function ActivityItem({ time, action }: { time: string; action: string }) {
  return (
    <div className="flex items-start gap-2">
      <Clock className="w-4 h-4 mt-1 text-gray-400" />
      <div>
        <div className="font-medium">{time}</div>
        <div>{action}</div>
      </div>
    </div>
  );
}
