import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { toast } from "sonner";
import {
    Globe, ChevronRight, ChevronDown, AlertTriangle, Search,
    FileText, ExternalLink, Users, Calendar, ArrowUpDown,
    ArrowUp, ArrowDown, Plus, X, TrendingUp, Copy, MoreHorizontal,
    Archive, Pencil, Mail, Phone,
} from "lucide-react";

/**
 * Distribution palette — colour per immigration stage. Kept distinct from
 * the global app palette so the bar chart reads as its own object. Order
 * matches Lead::IMMIGRATION_STAGES + the trailing "Unassigned" bucket.
 */
const STAGE_COLORS = {
    'Endorsed':                'bg-sky-500',
    'Agreement Sent':          'bg-purple-500',
    'Agreement Signed':        'bg-teal-500',
    'For Agreement & Invoice':             'bg-orange-500',
    'Invoice Paid':            'bg-lime-500',
    'Visa Lodged':             'bg-indigo-500',
    'Request for Information': 'bg-amber-500',
    'Approved in Principle':   'bg-violet-500',
    'Approved Visa':           'bg-emerald-500',
    'Decline Visa':            'bg-rose-500',
    'Unassigned':              'bg-gray-300',
};

// Hex tones for the line graph — picked to match the Education page's
// equivalent palette so an admin looking at both pages gets the same
// visual story (sky → amber → indigo → emerald → rose).
const STAGE_HEX = {
    'Endorsed':                '#0ea5e9',
    'Agreement Sent':          '#a855f7',
    'Agreement Signed':        '#14b8a6',
    'For Agreement & Invoice':             '#f97316',
    'Invoice Paid':            '#84cc16',
    'Visa Lodged':             '#6366f1',
    'Request for Information': '#f59e0b',
    'Approved in Principle':   '#8b5cf6',
    'Approved Visa':           '#22c55e',
    'Decline Visa':            '#ef4444',
    'Unassigned':              '#9ca3af',
};
const stageHex = (s) => STAGE_HEX[s] || '#9ca3af';

const STAGE_CHIP = {
    'Endorsed':                'bg-sky-50 text-sky-700 border-sky-200',
    'Agreement Sent':          'bg-purple-50 text-purple-700 border-purple-200',
    'Agreement Signed':        'bg-teal-50 text-teal-700 border-teal-200',
    'For Agreement & Invoice':             'bg-orange-50 text-orange-700 border-orange-200',
    'Invoice Paid':            'bg-lime-50 text-lime-700 border-lime-200',
    'Visa Lodged':             'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Request for Information': 'bg-amber-50 text-amber-700 border-amber-200',
    'Approved in Principle':   'bg-violet-50 text-violet-700 border-violet-200',
    'Approved Visa':           'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Decline Visa':            'bg-rose-50 text-rose-700 border-rose-200',
};

const stageChipClass = (stage) =>
    STAGE_CHIP[stage] || 'bg-gray-100 text-gray-500 border-gray-200 border-dashed';

/**
 * The Cases list is split into four tabs that follow the case through the
 * pipeline. Between them they cover every immigration stage, so a case
 * always lives in exactly one tab — nothing is hidden.
 */
const CASE_TABS = [
    { key: 'applications', label: 'Applications', hint: 'Assessment & RFI',  stages: ['For Assessment', 'Request for Information'] },
    { key: 'advisers',     label: 'Advisers',     hint: 'Endorsed → Invoice', stages: ['Endorsed', 'Agreement Sent', 'Agreement Signed', 'For Agreement & Invoice'] },
    { key: 'invoice',      label: 'Invoice',      hint: 'Invoice paid',       stages: ['Invoice Paid'] },
    { key: 'visa',         label: 'Visa',         hint: 'Lodged → outcome',   stages: ['Visa Lodged', 'Approved in Principle', 'Approved Visa', 'Decline Visa'] },
];

// Which tab a stage belongs to. Cases with no stage yet fall into
// Applications — that's where the journey starts.
const tabKeyForStage = (stage) => {
    if (! stage) return 'applications';
    const hit = CASE_TABS.find((t) => t.stages.includes(stage));
    return hit ? hit.key : 'applications';
};

