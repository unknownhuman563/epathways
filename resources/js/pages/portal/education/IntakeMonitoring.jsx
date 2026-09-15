import { Head, Link } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { CalendarDays, MapPin, GraduationCap, Users } from "lucide-react";

// Status chip colours — mirrors the Students page so a stage reads the same
// wherever it appears. Falls back to a neutral grey for anything unmapped.
const STATUS_STYLES = {
    "Endorsed to School":       "bg-sky-100 text-sky-800 border-sky-200",
    "Conditional Offer":        "bg-amber-100 text-amber-800 border-amber-200",
    "Unconditional Offer":      "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Endorsed to Immigration":  "bg-indigo-100 text-indigo-800 border-indigo-200",
    "Endorsed":                 "bg-indigo-100 text-indigo-800 border-indigo-200",
    "Visa Lodged":              "bg-purple-100 text-purple-800 border-purple-200",
    "Approved in Principle":    "bg-teal-100 text-teal-800 border-teal-200",
    "Request for Information":   "bg-orange-100 text-orange-800 border-orange-200",
    "Approved Visa":            "bg-green-100 text-green-800 border-green-200",
    "Started Course":           "bg-emerald-100 text-emerald-800 border-emerald-200",
};
const statusCls = (s) => STATUS_STYLES[s] || "bg-gray-100 text-gray-600 border-gray-200";

export default function IntakeMonitoring({ students = [] }) {
    const [month, setMonth] = useState("all");

    // Distinct intake months in chronological order (Unscheduled last), each
    // with its student count. month_key '9999-99' is the unscheduled bucket.
    const months = useMemo(() => {
        const map = new Map();
        for (const s of students) {
            const key = s.month_key || "9999-99";
            if (! map.has(key)) map.set(key, { key, label: s.month_label || "Unscheduled", count: 0 });
            map.get(key).count += 1;
        }
        return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
    }, [students]);

    const scheduledMonths = months.filter((m) => m.key !== "9999-99").length;

    const visible = useMemo(
        () => (month === "all" ? students : students.filter((s) => (s.month_key || "9999-99") === month)),
        [students, month],
    );

    // Group the visible rows by month, preserving the chronological order.
    const groups = useMemo(() => {
        const order = months.map((m) => m.key);
        const byKey = new Map();
        for (const s of visible) {
            const key = s.month_key || "9999-99";
            if (! byKey.has(key)) byKey.set(key, { key, label: s.month_label || "Unscheduled", rows: [] });
            byKey.get(key).rows.push(s);
        }
        return order.filter((k) => byKey.has(k)).map((k) => byKey.get(k));
    }, [visible, months]);

    return (
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6">
            <Head title="Intake Monitoring — Education" />

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap px-5 sm:px-6 pt-5">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#14532d]/10 text-[#14532d] flex items-center justify-center flex-shrink-0">
                            <CalendarDays size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 leading-tight">Intake monitoring</h1>
                            <p className="text-[13px] text-gray-500 mt-0.5">
                                {students.length} student{students.length === 1 ? "" : "s"} across {scheduledMonths} intake month{scheduledMonths === 1 ? "" : "s"}
                            </p>
                        </div>
                    </div>
                    <Link href="/portal/education/students" className="text-sm font-semibold text-green-700 hover:text-green-900">
                        All students →
                    </Link>
                </div>

                {/* Month filter chips */}
                <div className="flex flex-wrap gap-2 px-5 sm:px-6 py-4">
                    <Chip active={month === "all"} onClick={() => setMonth("all")} label="All months" count={students.length} />
                    {months.map((m) => (
                        <Chip key={m.key} active={month === m.key} onClick={() => setMonth(m.key)} label={m.label} count={m.count} />
                    ))}
                </div>

                {/* Table */}
                <div className="overflow-x-auto border-t border-gray-100">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-gray-50/60 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-3">Name</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Location</th>
                                <th className="px-4 py-3">Intake</th>
                                <th className="px-4 py-3">School / Program</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <Users size={22} />
                                            <p className="text-sm font-medium">No students for this intake.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {groups.map((g) => (
                                <GroupBlock key={g.key} group={g} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function GroupBlock({ group }) {
    return (
        <>
            <tr className="bg-gray-50/40 border-y border-gray-100">
                <td colSpan={5} className="px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    {group.label} · {group.rows.length}
                </td>
            </tr>
            {group.rows.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-3">
                        <Link href={`/portal/education/leads/${s.id}`} className="font-semibold text-gray-900 hover:text-green-700">
                            {s.name}
                        </Link>
                    </td>
                    <td className="px-4 py-3">
                        {s.status ? (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusCls(s.status)}`}>
                                {s.status}
                            </span>
                        ) : (
                            <span className="text-gray-300">—</span>
                        )}
                    </td>
                    <td className="px-4 py-3">
                        {s.location ? (
                            <span className="inline-flex items-center gap-1 text-gray-600 text-[13px]">
                                <MapPin size={12} className="text-gray-300" /> {s.location}
                            </span>
                        ) : (
                            <span className="text-gray-300">—</span>
                        )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700 text-[13px]">
                        {s.intake || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                        {(s.school || s.program) ? (
                            <div className="min-w-0">
                                {s.school && <div className="text-gray-900 text-[13px] font-medium truncate max-w-[320px]" title={s.school}>{s.school}</div>}
                                {s.program && (
                                    <div className="flex items-center gap-1 text-gray-500 text-[12px] truncate max-w-[320px]" title={s.program}>
                                        <GraduationCap size={12} className="text-gray-300 flex-shrink-0" /> {s.program}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="text-gray-300">—</span>
                        )}
                    </td>
                </tr>
            ))}
        </>
    );
}

function Chip({ active, onClick, label, count }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
                active
                    ? "bg-[#14532d] text-white border-[#14532d]"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
        >
            {label}
            <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
            }`}>
                {count}
            </span>
        </button>
    );
}
