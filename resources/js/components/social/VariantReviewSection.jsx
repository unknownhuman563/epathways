import React, { useState } from 'react';
import { toast } from 'sonner';
import {
    Edit3, Trash2, Check, ArrowRight, Send, Undo2,
} from 'lucide-react';
import { social } from '@/services/social';
import { MODEL_LABELS } from './constants';
import {
    Skeleton, PlatformIcon, ServiceChip, Label, Input, Textarea, EmptyState,
} from './atoms';
import { formatHuman, toLocalInput, gradientForService } from './helpers';

// Variant review queue. Approval optimistically removes the card; the parent
// onApproved() is what re-fetches scheduled posts so the new chip appears
// in the Scheduler section without a hard reload.
export default function VariantReviewSection({ variants, onMutate, onApproved }) {
    return (
        <section id="variant-queue" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Edit3 size={16} className="text-gray-700" />
                <h2 className="text-sm font-bold text-gray-900">Variants awaiting review</h2>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-gray-600">
                    {variants === null ? 'Loading…' : `${variants.length} pending`}
                </span>
            </div>

            <div className="p-6">
                {variants === null ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-3">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-5 w-full" />
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-7 w-28" />
                            </div>
                        ))}
                    </div>
                ) : variants.length === 0 ? (
                    <EmptyState
                        icon={<Edit3 size={20} className="text-gray-500" />}
                        title="No variants to review"
                        body="Create a campaign above to generate your first batch."
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {variants.map((v) => (
                            <VariantCard
                                key={v.id}
                                variant={v}
                                onUpdate={async (patch) => {
                                    onMutate((prev) => prev.map((p) => p.id === v.id ? { ...p, ...patch } : p));
                                    try { await social.updateVariant(v.id, patch); toast.success('Variant updated'); }
                                    catch { toast.error('Could not save edits'); }
                                }}
                                onReject={async () => {
                                    onMutate((prev) => prev.filter((p) => p.id !== v.id));
                                    toast(`Variant rejected`, {
                                        action: {
                                            label: 'Undo',
                                            onClick: () => onMutate((prev) => [v, ...prev]),
                                        },
                                    });
                                    try { await social.rejectVariant(v.id); }
                                    catch { toast.error('Could not reject'); }
                                }}
                                onApprove={async (scheduleAt) => {
                                    onMutate((prev) => prev.filter((p) => p.id !== v.id));
                                    try {
                                        await social.approveVariant(v.id, scheduleAt, [v.platform]);
                                        toast.success(`Scheduled for ${formatHuman(scheduleAt)}`);
                                        await onApproved?.();
                                    } catch (e) {
                                        toast.error('Could not schedule');
                                        // Roll back optimistic removal so the user can try again.
                                        onMutate((prev) => [v, ...prev]);
                                    }
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function VariantCard({ variant, onUpdate, onReject, onApprove }) {
    const [mode, setMode] = useState('view'); // view | edit | schedule
    const [draft, setDraft] = useState({ headline: variant.headline, body: variant.body, cta: variant.cta });
    const [scheduleAt, setScheduleAt] = useState(() => {
        // Default to tomorrow 9am — the most common ad schedule.
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(9, 0, 0, 0);
        return toLocalInput(d);
    });

    return (
        <article className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            {/* Visual preview placeholder — gradient by service, with platform icon */}
            <div className={`relative h-24 flex items-center justify-center border-b border-gray-100 ${gradientForService(variant.service)}`}>
                <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/90 text-gray-900 shadow-sm">
                        <PlatformIcon id={variant.platform} size={14} />
                    </span>
                    <ServiceChip service={variant.service} />
                </div>
                <span className="absolute bottom-2 right-3 text-[9px] font-bold uppercase tracking-widest text-white/90 bg-black/30 backdrop-blur-sm rounded px-1.5 py-0.5">
                    {MODEL_LABELS[variant.model] || variant.model || 'AI'}
                </span>
            </div>

            <div className="p-5 flex-1 flex flex-col gap-3">
                {mode === 'edit' ? (
                    <>
                        <div>
                            <Label>Headline</Label>
                            <Input value={draft.headline} onChange={(e) => setDraft({ ...draft, headline: e.target.value })} />
                        </div>
                        <div>
                            <Label>Body</Label>
                            <Textarea rows={3} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
                        </div>
                        <div>
                            <Label>CTA</Label>
                            <Input value={draft.cta} onChange={(e) => setDraft({ ...draft, cta: e.target.value })} />
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 truncate">{variant.campaign_name}</p>
                        <h3 className="text-base font-bold text-gray-900 leading-snug">{variant.headline}</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">{variant.body}</p>
                        <div className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 bg-gray-900 text-white text-[11px] font-bold rounded-lg">
                            {variant.cta} <ArrowRight size={11} />
                        </div>
                    </>
                )}

                {mode === 'schedule' && (
                    <div className="mt-2 pt-3 border-t border-gray-100 space-y-2">
                        <Label>Publish at</Label>
                        <input
                            type="datetime-local"
                            value={scheduleAt}
                            onChange={(e) => setScheduleAt(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
                        />
                    </div>
                )}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/60 flex items-center gap-2">
                {mode === 'view' && (
                    <>
                        <button
                            type="button"
                            onClick={onReject}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:text-rose-700 hover:border-rose-300 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors"
                        >
                            <Trash2 size={12} /> Reject
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('edit')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:text-gray-900 hover:border-gray-400 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors"
                        >
                            <Edit3 size={12} /> Edit
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('schedule')}
                            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                        >
                            <Check size={12} /> Approve
                        </button>
                    </>
                )}
                {mode === 'edit' && (
                    <>
                        <button
                            type="button"
                            onClick={() => { setDraft({ headline: variant.headline, body: variant.body, cta: variant.cta }); setMode('view'); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-[11px] font-bold uppercase tracking-wider"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={async () => { await onUpdate(draft); setMode('view'); }}
                            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-[11px] font-bold uppercase tracking-wider shadow-sm"
                        >
                            <Check size={12} /> Save edits
                        </button>
                    </>
                )}
                {mode === 'schedule' && (
                    <>
                        <button
                            type="button"
                            onClick={() => setMode('view')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-[11px] font-bold uppercase tracking-wider"
                        >
                            <Undo2 size={12} /> Back
                        </button>
                        <button
                            type="button"
                            onClick={() => onApprove(new Date(scheduleAt).toISOString())}
                            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider shadow-sm"
                        >
                            <Send size={12} /> Schedule
                        </button>
                    </>
                )}
            </div>
        </article>
    );
}
