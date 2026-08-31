import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, Check, Copy, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Follow-ups — the sub-agent's cadence view over the same `lead_tasks` rows the
 * Task Board works with. The board asks "what is the state of this work"; this
 * screen asks "who am I behind on", so it groups by when a task is due rather
 * than by status, and pairs the list with the cadence rule, the call script and
 * the callee's local time — the three things you want in front of you while the
 * phone is ringing.
 */

// Which quick actions a task offers, by its type.
const PRIMARY = {
    call: { label: 'Call now', kind: 'tel' },
    email: { label: 'Send', kind: 'mailto' },
    meeting: { label: 'Open lead', kind: 'lead' },
    document: { label: 'Chase docs', kind: 'lead' },
    follow_up: { label: 'Open lead', kind: 'lead' },
    // An internal task on a referral lead is almost always the hand-off to the
    // adviser — the last thing a sub-agent does with a lead.
    internal: { label: 'Hand over', kind: 'lead' },
    other: { label: 'Open lead', kind: 'lead' },
};

const SNOOZE_OPTIONS = [1, 3, 7];

const fmtDay = (iso) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' });
};
const fmtTime = (iso) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
};
const fmtHeading = (d) => d.toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
const isToday = (iso) => {
    const d = new Date(iso);
    const n = new Date();
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};
const relDays = (iso) => {
    const d = new Date(iso).getTime();
    if (Number.isNaN(d)) return null;
    return Math.round((Date.now() - d) / 86400000);
};
// The date input wants `YYYY-MM-DDTHH:mm` in local time, not an ISO UTC string.
const toLocalInput = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function FollowUps({
    portalBase = '/portal/sub-agent',
    overdue = [], today = [], this_week: thisWeek = [], undated = [], snoozed = [], recently_done: recentlyDone = [],
    leadOptions = [], cadence = {}, avgFirstContact = null, scripts = [], timezones = [],
}) {
    const [tab, setTab] = useState(overdue.length ? 'overdue' : 'today');
    const [showNew, setShowNew] = useState(false);
    const [busyId, setBusyId] = useState(null);

    const act = (task, payload) => {
        setBusyId(task.id);
        router.post(`${portalBase}/follow-ups/${task.id}`, payload, {
            preserveScroll: true,
            onFinish: () => setBusyId(null),
        });
    };

    const TABS = [
        { key: 'overdue', label: 'Overdue', n: overdue.length },
        { key: 'today', label: 'Today', n: today.length },
        { key: 'week', label: 'This week', n: thisWeek.length },
        { key: 'snoozed', label: 'Snoozed', n: snoozed.length },
    ];

    // Which grouped sections the selected tab renders. "Overdue" deliberately
    // also shows today's work — when you are behind, today's calls are part of
    // the same catch-up, and hiding them just means a second click.
    const sections = useMemo(() => {
        const todayHeading = `Today · ${fmtHeading(new Date())}`;
        switch (tab) {
            case 'overdue':
                return [
                    { key: 'overdue', title: 'Overdue', tone: 'danger', items: overdue },
                    { key: 'today', title: todayHeading, tone: 'plain', items: today },
                ];
            case 'today':
                return [{ key: 'today', title: todayHeading, tone: 'plain', items: today }];
            case 'week':
                return [
                    { key: 'week', title: 'Rest of this week', tone: 'plain', items: thisWeek },
                    { key: 'undated', title: 'No date set', tone: 'plain', items: undated },
                ];
            default:
                return [{ key: 'snoozed', title: 'Snoozed', tone: 'plain', items: snoozed }];
        }
    }, [tab, overdue, today, thisWeek, undated, snoozed]);

    const total = sections.reduce((n, s) => n + s.items.length, 0);

    return (
        <div className="pb-16">
            <Head title="Follow-ups" />

            {/* Grid, not flex: one column stacked on narrow screens, list +
                fixed 300px rail from lg up. `minmax(0,1fr)` stops a wide row
                from blowing the list column out past its track. */}
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start max-w-[1500px] mx-auto">
                {/* ── Main column ────────────────────────────────────── */}
                <div className="min-w-0 space-y-5">
                    <div>
                        <h1 className="text-[26px] leading-tight font-bold text-gray-900 tracking-tight">Follow-ups</h1>
                        <p className="text-[13px] text-gray-400 mt-1">
                            <span className={overdue.length ? 'text-red-500 font-semibold' : ''}>{overdue.length} overdue</span>
                            {' · '}{today.length} due today
                            {cadence.summary && <> · cadence {cadence.summary}</>}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                                {TABS.map((t) => {
                                    const active = tab === t.key;
                                    return (
                                        <button
                                            key={t.key}
                                            type="button"
                                            onClick={() => setTab(t.key)}
                                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${active ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                        >
                                            {t.label}
                                            <span className={active ? 'text-white/60' : 'text-gray-400'}>{t.n}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowNew((v) => !v)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 text-white text-[13px] font-semibold hover:bg-purple-700 transition-colors"
                            >
                                <Plus size={14} className={showNew ? 'rotate-45 transition-transform' : 'transition-transform'} /> New task
                            </button>
                        </div>

                        {/* Quick-add lives in the card, not a drawer — adding a
                            follow-up is a ten-second job between calls. */}
                        {showNew && (
                            <QuickAddFollowUp
                                portalBase={portalBase}
                                leadOptions={leadOptions}
                                onClose={() => setShowNew(false)}
                            />
                        )}

                        {total === 0 && !showNew ? (
                            <div className="px-5 py-16 text-center border-t border-gray-100">
                                <p className="text-[14px] font-semibold text-gray-900">Nothing waiting here</p>
                                <p className="text-[12.5px] text-gray-400 mt-1">
                                    {tab === 'overdue' ? 'No overdue calls — you are on cadence.' : 'Add a follow-up to keep the cadence going.'}
                                </p>
                            </div>
                        ) : (
                            sections.filter((s) => s.items.length > 0).map((section) => (
                                <div key={section.key}>
                                    <div className={`px-5 py-2 border-y border-gray-100 text-[10px] font-bold uppercase tracking-[0.16em] ${section.tone === 'danger' ? 'bg-red-50/60 text-red-500' : 'bg-gray-50/60 text-gray-400'}`}>
                                        {section.title}
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {section.items.map((task) => (
                                            <TaskRow
                                                key={task.id}
                                                task={task}
                                                overdue={section.tone === 'danger'}
                                                busy={busyId === task.id}
                                                portalBase={portalBase}
                                                onComplete={() => act(task, { action: 'complete' })}
                                                onReschedule={(due) => act(task, { action: 'reschedule', due_at: due })}
                                                onSnooze={(days) => act(task, { action: 'snooze', snooze_days: days })}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}

                        {recentlyDone.length > 0 && (
                            <div className="px-5 py-3 border-t border-gray-100 text-[12px] text-gray-400">
                                {recentlyDone.length} completed recently — last was “{recentlyDone[0].title}”.
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Rail ───────────────────────────────────────────── */}
                <aside className="min-w-0 space-y-4">
                    <CadenceCard cadence={cadence} avgFirstContact={avgFirstContact} />
                    <ScriptCard scripts={scripts} />
                    <TimezoneCard zones={timezones} />
                </aside>
            </div>
        </div>
    );
}

// ─── One follow-up row ────────────────────────────────────────────────
function TaskRow({ task, overdue, busy, portalBase, onComplete, onReschedule, onSnooze }) {
    const lead = task.lead;
    const primary = PRIMARY[task.type] || PRIMARY.follow_up;
    const due = task.due_at;
    const stamp = due ? (isToday(due) ? fmtTime(due) : fmtDay(due)) : 'no date';
    const late = overdue && due ? relDays(due) : null;

    // The one-line "why now" under the title: the lead's location, whatever the
    // task itself notes, and how long the promise has been outstanding.
    const context = [
        lead?.location,
        task.description || task.note,
        late !== null && late > 0 ? `promised ${late} day${late === 1 ? '' : 's'} ago` : null,
    ].filter(Boolean).join(' · ');

    const primaryHref = primary.kind === 'tel' && lead?.phone
        ? `tel:${lead.phone}`
        : primary.kind === 'mailto' && lead?.email
            ? `mailto:${lead.email}`
            : lead ? `${portalBase}/leads` : null;

    return (
        <div className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
            <button
                type="button"
                onClick={onComplete}
                disabled={busy}
                aria-label="Mark done"
                className="mt-0.5 w-4 h-4 rounded border border-gray-300 text-transparent hover:border-purple-500 hover:text-purple-500 hover:bg-purple-50 disabled:opacity-40 transition-colors flex items-center justify-center shrink-0"
            >
                <Check size={11} strokeWidth={3} />
            </button>

            <div className={`w-[52px] shrink-0 text-[12px] font-mono tabular-nums pt-px ${overdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                {stamp}
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold text-gray-900 truncate">
                    {task.title}
                    {lead && !task.title.includes(lead.name) && <span className="font-semibold text-gray-500"> — {lead.name}</span>}
                </p>
                {context && <p className="text-[11.5px] text-gray-400 truncate mt-0.5">{context}</p>}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
                <a
                    href={primaryHref || undefined}
                    className={`px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${primaryHref ? 'bg-purple-50 text-purple-700 hover:bg-purple-100' : 'bg-gray-100 text-gray-300 pointer-events-none'}`}
                >
                    {primary.label}
                </a>
                <ReschedulePopover due={due} busy={busy} onReschedule={onReschedule} onSnooze={onSnooze} />
            </div>
        </div>
    );
}

/** Reschedule (move the commitment) or snooze (park the reminder, keep the date). */
function ReschedulePopover({ due, busy, onReschedule, onSnooze }) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('');
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        setValue(toLocalInput(due ? new Date(due) : new Date()));
        const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open, due]);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                disabled={busy}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-[12px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
                Reschedule
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 z-30 w-60 rounded-xl border border-gray-100 bg-white shadow-lg p-3 space-y-3">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 mb-1.5">Move the due date</p>
                        <div className="flex gap-1.5">
                            <input
                                type="datetime-local"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="flex-1 min-w-0 px-2 py-1.5 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                            <button
                                type="button"
                                onClick={() => { setOpen(false); onReschedule(value); }}
                                disabled={!value}
                                className="px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-[12px] font-semibold hover:bg-black disabled:opacity-40"
                            >
                                Move
                            </button>
                        </div>
                    </div>
                    <div className="pt-2 border-t border-gray-100">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 mb-1.5">
                            Snooze <span className="font-medium normal-case tracking-normal text-gray-300">· keeps the due date</span>
                        </p>
                        <div className="flex gap-1.5">
                            {SNOOZE_OPTIONS.map((d) => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => { setOpen(false); onSnooze(d); }}
                                    className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-[12px] font-semibold text-gray-600 hover:bg-gray-50"
                                >
                                    {d}d
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Rail cards ───────────────────────────────────────────────────────
function CadenceCard({ cadence, avgFirstContact }) {
    // The cadence is the target; the average is the reality. Colour the average
    // against the first cadence step so the gap is the point of the card.
    const target = Array.isArray(cadence.offsets) ? cadence.offsets[0] : null;
    const behind = avgFirstContact !== null && target !== null && avgFirstContact > target;

    return (
        <div className="rounded-2xl bg-gray-900 text-white p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mb-2.5">Cadence rule</p>
            <p className="text-[13px] leading-relaxed text-white/90">{cadence.rule || 'No cadence configured.'}</p>
            <p className="text-[12px] text-white/40 mt-4 pt-3.5 border-t border-white/10">
                Your average first contact:{' '}
                {avgFirstContact === null
                    ? <span className="text-white/60">not enough calls logged yet</span>
                    : <span className={behind ? 'text-red-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                        {avgFirstContact} day{avgFirstContact === 1 ? '' : 's'}
                    </span>}
            </p>
        </div>
    );
}

function ScriptCard({ scripts = [] }) {
    const [index, setIndex] = useState(0);
    const [showAll, setShowAll] = useState(false);
    const [copied, setCopied] = useState(false);

    if (!scripts.length) return null;
    const script = scripts[index] || scripts[0];

    const copy = () => {
        navigator.clipboard?.writeText(script.body);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
    };

    return (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 mb-2.5">
                Call opener <span className="text-gray-300">· {script.label}</span>
            </p>
            <p className="text-[12.5px] leading-relaxed text-gray-700 italic">“{script.body}”</p>

            <div className="flex gap-2 mt-4">
                <button
                    type="button"
                    onClick={copy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
                {scripts.length > 1 && (
                    <button
                        type="button"
                        onClick={() => setShowAll((v) => !v)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        All scripts
                        <ChevronDown size={12} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} />
                    </button>
                )}
            </div>

            {showAll && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                    {scripts.map((s, i) => (
                        <button
                            key={s.key}
                            type="button"
                            onClick={() => { setIndex(i); setShowAll(false); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${i === index ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/** Live local time wherever the scoped leads live — so nobody gets a 2 am call. */
function TimezoneCard({ zones = [] }) {
    const [, tick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => tick((n) => n + 1), 20000);
        return () => clearInterval(id);
    }, []);

    if (!zones.length) return null;

    return (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 mb-3">Time zones now</p>
            <div className="space-y-2">
                {zones.map((z) => {
                    let time = '—';
                    let hour = null;
                    try {
                        const now = new Date();
                        time = now.toLocaleTimeString('en-NZ', { timeZone: z.timezone, hour: 'numeric', minute: '2-digit' }).toLowerCase();
                        hour = Number(now.toLocaleString('en-NZ', { timeZone: z.timezone, hour: '2-digit', hour12: false }));
                    } catch {
                        // An unknown zone should not take the card down with it.
                    }
                    // Outside 7 am – 9 pm local is not a time to ring someone.
                    const unsociable = hour !== null && !Number.isNaN(hour) && (hour < 7 || hour >= 21);
                    return (
                        <div key={z.timezone} className="flex items-center justify-between gap-3 text-[12.5px]">
                            <span className="text-gray-600 truncate">{z.label}</span>
                            <span className={`font-mono tabular-nums shrink-0 ${unsociable ? 'text-red-500' : 'text-gray-900'}`}>{time}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


// ─── Quick add ────────────────────────────────────────────────────────
// Inline composer, in the same card as the list — the same shape the Case
// Profile Overview uses for case tasks. Title on its own line, the rest on a
// single control row, Enter submits.
function QuickAddFollowUp({ portalBase, leadOptions = [], onClose }) {
    const defaultDue = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(9, 0, 0, 0);
        return toLocalInput(d);
    }, []);

    const [title, setTitle] = useState('');
    const [context, setContext] = useState('');
    const [leadId, setLeadId] = useState('');
    const [type, setType] = useState('call');
    const [priority, setPriority] = useState('normal');
    const [dueAt, setDueAt] = useState(defaultDue);
    const [saving, setSaving] = useState(false);

    const submit = () => {
        if (!title.trim()) return toast.error('Give the follow-up a title');
        setSaving(true);
        router.post(`${portalBase}/follow-ups`, {
            title: title.trim(),
            description: context.trim() || null,
            lead_id: leadId || null,
            type,
            priority,
            due_at: dueAt,
        }, {
            preserveScroll: true,
            onSuccess: onClose, // the flash message raises the toast
            onError: (e) => toast.error(Object.values(e)[0] || 'Could not add the follow-up'),
            onFinish: () => setSaving(false),
        });
    };

    const select = 'text-[12px] border border-gray-200 rounded-lg px-2 py-1 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500';

    return (
        <div className="px-5 pb-4">
            <div className="rounded-xl border border-gray-200 p-3 space-y-2">
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                    placeholder="What needs doing (e.g. First call — Hana Kim)"
                    className="w-full text-[13.5px] font-semibold outline-none placeholder-gray-400 placeholder:font-normal"
                    onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onClose(); }}
                />
                <input
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Context — e.g. 4:00 pm KST is her window · never contacted"
                    className="w-full text-[12px] outline-none placeholder-gray-400"
                    onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onClose(); }}
                />

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                    <select value={leadId} onChange={(e) => setLeadId(e.target.value)} className={`${select} max-w-[170px]`} title="Link to a lead">
                        <option value="">Not linked to a lead</option>
                        {leadOptions.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                    <select value={type} onChange={(e) => setType(e.target.value)} className={select} title="Kind">
                        <option value="call">Call</option>
                        <option value="email">Email</option>
                        <option value="meeting">Meeting</option>
                        <option value="document">Documents</option>
                        <option value="follow_up">Follow-up</option>
                        <option value="internal">Hand over</option>
                    </select>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)} className={`${select} capitalize`} title="Priority">
                        {['urgent', 'high', 'normal', 'low'].map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <input
                        type="datetime-local"
                        value={dueAt}
                        onChange={(e) => setDueAt(e.target.value)}
                        title="Due"
                        className={select}
                    />

                    <div className="flex items-center gap-3 ml-auto">
                        <button type="button" onClick={onClose} className="text-[12px] text-gray-500 hover:text-gray-800">Cancel</button>
                        <button
                            type="button"
                            onClick={submit}
                            disabled={saving || !title.trim()}
                            className="px-3 py-1 rounded-lg bg-purple-600 text-white text-[12px] font-semibold hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Adding…' : 'Add'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
