'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Layout from '@/components/layout';

interface Integration {
    id: number;
    name: string;
    event_key: string;
    description: string;
    channel_type: string;
    file_format: string;
    source_type: string;
    timing: string;
    is_active: boolean;
    recipients: { id: number }[];
}

const CHANNEL_BADGE: Record<string, { label: string; color: string }> = {
    sftp: { label: 'SFTP', color: 'bg-blue-100 text-blue-700' },
    ftp: { label: 'FTP', color: 'bg-purple-100 text-purple-700' },
    api: { label: 'API', color: 'bg-green-100 text-green-700' },
    file: { label: 'File', color: 'bg-yellow-100 text-yellow-700' },
};

const TIMING_BADGE: Record<string, { label: string; color: string }> = {
    realtime: { label: 'Realtime', color: 'bg-orange-100 text-orange-700' },
    scheduled: { label: 'Scheduled', color: 'bg-gray-100 text-gray-600' },
};

export default function IntegrationPage() {
    const router = useRouter();
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchIntegrations = async () => {
        setLoading(true);
        try {
            const res = await api.get('/integrations', { withCredentials: true });
            setIntegrations(res.data.data || []);
        } catch {
            setError('Gagal memuat data integrasi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchIntegrations(); }, []);

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Hapus integrasi "${name}"?`)) return;
        try {
            await api.delete(`/integrations/${id}`, { withCredentials: true });
            setSuccess('Integrasi berhasil dihapus');
            fetchIntegrations();
        } catch {
            setError('Gagal menghapus integrasi');
        }
    };

    return (
        <Layout title="Utilities" subTitle="Integration Hub">
            <div className="p-6 max-w-8xl mx-auto space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-800">Integration Hub</h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            Kelola integrasi sistem eksternal — SAP, Shopee, API pihak ketiga, dan lainnya
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/wms/utilities/integration/create')}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
                    >
                        + Tambah Integrasi
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
                    ) : integrations.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-3xl mb-2">🔌</div>
                            <div className="text-gray-500 font-medium">Belum ada integrasi</div>
                            <div className="text-gray-400 text-sm mt-1">Klik "+ Tambah Integrasi" untuk memulai</div>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-5 py-3 text-gray-600 font-medium">Nama</th>
                                    <th className="text-left px-5 py-3 text-gray-600 font-medium">Event Key</th>
                                    <th className="text-center px-5 py-3 text-gray-600 font-medium">Channel</th>
                                    <th className="text-center px-5 py-3 text-gray-600 font-medium">Timing</th>
                                    <th className="text-center px-5 py-3 text-gray-600 font-medium">Penerima</th>
                                    <th className="text-center px-5 py-3 text-gray-600 font-medium">Status</th>
                                    <th className="text-center px-5 py-3 text-gray-600 font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {integrations.map((intg) => {
                                    const channel = CHANNEL_BADGE[intg.channel_type] || { label: intg.channel_type, color: 'bg-gray-100 text-gray-600' };
                                    const timing = TIMING_BADGE[intg.timing] || { label: intg.timing, color: 'bg-gray-100 text-gray-600' };
                                    return (
                                        <tr key={intg.id} className="hover:bg-gray-50">
                                            <td className="px-5 py-3">
                                                <div className="font-medium text-gray-800">{intg.name}</div>
                                                {intg.description && (
                                                    <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{intg.description}</div>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                    {intg.event_key}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${channel.color}`}>
                                                    {channel.label}
                                                    {intg.file_format && intg.channel_type !== 'api' && ` · ${intg.file_format.toUpperCase()}`}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${timing.color}`}>
                                                    {timing.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-center text-xs text-gray-500">
                                                {intg.recipients?.length || 0} email
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${intg.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {intg.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button
                                                        onClick={() => router.push(`/wms/utilities/integration/${intg.id}/edit`)}
                                                        className="text-xs text-blue-600 hover:underline"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(intg.id, intg.name)}
                                                        className="text-xs text-red-500 hover:underline"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </Layout>
    );
}