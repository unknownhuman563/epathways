import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MessageCircle, Paperclip } from "lucide-react";
import TaskDetailModal from "./TaskDetailModal";

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

const PRIORITY_DOT = {
    urgent: "bg-red-500",
    high:   "bg-orange-500",
    normal: "",
    low:    "",
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

export default function CalendarView({ tasks = [], onTaskClick }) {
    const [anchor, setAnchor]               = useState(() => new Date());
    const [selectedTask, setSelectedTask]   = useState(null);

    // Open the detail modal when a chip is clicked; still call the parent
    // callback so callers can hook in (analytics, etc.) if they want to.
    const handleTaskClick = (t) => {
        setSelectedTask(t);
        onTaskClick?.(t);
    };

    const grid    = useMemo(() => buildMonthGrid(anchor), [anchor]);
    const today   = startOfDay(new Date());
    const monthOf = anchor.getMonth();
    const yearOf  = anchor.getFullYear();

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

    const goPrev   = () => setAnchor(new Date(yearOf, monthOf - 1, 1));
    const goNext   = () => setAnchor(new Date(yearOf, monthOf + 1, 1));
    const goToday  = () => setAnchor(new Date());

    const monthLabel = anchor.toLocaleDateString("en-NZ", { month: "long", year: "numeric" });

    return (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={goPrev}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500"
                        aria-label="Previous month"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <h3 className="text-lg font-bold text-gray-900 min-w-[160px] text-center">{monthLabel}</h3>
                    <button
                        type="button"
                        onClick={goNext}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500"
                        aria-label="Next month"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>

                <button
                    type="button"
                    onClick={goToday}
                    className="text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
                >
                    Today
                </button>
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/40">
                {WEEKDAYS.map((w) => (
                    <div key={w} className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-center">
                        {w}
                    </div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
                {grid.map((day, idx) => {
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
// One task as it appears on a day cell. Shows time / priority dot / title +
// a footer line with assignee initials, comment count, attachment count.

function CalendarChip({ task, onClick, compact = false }) {
    const status     = task.status || (task.completed ? "completed" : "not_started");
    const time       = fmtTime(task.due_at);
    const priority   = task.priority || "normal";
    const priorityCl = PRIORITY_DOT[priority];
    const attachCnt  = (task.attachments || []).length;
    const commentCnt = Number(task.comments_count || 0);
    const isOverdue  = task.overdue && status !== "completed";

    return (
        <button
            type="button"
            onClick={onClick}
            title={`${task.title}${task.note ? ` — ${task.note}` : ""}`}
            className={`group block w-full text-left rounded-md border ${STATUS_CHIP[status] || "bg-gray-100 text-gray-700 border-gray-200"} transition-colors ${
                isOverdue ? "ring-1 ring-red-300" : ""
            } ${compact ? "px-2 py-1 max-w-[220px] truncate" : "px-1.5 py-1"}`}
        >
            <div className="flex items-center gap-1 min-w-0">
                {priorityCl ? (
                    <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityCl}`} title={`${priority} priority`} />
                ) : (
                    <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[status] || "bg-gray-400"}`} />
                )}
                {time && ! compact && (
                    <span className="text-[9.5px] font-bold tabular-nums opacity-70 flex-shrink-0">{time}</span>
                )}
                <span className="text-[10.5px] font-semibold truncate min-w-0">{task.title}</span>
            </div>

            {! compact && (commentCnt > 0 || attachCnt > 0 || task.assignee) && (
                <div className="flex items-center justify-between gap-1.5 mt-0.5 text-[9px] opacity-70">
                    <div className="flex items-center gap-1.5">
                        {commentCnt > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                                <MessageCircle size={8} /> {commentCnt}
                            </span>
                        )}
                        {attachCnt > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                                <Paperclip size={8} /> {attachCnt}
                            </span>
                        )}
                    </div>
                    {task.assignee && (
                        <span
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/70 text-[8px] font-bold text-gray-700"
                            title={task.assignee.name}
                        >
                            {initialsOf(task.assignee.name)}
                        </span>
                    )}
                </div>
            )}
        </button>
    );
}
