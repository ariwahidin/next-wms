'use client';

import { useState } from 'react';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PreviewResult {
  columns: string[];
  rows: Record<string, any>[];
  count: number;
}

interface Props {
  query: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function QueryPreviewButton({ query }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handlePreview = async () => {
    if (!query.trim()) {
      setError('Query tidak boleh kosong');
      setShowModal(true);
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setShowModal(true);

    try {
      const res = await api.post(
        '/report-mailer/reports/preview-query',
        { query },
        { withCredentials: true }
      );
      setResult(res.data.data);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Gagal menjalankan query');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Tombol Preview */}
      <button
        type="button"
        onClick={handlePreview}
        className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1.5"
      >
        <span>▶</span> Preview (5 baris)
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
              <div>
                <h2 className="font-semibold text-gray-800">Preview Query</h2>
                <p className="text-xs text-gray-400 mt-0.5">Menampilkan maksimal 5 baris pertama</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>

            {/* Query ditampilkan */}
            <div className="px-6 py-3 bg-gray-50 border-b flex-shrink-0">
              <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap break-all line-clamp-4">
                {query}
              </pre>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto px-6 py-4">
              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm gap-2">
                  <span className="animate-spin text-blue-500 text-xl">⟳</span>
                  Menjalankan query...
                </div>
              )}

              {/* Error */}
              {!loading && error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-red-700 mb-1">Query Error</div>
                  <pre className="text-xs text-red-600 font-mono whitespace-pre-wrap">{error}</pre>
                </div>
              )}

              {/* Hasil */}
              {!loading && result && (
                <>
                  {/* Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                      ✓ Query berhasil
                    </span>
                    <span className="text-xs text-gray-500">
                      {result.columns.length} kolom · {result.count} baris ditampilkan
                    </span>
                  </div>

                  {/* Tabel hasil */}
                  {result.rows && result.rows.length > 0 ? (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-xs">
                        <thead className="bg-blue-600 text-white">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-blue-200 w-8">#</th>
                            {result.columns.map((col) => (
                              <th key={col} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {result.rows.map((row, i) => (
                            <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                              {result.columns.map((col) => (
                                <td key={col} className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-[200px] truncate">
                                  {row[col] === null || row[col] === undefined ? (
                                    <span className="text-gray-300 italic">null</span>
                                  ) : (
                                    String(row[col])
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
                      Query berhasil dijalankan tapi tidak menghasilkan data (0 baris).
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t flex-shrink-0 flex justify-between items-center">
              <span className="text-xs text-gray-400">
                💡 Ini hanya preview — data asli akan di-generate saat email dikirim
              </span>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}