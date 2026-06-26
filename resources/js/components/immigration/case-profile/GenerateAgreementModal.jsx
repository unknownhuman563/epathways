import { useEffect, useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight, FileSignature, AlertCircle, Loader2 } from "lucide-react";

// Build 11.D Phase 2 — Three-step modal: pick template -> fill variables -> preview & generate.
// Posts to /portal/immigration/cases/{lead}/agreements; parent refreshes on success.

const AUTO_VARIABLE_KEYS = new Set([
    "client_name", "client_email", "client_phone",
    "visa_type", "agreement_date",
    "consultant_name", "consultancy_name",
]);

export default function GenerateAgreementModal({ lead, onClose, onGenerated }) {
    const [step, setStep] = useState(1);
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [extras, setExtras] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await fetch(`/portal/immigration/cases/${lead.id}/agreements/templates`, {
                    credentials: "same-origin",
                    headers: { "Accept": "application/json", "X-Requested-With": "XMLHttpRequest" },
                });
                const data = await res.json();
                if (alive) {
                    setTemplates(data.templates || []);
                    if ((data.templates || []).length === 1) setSelectedId(data.templates[0].id);
                }
            } finally {
                if (alive) setLoadingTemplates(false);
            }
        })();
        return () => { alive = false; };
    }, [lead.id]);

    const selectedTemplate = useMemo(
        () => templates.find((t) => t.id === selectedId) || null,
        [templates, selectedId],
    );

    const requiredVars = selectedTemplate?.required_variables || [];

    // Variables the template body actually references, minus auto-resolved.
    const promptVars = useMemo(() => {
        if (! selectedTemplate?.body) return [];
        const matches = [...selectedTemplate.body.matchAll(/\{\{\s*(\w+)\s*\}\}/g)];
        const seen = new Set();
        return matches
            .map((m) => m[1])
            .filter((k) => ! AUTO_VARIABLE_KEYS.has(k) && ! seen.has(k) && seen.add(k));
    }, [selectedTemplate]);

    const missingRequired = useMemo(
        () => requiredVars.filter((k) => ! (extras[k] || "").trim()),
        [requiredVars, extras],
    );

    const renderPreview = useMemo(() => {
        if (! selectedTemplate?.body) return "";
        const variables = {
            client_name:      `${lead.first_name || ""} ${lead.last_name || ""}`.trim() || "Client",
            client_email:     lead.email || "",
            client_phone:     lead.phone || "",
            visa_type:        lead.inz_visa_type || "Visa application",
            agreement_date:   new Date().toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" }),
            consultant_name:  "(you)",
            consultancy_name: "ePathways",
            ...extras,
        };
        return selectedTemplate.body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) =>
            variables[k] !== undefined && variables[k] !== "" ? variables[k] : `[${k} not provided]`
        );
    }, [selectedTemplate, extras, lead]);

    const submit = async () => {
        if (submitting || ! selectedTemplate) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch(`/portal/immigration/cases/${lead.id}/agreements`, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    ...csrfHeaders(),
                },
                body: JSON.stringify({
                    agreement_template_id: selectedTemplate.id,
                    extra_variables: extras,
                }),
            });
            if (! res.ok) {
                const data = await res.json().catch(() => ({}));
                if (data.missing) {
                    setError(`Missing required variables: ${data.missing.join(", ")}`);
                    setStep(2);
                } else {
                    setError(data.message || `Generation failed (HTTP ${res.status})`);
                }
                return;
            }
            onGenerated?.();
        } catch (e) {
            setError(e?.message || "Generation failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-gray-900 inline-flex items-center gap-2">
                            <FileSignature size={15} className="text-gray-400" />
                            Generate agreement
                        </h2>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                            Step {step} of 3 · {step === 1 ? "Select template" : step === 2 ? "Fill variables" : "Preview & confirm"}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
                        <X size={18} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-100 text-xs text-red-800">
                            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <TemplateStep
                            templates={templates}
                            loading={loadingTemplates}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                        />
                    )}
                    {step === 2 && (
                        <VariableStep
                            template={selectedTemplate}
                            promptVars={promptVars}
                            requiredVars={requiredVars}
                            extras={extras}
                            onChange={(k, v) => setExtras((p) => ({ ...p, [k]: v }))}
                            lead={lead}
                        />
                    )}
                    {step === 3 && <PreviewStep content={renderPreview} />}
                </div>

                <footer className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900"
                    >
                        <ChevronLeft size={13} /> {step === 1 ? "Cancel" : "Back"}
                    </button>

                    {step < 3 ? (
                        <button
                            type="button"
                            disabled={(step === 1 && ! selectedId) || (step === 2 && missingRequired.length > 0)}
                            onClick={() => setStep(step + 1)}
                            className="inline-flex items-center gap-1 px-4 py-2 rounded-md text-xs font-semibold bg-gray-900 text-white hover:bg-black disabled:opacity-50"
                        >
                            Next <ChevronRight size={13} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={submit}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold bg-gray-900 text-white hover:bg-black disabled:opacity-50"
                        >
                            {submitting && <Loader2 size={13} className="animate-spin" />}
                            Generate draft
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
}

function TemplateStep({ templates, loading, selectedId, onSelect }) {
    if (loading) return <p className="text-sm text-gray-500">Loading templates…</p>;
    if (templates.length === 0) {
        return (
            <p className="text-sm text-gray-500">
                No active templates available. An admin can add templates in a future build.
            </p>
        );
    }
    return (
        <ul className="space-y-2">
            {templates.map((t) => {
                const active = t.id === selectedId;
                return (
                    <li key={t.id}>
                        <button
                            type="button"
                            onClick={() => onSelect(t.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                                active
                                    ? "border-gray-900 bg-gray-50"
                                    : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                        >
                            <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                                {t.visa_type || "Generic — applies to any visa"}
                                {Array.isArray(t.required_variables) && t.required_variables.length > 0 && (
                                    <> · Requires: {t.required_variables.join(", ")}</>
                                )}
                            </p>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}

function VariableStep({ template, promptVars, requiredVars, extras, onChange, lead }) {
    return (
        <div className="space-y-5">
            <section>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Auto-resolved</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <Auto label="Client name" value={`${lead.first_name || ""} ${lead.last_name || ""}`.trim()} />
                    <Auto label="Client email" value={lead.email} />
                    <Auto label="Visa type" value={lead.inz_visa_type || "—"} />
                    <Auto label="Date" value={new Date().toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" })} />
                </dl>
            </section>

            {promptVars.length === 0 ? (
                <p className="text-xs text-gray-500 italic">
                    This template doesn't reference any extra variables — go straight to preview.
                </p>
            ) : (
                <section>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Fill in</h3>
                    <div className="space-y-3">
                        {promptVars.map((key) => {
                            const required = requiredVars.includes(key);
                            return (
                                <div key={key}>
                                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                        {prettyLabel(key)}
                                        {required && <span className="ml-1 text-red-500">*</span>}
                                    </label>
                                    <input
                                        type="text"
                                        value={extras[key] || ""}
                                        onChange={(e) => onChange(key, e.target.value)}
                                        placeholder={required ? "Required" : "Optional"}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-900"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
}

function Auto({ label, value }) {
    return (
        <div>
            <dt className="text-[10px] uppercase tracking-wider text-gray-400">{label}</dt>
            <dd className="text-gray-900">{value || "—"}</dd>
        </div>
    );
}

function PreviewStep({ content }) {
    return (
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 max-h-[55vh] overflow-y-auto">
            <pre className="text-xs text-gray-900 whitespace-pre-wrap font-serif leading-relaxed">{content}</pre>
        </div>
    );
}

const prettyLabel = (key) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// CSRF: prefer the XSRF-TOKEN cookie (Laravel keeps it fresh on every
// response) and fall back to the meta tag from app.blade.php. See the
// matching helper in AgreementTab.jsx for the longer explanation.
function csrfHeaders() {
    const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="));
    const xsrf = cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
    const meta = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
    return xsrf
        ? { "X-XSRF-TOKEN": xsrf, "X-CSRF-TOKEN": meta }
        : { "X-CSRF-TOKEN": meta };
}
