import React from "react";
import { UploadCloud, X, Calendar } from "lucide-react";

/**
 * Full consultation intake form — our own version of the old LazyMagnet form,
 * shown after a date + time is picked. Every value is stored on the shared
 * `info` object via onChange({...}); files are held as File[] per slot and
 * submitted as multipart by the caller.
 */
const GENDERS = ["Male", "Female"];
const CIVIL_STATUS = ["Single", "Married", "Widowed", "Separated/Divorced", "Single with Partner"];
const EDUCATION_LEVELS = [
    "Doctorate (PhD / EdD / DBA)",
    "Master's Degree",
    "Postgraduate Diploma / Certificate",
    "Bachelor's Degree",
    "Associate Degree",
    "Technical-Vocational (TESDA / TVET)",
    "High School Graduate",
    "Other",
];
const PATHWAYS = [
    "Study Pathway",
    "Work Pathway",
    "Residency Pathway",
    "Not sure yet",
];
const BRING_CHILDREN = ["Yes", "No", "Other"];

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#436235]/30 focus:border-[#436235]";
const labelCls = "block text-sm font-medium text-gray-800 mb-1.5";

function Field({ label, required, children, hint }) {
    return (
        <div>
            <label className={labelCls}>{label}{required && <span className="text-rose-500"> *</span>}</label>
            {children}
            {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
        </div>
    );
}

function RadioGroup({ options, value, onChange }) {
    return (
        <div className="space-y-1.5">
            {options.map((o) => (
                <label key={o} className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-700">
                    <input type="radio" checked={value === o} onChange={() => onChange(o)} className="text-[#436235] focus:ring-[#436235]" />
                    {o}
                </label>
            ))}
        </div>
    );
}

function FileDrop({ label, field, files = [], onChange }) {
    const inputId = `file-${field}`;
    const pick = (e) => {
        const picked = Array.from(e.target.files || []);
        onChange({ [field]: [...files, ...picked].slice(0, 10) });
    };
    const remove = (i) => onChange({ [field]: files.filter((_, idx) => idx !== i) });
    return (
        <Field label={label}>
            <label htmlFor={inputId} className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl border border-dashed border-gray-300 bg-gray-50/60 cursor-pointer hover:border-[#436235] hover:bg-[#436235]/5 transition-colors">
                <UploadCloud size={22} className="text-gray-400" />
                <span className="text-[11px] text-gray-400">PDF, DOC/DOCX, XLS/CSV, JPG/JPEG, PNG, GIF ( max 10 files )</span>
                <input id={inputId} type="file" multiple accept=".pdf,.doc,.docx,.xls,.csv,.jpg,.jpeg,.png,.gif" onChange={pick} className="hidden" />
            </label>
            {files.length > 0 && (
                <ul className="mt-2 space-y-1">
                    {files.map((f, i) => (
                        <li key={i} className="flex items-center justify-between gap-2 text-xs bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                            <span className="truncate text-gray-600">{f.name}</span>
                            <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-rose-500"><X size={13} /></button>
                        </li>
                    ))}
                </ul>
            )}
        </Field>
    );
}

function SectionTitle({ children }) {
    return <h3 className="text-base font-bold text-[#282728] border-b border-gray-100 pb-2">{children}</h3>;
}

export default function ConsultationForm({ info, onChange, onConfirm, isSubmitting, error }) {
    const set = (k) => (e) => onChange({ [k]: e.target.value });
    const canSubmit =
        info.fullName?.trim() &&
        info.email?.trim() &&
        info.phoneNumber?.trim() &&
        info.educationAttainment &&
        info.consentFollowup &&
        !isSubmitting;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 space-y-8">
            <p className="text-sm text-gray-600 leading-relaxed">
                <span className="font-bold">Welcome to ePathways</span> — please complete this form so we can better assess your goals and prepare for your consultation.
            </p>

            {/* Personal Information */}
            <div className="space-y-5">
                <SectionTitle>Personal Information</SectionTitle>
                <Field label="Full Name" required>
                    <input className={inputCls} placeholder="First and Last Name" value={info.fullName || ""} onChange={set("fullName")} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Age"><input type="number" min="0" className={inputCls} placeholder="Age" value={info.age || ""} onChange={set("age")} /></Field>
                    <Field label="Gender">
                        <div className="flex gap-6 pt-1.5">
                            {GENDERS.map((g) => (
                                <label key={g} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="radio" checked={info.gender === g} onChange={() => onChange({ gender: g })} className="text-[#436235] focus:ring-[#436235]" /> {g}
                                </label>
                            ))}
                        </div>
                    </Field>
                </div>
                <Field label="Civil Status">
                    <RadioGroup options={CIVIL_STATUS} value={info.maritalStatus} onChange={(v) => onChange({ maritalStatus: v })} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Email" required><input type="email" className={inputCls} placeholder="you@email.com" value={info.email || ""} onChange={set("email")} /></Field>
                    <Field label="Phone" required><input className={inputCls} placeholder="0905 123 4567" value={info.phoneNumber || ""} onChange={set("phoneNumber")} /></Field>
                    <Field label="City"><input className={inputCls} placeholder="Enter your city" value={info.city || ""} onChange={set("city")} /></Field>
                    <Field label="Current Location"><input className={inputCls} placeholder="Current Location" value={info.currentLocation || ""} onChange={set("currentLocation")} /></Field>
                    <Field label="Country of Origin"><input className={inputCls} placeholder="Country" value={info.countryOfOrigin || ""} onChange={set("countryOfOrigin")} /></Field>
                </div>
            </div>

            {/* Education & Interest */}
            <div className="space-y-5">
                <SectionTitle>Education &amp; Interest</SectionTitle>
                <Field label="Current Education Attainment" required>
                    <select className={inputCls} value={info.educationAttainment || ""} onChange={set("educationAttainment")}>
                        <option value="">Select…</option>
                        {EDUCATION_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                </Field>
                <Field label="If Bachelor's Degree, what course/program?">
                    <input className={inputCls} value={info.bachelorCourse || ""} onChange={set("bachelorCourse")} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Current Job / Occupation"><input className={inputCls} value={info.occupation || ""} onChange={set("occupation")} /></Field>
                    <Field label="What pathway are you interested in?">
                        <select className={inputCls} value={info.pathway || ""} onChange={set("pathway")}>
                            <option value="">Select…</option>
                            {PATHWAYS.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </Field>
                </div>
            </div>

            {/* Partner / Spouse */}
            <div className="space-y-5">
                <SectionTitle>Partner / Spouse Information</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Full Name of Partner/Spouse"><input className={inputCls} placeholder="First and Last Name" value={info.partnerName || ""} onChange={set("partnerName")} /></Field>
                    <Field label="Age of Partner/Spouse"><input type="number" min="0" className={inputCls} value={info.partnerAge || ""} onChange={set("partnerAge")} /></Field>
                </div>
                <Field label="Partner/Spouse CURRENT EDUCATION LEVEL?">
                    <RadioGroup options={EDUCATION_LEVELS} value={info.partnerEducationLevel} onChange={(v) => onChange({ partnerEducationLevel: v })} />
                </Field>
                {info.partnerEducationLevel === "Other" && (
                    <Field label="Other: Partner/Spouse CURRENT EDUCATION LEVEL"><input className={inputCls} value={info.partnerEducationOther || ""} onChange={set("partnerEducationOther")} /></Field>
                )}
                <Field label="Partner/Spouse CURRENT WORK EXPERIENCE"><textarea rows={3} className={`${inputCls} resize-y`} value={info.partnerWorkExperience || ""} onChange={set("partnerWorkExperience")} /></Field>
                <Field label="Partner/Spouse YEARS OF EXPERIENCE"><textarea rows={2} className={`${inputCls} resize-y`} value={info.partnerYearsExperience || ""} onChange={set("partnerYearsExperience")} /></Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Number of Children (if any)"><input type="number" min="0" className={inputCls} value={info.numberOfChildren || ""} onChange={set("numberOfChildren")} /></Field>
                    <Field label="Child Age" hint="Please list separated by commas, e.g. 5, 8, 12"><input className={inputCls} value={info.childAges || ""} onChange={set("childAges")} /></Field>
                </div>
                <Field label="Will you bring your children">
                    <div className="flex gap-6">
                        {BRING_CHILDREN.map((o) => (
                            <label key={o} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="radio" checked={info.bringChildren === o} onChange={() => onChange({ bringChildren: o })} className="text-[#436235] focus:ring-[#436235]" /> {o}
                            </label>
                        ))}
                    </div>
                </Field>
                {info.bringChildren === "Other" && (
                    <Field label="Other: Will you bring your children"><input className={inputCls} value={info.bringChildrenOther || ""} onChange={set("bringChildrenOther")} /></Field>
                )}
            </div>

            {/* Additional */}
            <Field label="Additional Information (Optional) — any specific question for our advisor?">
                <textarea rows={3} className={`${inputCls} resize-y`} placeholder="You can write them here and we'll try to address them during the consultation" value={info.message || ""} onChange={set("message")} />
            </Field>

            {/* Documents */}
            <div className="space-y-5">
                <SectionTitle>Documents</SectionTitle>
                <p className="text-sm text-gray-600 leading-relaxed">
                    Please upload the required documents so we can assess your qualifications before the meeting. You may submit your CV first (required to prepare your proposal); the rest can follow later.
                </p>
                <FileDrop label="Attach CV" field="cvFiles" files={info.cvFiles} onChange={onChange} />
                <FileDrop label="Passport" field="passportFiles" files={info.passportFiles} onChange={onChange} />
                <FileDrop label="Diploma" field="diplomaFiles" files={info.diplomaFiles} onChange={onChange} />
                <FileDrop label="Transcript of Record" field="transcriptFiles" files={info.transcriptFiles} onChange={onChange} />
            </div>

            {/* Consent */}
            <div className="space-y-3">
                <label className="flex items-start gap-2.5 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={!!info.consentFollowup} onChange={(e) => onChange({ consentFollowup: e.target.checked })} className="mt-0.5 text-[#436235] focus:ring-[#436235]" />
                    I consent to receive follow-up communication regarding this consultation, including reminders and related offers from ePathways.
                </label>
                <label className="flex items-start gap-2.5 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={!!info.consentRecording} onChange={(e) => onChange({ consentRecording: e.target.checked })} className="mt-0.5 text-[#436235] focus:ring-[#436235]" />
                    I understand that the consultation may be recorded for future viewing purposes.
                </label>
            </div>

            {/* Selected slot summary */}
            {info.appointmentDate && info.appointmentTime && (
                <div className="flex items-center gap-2 text-sm text-[#436235] bg-[#436235]/5 border border-[#436235]/15 rounded-xl px-3 py-2">
                    <Calendar size={15} /> {info.appointmentDate} · {info.appointmentTime} (consultant's time)
                </div>
            )}

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
                type="button"
                onClick={onConfirm}
                disabled={!canSubmit}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#436235] text-white text-sm font-semibold rounded-xl hover:bg-[#375029] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isSubmitting ? "Confirming…" : "Confirm booking"}
            </button>
            <p className="text-[11px] text-gray-400 text-center">You'll receive a confirmation email once your booking is submitted.</p>
        </div>
    );
}
