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

const money = (n) =>
    n === null || n === undefined || n === '' || isNaN(Number(n))
        ? '—'
        : Number(n).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
            {/* Wider than the old list — the table carries both quoted
                totals plus the consultation fee. */}
            <div className="max-w-7xl mx-auto p-6">
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
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[900px]">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                        <th className="px-6 py-2.5">Visa</th>
                                        <th className="px-3 py-2.5">Code</th>
                                        <th className="px-3 py-2.5 text-right">Consultation</th>
                                        {/* The two quoted totals — what staff are
                                            actually asked for on the phone. */}
                                        <th className="px-3 py-2.5 text-right">Pay now</th>
                                        <th className="px-3 py-2.5 text-right">Payment plan</th>
                                        <th className="px-3 py-2.5 text-center">Checklist</th>
                                        <th className="px-3 py-2.5 text-center">Status</th>
                                        <th className="px-6 py-2.5 text-right">&nbsp;</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {rows.map((v) => {
                                        const byTier = Object.fromEntries(
                                            (v.fee_breakdown || []).map((f) => [f.tier, f])
                                        );
                                        return (
                                            <tr key={v.id} className="hover:bg-gray-50/40">
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                            <VisaIcon name={v.icon} size={16} className="text-gray-700" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-gray-900 text-sm truncate">{v.name}</p>
                                                            {v.short_description && (
                                                                <p className="text-xs text-gray-500 truncate max-w-[320px]">{v.short_description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-3 py-3">
                                                    <span className="text-[10px] font-mono font-bold uppercase text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                        {v.code}
                                                    </span>
                                                </td>

                                                <td className="px-3 py-3 text-right whitespace-nowrap">
                                                    <p className="text-sm font-semibold text-gray-900 tabular-nums">${fmt(v.consultation_price_nzd)}</p>
                                                    <p className="text-[11px] text-gray-400">{v.consultation_duration_minutes} min</p>
                                                </td>

                                                <td className="px-3 py-3 text-right whitespace-nowrap">
                                                    <span className="text-sm font-bold text-slate-800 tabular-nums">
                                                        ${fmt(byTier.discounted?.total)}
                                                    </span>
                                                </td>

                                                <td className="px-3 py-3 text-right whitespace-nowrap">
                                                    <span className="text-sm font-bold text-orange-700 tabular-nums">
                                                        ${fmt(byTier.normal?.total)}
                                                    </span>
                                                </td>

                                                <td className="px-3 py-3 text-center">
                                                    <span className="text-xs text-gray-500 tabular-nums">
                                                        {(v.checklist_items || []).length || <span className="text-gray-300">—</span>}
                                                    </span>
                                                </td>

                                                <td className="px-3 py-3 text-center">
                                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                                        v.active ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                                                    }`}>
                                                        {v.active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-3">
                                                    <div className="flex items-center justify-end gap-1.5">
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
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
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
        professional_fees_discounted: '',
        inz_application_fee: '',
        consultation_duration_minutes: 60,
        estimated_minutes: 15,
        inz_form_refs: '',
        icon: 'Globe',
        active: true,
        checklist_items: [],
    });

    const [tab, setTab] = useState('fees');

    const submit = (e) => {
        e.preventDefault();
        clearErrors();
        post(`/portal/immigration/visa-types`, {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
            // Surface the pane the error is actually on — an error message
            // attached to a hidden field reads as a save that failed for no
            // reason.
            onError: (errs) => setTab(hasSettingsError(errs) ? 'fees' : 'checklist'),
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

                <ModalTabs
                    active={tab}
                    onChange={setTab}
                    tabs={[
                        { key: 'fees', label: 'Visa and fees', hasError: hasSettingsError(errors) },
                        { key: 'checklist', label: 'Visa checklist', count: data.checklist_items.length, hasError: hasChecklistError(errors) },
                    ]}
                />

                {/* One form, two panes — the inactive pane is hidden, not
                    unmounted, so nothing typed is lost on a tab switch. */}
                <form onSubmit={submit}>
                    {/* Profile layout: a live summary of the visa, then one
                        card per concern — identity, consultation, fees, status. */}
                    <div className={`px-6 py-5 space-y-5 bg-gray-50 ${tab === 'fees' ? '' : 'hidden'}`}>
                        {errors.error && (
                            <div className="rounded-xl border border-red-100 bg-red-50/60 p-3 text-sm text-red-700">
                                {errors.error}
                            </div>
                        )}

                        <VisaProfileHeader data={data} />

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                            <Card title="Identity" className="lg:col-span-2"
                                bodyClass="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-4">
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

                                <Field label="Short description" error={errors.short_description} full>
                                    <textarea
                                        value={data.short_description}
                                        onChange={(e) => setData('short_description', e.target.value)}
                                        maxLength={200}
                                        rows={2}
                                        className={inputClass(errors.short_description)}
                                    />
                                </Field>
                            </Card>

                            <Card title="Consultation & form" bodyClass="space-y-4">
                                <Field label="Consultation price (NZD)" error={errors.consultation_price_nzd}>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-sm text-gray-400">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="5000"
                                            value={data.consultation_price_nzd}
                                            onChange={(e) => setData('consultation_price_nzd', e.target.value)}
                                            className={inputClass(errors.consultation_price_nzd, `!pl-9 !pr-14 ${NO_SPIN}`)}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-gray-400 font-semibold">NZD</span>
                                    </div>
                                </Field>

                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Duration" error={errors.consultation_duration_minutes}>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="15"
                                                max="180"
                                                step="15"
                                                value={data.consultation_duration_minutes}
                                                onChange={(e) => setData('consultation_duration_minutes', e.target.value)}
                                                className={inputClass(errors.consultation_duration_minutes, `!pr-14 ${NO_SPIN}`)}
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-gray-400 font-semibold">mins</span>
                                        </div>
                                    </Field>

                                    <Field label="Form time" hint="Shown on the chooser" error={errors.estimated_minutes}>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="5"
                                                max="60"
                                                value={data.estimated_minutes}
                                                onChange={(e) => setData('estimated_minutes', e.target.value)}
                                                className={inputClass(errors.estimated_minutes, `!pr-14 ${NO_SPIN}`)}
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-gray-400 font-semibold">mins</span>
                                        </div>
                                    </Field>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="INZ form ref" error={errors.inz_form_refs}>
                                        <input
                                            type="text"
                                            value={data.inz_form_refs}
                                            onChange={(e) => setData('inz_form_refs', e.target.value)}
                                            placeholder="INZ 1012"
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
                                </div>

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
                            </Card>
                        </div>

                        {/* Full width — the schedule is eight columns wide. */}
                        {/* No card heading — the table's own tier banners are
                            the heading, and a second dark bar above them just
                            doubled up. */}
                        <Card bodyClass="!p-0">
                            <FeeScheduleTable data={data} setData={setData} errors={errors} />
                        </Card>

                        <Card title="Status">
                            <label className="flex items-start gap-2 cursor-pointer">
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
                        </Card>
                    </div>

                    <div className={tab === 'checklist' ? '' : 'hidden'}>
                        <div className="px-6 py-5 bg-gray-50">
                            <ChecklistEditor
                                items={data.checklist_items}
                                onChange={(next) => setData('checklist_items', next)}
                                errors={errors}
                            />
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
        professional_fees_discounted: visaType.professional_fees_discounted ?? '',
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
    const [tab, setTab] = useState('fees');

    const submit = (e) => {
        e.preventDefault();
        clearErrors();
        post(`/portal/immigration/visa-types/${visaType.id}`, {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
            // Surface the pane the error is actually on — an error message
            // attached to a hidden field reads as a save that failed for no
            // reason.
            onError: (errs) => setTab(hasSettingsError(errs) ? 'fees' : 'checklist'),
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

                <ModalTabs
                    active={tab}
                    onChange={setTab}
                    tabs={[
                        { key: 'fees', label: 'Visa and fees', hasError: hasSettingsError(errors) },
                        { key: 'checklist', label: 'Visa checklist', count: data.checklist_items.length, hasError: hasChecklistError(errors) },
                    ]}
                />

                {/* One form, two panes — the inactive pane is hidden, not
                    unmounted, so nothing typed is lost on a tab switch. */}
                <form onSubmit={submit}>
                    {/* Profile layout: a live summary of the visa, then one
                        card per concern — identity, consultation, fees, status. */}
                    <div className={`px-6 py-5 space-y-5 bg-gray-50 ${tab === 'fees' ? '' : 'hidden'}`}>
                        {errors.error && (
                            <div className="rounded-xl border border-red-100 bg-red-50/60 p-3 text-sm text-red-700">
                                {errors.error}
                            </div>
                        )}

                        <VisaProfileHeader data={data} />

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                            <Card title="Identity" className="lg:col-span-2"
                                bodyClass="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-4">
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

                                <Field label="Short description" error={errors.short_description} full>
                                    <textarea
                                        value={data.short_description}
                                        onChange={(e) => setData('short_description', e.target.value)}
                                        maxLength={200}
                                        rows={2}
                                        className={inputClass(errors.short_description)}
                                    />
                                </Field>
                            </Card>

                            <Card title="Consultation & form" bodyClass="space-y-4">
                                <Field label="Consultation price (NZD)" error={errors.consultation_price_nzd}>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-sm text-gray-400">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="5000"
                                            value={data.consultation_price_nzd}
                                            onChange={(e) => setData('consultation_price_nzd', e.target.value)}
                                            className={inputClass(errors.consultation_price_nzd, `!pl-9 !pr-14 ${NO_SPIN}`)}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-gray-400 font-semibold">NZD</span>
                                    </div>
                                </Field>

                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Duration" error={errors.consultation_duration_minutes}>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="15"
                                                max="180"
                                                step="15"
                                                value={data.consultation_duration_minutes}
                                                onChange={(e) => setData('consultation_duration_minutes', e.target.value)}
                                                className={inputClass(errors.consultation_duration_minutes, `!pr-14 ${NO_SPIN}`)}
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-gray-400 font-semibold">mins</span>
                                        </div>
                                    </Field>

                                    <Field label="Form time" hint="Shown on the chooser" error={errors.estimated_minutes}>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="5"
                                                max="60"
                                                value={data.estimated_minutes}
                                                onChange={(e) => setData('estimated_minutes', e.target.value)}
                                                className={inputClass(errors.estimated_minutes, `!pr-14 ${NO_SPIN}`)}
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-gray-400 font-semibold">mins</span>
                                        </div>
                                    </Field>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="INZ form ref" error={errors.inz_form_refs}>
                                        <input
                                            type="text"
                                            value={data.inz_form_refs}
                                            onChange={(e) => setData('inz_form_refs', e.target.value)}
                                            placeholder="INZ 1012"
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
                                </div>
                            </Card>
                        </div>

                        {/* Full width — the schedule is eight columns wide. */}
                        {/* No card heading — the table's own tier banners are
                            the heading, and a second dark bar above them just
                            doubled up. */}
                        <Card bodyClass="!p-0">
                            <FeeScheduleTable data={data} setData={setData} errors={errors} />
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                            <Card title="Status">
                                <label className="flex items-start gap-2 cursor-pointer">
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
                            </Card>

                            {canViewHistory && (
                                <Card title="Price history">
                                    <button
                                        type="button"
                                        onClick={() => setHistoryOpen((s) => !s)}
                                        className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900"
                                    >
                                        <HistoryIcon size={13} />
                                        {historyOpen ? 'Hide' : 'Show'} previous price changes
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
                                </Card>
                            )}
                        </div>
                    </div>

                    <div className={`px-6 py-5 bg-gray-50 ${tab === 'checklist' ? '' : 'hidden'}`}>
                        <ChecklistEditor
                            items={data.checklist_items}
                            onChange={(next) => setData('checklist_items', next)}
                            errors={errors}
                        />
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
 * Form field. Cards lay their own grid out, so the default is to occupy one
 * cell; `full` spans whatever grid it lands in, `span` overrides explicitly.
 */
function Field({ label, hint, required, error, children, full = false, span = '' }) {
    return (
        <div className={full ? 'col-span-full' : span}>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {hint && !error && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
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

// gray-300 rather than gray-200: on a white card the lighter border all but
// disappears, so fields read as floating text instead of inputs.
const inputClass = (error, extra = '') =>
    `w-full rounded-xl border bg-white ${error ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 ${extra}`;

/**
 * Inline editor for the per-visa document checklist. Each row is one
 * `{ key, label, hint, required }` object inside the array; rows can be
 * added, removed, and reordered. Server-side validation errors land on
 * `checklist_items.0.key` style paths, which we surface inline.
 */
/**
 * Tab strip for the visa modals — "Visa and fees" vs "Visa checklist".
 *
 * Both panes belong to one form, so switching tabs must not lose anything:
 * the inactive pane is hidden with CSS, never unmounted. A tab carrying a
 * validation error is flagged, otherwise a failed save could point at a field
 * the staffer can't see.
 */
function ModalTabs({ tabs, active, onChange }) {
    return (
        <div className="px-6 border-b border-gray-100 flex gap-1">
            {tabs.map((t) => {
                const on = t.key === active;
                return (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => onChange(t.key)}
                        className={`relative -mb-px px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                            on
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-400 hover:text-gray-700'
                        }`}
                    >
                        {t.label}
                        {t.count !== undefined && (
                            <span className={`ml-1.5 text-[11px] tabular-nums ${on ? 'text-gray-400' : 'text-gray-300'}`}>
                                {t.count}
                            </span>
                        )}
                        {t.hasError && (
                            <span className="absolute top-1.5 right-1 w-1.5 h-1.5 rounded-full bg-red-500"
                                title="This tab has a validation error" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}

/** True when any validation error key belongs to the checklist editor. */
const hasChecklistError = (errors) =>
    Object.keys(errors || {}).some((k) => k.startsWith('checklist_items'));

/** True when any error belongs to the settings pane (i.e. isn't a checklist one). */
const hasSettingsError = (errors) =>
    Object.keys(errors || {}).some((k) => !k.startsWith('checklist_items'));

// NZ GST. Mirrors VisaType::GST_RATE — fees are entered exclusive of GST and
// the RRP adds it on top.
const GST_RATE = 0.15;

/** Colour identity per pricing tier — heading blocks only. */
const TIER_TONES = {
    discounted: { banner: 'bg-slate-800', head: 'bg-slate-800 text-white', headSub: 'text-white/60', chip: 'bg-slate-100 text-slate-700' },
    normal:     { banner: 'bg-orange-700', head: 'bg-orange-700 text-white', headSub: 'text-white/70', chip: 'bg-orange-100 text-orange-800' },
};

/**
 * The two quoted tiers, derived from the form state. Mirrors
 * VisaType::feeBreakdown() on the server — the header summary and the fee
 * table both read from here so they can never disagree.
 */
function computeTiers(data) {
    const inz = data.inz_application_fee === '' || data.inz_application_fee === null || data.inz_application_fee === undefined
        ? null
        : Number(data.inz_application_fee);

    const build = (key, title, note, field) => {
        const raw = data[field];
        const excl = raw === '' || raw === null || raw === undefined ? null : Number(raw);
        const incl = excl === null || isNaN(excl) ? null : excl * (1 + GST_RATE);
        // The INZ fee is a government charge passed straight through, so no
        // GST is added to it — it joins the total after the uplift.
        const total = incl === null && inz === null ? null : (incl || 0) + (inz || 0);
        return { key, title, note, field, incl, total, tone: TIER_TONES[key] };
    };

    return {
        inz,
        tiers: [
            build('discounted', 'Discounted price', 'Pay now basis', 'professional_fees_discounted'),
            build('normal', 'Normal price', 'Payment plan', 'professional_fees'),
        ],
    };
}

/**
 * Titled panel — one concern per card, the profile layout's building block.
 *
 * White card on the pane's grey canvas: white-on-white gave the sections no
 * edge at all, so the whole form read as one undifferentiated sheet.
 */
function Card({ title, hint, children, className = '', bodyClass = '' }) {
    return (
        <section className={`rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden ${className}`}>
            {title && (
                <header className="px-4 py-2.5 bg-slate-800">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white">{title}</h3>
                    {hint && <p className="text-[11px] text-white/60 mt-0.5">{hint}</p>}
                </header>
            )}
            <div className={`px-4 py-4 ${bodyClass}`}>{children}</div>
        </section>
    );
}

/**
 * Profile header — the visa as it currently reads, assembled live from the
 * form. Gives the pane something to be *about*, and puts the two quoted
 * totals in view while the fees below are being edited.
 */
function VisaProfileHeader({ data }) {
    const { tiers } = computeTiers(data);

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm px-5 py-4 flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                <VisaIcon name={data.icon} size={22} className="text-gray-700" />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-base font-bold text-gray-900 truncate">
                        {data.name || <span className="text-gray-300">Untitled visa</span>}
                    </p>
                    {data.code && (
                        <span className="text-[10px] font-mono font-bold uppercase text-gray-500 bg-gray-200/70 px-1.5 py-0.5 rounded">
                            {data.code}
                        </span>
                    )}
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        data.active ? 'text-emerald-700 bg-emerald-100' : 'text-amber-700 bg-amber-100'
                    }`}>
                        {data.active ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {[data.visa_type, data.category, data.inz_form_refs].filter(Boolean).join(' · ') || 'No classification set'}
                </p>
            </div>

            {/* Live totals — what the applicant is actually quoted. */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {tiers.map((t) => (
                    <div key={t.key} className={`rounded-lg px-3 py-1.5 text-right ${t.tone.chip}`}>
                        <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">{t.note}</p>
                        <p className="text-sm font-bold tabular-nums">${money(t.total)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * The visa's fee schedule, laid out exactly the way it is quoted: the two
 * pricing tiers side by side across one row, each with its own INZ fee,
 * professional fees (excl / incl GST) and total.
 *
 * Only the two GST-exclusive professional fees and the shared INZ fee are
 * editable — the RRP and totals come from computeTiers(), so they can't be
 * entered wrong or drift out of step with the header summary.
 */
function FeeScheduleTable({ data, setData, errors }) {
    const { inz, tiers } = computeTiers(data);

    const priceInput = (field, error) => (
        <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-[11px] text-gray-400">$</span>
            <input
                type="number"
                step="0.01"
                min="0"
                value={data[field]}
                onChange={(e) => setData(field, e.target.value)}
                placeholder="0.00"
                className={inputClass(error, `!pl-5 !pr-2 !py-1.5 !text-xs font-bold text-center ${NO_SPIN}`)}
            />
        </div>
    );

    return (
        <div>
            {/* Sits flush inside its card — the card supplies the border. */}
            <div className="bg-white overflow-x-auto">
                <table className="w-full text-left table-fixed min-w-[720px]">
                    <thead>
                        {/* Tier banners spanning their four columns. */}
                        <tr>
                            {tiers.map((t, i) => (
                                <th
                                    key={t.key}
                                    colSpan={4}
                                    className={`px-3 py-2 text-center text-white ${t.tone.banner} ${i === 0 ? '' : 'border-l-2 border-white'}`}
                                >
                                    <span className="text-[11px] font-bold uppercase tracking-wider">{t.title}</span>
                                    <span className="ml-1.5 text-[10px] font-semibold opacity-75">[{t.note}]</span>
                                </th>
                            ))}
                        </tr>
                        {/* Headers are centred over their figures — a label
                            offset from the number under it leaves nothing to
                            read down the column. */}
                        <tr className="text-[10px] font-bold uppercase tracking-wider text-center">
                            {tiers.map((t, i) => (
                                <React.Fragment key={t.key}>
                                    <th className={`px-3 py-2 w-[12.5%] ${t.tone.head} ${i === 0 ? '' : 'border-l-2 border-white'}`}>
                                        INZ fee
                                        <span className={`block font-semibold normal-case tracking-normal ${t.tone.headSub}`}>&nbsp;</span>
                                    </th>
                                    <th className={`px-3 py-2 w-[12.5%] ${t.tone.head}`}>
                                        Prof fees
                                        <span className={`block font-semibold normal-case tracking-normal ${t.tone.headSub}`}>excl GST</span>
                                    </th>
                                    <th className={`px-3 py-2 w-[12.5%] ${t.tone.head}`}>
                                        Prof fees
                                        <span className={`block font-semibold normal-case tracking-normal ${t.tone.headSub}`}>RRP incl GST</span>
                                    </th>
                                    <th className={`px-3 py-2 w-[12.5%] ${t.tone.head}`}>
                                        Total
                                        <span className={`block font-semibold normal-case tracking-normal ${t.tone.headSub}`}>fees + INZ</span>
                                    </th>
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Column rules run through the data row so each figure
                            stays tied to the header above it. */}
                        <tr className="align-middle divide-x divide-gray-100">
                            {tiers.map((t, i) => (
                                <React.Fragment key={t.key}>
                                    {/* One INZ fee serves both tiers — editable
                                        under Discounted, echoed under Normal so
                                        each side still totals up on its own. */}
                                    <td className={`px-2 py-3 ${i === 0 ? '' : '!border-l-2 !border-gray-300'}`}>
                                        {i === 0 ? priceInput('inz_application_fee', errors.inz_application_fee) : (
                                            <p className="text-xs font-bold tabular-nums text-center text-gray-400"
                                                title="The same INZ fee applies to both tiers">
                                                {money(inz)}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-2 py-3">{priceInput(t.field, errors[t.field])}</td>
                                    {/* Derived, not editable — flat gray so it
                                        reads as a result, not an empty input. */}
                                    <td className="px-2 py-3 bg-gray-50/60">
                                        <p className="text-xs font-bold tabular-nums text-center text-gray-600">{money(t.incl)}</p>
                                    </td>
                                    <td className="px-2 py-3 bg-gray-50/60">
                                        <p className="text-sm font-bold tabular-nums text-center text-gray-900">{money(t.total)}</p>
                                    </td>
                                </React.Fragment>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
            {/* The GST explanation lives on the card header now. */}
            {(errors.professional_fees || errors.professional_fees_discounted || errors.inz_application_fee) && (
                <p className="text-xs text-red-500 px-4 py-2 bg-red-50 border-t border-red-100">
                    {errors.professional_fees || errors.professional_fees_discounted || errors.inz_application_fee}
                </p>
            )}
        </div>
    );
}

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
        // scrollHeight covers content + padding but NOT the border, while the
        // box is border-box — so assigning it raw leaves the text clipped by
        // exactly the border width. Measure the border and add it back.
        const border = el.offsetHeight - el.clientHeight;
        el.style.height = `${el.scrollHeight + border}px`;
    };

    // Re-fit on value change (template load, reorder) and once after mount,
    // since fonts/CSS may not have settled when the first measure runs.
    useEffect(() => { fit(ref.current); }, [value]);
    useEffect(() => {
        const id = requestAnimationFrame(() => fit(ref.current));
        return () => cancelAnimationFrame(id);
    }, []);

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
                <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
                    <table className="w-full text-left table-fixed">
                        <thead>
                            {/* Dark header — matches the fee schedule's banded
                                headings and keeps the column labels legible
                                against the white rows below. */}
                            <tr className="bg-slate-800 text-[10px] font-bold text-white uppercase tracking-wider">
                                <th className="px-3 py-2.5 w-[3%]">#</th>
                                <th className="px-3 py-2.5 w-[16%]">Section</th>
                                <th className="px-3 py-2.5 w-[12%]">Key</th>
                                <th className="px-3 py-2.5 w-[18%]">Label</th>
                                <th className="px-3 py-2.5 w-[26%]">Hint</th>
                                <th className="px-3 py-2.5 w-[4%] text-center">Req</th>
                                <th className="px-3 py-2.5 w-[7%]">Code</th>
                                <th className="px-3 py-2.5 w-[9%]">Suffix</th>
                                <th className="px-3 py-2.5 w-[5%] text-right">&nbsp;</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((it, i) => (
                                <tr key={i} className="align-top hover:bg-gray-50/60">
                                    {/* order + reorder */}
                                    <td className="px-3 py-2.5">
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
                                    <td className="px-3 py-2.5">
                                        <GrowCell
                                            value={it.category ?? ''}
                                            onChange={(e) => set(i, { category: e.target.value })}
                                            placeholder="Identity & Photo"
                                            className={inputClass(errAt(i, 'category')) + ' !text-sm !px-2.5 !py-2'} />
                                        {errAt(i, 'category') && <p className="text-[10px] text-red-500 mt-0.5">{errAt(i, 'category')}</p>}
                                    </td>

                                    <td className="px-3 py-2.5">
                                        {/* Keys have no spaces, so they need to
                                            break mid-word to wrap at all. */}
                                        <GrowCell breakAll value={it.key || ''}
                                            onChange={(e) => set(i, { key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                                            placeholder="employer_letter"
                                            className={inputClass(errAt(i, 'key')) + ' font-mono !text-sm !px-2.5 !py-2'} />
                                        {errAt(i, 'key') && <p className="text-[10px] text-red-500 mt-0.5">{errAt(i, 'key')}</p>}
                                    </td>

                                    <td className="px-3 py-2.5">
                                        <GrowCell value={it.label || ''}
                                            onChange={(e) => set(i, { label: e.target.value })}
                                            placeholder="Employer reference letter"
                                            className={inputClass(errAt(i, 'label')) + ' !text-sm !px-2.5 !py-2'} />
                                        {errAt(i, 'label') && <p className="text-[10px] text-red-500 mt-0.5">{errAt(i, 'label')}</p>}
                                    </td>

                                    <td className="px-3 py-2.5">
                                        <GrowCell value={it.hint || ''}
                                            onChange={(e) => set(i, { hint: e.target.value })}
                                            placeholder="Optional hint for the applicant"
                                            className={inputClass(errAt(i, 'hint')) + ' !text-sm !px-2.5 !py-2'} />
                                    </td>

                                    <td className="px-3 py-2.5 text-center">
                                        <input type="checkbox" className="mt-1.5"
                                            checked={it.required !== false}
                                            onChange={(e) => set(i, { required: e.target.checked })} />
                                    </td>

                                    <td className="px-3 py-2.5">
                                        <GrowCell breakAll value={it.file_code || ''}
                                            onChange={(e) => set(i, { file_code: e.target.value })}
                                            placeholder="PPT"
                                            title={'Uploads renamed to ' + String(i + 1).padStart(2, '0') + ' - ' + (it.file_code || 'CODE') + ' - FirstnameLASTNAME' + (it.file_suffix || '')}
                                            className={inputClass(errAt(i, 'file_code')) + ' font-mono !text-sm !px-2.5 !py-2 uppercase'} />
                                    </td>

                                    <td className="px-3 py-2.5">
                                        <GrowCell breakAll value={it.file_suffix || ''}
                                            onChange={(e) => set(i, { file_suffix: e.target.value })}
                                            placeholder="(of sponsor)"
                                            className={inputClass(errAt(i, 'file_suffix')) + ' !text-sm !px-2.5 !py-2'} />
                                    </td>

                                    <td className="px-3 py-2.5">
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
