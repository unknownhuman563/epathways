import React from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft, User, BookOpen, DollarSign, GraduationCap,
    FileText, Download, Edit, Phone, Mail, MapPin,
    CheckCircle2, XCircle, FileQuestion, Calendar,
    TrendingUp, AlertTriangle, Clock
} from 'lucide-react';

export default function LeadDetails({ lead: backendLead }) {
    // If no lead data is passed, show a loading or error state
    if (!backendLead) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 font-medium font-inter">Loading lead details...</p>
                <Link href="/admin/leads" className="text-blue-600 hover:underline text-sm font-semibold">Back to Leads</Link>
            </div>
        );
    }

    // Helper to format dates for display
    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    };

    // Extracting nested JSON data safely
    const workInfo = backendLead.work_info || {};
    const financialInfo = backendLead.financial_info || {};
    const studyPlan = backendLead.study_plans?.[0] || {};
    
    // Categorize education experiences
    const highSchool = backendLead.education_exps?.find(e => 
        e.level?.toLowerCase().includes('high') || 
        e.level?.toLowerCase().includes('secondary') || 
        ['10', '11', '12'].some(l => e.level?.includes(l))
    ) || {};
    
    const tertiary = backendLead.education_exps?.find(e => 
        e.level?.toLowerCase().includes('bachelor') || 
        e.level?.toLowerCase().includes('university') || 
        e.level?.toLowerCase().includes('college') ||
        e.level?.toLowerCase().includes('tertiary')
    ) || {};

    // Aggregate all education documents into one list
    const allDocuments = backendLead.education_exps?.reduce((acc, exp) => {
        if (exp.documents && Array.isArray(exp.documents)) {
            return [...acc, ...exp.documents];
        }
        return acc;
    }, []) || [];

    // Find any gap explanation in education history
    const gapExp = backendLead.education_exps?.find(e => e.gap_explanation)?.gap_explanation;

    // Map Backend Data to the Frontend Display Object (Maintaining original UI structure)
    const lead = {
        id: backendLead.lead_id || `LP-${backendLead.id}`,
        status: backendLead.status || 'New',
        stage: backendLead.stage || 'N/A',
        branch: backendLead.branch || 'Main',
        country: backendLead.country || '—',
        submittedAt: formatDate(backendLead.created_at),
        
        // 1. Personal Information
        personal: {
            surname: backendLead.last_name || '—',
            firstName: backendLead.first_name || '—',
            otherNames: workInfo.other_names || 'None',
            gender: backendLead.gender || '—',
            phone: backendLead.phone || '—',
            email: backendLead.email || '—',
            maritalStatus: backendLead.marital_status || '—',
            dob: workInfo.dob || '—',
            countryOfBirth: workInfo.country_of_birth || '—',
            placeOfBirth: workInfo.place_of_birth || '—',
            citizenship: workInfo.citizenship || '—',
            residence: workInfo.city || workInfo.residence || '—',
            hasPassport: !!workInfo.passport || (workInfo.passport_expiry && workInfo.passport_expiry !== '—'),
            passportExpiry: workInfo.passport_expiry || '—',
            passportFile: workInfo.passport_file || 'No file uploaded'
        },

        // 2. Study Plans in New Zealand
        studyPlans: {
            preferredCourse: studyPlan.preferred_course || '—',
            qualificationLevel: studyPlan.qualification_level || '—',
            preferredCity: studyPlan.preferred_city || '—',
            preferredIntake: studyPlan.preferred_intake || '—',
            englishTest: {
                taken: !!studyPlan.english_test_taken,
                type: studyPlan.english_test_type || '—',
                date: formatDate(studyPlan.english_test_date),
                overall: studyPlan.score_overall || '—',
                reading: studyPlan.score_reading || '—',
                writing: studyPlan.score_writing || '—',
                listening: studyPlan.score_listening || '—',
                speaking: studyPlan.score_speaking || '—'
            }
        },

        // 3. Financial Information
        financial: {
            hasTuitionFunds: !!financialInfo.tuition_funds,
            hasLivingExpenses: !!financialInfo.living_expenses,
            notes: financialInfo.notes || 'No additional notes provided.'
        },

        // 4. Education Background
        education: {
            highSchool: {
                completed: !!highSchool.id,
                level: highSchool.level || '—',
                institution: highSchool.institution || '—',
                dateStarted: formatDate(highSchool.start_date),
                dateCompleted: formatDate(highSchool.end_date),
                averageMarks: highSchool.average_marks || '—'
            },
            tertiary: {
                completed: !!tertiary.id,
                bachelors: {
                    field: tertiary.field_of_study || '—',
                    institution: tertiary.institution || '—',
                    dateStarted: formatDate(tertiary.start_date),
                    dateCompleted: formatDate(tertiary.end_date),
                    averageMarks: tertiary.average_marks || '—'
                }
            },
            documents: allDocuments.length > 0 ? allDocuments : ['No documents listed'],
            gap: {
                hasGap: !!gapExp,
                length: '—', 
                activity: gapExp || '—'
            }
        }
    };

    // AI Analysis data
    const aiAnalysis = backendLead.ai_analysis;
    const aiStatus = backendLead.ai_analysis_status || 'pending';

    const getStatusStyle = (status) => {
        switch(status) {
            case 'New': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Contacted': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Qualified': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Processing': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'Closed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const DataRow = ({ label, value, fullWidth = false }) => (
        <div className={`flex flex-col gap-1 ${fullWidth ? 'col-span-1 md:col-span-2' : ''}`}>
            <span className="text-xs font-semibold text-gray-400 tracking-wide uppercase">{label}</span>
            <span className="text-sm font-medium text-gray-900 bg-gray-50/50 px-3 py-2 rounded-lg border border-gray-100">{value || '-'}</span>
        </div>
    );

    const SectionCard = ({ title, icon: Icon, children }) => (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/30">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Icon size={18} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );

    const getScoreLevel = (pct) => {
        if (pct >= 75) return { label: 'Strong', color: 'text-emerald-600', bg: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        if (pct >= 50) return { label: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
        if (pct >= 25) return { label: 'Low', color: 'text-orange-600', bg: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-200' };
        return { label: 'Critical', color: 'text-red-600', bg: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200' };
    };

    const ScoreCard = ({ label, score, max, summary }) => {
        const pct = max > 0 ? Math.round((score / max) * 100) : 0;
        const level = getScoreLevel(pct);
        return (
            <div className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{label}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${level.badge}`}>{level.label}</span>
                </div>
                <div className="flex items-end gap-3 mb-3">
                    <span className={`text-2xl font-black ${level.color}`}>{pct}%</span>
                    <span className="text-xs text-gray-400 font-medium pb-1">{score} / {max} pts</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                    <div className={`h-full rounded-full ${level.bg} transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
                {summary && <p className="text-xs text-gray-500 leading-relaxed">{summary}</p>}
            </div>
        );
    };

    const ScoreCircle = ({ score }) => {
        const circumference = 2 * Math.PI * 40;
        const offset = circumference - (score / 100) * circumference;
        const level = getScoreLevel(score);
        return (
            <div className="relative w-28 h-28">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="40" stroke="#f3f4f6" strokeWidth="6" fill="none" />
                    <circle cx="48" cy="48" r="40" stroke={level.bg === 'bg-emerald-500' ? '#10b981' : level.bg === 'bg-amber-500' ? '#f59e0b' : level.bg === 'bg-orange-500' ? '#f97316' : '#ef4444'} strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-black ${level.color}`}>{score}</span>
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">/100</span>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
            <Head title={`Lead Details - ${lead.personal.firstName} ${lead.personal.surname}`} />

            {/* Header / Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col gap-2">
                    <Link href="/admin/leads" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
                        <ArrowLeft size={16} /> Back to Leads
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            {lead.personal.firstName} {lead.personal.surname}
                        </h1>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(lead.status)}`}>
                            {lead.status}
                        </span>
                        <span className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border ${lead.stage === 'Goal Settings' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                            {lead.stage}
                        </span>
                        <span className="text-xs text-blue-700 font-bold bg-blue-50 border border-blue-100 px-2 py-1 rounded-md uppercase tracking-wider">{lead.branch}</span>
                        <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-md">ID: {lead.id}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-colors shadow-sm">
                        <Download size={16} /> Export PDF
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-semibold transition-colors shadow-sm">
                        <Edit size={16} /> Edit Lead
                    </button>
                </div>
            </div>

            {/* Quick Contact & Summary Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Phone size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs text-gray-500 font-medium">Phone</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{lead.personal.phone}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Mail size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs text-gray-500 font-medium">Email</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{lead.personal.email}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <MapPin size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs text-gray-500 font-medium">Location</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{lead.country}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Calendar size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs text-gray-500 font-medium">Applied On</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{lead.submittedAt}</p>
                    </div>
                </div>
            </div>

            {/* AI Analysis Section */}
            {aiStatus !== 'pending' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/30">
                        <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                            <TrendingUp size={18} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">AI Eligibility Analysis</h2>
                        {aiStatus === 'processing' && (
                            <span className="ml-auto flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                <Clock size={12} className="animate-spin" /> Processing...
                            </span>
                        )}
                        {aiStatus === 'failed' && (
                            <span className="ml-auto flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                                <AlertTriangle size={12} /> Failed
                            </span>
                        )}
                    </div>

                    {aiStatus === 'completed' && aiAnalysis && (
                        <div className="p-6 space-y-6">
                            {/* Overall Score + Pathway Hero */}
                            <div className="flex flex-col sm:flex-row items-center gap-8 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                                <ScoreCircle score={aiAnalysis.overall_score ?? 0} />
                                <div className="flex-1 text-center sm:text-left">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Overall Eligibility Score</p>
                                    <p className={`text-sm font-bold mb-3 ${getScoreLevel(aiAnalysis.overall_score ?? 0).color}`}>
                                        {getScoreLevel(aiAnalysis.overall_score ?? 0).label} Candidate
                                    </p>
                                    {aiAnalysis.recommended_pathway && (
                                        <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
                                            <GraduationCap size={14} className="text-purple-600" />
                                            <span className="text-xs font-bold text-purple-800">Recommended: {aiAnalysis.recommended_pathway}</span>
                                        </div>
                                    )}
                                    {aiAnalysis.pathway_reasoning && (
                                        <p className="text-xs text-gray-500 mt-3 leading-relaxed">{aiAnalysis.pathway_reasoning}</p>
                                    )}
                                </div>
                            </div>

                            {/* Category Score Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ScoreCard label="Financial Readiness" score={aiAnalysis.categories?.financial_readiness?.score ?? 0} max={50} summary={aiAnalysis.categories?.financial_readiness?.summary} />
                                <ScoreCard label="Education" score={aiAnalysis.categories?.education?.score ?? 0} max={25} summary={aiAnalysis.categories?.education?.summary} />
                                <ScoreCard label="Work Experience" score={aiAnalysis.categories?.work_experience?.score ?? 0} max={15} summary={aiAnalysis.categories?.work_experience?.summary} />
                                <ScoreCard label="Immigration & Character" score={aiAnalysis.categories?.immigration_risk?.score ?? 0} max={10} summary={aiAnalysis.categories?.immigration_risk?.summary} />
                            </div>

                            {/* Strengths & Concerns */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {aiAnalysis.strengths?.length > 0 && (
                                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5">
                                        <h4 className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <CheckCircle2 size={14} /> Strengths
                                        </h4>
                                        <ul className="space-y-2.5">
                                            {aiAnalysis.strengths.map((s, i) => (
                                                <li key={i} className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed">
                                                    <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {aiAnalysis.concerns?.length > 0 && (
                                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-5">
                                        <h4 className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <AlertTriangle size={14} /> Concerns
                                        </h4>
                                        <ul className="space-y-2.5">
                                            {aiAnalysis.concerns.map((c, i) => (
                                                <li key={i} className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed">
                                                    <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                                    {c}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Summary */}
                            {aiAnalysis.summary && (
                                <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-5">
                                    <h4 className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-3">AI Summary</h4>
                                    <p className="text-sm text-gray-700 leading-relaxed">{aiAnalysis.summary}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {aiStatus === 'processing' && (
                        <div className="p-10 text-center">
                            <div className="w-10 h-10 border-3 border-gray-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-sm text-gray-500 font-medium">AI analysis is currently in progress.</p>
                            <p className="text-xs text-gray-400 mt-1">Refresh the page to check for updates.</p>
                        </div>
                    )}

                    {aiStatus === 'failed' && (
                        <div className="p-10 text-center">
                            <AlertTriangle size={24} className="text-red-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 font-medium">The automated analysis could not be completed.</p>
                            <p className="text-xs text-gray-400 mt-1">Please review the lead data manually.</p>
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">

                {/* 1. Personal Information */}
                <SectionCard title="1. Personal Information" icon={User}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <DataRow label="Surname" value={lead.personal.surname} />
                        <DataRow label="First Name" value={lead.personal.firstName} />
                        <DataRow label="Other Names Used" value={lead.personal.otherNames} />
                        <DataRow label="Gender" value={lead.personal.gender} />
                        <DataRow label="Marital Status" value={lead.personal.maritalStatus} />
                        <DataRow label="Date of Birth" value={lead.personal.dob} />
                        <DataRow label="Country of Birth" value={lead.personal.countryOfBirth} />
                        <DataRow label="Place of Birth" value={lead.personal.placeOfBirth} />
                        <DataRow label="Country of Citizenship" value={lead.personal.citizenship} />
                        <DataRow label="Current Country" value={lead.country} />
                        <DataRow label="Current Residence" value={lead.personal.residence} fullWidth />
                        
                        <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-100 mt-2">
                            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                Passport Details {lead.personal.hasPassport ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-500" />}
                            </h3>
                            {lead.personal.hasPassport && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <DataRow label="Expiry Date" value={lead.personal.passportExpiry} />
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-semibold text-gray-400 tracking-wide uppercase">Passport Document</span>
                                        <a href="#" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50/50 px-3 py-2 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors w-max">
                                            <FileText size={16} /> {lead.personal.passportFile}
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </SectionCard>

                {/* 2. Study Plans in New Zealand */}
                <SectionCard title="2. Study Plans in New Zealand" icon={BookOpen}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <DataRow label="Preferred Course / Program" value={lead.studyPlans.preferredCourse} />
                        <DataRow label="Preferred Qualification Level" value={lead.studyPlans.qualificationLevel} />
                        <DataRow label="Preferred City" value={lead.studyPlans.preferredCity} />
                        <DataRow label="Preferred Intake" value={lead.studyPlans.preferredIntake} />

                        <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-100 mt-2">
                            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                English Test Details
                            </h3>
                            {lead.studyPlans.englishTest.taken ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                    <div className="col-span-2 sm:col-span-3 md:col-span-2">
                                        <p className="text-xs text-gray-500 font-medium">Test Type</p>
                                        <p className="text-sm font-bold text-gray-900">{lead.studyPlans.englishTest.type}</p>
                                        <p className="text-xs text-gray-500 mt-1">Date: {lead.studyPlans.englishTest.date}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 font-medium">Overall</p>
                                        <p className="text-xl font-black text-blue-600">{lead.studyPlans.englishTest.overall}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 font-medium">Reading</p>
                                        <p className="text-lg font-bold text-gray-900">{lead.studyPlans.englishTest.reading}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 font-medium">Listening</p>
                                        <p className="text-lg font-bold text-gray-900">{lead.studyPlans.englishTest.listening}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 font-medium">Writing/Spkg</p>
                                        <p className="text-lg font-bold text-gray-900">{lead.studyPlans.englishTest.writing}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">No English test taken yet.</p>
                            )}
                        </div>
                    </div>
                </SectionCard>

                {/* 3. Financial Information */}
                <SectionCard title="3. Financial Information" icon={DollarSign}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-start justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">Tuition/School Fees</h4>
                                    <p className="text-xs text-gray-500 mt-1">Sufficient funds to cover intended program</p>
                                </div>
                                {lead.financial.hasTuitionFunds ? (
                                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold border border-emerald-200">YES</span>
                                ) : (
                                    <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded text-xs font-bold border border-red-200">NO</span>
                                )}
                            </div>
                            <div className="flex items-start justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">Living Expenses</h4>
                                    <p className="text-xs text-gray-500 mt-1">Has NZ$ 20,000 for living expenses per year</p>
                                </div>
                                {lead.financial.hasLivingExpenses ? (
                                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold border border-emerald-200">YES</span>
                                ) : (
                                    <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded text-xs font-bold border border-red-200">NO</span>
                                )}
                            </div>
                        </div>

                        {/* Reference Info Table (from intake form) */}
                        <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">Indicative Cost Guide</h4>
                            <ul className="space-y-2 text-xs text-gray-600 font-medium">
                                <li className="flex justify-between border-b border-blue-100/50 pb-1">
                                    <span>Diploma (Level 5-6)</span><span>NZD $13k - $22k</span>
                                </li>
                                <li className="flex justify-between border-b border-blue-100/50 pb-1">
                                    <span>Bachelor's (Level 7)</span><span>NZD $20k - $35k</span>
                                </li>
                                <li className="flex justify-between border-b border-blue-100/50 pb-1">
                                    <span>Postgrad (Level 8)</span><span>NZD $22k - $38k</span>
                                </li>
                                <li className="flex justify-between pb-1">
                                    <span>Master's (Level 9)</span><span>NZD $26k - $45k+</span>
                                </li>
                            </ul>
                            <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-gray-600 font-medium flex justify-between">
                                <span>Visa INZ Fee: <b>NZ$ 850</b></span>
                                <span>Prof Fee: <b>NZ$ 1,500</b></span>
                            </div>
                        </div>
                    </div>
                </SectionCard>

                {/* 4. Education Background */}
                <SectionCard title="4. Education Background" icon={GraduationCap}>
                    <div className="space-y-6">
                        
                        {/* High School */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2 flex justify-between items-center">
                                High School Education
                                {lead.education.highSchool.completed && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">COMPLETED</span>}
                            </h3>
                            {lead.education.highSchool.completed && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    <DataRow label="Level" value={lead.education.highSchool.level} />
                                    <DataRow label="Institution" value={lead.education.highSchool.institution} fullWidth />
                                    <DataRow label="Timeline" value={`${lead.education.highSchool.dateStarted} - ${lead.education.highSchool.dateCompleted}`} />
                                    <DataRow label="Avg Marks" value={lead.education.highSchool.averageMarks} />
                                </div>
                            )}
                        </div>

                        {/* Tertiary Education (Dynamic) */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2 flex justify-between items-center">
                                Tertiary Education
                                {lead.education.tertiary.completed && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">COMPLETED</span>}
                            </h3>
                            {lead.education.tertiary.completed && lead.education.tertiary.bachelors && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                    <div className="col-span-1 md:col-span-4 mb-2">
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider border border-blue-100">Bachelor's Degree</span>
                                    </div>
                                    <DataRow label="Field of Study" value={lead.education.tertiary.bachelors.field} />
                                    <DataRow label="Institution" value={lead.education.tertiary.bachelors.institution} />
                                    <DataRow label="Timeline" value={`${lead.education.tertiary.bachelors.dateStarted} - ${lead.education.tertiary.bachelors.dateCompleted}`} />
                                    <DataRow label="Avg Marks" value={lead.education.tertiary.bachelors.averageMarks} />
                                </div>
                            )}
                        </div>

                        {/* Gap & Documents */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Gap Details</h3>
                                {lead.education.gap.hasGap ? (
                                    <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl">
                                        <p className="text-sm font-bold text-amber-900 mb-1">Gap Length: {lead.education.gap.length}</p>
                                        <p className="text-xs font-medium text-amber-800">Current Activity: {lead.education.gap.activity}</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No educational gap reported.</p>
                                )}
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Documents Available</h3>
                                <div className="flex flex-wrap gap-2">
                                    {lead.education.documents.map((doc, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-1.5 text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-lg border border-gray-200">
                                            <CheckCircle2 size={12} className="text-emerald-500" /> {doc}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </SectionCard>

            </div>
        </div>
    );
}
