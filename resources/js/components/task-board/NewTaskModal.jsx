import { useEffect, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { toast } from "sonner";
import {
    X, User, Building2, ChevronLeft, ChevronDown, AlertTriangle, Search, Tag, RotateCw,
    Plus, Paperclip, FileText, Film, FileImage, Music,
} from "lucide-react";
import AssigneeMultiPicker from "./AssigneeMultiPicker";
import LeadMultiPicker from "./LeadMultiPicker";

// New Task modal — used by every portal Task Board's "+ New Task" button.
// The modal is fully department-aware via the `department` prop. See
// docs/task-board-spec.md (and the prompt that introduced this component)
// for the full UX spec. Persistence:
//   POST /api/tasks → App\Http\Controllers\TaskController@store
//   GET  /api/tasks/related-records → autocomplete feed
//
// Cross-department guard is handled in TWO places: the modal opens a small
// confirmation modal client-side when the assignee is from another dept,
// AND the server re-validates the reason so the UI can't be bypassed.

const DEPARTMENT_LABEL = {
    sales: "Sales",
    education: "Education",
    immigration: "Immigration",
    accommodation: "Accommodation",
    finance: "Finance",
    admin: "Admin",
};

// Mirror of CATEGORIES_BY_DEPT in TaskBoardPage. Kept here on purpose:
// the modal is self-contained and might mount on lead detail pages too.
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
    // Finance categorises by which department's work the task relates to,
    // plus its own billing/accounting buckets. Mirrors CATEGORIES_BY_DEPT
    // in TaskBoardPage — keep the two in sync.
    finance: [
        "Education", "English", "Immigration", "Accommodation", "Sales",
        "Invoicing", "Receivables", "Payments", "Reconciliation",
        "Reporting", "Department meeting prep", "Other",
    ],
};

const TYPE_OPTIONS = [
    ["call", "Call"],
    ["email", "Email"],
    ["meeting", "Meeting"],
    ["document", "Document"],
    ["follow_up", "Follow-up"],
    ["internal", "Internal"],
    ["other", "Other"],
];

