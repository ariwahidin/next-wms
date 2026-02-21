"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import eventBus from "@/utils/eventBus";
import { useSoundStore } from "@/store/soundStore";

const SOUND_MAP = {
  error: "/sounds/mixkit-electric-fence-fx-2968.wav",
  success: "/sounds/mixkit-electronic-lock-success-beeps-2852.wav",
  info: "/sounds/info-beep.wav",
} as const;

let lastPlay = 0;

export default function GlobalAlertSound() {
  const router = useRouter();
  const { prefs, masterEnabled } = useSoundStore();

  useEffect(() => {
    const handler = (payload: { type?: "error" | "success" | "info" }) => {
      if (!router.pathname.startsWith("/mobile")) return;
      if (!masterEnabled) return;
      if (!payload.type) return;

      if (!prefs[payload.type]) return;

      const sound = SOUND_MAP[payload.type];
      if (!sound) return;

      const now = Date.now();
      if (now - lastPlay < 400) return;
      lastPlay = now;

      const audio = new Audio(sound);
      audio.volume = payload.type === "error" ? 0.7 : 0.4;
      audio.play().catch(() => {});
    };

    eventBus.on("showAlert", handler);
    return () => eventBus.off("showAlert", handler);
  }, [router.pathname, prefs, masterEnabled]);

  return null;
}