import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { User, Mail, Briefcase, ShieldCheck, Lock, BadgeCheck } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import AvatarUploader from "@/components/AvatarUploader";

export default function ImmigrationProfile({ user }) {
    const initial = (user?.name || "?").slice(0, 1).toUpperCase();
    const [form, setForm] = useState({
        iaa_licence_number: user?.iaa_licence_number || "",
        iaa_licence_expiry: user?.iaa_licence_expiry ? String(user.iaa_licence_expiry).slice(0, 10) : "",
    });
    const [saving, setSaving] = useState(false);

    const submit = (e) => {
        e?.preventDefault?.();
        setSaving(true);
        router.post('/portal/immigration/profile', form, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setSaving(false),
        });
    };
    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-12">
            <Head title="My Profile — Immigration" />
            <PortalPageHeader eyebrow="Account" title="My Profile" description="Your staff account on ePathways." />

            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 flex items-center gap-5">
                    <AvatarUploader accent="bg-amber-600" />
                    <div className="min-w-0">
                        <h2 className="text-xl font-medium text-gray-900 tracking-tight">{user?.name || "—"}</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{user?.email || "—"}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-600 mt-1.5">
                            <Briefcase size={9} className="inline" /> {user?.role || "staff"}
                        </p>
                    </div>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-100 border-t border-gray-100">
                    <Row icon={<User size={14} />} label="Name"  value={user?.name  || "—"} />
                    <Row icon={<Mail size={14} />} label="Email" value={user?.email || "—"} />
                </dl>
            </section>

            {/* IAA licence — real, editable. Surfaces on the dashboard
                compliance card and on every case the adviser views. */}
            <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                        <BadgeCheck size={16} className="text-amber-600" />
                        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-gray-900">IAA licence</h2>
                    </div>
                    <button type="submit" disabled={saving} className="px-4 py-1.5 bg-amber-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-amber-700 disabled:opacity-40">
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
                <p className="text-[11px] text-gray-500">
                    Required for NZ-licensed Immigration Advisers. Shows on every case you view and triggers an expiry alert 60 days out.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                        <span className="block text-[11px] font-semibold text-gray-600 mb-1.5">Licence number</span>
                        <input
                            type="text"
                            value={form.iaa_licence_number}
                            onChange={(e) => setForm((f) => ({ ...f, iaa_licence_number: e.target.value }))}
                            placeholder="e.g. 201912345"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono outline-none focus:border-amber-500"
                        />
                    </label>
                    <label className="block">
                        <span className="block text-[11px] font-semibold text-gray-600 mb-1.5">Expiry date</span>
                        <input
                            type="date"
                            value={form.iaa_licence_expiry}
                            onChange={(e) => setForm((f) => ({ ...f, iaa_licence_expiry: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-500"
                        />
                    </label>
                </div>
            </form>

            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2.5 mb-4">
                    <ShieldCheck size={16} className="text-amber-600" />
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
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 mb-1">{label}</p>
                <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
            </div>
        </div>
    );
}
