import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TaskDetailModal from "./TaskDetailModal";
import Avatar from "@/components/ui/Avatar";

// Month-grid calendar for the Task Board. Lays tasks onto the calendar by
// their `due_at` date. Tasks without a due date don't render. Honours the
// Mine/All scope from the parent — the parent passes whichever subset it
// wants visible.

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_DOT = {
    not_started: "bg-sky-400",
    in_progress: "bg-orange-400",
    in_review:   "bg-pink-400",
    completed:   "bg-emerald-400",
};

const STATUS_CHIP = {
    not_started: "bg-sky-50  hover:bg-sky-100  border-sky-200  text-sky-900",
    in_progress: "bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-900",
    in_review:   "bg-pink-50 hover:bg-pink-100 border-pink-200 text-pink-900",
    completed:   "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900 line-through opacity-80",
};

const fmtTime = (iso) => {
    if (! iso) return null;
    const d = new Date(iso);
    return d.toLocaleTimeString("en-NZ", { hour: "numeric", minute: "2-digit" });
};

const initialsOf = (name = "") =>
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();

const startOfDay = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
};
const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

// Build a 6×7 grid for a given anchor month — start on Monday.
const buildMonthGrid = (anchor) => {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    // 0 = Mon, 6 = Sun (JS getDay returns 0 = Sun, so shift).
    const offsetToMonday = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - offsetToMonday);
    const days = [];
    for (let i = 0; i < 42; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push(d);
    }
    return days;
};

// 7-day strip Mon → Sun anchored to whichever week `anchor` falls in.
const buildWeekGrid = (anchor) => {
    const a = new Date(anchor);
    a.setHours(0, 0, 0, 0);
    const offsetToMonday = (a.getDay() + 6) % 7;
    a.setDate(a.getDate() - offsetToMonday);
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(a);
        d.setDate(a.getDate() + i);
        days.push(d);
    }
    return days;
};

