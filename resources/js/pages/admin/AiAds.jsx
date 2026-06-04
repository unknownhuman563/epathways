import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import { toast } from 'sonner';
import {
    Sparkles, Plus, Search, Filter, X, Check, Edit3, Trash2,
    Facebook, Instagram, Linkedin, Youtube, Music2, Bookmark, Globe,
    Calendar as CalendarIcon, List as ListIcon, ChevronLeft, ChevronRight,
    TrendingUp, TrendingDown, Loader2, AlertCircle, ArrowRight, Send,
    UploadCloud, Undo2,
} from 'lucide-react';
import { social as aiAds } from '@/services/social';

// ─── Constants ──────────────────────────────────────────────────────────

const PLATFORMS = [
    { id: 'instagram', label: 'Instagram', icon: Instagram },
    { id: 'facebook',  label: 'Facebook',  icon: Facebook },
    { id: 'tiktok',    label: 'TikTok',    icon: Music2 },
    { id: 'linkedin',  label: 'LinkedIn',  icon: Linkedin },
    { id: 'youtube',   label: 'YouTube',   icon: Youtube },
    { id: 'pinterest', label: 'Pinterest', icon: Bookmark },
];
const PLATFORM_BY_ID = Object.fromEntries(PLATFORMS.map((p) => [p.id, p]));

const SERVICES = [
    { id: 'education',     label: 'Education',     dot: 'bg-indigo-500',  chip: 'bg-indigo-50 text-indigo-700 border-indigo-200',   accent: '#6366f1' },
    { id: 'immigration',   label: 'Immigration',   dot: 'bg-rose-500',    chip: 'bg-rose-50 text-rose-700 border-rose-200',          accent: '#f43f5e' },
    { id: 'accommodation', label: 'Accommodation', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', accent: '#10b981' },
];
const SERVICE_BY_ID = Object.fromEntries(SERVICES.map((s) => [s.id, s]));

const TONES = ['Friendly', 'Professional', 'Urgent', 'Inspirational'];

// Smart platform defaults per service — the user can still override.
const DEFAULT_PLATFORMS_BY_SERVICE = {
    education:     ['instagram', 'tiktok', 'youtube'],
    immigration:   ['facebook',  'linkedin', 'youtube'],
    accommodation: ['instagram', 'pinterest'],
};

const MODEL_LABELS = { claude: 'Claude', gpt: 'GPT', gemini: 'Gemini' };

// ─── Tiny shared atoms ──────────────────────────────────────────────────

function Skeleton({ className = '' }) {
    return <div className={`bg-gray-100 animate-pulse rounded-lg ${className}`} />;
}

function PlatformIcon({ id, size = 14 }) {
    const Cmp = PLATFORM_BY_ID[id]?.icon || Globe;
    return <Cmp size={size} />;
}

function ServiceChip({ service }) {
    const meta = SERVICE_BY_ID[service];
    if (!meta) return null;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${meta.chip}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
        </span>
    );
}

function Label({ children, required }) {
    return (
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            {children}{required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
    );
}

function Input(props) {
    return (
        <input
            {...props}
            className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all placeholder-gray-500 ${props.className || ''}`}
        />
    );
}

function Textarea({ className, rows = 3, ...rest }) {
    return (
        <textarea
            {...rest}
            rows={rows}
            className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all placeholder-gray-500 resize-y min-h-[80px] ${className || ''}`}
        />
    );
}

function Select({ children, ...rest }) {
    return (
        <select
            {...rest}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all cursor-pointer"
        >{children}</select>
    );
}

// ─── Page shell ─────────────────────────────────────────────────────────

