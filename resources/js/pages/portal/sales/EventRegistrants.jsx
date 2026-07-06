import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft, Calendar, MapPin, Users, Search, Eye, StickyNote, Mail, Phone,
    ChevronRight as ChevronRightIcon,
} from 'lucide-react';
// Reuse the exact pieces the Open-opportunities table uses so this table
// reads identically (colour-coded stage picker, priority-tinted avatar,
// expandable dashboard panel, same helpers).
import {
    StagePicker, LeadDashboardPanel, initials, priorityMeta, priorityRank, fmtDateShort, fmtTime,
} from '@/pages/portal/sales/Leads';

const priorityLabel = (p) => (p ? `Priority: ${p[0].toUpperCase()}${p.slice(1)}` : 'No priority set');

// ─── Full-page registrants view ────────────────────────────────────────
//
// Mirrors the Open-opportunities table design: priority-tinted avatar,
// colour-coded stage picker, merged contact, location, note, registered.
// The single row action is "View Registration" (the form the lead filled).
//
export default function EventRegistrants({ event, registrations = [], statuses = [], portalBase = '/portal/sales' }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [openStageId, setOpenStageId] = useState(null);
    const [savingId, setSavingId] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [rows, setRows] = useState(registrations);
    const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

    const changeStage = (reg, stage) => {
        setSavingId(reg.id);
        router.post(`${portalBase}/leads/${reg.id}`, { status: stage }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setRows((prev) => prev.map((r) => (r.id === reg.id ? { ...r, status: stage } : r))),
            onFinish: () => setSavingId(null),
        });
        setOpenStageId(null);
    };

    const filtered = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        const matched = ! q ? rows : rows.filter((r) => {
            const name = (r.name || '').toLowerCase();
            const email = (r.email || '').toLowerCase();
            return name.includes(q) || email.includes(q);
        });
        // Priority always leads: urgent → medium → low → none.
        return [...matched].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
    }, [rows, searchTerm]);

    const fmtDate = (iso) =>
        iso ? new Date(iso).toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            <Head title={`Registrants — ${event.name}`} />

            {/* Header */}
            <div className="flex flex-col gap-3">
                <Link
                    href={`${portalBase}/leads?tab=events`}
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

            {/* Table — mirrors the Open-opportunities design */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible">
                <div className="overflow-x-auto overflow-y-visible">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-gray-50/60 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                <th className="pl-4 pr-2 py-3 w-6" />
                                <th className="px-3 py-3">Lead</th>
                                <th className="px-3 py-3">Stage</th>
                                <th className="px-3 py-3">Contact</th>
                                <th className="px-3 py-3">Location</th>
                                <th className="px-3 py-3">Note</th>
                                <th className="px-3 py-3">Registered</th>
                                <th className="px-3 py-3 text-right pr-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center text-gray-400">
                                        <Users size={26} className="mx-auto mb-2 text-gray-300" />
                                        <p className="text-sm font-medium">No registrants yet</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Share the registration link to start collecting sign-ups.
                                        </p>
                                    </td>
                                </tr>
                            ) : filtered.map((r) => {
                                const isExpanded = expandedId === r.id;
                                return (
                                <React.Fragment key={r.id}>
                                <tr className={`group transition-colors ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'}`}>
                                    {/* Expand toggle — chevron rotates when open. */}
                                    <td className="pl-4 pr-2 py-2.5">
                                        <button
                                            type="button"
                                            onClick={() => toggleExpand(r.id)}
                                            className="inline-flex items-center justify-center w-5 h-5 rounded text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                            title={isExpanded ? 'Collapse details' : 'Expand details'}
                                        >
                                            <ChevronRightIcon size={14} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                        </button>
                                    </td>

                                    {/* LEAD — priority-tinted avatar + name */}
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-2.5 min-w-[180px]">
                                            <div
                                                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                                                    priorityMeta(r.priority) ? `${priorityMeta(r.priority).dot} text-white` : 'bg-gray-200 text-gray-500'
                                                }`}
                                                title={priorityLabel(r.priority)}
                                            >
                                                {initials(r.name)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-semibold text-gray-900 text-xs truncate">{r.name}</div>
                                                {r.lead_id && (
                                                    <div className="text-[10px] text-gray-400 font-mono truncate">{r.lead_id}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* STAGE — colour-coded picker, identical to Open opportunities */}
                                    <td className="px-3 py-2.5 relative">
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

                                    {/* CONTACT — email + phone merged */}
                                    <td className="px-3 py-2.5">
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <div className="inline-flex items-center gap-1.5 text-gray-600">
                                                <Mail size={11} className="text-gray-300 flex-shrink-0" />
                                                <span className="truncate max-w-[180px]">{r.email || '—'}</span>
                                            </div>
                                            {r.phone ? (
                                                <div className="inline-flex items-center gap-1.5 text-gray-500 whitespace-nowrap">
                                                    <Phone size={11} className="text-gray-300 flex-shrink-0" />
                                                    <span>{r.phone}</span>
                                                </div>
                                            ) : null}
                                        </div>
                                    </td>

                                    {/* LOCATION */}
                                    <td className="px-3 py-2.5">
                                        {r.location ? (
                                            <div className="inline-flex items-center gap-1.5 text-gray-600">
                                                <MapPin size={11} className="text-gray-300 flex-shrink-0" />
                                                <span className="truncate max-w-[140px]">{r.location}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>

                                    {/* NOTE — event note + who last edited it */}
                                    <td className="px-3 py-2.5">
                                        {r.event_notes ? (
                                            <div className="flex flex-col gap-0.5 min-w-0 max-w-[220px]">
                                                <div className="inline-flex items-center gap-1.5 text-gray-700">
                                                    <StickyNote size={11} className="text-gray-300 flex-shrink-0" />
                                                    <span className="truncate">{r.event_notes}</span>
                                                </div>
                                                {r.event_notes_editor?.name && (
                                                    <span className="text-[10px] text-gray-400 truncate">
                                                        by {r.event_notes_editor.name}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>

                                    {/* REGISTERED */}
                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                        <div className="text-gray-600">{fmtDateShort(r.created_at)}</div>
                                        <div className="text-[10px] text-gray-400">{fmtTime(r.created_at)}</div>
                                    </td>

                                    {/* ACTIONS — view the registration form only */}
                                    <td className="px-3 py-2.5 pr-4 text-right">
                                        <Link
                                            href={`/admin/events/${event.id}/registrants/${r.id}`}
                                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                            title="Open the registration form the lead filled + notes"
                                        >
                                            <Eye size={15} />
                                        </Link>
                                    </td>
                                </tr>

                                {isExpanded && (
                                    <tr className="bg-blue-50/20 border-t border-blue-100/60">
                                        <td colSpan={8} className="px-6 py-4">
                                            <LeadDashboardPanel lead={r} portalBase={portalBase} />
                                        </td>
                                    </tr>
                                )}
                                </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
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
