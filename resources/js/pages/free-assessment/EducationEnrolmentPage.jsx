import React, { useState, useEffect, useRef } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { toast } from 'sonner';
import IntakeFormShell from '@/components/visa/IntakeFormShell';
import IntakeConfirmModal from '@/components/visa/IntakeConfirmModal';
import {
    StepTerms, StepPersonal, StepStudyPlans, StepEducation, StepWork,
    StepFinancial, StepSourceOfFunds, StepImmigration, StepCharacterHealth,
    StepFamily, StepAdditional, StepDeclaration, SuccessMessage,
} from './FreeAssessmentSteps';

// Education Enrolment — same 12-step assessment content as /free-assessment,
// rendered inside the visa-style IntakeFormShell so the look matches the
// Immigration / Student / Work / Visitor intakes. Accent is the ePathways
// Education green (#436235) rather than the immigration teal.
const ACCENT = '#436235';
const ACCENT_DARK = '#354d2a';
const DRAFT_KEY = 'epathways_education_enrolment_draft';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Maps every form field back to its step number — used to bounce the
// applicant to the right step when the server rejects a submission.
const step2Keys = ['first_name', 'last_name', 'email', 'phone', 'gender', 'marital_status', 'dob', 'country_of_birth', 'place_of_birth', 'citizenship', 'residence_city', 'residence_state', 'residence_country', 'has_passport', 'passport_number', 'passport_expiry', 'passport_pdf', 'has_other_names', 'other_names'];
const keyToStepNumber = (key) => {
    if (key === 'terms_accepted') return 1;
    if (step2Keys.includes(key)) return 2;
    if (key.startsWith('study_plans')) return 3;
    if (key.startsWith('education_background') || key.startsWith('high_school') || key.startsWith('education_docs') || key === 'has_gap' || key.startsWith('gap_')) return 4;
    if (key.startsWith('work_experience')) return 5;
    if (key.startsWith('financial_info')) return 6;
    if (key.startsWith('source_of_funds_info')) return 7;
    if (key.startsWith('immigration_info')) return 8;
    if (key.startsWith('character_info') || key.startsWith('health_info')) return 9;
    if (key.startsWith('family_info')) return 10;
    if (key.startsWith('nz_contacts_info') || key.startsWith('military_info') || key.startsWith('home_ties_info')) return 11;
    if (key === 'declaration_accepted') return 12;
    return null;
};

