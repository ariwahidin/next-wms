"use client";
import PageHeader from "@/components/mobile/PageHeader";
import { SoundType, useSoundStore } from "@/store/soundStore";
import { useRouter } from "next/router";
import { useState } from "react";

const SOUND_META: {
  type: SoundType;
  label: string;
  desc: string;
  icon: string;
}[] = [
  {
    type: "error",
    label: "Error",
    desc: "Peringatan saat terjadi kesalahan",
    icon: "⚡",
  },
  {
    type: "success",
    label: "Sukses",
    desc: "Konfirmasi aksi berhasil",
    icon: "✓",
  },
  {
    type: "info",
    label: "Info",
    desc: "Notifikasi informasi umum",
    icon: "ℹ",
  },
];

export default function SoundSettingsPage() {
  const { prefs, masterEnabled, toggle, toggleMaster } = useSoundStore();
  const router = useRouter();

  const activeCount = Object.values(prefs).filter(Boolean).length;

  return (
    <>
      <PageHeader title="Sound Settings" showBackButton />

      <div style={{
        background: "#ffffff",
        minHeight: "100vh",
        padding: "16px",
        fontFamily: "system-ui, sans-serif",
      }}>

        {/* Section title */}
        <p style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#9ca3af",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}>
          Pengaturan Suara
        </p>

        {/* Master Toggle */}
        <div
          onClick={toggleMaster}
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            marginBottom: 16,
            userSelect: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20 }}>{masterEnabled ? "🔊" : "🔇"}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                Semua Suara
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 1 }}>
                {masterEnabled ? "Suara aktif" : "Semua suara dimatikan"}
              </div>
            </div>
          </div>
          {/* Toggle pill */}
          <div style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            background: masterEnabled ? "#111827" : "#d1d5db",
            position: "relative",
            transition: "background 0.2s",
            flexShrink: 0,
          }}>
            <div style={{
              position: "absolute",
              top: 3,
              left: masterEnabled ? 23 : 3,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
            }} />
          </div>
        </div>

        {/* Per-type section */}
        <p style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#9ca3af",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}>
          Per Jenis Notifikasi
        </p>

        <div style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          overflow: "hidden",
          background: "#f9fafb",
          marginBottom: 16,
          opacity: masterEnabled ? 1 : 0.5,
          pointerEvents: masterEnabled ? "auto" : "none",
          transition: "opacity 0.2s",
        }}>
          {SOUND_META.map((s, i) => {
            const active = prefs[s.type];
            return (
              <div
                key={s.type}
                onClick={() => toggle(s.type)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "13px 16px",
                  cursor: "pointer",
                  borderTop: i > 0 ? "1px solid #e5e7eb" : "none",
                  userSelect: "none",
                  background: "#f9fafb",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    fontSize: 16,
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {s.icon}
                  </span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 1 }}>
                      {s.desc}
                    </div>
                  </div>
                </div>

                {/* Toggle pill */}
                <div style={{
                  width: 40,
                  height: 22,
                  borderRadius: 11,
                  background: active ? "#111827" : "#d1d5db",
                  position: "relative",
                  transition: "background 0.2s",
                  flexShrink: 0,
                }}>
                  <div style={{
                    position: "absolute",
                    top: 2,
                    left: active ? 20 : 2,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#fff",
                    transition: "left 0.2s",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Status summary */}
        <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
          {!masterEnabled
            ? "Semua suara dimatikan"
            : activeCount === 0
            ? "Tidak ada suara aktif"
            : `${activeCount} dari 3 jenis suara aktif`}
        </p>
      </div>
    </>
  );
}