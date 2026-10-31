const StatusBadge = ({ status }: { status: string }) => {
  const statusMap: Record<string, { label: string; color: string; dot: string }> = {
    open:   { label: "Open",   color: "bg-blue-50 border-blue-200 text-blue-700",   dot: "bg-blue-500"  },
    confirmed: { label: "Confirmed", color: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-500" },
    loaded: { label: "Loaded", color: "bg-green-50 border-green-200 text-green-700", dot: "bg-green-500" },
  };
  const cfg = statusMap[status?.toLowerCase()] ?? {
    label: status ?? "-",
    color: "bg-gray-50 border-gray-200 text-gray-600",
    dot:   "bg-gray-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

export default StatusBadge;