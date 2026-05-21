import { Head, Link } from "@inertiajs/react";
import { Users, FolderOpen, ChevronRight, GraduationCap } from "lucide-react";

const fmtPct = (a, t) => t > 0 ? Math.round((a / t) * 100) : 0;

export default function EducationStudents({ students = [] }) {
    return (
        <div className="space-y-5 max-w-[1400px] mx-auto pb-12">
            <Head title="Students — Education" />
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Students</h1>
                <p className="text-sm text-gray-500 mt-1.5">
                    Engaged leads with a study plan or in any post-engagement stage. Use Leads for prospecting.
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {students.length === 0 ? (
                    <div className="p-14 text-center text-gray-400">
                        <Users size={28} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium">No students yet.</p>
                        <p className="text-xs mt-1">Leads who sign their consultancy agreement appear here automatically.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {students.map((s) => {
                            const pct = fmtPct(s.docs_approved, s.docs_total);
                            return (
                                <li key={s.id} className="px-5 py-4 hover:bg-gray-50/50">
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                            <GraduationCap size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">
                                                {s.program ? `${s.program}${s.level ? ` · ${s.level}` : ''}` : 'No study plan'}
                                                {s.status && ` · ${s.status}`}
                                            </p>
                                        </div>
                                        <div className="hidden md:flex items-center gap-3 text-[11px] text-gray-500 tabular-nums">
                                            <span>{s.docs_approved} / {s.docs_total} docs</span>
                                            <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                        <Link
                                            href={`/portal/education/leads/${s.id}?tab=documents`}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 transition-colors"
                                        >
                                            <FolderOpen size={11} /> Open <ChevronRight size={10} />
                                        </Link>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
