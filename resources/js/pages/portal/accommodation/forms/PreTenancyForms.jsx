import React, { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { Copy, Check, ExternalLink, FileText, Inbox } from "lucide-react";

// Forms → Pre-Tenancy module: the one shared public form link (copy & send)
// plus everyone who submitted the standalone/general form.
export default function PreTenancyForms({ formUrl, submissions = [] }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard?.writeText(formUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    };

    const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : "—");

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <Head title="Pre-Tenancy Form" />

            <div>
                <h1 className="text-2xl font-bold text-gray-900">Pre-Tenancy Form</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Share this link with anyone who needs to complete a pre-tenancy form directly (they skipped the
                    hot-lead funnel). Their submissions appear below and in the Agreements client list.
                </p>
            </div>

            {/* Shareable link */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Shareable form link</p>
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/70 p-2.5">
                    <input readOnly value={formUrl} className="min-w-0 flex-1 bg-transparent px-2 text-sm text-gray-600 outline-none" />
                    <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1F5A8B] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#184A73]">
                        {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy link"}
                    </button>
                    <a href={formUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                        <ExternalLink size={14} /> Open
                    </a>
                </div>
            </div>

            {/* Submissions */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
                    <FileText size={16} className="text-[#1F5A8B]" />
                    <h2 className="text-sm font-bold text-gray-900">Submissions</h2>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">{submissions.length}</span>
                </div>

                {submissions.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
                        <Inbox size={28} className="text-gray-300" />
                        <p className="text-sm text-gray-400">No submissions yet. Share the link above to start collecting forms.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                                    <th className="px-4 py-2 font-semibold">Ref</th>
                                    <th className="px-4 py-2 font-semibold">Name</th>
                                    <th className="px-4 py-2 font-semibold">Email</th>
                                    <th className="px-4 py-2 font-semibold">Mobile</th>
                                    <th className="px-4 py-2 font-semibold">Property</th>
                                    <th className="px-4 py-2 font-semibold">Submitted</th>
                                    <th className="px-4 py-2"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {submissions.map((s) => (
                                    <tr key={s.id} className="hover:bg-gray-50/60">
                                        <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{s.reference}</td>
                                        <td className="px-4 py-2.5 font-medium text-gray-900">{s.name || "—"}</td>
                                        <td className="px-4 py-2.5 text-gray-600">{s.email || "—"}</td>
                                        <td className="px-4 py-2.5 text-gray-600">{s.mobile || "—"}</td>
                                        <td className="px-4 py-2.5 text-gray-600">{s.property_address || "—"}</td>
                                        <td className="px-4 py-2.5 text-gray-500">{fmt(s.submitted_at)}</td>
                                        <td className="px-4 py-2.5 text-right">
                                            <Link href={`/portal/accommodation/forms/pre-tenancy/${s.id}`} className="text-sm font-semibold text-[#1F5A8B] hover:underline">View</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
