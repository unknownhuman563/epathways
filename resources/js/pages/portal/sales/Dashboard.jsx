import { Head, Link } from "@inertiajs/react";
import { Users, TrendingUp, TrendingDown, CalendarCheck, Sparkles, ArrowUpRight } from "lucide-react";

const STATUS_STYLES = {
    New: "bg-blue-100 text-blue-700 border-blue-200",
    Contacted: "bg-amber-100 text-amber-700 border-amber-200",
    Qualified: "bg-purple-100 text-purple-700 border-purple-200",
    Processing: "bg-indigo-100 text-indigo-700 border-indigo-200",
    Closed: "bg-emerald-100 text-emerald-700 border-emerald-200",
};
const BOOKING_STYLES = {
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    Confirmed: "bg-blue-100 text-blue-700 border-blue-200",
    Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Cancelled: "bg-red-100 text-red-700 border-red-200",
};
const statusClass = (s) => STATUS_STYLES[s] || "bg-gray-100 text-gray-700 border-gray-200";
const bookingClass = (s) => BOOKING_STYLES[s] || "bg-gray-100 text-gray-700 border-gray-200";
const scoreClass = (n) => (n >= 70 ? "bg-emerald-100 text-emerald-700" : n >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700");

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default function SalesDashboard({ leadStats = {}, bookingStats = {}, leadsByMonth = [], recentLeads = [], upcomingBookings = [] }) {
    const delta = (leadStats.this_month || 0) - (leadStats.last_month || 0);
    const maxMonth = Math.max(1, ...leadsByMonth.map((m) => m.count || 0));

    const cards = [
        { label: "Total leads", value: leadStats.total ?? 0, icon: <Users className="w-5 h-5" />, dark: true, foot: <span className={`inline-flex items-center gap-1 text-xs font-semibold ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>{delta >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{delta >= 0 ? "+" : ""}{delta} vs last month</span> },
        { label: "New leads", value: leadStats.new ?? 0, icon: <Sparkles className="w-5 h-5" />, foot: <span className="text-xs text-gray-400">awaiting first contact</span> },
        { label: "Qualified / processing", value: leadStats.qualified ?? 0, icon: <TrendingUp className="w-5 h-5" />, foot: <span className="text-xs text-gray-400">{leadStats.closed ?? 0} closed</span> },
        { label: "Upcoming consultations", value: bookingStats.upcoming ?? 0, icon: <CalendarCheck className="w-5 h-5" />, foot: <span className="text-xs text-gray-400">{bookingStats.pending ?? 0} pending confirmation</span> },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <Head title="Sales Dashboard" />

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
                {/* Leads per month */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-50 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Leads — last 6 months</h2>
                    <div className="h-56 flex items-end gap-3">
                        {leadsByMonth.length === 0 ? (
                            <p className="text-sm text-gray-400">No data yet.</p>
                        ) : (
                            leadsByMonth.map((m, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                                    <span className="text-xs font-semibold text-gray-600">{m.count}</span>
                                    <div className="w-full rounded-t-xl bg-gray-900" style={{ height: `${Math.max(4, Math.round((m.count / maxMonth) * 100))}%` }} />
                                    <span className="text-xs text-gray-400">{m.label}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* AI assessments */}
                <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex flex-col">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">AI assessments</h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between"><span className="text-gray-500">Completed</span><span className="font-bold text-gray-900">{leadStats.ai_done ?? 0}</span></div>
                        <div className="flex items-center justify-between"><span className="text-gray-500">Processing</span><span className="font-bold text-gray-900">{leadStats.ai_pending ?? 0}</span></div>
                    </div>
                    <Link href="/portal/sales/leads" className="mt-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
                        View all leads <ArrowUpRight size={15} />
                    </Link>
                </div>
            </div>

            {/* Recent leads */}
            <div className="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
                <div className="px-6 py-5 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Recent leads</h2>
                    <Link href="/portal/sales/leads" className="text-sm font-semibold text-blue-600 hover:text-blue-800">All leads →</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-y border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-3">Lead</th>
                                <th className="px-6 py-3">Course</th>
                                <th className="px-6 py-3">AI score</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recentLeads.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">No leads yet.</td></tr>
                            ) : recentLeads.map((l) => (
                                <tr key={l.id} className="hover:bg-gray-50/40">
                                    <td className="px-6 py-3"><div className="font-semibold text-gray-900 text-sm">{l.name}</div><div className="text-xs text-gray-400">{l.email || "—"}</div></td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{l.course || "—"}</td>
                                    <td className="px-6 py-3">
                                        {l.ai_score != null
                                            ? <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${scoreClass(l.ai_score)}`} title={l.ai_pathway || ""}>{l.ai_score}/100</span>
                                            : <span className="text-xs text-gray-400">{l.ai_status === "processing" ? "analyzing…" : "—"}</span>}
                                    </td>
                                    <td className="px-6 py-3"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${statusClass(l.status)}`}>{l.status}</span></td>
                                    <td className="px-6 py-3 text-sm text-gray-500">{fmtDate(l.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Upcoming consultations */}
            <div className="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
                <div className="px-6 py-5 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Upcoming consultations</h2>
                    <Link href="/portal/sales/bookings" className="text-sm font-semibold text-blue-600 hover:text-blue-800">All bookings →</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-y border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-3">Client</th>
                                <th className="px-6 py-3">Service</th>
                                <th className="px-6 py-3">When</th>
                                <th className="px-6 py-3">Consultant</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {upcomingBookings.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">No upcoming consultations.</td></tr>
                            ) : upcomingBookings.map((b) => (
                                <tr key={b.id} className="hover:bg-gray-50/40">
                                    <td className="px-6 py-3"><div className="font-semibold text-gray-900 text-sm">{b.name}</div><div className="text-xs text-gray-400">{b.email || "—"}</div></td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{b.service_type || "—"}</td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{fmtDate(b.appointment_date)}{b.appointment_time ? ` · ${b.appointment_time}` : ""}</td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{b.consultant_name || "—"}</td>
                                    <td className="px-6 py-3"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${bookingClass(b.status)}`}>{b.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
