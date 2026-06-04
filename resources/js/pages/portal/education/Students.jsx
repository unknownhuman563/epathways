import { Head, Link } from "@inertiajs/react";
import { useMemo, useState } from "react";
import {
    BookOpen, ChevronRight, Clock, FileCheck, FolderOpen, GraduationCap,
    Search, Users,
} from "lucide-react";

// Per-user palette for the colored avatar — same hash always picks the
// same colour so the eye learns the student.
const AVATAR_PALETTE = [
    "bg-blue-500", "bg-pink-500", "bg-orange-500", "bg-teal-500",
    "bg-purple-500", "bg-amber-500", "bg-emerald-500", "bg-rose-500",
    "bg-indigo-500", "bg-fuchsia-500",
];
const avatarColor = (key) => {
    const str = String(key || "");
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
    return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
};
const initials = (name = "") =>
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();

// Stage chip colours mirror the Leads palette so a student's stage reads
// the same here as it does on the lead detail screen.
const STAGE_STYLES = {
    "New Leads":                      "bg-rose-100 text-rose-800 border-rose-200",
    "Contact Attempted":              "bg-orange-100 text-orange-800 border-orange-200",
    "Contacted for Booking":          "bg-yellow-100 text-yellow-800 border-yellow-200",
    "Booking Confirmation with Bryll":"bg-cyan-100 text-cyan-800 border-cyan-200",
    "Missed the Meeting":             "bg-pink-100 text-pink-800 border-pink-200",
    "Qualified but Not Ready":        "bg-slate-100 text-slate-700 border-slate-200",
    "Qualified but No Funds":         "bg-slate-100 text-slate-700 border-slate-200",
    "Qualified":                      "bg-amber-100 text-amber-800 border-amber-200",
    "Booked Consultation":            "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Did Not Book Consultation":      "bg-stone-100 text-stone-700 border-stone-200",
    "No Show":                        "bg-teal-100 text-teal-800 border-teal-200",
    "Consultation Done":              "bg-purple-100 text-purple-800 border-purple-200",
    "Proposal Sent":                  "bg-sky-100 text-sky-800 border-sky-200",
    "Consultancy Agreement":          "bg-indigo-100 text-indigo-800 border-indigo-200",
    "English Pro":                    "bg-emerald-50 text-emerald-700 border-emerald-200",
    "School Enrollment":              "bg-green-100 text-green-800 border-green-200",
    "Visa Process":                   "bg-lime-100 text-lime-800 border-lime-200",
    "Not Qualified":                  "bg-red-100 text-red-700 border-red-200",
    "Work Pathway / Other":           "bg-blue-100 text-blue-800 border-blue-200",
};
const stageClass = (s) => STAGE_STYLES[s] || "bg-gray-100 text-gray-700 border-gray-200";

const fmtPct = (a, t) => (t > 0 ? Math.round((a / t) * 100) : 0);

