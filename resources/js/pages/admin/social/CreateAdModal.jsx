import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Megaphone, X, Loader2, Sparkles, ImagePlus } from 'lucide-react';
import { social } from '@/services/social';
import { Skeleton } from '@/components/social/atoms';
import TargetingFields from '@/components/social/TargetingFields';

const inp = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-gray-300';
const lbl = 'text-xs font-semibold text-gray-600';
const CREATE_GOALS = [['engagement', 'Engagement'], ['traffic', 'Traffic'], ['awareness', 'Awareness'], ['video_views', 'Video Views']];
const PLATFORMS = ['facebook', 'instagram', 'tiktok', 'linkedin', 'google'];
const CTA_OPTIONS = ['LEARN_MORE', 'SIGN_UP', 'CONTACT_US', 'APPLY', 'REGISTER', 'BOOK_TRAVEL', 'GET_QUOTE', 'SUBSCRIBE', 'DOWNLOAD', 'SHOP_NOW'];

export default function CreateAdModal({ onClose, onCreated }) {
    const [adAccounts, setAdAccounts] = useState(null);
    const [form, setForm] = useState({
        name: '', adAccountId: '', platform: 'facebook', goal: 'traffic',
        body: '', headline: '', linkUrl: '', callToAction: 'LEARN_MORE',
        budgetAmount: '5', budgetType: 'daily', brief: '',
    });
    const [media, setMedia] = useState(null);
    const [targeting, setTargeting] = useState({ ageMin: 18, ageMax: 45, countries: [], interests: [], advantageAudience: false });
    const [busy, setBusy] = useState(false);
    const [aiBusy, setAiBusy] = useState(false);
    const fileRef = useRef(null);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const acct = (adAccounts || []).find((a) => a.id === form.adAccountId) || null;
    const accountId = acct?.accountId || '';
    const acctPlatform = acct?.platform || form.platform;

    useEffect(() => {
        social.adAccounts().then((r) => setAdAccounts(r?.adAccounts || []), () => setAdAccounts([]));
    }, []);

    const runAiCopy = async () => {
        const brief = (form.brief || form.body).trim();
        if (!brief) { toast.error('Add a short brief — what the ad is about.'); return; }
        setAiBusy(true);
        try {
            const r = await social.aiAdCopy({ brief, platform: form.platform, goal: form.goal });
            setForm((f) => ({ ...f, body: r.body || f.body, headline: r.headline || f.headline }));
            toast.success('Ad copy generated');
        } catch (err) {
            toast.error(err?.message || 'AI copy failed');
        } finally {
            setAiBusy(false);
        }
    };

    const submit = async () => {
        if (!form.name || !form.adAccountId || !form.body) { toast.error('Fill ad name, ad account and primary text.'); return; }
        if (!accountId) { toast.error('That ad account is missing its social account.'); return; }
        setBusy(true);
        try {
            const fd = new FormData();
            fd.append('accountId', accountId);
            fd.append('adAccountId', form.adAccountId);
            fd.append('platform', form.platform);
            fd.append('name', form.name);
            fd.append('goal', form.goal);
            fd.append('body', form.body);
            if (form.headline) fd.append('headline', form.headline);
            if (form.callToAction) fd.append('callToAction', form.callToAction);
            if (form.linkUrl) fd.append('linkUrl', form.linkUrl);
            fd.append('budgetAmount', form.budgetAmount);
            fd.append('budgetType', form.budgetType);
            if (media) fd.append('media', media);
            fd.append('targeting[ageMin]', targeting.ageMin);
            fd.append('targeting[ageMax]', targeting.ageMax);
            (targeting.countries || []).forEach((c) => fd.append('targeting[countries][]', c));
            (targeting.interests || []).forEach((i, idx) => {
                fd.append(`targeting[interests][${idx}][id]`, i.id);
                fd.append(`targeting[interests][${idx}][name]`, i.name);
            });
            if (targeting.advantageAudience) fd.append('targeting[advantageAudience]', '1');

            const r = await social.createAd(fd);
            toast.success('Ad created' + (r?.ad_id ? ` (${r.ad_id})` : ''));
            onCreated();
            onClose();
        } catch (err) {
            toast.error(err?.message || 'Create ad failed');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 grid place-items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Megaphone size={16} /> Create Ad</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
                </div>
                <p className="text-xs text-gray-400 mb-4">Design the creative and configure targeting.</p>

                {adAccounts === null ? (
                    <Skeleton className="h-40 w-full rounded-xl" />
                ) : adAccounts.length === 0 ? (
                    <p className="text-sm text-gray-600 leading-relaxed">No ad account is linked yet. Link a Meta/Google ad account inside Zernio (Connections → Ads), then you can create ads from here.</p>
                ) : (
                    <div className="grid md:grid-cols-2 gap-5">
                        {/* Creative */}
                        <div className="space-y-3">
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className={lbl}>Primary text</span>
                                    <button type="button" onClick={runAiCopy} disabled={aiBusy} className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 disabled:opacity-50">
                                        {aiBusy ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Generate with AI
                                    </button>
                                </div>
                                <textarea className={inp + ' h-24 resize-none mt-1'} maxLength={2000} value={form.body} onChange={(e) => set('body', e.target.value)} placeholder="The main text shown above the image." />
                                <input className={inp + ' mt-2'} value={form.brief} onChange={(e) => set('brief', e.target.value)} placeholder="AI brief (optional): what's the ad about?" />
                            </div>

                            <div>
                                <span className={lbl}>Media</span>
                                <input ref={fileRef} type="file" accept="image/*,video/*" id="create-ad-media" className="hidden"
                                    onChange={(e) => setMedia(e.target.files?.[0] || null)} />
                                <label htmlFor="create-ad-media" className="mt-1 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-200 rounded-xl py-6 cursor-pointer hover:border-gray-400 text-center">
                                    <ImagePlus size={20} className="text-gray-400" />
                                    <span className="text-xs text-gray-500">{media ? media.name : 'Click to upload an image or video'}</span>
                                    <span className="text-[10px] text-gray-400">JPG/PNG recommended 1200×628, max 30MB</span>
                                </label>
                            </div>

                            <label className="block"><span className={lbl}>Headline</span><input className={inp} maxLength={255} value={form.headline} onChange={(e) => set('headline', e.target.value)} placeholder="Your headline" /></label>
                            <label className="block"><span className={lbl}>Destination URL</span><input className={inp} value={form.linkUrl} onChange={(e) => set('linkUrl', e.target.value)} placeholder="https://epathways.co.nz/…" /></label>
                            <label className="block"><span className={lbl}>Call to action</span>
                                <select className={inp} value={form.callToAction} onChange={(e) => set('callToAction', e.target.value)}>
                                    {CTA_OPTIONS.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                                </select>
                            </label>
                        </div>

                        {/* Config */}
                        <div className="space-y-3">
                            <label className="block"><span className={lbl}>Ad name</span><input className={inp} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Study NZ — Nursing" /></label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="block"><span className={lbl}>Ad account</span>
                                    <select className={inp} value={form.adAccountId} onChange={(e) => set('adAccountId', e.target.value)}>
                                        <option value="">Select…</option>
                                        {adAccounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.platform})</option>)}
                                    </select>
                                </label>
                                <label className="block"><span className={lbl}>Platform</span>
                                    <select className={inp} value={form.platform} onChange={(e) => set('platform', e.target.value)}>
                                        {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </label>
                            </div>

                            <div>
                                <span className={lbl}>Goal</span>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    {CREATE_GOALS.map(([g, label]) => (
                                        <button key={g} type="button" onClick={() => set('goal', g)}
                                            className={`text-xs font-semibold px-3 py-2 rounded-lg border ${form.goal === g ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span className={lbl}>Budget {acct?.currency ? <span className="text-gray-400 font-normal">({acct.currency})</span> : null}</span>
                                <div className="grid grid-cols-2 gap-3 mt-1">
                                    <input type="number" min="1" className={inp} value={form.budgetAmount} onChange={(e) => set('budgetAmount', e.target.value)} />
                                    <select className={inp} value={form.budgetType} onChange={(e) => set('budgetType', e.target.value)}>
                                        <option value="daily">per day</option><option value="lifetime">total</option>
                                    </select>
                                </div>
                                {acct?.currency && <p className="text-[11px] text-gray-400 leading-snug mt-1">Meta enforces a minimum daily budget in {acct.currency} — raise it if the ad won't deliver.</p>}
                            </div>

                            <TargetingFields
                                accountId={accountId}
                                platform={acctPlatform}
                                value={targeting}
                                onChange={setTargeting}
                                aiContext={{ content: form.body || form.brief, goal: form.goal, platform: form.platform }}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <button onClick={submit} disabled={busy} className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                {busy ? <Loader2 size={15} className="animate-spin" /> : <Megaphone size={15} />} Create ad
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
