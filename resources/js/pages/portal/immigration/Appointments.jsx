import { Head } from "@inertiajs/react";
import { Calendar, User, MapPin, Video } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";

const STATUS_CHIP = {
    Pending:   "bg-amber-50 text-amber-700 border-amber-200",
    Confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Completed: "bg-gray-100 text-gray-600 border-gray-200",
    Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};
const fmt = (iso) => iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function ImmigrationAppointments({ appointments = [] }) {
    return (
        <div className="space-y-5 max-w-[1400px] mx-auto pb-12">
            <Head title="Appointments — Immigration" />
            <PortalPageHeader
                eyebrow="Work"
                title="Appointments"
                description="Consultations, biometrics, medicals, and in-person meetings."
            />

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {appointments.length === 0 ? (
                    <div className="p-14 text-center text-gray-400">
                        <Calendar size={28} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium">No appointments yet.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {appointments.map((a) => (
                            <li key={a.id} className="px-5 py-3.5 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                                    <Calendar size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900">{a.name}</p>
                                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-500 flex-wrap">
                                        <span>{a.service_type || 'Consultation'}</span>
                                        <span>{fmt(a.appointment_date)}{a.appointment_time && ` · ${a.appointment_time}`}</span>
                                        {a.consultant_name && <span className="inline-flex items-center gap-1"><User size={10} /> {a.consultant_name}</span>}
                                        {a.platform && <span className="inline-flex items-center gap-1">{a.platform.toLowerCase().includes('zoom') || a.platform.toLowerCase().includes('meet') ? <Video size={10} /> : <MapPin size={10} />} {a.platform}</span>}
                                    </div>
                                </div>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${STATUS_CHIP[a.status] || STATUS_CHIP.Pending}`}>
                                    {a.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
