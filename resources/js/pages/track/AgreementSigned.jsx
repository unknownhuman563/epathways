import { Head, Link } from '@inertiajs/react';
import { Check, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// Build 11.D Phase 3 — Tracker-side confirmation page shown after a
// successful signature. Simple, gray + white, reassuring.

export default function AgreementSigned({ code, lead = {}, agreement = {} }) {
    const firstName = lead.first_name || 'there';

    return (
        <>
            <Navbar />
            <Head title="Agreement signed" />
            <main className="min-h-screen bg-gray-50 py-14 px-4">
                <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
                    <div className="w-14 h-14 mx-auto rounded-full bg-gray-900 text-white flex items-center justify-center">
                        <Check size={26} strokeWidth={2.5} />
                    </div>
                    <h1 className="mt-5 text-2xl font-bold text-gray-900">Agreement signed</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Thank you, <span className="font-semibold">{firstName}</span>. Your signature has been recorded
                        and our team has been notified.
                    </p>

                    <dl className="mt-6 inline-block text-left text-xs text-gray-700 space-y-1">
                        <div>
                            <dt className="inline text-gray-500">Agreement: </dt>
                            <dd className="inline font-semibold text-gray-900">{agreement.title}</dd>
                        </div>
                        {agreement.signed_at && (
                            <div>
                                <dt className="inline text-gray-500">Signed at: </dt>
                                <dd className="inline">{formatStamp(agreement.signed_at)}</dd>
                            </div>
                        )}
                        {agreement.signer_name && (
                            <div>
                                <dt className="inline text-gray-500">Signed by: </dt>
                                <dd className="inline">{agreement.signer_name}</dd>
                            </div>
                        )}
                    </dl>

                    <p className="mt-6 text-[11px] text-gray-500">
                        A copy will be emailed to you shortly. Keep this page open or return to your tracker for status updates.
                    </p>

                    <Link
                        href={`/track/${code}`}
                        className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    >
                        <ArrowLeft size={13} /> Return to your application tracker
                    </Link>
                </div>
            </main>
            <Footer />
        </>
    );
}

function formatStamp(iso) {
    if (! iso) return '';
    try {
        return new Date(iso).toLocaleString(undefined, {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch {
        return iso;
    }
}
