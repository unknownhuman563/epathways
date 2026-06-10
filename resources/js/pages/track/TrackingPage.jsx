import React, { useEffect, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Search, CheckCircle2, AlertCircle, ArrowRight,
    Save, X, Upload, FileText, ChevronDown,
    Eye, FileType, Plus, Trash2, Edit3, Edit,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

/**
 * Public application tracking page. Mono dark-gray / white theme.
 *
 * Reading order is deliberately top-down by importance:
 *   1. Hero (centered) — title + tracking code search
 *   2. Summary bar — name + current stage
 *   3. Journey — full-width vertical timeline (priority)
 *   4. Information + Documents — 2-column row underneath
 */
export default function TrackingPage({
    code = null,
    lead = null,
    info = null,
    documents = [],
    timeline = [],
    error = null,
}) {
    const [input, setInput] = useState(code || '');
    const flash = usePage().props.flash || {};

    const submitLookup = (e) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed) return;
        router.get(`/track/${encodeURIComponent(trimmed)}`);
    };

    return (
        <div className="min-h-screen bg-white font-urbanist flex flex-col">
            <Head title="Track Your Application — ePathways" />
            <Navbar />

            <main className="flex-1 bg-[#f7f7f5]">
                {/* Hero — centered, monochrome, with a soft radial vignette
                    behind the headline so the page doesn't feel like a
                    flat slab of dark. */}
                <section className="relative bg-[#0c1611] text-white py-24 overflow-hidden">
                    {/* radial glow behind the headline */}
                    <div
                        aria-hidden
                        className="absolute inset-0 opacity-60 pointer-events-none"
                        style={{
                            background:
                                'radial-gradient(ellipse at top, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 60%)',
                        }}
                    />
                    <div className="relative container mx-auto px-6 md:px-12 max-w-3xl text-center">
                        <p className="text-[10px] font-bold tracking-[0.5em] uppercase text-white/50 mb-5">
                            Application Tracking
                        </p>
                        <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-3 leading-[1.05]">
                            Your journey,<br className="sm:hidden" /> on one page.
                        </h1>
                        <p className="text-white/55 text-sm md:text-[15px] max-w-md mx-auto">
                            Enter the tracking code we sent you to see your details, documents, and progress.
                        </p>

                        <form
                            onSubmit={submitLookup}
                            className="mt-10 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto"
                        >
                            <div className="flex-1 flex items-center gap-3 px-5 py-3.5 bg-white/5 border border-white/15 focus-within:border-white/50 focus-within:bg-white/10 transition-colors">
                                <Search size={16} className="text-white/40 flex-shrink-0" />
                                <input
                                    type="text"
                                    placeholder="EP-AB23CDEF"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    className="flex-1 bg-transparent text-white placeholder-white/30 focus:outline-none tracking-[0.22em] uppercase text-sm text-center sm:text-left"
                                    autoFocus={!lead}
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-7 py-3.5 bg-white text-[#0c1611] text-[11px] font-bold uppercase tracking-[0.28em] hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                Track <ArrowRight size={13} strokeWidth={2.5} />
                            </button>
                        </form>
                    </div>
                </section>

                <section className="container mx-auto px-6 md:px-12 max-w-5xl py-14">
                    {flash.success && (
                        <div className="mb-8 bg-gray-50 border border-gray-300 px-5 py-3 text-sm text-[#282728] flex items-center gap-3">
                            <CheckCircle2 size={16} className="text-[#282728] flex-shrink-0" />
                            {flash.success}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 px-5 py-4 flex items-start gap-3 max-w-2xl mx-auto">
                            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-red-700 mb-0.5">Code not found</p>
                                <p className="text-xs text-red-600 leading-relaxed">{error}</p>
                            </div>
                        </div>
                    )}

                    {lead && (
                        <div className="space-y-6">
                            <SummaryBar lead={lead} />

                            {/* Journey — the priority section, full width */}
                            <TimelinePanel timeline={timeline} currentStage={lead.stage} />

                            {/* Information + Documents — equal 2-col split
                                under the timeline, restored from the
                                stacked layout. The documents gallery
                                drops from a 3-up to a 2-up grid inside
                                the narrower column so the thumbnails stay
                                readable. */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <InformationPanel code={lead.tracking_code} info={info} />
                                <DocumentsPanel code={lead.tracking_code} documents={documents} />
                            </div>
                        </div>
                    )}

                    {!lead && !error && (
                        <div className="text-center py-16">
                            <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-gray-400 mb-3">
                                Where to find your code
                            </p>
                            <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                                Your tracking code starts with{' '}
                                <span className="font-mono font-bold text-[#282728]">EP-</span>{' '}
                                followed by 8 letters and numbers. It was sent to you when you submitted
                                your assessment or enquiry.
                            </p>
                        </div>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
}

// ─── Panels ──────────────────────────────────────────────────────────────

function SummaryBar({ lead }) {
    return (
        // Top accent stripe + soft shadow so the summary reads as the
        // "ID card" of the page rather than a flat rectangle.
        <div className="relative bg-white border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-7 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-[#282728]" />
            <div className="flex items-baseline gap-5">
                <p className="text-[10px] font-bold tracking-[0.35em] uppercase text-gray-400">
                    Application
                </p>
                <h2 className="text-2xl font-medium text-[#282728] tracking-tight">
                    {lead.first_name} {lead.last_name}
                </h2>
            </div>
            <div className="flex flex-wrap gap-1.5 items-center">
                {lead.stage && <ChipDark>{lead.stage}</ChipDark>}
                {lead.is_student && <Chip>Education</Chip>}
                {lead.is_immigration_case && <Chip>Immigration</Chip>}
                {lead.is_accommodation_client && <Chip>Accommodation</Chip>}
                <span className="hidden sm:inline-block w-px h-4 bg-gray-200 mx-2" />
                <span className="text-[10px] font-mono text-gray-500 tracking-wider bg-gray-50 border border-gray-200 px-2 py-1">
                    {lead.tracking_code}
                </span>
            </div>
        </div>
    );
}

function Chip({ children }) {
    return (
        <span className="px-2.5 py-1 bg-gray-50 text-[#282728] text-[9px] font-bold uppercase tracking-[0.2em] border border-gray-200">
            {children}
        </span>
    );
}

function ChipDark({ children }) {
    return (
        <span className="px-2.5 py-1 bg-[#282728] text-white text-[9px] font-bold uppercase tracking-[0.2em] border border-[#282728]">
            {children}
        </span>
    );
}

function PanelShell({ title, subtitle, action, children }) {
    return (
        // Quiet card lift — single hairline border + a barely-there shadow
        // so each card reads as deliberate rather than an outline-only box.
        <div className="bg-white border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-7">
            <div className="flex items-start justify-between gap-4 mb-6 pb-5 border-b border-gray-100">
                <div>
                    <h3 className="text-lg font-semibold text-[#282728] tracking-tight">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-[13px] text-gray-500 mt-1.5 leading-relaxed">{subtitle}</p>
                    )}
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}

function InformationPanel({ code, info }) {
    const [editing, setEditing] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({ ...info });

    if (!info) return null;

    const save = (e) => {
        e.preventDefault();
        post(`/track/${code}/info`, {
            preserveScroll: true,
            onSuccess: () => setEditing(false),
        });
    };

    const cancel = () => {
        reset();
        setEditing(false);
    };

    const editAction = !editing ? (
        <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#282728] flex items-center gap-1.5 border border-[#282728] px-2.5 py-1.5 hover:bg-[#282728] hover:text-white transition-colors"
        >
            <Edit size={11} /> Edit
        </button>
    ) : (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={cancel}
                disabled={processing}
                className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500 flex items-center gap-1.5 border border-gray-300 px-2.5 py-1.5 hover:bg-gray-50"
            >
                <X size={11} /> Cancel
            </button>
            <button
                type="button"
                onClick={save}
                disabled={processing}
                className="text-[10px] font-bold uppercase tracking-[0.22em] text-white bg-[#282728] flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-black disabled:opacity-50"
            >
                <Save size={11} /> {processing ? 'Saving…' : 'Save'}
            </button>
        </div>
    );

    return (
        <PanelShell
            title="Your Information"
            subtitle="Edit anything that's out of date — we'll sync it across your file."
            action={editAction}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <InfoField label="First name"        name="first_name"        editing={editing} data={data} setData={setData} errors={errors} />
                <InfoField label="Middle name"       name="middle_name"       editing={editing} data={data} setData={setData} errors={errors} />
                <InfoField label="Last name"         name="last_name"         editing={editing} data={data} setData={setData} errors={errors} />
                <InfoField label="Other names"       name="other_names"       editing={editing} data={data} setData={setData} errors={errors} />
                <InfoField label="Gender"            name="gender"            editing={editing} data={data} setData={setData} errors={errors} />
                <InfoField label="Marital status"    name="marital_status"    editing={editing} data={data} setData={setData} errors={errors} />
                <InfoField label="Date of birth"     name="dob"               editing={editing} data={data} setData={setData} errors={errors} type="date" />
                <InfoField label="Email"             name="email"             editing={editing} data={data} setData={setData} errors={errors} type="email" />
                <InfoField label="Phone"             name="phone"             editing={editing} data={data} setData={setData} errors={errors} />
                <InfoField label="Country of birth"  name="country_of_birth"  editing={editing} data={data} setData={setData} errors={errors} />
                <InfoField label="Place of birth"    name="place_of_birth"    editing={editing} data={data} setData={setData} errors={errors} />
                <InfoField label="Citizenship"       name="citizenship"       editing={editing} data={data} setData={setData} errors={errors} />
                <InfoField label="Residence city"    name="residence_city"    editing={editing} data={data} setData={setData} errors={errors} />
                <InfoField label="Residence state"   name="residence_state"   editing={editing} data={data} setData={setData} errors={errors} />
                <InfoField label="Residence country" name="residence_country" editing={editing} data={data} setData={setData} errors={errors} />
                {/* Passport number + expiry are captured in the Documents
                    section when the lead uploads their passport — the
                    fields auto-save there. Keeping them off the personal
                    information form avoids two places to type the same
                    thing. */}
            </div>
        </PanelShell>
    );
}

function InfoField({ label, name, editing, data, setData, errors, type = 'text' }) {
    const value = data[name];
    const err = errors[name];

    // Date values render in the underlying browser/locale format when
    // they're shown as uppercase plain text, which would just emit the
    // exact same digits — skip the uppercase flip on date types so the
    // display still reads naturally (e.g. "2026-06-09" stays as-is).
    const upperValue = type !== 'date';

    return (
        <div className="space-y-1.5">
            <label className={`block text-[13px] font-semibold transition-colors ${err ? 'text-red-500' : 'text-gray-700'}`}>
                {label}
            </label>
            {editing ? (
                <input
                    type={type}
                    value={value || ''}
                    onChange={(e) => setData(name, e.target.value)}
                    className={`w-full bg-transparent border-b py-2 text-[15px] text-[#282728] focus:outline-none focus:border-[#282728] transition-colors ${
                        err ? 'border-red-400' : 'border-gray-200'
                    }`}
                />
            ) : (
                <p className={`text-[15px] text-[#282728] py-2 border-b border-gray-100 tracking-wide ${
                    upperValue ? 'uppercase' : ''
                }`}>
                    {value || <span className="text-gray-300 normal-case">—</span>}
                </p>
            )}
            {err && <p className="text-[11px] font-semibold text-red-500 mt-0.5">{err}</p>}
        </div>
    );
}

// Document-type catalogue. Drives the picker AND lights up the
// passport-metadata fields when checklist_key === 'passport'.
const DOC_TYPES = [
    { key: 'passport',   label: 'Passport',          hint: 'Bio-data page — we\'ll save the number + expiry to your file.' },
    { key: 'diploma',    label: 'Diploma',           hint: 'Highest qualification certificate.' },
    { key: 'transcript', label: 'Transcript of Records', hint: 'Academic record / TOR.' },
    { key: 'cv',         label: 'CV / Resume',       hint: 'Latest CV in PDF or DOC.' },
    { key: 'coe',        label: 'Certificate of Employment', hint: 'Most recent employer-issued certificate.' },
    { key: 'other',      label: 'Other supporting document', hint: 'Anything else we\'ve asked for.' },
];

function DocumentsPanel({ code, documents }) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);

    return (
        <>
            <PanelShell
                title="Documents"
                subtitle="Uploaded files we have on your application."
                action={
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="text-[11px] font-bold uppercase tracking-[0.22em] text-white bg-[#282728] flex items-center gap-1.5 px-3 py-2 hover:bg-black transition-colors"
                    >
                        <Plus size={13} strokeWidth={2.5} /> Add
                    </button>
                }
            >
                {documents.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-gray-200">
                        <FileText size={22} className="mx-auto text-gray-300 mb-2" strokeWidth={1.5} />
                        <p className="text-[13px] text-gray-500 mb-3">
                            No documents yet.
                        </p>
                        <button
                            type="button"
                            onClick={() => setOpen(true)}
                            className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#282728] inline-flex items-center gap-1.5 border border-[#282728] px-3 py-2 hover:bg-[#282728] hover:text-white transition-colors"
                        >
                            <Plus size={12} /> Upload your first document
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {documents.map((d) => (
                            <DocGalleryCard
                                key={d.id}
                                doc={d}
                                onEdit={() => setEditing(d)}
                                onDelete={() => setDeleting(d)}
                            />
                        ))}
                    </div>
                )}
            </PanelShell>

            <DocEditModal
                code={code}
                doc={editing}
                onClose={() => setEditing(null)}
            />
            <DocDeleteModal
                code={code}
                doc={deleting}
                onClose={() => setDeleting(null)}
            />

            <DocUploadModal
                open={open}
                onClose={() => setOpen(false)}
                code={code}
            />
        </>
    );
}

