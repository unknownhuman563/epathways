import React, { useEffect, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import { toast } from 'sonner';
import {
    Zap, Sparkles, Send, CalendarClock, UploadCloud, Loader2, AlertCircle, X,
} from 'lucide-react';

import SocialLayout from '@/pages/admin/social/SocialLayout';
import CreateCampaignSection from '@/components/social/CreateCampaignSection';
import VariantReviewSection from '@/components/social/VariantReviewSection';
import CreateAdForm from '@/pages/admin/social/CreateAdForm';
import { social } from '@/services/social';
import { PLATFORMS } from '@/components/social/constants';
import { Label, Textarea, PlatformIcon } from '@/components/social/atoms';
import { formatHuman } from '@/components/social/helpers';

// localStorage key + valid modes for the Compose top-level toggle.
const MODE_KEY = 'social_compose_mode';
const VALID_MODES = ['quick', 'campaign'];

function readInitialMode() {
    if (typeof window === 'undefined') return 'quick';
    try {
        const v = window.localStorage.getItem(MODE_KEY);
        return VALID_MODES.includes(v) ? v : 'quick';
    } catch {
        return 'quick';
    }
}

// ─── Quick Post composer ────────────────────────────────────────────────
// Self-contained card: text + platforms + optional media + post-now / schedule.
function QuickPostComposer() {
    const [text, setText] = useState('');
    const [platforms, setPlatforms] = useState([]);
    const [media, setMedia] = useState(null);
    const [scheduling, setScheduling] = useState(false);   // is the schedule sub-state revealed?
    const [scheduleAt, setScheduleAt] = useState('');      // datetime-local value
    const [submitting, setSubmitting] = useState(false);
    const [submitMode, setSubmitMode] = useState(null);    // 'now' | 'schedule' — drives spinner placement
    const [error, setError] = useState(null);
    const fileRef = useRef(null);

    const togglePlatform = (id) => {
        setPlatforms((prev) =>
            prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
        );
    };

    const reset = () => {
        setText('');
        setPlatforms([]);
        setMedia(null);
        setScheduling(false);
        setScheduleAt('');
        setError(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const validate = () => {
        if (!text.trim()) {
            setError('Add some copy before posting.');
            return false;
        }
        if (platforms.length === 0) {
            setError('Pick at least one platform.');
            return false;
        }
        setError(null);
        return true;
    };

    const submit = async (mode) => {
        if (!validate()) return;
        if (mode === 'schedule' && !scheduleAt) {
            setError('Pick a date and time to schedule.');
            return;
        }

        const fd = new FormData();
        fd.append('text', text);
        platforms.forEach((p) => fd.append('platforms[]', p));
        if (media) fd.append('media', media);
        if (mode === 'schedule') {
            // datetime-local string is already in the user's local TZ; backend
            // (n8n) accepts ISO so convert via Date to attach the offset.
            const iso = new Date(scheduleAt).toISOString();
            fd.append('schedule_at', iso);
        }

        setSubmitting(true);
        setSubmitMode(mode);
        try {
            await social.quickPost(fd);
            if (mode === 'now') {
                toast.success(`Posted to ${platforms.length} platform${platforms.length === 1 ? '' : 's'}`);
            } else {
                toast.success(`Scheduled for ${formatHuman(new Date(scheduleAt).toISOString())}`);
            }
            reset();
        } catch (err) {
            toast.error(err?.message || 'Could not send the post. Please try again.');
        } finally {
            setSubmitting(false);
            setSubmitMode(null);
        }
    };

    return (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div>
                <Label>What's the update?</Label>
                <Textarea
                    rows={5}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={submitting}
                    placeholder="Share a quick update, milestone, or announcement…"
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <Label>Platforms</Label>
                    <span className="text-[10px] text-gray-600 font-semibold">
                        {platforms.length} selected
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((p) => {
                        const active = platforms.includes(p.id);
                        return (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => togglePlatform(p.id)}
                                disabled={submitting}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    active
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                                }`}
                            >
                                <PlatformIcon id={p.id} size={13} />
                                {p.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div>
                <Label>Media <span className="text-gray-500 font-normal">(optional)</span></Label>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        if (f && f.size > 10 * 1024 * 1024) {
                            toast.error('Media must be 10MB or smaller.');
                            e.target.value = '';
                            return;
                        }
                        setMedia(f);
                    }}
                    disabled={submitting}
                    className="hidden"
                    id="quick-post-media"
                />
                <label
                    htmlFor="quick-post-media"
                    className={`flex items-center gap-2 px-3 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm cursor-pointer hover:border-gray-400 transition-colors ${
                        submitting ? 'opacity-50 pointer-events-none' : ''
                    }`}
                >
                    <UploadCloud size={16} className="text-gray-700" />
                    <span className="text-gray-700 truncate">
                        {media ? media.name : 'Click to upload an image or video (max 10MB)'}
                    </span>
                    {media && !submitting && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                setMedia(null);
                                if (fileRef.current) fileRef.current.value = '';
                            }}
                            className="ml-auto p-0.5 rounded hover:bg-gray-200 text-gray-500"
                            aria-label="Remove media"
                        >
                            <X size={14} />
                        </button>
                    )}
                </label>
            </div>

            {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
                    <AlertCircle size={15} /> {error}
                </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                {scheduling ? (
                    <>
                        <input
                            type="datetime-local"
                            value={scheduleAt}
                            onChange={(e) => setScheduleAt(e.target.value)}
                            disabled={submitting}
                            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                if (submitting) return;
                                setScheduling(false);
                                setScheduleAt('');
                                setError(null);
                            }}
                            disabled={submitting}
                            className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-xl border border-gray-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => submit('schedule')}
                            disabled={submitting}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {submitting && submitMode === 'schedule'
                                ? <Loader2 size={14} className="animate-spin" />
                                : <CalendarClock size={14} />}
                            {submitting && submitMode === 'schedule' ? 'Scheduling…' : 'Confirm schedule'}
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={() => {
                                if (submitting) return;
                                setScheduling(true);
                                setError(null);
                            }}
                            disabled={submitting}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-xl border border-gray-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <CalendarClock size={14} />
                            Schedule
                        </button>
                        <button
                            type="button"
                            onClick={() => submit('now')}
                            disabled={submitting}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {submitting && submitMode === 'now'
                                ? <Loader2 size={14} className="animate-spin" />
                                : <Send size={14} />}
                            {submitting && submitMode === 'now' ? 'Posting…' : 'Post now'}
                        </button>
                    </>
                )}
            </div>
        </section>
    );
}

// ─── AI Campaign mode ───────────────────────────────────────────────────
// Lazy-loads variants the first time this mode is entered, then hands them
// to the shared VariantReviewSection.
function CampaignMode() {
    const [variants, setVariants] = useState(null);

    useEffect(() => {
        let alive = true;
        social.listVariants()
            .then((res) => { if (alive) setVariants(res?.variants || []); })
            .catch((err) => {
                if (!alive) return;
                setVariants([]);
                toast.error(err?.message || 'Could not load variants.');
            });
        return () => { alive = false; };
    }, []);

    return (
        <div className="space-y-6">
            <CreateCampaignSection
                onGenerated={async () => {
                    const v = await social.listVariants().catch(() => ({ variants: [] }));
                    setVariants(v?.variants || []);
                    toast.info('Variants ready to review below.');
                }}
            />
            <VariantReviewSection
                variants={variants}
                onMutate={(updater) => setVariants((prev) => updater(prev || []))}
                onApproved={() => { /* Scheduled page owns the scheduled list */ }}
            />
        </div>
    );
}

// ─── Page ───────────────────────────────────────────────────────────────
export default function Compose() {
    const [mode, setMode] = useState(readInitialMode);

    const changeMode = (next) => {
        if (!VALID_MODES.includes(next)) return;
        setMode(next);
        try { window.localStorage.setItem(MODE_KEY, next); } catch { /* private mode etc. */ }
    };

    return (
        <SocialLayout>
            <Head title="Compose · Social" />

            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => changeMode('quick')}
                        className={`inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl text-sm font-bold border transition-all ${
                            mode === 'quick'
                                ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                        }`}
                    >
                        <Zap size={16} />
                        Quick post
                    </button>
                    <button
                        type="button"
                        onClick={() => changeMode('campaign')}
                        className={`inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl text-sm font-bold border transition-all ${
                            mode === 'campaign'
                                ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                        }`}
                    >
                        <Sparkles size={16} />
                        AI ad campaign
                    </button>
                </div>

                {mode === 'quick' ? <QuickPostComposer /> : <CreateAdForm />}
            </div>
        </SocialLayout>
    );
}
