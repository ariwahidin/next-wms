'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import QueryPreviewButton from './QueryPreviewButton';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportQuery {
  id: number;
  name: string;
  query: string;
  sort_order: number;
}

type OutputMode = 'single_file' | 'multi_file';

interface Props {
  reportId: number;
  outputMode: OutputMode;
  onOutputModeChange: (mode: OutputMode) => void;
}

const defaultForm = { name: '', query: '' };

// ─── Component ────────────────────────────────────────────────────────────────

export default function QueryTab({ reportId, outputMode, onOutputModeChange }: Props) {
  const [queries, setQueries] = useState<ReportQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editQuery, setEditQuery] = useState<ReportQuery | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/report-mailer/reports/${reportId}/queries`, { withCredentials: true });
      setQueries(res.data.data || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Gagal memuat queries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [reportId]);

  // ─── Modal ──────────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditQuery(null);
    setForm(defaultForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (rq: ReportQuery) => {
    setEditQuery(rq);
    setForm({ name: rq.name, query: rq.query });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (editQuery) {
        await api.put(
          `/report-mailer/reports/${reportId}/queries/${editQuery.id}`,
          { ...form, sort_order: editQuery.sort_order },
          { withCredentials: true }
        );
        setSuccess('Query berhasil diupdate');
      } else {
        await api.post(
          `/report-mailer/reports/${reportId}/queries`,
          form,
          { withCredentials: true }
        );
        setSuccess('Query berhasil ditambahkan');
      }
      setShowModal(false);
      fetchQueries();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Gagal menyimpan query');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rq: ReportQuery) => {
    if (!confirm(`Hapus query "${rq.name}"?`)) return;
    try {
      await api.delete(
        `/report-mailer/reports/${reportId}/queries/${rq.id}`,
        { withCredentials: true }
      );
      setSuccess('Query berhasil dihapus');
      fetchQueries();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Gagal menghapus query');
    }
  };

  // ─── Reorder ────────────────────────────────────────────────────────────────

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const reordered = [...queries];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    const updated = reordered.map((q, i) => ({ ...q, sort_order: i }));
    setQueries(updated);
    await api.put(
      `/report-mailer/reports/${reportId}/queries/reorder`,
      updated.map((q) => ({ id: q.id, sort_order: q.sort_order })),
      { withCredentials: true }
    );
  };

  const moveDown = async (index: number) => {
    if (index === queries.length - 1) return;
    const reordered = [...queries];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
    const updated = reordered.map((q, i) => ({ ...q, sort_order: i }));
    setQueries(updated);
    await api.put(
      `/report-mailer/reports/${reportId}/queries/reorder`,
      updated.map((q) => ({ id: q.id, sort_order: q.sort_order })),
      { withCredentials: true }
    );
  };

  // ─── Output Mode ────────────────────────────────────────────────────────────

  const handleOutputModeChange = async (mode: OutputMode) => {
    try {
      await api.put(
        `/report-mailer/reports/${reportId}/output-mode`,
        { output_mode: mode },
        { withCredentials: true }
      );
      onOutputModeChange(mode);
      setSuccess(`Output mode diubah ke ${mode === 'single_file' ? '1 file multi-sheet' : 'banyak file'}`);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Gagal mengubah output mode');
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loading) return <div className="p-6 text-sm text-gray-400">Memuat queries...</div>;

  return (
    <div className="space-y-4">
      {/* Notifikasi */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex justify-between">
          <span>{error}</span><button onClick={() => setError('')}>✕</button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg flex justify-between">
          <span>{success}</span><button onClick={() => setSuccess('')}>✕</button>
        </div>
      )}

      {/* Output Mode Toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-medium text-gray-700">Format Output Excel</div>
            <div className="text-xs text-gray-400 mt-0.5">
              Pilih bagaimana query-query di bawah akan digabungkan dalam email
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleOutputModeChange('single_file')}
            className={`flex-1 border rounded-xl p-4 text-left transition-colors ${
              outputMode === 'single_file'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className={`text-sm font-medium ${outputMode === 'single_file' ? 'text-blue-700' : 'text-gray-700'}`}>
              📊 1 File, Banyak Sheet
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Semua query dalam 1 file Excel, tiap query jadi 1 sheet
            </div>
          </button>
          <button
            onClick={() => handleOutputModeChange('multi_file')}
            className={`flex-1 border rounded-xl p-4 text-left transition-colors ${
              outputMode === 'multi_file'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className={`text-sm font-medium ${outputMode === 'multi_file' ? 'text-blue-700' : 'text-gray-700'}`}>
              📎 Banyak File, 1 Email
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Tiap query jadi file Excel terpisah, semua di-attach dalam 1 email
            </div>
          </button>
        </div>
      </div>

      {/* List Queries */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <span className="text-sm font-medium text-gray-700">Daftar Query</span>
            <span className="ml-2 text-xs text-gray-400">
              ({queries.length} query · {outputMode === 'single_file' ? `${queries.length} sheet` : `${queries.length} file`})
            </span>
          </div>
          <button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg"
          >
            + Tambah Query
          </button>
        </div>

        {queries.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Belum ada query. Klik &quot;+ Tambah Query&quot; untuk menambahkan.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {queries.map((rq, index) => (
              <div key={rq.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                {/* Urutan */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs leading-none"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === queries.length - 1}
                    className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs leading-none"
                  >
                    ▼
                  </button>
                </div>

                {/* Badge urutan */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                  outputMode === 'single_file'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {index + 1}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">{rq.name}</div>
                  <div className="text-xs text-gray-400 font-mono truncate mt-0.5">
                    {rq.query.replace(/\s+/g, ' ').trim().slice(0, 80)}
                    {rq.query.length > 80 ? '...' : ''}
                  </div>
                </div>

                {/* Label sheet/file */}
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {outputMode === 'single_file' ? `Sheet: ${rq.name}` : `File: ${rq.name}`}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <QueryPreviewButton query={rq.query} />
                  <button
                    onClick={() => openEdit(rq)}
                    className="text-xs text-yellow-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(rq)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info preview output */}
      {queries.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-500">
          {outputMode === 'single_file' ? (
            <>📊 Email akan berisi <strong>1 file Excel</strong> dengan <strong>{queries.length} sheet</strong>: {queries.map(q => q.name).join(', ')}</>
          ) : (
            <>📎 Email akan berisi <strong>{queries.length} file Excel</strong> terpisah: {queries.map(q => q.name).join(', ')}</>
          )}
        </div>
      )}

      {/* Modal Form Query */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
              <h2 className="font-semibold text-gray-800">
                {editQuery ? `Edit Query: ${editQuery.name}` : 'Tambah Query'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded">{error}</div>
              )}

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Nama {outputMode === 'single_file' ? 'Sheet' : 'File'} *
                </label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={outputMode === 'single_file' ? 'cth: Stock Summary' : 'cth: Stock Report'}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-gray-500">SQL Query *</label>
                  <QueryPreviewButton query={form.query} />
                </div>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={12}
                  placeholder={`SELECT\n  item_code,\n  item_name,\n  qty\nFROM wms_inventory\nWHERE is_active = 1\nORDER BY item_code`}
                  value={form.query}
                  onChange={(e) => setForm({ ...form, query: e.target.value })}
                />
                <p className="text-xs text-gray-400 mt-1">
                  💡 Nama kolom di SELECT akan jadi header di Excel.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex-shrink-0 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.query}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}