import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft, Clock, ExternalLink, FileText, Mail, Phone, User,
    Download, FileType,
} from 'lucide-react';

// ─── Sales portal: read-only registration snapshot ──────────────────────
//
// Reachable at /portal/sales/leads/{id}/registration — linked from the
// Actions cell on the Sales Leads page's Registration tab. Shows the
// form the lead filled at /register, reconstructed server-side from
// wherever each field landed (lead columns, work_info/education_notes
// JSON, LeadDocument rows).
//
// Strictly read-only. The Actions column also keeps an "Open lead" link
// for staff who need the full profile.
//
export default function LeadRegistration({ lead, sections = [], documents = [] }) {
    const fmtDateTime = (iso) => {
        if (! iso) return null;
        const d = new Date(iso);
        return d.toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' })
            + ' · ' + d.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' });
    };
    const fmtSize = (bytes) => {
        if (! bytes && bytes !== 0) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const registeredAt = fmtDateTime(lead.created_at);
    const visibleSections = sections.filter((s) => s.visible !== false);

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            <Head title={`${lead.name} — Registration`} />

            {/* Header */}
            <div className="flex flex-col gap-3">
                <Link
                    href="/portal/sales/leads?tab=registration"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors w-max"
                >
                    <ArrowLeft size={16} /> Back to Leads
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-400 mb-1">
                            Registration
                        </p>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{lead.name}</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Submitted via <span className="font-semibold text-gray-700">/register</span>
                            {registeredAt && <span className="text-gray-400"> · {registeredAt}</span>}
                            {lead.lead_id && <span className="text-gray-400 font-mono"> · {lead.lead_id}</span>}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/portal/sales/leads/${lead.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-colors shadow-sm"
                        >
                            Open lead profile <ExternalLink size={13} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

                {/* ── Sections ──────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/30">
                        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                            <FileText size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-bold text-gray-900">Registration form</h2>
                            <p className="text-[12px] text-gray-500 mt-0.5">
                                What {lead.first_name || 'this lead'} filled in at /register.
                            </p>
                        </div>
                        {registeredAt && (
                            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-md">
                                <Clock size={11} /> {registeredAt}
                            </span>
                        )}
                    </div>

                    <div className="p-6 space-y-6">
                        {visibleSections.map((section, idx) => (
                            <section key={section.title + idx}>
                                <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 mb-3 pb-2 border-b border-gray-100">
                                    {section.title}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                    {section.fields.map((f, i) => (
                                        <FieldRow key={i} field={f} />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>

                {/* ── Sidebar: contact + documents ─────────────────── */}
                <aside className="space-y-4">
                    {/* Contact card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 mb-4">
                            Lead
                        </p>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-11 h-11 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">
                                {(lead.first_name?.charAt(0) || '?')}{(lead.last_name?.charAt(0) || '')}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{lead.name}</p>
                                {lead.lead_id && (
                                    <p className="text-[11px] text-gray-500 font-mono">{lead.lead_id}</p>
                                )}
                            </div>
                        </div>

                        <ul className="space-y-2.5">
                            {lead.email && (
                                <li className="flex items-start gap-2.5 text-[13px] text-gray-700">
                                    <Mail size={13} className="text-gray-400 mt-0.5" />
                                    <a href={`mailto:${lead.email}`} className="hover:text-gray-900 hover:underline break-all">
                                        {lead.email}
                                    </a>
                                </li>
                            )}
                            {lead.phone && (
                                <li className="flex items-start gap-2.5 text-[13px] text-gray-700">
                                    <Phone size={13} className="text-gray-400 mt-0.5" />
                                    <a href={`tel:${lead.phone}`} className="hover:text-gray-900 hover:underline">
                                        {lead.phone}
                                    </a>
                                </li>
                            )}
                            {lead.stage && (
                                <li className="flex items-start gap-2.5 text-[13px] text-gray-700">
                                    <User size={13} className="text-gray-400 mt-0.5" />
                                    <span>Stage: <span className="font-semibold">{lead.stage}</span></span>
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Documents */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <p className="text-sm font-bold text-gray-900">Uploaded documents</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                                Files the lead attached at registration.
                            </p>
                        </div>
                        <div className="p-4 space-y-4">
                            {documents.map((bucket) => (
                                <div key={bucket.key}>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                                        {bucket.label}
                                    </p>
                                    {bucket.files.length === 0 ? (
                                        <p className="text-[12px] text-gray-400 italic">Not provided</p>
                                    ) : (
                                        <ul className="space-y-1.5">
                                            {bucket.files.map((f) => (
                                                <li key={f.id}>
                                                    <a
                                                        href={f.url || '#'}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-colors group"
                                                    >
                                                        <span className="flex items-center gap-2 min-w-0">
                                                            <FileType size={13} className="text-gray-400 group-hover:text-gray-900 shrink-0" />
                                                            <span className="text-[12px] font-medium text-gray-800 truncate">
                                                                {f.original_name}
                                                            </span>
                                                        </span>
                                                        <span className="flex items-center gap-1.5 text-[10px] text-gray-400 shrink-0">
                                                            {fmtSize(f.size)}
                                                            <Download size={11} className="text-gray-400 group-hover:text-gray-900" />
                                                        </span>
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

function FieldRow({ field }) {
    const { label, value, multiline } = field;
    const isEmpty = value === null || value === undefined || value === '' || value === 0 && label.toLowerCase().startsWith('number of');
    const displayValue = value === null || value === undefined || value === '' ? null : String(value);
    const fullWidth = multiline;

    return (
        <div className={fullWidth ? 'sm:col-span-2' : ''}>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 mb-1">
                {label}
            </p>
            {displayValue === null || isEmpty ? (
                <p className="text-[13px] text-gray-300 italic">Not provided</p>
            ) : multiline ? (
                <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap bg-gray-50/60 border border-gray-100 rounded-lg px-3 py-2.5">
                    {displayValue}
                </p>
            ) : (
                <p className="text-[13px] text-gray-800 font-medium">
                    {displayValue}
                </p>
            )}
        </div>
    );
}
