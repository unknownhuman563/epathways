import { useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { toast } from "sonner";
import {
    BadgeCheck, ShieldCheck, ShieldAlert, Eye, Download, FileText,
    CheckCircle2, XCircle, Globe, Clock,
} from "lucide-react";

// Adviser verification queue. Documents a manager marked "Checked" (referred to
// the LIA) land here; the adviser makes the final Approve/Reject that the client
// sees. Grouped by case for context.
export default function Verification({ documents = [], licence = {} }) {
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
                    {groups.map((g) => <CaseGroup key={g.case.id} group={g} />)}
                </div>
            )}
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

function CaseGroup({ group }) {
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
                {group.docs.map((d) => <DocRow key={d.id} d={d} />)}
            </div>
        </section>
    );
}

function DocRow({ d }) {
    const [busy, setBusy] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [note, setNote] = useState("");

    const decide = (action) => {
        setBusy(true);
        router.post(`/portal/immigration-adviser/verification/${d.id}`, { action, note }, {
            preserveScroll: true,
            onSuccess: () => toast.success(action === "approve" ? "Approved" : "Rejected"),
            onError: (err) => toast.error(Object.values(err)[0] || "Could not save"),
            onFinish: () => setBusy(false),
        });
    };

    return (
        <div className="px-5 py-4">
            <div className="flex items-start gap-3 flex-wrap">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{d.original_name}</p>
                    <p className="text-[12px] text-gray-500">
                        {d.checklist_key && <span className="font-mono text-gray-400">{d.checklist_key}</span>}
                        {d.note && <span className="italic"> · Manager note: {d.note}</span>}
                    </p>
                </div>
                <div className="flex items-center gap-1.5">
                    <a href={d.view_url} target="_blank" rel="noopener noreferrer" title="View" className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><Eye size={14} /></a>
                    <a href={d.download_url} title="Download" className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><Download size={14} /></a>
                </div>
            </div>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
                {!rejecting ? (
                    <>
                        <button type="button" disabled={busy} onClick={() => decide("approve")}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-[12px] font-semibold hover:bg-emerald-700 disabled:opacity-50">
                            <CheckCircle2 size={14} /> Approve
                        </button>
                        <button type="button" disabled={busy} onClick={() => setRejecting(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-200 text-red-600 text-[12px] font-semibold hover:bg-red-50 disabled:opacity-50">
                            <XCircle size={14} /> Reject
                        </button>
                    </>
                ) : (
                    <div className="w-full space-y-2">
                        <input value={note} onChange={(e) => setNote(e.target.value)} autoFocus
                            placeholder="Reason for rejection (shown to the client)…"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400" />
                        <div className="flex items-center gap-2">
                            <button type="button" disabled={busy} onClick={() => decide("reject")}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 text-white text-[12px] font-semibold hover:bg-red-700 disabled:opacity-50">
                                <XCircle size={14} /> Confirm reject
                            </button>
                            <button type="button" onClick={() => { setRejecting(false); setNote(""); }}
                                className="px-3 py-2 rounded-lg text-[12px] font-semibold text-gray-500 hover:bg-gray-50">Cancel</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
