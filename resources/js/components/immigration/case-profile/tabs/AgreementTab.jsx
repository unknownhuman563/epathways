import { useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import {
    FileSignature, Plus, Eye, Download, Send, X, Check,
    AlertCircle, Globe, FileText,
} from "lucide-react";
import GenerateAgreementModal from "@/components/immigration/case-profile/GenerateAgreementModal";

// Build 11.D Phase 2 — Managed agreement list for the case.
// Phase 3 layers on signing audit-trail UI (signer name / IP / signed PDF).

const STATUS_META = {
    draft:   { label: "Draft",   tone: "bg-gray-100 text-gray-700 border-gray-200",     icon: FileText },
    sent:    { label: "Sent",    tone: "bg-blue-50 text-blue-700 border-blue-200",      icon: Send },
    viewed:  { label: "Viewed",  tone: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: Eye },
    signed:  { label: "Signed",  tone: "bg-gray-900 text-white border-gray-900",        icon: Check },
    voided:  { label: "Voided",  tone: "bg-gray-50 text-gray-500 border-gray-200",      icon: X },
    expired: { label: "Expired", tone: "bg-red-50 text-red-700 border-red-200",         icon: AlertCircle },
};

export default function AgreementTab({ lead, agreements = [] }) {
    const [showModal, setShowModal] = useState(false);
    const [busyId, setBusyId] = useState(null);

    const refresh = () => router.reload({ only: ["agreements"] });

    const handleSend = async (a) => {
        if (! confirm(`Send "${a.title}" to ${lead.first_name || "the client"}? A signing link will be generated.`)) return;
        setBusyId(a.id);
        try {
            await postJson(`/portal/immigration/cases/${lead.id}/agreements/${a.id}/send`);
            toast.success("Agreement sent");
            refresh();
        } catch (err) {
            toast.error(err?.message || "Failed to send");
        } finally {
            setBusyId(null);
        }
    };

    const handleVoid = async (a) => {
        const reason = prompt(`Void "${a.title}"? Enter a short reason:`);
        if (! reason) return;
        setBusyId(a.id);
        try {
            await postJson(`/portal/immigration/cases/${lead.id}/agreements/${a.id}/void`, { reason });
            toast.success("Agreement voided");
            refresh();
        } catch (err) {
            toast.error(err?.message || "Failed to void");
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <h2 className="text-base font-bold text-gray-900 inline-flex items-center gap-2">
                        <FileSignature size={15} className="text-gray-400" />
                        Consultancy Agreements
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Generate from a template, send to the client, track signing.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-gray-900 text-white hover:bg-black transition-colors"
                >
                    <Plus size={13} /> Generate new agreement
                </button>
            </div>

            {agreements.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <FileSignature size={32} className="mx-auto text-gray-300" />
                    <p className="mt-3 text-sm font-semibold text-gray-700">No agreements yet</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        Click "Generate new agreement" to create the first one from a template.
                    </p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {agreements.map((a) => (
                        <AgreementCard
                            key={a.id}
                            agreement={a}
                            lead={lead}
                            busy={busyId === a.id}
                            onSend={() => handleSend(a)}
                            onVoid={() => handleVoid(a)}
                        />
                    ))}
                </ul>
            )}

            {showModal && (
                <GenerateAgreementModal
                    lead={lead}
                    onClose={() => setShowModal(false)}
                    onGenerated={() => {
                        setShowModal(false);
                        refresh();
                        toast.success("Agreement generated as draft");
                    }}
                />
            )}
        </div>
    );
}

function AgreementCard({ agreement: a, lead, busy, onSend, onVoid }) {
    const meta = STATUS_META[a.status] || STATUS_META.draft;
    const Icon = meta.icon;
    const isDraft  = a.status === "draft";
    const isLive   = a.status === "sent" || a.status === "viewed";
    const isSigned = a.status === "signed";
    const isVoided = a.status === "voided";

    return (
        <li
            id={`agreement-${a.id}`}
            className={`px-4 py-3.5 rounded-xl border bg-white ${
                isVoided ? "border-gray-100 opacity-70" : "border-gray-100"
            }`}
        >
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-sm font-bold ${isVoided ? "text-gray-500 line-through" : "text-gray-900"}`}>
                            {a.title}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${meta.tone}`}>
                            <Icon size={10} />
                            {meta.label}
                        </span>
                        {a.template?.visa_type && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-gray-500 bg-gray-50 border border-gray-100">
                                <Globe size={10} /> {a.template.visa_type}
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                        Generated by {a.generated_by || "Unknown"} · {fmtDateTime(a.created_at)}
                        {a.sent_at && <> · Sent {fmtDateTime(a.sent_at)}</>}
                        {a.viewed_at && <> · Viewed {fmtDateTime(a.viewed_at)}</>}
                        {a.signed_at && <> · Signed {fmtDateTime(a.signed_at)}</>}
                    </p>

                    {isSigned && (
                        <div className="mt-2 px-3 py-2 rounded-md bg-gray-50 border border-gray-100 text-[11px] text-gray-700 space-y-0.5">
                            <p><span className="text-gray-500">Signer name:</span> <span className="font-semibold">{a.signer_name || "—"}</span></p>
                            {a.signer_ip && <p><span className="text-gray-500">IP:</span> <span className="font-mono">{a.signer_ip}</span></p>}
                            {a.signer_user_agent && (
                                <p className="truncate"><span className="text-gray-500">Browser:</span> <span className="font-mono text-[10.5px]">{a.signer_user_agent}</span></p>
                            )}
                            {a.has_signed_pdf && (
                                <p className="text-[10.5px] text-emerald-700 mt-1">✓ Signed PDF with embedded signature available — use the "Signed PDF" button.</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 flex-wrap">
                    {a.has_pdf && (
                        <>
                            <a
                                href={`/portal/immigration/cases/${lead.id}/agreements/${a.id}/pdf?inline=1`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={a.has_signed_pdf ? "View signed PDF in browser" : "View PDF in browser"}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                            >
                                <Eye size={11} /> View
                            </a>
                            <a
                                href={`/portal/immigration/cases/${lead.id}/agreements/${a.id}/pdf`}
                                title="Download PDF"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                            >
                                <Download size={11} />
                                {a.has_signed_pdf ? "Signed" : "PDF"}
                            </a>
                        </>
                    )}
                    {isDraft && (
                        <button
                            type="button"
                            onClick={onSend}
                            disabled={busy}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-gray-900 text-white hover:bg-black disabled:opacity-50"
                        >
                            <Send size={11} /> Send
                        </button>
                    )}
                    {(isDraft || isLive) && (
                        <button
                            type="button"
                            onClick={onVoid}
                            disabled={busy}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50"
                        >
                            <X size={11} /> Void
                        </button>
                    )}
                </div>
            </div>
        </li>
    );
}

const fmtDateTime = (iso) =>
    iso ? new Date(iso).toLocaleString("en-NZ", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

// CSRF: prefer the XSRF-TOKEN cookie (Laravel rotates it on every response,
// so it stays fresh across long-lived SPA sessions). Fall back to the meta
// tag rendered by app.blade.php for the first-paint case. The cookie value
// is URL-encoded; the X-XSRF-TOKEN header expects the decoded form and
// Laravel's VerifyCsrfToken middleware decrypts it.
function csrfHeaders() {
    const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="));
    const xsrf = cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
    const meta = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
    return xsrf
        ? { "X-XSRF-TOKEN": xsrf, "X-CSRF-TOKEN": meta }
        : { "X-CSRF-TOKEN": meta };
}

async function postJson(url, body = {}) {
    const res = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            ...csrfHeaders(),
        },
        body: JSON.stringify(body),
    });
    if (! res.ok) {
        let err;
        try { err = await res.json(); } catch { err = {}; }
        const msg = err.message || (err.missing ? `Missing: ${err.missing.join(", ")}` : `HTTP ${res.status}`);
        throw new Error(msg);
    }
    return res.json();
}
