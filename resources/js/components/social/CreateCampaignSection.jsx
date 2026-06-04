import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import {
    Plus, Sparkles, UploadCloud, AlertCircle, Loader2,
} from 'lucide-react';
import { social } from '@/services/social';
import {
    PLATFORMS, SERVICES, TONES, DEFAULT_PLATFORMS_BY_SERVICE,
} from './constants';
import { Label, Input, Select } from './atoms';

// Campaign creation form. On successful submit calls onGenerated() so the
// parent can refresh the variant queue + stats strip.
export default function CreateCampaignSection({ onGenerated }) {
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
            const res = await social.generateVariants(fd);
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
