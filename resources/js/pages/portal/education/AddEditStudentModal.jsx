import { useEffect, useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import { X, Save, AlertTriangle, GraduationCap } from "lucide-react";

// Add / edit student modal — used from the Students page.
// • Add mode: posts to /portal/education/students
// • Edit mode: posts to /portal/education/students/{id}/update
// All form fields the user spec'd, in order.

// Canonical stage lists per owning department. Each maps to a
// dedicated column on the leads row (education_stage / english_stage /
// immigration_stage) — the modal's Department dropdown decides which
// column we're writing to, and the Stage dropdown shows that
// department's list.
const STAGES_BY_DEPARTMENT = {
    education: {
        label: "Education / Student",
        field: "education_stage",
        stages: [
            "Endorsed to School", "Conditional Offer", "Unconditional Offer",
            "Endorsed to Immigration", "Visa Lodged", "Approved in Principle",
            "Request for Information", "Approved Visa", "Started Course",
        ],
    },
    english: {
        label: "English",
        field: "english_stage",
        stages: ["PTE Review", "DIY Review", "For PTE Mocktest", "For PTE Exam"],
    },
    immigration: {
        label: "Immigration",
        field: "immigration_stage",
        stages: [
            "For Assessment", "Endorsed", "Visa Lodged", "Request for Information",
            "Approved in Principle", "Approved Visa", "Decline Visa",
        ],
    },
};

// Named people who can own a lead at an English / Immigration stage.
// Free-text labels (mirrors Lead::ENGLISH_STAGE_ASSIGNEES /
// IMMIGRATION_STAGE_ASSIGNEES) — "DIY" is a handling mode, not a person.
const STAGE_ASSIGNEES = {
    english:     ["Paula", "Frank", "DIY"],
    immigration: ["Hendry", "Tarun", "Dev"],
};

const COOP_OOP_PRESETS = ["Yes", "No"];

const SUFFIX_OPTIONS = ["", "Jr.", "Sr.", "II", "III", "IV", "V"];

// localStorage key for the new-student draft so a user who cancels
// accidentally (or refreshes) can resume from where they left off.
const DRAFT_KEY = "education.newStudent.draft";

const blankForm = () => ({
    first_name: "", middle_name: "", last_name: "", suffix: "",
    gender: "", email: "", phone: "", referral: "",
    // Department picks WHICH stage column we save to ("education_stage",
    // "english_stage", "immigration_stage"); `stage` is the actual value
    // for that department's list. Default department is education.
    department: "education", stage: "", assignee: "",
    date_of_engagement: "",
    program_text: "", internal_note: "",
    payment: "", intake: "", school_id: "",
    coop: "", oop: "", english_test: "",
});

export default function AddEditStudentModal({
    student,            // null for add, object for edit
    open,
    onClose,
    schoolOptions  = [],
    programOptions = [],
}) {
    const editing = !! student;
    const [form,    setForm]    = useState(blankForm);
    const [errors,  setErrors]  = useState({});
    const [saving,  setSaving]  = useState(false);

    // Seed on open. We don't pull preferred_course / intake / english_test
    // from the student row because the listing serializer doesn't surface
    // those (they live on the study plan and aren't shown in the table).
    // Edit mode pre-fills only what's on `student` — the rest stays blank
    // and will only post if filled.
    useEffect(() => {
        if (! open) return;
        if (! editing) {
            // Restore an unfinished draft if the user cancelled or
            // refreshed before submitting. Only seeds new-student mode
            // — editing always starts from the actual record.
            let draft = null;
            try {
                const raw = localStorage.getItem(DRAFT_KEY);
                if (raw) draft = JSON.parse(raw);
            } catch { /* malformed JSON in storage — ignore */ }
            setForm({ ...blankForm(), ...(draft || {}) });
            setErrors({});
            return;
        }
        // Detect which department track the student is currently on by
        // looking at which of the three *_stage columns has a value.
        // Immigration wins if multiple are set (most-downstream signal).
        const seedDept = student.immigration_stage
            ? "immigration"
            : student.english_stage
                ? "english"
                : "education";
        const seedStage = student[STAGES_BY_DEPARTMENT[seedDept].field] ?? "";
        const seedAssignee = seedDept === "english"
            ? (student.english_assignee ?? "")
            : seedDept === "immigration"
                ? (student.immigration_assignee ?? "")
                : "";

        setForm({
            first_name:      student.name?.split(/\s+/)[0]              ?? "",
            middle_name:     student.middle_name                        ?? "",
            last_name:       student.name?.split(/\s+/).slice(-1)[0]    ?? "",
            suffix:          student.suffix                             ?? "",
            gender:          student.gender                             ?? "",
            email:           student.email                              ?? "",
            phone:           student.phone                              ?? "",
            referral:        student.referral                           ?? "",
            department:      seedDept,
            stage:           seedStage,
            assignee:        seedAssignee,
            date_of_engagement: student.date_engaged                    ?? "",
            program_text:    student.program ?? "",
            internal_note:   student.comments                           ?? "",
            payment:         student.payment                            ?? "",
            intake:          student.intake                             ?? "",
            school_id:       student.school_id                          ?? "",
            coop:            student.coop                               ?? "",
            oop:             student.oop                                ?? "",
            english_test:    student.english_test                       ?? "",
        });
        setErrors({});
    }, [open, editing, student?.id]);

    // ESC to close (unless mid-save).
    useEffect(() => {
        if (! open) return;
        const onKey = (e) => { if (e.key === "Escape" && ! saving) onClose?.(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, saving, onClose]);

    // Auto-save draft on every change (new-student mode only). Cleared
    // when the create succeeds; if the user cancels they pick up where
    // they left off the next time they hit "New student".
    useEffect(() => {
        if (! open || editing) return;
        try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); }
        catch { /* quota exceeded or storage unavailable — silent */ }
    }, [open, editing, form]);

    if (! open) return null;

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const setVal = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const submit = (e) => {
        e?.preventDefault?.();
        setSaving(true);
        setErrors({});
        const url = editing
            ? `/portal/education/students/${student.id}/update`
            : `/portal/education/students`;

        // Translate the UI's department + stage pair into the right
        // *_stage column on the wire. The two columns the user *didn't*
        // pick are sent as null so a department switch in edit mode
        // clears the previous track's stage.
        const cfg = STAGES_BY_DEPARTMENT[form.department] || STAGES_BY_DEPARTMENT.education;
        const { department, stage, assignee, ...rest } = form;
        const payload = {
            ...rest,
            education_stage:   cfg.field === "education_stage"   ? (stage || null) : null,
            english_stage:     cfg.field === "english_stage"     ? (stage || null) : null,
            immigration_stage: cfg.field === "immigration_stage" ? (stage || null) : null,
            // Assignee only applies to the English / Immigration tracks; the
            // column for the department we *didn't* pick is cleared.
            english_assignee:     department === "english"     ? (assignee || null) : null,
            immigration_assignee: department === "immigration" ? (assignee || null) : null,
            date_of_engagement:   form.date_of_engagement || null,
        };

        router.post(url, payload, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                if (! editing) {
                    try { localStorage.removeItem(DRAFT_KEY); } catch {}
                }
                onClose?.();
            },
            onError: (errs) => setErrors(errs || {}),
            onFinish: () => setSaving(false),
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-6"
            onClick={(e) => { if (e.target === e.currentTarget && ! saving) onClose?.(); }}
        >
            <div
                className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                            <GraduationCap size={16} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900 leading-none">
                                {editing ? "Edit student" : "New student"}
                            </h2>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                                {editing
                                    ? `Updating ${student.name || "this student"}`
                                    : "Add a new student to the Education pipeline"}
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} disabled={saving} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 disabled:opacity-40">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

                    {/* Errors */}
                    {Object.keys(errors).length > 0 && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[12px] flex items-start gap-2">
                            <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                            <div>
                                <strong>Please review:</strong>
                                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                                    {Object.values(errors).map((m, i) => <li key={i}>{m}</li>)}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Identity */}
                    <Section title="Identity">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <Field label="First name" required>
                                <input type="text" required value={form.first_name} onChange={set("first_name")} className={ICls} maxLength={120} placeholder="e.g. Maria" />
                            </Field>
                            <Field label="Middle name" hint="Optional">
                                <input type="text" value={form.middle_name} onChange={set("middle_name")} className={ICls} maxLength={120} />
                            </Field>
                            <Field label="Last name" required>
                                <input type="text" required value={form.last_name} onChange={set("last_name")} className={ICls} maxLength={120} placeholder="e.g. Santos" />
                            </Field>
                            <Field label="Suffix" hint="Optional">
                                <select value={form.suffix} onChange={set("suffix")} className={ICls}>
                                    {SUFFIX_OPTIONS.map((s) => (
                                        <option key={s || "none"} value={s}>
                                            {s || "— None —"}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Gender" hint="Optional">
                                <select value={form.gender} onChange={set("gender")} className={ICls}>
                                    <option value="">Prefer not to say</option>
                                    <option>Female</option>
                                    <option>Male</option>
                                    <option>Non-binary</option>
                                    <option>Other</option>
                                </select>
                            </Field>
                        </div>
                    </Section>

                    {/* Contact */}
                    <Section title="Contact">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <Field label="Email" required>
                                <input type="email" required value={form.email} onChange={set("email")} className={ICls} placeholder="student@example.com" />
                            </Field>
                            <Field label="Contact number" required>
                                <input type="tel" required value={form.phone} onChange={set("phone")} className={ICls} placeholder="+63 …" />
                            </Field>
                            <Field label="Referral" hint="Who referred them · optional">
                                <input type="text" value={form.referral} onChange={set("referral")} className={ICls} maxLength={191} placeholder="e.g. Agent, friend, FB ad" />
                            </Field>
                        </div>
                    </Section>

                    {/* Pipeline */}
                    <Section title="Pipeline">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <Field label="Department" hint="Pick the team that owns this student right now">
                                <select
                                    value={form.department}
                                    onChange={(e) => {
                                        // Switching department clears whatever
                                        // stage / assignee was set under the
                                        // previous list so we don't carry an
                                        // invalid value over.
                                        const next = e.target.value;
                                        setForm((f) => ({ ...f, department: next, stage: "", assignee: "" }));
                                    }}
                                    className={ICls}
                                >
                                    {Object.entries(STAGES_BY_DEPARTMENT).map(([key, cfg]) => (
                                        <option key={key} value={key}>{cfg.label}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Stage" hint={`${STAGES_BY_DEPARTMENT[form.department]?.label || "—"} pipeline`}>
                                <select value={form.stage} onChange={set("stage")} className={ICls}>
                                    <option value="">Not started</option>
                                    {(STAGES_BY_DEPARTMENT[form.department]?.stages || []).map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </Field>
                            {STAGE_ASSIGNEES[form.department] && (
                                <Field label="Assigned person" hint={`Who's handling this ${STAGES_BY_DEPARTMENT[form.department].label} stage`}>
                                    <select value={form.assignee} onChange={set("assignee")} className={ICls}>
                                        <option value="">— Unassigned —</option>
                                        {STAGE_ASSIGNEES[form.department].map((p) => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </Field>
                            )}
                            <Field label="Date engaged" hint="When they became engaged · optional">
                                <input type="date" value={form.date_of_engagement} onChange={set("date_of_engagement")} className={ICls} />
                            </Field>
                            <Field label="Program offered" hint="Pick from list or type a custom title">
                                <input
                                    type="text"
                                    list="program-suggestions"
                                    value={form.program_text}
                                    onChange={set("program_text")}
                                    className={ICls}
                                    maxLength={191}
                                    placeholder="Start typing…"
                                />
                                <datalist id="program-suggestions">
                                    {/* Dedupe by title — the catalog has a few
                                        duplicate-title rows that would
                                        otherwise repeat in the dropdown. */}
                                    {Array.from(new Map(programOptions.map((p) => [p.title, p])).values()).map((p) => (
                                        <option key={p.id} value={p.title} />
                                    ))}
                                </datalist>
                            </Field>
                            <Field label="School" hint="Optional">
                                <select value={form.school_id} onChange={set("school_id")} className={ICls}>
                                    <option value="">— Not set —</option>
                                    {schoolOptions.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}{(s.country || s.city) ? ` · ${[s.city, s.country].filter(Boolean).join(", ")}` : ""}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Intake" hint="Optional">
                                <input type="text" value={form.intake} onChange={set("intake")} className={ICls} placeholder="e.g. February 2027" maxLength={120} />
                            </Field>
                        </div>
                    </Section>

                    {/* Finance & docs */}
                    <Section title="Finance & documents">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <Field label="Payment" hint="Optional">
                                <input type="text" value={form.payment} onChange={set("payment")} className={ICls} placeholder="e.g. PhP 150,000" maxLength={191} />
                            </Field>
                            <Field label="PTE / IELTS" hint="Optional">
                                <select value={form.english_test} onChange={set("english_test")} className={ICls}>
                                    <option value="">— Not set —</option>
                                    <option>PTE</option>
                                    <option>IELTS</option>
                                    <option>TOEFL</option>
                                    <option>Other</option>
                                </select>
                            </Field>
                            <CoopOopField label="COOP" value={form.coop} onChange={(v) => setVal("coop", v)} />
                            <CoopOopField label="OOP"  value={form.oop}  onChange={(v) => setVal("oop",  v)} />
                        </div>
                    </Section>

                    {/* Internal note */}
                    <Section title="Notes">
                        <Field label="Internal note" hint="Optional · visible to staff only">
                            <textarea value={form.internal_note} onChange={set("internal_note")} rows={3} maxLength={5000} className={`${ICls} resize-y`} placeholder="Latest update, next action, blockers…" />
                        </Field>
                    </Section>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50">
                    <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 rounded-lg text-[12px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-40">
                        Cancel
                    </button>
                    <button type="button" onClick={submit} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-[12px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-40">
                        <Save size={12} />
                        {saving ? "Saving…" : editing ? "Save changes" : "Add student"}
                    </button>
                </div>
            </div>
        </div>
    );
}

const ICls = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:border-gray-400 outline-none transition-colors";

function Section({ title, children }) {
    return (
        <section className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500">{title}</h3>
            {children}
        </section>
    );
}

function Field({ label, required, hint, children }) {
    return (
        <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {hint && <p className="mt-1 text-[10px] text-gray-400">{hint}</p>}
        </div>
    );
}

// COOP / OOP field — Yes / No quick chips with a "Date" tab that
// flips the input into a date picker. The raw string is what gets
// saved (matches the existing student_coop / student_oop columns).
function CoopOopField({ label, value, onChange }) {
    const presetMatch = COOP_OOP_PRESETS.find((p) => p.toLowerCase() === String(value).toLowerCase());
    const looksLikeDate = useMemo(() => /^\d{4}-\d{2}-\d{2}$/.test(value || ""), [value]);
    const initialMode = presetMatch ? "preset" : (looksLikeDate || value) ? "date" : "preset";
    const [mode, setMode] = useState(initialMode);

    useEffect(() => { setMode(initialMode); }, [initialMode]);

    return (
        <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                {label} <span className="font-normal text-gray-400 normal-case">· Optional</span>
            </label>
            <div className="flex items-center gap-1.5 mb-1.5">
                {COOP_OOP_PRESETS.map((p) => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => { setMode("preset"); onChange(value === p ? "" : p); }}
                        className={`px-3 py-1 rounded-md text-[11px] font-bold border ${
                            value === p
                                ? "bg-gray-900 text-white border-gray-900"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                        {p}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={() => { setMode("date"); if (presetMatch) onChange(""); }}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold border ${
                        mode === "date"
                            ? "bg-gray-900 text-white border-gray-900"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                >
                    Date
                </button>
            </div>
            {mode === "date" && (
                <input
                    type="date"
                    value={looksLikeDate ? value : ""}
                    onChange={(e) => onChange(e.target.value)}
                    className={ICls}
                />
            )}
        </div>
    );
}
