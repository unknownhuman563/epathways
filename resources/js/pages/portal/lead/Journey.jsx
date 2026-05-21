import { Head } from "@inertiajs/react";
import { Check, Lock, MapPinned } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";

// Lead's "My Journey" page — vertical timeline of every engagement step
// grouped by phase. Current step expanded with next action; completed
// steps collapsed.
export default function LeadJourney({ lead, roadmap = [], currentPhase = null, preEngagement = false, submissions = [] }) {
    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-12">
            <Head title="My Journey" />
            <PortalPageHeader
                eyebrow="Your journey"
                title="My Journey"
                description="Every step from agreement through to visa lodgement. Your current step is highlighted and shows what's needed next."
            />

            {preEngagement ? (
                <section className="bg-white border border-[#436235]/30 rounded-2xl p-8 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#436235] mb-2">
                        Engagement being set up
                    </p>
                    <h3 className="text-xl font-medium text-[#282728] mb-3">Your journey will appear here soon</h3>
                    <p className="text-sm text-[#282728]/70 font-light max-w-xl mx-auto">
                        Once you&apos;ve signed your consultancy agreement and your initial payment is received, your full journey will unlock.
                    </p>
                </section>
            ) : (
                <ol className="relative">
                    <div className="absolute left-[19px] top-3 bottom-3 w-px bg-[#282728]/15" aria-hidden />

                    {roadmap.map((p, i) => {
                        const isDone     = p.state === 'done';
                        const isCurrent  = p.state === 'current';
                        const isUpcoming = p.state === 'upcoming';

                        return (
                            <li key={p.key} className="relative pl-12 pb-6 last:pb-0">
                                <span
                                    className={`absolute left-0 top-1 w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                        isDone
                                            ? 'bg-emerald-500 text-white'
                                            : isCurrent
                                                ? 'bg-[#436235] text-white ring-4 ring-[#436235]/15'
                                                : 'bg-white border-2 border-[#282728]/15 text-[#282728]/40'
                                    }`}
                                >
                                    {isDone ? <Check size={16} strokeWidth={3} /> : isUpcoming ? <Lock size={14} /> : i + 1}
                                </span>

                                <div
                                    className={`rounded-2xl border p-5 ${
                                        isCurrent
                                            ? 'bg-white border-[#436235] shadow-[0_24px_48px_-24px_rgba(67,98,53,0.35)]'
                                            : isDone
                                                ? 'bg-[#436235]/5 border-[#436235]/20'
                                                : 'bg-white border-[#282728]/10 opacity-70'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                                        <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${isCurrent ? 'text-[#436235]' : 'text-[#282728]/40'}`}>
                                            {p.department || 'Outcome'}
                                        </p>
                                        <span className={`text-[9px] font-bold uppercase tracking-[0.22em] ${
                                            isCurrent ? 'text-[#436235]' : isDone ? 'text-[#436235]/70' : 'text-[#282728]/30'
                                        }`}>
                                            {isCurrent ? 'You are here' : isDone ? 'Completed' : 'Up next'}
                                        </span>
                                    </div>

                                    <h3 className={`text-lg font-medium leading-snug tracking-tight ${isCurrent ? 'text-[#282728]' : 'text-[#282728]/70'}`}>
                                        {p.label}
                                    </h3>

                                    {isCurrent && (
                                        <>
                                            <p className="text-sm text-[#282728]/70 leading-relaxed mt-2">
                                                {p.lead_copy}
                                            </p>
                                            <div className="mt-4 pt-4 border-t border-[#282728]/10 flex items-center gap-2">
                                                <MapPinned size={13} className="text-[#436235]" />
                                                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#436235]">
                                                    With {p.department || 'ePathways'}
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    {!isCurrent && (
                                        <p className={`text-[11px] mt-1 ${isCurrent ? 'text-[#282728]/70' : 'text-[#282728]/40'}`}>
                                            {p.description}
                                        </p>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            )}

            {submissions.length > 0 && (
                <section className="bg-white rounded-2xl border border-[#282728]/15 overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#282728]/10">
                        <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#436235] mb-1">Past submissions</p>
                        <h2 className="text-base font-medium text-[#282728] tracking-tight">Everything you&apos;ve sent us</h2>
                    </div>
                    <ul className="divide-y divide-[#282728]/10">
                        {submissions.map((s, i) => (
                            <li key={i} className="px-6 py-4">
                                <p className="text-sm font-medium text-[#282728]">{s.title}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5">{s.subtitle}</p>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
