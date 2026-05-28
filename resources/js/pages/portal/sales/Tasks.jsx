import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    CheckSquare, Clock, AlertTriangle, CalendarDays, Inbox, Check,
    User, Hash, ChevronRight, Filter,
} from "lucide-react";

const PRIORITY_STYLE = {
    low:    "bg-gray-100 text-gray-600 border-gray-200",
    normal: "bg-blue-50 text-blue-700 border-blue-200",
    high:   "bg-amber-50 text-amber-700 border-amber-200",
    urgent: "bg-red-100 text-red-700 border-red-200",
};

const fmtTime = (iso) => iso ? new Date(iso).toLocaleString("en-NZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export default function SalesTasks({
    today = [], overdue = [], this_week = [], undated = [], recently_done = [],
    scope = "mine",
    portal = "sales",
}) {
    // Page is shared between the Sales and Education portals — the prop
    // drives which URL prefix each link / scope-change uses so the same
    // component renders correctly under either layout.
    const portalBase = `/portal/${portal}`;
    const [tab, setTab] = useState(overdue.length > 0 ? "overdue" : "today");
    const [savingId, setSavingId] = useState(null);

    const tabs = [
        { key: "overdue",  label: "Overdue",   count: overdue.length,  icon: <AlertTriangle size={13} />, danger: true,  rows: overdue },
        { key: "today",    label: "Today",     count: today.length,    icon: <Clock size={13} />,         rows: today },
        { key: "this_week",label: "This week", count: this_week.length,icon: <CalendarDays size={13} />,  rows: this_week },
        { key: "undated",  label: "No due date", count: undated.length, icon: <Inbox size={13} />,         rows: undated },
        { key: "done",     label: "Recently done", count: recently_done.length, icon: <Check size={13} />, rows: recently_done },
    ];

    const active = tabs.find((t) => t.key === tab) || tabs[0];

    const toggleComplete = (task) => {
        setSavingId(task.id);
        router.post(`/admin/leads/${task.lead.id}/tasks/${task.id}`,
            { completed: !task.completed },
            { preserveScroll: true, preserveState: true, onFinish: () => setSavingId(null) });
    };

    const setScope = (s) => {
        router.get(`${portalBase}/tasks`, { scope: s }, { preserveScroll: true });
    };

    return (
        <div className="space-y-5 max-w-[1400px] mx-auto pb-12">
            <Head title="Tasks & Follow-ups — Sales" />

            {/* Header */}
            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Tasks &amp; Follow-ups</h1>
                    <p className="text-sm text-gray-500 mt-1.5">
                        Every open task across every lead — your daily inbox so you don&apos;t have to drill into each lead.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1">
                    <button
                        type="button"
                        onClick={() => setScope("mine")}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${
                            scope === "mine" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        Assigned to me
                    </button>
                    <button
                        type="button"
                        onClick={() => setScope("all")}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${
                            scope === "all" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        All staff
                    </button>
                </div>
            </div>

            {/* KPI strip — Today / Overdue / This Week */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiTile label="Overdue"    value={overdue.length}    icon={<AlertTriangle size={14} />} tone="danger" />
                <KpiTile label="Due today"  value={today.length}      icon={<Clock size={14} />}         tone="warning" />
                <KpiTile label="This week"  value={this_week.length}  icon={<CalendarDays size={14} />}  tone="default" />
                <KpiTile label="Recently done" value={recently_done.length} icon={<Check size={14} />}   tone="success" />
            </div>

            {/* Tab strip */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center border-b border-gray-100 px-2 overflow-x-auto">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setTab(t.key)}
                            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                                tab === t.key
                                    ? `text-gray-900 ${t.danger ? "border-red-500" : "border-gray-900"}`
                                    : "text-gray-400 border-transparent hover:text-gray-700"
                            }`}
                        >
                            {t.icon}
                            {t.label}
                            {t.count > 0 && (
                                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold tabular-nums ${
                                    t.danger ? "bg-red-500 text-white" : tab === t.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
                                }`}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Task list */}
                {active.rows.length === 0 ? (
                    <div className="px-6 py-20 text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
                            <CheckSquare size={22} />
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                            {tab === "overdue" && "Inbox zero — no overdue tasks."}
                            {tab === "today" && "Nothing due today. Schedule follow-ups from each lead's page."}
                            {tab === "this_week" && "Nothing scheduled this week."}
                            {tab === "undated" && "Every task has a due date — nice work."}
                            {tab === "done" && "No recently-completed tasks."}
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {active.rows.map((t) => (
                            <TaskRow
                                key={t.id}
                                task={t}
                                onToggle={() => toggleComplete(t)}
                                isSaving={savingId === t.id}
                                portalBase={portalBase}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function KpiTile({ label, value, icon, tone = "default" }) {
    const TONES = {
        default: { ring: "border-gray-100",       glyph: "bg-gray-100 text-gray-600",         num: "text-gray-900" },
        warning: { ring: "border-amber-200",      glyph: "bg-amber-100 text-amber-700",       num: "text-amber-700" },
        danger:  { ring: "border-red-200",        glyph: "bg-red-100 text-red-700",           num: "text-red-700"   },
        success: { ring: "border-emerald-200",    glyph: "bg-emerald-100 text-emerald-700",   num: "text-emerald-700" },
    };
    const t = TONES[tone] || TONES.default;
    return (
        <div className={`bg-white rounded-2xl border ${t.ring} p-4 flex items-center gap-3`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.glyph}`}>{icon}</div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">{label}</p>
                <p className={`text-2xl font-bold tabular-nums ${t.num}`}>{value}</p>
            </div>
        </div>
    );
}

function TaskRow({ task, onToggle, isSaving, portalBase = '/portal/sales' }) {
    const priorityStyle = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.normal;
    return (
        <li className={`group px-5 py-3 flex items-center gap-3 transition-colors hover:bg-gray-50/50 ${task.completed ? "opacity-60" : ""} ${task.overdue ? "bg-red-50/30" : ""}`}>
            {/* Quick-complete checkbox */}
            <button
                type="button"
                onClick={onToggle}
                disabled={isSaving}
                className={`w-[20px] h-[20px] rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${task.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300 hover:border-gray-900"} disabled:opacity-40`}
                title={task.completed ? "Mark incomplete" : "Mark complete"}
            >
                {task.completed && <Check size={12} strokeWidth={3} />}
            </button>

            {/* Title + meta */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-semibold ${task.completed ? "line-through text-gray-400" : "text-gray-900"}`}>
                        {task.title}
                    </span>
                    {task.priority !== "normal" && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${priorityStyle}`}>
                            {task.priority}
                        </span>
                    )}
                    {task.due_at && (
                        <span className={`text-[10px] font-semibold tabular-nums ${task.overdue ? "text-red-600" : "text-gray-400"}`}>
                            {task.overdue ? "⚠ " : ""}{fmtTime(task.due_at)}
                        </span>
                    )}
                </div>

                {/* Lead + assignee */}
                <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                    {task.lead && (
                        <Link
                            href={`${portalBase}/leads/${task.lead.id}`}
                            className="inline-flex items-center gap-1 hover:text-blue-600 font-medium"
                        >
                            <User size={10} />
                            {task.lead.name}
                            <Hash size={9} className="text-gray-300 ml-0.5" />
                            <span className="font-mono text-gray-400">{task.lead.lead_id}</span>
                            <ChevronRight size={10} className="text-gray-300" />
                        </Link>
                    )}
                    {task.assignee && (
                        <span className="inline-flex items-center gap-1">
                            <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-700 text-[9px] font-bold flex items-center justify-center">
                                {task.assignee.name.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
                            </span>
                            {task.assignee.name}
                        </span>
                    )}
                </div>
            </div>

            {/* Open lead shortcut */}
            {task.lead && (
                <Link
                    href={`/portal/sales/leads/${task.lead.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                >
                    Open lead
                </Link>
            )}
        </li>
    );
}
