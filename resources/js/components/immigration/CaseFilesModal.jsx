import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import { X, FileText, Download, Trash2, Loader2 } from "lucide-react";

/**
 * File history for a case — every file ever uploaded or generated, newest
 * first, with the checklist requirement it answers and its review status.
 *
 * Deliberately separate from the checklist table: the checklist answers
 * "what is still outstanding", this answers "what has come in, and what
 * happened to it".
 */

// Review states a file can be in, in the order staff work them.
const FILE_STATUSES = [
    { key: 'Submitted',   label: 'Submitted',       chip: 'bg-sky-50 text-sky-700 border-sky-200' },
    { key: 'UnderReview', label: 'Under review',    chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    { key: 'Approved',    label: 'Approved',        chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { key: 'Rejected',    label: 'Rejected',        chip: 'bg-rose-50 text-rose-700 border-rose-200' },
    { key: 'StaffShared', label: 'Shared by staff', chip: 'bg-violet-50 text-violet-700 border-violet-200' },
    // Generated agreements / invoices carry no review status of their own.
    { key: 'generated',   label: 'Generated',       chip: 'bg-gray-100 text-gray-600 border-gray-200' },
];

const statusMeta = (d) =>
    FILE_STATUSES.find((s) => s.key === (d.source === 'generated' ? 'generated' : d.status))
    || FILE_STATUSES[0];

const fmtBytes = (n) => {
    if (! n) return '';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const fmtWhen = (iso) => {
    if (! iso) return '';
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleString('en-NZ', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: 'numeric', minute: '2-digit',
    });
};

export default function CaseFilesModal({ leadId, leadName, onClose }) {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [deletingId, setDeletingId] = useState(null);

    const load = () => {
        setLoading(true);
        fetch(`/admin/leads/${leadId}/documents/json`, { headers: { Accept: 'application/json' } })
            .then((r) => (r.ok ? r.json() : { documents: [] }))
            .then((d) => setDocs(d.documents || []))
            .catch(() => toast.error('Could not load this case’s files'))
            .finally(() => setLoading(false));
    };

    useEffect(load, [leadId]);

    // Counts per status drive the filter chips; 0-count states stay visible
    // so "no rejected files" is an answer, not an absence.
    const counts = useMemo(() => {
        const out = {};
        docs.forEach((d) => {
            const k = statusMeta(d).key;
            out[k] = (out[k] || 0) + 1;
        });
        return out;
    }, [docs]);

    const shown = filter === 'all' ? docs : docs.filter((d) => statusMeta(d).key === filter);

    // ZIP contents follow the filter, except for "All" and "Generated" —
    // neither is a single review state, so both fall back to approved-only.
    const ZIPPABLE = ['Submitted', 'UnderReview', 'Approved', 'Rejected', 'StaffShared'];
    const downloadStatus = ZIPPABLE.includes(filter) ? filter : 'Approved';
    const downloadLabel = (FILE_STATUSES.find((s) => s.key === downloadStatus)?.label || 'approved').toLowerCase();

    /**
     * One group per checklist requirement — the requirement's name, then its
     * files newest-first underneath. A requirement uploaded three times reads
     * as one heading with three dated entries, not three unrelated rows.
     */
    const groups = useMemo(() => {
        const map = new Map();
        for (const d of shown) {
            const name = d.checklist_label || d.checklist_key || 'Other uploads';
            if (! map.has(name)) map.set(name, []);
            map.get(name).push(d);
        }
        // `shown` is already newest-first, so each group's first entry is its
        // latest — that's what orders the groups too.
        return [...map.entries()];
    }, [shown]);

    const remove = (doc) => {
        if (! window.confirm(`Permanently delete "${doc.name}"? This cannot be undone.`)) return;
        setDeletingId(doc.id);
        router.delete(`/admin/leads/${leadId}/documents/${doc.id}`, {
            preserveScroll: true,
            // The page reload refreshes the case's counters; reload the list
            // here so the history reflects the deletion immediately.
            onSuccess: () => { toast.success('File removed'); load(); },
            onError: () => toast.error('Could not delete that file'),
            onFinish: () => setDeletingId(null),
        });
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            File history{leadName ? ` — ${leadName}` : ''}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {docs.length} file{docs.length === 1 ? '' : 's'} on this case, grouped by document
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700">
                        <X size={18} />
                    </button>
                </div>

                <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap gap-1.5">
                    <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}
                        label="All" count={docs.length} />
                    {FILE_STATUSES.map((s) => (
                        <FilterChip key={s.key} active={filter === s.key} onClick={() => setFilter(s.key)}
                            label={s.label} count={counts[s.key] || 0} />
                    ))}
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="py-12 flex items-center justify-center text-gray-400">
                            <Loader2 size={18} className="animate-spin" />
                        </div>
                    ) : shown.length === 0 ? (
                        <p className="py-12 text-center text-sm text-gray-400">
                            {docs.length === 0 ? 'No files on this case yet.' : 'No files in this state.'}
                        </p>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {groups.map(([name, files]) => (
                                <section key={name} className="px-6 py-3">
                                    {/* Requirement name — what the checklist calls it. */}
                                    <p className="text-sm font-bold text-gray-900 break-words">
                                        {name}
                                        <span className="ml-2 text-[11px] font-semibold text-gray-400 tabular-nums">
                                            {files.length} file{files.length === 1 ? '' : 's'}
                                        </span>
                                    </p>

                                    {/* Its history: newest first, each with status and date. */}
                                    <ul className="mt-1.5 ml-1 border-l border-gray-100 space-y-1.5">
                                        {files.map((d) => {
                                            const meta = statusMeta(d);
                                            return (
                                                <li key={d.id} className="pl-3 flex items-start gap-2 group">
                                                    <FileText size={13} className="text-gray-300 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-gray-700 break-words">{d.name}</p>
                                                        <p className="text-[11px] text-gray-400">
                                                            {[
                                                                fmtWhen(d.created_at),
                                                                d.uploaded_by ? `by ${d.uploaded_by}` : null,
                                                                d.reviewed_by ? `reviewed by ${d.reviewed_by}` : null,
                                                                fmtBytes(d.size),
                                                            ].filter(Boolean).join(' · ')}
                                                        </p>
                                                        {d.note && (
                                                            <p className="text-[11px] text-rose-600">{d.note}</p>
                                                        )}
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide flex-shrink-0 ${meta.chip}`}>
                                                        {meta.label}
                                                    </span>
                                                    <div className="flex items-center gap-0.5 flex-shrink-0">
                                                        <a href={`/admin/documents/${d.id}/download`}
                                                            title="Download"
                                                            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors">
                                                            <Download size={12} />
                                                        </a>
                                                        <button type="button" onClick={() => remove(d)}
                                                            disabled={deletingId === d.id}
                                                            title="Delete this file"
                                                            className="w-6 h-6 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded transition-colors disabled:opacity-40">
                                                            {deletingId === d.id
                                                                ? <Loader2 size={12} className="animate-spin" />
                                                                : <Trash2 size={12} />}
                                                        </button>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </section>
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                    {/* The bundle follows the active filter, defaulting to
                        approved-only — that's the lodgement set. */}
                    <a href={`/admin/leads/${leadId}/documents/download-all${downloadStatus === 'Approved' ? '' : `?status=${downloadStatus}`}`}
                        className="text-xs font-semibold text-gray-600 hover:text-gray-900 inline-flex items-center gap-1.5">
                        <Download size={13} /> Download {downloadLabel} (ZIP)
                    </a>
                    <button type="button" onClick={onClose}
                        className="text-xs font-semibold text-gray-500 hover:text-gray-900">
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

function FilterChip({ active, onClick, label, count }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                active
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
        >
            {label} <span className="tabular-nums opacity-70">{count}</span>
        </button>
    );
}
