import { Head, Link, router } from "@inertiajs/react";
import { ClipboardCheck, ChevronRight, Globe } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function ImmigrationAssessments({ intakes = [] }) {
    return (
        <div className="space-y-5 max-w-[1400px] mx-auto pb-12">
            <Head title="Assessments — Immigration" />
            <PortalPageHeader
                eyebrow="Work"
                title="Assessments"
                description="Public visa-assessment submissions — free enquiries plus paid bookings — awaiting adviser triage."
            />

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {intakes.length === 0 ? (
                    <div className="p-14 text-center text-gray-400">
                        <ClipboardCheck size={28} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium">No assessments yet.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {intakes.map((i) => (
                            <li key={i.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50">
                                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                                    <ClipboardCheck size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900">
                                        {`${i.first_name || ''} ${i.last_name || ''}`.trim() || 'Unknown'}
                                    </p>
                                    <p className="text-[11px] text-gray-500">
                                        {i.current_visa_type || 'Visa enquiry'}
                                        {i.job_title && ` · ${i.job_title}`}
                                        {` · ${fmtDate(i.created_at)}`}
                                        {i.email && ` · ${i.email}`}
                                    </p>
                                </div>
                                {i.status && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                                        {i.status}
                                    </span>
                                )}
                                {i.status !== 'Engaged' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!confirm(`Convert this assessment to an immigration case? A lead will be created (or matched on email) and flagged as a case.`)) return;
                                            router.post(`/portal/immigration/assessments/${i.id}/convert-to-case`, {}, { preserveScroll: true });
                                        }}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                                    >
                                        <Globe size={10} /> Convert to case
                                    </button>
                                )}
                                <Link
                                    href={`/admin/immigration/resident-intakes/${i.id}`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                >
                                    Open <ChevronRight size={10} />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
