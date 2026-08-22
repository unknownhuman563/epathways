import { Head } from "@inertiajs/react";
import { Mail, Phone, MapPin, UserSquare2 } from "lucide-react";

const initials = (n = "") => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "—";

// Sub-agent profile — read-only account + the agent they work under.
export default function Profile({ user = {}, agent = null }) {
    return (
        <div className="space-y-6 max-w-[720px] mx-auto pb-12">
            <Head title="My Profile" />

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                        {user.avatar_url ? <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" /> : initials(user.name)}
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold text-gray-900 truncate">{user.name}</h1>
                        <p className="text-sm text-gray-500">Sub-agent</p>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <Field icon={<Mail size={14} />} label="Email" value={user.email} />
                    <Field icon={<Phone size={14} />} label="Phone" value={user.phone} />
                    <Field icon={<MapPin size={14} />} label="Location" value={user.location} />
                    <Field icon={<UserSquare2 size={14} />} label="Works under agent" value={agent ? `${agent.name}${agent.referral_code ? ` · ${agent.referral_code}` : ""}` : "Not assigned"} />
                </div>
            </div>
        </div>
    );
}

function Field({ icon, label, value }) {
    return (
        <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 inline-flex items-center gap-1.5">
                <span className="text-gray-400">{icon}</span>{label}
            </div>
            <div className="text-[13px] text-gray-900 mt-1 break-words">{value || "—"}</div>
        </div>
    );
}
