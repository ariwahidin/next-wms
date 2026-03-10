import { useState, useEffect } from 'react';
import { Monitor, Smartphone, Tablet, MapPin, Clock, AlertTriangle, LogOut, Check } from 'lucide-react';
import eventBus from '@/utils/eventBus';
import api from '@/lib/api';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setUser } from '@/store/userSlice';
import router from 'next/router';

interface UserSession {
    id: number;
    deviceId: string;
    ipAddress: string;
    userAgent: string;
    lastActivityAt: string;
    createdAt: string;
    isActive: boolean;
}

interface ConflictData {
    currentSession: UserSession;
    existingSessions: UserSession[];
    expiresAt: string;
}

const AuthConflictPage = () => {
    const [conflictId, setConflictId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [conflictData, setConflictData] = useState<ConflictData | null>(null);
    const [processingAction, setProcessingAction] = useState<'continue' | 'logout-others' | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const dispatch = useAppDispatch();

    useEffect(() => {
        // Extract CID from URL
        const params = new URLSearchParams(window.location.search);
        const cid = params.get('cid');
        if (cid) {
            setConflictId(cid);
            fetchConflictData(cid);
        }
    }, []);

    useEffect(() => {
        if (conflictData?.expiresAt) {
            const interval = setInterval(() => {
                const now = new Date().getTime();
                const expiry = new Date(conflictData.expiresAt).getTime();
                const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
                setTimeRemaining(remaining);

                if (remaining === 0) {
                    window.location.href = '/auth/login';
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [conflictData]);

    const fetchConflictData = async (cid: string) => {
        try {
            // Mock data for demonstration
            // In production: const response = await fetch(`/api/auth/conflict/${cid}`);


            const response = await api.post('/auth/login/sessions', { conflict_id: cid }, { withCredentials: true });
            console.log('API Response session:', response.data);

            setTimeout(() => {
                setConflictData({
                    currentSession: {
                        id: 999,
                        deviceId: getDeviceName(navigator.userAgent),
                        ipAddress: window.location.hostname,
                        userAgent: navigator.userAgent,
                        lastActivityAt: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        isActive: false
                    },
                    existingSessions : response.data.data,
                    // existingSessions: [
                    //     {
                    //         id: 1,
                    //         deviceId: 'device-456',
                    //         ipAddress: '192.168.1.50',
                    //         userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1',
                    //         lastActivityAt: new Date(Date.now() - 3600000).toISOString(),
                    //         createdAt: new Date(Date.now() - 86400000).toISOString(),
                    //         isActive: true
                    //     },
                    //     {
                    //         id: 2,
                    //         deviceId: 'device-789',
                    //         ipAddress: '10.0.0.25',
                    //         userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36',
                    //         lastActivityAt: new Date(Date.now() - 7200000).toISOString(),
                    //         createdAt: new Date(Date.now() - 172800000).toISOString(),
                    //         isActive: true
                    //     }
                    // ],
                    expiresAt: new Date(Date.now() + 300000).toISOString() // 5 minutes
                });
                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error('Failed to fetch conflict data:', error);
            setLoading(false);
        }
    };

    const handleContinueHere = async () => {
        setProcessingAction('continue');

        eventBus.emit("loading", true);
        api
            .post(
                "/auth/login/confirm",
                {
                    conflict_id: conflictId
                },
                { withCredentials: true }
            )
            .then((res) => {
                eventBus.emit("loading", false);

                if (res.data.success === true) {
                    // Simpan user ke Redux
                    console.log(" roles => ", res.data.user.roles);
                    dispatch(
                        setUser({
                            name: res.data.user.name,
                            email: res.data.user.email,
                            base_url: res.data.user.base_url,
                            token: res.data.x_token,
                            menus: res.data.menus,
                            unit: res.data.user.unit,
                            roles: res.data.user.roles,
                            permissions: res.data.permissions || []
                        })
                    );

                    document.cookie = `wms-auth-token=${res.data.x_token
                        }; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
                    if (res.data.user.base_url === "/dashboard") {
                        router.push("/wms/dashboard");
                    } else {
                        router.push("/mobile/home");
                    }
                }
            })
            .catch((err) => {
                eventBus.emit("loading", false);

                // const status = err.response?.status;
                // console.log("API Error Response sam:", err);

                // if (status === 409) {
                //     console.log("API Error Response conflict in login:", err.response);
                //     const conflictId = err.response.data?.conflict_id;
                //     router.push(`/auth/conflict?cid=${conflictId}`);
                //     return;
                // }

                console.log(err);
            });

        // try {
        //     // API call to logout all other sessions and activate current
        //     const response = await fetch('/api/auth/conflict/resolve', {
        //         method: 'POST',
        //         headers: { 'Content-Type': 'application/json' },
        //         body: JSON.stringify({
        //             conflictId,
        //             action: 'continue_here'
        //         })
        //     });

        //     if (response.ok) {
        //         // Redirect to dashboard or intended page
        //         window.location.href = '/dashboard';
        //     }
        // } catch (error) {
        //     console.error('Error resolving conflict:', error);
        //     setProcessingAction(null);
        // }
    };

    const handleLogoutOthers = async () => {
        setProcessingAction('logout-others');
        try {
            // API call to logout all other sessions
            const response = await fetch('/api/auth/conflict/logout-others', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conflictId
                })
            });

            if (response.ok) {
                window.location.href = '/dashboard';
            }
        } catch (error) {
            console.error('Error logging out others:', error);
            setProcessingAction(null);
        }
    };

    const getDeviceIcon = (userAgent: string) => {
        const ua = userAgent.toLowerCase();
        if (ua.includes('iphone') || ua.includes('android')) {
            return <Smartphone className="w-5 h-5" />;
        } else if (ua.includes('ipad') || ua.includes('tablet')) {
            return <Tablet className="w-5 h-5" />;
        }
        return <Monitor className="w-5 h-5" />;
    };

    const getDeviceName = (userAgent: string) => {
        const ua = userAgent.toLowerCase();
        if (ua.includes('iphone')) return 'iPhone';
        if (ua.includes('ipad')) return 'iPad';
        if (ua.includes('android')) return 'Android Device';
        if (ua.includes('mac os')) return 'Mac';
        if (ua.includes('windows')) return 'Windows PC';
        return 'Unknown Device';
    };

    const formatTimeAgo = (dateString: string) => {
        const now = new Date().getTime();
        const past = new Date(dateString).getTime();
        const diffMinutes = Math.floor((now - past) / 60000);

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours} hours ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} days ago`;
    };

    const formatTimer = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
                    <h2 className="text-2xl font-semibold text-slate-800 mb-2">Invalid Session</h2>
                    <p className="text-slate-600 mb-6">This conflict resolution link is invalid or has expired.</p>
                    <a href="/auth/login" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Back to Login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                {/* Header */}
                <div className="bg-white rounded-t-xl shadow-lg p-6 border-b border-slate-200">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-amber-100 p-2 rounded-lg">
                                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                                </div>
                                <h1 className="text-2xl font-semibold text-slate-800">Multiple Active Sessions Detected</h1>
                            </div>
                            <p className="text-slate-600">You're already logged in on other devices. Choose how you'd like to proceed.</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-slate-500 mb-1">Time remaining</div>
                            <div className={`text-2xl font-mono font-semibold ${timeRemaining < 60 ? 'text-red-600' : 'text-slate-800'}`}>
                                {formatTimer(timeRemaining)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Current Device */}
                <div className="bg-white shadow-lg p-6 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Current Login Attempt
                    </h2>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-green-100 p-3 rounded-lg text-green-700">
                                {getDeviceIcon(conflictData.currentSession.userAgent)}
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-slate-800 mb-1">{getDeviceName(conflictData.currentSession.userAgent)}</div>
                                <div className="text-sm text-slate-600 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        <span>IP: {conflictData.currentSession.ipAddress}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        <span>Right now</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Existing Sessions */}
                <div className="bg-white shadow-lg p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Active Sessions ({conflictData.existingSessions.length})</h2>
                    <div className="space-y-3 mb-6">
                        {conflictData.existingSessions.map((session) => (
                            <div key={session.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                <div className="flex items-start gap-4">
                                    <div className="bg-slate-200 p-3 rounded-lg text-slate-600">
                                        {getDeviceIcon(session.userAgent)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-slate-800 mb-1">{getDeviceName(session.userAgent)}</div>
                                        <div className="text-sm text-slate-600 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                <span>IP: {session.ipAddress}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                <span>Last active: {formatTimeAgo(session.lastActivityAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <button
                            onClick={handleContinueHere}
                            disabled={processingAction !== null}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-md"
                        >
                            {processingAction === 'continue' ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    Continue Here & Logout Others
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => window.location.href = '/auth/login'}
                            disabled={processingAction !== null}
                            className="bg-white hover:bg-slate-50 disabled:bg-slate-100 text-slate-700 px-6 py-4 rounded-lg font-medium border-2 border-slate-300 transition-colors flex items-center justify-center gap-2"
                        >
                            <LogOut className="w-5 h-5" />
                            Cancel & Stay on Other Devices
                        </button>
                    </div>

                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex gap-3">
                            <div className="text-blue-600 mt-0.5">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="text-sm text-blue-800">
                                <strong>Security Notice:</strong> If you don't recognize any of these devices, your account may be compromised. Consider changing your password immediately after logging in.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-100 rounded-b-xl shadow-lg p-4 text-center text-sm text-slate-600">
                    Need help? <a href="/support" className="text-blue-600 hover:underline">Contact Support</a>
                </div>
            </div>
        </div>
    );
};

export default AuthConflictPage;