import { useEffect, useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { toast } from "sonner";
import {
    BadgeCheck, ShieldCheck, ShieldAlert, Eye, Download, FileText,
    CheckCircle2, XCircle, Globe, Clock, X, Loader2, SearchCheck, ChevronRight,
} from "lucide-react";

// Adviser verification queue. Documents a manager marked "Checked" (referred to
// the LIA) land here, grouped per client as a table. "Review" opens a modal with
// a tab-list of that client's Checked documents — the adviser works through them
// one at a time (document on the left, remarks + final verdict on the right).

export default function Verification({ documents = [], licence = {} }) {
    const [active, setActive] = useState(null); // the client group being reviewed

    // Group the checked documents by client/case.
    const groups = useMemo(() => {
        const m = new Map();
        for (const d of documents) {
            const k = d.case.id;
            if (!m.has(k)) m.set(k, { case: d.case, docs: [] });
            m.get(k).docs.push(d);
        }
        return Array.from(m.values()).sort((a, b) => b.docs.length - a.docs.length);
    }, [documents]);

    const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }) : "—");

    return (
        <div className="max-w-5xl mx-auto pb-14 space-y-6">
            <Head title="Verification" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#009688] mb-1.5">Licensed review</p>
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Verification</h1>
                    <p className="text-sm text-gray-500 mt-1">Documents your managers checked and referred to you. Your decision is what the client sees.</p>
                </div>
                <LicenceChip licence={licence} />
            </div>

            {/* Count strip */}
            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-4 py-3.5 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Clock size={17} /></span>
                    <div><p className="text-lg font-bold text-gray-900 leading-none tabular-nums">{documents.length}</p><p className="text-[11px] text-gray-500 mt-0.5">document{documents.length === 1 ? "" : "s"} to verify</p></div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-4 py-3.5 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-[#009688]/10 text-[#00796b] flex items-center justify-center"><BadgeCheck size={17} /></span>
                    <div><p className="text-lg font-bold text-gray-900 leading-none tabular-nums">{groups.length}</p><p className="text-[11px] text-gray-500 mt-0.5">client{groups.length === 1 ? "" : "s"} waiting</p></div>
                </div>
            </div>

            {groups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 text-center py-16">
                    <BadgeCheck size={28} className="mx-auto text-gray-300" />
                    <p className="mt-3 text-sm font-semibold text-gray-700">Nothing to verify</p>
                    <p className="text-xs text-gray-500 mt-1">When a manager marks a document as checked, it appears here.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/60 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="px-4 py-3">Client</th>
                                    <th className="px-4 py-3">Visa</th>
                                    <th className="px-4 py-3">To verify</th>
                                    <th className="px-4 py-3">Referred</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {groups.map((g) => {
                                    const earliest = g.docs.map((d) => d.checked_at).filter(Boolean).sort()[0];
                                    return (
                                        <tr key={g.case.id} className="hover:bg-gray-50/50 align-middle">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="w-9 h-9 rounded-full inline-flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 bg-[#009688]">{initials(g.case.name)}</span>
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-semibold text-gray-900 truncate">{g.case.name}</p>
                                                        <p className="text-[11px] text-gray-400 font-mono truncate">{g.case.lead_id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-[12px] text-gray-700 inline-flex items-center gap-1.5"><Globe size={12} className="text-gray-400" /> {g.case.visa || "No visa type"}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border bg-amber-50 text-amber-700 border-amber-200">{g.docs.length} document{g.docs.length > 1 ? "s" : ""}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-[12px] text-gray-500 tabular-nums">{fmt(earliest)}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button type="button" onClick={() => setActive(g)}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-900 text-white text-[12px] font-semibold hover:bg-gray-800">
                                                    <SearchCheck size={14} /> Review
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {active && <ReviewModal group={active} onClose={() => setActive(null)} />}
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

const initials = (n = "") => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "—";

// Per-client review modal — document on the left, a tab-list of the client's
// Checked documents + remarks + verdict on the right. Reviewing one advances to
// the next without closing.
function ReviewModal({ group, onClose }) {
    const [docs, setDocs] = useState(group.docs);       // remaining checked docs
    const [idx, setIdx] = useState(0);                  // active doc
    const [note, setNote] = useState("");
    const [busy, setBusy] = useState(null);

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, []);

    const d = docs[idx] || null;
    const isPdf = (d?.mime || "").includes("pdf");
    const isImage = (d?.mime || "").startsWith("image/");

    const decide = (action) => {
        if (!d) return;
        if (action === "reject" && !note.trim()) {
            toast.error("Add a reason before flagging — the client will see it.");
            return;
        }
        setBusy(action);
        router.post(`/portal/immigration-adviser/verification/${d.id}`, { action, note }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                toast.success(action === "approve" ? "Accepted / Satisfactory" : "Marked as required attention");
                const rest = docs.filter((_, i) => i !== idx);
                setNote("");
                if (rest.length === 0) { onClose(); return; }
                setDocs(rest);
                setIdx(Math.min(idx, rest.length - 1));
            },
            onError: (err) => toast.error(Object.values(err)[0] || "Could not save"),
            onFinish: () => setBusy(null),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
            <div className="w-[94vw] max-w-[1200px] h-[90vh] rounded-2xl bg-white shadow-xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#009688] mb-0.5">Document review</p>
                        <h2 className="text-sm font-bold text-gray-900 truncate">{group.case.name}</h2>
                        <p className="text-[12px] text-gray-500 truncate">{group.case.visa || "No visa type"} · {docs.length} to verify</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 flex-shrink-0"><X size={18} /></button>
                </div>

                {/* Body */}
                <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
                    {/* LEFT — the selected document */}
                    <div className="lg:flex-1 min-h-0 bg-gray-100 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col">
                        {!d ? (
                            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">No document selected</div>
                        ) : d.has_file === false ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <FileText size={40} className="text-gray-300" />
                                <p className="mt-3 text-sm font-semibold text-gray-700">File unavailable</p>
                                <p className="mt-1 text-[12px] text-gray-500 max-w-xs">This record has no file on the server. Ask the client to re-upload it before verifying.</p>
                            </div>
                        ) : (isPdf || isImage) ? (
                            isImage ? (
                                <div className="flex-1 overflow-auto p-4 flex items-start justify-center"><img src={d.view_url} alt={d.original_name} className="max-w-full h-auto rounded-lg shadow-sm" /></div>
                            ) : (
                                <iframe src={d.view_url} title={d.original_name} className="flex-1 w-full border-0" />
                            )
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <FileText size={40} className="text-gray-300" />
                                <p className="mt-3 text-sm text-gray-600">No inline preview for this file type.</p>
                                <a href={d.download_url} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-[12px] font-semibold hover:bg-white"><Download size={13} /> Download to view</a>
                            </div>
                        )}
                        {d && d.has_file !== false && (
                            <div className="flex items-center gap-1.5 px-4 py-2 border-t border-gray-200 bg-white">
                                <a href={d.view_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-gray-200 text-gray-600 text-[11px] font-semibold hover:bg-gray-50"><Eye size={12} /> Open in tab</a>
                                <a href={d.download_url} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-gray-200 text-gray-600 text-[11px] font-semibold hover:bg-gray-50"><Download size={12} /> Download</a>
                            </div>
                        )}
                    </div>

                    {/* RIGHT — the client's checked docs tab-list + remarks + verdict */}
                    <div className="lg:w-[380px] flex-shrink-0 overflow-y-auto overscroll-contain p-4 bg-gray-50 space-y-4">
                        {/* Tab list of this client's Checked documents */}
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Documents to verify</p>
                            <div className="space-y-1.5">
                                {docs.map((doc, i) => (
                                    <button key={doc.id} type="button" onClick={() => { setIdx(i); setNote(""); }}
                                        className={`w-full text-left rounded-lg border px-3 py-2 flex items-center gap-2 transition-colors ${i === idx ? "border-[#009688] bg-[#009688]/5" : "border-gray-200 bg-white hover:bg-gray-50"}`}>
                                        <FileText size={13} className={i === idx ? "text-[#009688] flex-shrink-0" : "text-gray-400 flex-shrink-0"} />
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-center gap-1.5">
                                                <span className={`block text-[12px] truncate ${i === idx ? "font-semibold text-gray-900" : "text-gray-700"}`}>{doc.original_name}</span>
                                                {doc.is_vif && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 flex-shrink-0">VIF</span>}
                                            </span>
                                            {doc.checklist_key && <span className="block text-[10px] text-gray-400 font-mono truncate">{doc.checklist_key}</span>}
                                        </span>
                                        {i === idx && <ChevronRight size={13} className="text-[#009688] flex-shrink-0" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {d && (
                            <>
                                {/* Context */}
                                <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2">
                                    {d.note && <MetaRow label="Manager note" value={d.note} />}
                                    {d.checked_at && <MetaRow label="Checked" value={new Date(d.checked_at).toLocaleString("en-NZ")} />}
                                </div>

                                {/* Remarks */}
                                <div className="rounded-xl border border-gray-200 bg-white p-3">
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Remarks</label>
                                    <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4}
                                        placeholder="Your remarks on this document. Required when flagging — the client sees the reason."
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] resize-y" />
                                </div>

                                {/* Verdict */}
                                <div className="rounded-xl border border-gray-200 bg-white p-3">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Final verdict</p>
                                    <p className="text-[11px] text-gray-400 mb-3 leading-snug">This is the status the client sees on their document.</p>
                                    <div className="flex flex-col gap-2">
                                        <button type="button" disabled={!!busy} onClick={() => decide("approve")}
                                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700 disabled:opacity-50">
                                            {busy === "approve" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Accept / Satisfactory
                                        </button>
                                        <button type="button" disabled={!!busy} onClick={() => decide("reject")}
                                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-red-300 text-red-600 text-[13px] font-bold hover:bg-red-50 disabled:opacity-50">
                                            {busy === "reject" ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />} Required attention
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetaRow({ label, value }) {
    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
            <p className="text-[12.5px] text-gray-800 break-words">{value}</p>
        </div>
    );
}
