import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "@/lib/api";
import Layout from "@/components/layout";

// ============================================================
// TYPES
// ============================================================

type PrintLog = {
  id: number;

  document_type: string;
  document_no: string;
  module: string;

  print_action: "ORIGINAL" | "REPRINT" | string;
  print_method: string;
  print_format: string;

  copy_count: number;
  printer_name: string;

  status: "REQUESTED" | "COMPLETED" | "FAILED" | string;

  requested_by: number;
  requested_by_name: string;

  ip_address: string;
  workstation: string;

  reason: string;
  error_message: string;

  requested_at: string;
  completed_at?: string | null;
};

type Summary = {
  total: number;
  original: number;
  reprint: number;
  requested: number;
  completed: number;
  failed: number;
};

type Pagination = {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

type Filters = {
  search: string;
  module: string;
  print_action: string;
  status: string;
  date_from: string;
  date_to: string;
};

// ============================================================
// CONSTANTS & HELPERS
// ============================================================

const emptySummary: Summary = {
  total: 0,
  original: 0,
  reprint: 0,
  requested: 0,
  completed: 0,
  failed: 0,
};

const dateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
};

const numberFormat = (value: number) =>
  new Intl.NumberFormat("en-US").format(value || 0);

const titleCase = (value?: string) =>
  (value || "-")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const statusClass = (status: string) => {
  switch ((status || "").toUpperCase()) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";

    case "FAILED":
      return "bg-rose-50 text-rose-700 ring-rose-200";

    default:
      return "bg-amber-50 text-amber-700 ring-amber-200";
  }
};

const actionClass = (action: string) =>
  action === "REPRINT"
    ? "bg-violet-50 text-violet-700 ring-violet-200"
    : "bg-sky-50 text-sky-700 ring-sky-200";

// ============================================================
// PAGE
// ============================================================

