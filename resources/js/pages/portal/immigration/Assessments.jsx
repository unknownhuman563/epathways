import { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    ChevronRight, ChevronDown, ClipboardCheck, FileEdit, Globe, Send, Search,
    Users, Briefcase, GraduationCap, Plane,
    Check, FileText, UserCheck, ArrowRightCircle,
} from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";

// ── Visa-type metadata ─────────────────────────────────────────────────────
const VISA_TYPES = [
    { key: "all",      label: "All Talents",  icon: <Users size={13} />          },
    { key: "resident", label: "Resident",     icon: <ClipboardCheck size={13} /> },
    { key: "work",     label: "Work",         icon: <Briefcase size={13} />      },
    { key: "student",  label: "Student",      icon: <GraduationCap size={13} />  },
    { key: "visitor",  label: "Visitor",      icon: <Plane size={13} />          },
];

const VISA_AVATAR_BG = {
    resident: "bg-amber-500",
    work:     "bg-blue-500",
    student:  "bg-purple-500",
    visitor:  "bg-emerald-500",
};

const VISA_LABEL = {
    resident: "Resident",
    work:     "Work",
    student:  "Student",
    visitor:  "Visitor",
};

// Status buckets — only an explicit "Submitted" counts as Submitted.
// Anything else (including the legacy "New" default) is treated as Draft
// until the applicant actually clicks the Submit button on the form.
const SUBMITTED_STATUSES = new Set(["Submitted", "submitted"]);
const COMPLETED_STATUSES = new Set(["Completed", "Engaged", "Converted", "Approved", "completed", "engaged", "converted"]);

const isCompleted = (i) => COMPLETED_STATUSES.has(i.status);
const isSubmitted = (i) => SUBMITTED_STATUSES.has(i.status);
const isDraft     = (i) => ! isSubmitted(i) && ! isCompleted(i); // default → draft

// Returns { stage: 'draft' | 'submitted' | 'completed', pct: 33|66|100 }
const progressOf = (i) => {
    if (isCompleted(i)) return { stage: "completed", pct: 100 };
    if (isDraft(i))     return { stage: "draft",     pct: 33  };
    return                     { stage: "submitted", pct: 66  };
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

export default function ImmigrationAssessments({ intakes = [] }) {
    const [activeVisa,   setActiveVisa]   = useState("all");
    const [statusFilter, setStatusFilter] = useState("all"); // all | submitted | draft | completed
    const [search,       setSearch]       = useState("");
    const [expanded,     setExpanded]     = useState(() => new Set());

    const toggleExpanded = (key) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else                next.add(key);
            return next;
        });
    };

    const visaCounts = useMemo(() => {
        const c = { all: intakes.length, resident: 0, work: 0, student: 0, visitor: 0 };
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
            if (q) {
                const hay = `${i.name} ${i.email || ""} ${i.phone || ""} ${i.intake_id || ""} ${i.status || ""}`.toLowerCase();
                if (! hay.includes(q)) return false;
            }
            return true;
        });
    }, [intakes, activeVisa, statusFilter, search]);

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
            <Head title="Assessments — Immigration" />
            <PortalPageHeader
                eyebrow="Work"
                title="Assessments"
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
                                onClick={() => { setSearch(""); setStatusFilter("all"); setActiveVisa("all"); }}
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
                                    <th className="px-4 py-2.5">Contact</th>
                                    <th className="px-4 py-2.5 w-[220px]">Progress</th>
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
                        {i.intake_id && (
                            <p className="text-[10px] text-gray-500 font-mono mt-0.5">{i.intake_id}</p>
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

            {/* Contact */}
            <td className="px-4 py-3 align-middle">
                {i.email && <p className="text-[11.5px] text-gray-700 truncate max-w-[220px]">{i.email}</p>}
                {i.phone && <p className="text-[10.5px] text-gray-400 truncate max-w-[220px]">{i.phone}</p>}
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

            {/* Submitted */}
            <td className="px-4 py-3 align-middle">
                <span className="text-[11px] text-gray-600 tabular-nums">{fmtDate(i.created_at)}</span>
            </td>

            {/* Actions — stops click propagation so action buttons don't
                toggle the row's expansion. */}
            <td className="px-4 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-1">
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
                    {i.detail_url ? (
                        // Resident gets the dedicated detail page;
                        // Work/Student/Visitor fall back to the leads
                        // index search-by-email until per-type detail
                        // pages land.
                        <Link
                            href={i.detail_url}
                            title={i.visa_type === "resident"
                                ? undefined
                                : "Detail view coming soon — open as lead"}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                            Open <ChevronRight size={10} />
                        </Link>
                    ) : (
                        <span
                            className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 cursor-not-allowed"
                            title="No contact email on this submission"
                        >
                            —
                        </span>
                    )}
                </div>
            </td>
        </tr>

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
