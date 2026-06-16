// pages/admin/company-settings.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Monitor, Palette, Building2, Image, ChevronDown, ChevronUp,
    Upload, Trash2, Plus, Check, Loader2, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Layout from '@/components/layout';
import api from '@/lib/api';
import eventBus from '@/utils/eventBus';
import themes, { ThemeName, THEME_META } from '@/components/login-themes';
import { CompanyConfig, SlideItem, DEFAULT_CONFIG } from '@/types/company-config';

// ─── Section Accordion ────────────────────────────────────────────────────────

function Section({
    icon: Icon,
    title,
    subtitle,
    children,
    defaultOpen = true,
}: {
    icon: React.ElementType;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border rounded-xl overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-blue-50">
                        <Icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900">{title}</p>
                        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                    </div>
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {open && <div className="px-5 pb-5 pt-1 bg-white border-t space-y-4">{children}</div>}
        </div>
    );
}

// ─── Color Picker Field ───────────────────────────────────────────────────────

function ColorField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs">{label}</Label>
            <div className="flex items-center gap-2">
                <div className="relative w-10 h-10 rounded-lg overflow-hidden border shadow-sm flex-shrink-0">
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                    />
                    <div className="w-full h-full" style={{ backgroundColor: value }} />
                </div>
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="font-mono text-xs h-9 uppercase"
                    placeholder="#000000"
                    maxLength={7}
                />
            </div>
        </div>
    );
}

// ─── Image Upload Button ──────────────────────────────────────────────────────

function ImageUpload({
    label,
    currentUrl,
    uploadType,
    onUploaded,
}: {
    label: string;
    currentUrl: string;
    uploadType: 'logo' | 'slide';
    onUploaded: (url: string) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (file: File) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', uploadType);
        try {
            const res = await api.post('/admin/company-config/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true,
            });
            if (res.data.success) {
                onUploaded(res.data.file_url);
                eventBus.emit('showAlert', { title: 'Upload berhasil', type: 'success' });
            }
        } catch {
            eventBus.emit('showAlert', { title: 'Upload gagal', type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-1.5">
            <Label className="text-xs">{label}</Label>
            <div className="flex items-center gap-3">
                {currentUrl && (
                    <img
                        src={currentUrl}
                        alt="preview"
                        className="w-10 h-10 object-contain rounded border bg-gray-50"
                    />
                )}
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-3 py-2 border rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    {uploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Upload className="w-3.5 h-3.5" />
                    )}
                    {uploading ? 'Uploading...' : 'Upload gambar'}
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpg,image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(file);
                        e.target.value = '';
                    }}
                />
            </div>
            <div className="flex gap-3">
                <span className="text-xs text-gray-400">atau tempel URL:</span>

            </div>
            <div className="flex gap-3">
                <Input
                    value={currentUrl}
                    onChange={(e) => onUploaded(e.target.value)}
                    className="text-xs h-8 flex-1"
                    placeholder="https://... atau /images/..."
                />
            </div>
        </div>
    );
}

// ─── Slide Item Editor ────────────────────────────────────────────────────────

