import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import {
    X, User, Building2, ChevronLeft, AlertTriangle, Search, Tag, RotateCw,
    Plus, ImagePlus,
} from "lucide-react";

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
    sales:         "Sales",
    education:     "Education",
    immigration:   "Immigration",
    accommodation: "Accommodation",
    admin:         "Admin",
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
};

const TYPE_OPTIONS = [
    ["call",      "Call"],
    ["email",     "Email"],
    ["meeting",   "Meeting"],
    ["document",  "Document"],
    ["follow_up", "Follow-up"],
    ["internal",  "Internal"],
    ["other",     "Other"],
];

const ALL_DEPARTMENTS = ["sales", "education", "immigration", "accommodation", "admin"];

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

    // Two-step wizard. If lockedRecord is supplied (opened from a record
    // detail page), skip Step 1 and go straight to record-linked Step 2.
    const initialStep = lockedRecord ? 2 : 1;
    const initialKind = lockedRecord ? "linked" : null;

    const [step, setStep]   = useState(initialStep);
    const [kind, setKind]   = useState(initialKind); // 'linked' | 'dept'
    const [submitting, setSubmitting] = useState(false);
    const [topError, setTopError]     = useState(null);
    const [errors, setErrors]         = useState({});

    // Step 2 form state
    const [taskDepartment, setTaskDepartment] = useState(isAdminPortal ? "sales" : department);
    const [title, setTitle]                   = useState("");
    const [description, setDescription]       = useState("");
    const [note, setNote]                     = useState("");
    const [type, setType]                     = useState("call");
    const [priority, setPriority]             = useState("normal");
    const [progress, setProgress]             = useState(0);
    const [dueDate, setDueDate]               = useState(todayIso());
    const [dueTime, setDueTime]               = useState("17:00");
    const [assigneeId, setAssigneeId]         = useState(null);
    const [showOtherDepts, setShowOtherDepts] = useState(false);
    const [relatedRecord, setRelatedRecord]   = useState(lockedRecord);
    const [category, setCategory]             = useState("");
    const [tagsInput, setTagsInput]           = useState("");
    const [recurring, setRecurring]           = useState(false);
    const [recurFreq, setRecurFreq]           = useState("weekly");
    const [recurDow, setRecurDow]             = useState("Monday");
    const [recurDom, setRecurDom]             = useState(1);
    const [recurTime, setRecurTime]           = useState("09:00");
    const [recurEnd, setRecurEnd]             = useState("never"); // never | count | date
    const [recurCount, setRecurCount]         = useState(10);
    const [recurUntil, setRecurUntil]         = useState("");
    const [crossDeptOpen, setCrossDeptOpen]   = useState(false);
    const [crossDeptReason, setCrossDeptReason] = useState("");
    const [files, setFiles]                   = useState([]); // File[]
    const [filePreviews, setFilePreviews]     = useState([]); // matching object URLs

    // Reset when the modal is closed-and-reopened to avoid stale state.
    useEffect(() => {
        if (! open) return;
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
        setAssigneeId(null);
        setShowOtherDepts(false);
        setRelatedRecord(lockedRecord);
        setCategory("");
        setTagsInput("");
        setRecurring(false);
        setRecurFreq("weekly");
        setRecurDow("Monday");
        setRecurDom(1);
        setRecurTime("09:00");
        setRecurEnd("never");
        setRecurCount(10);
        setRecurUntil("");
        setCrossDeptOpen(false);
        setCrossDeptReason("");
        // Revoke any leftover object URLs before clearing.
        setFilePreviews((prev) => { prev.forEach(URL.revokeObjectURL); return []; });
        setFiles([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Object URLs are cheap but leak if not revoked — clean up on unmount.
    useEffect(() => () => {
        filePreviews.forEach(URL.revokeObjectURL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addFiles = (selected) => {
        const list = Array.from(selected || []).filter((f) => f.type.startsWith("image/"));
        if (list.length === 0) return;
        const newPreviews = list.map((f) => URL.createObjectURL(f));
        setFiles((prev) => [...prev, ...list].slice(0, 8));
        setFilePreviews((prev) => [...prev, ...newPreviews].slice(0, 8));
    };

    const removeFile = (idx) => {
        URL.revokeObjectURL(filePreviews[idx]);
        setFiles((prev) => prev.filter((_, i) => i !== idx));
        setFilePreviews((prev) => prev.filter((_, i) => i !== idx));
    };

    const categoryOptions = CATEGORIES_BY_DEPT[isAdminPortal ? taskDepartment : department] || [];

    // ── Assignee list — filtered by department unless toggled ───────────
    // useMemo must run on every render (no early return above it) so the
    // hook count stays stable when `open` flips from false → true.
    const visibleStaff = useMemo(() => {
        if (showOtherDepts || isAdminPortal) return staffOptions;
        return staffOptions.filter((s) => ! s.role || s.role === department || s.role === "admin");
    }, [staffOptions, showOtherDepts, department, isAdminPortal]);

    if (! open) return null;

    const assignee = staffOptions.find((s) => String(s.id) === String(assigneeId));
    const effectiveDept = isAdminPortal ? taskDepartment : department;
    const isCrossDept =
        assignee
        && assignee.role
        && assignee.role !== "admin"
        && assignee.role !== effectiveDept;

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
                  day_of_week:  recurFreq === "weekly"  ? recurDow : null,
                  day_of_month: recurFreq === "monthly" ? recurDom : null,
                  time: recurTime,
                  end: recurEnd === "count" ? { type: "count", value: recurCount }
                       : recurEnd === "date" ? { type: "date", value: recurUntil }
                       : { type: "never" },
              }
            : null;

        return {
            task_type: kind,
            lead_id: kind === "linked" ? relatedRecord?.id : null,
            title,
            description: description || null,
            note: note || null,
            type,
            priority,
            progress,
            due_at: dueAt,
            assignee_id: assigneeId || null,
            department: effectiveDept,
            category: kind === "dept" ? category : null,
            tags: tags.length ? tags : null,
            recurrence_config,
            cross_dept_reason: isCrossDept ? crossDeptReason : null,
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
        if (isCrossDept) {
            setCrossDeptOpen(true);
            return;
        }
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
                        {step === 2 && ! lockedRecord && (
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
                            assigneeId={assigneeId} setAssigneeId={setAssigneeId}
                            visibleStaff={visibleStaff}
                            showOtherDepts={showOtherDepts} setShowOtherDepts={setShowOtherDepts}
                            relatedRecord={relatedRecord} setRelatedRecord={setRelatedRecord}
                            lockedRecord={lockedRecord}
                            category={category} setCategory={setCategory}
                            categoryOptions={categoryOptions}
                            tagsInput={tagsInput} setTagsInput={setTagsInput}
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
                            isCrossDept={isCrossDept}
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
                            disabled={! kind}
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

            {crossDeptOpen && (
                <CrossDeptConfirm
                    departmentLabel={DEPARTMENT_LABEL[assignee?.role] || assignee?.role || "another team"}
                    reason={crossDeptReason}
                    setReason={setCrossDeptReason}
                    onCancel={() => setCrossDeptOpen(false)}
                    onConfirm={() => { setCrossDeptOpen(false); doSubmit(); }}
                    submitting={submitting}
                />
            )}
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
            className={`w-full text-left rounded-xl border-2 p-4 flex items-start gap-3 transition-all ${
                checked ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
        >
            <span className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                checked ? "border-gray-900" : "border-gray-300"
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
        assigneeId, setAssigneeId, visibleStaff,
        showOtherDepts, setShowOtherDepts,
        relatedRecord, setRelatedRecord, lockedRecord,
        category, setCategory, categoryOptions,
        tagsInput, setTagsInput,
        filePreviews, addFiles, removeFile,
        recurring, setRecurring,
        recurFreq, setRecurFreq, recurDow, setRecurDow, recurDom, setRecurDom,
        recurTime, setRecurTime, recurEnd, setRecurEnd,
        recurCount, setRecurCount, recurUntil, setRecurUntil,
        errors, effectiveDept, isCrossDept,
    } = props;

    return (
        <div className="space-y-5">
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

            <FormRow label="Note" hint="Short reminder shown on the card (e.g. “Has to finish before weekend”)" error={errors.note}>
                <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={500}
                    placeholder="add a quick note…"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
            </FormRow>

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
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

            {/* Progress — 0 means "no bar shown on card". Slider keeps it
                quick to scrub; the number stays in sync. */}
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

            {/* Assigned + Related/Category share a row on wider screens. */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormRow label="Assigned to" error={errors.assignee_id}>
                    <select
                        value={assigneeId || ""}
                        onChange={(e) => setAssigneeId(e.target.value || null)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                    >
                        <option value="">Unassigned (current user defaults)</option>
                        {visibleStaff.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}{s.role ? ` — ${DEPARTMENT_LABEL[s.role] || s.role}` : ""}
                            </option>
                        ))}
                    </select>
                    {! isAdminPortal && (
                        <label className="mt-2 inline-flex items-center gap-2 text-[11px] text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showOtherDepts}
                                onChange={(e) => setShowOtherDepts(e.target.checked)}
                                className="rounded"
                            />
                            Show other departments
                        </label>
                    )}
                    {isCrossDept && (
                        <p className="mt-2 text-[11px] text-amber-700 inline-flex items-center gap-1">
                            <AlertTriangle size={11} />
                            Cross-department assignment — you'll be asked for a reason on save.
                        </p>
                    )}
                </FormRow>

                {kind === "linked" ? (
                    <FormRow label="Related to" required error={errors.lead_id}>
                        {lockedRecord ? (
                            <div className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm flex items-center gap-2">
                                <User size={13} className="text-gray-500" />
                                <span className="font-medium text-gray-900">{lockedRecord.name}</span>
                                <span className="font-mono text-[11px] text-gray-500">#{lockedRecord.lead_id}</span>
                                <span className="ml-auto text-[10px] uppercase tracking-wider text-gray-400">Locked</span>
                            </div>
                        ) : (
                            <RelatedRecordSearch
                                value={relatedRecord}
                                onChange={setRelatedRecord}
                            />
                        )}
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
                    </FormRow>
                )}
            </div>

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

            <FormRow
                label="Photos"
                hint="JPG / PNG / GIF, up to 5 MB each, max 8 files"
                error={errors["attachments.0"] || errors.attachments}
            >
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                    {filePreviews.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                            <img src={url} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removeFile(idx)}
                                className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded p-0.5"
                                aria-label="Remove image"
                            >
                                <X size={10} />
                            </button>
                        </div>
                    ))}
                    {filePreviews.length < 8 && (
                        <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors text-gray-400">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
                                className="sr-only"
                            />
                            <ImagePlus size={16} />
                            <span className="text-[9px] font-bold uppercase tracking-wider mt-1">Add</span>
                        </label>
                    )}
                </div>
            </FormRow>

            {/* Recurrence */}
            <div className="rounded-xl border border-gray-200 p-3">
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
                        <div className="grid grid-cols-2 gap-3">
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
                                        {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((d) => (
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
                        <div className="grid grid-cols-2 gap-3">
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
        </div>
    );
}

function FormRow({ label, required, error, hint, tight, children }) {
    return (
        <div className={tight ? "" : ""}>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {hint && ! error && <p className="mt-1 text-[10px] text-gray-400">{hint}</p>}
            {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
        </div>
    );
}

// ─── Related-record autocomplete ────────────────────────────────────────

function RelatedRecordSearch({ value, onChange }) {
    const [q, setQ]               = useState("");
    const [results, setResults]   = useState([]);
    const [open, setOpen]         = useState(false);
    const [loading, setLoading]   = useState(false);
    const debounceRef = useRef(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (q.trim().length < 2) { setResults([]); return; }
        setLoading(true);
        debounceRef.current = setTimeout(() => {
            fetch(`/api/tasks/related-records?q=${encodeURIComponent(q)}`, { headers: { Accept: "application/json" }})
                .then((r) => r.ok ? r.json() : { records: [] })
                .then((d) => setResults(d.records || []))
                .catch(() => setResults([]))
                .finally(() => setLoading(false));
        }, 250);
        return () => debounceRef.current && clearTimeout(debounceRef.current);
    }, [q]);

    if (value) {
        return (
            <div className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm flex items-center gap-2">
                <RecordIcon type={value.record_type} />
                <span className="font-medium text-gray-900">{value.name}</span>
                <span className="font-mono text-[11px] text-gray-500">#{value.lead_id}</span>
                <button
                    type="button"
                    onClick={() => { onChange(null); setQ(""); }}
                    className="ml-auto text-[11px] text-gray-500 hover:text-red-600"
                >
                    Change
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                type="text"
                value={q}
                onChange={(e) => { setQ(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                placeholder="Search leads, students, cases, clients…"
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
            {open && q.trim().length >= 2 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {loading && <div className="px-3 py-2 text-[11px] text-gray-500">Searching…</div>}
                    {! loading && results.length === 0 && (
                        <div className="px-3 py-2 text-[11px] text-gray-500">No matches.</div>
                    )}
                    {results.map((r) => (
                        <button
                            key={r.id}
                            type="button"
                            onClick={() => { onChange(r); setOpen(false); setQ(""); }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                        >
                            <RecordIcon type={r.record_type} />
                            <span className="font-medium text-gray-900 truncate">{r.name}</span>
                            <span className="font-mono text-[10px] text-gray-500">#{r.lead_id}</span>
                            <span className="ml-auto text-[9px] uppercase tracking-wider text-gray-400">{r.record_type}</span>
                        </button>
                    ))}
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

// ─── Cross-department confirmation ──────────────────────────────────────

function CrossDeptConfirm({ departmentLabel, reason, setReason, onCancel, onConfirm, submitting }) {
    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-600" />
                        Assigning to {departmentLabel}
                    </h3>
                </div>
                <div className="px-5 py-4">
                    <p className="text-sm text-gray-600">
                        You're creating a task for a different department. Please add context.
                    </p>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mt-4 mb-1.5">
                        Reason for cross-department assignment <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        autoFocus
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                        placeholder="e.g. Spotted during sales review — needs immigration input"
                    />
                </div>
                <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg text-[12px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-200"
                    >
                        Back to edit
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={! reason.trim() || submitting}
                        className="px-4 py-2 rounded-lg bg-gray-900 text-white text-[12px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-40"
                    >
                        {submitting ? "Saving…" : "Confirm and assign"}
                    </button>
                </div>
            </div>
        </div>
    );
}
