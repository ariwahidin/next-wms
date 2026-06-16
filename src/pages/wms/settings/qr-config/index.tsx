/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";
import Layout from "@/components/layout";

// ─── Types ────────────────────────────────────────────────────────────────────

type Owner = {
    ID: number;
    code: string;
    name: string;
};

type QRFieldMap = {
    sku: string;
    ean: string;
    serial: string;
    carton_serial: string;
    batch: string;
    mfg_date: string;
    qty_per_carton: string;
    inner_serial_start: string;
    inner_serial_end: string;
    product: string;
    brand: string;
    model: string;
};

type QRConfig = {
    ID?: number;
    owner_id: number;
    pattern_type: string;
    delimiter: string;
    mfg_date_format: string;
    qty_strip_unit: boolean;
    field_map: QRFieldMap;
};

type ParseResult = {
    sku?: string;
    ean?: string;
    serial?: string;
    carton_serial?: string;
    batch?: string;
    mfg_date?: string;
    qty_per_carton?: string;
    inner_serial_start?: string;
    inner_serial_end?: string;
    product?: string;
    brand?: string;
    model?: string;
    label_type?: string;
    [key: string]: string | undefined;
};

// ─── Default Values ───────────────────────────────────────────────────────────

const DEFAULT_FIELD_MAP: QRFieldMap = {
    sku: "SKU",
    ean: "EAN",
    serial: "SERIAL",
    carton_serial: "CARTON_SERIAL",
    batch: "BATCH",
    mfg_date: "MFG_DATE",
    qty_per_carton: "QTY_PER_CARTON",
    inner_serial_start: "INNER_SERIAL_START",
    inner_serial_end: "INNER_SERIAL_END",
    product: "PRODUCT",
    brand: "BRAND",
    model: "MODEL",
};

const DEFAULT_CONFIG: Omit<QRConfig, "owner_id"> = {
    pattern_type: "bracket_kv",
    delimiter: "",
    mfg_date_format: "YYYYMMDD",
    qty_strip_unit: true,
    field_map: DEFAULT_FIELD_MAP,
};

const FIELD_LABELS: Record<keyof QRFieldMap, string> = {
    sku: "SKU",
    ean: "EAN / Barcode",
    serial: "Serial Number (Unit)",
    carton_serial: "Carton Serial",
    batch: "Batch / Lot",
    mfg_date: "Mfg Date",
    qty_per_carton: "Qty Per Carton",
    inner_serial_start: "Inner Serial Start",
    inner_serial_end: "Inner Serial End",
    product: "Product Name",
    brand: "Brand",
    model: "Model",
};

const MFG_DATE_FORMATS = ["YYYYMMDD", "DDMMYYYY", "MMDDYYYY", "YYYYDDMM"];

const PATTERN_TYPES = [
    { value: "bracket_kv", label: "bracket_kv", desc: "Contoh: (1)SKU=ABC123" },
    { value: "positional", label: "positional", desc: "Posisi karakter tetap" },
    { value: "key_value", label: "key_value", desc: "Contoh: SKU|ABC123|EAN|..." },
];

const PARSE_RESULT_LABELS: Record<string, string> = {
    sku: "SKU",
    ean: "EAN",
    serial: "Serial",
    carton_serial: "Carton Serial",
    batch: "Batch",
    mfg_date: "Mfg Date",
    qty_per_carton: "Qty/Carton",
    inner_serial_start: "Inner Serial Start",
    inner_serial_end: "Inner Serial End",
    product: "Product",
    brand: "Brand",
    model: "Model",
    label_type: "Label Type",
};

// ─── Toggle Component ─────────────────────────────────────────────────────────

