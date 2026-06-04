import { useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import {
    ClipboardCheck, GraduationCap, ChevronRight, Search,
    Mail, Phone, Globe, Clock,
} from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";

// Education / Sales Assessments queue. Tabbed: Eligibility Assessment
// (Free Assessment leads) vs Enrolment (Education Enrolment leads).
// Mirrors the Immigration Assessments page: applicant + programme columns,
// a Draft / Submitted / Completed progress bar, and a chevron to open the
// per-portal lead detail page.

const TABS = [
    { key: 'eligibility', label: 'Eligibility Assessment', icon: <ClipboardCheck size={14} />, hint: 'Submissions from /free-assessment' },
    { key: 'enrolment',   label: 'Enrolment',              icon: <GraduationCap  size={14} />, hint: 'Submissions from /education-enrolment' },
];

// Stage buckets — explicit 'Submitted' counts as Submitted; anything in
// SUBMITTED_STATUSES means the applicant clicked Submit; anything in
// COMPLETED_STATUSES means staff has engaged or converted them. Everything
// else (including the legacy 'New') reads as Draft.
const SUBMITTED_STATUSES = new Set(['Submitted', 'submitted']);
const COMPLETED_STATUSES = new Set(['Completed', 'Engaged', 'Converted', 'Closed', 'Enrolled', 'completed', 'engaged', 'converted']);

const isCompleted = (r) => COMPLETED_STATUSES.has(r.status);
const isSubmitted = (r) => SUBMITTED_STATUSES.has(r.status);
const isDraft     = (r) => !isSubmitted(r) && !isCompleted(r);

const progressOf = (r) => {
    if (isCompleted(r)) return { stage: 'completed', pct: 100 };
    if (isDraft(r))     return { stage: 'draft',     pct: 33  };
    return                     { stage: 'submitted', pct: 66  };
};

const STAGE_STYLES = {
    draft:     { fill: 'bg-amber-500',   text: 'text-amber-700',   pill: 'bg-amber-50 text-amber-700 border-amber-200',     label: 'Draft' },
    submitted: { fill: 'bg-blue-500',    text: 'text-blue-700',    pill: 'bg-blue-50 text-blue-700 border-blue-200',        label: 'Submitted' },
    completed: { fill: 'bg-emerald-500', text: 'text-emerald-700', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Completed' },
};

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const initials = (name = '') =>
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '—';

export default function EducationAssessments({ portal = 'education', eligibility = [], enrolment = [] }) {
    const [tab, setTab] = useState('eligibility');
    const [statusFilter, setStatusFilter] = useState('all'); // all | draft | submitted | completed
    const [search, setSearch] = useState('');

    const rowsByTab = { eligibility, enrolment };
    const rows = rowsByTab[tab];

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter((r) => {
            if (statusFilter === 'draft'     && !isDraft(r))     return false;
            if (statusFilter === 'submitted' && !isSubmitted(r)) return false;
            if (statusFilter === 'completed' && !isCompleted(r)) return false;
            if (q) {
                const hay = `${r.name} ${r.email || ''} ${r.phone || ''} ${r.programme || ''} ${r.lead_id || ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [rows, statusFilter, search]);

    const tabCounts = {
        eligibility: eligibility.length,
        enrolment:   enrolment.length,
    };

    const statusCounts = useMemo(() => ({
        all:       rows.length,
        draft:     rows.filter(isDraft).length,
        submitted: rows.filter(isSubmitted).length,
        completed: rows.filter(isCompleted).length,
    }), [rows]);

    return (
        <div className="space-y-5 max-w-[1400px] mx-auto pb-12">
            <Head title="Assessments — Education" />
            <PortalPageHeader
                eyebrow="Work"
                title="Assessments"
                description="Public assessment submissions from the marketing site — free eligibility checks and education enrolment forms."
            />

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                {/* Top tabs — Eligibility vs Enrolment */}
                <div className="flex items-center border-b border-gray-100 px-3 overflow-x-auto">
                    {TABS.map((t) => {
                        const isActive = tab === t.key;
                        return (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => { setTab(t.key); setStatusFilter('all'); }}
                                className={`px-3 py-3 inline-flex items-center gap-2 text-[13px] font-semibold transition-colors border-b-2 whitespace-nowrap ${
                                    isActive
                                        ? 'text-gray-900 border-indigo-500'
                                        : 'text-gray-500 border-transparent hover:text-gray-700'
                                }`}
                            >
                                {t.icon}
                                {t.label}
                                <span className={`inline-flex items-center justify-center min-w-[26px] h-[20px] px-2 rounded-full text-[10px] font-semibold tabular-nums ${
                                    isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {tabCounts[t.key]}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Status filter + search row */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-3 px-4 py-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusPill active={statusFilter === 'all'}       onClick={() => setStatusFilter('all')}       label="All"       count={statusCounts.all}       tone="gray" />
                        <StatusPill active={statusFilter === 'draft'}     onClick={() => setStatusFilter('draft')}     label="Draft"     count={statusCounts.draft}     tone="amber" />
                        <StatusPill active={statusFilter === 'submitted'} onClick={() => setStatusFilter('submitted')} label="Submitted" count={statusCounts.submitted} tone="blue" />
                        <StatusPill active={statusFilter === 'completed'} onClick={() => setStatusFilter('completed')} label="Completed" count={statusCounts.completed} tone="emerald" />
                    </div>

                    <div className="flex items-center gap-2 flex-1 min-w-0 lg:justify-end">
                        <Search size={14} className="text-gray-500 flex-shrink-0" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, email, programme…"
                            className="flex-1 lg:max-w-sm outline-none text-sm text-gray-900 placeholder:text-gray-500 bg-transparent"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="text-gray-500 hover:text-gray-700 text-[11px] font-bold uppercase tracking-wider"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                {filtered.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 mb-4">
                            {TABS.find((t) => t.key === tab)?.icon}
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                            {rows.length === 0 ? 'No submissions yet.' : 'No submissions match your filters.'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                            {tab === 'eligibility'
                                ? 'Public eligibility submissions from /free-assessment will appear here.'
                                : 'Education enrolment submissions from /education-enrolment will appear here.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/60 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="px-4 py-2.5">Applicant</th>
                                    <th className="px-4 py-2.5">Programme</th>
                                    <th className="px-4 py-2.5">Contact</th>
                                    <th className="px-4 py-2.5 w-[220px]">Progress</th>
                                    <th className="px-4 py-2.5">Submitted</th>
                                    <th className="px-4 py-2.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((r) => {
                                    const { stage, pct } = progressOf(r);
                                    const stageStyle = STAGE_STYLES[stage];
                                    return (
                                        <tr key={r.id} className="text-sm transition-colors hover:bg-gray-50/40">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="w-9 h-9 rounded-full inline-flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 bg-indigo-500">
                                                        {initials(r.name)}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-semibold text-gray-900 truncate">{r.name}</p>
                                                        {r.lead_id && (
                                                            <p className="text-[10px] text-gray-500 font-mono mt-0.5">{r.lead_id}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 align-middle">
                                                {r.programme ? (
                                                    <p className="text-[12px] font-semibold text-gray-800 truncate max-w-[260px]">{r.programme}</p>
                                                ) : (
                                                    <p className="text-[12px] text-gray-500 italic">Not specified</p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[10.5px] text-gray-600">
                                                    {r.level  && <span className="inline-flex items-center gap-1"><GraduationCap size={10} /> {r.level}</span>}
                                                    {r.intake && <span className="inline-flex items-center gap-1"><Clock size={10} /> {r.intake}</span>}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 align-middle">
                                                {r.email && (
                                                    <p className="text-[11.5px] text-gray-700 truncate max-w-[220px] inline-flex items-center gap-1">
                                                        <Mail size={11} className="text-gray-500" /> {r.email}
                                                    </p>
                                                )}
                                                {r.phone && (
                                                    <p className="text-[10.5px] text-gray-500 truncate max-w-[220px] inline-flex items-center gap-1 mt-0.5">
                                                        <Phone size={10} /> {r.phone}
                                                    </p>
                                                )}
                                                {r.country && (
                                                    <p className="text-[10.5px] text-gray-500 truncate max-w-[220px] inline-flex items-center gap-1">
                                                        <Globe size={10} /> {r.country}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 align-middle">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${stageStyle.text}`}>
                                                        {stageStyle.label}
                                                    </span>
                                                    <span className="text-[10px] tabular-nums text-gray-500">{pct}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${stageStyle.fill}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 align-middle">
                                                <span className="text-[11px] text-gray-700 tabular-nums">{fmtDate(r.created_at)}</span>
                                                {r.analysis_done && (
                                                    <p className="text-[9.5px] text-emerald-700 font-bold uppercase tracking-wider mt-0.5">AI analysed</p>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 align-middle">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={r.detail_url}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                                    >
                                                        Open <ChevronRight size={10} />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// Coloured status pill used in the filter row above the table.
function StatusPill({ active, onClick, label, count, tone = 'gray' }) {
    const activeClass = {
        gray:    'bg-gray-900 text-white border-gray-900',
        blue:    'bg-blue-600 text-white border-blue-600',
        amber:   'bg-amber-600 text-white border-amber-600',
        emerald: 'bg-emerald-600 text-white border-emerald-600',
    }[tone];

    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                active ? activeClass : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
        >
            {label}
            <span className={`inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold tabular-nums ${
                active ? 'bg-white/20' : 'bg-gray-100 text-gray-600'
            }`}>
                {count}
            </span>
        </button>
    );
}
