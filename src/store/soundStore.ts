import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SoundType = "error" | "success" | "info";

interface SoundStore {
  prefs: Record<SoundType, boolean>;
  masterEnabled: boolean;
  toggle: (type: SoundType) => void;
  toggleMaster: () => void;
}

export const useSoundStore = create<SoundStore>()(
  persist(
    (set) => ({
      prefs: { error: true, success: true, info: true },
      masterEnabled: true,
      toggle: (type) =>
        set((s) => ({
          prefs: { ...s.prefs, [type]: !s.prefs[type] },
        })),
      toggleMaster: () =>
        set((s) => ({ masterEnabled: !s.masterEnabled })),
    }),
    { name: "sound-prefs" }
  )
);