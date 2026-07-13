import { Head, router } from "@inertiajs/react";
import {
    Layers, FolderOpen, Clock, CheckCircle2, XCircle, TrendingUp,
    UserPlus, Handshake, Plane, ThumbsUp, FileText, Download, Share2, Lock,
} from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";

const PERIODS = [
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
    { key: "quarterly", label: "Quarterly" },
    { key: "custom", label: "Custom" },
];

// Muted, system-native palette: white + dark grey with an emerald accent.
const stageColor = (stage) =>
    stage === "Approved Visa" ? "bg-emerald-500"
        : stage === "Decline Visa" ? "bg-rose-400"
        : stage === "Unassigned" ? "bg-gray-300"
        : "bg-gray-700";

export default function ImmigrationReports({
    period = "weekly", kpis = {}, weekly = {}, stageDistribution = [], totalCases = 0,
    documents = {}, trend = [], ytd = {}, generated_at, generated_by,
}) {
    const setPeriod = (next) => router.get("/portal/immigration/reports", { period: next }, { preserveScroll: true });
    const maxStage = Math.max(1, ...stageDistribution.map((s) => s.count || 0));
    const maxDay = Math.max(1, ...(documents.by_day || []).map((d) => d.count || 0));

    return (
        <div className="space-y-5 max-w-[1180px] mx-auto pb-14">
            <Head title="Reports — Immigration" />
            <PortalPageHeader eyebrow="Reports" title="Reports" description="Caseload by stage, documents submitted, and INZ outcomes — this week and year to date." />

            {/* Period tabs + actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                    {PERIODS.map((p) => (
                        <button
                            key={p.key}
                            type="button"
                            onClick={() => setPeriod(p.key)}
                            className={`px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors ${
                                period === p.key ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
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

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Kpi icon={<Layers size={16} />} label="Active cases" value={kpis.active_cases ?? 0} />
                <Kpi icon={<Clock size={16} />} label="With INZ" value={kpis.with_inz ?? 0} hint="awaiting decision" />
                <Kpi icon={<FolderOpen size={16} />} label="Docs pending review" value={kpis.docs_pending ?? 0} />
                <Kpi icon={<TrendingUp size={16} />} label="Approval rate" value={`${kpis.approval_rate ?? 0}%`} accent />
            </div>

            {/* Trend — new cases vs approvals over 6 months */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                    <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
                            <TrendingUp size={15} />
                        </span>
                        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-800">New cases vs approvals — 6 months</h2>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-gray-500">
                        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-700" /> New cases</span>
                        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Visas approved</span>
                    </div>
                </div>
                <TrendChart data={trend} />
            </section>

            {/* Cases by stage — primary focus */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
                            <Layers size={15} />
                        </span>
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
                                    <div
                                        className={`h-full rounded-md ${stageColor(s.stage)} transition-all`}
                                        style={{ width: `${Math.max(s.count > 0 ? 4 : 0, Math.round((s.count / maxStage) * 100))}%` }}
                                    />
                                </div>
                                <span className="w-10 text-right text-sm font-bold text-gray-900 tabular-nums">{s.count}</span>
                                <span className="w-9 text-right text-[11px] text-gray-400 tabular-nums">{pct}%</span>
                            </li>
                        );
                    })}
                </ul>
            </section>

            {/* Documents this week + weekly activity */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
                {/* Documents submitted this week */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                    <div className="flex items-center gap-2.5 mb-4">
                        <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <FileText size={15} />
                        </span>
                        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-800">Documents submitted this week</h2>
                    </div>

                    <div className="flex items-end gap-6 flex-wrap">
                        <div>
                            <p className="text-5xl font-bold text-gray-900 tabular-nums leading-none">{documents.total ?? 0}</p>
                            <p className="text-[11px] text-gray-400 mt-1.5">uploaded since Monday</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Chip tone="emerald" label="Approved" value={documents.approved ?? 0} />
                            <Chip tone="amber" label="Pending" value={documents.pending ?? 0} />
                            <Chip tone="rose" label="Rejected" value={documents.rejected ?? 0} />
                        </div>
                    </div>

                    {/* 7-day mini bars */}
                    <div className="mt-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-300 mb-2">By day</p>
                        <div className="flex items-end gap-2 h-24">
                            {(documents.by_day || []).map((d, i) => {
                                const h = d.count > 0 ? Math.max(6, Math.round((d.count / maxDay) * 100)) : 0;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                                        <span className="text-[10px] font-semibold text-gray-500 tabular-nums mb-1">{d.count || ""}</span>
                                        <div className="w-full rounded-t bg-emerald-500 transition-all" style={{ height: `${h}%` }} />
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex gap-2 mt-1.5">
                            {(documents.by_day || []).map((d, i) => (
                                <span key={i} className="flex-1 text-center text-[10px] text-gray-400">{d.label}</span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* This week's activity */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                    <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-800 mb-4">This week&apos;s activity</h2>
                    <ul className="divide-y divide-gray-50">
                        <ActivityRow icon={<UserPlus size={15} />} label="New clients onboarded" value={weekly.new_clients ?? 0} />
                        <ActivityRow icon={<Handshake size={15} />} label="Service agreements signed" value={weekly.agreements_signed ?? 0} />
                        <ActivityRow icon={<Plane size={15} />} label="Visa applications lodged" value={weekly.apps_lodged ?? 0} />
                        <ActivityRow icon={<ThumbsUp size={15} />} label="Visas approved" value={weekly.visas_approved ?? 0} accent />
                    </ul>
                </section>
            </div>

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
                        {/* Funnel */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Outcome label="Endorsed" value={ytd.endorsed ?? 0} icon={<CheckCircle2 size={16} />} />
                            <Outcome label="Visas lodged" value={ytd.lodged ?? 0} icon={<Plane size={16} />} />
                            <Outcome label="Approved" value={ytd.approved ?? 0} icon={<ThumbsUp size={16} />} tone="emerald" />
                            <Outcome label="Declined" value={ytd.declined ?? 0} icon={<XCircle size={16} />} tone="rose" />
                        </div>

                        {/* Approval bar */}
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

                    {/* Donut — decided applications */}
                    <div className="flex flex-col items-center justify-center border-l border-gray-100 lg:pl-6">
                        <Donut pct={ytd.approval_rate ?? 0} />
                        <p className="text-[11px] text-gray-400 mt-2 text-center">
                            {ytd.approved ?? 0} of {ytd.decided ?? 0} decided approved
                        </p>
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

function Chip({ tone, label, value }) {
    const map = {
        emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
        amber: "bg-amber-50 text-amber-700 ring-amber-100",
        rose: "bg-rose-50 text-rose-700 ring-rose-100",
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold ring-1 ${map[tone]}`}>
            {label} <span className="tabular-nums font-bold">{value}</span>
        </span>
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
