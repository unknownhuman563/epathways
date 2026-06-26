import { Head, Link } from "@inertiajs/react";
import {
    Globe, ClipboardCheck, Calendar, FolderOpen, FileBadge, AlertTriangle,
    CheckCircle2, Clock, TrendingUp, Star, ShieldCheck, FileCheck2, User,
} from "lucide-react";

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function ImmigrationDashboard({
    tiles = {}, pipeline = [], inz_aging = null, iaa = null,
    monthly = [], urgent = {}, week_appointments = [],
    recent_intakes = [], recent_reviews = [],
}) {
    const tileSpecs = [
        { label: "My active cases",       value: tiles.active_cases,              tone: "default", icon: <Globe size={14} />,           hint: "Visa cases in motion", href: "/portal/immigration/cases" },
        { label: "Visa assessments / wk", value: tiles.new_assessments_week,      tone: "default", icon: <ClipboardCheck size={14} />,  hint: "Public submissions to triage", href: "/portal/immigration/assessments" },
        { label: "Paid, not yet seen",    value: tiles.bookings_paid_unseen,      tone: "warning", icon: <Calendar size={14} />,        hint: "Bookings without a slot", href: "/portal/immigration/appointments" },
        { label: "Docs pending review",   value: tiles.docs_pending_review,       tone: "warning", icon: <FolderOpen size={14} />,      hint: "Across all my cases", href: "/portal/immigration/documents" },
        { label: "Lodged with INZ",       value: tiles.cases_lodged,              tone: "default", icon: <FileBadge size={14} />,       hint: "Needs lodgement tracking", muted: tiles.cases_lodged == null },
        { label: "INZ info requests",     value: tiles.info_requests_outstanding, tone: "danger",  icon: <AlertTriangle size={14} />,   hint: "Needs info-request tracking", muted: tiles.info_requests_outstanding == null },
    ];

    const maxPipeline = Math.max(1, ...pipeline.map((p) => p.count || 0));
    const maxMonth    = Math.max(1, ...monthly.map((m) => m.intakes || 0));

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            <Head title="Immigration Dashboard" />

            {/* Top tiles */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {tileSpecs.map((t, i) => <TopTile key={i} {...t} />)}
            </div>

            {/* Two-column: visa-case pipeline + INZ pipeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Visa case pipeline */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
                    <div className="flex items-baseline justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Visa case pipeline</h2>
                            <p className="text-[12px] text-gray-500 mt-0.5">Current count of leads in visa-touching stages.</p>
                        </div>
                    </div>
                    <ul className="space-y-3">
                        {pipeline.map((p) => (
                            <li key={p.stage} className="flex items-center gap-3">
                                <span className="w-44 truncate text-[12px] font-semibold text-gray-700">{p.stage}</span>
                                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${(p.count / maxPipeline) * 100}%` }} />
                                </div>
                                <span className="w-10 text-right text-sm font-bold text-gray-800 tabular-nums">{p.count}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* INZ pipeline — real lodgement aging */}
                <InzPipelineCard aging={inz_aging} />
            </div>

            {/* Urgent actions */}
            <section className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-gray-800">Urgent actions</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <UrgentTile label="Visa assessments to review" value={urgent.assessments_pending ?? 0} href="/portal/immigration/assessments" tone="amber" />
                    <UrgentTile label="Paid, not scheduled"   value={urgent.paid_unscheduled ?? 0}    href="/portal/immigration/appointments" tone="orange" />
                    <UrgentTile label="Docs rejected"         value={urgent.rejected_docs ?? 0}       href="/portal/immigration/documents"    tone="rose" />
                    <UrgentTile label="Agreements pending"    value={urgent.agreements_pending ?? 0}  href="/portal/immigration/cases"        tone="violet" />
                </div>
            </section>

            {/* Two-column: this week's appointments + IAA compliance stub */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <section className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-blue-600" />
                            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-gray-800">This week's appointments</h2>
                        </div>
                        <Link href="/portal/immigration/appointments" className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:underline">
                            View all
                        </Link>
                    </div>
                    {week_appointments.length === 0 ? (
                        <p className="text-sm text-gray-400 italic text-center py-6">No appointments this week.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {week_appointments.map((a) => (
                                <li key={a.id} className="py-3 flex items-center gap-3">
                                    <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{a.name}</p>
                                        <p className="text-[11px] text-gray-500">
                                            {a.service_type || 'Consultation'} · {fmtDate(a.appointment_date)}{a.appointment_time && ` · ${a.appointment_time}`}
                                            {a.consultant_name && ` · ${a.consultant_name}`}
                                        </p>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                        a.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700'
                                            : a.status === 'Cancelled' ? 'bg-rose-100 text-rose-700'
                                                : 'bg-amber-100 text-amber-700'
                                    }`}>{a.status}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* IAA compliance — real, scoped to the current user. */}
                <IaaComplianceCard iaa={iaa} />
            </div>

            {/* 6-month trend (kept from old dashboard) */}
            <section className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={14} className="text-amber-600" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-gray-800">Public assessment intakes — last 6 months</h2>
                </div>
                <div className="h-48 flex items-end gap-3">
                    {monthly.length === 0 ? (
                        <p className="text-sm text-gray-400">No data yet.</p>
                    ) : monthly.map((m, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                            <span className="text-xs font-semibold text-gray-600">{m.intakes}</span>
                            <div className="w-full rounded-t-xl bg-amber-500" style={{ height: `${Math.max(4, Math.round(((m.intakes || 0) / maxMonth) * 100))}%` }} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{m.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Recent public submissions — kept as a compact strip */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <RecentList title="Recent visa assessments" icon={<ClipboardCheck size={14} />} href="/portal/immigration/assessments" rows={recent_intakes.map((r) => ({
                    id: r.id,
                    title: trim2(`${r.first_name} ${r.last_name}`),
                    subtitle: `${r.current_visa_type || 'Visa enquiry'} · ${fmtDate(r.created_at)}`,
                    badge: r.status,
                }))} />
                <RecentList title="Recent user reviews" icon={<Star size={14} />} href="#" rows={recent_reviews.map((r) => ({
                    id: r.id,
                    title: r.name || 'Anonymous',
                    subtitle: `${r.mode || 'Migration review'} · ${fmtDate(r.created_at)}`,
                    badge: r.status,
                }))} />
            </div>
        </div>
    );
}

function TopTile({ label, value, tone, icon, hint, muted = false, href = null }) {
    const TONES = {
        default: { ring: "border-gray-100",   glyph: "bg-gray-100 text-gray-600",     num: "text-gray-900" },
        warning: { ring: "border-amber-200",  glyph: "bg-amber-100 text-amber-700",   num: "text-amber-700" },
        danger:  { ring: "border-rose-200",   glyph: "bg-rose-100 text-rose-700",     num: "text-rose-700" },
    };
    const t = TONES[tone] || TONES.default;

    const inner = (
        <>
            <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">{label}</p>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${t.glyph}`}>{icon}</span>
            </div>
            <p className={`text-3xl font-bold tabular-nums ${t.num}`}>{value ?? "—"}</p>
            <p className="text-[10px] text-gray-400 mt-1 italic">{hint}</p>
        </>
    );

    const cls = `bg-white rounded-2xl border ${t.ring} p-4 transition-shadow ${muted ? "opacity-60" : "hover:shadow-md"} ${href && !muted ? "cursor-pointer" : ""}`;

    return href && !muted
        ? <Link href={href} className={`block ${cls}`}>{inner}</Link>
        : <div className={cls}>{inner}</div>;
}

function UrgentTile({ label, value, href, tone }) {
    const TONES = {
        amber:  { num: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
        orange: { num: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
        rose:   { num: "text-rose-700",   bg: "bg-rose-50 border-rose-200" },
        violet: { num: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
    };
    const t = TONES[tone];
    return (
        <Link href={href} className={`block rounded-xl border ${t.bg} p-4 hover:shadow-md transition-shadow`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">{label}</p>
            <p className={`text-2xl font-bold tabular-nums mt-1 ${t.num}`}>{value}</p>
        </Link>
    );
}

function RecentList({ title, icon, href, rows }) {
    return (
        <section className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-gray-800">{title}</h3>
                </div>
                {href !== "#" && (
                    <Link href={href} className="text-[10px] font-bold uppercase tracking-widest text-amber-600 hover:underline">
                        View all
                    </Link>
                )}
            </div>
            {rows.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4">Nothing yet.</p>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {rows.map((r) => (
                        <li key={r.id} className="py-2.5 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                                <p className="text-[11px] text-gray-500">{r.subtitle}</p>
                            </div>
                            {r.badge && (
                                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                                    {r.badge}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function trim2(s) { return (s || '').trim() || 'Unknown'; }

// Real INZ pipeline — counts + worst-aging cases. Green/amber/red driven
// by visa-type expected processing windows (from visa_types seed).
function InzPipelineCard({ aging }) {
    const data = aging || { green: 0, amber: 0, red: 0, rows: [] };
    const total = data.green + data.amber + data.red;
    const max = Math.max(1, data.green, data.amber, data.red);

    if (total === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-2 text-gray-500">
                    <FileBadge size={14} />
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em]">INZ pipeline</p>
                </div>
                <p className="text-sm font-bold text-gray-800 leading-snug">Nothing lodged with INZ</p>
                <p className="text-[11px] text-gray-500 mt-2">
                    Cases with INZ status Lodged / Decision Pending / Info Requested appear here, bucketed by lodgement age vs the visa type's expected window.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-gray-500">
                    <FileBadge size={14} />
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em]">INZ pipeline</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 tabular-nums">{total} cases</span>
            </div>

            <ul className="space-y-2 mb-4">
                <BucketRow label="On track"     value={data.green} max={max} color="bg-emerald-500" />
                <BucketRow label="Approaching"  value={data.amber} max={max} color="bg-amber-500" />
                <BucketRow label="Exceeded"     value={data.red}   max={max} color="bg-rose-500" />
            </ul>

            {data.rows.length > 0 && (
                <>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 mb-1.5">Worst aging</p>
                    <ul className="space-y-1">
                        {data.rows.slice(0, 3).map((r) => (
                            <li key={r.id} className="text-[11px] flex items-center justify-between gap-2">
                                <span className="truncate text-gray-700">{r.name}</span>
                                <span className={`tabular-nums font-bold ${r.bucket === 'red' ? 'text-rose-700' : r.bucket === 'amber' ? 'text-amber-700' : 'text-emerald-700'}`}>
                                    {r.days_since}d / {r.expected_days}d
                                </span>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}

function BucketRow({ label, value, max, color }) {
    return (
        <li className="flex items-center gap-3">
            <span className="w-24 text-[11px] font-semibold text-gray-700">{label}</span>
            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${(value / max) * 100}%` }} />
            </div>
            <span className="w-8 text-right text-sm font-bold tabular-nums text-gray-700">{value}</span>
        </li>
    );
}

// Real IAA compliance — scoped to the current adviser.
function IaaComplianceCard({ iaa }) {
    if (!iaa) return null;

    const STATUS_META = {
        ok:        { tone: "bg-emerald-50 border-emerald-200 text-emerald-700", icon: <CheckCircle2 size={14} />, label: "Licence current",     hint: "expiry is over 60 days away" },
        expiring:  { tone: "bg-amber-50 border-amber-200 text-amber-700",       icon: <Clock size={14} />,        label: "Licence expiring soon", hint: "renew before the date below" },
        expired:   { tone: "bg-rose-50 border-rose-200 text-rose-700",          icon: <AlertTriangle size={14} />,label: "Licence expired",      hint: "no client advice allowed until renewed" },
        no_expiry: { tone: "bg-amber-50 border-amber-200 text-amber-700",       icon: <AlertTriangle size={14} />,label: "Expiry missing",       hint: "add the expiry date in your profile" },
        missing:   { tone: "bg-rose-50 border-rose-200 text-rose-700",          icon: <AlertTriangle size={14} />,label: "IAA licence not on file", hint: "you'll need this on every case" },
    };
    const meta = STATUS_META[iaa.status] || STATUS_META.missing;

    return (
        <section className={`rounded-2xl border p-5 flex flex-col ${meta.tone.split(' ').slice(0,2).join(' ')}`}>
            <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={14} />
                <p className="text-[10px] font-bold uppercase tracking-[0.22em]">Compliance</p>
            </div>
            <p className={`text-sm font-bold leading-snug inline-flex items-center gap-1.5 ${meta.tone.split(' ')[2]}`}>
                {meta.icon} {meta.label}
            </p>
            <p className="text-[11px] text-gray-600 mt-2 italic">{meta.hint}</p>

            <dl className="mt-4 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                    <dt className="text-gray-500">IAA licence #</dt>
                    <dd className="font-mono font-semibold text-gray-800">{iaa.licence_number || '—'}</dd>
                </div>
                <div className="flex items-center justify-between">
                    <dt className="text-gray-500">Expires</dt>
                    <dd className="font-semibold tabular-nums text-gray-800">
                        {iaa.expiry ? new Date(iaa.expiry + 'T00:00:00').toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }) : '—'}
                    </dd>
                </div>
                {iaa.days_to_expiry != null && (
                    <div className="flex items-center justify-between">
                        <dt className="text-gray-500">Days remaining</dt>
                        <dd className={`font-bold tabular-nums ${iaa.days_to_expiry < 0 ? "text-rose-700" : iaa.days_to_expiry <= 60 ? "text-amber-700" : "text-emerald-700"}`}>
                            {iaa.days_to_expiry}
                        </dd>
                    </div>
                )}
            </dl>

            <a href="/portal/immigration/profile" className="mt-4 text-[10px] font-bold uppercase tracking-widest text-gray-700 hover:text-gray-900 underline">
                Update in profile →
            </a>
        </section>
    );
}
