/* eslint-disable @typescript-eslint/no-unused-vars */
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
interface History {
    id: number; status: string; message: string;
    sent_at: string; channel_type: string; triggered_by: string; file_name: string;
}
interface Connection {
    host: string; port: number; username: string; password: string; remote_path: string;
    url: string; method: string; headers: string; auth_type: string; auth_value: string;
    timeout_sec: number; body_template: string; output_path: string;
    spreadsheet_id: string;
    sheet_name: string;
    credentials_json: string;
    append_mode: string;
    header_row: boolean;
    key_column: string;
    schedule_mode: string; // 'upsert' | 'overwrite' | 'append' | 'new_sheet'
}

interface IntegrationForm {
    name: string; event_key: string; description: string;
    channel_type: string; file_format: string; source_type: string;
    query: string; filename_pattern: string; timing: string;
    schedule_freq: string; schedule_hour: number; schedule_minute: number;
    schedule_day_of_week: number | null; schedule_day_of_month: number | null;
    //   email_config_id: number | ''; 
    email_config_id: number | null;
    notify_on_success: boolean; notify_on_failure: boolean;
    notify_email_subject: string; notify_email_body: string; is_active: boolean;
    direction: string;       // 'outbound' | 'inbound'
    action: string;          // 'create_outbound'
    source_path: string;     // path folder/remote untuk pull
    archive_path: string;    // file dipindah ke sini kalau sukses
    error_path: string;      // file dipindah ke sini kalau gagal
    column_mapping: string;  // JSON string hasil column mapping
}

const defaultForm: IntegrationForm = {
    name: '', event_key: '', description: '',
    channel_type: 'sftp', file_format: 'csv', source_type: 'event',
    query: '', filename_pattern: '', timing: 'realtime',
    schedule_freq: 'daily', schedule_hour: 8, schedule_minute: 0,
    schedule_day_of_week: null, schedule_day_of_month: null,
    // email_config_id: '', 
    email_config_id: null,
    notify_on_success: false, notify_on_failure: true,
    notify_email_subject: '', notify_email_body: '', is_active: true,
    direction: 'outbound',
    action: 'create_outbound',
    source_path: '',
    archive_path: '',
    error_path: '',
    column_mapping: '',
};

const defaultConn: Connection = {
    host: '', port: 0, username: '', password: '', remote_path: '',
    url: '', method: 'POST', headers: '{}', auth_type: 'none', auth_value: '',
    timeout_sec: 30, body_template: '', output_path: '',
    spreadsheet_id: '',
    sheet_name: 'Sheet1',
    credentials_json: '',
    append_mode: 'append',
    header_row: true,
    key_column: '',
    schedule_mode: 'upsert'
};

