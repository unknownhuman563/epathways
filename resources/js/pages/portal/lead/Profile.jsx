import { Head, Link, useForm } from "@inertiajs/react";
import { useState } from "react";
import { User, Mail, Phone, MapPin, Hash, ShieldCheck, Lock, MessageSquare, ChevronDown } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import AvatarUploader from "@/components/AvatarUploader";

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" }) : "—";

export default function LeadProfile({ lead }) {
    const [pwOpen, setPwOpen] = useState(false);
    const pw = useForm({ current_password: "", password: "", password_confirmation: "" });
    const submitPw = (e) => {
        e.preventDefault();
        pw.post("/portal/lead/password", {
            preserveScroll: true,
            onSuccess: () => { pw.reset(); setPwOpen(false); },
        });
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-12">
            <Head title="Profile" />
            <PortalPageHeader
                eyebrow="Account"
                title="Profile"
                description="Your personal details on file with ePathways."
            />

            {/* How to get details changed — Messages is read-only for now, so
                point leads at it to read updates and at email to request edits. */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#009688]/[0.06] border border-[#009688]/15 rounded-2xl px-5 py-4">
                <p className="text-sm text-[#282728]/75 font-light">
                    View messages from your adviser on the Messages page. To reply or correct a detail,
                    email your adviser directly using the address in your welcome email.
                </p>
                <Link
                    href="/portal/lead/messages"
                    className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#009688] text-white text-sm font-medium hover:bg-[#37502b] transition-colors"
                >
                    <MessageSquare size={15} /> Messages
                </Link>
            </div>

            {/* Profile card */}
            <section className="bg-white rounded-2xl border border-[#282728]/15 overflow-hidden">
                <div className="p-6 sm:p-8 flex items-center gap-5">
                    <AvatarUploader accent="bg-[#009688]" />
                    <div className="min-w-0">
                        <h2 className="text-xl font-medium text-[#282728] tracking-tight">{lead.first_name} {lead.last_name}</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{lead.email}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#009688] mt-1.5">
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
                    <ShieldCheck size={16} className="text-[#009688]" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[#282728]">Security</h2>
                </div>
                <ul className="space-y-3">
                    <li className="rounded-xl border border-[#282728]/10 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setPwOpen((v) => !v)}
                            className="w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Lock size={14} className="text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-[#282728]">Password</p>
                                    <p className="text-[11px] text-gray-500">Update your portal password</p>
                                </div>
                            </div>
                            <ChevronDown size={16} className={`text-gray-400 transition-transform ${pwOpen ? "rotate-180" : ""}`} />
                        </button>

                        {pwOpen && (
                            <form onSubmit={submitPw} className="border-t border-[#282728]/10 p-4 space-y-3 bg-gray-50/60">
                                <PwField label="Current password" value={pw.data.current_password}
                                    onChange={(v) => pw.setData("current_password", v)} error={pw.errors.current_password} autoFocus />
                                <PwField label="New password" value={pw.data.password}
                                    onChange={(v) => pw.setData("password", v)} error={pw.errors.password} hint="At least 8 characters." />
                                <PwField label="Confirm new password" value={pw.data.password_confirmation}
                                    onChange={(v) => pw.setData("password_confirmation", v)} />
                                <div className="flex justify-end pt-1">
                                    <button type="submit" disabled={pw.processing}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#009688] text-white text-sm font-medium hover:bg-[#37502b] disabled:opacity-50">
                                        {pw.processing ? "Saving…" : "Update password"}
                                    </button>
                                </div>
                            </form>
                        )}
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

function PwField({ label, value, onChange, error, hint, autoFocus }) {
    return (
        <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 mb-1">{label}</label>
            <input
                type="password"
                value={value}
                autoFocus={autoFocus}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl border border-[#282728]/15 px-3.5 py-2 text-sm focus:ring-2 focus:ring-[#009688] focus:border-[#009688] outline-none"
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            {!error && hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
        </div>
    );
}

function DetailRow({ icon, label, value }) {
    return (
        <div className="bg-white px-6 py-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#009688]/10 text-[#009688] flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 mb-1">{label}</p>
                <p className="text-sm font-medium text-[#282728] truncate">{value}</p>
            </div>
        </div>
    );
}
