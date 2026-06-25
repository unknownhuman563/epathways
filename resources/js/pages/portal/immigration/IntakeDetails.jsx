import React from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft, Mail, Phone, Calendar, Globe, FileText, Briefcase, GraduationCap,
    Plane, Languages, Users, ShieldCheck, HeartPulse, Award, MessageSquare,
    Printer, Download, CheckCircle2, ExternalLink, CreditCard, MapPin, BookOpen,
    UserCircle, Heart, Eye, FileCheck2, XCircle,
} from 'lucide-react';

// Generic intake-detail page for the Work / Student / Visitor visa
// types. Mirrors the ResidentIntakeDetails layout (gradient header,
// 4-stat row, two-column body) but drives the section list from a
// per-type schema below so the same component handles all three. Any
// field on the intake row that's empty renders as "—".

// ── Per-type section schema ───────────────────────────────────────────────
// Each entry is { title, icon, fields: [...] } where each field is
// either a string (the intake column key) or an object with overrides
// (date formatting, multiline, custom label, etc.). Section headers
// disappear automatically when every field in them is empty.

const COMMON_PERSONAL = [
    'first_name', 'family_name', 'other_names',
    { key: 'gender', label: 'Gender' },
    { key: 'dob', label: 'Date of birth', kind: 'date' },
    'country_of_birth', 'place_of_birth',
];
const COMMON_IDENTITY = [
    'country_of_citizenship', 'other_citizenships', 'national_id',
    'passport_number',
    { key: 'passport_expiry', label: 'Passport expiry', kind: 'date' },
    { key: 'partnership_status', label: 'Partnership status' },
];
const COMMON_NZ_HISTORY = [
    { key: 'current_country', label: 'Current country' },
    'previous_nz_visa', 'previous_nz_visas', 'previous_nzeta',
    'australian_pr', 'travelled_nz',
    { key: 'last_nz_departure', label: 'Last NZ departure', kind: 'date' },
    { key: 'over_24_months', label: 'Stayed over 24 months' },
];
const COMMON_CHARACTER = [
    { key: 'character_convicted', label: 'Convicted of an offence' },
    { key: 'character_investigation', label: 'Under investigation' },
    { key: 'character_deported', label: 'Previously deported' },
    { key: 'character_visa_refused', label: 'Visa previously refused' },
    { key: 'lived_other_country_5y', label: 'Lived in another country 5y+' },
    { key: 'lived_other_country_details', label: 'Details', multiline: true },
];
const COMMON_HEALTH = [
    { key: 'health_tb', label: 'TB / chest condition' },
    { key: 'health_renal', label: 'Renal condition' },
    { key: 'health_hospital', label: 'Recent hospitalisation' },
    { key: 'health_residential', label: 'Residential care' },
    { key: 'health_pregnant', label: 'Pregnant' },
];
const COMMON_EMPLOYMENT_CURRENT = [
    { key: 'currently_working', label: 'Currently working' },
    'current_job_title',
    { key: 'current_job_duties', label: 'Job duties', multiline: true },
    { key: 'current_job_start',  label: 'Job started',   kind: 'date' },
    { key: 'current_job_finish', label: 'Job finished',  kind: 'date' },
    'current_job_country', 'current_job_region',
    'current_employer_name', 'current_employer_address',
    'current_employer_phone', 'current_employer_email',
];
const COMMON_MILITARY = [
    { key: 'military_compulsory', label: 'Compulsory service' },
    { key: 'military_undertaken', label: 'Service undertaken' },
    { key: 'military_details',    label: 'Details', multiline: true },
];
const COMMON_DECLARATION = [
    { key: 'declaration_accepted', label: 'Declaration accepted' },
    'signature_name',
    { key: 'signature_date', label: 'Signature date', kind: 'date' },
];

// Resident intake uses a slightly different column shape: `last_name`
// instead of `family_name`, `nationality` instead of
// `country_of_citizenship`, plus its own employment / NZ-arrival /
// qualifications fields.
const RESIDENT_PERSONAL = [
    'first_name', 'last_name',
    { key: 'dob', label: 'Date of birth', kind: 'date' },
    { key: 'nationality', label: 'Nationality' },
];

