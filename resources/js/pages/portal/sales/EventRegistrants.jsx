import { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft, Calendar, MapPin, Users, Search, Eye, ExternalLink,
    ChevronDown, StickyNote,
} from 'lucide-react';

// ─── Full-page registrants view ────────────────────────────────────────
//
// Replaces the old drawer modal that used to open on
// /portal/sales/leads → Events tab → "View registrants".
//
// Each row shows the lead's stage (editable via the same picker pattern
// used elsewhere in the sales portal), contact details, notes preview
// with "updated by X" caption, and two actions: View Registration (the
// form the lead filled) and Open lead (the full profile).
//
export default function EventRegistrants({ event, registrations = [], statuses = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [openStageId, setOpenStageId] = useState(null);
    const [savingId, setSavingId] = useState(null);
    const [rows, setRows] = useState(registrations);

    const changeStage = (reg, stage) => {
        setSavingId(reg.id);
        router.post(`/portal/sales/leads/${reg.id}`, { status: stage }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setRows((prev) => prev.map((r) => (r.id === reg.id ? { ...r, status: stage } : r))),
            onFinish: () => setSavingId(null),
        });
        setOpenStageId(null);
    };

    const filtered = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (! q) return rows;
        return rows.filter((r) => {
            const name = (r.name || '').toLowerCase();
            const email = (r.email || '').toLowerCase();
            return name.includes(q) || email.includes(q);
        });
    }, [rows, searchTerm]);

    const fmtDate = (iso) =>
        iso ? new Date(iso).toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
    const fmtDateTime = (iso) => {
        if (! iso) return null;
        const d = new Date(iso);
        return d.toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' })
            + ' · ' + d.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            <Head title={`Registrants — ${event.name}`} />

            {/* Header */}
            <div className="flex flex-col gap-3">
                <Link
                    href="/portal/sales/leads?tab=events"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors w-max"
                >
                    <ArrowLeft size={16} /> Back to Leads
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-400 mb-1">
                            Event registrants
                        </p>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{event.name}</h1>
                        <p className="text-sm text-gray-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            {event.type && <span>{event.type}</span>}
                            {event.date_from && <span className="text-gray-400"> · {fmtDate(event.date_from)}</span>}
                            {(event.location || event.mode) && (
                                <span className="inline-flex items-center gap-1 text-gray-400">
                                    · <MapPin size={12} /> {event.location || event.mode}
                                </span>
                            )}
                            {event.event_code && (
                                <span className="font-mono text-[11px] text-gray-400">· {event.event_code}</span>
                            )}
                        </p>
                    </div>
                    <div className="w-full sm:w-72 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search name or email…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Summary tile row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SummaryTile
                    icon={<Users className="w-5 h-5" />}
                    label="Registrants"
                    value={rows.length}
                    tone="blue"
                />
                <SummaryTile
                    icon={<StickyNote className="w-5 h-5" />}
                    label="With notes"
                    value={rows.filter((r) => r.event_notes && r.event_notes.trim() !== '').length}
                    tone="amber"
                />
                <SummaryTile
                    icon={<Calendar className="w-5 h-5" />}
                    label="Date"
                    value={fmtDate(event.date_from) || '—'}
                    tone="gray"
                    valueClass="text-base"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-gray-50/60 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                <th className="px-5 py-3">Lead</th>
                                <th className="px-3 py-3">Stage</th>
                                <th className="px-3 py-3">Contact</th>
                                <th className="px-3 py-3">Notes</th>
                                <th className="px-3 py-3">Registered</th>
                                <th className="px-3 py-3 text-right pr-5">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                                        <Users size={26} className="mx-auto mb-2 text-gray-300" />
                                        <p className="text-sm font-medium">No registrants yet</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Share the registration link to start collecting sign-ups.
                                        </p>
                                    </td>
                                </tr>
                            ) : filtered.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50/60 transition-colors align-top">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                                {(r.first_name?.charAt(0) || '?')}{(r.last_name?.charAt(0) || '')}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-bold text-gray-900 truncate">{r.name}</p>
                                                {r.lead_id && (
                                                    <p className="text-[10px] text-gray-400 tabular-nums font-mono">
                                                        {r.lead_id}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 relative">
                                        <StagePicker
                                            lead={r}
                                            stages={statuses}
                                            open={openStageId === r.id}
                                            onToggle={() => setOpenStageId(openStageId === r.id ? null : r.id)}
                                            onClose={() => setOpenStageId(null)}
                                            onSelect={(stage) => changeStage(r, stage)}
                                            isSaving={savingId === r.id}
                                        />
                                    </td>
                                    <td className="px-3 py-3 text-gray-600">
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            {r.email && (
                                                <a href={`mailto:${r.email}`} className="text-[12px] hover:text-gray-900 hover:underline truncate">
                                                    {r.email}
                                                </a>
                                            )}
                                            {r.phone && (
                                                <a href={`tel:${r.phone}`} className="text-[11px] text-gray-500 hover:text-gray-900">
                                                    {r.phone}
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 max-w-[260px]">
                                        {r.event_notes ? (
                                            <div className="min-w-0">
                                                <p
                                                    className="text-[12px] text-gray-800 line-clamp-2 leading-relaxed"
                                                    title={r.event_notes}
                                                >
                                                    {r.event_notes}
                                                </p>
                                                {r.event_notes_updated_at && (
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        Updated {fmtDateTime(r.event_notes_updated_at)}
                                                        {r.event_notes_editor?.name && (
                                                            <span className="text-gray-500"> by {r.event_notes_editor.name}</span>
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-[11px] text-gray-400 italic">No notes yet</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-3 text-[12px] text-gray-600 whitespace-nowrap">
                                        {fmtDate(r.created_at) || '—'}
                                    </td>
                                    <td className="px-3 py-3 pr-5">
                                        <div className="flex items-center justify-end gap-3">
                                            <Link
                                                href={`/admin/events/${event.id}/registrants/${r.id}`}
                                                className="inline-flex items-center gap-1 text-[12px] font-semibold text-gray-700 hover:text-gray-900 hover:underline whitespace-nowrap"
                                                title="Open the registration form the lead filled + notes"
                                            >
                                                <Eye size={13} /> View Registration
                                            </Link>
                                            <Link
                                                href={`/portal/sales/leads/${r.id}`}
                                                className="inline-flex items-center gap-1 text-[12px] font-semibold text-gray-500 hover:text-gray-900 whitespace-nowrap"
                                            >
                                                Open <ExternalLink size={11} />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Small stage picker — mirrors the one on the sales Leads.jsx ────
function StagePicker({ lead, stages, open, onToggle, onClose, onSelect, isSaving }) {
    return (
        <div className="relative">
            <button
                type="button"
                onClick={onToggle}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-50"
            >
                {lead.status || 'Set stage'}
                <ChevronDown size={11} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={onClose} />
                    <div className="absolute left-0 top-full mt-1.5 z-20 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto">
                        {stages.map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => onSelect(s)}
                                className={`w-full text-left px-3 py-2 text-[12px] font-medium hover:bg-gray-50 transition-colors ${
                                    s === lead.status ? 'text-gray-900 bg-gray-50' : 'text-gray-700'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Summary tile ───────────────────────────────────────────────────
function SummaryTile({ icon, label, value, tone = 'gray', valueClass = '' }) {
    const tones = {
        blue:  'bg-blue-50 text-blue-600',
        amber: 'bg-amber-50 text-amber-700',
        gray:  'bg-gray-100 text-gray-700',
    };
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tones[tone] || tones.gray}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">{label}</p>
                <p className={`text-2xl font-bold text-gray-900 leading-none mt-1 ${valueClass}`}>{value}</p>
            </div>
        </div>
    );
}
