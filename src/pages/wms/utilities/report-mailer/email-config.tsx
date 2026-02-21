/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Layout from '@/components/layout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailConfig {
  id: number;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  from_name: string;
  from_email: string;
  use_tls: boolean;
  is_active: boolean;
}

const defaultForm: Omit<EmailConfig, 'id'> = {
  name: '',
  host: '',
  port: 587,
  username: '',
  password: '',
  from_name: '',
  from_email: '',
  use_tls: true,
  is_active: true,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function EmailConfigPage() {
  const [configs, setConfigs] = useState<EmailConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [testEmail, setTestEmail] = useState('');
  const [testingId, setTestingId] = useState<number | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/report-mailer/email-configs', { withCredentials: true });
      setConfigs(res.data.data || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (config: EmailConfig) => {
    setEditId(config.id);
    setForm({
      name: config.name,
      host: config.host,
      port: config.port,
      username: config.username,
      password: '********',
      from_name: config.from_name,
      from_email: config.from_email,
      use_tls: config.use_tls,
      is_active: config.is_active,
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (editId) {
        await api.put(`/report-mailer/email-configs/${editId}`, form, { withCredentials: true });
        setSuccess('Email config berhasil diupdate');
      } else {
        await api.post('/report-mailer/email-configs', form, { withCredentials: true });
        setSuccess('Email config berhasil dibuat');
      }
      setShowModal(false);
      fetchConfigs();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus config "${name}"?`)) return;
    try {
      await api.delete(`/report-mailer/email-configs/${id}`, { withCredentials: true });
      setSuccess('Email config berhasil dihapus');
      fetchConfigs();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Gagal menghapus');
    }
  };

  const openTestModal = (id: number) => {
    setTestingId(id);
    setTestEmail('');
    setError('');
    setShowTestModal(true);
  };

  const handleTest = async () => {
    if (!testingId) return;
    setSaving(true);
    setError('');
    try {
      await api.post(
        `/report-mailer/email-configs/${testingId}/test`,
        { to: testEmail },
        { withCredentials: true }
      );
      setSuccess(`Test email berhasil dikirim ke ${testEmail}`);
      setShowTestModal(false);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Gagal mengirim test email');
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout title="Utilities" subTitle="Report Mailer - Email Config" description="Kelola konfigurasi SMTP untuk pengiriman report">
    <div className="p-6">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Email Config</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola konfigurasi SMTP untuk pengiriman report</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
        >
          + Tambah Config
        </button>
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
        ) : configs.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Belum ada email config</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Nama</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Host / Port</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">From</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">TLS</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">Status</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {configs.map((cfg) => (
                <tr key={cfg.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{cfg.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {cfg.host}:{cfg.port}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{cfg.from_name}</div>
                    <div className="text-gray-400 text-xs">{cfg.from_email}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {cfg.use_tls ? (
                      <span className="text-green-600 text-xs font-medium">TLS</span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        cfg.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {cfg.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openTestModal(cfg.id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Test
                      </button>
                      <button
                        onClick={() => openEdit(cfg)}
                        className="text-xs text-yellow-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cfg.id, cfg.name)}
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

      {/* Modal Form Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-800">
                {editId ? 'Edit Email Config' : 'Tambah Email Config'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Nama Config</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="cth: SMTP Gmail Production"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Host</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="smtp.gmail.com"
                    value={form.host}
                    onChange={(e) => setForm({ ...form, host: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Port</label>
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="587"
                    value={form.port}
                    onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Username</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@domain.com"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Password</label>
                  <input
                    type="password"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={editId ? 'Kosongkan jika tidak diubah' : 'Password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Nama Pengirim</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="WMS Report"
                    value={form.from_name}
                    onChange={(e) => setForm({ ...form, from_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email Pengirim</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="noreply@domain.com"
                    value={form.from_email}
                    onChange={(e) => setForm({ ...form, from_email: e.target.value })}
                  />
                </div>
              </div>

              {/* Toggle TLS & Status */}
              <div className="flex gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setForm({ ...form, use_tls: !form.use_tls })}
                    className={`w-10 h-5 rounded-full transition-colors ${form.use_tls ? 'bg-blue-600' : 'bg-gray-300'} relative`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.use_tls ? 'left-5' : 'left-0.5'}`} />
                  </div>
                  <span className="text-sm text-gray-700">Gunakan TLS</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                    className={`w-10 h-5 rounded-full transition-colors ${form.is_active ? 'bg-blue-600' : 'bg-gray-300'} relative`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? 'left-5' : 'left-0.5'}`} />
                  </div>
                  <span className="text-sm text-gray-700">Aktif</span>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Test Email */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-800">Test Kirim Email</h2>
              <button onClick={() => setShowTestModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="px-6 py-4 space-y-3">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded">{error}</div>
              )}
              <p className="text-sm text-gray-500">Masukkan email tujuan untuk test koneksi SMTP</p>
              <input
                type="email"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Batal
              </button>
              <button
                onClick={handleTest}
                disabled={saving || !testEmail}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {saving ? 'Mengirim...' : 'Kirim Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </Layout>
  );
}