import React, { useState, useMemo, useEffect } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Upload, Plus, Mail, Phone, FileText, X, ChevronRight } from 'lucide-react';
// Reuse the colour-coded stage picker + shared helpers so the pipeline reads
// identically to the Sales Leads table.
import { StagePicker, initials, priorityMeta, fmtDateShort } from '@/pages/portal/sales/Leads';

// ─── Pipeline buckets ─────────────────────────────────────────────────
// Which lead statuses fall under each filter tab. Anything not listed shows
// only under "All leads".
const FOLLOWUP = new Set(['New Leads', 'Contact Attempted', 'Contacted for Booking', 'Missed the Meeting']);
const QUALIFIED = new Set(['Booking Confirmation', 'Qualified but Not Ready', 'Qualified but No Funds', 'Consultation Done', 'Proposal Sent']);
const CONVERTED = new Set(['Program Selected', 'Consultancy Agreement Sent', 'Consultancy Agreement Signed', 'Consultancy Agreement', 'English Pro', 'School Enrollment', 'Visa Process']);

// The "Next step" a status implies — a nudge, derived from the pipeline stage.
const NEXT_STEP = {
    'New Leads': ['First contact', 'gray'],
    'Contact Attempted': ['Call back', 'red'],
    'Contacted for Booking': ['Confirm booking', 'amber'],
    'Booking Confirmation': ['Prep consultation', 'amber'],
    'Missed the Meeting': ['Re-book meeting', 'red'],
    'Qualified but Not Ready': ['Enrol at school', 'amber'],
    'Qualified but No Funds': ['Follow up on funds', 'amber'],
    'Consultation Done': ['Send proposal', 'blue'],
    'Proposal Sent': ['Chase proposal', 'blue'],
    'Program Selected': ['Send agreement', 'purple'],
    'Consultancy Agreement Sent': ['Chase signature', 'purple'],
    'Consultancy Agreement Signed': ['Ready to hand off', 'emerald'],
    'Consultancy Agreement': ['Ready to hand off', 'emerald'],
    'English Pro': ['In English pathway', 'emerald'],
    'School Enrollment': ['Enrolled', 'emerald'],
    'Visa Process': ['In visa process', 'emerald'],
    'Not Qualified': ['Not qualified', 'gray'],
    'Work Pathway / Other': ['Other pathway', 'gray'],
};
const DOT = { gray: 'bg-gray-300', red: 'bg-red-500', amber: 'bg-amber-500', blue: 'bg-blue-500', purple: 'bg-purple-500', emerald: 'bg-emerald-500' };

// Note category → the underlying note `kind` we store it as.
const NOTE_TAGS = [
    { key: 'general', label: 'General' },
    { key: 'client_contact', label: 'Call' },
    { key: 'goal_setting', label: 'Milestone' },
];
const KIND_LABEL = { general: 'General', client_contact: 'Call', goal_setting: 'Milestone', pre_screen: 'Pre-screen', risk: 'Risk' };

// "8 weeks ago" / "5 hours ago" / "today" — compact relative time.
const relTime = (iso) => {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const secs = Math.round((Date.now() - then) / 1000);
    if (secs < 60) return 'just now';
    const mins = Math.round(secs / 60);
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
    const days = Math.round(hrs / 24);
    if (days === 0) return 'today';
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    const weeks = Math.round(days / 7);
    if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    const months = Math.round(days / 30);
    if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
    return `${Math.round(days / 365)} year${Math.round(days / 365) === 1 ? '' : 's'} ago`;
};
const idleDays = (iso) => {
    if (!iso) return 0;
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return 0;
    return Math.max(0, Math.floor((Date.now() - then) / 86400000));
};

