import { useEffect, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { toast } from "sonner";
import {
    Building2, Lock, MessageCircle, MoreVertical, User,
    ArrowRightLeft, Check, Pencil,
    Flag, Clock, Folder,
} from "lucide-react";
import CommentsPopover from "./CommentsPopover";
import TaskDetailModal from "./TaskDetailModal";
import AttachmentsModal from "./AttachmentsModal";

// Pure presentational task card. Shared between the kanban (where it's
// wrapped by useDraggable) and the list view (where it sits in a grid).
// Lives outside KanbanBoard so it doesn't require a DndContext to mount.

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

// Short date shown next to the flag icon: "02 Nov 2026".
const fmtShortDate = (iso) =>
    iso
        ? new Date(iso).toLocaleDateString("en-NZ", { day: "2-digit", month: "short", year: "numeric" })
        : null;

// Compact "remaining" string for the bottom stats row:
//   "4d left" / "2h left" / "Overdue" / "Done".
const fmtRemaining = (iso, completed) => {
    if (completed) return "Done";
    if (! iso)     return null;
    const target = new Date(iso);
    const now    = new Date();
    const ms     = target - now;
    if (ms < 0) return "Overdue";
    const mins  = Math.floor(ms / 60000);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);
    if (days  >= 1) return `${days}d left`;
    if (hours >= 1) return `${hours}h left`;
    return `${mins}m left`;
};

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
    const remaining = fmtRemaining(task.due_at, task.completed);
    // Surface 2 extra assignee bubbles next to the primary; anything
    // beyond that collapses into the "+N" badge.
    const extraAssigneeCount = Math.max(
        0,
        (Array.isArray(task.additional_assignee_ids) ? task.additional_assignee_ids.length : 0) - 2,
    );

    const priorityChip = PRIORITY_CHIP[task.priority];

    const attachmentsList = task.attachments || [];
    const attachmentCount = attachmentsList.length;

    // Comments badge / popover. `commentsCount` shadows the server-provided
    // count so it bumps live when the viewer adds one without needing a
    // full board refetch.
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [commentsCount, setCommentsCount] = useState(Number(task.comments_count ?? 0));
    const [menuOpen,     setMenuOpen]     = useState(false);
    const [moving,       setMoving]       = useState(false);
    const [detailOpen,   setDetailOpen]   = useState(false);
    const [attachmentsOpen, setAttachmentsOpen] = useState(false);
    const menuRef = useRef(null);

    // Auth context for the cross-dept reason hint.
    const { props: pageProps } = usePage();
    const currentUser = pageProps?.auth?.user;

    // Close menu on outside click or Esc.
    useEffect(() => {
        if (! menuOpen) return;
        const onDown = (e) => {
            if (menuRef.current && ! menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
        document.addEventListener("pointerdown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [menuOpen]);

    const DEPT_LABELS = {
        sales:         "Sales",
        education:     "Education",
        immigration:   "Immigration",
        accommodation: "Accommodation",
        admin:         "Admin",
    };

    const moveToDepartment = (dept) => {
        if (dept === task.department) {
            setMenuOpen(false);
            return;
        }
        const fromMyDept = task.department === currentUser?.role;
        const reason = (! currentUser?.role || currentUser?.role === "admin" || ! fromMyDept)
            ? null
            : prompt(`Why are you moving this task to ${DEPT_LABELS[dept] || dept}?`);
        if (reason === "") return; // user cancelled the prompt explicitly with empty

        setMoving(true);
        router.patch(`/api/tasks/${task.id}`, {
            department: dept,
            ...(reason ? { cross_dept_reason: reason } : {}),
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                toast.success(`Moved to ${DEPT_LABELS[dept] || dept}`);
                setMenuOpen(false);
            },
            onError: () => toast.error("Could not move the task"),
            onFinish: () => setMoving(false),
        });
    };

    return (
        <>
        <div
            ref={setNodeRef}
            {...(dragHandleProps || {})}
            style={style}
            onClick={(e) => {
                // Open the detail modal on whole-card click — every
                // interactive child (kebab, attachments tile, comment
                // count, etc.) calls e.stopPropagation() so they keep
                // their dedicated behaviour.
                onClick?.(e);
                setDetailOpen(true);
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    onClick?.();
                    setDetailOpen(true);
                }
            }}
            tabIndex={0}
            role="button"
            aria-label={`${task.title}, ${task.priority || "normal"} priority, ${task.status || "not started"}. Click to view details.`}
            className={`relative ${tone || "bg-white"} rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-gray-900 ${
                dragHandleProps ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
            } ${isOverlay ? "shadow-2xl rotate-1" : "hover:shadow-md transition-shadow"}`}
        >
            {/* Header — title + kebab. Top-right kebab keeps the move-to-dept
                menu accessible without a separate chip row. */}
            <div className="flex items-start justify-between gap-2 p-4 pb-2">
                <h4 className={`text-[14px] font-bold leading-snug flex-1 min-w-0 ${task.completed ? "line-through text-gray-400" : "text-gray-900"}`}>
                    {task.title}
                </h4>
                <div ref={menuRef} className="flex items-center gap-1 flex-shrink-0 relative">
                    {locked && (
                        <span className="text-gray-400" title="Locked — you can't move tasks from other departments">
                            <Lock size={12} />
                        </span>
                    )}
                    <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMenuOpen((o) => ! o);
                            onMenuClick?.(task);
                        }}
                        className="text-gray-400 hover:text-gray-700 p-0.5 rounded hover:bg-gray-100"
                        aria-label="Task menu"
                        aria-expanded={menuOpen}
                    >
                        <MoreVertical size={14} />
                    </button>

                    {menuOpen && (
                        <div
                            className="absolute right-0 top-7 z-30 bg-white rounded-lg border border-gray-200 shadow-xl w-56"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        >
                            <button
                                type="button"
                                onClick={() => { setDetailOpen(true); setMenuOpen(false); }}
                                className="w-full text-left px-3 py-2 text-[12px] font-semibold text-gray-900 hover:bg-gray-50 inline-flex items-center gap-2"
                            >
                                <Pencil size={11} className="text-gray-500" />
                                Edit task
                            </button>
                            <div className="px-3 py-2 border-y border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400 inline-flex items-center gap-1.5">
                                <ArrowRightLeft size={11} /> Move to department
                            </div>
                            {Object.keys(DEPT_LABELS).map((d) => {
                                const current = d === task.department;
                                return (
                                    <button
                                        key={d}
                                        type="button"
                                        disabled={current || moving}
                                        onClick={() => moveToDepartment(d)}
                                        className={`w-full text-left px-3 py-1.5 text-[12px] flex items-center gap-2 ${
                                            current ? "text-gray-500 cursor-not-allowed bg-gray-50" : "text-gray-700 hover:bg-gray-50"
                                        }`}
                                    >
                                        <Building2 size={11} className="text-gray-400" />
                                        {DEPT_LABELS[d]}
                                        {current && (
                                            <span className="ml-auto inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">
                                                <Check size={9} /> Current
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Lead link — shown when the task is bound to a lead so the
                viewer can see who/what it relates to at a glance. */}
            {isLinked && (
                <div className="px-4 pb-2 flex items-center gap-1 text-[11px] text-gray-500 min-w-0">
                    <User size={11} className="text-gray-400 flex-shrink-0" />
                    <span className="font-mono text-gray-500 flex-shrink-0">#{task.lead.lead_id}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-700 font-medium truncate">{task.lead.name}</span>
                </div>
            )}

            {/* Assignees row — "Asignees :" + overlapping avatar stack +
                "+N" badge when there are more than 3. Mirrors the
                reference card's people line. */}
            <div className="px-4 pb-2 flex items-center gap-2 text-[11px] text-gray-500">
                <span className="font-medium">Asignees :</span>
                {task.assignee || (Array.isArray(task.additional_assignee_ids) && task.additional_assignee_ids.length > 0) ? (
                    <div className="flex -space-x-1.5">
                        {task.assignee && (
                            <span
                                title={task.assignee.name}
                                className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[8.5px] font-bold ring-2 ring-white ${avatarColor(task.assignee.id || task.assignee.name)}`}
                            >
                                {initials(task.assignee.name)}
                            </span>
                        )}
                        {(task.additional_assignee_ids || []).slice(0, 2).map((id) => (
                            <span
                                key={`extra-${id}`}
                                title="Additional assignee"
                                className={`inline-block w-5 h-5 rounded-full ring-2 ring-white ${avatarColor(`extra-${id}`)}`}
                            />
                        ))}
                        {extraAssigneeCount > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[24px] h-5 px-1 rounded-full bg-gray-100 text-gray-600 text-[9px] font-bold ring-2 ring-white">
                                {extraAssigneeCount}+
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="italic text-gray-400">Unassigned</span>
                )}
            </div>

            {/* Flag + due date + priority chip row. Flag pulses red for
                overdue, otherwise stays muted. */}
            <div className="px-4 pb-2 flex items-center gap-2">
                <span
                    title={dueExact}
                    className={`inline-flex items-center gap-1.5 text-[11.5px] tabular-nums ${isOverdue ? "text-red-600 font-semibold" : "text-gray-600"}`}
                >
                    <Flag size={12} className={isOverdue ? "text-red-500" : "text-gray-400"} />
                    {task.due_at ? fmtShortDate(task.due_at) : "No due date"}
                </span>
                {priorityChip && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${priorityChip}`}>
                        {task.priority}
                    </span>
                )}
                {crossDept && (
                    <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                        From {DEPARTMENT_LABEL[task.department] || task.department}
                    </span>
                )}
            </div>

            {/* Bottom stats row — folder/comments/remaining-time stats
                in a clean evenly-spaced layout. */}
            <div className="px-4 pt-2.5 pb-3.5 mt-0.5 flex items-center justify-between gap-2 border-t border-gray-50 text-[11.5px] text-gray-500">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (attachmentCount > 0) setAttachmentsOpen(true);
                        }}
                        className="inline-flex items-center gap-1 hover:text-gray-900 disabled:cursor-default"
                        title={attachmentCount > 0 ? "View attachments" : "No attachments"}
                        disabled={attachmentCount === 0}
                    >
                        <Folder size={12} className="text-gray-400" />
                        <span className="tabular-nums font-semibold">{attachmentCount}</span>
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setCommentsOpen(true); }}
                        className="inline-flex items-center gap-1 hover:text-gray-900"
                        title="View comments"
                    >
                        <MessageCircle size={12} className="text-gray-400" />
                        <span className="tabular-nums font-semibold">{commentsCount}</span>
                    </button>
                </div>
                {remaining && (
                    <span
                        title={dueExact}
                        className={`inline-flex items-center gap-1 ${remaining === "Overdue" ? "text-red-600 font-semibold" : "text-gray-500"}`}
                    >
                        <Clock size={12} className={remaining === "Overdue" ? "text-red-500" : "text-gray-400"} />
                        {remaining === "Overdue" ? "Overdue" : `Remaining ${remaining.replace(" left", "")}`}
                    </span>
                )}
            </div>
        </div>

        <CommentsPopover
            open={commentsOpen}
            onClose={() => setCommentsOpen(false)}
            taskId={task.id}
            taskTitle={task.title}
            onCountChange={(n) => setCommentsCount(n)}
        />

        {detailOpen && (
            <TaskDetailModal
                task={task}
                onClose={() => setDetailOpen(false)}
            />
        )}

        <AttachmentsModal
            open={attachmentsOpen}
            onClose={() => setAttachmentsOpen(false)}
            task={task}
        />
        </>
    );
};

export default TaskCard;
