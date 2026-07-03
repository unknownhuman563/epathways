import { Head } from '@inertiajs/react';
import { Mail, Inbox, ExternalLink, Info } from 'lucide-react';

// Email replies — Option A ("lighter" Reply-To). Replies to our emails don't
// live in the app yet; they route to a monitored mailbox via the Reply-To
// header. This page tells staff exactly where to read them. The full in-app
// reply inbox (Brevo Inbound Parsing) is a later step.
export default function Replies({ replyTo, eventFrom, defaultFrom }) {
    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
            <Head title="Email Replies" />

            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    <Mail size={22} /> Email Replies
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                    Where replies to the emails we send currently land.
                </p>
            </div>

            {/* Where replies go */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Inbox size={20} />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold text-gray-900">Replies route to a monitored inbox</h2>
                        {replyTo ? (
                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                When a recipient hits <strong>Reply</strong>, their message goes to{' '}
                                <a href={`mailto:${replyTo}`} className="font-semibold text-emerald-700 hover:underline">
                                    {replyTo}
                                </a>
                                . Read replies in that mailbox.
                            </p>
                        ) : (
                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                No central Reply-To is set, so replies go to each email's <strong>From</strong> address:
                            </p>
                        )}

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Event emails from</p>
                                <p className="text-sm font-semibold text-gray-800 mt-0.5 break-all">{eventFrom || defaultFrom}</p>
                            </div>
                            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">All other emails from</p>
                                <p className="text-sm font-semibold text-gray-800 mt-0.5 break-all">{defaultFrom}</p>
                            </div>
                        </div>

                        {replyTo && (
                            <a
                                href={`https://mail.google.com/mail/u/?authuser=${encodeURIComponent(replyTo)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-emerald-700 hover:underline"
                            >
                                Open the inbox <ExternalLink size={14} />
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Roadmap note */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 flex items-start gap-3">
                <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-blue-900">Reading replies inside ePathways is coming next</p>
                    <p className="text-sm text-blue-800/80 mt-1 leading-relaxed">
                        Right now replies live in the mailbox above. The next step is to pull replies into
                        the system — shown against each lead, with the ability to reply from here — using
                        Brevo Inbound Parsing (needs an inbound subdomain + DNS records).
                    </p>
                </div>
            </div>
        </div>
    );
}
