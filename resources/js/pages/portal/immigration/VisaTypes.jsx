import React, { useState, useMemo, useEffect } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    GraduationCap, Briefcase, Plane, Heart, Home, HelpCircle, Globe,
    Pencil, X, History as HistoryIcon, ChevronDown, ChevronUp, AlertTriangle, Save,
} from 'lucide-react';
import { toast } from 'sonner';

const ICONS = { GraduationCap, Briefcase, Plane, Heart, Home, HelpCircle, Globe };
const ICON_OPTIONS = Object.keys(ICONS);

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

export default function VisaTypes({ visaTypes, permissions }) {
    const [editing, setEditing] = useState(null);
    const { props } = usePage();

    useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
    }, [props.flash?.success]);

    return (
        <>
            <Head title="Visa Types" />
            <div className="max-w-5xl mx-auto p-6">
                <header className="mb-8 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Visa types</h1>
                        <p className="text-sm text-gray-500 max-w-xl">
                            Edit the consultation fee, duration, and description shown to applicants on the visa chooser.
                            Price changes require a reason and are audited.
                        </p>
                    </div>
                    {permissions.canCreate && (
                        <button
                            type="button"
                            disabled
                            title="Coming soon"
                            className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl opacity-40 cursor-not-allowed"
                        >
                            + Add new visa type
                        </button>
                    )}
                </header>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {visaTypes.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-sm font-semibold text-gray-700">No visa types yet</p>
                            <p className="text-xs text-gray-500 mt-1">Seed VisaTypeSeeder to populate the default set.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-50">
                            {visaTypes.map((v) => (
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
                                    {permissions.canUpdate && (
                                        <button
                                            type="button"
                                            onClick={() => setEditing(v)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-200 rounded-xl hover:border-gray-900 hover:text-gray-900 transition-colors"
                                        >
                                            <Pencil size={13} /> Edit
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
                    canViewHistory={permissions.canViewHistory}
                />
            )}
        </>
    );
}

function EditModal({ visaType, onClose, canViewHistory }) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: visaType.name,
        short_description: visaType.short_description || '',
        consultation_price_nzd: visaType.consultation_price_nzd,
        consultation_duration_minutes: visaType.consultation_duration_minutes,
        estimated_minutes: visaType.estimated_minutes,
        inz_form_refs: visaType.inz_form_refs || '',
        icon: visaType.icon || 'Globe',
        active: visaType.active,
        reason: '',
        updated_at: visaType.updated_at || '',
    });

    const [historyOpen, setHistoryOpen] = useState(false);

    const priceChanged = useMemo(
        () => Number(data.consultation_price_nzd) !== Number(visaType.consultation_price_nzd),
        [data.consultation_price_nzd, visaType.consultation_price_nzd]
    );

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
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Edit Visa Type: {visaType.name}</h2>
                    <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={submit} className="px-6 py-5 space-y-5">
                    {errors.error && (
                        <div className="rounded-xl border border-red-100 bg-red-50/60 p-3 text-sm text-red-700">
                            {errors.error}
                        </div>
                    )}

                    <Field label="Display name" error={errors.name}>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            maxLength={100}
                            className={inputClass(errors.name)}
                        />
                    </Field>

                    <Field label="Short description" error={errors.short_description}>
                        <textarea
                            value={data.short_description}
                            onChange={(e) => setData('short_description', e.target.value)}
                            maxLength={200}
                            rows={2}
                            className={inputClass(errors.short_description)}
                        />
                    </Field>

                    <Field label="Code" hint="System identifier, cannot be changed">
                        <input
                            type="text"
                            value={visaType.code}
                            disabled
                            className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                        />
                    </Field>

                    <Divider>Pricing</Divider>

                    <Field label="Consultation price (NZD)" error={errors.consultation_price_nzd}>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="50"
                                max="1000"
                                value={data.consultation_price_nzd}
                                onChange={(e) => setData('consultation_price_nzd', e.target.value)}
                                className={inputClass(errors.consultation_price_nzd, 'pl-7 pr-14')}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">NZD</span>
                        </div>
                    </Field>

                    <Field label="Consultation duration" error={errors.consultation_duration_minutes}>
                        <div className="relative">
                            <input
                                type="number"
                                min="15"
                                max="180"
                                step="15"
                                value={data.consultation_duration_minutes}
                                onChange={(e) => setData('consultation_duration_minutes', e.target.value)}
                                className={inputClass(errors.consultation_duration_minutes, 'pr-20')}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">minutes</span>
                        </div>
                    </Field>

                    {priceChanged && (
                        <Field
                            label="Reason for price change"
                            required
                            hint="Required when changing the price (min 10 chars)"
                            error={errors.reason}
                        >
                            <textarea
                                value={data.reason}
                                onChange={(e) => setData('reason', e.target.value)}
                                maxLength={500}
                                rows={3}
                                placeholder="Example: Annual price review, INZ fee increase, competitive adjustment..."
                                className={inputClass(errors.reason)}
                            />
                        </Field>
                    )}

                    <Divider>Additional details</Divider>

                    <Field label="Estimated time to complete form" hint="Shown on the visa chooser" error={errors.estimated_minutes}>
                        <div className="relative">
                            <input
                                type="number"
                                min="5"
                                max="60"
                                value={data.estimated_minutes}
                                onChange={(e) => setData('estimated_minutes', e.target.value)}
                                className={inputClass(errors.estimated_minutes, 'pr-20')}
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

                    {canViewHistory && (
                        <div>
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
                </form>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
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

function Field({ label, hint, required, error, children }) {
    return (
        <div>
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
        <div className="border-t border-gray-100 pt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">{children}</p>
        </div>
    );
}

const inputClass = (error, extra = '') =>
    `w-full rounded-xl border ${error ? 'border-red-300' : 'border-gray-200'} px-3 py-2 text-sm focus:outline-none focus:border-gray-900 ${extra}`;