export default function AiAds() {
    // Top-level state shared between the variant queue + scheduler so an
    // approval immediately removes the variant card AND adds the scheduled
    // post without a round-trip refresh.
    const [variants, setVariants] = useState(null); // null = loading
    const [scheduled, setScheduled] = useState(null);
    const [stats, setStats] = useState(null);

    const loadAll = async () => {
        try {
            const [s, v, sc] = await Promise.all([
                aiAds.stats().catch(() => null),
                aiAds.listVariants().catch(() => ({ variants: [] })),
                aiAds.listScheduled().catch(() => ({ posts: [] })),
            ]);
            setStats(s);
            setVariants(v?.variants || []);
            setScheduled(sc?.posts || []);
        } catch (e) {
            toast.error('Could not load AI Ads data');
        }
    };

    useEffect(() => { loadAll(); }, []);

    return (
        <div className="space-y-8 max-w-[1500px] mx-auto pb-12">
            <Head title="AI Ads" />

            <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-[0.22em] rounded-full mb-3">
                    <Sparkles size={12} />
                    AI Ads · MVP
                </div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Campaign control room</h1>
                <p className="text-sm text-gray-700 mt-1.5 max-w-2xl">
                    Generate platform-ready ad variants, review them, schedule them. Posts only go live after staff approval — no direct publish.
                </p>
            </div>

            <StatsStrip data={stats} />

            <CreateCampaignSection onGenerated={async () => {
                const v = await aiAds.listVariants().catch(() => ({ variants: [] }));
                setVariants(v?.variants || []);
                const s = await aiAds.stats().catch(() => null);
                setStats(s);
            }} />

            <VariantReviewSection
                variants={variants}
                onMutate={(updater) => setVariants((prev) => updater(prev || []))}
                onApproved={async () => {
                    const sc = await aiAds.listScheduled().catch(() => ({ posts: [] }));
                    setScheduled(sc?.posts || []);
                    const s = await aiAds.stats().catch(() => null);
                    setStats(s);
                }}
            />

            <SchedulerSection
                posts={scheduled}
                onMutate={(updater) => setScheduled((prev) => updater(prev || []))}
            />
        </div>
    );
}

// ─── 1) Header stats strip ──────────────────────────────────────────────