function Toggle({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (val: boolean) => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                checked ? "bg-blue-500" : "bg-gray-300"
            }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    checked ? "translate-x-6" : "translate-x-1"
                }`}
            />
        </button>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QRConfigPage() {
    const [owners, setOwners] = useState<Owner[]>([]);
    const [selectedOwnerID, setSelectedOwnerID] = useState<number | null>(null);
    const [config, setConfig] = useState<QRConfig | null>(null);
    const [form, setForm] = useState<Omit<QRConfig, "owner_id">>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const isSubmittingRef = useRef(false);

    // Test QR state
    const [testRaw, setTestRaw] = useState("");
    const [testResult, setTestResult] = useState<ParseResult | null>(null);
    const [testError, setTestError] = useState<string | null>(null);
    const [testing, setTesting] = useState(false);
    const [showTest, setShowTest] = useState(false);

    const selectedOwner = owners.find((o) => o.ID === selectedOwnerID);

    // ── Fetch owners ──────────────────────────────────────────────────────────
    const fetchOwners = async () => {
        try {
            const res = await api.get("/owners");
            if (res.data.success) {
                setOwners(res.data.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // ── Fetch QR config by owner ──────────────────────────────────────────────
    const fetchConfig = async (ownerCode: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/owners/qr-config?owner=${ownerCode}`);
            if (res.data.success) {
                const data: QRConfig = res.data.data;
                setConfig(data);
                setForm({
                    pattern_type: data.pattern_type || DEFAULT_CONFIG.pattern_type,
                    delimiter: data.delimiter ?? "",
                    mfg_date_format: data.mfg_date_format || DEFAULT_CONFIG.mfg_date_format,
                    qty_strip_unit: data.qty_strip_unit ?? true,
                    field_map: { ...DEFAULT_FIELD_MAP, ...data.field_map },
                });
            }
        } catch {
            setConfig(null);
            setForm(DEFAULT_CONFIG);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOwners();
    }, []);

    useEffect(() => {
        if (selectedOwnerID === null) return;
        const owner = owners.find((o) => o.ID === selectedOwnerID);
        if (owner) fetchConfig(owner.code);
        // Reset test state on owner change
        setTestRaw("");
        setTestResult(null);
        setTestError(null);
    }, [selectedOwnerID]);

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!selectedOwnerID || isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setSaving(true);

        try {
            const res = await api.put(`/owners/${selectedOwnerID}/qr-config`, {
                ...form,
                owner_id: selectedOwnerID,
            });
            if (res.data.success) {
                eventBus.emit("showAlert", {
                    title: "Tersimpan!",
                    description: "QR Config berhasil disimpan.",
                    type: "success",
                });
                const owner = owners.find((o) => o.ID === selectedOwnerID);
                if (owner) fetchConfig(owner.code);
            }
        } catch (err: any) {
            eventBus.emit("showAlert", {
                title: "Error",
                description: err?.response?.data?.message || "Gagal menyimpan config",
                type: "error",
            });
        } finally {
            isSubmittingRef.current = false;
            setSaving(false);
        }
    };

    // ── Reset to default ──────────────────────────────────────────────────────
    const handleReset = () => {
        setForm(DEFAULT_CONFIG);
    };

    // ── Test QR via API ───────────────────────────────────────────────────────
    const handleTest = async () => {
        if (!testRaw.trim() || !selectedOwner) return;
        setTesting(true);
        setTestResult(null);
        setTestError(null);
        try {
            const res = await api.post("/owners/qr-config/parse", {
                owner_code: selectedOwner.code,
                raw: testRaw,
            });
            if (res.data.success) {
                setTestResult(res.data.data);
            }
        } catch (err: any) {
            const msg = err?.response?.data?.error || "Gagal parse QR. Periksa format atau field mapping.";
            setTestError(msg);
        } finally {
            setTesting(false);
        }
    };

    // ── Field map updater ─────────────────────────────────────────────────────
    const updateFieldMap = (key: keyof QRFieldMap, value: string) => {
        setForm((prev) => ({
            ...prev,
            field_map: { ...prev.field_map, [key]: value },
        }));
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <Layout title="Settings" subTitle="QR Config">
            <div className="max-w-3xl mx-auto p-6 space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-xl font-semibold">QR Format Config</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Sesuaikan field mapping dan format parsing QR label per owner/supplier.
                    </p>
                </div>

                {/* Owner Selector */}
                <div className="border rounded-lg p-4 space-y-3">
                    <h2 className="text-sm font-medium">Pilih Owner</h2>
                    {owners.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Memuat daftar owner...</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {owners.map((owner) => (
                                <button
                                    key={owner.ID}
                                    onClick={() => setSelectedOwnerID(owner.ID)}
                                    className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                                        selectedOwnerID === owner.ID
                                            ? "border-blue-500 bg-blue-50 text-blue-700"
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    <div className="font-mono font-semibold text-xs">{owner.code}</div>
                                    <div className="text-xs text-muted-foreground truncate">{owner.name}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Empty state */}
                {!selectedOwnerID && (
                    <div className="text-sm text-muted-foreground text-center py-8 border rounded-lg border-dashed">
                        Pilih owner di atas untuk melihat dan mengubah QR config-nya.
                    </div>
                )}

                {/* Config Form */}
                {selectedOwnerID && (
                    <>
                        {loading ? (
                            <div className="text-sm text-muted-foreground py-4">Memuat config...</div>
                        ) : (
                            <>
                                {/* Status badge */}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span
                                        className={`px-2 py-0.5 rounded-full font-medium ${
                                            config?.ID
                                                ? "bg-green-100 text-green-700"
                                                : "bg-yellow-100 text-yellow-700"
                                        }`}
                                    >
                                        {config?.ID ? "Config tersimpan" : "Menggunakan default"}
                                    </span>
                                    <span>
                                        Owner: <strong>{selectedOwner?.code}</strong>
                                    </span>
                                </div>

                                {/* ── Parsing Rules ── */}
                                <div className="border rounded-lg p-4 space-y-4">
                                    <h2 className="text-sm font-medium">Aturan Parsing</h2>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                        {/* Pattern Type */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Pattern Type</Label>
                                            <select
                                                className="w-full border rounded px-3 py-2 text-sm"
                                                value={form.pattern_type}
                                                onChange={(e) =>
                                                    setForm((prev) => ({ ...prev, pattern_type: e.target.value }))
                                                }
                                            >
                                                {PATTERN_TYPES.map((p) => (
                                                    <option key={p.value} value={p.value}>
                                                        {p.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-muted-foreground">
                                                {PATTERN_TYPES.find((p) => p.value === form.pattern_type)?.desc}
                                            </p>
                                        </div>

                                        {/* Delimiter */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Delimiter</Label>
                                            <Input
                                                className="font-mono text-xs h-9"
                                                value={form.delimiter}
                                                onChange={(e) =>
                                                    setForm((prev) => ({ ...prev, delimiter: e.target.value }))
                                                }
                                                placeholder='Kosong = auto, atau "|" / "," / ";"'
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Digunakan untuk pattern <code className="bg-muted px-1 rounded">key_value</code>.
                                            </p>
                                        </div>

                                        {/* Mfg Date Format */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Format Mfg Date</Label>
                                            <select
                                                className="w-full border rounded px-3 py-2 text-sm"
                                                value={form.mfg_date_format}
                                                onChange={(e) =>
                                                    setForm((prev) => ({ ...prev, mfg_date_format: e.target.value }))
                                                }
                                            >
                                                {MFG_DATE_FORMATS.map((f) => (
                                                    <option key={f} value={f}>{f}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Qty Strip Unit */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Qty Strip Unit</Label>
                                            <div className="flex items-center gap-3 h-9">
                                                <Toggle
                                                    checked={form.qty_strip_unit}
                                                    onChange={(val) =>
                                                        setForm((prev) => ({ ...prev, qty_strip_unit: val }))
                                                    }
                                                />
                                                <span className="text-xs text-muted-foreground">
                                                    {form.qty_strip_unit
                                                        ? "parseInt — strip satuan (50PCS → 50)"
                                                        : "Number — harus angka murni"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Field Mapping ── */}
                                <div className="border rounded-lg p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-sm font-medium">Field Mapping</h2>
                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                                        >
                                            Reset ke default
                                        </button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Isi dengan nama key yang ada di QR label supplier. Contoh: jika supplier
                                        pakai <code className="bg-muted px-1 rounded">SN</code>, ganti field Serial
                                        menjadi <code className="bg-muted px-1 rounded">SN</code>.
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {(Object.keys(DEFAULT_FIELD_MAP) as (keyof QRFieldMap)[]).map((key) => (
                                            <div key={key} className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">
                                                    {FIELD_LABELS[key]}
                                                </Label>
                                                <Input
                                                    className="font-mono text-xs h-8"
                                                    value={form.field_map[key]}
                                                    onChange={(e) => updateFieldMap(key, e.target.value)}
                                                    placeholder={DEFAULT_FIELD_MAP[key]}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ── Test QR ── */}
                                <div className="border rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-sm font-medium">Test QR</h2>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowTest((v) => !v);
                                                setTestResult(null);
                                                setTestError(null);
                                                setTestRaw("");
                                            }}
                                            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                                        >
                                            {showTest ? "Sembunyikan" : "Tampilkan"}
                                        </button>
                                    </div>

                                    {showTest && (
                                        <div className="space-y-3">
                                            <p className="text-xs text-muted-foreground">
                                                Paste raw QR string untuk memverifikasi hasil parsing menggunakan
                                                config yang sudah tersimpan di server.
                                            </p>
                                            <textarea
                                                className="w-full border rounded px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                rows={3}
                                                placeholder="(1)SKU=20047101(2)EAN=6933257949997..."
                                                value={testRaw}
                                                onChange={(e) => {
                                                    setTestRaw(e.target.value);
                                                    setTestResult(null);
                                                    setTestError(null);
                                                }}
                                            />
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleTest}
                                                disabled={!testRaw.trim() || testing}
                                            >
                                                {testing ? "Testing..." : "▶ Run Test"}
                                            </Button>

                                            {/* Error */}
                                            {testError && (
                                                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                                                    {testError}
                                                </div>
                                            )}

                                            {/* Result */}
                                            {testResult && (
                                                <div className="border rounded-lg overflow-hidden text-xs">
                                                    <div className="bg-muted px-3 py-2 font-medium text-muted-foreground flex items-center justify-between">
                                                        <span>Hasil Parsing</span>
                                                        {testResult.label_type && (
                                                            <span
                                                                className={`px-2 py-0.5 rounded-full font-medium ${
                                                                    testResult.label_type === "UNIT"
                                                                        ? "bg-purple-100 text-purple-700"
                                                                        : testResult.label_type === "CARTON"
                                                                        ? "bg-blue-100 text-blue-700"
                                                                        : "bg-gray-100 text-gray-600"
                                                                }`}
                                                            >
                                                                {testResult.label_type}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="divide-y">
                                                        {Object.entries(testResult)
                                                            .filter(([k]) => k !== "label_type")
                                                            .map(([k, v]) => (
                                                                <div key={k} className="flex gap-3 px-3 py-2">
                                                                    <span className="text-muted-foreground w-36 shrink-0">
                                                                        {PARSE_RESULT_LABELS[k] ?? k}
                                                                    </span>
                                                                    <span className="font-mono">{v}</span>
                                                                </div>
                                                            ))}
                                                    </div>

                                                    {Object.keys(testResult).filter((k) => k !== "label_type").length === 0 && (
                                                        <div className="px-3 py-3 text-xs text-red-500">
                                                            Tidak ada field yang ter-parse. Periksa format QR atau field mapping.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* ── Save Button ── */}
                                <div className="flex gap-2">
                                    <Button
                                        className="flex-1"
                                        onClick={handleSave}
                                        disabled={saving}
                                    >
                                        {saving ? "Menyimpan..." : "Simpan Config"}
                                    </Button>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
}