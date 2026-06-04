import React, { useState, useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import IntakeFormShell from '@/components/visa/IntakeFormShell';
import IntakeConfirmModal from '@/components/visa/IntakeConfirmModal';
import IntakeSuccessModal from '@/components/visa/IntakeSuccessModal';
import IntakeTermsStep from '@/components/visa/IntakeTermsStep';
import {
    Field, TextField, TextareaField, DateField, SelectField, YesNoField, FieldGrid, SectionTitle,
} from '@/components/visa/IntakeFields';

const PARTNERSHIP = ['Single', 'Married', 'Partnership', 'Divorced', 'Widowed', 'Separated'];
const DRAFT_KEY = 'epathways_work_intake_draft';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Server can reject any field, not just the required-by-client ones. This
// map sends the applicant straight to whichever step holds the bad field.
// Step 1 is the shared Privacy & Terms step; all real form fields start at
// step 2 and onward.
const FIELD_TO_STEP = {
    terms_accepted: 1,
    family_name: 2, first_name: 2, other_names: 2, gender: 2, dob: 2,
    country_of_birth: 2, place_of_birth: 2, current_address: 2, email: 2, phone: 2,
    country_of_citizenship: 2, other_citizenships: 2, national_id: 2, partnership_status: 2,
    current_country: 3, previous_nz_visa: 3, previous_nz_visa_details: 3, previous_nzeta: 3,
    australian_pr: 3, travelled_nz: 3, last_nz_departure: 3, over_24_months: 3,
    employer_name: 4, employer_is_family: 4, employer_family_relation: 4, self_employed: 4,
    job_start_date: 4, hourly_rate: 4, supports_dependent_children: 4,
    character_convicted: 5, character_investigation: 5, character_deported: 5,
    character_visa_refused: 5, lived_other_country_5y: 5, lived_other_country_details: 5,
    health_tb: 5, health_renal: 5, health_hospital: 5, health_residential: 5, health_pregnant: 5,
    currently_working: 6, current_job_title: 6, current_job_duties: 6,
    current_job_start: 6, current_job_country: 6, current_job_region: 6,
    current_employer_name: 6, current_employer_address: 6,
    current_employer_phone: 6, current_employer_email: 6,
    military_compulsory: 7, military_undertaken: 7, military_details: 7,
    travelled_internationally: 7,
    declaration_accepted: 8, signature_name: 8, signature_date: 8,
};

const FIELD_LABELS = {
    family_name: 'Family name', first_name: 'First name', dob: 'Date of birth',
    email: 'Email', phone: 'Phone', country_of_citizenship: 'Country of citizenship',
    employer_name: 'Employer name', employer_is_family: 'Employer family question',
    job_start_date: 'Job start date', hourly_rate: 'Hourly rate',
    declaration_accepted: 'Declaration',
};

function loadDraft() {
    try {
        const raw = window.localStorage.getItem(DRAFT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

export default function WorkInterestPage() {
    const draft = loadDraft();
    const { data, setData, post, processing, errors: serverErrors } = useForm({
        family_name: '', first_name: '', other_names: '', gender: '', dob: '',
        country_of_birth: '', place_of_birth: '', current_address: '',
        email: '', phone: '', country_of_citizenship: '', other_citizenships: '',
        national_id: '', partnership_status: '',

        current_country: '', previous_nz_visa: '', previous_nz_visa_details: '',
        previous_nzeta: '', australian_pr: '', travelled_nz: '', last_nz_departure: '',
        over_24_months: '',

        employer_name: '', employer_is_family: '', employer_family_relation: '',
        self_employed: '', job_start_date: '', hourly_rate: '',
        supports_dependent_children: '',

        character_convicted: '', character_investigation: '', character_deported: '',
        character_visa_refused: '', lived_other_country_5y: '', lived_other_country_details: '',

        health_tb: '', health_renal: '', health_hospital: '', health_residential: '', health_pregnant: '',

        currently_working: '', current_job_title: '', current_job_duties: '',
        current_job_start: '', current_job_country: '', current_job_region: '',
        current_employer_name: '', current_employer_address: '',
        current_employer_phone: '', current_employer_email: '',

        previous_roles: [],
        family_members: [],
        has_nz_contacts: '', nz_contacts: [],

        military_compulsory: '', military_undertaken: '', military_details: '',

        travelled_internationally: '', travel_trips: [],

        declaration_accepted: false, signature_name: '', signature_date: '',
        // Privacy & Terms — gated by step 1.
        terms_accepted: false,
        // Restored values from any previously-saved local draft. Spread last
        // so they override the empty defaults above.
        ...(draft || {}),
    });

    const [step, setStep] = useState(1);
    const [localErrors, setLocalErrors] = useState({});
    const [showConfirm, setShowConfirm] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Persistent post-submit modal — driven by the controller's
    // `intake_submitted` flash, not auto-dismissed.
    const { flash } = usePage().props;
    useEffect(() => {
        if (flash?.intake_submitted) {
            setShowSuccess(true);
            try { window.localStorage.removeItem(DRAFT_KEY); } catch {}
        }
    }, [flash?.intake_submitted]);
    // Steps the user has actually opened. The stepper only paints a checkmark
    // for a step the user has visited AND whose required fields validate —
    // matches the resident-intake behaviour where skipping forward leaves the
    // step number visible, not a misleading "done" tick.
    const [visitedSteps, setVisitedSteps] = useState(() => new Set([1]));
    useEffect(() => {
        setVisitedSteps((prev) => {
            if (prev.has(step)) return prev;
            const next = new Set(prev);
            next.add(step);
            return next;
        });
    }, [step]);
    // Merged so existing `error={errors.foo}` calls show whichever is set
    // (server validation messages override our client-side ones).
    const errors = { ...localErrors, ...serverErrors };

    useEffect(() => {
        if (draft) toast.success('Restored your saved draft.', { duration: 3000 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Per-step required-field validation. Each step returns a {key: msg} map
    // of fields that aren't acceptable yet. Optional/visa-specific fields
    // are intentionally NOT here — submit-time validation only flags fields
    // the applicant has to fill out before we can even create the assessment.
    const validateStep = (n) => {
        const errs = {};
        switch (n) {
            case 1:
                if (!data.terms_accepted) errs.terms_accepted = 'Please accept the terms to continue';
                break;
            case 2:
                if (!data.family_name?.trim()) errs.family_name = 'Family name is required';
                if (!data.first_name?.trim()) errs.first_name = 'First name is required';
                if (!data.dob) errs.dob = 'Date of birth is required';
                if (!data.email?.trim()) errs.email = 'Email is required';
                else if (!EMAIL_RE.test(data.email)) errs.email = 'Enter a valid email address';
                if (!data.phone?.trim()) errs.phone = 'Contact number is required';
                if (!data.country_of_citizenship?.trim()) errs.country_of_citizenship = 'Country of citizenship is required';
                break;
            case 3:
                if (!data.travelled_nz) errs.travelled_nz = 'Please answer';
                if (!data.over_24_months) errs.over_24_months = 'Please answer';
                break;
            case 4:
                if (!data.employer_name?.trim()) errs.employer_name = 'Employer name is required';
                if (!data.employer_is_family) errs.employer_is_family = 'Please answer';
                if (!data.job_start_date) errs.job_start_date = 'Start date is required';
                if (data.hourly_rate === '' || data.hourly_rate === null) errs.hourly_rate = 'Hourly rate is required';
                break;
            case 5:
                ['character_convicted','character_investigation','character_deported','character_visa_refused','lived_other_country_5y'].forEach((k) => {
                    if (!data[k]) errs[k] = 'Please answer';
                });
                ['health_tb','health_renal','health_hospital','health_residential'].forEach((k) => {
                    if (!data[k]) errs[k] = 'Please answer';
                });
                break;
            case 6:
                if (!data.currently_working) errs.currently_working = 'Please answer';
                break;
            case 7:
                if (!data.military_compulsory) errs.military_compulsory = 'Please answer';
                if (!data.military_undertaken) errs.military_undertaken = 'Please answer';
                if (!data.travelled_internationally) errs.travelled_internationally = 'Please answer';
                break;
            case 8:
                if (!data.declaration_accepted) errs.declaration_accepted = 'You must accept the declaration to continue';
                break;
        }
        return errs;
    };

    const set = (k) => (v) => setData(k, v);

    // Submit click → walk every step, jump to the first invalid one and show
    // inline errors there. Only when everything passes do we open the review
    // modal — the actual POST happens in confirmSubmit.
    const submit = () => {
        const aggregated = {};
        let firstInvalid = null;
        for (let n = 1; n <= 8; n++) {
            const errs = validateStep(n);
            if (Object.keys(errs).length && firstInvalid === null) firstInvalid = n;
            Object.assign(aggregated, errs);
        }
        if (firstInvalid !== null) {
            setLocalErrors(aggregated);
            setStep(firstInvalid);
            toast.error(`Some fields in Step ${firstInvalid} need your attention.`);
            return;
        }
        setLocalErrors({});
        setShowConfirm(true);
    };

    const confirmSubmit = () => {
        post('/work-interest', {
            onSuccess: () => {
                setShowConfirm(false);
                try { window.localStorage.removeItem(DRAFT_KEY); } catch {}
            },
            onError: (errs) => {
                setShowConfirm(false);
                const badKeys = Object.keys(errs);
                let firstInvalid = null;
                for (const k of badKeys) {
                    const stepNum = FIELD_TO_STEP[k];
                    if (stepNum && (firstInvalid === null || stepNum < firstInvalid)) {
                        firstInvalid = stepNum;
                    }
                }
                if (firstInvalid) setStep(firstInvalid);
                setLocalErrors(errs);
                const labels = badKeys
                    .slice(0, 3)
                    .map((k) => FIELD_LABELS[k] || k.replace(/_/g, ' '))
                    .join(', ');
                const more = badKeys.length > 3 ? ` (+${badKeys.length - 3} more)` : '';
                toast.error(
                    firstInvalid
                        ? `Step ${firstInvalid} needs attention — ${labels}${more}.`
                        : `Please fix: ${labels}${more}.`
                );
            },
        });
    };

    // Clean local errors live as fields are filled, so users get instant
    // feedback on the inline red text disappearing.
    useEffect(() => {
        if (Object.keys(localErrors).length === 0) return;
        const fresh = {};
        for (let n = 1; n <= 8; n++) Object.assign(fresh, validateStep(n));
        const next = {};
        let changed = false;
        for (const k of Object.keys(localErrors)) {
            if (fresh[k]) next[k] = fresh[k];
            else changed = true;
        }
        if (changed) setLocalErrors(next);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    const steps = [
        {
            title: 'Terms',
            render: () => (
                <IntakeTermsStep
                    visaLabel="Work Visa (AEWV)"
                    accepted={data.terms_accepted}
                    onAccept={set('terms_accepted')}
                    error={errors.terms_accepted}
                />
            ),
        },
        {
            title: 'Identity',
            render: () => (
                <>
                    <SectionTitle title="Identity" subtitle="Write N/A if a field doesn't apply." />
                    <FieldGrid>
                        <TextField label="Family name" value={data.family_name} onChange={set('family_name')} required error={errors.family_name} />
                        <TextField label="First name" value={data.first_name} onChange={set('first_name')} required error={errors.first_name} />
                        <TextField label="Other names used" value={data.other_names} onChange={set('other_names')} hint="If Yes, list all" />
                        <SelectField label="Gender" value={data.gender} onChange={set('gender')} options={['Female', 'Male', 'Other', 'Prefer not to say']} />
                        <DateField label="Date of birth" value={data.dob} onChange={set('dob')} required error={errors.dob} />
                        <TextField label="Country of birth" value={data.country_of_birth} onChange={set('country_of_birth')} />
                        <TextField label="Place of birth (town/city)" value={data.place_of_birth} onChange={set('place_of_birth')} />
                        <TextField label="Country of citizenship" value={data.country_of_citizenship} onChange={set('country_of_citizenship')} />
                        <TextField label="Other citizenships" value={data.other_citizenships} onChange={set('other_citizenships')} />
                        <TextField label="National ID number" value={data.national_id} onChange={set('national_id')} hint="If applicable" />
                        <SelectField label="Partnership status" value={data.partnership_status} onChange={set('partnership_status')} options={PARTNERSHIP} />
                    </FieldGrid>
                    <div className="mt-4">
                        <TextareaField label="Current physical address" value={data.current_address} onChange={set('current_address')} placeholder="Room no., building no., street, suburb, city, postcode, country" />
                    </div>
                    <FieldGrid>
                        <TextField label="Email address" type="email" value={data.email} onChange={set('email')} required error={errors.email} />
                        <TextField label="Contact number" value={data.phone} onChange={set('phone')} required hint="Include country code, e.g. +63 912 345 6789" error={errors.phone} />
                    </FieldGrid>
                </>
            ),
        },
        {
            title: 'NZ Immigration',
            render: () => (
                <>
                    <SectionTitle title="New Zealand Immigration History" />
                    <FieldGrid>
                        <TextField label="Country you'll be in when this application is submitted" value={data.current_country} onChange={set('current_country')} />
                        <YesNoField label="Previously applied for a NZ visa?" value={data.previous_nz_visa} onChange={set('previous_nz_visa')} />
                        <YesNoField label="Previously requested an NZeTA?" value={data.previous_nzeta} onChange={set('previous_nzeta')} />
                        <YesNoField label="Hold an Australian Permanent Resident Visa?" value={data.australian_pr} onChange={set('australian_pr')} />
                        <YesNoField label="Have you ever travelled to New Zealand?" value={data.travelled_nz} onChange={set('travelled_nz')} error={errors.travelled_nz} />
                        <DateField label="If Yes, when did you last leave NZ?" value={data.last_nz_departure} onChange={set('last_nz_departure')} />
                        <YesNoField label="Will your total time in NZ for all visits equal 24 months or more?" value={data.over_24_months} onChange={set('over_24_months')} error={errors.over_24_months} />
                    </FieldGrid>
                    {data.previous_nz_visa === 'Yes' && (
                        <div className="mt-4">
                            <TextareaField label="Previous NZ visa details" value={data.previous_nz_visa_details} onChange={set('previous_nz_visa_details')} />
                        </div>
                    )}
                </>
            ),
        },
        {
            title: 'NZ Employer',
            render: () => (
                <>
                    <SectionTitle title="New Zealand Employer Details" />
                    <FieldGrid>
                        <TextField label="Employer name" value={data.employer_name} onChange={set('employer_name')} required error={errors.employer_name} />
                        <YesNoField label="Is your employer a family member?" value={data.employer_is_family} onChange={set('employer_is_family')} error={errors.employer_is_family} />
                        {data.employer_is_family === 'Yes' && (
                            <TextField label="Relationship" value={data.employer_family_relation} onChange={set('employer_family_relation')} />
                        )}
                        <YesNoField label="Will you be self-employed?" value={data.self_employed} onChange={set('self_employed')} />
                        <DateField label="Date job is available / work starts" value={data.job_start_date} onChange={set('job_start_date')} required error={errors.job_start_date} />
                        <TextField label="Minimum hourly rate of pay (NZD)" type="number" value={data.hourly_rate} onChange={set('hourly_rate')} hint="e.g. 29.66" required error={errors.hourly_rate} />
                        <YesNoField label="Do you intend to support any dependent children on a visitor/student visa?" value={data.supports_dependent_children} onChange={set('supports_dependent_children')} />
                    </FieldGrid>
                </>
            ),
        },
        {
            title: 'Character & Health',
            render: () => (
                <>
                    <SectionTitle title="Character Details" />
                    <FieldGrid>
                        <YesNoField label="Convicted of any offence (incl. driving)?" value={data.character_convicted} onChange={set('character_convicted')} error={errors.character_convicted} />
                        <YesNoField label="Under investigation or facing charges anywhere?" value={data.character_investigation} onChange={set('character_investigation')} error={errors.character_investigation} />
                        <YesNoField label="Ever expelled, deported or refused entry?" value={data.character_deported} onChange={set('character_deported')} error={errors.character_deported} />
                        <YesNoField label="Ever refused a visa by any country (excl. NZ)?" value={data.character_visa_refused} onChange={set('character_visa_refused')} error={errors.character_visa_refused} />
                        <YesNoField label="Lived in any country 5+ yrs since age 17 (excl. citizenship)?" value={data.lived_other_country_5y} onChange={set('lived_other_country_5y')} error={errors.lived_other_country_5y} />
                    </FieldGrid>
                    {data.lived_other_country_5y === 'Yes' && (
                        <div className="mt-4">
                            <TextareaField label="Country and years" value={data.lived_other_country_details} onChange={set('lived_other_country_details')} />
                        </div>
                    )}
                    <div className="mt-8">
                        <SectionTitle title="Health Details" />
                        <FieldGrid>
                            <YesNoField label="Do you have tuberculosis?" value={data.health_tb} onChange={set('health_tb')} error={errors.health_tb} />
                            <YesNoField label="Receiving renal dialysis?" value={data.health_renal} onChange={set('health_renal')} error={errors.health_renal} />
                            <YesNoField label="Receiving hospital care?" value={data.health_hospital} onChange={set('health_hospital')} error={errors.health_hospital} />
                            <YesNoField label="Receiving residential care?" value={data.health_residential} onChange={set('health_residential')} error={errors.health_residential} />
                            <YesNoField label="Are you pregnant?" value={data.health_pregnant} onChange={set('health_pregnant')} />
                        </FieldGrid>
                    </div>
                </>
            ),
        },
        {
            title: 'Employment',
            render: () => (
                <>
                    <SectionTitle title="Current Employment" subtitle="Use the previous-roles step for prior roles." />
                    <FieldGrid>
                        <YesNoField label="Are you currently working?" value={data.currently_working} onChange={set('currently_working')} error={errors.currently_working} />
                        <TextField label="Job position / title" value={data.current_job_title} onChange={set('current_job_title')} />
                        <DateField label="Start date" value={data.current_job_start} onChange={set('current_job_start')} />
                        <TextField label="Country of work" value={data.current_job_country} onChange={set('current_job_country')} />
                        <TextField label="Region of work" value={data.current_job_region} onChange={set('current_job_region')} />
                        <TextField label="Name of organisation" value={data.current_employer_name} onChange={set('current_employer_name')} />
                        <TextField label="Employer phone" value={data.current_employer_phone} onChange={set('current_employer_phone')} />
                        <TextField label="Employer email" type="email" value={data.current_employer_email} onChange={set('current_employer_email')} />
                    </FieldGrid>
                    <div className="mt-4">
                        <TextareaField label="Detailed job duties" value={data.current_job_duties} onChange={set('current_job_duties')} placeholder="Describe your main responsibilities." />
                        <div className="mt-4">
                            <TextareaField label="Employer address" value={data.current_employer_address} onChange={set('current_employer_address')} />
                        </div>
                    </div>
                </>
            ),
        },
        {
            title: 'Travel & Military',
            render: () => (
                <>
                    <SectionTitle title="Military Service" />
                    <FieldGrid>
                        <YesNoField label="Was military service compulsory in your home country?" value={data.military_compulsory} onChange={set('military_compulsory')} error={errors.military_compulsory} />
                        <YesNoField label="Have you ever undertaken military service?" value={data.military_undertaken} onChange={set('military_undertaken')} error={errors.military_undertaken} />
                    </FieldGrid>
                    {data.military_undertaken === 'Yes' && (
                        <div className="mt-4">
                            <TextareaField label="Military service details" value={data.military_details} onChange={set('military_details')} />
                        </div>
                    )}
                    <div className="mt-8">
                        <SectionTitle title="Travel History" subtitle="International travel in the last 5 years (excl. NZ)." />
                        <YesNoField label="Have you ever travelled internationally (excl. NZ)?" value={data.travelled_internationally} onChange={set('travelled_internationally')} error={errors.travelled_internationally} />
                    </div>
                </>
            ),
        },
        {
            title: 'Declaration',
            render: () => (
                <>
                    <SectionTitle title="Declaration" />
                    <div className="bg-gray-50/60 border border-gray-100 rounded-2xl p-6 text-sm text-gray-600 leading-relaxed">
                        <p className="font-bold text-[#282728] mb-2">
                            I declare that the information I have provided above is true, correct and complete.
                        </p>
                        <p>
                            I understand that I must inform Immigration New Zealand of any relevant change of
                            circumstances that may affect the decision on my application. Providing false or
                            misleading information may result in my application being declined, removal from
                            New Zealand, or prosecution under the Immigration Act 2009.
                        </p>
                    </div>
                    <label className="flex items-start gap-3 mt-6 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.declaration_accepted}
                            onChange={(e) => setData('declaration_accepted', e.target.checked)}
                            className="mt-1 w-4 h-4"
                        />
                        <span className="text-sm font-semibold text-[#282728]">
                            I confirm the above and accept the declaration.
                        </span>
                    </label>
                    {errors.declaration_accepted && (
                        <p className="text-[11px] text-red-500 mt-1 ml-7">{errors.declaration_accepted}</p>
                    )}
                    <FieldGrid>
                        <TextField label="Applicant's name (printed)" value={data.signature_name} onChange={set('signature_name')} />
                        <DateField label="Date" value={data.signature_date} onChange={set('signature_date')} />
                    </FieldGrid>
                </>
            ),
        },
    ];

    return (
        <>
            <IntakeFormShell
                title="Work Visa (AEWV) — Applicant Information"
                visaLabel="AEWV — Work"
                steps={steps}
                onSubmit={submit}
                processing={processing}
                submitLabel="Submit"
                data={data}
                draftKey={DRAFT_KEY}
                step={step}
                setStep={setStep}
                visitedSteps={visitedSteps}
                validateStep={validateStep}
            />
            <IntakeConfirmModal
                open={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={confirmSubmit}
                processing={processing}
                visaLabel="Work Visa (AEWV)"
                submitLabel="Submit intake"
                summaryItems={[
                    ['Name', `${data.first_name} ${data.family_name}`.trim()],
                    ['Email', data.email],
                    ['Phone', data.phone],
                    ['Employer', data.employer_name],
                    ['Job starts', data.job_start_date],
                ]}
            />
            <IntakeSuccessModal
                open={showSuccess}
                onClose={() => setShowSuccess(false)}
                visaLabel={flash?.intake_submitted || 'Work Visa (AEWV)'}
            />
        </>
    );
}
