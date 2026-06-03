import { useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { ChevronDown, Filter, Plus, Search } from "lucide-react";
import NewTaskModal from "./NewTaskModal";
import KanbanBoard from "./KanbanBoard";

// Single Task Board UI shared across every staff portal. The `department`
// prop scopes labels, default filters, and category lists. Data still comes
// from each portal's controller in the same `today/overdue/this_week/
// undated/recently_done` buckets the existing Sales/Education tasks() method
// returns — see App\Http\Controllers\Portal\*Controller::tasks().
//
// Filter dropdowns that depend on fields the LeadTask model doesn't carry
// yet (task type, category, tags, created-by, cross-dept origin) render but
// don't filter against backend data. The next two prompts (modal + kanban)
// will introduce that infrastructure; the UI is structured so wiring it
// later is a one-line swap from "filter only the data we have" to "send
// query params through router.get".

const DEPARTMENT_LABEL = {
    sales:         "Sales",
    education:     "Education",
    immigration:   "Immigration",
    accommodation: "Accommodation",
    admin:         "Admin",
};

const PERIOD_LABEL = {
    all:     "All tasks",
    daily:   "Daily tasks",
    weekly:  "Weekly tasks",
    monthly: "Monthly tasks",
};

// Department/personal task categories per spec. Visible only when Task type
// filter is "Department/personal only". Empty list → filter not shown.
const CATEGORIES_BY_DEPT = {
    sales: [
        "Pipeline review", "Reporting", "Marketing coordination",
        "Lead source maintenance", "Email template updates", "Training",
        "Department meeting prep", "Internal process improvement", "Other",
    ],
    education: [
        "Institution relationship management", "Program catalog maintenance",
        "Fee guide updates", "Intake planning", "Reporting",
        "Counselor training", "Department meeting prep", "Other",
    ],
    immigration: [
        "IAA compliance and renewal", "INZ form updates",
        "Visa type library updates", "Adviser training", "Reporting",
        "Department meeting prep", "Audit prep", "Other",
    ],
    accommodation: [
        "Template updates", "Task library maintenance", "Reporting",
        "Coordinator training", "Vendor management", "Other",
    ],
    admin: [
        "User and role management", "System configuration",
        "Reporting consolidation", "Branding updates",
        "Email provider management", "Vendor management",
        "Compliance audits", "Other",
    ],
};

export default function TaskBoardPage({
    department = "sales",
    today = [],
    overdue = [],
    this_week = [],
    recently_done = [],
    undated = [], // still received from existing controllers; merged into All Upcoming
    all_tasks = [], // full set used by the kanban view — supersedes the date buckets when present
    scope = "mine",
    portal,
    staffOptions = [],
}) {
    const isAdmin = department === "admin";
    const portalKey = portal || department;
    const portalBase = isAdmin ? "/admin" : `/portal/${portalKey}`;

    const title    = isAdmin ? "All Tasks" : "Task Board";
    const subtitle = "All your tasks in one place — record-linked work and department tasks.";

    // ── Filter state ────────────────────────────────────────────────────
    // Most of these don't yet have backing fields on LeadTask; they're
    // wired into the UI now so the next prompt can connect them to query
    // params without re-architecting the page.
    const [taskType,    setTaskType]    = useState("all");        // all | linked | dept
    const [status,      setStatus]      = useState("active");     // active | completed | all
    const [priority,    setPriority]    = useState("all");
    const [category,    setCategory]    = useState("all");
    const [createdBy,   setCreatedBy]   = useState(isAdmin ? "all" : "all");
    const [tagsQuery,   setTagsQuery]   = useState("");
    const [deptFilter,  setDeptFilter]  = useState("all");        // admin-only
    const [searchQuery, setSearchQuery] = useState("");           // title + description substring
    const [period,      setPeriod]      = useState("all");        // all | daily | weekly | monthly — date-scope filter

    const categoryOptions = CATEGORIES_BY_DEPT[department] || [];

    // ── Buckets + KPI counts ────────────────────────────────────────────
    // Filters that CAN run against existing fields (priority, status,
    // completed). Everything else is a no-op until the schema grows.
    const filterRows = (rows) =>
        rows.filter((r) => {
            if (priority !== "all" && r.priority !== priority) return false;
            if (status === "active"    && r.completed)        return false;
            if (status === "completed" && ! r.completed)      return false;
            if (taskType === "linked" && ! r.lead)            return false;
            if (taskType === "dept"   &&   r.lead)            return false;
            if (tagsQuery.trim() && Array.isArray(r.tags)) {
                const q = tagsQuery.trim().toLowerCase();
                if (! r.tags.some((t) => String(t).toLowerCase().includes(q))) return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.trim().toLowerCase();
                const hay = `${r.title || ""} ${r.description || ""}`.toLowerCase();
                if (! hay.includes(q)) return false;
            }
            return true;
        });

    // Kanban needs the union of every bucket (it groups by status, not due
    // date) — dedupe by id since the same row can appear in multiple
    // server-side query buckets. The kanban view explicitly skips the
    // Status filter because the columns ARE the status — applying both
    // would empty the Completed column whenever the row filter is "Active".
    const kanbanTasks = useMemo(() => {
        // Prefer the controller-provided full set; fall back to the union of
        // legacy date buckets so older renders still work.
        const source = all_tasks.length > 0
            ? all_tasks
            : [...overdue, ...today, ...this_week, ...undated, ...recently_done];

        const seen = new Set();
        const all = [];
        for (const row of source) {
            if (seen.has(row.id)) continue;
            seen.add(row.id);
            all.push(row);
        }

        // Period filter — narrows by due-date scope. Tasks with no due_at
        // are kept for "all" only (they can't be scoped to a window).
        const now = new Date();
        const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay   = new Date(now); endOfDay.setHours(23, 59, 59, 999);
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfDay.getDate() - ((startOfDay.getDay() + 6) % 7)); // Monday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); endOfWeek.setHours(23, 59, 59, 999);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const inPeriod = (iso) => {
            if (period === "all") return true;
            if (! iso) return false;
            const d = new Date(iso);
            if (period === "daily")   return d >= startOfDay   && d <= endOfDay;
            if (period === "weekly")  return d >= startOfWeek  && d <= endOfWeek;
            if (period === "monthly") return d >= startOfMonth && d <= endOfMonth;
            return true;
        };

        return all.filter((r) => {
            if (! inPeriod(r.due_at)) return false;
            if (priority !== "all" && r.priority !== priority) return false;
            if (taskType === "linked" && ! r.lead) return false;
            if (taskType === "dept"   &&   r.lead) return false;
            if (tagsQuery.trim() && Array.isArray(r.tags)) {
                const q = tagsQuery.trim().toLowerCase();
                if (! r.tags.some((t) => String(t).toLowerCase().includes(q))) return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.trim().toLowerCase();
                const hay = `${r.title || ""} ${r.description || ""}`.toLowerCase();
                if (! hay.includes(q)) return false;
            }
            return true;
        });
    }, [all_tasks, overdue, today, this_week, undated, recently_done, priority, taskType, tagsQuery, searchQuery, period]);

    const resetFilters = () => {
        setTaskType("all");
        setStatus("all");
        setPriority("all");
        setCategory("all");
        setCreatedBy("all");
        setTagsQuery("");
        setDeptFilter("all");
        setSearchQuery("");
    };

    const [newTaskOpen, setNewTaskOpen] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const setScope = (next) => {
        router.get(`${portalBase}/tasks`, { scope: next }, { preserveScroll: true });
    };

    const openNewTaskModal = () => setNewTaskOpen(true);

    const activeFilterCount =
        (taskType !== "all" ? 1 : 0)
        + (status !== "active" ? 1 : 0)
        + (priority !== "all" ? 1 : 0)
        + (category !== "all" ? 1 : 0)
        + (createdBy !== "all" ? 1 : 0)
        + (tagsQuery.trim() ? 1 : 0)
        + (isAdmin && deptFilter !== "all" ? 1 : 0);

    return (
        <div className="pb-12">
            <Head title={`${title} — ${DEPARTMENT_LABEL[department] || department}`} />

            {/* Compact toolbar — title left, controls right. Filter row is
                collapsed by default; the Filters button toggles it. KPI
                tiles + subtitle removed so the kanban dominates the page. */}
            <div className="px-2 sm:px-4 pt-1 pb-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    {/* Left cluster — date + period dropdown */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="min-w-0">
                            <p className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight leading-tight">
                                {new Date().toLocaleDateString("en-NZ", { month: "long" })}
                            </p>
                            <p className="text-[11px] text-gray-500">
                                Today is {new Date().toLocaleDateString("en-NZ", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
                            </p>
                        </div>
                        {/* Board mode — bold label + dropdown current value
                            + chevron, styled as a single button-pill. */}
                        <div className="relative inline-flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2 hover:border-gray-300 transition-colors">
                            <span className="text-[14px] font-bold text-gray-900">{title}</span>
                            <span className="text-gray-300">—</span>
                            <span className="text-[13px] text-gray-500">{PERIOD_LABEL[period]}</span>
                            <ChevronDown size={14} className="text-gray-400" />
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                aria-label="Period filter"
                            >
                                <option value="all">All tasks</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Staff working on this board — decorative for now;
                            future click handler can scope to that staff. */}
                        <AvatarStack users={staffOptions} max={4} />

                        {/* Inline search */}
                        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-2.5 py-1.5 min-w-[200px]">
                            <Search size={13} className="text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search tasks"
                                className="flex-1 outline-none text-[13px] placeholder:text-gray-400 bg-transparent"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="text-gray-400 hover:text-gray-700 text-[10px] font-bold uppercase tracking-wider"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Filters toggle */}
                        <button
                            type="button"
                            onClick={() => setFiltersOpen((x) => !x)}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-bold uppercase tracking-wider transition-colors ${
                                filtersOpen || activeFilterCount > 0
                                    ? "bg-gray-900 text-white border-gray-900"
                                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                            }`}
                            aria-expanded={filtersOpen}
                        >
                            <Filter size={13} />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-white/20 text-[9px] font-bold tabular-nums">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {/* Assigned-to-me / All staff scope */}
                        <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-0.5">
                            <button
                                type="button"
                                onClick={() => setScope("mine")}
                                className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                    scope === "mine" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                Mine
                            </button>
                            <button
                                type="button"
                                onClick={() => setScope("all")}
                                className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                    scope === "all" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                All
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={openNewTaskModal}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-[12px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                        >
                            <Plus size={13} /> New Task
                        </button>
                    </div>
                </div>

                {/* Collapsible filter row */}
                {filtersOpen && (
                    <div className="mt-3 bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-wrap items-center gap-2">
                        <FilterSelect label="Task type" value={taskType} onChange={setTaskType} options={[
                            ["all",    "All"],
                            ["linked", "Record-linked only"],
                            ["dept",   "Department/personal only"],
                        ]} />
                        <FilterSelect label="Status" value={status} onChange={setStatus} options={[
                            ["active",    "Active"],
                            ["completed", "Completed"],
                            ["all",       "All"],
                        ]} />
                        <FilterSelect label="Priority" value={priority} onChange={setPriority} options={[
                            ["all", "All"], ["low", "Low"], ["normal", "Normal"], ["high", "High"], ["urgent", "Urgent"],
                        ]} />
                        {taskType === "dept" && categoryOptions.length > 0 && (
                            <FilterSelect label="Category" value={category} onChange={setCategory} options={[
                                ["all", "All categories"],
                                ...categoryOptions.map((c) => [c, c]),
                            ]} />
                        )}
                        <FilterSelect label="Created by" value={createdBy} onChange={setCreatedBy} options={[
                            ["all",    "All"],
                            ["me",     "Me"],
                            ["system", "System"],
                            ...staffOptions.map((s) => [`u:${s.id}`, s.name]),
                        ]} />
                        <label className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-gray-200 bg-white">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Tags</span>
                            <input
                                type="text"
                                value={tagsQuery}
                                onChange={(e) => setTagsQuery(e.target.value)}
                                placeholder="add tag…"
                                className="w-24 text-[11px] outline-none placeholder:text-gray-300"
                            />
                        </label>
                        {isAdmin && (
                            <FilterSelect label="Department" value={deptFilter} onChange={setDeptFilter} options={[
                                ["all", "All departments"],
                                ["sales", "Sales"],
                                ["education", "Education"],
                                ["immigration", "Immigration"],
                                ["accommodation", "Accommodation"],
                                ["admin", "Admin"],
                            ]} />
                        )}
                        {activeFilterCount > 0 && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="ml-auto text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900"
                            >
                                Clear all
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* The kanban is the entire board. */}
            <KanbanBoard
                tasks={kanbanTasks}
                department={department}
                portalBase={portalBase}
                onNewTask={openNewTaskModal}
                onClearFilters={resetFilters}
            />

            {/* Inertia's POST → back() in TaskController re-renders this page
                with fresh task buckets automatically; no explicit reload needed. */}
            <NewTaskModal
                open={newTaskOpen}
                onClose={() => setNewTaskOpen(false)}
                department={department}
                staffOptions={staffOptions}
            />
        </div>
    );
}

function FilterSelect({ label, value, onChange, options }) {
    return (
        <label className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-gray-200 bg-white">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="text-[11px] bg-transparent outline-none font-medium text-gray-700 cursor-pointer"
            >
                {options.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                ))}
            </select>
        </label>
    );
}

// KpiTile + TaskList + TaskRow removed — the kanban board IS the view now.

// ─── Avatar stack ───────────────────────────────────────────────────────
// Decorative for now — shows staff visible to this board. Stable color
// per user via a small palette so the same person reads the same on every
// render. Future: clicking an avatar can scope tasks to that assignee.

const AVATAR_PALETTE = [
    "bg-blue-500", "bg-pink-500", "bg-orange-500", "bg-teal-500",
    "bg-purple-500", "bg-amber-500", "bg-emerald-500", "bg-rose-500",
    "bg-indigo-500", "bg-fuchsia-500",
];

const avatarColor = (key) => {
    const str = String(key || "");
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
    return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
};

const initialsOf = (name = "") =>
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();

function AvatarStack({ users = [], max = 4 }) {
    if (! users || users.length === 0) return null;
    const visible = users.slice(0, max);
    const overflow = users.length - visible.length;
    return (
        <div className="flex items-center -space-x-2">
            {visible.map((u) => (
                <span
                    key={u.id}
                    title={u.name}
                    className={`w-8 h-8 rounded-full text-white text-[10px] font-bold inline-flex items-center justify-center ring-2 ring-white shadow-sm ${avatarColor(u.id || u.name)}`}
                >
                    {initialsOf(u.name)}
                </span>
            ))}
            {overflow > 0 && (
                <span
                    title={`${overflow} more`}
                    className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 text-[10px] font-bold inline-flex items-center justify-center ring-2 ring-white shadow-sm"
                >
                    +{overflow}
                </span>
            )}
        </div>
    );
}
