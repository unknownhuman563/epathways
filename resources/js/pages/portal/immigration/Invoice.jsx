import React, { useState, useMemo } from "react";
import { Head, Link } from "@inertiajs/react";
import { ReceiptText, Search, ChevronRight } from "lucide-react";

/**
 * Invoice generation workspace. Lists immigration cases so staff can pick
 * one and generate its invoice.
 */
export default function Invoice({ cases = [] }) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return cases;
        return cases.filter((c) =>
            [c.name, c.lead_id, c.email, c.inz_visa_type, c.country]
                .some((v) => (v || "").toString().toLowerCase().includes(q))
        );
    }, [cases, search]);

    return (
        <div className="space-y-5 max-w-[1400px] mx-auto pb-12">
            <Head title="Invoice — Immigration" />

            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100/70">
                    <ReceiptText size={18} />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-gray-900">Invoice</h1>
                    <p className="text-sm text-gray-500">Generate an invoice for a case.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="px-4 sm:px-5 py-3 border-b border-gray-100">
                    <div className="relative max-w-md">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, lead ID, visa type…"
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:bg-white focus:border-gray-300 transition-colors"
                        />
                    </div>
                </div>

                <div className="divide-y divide-gray-50">
                    {filtered.length === 0 && (
                        <div className="px-5 py-12 text-center text-sm text-gray-400">No cases found.</div>
                    )}
                    {filtered.map((c) => (
                        <Link
                            key={c.id}
                            href={`/portal/immigration/cases/${c.id}/profile`}
                            className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                                <p className="text-[11px] text-gray-400 truncate">
                                    {c.lead_id}{c.email ? ` · ${c.email}` : ""}
                                </p>
                            </div>
                            <div className="hidden sm:block text-xs text-gray-500 truncate max-w-[180px]">
                                {c.inz_visa_type || "—"}
                            </div>
                            <div className="hidden md:block text-xs text-gray-400 truncate max-w-[140px]">
                                {c.immigration_stage || "Unassigned"}
                            </div>
                            <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
