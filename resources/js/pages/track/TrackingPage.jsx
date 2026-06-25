import React, { useEffect, useMemo, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Search, CheckCircle2, AlertCircle, ArrowRight,
    Save, X, Upload, FileText, ChevronDown,
    Eye, FileType, Plus, Trash2, Edit3, Edit,
    Check, Clock, MessageSquare,
    User as UserIcon, Folder as FolderIcon,
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
    agreements = [],
    timeline = [],
    visa = null,
    error = null,
}) {
    const [input, setInput] = useState(code || '');
    const flash = usePage().props.flash || {};

    // URL-synced tab + filter state. Reads initial values from
    // ?tab=, ?section=, ?status= on first render and writes back via
    // history.replaceState as the user clicks around. Direct links to a
    // specific tab/filter combination work without an extra round-trip.
    const [activeTab, setActiveTab] = useUrlParam('tab', 'visa');
    const [sectionFilter, setSectionFilter] = useUrlParam('section', 'all');
    const [statusFilter, setStatusFilter] = useUrlParam('status', 'all');

    // Modal state lifted to the page root so both the Visa-tab rows AND
    // the Documents tab "+ Add" can trigger the same upload modal. The
    // pre-selected docType lets a row's "Upload" button jump straight to
    // the file picker, skipping the picker step.
    const [uploadOpen, setUploadOpen] = useState(false);
    const [uploadPreselect, setUploadPreselect] = useState(null);
    const [editingDoc, setEditingDoc] = useState(null);
    const [deletingDoc, setDeletingDoc] = useState(null);
    const [journeyOpen, setJourneyOpen] = useState(false);

    const openUpload = (item = null) => {
        setUploadPreselect(item ? { key: item.key, label: item.label, hint: item.hint } : null);
        setUploadOpen(true);
    };
    const closeUpload = () => {
        setUploadOpen(false);
        setUploadPreselect(null);
    };

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
                {/* Hero — only shows when no lead is loaded yet (landing
                    state). Once the code resolves the hero collapses
                    into the identity header so vertical space goes to
                    the content. */}
                {!lead && (
                    <section className="relative bg-[#0c1611] text-white py-24 overflow-hidden">
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
                )}

                <section className="container mx-auto px-6 md:px-12 max-w-5xl py-10">
                    {flash.success && (
                        <div className="mb-6 bg-gray-50 border border-gray-300 px-5 py-3 text-sm text-[#282728] flex items-center gap-3">
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
                        <div className="space-y-4">
                            <IdentityHeader lead={lead} visa={visa} timeline={timeline} />
                            <JourneySnapshot
                                timeline={timeline}
                                onSeeFull={() => setJourneyOpen(true)}
                            />

                            {/* Tab strip + tab content. Counts on the Visa
                                and Documents tabs nudge the lead toward
                                the one with action items. */}
                            <div>
                                <TabStrip
                                    active={activeTab}
                                    onChange={setActiveTab}
                                    counts={{
                                        visa: visa?.checklist?.length || 0,
                                        documents: documents.length,
                                    }}
                                />

                                {activeTab === 'visa' && (
                                    <VisaTab
                                        visa={visa}
                                        documents={documents}
                                        sectionFilter={sectionFilter}
                                        onSectionFilter={setSectionFilter}
                                        statusFilter={statusFilter}
                                        onStatusFilter={setStatusFilter}
                                        onOpenUpload={openUpload}
                                        onOpenReplace={setEditingDoc}
                                    />
                                )}
                                {activeTab === 'information' && (
                                    <div className="bg-white border-x border-b border-gray-200 p-4 sm:p-6">
                                        <InformationPanel code={lead.tracking_code} info={info} />
                                    </div>
                                )}
                                {activeTab === 'documents' && (
                                    <div className="bg-white border-x border-b border-gray-200 p-4 sm:p-6">
                                        <DocumentsPanel
                                            documents={documents}
                                            onOpenUpload={openUpload}
                                            onEdit={setEditingDoc}
                                            onDelete={setDeletingDoc}
                                        />
                                        {agreements.length > 0 && (
                                            <div className="mt-6">
                                                <AgreementsPanel agreements={agreements} />
                                            </div>
                                        )}
                                    </div>
                                )}
                                {activeTab === 'messages' && <MessagesTabStub />}
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

            {/* Modals — single instance each, lifted to page root so
                both the Visa-tab rows and the Documents tab share them. */}
            <JourneyModal
                open={journeyOpen}
                onClose={() => setJourneyOpen(false)}
                timeline={timeline}
                currentStage={lead?.stage}
            />
            {lead && (
                <DocUploadModal
                    open={uploadOpen}
                    onClose={closeUpload}
                    code={lead.tracking_code}
                    lead={lead}
                    visa={visa}
                    documents={documents}
                    initialDocType={uploadPreselect}
                />
            )}
            {lead && (
                <DocEditModal
                    code={lead.tracking_code}
                    doc={editingDoc}
                    onClose={() => setEditingDoc(null)}
                />
            )}
            {lead && (
                <DocDeleteModal
                    code={lead.tracking_code}
                    doc={deletingDoc}
                    onClose={() => setDeletingDoc(null)}
                />
            )}

            <Footer />
        </div>
    );
}

// ─── Panels ──────────────────────────────────────────────────────────────

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

const TABS = ['visa', 'information', 'documents', 'messages'];

/**
 * Read a query-string param from the current URL with a fallback. Wrapped
 * so SSR/initial-render reads don't crash if `window` is missing.
 */
function readUrlParam(name, fallback) {
    if (typeof window === 'undefined') return fallback;
    const v = new URLSearchParams(window.location.search).get(name);
    return v == null || v === '' ? fallback : v;
}

/**
 * URL-synced state. Initial value comes from the query string; updates
 * push back via history.replaceState so the URL is shareable but we don't
 * pile up history entries. No Inertia round-trip — the page already has
 * the full data and we just slice/filter it client-side.
 */
function useUrlParam(name, fallback) {
    const [value, setValue] = useState(() => readUrlParam(name, fallback));
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        if (value === fallback || value == null || value === '') {
            url.searchParams.delete(name);
        } else {
            url.searchParams.set(name, value);
        }
        const next = url.pathname + (url.search ? url.search : '') + url.hash;
        if (next !== window.location.pathname + window.location.search + window.location.hash) {
            window.history.replaceState({}, '', next);
        }
    }, [name, value, fallback]);
    return [value, setValue];
}

