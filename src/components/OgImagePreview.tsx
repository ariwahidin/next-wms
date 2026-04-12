/**
 * OGImagePreview.tsx
 *
 * Komponen preview OG Image untuk WMS.
 * Edit bagian CONFIG di bawah untuk kustomisasi.
 *
 * Usage:
 *   import OGImagePreview from "@/components/OGImagePreview";
 *   <OGImagePreview />
 *
 * Dependencies:
 *   - Tailwind CSS
 *   - Google Fonts: Syne + DM Mono (tambahkan di _document.tsx atau layout.tsx)
 *
 *   <link
 *     href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono:wght@400;500&display=swap"
 *     rel="stylesheet"
 *   />
 */

import React from "react";

// ─────────────────────────────────────────
//  ✏️  EDIT BAGIAN INI UNTUK KUSTOMISASI
// ─────────────────────────────────────────
const CONFIG = {
  // Teks
  eyebrow: "Yusen Logistics",       // teks kecil di atas judul
  appName: "Yutrack",                   // bagian pertama judul (solid)
  appNameAccent: "WMS",           // bagian kedua judul (outline/accent)
  tagline: "A fast, accurate, and integrated warehouse management system.",
  domain: "wms.logspeedy.com",

  // Warna utama (accent)
  accentColor: "#38bdf8",           // biru langit
  accentColorSecondary: "#6366f1",  // indigo

  // Background
  bgColor: "#060c18",               // warna dasar card

  // WhatsApp preview
  wa: {
    show: true,                     // tampilkan mock WA di bawah?
    senderName: "Ari — Dev",
    incomingMsg: "link WMS udah bisa diakses ya 👇",
    replyMsg: "siap, makasih! 🙏",
    previewTitle: "Yutrack WMS — Yusen Logistics",
    previewDesc: "Sistem manajemen gudang yang cepat, akurat, dan terintegrasi.",
  },
};
// ─────────────────────────────────────────