const ALL_DEPARTMENTS = ["sales", "education", "immigration", "accommodation", "finance", "admin"];

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function NewTaskModal({
    open,
    onClose,
    department,         // current portal's department
    staffOptions = [],  // [{id, name, role?}]
    lockedRecord = null, // {id, lead_id, name, record_type} — when opened from a record detail page
    onCreated,          // optional callback after successful create
}) {
    const isAdminPortal = department === "admin";
    const currentUser   = usePage().props?.auth?.user || null;

    // Two-step wizard. If lockedRecord is supplied (opened from a record
    // detail page), skip Step 1 and go straight to record-linked Step 2.
    const initialStep = lockedRecord ? 2 : 1;
    const initialKind = lockedRecord ? "linked" : null;

    const [step, setStep] = useState(initialStep);
    const [kind, setKind] = useState(initialKind); // 'linked' | 'dept'
    const [submitting, setSubmitting] = useState(false);
    const [topError, setTopError] = useState(null);
    const [errors, setErrors] = useState({});

    // Step 2 form state
    const [taskDepartment, setTaskDepartment] = useState(isAdminPortal ? "sales" : department);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [note, setNote] = useState("");
    const [type, setType] = useState("call");
    const [priority, setPriority] = useState("normal");
    const [progress, setProgress] = useState(0);
    const [dueDate, setDueDate] = useState(todayIso());
    const [dueTime, setDueTime] = useState("17:00");
    // Multi-assignee — first id is treated as the primary on the server.
    const [assigneeIds, setAssigneeIds] = useState([]);
    // Default ON so users see staff from every department — they can still
    // narrow back to their own dept with the toggle.
    const [showOtherDepts, setShowOtherDepts] = useState(true);
    // Multi-lead picker. lockedRecord (when set) seeds the list with one
    // pre-picked record from the lead-detail "Add Task" entry point.
    const [relatedRecords, setRelatedRecords] = useState(lockedRecord ? [lockedRecord] : []);
    const [category, setCategory] = useState("");
    // When category === "Other", we collect a free-form custom name and
    // send that as the category on submit.
    const [categoryOther, setCategoryOther] = useState("");
    const [tagsInput, setTagsInput] = useState("");
    const [recurring, setRecurring] = useState(false);
    const [recurFreq, setRecurFreq] = useState("weekly");
    const [recurDow, setRecurDow] = useState("Monday");
    const [recurDom, setRecurDom] = useState(1);
    const [recurTime, setRecurTime] = useState("09:00");
    const [recurEnd, setRecurEnd] = useState("never"); // never | count | date
    const [recurCount, setRecurCount] = useState(10);
    const [recurUntil, setRecurUntil] = useState("");
    const [files, setFiles] = useState([]); // File[]
    const [filePreviews, setFilePreviews] = useState([]); // matching object URLs

    // Reset when the modal is closed-and-reopened to avoid stale state.
    useEffect(() => {
        if (!open) return;
        setStep(initialStep);
        setKind(initialKind);
        setSubmitting(false);
        setTopError(null);
        setErrors({});
        setTaskDepartment(isAdminPortal ? "sales" : department);
        setTitle("");
        setDescription("");
        setNote("");
        setType("call");
        setPriority("normal");
        setProgress(0);
        setDueDate(todayIso());
        setDueTime("17:00");
        setAssigneeIds([]);
        setShowOtherDepts(true);
        setRelatedRecords(lockedRecord ? [lockedRecord] : []);
        setCategory("");
        setCategoryOther("");
        setTagsInput("");
        setRecurring(false);
        setRecurFreq("weekly");
        setRecurDow("Monday");
        setRecurDom(1);
        setRecurTime("09:00");
        setRecurEnd("never");
        setRecurCount(10);
        setRecurUntil("");
        // Revoke any leftover object URLs before clearing.
        setFilePreviews((prev) => { prev.forEach((u) => u && URL.revokeObjectURL(u)); return []; });
        setFiles([]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Object URLs are cheap but leak if not revoked — clean up on unmount.
    useEffect(() => () => {
        filePreviews.forEach((u) => u && URL.revokeObjectURL(u));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Any file type — images, videos, PDFs, docs, audio, archives, …
    // Object URLs are only created for image previews; other types render
    // as a generic file card so we don't waste memory on big videos.
    const addFiles = (selected) => {
        const list = Array.from(selected || []);
        if (list.length === 0) return;
        const newPreviews = list.map((f) =>
            f.type.startsWith("image/") ? URL.createObjectURL(f) : null
        );
        setFiles((prev) => [...prev, ...list].slice(0, 8));
        setFilePreviews((prev) => [...prev, ...newPreviews].slice(0, 8));
    };

    const removeFile = (idx) => {
        if (filePreviews[idx]) URL.revokeObjectURL(filePreviews[idx]);
        setFiles((prev) => prev.filter((_, i) => i !== idx));
        setFilePreviews((prev) => prev.filter((_, i) => i !== idx));
    };

    const categoryOptions = CATEGORIES_BY_DEPT[isAdminPortal ? taskDepartment : department] || [];

    // ── Assignee list — filtered by department unless toggled ───────────
    // useMemo must run on every render (no early return above it) so the
    // hook count stays stable when `open` flips from false → true.
    const visibleStaff = useMemo(() => {
        if (showOtherDepts || isAdminPortal) return staffOptions;
        return staffOptions.filter((s) => !s.role || s.role === department || s.role === "admin");
    }, [staffOptions, showOtherDepts, department, isAdminPortal]);

    if (!open) return null;

    const effectiveDept = isAdminPortal ? taskDepartment : department;

    // ── Submit ──────────────────────────────────────────────────────────
    const payload = () => {
        const dueAt = `${dueDate} ${dueTime || "09:00"}:00`;
        const tags = tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

        const recurrence_config = recurring
            ? {
                frequency: recurFreq,
                day_of_week: recurFreq === "weekly" ? recurDow : null,
                day_of_month: recurFreq === "monthly" ? recurDom : null,
                time: recurTime,
                end: recurEnd === "count" ? { type: "count", value: recurCount }
                    : recurEnd === "date" ? { type: "date", value: recurUntil }
                        : { type: "never" },
            }
            : null;

        // Resolve category: when "Other" is picked we send the custom text
        // (if any) so the saved category is human-readable; if they leave
        // it blank we still send "Other" as-is.
        const resolvedCategory = kind === "dept"
            ? (category === "Other" && categoryOther.trim() ? categoryOther.trim() : category)
            : null;

        return {
            task_type: kind,
            lead_ids: kind === "linked" ? relatedRecords.map((r) => r.id) : null,
            title,
            description: description || null,
            note: note || null,
            type,
            priority,
            progress,
            due_at: dueAt,
            assignee_ids: assigneeIds.length ? assigneeIds : null,
            department: effectiveDept,
            category: resolvedCategory,
            tags: tags.length ? tags : null,
            recurrence_config,
            // Files trigger multipart submission via forceFormData below.
            // Empty array is harmless — Inertia just omits the key.
            attachments: files,
        };
    };

    const doSubmit = () => {
        setSubmitting(true);
        setTopError(null);
        setErrors({});

        router.post("/api/tasks", payload(), {
            // Files in the payload → multipart/form-data. Inertia handles the
            // serialization of nested objects (tags[], recurrence_config[…])
            // automatically when this flag is on.
            forceFormData: files.length > 0,
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                toast.success("Task created");
                onCreated?.();
                onClose?.();
            },
            onError: (e) => {
                setErrors(e || {});
                const first = e && Object.values(e)[0];
                setTopError(first || "Could not create task. Check the fields below.");
            },
            onFinish: () => setSubmitting(false),
        });
    };

    const handleCreate = () => {
        doSubmit();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-6">
            {/* Width set via inline style so it doesn't depend on Tailwind
                picking up a new max-w-* class on rebuild. ~1100px on
                desktop, full-width on mobile. */}
            <div
                className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col"
                style={{ width: '100%', maxWidth: 'min(1100px, 95vw)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 min-w-0">
                        {step === 2 && !lockedRecord && (
                            <button
                                type="button"
                                onClick={() => { setStep(1); setKind(null); }}
                                className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900"
                            >
                                <ChevronLeft size={12} /> Change
                            </button>
                        )}
                        <h2 className="text-lg font-bold text-gray-900 truncate">
                            {step === 1 ? "New Task" : kind === "linked" ? "About a specific record" : "Department / personal task"}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-5">
                    {topError && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                            <span>{topError}</span>
                        </div>
                    )}

                    {step === 1 ? (
                        <StepOne kind={kind} setKind={setKind} />
                    ) : (
                        <StepTwo
                            kind={kind}
                            isAdminPortal={isAdminPortal}
                            department={department}
                            taskDepartment={taskDepartment}
                            setTaskDepartment={setTaskDepartment}
                            title={title} setTitle={setTitle}
                            description={description} setDescription={setDescription}
                            note={note} setNote={setNote}
                            type={type} setType={setType}
                            priority={priority} setPriority={setPriority}
                            progress={progress} setProgress={setProgress}
                            dueDate={dueDate} setDueDate={setDueDate}
                            dueTime={dueTime} setDueTime={setDueTime}
                            assigneeIds={assigneeIds} setAssigneeIds={setAssigneeIds}
                            currentUser={currentUser}
                            visibleStaff={visibleStaff}
                            staffOptions={staffOptions}
                            showOtherDepts={showOtherDepts} setShowOtherDepts={setShowOtherDepts}
                            relatedRecords={relatedRecords} setRelatedRecords={setRelatedRecords}
                            lockedRecord={lockedRecord}
                            category={category} setCategory={setCategory}
                            categoryOther={categoryOther} setCategoryOther={setCategoryOther}
                            categoryOptions={categoryOptions}
                            tagsInput={tagsInput} setTagsInput={setTagsInput}
                            files={files}
                            filePreviews={filePreviews}
                            addFiles={addFiles}
                            removeFile={removeFile}
                            recurring={recurring} setRecurring={setRecurring}
                            recurFreq={recurFreq} setRecurFreq={setRecurFreq}
                            recurDow={recurDow} setRecurDow={setRecurDow}
                            recurDom={recurDom} setRecurDom={setRecurDom}
                            recurTime={recurTime} setRecurTime={setRecurTime}
                            recurEnd={recurEnd} setRecurEnd={setRecurEnd}
                            recurCount={recurCount} setRecurCount={setRecurCount}
                            recurUntil={recurUntil} setRecurUntil={setRecurUntil}
                            errors={errors}
                            effectiveDept={effectiveDept}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-[12px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    {step === 1 ? (
                        <button
                            type="button"
                            onClick={() => kind && setStep(2)}
                            disabled={!kind}
                            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-[12px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Continue →
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleCreate}
                            disabled={submitting}
                            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-[12px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-40"
                        >
                            {submitting ? "Creating…" : "Create task"}
                        </button>
                    )}
                </div>
            </div>

        </div>
    );
}

// ─── Step 1 ─────────────────────────────────────────────────────────────

function StepOne({ kind, setKind }) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700">What kind of task?</h3>
            <RadioCard
                checked={kind === "linked"}
                onChange={() => setKind("linked")}
                icon={<User size={18} />}
                title="About a specific lead / student / case / client"
                body="Link this task to a record so it appears in that record's activity timeline."
            />
            <RadioCard
                checked={kind === "dept"}
                onChange={() => setKind("dept")}
                icon={<Building2 size={18} />}
                title="Department or personal task"
                body="Work that's not tied to a specific person — planning, admin, internal projects, etc."
            />
        </div>
    );
}

function RadioCard({ checked, onChange, icon, title, body }) {
    return (
        <button
            type="button"
            onClick={onChange}
            className={`w-full text-left rounded-xl border-2 p-4 flex items-start gap-3 transition-all ${checked ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
        >
            <span className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${checked ? "border-gray-900" : "border-gray-300"
                }`}>
                {checked && <span className="w-2 h-2 rounded-full bg-gray-900" />}
            </span>
            <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0">{icon}</div>
            <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{body}</p>
            </div>
        </button>
    );
}

// ─── Step 2 ─────────────────────────────────────────────────────────────

function StepTwo(props) {
    const {
        kind, isAdminPortal, department, taskDepartment, setTaskDepartment,
        title, setTitle, description, setDescription,
        note, setNote,
        type, setType, priority, setPriority,
        progress, setProgress,
        dueDate, setDueDate, dueTime, setDueTime,
        assigneeIds, setAssigneeIds, currentUser,
        visibleStaff, staffOptions,
        showOtherDepts, setShowOtherDepts,
        relatedRecords, setRelatedRecords, lockedRecord,
        category, setCategory,
        categoryOther, setCategoryOther,
        categoryOptions,
        tagsInput, setTagsInput,
        files, filePreviews, addFiles, removeFile,
        recurring, setRecurring,
        recurFreq, setRecurFreq, recurDow, setRecurDow, recurDom, setRecurDom,
        recurTime, setRecurTime, recurEnd, setRecurEnd,
        recurCount, setRecurCount, recurUntil, setRecurUntil,
        errors, effectiveDept,
    } = props;

    return (
        <div className="space-y-6">
            {/* Top sections sit in a 2-column grid so the form is wider
                instead of taller — less scrolling. Drops back to a single
                column below the lg breakpoint. */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
            {/* ── Basics ──────────────────────────────────────────────── */}
            <Section title="Basics" subtitle="What needs doing and why.">
                {isAdminPortal && (
                    <FormRow label="Department this task belongs to" required error={errors.department}>
                        <select
                            value={taskDepartment}
                            onChange={(e) => setTaskDepartment(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                        >
                            {ALL_DEPARTMENTS.map((d) => (
                                <option key={d} value={d}>{DEPARTMENT_LABEL[d]}</option>
                            ))}
                        </select>
                    </FormRow>
                )}

                <FormRow label="Title" required error={errors.title}>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={200}
                        placeholder="What needs doing?"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    />
                    <p className="mt-1 text-[10px] text-gray-400">{title.length}/200</p>
                </FormRow>

                <FormRow label="Description" error={errors.description}>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Optional context, links, instructions…"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    />
                </FormRow>

                <FormRow label="Note" hint='Short reminder shown on the card (e.g. "Has to finish before weekend")' error={errors.note}>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        maxLength={500}
                        placeholder="add a quick note…"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    />
                </FormRow>
            </Section>

            {/* ── Classification ──────────────────────────────────────── */}
            <Section title="Classification" subtitle="How this task is grouped and tagged.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormRow label="Type" error={errors.type}>
                        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
                            {TYPE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </FormRow>
                    <FormRow label="Priority" error={errors.priority}>
                        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
                            <option value="low">Low</option>
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </FormRow>
                </div>

                {kind === "linked" ? (
                    <FormRow
                        label="Related leads"
                        required
                        hint="Pick one or many — searches the leads database."
                        error={errors.lead_ids || errors["lead_ids.0"] || errors.lead_id}
                    >
                        <LeadMultiPicker
                            value={relatedRecords}
                            onChange={setRelatedRecords}
                        />
                    </FormRow>
                ) : (
                    <FormRow label="Category" required error={errors.category}>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                        >
                            <option value="">Pick a category…</option>
                            {categoryOptions.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        {category === "Other" && (
                            <input
                                type="text"
                                value={categoryOther}
                                onChange={(e) => setCategoryOther(e.target.value)}
                                maxLength={100}
                                placeholder="Type your custom category…"
                                className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                                autoFocus
                            />
                        )}
                    </FormRow>
                )}

                <FormRow label="Tags" hint="Comma-separated (e.g. urgent, q3-launch)">
                    <div className="relative">
                        <Tag size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            placeholder="add tags…"
                            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm"
                        />
                    </div>
                </FormRow>
            </Section>

            {/* ── Schedule & progress ─────────────────────────────────── */}
            <Section title="Schedule & progress" subtitle="When it's due and how far along you are.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormRow label="Due date" required error={errors.due_at}>
                        <input
                            type="date"
                            value={dueDate}
                            min={todayIso()}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                        />
                    </FormRow>
                    <FormRow label="Due time">
                        <input
                            type="time"
                            value={dueTime}
                            onChange={(e) => setDueTime(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                        />
                    </FormRow>
                </div>

                <FormRow label={`Progress — ${progress}%`} error={errors.progress}>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={progress}
                        onChange={(e) => setProgress(Number(e.target.value))}
                        className="w-full accent-gray-900"
                    />
                </FormRow>
            </Section>

            {/* ── People ─────────────────────────────────────────────── */}
            <Section title="People" subtitle="Who's responsible.">
                <FormRow
                    label="Assigned to"
                    hint="Pick myself, other staff, or a mix. Leave empty to default to me."
                    error={errors.assignee_ids || errors["assignee_ids.0"] || errors.assignee_id}
                >
                    <AssigneeMultiPicker
                        value={assigneeIds}
                        onChange={setAssigneeIds}
                        visibleStaff={visibleStaff}
                        allStaff={staffOptions}
                        currentUser={currentUser}
                    />
                    {! isAdminPortal && (
                        <label className="mt-2 inline-flex items-center gap-2 text-[11px] text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showOtherDepts}
                                onChange={(e) => setShowOtherDepts(e.target.checked)}
                                className="rounded"
                            />
                            Show staff from every department
                        </label>
                    )}
                </FormRow>
            </Section>
            </div>

            {/* ── Attachments ────────────────────────────────────────── */}
            <Section
                title="Attachments"
                subtitle="Any file — images, video, PDF, docs. Up to 20 MB each, max 8 files."
            >
                <FormRow
                    label={`Files${files.length ? ` · ${files.length}/8` : ""}`}
                    error={errors["attachments.0"] || errors.attachments}
                >
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {files.map((file, idx) => (
                            <FilePreviewCard
                                key={idx}
                                file={file}
                                previewUrl={filePreviews[idx]}
                                onRemove={() => removeFile(idx)}
                            />
                        ))}
                        {files.length < 8 && (
                            <label className="min-h-[110px] rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors text-gray-500 px-3 py-3">
                                <input
                                    type="file"
                                    multiple
                                    onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
                                    className="sr-only"
                                />
                                <Paperclip size={18} />
                                <span className="text-[10px] font-bold uppercase tracking-wider mt-1.5">Add file</span>
                                <span className="text-[9px] text-gray-400 mt-0.5">image · video · pdf · any</span>
                            </label>
                        )}
                    </div>
                </FormRow>
            </Section>

            {/* ── Recurrence ─────────────────────────────────────────── */}
            <Section title="Recurrence" subtitle="Optional — repeat this task on a schedule.">
                <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-4">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-800 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={recurring}
                            onChange={(e) => setRecurring(e.target.checked)}
                            className="rounded"
                        />
                        <RotateCw size={13} className="text-gray-500" />
                        Make this a recurring task
                    </label>

                    {recurring && (
                        <div className="mt-4 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <FormRow label="Frequency" tight>
                                    <select value={recurFreq} onChange={(e) => setRecurFreq(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="custom">Custom</option>
                                    </select>
                                </FormRow>
                                {recurFreq === "weekly" && (
                                    <FormRow label="Day of week" tight>
                                        <select value={recurDow} onChange={(e) => setRecurDow(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
                                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </FormRow>
                                )}
                                {recurFreq === "monthly" && (
                                    <FormRow label="Day of month" tight>
                                        <input
                                            type="number"
                                            min={1} max={31}
                                            value={recurDom}
                                            onChange={(e) => setRecurDom(Math.max(1, Math.min(31, Number(e.target.value) || 1)))}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                                        />
                                    </FormRow>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <FormRow label="Time of day" tight>
                                    <input type="time" value={recurTime} onChange={(e) => setRecurTime(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                                </FormRow>
                                <FormRow label="Ends" tight>
                                    <select value={recurEnd} onChange={(e) => setRecurEnd(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
                                        <option value="never">Never</option>
                                        <option value="count">After N occurrences</option>
                                        <option value="date">On date</option>
                                    </select>
                                </FormRow>
                            </div>
                            {recurEnd === "count" && (
                                <FormRow label="Number of occurrences" tight>
                                    <input type="number" min={1} value={recurCount} onChange={(e) => setRecurCount(Math.max(1, Number(e.target.value) || 1))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                                </FormRow>
                            )}
                            {recurEnd === "date" && (
                                <FormRow label="End date" tight>
                                    <input type="date" min={dueDate || todayIso()} value={recurUntil} onChange={(e) => setRecurUntil(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                                </FormRow>
                            )}
                        </div>
                    )}
                </div>
            </Section>
        </div>
    );
}

// Lightweight section wrapper used inside StepTwo. Adds a small uppercase
// title with a subtitle line and a horizontal divider above each block so
// the form reads as discrete chunks rather than one long column.
function Section({ title, subtitle, children }) {
    return (
        <section className="space-y-3">
            <header className="border-b border-gray-100 pb-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-900">
                    {title}
                </h3>
                {subtitle && (
                    <p className="mt-0.5 text-[11px] text-gray-500">{subtitle}</p>
                )}
            </header>
            <div className="space-y-4">{children}</div>
        </section>
    );
}

function FormRow({ label, required, error, hint, tight, children }) {
    return (
        <div className={tight ? "" : ""}>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {hint && !error && <p className="mt-1 text-[10px] text-gray-400">{hint}</p>}
            {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
        </div>
    );
}

// ─── Attachment preview card ───────────────────────────────────────────
// Renders an image thumbnail when `previewUrl` is set (image types) and a
// generic file card otherwise. Always exposes a remove button.

function fmtBytes(b) {
    if (!b && b !== 0) return "";
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ mime }) {
    if (!mime) return <FileText size={20} />;
    if (mime.startsWith("image/")) return <FileImage size={20} />;
    if (mime.startsWith("video/")) return <Film size={20} />;
    if (mime.startsWith("audio/")) return <Music size={20} />;
    return <FileText size={20} />;
}

function FilePreviewCard({ file, previewUrl, onRemove }) {
    const isImage = file.type?.startsWith("image/") && previewUrl;

    return (
        <div className="relative rounded-lg border border-gray-200 bg-gray-50 overflow-hidden group">
            <button
                type="button"
                onClick={onRemove}
                className="absolute top-1 right-1 z-10 bg-black/60 hover:bg-black/80 text-white rounded p-0.5"
                aria-label="Remove attachment"
            >
                <X size={10} />
            </button>

            {isImage ? (
                <div className="aspect-square">
                    <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className="aspect-square flex flex-col items-center justify-center text-gray-500 px-2 text-center">
                    <FileTypeIcon mime={file.type} />
                    <p className="mt-1.5 text-[10px] font-semibold text-gray-700 leading-tight line-clamp-2 break-all">
                        {file.name}
                    </p>
                    <p className="mt-0.5 text-[9px] text-gray-400 tabular-nums">
                        {fmtBytes(file.size)}
                    </p>
                </div>
            )}
        </div>
    );
}

// ─── Related-record autocomplete ────────────────────────────────────────

function RelatedRecordSearch({ value, onChange }) {
    const [q, setQ]             = useState("");
    const [results, setResults] = useState([]);
    const [open, setOpen]       = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef          = useRef(null);
    const searchInputRef        = useRef(null);
    const debounceRef           = useRef(null);

    // Outside click closes the dropdown.
    useEffect(() => {
        const onDoc = (e) => {
            if (containerRef.current && ! containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    // Fetch on open (q="") for an instant recent-leads list, and re-fetch
    // as the user types (debounced).
    useEffect(() => {
        if (! open) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setLoading(true);
        debounceRef.current = setTimeout(() => {
            fetch(`/api/tasks/related-records?q=${encodeURIComponent(q)}`, { headers: { Accept: "application/json" } })
                .then((r) => r.ok ? r.json() : { records: [] })
                .then((d) => setResults(d.records || []))
                .catch(() => setResults([]))
                .finally(() => setLoading(false));
        }, q.trim() === "" ? 0 : 250);
        return () => debounceRef.current && clearTimeout(debounceRef.current);
    }, [q, open]);

    const openAndFocus = () => {
        setOpen(true);
        // Defer so the input exists when we try to focus it.
        setTimeout(() => searchInputRef.current?.focus(), 0);
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Closed state — looks like a regular select. Clicking opens
                the dropdown with the recent records ready to pick. */}
            <button
                type="button"
                onClick={openAndFocus}
                className={`w-full text-left px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm flex items-center gap-2 ${open ? "ring-2 ring-gray-900/10" : ""}`}
            >
                {value ? (
                    <>
                        <RecordIcon type={value.record_type} />
                        <span className="font-medium text-gray-900 truncate">{value.name}</span>
                        <span className="font-mono text-[11px] text-gray-500">#{value.lead_id}</span>
                        <span className="ml-auto inline-flex items-center gap-2">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onChange(null); setQ(""); }}
                                className="text-[11px] text-gray-500 hover:text-red-600"
                            >
                                Clear
                            </button>
                            <ChevronDown size={14} className="text-gray-400" />
                        </span>
                    </>
                ) : (
                    <>
                        <span className="text-gray-400 truncate flex-1">Pick a lead, student, case or client…</span>
                        <ChevronDown size={14} className="text-gray-400" />
                    </>
                )}
            </button>

            {open && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {/* Search field at the top of the dropdown */}
                    <div className="relative border-b border-gray-100">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search by name, email or lead id…"
                            className="w-full pl-8 pr-3 py-2 text-sm outline-none"
                        />
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                        {loading && (
                            <div className="px-3 py-2 text-[11px] text-gray-500">Loading…</div>
                        )}
                        {! loading && results.length === 0 && (
                            <div className="px-3 py-3 text-[12px] text-gray-500 text-center">
                                {q.trim() ? "No matches." : "No records found."}
                            </div>
                        )}
                        {! loading && q.trim() === "" && results.length > 0 && (
                            <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/60">
                                Recent
                            </div>
                        )}
                        {results.map((r) => {
                            const isSelected = value && value.id === r.id;
                            return (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => { onChange(r); setOpen(false); setQ(""); }}
                                    className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm ${
                                        isSelected ? "bg-gray-100" : "hover:bg-gray-50"
                                    }`}
                                >
                                    <RecordIcon type={r.record_type} />
                                    <span className="font-medium text-gray-900 truncate">{r.name}</span>
                                    <span className="font-mono text-[10px] text-gray-500">#{r.lead_id}</span>
                                    <span className="ml-auto text-[9px] uppercase tracking-wider text-gray-400">{r.record_type}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function RecordIcon({ type }) {
    return (
        <span className="w-5 h-5 rounded bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
            {type === "student" ? "S" : type === "case" ? "C" : type === "client" ? "A" : "L"}
        </span>
    );
}