function StatsStrip({ data }) {
    const cards = [
        { key: 'activeCampaigns',   label: 'Active campaigns',                value: data?.activeCampaigns,    delta: data?.deltas?.activeCampaigns },
        { key: 'pendingVariants',   label: 'Variants awaiting review',        value: data?.pendingVariants,    delta: data?.deltas?.pendingVariants },
        { key: 'scheduledThisWeek', label: 'Posts scheduled this week',       value: data?.scheduledThisWeek,  delta: data?.deltas?.scheduledThisWeek },
        { key: 'leadsThisWeek',     label: 'Leads generated by ads this week',value: data?.leadsThisWeek,      delta: data?.deltas?.leadsThisWeek },
    ];

    if (data === null) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((c) => (
                    <div key={c.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-9 w-20" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((c) => <StatCard key={c.key} {...c} />)}
        </div>
    );
}

function StatCard({ label, value, delta }) {
    const hasDelta = typeof delta === 'number';
    const up = hasDelta && delta >= 0;
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-600">{label}</p>
            <p className="text-3xl font-bold text-gray-900 tracking-tight mt-2 tabular-nums">{value?.toLocaleString?.() ?? '—'}</p>
            {hasDelta && (
                <p className={`mt-2 inline-flex items-center gap-1 text-[11px] font-bold tabular-nums ${up ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {up ? '+' : ''}{delta} vs last week
                </p>
            )}
        </div>
    );
}

// ─── 2) Create campaign form ────────────────────────────────────────────

function CreateCampaignSection({ onGenerated }) {
    const [form, setForm] = useState({
        campaign_name: '',
        service: 'education',
        hook_angle: '',
        target_audience: '',
        platforms: DEFAULT_PLATFORMS_BY_SERVICE.education,
        variant_count: 5,
        tone: 'Friendly',
        reference: null,
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const fileRef = useRef(null);
    // Track which platform sets were chosen by smart defaults so manually-
    // overridden selections aren't blown away when the service changes.
    const [platformTouched, setPlatformTouched] = useState(false);

    const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const onServiceChange = (svc) => {
        setForm((f) => ({
            ...f,
            service: svc,
            platforms: platformTouched ? f.platforms : DEFAULT_PLATFORMS_BY_SERVICE[svc] || [],
        }));
    };

    const togglePlatform = (id) => {
        setPlatformTouched(true);
        setForm((f) => ({
            ...f,
            platforms: f.platforms.includes(id) ? f.platforms.filter((p) => p !== id) : [...f.platforms, id],
        }));
    };

    const submit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!form.campaign_name.trim()) return setError('Give the campaign a name.');
        if (form.platforms.length === 0)  return setError('Pick at least one platform.');

        const fd = new FormData();
        fd.append('campaign_name',   form.campaign_name);
        fd.append('service',         form.service);
        fd.append('hook_angle',      form.hook_angle);
        fd.append('target_audience', form.target_audience);
        fd.append('variant_count',   String(form.variant_count));
        fd.append('tone',            form.tone.toLowerCase());
        form.platforms.forEach((p) => fd.append('platforms[]', p));
        if (form.reference) fd.append('reference', form.reference);

        setSubmitting(true);
        try {
            const res = await aiAds.generateVariants(fd);
            toast.success(`${res?.generated || 0} variants generated`);
            // Reset only the per-campaign fields; keep service + tone for the next run.
            setForm((f) => ({ ...f, campaign_name: '', hook_angle: '', target_audience: '', reference: null }));
            if (fileRef.current) fileRef.current.value = '';
            await onGenerated?.();
            // Scroll the review queue into view so the user sees the new batch.
            document.getElementById('variant-queue')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (err) {
            setError(err?.message || 'Generation failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Plus size={16} className="text-gray-700" />
                <h2 className="text-sm font-bold text-gray-900">Create campaign</h2>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-gray-600">Step 1 of 2</span>
            </div>

            <form onSubmit={submit} className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="lg:col-span-2">
                    <Label required>Campaign name</Label>
                    <Input
                        value={form.campaign_name}
                        onChange={(e) => setField('campaign_name', e.target.value)}
                        disabled={submitting}
                        placeholder="e.g. Filipino Nurses Pathway — Q2 2026"
                    />
                </div>

                <div>
                    <Label required>Service target</Label>
                    <div className="flex flex-wrap gap-2">
                        {SERVICES.map((s) => (
                            <label
                                key={s.id}
                                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer border transition-all ${
                                    form.service === s.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="service"
                                    value={s.id}
                                    checked={form.service === s.id}
                                    onChange={() => onServiceChange(s.id)}
                                    disabled={submitting}
                                    className="sr-only"
                                />
                                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                                {s.label}
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <Label>Tone</Label>
                    <Select value={form.tone} onChange={(e) => setField('tone', e.target.value)} disabled={submitting}>
                        {TONES.map((t) => <option key={t}>{t}</option>)}
                    </Select>
                </div>

                <div>
                    <Label>Hook angle</Label>
                    <Input
                        value={form.hook_angle}
                        onChange={(e) => setField('hook_angle', e.target.value)}
                        disabled={submitting}
                        placeholder="e.g., scholarship opportunity, study-work pathway, PR pathway"
                    />
                </div>

                <div>
                    <Label>Target audience</Label>
                    <Input
                        value={form.target_audience}
                        onChange={(e) => setField('target_audience', e.target.value)}
                        disabled={submitting}
                        placeholder="Filipino nursing students aged 18–25"
                    />
                </div>

                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                        <Label>Platforms</Label>
                        <span className="text-[10px] text-gray-600 font-semibold">
                            {form.platforms.length} selected
                            {!platformTouched && <span className="ml-2 text-gray-400">· auto from service</span>}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {PLATFORMS.map((p) => {
                            const active = form.platforms.includes(p.id);
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => togglePlatform(p.id)}
                                    disabled={submitting}
                                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                                        active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                                    }`}
                                >
                                    <p.icon size={13} />
                                    {p.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <Label>Number of variants</Label>
                        <span className="text-sm font-bold text-gray-900 tabular-nums">{form.variant_count}</span>
                    </div>
                    <input
                        type="range"
                        min={1}
                        max={10}
                        value={form.variant_count}
                        onChange={(e) => setField('variant_count', parseInt(e.target.value, 10))}
                        disabled={submitting}
                        className="w-full accent-gray-900"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 font-bold mt-1 tracking-widest">
                        <span>1</span><span>5</span><span>10</span>
                    </div>
                </div>

                <div>
                    <Label>Reference creative <span className="text-gray-500 font-normal">(optional)</span></Label>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => setField('reference', e.target.files?.[0] || null)}
                        disabled={submitting}
                        className="hidden"
                        id="reference-file"
                    />
                    <label
                        htmlFor="reference-file"
                        className={`flex items-center gap-2 px-3 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm cursor-pointer hover:border-gray-400 transition-colors ${submitting ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        <UploadCloud size={16} className="text-gray-700" />
                        <span className="text-gray-700 truncate">
                            {form.reference ? form.reference.name : 'Click to upload an image or video'}
                        </span>
                    </label>
                </div>

                {error && (
                    <div className="lg:col-span-2 flex items-center gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
                        <AlertCircle size={15} /> {error}
                    </div>
                )}

                <div className="lg:col-span-2 flex items-center justify-end pt-2 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {submitting ? 'Generating variants…' : 'Generate variants'}
                    </button>
                </div>
            </form>
        </section>
    );
}

// ─── 3) Variant review queue ────────────────────────────────────────────

function VariantReviewSection({ variants, onMutate, onApproved }) {
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
                                    try { await aiAds.updateVariant(v.id, patch); toast.success('Variant updated'); }
                                    catch { toast.error('Could not save edits'); }
                                }}
                                onReject={async () => {
                                    onMutate((prev) => prev.filter((p) => p.id !== v.id));
                                    const undoToken = toast(`Variant rejected`, {
                                        action: {
                                            label: 'Undo',
                                            onClick: () => onMutate((prev) => [v, ...prev]),
                                        },
                                    });
                                    try { await aiAds.rejectVariant(v.id); }
                                    catch { toast.error('Could not reject'); }
                                }}
                                onApprove={async (scheduleAt) => {
                                    onMutate((prev) => prev.filter((p) => p.id !== v.id));
                                    try {
                                        await aiAds.approveVariant(v.id, scheduleAt, [v.platform]);
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

function gradientForService(svc) {
    switch (svc) {
        case 'education':     return 'bg-gradient-to-br from-indigo-400 to-indigo-700';
        case 'immigration':   return 'bg-gradient-to-br from-rose-400 to-rose-700';
        case 'accommodation': return 'bg-gradient-to-br from-emerald-400 to-emerald-700';
        default:              return 'bg-gradient-to-br from-gray-400 to-gray-700';
    }
}

// ─── 4) Scheduler / calendar ────────────────────────────────────────────

function SchedulerSection({ posts, onMutate }) {
    const [view, setView] = useState('week'); // week | month | list
    const [cursor, setCursor] = useState(() => startOfWeek(new Date())); // Date that anchors the view
    const [serviceFilter, setServiceFilter] = useState('all');
    const [platformFilter, setPlatformFilter] = useState('all');
    const [activePost, setActivePost] = useState(null);

    const filtered = useMemo(() => {
        if (!posts) return null;
        return posts.filter((p) =>
            (serviceFilter === 'all'  || p.service  === serviceFilter) &&
            (platformFilter === 'all' || p.platform === platformFilter)
        );
    }, [posts, serviceFilter, platformFilter]);

    const onRescheduleDrop = async (post, newDate) => {
        const newIso = newDate.toISOString();
        const previous = post.schedule_at;
        // Optimistic
        onMutate((prev) => prev.map((p) => p.id === post.id ? { ...p, schedule_at: newIso } : p));
        try {
            await aiAds.reschedule(post.id, newIso);
            toast.success(`Moved to ${formatHuman(newIso)}`);
        } catch {
            onMutate((prev) => prev.map((p) => p.id === post.id ? { ...p, schedule_at: previous } : p));
            toast.error('Could not move that post');
        }
    };

    const onCancel = async (post) => {
        if (!confirm(`Cancel "${post.headline}"?`)) return;
        onMutate((prev) => prev.filter((p) => p.id !== post.id));
        try { await aiAds.cancelPost(post.id); toast.success('Post cancelled'); }
        catch {
            onMutate((prev) => [post, ...prev]);
            toast.error('Could not cancel');
        }
    };

    return (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
                <CalendarIcon size={16} className="text-gray-700" />
                <h2 className="text-sm font-bold text-gray-900">Scheduled posts</h2>

                <div className="ml-auto flex items-center gap-2 flex-wrap">
                    {/* Filters */}
                    <Filter size={13} className="text-gray-500" />
                    <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold bg-white">
                        <option value="all">All services</option>
                        {SERVICES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                    <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold bg-white">
                        <option value="all">All platforms</option>
                        {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>

                    <div className="w-px h-5 bg-gray-200 mx-1" />

                    {/* View toggles */}
                    {['week', 'month', 'list'].map((v) => (
                        <button
                            key={v}
                            type="button"
                            onClick={() => setView(v)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${
                                view === v ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-400'
                            }`}
                        >
                            {v === 'list' ? <ListIcon size={12} /> : <CalendarIcon size={12} />}
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            {filtered === null ? (
                <div className="p-6 grid grid-cols-7 gap-2">
                    {Array.from({ length: 21 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="p-6">
                    <EmptyState
                        icon={<CalendarIcon size={20} className="text-gray-500" />}
                        title="Nothing scheduled"
                        body="Approve variants above to schedule them."
                    />
                </div>
            ) : view === 'week' ? (
                <WeekView cursor={cursor} setCursor={setCursor} posts={filtered} onOpen={setActivePost} onDrop={onRescheduleDrop} />
            ) : view === 'month' ? (
                <MonthView cursor={cursor} setCursor={setCursor} posts={filtered} onOpen={setActivePost} onDrop={onRescheduleDrop} />
            ) : (
                <ListView posts={filtered} onOpen={setActivePost} />
            )}

            {activePost && (
                <PostDetailsModal post={activePost} onClose={() => setActivePost(null)} onCancel={() => { onCancel(activePost); setActivePost(null); }} />
            )}
        </section>
    );
}

function WeekView({ cursor, setCursor, posts, onOpen, onDrop }) {
    const start = startOfWeek(cursor);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

    return (
        <div className="p-6">
            <CalendarHeader
                label={`${days[0].toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString('en-NZ', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                onPrev={() => setCursor(addDays(start, -7))}
                onNext={() => setCursor(addDays(start, 7))}
                onToday={() => setCursor(startOfWeek(new Date()))}
            />

            <div className="grid grid-cols-7 gap-2">
                {days.map((d) => {
                    const dayPosts = posts.filter((p) => sameDay(new Date(p.schedule_at), d));
                    const isToday = sameDay(d, new Date());
                    return (
                        <DayCell
                            key={d.toISOString()}
                            date={d}
                            isToday={isToday}
                            posts={dayPosts}
                            onOpen={onOpen}
                            onDrop={onDrop}
                            minHeight={140}
                            showWeekday
                        />
                    );
                })}
            </div>
        </div>
    );
}

function MonthView({ cursor, setCursor, posts, onOpen, onDrop }) {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = startOfWeek(monthStart);
    // 6 weeks max to cover any month
    const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
    const inMonth = (d) => d.getMonth() === cursor.getMonth();

    return (
        <div className="p-6">
            <CalendarHeader
                label={cursor.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' })}
                onPrev={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                onNext={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                onToday={() => setCursor(new Date())}
            />

            <div className="grid grid-cols-7 gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => <div key={d} className="px-1">{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
                {days.map((d) => {
                    const dayPosts = posts.filter((p) => sameDay(new Date(p.schedule_at), d));
                    const isToday = sameDay(d, new Date());
                    return (
                        <DayCell
                            key={d.toISOString()}
                            date={d}
                            isToday={isToday}
                            posts={dayPosts}
                            onOpen={onOpen}
                            onDrop={onDrop}
                            minHeight={86}
                            dim={!inMonth(d)}
                            compact
                        />
                    );
                })}
            </div>
        </div>
    );
}

function CalendarHeader({ label, onPrev, onNext, onToday }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">{label}</h3>
            <div className="flex items-center gap-2">
                <button type="button" onClick={onPrev} className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50">
                    <ChevronLeft size={14} />
                </button>
                <button type="button" onClick={onToday} className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border border-gray-200 rounded-lg hover:bg-gray-50">
                    Today
                </button>
                <button type="button" onClick={onNext} className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50">
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}

function DayCell({ date, posts, isToday, onOpen, onDrop, minHeight, dim, showWeekday, compact }) {
    const [over, setOver] = useState(false);

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                const payload = e.dataTransfer.getData('application/json');
                if (!payload) return;
                try {
                    const post = JSON.parse(payload);
                    // Preserve the original time-of-day; only the date moves.
                    const original = new Date(post.schedule_at);
                    const newDate = new Date(date);
                    newDate.setHours(original.getHours(), original.getMinutes(), 0, 0);
                    onDrop(post, newDate);
                } catch { /* ignore */ }
            }}
            className={`rounded-xl border p-2 transition-colors flex flex-col ${
                isToday ? 'border-gray-900' : 'border-gray-200'
            } ${over ? 'bg-gray-50 border-gray-900' : 'bg-white'} ${dim ? 'opacity-50' : ''}`}
            style={{ minHeight }}
        >
            <div className="flex items-center justify-between mb-1.5">
                {showWeekday && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        {date.toLocaleDateString('en-NZ', { weekday: 'short' })}
                    </span>
                )}
                <span className={`text-xs font-bold tabular-nums ${isToday ? 'text-gray-900' : 'text-gray-700'} ${showWeekday ? 'ml-auto' : ''}`}>
                    {date.getDate()}
                </span>
            </div>
            <div className="space-y-1 overflow-hidden">
                {posts.slice(0, compact ? 3 : 6).map((p) => (
                    <DayPostChip key={p.id} post={p} compact={compact} onOpen={onOpen} />
                ))}
                {posts.length > (compact ? 3 : 6) && (
                    <p className="text-[10px] text-gray-500 font-bold">+{posts.length - (compact ? 3 : 6)} more</p>
                )}
            </div>
        </div>
    );
}

function DayPostChip({ post, compact, onOpen }) {
    const meta = SERVICE_BY_ID[post.service];
    return (
        <button
            type="button"
            draggable
            onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify(post))}
            onClick={() => onOpen(post)}
            className={`w-full text-left px-1.5 py-1 rounded-md border flex items-center gap-1 hover:bg-white transition-colors ${meta?.chip || 'bg-gray-50 text-gray-700 border-gray-200'} cursor-grab active:cursor-grabbing`}
            title={post.headline}
        >
            <PlatformIcon id={post.platform} size={10} />
            <span className={`text-[10px] font-semibold truncate ${compact ? 'leading-tight' : ''}`}>
                {post.headline}
            </span>
        </button>
    );
}

function ListView({ posts, onOpen }) {
    const sorted = [...posts].sort((a, b) => new Date(a.schedule_at) - new Date(b.schedule_at));
    return (
        <div className="divide-y divide-gray-100">
            {sorted.map((p) => (
                <button
                    key={p.id}
                    type="button"
                    onClick={() => onOpen(p)}
                    className="w-full text-left flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors"
                >
                    <span className="text-xs font-bold text-gray-900 w-32 tabular-nums">{formatHuman(p.schedule_at)}</span>
                    <ServiceChip service={p.service} />
                    <span className="inline-flex items-center gap-1 text-xs text-gray-700">
                        <PlatformIcon id={p.platform} size={12} />
                        {PLATFORM_BY_ID[p.platform]?.label || p.platform}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-gray-900 truncate">{p.headline}</span>
                    <ChevronRight size={14} className="text-gray-400" />
                </button>
            ))}
        </div>
    );
}

function PostDetailsModal({ post, onClose, onCancel }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className={`relative h-28 ${gradientForService(post.service)} flex items-end p-5`}>
                    <div className="absolute top-4 right-4">
                        <button onClick={onClose} className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-gray-900">
                            <X size={14} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/90 text-gray-900">
                            <PlatformIcon id={post.platform} size={16} />
                        </span>
                        <ServiceChip service={post.service} />
                    </div>
                </div>
                <div className="p-6 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{post.campaign_name}</p>
                    <h3 className="text-lg font-bold text-gray-900 leading-snug">{post.headline}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                        <CalendarIcon size={13} /> Scheduled for <span className="font-bold text-gray-900">{formatHuman(post.schedule_at)}</span>
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-end gap-2">
                    <button onClick={onClose} className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-white border border-gray-200 rounded-lg">
                        Close
                    </button>
                    <button onClick={onCancel} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm">
                        <Trash2 size={12} /> Cancel post
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Helpers ────────────────────────────────────────────────────────────

function EmptyState({ icon, title, body }) {
    return (
        <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-100 mb-4">{icon}</div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">{title}</h3>
            <p className="text-xs text-gray-700 max-w-sm mx-auto leading-relaxed">{body}</p>
        </div>
    );
}

// Monday-start week (NZ business convention).
function startOfWeek(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    const day = (x.getDay() + 6) % 7; // 0 = Monday
    x.setDate(x.getDate() - day);
    return x;
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

function toLocalInput(d) {
    // datetime-local needs "YYYY-MM-DDTHH:mm" in the user's local TZ.
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatHuman(iso) {
    const d = new Date(iso);
    return d.toLocaleString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
