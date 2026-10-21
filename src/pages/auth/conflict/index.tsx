import { useCallback, useEffect, useState } from 'react';
import {
    Monitor,
    Smartphone,
    Tablet,
    MapPin,
    Clock,
    AlertTriangle,
    LogOut,
    Check,
} from 'lucide-react';
import eventBus from '@/utils/eventBus';
import api from '@/lib/api';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setUser } from '@/store/userSlice';
import router from 'next/router';

interface UserSession {
    id: number;
    sessionId?: string;
    deviceId: string;
    ipAddress: string;
    userAgent: string;
    lastActivityAt: string;
    createdAt?: string;
    expiresAt?: string;
    isActive: boolean;
}

interface ConflictData {
    currentSession: {
        deviceId: string;
        ipAddress: string;
        userAgent: string;
    };
    existingSessions: UserSession[];
    expiresAt: string;
}

const getApiErrorMessage = (error: unknown): string => {
    const e = error as { response?: { data?: { message?: string; error?: string } } };
    return e.response?.data?.message || e.response?.data?.error || 'An unexpected error occurred. Please try again.';
};

const AuthConflictPage = () => {
    const [conflictId, setConflictId] = useState('');
    const [loading, setLoading] = useState(true);
    const [conflictData, setConflictData] = useState<ConflictData | null>(null);
    const [processingAction, setProcessingAction] = useState<'continue' | 'logout-others' | null>(null);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const dispatch = useAppDispatch();

    const fetchConflictData = useCallback(async (cid: string) => {
        setLoading(true);
        setErrorMessage('');
        try {
            const response = await api.post(
                '/auth/login/sessions',
                { conflict_id: cid },
                { withCredentials: true },
            );

            if (response.data?.success !== true || !Array.isArray(response.data?.data)) {
                throw new Error(response.data?.message || 'Invalid conflict response');
            }

            // GORM normally serializes Go field names to snake_case JSON.
            // Accept both snake_case and camelCase to avoid silently losing session data.
            const sessions: UserSession[] = response.data.data.map((s: Record<string, unknown>, index: number) => ({
                id: Number(s.ID ?? s.id ?? index),
                sessionId: String(s.SessionID ?? s.session_id ?? s.sessionId ?? ''),
                deviceId: String(s.DeviceID ?? s.device_id ?? s.deviceId ?? 'Unknown device'),
                ipAddress: String(s.IPAddress ?? s.ip_address ?? s.ipAddress ?? 'Unknown'),
                userAgent: String(s.UserAgent ?? s.user_agent ?? s.userAgent ?? ''),
                lastActivityAt: String(s.LastActivityAt ?? s.last_activity_at ?? s.lastActivityAt ?? new Date().toISOString()),
                createdAt: String(s.CreatedAt ?? s.created_at ?? s.createdAt ?? ''),
                expiresAt: String(s.ExpiresAt ?? s.expires_at ?? s.expiresAt ?? ''),
                isActive: Boolean(s.IsActive ?? s.is_active ?? s.isActive),
            }));

            const expiresAt = response.data.expires_at ?? response.data.expiresAt;
            if (!expiresAt || Number.isNaN(new Date(expiresAt).getTime())) {
                throw new Error('The conflict expiration time is missing or invalid. Please login again.');
            }

            setConflictData({
                currentSession: {
                    deviceId: getDeviceName(navigator.userAgent),
                    ipAddress: 'Current device',
                    userAgent: navigator.userAgent,
                },
                existingSessions: sessions,
                expiresAt: new Date(expiresAt).toISOString(),
            });
        } catch (error) {
            console.error('Failed to fetch conflict data:', error);
            setConflictData(null);
            setErrorMessage(getApiErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const cid = params.get('cid');
        if (!cid) {
            setErrorMessage('Conflict ID is missing. Please login again.');
            setLoading(false);
            return;
        }
        setConflictId(cid);
        void fetchConflictData(cid);
    }, [fetchConflictData]);

    useEffect(() => {
        if (!conflictData?.expiresAt) return;

        const updateTimer = () => {
            const expiry = new Date(conflictData.expiresAt).getTime();
            const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
            setTimeRemaining(remaining);
            if (remaining <= 0) {
                window.location.replace('/auth/login?reason=conflict_expired');
            }
        };

        updateTimer();
        const interval = window.setInterval(updateTimer, 1000);
        return () => window.clearInterval(interval);
    }, [conflictData?.expiresAt]);

    const handleContinueHere = async () => {
        if (!conflictId || processingAction !== null) return;
        setProcessingAction('continue');
        setErrorMessage('');
        eventBus.emit('loading', true);

        try {
            const res = await api.post(
                '/auth/login/confirm',
                { conflict_id: conflictId },
                { withCredentials: true },
            );

            if (res.data?.success !== true || !res.data?.x_token || !res.data?.user) {
                throw new Error(res.data?.message || 'Login confirmation failed.');
            }

            dispatch(setUser({
                name: res.data.user.name,
                email: res.data.user.email,
                base_url: res.data.user.base_url,
                token: res.data.x_token,
                menus: res.data.menus,
                unit: res.data.user.unit,
                roles: res.data.user.roles,
                permissions: res.data.permissions || [],
            }));

            // Keep this only if the app's middleware explicitly uses this client-readable cookie.
            // The HttpOnly refresh token is set separately by the backend.
            const cookieName = process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME;
            if (cookieName) {
                document.cookie = `${cookieName}=${res.data.x_token}; path=/; max-age=${15 * 60}; SameSite=Lax`;
            }

            if (res.data.user.base_url === '/dashboard') {
                await router.push('/wms/dashboard');
            } else {
                await router.push('/mobile/home');
            }
        } catch (error) {
            console.error('Failed to confirm login conflict:', error);
            const e = error as { response?: { status?: number } };
            setErrorMessage(getApiErrorMessage(error));
            if (e.response?.status === 410 || e.response?.status === 404) {
                window.setTimeout(() => window.location.replace('/auth/login?reason=conflict_expired'), 1200);
            }
        } finally {
            eventBus.emit('loading', false);
            setProcessingAction(null);
        }
    };


    function getDeviceIcon(userAgent: string) {
        const ua = userAgent.toLowerCase();
        if (ua.includes('iphone') || ua.includes('android') || ua.includes('mobile')) {
            return <Smartphone className="w-5 h-5" />;
        }
        if (ua.includes('ipad') || ua.includes('tablet')) return <Tablet className="w-5 h-5" />;
        return <Monitor className="w-5 h-5" />;
    }

    function getDeviceName(userAgent: string) {
        const ua = userAgent.toLowerCase();
        if (ua.includes('iphone')) return 'iPhone';
        if (ua.includes('ipad')) return 'iPad';
        if (ua.includes('android')) return 'Android Device';
        if (ua.includes('mac os')) return 'Mac';
        if (ua.includes('windows')) return 'Windows PC';
        return 'Unknown Device';
    }

    const formatTimeAgo = (dateString: string) => {
        const past = new Date(dateString).getTime();
        if (Number.isNaN(past)) return 'Unknown';
        const diffMinutes = Math.max(0, Math.floor((Date.now() - past) / 60000));
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours} hours ago`;
        return `${Math.floor(diffHours / 24)} days ago`;
    };

    const formatTimer = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="mt-4 text-slate-600">Loading session information...</p>
                </div>
            </div>
        );
    }

    if (!conflictData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-slate-800 mb-2">Conflict Session Tidak Valid</h2>
                    <p className="text-slate-600 mb-4">{errorMessage || 'Link conflict tidak valid atau sudah kedaluwarsa.'}</p>
                    <button onClick={() => window.location.replace('/auth/login')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                        Kembali ke Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                <div className="bg-white rounded-t-xl shadow-lg p-6 border-b border-slate-200">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-amber-100 p-2 rounded-lg"><AlertTriangle className="w-6 h-6 text-amber-600" /></div>
                                <h1 className="text-2xl font-semibold text-slate-800">Multiple Active Sessions Detected</h1>
                            </div>
                            <p className="text-slate-600">
                                You are currently signed in on another device. Would you like to continue logging in on this device?
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="text-sm text-slate-500 mb-1">Conflict expires in</div>
                            <div className={`text-2xl font-mono font-semibold ${timeRemaining < 60 ? 'text-red-600' : 'text-slate-800'}`}>{formatTimer(timeRemaining)}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-lg p-6 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full" /> Current Login Attempt
                    </h2>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-4">
                        <div className="bg-green-100 p-3 rounded-lg text-green-700">{getDeviceIcon(conflictData.currentSession.userAgent)}</div>
                        <div className="flex-1">
                            <div className="font-medium text-slate-800 mb-1">{conflictData.currentSession.deviceId}</div>
                            <div className="text-sm text-slate-600 flex items-center gap-2"><MapPin className="w-4 h-4" /><span>{conflictData.currentSession.ipAddress}</span></div>
                            <div className="text-sm text-slate-600 flex items-center gap-2 mt-1"><Clock className="w-4 h-4" /><span>Now</span></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-lg p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Active Sessions ({conflictData.existingSessions.length})</h2>
                    {conflictData.existingSessions.length === 0 ? (
                        <p className="text-sm text-slate-600 mb-6">
                            No active sessions were found. Please return to the login page and try again.
                        </p>
                    ) : (
                        <div className="space-y-3 mb-6">
                            {conflictData.existingSessions.map((session) => (
                                <div key={session.sessionId || session.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start gap-4">
                                    <div className="bg-slate-200 p-3 rounded-lg text-slate-600">{getDeviceIcon(session.userAgent)}</div>
                                    <div className="flex-1">
                                        <div className="font-medium text-slate-800 mb-1">{getDeviceName(session.userAgent)}</div>
                                        <div className="text-sm text-slate-600 space-y-1">
                                            <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>IP: {session.ipAddress}</span></div>
                                            <div className="flex items-center gap-2"><Clock className="w-4 h-4" /><span>Last active: {formatTimeAgo(session.lastActivityAt)}</span></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {errorMessage && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>}

                    <div className="grid md:grid-cols-2 gap-4">
                        <button onClick={handleContinueHere} disabled={processingAction !== null} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-md">
                            {processingAction === 'continue' ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</> : <><Check className="w-5 h-5" />Continue Here & Logout Others</>}
                        </button>
                        <button onClick={() => window.location.replace('/auth/login')} disabled={processingAction !== null} className="bg-white hover:bg-slate-50 disabled:bg-slate-100 text-slate-700 px-6 py-4 rounded-lg font-medium border-2 border-slate-300 transition-colors flex items-center justify-center gap-2">
                            <LogOut className="w-5 h-5" />Cancel & Stay on Other Devices
                        </button>
                    </div>

                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                        <strong>Security Notice:</strong> If you do not recognize the device listed, please change your password after logging in successfully.
                    </div>
                </div>

                <div className="bg-slate-100 rounded-b-xl shadow-lg p-4 text-center text-sm text-slate-600">Need help? <a href="/support" className="text-blue-600 hover:underline">Contact Support</a></div>
            </div>
        </div>
    );
};

export default AuthConflictPage;
