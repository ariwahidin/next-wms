/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import Layout from '@/components/layout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailConfig { id: number; name: string; }
interface Recipient { id: number; email: string; name: string; type: 'TO' | 'CC'; }
interface History { id: number; status: string; message: string; sent_at: string; payload: string; }

interface NotifForm {
  name: string;
  event_key: string;
  description: string;
  email_config_id: number | '';
  email_subject: string;
  email_header: string;
  email_body: string;
  email_footer: string;
  header_color: string;
  is_active: boolean;
}

const PRESET_COLORS = ['#1E3A5F', '#1E40AF', '#0F766E', '#065F46', '#7C3AED', '#B91C1C', '#92400E', '#374151'];

const PLACEHOLDERS = [
  '{{outbound_no}}', '{{shipment_id}}', '{{inbound_no}}', '{{owner_code}}', '{{customer_code}}',
  '{{whs_code}}', '{{complete_time}}', '{{picker_name}}', '{{deliv_to}}',
  '{{driver}}', '{{truck_no}}', '{{awb_no}}', '{{remarks}}', '{{year}}',
];

const defaultForm: NotifForm = {
  name: '', event_key: '', description: '',
  email_config_id: '',
  email_subject: '[WMS] {{outbound_no}} Notification',
  email_header: 'WMS Notification',
  email_body: `Dear Team,\n\n<p>This is an automated notification from the Warehouse Management System.</p>`,
  email_footer: '© {{year}} Warehouse Management System. This is an automated message — please do not reply.',
  header_color: '#1E40AF',
  is_active: true,
};

