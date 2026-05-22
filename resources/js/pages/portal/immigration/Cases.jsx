import { Head, Link } from "@inertiajs/react";
import { Globe, ChevronRight, AlertTriangle } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";

export default function ImmigrationCases({ cases = [] }) {
    return (
        <div className="space-y-5 max-w-[1400px] mx-auto pb-12">
            <Head title="Cases — Immigration" />
            <PortalPageHeader
                eyebrow="Work"
                title="Cases"
                description="Active visa cases — both direct enquiries and students handed over from Education."
            />

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {cases.length === 0 ? (
                    <div className="p-14 text-center text-gray-400">
                        <Globe size={28} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium">No active cases yet.</p>
                        <p className="text-xs mt-1">Leads in Visa Process or Consultancy Agreement appear here.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {cases.map((c) => {
                            const pct = c.docs_total > 0 ? Math.round((c.docs_approved / c.docs_total) * 100) : 0;
                            const needsAttention = c.docs_pending > 0 || c.docs_rejected > 0;
                            return (
                                <li key={c.id} className="px-5 py-4 hover:bg-gray-50/50">
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                                            <Globe size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                                                <span className="text-[10px] font-mono text-gray-400">{c.lead_id}</span>
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 border border-amber-200">
                                                    {c.status}
                                                </span>
                                                {needsAttention && (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-rose-100 text-rose-700 border border-rose-200">
                                                        <AlertTriangle size={9} /> Needs attention
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                                                <span className="tabular-nums">{c.docs_approved} / {c.docs_total} docs</span>
                                                {c.docs_pending > 0  && <span className="text-amber-700">{c.docs_pending} pending</span>}
                                                {c.docs_rejected > 0 && <span className="text-rose-700">{c.docs_rejected} rejected</span>}
                                                {c.country && <span>· {c.country}</span>}
                                            </div>
                                        </div>
                                        <div className="w-40 hidden sm:block">
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-500 tabular-nums mt-1 text-right">{pct}%</p>
                                        </div>
                                        <Link
                                            href={`/portal/immigration/leads/${c.id}?tab=documents`}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 transition-colors"
                                        >
                                            Open <ChevronRight size={10} />
                                        </Link>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
