import { useState, useMemo } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import {
    Sparkles, RefreshCw, ShieldAlert, AlertTriangle, Info, X, Check,
    ArrowRight, EyeOff, HelpCircle,
} from "lucide-react";
import CaseHealthBadge from "@/components/ai/CaseHealthBadge";

const fmtWhen = (iso) => {
    if (! iso) return "never";
    const d = new Date(iso);
    return d.toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

// Severity → visual identity. Blocking is loud, check is amber, info is quiet.
const SEV = {
    blocking: { icon: ShieldAlert, chip: "bg-rose-50 text-rose-700 border-rose-200", dot: "text-rose-500", label: "Blocking" },
    check:    { icon: AlertTriangle, chip: "bg-amber-50 text-amber-700 border-amber-200", dot: "text-amber-500", label: "Check" },
    info:     { icon: Info, chip: "bg-gray-50 text-gray-600 border-gray-200", dot: "text-gray-400", label: "Info" },
};

// A finding's one-click action — deep-links to the surface where staff resolve
// it. Unknown keys just get no action button (still dismissable).
function actionFor(f, leadId) {
    const base = `/portal/immigration/cases/${leadId}/profile`;
    const k = f.finding_key || "";
    if (k.startsWith("checklist_missing") || k.startsWith("doc_rejected") || k.startsWith("doc_request_unanswered")) {
        return { label: "Open documents", href: `${base}?tab=documents` };
    }
    if (k === "passport_expiring") return { label: "Open profile", href: `${base}?tab=personal` };
    if (k === "no_contact") return { label: "Open messages", href: `${base}?tab=communications` };
    if (k === "engagement_no_invoice") return { label: "Go to invoicing", href: "/portal/immigration/cases/invoice" };
    return null;
}

// Compact provenance line from the evidence bag — "police_cert · Doc #12".
function evidenceLine(evidence = {}) {
    const parts = [];
    for (const [key, val] of Object.entries(evidence)) {
        if (val === null || val === undefined || val === "") continue;
        if (Array.isArray(val)) { if (val.length) parts.push(`${key}: ${val.join(", ")}`); continue; }
        parts.push(key === "document_id" ? `Doc #${val}` : `${val}`);
    }
    return parts.join(" · ");
}

const AUDIENCE_FILTERS = [
    { key: "all", label: "All" },
    { key: "staff", label: "To chase" },
    { key: "adviser", label: "To decide" },
];

export default function AIHealthTab({ lead, findings = { items: [], evaluated_at: null, couldnt_verify: [] } }) {
    const [audience, setAudience] = useState("all");
    const [busy, setBusy] = useState(false);
    const [dismissing, setDismissing] = useState(null); // finding id being dismissed
    const [reason, setReason] = useState("");

    const items = useMemo(() => {
        const list = findings.items || [];
        if (audience === "all") return list;
        // Either role can see the full list; the filter narrows to what's
        // theirs, treating "both" as visible to each.
        return list.filter((f) => f.audience === audience || f.audience === "both");
    }, [findings.items, audience]);

    if (! lead?.id) return null;

    const reevaluate = () => {
        setBusy(true);
        router.post(`/portal/immigration/cases/${lead.id}/findings/reevaluate`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success("Re-checking — findings refresh shortly."),
            onError: () => toast.error("Could not start a re-check."),
            onFinish: () => setBusy(false),
        });
    };

    const dismiss = (f) => {
        if (! reason.trim()) return;
        router.post(`/portal/immigration/cases/${lead.id}/findings/${f.id}/dismiss`, { reason }, {
            preserveScroll: true,
            onSuccess: () => { setDismissing(null); setReason(""); },
            onError: () => toast.error("Could not dismiss."),
        });
    };

    return (
        <div className="space-y-6">
            {/* ── Case checks (rules) ── */}
            <section>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <h2 className="text-base font-bold text-gray-900 inline-flex items-center gap-2">
                            <Sparkles size={15} className="text-gray-400" /> Case checks
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Rule-based checks on this case · last run {fmtWhen(findings.evaluated_at)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                            {AUDIENCE_FILTERS.map((a) => (
                                <button key={a.key} type="button" onClick={() => setAudience(a.key)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                                        audience === a.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
                                    }`}>
                                    {a.label}
                                </button>
                            ))}
                        </div>
                        <button type="button" onClick={reevaluate} disabled={busy}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
                            <RefreshCw size={12} className={busy ? "animate-spin" : ""} /> Re-check
                        </button>
                    </div>
                </div>

                <div className="mt-4 space-y-2">
                    {items.length === 0 ? (
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
                            <Check size={15} /> Nothing to action in what the checks could read.
                        </div>
                    ) : items.map((f) => {
                        const sev = SEV[f.severity] || SEV.info;
                        const SevIcon = sev.icon;
                        const action = actionFor(f, lead.id);
                        const ev = evidenceLine(f.evidence);
                        return (
                            <div key={f.id} className="rounded-xl border border-gray-200 bg-white p-3.5">
                                <div className="flex items-start gap-3">
                                    <SevIcon size={16} className={`${sev.dot} mt-0.5 flex-shrink-0`} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${sev.chip}`}>{sev.label}</span>
                                            {f.category && <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{f.category}</span>}
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 mt-1">{f.title}</p>
                                        {f.detail && <p className="text-xs text-gray-600 mt-0.5">{f.detail}</p>}
                                        {ev && <p className="text-[10.5px] text-gray-400 font-mono mt-1 truncate" title={ev}>{ev}</p>}

                                        {dismissing === f.id ? (
                                            <div className="mt-2.5 flex items-center gap-2">
                                                <input autoFocus value={reason} onChange={(e) => setReason(e.target.value)}
                                                    placeholder="Reason for dismissing (required)…"
                                                    className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:bg-white focus:border-gray-300" />
                                                <button type="button" disabled={! reason.trim()} onClick={() => dismiss(f)}
                                                    className="px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-semibold hover:bg-black disabled:opacity-40">Confirm</button>
                                                <button type="button" onClick={() => { setDismissing(null); setReason(""); }}
                                                    className="p-1.5 text-gray-400 hover:text-gray-700"><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <div className="mt-2.5 flex items-center gap-3">
                                                {action && (
                                                    <a href={action.href} className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 hover:text-gray-900">
                                                        {action.label} <ArrowRight size={12} />
                                                    </a>
                                                )}
                                                <button type="button" onClick={() => { setDismissing(f.id); setReason(""); }}
                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-gray-700">
                                                    <EyeOff size={12} /> Dismiss
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Required "couldn't verify" line — the panel must never read as
                    "clean" when it means "nothing found in what I could read". */}
                <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 inline-flex items-center gap-1.5">
                        <HelpCircle size={12} /> Couldn't verify
                    </p>
                    {(findings.couldnt_verify || []).length === 0 ? (
                        <p className="text-[11px] text-gray-400 mt-1">Every check ran against available data.</p>
                    ) : (
                        <ul className="mt-1.5 space-y-1">
                            {findings.couldnt_verify.map((c, i) => (
                                <li key={i} className="text-[11px] text-gray-500 flex items-start gap-1.5">
                                    <span className="text-gray-300 mt-0.5">•</span> {c}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            {/* ── AI case health (existing) ── */}
            <section className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">AI health badge</span>
                    <CaseHealthBadge caseId={lead.id} />
                </div>
            </section>
        </div>
    );
}
