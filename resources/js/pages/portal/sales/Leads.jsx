import { useState, useMemo } from "react";
import { Head, router } from "@inertiajs/react";
import { Search } from "lucide-react";

const STATUS_STYLES = {
    New: "bg-blue-100 text-blue-700 border-blue-200",
    Contacted: "bg-amber-100 text-amber-700 border-amber-200",
    Qualified: "bg-purple-100 text-purple-700 border-purple-200",
    Processing: "bg-indigo-100 text-indigo-700 border-indigo-200",
    Closed: "bg-emerald-100 text-emerald-700 border-emerald-200",
};
const statusClass = (s) => STATUS_STYLES[s] || "bg-gray-100 text-gray-700 border-gray-200";
const scoreClass = (n) => (n >= 70 ? "bg-emerald-100 text-emerald-700" : n >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700");
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default function SalesLeads({ leads = [], statuses = [] }) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [savingId, setSavingId] = useState(null);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return leads.filter((l) => {
            const hay = `${l.name || ""} ${l.email || ""} ${l.lead_id || ""} ${l.phone || ""}`.toLowerCase();
            const matchSearch = !q || hay.includes(q);
            const matchStatus = statusFilter === "All" || l.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [leads, search, statusFilter]);

    const changeStatus = (lead, status) => {
        if (status === lead.status) return;
        setSavingId(lead.id);
        router.post(`/portal/sales/leads/${lead.id}`, { status }, {
            preserveScroll: true,
            onFinish: () => setSavingId(null),
        });
    };

    return (
        <div className="space-y-5 max-w-7xl mx-auto">
            <Head title="Leads — Sales Portal" />

            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leads</h1>
                <p className="text-sm text-gray-500 mt-1">Pipeline — change a lead's status inline.</p>
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-2xl border border-gray-50 shadow-sm p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, email or ID…"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {["All", ...statuses].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${statusFilter === s ? "bg-gray-900 text-white border-gray-900 shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-3">Lead</th>
                                <th className="px-6 py-3">Source</th>
                                <th className="px-6 py-3">Course</th>
                                <th className="px-6 py-3">AI score</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Created</th>
                                <th className="px-6 py-3 text-right pr-6">Update</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-16 text-center text-gray-400 text-sm">No leads match your filters.</td></tr>
                            ) : filtered.map((l) => (
                                <tr key={l.id} className="hover:bg-gray-50/40">
                                    <td className="px-6 py-3">
                                        <div className="font-semibold text-gray-900 text-sm">{l.name}</div>
                                        <div className="text-xs text-gray-400">{l.email || "—"}{l.phone ? ` · ${l.phone}` : ""}</div>
                                        {l.lead_id && <div className="text-[11px] text-gray-300 font-mono">{l.lead_id}</div>}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{l.source || "—"}</td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{l.course || "—"}</td>
                                    <td className="px-6 py-3">
                                        {l.ai_score != null
                                            ? <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${scoreClass(l.ai_score)}`} title={l.ai_pathway || ""}>{l.ai_score}/100</span>
                                            : <span className="text-xs text-gray-400">{l.ai_status === "processing" ? "analyzing…" : "—"}</span>}
                                    </td>
                                    <td className="px-6 py-3"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${statusClass(l.status)}`}>{l.status}</span></td>
                                    <td className="px-6 py-3 text-sm text-gray-500">{fmtDate(l.created_at)}</td>
                                    <td className="px-6 py-3 text-right pr-6">
                                        <select
                                            value={l.status}
                                            disabled={savingId === l.id}
                                            onChange={(e) => changeStatus(l, e.target.value)}
                                            className="text-xs rounded-lg border border-gray-200 bg-white py-1.5 pl-2 pr-7 outline-none hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                                        >
                                            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
