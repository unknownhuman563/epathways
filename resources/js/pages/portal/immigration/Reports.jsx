import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    Layers, Clock, CheckCircle2, XCircle, TrendingUp,
    UserPlus, Handshake, Plane, ThumbsUp, Download, Share2, Lock,
    AlertTriangle, ArrowRight, Users, CalendarRange,
} from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";

const PRESETS = [
    { key: "two_weeks", label: "Last 2 weeks" },
    { key: "this_month", label: "This month" },
    { key: "last_month", label: "Last month" },
    { key: "quarter", label: "Last 3 months" },
    { key: "custom", label: "Custom" },
];

const stageColor = (stage) =>
    stage === "Approved Visa" ? "bg-emerald-500"
        : stage === "Decline Visa" ? "bg-rose-400"
        : stage === "Unassigned" ? "bg-gray-300"
        : "bg-gray-700";

const SEV = {
    high:   { dot: "bg-rose-500", chip: "bg-rose-50 text-rose-700 border-rose-200", label: "High" },
    medium: { dot: "bg-amber-500", chip: "bg-amber-50 text-amber-700 border-amber-200", label: "Medium" },
    low:    { dot: "bg-gray-400", chip: "bg-gray-50 text-gray-600 border-gray-200", label: "Low" },
};

export default function ImmigrationReports({
    range = { preset: "two_weeks", label: "Last 2 weeks" }, kpis = {}, activity = {},
    stageDistribution = [], totalCases = 0, trend = [], ytd = {},
    attention = [], workload = [], generated_at, generated_by,
}) {
    const [from, setFrom] = useState(range.from || "");
    const [to, setTo] = useState(range.to || "");

    const go = (params) => router.get("/portal/immigration/reports", params, { preserveScroll: true, preserveState: true });
    const setPreset = (preset) => (preset === "custom" ? go({ preset: "custom", from, to }) : go({ preset }));
    const applyCustom = () => go({ preset: "custom", from, to });

    const maxStage = Math.max(1, ...stageDistribution.map((s) => s.count || 0));
    const maxWorkload = Math.max(1, ...workload.map((w) => w.count || 0));
    const attnHigh = attention.filter((a) => a.severity === "high").length;

    return (
        <div className="space-y-5 max-w-[1180px] mx-auto pb-14">
            <Head title="Analytics — Immigration" />
            <PortalPageHeader eyebrow="Analytics" title="Immigration analytics" description="Caseload health, what needs attention, and outcomes — for the period you choose." />

            {/* Range control + actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1 flex-wrap">
                    {PRESETS.map((p) => (
                        <button
                            key={p.key}
                            type="button"
                            onClick={() => setPreset(p.key)}
                            className={`px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors ${
                                range.preset === p.key ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <DisabledAction icon={<Download size={13} />} label="Export PDF" />
                    <DisabledAction icon={<Share2 size={13} />} label="Share" />
                </div>
            </div>

            {/* Custom range inputs — only when Custom is active */}
            {range.preset === "custom" && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 inline-flex items-center gap-1.5"><CalendarRange size={13} /> From</span>
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">To</span>
                    <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm" />
                    <button type="button" onClick={applyCustom} className="px-3.5 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-black">Apply</button>
                </div>
            )}

            {/* Showing-period line */}
            <p className="text-[11px] text-gray-400 px-1 -mt-1">
                Showing <span className="font-semibold text-gray-600">{range.label}</span>
                {range.days ? <span className="text-gray-300"> · {range.days} days</span> : null}
            </p>

            {/* ── NEEDS ATTENTION — the headline ── */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"><AlertTriangle size={15} /></span>
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-800">Needs attention</h2>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                {attention.length === 0 ? "Nothing flagged" : <><span className="font-semibold text-gray-600 tabular-nums">{attention.length}</span> case{attention.length === 1 ? "" : "s"} to chase{attnHigh > 0 && <> · <span className="text-rose-600 font-semibold">{attnHigh} high priority</span></>}</>}
                            </p>
                        </div>
                    </div>
                </div>

                {attention.length === 0 ? (
                    <div className="px-5 py-8 text-sm text-emerald-700 flex items-center gap-2">
                        <CheckCircle2 size={16} /> Nothing needs attention right now — the active caseload is clean.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/60 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="px-5 py-2.5 w-6"></th>
                                    <th className="px-3 py-2.5">Case</th>
                                    <th className="px-3 py-2.5">Stage</th>
                                    <th className="px-3 py-2.5">Owner</th>
                                    <th className="px-3 py-2.5">Idle</th>
                                    <th className="px-3 py-2.5">Why</th>
                                    <th className="px-3 py-2.5 text-right pr-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {attention.map((a) => {
                                    const sev = SEV[a.severity] || SEV.low;
                                    return (
                                        <tr key={a.id} className="text-sm hover:bg-gray-50/40">
                                            <td className="px-5 py-3"><span className={`block w-2 h-2 rounded-full ${sev.dot}`} title={sev.label} /></td>
                                            <td className="px-3 py-3 font-semibold text-gray-900">{a.name}</td>
                                            <td className="px-3 py-3 text-[12px] text-gray-600">{a.stage || <span className="text-gray-300">—</span>}</td>
                                            <td className="px-3 py-3 text-[12px] text-gray-600">{a.owner || <span className="text-amber-600 font-medium">Unassigned</span>}</td>
                                            <td className="px-3 py-3 text-[12px] text-gray-500 tabular-nums">{a.idle_days != null ? `${a.idle_days}d` : "—"}</td>
                                            <td className="px-3 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {a.reasons.map((r, i) => (
                                                        <span key={i} className={`inline-block text-[10.5px] font-medium px-1.5 py-0.5 rounded border ${sev.chip}`}>{r}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-right pr-5">
                                                <Link href={a.link} className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 hover:text-gray-900">
                                                    Open <ArrowRight size={12} />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Kpi icon={<Layers size={16} />} label="Active cases" value={kpis.active_cases ?? 0} hint="excludes decided" />
                <Kpi icon={<Clock size={16} />} label="With INZ" value={kpis.with_inz ?? 0} hint="awaiting decision" />
                <Kpi icon={<AlertTriangle size={16} />} label="Needs attention" value={attention.length} hint="cases to chase" />
                <Kpi icon={<TrendingUp size={16} />} label="Approval rate" value={`${kpis.approval_rate ?? 0}%`} accent />
            </div>

            {/* Activity in period + adviser workload */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                    <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-800 mb-4">Activity — {range.label?.toLowerCase()}</h2>
                    <ul className="divide-y divide-gray-50">
                        <ActivityRow icon={<UserPlus size={15} />} label="New clients onboarded" value={activity.new_clients ?? 0} />
                        <ActivityRow icon={<CheckCircle2 size={15} />} label="Files endorsed" value={activity.files_endorsed ?? 0} />
                        <ActivityRow icon={<Handshake size={15} />} label="Agreements signed" value={activity.agreements_signed ?? 0} />
                        <ActivityRow icon={<Plane size={15} />} label="Applications lodged" value={activity.apps_lodged ?? 0} />
                        <ActivityRow icon={<ThumbsUp size={15} />} label="Visas approved" value={activity.visas_approved ?? 0} accent />
                        <ActivityRow icon={<XCircle size={15} />} label="Visas declined" value={activity.visas_declined ?? 0} />
                    </ul>
                </section>

                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                    <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-800 mb-4 inline-flex items-center gap-2"><Users size={15} className="text-gray-400" /> Adviser workload</h2>
                    {workload.length === 0 ? (
                        <p className="text-sm text-gray-400 py-6 text-center">No active cases assigned.</p>
                    ) : (
                        <ul className="space-y-2.5">
                            {workload.map((w) => (
                                <li key={w.owner} className="flex items-center gap-3">
                                    <span className="w-32 text-[12px] font-medium text-gray-700 truncate flex-shrink-0">{w.owner}</span>
                                    <div className="flex-1 h-5 rounded-md bg-gray-50 overflow-hidden">
                                        <div className={`h-full rounded-md ${w.owner === "Unassigned" ? "bg-amber-400" : "bg-gray-700"}`} style={{ width: `${Math.max(4, Math.round((w.count / maxWorkload) * 100))}%` }} />
                                    </div>
                                    <span className="w-8 text-right text-sm font-bold text-gray-900 tabular-nums">{w.count}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            {/* Trend — new cases vs approvals over 6 months */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                    <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center"><TrendingUp size={15} /></span>
                        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-800">New cases vs approvals — 6 months</h2>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-gray-500">
                        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-700" /> New cases</span>
                        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Visas approved</span>
                    </div>
                </div>
                <TrendChart data={trend} />
            </section>

            {/* Cases by stage */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center"><Layers size={15} /></span>
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-800">Cases by stage</h2>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                <span className="font-semibold text-gray-600 tabular-nums">{totalCases}</span> immigration cases across the pipeline
                            </p>
                        </div>
                    </div>
                </div>
                <ul className="space-y-2.5">
                    {stageDistribution.map((s) => {
                        const pct = totalCases > 0 ? Math.round((s.count / totalCases) * 100) : 0;
                        return (
                            <li key={s.stage} className="flex items-center gap-3">
                                <span className="w-40 sm:w-48 text-[12px] font-medium text-gray-700 truncate flex-shrink-0">{s.stage}</span>
                                <div className="flex-1 h-5 rounded-md bg-gray-50 overflow-hidden">
                                    <div className={`h-full rounded-md ${stageColor(s.stage)} transition-all`} style={{ width: `${Math.max(s.count > 0 ? 4 : 0, Math.round((s.count / maxStage) * 100))}%` }} />
                                </div>
                                <span className="w-10 text-right text-sm font-bold text-gray-900 tabular-nums">{s.count}</span>
                                <span className="w-9 text-right text-[11px] text-gray-400 tabular-nums">{pct}%</span>
                            </li>
                        );
                    })}
                </ul>
            </section>

            {/* Year-to-date outcomes */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                    <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-800">Year-to-date outcomes</h2>
                    <span className="text-[11px] text-gray-400">
                        Approval rate <span className="font-bold text-emerald-600 tabular-nums text-sm">{ytd.approval_rate ?? 0}%</span>
                        <span className="text-gray-300"> · {ytd.approved ?? 0} of {ytd.decided ?? 0} decided</span>
                    </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6 items-center">
                    <div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Outcome label="Endorsed" value={ytd.endorsed ?? 0} icon={<CheckCircle2 size={16} />} />
                            <Outcome label="Visas lodged" value={ytd.lodged ?? 0} icon={<Plane size={16} />} />
                            <Outcome label="Approved" value={ytd.approved ?? 0} icon={<ThumbsUp size={16} />} tone="emerald" />
                            <Outcome label="Declined" value={ytd.declined ?? 0} icon={<XCircle size={16} />} tone="rose" />
                        </div>
                        <div className="mt-5">
                            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5">
                                <span>{ytd.approved ?? 0} approved</span>
                                <span>{ytd.declined ?? 0} declined</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden flex">
                                <div className="h-full bg-emerald-500" style={{ width: `${ytd.approval_rate ?? 0}%` }} />
                                <div className="h-full bg-rose-400" style={{ width: `${100 - (ytd.approval_rate ?? 0)}%` }} />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center border-l border-gray-100 lg:pl-6">
                        <Donut pct={ytd.approval_rate ?? 0} />
                        <p className="text-[11px] text-gray-400 mt-2 text-center">{ytd.approved ?? 0} of {ytd.decided ?? 0} decided approved</p>
                    </div>
                </div>
            </section>

            <footer className="text-[11px] text-gray-400 flex items-center gap-4 flex-wrap px-1">
                <span>Generated {new Date(generated_at || Date.now()).toLocaleString("en-NZ", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                {generated_by && <span>by <span className="font-semibold text-gray-600">{generated_by}</span></span>}
            </footer>
        </div>
    );
}

// ── Sub-components ──────────────────────────────────────────────────────

function Kpi({ icon, label, value, hint, accent = false }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 text-gray-400">
                <span className={`w-6 h-6 rounded-md flex items-center justify-center ${accent ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>{icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.16em]">{label}</span>
            </div>
            <p className={`text-3xl font-bold tabular-nums mt-2.5 ${accent ? "text-emerald-600" : "text-gray-900"}`}>{value}</p>
            {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
        </div>
    );
}

function ActivityRow({ icon, label, value, accent = false }) {
    return (
        <li className="flex items-center gap-3 py-2.5">
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${accent ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>{icon}</span>
            <span className="flex-1 text-[13px] text-gray-700">{label}</span>
            <span className={`text-lg font-bold tabular-nums ${accent ? "text-emerald-600" : "text-gray-900"}`}>{value}</span>
        </li>
    );
}

function Outcome({ label, value, icon, tone = "gray" }) {
    const iconTone = tone === "emerald" ? "bg-emerald-50 text-emerald-600" : tone === "rose" ? "bg-rose-50 text-rose-500" : "bg-gray-100 text-gray-500";
    const valueTone = tone === "emerald" ? "text-emerald-600" : tone === "rose" ? "text-rose-500" : "text-gray-900";
    return (
        <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4">
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconTone}`}>{icon}</span>
            <p className={`text-2xl font-bold tabular-nums mt-3 ${valueTone}`}>{value}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
        </div>
    );
}

function TrendChart({ data = [] }) {
    if (!data.length) return <p className="text-sm text-gray-400 py-8 text-center">No trend data yet.</p>;

    const W = 720, H = 200, padX = 34, padTop = 16, padBottom = 28;
    const chartW = W - padX * 2;
    const chartH = H - padTop - padBottom;
    const baseY = padTop + chartH;
    const peak = Math.max(1, ...data.flatMap((d) => [d.new_cases || 0, d.approved || 0]));

    const xFor = (i) => padX + (i / Math.max(1, data.length - 1)) * chartW;
    const yFor = (n) => padTop + (1 - n / peak) * chartH;
    const line = (key) => data.map((d, i) => `${xFor(i)},${yFor(d[key] || 0)}`).join(" ");
    const area = (key) =>
        `M${xFor(0)},${baseY} L` + data.map((d, i) => `${xFor(i)},${yFor(d[key] || 0)}`).join(" L") + ` L${xFor(data.length - 1)},${baseY} Z`;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 220 }} role="img" aria-label="New cases vs approvals trend">
            {[0, 0.5, 1].map((t, i) => (
                <line key={i} x1={padX} x2={W - padX} y1={padTop + (1 - t) * chartH} y2={padTop + (1 - t) * chartH} stroke="#f1f5f9" strokeWidth="1" />
            ))}
            <defs>
                <linearGradient id="rep-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={area("approved")} fill="url(#rep-area)" />
            <polyline points={line("new_cases")} fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4" />
            <polyline points={line("approved")} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {data.map((d, i) => (
                <g key={i}>
                    <circle cx={xFor(i)} cy={yFor(d.approved || 0)} r="3.5" fill="white" stroke="#10b981" strokeWidth="2" />
                    <text x={xFor(i)} y={baseY + 18} textAnchor="middle" fontSize="10" fontWeight="600" fill="#94a3b8">{d.label}</text>
                </g>
            ))}
        </svg>
    );
}

function Donut({ pct }) {
    const r = 54;
    const c = 2 * Math.PI * r;
    const dash = (c * Math.min(100, Math.max(0, pct))) / 100;
    return (
        <svg viewBox="0 0 140 140" className="w-36 h-36">
            <circle cx="70" cy="70" r={r} fill="none" stroke="#fecdd3" strokeWidth="14" />
            <circle
                cx="70" cy="70" r={r} fill="none" stroke="#10b981" strokeWidth="14" strokeLinecap="round"
                strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={c / 4} transform="rotate(-90 70 70)"
            />
            <text x="70" y="68" textAnchor="middle" fontSize="26" fontWeight="700" fill="#111827">{pct}%</text>
            <text x="70" y="86" textAnchor="middle" fontSize="8" letterSpacing="1.5" fontWeight="700" fill="#9ca3af">APPROVAL</text>
        </svg>
    );
}

function DisabledAction({ icon, label }) {
    return (
        <button type="button" disabled title="Coming soon" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 border border-gray-200 cursor-not-allowed">
            <Lock size={11} /> {icon} {label}
        </button>
    );
}
