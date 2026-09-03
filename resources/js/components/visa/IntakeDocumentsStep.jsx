import { useState } from 'react';
import { FileCheck2, Plus, CheckCircle } from 'lucide-react';

// Shared "Document Checklist" step for the public visa intakes (Student,
// Visitor, Family — same checklist + design as the Resident intake). Manages the
// checklist ticks (data.documents) and attached PDFs (data.document_files).
// Keys are the contract with the backend (HandlesIntakeDocuments) — don't rename.

const ITEMS = [
    { key: 'passport', title: 'Passport', desc: 'Valid passport, all pages including blank pages' },
    { key: 'visa_copies', title: 'All NZ visa copies', desc: 'Every visa label or e-visa received in New Zealand' },
    { key: 'contracts', title: 'All NZ employment contracts + job description', desc: 'Original contract and any variations or renewals' },
    { key: 'payslips', title: 'Payslips — first 2 months + latest 1 month', desc: '3 payslips total showing gross/net pay and hours' },
    { key: 'ird_summary', title: 'IRD summary of earnings (monthly breakdown)', desc: 'Available from myIR — select monthly breakdown version' },
    { key: 'education_certs', title: 'Education certificates, transcripts, graduation documents', desc: 'All degrees and postgraduate qualifications if applicable' },
    { key: 'cv', title: 'CV covering both NZ and overseas employment', desc: 'Dates, employer names, roles and key responsibilities' },
];

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB per file

const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export default function IntakeDocumentsStep({ data, setData }) {
    const [fileErrors, setFileErrors] = useState({});
    const documents = data.documents || {};

    const toggle = (k) => setData('documents', { ...documents, [k]: !documents[k] });
    const clearFileError = (k) => setFileErrors((p) => { const n = { ...p }; delete n[k]; return n; });

    const filesOf = (k) => (data.document_files?.[k] || []).filter((f) => f instanceof File);

    // Accept one or more PDFs and append to whatever's already attached for the key.
    const handleFiles = (k, fileList) => {
        const incoming = Array.from(fileList || []);
        if (incoming.length === 0) return;

        const accepted = [];
        let firstError = null;
        for (const file of incoming) {
            const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
            if (!isPdf) { firstError = firstError || `${file.name}: only PDFs are accepted.`; continue; }
            if (file.size > MAX_BYTES) { firstError = firstError || `${file.name}: file is larger than 10 MB.`; continue; }
            accepted.push(file);
        }
        if (firstError) setFileErrors((p) => ({ ...p, [k]: firstError }));
        else clearFileError(k);
        if (accepted.length === 0) return;

        setData((prev) => ({
            ...prev,
            document_files: {
                ...prev.document_files,
                [k]: [...(prev.document_files?.[k] || []), ...accepted],
            },
            // A non-"other" upload also satisfies the checklist tick.
            ...(k !== 'other' ? { documents: { ...prev.documents, [k]: true } } : null),
        }));
    };

    const removeFileAt = (k, index) => {
        clearFileError(k);
        setData((prev) => ({
            ...prev,
            document_files: {
                ...prev.document_files,
                [k]: (prev.document_files?.[k] || []).filter((_, i) => i !== index),
            },
        }));
    };

    const docTotal = ITEMS.length;
    const docChecked = ITEMS.filter((it) => !! documents[it.key]).length;
    const totalFiles = Object.keys(data.document_files || {}).reduce((n, k) => n + filesOf(k).length, 0);
    const otherFiles = filesOf('other');

    const renderFileChip = (k, f, index) => (
        <div key={index} className="inline-flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-3 py-2 max-w-full">
            <FileCheck2 size={14} className="text-[#00A693] flex-shrink-0" />
            <span className="text-xs text-gray-700 truncate max-w-[200px]">{f.name}</span>
            <span className="text-[10px] text-gray-400 flex-shrink-0">{formatSize(f.size)}</span>
            <button type="button" onClick={() => removeFileAt(k, index)}
                className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                Remove
            </button>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-3">Document Checklist</h2>
                    <p className="text-sm text-gray-500">Tick each item you have, and attach one or more PDFs where you can — uploads (max 10 MB each) speed up your assessment.</p>
                </div>
                <div className="flex items-center gap-8">
                    <div className="text-center">
                        <div className="text-3xl font-black text-[#00A693]">{docChecked}<span className="text-base text-gray-300"> / {docTotal}</span></div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">ticked</span>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-black text-[#282728]">{totalFiles}</div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">{totalFiles === 1 ? 'file' : 'files'}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {ITEMS.map((it) => {
                    const checked = !! documents[it.key];
                    const files = filesOf(it.key);
                    const err = fileErrors[it.key];
                    const active = checked || files.length > 0;
                    return (
                        <div key={it.key}
                            className={`p-5 border rounded-2xl transition-all ${active ? 'border-[#00A693] bg-[#00A693]/5' : 'border-gray-100 bg-white'}`}>
                            <div className="flex items-start gap-4">
                                <input type="checkbox"
                                    className="w-5 h-5 mt-0.5 text-[#00A693] focus:ring-[#00A693] cursor-pointer rounded"
                                    checked={checked} onChange={() => toggle(it.key)} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold uppercase tracking-wide leading-tight text-[#282728]">{it.title}</div>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{it.desc}</p>

                                    {files.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {files.map((f, i) => renderFileChip(it.key, f, i))}
                                        </div>
                                    )}

                                    <div className="mt-3">
                                        <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] text-gray-600 hover:border-[#00A693] hover:text-[#00A693] hover:bg-[#00A693]/5 cursor-pointer transition-all">
                                            <Plus size={14} /> {files.length > 0 ? 'Attach another PDF' : 'Attach PDF'}
                                            <input type="file" accept="application/pdf,.pdf" multiple className="hidden"
                                                onChange={(e) => { handleFiles(it.key, e.target.files); e.target.value = ''; }} />
                                        </label>
                                        {err && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-2">{err}</p>}
                                    </div>
                                </div>
                                {active && <CheckCircle size={18} className="text-[#00A693] flex-shrink-0 mt-0.5" />}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Other supporting documents */}
            <div className={`rounded-2xl border-2 border-dashed p-5 ${otherFiles.length > 0 ? 'border-[#00A693] bg-[#00A693]/5' : 'border-gray-200 bg-gray-50/50'}`}>
                <div className="text-sm font-bold uppercase tracking-wide text-[#282728]">Other supporting documents</div>
                <p className="text-xs text-gray-500 mt-1">Anything else relevant to your application.</p>
                {otherFiles.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {otherFiles.map((f, i) => renderFileChip('other', f, i))}
                    </div>
                )}
                <div className="mt-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] text-gray-600 hover:border-[#00A693] hover:text-[#00A693] hover:bg-[#00A693]/5 cursor-pointer transition-all">
                        <Plus size={14} /> Attach PDF
                        <input type="file" accept="application/pdf,.pdf" multiple className="hidden"
                            onChange={(e) => { handleFiles('other', e.target.files); e.target.value = ''; }} />
                    </label>
                    {fileErrors.other && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-2">{fileErrors.other}</p>}
                </div>
            </div>
        </div>
    );
}
