import { Head } from "@inertiajs/react";
import { useState } from "react";
import { Calendar, Video, MapPin, User, Plus, Clock } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";

const STATUS_CHIP = {
    Pending:   "bg-amber-50 text-amber-700 border-amber-200",
    Confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Completed: "bg-gray-100 text-gray-600 border-gray-200",
    Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

const fmt = (iso) => iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function LeadAppointments({ lead, upcoming = [], past = [] }) {
    const [tab, setTab] = useState('upcoming');
    const rows = tab === 'upcoming' ? upcoming : past;

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <Head title="Appointments" />
            <PortalPageHeader
                eyebrow="Calendar"
                title="Appointments"
                description="Your consultations and meetings with the ePathways team."
                action={
                    <a
                        href="/booking"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#436235] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#385029] transition-colors"
                    >
                        <Plus size={13} /> Book new
                    </a>
                }
            />

            <div className="bg-white rounded-2xl border border-[#282728]/15 overflow-hidden">
                <div className="flex items-center border-b border-[#282728]/10 px-2">
                    {['upcoming', 'past'].map((k) => (
                        <button
                            key={k}
                            type="button"
                            onClick={() => setTab(k)}
                            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                                tab === k
                                    ? 'text-[#282728] border-[#436235]'
                                    : 'text-gray-400 border-transparent hover:text-gray-700'
                            }`}
                        >
                            {k === 'upcoming' ? 'Upcoming' : 'Past'} ({k === 'upcoming' ? upcoming.length : past.length})
                        </button>
                    ))}
                </div>

                {rows.length === 0 ? (
                    <div className="p-14 text-center text-gray-400">
                        <Calendar size={28} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium">No {tab} appointments.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-[#282728]/10">
                        {rows.map((b) => (
                            <li key={b.id} className="px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="w-12 h-12 rounded-xl bg-[#436235]/10 text-[#436235] flex items-center justify-center flex-shrink-0">
                                        <Calendar size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-[#282728]">{b.service_type || 'Consultation'}</p>
                                        <p className="text-[11px] text-gray-500 mt-0.5">
                                            {fmt(b.appointment_date)}{b.appointment_time && ` · ${b.appointment_time}`}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                                            {b.consultant_name && <span className="inline-flex items-center gap-1"><User size={10} /> {b.consultant_name}</span>}
                                            {b.platform && <span className="inline-flex items-center gap-1">{b.platform.toLowerCase().includes('zoom') || b.platform.toLowerCase().includes('meet') ? <Video size={10} /> : <MapPin size={10} />} {b.platform}</span>}
                                        </div>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${STATUS_CHIP[b.status] || STATUS_CHIP.Pending}`}>
                                    {b.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
