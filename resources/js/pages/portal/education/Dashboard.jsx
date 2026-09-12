import { Fragment, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { GraduationCap, Users, BookOpen, CheckCircle2, ArrowUpRight, CalendarDays } from "lucide-react";

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

// Intake status chips reuse the exact palettes from the Students page — sales
// statuses + Education / English / Immigration department stages — so the
// dashboard reads the same as the Students list.
const INTAKE_STATUS_STYLES = {
    // Sales pipeline statuses
    "New Leads": "bg-rose-100 text-rose-800 border-rose-200",
    "Contact Attempted": "bg-orange-100 text-orange-800 border-orange-200",
    "Contacted for Booking": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "Booking Confirmation": "bg-cyan-100 text-cyan-800 border-cyan-200",
    "Missed the Meeting": "bg-pink-100 text-pink-800 border-pink-200",
    "Qualified but Not Ready": "bg-slate-100 text-slate-700 border-slate-200",
    "Qualified but No Funds": "bg-slate-100 text-slate-700 border-slate-200",
    Qualified: "bg-amber-100 text-amber-800 border-amber-200",
    "Booked Consultation": "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Did Not Book Consultation": "bg-stone-100 text-stone-700 border-stone-200",
    "No Show": "bg-teal-100 text-teal-800 border-teal-200",
    "Consultation Done": "bg-purple-100 text-purple-800 border-purple-200",
    "Proposal Sent": "bg-sky-100 text-sky-800 border-sky-200",
    "Program Selected": "bg-teal-100 text-teal-800 border-teal-200",
    "Consultancy Agreement Sent": "bg-indigo-100 text-indigo-800 border-indigo-200",
    "Consultancy Agreement Signed": "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Consultancy Agreement": "bg-indigo-100 text-indigo-800 border-indigo-200",
    "English Pro": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Visa Process": "bg-lime-100 text-lime-800 border-lime-200",
    "Not Qualified": "bg-red-100 text-red-700 border-red-200",
    "Work Pathway / Other": "bg-blue-100 text-blue-800 border-blue-200",
    // English department sub-stages
    "PTE Review": "bg-purple-100 text-purple-800 border-purple-200",
    "DIY Review": "bg-violet-100 text-violet-800 border-violet-200",
    "For PTE Mocktest": "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
    "For PTE Exam": "bg-pink-100 text-pink-800 border-pink-200",
    // Immigration department sub-stages
    "For Assessment": "bg-amber-100 text-amber-800 border-amber-200",
    Endorsed: "bg-indigo-100 text-indigo-800 border-indigo-200",
    "Request for Information": "bg-orange-100 text-orange-800 border-orange-200",
    "Approved in Principle": "bg-cyan-100 text-cyan-800 border-cyan-200",
    "Decline Visa": "bg-red-100 text-red-700 border-red-200",
    // Education department stages (current 15-stage set + legacy labels)
    "New Lead": "bg-rose-100 text-rose-800 border-rose-200",
    "Pre-Screening Done": "bg-cyan-100 text-cyan-800 border-cyan-200",
    "For Proposal": "bg-amber-100 text-amber-800 border-amber-200",
    "Engagement Sent": "bg-indigo-100 text-indigo-800 border-indigo-200",
    "Goal Setting Done": "bg-purple-100 text-purple-800 border-purple-200",
    "Endorsed to School": "bg-sky-100 text-sky-800 border-sky-200",
    "School Enrolment": "bg-sky-100 text-sky-800 border-sky-200",
    "School Enrollment": "bg-green-100 text-green-800 border-green-200",
    "Conditional Offer": "bg-amber-100 text-amber-800 border-amber-200",
    "Unconditional Offer": "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Endorsed to Immigration": "bg-indigo-100 text-indigo-800 border-indigo-200",
    "Visa Lodged": "bg-violet-100 text-violet-800 border-violet-200",
    "Approved Visa": "bg-green-100 text-green-800 border-green-200",
    "Started Course": "bg-teal-100 text-teal-800 border-teal-200",
    "For Relodgement": "bg-orange-100 text-orange-800 border-orange-200",
    "Declined Visa": "bg-red-100 text-red-700 border-red-200",
};
const intakeStatusClass = (s) => INTAKE_STATUS_STYLES[s] || "bg-gray-100 text-gray-700 border-gray-200";
const programStatusClass = (s) => PROGRAM_STATUS[s] || "bg-gray-100 text-gray-700 border-gray-200";
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default function EducationDashboard({ programStats = {}, studentStats = {}, recentStudents = [], recentPrograms = [], intakeMonitoring = [] }) {
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

            {/* Intake monitoring — students grouped by their intake month */}
            <IntakeMonitoring groups={intakeMonitoring} />
        </div>
    );
}

function IntakeMonitoring({ groups = [] }) {
    const [active, setActive] = useState("all");
    const total = groups.reduce((n, g) => n + (g.count || 0), 0);
    const visible = active === "all" ? groups : groups.filter((g) => g.key === active);

    return (
        <div className="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600"><CalendarDays size={18} /></span>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Intake monitoring</h2>
                        <p className="text-xs text-gray-400">{total} student{total === 1 ? "" : "s"} across {groups.length} intake month{groups.length === 1 ? "" : "s"}</p>
                    </div>
                </div>
                <Link href="/portal/education/students" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">All students →</Link>
            </div>

            {groups.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-400 text-sm">No student intakes to monitor yet.</div>
            ) : (
                <>
                    {/* Month filter chips */}
                    <div className="px-6 pb-3 flex flex-wrap gap-1.5">
                        <MonthChip on={active === "all"} onClick={() => setActive("all")} label="All months" count={total} />
                        {groups.map((g) => (
                            <MonthChip key={g.key} on={active === g.key} onClick={() => setActive(g.key)} label={g.label} count={g.count} />
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-y border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Location</th>
                                    <th className="px-6 py-3">Intake</th>
                                    <th className="px-6 py-3">School / Program</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {visible.map((g) => (
                                    <Fragment key={g.key}>
                                        {active === "all" && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-2 bg-gray-50/70 border-y border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                                    {g.label} · {g.count}
                                                </td>
                                            </tr>
                                        )}
                                        {g.rows.map((r) => (
                                            <tr key={r.id} className="hover:bg-gray-50/40">
                                                <td className="px-6 py-3 font-semibold text-gray-900 text-sm">{r.name}</td>
                                                <td className="px-6 py-3">
                                                    {r.status ? <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${intakeStatusClass(r.status)}`}>{r.status}</span> : <span className="text-gray-300">—</span>}
                                                </td>
                                                <td className="px-6 py-3 text-sm text-gray-600">{r.location || "—"}</td>
                                                <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">{r.intake || "—"}</td>
                                                <td className="px-6 py-3">
                                                    <div className="text-sm text-gray-700">{r.school || "—"}</div>
                                                    {r.program && <div className="text-xs text-gray-400">{r.program}</div>}
                                                </td>
                                            </tr>
                                        ))}
                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

function MonthChip({ on, onClick, label, count }) {
    return (
        <button type="button" onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors ${on ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {label}
            <span className={`text-[10px] rounded-full px-1.5 py-0.5 tabular-nums ${on ? "bg-white/20" : "bg-white text-gray-500"}`}>{count}</span>
        </button>
    );
}