function loadDraft() {
    try {
        const raw = window.localStorage.getItem(DRAFT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

// Walks the form data tree and writes it into a FormData object using
// PHP's bracket notation (foo[bar]=…, foo[0][bar]=…). Mirrors what Inertia's
// `forceFormData: true` does so the controller's `study_plans.foo` /
// `education_background.0.bar` validators still receive the right shape.
function flattenToFormData(value, fd = new FormData(), prefix = '') {
    if (value === null || value === undefined) return fd;
    if (value instanceof File) { fd.append(prefix, value); return fd; }
    if (Array.isArray(value)) {
        value.forEach((item, i) => flattenToFormData(item, fd, `${prefix}[${i}]`));
        return fd;
    }
    if (typeof value === 'object') {
        for (const [k, v] of Object.entries(value)) {
            const next = prefix ? `${prefix}[${k}]` : k;
            flattenToFormData(v, fd, next);
        }
        return fd;
    }
    if (typeof value === 'boolean') { fd.append(prefix, value ? '1' : '0'); return fd; }
    fd.append(prefix, String(value));
    return fd;
}

export default function EducationEnrolment() {
    const { flash } = usePage().props;
    const draft = loadDraft();

    const { data, setData, post, processing, errors: serverErrors } = useForm({
        terms_accepted: false,
        // Personal
        first_name: '', last_name: '', has_other_names: '', other_names: '',
        gender: '', marital_status: '', phone: '', email: '', dob: '',
        country_of_birth: '', place_of_birth: '', citizenship: '',
        residence_city: '', residence_state: '', residence_country: '',
        has_passport: '', passport_number: '', passport_expiry: '', passport_pdf: null,
        // Study Plans
        study_plans: {
            preferred_course: '', qualification_level: '', preferred_city: '',
            preferred_intake: '', has_english_test: '', english_test_type: '',
            test_score_overall: '', test_score_reading: '', test_score_writing: '',
            test_score_listening: '', test_score_speaking: '', test_date: ''
        },
        // Education
        high_school_completed: '', high_school_level: '', high_school_institution: '',
        high_school_start: '', high_school_end: '', high_school_marks: '',
        education_background: [
            { level: 'Diploma',           field_of_study: '', institution: '', start_date: '', end_date: '', marks_percentage: '', completed: false },
            { level: "Bachelor's Degree", field_of_study: '', institution: '', start_date: '', end_date: '', marks_percentage: '', completed: false },
            { level: "Master's Degree",   field_of_study: '', institution: '', start_date: '', end_date: '', marks_percentage: '', completed: false },
            { level: 'Doctorate',         field_of_study: '', institution: '', start_date: '', end_date: '', marks_percentage: '', completed: false },
        ],
        education_docs: [],
        has_gap: '', gap_length: '', gap_activities: [], gap_explanation: '',
        // Work
        work_experience: [
            { company_name: '', job_title: '', start_date: '', end_date: '', is_current: '', duties: '', has_supporting_docs: '', supporting_docs: [] }
        ],
        // Financial
        financial_info: {
            can_cover_tuition: '', can_cover_living: '', funding_source: [],
            estimated_budget: '', has_sponsors: '', sponsor_relation: ''
        },
        // Source of funds
        source_of_funds_info: {
            sources: [], will_self_fund: '', student_financial_docs: [],
            will_use_sponsor: '', sponsor_relation: '', sponsor_nz_based: '',
            sponsor_nz_resident: '', sponsor_occupation: '', sponsor_employer: '',
            sponsor_annual_income: '', sponsor_source_of_funds: [],
            sponsor_financial_docs: [], sponsor_identity_docs: []
        },
        // Immigration
        immigration_info: {
            has_travelled_overseas: '', overseas_travel_details: '',
            has_applied_nz_visa: '', nz_visa_details: '',
            total_nz_time_24_months: '', has_applied_other_visa: '',
            other_visa_details: '', has_visa_refusal: '', visa_refusal_details: '',
            submission_country: ''
        },
        // Character & Health
        character_info: {
            has_conviction: '', under_investigation: '', has_deportation: '',
            has_visa_refusal_other: '', lived_5_years_since_17: ''
        },
        health_info: {
            has_tuberculosis: '', has_renal_dialysis: '', needs_hospital_care: '',
            needs_residential_care: '', is_pregnant: ''
        },
        // Family
        family_info: {
            members: [
                { relation: 'Father',  first_name: '', family_name: '', dob: '', partnership_status: '', country_of_residence: '', country_of_birth: '', occupation: '' },
                { relation: 'Mother',  first_name: '', family_name: '', dob: '', partnership_status: '', country_of_residence: '', country_of_birth: '', occupation: '' },
                { relation: 'Spouse',  first_name: '', family_name: '', dob: '', partnership_status: '', country_of_residence: '', country_of_birth: '', occupation: '' },
                { relation: 'Sibling', first_name: '', family_name: '', dob: '', partnership_status: '', country_of_residence: '', country_of_birth: '', occupation: '' },
                { relation: 'Child 1', first_name: '', family_name: '', dob: '', partnership_status: '', country_of_residence: '', country_of_birth: '', occupation: '' },
                { relation: 'Child 2', first_name: '', family_name: '', dob: '', partnership_status: '', country_of_residence: '', country_of_birth: '', occupation: '' },
            ]
        },
        // Additional
        nz_contacts_info: {
            has_nz_contacts: '', contact_first_name: '', contact_family_name: '',
            contact_relationship: '', contact_address: '', contact_number: ''
        },
        military_info: { military_compulsory: '', has_military_service: '' },
        home_ties_info: {
            family_owns_property: '', property_type: '', property_location: '',
            property_owner: '', family_owns_business: '', business_type: '',
            business_involvement: ''
        },
        // Declaration
        declaration_accepted: false,
        // Hydrate from saved draft last so it wins.
        ...(draft || {}),
    });

    const [step, setStep] = useState(1);
    const [localErrors, setLocalErrors] = useState({});
    const [showConfirm, setShowConfirm] = useState(false);
    const [visitedSteps, setVisitedSteps] = useState(() => new Set([1]));
    const [isSuccess, setIsSuccess] = useState(false);
    const [leadId, setLeadId] = useState(null);
    const errors = { ...localErrors, ...serverErrors };

    useEffect(() => {
        if (flash?.success) {
            setIsSuccess(true);
            if (flash?.lead_id) setLeadId(flash.lead_id);
            try { window.localStorage.removeItem(DRAFT_KEY); } catch {}
        }
    }, [flash]);

    useEffect(() => {
        setVisitedSteps((prev) => {
            if (prev.has(step)) return prev;
            const next = new Set(prev);
            next.add(step);
            return next;
        });
    }, [step]);

    useEffect(() => {
        if (draft) toast.success('Restored your saved draft.', { duration: 3000 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Validation per step — same essentials as /free-assessment. Anything
    // beyond the required minimum stays optional so the form doesn't gate
    // on every PDF-style "answer N/A" question.
    const validateStep = (n) => {
        const errs = {};
        switch (n) {
            case 1:
                if (!data.terms_accepted) errs.terms_accepted = 'You must accept the terms to continue';
                break;
            case 2:
                if (!data.first_name?.trim()) errs.first_name = 'First name is required';
                if (!data.last_name?.trim()) errs.last_name = 'Last name is required';
                if (!data.dob) errs.dob = 'Date of birth is required';
                if (!data.email?.trim()) errs.email = 'Email is required';
                else if (!EMAIL_RE.test(data.email)) errs.email = 'Enter a valid email address';
                if (!data.phone?.trim()) errs.phone = 'Phone is required';
                if (!data.gender) errs.gender = 'Gender is required';
                if (!data.country_of_birth?.trim()) errs.country_of_birth = 'Country of birth is required';
                if (!data.citizenship?.trim()) errs.citizenship = 'Citizenship is required';
                if (!data.residence_country?.trim()) errs.residence_country = 'Country of residence is required';
                break;
            case 3:
                if (!data.study_plans?.preferred_course?.trim()) errs['study_plans.preferred_course'] = 'Preferred course is required';
                if (!data.study_plans?.qualification_level) errs['study_plans.qualification_level'] = 'Qualification level is required';
                break;
            case 5:
                if (!Array.isArray(data.work_experience) || data.work_experience.length === 0) {
                    errs.work_experience = 'Add at least one work experience entry';
                } else {
                    if (!data.work_experience[0].company_name?.trim()) errs['work_experience.0.company_name'] = 'Company name is required';
                    if (!data.work_experience[0].job_title?.trim()) errs['work_experience.0.job_title'] = 'Job title is required';
                }
                break;
            case 6:
                if (!data.financial_info?.estimated_budget?.trim()) errs['financial_info.estimated_budget'] = 'Estimated budget is required';
                if (!Array.isArray(data.financial_info?.funding_source) || data.financial_info.funding_source.length === 0) {
                    errs['financial_info.funding_source'] = 'Pick at least one funding source';
                }
                break;
            case 7:
                if (!Array.isArray(data.source_of_funds_info?.sources) || data.source_of_funds_info.sources.length === 0) {
                    errs['source_of_funds_info.sources'] = 'Select at least one source of funds';
                }
                break;
            case 8:
                if (!data.immigration_info?.submission_country?.trim()) errs['immigration_info.submission_country'] = 'Country of submission is required';
                break;
            case 12:
                if (!data.declaration_accepted) errs.declaration_accepted = 'You must accept the declaration to continue';
                break;
        }
        return errs;
    };

    const submit = () => {
        const aggregated = {};
        let firstInvalid = null;
        for (let n = 1; n <= 12; n++) {
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
        post('/education-enrolment', {
            forceFormData: true,
            onSuccess: () => setShowConfirm(false),
            onError: (errs) => {
                setShowConfirm(false);
                const badKeys = Object.keys(errs);
                let firstInvalid = null;
                for (const k of badKeys) {
                    const stepNum = keyToStepNumber(k);
                    if (stepNum && (firstInvalid === null || stepNum < firstInvalid)) {
                        firstInvalid = stepNum;
                    }
                }
                if (firstInvalid) setStep(firstInvalid);
                setLocalErrors(errs);
                toast.error('Some fields need your attention — please review.');
            },
        });
    };

    useEffect(() => {
        if (Object.keys(localErrors).length === 0) return;
        const fresh = {};
        for (let n = 1; n <= 12; n++) Object.assign(fresh, validateStep(n));
        const next = {};
        let changed = false;
        for (const k of Object.keys(localErrors)) {
            if (fresh[k]) next[k] = fresh[k];
            else changed = true;
        }
        if (changed) setLocalErrors(next);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    if (isSuccess) return <SuccessMessage leadId={leadId} />;

    // Server-side draft save — posts the current form data to a controller
    // that creates (or updates by email) a Lead with status='Draft' so the
    // submission appears in the Education / Sales Assessments dashboard.
    // Falls back to a polite toast when the applicant hasn't entered enough
    // identifying info yet.
    const handleServerSaveDraft = (currentData) => {
        if (!currentData?.first_name?.trim() || !currentData?.email?.trim()) {
            toast.info('Draft saved on this device. Add your name + email to also save it to our team.');
            return;
        }
        router.post('/education-enrolment/draft', currentData, {
            preserveScroll: true,
            preserveState: true,
            forceFormData: true,
            onSuccess: () => toast.success('Draft saved to your account.'),
            onError: (errs) => {
                const first = Object.values(errs || {})[0];
                toast.error(first || 'Could not save draft.');
            },
        });
    };

    // ── Silent auto-save ───────────────────────────────────────────────────
    // Every few seconds after the applicant edits the form, quietly POST the
    // current data so a lead row is created server-side. This means even if
    // they close the tab without clicking "Save draft", the team can still
    // see their progress in the Assessments dashboard and reach out.
    //
    // Guarded so it only fires once first_name + a valid email are filled —
    // those are the minimum the controller needs to dedupe the lead row.
    const autoSaveRef = useRef({ inFlight: false, lastHash: '' });
    const [autoSavedAt, setAutoSavedAt] = useState(null);
    useEffect(() => {
        const okName  = data.first_name?.trim();
        const okEmail = data.email?.trim() && EMAIL_RE.test(data.email);
        if (!okName || !okEmail) return;

        // Skip if nothing meaningful has changed since the last save —
        // hashing the JSON is cheap and avoids redundant network traffic.
        const hash = (() => {
            try { return JSON.stringify({ ...data, passport_pdf: undefined }); }
            catch { return Math.random().toString(); }
        })();
        if (hash === autoSaveRef.current.lastHash) return;

        const t = setTimeout(async () => {
            if (autoSaveRef.current.inFlight) return;
            autoSaveRef.current.inFlight = true;
            try {
                const fd = flattenToFormData(data);
                const csrf = document.querySelector('meta[name="csrf-token"]')?.content || '';
                const res = await fetch('/education-enrolment/draft', {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN':     csrf,
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept':           'application/json',
                    },
                    body: fd,
                    credentials: 'same-origin',
                });
                if (res.ok) {
                    autoSaveRef.current.lastHash = hash;
                    setAutoSavedAt(Date.now());
                }
            } catch { /* silent — user didn't ask for this, don't bother them */ }
            finally { autoSaveRef.current.inFlight = false; }
        }, 4000); // 4s debounce so we don't spam during fast typing

        return () => clearTimeout(t);
    }, [data]);

    const steps = [
        { title: 'Terms',        render: () => <StepTerms          data={data} setData={setData} errors={errors} /> },
        { title: 'Personal',     render: () => <StepPersonal       data={data} setData={setData} errors={errors} /> },
        { title: 'Study Plans',  render: () => <StepStudyPlans     data={data} setData={setData} errors={errors} /> },
        { title: 'Education',    render: () => <StepEducation      data={data} setData={setData} errors={errors} /> },
        { title: 'Work',         render: () => <StepWork           data={data} setData={setData} errors={errors} /> },
        { title: 'Financial',    render: () => <StepFinancial      data={data} setData={setData} errors={errors} /> },
        { title: 'Funds',        render: () => <StepSourceOfFunds  data={data} setData={setData} errors={errors} /> },
        { title: 'Immigration',  render: () => <StepImmigration    data={data} setData={setData} errors={errors} /> },
        { title: 'Character',    render: () => <StepCharacterHealth data={data} setData={setData} errors={errors} /> },
        { title: 'Family',       render: () => <StepFamily         data={data} setData={setData} errors={errors} /> },
        { title: 'Additional',   render: () => <StepAdditional     data={data} setData={setData} errors={errors} /> },
        { title: 'Declaration',  render: () => <StepDeclaration    data={data} setData={setData} errors={errors} /> },
    ];

    // Rolling "Auto-saved Xs ago" label — recomputed every 15s so it
    // stays accurate without re-rendering the whole shell on every tick.
    const [autoSavedLabel, setAutoSavedLabel] = useState('');
    useEffect(() => {
        if (!autoSavedAt) return;
        const tick = () => {
            const secs = Math.floor((Date.now() - autoSavedAt) / 1000);
            if (secs < 10)        setAutoSavedLabel('Auto-saved · just now');
            else if (secs < 60)   setAutoSavedLabel(`Auto-saved · ${secs}s ago`);
            else if (secs < 3600) setAutoSavedLabel(`Auto-saved · ${Math.floor(secs / 60)}m ago`);
            else                  setAutoSavedLabel(`Auto-saved · ${Math.floor(secs / 3600)}h ago`);
        };
        tick();
        const id = setInterval(tick, 15000);
        return () => clearInterval(id);
    }, [autoSavedAt]);

    return (
        <>
            <Head title="Education Enrolment Assessment" />
            {autoSavedLabel && (
                <div
                    className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-gray-200 shadow-md text-[11px] font-semibold text-gray-700"
                    style={{ pointerEvents: 'none' }}
                >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
                    {autoSavedLabel}
                </div>
            )}
            <IntakeFormShell
                title="Education Enrolment Assessment"
                visaLabel="Education Enrolment"
                steps={steps}
                onSubmit={submit}
                processing={processing}
                submitLabel="Submit enrolment"
                data={data}
                draftKey={DRAFT_KEY}
                step={step}
                setStep={setStep}
                visitedSteps={visitedSteps}
                validateStep={validateStep}
                accent={ACCENT}
                accentDark={ACCENT_DARK}
                onSaveDraft={handleServerSaveDraft}
            />
            <IntakeConfirmModal
                open={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={confirmSubmit}
                processing={processing}
                visaLabel="Education Enrolment"
                submitLabel="Submit enrolment"
                accent={ACCENT}
                accentDark={ACCENT_DARK}
                summaryItems={[
                    ['Name',  `${data.first_name} ${data.last_name}`.trim()],
                    ['Email', data.email],
                    ['Phone', data.phone],
                    ['Course', data.study_plans?.preferred_course],
                    ['Level',  data.study_plans?.qualification_level],
                ]}
            />
        </>
    );
}
