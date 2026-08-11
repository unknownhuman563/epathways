import { Head, Link } from "@inertiajs/react";
import { Globe, ShieldCheck, FileCheck2, Send, BadgeCheck, AlertTriangle } from "lucide-react";

// Adviser dashboard — the LIA's workload at a glance: their cases, what's
// awaiting their sign-off, and their licence status.
export default function AdviserDashboard({ stats = {}, recentCases = [], licence = {} }) {
    const cards = [
        { key: "my_cases", label: "My cases", value: stats.my_cases ?? 0, icon: Globe, href: "/portal/immigration-adviser/cases" },
        { key: "awaiting_verdict", label: "Awaiting verdict", value: stats.awaiting_verdict ?? 0, icon: ShieldCheck, href: "/portal/immigration-adviser/sign-off", tone: "teal" },
        { key: "awaiting_lodgement", label: "Awaiting lodgement sign-off", value: stats.awaiting_lodgement ?? 0, icon: FileCheck2, href: "/portal/immigration-adviser/sign-off", tone: "teal" },
        { key: "lodged", label: "Lodged / in progress", value: stats.lodged ?? 0, icon: Send },
    ];

    return (
        <div className="max-w-[1100px] mx-auto pb-12 space-y-6">
            <Head title="Adviser dashboard" />

            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Adviser dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Your licensed casework and sign-off queue.</p>
                </div>
                <LicenceChip licence={licence} />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {cards.map((c) => {
                    const Icon = c.icon;
                    const inner = (
                        <div className={`rounded-2xl border bg-white shadow-sm p-4 h-full ${c.tone === "teal" ? "border-[#009688]/25" : "border-gray-100"}`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${c.tone === "teal" ? "bg-[#009688]/10 text-[#009688]" : "bg-gray-50 text-gray-500"}`}>
                                <Icon size={17} />
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{c.value}</div>
                            <div className="text-[12px] text-gray-500 mt-0.5">{c.label}</div>
                        </div>
                    );
                    return c.href ? <Link key={c.key} href={c.href} className="block hover:-translate-y-0.5 transition-transform">{inner}</Link> : <div key={c.key}>{inner}</div>;
                })}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-900">Recent cases</h2>
                    <Link href="/portal/immigration-adviser/cases" className="text-[12px] font-semibold text-[#009688] hover:underline">View all</Link>
                </div>
                {recentCases.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-gray-400">No cases assigned to you yet.</p>
                ) : (
                    <ul className="divide-y divide-gray-50">
                        {recentCases.map((c) => (
                            <li key={c.id}>
                                <Link href={`/portal/immigration-adviser/cases/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60">
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-semibold text-gray-900 truncate">{c.name} <span className="text-[11px] font-normal text-gray-400">{c.lead_id}</span></div>
                                        <div className="text-[12px] text-gray-500 truncate">{c.visa_type || "No visa type"}{c.stage ? ` · ${c.stage}` : ""}</div>
                                    </div>
                                    {c.inz_status && <span className="text-[11px] font-semibold text-gray-500 border border-gray-200 rounded px-2 py-0.5">{c.inz_status}</span>}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function LicenceChip({ licence = {} }) {
    if (!licence.number) {
        return (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                <AlertTriangle size={14} /> No IAA licence on file
            </span>
        );
    }
    const current = licence.current;
    return (
        <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold rounded-lg px-3 py-1.5 border ${current ? "text-[#009688] bg-[#009688]/10 border-[#009688]/30" : "text-amber-700 bg-amber-50 border-amber-200"}`}>
            <BadgeCheck size={14} /> IAA {licence.number}{licence.expiry ? ` · exp ${licence.expiry}` : ""}{current ? "" : " (expired)"}
        </span>
    );
}
