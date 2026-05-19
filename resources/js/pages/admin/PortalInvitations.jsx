import { useEffect, useMemo, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import {
    Search, UserCheck, UserX, Mail, Clock, Copy, Check, ExternalLink,
    KeyRound, ShieldOff, X, Eye, EyeOff, RefreshCw, AlertTriangle,
} from "lucide-react";

const STATUS_STYLES = {
    pending:  { label: "Pending approval", chip: "bg-amber-100 text-amber-700 border-amber-200" },
    sent:     { label: "Invitation sent",  chip: "bg-blue-100 text-blue-700 border-blue-200" },
    accepted: { label: "Active",           chip: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    revoked:  { label: "Revoked",          chip: "bg-gray-100 text-gray-500 border-gray-200" },
};

const fmt = (iso) => iso ? new Date(iso).toLocaleString("en-NZ", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export default function PortalInvitations({ invitations = [] }) {
    const { flash } = usePage().props;
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [savingId, setSavingId] = useState(null);
    const [copiedFor, setCopiedFor] = useState(null);

    // Flash from approve() includes the setup URL so admin can share it
    // by hand if SMTP isn't configured — common during demo / staging.
    const flashLink = flash?.invitation_link;
    const flashLeadId = flash?.invitation_link_lead_id;

    // Flash from generateCredentials() / resetPassword() — surfaced ONCE
    // via modal; the plain password is never recoverable after this render.
    const [credsModal, setCredsModal] = useState(null);
    useEffect(() => {
        if (flash?.generated_credentials) {
            setCredsModal(flash.generated_credentials);
        }
    }, [flash?.generated_credentials]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return invitations.filter((inv) => {
            if (statusFilter !== "All" && inv.status !== statusFilter) return false;
            if (!q) return true;
            return [inv.name, inv.email, inv.lead_id].filter(Boolean).join(" ").toLowerCase().includes(q);
        });
    }, [invitations, query, statusFilter]);

    const counts = useMemo(() => {
        return invitations.reduce((acc, inv) => { acc[inv.status] = (acc[inv.status] || 0) + 1; return acc; }, {});
    }, [invitations]);

    const post = (url, leadId) => {
        setSavingId(leadId);
        router.post(url, {}, { preserveScroll: true, onFinish: () => setSavingId(null) });
    };

    const copyLink = (url, leadId) => {
        navigator.clipboard?.writeText(url).then(() => {
            setCopiedFor(leadId);
            setTimeout(() => setCopiedFor(null), 2000);
        });
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
            <Head title="Portal Invitations" />

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
                    <KeyRound size={22} className="text-gray-500" />
                    Lead Portal Invitations
                </h1>
                <p className="text-sm text-gray-600 mt-1.5 max-w-2xl">
                    Sales agents request portal access; you approve so the invitation email is sent. Active accounts can be revoked any time.
                </p>
            </div>

            {/* Flash banner — shows the setup link after approval so admin
                can copy/share it manually if mail driver is `log`. */}
            {flashLink && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                        <Mail size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-emerald-900">
                            Invitation sent for {flashLeadId}
                        </p>
                        <p className="text-xs text-emerald-700 mt-1 mb-3">
                            The email is on its way. If your mail driver is set to <code className="bg-white/60 px-1 rounded">log</code>, copy the link below to share manually.
                        </p>
                        <div className="flex items-center gap-2">
                            <input
                                readOnly
                                value={flashLink}
                                className="flex-1 text-xs bg-white border border-emerald-200 rounded-lg px-3 py-2 font-mono text-gray-700 truncate"
                                onClick={(e) => e.target.select()}
                            />
                            <button
                                type="button"
                                onClick={() => copyLink(flashLink, "flash")}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
                            >
                                {copiedFor === "flash" ? <Check size={13} /> : <Copy size={13} />}
                                {copiedFor === "flash" ? "Copied" : "Copy"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Pending" value={counts.pending || 0} icon={<Clock size={13} className="text-amber-500" />} />
                <StatCard label="Sent" value={counts.sent || 0} icon={<Mail size={13} className="text-blue-500" />} />
                <StatCard label="Active" value={counts.accepted || 0} icon={<UserCheck size={13} className="text-emerald-500" />} />
                <StatCard label="Revoked" value={counts.revoked || 0} icon={<ShieldOff size={13} className="text-gray-400" />} />
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search name, email, or lead ID…"
                        className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {["All", "pending", "sent", "accepted", "revoked"].map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setStatusFilter(s)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                                statusFilter === s
                                    ? "bg-gray-900 text-white border-gray-900"
                                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {credsModal && (
                <CredentialsModal
                    credentials={credsModal}
                    onClose={() => setCredsModal(null)}
                />
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50/80 border-b border-gray-100">
                            <tr className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Lead</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Requested by</th>
                                <th className="px-6 py-4">Approved by</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-400">
                                            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                                                <KeyRound size={22} />
                                            </div>
                                            <p className="text-sm font-medium">
                                                {invitations.length === 0
                                                    ? "No invitations yet. Sales agents request access from the lead detail page."
                                                    : "No invitations match your filters."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {filtered.map((inv) => {
                                const style = STATUS_STYLES[inv.status] || STATUS_STYLES.pending;
                                const isSaving = savingId === inv.id;
                                return (
                                    <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">{inv.name}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{inv.email}</div>
                                            <div className="text-[11px] text-gray-300 font-mono mt-0.5">{inv.lead_id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold border ${style.chip}`}>
                                                {style.label}
                                            </span>
                                            {inv.status === "sent" && inv.expires_at && (
                                                <div className="text-[11px] text-gray-400 mt-1.5">
                                                    Expires {fmt(inv.expires_at)}
                                                </div>
                                            )}
                                            {inv.status === "accepted" && inv.accepted_at && (
                                                <div className="text-[11px] text-gray-400 mt-1.5">
                                                    Joined {fmt(inv.accepted_at)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-600">
                                            <div className="font-medium">{inv.requested_by || "—"}</div>
                                            <div className="text-gray-400 mt-0.5">{fmt(inv.requested_at)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-600">
                                            <div className="font-medium">{inv.approved_by || "—"}</div>
                                            <div className="text-gray-400 mt-0.5">{fmt(inv.approved_at)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex items-center gap-2 justify-end">
                                                {inv.status === "pending" && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            disabled={isSaving}
                                                            onClick={() => post(`/admin/leads/${inv.id}/portal-invitation/approve`, inv.id)}
                                                            title="Send invitation email — lead clicks the link to set their own password"
                                                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                                        >
                                                            <UserCheck size={13} />
                                                            Approve
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={isSaving}
                                                            onClick={() => {
                                                                if (confirm(`Generate login credentials for ${inv.name}? You'll share email + password with them directly. The password will be shown ONCE.`)) {
                                                                    post(`/admin/leads/${inv.id}/portal-invitation/generate-credentials`, inv.id);
                                                                }
                                                            }}
                                                            title="Generate email + password directly — skip the email-link setup flow"
                                                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                                                        >
                                                            <KeyRound size={13} />
                                                            Generate
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={isSaving}
                                                            onClick={() => post(`/admin/leads/${inv.id}/portal-invitation/reject`, inv.id)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                                                        >
                                                            <UserX size={13} />
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {(inv.status === "sent" || inv.status === "accepted") && (
                                                    <>
                                                        {inv.has_account && (
                                                            <button
                                                                type="button"
                                                                disabled={isSaving}
                                                                onClick={() => {
                                                                    if (confirm(`Reset password for ${inv.name}? A new password will be generated and shown ONCE. Their old password will stop working immediately.`)) {
                                                                        post(`/admin/leads/${inv.id}/portal-invitation/reset-password`, inv.id);
                                                                    }
                                                                }}
                                                                title="Generate a new password — old one stops working"
                                                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:border-amber-300 hover:text-amber-700 transition-colors disabled:opacity-50"
                                                            >
                                                                <RefreshCw size={13} />
                                                                Reset
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            disabled={isSaving}
                                                            onClick={() => {
                                                                if (confirm(`Revoke portal access for ${inv.name}? They won't be able to log in.`)) {
                                                                    post(`/admin/leads/${inv.id}/portal-invitation/revoke`, inv.id);
                                                                }
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:border-red-300 hover:text-red-700 transition-colors disabled:opacity-50"
                                                        >
                                                            <ShieldOff size={13} />
                                                            Revoke
                                                        </button>
                                                    </>
                                                )}
                                                {inv.status === "revoked" && (
                                                    <button
                                                        type="button"
                                                        disabled={isSaving}
                                                        onClick={() => {
                                                            if (confirm(`Reactivate ${inv.name}'s account by generating a new password? They can use it to log in again.`)) {
                                                                post(`/admin/leads/${inv.id}/portal-invitation/reset-password`, inv.id);
                                                            }
                                                        }}
                                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:border-emerald-300 hover:text-emerald-700 transition-colors disabled:opacity-50"
                                                    >
                                                        <RefreshCw size={13} />
                                                        Reactivate
                                                    </button>
                                                )}
                                                <a
                                                    href={`/admin/leads/${inv.id}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors"
                                                >
                                                    <ExternalLink size={13} />
                                                    Lead
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ── Credentials reveal modal ─────────────────────────────────────────────
// Shows email + plain password ONCE. The password isn't stored in
// recoverable form — closing the modal means it's gone forever.

function CredentialsModal({ credentials, onClose }) {
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(null);

    const copy = (key, text) => {
        navigator.clipboard?.writeText(text).then(() => {
            setCopied(key);
            setTimeout(() => setCopied(null), 2000);
        });
    };

    const copyBoth = () => {
        const txt = `ePathways Portal\nLogin URL: ${window.location.origin}/login\nEmail: ${credentials.email}\nPassword: ${credentials.password}`;
        copy("both", txt);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <div className="bg-white sm:rounded-2xl rounded-t-2xl w-full max-w-lg shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
                            <KeyRound size={18} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Account credentials</h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Login created for <strong>{credentials.name}</strong> ({credentials.lead_id}).
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                        <X size={16} />
                    </button>
                </div>

                {/* One-shot warning */}
                <div className="mx-6 mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-900 leading-relaxed">
                        <strong>Copy now.</strong> The password is hashed in the database and cannot be retrieved after you close this dialog. If lost, use <strong>Reset</strong> to generate a new one.
                    </p>
                </div>

                {/* Email row */}
                <div className="p-6 pb-3">
                    <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 mb-2">Email</label>
                    <div className="flex items-center gap-2">
                        <input
                            readOnly
                            value={credentials.email}
                            onClick={(e) => e.target.select()}
                            className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-3 font-medium text-gray-900 cursor-pointer"
                        />
                        <button
                            type="button"
                            onClick={() => copy("email", credentials.email)}
                            className="inline-flex items-center gap-1.5 px-4 py-3 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors"
                        >
                            {copied === "email" ? <Check size={13} /> : <Copy size={13} />}
                            {copied === "email" ? "Copied" : "Copy"}
                        </button>
                    </div>
                </div>

                {/* Password row */}
                <div className="px-6 pb-6">
                    <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 mb-2">Password</label>
                    <div className="flex items-center gap-2">
                        <input
                            readOnly
                            type={showPassword ? "text" : "password"}
                            value={credentials.password}
                            onClick={(e) => e.target.select()}
                            className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-3 font-mono font-semibold tracking-wider text-gray-900 cursor-pointer"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="inline-flex items-center justify-center w-11 h-11 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                            title={showPassword ? "Hide" : "Show"}
                        >
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                            type="button"
                            onClick={() => copy("password", credentials.password)}
                            className="inline-flex items-center gap-1.5 px-4 py-3 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors"
                        >
                            {copied === "password" ? <Check size={13} /> : <Copy size={13} />}
                            {copied === "password" ? "Copied" : "Copy"}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={copyBoth}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors"
                    >
                        {copied === "both" ? <Check size={14} /> : <Copy size={14} />}
                        {copied === "both" ? "Copied login URL + credentials" : "Copy URL + email + password"}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 mb-2 flex items-center gap-1.5">
                {icon} {label}
            </div>
            <div className="text-2xl font-medium text-gray-900 tracking-tight tabular-nums">{value}</div>
        </div>
    );
}
