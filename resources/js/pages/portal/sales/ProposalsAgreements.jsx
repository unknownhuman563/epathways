import { useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    FileText, Plus, Search, Download, Eye, Loader, X, Check,
    ChevronRight, ChevronDown, Users, Lightbulb, FileSignature, Wand2,
    Mail, Send, AlertCircle, MoreVertical, Pencil, Trash2,
} from 'lucide-react';

// Portal → URL prefix. Same shape as the other portal-scoped pages.
const PORTAL_BASE = {
    sales:       '/portal/sales',
    education:   '/portal/education',
    immigration: '/portal/immigration',
    admin:       '/admin',
};

// ─── Proposal & Agreements — sidebar page ──────────────────────────────
//
// Lists every lead that has at least one system-generated Proposal or
// Agreement (Consultancy Single/Partner, English Engagement). A "+ New"
// button opens a modal to generate one for any pipeline lead. Generated
// files still appear in the lead's Documents tab (they're LeadDocument
// rows keyed by checklist_key — see agreements section of the shared
// CHECKLIST config).
//
export default function ProposalsAgreements({
    portal = 'sales',
    suggestions = [],
    proposals = [],
    agreements = [],
    picker = [],
    programs = [],
}) {
    const portalBase = PORTAL_BASE[portal] || PORTAL_BASE.sales;
    const [search, setSearch] = useState('');
    const [showNew, setShowNew] = useState(false);
    // Prefill state — used when clicking "Generate" on a suggestion row so
    // the New modal opens with that lead + doc type pre-selected.
    const [prefill, setPrefill] = useState(null);
    const [tab, setTab] = useState('suggestions');
    // Notify-lead flow — opens a small confirm dialog with an email
    // preview, then fires the queued mailable pointing at /track/{code}.
    const [notifyTarget, setNotifyTarget] = useState(null); // { lead, kind }
    const openNotify = (row, kind) => setNotifyTarget({ lead: row, kind });
    const closeNotify = () => setNotifyTarget(null);

    const activeRows = tab === 'proposals' ? proposals
        : tab === 'agreements' ? agreements
        : suggestions;

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (! q) return activeRows;
        return activeRows.filter((r) =>
            (r.name || '').toLowerCase().includes(q)
            || (r.email || '').toLowerCase().includes(q)
            || (r.lead_id || '').toLowerCase().includes(q)
        );
    }, [activeRows, search]);

    const openNewWithPrefill = (leadId, suggestion, exactType = null) => {
        // Sensible defaults per suggestion kind. The 6-way consultancy
        // dropdown means "agreement" no longer has an obvious default —
        // Standard · Single · 100,000 is the most common starting point;
        // staff can flip to Couple / Voucher / 150k from the dropdown.
        // `exactType` skips the mapping and prefills with a specific
        // DOC_TYPES key — used by the Agreements "Edit" action to
        // re-open the modal at the same variant the doc was generated
        // with.
        const type = exactType
            ? exactType
            : suggestion === 'proposal'
                ? 'proposal'
                : 'consultancy_std_single_100';
        setPrefill({ leadId, type });
        setShowNew(true);
    };
    const closeNew = () => { setShowNew(false); setPrefill(null); };

    const fmtSize = (b) => {
        if (! b && b !== 0) return '—';
        if (b < 1024) return `${b} B`;
        if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
        return `${(b / (1024 * 1024)).toFixed(2)} MB`;
    };
    const fmtDate = (iso) => iso
        ? new Date(iso).toLocaleString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '—';

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            <Head title="Proposal & Agreements" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-400 mb-1">
                        Leads
                    </p>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Proposal & Agreements</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Every lead with a system-generated proposal or agreement. Generated files still appear on the lead's Documents tab.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-full sm:w-72 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search name, email or LP ID…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowNew(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors shadow-sm"
                    >
                        <Plus size={14} /> New
                    </button>
                </div>
            </div>

            {/* Tab strip */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-1 px-4 pt-2 border-b border-gray-100">
                    <TabButton
                        active={tab === 'suggestions'}
                        onClick={() => { setTab('suggestions'); setSearch(''); }}
                        icon={<Lightbulb size={13} />}
                        label="Suggestions"
                        count={suggestions.length}
                        countTone="amber"
                    />
                    <TabButton
                        active={tab === 'proposals'}
                        onClick={() => { setTab('proposals'); setSearch(''); }}
                        icon={<FileText size={13} />}
                        label="Proposals"
                        count={proposals.length}
                    />
                    <TabButton
                        active={tab === 'agreements'}
                        onClick={() => { setTab('agreements'); setSearch(''); }}
                        icon={<FileSignature size={13} />}
                        label="Agreements"
                        count={agreements.length}
                    />
                </div>

                {filtered.length === 0 ? (
                    <div className="p-16 text-center text-gray-400">
                        <FileText size={26} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm font-medium">
                            {tab === 'suggestions' ? 'No suggested leads right now'
                                : tab === 'proposals' ? 'No program shortlists yet'
                                : 'No agreements generated yet'}
                        </p>
                        <p className="text-xs mt-1">
                            {tab === 'suggestions'
                                ? 'Leads at Consultation Done, Proposal Sent, or Consultancy Agreement without a matching document will appear here.'
                                : tab === 'proposals'
                                    ? <>Click <span className="font-semibold text-gray-600">+ New</span> and pick up to 3 programs to shortlist for a lead.</>
                                    : <>Click <span className="font-semibold text-gray-600">+ New</span> to generate one for a lead.</>}
                        </p>
                    </div>
                ) : tab === 'suggestions' ? (
                    <SuggestionsTable rows={filtered} portalBase={portalBase} onGenerate={openNewWithPrefill} />
                ) : tab === 'proposals' ? (
                    <ProposalsTable rows={filtered} portalBase={portalBase} fmtDate={fmtDate} onNotify={(row) => openNotify(row, 'proposal')} />
                ) : (
                    <DocumentsTable
                        rows={filtered}
                        portalBase={portalBase}
                        fmtSize={fmtSize}
                        fmtDate={fmtDate}
                        onNotify={(row) => openNotify(row, 'agreement')}
                        onEdit={openNewWithPrefill}
                    />
                )}
            </div>

            <NewDocumentModal
                open={showNew}
                onClose={closeNew}
                picker={picker}
                programs={programs}
                prefill={prefill}
            />

            <NotifyLeadModal target={notifyTarget} onClose={closeNotify} />

        </div>
    );
}

