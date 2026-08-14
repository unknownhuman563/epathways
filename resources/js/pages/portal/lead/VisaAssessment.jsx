import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { toast } from "sonner";
import { FileText, Sparkles, Download, CheckCircle2, Clock, Save, ChevronLeft } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import { ASSESSMENT_SECTIONS, fieldKind } from "@/data/assessmentSections";

// Lead portal → Visa Information Form + assessment editor. The client can edit
// their assessment answers here; saving updates their case and regenerates the
// official VIF automatically. They never upload the VIF — it's produced from
// their answers.

const ACCENT = "#009688";
const IC = "w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] transition-colors";

export default function LeadVisaAssessment({ vif = {}, assessment = null }) {
    const [busy, setBusy] = useState(false);

    const generate = () => {
        setBusy(true);
        router.post("/portal/lead/vif", {}, {
            preserveScroll: true,
            onSuccess: () => toast.success("Your Visa Information Form is ready"),
            onError: (e) => toast.error(Object.values(e)[0] || "Could not generate"),
            onFinish: () => setBusy(false),
        });
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-12">
            <Head title="Visa Information Form" />
            <Link href="/portal/lead/forms" className="inline-flex items-center gap-1 text-[13px] font-semibold text-gray-500 hover:text-gray-900">
                <ChevronLeft size={15} /> Back to Forms
            </Link>
            <PortalPageHeader
                eyebrow="Application"
                title="Visa Information Form"
                description="Keep your assessment answers up to date — saving refreshes your official Visa Information Form automatically."
            />

            {/* VIF card */}
            {!vif.available ? (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                    <FileText size={26} className="mx-auto text-gray-300" />
                    <p className="mt-3 text-sm text-gray-700 font-medium">No completed assessment yet</p>
                    <p className="text-xs text-gray-500 mt-1">Complete your visa assessment first — your form will be available to generate here.</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${ACCENT}1a` }}>
                            <FileText size={20} style={{ color: ACCENT }} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-base font-semibold text-gray-900">Visa Information Form</h2>
                            <p className="text-[13px] text-gray-500 mt-0.5">
                                Built from your assessment answers in the official ePathways format.
                            </p>

                            {vif.generated ? (
                                <div className="mt-4 flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-lg border" style={{ color: ACCENT, backgroundColor: `${ACCENT}1a`, borderColor: `${ACCENT}4d` }}>
                                        <CheckCircle2 size={14} /> Ready
                                    </span>
                                    {vif.generated_at && (
                                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                                            <Clock size={12} /> Updated {new Date(vif.generated_at).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <p className="mt-3 text-[12px] text-gray-500">Not generated yet — click below to create it.</p>
                            )}

                            <div className="mt-5 flex items-center gap-2 flex-wrap">
                                <button type="button" onClick={generate} disabled={busy}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                                    style={{ backgroundColor: ACCENT }}>
                                    <Sparkles size={15} /> {busy ? "Generating…" : vif.generated ? "Regenerate" : "Generate my form"}
                                </button>
                                {vif.generated && vif.download_url && (
                                    <a href={vif.download_url} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50">
                                        <Download size={15} /> Download
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Editable assessment */}
            {assessment && <AssessmentEditor assessment={assessment} />}
        </div>
    );
}

function AssessmentEditor({ assessment }) {
    const sections = ASSESSMENT_SECTIONS[assessment.type] || [];
    const [values, setValues] = useState(assessment.values || {});
    const [saving, setSaving] = useState(false);
    const setField = (k, v) => setValues((prev) => ({ ...prev, [k]: v }));

    const save = () => {
        setSaving(true);
        router.post(assessment.save_url, { field_values: values }, {
            preserveScroll: true,
            onSuccess: () => toast.success("Saved — your Visa Information Form has been updated"),
            onError: (e) => toast.error(Object.values(e)[0] || "Could not save"),
            onFinish: () => setSaving(false),
        });
    };

    const pct = assessment.stats?.pct ?? 0;

    return (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {/* Header + completeness */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">Your assessment</h2>
                        <p className="text-[13px] text-gray-500 mt-0.5">Update any answer below. When you save, your form is refreshed and your adviser is notified.</p>
                    </div>
                    <button type="button" onClick={save} disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                        style={{ backgroundColor: ACCENT }}>
                        <Save size={15} /> {saving ? "Saving…" : "Save changes"}
                    </button>
                </div>
                <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                        <span>Assessment completeness</span>
                        <span className="font-bold text-gray-700 tabular-nums">{pct}% · {assessment.stats?.filled}/{assessment.stats?.total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: ACCENT }} />
                    </div>
                </div>
            </div>

            {/* Fields, grouped by section */}
            <div className="p-6 space-y-7">
                {sections.map((sec) => (
                    <section key={sec.title}>
                        <h3 className="text-[13px] font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">{sec.title}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            {sec.fields.map(([key, label]) => (
                                <FieldInput key={key} fieldKey={key} label={label} value={values[key] ?? ""} onChange={(v) => setField(key, v)} />
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            {/* Save (again, at the bottom for long forms) */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50/50">
                <button type="button" onClick={save} disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                    style={{ backgroundColor: ACCENT }}>
                    <Save size={15} /> {saving ? "Saving…" : "Save changes"}
                </button>
            </div>
        </div>
    );
}

function FieldInput({ fieldKey, label, value, onChange }) {
    const kind = fieldKind(fieldKey);
    // Arrays (rare) fall back to a read-only summary — they aren't hand-editable here.
    const isArray = Array.isArray(value);

    return (
        <div className={kind === "textarea" ? "sm:col-span-2" : ""}>
            <label className="block text-[12px] font-medium text-gray-600 mb-1">{label}</label>
            {isArray ? (
                <p className="text-[13px] text-gray-400 py-2">{value.length ? `${value.length} entries — edit with your adviser` : "—"}</p>
            ) : kind === "yesno" ? (
                <select value={value} onChange={(e) => onChange(e.target.value)} className={IC}>
                    <option value="">—</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                </select>
            ) : kind === "date" ? (
                <input type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} className={IC} />
            ) : kind === "textarea" ? (
                <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} className={`${IC} resize-y`} />
            ) : (
                <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={IC} />
            )}
        </div>
    );
}
