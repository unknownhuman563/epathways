import React, { useEffect, useMemo, useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import {
    Wrench, Save, Link2, Copy, Check, RefreshCw, AlertTriangle,
    CalendarClock, Eye, Monitor, Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Super-admin control for the PUBLIC-site maintenance window.
 * Staff portals and /admin are never affected — see EnsureNotInMaintenance.
 */
export default function Maintenance({ state }) {
    const { props } = usePage();
    const [copied, setCopied] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        enabled: state.enabled,
        message: state.message ?? '',
        eta: state.eta ?? '',
        starts_at: state.startsAt ?? '',
        ends_at: state.endsAt ?? '',
    });

    useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
    }, [props.flash?.success]);

    // Live preview — debounced so we don't refetch the iframe on every
    // keystroke. Renders the real blade via /admin/maintenance/preview,
    // so what's shown here is exactly what visitors get.
    const [previewSrc, setPreviewSrc] = useState('');
    const [device, setDevice] = useState('desktop');

    const previewKey = `${data.message}|${data.eta}`;
    useEffect(() => {
        const t = setTimeout(() => {
            const qs = new URLSearchParams();
            if (data.message) qs.set('message', data.message);
            if (data.eta) qs.set('eta', data.eta);
            setPreviewSrc(`/admin/maintenance/preview?${qs.toString()}`);
        }, 400);
        return () => clearTimeout(t);
    }, [previewKey]);

    const submit = (e) => {
        e.preventDefault();
        post('/admin/maintenance', { preserveScroll: true });
    };

    const copyBypass = async () => {
        if (!state.bypassUrl) return;
        try {
            await navigator.clipboard.writeText(state.bypassUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Could not copy — select and copy the link manually.');
        }
    };

    const regenerate = () => {
        if (!confirm('Generate a new bypass link? The current link will stop working immediately.')) return;
        router.post('/admin/maintenance/bypass', {}, { preserveScroll: true });
    };

    const live = state.isActive;

    return (
        <>
            <Head title="Maintenance Mode" />
            <div className="max-w-3xl mx-auto p-6">
                <header className="mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Wrench size={20} className="text-gray-700" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Maintenance Mode</h1>
                        <p className="text-sm text-gray-500">
                            Takes the public website offline. Staff portals and admin keep working.
                        </p>
                    </div>
                </header>

                {/* Live status banner */}
                <div
                    className={`mb-6 rounded-2xl border p-5 flex items-start gap-3 ${
                        live ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
                    }`}
                >
                    <span
                        className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
                            live ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                        }`}
                    />
                    <div>
                        <p className={`font-semibold ${live ? 'text-amber-900' : 'text-emerald-900'}`}>
                            {live ? 'Public site is OFFLINE' : 'Public site is live'}
                        </p>
                        <p className={`text-sm mt-0.5 ${live ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {live
                                ? state.inScheduledWindow && !state.enabled
                                    ? 'Currently inside the scheduled window. It will come back automatically at the end time.'
                                    : 'Visitors see the maintenance page. Staff portals and admin are unaffected.'
                                : 'Visitors can browse the site normally.'}
                        </p>
                        <p className={`text-sm mt-2 ${live ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {live
                                ? 'You will see the maintenance page too when visiting the public site — that is how you know it works. Use the bypass link below to view the real site.'
                                : 'Turn it on below when you need to take the public site down.'}
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Toggle */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <label className="flex items-start gap-4 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.enabled}
                                onChange={(e) => setData('enabled', e.target.checked)}
                                className="mt-1 w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                            />
                            <span>
                                <span className="block font-semibold text-gray-900">
                                    Turn on maintenance mode now
                                </span>
                                <span className="block text-sm text-gray-500 mt-0.5">
                                    Immediately shows the maintenance page to public visitors. Leave this off if
                                    you only want the scheduled window below.
                                </span>
                            </span>
                        </label>
                    </section>

                    {/* Message + ETA */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
                                What visitors see
                            </p>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                                <textarea
                                    rows={3}
                                    value={data.message}
                                    onChange={(e) => setData('message', e.target.value)}
                                    placeholder={state.defaultMessage}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                                />
                                {errors.message && <p className="text-xs text-red-600 mt-1">{errors.message}</p>}
                                <p className="text-xs text-gray-400 mt-1">
                                    Leave blank to use the default message.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    "Back by" time <span className="font-normal text-gray-400">(optional)</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={data.eta}
                                    onChange={(e) => setData('eta', e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                                />
                                {errors.eta && <p className="text-xs text-red-600 mt-1">{errors.eta}</p>}
                                <p className="text-xs text-gray-400 mt-1">
                                    Shown on the maintenance page in NZ time.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Live preview of the real maintenance page */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Eye size={14} className="text-gray-400" />
                                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
                                    Live preview
                                </p>
                            </div>
                            <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
                                <button
                                    type="button"
                                    onClick={() => setDevice('desktop')}
                                    title="Desktop"
                                    className={`rounded-md p-1.5 ${
                                        device === 'desktop'
                                            ? 'bg-white shadow-sm text-gray-900'
                                            : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    <Monitor size={15} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDevice('mobile')}
                                    title="Mobile"
                                    className={`rounded-md p-1.5 ${
                                        device === 'mobile'
                                            ? 'bg-white shadow-sm text-gray-900'
                                            : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    <Smartphone size={15} />
                                </button>
                            </div>
                        </div>

                        <div className="bg-gray-100 p-4 flex justify-center">
                            <div
                                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 transition-all"
                                style={{ width: device === 'mobile' ? 390 : '100%' }}
                            >
                                {previewSrc ? (
                                    <iframe
                                        key={device}
                                        src={previewSrc}
                                        title="Maintenance page preview"
                                        className="w-full block"
                                        style={{ height: 420, border: 0 }}
                                    />
                                ) : (
                                    <div className="h-[420px] flex items-center justify-center text-sm text-gray-400">
                                        Loading preview…
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-3 border-t border-gray-100">
                            <p className="text-xs text-gray-400">
                                This is the actual page visitors see — it updates as you edit the message and
                                time above. Changes aren't live until you save.
                            </p>
                        </div>
                    </section>

                    {/* Scheduled window */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                            <CalendarClock size={14} className="text-gray-400" />
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
                                Scheduled window (optional)
                            </p>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-500 mb-5">
                                The site goes offline automatically between these times, then comes back on its
                                own — no need to remember to switch it off.
                            </p>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Starts</label>
                                    <input
                                        type="datetime-local"
                                        value={data.starts_at}
                                        onChange={(e) => setData('starts_at', e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                                    />
                                    {errors.starts_at && (
                                        <p className="text-xs text-red-600 mt-1">{errors.starts_at}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ends</label>
                                    <input
                                        type="datetime-local"
                                        value={data.ends_at}
                                        onChange={(e) => setData('ends_at', e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                                    />
                                    {errors.ends_at && <p className="text-xs text-red-600 mt-1">{errors.ends_at}</p>}
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-3">
                                Clear the start time to remove the schedule.
                            </p>
                        </div>
                    </section>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                        >
                            <Save size={16} />
                            {processing ? 'Saving…' : 'Save changes'}
                        </button>
                    </div>
                </form>

                {/* Bypass link */}
                <section className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                        <Link2 size={14} className="text-gray-400" />
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
                            Preview / bypass link
                        </p>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-gray-500 mb-4">
                            Share this with anyone who needs to view the live site while it's down. Opening it
                            once lets that browser through for 12 hours.
                        </p>

                        {state.bypassUrl ? (
                            <div className="flex flex-col sm:flex-row gap-2">
                                <code className="flex-1 rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-xs text-gray-700 break-all">
                                    {state.bypassUrl}
                                </code>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={copyBypass}
                                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                    >
                                        {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={regenerate}
                                        title="Generate a new link and invalidate the old one"
                                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">
                                A link is created the first time you save these settings.
                            </p>
                        )}
                    </div>
                </section>

                {/* Safety note */}
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <AlertTriangle size={18} className="text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">You can't lock yourself out.</span>{' '}
                        Login, <code className="bg-white px-1 py-0.5 rounded border border-gray-200">/admin</code>,
                        every staff portal, and payment webhooks stay online during maintenance — only public
                        marketing and lead-capture pages are affected.
                    </p>
                </div>
            </div>
        </>
    );
}