const RESIDENT_PASSPORT_VISA = [
    'passport_number',
    { key: 'passport_expiry', label: 'Passport expiry', kind: 'date' },
    { key: 'issuing_country', label: 'Issuing country' },
    { key: 'current_visa_type', label: 'Current NZ visa' },
    { key: 'current_visa_other', label: 'Visa (other)' },
    { key: 'current_visa_expiry', label: 'Current visa expiry', kind: 'date' },
    { key: 'nz_arrival_date', label: 'NZ arrival date', kind: 'date' },
    { key: 'previous_nz_visa_history', label: 'Previous NZ visa history', multiline: true },
];

const SCHEMA = {
    resident: [
        { title: 'Personal details', icon: <FileText size={16} />,   fields: RESIDENT_PERSONAL },
        { title: 'Passport & visa',  icon: <BookOpen size={16} />,   fields: RESIDENT_PASSPORT_VISA },
        { title: 'Contact',          icon: <Mail size={16} />,       fields: ['email', 'phone'] },
        { title: 'Employment',       icon: <Briefcase size={16} />,  fields: [
            'job_title',
            { key: 'employment_start', label: 'Employment start', kind: 'date' },
            { key: 'employment_type',  label: 'Employment type' },
            { key: 'hourly_rate',      label: 'Hourly rate (NZD)', kind: 'money' },
        ] },
        { title: 'Qualifications',   icon: <GraduationCap size={16} />, fields: [
            { key: 'highest_qualification', label: 'Highest qualification' },
            { key: 'institution_name',     label: 'Institution' },
            { key: 'country_of_study',     label: 'Country of study' },
            { key: 'nzqa_status',          label: 'NZQA / IQA status' },
            { key: 'nzqa_iqa_reference',   label: 'IQA reference' },
        ] },
        { title: 'Work experience',  icon: <Award size={16} />, fields: [
            { key: 'nz_skilled_years',     label: 'NZ skilled years' },
            { key: 'total_skilled_years',  label: 'Total skilled years' },
            { key: 'career_summary',       label: 'Career summary', multiline: true },
        ] },
        { title: 'English language', icon: <Languages size={16} />, fields: [
            { key: 'english_evidence',     label: 'Evidence' },
            { key: 'english_test_score',   label: 'Test score / band' },
            { key: 'english_test_date',    label: 'Test date', kind: 'date' },
        ] },
        { title: 'Family',           icon: <Users size={16} />, fields: [
            { key: 'include_family', label: 'Include family' },
            { key: 'family_members', kind: 'json' },
        ] },
        { title: 'Disclosures',      icon: <MessageSquare size={16} />, fields: [
            { key: 'character_health_disclosure', label: 'Character / health matters', multiline: true },
            { key: 'other_notes',                 label: 'Other notes', multiline: true },
        ] },
    ],

    work: [
        { title: 'Personal details', icon: <FileText size={16} />,    fields: COMMON_PERSONAL },
        { title: 'Identity',         icon: <BookOpen size={16} />,    fields: COMMON_IDENTITY },
        { title: 'Contact',          icon: <Mail size={16} />,        fields: ['email', 'phone', { key: 'current_address', label: 'Current address', multiline: true }] },
        { title: 'NZ history',       icon: <Plane size={16} />,       fields: COMMON_NZ_HISTORY },
        { title: 'Job offer',        icon: <Briefcase size={16} />,   fields: [
            'employer_name',
            { key: 'employer_is_family', label: 'Employer is family' },
            { key: 'employer_family_relation', label: 'Family relation' },
            { key: 'self_employed', label: 'Self employed' },
            { key: 'job_start_date', label: 'Job start date', kind: 'date' },
            { key: 'hourly_rate', label: 'Hourly rate (NZD)', kind: 'money' },
            { key: 'supports_dependent_children', label: 'Supports dependants' },
        ] },
        { title: 'Current employment', icon: <Briefcase size={16} />, fields: COMMON_EMPLOYMENT_CURRENT },
        { title: 'Previous roles',   icon: <Award size={16} />,       fields: [{ key: 'previous_roles', kind: 'json' }] },
        { title: 'Character',        icon: <ShieldCheck size={16} />, fields: COMMON_CHARACTER },
        { title: 'Health',           icon: <HeartPulse size={16} />,  fields: COMMON_HEALTH },
        { title: 'Family',           icon: <Users size={16} />,       fields: [{ key: 'family_members', kind: 'json' }] },
        { title: 'NZ contacts',      icon: <Users size={16} />,       fields: [{ key: 'has_nz_contacts', label: 'Has NZ contacts' }, { key: 'nz_contacts', kind: 'json' }] },
        { title: 'Military service', icon: <ShieldCheck size={16} />, fields: COMMON_MILITARY },
        { title: 'Travel history',   icon: <Plane size={16} />,       fields: [
            { key: 'travelled_internationally', label: 'Travelled internationally' },
            { key: 'travel_trips', kind: 'json' },
        ] },
        { title: 'Declaration',      icon: <MessageSquare size={16} />, fields: COMMON_DECLARATION },
    ],

    student: [
        { title: 'Personal details', icon: <FileText size={16} />,    fields: COMMON_PERSONAL },
        { title: 'Identity',         icon: <BookOpen size={16} />,    fields: COMMON_IDENTITY },
        { title: 'Contact',          icon: <Mail size={16} />,        fields: [
            'email', 'phone',
            { key: 'current_address',  label: 'Current address',  multiline: true },
            { key: 'overseas_address', label: 'Overseas address', multiline: true },
        ] },
        { title: 'NZ history',       icon: <Plane size={16} />,       fields: COMMON_NZ_HISTORY },
        { title: 'Study plan',       icon: <GraduationCap size={16} />, fields: [
            { key: 'programmes', kind: 'json', label: 'Programmes' },
            { key: 'study_period_from', label: 'Study from', kind: 'date' },
            { key: 'study_period_to',   label: 'Study to',   kind: 'date' },
            'school_name',
            { key: 'has_offer', label: 'Has offer' },
        ] },
        { title: 'Finance',          icon: <CreditCard size={16} />,  fields: [
            { key: 'has_enough_funds',   label: 'Has enough funds' },
            { key: 'tuition_fee_nzd',    label: 'Tuition fee (NZD)',    kind: 'money' },
            { key: 'living_expenses_nzd', label: 'Living expenses (NZD)', kind: 'money' },
            { key: 'available_funds',    kind: 'json', label: 'Available funds' },
            { key: 'has_sponsor', label: 'Has sponsor' },
            { key: 'sponsor_relationship', label: 'Sponsor relationship' },
            { key: 'sponsor_income_source', label: 'Sponsor income source' },
            { key: 'can_provide_statements', label: 'Can provide statements' },
            { key: 'has_other_assets', label: 'Has other assets' },
            { key: 'other_assets_details', label: 'Other assets details', multiline: true },
        ] },
        { title: 'Qualifications',   icon: <Award size={16} />,       fields: [{ key: 'qualifications', kind: 'json' }] },
        { title: 'Current employment', icon: <Briefcase size={16} />, fields: COMMON_EMPLOYMENT_CURRENT },
        { title: 'Character',        icon: <ShieldCheck size={16} />, fields: COMMON_CHARACTER },
        { title: 'Health',           icon: <HeartPulse size={16} />,  fields: COMMON_HEALTH },
        { title: 'Family',           icon: <Users size={16} />,       fields: [{ key: 'family_members', kind: 'json' }] },
        { title: 'NZ contacts',      icon: <Users size={16} />,       fields: [{ key: 'has_nz_contacts', label: 'Has NZ contacts' }, { key: 'nz_contacts', kind: 'json' }] },
        { title: 'Military service', icon: <ShieldCheck size={16} />, fields: COMMON_MILITARY },
        { title: 'Travel history',   icon: <Plane size={16} />,       fields: [
            { key: 'travelled_internationally', label: 'Travelled internationally' },
            { key: 'travel_trips', kind: 'json' },
        ] },
        { title: 'Declaration',      icon: <MessageSquare size={16} />, fields: COMMON_DECLARATION },
    ],

    visitor: [
        { title: 'Personal details', icon: <FileText size={16} />,    fields: COMMON_PERSONAL },
        { title: 'Identity',         icon: <BookOpen size={16} />,    fields: COMMON_IDENTITY },
        { title: 'Contact & address', icon: <MapPin size={16} />,     fields: [
            'email', 'phone',
            { key: 'current_address', label: 'Current address', multiline: true },
            'town_city', 'region', 'postcode',
        ] },
        { title: 'NZ history',       icon: <Plane size={16} />,       fields: COMMON_NZ_HISTORY },
        { title: 'Visit details',    icon: <Plane size={16} />,       fields: [
            { key: 'purpose_of_visit',     label: 'Purpose of visit' },
            { key: 'intended_stay_length', label: 'Intended stay length' },
            { key: 'intended_from',        label: 'Intended from', kind: 'date' },
            { key: 'intended_to',          label: 'Intended to',   kind: 'date' },
            { key: 'multi_entry_plans',    label: 'Multi-entry plans' },
            { key: 'has_leave_permit',     label: 'Has leave permit' },
        ] },
        { title: 'Funds',            icon: <CreditCard size={16} />,  fields: [
            { key: 'travel_funds_description', label: 'Travel funds', multiline: true },
            { key: 'can_provide_statements',   label: 'Can provide statements' },
            { key: 'has_other_assets',         label: 'Has other assets' },
            { key: 'other_assets_details',     label: 'Other assets details', multiline: true },
        ] },
        { title: 'Education',        icon: <GraduationCap size={16} />, fields: [
            { key: 'has_tertiary',            label: 'Has tertiary qualification' },
            { key: 'qualification_name',      label: 'Qualification name' },
            { key: 'qualification_duration',  label: 'Qualification duration' },
            { key: 'qualification_completed', label: 'Qualification completed' },
            'education_provider',
        ] },
        { title: 'Current employment', icon: <Briefcase size={16} />, fields: COMMON_EMPLOYMENT_CURRENT },
        { title: 'Character',        icon: <ShieldCheck size={16} />, fields: COMMON_CHARACTER },
        { title: 'Health',           icon: <HeartPulse size={16} />,  fields: [
            ...COMMON_HEALTH,
            { key: 'previous_xray',         label: 'Previous chest x-ray' },
            { key: 'previous_inz1007',      label: 'Previous INZ 1007 medical' },
            { key: 'inz_requested_medical', label: 'INZ requested a medical' },
            { key: 'previous_police_certificate', label: 'Previous police certificate' },
        ] },
        { title: 'Family',           icon: <Users size={16} />,       fields: [{ key: 'family_members', kind: 'json' }] },
        { title: 'NZ contacts',      icon: <Users size={16} />,       fields: [{ key: 'has_nz_contacts', label: 'Has NZ contacts' }, { key: 'nz_contacts', kind: 'json' }] },
        { title: 'Military service', icon: <ShieldCheck size={16} />, fields: COMMON_MILITARY },
        { title: 'Travel history',   icon: <Plane size={16} />,       fields: [
            { key: 'travelled_internationally', label: 'Travelled internationally' },
            { key: 'travel_trips', kind: 'json' },
        ] },
        { title: 'Declaration',      icon: <MessageSquare size={16} />, fields: COMMON_DECLARATION },
    ],
};