// Inline styles (agar tidak bergantung pada Tailwind untuk element tertentu)
const styles: Record<string, React.CSSProperties> = {
  // OG Card
  ogCard: {
    width: 1200,
    height: 630,
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
    background: CONFIG.bgColor,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "0 96px",
    boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 60px 120px rgba(0,0,0,0.7)`,
    // Scale down untuk preview di browser — hapus baris ini saat export ke PNG
    transform: "scale(0.55)",
    transformOrigin: "top center",
  },

  // Diagonal stripe
  pattern: {
    position: "absolute",
    inset: 0,
    backgroundImage: `repeating-linear-gradient(
      -55deg,
      transparent,
      transparent 28px,
      rgba(255,255,255,0.018) 28px,
      rgba(255,255,255,0.018) 29px
    )`,
  },

  // Glow blob kanan atas
  glowA: {
    position: "absolute",
    width: 560,
    height: 560,
    borderRadius: "50%",
    background: `radial-gradient(circle, ${CONFIG.accentColor}22 0%, transparent 65%)`,
    top: -160,
    right: -60,
    pointerEvents: "none",
  },

  // Glow blob kiri bawah
  glowB: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background: `radial-gradient(circle, ${CONFIG.accentColorSecondary}1a 0%, transparent 65%)`,
    bottom: -120,
    left: 200,
    pointerEvents: "none",
  },

  // Corner brackets
  bracketBase: {
    position: "absolute",
    width: 48,
    height: 48,
    borderColor: `${CONFIG.accentColor}40`,
    borderStyle: "solid",
  },

  // Vertical rule kanan
  rule: {
    position: "absolute",
    right: 96,
    top: 80,
    bottom: 80,
    width: 1,
    background: `linear-gradient(to bottom, transparent, ${CONFIG.accentColor}33 30%, ${CONFIG.accentColor}33 70%, transparent)`,
  },

  // Dot di tengah rule
  mark: {
    position: "absolute",
    right: 96,
    top: "50%",
    transform: "translate(50%, -50%)",
    width: 9,
    height: 9,
    borderRadius: "50%",
    background: CONFIG.accentColor,
    boxShadow: `0 0 16px ${CONFIG.accentColor}`,
  },

  // Bottom gradient bar
  bar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    background: `linear-gradient(90deg, transparent 0%, ${CONFIG.accentColor} 20%, ${CONFIG.accentColorSecondary} 60%, transparent 100%)`,
  },

  // Domain text
  domain: {
    position: "absolute",
    bottom: 36,
    right: 96,
    fontSize: 13,
    color: "#2a3a52",
    fontFamily: "'DM Mono', monospace",
    letterSpacing: "0.1em",
  },
};

// ── Bracket corners ──────────────────────
const Bracket = ({
  pos,
}: {
  pos: "tl" | "tr" | "bl" | "br";
}) => {
  const posStyle: React.CSSProperties = {
    tl: { top: 28, left: 28, borderWidth: "2px 0 0 2px" },
    tr: { top: 28, right: 28, borderWidth: "2px 2px 0 0" },
    bl: { bottom: 28, left: 28, borderWidth: "0 0 2px 2px" },
    br: { bottom: 28, right: 28, borderWidth: "0 2px 2px 0" },
  }[pos];

  return <div style={{ ...styles.bracketBase, ...posStyle }} />;
};

// ── OG Card ─────────────────────────────
const OGCard = () => (
  <div style={styles.ogCard}>
    {/* Background layers */}
    <div style={styles.pattern} />
    <div style={styles.glowA} />
    <div style={styles.glowB} />

    {/* Corner brackets */}
    <Bracket pos="tl" />
    <Bracket pos="tr" />
    <Bracket pos="bl" />
    <Bracket pos="br" />

    {/* Right rule */}
    <div style={styles.rule} />
    <div style={styles.mark} />

    {/* Content */}
    <div style={{ position: "relative", zIndex: 2, maxWidth: 820 }}>
      {/* Eyebrow */}
      <div
        style={{
          fontSize: 14,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: CONFIG.accentColor,
          marginBottom: 24,
          fontFamily: "'DM Mono', monospace",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 28,
            height: 1,
            background: CONFIG.accentColor,
          }}
        />
        {CONFIG.eyebrow}
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: 100,
          lineHeight: 0.92,
          letterSpacing: "-0.03em",
          color: "#f0f6ff",
          marginBottom: 36,
        }}
      >
        {CONFIG.appName}
        <br />
        <span
          style={{
            color: "transparent",
            WebkitTextStroke: `2px ${CONFIG.accentColor}99`,
          }}
        >
          {CONFIG.appNameAccent}
        </span>
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 22,
          color: "#4e6280",
          fontWeight: 400,
          lineHeight: 1.5,
          maxWidth: 600,
          whiteSpace: "pre-line",
        }}
      >
        {CONFIG.tagline.split(/\*\*(.*?)\*\*/g).map((part, i) =>
          i % 2 === 1 ? (
            <strong key={i} style={{ color: "#94a3b8", fontWeight: 500 }}>
              {part}
            </strong>
          ) : (
            part
          )
        )}
      </div>
    </div>

    {/* Bottom bar & domain */}
    <div style={styles.bar} />
    <div style={styles.domain}>{CONFIG.domain}</div>
  </div>
);

// ── WhatsApp Mock ────────────────────────
const WAMock = () => (
  <div
    style={{
      width: 340,
      background: "#111b21",
      borderRadius: 18,
      padding: "20px 16px 16px",
      border: "1px solid #1f2c34",
      fontFamily: "system-ui, sans-serif",
    }}
  >
    {/* Header */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: "1px solid #1f2c34",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${CONFIG.accentColor}, ${CONFIG.accentColorSecondary})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 700,
          color: "white",
        }}
      >
        {CONFIG.wa.senderName[0]}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#e9edef" }}>
          {CONFIG.wa.senderName}
        </div>
        <div style={{ fontSize: 11, color: "#3b4a60" }}>online</div>
      </div>
    </div>

    {/* Chat */}
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Incoming text */}
      <div
        style={{
          alignSelf: "flex-start",
          background: "#202c33",
          borderRadius: "0 10px 10px 10px",
          padding: "8px 12px",
          maxWidth: 240,
        }}
      >
        <div style={{ fontSize: 13, color: "#e9edef", lineHeight: 1.4 }}>
          {CONFIG.wa.incomingMsg}
        </div>
        <div style={{ fontSize: 10, color: "#8696a0", textAlign: "right", marginTop: 4 }}>
          10.41
        </div>
      </div>

      {/* Link preview bubble */}
      <div
        style={{
          alignSelf: "flex-start",
          background: "#202c33",
          borderRadius: "0 10px 10px 10px",
          overflow: "hidden",
          maxWidth: 260,
        }}
      >
        {/* Thumbnail */}
        <div
          style={{
            width: "100%",
            height: 130,
            background: CONFIG.bgColor,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Pattern */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `repeating-linear-gradient(
                -55deg,
                transparent,
                transparent 10px,
                rgba(255,255,255,0.025) 10px,
                rgba(255,255,255,0.025) 11px
              )`,
            }}
          />
          {/* Glow */}
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${CONFIG.accentColor}33 0%, transparent 65%)`,
            }}
          />
          {/* Title */}
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 26,
              fontWeight: 800,
              color: "#f0f6ff",
              letterSpacing: "-0.02em",
              position: "relative",
              zIndex: 1,
            }}
          >
            {CONFIG.appName}{" "}
            <span
              style={{
                color: "transparent",
                WebkitTextStroke: `1px ${CONFIG.accentColor}b0`,
              }}
            >
              {CONFIG.appNameAccent}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div style={{ padding: "10px 12px 4px" }}>
          <div
            style={{
              fontSize: 11,
              color: "#00a884",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 3,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {CONFIG.domain}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e9edef", lineHeight: 1.3 }}>
            {CONFIG.wa.previewTitle}
          </div>
          <div style={{ fontSize: 11, color: "#8696a0", marginTop: 2, lineHeight: 1.4 }}>
            {CONFIG.wa.previewDesc}
          </div>
        </div>
        <div style={{ fontSize: 10, color: "#8696a0", textAlign: "right", padding: "4px 12px 8px" }}>
          10.41 ✓✓
        </div>
      </div>

      {/* Reply */}
      <div
        style={{
          alignSelf: "flex-end",
          background: "#005c4b",
          borderRadius: "10px 0 10px 10px",
          padding: "8px 12px",
          maxWidth: 200,
        }}
      >
        <div style={{ fontSize: 13, color: "#e9edef", lineHeight: 1.4 }}>
          {CONFIG.wa.replyMsg}
        </div>
        <div style={{ fontSize: 10, color: "#8696a0", textAlign: "right", marginTop: 4 }}>
          10.43 ✓✓
        </div>
      </div>
    </div>
  </div>
);

// ── Main Export ──────────────────────────
export default function OGImagePreview() {
  return (
    <div
      style={{
        background: "#080b12",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 48,
        padding: "60px 24px",
      }}
    >
      {/* OG Card */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#3b4a60",
            fontFamily: "monospace",
          }}
        >
          OG Image — 1200 × 630px
        </p>
        {/* Wrapper untuk kompensasi scale */}
        <div style={{ marginBottom: -296 }}>
          <OGCard />
        </div>
      </div>

      {/* WA Mock */}
      {CONFIG.wa.show && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginTop: 8 }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#3b4a60",
              fontFamily: "monospace",
            }}
          >
            ↓ preview di WhatsApp
          </p>
          <WAMock />
        </div>
      )}
    </div>
  );
}