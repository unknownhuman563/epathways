import { useEffect, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { toast } from "sonner";
import {
    X, User, Tag, Paperclip, FileText, Film, FileImage, Music,
    AlertTriangle, Save, Eye, Download, CheckCircle2, MessageCircle, Hash,
} from "lucide-react";
import AssigneeMultiPicker from "./AssigneeMultiPicker";
import LeadMultiPicker from "./LeadMultiPicker";

// Editable task detail modal — the same look as the New Task modal so the
// create + edit flows feel identical. Pre-populated from the task on open;
// Save PATCHes /api/tasks/{id}; new attachments POST to /api/tasks/{id}/
// attachments via the separate attach endpoint.

const DEPARTMENT_LABEL = {
    sales:         "Sales",
    education:     "Education",
    immigration:   "Immigration",
    accommodation: "Accommodation",
    admin:         "Admin",
};

const ALL_DEPARTMENTS = ["sales", "education", "immigration", "accommodation", "admin"];

const TYPE_OPTIONS = [
    ["call",      "Call"],
    ["email",     "Email"],
    ["meeting",   "Meeting"],
    ["document",  "Document"],
    ["follow_up", "Follow-up"],
    ["internal",  "Internal"],
    ["other",     "Other"],
];

// Mirror of CATEGORIES_BY_DEPT in NewTaskModal / TaskBoardPage so the edit
// modal offers the same picker. Kept inline (rather than imported) so this
// file stays self-contained.
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

const STATUS_OPTIONS = [
    ["not_started", "Not Started"],
    ["in_progress", "In Progress"],
    ["in_review",   "In Review"],
    ["completed",   "Done"],
];

const isoDate = (iso) => iso ? new Date(iso).toISOString().slice(0, 10) : "";
const isoTime = (iso) => {
    if (! iso) return "17:00";
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

// If the saved category isn't in the predefined list for this department,
// treat it as a "Other" custom value so the dropdown reflects that correctly.
const splitCategory = (saved, options) => {
    if (! saved)                  return { dropdown: "", custom: "" };
    if (options.includes(saved))  return { dropdown: saved,  custom: "" };
    return { dropdown: "Other", custom: saved };
};

export default function TaskDetailModal({ task, onClose }) {
    const { props: pageProps } = usePage();
    const staffOptions = pageProps?.staffOptions || [];
    const currentUser  = pageProps?.auth?.user || null;

    const initialAssigneeIds = useMemo(() => {
        if (! task) return [];
        const primary = task.assignee?.id ? [Number(task.assignee.id)] : [];
        const extras  = Array.isArray(task.additional_assignee_ids)
            ? task.additional_assignee_ids.map(Number)
            : [];
        return Array.from(new Set([...primary, ...extras]));
    }, [task?.id, task?.assignee?.id, task?.additional_assignee_ids]);

    const initialDepartment = task?.department || "";
    const categoryOptions   = CATEGORIES_BY_DEPT[initialDepartment] || [];

    // Local form state
    const [title,       setTitle]       = useState("");
    const [description, setDescription] = useState("");
    const [note,        setNote]        = useState("");
    const [status,      setStatus]      = useState("not_started");
    const [priority,    setPriority]    = useState("normal");
    const [type,        setType]        = useState("other");
    const [dueDate,     setDueDate]     = useState("");
    const [dueTime,     setDueTime]     = useState("17:00");
    const [progress,    setProgress]    = useState(0);
    const [assigneeIds, setAssigneeIds] = useState([]);
    const [department,  setDepartment]  = useState("");
    const [category,    setCategory]    = useState("");
    const [categoryOther, setCategoryOther] = useState("");
    const [tagsInput,   setTagsInput]   = useState("");
    const [showOtherDepts, setShowOtherDepts] = useState(true);
    // Related leads — chip multi-picker, replaces the old single-locked
    // chip. Hydrated on open from task.lead + task.additional_lead_ids.
    const [relatedRecords, setRelatedRecords] = useState([]);
    const [newFiles,    setNewFiles]    = useState([]);     // File[]
    const [newPreviews, setNewPreviews] = useState([]);     // matching object URLs (null for non-image)
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState(null);

    // Seed from task whenever a different one opens.
    useEffect(() => {
        if (! task) return;
        const taskCategoryOpts = CATEGORIES_BY_DEPT[task.department || ""] || [];
        const split = splitCategory(task.category, taskCategoryOpts);

        setTitle(task.title || "");
        setDescription(task.description || "");
        setNote(task.note || "");
        setStatus(task.status || (task.completed ? "completed" : "not_started"));
        setPriority(task.priority || "normal");
        setType(task.type || "other");
        setDueDate(isoDate(task.due_at));
        setDueTime(isoTime(task.due_at));
        setProgress(Number(task.progress || 0));
        setAssigneeIds(initialAssigneeIds);
        setDepartment(task.department || "");
        setCategory(split.dropdown);
        setCategoryOther(split.custom);
        setTagsInput(Array.isArray(task.tags) ? task.tags.join(", ") : "");
        setShowOtherDepts(true);
        setNewPreviews((prev) => { prev.forEach((u) => u && URL.revokeObjectURL(u)); return []; });
        setNewFiles([]);
        setSaving(false);
        setError(null);

        // Hydrate the Related-to picker. The primary lead arrives as a full
        // object on `task.lead`; additional leads come as bare ids — we fetch
        // their display info from /api/tasks/related-records?ids=… so they
        // render as proper chips. The primary lead stays at index 0 so the
        // task keeps the same "primary" record after a save round-trip.
        const primary = task.lead
            ? [{
                id: task.lead.id,
                lead_id: task.lead.lead_id,
                name: task.lead.name,
                email: task.lead.email || null,
                record_type: task.lead.record_type || "lead",
            }]
            : [];
        const extraIds = Array.isArray(task.additional_lead_ids)
            ? task.additional_lead_ids.filter((id) => id && Number(id) !== Number(task.lead?.id))
            : [];
        if (extraIds.length === 0) {
            setRelatedRecords(primary);
        } else {
            // Tentatively show the primary chip; replace with the full list
            // once the extras come back from the server.
            setRelatedRecords(primary);
            fetch(`/api/tasks/related-records?ids=${encodeURIComponent(extraIds.join(","))}`, {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            })
                .then((r) => r.ok ? r.json() : { records: [] })
                .then((d) => {
                    const extras = (d.records || []).filter(
                        (r) => Number(r.id) !== Number(task.lead?.id),
                    );
                    setRelatedRecords([...primary, ...extras]);
                })
                .catch(() => { /* keep primary-only on failure */ });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [task?.id]);

    // Clean up object URLs on unmount.
    useEffect(() => () => {
        newPreviews.forEach((u) => u && URL.revokeObjectURL(u));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ESC closes when not saving.
    useEffect(() => {
        if (! task) return;
        const onKey = (e) => { if (e.key === "Escape" && ! saving) onClose?.(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [task, saving, onClose]);

    // Assignee list is filtered to the task's department by default unless
    // the user explicitly opens it up across the org.
    const visibleStaff = useMemo(() => {
        if (showOtherDepts || ! department) return staffOptions;
        return staffOptions.filter((s) => ! s.role || s.role === department || s.role === "admin");
    }, [staffOptions, showOtherDepts, department]);

    const addFiles = (selected) => {
        const list = Array.from(selected || []);
        if (list.length === 0) return;
        const previews = list.map((f) =>
            f.type.startsWith("image/") ? URL.createObjectURL(f) : null
        );
        setNewFiles((prev) => [...prev, ...list].slice(0, 8));
        setNewPreviews((prev) => [...prev, ...previews].slice(0, 8));
    };

    const removeNewFile = (idx) => {
        if (newPreviews[idx]) URL.revokeObjectURL(newPreviews[idx]);
        setNewFiles((prev) => prev.filter((_, i) => i !== idx));
        setNewPreviews((prev) => prev.filter((_, i) => i !== idx));
    };

    if (! task) return null;

    const existingFiles  = task.attachments || [];
    const effectiveCategoryOptions = CATEGORIES_BY_DEPT[department] || [];
    // A task is considered "linked" when any record is in the picker —
    // the primary link is whichever chip sits at index 0.
    const isLinked = relatedRecords.length > 0;

    const onSave = () => {
        if (! title.trim()) {
            setError("Title is required.");
            return;
        }
        setSaving(true);
        setError(null);

        const tags = tagsInput.split(",").map((s) => s.trim()).filter(Boolean);
        const dueAt = dueDate ? `${dueDate} ${dueTime || "17:00"}:00` : null;

        const resolvedCategory = isLinked
            ? null
            : (category === "Other" && categoryOther.trim()
                ? categoryOther.trim()
                : (category || null));

        const leadIds = relatedRecords.map((r) => Number(r.id)).filter(Boolean);

        const payload = {
            title:        title.trim(),
            description:  description || null,
            note:         note || null,
            status,
            priority,
            type,
            progress:     Number(progress) || 0,
            due_at:       dueAt,
            assignee_ids: assigneeIds.length ? assigneeIds : null,
            department:   department || null,
            tags,
            category:     resolvedCategory,
            // TaskController::update reads `lead_ids[]`; the first becomes
            // the primary `lead_id`, the rest land in `additional_lead_ids`.
            lead_ids:     leadIds,
        };

        router.patch(`/api/tasks/${task.id}`, payload, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                // After the PATCH succeeds, upload any new attachments. We
                // do this as a second request so the field-edit form stays
                // simple and validation errors don't get tangled together.
                if (newFiles.length > 0) {
                    const form = new FormData();
                    newFiles.forEach((f) => form.append("attachments[]", f));
                    router.post(`/api/tasks/${task.id}/attachments`, form, {
                        preserveScroll: true,
                        preserveState: true,
                        forceFormData: true,
                        onSuccess: () => {
                            toast.success("Task updated");
                            onClose?.();
                        },
                        onError: () => {
                            toast.warning("Task saved, but some attachments failed.");
                            onClose?.();
                        },
                        onFinish: () => setSaving(false),
                    });
                } else {
                    toast.success("Task updated");
                    setSaving(false);
                    onClose?.();
                }
            },
            onError: (errs) => {
                const first = errs && Object.values(errs)[0];
                setError(first || "Could not save changes.");
                setSaving(false);
            },
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-6"
            onClick={(e) => { if (e.target === e.currentTarget && ! saving) onClose?.(); }}
        >
            <div
                className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col"
                style={{ width: '100%', maxWidth: 'min(1100px, 95vw)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 truncate">
                        Edit task
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 disabled:opacity-40"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-5">
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Top sections sit in a 2-column grid so the form
                            is wider instead of taller — less scrolling.
                            Collapses to a single column below lg. */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                        {/* ── Basics ──────────────────────────────────── */}
                        <Section title="Basics" subtitle="What needs doing and where it lives.">
                            <FormRow label="Department this task belongs to">
                                <select
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                                >
                                    <option value="">Unset</option>
                                    {ALL_DEPARTMENTS.map((d) => (
                                        <option key={d} value={d}>{DEPARTMENT_LABEL[d]}</option>
                                    ))}
                                </select>
                            </FormRow>

                            <FormRow label="Title" required>
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

                            <FormRow label="Description">
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    placeholder="Optional context, links, instructions…"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                                />
                            </FormRow>

                            <FormRow label="Note" hint='Short reminder shown on the card (e.g. "Has to finish before weekend")'>
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

                        {/* ── Classification ──────────────────────────── */}
                        <Section title="Classification" subtitle="How this task is grouped and tagged.">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormRow label="Status">
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                                    >
                                        {STATUS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                    </select>
                                </FormRow>
                                <FormRow label="Priority">
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                                    >
                                        <option value="low">Low</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </FormRow>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormRow label="Type">
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                                    >
                                        {TYPE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                    </select>
                                </FormRow>
                                <FormRow label="Related to">
                                    <LeadMultiPicker
                                        value={relatedRecords}
                                        onChange={setRelatedRecords}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        First chip is the primary link; add more to associate the task with extra leads, students, cases, or clients.
                                    </p>
                                </FormRow>
                            </div>

                            {/* Category is only meaningful for unlinked / department tasks
                                (no related leads). Hide it once any record is picked. */}
                            {relatedRecords.length === 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormRow label="Category">
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                                        >
                                            <option value="">Pick a category…</option>
                                            {effectiveCategoryOptions.map((c) => (
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
                                </div>
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

                        {/* ── Schedule & progress ─────────────────────── */}
                        <Section title="Schedule & progress" subtitle="When it's due and how far along you are.">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormRow label="Due date">
                                    <input
                                        type="date"
                                        value={dueDate}
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

                            <FormRow label={`Progress — ${progress}%`}>
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

                        {/* ── People ──────────────────────────────────── */}
                        <Section title="People" subtitle="Who's responsible.">
                            <FormRow
                                label="Assigned to"
                                hint="Pick myself, other staff, or a mix. Leave empty to default to me."
                            >
                                <AssigneeMultiPicker
                                    value={assigneeIds}
                                    onChange={setAssigneeIds}
                                    visibleStaff={visibleStaff}
                                    allStaff={staffOptions}
                                    currentUser={currentUser}
                                />
                                <label className="mt-2 inline-flex items-center gap-2 text-[11px] text-gray-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showOtherDepts}
                                        onChange={(e) => setShowOtherDepts(e.target.checked)}
                                        className="rounded"
                                    />
                                    Show staff from every department
                                </label>
                            </FormRow>
                        </Section>
                        </div>

                        {/* ── Attachments ─────────────────────────────── */}
                        <Section
                            title="Attachments"
                            subtitle="Any file — images, video, PDF, docs. Up to 20 MB each, max 8 files."
                        >
                            {existingFiles.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                                        Current · {existingFiles.length}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {existingFiles.map((a) => (
                                            <AttachmentCard key={a.id} attachment={a} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                {existingFiles.length > 0 && (
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                                        Add new · {newFiles.length}/8
                                    </p>
                                )}
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {newFiles.map((file, idx) => (
                                        <FilePreviewCard
                                            key={idx}
                                            file={file}
                                            previewUrl={newPreviews[idx]}
                                            onRemove={() => removeNewFile(idx)}
                                        />
                                    ))}
                                    {newFiles.length < 8 && (
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
                            </div>
                        </Section>

                        {/* ── Activity ────────────────────────────────── */}
                        {(Number(task.comments_count) > 0 || task.completion_notes || task.creator || task.assignee) && (
                            <Section title="Activity" subtitle="Read-only history for this task.">
                                {Number(task.comments_count) > 0 && (
                                    <p className="text-[12px] text-gray-500 inline-flex items-center gap-1.5">
                                        <MessageCircle size={12} />
                                        {task.comments_count} comment{task.comments_count === 1 ? "" : "s"} — open the comments popover from the card for the full thread.
                                    </p>
                                )}

                                {task.completion_notes && (
                                    <FormRow label="Completion notes">
                                        <p className="text-[13px] text-gray-700 whitespace-pre-wrap leading-relaxed bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 inline-flex items-start gap-2">
                                            <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                                            {task.completion_notes}
                                        </p>
                                    </FormRow>
                                )}

                                {(task.creator || task.assignee) && (
                                    <div className="text-[10.5px] text-gray-400 flex items-center gap-3 flex-wrap">
                                        {task.creator && (
                                            <span>Created by <span className="font-semibold text-gray-600">{task.creator.name}</span></span>
                                        )}
                                        {task.assignee && (
                                            <span>Primary assignee <span className="font-semibold text-gray-600">{task.assignee.name}</span></span>
                                        )}
                                    </div>
                                )}
                            </Section>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 rounded-lg text-[12px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-40"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-[12px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-40"
                    >
                        <Save size={12} />
                        {saving ? "Saving…" : "Save changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Shared helpers ─────────────────────────────────────────────────────

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

function FormRow({ label, required, hint, children }) {
    return (
        <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {hint && <p className="mt-1 text-[10px] text-gray-400">{hint}</p>}
        </div>
    );
}

function fmtBytes(b) {
    if (! b && b !== 0) return "";
    if (b < 1024)        return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ mime }) {
    if (! mime) return <FileText size={18} />;
    if (mime.startsWith("image/")) return <FileImage size={18} />;
    if (mime.startsWith("video/")) return <Film size={18} />;
    if (mime.startsWith("audio/")) return <Music size={18} />;
    return <FileText size={18} />;
}

// New-file preview tile in the uploader grid.
function FilePreviewCard({ file, previewUrl, onRemove }) {
    const isImage = file.type?.startsWith("image/") && previewUrl;

    return (
        <div className="relative rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
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

// Already-saved attachment with explicit View + Download actions.
function AttachmentCard({ attachment }) {
    const isImage = !! attachment.is_image;
    const name    = attachment.original_filename || "attachment";
    const size    = fmtBytes(attachment.size);

    return (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden flex flex-col">
            {isImage ? (
                <a
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block aspect-[4/3] bg-gray-50 hover:opacity-90 transition-opacity"
                    title={name}
                >
                    <img src={attachment.url} alt={name} className="w-full h-full object-cover" />
                </a>
            ) : (
                <div className="aspect-[4/3] bg-gray-50 flex flex-col items-center justify-center text-gray-500 px-3 text-center">
                    <FileTypeIcon mime={attachment.mime_type} />
                    <p className="mt-1.5 text-[10.5px] font-semibold text-gray-700 leading-tight line-clamp-2 break-all">
                        {name}
                    </p>
                </div>
            )}

            <div className="px-2.5 py-1.5 border-t border-gray-100 flex items-center gap-2 text-[10.5px]">
                <span className="truncate font-medium text-gray-700" title={name}>{name}</span>
                {size && <span className="text-gray-400 tabular-nums flex-shrink-0">{size}</span>}
                <span className="ml-auto inline-flex items-center gap-1 flex-shrink-0">
                    <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                        title="View"
                    >
                        <Eye size={11} /> View
                    </a>
                    <a
                        href={attachment.url}
                        download={name}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                        title="Download"
                    >
                        <Download size={11} /> Save
                    </a>
                </span>
            </div>
        </div>
    );
}
