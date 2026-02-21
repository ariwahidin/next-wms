/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Layout from '@/components/layout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailConfig {
  id: number;
  name: string;
}

interface Schedule {
  frequency: string;
  hour: number;
  minute: string;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
}

interface Report {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  email_config: EmailConfig;
  schedule: Schedule | null;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatSchedule = (schedule: Schedule | null) => {
  if (!schedule) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  const time = `${pad(schedule.hour)}:${pad(Number(schedule.minute))}`;
  if (schedule.frequency === 'daily') return `Setiap hari ${time}`;
  if (schedule.frequency === 'weekly') return `Mingguan ${time}`;
  if (schedule.frequency === 'monthly') return `Bulanan ${time}`;
  return schedule.frequency;
};

const formatDate = (date: string | null) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportMailerPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/report-mailer/reports', { withCredentials: true });
      setReports(res.data.data || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus report "${name}"? Semua data terkait (recipient, schedule, history) akan ikut terhapus.`)) return;
    try {
      await api.delete(`/report-mailer/reports/${id}`, { withCredentials: true });
      setSuccess('Report berhasil dihapus');
      fetchReports();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Gagal menghapus');
    }
  };

  return (
    <Layout title="Utilities" subTitle="Report Mailer" description="Kelola report otomatis yang dikirim via email">
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Report Mailer</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola report otomatis yang dikirim via email</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/wms/utilities/report-mailer/email-config')}
            className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm px-4 py-2 rounded-lg"
          >
            ⚙ Email Config
          </button>
          <button
            onClick={() => router.push('/wms/utilities/report-mailer/create')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
          >
            + Tambah Report
          </button>
        </div>
      </div>

      {/* Notifikasi */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg flex justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}>✕</button>
        </div>
      )}

      {/* Tabel */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Memuat data...</div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Belum ada report. Klik &quot;+ Tambah Report&quot; untuk membuat yang pertama.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Nama Report</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Email Config</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Schedule</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Terakhir Kirim</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">Status</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{report.name}</div>
                    {report.description && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                        {report.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {report.email_config?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{formatSchedule(report.schedule)}</div>
                    {report.schedule && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        report.schedule.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {report.schedule.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {formatDate(report.schedule?.last_run_at || null)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      report.is_active
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {report.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => router.push(`/wms/utilities/report-mailer/${report.id}/edit`)}
                        className="text-xs text-yellow-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(report.id, report.name)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
    </Layout>
  );
}