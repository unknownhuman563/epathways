import { Head } from "@inertiajs/react";
import { Languages, Users, Award, ClipboardCheck } from "lucide-react";

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default function EnglishDashboard({ learnerStats = {}, recentLearners = [] }) {
    const cards = [
        { label: "Learners with test", value: learnerStats.total ?? 0, icon: <Users className="w-5 h-5" />, dark: true, foot: <span className="text-xs text-gray-400">across study plans</span> },
        { label: "New this month", value: learnerStats.this_month ?? 0, icon: <Languages className="w-5 h-5" />, foot: <span className="text-xs text-gray-400">added in last 30 days</span> },
        { label: "IELTS", value: learnerStats.ielts ?? 0, icon: <Award className="w-5 h-5" />, foot: <span className="text-xs text-gray-400">candidates</span> },
        { label: "PTE", value: learnerStats.pte ?? 0, icon: <ClipboardCheck className="w-5 h-5" />, foot: <span className="text-xs text-gray-400">candidates</span> },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <Head title="English Dashboard" />

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

            <div className="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
                <div className="px-6 py-5 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Recent learners</h2>
                    <span className="text-xs text-gray-400">From lead study plans flagged as having taken an English test</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-y border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-3">Learner</th>
                                <th className="px-6 py-3">Test</th>
                                <th className="px-6 py-3">Score</th>
                                <th className="px-6 py-3">Test date</th>
                                <th className="px-6 py-3">Logged</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recentLearners.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">No learners yet.</td></tr>
                            ) : recentLearners.map((l) => (
                                <tr key={l.id} className="hover:bg-gray-50/40">
                                    <td className="px-6 py-3"><div className="font-semibold text-gray-900 text-sm">{l.name}</div><div className="text-xs text-gray-400">{l.email || "—"}</div></td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{l.test_type || "—"}</td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{l.test_score || "—"}</td>
                                    <td className="px-6 py-3 text-sm text-gray-500">{fmtDate(l.test_date)}</td>
                                    <td className="px-6 py-3 text-sm text-gray-500">{fmtDate(l.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 text-sm text-emerald-900">
                <p className="font-semibold mb-1">Scaffold portal</p>
                <p className="text-emerald-800/80">English-language classes, learners, and assessments don't have dedicated tables yet — these counts are sourced from existing lead study plans. Wire dedicated models when the English module's data needs grow.</p>
            </div>
        </div>
    );
}
