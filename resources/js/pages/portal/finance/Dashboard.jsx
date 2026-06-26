import { Head } from "@inertiajs/react";
import { DollarSign, CreditCard, AlertTriangle, PiggyBank } from "lucide-react";

const PLACEHOLDER_TILES = [
    {
        key: "revenue",
        label: "Revenue collected",
        icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
        hint: "Total fees received this period.",
    },
    {
        key: "outstanding",
        label: "Outstanding",
        icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
        hint: "Amount invoiced but not yet paid.",
    },
    {
        key: "in_progress",
        label: "In progress",
        icon: <CreditCard className="w-5 h-5 text-indigo-600" />,
        hint: "Engagements with active payment plans.",
    },
    {
        key: "reserves",
        label: "Reserves",
        icon: <PiggyBank className="w-5 h-5 text-blue-600" />,
        hint: "Funds held against future work.",
    },
];

export default function FinanceDashboard() {
    return (
        <div className="max-w-[1400px] mx-auto pb-12 space-y-6">
            <Head title="Finance Dashboard" />

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Finance Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Overview of fees, payments, and outstanding balances.
                    </p>
                </div>
            </div>

            {/* Placeholder KPI tiles — wire to real metrics once the
                payments / invoices data model is defined. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PLACEHOLDER_TILES.map((t) => (
                    <div
                        key={t.key}
                        className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-gray-500">
                                {t.label}
                            </span>
                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                                {t.icon}
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 tracking-tight">—</p>
                        <p className="text-[11px] text-gray-400 mt-2 leading-snug">
                            {t.hint}
                        </p>
                    </div>
                ))}
            </div>

            {/* Placeholder chart area — keeps the layout balanced until the
                real metrics ship. */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PlaceholderPanel
                    title="Revenue trend"
                    subtitle="Chart will render once payments are tracked."
                />
                <PlaceholderPanel
                    title="Aged receivables"
                    subtitle="Outstanding balance buckets, by age."
                />
            </div>
        </div>
    );
}

function PlaceholderPanel({ title, subtitle }) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 tracking-tight mb-1">
                {title}
            </h2>
            <p className="text-[12px] text-gray-500 mb-6">{subtitle}</p>
            <div className="h-48 border border-dashed border-gray-200 rounded-xl flex items-center justify-center bg-gray-50/40">
                <p className="text-[12px] text-gray-400 font-medium">
                    Coming soon
                </p>
            </div>
        </div>
    );
}
