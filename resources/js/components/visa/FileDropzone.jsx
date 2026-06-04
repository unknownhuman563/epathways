import React, { useRef, useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';

const DEFAULT_ACCEPT = '.pdf,.doc,.docx,.xls,.csv,.jpg,.jpeg,.png,.gif';
const DEFAULT_HINT   = 'PDF, DOC/DOCX, XLS/CSV, JPG/JPEG, PNG, GIF';

/**
 * Multi-file dropzone used by the Education Enrolment form to collect the
 * applicant's CV / Passport / Diploma / Transcript. Click anywhere on the
 * panel to pick files, or drag-drop them in. A small list under the panel
 * shows the queued files with a remove button each.
 *
 * Props:
 *   label        — section heading rendered above the dropzone.
 *   files        — current File[] held in form state.
 *   onFilesChange(next) — setter; called with the merged File[] when files
 *                  are added or removed.
 *   maxFiles     — caps the number of files (default 10).
 *   accept       — comma-separated extension list (default covers the
 *                  formats shown in the spec screenshot).
 *   accent       — accent colour for the hint text and drag-over border.
 *   error        — validation message shown under the dropzone in red.
 */
export default function FileDropzone({
    label,
    files = [],
    onFilesChange,
    maxFiles = 10,
    accept = DEFAULT_ACCEPT,
    hint = DEFAULT_HINT,
    accent = '#436235',
    error = '',
}) {
    const inputRef = useRef(null);
    const [drag, setDrag] = useState(false);

    const addFiles = (incoming) => {
        const list = Array.from(incoming || []);
        if (!list.length) return;
        const space = Math.max(0, maxFiles - files.length);
        if (space === 0) return;
        onFilesChange?.([...files, ...list.slice(0, space)]);
    };

    const removeAt = (i) => {
        onFilesChange?.(files.filter((_, idx) => idx !== i));
    };

    return (
        <div className="mb-6">
            {label && (
                <label className="block text-[14px] font-semibold text-[#282728] mb-3">
                    {label}
                </label>
            )}
            <div
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDrag(false);
                    addFiles(e.dataTransfer.files);
                }}
                onClick={() => inputRef.current?.click()}
                className={`cursor-pointer rounded-xl border bg-white hover:border-gray-400 transition-colors px-4 py-10 text-center ${
                    error ? 'border-red-300 bg-red-50/40' : 'border-gray-200'
                }`}
                style={drag ? { borderColor: accent, borderStyle: 'dashed' } : undefined}
            >
                <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Upload size={22} className="text-gray-700" strokeWidth={1.75} />
                </div>
                <p className="text-sm">
                    <span style={{ color: accent }} className="font-semibold">{hint}</span>
                    <span className="text-gray-500"> ( max {maxFiles} Files )</span>
                </p>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={accept}
                    className="hidden"
                    onChange={(e) => {
                        addFiles(e.target.files);
                        // Clear input so re-selecting the same file fires onChange.
                        e.target.value = '';
                    }}
                />
            </div>
            {error && (
                <p className="text-xs text-red-500 mt-1.5 font-medium">{error}</p>
            )}
            {files.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                    {files.map((f, i) => (
                        <li
                            key={`${f.name}-${i}`}
                            className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100"
                        >
                            <FileText size={14} className="text-gray-500 flex-shrink-0" />
                            <span className="flex-1 truncate">{f.name}</span>
                            <span className="text-gray-400 tabular-nums">
                                {(f.size / 1024).toFixed(0)} KB
                            </span>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeAt(i); }}
                                className="text-gray-400 hover:text-red-500"
                                aria-label="Remove file"
                            >
                                <X size={14} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
