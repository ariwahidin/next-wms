// components/connection-status.tsx
"use client";

import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { cn } from "@/lib/utils";

export function ConnectionStatus() {
    const { status, latency } = useConnectionStatus();
    const config = {
        online: {
            dot: "bg-green-500",
            text: "text-green-700",
            bg: "bg-green-50 border-green-200",
            label: latency ? `${latency}ms` : "Online",
        },
        slow: {
            dot: "bg-amber-500 animate-pulse",
            text: "text-amber-700",
            bg: "bg-amber-50 border-amber-200",
            label: latency ? `${latency}ms` : "Slow",
        },
        offline: {
            dot: "bg-red-500",
            text: "text-red-700",
            bg: "bg-red-50 border-red-200",
            label: "Offline",
        },
        degraded: {
            dot: "bg-orange-500 animate-pulse",
            text: "text-orange-700",
            bg: "bg-orange-50 border-orange-200",
            label: "DB Error",
        },
    }[status];

    return (
        <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold",
            config.bg, config.text
        )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
            {config.label}
        </div>
    );
}