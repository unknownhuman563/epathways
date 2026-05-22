import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { LineChart, Lock, Download, Share2 } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import ComingSoonPanel from "@/components/portal/ComingSoonPanel";

const PERIODS = [
    { key: "weekly",    label: "Weekly" },
    { key: "monthly",   label: "Monthly" },
    { key: "quarterly", label: "Quarterly" },
    { key: "custom",    label: "Custom" },
];

export default function ImmigrationReports({ period = "weekly", tiles = {}, generated_at, generated_by }) {
    const setPeriod = (next) => router.get('/portal/immigration/reports', { period: next }, { preserveScroll: true });

    return (
        <div className="space-y-6 max-w-[1500px] mx-auto pb-12">
            <Head title="Reports — Immigration" />
            <PortalPageHeader eyebrow="Reports" title="Reports" description="Caseload, INZ throughput, adviser activity, and compliance — over any period." />

            {/* Tab strip */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <div className="flex items-center border-b border-gray-100 -mx-5 px-5">
                    {PERIODS.map((p) => (
                        <button key={p.key} type="button" onClick={() => setPeriod(p.key)} className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${period === p.key ? "text-amber-700 border-amber-600" : "text-gray-400 border-transparent hover:text-gray-700"}`}>
                            {p.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                    <DisabledAction icon={<Download size={13} />} label="Export PDF" />
                    <DisabledAction icon={<Share2 size={13} />}   label="Share with…" />
                </div>
            </div>

            {/* At-a-glance tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Tile label="Active cases"   value={tiles.active_cases   ?? 0} />
                <Tile label="New assessments" value={tiles.new_assessments ?? 0} hint="this week" />
                <Tile label="Docs pending"   value={tiles.docs_pending   ?? 0} />
            </div>

            <ComingSoonPanel icon={<LineChart size={22} />} title="Full report sections in build" lines={[
                "Caseload by visa type · INZ pipeline aging · per-adviser activity (scoped to role).",
                "Compliance: IAA licence status, agreements signed, audit-log coverage.",
                "Trend chart (weekly / monthly / quarterly / custom) with toggleable series.",
                "Same 'Share with…' workflow as Sales reports — sends a frozen snapshot to other departments with context.",
            ]} />

            <footer className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center justify-between gap-3 flex-wrap text-[11px] text-gray-500">
                <div className="flex items-center gap-4">
                    <span>Generated {new Date(generated_at || Date.now()).toLocaleString("en-NZ", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    {generated_by && <span>by <span className="font-semibold text-gray-700">{generated_by}</span></span>}
                </div>
                <span className="italic text-gray-400">Not shared with any other team</span>
            </footer>
        </div>
    );
}

function Tile({ label, value, hint }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">{label}</p>
            <p className="text-3xl font-bold text-gray-900 tabular-nums mt-1">{value}</p>
            {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
        </div>
    );
}

function DisabledAction({ icon, label }) {
    return (
        <button type="button" disabled title="Coming soon" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 border border-gray-200 cursor-not-allowed">
            <Lock size={11} /> {icon} {label}
        </button>
    );
}
