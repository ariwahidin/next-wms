import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import Layout from "@/components/layout";
import { Permission } from "@/types/permission";

const PermissionListPage = () => {
  const router = useRouter();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/permissions", { withCredentials: true });
      if (res.data.success) setPermissions(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  // Reset page on search
  useEffect(() => {
    setPage(1);
  }, [search]);

  const filtered = permissions.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.resource?.toLowerCase().includes(q) ||
      p.action?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Layout title="Settings" subTitle="Permissions">
      <div className="px-6 py-5 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-sm font-semibold text-gray-800 tracking-wide">Permissions</h1>
            <p className="text-xs text-gray-400 mt-0.5">{filtered.length} entries found</p>
          </div>
          <button
            onClick={() => router.push("/wms/settings/permissions/create")}
            className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors"
          >
            + New Permission
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name, resource, action, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded px-3 py-2 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors bg-gray-50"
          />
        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 w-10">#</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Resource : Action</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Description</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400 text-xs">
                    Loading...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400 text-xs">
                    No permissions found
                  </td>
                </tr>
              ) : (
                paginated.map((perm, index) => (
                  <tr
                    key={perm.ID}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-gray-400">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 font-medium">{perm.name}</td>
                    <td className="px-4 py-2.5 text-gray-500">
                      <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                        {perm.resource}:{perm.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 max-w-xs truncate">{perm.description}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => router.push(`/wms/settings/permissions/edit/${perm.ID}`)}
                        className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-2 transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-gray-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-xs px-2.5 py-1 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "...")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`dots-${i}`} className="text-xs text-gray-400 px-1">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`text-xs px-2.5 py-1 border rounded transition-colors ${
                        page === p
                          ? "bg-gray-900 text-white border-gray-900"
                          : "border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-xs px-2.5 py-1 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PermissionListPage;