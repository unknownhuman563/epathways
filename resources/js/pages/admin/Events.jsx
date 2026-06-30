import React, { useState, useEffect } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import {
    Search, Plus, Eye, Edit2, Trash2, ChevronDown, Clock,
    Calendar, MapPin, Users, Globe, XCircle, Tag,
    Copy, ExternalLink, BarChart2, ArrowUpRight, ArrowDownRight,
    X, ChevronRight, ChevronLeft, AlertCircle
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_EVENTS = [
    {
        id: 'EVT-1001', title: 'Canada Education Fair 2026', type: 'Education Fair',
        date: 'Apr 10, 2026', time: '10:00 AM – 4:00 PM',
        location: 'SMX Convention Center, Manila', mode: 'In-Person',
        branch: 'Philippines', organizer: 'Maria', status: 'Upcoming',
        capacity: 300, registered: 214, sessions: 3,
    },
    {
        id: 'EVT-1002', title: 'Australia Visa Webinar', type: 'Webinar',
        date: 'Apr 15, 2026', time: '2:00 PM – 3:30 PM',
        location: 'Zoom', mode: 'Online',
        branch: 'Malaysia', organizer: 'David', status: 'Upcoming',
        capacity: 500, registered: 421, sessions: 0,
    },
    {
        id: 'EVT-1003', title: 'UK Student Life Seminar', type: 'Seminar',
        date: 'Mar 28, 2026', time: '9:00 AM – 12:00 PM',
        location: 'Kuala Lumpur Office', mode: 'Hybrid',
        branch: 'Malaysia', organizer: 'Sarah', status: 'Ongoing',
        capacity: 150, registered: 150, sessions: 2,
    },
    {
        id: 'EVT-1004', title: 'New Zealand Open Day', type: 'Open Day',
        date: 'Mar 10, 2026', time: '11:00 AM – 5:00 PM',
        location: 'Mumbai Office', mode: 'In-Person',
        branch: 'India', organizer: 'Priya', status: 'Completed',
        capacity: 200, registered: 198, sessions: 4,
    },
    {
        id: 'EVT-1005', title: 'Study Abroad Info Night', type: 'Info Night',
        date: 'Feb 20, 2026', time: '6:00 PM – 8:00 PM',
        location: 'Google Meet', mode: 'Online',
        branch: 'Philippines', organizer: 'Maria', status: 'Cancelled',
        capacity: 100, registered: 34, sessions: 0,
    },
];

const EVENT_TYPES = ['Seminar', 'Webinar', 'Education Fair', 'Open Day', 'Info Night', 'Expo', 'One-on-one', 'Workshop'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getStatusStyle(status = '') {
    const s = status.toLowerCase();
    switch (s) {
        case 'upcoming':  return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'ongoing':   return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'completed': return 'bg-gray-100 text-gray-600 border-gray-200';
        case 'cancelled': return 'bg-red-100 text-red-600 border-red-200';
        default:          return 'bg-gray-100 text-gray-600 border-gray-200';
    }
}
function getModeStyle(mode) {
    switch (mode) {
        case 'In-Person': return 'bg-purple-50 text-purple-700 border-purple-200';
        case 'Online':    return 'bg-sky-50 text-sky-700 border-sky-200';
        case 'Hybrid':    return 'bg-amber-50 text-amber-700 border-amber-200';
        default:          return 'bg-gray-50 text-gray-600 border-gray-200';
    }
}

function formatDate(dateStr) {
    if (!dateStr || dateStr === '—') return '—';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) { return dateStr; }
}

function CapacityBar({ registered, capacity }) {
    if (!capacity) return <span className="text-xs text-gray-500">—</span>;
    const pct = Math.min(Math.round((registered / capacity) * 100), 100);
    const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
    return (
        <div className="w-full">
            <div className="flex justify-between text-[10px] text-gray-600 mb-1 font-medium">
                <span>{registered} registered</span><span>{pct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

// ─── Input / Label helpers ────────────────────────────────────────────────────
function Label({ children, required }) {
    return (
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            {children}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
    );
}
function Input({ ...props }) {
    return (
        <input {...props} className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all placeholder-gray-400 ${props.className || ''}`} />
    );
}
function Select({ children, ...props }) {
    return (
        <select {...props} className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all text-gray-700 ${props.className || ''}`}>
            {children}
        </select>
    );
}
function Textarea({ ...props }) {
    return (
        <textarea {...props} rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all placeholder-gray-400 resize-none" />
    );
}

// Time input with a visible Clock affordance on the right. The icon
// button calls input.showPicker() — the modern way to programmatically
// open the native time picker. Falls back gracefully (focus only) on
// browsers where showPicker isn't available.
function TimeInput({ label, value, onChange }) {
    const inputRef = React.useRef(null);
    const openPicker = () => {
        const el = inputRef.current;
        if (! el) return;
        if (typeof el.showPicker === 'function') {
            try { el.showPicker(); return; } catch (e) { /* fall through to focus */ }
        }
        el.focus();
    };
    return (
        <div>
            <Label>{label}</Label>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="time"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all placeholder-gray-400"
                />
                <button
                    type="button"
                    onClick={openPicker}
                    aria-label={`Open ${label.toLowerCase()} picker`}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                    <Clock size={15} />
                </button>
            </div>
        </div>
    );
}

// ─── Empty session template ───────────────────────────────────────────────────
const emptySession = () => ({
    venue_name: '', address: '', city: '', date: '',
    time_start: '', time_end: '', capacity: '', status: 'upcoming',
    _key: Math.random(),
});

// ─── Form-Fields builder (Step 3 of EventFormModal) ──────────────────────────
//
// Renders the per-event registration-form schema as an editable list.
//
//   - Default fields with locked=true (first_name / last_name / email /
//     phone) show as read-only "Always required" — admin can't hide or
//     edit them because lead follow-up depends on them.
//   - Default toggleable fields show with two switches: Enabled (visible
//     on the public form) and Required (must be filled to submit).
//   - Custom (admin-added) fields show with the same two switches plus
//     Edit / Delete actions. Custom fields are added via the form below
//     the list and stored alongside default fields in the same array.
//
// The whole value is the form_fields JSON for the event. Order in the
// public form is determined by the per-field `order` property; here we
// just preserve list order, which produces stable per-section ordering
// when fields are grouped on the public page.
//
// Default section names that came from the canonical schema. Renaming
// these would orphan locked fields (which reference them) so the UI
// blocks rename for these specific names. Custom sections are freely
// renamable + deletable.
const DEFAULT_SECTIONS = ['Personal information', 'Education', 'Background', 'NZ pathway', 'Anything else?'];

const TYPE_LABEL = {
    text: 'Text', email: 'Email', tel: 'Phone', textarea: 'Long text',
    select: 'Dropdown', pills: 'Choice pills',
};

const blankDraft = (section = 'Additional') => ({
    key: '', label: '', type: 'text', required: false, options: '',
    section, placeholder: '',
});

function FormFieldsStep({ value, onChange, customFieldTypes, lockedFieldKeys, defaultFieldKeys }) {
    const fields = Array.isArray(value) ? value : [];

    const lockedSet  = React.useMemo(() => new Set(lockedFieldKeys || []), [lockedFieldKeys]);
    const defaultSet = React.useMemo(() => new Set(defaultFieldKeys  || []), [defaultFieldKeys]);

    // The section list: union of sections referenced by fields + any
    // sections the admin added but hasn't dropped a field into yet
    // (those live in local state until a field lands in them).
    const fieldSections = React.useMemo(() => {
        const out = [];
        const seen = new Set();
        for (const f of fields) {
            const s = f.section || 'Additional';
            if (! seen.has(s)) { seen.add(s); out.push(s); }
        }
        return out;
    }, [fields]);

    const [pendingSections, setPendingSections] = useState([]);

    const allSections = React.useMemo(() => {
        const merged = [...fieldSections];
        for (const s of pendingSections) {
            if (! merged.includes(s)) merged.push(s);
        }
        return merged;
    }, [fieldSections, pendingSections]);

    // Only one inline "add field" form open at a time, keyed by the
    // section it'll add into.
    const [addingTo, setAddingTo] = useState(null);
    const [draft, setDraft] = useState(blankDraft());

    const openAdd = (section) => { setAddingTo(section); setDraft(blankDraft(section)); };
    const closeAdd = () => { setAddingTo(null); setDraft(blankDraft()); };

    const updateField = (idx, patch) => {
        onChange(fields.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
    };

    const removeField = (idx) => {
        if (! confirm('Remove this custom field? Responses already collected stay on file.')) return;
        onChange(fields.filter((_, i) => i !== idx));
    };

    const handleAddField = () => {
        const key = draft.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
        if (! key)                                       return alert('Field key is required.');
        if (! /^[a-z][a-z0-9_]*$/.test(key))             return alert('Field key must start with a letter; use only lowercase letters, numbers, and underscores.');
        if (fields.some((f) => f.key === key))           return alert(`A field with key "${key}" already exists.`);
        if (! draft.label.trim())                        return alert('Field label is required.');

        const needsOptions = draft.type === 'select' || draft.type === 'pills';
        const options = needsOptions
            ? draft.options.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean)
            : null;
        if (needsOptions && options.length === 0) return alert('Add at least one option for select/pills fields.');

        const section = (draft.section || 'Additional').trim() || 'Additional';
        const sectionFieldCount = fields.filter((f) => (f.section || 'Additional') === section).length;

        const newField = {
            key,
            label: draft.label.trim(),
            type: draft.type,
            required: !! draft.required,
            locked: false,
            default: false,
            enabled: true,
            placeholder: draft.placeholder.trim() || undefined,
            section,
            order: sectionFieldCount + 1,
            ...(options ? { options } : {}),
        };
        onChange([...fields, newField]);
        // Section is now non-empty; drop it from pending if it was there.
        setPendingSections((prev) => prev.filter((s) => s !== section));
        closeAdd();
    };

    const addSection = () => {
        const name = prompt('Name the new section:');
        if (! name) return;
        const trimmed = name.trim();
        if (! trimmed) return;
        if (allSections.includes(trimmed)) return alert('A section with that name already exists.');
        setPendingSections((prev) => [...prev, trimmed]);
    };

    const renameSection = (oldName) => {
        const name = prompt('Rename section to:', oldName);
        if (! name) return;
        const trimmed = name.trim();
        if (! trimmed || trimmed === oldName) return;
        if (allSections.includes(trimmed)) return alert('A section with that name already exists.');
        // Move every field that lives in the old section across.
        onChange(fields.map((f) => ((f.section || 'Additional') === oldName ? { ...f, section: trimmed } : f)));
        setPendingSections((prev) => prev.map((s) => (s === oldName ? trimmed : s)));
    };

    const removeEmptySection = (name) => {
        // Only pending (zero-field) sections can be removed here.
        setPendingSections((prev) => prev.filter((s) => s !== name));
    };

    // Bulk-toggle every non-locked field in a section. The section's
    // "enabled" state is derived from "at least one toggleable field is
    // still enabled" — flipping the section toggle just batches what
    // the admin could do field-by-field. Locked fields are never
    // affected because the registration form depends on them.
    const toggleSection = (section, enabled) => {
        onChange(fields.map((f) => {
            if ((f.section || 'Additional') !== section) return f;
            if (lockedSet.has(f.key) || f.locked === true) return f;
            return { ...f, enabled };
        }));
    };

    return (
        <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm font-semibold text-gray-800">Customise the registration form</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Fields are grouped into sections. First 4 fields (name + email + phone)
                    are always required so we can follow up. Add a field to any section, or
                    create a brand-new section for event-specific questions.
                </p>
            </div>

            {allSections.map((section) => {
                const sectionFields = fields
                    .map((f, idx) => ({ f, idx }))
                    .filter(({ f }) => (f.section || 'Additional') === section);
                const isEmpty   = sectionFields.length === 0;
                const isDefault = DEFAULT_SECTIONS.includes(section);

                // Section toggle is derived from its fields' enabled
                // state. "Enabled" = at least one toggleable field is on.
                // Sections that contain only locked fields don't get a
                // toggle at all (nothing to flip).
                const toggleable = sectionFields.filter(({ f }) => ! (lockedSet.has(f.key) || f.locked === true));
                const hasToggleable = toggleable.length > 0;
                const sectionEnabled = toggleable.some(({ f }) => f.enabled !== false);

                return (
                    <div
                        key={section}
                        className={`border rounded-xl bg-white overflow-hidden transition-opacity ${
                            hasToggleable && ! sectionEnabled && ! isEmpty ? 'border-gray-200 opacity-60' : 'border-gray-200'
                        }`}
                    >
                        {/* Section header */}
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                                <p className="text-sm font-bold text-gray-900 tracking-tight">{section}</p>
                                {isDefault && (
                                    <span className="text-[10px] font-bold tracking-[0.14em] uppercase bg-gray-100 text-gray-600 border border-gray-200 px-1.5 py-0.5">
                                        Default
                                    </span>
                                )}
                                {isEmpty && (
                                    <span className="text-[10px] font-bold tracking-[0.14em] uppercase bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5">
                                        Empty — add a field to save
                                    </span>
                                )}
                                {hasToggleable && ! sectionEnabled && ! isEmpty && (
                                    <span className="text-[10px] font-bold tracking-[0.14em] uppercase bg-gray-200 text-gray-700 border border-gray-300 px-1.5 py-0.5">
                                        Hidden
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {hasToggleable && (
                                    <ToggleSmall
                                        label="Visible"
                                        checked={sectionEnabled}
                                        onChange={(v) => toggleSection(section, v)}
                                    />
                                )}
                                {! isDefault && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => renameSection(section)}
                                            className="px-2 py-1 text-[11px] font-semibold text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                                        >
                                            Rename
                                        </button>
                                        {isEmpty && (
                                            <button
                                                type="button"
                                                onClick={() => removeEmptySection(section)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove empty section"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Field rows */}
                        <div className="p-3 space-y-2">
                            {sectionFields.map(({ f, idx }) => (
                                <FieldRow
                                    key={f.key + ':' + idx}
                                    field={f}
                                    isLocked={lockedSet.has(f.key) || f.locked === true}
                                    isDefault={defaultSet.has(f.key) || f.default === true}
                                    onUpdate={(patch) => updateField(idx, patch)}
                                    onRemove={() => removeField(idx)}
                                />
                            ))}

                            {/* Inline add-field form (only when targeting THIS section) */}
                            {addingTo === section ? (
                                <AddFieldForm
                                    draft={draft}
                                    setDraft={setDraft}
                                    customFieldTypes={customFieldTypes}
                                    onSubmit={handleAddField}
                                    onCancel={closeAdd}
                                />
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => openAdd(section)}
                                    className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-[12px] font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50/60 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <Plus size={13} /> Add field to {section}
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Add a new section */}
            <button
                type="button"
                onClick={addSection}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:border-gray-900 hover:text-gray-900 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
                <Plus size={16} /> Add section
            </button>
        </div>
    );
}

function FieldRow({ field, isLocked, isDefault, onUpdate, onRemove }) {
    const enabled = isLocked ? true : (field.enabled !== false);
    return (
        <div
            className={`border rounded-lg p-3 transition-colors ${
                isLocked ? 'bg-gray-50/70 border-gray-200' :
                enabled  ? 'bg-white border-gray-200' :
                           'bg-gray-50/40 border-gray-100 opacity-70'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{field.label}</p>
                        <span className="text-[10px] font-bold tracking-[0.14em] uppercase bg-gray-100 text-gray-600 border border-gray-200 px-1.5 py-0.5">
                            {TYPE_LABEL[field.type] || field.type}
                        </span>
                        {isLocked && (
                            <span className="text-[10px] font-bold tracking-[0.14em] uppercase bg-gray-900 text-white px-1.5 py-0.5">
                                Always on
                            </span>
                        )}
                        {! isDefault && (
                            <span className="text-[10px] font-bold tracking-[0.14em] uppercase bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5">
                                Custom
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 font-mono">{field.key}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {! isLocked && (
                        <ToggleSmall label="Enabled"  checked={enabled}        onChange={(v) => onUpdate({ enabled: v })} />
                    )}
                    {! isLocked && (
                        <ToggleSmall label="Required" checked={!! field.required} onChange={(v) => onUpdate({ required: v })} />
                    )}
                    {! isDefault && ! isLocked && (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete custom field"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function AddFieldForm({ draft, setDraft, customFieldTypes, onSubmit, onCancel }) {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3.5 space-y-3 bg-white">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                Add field to {draft.section}
            </p>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <Label required>Key</Label>
                    <Input
                        placeholder="snake_case_id"
                        value={draft.key}
                        onChange={(e) => setDraft({ ...draft, key: e.target.value })}
                    />
                </div>
                <div>
                    <Label required>Label</Label>
                    <Input
                        placeholder="Shown to the registrant"
                        value={draft.label}
                        onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                    />
                </div>
            </div>
            <div>
                <Label>Type</Label>
                <Select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
                    {customFieldTypes.map((t) => (
                        <option key={t} value={t}>{TYPE_LABEL[t] || t}</option>
                    ))}
                </Select>
            </div>
            {(draft.type === 'select' || draft.type === 'pills') && (
                <div>
                    <Label required>Options (one per line or comma-separated)</Label>
                    <Textarea
                        placeholder={'Option A\nOption B\nOption C'}
                        value={draft.options}
                        onChange={(e) => setDraft({ ...draft, options: e.target.value })}
                    />
                </div>
            )}
            {['text', 'email', 'tel', 'textarea'].includes(draft.type) && (
                <div>
                    <Label>Placeholder (optional)</Label>
                    <Input
                        placeholder="e.g. yourname@example.com"
                        value={draft.placeholder}
                        onChange={(e) => setDraft({ ...draft, placeholder: e.target.value })}
                    />
                </div>
            )}
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={!! draft.required}
                    onChange={(e) => setDraft({ ...draft, required: e.target.checked })}
                    className="w-4 h-4 accent-gray-900"
                />
                Required field
            </label>
            <div className="flex items-center justify-end gap-2 pt-1">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={onSubmit}
                    className="px-4 py-1.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
                >
                    Add field
                </button>
            </div>
        </div>
    );
}

function ToggleSmall({ label, checked, onChange }) {
    return (
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">{label}</span>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-gray-900' : 'bg-gray-300'}`}
                aria-pressed={checked}
            >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
        </label>
    );
}

// ─── Create / Edit Event Slide-Over ───────────────────────────────────────────
function EventFormModal({ open, onClose, editingEvent, defaultFormFields = [], customFieldTypes = ['text','email','tel','textarea','select','pills'], lockedFieldKeys = ['first_name','last_name','email','phone'] }) {
    const isEditing = !!editingEvent;
    const [step, setStep] = useState(1);
    const [hasSessions, setHasSessions] = useState(false);
    // Whether the "Event Type" picker is in free-text ("Other") mode.
    const [useOtherType, setUseOtherType] = useState(false);
    // URL of the banner already stored on the server (edit mode), shown until
    // the user picks a replacement file.
    const [existingBanner, setExistingBanner] = useState(null);

    const { data, setData, post, processing, errors, setError, clearErrors, reset, transform } = useForm({
        name: '', type: '', description: '', date_from: '', date_to: '',
        // Event-level start/end times — used when the event has no
        // sessions. Sessions still own their own time columns.
        time_start: '', time_end: '',
        status: 'upcoming', mode: 'in-person', location: '', organizer_id: '', notes: '',
        banner_image: null,
        sessions: [emptySession()],
        // Per-event registration-form schema. Seeded from the canonical
        // default set so admins start with the full form visible and
        // toggle/remove fields rather than build from scratch.
        form_fields: defaultFormFields,
    });

    // Hydrate the form whenever the slide-over opens for a specific event.
    useEffect(() => {
        if (!open) return;

        if (editingEvent) {
            const toDateInput = (d) => (d ? String(d).slice(0, 10) : '');
            const sessions = (editingEvent.sessions || []).map((s) => ({
                id: s.id,
                venue_name: s.venue_name || '', address: s.address || '', city: s.city || '',
                date: toDateInput(s.date),
                time_start: s.time_start ? String(s.time_start).slice(0, 5) : '',
                time_end: s.time_end ? String(s.time_end).slice(0, 5) : '',
                capacity: s.capacity ?? '', status: s.status || 'upcoming',
                _key: s.id,
            }));
            setData({
                name: editingEvent.name || '', type: editingEvent.type || '',
                description: editingEvent.description || '',
                date_from: toDateInput(editingEvent.date_from),
                date_to: toDateInput(editingEvent.date_to),
                time_start: editingEvent.time_start ? String(editingEvent.time_start).slice(0, 5) : '',
                time_end:   editingEvent.time_end   ? String(editingEvent.time_end).slice(0, 5)   : '',
                status: editingEvent.status || 'upcoming',
                mode: editingEvent.mode || 'in-person',
                location: editingEvent.location || '',
                organizer_id: editingEvent.organizer_id || '',
                notes: editingEvent.notes || '',
                banner_image: null,
                sessions: sessions.length ? sessions : [emptySession()],
                form_fields: Array.isArray(editingEvent.form_fields) && editingEvent.form_fields.length > 0
                    ? editingEvent.form_fields
                    : defaultFormFields,
            });
            setHasSessions(sessions.length > 0);
            setExistingBanner(editingEvent.banner_image_url || null);
            // A saved type that isn't one of the presets is a custom "Other" value.
            setUseOtherType(!!editingEvent.type && !EVENT_TYPES.includes(editingEvent.type));
        } else {
            reset();
            setHasSessions(false);
            setExistingBanner(null);
            setUseOtherType(false);
        }
        setStep(1);
        clearErrors();
    }, [open, editingEvent]);

    // Transform data before submission. Booleans in form_fields are
    // converted to 1/0 ints because Inertia serializes the request as
    // FormData (forceFormData is on for the banner upload) — and FormData
    // turns booleans into the strings "true"/"false" which Laravel's
    // `boolean` validation rule rejects. Ints round-trip cleanly.
    transform((data) => ({
        ...data,
        sessions: hasSessions ? data.sessions.map(({ _key, ...rest }) => rest) : [],
        form_fields: Array.isArray(data.form_fields)
            ? data.form_fields.map((f) => ({
                ...f,
                required: f.required ? 1 : 0,
                locked:   f.locked   ? 1 : 0,
                default:  f.default  ? 1 : 0,
                enabled:  f.enabled === false ? 0 : 1,
            }))
            : data.form_fields,
    }));

    const setField = (key, val) => setData(key, val);

    const setSession = (idx, key, val) => {
        const newSessions = [...data.sessions];
        newSessions[idx] = { ...newSessions[idx], [key]: val };
        setData('sessions', newSessions);
    };
    const addSession = () => setData('sessions', [...data.sessions, emptySession()]);
    const removeSession = (idx) => setData('sessions', data.sessions.filter((_, i) => i !== idx));

    const resetAndClose = () => {
        setStep(1);
        reset();
        clearErrors();
        setHasSessions(false);
        setExistingBanner(null);
        onClose();
    };

    const validateStep1 = () => {
        if (!data.name.trim()) return 'Event name is required.';
        if (!data.type.trim()) return 'Event type is required.';
        if (!data.status) return 'Status is required.';
        if (data.mode === 'in-person' && !data.location.trim()) return 'Address / venue is required for in-person events.';
        return null;
    };

    const handleNext = () => {
        const err = validateStep1();
        if (err) { setError('name', err); return; }
        clearErrors();
        setStep(2);
    };

    const handleSubmit = () => {
        const url = isEditing ? `/admin/events/${editingEvent.id}` : '/admin/events';
        post(url, {
            forceFormData: true,
            onSuccess: () => {
                resetAndClose();
            },
        });
    };

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
                onClick={resetAndClose}
            />

            {/* Panel */}
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl flex flex-col bg-white shadow-2xl animate-slide-in-right">

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{isEditing ? 'Edit Event' : 'Create Event'}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Step {step} of 3 — {step === 1 ? 'Event Details' : step === 2 ? 'Sessions (Optional)' : 'Registration Form Fields'}
                        </p>
                    </div>
                    <button onClick={resetAndClose} className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="px-6 pt-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map(s => (
                            <React.Fragment key={s}>
                                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${step >= s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>{s}</div>
                                {s < 3 && <div className={`flex-1 h-0.5 rounded-full transition-all ${step > s ? 'bg-gray-900' : 'bg-gray-100'}`} />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Error Banner */}
                {Object.keys(errors).length > 0 && (
                    <div className="mx-6 mt-4 flex-shrink-0 flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle size={15} className="flex-shrink-0" />
                        {Object.values(errors)[0]}
                    </div>
                )}

                {/* Body — scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {step === 1 ? (
                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <Label required>Event Name</Label>
                                <Input placeholder="e.g. Canada Education Fair 2026" value={data.name} onChange={e => setField('name', e.target.value)} />
                            </div>

                            {/* Type + Status */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label required>Event Type</Label>
                                    <Select
                                        value={useOtherType ? '__other__' : data.type}
                                        onChange={e => {
                                            if (e.target.value === '__other__') {
                                                setUseOtherType(true);
                                                setField('type', '');
                                            } else {
                                                setUseOtherType(false);
                                                setField('type', e.target.value);
                                            }
                                        }}
                                    >
                                        <option value="">Select type…</option>
                                        {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        <option value="__other__">Other…</option>
                                    </Select>
                                    {useOtherType && (
                                        <Input
                                            className="mt-2"
                                            placeholder="Type the event type…"
                                            value={data.type}
                                            onChange={e => setField('type', e.target.value)}
                                        />
                                    )}
                                </div>
                                <div>
                                    <Label required>Status</Label>
                                    <Select value={data.status} onChange={e => setField('status', e.target.value)}>
                                        <option value="draft">Draft</option>
                                        <option value="upcoming">Upcoming</option>
                                        <option value="ongoing">Ongoing</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </Select>
                                </div>
                            </div>

                            {/* Date Range */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Date From</Label>
                                    <Input type="date" value={data.date_from} onChange={e => setField('date_from', e.target.value)} />
                                </div>
                                <div>
                                    <Label>Date To</Label>
                                    <Input type="date" value={data.date_to} onChange={e => setField('date_to', e.target.value)} />
                                </div>
                            </div>

                            {/* Time Range — only used when the event has
                                no sessions (sessions carry their own
                                times). Both fields optional. The Clock
                                button calls input.showPicker() so the
                                native time picker opens when clicked. */}
                            <div className="grid grid-cols-2 gap-4">
                                <TimeInput
                                    label="Start Time"
                                    value={data.time_start}
                                    onChange={(v) => setField('time_start', v)}
                                />
                                <TimeInput
                                    label="End Time"
                                    value={data.time_end}
                                    onChange={(v) => setField('time_end', v)}
                                />
                            </div>
                            <p className="text-[11px] text-gray-500 -mt-2">
                                Optional — only used when the event has no sessions. Sessions carry their own times.
                            </p>

                            {/* Description */}
                            <div>
                                <Label>Description</Label>
                                <Textarea placeholder="Brief description of the event…" value={data.description} onChange={e => setField('description', e.target.value)} />
                            </div>

                            {/* Organizer */}
                            {/* Organizer & Mode */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Organizer / PIC</Label>
                                    <Input placeholder="e.g. Maria Santos" value={data.organizer_id} onChange={e => setField('organizer_id', e.target.value)} />
                                </div>
                                <div>
                                    <Label required>Event Mode</Label>
                                    <Select value={data.mode} onChange={e => setField('mode', e.target.value)}>
                                        <option value="in-person">In-Person</option>
                                        <option value="online">Online (Zoom/Webinar)</option>
                                        <option value="hybrid">Hybrid</option>
                                    </Select>
                                </div>
                            </div>

                            {/* Address / venue — only for in-person & hybrid events */}
                            {data.mode !== 'online' && (
                                <div>
                                    <Label required={data.mode === 'in-person'}>Address / Venue</Label>
                                    <Input
                                        placeholder="e.g. SMX Convention Center, Manila"
                                        value={data.location}
                                        onChange={e => setField('location', e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Banner Image */}
                            <div>
                                <Label>Banner Image</Label>
                                <div
                                    className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
                                    onClick={() => document.getElementById('banner-image-input').click()}
                                >
                                    {(data.banner_image || existingBanner) ? (
                                        <div className="relative">
                                            <img
                                                src={data.banner_image ? URL.createObjectURL(data.banner_image) : existingBanner}
                                                alt="Banner preview"
                                                className="w-full h-32 object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={e => { e.stopPropagation(); setData('banner_image', null); setExistingBanner(null); }}
                                                className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 transition"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="py-4">
                                            <div className="text-3xl mb-2">🖼️</div>
                                            <p className="text-xs font-semibold text-gray-600">Click to upload banner image</p>
                                            <p className="text-[10px] text-gray-500 mt-1">PNG, JPG, WEBP up to 4MB</p>
                                        </div>
                                    )}
                                    <input
                                        id="banner-image-input"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => setData('banner_image', e.target.files[0] || null)}
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <Label>Internal Notes</Label>
                                <Textarea placeholder="Any internal notes or reminders…" value={data.notes} onChange={e => setField('notes', e.target.value)} />
                            </div>
                        </div>
                    ) : step === 2 ? (
                        // ─── Step 2: Sessions ──────────────────────────────────────────
                        <div className="space-y-4">
                            {/* Toggle */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">Add Sessions?</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Sessions are optional — use them to split the event by location or date.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setHasSessions(v => !v)}
                                    className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${hasSessions ? 'bg-gray-900' : 'bg-gray-200'}`}
                                >
                                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${hasSessions ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {hasSessions && (
                                <>
                                    {data.sessions.map((session, idx) => (
                                        <div key={session._key} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white relative">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Session {idx + 1}</span>
                                                {data.sessions.length > 1 && (
                                                    <button onClick={() => removeSession(idx)} className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>

                                            <div>
                                                <Label>Venue Name</Label>
                                                <Input placeholder="e.g. SMX Convention Center" value={session.venue_name} onChange={e => setSession(idx, 'venue_name', e.target.value)} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label>City</Label>
                                                    <Input placeholder="e.g. Manila" value={session.city} onChange={e => setSession(idx, 'city', e.target.value)} />
                                                </div>
                                                <div>
                                                    <Label>Date</Label>
                                                    <Input type="date" value={session.date} onChange={e => setSession(idx, 'date', e.target.value)} />
                                                </div>
                                            </div>
                                            <div>
                                                <Label>Address</Label>
                                                <Input placeholder="Full address" value={session.address} onChange={e => setSession(idx, 'address', e.target.value)} />
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <Label>Start Time</Label>
                                                    <Input type="time" value={session.time_start} onChange={e => setSession(idx, 'time_start', e.target.value)} />
                                                </div>
                                                <div>
                                                    <Label>End Time</Label>
                                                    <Input type="time" value={session.time_end} onChange={e => setSession(idx, 'time_end', e.target.value)} />
                                                </div>
                                                <div>
                                                    <Label>Capacity</Label>
                                                    <Input type="number" min="1" placeholder="0" value={session.capacity} onChange={e => setSession(idx, 'capacity', e.target.value)} />
                                                </div>
                                            </div>
                                            <div>
                                                <Label>Session Status</Label>
                                                <Select value={session.status} onChange={e => setSession(idx, 'status', e.target.value)}>
                                                    <option value="upcoming">Upcoming</option>
                                                    <option value="ongoing">Ongoing</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </Select>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={addSession}
                                        className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={16} /> Add Another Session
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        // ─── Step 3: Form Fields ────────────────────────────────────────
                        <FormFieldsStep
                            value={data.form_fields}
                            onChange={(next) => setData('form_fields', next)}
                            customFieldTypes={customFieldTypes}
                            lockedFieldKeys={lockedFieldKeys}
                            defaultFieldKeys={defaultFormFields.map(f => f.key)}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0 bg-white">
                    {step === 1 ? (
                        <>
                            <button onClick={resetAndClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
                            >
                                Next: Sessions <ChevronRight size={16} />
                            </button>
                        </>
                    ) : step === 2 ? (
                        <>
                            <button onClick={() => { setStep(1); clearErrors(); }} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                                <ChevronLeft size={16} /> Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
                            >
                                Next: Form Fields <ChevronRight size={16} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => { setStep(2); clearErrors(); }} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                                <ChevronLeft size={16} /> Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={processing}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {processing ? (
                                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isEditing ? 'Saving…' : 'Creating…'}</>
                                ) : (isEditing ? 'Save Changes' : 'Create Event')}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Events({ events: backendEvents, defaultFormFields = [], customFieldTypes = [], lockedFieldKeys = [] }) {
    const events = backendEvents && backendEvents.length > 0 ? backendEvents : MOCK_EVENTS;
    const [selectedEvents, setSelectedEvents] = useState([]);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [activeStatusFilter, setActiveStatusFilter] = useState('All');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    const openCreate = () => { setEditingEvent(null); setModalOpen(true); };
    const openEdit = (event) => { setEditingEvent(event); setModalOpen(true); setActiveDropdown(null); };
    const handleDelete = (event) => {
        if (!confirm(`Delete "${event.name || event.title}"? This cannot be undone.`)) return;
        setActiveDropdown(null);
        router.delete(`/admin/events/${event.id}`, { preserveScroll: true });
    };

    const summaryCards = [
        { label: 'Total Events', value: events.length, trend: '+3', trendLabel: 'this month', isPositive: true, icon: <Calendar className="w-5 h-5" />, dark: true },
        { label: 'Upcoming', value: events.filter(e => e.status === 'Upcoming').length, trend: '+2', trendLabel: 'this month', isPositive: true, icon: <Clock className="w-5 h-5" />, dark: false },
        { label: 'Total Registrations', value: events.reduce((s, e) => s + (e.registered || 0), 0).toLocaleString(), trend: '+12%', trendLabel: 'from last month', isPositive: true, icon: <Users className="w-5 h-5" />, dark: false },
        { label: 'Cancelled', value: events.filter(e => e.status === 'Cancelled').length, trend: '-1', trendLabel: 'from last month', isPositive: false, icon: <XCircle className="w-5 h-5" />, dark: false },
    ];

    const statusTabs = ['All', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled'];
    const filtered = activeStatusFilter === 'All' ? events : events.filter(e => e.status === activeStatusFilter);

    const toggleSelectAll = (e) => setSelectedEvents(e.target.checked ? filtered.map(ev => ev.id) : []);
    const toggleSelect = (id) => setSelectedEvents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
            <Head title="Events Management" />

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hidden lg:flex mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Events</h1>
                    <p className="text-sm text-gray-600 mt-1">Manage, schedule, and track all ePathways events.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold shadow-sm">
                        <BarChart2 size={16} className="text-indigo-500" />
                        Export Report
                    </button>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 text-sm font-semibold transition-colors shadow-sm"
                    >
                        <Plus size={16} />
                        Create Event
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryCards.map((card, idx) => (
                    <div
                        key={idx}
                        onClick={() => setActiveStatusFilter(['All', 'Upcoming', 'All', 'Cancelled'][idx])}
                        className={`p-5 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] ${card.dark ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-900 shadow-sm border border-gray-100'}`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className={`text-sm font-medium ${card.dark ? 'text-gray-300' : 'text-gray-600'}`}>{card.label}</span>
                            <span className={`p-1.5 rounded-lg ${card.dark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'}`}>{card.icon}</span>
                        </div>
                        <p className="text-3xl font-bold mb-3 tracking-tight">{card.value}</p>
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <span className={`flex items-center ${card.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                {card.isPositive ? <ArrowUpRight size={13} className="mr-0.5" /> : <ArrowDownRight size={13} className="mr-0.5" />}
                                {card.trend}
                            </span>
                            <span className="text-gray-500 font-medium">{card.trendLabel}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="w-full lg:w-80 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input type="text" className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" placeholder="Search events by title, location..." />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    {statusTabs.map(tab => (
                        <button key={tab} onClick={() => setActiveStatusFilter(tab)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 ${activeStatusFilter === tab ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                        <option value="">Type: All</option>
                        {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {selectedEvents.length > 0 && (
                        <>
                            <div className="h-8 w-px bg-gray-200 mx-1" />
                            <span className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg">{selectedEvents.length} Selected</span>
                            <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                        </>
                    )}
                </div>
            </div>

            {/* Events Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-10">
                                    <input type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" onChange={toggleSelectAll} checked={selectedEvents.length === filtered.length && filtered.length > 0} />
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Event</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">No. of Registrants</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-gray-500">
                                        <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                                        <p className="font-semibold">No events found</p>
                                        <p className="text-sm mt-1">Try adjusting your filters or
                                            <button onClick={openCreate} className="text-blue-600 hover:underline ml-1">create a new event</button>.
                                        </p>
                                    </td>
                                </tr>
                            ) : filtered.map((event) => (
                                <tr key={event.id} className={`hover:bg-blue-50/30 transition-colors ${selectedEvents.includes(event.id) ? 'bg-blue-50/50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <input type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" checked={selectedEvents.includes(event.id)} onChange={() => toggleSelect(event.id)} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900 text-sm truncate max-w-[200px]">{event.name || event.title}</span>
                                                <button 
                                                    onClick={() => {
                                                        const url = event.registration_url || `http://localhost:8000/register/${event.event_code || 'mock'}`;
                                                        navigator.clipboard.writeText(url);
                                                        alert('Link copied!');
                                                    }}
                                                    className="p-1 text-indigo-500 hover:bg-indigo-50 rounded-md transition-colors"
                                                    title="Copy Registration Link"
                                                >
                                                    <Copy size={12} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{event.event_code || event.id}</span>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border capitalize ${getModeStyle(event.mode || 'In-Person')}`}>{event.mode || 'In-Person'}</span>
                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase tracking-wider">{event.branch || 'Global'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Tag size={10} className="text-gray-500" /><span className="text-[10px] text-gray-600 font-medium">{event.type}</span>
                                                {(event.sessions_count > 0 || event.sessions > 0) && (
                                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                                                        {event.sessions_count || event.sessions} sessions
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5"><Calendar size={13} className="text-gray-500" /><span className="text-sm font-semibold text-gray-900">{formatDate(event.date_from || event.date)}</span></div>
                                            <div className="flex items-center gap-1.5"><Clock size={13} className="text-gray-500" /><span className="text-xs text-gray-600">{event.time || (event.sessions?.[0]?.time_start) || 'TBA'}</span></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5">
                                                {(String(event.mode).toLowerCase() === 'online') ? (
                                                    <><Globe size={13} className="text-blue-500" /><span className="text-sm text-blue-700 font-semibold italic">Online / Zoom</span></>
                                                ) : (
                                                    <><MapPin size={13} className="text-gray-500" /><span className="text-sm text-gray-700 font-medium max-w-[160px] truncate">{event.location || (event.sessions_count > 0 ? 'Multiple' : 'N/A')}</span></>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-bold">
                                                    {(event.organizer_id || event.organizer || '?').charAt(0)}
                                                </div>
                                                <span className="text-xs text-gray-600 font-medium">{event.organizer_id || event.organizer}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Users size={16} className="text-gray-500" />
                                            <span className="text-sm font-bold text-gray-900">{event.leads_count || 0}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${getStatusStyle(event.status)}`}>{event.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right pr-6 relative">
                                        <button onClick={() => setActiveDropdown(activeDropdown === event.id ? null : event.id)}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            Actions <ChevronDown size={14} className="text-gray-500" />
                                        </button>
                                        {activeDropdown === event.id && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                                                <div className="absolute right-6 top-14 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2 divide-y divide-gray-50 animate-fade-in-up origin-top-right">
                                                    <div className="px-1 py-1">
                                                        <button 
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(event.registration_url);
                                                                alert('Registration link copied to clipboard!');
                                                                setActiveDropdown(null);
                                                            }}
                                                            className="flex w-full items-center gap-3 px-3 py-2 text-sm text-indigo-600 font-semibold hover:bg-indigo-50 rounded-lg transition-colors"
                                                        >
                                                            <Copy size={16} /> Copy Registration Link
                                                        </button>
                                                        <Link href={`/admin/events/${event.id}`} className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"><Eye size={16} className="text-gray-500" /> View Details</Link>
                                                        <button onClick={() => openEdit(event)} className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"><Edit2 size={16} className="text-gray-500" /> Edit Event</button>
                                                    </div>
                                                    <div className="px-1 py-1">
                                                        <button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"><Copy size={16} className="text-blue-500" /> Duplicate</button>
                                                        <button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"><ExternalLink size={16} className="text-indigo-500" /> Share Link</button>
                                                        <button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"><Users size={16} className="text-emerald-500" /> View Registrants</button>
                                                    </div>
                                                    <div className="px-1 py-1">
                                                        <button onClick={() => handleDelete(event)} className="flex w-full items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /> Delete Event</button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
                        <div className="text-sm text-gray-600">
                            Showing <span className="font-semibold text-gray-900">1</span> to <span className="font-semibold text-gray-900">{filtered.length}</span> of <span className="font-semibold text-gray-900">{filtered.length}</span> Events
                        </div>
                        <div className="flex gap-1">
                            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled>Previous</button>
                            <button className="px-3 py-1.5 border border-gray-200 bg-gray-900 text-white rounded-lg text-sm font-medium shadow-sm">1</button>
                            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create / Edit Event Slide-Over */}
            <EventFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                editingEvent={editingEvent}
                defaultFormFields={defaultFormFields}
                customFieldTypes={customFieldTypes}
                lockedFieldKeys={lockedFieldKeys}
            />

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0.8; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
                .animate-slide-in-right { animation: slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fadeInUp 0.2s ease-out forwards; }
            `}} />
        </div>
    );
}