const PrintLogsPage = () => {
  const today = useMemo(() => dateValue(new Date()), []);

  const [logs, setLogs] = useState<PrintLog[]>([]);
  const [summary, setSummary] = useState<Summary>(emptySummary);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    page_size: 20,
    total: 0,
    total_pages: 0,
  });

  const [searchInput, setSearchInput] = useState("");

  const [filters, setFilters] = useState<Filters>({
    search: "",
    module: "",
    print_action: "",
    status: "",
    date_from: "",
    date_to: "",
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [selected, setSelected] = useState<PrintLog | null>(null);

  // ==========================================================
  // FETCH PRINT LOGS
  // ==========================================================

  const fetchLogs = useCallback(
    async (showRefresh = false) => {
      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await api.get("/print/logs", {
          withCredentials: true,
          params: {
            page,
            page_size: pageSize,
            ...filters,
          },
        });

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
              "Failed to retrieve print history"
          );
        }

        setLogs(response.data.data || []);

        setSummary(response.data.summary || emptySummary);

        setPagination(
          response.data.pagination || {
            page,
            page_size: pageSize,
            total: 0,
            total_pages: 0,
          }
        );
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load print history. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, pageSize, filters]
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ==========================================================
  // FILTER ACTIONS
  // ==========================================================

  const applyFilters = () => {
    setPage(1);

    setFilters((current) => ({
      ...current,
      search: searchInput.trim(),
    }));
  };

  const resetFilters = () => {
    setSearchInput("");
    setPage(1);

    setFilters({
      search: "",
      module: "",
      print_action: "",
      status: "",
      date_from: "",
      date_to: "",
    });
  };

  const updateFilter = (key: keyof Filters, value: string) => {
    setPage(1);

    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const startItem =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) * pagination.page_size + 1;

  const endItem = Math.min(
    pagination.page * pagination.page_size,
    pagination.total
  );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Layout
      title="Print Management"
      subTitle="Print Activity Monitoring"
    >
      <div className="min-h-screen bg-slate-50 px-4 py-5 text-[13px] text-slate-700 md:px-6">
        <div className="mx-auto max-w-[1500px] space-y-4">

          {/* ================================================== */}
          {/* PAGE HEADER */}
          {/* ================================================== */}

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <path d="M7 14h10v7H7zM17 11h.01" />
                  </svg>
                </div>

                <h1 className="text-base font-semibold tracking-tight text-slate-900">
                  Print Management
                </h1>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Monitor document print requests, reprints, and execution status.
              </p>
            </div>

            <button
              type="button"
              onClick={() => fetchLogs(true)}
              disabled={refreshing || loading}
              className="inline-flex h-8 items-center justify-center gap-2 self-start rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-3.5 w-3.5 ${
                  refreshing ? "animate-spin" : ""
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 7v5h-5M4 17v-5h5" />
                <path d="M5.6 9a7 7 0 0 1 11.8-2L20 12M4 12l2.6 5a7 7 0 0 0 11.8-2" />
              </svg>

              Refresh
            </button>
          </div>

          {/* ================================================== */}
          {/* SUMMARY CARDS */}
          {/* ================================================== */}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                label: "Total Print Requests",
                value: summary.total,
                hint: "All recorded activities",
                tone: "text-slate-900",
                mark: "bg-slate-100 text-slate-600",
                tag: "ALL",
              },
              {
                label: "Original",
                value: summary.original,
                hint: "First-time document prints",
                tone: "text-sky-700",
                mark: "bg-sky-50 text-sky-700",
                tag: "1ST",
              },
              {
                label: "Reprint",
                value: summary.reprint,
                hint: "Subsequent document prints",
                tone: "text-violet-700",
                mark: "bg-violet-50 text-violet-700",
                tag: "COPY",
              },
              {
                label: "Failed",
                value: summary.failed,
                hint: `${numberFormat(summary.requested)} requested · ${numberFormat(summary.completed)} completed`,
                tone: "text-rose-700",
                mark: "bg-rose-50 text-rose-700",
                tag: "ERROR",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-medium text-slate-500">
                      {item.label}
                    </p>

                    <p
                      className={`mt-1 text-xl font-semibold leading-6 tabular-nums ${item.tone}`}
                    >
                      {numberFormat(item.value)}
                    </p>

                    <p className="mt-1 text-[10px] text-slate-400">
                      {item.hint}
                    </p>
                  </div>

                  <span
                    className={`rounded-md px-2 py-1 text-[10px] font-semibold ${item.mark}`}
                  >
                    {item.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ================================================== */}
          {/* FILTERS */}
          {/* ================================================== */}

          <section className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold text-slate-800">
                  Filter Print History
                </h2>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  Search documents or narrow results by date, module, and status.
                </p>
              </div>

              <button
                onClick={resetFilters}
                className="text-[11px] font-medium text-slate-500 hover:text-blue-700"
              >
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-6">

              {/* SEARCH */}

              <div className="sm:col-span-2">
                <label className="mb-1 block text-[10px] font-medium text-slate-500">
                  Search
                </label>

                <div className="flex h-8 items-center rounded-md border border-slate-200 bg-white px-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50">
                  <svg
                    viewBox="0 0 24 24"
                    className="mr-2 h-3.5 w-3.5 shrink-0 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-4-4" />
                  </svg>

                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && applyFilters()
                    }
                    placeholder="Document no., type, user name, printer..."
                    className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* MODULE */}

              <div>
                <label className="mb-1 block text-[10px] font-medium text-slate-500">
                  Module
                </label>

                <select
                  value={filters.module}
                  onChange={(e) => updateFilter("module", e.target.value)}
                  className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:border-blue-400"
                >
                  <option value="">All Modules</option>
                  <option value="INBOUND">Inbound</option>
                  <option value="OUTBOUND">Outbound</option>
                  <option value="INVENTORY">Inventory</option>
                </select>
              </div>

              {/* PRINT ACTION */}

              <div>
                <label className="mb-1 block text-[10px] font-medium text-slate-500">
                  Print Action
                </label>

                <select
                  value={filters.print_action}
                  onChange={(e) =>
                    updateFilter("print_action", e.target.value)
                  }
                  className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:border-blue-400"
                >
                  <option value="">All Actions</option>
                  <option value="ORIGINAL">Original</option>
                  <option value="REPRINT">Reprint</option>
                </select>
              </div>

              {/* STATUS */}

              <div>
                <label className="mb-1 block text-[10px] font-medium text-slate-500">
                  Status
                </label>

                <select
                  value={filters.status}
                  onChange={(e) => updateFilter("status", e.target.value)}
                  className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:border-blue-400"
                >
                  <option value="">All Statuses</option>
                  <option value="REQUESTED">Requested</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              {/* DATE FROM */}

              <div>
                <label className="mb-1 block text-[10px] font-medium text-slate-500">
                  Date From
                </label>

                <input
                  type="date"
                  value={filters.date_from}
                  max={filters.date_to || today}
                  onChange={(e) =>
                    updateFilter("date_from", e.target.value)
                  }
                  className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:border-blue-400"
                />
              </div>

              {/* DATE TO */}

              <div>
                <label className="mb-1 block text-[10px] font-medium text-slate-500">
                  Date To
                </label>

                <input
                  type="date"
                  value={filters.date_to}
                  min={filters.date_from || undefined}
                  max={today}
                  onChange={(e) =>
                    updateFilter("date_to", e.target.value)
                  }
                  className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:border-blue-400"
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={applyFilters}
                className="inline-flex h-8 items-center gap-2 rounded-md bg-blue-600 px-3.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </section>

          {/* ================================================== */}
          {/* PRINT HISTORY TABLE */}
          {/* ================================================== */}

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-3.5 py-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xs font-semibold text-slate-800">
                  Print History
                </h2>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  Select a row to view the full print activity details.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span>Rows</span>

                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-7 rounded border border-slate-200 bg-white px-1.5 text-xs outline-none"
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>

                <span>per page</span>
              </div>
            </div>

            {/* ERROR MESSAGE */}

            {error && (
              <div className="m-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {error}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] border-collapse text-left">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3.5 py-2.5 font-semibold">
                      Requested At
                    </th>

                    <th className="px-3.5 py-2.5 font-semibold">
                      Document
                    </th>

                    <th className="px-3.5 py-2.5 font-semibold">
                      Module
                    </th>

                    <th className="px-3.5 py-2.5 font-semibold">
                      Action
                    </th>

                    <th className="px-3.5 py-2.5 text-center font-semibold">
                      Copies
                    </th>

                    <th className="px-3.5 py-2.5 font-semibold">
                      Requested By
                    </th>

                    <th className="px-3.5 py-2.5 font-semibold">
                      Method / Format
                    </th>

                    <th className="px-3.5 py-2.5 font-semibold">
                      Status
                    </th>

                    <th className="px-3.5 py-2.5 text-right font-semibold">
                      Details
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-12 text-center text-xs text-slate-400"
                      >
                        Loading print history...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center">
                        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          >
                            <path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                            <path d="M7 14h10v7H7z" />
                          </svg>
                        </div>

                        <p className="text-xs font-medium text-slate-600">
                          No print activity found
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          Adjust the filters or submit a document print request to see activity here.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => setSelected(log)}
                        className="cursor-pointer transition hover:bg-blue-50/50"
                      >
                        <td className="whitespace-nowrap px-3.5 py-2.5 text-[11px] text-slate-500">
                          {formatDateTime(log.requested_at)}
                        </td>

                        <td className="px-3.5 py-2.5">
                          <div className="font-semibold text-slate-800">
                            {log.document_no}
                          </div>

                          <div className="mt-0.5 text-[10px] text-slate-400">
                            {titleCase(log.document_type)}
                          </div>
                        </td>

                        <td className="px-3.5 py-2.5 text-[11px] text-slate-600">
                          {titleCase(log.module)}
                        </td>

                        <td className="px-3.5 py-2.5">
                          <span
                            className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${actionClass(
                              log.print_action
                            )}`}
                          >
                            {log.print_action}
                          </span>
                        </td>

                        <td className="px-3.5 py-2.5 text-center text-xs tabular-nums">
                          {log.copy_count}
                        </td>

                        <td className="px-3.5 py-2.5">
                          <div className="text-[11px] font-medium text-slate-700">
                            {log.requested_by_name ||
                              `User #${log.requested_by}`}
                          </div>

                          <div className="mt-0.5 text-[10px] text-slate-400">
                            {log.workstation || log.ip_address || "-"}
                          </div>
                        </td>

                        <td className="px-3.5 py-2.5 text-[11px] text-slate-600">
                          {log.print_method}
                          <span className="text-slate-300"> / </span>
                          {log.print_format}
                        </td>

                        <td className="px-3.5 py-2.5">
                          <span
                            className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${statusClass(
                              log.status
                            )}`}
                          >
                            {log.status}
                          </span>
                        </td>

                        <td className="px-3.5 py-2.5 text-right">
                          <span className="text-[11px] font-medium text-blue-600">
                            View Details →
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}

            <div className="flex flex-col justify-between gap-2 border-t border-slate-100 px-3.5 py-3 sm:flex-row sm:items-center">
              <p className="text-[11px] text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {numberFormat(startItem)}–{numberFormat(endItem)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {numberFormat(pagination.total)}
                </span>{" "}
                print activities
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1 || loading}
                  onClick={() =>
                    setPage((value) => Math.max(1, value - 1))
                  }
                  className="h-7 rounded border border-slate-200 px-2.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="min-w-[72px] text-center text-[11px] text-slate-500">
                  {pagination.total_pages
                    ? `${pagination.page} / ${pagination.total_pages}`
                    : "0 / 0"}
                </span>

                <button
                  disabled={
                    page >= pagination.total_pages || loading
                  }
                  onClick={() => setPage((value) => value + 1)}
                  className="h-7 rounded border border-slate-200 px-2.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* ================================================== */}
        {/* PRINT LOG DETAIL DRAWER */}
        {/* ================================================== */}

        {selected && (
          <div
            className="fixed inset-0 z-50 flex justify-end bg-slate-900/30"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSelected(null);
              }
            }}
          >
            <aside className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">

              {/* DRAWER HEADER */}

              <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">
                    Print Log #{selected.id}
                  </p>

                  <h3 className="mt-1 text-sm font-semibold text-slate-900">
                    Print Activity Details
                  </h3>

                  <p className="mt-1 text-[11px] text-slate-500">
                    {formatDateTime(selected.requested_at)}
                  </p>
                </div>

                <button
                  onClick={() => setSelected(null)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close details"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m6 6 12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>

              {/* DRAWER CONTENT */}

              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">

                {/* DOCUMENT INFORMATION */}

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Document
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                    {selected.document_no}
                  </p>

                  <p className="mt-1 text-[11px] text-slate-500">
                    {titleCase(selected.document_type)} ·{" "}
                    {titleCase(selected.module)}
                  </p>

                  <div className="mt-3 flex gap-2">
                    <span
                      className={`rounded px-2 py-1 text-[10px] font-semibold ring-1 ring-inset ${actionClass(
                        selected.print_action
                      )}`}
                    >
                      {selected.print_action}
                    </span>

                    <span
                      className={`rounded px-2 py-1 text-[10px] font-semibold ring-1 ring-inset ${statusClass(
                        selected.status
                      )}`}
                    >
                      {selected.status}
                    </span>
                  </div>
                </div>

                {/* PRINT INFORMATION */}

                <div>
                  <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Print Information
                  </h4>

                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 px-3">
                    {[
                      ["Print Method", selected.print_method],
                      ["Print Format", selected.print_format],
                      ["Copy Count", String(selected.copy_count)],
                      ["Printer", selected.printer_name || "-"],
                      ["Reprint Reason", selected.reason || "-"],
                      ["Error Message", selected.error_message || "-"],
                      [
                        "Request Time",
                        formatDateTime(selected.requested_at),
                      ],
                      [
                        "Completion Time",
                        selected.completed_at
                          ? formatDateTime(selected.completed_at)
                          : "-",
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex justify-between gap-4 py-2.5 text-[11px]"
                      >
                        <span className="text-slate-500">{label}</span>

                        <span className="max-w-[65%] break-words text-right font-medium text-slate-700">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* USER & WORKSTATION */}

                <div>
                  <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    User & Workstation
                  </h4>

                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 px-3">
                    {[
                      [
                        "Requested By",
                        selected.requested_by_name ||
                          `User #${selected.requested_by}`,
                      ],
                      ["User ID", String(selected.requested_by)],
                      ["Workstation", selected.workstation || "-"],
                      ["IP Address", selected.ip_address || "-"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex justify-between gap-4 py-2.5 text-[11px]"
                      >
                        <span className="text-slate-500">{label}</span>

                        <span className="max-w-[65%] break-all text-right font-medium text-slate-700">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[10px] leading-4 text-slate-400">
                  REQUESTED confirms that the application recorded the
                  print request. It does not confirm that the physical
                  printer completed the job.
                </p>
              </div>

              {/* DRAWER FOOTER */}

              <div className="border-t border-slate-200 px-5 py-3">
                <button
                  onClick={() => setSelected(null)}
                  className="h-8 w-full rounded-md border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Close Details
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PrintLogsPage;