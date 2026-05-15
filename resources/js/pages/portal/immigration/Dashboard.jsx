import { Head, Link } from "@inertiajs/react";
import { Globe, FileText, Star, Clock, ArrowUpRight } from "lucide-react";

const STATUS_STYLES = {
    New: "bg-blue-100 text-blue-700 border-blue-200",
    Contacted: "bg-amber-100 text-amber-700 border-amber-200",
    Processing: "bg-indigo-100 text-indigo-700 border-indigo-200",
    Approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Closed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Rejected: "bg-red-100 text-red-700 border-red-200",
};
const statusClass = (s) => STATUS_STYLES[s] || "bg-gray-100 text-gray-700 border-gray-200";
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default function ImmigrationDashboard({ intakeStats = {}, reviewStats = {}, recentIntakes = [], recentReviews = [] }) {
    const cards = [
        { label: "Resident intakes", value: intakeStats.total ?? 0, icon: <FileText className="w-5 h-5" />, dark: true, foot: <span className="text-xs text-gray-400">+{intakeStats.this_month ?? 0} this month</span> },
        { label: "New intakes", value: intakeStats.new ?? 0, icon: <Globe className="w-5 h-5" />, foot: <span className="text-xs text-gray-400">awaiting review</span> },
        { label: "In progress", value: intakeStats.in_progress ?? 0, icon: <Clock className="w-5 h-5" />, foot: <span className="text-xs text-gray-400">being worked</span> },
        { label: "User reviews", value: reviewStats.total ?? 0, icon: <Star className="w-5 h-5" />, foot: <span className="text-xs text-gray-400">{reviewStats.new ?? 0} unread</span> },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <Head title="Immigration Dashboard" />

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
                {/* Recent intakes */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">Recent resident intakes</h2>
                        <Link href="/admin/immigration/resident-intakes" className="text-sm font-semibold text-amber-600 hover:text-amber-800">All intakes →</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-y border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-3">Intake</th>
                                    <th className="px-6 py-3">Reference</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentIntakes.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">No intakes yet.</td></tr>
                                ) : recentIntakes.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50/40">
                                        <td className="px-6 py-3"><div className="font-semibold text-gray-900 text-sm">{`${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || "Unknown"}</div><div className="text-xs text-gray-400">{r.email || "—"}</div></td>
                                        <td className="px-6 py-3 text-sm text-gray-600 font-mono">{r.intake_id || "—"}</td>
                                        <td className="px-6 py-3"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${statusClass(r.status)}`}>{r.status}</span></td>
                                        <td className="px-6 py-3 text-sm text-gray-500">{fmtDate(r.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent reviews */}
                <div className="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-5 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">Recent reviews</h2>
                        <Link href="/admin/immigration/user-reviews" className="text-sm font-semibold text-amber-600 hover:text-amber-800">All →</Link>
                    </div>
                    <ul className="divide-y divide-gray-50">
                        {recentReviews.length === 0 ? (
                            <li className="px-6 py-8 text-center text-gray-400 text-sm">No reviews yet.</li>
                        ) : recentReviews.map((r) => (
                            <li key={r.id} className="px-6 py-3 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm truncate">{r.name || "Anonymous"}</p>
                                    <p className="text-xs text-gray-400 truncate font-mono">{r.review_id}</p>
                                </div>
                                <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusClass(r.status)}`}>{r.status}</span>
                            </li>
                        ))}
                    </ul>
                    <Link href="/admin/immigration/user-reviews" className="m-4 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors">
                        Open reviews <ArrowUpRight size={15} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