/**
 * Identity header — two-column block at the very top of the tracked
 * application page. Left = application name + visa + tracking code.
 * Right = current journey status badge + "Step X of N".
 */
function IdentityHeader({ lead, visa, timeline = [] }) {
    const fullName = [lead?.first_name, lead?.last_name].filter(Boolean).join(' ') || 'Application';
    const visaName = visa?.name || null;
    const trackingCode = lead?.tracking_code || '';

    const currentIdx = timeline.findIndex((s) => s.status === 'current');
    const declinedStep = timeline.find((s) => s.alternative);
    const allCompleted = timeline.length > 0 && timeline.every((s) => s.status === 'completed');

    let statusLabel = 'In progress';
    let stepLabel = null;
    let badgeTone = 'bg-blue-100 text-blue-700 border-blue-200';
    if (declinedStep) {
        statusLabel = 'Application declined';
        badgeTone = 'bg-red-100 text-red-700 border-red-200';
    } else if (allCompleted) {
        statusLabel = 'Visa issued';
        badgeTone = 'bg-emerald-100 text-emerald-700 border-emerald-200';
    } else if (currentIdx >= 0) {
        statusLabel = timeline[currentIdx].label;
        stepLabel = `Step ${currentIdx + 1} of ${timeline.length}`;
    }

    return (
        <div className="bg-white border border-gray-200 px-6 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                <div>
                    <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-gray-400 mb-2">
                        Application Name
                    </p>
                    <p className="text-lg font-semibold text-[#282728] tracking-tight leading-snug">
                        {fullName}
                    </p>
                    <p className="text-[12px] text-gray-500 mt-1">
                        {visaName ? `${visaName} · ` : ''}
                        <span className="font-mono">{trackingCode}</span>
                    </p>
                </div>
                <div className="sm:text-right">
                    <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-gray-400 mb-2">
                        Application Status
                    </p>
                    <span className={`inline-flex items-center px-3 py-1 text-[11px] font-bold tracking-wide border ${badgeTone}`}>
                        {statusLabel}
                    </span>
                    {stepLabel && (
                        <p className="text-[12px] text-gray-500 mt-1">{stepLabel}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Journey snapshot — horizontal 3-step stepper showing where the lead is
 * in the application journey. Each visible node shows a state circle, the
 * "Step N" label, the step name, a status word, and an optional
 * description (immigration journey only — general timeline has no
 * per-step description).
 *
 * Selection rule — always shows exactly 3 consecutive timeline entries:
 *   - If a step is "current", centre the window on it: (currentIdx-1,
 *     currentIdx, currentIdx+1), clamped to the timeline ends.
 *   - If no current step (terminal Issued), show the last three completed
 *     entries.
 *   - Declined: the alternative "application_declined" entry replaces the
 *     stepper with a red outcome card.
 *
 * Edge cases preserved:
 *   - First step (no completed): window starts at index 0.
 *   - Last step (no next): window ends at last index.
 */
function JourneySnapshot({ timeline = [], onSeeFull }) {
    const declined = timeline.find((s) => s.alternative);
    const allCompleted = timeline.length > 0
        && !declined
        && timeline.filter((s) => !s.alternative).every((s) => s.status === 'completed');

    // Pick three consecutive entries to display, centred on `current` when
    // possible. Clamp so we never slice past the timeline ends.
    const visibleSteps = useMemo(() => {
        const main = timeline.filter((s) => !s.alternative);
        if (main.length === 0) return [];
        const currentIdx = main.findIndex((s) => s.status === 'current');
        const anchor = currentIdx >= 0 ? currentIdx : main.length - 1;
        const start = Math.max(0, Math.min(anchor - 1, main.length - 3));
        const end = Math.min(main.length, start + 3);
        return main.slice(start, end).map((step, i) => ({
            ...step,
            globalIndex: start + i + 1, // 1-based "Step N" label
        }));
    }, [timeline]);

    return (
        <div className="bg-white border border-gray-200 px-6 py-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold text-[#282728] tracking-tight">
                    Your journey
                </h2>
                <button
                    type="button"
                    onClick={onSeeFull}
                    className="text-[11px] font-semibold text-[#282728] hover:underline inline-flex items-center gap-1"
                >
                    See full journey <ArrowRight size={12} />
                </button>
            </div>

            {declined ? (
                <div className="border-l-4 border-red-500 bg-red-50 px-4 py-3">
                    <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-red-600 mb-1">
                        Outcome
                    </p>
                    <p className="text-sm font-semibold text-red-900">{declined.label}</p>
                    {declined.description && (
                        <p className="text-[12px] text-red-700 mt-1">{declined.description}</p>
                    )}
                </div>
            ) : allCompleted ? (
                <div className="border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3">
                    <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-emerald-700 mb-1">
                        Complete
                    </p>
                    <p className="text-sm font-semibold text-emerald-900">All journey steps complete.</p>
                </div>
            ) : visibleSteps.length > 0 ? (
                <HorizontalStepper steps={visibleSteps} />
            ) : null}
        </div>
    );
}

/**
 * Horizontal 3-step tracker. A single connecting line sits behind the
 * circles, spanning from the centre of the first column to the centre of
 * the third (left-[16.67%] right-[16.67%]). The portion before/under the
 * current step's circle is rendered in `bg-[#282728]` (filled) and the
 * portion after is `bg-gray-200` (pending), giving the classic
 * "progressbar" feel without computing pixel widths.
 */
function HorizontalStepper({ steps }) {
    // Find the column index (0/1/2) of the current step within the visible
    // window. Used to colour the connecting line up to that point.
    const currentVisibleIdx = steps.findIndex((s) => s.status === 'current');
    // If no current is visible (all completed in window), treat the whole
    // line as completed.
    const filledCols = currentVisibleIdx >= 0 ? currentVisibleIdx : steps.length - 1;

    return (
        <div className="relative pt-1">
            {/* Connecting line — runs through the circle centres. Vertical
                position 20px = half of the 40px circle height. */}
            <div
                aria-hidden
                className="absolute top-[20px] left-[16.667%] right-[16.667%] h-[2px] bg-gray-200"
            />
            {/* Filled portion of the line, from start through the current
                step's column centre. 0 → 1/2 (50%) → 1 (100%) for 3 cols. */}
            {filledCols > 0 && (
                <div
                    aria-hidden
                    className="absolute top-[20px] left-[16.667%] h-[2px] bg-[#282728]"
                    style={{ width: `${filledCols * (100 / 3)}%` }}
                />
            )}
            <div className="grid grid-cols-3 gap-2 relative">
                {steps.map((step) => (
                    <StepNode key={step.key} step={step} />
                ))}
            </div>
        </div>
    );
}

function StepNode({ step }) {
    const { status, globalIndex, label, description } = step;
    const statusWord = {
        completed: 'Completed',
        current: 'In Progress',
        pending: 'Pending',
    }[status] || 'Pending';
    return (
        <div className="flex flex-col items-center text-center px-2">
            <StepCircle status={status} />
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400">
                Step {globalIndex}
            </p>
            <p className={`mt-1 text-[14px] font-semibold leading-snug ${
                status === 'pending' ? 'text-gray-400' : 'text-[#282728]'
            }`}>
                {label}
            </p>
            <p className={`mt-1 text-[11px] italic ${
                status === 'completed' ? 'text-emerald-600' :
                status === 'current'   ? 'text-[#282728]' :
                'text-gray-400'
            }`}>
                {statusWord}
            </p>
            {description && (
                <p className="mt-2 text-[11px] text-gray-500 leading-relaxed max-w-[200px]">
                    {description}
                </p>
            )}
        </div>
    );
}

function StepCircle({ status }) {
    if (status === 'completed') {
        // Filled dark circle with white check — same family as the
        // "current" treatment so completed nodes read as "this happened"
        // not "this is happening".
        return (
            <span className="relative z-10 inline-flex w-10 h-10 rounded-full bg-[#282728] items-center justify-center flex-shrink-0">
                <Check size={16} className="text-white" strokeWidth={3} />
            </span>
        );
    }
    if (status === 'current') {
        // Dark filled circle with inner white dot — the "active" marker
        // from the reference. Ringed with a soft halo to emphasise focus.
        return (
            <span className="relative z-10 inline-flex w-10 h-10 rounded-full bg-[#282728] items-center justify-center flex-shrink-0 ring-4 ring-[#282728]/10">
                <span className="block w-2 h-2 rounded-full bg-white" />
            </span>
        );
    }
    // Pending — hollow gray ring with a soft inner dot.
    return (
        <span className="relative z-10 inline-flex w-10 h-10 rounded-full bg-white border-2 border-gray-200 items-center justify-center flex-shrink-0">
            <span className="block w-2 h-2 rounded-full bg-gray-300" />
        </span>
    );
}

/**
 * Modal wrapping the existing TimelinePanel — triggered by the "See full
 * journey" link on the snapshot.
 */
function JourneyModal({ open, onClose, timeline, currentStage }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={onClose} className="absolute inset-0 bg-[#0c1611]/70 backdrop-blur-sm" />
            <div className="relative bg-white border border-gray-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h3 className="text-lg font-semibold text-[#282728] tracking-tight">
                        Application journey
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-[#282728]"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="px-6 py-6">
                    <TimelinePanel timeline={timeline} currentStage={currentStage} />
                </div>
            </div>
        </div>
    );
}

/**
 * Tab strip. Active tab is bold-underlined; idle tabs are gray text. Each
 * tab can carry a small numeric badge (e.g. checklist count, document
 * count).
 */
function TabStrip({ active, onChange, counts = {} }) {
    const items = [
        { key: 'visa',        label: 'Visa',        Icon: FileText,  badge: counts.visa },
        { key: 'information', label: 'Information', Icon: UserIcon,  badge: null },
        { key: 'documents',   label: 'Documents',   Icon: FolderIcon,badge: counts.documents },
        { key: 'messages',    label: 'Messages',    Icon: MessageSquare, badge: null },
    ];
    return (
        <div className="bg-white border-x border-t border-gray-200">
            <div className="flex overflow-x-auto">
                {items.map((it) => {
                    const isActive = active === it.key;
                    return (
                        <button
                            key={it.key}
                            type="button"
                            onClick={() => onChange(it.key)}
                            className={`flex items-center gap-2 px-5 py-3 text-[13px] font-semibold tracking-tight whitespace-nowrap transition-colors border-b-2 ${
                                isActive
                                    ? 'text-[#282728] border-[#282728]'
                                    : 'text-gray-500 border-transparent hover:text-[#282728]'
                            }`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <it.Icon size={14} strokeWidth={2} />
                            <span>{it.label}</span>
                            {typeof it.badge === 'number' && it.badge > 0 && (
                                <span className={`text-[10px] font-bold tracking-wide px-1.5 py-0.5 ${
                                    isActive ? 'bg-[#282728] text-white' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {it.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Visa tab — the table-based requirements view. Toolbar with progress +
 * filters above; per-section table rows below. Desktop renders as a real
 * <table>; mobile (<sm:) renders the same data as a stacked card list to
 * stay readable on narrow screens.
 */
function VisaTab({
    visa,
    documents,
    sectionFilter,
    onSectionFilter,
    statusFilter,
    onStatusFilter,
    onOpenUpload,
    onOpenReplace,
}) {
    if (!visa || !Array.isArray(visa.checklist) || visa.checklist.length === 0) {
        return (
            <div className="bg-white border-x border-b border-gray-200 px-6 py-12 text-center">
                <FileText size={26} className="mx-auto text-gray-300 mb-2" strokeWidth={1.5} />
                <p className="text-[13px] text-gray-500">
                    No visa requirements catalogued yet for this application.
                </p>
            </div>
        );
    }

    // Index uploaded docs by checklist_key so the table row can decorate
    // itself with filename, status, last-update, and the doc id for
    // View / Replace actions. If multiple docs exist for the same key,
    // the most recent wins.
    const docsByKey = useMemo(() => {
        const map = new Map();
        for (const d of (documents || [])) {
            if (!d.checklist_key) continue;
            const prev = map.get(d.checklist_key);
            if (!prev || new Date(d.created_at) > new Date(prev.created_at)) {
                map.set(d.checklist_key, d);
            }
        }
        return map;
    }, [documents]);

    // Build the decorated section list once, then apply user filters.
    const allSections = useMemo(() => {
        const grouped = new Map();
        const order = [];
        for (const it of visa.checklist) {
            const { section, name } = parseChecklistLabel(it.label);
            if (!grouped.has(section)) {
                grouped.set(section, []);
                order.push(section);
            }
            const doc = docsByKey.get(it.key) || null;
            grouped.get(section).push({
                key: it.key,
                section,
                name,
                label: it.label,
                hint: it.hint || '',
                required: it.required !== false,
                status: it.status || 'missing',
                doc,
            });
        }
        return order.map((s) => ({ section: s, items: grouped.get(s) }));
    }, [visa.checklist, docsByKey]);

    const sectionOptions = useMemo(() => ['all', ...allSections.map((s) => s.section)], [allSections]);

    const statusOptions = ['all', 'required', 'submitted', 'approved', 'rejected'];

    const matchesStatus = (item, filter) => {
        if (filter === 'all') return true;
        if (filter === 'required') return item.status === 'missing' && item.required;
        return item.status === filter;
    };

    const filteredSections = useMemo(() => {
        return allSections
            .filter((s) => sectionFilter === 'all' || s.section === sectionFilter)
            .map((s) => ({
                section: s.section,
                items: s.items.filter((it) => matchesStatus(it, statusFilter)),
            }))
            .filter((s) => s.items.length > 0);
    }, [allSections, sectionFilter, statusFilter]);

    const counts = useMemo(() => {
        const flat = allSections.flatMap((s) => s.items);
        return {
            total: flat.length,
            approved: flat.filter((i) => i.status === 'approved').length,
            submitted: flat.filter((i) => i.status === 'submitted').length,
            rejected: flat.filter((i) => i.status === 'rejected').length,
        };
    }, [allSections]);

    return (
        <div className="bg-white border-x border-b border-gray-200">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-100">
                <div className="text-[13px] text-[#282728] flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>
                        <span className="font-semibold">Progress:</span>{' '}
                        {counts.approved} / {counts.total}
                    </span>
                    <span className="text-emerald-600">· {counts.approved} approved</span>
                    <span className="text-blue-600">· {counts.submitted} in review</span>
                    <span className="text-red-600">· {counts.rejected} rejected</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <FilterSelect
                        value={sectionFilter}
                        onChange={onSectionFilter}
                        options={sectionOptions}
                        renderLabel={(v) => v === 'all' ? 'All sections' : v}
                    />
                    <FilterSelect
                        value={statusFilter}
                        onChange={onStatusFilter}
                        options={statusOptions}
                        renderLabel={(v) => v === 'all' ? 'All statuses' : v.charAt(0).toUpperCase() + v.slice(1)}
                    />
                </div>
            </div>

            {/* Empty filtered state */}
            {filteredSections.length === 0 ? (
                <div className="px-6 py-12 text-center">
                    <p className="text-[13px] text-gray-500">
                        No items match the current filters.
                    </p>
                </div>
            ) : (
                <>
                    {/* Desktop table */}
                    <div className="hidden md:block">
                        <table className="w-full" style={{ tableLayout: 'fixed' }}>
                            <colgroup>
                                <col style={{ width: '32px' }} />
                                <col />
                                <col style={{ width: '110px' }} />
                                <col style={{ width: '90px' }} />
                                <col style={{ width: '120px' }} />
                            </colgroup>
                            <tbody>
                                {filteredSections.map(({ section, items }) => (
                                    <React.Fragment key={section}>
                                        <SectionHeaderRow
                                            section={section}
                                            done={items.filter((i) => i.status === 'approved').length}
                                            total={(allSections.find((s) => s.section === section)?.items.length) || items.length}
                                        />
                                        {items.map((item) => (
                                            <TableRow
                                                key={item.key}
                                                item={item}
                                                onOpenUpload={onOpenUpload}
                                                onOpenReplace={onOpenReplace}
                                            />
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Mobile card list — same data, vertically stacked */}
                    <div className="md:hidden divide-y divide-gray-100">
                        {filteredSections.map(({ section, items }) => (
                            <div key={section} className="px-4 py-3">
                                <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-gray-500 mb-2">
                                    {section} {items.filter((i) => i.status === 'approved').length}/{items.length}
                                </p>
                                <div className="space-y-2">
                                    {items.map((item) => (
                                        <MobileItemCard
                                            key={item.key}
                                            item={item}
                                            onOpenUpload={onOpenUpload}
                                            onOpenReplace={onOpenReplace}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function FilterSelect({ value, onChange, options, renderLabel }) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-[12px] text-[#282728] px-3 py-2 pr-8 focus:outline-none focus:border-[#282728]"
            >
                {options.map((opt) => (
                    <option key={opt} value={opt}>{renderLabel(opt)}</option>
                ))}
            </select>
            <ChevronDown
                size={12}
                strokeWidth={2}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
        </div>
    );
}

function SectionHeaderRow({ section, done, total }) {
    return (
        <tr>
            <td colSpan={5} className="px-4 sm:px-6 pt-5 pb-2 bg-gray-50/50">
                <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-gray-500 inline-flex items-center gap-2">
                    <FolderIcon size={11} strokeWidth={2} />
                    {section} {done}/{total}
                </p>
            </td>
        </tr>
    );
}

function TableRow({ item, onOpenUpload, onOpenReplace }) {
    return (
        <tr className="border-t border-gray-100 hover:bg-gray-50/40">
            <td className="px-4 sm:px-6 py-3 align-top">
                <RowStatusIcon status={item.status} />
            </td>
            <td className="py-3 align-top">
                <p className="text-[13px] font-semibold text-[#282728] flex items-center gap-1.5">
                    {item.name}
                    {item.required && item.status === 'missing' && (
                        <span className="text-red-500 text-[11px] font-bold" title="Required">*</span>
                    )}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                    {renderRowSecondary(item)}
                </p>
            </td>
            <td className="px-4 py-3 align-top">
                <RowStatusBadge status={item.status} required={item.required} />
            </td>
            <td className="px-2 py-3 align-top text-[11px] text-gray-500 leading-snug">
                {item.doc?.created_at ? formatStamp(item.doc.created_at) : '—'}
            </td>
            <td className="px-4 sm:px-6 py-3 align-top text-right">
                <RowActions item={item} onOpenUpload={onOpenUpload} onOpenReplace={onOpenReplace} />
            </td>
        </tr>
    );
}

function MobileItemCard({ item, onOpenUpload, onOpenReplace }) {
    return (
        <div className="border border-gray-200 px-3 py-3 bg-white">
            <div className="flex items-start gap-3">
                <RowStatusIcon status={item.status} />
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#282728]">
                        {item.name}
                        {item.required && item.status === 'missing' && (
                            <span className="text-red-500 text-[11px] font-bold ml-1">*</span>
                        )}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                        {renderRowSecondary(item)}
                    </p>
                    <div className="flex items-center justify-between mt-2 gap-2">
                        <RowStatusBadge status={item.status} required={item.required} />
                        <RowActions item={item} onOpenUpload={onOpenUpload} onOpenReplace={onOpenReplace} compact />
                    </div>
                </div>
            </div>
        </div>
    );
}

function renderRowSecondary(item) {
    if (item.status === 'rejected' && item.doc?.note) {
        return `Reason: ${item.doc.note}`;
    }
    if (item.doc) {
        const size = item.doc.size ? `${(item.doc.size / 1024).toFixed(0)} KB` : '';
        return [item.doc.original_name, size].filter(Boolean).join(' · ');
    }
    return item.hint || 'Required document — please upload when ready.';
}

function RowStatusIcon({ status }) {
    const styles = {
        missing:   { ring: 'border-gray-300 border-dashed', body: 'bg-transparent', child: null },
        submitted: { ring: 'border-blue-500',  body: 'bg-blue-50',  child: <Clock size={11} className="text-blue-600" /> },
        approved:  { ring: 'border-emerald-500', body: 'bg-emerald-100', child: <Check size={11} className="text-emerald-700" strokeWidth={3} /> },
        rejected:  { ring: 'border-red-500',   body: 'bg-red-100',  child: <X size={11} className="text-red-700" strokeWidth={3} /> },
    }[status] || { ring: 'border-gray-300 border-dashed', body: 'bg-transparent', child: null };
    return (
        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full border-2 ${styles.ring} ${styles.body}`}>
            {styles.child}
        </span>
    );
}

function RowStatusBadge({ status, required }) {
    if (status === 'missing') {
        return required ? (
            <span className="inline-block px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] uppercase bg-red-50 text-red-700 border border-red-200">
                Required
            </span>
        ) : (
            <span className="inline-block px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] uppercase bg-gray-50 text-gray-500 border border-gray-200">
                Optional
            </span>
        );
    }
    const tones = {
        submitted: 'bg-blue-50 text-blue-700 border-blue-200',
        approved:  'bg-emerald-50 text-emerald-700 border-emerald-200',
        rejected:  'bg-red-50 text-red-700 border-red-200',
    };
    const labels = { submitted: 'Submitted', approved: 'Approved', rejected: 'Rejected' };
    return (
        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] uppercase border ${tones[status]}`}>
            {labels[status]}
        </span>
    );
}

function RowActions({ item, onOpenUpload, onOpenReplace, compact = false }) {
    const baseBtn = compact
        ? 'inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold tracking-wide uppercase'
        : 'inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold tracking-wide uppercase';
    if (item.status === 'missing') {
        return (
            <button
                type="button"
                onClick={() => onOpenUpload(item)}
                className={`${baseBtn} bg-[#282728] text-white hover:bg-black transition-colors`}
            >
                <Upload size={11} /> Upload
            </button>
        );
    }
    if (item.status === 'rejected') {
        return (
            <button
                type="button"
                onClick={() => onOpenUpload(item)}
                className={`${baseBtn} bg-[#282728] text-white hover:bg-black transition-colors`}
            >
                <Upload size={11} /> Re-upload
            </button>
        );
    }
    if (item.status === 'submitted') {
        return (
            <div className="flex items-center gap-3 justify-end">
                {item.doc?.url && (
                    <a
                        href={item.doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-[#282728] hover:underline"
                    >
                        View
                    </a>
                )}
                {item.doc?.is_editable && (
                    <button
                        type="button"
                        onClick={() => onOpenReplace(item.doc)}
                        className="text-[11px] font-semibold text-[#282728] hover:underline"
                    >
                        Replace
                    </button>
                )}
            </div>
        );
    }
    // approved
    if (item.doc?.url) {
        return (
            <a
                href={item.doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-[#282728] hover:underline"
            >
                View
            </a>
        );
    }
    return <span className="text-[11px] text-gray-400">—</span>;
}

function MessagesTabStub() {
    return (
        <div className="bg-white border-x border-b border-gray-200 px-6 py-16 text-center">
            <MessageSquare size={28} className="mx-auto text-gray-300 mb-3" strokeWidth={1.5} />
            <p className="text-[13px] font-semibold text-[#282728] mb-1">
                Messages from your adviser will appear here
            </p>
            <p className="text-[12px] text-gray-500 max-w-sm mx-auto leading-relaxed">
                Coming soon — your adviser will be able to send you updates
                and you can reply through this page.
            </p>
        </div>
    );
}


function DocumentsPanel({ documents, onOpenUpload, onEdit, onDelete }) {
    return (
        <PanelShell
            title="Documents"
            subtitle="Uploaded files we have on your application."
            action={
                <button
                    type="button"
                    onClick={() => onOpenUpload()}
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
                        onClick={() => onOpenUpload()}
                        className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#282728] inline-flex items-center gap-1.5 border border-[#282728] px-3 py-2 hover:bg-[#282728] hover:text-white transition-colors"
                    >
                        <Plus size={12} /> Upload your first document
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {documents.map((d) => (
                        <DocGalleryCard
                            key={d.id}
                            doc={d}
                            onEdit={() => onEdit(d)}
                            onDelete={() => onDelete(d)}
                        />
                    ))}
                </div>
            )}
        </PanelShell>
    );
}

/**
 * Parse a "Section · Item Name" checklist label into its two halves. The
 * seeder embeds the section in the label this way because the underlying
 * schema is flat — we recover the grouping at render time.
 */
function parseChecklistLabel(label) {
    const raw = String(label || '');
    const idx = raw.indexOf(' · ');
    if (idx === -1) return { section: 'General', name: raw };
    return { section: raw.slice(0, idx), name: raw.slice(idx + 3) };
}

/**
 * Group checklist items by their parsed section, preserving the order in
 * which sections first appear. Each item is tagged with whether the lead
 * has already uploaded a doc against that key. Section order matters
 * because the seeder writes the items in the intended display order.
 */
function groupChecklistBySection(items, uploadedKeys) {
    const order = [];
    const byKey = new Map();
    for (const it of items) {
        const { section, name } = parseChecklistLabel(it.label);
        if (!byKey.has(section)) {
            byKey.set(section, []);
            order.push(section);
        }
        byKey.get(section).push({
            key: it.key,
            section,
            name,
            label: it.label,
            hint: it.hint || '',
            required: it.required !== false,
            alreadyUploaded: uploadedKeys.has(it.key),
        });
    }
    return order.map(section => ({ section, items: byKey.get(section) }));
}

/**
 * Visa-checklist picker. Renders items grouped by section with a search
 * input (when the list is long), a red asterisk for required items, and a
 * subtle "Uploaded" badge on items that already have a doc attached.
 * Appends an "Other supporting document" fallback at the bottom so leads
 * can still upload things outside the checklist.
 */
function ChecklistPicker({ sections, allEmpty, search, onSearchChange, showSearch, onPick }) {
    const otherFallback = {
        key: 'other',
        label: 'Other supporting document',
        hint: 'Anything outside the checklist we have asked for.',
    };
    return (
        <div>
            {showSearch && (
                <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 focus-within:border-[#282728] focus-within:bg-white transition-colors">
                    <Search size={13} className="text-gray-400 flex-shrink-0" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search the checklist…"
                        className="flex-1 bg-transparent text-sm text-[#282728] focus:outline-none placeholder-gray-400"
                    />
                </div>
            )}

            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                {allEmpty && (
                    <p className="text-[12px] text-gray-500 text-center py-6">
                        Nothing on your checklist matches that search.
                    </p>
                )}

                {sections.map(({ section, items }) => (
                    <div key={section}>
                        <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-gray-500 mb-2">
                            {section}
                        </p>
                        <div className="space-y-1.5">
                            {items.map((it) => (
                                <button
                                    key={it.key}
                                    type="button"
                                    onClick={() => onPick({ key: it.key, label: it.label, hint: it.hint })}
                                    className="w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 border border-gray-200/80 hover:border-[#282728] hover:shadow-sm hover:-translate-y-px transition-all group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold text-[#282728] flex items-center gap-1.5">
                                            <span className="truncate">{it.name}</span>
                                            {it.required && (
                                                <span className="text-red-500 text-[11px] font-bold" title="Required">*</span>
                                            )}
                                        </p>
                                        {it.hint && (
                                            <p className="text-[11px] text-gray-500 mt-0.5 truncate">{it.hint}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {it.alreadyUploaded && (
                                            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-1">
                                                Uploaded
                                            </span>
                                        )}
                                        <ChevronDown
                                            size={14}
                                            strokeWidth={2}
                                            className="text-gray-300 group-hover:text-[#282728] group-hover:translate-x-1 rotate-[-90deg] transition-all"
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Always-available fallback for things outside the checklist. */}
                <div>
                    <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-gray-500 mb-2">
                        Other
                    </p>
                    <button
                        type="button"
                        onClick={() => onPick(otherFallback)}
                        className="w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 border border-gray-200/80 hover:border-[#282728] hover:shadow-sm hover:-translate-y-px transition-all group"
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-[#282728]">{otherFallback.label}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">{otherFallback.hint}</p>
                        </div>
                        <ChevronDown
                            size={14}
                            strokeWidth={2}
                            className="text-gray-300 group-hover:text-[#282728] group-hover:translate-x-1 rotate-[-90deg] flex-shrink-0 transition-all"
                        />
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Modal-driven upload flow. Step 1 = pick a type (visa-specific checklist
 * if available, else hardcoded DOC_TYPES); step 2 = (passport metadata, if
 * applicable) + file + upload button. Backdrop and Esc both close. The
 * previous list-then-form layout inside the panel was confusing because
 * the document type picker fought with the gallery for the same space —
 * moving it into a modal cleans that up.
 */
function DocUploadModal({ open, onClose, code, lead = null, visa = null, documents = [], initialDocType = null }) {
    const [docType, setDocType] = useState(null);
    const [search, setSearch] = useState('');
    const { data, setData, post, processing, errors, reset } = useForm({
        file: null,
        checklist_key: '',
        passport_number: '',
        passport_expiry: '',
    });

    // When the parent opens the modal with a pre-selected item (e.g. the
    // Visa-tab table row's "Upload" button), skip the picker step and jump
    // straight to the file-chooser body.
    useEffect(() => {
        if (open && initialDocType) {
            setDocType(initialDocType);
            setData('checklist_key', initialDocType.key);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialDocType?.key]);

    // Prefer the visa-specific checklist when the lead is on an immigration
    // case with a known visa type. Otherwise fall back to the hardcoded
    // DOC_TYPES list so non-immigration leads (and immigration leads whose
    // visa type isn't catalogued) still get a working picker.
    const useChecklist = !!(lead?.is_immigration_case && Array.isArray(visa?.checklist) && visa.checklist.length > 0);

    const uploadedKeys = useMemo(() => new Set(
        (documents || []).map(d => d.checklist_key).filter(Boolean)
    ), [documents]);

    const checklistSections = useMemo(
        () => useChecklist ? groupChecklistBySection(visa.checklist, uploadedKeys) : [],
        [useChecklist, visa?.checklist, uploadedKeys]
    );

    const totalChecklistItems = useChecklist
        ? checklistSections.reduce((n, s) => n + s.items.length, 0)
        : 0;
    const showSearch = totalChecklistItems > 10;

    const filteredSections = useMemo(() => {
        if (!useChecklist) return [];
        const q = search.trim().toLowerCase();
        if (!q) return checklistSections;
        return checklistSections
            .map(s => ({
                section: s.section,
                items: s.items.filter(i =>
                    i.name.toLowerCase().includes(q) ||
                    (i.hint || '').toLowerCase().includes(q) ||
                    s.section.toLowerCase().includes(q)
                ),
            }))
            .filter(s => s.items.length > 0);
    }, [useChecklist, checklistSections, search]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') close(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    if (!open) return null;

    const close = () => {
        setDocType(null);
        setSearch('');
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
                        useChecklist ? (
                            <ChecklistPicker
                                sections={filteredSections}
                                allEmpty={filteredSections.length === 0}
                                search={search}
                                onSearchChange={setSearch}
                                showSearch={showSearch}
                                onPick={pickDocType}
                            />
                        ) : (
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
                        )
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
    // Index of the first alternative-outcome step (declined, etc.) —
    // -1 if there isn't one. The progress line splits at this point:
    // the segment leading into the alternative is rendered dashed.
    const altIndex = steps.findIndex((s) => s.alternative);
    const hasAlternative = altIndex >= 0;
    // Fill stops *at* the current node (or the alternative, when there
    // is no in-progress step because the case has terminated).
    const stopIndex = currentIndex > 0
        ? currentIndex
        : (hasAlternative ? altIndex : completedCount - 1);
    const fillPct = total <= 1 ? 0 : (Math.max(0, stopIndex) / (total - 1)) * 100;
    // Percent position of the alternative step, used as the boundary
    // where the dashed segment starts.
    const altPct = hasAlternative && total > 1 ? (altIndex / (total - 1)) * 100 : 100;

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
                <>
                    <div className="overflow-x-auto -mx-2 px-2 pt-2 pb-1">
                        <div className="relative min-w-max md:min-w-0">
                            {/* Background track — solid section runs up
                                to (but not into) the alternative step;
                                dashed segment runs from there to the end
                                when an alternative outcome exists. */}
                            <div
                                className="absolute top-[14px] h-[2px] bg-gray-200 mx-[7%]"
                                style={hasAlternative
                                    ? { left: 0, right: `${100 - altPct}%`, marginRight: 0 }
                                    : { left: 0, right: 0 }}
                            />
                            {hasAlternative && (
                                <div
                                    className="absolute top-[12px] mx-[7%] border-t-[2px] border-dashed border-gray-300"
                                    style={{ left: `${altPct}%`, right: 0, marginLeft: 0 }}
                                />
                            )}
                            {/* Filled progress — charcoal up to the
                                current / stop index. Also flips to dashed
                                if the stop sits past the alternative
                                boundary. */}
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
                    {hasAlternative && (
                        <p className="text-[10px] text-gray-400 text-center mt-3">
                            Solid line = standard progression · Dashed line = alternative outcome
                        </p>
                    )}
                </>
            )}
        </PanelShell>
    );
}

function JourneyStep({ step, index }) {
    const isAlt = !!step.alternative;
    return (
        <li className="relative flex flex-col items-center text-center flex-1 min-w-[140px] md:min-w-0 px-1.5">
            <StatusDot status={step.status} alternative={isAlt} />

            <p className="text-[11px] font-medium text-gray-500 mt-3 mb-0.5">
                {isAlt ? 'Outcome' : `Step ${index + 1}`}
            </p>
            <h4 className={`text-[14px] font-bold leading-tight mb-1 ${
                isAlt
                    ? 'text-rose-700'
                    : step.status === 'pending'
                        ? 'text-gray-400'
                        : 'text-[#282728]'
            }`}>
                {step.label}
            </h4>
            <StatusLabel status={step.status} alternative={isAlt} />
            {step.description && (
                <p className="text-[11px] text-gray-500 leading-snug mt-1.5 max-w-[180px] mx-auto">
                    {step.description}
                </p>
            )}
            {step.at && (
                <time className="block text-[10px] text-gray-400 tracking-wider mt-1">
                    {formatStamp(step.at)}
                </time>
            )}
        </li>
    );
}

function StatusDot({ status, alternative = false }) {
    // Alternative-outcome step (e.g. "Application declined") — rose-tinted
    // ring + white X-circle so it reads as a branch, not a continuation.
    if (alternative) {
        return (
            <span className="relative inline-flex w-7 h-7 rounded-full bg-rose-600 items-center justify-center ring-[6px] ring-white shadow-sm">
                <AlertCircle size={14} className="text-white" strokeWidth={2.5} />
            </span>
        );
    }
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

function StatusLabel({ status, alternative = false }) {
    if (alternative) {
        return (
            <span className="text-[11px] font-semibold text-rose-700">
                Declined
            </span>
        );
    }
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

// Build 11.D Phase 3 — Agreements awaiting (or already done) on the tracker.
// Sent / viewed agreements get a "View & Sign" CTA; signed ones show muted
// with a "View signed copy" link so the client can re-read what they signed.
function AgreementsPanel({ agreements = [] }) {
    if (! agreements.length) return null;

    return (
        <section>
            <header className="mb-2">
                <h3 className="text-sm font-bold text-gray-900">Agreements</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                    Consultancy agreements your consultant has shared with you.
                </p>
            </header>
            <ul className="space-y-2">
                {agreements.map((a) => {
                    const isSigned = a.status === 'signed';
                    return (
                        <li
                            key={a.id}
                            className={`flex items-start justify-between gap-3 px-4 py-3 rounded-lg border ${
                                isSigned ? 'border-gray-100 bg-gray-50/60' : 'border-gray-200 bg-white'
                            }`}
                        >
                            <div className="min-w-0">
                                <p className={`text-sm font-semibold ${isSigned ? 'text-gray-600' : 'text-gray-900'}`}>
                                    {a.title}
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                    {isSigned
                                        ? <>Signed {formatStamp(a.signed_at)}</>
                                        : <>Sent {formatStamp(a.sent_at)} · Awaiting your signature</>}
                                </p>
                            </div>
                            <a
                                href={isSigned ? a.signed_url : a.sign_url}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors flex-shrink-0 ${
                                    isSigned
                                        ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                                        : 'bg-gray-900 text-white hover:bg-black'
                                }`}
                            >
                                {isSigned ? 'View signed copy' : 'View & sign'} →
                            </a>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
