import { useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { Globe, Search } from "lucide-react";

// Adviser's own cases (row-scoped server-side). Opens the full case profile
// under the adviser layout.
export default function AdviserCases({ cases = [] }) {
    const [q, setQ] = useState("");
    const filtered = useMemo(() => {
        const t = q.trim().toLowerCase();
        if (!t) return cases;
        return cases.filter((c) => [c.name, c.lead_id, c.visa_type, c.inz_status].filter(Boolean).some((v) => String(v).toLowerCase().includes(t)));
    }, [cases, q]);

    return (
        <div className="max-w-[1000px] mx-auto pb-12 space-y-5">
            <Head title="My cases" />
            <div>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">My cases</h1>
                <p className="text-sm text-gray-500 mt-1">Immigration cases assigned to you.</p>
            </div>

            <div className="relative max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cases…"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688]" />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
                {filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <Globe size={26} className="mx-auto text-gray-300" />
                        <p className="mt-3 text-sm text-gray-700 font-semibold">No cases</p>
                        <p className="text-xs text-gray-500 mt-1">Cases assigned to you appear here.</p>
                    </div>
                ) : filtered.map((c) => (
                    <Link key={c.id} href={`/portal/immigration-adviser/cases/${c.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60">
                        <div className="w-9 h-9 rounded-xl bg-[#009688]/10 flex items-center justify-center flex-shrink-0">
                            <Globe size={16} className="text-[#009688]" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-gray-900 truncate">{c.name} <span className="text-[11px] font-normal text-gray-400">{c.lead_id}</span></div>
                            <div className="text-[12px] text-gray-500 truncate">{c.visa_type || "No visa type"}{c.stage ? ` · ${c.stage}` : ""}</div>
                        </div>
                        {c.inz_status && <span className="text-[11px] font-semibold text-gray-500 border border-gray-200 rounded px-2 py-0.5 flex-shrink-0">{c.inz_status}</span>}
                    </Link>
                ))}
            </div>
        </div>
    );
}
