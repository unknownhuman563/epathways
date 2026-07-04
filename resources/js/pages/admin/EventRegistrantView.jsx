import { useState, useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft, Calendar, Clock, Mail, Phone, User, ExternalLink,
    Save, StickyNote, CheckCircle2,
} from 'lucide-react';

// ─── Registrant view ────────────────────────────────────────────────────
//
// Renders JUST the registration form the lead filled + an editable notes
// area. Reachable from /admin/events/{eventId}/registrants/{leadId} —
// linked from the "View Registration" action on the Event Details page.
//
// Distinct from /admin/leads/{id} on purpose: event-desk staff want the
// registration + their follow-up notes side-by-side without the full
// lead-management chrome (tabs, activity log, personal info editor, etc).
//
export default function EventRegistrantView({ event, lead, registrationFields = [], notes = {} }) {
    const [savedFlash, setSavedFlash] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        event_notes: notes?.body || '',
    });

    const handleSave = () => {
        setSavedFlash(false);
        post(`/admin/events/${event.id}/registrants/${lead.id}/notes`, {
            preserveScroll: true,
            onSuccess: () => {
                setSavedFlash(true);
                setTimeout(() => setSavedFlash(false), 2500);
            },
        });
    };

    // Group fields by section so the card mirrors the public form.
    const sectionGroups = useMemo(() => {
        const map = new Map();
        const order = [];
        for (const f of registrationFields) {
            const sec = f.section || 'Additional';
            if (! map.has(sec)) { map.set(sec, []); order.push(sec); }
            map.get(sec).push(f);
        }
        return order.map((sec) => ({ section: sec, items: map.get(sec) }));
    }, [registrationFields]);

    const fmtDate = (iso) =>
        iso ? new Date(iso).toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
    const fmtDateTime = (iso) =>
        iso ? new Date(iso).toLocaleString('en-NZ', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        }) : null;

    const registeredAtPretty = fmtDateTime(lead.created_at);
    const leadName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—';

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            <Head title={`${leadName} — Registration`} />

            {/* Back link + header */}
            <div className="flex flex-col gap-3">
                <Link
                    href={`/admin/events/${event.id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors w-max"
                >
                    <ArrowLeft size={16} /> Back to {event.name}
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-400 mb-1">
                            Registration
                        </p>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            {leadName}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Registered for{' '}
                            <span className="font-semibold text-gray-700">{event.name}</span>
                            {event.type && <span className="text-gray-400"> · {event.type}</span>}
                            {event.date_from && <span className="text-gray-400"> · {fmtDate(event.date_from)}</span>}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/admin/leads/${lead.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-colors shadow-sm"
                        >
                            Open lead profile <ExternalLink size={13} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Two-column layout: registration form on the left,
                registrant summary + notes on the right. */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

                {/* ── Registration snapshot ─────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/30">
                        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Calendar size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-bold text-gray-900">Registration form</h2>
                            <p className="text-[12px] text-gray-500 mt-0.5">
                                What {lead.first_name || 'this registrant'} filled in when they signed up.
                            </p>
                        </div>
                        {registeredAtPretty && (
                            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-md">
                                <Clock size={11} /> {registeredAtPretty}
                            </span>
                        )}
                    </div>

                    <div className="p-6 space-y-6">
                        {sectionGroups.map(({ section, items }) => (
                            <section key={section}>
                                <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 mb-3 pb-2 border-b border-gray-100">
                                    {section}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                    {items.map((f) => (
                                        <ResponseRow key={f.key} field={f} />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>

                {/* ── Sidebar: contact card + notes editor ─────────── */}
                <aside className="space-y-4">
                    {/* Contact card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 mb-4">
                            Registrant
                        </p>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-11 h-11 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">
                                {(lead.first_name?.charAt(0) || '?')}{(lead.last_name?.charAt(0) || '')}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{leadName}</p>
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

                    {/* Notes editor */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                                <StickyNote size={14} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-gray-900">Registrant notes</p>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                    Follow-up context — only staff can see this.
                                </p>
                            </div>
                        </div>

                        <div className="p-5 space-y-3">
                            <textarea
                                rows={7}
                                value={data.event_notes}
                                onChange={(e) => setData('event_notes', e.target.value)}
                                placeholder="Anything you want to record — pre-screen result, follow-up plan, questions to raise, next steps…"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all placeholder-gray-400 resize-y leading-relaxed"
                            />
                            {errors.event_notes && (
                                <p className="text-[11px] text-red-600">{errors.event_notes}</p>
                            )}

                            <div className="flex items-center justify-between gap-3 pt-1">
                                <div className="text-[11px] text-gray-500 flex-1 min-w-0">
                                    {notes?.updated_at ? (
                                        <>
                                            <span className="font-semibold text-gray-700">
                                                Last updated {fmtDateTime(notes.updated_at)}
                                            </span>
                                            {notes?.updated_by?.name && (
                                                <span className="text-gray-400"> by {notes.updated_by.name}</span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="italic text-gray-400">No notes yet.</span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-[13px] font-semibold rounded-xl hover:bg-black transition-colors disabled:opacity-60"
                                >
                                    {savedFlash ? (
                                        <><CheckCircle2 size={14} /> Saved</>
                                    ) : processing ? (
                                        <>Saving…</>
                                    ) : (
                                        <><Save size={14} /> Save notes</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

// Single field row — clean label above the value, textarea values get a
// boxed treatment, empties show "Not provided" in italic gray.
function ResponseRow({ field }) {
    const { label, type, value } = field;
    const fullWidth = type === 'textarea';
    const isEmpty = value === null || value === undefined || value === '';

    return (
        <div className={fullWidth ? 'sm:col-span-2' : ''}>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 mb-1">
                {label}
            </p>
            {isEmpty ? (
                <p className="text-[13px] text-gray-300 italic">Not provided</p>
            ) : type === 'textarea' ? (
                <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap bg-gray-50/60 border border-gray-100 rounded-lg px-3 py-2.5">
                    {String(value)}
                </p>
            ) : (
                <p className="text-[13px] text-gray-800 font-medium">
                    {String(value)}
                </p>
            )}
        </div>
    );
}
