import { useState } from "react";
import { Head } from "@inertiajs/react";
import { User, Mail, Briefcase, ShieldCheck, Lock, Phone, Link as LinkIcon, Copy, Check } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import AvatarUploader from "@/components/AvatarUploader";

export default function AgentProfile({ user, referral = null }) {
    const [copied, setCopied] = useState(false);

    const copyReferral = async () => {
        if (! referral?.url) return;
        try {
            await navigator.clipboard.writeText(referral.url);
        } catch (e) {
            const t = document.createElement("textarea");
            t.value = referral.url;
            document.body.appendChild(t);
            t.select();
            document.execCommand("copy");
            document.body.removeChild(t);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-12">
            <Head title="My Profile — Agent" />
            <PortalPageHeader
                eyebrow="Account"
                title="My Profile"
                description="Your recruiting agent account on ePathways."
            />

            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 flex items-center gap-5">
                    <AvatarUploader accent="bg-teal-600" />
                    <div className="min-w-0">
                        <h2 className="text-xl font-medium text-gray-900 tracking-tight">{user?.name || "—"}</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{user?.email || "—"}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-teal-600 mt-1.5">
                            <Briefcase size={9} className="inline" /> {user?.role || "agent"}
                        </p>
                    </div>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-100 border-t border-gray-100">
                    <Row icon={<User size={14} />} label="Name" value={user?.name || "—"} />
                    <Row icon={<Mail size={14} />} label="Email" value={user?.email || "—"} />
                    <Row icon={<Phone size={14} />} label="Phone" value={user?.phone || "—"} />
                    <Row icon={<Briefcase size={14} />} label="Role" value={user?.role || "agent"} />
                </dl>
            </section>

            {/* Referral link — same URL the dashboard card shows; kept
                here too so agents can find it under Account. */}
            {referral?.url && (
                <section className="bg-gray-900 text-white rounded-2xl shadow-sm border border-gray-800 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center gap-2.5 mb-4">
                            <LinkIcon size={16} className="text-emerald-300" />
                            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-white">Your referral link</h2>
                        </div>
                        <p className="text-[13px] text-gray-300 mb-4 leading-relaxed">
                            Share this link with prospective leads. Anyone who registers through it will be
                            automatically attributed to your account so Sales can follow up with you.
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 font-mono text-[12px] text-emerald-100 truncate" title={referral.url}>
                                {referral.url}
                            </div>
                            <button
                                type="button"
                                onClick={copyReferral}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-[12px] font-bold transition-colors flex-shrink-0 ${
                                    copied
                                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                        : "bg-white text-gray-900 hover:bg-gray-100"
                                }`}
                            >
                                {copied ? <><Check size={13} strokeWidth={3} /> Copied</> : <><Copy size={13} /> Copy link</>}
                            </button>
                        </div>
                        {referral.code && (
                            <div className="mt-3 text-[11px] text-gray-400 flex items-center gap-2">
                                <span className="uppercase tracking-wider text-[10px] font-bold">Code</span>
                                <span className="font-mono font-semibold text-white bg-white/10 px-2 py-0.5 rounded">{referral.code}</span>
                            </div>
                        )}
                    </div>
                </section>
            )}

            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2.5 mb-4">
                    <ShieldCheck size={16} className="text-teal-600" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-gray-900">Security</h2>
                </div>
                <ul className="space-y-3">
                    <li className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <Lock size={14} className="text-gray-400" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">Password</p>
                                <p className="text-[11px] text-gray-500">Update your account password</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Coming soon</span>
                    </li>
                    <li className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <ShieldCheck size={14} className="text-gray-400" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">Two-factor authentication</p>
                                <p className="text-[11px] text-gray-500">Add an extra step to sign-in</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Coming soon</span>
                    </li>
                </ul>
            </section>
        </div>
    );
}

function Row({ icon, label, value }) {
    return (
        <div className="bg-white px-6 py-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 mb-1">{label}</p>
                <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
            </div>
        </div>
    );
}
