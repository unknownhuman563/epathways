import { Pin, StickyNote, Activity, MessagesSquare } from "lucide-react";
import { ThreadItem, ThreadComposer } from "@/components/immigration/case-profile/threads";

// Phase 1 ships read-only notes + activity stream. Write actions (add
// note, etc.) ride on the existing Lead-note endpoints; wiring lands
// alongside the rest of the staff workflow in later phases.
//
// Build 12 phase 6 adds anchored threads (§7). Only case / gate / stage
// threads live here — document threads render on their document row (Documents
// tab) and step threads on their step (Process tab), never in this feed.

const GENERAL_ANCHORS = ["case", "gate", "stage"];

export default function NotesTab({ notes = [], activity = [], threads = [], lead, caseStaff = [] }) {
    const generalThreads = threads.filter((t) => GENERAL_ANCHORS.includes(t.anchor_type));
    const openCount = generalThreads.filter((t) => ! t.resolved_at).length;

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
                            generalThreads.map((t) => (
                                <ThreadItem key={t.id} thread={t} leadId={lead.id} anchorLabel={anchorLabel(t)} />
                            ))
                        )}
                    </div>
                </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <section>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 inline-flex items-center gap-2">
                        <StickyNote size={13} className="text-gray-400" />
                        Notes ({notes.length})
                    </h3>
                    {notes.length === 0 ? (
                        <EmptyBlock icon={StickyNote} label="No notes yet" />
                    ) : (
                        <ul className="space-y-2">
                            {notes.map((n) => (
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
                            {activity.map((a) => (
                                <li key={a.id} className="px-3 py-2 rounded-lg border border-gray-100 bg-white">
                                    <p className="text-xs text-gray-900">
                                        <span className="font-semibold">{a.actor_name}</span>
                                        <span className="text-gray-500"> · {a.description || a.action}</span>
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(a.created_at)}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
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
