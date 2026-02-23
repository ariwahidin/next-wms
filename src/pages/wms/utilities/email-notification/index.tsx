'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Layout from '@/components/layout';

interface Notification {
    id: number;
    name: string;
    event_key: string;
    description: string;
    is_active: boolean;
    email_config: { name: string };
    recipients: { id: number; email: string; type: string }[];
    created_at: string;
}

export default function EmailNotificationPage() {
    const router = useRouter();
    const [notifs, setNotifs] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchNotifs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications', { withCredentials: true });
            setNotifs(res.data.data || []);
        } catch {
            setError('Gagal memuat notifikasi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNotifs(); }, []);

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Hapus notifikasi "${name}"?`)) return;
        try {
            await api.delete(`/notifications/${id}`, { withCredentials: true });
            setSuccess('Notifikasi berhasil dihapus');
            fetchNotifs();
        } catch {
            setError('Gagal menghapus notifikasi');
        }
    };

    return (
        <Layout title="Utilities" subTitle="Email Notification" description="Kelola notifikasi email otomatis berdasarkan event sistem">
            <div className="p-6 max-w-8xl mx-auto space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-800">Email Notification</h1>
                        <p className="text-sm text-gray-400 mt-0.5">Kelola notifikasi email otomatis berdasarkan event sistem</p>
                    </div>
                    <button
                        onClick={() => router.push('/wms/utilities/email-notification/create')}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
                    >
                        + Tambah Notifikasi
                    </button>
                </div>

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

                {/* Tabel */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Memuat data...</div>
                    ) : notifs.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Belum ada notifikasi</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-5 py-3 text-gray-600 font-medium">Nama</th>
                                    <th className="text-left px-5 py-3 text-gray-600 font-medium">Event Key</th>
                                    <th className="text-left px-5 py-3 text-gray-600 font-medium">Email Config</th>
                                    <th className="text-center px-5 py-3 text-gray-600 font-medium">Penerima</th>
                                    <th className="text-center px-5 py-3 text-gray-600 font-medium">Status</th>
                                    <th className="text-center px-5 py-3 text-gray-600 font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {notifs.map((n) => (
                                    <tr key={n.id} className="hover:bg-gray-50">
                                        <td className="px-5 py-3">
                                            <div className="font-medium text-gray-800">{n.name}</div>
                                            {n.description && (
                                                <div className="text-xs text-gray-400 mt-0.5">{n.description}</div>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                {n.event_key}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-gray-600">{n.email_config?.name || '-'}</td>
                                        <td className="px-5 py-3 text-center">
                                            <span className="text-xs text-gray-500">
                                                {n.recipients?.length || 0} penerima
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${n.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {n.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => router.push(`/wms/utilities/email-notification/${n.id}/edit`)}
                                                    className="text-xs text-blue-600 hover:underline"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(n.id, n.name)}
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