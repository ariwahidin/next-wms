'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'success' | 'failed';

interface History {
  id: number;
  status: Status;
  message: string;
  sent_at: string;
  triggered_by: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface Props {
  reportId: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (date: string) =>
  new Date(date).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

// ─── Component ────────────────────────────────────────────────────────────────

export default function HistoryTab({ reportId }: Props) {
  const [histories, setHistories] = useState<History[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 20, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);

      const res = await api.get(
        `/report-mailer/reports/${reportId}/history?${params}`,
        { withCredentials: true }
      );
      setHistories(res.data.data || []);
      setMeta(res.data.meta);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Gagal memuat history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, [statusFilter]);

  const handleClear = async () => {
    if (!confirm('Hapus semua history untuk report ini?')) return;
    try {
      await api.delete(`/report-mailer/reports/${reportId}/history`, { withCredentials: true });
      setSuccess('History berhasil dihapus');
      fetchHistory(1);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Gagal menghapus history');
    }
  };

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const successCount = histories.filter((h) => h.status === 'success').length;
  const failedCount = histories.filter((h) => h.status === 'failed').length;

  return (
    <div className="space-y-4">
      {/* Notifikasi */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg flex justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}>✕</button>
        </div>
      )}

      {/* Header + Filter */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[
            { label: 'Semua', value: '' },
            { label: '✓ Sukses', value: 'success' },
            { label: '✕ Gagal', value: 'failed' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === f.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Total: {meta.total} record</span>
          {meta.total > 0 && (
            <button onClick={handleClear} className="text-xs text-red-500 hover:underline">
              Hapus Semua
            </button>
          )}
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Memuat history...</div>
        ) : histories.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Belum ada history pengiriman
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Waktu Kirim</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-medium">Status</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-medium">Trigger</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {histories.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                      {formatDate(h.sent_at)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        h.status === 'success'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {h.status === 'success' ? '✓ Sukses' : '✕ Gagal'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        h.triggered_by === 'manual'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {h.triggered_by === 'manual' ? '👤 Manual' : '🕐 Scheduler'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {h.status === 'failed' ? (
                        <span className="text-red-500">{h.message}</span>
                      ) : (
                        <span className="text-gray-400">{h.message}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {meta.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Halaman {meta.page} dari {meta.pages}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={meta.page <= 1}
                    onClick={() => fetchHistory(meta.page - 1)}
                    className="px-3 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <button
                    disabled={meta.page >= meta.pages}
                    onClick={() => fetchHistory(meta.page + 1)}
                    className="px-3 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Summary kecil di halaman ini */}
      {!loading && histories.length > 0 && (
        <div className="flex gap-3">
          <div className="flex-1 bg-green-50 border border-green-100 rounded-lg px-4 py-3 text-center">
            <div className="text-lg font-semibold text-green-700">{successCount}</div>
            <div className="text-xs text-green-500">Sukses (halaman ini)</div>
          </div>
          <div className="flex-1 bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-center">
            <div className="text-lg font-semibold text-red-700">{failedCount}</div>
            <div className="text-xs text-red-500">Gagal (halaman ini)</div>
          </div>
          <div className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-center">
            <div className="text-lg font-semibold text-gray-700">{meta.total}</div>
            <div className="text-xs text-gray-400">Total semua history</div>
          </div>
        </div>
      )}
    </div>
  );
}