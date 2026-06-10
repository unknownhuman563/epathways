import { useMemo, useState } from "react";
import { Link } from "@inertiajs/react";
import {
    ChevronDown, ChevronRight, Plus, MoreHorizontal,
    Tag, Users as UsersIcon, Calendar, FileText, Hash,
    AlertCircle,
} from "lucide-react";
import TaskDetailModal from "./TaskDetailModal";

// Grouped list view of the task board. Tasks are grouped by status
// (To Do / In Progress / In Review / Done) into collapsible sections,
// each rendering a tidy table with columns for Task Name, Description,
// Due date, Type, People (assignees), and Priority. Clicking a row
// opens the same TaskDetailModal the kanban cards open.

// Mirrors KanbanBoard's COLUMNS array — same order, same labels, same
// tone family per bucket. Overdue sits first as an attention bucket
// (computed from due_at < now, not a real persisted status).
const STATUS_GROUPS = [
    { key: "overdue",     label: "Overdue",     tone: "bg-red-50 text-red-700 border-red-200" },
    { key: "not_started", label: "Not Started", tone: "bg-sky-50 text-sky-700 border-sky-200" },
    { key: "in_progress", label: "In Progress", tone: "bg-orange-50 text-orange-700 border-orange-200" },
    { key: "in_review",   label: "In Review",   tone: "bg-pink-50 text-pink-700 border-pink-200" },
    { key: "completed",   label: "Done",        tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
];

// Same routing rule the kanban uses: completed always wins, then
// overdue, then the persisted status. Keeps an in_progress past-due
// task surfaced in Overdue rather than buried mid-pipeline.
const statusOf = (t) => {
    const realStatus = t.status || (t.completed ? "completed" : "not_started");
    if (realStatus === "completed") return "completed";
    if (t.overdue) return "overdue";
    return realStatus;
};

const PRIORITY_CHIP = {
    urgent: { dot: "bg-red-500",    label: "text-red-700",    bg: "bg-red-50 border-red-200" },
    high:   { dot: "bg-amber-500",  label: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
    normal: { dot: "bg-cyan-500",   label: "text-cyan-700",   bg: "bg-cyan-50 border-cyan-200" },
    low:    { dot: "bg-slate-400",  label: "text-slate-600",  bg: "bg-slate-50 border-slate-200" },
};

const TYPE_CHIP = {
    call:      "bg-orange-50 text-orange-700 border-orange-200",
    email:     "bg-blue-50 text-blue-700 border-blue-200",
    meeting:   "bg-purple-50 text-purple-700 border-purple-200",
    document:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    follow_up: "bg-pink-50 text-pink-700 border-pink-200",
    internal:  "bg-gray-100 text-gray-700 border-gray-200",
    other:     "bg-slate-50 text-slate-600 border-slate-200",
};

const AVATAR_PALETTE = [
    "bg-blue-500", "bg-pink-500", "bg-orange-500", "bg-teal-500",
    "bg-purple-500", "bg-amber-500", "bg-emerald-500", "bg-rose-500",
    "bg-indigo-500", "bg-fuchsia-500",
];
const avatarColour = (key = "") => {
    let h = 0;
    for (let i = 0; i < key.length; i++) h = ((h << 5) - h) + key.charCodeAt(i);
    return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
};
const initials = (name = "") =>
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();

const fmtDue = (iso) => {
    if (! iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-NZ", { day: "2-digit", month: "short", year: "numeric" });
};

// Group tasks by the same rule the kanban uses. Tasks land in exactly
// one bucket — statusOf() handles the overdue-takes-precedence logic.
function groupByStatus(tasks) {
    const buckets = {};
    STATUS_GROUPS.forEach((g) => { buckets[g.key] = []; });
    for (const t of tasks) {
        const key = statusOf(t);
        buckets[key]?.push(t);
    }
    return buckets;
}

export default function ListView({ tasks = [], department, onNewTask }) {
    const grouped = useMemo(() => groupByStatus(tasks), [tasks]);
    const [collapsed, setCollapsed] = useState({}); // map of statusKey -> bool
    const [selectedTask, setSelectedTask] = useState(null);

    const toggle = (key) => setCollapsed((c) => ({ ...c, [key]: ! c[key] }));

    return (
        <div className="px-2 sm:px-4 pb-12 space-y-4">
            {STATUS_GROUPS.map((group) => {
                const items = grouped[group.key] || [];
                const isCollapsed = collapsed[group.key];
                return (
                    <section
                        key={group.key}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                    >
                        {/* Group header — chevron + status chip + count + add */}
                        <button
                            type="button"
                            onClick={() => toggle(group.key)}
                            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-gray-50/70 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                {isCollapsed
                                    ? <ChevronRight size={14} className="text-gray-400" />
                                    : <ChevronDown size={14} className="text-gray-400" />
                                }
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${group.tone}`}>
                                    {group.label}
                                </span>
                                <span className="text-[11px] font-bold tabular-nums text-gray-500 ml-1">
                                    {items.length}
                                </span>
                            </div>
                            <span
                                role="button"
                                onClick={(e) => { e.stopPropagation(); onNewTask?.(); }}
                                className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 inline-flex"
                                title="New task"
                            >
                                <Plus size={14} />
                            </span>
                        </button>

                        {/* Group body */}
                        {! isCollapsed && (
                            items.length === 0 ? (
                                <div className="px-4 py-6 text-center text-[12px] text-gray-400">
                                    No tasks in this stage yet.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[12px]">
                                        <thead>
                                            <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                                                <th className="pl-4 pr-2 py-2.5 w-8">
                                                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300" disabled />
                                                </th>
                                                <ColTh icon={<Hash size={10} />}>Task Name</ColTh>
                                                <ColTh icon={<FileText size={10} />}>Description</ColTh>
                                                <ColTh icon={<Calendar size={10} />}>Estimation</ColTh>
                                                <ColTh icon={<Tag size={10} />}>Type</ColTh>
                                                <ColTh icon={<UsersIcon size={10} />}>People</ColTh>
                                                <ColTh icon={<AlertCircle size={10} />}>Priority</ColTh>
                                                <th className="px-3 py-2.5 w-10 text-right">
                                                    <Plus size={11} className="inline-block text-gray-400" />
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((t) => (
                                                <TaskRow
                                                    key={t.id}
                                                    task={t}
                                                    onOpen={() => setSelectedTask(t)}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}
                    </section>
                );
            })}

            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                />
            )}
        </div>
    );
}

function ColTh({ icon, children }) {
    return (
        <th className="px-3 py-2.5 font-bold">
            <span className="inline-flex items-center gap-1">
                {icon}
                <span>{children}</span>
            </span>
        </th>
    );
}

function TaskRow({ task: t, onOpen }) {
    const priority = PRIORITY_CHIP[t.priority] || PRIORITY_CHIP.normal;
    const typeClass = TYPE_CHIP[t.type] || TYPE_CHIP.other;
    const assignees = useMemo(() => {
        const out = [];
        if (t.assignee) out.push(t.assignee);
        // additional_assignee_ids only carries ids — surface them as
        // colour-coded initial bubbles without name resolution since
        // we don't have the full directory at this layer.
        const extras = Array.isArray(t.additional_assignee_ids) ? t.additional_assignee_ids : [];
        extras.forEach((id, i) => out.push({ id, name: `+${i + 1}` }));
        return out.slice(0, 3);
    }, [t.assignee, t.additional_assignee_ids]);
    const extra = (t.assignee ? 1 : 0) + (Array.isArray(t.additional_assignee_ids) ? t.additional_assignee_ids.length : 0) - assignees.length;

    return (
        <tr
            onClick={onOpen}
            className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer"
        >
            <td className="pl-4 pr-2 py-2.5">
                <input
                    type="checkbox"
                    onClick={(e) => e.stopPropagation()}
                    className="w-3.5 h-3.5 rounded border-gray-300"
                />
            </td>
            <td className="px-3 py-2.5 max-w-[200px]">
                <div className="font-semibold text-gray-900 truncate" title={t.title}>
                    {t.title}
                </div>
            </td>
            <td className="px-3 py-2.5 max-w-[260px]">
                <div className="text-gray-500 truncate" title={t.description || ""}>
                    {t.description || "—"}
                </div>
            </td>
            <td className="px-3 py-2.5 text-gray-600 tabular-nums whitespace-nowrap">
                {fmtDue(t.due_at)}
            </td>
            <td className="px-3 py-2.5">
                {t.type ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${typeClass}`}>
                        {String(t.type).replace("_", " ")}
                    </span>
                ) : (
                    <span className="text-gray-300">—</span>
                )}
            </td>
            <td className="px-3 py-2.5">
                <div className="flex -space-x-1.5">
                    {assignees.length === 0 ? (
                        <span className="text-gray-300">—</span>
                    ) : (
                        <>
                            {assignees.map((a, i) => (
                                <span
                                    key={`${a.id}-${i}`}
                                    title={a.name}
                                    className={`w-6 h-6 rounded-full ${avatarColour(a.name)} text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white`}
                                >
                                    {initials(a.name)}
                                </span>
                            ))}
                            {extra > 0 && (
                                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                                    +{extra}
                                </span>
                            )}
                        </>
                    )}
                </div>
            </td>
            <td className="px-3 py-2.5">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${priority.bg} ${priority.label}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                    {(t.priority || "normal").toUpperCase()}
                </span>
            </td>
            <td className="px-3 py-2.5 text-right">
                <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 rounded-md hover:bg-gray-100 text-gray-400 inline-flex"
                    aria-label="Row actions"
                >
                    <MoreHorizontal size={14} />
                </button>
            </td>
        </tr>
    );
}