export default function AgentLeads({ agent = {}, leads = [], statuses = [], portalBase = '/portal/sub-agent' }) {
    const me = usePage().props?.auth?.user;
    const [rows, setRows] = useState(leads);
    const [tab, setTab] = useState('followup');
    const [expandedId, setExpandedId] = useState(null);
    const [openStageId, setOpenStageId] = useState(null);
    const [savingId, setSavingId] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const hasAgent = agent && agent.id;

    // Note composer (only one row is expanded at a time, so a single draft
    // is enough).
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
        // Oldest follow-up first — the lead that has waited longest bubbles up.
        return rows.filter(match).sort((a, b) => new Date(a.updated_at || a.created_at) - new Date(b.updated_at || b.created_at));
    }, [rows, tab]);

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
                    recent_notes: [{ id: `tmp-${Date.now()}`, kind: noteKind, body, author_name: me?.name || 'You', created_at: new Date().toISOString() }, ...(r.recent_notes || [])],
                } : r)));
                setDraft('');
            },
            onFinish: () => setPostingNote(false),
        });
    };

    const toggleExpand = (id) => {
        setExpandedId((cur) => (cur === id ? null : id));
        setDraft('');
        setNoteKind('general');
    };

    const TABS = [
        { key: 'followup', label: 'Needs follow-up', n: counts.followup, dot: 'bg-red-500' },
        { key: 'qualified', label: 'Qualified', n: counts.qualified, dot: 'bg-emerald-500' },
        { key: 'converted', label: 'Converted', n: counts.converted, dot: 'bg-purple-500' },
        { key: 'all', label: 'All leads', n: counts.all, dot: 'bg-gray-400' },
    ];

    return (
        <div className="space-y-5 max-w-[1400px] mx-auto pb-16">
            <Head title="Referral Leads" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-purple-600 mb-1.5">Sub-agent Portal</p>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Referral Leads</h1>
                    <p className="text-sm text-gray-400 mt-1.5">
                        <span className="text-gray-600 font-semibold">{counts.all} recruited</span>
                        {' · '}
                        <span className={counts.followup ? 'text-gray-900 font-semibold' : ''}>{counts.followup} need a follow-up</span>
                        {' · '}
                        <span>{counts.converted} converted</span>
                        {hasAgent && agent.name ? <> · under <span className="text-gray-600">{agent.name}</span></> : null}
                    </p>
                </div>
                {hasAgent && (
                    <div className="flex items-center gap-2.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => setShowAdd(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Upload size={15} /> Import list
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowAdd(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors shadow-sm"
                        >
                            <Plus size={15} /> Add lead
                        </button>
                    </div>
                )}
            </div>

            {!hasAgent ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <p className="text-gray-900 font-semibold">No recruiting agent assigned yet</p>
                    <p className="text-sm text-gray-500 mt-1">Ask an admin to link you to an agent — their referral leads will appear here.</p>
                </div>
            ) : (
                <>
                    {/* Filter tabs */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            {TABS.map((t) => {
                                const active = tab === t.key;
                                return (
                                    <button
                                        key={t.key}
                                        type="button"
                                        onClick={() => setTab(t.key)}
                                        className={`inline-flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-full text-sm font-semibold border transition-all ${active ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                                        {t.label}
                                        <span className={`min-w-[18px] text-center text-xs font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{t.n}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-gray-400">Oldest follow-up first</p>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="grid grid-cols-[1.6fr_1fr_1.3fr_1.2fr_0.7fr] gap-4 px-5 py-3 border-b border-gray-100 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                            <div>Lead</div>
                            <div>Stage</div>
                            <div>Contact</div>
                            <div>Next step</div>
                            <div className="text-right">Added</div>
                        </div>

                        {filtered.length === 0 && (
                            <div className="px-5 py-14 text-center text-sm text-gray-400">No leads in this view.</div>
                        )}

                        <div className="divide-y divide-gray-100">
                            {filtered.map((lead) => {
                                const pMeta = priorityMeta(lead.priority);
                                const [stepLabel, stepTone] = NEXT_STEP[lead.status] || ['Review lead', 'gray'];
                                const idle = idleDays(lead.updated_at || lead.created_at);
                                const expanded = expandedId === lead.id;
                                return (
                                    <div key={lead.id}>
                                        {/* Collapsed row */}
                                        <div
                                            className={`grid grid-cols-[1.6fr_1fr_1.3fr_1.2fr_0.7fr] gap-4 px-5 py-4 items-center cursor-pointer transition-colors ${expanded ? 'bg-gray-50/70' : 'hover:bg-gray-50/50'}`}
                                            onClick={() => toggleExpand(lead.id)}
                                        >
                                            {/* Lead */}
                                            <div className="flex items-center gap-3 min-w-0">
                                                <ChevronRight size={15} className={`text-gray-300 shrink-0 transition-transform ${expanded ? 'rotate-90 text-gray-500' : ''}`} />
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white overflow-hidden shrink-0 ${pMeta ? pMeta.dot : 'bg-gray-800'}`}>
                                                    {lead.avatar_url ? <img src={lead.avatar_url} alt={lead.name} className="w-full h-full object-cover" /> : initials(lead.name)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-900 text-sm truncate">{lead.name}</span>
                                                        {lead.priority === 'urgent' && (
                                                            <span className="text-[9px] font-bold uppercase tracking-wide text-red-600">Urgent</span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-gray-400 font-mono truncate">
                                                        {lead.lead_id}{lead.location ? ` · ${lead.location}` : ''}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stage */}
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <StagePicker
                                                    lead={lead}
                                                    stages={statuses}
                                                    open={openStageId === lead.id}
                                                    onToggle={() => setOpenStageId((cur) => (cur === lead.id ? null : lead.id))}
                                                    onClose={() => setOpenStageId(null)}
                                                    onSelect={(s) => changeStage(lead, s)}
                                                    isSaving={savingId === lead.id}
                                                />
                                            </div>

                                            {/* Contact */}
                                            <div className="min-w-0 text-sm">
                                                <div className="text-gray-700 truncate">{lead.email || '—'}</div>
                                                <div className="text-gray-400 text-xs">{lead.phone || ''}</div>
                                            </div>

                                            {/* Next step */}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${DOT[stepTone]}`} />
                                                    <span className="text-sm font-semibold text-gray-800 truncate">{stepLabel}</span>
                                                </div>
                                                <div className="text-[11px] text-gray-400 mt-0.5">
                                                    {idle > 0 ? `${idle} day${idle === 1 ? '' : 's'} idle` : 'updated today'}
                                                </div>
                                            </div>

                                            {/* Added */}
                                            <div className="text-right">
                                                <div className="text-sm text-gray-700">{fmtDateShort(lead.created_at)}</div>
                                                <div className="text-[11px] text-gray-400">{relTime(lead.created_at)}</div>
                                            </div>
                                        </div>

                                        {/* Expanded panel */}
                                        {expanded && (
                                            <ExpandedPanel
                                                lead={lead}
                                                portalBase={portalBase}
                                                onPriority={(p) => changePriority(lead, p)}
                                                draft={draft}
                                                setDraft={setDraft}
                                                noteKind={noteKind}
                                                setNoteKind={setNoteKind}
                                                onPost={() => postNote(lead)}
                                                posting={postingNote}
                                                me={me}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {showAdd && hasAgent && (
                <AddLeadModal portalBase={portalBase} agentName={agent.name} onClose={() => setShowAdd(false)} />
            )}
        </div>
    );
}

// ─── Expanded row ─────────────────────────────────────────────────────
// The four documents a sub-agent collects on a referral lead — upload + view,
// scoped server-side to this agent's leads. Slots are fetched on expand.
function DocumentsSection({ leadId, portalBase }) {
    const [slots, setSlots] = useState(null);
    const [busyType, setBusyType] = useState(null);

    const load = () => {
        fetch(`${portalBase}/leads/${leadId}/documents`, { headers: { Accept: 'application/json' } })
            .then((r) => (r.ok ? r.json() : { slots: [] }))
            .then((d) => setSlots(d.slots || []))
            .catch(() => setSlots([]));
    };
    useEffect(() => { load(); }, [leadId]); // eslint-disable-line react-hooks/exhaustive-deps

    const upload = (type, file) => {
        if (! file) return;
        setBusyType(type);
        router.post(`${portalBase}/leads/${leadId}/documents`, { type, file }, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => load(),
            onFinish: () => setBusyType(null),
        });
    };

    const fileInput = (type) => (
        <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            className="hidden"
            disabled={busyType === type}
            onChange={(e) => upload(type, e.target.files?.[0])}
        />
    );

    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 mb-2">
                Documents <span className="text-gray-300 font-medium normal-case tracking-normal">· Passport · CV · Diploma · TOR</span>
            </p>
            {slots === null ? (
                <p className="text-[11px] text-gray-400">Loading…</p>
            ) : (
                <div className="space-y-1.5">
                    {slots.map((s) => (
                        <div key={s.type} className="flex items-center gap-2 bg-white rounded-lg border border-gray-100 px-3 py-2">
                            <FileText size={13} className="text-gray-400 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <span className="block text-[12px] text-gray-800 truncate">{s.label}</span>
                                {s.file && <span className="block text-[10.5px] text-gray-400 truncate">{s.file.name}</span>}
                            </div>
                            {s.file ? (
                                <div className="flex items-center gap-3 shrink-0">
                                    <a href={s.file.url} className="text-[11px] font-semibold text-gray-500 hover:text-gray-900">View</a>
                                    <label className="text-[11px] font-semibold text-gray-400 hover:text-gray-700 cursor-pointer">
                                        {busyType === s.type ? 'Uploading…' : 'Replace'}{fileInput(s.type)}
                                    </label>
                                </div>
                            ) : (
                                <label className={`inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer shrink-0 ${busyType === s.type ? 'text-gray-300' : 'text-gray-900 hover:text-black'}`}>
                                    <Upload size={12} /> {busyType === s.type ? 'Uploading…' : 'Upload'}{fileInput(s.type)}
                                </label>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ExpandedPanel({ lead, portalBase, onPriority, draft, setDraft, noteKind, setNoteKind, onPost, posting, me }) {
    const notes = lead.recent_notes || [];
    const detail = [
        ['Source', lead.source],
        ['Interest', lead.course || lead.visa || lead.program_offered],
        ['Program', lead.program_offered],
        ['Owner', 'Sub-agent (you)'],
    ];
    const PRIORITIES = [
        { value: 'urgent', label: 'Urgent' },
        { value: 'medium', label: 'Normal' },
        { value: 'low', label: 'Low' },
    ];
    const cur = lead.priority || 'medium';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-5 pb-6 pt-1 bg-gray-50/70">
            {/* Left — priority + detail + actions */}
            <div className="space-y-5">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 mb-2">Priority</p>
                    <div className="inline-flex gap-1.5">
                        {PRIORITIES.map((p) => {
                            const active = cur === p.value;
                            const tone = p.value === 'urgent' ? 'bg-red-600 text-white border-red-600' : p.value === 'low' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-800 text-white border-gray-800';
                            return (
                                <button
                                    key={p.value}
                                    type="button"
                                    onClick={() => onPriority(p.value)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${active ? tone : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                                >
                                    {p.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 mb-2">Lead detail</p>
                    <dl className="divide-y divide-gray-200/70 border-t border-gray-200/70">
                        {detail.map(([k, v]) => (
                            <div key={k} className="grid grid-cols-[110px_1fr] gap-3 py-2 text-sm">
                                <dt className="text-gray-400">{k}</dt>
                                <dd className={v ? 'text-gray-900' : 'text-gray-400'}>{v || 'Not set yet'}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                    <a
                        href={lead.email ? `mailto:${lead.email}` : undefined}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold ${lead.email ? 'bg-gray-900 text-white hover:bg-black' : 'bg-gray-200 text-gray-400 pointer-events-none'} transition-colors`}
                    >
                        <Mail size={13} /> Send email
                    </a>
                    <button
                        type="button"
                        onClick={() => setNoteKind('client_contact')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        <Phone size={13} /> Log a call
                    </button>
                </div>

                {/* Documents — Passport / CV / Diploma / TOR, upload + view */}
                <DocumentsSection leadId={lead.id} portalBase={portalBase} />
            </div>

            {/* Right — internal notes */}
            <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 mb-2">
                    Internal notes <span className="text-gray-300 font-medium normal-case tracking-normal">· {notes.length} · team only</span>
                </p>

                {/* Composer */}
                <div className="flex gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{initials(me?.name || 'You')}</div>
                    <div className="flex-1 rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-gray-900 transition-all">
                        <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            rows={2}
                            placeholder="What happened on this lead…"
                            className="w-full px-3 py-2.5 text-sm bg-transparent resize-none focus:outline-none placeholder-gray-400"
                        />
                        <div className="flex items-center justify-between px-2.5 pb-2.5">
                            <div className="flex gap-1.5">
                                {NOTE_TAGS.map((t) => (
                                    <button
                                        key={t.key}
                                        type="button"
                                        onClick={() => setNoteKind(t.key)}
                                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${noteKind === t.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={onPost}
                                disabled={!draft.trim() || posting}
                                className="px-3.5 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                {posting ? 'Posting…' : 'Post'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Existing notes */}
                <div className="mt-4 space-y-3">
                    {notes.map((n) => (
                        <div key={n.id} className="rounded-xl bg-white border border-gray-100 p-3.5">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center text-[9px] font-bold shrink-0">{initials(n.author_name)}</div>
                                <span className="text-xs font-semibold text-gray-800">{n.author_name}</span>
                                <span className="text-[9px] font-bold uppercase tracking-wide text-gray-400">{KIND_LABEL[n.kind] || 'General'}</span>
                                <span className="text-[11px] text-gray-300 ml-auto">{relTime(n.created_at)}</span>
                            </div>
                            <p className="text-sm text-gray-700 leading-snug whitespace-pre-wrap">{n.body}</p>
                        </div>
                    ))}
                    {notes.length === 0 && (
                        <p className="text-xs text-gray-400 py-2">No notes yet — add the first update above.</p>
                    )}
                </div>
            </div>
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

const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all';
function Field({ label, required, children }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}{required && <span className="text-red-500"> *</span>}</label>
            {children}
        </div>
    );
}
