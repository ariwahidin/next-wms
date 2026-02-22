'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import ScheduleTab from '../components/ScheduleTab';
import HistoryTab from '../components/HistoryTab';
import QueryPreviewButton from '../components/QueryPreviewButton';
import QueryTab from '../components/QueryTab';
import Layout from '@/components/layout';
import EmailTemplateTab from '../components/EmailTemplateTab';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailConfig {
    id: number;
    name: string;
    is_active: boolean;
}

interface Recipient {
    id: number;
    email: string;
    name: string;
    type: 'TO' | 'CC';
}

interface ReportForm {
    name: string;
    description: string;
    query: string;
    email_config_id: number | '';
    excel_title: string;
    excel_subtitle: string;
    is_active: boolean;
}

const defaultForm: ReportForm = {
    name: '',
    description: '',
    query: '',
    email_config_id: '',
    excel_title: '',
    excel_subtitle: '',
    is_active: true,
};

type Tab = 'general' | 'query' | 'recipients' | 'schedule' | 'history' | 'email_template';

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportFormPage() {
    const router = useRouter();
    const params = useParams();
    const reportId = params?.id as string | undefined; // undefined = create mode

    const isEdit = !!reportId;

    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [form, setForm] = useState<ReportForm>(defaultForm);
    const [emailConfigs, setEmailConfigs] = useState<EmailConfig[]>([]);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Recipient form state
    const [recipientForm, setRecipientForm] = useState({ email: '', name: '', type: 'TO' as 'TO' | 'CC' });
    const [addingRecipient, setAddingRecipient] = useState(false);

    const [outputMode, setOutputMode] = useState<'single_file' | 'multi_file'>('single_file');



    // ─── Fetch ──────────────────────────────────────────────────────────────────

    const fetchEmailConfigs = async () => {
        try {
            const res = await api.get('/report-mailer/email-configs', { withCredentials: true });
            setEmailConfigs((res.data.data || []).filter((c: EmailConfig) => c.is_active));
        } catch { }
    };

    const fetchReport = async () => {
        try {
            const res = await api.get(`/report-mailer/reports/${reportId}`, { withCredentials: true });
            const r = res.data.data;
            setForm({
                name: r.name,
                description: r.description,
                query: r.query,
                email_config_id: r.email_config_id,
                excel_title: r.excel_title,
                excel_subtitle: r.excel_subtitle,
                is_active: r.is_active,

            });
            setRecipients(r.recipients || []);
            setOutputMode(r.output_mode || 'single_file');
        } catch (e: any) {
            setError(e.response?.data?.error || 'Gagal memuat report');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmailConfigs();
        if (isEdit) fetchReport();
    }, []);

    // ─── Save Report ────────────────────────────────────────────────────────────

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            if (isEdit) {
                await api.put(`/report-mailer/reports/${reportId}`, form, { withCredentials: true });
                setSuccess('Report berhasil diupdate');
            } else {
                const res = await api.post('/report-mailer/reports', form, { withCredentials: true });
                setSuccess('Report berhasil dibuat');
                // Redirect ke edit page supaya bisa langsung tambah recipient & schedule
                router.replace(`/wms/utilities/report-mailer/${res.data.data.id}/edit`);
                return;
            }
        } catch (e: any) {
            setError(e.response?.data?.error || 'Gagal menyimpan');
        } finally {
            setSaving(false);
        }
    };

    // ─── Recipient ──────────────────────────────────────────────────────────────

    const handleAddRecipient = async () => {
        if (!reportId) return;
        setAddingRecipient(true);
        setError('');
        try {
            const res = await api.post(
                `/report-mailer/reports/${reportId}/recipients`,
                recipientForm,
                { withCredentials: true }
            );
            setRecipients((prev) => [...prev, res.data.data]);
            setRecipientForm({ email: '', name: '', type: 'TO' });
            setSuccess('Recipient berhasil ditambahkan');
        } catch (e: any) {
            setError(e.response?.data?.error || 'Gagal menambahkan recipient');
        } finally {
            setAddingRecipient(false);
        }
    };

    const handleRemoveRecipient = async (recipientId: number, email: string) => {
        if (!confirm(`Hapus ${email} dari daftar penerima?`)) return;
        try {
            await api.delete(
                `/report-mailer/reports/${reportId}/recipients/${recipientId}`,
                { withCredentials: true }
            );
            setRecipients((prev) => prev.filter((r) => r.id !== recipientId));
            setSuccess('Recipient berhasil dihapus');
        } catch (e: any) {
            setError(e.response?.data?.error || 'Gagal menghapus recipient');
        }
    };

    // ─── Render ─────────────────────────────────────────────────────────────────

    if (loading) {
        return <div className="p-8 text-center text-gray-400 text-sm">Memuat data...</div>;
    }

    const tabs: { key: Tab; label: string }[] = [
        { key: 'general', label: 'General' },
        { key: 'query', label: 'Query SQL' },
        { key: 'recipients', label: `Recipients (${recipients.length})` },
        { key: 'email_template', label: 'Email Template' },
        { key: 'schedule', label: 'Schedule' },
        { key: 'history', label: 'History' }
    ];

    const toRecipients = recipients.filter((r) => r.type === 'TO');
    const ccRecipients = recipients.filter((r) => r.type === 'CC');

    return (
        <Layout title="Utilities" subTitle="Report Mailer Config" description="Kelola report otomatis yang dikirim via email">
            <div className="p-2 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <button
                            onClick={() => router.push('/wms/utilities/report-mailer')}
                            className="text-sm text-gray-400 hover:text-gray-600 mb-1 flex items-center gap-1"
                        >
                            ← Kembali
                        </button>
                        <h1 className="text-xl font-semibold text-gray-800">
                            {isEdit ? 'Edit Report' : 'Tambah Report'}
                        </h1>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-lg disabled:opacity-50"
                    >
                        {saving ? 'Menyimpan...' : 'Simpan'}
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

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <div className="flex gap-6">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab: General */}
                {activeTab === 'general' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">Nama Report *</label>
                                <input
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="cth: Daily Stock Report"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">Deskripsi</label>
                                <input
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Keterangan singkat report ini"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">Email Config *</label>
                                <select
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={form.email_config_id}
                                    onChange={(e) => setForm({ ...form, email_config_id: Number(e.target.value) })}
                                >
                                    <option value="">-- Pilih Email Config --</option>
                                    {emailConfigs.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Excel Title *</label>
                                <input
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="cth: LAPORAN STOK HARIAN"
                                    value={form.excel_title}
                                    onChange={(e) => setForm({ ...form, excel_title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Excel Subtitle</label>
                                <input
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="cth: PT. Maju Bersama Warehouse"
                                    value={form.excel_subtitle}
                                    onChange={(e) => setForm({ ...form, excel_subtitle: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Toggle aktif */}
                        <div className="pt-2">
                            <label className="flex items-center gap-2 cursor-pointer w-fit">
                                <div
                                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                                    className={`w-10 h-5 rounded-full transition-colors ${form.is_active ? 'bg-blue-600' : 'bg-gray-300'} relative`}
                                >
                                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? 'left-5' : 'left-0.5'}`} />
                                </div>
                                <span className="text-sm text-gray-700">Report Aktif</span>
                            </label>
                        </div>

                        {/* Preview format Excel */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-400 mb-2">Preview format Excel output:</p>
                            <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-600 space-y-1">
                                <div><span className="text-gray-400">A1</span> {form.excel_title || '(Excel Title)'}</div>
                                <div><span className="text-gray-400">A2</span> {form.excel_subtitle || '(Excel Subtitle)'}</div>
                                <div><span className="text-gray-400">A3</span> Generated: {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                                <div><span className="text-gray-400">A4</span> —</div>
                                <div className="bg-blue-100 px-1 rounded"><span className="text-gray-400">A5</span> Kolom 1 | Kolom 2 | Kolom 3 | ...</div>
                                <div><span className="text-gray-400">A6</span> data row 1...</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab: Query */}
                {/* {activeTab === 'query' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">SQL Query *</label>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Query dijalankan langsung ke database. Hasil kolom akan menjadi header Excel.
                            </p>
                        </div>
                        <QueryPreviewButton query={form.query} />
                    </div>
                    <textarea
                        className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={16}
                        placeholder={`-- Contoh query:\nSELECT \n  item_code,\n  item_name,\n  qty,\n  location\nFROM wms_inventory\nWHERE is_active = 1\nORDER BY item_code`}
                        value={form.query}
                        onChange={(e) => setForm({ ...form, query: e.target.value })}
                    />
                    <p className="text-xs text-gray-400 mt-2">
                        💡 Tip: nama kolom di SELECT akan otomatis jadi header baris di Excel.
                    </p>
                </div>
            )} */}

                {/* Tab: Recipients */}
                {activeTab === 'recipients' && (
                    <div className="space-y-4">
                        {!isEdit && (
                            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm px-4 py-3 rounded-lg">
                                Simpan report terlebih dahulu sebelum menambahkan recipient.
                            </div>
                        )}

                        {isEdit && (
                            <>
                                {/* Form tambah recipient */}
                                <div className="bg-white rounded-xl border border-gray-200 p-5">
                                    <h3 className="text-sm font-medium text-gray-700 mb-4">Tambah Penerima</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Email *</label>
                                            <input
                                                type="email"
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="email@domain.com"
                                                value={recipientForm.email}
                                                onChange={(e) => setRecipientForm({ ...recipientForm, email: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Nama</label>
                                            <input
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Nama penerima (opsional)"
                                                value={recipientForm.name}
                                                onChange={(e) => setRecipientForm({ ...recipientForm, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Tipe *</label>
                                            <div className="flex gap-2 mt-1">
                                                {(['TO', 'CC'] as const).map((t) => (
                                                    <button
                                                        key={t}
                                                        onClick={() => setRecipientForm({ ...recipientForm, type: t })}
                                                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${recipientForm.type === t
                                                            ? t === 'TO'
                                                                ? 'bg-blue-600 text-white border-blue-600'
                                                                : 'bg-purple-600 text-white border-purple-600'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            onClick={handleAddRecipient}
                                            disabled={addingRecipient || !recipientForm.email}
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
                                        >
                                            {addingRecipient ? 'Menambahkan...' : '+ Tambah'}
                                        </button>
                                    </div>
                                </div>

                                {/* List TO */}
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <div className="px-5 py-3 bg-blue-50 border-b border-gray-200">
                                        <span className="text-sm font-medium text-blue-700">TO ({toRecipients.length})</span>
                                    </div>
                                    {toRecipients.length === 0 ? (
                                        <div className="px-5 py-4 text-sm text-gray-400">Belum ada penerima TO</div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {toRecipients.map((r) => (
                                                <div key={r.id} className="flex items-center justify-between px-5 py-3">
                                                    <div>
                                                        <div className="text-sm text-gray-800">{r.email}</div>
                                                        {r.name && <div className="text-xs text-gray-400">{r.name}</div>}
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveRecipient(r.id, r.email)}
                                                        className="text-xs text-red-500 hover:underline"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* List CC */}
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <div className="px-5 py-3 bg-purple-50 border-b border-gray-200">
                                        <span className="text-sm font-medium text-purple-700">CC ({ccRecipients.length})</span>
                                    </div>
                                    {ccRecipients.length === 0 ? (
                                        <div className="px-5 py-4 text-sm text-gray-400">Belum ada penerima CC</div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {ccRecipients.map((r) => (
                                                <div key={r.id} className="flex items-center justify-between px-5 py-3">
                                                    <div>
                                                        <div className="text-sm text-gray-800">{r.email}</div>
                                                        {r.name && <div className="text-xs text-gray-400">{r.name}</div>}
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveRecipient(r.id, r.email)}
                                                        className="text-xs text-red-500 hover:underline"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'email_template' && isEdit && (
                    <EmailTemplateTab
                        reportId={Number(reportId)}
                        reportName={form.name}
                        description={form.description}
                    />
                )}

                {activeTab === 'schedule' && isEdit && (
                    <ScheduleTab reportId={Number(reportId)} />
                )}

                {activeTab === 'history' && isEdit && (
                    <HistoryTab reportId={Number(reportId)} />
                )}

                {activeTab === 'query' && isEdit && (
                    <QueryTab
                        reportId={Number(reportId)}
                        outputMode={outputMode}
                        onOutputModeChange={setOutputMode}
                    />
                )}
            </div>
        </Layout>
    );
}