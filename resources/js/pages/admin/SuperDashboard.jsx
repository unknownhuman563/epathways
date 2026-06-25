import { Head, Link, usePage } from "@inertiajs/react";
import { useMemo } from "react";
import OpenRequestsCard from "@/components/OpenRequestsCard";
import {
    TrendingUp, Users, CheckSquare, AlertTriangle, Calendar as CalendarIcon,
    Sparkles, Activity, Crown, ArrowUpRight, ChevronRight, Globe, Briefcase,
    GraduationCap, Building2, Languages, Shield, Clock,
} from "lucide-react";

// Super-Admin Dashboard
//
// Single page that pulls together the four cross-cutting views the role
// cares about: pipeline funnel, task health, bookings + assessments, and
// the cross-department activity feed. Every panel reads from props that
// SuperAdminDashboardController prepares — no client-side fetching.

const DEPT_META = {
    sales:         { label: "Sales",         color: "text-blue-700",    bg: "bg-blue-50",    icon: <Briefcase size={14} /> },
    education:     { label: "Education",     color: "text-emerald-700", bg: "bg-emerald-50", icon: <GraduationCap size={14} /> },
    english:       { label: "English",       color: "text-purple-700",  bg: "bg-purple-50",  icon: <Languages size={14} /> },
    immigration:   { label: "Immigration",   color: "text-cyan-700",    bg: "bg-cyan-50",    icon: <Globe size={14} /> },
    accommodation: { label: "Accommodation", color: "text-amber-700",   bg: "bg-amber-50",   icon: <Building2 size={14} /> },
    admin:         { label: "Admin",         color: "text-gray-700",    bg: "bg-gray-100",   icon: <Shield size={14} /> },
};

const fmtDate = (iso) => iso
    ? new Date(iso).toLocaleDateString("en-NZ", { day: "2-digit", month: "short" })
    : "";

const fmtTime = (iso) => iso
    ? new Date(iso).toLocaleString("en-NZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";

const fmtRelative = (iso) => {
    if (! iso) return "";
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins   = Math.floor(diffMs / 60000);
    if (mins < 1)   return "just now";
    if (mins < 60)  return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7)   return `${days}d ago`;
    return fmtDate(iso);
};

