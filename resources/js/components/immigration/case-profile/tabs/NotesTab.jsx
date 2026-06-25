import { Pin, StickyNote, Activity } from "lucide-react";

// Phase 1 ships read-only notes + activity stream. Write actions (add
// note, etc.) ride on the existing Lead-note endpoints; wiring lands
// alongside the rest of the staff workflow in later phases.

export default function NotesTab({ notes = [], activity = [] }) {
    return (
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
