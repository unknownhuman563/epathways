import { Head, Link } from "@inertiajs/react";
import {
    FileText, Sparkles, TrendingUp, TrendingDown, FileCheck2,
    Star, ArrowUpRight,
} from "lucide-react";

const STATUS_STYLES = {
    New:        "bg-blue-100 text-blue-700 border-blue-200",
    "In Review":"bg-amber-100 text-amber-700 border-amber-200",
    Engaged:    "bg-emerald-100 text-emerald-700 border-emerald-200",
    Archived:   "bg-gray-100 text-gray-600 border-gray-200",
};
const statusClass = (s) => STATUS_STYLES[s] || "bg-gray-100 text-gray-700 border-gray-200";

const STATUS_BAR_COLORS = {
    New:        "bg-blue-500",
    "In Review":"bg-amber-500",
    Engaged:    "bg-emerald-500",
    Archived:   "bg-gray-400",
};

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function ImmigrationDashboard({
    stats = {},
    status_breakdown = [],
    monthly = [],
    recent_intakes = [],
    recent_reviews = [],
}) {
    const monthDelta = (() => {
        const len = monthly.length;
        if (len < 2) return 0;
        return (monthly[len - 1].intakes || 0) - (monthly[len - 2].intakes || 0);
    })();
    const maxMonth = Math.max(1, ...monthly.map((m) => m.intakes || 0));
    const statusTotal = status_breakdown.reduce((n, s) => n + (s.count || 0), 0);

    const cards = [
        {
            label: "Total intakes",
            value: stats.total_intakes ?? 0,
            icon: <FileText className="w-5 h-5" />,
            dark: true,
            foot: (
                <span className={`inline-flex items-center gap-1 text-xs font-semibold ${monthDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {monthDelta >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {monthDelta >= 0 ? "+" : ""}{monthDelta} vs last month
                </span>
            ),
        },
        {
            label: "New intakes",
            value: status_breakdown.find((s) => s.status === "New")?.count ?? 0,
            icon: <Sparkles className="w-5 h-5" />,
            foot: <span className="text-xs text-gray-400">awaiting adviser review</span>,
        },
        {
            label: "With documents",
            value: stats.intakes_with_files ?? 0,
            icon: <FileCheck2 className="w-5 h-5" />,
            foot: <span className="text-xs text-gray-400">PDFs uploaded by applicants</span>,
        },
        {
            label: "User reviews",
            value: stats.total_reviews ?? 0,
            icon: <Star className="w-5 h-5" />,
            foot: <span className="text-xs text-gray-400">{stats.reviews_this_month ?? 0} this month</span>,
        },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <Head title="Immigration Dashboard" />

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((c, i) => (
                    <div key={i} className={`p-6 rounded-3xl ${c.dark ? "bg-gray-900 text-white shadow-lg" : "bg-white text-gray-900 border border-gray-50 shadow-sm"}`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className={`text-sm font-medium ${c.dark ? "text-gray-300" : "text-gray-500"}`}>{c.label}</span>
                            <span className={`p-1.5 rounded-lg ${c.dark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-500"}`}>{c.icon}</span>
                        </div>
                        <p className="text-3xl font-bold tracking-tight">{c.value}</p>
                        <div className="mt-2">{c.foot}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Intakes per month */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-50 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Intakes — last 6 months</h2>
                    <div className="h-56 flex items-end gap-3">
                        {monthly.length === 0 ? (
                            <p className="text-sm text-gray-400">No data yet.</p>
                        ) : (
                            monthly.map((m, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                                    <span className="text-xs font-semibold text-gray-600">{m.intakes}</span>
                                    <div
                                        className="w-full rounded-t-xl bg-gray-900"
                                        style={{ height: `${Math.max(4, Math.round(((m.intakes || 0) / maxMonth) * 100))}%` }}
                                    />
                                    <span className="text-xs text-gray-400">{m.label}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Status breakdown */}
                <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex flex-col">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">By status</h2>
                    <div className="space-y-3 text-sm flex-1">
                        {status_breakdown.map((s) => {
                            const pct = statusTotal > 0 ? Math.round((s.count / statusTotal) * 100) : 0;
                            return (
                                <div key={s.status}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-gray-600">{s.status}</span>
                                        <span className="font-bold text-gray-900">{s.count}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${STATUS_BAR_COLORS[s.status] || "bg-gray-400"}`} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <Link
                        href="/admin/immigration/resident-intakes"
                        className="mt-5 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#00A693] text-white text-sm font-semibold hover:bg-[#008c7c] transition-colors"
                    >
                        View all intakes <ArrowUpRight size={15} />
                    </Link>
                </div>
            </div>

            {/* Recent intakes */}
            <div className="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
                <div className="px-6 py-5 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Recent intakes</h2>
                    <Link href="/admin/immigration/resident-intakes" className="text-sm font-semibold text-[#00A693] hover:text-[#008c7c]">
                        All intakes →
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-y border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-3">Applicant</th>
                                <th className="px-6 py-3">Visa</th>
                                <th className="px-6 py-3">Job title</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Submitted</th>
                                <th className="px-6 py-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recent_intakes.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">No intakes yet.</td></tr>
                            ) : recent_intakes.map((i) => (
                                <tr key={i.id} className="hover:bg-gray-50/40">
                                    <td className="px-6 py-3">
                                        <div className="font-semibold text-gray-900 text-sm">{i.first_name} {i.last_name}</div>
                                        <div className="text-xs text-gray-400">{i.email || "—"}</div>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{i.current_visa_type || "—"}</td>
                                    <td className="px-6 py-3 text-sm text-gray-600 truncate max-w-[200px]">{i.job_title || "—"}</td>
                                    <td className="px-6 py-3">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${statusClass(i.status)}`}>{i.status || "New"}</span>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-500">{fmtDate(i.created_at)}</td>
                                    <td className="px-6 py-3 text-right">
                                        <Link
                                            href={`/admin/immigration/resident-intakes/${i.id}`}
                                            className="text-xs font-semibold text-[#00A693] hover:text-[#008c7c]"
                                        >
                                            Open →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent user reviews */}
            <div className="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
                <div className="px-6 py-5 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Recent user reviews</h2>
                    <Link href="/admin/immigration/user-reviews" className="text-sm font-semibold text-[#00A693] hover:text-[#008c7c]">
                        All reviews →
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-y border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-3">Reviewer</th>
                                <th className="px-6 py-3">Mode</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Submitted</th>
                                <th className="px-6 py-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recent_reviews.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">No reviews yet.</td></tr>
                            ) : recent_reviews.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50/40">
                                    <td className="px-6 py-3">
                                        <div className="font-semibold text-gray-900 text-sm">{r.name || "Anonymous"}</div>
                                        <div className="text-xs text-gray-400">{r.email || "—"}</div>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-600 capitalize">{r.mode || "—"}</td>
                                    <td className="px-6 py-3">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${statusClass(r.status)}`}>{r.status || "New"}</span>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-500">{fmtDate(r.created_at)}</td>
                                    <td className="px-6 py-3 text-right">
                                        <Link
                                            href={`/admin/immigration/user-reviews/${r.id}`}
                                            className="text-xs font-semibold text-[#00A693] hover:text-[#008c7c]"
                                        >
                                            Open →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