export default function EducationStudents({ students = [] }) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (! q) return students;
        return students.filter((s) =>
            (s.name    || "").toLowerCase().includes(q) ||
            (s.program || "").toLowerCase().includes(q) ||
            (s.level   || "").toLowerCase().includes(q) ||
            (s.status  || "").toLowerCase().includes(q) ||
            (s.lead_id || "").toLowerCase().includes(q)
        );
    }, [students, search]);

    const stats = useMemo(() => {
        const total       = students.length;
        const withPlan    = students.filter((s) => !! s.program).length;
        const pendingDocs = students.filter((s) => (s.docs_total || 0) > 0 && (s.docs_approved || 0) < s.docs_total).length;
        return { total, withPlan, pendingDocs };
    }, [students]);

    return (
        <div className="space-y-5 max-w-[1400px] mx-auto pb-12">
            <Head title="Students — Education" />

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Students</h1>
                <p className="text-sm text-gray-500 mt-1.5">
                    Engaged leads with a study plan or in any post-engagement stage. Use Leads for prospecting.
                </p>
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatTile label="Total students"     value={stats.total}       icon={<GraduationCap size={16} />} tone="indigo"  />
                <StatTile label="With study plan"    value={stats.withPlan}    icon={<BookOpen size={16} />}      tone="emerald" />
                <StatTile label="Pending documents"  value={stats.pendingDocs} icon={<Clock size={16} />}         tone="amber"   />
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2">
                <Search size={14} className="text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, program, level, stage, or LP-ID…"
                    className="flex-1 outline-none text-sm placeholder:text-gray-400 bg-transparent"
                />
                {search && (
                    <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="text-gray-400 hover:text-gray-700 text-[11px] font-bold uppercase tracking-wider"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Card grid */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center text-gray-400">
                    <Users size={28} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium">
                        {students.length === 0 ? "No students yet." : "No students match your search."}
                    </p>
                    {students.length === 0 && (
                        <p className="text-xs mt-1">Leads who sign their consultancy agreement appear here automatically.</p>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filtered.map((s) => (
                        <StudentCard key={s.id} student={s} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Components ────────────────────────────────────────────────────────────

function StudentCard({ student: s }) {
    const pct       = fmtPct(s.docs_approved, s.docs_total);
    const hasDocs   = (s.docs_total || 0) > 0;
    const docsDone  = hasDocs && s.docs_approved >= s.docs_total;
    const barColor  = docsDone ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-gray-400";

    return (
        <Link
            href={`/portal/education/leads/${s.id}?tab=documents`}
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col"
        >
            {/* Avatar + name + LP-ID */}
            <div className="flex items-start gap-3">
                <span className={`w-10 h-10 rounded-full inline-flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0 ${avatarColor(s.id)}`}>
                    {initials(s.name)}
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                    {s.lead_id && (
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">{s.lead_id}</p>
                    )}
                </div>
                {docsDone && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        <FileCheck size={9} /> All docs
                    </span>
                )}
            </div>

            {/* Stage chip */}
            {s.status && (
                <div className="mt-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${stageClass(s.status)}`}>
                        {s.status}
                    </span>
                </div>
            )}

            {/* Program + level */}
            <div className="mt-3 text-[11.5px]">
                {s.program ? (
                    <span className="inline-flex items-center gap-1.5 text-gray-700">
                        <BookOpen size={11} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">
                            <span className="font-semibold">{s.program}</span>
                            {s.level && <span className="text-gray-500"> · {s.level}</span>}
                        </span>
                    </span>
                ) : (
                    <span className="text-gray-400 italic">No study plan yet</span>
                )}
            </div>

            {/* Doc progress */}
            <div className="mt-auto pt-3 border-t border-gray-50">
                <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="inline-flex items-center gap-1 font-bold uppercase tracking-wider text-gray-500">
                        <FileCheck size={10} /> Documents
                    </span>
                    <span className="tabular-nums font-semibold text-gray-700">
                        {s.docs_approved || 0} / {s.docs_total || 0}
                        {hasDocs && <span className="ml-1 text-gray-400">· {pct}%</span>}
                    </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
            </div>

            {/* Open footer */}
            <div className="mt-3 flex items-center justify-end text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-900 transition-colors">
                <FolderOpen size={11} className="mr-1" />
                Open profile
                <ChevronRight size={11} className="ml-0.5" />
            </div>
        </Link>
    );
}

function StatTile({ label, value, icon, tone = "indigo" }) {
    const TONES = {
        indigo:  { bg: "bg-indigo-50",  glyph: "bg-indigo-100 text-indigo-700",   num: "text-indigo-900" },
        emerald: { bg: "bg-emerald-50", glyph: "bg-emerald-100 text-emerald-700", num: "text-emerald-900" },
        amber:   { bg: "bg-amber-50",   glyph: "bg-amber-100 text-amber-700",     num: "text-amber-900" },
    };
    const t = TONES[tone] || TONES.indigo;
    return (
        <div className={`${t.bg} rounded-2xl p-4 flex items-center gap-3`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${t.glyph}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">{label}</p>
                <p className={`text-2xl font-bold tabular-nums ${t.num}`}>{value}</p>
            </div>
        </div>
    );
}
