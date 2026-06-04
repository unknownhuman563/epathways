import React from 'react';
import { Check } from 'lucide-react';

// Shared 10-step stepper used by ResidentIntakePage (steps 1-9) and the
// post-submit Pay page (10). Booking happens on its own page after payment
// — it's intentionally NOT part of the stepper because the form journey is
// considered complete at "Payment". Stays purely visual — navigation is
// controlled by the parent via `onStepClick` (omit to make circles
// non-clickable, e.g. once payment is final).
const ALL_STEPS = [
    { id: 1,  title: 'Terms' },
    { id: 2,  title: 'Personal' },
    { id: 3,  title: 'Passport & Visa' },
    { id: 4,  title: 'Employment' },
    { id: 5,  title: 'Qualifications' },
    { id: 6,  title: 'Experience' },
    { id: 7,  title: 'English & Family' },
    { id: 8,  title: 'Documents' },
    { id: 9,  title: 'Additional Info' },
    { id: 10, title: 'Payment' },
];

export default function ResidentIntakeStepper({
    currentStep,
    completedSteps = [],     // ids of steps marked as completed (checkmark)
    onStepClick,             // (id) => void; omit for non-interactive display
    steps = ALL_STEPS,
}) {
    const completedSet = new Set(completedSteps);

    return (
        <div className="overflow-x-auto pb-2 -mx-2 px-2">
            <div className="min-w-[820px]">
                <ol className="flex items-start justify-between">
                    {steps.map((s, idx) => {
                        const isActive = currentStep === s.id;
                        const isCompleted = !isActive && completedSet.has(s.id);
                        const isLast = idx === steps.length - 1;
                        const clickable = !!onStepClick;
                        return (
                            <React.Fragment key={s.id}>
                                <li className="flex flex-col items-center w-20 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={clickable ? () => onStepClick(s.id) : undefined}
                                        disabled={!clickable}
                                        className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors ${
                                            isCompleted
                                                ? `bg-[#00A693] text-white ${clickable ? 'hover:bg-[#008c7c]' : ''}`
                                                : isActive
                                                    ? 'bg-white border-2 border-[#00A693] text-[#00A693]'
                                                    : `bg-white border border-gray-200 text-gray-400 ${clickable ? 'hover:border-gray-300' : ''}`
                                        } ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                                        aria-current={isActive ? 'step' : undefined}
                                    >
                                        {isCompleted ? <Check size={16} strokeWidth={3} /> : s.id}
                                    </button>
                                    <p className={`mt-2.5 text-[11px] leading-tight text-center px-1 transition-colors ${
                                        isActive
                                            ? 'text-[#282728] font-semibold'
                                            : isCompleted
                                                ? 'text-[#00A693] font-medium'
                                                : 'text-gray-400'
                                    }`}>
                                        {s.title}
                                    </p>
                                </li>
                                {!isLast && (
                                    <li
                                        aria-hidden="true"
                                        className={`flex-1 h-px mt-[18px] transition-colors ${
                                            isCompleted ? 'bg-[#00A693]' : 'bg-gray-200'
                                        }`}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </ol>
            </div>
        </div>
    );
}
