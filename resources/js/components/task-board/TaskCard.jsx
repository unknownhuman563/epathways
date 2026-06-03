import { useMemo, useState } from "react";
import {
    Building2, Calendar, Hash, Lock, MessageCircle, MoreVertical, Paperclip, User,
} from "lucide-react";
import CommentsPopover from "./CommentsPopover";

// Pure presentational task card. Shared between the kanban (where it's
// wrapped by useDraggable) and the list view (where it sits in a grid).
// Lives outside KanbanBoard so it doesn't require a DndContext to mount.

// Pastel palette for tag chips — same string always hashes to the same
// color so the eye can scan by tag across the board.
const TAG_PALETTE = [
    "bg-blue-100 text-blue-700",
    "bg-pink-100 text-pink-700",
    "bg-orange-100 text-orange-700",
    "bg-teal-100 text-teal-700",
    "bg-purple-100 text-purple-700",
    "bg-amber-100 text-amber-700",
    "bg-emerald-100 text-emerald-700",
    "bg-rose-100 text-rose-700",
];

export const tagColor = (tag) => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) hash = ((hash << 5) - hash) + tag.charCodeAt(i);
    return TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length];
};

const PRIORITY_CHIP = {
    urgent: "bg-red-100 text-red-700",
    high:   "bg-orange-100 text-orange-700",
    low:    "bg-gray-100 text-gray-600",
    // 'normal' intentionally omitted — default needs no chip.
};

// Vibrant per-user palette for the assignee avatar so it stays visible
// against the saturated card tints. Same string always hashes to the
// same color.
const AVATAR_PALETTE = [
    "bg-blue-500", "bg-pink-500", "bg-orange-500", "bg-teal-500",
    "bg-purple-500", "bg-amber-500", "bg-emerald-600", "bg-rose-500",
    "bg-indigo-500", "bg-fuchsia-500",
];

const avatarColor = (key) => {
    const str = String(key || "");
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
    return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
};

export const DEPARTMENT_LABEL = {
    sales:         "Sales",
    education:     "Education",
    immigration:   "Immigration",
    accommodation: "Accommodation",
    admin:         "Admin",
};

