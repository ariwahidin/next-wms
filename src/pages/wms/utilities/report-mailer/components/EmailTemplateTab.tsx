/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailTemplate {
    email_subject: string;
    email_header: string;
    email_body: string;
    email_footer: string;
    header_color: string;
}

interface Props {
    reportId: number;
    reportName: string;
    description: string;
}

// ─── Placeholders ─────────────────────────────────────────────────────────────

const PLACEHOLDERS = [
    { key: '{{report_name}}', label: 'Report Name' },
    { key: '{{description}}', label: 'Description' },
    { key: '{{generated_date}}', label: 'Generated Date' },
    { key: '{{generated_date_short}}', label: 'Date (Short)' },
    { key: '{{output_label}}', label: 'Output Label' },
    { key: '{{sheet_list}}', label: 'Sheet List (HTML)' },
    { key: '{{sheet_list_plain}}', label: 'Sheet List (Text)' },
    { key: '{{year}}', label: 'Year' },
];

const PRESET_COLORS = [
    '#1E40AF', '#1D4ED8', '#0F766E', '#065F46',
    '#7C3AED', '#B91C1C', '#92400E', '#374151',
];

const defaultTemplate: EmailTemplate = {
    email_subject: '[WMS Report] {{report_name}} - {{generated_date_short}}',
    email_header: '{{report_name}}',
    email_body: `Dear Team,

Please find the attached report generated automatically by the WMS system.

<table style="border-collapse:collapse;font-size:13px;margin-top:12px;">
  <tr><td style="color:#6b7280;padding:3px 16px 3px 0;white-space:nowrap;">Report Name</td><td><b>{{report_name}}</b></td></tr>
  <tr><td style="color:#6b7280;padding:3px 16px 3px 0;">Generated</td><td>{{generated_date}}</td></tr>
  <tr><td style="color:#6b7280;padding:3px 16px 3px 0;">Output</td><td>{{output_label}}</td></tr>
  <tr><td style="color:#6b7280;padding:3px 16px 3px 0;vertical-align:top;">Contents</td><td>{{sheet_list}}</td></tr>
</table>

<p style="margin-top:16px;">Should you have any questions regarding this report, please contact the warehouse operations team.</p>`,
    email_footer: `© {{year}} Warehouse Management System. This is an automated message — please do not reply directly to this email.`,
    header_color: '#1E40AF',
};

// ─── Preview Helper ───────────────────────────────────────────────────────────

