import { Head } from "@inertiajs/react";
import { User, Mail, Phone, MapPin, Hash, ShieldCheck, Lock } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import AvatarUploader from "@/components/AvatarUploader";

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" }) : "—";

export default function LeadProfile({ lead }) {
    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-12">
            <Head title="Profile" />
            <PortalPageHeader
                eyebrow="Account"
                title="Profile"
                description="Your personal details on file with ePathways. Need to update something? Message your adviser."
            />

            {/* Profile card */}
            <section className="bg-white rounded-2xl border border-[#282728]/15 overflow-hidden">
                <div className="p-6 sm:p-8 flex items-center gap-5">
                    <AvatarUploader accent="bg-[#436235]" />
                    <div className="min-w-0">
                        <h2 className="text-xl font-medium text-[#282728] tracking-tight">{lead.first_name} {lead.last_name}</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{lead.email}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#436235] mt-1.5">
                            <Hash size={9} className="inline" /> {lead.lead_id}
                        </p>
                    </div>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#282728]/10 border-t border-[#282728]/10">
                    <DetailRow icon={<Mail size={14} />} label="Email" value={lead.email || '—'} />
                    <DetailRow icon={<Phone size={14} />} label="Phone" value={lead.phone || '—'} />
                    <DetailRow icon={<MapPin size={14} />} label="Country" value={lead.residence_country || '—'} />
                    <DetailRow icon={<User size={14} />} label="Joined" value={fmtDate(lead.created_at)} />
                </dl>
            </section>

            {/* Security card — placeholder for password / 2FA */}
            <section className="bg-white rounded-2xl border border-[#282728]/15 p-6">
                <div className="flex items-center gap-2.5 mb-4">
                    <ShieldCheck size={16} className="text-[#436235]" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[#282728]">Security</h2>
                </div>
                <ul className="space-y-3">
                    <li className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#282728]/10">
                        <div className="flex items-center gap-3">
                            <Lock size={14} className="text-gray-400" />
                            <div>
                                <p className="text-sm font-medium text-[#282728]">Password</p>
                                <p className="text-[11px] text-gray-500">Update your portal password</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Coming soon</span>
                    </li>
                    <li className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#282728]/10">
                        <div className="flex items-center gap-3">
                            <ShieldCheck size={14} className="text-gray-400" />
                            <div>
                                <p className="text-sm font-medium text-[#282728]">Two-factor authentication</p>
                                <p className="text-[11px] text-gray-500">Add an extra layer of protection</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Coming soon</span>
                    </li>
                </ul>
            </section>
        </div>
    );
}

function DetailRow({ icon, label, value }) {
    return (
        <div className="bg-white px-6 py-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#436235]/10 text-[#436235] flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 mb-1">{label}</p>
                <p className="text-sm font-medium text-[#282728] truncate">{value}</p>
            </div>
        </div>
    );
}