// Absolute timestamp for the hover tooltip ("02 Jun 2026, 05:00 pm").
const fmtAbsolute = (iso) =>
    iso
        ? new Date(iso).toLocaleString("en-NZ", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : null;

// Friendly relative due date — "Today, 5:00 pm", "Tomorrow", "2 days left",
// "Yesterday", "3 days ago", "in 2 weeks", "2 weeks ago"; falls back to the
// short calendar date once it's beyond about a month either way.
const fmtRelative = (iso) => {
    if (! iso) return null;
    const now  = new Date();
    const then = new Date(iso);

    const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
    const calDiff = Math.round((startOfDay(then) - startOfDay(now)) / (24 * 60 * 60 * 1000));

    const timeStr = then.toLocaleTimeString("en-NZ", { hour: "2-digit", minute: "2-digit" });

    if (calDiff === 0)  return `Today, ${timeStr}`;
    if (calDiff === 1)  return "Tomorrow";
    if (calDiff === -1) return "Yesterday";
    if (calDiff > 1  && calDiff <=  7) return `${calDiff} days left`;
    if (calDiff < -1 && calDiff >= -7) return `${-calDiff} days ago`;
    if (calDiff > 7  && calDiff <=  30) {
        const w = Math.round(calDiff / 7);
        return `In ${w} ${w === 1 ? "week" : "weeks"}`;
    }
    if (calDiff < -7 && calDiff >= -30) {
        const w = Math.round(-calDiff / 7);
        return `${w} ${w === 1 ? "week" : "weeks"} ago`;
    }
    return then.toLocaleDateString("en-NZ", {
        day: "2-digit", month: "short",
        year: now.getFullYear() === then.getFullYear() ? undefined : "numeric",
    });
};

const initials = (name = "") =>
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();

const TaskCard = function TaskCard({
    task,
    currentDepartment,
    onClick,
    onMenuClick,
    locked = false,         // shows the lock icon (kanban: can't drag)
    isOverlay = false,      // dnd-kit DragOverlay rendering — extra shadow
    dragHandleProps = null, // optional spread for drag attributes/listeners
    setNodeRef = null,      // optional ref for dnd-kit
    style = undefined,      // optional transform style for dnd-kit
    tone = null,            // optional tailwind bg class (e.g. "bg-sky-50") — used by kanban for column-tinted cards
}, ref) {
    const isLinked = !! task.lead;
    const crossDept =
        task.department
        && currentDepartment !== "admin"
        && task.department !== currentDepartment;
    const due       = fmtRelative(task.due_at);
    const dueExact  = fmtAbsolute(task.due_at);
    const isOverdue = task.overdue;

    const chips = useMemo(() => {
        const out = [];
        if (task.category)      out.push({ label: task.category, palette: tagColor(task.category) });
        else if (task.type)     out.push({ label: task.type.replace("_", " "), palette: tagColor(task.type) });
        for (const tag of (task.tags || [])) out.push({ label: tag, palette: tagColor(tag) });
        return out.slice(0, 4);
    }, [task.category, task.type, task.tags]);

    const priorityChip = PRIORITY_CHIP[task.priority];

    const images = (task.attachments || []).filter((a) => a.is_image);
    const firstImage = images[0];
    const attachmentCount = (task.attachments || []).length;

    // Comments badge / popover. `commentsCount` shadows the server-provided
    // count so it bumps live when the viewer adds one without needing a
    // full board refetch.
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [commentsCount, setCommentsCount] = useState(Number(task.comments_count ?? 0));

    return (
        <>
        <div
            ref={setNodeRef}
            {...(dragHandleProps || {})}
            style={style}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    onClick?.();
                }
            }}
            tabIndex={0}
            role="button"
            aria-label={`${task.title}, ${task.priority || "normal"} priority, ${task.status || "not started"}`}
            className={`relative ${tone || "bg-white"} rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-gray-900 ${
                dragHandleProps ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
            } ${isOverlay ? "shadow-2xl rotate-1" : "hover:shadow-md transition-shadow"}`}
        >
            {/* Chip row + kebab */}
            <div className="flex items-start justify-between gap-2 p-3 pb-2">
                <div className="flex items-center gap-1 flex-wrap min-w-0">
                    {chips.map((c, i) => (
                        <span
                            key={`${c.label}-${i}`}
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${c.palette}`}
                        >
                            {c.label}
                        </span>
                    ))}
                    {priorityChip && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${priorityChip}`}>
                            {task.priority}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {locked && (
                        <span className="text-gray-400" title="Locked — you can't move tasks from other departments">
                            <Lock size={12} />
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onMenuClick?.(task);
                        }}
                        className="text-gray-400 hover:text-gray-700 p-0.5 rounded hover:bg-gray-100"
                        aria-label="Task menu"
                    >
                        <MoreVertical size={14} />
                    </button>
                </div>
            </div>

            {/* Title */}
            <h4 className={`px-3 text-[14px] font-bold leading-snug ${task.completed ? "line-through text-gray-400" : "text-gray-900"}`}>
                {task.title}
            </h4>

            {/* Description preview — 3 lines max */}
            {task.description && (
                <p className="px-3 mt-1 text-[11.5px] text-gray-500 leading-snug line-clamp-3">
                    {task.description}
                </p>
            )}

            {/* Linked-record or category subtitle (only when no description) */}
            {! task.description && isLinked && (
                <p className="px-3 mt-1 text-[10px] text-gray-500 truncate flex items-center gap-0.5">
                    <User size={9} className="text-gray-400" /> Lead
                    <Hash size={8} className="text-gray-300 ml-0.5" />
                    <span className="font-mono">{task.lead.lead_id}</span>
                    <span className="ml-1 truncate">— {task.lead.name}</span>
                </p>
            )}
            {! task.description && ! isLinked && task.category && (
                <p className="px-3 mt-1 text-[10px] text-gray-500 truncate inline-flex items-center gap-1">
                    <Building2 size={9} /> {task.category}
                </p>
            )}

            {/* Sticky note — prominent, separate from description. */}
            {task.note && (
                <p className="mx-3 mt-2 text-[11px] text-gray-600 italic leading-snug">
                    <span className="font-bold not-italic text-gray-700">Note:</span> {task.note}
                </p>
            )}

            {/* Progress — only renders when > 0, so cards without progress
                set stay clean. The bar fill matches the card tone so it
                doesn't fight the column color. */}
            {Number(task.progress) > 0 && (
                <div className="px-3 mt-2">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Progress</span>
                        <span className="text-[10px] font-bold tabular-nums text-gray-700">{task.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-200/70 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gray-700"
                            style={{ width: `${Math.min(100, Math.max(0, Number(task.progress)))}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Image thumbnail */}
            {firstImage && (
                <div className="mx-3 mt-2 rounded-xl overflow-hidden bg-gray-100 aspect-[16/10]">
                    <img
                        src={firstImage.url}
                        alt={firstImage.original_filename}
                        className="w-full h-full object-cover"
                        draggable={false}
                    />
                </div>
            )}

            {/* Bottom row */}
            <div className="px-3 py-2.5 mt-2 flex items-center justify-between gap-2 border-t border-gray-50">
                <div className="flex items-center gap-2 min-w-0">
                    {due && (
                        <span
                            title={dueExact}
                            className={`inline-flex items-center gap-1 text-[10.5px] font-medium tabular-nums ${isOverdue ? "text-red-600" : "text-gray-500"}`}
                        >
                            <Calendar size={10} />
                            {isOverdue ? "⚠ " : ""}{due}
                        </span>
                    )}
                    {crossDept && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                            From {DEPARTMENT_LABEL[task.department] || task.department}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setCommentsOpen(true);
                        }}
                        className="inline-flex items-center gap-0.5 text-[10px] font-medium text-gray-500 hover:text-gray-900"
                        title="View comments"
                    >
                        <MessageCircle size={10} /> {commentsCount}
                    </button>
                    {attachmentCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-gray-500">
                            <Paperclip size={10} /> {attachmentCount}
                        </span>
                    )}
                    {task.assignee && (
                        <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-[9px] font-bold ring-2 ring-white shadow-sm ${avatarColor(task.assignee.id || task.assignee.name)}`}
                            title={task.assignee.name}
                        >
                            {initials(task.assignee.name)}
                        </span>
                    )}
                </div>
            </div>
        </div>

        <CommentsPopover
            open={commentsOpen}
            onClose={() => setCommentsOpen(false)}
            taskId={task.id}
            taskTitle={task.title}
            onCountChange={(n) => setCommentsCount(n)}
        />
        </>
    );
};

export default TaskCard;
