import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { Inbox, Search, Check, X, ExternalLink, FileText } from "lucide-react";
import Pagination from "@/components/ui/Pagination";

const STATUS_STYLE = {
    Submitted: "bg-blue-50 text-blue-700 border-blue-100",
    UnderReview: "bg-amber-50 text-amber-700 border-amber-100",
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Rejected: "bg-rose-50 text-rose-700 border-rose-100",
};

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

const TABS = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
];

export default function DocumentQueue({ documents = { data: [], links: [] }, filters = {}, counts = {} }) {
    const rows = documents?.data ?? [];
    const [selected, setSelected] = useState([]);
    const [search, setSearch] = useState(filters.search ?? "");

    const setFilter = (next = {}) => {
        const params = {
            status: next.status !== undefined ? next.status : filters.status ?? "pending",
            search: next.search !== undefined ? next.search : search,
        };
        Object.keys(params).forEach((k) => (!params[k] || params[k] === "pending") && delete params[k]);
        router.get("/admin/document-queue", params, { preserveState: true, preserveScroll: true, replace: true });
    };

    const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    const toggleAll = () => setSelected((s) => (s.length === rows.length ? [] : rows.map((r) => r.id)));

    const act = (ids, action) => {
        if (!ids.length) return;
        let reason = null;
        if (action === "reject") {
            reason = window.prompt("Reason for rejection (shown to the lead):", "");
            if (reason === null) return; // cancelled
        }
        router.post("/admin/document-queue/bulk", { ids, action, reason }, {
            preserveScroll: true,
            onSuccess: () => setSelected([]),
        });
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <Head title="Document Queue" />

            <header className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Inbox className="w-6 h-6 text-gray-700" /> Document Queue
                        {(counts.pending ?? 0) > 0 && (
                            <span className="text-xs font-bold bg-blue-600 text-white rounded-full px-2 py-0.5">{counts.pending} pending</span>
                        )}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Lead-submitted documents from across every application.</p>
                </div>
            </header>

            <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-2">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setFilter({ status: t.key })}
                            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium ${(filters.status ?? "pending") === t.key ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); setFilter({ search }); }} className="relative flex-1 min-w-[220px] max-w-sm">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search lead name or code…" className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-gray-300" />
                </form>
            </div>

            {selected.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm">
                    <span className="font-medium">{selected.length} selected</span>
                    <button onClick={() => act(selected, "approve")} className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 rounded-lg hover:bg-emerald-700 font-semibold">
                        <Check size={14} /> Approve
                    </button>
                    <button onClick={() => act(selected, "reject")} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 rounded-lg hover:bg-rose-700 font-semibold">
                        <X size={14} /> Reject
                    </button>
                </div>
            )}

            <div className="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-y border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3 w-10">
                                    <input type="checkbox" checked={rows.length > 0 && selected.length === rows.length} onChange={toggleAll} />
                                </th>
                                <th className="px-4 py-3">Lead</th>
                                <th className="px-4 py-3">Document</th>
                                <th className="px-4 py-3">Submitted</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {rows.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-16 text-center text-sm text-gray-400">Nothing in the queue.</td></tr>
                            ) : (
                                rows.map((d) => (
                                    <tr key={d.id} className="hover:bg-gray-50/40">
                                        <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(d.id)} onChange={() => toggle(d.id)} /></td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-gray-900 text-sm">{d.lead_name}</div>
                                            <div className="text-xs text-gray-400">{d.tracking_code}{d.visa_type ? ` · ${d.visa_type}` : ""}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                <FileText size={14} className="text-gray-400" />
                                                <span className="truncate max-w-[200px]">{d.original_name}</span>
                                                {d.url && <a href={d.url} target="_blank" rel="noopener" className="text-gray-400 hover:text-gray-700"><ExternalLink size={13} /></a>}
                                            </div>
                                            {d.checklist_key && <div className="text-[11px] text-gray-400 mt-0.5">{d.checklist_key}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{fmtDate(d.created_at)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[d.status] || "bg-gray-100 text-gray-500 border-gray-200"}`}>{d.status}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button onClick={() => act([d.id], "approve")} title="Approve" className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"><Check size={15} /></button>
                                                <button onClick={() => act([d.id], "reject")} title="Reject" className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><X size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination links={documents?.links ?? []} />
        </div>
    );
}
