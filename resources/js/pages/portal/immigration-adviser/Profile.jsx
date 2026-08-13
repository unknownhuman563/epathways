import { Head } from "@inertiajs/react";
import { User, Mail, Phone, BadgeCheck, AlertTriangle, Info } from "lucide-react";
import SignatureCard from "@/components/SignatureCard";

// Adviser profile — identity, IAA licence details, and the adviser's
// e-signature. Licence data is read-only (admin-managed, so the advice gate is
// not self-certified); the signature is the adviser's own to set.
export default function AdviserProfile({ adviser = {}, licence = {}, signature = null }) {
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
                    <Row label="Last verified" value={licence.verified || "—"} />
                </div>
                <p className="flex items-start gap-2 text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 mt-4">
                    <Info size={13} className="text-gray-400 shrink-0 mt-0.5" />
                    <span>Your licence number and type print on the documents you sign. These details are managed by an administrator — <span className="font-semibold text-gray-700">contact an admin to update them</span>.</span>
                </p>
            </div>

            {/* Adviser e-signature — drawn or uploaded. Shared staff endpoint. */}
            <SignatureCard
                signature={signature}
                saveUrl="/portal/immigration/profile/signature"
                deleteUrl="/portal/immigration/profile/signature"
            />
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
