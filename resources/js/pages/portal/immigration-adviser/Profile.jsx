import { Head } from "@inertiajs/react";
import { User, Mail, Phone, BadgeCheck, AlertTriangle } from "lucide-react";

// Adviser profile — identity + IAA licence details. Licence data is read-only
// here (managed by an admin); it's what gates advice-bearing sign-off.
export default function AdviserProfile({ adviser = {}, licence = {} }) {
    return (
        <div className="max-w-[720px] mx-auto pb-12 space-y-5">
            <Head title="My profile" />
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">My profile</h1>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-3">
                <Row icon={<User size={16} />} label="Name" value={adviser.name} />
                <Row icon={<Mail size={16} />} label="Email" value={adviser.email} />
                <Row icon={<Phone size={16} />} label="Phone" value={adviser.phone || "—"} />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-900">IAA licence</h2>
                    {licence.number ? (
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-lg px-2.5 py-1 border ${licence.current ? "text-[#009688] bg-[#009688]/10 border-[#009688]/30" : "text-amber-700 bg-amber-50 border-amber-200"}`}>
                            <BadgeCheck size={13} /> {licence.current ? "Current" : "Expired"}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
                            <AlertTriangle size={13} /> Not set
                        </span>
                    )}
                </div>
                <div className="space-y-3">
                    <Row label="Licence number" value={licence.number || "—"} />
                    <Row label="Licence type" value={licence.type || "—"} />
                    <Row label="Expiry" value={licence.expiry || "—"} />
                </div>
                <p className="text-[11px] text-gray-400 mt-4">Licence details are maintained by an administrator.</p>
            </div>
        </div>
    );
}

function Row({ icon = null, label, value }) {
    return (
        <div className="flex items-center gap-3">
            {icon && <span className="text-gray-400">{icon}</span>}
            <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide w-36 flex-shrink-0">{label}</span>
            <span className="text-sm text-gray-900">{value}</span>
        </div>
    );
}