export default function CalendarView({ tasks = [], onTaskClick }) {
    const [anchor, setAnchor]               = useState(() => new Date());
    const [mode, setMode]                   = useState("month"); // day | week | month
    const [selectedTask, setSelectedTask]   = useState(null);

    // Open the detail modal when a chip is clicked; still call the parent
    // callback so callers can hook in (analytics, etc.) if they want to.
    const handleTaskClick = (t) => {
        setSelectedTask(t);
        onTaskClick?.(t);
    };

    const monthGrid = useMemo(() => buildMonthGrid(anchor), [anchor]);
    const weekGrid  = useMemo(() => buildWeekGrid(anchor),  [anchor]);
    const today     = startOfDay(new Date());
    const monthOf   = anchor.getMonth();
    const yearOf    = anchor.getFullYear();

    // Bucket tasks by ISO yyyy-mm-dd so lookup per cell is O(1).
    const tasksByDate = useMemo(() => {
        const out = new Map();
        for (const t of tasks) {
            if (! t.due_at) continue;
            const d = startOfDay(new Date(t.due_at));
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            if (! out.has(key)) out.set(key, []);
            out.get(key).push(t);
        }
        return out;
    }, [tasks]);

    const undated = tasks.filter((t) => ! t.due_at);

    // Prev/next jumps the anchor by the active mode's window.
    const shiftAnchor = (sign) => {
        const next = new Date(anchor);
        if (mode === "day")        next.setDate(anchor.getDate() + sign);
        else if (mode === "week")  next.setDate(anchor.getDate() + sign * 7);
        else                       next.setMonth(anchor.getMonth() + sign);
        setAnchor(next);
    };
    const goPrev   = () => shiftAnchor(-1);
    const goNext   = () => shiftAnchor(1);
    const goToday  = () => setAnchor(new Date());

    // Header label adapts to the mode — long date for day, range for
    // week, "Month Year" for month.
    const headerLabel = useMemo(() => {
        if (mode === "day") {
            return anchor.toLocaleDateString("en-NZ", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
            });
        }
        if (mode === "week") {
            const first = weekGrid[0];
            const last  = weekGrid[6];
            const sameMonth = first.getMonth() === last.getMonth();
            const startStr = first.toLocaleDateString("en-NZ", { day: "numeric", month: sameMonth ? undefined : "short" });
            const endStr   = last.toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" });
            return `${startStr} – ${endStr}`;
        }
        return anchor.toLocaleDateString("en-NZ", { month: "long", year: "numeric" });
    }, [mode, anchor, weekGrid]);

    return (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={goPrev}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500"
                        aria-label={`Previous ${mode}`}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <h3 className="text-lg font-bold text-gray-900 min-w-[220px] text-center">{headerLabel}</h3>
                    <button
                        type="button"
                        onClick={goNext}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500"
                        aria-label={`Next ${mode}`}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Mode switcher — Day / Week / Month. */}
                    <div className="inline-flex items-center gap-1 bg-gray-50 rounded-lg border border-gray-200 p-0.5">
                        {[
                            ["day",   "Day"],
                            ["week",  "Week"],
                            ["month", "Month"],
                        ].map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setMode(key)}
                                className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-colors ${
                                    mode === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={goToday}
                        className="text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
                    >
                        Today
                    </button>
                </div>
            </div>

            {/* ── Month view ─────────────────────────────────── */}
            {mode === "month" && (
                <>
                    <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/40">
                        {WEEKDAYS.map((w) => (
                            <div key={w} className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-center">
                                {w}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7">
                        {monthGrid.map((day, idx) => {
                            const inMonth = day.getMonth() === monthOf;
                            const isToday = sameDay(day, today);
                            const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
                            const list = tasksByDate.get(key) || [];
                            const isWeekStart = idx % 7 === 0;

                            return (
                                <div
                                    key={key}
                                    className={`min-h-[140px] border-b border-gray-100 ${isWeekStart ? "" : "border-l"} ${
                                        inMonth ? "bg-white" : "bg-gray-50/40"
                                    }`}
                                >
                                    <div className="flex items-center justify-between px-2 py-1">
                                        <span className={`text-[11px] font-bold tabular-nums inline-flex items-center justify-center w-6 h-6 rounded-full ${
                                            isToday
                                                ? "bg-gray-900 text-white"
                                                : inMonth
                                                    ? "text-gray-700"
                                                    : "text-gray-400"
                                        }`}>
                                            {day.getDate()}
                                        </span>
                                        {list.length > 0 && (
                                            <span className="text-[9px] font-bold tabular-nums text-gray-400">
                                                {list.length}
                                            </span>
                                        )}
                                    </div>

                                    <div className="px-1.5 pb-1.5 space-y-1">
                                        {list.slice(0, 3).map((t) => (
                                            <CalendarChip
                                                key={t.id}
                                                task={t}
                                                onClick={() => handleTaskClick(t)}
                                            />
                                        ))}
                                        {list.length > 3 && (
                                            <button
                                                type="button"
                                                onClick={() => handleTaskClick(list[3])}
                                                className="block text-[10px] text-gray-500 font-medium px-1.5 hover:text-gray-900 hover:underline"
                                            >
                                                +{list.length - 3} more
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* ── Week view ──────────────────────────────────── */}
            {mode === "week" && (
                <>
                    <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/40">
                        {weekGrid.map((day) => {
                            const isToday = sameDay(day, today);
                            return (
                                <div key={day.toISOString()} className="px-3 py-2 text-center">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                        {day.toLocaleDateString("en-NZ", { weekday: "short" })}
                                    </div>
                                    <div className={`mt-1 mx-auto inline-flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-bold tabular-nums ${
                                        isToday ? "bg-gray-900 text-white" : "text-gray-700"
                                    }`}>
                                        {day.getDate()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-7">
                        {weekGrid.map((day, idx) => {
                            const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
                            const list = tasksByDate.get(key) || [];
                            const isWeekStart = idx === 0;
                            return (
                                <div
                                    key={key}
                                    className={`min-h-[420px] bg-white ${isWeekStart ? "" : "border-l border-gray-100"}`}
                                >
                                    <div className="px-1.5 py-1.5 space-y-1">
                                        {list.length === 0 ? (
                                            <p className="text-[10px] text-gray-300 text-center mt-4">No tasks</p>
                                        ) : (
                                            list.map((t) => (
                                                <CalendarChip
                                                    key={t.id}
                                                    task={t}
                                                    onClick={() => handleTaskClick(t)}
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* ── Day view ───────────────────────────────────── */}
            {mode === "day" && (
                (() => {
                    const key = `${anchor.getFullYear()}-${anchor.getMonth()}-${anchor.getDate()}`;
                    const list = (tasksByDate.get(key) || []).slice().sort((a, b) => {
                        // Sort by time-of-day so the list reads chronologically.
                        const aT = a.due_at ? new Date(a.due_at).getTime() : 0;
                        const bT = b.due_at ? new Date(b.due_at).getTime() : 0;
                        return aT - bT;
                    });
                    return (
                        <div className="px-4 py-5">
                            {list.length === 0 ? (
                                <p className="text-[12px] text-gray-400 text-center py-10">
                                    No tasks scheduled on this day.
                                </p>
                            ) : (
                                <div className="space-y-2 max-w-2xl mx-auto">
                                    {list.map((t) => (
                                        <CalendarChip
                                            key={t.id}
                                            task={t}
                                            onClick={() => handleTaskClick(t)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })()
            )}

            {/* Undated bucket footer */}
            {undated.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/40">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                        No due date · {undated.length}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {undated.slice(0, 12).map((t) => (
                            <CalendarChip
                                key={t.id}
                                task={t}
                                onClick={() => handleTaskClick(t)}
                                compact
                            />
                        ))}
                        {undated.length > 12 && (
                            <span className="text-[10.5px] text-gray-500 font-medium px-2 py-1">
                                +{undated.length - 12} more
                            </span>
                        )}
                    </div>
                </div>
            )}

            <TaskDetailModal
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
            />
        </div>
    );
}

// ── Calendar chip ─────────────────────────────────────────────────────────
// One task as it appears on a day cell. Pastel soft-tinted card with the
// title (up to 3 lines), a time range below, and a footer row that
// surfaces the assignee stack on the left and the lead/department context
// on the right. `compact` shrinks padding for the undated footer bucket.

// Vibrant per-user palette for the assignee bubble.
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

function CalendarChip({ task, onClick, compact = false }) {
    const status     = task.status || (task.completed ? "completed" : "not_started");
    const time       = fmtTime(task.due_at);
    const isOverdue  = task.overdue && status !== "completed";

    // Bottom-row footer text — prefer the linked lead, fall back to the
    // category, then "Internal".
    const contextLabel = task.lead?.name
        ? task.lead.name
        : task.category
            ? task.category
            : "Internal";

    const extraAssignees = Array.isArray(task.additional_assignee_ids)
        ? task.additional_assignee_ids
        : [];

    return (
        <button
            type="button"
            onClick={onClick}
            title={`${task.title}${task.note ? ` — ${task.note}` : ""}`}
            className={`group block w-full text-left rounded-lg border ${STATUS_CHIP[status] || "bg-gray-100 text-gray-700 border-gray-200"} transition-colors ${
                isOverdue ? "ring-1 ring-red-300" : ""
            } ${compact ? "px-2 py-1.5 max-w-[220px]" : "px-2.5 py-2"} ${task.completed ? "line-through" : ""}`}
        >
            {/* Title — multi-line, bold, the dominant element on the chip. */}
            <p className={`text-[11.5px] font-bold leading-snug ${compact ? "truncate" : "line-clamp-3"}`}>
                {task.title}
            </p>

            {/* Time line — sits below the title, lighter weight. */}
            {time && ! compact && (
                <p className="mt-0.5 text-[10px] tabular-nums opacity-70">
                    {time}
                </p>
            )}

            {/* Footer — assignee stack on the left + context label on the
                right. Hidden in compact mode to keep the undated bucket tight. */}
            {! compact && (
                <div className="flex items-center justify-between gap-2 mt-2 text-[10px]">
                    <div className="flex items-center gap-1.5">
                        {(task.assignee || extraAssignees.length > 0) && (
                            <div className="flex -space-x-1.5">
                                {task.assignee && (
                                    <Avatar
                                        name={task.assignee.name}
                                        src={task.assignee.avatar_url}
                                        colorKey={task.assignee.name || String(task.assignee.id)}
                                        size={20}
                                        ring
                                    />
                                )}
                                {extraAssignees.slice(0, 2).map((id) => (
                                    <span
                                        key={id}
                                        title="Additional assignee"
                                        className={`inline-block w-5 h-5 rounded-full ring-2 ring-white ${avatarColour(`extra-${id}`)}`}
                                    />
                                ))}
                            </div>
                        )}
                        {extraAssignees.length > 2 && (
                            <span className="opacity-70 font-bold">+{extraAssignees.length - 2}</span>
                        )}
                    </div>
                    <span className="opacity-70 truncate max-w-[80px]" title={contextLabel}>
                        {contextLabel}
                    </span>
                </div>
            )}
        </button>
    );
}
