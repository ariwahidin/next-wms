// hooks/useRealtimeEvents.ts
import { useEffect } from "react";
import { toast } from "sonner"; // atau lib toast yang dipakai di shadcn setup

export function useRealtimeEvents() {
  useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws/events`);

    ws.onmessage = (msg) => {
      const event = JSON.parse(msg.data);

      switch (event.type) {
        case "outbound.packing_confirmed":
          toast.success(event.payload.message);
          break;
        // tambah case lain di sini seiring bertambah event
      }
    };

    ws.onerror = (err) => console.error("WS error:", err);

    return () => ws.close();
  }, []);
}