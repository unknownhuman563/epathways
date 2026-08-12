import { useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { toast } from "sonner";
import { FileSpreadsheet, FileText, CheckCircle2, Clock, Save, ChevronLeft } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";

// Lead portal → Visa Forms. Each form the case sent is filled here: the official
// INZ PDF previews on the left, the fill-up inputs on the right. Submitting sends
// the answers back to the adviser, who merges them into the official PDF — the
// client never files anything themselves.

const STATUS = {
    assigned:  { label: "To fill",   tone: "bg-amber-50 text-amber-700 border-amber-200",     icon: Clock },
    submitted: { label: "Submitted", tone: "bg-[#009688]/10 text-[#009688] border-[#009688]/30", icon: CheckCircle2 },
    reviewed:  { label: "Reviewed",  tone: "bg-gray-100 text-gray-600 border-gray-200",         icon: CheckCircle2 },
};

export default function LeadVisaForms({ lead, forms = [] }) {
    const [openId, setOpenId] = useState(null);
    const open = useMemo(() => forms.find((f) => f.id === openId) || null, [forms, openId]);

    if (open) {
        return <FormEditor form={open} onBack={() => setOpenId(null)} />;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <Head title="Visa Forms" />
            <PortalPageHeader
                eyebrow="Application"
                title="Visa Forms"
                description="Forms your adviser has asked you to complete. Fill them in here — your adviser reviews your answers before anything is filed."
            />

            {forms.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                    <FileSpreadsheet size={26} className="mx-auto text-gray-300" />
                    <p className="mt-3 text-sm text-gray-700 font-medium">No forms to fill right now</p>
                    <p className="text-xs text-gray-500 mt-1">When your adviser sends you a form, it will appear here.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {forms.map((f) => {
                        const st = STATUS[f.status] || STATUS.assigned;
                        const Icon = st.icon;
                        return (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => setOpenId(f.id)}
                                className="w-full text-left rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-4 flex items-center gap-4 hover:border-[#009688]/40 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-xl bg-[#009688]/10 flex items-center justify-center flex-shrink-0">
                                    <FileText size={18} className="text-[#009688]" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-semibold text-gray-900">{f.code}</span>
                                        {f.version && <span className="text-[10px] font-semibold text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">{f.version}</span>}
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${st.tone}`}>
                                            <Icon size={10} />{st.label}
                                        </span>
                                    </div>
                                    <p className="text-[12px] text-gray-500 truncate mt-0.5">{f.name}</p>
                                </div>
                                <span className="text-[12px] font-semibold text-[#009688] flex-shrink-0">
                                    {f.status === "assigned" ? "Fill in" : "View"}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function FormEditor({ form, onBack }) {
    const readOnly = form.status !== "assigned";
    const [values, setValues] = useState(() => {
        const init = {};
        (form.fields || []).forEach((fl) => { init[fl.key] = fl.value ?? ""; });
        return init;
    });
    const [saving, setSaving] = useState(false);

    const submit = () => {
        setSaving(true);
        router.post(`/portal/lead/visa-forms/${form.id}`, { field_values: values }, {
            preserveScroll: true,
            onSuccess: () => { toast.success("Submitted to your adviser"); onBack(); },
            onError: (e) => toast.error(Object.values(e)[0] || "Could not submit"),
            onFinish: () => setSaving(false),
        });
    };

    return (
        <div className="space-y-5 max-w-6xl mx-auto pb-12">
            <Head title={`${form.code} — Visa Forms`} />

            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#009688] mb-2">
                        <ChevronLeft size={14} /> All forms
                    </button>
                    <h1 className="text-2xl font-medium text-[#282728] tracking-tight">{form.code}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{form.name}</p>
                </div>
                {! readOnly && (
                    <button type="button" onClick={submit} disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#009688] text-white text-sm font-semibold hover:bg-[#38512c] disabled:opacity-50">
                        <Save size={15} /> {saving ? "Submitting…" : "Submit to adviser"}
                    </button>
                )}
            </div>

            {readOnly && (
                <div className="rounded-xl border border-[#009688]/20 bg-[#009688]/5 px-4 py-3 text-[13px] text-[#009688] font-medium">
                    You've submitted this form. Your adviser is reviewing your answers — no further action needed.
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-5">
                {/* Left — official PDF preview */}
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                        <FileText size={14} className="text-gray-400" />
                        <span className="text-xs font-semibold text-gray-600">Official form preview</span>
                    </div>
                    {form.preview_url ? (
                        <iframe title={`${form.code} preview`} src={form.preview_url} className="w-full h-[70vh] bg-gray-50" />
                    ) : (
                        <div className="h-[70vh] flex items-center justify-center text-center px-6">
                            <p className="text-sm text-gray-400">Preview isn't available for this form yet.</p>
                        </div>
                    )}
                </div>

                {/* Right — fill-up inputs */}
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                        <FileSpreadsheet size={14} className="text-gray-400" />
                        <span className="text-xs font-semibold text-gray-600">Your details</span>
                    </div>
                    <div className="p-4 space-y-3.5 max-h-[70vh] overflow-y-auto">
                        {(form.fields || []).length === 0 ? (
                            <p className="text-sm text-gray-400 py-8 text-center">This form has no fields to fill.</p>
                        ) : (
                            (form.fields || []).map((fl) => (
                                <div key={fl.key}>
                                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{fl.label}</label>
                                    <input
                                        type="text"
                                        value={values[fl.key] ?? ""}
                                        onChange={(e) => setValues((v) => ({ ...v, [fl.key]: e.target.value }))}
                                        readOnly={readOnly}
                                        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
                                            readOnly
                                                ? "border-gray-100 bg-gray-50 text-gray-500"
                                                : "border-gray-200 focus:border-[#009688] focus:ring-1 focus:ring-[#009688]"
                                        }`}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
