import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { Ticket, Search, X } from "lucide-react";
import Pagination from "@/components/ui/Pagination";

const STATUS_META = {
    open:        { label: "Open",        cls: "bg-blue-50 text-blue-700 border-blue-100" },
    in_review:   { label: "In review",   cls: "bg-indigo-50 text-indigo-700 border-indigo-100" },
    planned:     { label: "Planned",     cls: "bg-purple-50 text-purple-700 border-purple-100" },
    in_progress: { label: "In progress", cls: "bg-amber-50 text-amber-700 border-amber-100" },
    done:        { label: "Done",        cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    declined:    { label: "Declined",    cls: "bg-gray-100 text-gray-500 border-gray-200" },
};
const PRIORITY_CLS = { low: "text-gray-400", normal: "text-gray-600", high: "text-amber-600", urgent: "text-rose-600" };
const CAT_LABEL = { change: "Change", feature: "Feature", bug: "Bug", other: "Other" };
const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const titleCase = (s) => (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function SystemTickets({ tickets = { data: [], links: [] }, filters = {}, meta = {}, counts = {} }) {
    const rows = tickets?.data ?? [];
    const [search, setSearch] = useState(filters.search ?? "");
    const [active, setActive] = useState(null); // ticket open in the detail drawer

    const setFilter = (next = {}) => {
        const params = {
            status: next.status !== undefined ? next.status : filters.status ?? "",
            search: next.search !== undefined ? next.search : search,
        };
        Object.keys(params).forEach((k) => !params[k] && delete params[k]);
        router.get("/admin/system-tickets", params, { preserveState: true, preserveScroll: true, replace: true });
    };

    const statusTabs = ["", ...(meta.statuses ?? [])];

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <Head title="System Tickets" />

            <header className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Ticket className="w-6 h-6 text-gray-700" /> System Requests
                        {(counts.open ?? 0) > 0 && <span className="text-xs font-bold bg-blue-600 text-white rounded-full px-2 py-0.5">{counts.open} open</span>}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Change &amp; feature requests raised by the departments.</p>
                </div>
            </header>

            <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-1.5 flex-wrap">
                    {statusTabs.map((s) => (
                        <button key={s || "all"} onClick={() => setFilter({ status: s })}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${(filters.status ?? "") === s ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                            {s ? STATUS_META[s]?.label ?? titleCase(s) : "All"}
                        </button>
                    ))}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); setFilter({ search }); }} className="relative flex-1 min-w-[200px] max-w-xs ml-auto">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requests…" className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-gray-300" />
                </form>
            </div>

            <div className="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-y border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-3">Request</th>
                                <th className="px-6 py-3">Department</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Submitted</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {rows.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-16 text-center text-sm text-gray-400">No requests yet.</td></tr>
                            ) : rows.map((t) => (
                                <tr key={t.id} onClick={() => setActive(t)} className="hover:bg-gray-50/40 cursor-pointer">
                                    <td className="px-6 py-3">
                                        <div className="font-semibold text-gray-900 text-sm">{t.title}</div>
                                        <div className="text-xs text-gray-400">{t.ticket_ref}{t.submitter ? ` · ${t.submitter}` : ""}</div>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-600 capitalize">{t.department || "—"}</td>
                                    <td className="px-6 py-3 text-sm">
                                        <span className="text-gray-600">{CAT_LABEL[t.category] ?? t.category}</span>
                                        <span className={`ml-2 text-[11px] font-semibold ${PRIORITY_CLS[t.priority] ?? ""}`}>{titleCase(t.priority)}</span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_META[t.status]?.cls ?? "bg-gray-100 text-gray-500"}`}>{STATUS_META[t.status]?.label ?? titleCase(t.status)}</span>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-500">{fmt(t.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination links={tickets?.links ?? []} />

            {active && <TicketDrawer ticket={active} statuses={meta.statuses ?? []} onClose={() => setActive(null)} />}
        </div>
    );
}

function TicketDrawer({ ticket, statuses, onClose }) {
    const [status, setStatus] = useState(ticket.status);
    const [response, setResponse] = useState(ticket.admin_response ?? "");
    const [saving, setSaving] = useState(false);

    const save = () => {
        setSaving(true);
        router.post(`/admin/system-tickets/${ticket.id}`, { status, admin_response: response }, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
            onSuccess: onClose,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onMouseDown={onClose}>
            <div className="w-full max-w-md bg-white h-full shadow-xl overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{ticket.title}</h2>
                        <p className="text-xs text-gray-400">{ticket.ticket_ref} · {ticket.department} · {ticket.submitter}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-5">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Request</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                    </div>

                    <label className="block">
                        <span className="block text-xs font-semibold text-gray-600 mb-1">Status</span>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-gray-300">
                            {statuses.map((s) => <option key={s} value={s}>{STATUS_META[s]?.label ?? titleCase(s)}</option>)}
                        </select>
                    </label>

                    <label className="block">
                        <span className="block text-xs font-semibold text-gray-600 mb-1">Response to the department</span>
                        <textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={4} placeholder="Optional — they'll see this in their notification." className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-gray-300" />
                    </label>

                    <button onClick={save} disabled={saving} className="w-full px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black disabled:opacity-50">
                        {saving ? "Saving…" : "Save & notify department"}
                    </button>

                    {ticket.resolver && (
                        <p className="text-[11px] text-gray-400">Resolved by {ticket.resolver} on {fmt(ticket.resolved_at)}.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