// ── Tab button — count badge tinted for suggestions. ──────────────────
function TabButton({ active, onClick, icon, label, count = 0, countTone = 'default' }) {
    const badgeCls = countTone === 'amber'
        ? (active ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700')
        : (active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600');
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-3 text-xs font-bold transition-colors -mb-px border-b-2 ${
                active ? 'text-gray-900 border-gray-900' : 'text-gray-400 border-transparent hover:text-gray-700'
            }`}
        >
            {icon}
            {label}
            <span className={`ml-1 min-w-[20px] text-center px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${badgeCls}`}>
                {count}
            </span>
        </button>
    );
}

// ── Suggestions table — leads the system suggests need a doc. Each row
//    has a "Generate" action that opens the New modal pre-filled. ──────
function SuggestionsTable({ rows, portalBase, onGenerate }) {
    const stageChip = (stage) => {
        // Mirror the pipeline stage colours from the Leads table so the
        // suggestion column reads consistently.
        if (! stage) return 'bg-gray-100 text-gray-600 border-gray-200';
        if (stage === 'Consultation Done')     return 'bg-purple-100 text-purple-700 border-purple-200';
        if (stage === 'Proposal Sent')         return 'bg-teal-100 text-teal-700 border-teal-200';
        if (stage === 'Consultancy Agreement') return 'bg-indigo-100 text-indigo-700 border-indigo-200';
        return 'bg-gray-100 text-gray-600 border-gray-200';
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
                <thead>
                    <tr className="bg-gray-50/60 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-3">Lead</th>
                        <th className="px-3 py-3">Current stage</th>
                        <th className="px-3 py-3">Suggested</th>
                        <th className="px-3 py-3 text-right pr-4">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {rows.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50/60 transition-colors align-top">
                            <td className="px-4 py-3">
                                <div className="font-semibold text-gray-900">{r.name}</div>
                                <div className="text-[10px] text-gray-400 font-mono">{r.lead_id}</div>
                                {r.email && (
                                    <div className="text-[11px] text-gray-500 truncate max-w-[220px]">{r.email}</div>
                                )}
                            </td>
                            <td className="px-3 py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${stageChip(r.status)}`}>
                                    {r.status || '—'}
                                </span>
                            </td>
                            <td className="px-3 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                    r.suggestion === 'proposal'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                    {r.suggestion === 'proposal' ? 'Proposal' : 'Agreement'}
                                </span>
                            </td>
                            <td className="px-3 py-3 text-right pr-4">
                                <div className="inline-flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => onGenerate(r.id, r.suggestion)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-semibold hover:bg-black transition-colors"
                                    >
                                        <Wand2 size={12} /> Generate
                                    </button>
                                    <Link
                                        href={`${portalBase}/leads/${r.id}`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                    >
                                        Open lead <ChevronRight size={12} />
                                    </Link>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ── Proposals table — leads with a saved program shortlist. Each row
//    lists the picked programs as badges; the tab is intentionally
//    read-only from here (staff manage picks via the New modal). ──
function ProposalsTable({ rows, portalBase, fmtDate, onNotify }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
                <thead>
                    <tr className="bg-gray-50/60 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-3">Profile</th>
                        <th className="px-3 py-3">Name</th>
                        <th className="px-3 py-3">Contacts</th>
                        <th className="px-3 py-3">Programs</th>
                        <th className="px-3 py-3">Created</th>
                        <th className="px-3 py-3 text-right pr-4">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {rows.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50/60 transition-colors align-top">
                            {/* ── PROFILE ─────────────────────────────── */}
                            <td className="px-4 py-3">
                                <Link href={`${portalBase}/leads/${r.id}`} className="inline-block">
                                    <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 text-gray-500 text-[11px] font-bold ring-1 ring-gray-200">
                                        {r.avatar_url
                                            ? <img src={r.avatar_url} alt={r.name} className="w-full h-full object-cover" />
                                            : rowInitials(r.name)}
                                    </div>
                                </Link>
                            </td>
                            {/* ── NAME ────────────────────────────────── */}
                            <td className="px-3 py-3">
                                <Link
                                    href={`${portalBase}/leads/${r.id}`}
                                    className="font-semibold text-gray-900 hover:text-emerald-700 hover:underline underline-offset-2 decoration-emerald-400"
                                >
                                    {r.name}
                                </Link>
                                <div className="text-[10px] text-gray-400 font-mono mt-0.5">{r.lead_id}</div>
                            </td>
                            {/* ── CONTACTS ────────────────────────────── */}
                            <td className="px-3 py-3">
                                {r.email && (
                                    <div className="text-[11px] text-gray-600 truncate max-w-[220px]">{r.email}</div>
                                )}
                                {r.phone && (
                                    <div className="text-[11px] text-gray-500 truncate max-w-[220px] mt-0.5">{r.phone}</div>
                                )}
                                {! r.email && ! r.phone && (
                                    <span className="text-[11px] text-gray-300">—</span>
                                )}
                            </td>
                            {/* ── PROGRAMS ────────────────────────────── */}
                            <td className="px-3 py-3">
                                <div className="flex flex-col gap-1.5">
                                    {r.programs.map((p) => (
                                        <div key={p.id} className="flex items-center gap-2">
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                Level {p.level}
                                            </span>
                                            <span className="text-[12px] font-medium text-gray-800 truncate max-w-[280px]" title={p.title}>
                                                {p.title}
                                            </span>
                                            {p.location && (
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap">· {p.location}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </td>
                            {/* ── CREATED ─────────────────────────────── */}
                            <td className="px-3 py-3 whitespace-nowrap text-gray-600">
                                {fmtDate(r.updated_at)}
                            </td>
                            <td className="px-3 py-3 text-right pr-4">
                                <div className="inline-flex items-center gap-1">
                                    <NotifyButton row={r} onNotify={onNotify} />
                                    <Link
                                        href={`${portalBase}/leads/${r.id}`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                    >
                                        Open lead <ChevronRight size={12} />
                                    </Link>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ── Documents table — leads that already have generated docs. Shared by
//    the Proposals + Agreements tabs (they just receive different rows). ──
// Map a stored LeadDocument (source_variant + checklist_key) back to the
// DOC_TYPES key so the "Edit" action can pre-open the modal at the same
// variant the doc was generated with.
function variantToTypeKey(doc) {
    if (doc.checklist_key === 'agree.engagement_english') return 'english_engagement';
    if (doc.checklist_key === 'agree.consultancy') {
        const parts = (doc.variant || '').split(':');
        const scenario = parts[1] || 'std_100';
        const mode = parts[2] === 'couple' ? 'couple' : 'single';
        const backend = `consultancy_${scenario}`;
        const match = DOC_TYPES.find((t) => t.backendType === backend && t.applicantMode === mode);
        return match?.value || 'consultancy_std_single_100';
    }
    return 'consultancy_std_single_100';
}

// Initials fallback for the profile avatar when there's no face image.
const rowInitials = (name = '') =>
    (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join('') || '?';

function DocumentsTable({ rows, portalBase, fmtSize, fmtDate, onNotify, onEdit }) {
    // Flatten lead-grouped rows into doc-per-row so the table renders one
    // line per generated agreement — matches the requested column layout.
    const flat = useMemo(() => rows.flatMap((r) => r.documents.map((d) => ({ ...d, lead: r }))), [rows]);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
                <thead>
                    <tr className="bg-gray-50/60 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-3">Profile</th>
                        <th className="px-3 py-3">Name</th>
                        <th className="px-3 py-3">Contacts</th>
                        <th className="px-3 py-3">Document</th>
                        <th className="px-3 py-3">Created</th>
                        <th className="px-3 py-3 text-right pr-4">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {flat.map((d) => (
                        <DocumentRow
                            key={d.id}
                            doc={d}
                            portalBase={portalBase}
                            fmtSize={fmtSize}
                            fmtDate={fmtDate}
                            onNotify={onNotify}
                            onEdit={onEdit}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function DocumentRow({ doc, portalBase, fmtSize, fmtDate, onNotify, onEdit }) {
    const { lead } = doc;
    const mode = doc.applicant_mode; // 'single' | 'couple' | null
    return (
        <tr className="hover:bg-gray-50/60 transition-colors align-top">
            {/* ── PROFILE (face image / initials) ──────────────────── */}
            <td className="px-4 py-3">
                <Link href={`${portalBase}/leads/${lead.id}`} className="inline-block">
                    <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 text-gray-500 text-[11px] font-bold ring-1 ring-gray-200">
                        {lead.avatar_url
                            ? <img src={lead.avatar_url} alt={lead.name} className="w-full h-full object-cover" />
                            : rowInitials(lead.name)}
                    </div>
                </Link>
            </td>

            {/* ── NAME (clickable → lead details) ──────────────────── */}
            <td className="px-3 py-3">
                <Link
                    href={`${portalBase}/leads/${lead.id}`}
                    className="font-semibold text-gray-900 hover:text-emerald-700 hover:underline underline-offset-2 decoration-emerald-400"
                >
                    {lead.name}
                </Link>
                <div className="text-[10px] text-gray-400 font-mono mt-0.5">{lead.lead_id}</div>
            </td>

            {/* ── CONTACTS (email + phone) ─────────────────────────── */}
            <td className="px-3 py-3">
                {lead.email && (
                    <div className="text-[11px] text-gray-600 truncate max-w-[220px]">{lead.email}</div>
                )}
                {lead.phone && (
                    <div className="text-[11px] text-gray-500 truncate max-w-[220px] mt-0.5">{lead.phone}</div>
                )}
                {! lead.email && ! lead.phone && (
                    <span className="text-[11px] text-gray-300">—</span>
                )}
            </td>

            {/* ── TYPE + applicant mode chip ───────────────────────── */}
            <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                    <FileText size={13} className="text-gray-400 shrink-0" />
                    <span className="text-[12px] font-semibold text-gray-800">{doc.type}</span>
                    {mode && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            mode === 'couple'
                                ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                            {mode}
                        </span>
                    )}
                </div>
                <div className="text-[10px] text-gray-400 mt-1 ml-[21px]">{fmtSize(doc.size)}</div>
            </td>

            {/* ── CREATED (date + staff who generated) ─────────────── */}
            <td className="px-3 py-3 whitespace-nowrap">
                <div className="text-[12px] text-gray-700 font-medium">{fmtDate(doc.created_at)}</div>
                {doc.uploader?.name && (
                    <div className="text-[11px] text-gray-500 mt-0.5">
                        by <span className="font-medium text-gray-600">{doc.uploader.name}</span>
                    </div>
                )}
            </td>

            {/* ── ACTIONS: 3-dot dropdown ──────────────────────────── */}
            <td className="px-3 py-3 text-right pr-4">
                <DocumentRowActions
                    doc={doc}
                    lead={lead}
                    onNotify={onNotify}
                    onEdit={onEdit}
                />
            </td>
        </tr>
    );
}

// 3-dot menu for the Agreements table — closes on outside click and Esc.
// Menu items call into the same endpoints as the old row buttons; Delete
// hits the DELETE route with a confirm.
function DocumentRowActions({ doc, lead, onNotify, onEdit }) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    useEffect(() => {
        if (! open) return;
        const onClick = (e) => {
            if (wrapRef.current && ! wrapRef.current.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const canEdit = doc.checklist_key === 'agree.consultancy' || doc.checklist_key === 'agree.engagement_english';
    const canEmail = !! lead.email;

    const handleDelete = () => {
        setOpen(false);
        if (! confirm(`Delete this ${doc.type}? This removes the file from ${lead.name}'s documents.`)) return;
        router.delete(`/admin/leads/${lead.id}/documents/${doc.id}`, { preserveScroll: true });
    };

    const handleEdit = () => {
        setOpen(false);
        onEdit(lead.id, 'agreement', variantToTypeKey(doc));
    };

    const handleEmail = () => {
        setOpen(false);
        onNotify(lead);
    };

    return (
        <div ref={wrapRef} className="relative inline-block">
            <button
                type="button"
                onClick={() => setOpen((v) => ! v)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    open ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
                aria-label="Row actions"
                aria-expanded={open}
            >
                <MoreVertical size={15} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl ring-1 ring-black/5 py-1.5 z-30 text-[12px]">
                    <a
                        href={`/admin/documents/${doc.id}/download?inline=1`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-700 transition-colors"
                    >
                        <Eye size={13} className="text-gray-400" /> View
                    </a>
                    <a
                        href={`/admin/documents/${doc.id}/download`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-emerald-700 transition-colors"
                    >
                        <Download size={13} className="text-gray-400" /> Download
                    </a>
                    {canEdit && (
                        <button
                            type="button"
                            onClick={handleEdit}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                            <Pencil size={13} className="text-gray-400" /> Edit / regenerate
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleEmail}
                        disabled={! canEmail}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 hover:text-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-700"
                        title={canEmail ? '' : 'Lead has no email on file'}
                    >
                        <Mail size={13} className="text-gray-400" /> Email lead
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <Trash2 size={13} /> Delete
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Program picker — replaces the PDF preview on the left of the New
//    modal when Proposal type is selected. Cap is enforced in the parent
//    (togglePicked drops the oldest pick to make room for a fourth). ───
function ProgramPicker({ allPrograms = [], programs, search, setSearch, pickedIds, togglePicked, max }) {
    const pickedSet = new Set(pickedIds);
    // Look up picked-program details from the FULL catalogue so the
    // "Selected" chips keep their titles even when an active search
    // hides those rows from the list below. `programs` is filtered;
    // `allPrograms` is the raw catalogue.
    const pickedById = new Map(allPrograms.map((p) => [p.id, p]));
    return (
        <div className="bg-white flex flex-col min-h-0 flex-1">
            <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Programs</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Tick up to {max}. The lead sees these on their tracker.</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tabular-nums ${
                        pickedIds.length === max ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                        {pickedIds.length} / {max}
                    </span>
                </div>

                {/* Selected programs — shown as chips so staff can see at
                    a glance what they've picked, and can un-pick without
                    scrolling back through the list. */}
                {pickedIds.length > 0 && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-1.5">
                            Selected · {pickedIds.length}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {pickedIds.map((id) => {
                                const p = pickedById.get(id);
                                return (
                                    <span
                                        key={id}
                                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-emerald-200 text-[11px] font-semibold text-gray-800 shadow-sm max-w-full"
                                    >
                                        {p ? (
                                            <>
                                                <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 shrink-0">
                                                    L{p.level}
                                                </span>
                                                <span className="truncate max-w-[220px]" title={p.title}>{p.title}</span>
                                            </>
                                        ) : (
                                            <span className="text-gray-500">Program #{id}</span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => togglePicked(id)}
                                            className="ml-0.5 -mr-0.5 w-4 h-4 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                            title="Remove from proposal"
                                        >
                                            <X size={11} />
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search title, location or level…"
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-gray-900"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {programs.length === 0 ? (
                    <p className="text-xs text-gray-400 italic px-2 py-6 text-center">No matching programs.</p>
                ) : programs.map((p) => {
                    const picked = pickedSet.has(p.id);
                    return (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => togglePicked(p.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                                picked ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                            picked ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        }`}>
                                            Level {p.level}
                                        </span>
                                        {p.category && (
                                            <span className={`text-[10px] font-medium capitalize ${picked ? 'text-gray-300' : 'text-gray-500'}`}>
                                                {p.category}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm font-semibold truncate">{p.title}</p>
                                    <div className={`flex items-center gap-2 mt-1 text-[11px] ${picked ? 'text-gray-300' : 'text-gray-500'}`}>
                                        {p.location && <span>{p.location}</span>}
                                        {p.price_text && <span>· {p.price_text}</span>}
                                    </div>
                                </div>
                                {picked && (
                                    <Check size={14} className="text-white mt-1 shrink-0" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ── Small design primitives used by the modal's right column ─────────

// Numbered section header with an emerald pill, tight label + optional
// muted hint on the same row, plus a trailing slot (chip / status / etc).
function StepHeader({ n, label, hint, trailing = null }) {
    return (
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#436235] text-white text-[10px] font-black tabular-nums shadow-sm">
                    {n}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-700">{label}</span>
                {hint && <span className="text-[10px] text-gray-400 italic">{hint}</span>}
            </div>
            {trailing}
        </div>
    );
}

// PhP-prefixed number input with an inline peso pill that matches the
// brand emerald. Handles the parseInt-guard so the caller stays clean.
function FeeInput({ label, value, onChange, step = 1000 }) {
    return (
        <label className="block">
            <span className="block text-[10px] font-semibold text-gray-600 mb-1">{label}</span>
            <div className="relative flex items-center rounded-lg bg-white ring-1 ring-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-600 transition-all overflow-hidden">
                <span className="pl-2.5 pr-1.5 py-1.5 text-[11px] font-black text-[#436235] bg-emerald-50 border-r border-emerald-100 tabular-nums">
                    ₱
                </span>
                <input
                    type="number"
                    min="0"
                    step={step}
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2.5 py-1.5 text-sm bg-transparent focus:outline-none tabular-nums font-semibold text-gray-900"
                />
            </div>
        </label>
    );
}

// Category resolver — colour-codes the doc-type dropdown so staff can
// see at a glance which "family" this document belongs to (Proposal /
// Consultancy / English Engagement).
function documentCategory(type) {
    if (! type) {
        return {
            label: 'Not selected',
            chip: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
            dot: 'bg-gray-400',
            border: 'border-gray-200',
        };
    }
    if (type === 'proposal') {
        return {
            label: 'Proposal',
            chip: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200',
            dot: 'bg-violet-500',
            border: 'border-violet-200',
        };
    }
    if (type === 'english_engagement') {
        return {
            label: 'English',
            chip: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200',
            dot: 'bg-sky-500',
            border: 'border-sky-200',
        };
    }
    // Everything else is a consultancy scenario.
    return {
        label: 'Consultancy',
        chip: 'bg-emerald-100 text-[#436235] ring-1 ring-emerald-200',
        dot: 'bg-[#436235]',
        border: 'border-emerald-200',
    };
}

// ── Notify button — small pill on each Proposals / Agreements row.
//    Only enabled when the lead has an email on file. ─────────────────
function NotifyButton({ row, onNotify }) {
    const hasEmail = !! row.email;
    return (
        <button
            type="button"
            disabled={! hasEmail}
            onClick={() => onNotify && onNotify(row)}
            title={hasEmail
                ? `Send ${row.name} an email about their tracker`
                : 'Lead has no email on file — cannot notify'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:text-emerald-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-50"
        >
            <Mail size={12} /> Notify
        </button>
    );
}

// ── Notify Lead modal — compact confirm dialog with an email preview
//    (subject + body) and a Send button. Queues the mail via the
//    /notify-document-ready endpoint. ─────────────────────────────────
function NotifyLeadModal({ target, onClose }) {
    const [sending, setSending] = useState(false);

    if (! target) return null;
    const { lead, kind } = target;
    const nounTitle  = kind === 'proposal' ? 'Proposal' : 'Agreement';
    const noun       = nounTitle.toLowerCase();
    const firstName  = (lead.name || '').split(' ')[0] || 'there';
    const hasEmail   = !! lead.email;
    const subject    = `Your ${nounTitle} is ready — ePathways`;

    const send = () => {
        setSending(true);
        router.post(`/admin/leads/${lead.id}/notify-document-ready`, { kind }, {
            preserveScroll: true,
            onFinish: () => { setSending(false); onClose(); },
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Mail size={16} className="text-emerald-700 shrink-0" />
                            Notify lead
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Sends {lead.name || 'the lead'} an email pointing at their tracker.
                        </p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center shrink-0">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5 space-y-3">
                    {! hasEmail && (
                        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs">
                            <AlertCircle size={14} className="mt-0.5 shrink-0" />
                            <div>
                                <p className="font-semibold">No email on file</p>
                                <p className="mt-0.5">Add an email on the lead profile before you can notify them.</p>
                            </div>
                        </div>
                    )}

                    {/* To */}
                    <div className="grid grid-cols-[68px_1fr] items-baseline gap-2 border-b border-gray-100 pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">To</span>
                        <span className="text-xs text-gray-800 truncate">
                            <span className="font-semibold">{lead.name}</span>
                            {lead.email && <span className="text-gray-500"> &lt;{lead.email}&gt;</span>}
                        </span>
                    </div>

                    {/* Subject */}
                    <div className="grid grid-cols-[68px_1fr] items-baseline gap-2 border-b border-gray-100 pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Subject</span>
                        <span className="text-xs font-semibold text-gray-900">{subject}</span>
                    </div>

                    {/* Preview */}
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Preview</p>
                        <div className="rounded-lg border border-gray-100 bg-gray-50/60 px-4 py-3 text-[12px] text-gray-700 leading-relaxed space-y-2">
                            <p><span className="font-semibold">Hi {firstName},</span></p>
                            <p>We've prepared your {noun} and it's waiting on your personal tracker. Open the link below to review it — no login required.</p>
                            <div className="inline-block px-3 py-1.5 rounded-md bg-gray-900 text-white text-[11px] font-bold">
                                Open my tracker →
                            </div>
                            <p className="text-[11px] text-gray-500 italic">Ngā mihi, The ePathways team</p>
                        </div>
                    </div>
                </div>

                <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-2 bg-gray-50/50">
                    <p className="text-[11px] text-gray-500 italic">
                        Sends via the ePathways queue — usually within a minute.
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={! hasEmail || sending}
                            onClick={send}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black disabled:opacity-60 transition-colors"
                        >
                            {sending ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
                            Send notification
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── New Document modal — pick lead + type, then either save program picks
//    (Proposal type) or POST to the generate endpoint (Agreements). ─────
// 6 flat consultancy options (Single / Couple baked into each) + 1
// English Engagement + Proposal. `backendType` is the type key the
// server route knows; `applicantMode` gets sent alongside so the PDF
// swaps the applicant line + cost breakdown. `defaultSchoolFee` is
// the fee that pre-fills the Settings panel — staff can override.
const DOC_TYPES = [
    { value: 'proposal',                          label: 'Study Proposal',                                 hint: 'Suggest up to 3 programs — the lead picks one on their tracker.' },

    { value: 'consultancy_std_single_100',        label: 'Standard · Single · 100,000',                    hint: 'Sole applicant. School Enrolment + Documentation Fee.',                                       backendType: 'consultancy_std_100',     applicantMode: 'single', defaultSchoolFee: 100000 },
    { value: 'consultancy_std_single_150',        label: 'Standard · Single · 150,000',                    hint: 'Sole applicant. School Enrolment + INZ visa application fee.',                                backendType: 'consultancy_std_150',     applicantMode: 'single', defaultSchoolFee: 150000 },
    { value: 'consultancy_std_couple_150',        label: 'Standard · Couple · 150,000',                    hint: 'Applicant + partner. School Enrolment + INZ visa application fee.',                           backendType: 'consultancy_std_150',     applicantMode: 'couple', defaultSchoolFee: 150000 },
    { value: 'consultancy_voucher_single_150',    label: 'With Voucher · Single · 150,000',                hint: 'Sole applicant. Inclusive of the INZ visa application fee (voucher).',                        backendType: 'consultancy_voucher_150', applicantMode: 'single', defaultSchoolFee: 150000 },
    { value: 'consultancy_voucher_couple_150',    label: 'With Voucher · Couple · 150,000',                hint: 'Applicant + partner. Inclusive of the INZ visa application fee (voucher).',                   backendType: 'consultancy_voucher_150', applicantMode: 'couple', defaultSchoolFee: 150000 },
    { value: 'consultancy_english_single_100',    label: 'With English · Single · 100,000',                hint: 'Sole applicant with English review add-on.',                                                  backendType: 'consultancy_english_100', applicantMode: 'single', defaultSchoolFee: 100000 },

    { value: 'english_engagement',                label: 'English Engagement Agreement',                   hint: 'PTE preparation services (separate document).' },
];
const CONSULTANCY_TYPES = new Set(DOC_TYPES.filter((t) => t.backendType).map((t) => t.value));
const MAX_PROPOSED_PROGRAMS = 3;
const DEFAULT_ENGLISH_FEE = 14500;

function NewDocumentModal({ open, onClose, picker, programs = [], prefill = null }) {
    const [leadId, setLeadId] = useState('');
    // No default — staff must actively pick a doc type. Empty string
    // keeps the preview area empty and the Generate button disabled.
    const [type, setType] = useState('');
    const [leadSearch, setLeadSearch] = useState('');
    const [programSearch, setProgramSearch] = useState('');
    const [pickedProgramIds, setPickedProgramIds] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    // Editable amounts on the Settings panel — only surfaced for the 4
    // consultancy scenarios. Defaults come from the selected DOC_TYPE.
    const [schoolFee, setSchoolFee] = useState(100000);
    const [englishFee, setEnglishFee] = useState(DEFAULT_ENGLISH_FEE);
    // Preview iframe loading state — flipped to true whenever the URL
    // changes, back to false when the iframe fires `onLoad`. Gives staff
    // a spinner instead of a suspicious white A4 while dompdf renders.
    const [previewLoading, setPreviewLoading] = useState(false);
    // Email opt-in — checked by default. When true and the chosen lead
    // has an email, the modal fires the notify endpoint right after the
    // generate/save so the client gets a nudge on the same click.
    const [notify, setNotify] = useState(true);

    // When the modal opens with a prefill (from the Suggestions tab's
    // Generate action) pre-select that lead + doc type so staff can just
    // hit "Generate" without re-picking.
    useEffect(() => {
        if (! open) return;
        if (prefill) {
            setLeadId(prefill.leadId);
            setType(prefill.type);
        } else {
            setLeadId('');
            setType('');
        }
        setPickedProgramIds([]);
        setProgramSearch('');
        setNotify(true);
    }, [open, prefill]);

    // Reset the fee amounts to the scenario's defaults whenever the type
    // changes. Staff can then edit before generating; edits stay put
    // while they flip around within the same scenario.
    useEffect(() => {
        const meta = DOC_TYPES.find((t) => t.value === type);
        setSchoolFee(meta?.defaultSchoolFee ?? 100000);
        setEnglishFee(DEFAULT_ENGLISH_FEE);
    }, [type]);

    // Resolve the selected doc-type entry once — used for backendType +
    // applicantMode when building the preview URL and the submit body.
    const typeMeta = useMemo(() => DOC_TYPES.find((t) => t.value === type) || null, [type]);

    const filteredPicker = useMemo(() => {
        const q = leadSearch.trim().toLowerCase();
        if (! q) return picker.slice(0, 50);
        return picker.filter((p) =>
            (p.name || '').toLowerCase().includes(q)
            || (p.email || '').toLowerCase().includes(q)
            || (p.lead_id || '').toLowerCase().includes(q)
        ).slice(0, 50);
    }, [picker, leadSearch]);

    // Proposal path saves a program shortlist; every other type kicks off
    // the templated PDF generator. Keep both paths behind the same
    // "Generate" button so staff don't have to think about it.
    // Chosen lead — used by the email opt-in row + the case chip.
    const chosenLead = useMemo(
        () => picker.find((p) => p.id === leadId) || null,
        [picker, leadId],
    );
    const canNotify = !! chosenLead?.email;

    const submit = () => {
        if (! leadId || ! type) return;
        setSubmitting(true);
        const isProposal = type === 'proposal';
        const routeType = typeMeta?.backendType || type;
        const url = isProposal
            ? `/admin/leads/${leadId}/proposal`
            : `/admin/leads/${leadId}/generate/${routeType}`;
        // Consultancy scenarios carry the editable fees + baked-in
        // applicant_mode along so the saved PDF reflects whatever staff
        // typed on the Settings panel and which Single/Couple option they
        // originally chose.
        const payload = isProposal
            ? { program_ids: pickedProgramIds }
            : (isConsultancyType
                ? {
                    school_enrolment_fee: schoolFee,
                    english_proficiency_fee: englishFee,
                    applicant_mode: typeMeta?.applicantMode || 'single',
                }
                : {});

        const finish = () => {
            setSubmitting(false);
            onClose();
            setLeadId('');
            setType('');
            setLeadSearch('');
            setPickedProgramIds([]);
            setNotify(true);
        };

        router.post(url, payload, {
            preserveScroll: true,
            onSuccess: () => {
                // Chain the notify email if the checkbox is on AND the
                // lead has an email. Two POSTs — cheap, keeps endpoints
                // single-responsibility, and Inertia surfaces both flash
                // messages via the global FlashToaster.
                if (notify && canNotify) {
                    router.post(`/admin/leads/${leadId}/notify-document-ready`, {
                        kind: isProposal ? 'proposal' : 'agreement',
                    }, {
                        preserveScroll: true,
                        onFinish: finish,
                    });
                } else {
                    finish();
                }
            },
            onError: finish,
        });
    };

    // Filtered programs for the picker (case-insensitive title / level / location).
    const filteredPrograms = useMemo(() => {
        const q = programSearch.trim().toLowerCase();
        if (! q) return programs;
        return programs.filter((p) =>
            (p.title || '').toLowerCase().includes(q)
            || (p.location || '').toLowerCase().includes(q)
            || String(p.level ?? '').includes(q)
        );
    }, [programs, programSearch]);

    const togglePickedProgram = (id) => {
        setPickedProgramIds((prev) => {
            if (prev.includes(id)) return prev.filter((x) => x !== id);
            if (prev.length >= MAX_PROPOSED_PROGRAMS) {
                // Hard cap — drop the oldest pick to make room for the new one.
                return [...prev.slice(1), id];
            }
            return [...prev, id];
        });
    };

    const isProposalType = type === 'proposal';
    // Must have a lead AND an explicitly chosen type. Proposals also
    // require at least one picked program.
    const canSubmit = leadId && type && (! isProposalType || pickedProgramIds.length > 0);

    const isConsultancyType = CONSULTANCY_TYPES.has(type);

    // Live iframe preview URL — same lead + type params the generate
    // endpoint uses, but hits the preview route which renders the Blade
    // as HTML (skipping dompdf) so it's fast enough for interactive use.
    // For consultancy scenarios, the editable fees ride along as query
    // params so the preview updates the moment staff type a new amount.
    const previewUrl = useMemo(() => {
        if (! leadId || ! type) return null;
        // Consultancy dropdown items map to a backend `type` + a baked-in
        // applicant_mode; everything else passes through as-is.
        const routeType = typeMeta?.backendType || type;
        const base = `/admin/leads/${leadId}/generate/${routeType}/preview`;
        if (! isConsultancyType) return base;
        const params = new URLSearchParams({
            school_enrolment_fee: String(schoolFee || 0),
            english_proficiency_fee: String(englishFee || 0),
            applicant_mode: typeMeta?.applicantMode || 'single',
        });
        return `${base}?${params.toString()}`;
    }, [leadId, type, isConsultancyType, schoolFee, englishFee, typeMeta]);

    // Reset the loading flag every time the URL swings — the iframe's
    // onLoad callback will clear it once the new content is painted.
    useEffect(() => {
        if (previewUrl) setPreviewLoading(true);
    }, [previewUrl]);

    if (! open) return null;
    const currentTypeLabel = typeMeta?.label || 'Select a document type';
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-[1500px] h-[94vh] flex flex-col overflow-hidden">

                {/* ── HEADER ───────────────────────────────────────────── */}
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
                            <FileSignature size={16} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-[15px] font-bold text-gray-900 leading-tight">New proposal or agreement</h3>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                                {isProposalType
                                    ? 'Pick up to 3 programs; the lead chooses one on their tracker.'
                                    : 'Preview updates as you change lead or type. Generate attaches a PDF to the lead\'s documents.'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ── BODY: fixed 380px sidebar + fluid preview ─────── */}
                <div className="flex-1 flex min-h-0">

                    {/* ── LEFT SIDEBAR ─────────────────────────────── */}
                    <div className={`w-[380px] border-r border-gray-100 flex flex-col min-h-0 flex-shrink-0 ${isProposalType ? '' : 'overflow-y-auto'}`}>

                        {/* Lead section */}
                        <div className="px-5 py-4 border-b border-gray-100">
                            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 mb-2">Lead</div>
                            {chosenLead ? (
                                <div className="bg-gray-900 border border-gray-900 rounded-lg px-3 py-2.5 flex items-center justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-bold text-white truncate leading-tight">
                                            {chosenLead.name || `Lead #${leadId}`}
                                        </div>
                                        <div className="text-[11px] text-gray-300 font-mono truncate mt-0.5">
                                            {chosenLead.lead_id}{chosenLead.email ? ` · ${chosenLead.email}` : ''}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setLeadId(''); setLeadSearch(''); }}
                                        className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center flex-shrink-0 transition-colors"
                                        aria-label="Clear lead"
                                    >
                                        <X size={13} className="text-gray-300" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={leadSearch}
                                            onChange={(e) => setLeadSearch(e.target.value)}
                                            placeholder="Search name, email or LP ID…"
                                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all"
                                        />
                                    </div>
                                    <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-gray-100 divide-y divide-gray-50 bg-white">
                                        {filteredPicker.length === 0 ? (
                                            <p className="text-xs text-gray-400 italic px-3 py-3 text-center">No matching leads.</p>
                                        ) : filteredPicker.map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => setLeadId(p.id)}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50 transition-colors"
                                            >
                                                <span className="font-semibold text-gray-800 truncate">{p.name}</span>
                                                <span className="ml-auto text-[10px] font-mono text-gray-400 shrink-0">{p.lead_id}</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Document type section */}
                        <div className="px-5 py-4 border-b border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Document type</div>
                                {type && (() => {
                                    const cat = documentCategory(type);
                                    return (
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${cat.chip}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                                            {cat.label}
                                        </span>
                                    );
                                })()}
                            </div>
                            <div className="relative">
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className={`w-full appearance-none pl-3 pr-9 py-2 rounded-lg text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all font-semibold ${type ? 'text-gray-900' : 'text-gray-400'}`}
                                >
                                    <option value="" disabled>Select a document type…</option>
                                    <optgroup label="Proposal">
                                        <option value="proposal">Study Proposal</option>
                                    </optgroup>
                                    <optgroup label="Consultancy · Single">
                                        <option value="consultancy_std_single_100">Standard · 100,000</option>
                                        <option value="consultancy_std_single_150">Standard · 150,000</option>
                                        <option value="consultancy_voucher_single_150">With Voucher · 150,000</option>
                                        <option value="consultancy_english_single_100">With English · 100,000</option>
                                    </optgroup>
                                    <optgroup label="Consultancy · Couple">
                                        <option value="consultancy_std_couple_150">Standard · 150,000</option>
                                        <option value="consultancy_voucher_couple_150">With Voucher · 150,000</option>
                                    </optgroup>
                                    <optgroup label="Other">
                                        <option value="english_engagement">English Engagement Agreement</option>
                                    </optgroup>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                            <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                                {type
                                    ? (DOC_TYPES.find((t) => t.value === type) || {}).hint
                                    : 'Nothing generates until you pick a type.'}
                            </p>
                        </div>

                        {/* Fees section — consultancy only */}
                        {isConsultancyType && (
                            <div className="px-5 py-4 border-b border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Fees · PhP</div>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        LIVE
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <FeeInput
                                        label="School Enrolment"
                                        value={schoolFee}
                                        onChange={setSchoolFee}
                                        step={1000}
                                    />
                                    <FeeInput
                                        label="English Proficiency"
                                        value={englishFee}
                                        onChange={setEnglishFee}
                                        step={500}
                                    />
                                </div>
                                <div className="mt-3 flex items-baseline justify-between border-t border-gray-100 pt-2.5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Combined</span>
                                    <span className="text-base font-black text-gray-900 tabular-nums">
                                        ₱{(schoolFee + englishFee).toLocaleString('en-PH')}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Program picker — proposal only. Fills the
                            remainder of the sidebar so its own scroll
                            takes over below Lead + Document Type. */}
                        {isProposalType && (
                            <div className="flex-1 min-h-0 flex flex-col">
                                <ProgramPicker
                                    allPrograms={programs}
                                    programs={filteredPrograms}
                                    search={programSearch}
                                    setSearch={setProgramSearch}
                                    pickedIds={pickedProgramIds}
                                    togglePicked={togglePickedProgram}
                                    max={MAX_PROPOSED_PROGRAMS}
                                />
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT: preview area ──────────────────────── */}
                    <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
                        {/* Preview label strip */}
                        <div className="px-4 py-2.5 border-b border-gray-100 bg-white flex items-center gap-3 flex-shrink-0">
                            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">Preview</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {type ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-900 text-white text-[11px] font-semibold">
                                        <FileText size={11} />
                                        {currentTypeLabel}
                                    </span>
                                ) : (
                                    <span className="text-[11px] text-gray-400 italic">nothing selected yet</span>
                                )}
                            </div>
                        </div>

                        {/* Preview surface */}
                        <div className="flex-1 relative min-h-0">
                            {isProposalType ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 bg-gray-50">
                                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-3">
                                        <Lightbulb size={22} className="text-gray-400" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-800">
                                        {pickedProgramIds.length} of {MAX_PROPOSED_PROGRAMS} programs selected
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 max-w-sm">
                                        Study proposals aren't a PDF — the lead picks their preferred program from the shortlist on their tracker.
                                    </p>
                                </div>
                            ) : previewUrl ? (
                                <>
                                    <iframe
                                        key={previewUrl}
                                        src={previewUrl}
                                        title="Document preview"
                                        sandbox="allow-same-origin"
                                        onLoad={() => setPreviewLoading(false)}
                                        className="absolute inset-0 w-full h-full bg-white"
                                    />
                                    {previewLoading && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm z-10">
                                            <div className="relative">
                                                <div className="w-11 h-11 rounded-full border-2 border-gray-200" />
                                                <div className="absolute inset-0 w-11 h-11 rounded-full border-2 border-transparent border-t-gray-900 border-r-gray-900 animate-spin" />
                                                <FileText size={16} className="absolute inset-0 m-auto text-gray-900" />
                                            </div>
                                            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-gray-900">Rendering preview</p>
                                            <p className="mt-0.5 text-[10px] text-gray-500 italic">a few seconds…</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-3">
                                        <FileText size={22} className="text-gray-400" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-800">Preview will appear here</p>
                                    <p className="text-xs text-gray-500 mt-1">Pick a lead + document type in the left panel.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── FOOTER ───────────────────────────────────────── */}
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-4 flex-shrink-0 bg-white">
                    {/* Email opt-in — sits on the left of the footer.
                        Disabled when the chosen lead has no email since
                        the notify endpoint would fail. */}
                    <label className={`flex items-center gap-2 text-xs ${canNotify ? 'text-gray-700 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}>
                        <button
                            type="button"
                            onClick={() => canNotify && setNotify((v) => ! v)}
                            disabled={! canNotify}
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                                notify && canNotify
                                    ? 'bg-gray-900 border-gray-900'
                                    : 'bg-white border-gray-300'
                            } ${canNotify ? '' : 'opacity-60'}`}
                            aria-checked={notify && canNotify}
                            role="checkbox"
                        >
                            {notify && canNotify && <Check size={11} className="text-white" strokeWidth={3} />}
                        </button>
                        <Mail size={13} className={canNotify ? 'text-gray-500' : 'text-gray-300'} />
                        <span>
                            Email the client that their documents are available in the application tracker
                            {chosenLead?.email && <span className="text-gray-400"> · {chosenLead.email}</span>}
                            {chosenLead && ! chosenLead.email && <span className="text-gray-400 italic"> · no email on file</span>}
                        </span>
                    </label>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-[11px] text-gray-500">
                            {isProposalType
                                ? `${pickedProgramIds.length} program${pickedProgramIds.length === 1 ? '' : 's'} selected`
                                : type
                                    ? '1 document selected'
                                    : 'no document selected'}
                        </span>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={! canSubmit || submitting}
                            onClick={submit}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        >
                            {submitting ? <Loader size={14} className="animate-spin" /> : <Plus size={14} />}
                            {isProposalType ? 'Save proposal' : 'Generate'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
