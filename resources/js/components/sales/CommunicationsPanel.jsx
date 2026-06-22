import { useState, useEffect, useCallback } from "react";
import { Mail, MessageSquare, Loader2, ChevronDown, AlertTriangle } from "lucide-react";

const STATUS = {
    queued:   "bg-blue-50 text-blue-700 border-blue-100",
    sent:     "bg-emerald-50 text-emerald-700 border-emerald-100",
    failed:   "bg-rose-50 text-rose-700 border-rose-100",
    bounced:  "bg-amber-50 text-amber-700 border-amber-100",
};
const fmt = (iso) =>
    iso ? new Date(iso).toLocaleString("en-NZ", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

/**
 * Staff-side communications history for a lead — every email/SMS sent to them.
 * Read-only; newest first; expand a row to see the full body. Matches the
 * CRM gray/white theme.
 */
export default function CommunicationsPanel({ leadId }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nextPage, setNextPage] = useState(null);
    const [openId, setOpenId] = useState(null);

    const load = useCallback(async (url) => {
        setLoading(true);
        try {
            const res = await fetch(url, {
                headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
                credentials: "same-origin",
            });
            const data = res.ok ? await res.json() : { data: [], next_page_url: null };
            setLogs((prev) => (url.includes("page=") ? [...prev, ...(data.data ?? [])] : (data.data ?? [])));
            setNextPage(data.next_page_url ?? null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(`/admin/leads/${leadId}/communications`); }, [leadId, load]);

    if (loading && logs.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex items-center justify-center text-gray-400 text-sm gap-2">
                <Loader2 size={16} className="animate-spin" /> Loading communications…
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <Mail className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600">No messages sent yet</p>
                <p className="text-xs text-gray-400 mt-1">Emails and texts sent to this lead will appear here.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
                {logs.map((m) => {
                    const isEmail = m.channel === "email";
                    const open = openId === m.id;
                    return (
                        <div key={m.id} className="px-5 py-3.5">
                            <button onClick={() => setOpenId(open ? null : m.id)} className="w-full flex items-start gap-3 text-left">
                                <span className="mt-0.5 w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                                    {isEmail ? <Mail size={15} /> : <MessageSquare size={15} />}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-semibold text-gray-900 truncate">
                                            {isEmail ? (m.subject || "(no subject)") : "SMS"}
                                        </span>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS[m.status] || "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                            {m.status}
                                        </span>
                                    </div>
                                    {!open && <p className="text-xs text-gray-500 mt-0.5 truncate">{(m.body || "").slice(0, 100)}</p>}
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        {fmt(m.created_at)}{m.sender ? ` · by ${m.sender}` : ""}{m.template_key ? ` · ${m.template_key}` : ""}
                                    </p>
                                </div>
                                <ChevronDown size={14} className={`text-gray-300 shrink-0 mt-1 transition-transform ${open ? "rotate-180" : ""}`} />
                            </button>
                            {open && (
                                <div className="mt-3 ml-11 rounded-xl bg-gray-50 border border-gray-100 p-3.5">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{m.body}</p>
                                    {m.error && (
                                        <p className="mt-2 text-xs text-rose-600 flex items-center gap-1.5">
                                            <AlertTriangle size={12} /> {m.error}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {nextPage && (
                <button onClick={() => load(nextPage)} disabled={loading} className="w-full py-3 text-xs font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                    {loading ? "Loading…" : "Load older messages"}
                </button>
            )}
        </div>
    );
}