function SlideEditor({
    slides,
    onChange,
}: {
    slides: SlideItem[];
    onChange: (slides: SlideItem[]) => void;
}) {
    const update = (idx: number, field: keyof SlideItem, value: string) => {
        const next = slides.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
        onChange(next);
    };

    const remove = (idx: number) => onChange(slides.filter((_, i) => i !== idx));

    const add = () =>
        onChange([...slides, { image_url: '', title: 'New Slide', subtitle: '' }]);

    const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleUpload = async (file: File, idx: number) => {
        setUploadingIdx(idx);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'slide');
        try {
            const res = await api.post('/admin/company-config/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true,
            });
            if (res.data.success) update(idx, 'image_url', res.data.file_url);
        } catch {
            eventBus.emit('showAlert', { title: 'Upload gagal', type: 'error' });
        } finally {
            setUploadingIdx(null);
        }
    };

    return (
        <div className="space-y-3">
            {slides.map((slide, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Slide {idx + 1}</span>
                        <button
                            type="button"
                            onClick={() => remove(idx)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Image */}
                    <div className="flex items-center gap-2">
                        {slide.image_url && (
                            <img
                                src={slide.image_url}
                                alt=""
                                className="w-16 h-10 object-cover rounded border flex-shrink-0"
                            />
                        )}
                        <button
                            type="button"
                            onClick={() => inputRefs.current[idx]?.click()}
                            disabled={uploadingIdx === idx}
                            className="flex items-center gap-1.5 px-2 py-1.5 border rounded text-xs text-gray-600 hover:bg-white transition-colors"
                        >
                            {uploadingIdx === idx ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <Upload className="w-3 h-3" />
                            )}
                            Upload
                        </button>
                        <input
                            ref={(el) => { inputRefs.current[idx] = el; }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpload(file, idx);
                                e.target.value = '';
                            }}
                        />
                        <Input
                            value={slide.image_url}
                            onChange={(e) => update(idx, 'image_url', e.target.value)}
                            placeholder="URL gambar"
                            className="text-xs h-7 flex-1"
                        />
                    </div>

                    {/* Title & Subtitle */}
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            value={slide.title}
                            onChange={(e) => update(idx, 'title', e.target.value)}
                            placeholder="Judul"
                            className="text-xs h-7"
                        />
                        <Input
                            value={slide.subtitle}
                            onChange={(e) => update(idx, 'subtitle', e.target.value)}
                            placeholder="Subtitle"
                            className="text-xs h-7"
                        />
                    </div>
                </div>
            ))}

            <button
                type="button"
                onClick={add}
                className="w-full flex items-center justify-center gap-2 py-2 border border-dashed rounded-lg text-xs text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
            >
                <Plus className="w-3.5 h-3.5" />
                Tambah Slide
            </button>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CompanySettingsPage() {
    const [form, setForm] = useState<CompanyConfig>(DEFAULT_CONFIG);
    const [preview, setPreview] = useState<CompanyConfig>(DEFAULT_CONFIG);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [previewDirty, setPreviewDirty] = useState(false);
    const isSavingRef = useRef(false);

    // ── Fetch existing config ─────────────────────────────────────────────────
    useEffect(() => {
        api
            .get('/company-config', { withCredentials: true })
            .then((res) => {
                if (res.data.success) {
                    setForm(res.data.data);
                    setPreview(res.data.data);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // ── Update form field ─────────────────────────────────────────────────────
    const set = useCallback(<K extends keyof CompanyConfig>(key: K, value: CompanyConfig[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setPreviewDirty(true);
    }, []);

    // ── Apply to preview ──────────────────────────────────────────────────────
    const applyPreview = () => {
        setPreview({ ...form });
        setPreviewDirty(false);
    };

    // ── Save to DB ────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (isSavingRef.current) return;
        isSavingRef.current = true;
        setSaving(true);
        try {
            const res = await api.put('/admin/company-config', form, { withCredentials: true });
            if (res.data.success) {
                setPreview({ ...form });
                setPreviewDirty(false);
                eventBus.emit('showAlert', {
                    title: 'Tersimpan!',
                    description: 'Company config berhasil diperbarui.',
                    type: 'success',
                });
            }
        } catch (err: any) {
            eventBus.emit('showAlert', {
                title: 'Error',
                description: err?.response?.data?.error || 'Gagal menyimpan',
                type: 'error',
            });
        } finally {
            isSavingRef.current = false;
            setSaving(false);
        }
    };

    // ── Theme preview component ───────────────────────────────────────────────
    const ThemeComponent = themes[(preview.login_theme as ThemeName) ?? 'ThemeModern'];

    if (loading) {
        return (
            <Layout title="Settings" subTitle="Company Config">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Settings" subTitle="Company Config">
            <div className="flex h-[calc(100vh-120px)] overflow-hidden">

                {/* ── Left Panel: Form ── */}
                <div className="w-[420px] flex-shrink-0 flex flex-col border-r bg-gray-50">
                    {/* Header */}
                    <div className="px-5 py-4 bg-white border-b flex items-center justify-between">
                        <div>
                            <h1 className="text-sm font-semibold text-gray-900">Company Settings</h1>
                            <p className="text-xs text-gray-500">Perubahan ditampilkan di preview sebelum disimpan</p>
                        </div>
                        <Button size="sm" onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Menyimpan...</>
                            ) : (
                                <><Check className="w-3.5 h-3.5 mr-1.5" /> Simpan</>
                            )}
                        </Button>
                    </div>

                    {/* Scrollable form */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">

                        {/* ── Identitas Perusahaan ── */}
                        <Section icon={Building2} title="Identitas Perusahaan" subtitle="Nama, kontak, alamat">
                            <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Nama Perusahaan</Label>
                                    <Input value={form.company_name} onChange={(e) => set('company_name', e.target.value)}
                                        className="text-sm" placeholder="PT ..." />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Nama Pendek</Label>
                                    <Input value={form.company_short} onChange={(e) => set('company_short', e.target.value)}
                                        className="text-sm" placeholder="Yusen Logistics" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Alamat</Label>
                                    <textarea
                                        value={form.address}
                                        onChange={(e) => set('address', e.target.value)}
                                        rows={2}
                                        className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
                                        placeholder="Jl. ..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Telepon</Label>
                                        <Input value={form.phone} onChange={(e) => set('phone', e.target.value)}
                                            className="text-sm" placeholder="+62 21 ..." />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Email</Label>
                                        <Input value={form.email} onChange={(e) => set('email', e.target.value)}
                                            className="text-sm" placeholder="info@..." />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Website</Label>
                                    <Input value={form.website} onChange={(e) => set('website', e.target.value)}
                                        className="text-sm" placeholder="https://..." />
                                </div>
                            </div>
                        </Section>

                        {/* ── Aplikasi ── */}
                        <Section icon={Monitor} title="Aplikasi" subtitle="Nama app, tagline, logo">
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Nama Aplikasi</Label>
                                    <Input value={form.app_name} onChange={(e) => set('app_name', e.target.value)}
                                        className="text-sm" placeholder="YuTrackWMS" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Tagline</Label>
                                    <Input value={form.tagline} onChange={(e) => set('tagline', e.target.value)}
                                        className="text-sm" placeholder="Track Everything in Warehouse" />
                                </div>
                                <ImageUpload
                                    label="Logo"
                                    currentUrl={form.logo_url}
                                    uploadType="logo"
                                    onUploaded={(url) => set('logo_url', url)}
                                />
                            </div>
                        </Section>

                        {/* ── Branding ── */}
                        <Section icon={Palette} title="Branding" subtitle="Warna utama dan aksen">
                            <div className="grid grid-cols-2 gap-4">
                                <ColorField
                                    label="Warna Utama"
                                    value={form.primary_color}
                                    onChange={(v) => set('primary_color', v)}
                                />
                                <ColorField
                                    label="Warna Aksen"
                                    value={form.accent_color}
                                    onChange={(v) => set('accent_color', v)}
                                />
                            </div>
                        </Section>

                        {/* ── Login Page ── */}
                        <Section icon={Image} title="Tampilan Login" subtitle="Theme dan slide carousel">
                            <div className="space-y-4">
                                {/* Theme selector */}
                                <div className="space-y-2">
                                    <Label className="text-xs">Pilih Theme</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(Object.keys(THEME_META) as ThemeName[]).map((key) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => set('login_theme', key)}
                                                className={`border rounded-lg p-3 text-left transition-all ${form.login_theme === key
                                                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <p className={`text-xs font-semibold ${form.login_theme === key ? 'text-blue-700' : 'text-gray-700'}`}>
                                                    {THEME_META[key].label}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">
                                                    {THEME_META[key].description}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Slides */}
                                <div className="space-y-2">
                                    <Label className="text-xs">Slide Carousel</Label>
                                    <p className="text-xs text-gray-400">Digunakan pada theme Modern dan Dark.</p>
                                    <SlideEditor
                                        slides={form.login_slides ?? []}
                                        onChange={(slides) => set('login_slides', slides)}
                                    />
                                </div>
                            </div>
                        </Section>
                    </div>

                    {/* Apply to preview bar */}
                    {previewDirty && (
                        <div className="px-4 py-3 bg-amber-50 border-t border-amber-200 flex items-center justify-between">
                            <p className="text-xs text-amber-700">Ada perubahan yang belum ditampilkan di preview</p>
                            <button
                                type="button"
                                onClick={applyPreview}
                                className="flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2"
                            >
                                <Eye className="w-3.5 h-3.5" />
                                Tampilkan
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Right Panel: Live Preview ── */}
                <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
                    <div className="px-4 py-2.5 bg-white border-b flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                <div className="w-3 h-3 rounded-full bg-green-400" />
                            </div>
                            <span className="text-xs text-gray-400 font-mono ml-2">Preview — Login Page</span>
                        </div>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                            {THEME_META[(preview.login_theme as ThemeName) ?? 'ThemeModern']?.label}
                        </span>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <div className="min-h-full scale-[0.85] origin-top-left w-[117%]">
                            <ThemeComponent
                                config={preview}
                                onSubmit={(e) => e.preventDefault()}
                                username=""
                                password=""
                                setUsername={() => { }}
                                setPassword={() => { }}
                                isPreview={true}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}