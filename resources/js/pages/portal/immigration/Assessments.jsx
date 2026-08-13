import { useMemo, useState, useEffect, useRef } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    ChevronRight, ChevronDown, ClipboardCheck, FileEdit, Globe, Send, Search,
    Users, Briefcase, GraduationCap, Plane, Heart,
    Check, FileText, UserCheck, ArrowRightCircle, AlertTriangle,
    X, Mail, Phone, ExternalLink, Loader2,
} from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import { AiAssessmentReviewModal } from "@/components/immigration/AiAssessmentReview";
import { Sparkles } from "lucide-react";

// ── Visa-type metadata ─────────────────────────────────────────────────────
const VISA_TYPES = [
    { key: "all",      label: "All Talents",  icon: <Users size={13} />          },
    { key: "resident", label: "Resident",     icon: <ClipboardCheck size={13} /> },
    { key: "work",     label: "Work",         icon: <Briefcase size={13} />      },
    { key: "student",  label: "Student",      icon: <GraduationCap size={13} />  },
    { key: "visitor",  label: "Visitor",      icon: <Plane size={13} />          },
    { key: "family",   label: "Family",       icon: <Heart size={13} />          },
];

const VISA_AVATAR_BG = {
    resident: "bg-amber-500",
    work:     "bg-blue-500",
    student:  "bg-purple-500",
    visitor:  "bg-emerald-500",
    family:   "bg-rose-500",
    free:     "bg-[#009688]",
};

const VISA_LABEL = {
    resident: "Resident",
    work:     "Work",
    student:  "Student",
    visitor:  "Visitor",
    family:   "Family",
    free:     "Free Assessment",
};

// Status buckets — only an explicit "Submitted" counts as Submitted.
// Anything else (including the legacy "New" default) is treated as Draft
// until the applicant actually clicks the Submit button on the form.
const SUBMITTED_STATUSES = new Set(["Submitted", "submitted"]);
const COMPLETED_STATUSES = new Set(["Completed", "Engaged", "Converted", "Approved", "completed", "engaged", "converted"]);

const isCompleted = (i) => COMPLETED_STATUSES.has(i.status);
// A row counts as "submitted" once the applicant actually submitted the
// form. `journey.submitted` is the authoritative signal (the string status
// can still be a legacy "New" default even though the form was submitted),
// so the collapsed status pill matches the expanded journey's Submitted step.
const hasSubmitted = (i) => !! (i.journey?.submitted) || SUBMITTED_STATUSES.has(i.status);
const isSubmitted = (i) => ! isCompleted(i) && hasSubmitted(i);
const isDraft     = (i) => ! isCompleted(i) && ! hasSubmitted(i);

// Returns { stage: 'draft' | 'submitted' | 'completed', pct: 33|66|100 }
const progressOf = (i) => {
    if (isCompleted(i)) return { stage: "completed", pct: 100 };
    if (isSubmitted(i)) return { stage: "submitted", pct: 66  };
    return                     { stage: "draft",     pct: 33  };
};

const STAGE_STYLES = {
    draft:     { fill: "bg-amber-500",   text: "text-amber-700",   pill: "bg-amber-50 text-amber-700 border-amber-200",     label: "Draft" },
    submitted: { fill: "bg-blue-500",    text: "text-blue-700",    pill: "bg-blue-50 text-blue-700 border-blue-200",        label: "Submitted" },
    completed: { fill: "bg-emerald-500", text: "text-emerald-700", pill: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Completed" },
};

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }) : "—";

const initials = (name = "") =>
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "—";

// ── Page ───────────────────────────────────────────────────────────────────

