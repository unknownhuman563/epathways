import { Head, Link } from "@inertiajs/react";
import { ShieldCheck, FileCheck2, ArrowRight } from "lucide-react";

// Sign-off queue — cases awaiting the adviser's verdict or lodgement sign-off.
// The actual licensed sign-off happens inside the case profile (Verdict tab),
// which is licence-gated server-side; this is the worklist that routes there.
export default function AdviserSignOff({ cases = [] }) {
    return (
        <div className="max-w-[1000px] mx-auto pb-12 space-y-5">
            <Head title="Sign-off queue" />
            <div>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Sign-off queue</h1>
                <p className="text-sm text-gray-500 mt-1">Cases waiting on your verdict or lodgement sign-off. Open a case to review and sign — sign-off is licence-gated.</p>
            </div>

            {cases.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                    <ShieldCheck size={26} className="mx-auto text-gray-300" />
                    <p className="mt-3 text-sm text-gray-700 font-semibold">Nothing awaiting sign-off</p>
                    <p className="text-xs text-gray-500 mt-1">You're all caught up.</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
                    {cases.map((c) => (
                        <Link key={c.id} href={`/portal/immigration-adviser/cases/${c.id}?tab=verdict`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60">
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-gray-900 truncate">{c.name} <span className="text-[11px] font-normal text-gray-400">{c.lead_id}</span></div>
                                <div className="text-[12px] text-gray-500 truncate">{c.visa_type || "No visa type"}{c.stage ? ` · ${c.stage}` : ""}</div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                {c.needs_verdict && <Badge icon={<ShieldCheck size={10} />}>Verdict needed</Badge>}
                                {!c.has_lodgement_signoff && <Badge icon={<FileCheck2 size={10} />}>Lodgement sign-off</Badge>}
                                <ArrowRight size={15} className="text-gray-300" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

function Badge({ icon, children }) {
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-[#009688]/10 text-[#009688] border-[#009688]/30">{icon}{children}</span>;
}
