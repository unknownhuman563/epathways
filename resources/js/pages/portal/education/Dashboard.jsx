import { Head, Link } from "@inertiajs/react";
import { GraduationCap, Users, BookOpen, CheckCircle2, ArrowUpRight } from "lucide-react";

const STATUS_STYLES = {
    New: "bg-blue-100 text-blue-700 border-blue-200",
    Contacted: "bg-amber-100 text-amber-700 border-amber-200",
    Qualified: "bg-purple-100 text-purple-700 border-purple-200",
    Processing: "bg-indigo-100 text-indigo-700 border-indigo-200",
    Closed: "bg-emerald-100 text-emerald-700 border-emerald-200",
};
const PROGRAM_STATUS = {
    published: "bg-emerald-100 text-emerald-700 border-emerald-200",
    draft: "bg-gray-100 text-gray-600 border-gray-200",
    archived: "bg-red-100 text-red-700 border-red-200",
};
const statusClass = (s) => STATUS_STYLES[s] || "bg-gray-100 text-gray-700 border-gray-200";
const programStatusClass = (s) => PROGRAM_STATUS[s] || "bg-gray-100 text-gray-700 border-gray-200";
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default function EducationDashboard({ programStats = {}, studentStats = {}, recentStudents = [], recentPrograms = [] }) {
    const cards = [
        { label: "Programs", value: programStats.total ?? 0, icon: <GraduationCap className="w-5 h-5" />, dark: true, foot: <span className="text-xs text-gray-400">{programStats.published ?? 0} published · {programStats.draft ?? 0} draft</span> },
        { label: "Students", value: studentStats.total_with_plan ?? 0, icon: <Users className="w-5 h-5" />, foot: <span className="text-xs text-gray-400">+{studentStats.this_month ?? 0} this month</span> },
        { label: "In pipeline", value: studentStats.qualified ?? 0, icon: <BookOpen className="w-5 h-5" />, foot: <span className="text-xs text-gray-400">qualified / processing</span> },
        { label: "Enrolled", value: studentStats.enrolled ?? 0, icon: <CheckCircle2 className="w-5 h-5" />, foot: <span className="text-xs text-gray-400">closed-won</span> },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <Head title="Education Dashboard" />

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
                {/* Recent students */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">Recent students</h2>
                        <Link href="/admin/leads" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">All leads →</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-y border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-3">Student</th>
                                    <th className="px-6 py-3">Preferred course</th>
                                    <th className="px-6 py-3">Level</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentStudents.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">No students yet.</td></tr>
                                ) : recentStudents.map((s) => (
                                    <tr key={s.id} className="hover:bg-gray-50/40">
                                        <td className="px-6 py-3"><div className="font-semibold text-gray-900 text-sm">{s.name}</div><div className="text-xs text-gray-400">{s.email || "—"}</div></td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{s.course || "—"}</td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{s.level || "—"}</td>
                                        <td className="px-6 py-3"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${statusClass(s.status)}`}>{s.status}</span></td>
                                        <td className="px-6 py-3 text-sm text-gray-500">{fmtDate(s.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent programs */}
                <div className="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-5 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">Programs</h2>
                        <Link href="/admin/programs" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">Manage →</Link>
                    </div>
                    <ul className="divide-y divide-gray-50">
                        {recentPrograms.length === 0 ? (
                            <li className="px-6 py-8 text-center text-gray-400 text-sm">No programs yet.</li>
                        ) : recentPrograms.map((p) => (
                            <li key={p.id} className="px-6 py-3 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm truncate">{p.title}</p>
                                    <p className="text-xs text-gray-400 truncate">{p.slug}</p>
                                </div>
                                <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border ${programStatusClass(p.status)}`}>{p.status}</span>
                            </li>
                        ))}
                    </ul>
                    <Link href="/admin/programs" className="m-4 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
                        Open program catalog <ArrowUpRight size={15} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
