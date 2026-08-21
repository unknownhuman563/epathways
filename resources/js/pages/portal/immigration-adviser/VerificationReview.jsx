import { useEffect, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { toast } from "sonner";
import {
    ArrowLeft, ChevronLeft, ChevronRight, FileText, CheckCircle2, Loader2, Sparkles, ShieldCheck, ShieldAlert, RefreshCw,
} from "lucide-react";

const REASON_CHIPS = ["Not the required document", "Suspected alteration", "Does not meet INZ criteria"];

const initials = (n = "") => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "—";
const docLabel = (d) => (d?.checklist_key
    ? d.checklist_key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : (d?.original_name || "Document").replace(/\.[^.]+$/, ""));
const relWait = (iso) => {
    if (!iso) return "—";
    const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
    if (h < 1) return "just now";
    if (h < 24) return `${h} hour${h === 1 ? "" : "s"}`;
    const d = Math.floor(h / 24);
    return `${d} day${d === 1 ? "" : "s"}`;
};
const xsrf = () => decodeURIComponent((document.cookie.match(/XSRF-TOKEN=([^;]+)/) || [])[1] || "");

// Full-page document review for one case. Left: the document (dark viewer).
// Right: the manager's real referral note, the AI "document vs client record"
// scan, and the licensed verdict. The AI scan is on demand and indicative only.
export default function VerificationReview({ case: kase = {}, documents = [], licence = {}, ai_enabled = false }) {
    const [docs, setDocs] = useState(documents);
    const [idx, setIdx] = useState(0);
    const [verdict, setVerdict] = useState(null); // 'approve' | 'reject'
    const [clientMsg, setClientMsg] = useState("");
    const [teamNote, setTeamNote] = useState("");
    const [reasons, setReasons] = useState([]);
    const [attested, setAttested] = useState(false);
    const [busy, setBusy] = useState(false);
    const [zoom, setZoom] = useState(88);
    const [rotate, setRotate] = useState(0);
    const [scans, setScans] = useState({}); // docId -> { loading, ok, rows, conflicts, error }

    const d = docs[idx] || null;
    const isPdf = (d?.mime || "").includes("pdf");
    const isImage = (d?.mime || "").startsWith("image/");
    const referrer = d?.referred_by || docs.map((x) => x.referred_by).find(Boolean) || null;
    const referredAt = d?.checked_at || docs.map((x) => x.checked_at).filter(Boolean).sort()[0] || null;
    const flaggedCount = docs.filter((x) => x.note).length;

    // Reset the decision panel when switching documents.
    useEffect(() => { setVerdict(null); setClientMsg(""); setTeamNote(""); setReasons([]); setAttested(false); setZoom(88); setRotate(0); }, [idx]);

    const toggleReason = (r) => setReasons((s) => (s.includes(r) ? s.filter((x) => x !== r) : [...s, r]));

    const scan = d ? scans[d.id] : null;
    const runScan = () => {
        if (!d || !d.ai_scan_url) return;
        setScans((s) => ({ ...s, [d.id]: { loading: true } }));
        fetch(d.ai_scan_url, {
            method: "POST",
            headers: { "X-XSRF-TOKEN": xsrf(), Accept: "application/json", "Content-Type": "application/json" },
            body: "{}",
        })
            .then((r) => r.json())
            .then((data) => setScans((s) => ({ ...s, [d.id]: { loading: false, ...data } })))
            .catch(() => setScans((s) => ({ ...s, [d.id]: { loading: false, ok: false, error: "The scan could not be completed." } })));
    };

    const record = () => {
        if (!d || !verdict || !attested) return;
        const parts = [];
        if (reasons.length) parts.push(reasons.join("; ") + ".");
        if (clientMsg.trim()) parts.push(clientMsg.trim());
        if (teamNote.trim()) parts.push("[Internal] " + teamNote.trim());
        const note = parts.join(" ").trim();
        if (verdict === "reject" && !note) { toast.error("Add a reason or message — the client will see it."); return; }
        setBusy(true);
        router.post(`/portal/immigration-adviser/verification/${d.id}`, { action: verdict, note }, {
            preserveScroll: true, preserveState: true,
            onSuccess: () => {
                toast.success(verdict === "approve" ? "Accepted / Satisfactory" : "Marked as required attention");
                const rest = docs.filter((_, i) => i !== idx);
                if (rest.length === 0) { router.visit("/portal/immigration-adviser/verification"); return; }
                setDocs(rest);
                setIdx(Math.min(idx, rest.length - 1));
            },
            onError: (e) => toast.error(Object.values(e)[0] || "Could not save"),
            onFinish: () => setBusy(false),
        });
    };

    return (
        <div className="max-w-[1500px] mx-auto space-y-4">
            <Head title={`Review — ${kase.name || "Case"}`} />

            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                    <Link href="/portal/immigration-adviser/verification" className="w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 inline-flex items-center justify-center flex-shrink-0"><ArrowLeft size={17} /></Link>
                    <span className="w-10 h-10 rounded-full bg-[#009688] text-white inline-flex items-center justify-center text-[12px] font-bold flex-shrink-0">{initials(kase.name)}</span>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-[18px] font-bold text-gray-900 truncate">{kase.name}</h1>
                            <span className="text-[11px] text-gray-400 font-mono">{kase.lead_id}</span>
                            {flaggedCount > 0 && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{flaggedCount} flagged by manager</span>}
                        </div>
                        <p className="text-[12px] text-gray-500 truncate">
                            {kase.visa || "No visa type"}{referrer ? ` · referred by ${referrer}` : ""}{referredAt ? ` · waiting ${relWait(referredAt)}` : ""}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <LicenceChip licence={licence} />
                    <div className="inline-flex items-center rounded-lg border border-gray-200 overflow-hidden bg-white">
                        <button type="button" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} className="px-2 py-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30"><ChevronLeft size={15} /></button>
                        <span className="px-2.5 text-[12px] text-gray-600 whitespace-nowrap">Document {idx + 1} of {docs.length}</span>
                        <button type="button" onClick={() => setIdx((i) => Math.min(docs.length - 1, i + 1))} disabled={idx === docs.length - 1} className="px-2 py-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30"><ChevronRight size={15} /></button>
                    </div>
                    {kase.case_url && <a href={kase.case_url} className="text-[13px] font-semibold text-[#009688] hover:underline whitespace-nowrap">Open full workspace</a>}
                </div>
            </div>

            {/* Two-pane body — inline flex so it never depends on arbitrary
                Tailwind values (which this build does not generate). */}
            <div className="flex gap-4" style={{ height: "calc(100vh - 128px)", minHeight: "620px" }}>
                {/* LEFT — dark document viewer */}
                <div className="rounded-2xl bg-slate-800 flex flex-col overflow-hidden" style={{ flex: "1 1 0%", minWidth: 0 }}>
                    <div className="px-5 py-3 flex items-center justify-between gap-3 border-b border-white/10">
                        <span className="text-[13px] font-semibold text-white/90 truncate">{d?.original_name || "Document"}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button type="button" onClick={() => setZoom((z) => Math.max(50, z - 8))} className="w-7 h-7 rounded-md bg-white/10 text-white/80 hover:bg-white/20 inline-flex items-center justify-center">–</button>
                            <span className="text-[12px] text-white/80 tabular-nums w-10 text-center">{zoom}%</span>
                            <button type="button" onClick={() => setZoom((z) => Math.min(200, z + 8))} className="w-7 h-7 rounded-md bg-white/10 text-white/80 hover:bg-white/20 inline-flex items-center justify-center">+</button>
                            <button type="button" onClick={() => setZoom(100)} className="px-2.5 py-1.5 rounded-md bg-white/10 text-white/80 text-[12px] font-semibold hover:bg-white/20">Fit</button>
                            <button type="button" onClick={() => setRotate((r) => (r + 90) % 360)} className="px-2.5 py-1.5 rounded-md bg-white/10 text-white/80 text-[12px] font-semibold hover:bg-white/20">Rotate</button>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 flex items-center justify-center overflow-auto p-3">
                        {!d ? (
                            <span className="text-white/50 text-sm">No document selected</span>
                        ) : d.has_file === false ? (
                            <div className="text-center text-white/60"><FileText size={40} className="mx-auto text-white/30" /><p className="mt-2 text-sm">File unavailable</p></div>
                        ) : isImage ? (
                            <img src={d.view_url} alt={d.original_name} className="max-w-full h-auto rounded shadow-lg bg-white" style={{ transform: `scale(${zoom / 100}) rotate(${rotate}deg)` }} />
                        ) : isPdf ? (
                            <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ width: "100%", height: "100%", maxWidth: 900, transform: `rotate(${rotate}deg)` }}>
                                <iframe src={`${d.view_url}#zoom=${zoom}`} title={d.original_name} className="w-full h-full border-0" />
                            </div>
                        ) : (
                            <div className="text-center text-white/70"><FileText size={40} className="mx-auto text-white/30" /><p className="mt-2 text-sm">No inline preview for this file type.</p></div>
                        )}
                    </div>
                    <div className="px-5 py-3 flex items-center justify-between gap-3 border-t border-white/10">
                        <div className="flex items-center gap-2">
                            {d && <a href={d.view_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-white/10 text-white/85 text-[12px] font-semibold hover:bg-white/20">Open in tab</a>}
                            {d && <a href={d.download_url} className="px-3 py-1.5 rounded-lg bg-white/10 text-white/85 text-[12px] font-semibold hover:bg-white/20">Download</a>}
                        </div>
                    </div>
                </div>

                {/* RIGHT — referral list, pre-check, AI scan, verdict */}
                <div className="flex flex-col rounded-2xl border border-gray-100 bg-white overflow-hidden" style={{ flex: "0 0 420px", minHeight: 0 }}>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Documents in referral */}
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Documents in this referral</p>
                            <div className="space-y-2">
                                {docs.map((doc, i) => (
                                    <button key={doc.id} type="button" onClick={() => setIdx(i)}
                                        className={`w-full text-left rounded-xl border px-3 py-2.5 flex items-center gap-2.5 transition-colors ${i === idx ? "border-[#009688] ring-1 ring-[#009688]/30 bg-white" : "border-gray-200 hover:bg-gray-50"}`}>
                                        {doc.note
                                            ? <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-600 inline-flex items-center justify-center text-[10px] font-bold flex-shrink-0">!</span>
                                            : <FileText size={15} className="text-gray-300 flex-shrink-0" />}
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[13px] font-semibold text-gray-900 truncate">{docLabel(doc)}</span>
                                            <span className="block text-[11px] text-gray-400 uppercase">{(doc.mime || "").includes("pdf") ? "PDF" : "FILE"}</span>
                                        </span>
                                        {doc.note && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 flex-shrink-0">Flagged</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Manager pre-check — real referral context. */}
                        <div className="rounded-xl bg-slate-800 text-white p-3.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#4fd1c5]">Manager pre-check</p>
                            {referrer && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="w-6 h-6 rounded-full bg-white/10 inline-flex items-center justify-center text-[9px] font-bold">{initials(referrer)}</span>
                                    <span className="text-[12.5px] font-semibold">{referrer}</span>
                                    {referredAt && <span className="text-[11px] text-white/50">· {new Date(referredAt).toLocaleString("en-NZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>}
                                </div>
                            )}
                            {d?.note
                                ? <div className="mt-2.5 rounded-lg bg-white/5 px-3 py-2.5 text-[12px] text-white/80 italic leading-snug">“{d.note}”</div>
                                : <p className="mt-2.5 text-[12px] text-white/50">No note from the manager on this document.</p>}
                        </div>

                        {/* Document vs client record — AI scan. */}
                        <div className="rounded-xl border border-gray-200 bg-white p-3.5">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-[13px] font-bold text-gray-900">Document vs client record</p>
                                {scan?.ok && scan.conflicts > 0 && <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{scan.conflicts} conflict{scan.conflicts === 1 ? "" : "s"}</span>}
                                {scan?.ok && scan.conflicts === 0 && <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">No conflicts</span>}
                            </div>
                            <p className="text-[11.5px] text-gray-400 mt-0.5">AI reads the document and compares it to the case file. Indicative only.</p>

                            {!ai_enabled ? (
                                <p className="mt-3 text-[12px] text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5">AI scanning is currently turned off.</p>
                            ) : !scan ? (
                                <button type="button" onClick={runScan} disabled={!d || d.has_file === false}
                                    className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-800 text-white text-[13px] font-bold hover:bg-slate-700 disabled:opacity-40">
                                    <Sparkles size={15} /> Scan document with AI
                                </button>
                            ) : scan.loading ? (
                                <div className="mt-3 flex items-center justify-center gap-2 py-4 text-[13px] text-gray-500"><Loader2 size={16} className="animate-spin" /> Scanning the document…</div>
                            ) : !scan.ok ? (
                                <div className="mt-3">
                                    <p className="text-[12px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2.5">{scan.error || "The scan could not be completed."}</p>
                                    <button type="button" onClick={runScan} className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-gray-600 hover:text-gray-900"><RefreshCw size={12} /> Try again</button>
                                </div>
                            ) : (
                                <>
                                    <div className="mt-2 divide-y divide-gray-100">
                                        {(scan.rows || []).map((r) => (
                                            <div key={r.label} className="py-2 flex items-center justify-between gap-2">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 w-24 flex-shrink-0">{r.label}</span>
                                                <span className="text-[13px] font-bold text-gray-900 font-mono flex-1 truncate" title={r.note}>{r.value || "—"}</span>
                                                <VerdictPill v={r.verdict} />
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" onClick={runScan} className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-gray-700"><RefreshCw size={11} /> Re-scan</button>
                                </>
                            )}
                        </div>

                        {/* Message to client */}
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Message to client</p>
                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Client sees this</span>
                                <span className="text-[10px] text-gray-400 ml-auto">Optional</span>
                            </div>
                            <textarea value={clientMsg} onChange={(e) => setClientMsg(e.target.value)} rows={3} placeholder="Plain-language reason and what to do next…"
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] resize-y" />
                        </div>

                        {/* Note to team */}
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Note to team</p>
                                <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Internal</span>
                            </div>
                            <textarea value={teamNote} onChange={(e) => setTeamNote(e.target.value)} rows={2} placeholder="Context for the manager who referred this…"
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] resize-y" />
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {REASON_CHIPS.map((r) => (
                                    <button key={r} type="button" onClick={() => toggleReason(r)}
                                        className={`px-2.5 py-1.5 rounded-full text-[11.5px] font-semibold border transition-colors ${reasons.includes(r) ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>{r}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sticky verdict footer */}
                    <div className="border-t border-gray-100 p-4 bg-white flex-shrink-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Final verdict</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setVerdict("approve")}
                                className={`px-3 py-2.5 rounded-lg text-[13px] font-bold border transition-colors ${verdict === "approve" ? "bg-emerald-600 text-white border-emerald-600" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"}`}>Accept / satisfactory</button>
                            <button type="button" onClick={() => setVerdict("reject")}
                                className={`px-3 py-2.5 rounded-lg text-[13px] font-bold border transition-colors ${verdict === "reject" ? "bg-red-600 text-white border-red-600" : "border-red-300 text-red-600 hover:bg-red-50"}`}>Requires attention</button>
                        </div>
                        <label className="flex items-start gap-2 mt-3 cursor-pointer">
                            <input type="checkbox" checked={attested} onChange={(e) => setAttested(e.target.checked)} className="mt-0.5 rounded border-gray-300" />
                            <span className="text-[12px] text-gray-600 leading-snug">I reviewed this document myself and accept professional responsibility.</span>
                        </label>
                        <button type="button" onClick={record} disabled={busy || !verdict || !attested}
                            className="w-full mt-3 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-[13px] font-bold hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed">
                            {busy ? <Loader2 size={15} className="animate-spin" /> : null} Record verdict &amp; go to next
                        </button>
                        <p className="text-center text-[11px] text-gray-400 mt-2">{(!verdict || !attested) ? "Pick an outcome and confirm your attestation." : "Ready to record."}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LicenceChip({ licence }) {
    const ok = licence?.current;
    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-semibold ${ok ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
            {ok ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
            {ok ? `Licence current${licence.number ? ` · ${licence.number}` : ""}` : "Licence not current"}
        </span>
    );
}

function VerdictPill({ v }) {
    const map = {
        match: { label: "Match", cls: "bg-emerald-50 text-emerald-700" },
        conflict: { label: "Conflict", cls: "bg-red-50 text-red-600" },
        review: { label: "Review", cls: "bg-amber-50 text-amber-700" },
    };
    const m = map[v] || map.review;
    return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${m.cls}`}>{m.label}</span>;
}
