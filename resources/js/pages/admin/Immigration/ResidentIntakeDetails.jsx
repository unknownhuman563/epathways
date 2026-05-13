import React from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft, Mail, Phone, Calendar, Globe, FileText, BookOpen,
    Briefcase, GraduationCap, Award, Languages, Users, FileCheck2,
    MessageSquare, CheckCircle, XCircle, Printer, Download, Eye
} from 'lucide-react';

export default function ResidentIntakeDetails({ intake }) {
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

    const handlePrint = () => window.print();

    const handleDownload = () => {
        const { document_files, ...exportable } = intake; // file paths aren't useful in the export
        const blob = new Blob([JSON.stringify(exportable, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${intake.intake_id || 'resident-intake'}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const qualificationLabels = {
        phd: 'Doctoral degree (PhD) — Level 10',
        masters: "Master's degree — Level 9",
        postgrad: 'Postgraduate diploma/certificate — Level 8',
        bachelor: "Bachelor's degree — Level 7",
        diploma: 'Diploma/Certificate — Level 5–6',
        none: 'No tertiary qualification',
    };
    const qualificationLabel = qualificationLabels[intake.highest_qualification] || intake.highest_qualification;

    const docLabels = {
        passport: 'Passport (all pages)',
        visa_copies: 'All NZ visa copies',
        contracts: 'NZ employment contracts with Ergo + JD',
        payslips: 'Payslips — first 2 mo + latest 1 mo',
        ird_summary: 'IRD summary of earnings (monthly)',
        education_certs: 'Education certificates / transcripts',
        cv: 'CV (NZ + overseas history)',
    };

    const documents = intake.documents || {};
    const docKeys = Object.keys(docLabels);
    const docChecked = docKeys.filter((k) => !!documents[k]).length;
    const uploadedFiles = intake.document_files || {};
    const uploadedCount = docKeys.filter((k) => !!uploadedFiles[k]).length;
    const docUrl = (key) => `/admin/immigration/resident-intakes/${intake.id}/documents/${key}`;

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

    return (
        <div id="intake-print" className="space-y-6 max-w-[1400px] mx-auto pb-12">
            <Head title={`${intake.first_name} ${intake.last_name} — Resident Intake`} />

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

            {/* Mobile toolbar */}
            <div className="flex lg:hidden items-center justify-between gap-3">
                <Link
                    href="/admin/immigration/resident-intakes"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors no-print"
                >
                    <ArrowLeft size={14} /> Back
                </Link>
                <ToolbarButtons />
            </div>

            {/* Header */}
            <div className="hidden lg:flex items-start justify-between gap-4 mb-2">
                <div>
                    <Link
                        href="/admin/immigration/resident-intakes"
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-3 transition-colors no-print"
                    >
                        <ArrowLeft size={14} />
                        Back to Resident Intakes
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00A693] to-[#008c7c] text-white flex items-center justify-center font-black text-lg shadow-lg">
                            {(intake.first_name?.[0] || '').toUpperCase()}{(intake.last_name?.[0] || '').toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{intake.first_name} {intake.last_name}</h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {intake.intake_id} · Submitted {formatDate(intake.created_at)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 pt-12">
                    <ToolbarButtons />
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wide">
                        {intake.status || 'New'}
                    </span>
                </div>
            </div>

            {/* Top quick stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<Mail size={16} />} label="Email" value={intake.email} />
                <StatCard icon={<Phone size={16} />} label="Phone" value={intake.phone} />
                <StatCard icon={<Globe size={16} />} label="Nationality" value={intake.nationality} />
                <StatCard icon={<Calendar size={16} />} label="NZ Arrival" value={formatDate(intake.nz_arrival_date)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main column */}
                <div className="lg:col-span-2 space-y-6">
                    <Section icon={<FileText size={16} />} title="Personal Details">
                        <Grid>
                            <Item label="First Name" value={intake.first_name} />
                            <Item label="Last Name" value={intake.last_name} />
                            <Item label="Date of Birth" value={formatDate(intake.dob)} />
                            <Item label="Nationality" value={intake.nationality} />
                            <Item label="Email" value={intake.email} />
                            <Item label="Phone" value={intake.phone} />
                        </Grid>
                    </Section>

                    <Section icon={<BookOpen size={16} />} title="Passport & Visa">
                        <Grid>
                            <Item label="Passport Number" value={intake.passport_number} />
                            <Item label="Passport Expiry" value={formatDate(intake.passport_expiry)} />
                            <Item label="Issuing Country" value={intake.issuing_country} />
                            <Item label="Current NZ Visa" value={intake.current_visa_type === 'Other' ? `Other — ${intake.current_visa_other}` : intake.current_visa_type} />
                            <Item label="Current Visa Expiry" value={formatDate(intake.current_visa_expiry)} />
                            <Item label="NZ Arrival Date" value={formatDate(intake.nz_arrival_date)} />
                        </Grid>
                        {intake.previous_nz_visa_history && (
                            <Item label="Previous NZ Visa History" value={intake.previous_nz_visa_history} multiline />
                        )}
                    </Section>

                    <Section icon={<Briefcase size={16} />} title="Employment at Ergo">
                        <Grid>
                            <Item label="Job Title" value={intake.job_title} />
                            <Item label="Employment Start" value={formatDate(intake.employment_start)} />
                            <Item label="Employment Type" value={intake.employment_type} />
                            <Item label="Hourly Rate (NZD)" value={`$${Number(intake.hourly_rate).toFixed(2)}/hr`} />
                        </Grid>
                    </Section>

                    <Section icon={<GraduationCap size={16} />} title="Qualifications">
                        <Grid>
                            <Item label="Highest Qualification" value={qualificationLabel} />
                            <Item label="Institution" value={intake.institution_name || '—'} />
                            <Item label="Country of Study" value={intake.country_of_study || '—'} />
                            <Item label="NZQA / IQA Status" value={intake.nzqa_status || '—'} />
                            {intake.nzqa_status === 'Yes — IQA completed' && (
                                <Item label="IQA Reference" value={intake.nzqa_iqa_reference || '—'} />
                            )}
                        </Grid>
                    </Section>

                    <Section icon={<Award size={16} />} title="Work Experience">
                        <Grid>
                            <Item label="NZ Skilled Years" value={`${Number(intake.nz_skilled_years)} yrs`} />
                            <Item label="Total Skilled Years" value={`${Number(intake.total_skilled_years)} yrs`} />
                        </Grid>
                        {intake.career_summary && (
                            <Item label="Career Summary" value={intake.career_summary} multiline />
                        )}
                    </Section>

                    <Section icon={<MessageSquare size={16} />} title="Disclosures">
                        <Item label="Character / Health Matters" value={intake.character_health_disclosure || 'None disclosed.'} multiline />
                        <Item label="Other Notes" value={intake.other_notes || '—'} multiline />
                    </Section>
                </div>

                {/* Side column */}
                <div className="space-y-6">
                    <Section icon={<Languages size={16} />} title="English Language">
                        <Item label="Evidence" value={intake.english_evidence} />
                        {['IELTS', 'TOEFL', 'PTE Academic'].includes(intake.english_evidence) && (
                            <>
                                <Item label="Test Score / Band" value={intake.english_test_score || '—'} />
                                <Item label="Test Date" value={formatDate(intake.english_test_date)} />
                            </>
                        )}
                    </Section>

                    <Section icon={<Users size={16} />} title="Family">
                        <Item label="Include Family" value={intake.include_family} />
                        {Array.isArray(intake.family_members) && intake.family_members.length > 0 && (
                            <div className="space-y-3 pt-2">
                                {intake.family_members.map((m, i) => (
                                    <div key={i} className="rounded-xl border border-gray-100 bg-gray-50/40 p-4">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#00A693] mb-2">
                                            Member {i + 1}
                                        </div>
                                        <div className="text-sm font-semibold text-gray-900">{m.full_name || '—'}</div>
                                        <div className="text-xs text-gray-500 mt-1">{m.relationship || '—'}</div>
                                        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100/80">
                                            <div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">DOB</div>
                                                <div className="text-xs text-gray-700">{formatDate(m.dob)}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Passport</div>
                                                <div className="text-xs text-gray-700">{m.passport_number || '—'}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>

                    <Section icon={<FileCheck2 size={16} />} title={`Documents — ${docChecked}/${docKeys.length} ticked · ${uploadedCount} uploaded`}>
                        <ul className="space-y-2.5">
                            {docKeys.map((k) => {
                                const hasFile = !!uploadedFiles[k];
                                const ticked = !!documents[k];
                                return (
                                    <li key={k} className="flex items-start gap-2.5 text-sm">
                                        {ticked || hasFile ? (
                                            <CheckCircle size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                        ) : (
                                            <XCircle size={16} className="text-gray-300 mt-0.5 flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            {hasFile ? (
                                                <a
                                                    href={docUrl(k)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-gray-800 font-medium hover:text-[#00A693] underline decoration-gray-300 underline-offset-2 hover:decoration-[#00A693] transition-colors"
                                                >
                                                    {docLabels[k]}
                                                </a>
                                            ) : (
                                                <span className={ticked ? 'text-gray-800' : 'text-gray-400'}>
                                                    {docLabels[k]}
                                                </span>
                                            )}
                                            {hasFile && (
                                                <div className="mt-1.5 flex items-center gap-3 no-print">
                                                    <a
                                                        href={docUrl(k)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00A693] hover:text-[#008c7c] transition-colors"
                                                    >
                                                        <Eye size={13} /> View PDF
                                                    </a>
                                                    <span className="text-gray-200">·</span>
                                                    <a
                                                        href={`${docUrl(k)}?download=1`}
                                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                                                    >
                                                        <Download size={13} /> Download
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                        {uploadedCount === 0 && (
                            <p className="text-xs text-gray-400 mt-3">No documents were uploaded with this intake.</p>
                        )}
                    </Section>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                {icon}
                {label}
            </div>
            <div className="text-sm font-semibold text-gray-900 truncate">{value || '—'}</div>
        </div>
    );
}

function Section({ icon, title, children }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2.5">
                <span className="text-gray-500">{icon}</span>
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">{title}</h3>
            </div>
            <div className="px-6 py-5 space-y-4">{children}</div>
        </div>
    );
}

function Grid({ children }) {
    return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">{children}</div>;
}

function Item({ label, value, multiline }) {
    return (
        <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</div>
            <div className={`text-sm text-gray-800 ${multiline ? 'whitespace-pre-wrap leading-relaxed' : 'truncate'}`}>{value || '—'}</div>
        </div>
    );
}
