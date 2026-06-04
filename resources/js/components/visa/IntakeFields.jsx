import React from 'react';

// Shared form-field primitives used by the Work / Student / Visitor intake
// pages. Each one renders a labelled input with consistent styling and an
// optional helper hint + error message slot.

// Labels use sentence case as written in each form (not uppercase) — easier
// to read at a glance, especially for long Yes/No questions.
const labelCls = 'block text-[13px] font-semibold text-gray-700 mb-2';
const baseInputCls = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--accent,#00A693)] transition-colors bg-white';

export function Field({ label, hint, error, children }) {
    return (
        <div>
            <label className={labelCls}>{label}</label>
            {children}
            {hint && !error && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
            {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
        </div>
    );
}

export function TextField({ label, hint, error, value, onChange, placeholder, required = false, type = 'text' }) {
    return (
        <Field label={`${label}${required ? ' *' : ''}`} hint={hint} error={error}>
            <input
                type={type}
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={baseInputCls}
            />
        </Field>
    );
}

export function TextareaField({ label, hint, error, value, onChange, placeholder, rows = 3 }) {
    return (
        <Field label={label} hint={hint} error={error}>
            <textarea
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className={baseInputCls}
            />
        </Field>
    );
}

export function DateField({ label, hint, error, value, onChange, required = false }) {
    return (
        <Field label={`${label}${required ? ' *' : ''}`} hint={hint || 'DD/MM/YYYY'} error={error}>
            <input
                type="date"
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                className={baseInputCls}
            />
        </Field>
    );
}

export function SelectField({ label, hint, error, value, onChange, options, required = false }) {
    return (
        <Field label={`${label}${required ? ' *' : ''}`} hint={hint} error={error}>
            <select
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                className={baseInputCls}
            >
                <option value="">— Select —</option>
                {options.map((o) => (
                    <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
                        {typeof o === 'string' ? o : o.label}
                    </option>
                ))}
            </select>
        </Field>
    );
}

export function YesNoField({ label, hint, error, value, onChange }) {
    return (
        <Field label={label} hint={hint} error={error}>
            <div className="flex gap-2">
                {['Yes', 'No'].map((opt) => {
                    const active = value === opt;
                    return (
                        <button
                            type="button"
                            key={opt}
                            onClick={() => onChange(opt)}
                            className={`flex-1 px-4 py-3 rounded-xl border text-sm font-bold transition-colors ${
                                active
                                    ? 'bg-[var(--accent,#00A693)] border-[var(--accent,#00A693)] text-white'
                                    : 'bg-white border-gray-200 text-[#282728] hover:border-[var(--accent,#00A693)]'
                            }`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </Field>
    );
}

export function FieldGrid({ children, cols = 2 }) {
    const colCls = cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2';
    return (
        <div className={`grid grid-cols-1 ${colCls} gap-4`}>
            {children}
        </div>
    );
}

export function SectionTitle({ title, subtitle }) {
    return (
        <div className="mb-6">
            <h3 className="text-xl font-black tracking-tight text-[#282728]">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
    );
}
