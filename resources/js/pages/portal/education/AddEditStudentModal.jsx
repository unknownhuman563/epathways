import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import { X, Save, AlertTriangle, GraduationCap, ChevronDown, Search } from "lucide-react";

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

// Multiple selected programs are stored joined by this delimiter in the single
// program_text / preferred_course string field.
const PROGRAM_DELIM = " · ";

// localStorage key for the new-student draft so a user who cancels
// accidentally (or refreshes) can resume from where they left off.
const DRAFT_KEY = "education.newStudent.draft";

const blankForm = () => ({
    first_name: "", middle_name: "", last_name: "", suffix: "",
    gender: "", email: "", phone: "", referral: "", agent_id: "", location: "",
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
    agentOptions   = [],
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
            agent_id:        student.agent_id != null ? String(student.agent_id) : "",
            location:        student.location                           ?? "",
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

    // Programs are multi-select — stored as a PROGRAM_DELIM-joined string in
    // program_text so the backend keeps working with one column.
    const setProgramTitles = (titles) => setForm((f) => ({ ...f, program_text: titles.join(PROGRAM_DELIM) }));

    // When a catalog program is picked, auto-fill the School to match — by
    // school_id, or by matching its institution against the school list —
    // but only when the School is still empty, so it doesn't fight later picks.
    const autofillSchool = (program) => {
        if (! program) return;
        setForm((f) => {
            if (f.school_id) return f;
            let sid = program.school_id != null && program.school_id !== "" ? String(program.school_id) : "";
            if (! sid && program.institution) {
                const inst = String(program.institution).toLowerCase();
                const match = schoolOptions.find(
                    (s) => s.name?.toLowerCase() === inst || s.name?.toLowerCase().includes(inst),
                );
                if (match) sid = String(match.id);
            }
            return sid ? { ...f, school_id: sid } : f;
        });
    };

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
                            <Field label="Referring agent" hint="Recruiting agent who referred them · optional">
                                <select value={form.agent_id} onChange={set("agent_id")} className={ICls}>
                                    <option value="">— No agent —</option>
                                    {agentOptions.map((a) => (
                                        <option key={a.id} value={String(a.id)}>{a.name}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Location" hint="Country only · optional">
                                <input type="text" value={form.location} onChange={set("location")} className={ICls} maxLength={120} placeholder="e.g. Philippines" />
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
                            <Field label="Program offered" hint="Search or select one or more — the School auto-fills to match">
                                <ProgramMultiSelect
                                    value={form.program_text}
                                    delim={PROGRAM_DELIM}
                                    options={programOptions}
                                    onChange={setProgramTitles}
                                    onAutofillSchool={autofillSchool}
                                />
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
                            <Field label="Intake" hint="Intake start date · optional">
                                <input type="date" value={form.intake} onChange={set("intake")} className={ICls} />
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

// Multi-select program picker. Selected programs show as removable chips;
// type to filter the catalog and click to add, or press Enter to keep a
// free-typed custom title. Picking a catalog program auto-fills the School.
// Selections are held in the parent as a `delim`-joined string.
function ProgramMultiSelect({ value = "", delim = " · ", options = [], onChange, onAutofillSchool }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const boxRef = useRef(null);

    useEffect(() => {
        const onDoc = (e) => { if (boxRef.current && ! boxRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const selected = value ? value.split(delim).map((s) => s.trim()).filter(Boolean) : [];
    const deduped = useMemo(
        () => Array.from(new Map((options || []).map((p) => [p.title, p])).values()),
        [options],
    );
    const q = query.trim().toLowerCase();
    const available = deduped.filter((p) => ! selected.includes(p.title));
    const filtered = q ? available.filter((p) => p.title?.toLowerCase().includes(q)) : available;

    const add = (title, program) => {
        if (! title || selected.includes(title)) return;
        onChange?.([...selected, title]);
        if (program) onAutofillSchool?.(program);
        setQuery("");
    };
    const remove = (title) => onChange?.(selected.filter((t) => t !== title));

    const onKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const typed = query.trim();
            if (! typed) return;
            const match = deduped.find((p) => p.title?.toLowerCase() === typed.toLowerCase());
            add(match ? match.title : typed, match || null);
        } else if (e.key === "Backspace" && ! query && selected.length) {
            remove(selected[selected.length - 1]);
        }
    };

    return (
        <div ref={boxRef} className="relative">
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {selected.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-gray-100 text-gray-800 text-[12px] font-medium border border-gray-200">
                            <span className="truncate max-w-[220px]">{t}</span>
                            <button type="button" onClick={() => remove(t)} className="w-4 h-4 rounded-full text-gray-400 hover:text-red-600 hover:bg-white flex items-center justify-center">
                                <X size={11} />
                            </button>
                        </span>
                    ))}
                </div>
            )}
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={onKeyDown}
                    className={`${ICls} pr-8`}
                    maxLength={191}
                    placeholder={selected.length ? "Add another program…" : "Search or type a program…"}
                />
                <ChevronDown
                    size={15}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
            </div>
            {open && (
                <div className="absolute z-30 mt-1 left-0 right-0 max-h-60 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                    {filtered.length === 0 ? (
                        <p className="px-3 py-2 text-[12px] text-gray-400 flex items-center gap-1.5">
                            <Search size={12} /> {query ? `Press Enter to add “${query}”` : "All programs added."}
                        </p>
                    ) : filtered.slice(0, 60).map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => add(p.title, p)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between gap-2"
                        >
                            <span className="text-sm text-gray-800 truncate">{p.title}</span>
                            {p.level ? <span className="text-[10px] text-gray-400 flex-shrink-0 tabular-nums">Lvl {p.level}</span> : null}
                        </button>
                    ))}
                </div>
            )}
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
