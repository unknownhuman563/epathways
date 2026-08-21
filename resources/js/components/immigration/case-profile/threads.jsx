import { useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import { MessageSquare, CheckCircle2, Send, HelpCircle, CornerDownRight, Pencil, X } from "lucide-react";

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

// Prettify a staff role for the byline (e.g. immigration_manager → "Case
// manager"). Falls back to a title-cased version of the raw role.
const ROLE_LABEL = {
    super_admin: "Super admin",
    admin: "Admin",
    immigration_manager: "Case manager",
    immigration_adviser: "Licensed adviser",
    sales: "Sales",
    education: "Education",
    english: "English",
    accommodation: "Accommodation",
    finance: "Finance",
    agent: "Agent",
    lead: "Client",
};
const roleLabel = (r) =>
    r ? (ROLE_LABEL[r] || String(r).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())) : null;

// The composer's textarea id for a given anchor, so a thread's "Reply" can focus
// the composer that posts to the same place.
const composerIdFor = (anchor) =>
    anchor && anchor.anchor_type === "document" && anchor.anchor_id
        ? `thread-composer-document-${anchor.anchor_id}`
        : null;

/** One thread: body, who wrote it, its audience, and an explicit resolve.
 * When `childrenOf`/`anchor` are supplied it renders nested replies and an
 * inline reply box (used for document comments). */
