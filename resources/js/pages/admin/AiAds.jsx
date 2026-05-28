import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import {
    Sparkles, Send, CheckCircle2, XCircle, Loader2, Copy, RefreshCw,
    Megaphone, Mail, Facebook, Instagram, Linkedin, Youtube, Search,
    Music2, AlertCircle, ExternalLink, Wand2, Rocket,
} from 'lucide-react';

const PLATFORMS = [
    { id: 'facebook',       label: 'Facebook',       icon: <Facebook size={14} /> },
    { id: 'instagram',      label: 'Instagram',      icon: <Instagram size={14} /> },
    { id: 'linkedin',       label: 'LinkedIn',       icon: <Linkedin size={14} /> },
    { id: 'google_search',  label: 'Google Search',  icon: <Search size={14} /> },
    { id: 'google_display', label: 'Google Display', icon: <Search size={14} /> },
    { id: 'youtube',        label: 'YouTube',        icon: <Youtube size={14} /> },
    { id: 'tiktok',         label: 'TikTok',         icon: <Music2 size={14} /> },
];

function csrf() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

async function postJson(url, body) {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrf(),
        },
        body: JSON.stringify(body),
        credentials: 'same-origin',
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
}

async function getJson(url) {
    const res = await fetch(url, {
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
}

function Label({ children, required }) {
    return (
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            {children}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
    );
}

function Input(props) {
    return (
        <input
            {...props}
            className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all placeholder-gray-400 ${props.className || ''}`}
        />
    );
}

function Textarea({ className, rows, ...rest }) {
    return (
        <textarea
            {...rest}
            rows={rows || 3}
            className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all placeholder-gray-400 resize-y min-h-[80px] ${className || ''}`}
        />
    );
}

function Select({ children, ...rest }) {
    return (
        <select
            {...rest}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
        >
            {children}
        </select>
    );
}

function PlaiStatusCard({ configured }) {
    const [probing, setProbing] = useState(false);
    const [result, setResult] = useState(null);

    const probe = async () => {
        setProbing(true);
        const { data } = await getJson('/admin/ai-ads/plai/connection');
        setResult(data);
        setProbing(false);
    };

    const ok = result?.ok;
    const baseTone = ok
        ? 'bg-emerald-50 border-emerald-200'
        : (configured ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200');

    return (
        <div className={`rounded-2xl border p-5 ${baseTone}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ok ? 'bg-emerald-100 text-emerald-700' : configured ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'}`}>
                        {ok ? <CheckCircle2 size={20} /> : configured ? <AlertCircle size={20} /> : <XCircle size={20} />}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">
                            PLAI Partner API — {ok ? 'Connected' : configured ? 'Key set, not verified' : 'Not configured'}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1 max-w-2xl leading-relaxed">
                            {ok ? (
                                <>Live connection to <code className="px-1 py-0.5 rounded bg-white/60 border border-emerald-200">partner.plai.io</code>. Found <span className="font-semibold">{result?.workspaces?.length ?? 0}</span> workspace{(result?.workspaces?.length ?? 0) === 1 ? '' : 's'}.</>
                            ) : configured ? (
                                <>API key is in <code className="px-1 py-0.5 rounded bg-white/60 border border-amber-200">.env</code>. Click <span className="font-semibold">Test connection</span> to verify it reaches PLAI.</>
                            ) : (
                                <>Set <code className="px-1 py-0.5 rounded bg-white/60 border border-gray-200">PLAI_API_KEY</code> in <code className="px-1 py-0.5 rounded bg-white/60 border border-gray-200">.env</code>, then <code className="px-1 py-0.5 rounded bg-white/60 border border-gray-200">php artisan config:clear</code>. Get a key from PLAI dashboard → profile → Developer Center.</>
                            )}
                        </p>
                        {result && !ok && result.reason && (
                            <p className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                {result.reason}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                        href="https://docs.plai.io/quickstart"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900"
                    >
                        Docs <ExternalLink size={12} />
                    </a>
                    {configured && (
                        <button
                            onClick={probe}
                            disabled={probing}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60"
                        >
                            {probing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                            Test connection
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function VariantCard({ variant, adType, index }) {
    const [copied, setCopied] = useState(false);

    const text = adType === 'email'
        ? `Subject: ${variant.subject}\nPreheader: ${variant.preheader}\n\n${variant.body}`
        : `${variant.post}\n\n${(variant.hashtags || []).map(h => '#' + h).join(' ')}`;

    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-2 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
                    Variant {index + 1}
                </span>
                <button
                    onClick={copy}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    {copied ? <CheckCircle2 size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>

            {adType === 'email' ? (
                <div className="space-y-3">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Subject</div>
                        <div className="text-sm font-semibold text-gray-900">{variant.subject}</div>
                    </div>
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Preheader</div>
                        <div className="text-xs text-gray-600">{variant.preheader}</div>
                    </div>
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Body</div>
                        <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{variant.body}</div>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{variant.post}</div>
                    {variant.hashtags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-50">
                            {variant.hashtags.map((tag, i) => (
                                <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function AiAds({ plaiConfigured = false, plaiWorkspaceId = null }) {
    const [adType, setAdType] = useState('social'); // social | email
    const [form, setForm] = useState({
        platform: 'Facebook',
        topic: '',
        product: '',
        audience: '',
        tone: 'warm and professional',
        key_points: '',
        cta: '',
        language: 'English',
        variant_count: 3,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [variants, setVariants] = useState([]);

    const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const generate = async () => {
        setError(null);
        if (!form.topic.trim()) {
            setError('Topic is required.');
            return;
        }
        setLoading(true);
        const { ok, data } = await postJson('/admin/ai-ads/generate', { ...form, ad_type: adType });
        setLoading(false);
        if (!ok) {
            setError(data?.error || data?.message || 'Generation failed.');
            return;
        }
        setVariants(data.variants || []);
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            <Head title="AI Ads" />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-[10px] font-bold uppercase tracking-wider rounded-full mb-2">
                        <Sparkles size={12} />
                        AI-Powered
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AI Ads</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Generate ad copy locally with Cerebras, then launch campaigns to FB / IG / Google / LinkedIn / TikTok via PLAI.
                    </p>
                </div>
            </div>

            <PlaiStatusCard configured={plaiConfigured} workspaceId={plaiWorkspaceId} />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <Wand2 size={16} className="text-purple-600" />
                    <h2 className="text-sm font-bold text-gray-900">Copy Brainstorm <span className="text-gray-400 font-medium">(Cerebras)</span></h2>
                </div>

                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                    <button
                        onClick={() => setAdType('social')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${adType === 'social' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        <Megaphone size={12} /> Social Post
                    </button>
                    <button
                        onClick={() => setAdType('email')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${adType === 'email' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        <Mail size={12} /> Email Campaign
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div>
                        <Label required>Topic / angle</Label>
                        <Input
                            value={form.topic}
                            onChange={e => setField('topic', e.target.value)}
                            placeholder="e.g. Free assessment for Filipino nurses"
                        />
                    </div>

                    <div>
                        <Label>Product / programme</Label>
                        <Input
                            value={form.product}
                            onChange={e => setField('product', e.target.value)}
                            placeholder="e.g. Master of Nursing (Level 9)"
                        />
                    </div>

                    <div>
                        <Label>Audience</Label>
                        <Input
                            value={form.audience}
                            onChange={e => setField('audience', e.target.value)}
                            placeholder="e.g. Registered nurses 25-40, Philippines, NZ-bound"
                        />
                    </div>

                    {adType === 'social' && (
                        <div>
                            <Label>Platform</Label>
                            <Select value={form.platform} onChange={e => setField('platform', e.target.value)}>
                                <option>Facebook</option>
                                <option>Instagram</option>
                                <option>LinkedIn</option>
                            </Select>
                        </div>
                    )}

                    <div>
                        <Label>Tone</Label>
                        <Select value={form.tone} onChange={e => setField('tone', e.target.value)}>
                            <option value="warm and professional">Warm & professional</option>
                            <option value="friendly and casual">Friendly & casual</option>
                            <option value="urgent and motivating">Urgent & motivating</option>
                            <option value="authoritative and expert">Authoritative & expert</option>
                            <option value="inspirational">Inspirational</option>
                        </Select>
                    </div>

                    <div>
                        <Label>Language</Label>
                        <Select value={form.language} onChange={e => setField('language', e.target.value)}>
                            <option>English</option>
                            <option>Tagalog</option>
                            <option>Hindi</option>
                            <option>Mandarin</option>
                            <option>Spanish</option>
                        </Select>
                    </div>

                    <div>
                        <Label>Call-to-action</Label>
                        <Input
                            value={form.cta}
                            onChange={e => setField('cta', e.target.value)}
                            placeholder="e.g. Take the free assessment"
                        />
                    </div>

                    <div>
                        <Label>Variants</Label>
                        <Select value={form.variant_count} onChange={e => setField('variant_count', parseInt(e.target.value, 10))}>
                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                        </Select>
                    </div>

                    <div className="lg:col-span-2">
                        <Label>Key points to mention</Label>
                        <Textarea
                            rows={3}
                            value={form.key_points}
                            onChange={e => setField('key_points', e.target.value)}
                            placeholder="• Free assessment in 10 minutes&#10;• Licensed immigration advisers&#10;• NZQA-recognised programmes"
                        />
                    </div>
                </div>

                {error && (
                    <div className="mx-6 mb-4 flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle size={15} /> {error}
                    </div>
                )}

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                        Drafts only — nothing is published yet. Use the launch panel below to push to PLAI.
                    </p>
                    <button
                        onClick={generate}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {loading ? 'Generating…' : 'Generate copy'}
                    </button>
                </div>
            </div>

            {variants.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {variants.map((v, i) => (
                        <VariantCard key={i} variant={v} adType={adType} index={i} />
                    ))}
                </div>
            )}

            <LaunchPanel plaiConfigured={plaiConfigured} platforms={PLATFORMS} />
        </div>
    );
}

function LaunchPanel({ plaiConfigured, platforms }) {
    const [name, setName] = useState('');
    const [selected, setSelected] = useState(['facebook', 'instagram']);
    const [copy, setCopy] = useState('');
    const [cta, setCta] = useState('');
    const [launching, setLaunching] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const togglePlatform = (id) => {
        setSelected(s => s.includes(id) ? s.filter(p => p !== id) : [...s, id]);
    };

    const launch = async () => {
        setFeedback(null);
        if (!name.trim() || !copy.trim() || selected.length === 0) {
            setFeedback({ kind: 'error', text: 'Name, copy, and at least one platform are required.' });
            return;
        }
        setLaunching(true);
        const { ok, status, data } = await postJson('/admin/ai-ads/launch', {
            name, copy, cta, platforms: selected,
        });
        setLaunching(false);
        if (ok) {
            setFeedback({ kind: 'success', text: 'Campaign sent to PLAI.' });
        } else if (status === 501) {
            setFeedback({ kind: 'pending', text: data?.error || 'PLAI launch endpoint not yet wired.' });
        } else {
            setFeedback({ kind: 'error', text: data?.error || 'Launch failed.' });
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Rocket size={16} className="text-blue-600" />
                <h2 className="text-sm font-bold text-gray-900">Launch Campaign <span className="text-gray-400 font-medium">(PLAI)</span></h2>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div>
                    <Label required>Campaign name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. May 2026 — Filipino Nurses Funnel" />
                </div>
                <div>
                    <Label>Call-to-action button</Label>
                    <Input value={cta} onChange={e => setCta(e.target.value)} placeholder="e.g. Sign Up" />
                </div>

                <div className="lg:col-span-2">
                    <Label required>Platforms</Label>
                    <div className="flex flex-wrap gap-2">
                        {platforms.map(p => (
                            <button
                                key={p.id}
                                onClick={() => togglePlatform(p.id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selected.includes(p.id) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                            >
                                {p.icon} {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <Label required>Ad copy</Label>
                    <Textarea
                        rows={5}
                        value={copy}
                        onChange={e => setCopy(e.target.value)}
                        placeholder="Paste your finalised copy here. Tip: generate variants above, copy your favourite, then paste here."
                    />
                </div>
            </div>

            {feedback && (
                <div className={`mx-6 mb-4 flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm border ${
                    feedback.kind === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                    feedback.kind === 'pending' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                    'bg-red-50 border-red-200 text-red-700'
                }`}>
                    <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{feedback.text}</span>
                </div>
            )}

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                    {plaiConfigured ? 'Submits to PLAI Partner API.' : 'Set PLAI_API_KEY first — see the status card above.'}
                </p>
                <button
                    onClick={launch}
                    disabled={launching || !plaiConfigured}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {launching ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {launching ? 'Launching…' : 'Launch via PLAI'}
                </button>
            </div>
        </div>
    );
}