// Readiness prioritisation — how complete/clean the submission is (NOT an
// eligibility or outcome signal). Higher rank sorts first.
const READINESS = {
    ready:      { label: "Ready",      chip: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", rank: 3 },
    minor:      { label: "Minor gaps", chip: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500",   rank: 2 },
    needs_info: { label: "Needs info", chip: "bg-rose-50 text-rose-700 border-rose-200",           dot: "bg-rose-500",    rank: 1 },
};

export default function ImmigrationAssessments({ intakes = [] }) {
    const [activeVisa,      setActiveVisa]      = useState("all");
    const [statusFilter,    setStatusFilter]    = useState("all"); // all | submitted | draft | completed
    const [readinessFilter, setReadinessFilter] = useState("all"); // all | ready | minor | needs_info
    const [search,          setSearch]          = useState("");
    const [expanded,        setExpanded]        = useState(() => new Set());

    const toggleExpanded = (key) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else                next.add(key);
            return next;
        });
    };

    const visaCounts = useMemo(() => {
        const c = { all: intakes.length, resident: 0, work: 0, student: 0, visitor: 0, family: 0 };
        for (const i of intakes) c[i.visa_type] = (c[i.visa_type] || 0) + 1;
        return c;
    }, [intakes]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return intakes.filter((i) => {
            if (activeVisa !== "all" && i.visa_type !== activeVisa) return false;
            if (statusFilter === "submitted" && ! isSubmitted(i))   return false;
            if (statusFilter === "draft"     && ! isDraft(i))       return false;
            if (statusFilter === "completed" && ! isCompleted(i))   return false;
            if (readinessFilter !== "all" && (i.readiness || "needs_info") !== readinessFilter) return false;
            if (q) {
                const hay = `${i.name} ${i.email || ""} ${i.phone || ""} ${i.intake_id || ""} ${i.status || ""}`.toLowerCase();
                if (! hay.includes(q)) return false;
            }
            return true;
        // Prioritise: most-ready first, then most-recent.
        }).sort((a, b) => {
            const ra = READINESS[a.readiness]?.rank ?? 0;
            const rb = READINESS[b.readiness]?.rank ?? 0;
            if (rb !== ra) return rb - ra;
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });
    }, [intakes, activeVisa, statusFilter, readinessFilter, search]);

    const readinessCounts = useMemo(() => {
        const scope = activeVisa === "all" ? intakes : intakes.filter((i) => i.visa_type === activeVisa);
        return {
            all:        scope.length,
            ready:      scope.filter((i) => i.readiness === "ready").length,
            minor:      scope.filter((i) => i.readiness === "minor").length,
            needs_info: scope.filter((i) => (i.readiness || "needs_info") === "needs_info").length,
        };
    }, [intakes, activeVisa]);

    const statusCounts = useMemo(() => {
        const scope = activeVisa === "all"
            ? intakes
            : intakes.filter((i) => i.visa_type === activeVisa);
        return {
            all:       scope.length,
            submitted: scope.filter(isSubmitted).length,
            draft:     scope.filter(isDraft).length,
            completed: scope.filter(isCompleted).length,
        };
    }, [intakes, activeVisa]);

    return (
        <div className="space-y-5 max-w-[1400px] mx-auto pb-12">
            <Head title="Visa Assessment — Immigration" />
            <PortalPageHeader
                eyebrow="Work"
                title="Visa Assessment"
                description="Public visa-assessment submissions — free enquiries plus paid bookings — awaiting adviser triage."
            />

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                {/* Tab strip — minimal text + count pill, active gets a purple
                    underline */}
                <div className="flex items-center border-b border-gray-100 px-3 overflow-x-auto">
                    {VISA_TYPES.map((t) => (
                        <VisaTabButton
                            key={t.key}
                            tab={t}
                            count={visaCounts[t.key] || 0}
                            active={activeVisa === t.key}
                            onClick={() => setActiveVisa(t.key)}
                        />
                    ))}
                </div>

                {/* Status pill row + search */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-3 px-4 py-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusPill label="All"       count={statusCounts.all}       active={statusFilter === "all"}       onClick={() => setStatusFilter("all")} />
                        <StatusPill label="Submitted" count={statusCounts.submitted} active={statusFilter === "submitted"} onClick={() => setStatusFilter("submitted")} icon={<Send size={11} />}      tone="blue" />
                        <StatusPill label="Draft"     count={statusCounts.draft}     active={statusFilter === "draft"}     onClick={() => setStatusFilter("draft")}     icon={<FileEdit size={11} />}  tone="amber" />
                        <StatusPill label="Completed" count={statusCounts.completed} active={statusFilter === "completed"} onClick={() => setStatusFilter("completed")} icon={<ClipboardCheck size={11} />} tone="emerald" />
                    </div>

                    <div className="flex items-center gap-2 flex-1 min-w-0 lg:justify-end">
                        <Search size={14} className="text-gray-400 flex-shrink-0" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, email, phone, intake ID…"
                            className="flex-1 lg:max-w-sm outline-none text-sm placeholder:text-gray-400 bg-transparent"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="text-gray-400 hover:text-gray-700 text-[11px] font-bold uppercase tracking-wider"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Readiness prioritisation — how ready each submission is to
                    action (completeness/consistency), so the adviser can pick the
                    ready ones first. Not an eligibility/outcome signal. */}
                <div className="flex items-center gap-1.5 flex-wrap px-4 py-2 border-b border-gray-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mr-1">Priority</span>
                    <StatusPill label="Any"        count={readinessCounts.all}        active={readinessFilter === "all"}        onClick={() => setReadinessFilter("all")} />
                    <StatusPill label="Ready"      count={readinessCounts.ready}      active={readinessFilter === "ready"}      onClick={() => setReadinessFilter("ready")}      icon={<Check size={11} />}         tone="emerald" />
                    <StatusPill label="Minor gaps" count={readinessCounts.minor}      active={readinessFilter === "minor"}      onClick={() => setReadinessFilter("minor")}      icon={<FileEdit size={11} />}      tone="amber" />
                    <StatusPill label="Needs info" count={readinessCounts.needs_info} active={readinessFilter === "needs_info"} onClick={() => setReadinessFilter("needs_info")} icon={<AlertTriangle size={11} />} tone="rose" />
                    <span className="text-[10px] text-gray-400 ml-1">by completeness — not an eligibility signal</span>
                </div>

                {/* Table / list */}
                {intakes.length === 0 ? (
                    <EmptyState icon={<ClipboardCheck size={26} />} title="No assessments yet." />
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={<Search size={26} />}
                        title="Nothing matches your filters."
                        action={
                            <button
                                type="button"
                                onClick={() => { setSearch(""); setStatusFilter("all"); setActiveVisa("all"); setReadinessFilter("all"); }}
                                className="mt-3 text-[11px] font-bold uppercase tracking-wider text-gray-600 hover:text-gray-900"
                            >
                                Clear filters
                            </button>
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/60 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="px-2 py-2.5 w-8"></th>
                                    <th className="px-4 py-2.5">Applicant</th>
                                    <th className="px-4 py-2.5">Visa</th>
                                    <th className="px-4 py-2.5 w-[220px]">Progress</th>
                                    <th className="px-4 py-2.5">Priority</th>
                                    <th className="px-4 py-2.5">Submitted</th>
                                    <th className="px-4 py-2.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((i) => {
                                    const key = `${i.visa_type}-${i.id}`;
                                    const isOpen = expanded.has(key);
                                    return (
                                        <IntakeRow
                                            key={key}
                                            intake={i}
                                            expanded={isOpen}
                                            onToggle={() => toggleExpanded(key)}
                                        />
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

// ── Components ─────────────────────────────────────────────────────────────

function VisaTabButton({ tab, count, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-3 py-3 inline-flex items-center gap-2 text-[13px] font-semibold transition-colors border-b-2 whitespace-nowrap ${
                active
                    ? "text-gray-900 border-purple-500"
                    : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
        >
            {tab.label}
            <span className={`inline-flex items-center justify-center min-w-[26px] h-[20px] px-2 rounded-full text-[10px] font-semibold tabular-nums ${
                active ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"
            }`}>
                {count}
            </span>
        </button>
    );
}

function StatusPill({ label, count, active, onClick, icon, tone = "gray" }) {
    const TONES = {
        gray:    "bg-gray-900 text-white border-gray-900",
        blue:    "bg-blue-600 text-white border-blue-600",
        amber:   "bg-amber-600 text-white border-amber-600",
        emerald: "bg-emerald-600 text-white border-emerald-600",
        rose:    "bg-rose-600 text-white border-rose-600",
    };
    const activeClass = TONES[tone] || TONES.gray;
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                active ? activeClass : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
        >
            {icon}
            {label}
            <span className={`inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold tabular-nums ${
                active ? "bg-white/20" : "bg-gray-100 text-gray-600"
            }`}>
                {count}
            </span>
        </button>
    );
}

function IntakeRow({ intake: i, expanded = false, onToggle }) {
    const { stage, pct } = progressOf(i);
    const stageStyle     = STAGE_STYLES[stage];
    const [aiOpen, setAiOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const openModal = () => {
        setViewOpen(true);
        if (data) return;
        // Prefer the server-provided URL; fall back to constructing it so a
        // stale payload (loaded before data_url existed) still works.
        const url = i.data_url || `/portal/immigration/intakes/${i.visa_type}/${i.id}/data`;
        setLoading(true);
        fetch(url, { headers: { Accept: "application/json" }, credentials: "same-origin" })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => setData(d))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    return (
        <>
        <tr
            className={`text-sm transition-colors cursor-pointer ${expanded ? "bg-gray-50/60" : "hover:bg-gray-50/40"}`}
            onClick={onToggle}
        >
            {/* Expand chevron */}
            <td className="px-2 py-3 align-middle">
                <span className={`inline-flex items-center justify-center w-6 h-6 text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`}>
                    <ChevronRight size={14} />
                </span>
            </td>

            {/* Applicant */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-9 h-9 rounded-full inline-flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 ${VISA_AVATAR_BG[i.visa_type] || "bg-gray-500"}`}>
                        {initials(i.name)}
                    </span>
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">{i.name}</p>
                        {i.email && <p className="text-[11px] text-gray-600 truncate max-w-[240px]">{i.email}</p>}
                        {i.phone && <p className="text-[10.5px] text-gray-400 truncate max-w-[240px]">{i.phone}</p>}
                        {!i.email && !i.phone && i.intake_id && (
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{i.intake_id}</p>
                        )}
                    </div>
                </div>
            </td>

            {/* Visa */}
            <td className="px-4 py-3 align-middle">
                <p className="text-[12px] font-medium text-gray-700">{VISA_LABEL[i.visa_type] || i.visa_type}</p>
                {i.extra && (
                    <p className="text-[10px] text-gray-400 truncate max-w-[200px] mt-0.5">{i.extra}</p>
                )}
            </td>

            {/* Progress */}
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

            {/* Priority — readiness by completeness (not an eligibility signal) */}
            <td className="px-4 py-3 align-middle">
                <ReadinessChip readiness={i.readiness} pct={i.readiness_pct} reviewed={i.readiness_reviewed} />
            </td>

            {/* Submitted */}
            <td className="px-4 py-3 align-middle">
                <span className="text-[11px] text-gray-600 tabular-nums">{fmtDate(i.created_at)}</span>
            </td>

            {/* Actions — stops click propagation so action buttons don't
                toggle the row's expansion. */}
            <td className="px-4 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-1">
                    <button
                        type="button"
                        onClick={() => setAiOpen(true)}
                        title="AI completeness review (internal, indicative — not advice)"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                        <Sparkles size={10} /> AI review
                    </button>
                    {aiOpen && (
                        <AiAssessmentReviewModal
                            type={i.visa_type}
                            id={i.id}
                            name={i.name}
                            onClose={() => setAiOpen(false)}
                        />
                    )}
                    {i.can_convert && (
                        <button
                            type="button"
                            onClick={() => {
                                if (! confirm("Convert this assessment to an immigration case? A lead will be created (or matched on email) and flagged as a case.")) return;
                                // Post the Assessment ID (canonical from
                                // Phase B). The controller still accepts
                                // a ResidentIntake.id for backward compat
                                // if assessment_id is missing.
                                const id = i.assessment_id ?? i.id;
                                router.post(`/portal/immigration/assessments/${id}/convert-to-case`, {}, { preserveScroll: true });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                        >
                            <Globe size={10} /> Convert
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openModal(); }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white bg-gray-900 hover:bg-black transition-colors"
                    >
                        Open <ChevronRight size={10} />
                    </button>
                </div>
            </td>
        </tr>

        {viewOpen && (
            <IntakeViewModal intake={i} data={data} loading={loading} onClose={() => setViewOpen(false)} />
        )}

        {expanded && (
            <tr className="bg-gray-50/60 border-b border-gray-100">
                <td colSpan={7} className="px-6 py-5">
                    <JourneyRow intake={i} />
                </td>
            </tr>
        )}
        </>
    );
}

const normKey = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const SEV_RANK = { critical: 3, high: 3, warning: 2, medium: 2, info: 1 };

// How a flagged field is highlighted on the official form, by AI severity.
const FIELD_SEV = {
    critical: { border: "border-red-400",   value: "text-red-700",   label: "text-red-600",   note: "text-red-600" },
    high:     { border: "border-red-400",   value: "text-red-700",   label: "text-red-600",   note: "text-red-600" },
    warning:  { border: "border-amber-400", value: "text-amber-700", label: "text-amber-600", note: "text-amber-600" },
    medium:   { border: "border-amber-400", value: "text-amber-700", label: "text-amber-600", note: "text-amber-600" },
    info:     { border: "border-blue-300",  value: "text-blue-700",  label: "text-blue-600",  note: "text-blue-600" },
};

// Verdict tone → colours for the overall-assessment card.
const VERDICT_TONE = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", bar: "bg-emerald-500" },
    teal:    { bg: "bg-[#009688]/10", text: "text-[#009688]", border: "border-[#009688]/30", bar: "bg-[#009688]" },
    amber:   { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", bar: "bg-amber-500" },
    red:     { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", bar: "bg-red-500" },
    gray:    { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", bar: "bg-gray-400" },
};
// Drop AI observations that merely restate a blank field — the blanks already
// show as "—" on the form, so they add nothing here.
const substantiveObs = (o) => o && o.note && !/not\s*(provided|submitted|supplied|given|available)|missing|blank|no\s+\w+\s+(provided|given)/i.test(o.note);

function assessCsrf() {
    const xsrf = decodeURIComponent((document.cookie.match(/XSRF-TOKEN=([^;]+)/) || [])[1] || "");
    const meta = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
    return xsrf ? { "X-XSRF-TOKEN": xsrf, "X-CSRF-TOKEN": meta } : { "X-CSRF-TOKEN": meta };
}

// Applicant review modal: LEFT = the submitted visa-assessment form in an
// official, sectioned layout — the AI runs automatically and highlights the
// fields it flags (red/amber). RIGHT = the adviser's panel: notes + actions.
function IntakeViewModal({ intake: i, data, loading, onClose }) {
    const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" }) : "");
    const sections = data?.sections || [];

    const [review, setReview] = useState(null);
    const [aiRunning, setAiRunning] = useState(false);
    const [note, setNote] = useState("");
    const [savingNote, setSavingNote] = useState(false);
    const [savedTick, setSavedTick] = useState(false);
    const triedRef = useRef(false);
    const base = `/portal/immigration/assessments/${i.visa_type}/${i.id}/ai-review`;

    // Lock the page behind the modal so scrolling a pane doesn't scroll the list.
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, []);

    // The notes box shows ONLY what the adviser has actually saved — never the
    // AI's auto-drafted note (which lands in adviser_note until the adviser edits).
    const adviserNoteOf = (r) => (r && r.edited_by ? (r.adviser_note || "") : "");

    // Adopt the review that shipped with the intake data.
    useEffect(() => {
        if (data?.ai_review) { setReview(data.ai_review); setNote(adviserNoteOf(data.ai_review)); }
    }, [data]);

    // Run the AI automatically the first time — no manual button needed.
    useEffect(() => {
        if (loading || !data || review || aiRunning || triedRef.current) return;
        triedRef.current = true;
        setAiRunning(true);
        fetch(base, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json", "X-Requested-With": "XMLHttpRequest", ...assessCsrf() } })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d?.review) { setReview(d.review); setNote(adviserNoteOf(d.review)); } })
            .catch(() => {})
            .finally(() => setAiRunning(false));
    }, [loading, data, review, aiRunning, base]);

    const flags = data?.flags || [];
    const readiness = data?.readiness || null;
    const observations = (review?.observations || []).filter(substantiveObs);
    const risks = (review?.risks || []).filter(substantiveObs);
    // Deterministic checks first, then the AI's substantive read — both mark the form.
    const allMarks = [...flags, ...observations];
    // Real issues only (blanks are excluded — they already show as "—").
    const points = [...flags, ...observations, ...risks.map((r) => ({ field: r.area, severity: r.severity, note: r.note }))]
        .filter((p) => p && p.note);

    // Highest-severity mark for a field (fuzzy name match), or null.
    const markFor = (label) => {
        const nl = normKey(label);
        if (!nl) return null;
        const hits = allMarks.filter((o) => { const nf = normKey(o.field); return nf && (nf.includes(nl) || nl.includes(nf)) && nf.length > 2; });
        if (!hits.length) return null;
        return [...hits].sort((a, b) => (SEV_RANK[b.severity] || 1) - (SEV_RANK[a.severity] || 1))[0];
    };

    const saveNote = () => {
        if (!review) return;
        setSavingNote(true);
        fetch(`${base}/edit`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json", "X-Requested-With": "XMLHttpRequest", ...assessCsrf() }, body: JSON.stringify({ adviser_note: note }) })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d?.review) setReview(d.review); setSavedTick(true); setTimeout(() => setSavedTick(false), 1500); })
            .catch(() => {})
            .finally(() => setSavingNote(false));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
            <div className="w-[94vw] max-w-[1440px] h-[92vh] rounded-2xl bg-white shadow-xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#009688] mb-1">Visa assessment</p>
                        <h2 className="text-lg font-bold text-gray-900 truncate">{data?.name || i.name}</h2>
                        <div className="flex items-center gap-3 flex-wrap mt-1 text-[12px] text-gray-500">
                            <span>{data?.visa_label || VISA_LABEL[i.visa_type] || i.visa_type}</span>
                            {(data?.reference || i.intake_id) && <span className="font-mono text-gray-400">{data?.reference || i.intake_id}</span>}
                            {data?.submitted_at && <span>· Submitted {fmtDate(data.submitted_at)}</span>}
                            {(data?.email || i.email) && <span className="inline-flex items-center gap-1"><Mail size={12} /> {data?.email || i.email}</span>}
                            {(data?.phone || i.phone) && <span className="inline-flex items-center gap-1"><Phone size={12} /> {data?.phone || i.phone}</span>}
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 flex-shrink-0"><X size={18} /></button>
                </div>

                {/* Body — two panes */}
                <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
                    {/* LEFT — official form, AI auto-highlights flagged fields */}
                    <div className="lg:flex-1 min-w-0 overflow-y-auto overscroll-contain p-6 border-b lg:border-b-0 lg:border-r border-gray-100 bg-gray-100">
                        {loading ? (
                            <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-sm">
                                <Loader2 size={18} className="animate-spin" /> Loading submission…
                            </div>
                        ) : sections.length === 0 ? (
                            <div className="text-center py-14">
                                <FileText size={24} className="mx-auto text-gray-300" />
                                <p className="mt-3 text-sm text-gray-600">No form details to show for this submission.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {sections.map((sec) => {
                                    const secMarked = sec.fields.some((f) => markFor(f.label));
                                    return (
                                        <section key={sec.title} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                                                <h3 className="text-[14px] font-bold text-gray-900">{sec.title}</h3>
                                                {secMarked && <AlertTriangle size={12} className="text-amber-500" title="AI flagged an item in this section" />}
                                            </div>
                                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                                                {sec.fields.map((f) => {
                                                    const m = markFor(f.label);
                                                    const sev = m ? (FIELD_SEV[m.severity] || FIELD_SEV.info) : null;
                                                    return (
                                                        <div key={f.key} className={`min-w-0 ${sev ? `pl-3 border-l-2 ${sev.border}` : ""}`}>
                                                            <dt className={`text-[12px] font-medium mb-0.5 ${sev ? sev.label : "text-gray-500"}`}>{f.label}</dt>
                                                            <dd className={`text-[13px] whitespace-pre-line break-words ${f.provided === false ? "text-gray-300" : sev ? `font-semibold ${sev.value}` : "text-gray-800"}`}>{f.value}</dd>
                                                            {m && <p className={`text-[11px] mt-0.5 ${sev.note}`}>{m.note}</p>}
                                                        </div>
                                                    );
                                                })}
                                            </dl>
                                        </section>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* RIGHT — adviser panel: points to check + notes + actions */}
                    <div className="lg:w-[360px] flex-shrink-0 overflow-y-auto overscroll-contain p-5 bg-gray-100 space-y-4">
                        {/* Overall assessment — the adviser-style verdict */}
                        {(() => {
                            const t = VERDICT_TONE[readiness?.tone] || VERDICT_TONE.gray;
                            return (
                                <div className={`rounded-xl border p-4 ${t.border} ${t.bg}`}>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <Sparkles size={14} className={t.text} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Overall assessment</span>
                                        {aiRunning && <Loader2 size={12} className="animate-spin text-indigo-400 ml-auto" />}
                                    </div>
                                    {readiness ? (
                                        <>
                                            <p className={`text-[15px] font-bold ${t.text}`}>{readiness.verdict}</p>
                                            <p className="text-[12.5px] text-gray-700 mt-1 leading-relaxed">{readiness.recommendation}</p>
                                            <div className="mt-3">
                                                <div className="flex items-center justify-between text-[10.5px] text-gray-500 mb-1">
                                                    <span>Form completeness</span>
                                                    <span className="font-bold text-gray-700">{readiness.pct}% · {readiness.filled}/{readiness.total}</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-white/70 overflow-hidden border border-black/5">
                                                    <div className={`h-full ${t.bar}`} style={{ width: `${readiness.pct}%` }} />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-[12px] text-gray-500">Assessing…</p>
                                    )}
                                    <p className="text-[10px] text-gray-400 mt-3 leading-snug">Internal &amp; indicative — not immigration advice. The licensed adviser decides.</p>
                                </div>
                            );
                        })()}

                        {/* Adviser internal notes */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Internal notes</span>
                                <button type="button" onClick={saveNote} disabled={savingNote || !review}
                                    className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#009688] hover:text-[#00796b] disabled:text-gray-300">
                                    {savedTick ? <Check size={11} className="text-emerald-500" /> : savingNote ? <Loader2 size={11} className="animate-spin" /> : null}
                                    {savedTick ? "Saved" : "Save"}
                                </button>
                            </div>
                            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={5}
                                placeholder="Add a note for this applicant…"
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] resize-y" />
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
                    {i.can_convert && (
                        <button type="button"
                            onClick={() => { if (confirm("Convert this assessment to an immigration case? A case will be created (or matched on email).")) router.post(`/portal/immigration/assessments/${i.assessment_id ?? i.id}/convert-to-case`, {}, { preserveScroll: true, onSuccess: onClose }); }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#009688] text-white text-sm font-semibold hover:bg-[#00796b]">
                            <ArrowRightCircle size={15} /> Refer / Convert to case
                        </button>
                    )}
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">Done</button>
                </div>
            </div>
        </div>
    );
}

/**
 * Readiness chip — how complete/clean this submission is, so the adviser can
 * prioritise. Completeness-based, NOT an eligibility or outcome prediction.
 */
function ReadinessChip({ readiness, pct, reviewed }) {
    const meta = READINESS[readiness] || READINESS.needs_info;
    const title = `${pct ?? 0}% of the form filled${reviewed ? " · AI review flags included" : ""} — completeness only, not an eligibility signal`;
    return (
        <span
            title={title}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.chip}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
            {typeof pct === "number" && <span className="font-semibold tabular-nums opacity-70">{pct}%</span>}
        </span>
    );
}

// ── Journey timeline ───────────────────────────────────────────────────────

// Three-step applicant journey shown in the expanded row. Payment +
// booking are intentionally omitted while payment intake stays disabled;
// when AssessmentController::simulatePay gets a real Stripe body, Pay
// and Booked can return as a separate strip without touching this one.
function JourneyRow({ intake: i }) {
    const j = i.journey || {};
    const fmt = (iso) => iso ? new Date(iso).toLocaleString("en-NZ", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

    const steps = [
        {
            key: "submitted",
            label: "Submitted",
            icon: <FileText size={14} />,
            done: !! j.submitted,
            sub:  j.submitted_at ? fmt(j.submitted_at) : "Not yet submitted",
            tip:  "Applicant submitted the visa-interest form. Always true for any visible row.",
        },
        {
            key: "triaged",
            label: "Triaged",
            icon: <UserCheck size={14} />,
            done: !! j.triaged,
            sub:  j.triaged ? `Status: ${i.status}` : "Awaiting adviser triage",
            tip:  "Staff have changed the intake status away from the default Submitted/New state.",
        },
        {
            key: "converted",
            label: "Converted to Case",
            icon: <ArrowRightCircle size={14} />,
            done: !! j.converted,
            sub:  j.converted ? "Linked Lead is an immigration case" : "Not yet converted",
            tip:  "A Lead with this applicant's email is flagged as an immigration case (is_immigration_case = true).",
        },
    ];

    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-3">
                Applicant journey
            </p>

            <div className="flex items-start">
                {steps.map((s, idx) => {
                    const lastOne   = idx === steps.length - 1;
                    const nextDone  = ! lastOne && steps[idx + 1].done;
                    return (
                        <div key={s.key} className="flex-1 min-w-0">
                            <div className="flex items-center">
                                {/* Step circle */}
                                <span
                                    title={s.tip}
                                    className={`flex-shrink-0 w-9 h-9 rounded-full inline-flex items-center justify-center border-2 transition-colors cursor-help ${
                                        s.done
                                            ? "bg-emerald-500 border-emerald-500 text-white"
                                            : "bg-white border-gray-300 text-gray-400"
                                    }`}
                                >
                                    {s.done ? <Check size={15} strokeWidth={3} /> : s.icon}
                                </span>

                                {/* Connector to next step */}
                                {! lastOne && (
                                    <div className="flex-1 h-0.5 mx-1.5">
                                        <div className={`h-full rounded-full transition-colors ${
                                            s.done && nextDone ? "bg-emerald-500"
                                            : s.done           ? "bg-gradient-to-r from-emerald-500 to-gray-200"
                                            :                    "bg-gray-200"
                                        }`} />
                                    </div>
                                )}
                            </div>

                            {/* Label + subtext */}
                            <div className="mt-2 pr-3">
                                <p
                                    title={s.tip}
                                    className={`text-[11.5px] font-bold cursor-help ${s.done ? "text-gray-900" : "text-gray-500"}`}
                                >
                                    {s.label}
                                </p>
                                <p className={`text-[10.5px] mt-0.5 ${s.done ? "text-gray-600" : "text-gray-400 italic"}`}>
                                    {s.sub}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function EmptyState({ icon, title, action }) {
    return (
        <div className="py-14 text-center text-gray-400">
            <div className="inline-flex items-center justify-center mb-3 text-gray-300">{icon}</div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {action}
        </div>
    );
}
