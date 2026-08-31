import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Upload, Plus, X, MoreHorizontal, Check } from 'lucide-react';
// Reuse the colour-coded stage picker + shared helpers so the pipeline reads
// identically to the Sales Leads table.
import { StagePicker, initials, priorityMeta, fmtDateShort } from '@/pages/portal/sales/Leads';
import LeadModal, { TAG_UNRESPONSIVE } from './LeadModal';

// ─── Pipeline buckets ─────────────────────────────────────────────────
// Which lead statuses fall under each filter tab. Anything not listed shows
// only under "All".
const FOLLOWUP = new Set(['New Leads', 'Contact Attempted', 'Contacted for Booking', 'Missed the Meeting']);
const QUALIFIED = new Set(['Booking Confirmation', 'Qualified but Not Ready', 'Qualified but No Funds', 'Consultation Done', 'Proposal Sent']);
const CONVERTED = new Set(['Program Selected', 'Consultancy Agreement Sent', 'Consultancy Agreement Signed', 'Consultancy Agreement', 'English Pro', 'School Enrollment', 'Visa Process']);

// The "Next step" a status implies — a nudge, derived from the pipeline stage.
const NEXT_STEP = {
    'New Leads': 'First contact',
    'Contact Attempted': 'Call back',
    'Contacted for Booking': 'Confirm booking',
    'Booking Confirmation': 'Prep consultation',
    'Missed the Meeting': 'Re-book meeting',
    'Qualified but Not Ready': 'Enrol at school',
    'Qualified but No Funds': 'Follow up on funds',
    'Consultation Done': 'Send proposal',
    'Proposal Sent': 'Chase proposal',
    'Program Selected': 'Send agreement',
    'Consultancy Agreement Sent': 'Chase signature',
    'Consultancy Agreement Signed': 'Ready to hand off',
    'Consultancy Agreement': 'Ready to hand off',
    'English Pro': 'In English pathway',
    'School Enrollment': 'Enrolled',
    'Visa Process': 'In visa process',
    'Not Qualified': 'Not qualified',
    'Work Pathway / Other': 'Other pathway',
};

// Idle thresholds, in days since the lead was last touched. A lead past COLD
// has effectively gone quiet and gets the "cold" chip; the urgency bar fills
// over the same scale so a glance down the column ranks the backlog.
const IDLE_WARM = 12;
const IDLE_COLD = 30;
const IDLE_SCALE = 30;


const SORTS = [
    { key: 'idle', label: 'oldest idle first' },
    { key: 'newest', label: 'newest added first' },
    { key: 'name', label: 'name A–Z' },
];

const idleDays = (iso) => {
    if (!iso) return 0;
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return 0;
    return Math.max(0, Math.floor((Date.now() - then) / 86400000));
};

