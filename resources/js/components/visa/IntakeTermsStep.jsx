import React from 'react';

/**
 * Shared Privacy & Terms step rendered as the first step of every visa
 * intake (Work / Student / Visitor) — mirrors the Resident form's StepTerms
 * so the four visa intakes feel like one product.
 *
 * Props:
 *   visaLabel  — short label used in the opening sentence
 *                ("This <visa> intake form collects ...").
 *   accepted   — boolean, bound to the form's `terms_accepted` field.
 *   onAccept   — setter for terms_accepted.
 *   error      — server / client validation message if the box isn't ticked.
 */
export default function IntakeTermsStep({
    visaLabel = 'visa',
    accepted = false,
    onAccept,
    error = '',
}) {
    return (
        <div className="space-y-7">
            <div>
                <h2 className="text-2xl font-black text-[#282728] tracking-tight">
                    Privacy & Terms
                </h2>
                <p className="text-[13px] text-gray-500 mt-1">
                    Please read before continuing.
                </p>
            </div>

            <div className="bg-gray-50/70 rounded-2xl p-6 text-sm text-gray-600 leading-[1.85] h-72 overflow-y-auto border border-gray-100 space-y-3">
                <p>
                    This {visaLabel} intake form collects the information our
                    licensed advisers need to assess your eligibility prior to
                    engagement.
                </p>
                <p>
                    Information you provide will be held in confidence and used
                    only to prepare your engagement agreement and assess your
                    visa pathway.
                </p>
                <p>
                    Submitting this form does not constitute legal advice or an
                    engagement. A formal engagement agreement will be issued upon
                    review.
                </p>
                <p>
                    All data is handled in line with our Privacy Policy and IAA
                    Code of Conduct.
                </p>
            </div>

            <label
                className={`flex items-start gap-3 p-3 cursor-pointer rounded-xl transition-all ${
                    error ? 'bg-red-50 ring-2 ring-red-500/20' : 'hover:bg-gray-50'
                }`}
            >
                <input
                    type="checkbox"
                    className={`mt-0.5 w-5 h-5 rounded ${
                        error ? 'border-red-500' : 'border-gray-300'
                    } text-[#00A693] focus:ring-[#00A693] cursor-pointer flex-shrink-0`}
                    checked={!!accepted}
                    onChange={(e) => onAccept?.(e.target.checked)}
                />
                <span
                    className={`text-sm font-semibold leading-relaxed ${
                        error ? 'text-red-600' : 'text-[#282728]'
                    }`}
                >
                    I have read and agree to the intake terms{' '}
                    <span className="text-red-500">*</span>
                </span>
            </label>
            {error && (
                <p className="text-xs text-red-500 -mt-3 pl-3">{error}</p>
            )}
        </div>
    );
}