const TYPE_META = {
    resident: { label: 'Resident intake', avatarTone: 'from-teal-500 to-emerald-600', back: '/admin/immigration/resident-intakes' },
    work:     { label: 'Work intake',     avatarTone: 'from-amber-500 to-orange-600', back: '/portal/immigration/assessments' },
    student:  { label: 'Student intake',  avatarTone: 'from-emerald-500 to-teal-600', back: '/portal/immigration/assessments' },
    visitor:  { label: 'Visitor intake',  avatarTone: 'from-sky-500 to-blue-600',     back: '/portal/immigration/assessments' },
};

const fmtDate = (d) => {
    if (! d) return '—';
    const date = new Date(d);
    return isNaN(date) ? '—' : date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const fmtMoney = (v) => {
    if (v === null || v === undefined || v === '') return '—';
    const n = Number(v);
    if (! Number.isFinite(n)) return String(v);
    return `$${n.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtBool = (v) => {
    if (v === true || v === 1 || v === '1') return 'Yes';
    if (v === false || v === 0 || v === '0') return 'No';
    return null;
};

const fmtValue = (raw, kind) => {
    if (raw === null || raw === undefined || raw === '') return '—';
    if (kind === 'date')  return fmtDate(raw);
    if (kind === 'money') return fmtMoney(raw);
    const bool = typeof raw === 'boolean' ? fmtBool(raw) : null;
    if (bool !== null) return bool;
    if (typeof raw === 'object') return JSON.stringify(raw, null, 2);
    return String(raw);
};

// Section is non-empty if at least one field has a real value (not
// null / undefined / empty string / empty array / empty object).
const fieldHasValue = (intake, field) => {
    const key = typeof field === 'string' ? field : field.key;
    const v = intake?.[key];
    if (v === null || v === undefined || v === '') return false;
    if (Array.isArray(v) && v.length === 0) return false;
    if (typeof v === 'object' && ! Array.isArray(v) && Object.keys(v).length === 0) return false;
    return true;
};

// Compute age from a DOB; returns null when missing/invalid.
const ageFromDob = (dob) => {
    if (! dob) return null;
    const d = new Date(dob);
    if (isNaN(d)) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age >= 0 && age < 130 ? age : null;
};

export default function IntakeDetails({ type, intake, assessment = null, linkedLead = null, documents = null }) {
    const meta    = TYPE_META[type] || TYPE_META.work;
    const schema  = SCHEMA[type] || SCHEMA.work;
    // Resident uses `last_name`; the other three use `family_name`.
    const lastName = intake.family_name || intake.last_name || '';
    const fullName = [intake.first_name, lastName].filter(Boolean).join(' ') || 'Unknown applicant';
    const age      = ageFromDob(intake.dob);
    // Snapshot chip prefers the per-type field name.
    const citizenship = intake.country_of_citizenship || intake.nationality || null;

    const handlePrint = () => window.print();
    const handleDownload = () => {
        const blob = new Blob([JSON.stringify(intake, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = `${intake.intake_id || `${type}-intake`}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const ToolbarButtons = () => (
        <div className="flex items-center gap-2 no-print">
            <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
                <Printer size={15} /> Print
            </button>
            <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
                <Download size={15} /> Download
            </button>
        </div>
    );

    // Pull the visa-intent / job-offer / study-plan / visit-details
    // section out as the dominant "headline" block — it's the part
    // that's most type-specific and most useful at a glance.
    const headlineTitles = {
        resident: 'Passport & visa',
        work:     'Job offer',
        student:  'Study plan',
        visitor:  'Visit details',
    };
    const headlineSection = schema.find((s) => s.title === headlineTitles[type]) || null;
    const bodySections = schema.filter((s) => s.title !== headlineTitles[type]);

    // Snapshot chips that sit under the hero — quick read of the
    // applicant's defining facts.
    const snapshotChips = [
        citizenship                && { icon: <Globe size={11} />, label: citizenship },
        age !== null               && { icon: <Calendar size={11} />, label: `${age} years old` },
        intake.gender              && { icon: <UserCircle size={11} />, label: intake.gender },
        intake.partnership_status  && { icon: <Heart size={11} />, label: intake.partnership_status },
        intake.current_country     && { icon: <MapPin size={11} />, label: `In ${intake.current_country}` },
        intake.nz_arrival_date     && { icon: <Plane size={11} />, label: `Arrived ${fmtDate(intake.nz_arrival_date)}` },
    ].filter(Boolean);

    return (
        <div id="intake-print" className="space-y-5 max-w-[1300px] mx-auto pb-12">
            <Head title={`${fullName} — ${meta.label}`} />

            <style>{`
                @media print {
                    aside, header { display: none !important; }
                    .no-print { display: none !important; }
                    .h-screen { height: auto !important; }
                    [class*="overflow-"] { overflow: visible !important; }
                    main { padding: 0 !important; }
                    body { background: #fff !important; }
                    #intake-print { max-width: none !important; }
                }
            `}</style>

            {/* Back link */}
            <div className="flex items-center justify-between gap-3">
                <Link
                    href={meta.back}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors no-print"
                >
                    <ArrowLeft size={14} /> Back to assessments
                </Link>
                <ToolbarButtons />
            </div>

            {/* HERO — gradient banner + large avatar overlap. */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className={`h-28 bg-gradient-to-br ${meta.avatarTone}`} />
                <div className="px-6 pb-5 -mt-12">
                    <div className="flex items-end justify-between gap-4 flex-wrap">
                        <div className="flex items-end gap-4">
                            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${meta.avatarTone} text-white flex items-center justify-center font-black text-3xl ring-4 ring-white shadow-lg`}>
                                {(intake.first_name?.[0] || '').toUpperCase()}{(intake.family_name?.[0] || '').toUpperCase()}
                            </div>
                            <div className="pb-2">
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">{fullName}</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {meta.label}
                                    {intake.intake_id && <span className="ml-2 font-mono text-gray-400">{intake.intake_id}</span>}
                                </p>
                            </div>
                        </div>
                        <div className="pb-2 flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold">
                                {intake.status || 'New'}
                            </span>
                        </div>
                    </div>

                    {/* Snapshot chips — defining facts in a quick read */}
                    {snapshotChips.length > 0 && (
                        <div className="mt-4 flex flex-wrap items-center gap-1.5">
                            {snapshotChips.map((chip, i) => (
                                <span
                                    key={i}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100 text-[12px] font-medium text-gray-700"
                                >
                                    <span className="text-gray-400">{chip.icon}</span>
                                    {chip.label}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* BODY — main column with sections, sidebar with quick info. */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                <div className="lg:col-span-2 space-y-5">

                    {/* Headline section — Job offer / Study plan / Visit
                        details. Pulled forward so the most defining
                        info shows first. */}
                    {headlineSection && (
                        <RenderSection
                            section={headlineSection}
                            intake={intake}
                            featured
                        />
                    )}

                    {/* The rest, in the schema's defined order. Empty
                        sections are auto-hidden by RenderSection. */}
                    {bodySections.map((s) => (
                        <RenderSection key={s.title} section={s} intake={intake} />
                    ))}
                </div>

                {/* SIDEBAR — sticky reference rail. */}
                <aside className="space-y-4 lg:sticky lg:top-4">
                    {/* Contact card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-50">
                            <h3 className="text-sm font-bold text-gray-800">Contact</h3>
                        </div>
                        <div className="px-5 py-4 space-y-3">
                            <ContactLine icon={<Mail size={14} />}  label="Email" value={intake.email} href={intake.email ? `mailto:${intake.email}` : null} />
                            <ContactLine icon={<Phone size={14} />} label="Phone" value={intake.phone} href={intake.phone ? `tel:${intake.phone}` : null} />
                            <ContactLine icon={<MapPin size={14} />} label="Address" value={intake.current_address} multiline />
                            {(intake.town_city || intake.region || intake.postcode) && (
                                <ContactLine
                                    icon={<MapPin size={14} />}
                                    label="Region"
                                    value={[intake.town_city, intake.region, intake.postcode].filter(Boolean).join(', ')}
                                />
                            )}
                        </div>
                    </div>

                    {/* Status / lifecycle card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-50">
                            <h3 className="text-sm font-bold text-gray-800">Submission</h3>
                        </div>
                        <div className="px-5 py-4 space-y-3 text-sm">
                            <SidebarFact label="Status" value={intake.status || 'New'} />
                            <SidebarFact label="Submitted" value={fmtDate(intake.created_at)} />
                            {intake.updated_at && intake.updated_at !== intake.created_at && (
                                <SidebarFact label="Last updated" value={fmtDate(intake.updated_at)} />
                            )}
                            {assessment && (
                                <>
                                    <div className="border-t border-gray-100 pt-3 mt-1">
                                        <div className="text-[11px] font-semibold text-gray-500 mb-2 inline-flex items-center gap-1.5">
                                            <CreditCard size={11} /> Pay &amp; book
                                        </div>
                                        <SidebarFact label="Assessment" value={assessment.status || 'Submitted'} />
                                        {assessment.paid_at && (
                                            <SidebarFact label="Paid" value={fmtDate(assessment.paid_at)} valueClass="text-emerald-700" />
                                        )}
                                        {assessment.booking && (
                                            <SidebarFact
                                                label="Booking"
                                                value={`${assessment.booking.status || 'pending'}${assessment.booking.appointment_date ? ` · ${fmtDate(assessment.booking.appointment_date)}` : ''}${assessment.booking.appointment_time ? ` ${assessment.booking.appointment_time}` : ''}`}
                                            />
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Documents card — only rendered when the controller
                        passes a `documents` payload (resident intakes
                        have file uploads; the other three types don't). */}
                    {documents && (
                        <DocumentsCard
                            intakeId={intake.id}
                            documents={documents}
                        />
                    )}

                    {/* Linked-case shortcut */}
                    {linkedLead && (
                        <Link
                            href={`/portal/immigration/leads/${linkedLead.id}`}
                            className="block bg-white rounded-2xl border border-emerald-200 shadow-sm px-5 py-4 hover:border-emerald-400 hover:shadow transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1.5">
                                    <CheckCircle2 size={13} /> Converted to case
                                </span>
                                <ExternalLink size={12} className="text-gray-400 group-hover:text-emerald-600" />
                            </div>
                            <p className="mt-2 text-sm font-bold text-gray-900 truncate">{linkedLead.name}</p>
                            <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                                #{linkedLead.lead_id}{linkedLead.status ? ` · ${linkedLead.status}` : ''}
                            </p>
                        </Link>
                    )}
                </aside>
            </div>
        </div>
    );
}

function ContactLine({ icon, label, value, href, multiline = false }) {
    const body = (
        <>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 mb-0.5">
                <span className="text-gray-400">{icon}</span>
                {label}
            </div>
            <div className={`text-sm text-gray-900 ${multiline ? 'whitespace-pre-wrap leading-relaxed' : 'break-words'}`}>
                {value || '—'}
            </div>
        </>
    );
    if (href && value) {
        return <a href={href} className="block hover:text-blue-600 transition-colors">{body}</a>;
    }
    return <div>{body}</div>;
}

function SidebarFact({ label, value, valueClass = 'text-gray-900' }) {
    return (
        <div className="flex items-baseline justify-between gap-3">
            <span className="text-[12px] text-gray-500">{label}</span>
            <span className={`text-[12.5px] font-semibold ${valueClass} text-right truncate max-w-[60%]`} title={value}>
                {value || '—'}
            </span>
        </div>
    );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function RenderSection({ section, intake, featured = false }) {
    const visible = section.fields.filter((f) => fieldHasValue(intake, f));
    if (visible.length === 0) return null;

    return (
        <Section icon={section.icon} title={section.title} featured={featured}>
            <Grid>
                {visible.map((field) => {
                    const key      = typeof field === 'string' ? field : field.key;
                    const label    = typeof field === 'object' && field.label ? field.label : prettify(key);
                    const kind     = typeof field === 'object' ? field.kind : null;
                    const multi    = (typeof field === 'object' && field.multiline) || kind === 'json';
                    const raw      = intake[key];
                    const display  = fmtValue(raw, kind);
                    return (
                        <Item
                            key={key}
                            label={label}
                            value={display}
                            multiline={multi}
                            fullWidth={kind === 'json' || multi}
                        />
                    );
                })}
            </Grid>
        </Section>
    );
}

function Section({ icon, title, children, featured = false }) {
    return (
        <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${featured ? 'border-gray-300 ring-1 ring-gray-100' : 'border-gray-100'}`}>
            <div className={`px-6 py-4 border-b border-gray-50 flex items-center gap-2.5 ${featured ? 'bg-gradient-to-br from-gray-50/80 to-white' : ''}`}>
                <span className={featured ? 'text-gray-700' : 'text-gray-500'}>{icon}</span>
                <h3 className={`font-bold tracking-tight ${featured ? 'text-base text-gray-900' : 'text-sm text-gray-800'}`}>{title}</h3>
            </div>
            <div className="px-6 py-5 space-y-4">{children}</div>
        </div>
    );
}

function Grid({ children }) {
    return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">{children}</div>;
}

function Item({ label, value, multiline, fullWidth }) {
    return (
        <div className={fullWidth ? 'sm:col-span-2' : ''}>
            <div className="text-[12px] font-semibold text-gray-500 mb-1">{label}</div>
            {multiline ? (
                <pre className="text-[12.5px] text-gray-800 whitespace-pre-wrap leading-relaxed bg-gray-50/60 border border-gray-100 rounded-lg px-3 py-2 font-sans break-words">{value || '—'}</pre>
            ) : (
                <div className="text-sm text-gray-800 break-words">{value || '—'}</div>
            )}
        </div>
    );
}

function prettify(key) {
    return String(key).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Sidebar card listing the resident intake's uploaded documents +
// the "ticked" checklist state. Render-only when the controller
// passes the `documents` prop (i.e. the resident profile).
function DocumentsCard({ intakeId, documents }) {
    const labels = documents.labels || {};
    const ticked = documents.ticked || {};
    const files  = documents.files || {};
    const otherLabel = documents.other_label || 'Other supporting documents';
    const otherFiles = Array.isArray(files.other) ? files.other : (files.other ? [files.other] : []);
    const docKeys = Object.keys(labels);

    const filesFor = (key) => {
        const entry = files[key];
        if (! entry) return [];
        return Array.isArray(entry) ? entry : [entry];
    };

    const totalFiles = [...docKeys, 'other'].reduce((n, k) => n + filesFor(k).length, 0);
    const docChecked = docKeys.filter((k) => !! ticked[k]).length;
    const docUrl = (key, index = 0) => `/admin/immigration/resident-intakes/${intakeId}/documents/${key}/${index}`;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-gray-800 inline-flex items-center gap-2">
                    <FileCheck2 size={14} className="text-gray-500" /> Documents
                </h3>
                <span className="text-[11px] text-gray-500 tabular-nums">
                    {docChecked}/{docKeys.length} · {totalFiles} {totalFiles === 1 ? 'file' : 'files'}
                </span>
            </div>
            <div className="px-5 py-4 space-y-3">
                <ul className="space-y-2.5">
                    {docKeys.map((k) => {
                        const fileList = filesFor(k);
                        const hasFile  = fileList.length > 0;
                        const isTicked = !! ticked[k];
                        return (
                            <li key={k} className="flex items-start gap-2 text-sm">
                                {(isTicked || hasFile)
                                    ? <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                    : <XCircle size={14} className="text-gray-300 mt-0.5 flex-shrink-0" />
                                }
                                <div className="flex-1 min-w-0">
                                    <div className={`text-[12.5px] ${hasFile ? 'text-gray-800 font-medium' : (isTicked ? 'text-gray-800' : 'text-gray-400')}`}>
                                        {labels[k]}
                                        {hasFile && fileList.length > 1 && (
                                            <span className="ml-1.5 text-[10px] font-semibold text-emerald-600">
                                                {fileList.length} files
                                            </span>
                                        )}
                                    </div>
                                    {hasFile && (
                                        <ul className="mt-1 space-y-0.5 no-print">
                                            {fileList.map((_, idx) => (
                                                <li key={idx} className="flex items-center gap-2 text-[11px]">
                                                    <a
                                                        href={docUrl(k, idx)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold"
                                                    >
                                                        <Eye size={11} /> View{fileList.length > 1 ? ` ${idx + 1}` : ''}
                                                    </a>
                                                    <span className="text-gray-200">·</span>
                                                    <a
                                                        href={`${docUrl(k, idx)}?download=1`}
                                                        className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-800 font-semibold"
                                                    >
                                                        <Download size={11} />
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>

                {otherFiles.length > 0 && (
                    <div className="pt-3 border-t border-gray-100">
                        <div className="text-[12.5px] font-medium text-gray-800 inline-flex items-center gap-1.5">
                            <FileCheck2 size={12} className="text-emerald-600" />
                            {otherLabel}
                            <span className="ml-1 text-[10px] font-semibold text-emerald-600">
                                {otherFiles.length} {otherFiles.length === 1 ? 'file' : 'files'}
                            </span>
                        </div>
                        <ul className="mt-1.5 space-y-0.5 pl-6 no-print">
                            {otherFiles.map((_, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-[11px]">
                                    <a
                                        href={docUrl('other', idx)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold"
                                    >
                                        <Eye size={11} /> View {idx + 1}
                                    </a>
                                    <span className="text-gray-200">·</span>
                                    <a
                                        href={`${docUrl('other', idx)}?download=1`}
                                        className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-800 font-semibold"
                                    >
                                        <Download size={11} />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {totalFiles === 0 && (
                    <p className="text-[11px] text-gray-400 italic">No documents were uploaded with this intake.</p>
                )}
            </div>
        </div>
    );
}
