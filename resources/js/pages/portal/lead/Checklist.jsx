import { Head } from "@inertiajs/react";
import { Check, Lock } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import { CHECKLIST, SECTION_STATUSES, currentSectionIndex } from "@/data/leadDocumentChecklist";

// Read-only checklist view — groups every checklist item by phase/section
// and shows verification status + completion %. Cross-cuts with Documents
// (which is the write side); this is the at-a-glance audit view.
export default function LeadChecklist({ lead, documentChecklist = {}, sectionVerifications = {} }) {
    const currentIdx = currentSectionIndex(sectionVerifications);
    const totalItems = CHECKLIST.reduce((t, s) => t + s.items.length, 0);
    const verifiedSections = CHECKLIST.filter((s) => sectionVerifications[s.key]?.status === 'verified').length;
    const pct = CHECKLIST.length > 0 ? Math.round((verifiedSections / CHECKLIST.length) * 100) : 0;

    return (
        <div className="space-y-7 max-w-5xl mx-auto pb-12">
            <Head title="Checklist" />
            <PortalPageHeader
                eyebrow="At a glance"
                title="Checklist"
                description="Every document we need for your application, grouped by section. Status updates automatically as you upload and your adviser verifies."
            />

            {/* Progress card */}
            <section className="bg-white rounded-2xl border border-[#282728]/15 p-6">
                <div className="flex items-center justify-between gap-4 mb-3">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#436235] mb-1">Overall progress</p>
                        <p className="text-2xl font-medium text-[#282728] tabular-nums">{verifiedSections} / {CHECKLIST.length} <span className="text-base text-[#282728]/50">sections verified</span></p>
                    </div>
                    <span className="text-3xl font-medium text-[#436235] tabular-nums">{pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#436235] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
            </section>

            {/* Sections */}
            <div className="space-y-4">
                {CHECKLIST.map((section, idx) => {
                    const ver = sectionVerifications[section.key];
                    const verMeta = ver?.status ? SECTION_STATUSES[ver.status] : null;
                    const isLocked = idx > currentIdx;

                    return (
                        <section key={section.key} className={`bg-white rounded-2xl border ${isLocked ? 'border-gray-200 opacity-70' : 'border-[#282728]/15'} overflow-hidden`}>
                            <div className="px-5 py-4 border-b border-[#282728]/10 flex items-center justify-between gap-3 flex-wrap">
                                <div className="flex items-center gap-2.5">
                                    {isLocked ? <Lock size={14} className="text-gray-400" /> : <Check size={14} className="text-[#436235]" />}
                                    <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#282728]">{section.section}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 tabular-nums">
                                        {section.items.length} {section.items.length === 1 ? 'item' : 'items'}
                                    </span>
                                    {verMeta && (
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${verMeta.chip}`}>
                                            {verMeta.label}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <ul className="divide-y divide-[#282728]/10">
                                {section.items.map((item) => {
                                    const itemState = documentChecklist[item.id];
                                    const itemStatus = itemState?.status;
                                    const itemDone = itemStatus === 'uploaded' || ver?.status === 'verified';
                                    return (
                                        <li key={item.id} className="px-5 py-3 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${itemDone ? 'bg-emerald-500 text-white' : 'border border-gray-300 bg-white'}`}>
                                                    {itemDone && <Check size={10} strokeWidth={3} />}
                                                </span>
                                                <p className={`text-sm ${itemDone ? 'text-[#282728]' : 'text-[#282728]/70'}`}>{item.name}</p>
                                            </div>
                                            {itemStatus && !itemDone && (
                                                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                                                    {itemStatus.replace('_', ' ')}
                                                </span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}