export default function AgentLeads({
    agent = {}, leads = [], statuses = [], portalBase = '/portal/sub-agent',
    referralValue = null, adviceOwner = null,
}) {
    const me = usePage().props?.auth?.user;
    const [rows, setRows] = useState(leads);
    const [tab, setTab] = useState('followup');
    const [sort, setSort] = useState('idle');
    const [selectedId, setSelectedId] = useState(null);
    const [checked, setChecked] = useState(() => new Set());
    const [openStageId, setOpenStageId] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [savingId, setSavingId] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const hasAgent = agent && agent.id;

    // Server props win after any Inertia reload (a note post, a stage change).
    useEffect(() => { setRows(leads); }, [leads]);

    // Note composer — only one lead is open at a time, so a single draft is enough.
    const [draft, setDraft] = useState('');
    const [noteKind, setNoteKind] = useState('general');
    const [postingNote, setPostingNote] = useState(false);

    const counts = useMemo(() => ({
        followup: rows.filter((r) => FOLLOWUP.has(r.status)).length,
        qualified: rows.filter((r) => QUALIFIED.has(r.status)).length,
        converted: rows.filter((r) => CONVERTED.has(r.status)).length,
        all: rows.length,
    }), [rows]);

    const filtered = useMemo(() => {
        const match = (r) => tab === 'all'
            || (tab === 'followup' && FOLLOWUP.has(r.status))
            || (tab === 'qualified' && QUALIFIED.has(r.status))
            || (tab === 'converted' && CONVERTED.has(r.status));
        const list = rows.filter(match);
        const touched = (r) => new Date(r.updated_at || r.created_at).getTime();
        if (sort === 'newest') return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        if (sort === 'name') return list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
        // Oldest follow-up first — the lead that has waited longest bubbles up.
        return list.sort((a, b) => touched(a) - touched(b));
    }, [rows, tab, sort]);

    const selected = useMemo(() => rows.find((r) => r.id === selectedId) || null, [rows, selectedId]);
    const visibleIds = filtered.map((r) => r.id);
    const allChecked = visibleIds.length > 0 && visibleIds.every((id) => checked.has(id));

    const toggleCheck = (id) => setChecked((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });
    const toggleCheckAll = () => setChecked((prev) => {
        const next = new Set(prev);
        if (allChecked) visibleIds.forEach((id) => next.delete(id));
        else visibleIds.forEach((id) => next.add(id));
        return next;
    });

    const changeStage = (lead, status) => {
        setSavingId(lead.id);
        router.post(`${portalBase}/leads/${lead.id}`, { status }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setRows((prev) => prev.map((r) => (r.id === lead.id ? { ...r, status, stage: status } : r))),
            onFinish: () => setSavingId(null),
        });
        setOpenStageId(null);
    };

    const changePriority = (lead, priority) => {
        router.post(`${portalBase}/leads/${lead.id}/priority`, { priority }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setRows((prev) => prev.map((r) => (r.id === lead.id ? { ...r, priority } : r))),
        });
    };

    const postNote = (lead) => {
        const body = draft.trim();
        if (!body || postingNote) return;
        setPostingNote(true);
        router.post(`${portalBase}/leads/${lead.id}/notes`, { body, kind: noteKind }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setRows((prev) => prev.map((r) => (r.id === lead.id ? {
                    ...r,
                    notes_count: (r.notes_count || 0) + 1,
                    // A logged call is what "last contact" means on this screen.
                    last_contact_at: noteKind === 'client_contact' ? new Date().toISOString() : r.last_contact_at,
                    recent_notes: [{ id: `tmp-${Date.now()}`, kind: noteKind, body, author_name: me?.name || 'You', created_at: new Date().toISOString() }, ...(r.recent_notes || [])],
                } : r)));
                setDraft('');
            },
            onFinish: () => setPostingNote(false),
        });
    };

    const select = (id) => {
        setSelectedId((cur) => (cur === id ? null : id));
        setDraft('');
        setNoteKind('general');
    };

    // ── Bulk actions on the checked rows ────────────────────────────────
    const checkedRows = rows.filter((r) => checked.has(r.id));
    const bulkEmail = () => {
        const to = checkedRows.map((r) => r.email).filter(Boolean);
        if (to.length) window.location.href = `mailto:?bcc=${encodeURIComponent(to.join(','))}`;
    };
    const bulkExport = () => {
        const cols = ['lead_id', 'name', 'email', 'phone', 'location', 'status', 'created_at'];
        const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const csv = [cols.join(','), ...checkedRows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `referral-leads-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const TABS = [
        { key: 'followup', label: 'Needs follow-up', n: counts.followup },
        { key: 'qualified', label: 'Qualified', n: counts.qualified },
        { key: 'converted', label: 'Converted', n: counts.converted },
        { key: 'all', label: 'All', n: counts.all },
    ];

    return (
        <div className="pb-16">
            <Head title="Referral Leads" />

            <div className="max-w-[1400px] mx-auto">
                <div className="space-y-5">
                    {/* Header */}
                    <div>
                        <h1 className="text-[26px] leading-tight font-bold text-gray-900 tracking-tight">Referral leads</h1>
                        <p className="text-[13px] text-gray-400 mt-1">
                            {counts.all} recruited
                            {' · '}<span className={counts.followup ? 'text-gray-500' : ''}>{counts.followup} need follow-up</span>
                            {' · '}{counts.qualified} qualified
                            {' · '}{counts.converted} converted
                        </p>
                    </div>

                    {!hasAgent ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                            <p className="text-gray-900 font-semibold">No recruiting agent assigned yet</p>
                            <p className="text-sm text-gray-500 mt-1">Ask an admin to link you to an agent — their referral leads will appear here.</p>
                        </div>
                    ) : (
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
                                <div className="flex items-center gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setSort((cur) => SORTS[(SORTS.findIndex((s) => s.key === cur) + 1) % SORTS.length].key)}
                                        className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors"
                                        title="Change sort order"
                                    >
                                        Sort: <span className="text-gray-600">{SORTS.find((s) => s.key === sort).label}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAdd(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <Upload size={14} /> Import list
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAdd(true)}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 text-white text-[13px] font-semibold hover:bg-purple-700 transition-colors"
                                    >
                                        <Plus size={14} /> Add lead
                                    </button>
                                </div>
                            </div>

                            {/* Column heads */}
                            <div className="grid grid-cols-[28px_1.5fr_0.9fr_1.2fr_auto] gap-4 px-5 py-2.5 border-y border-gray-100 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                <label className="flex items-center">
                                    <input type="checkbox" checked={allChecked} onChange={toggleCheckAll} className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                                </label>
                                <div>Lead</div>
                                <div>Stage</div>
                                <div>Next step · Idle</div>
                                <div className="w-[150px] text-right">Actions</div>
                            </div>

                            {filtered.length === 0 && (
                                <div className="px-5 py-16 text-center text-sm text-gray-400">No leads in this view.</div>
                            )}

                            <div className="divide-y divide-gray-100">
                                {filtered.map((lead) => (
                                    <LeadRow
                                        key={lead.id}
                                        lead={lead}
                                        statuses={statuses}
                                        active={selectedId === lead.id}
                                        isChecked={checked.has(lead.id)}
                                        onCheck={() => toggleCheck(lead.id)}
                                        onSelect={() => select(lead.id)}
                                        stageOpen={openStageId === lead.id}
                                        onStageToggle={() => setOpenStageId((cur) => (cur === lead.id ? null : lead.id))}
                                        onStageClose={() => setOpenStageId(null)}
                                        onStageSelect={(s) => changeStage(lead, s)}
                                        saving={savingId === lead.id}
                                        menuOpen={openMenuId === lead.id}
                                        onMenuToggle={() => setOpenMenuId((cur) => (cur === lead.id ? null : lead.id))}
                                        onMenuClose={() => setOpenMenuId(null)}
                                        onLogCall={() => { select(lead.id); setNoteKind('client_contact'); }}
                                    />
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 text-[12px]">
                                <p className="text-gray-400">
                                    Showing {filtered.length} of {counts.all}
                                    {counts.all - filtered.length > 0 && <> · {counts.all - filtered.length} hidden by filter</>}
                                </p>
                                <p className={checkedRows.length ? 'text-gray-600' : 'text-gray-300'}>
                                    Bulk{checkedRows.length ? ` (${checkedRows.length})` : ''}:{' '}
                                    <button type="button" disabled={!checkedRows.length} onClick={bulkEmail} className="font-semibold hover:text-gray-900 disabled:hover:text-gray-300 disabled:cursor-not-allowed">email</button>
                                    {' · '}
                                    <button type="button" disabled={!checkedRows.length} onClick={bulkExport} className="font-semibold hover:text-gray-900 disabled:hover:text-gray-300 disabled:cursor-not-allowed">export</button>
                                </p>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* The lead record — a centred modal over the table, not a
                side panel: the Personal tab needs the width. */}
            {selected && (
                <LeadModal
                    lead={selected}
                    portalBase={portalBase}
                    nextStep={NEXT_STEP[selected.status] || 'Review lead'}
                    referralValue={referralValue}
                    adviceOwner={adviceOwner}
                    onClose={() => setSelectedId(null)}
                    onPriority={(p) => changePriority(selected, p)}
                    draft={draft}
                    setDraft={setDraft}
                    noteKind={noteKind}
                    setNoteKind={setNoteKind}
                    onPost={() => postNote(selected)}
                    posting={postingNote}
                    me={me}
                />
            )}

            {showAdd && hasAgent && (
                <AddLeadModal portalBase={portalBase} agentName={agent.name} onClose={() => setShowAdd(false)} />
            )}
        </div>
    );
}

// ─── One table row ────────────────────────────────────────────────────
function LeadRow({
    lead, statuses, active, isChecked, onCheck, onSelect,
    stageOpen, onStageToggle, onStageClose, onStageSelect, saving,
    menuOpen, onMenuToggle, onMenuClose, onLogCall,
}) {
    const pMeta = priorityMeta(lead.priority);
    const step = NEXT_STEP[lead.status] || 'Review lead';
    const idle = idleDays(lead.updated_at || lead.created_at);
    // Released leads stop competing for attention: the idle clock is no longer
    // a reproach once you have formally stopped chasing them.
    const unresponsive = (lead.tags || []).includes(TAG_UNRESPONSIVE);
    const cold = !unresponsive && idle >= IDLE_COLD;
    const urgent = !unresponsive && lead.priority === 'urgent';

    const barTone = unresponsive ? 'bg-gray-200' : cold ? 'bg-red-500' : idle >= IDLE_WARM ? 'bg-amber-500' : 'bg-gray-300';
    const barWidth = `${Math.max(6, Math.min(100, Math.round((idle / IDLE_SCALE) * 100)))}%`;

    return (
        <div
            className={`relative grid grid-cols-[28px_1.5fr_0.9fr_1.2fr_auto] gap-4 px-5 py-3.5 items-center cursor-pointer transition-colors ${active ? 'bg-purple-50/60' : 'hover:bg-gray-50/60'}`}
            onClick={onSelect}
        >
            {active && <span className="absolute left-0 inset-y-0 w-[3px] bg-purple-600" />}

            <label className="flex items-center" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={isChecked} onChange={onCheck} className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
            </label>

            {/* Lead */}
            <div className="flex items-start gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white overflow-hidden shrink-0 ${pMeta ? pMeta.dot : 'bg-gray-800'}`}>
                    {lead.avatar_url ? <img src={lead.avatar_url} alt={lead.name} className="w-full h-full object-cover" /> : initials(lead.name)}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-900 text-[14px] truncate">{lead.name}</span>
                        {unresponsive
                            ? <Chip tone="cold">Unresponsive</Chip>
                            : urgent ? <Chip tone="urgent">Urgent</Chip>
                                : cold ? <Chip tone="cold">Cold</Chip> : null}
                    </div>
                    {lead.location && <div className="text-[11.5px] text-gray-400 truncate">{lead.location}</div>}
                    <div className="text-[11.5px] text-gray-500 truncate">{lead.email || '—'}</div>
                    {lead.phone && <div className="text-[11.5px] text-gray-400 font-mono truncate">{lead.phone}</div>}
                </div>
            </div>

            {/* Stage */}
            <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
                <StagePicker
                    lead={lead}
                    stages={statuses}
                    open={stageOpen}
                    onToggle={onStageToggle}
                    onClose={onStageClose}
                    onSelect={onStageSelect}
                    isSaving={saving}
                />
                <div className="text-[10.5px] text-gray-400 font-mono mt-1.5 pl-0.5">{lead.lead_id}</div>
            </div>

            {/* Next step · idle */}
            <div className="min-w-0">
                <div className="text-[13px] font-bold text-gray-900 truncate">{step}</div>
                <div className="h-[3px] rounded-full bg-gray-100 mt-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${barTone}`} style={{ width: barWidth }} />
                </div>
                <div className="text-[11px] text-gray-400 mt-1.5">
                    {idle > 0 ? `${idle} day${idle === 1 ? '' : 's'} idle` : 'touched today'} · added {fmtDateShort(lead.created_at)}
                </div>
            </div>

            {/* Actions */}
            <div className="w-[150px] flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    onClick={onLogCall}
                    className="px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-[12px] font-semibold hover:bg-purple-100 transition-colors"
                >
                    Call
                </button>
                <a
                    href={lead.email ? `mailto:${lead.email}` : undefined}
                    className={`px-2.5 py-1.5 rounded-lg border text-[12px] font-semibold transition-colors ${lead.email ? 'border-gray-200 text-gray-700 hover:bg-gray-50' : 'border-gray-100 text-gray-300 pointer-events-none'}`}
                >
                    Email
                </a>
                <RowMenu lead={lead} open={menuOpen} onToggle={onMenuToggle} onClose={onMenuClose} />
            </div>
        </div>
    );
}

