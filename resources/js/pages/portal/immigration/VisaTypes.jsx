import React, { useState, useEffect, useRef } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import {
    GraduationCap, Briefcase, Plane, Heart, Home, HelpCircle, Globe,
    Pencil, X, History as HistoryIcon, ChevronDown, ChevronUp, AlertTriangle, Save,
    Plus, Trash2, Copy,
} from 'lucide-react';
import { toast } from 'sonner';

const ICONS = { GraduationCap, Briefcase, Plane, Heart, Home, HelpCircle, Globe };
const ICON_OPTIONS = Object.keys(ICONS);

// "Visa Type" classification dropdown. Add more options here as needed.
const VISA_TYPE_OPTIONS = ['Fee Paying'];

// Strips the native number-input spinner arrows so they don't overlap the
// "$"/"NZD"/"minutes" adornments positioned inside the field.
const NO_SPIN = '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

const fmt = (n) => n === null || n === undefined
    ? '—'
    : Number(n).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso) => iso
    ? new Date(iso).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

function VisaIcon({ name, size = 18, className = '' }) {
    const Cmp = ICONS[name] || Globe;
    return <Cmp size={size} className={className} />;
}

export default function VisaTypes({ visaTypes = [], permissions = {} }) {
    const rows = Array.isArray(visaTypes) ? visaTypes : [];
    const perms = permissions ?? {};
    const [editing, setEditing] = useState(null);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const { props } = usePage();

    useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
    }, [props.flash?.success]);

    return (
        <>
            <Head title="Visas" />
            <div className="max-w-5xl mx-auto p-6">
                <header className="mb-8 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Visas</h1>
                        <p className="text-sm text-gray-500 max-w-xl">
                            Edit the consultation fee, duration, and description shown to applicants on the visa chooser.
                            Price changes are audited automatically.
                        </p>
                    </div>
                    {perms.canCreate && (
                        <button
                            type="button"
                            onClick={() => setCreating(true)}
                            className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors flex items-center gap-2"
                        >
                            <Plus size={14} strokeWidth={2.5} /> Add new visa
                        </button>
                    )}
                </header>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {rows.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-sm font-semibold text-gray-700">No visas yet</p>
                            <p className="text-xs text-gray-500 mt-1">Seed VisaTypeSeeder to populate the default set.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-50">
                            {rows.map((v) => (
                                <li key={v.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/40">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <VisaIcon name={v.icon} className="text-gray-700" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-gray-900 truncate">{v.name}</p>
                                            <span className="text-[10px] font-mono text-gray-400 uppercase">{v.code}</span>
                                            {!v.active && (
                                                <span className="text-[10px] font-bold uppercase text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Inactive</span>
                                            )}
                                        </div>
                                        {v.short_description && (
                                            <p className="text-xs text-gray-500 truncate mt-0.5">{v.short_description}</p>
                                        )}
                                    </div>
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-bold text-gray-900">${fmt(v.consultation_price_nzd)} NZD</p>
                                        <p className="text-[11px] text-gray-400">{v.consultation_duration_minutes}min</p>
                                    </div>
                                    {perms.canUpdate && (
                                        <button
                                            type="button"
                                            onClick={() => setEditing(v)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-200 rounded-xl hover:border-gray-900 hover:text-gray-900 transition-colors"
                                        >
                                            <Pencil size={13} /> Edit
                                        </button>
                                    )}
                                    {perms.canDelete && (
                                        <button
                                            type="button"
                                            onClick={() => setDeleting(v)}
                                            title="Delete visa type"
                                            className="flex items-center justify-center w-8 h-8 text-rose-500 border border-gray-200 rounded-xl hover:border-rose-300 hover:bg-rose-50 transition-colors"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {editing && (
                <EditModal
                    visaType={editing}
                    onClose={() => setEditing(null)}
                    canViewHistory={perms.canViewHistory}
                />
            )}
            {creating && (
                <CreateModal onClose={() => setCreating(false)} />
            )}
            {deleting && (
                <DeleteModal visaType={deleting} onClose={() => setDeleting(null)} />
            )}
        </>
    );
}

/**
 * Create-new-visa-type modal. Mirrors the EditModal's field set but
 * exposes `code` (required, immutable after create) and doesn't surface
 * pricing-reason / history affordances.
 */
function CreateModal({ onClose }) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        code: '',
        name: '',
        short_description: '',
        category: 'work',
        visa_type: VISA_TYPE_OPTIONS[0],
        consultation_price_nzd: 250,
        professional_fees: '',
        inz_application_fee: '',
        consultation_duration_minutes: 60,
        estimated_minutes: 15,
        inz_form_refs: '',
        icon: 'Globe',
        active: true,
        checklist_items: [],
    });

    const submit = (e) => {
        e.preventDefault();
        clearErrors();
        post(`/portal/immigration/visa-types`, {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
        });
    };

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-start justify-center p-3 sm:p-5 overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Near-fullscreen, but still a modal — a thin gutter keeps the
                backdrop visible on every edge. */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1600px] my-2">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <h2 className="text-lg font-bold text-gray-900">New visa</h2>
                    <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700">
                        <X size={18} />
                    </button>
                </div>

                {/* Stacked: settings above, checklist table below. */}
                <form onSubmit={submit}>
                    <div>
                        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-5 gap-y-4">
                    {errors.error && (
                        <div className="sm:col-span-2 lg:col-span-12 rounded-xl border border-red-100 bg-red-50/60 p-3 text-sm text-red-700">
                            {errors.error}
                        </div>
                    )}

                    {/* Identity — four across: name, code, visa type, category. */}
                    <Field label="Display name" error={errors.name}>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            maxLength={100}
                            autoFocus
                            placeholder="e.g. Post Study Work Visa"
                            className={inputClass(errors.name)}
                        />
                    </Field>

                    <Field label="Code" hint="Uppercase letters / numbers / dashes only — cannot be changed later" error={errors.code}>
                        <input
                            type="text"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                            maxLength={32}
                            placeholder="e.g. PSW"
                            className={inputClass(errors.code) + ' font-mono uppercase'}
                        />
                    </Field>

                    <Field label="Visa Type" error={errors.visa_type}>
                        <select
                            value={data.visa_type}
                            onChange={(e) => setData('visa_type', e.target.value)}
                            className={inputClass(errors.visa_type)}
                        >
                            {VISA_TYPE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Category" hint="Used for grouping in the visa chooser" error={errors.category}>
                        <select
                            value={data.category}
                            onChange={(e) => setData('category', e.target.value)}
                            className={inputClass(errors.category)}
                        >
                            <option value="study">Study</option>
                            <option value="work">Work</option>
                            <option value="family">Family / Partnership</option>
                            <option value="resident">Residence</option>
                            <option value="visitor">Visitor</option>
                            <option value="other">Other</option>
                        </select>
                    </Field>

                    <Field label="Short description" error={errors.short_description} full>
                        <textarea
                            value={data.short_description}
                            onChange={(e) => setData('short_description', e.target.value)}
                            maxLength={200}
                            rows={2}
                            className={inputClass(errors.short_description)}
                        />
                    </Field>

                    <Divider>Pricing</Divider>

                    {/* Pricing — three amounts, evenly thirds of the row. */}
                    <Field label="Consultation price (NZD)" error={errors.consultation_price_nzd} span="lg:col-span-4">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="5000"
                                value={data.consultation_price_nzd}
                                onChange={(e) => setData('consultation_price_nzd', e.target.value)}
                                className={inputClass(errors.consultation_price_nzd, `!pl-9 !pr-14 ${NO_SPIN}`)}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">NZD</span>
                        </div>
                    </Field>

                    <Field label="Our Professional Fees (NZD)" error={errors.professional_fees} span="lg:col-span-4">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.professional_fees}
                                onChange={(e) => setData('professional_fees', e.target.value)}
                                placeholder="0.00"
                                className={inputClass(errors.professional_fees, `!pl-9 !pr-14 ${NO_SPIN}`)}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">NZD</span>
                        </div>
                    </Field>

                    <Field label="INZ Application Fee (NZD)" error={errors.inz_application_fee} span="lg:col-span-4">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.inz_application_fee}
                                onChange={(e) => setData('inz_application_fee', e.target.value)}
                                placeholder="0.00"
                                className={inputClass(errors.inz_application_fee, `!pl-9 !pr-14 ${NO_SPIN}`)}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">NZD</span>
                        </div>
                    </Field>

                    <Divider>Additional details</Divider>

                    {/* Four across: duration, form estimate, INZ reference, icon. */}
                    <Field label="Consultation duration" error={errors.consultation_duration_minutes}>
                        <div className="relative">
                            <input
                                type="number"
                                min="15"
                                max="180"
                                step="15"
                                value={data.consultation_duration_minutes}
                                onChange={(e) => setData('consultation_duration_minutes', e.target.value)}
                                className={inputClass(errors.consultation_duration_minutes, `!pr-20 ${NO_SPIN}`)}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">minutes</span>
                        </div>
                    </Field>

                    <Field label="Estimated time to complete form" error={errors.estimated_minutes}>
                        <div className="relative">
                            <input
                                type="number"
                                min="5"
                                max="60"
                                value={data.estimated_minutes}
                                onChange={(e) => setData('estimated_minutes', e.target.value)}
                                className={inputClass(errors.estimated_minutes, `!pr-20 ${NO_SPIN}`)}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">minutes</span>
                        </div>
                    </Field>

                    <Field label="INZ form reference" error={errors.inz_form_refs}>
                        <input
                            type="text"
                            value={data.inz_form_refs}
                            onChange={(e) => setData('inz_form_refs', e.target.value)}
                            placeholder="e.g. INZ 1012"
                            className={inputClass(errors.inz_form_refs)}
                        />
                    </Field>

                    <Field label="Icon" error={errors.icon}>
                        <select
                            value={data.icon}
                            onChange={(e) => setData('icon', e.target.value)}
                            className={inputClass(errors.icon)}
                        >
                            {ICON_OPTIONS.map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </Field>

                    <Divider>Status</Divider>

                    <label className="sm:col-span-2 lg:col-span-12 flex items-start gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.active}
                            onChange={(e) => setData('active', e.target.checked)}
                            className="mt-1"
                        />
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Active</p>
                            <p className="text-xs text-gray-500">Inactive visa types are hidden from the applicant visa chooser but stay in admin tooling.</p>
                        </div>
                    </label>
                        </div>

                        {/* BELOW — document checklist table */}
                        <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/40">
                            <Divider>Document checklist</Divider>
                            <div className="mt-3">
                                <ChecklistEditor
                                    items={data.checklist_items}
                                    onChange={(next) => setData('checklist_items', next)}
                                    errors={errors}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0">
                        <button type="button" onClick={onClose} disabled={processing}
                            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={processing}
                            className="inline-flex items-center gap-2 px-5 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors disabled:opacity-50">
                            <Plus size={14} strokeWidth={2.5} /> {processing ? 'Creating…' : 'Create visa type'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/**
 * Delete-confirmation modal. Server may reject if active assessments
 * reference this visa type — error surfaces via flash.
 */
function DeleteModal({ visaType, onClose }) {
    const [processing, setProcessing] = useState(false);

    const confirm = () => {
        setProcessing(true);
        router.delete(`/portal/immigration/visa-types/${visaType.id}`, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onSuccess: () => onClose(),
        });
    };

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                            <AlertTriangle size={18} className="text-rose-600" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">Delete visa type?</h3>
                            <p className="text-xs text-gray-500 mt-0.5">This action is soft — the row hides but can be restored from the database.</p>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-5">
                    <p className="text-sm text-gray-700">
                        You're about to delete <span className="font-semibold text-gray-900">{visaType.name}</span>{' '}
                        <span className="font-mono text-[11px] text-gray-400">({visaType.code})</span>.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                        Active assessments using this type will block the delete — switch them to another type or wait for them to complete.
                    </p>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex items-center justify-end gap-3">
                    <button type="button" onClick={onClose} disabled={processing}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                        Cancel
                    </button>
                    <button type="button" onClick={confirm} disabled={processing}
                        className="inline-flex items-center gap-2 px-5 py-2 bg-rose-600 text-white text-sm font-bold rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50">
                        <Trash2 size={14} /> {processing ? 'Deleting…' : 'Delete visa type'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function EditModal({ visaType, onClose, canViewHistory }) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: visaType.name,
        code: visaType.code || '',
        short_description: visaType.short_description || '',
        visa_type: visaType.visa_type || VISA_TYPE_OPTIONS[0],
        consultation_price_nzd: visaType.consultation_price_nzd,
        professional_fees: visaType.professional_fees ?? '',
        inz_application_fee: visaType.inz_application_fee ?? '',
        consultation_duration_minutes: visaType.consultation_duration_minutes,
        estimated_minutes: visaType.estimated_minutes,
        inz_form_refs: visaType.inz_form_refs || '',
        icon: visaType.icon || 'Globe',
        active: visaType.active,
        // Existing checklist (or empty array if the visa type was created
        // before the column existed) — fully editable inside the modal.
        checklist_items: Array.isArray(visaType.checklist_items)
            ? visaType.checklist_items
            : [],
        updated_at: visaType.updated_at || '',
    });

    const [historyOpen, setHistoryOpen] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        clearErrors();
        post(`/portal/immigration/visa-types/${visaType.id}`, {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
        });
    };

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-start justify-center p-3 sm:p-5 overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Near-fullscreen, but still a modal — a thin gutter keeps the
                backdrop visible on every edge. */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1600px] my-2">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <h2 className="text-lg font-bold text-gray-900">Edit Visa: {visaType.name}</h2>
                    <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700">
                        <X size={18} />
                    </button>
                </div>

                {/* Stacked: settings above, checklist table below. */}
                <form onSubmit={submit}>
                    <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-5 gap-y-4">
                    {errors.error && (
                        <div className="sm:col-span-2 lg:col-span-12 rounded-xl border border-red-100 bg-red-50/60 p-3 text-sm text-red-700">
                            {errors.error}
                        </div>
                    )}

                    {/* Identity — four across: name, code, visa type, icon. */}
                    <Field label="Display name" error={errors.name}>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            maxLength={100}
                            className={inputClass(errors.name)}
                        />
                    </Field>

                    <Field label="Code" hint="Uppercase letters / numbers / dashes only — must stay unique" error={errors.code}>
                        <input
                            type="text"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                            maxLength={32}
                            className={inputClass(errors.code) + ' font-mono uppercase'}
                        />
                    </Field>

                    <Field label="Visa Type" error={errors.visa_type}>
                        <select
                            value={data.visa_type}
                            onChange={(e) => setData('visa_type', e.target.value)}
                            className={inputClass(errors.visa_type)}
                        >
                            {VISA_TYPE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Icon" error={errors.icon}>
                        <select
                            value={data.icon}
                            onChange={(e) => setData('icon', e.target.value)}
                            className={inputClass(errors.icon)}
                        >
                            {ICON_OPTIONS.map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Short description" error={errors.short_description} full>
                        <textarea
                            value={data.short_description}
                            onChange={(e) => setData('short_description', e.target.value)}
                            maxLength={200}
                            rows={2}
                            className={inputClass(errors.short_description)}
                        />
                    </Field>

                    <Divider>Pricing</Divider>

                    {/* Pricing — three amounts, evenly thirds of the row. */}
                    <Field label="Consultation price (NZD)" error={errors.consultation_price_nzd} span="lg:col-span-4">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="5000"
                                value={data.consultation_price_nzd}
                                onChange={(e) => setData('consultation_price_nzd', e.target.value)}
                                className={inputClass(errors.consultation_price_nzd, `!pl-9 !pr-14 ${NO_SPIN}`)}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">NZD</span>
                        </div>
                    </Field>

                    <Field label="Our Professional Fees (NZD)" error={errors.professional_fees} span="lg:col-span-4">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.professional_fees}
                                onChange={(e) => setData('professional_fees', e.target.value)}
                                placeholder="0.00"
                                className={inputClass(errors.professional_fees, `!pl-9 !pr-14 ${NO_SPIN}`)}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">NZD</span>
                        </div>
                    </Field>

                    <Field label="INZ Application Fee (NZD)" error={errors.inz_application_fee} span="lg:col-span-4">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.inz_application_fee}
                                onChange={(e) => setData('inz_application_fee', e.target.value)}
                                placeholder="0.00"
                                className={inputClass(errors.inz_application_fee, `!pl-9 !pr-14 ${NO_SPIN}`)}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">NZD</span>
                        </div>
                    </Field>

                    <Divider>Additional details</Divider>

                    {/* Duration, form estimate and INZ reference — thirds. */}
                    <Field label="Consultation duration" error={errors.consultation_duration_minutes} span="lg:col-span-4">
                        <div className="relative">
                            <input
                                type="number"
                                min="15"
                                max="180"
                                step="15"
                                value={data.consultation_duration_minutes}
                                onChange={(e) => setData('consultation_duration_minutes', e.target.value)}
                                className={inputClass(errors.consultation_duration_minutes, `!pr-20 ${NO_SPIN}`)}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">minutes</span>
                        </div>
                    </Field>

                    <Field label="Estimated time to complete form" hint="Shown on the visa chooser" error={errors.estimated_minutes} span="lg:col-span-4">
                        <div className="relative">
                            <input
                                type="number"
                                min="5"
                                max="60"
                                value={data.estimated_minutes}
                                onChange={(e) => setData('estimated_minutes', e.target.value)}
                                className={inputClass(errors.estimated_minutes, `!pr-20 ${NO_SPIN}`)}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">minutes</span>
                        </div>
                    </Field>

                    <Field label="INZ form reference" error={errors.inz_form_refs} span="lg:col-span-4">
                        <input
                            type="text"
                            value={data.inz_form_refs}
                            onChange={(e) => setData('inz_form_refs', e.target.value)}
                            placeholder="e.g. INZ 1012"
                            className={inputClass(errors.inz_form_refs)}
                        />
                    </Field>

                    <Divider>Status</Divider>

                    {/* Active + Price history split the row in half. */}
                    <label className="lg:col-span-6 flex items-start gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.active}
                            onChange={(e) => setData('active', e.target.checked)}
                            className="mt-1"
                        />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">Active (visible to applicants on the chooser page)</p>
                            {!data.active && (
                                <p className="text-xs text-amber-700 bg-amber-50/70 border border-amber-100 rounded-xl px-3 py-2 mt-2 flex items-start gap-2">
                                    <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                                    Existing assessments for this visa type will continue, but no new ones can be created.
                                </p>
                            )}
                        </div>
                    </label>

                    {canViewHistory && (
                        <div className="lg:col-span-6">
                            <button
                                type="button"
                                onClick={() => setHistoryOpen((s) => !s)}
                                className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-gray-700"
                            >
                                <HistoryIcon size={13} /> Price history
                                {historyOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                            {historyOpen && (
                                <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3">
                                    {visaType.price_history && visaType.price_history.length > 0 ? (
                                        <ul className="space-y-2.5">
                                            {visaType.price_history.map((h) => (
                                                <li key={h.id} className="text-xs">
                                                    <p className="text-gray-700">
                                                        <span className="font-semibold">
                                                            {h.old_price_nzd === null ? '—' : `$${fmt(h.old_price_nzd)}`} → ${fmt(h.new_price_nzd)}
                                                        </span>
                                                        <span className="text-gray-400 ml-2">{fmtDate(h.changed_at)}</span>
                                                    </p>
                                                    <p className="text-gray-500 mt-0.5">
                                                        Changed by {h.changed_by || 'unknown'} · <span title={h.reason}>{h.reason.length > 100 ? h.reason.slice(0, 100) + '…' : h.reason}</span>
                                                    </p>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-xs text-gray-400">No previous price changes recorded</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    </div>

                    {/* BELOW — document checklist table */}
                    <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/40">
                        <Divider>Document checklist</Divider>
                        <div className="mt-3">
                            <ChecklistEditor
                                items={data.checklist_items}
                                onChange={(next) => setData('checklist_items', next)}
                                errors={errors}
                            />
                        </div>
                    </div>
                </form>

                <div className="px-6 py-3 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={processing}
                        className="flex items-center gap-2 px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-60"
                    >
                        <Save size={14} />
                        {processing ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Settings grid is 12 columns on lg so rows can divide cleanly either four
 * ways (span 3 — the default) or three ways (span 4). `full` spans the row.
 */
function Field({ label, hint, required, error, children, full = false, span = 'lg:col-span-3' }) {
    return (
        <div className={full ? 'sm:col-span-2 lg:col-span-12' : span}>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

function Divider({ children }) {
    return (
        <div className="sm:col-span-2 lg:col-span-12 border-t border-gray-100 pt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">{children}</p>
        </div>
    );
}

const inputClass = (error, extra = '') =>
    `w-full rounded-xl border ${error ? 'border-red-300' : 'border-gray-200'} px-3 py-2 text-sm focus:outline-none focus:border-gray-900 ${extra}`;

/**
 * Inline editor for the per-visa document checklist. Each row is one
 * `{ key, label, hint, required }` object inside the array; rows can be
 * added, removed, and reordered. Server-side validation errors land on
 * `checklist_items.0.key` style paths, which we surface inline.
 */
/**
 * A checklist cell that behaves like a word processor: the text wraps and the
 * box grows taller to fit it, so a long hint or key is readable in full
 * without scrolling the table sideways.
 */
function GrowCell({ value, onChange, className = '', breakAll = false, ...rest }) {
    const ref = useRef(null);

    const fit = (el) => {
        if (! el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    };

    // Re-fit when the value changes from outside (template load, reorder).
    useEffect(() => { fit(ref.current); }, [value]);

    return (
        <textarea
            ref={ref}
            rows={1}
            value={value}
            onChange={(e) => { onChange(e); fit(e.target); }}
            // These are single-line values that only *display* wrapped —
            // don't let Enter smuggle a newline into the saved text.
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
            className={`${className} resize-none overflow-hidden leading-snug ${breakAll ? 'break-all' : 'break-words'}`}
            {...rest}
        />
    );
}

function ChecklistEditor({ items = [], onChange, errors = {} }) {
    const set = (i, patch) =>
        onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

    const add = () =>
        onChange([
            ...items,
            // Inherit the last row's section — items are usually added in
            // groups, so this saves retyping it every time.
            { key: '', category: items[items.length - 1]?.category || '', label: '', hint: '', required: true },
        ]);

    // One-click cleanup for visas saved before Section became its own field:
    // pulls "Section · Name" apart into the Section column and a plain label.
    const splitSectionsFromLabels = () => {
        const next = items.map((it) => {
            const [sec, ...rest] = String(it.label || '').split(' · ');
            if (rest.length === 0) return it;
            return { ...it, category: it.category || sec, label: rest.join(' · ') };
        });
        onChange(next);
    };

    const hasEmbeddedSections = items.some((it) => String(it.label || '').includes(' · '));

    const remove = (i) => onChange(items.filter((_, idx) => idx !== i));

    // Insert a copy of item `i` right after it. Keys must stay unique, so the
    // clone's key gets a `_copy` suffix for the staffer to adjust.
    const duplicate = (i) => {
        const src = items[i] || {};
        const copy = { ...src, key: src.key ? `${src.key}_copy` : '' };
        onChange([...items.slice(0, i + 1), copy, ...items.slice(i + 1)]);
    };

    const move = (i, dir) => {
        const j = i + dir;
        if (j < 0 || j >= items.length) return;
        const next = [...items];
        [next[i], next[j]] = [next[j], next[i]];
        onChange(next);
    };

    const errAt = (i, field) => errors[`checklist_items.${i}.${field}`];

    // ── Loadable templates ──────────────────────────────────────────────
    // Fetched lazily the first time the picker is focused. Applying one
    // replaces the current checklist (after a confirm when non-empty), so a
    // hand-made visa can adopt a ready checklist without touching the seeder.
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [templatesLoaded, setTemplatesLoaded] = useState(false);

    const loadTemplates = () => {
        if (templatesLoaded || loadingTemplates) return;
        setLoadingTemplates(true);
        fetch('/portal/immigration/visa-types/templates', { headers: { Accept: 'application/json' } })
            .then((r) => (r.ok ? r.json() : { templates: [] }))
            .then((d) => { setTemplates(d.templates || []); setTemplatesLoaded(true); })
            .catch(() => setTemplates([]))
            .finally(() => setLoadingTemplates(false));
    };

    const applyTemplate = (key) => {
        const tpl = templates.find((t) => t.key === key);
        if (! tpl) return;
        if (items.length > 0 && ! window.confirm(
            `Replace the current ${items.length} checklist item(s) with the "${tpl.label}" template (${tpl.count} items)?`
        )) return;
        onChange((tpl.items || []).map((it) => {
            // Legacy templates embed the section in the label as
            // "Section · Name" — split it out so the Section column is
            // populated either way.
            const [sec, ...rest] = String(it.label || '').split(' · ');
            const hasPrefix = rest.length > 0;
            return {
                key:         it.key || '',
                category:    it.category || (hasPrefix ? sec : ''),
                label:       hasPrefix ? rest.join(' · ') : (it.label || ''),
                hint:        it.hint || '',
                required:    it.required !== false,
                file_code:   it.file_code || '',
                file_suffix: it.file_suffix || '',
            };
        }));
    };

    return (
        <div className="space-y-3">
            {/* Template picker sits on its own line so it can never clip
                against the pane edge. */}
            <div className="space-y-2">
                <p className="text-[11px] text-gray-500 leading-relaxed">
                    Documents the lead needs to submit for this visa. Each
                    row's <span className="font-mono text-[10px]">key</span> is
                    used to match uploads (lowercase letters, numbers, and
                    underscores only).
                </p>
                <select
                    value=""
                    onMouseDown={loadTemplates}
                    onFocus={loadTemplates}
                    onChange={(e) => { applyTemplate(e.target.value); e.target.value = ''; }}
                    className="w-full text-[11px] border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-700 hover:border-gray-300 cursor-pointer"
                >
                    <option value="">{loadingTemplates ? 'Loading templates…' : 'Load a checklist template…'}</option>
                    {templates.map((t) => (
                        <option key={t.key} value={t.key}>{t.label} ({t.count})</option>
                    ))}
                </select>

                {/* Offered only while some labels still carry the old
                    "Section · Name" format. */}
                {hasEmbeddedSections && (
                    <button
                        type="button"
                        onClick={splitSectionsFromLabels}
                        className="w-full text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg px-2.5 py-2 hover:border-gray-900 hover:text-gray-900 transition-colors"
                    >
                        Split “Section · Name” labels into the Section column
                    </button>
                )}
            </div>

            {items.length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-xl px-4 py-8 text-center bg-white">
                    <p className="text-xs text-gray-400">
                        No checklist items yet — leads will only see the generic upload options.
                    </p>
                </div>
            )}

            {/* Fixed layout + wrapping cells: every column keeps its share of
                the width and text flows onto extra lines rather than running
                off the right edge. */}
            {items.length > 0 && (
                <div className="border border-gray-200 rounded-xl bg-white">
                    <table className="w-full text-left table-fixed">
                        <thead>
                            <tr className="bg-gray-100 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                <th className="px-2 py-2 w-[3%]">#</th>
                                <th className="px-2 py-2 w-[16%]">Section</th>
                                <th className="px-2 py-2 w-[12%]">Key</th>
                                <th className="px-2 py-2 w-[18%]">Label</th>
                                <th className="px-2 py-2 w-[26%]">Hint</th>
                                <th className="px-2 py-2 w-[4%] text-center">Req</th>
                                <th className="px-2 py-2 w-[7%]">Code</th>
                                <th className="px-2 py-2 w-[9%]">Suffix</th>
                                <th className="px-2 py-2 w-[5%] text-right">&nbsp;</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((it, i) => (
                                <tr key={i} className="align-top hover:bg-gray-50/60">
                                    {/* order + reorder */}
                                    <td className="px-2 py-2">
                                        <div className="flex items-center gap-1">
                                            <span className="font-mono text-[10px] text-gray-400 w-4">{String(i + 1).padStart(2, '0')}</span>
                                            <div className="flex flex-col">
                                                <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                                                    title="Move up"
                                                    className="w-4 h-3 flex items-center justify-center text-gray-400 hover:text-gray-900 disabled:opacity-30">
                                                    <ChevronUp size={11} />
                                                </button>
                                                <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1}
                                                    title="Move down"
                                                    className="w-4 h-3 flex items-center justify-center text-gray-400 hover:text-gray-900 disabled:opacity-30">
                                                    <ChevronDown size={11} />
                                                </button>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Section — the group heading this item
                                        sits under on the staff Documents tab
                                        and the applicant's tracker. */}
                                    <td className="px-2 py-2">
                                        <GrowCell
                                            value={it.category ?? ''}
                                            onChange={(e) => set(i, { category: e.target.value })}
                                            placeholder="Identity & Photo"
                                            className={inputClass(errAt(i, 'category')) + ' !text-[11px] !px-2 !py-1.5'} />
                                        {errAt(i, 'category') && <p className="text-[10px] text-red-500 mt-0.5">{errAt(i, 'category')}</p>}
                                    </td>

                                    <td className="px-2 py-2">
                                        {/* Keys have no spaces, so they need to
                                            break mid-word to wrap at all. */}
                                        <GrowCell breakAll value={it.key || ''}
                                            onChange={(e) => set(i, { key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                                            placeholder="employer_letter"
                                            className={inputClass(errAt(i, 'key')) + ' font-mono !text-[11px] !px-2 !py-1.5'} />
                                        {errAt(i, 'key') && <p className="text-[10px] text-red-500 mt-0.5">{errAt(i, 'key')}</p>}
                                    </td>

                                    <td className="px-2 py-2">
                                        <GrowCell value={it.label || ''}
                                            onChange={(e) => set(i, { label: e.target.value })}
                                            placeholder="Employer reference letter"
                                            className={inputClass(errAt(i, 'label')) + ' !text-[11px] !px-2 !py-1.5'} />
                                        {errAt(i, 'label') && <p className="text-[10px] text-red-500 mt-0.5">{errAt(i, 'label')}</p>}
                                    </td>

                                    <td className="px-2 py-2">
                                        <GrowCell value={it.hint || ''}
                                            onChange={(e) => set(i, { hint: e.target.value })}
                                            placeholder="Optional hint for the applicant"
                                            className={inputClass(errAt(i, 'hint')) + ' !text-[11px] !px-2 !py-1.5'} />
                                    </td>

                                    <td className="px-2 py-2 text-center">
                                        <input type="checkbox" className="mt-1.5"
                                            checked={it.required !== false}
                                            onChange={(e) => set(i, { required: e.target.checked })} />
                                    </td>

                                    <td className="px-2 py-2">
                                        <GrowCell breakAll value={it.file_code || ''}
                                            onChange={(e) => set(i, { file_code: e.target.value })}
                                            placeholder="PPT"
                                            title={'Uploads renamed to ' + String(i + 1).padStart(2, '0') + ' - ' + (it.file_code || 'CODE') + ' - FirstnameLASTNAME' + (it.file_suffix || '')}
                                            className={inputClass(errAt(i, 'file_code')) + ' font-mono !text-[11px] !px-2 !py-1.5 uppercase'} />
                                    </td>

                                    <td className="px-2 py-2">
                                        <GrowCell breakAll value={it.file_suffix || ''}
                                            onChange={(e) => set(i, { file_suffix: e.target.value })}
                                            placeholder="(of sponsor)"
                                            className={inputClass(errAt(i, 'file_suffix')) + ' !text-[11px] !px-2 !py-1.5'} />
                                    </td>

                                    <td className="px-2 py-2">
                                        <div className="flex items-center justify-end gap-0.5">
                                            <button type="button" onClick={() => duplicate(i)} title="Duplicate this requirement"
                                                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors">
                                                <Copy size={12} />
                                            </button>
                                            <button type="button" onClick={() => remove(i)} title="Remove this requirement"
                                                className="w-6 h-6 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded transition-colors">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <button
                type="button"
                onClick={add}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-gray-700 bg-white border border-dashed border-gray-300 rounded-xl hover:border-gray-900 hover:text-gray-900 transition-colors"
            >
                <Plus size={12} strokeWidth={2.5} /> Add checklist item
            </button>
        </div>
    );
}
