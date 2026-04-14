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

    const [form, setForm] = useState({
        partner_id: "",
        partner_key: "",
        base_url: "https://openplatform.sandbox.test-stable.shopee.sg",
        push_url: "",
        environment: "sandbox",
    });

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

    const envOptions = [
        { value: "sandbox", label: "Sandbox (Testing)", url: "https://openplatform.sandbox.test-stable.shopee.sg" },
        { value: "production", label: "Production", url: "https://openplatform.shopee.sg" },
    ];

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
                        <div className="flex gap-2 pt-2 border-t">
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
        </Layout>
    );
}
