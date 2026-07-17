import React, { useState, useMemo, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import { toast } from "sonner";
import {
    FileSignature, Search, Plus, X, Download, Check, AlertTriangle,
    FileText, Loader2, Mail,
} from "lucide-react";

/**
 * Engagement generation workspace. Staff click "New", pick a case, choose
 * which engagement documents to generate (Written Agreement + the three
 * IAA standard docs), preview each live, then generate. The Written
 * Agreement's fees are pulled from the case's visa on the Visas page.
 */
export default function Engagement({ cases = [], documents = [], generated = [], signers = [], me_id = null }) {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <div className="space-y-5 max-w-[1400px] mx-auto pb-12">
            <Head title="Engagement — Immigration" />

            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center">
                        <FileSignature size={18} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Engagement</h1>
                        <p className="text-sm text-gray-500">Generate engagement documents for a case.</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors flex items-center gap-2 flex-shrink-0"
                >
                    <Plus size={14} strokeWidth={2.5} /> New
                </button>
            </div>

            {/* Recently generated */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="px-5 py-3 border-b border-gray-100">
                    <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-gray-500">Generated documents</h2>
                </div>
                <div className="divide-y divide-gray-50">
                    {generated.length === 0 && (
                        <div className="px-5 py-12 text-center text-sm text-gray-400">
                            No engagement documents generated yet. Click <span className="font-semibold text-gray-600">New</span> to start.
                        </div>
                    )}
                    {generated.map((d) => (
                        <div key={d.id} className="flex items-center gap-4 px-5 py-3">
                            <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center flex-shrink-0">
                                <FileText size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-900 truncate">{d.type_label}</p>
                                <p className="text-[11px] text-gray-400 truncate">{d.case_name} · {d.name}</p>
                            </div>
                            <a
                                href={d.download_url}
                                className="text-xs font-semibold text-gray-800 hover:text-black inline-flex items-center gap-1.5 flex-shrink-0"
                            >
                                <Download size={14} /> Download
                            </a>
                        </div>
                    ))}
                </div>
            </div>

            {modalOpen && (
                <NewEngagementModal
                    cases={cases}
                    documents={documents}
                    signers={signers}
                    meId={me_id}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div>
    );
}

function NewEngagementModal({ cases, documents, signers = [], meId, onClose }) {
    const [caseSearch, setCaseSearch] = useState("");
    const [selectedCase, setSelectedCase] = useState(null);
    const [selectedTypes, setSelectedTypes] = useState(documents.map((d) => d.key));
    const [previewType, setPreviewType] = useState(documents[0]?.key ?? null);
    const [submitting, setSubmitting] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [notify, setNotify] = useState(true);
    // Default the signing adviser to the current user when they're eligible.
    const [signerId, setSignerId] = useState(() => {
        if (meId && signers.some((s) => s.id === meId)) return meId;
        return signers[0]?.id ?? null;
    });

    const selectedSigner = signers.find((s) => s.id === signerId) || null;

    const filteredCases = useMemo(() => {
        const q = caseSearch.trim().toLowerCase();
        if (!q) return cases.slice(0, 50);
        return cases.filter((c) =>
            [c.name, c.lead_id, c.email, c.inz_visa_type]
                .some((v) => (v || "").toString().toLowerCase().includes(q))
        ).slice(0, 50);
    }, [cases, caseSearch]);

    const toggleType = (key) => {
        setSelectedTypes((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    // Keep the preview tab valid: if it's not in the selected set, snap to
    // the first selected doc.
    useEffect(() => {
        if (!selectedTypes.includes(previewType)) {
            setPreviewType(selectedTypes[0] ?? null);
        }
    }, [selectedTypes, previewType]);

    // Reset the loading spinner whenever the previewed doc / case / signer changes.
    useEffect(() => {
        if (selectedCase && previewType) setPreviewLoading(true);
    }, [selectedCase, previewType, signerId]);

    const writtenSelected = selectedTypes.includes("written_agreement");
    const missingFees = selectedCase && writtenSelected &&
        (!selectedCase.professional_fees || !selectedCase.inz_application_fee);
    const missingSignature = writtenSelected && selectedSigner && !selectedSigner.has_signature;

    const previewUrl = selectedCase && previewType
        ? `/admin/leads/${selectedCase.id}/generate/engage_${previewType}/preview${signerId ? `?signer=${signerId}` : ""}`
        : null;

    const generate = () => {
        if (!selectedCase || selectedTypes.length === 0) return;
        setSubmitting(true);
        router.post(
            `/admin/leads/${selectedCase.id}/engagement/generate`,
            { types: selectedTypes, notify: notify && !!selectedCase.email, signer_id: signerId },
            {
                preserveScroll: true,
                onSuccess: () => { onClose(); },
                onError: () => { toast.error("Could not generate the documents."); },
                onFinish: () => setSubmitting(false),
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-[1500px] h-[94vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <FileSignature size={16} className="text-gray-700" /> New engagement documents
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>

                <div className="flex-1 flex min-h-0">
                    {/* Left: controls */}
                    <div className="w-[380px] border-r border-gray-100 flex flex-col min-h-0 flex-shrink-0">
                        {/* Case picker */}
                        <div className="p-4 border-b border-gray-100">
                            <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">Case</label>
                            {selectedCase ? (
                                <div className="mt-2 flex items-center gap-2 bg-gray-900 border border-gray-900 rounded-lg px-3 py-2.5">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-white truncate">{selectedCase.name}</p>
                                        <p className="text-[11px] text-gray-300 truncate">{selectedCase.inz_visa_type || "No visa set"}</p>
                                    </div>
                                    <button onClick={() => setSelectedCase(null)} className="text-gray-400 hover:text-white"><X size={15} /></button>
                                </div>
                            ) : (
                                <>
                                    <div className="relative mt-2">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            autoFocus
                                            value={caseSearch}
                                            onChange={(e) => setCaseSearch(e.target.value)}
                                            placeholder="Search a case…"
                                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:bg-white focus:border-gray-300"
                                        />
                                    </div>
                                    <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-gray-100 divide-y divide-gray-50">
                                        {filteredCases.length === 0 && (
                                            <div className="px-3 py-4 text-center text-xs text-gray-400">No cases found.</div>
                                        )}
                                        {filteredCases.map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() => setSelectedCase(c)}
                                                className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                                            >
                                                <p className="text-xs font-semibold text-gray-900 truncate">{c.name}</p>
                                                <p className="text-[10.5px] text-gray-400 truncate">{c.lead_id} · {c.inz_visa_type || "No visa"}</p>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Signing adviser */}
                        <div className="p-4 border-b border-gray-100">
                            <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">Signing adviser</label>
                            <select
                                value={signerId ?? ""}
                                onChange={(e) => setSignerId(e.target.value ? Number(e.target.value) : null)}
                                className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:bg-white focus:border-gray-300"
                            >
                                {signers.length === 0 && <option value="">No licensed advisers</option>}
                                {signers.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}{s.licence ? ` · ${s.licence}` : ""}{s.has_signature ? "" : " (no signature)"}
                                    </option>
                                ))}
                            </select>
                            {signers.length === 0 && (
                                <p className="mt-2 text-[11px] text-gray-400 leading-snug">
                                    Only licensed advisers can sign. Add an <span className="font-semibold">IAA licence number</span> on My Profile to appear here.
                                </p>
                            )}
                            {missingSignature && (
                                <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                    <AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-[11px] text-amber-700 leading-snug">
                                        This adviser has no signature yet — the agreement will show a blank signature line. Add one on <span className="font-semibold">My Profile</span>.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Document checklist */}
                        <div className="p-4 flex-1 overflow-y-auto">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">Documents</label>
                                <button
                                    onClick={() => setSelectedTypes(
                                        selectedTypes.length === documents.length ? [] : documents.map((d) => d.key)
                                    )}
                                    className="text-[11px] font-semibold text-gray-800 hover:text-black"
                                >
                                    {selectedTypes.length === documents.length ? "Clear all" : "Select all"}
                                </button>
                            </div>
                            <div className="mt-2 space-y-1.5">
                                {documents.map((d) => {
                                    const checked = selectedTypes.includes(d.key);
                                    const isPreview = previewType === d.key;
                                    return (
                                        <div
                                            key={d.key}
                                            className={`rounded-lg border px-3 py-2.5 transition-colors ${isPreview ? "border-gray-400 bg-gray-50" : "border-gray-100 bg-white"}`}
                                        >
                                            <div className="flex items-start gap-2.5">
                                                <button
                                                    onClick={() => toggleType(d.key)}
                                                    className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${checked ? "bg-gray-900 border-gray-900" : "bg-white border-gray-300"}`}
                                                >
                                                    {checked && <Check size={12} className="text-white" strokeWidth={3} />}
                                                </button>
                                                <button onClick={() => setPreviewType(d.key)} className="min-w-0 flex-1 text-left">
                                                    <p className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                                                        {d.label}
                                                        {d.dynamic && <span className="text-[9px] font-bold uppercase tracking-wide text-gray-700 bg-gray-200 rounded px-1 py-0.5">Auto-filled</span>}
                                                    </p>
                                                    <p className="text-[10.5px] text-gray-400 mt-0.5">{d.description}</p>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {missingFees && (
                                <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                                    <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-[11px] text-amber-700 leading-snug">
                                        This visa has no fees set on the <span className="font-semibold">Visas</span> page — the Written Agreement will show fee placeholders.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: live preview */}
                    <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
                        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 overflow-x-auto flex-shrink-0 bg-white">
                            <span className="text-[11px] font-semibold text-gray-400 flex-shrink-0">Preview:</span>
                            {selectedTypes.length === 0 && <span className="text-[11px] text-gray-400">Select a document</span>}
                            {documents.filter((d) => selectedTypes.includes(d.key)).map((d) => (
                                <button
                                    key={d.key}
                                    onClick={() => setPreviewType(d.key)}
                                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${previewType === d.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 relative min-h-0">
                            {!selectedCase ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                                    <FileText size={30} className="text-gray-300" />
                                    <p className="text-sm font-semibold text-gray-500 mt-2">Pick a case to preview</p>
                                    <p className="text-xs text-gray-400 mt-1">The live document preview will appear here.</p>
                                </div>
                            ) : previewUrl ? (
                                <>
                                    {previewLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-10">
                                            <Loader2 size={22} className="text-gray-700 animate-spin" />
                                        </div>
                                    )}
                                    <iframe
                                        key={previewUrl}
                                        src={previewUrl}
                                        title="Document preview"
                                        className="absolute inset-0 w-full h-full bg-white"
                                        onLoad={() => setPreviewLoading(false)}
                                    />
                                </>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                                    Select a document to preview.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-4 flex-shrink-0">
                    <div className="min-w-0">
                        {/* Email the client that their documents are ready in the tracker */}
                        <label className={`flex items-center gap-2 ${selectedCase && !selectedCase.email ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                            <button
                                type="button"
                                onClick={() => setNotify((v) => !v)}
                                disabled={selectedCase && !selectedCase.email}
                                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${notify && !(selectedCase && !selectedCase.email) ? "bg-gray-900 border-gray-900" : "bg-white border-gray-300"}`}
                            >
                                {notify && !(selectedCase && !selectedCase.email) && <Check size={12} className="text-white" strokeWidth={3} />}
                            </button>
                            <span className="text-xs text-gray-600 flex items-center gap-1.5 min-w-0">
                                <Mail size={13} className="text-gray-400 flex-shrink-0" />
                                <span className="truncate">
                                    Email the client that their documents are available in the application tracker
                                    {selectedCase && (selectedCase.email
                                        ? <span className="text-gray-400"> · {selectedCase.email}</span>
                                        : <span className="text-amber-600"> · no email on file</span>)}
                                </span>
                            </span>
                        </label>
                        <p className="text-[11px] text-gray-400 mt-1">
                            {selectedTypes.length} document{selectedTypes.length === 1 ? "" : "s"} selected
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800">Cancel</button>
                        <button
                            onClick={generate}
                            disabled={!selectedCase || selectedTypes.length === 0 || submitting}
                            className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? <Loader2 size={14} className="animate-spin" /> : <FileSignature size={14} />}
                            Generate {selectedTypes.length > 0 ? `(${selectedTypes.length})` : ""}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
