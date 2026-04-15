/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// FILE BARU: app/wms/settings/shopee/page.tsx
// Halaman Settings Shopee di WMS
// ============================================================

"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";
import { useSearchParams } from "next/navigation";
import Layout from "@/components/layout";

type ShopeeConfigData = {
    id: number;
    partner_id: number;
    partner_key: string;
    shop_id: number;
    access_token: string;
    base_url: string;
    push_url: string;
    is_active: boolean;
    environment: string;
    updated_at: string;
    has_token: boolean;
    has_refresh: boolean;
};

export default function ShopeeSettingsPage() {
    const searchParams = useSearchParams();
    const [config, setConfig] = useState<ShopeeConfigData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [authorizing, setAuthorizing] = useState(false);
    const isSubmittingRef = useRef(false);
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualForm, setManualForm] = useState({
        shop_id: "",
        access_token: "",
        refresh_token: "",
    });
    const [savingManual, setSavingManual] = useState(false);

    const [form, setForm] = useState({
        partner_id: "",
        partner_key: "",
        base_url: "https://openplatform.sandbox.test-stable.shopee.sg",
        push_url: "",
        environment: "sandbox",
    });

    // const [showTestModal, setShowTestModal] = useState(false);
    // const [testLoading, setTestLoading] = useState(false);
    // const [testResult, setTestResult] = useState<any>(null);
    // const [testError, setTestError] = useState<string | null>(null);

    const SHOPEE_TEST_ENDPOINTS = [
        {
            label: "Get Order List",
            value: "get_order_list",
            method: "GET",
            path: "/api/v2/order/get_order_list",
            description: "Fetch order list READY_TO_SHIP · 15 hari terakhir",
        },
    ];

    const [showTestModal, setShowTestModal] = useState(false);
    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    const [testError, setTestError] = useState<string | null>(null);
    const [selectedEndpoint, setSelectedEndpoint] = useState(SHOPEE_TEST_ENDPOINTS[0].value);

    const [schedulerRunning, setSchedulerRunning] = useState(false);
    const [schedulerLoading, setSchedulerLoading] = useState(false);

    const fetchConfig = async () => {
        try {
            const res = await api.get("/outbound/shopee/config", { withCredentials: true });
            if (res.data.success && res.data.data) {
                setConfig(res.data.data);
                setForm((prev) => ({
                    ...prev,
                    partner_id: res.data.data.partner_id?.toString() || "",
                    base_url: res.data.data.base_url || prev.base_url,
                    push_url: res.data.data.push_url || prev.push_url,
                    environment: res.data.data.environment || prev.environment,
                }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
        fetchSchedulerStatus();
        // Cek jika redirect dari OAuth callback dengan status=success
        if (searchParams.get("status") === "success") {
            eventBus.emit("showAlert", {
                title: "Authorize Berhasil!",
                description: "Token Shopee berhasil disimpan ke database",
                type: "success",
            });
        }
    }, []);

    const handleSaveConfig = async () => {
        if (isSubmittingRef.current) return;

        console.log("Saving config with values:", form);

        if (!form.partner_id || !form.partner_key) {
            eventBus.emit("showAlert", { title: "Error", description: "Partner ID dan Partner Key wajib diisi", type: "error" });
            return;
        }

        isSubmittingRef.current = true;
        setSaving(true);
        eventBus.emit("loading", true);

        try {
            const res = await api.post("/outbound/shopee/config", {
                partner_id: parseInt(form.partner_id),
                partner_key: form.partner_key,
                base_url: form.base_url,
                push_url: form.push_url,
                environment: form.environment,
            }, { withCredentials: true });

            if (res.data.success) {
                eventBus.emit("showAlert", {
                    title: "Berhasil!",
                    description: "Konfigurasi disimpan. Silakan lakukan Authorize untuk mendapatkan token.",
                    type: "success",
                });
                fetchConfig();
            }
        } catch (err: any) {
            eventBus.emit("showAlert", {
                title: "Error",
                description: err?.response?.data?.message || "Gagal menyimpan konfigurasi",
                type: "error",
            });
        } finally {
            isSubmittingRef.current = false;
            setSaving(false);
            eventBus.emit("loading", false);
        }
    };

    const handleAuthorize = async () => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setAuthorizing(true);
        eventBus.emit("loading", true);

        try {
            const res = await api.get("/outbound/shopee/auth-url", { withCredentials: true });
            if (res.data.success && res.data.auth_url) {
                // Buka halaman authorize Shopee di tab baru
                window.open(res.data.auth_url, "_blank");
                eventBus.emit("showAlert", {
                    title: "Halaman Authorize Dibuka",
                    description: "Selesaikan authorize di tab Shopee yang baru terbuka. Token akan otomatis tersimpan.",
                    type: "info",
                });
            }
        } catch (err: any) {
            eventBus.emit("showAlert", {
                title: "Error",
                description: err?.response?.data?.message || "Gagal generate auth URL",
                type: "error",
            });
        } finally {
            isSubmittingRef.current = false;
            setAuthorizing(false);
            eventBus.emit("loading", false);
        }
    };

    const handleRefreshToken = async () => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setRefreshing(true);
        eventBus.emit("loading", true);

        try {
            const res = await api.post("/outbound/shopee/refresh-token", {}, { withCredentials: true });
            if (res.data.success) {
                eventBus.emit("showAlert", {
                    title: "Token Di-refresh!",
                    description: "Access token berhasil diperbarui dan disimpan ke database",
                    type: "success",
                });
                fetchConfig();
            } else {
                eventBus.emit("showAlert", {
                    title: "Gagal",
                    description: res.data.message,
                    type: "error",
                });
            }
        } catch (err: any) {
            eventBus.emit("showAlert", {
                title: "Error",
                description: err?.response?.data?.message || "Gagal refresh token. Mungkin perlu authorize ulang.",
                type: "error",
            });
        } finally {
            isSubmittingRef.current = false;
            setRefreshing(false);
            eventBus.emit("loading", false);
        }
    };

    const handleManualUpdate = async () => {
        if (isSubmittingRef.current) return;

        if (!manualForm.shop_id && !manualForm.access_token && !manualForm.refresh_token) {
            eventBus.emit("showAlert", { title: "Error", description: "Isi minimal satu field", type: "error" });
            return;
        }

        isSubmittingRef.current = true;
        setSavingManual(true);
        eventBus.emit("loading", true);

        try {
            const body: Record<string, any> = {};
            if (manualForm.shop_id) body.shop_id = parseInt(manualForm.shop_id);
            if (manualForm.access_token) body.access_token = manualForm.access_token;
            if (manualForm.refresh_token) body.refresh_token = manualForm.refresh_token;

            const res = await api.post("/outbound/shopee/manual-update-token", body, { withCredentials: true });
            if (res.data.success) {
                eventBus.emit("showAlert", {
                    title: "Berhasil!",
                    description: "Token berhasil diupdate secara manual",
                    type: "success",
                });
                setShowManualModal(false);
                setManualForm({ shop_id: "", access_token: "", refresh_token: "" });
                fetchConfig();
            }
        } catch (err: any) {
            eventBus.emit("showAlert", {
                title: "Error",
                description: err?.response?.data?.message || "Gagal update token",
                type: "error",
            });
        } finally {
            isSubmittingRef.current = false;
            setSavingManual(false);
            eventBus.emit("loading", false);
        }
    };

    const envOptions = [
        { value: "sandbox", label: "Sandbox (Testing)", url: "https://openplatform.sandbox.test-stable.shopee.sg" },
        { value: "production", label: "Production", url: "https://openplatform.shopee.sg" },
    ];

    const fetchConfigRaw = async () => {
        try {
            const res = await api.get("/outbound/shopee/config-raw", { withCredentials: true });
            if (res.data.success && res.data.data) {
                setManualForm({
                    shop_id: res.data.data.shop_id?.toString() || "",
                    access_token: res.data.data.access_token || "",
                    refresh_token: res.data.data.refresh_token || "",
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenTestModal = () => {
        setTestResult(null);
        setTestError(null);
        setSelectedEndpoint(SHOPEE_TEST_ENDPOINTS[0].value);
        setShowTestModal(true);
    };

    const handleRunTest = async () => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setTestResult(null);
        setTestError(null);
        setTestLoading(true);

        try {
            const res = await api.get("/outbound/shopee/test-api", { withCredentials: true });
            setTestResult(res.data);
        } catch (err: any) {
            setTestError(err?.response?.data?.message || "Gagal menghubungi server");
        } finally {
            isSubmittingRef.current = false;
            setTestLoading(false);
        }
    };

    // Tambah setelah fetchConfig
    const fetchSchedulerStatus = async () => {
        try {
            const res = await api.get("/config/shopee/scheduler/status");
            setSchedulerRunning(res.data.running);
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleScheduler = async () => {
        setSchedulerLoading(true);
        try {
            if (schedulerRunning) {
                await api.post("/config/shopee/scheduler/stop");
                eventBus.emit("showAlert", { title: "Scheduler Dihentikan", description: "Sync otomatis dinonaktifkan", type: "info" });
            } else {
                await api.post("/config/shopee/scheduler/start");
                eventBus.emit("showAlert", { title: "Scheduler Berjalan", description: "Sync otomatis aktif", type: "success" });
            }
            fetchSchedulerStatus();
        } catch (err: any) {
            eventBus.emit("showAlert", { title: "Error", description: err?.response?.data?.message || "Gagal", type: "error" });
        } finally {
            setSchedulerLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-sm text-muted-foreground">Memuat konfigurasi...</div>;

    return (

        <Layout title="Settings" subTitle="Shopee Integration">
            <div className="max-w-2xl mx-auto p-6 space-y-6">
                <div>
                    <h1 className="text-xl font-semibold">Shopee Integration Settings</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Kelola konfigurasi dan token Shopee Open Platform untuk WMS
                    </p>
                </div>

                {/* Status Card */}
                {config && (
                    <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-medium">Status Koneksi</h2>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.environment === "production"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                                }`}>
                                {config.environment === "production" ? "Production" : "Sandbox"}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-muted-foreground text-xs">Partner ID</p>
                                <p className="font-mono">{config.partner_id}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs">Shop ID</p>
                                <p className="font-mono">{config.shop_id || "-"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs">Access Token</p>
                                <p className="font-mono">{config.access_token || "-"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs">Token Status</p>
                                <p className={config.has_token ? "text-green-600 text-xs" : "text-red-500 text-xs"}>
                                    {config.has_token ? "✓ Token tersimpan" : "✗ Belum ada token"}
                                </p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-muted-foreground text-xs">Terakhir diupdate</p>
                                <p className="text-xs">{config.updated_at ? new Date(config.updated_at).toLocaleString("id-ID") : "-"}</p>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-4 gap-2 pt-2 border-t">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleAuthorize}
                                disabled={authorizing}
                            >
                                {authorizing ? "Membuka..." : "🔑 Authorize Ulang"}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleRefreshToken}
                                disabled={refreshing || !config.has_refresh}
                            >
                                {refreshing ? "Memproses..." : "🔄 Refresh Token"}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                    await fetchConfigRaw();
                                    setShowManualModal(true);
                                }}
                            >
                                ✏️ Update Manual
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleOpenTestModal}
                            >
                                🧪 Test API
                            </Button>
                            <Button
                                size="sm"
                                variant={schedulerRunning ? "destructive" : "default"}
                                onClick={handleToggleScheduler}
                                disabled={schedulerLoading || !config?.has_token}
                            >
                                {schedulerLoading ? "..." : schedulerRunning ? "⏹ Stop Scheduler" : "▶ Start Scheduler"}
                            </Button>
                        </div>
                        {!config.has_refresh && (
                            <p className="text-xs text-orange-500">
                                ⚠ Refresh token tidak tersedia atau sudah expired. Lakukan Authorize Ulang.
                            </p>
                        )}
                    </div>
                )}

                {/* Form Konfigurasi */}
                <div className="border rounded-lg p-4 space-y-4">
                    <h2 className="text-sm font-medium">
                        {config ? "Update Konfigurasi" : "Setup Konfigurasi Baru"}
                    </h2>

                    {/* Environment selector */}
                    <div className="space-y-1.5">
                        <Label className="text-xs">Environment</Label>
                        <select
                            className="w-full border rounded px-3 py-2 text-sm"
                            value={form.environment}
                            onChange={(e) => {
                                const opt = envOptions.find((o) => o.value === e.target.value);
                                setForm((prev) => ({
                                    ...prev,
                                    environment: e.target.value,
                                    base_url: opt?.url || prev.base_url,
                                }));
                            }}
                        >
                            {envOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Partner ID</Label>
                        <Input
                            type="number"
                            placeholder="Contoh: 1231585"
                            value={form.partner_id}
                            onChange={(e) => setForm((prev) => ({ ...prev, partner_id: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Partner Key</Label>
                        <Input
                            type="password"
                            placeholder="shpk..."
                            value={form.partner_key}
                            onChange={(e) => setForm((prev) => ({ ...prev, partner_key: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">Dari Shopee Open Platform Console → App Detail</p>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Base URL</Label>
                        <Input
                            value={form.base_url}
                            onChange={(e) => setForm((prev) => ({ ...prev, base_url: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Push URL</Label>
                        <Input
                            value={form.push_url}
                            onChange={(e) => setForm((prev) => ({ ...prev, push_url: e.target.value }))}
                        />
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleSaveConfig}
                        disabled={saving}
                    >
                        {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
                    </Button>
                </div>

                {/* Panduan */}
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                    <h2 className="text-sm font-medium">Panduan Setup</h2>
                    <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>Isi Partner ID dan Partner Key dari Shopee Open Platform Console</li>
                        <li>Pilih environment sesuai kebutuhan (Sandbox untuk testing, Production untuk live)</li>
                        <li>Klik <strong>Simpan Konfigurasi</strong></li>
                        <li>Klik <strong>Authorize</strong> — akan terbuka halaman Shopee untuk approve akses</li>
                        <li>Setelah approve, token otomatis tersimpan ke database</li>
                        <li>Token akan di-refresh otomatis tiap 3 jam oleh scheduler</li>
                        <li>Jika muncul error token expired, klik <strong>Refresh Token</strong> atau <strong>Authorize Ulang</strong></li>
                    </ol>
                </div>
            </div>
            {showManualModal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-background bg-white border rounded-lg p-6 w-full max-w-md space-y-4 shadow-lg">
                        <div>
                            <h2 className="text-base font-medium">Update Token Manual</h2>
                            <p className="text-xs text-muted-foreground mt-1">
                                Isi field yang ingin diupdate. Field kosong tidak akan diubah.
                            </p>
                        </div>

                        <div className="bg-orange-50 border border-orange-200 rounded p-3 text-xs text-orange-700">
                            ⚠ Pastikan token yang dimasukkan valid. Token salah akan menyebabkan semua sinkronisasi gagal.
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Shop ID</Label>
                                <Input
                                    type="number"
                                    placeholder="Contoh: 123456789"
                                    value={manualForm.shop_id}
                                    onChange={(e) => setManualForm((prev) => ({ ...prev, shop_id: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Access Token</Label>
                                <Input
                                    type="text"
                                    placeholder="Token akses dari Shopee"
                                    value={manualForm.access_token}
                                    onChange={(e) => setManualForm((prev) => ({ ...prev, access_token: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Refresh Token</Label>
                                <Input
                                    type="text"
                                    placeholder="Token untuk refresh otomatis"
                                    value={manualForm.refresh_token}
                                    onChange={(e) => setManualForm((prev) => ({ ...prev, refresh_token: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    setShowManualModal(false);
                                    setManualForm({ shop_id: "", access_token: "", refresh_token: "" });
                                }}
                                disabled={savingManual}
                            >
                                Batal
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleManualUpdate}
                                disabled={savingManual}
                            >
                                {savingManual ? "Menyimpan..." : "Simpan"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}


            {showTestModal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-background bg-white border rounded-lg w-full max-w-2xl shadow-lg flex flex-col max-h-[80vh]">

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b">
                            <div>
                                <h2 className="text-base font-medium">Test API Shopee</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Pilih endpoint lalu klik Run Test
                                </p>
                            </div>
                            <button
                                onClick={() => setShowTestModal(false)}
                                className="text-muted-foreground hover:text-foreground text-lg leading-none px-1"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">

                            {/* Pilih endpoint */}
                            <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground">Endpoint</label>
                                <select
                                    className="w-full border rounded px-3 py-2 text-sm bg-background"
                                    value={selectedEndpoint}
                                    onChange={(e) => {
                                        setSelectedEndpoint(e.target.value);
                                        setTestResult(null);
                                        setTestError(null);
                                    }}
                                >
                                    {SHOPEE_TEST_ENDPOINTS.map((ep) => (
                                        <option key={ep.value} value={ep.value}>
                                            {ep.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Request info */}
                            {(() => {
                                const ep = SHOPEE_TEST_ENDPOINTS.find((e) => e.value === selectedEndpoint)!;
                                return (
                                    <div className="border rounded-lg overflow-hidden text-xs">
                                        <div className="bg-muted px-4 py-2 font-medium text-muted-foreground">
                                            Request
                                        </div>
                                        <div className="divide-y">
                                            <div className="flex gap-3 px-4 py-2.5">
                                                <span className="text-muted-foreground w-20 shrink-0">Method</span>
                                                <span className={`font-medium font-mono ${ep.method === "GET" ? "text-green-600" : "text-blue-600"}`}>
                                                    {ep.method}
                                                </span>
                                            </div>
                                            <div className="flex gap-3 px-4 py-2.5">
                                                <span className="text-muted-foreground w-20 shrink-0">Path</span>
                                                <span className="font-mono">{ep.path}</span>
                                            </div>
                                            <div className="flex gap-3 px-4 py-2.5">
                                                <span className="text-muted-foreground w-20 shrink-0">Headers</span>
                                                <span className="font-mono">Content-Type: application/json</span>
                                            </div>
                                            {testResult?.url && (
                                                <div className="flex gap-3 px-4 py-2.5">
                                                    <span className="text-muted-foreground w-20 shrink-0">Full URL</span>
                                                    <span className="font-mono break-all text-muted-foreground">{testResult.url}</span>
                                                </div>
                                            )}
                                            <div className="flex gap-3 px-4 py-2.5">
                                                <span className="text-muted-foreground w-20 shrink-0">Info</span>
                                                <span className="text-muted-foreground">{ep.description}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Loading */}
                            {testLoading && (
                                <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm">Menghubungi Shopee API...</span>
                                </div>
                            )}

                            {/* Error */}
                            {testError && !testLoading && (
                                <div className="border rounded-lg overflow-hidden text-xs">
                                    <div className="bg-red-50 border-b border-red-200 px-4 py-2 font-medium text-red-700">
                                        Response — Gagal
                                    </div>
                                    <div className="px-4 py-3 text-red-600">{testError}</div>
                                </div>
                            )}

                            {/* Result */}
                            {testResult && !testLoading && (
                                <div className="border rounded-lg overflow-hidden text-xs">
                                    <div className="bg-muted px-4 py-2 flex items-center justify-between">
                                        <span className="font-medium text-muted-foreground">Response</span>
                                        <span className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full ${!testResult.data?.error
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                            }`}>
                                            {!testResult.data?.error ? "✓ OK" : `✗ ${testResult.data.error}`}
                                        </span>
                                    </div>
                                    {testResult.data?.response?.order_list !== undefined && (
                                        <div className="px-4 py-2.5 border-b flex gap-3">
                                            <span className="text-muted-foreground w-20 shrink-0">Orders</span>
                                            <span className="font-medium">
                                                {testResult.data.response.order_list?.length ?? 0} order ditemukan
                                                {testResult.data.response.more && " · ada halaman berikutnya"}
                                            </span>
                                        </div>
                                    )}
                                    <div className="p-4">
                                        <pre className="bg-muted rounded p-3 overflow-x-auto leading-relaxed">
                                            {JSON.stringify(testResult.data, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 border-t flex justify-between items-center">
                            <button
                                onClick={handleRunTest}
                                disabled={testLoading}
                                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
                            >
                                {testResult ? "🔄 Ulangi Test" : ""}
                            </button>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => setShowTestModal(false)}>
                                    Tutup
                                </Button>
                                <Button size="sm" onClick={handleRunTest} disabled={testLoading}>
                                    {testLoading ? "Running..." : "▶ Run Test"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
