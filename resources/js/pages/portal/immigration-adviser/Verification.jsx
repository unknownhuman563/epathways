import { useEffect, useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { toast } from "sonner";
import {
    BadgeCheck, ShieldCheck, ShieldAlert, Eye, Download, FileText,
    CheckCircle2, XCircle, Globe, Clock, X, Loader2, SearchCheck,
} from "lucide-react";

// Adviser verification queue. Documents a manager marked "Checked" (referred to
// the LIA) land here; the adviser opens each in a review modal — document on the
// left, remarks + a final Approve/Reject verdict on the right. That verdict is
// what the client sees on their document status. Grouped by case for context.
export default function Verification({ documents = [], licence = {} }) {
    const [active, setActive] = useState(null); // the doc being reviewed

    const groups = useMemo(() => {
        const m = new Map();
        for (const d of documents) {
            const k = d.case.id;
            if (!m.has(k)) m.set(k, { case: d.case, docs: [] });
            m.get(k).docs.push(d);
        }
        return Array.from(m.values());
    }, [documents]);

    return (
        <div className="max-w-[1000px] mx-auto pb-14 space-y-6">
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
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-4 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock size={18} />
                </span>
                <div>
                    <p className="text-lg font-bold text-gray-900 leading-none">{documents.length}</p>
                    <p className="text-[12px] text-gray-500 mt-0.5">document{documents.length === 1 ? "" : "s"} awaiting your verification</p>
                </div>
            </div>

            {groups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 text-center py-16">
                    <BadgeCheck size={28} className="mx-auto text-gray-300" />
                    <p className="mt-3 text-sm font-semibold text-gray-700">Nothing to verify</p>
                    <p className="text-xs text-gray-500 mt-1">When a manager marks a document as checked, it appears here.</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {groups.map((g) => <CaseGroup key={g.case.id} group={g} onReview={setActive} />)}
                </div>
            )}

            {active && <DocReviewModal d={active} onClose={() => setActive(null)} />}
        </div>
    );
}

function LicenceChip({ licence }) {
    const ok = licence?.current;
    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-semibold ${
            ok ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
        }`}>
            {ok ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
            {ok ? `Licence current${licence.number ? ` · ${licence.number}` : ""}` : "Licence not current"}
        </span>
    );
}

function CaseGroup({ group, onReview }) {
    return (
        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <a href={`/portal/immigration-adviser/cases/${group.case.id}`}
                className="flex items-center gap-3 px-5 py-3.5 bg-gray-50/70 border-b border-gray-100 hover:bg-gray-100/70 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[#009688]/10 flex items-center justify-center flex-shrink-0">
                    <Globe size={15} className="text-[#009688]" />
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-bold text-gray-900 truncate">{group.case.name} <span className="text-[11px] font-normal text-gray-400">{group.case.lead_id}</span></div>
                    <div className="text-[12px] text-gray-500 truncate">{group.case.visa || "No visa type"}</div>
                </div>
                <span className="ml-auto text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">{group.docs.length} to verify</span>
            </a>
            <div className="divide-y divide-gray-50">
                {group.docs.map((d) => <DocRow key={d.id} d={d} onReview={onReview} />)}
            </div>
        </section>
    );
}

function DocRow({ d, onReview }) {
    return (
        <div className="px-5 py-4 flex items-center gap-3 flex-wrap">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <FileText size={16} className="text-gray-500" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{d.original_name}</p>
                <p className="text-[12px] text-gray-500 truncate">
                    {d.checklist_key && <span className="font-mono text-gray-400">{d.checklist_key}</span>}
                    {d.note && <span className="italic"> · Manager note: {d.note}</span>}
                </p>
            </div>
            <button type="button" onClick={() => onReview(d)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-900 text-white text-[12px] font-semibold hover:bg-gray-800">
                <SearchCheck size={14} /> Review
            </button>
        </div>
    );
}

// Review modal — document on the left, remarks + final verdict on the right.
function DocReviewModal({ d, onClose }) {
    const [note, setNote] = useState("");
    const [busy, setBusy] = useState(null); // 'approve' | 'reject' | null
    const isPdf = (d.mime || "").includes("pdf");
    const isImage = (d.mime || "").startsWith("image/");

    // Lock the page behind the modal.
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, []);

    const decide = (action) => {
        if (action === "reject" && !note.trim()) {
            toast.error("Add a reason before rejecting — the client will see it.");
            return;
        }
        setBusy(action);
        router.post(`/portal/immigration-adviser/verification/${d.id}`, { action, note }, {
            preserveScroll: true,
            onSuccess: () => { toast.success(action === "approve" ? "Document approved" : "Document rejected"); onClose(); },
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
                        <h2 className="text-sm font-bold text-gray-900 truncate">{d.original_name}</h2>
                        <p className="text-[12px] text-gray-500 truncate">{d.case.name} · {d.case.visa || "No visa type"}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 flex-shrink-0"><X size={18} /></button>
                </div>

                {/* Body */}
                <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
                    {/* LEFT — the document */}
                    <div className="lg:flex-1 min-h-0 bg-gray-100 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col">
                        {(isPdf || isImage) ? (
                            isImage ? (
                                <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
                                    <img src={d.view_url} alt={d.original_name} className="max-w-full h-auto rounded-lg shadow-sm" />
                                </div>
                            ) : (
                                <iframe src={d.view_url} title={d.original_name} className="flex-1 w-full border-0" />
                            )
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <FileText size={40} className="text-gray-300" />
                                <p className="mt-3 text-sm text-gray-600">No inline preview for this file type.</p>
                                <a href={d.download_url} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-[12px] font-semibold hover:bg-white">
                                    <Download size={13} /> Download to view
                                </a>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 px-4 py-2 border-t border-gray-200 bg-white">
                            <a href={d.view_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-gray-200 text-gray-600 text-[11px] font-semibold hover:bg-gray-50"><Eye size={12} /> Open in tab</a>
                            <a href={d.download_url} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-gray-200 text-gray-600 text-[11px] font-semibold hover:bg-gray-50"><Download size={12} /> Download</a>
                        </div>
                    </div>

                    {/* RIGHT — remarks + final verdict */}
                    <div className="lg:w-[360px] flex-shrink-0 overflow-y-auto overscroll-contain p-5 bg-gray-50 space-y-4">
                        {/* Context */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                            <MetaRow label="Checklist item" value={d.checklist_key || "—"} mono />
                            {d.note && <MetaRow label="Manager note" value={d.note} />}
                            {d.checked_at && <MetaRow label="Checked" value={new Date(d.checked_at).toLocaleString("en-NZ")} />}
                        </div>

                        {/* Adviser remark */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Remarks</label>
                            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={5}
                                placeholder="Your remarks on this document. Required when rejecting — the client sees the reason."
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] resize-y" />
                        </div>

                        {/* Final verdict */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Final verdict</p>
                            <p className="text-[11px] text-gray-400 mb-3 leading-snug">This is the status the client sees on their document.</p>
                            <div className="flex flex-col gap-2">
                                <button type="button" disabled={!!busy} onClick={() => decide("approve")}
                                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700 disabled:opacity-50">
                                    {busy === "approve" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Approve
                                </button>
                                <button type="button" disabled={!!busy} onClick={() => decide("reject")}
                                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-red-300 text-red-600 text-[13px] font-bold hover:bg-red-50 disabled:opacity-50">
                                    {busy === "reject" ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />} Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetaRow({ label, value, mono }) {
    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
            <p className={`text-[12.5px] text-gray-800 break-words ${mono ? "font-mono" : ""}`}>{value}</p>
        </div>
    );
}