const formatDate = (d: string) => new Date(d).toLocaleString('id-ID', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationFormPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;
  const isEdit = !!id && id !== 'create';

  const [form, setForm] = useState<NotifForm>(defaultForm);
  const [emailConfigs, setEmailConfigs] = useState<EmailConfig[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [histories, setHistories] = useState<History[]>([]);
  const [activeTab, setActiveTab] = useState<'general' | 'template' | 'recipients' | 'history'>('general');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Recipient form
  const [rcptEmail, setRcptEmail] = useState('');
  const [rcptName, setRcptName] = useState('');
  const [rcptType, setRcptType] = useState<'TO' | 'CC'>('TO');

  // Template active section
  const [tmplSection, setTmplSection] = useState<'subject' | 'header' | 'body' | 'footer'>('body');
  const [showPreview, setShowPreview] = useState(false);

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Load email configs
    api.get('/report-mailer/email-configs', { withCredentials: true })
      .then(r => setEmailConfigs(r.data.data || []));

    if (isEdit) {
      api.get(`/notifications/${id}`, { withCredentials: true }).then(r => {
        const n = r.data.data;
        setForm({
          name: n.name, event_key: n.event_key, description: n.description || '',
          email_config_id: n.email_config_id,
          email_subject: n.email_subject,
          email_header: n.email_header || '',
          email_body: n.email_body || '',
          email_footer: n.email_footer || '',
          header_color: n.header_color || '#1E40AF',
          is_active: n.is_active,
        });
        setRecipients(n.recipients || []);
      });
      api.get(`/notifications/${id}/history?limit=30`, { withCredentials: true })
        .then(r => setHistories(r.data.data || []));
    }
  }, [id]);

  // ─── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (isEdit) {
        await api.put(`/notifications/${id}`, form, { withCredentials: true });
      } else {
        const res = await api.post('/notifications', form, { withCredentials: true });
        router.replace(`/utility/email-notification/${res.data.data.id}/edit`);
      }
      setSuccess('Notifikasi berhasil disimpan');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  // ─── Recipients ────────────────────────────────────────────────────────────

  const handleAddRecipient = async () => {
    if (!rcptEmail) return;
    try {
      const res = await api.post(`/notifications/${id}/recipients`,
        { email: rcptEmail, name: rcptName, type: rcptType },
        { withCredentials: true }
      );
      setRecipients(prev => [...prev, res.data.data]);
      setRcptEmail(''); setRcptName('');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Gagal menambah penerima');
    }
  };

  const handleRemoveRecipient = async (rId: number) => {
    await api.delete(`/notifications/${id}/recipients/${rId}`, { withCredentials: true });
    setRecipients(prev => prev.filter(r => r.id !== rId));
  };

  // ─── Insert Placeholder ────────────────────────────────────────────────────

  const insertPlaceholder = (p: string) => {
    const key = tmplSection === 'subject' ? 'email_subject'
      : tmplSection === 'header' ? 'email_header'
        : tmplSection === 'body' ? 'email_body' : 'email_footer';
    setForm(prev => ({ ...prev, [key]: prev[key] + p }));
  };

  // ─── Preview ───────────────────────────────────────────────────────────────

  const buildPreview = () => `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#F3F4F6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:24px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
<tr><td style="background:${form.header_color};padding:24px 32px;">
  <div style="color:#fff;font-size:18px;font-weight:bold;">${form.email_header}</div>
</td></tr>
<tr><td style="padding:28px 32px;color:#374151;font-size:14px;line-height:1.7;">${form.email_body}</td></tr>
<tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #E5E7EB;"></td></tr>
<tr><td style="padding:16px 32px;color:#9CA3AF;font-size:12px;">${form.email_footer}</td></tr>
</table></td></tr></table>
</body></html>`;

  const tabs = [
    { key: 'general', label: 'General' },
    { key: 'template', label: 'Email Template' },
    { key: 'recipients', label: `Recipients (${recipients.length})` },
    { key: 'history', label: 'History' },
  ] as const;

  const handleRetrigger = async (historyId: number) => {
    if (!confirm('Kirim ulang notifikasi ini dengan data yang sama?')) return;
    try {
      await api.post(
        `/notifications/${id}/history/${historyId}/retrigger`,
        {},
        { withCredentials: true }
      );
      setSuccess('Retrigger dimulai! Cek history dalam beberapa detik.');
      setTimeout(() => {
        api.get(`/notifications/${id}/history?limit=30`, { withCredentials: true })
          .then(r => setHistories(r.data.data || []));
      }, 3000);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Gagal retrigger');
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout title="Utilities" subTitle="Email Notification" description="Kelola notifikasi email otomatis berdasarkan event sistem">
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => router.push('/wms/utilities/email-notification')}
              className="text-sm text-gray-400 hover:text-gray-600 mb-1">← Kembali</button>
            <h1 className="text-xl font-semibold text-gray-800">
              {isEdit ? 'Edit Notifikasi' : 'Tambah Notifikasi'}
            </h1>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-lg disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex justify-between"><span>{error}</span><button onClick={() => setError('')}>✕</button></div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg flex justify-between"><span>{success}</span><button onClick={() => setSuccess('')}>✕</button></div>}

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>{t.label}</button>
            ))}
          </div>

          <div className="p-6">
            {/* ── General ───────────────────────────────────────────────────── */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Nama Notifikasi *</label>
                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="cth: Outbound Completed"
                      value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Event Key *</label>
                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="cth: outbound.completed"
                      value={form.event_key} onChange={e => setForm({ ...form, event_key: e.target.value })} />
                    <p className="text-xs text-gray-400 mt-1">Harus sama persis dengan yang di-pass dari controller</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Deskripsi</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Opsional"
                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email Config *</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.email_config_id}
                    onChange={e => setForm({ ...form, email_config_id: Number(e.target.value) })}>
                    <option value="">-- Pilih Email Config --</option>
                    {emailConfigs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Status Notifikasi</div>
                    <div className="text-xs text-gray-400 mt-0.5">Aktifkan agar notifikasi terkirim saat event terjadi</div>
                  </div>
                  <div onClick={() => setForm({ ...form, is_active: !form.is_active })}
                    className={`w-10 h-5 rounded-full cursor-pointer relative transition-colors ${form.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? 'left-5' : 'left-0.5'}`} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Template ──────────────────────────────────────────────────── */}
            {activeTab === 'template' && (
              <div className="space-y-4">
                {/* Header Color */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Header Color</label>
                  <div className="flex items-center gap-3">
                    {PRESET_COLORS.map(c => (
                      <button key={c} onClick={() => setForm({ ...form, header_color: c })}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${form.header_color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                        style={{ background: c }} />
                    ))}
                    <input type="color" value={form.header_color}
                      onChange={e => setForm({ ...form, header_color: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border border-gray-200 ml-2" />
                    <div className="flex-1 h-8 rounded-lg ml-1" style={{ background: form.header_color }} />
                  </div>
                </div>

                {/* Section tabs */}
                <div className="flex border-b border-gray-200">
                  {(['subject', 'header', 'body', 'footer'] as const).map(s => (
                    <button key={s} onClick={() => setTmplSection(s)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 capitalize transition-colors ${tmplSection === s ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}>{s}</button>
                  ))}
                </div>

                {/* Placeholders */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">Insert placeholder:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PLACEHOLDERS.map(p => (
                      <button key={p} onClick={() => insertPlaceholder(p)}
                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200 font-mono">
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                {tmplSection === 'subject' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email Subject *</label>
                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.email_subject}
                      onChange={e => setForm({ ...form, email_subject: e.target.value })} />
                  </div>
                )}
                {tmplSection === 'header' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Header (HTML diizinkan)</label>
                    <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={4} value={form.email_header}
                      onChange={e => setForm({ ...form, email_header: e.target.value })} />
                  </div>
                )}
                {tmplSection === 'body' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Body (HTML diizinkan)</label>
                    <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={14} value={form.email_body}
                      onChange={e => setForm({ ...form, email_body: e.target.value })} />
                  </div>
                )}
                {tmplSection === 'footer' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Footer (HTML diizinkan)</label>
                    <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={4} value={form.email_footer}
                      onChange={e => setForm({ ...form, email_footer: e.target.value })} />
                  </div>
                )}

                {/* Preview toggle */}
                <button onClick={() => setShowPreview(!showPreview)}
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm px-4 py-2 rounded-lg">
                  {showPreview ? '✕ Tutup Preview' : '👁 Preview Email'}
                </button>

                {showPreview && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
                      Subject: {form.email_subject}
                    </div>
                    <div className="p-3 bg-gray-50">
                      <iframe srcDoc={buildPreview()} className="w-full rounded border border-gray-200"
                        style={{ height: '450px' }} title="Preview" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Recipients ────────────────────────────────────────────────── */}
            {activeTab === 'recipients' && (
              <div className="space-y-4">
                {!isEdit && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm px-4 py-3 rounded-lg">
                    Simpan notifikasi terlebih dahulu sebelum menambahkan penerima.
                  </div>
                )}
                {isEdit && (
                  <>
                    {/* Add form */}
                    <div className="flex gap-2">
                      <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Email *" value={rcptEmail} onChange={e => setRcptEmail(e.target.value)} />
                      <input className="w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nama" value={rcptName} onChange={e => setRcptName(e.target.value)} />
                      <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                        {(['TO', 'CC'] as const).map(t => (
                          <button key={t} onClick={() => setRcptType(t)}
                            className={`px-3 py-2 text-sm font-medium transition-colors ${rcptType === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                            {t}
                          </button>
                        ))}
                      </div>
                      <button onClick={handleAddRecipient}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
                        + Tambah
                      </button>
                    </div>

                    {/* List */}
                    {recipients.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm border border-gray-200 rounded-xl">
                        Belum ada penerima
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        {['TO', 'CC'].map(type => {
                          const list = recipients.filter(r => r.type === type);
                          if (!list.length) return null;
                          return (
                            <div key={type}>
                              <div className={`px-4 py-2 text-xs font-semibold ${type === 'TO' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600'}`}>
                                {type}
                              </div>
                              {list.map(r => (
                                <div key={r.id} className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                                  <div>
                                    <div className="text-sm text-gray-800">{r.email}</div>
                                    {r.name && <div className="text-xs text-gray-400">{r.name}</div>}
                                  </div>
                                  <button onClick={() => handleRemoveRecipient(r.id)}
                                    className="text-xs text-red-500 hover:underline">Hapus</button>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── History ───────────────────────────────────────────────────── */}
            {/* {activeTab === 'history' && (
              <div className="space-y-3">
                {!isEdit ? (
                  <div className="p-6 text-center text-gray-400 text-sm">Simpan notifikasi terlebih dahulu.</div>
                ) : histories.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">Belum ada history pengiriman</div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-gray-600 font-medium">Waktu</th>
                          <th className="text-center px-4 py-3 text-gray-600 font-medium">Status</th>
                          <th className="text-left px-4 py-3 text-gray-600 font-medium">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {histories.map(h => (
                          <tr key={h.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(h.sent_at)}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${h.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {h.status === 'success' ? '✓ Sukses' : '✕ Gagal'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">{h.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )} */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                {!isEdit ? (
                  <div className="p-6 text-center text-gray-400 text-sm">Simpan notifikasi terlebih dahulu.</div>
                ) : histories.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">Belum ada history pengiriman</div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-gray-600 font-medium">Waktu</th>
                          <th className="text-center px-4 py-3 text-gray-600 font-medium">Status</th>
                          <th className="text-left px-4 py-3 text-gray-600 font-medium">Keterangan</th>
                          <th className="text-center px-4 py-3 text-gray-600 font-medium">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {histories.map(h => (
                          <tr key={h.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(h.sent_at)}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${h.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {h.status === 'success' ? '✓ Sukses' : '✕ Gagal'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">{h.message}</td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleRetrigger(h.id)}
                                className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                              >
                                ↺ Retrigger
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}