export function ThreadItem({ thread, leadId, anchorLabel = null, childrenOf = null, anchor = null, caseStaff = [] }) {
    const open = ! thread.resolved_at;
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(thread.body || "");
    const [saving, setSaving] = useState(false);
    const [replyOpen, setReplyOpen] = useState(false);
    const replies = childrenOf ? childrenOf(thread.id) : [];
    const canReplyInline = !! anchor;

    const saveEdit = () => {
        if (! draft.trim()) return toast.error("Comment can't be empty");
        setSaving(true);
        router.patch(`/portal/immigration/cases/${leadId}/threads/${thread.id}`, { body: draft }, {
            preserveScroll: true,
            onSuccess: () => { toast.success("Comment updated"); setEditing(false); },
            onError: (e) => toast.error(Object.values(e)[0] || "Could not update"),
            onFinish: () => setSaving(false),
        });
    };

    const focusReply = () => {
        const el = document.getElementById(composerIdFor(thread));
        if (el) { el.focus(); el.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
    };

    // A comment authored by the client reads FROM CLIENT (amber); a staff
    // comment shared with the client reads TO CLIENT (teal); everything else is
    // INTERNAL (gray).
    const fromClient = thread.author_role === "lead";

    return (
        <div className="py-4 border-b border-gray-100 last:border-b-0">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-[13px] font-bold text-gray-900">{thread.author || "Unknown"}</span>
                    {roleLabel(thread.author_role) && (
                        <span className="text-[12px] text-gray-400">{roleLabel(thread.author_role)}</span>
                    )}
                    <span className="text-[12px] text-gray-400">{fmt(thread.created_at)}</span>
                </div>
                {fromClient ? (
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-600 flex-shrink-0">From client</span>
                ) : thread.client_visible ? (
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-teal-600 flex-shrink-0">To client</span>
                ) : anchorLabel ? (
                    <span className="text-[10.5px] font-semibold text-gray-400 flex-shrink-0">{anchorLabel}</span>
                ) : (
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-300 flex-shrink-0">Internal</span>
                )}
            </div>

            {editing ? (
                <div className="mt-2 space-y-2">
                    <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={3}
                        maxLength={2000}
                        autoFocus
                        className="w-full text-[13px] px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 resize-none"
                    />
                    <div className="flex items-center gap-1.5">
                        <button type="button" onClick={saveEdit} disabled={saving}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-900 text-white text-[10.5px] font-semibold hover:bg-black disabled:opacity-50">
                            <CheckCircle2 size={11} /> Save
                        </button>
                        <button type="button" onClick={() => { setEditing(false); setDraft(thread.body || ""); }}
                            className="text-[10.5px] font-semibold text-gray-400 hover:text-gray-700">Cancel</button>
                    </div>
                </div>
            ) : (
                <p className={`mt-1.5 text-[13px] leading-relaxed whitespace-pre-wrap ${fromClient ? "text-amber-700" : "text-slate-700"}`}>{thread.body}</p>
            )}

            {! editing && (
                <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-gray-400">
                        {open
                            ? (thread.requires_answer ? (
                                <>
                                    {thread.client_visible
                                        ? "Awaiting client answer"
                                        : `Awaiting answer${thread.addressed_to ? ` from ${thread.addressed_to.name}` : ""}`}
                                    {" · "}
                                    <button type="button" onClick={() => resolveThread(leadId, thread.id)} className="text-gray-400 hover:text-emerald-600 underline underline-offset-2">
                                        mark answered
                                    </button>
                                </>
                            ) : (thread.addressed_to ? `For ${thread.addressed_to.name}` : ""))
                            : `Answered${thread.resolved_by ? ` by ${thread.resolved_by}` : ""} · ${fmt(thread.resolved_at)}`}
                    </span>
                    <div className="flex items-center gap-4 text-[12px] font-semibold text-gray-400">
                        {thread.can_edit && (
                            <button type="button" onClick={() => { setDraft(thread.body || ""); setEditing(true); }} className="hover:text-gray-900">Edit</button>
                        )}
                        <button
                            type="button"
                            onClick={() => (canReplyInline ? setReplyOpen((v) => ! v) : focusReply())}
                            className={replyOpen ? "text-gray-900" : "hover:text-gray-900"}
                        >
                            Reply
                        </button>
                    </div>
                </div>
            )}

            {replyOpen && canReplyInline && (
                <ReplyComposer
                    leadId={leadId}
                    anchor={anchor}
                    parentId={thread.id}
                    clientVisible={thread.client_visible}
                    onDone={() => setReplyOpen(false)}
                />
            )}

            {replies.length > 0 && (
                <div className="mt-2 pl-5 border-l border-gray-200 space-y-0">
                    {replies.map((c) => (
                        <ThreadItem
                            key={c.id}
                            thread={c}
                            leadId={leadId}
                            anchor={anchor}
                            caseStaff={caseStaff}
                            childrenOf={childrenOf}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/** A compact inline reply box, posting a child comment on the same anchor. */
function ReplyComposer({ leadId, anchor, parentId, clientVisible, onDone }) {
    const [body, setBody] = useState("");
    const [posting, setPosting] = useState(false);

    const submit = () => {
        if (! body.trim()) return toast.error("Write a reply first");
        setPosting(true);
        router.post(`/portal/immigration/cases/${leadId}/threads`, {
            ...anchor,
            parent_id: parentId,
            body,
            client_visible: !! clientVisible,
        }, {
            preserveScroll: true,
            onSuccess: () => { toast.success("Reply added"); setBody(""); onDone?.(); },
            onError: (e) => toast.error(Object.values(e)[0] || "Could not reply"),
            onFinish: () => setPosting(false),
        });
    };

    return (
        <div className="mt-2 space-y-2">
            <textarea
                autoFocus
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={2}
                maxLength={2000}
                placeholder="Write a reply…"
                className="w-full text-[13px] px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 resize-none"
            />
            <div className="flex items-center gap-3">
                <button type="button" onClick={submit} disabled={posting}
                    className="text-[13px] font-bold text-teal-700 hover:text-teal-900 disabled:opacity-50">Post reply</button>
                <button type="button" onClick={onDone}
                    className="text-[12px] font-semibold text-gray-400 hover:text-gray-700">Cancel</button>
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
export function ThreadComposer({ leadId, caseStaff = [], fixedAnchor = null, stages = [], compact = false, plain = false, placeholder = "Ask a question…" }) {
    const [open, setOpen] = useState(! compact);
    const [body, setBody] = useState("");
    const [addressedTo, setAddressedTo] = useState("");
    const [requires, setRequires] = useState(false);
    // Audience: false = internal only (default), true = shared with the client.
    const [clientVisible, setClientVisible] = useState(false);
    const [anchorType, setAnchorType] = useState("case");
    const [anchorKey, setAnchorKey] = useState("");
    const [posting, setPosting] = useState(false);

    const composerId = composerIdFor(fixedAnchor);

    const submit = () => {
        if (! body.trim()) return toast.error(plain ? "Write a note first" : "Write the question first");
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
            client_visible: clientVisible,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(clientVisible ? "Shared with the client" : (plain ? "Note added" : "Thread posted"));
                setBody(""); setRequires(false); setAddressedTo(""); setAnchorKey(""); setClientVisible(false);
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
                <MessageSquare size={11} /> {plain ? "Add a note" : "Ask a question"}
            </button>
        );
    }

    // Two audience "tabs" — Internal only (default) then Client sees this.
    const audienceTabs = (
        <div className="flex items-center gap-3 text-[12px] font-semibold">
            <button
                type="button"
                onClick={() => setClientVisible(false)}
                className={! clientVisible ? "text-gray-900 border-b-2 border-teal-600 pb-0.5" : "text-gray-400 hover:text-gray-700"}
            >
                Internal only
            </button>
            <button
                type="button"
                onClick={() => setClientVisible(true)}
                className={clientVisible ? "text-gray-900 border-b-2 border-teal-600 pb-0.5" : "text-gray-400 hover:text-gray-700"}
            >
                Client sees this
            </button>
            <span className="text-[11px] font-normal text-gray-400">
                {clientVisible ? "Appears in the client portal and the reminder email" : "Staff only. Never shown to the client."}
            </span>
        </div>
    );

    return (
        <div className={plain ? "pt-2 space-y-2" : (compact ? "rounded-xl border border-gray-200 bg-white p-3 space-y-2" : "rounded-xl border border-gray-200 bg-white p-3 space-y-2")}>
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
                id={composerId || undefined}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={compact ? 2 : 3}
                maxLength={2000}
                placeholder={placeholder}
                className={plain
                    ? "w-full text-[13px] px-0 py-1.5 bg-transparent border-0 border-b border-gray-200 focus:outline-none focus:border-gray-400 resize-none placeholder-gray-400"
                    : "w-full text-[13px] px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 resize-none"}
            />
            <div className="flex items-center justify-between gap-3 flex-wrap">
                {audienceTabs}
                <div className="flex items-center gap-3">
                    {! plain && (
                        <select
                            value={addressedTo}
                            onChange={(e) => setAddressedTo(e.target.value)}
                            className="text-[11px] px-2 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none max-w-[160px]"
                        >
                            <option value="">To (anyone)</option>
                            {caseStaff.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    )}
                    <label className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 cursor-pointer">
                        <input type="checkbox" checked={requires} onChange={(e) => setRequires(e.target.checked)}
                            className="rounded border-gray-300 text-amber-600 focus:ring-0 w-3.5 h-3.5" />
                        Needs an answer
                    </label>
                    {compact && (
                        <button type="button" onClick={() => setOpen(false)} className="text-[12px] font-semibold text-gray-400 hover:text-gray-700">Cancel</button>
                    )}
                    <button type="button" onClick={submit} disabled={posting}
                        className="text-[13px] font-bold text-teal-700 hover:text-teal-900 disabled:opacity-50">
                        Post
                    </button>
                </div>
            </div>
        </div>
    );
}
