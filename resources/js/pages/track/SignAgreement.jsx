import { useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import SignatureCanvas from 'react-signature-canvas';
import { FileSignature, Eraser, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// Build 11.D Phase 3 — Tracker-authenticated signing UI.
// The agreement is sent + viewed; the controller has already flipped status
// to 'viewed' on render. The user reads, types name, draws signature, and
// posts back. On success, full-page redirect to the confirmation page.
//
// Gray + white CRM theme. No decorative colors.

export default function SignAgreement({ code, lead = {}, agreement = {} }) {
    const sigRef = useRef(null);
    const [signerName, setSignerName] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [hasInk, setHasInk] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(null);

    const clear = () => {
        sigRef.current?.clear();
        setHasInk(false);
    };

    const validate = () => {
        const e = {};
        if (! signerName.trim()) e.signer_name = 'Please type your full legal name.';
        if (! termsAccepted)     e.terms_accepted = 'You must agree to the terms above to continue.';
        if (! hasInk || sigRef.current?.isEmpty()) e.signature = 'Please sign in the box below.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const submit = (event) => {
        event.preventDefault();
        if (submitting) return;
        setServerError(null);
        if (! validate()) return;

        setSubmitting(true);
        const signatureData = sigRef.current?.getCanvas().toDataURL('image/png') || '';

        router.post(
            `/track/${code}/agreements/${getTokenFromPath()}/sign`,
            {
                signer_name:     signerName.trim(),
                signature_data:  signatureData,
                terms_accepted:  termsAccepted ? 1 : 0,
            },
            {
                preserveScroll: true,
                onError: (errs) => {
                    setErrors(errs);
                    setServerError(Object.values(errs)[0] || 'Signature could not be recorded.');
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <>
            <Navbar />
            <Head title={`Sign — ${agreement.title || 'Agreement'}`} />
            <main className="min-h-screen bg-gray-50 py-10 px-4">
                <div className="max-w-3xl mx-auto space-y-5">
                    <header className="space-y-1">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 inline-flex items-center gap-1.5">
                            <FileSignature size={11} /> Sign agreement
                        </p>
                        <h1 className="text-2xl font-bold text-gray-900">{agreement.title}</h1>
                        <p className="text-sm text-gray-600">
                            For: {[lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Client'}
                        </p>
                    </header>

                    <section className="bg-white border border-gray-200 rounded-xl">
                        <div className="px-5 py-3 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            Agreement
                        </div>
                        <div className="px-5 py-4 max-h-[420px] overflow-y-auto">
                            <pre className="text-xs text-gray-900 whitespace-pre-wrap font-serif leading-relaxed">
                                {agreement.content_rendered}
                            </pre>
                        </div>
                    </section>

                    <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
                        {serverError && (
                            <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-100 text-xs text-red-800">
                                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                                {serverError}
                            </div>
                        )}

                        <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                className="mt-1 w-4 h-4"
                            />
                            <span className="text-sm text-gray-900">
                                I have read and agree to the terms of this agreement.
                            </span>
                        </label>
                        {errors.terms_accepted && <p className="text-xs text-red-700 -mt-2">{errors.terms_accepted}</p>}

                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Type your full legal name
                            </label>
                            <input
                                type="text"
                                value={signerName}
                                onChange={(e) => setSignerName(e.target.value)}
                                maxLength={200}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                                placeholder="e.g. Maria Cruz"
                            />
                            {errors.signer_name && <p className="text-xs text-red-700 mt-1">{errors.signer_name}</p>}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                    Sign below (use mouse or touch)
                                </label>
                                <button
                                    type="button"
                                    onClick={clear}
                                    className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-900"
                                >
                                    <Eraser size={11} /> Clear
                                </button>
                            </div>
                            <div className="border border-gray-300 rounded-md bg-white" style={{ touchAction: 'none' }}>
                                <SignatureCanvas
                                    ref={sigRef}
                                    onBegin={() => setHasInk(true)}
                                    penColor="#111"
                                    canvasProps={{
                                        width: 720,
                                        height: 180,
                                        className: 'w-full h-[180px]',
                                    }}
                                />
                            </div>
                            {errors.signature && <p className="text-xs text-red-700 mt-1">{errors.signature}</p>}
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-2">
                            <p className="text-[10.5px] text-gray-400 inline-flex items-center gap-1.5 flex-1">
                                <ShieldCheck size={11} />
                                We record your typed name, drawn signature, IP address, and timestamp for the audit trail.
                            </p>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md text-sm font-semibold bg-gray-900 text-white hover:bg-black disabled:opacity-50 flex-shrink-0"
                            >
                                {submitting && <Loader2 size={13} className="animate-spin" />}
                                Sign agreement →
                            </button>
                        </div>
                    </form>
                </div>
            </main>
            <Footer />
        </>
    );
}

// The signing token sits in the URL path: /track/{code}/agreements/{token}/sign
// Extract it from window.location so we can POST back without threading it
// through props (the Inertia page name doesn't carry route params).
function getTokenFromPath() {
    if (typeof window === 'undefined') return '';
    const m = window.location.pathname.match(/\/agreements\/([^/]+)\/sign$/);
    return m ? m[1] : '';
}
