import { useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import {
    ChevronLeft, ChevronRight, Download, Share2, Lock, TrendingUp, TrendingDown,
    Minus, Users, GraduationCap, FolderOpen, FileCheck, AlertTriangle, CheckCircle2,
    Snowflake, CalendarDays, Sparkles, Star, ArrowRightLeft, BookOpen, CreditCard,
    LineChart as LineChartIcon, ListChecks,
} from "lucide-react";

const PERIODS = [
    { key: "weekly",    label: "Weekly" },
    { key: "monthly",   label: "Monthly" },
    { key: "quarterly", label: "Quarterly" },
    { key: "custom",    label: "Custom" },
];

const fmtRange = (a, b) => {
    if (!a || !b) return "—";
    const s = new Date(a + "T00:00:00"), e = new Date(b + "T00:00:00");
    return `${s.toLocaleDateString("en-NZ", { day: "numeric", month: "short" })} – ${e.toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" })}`;
};

const fmtIso = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

export default function EducationReports({
    period = "weekly", range = {}, filters = {},
    glance = {}, programs = {}, trend = [],
    generated_at, generated_by,
}) {
    // Period switcher — preserves filters via the URL so they stick across
    // tab clicks (a counselor filter set on Weekly stays when you click Monthly).
    const setPeriod = (next) => {
        const q = { ...filters, period: next };
        router.get('/portal/education/reports', q, { preserveScroll: true });
    };

    const stepPeriod = (delta) => {
        const a = range.start ? new Date(range.start + "T00:00:00") : new Date();
        if (period === "monthly")        a.setMonth(a.getMonth() + delta);
        else if (period === "quarterly") a.setMonth(a.getMonth() + (delta * 3));
        else                              a.setDate(a.getDate() + (delta * 7));
        router.get('/portal/education/reports', { ...filters, period, anchor: fmtIso(a) }, { preserveScroll: true });
    };

    const periodLabel = useMemo(() => {
        if (period === "monthly")   return new Date(range.start + "T00:00:00").toLocaleDateString("en-NZ", { month: "long", year: "numeric" });
        if (period === "quarterly") {
            const d = new Date(range.start + "T00:00:00");
            return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
        }
        return fmtRange(range.start, range.end);
    }, [period, range.start, range.end]);

    return (
        <div className="space-y-6 max-w-[1500px] mx-auto pb-12">
            <Head title="Reports — Education" />

            {/* Page header — tabs + actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reports</h1>
                    <div className="flex items-center gap-2">
                        <DisabledAction icon={<Download size={13} />} label="Export PDF" />
                        <DisabledAction icon={<Share2 size={13} />}   label="Share with…" />
                    </div>
                </div>

                {/* Period tabs */}
                <div className="flex items-center gap-1 border-b border-gray-100 -mx-5 px-5">
                    {PERIODS.map((p) => (
                        <button
                            key={p.key}
                            type="button"
                            onClick={() => setPeriod(p.key)}
                            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                                period === p.key
                                    ? "text-indigo-700 border-indigo-600"
                                    : "text-gray-400 border-transparent hover:text-gray-700"
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {/* Period selector + filters */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        {period !== "custom" && (
                            <>
                                <button type="button" onClick={() => stepPeriod(-1)} className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100">
                                    <ChevronLeft size={16} />
                                </button>
                                <div className="min-w-[200px] text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">{period}</p>
                                    <p className="text-base font-semibold text-gray-900 tracking-tight tabular-nums">{periodLabel}</p>
                                </div>
                                <button type="button" onClick={() => stepPeriod(1)} className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100">
                                    <ChevronRight size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.get('/portal/education/reports', { ...filters, period }, { preserveScroll: true })}
                                    className="ml-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200"
                                >
                                    Current
                                </button>
                            </>
                        )}
                        {period === "custom" && (
                            <div className="flex items-center gap-2">
                                <input type="date" defaultValue={range.start} onChange={(e) => router.get('/portal/education/reports', { ...filters, period: "custom", from: e.target.value, to: range.end }, { preserveScroll: true })}
                                    className="text-xs rounded-lg border border-gray-200 py-1.5 px-2.5" />
                                <span className="text-gray-400 text-xs">→</span>
                                <input type="date" defaultValue={range.end}   onChange={(e) => router.get('/portal/education/reports', { ...filters, period: "custom", from: range.start, to: e.target.value }, { preserveScroll: true })}
                                    className="text-xs rounded-lg border border-gray-200 py-1.5 px-2.5" />
                            </div>
                        )}
                    </div>

                    {/* Filters — UI only for now (counselor/institution/intake/program live as later infra). */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <FilterStub label="All counselors" />
                        <FilterStub label="All institutions" />
                        <FilterStub label="All intakes" />
                        <FilterStub label="All programs" />
                    </div>
                </div>
            </div>

            {/* Quarterly extras — strategic insights preface */}
            {period === "quarterly" && (
                <section className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={14} className="text-indigo-200" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-indigo-200">Strategic insights</p>
                    </div>
                    <h2 className="text-2xl font-medium tracking-tight">{periodLabel} — what to act on next quarter</h2>
                    <p className="text-sm text-indigo-100 mt-2 max-w-2xl">
                        Auto-curated top 3 wins, top 3 concerns, and adviser recommendations land here — wired up once we have enough per-quarter data to surface meaningful patterns.
                    </p>
                </section>
            )}

            {/* All 13 sections */}
            <Section title="At a glance">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <Tile label="New students"   value={glance.new_students?.value ?? 0} prev={glance.new_students?.prev} tone="success" icon={<GraduationCap size={14} />} />
                    <Tile label="Total students" value={glance.total_students ?? 0}      tone="default" icon={<Users size={14} />} />
                    <Tile label="Docs uploaded"  value={glance.docs_uploaded ?? 0}       tone="default" icon={<FolderOpen size={14} />} />
                    <Tile label="Docs approved"  value={glance.docs_approved ?? 0}       tone="success" icon={<FileCheck size={14} />} />
                    <Tile label="Docs rejected"  value={glance.docs_rejected ?? 0}       tone="danger"  icon={<AlertTriangle size={14} />} />
                    <Tile label="Docs pending"   value={glance.docs_pending ?? 0}        tone="warning" icon={<Snowflake size={14} />} />
                </div>
            </Section>

            <Section title="Pipeline health" subtitle="Student progression through programs and stages.">
                <NeedsInfra icon={<LineChartIcon size={18} />} title="Needs student-stage tracking" lines={[
                    "Today every lead has a Sales pipeline stage; students need a parallel Education pipeline (Researching → Applied → Offer received → Visa applied → Enrolled).",
                    "Once that's modelled, this section becomes a stage-bar chart like the Sales report.",
                ]} />
            </Section>

            <Section title="Going stale" subtitle="Students whose document submission has stalled.">
                <NeedsInfra icon={<Snowflake size={18} />} title="Needs last-activity audit" lines={[
                    "Cold buckets (7-14 / 15-30 / 30+ days no update) — same UX as Sales' Going Cold chart but scoped to students.",
                    "Last-activity = last document upload OR last note OR last counselor task on that student.",
                ]} />
            </Section>

            <Section title="Per-counselor activity" subtitle="Caseload, response times, and document throughput by counselor.">
                <NeedsInfra icon={<Users size={18} />} title="Needs counselor assignment on student" lines={[
                    "Add counselor_id (FK to users) on the lead when a student is created.",
                    "Columns: active students, new assigned, docs reviewed, avg review turnaround, tasks done, tasks overdue.",
                    "Visibility scoped: counselor sees own row + team aggregate; manager sees full table.",
                ]} />
            </Section>

            <Section title="Intake pipeline" subtitle="Students grouped by their target intake (Feb 2027, Jul 2027, etc.).">
                <NeedsInfra icon={<CalendarDays size={18} />} title="Needs intake column on study plan" lines={[
                    "Today study_plans.preferred_intake exists as free text. Promote it to a structured intake_id referencing an intakes table.",
                    "Once normalised, this section becomes a horizontal bar of students per upcoming intake with status breakdown.",
                ]} />
            </Section>

            <Section title="Programs & institutions" subtitle="Which programs and NZ institutions students are headed to.">
                <ProgramsChart programs={programs} />
            </Section>

            <Section title="Documents" subtitle="Document throughput for the period — uploaded broken down by current status.">
                <DocumentsChart glance={glance} />
            </Section>

            <Section title="Payments" subtitle="Engagement-fee and tuition payment status.">
                <NeedsInfra icon={<CreditCard size={18} />} title="Needs payments table" lines={[
                    "Build lead_payments (lead_id, kind, amount, status, paid_at, method, receipt_path).",
                    "Sections: collected this period, outstanding, overdue, breakdown by kind (engagement / tuition / visa).",
                ]} />
            </Section>

            <Section title="AI activity" subtitle="AI assistance accepted, modified, rejected.">
                <NeedsInfra icon={<Sparkles size={18} />} title="Needs ai_activity_logs" lines={[
                    "Same backbone the Sales report needs — one shared table tracks AI suggestions across portals.",
                ]} />
            </Section>

            <Section title="Trends" subtitle="Last 8 periods of new students vs document throughput.">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <TrendLines data={trend} period={period} />
                </div>
            </Section>

            <Section title="Notable items" subtitle="Auto-curated wins and concerns for the period.">
                <NeedsInfra icon={<Star size={18} />} title="Will populate once we have richer signals" lines={[
                    "Wins — students who reached visa-lodged stage; sections verified ahead of schedule.",
                    "Concerns — long-pending documents; counselors with growing overdue queues; expiring offers.",
                ]} />
            </Section>

            <Section title="Cross-service handoffs" subtitle="Students who also engaged Immigration or Accommodation.">
                <NeedsInfra icon={<ArrowRightLeft size={18} />} title="Needs multi-service flags" lines={[
                    "Mirror is_student with is_immigration_case + is_accommodation_client on leads.",
                    "This section then renders the handoff matrix — who's engaged with which combinations.",
                ]} />
            </Section>

            {/* Footer */}
            <footer className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center justify-between gap-3 flex-wrap text-[11px] text-gray-500">
                <div className="flex items-center gap-4">
                    <span>Generated {new Date(generated_at || Date.now()).toLocaleString("en-NZ", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    {generated_by && <span>by <span className="font-semibold text-gray-700">{generated_by}</span></span>}
                </div>
                <span className="italic text-gray-400">Not shared with any other team</span>
            </footer>
        </div>
    );
}

// ── Building blocks ────────────────────────────────────────────────────────

function Section({ title, subtitle, children }) {
    return (
        <section className="space-y-3">
            <div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h2>
                {subtitle && <p className="text-[12px] text-gray-500 mt-0.5 max-w-3xl">{subtitle}</p>}
            </div>
            {children}
        </section>
    );
}

function Tile({ label, value, prev = null, hint = null, tone = "default", muted = false, icon = null }) {
    const showDelta = prev != null && typeof value === "number" && typeof prev === "number";
    const delta = showDelta ? value - prev : null;
    const TONES = {
        default: { num: "text-gray-900",    glyph: "bg-gray-100 text-gray-600" },
        success: { num: "text-emerald-700", glyph: "bg-emerald-100 text-emerald-700" },
        warning: { num: "text-amber-700",   glyph: "bg-amber-100 text-amber-700" },
        danger:  { num: "text-rose-700",    glyph: "bg-rose-100 text-rose-700" },
    };
    const t = TONES[tone] || TONES.default;
    return (
        <div className={`bg-white rounded-2xl border border-gray-100 p-4 ${muted ? "opacity-70" : ""}`}>
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">{label}</p>
                {icon && <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${t.glyph}`}>{icon}</span>}
            </div>
            <p className={`text-3xl font-bold tabular-nums mt-2 ${t.num}`}>{value}</p>
            {showDelta && delta !== null && (
                <p className={`text-[11px] mt-1 inline-flex items-center gap-1 font-semibold ${delta > 0 ? "text-emerald-600" : delta < 0 ? "text-rose-600" : "text-gray-400"}`}>
                    {delta > 0 ? <TrendingUp size={11} /> : delta < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
                    {delta > 0 ? "+" : ""}{delta} vs previous
                </p>
            )}
            {hint && <p className="text-[10px] text-gray-400 mt-1 italic">{hint}</p>}
        </div>
    );
}

// Stacked horizontal bar — period's documents broken down by status. The
// big number is "uploaded this period"; the bar shows current resolution.
function DocumentsChart({ glance }) {
    const uploaded = glance.docs_uploaded ?? 0;
    const approved = glance.docs_approved ?? 0;
    const rejected = glance.docs_rejected ?? 0;
    const pending  = glance.docs_pending  ?? 0;

    const approvedRate = uploaded > 0 ? Math.round((approved / uploaded) * 100) : 0;
    const rejectedRate = uploaded > 0 ? Math.round((rejected / uploaded) * 100) : 0;

    const rows = [
        { key: "approved", label: "Approved",       value: approved, bar: "bg-emerald-500", num: "text-emerald-700" },
        { key: "pending",  label: "Pending review", value: pending,  bar: "bg-amber-400",   num: "text-amber-700" },
        { key: "rejected", label: "Rejected",       value: rejected, bar: "bg-rose-500",    num: "text-rose-700" },
    ];
    const total = Math.max(1, approved + pending + rejected);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Funnel — period's uploaded with current status split */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
                <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">Uploaded this period</p>
                        <p className="text-4xl font-bold text-gray-900 tabular-nums mt-1">{uploaded}</p>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest tabular-nums">
                        <span className="text-emerald-700">{approvedRate}% approved</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-rose-700">{rejectedRate}% rejected</span>
                    </div>
                </div>

                {/* Stacked progress bar — outcomes of this period's uploaded docs */}
                {(approved + pending + rejected) > 0 && (
                    <div className="mt-5 h-4 rounded-full overflow-hidden flex bg-gray-100">
                        {rows.filter((r) => r.value > 0).map((r) => (
                            <div
                                key={r.key}
                                className={`${r.bar} transition-all`}
                                style={{ width: `${(r.value / total) * 100}%` }}
                                title={`${r.label}: ${r.value}`}
                            />
                        ))}
                    </div>
                )}

                <ul className="mt-5 space-y-3">
                    {rows.map((r) => {
                        const pct = total > 0 ? Math.round((r.value / total) * 100) : 0;
                        return (
                            <li key={r.key} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className={`w-2.5 h-2.5 rounded-full ${r.bar}`}></span>
                                    <p className="text-sm text-gray-700">{r.label}</p>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-xl font-bold tabular-nums ${r.num}`}>{r.value}</span>
                                    <span className="text-[11px] text-gray-400 tabular-nums">{pct}%</span>
                                </div>
                            </li>
                        );
                    })}
                </ul>

                {(approved + pending + rejected) === 0 && (
                    <p className="text-sm text-gray-400 italic text-center py-6">No documents resolved this period yet.</p>
                )}
            </div>

            {/* Side card — overall pending queue across all periods */}
            <div className="bg-gradient-to-br from-amber-50 via-white to-white rounded-2xl border border-amber-200 p-5 sm:p-6 flex flex-col">
                <div className="flex items-center gap-2 text-amber-700 mb-1">
                    <FolderOpen size={14} />
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em]">Awaiting review</p>
                </div>
                <p className="text-5xl font-bold tabular-nums text-amber-700 mt-2">{pending}</p>
                <p className="text-sm text-amber-900/70 mt-1 font-medium">
                    {pending === 1 ? "document" : "documents"} in the queue right now
                </p>
                <div className="flex-1" />
                <a
                    href="/portal/education/documents"
                    className="mt-5 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-amber-700 transition-colors"
                >
                    <FolderOpen size={12} /> Open queue
                </a>
            </div>
        </div>
    );
}

// SVG donut + legend — programs by publish status.
function ProgramsChart({ programs }) {
    const total     = programs.total ?? 0;
    const published = programs.published ?? 0;
    const unpublished = Math.max(0, total - published);

    const slices = [
        { label: "Published",   value: published,   color: "stroke-emerald-500", chip: "bg-emerald-500" },
        { label: "Unpublished", value: unpublished, color: "stroke-gray-300",    chip: "bg-gray-300" },
    ];
    const sum = slices.reduce((t, s) => t + s.value, 0);
    const radius = 70, stroke = 22, circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 flex items-center justify-center">
                {sum === 0 ? (
                    <p className="text-sm text-gray-400 italic text-center py-10">No programs to chart yet.</p>
                ) : (
                    <div className="relative w-[180px] h-[180px]">
                        <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
                            {slices.map((s, i) => {
                                if (s.value === 0) return null;
                                const dash = (s.value / sum) * circumference;
                                const el = (
                                    <circle
                                        key={i}
                                        cx="90" cy="90" r={radius}
                                        fill="none"
                                        strokeWidth={stroke}
                                        strokeDasharray={`${dash} ${circumference - dash}`}
                                        strokeDashoffset={-offset}
                                        className={s.color}
                                    />
                                );
                                offset += dash;
                                return el;
                            })}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <p className="text-3xl font-bold text-gray-900 tabular-nums">{total}</p>
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Programs</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
                <div className="flex items-baseline justify-between mb-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">Status breakdown</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 tabular-nums">{total} total</p>
                </div>
                <ul className="space-y-3">
                    {slices.map((s) => {
                        const pct = sum > 0 ? Math.round((s.value / sum) * 100) : 0;
                        return (
                            <li key={s.label} className="flex items-center justify-between gap-3">
                                <span className="inline-flex items-center gap-2 text-sm text-gray-700">
                                    <span className={`w-2.5 h-2.5 rounded-full ${s.chip}`}></span>
                                    {s.label}
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-bold tabular-nums text-gray-900">{s.value}</span>
                                    <span className="text-[11px] text-gray-400 tabular-nums">{pct}%</span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
                <p className="text-[10px] italic text-gray-400 mt-5">
                    "Most popular programme" + per-institution split land here once we link students → program records.
                </p>
            </div>
        </div>
    );
}

function NeedsInfra({ icon, title, lines }) {
    return (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0">{icon}</div>
            <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 mb-1">Needs infrastructure</p>
                <h3 className="text-base font-bold text-gray-800 mb-2">{title}</h3>
                <ul className="text-[12px] text-gray-600 leading-relaxed space-y-1">
                    {lines.map((l, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <span className="text-gray-400 mt-1.5">•</span>
                            <span>{l}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

function TrendLines({ data, period }) {
    const [series, setSeries] = useState({ new_students: true, docs_uploaded: true, docs_approved: false });
    const toggle = (k) => setSeries((s) => ({ ...s, [k]: !s[k] }));
    const w = 720, h = 220, pad = 36;
    const max = Math.max(1, ...data.flatMap((d) => [
        series.new_students  ? d.new_students  : 0,
        series.docs_uploaded ? d.docs_uploaded : 0,
        series.docs_approved ? d.docs_approved : 0,
    ]));
    const x = (i) => pad + (i * (w - 2 * pad)) / Math.max(1, data.length - 1);
    const y = (v) => h - pad - ((v / max) * (h - 2 * pad));
    const line = (key) => data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d[key])}`).join(" ");
    const COLORS = { new_students: "stroke-indigo-500", docs_uploaded: "stroke-blue-500", docs_approved: "stroke-emerald-500" };
    const LABELS = { new_students: "New students", docs_uploaded: "Docs uploaded", docs_approved: "Docs approved" };

    return (
        <div>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
                {Object.entries(LABELS).map(([k, label]) => (
                    <button key={k} type="button" onClick={() => toggle(k)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${series[k] ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
                        <span className={`w-2 h-2 rounded-full ${COLORS[k].replace("stroke-", "bg-")}`}></span>
                        {label}
                    </button>
                ))}
            </div>
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
                {[0.25, 0.5, 0.75, 1].map((p) => (
                    <line key={p} x1={pad} x2={w - pad} y1={h - pad - p * (h - 2 * pad)} y2={h - pad - p * (h - 2 * pad)} className="stroke-gray-100" />
                ))}
                {series.new_students  && <path d={line("new_students")}  fill="none" strokeWidth="2.5" className={COLORS.new_students} />}
                {series.docs_uploaded && <path d={line("docs_uploaded")} fill="none" strokeWidth="2.5" className={COLORS.docs_uploaded} />}
                {series.docs_approved && <path d={line("docs_approved")} fill="none" strokeWidth="2.5" className={COLORS.docs_approved} />}
                {data.map((d, i) => (
                    <text key={i} x={x(i)} y={h - pad + 16} textAnchor="middle" className="text-[10px] fill-gray-400">
                        {d.label}
                    </text>
                ))}
            </svg>
            <p className="text-[10px] italic text-gray-400 mt-2">8 {period === "quarterly" ? "quarters" : period === "monthly" ? "months" : "weeks"} ending {data[data.length - 1]?.label || ""}</p>
        </div>
    );
}

function DisabledAction({ icon, label }) {
    return (
        <button
            type="button"
            disabled
            title="Coming soon"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 border border-gray-200 cursor-not-allowed"
        >
            <Lock size={11} />
            {icon}
            {label}
        </button>
    );
}

function FilterStub({ label }) {
    return (
        <button
            type="button"
            disabled
            title="Filter UI ready; backend filtering wired once counselor/intake/program normalisation lands"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-gray-500 bg-gray-50 border border-gray-200 cursor-not-allowed"
        >
            {label}
        </button>
    );
}
