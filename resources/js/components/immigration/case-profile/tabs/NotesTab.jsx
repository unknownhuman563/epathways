import { useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import { Pin, StickyNote, Activity, MessagesSquare, Plus } from "lucide-react";
import { ThreadItem, ThreadComposer } from "@/components/immigration/case-profile/threads";

// Phase 1 ships read-only notes + activity stream. Write actions (add
// note, etc.) ride on the existing Lead-note endpoints; wiring lands
// alongside the rest of the staff workflow in later phases.
//
// Build 12 phase 6 adds anchored threads (§7). Only case / gate / stage
// threads live here — document threads render on their document row (Documents
// tab) and step threads on their step (Process tab), never in this feed.

const GENERAL_ANCHORS = ["case", "gate", "stage"];

const PREVIEW = 3; // latest N shown before "see more"

export default function NotesTab({ notes = [], activity = [], threads = [], lead, caseStaff = [] }) {
    const generalThreads = threads.filter((t) => GENERAL_ANCHORS.includes(t.anchor_type));
    const openCount = generalThreads.filter((t) => ! t.resolved_at).length;

    // Each feed shows the latest few, with a "see more" to expand in place.
    const [showAllThreads, setShowAllThreads] = useState(false);
    const [showAllNotes, setShowAllNotes] = useState(false);
    const [showAllActivity, setShowAllActivity] = useState(false);
    const visibleThreads = showAllThreads ? generalThreads : generalThreads.slice(0, PREVIEW);
    const visibleNotes = showAllNotes ? notes : notes.slice(0, PREVIEW);
    const visibleActivity = showAllActivity ? activity : activity.slice(0, PREVIEW);

    const anchorLabel = (t) =>
        t.anchor_type === "gate" ? `gate ${t.anchor_key || ""}`.trim()
            : t.anchor_type === "stage" ? `stage: ${t.anchor_key || ""}`.trim()
                : "case";

    return (
        <div className="space-y-6">
            {lead?.id && (
                <section>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 inline-flex items-center gap-2">
                        <MessagesSquare size={13} className="text-gray-400" />
                        Threads{openCount > 0 && <span className="text-amber-600">· {openCount} open</span>}
                    </h3>
                    <div className="space-y-2">
                        <ThreadComposer leadId={lead.id} caseStaff={caseStaff} placeholder="Ask a question on this case, a gate or a stage…" />
                        {generalThreads.length === 0 ? (
                            <p className="text-[11px] text-gray-400 px-1">No threads on the case, a gate or a stage yet.</p>
                        ) : (
                            <>
                                {visibleThreads.map((t) => (
                                    <ThreadItem key={t.id} thread={t} leadId={lead.id} anchorLabel={anchorLabel(t)} />
                                ))}
                                <SeeMore total={generalThreads.length} shown={visibleThreads.length} expanded={showAllThreads} onToggle={() => setShowAllThreads((v) => !v)} />
                            </>
                        )}
                    </div>
                </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <section>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 inline-flex items-center gap-2">
                        <StickyNote size={13} className="text-gray-400" />
                        Internal notes ({notes.length})
                    </h3>
                    {lead?.id && <NoteComposer leadId={lead.id} />}
                    {notes.length === 0 ? (
                        <EmptyBlock icon={StickyNote} label="No notes yet" />
                    ) : (
                        <ul className="space-y-2">
                            {visibleNotes.map((n) => (
                                <li key={n.id} className="px-3.5 py-3 rounded-lg border border-gray-100 bg-white">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-snug">{n.body}</p>
                                        {n.pinned && <Pin size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />}
                                    </div>
                                    <p className="text-[10.5px] text-gray-400 mt-1.5">
                                        {n.author || "Unknown"} · {formatDateTime(n.created_at)}
                                    </p>
                                </li>
                            ))}
                            <SeeMore total={notes.length} shown={visibleNotes.length} expanded={showAllNotes} onToggle={() => setShowAllNotes((v) => !v)} />
                        </ul>
                    )}
                </section>

                <section>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 inline-flex items-center gap-2">
                        <Activity size={13} className="text-gray-400" />
                        Activity ({activity.length})
                    </h3>
                    {activity.length === 0 ? (
                        <EmptyBlock icon={Activity} label="No activity yet" />
                    ) : (
                        <ul className="space-y-1.5">
                            {visibleActivity.map((a) => (
                                <li key={a.id} className="px-3 py-2 rounded-lg border border-gray-100 bg-white">
                                    <p className="text-xs text-gray-900">
                                        <span className="font-semibold">{a.actor_name}</span>
                                        <span className="text-gray-500"> · {a.description || a.action}</span>
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(a.created_at)}</p>
                                </li>
                            ))}
                            <SeeMore total={activity.length} shown={visibleActivity.length} expanded={showAllActivity} onToggle={() => setShowAllActivity((v) => !v)} />
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}

function NoteComposer({ leadId }) {
    const [body, setBody] = useState("");
    const [pinned, setPinned] = useState(false);
    const [saving, setSaving] = useState(false);

    const submit = () => {
        if (!body.trim()) return;
        setSaving(true);
        router.post(`/admin/leads/${leadId}/notes`, { body, pinned }, {
            preserveScroll: true,
            onSuccess: () => { setBody(""); setPinned(false); toast.success("Note added"); },
            onError: (e) => toast.error(Object.values(e)[0] || "Could not add note"),
            onFinish: () => setSaving(false),
        });
    };

    return (
        <div className="mb-3 rounded-xl border border-gray-100 bg-white p-3">
            <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={2}
                placeholder="Add an internal note (visible to staff only)…"
                className="w-full text-sm outline-none resize-none placeholder-gray-400"
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                <label className="inline-flex items-center gap-1.5 text-[12px] text-gray-500 cursor-pointer">
                    <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="rounded" />
                    <Pin size={12} className={pinned ? "text-amber-500" : "text-gray-400"} /> Pin
                </label>
                <button type="button" onClick={submit} disabled={saving || !body.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[12px] font-semibold hover:bg-black disabled:opacity-40">
                    <Plus size={13} /> {saving ? "Adding…" : "Add note"}
                </button>
            </div>
        </div>
    );
}

// "See N more / Show less" toggle — hidden when everything already fits.
function SeeMore({ total, shown, expanded, onToggle }) {
    if (total <= PREVIEW) return null;
    return (
        <button
            type="button"
            onClick={onToggle}
            className="mt-1 text-[11px] font-semibold text-gray-500 hover:text-gray-900 px-1 py-1"
        >
            {expanded ? "Show less" : `See ${total - shown} more`}
        </button>
    );
}

function EmptyBlock({ icon: Icon, label }) {
    return (
        <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <Icon size={24} className="mx-auto text-gray-300" />
            <p className="text-sm text-gray-500 mt-2">{label}</p>
        </div>
    );
}

const formatDateTime = (iso) =>
    iso ? new Date(iso).toLocaleString("en-NZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