function Chip({ tone, children }) {
    const cls = tone === 'urgent'
        ? 'bg-red-50 text-red-600 border-red-100'
        : 'bg-gray-100 text-gray-500 border-gray-200';
    return (
        <span className={`px-1.5 py-px rounded border text-[9px] font-bold uppercase tracking-wide shrink-0 ${cls}`}>{children}</span>
    );
}

/** Row overflow menu — copy actions only, so nothing here can mutate a lead. */
function RowMenu({ lead, open, onToggle, onClose }) {
    const ref = useRef(null);
    const [copied, setCopied] = useState(null);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open, onClose]);

    const copy = (label, value) => {
        if (!value) return;
        navigator.clipboard?.writeText(value);
        setCopied(label);
        setTimeout(() => setCopied(null), 1200);
    };

    const items = [
        ['Copy email', lead.email],
        ['Copy phone', lead.phone],
        ['Copy lead ID', lead.lead_id],
        ['Copy tracking link', lead.tracking_code ? `${window.location.origin}/track/${lead.tracking_code}` : null],
    ];

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={onToggle}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="More actions"
            >
                <MoreHorizontal size={16} />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 z-30 w-48 rounded-xl border border-gray-100 bg-white shadow-lg py-1">
                    {items.map(([label, value]) => (
                        <button
                            key={label}
                            type="button"
                            disabled={!value}
                            onClick={() => copy(label, value)}
                            className="w-full flex items-center justify-between px-3 py-2 text-left text-[12.5px] text-gray-700 hover:bg-gray-50 disabled:text-gray-300 disabled:hover:bg-white disabled:cursor-not-allowed"
                        >
                            {label}
                            {copied === label && <Check size={13} className="text-emerald-600" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Add lead modal ───────────────────────────────────────────────────
function AddLeadModal({ portalBase, agentName, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '', last_name: '', email: '', phone: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(`${portalBase}/leads`, {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
        });
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-white shadow-2xl animate-slide-in-right">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Add referral lead</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Attributed to {agentName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"><X size={20} /></button>
                </div>
                <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    {Object.keys(errors).length > 0 && (
                        <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{Object.values(errors)[0]}</div>
                    )}
                    <Field label="First name" required>
                        <input value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Last name">
                        <input value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Email">
                        <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Phone">
                        <input value={data.phone} onChange={(e) => setData('phone', e.target.value)} className={inputCls} />
                    </Field>
                </form>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button onClick={submit} disabled={processing} className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50">
                        {processing ? 'Adding…' : 'Add lead'}
                    </button>
                </div>
            </div>
        </>
    );
}

const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all';
function Field({ label, required, children }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}{required && <span className="text-red-500"> *</span>}</label>
            {children}
        </div>
    );
}