const formatDate = (d: string) => new Date(d).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function IntegrationFormPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string | undefined;
    const isEdit = !!id && id !== 'create';

    const [form, setForm] = useState<IntegrationForm>(defaultForm);
    const [conn, setConn] = useState<Connection>(defaultConn);
    const [emailConfigs, setEmailConfigs] = useState<EmailConfig[]>([]);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [histories, setHistories] = useState<History[]>([]);
    const [activeTab, setActiveTab] = useState<'general' | 'mapping' | 'connection' | 'notification' | 'recipients' | 'history'>('general');
    const [saving, setSaving] = useState(false);
    const [savingConn, setSavingConn] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [testRunning, setTestRunning] = useState(false);

    // Recipient
    const [rcptEmail, setRcptEmail] = useState('');
    const [rcptName, setRcptName] = useState('');
    const [rcptType, setRcptType] = useState<'TO' | 'CC'>('TO');

    const [fileHeaders, setFileHeaders] = useState<string[]>([]);
    const [wmsFields, setWmsFields] = useState<{ key: string; label: string }[]>([]);
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
    const [detectingHeaders, setDetectingHeaders] = useState(false);
    const [pulling, setPulling] = useState(false);

    // ─── Fetch ─────────────────────────────────────────────────────────────────

    useEffect(() => {
        api.get('/report-mailer/email-configs', { withCredentials: true })
            .then(r => setEmailConfigs(r.data.data || []));

        if (isEdit) {
            api.get(`/integrations/${id}`, { withCredentials: true }).then(r => {
                const d = r.data.data;
                setForm({
                    name: d.name, event_key: d.event_key, description: d.description || '',
                    channel_type: d.channel_type, file_format: d.file_format || 'csv',
                    source_type: d.source_type, query: d.query || '',
                    filename_pattern: d.filename_pattern || '', timing: d.timing,
                    schedule_freq: d.schedule_freq || 'daily',
                    schedule_hour: d.schedule_hour || 8, schedule_minute: d.schedule_minute || 0,
                    schedule_day_of_week: d.schedule_day_of_week || null,
                    schedule_day_of_month: d.schedule_day_of_month || null,
                    email_config_id: d.email_config_id || null,
                    notify_on_success: d.notify_on_success, notify_on_failure: d.notify_on_failure,
                    notify_email_subject: d.notify_email_subject || '',
                    notify_email_body: d.notify_email_body || '', is_active: d.is_active,
                    direction: d.direction || 'outbound',
                    action: d.action || 'create_outbound',
                    source_path: d.source_path || '',
                    archive_path: d.archive_path || '',
                    error_path: d.error_path || '',
                    column_mapping: d.column_mapping || '',
                });
                if (d.connection) setConn({ ...defaultConn, ...d.connection });
                setRecipients(d.recipients || []);
            });
            api.get(`/integrations/${id}/history?limit=30`, { withCredentials: true })
                .then(r => setHistories(r.data.data || []));
        }
    }, [id]);

    // ─── Save General ──────────────────────────────────────────────────────────

    const handleSave = async () => {
        setSaving(true); setError('');
        try {
            if (isEdit) {
                await api.put(`/integrations/${id}`, form, { withCredentials: true });
                setSuccess('Integrasi berhasil disimpan');
            } else {
                const res = await api.post('/integrations', form, { withCredentials: true });
                router.replace(`/wms/utilities/integration/${res.data.data.id}/edit`);
            }
        } catch (e: any) {
            setError(e.response?.data?.error || 'Gagal menyimpan');
        } finally {
            setSaving(false);
        }
    };

    // ─── Save Connection ───────────────────────────────────────────────────────

    const handleSaveConn = async () => {
        setSavingConn(true); setError('');
        try {
            await api.put(`/integrations/${id}/connection`, conn, { withCredentials: true });
            setSuccess('Connection berhasil disimpan');
        } catch (e: any) {
            setError(e.response?.data?.error || 'Gagal menyimpan connection');
        } finally {
            setSavingConn(false);
        }
    };

    // ─── Recipients ────────────────────────────────────────────────────────────

    const handleAddRecipient = async () => {
        if (!rcptEmail) return;
        try {
            const res = await api.post(`/integrations/${id}/recipients`,
                { email: rcptEmail, name: rcptName, type: rcptType }, { withCredentials: true });
            setRecipients(prev => [...prev, res.data.data]);
            setRcptEmail(''); setRcptName('');
        } catch (e: any) {
            setError(e.response?.data?.error || 'Gagal menambah penerima');
        }
    };

    const handleRemoveRecipient = async (rId: number) => {
        await api.delete(`/integrations/${id}/recipients/${rId}`, { withCredentials: true });
        setRecipients(prev => prev.filter(r => r.id !== rId));
    };

    // ─── Test Run ──────────────────────────────────────────────────────────────

    const handleTestRun = async () => {
        setTestRunning(true);
        try {
            await api.post(`/integrations/${id}/test-run`, {}, { withCredentials: true });
            setSuccess('Test run dimulai! Cek tab History dalam beberapa detik.');
            setTimeout(() => {
                api.get(`/integrations/${id}/history?limit=30`, { withCredentials: true })
                    .then(r => setHistories(r.data.data || []));
            }, 3000);
        } catch (e: any) {
            setError(e.response?.data?.error || 'Gagal test run');
        } finally {
            setTestRunning(false);
        }
    };

    // ─── Render Helper ─────────────────────────────────────────────────────────

    const isFileChannel = ['sftp', 'ftp', 'file'].includes(form.channel_type);
    const isAPIChannel = form.channel_type === 'api';

    const tabs = [
        { key: 'general', label: 'General' },
        { key: 'connection', label: 'Connection' },
        ...(form.direction === 'inbound' ? [{ key: 'mapping', label: 'Column Mapping' }] : []),
        { key: 'notification', label: 'Notifikasi Email' },
        { key: 'recipients', label: `Recipients (${recipients.length})` },
        { key: 'history', label: 'History' },
    ] as const;


    const handleRetrigger = async (historyId: number) => {
        if (!confirm('Jalankan ulang integrasi ini dengan data yang sama?')) return;
        try {
            await api.post(
                `/integrations/${id}/history/${historyId}/retrigger`,
                {},
                { withCredentials: true }
            );
            setSuccess('Retrigger dimulai! Cek history dalam beberapa detik.');
            // Refresh history setelah 3 detik
            setTimeout(() => {
                api.get(`/integrations/${id}/history?limit=30`, { withCredentials: true })
                    .then(r => setHistories(r.data.data || []));
            }, 3000);
        } catch (e: any) {
            setError(e.response?.data?.error || 'Gagal retrigger');
        }
    };


    const handleDetectHeaders = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setDetectingHeaders(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.post(`/integrations/${id}/detect-headers`, formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setFileHeaders(res.data.headers || []);
            setWmsFields(res.data.wms_fields || []);
            // Load mapping yang sudah tersimpan
            if (form.column_mapping) {
                try { setColumnMapping(JSON.parse(form.column_mapping)); } catch { }
            }
        } catch (e: any) {
            setError(e.response?.data?.error || 'Gagal detect headers');
        } finally {
            setDetectingHeaders(false);
        }
    };

    const handleSaveMapping = async () => {
        const mappingJson = JSON.stringify(columnMapping);
        const updated = { ...form, column_mapping: mappingJson };
        setForm(updated);
        try {
            await api.put(`/integrations/${id}`, updated, { withCredentials: true });
            setSuccess('Column mapping berhasil disimpan');
        } catch (e: any) {
            setError(e.response?.data?.error || 'Gagal simpan mapping');
        }
    };

    const handleManualPull = async () => {
        if (!confirm('Jalankan pull sekarang?')) return;
        setPulling(true);
        try {
            await api.post(`/integrations/${id}/pull`, {}, { withCredentials: true });
            setSuccess('Pull dimulai! Cek history untuk hasilnya.');
            setTimeout(() => {
                api.get(`/integrations/${id}/history?limit=30`, { withCredentials: true })
                    .then(r => setHistories(r.data.data || []));
            }, 3000);
        } catch (e: any) {
            setError(e.response?.data?.error || 'Gagal pull');
        } finally {
            setPulling(false);
        }
    };

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
        <Layout title="Integration Hub" subTitle={isEdit ? 'Edit Integrasi' : 'Tambah Integrasi'}>
            <div className="p-4 max-w-6xl mx-auto space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <button onClick={() => router.push('/wms/utilities/integration')}
                            className="text-sm text-gray-400 hover:text-gray-600 mb-1">← Kembali</button>
                        <h1 className="text-xl font-semibold text-gray-800">
                            {isEdit ? 'Edit Integrasi' : 'Tambah Integrasi'}
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        {isEdit && (
                            <button onClick={handleTestRun} disabled={testRunning}
                                className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm px-4 py-2 rounded-lg disabled:opacity-50">
                                {testRunning ? 'Running...' : '▶ Test Run'}
                            </button>
                        )}
                        <button onClick={handleSave} disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-lg disabled:opacity-50">
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex justify-between"><span>{error}</span><button onClick={() => setError('')}>✕</button></div>}
                {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg flex justify-between"><span>{success}</span><button onClick={() => setSuccess('')}>✕</button></div>}

                {/* Tabs */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="flex border-b border-gray-200 overflow-x-auto">
                        {tabs.map(t => (
                            <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                                className={`px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}>{t.label}</button>
                        ))}
                    </div>

                    <div className="p-6">

                        {/* ── General ───────────────────────────────────────────────────── */}
                        {activeTab === 'general' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Nama Integrasi *</label>
                                        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="cth: SAP Outbound Interface" value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Event Key *</label>
                                        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="cth: outbound.completed" value={form.event_key}
                                            onChange={e => setForm({ ...form, event_key: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Deskripsi</label>
                                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Opsional" value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })} />
                                </div>

                                {/* Channel Type */}
                                <div>
                                    <label className="block text-xs text-gray-500 mb-2">Channel Type *</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { key: 'sftp', label: 'SFTP', icon: '📡' },
                                            { key: 'ftp', label: 'FTP', icon: '📂' },
                                            { key: 'api', label: 'REST API', icon: '🔗' },
                                            { key: 'file', label: 'File', icon: '💾' },
                                            { key: 'google_sheets', label: 'Google Sheets', icon: '📊' },
                                        ].map(ch => (
                                            <button key={ch.key} onClick={() => setForm({ ...form, channel_type: ch.key })}
                                                className={`border rounded-xl p-3 text-center transition-colors ${form.channel_type === ch.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                                                    }`}>
                                                <div className="text-xl mb-1">{ch.icon}</div>
                                                <div className={`text-xs font-medium ${form.channel_type === ch.key ? 'text-blue-700' : 'text-gray-600'}`}>
                                                    {ch.label}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>


                                {/* Direction */}
                                <div>
                                    <label className="block text-xs text-gray-500 mb-2">Direction *</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { key: 'outbound', label: '↑ Outbound', desc: 'WMS kirim data ke sistem eksternal' },
                                            { key: 'inbound', label: '↓ Inbound', desc: 'WMS terima/ambil data dari sistem eksternal' },
                                        ].map(d => (
                                            <button key={d.key} onClick={() => setForm({ ...form, direction: d.key })}
                                                className={`border rounded-xl p-4 text-left transition-colors ${form.direction === d.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                                                    }`}>
                                                <div className={`text-sm font-medium ${form.direction === d.key ? 'text-blue-700' : 'text-gray-700'}`}>{d.label}</div>
                                                <div className="text-xs text-gray-400 mt-1">{d.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Inbound Config (hanya tampil kalau direction = inbound) */}
                                {form.direction === 'inbound' && (
                                    <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-4 space-y-3">
                                        <div className="text-xs font-semibold text-blue-700 mb-2">Inbound Configuration</div>

                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Action</label>
                                            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={form.action}
                                                onChange={e => setForm({ ...form, action: e.target.value })}>
                                                <option value="create_outbound">Create Outbound</option>
                                            </select>
                                            <p className="text-xs text-gray-400 mt-1">Aksi yang dilakukan setelah data berhasil dibaca</p>
                                        </div>

                                        {/* Source Path (untuk SFTP/FTP/File) */}
                                        {form.channel_type !== 'api' && (
                                            <>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Source Path</label>
                                                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="/incoming/orders" value={form.source_path || ''}
                                                        onChange={e => setForm({ ...form, source_path: e.target.value })} />
                                                    <p className="text-xs text-gray-400 mt-1">Folder/path tempat WMS membaca file baru</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Archive Path</label>
                                                        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="/incoming/done" value={form.archive_path || ''}
                                                            onChange={e => setForm({ ...form, archive_path: e.target.value })} />
                                                        <p className="text-xs text-gray-400 mt-1">File dipindah ke sini jika sukses</p>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Error Path</label>
                                                        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="/incoming/error" value={form.error_path || ''}
                                                            onChange={e => setForm({ ...form, error_path: e.target.value })} />
                                                        <p className="text-xs text-gray-400 mt-1">File dipindah ke sini jika gagal</p>
                                                    </div>
                                                </div>
                                                {/* Manual Pull Button */}
                                                {isEdit && (
                                                    <button onClick={handleManualPull} disabled={pulling}
                                                        className="w-full border border-blue-300 bg-white hover:bg-blue-50 text-blue-700 text-sm py-2 rounded-lg disabled:opacity-50 font-medium">
                                                        {pulling ? '⏳ Pulling...' : '⬇ Jalankan Pull Sekarang'}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* File Format (hanya untuk non-API) */}
                                {isFileChannel && (
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-2">Format File *</label>
                                        <div className="flex gap-2">
                                            {['csv', 'excel', 'json', 'txt'].map(fmt => (
                                                <button key={fmt} onClick={() => setForm({ ...form, file_format: fmt })}
                                                    className={`px-4 py-2 rounded-lg text-sm border font-medium transition-colors ${form.file_format === fmt ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                        }`}>{fmt.toUpperCase()}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Source Type */}
                                <div>
                                    <label className="block text-xs text-gray-500 mb-2">Sumber Data *</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { key: 'event', label: 'Data Event', desc: 'Pakai field dari event (outbound_no, customer_code, dll)' },
                                            { key: 'query', label: 'SQL Query', desc: 'Jalankan query SQL ke database' },
                                        ].map(s => (
                                            <button key={s.key} onClick={() => setForm({ ...form, source_type: s.key })}
                                                className={`border rounded-xl p-4 text-left transition-colors ${form.source_type === s.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                                                    }`}>
                                                <div className={`text-sm font-medium ${form.source_type === s.key ? 'text-blue-700' : 'text-gray-700'}`}>{s.label}</div>
                                                <div className="text-xs text-gray-400 mt-1">{s.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Query (hanya kalau source_type = query) */}
                                {form.source_type === 'query' && (
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">SQL Query *</label>
                                        <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                            rows={8} placeholder="SELECT ..." value={form.query}
                                            onChange={e => setForm({ ...form, query: e.target.value })} />
                                    </div>
                                )}

                                {/* Filename Pattern (hanya untuk non-API) */}
                                {isFileChannel && (
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Filename Pattern</label>
                                        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="cth: outbound_{{outbound_no}}_{{date}}" value={form.filename_pattern}
                                            onChange={e => setForm({ ...form, filename_pattern: e.target.value })} />
                                        <p className="text-xs text-gray-400 mt-1">
                                            Placeholder: <span className="font-mono">{'{{outbound_no}}'}</span>, <span className="font-mono">{'{{date}}'}</span>, <span className="font-mono">{'{{datetime}}'}</span>
                                        </p>
                                    </div>
                                )}

                                {/* Timing */}
                                <div>
                                    <label className="block text-xs text-gray-500 mb-2">Timing *</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { key: 'realtime', label: 'Realtime', desc: 'Langsung saat event terjadi' },
                                            { key: 'scheduled', label: 'Scheduled', desc: 'Dikirim berkala sesuai jadwal' },
                                        ].map(t => (
                                            <button key={t.key} onClick={() => setForm({ ...form, timing: t.key })}
                                                className={`border rounded-xl p-4 text-left transition-colors ${form.timing === t.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                                                    }`}>
                                                <div className={`text-sm font-medium ${form.timing === t.key ? 'text-blue-700' : 'text-gray-700'}`}>{t.label}</div>
                                                <div className="text-xs text-gray-400 mt-1">{t.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Schedule Config */}
                                {form.timing === 'scheduled' && (
                                    <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Frekuensi</label>
                                                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={form.schedule_freq}
                                                    onChange={e => setForm({ ...form, schedule_freq: e.target.value })}>
                                                    <option value="daily">Daily</option>
                                                    <option value="weekly">Weekly</option>
                                                    <option value="monthly">Monthly</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Jam</label>
                                                <input type="number" min={0} max={23}
                                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={form.schedule_hour}
                                                    onChange={e => setForm({ ...form, schedule_hour: Number(e.target.value) })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Menit</label>
                                                <input type="number" min={0} max={59}
                                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={form.schedule_minute}
                                                    onChange={e => setForm({ ...form, schedule_minute: Number(e.target.value) })} />
                                            </div>
                                        </div>
                                        {form.schedule_freq === 'weekly' && (
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Hari (0=Minggu, 6=Sabtu)</label>
                                                <input type="number" min={0} max={6}
                                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={form.schedule_day_of_week ?? 1}
                                                    onChange={e => setForm({ ...form, schedule_day_of_week: Number(e.target.value) })} />
                                            </div>
                                        )}
                                        {form.schedule_freq === 'monthly' && (
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Tanggal (1–28)</label>
                                                <input type="number" min={1} max={28}
                                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={form.schedule_day_of_month ?? 1}
                                                    onChange={e => setForm({ ...form, schedule_day_of_month: Number(e.target.value) })} />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Toggle Aktif */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <div>
                                        <div className="text-sm font-medium text-gray-700">Status Integrasi</div>
                                        <div className="text-xs text-gray-400 mt-0.5">Aktifkan agar integrasi berjalan saat event terjadi</div>
                                    </div>
                                    <div onClick={() => setForm({ ...form, is_active: !form.is_active })}
                                        className={`w-10 h-5 rounded-full cursor-pointer relative transition-colors ${form.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? 'left-5' : 'left-0.5'}`} />
                                    </div>
                                </div>
                            </div>
                        )}


                        {activeTab === 'mapping' && (
                            <div className="space-y-4">
                                {!isEdit ? (
                                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm px-4 py-3 rounded-lg">
                                        Simpan integrasi terlebih dahulu.
                                    </div>
                                ) : (
                                    <>
                                        {/* Upload sample file untuk auto-detect */}
                                        <div className="border border-dashed border-gray-300 rounded-xl p-5 text-center space-y-3">
                                            <div className="text-gray-500 text-sm">Upload sample file untuk auto-detect kolom</div>
                                            <input type="file" accept=".csv,.xlsx,.xls,.json,.xml,.txt"
                                                onChange={handleDetectHeaders}
                                                className="hidden" id="sample-file" />
                                            <label htmlFor="sample-file"
                                                className="cursor-pointer inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded-lg">
                                                {detectingHeaders ? '⏳ Mendeteksi...' : '📁 Pilih File Sample'}
                                            </label>
                                            {fileHeaders.length > 0 && (
                                                <div className="text-xs text-green-600 font-medium">
                                                    ✓ Terdeteksi {fileHeaders.length} kolom dari file
                                                </div>
                                            )}
                                        </div>

                                        {/* Column Mapping Table */}
                                        {wmsFields.length > 0 && (
                                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-600">
                                                        <div>WMS Field</div>
                                                        <div>Kolom di File</div>
                                                    </div>
                                                </div>
                                                <div className="divide-y divide-gray-100">
                                                    {wmsFields.map(field => (
                                                        <div key={field.key} className="px-4 py-3 grid grid-cols-2 gap-4 items-center">
                                                            <div>
                                                                <div className="text-sm text-gray-700">{field.label}</div>
                                                                <div className="text-xs font-mono text-gray-400">{field.key}</div>
                                                            </div>
                                                            <select
                                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                value={columnMapping[field.key] || ''}
                                                                onChange={e => {
                                                                    const newMapping = { ...columnMapping };
                                                                    if (e.target.value) {
                                                                        newMapping[field.key] = e.target.value;
                                                                    } else {
                                                                        delete newMapping[field.key];
                                                                    }
                                                                    setColumnMapping(newMapping);
                                                                }}>
                                                                <option value="">-- Tidak di-map --</option>
                                                                {fileHeaders.map(h => (
                                                                    <option key={h} value={h}>{h}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Simpan mapping */}
                                        {wmsFields.length > 0 && (
                                            <button onClick={handleSaveMapping}
                                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-lg">
                                                Simpan Column Mapping
                                            </button>
                                        )}

                                        {/* Tampil JSON mapping yang tersimpan */}
                                        {form.column_mapping && (
                                            <div>
                                                <div className="text-xs text-gray-500 mb-1">Mapping tersimpan:</div>
                                                <pre className="text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-auto">
                                                    {JSON.stringify(JSON.parse(form.column_mapping || '{}'), null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* ── Connection ─────────────────────────────────────────────────── */}
                        {activeTab === 'connection' && (
                            <div className="space-y-4">
                                {!isEdit ? (
                                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm px-4 py-3 rounded-lg">
                                        Simpan integrasi terlebih dahulu sebelum mengisi connection.
                                    </div>
                                ) : (
                                    <>
                                        {/* SFTP / FTP */}
                                        {(form.channel_type === 'sftp' || form.channel_type === 'ftp') && (
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="col-span-2">
                                                        <label className="block text-xs text-gray-500 mb-1">Host *</label>
                                                        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="sftp.example.com" value={conn.host}
                                                            onChange={e => setConn({ ...conn, host: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Port</label>
                                                        <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder={form.channel_type === 'sftp' ? '22' : '21'} value={conn.port || ''}
                                                            onChange={e => setConn({ ...conn, port: Number(e.target.value) })} />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Username *</label>
                                                        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            value={conn.username} onChange={e => setConn({ ...conn, username: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Password *</label>
                                                        <input type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            value={conn.password} onChange={e => setConn({ ...conn, password: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Remote Path</label>
                                                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="/upload/wms" value={conn.remote_path}
                                                        onChange={e => setConn({ ...conn, remote_path: e.target.value })} />
                                                </div>
                                            </div>
                                        )}

                                        {/* REST API */}
                                        {form.channel_type === 'api' && (
                                            <div className="space-y-3">
                                                <div className="flex gap-2">
                                                    <div className="w-28">
                                                        <label className="block text-xs text-gray-500 mb-1">Method</label>
                                                        <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            value={conn.method} onChange={e => setConn({ ...conn, method: e.target.value })}>
                                                            {['POST', 'PUT', 'PATCH', 'GET'].map(m => <option key={m}>{m}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-xs text-gray-500 mb-1">URL *</label>
                                                        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="https://api.example.com/endpoint" value={conn.url}
                                                            onChange={e => setConn({ ...conn, url: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Auth Type</label>
                                                        <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            value={conn.auth_type} onChange={e => setConn({ ...conn, auth_type: e.target.value })}>
                                                            <option value="none">None</option>
                                                            <option value="bearer">Bearer Token</option>
                                                            <option value="basic">Basic Auth</option>
                                                            <option value="api_key">API Key</option>
                                                        </select>
                                                    </div>
                                                    {conn.auth_type !== 'none' && (
                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">
                                                                {conn.auth_type === 'basic' ? 'user:password' : conn.auth_type === 'bearer' ? 'Token' : 'API Key'}
                                                            </label>
                                                            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                value={conn.auth_value} onChange={e => setConn({ ...conn, auth_value: e.target.value })} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Custom Headers (JSON)</label>
                                                    <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                        rows={3} placeholder={'{"Content-Type": "application/json"}'}
                                                        value={conn.headers} onChange={e => setConn({ ...conn, headers: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Body Template (JSON, support placeholder)</label>
                                                    <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                        rows={6} placeholder={'{"do_number": "{{outbound_no}}", "status": "COMPLETED"}'}
                                                        value={conn.body_template} onChange={e => setConn({ ...conn, body_template: e.target.value })} />
                                                    <p className="text-xs text-gray-400 mt-1">Kosongkan untuk kirim seluruh event data sebagai JSON</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Timeout (detik)</label>
                                                    <input type="number" className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        value={conn.timeout_sec} onChange={e => setConn({ ...conn, timeout_sec: Number(e.target.value) })} />
                                                </div>
                                            </div>
                                        )}

                                        {/* File Output */}
                                        {form.channel_type === 'file' && (
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Output Path *</label>
                                                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="/shared/wms/outbound" value={conn.output_path}
                                                    onChange={e => setConn({ ...conn, output_path: e.target.value })} />
                                                <p className="text-xs text-gray-400 mt-1">Path direktori tujuan di server</p>
                                            </div>
                                        )}

                                        {form.channel_type === 'google_sheets' && (
                                            <div className="space-y-4">
                                                {/* Spreadsheet ID */}
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Spreadsheet ID *</label>
                                                    <input
                                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                                                        value={conn.spreadsheet_id || ''}
                                                        onChange={e => setConn({ ...conn, spreadsheet_id: e.target.value })}
                                                    />
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Ambil dari URL: docs.google.com/spreadsheets/d/<span className="font-mono text-blue-600">ID_INI</span>/edit
                                                    </p>
                                                </div>

                                                {/* Sheet Name */}
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Sheet Name</label>
                                                    <input
                                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Sheet1"
                                                        value={conn.sheet_name || ''}
                                                        onChange={e => setConn({ ...conn, sheet_name: e.target.value })}
                                                    />
                                                    <p className="text-xs text-gray-400 mt-1">Nama tab sheet tujuan (default: Sheet1)</p>
                                                </div>

                                                {/* Key Column */}
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Key Column</label>
                                                    <input
                                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="SPK NO"
                                                        value={conn.key_column || ''}
                                                        onChange={e => setConn({ ...conn, key_column: e.target.value })}
                                                    />
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Nama kolom di sheet yang dipakai sebagai key untuk update/upsert.
                                                    </p>
                                                </div>

                                                {form.channel_type === 'google_sheets' && form.timing === 'scheduled' && (
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-2">Schedule Mode</label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {[
                                                                {
                                                                    key: 'overwrite',
                                                                    label: '↺ Overwrite',
                                                                    desc: 'Hapus semua data lama, tulis ulang dari awal',
                                                                    icon: '↺',
                                                                },
                                                                {
                                                                    key: 'append',
                                                                    label: '+ Append',
                                                                    desc: 'Tambah data baru di bawah data yang sudah ada',
                                                                    icon: '+',
                                                                },
                                                                {
                                                                    key: 'new_sheet',
                                                                    label: '📅 New Sheet',
                                                                    desc: 'Buat tab baru per tanggal (2026-02-25)',
                                                                    icon: '📅',
                                                                },
                                                                {
                                                                    key: 'upsert',
                                                                    label: '⟳ Upsert',
                                                                    desc: 'Update by key column, append kalau belum ada',
                                                                    icon: '⟳',
                                                                },
                                                            ].map(m => (
                                                                <button
                                                                    key={m.key}
                                                                    onClick={() => setConn({ ...conn, schedule_mode: m.key })}
                                                                    className={`border rounded-xl p-3 text-left transition-colors ${(conn.schedule_mode || 'overwrite') === m.key
                                                                        ? 'border-blue-500 bg-blue-50'
                                                                        : 'border-gray-200 hover:bg-gray-50'
                                                                        }`}
                                                                >
                                                                    <div className={`text-sm font-medium ${(conn.schedule_mode || 'overwrite') === m.key ? 'text-blue-700' : 'text-gray-700'
                                                                        }`}>
                                                                        {m.label}
                                                                    </div>
                                                                    <div className="text-xs text-gray-400 mt-0.5">{m.desc}</div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}



                                                {/* Append Mode (only for non-Google Sheets) */}
                                                {form.channel_type !== 'google_sheets' && (
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-2">Mode</label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {[
                                                                { key: 'append', label: '+ Append', desc: 'Tambah baris baru di bawah data yang ada' },
                                                                { key: 'overwrite', label: '↺ Overwrite', desc: 'Hapus semua data lama, tulis ulang dari awal' },
                                                            ].map(m => (
                                                                <button key={m.key}
                                                                    onClick={() => setConn({ ...conn, append_mode: m.key })}
                                                                    className={`border rounded-xl p-3 text-left transition-colors ${(conn.append_mode || 'append') === m.key
                                                                        ? 'border-blue-500 bg-blue-50'
                                                                        : 'border-gray-200 hover:bg-gray-50'
                                                                        }`}>
                                                                    <div className={`text-sm font-medium ${(conn.append_mode || 'append') === m.key ? 'text-blue-700' : 'text-gray-700'}`}>
                                                                        {m.label}
                                                                    </div>
                                                                    <div className="text-xs text-gray-400 mt-0.5">{m.desc}</div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                )}

                                                {/* Header Row Toggle */}
                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-700">Tulis Header Otomatis</div>
                                                        <div className="text-xs text-gray-400 mt-0.5">Tulis nama kolom di baris pertama jika sheet masih kosong</div>
                                                    </div>
                                                    <div
                                                        onClick={() => setConn({ ...conn, header_row: !conn.header_row })}
                                                        className={`w-10 h-5 rounded-full cursor-pointer relative transition-colors ${conn.header_row !== false ? 'bg-blue-600' : 'bg-gray-300'
                                                            }`}>
                                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${conn.header_row !== false ? 'left-5' : 'left-0.5'
                                                            }`} />
                                                    </div>
                                                </div>



                                                {/* Credentials JSON */}
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Service Account Credentials JSON *</label>
                                                    <textarea
                                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                        rows={8}
                                                        placeholder={'{\n  "type": "service_account",\n  "project_id": "...",\n  "private_key": "...",\n  "client_email": "..."\n}'}
                                                        value={conn.credentials_json || ''}
                                                        onChange={e => setConn({ ...conn, credentials_json: e.target.value })}
                                                    />
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Paste isi file JSON yang didownload dari Google Cloud Console → IAM → Service Accounts → Keys
                                                    </p>
                                                </div>

                                                <button onClick={handleSaveConn} disabled={savingConn}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-lg disabled:opacity-50">
                                                    {savingConn ? 'Menyimpan...' : 'Simpan Connection'}
                                                </button>
                                            </div>
                                        )}

                                        {/* <button onClick={handleSaveConn} disabled={savingConn}
                                            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-lg disabled:opacity-50">
                                            {savingConn ? 'Menyimpan...' : 'Simpan Connection'}
                                        </button> */}
                                    </>
                                )}
                            </div>
                        )}

                        {/* ── Notification ──────────────────────────────────────────────── */}
                        {activeTab === 'notification' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Email Config</label>
                                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={form.email_config_id}
                                        // onChange={e => setForm({ ...form, email_config_id: Number(e.target.value) })}
                                        onChange={e => setForm({ ...form, email_config_id: e.target.value ? Number(e.target.value) : null })}
                                    >
                                        <option value="">-- Tidak ada notifikasi --</option>
                                        {emailConfigs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-4">
                                    {[
                                        { key: 'notify_on_success', label: 'Kirim notif jika sukses' },
                                        { key: 'notify_on_failure', label: 'Kirim notif jika gagal' },
                                    ].map(opt => (
                                        <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox"
                                                checked={form[opt.key as keyof IntegrationForm] as boolean}
                                                onChange={e => setForm({ ...form, [opt.key]: e.target.checked })}
                                                className="rounded" />
                                            <span className="text-sm text-gray-700">{opt.label}</span>
                                        </label>
                                    ))}
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Subject Email Notifikasi</label>
                                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Kosongkan untuk subject default"
                                        value={form.notify_email_subject}
                                        onChange={e => setForm({ ...form, notify_email_subject: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Body Email Notifikasi (HTML)</label>
                                    <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        rows={8} placeholder="Kosongkan untuk body default"
                                        value={form.notify_email_body}
                                        onChange={e => setForm({ ...form, notify_email_body: e.target.value })} />
                                </div>
                            </div>
                        )}

                        {/* ── Recipients ────────────────────────────────────────────────── */}
                        {activeTab === 'recipients' && (
                            <div className="space-y-4">
                                {!isEdit ? (
                                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm px-4 py-3 rounded-lg">
                                        Simpan integrasi terlebih dahulu.
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex gap-2">
                                            <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Email *" value={rcptEmail} onChange={e => setRcptEmail(e.target.value)} />
                                            <input className="w-36 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                                        {recipients.length === 0 ? (
                                            <div className="p-6 text-center text-gray-400 text-sm border border-gray-200 rounded-xl">Belum ada penerima</div>
                                        ) : (
                                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                                {(['TO', 'CC'] as const).map(type => {
                                                    const list = recipients.filter(r => r.type === type);
                                                    if (!list.length) return null;
                                                    return (
                                                        <div key={type}>
                                                            <div className={`px-4 py-2 text-xs font-semibold ${type === 'TO' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600'}`}>{type}</div>
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
                            <div>
                                {histories.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 text-sm">Belum ada history</div>
                                ) : (
                                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Waktu</th>
                                                    <th className="text-center px-4 py-3 text-gray-600 font-medium">Status</th>
                                                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Channel</th>
                                                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Trigger</th>
                                                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Keterangan</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {histories.map(h => (
                                                    <tr key={h.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(h.sent_at)}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${h.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                }`}>{h.status === 'success' ? '✓ Sukses' : '✕ Gagal'}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-gray-600 uppercase">{h.channel_type}</td>
                                                        <td className="px-4 py-3 text-xs text-gray-500">{h.triggered_by}</td>
                                                        <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{h.message}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )} */}

                        {activeTab === 'history' && (
                            <div>
                                {histories.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 text-sm">Belum ada history</div>
                                ) : (
                                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Waktu</th>
                                                    <th className="text-center px-4 py-3 text-gray-600 font-medium">Status</th>
                                                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Channel</th>
                                                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Trigger</th>
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
                                                                }`}>{h.status === 'success' ? '✓ Sukses' : '✕ Gagal'}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-gray-600 uppercase">{h.channel_type}</td>
                                                        <td className="px-4 py-3 text-xs text-gray-500">{h.triggered_by}</td>
                                                        {/* <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{h.message}</td> */}
                                                        <td className="px-4 py-3 text-xs text-gray-500 max-w-xs">
                                                            <div className="relative group">
                                                                <div className="truncate cursor-pointer">{h.message}</div>
                                                                {h.message && h.message.length > 50 && (
                                                                    <div className="absolute z-50 hidden group-hover:block top-full left-0 mt-1 w-80 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg break-words whitespace-pre-wrap">
                                                                        {h.message}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
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