export default function ImmigrationCases({ cases = [], distribution = [], priorities = {}, stages = [], visaTypes = [] }) {
    const [search, setSearch] = useState("");
    const [stageFilter, setStageFilter] = useState(null); // click a bar/legend → filter
    const [sortKey, setSortKey] = useState("updated_at");
    const [sortDir, setSortDir] = useState("desc");
    const [openStageMenuId, setOpenStageMenuId] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [creating, setCreating] = useState(false);
    const [editingCase, setEditingCase] = useState(null); // case row being edited
    const [tab, setTab] = useState('applications');

    const tabCounts = useMemo(() => {
        const counts = {};
        for (const t of CASE_TABS) counts[t.key] = 0;
        for (const c of cases) counts[tabKeyForStage(c.immigration_stage)] += 1;
        return counts;
    }, [cases]);

    // Filtered + sorted slice the table actually renders.
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return cases.filter((c) => {
            if (tabKeyForStage(c.immigration_stage) !== tab) return false;
            if (stageFilter) {
                const s = c.immigration_stage || 'Unassigned';
                if (s !== stageFilter) return false;
            }
            if (!q) return true;
            return [
                c.name, c.lead_id, c.email, c.phone, c.country, c.inz_visa_type, c.inz_reference,
            ].some((v) => (v || '').toString().toLowerCase().includes(q));
        });
    }, [cases, search, stageFilter, tab]);

    const sorted = useMemo(() => {
        const arr = [...filtered];
        arr.sort((a, b) => {
            // Priority always leads: urgent → medium → low → no-priority,
            // regardless of the active column sort.
            const pr = priorityRank(a.immigration_priority) - priorityRank(b.immigration_priority);
            if (pr !== 0) return pr;

            const pull = (row) => {
                if (sortKey === 'name') return (row.name || '').toLowerCase();
                if (sortKey === 'stage') return row.immigration_stage || 'zzzz';
                if (sortKey === 'visa') return row.inz_visa_type || '';
                if (sortKey === 'country') return row.country || '';
                if (sortKey === 'lodged_at') return row.inz_lodged_at || '';
                return row.updated_at || '';
            };
            const av = pull(a), bv = pull(b);
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return arr;
    }, [filtered, sortKey, sortDir]);

    const toggleSort = (key) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    const total = distribution.reduce((sum, d) => sum + (d.count || 0), 0);

    return (
        <div className="space-y-5 max-w-[1400px] mx-auto pb-12">
            <Head title="Cases — Immigration" />

            {/* Overview: stage graph fills the left, priority cards sit in a
                2×3 grid on the right (matches the requested layout). */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch">
                <div className="lg:flex-1 min-w-0">
                    <DistributionGraph
                        distribution={distribution}
                        total={total}
                        activeStage={stageFilter}
                        onPick={(stage) => setStageFilter(stageFilter === stage ? null : stage)}
                    />
                </div>
                <div className="lg:w-[340px] flex-shrink-0">
                    <PriorityBreakdown priorities={priorities} />
                </div>
            </div>

            <div className="flex items-center justify-end">
                <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors flex items-center gap-2 flex-shrink-0"
                >
                    <Plus size={14} strokeWidth={2.5} /> Add new case
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                {/* Tabs — follow the case through the stage pipeline */}
                <div className="flex px-4 sm:px-5 border-b border-gray-100 overflow-x-auto">
                    {CASE_TABS.map((t) => {
                        const active = tab === t.key;
                        return (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => { setTab(t.key); setStageFilter(null); }}
                                className={`inline-flex items-center gap-2 px-4 py-3 text-[13px] font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                                    active
                                        ? 'text-gray-900 border-gray-900'
                                        : 'text-gray-500 border-transparent hover:text-gray-800'
                                }`}
                                aria-current={active ? 'page' : undefined}
                            >
                                <span>{t.label}</span>
                                {t.hint && (
                                    <span className="text-[10.5px] font-medium text-gray-400 hidden lg:inline">({t.hint})</span>
                                )}
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                    active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {tabCounts[t.key] ?? 0}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="px-4 sm:px-5 py-3 flex items-center gap-3 border-b border-gray-100">
                    <div className="relative flex-1 max-w-md">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, lead ID, INZ reference, visa type…"
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:bg-white focus:border-gray-300 transition-colors"
                        />
                    </div>
                    {stageFilter && (
                        <button
                            type="button"
                            onClick={() => setStageFilter(null)}
                            className="text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 px-2 py-1 flex items-center gap-1"
                        >
                            Clear filter: {stageFilter}
                            <span className="text-gray-300">×</span>
                        </button>
                    )}
                    <div className="text-[11px] font-semibold text-gray-500 ml-auto">
                        Showing <span className="text-gray-900">{sorted.length}</span> of {cases.length} cases
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto overflow-y-visible">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-gray-50/60 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                <th className="pl-4 pr-2 py-3 w-6" />
                                <SortableTh label="Case"        sortKey="name"      current={sortKey} dir={sortDir} onSort={toggleSort} />
                                <SortableTh label="Stage"       sortKey="stage"     current={sortKey} dir={sortDir} onSort={toggleSort} />
                                <SortableTh label="Visa"        sortKey="visa"      current={sortKey} dir={sortDir} onSort={toggleSort} />
                                <SortableTh label="Country"     sortKey="country"   current={sortKey} dir={sortDir} onSort={toggleSort} />
                                <th className="px-3 py-3">Docs</th>
                                <SortableTh label="Updated" sortKey="updated_at" current={sortKey} dir={sortDir} onSort={toggleSort} />
                                <th className="px-3 py-3 text-right pr-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sorted.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <Globe size={22} />
                                            <p className="text-sm font-medium">
                                                {cases.length === 0 ? "No active cases yet." : "No cases match your filters."}
                                            </p>
                                            {cases.length === 0 && (
                                                <p className="text-[11px]">Leads in Visa Process or Consultancy Agreement appear here.</p>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : sorted.map((c) => (
                                <CaseRow
                                    key={c.id}
                                    c={c}
                                    stages={stages}
                                    visaTypes={visaTypes}
                                    isExpanded={expandedId === c.id}
                                    onExpand={() => setExpandedId(expandedId === c.id ? null : c.id)}
                                    stageMenuOpen={openStageMenuId === c.id}
                                    onStageMenuToggle={() => setOpenStageMenuId(openStageMenuId === c.id ? null : c.id)}
                                    onStageMenuClose={() => setOpenStageMenuId(null)}
                                    onEdit={() => setEditingCase(c)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {(creating || editingCase) && (
                <CreateCaseModal
                    key={editingCase?.id || "new"}
                    editing={editingCase}
                    stages={stages}
                    visaTypes={visaTypes}
                    onClose={() => { setCreating(false); setEditingCase(null); }}
                />
            )}
        </div>
    );
}

// ─── Create case modal ─────────────────────────────────────────────────

function CreateCaseModal({ stages, visaTypes, editing = null, onClose }) {
    const isEdit = !!editing;
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        first_name: editing?.first_name || '',
        middle_name: editing?.middle_name || '',
        last_name: editing?.last_name || '',
        suffix: editing?.suffix || '',
        gender: editing?.gender || '',
        email: editing?.email || '',
        phone: editing?.phone || '',
        immigration_stage: editing?.immigration_stage || stages[0] || '',
        immigration_priority: editing?.immigration_priority || '',
        internal_note: '',
        payment: editing?.payment || '',
        // The case row stores the visa *name* (inz_visa_type); map it back to
        // the matching option id so the dropdown pre-selects on edit.
        visa_type_id: editing
            ? (visaTypes.find((v) => v.name === editing.inz_visa_type)?.id ?? '')
            : '',
    });

    const [tab, setTab] = useState("personal"); // personal | documents (edit only)

    const submit = (e) => {
        e?.preventDefault();
        clearErrors();
        const url = isEdit ? `/portal/immigration/cases/${editing.id}` : `/portal/immigration/cases`;
        post(url, {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
        });
    };

    const fullName = `${data.first_name} ${data.last_name}`.trim() || editing?.name || "New case";

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Title bar */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit case' : 'New case'}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {isEdit ? "Update this case's details." : 'Adds a new immigration case directly to the queue.'}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700">
                        <X size={18} />
                    </button>
                </div>

                {/* Profile header — name · contacts · status */}
                <div className="px-6 py-3.5 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between gap-4 flex-wrap shrink-0">
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{fullName}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-3 flex-wrap">
                            {data.email && <span className="inline-flex items-center gap-1"><Mail size={11} className="text-gray-400" />{data.email}</span>}
                            {data.phone && <span className="inline-flex items-center gap-1"><Phone size={11} className="text-gray-400" />{data.phone}</span>}
                        </p>
                    </div>
                    {data.immigration_stage && (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${stageChipClass(data.immigration_stage)}`}>
                            {data.immigration_stage}
                        </span>
                    )}
                </div>

                {/* Tabs — Documents only exists for a saved case */}
                {isEdit && (
                    <div className="px-6 border-b border-gray-100 flex items-center gap-1 shrink-0">
                        {[
                            { k: 'personal', label: 'Personal info' },
                            { k: 'documents', label: 'Documents' },
                        ].map((t) => (
                            <button key={t.k} type="button" onClick={() => setTab(t.k)}
                                className={`px-3 py-3 text-xs font-bold -mb-px border-b-2 transition-colors ${
                                    tab === t.k ? 'text-gray-900 border-gray-900' : 'text-gray-400 border-transparent hover:text-gray-700'
                                }`}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {(!isEdit || tab === 'personal') && (
                    <form id="caseModalForm" onSubmit={submit} className="space-y-4">
                    {/* Name row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <CaseField label="First name" required error={errors.first_name}>
                            <input
                                type="text"
                                value={data.first_name}
                                onChange={(e) => setData('first_name', e.target.value)}
                                maxLength={80}
                                autoFocus
                                className={caseInput(errors.first_name)}
                            />
                        </CaseField>
                        <CaseField label="Middle name" error={errors.middle_name}>
                            <input
                                type="text"
                                value={data.middle_name}
                                onChange={(e) => setData('middle_name', e.target.value)}
                                maxLength={80}
                                className={caseInput(errors.middle_name)}
                            />
                        </CaseField>
                        <CaseField label="Last name" required error={errors.last_name}>
                            <input
                                type="text"
                                value={data.last_name}
                                onChange={(e) => setData('last_name', e.target.value)}
                                maxLength={80}
                                className={caseInput(errors.last_name)}
                            />
                        </CaseField>
                        <CaseField label="Suffix" hint="Optional (Jr., Sr., III…)" error={errors.suffix}>
                            <input
                                type="text"
                                value={data.suffix}
                                onChange={(e) => setData('suffix', e.target.value)}
                                maxLength={20}
                                className={caseInput(errors.suffix)}
                            />
                        </CaseField>
                    </div>

                    <CaseField label="Gender" hint="Optional" error={errors.gender}>
                        <select
                            value={data.gender}
                            onChange={(e) => setData('gender', e.target.value)}
                            className={caseInput(errors.gender)}
                        >
                            <option value="">—</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                    </CaseField>

                    {/* Contact row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <CaseField label="Email" error={errors.email}>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                maxLength={120}
                                className={caseInput(errors.email)}
                            />
                        </CaseField>
                        <CaseField label="Contact number" error={errors.phone}>
                            <input
                                type="tel"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                maxLength={40}
                                className={caseInput(errors.phone)}
                            />
                        </CaseField>
                    </div>

                    {/* Stage + visa */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <CaseField label="Stage" required error={errors.immigration_stage}>
                            <select
                                value={data.immigration_stage}
                                onChange={(e) => setData('immigration_stage', e.target.value)}
                                className={caseInput(errors.immigration_stage)}
                            >
                                {stages.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </CaseField>
                        <CaseField label="Visa type" error={errors.visa_type_id}>
                            <select
                                value={data.visa_type_id}
                                onChange={(e) => setData('visa_type_id', e.target.value)}
                                className={caseInput(errors.visa_type_id)}
                            >
                                <option value="">— pick a visa type —</option>
                                {visaTypes.map((v) => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                        </CaseField>
                    </div>

                    {/* Priority + payment */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <CaseField label="Priority" hint="Sets the colour of the case avatar" error={errors.immigration_priority}>
                            <select
                                value={data.immigration_priority}
                                onChange={(e) => setData('immigration_priority', e.target.value)}
                                className={caseInput(errors.immigration_priority)}
                            >
                                <option value="">— none —</option>
                                <option value="urgent">🔴 Urgent — needs action today</option>
                                <option value="high">🟠 High — action this week</option>
                                <option value="medium">🟡 Medium — scheduled / on track</option>
                                <option value="low">🟢 Low — no rush</option>
                                <option value="done">✅ Done — completed</option>
                            </select>
                        </CaseField>
                        <CaseField label="Payment" hint="Optional — free-form (e.g. amount, reference, status)" error={errors.payment}>
                            <input
                                type="text"
                                value={data.payment}
                                onChange={(e) => setData('payment', e.target.value)}
                                maxLength={120}
                                placeholder="e.g. $500 deposit · ref 12345"
                                className={caseInput(errors.payment)}
                            />
                        </CaseField>
                    </div>

                    <CaseField label="Internal note" hint="Optional — only staff see this" error={errors.internal_note}>
                        <textarea
                            value={data.internal_note}
                            onChange={(e) => setData('internal_note', e.target.value)}
                            maxLength={5000}
                            rows={3}
                            placeholder="Anything the next adviser opening this case should know."
                            className={caseInput(errors.internal_note)}
                        />
                    </CaseField>

                    </form>
                    )}

                    {isEdit && tab === 'documents' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <DocStat label="Total"    value={editing?.docs_total ?? 0} />
                                <DocStat label="Approved" value={editing?.docs_approved ?? 0} tone="emerald" />
                                <DocStat label="Pending"  value={editing?.docs_pending ?? 0} tone="amber" />
                                <DocStat label="Rejected" value={editing?.docs_rejected ?? 0} tone="rose" />
                            </div>
                            <Link
                                href={`/portal/immigration/cases/${editing?.id}/profile?tab=documents`}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black transition-colors"
                            >
                                <FileText size={13} /> Manage documents
                            </Link>
                            <p className="text-[11px] text-gray-400">
                                Upload, review and organise this case's documents in the full documents workspace.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                    <button type="button" onClick={onClose} disabled={processing}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                        Cancel
                    </button>
                    <button type="button" onClick={submit} disabled={processing}
                        className="inline-flex items-center gap-2 px-5 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors disabled:opacity-50">
                        {isEdit ? <Pencil size={14} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2.5} />}
                        {processing ? 'Saving…' : (isEdit ? 'Save changes' : 'Create case')}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DocStat({ label, value, tone = "gray" }) {
    const tones = {
        gray:    "bg-gray-50 text-gray-700 border-gray-100",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
        amber:   "bg-amber-50 text-amber-700 border-amber-100",
        rose:    "bg-rose-50 text-rose-700 border-rose-100",
    };
    return (
        <div className={`rounded-xl border px-3 py-3 text-center ${tones[tone]}`}>
            <div className="text-xl font-bold tabular-nums">{value}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mt-0.5">{label}</div>
        </div>
    );
}

function CaseField({ label, required, hint, error, children }) {
    return (
        <label className="block">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-700">
                    {label}{required && <span className="text-rose-500"> *</span>}
                </span>
                {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
            </div>
            {children}
            {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
        </label>
    );
}

function caseInput(error) {
    return `w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-colors ${
        error ? 'border-rose-300 bg-rose-50/40' : 'border-gray-200 bg-white'
    }`;
}

// ─── Priority breakdown ─────────────────────────────────────────────────
// Compact counter beside the stage graph — number of cases per priority
// level (urgent / medium / low) plus a "no priority" bucket. Colours match
// the case avatar (red / orange / green / gray).
function PriorityBreakdown({ priorities = {} }) {
    const rows = [
        { key: 'urgent', label: 'Urgent',      solid: 'bg-red-500',     soft: 'bg-red-50',     ring: 'ring-red-100',     text: 'text-red-600' },
        { key: 'high',   label: 'High',        solid: 'bg-orange-500',  soft: 'bg-orange-50',  ring: 'ring-orange-100',  text: 'text-orange-600' },
        { key: 'medium', label: 'Medium',      solid: 'bg-yellow-400',  soft: 'bg-yellow-50',  ring: 'ring-yellow-100',  text: 'text-yellow-600' },
        { key: 'low',    label: 'Low',         solid: 'bg-emerald-500', soft: 'bg-emerald-50', ring: 'ring-emerald-100', text: 'text-emerald-600' },
        { key: 'done',   label: 'Done',        solid: 'bg-emerald-600', soft: 'bg-emerald-50', ring: 'ring-emerald-100', text: 'text-emerald-700' },
        { key: 'none',   label: 'No priority', solid: 'bg-gray-300',    soft: 'bg-gray-50',    ring: 'ring-gray-100',     text: 'text-gray-500' },
    ];
    const total = rows.reduce((sum, r) => sum + (priorities[r.key] || 0), 0);

    return (
        <div className="grid grid-cols-2 grid-rows-3 gap-3 w-full h-full">
            {rows.map((r) => {
                const count = priorities[r.key] || 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                    <div key={r.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-gray-400">
                                {r.label}
                            </span>
                            <span className={`w-6 h-6 rounded-lg ${r.soft} ring-1 ${r.ring} flex items-center justify-center flex-shrink-0`}>
                                <span className={`w-2 h-2 rounded-full ${r.solid}`} />
                            </span>
                        </div>
                        <p className="text-[24px] leading-none font-bold text-gray-900 tabular-nums mt-2">{count}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                                <div className={`h-full rounded-full ${r.solid}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className={`text-[10px] font-semibold ${r.text} tabular-nums`}>{pct}%</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Distribution graph ─────────────────────────────────────────────────

/**
 * Line graph of case count per immigration stage — same component shape
 * as `StageDistribution` on the Education Students page so admins
 * looking at both pages see one consistent visual idiom.
 *
 * Each stage gets a coloured dot + label; the polyline connects them
 * with a soft area fill underneath. Rotated x-axis labels carry the
 * stage names; the count sits above each dot in matching colour.
 */
function DistributionGraph({ distribution = [], total = 0, activeStage = null, onPick }) {
    // Trailing "Unassigned" bucket — keep it visible but split out from
    // the headline counts the way Education's "unstaged" does, so the
    // chart's metric matches the placed-vs-unstaged narrative.
    const placedStages = distribution.filter((d) => d.stage !== 'Unassigned');
    const unstaged = distribution.find((d) => d.stage === 'Unassigned')?.count || 0;
    const placed = placedStages.reduce((sum, d) => sum + d.count, 0);

    // Empty state — still render the card so the graph column keeps its
    // place beside the priority cards instead of collapsing the layout.
    if (total === 0) {
        return (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col w-full h-full min-h-[220px]">
                <div className="px-5 pt-4 pb-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100/70">
                        <TrendingUp size={14} />
                    </div>
                    <h2 className="text-[12px] font-bold uppercase tracking-[0.14em] text-gray-700">
                        Immigration stage distribution
                    </h2>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6 pb-6">
                    <TrendingUp size={26} className="text-gray-300" />
                    <p className="text-sm font-semibold text-gray-500 mt-2">No cases to chart yet</p>
                    <p className="text-xs text-gray-400 mt-1">Cases will appear here once they're assigned an immigration stage.</p>
                </div>
            </section>
        );
    }

    const stages = placedStages.map((d) => d.stage);
    const data   = placedStages.map((d) => d.count);
    const peak   = Math.max(1, ...data);

    // SVG viewBox geometry — taken from the Education chart.
    const W         = 920;
    const H         = 170;
    const padX      = 60;
    const padTop    = 22;
    const padBottom = 60;
    const chartW    = W - padX * 2;
    const chartH    = H - padTop - padBottom;
    const baselineY = padTop + chartH;

    const xFor = (i) => padX + (i / Math.max(1, stages.length - 1)) * chartW;
    const yFor = (n) => padTop + (1 - n / peak) * chartH;

    const barW = Math.min(26, (chartW / Math.max(1, stages.length)) * 0.55);

    return (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col w-full h-full">
            <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100/70">
                        <TrendingUp size={14} />
                    </div>
                    <div>
                        <h2 className="text-[12px] font-bold uppercase tracking-[0.14em] text-gray-700">
                            Immigration stage distribution
                        </h2>
                        <p className="text-[10.5px] text-gray-400 mt-0.5">
                            <span className="font-semibold text-gray-600 tabular-nums">{placed}</span> placed ·{' '}
                            <span className="font-semibold text-gray-600 tabular-nums">{unstaged}</span> unstaged ·{' '}
                            <span className="font-semibold text-gray-600 tabular-nums">{total}</span> total
                            {activeStage && (
                                <span className="ml-2">
                                    · filtered by <span className="font-semibold text-gray-700">{activeStage}</span>
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <span className="text-[10.5px] text-gray-400 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 ring-1 ring-gray-100">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Cases at stage
                </span>
            </div>

            <div className="px-3 py-3 flex-1 flex items-center">
                <svg
                    viewBox={`0 0 ${W} ${H}`}
                    className="w-full"
                    style={{ maxHeight: 260 }}
                    role="img"
                    aria-label="Bar graph of case count per Immigration stage"
                >
                    {/* Soft horizontal gridlines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
                        <line
                            key={i}
                            x1={padX}
                            x2={W - padX}
                            y1={padTop + (1 - t) * chartH}
                            y2={padTop + (1 - t) * chartH}
                            stroke="#f1f5f9"
                            strokeWidth="1"
                        />
                    ))}

                    {/* Per-stage bars, count labels, rotated x-axis labels.
                        Whole stage column is clickable to filter the
                        table below. */}
                    {data.map((n, i) => {
                        const tone = stageHex(stages[i]);
                        const isActive = activeStage === stages[i];
                        const barH = baselineY - yFor(n);
                        const w = isActive ? barW + 4 : barW;
                        return (
                            <g
                                key={stages[i]}
                                onClick={() => onPick?.(stages[i])}
                                style={{ cursor: 'pointer' }}
                            >
                                {n > 0 && (
                                    <rect
                                        x={xFor(i) - w / 2}
                                        y={yFor(n)}
                                        width={w}
                                        height={barH}
                                        rx="4"
                                        fill={tone}
                                        fillOpacity={isActive ? 1 : 0.85}
                                    />
                                )}
                                <text
                                    x={xFor(i)}
                                    y={yFor(n) - 9}
                                    textAnchor="middle"
                                    fontSize="10.5"
                                    fontWeight="700"
                                    fill={tone}
                                >
                                    {n}
                                </text>
                                <text
                                    x={xFor(i)}
                                    y={baselineY + 14}
                                    textAnchor="end"
                                    fontSize="9.5"
                                    fontWeight={isActive ? '700' : '500'}
                                    fill={isActive ? '#111827' : '#94a3b8'}
                                    transform={`rotate(-28 ${xFor(i)} ${baselineY + 14})`}
                                >
                                    {stages[i]}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </section>
    );
}

// ─── Table row ──────────────────────────────────────────────────────────

function CaseRow({ c, stages, visaTypes = [], isExpanded, onExpand, stageMenuOpen, onStageMenuToggle, onStageMenuClose, onEdit }) {
    // DOCS progress reflects the visa checklist: how many required items
    // the case has submitted, out of the total required.
    const chkTotal = c.checklist_total || 0;
    const chkDone = c.checklist_submitted || 0;
    const pct = chkTotal > 0 ? Math.round((chkDone / chkTotal) * 100) : 0;
    const hasDocs = chkTotal > 0;
    // Immigration theme colour (emerald) for the fill.
    const barColor = 'bg-emerald-500';
    const needsAttention = c.docs_pending > 0 || c.docs_rejected > 0;

    return (
        <React.Fragment>
            <tr className={`group transition-colors ${isExpanded ? 'bg-amber-50/30' : 'hover:bg-gray-50/50'}`}>
                <td className="pl-4 pr-2 py-2.5">
                    <button
                        type="button"
                        onClick={onExpand}
                        className="inline-flex items-center justify-center w-5 h-5 rounded text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                        <ChevronRight size={14} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                </td>

                {/* Case (avatar + name) */}
                <td className="px-3 py-2.5">
                    <Link
                        href={`/portal/immigration/cases/${c.id}/profile`}
                        className="flex items-center gap-2.5 min-w-[200px] group/case"
                    >
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 overflow-hidden ${c.avatar_url ? `ring-2 ring-offset-1 ${priorityRing(c.immigration_priority)}` : priorityColor(c.immigration_priority)}`}
                            title={c.immigration_priority ? `Priority: ${c.immigration_priority}` : 'No priority set'}
                        >
                            {c.avatar_url
                                ? <img src={c.avatar_url} alt={c.name} className="w-full h-full object-cover" />
                                : initials(c.name)}
                        </div>
                        <div className="min-w-0">
                            <div className="font-semibold text-gray-900 text-sm truncate group-hover/case:text-amber-700 transition-colors">
                                {c.name}
                            </div>
                            {c.lead_id && (
                                <div className="text-[11px] text-gray-400 font-mono truncate">{c.lead_id}</div>
                            )}
                        </div>
                        {needsAttention && (
                            <span title="Needs attention" className="flex-shrink-0">
                                <AlertTriangle size={11} className="text-rose-500" />
                            </span>
                        )}
                    </Link>
                </td>

                {/* Stage picker + endorser subtitle */}
                <td className="px-3 py-2.5">
                    <StagePicker
                        caseId={c.id}
                        stages={stages}
                        value={c.immigration_stage || ''}
                        fallback={c.inz_status}
                        open={stageMenuOpen}
                        onToggle={onStageMenuToggle}
                        onClose={onStageMenuClose}
                    />
                </td>

                {/* Visa picker (inline inz_visa_type edit) */}
                <td className="px-3 py-2.5">
                    <VisaPicker caseId={c.id} visaTypes={visaTypes} value={c.inz_visa_type || ''} />
                </td>

                {/* Country */}
                <td className="px-3 py-2.5">
                    {c.country
                        ? <span className="text-sm text-gray-700">{c.country}</span>
                        : <span className="text-gray-300">—</span>}
                </td>

                {/* Docs */}
                <td className="px-3 py-2.5">
                    {hasDocs ? (
                        <div className="flex items-center gap-2 min-w-[100px]">
                            <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-semibold tabular-nums whitespace-nowrap text-emerald-600"
                                title={`${chkDone} of ${chkTotal} checklist items submitted`}>
                                {pct}%
                            </span>
                        </div>
                    ) : (
                        <span className="text-gray-300">—</span>
                    )}
                </td>

                {/* Updated — datetime + staff who last moved the case */}
                <td className="px-3 py-2.5 whitespace-nowrap">
                    {(c.stage_updated_at || c.updated_at) ? (
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-700 tabular-nums">
                                {fmtDateTime(c.stage_updated_at || c.updated_at)}
                            </span>
                            {c.updated_by && (
                                <span className="text-[11px] text-gray-400 truncate max-w-[180px]">
                                    by {c.updated_by}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-gray-300">—</span>
                    )}
                </td>

                {/* Actions — collapsed into a three-dot menu. Mirrors
                    the row-menu pattern in portal/sales/Leads.jsx. */}
                <td className="px-3 py-2.5 pr-4 text-right">
                    <RowMenu
                        items={[
                            c.tracking_code && {
                                key: 'copy',
                                label: 'Copy tracking link',
                                icon: Copy,
                                onClick: () => copyTrackingLink(c.tracking_code),
                            },
                            {
                                key: 'docs',
                                label: 'Open documents',
                                icon: FileText,
                                href: `/portal/immigration/cases/${c.id}/profile?tab=documents`,
                            },
                            {
                                key: 'open',
                                label: 'Open case',
                                icon: ExternalLink,
                                href: `/portal/immigration/cases/${c.id}/profile`,
                            },
                            {
                                key: 'edit',
                                label: 'Edit case',
                                icon: Pencil,
                                onClick: () => onEdit?.(),
                            },
                            {
                                key: 'archive',
                                label: 'Archive case',
                                icon: Archive,
                                danger: true,
                                onClick: () => archiveCase(c.id, c.name),
                            },
                        ].filter(Boolean)}
                    />
                </td>
            </tr>

            {isExpanded && (
                <tr className="bg-amber-50/20 border-t border-amber-100/60">
                    <td colSpan={8} className="px-6 py-4">
                        <CaseDetail c={c} />
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
}

function CaseDetail({ c }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <PriorityField c={c} />
            <DetailField label="Email"        value={c.email} />
            <DetailField label="Phone"        value={c.phone} />
            <DetailField label="INZ Status"   value={c.inz_status} />
            <DetailField label="INZ Reference" value={c.inz_reference} />
            <DetailField label="Documents"
                value={c.docs_total
                    ? `${c.docs_approved} approved · ${c.docs_pending} pending · ${c.docs_rejected} rejected`
                    : null} />
            <DetailField label="Last activity"
                value={c.updated_at ? fmtDate(c.updated_at) : null} />
            {/* Staff member who last moved the stage. Surfaced here in the
                expander rather than the column itself so the row stays
                compact. */}
            <DetailField label="Endorsed by" value={c.endorsed_by} />
        </div>
    );
}

// Inline priority selector shown in the expanded row — posts immediately
// on change. Coloured dot mirrors the case avatar (red / orange / green /
// gray) so the level reads at a glance.
function PriorityField({ c }) {
    const [saving, setSaving] = useState(false);
    const value = c.immigration_priority || '';

    const change = (e) => {
        const v = e.target.value;
        setSaving(true);
        router.post(
            `/portal/immigration/cases/${c.id}/priority`,
            { immigration_priority: v || null },
            { preserveScroll: true, preserveState: true, onFinish: () => setSaving(false) },
        );
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Priority
            </p>
            <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${priorityColor(value)}`} />
                <select
                    value={value}
                    onChange={change}
                    disabled={saving}
                    className="flex-1 text-xs font-semibold text-gray-900 bg-transparent outline-none cursor-pointer disabled:opacity-60"
                >
                    <option value="">No priority</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="done">Done</option>
                </select>
            </div>
        </div>
    );
}

function DetailField({ label, value }) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                {label}
            </p>
            {value ? (
                <p className="text-xs font-semibold text-gray-900 truncate">{value}</p>
            ) : (
                <span className="text-xs text-gray-300 italic">—</span>
            )}
        </div>
    );
}

// ─── Stage picker (inline immigration_stage edit) ───────────────────────

function StagePicker({ caseId, stages, value, fallback, open, onToggle, onClose }) {
    const [saving, setSaving] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, openUp: false });
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const MENU_W = 240;
    const MENU_MAX_H = 360;

    useEffect(() => {
        if (!open || !triggerRef.current) return;
        const place = () => {
            const r = triggerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - r.bottom;
            const openUp = spaceBelow < Math.min(MENU_MAX_H, 240) && r.top > spaceBelow;
            const left = Math.min(r.left, window.innerWidth - MENU_W - 8);
            setCoords({
                top:  openUp ? r.top - 6 : r.bottom + 6,
                left: Math.max(8, left),
                openUp,
            });
        };
        place();
        window.addEventListener('scroll', place, true);
        window.addEventListener('resize', place);
        return () => {
            window.removeEventListener('scroll', place, true);
            window.removeEventListener('resize', place);
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onDocClick = (e) => {
            if (menuRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
            onClose();
        };
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    const label = value || fallback || 'Set stage';
    const chipClass = value ? stageChipClass(value) : 'bg-gray-100 text-gray-500 border-gray-200 border-dashed';

    const select = (stage) => {
        setSaving(true);
        onClose();
        router.post(
            `/portal/immigration/cases/${caseId}/stage`,
            { immigration_stage: stage },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setSaving(false),
            }
        );
    };

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                disabled={saving}
                onClick={onToggle}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border whitespace-nowrap uppercase hover:shadow-sm transition-all disabled:opacity-60 ${chipClass}`}
            >
                <span className="truncate max-w-[180px]">{label}</span>
                <ChevronDown size={10} strokeWidth={2.5} className="opacity-60 flex-shrink-0" />
            </button>

            {open && typeof document !== 'undefined' && createPortal(
                <div
                    ref={menuRef}
                    role="listbox"
                    style={{
                        position: 'fixed',
                        top:      coords.openUp ? 'auto' : coords.top,
                        bottom:   coords.openUp ? (window.innerHeight - coords.top) : 'auto',
                        left:     coords.left,
                        width:    MENU_W,
                        maxHeight: MENU_MAX_H,
                    }}
                    className="z-[60] bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 overflow-y-auto"
                >
                    <p className="px-3 pt-2 pb-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                        Move to stage
                    </p>
                    {stages.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => select(s)}
                            className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 ${
                                value === s ? 'bg-gray-50 font-semibold text-gray-900' : 'text-gray-700'
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-sm ${STAGE_COLORS[s] || 'bg-gray-300'}`} />
                            {s}
                        </button>
                    ))}
                    {value && (
                        <>
                            <div className="border-t border-gray-100 my-1" />
                            <button
                                type="button"
                                onClick={() => select(null)}
                                className="w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
                            >
                                Clear stage
                            </button>
                        </>
                    )}
                </div>,
                document.body
            )}
        </>
    );
}

// ─── Visa picker (inline inz_visa_type edit) ────────────────────────────
// Mirrors StagePicker but self-manages its open state. Posts the chosen
// visa_type_id; the controller stamps the matching VisaType name onto
// inz_visa_type (or clears it when "None" is chosen).
function VisaPicker({ caseId, visaTypes = [], value }) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, openUp: false });
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const MENU_W = 260;
    const MENU_MAX_H = 360;

    useEffect(() => {
        if (! open || ! triggerRef.current) return;
        const place = () => {
            const r = triggerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - r.bottom;
            const openUp = spaceBelow < Math.min(MENU_MAX_H, 240) && r.top > spaceBelow;
            const left = Math.min(r.left, window.innerWidth - MENU_W - 8);
            setCoords({ top: openUp ? r.top - 6 : r.bottom + 6, left: Math.max(8, left), openUp });
        };
        place();
        window.addEventListener('scroll', place, true);
        window.addEventListener('resize', place);
        return () => {
            window.removeEventListener('scroll', place, true);
            window.removeEventListener('resize', place);
        };
    }, [open]);

    useEffect(() => {
        if (! open) return;
        const onDocClick = (e) => {
            if (menuRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const select = (visaTypeId) => {
        setSaving(true);
        setOpen(false);
        router.post(
            `/portal/immigration/cases/${caseId}/visa`,
            { visa_type_id: visaTypeId },
            { preserveScroll: true, preserveState: true, onFinish: () => setSaving(false) },
        );
    };

    const hasValue = !! value;

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                disabled={saving}
                onClick={(e) => { e.stopPropagation(); setOpen((o) => ! o); }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border whitespace-nowrap hover:shadow-sm transition-all disabled:opacity-60 ${
                    hasValue ? 'bg-white text-gray-700 border-gray-200' : 'bg-gray-100 text-gray-400 border-gray-200 border-dashed'
                }`}
            >
                <span className="truncate max-w-[190px]">{value || 'Set visa'}</span>
                <ChevronDown size={10} strokeWidth={2.5} className="opacity-60 flex-shrink-0" />
            </button>

            {open && typeof document !== 'undefined' && createPortal(
                <div
                    ref={menuRef}
                    role="listbox"
                    style={{
                        position: 'fixed',
                        top:    coords.openUp ? 'auto' : coords.top,
                        bottom: coords.openUp ? (window.innerHeight - coords.top) : 'auto',
                        left:   coords.left,
                        width:  MENU_W,
                        maxHeight: MENU_MAX_H,
                    }}
                    className="z-[60] bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 overflow-y-auto"
                >
                    <p className="px-3 pt-2 pb-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                        Set visa type
                    </p>
                    {visaTypes.length === 0 && (
                        <p className="px-3 py-2 text-[11px] text-gray-400">No visa types available.</p>
                    )}
                    {visaTypes.map((v) => (
                        <button
                            key={v.id}
                            type="button"
                            onClick={() => select(v.id)}
                            className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 ${
                                value === v.name ? 'bg-gray-50 font-semibold text-gray-900' : 'text-gray-700'
                            }`}
                        >
                            {v.name}
                        </button>
                    ))}
                    {hasValue && (
                        <>
                            <div className="border-t border-gray-100 my-1" />
                            <button
                                type="button"
                                onClick={() => select(null)}
                                className="w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
                            >
                                Clear visa
                            </button>
                        </>
                    )}
                </div>,
                document.body,
            )}
        </>
    );
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function SortableTh({ label, sortKey, current, dir, onSort }) {
    const active = current === sortKey;
    const Icon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown;
    return (
        <th className="px-3 py-3">
            <button
                type="button"
                onClick={() => onSort(sortKey)}
                className={`inline-flex items-center gap-1 hover:text-gray-700 transition-colors ${active ? 'text-gray-700' : 'text-gray-500'}`}
            >
                {label}
                <Icon size={11} className="opacity-60" />
            </button>
        </th>
    );
}

function initials(name = '') {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() || '')
        .join('') || '?';
}

function avatarColor(id) {
    const palette = [
        'bg-rose-500', 'bg-amber-500', 'bg-emerald-500',
        'bg-sky-500', 'bg-indigo-500', 'bg-violet-500',
        'bg-fuchsia-500', 'bg-teal-500',
    ];
    return palette[Math.abs((id || 0) * 31) % palette.length];
}

// Priority → avatar colour: urgent (red), high (orange), medium (yellow),
// low (green), done (completed). No priority set → neutral gray circle.
function priorityColor(priority) {
    switch (priority) {
        case 'urgent': return 'bg-red-500';
        case 'high':   return 'bg-orange-500';
        case 'medium': return 'bg-yellow-400';
        case 'low':    return 'bg-emerald-500';
        case 'done':   return 'bg-emerald-600';
        default:       return 'bg-gray-400';
    }
}

// Ring colour for the profile-photo avatar so the priority is still
// signalled once a face image replaces the coloured initials circle.
// Literal class strings so Tailwind's JIT generates them.
function priorityRing(priority) {
    switch (priority) {
        case 'urgent': return 'ring-red-500';
        case 'high':   return 'ring-orange-500';
        case 'medium': return 'ring-yellow-400';
        case 'low':    return 'ring-emerald-500';
        case 'done':   return 'ring-emerald-600';
        default:       return 'ring-gray-300';
    }
}

// Sort weight: urgent → high → medium → low → done → no priority.
function priorityRank(priority) {
    switch (priority) {
        case 'urgent': return 0;
        case 'high':   return 1;
        case 'medium': return 2;
        case 'low':    return 3;
        case 'done':   return 4;
        default:       return 5;
    }
}

function fmtDate(d) {
    if (!d) return '—';
    try {
        const dt = new Date(d);
        return dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return d;
    }
}

function fmtDateTime(d) {
    if (!d) return '—';
    try {
        const dt = new Date(d);
        return dt.toLocaleString(undefined, {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: 'numeric', minute: '2-digit',
        });
    } catch {
        return d;
    }
}

/**
 * Three-dot row action menu. Items are `{ key, label, icon, onClick?,
 * href? }`. Renders the popover in a React portal at body level so it
 * escapes any ancestor `overflow-hidden` on the table.
 */
function RowMenu({ items = [] }) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, openUp: false });
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const MENU_W = 220;

    useEffect(() => {
        if (!open || !triggerRef.current) return;
        const place = () => {
            const r = triggerRef.current.getBoundingClientRect();
            // Anchor the menu's right edge to the trigger so it opens
            // leftward (the actions column lives at the right of the row).
            // Flip upward when there isn't room below (row near the viewport
            // bottom) so the menu never gets clipped by the window edge.
            const menuH = Math.min(360, items.length * 38 + 16);
            const spaceBelow = window.innerHeight - r.bottom;
            const openUp = spaceBelow < menuH + 12 && r.top > spaceBelow;
            setCoords({
                top:  openUp ? r.top - 6 : r.bottom + 6,
                left: Math.min(r.right - MENU_W, window.innerWidth - MENU_W - 8),
                openUp,
            });
        };
        place();
        const onScroll = () => place();
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onScroll);
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onDocClick = (e) => {
            if (menuRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const handleClick = (item) => {
        setOpen(false);
        item.onClick?.();
    };

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen(!open)}
                title="More actions"
                className={`inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors ${open ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
            >
                <MoreHorizontal size={14} />
            </button>

            {open && typeof document !== 'undefined' && createPortal(
                <div
                    ref={menuRef}
                    role="menu"
                    style={{
                        position: 'fixed',
                        top:    coords.openUp ? 'auto' : coords.top,
                        bottom: coords.openUp ? (window.innerHeight - coords.top) : 'auto',
                        left:   Math.max(8, coords.left),
                        width:  MENU_W,
                        maxHeight: 360,
                        overflowY: 'auto',
                    }}
                    className="z-[60] bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5"
                >
                    {items.map((it, idx) => {
                        const Icon = it.icon;
                        // Destructive items (Archive, Delete) sit at the
                        // bottom of the menu separated by a divider.
                        const showDivider = it.danger && items[idx - 1] && ! items[idx - 1].danger;
                        const itemTone = it.danger
                            ? 'text-red-700 hover:bg-red-50'
                            : 'text-gray-700 hover:bg-gray-50';
                        const iconTone = it.danger ? 'text-red-400' : 'text-gray-400';
                        const inner = (
                            <span className={`flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer ${itemTone}`}>
                                {Icon && <Icon size={13} className={iconTone} />}
                                {it.label}
                            </span>
                        );
                        return (
                            <React.Fragment key={it.key}>
                                {showDivider && <div className="my-1 border-t border-gray-100" />}
                                {it.href ? (
                                    <Link href={it.href} onClick={() => setOpen(false)} className="block">
                                        {inner}
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleClick(it)}
                                        className="w-full text-left block"
                                    >
                                        {inner}
                                    </button>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>,
                document.body
            )}
        </>
    );
}

// Write the public /track link + raw code to the clipboard in a single
// payload so staff can paste it straight into WhatsApp / email / SMS.
// Mirrors the same helper used in Sales/Leads + Education/Students.
function copyTrackingLink(code) {
    if (!code) return;
    const url = `${window.location.origin}/track/${code}`;
    navigator.clipboard?.writeText(url).then(
        () => toast.success('Tracking link copied', { description: url }),
        () => toast.error('Could not copy — your browser blocked clipboard access')
    );
}

// Soft-delete (archive) a case. The Lead row is soft-deleted via the
// admin/leads/{id} DELETE endpoint; notes/tasks/documents survive and
// the case can be restored from the archive view. A confirm dialog
// gates the destructive action — there's no undo button in the table.
function archiveCase(id, name) {
    const label = (name || 'this case').trim();
    if (! window.confirm(`Archive ${label}?\n\nThe case will be hidden from the Cases list. Notes, tasks, and documents are preserved and the case can be restored later.`)) return;
    router.delete(`/admin/leads/${id}`, {
        preserveScroll: true,
        onSuccess: () => toast.success(`${label} archived`),
        onError: () => toast.error('Could not archive — please try again.'),
    });
}
