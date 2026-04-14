// hooks/useConnectionStatus.ts
"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api"; // sesuaikan path

type Status = "online" | "slow" | "offline" | "degraded"; // tambah state baru

export function useConnectionStatus() {
    const [status, setStatus] = useState<Status>("online");
    const [latency, setLatency] = useState<number | null>(null);

    useEffect(() => {
        const check = async () => {
            if (!navigator.onLine) {
                setStatus("offline");
                setLatency(null);
                return;
            }

            const start = Date.now();
            try {

                const res = await api.get("/health", {
                    timeout: 5000,
                    validateStatus: () => true,
                });

                const ms = Date.now() - start;

                if (res.status === 503) {
                    // server hidup tapi DB mati
                    setStatus("degraded"); // tambah state baru
                    setLatency(ms);
                } else if (res.status === 200) {
                    setLatency(ms);
                    setStatus(ms > 300 ? "slow" : "online");
                } else {
                    setStatus("offline");
                    setLatency(null);
                }
            } catch {
                setStatus("offline");
                setLatency(null);
            }
        };

        check();
        const id = setInterval(check, 30_000);
        window.addEventListener("online", check);
        window.addEventListener("offline", check);
        return () => {
            clearInterval(id);
            window.removeEventListener("online", check);
            window.removeEventListener("offline", check);
        };
    }, []);

    return { status, latency };
}