/**
 * Modal-driven upload flow. Step 1 = pick a type from DOC_TYPES; step 2 =
 * (passport metadata, if applicable) + file + upload button. Backdrop and
 * Esc both close. The previous list-then-form layout inside the panel was
 * confusing because the document type picker fought with the gallery for
 * the same space — moving it into a modal cleans that up.
 */
function DocUploadModal({ open, onClose, code }) {
    const [docType, setDocType] = useState(null);
    const { data, setData, post, processing, errors, reset } = useForm({
        file: null,
        checklist_key: '',
        passport_number: '',
        passport_expiry: '',
    });

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') close(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    if (!open) return null;

    const close = () => {
        setDocType(null);
        reset();
        onClose();
    };

    const pickDocType = (t) => {
        setDocType(t);
        setData('checklist_key', t.key);
    };

    const upload = (e) => {
        e.preventDefault();
        if (!data.file || !docType) return;

        post(`/track/${code}/document`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => close(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                onClick={close}
                className="absolute inset-0 bg-[#0c1611]/70 backdrop-blur-sm"
            />

            {/* Modal card */}
            <div className="relative bg-white border border-gray-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-semibold text-[#282728] tracking-tight">
                            {docType ? `Upload · ${docType.label}` : 'Add a document'}
                        </h3>
                        <p className="text-[12px] text-gray-500 mt-1">
                            {docType
                                ? 'Choose the file and we\'ll attach it to your application.'
                                : 'Pick the type of document — we use it to file everything correctly.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={close}
                        className="text-gray-400 hover:text-[#282728] flex-shrink-0"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    {!docType ? (
                        <div className="space-y-2">
                            {DOC_TYPES.map((t) => (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => pickDocType(t)}
                                    className="w-full text-left flex items-center justify-between gap-3 px-4 py-3 border border-gray-200/80 hover:border-[#282728] hover:shadow-sm hover:-translate-y-px transition-all group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-semibold text-[#282728]">{t.label}</p>
                                        <p className="text-[11px] text-gray-500 mt-0.5">{t.hint}</p>
                                    </div>
                                    <ChevronDown
                                        size={16}
                                        strokeWidth={2}
                                        className="text-gray-300 group-hover:text-[#282728] group-hover:translate-x-1 rotate-[-90deg] flex-shrink-0 transition-all"
                                    />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <form onSubmit={upload} className="space-y-4">
                            {/* Passport-specific fields */}
                            {docType.key === 'passport' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 border border-gray-200">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                            Passport number
                                        </label>
                                        <input
                                            type="text"
                                            value={data.passport_number}
                                            onChange={(e) => setData('passport_number', e.target.value)}
                                            className="w-full bg-transparent border-b border-gray-200 py-1.5 text-sm text-[#282728] focus:outline-none focus:border-[#282728]"
                                            placeholder="e.g. P1234567"
                                        />
                                        {errors.passport_number && (
                                            <p className="text-[10px] text-red-500 mt-0.5">{errors.passport_number}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                            Expiry date
                                        </label>
                                        <input
                                            type="date"
                                            value={data.passport_expiry}
                                            onChange={(e) => setData('passport_expiry', e.target.value)}
                                            className="w-full bg-transparent border-b border-gray-200 py-1.5 text-sm text-[#282728] focus:outline-none focus:border-[#282728]"
                                        />
                                        {errors.passport_expiry && (
                                            <p className="text-[10px] text-red-500 mt-0.5">{errors.passport_expiry}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* File picker */}
                            <label className="cursor-pointer block">
                                <div className="flex items-center gap-2 px-3 py-3 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors text-sm text-gray-600">
                                    <Upload size={14} className="text-gray-400" />
                                    <span className="flex-1 truncate">
                                        {data.file ? data.file.name : 'Choose a file…'}
                                    </span>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.xls,.csv,.jpg,.jpeg,.png,.gif"
                                    onChange={(e) => setData('file', e.target.files?.[0] || null)}
                                />
                            </label>
                            {errors.file && <p className="text-[11px] text-red-500">{errors.file}</p>}
                        </form>
                    )}
                </div>

                {/* Footer */}
                {docType && (
                    <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                        <button
                            type="button"
                            onClick={() => { setDocType(null); reset(); }}
                            disabled={processing}
                            className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 hover:text-[#282728] flex items-center gap-1.5"
                        >
                            <ArrowRight size={12} className="rotate-180" /> Change type
                        </button>
                        <button
                            type="button"
                            onClick={upload}
                            disabled={!data.file || processing}
                            className="px-5 py-2.5 bg-[#282728] text-white text-[11px] font-bold uppercase tracking-[0.22em] hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Upload size={12} /> {processing ? 'Uploading…' : 'Upload'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Premium gallery card for a single uploaded document.
 *
 * Image docs (jpg/png) render their actual preview from the public
 * storage URL; everything else renders a quiet file-type label. The
 * whole card is a link to the file so a click opens it in a new tab.
 */
/**
 * Edit-existing-document modal. Lets the lead swap the file and/or change
 * the document type while the doc is still in Submitted state.
 */
function DocEditModal({ code, doc, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        file: null,
        checklist_key: '',
    });

    useEffect(() => {
        if (!doc) return;
        setData({ file: null, checklist_key: doc.checklist_key || '' });
        const onKey = (e) => { if (e.key === 'Escape') close(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doc?.id]);

    if (!doc) return null;

    const close = () => { reset(); onClose(); };

    const submit = (e) => {
        e.preventDefault();
        post(`/track/${code}/document/${doc.id}`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => close(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={close} className="absolute inset-0 bg-[#0c1611]/70 backdrop-blur-sm" />
            <div className="relative bg-white border border-gray-200 shadow-2xl w-full max-w-lg">
                <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-semibold text-[#282728] tracking-tight">
                            Edit document
                        </h3>
                        <p className="text-[12px] text-gray-500 mt-1 truncate" title={doc.original_name}>
                            {doc.original_name}
                        </p>
                    </div>
                    <button type="button" onClick={close} className="text-gray-400 hover:text-[#282728] flex-shrink-0" aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={submit} className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">
                            Document type
                        </label>
                        <select
                            value={data.checklist_key}
                            onChange={(e) => setData('checklist_key', e.target.value)}
                            className="w-full bg-transparent border-b border-gray-200 py-2 text-sm text-[#282728] focus:outline-none focus:border-[#282728]"
                        >
                            <option value="">— pick a type —</option>
                            {DOC_TYPES.map((t) => (
                                <option key={t.key} value={t.key}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">
                            Replace file <span className="text-gray-400 font-normal">(leave blank to keep the existing one)</span>
                        </label>
                        <label className="cursor-pointer block">
                            <div className="flex items-center gap-2 px-3 py-3 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors text-sm text-gray-600">
                                <Upload size={14} className="text-gray-400" />
                                <span className="flex-1 truncate">
                                    {data.file ? data.file.name : 'Choose a replacement file…'}
                                </span>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.xls,.csv,.jpg,.jpeg,.png,.gif"
                                onChange={(e) => setData('file', e.target.files?.[0] || null)}
                            />
                        </label>
                        {errors.file && <p className="text-[11px] text-red-500 mt-1">{errors.file}</p>}
                    </div>
                </form>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <button
                        type="button"
                        onClick={close}
                        disabled={processing}
                        className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 hover:text-[#282728] px-3 py-2"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={processing}
                        className="px-5 py-2.5 bg-[#282728] text-white text-[11px] font-bold uppercase tracking-[0.22em] hover:bg-black transition-colors disabled:opacity-40 flex items-center gap-2"
                    >
                        <Save size={12} /> {processing ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Hard-delete confirmation. Same modal shell — single dangerous CTA on
 * the right, Cancel on the left.
 */
function DocDeleteModal({ code, doc, onClose }) {
    const { delete: destroy, processing } = useForm();

    useEffect(() => {
        if (!doc) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [doc, onClose]);

    if (!doc) return null;

    const confirm = () => {
        destroy(`/track/${code}/document/${doc.id}`, {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={onClose} className="absolute inset-0 bg-[#0c1611]/70 backdrop-blur-sm" />
            <div className="relative bg-white border border-gray-200 shadow-2xl w-full max-w-md">
                <div className="px-6 py-5 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-[#282728] tracking-tight">
                        Remove this document?
                    </h3>
                    <p className="text-[13px] text-gray-500 mt-1.5 leading-relaxed">
                        <span className="font-semibold text-[#282728]">{doc.original_name}</span> will
                        be permanently removed from your application. You can re-upload a new file at any time.
                    </p>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 hover:text-[#282728] px-3 py-2"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={confirm}
                        disabled={processing}
                        className="px-5 py-2.5 bg-red-600 text-white text-[11px] font-bold uppercase tracking-[0.22em] hover:bg-red-700 transition-colors disabled:opacity-40 flex items-center gap-2"
                    >
                        <Trash2 size={12} /> {processing ? 'Removing…' : 'Remove'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DocGalleryCard({ doc, onEdit, onDelete }) {
    const ext = (doc.original_name?.split('.').pop() || '').toUpperCase().slice(0, 4);
    const editable = !!doc.is_editable;

    const openFile = () => {
        if (doc.url) window.open(doc.url, '_blank', 'noopener,noreferrer');
    };

    return (
        // Compact horizontal row — thumbnail + filename clickable to open
        // the file. Edit / delete actions render as separate icon buttons
        // when the doc is still pending review (Submitted). Once a staff
        // member touches it, only the View affordance remains.
        <div
            className="group flex items-center gap-3 bg-white border border-gray-200/80 hover:border-[#282728] hover:shadow-sm transition-all p-2"
        >
            {/* Thumbnail — own click target for "view" */}
            <button
                type="button"
                onClick={openFile}
                title={`Open ${doc.original_name}`}
                className="relative w-12 h-12 bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer"
            >
                {doc.is_image && doc.url ? (
                    <img
                        src={doc.url}
                        alt={doc.original_name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center">
                        <FileType size={16} className="text-gray-300" strokeWidth={1.5} />
                        <span className="text-[7px] font-bold tracking-[0.18em] text-gray-400 mt-0.5">
                            {ext || 'FILE'}
                        </span>
                    </div>
                )}
                <div className="absolute inset-0 bg-[#282728]/0 group-hover:bg-[#282728]/55 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Eye size={14} className="text-white" strokeWidth={2} />
                </div>
            </button>

            {/* Caption — also clickable to view */}
            <button
                type="button"
                onClick={openFile}
                className="flex-1 min-w-0 text-left"
            >
                <p className="text-[12px] font-semibold text-[#282728] truncate leading-tight">
                    {doc.original_name}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 tabular-nums">
                    {(doc.size / 1024).toFixed(0)} KB{doc.checklist_key ? ` · ${doc.checklist_key}` : ''}
                </p>
            </button>

            {/* Actions — edit / delete appear on hover when the doc is
                still editable; status chip is always shown. */}
            <div className="flex items-center gap-1 flex-shrink-0">
                {editable && onEdit && (
                    <button
                        type="button"
                        onClick={onEdit}
                        title="Replace or change type"
                        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-[#282728] hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <Edit3 size={13} strokeWidth={2} />
                    </button>
                )}
                {editable && onDelete && (
                    <button
                        type="button"
                        onClick={onDelete}
                        title="Delete this document"
                        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 size={13} strokeWidth={2} />
                    </button>
                )}
                <DocStatusBadge status={doc.status} />
            </div>
        </div>
    );
}

function DocStatusBadge({ status }) {
    // Mono palette — staff status reads as a quiet chip rather than a
    // coloured callout. Approved/Rejected still get a faint tint so they
    // pop in a long list.
    const palette = {
        Submitted:    'bg-gray-50 text-gray-700 border-gray-200',
        UnderReview:  'bg-gray-100 text-gray-700 border-gray-300',
        Approved:     'bg-[#282728] text-white border-[#282728]',
        Rejected:     'bg-red-50 text-red-700 border-red-200',
        StaffShared:  'bg-gray-50 text-gray-700 border-gray-200',
    }[status] || 'bg-gray-50 text-gray-700 border-gray-200';

    return (
        <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.18em] border ${palette}`}>
            {status}
        </span>
    );
}

/**
 * Reference-style progress tracker — Completed / In Progress / Pending
 * states, horizontal rail with a filled progress line, simple state
 * indicators (no per-step icons). Backend ships the canonical list of
 * steps; this component just paints them.
 */
function TimelinePanel({ timeline = [], currentStage }) {
    // Backend now returns the canonical roadmap left→right with
    // status per step — no client-side reversing or guessing.
    const steps = timeline;
    const total = steps.length;
    const currentIndex = Math.max(0, steps.findIndex((s) => s.status === 'current'));
    const completedCount = steps.filter((s) => s.status === 'completed').length;
    // Fill stops *at* the current node, so the progress line runs across
    // every completed step's gap but not into the pending ones.
    const fillPct = total <= 1 ? 0 : (currentIndex / (total - 1)) * 100;

    return (
        <PanelShell
            title="Your Journey"
            subtitle={
                <span>
                    Current stage ·{' '}
                    <span className="font-semibold text-[#282728]">
                        {currentStage || 'Not set'}
                    </span>
                    {total > 0 && (
                        <span className="text-gray-400">
                            {' '}— {completedCount} of {total} completed
                        </span>
                    )}
                </span>
            }
        >
            {total === 0 ? (
                <div className="text-center py-12">
                    <p className="text-sm text-gray-400">
                        Your application is in our pipeline — no milestones yet. Check back soon.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto -mx-2 px-2 pt-2 pb-1">
                    <div className="relative min-w-max md:min-w-0">
                        {/* Background track — the empty rail */}
                        <div className="absolute left-0 right-0 top-[14px] h-[2px] bg-gray-200 mx-[7%]" />
                        {/* Filled portion — runs from the first node up to
                            the current node. */}
                        <div
                            className="absolute top-[14px] h-[2px] bg-[#282728] mx-[7%] transition-all duration-700"
                            style={{ left: 0, right: `${100 - fillPct}%`, marginRight: 0 }}
                        />

                        <ol className="relative flex items-start gap-3">
                            {steps.map((step, i) => (
                                <JourneyStep key={step.key} step={step} index={i} />
                            ))}
                        </ol>
                    </div>
                </div>
            )}
        </PanelShell>
    );
}

function JourneyStep({ step, index }) {
    return (
        <li className="relative flex flex-col items-center text-center flex-1 min-w-[140px] md:min-w-0 px-1.5">
            <StatusDot status={step.status} />

            <p className="text-[11px] font-medium text-gray-500 mt-3 mb-0.5">
                Step {index + 1}
            </p>
            <h4 className={`text-[14px] font-bold leading-tight mb-1 ${
                step.status === 'pending' ? 'text-gray-400' : 'text-[#282728]'
            }`}>
                {step.label}
            </h4>
            <StatusLabel status={step.status} />
            {step.at && (
                <time className="block text-[10px] text-gray-400 tracking-wider mt-1">
                    {formatStamp(step.at)}
                </time>
            )}
        </li>
    );
}

function StatusDot({ status }) {
    if (status === 'completed') {
        // Solid charcoal with white check — "this is done"
        return (
            <span className="relative inline-flex w-7 h-7 rounded-full bg-[#282728] items-center justify-center ring-[6px] ring-white shadow-sm">
                <CheckCircle2 size={14} className="text-white" strokeWidth={3} />
            </span>
        );
    }
    if (status === 'current') {
        // Outer charcoal ring with a smaller charcoal dot inside —
        // the "target / bullseye" idiom from the reference. A soft ping
        // ring fades outward as a quiet "you are here" beacon.
        return (
            <span className="relative inline-flex w-7 h-7 items-center justify-center">
                <span className="absolute inset-[-6px] rounded-full bg-[#282728]/15 animate-ping" />
                <span className="relative inline-flex w-7 h-7 rounded-full border-[3px] border-[#282728] bg-white items-center justify-center ring-[6px] ring-white shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#282728]" />
                </span>
            </span>
        );
    }
    // Pending — empty light ring with a small gray dot
    return (
        <span className="relative inline-flex w-7 h-7 rounded-full bg-gray-200 items-center justify-center ring-[6px] ring-white">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
        </span>
    );
}

function StatusLabel({ status }) {
    if (status === 'completed') {
        return (
            <span className="text-[11px] font-semibold text-emerald-600">
                Completed
            </span>
        );
    }
    if (status === 'current') {
        return (
            <span className="text-[11px] font-semibold text-[#282728]">
                In Progress
            </span>
        );
    }
    return (
        <span className="text-[11px] font-medium text-gray-400">
            Pending
        </span>
    );
}

function formatStamp(iso) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        return d.toLocaleString(undefined, {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch {
        return iso;
    }
}
