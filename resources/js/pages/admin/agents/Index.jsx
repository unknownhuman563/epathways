import { useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { Search, Mail, Phone, MapPin, Users, FileSignature, ChevronRight, UserCheck } from "lucide-react";

// Agents module — list of referral agents (role=agent). Gated behind the
// `agents` module (default super-admin-only). Each row opens the agent's
// profile, where their leads + Referral Agent Agreement live.
export default function AgentsIndex({ agents = [] }) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (! q) return agents;
        return agents.filter((a) =>
            (a.name || "").toLowerCase().includes(q)
            || (a.email || "").toLowerCase().includes(q)
            || (a.location || "").toLowerCase().includes(q)
            || (a.referral_code || "").toLowerCase().includes(q)
        );
    }, [agents, search]);

    const initials = (name = "") =>
        (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join("") || "?";

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            <Head title="Agents" />

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-400 mb-1">Module</p>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <UserCheck size={22} /> Agents
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Referral agents, their leads, and agreements.</p>
                </div>
                <div className="w-full sm:w-72 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search name, email, location…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="p-16 text-center text-gray-400">
                        <Users size={26} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm font-medium">No agents found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="bg-gray-50/60 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="px-5 py-3">Agent</th>
                                    <th className="px-3 py-3">Contact</th>
                                    <th className="px-3 py-3">Location</th>
                                    <th className="px-3 py-3">Leads added</th>
                                    <th className="px-3 py-3">Agreement</th>
                                    <th className="px-3 py-3 text-right pr-5">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((a) => (
                                    <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 text-gray-500 text-[11px] font-bold ring-1 ring-gray-200 shrink-0">
                                                    {a.avatar_url ? <img src={a.avatar_url} alt={a.name} className="w-full h-full object-cover" /> : initials(a.name)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-gray-900 truncate">{a.name}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono">{a.referral_code || "—"}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-1.5 text-gray-600"><Mail size={12} className="text-gray-400" /> <span className="truncate max-w-[200px]">{a.email || "—"}</span></div>
                                            <div className="flex items-center gap-1.5 text-gray-500 mt-0.5"><Phone size={12} className="text-gray-400" /> {a.phone || "—"}</div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="inline-flex items-center gap-1 text-gray-600"><MapPin size={12} className="text-gray-400" /> {a.location || "—"}</span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold tabular-nums">
                                                <Users size={12} /> {a.leads_count}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            {a.has_agreement ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <FileSignature size={11} /> On file
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">None</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-right pr-5">
                                            <Link
                                                href={`/admin/agents/${a.id}`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-semibold hover:bg-black transition-colors"
                                            >
                                                View profile <ChevronRight size={12} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
