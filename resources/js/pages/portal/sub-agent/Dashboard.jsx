import { Head, Link } from "@inertiajs/react";
import { Users, Activity, UserPlus, CheckCircle2, ArrowRight } from "lucide-react";

// Sub-agent dashboard — a quick read of the parent agent's referral pipeline.
export default function Dashboard({ agent = null, stats = {} }) {
    const tiles = [
        { label: "Referral leads", value: stats.total ?? 0, icon: <Users className="w-5 h-5" />, tone: "bg-purple-50 text-purple-600" },
        { label: "In pipeline", value: stats.in_pipeline ?? 0, icon: <Activity className="w-5 h-5" />, tone: "bg-amber-50 text-amber-600" },
        { label: "New today", value: stats.new_today ?? 0, icon: <UserPlus className="w-5 h-5" />, tone: "bg-blue-50 text-blue-600" },
        { label: "Converted", value: stats.converted ?? 0, icon: <CheckCircle2 className="w-5 h-5" />, tone: "bg-emerald-50 text-emerald-600" },
    ];

    return (
        <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
            <Head title="Dashboard" />

            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {agent
                        ? <>Managing the referral leads of <span className="font-semibold text-gray-700">{agent.name}</span>{agent.referral_code ? <> · <span className="font-mono text-gray-400">{agent.referral_code}</span></> : null}.</>
                        : "No recruiting agent has been assigned to you yet — ask an admin to link you to an agent."}
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {tiles.map((t) => (
                    <div key={t.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${t.tone}`}>{t.icon}</div>
                        <div className="text-3xl font-bold text-gray-900 tabular-nums mt-3">{t.value}</div>
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">{t.label}</div>
                    </div>
                ))}
            </div>

            <Link
                href="/portal/sub-agent/leads"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black transition-colors"
            >
                Work the referral leads <ArrowRight size={15} />
            </Link>
        </div>
    );
}