export default function SuperDashboard() {
    const { props } = usePage();
    const {
        kpis = {},
        pipeline = [],
        sources = [],
        aiBuckets = {},
        taskByDept = [],
        topAssignees = [],
        recentDone = [],
        upcomingBookings = [],
        bookingsConfirmed = 0,
        bookingsPending = 0,
        recentAssessments = [],
        activity = [],
        generatedAt,
        ticketSummary = { open_count: 0, recent: [] },
    } = props;

    // The funnel's max stage count is used to size each bar relative to
    // the biggest stage. Falling back to 1 avoids divide-by-zero on an
    // empty database during early dev.
    const pipelineMax = useMemo(
        () => Math.max(1, ...pipeline.map((p) => p.count)),
        [pipeline],
    );
    const sourcesMax = useMemo(
        () => Math.max(1, ...sources.map((s) => s.count)),
        [sources],
    );
    const aiTotal = useMemo(
        () => Object.values(aiBuckets).reduce((sum, n) => sum + n, 0) || 1,
        [aiBuckets],
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            <Head title="Super Admin Dashboard" />

            {/* ── Header ──────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                        <Crown size={12} /> Super Admin
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Cross-Department Overview</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Live aggregate across pipeline, tasks, bookings, and activity — generated {fmtRelative(generatedAt)}.
                    </p>
                </div>
                <Link
                    href="/admin/dashboard"
                    className="text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors inline-flex items-center gap-1"
                >
                    Standard dashboard <ChevronRight size={12} />
                </Link>
            </div>

            {/* ── Top KPI strip ───────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard label="Total Leads"      value={kpis.total_leads}        sub={`+${kpis.new_leads_7d || 0} this week`} icon={<Users size={16} />} accent="bg-blue-100 text-blue-700" />
                <KpiCard label="Converted"        value={kpis.converted_total}    sub="student / case / accom." icon={<TrendingUp size={16} />} accent="bg-emerald-100 text-emerald-700" />
                <KpiCard label="Open Tasks"       value={kpis.open_tasks}         sub={`${kpis.overdue_tasks || 0} overdue`} icon={<CheckSquare size={16} />} accent="bg-amber-100 text-amber-700" tone={kpis.overdue_tasks > 0 ? "warn" : "default"} />
                <KpiCard label="Bookings"         value={kpis.bookings_this_week} sub={`${kpis.bookings_today || 0} today`} icon={<CalendarIcon size={16} />} accent="bg-purple-100 text-purple-700" />
            </div>

            {/* ── Open system requests — quick triage peek ────────── */}
            <OpenRequestsCard summary={ticketSummary} />

            {/* ── Panel 1: Pipeline & Funnel ──────────────────────── */}
            <Panel title="Lead Pipeline & Funnel" icon={<TrendingUp size={14} />}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Stage funnel — left two columns */}
                    <div className="lg:col-span-2">
                        <SubHeading>Stage distribution</SubHeading>
                        <ul className="space-y-1 mt-2">
                            {pipeline.map((p) => (
                                <li key={p.stage} className="flex items-center gap-2 text-xs">
                                    <span className="w-44 truncate text-gray-700 flex-shrink-0">{p.stage}</span>
                                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                                            style={{ width: `${(p.count / pipelineMax) * 100}%` }}
                                        />
                                    </div>
                                    <span className="w-10 text-right font-bold tabular-nums text-gray-800">{p.count}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Source breakdown + AI eligibility */}
                    <div className="space-y-6">
                        <div>
                            <SubHeading>Top sources</SubHeading>
                            {sources.length === 0 ? (
                                <p className="text-xs text-gray-400 mt-2">No source data yet.</p>
                            ) : (
                                <ul className="space-y-1 mt-2">
                                    {sources.map((s) => (
                                        <li key={s.source} className="flex items-center gap-2 text-xs">
                                            <span className="w-20 truncate text-gray-700 flex-shrink-0">{s.source}</span>
                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-400 rounded-full"
                                                    style={{ width: `${(s.count / sourcesMax) * 100}%` }}
                                                />
                                            </div>
                                            <span className="w-8 text-right font-bold tabular-nums text-gray-800">{s.count}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div>
                            <SubHeading>
                                <Sparkles size={11} className="inline -mt-0.5 mr-1" />
                                AI eligibility (assessed leads)
                            </SubHeading>
                            <div className="mt-2 flex h-6 rounded-md overflow-hidden border border-gray-200">
                                <AiSeg pct={(aiBuckets["85+"]   || 0) / aiTotal * 100} color="bg-emerald-500" label="85+"   count={aiBuckets["85+"]} />
                                <AiSeg pct={(aiBuckets["70-84"] || 0) / aiTotal * 100} color="bg-lime-500"    label="70-84" count={aiBuckets["70-84"]} />
                                <AiSeg pct={(aiBuckets["50-69"] || 0) / aiTotal * 100} color="bg-amber-400"   label="50-69" count={aiBuckets["50-69"]} />
                                <AiSeg pct={(aiBuckets["30-49"] || 0) / aiTotal * 100} color="bg-orange-500"  label="30-49" count={aiBuckets["30-49"]} />
                                <AiSeg pct={(aiBuckets["<30"]   || 0) / aiTotal * 100} color="bg-red-500"     label="<30"   count={aiBuckets["<30"]} />
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] text-gray-500">
                                {Object.entries(aiBuckets).map(([k, v]) => (
                                    <span key={k} className="tabular-nums">{k}: <b className="text-gray-800">{v}</b></span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </Panel>

            {/* ── Panel 2: Tasks & Team Load ──────────────────────── */}
            <Panel title="Tasks & Team Load" icon={<CheckSquare size={14} />}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Per-department task counts */}
                    <div>
                        <SubHeading>Per department</SubHeading>
                        <ul className="space-y-2 mt-2">
                            {taskByDept.map((d) => {
                                const meta = DEPT_META[d.department] || { label: d.department, color: "text-gray-700", bg: "bg-gray-100", icon: null };
                                return (
                                    <li key={d.department} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md ${meta.bg}`}>
                                        <span className={`${meta.color} flex-shrink-0`}>{meta.icon}</span>
                                        <span className={`flex-1 text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                                        <span className="text-[10px] font-bold tabular-nums text-gray-700" title="Open">{d.open}</span>
                                        {d.overdue > 0 && (
                                            <span className="text-[10px] font-bold tabular-nums text-red-600 inline-flex items-center gap-0.5" title="Overdue">
                                                <AlertTriangle size={9} /> {d.overdue}
                                            </span>
                                        )}
                                        <span className="text-[10px] font-bold tabular-nums text-emerald-600" title="Done last 7d">+{d.done_7d}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Top staff load */}
                    <div>
                        <SubHeading>Top open-load (staff)</SubHeading>
                        {topAssignees.length === 0 ? (
                            <p className="text-xs text-gray-400 mt-2">No staff with open tasks.</p>
                        ) : (
                            <ul className="space-y-1.5 mt-2">
                                {topAssignees.map((a) => (
                                    <li key={a.id} className="flex items-center gap-2 text-xs">
                                        <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                            {a.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                                        </span>
                                        <span className="flex-1 truncate font-medium text-gray-800">{a.name}</span>
                                        {a.role && (
                                            <span className="text-[9px] uppercase tracking-wider text-gray-400">{a.role}</span>
                                        )}
                                        <span className="font-bold tabular-nums text-gray-700">{a.open}</span>
                                        {a.overdue > 0 && (
                                            <span className="text-[10px] font-bold tabular-nums text-red-600" title="Overdue">⚠ {a.overdue}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Recent completions */}
                    <div>
                        <SubHeading>Recently done</SubHeading>
                        {recentDone.length === 0 ? (
                            <p className="text-xs text-gray-400 mt-2">No completed tasks yet.</p>
                        ) : (
                            <ul className="space-y-1.5 mt-2">
                                {recentDone.map((t) => (
                                    <li key={t.id} className="text-xs border-l-2 border-emerald-300 pl-2">
                                        <div className="font-semibold text-gray-800 truncate">{t.title}</div>
                                        <div className="text-[10px] text-gray-500 truncate">
                                            {t.assignee || 'Unassigned'}
                                            {t.lead_name && <> · <Link href={`/admin/leads/${t.lead_id}`} className="hover:underline">{t.lead_name}</Link></>}
                                            <span className="ml-1 text-gray-400">· {fmtRelative(t.completed_at)}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </Panel>

            {/* ── Panel 3: Bookings & Assessments ─────────────────── */}
            <Panel title="Bookings & Assessments" icon={<CalendarIcon size={14} />}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <SubHeading>Upcoming bookings · {bookingsConfirmed} confirmed · {bookingsPending} pending</SubHeading>
                        {upcomingBookings.length === 0 ? (
                            <p className="text-xs text-gray-400 mt-2">No upcoming bookings.</p>
                        ) : (
                            <ul className="space-y-1.5 mt-2">
                                {upcomingBookings.map((b) => (
                                    <li key={b.id} className="flex items-center gap-2 text-xs border-l-2 border-purple-300 pl-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-gray-800 truncate">
                                                {b.lead_id ? <Link href={`/admin/leads/${b.lead_id}`} className="hover:underline">{b.name}</Link> : b.name}
                                            </div>
                                            <div className="text-[10px] text-gray-500 truncate">
                                                {b.service_type || 'Consultation'} · {b.consultant_name || 'Unassigned'}
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-[10px] tabular-nums font-bold text-gray-700">{fmtDate(b.appointment_date)}</div>
                                            <div className="text-[10px] tabular-nums text-gray-500">{b.appointment_time || ''}</div>
                                        </div>
                                        <StatusPill status={b.status} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div>
                        <SubHeading>Recent free-assessment submissions</SubHeading>
                        {recentAssessments.length === 0 ? (
                            <p className="text-xs text-gray-400 mt-2">No recent assessments.</p>
                        ) : (
                            <ul className="space-y-1.5 mt-2">
                                {recentAssessments.map((l) => (
                                    <li key={l.id} className="flex items-center gap-2 text-xs">
                                        <div className="flex-1 min-w-0">
                                            <Link href={`/admin/leads/${l.id}`} className="font-semibold text-gray-800 hover:underline truncate block">
                                                {l.name} <span className="font-mono text-[10px] text-gray-400">#{l.lead_id}</span>
                                            </Link>
                                            <div className="text-[10px] text-gray-500 truncate">
                                                {l.stage || 'Unstaged'} · <span className="text-gray-400">{fmtRelative(l.created_at)}</span>
                                            </div>
                                        </div>
                                        <AiStatusPill status={l.ai_analysis_status} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </Panel>

            {/* ── Panel 4: Cross-Department Activity ──────────────── */}
            <Panel title="Cross-Department Activity Feed" icon={<Activity size={14} />}>
                {activity.length === 0 ? (
                    <p className="text-xs text-gray-400">No activity recorded yet.</p>
                ) : (
                    <ul className="space-y-1">
                        {activity.map((a) => {
                            const meta = DEPT_META[a.portal] || { label: a.portal || 'public', color: "text-gray-700", bg: "bg-gray-100" };
                            return (
                                <li key={a.id} className="flex items-start gap-2 py-1.5 text-xs border-b border-gray-50 last:border-b-0">
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${meta.bg} ${meta.color} flex-shrink-0 mt-0.5`}>
                                        {meta.label}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-gray-800">{a.description || a.action}</span>
                                        {a.actor_name && (
                                            <span className="text-gray-400"> · {a.actor_name}{a.actor_role && <span className="text-gray-300"> ({a.actor_role})</span>}</span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-400 tabular-nums flex-shrink-0">{fmtRelative(a.created_at)}</span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Panel>
        </div>
    );
}

// ── Small UI bits ────────────────────────────────────────────────────

function Panel({ title, icon, children }) {
    return (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-br from-gray-50/50 to-white flex items-center gap-2">
                <span className="text-gray-500">{icon}</span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-800">{title}</h2>
            </div>
            <div className="px-5 py-4">{children}</div>
        </section>
    );
}

function SubHeading({ children }) {
    return (
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{children}</h3>
    );
}

function KpiCard({ label, value, sub, icon, accent, tone = "default" }) {
    return (
        <div className={`rounded-2xl border p-4 shadow-sm flex items-start gap-3 ${tone === 'warn' ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}>
            <div className={`w-9 h-9 rounded-lg ${accent} flex items-center justify-center flex-shrink-0`}>{icon}</div>
            <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</div>
                <div className="text-2xl font-bold text-gray-900 tabular-nums">{value ?? 0}</div>
                {sub && <div className="text-[10px] text-gray-400 mt-0.5 truncate">{sub}</div>}
            </div>
        </div>
    );
}

function AiSeg({ pct, color, label, count }) {
    if (pct <= 0) return null;
    return (
        <div
            className={`${color} flex items-center justify-center text-[9px] font-bold text-white`}
            style={{ width: `${pct}%` }}
            title={`${label}: ${count}`}
        >
            {pct > 10 ? count : ''}
        </div>
    );
}

const STATUS_PILL_STYLE = {
    confirmed: "bg-emerald-100 text-emerald-700",
    pending:   "bg-amber-100 text-amber-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-gray-200 text-gray-700",
};
function StatusPill({ status }) {
    if (! status) return null;
    return (
        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_PILL_STYLE[status] || 'bg-gray-100 text-gray-600'} flex-shrink-0`}>
            {status}
        </span>
    );
}

const AI_PILL = {
    completed:  { color: "bg-emerald-100 text-emerald-700", label: "Done" },
    processing: { color: "bg-blue-100 text-blue-700",       label: "Analyzing" },
    failed:     { color: "bg-red-100 text-red-700",         label: "Failed" },
};
function AiStatusPill({ status }) {
    const cfg = AI_PILL[status];
    if (! cfg) return null;
    return (
        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${cfg.color} flex-shrink-0 inline-flex items-center gap-0.5`}>
            <Sparkles size={9} /> {cfg.label}
        </span>
    );
}
