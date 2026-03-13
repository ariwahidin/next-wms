// OutboundPipeline.tsx
// Sisipkan di dashboard.tsx antara Stats Cards dan Charts:
//   <OutboundPipeline filter={filter} />

import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type FilterState = {
  preset: "all" | "today" | "this_week" | "this_month" | "custom";
  dateFrom: string;
  dateTo: string;
  ownerCode: string;
  trendPeriod: number;
};

type PipelineRow = {
  stage_key: string;
  total_orders: number;
  total_qty: number;
};

type PipelineData = {
  outbound: PipelineRow[];
  inbound: PipelineRow[];
};

// ── Stage config ──────────────────────────────────────────────────────────────

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string; ring: string }> = {
  open: { label: "Open", color: "#3b82f6", bg: "#eff6ff", ring: "#bfdbfe" },
  checking: { label: "Checking", color: "#3b82f6", bg: "#eff6ff", ring: "#bfdbfe" },
  confirmed: { label: "Confirmed", color: "#3b82f6", bg: "#eff6ff", ring: "#bfdbfe" },
  partially_received: { label: "Partially Received", color: "#8b5cf6", bg: "#f5f3ff", ring: "#ddd6fe" },
  allocated: { label: "Allocated", color: "#8b5cf6", bg: "#f5f3ff", ring: "#ddd6fe" },
  on_picking: { label: "On Picking", color: "#f59e0b", bg: "#fffbeb", ring: "#fde68a" },
  on_packing: { label: "On Packing", color: "#f97316", bg: "#fff7ed", ring: "#fed7aa" },
  fully_received: { label: "Fully Received", color: "#06b6d4", bg: "#ecfeff", ring: "#a5f3fc" },
  ready_to_ship: { label: "Ready to Ship", color: "#06b6d4", bg: "#ecfeff", ring: "#a5f3fc" },
  shipped: { label: "Shipped", color: "#10b981", bg: "#f0fdf4", ring: "#a7f3d0" },
  received: { label: "Received", color: "#3b82f6", bg: "#eff6ff", ring: "#bfdbfe" },
  inspection: { label: "Inspection", color: "#f59e0b", bg: "#fffbeb", ring: "#fde68a" },
  putaway: { label: "Putaway", color: "#8b5cf6", bg: "#f5f3ff", ring: "#ddd6fe" },
  complete: { label: "Complete", color: "#8b5cf6", bg: "#f5f3ff", ring: "#ddd6fe" },
};

const fallbackConfig = { label: "Unknown", color: "#94a3b8", bg: "#f8fafc", ring: "#e2e8f0" };

// ── Build params ──────────────────────────────────────────────────────────────

function buildPipelineParams(f: FilterState): Record<string, string> {
  const params: Record<string, string> = {};
  let dateFrom = f.dateFrom;
  let dateTo = f.dateTo;

  if (f.preset !== "custom" && f.preset !== "all") {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    if (f.preset === "today") {
      dateFrom = dateTo = fmt(today);
    } else if (f.preset === "this_week") {
      const d = new Date(today);
      d.setDate(today.getDate() - today.getDay());
      dateFrom = fmt(d);
      dateTo = fmt(today);
    } else if (f.preset === "this_month") {
      dateFrom = fmt(new Date(today.getFullYear(), today.getMonth(), 1));
      dateTo = fmt(today);
    }
  }

  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;
  if (f.ownerCode && f.ownerCode !== "all") params.owner_code = f.ownerCode;
  if (!dateFrom && !dateTo) params.period = String(f.trendPeriod);

  return params;
}

// ── Circle Node ───────────────────────────────────────────────────────────────

