import { Head } from "@inertiajs/react";
import { Home, Users, CheckSquare, AlertTriangle } from "lucide-react";

export default function AccommodationDashboard({ clientStats = {}, taskStats = {} }) {
    const cards = [
        { label: "Total clients", value: clientStats.total ?? 0, icon: <Users className="w-5 h-5" />, dark: true, foot: <span className="text-xs text-gray-400">all settlement clients</span> },
        { label: "Pre-arrival", value: clientStats.pre_arrival ?? 0, icon: <Home className="w-5 h-5" />, foot: <span className="text-xs text-gray-400">awaiting arrival</span> },
        { label: "Recently arrived", value: clientStats.recently_arrived ?? 0, icon: <CheckSquare className="w-5 h-5" />, foot: <span className="text-xs text-gray-400">active settlement</span> },
        { label: "Overdue tasks", value: taskStats.overdue ?? 0, icon: <AlertTriangle className="w-5 h-5" />, foot: <span className="text-xs text-gray-400">{taskStats.due_this_week ?? 0} due this week</span> },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <Head title="Accommodation Dashboard" />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((c, i) => (
                    <div key={i} className={`p-6 rounded-3xl ${c.dark ? "bg-gray-900 text-white shadow-lg" : "bg-white text-gray-900 border border-gray-50 shadow-sm"}`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className={`text-sm font-medium ${c.dark ? "text-gray-300" : "text-gray-500"}`}>{c.label}</span>
                            <span className={`p-1.5 rounded-lg ${c.dark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-500"}`}>{c.icon}</span>
                        </div>
                        <p className="text-3xl font-bold tracking-tight">{c.value}</p>
                        <div className="mt-2">{c.foot}</div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
                <div className="px-6 py-5">
                    <h2 className="text-lg font-bold text-gray-900">Settlement workflow</h2>
                    <p className="mt-1 text-sm text-gray-500">Per-client checklists (IRD, NZ bank account, GP enrolment, driver licence, KiwiSaver, etc.) will appear here once Accommodation Client + settlement-task tables are built.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 border-t border-gray-50">
                    {[
                        { label: "Pre-arrival", count: clientStats.pre_arrival ?? 0 },
                        { label: "Recently arrived", count: clientStats.recently_arrived ?? 0 },
                        { label: "Settling", count: 0 },
                        { label: "Settled", count: clientStats.settled ?? 0 },
                    ].map((stage) => (
                        <div key={stage.label} className="p-6 border-r last:border-r-0 border-gray-50">
                            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">{stage.label}</p>
                            <p className="mt-2 text-2xl font-bold text-gray-900">{stage.count}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 text-sm text-rose-900">
                <p className="font-semibold mb-1">Scaffold portal</p>
                <p className="text-rose-800/80">No backend models for settlement clients or tasks exist yet — every count above will be zero until those tables are added. The portal shell, layout, and route guard are in place so wiring up data later is a small change.</p>
            </div>
        </div>
    );
}