const resolvePlaceholders = (text: string, reportName: string, description: string) => {
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const day = String(now.getDate()).padStart(2, '0');
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');

    return text
        .replace(/{{report_name}}/g, reportName || 'Report Name')
        .replace(/{{description}}/g, description || 'Report Description')
        .replace(/{{generated_date}}/g, `${day} ${month} ${year}, ${hour}:${minute} WIB`)
        .replace(/{{generated_date_short}}/g, `${day} ${month.slice(0, 3)} ${year}`)
        .replace(/{{output_label}}/g, '1 Excel file (multi-sheet)')
        .replace(/{{sheet_list}}/g, '<ul style="margin:4px 0;padding-left:18px;"><li>Sheet 1</li><li>Sheet 2</li></ul>')
        .replace(/{{sheet_list_plain}}/g, 'Sheet 1, Sheet 2')
        .replace(/{{year}}/g, String(year));
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function EmailTemplateTab({ reportId, reportName, description }: Props) {
    const [template, setTemplate] = useState<EmailTemplate>(defaultTemplate);
    const [activeSection, setActiveSection] = useState<'subject' | 'header' | 'body' | 'footer'>('header');
    const [showPreview, setShowPreview] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // ─── Fetch ─────────────────────────────────────────────────────────────────

    const fetchTemplate = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/report-mailer/reports/${reportId}`, { withCredentials: true });
            const r = res.data.data;
            setTemplate({
                email_subject: r.email_subject || defaultTemplate.email_subject,
                email_header: r.email_header || defaultTemplate.email_header,
                email_body: r.email_body || defaultTemplate.email_body,
                email_footer: r.email_footer || defaultTemplate.email_footer,
                header_color: r.header_color || defaultTemplate.header_color,
            });
        } catch (e: any) {
            setError('Gagal memuat template');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplate();
    }, [reportId]);

    // ─── Save ──────────────────────────────────────────────────────────────────

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            await api.put(
                `/report-mailer/reports/${reportId}/email-template`,
                template,
                { withCredentials: true }
            );
            setSuccess('Email template berhasil disimpan');
        } catch (e: any) {
            setError(e.response?.data?.error || 'Gagal menyimpan template');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (!confirm('Reset ke template default?')) return;
        setTemplate(defaultTemplate);
    };

    // ─── Insert Placeholder ────────────────────────────────────────────────────

    const insertPlaceholder = (placeholder: string) => {
        const key = activeSection === 'subject' ? 'email_subject'
            : activeSection === 'header' ? 'email_header'
                : activeSection === 'body' ? 'email_body'
                    : 'email_footer';
        setTemplate((prev) => ({ ...prev, [key]: prev[key] + placeholder }));
    };

    // ─── Preview HTML ──────────────────────────────────────────────────────────

    const buildPreviewHTML = () => {
        const header = resolvePlaceholders(template.email_header, reportName, description);
        const body = resolvePlaceholders(template.email_body, reportName, description);
        const footer = resolvePlaceholders(template.email_footer, reportName, description);

        return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:24px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:${template.header_color};padding:24px 32px;">
            <div style="color:#fff;font-size:18px;font-weight:bold;line-height:1.4;">${header}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;color:#374151;font-size:14px;line-height:1.7;">${body}</td>
        </tr>
        <tr>
          <td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #E5E7EB;margin:0;"></td>
        </tr>
        <tr>
          <td style="padding:16px 32px;color:#9CA3AF;font-size:12px;line-height:1.6;">${footer}</td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
    };

    // ─── Render ────────────────────────────────────────────────────────────────

    if (loading) return <div className="p-6 text-sm text-gray-400">Memuat template...</div>;

    const sections = [
        { key: 'subject' as const, label: 'Subject' },
        { key: 'header' as const, label: 'Header' },
        { key: 'body' as const, label: 'Body' },
        { key: 'footer' as const, label: 'Footer' },
    ];

    return (
        <div className="space-y-4">
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

            {/* Header Color */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <label className="block text-xs text-gray-500 mb-3">Header Color</label>
                <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                        {PRESET_COLORS.map((color) => (
                            <button
                                key={color}
                                onClick={() => setTemplate({ ...template, header_color: color })}
                                className={`w-7 h-7 rounded-full border-2 transition-all ${template.header_color === color ? 'border-gray-800 scale-110' : 'border-transparent'
                                    }`}
                                style={{ background: color }}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                        <input
                            type="color"
                            value={template.header_color}
                            onChange={(e) => setTemplate({ ...template, header_color: e.target.value })}
                            className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                        />
                        <span className="text-xs text-gray-500 font-mono">{template.header_color}</span>
                    </div>
                    {/* Preview strip */}
                    <div
                        className="flex-1 h-8 rounded-lg ml-2"
                        style={{ background: template.header_color }}
                    />
                </div>
            </div>

            {/* Editor */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Section tabs */}
                <div className="flex border-b border-gray-200">
                    {sections.map((s) => (
                        <button
                            key={s.key}
                            onClick={() => setActiveSection(s.key)}
                            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeSection === s.key
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                <div className="p-5 space-y-3">
                    {/* Placeholder buttons */}
                    <div>
                        <p className="text-xs text-gray-400 mb-2">Insert placeholder:</p>
                        <div className="flex flex-wrap gap-1.5">
                            {PLACEHOLDERS.map((p) => (
                                <button
                                    key={p.key}
                                    onClick={() => insertPlaceholder(p.key)}
                                    className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200 font-mono"
                                >
                                    {p.key}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Subject */}
                    {activeSection === 'subject' && (
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Email Subject</label>
                            <input
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={template.email_subject}
                                onChange={(e) => setTemplate({ ...template, email_subject: e.target.value })}
                                placeholder="[WMS Report] {{report_name}} - {{generated_date_short}}"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                Preview: <span className="font-medium text-gray-600">
                                    {resolvePlaceholders(template.email_subject, reportName, description)}
                                </span>
                            </p>
                        </div>
                    )}

                    {/* Header */}
                    {activeSection === 'header' && (
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Header Content (HTML diizinkan)</label>
                            <textarea
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={4}
                                value={template.email_header}
                                onChange={(e) => setTemplate({ ...template, email_header: e.target.value })}
                                placeholder="{{report_name}}"
                            />
                        </div>
                    )}

                    {/* Body */}
                    {activeSection === 'body' && (
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Body Content (HTML diizinkan)</label>
                            <textarea
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={14}
                                value={template.email_body}
                                onChange={(e) => setTemplate({ ...template, email_body: e.target.value })}
                            />
                        </div>
                    )}

                    {/* Footer */}
                    {activeSection === 'footer' && (
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Footer Content (HTML diizinkan)</label>
                            <textarea
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={4}
                                value={template.email_footer}
                                onChange={(e) => setTemplate({ ...template, email_footer: e.target.value })}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm px-4 py-2 rounded-lg"
                    >
                        {showPreview ? '✕ Tutup Preview' : '👁 Preview Email'}
                    </button>
                    <button
                        onClick={handleReset}
                        className="border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm px-4 py-2 rounded-lg"
                    >
                        Reset Default
                    </button>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-lg disabled:opacity-50"
                >
                    {saving ? 'Menyimpan...' : 'Simpan Template'}
                </button>
            </div>

            {/* Live Preview */}
            {showPreview && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Preview Email</span>
                        <span className="text-xs text-gray-400">
                            Subject: {resolvePlaceholders(template.email_subject, reportName, description)}
                        </span>
                    </div>
                    <div className="p-4 bg-gray-50">
                        <iframe
                            srcDoc={buildPreviewHTML()}
                            className="w-full rounded-lg border border-gray-200"
                            style={{ height: '500px' }}
                            title="Email Preview"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}