function CircleNode({
  row,
  maxOrders,
  isActive,
  onClick,
  isLast,
}: {
  row: PipelineRow;
  maxOrders: number;
  isActive: boolean;
  onClick: () => void;
  isLast: boolean;
}) {
  const cfg = STAGE_CONFIG[row.stage_key] ?? fallbackConfig;
  const R = 32;
  const C = 2 * Math.PI * R;
  const pct = maxOrders > 0 ? row.total_orders / maxOrders : 0;
  const dash = pct * C;

  return (
    <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 88 }}>

      {/* Node */}
      <div
        onClick={onClick}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
        }}
      >
        {/* Ring + inner */}
        <div style={{ position: "relative", width: 80, height: 80 }}>
          <svg
            width="80" height="80"
            style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
          >
            <circle cx="40" cy="40" r={R} fill="none" stroke="#f1f5f9" strokeWidth="4" />
            <circle
              cx="40" cy="40" r={R}
              fill="none"
              stroke={cfg.color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${C}`}
              opacity={isActive ? 1 : 0.4}
              style={{ transition: "stroke-dasharray .5s cubic-bezier(.16,1,.3,1), opacity .15s" }}
            />
          </svg>

          <div style={{
            position: "absolute",
            inset: 8,
            borderRadius: "50%",
            background: isActive ? cfg.bg : "#fafafa",
            border: `1.5px solid ${isActive ? cfg.color + "44" : "#f1f5f9"}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transition: "all .15s ease",
            boxShadow: isActive ? `0 0 0 4px ${cfg.ring}` : "none",
          }}>
            <span style={{
              fontSize: 17,
              fontWeight: 800,
              lineHeight: 1,
              color: isActive ? cfg.color : "#1e293b",
              fontVariantNumeric: "tabular-nums",
              transition: "color .15s",
            }}>
              {row.total_orders}
            </span>
            <span style={{ fontSize: 8, color: "#cbd5e1", fontWeight: 500, marginTop: 1 }}>
              orders
            </span>
          </div>
        </div>

        {/* Label + qty */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 0.3,
            color: isActive ? cfg.color : "#64748b",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            transition: "color .15s",
          }}>
            {cfg.label}
          </div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>
            {row.total_qty.toLocaleString()} pcs
          </div>
        </div>
      </div>

      {/* Connector */}
      {!isLast && (
        <div style={{
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
          width: 20,
          paddingBottom: 36,
        }}>
          <div style={{ flex: 1, height: 1.5, background: "#e2e8f0", borderRadius: 99 }} />
          <svg width="5" height="8" viewBox="0 0 5 8" fill="none" style={{ flexShrink: 0 }}>
            <path d="M0 0L5 4L0 8Z" fill="#cbd5e1" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

function DetailPanel({ row }: { row: PipelineRow }) {
  const cfg = STAGE_CONFIG[row.stage_key] ?? fallbackConfig;
  const avgQty = row.total_orders > 0 ? Math.round(row.total_qty / row.total_orders) : 0;

  return (
    <div style={{
      marginTop: 16,
      background: cfg.bg,
      border: `1px solid ${cfg.color}33`,
      borderRadius: 12,
      padding: "14px 16px",
      display: "flex",
      gap: 28,
      flexWrap: "wrap",
      animation: "pipelineFadeIn .15s ease",
    }}>
      {[
        { label: "Orders", value: row.total_orders.toLocaleString(), unit: "orders" },
        { label: "Total Qty", value: row.total_qty.toLocaleString(), unit: "pcs" },
        { label: "Avg/Order", value: avgQty.toLocaleString(), unit: "pcs/order" },
      ].map((m) => (
        <div key={m.label}>
          <div style={{
            fontSize: 10,
            color: cfg.color,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 2,
          }}>
            {m.label}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
            {m.value}
          </div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{m.unit}</div>
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function OutboundPipeline({ filter }: { filter: FilterState }) {
  const [data, setData] = useState<PipelineData>({ outbound: [], inbound: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"outbound" | "inbound">("outbound");
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => { setActive(null); }, [filter, tab]);

  const fetchPipeline = useCallback(async (f: FilterState) => {
    setLoading(true);
    try {
      const res = await api.get("/dashboard/pipeline", {
        params: buildPipelineParams(f),
        withCredentials: true,
      });
      if (res.data.success) {
        setData({
          outbound: res.data.data?.outbound ?? [],
          inbound: res.data.data?.inbound ?? [],
        });
      }
    } catch (err) {
      console.error("Error fetching pipeline:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPipeline(filter); }, [filter, fetchPipeline]);

  const steps = tab === "outbound" ? data.outbound : data.inbound;
  const maxOrders = steps.length > 0 ? Math.max(...steps.map((s) => s.total_orders)) : 0;
  const activeRow = active ? steps.find((s) => s.stage_key === active) : null;

  return (
    <div style={{
      background: "rgba(255,255,255,0.8)",
      backdropFilter: "blur(8px)",
      borderRadius: 16,
      border: "1px solid #f1f5f9",
      boxShadow: "0 1px 4px rgba(0,0,0,.06)",
      padding: "20px 24px",
      marginBottom: 24,
    }}>
      <style>{`
        @keyframes pipelineFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header + Tab */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
            Order Pipeline
          </h3>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
            Active orders per stage
          </p>
        </div>

        <div style={{
          display: "flex",
          gap: 2,
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          padding: 3,
        }}>
          {(["outbound", "inbound"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "4px 12px",
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                background: tab === t ? "#fff" : "transparent",
                color: tab === t ? "#0f172a" : "#94a3b8",
                boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,.08)" : "none",
                transition: "all .15s",
                textTransform: "capitalize",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ height: 130, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 className="animate-spin w-5 h-5 text-slate-400" />
        </div>
      ) : steps.length === 0 ? (
        <div style={{ height: 130, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: 12, color: "#94a3b8" }}>No active orders in pipeline</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", overflowX: "auto", paddingBottom: 4 }}>
            {steps.map((row, i) => (
              <CircleNode
                key={row.stage_key}
                row={row}
                maxOrders={maxOrders}
                isActive={active === row.stage_key}
                isLast={i === steps.length - 1}
                onClick={() => setActive(active === row.stage_key ? null : row.stage_key)}
              />
            ))}
          </div>

          {activeRow && <DetailPanel row={activeRow} />}
        </>
      )}
    </div>
  );
}