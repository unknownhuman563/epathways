import { useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import { MessageSquare, CheckCircle2, Send, HelpCircle, CornerDownRight } from "lucide-react";

// Build 12 phase 6 — shared UI for anchored threads (§7). Reused by the Notes,
// Documents and Process tabs so a thread looks and behaves the same wherever its
// anchor puts it. Placement is the caller's job (it filters by anchor); this
// file only renders and writes.

const fmt = (iso) =>
    iso ? new Date(iso).toLocaleString("en-NZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

export function resolveThread(leadId, threadId) {
    router.post(`/portal/immigration/cases/${leadId}/threads/${threadId}/resolve`, {}, {
        preserveScroll: true,
        onSuccess: () => toast.success("Thread resolved"),
        onError: (e) => toast.error(Object.values(e)[0] || "Could not resolve"),
    });
}

/** One thread: body, who asked, who's on the hook, and an explicit resolve. */
export function ThreadItem({ thread, leadId, anchorLabel = null }) {
    const open = ! thread.resolved_at;
    return (
        <div className={`rounded-lg border px-3 py-2.5 ${open ? "border-amber-200 bg-amber-50/50" : "border-gray-100 bg-white"}`}>
            <div className="flex items-start gap-2">
                <HelpCircle size={13} className={`mt-0.5 flex-shrink-0 ${open ? "text-amber-500" : "text-gray-300"}`} />
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-gray-900 whitespace-pre-wrap leading-snug">{thread.body}</p>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[10.5px] text-gray-400">
                        <span>{thread.author || "Unknown"}</span>
                        <span>· {fmt(thread.created_at)}</span>
                        {anchorLabel && <span className="text-gray-400">· {anchorLabel}</span>}
                        {thread.requires_answer && (
                            <span className="font-bold uppercase text-amber-600">· needs an answer</span>
                        )}
                        {thread.addressed_to && (
                            <span className="inline-flex items-center gap-0.5 text-gray-500">
                                <CornerDownRight size={9} /> {thread.addressed_to.name}
                            </span>
                        )}
                    </div>
                    {! open && (
                        <p className="mt-1 text-[10.5px] text-emerald-600 inline-flex items-center gap-1">
                            <CheckCircle2 size={11} /> Answered{thread.resolved_by ? ` by ${thread.resolved_by}` : ""} · {fmt(thread.resolved_at)}
                        </p>
                    )}
                </div>
                {open && (
                    <button
                        type="button"
                        onClick={() => resolveThread(leadId, thread.id)}
                        title="Mark this thread answered"
                        className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 text-[10.5px] font-semibold text-gray-600 hover:border-emerald-500 hover:text-emerald-600"
                    >
                        <CheckCircle2 size={11} /> Answer
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Composer. `fixedAnchor` = {anchor_type, anchor_id?, anchor_key?, anchor_attempt?}
 * pins the anchor (document / step rows). Omit it and the composer offers a
 * general anchor picker (Case / Gate / Stage) for the Notes tab. `stages` is an
 * optional list for the Stage picker.
 */
export function ThreadComposer({ leadId, caseStaff = [], fixedAnchor = null, stages = [], compact = false, placeholder = "Ask a question…" }) {
    const [open, setOpen] = useState(! compact);
    const [body, setBody] = useState("");
    const [addressedTo, setAddressedTo] = useState("");
    const [requires, setRequires] = useState(false);
    const [anchorType, setAnchorType] = useState("case");
    const [anchorKey, setAnchorKey] = useState("");
    const [posting, setPosting] = useState(false);

    const submit = () => {
        if (! body.trim()) return toast.error("Write the question first");
        const anchor = fixedAnchor || { anchor_type: anchorType, anchor_key: anchorType === "case" ? null : anchorKey };
        if (! fixedAnchor && anchorType !== "case" && ! anchorKey.trim()) {
            return toast.error(anchorType === "gate" ? "Name the gate (e.g. 06)" : "Name the stage");
        }
        setPosting(true);
        router.post(`/portal/immigration/cases/${leadId}/threads`, {
            ...anchor,
            body,
            addressed_to_id: addressedTo || null,
            requires_answer: requires,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Thread posted");
                setBody(""); setRequires(false); setAddressedTo(""); setAnchorKey("");
                if (compact) setOpen(false);
            },
            onError: (e) => toast.error(Object.values(e)[0] || "Could not post"),
            onFinish: () => setPosting(false),
        });
    };

    if (compact && ! open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-gray-400 hover:text-gray-900"
            >
                <MessageSquare size={11} /> Ask a question
            </button>
        );
    }

    return (
        <div className={compact ? "rounded-lg border border-gray-200 bg-gray-50/60 p-2.5 space-y-2" : "rounded-xl border border-gray-200 bg-white p-3 space-y-2"}>
            {! fixedAnchor && (
                <div className="flex items-center gap-2">
                    <select
                        value={anchorType}
                        onChange={(e) => setAnchorType(e.target.value)}
                        className="text-[11px] font-semibold px-2 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none"
                    >
                        <option value="case">On the case</option>
                        <option value="gate">On a gate</option>
                        <option value="stage">On a stage</option>
                    </select>
                    {anchorType === "gate" && (
                        <input
                            value={anchorKey}
                            onChange={(e) => setAnchorKey(e.target.value)}
                            placeholder="Gate (e.g. 06)"
                            className="text-[11px] px-2 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none w-28"
                        />
                    )}
                    {anchorType === "stage" && (
                        stages.length > 0 ? (
                            <select
                                value={anchorKey}
                                onChange={(e) => setAnchorKey(e.target.value)}
                                className="text-[11px] px-2 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none"
                            >
                                <option value="">Choose a stage…</option>
                                {stages.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        ) : (
                            <input
                                value={anchorKey}
                                onChange={(e) => setAnchorKey(e.target.value)}
                                placeholder="Stage"
                                className="text-[11px] px-2 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none"
                            />
                        )
                    )}
                </div>
            )}
            <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={compact ? 2 : 3}
                maxLength={2000}
                placeholder={placeholder}
                className="w-full text-[13px] px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 resize-none"
            />
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <select
                        value={addressedTo}
                        onChange={(e) => setAddressedTo(e.target.value)}
                        className="text-[11px] px-2 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none max-w-[160px]"
                    >
                        <option value="">To (anyone)</option>
                        {caseStaff.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 cursor-pointer">
                        <input type="checkbox" checked={requires} onChange={(e) => setRequires(e.target.checked)}
                            className="rounded border-gray-300 text-amber-600 focus:ring-0 w-3.5 h-3.5" />
                        Needs an answer
                    </label>
                </div>
                <div className="flex items-center gap-1.5">
                    {compact && (
                        <button type="button" onClick={() => setOpen(false)} className="text-[11px] font-semibold text-gray-400 hover:text-gray-700">Cancel</button>
                    )}
                    <button type="button" onClick={submit} disabled={posting}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-semibold hover:bg-black disabled:opacity-50">
                        <Send size={11} /> Post
                    </button>
                </div>
            </div>
        </div>
    );
}
