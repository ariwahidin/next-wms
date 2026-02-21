'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Frequency = 'daily' | 'weekly' | 'monthly';

interface Schedule {
    id?: number;
    frequency: Frequency;
    day_of_week: number | null;
    day_of_month: number | null;
    hour: number;
    minute: number;
    is_active: boolean;
    last_run_at: string | null;
    next_run_at: string | null;
    max_retry: number;
    retry_delay_min: number;
}

interface Props {
    reportId: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const DATES = Array.from({ length: 31 }, (_, i) => i + 1);

const defaultSchedule: Schedule = {
    frequency: 'daily',
    day_of_week: 1,
    day_of_month: 1,
    hour: 8,
    minute: 0,
    is_active: true,
    last_run_at: null,
    next_run_at: null,
    max_retry: 3,        // ← tambah
    retry_delay_min: 5,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');

const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const describeSchedule = (s: Schedule) => {
    const time = `${pad(s.hour)}:${pad(s.minute)}`;
    if (s.frequency === 'daily') return `Setiap hari pukul ${time}`;
    if (s.frequency === 'weekly') return `Setiap ${DAY_NAMES[s.day_of_week ?? 1]} pukul ${time}`;
    if (s.frequency === 'monthly') return `Setiap tanggal ${s.day_of_month} pukul ${time}`;
    return '';
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScheduleTab({ reportId }: Props) {
    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [form, setForm] = useState<Schedule>(defaultSchedule);
    const [hasSchedule, setHasSchedule] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // ─── Fetch ────────────────────────────────────────────────────────────────

    const fetchSchedule = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/report-mailer/reports/${reportId}/schedule`, { withCredentials: true });
            if (res.data.data) {
                setSchedule(res.data.data);
                setForm(res.data.data);
                setHasSchedule(true);
            } else {
                setHasSchedule(false);
            }
        } catch (e: any) {
            setError(e.response?.data?.error || 'Gagal memuat schedule');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, [reportId]);

    // ─── Save ─────────────────────────────────────────────────────────────────

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            await api.post(`/report-mailer/reports/${reportId}/schedule`, form, { withCredentials: true });
            setSuccess('Schedule berhasil disimpan');
            fetchSchedule();
        } catch (e: any) {
            setError(e.response?.data?.error || 'Gagal menyimpan schedule');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Hapus schedule ini?')) return;
        try {
            await api.delete(`/report-mailer/reports/${reportId}/schedule`, { withCredentials: true });
            setSuccess('Schedule berhasil dihapus');
            setHasSchedule(false);
            setSchedule(null);
            setForm(defaultSchedule);
        } catch (e: any) {
            setError(e.response?.data?.error || 'Gagal menghapus schedule');
        }
    };

    // ─── Send Now ─────────────────────────────────────────────────────────────

    const handleSendNow = async () => {
        if (!confirm('Kirim report sekarang?')) return;
        setSending(true);
        setError('');
        try {
            await api.post(`/report-mailer/reports/${reportId}/send-now`, {}, { withCredentials: true });
            setSuccess('Report berhasil dikirim!');
            fetchSchedule(); // refresh last_run_at
        } catch (e: any) {
            setError(e.response?.data?.error || 'Gagal mengirim report');
        } finally {
            setSending(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    if (loading) return <div className="p-6 text-sm text-gray-400">Memuat schedule...</div>;

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

            {/* Info schedule aktif */}
            {hasSchedule && schedule && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <div className="text-sm font-medium text-blue-800">{describeSchedule(schedule)}</div>
                        <div className="text-xs text-blue-500 mt-1 space-x-4">
                            <span>Terakhir kirim: {formatDate(schedule.last_run_at)}</span>
                            <span>Berikutnya: {formatDate(schedule.next_run_at)}</span>
                        </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${schedule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                        {schedule.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                </div>
            )}

            {/* Form Schedule */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">Pengaturan Jadwal</h3>
                    {/* Toggle Aktif */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <div
                            onClick={() => setForm({ ...form, is_active: !form.is_active })}
                            className={`w-10 h-5 rounded-full transition-colors ${form.is_active ? 'bg-blue-600' : 'bg-gray-300'} relative`}
                        >
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? 'left-5' : 'left-0.5'}`} />
                        </div>
                        <span className="text-sm text-gray-700">Aktifkan jadwal</span>
                    </label>
                </div>

                {/* Pilih Frequency */}
                <div>
                    <label className="block text-xs text-gray-500 mb-2">Frekuensi</label>
                    <div className="flex gap-2">
                        {(['daily', 'weekly', 'monthly'] as Frequency[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => setForm({ ...form, frequency: f })}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors capitalize ${form.frequency === f
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {f === 'daily' ? 'Harian' : f === 'weekly' ? 'Mingguan' : 'Bulanan'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Pilih Hari (Weekly) */}
                {form.frequency === 'weekly' && (
                    <div>
                        <label className="block text-xs text-gray-500 mb-2">Hari</label>
                        <div className="flex gap-1.5">
                            {DAY_NAMES.map((day, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setForm({ ...form, day_of_week: idx })}
                                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${form.day_of_week === idx
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {day.slice(0, 3)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pilih Tanggal (Monthly) */}
                {form.frequency === 'monthly' && (
                    <div>
                        <label className="block text-xs text-gray-500 mb-2">Tanggal</label>
                        <div className="grid grid-cols-10 gap-1">
                            {DATES.map((d) => (
                                <button
                                    key={d}
                                    onClick={() => setForm({ ...form, day_of_month: d })}
                                    className={`py-1.5 rounded text-xs font-medium border transition-colors ${form.day_of_month === d
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pilih Jam & Menit */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Jam</label>
                        <select
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={form.hour}
                            onChange={(e) => setForm({ ...form, hour: Number(e.target.value) })}
                        >
                            {HOURS.map((h) => (
                                <option key={h} value={h}>{pad(h)}:00</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Menit</label>
                        <select
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={form.minute}
                            onChange={(e) => setForm({ ...form, minute: Number(e.target.value) })}
                        >
                            {MINUTES.map((m) => (
                                <option key={m} value={m}>{pad(m)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Retry Config */}
                <div className="border-t border-gray-100 pt-4">
                    <label className="block text-xs text-gray-500 mb-3">
                        Retry otomatis jika gagal
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">
                                Maks percobaan
                            </label>
                            <select
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={form.max_retry}
                                onChange={(e) => setForm({ ...form, max_retry: Number(e.target.value) })}
                            >
                                <option value={1}>1x (tidak retry)</option>
                                <option value={2}>2x</option>
                                <option value={3}>3x</option>
                                <option value={5}>5x</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">
                                Jeda antar retry
                            </label>
                            <select
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={form.retry_delay_min}
                                onChange={(e) => setForm({ ...form, retry_delay_min: Number(e.target.value) })}
                            >
                                <option value={1}>1 menit</option>
                                <option value={5}>5 menit</option>
                                <option value={10}>10 menit</option>
                                <option value={15}>15 menit</option>
                                <option value={30}>30 menit</option>
                            </select>
                        </div>
                    </div>
                    {form.max_retry > 1 && (
                        <p className="text-xs text-gray-400 mt-2">
                            💡 Jika gagal, sistem akan coba ulang{' '}
                            <span className="font-medium text-gray-600">
                                {form.max_retry - 1}x
                            </span>{' '}
                            dengan jeda{' '}
                            <span className="font-medium text-gray-600">
                                {form.retry_delay_min} menit
                            </span>{' '}
                            setiap percobaan.
                        </p>
                    )}
                </div>

                {/* Preview jadwal */}
                <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600">
                    🕐 <span className="font-medium">{describeSchedule(form)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                    <div>
                        {hasSchedule && (
                            <button
                                onClick={handleDelete}
                                className="text-sm text-red-500 hover:underline"
                            >
                                Hapus Schedule
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-lg disabled:opacity-50"
                    >
                        {saving ? 'Menyimpan...' : 'Simpan Schedule'}
                    </button>
                </div>
            </div>

            {/* Send Now */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
                <div>
                    <div className="text-sm font-medium text-gray-700">Kirim Sekarang</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                        Jalankan report ini sekarang tanpa menunggu jadwal
                    </div>
                </div>
                <button
                    onClick={handleSendNow}
                    disabled={sending}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm px-5 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                    {sending ? (
                        <>
                            <span className="animate-spin">⟳</span> Mengirim...
                        </>
                    ) : (
                        '▶ Send Now'
                    )}
                </button>
            </div>
        </div>
    );
}