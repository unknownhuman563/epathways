import { Mail, MessageSquare, Inbox } from "lucide-react";

// Phase 1 reads from message_logs directly. Build 11.A's Communications
// service will replace the data source when it ships; the rendering shape
// is intentionally compatible with what 11.A is expected to return.

const STATUS_TONE = {
    sent:    "bg-emerald-50 text-emerald-700 border-emerald-200",
    queued:  "bg-blue-50 text-blue-700 border-blue-200",
    failed:  "bg-red-50 text-red-700 border-red-200",
    bounced: "bg-red-50 text-red-700 border-red-200",
};

export default function CommunicationsTab({ communications = [] }) {
    if (communications.length === 0) {
        return (
            <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <Inbox size={32} className="mx-auto text-gray-300" />
                <p className="mt-3 text-sm font-semibold text-gray-700">No messages yet</p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    Emails and SMS sent to this client will appear here once Build 11.A's Communications service ships.
                </p>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                Recent communications ({communications.length})
            </h3>
            <ul className="space-y-1.5">
                {communications.map((m) => {
                    const Icon = m.channel === "sms" ? MessageSquare : Mail;
                    return (
                        <li key={m.id} className="flex items-start gap-3 px-3.5 py-2.5 rounded-lg border border-gray-100 bg-white">
                            <Icon size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {m.subject || (m.channel === "sms" ? "SMS" : "(no subject)")}
                                    </p>
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9.5px] font-semibold border ${STATUS_TONE[m.status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                                        {m.status}
                                    </span>
                                </div>
                                <p className="text-[11.5px] text-gray-500 mt-0.5 line-clamp-2">{m.snippet || "—"}</p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    {m.recipient_address}
                                    {m.sent_at && <> · sent {formatDateTime(m.sent_at)}</>}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

const formatDateTime = (iso) =>
    iso ? new Date(iso).toLocaleString("en-NZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
