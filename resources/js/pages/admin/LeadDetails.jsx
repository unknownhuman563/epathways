import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import {
    ArrowLeft, User, BookOpen, DollarSign, GraduationCap,
    FileText, Download, Edit, Phone, Mail, MapPin,
    CheckCircle2, XCircle, FileQuestion, Calendar,
    TrendingUp, AlertTriangle, Clock, History, ChevronDown, Check,
    User as UserIcon, ArrowRight, Sparkles, FolderOpen, Copy, Info, Undo2,
    Globe, Home, Wand2, Users as UsersIcon, Eye,
    Paperclip, FileImage, Film, Music,
} from 'lucide-react';
import { CHECKLIST, STATUSES, STATUS_CHIP, STATUS_LABEL, SECTION_STATUSES, IMPORTANT_NOTES, renderFilename, currentSectionIndex } from '@/data/leadDocumentChecklist';

// Stage colour map — kept consistent with the leads list.
const STAGE_STYLES = {
    "New Leads":                      "bg-rose-100 text-rose-800 border-rose-200",
    "Contact Attempted":              "bg-orange-100 text-orange-800 border-orange-200",
    "Contacted for Booking":          "bg-yellow-100 text-yellow-800 border-yellow-200",
    "Booking Confirmation with Bryll":"bg-cyan-100 text-cyan-800 border-cyan-200",
    "Missed the Meeting":             "bg-pink-100 text-pink-800 border-pink-200",
    "Qualified but Not Ready":        "bg-slate-100 text-slate-700 border-slate-200",
    "Qualified but No Funds":         "bg-slate-100 text-slate-700 border-slate-200",
    "Qualified":                      "bg-amber-100 text-amber-800 border-amber-200",
    "Booked Consultation":            "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Did Not Book Consultation":      "bg-stone-100 text-stone-700 border-stone-200",
    "No Show":                        "bg-teal-100 text-teal-800 border-teal-200",
    "Consultation Done":              "bg-purple-100 text-purple-800 border-purple-200",
    "Proposal Sent":                  "bg-sky-100 text-sky-800 border-sky-200",
    "Consultancy Agreement":          "bg-indigo-100 text-indigo-800 border-indigo-200",
    "English Pro":                    "bg-emerald-50 text-emerald-700 border-emerald-200",
    "School Enrollment":              "bg-green-100 text-green-800 border-green-200",
    "Visa Process":                   "bg-lime-100 text-lime-800 border-lime-200",
    "Not Qualified":                  "bg-red-100 text-red-700 border-red-200",
    "Work Pathway / Other":           "bg-blue-100 text-blue-800 border-blue-200",
};
const stageClass = (s) => STAGE_STYLES[s] || "bg-gray-100 text-gray-700 border-gray-200";

export default function LeadDetails({ lead: backendLead, activity = [], stageTimeline = [], checklistFiles = {}, statuses = [], notes = [], tags = [], allTags = [], tasks = [], staffOptions = [], currentUser = null }) {
    // Derive the "Back to Leads" URL from the current path so sales users
    // return to /portal/sales/leads, education users to /portal/education/leads,
    // and admins to /admin/leads — never a 403.
    const currentUrl = usePage().url || '';
    const backToLeadsUrl = currentUrl.replace(/\/leads\/[^/?#]+.*$/, '/leads') || '/admin/leads';

    // Honour ?tab=documents (or stats / personal / activity) in the URL so
    // links from the Education Documents folder list land directly on the
    // Documents tab instead of always opening on Lead Stats.
    const initialTab = (() => {
        const q = currentUrl.includes('?') ? currentUrl.split('?')[1] : '';
        const params = new URLSearchParams(q);
        const t = params.get('tab');
        return ['stats', 'personal', 'activity', 'documents'].includes(t) ? t : 'stats';
    })();

    const [activeTab, setActiveTab] = useState(initialTab);
    const [stageOpen, setStageOpen] = useState(false);
    const [savingStage, setSavingStage] = useState(false);
    const stageRef = useRef(null);

    // Close stage popover on outside click + ESC
    useEffect(() => {
        if (!stageOpen) return;
        const onDoc = (e) => { if (!stageRef.current?.contains(e.target)) setStageOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setStageOpen(false); };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onKey);
        };
    }, [stageOpen]);

    const changeStage = (status) => {
        setStageOpen(false);
        if (!backendLead || status === backendLead.status) return;
        setSavingStage(true);
        router.post(`/admin/leads/${backendLead.id}/stage`, { status }, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setSavingStage(false),
        });
    };

    // ── Inline Personal Information editing ────────────────────────────────
    const [editingPersonal, setEditingPersonal] = useState(false);
    const [savingPersonal, setSavingPersonal] = useState(false);
    const [personalForm, setPersonalForm] = useState({});
    const setPF = (k) => (e) => setPersonalForm((f) => ({ ...f, [k]: e.target.value }));

    const startEditPersonal = () => {
        const d = (v) => (v ? String(v).slice(0, 10) : '');
        setPersonalForm({
            first_name:        backendLead?.first_name || '',
            last_name:         backendLead?.last_name || '',
            other_names:       backendLead?.other_names || '',
            gender:            backendLead?.gender || '',
            marital_status:    backendLead?.marital_status || '',
            dob:               d(backendLead?.dob),
            country_of_birth:  backendLead?.country_of_birth || '',
            place_of_birth:    backendLead?.place_of_birth || '',
            citizenship:       backendLead?.citizenship || '',
            residence_country: backendLead?.residence_country || backendLead?.country || '',
            residence_city:    backendLead?.residence_city || '',
        });
        setEditingPersonal(true);
    };

    const savePersonal = () => {
        if (!personalForm.first_name?.trim()) return;
        setSavingPersonal(true);
        router.post(`/admin/leads/${backendLead.id}/personal`, personalForm, {
            preserveScroll: true,
            onSuccess: () => setEditingPersonal(false),
            onFinish: () => setSavingPersonal(false),
        });
    };

    // If no lead data is passed, show a loading or error state
    if (!backendLead) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 font-medium font-inter">Loading lead details...</p>
                <Link href={backToLeadsUrl} className="text-blue-600 hover:underline text-sm font-semibold">Back to Leads</Link>
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

    // Shortcuts to the JSON-bucketed fields imported from CSV / quick-lead
    // forms. Used inline below to fill the relevant existing sections.
    const importedEdu    = (backendLead.education_notes && !Array.isArray(backendLead.education_notes)) ? backendLead.education_notes : {};
    const importedWork   = (backendLead.work_info && !Array.isArray(backendLead.work_info)) ? backendLead.work_info : {};
    const importedFamily = (backendLead.family_info && !Array.isArray(backendLead.family_info)) ? backendLead.family_info : {};

    // Aggregate all education documents into one list
    let allDocuments = backendLead.education_notes?.education_docs || [];
    if (allDocuments.length === 0) {
        allDocuments = backendLead.education_exps?.reduce((acc, exp) => {
            if (exp.documents && Array.isArray(exp.documents)) {
                return [...acc, ...exp.documents];
            }
            return acc;
        }, []) || [];
    }

    const workExperiences = Array.isArray(backendLead.work_info) ? backendLead.work_info : [];
    const workDocuments = workExperiences.reduce((acc, work) => {
        if (work.supporting_docs && Array.isArray(work.supporting_docs)) {
            return [...acc, ...work.supporting_docs];
        }
        return acc;
    }, []);

    // Find any gap explanation in education history
    const gapExp = backendLead.education_exps?.find(e => e.gap_explanation)?.gap_explanation;

    // Map Backend Data to the Frontend Display Object (Maintaining original UI structure)
    const lead = {
        id: backendLead.lead_id || `LP-${backendLead.id}`,
        trackingCode: backendLead.tracking_code || null,
        status: backendLead.status || 'New',
        stage: backendLead.stage || 'N/A',
        branch: backendLead.branch || 'Main',
        country: backendLead.country || '—',
        submittedAt: formatDate(backendLead.created_at),
        
        // 1. Personal Information
        personal: {
            surname: backendLead.last_name || '—',
            firstName: backendLead.first_name || '—',
            otherNames: backendLead.other_names || workInfo.other_names || 'None',
            gender: backendLead.gender || '—',
            phone: backendLead.phone || '—',
            email: backendLead.email || '—',
            maritalStatus: backendLead.marital_status || '—',
            dob: backendLead.dob || workInfo.dob || '—',
            countryOfBirth: backendLead.country_of_birth || workInfo.country_of_birth || '—',
            placeOfBirth: backendLead.place_of_birth || workInfo.place_of_birth || '—',
            citizenship: backendLead.citizenship || workInfo.citizenship || '—',
            residence: backendLead.residence_city || workInfo.city || workInfo.residence || '—',
            hasPassport: backendLead.has_passport === 'Yes' || !!workInfo.passport || (workInfo.passport_expiry && workInfo.passport_expiry !== '—'),
            passportExpiry: backendLead.passport_expiry || workInfo.passport_expiry || '—',
            passportFile: backendLead.passport_path || workInfo.passport_file || 'No file uploaded'
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
            workDocuments: workDocuments.length > 0 ? workDocuments : ['No documents listed'],
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
                    <span className="text-xs text-gray-500 font-medium pb-1">{score} / {max} pts</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                    <div className={`h-full rounded-full ${level.bg} transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
                {summary && <p className="text-xs text-gray-600 leading-relaxed">{summary}</p>}
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
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">/100</span>
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
                    <Link href={backToLeadsUrl} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                        <ArrowLeft size={16} /> Back to Leads
                    </Link>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            {lead.personal.firstName} {lead.personal.surname}
                        </h1>

                        {/* Clickable stage editor — any staff role can change it; every transition is audited */}
                        <div ref={stageRef} className="relative">
                            <button
                                type="button"
                                disabled={savingStage}
                                onClick={() => setStageOpen(!stageOpen)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border uppercase hover:shadow-sm transition-all disabled:opacity-50 ${stageClass(backendLead.status || lead.status)}`}
                                title="Click to change stage"
                            >
                                {backendLead.status || lead.status || 'New Leads'}
                                <ChevronDown size={11} strokeWidth={2.5} className="opacity-60" />
                            </button>
                            {stageOpen && (
                                <div role="listbox" className="absolute z-30 top-full left-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 w-[280px] max-h-[420px] overflow-y-auto">
                                    <p className="px-3 pt-2 pb-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Move to stage</p>
                                    {statuses.map((s) => {
                                        const active = s === (backendLead.status || lead.status);
                                        return (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => changeStage(s)}
                                                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-left hover:bg-gray-50 ${active ? 'bg-gray-50/60' : ''}`}
                                            >
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${stageClass(s)}`}>
                                                    {s}
                                                </span>
                                                {active && <Check size={12} className="text-gray-900 flex-shrink-0" strokeWidth={3} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <span className="text-xs text-blue-700 font-bold bg-blue-50 border border-blue-100 px-2 py-1 rounded-md uppercase tracking-wider">{lead.branch}</span>
                        <span className="text-xs text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded-md">ID: {lead.id}</span>

                        {/* Source + AI score (moved out of the leads list table) */}
                        {backendLead.source && (
                            <span className="text-xs text-gray-700 font-medium bg-gray-50 border border-gray-200 px-2 py-1 rounded-md inline-flex items-center gap-1.5">
                                <TrendingUp size={11} className="text-gray-400" />
                                {backendLead.source}
                            </span>
                        )}
                        {backendLead.ai_analysis?.overall_score != null && (
                            <span
                                className={`text-xs font-bold px-2 py-1 rounded-md inline-flex items-center gap-1.5 ${
                                    backendLead.ai_analysis.overall_score >= 70
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : backendLead.ai_analysis.overall_score >= 40
                                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                                            : "bg-red-50 text-red-700 border border-red-200"
                                }`}
                                title={backendLead.ai_analysis?.recommended_pathway || ""}
                            >
                                AI {backendLead.ai_analysis.overall_score}/100
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Multi-service conversion — three independent flags
                        the lead can carry, collapsed into a single
                        "Move to" menu. Active flags show as badges in
                        the menu with an admin-only undo. */}
                    <ConvertMenu
                        lead={backendLead}
                        canRevert={currentUser?.is_admin}
                    />


                    {/* Copy the public tracking link to the clipboard so
                        the department can paste it straight into an email
                        / WhatsApp / SMS. The lead opens that link and
                        sees their information + documents + timeline,
                        and can edit their information there. */}
                    {lead.trackingCode && (
                        <button
                            type="button"
                            title="Copy public tracking link + code for this lead"
                            onClick={() => {
                                const url = `${window.location.origin}/track/${lead.trackingCode}`;
                                // Multi-line payload so staff can paste
                                // straight into WhatsApp / email and the
                                // client sees both the URL and the code
                                // they should type into the search box.
                                const payload =
                                    `Link: ${url}\n` +
                                    `Application Tracking Code: ${lead.trackingCode}`;
                                navigator.clipboard?.writeText(payload).then(
                                    () => toast.success('Tracking link + code copied', { description: payload }),
                                    () => toast.error('Could not copy — your browser blocked clipboard access')
                                );
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-semibold transition-colors shadow-sm"
                        >
                            <Copy size={16} /> Copy Track Link
                        </button>
                    )}

                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-colors shadow-sm">
                        <Download size={16} /> Export PDF
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-semibold transition-colors shadow-sm">
                        <Edit size={16} /> Edit Lead
                    </button>
                </div>
            </div>

            {/* Tab strip */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center border-b border-gray-100 px-4 overflow-x-auto">
                    <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<TrendingUp size={13} />}>
                        Lead Stats
                    </TabButton>
                    <TabButton active={activeTab === 'personal'} onClick={() => setActiveTab('personal')} icon={<User size={13} />}>
                        Personal Info
                    </TabButton>
                    <TabButton
                        active={activeTab === 'activity'}
                        onClick={() => setActiveTab('activity')}
                        icon={<History size={13} />}
                        badge={activity.length > 0 ? activity.length : null}
                    >
                        Journey
                    </TabButton>
                    <TabButton
                        active={activeTab === 'documents'}
                        onClick={() => setActiveTab('documents')}
                        icon={<FolderOpen size={13} />}
                    >
                        Documents
                    </TabButton>
                </div>
            </div>

            {/* ── Journey tab — Key milestones strip on top, Internal
                  Notes (left, wider) + Stage Timeline (right) below,
                  full-width activity log at the bottom ── */}
            {activeTab === 'activity' && (
                <div className="space-y-4">
                    {/* INZ tracking — only when this lead is an immigration case. */}
                    {backendLead.is_immigration_case && (
                        <InzTrackingPanel lead={backendLead} />
                    )}

                    {/* Key milestones — full width above the 2-col row. */}
                    <KeyMilestonesPanel lead={backendLead} />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2">
                            <NotesPanel leadId={backendLead.id} notes={notes} currentUser={currentUser} staffOptions={staffOptions} />
                        </div>
                        <JourneyPanel
                            lead={backendLead}
                            staffOptions={staffOptions}
                            currentStage={backendLead.status}
                            stageTimeline={stageTimeline}
                        />
                    </div>
                    <ActivityLogPanel activity={activity} />
                </div>
            )}

            {/* ── Documents tab ── */}
            {activeTab === 'documents' && (
                <DocumentsPanel lead={backendLead} checklistFiles={checklistFiles} currentUser={currentUser} />
            )}

            {/* ── Lead Stats tab — dashboard-style quick stats + AI hero ── */}
            <div className={activeTab === 'stats' ? 'space-y-6' : 'hidden'}>
                <StatsQuickRow lead={backendLead} tasks={tasks} tags={tags} notes={notes} />
                <AICapabilityHero lead={backendLead} />

                {/* Tasks + Tags side-by-side — paired workspace row. */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <TasksPanel leadId={backendLead.id} tasks={tasks} staffOptions={staffOptions} currentUser={currentUser} />
                    <TagsPanel leadId={backendLead.id} tags={tags} allTags={allTags} />
                </div>

                <NotesPanel leadId={backendLead.id} notes={notes} currentUser={currentUser} staffOptions={staffOptions} />
            </div>

            {/* ── Personal Info tab — full profile sections below ── */}
            <div className={activeTab === 'personal' ? 'space-y-6' : 'hidden'}>

            {/* Quick Contact & Summary Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Phone size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs text-gray-600 font-medium">Phone</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{lead.personal.phone}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Mail size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs text-gray-600 font-medium">Email</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{lead.personal.email}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <MapPin size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs text-gray-600 font-medium">Location</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{lead.country}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Calendar size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs text-gray-600 font-medium">Applied On</p>
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
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Overall Eligibility Score</p>
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
                                        <p className="text-xs text-gray-600 mt-3 leading-relaxed">{aiAnalysis.pathway_reasoning}</p>
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
                            <p className="text-sm text-gray-600 font-medium">AI analysis is currently in progress.</p>
                            <p className="text-xs text-gray-500 mt-1">Refresh the page to check for updates.</p>
                        </div>
                    )}

                    {aiStatus === 'failed' && (
                        <div className="p-10 text-center">
                            <AlertTriangle size={24} className="text-red-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-600 font-medium">The automated analysis could not be completed.</p>
                            <p className="text-xs text-gray-500 mt-1">Please review the lead data manually.</p>
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">

                {/* 1. Personal Information */}
                <SectionCard
                    title="1. Personal Information"
                    icon={User}
                    action={editingPersonal ? (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setEditingPersonal(false)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={savePersonal}
                                disabled={savingPersonal || !personalForm.first_name?.trim()}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-colors disabled:opacity-40"
                            >
                                <Check size={13} /> {savingPersonal ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={startEditPersonal}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                            <Edit size={13} /> Edit
                        </button>
                    )}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <PersonalField editing={editingPersonal} form={personalForm} setPF={setPF} label="Surname" field="last_name" value={lead.personal.surname} />
                        <PersonalField editing={editingPersonal} form={personalForm} setPF={setPF} label="First Name" field="first_name" value={lead.personal.firstName} />
                        <PersonalField editing={editingPersonal} form={personalForm} setPF={setPF} label="Other Names Used" field="other_names" value={lead.personal.otherNames} />
                        <PersonalField editing={editingPersonal} form={personalForm} setPF={setPF} label="Gender" field="gender" value={lead.personal.gender} options={GENDER_OPTIONS} />
                        <PersonalField editing={editingPersonal} form={personalForm} setPF={setPF} label="Marital Status" field="marital_status" value={lead.personal.maritalStatus} options={MARITAL_OPTIONS} />
                        <PersonalField editing={editingPersonal} form={personalForm} setPF={setPF} label="Date of Birth" field="dob" value={lead.personal.dob} type="date" />
                        <PersonalField editing={editingPersonal} form={personalForm} setPF={setPF} label="Country of Birth" field="country_of_birth" value={lead.personal.countryOfBirth} />
                        <PersonalField editing={editingPersonal} form={personalForm} setPF={setPF} label="Place of Birth" field="place_of_birth" value={lead.personal.placeOfBirth} />
                        <PersonalField editing={editingPersonal} form={personalForm} setPF={setPF} label="Country of Citizenship" field="citizenship" value={lead.personal.citizenship} />
                        <PersonalField editing={editingPersonal} form={personalForm} setPF={setPF} label="Current Country" field="residence_country" value={lead.country} />
                        <PersonalField editing={editingPersonal} form={personalForm} setPF={setPF} label="Current Residence" field="residence_city" value={lead.personal.residence} fullWidth />
                        {importedFamily.preferred_contact_time && (
                            <DataRow label="Preferred Contact Time" value={importedFamily.preferred_contact_time} />
                        )}

                        <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-100 mt-2">
                            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                Passport Details {lead.personal.hasPassport ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-500" />}
                            </h3>
                            {lead.personal.hasPassport && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <DataRow label="Expiry Date" value={lead.personal.passportExpiry} />
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase">Passport Document</span>
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
                        {importedFamily.pathway && (
                            <DataRow label="Pathway Interested In" value={importedFamily.pathway} fullWidth />
                        )}
                        {importedFamily.willing_to_invest && (
                            <DataRow label="Willing to Invest in Study Abroad" value={importedFamily.willing_to_invest} />
                        )}
                        {importedFamily.willing_to_proceed && (
                            <DataRow label="Willing to Proceed with NZ Student Visa" value={importedFamily.willing_to_proceed} />
                        )}

                        <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-100 mt-2">
                            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                English Test Details
                            </h3>
                            {lead.studyPlans.englishTest.taken ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                    <div className="col-span-2 sm:col-span-3 md:col-span-2">
                                        <p className="text-xs text-gray-600 font-medium">Test Type</p>
                                        <p className="text-sm font-bold text-gray-900">{lead.studyPlans.englishTest.type}</p>
                                        <p className="text-xs text-gray-600 mt-1">Date: {lead.studyPlans.englishTest.date}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-600 font-medium">Overall</p>
                                        <p className="text-xl font-black text-blue-600">{lead.studyPlans.englishTest.overall}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-600 font-medium">Reading</p>
                                        <p className="text-lg font-bold text-gray-900">{lead.studyPlans.englishTest.reading}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-600 font-medium">Listening</p>
                                        <p className="text-lg font-bold text-gray-900">{lead.studyPlans.englishTest.listening}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-600 font-medium">Writing/Spkg</p>
                                        <p className="text-lg font-bold text-gray-900">{lead.studyPlans.englishTest.writing}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">No English test taken yet.</p>
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
                                    <p className="text-xs text-gray-600 mt-1">Sufficient funds to cover intended program</p>
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
                                    <p className="text-xs text-gray-600 mt-1">Has NZ$ 20,000 for living expenses per year</p>
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

                        {/* Self-reported summary (from CSV / quick-lead intake) */}
                        {(importedEdu.current_education_attainment || importedEdu.bachelor_course) && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Self-reported Education</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                    {importedEdu.current_education_attainment && (
                                        <DataRow label="Current Education Attainment" value={importedEdu.current_education_attainment} />
                                    )}
                                    {importedEdu.bachelor_course && (
                                        <DataRow label="Bachelor's Degree Course" value={importedEdu.bachelor_course} />
                                    )}
                                </div>
                            </div>
                        )}

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
                                    <p className="text-sm text-gray-600">No educational gap reported.</p>
                                )}
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Documents Available</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-600 mb-2 uppercase tracking-wide">Education</p>
                                        <div className="flex flex-wrap gap-2">
                                            {lead.education.documents.map((doc, idx) => (
                                                <span key={`edu-${idx}`} className="inline-flex items-center gap-1.5 text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-lg border border-gray-200">
                                                    <CheckCircle2 size={12} className="text-emerald-500" /> {doc}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-600 mb-2 uppercase tracking-wide">Work & Business</p>
                                        <div className="flex flex-wrap gap-2">
                                            {lead.education.workDocuments.map((doc, idx) => (
                                                <span key={`work-${idx}`} className="inline-flex items-center gap-1.5 text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-lg border border-gray-200">
                                                    <CheckCircle2 size={12} className="text-blue-500" /> {doc}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </SectionCard>

                {/* 5. Work Background — self-reported from CSV / quick-lead. */}
                {(importedWork.current_job || importedWork.current_location) && (
                    <SectionCard title="5. Work Background" icon={DollarSign}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            {importedWork.current_job && (
                                <DataRow label="Current Job / Occupation" value={importedWork.current_job} />
                            )}
                            {importedWork.current_location && (
                                <DataRow label="Current Location" value={importedWork.current_location} />
                            )}
                        </div>
                    </SectionCard>
                )}

                {/* 6. Family & Partner — partner/spouse + children. */}
                {(importedFamily.partner_name || importedFamily.partner_age || importedFamily.partner_education
                    || importedFamily.partner_work_experience || importedFamily.partner_years_experience
                    || importedFamily.number_of_children || importedFamily.children_ages
                    || importedFamily.will_bring_children) && (
                    <SectionCard title="6. Family & Partner" icon={UserIcon}>
                        <div className="space-y-6">
                            {/* Partner */}
                            {(importedFamily.partner_name || importedFamily.partner_age || importedFamily.partner_education
                                || importedFamily.partner_education_other || importedFamily.partner_work_experience
                                || importedFamily.partner_years_experience) && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Partner / Spouse</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        {importedFamily.partner_name             && <DataRow label="Full Name"            value={importedFamily.partner_name} />}
                                        {importedFamily.partner_age              && <DataRow label="Age"                  value={importedFamily.partner_age} />}
                                        {importedFamily.partner_education        && <DataRow label="Current Education"    value={importedFamily.partner_education} />}
                                        {importedFamily.partner_education_other  && <DataRow label="Education (Other)"    value={importedFamily.partner_education_other} />}
                                        {importedFamily.partner_work_experience  && <DataRow label="Current Work"         value={importedFamily.partner_work_experience} />}
                                        {importedFamily.partner_years_experience && <DataRow label="Years of Experience"  value={importedFamily.partner_years_experience} />}
                                    </div>
                                </div>
                            )}

                            {/* Children */}
                            {(importedFamily.number_of_children || importedFamily.children_ages
                                || importedFamily.will_bring_children || importedFamily.will_bring_children_other) && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Children</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        {importedFamily.number_of_children        && <DataRow label="Number of Children" value={importedFamily.number_of_children} />}
                                        {importedFamily.children_ages             && <DataRow label="Children's Ages"   value={importedFamily.children_ages} />}
                                        {importedFamily.will_bring_children       && <DataRow label="Will Bring Children" value={importedFamily.will_bring_children} />}
                                        {importedFamily.will_bring_children_other && <DataRow label="Children — Other Answer" value={importedFamily.will_bring_children_other} />}
                                    </div>
                                </div>
                            )}
                        </div>
                    </SectionCard>
                )}

            </div>
            </div>
        </div>
    );
}

// ── Imported profile sections — renders the JSON-bucketed fields from
// the CSV import (education / work / partner / children / intent) inside
// the Personal Info tab. Only sub-cards with actual data render.

function ImportedProfileSections({ lead }) {
    const edu    = lead?.education_notes || {};
    const work   = lead?.work_info       || {};
    const family = lead?.family_info     || {};

    // Helpers — extract known keys + leave the original JSON visible
    // (handy when the importer brings in fields we haven't named yet).
    const eduFields = [
        { k: 'current_education_attainment', label: 'Current education' },
        { k: 'bachelor_course',              label: "Bachelor's degree course" },
    ];
    const workFields = [
        { k: 'current_job',      label: 'Current job / occupation' },
        { k: 'current_location', label: 'Current location' },
    ];
    const intentFields = [
        { k: 'pathway',                label: 'Pathway interested in' },
        { k: 'willing_to_invest',      label: 'Willing to invest in study abroad' },
        { k: 'willing_to_proceed',     label: 'Willing to proceed with NZ student visa' },
        { k: 'preferred_contact_time', label: 'Preferred contact time' },
    ];
    const partnerFields = [
        { k: 'partner_name',             label: 'Partner / spouse name' },
        { k: 'partner_age',              label: 'Partner age' },
        { k: 'partner_education',        label: 'Partner education' },
        { k: 'partner_education_other',  label: 'Partner education (other)' },
        { k: 'partner_work_experience',  label: 'Partner work experience' },
        { k: 'partner_years_experience', label: 'Partner years of experience' },
    ];
    const childrenFields = [
        { k: 'number_of_children',         label: 'Number of children' },
        { k: 'children_ages',              label: "Children's ages" },
        { k: 'will_bring_children',        label: 'Will you bring your children' },
        { k: 'will_bring_children_other', label: 'Children — other answer' },
    ];

    const has = (bag, fields) => fields.some((f) => bag[f.k]);

    return (
        <div className="space-y-6">
            <SubSection title="Pathway & intent" show={has(family, intentFields)}>
                <ProfileGrid bag={family} fields={intentFields} />
            </SubSection>

            <SubSection title="Education" show={has(edu, eduFields)}>
                <ProfileGrid bag={edu} fields={eduFields} />
            </SubSection>

            <SubSection title="Work" show={has(work, workFields)}>
                <ProfileGrid bag={work} fields={workFields} />
            </SubSection>

            <SubSection title="Partner / spouse" show={has(family, partnerFields)}>
                <ProfileGrid bag={family} fields={partnerFields} />
            </SubSection>

            <SubSection title="Children" show={has(family, childrenFields)}>
                <ProfileGrid bag={family} fields={childrenFields} />
            </SubSection>

            {/* Empty state — JSON is set but none of the named keys matched
                (e.g. legacy data or a partially-mapped CSV). Show the raw
                JSON keys so the data isn't invisible. */}
            {!(has(family, intentFields) || has(edu, eduFields) || has(work, workFields) || has(family, partnerFields) || has(family, childrenFields)) && (
                <p className="text-sm text-gray-400 italic">No profile fields captured yet.</p>
            )}
        </div>
    );
}

function SubSection({ title, show, children }) {
    if (!show) return null;
    return (
        <div className="pt-1">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500 mb-3">{title}</h3>
            {children}
        </div>
    );
}

// Presentational helpers — defined at module scope (NOT inside the page
// component) so they keep a stable identity across re-renders. Defining them
// inline would remount their subtree on every keystroke, stealing focus from
// inputs in the inline Personal Information editor.

function DataRow({ label, value, fullWidth = false }) {
    return (
        <div className={`flex flex-col gap-1 ${fullWidth ? 'col-span-1 md:col-span-2' : ''}`}>
            <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase">{label}</span>
            <span className="text-sm font-medium text-gray-900 bg-gray-50/50 px-3 py-2 rounded-lg border border-gray-100">{value || '-'}</span>
        </div>
    );
}

function SectionCard({ title, icon: Icon, children, action = null }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/30">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Icon size={18} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                {action && <div className="ml-auto">{action}</div>}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

// Read-only DataRow normally; an inline input/select while the Personal
// Information card is in edit mode. `form` + `setPF` come from the page.
function PersonalField({ editing, label, field, value, form, setPF, type = 'text', options = null, fullWidth = false }) {
    if (!editing) return <DataRow label={label} value={value} fullWidth={fullWidth} />;
    const cls = "text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded-lg border border-gray-300 outline-none focus:border-gray-900 transition-colors";
    return (
        <div className={`flex flex-col gap-1 ${fullWidth ? 'col-span-1 md:col-span-2' : ''}`}>
            <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase">{label}</span>
            {options ? (
                <select value={form[field] ?? ''} onChange={setPF(field)} className={cls}>
                    <option value="">—</option>
                    {options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
            ) : (
                <input type={type} value={form[field] ?? ''} onChange={setPF(field)} className={cls} />
            )}
        </div>
    );
}

// Personal Information edit options — used by the inline editor on the
// Personal Information card.
const MARITAL_OPTIONS = ['Single', 'Married', 'De facto', 'Separated', 'Divorced', 'Widowed'];
const GENDER_OPTIONS  = ['Male', 'Female', 'Other'];

function ProfileGrid({ bag, fields }) {
    return (
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {fields.filter((f) => bag[f.k] !== undefined && bag[f.k] !== null && bag[f.k] !== '').map((f) => (
                <div key={f.k} className="flex flex-col gap-1">
                    <dt className="text-xs font-semibold text-gray-500 tracking-wide uppercase">{f.label}</dt>
                    <dd className="text-sm font-medium text-gray-900 bg-gray-50/50 px-3 py-2 rounded-lg border border-gray-100">
                        {String(bag[f.k])}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

// ── INZ tracking panel — visible on the Journey tab for immigration cases.

const INZ_STATUSES = ['Lodged', 'Info Requested', 'Decision Pending', 'Approved', 'Declined', 'Withdrawn'];

function InzTrackingPanel({ lead }) {
    const [form, setForm] = useState({
        inz_visa_type:   lead.inz_visa_type   || '',
        inz_lodged_at:   lead.inz_lodged_at   ? String(lead.inz_lodged_at).slice(0, 10) : '',
        inz_reference:   lead.inz_reference   || '',
        inz_status:      lead.inz_status      || '',
        inz_decision_at: lead.inz_decision_at ? String(lead.inz_decision_at).slice(0, 10) : '',
    });
    const [saving, setSaving] = useState(false);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = (e) => {
        e?.preventDefault?.();
        setSaving(true);
        router.post(`/admin/leads/${lead.id}/inz`, form, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setSaving(false),
        });
    };

    return (
        <form onSubmit={submit} className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-amber-100 bg-gradient-to-br from-amber-50 to-white flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Globe size={15} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">INZ tracking</h2>
                        <p className="text-[11px] text-gray-500 mt-0.5">Lodgement, reference, current INZ status, and decision date.</p>
                    </div>
                </div>
                <button type="submit" disabled={saving} className="px-4 py-1.5 bg-amber-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-amber-700 transition-colors disabled:opacity-40">
                    {saving ? 'Saving…' : 'Save INZ'}
                </button>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <label className="block">
                    <span className="block text-[11px] font-semibold text-gray-600 mb-1.5">Visa type</span>
                    <input type="text" value={form.inz_visa_type} onChange={set('inz_visa_type')} placeholder="e.g. Student Visa"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-500" />
                </label>
                <label className="block">
                    <span className="block text-[11px] font-semibold text-gray-600 mb-1.5">Lodged on</span>
                    <input type="date" value={form.inz_lodged_at} onChange={set('inz_lodged_at')}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-500" />
                </label>
                <label className="block">
                    <span className="block text-[11px] font-semibold text-gray-600 mb-1.5">INZ reference</span>
                    <input type="text" value={form.inz_reference} onChange={set('inz_reference')} placeholder="e.g. APP1234567"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-500" />
                </label>
                <label className="block">
                    <span className="block text-[11px] font-semibold text-gray-600 mb-1.5">INZ status</span>
                    <select value={form.inz_status} onChange={set('inz_status')}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-500 bg-white">
                        <option value="">—</option>
                        {INZ_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </label>
                <label className="block">
                    <span className="block text-[11px] font-semibold text-gray-600 mb-1.5">Decision date</span>
                    <input type="date" value={form.inz_decision_at} onChange={set('inz_decision_at')}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-500" />
                </label>
            </div>
        </form>
    );
}

// ── Convert menu — single "Move to" dropdown listing all three flags
//    (Student / Case / Accommodation) so the header stays compact. Active
//    flags display a check + an admin-only revert affordance inline.

const MENU_TONE = {
    emerald: { dot: 'bg-emerald-500', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    amber:   { dot: 'bg-amber-500',   icon: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700 border-amber-200' },
    cyan:    { dot: 'bg-cyan-500',    icon: 'text-cyan-600',    badge: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
};

function ConvertMenu({ lead, canRevert }) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    // Close on outside click / Escape so the menu behaves like a normal
    // disclosure widget.
    useEffect(() => {
        if (!open) return;
        const onDocClick = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const items = [
        {
            key: 'student',
            label: 'Study',
            sublabel: 'education',
            icon: <GraduationCap size={14} />,
            tone: 'emerald',
            active: !!lead.is_student,
            endpoint: `/admin/leads/${lead.id}/convert-to-student`,
            revertEndpoint: `/admin/leads/${lead.id}/revert-student`,
            confirmText: 'Convert to a student? They stay on the same record — all documents, notes and history come with them.',
        },
        {
            key: 'case',
            label: 'Case',
            sublabel: 'immigration',
            icon: <Globe size={14} />,
            tone: 'amber',
            active: !!lead.is_immigration_case,
            endpoint: `/admin/leads/${lead.id}/convert-to-case`,
            revertEndpoint: `/admin/leads/${lead.id}/revert-case`,
            confirmText: "Open as an immigration case? Lands them in Immigration's Cases queue with full document folder access.",
        },
        {
            key: 'accommodation',
            label: 'Housing',
            sublabel: 'accommodation',
            icon: <Home size={14} />,
            tone: 'cyan',
            active: !!lead.is_accommodation_client,
            endpoint: `/admin/leads/${lead.id}/convert-to-accommodation`,
            revertEndpoint: `/admin/leads/${lead.id}/revert-accommodation`,
            confirmText: "Open as an accommodation client? They appear in the Accommodation team's queue.",
        },
    ];

    const activeCount = items.filter((i) => i.active).length;

    const convert = (item) => {
        if (!confirm(`${lead.first_name ? `${lead.first_name}: ` : ''}${item.confirmText}`)) return;
        router.post(item.endpoint, {}, { preserveScroll: true, preserveState: true });
        setOpen(false);
    };

    const revert = (item) => {
        if (!confirm(`Revert this ${item.label.toLowerCase()} status? History stays attached.`)) return;
        router.post(item.revertEndpoint, {}, { preserveScroll: true, preserveState: true });
        setOpen(false);
    };

    return (
        <div ref={wrapRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 text-sm font-semibold transition-colors shadow-sm"
            >
                <ArrowRight size={15} />
                Move to
                {activeCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-white/20 text-[10px] font-bold tabular-nums">
                        {activeCount}
                    </span>
                )}
                <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">Move this lead to…</p>
                    </div>
                    <ul className="py-1">
                        {items.map((item) => {
                            const t = MENU_TONE[item.tone] || MENU_TONE.emerald;
                            return (
                                <li key={item.key}>
                                    <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 group">
                                        <button
                                            type="button"
                                            onClick={() => !item.active && convert(item)}
                                            disabled={item.active}
                                            className={`flex-1 flex items-center gap-2.5 text-left text-sm ${
                                                item.active ? 'cursor-default' : 'cursor-pointer'
                                            }`}
                                        >
                                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${t.badge}`}>
                                                <span className={t.icon}>{item.icon}</span>
                                            </span>
                                            <span className="flex flex-col leading-tight">
                                                <span className={`font-medium ${item.active ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {item.label}
                                                </span>
                                                <span className="text-[10px] italic text-gray-400">
                                                    {item.sublabel}
                                                </span>
                                            </span>
                                            {item.active && (
                                                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                                    <Check size={12} /> Active
                                                </span>
                                            )}
                                        </button>
                                        {item.active && canRevert && (
                                            <button
                                                type="button"
                                                onClick={() => revert(item)}
                                                className="inline-flex items-center justify-center w-7 h-7 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                                                title={`Admin only — revert ${item.label}`}
                                            >
                                                <Undo2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}

// ── Tab button ─────────────────────────────────────────────────────────────

function TabButton({ active, onClick, icon, badge, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-4 py-3 text-xs font-bold tracking-wider uppercase transition-colors border-b-2 -mb-px inline-flex items-center gap-2 whitespace-nowrap ${
                active
                    ? 'text-gray-900 border-gray-900'
                    : 'text-gray-400 border-transparent hover:text-gray-700'
            }`}
        >
            {icon}
            {children}
            {badge != null && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 tabular-nums">
                    {badge}
                </span>
            )}
        </button>
    );
}

// ── Stats quick-row — 4 mini stat cards ───────────────────────────────────

function StatsQuickRow({ lead, tasks, tags, notes }) {
    const aiScore = lead?.ai_analysis?.overall_score;
    const openTasks = tasks.filter((t) => !t.completed).length;
    const dueToday = tasks.filter((t) => !t.completed && t.overdue).length;
    const pinnedNotes = notes.filter((n) => n.pinned).length;

    const scoreTone =
        aiScore == null
            ? { num: 'text-gray-400', accent: 'bg-gray-200' }
            : aiScore >= 70
                ? { num: 'text-emerald-700', accent: 'bg-emerald-400' }
                : aiScore >= 40
                    ? { num: 'text-amber-700', accent: 'bg-amber-400' }
                    : { num: 'text-red-700', accent: 'bg-red-400' };

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
                eyebrow="AI Score"
                icon={<Sparkles size={14} />}
                value={aiScore != null ? aiScore : '—'}
                valueSuffix={aiScore != null ? '/100' : null}
                valueClass={scoreTone.num}
                detail={aiScore != null ? `${Math.round(aiScore)}% capability` : 'Awaiting analysis'}
                spark={<MiniBar value={aiScore ?? 0} max={100} accent={scoreTone.accent} />}
            />
            <StatCard
                eyebrow="Open tasks"
                icon={<Clock size={14} />}
                value={openTasks}
                detail={dueToday > 0 ? `${dueToday} overdue` : 'On track'}
                detailTone={dueToday > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}
                spark={
                    <div className="flex items-end gap-0.5 h-7">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <span key={i} className={`flex-1 rounded-sm ${i < openTasks ? 'bg-gray-900' : 'bg-gray-100'}`} style={{ height: `${(i + 2) * 12}%` }} />
                        ))}
                    </div>
                }
            />
            <StatCard
                eyebrow="Active tags"
                icon={<TrendingUp size={14} />}
                value={tags.length}
                detail={tags.length === 0 ? 'No tags yet' : tags.slice(0, 3).map((t) => t.name).join(' · ')}
                spark={
                    tags.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                            {tags.slice(0, 4).map((t) => (
                                <span key={t.id} className={`w-3 h-3 rounded-full ${tagColor(t.color).split(' ')[0]}`}></span>
                            ))}
                        </div>
                    ) : (
                        <div className="h-7"></div>
                    )
                }
            />
            <StatCard
                eyebrow="Notes"
                icon={<Edit size={14} />}
                value={notes.length}
                detail={pinnedNotes > 0 ? `${pinnedNotes} pinned` : (notes.length > 0 ? 'On record' : 'None yet')}
                spark={
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(notes.length, 6) }).map((_, i) => (
                            <span key={i} className="w-1.5 h-7 rounded-full bg-gray-900"></span>
                        ))}
                        {notes.length === 0 && <div className="h-7"></div>}
                    </div>
                }
            />
        </div>
    );
}

function StatCard({ eyebrow, icon, value, valueSuffix, valueClass = 'text-gray-900', detail, detailTone = 'text-gray-400', spark }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col gap-3 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500">
                    <span className="text-gray-400">{icon}</span>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em]">{eyebrow}</p>
                </div>
            </div>
            <div>
                <p className={`text-3xl sm:text-4xl font-bold tracking-tight tabular-nums leading-none ${valueClass}`}>
                    {value}
                    {valueSuffix && (
                        <span className="text-base sm:text-lg text-gray-400 font-medium">{valueSuffix}</span>
                    )}
                </p>
                <p className={`text-[11px] mt-1.5 ${detailTone}`}>{detail}</p>
            </div>
            <div className="mt-auto pt-1">{spark}</div>
        </div>
    );
}

function MiniBar({ value, max, accent }) {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    return (
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
                className={`h-full ${accent} rounded-full transition-all duration-700`}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

// ── Circular gauge — animated SVG ring ────────────────────────────────────

function CircularGauge({ value, max = 100, size = 180, stroke = 12, tone = 'gray' }) {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    const dashOffset = circumference * (1 - pct / 100);

    const colors = {
        gray:    { ring: '#e5e7eb', stroke: '#6b7280', text: '#374151' },
        emerald: { ring: '#d1fae5', stroke: '#10b981', text: '#065f46' },
        amber:   { ring: '#fef3c7', stroke: '#f59e0b', text: '#92400e' },
        red:     { ring: '#fee2e2', stroke: '#ef4444', text: '#991b1b' },
        brand:   { ring: '#dde6d3', stroke: '#436235', text: '#1a3c0f' },
    }[tone] || { ring: '#e5e7eb', stroke: '#6b7280', text: '#374151' };

    return (
        <div className="relative inline-flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={colors.ring} strokeWidth={stroke} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl sm:text-5xl font-bold tabular-nums leading-none" style={{ color: colors.text }}>
                    {value != null ? value : '—'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 mt-2">
                    / {max}
                </span>
            </div>
        </div>
    );
}

// ── AI Capability hero — dashboard-style verdict + gauge + detail grid ────

const DEPARTMENT_STYLE = {
    Sales:         { dot: 'bg-rose-400',    chip: 'bg-rose-500/15 text-rose-100 border-rose-300/30' },
    Education:     { dot: 'bg-indigo-400',  chip: 'bg-indigo-500/15 text-indigo-100 border-indigo-300/30' },
    English:       { dot: 'bg-amber-400',   chip: 'bg-amber-500/15 text-amber-100 border-amber-300/30' },
    Immigration:   { dot: 'bg-emerald-400', chip: 'bg-emerald-500/15 text-emerald-100 border-emerald-300/30' },
    Accommodation: { dot: 'bg-cyan-400',    chip: 'bg-cyan-500/15 text-cyan-100 border-cyan-300/30' },
};
const departmentStyle = (d) => DEPARTMENT_STYLE[d] || { dot: 'bg-gray-400', chip: 'bg-white/10 text-white/80 border-white/15' };

function AICapabilityHero({ lead }) {
    const ai = lead?.ai_analysis || {};
    const status = lead?.ai_analysis_status;
    const score = ai.overall_score;
    const verdict = ai.verdict || ai.summary || ai.recommendation || null;
    const pathway = ai.recommended_pathway || ai.pathway || null;
    const department = ai.recommended_department || null;
    const departmentReason = ai.department_reasoning || null;
    const strengths = Array.isArray(ai.strengths) ? ai.strengths : [];
    const concerns = Array.isArray(ai.concerns) ? ai.concerns : (Array.isArray(ai.risks) ? ai.risks : []);
    const nextSteps = Array.isArray(ai.next_steps) ? ai.next_steps : [];
    const deptMeta = departmentStyle(department);

    const meta =
        score == null
            ? { tone: 'gray', label: 'Awaiting AI review', sub: status === 'processing' ? 'Analysis in progress' : 'No assessment yet' }
            : score >= 70
                ? { tone: 'brand', label: 'Strong candidate', sub: 'High likelihood of NZ success' }
                : score >= 40
                    ? { tone: 'amber', label: 'Promising — needs support', sub: 'Address concerns to strengthen profile' }
                    : { tone: 'red', label: 'Significant blockers', sub: 'Major gaps to resolve before applying' };

    return (
        <section className="bg-[#282728] text-white rounded-2xl overflow-hidden">
            {/* Hero row */}
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                {/* Gauge */}
                <div className="lg:col-span-4 flex justify-center">
                    <CircularGauge value={score ?? 0} max={100} tone={meta.tone} size={180} stroke={14} />
                </div>

                {/* Verdict */}
                <div className="lg:col-span-8">
                    <div className="flex items-center gap-2.5 mb-3">
                        <Sparkles size={14} className="text-[#a8c89a]" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#a8c89a]">
                            AI Capability Assessment
                        </p>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">
                        {meta.label}
                    </h2>
                    <p className="text-sm text-white/55 font-light mt-1.5">
                        {meta.sub}
                    </p>

                    {verdict && (
                        <p className="text-sm sm:text-base text-white/80 mt-5 leading-relaxed max-w-2xl font-light">
                            {verdict}
                        </p>
                    )}
                    {!verdict && score == null && status !== 'processing' && (
                        <p className="text-sm text-white/55 mt-5 italic max-w-xl">
                            This lead hasn&apos;t completed the full assessment yet — encourage them to submit the free assessment for an AI-driven capability review.
                        </p>
                    )}

                    <div className="mt-5 flex flex-wrap items-center gap-2">
                        {pathway && (
                            <div className="inline-flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10">
                                <TrendingUp size={13} className="text-[#a8c89a]" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
                                    Pathway
                                </span>
                                <span className="text-sm text-white font-medium">{pathway}</span>
                            </div>
                        )}
                        {department && (
                            <div
                                className={`inline-flex items-center gap-2.5 px-3 py-2 rounded-xl border ${deptMeta.chip}`}
                                title={departmentReason || ''}
                            >
                                <span className={`w-2 h-2 rounded-full ${deptMeta.dot}`} />
                                <span className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-70">
                                    Route to
                                </span>
                                <span className="text-sm font-semibold">{department}</span>
                            </div>
                        )}
                    </div>
                    {department && departmentReason && (
                        <p className="text-[11px] text-white/50 mt-2.5 italic leading-relaxed max-w-2xl">
                            {departmentReason}
                        </p>
                    )}
                </div>
            </div>

            {/* Detail strip — strengths / concerns / next steps */}
            {(strengths.length > 0 || concerns.length > 0 || nextSteps.length > 0) && (
                <div className="bg-white grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-100">
                    {strengths.length > 0 && (
                        <DetailCell icon={<CheckCircle2 size={14} />} label="Strengths" valueList={strengths} tone="emerald" />
                    )}
                    {concerns.length > 0 && (
                        <DetailCell icon={<AlertTriangle size={14} />} label="Concerns" valueList={concerns} tone="amber" />
                    )}
                    {nextSteps.length > 0 && (
                        <DetailCell icon={<ArrowRight size={14} />} label="Next steps" valueList={nextSteps} tone="blue" />
                    )}
                </div>
            )}
        </section>
    );
}

function DetailCell({ icon, label, value, valueList, tone = 'gray' }) {
    const toneIcon = {
        gray:    'text-gray-500 bg-gray-100',
        emerald: 'text-emerald-700 bg-emerald-100',
        amber:   'text-amber-700 bg-amber-100',
        blue:    'text-blue-700 bg-blue-100',
    }[tone];

    return (
        <div className="bg-white px-5 py-4 flex items-start gap-3.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${toneIcon}`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 mb-1.5">
                    {label}
                </p>
                {valueList ? (
                    <ul className="space-y-1">
                        {valueList.slice(0, 5).map((v, i) => (
                            <li key={i} className="text-sm text-gray-700 leading-snug flex items-start gap-1.5">
                                <span className="text-gray-400 mt-1">•</span>
                                <span>{typeof v === 'string' ? v : v?.text || JSON.stringify(v)}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-800 font-medium">{value}</p>
                )}
            </div>
        </div>
    );
}

// ── Activity log — unified source touchpoints + audit log ──────────────────

const ACTIVITY_KIND_STYLE = {
    'source.origin':   { chip: "bg-[#436235]/10 text-[#436235] border-[#436235]/30", label: "Origin" },
    'source.booking':  { chip: "bg-blue-50 text-blue-700 border-blue-200",           label: "Booking" },
    'source.event':    { chip: "bg-purple-50 text-purple-700 border-purple-200",     label: "Event" },
    'source.resubmit': { chip: "bg-amber-50 text-amber-700 border-amber-200",        label: "Resubmit" },
    'lead.updated':    { chip: "bg-gray-100 text-gray-700 border-gray-200",          label: "Update" },
};
const activityStyle = (kind) =>
    ACTIVITY_KIND_STYLE[kind] || { chip: "bg-gray-100 text-gray-700 border-gray-200", label: "Event" };

// ── Journey panel — stage timeline only. Pre-screening/goal-setting are
//    captured via Internal Notes ("kind" selector); key dates live in
//    KeyMilestonesPanel above the two-column row.

function JourneyPanel({ stageTimeline = [] }) {
    return (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-br from-[#436235]/5 to-white flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#436235]/10 text-[#436235] flex items-center justify-center">
                    <TrendingUp size={15} />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">Journey</h2>
            </div>

            <div className="p-6">
                <SectionLabel>Stage timeline</SectionLabel>
                <p className="text-[11px] text-gray-500 mt-1 mb-4">
                    Every stage this lead has moved through. The bold row is where they are right now.
                </p>
                <StageTimeline timeline={stageTimeline} />
            </div>
        </section>
    );
}

// Visual rules per timeline node type.
const TIMELINE_KIND = {
    stage:     { dot: 'bg-white border-gray-300',           dotCurrent: 'bg-[#436235] border-[#436235] ring-4 ring-[#436235]/15', chipFallback: 'bg-gray-100 text-gray-700 border-gray-200' },
    prescreen: { dot: 'bg-amber-100 border-amber-300',      dotCurrent: '', chipFallback: 'bg-amber-50 text-amber-800 border-amber-200' },
    goal:      { dot: 'bg-purple-100 border-purple-300',    dotCurrent: '', chipFallback: 'bg-purple-50 text-purple-800 border-purple-200' },
};

function StageTimeline({ timeline = [] }) {
    const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' }) : '';

    // Reverse so the current stage sits at the top — most recent first.
    const ordered = [...timeline].reverse();

    if (timeline.length === 0) {
        return (
            <div className="text-center py-8 text-xs text-gray-400">
                No stage history yet — every transition will appear here.
            </div>
        );
    }

    return (
        <ol className="relative">
            {/* vertical spine */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" aria-hidden />

            {ordered.map((t, i) => {
                const kind = TIMELINE_KIND[t.type] || TIMELINE_KIND.stage;
                const isStage = t.type === 'stage';
                // For stage rows use the canonical stage palette; pre-screen
                // and goal rows use the kind's fallback so they look
                // visually distinct without flooding the timeline.
                const chip = isStage ? stageClass(t.stage) : kind.chipFallback;
                const kindLabel = t.type === 'prescreen' ? 'Pre-screen' : t.type === 'goal' ? 'Goal' : null;

                return (
                    <li key={i} className="relative pl-7 pb-5 last:pb-0">
                        {/* node dot — filled brand-green for the current stage,
                            color-tinted for pre-screen / goal events, hollow
                            gray for past stages. */}
                        <span
                            className={`absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 ${
                                t.is_current ? kind.dotCurrent : kind.dot
                            }`}
                            aria-hidden
                        />

                        <div className={`flex items-start justify-between gap-3 flex-wrap ${t.is_current ? '' : 'opacity-90'}`}>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {kindLabel && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-gray-100 text-gray-600 border border-gray-200">
                                            {kindLabel}
                                        </span>
                                    )}
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] border uppercase tracking-wider ${chip} ${
                                            t.is_current ? 'font-extrabold ring-1 ring-current/30' : 'font-semibold'
                                        }`}
                                    >
                                        {t.stage}
                                    </span>
                                    {t.is_current && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-[#436235] text-white">
                                            Current
                                        </span>
                                    )}
                                </div>

                                <p className={`mt-1.5 text-[11px] ${t.is_current ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                                    {fmtDate(t.entered_at)} <span className="text-gray-400">{fmtTime(t.entered_at)}</span>
                                </p>

                                {t.detail && (
                                    <p className="mt-1 text-[11px] text-gray-600 italic leading-snug">
                                        “{t.detail}”
                                    </p>
                                )}
                            </div>

                            {t.actor_name && (
                                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                    by {t.actor_name}
                                </span>
                            )}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

// Standalone Key Milestones strip — lives above the Notes / Timeline row
// on the Journey tab so the two key dates pop as the lead's engagement
// timeline. Posts directly to the journey endpoint with just the dates.
function KeyMilestonesPanel({ lead }) {
    const dateOnly = (v) => (v ? String(v).slice(0, 10) : '');
    const [dates, setDates] = useState({
        date_of_first_contact: dateOnly(lead?.date_of_first_contact),
        date_of_engagement:    dateOnly(lead?.date_of_engagement),
    });
    const [saving, setSaving] = useState(false);

    const save = (next) => {
        setDates(next);
        setSaving(true);
        router.post(`/admin/leads/${lead.id}/journey`, next, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setSaving(false),
        });
    };

    const daysBetween = (a, b) => Math.abs(Math.round((new Date(b) - new Date(a)) / 86400000));

    return (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-2 bg-gradient-to-r from-blue-50/40 via-white to-[#436235]/5">
                <div className="flex items-center gap-2.5">
                    <Calendar size={15} className="text-[#436235]" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-800">Key dates</h2>
                </div>
                {saving && <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Saving…</span>}
            </div>

            <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <MilestoneTile
                        eyebrow="First contact"
                        value={dates.date_of_first_contact}
                        onChange={(e) => save({ ...dates, date_of_first_contact: e.target.value })}
                        tone="blue"
                    />
                    <MilestoneTile
                        eyebrow="Engagement"
                        value={dates.date_of_engagement}
                        onChange={(e) => save({ ...dates, date_of_engagement: e.target.value })}
                        tone="brand"
                    />
                </div>
                {dates.date_of_first_contact && dates.date_of_engagement && (
                    <p className="text-[11px] text-gray-500 mt-3 text-center italic">
                        Took {daysBetween(dates.date_of_first_contact, dates.date_of_engagement)} days to convert from first contact to engagement.
                    </p>
                )}
            </div>
        </section>
    );
}

// Highlighted milestone card — big formatted date + "X days ago", with an
// invisible <input type="date"> overlay so clicking the tile opens the
// native date picker.
function MilestoneTile({ eyebrow, value, onChange, tone = 'blue' }) {
    const TONES = {
        blue:  { ring: 'border-blue-200 bg-gradient-to-br from-blue-50 to-white', dot: 'bg-blue-500',           eyebrow: 'text-blue-700',  num: 'text-blue-700',  glyph: 'bg-blue-100 text-blue-700' },
        brand: { ring: 'border-[#436235]/30 bg-gradient-to-br from-[#436235]/8 to-white', dot: 'bg-[#436235]', eyebrow: 'text-[#436235]', num: 'text-[#436235]', glyph: 'bg-[#436235]/10 text-[#436235]' },
    };
    const t = TONES[tone] || TONES.blue;

    const dateObj = value ? new Date(value + 'T00:00:00') : null;
    const formatted = dateObj && !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;
    const daysAgo = dateObj && !isNaN(dateObj.getTime())
        ? Math.round((Date.now() - dateObj.getTime()) / 86400000)
        : null;

    return (
        <label className={`relative block rounded-2xl border-2 ${t.ring} p-4 cursor-pointer hover:shadow-md transition-shadow group`}>
            <div className="flex items-center gap-2 mb-2">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${t.glyph}`}>
                    <Calendar size={13} />
                </span>
                <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${t.eyebrow}`}>{eyebrow}</p>
                <Edit size={10} className="ml-auto text-gray-300 group-hover:text-gray-600 transition-colors" />
            </div>

            {formatted ? (
                <>
                    <p className={`text-xl font-bold tracking-tight tabular-nums ${t.num}`}>{formatted}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                        {daysAgo === 0 ? 'Today'
                            : daysAgo > 0 ? `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`
                                : `In ${Math.abs(daysAgo)} day${Math.abs(daysAgo) === 1 ? '' : 's'}`}
                    </p>
                </>
            ) : (
                <p className="text-base font-medium text-gray-400 italic">Not set</p>
            )}

            {/* Invisible native picker — sits over the tile so clicking
                anywhere opens the calendar. */}
            <input
                type="date"
                value={value}
                onChange={onChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                title={eyebrow}
            />
        </label>
    );
}

function SectionLabel({ children }) {
    return (
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.22em]">{children}</p>
    );
}

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="block text-[11px] font-semibold text-gray-600 mb-1.5">{label}</span>
            {children}
        </label>
    );
}

function ActivityLogPanel({ activity = [] }) {
    if (activity.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
                <Clock size={28} className="mx-auto text-gray-300 mb-3" />
                <p className="text-base font-medium text-gray-700">No activity yet</p>
                <p className="text-sm text-gray-500 font-light mt-1.5">
                    Form submissions and field updates will be logged here.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <History size={16} className="text-gray-400" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">Activity log</h2>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {activity.length} {activity.length === 1 ? "event" : "events"}
                </span>
            </div>
            <ol className="divide-y divide-gray-100">
                {activity.map((entry, i) => (
                    <ActivityRow key={i} entry={entry} />
                ))}
            </ol>
        </div>
    );
}

// Friendly labels for the most common Lead columns. Anything not in this
// map falls through to a snake_case → Sentence-case fallback.
const FIELD_LABELS = {
    status:            'Stage',
    first_name:        'First name',
    last_name:         'Last name',
    email:             'Email',
    phone:             'Phone',
    source:            'Source',
    notes:             'Notes',
    dob:               'Date of birth',
    gender:            'Gender',
    marital_status:    'Marital status',
    country_of_birth:  'Country of birth',
    citizenship:       'Citizenship',
    residence_country: 'Country of residence',
    has_passport:      'Passport',
    education_notes:   'Education notes',
    gap_explanation:   'Gap explanation',
    work_info:         'Work info',
    financial_info:    'Financial info',
    immigration_info:  'Immigration info',
    character_info:    'Character info',
    health_info:       'Health info',
    family_info:       'Family info',
    portal_invited_at: 'Portal invited',
    portal_invitation_sent_at: 'Invitation sent',
};
const fieldLabel = (key) =>
    FIELD_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function ActivityRow({ entry }) {
    const fmt = (iso) => iso ? new Date(iso).toLocaleString("en-NZ", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    }) : "—";

    const isSource = entry.kind?.startsWith('source.');
    const style = activityStyle(entry.kind);

    // The LogsActivity trait stores changes as { field: { old, new } } —
    // NOT { before: {}, after: {} }. Build before/after objects from that
    // per-field shape so we can render a real diff.
    const changesRaw = entry.changes || {};
    const before = {};
    const after  = {};
    !isSource && Object.entries(changesRaw).forEach(([key, val]) => {
        before[key] = val?.old;
        after[key]  = val?.new;
    });
    const isStageChange = !isSource && Object.prototype.hasOwnProperty.call(after, 'status');
    const otherKeys = !isSource ? Object.keys(after).filter((k) => k !== 'status') : [];

    return (
        <li className="px-6 py-4 flex gap-3">
            {/* Kind chip — colour-coded by source / update */}
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider w-[80px] justify-center flex-shrink-0 h-fit mt-0.5 ${style.chip}`}>
                {style.label}
            </span>

            <div className="flex-1 min-w-0">
                {/* Source entries — show form/touchpoint */}
                {isSource && (
                    <>
                        <p className="text-sm font-medium text-gray-900">{entry.title}</p>
                        {entry.detail && (
                            <p className="text-[11px] text-gray-500 mt-0.5">{entry.detail}</p>
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium mt-1.5">
                            {entry.reference && <span className="font-mono">{entry.reference}</span>}
                            <span>{fmt(entry.date)}</span>
                        </div>
                    </>
                )}

                {/* Audit entries — show actor + what changed */}
                {!isSource && (
                    <>
                        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                            <p className="text-sm text-gray-900">
                                <span className="font-semibold">{entry.actor_name || "System"}</span>
                                <span className="text-gray-400 font-normal ml-1.5 text-[10px] uppercase tracking-widest">· {entry.actor_role || "system"}</span>
                            </p>
                            <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                {fmt(entry.date)}
                            </span>
                        </div>

                        {isStageChange && (
                            <p className="text-sm text-gray-700 flex items-center gap-2 flex-wrap">
                                <span>Moved stage to</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${stageClass(after.status)}`}>
                                    {after.status || '—'}
                                </span>
                            </p>
                        )}

                        {/* Field-level diff — what was edited */}
                        {otherKeys.length > 0 && (
                            <div className="mt-1.5">
                                {!isStageChange && (
                                    <p className="text-[11px] text-gray-500 mb-1">
                                        Edited {otherKeys.length} {otherKeys.length === 1 ? 'field' : 'fields'}
                                    </p>
                                )}
                                <ul className="space-y-1">
                                    {otherKeys.slice(0, 6).map((key) => (
                                        <li key={key} className="text-[11px] flex items-start gap-1.5 flex-wrap leading-relaxed">
                                            <span className="font-semibold text-gray-700">{fieldLabel(key)}:</span>
                                            <span className="line-through text-gray-400 max-w-[160px] truncate" title={String(before?.[key] ?? '')}>{formatVal(before?.[key])}</span>
                                            <ArrowRight size={10} className="text-gray-300 mt-1 flex-shrink-0" />
                                            <span className="text-gray-900 font-medium max-w-[220px] truncate" title={String(after[key] ?? '')}>{formatVal(after[key])}</span>
                                        </li>
                                    ))}
                                    {otherKeys.length > 6 && (
                                        <li className="text-[11px] text-gray-400 italic">
                                            + {otherKeys.length - 6} more
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}

                        {!isStageChange && otherKeys.length === 0 && (
                            <p className="text-sm text-gray-600">{entry.title}</p>
                        )}
                    </>
                )}
            </div>
        </li>
    );
}

// ── Legacy — kept for backward compat refs if any ──────────────────────────

function HistoryPanel({ history = [] }) {
    if (history.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
                <Clock size={28} className="mx-auto text-gray-300 mb-3" />
                <p className="text-base font-medium text-gray-700">No history yet</p>
                <p className="text-sm text-gray-500 font-light mt-1.5">
                    Every change to this lead will be logged here with who, what, and when.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
                <History size={16} className="text-gray-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">Activity history</h2>
            </div>
            <ol className="divide-y divide-gray-100">
                {history.map((entry) => (
                    <HistoryRow key={entry.id} entry={entry} />
                ))}
            </ol>
        </div>
    );
}

function HistoryRow({ entry }) {
    const fmt = (iso) => iso ? new Date(iso).toLocaleString("en-NZ", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    }) : "—";

    // The LogsActivity trait stores a `changes` payload with before/after.
    // Stage changes are the most common audit event, so they get a
    // dedicated, human-readable rendering ("moved to X" + colour diff).
    const changes = entry.changes || {};
    const before = changes.before || {};
    const after  = changes.after  || {};
    const isStageChange = Object.prototype.hasOwnProperty.call(after, 'status');

    // Other field keys that aren't `status` — used for the generic diff.
    const otherKeys = Object.keys(after).filter((k) => k !== 'status');

    return (
        <li className="px-6 py-4 flex gap-4">
            {/* Actor avatar */}
            <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                {(entry.actor_name || "S").slice(0, 1).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <p className="text-sm text-gray-900">
                        <span className="font-semibold">{entry.actor_name}</span>
                        <span className="text-gray-400 font-normal ml-1.5 text-xs uppercase tracking-widest">· {entry.actor_role}</span>
                    </p>
                    <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">
                        {fmt(entry.created_at)}
                    </span>
                </div>

                {/* Headline action — stage moves get a specific sentence
                    naming the new stage, everything else falls back to the
                    trait's generic description. */}
                {isStageChange ? (
                    <p className="text-sm text-gray-700 mt-1.5 flex items-center gap-2 flex-wrap">
                        <span>Moved this lead to</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${stageClass(after.status)}`}>
                            {after.status || '—'}
                        </span>
                        {before.status && (
                            <span className="text-xs text-gray-400 inline-flex items-center gap-1.5">
                                from
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase opacity-70 ${stageClass(before.status)}`}>
                                    {before.status}
                                </span>
                            </span>
                        )}
                    </p>
                ) : (
                    <p className="text-sm text-gray-600 mt-1">
                        {entry.description}
                    </p>
                )}

                {/* Other field changes (only render if there are non-stage edits) */}
                {otherKeys.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                        {otherKeys.slice(0, 6).map((key) => (
                            <li key={key} className="text-[11px] text-gray-500 font-mono">
                                <span className="text-gray-400">{key}:</span>{' '}
                                <span className="line-through text-gray-300">{formatVal(before?.[key])}</span>
                                {' → '}
                                <span className="text-gray-700">{formatVal(after[key])}</span>
                            </li>
                        ))}
                        {otherKeys.length > 6 && (
                            <li className="text-[11px] text-gray-400 italic">
                                + {otherKeys.length - 6} more
                            </li>
                        )}
                    </ul>
                )}
            </div>
        </li>
    );
}

// ── Tasks panel — follow-up reminders ────────────────────────────────────

const PRIORITY_STYLE = {
    low:    "bg-gray-100 text-gray-600 border-gray-200",
    normal: "bg-blue-50 text-blue-700 border-blue-200",
    high:   "bg-amber-50 text-amber-700 border-amber-200",
    urgent: "bg-red-100 text-red-700 border-red-200",
};

function TasksPanel({ leadId, tasks, staffOptions, currentUser }) {
    const [title, setTitle] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [dueAt, setDueAt] = useState('');
    const [priority, setPriority] = useState('normal');
    const [assigneeId, setAssigneeId] = useState(currentUser?.id || '');
    const [submitting, setSubmitting] = useState(false);

    const fmt = (iso) => iso
        ? new Date(iso).toLocaleString("en-NZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
        : '';

    const submit = (e) => {
        e?.preventDefault?.();
        if (!title.trim()) return;
        setSubmitting(true);
        router.post(`/admin/leads/${leadId}/tasks`, {
            title: title.trim(),
            due_at: dueAt || null,
            priority,
            assignee_id: assigneeId || null,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setTitle(''); setDueAt(''); setPriority('normal');
                setAssigneeId(currentUser?.id || '');
                setShowOptions(false);
            },
            onFinish: () => setSubmitting(false),
        });
    };

    const toggleComplete = (task) => {
        router.post(`/admin/leads/${leadId}/tasks/${task.id}`,
            { completed: !task.completed },
            { preserveScroll: true, preserveState: true });
    };

    const remove = (task) => {
        confirm('Delete this task?')
            ? router.delete(`/admin/leads/${leadId}/tasks/${task.id}`, { preserveScroll: true, preserveState: true })
            : null;
    };

    const open = tasks.filter((t) => !t.completed);
    const done = tasks.filter((t) => t.completed);
    const overdueCount = open.filter((t) => t.overdue).length;
    const ordered = [...open, ...done];
    const donePct = tasks.length > 0 ? Math.round((done.length / tasks.length) * 100) : 0;

    return (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            {/* Header — title + open/done split + completion bar */}
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gradient-to-br from-amber-50/40 to-white">
                <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                            <Clock size={14} />
                        </div>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-800">Tasks</h2>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest tabular-nums">
                        {overdueCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700">{overdueCount} overdue</span>
                        )}
                        <span className="text-amber-700">{open.length} open</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-gray-400">{done.length} done</span>
                    </div>
                </div>
                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                        style={{ width: `${donePct}%` }}
                    />
                </div>
            </div>

            {/* Always-visible inline compose — expands to show options on focus */}
            <form onSubmit={submit} className="px-5 py-3 border-b border-gray-100 bg-gray-50/40">
                <div className="flex items-center gap-2">
                    <Check size={14} className="text-gray-300 flex-shrink-0" />
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onFocus={() => setShowOptions(true)}
                        placeholder="Add a task — e.g. Call Maria about visa timing"
                        className="flex-1 bg-transparent text-sm placeholder-gray-400 outline-none py-1.5"
                    />
                    {title.trim() && (
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-[11px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-40"
                        >
                            {submitting ? '…' : 'Add'}
                        </button>
                    )}
                </div>
                {showOptions && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 pl-6">
                        <input
                            type="datetime-local"
                            value={dueAt}
                            onChange={(e) => setDueAt(e.target.value)}
                            className="px-2 py-1 border border-gray-200 rounded-md text-[11px] bg-white outline-none focus:border-gray-400"
                            title="Due date/time"
                        />
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="px-2 py-1 border border-gray-200 rounded-md text-[11px] bg-white outline-none focus:border-gray-400"
                            title="Priority"
                        >
                            <option value="low">Low</option>
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                        <select
                            value={assigneeId}
                            onChange={(e) => setAssigneeId(e.target.value)}
                            className="px-2 py-1 border border-gray-200 rounded-md text-[11px] bg-white outline-none focus:border-gray-400"
                            title="Assignee"
                        >
                            <option value="">Unassigned</option>
                            {staffOptions.map((u) => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => { setShowOptions(false); setTitle(''); setDueAt(''); setPriority('normal'); }}
                            className="text-[10px] text-gray-400 hover:text-gray-700 uppercase tracking-widest font-bold ml-auto"
                        >
                            Reset
                        </button>
                    </div>
                )}
            </form>

            {/* List */}
            {tasks.length === 0 ? (
                <div className="px-5 py-8 text-center text-xs text-gray-400">
                    No tasks yet — set a follow-up so this lead doesn&apos;t go cold.
                </div>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {ordered.map((t) => {
                        const canDelete = currentUser && (currentUser.is_admin || currentUser.id === t.created_by);
                        const priorityStyle = PRIORITY_STYLE[t.priority] || PRIORITY_STYLE.normal;
                        const attachments = Array.isArray(t.attachments) ? t.attachments : [];
                        return (
                            <li
                                key={t.id}
                                className={`group px-5 py-2.5 transition-colors hover:bg-gray-50/50 ${t.completed ? 'opacity-50' : ''} ${t.overdue ? 'bg-red-50/30' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Checkbox */}
                                    <button
                                        type="button"
                                        onClick={() => toggleComplete(t)}
                                        className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${t.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 hover:border-gray-900'}`}
                                        title={t.completed ? 'Mark incomplete' : 'Mark complete'}
                                    >
                                        {t.completed && <Check size={11} strokeWidth={3} />}
                                    </button>

                                    {/* Title + inline meta */}
                                    <div className="flex-1 min-w-0 flex items-center gap-2.5 flex-wrap">
                                        <span className={`text-sm ${t.completed ? 'line-through text-gray-400' : 'text-gray-900 font-medium'} truncate`}>
                                            {t.title}
                                        </span>
                                        {t.priority !== 'normal' && (
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${priorityStyle}`}>
                                                {t.priority}
                                            </span>
                                        )}
                                        {t.due_at && (
                                            <span className={`text-[10px] font-semibold tabular-nums ${t.overdue ? 'text-red-600' : 'text-gray-400'}`}>
                                                {t.overdue ? '⚠ ' : ''}{fmt(t.due_at)}
                                            </span>
                                        )}
                                        {attachments.length > 0 && (
                                            <span
                                                className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400"
                                                title={`${attachments.length} attachment${attachments.length === 1 ? '' : 's'}`}
                                            >
                                                <Paperclip size={10} /> {attachments.length}
                                            </span>
                                        )}
                                    </div>

                                    {/* Assignee avatar */}
                                    {t.assignee && (
                                        <span
                                            className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                                            title={t.assignee.name}
                                        >
                                            {t.assignee.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                                        </span>
                                    )}

                                    {/* Hover-revealed delete */}
                                    {canDelete && (
                                        <button
                                            type="button"
                                            onClick={() => remove(t)}
                                            className="text-[10px] uppercase tracking-widest font-bold text-gray-300 hover:text-red-600 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>

                                {/* Attachment thumbnails — visible when the task has files
                                    uploaded via the Task Board. Images render as 40×40
                                    previews, everything else as a typed pill with the
                                    filename truncated. Clicking opens the file in a new tab. */}
                                {attachments.length > 0 && (
                                    <div className="mt-2 ml-[30px] flex flex-wrap items-center gap-2">
                                        {attachments.map((a) => (
                                            <TaskAttachmentChip key={a.id} attachment={a} />
                                        ))}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}

// Small typed chip for task attachments shown inline on the lead-detail
// Tasks card. Images use a thumbnail; other file types fall back to a
// content-type icon. Click opens the asset in a new tab — the storage url
// (Storage::disk('public')) is public-readable per LeadTaskAttachment::$appends.
function TaskAttachmentChip({ attachment: a }) {
    const ext  = (a.original_filename || '').split('.').pop()?.toUpperCase().slice(0, 4) || 'FILE';
    const mime = (a.mime_type || '').toLowerCase();
    const Icon = a.is_image ? FileImage
        : mime.startsWith('video/') ? Film
        : mime.startsWith('audio/') ? Music
        : FileText;

    if (a.is_image) {
        return (
            <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                title={a.original_filename}
                className="block w-10 h-10 rounded-md overflow-hidden border border-gray-200 hover:border-gray-400 transition-colors flex-shrink-0"
            >
                <img src={a.url} alt={a.original_filename} className="w-full h-full object-cover" />
            </a>
        );
    }
    return (
        <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            title={a.original_filename}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-400 text-[10px] font-semibold text-gray-700 max-w-[180px] transition-colors"
        >
            <Icon size={11} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{a.original_filename}</span>
            <span className="font-mono text-[9px] text-gray-400 flex-shrink-0">{ext}</span>
        </a>
    );
}

// ── Tags panel — free-form labels with auto-suggest ──────────────────────

const TAG_COLOR_STYLE = {
    gray:    "bg-gray-100 text-gray-700 border-gray-200",
    red:     "bg-red-100 text-red-700 border-red-200",
    amber:   "bg-amber-100 text-amber-700 border-amber-200",
    green:   "bg-green-100 text-green-800 border-green-200",
    blue:    "bg-blue-100 text-blue-700 border-blue-200",
    purple:  "bg-purple-100 text-purple-700 border-purple-200",
    pink:    "bg-pink-100 text-pink-700 border-pink-200",
    cyan:    "bg-cyan-100 text-cyan-700 border-cyan-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    fuchsia: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
};
const tagColor = (c) => TAG_COLOR_STYLE[c] || TAG_COLOR_STYLE.gray;

function TagsPanel({ leadId, tags, allTags }) {
    const [input, setInput] = useState('');
    const [focused, setFocused] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const attachedIds = new Set(tags.map((t) => t.id));
    const suggestions = input.trim()
        ? allTags
            .filter((t) => t.name.toLowerCase().includes(input.trim().toLowerCase()) && !attachedIds.has(t.id))
            .slice(0, 6)
        : [];

    const attach = (name) => {
        const clean = (name || '').trim();
        if (!clean) return;
        setSubmitting(true);
        router.post(`/admin/leads/${leadId}/tags`, { name: clean }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setInput(''),
            onFinish: () => setSubmitting(false),
        });
    };

    const detach = (tag) => router.delete(`/admin/leads/${leadId}/tags/${tag.id}`, { preserveScroll: true, preserveState: true });

    const onKey = (e) => {
        e.key === 'Enter'
            ? (e.preventDefault(), attach(input))
            : null;
    };

    return (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gradient-to-br from-purple-50/40 to-white">
                <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                            <TrendingUp size={14} />
                        </div>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-800">Tags</h2>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 tabular-nums">
                        {tags.length} {tags.length === 1 ? "tag" : "tags"}
                    </span>
                </div>
                {/* Colour ribbon preview — shows the palette of attached tags */}
                <div className="flex items-center gap-1 h-1.5">
                    {tags.length === 0 ? (
                        <div className="w-full h-full rounded-full bg-gray-100" />
                    ) : (
                        tags.map((t) => (
                            <span
                                key={t.id}
                                className={`flex-1 h-full rounded-full ${tagColor(t.color).split(' ')[0]}`}
                                title={t.name}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Single chip-row — attached chips + inline add input in one
                visual band. Feels like a real tag editor, no separate
                "Add" button row. */}
            <div className="px-5 py-3.5 relative">
                <div
                    className={`flex flex-wrap items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-colors ${
                        focused ? 'border-gray-900 bg-white' : 'border-gray-200 bg-gray-50/60 hover:bg-white'
                    }`}
                >
                    {tags.map((t) => (
                        <span
                            key={t.id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${tagColor(t.color)}`}
                        >
                            {t.name}
                            <button
                                type="button"
                                onClick={() => detach(t)}
                                className="opacity-50 hover:opacity-100 transition-opacity ml-0.5"
                                title="Remove tag"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKey}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setTimeout(() => setFocused(false), 150)}
                        placeholder={tags.length === 0 ? "Type a tag — HOT, BUDGET, FAMILY… press Enter to add" : "Add tag…"}
                        disabled={submitting}
                        className="flex-1 min-w-[140px] bg-transparent text-xs placeholder-gray-400 outline-none py-1 px-1"
                    />
                </div>

                {/* Suggestions popover */}
                {focused && suggestions.length > 0 && (
                    <div className="absolute z-10 left-5 right-5 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg py-1">
                        <p className="px-3 pt-1 pb-1 text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Existing tags</p>
                        {suggestions.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); attach(s.name); }}
                                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${tagColor(s.color)}`}>
                                    {s.name}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

// ── Notes panel — internal staff notes ───────────────────────────────────

// ── Documents tab — checklist of required NZ application docs ────────────

function DocumentsPanel({ lead, checklistFiles = {}, currentUser = null }) {
    // The lead's saved checklist state lives on the backend in a JSON column
    // keyed by item id. We keep a local copy here so edits feel instant and
    // we can debounce notes typing if needed.
    const initial = lead?.document_checklist || {};
    const [state, setState] = useState(initial);
    const [verifications, setVerifications] = useState(lead?.section_verifications || {});
    // Which section folder is currently open — null = show the folder grid.
    const [openFolder, setOpenFolder] = useState(null);

    const saveSectionStatus = (sectionKey, status, notes = null) => {
        const next = { ...verifications, [sectionKey]: { ...(verifications[sectionKey] || {}), status, ...(notes !== null ? { notes } : {}) } };
        setVerifications(next);
        router.post(`/admin/leads/${lead.id}/documents/section-verification`, {
            section_key: sectionKey,
            status,
            notes,
        }, { preserveScroll: true, preserveState: true });
    };

    const save = (itemId, patch) => {
        const next = { ...state, [itemId]: { ...(state[itemId] || {}), ...patch } };
        setState(next);

        router.post(`/admin/leads/${lead.id}/documents/checklist`, {
            key:    itemId,
            status: next[itemId].status ?? null,
            date:   next[itemId].date   ?? null,
            notes:  next[itemId].notes  ?? null,
        }, { preserveScroll: true, preserveState: true });
    };

    // High-level progress strip — count items where the lead has actually
    // uploaded a file, plus the manually-set status counts.
    const allItems = CHECKLIST.flatMap((s) => s.items);
    const total = allItems.length;
    const counts = allItems.reduce((acc, it) => {
        const s = state[it.id]?.status;
        s ? (acc[s] = (acc[s] || 0) + 1) : null;
        return acc;
    }, {});
    const withFiles = allItems.filter((it) => (checklistFiles[it.id]?.length || 0) > 0).length;
    const uploaded = counts.uploaded || 0;
    const inProgress = counts.in_progress || 0;
    const available = counts.available || 0;
    const notApplicable = counts.not_applicable || 0;
    const remaining = total - uploaded - notApplicable;
    const pct = total > 0 ? Math.round((uploaded / (total - notApplicable || 1)) * 100) : 0;

    return (
        <div className="space-y-4">
            {/* Progress header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-br from-emerald-50/40 to-white flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <FolderOpen size={16} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">Documents</h2>
                            <p className="text-[11px] text-gray-500 mt-0.5">Submit + view — checklist of every document this lead needs.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest tabular-nums">
                        <span className="text-[#436235]">{withFiles} with files</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-emerald-700">{uploaded} uploaded</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-purple-700">{inProgress} in progress</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-amber-700">{available} available</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-gray-500">{remaining} remaining</span>
                    </div>
                </div>
                <div className="px-6 py-3 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] font-bold text-gray-600 tabular-nums">{pct}%</span>
                </div>
            </div>

            {/* Important notes */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <Info size={16} className="text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-amber-800 mb-1.5">Important notes</p>
                    <ul className="text-xs text-amber-900 space-y-0.5 leading-relaxed">
                        {IMPORTANT_NOTES.map((n, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                                <span className="text-amber-600 mt-1">•</span>
                                <span>{n}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Either the folder grid (overview) or one folder's contents
                (drill-in view) — toggled by openFolder state. */}
            {openFolder === null ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {CHECKLIST.map((section, idx) => (
                        <FolderCard
                            key={section.section}
                            section={section}
                            stats={sectionStats(section, state, checklistFiles)}
                            verification={verifications[section.key]}
                            onClick={() => setOpenFolder(section.section)}
                            paletteIndex={idx}
                        />
                    ))}
                </div>
            ) : (
                <FolderDetail
                    section={CHECKLIST.find((s) => s.section === openFolder)}
                    lead={lead}
                    state={state}
                    onSave={save}
                    checklistFiles={checklistFiles}
                    currentUser={currentUser}
                    verification={verifications[CHECKLIST.find((s) => s.section === openFolder)?.key]}
                    onVerify={(status, notes) => saveSectionStatus(CHECKLIST.find((s) => s.section === openFolder).key, status, notes)}
                    onBack={() => setOpenFolder(null)}
                />
            )}
        </div>
    );
}

// Aggregate per-folder counts used by both the folder card and the drill-in
// header. Done in one place so the two surfaces stay consistent.
function sectionStats(section, state, checklistFiles) {
    let totalFiles = 0, totalBytes = 0, withFiles = 0, uploaded = 0;
    section.items.forEach((it) => {
        const fs = checklistFiles[it.id] || [];
        totalFiles += fs.length;
        totalBytes += fs.reduce((s, f) => s + (f.size || 0), 0);
        fs.length > 0 ? withFiles++ : null;
        state[it.id]?.status === 'uploaded' ? uploaded++ : null;
    });
    return { totalFiles, totalBytes, withFiles, uploaded, docCount: section.items.length };
}

// Folder tab colour palette — purely for visual variety so each folder
// in the grid feels distinct. Body stays white either way. Picked by
// position in the section list so adjacent folders never share a tab.
const FOLDER_TAB_PALETTE = [
    { tab: 'bg-blue-500',    bar: 'bg-blue-500' },
    { tab: 'bg-emerald-500', bar: 'bg-emerald-500' },
    { tab: 'bg-violet-500',  bar: 'bg-violet-500' },
    { tab: 'bg-amber-500',   bar: 'bg-amber-500' },
    { tab: 'bg-pink-500',    bar: 'bg-pink-500' },
    { tab: 'bg-cyan-500',    bar: 'bg-cyan-500' },
    { tab: 'bg-orange-500',  bar: 'bg-orange-500' },
    { tab: 'bg-rose-500',    bar: 'bg-rose-500' },
    { tab: 'bg-teal-500',    bar: 'bg-teal-500' },
    { tab: 'bg-fuchsia-500', bar: 'bg-fuchsia-500' },
];

function FolderCard({ section, stats, onClick, paletteIndex = 0, verification = null }) {
    const { totalFiles, totalBytes, withFiles, docCount } = stats;
    const completion = docCount > 0 ? Math.round((withFiles / docCount) * 100) : 0;
    const { tab: tabSurface, bar: barColor } = FOLDER_TAB_PALETTE[paletteIndex % FOLDER_TAB_PALETTE.length];
    const verStatus = verification?.status;
    const verMeta = verStatus ? SECTION_STATUSES[verStatus] : null;

    return (
        <button
            type="button"
            onClick={onClick}
            className="relative pt-3 text-left group/folder"
        >
            {/* Folder tab silhouette (only this changes colour) */}
            <div className={`absolute top-0 left-5 w-24 h-3 rounded-t-lg ${tabSurface}`} aria-hidden />
            <div className={`absolute top-2.5 left-[100px] w-3 h-3 ${tabSurface}`} style={{ clipPath: 'polygon(0 100%, 0 0, 100% 100%)' }} aria-hidden />

            <div className="bg-white text-gray-900 rounded-2xl rounded-tl-md shadow-lg group-hover/folder:shadow-xl group-hover/folder:-translate-y-0.5 transition-all p-5 min-h-[160px] flex flex-col border border-gray-100">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold leading-tight tracking-tight pr-2 text-gray-900">{section.section}</h3>
                    {verMeta && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border whitespace-nowrap flex-shrink-0 ${verMeta.chip}`}>
                            {verMeta.label}
                        </span>
                    )}
                </div>

                <p className="text-[12px] font-medium mt-1.5 text-gray-500">
                    {docCount} {docCount === 1 ? 'doc' : 'docs'}
                </p>

                <div className="flex-1" />

                <div className="space-y-2">
                    <p className="text-[11px] font-medium text-gray-600 tabular-nums">
                        {withFiles} of {docCount} uploaded
                    </p>
                    <div className="h-1 rounded-full overflow-hidden bg-gray-100">
                        <div
                            className={`h-full ${withFiles > 0 ? barColor : 'bg-gray-200'} rounded-full transition-all duration-700`}
                            style={{ width: `${completion}%` }}
                        />
                    </div>
                </div>
            </div>
        </button>
    );
}

// Drill-in view — header with back + folder summary + verification actions,
// then the existing ChecklistCard gallery for items inside the folder.
function FolderDetail({ section, lead, state, onSave, checklistFiles, currentUser, verification, onVerify, onBack }) {
    const stats = sectionStats(section, state, checklistFiles);
    const verStatus = verification?.status;
    const verMeta = verStatus ? SECTION_STATUSES[verStatus] : null;
    const [revisionsOpen, setRevisionsOpen] = useState(false);
    const [revisionsNote, setRevisionsNote] = useState(verification?.notes || '');

    const submitRevisions = () => {
        onVerify('revisions_needed', revisionsNote || null);
        setRevisionsOpen(false);
    };

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 transition-colors"
                    >
                        <ArrowLeft size={12} />
                        All folders
                    </button>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">Folder</p>
                        <h2 className="text-xl font-bold tracking-tight text-gray-900">{section.section}</h2>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest tabular-nums">
                        <span className="text-gray-700">{stats.docCount} docs</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-emerald-700">{stats.withFiles} with files</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-gray-500">{fmtTotalSize(stats.totalBytes)}</span>
                    </div>
                </div>

                {/* Verification action bar — gates the lead's next section. */}
                <div className="border-t border-gray-100 pt-4 flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">Section status</p>
                        {verMeta ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${verMeta.chip}`}>
                                {verMeta.label}
                            </span>
                        ) : (
                            <span className="text-[11px] italic text-gray-400">Not yet reviewed</span>
                        )}
                        {verification?.verified_by && (
                            <span className="text-[10px] text-gray-400">by {verification.verified_by}</span>
                        )}
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setRevisionsOpen((o) => !o)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-rose-700 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 transition-colors"
                        >
                            <AlertTriangle size={12} />
                            Request revisions
                        </button>
                        <button
                            type="button"
                            onClick={() => onVerify('verified')}
                            disabled={verStatus === 'verified'}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckCircle2 size={12} />
                            {verStatus === 'verified' ? 'Verified' : 'Verify section'}
                        </button>
                    </div>
                </div>

                {/* Revisions note inline editor */}
                {revisionsOpen && (
                    <div className="border-t border-gray-100 pt-4 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-rose-700">
                            What does the lead need to fix?
                        </p>
                        <textarea
                            value={revisionsNote}
                            onChange={(e) => setRevisionsNote(e.target.value)}
                            rows={2}
                            placeholder="e.g. Passport scan is unclear — please re-upload a higher-res copy."
                            className="w-full px-3 py-2 border border-rose-200 rounded-lg text-sm bg-white outline-none focus:border-rose-400 resize-none"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setRevisionsOpen(false)}
                                className="text-[10px] uppercase tracking-widest font-bold text-gray-500 px-3 py-1.5"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={submitRevisions}
                                className="text-[10px] uppercase tracking-widest font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-md"
                            >
                                Send revisions
                            </button>
                        </div>
                    </div>
                )}

                {/* Existing revisions note (read-only) */}
                {!revisionsOpen && verStatus === 'revisions_needed' && verification?.notes && (
                    <div className="border-t border-gray-100 pt-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-rose-700 mb-1">Revisions requested</p>
                        <p className="text-xs text-rose-900 italic leading-relaxed">{verification.notes}</p>
                    </div>
                )}

                {/* Lead's in-portal acknowledgment — only surfaced inside
                    the Agreements folder. Shows green when ticked, gray
                    when still awaiting. */}
                {section.key === 'agreements' && (
                    <div className="border-t border-gray-100 pt-4">
                        {lead?.agreements_acknowledged_at ? (
                            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                                <CheckCircle2 size={14} className="text-emerald-600" />
                                <p className="text-xs font-semibold text-emerald-800">
                                    Lead acknowledged the agreements on {new Date(lead.agreements_acknowledged_at).toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                                <Clock size={14} className="text-amber-600" />
                                <p className="text-xs font-semibold text-amber-800">
                                    Waiting for the lead to acknowledge both agreements in their portal.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ChecklistSection
                section={section}
                lead={lead}
                state={state}
                onSave={onSave}
                checklistFiles={checklistFiles}
                currentUser={currentUser}
            />
        </div>
    );
}

// Sum the total bytes uploaded against a checklist item — used by the
// folder card's stat line so each card reads "N files · X MB".
const sumSize = (files = []) => files.reduce((t, f) => t + (f.size || 0), 0);
const fmtTotalSize = (b) => {
    if (!b) return '0 KB';
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
    if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
    return `${(b / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

// Inner doc-card palette — status drives a colored top accent + footer tint
// on an otherwise clean white card. Reverts to the original design used
// before the folder redesign, since inner cards are not folders themselves.
const CARD_TONE = {
    uploaded:       { border: "border-emerald-200", bar: "bg-emerald-400", glyph: "bg-emerald-100 text-emerald-700", cap: "bg-emerald-50/40" },
    in_progress:    { border: "border-purple-200",  bar: "bg-purple-400",  glyph: "bg-purple-100 text-purple-700",   cap: "bg-purple-50/40"  },
    available:      { border: "border-amber-200",   bar: "bg-amber-400",   glyph: "bg-amber-100 text-amber-700",     cap: "bg-amber-50/40"   },
    not_applicable: { border: "border-gray-200",    bar: "bg-gray-300",    glyph: "bg-gray-100 text-gray-400",       cap: "bg-gray-50/60", muted: true },
    unset:          { border: "border-gray-100",    bar: "bg-gray-200",    glyph: "bg-gray-50 text-gray-500",        cap: "bg-white" },
};
const cardTone = (status) => CARD_TONE[status] || CARD_TONE.unset;

// Sort priority — has-files first, then uploaded > in_progress > available
// > unset > not_applicable. Cards with actual work done float to the top
// of each section so you can see progress at a glance.
const SORT_PRIORITY = {
    uploaded:       1,
    in_progress:    2,
    available:      3,
    unset:          4,
    not_applicable: 5,
};

function ChecklistSection({ section, lead, state, onSave, checklistFiles = {}, currentUser = null }) {
    const sortedItems = [...section.items].sort((a, b) => {
        const aHasFiles = (checklistFiles[a.id]?.length || 0) > 0;
        const bHasFiles = (checklistFiles[b.id]?.length || 0) > 0;
        if (aHasFiles !== bHasFiles) return aHasFiles ? -1 : 1;
        const aPri = SORT_PRIORITY[state[a.id]?.status || 'unset'] || 4;
        const bPri = SORT_PRIORITY[state[b.id]?.status || 'unset'] || 4;
        return aPri - bPri;
    });

    return (
        <section>
            <div className="flex items-baseline justify-between mb-2.5 px-1">
                <div className="flex items-center gap-2.5">
                    <div className="w-1 h-4 bg-[#436235] rounded-full" />
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-800">{section.section}</h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 tabular-nums">
                    {section.items.length} {section.items.length === 1 ? "doc" : "docs"}
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {sortedItems.map((item) => (
                    <ChecklistCard
                        key={item.id}
                        item={item}
                        lead={lead}
                        entry={state[item.id] || {}}
                        onSave={onSave}
                        files={checklistFiles[item.id] || []}
                        currentUser={currentUser}
                    />
                ))}
            </div>
        </section>
    );
}

function ChecklistCard({ item, lead, entry, onSave, files = [], currentUser = null }) {
    const [notesDraft, setNotesDraft] = useState(entry.notes || "");
    const [statusOpen, setStatusOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [generateOpen, setGenerateOpen] = useState(false);
    const [generating, setGenerating] = useState(false);
    const fileInputRef = useRef(null);
    const filename = renderFilename(item.filename, lead);
    const status = entry.status || null;
    const fileCount = files.length;

    // Both checklist items support auto-generation:
    //   agree.consultancy        — Single/Partner variant (opens a picker modal)
    //   agree.engagement_english — Single template (generates directly)
    const canGenerate = item.id === 'agree.consultancy' || item.id === 'agree.engagement_english';
    const needsVariantPicker = item.id === 'agree.consultancy';
    const hasGenerated = files.some(f => f.source === 'generated');

    const runGenerate = (variant) => {
        setGenerating(true);
        const form = new FormData();
        if (variant) form.append('variant', variant);
        router.post(`/admin/leads/${lead.id}/documents/checklist/${item.id}/generate`, form, {
            preserveScroll: true,
            preserveState: true,
            forceFormData: true,
            onFinish: () => {
                setGenerating(false);
                setGenerateOpen(false);
            },
        });
    };

    // Click handler — consultancy opens the variant picker, engagement
    // generates inline since there's only one template.
    const handleGenerateClick = () => {
        if (needsVariantPicker) {
            setGenerateOpen(true);
        } else {
            runGenerate(null);
        }
    };

    const copyFilename = () => {
        filename && navigator.clipboard?.writeText(filename);
    };

    const flushNotes = () => {
        if ((notesDraft || "") !== (entry.notes || "")) {
            onSave(item.id, { notes: notesDraft || null });
        }
    };

    const triggerUpload = () => fileInputRef.current?.click();

    const handleFiles = (e) => {
        const picked = Array.from(e.target.files || []);
        if (picked.length === 0) return;
        const form = new FormData();
        picked.forEach((f) => form.append('files[]', f));
        setUploading(true);
        router.post(`/admin/leads/${lead.id}/documents/checklist/${item.id}/upload`, form, {
            preserveScroll: true,
            preserveState: true,
            forceFormData: true,
            onFinish: () => {
                setUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    const removeFile = (file) => {
        if (!confirm(`Delete ${file.original_name}?`)) return;
        router.delete(`/admin/leads/${lead.id}/documents/${file.id}`, { preserveScroll: true, preserveState: true });
    };

    const fmtSize = (b) => {
        if (!b) return '';
        if (b < 1024) return `${b} B`;
        if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
        return `${(b / (1024 * 1024)).toFixed(1)} MB`;
    };
    const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

    const tone = cardTone(status);

    return (
        <article className={`bg-white rounded-2xl border-2 ${tone.border} shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col ${tone.muted ? "opacity-70" : ""}`}>
            {/* Accent bar — colored by status */}
            <div className={`h-1 ${tone.bar}`} />

            <div className="p-4 flex-1 flex flex-col gap-3">
                {/* Header — glyph + title */}
                <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tone.glyph}`}>
                        <FileText size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm font-semibold text-gray-900 leading-snug">{item.name}</h4>
                            {item.system && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-[#436235]/10 text-[#436235] border border-[#436235]/20">
                                    System
                                </span>
                            )}
                            {fileCount > 0 && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-700 border border-emerald-200">
                                    <FolderOpen size={9} />
                                    {fileCount} {fileCount === 1 ? 'file' : 'files'}
                                </span>
                            )}
                        </div>
                        {item.description && (
                            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{item.description}</p>
                        )}
                    </div>
                </div>

                {/* Filename hint */}
                {filename && (
                    <button
                        type="button"
                        onClick={copyFilename}
                        className="group/fn inline-flex items-center gap-1.5 text-[11px] font-mono text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md px-2 py-1.5 transition-colors self-start max-w-full"
                        title="Copy filename to clipboard"
                    >
                        <span className="truncate">{filename}</span>
                        <Copy size={10} className="text-gray-400 group-hover/fn:text-gray-700 flex-shrink-0" />
                    </button>
                )}

                {/* Uploaded files list — each file is a row with download +
                    delete. Uploaded by the lead OR by staff on their behalf.
                    Files with source='generated' get a violet pill so staff
                    can tell auto-generated PDFs apart from manual uploads. */}
                {fileCount > 0 && (
                    <ul className="space-y-1.5">
                        {files.map((f) => (
                            <li key={f.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-200 group/file">
                                {f.source === 'generated' ? (
                                    <Wand2 size={12} className="text-violet-500 flex-shrink-0" />
                                ) : (
                                    <FileText size={12} className="text-gray-400 flex-shrink-0" />
                                )}
                                <a
                                    href={`/admin/documents/${f.id}/download?inline=1`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 min-w-0 text-[11px] font-medium text-gray-800 hover:text-blue-600 truncate"
                                    title={`View ${f.original_name}`}
                                >
                                    {f.original_name}
                                </a>
                                {f.source === 'generated' && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-violet-100 text-violet-700 border border-violet-200">
                                        <Sparkles size={9} />
                                        {f.source_variant?.includes('partner') ? 'Generated · Partner' : f.source_variant?.includes('single') ? 'Generated · Single' : 'Generated'}
                                    </span>
                                )}
                                <span className="text-[10px] text-gray-400 tabular-nums hidden sm:inline">
                                    {fmtSize(f.size)}
                                </span>
                                <span className="text-[10px] text-gray-400 tabular-nums hidden md:inline">
                                    {fmtDate(f.created_at)}
                                </span>
                                <a
                                    href={`/admin/documents/${f.id}/download?inline=1`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center w-6 h-6 rounded text-gray-500 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                                    title="View"
                                >
                                    <Eye size={11} />
                                </a>
                                <a
                                    href={`/admin/documents/${f.id}/download`}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                    title="Download"
                                >
                                    <Download size={11} />
                                </a>
                                <button
                                    type="button"
                                    onClick={() => removeFile(f)}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover/file:opacity-100"
                                    title="Delete file"
                                >
                                    <XCircle size={11} />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Upload button + hidden input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFiles}
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={triggerUpload}
                    disabled={uploading}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border-2 border-dashed border-gray-300 rounded-lg text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-800 hover:border-gray-400 hover:bg-gray-50/80 transition-all disabled:opacity-50"
                >
                    <Download size={12} className="rotate-180" />
                    {uploading ? 'Uploading…' : fileCount > 0 ? 'Upload another' : 'Upload file(s)'}
                </button>

                {/* Auto-generate (Consultancy Agreement only). Renders the
                    Blade template -> PDF and attaches it to this checklist
                    item. Solid violet so it's unmissable next to the dashed
                    upload button. */}
                {canGenerate && (
                    <button
                        type="button"
                        onClick={handleGenerateClick}
                        disabled={generating}
                        style={{ backgroundColor: '#7c3aed', color: '#ffffff' }}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-60 shadow-sm"
                    >
                        <Wand2 size={12} />
                        {generating ? 'Generating…' : hasGenerated ? 'Re-generate Agreement' : 'Generate Agreement'}
                    </button>
                )}

                {/* Spacer pushes the footer to the card bottom */}
                <div className="flex-1" />

                {/* Footer band — status, date, notes */}
                <div className={`-mx-4 -mb-4 px-4 pt-3 pb-3 border-t border-gray-100 ${tone.cap} space-y-2`}>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <button
                                type="button"
                                onClick={() => setStatusOpen((o) => !o)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border w-full justify-between ${
                                    status ? STATUS_CHIP[status] : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50"
                                }`}
                            >
                                <span className="truncate">{status ? STATUS_LABEL[status] : "Set status"}</span>
                                <ChevronDown size={10} className="flex-shrink-0 opacity-60" />
                            </button>

                            {statusOpen && (
                                <div className="absolute z-20 bottom-full mb-1 left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[150px]">
                                    {STATUSES.map((s) => (
                                        <button
                                            key={s.key}
                                            type="button"
                                            onClick={() => { onSave(item.id, { status: s.key }); setStatusOpen(false); }}
                                            className="w-full text-left px-2 py-1.5 hover:bg-gray-50"
                                        >
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${s.chip}`}>
                                                {s.label}
                                            </span>
                                        </button>
                                    ))}
                                    {status && (
                                        <button
                                            type="button"
                                            onClick={() => { onSave(item.id, { status: null }); setStatusOpen(false); }}
                                            className="w-full text-left px-2 py-1.5 text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:bg-gray-50 border-t border-gray-100 mt-1"
                                        >
                                            Clear status
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <input
                            type="date"
                            value={entry.date || ""}
                            onChange={(e) => onSave(item.id, { date: e.target.value || null })}
                            className="px-2 py-1 border border-gray-200 rounded-md text-[11px] bg-white outline-none focus:border-gray-400 w-[125px]"
                            title="Date"
                        />
                    </div>

                    <input
                        type="text"
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        onBlur={flushNotes}
                        placeholder="Add a note…"
                        className="w-full px-2 py-1 border border-gray-200 rounded-md text-[11px] bg-white outline-none focus:border-gray-400"
                    />
                </div>
            </div>

            {generateOpen && (
                <GenerateAgreementModal
                    lead={lead}
                    onClose={() => !generating && setGenerateOpen(false)}
                    onConfirm={runGenerate}
                    generating={generating}
                />
            )}
        </article>
    );
}

// Variant-picker modal for Consultancy Agreement generation. The lead's
// marital_status pre-selects Partner when relevant ("Married", "Partnered",
// "De Facto", etc.) but staff can always override.
function GenerateAgreementModal({ lead, onClose, onConfirm, generating }) {
    const suggestedPartner = /married|partner|de\s*facto|spouse/i.test(lead?.marital_status || '');
    const [variant, setVariant] = useState(suggestedPartner ? 'partner' : 'single');
    const clientName = `${lead?.first_name || ''} ${lead?.last_name || ''}`.trim() || 'this lead';

    // Portal to document.body so the modal escapes any ancestor transforms
    // (the checklist card sits in a grid with framer-motion higher up that
    // creates a containing block, breaking position:fixed otherwise).
    if (typeof document === 'undefined') return null;
    return createPortal((
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-violet-100 text-violet-700 rounded-md text-[10px] font-bold uppercase tracking-widest mb-2">
                            <Wand2 size={11} /> AI-assisted
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Generate Consultancy Agreement</h2>
                        <p className="text-sm text-gray-500 mt-1.5">Pick the variant for <span className="font-semibold text-gray-700">{clientName}</span>. The PDF is attached to this lead's documents and visible in their portal.</p>
                    </div>
                    <button onClick={onClose} disabled={generating} className="text-gray-400 hover:text-gray-700 p-1 rounded disabled:opacity-50 flex-shrink-0">
                        <XCircle size={22} />
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { key: 'single',  title: 'SINGLE',  sub: 'Applicant only',           fee: 'PhP 100,000', icon: <User size={22} /> },
                        { key: 'partner', title: 'PARTNER', sub: 'Main applicant + partner', fee: 'PhP 150,000', icon: <UsersIcon size={22} /> },
                    ].map(opt => (
                        <button
                            key={opt.key}
                            type="button"
                            onClick={() => setVariant(opt.key)}
                            disabled={generating}
                            className={`text-left rounded-2xl border-2 p-6 transition-all disabled:opacity-50 ${variant === opt.key ? 'border-violet-600 bg-violet-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${variant === opt.key ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {opt.icon}
                                </div>
                                {variant === opt.key && <CheckCircle2 size={20} className="text-violet-600" />}
                            </div>
                            <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-gray-500 mb-1">{opt.title}</div>
                            <div className="text-base font-semibold text-gray-900 mb-3">{opt.sub}</div>
                            <div className="text-2xl font-bold text-gray-900 tracking-tight">{opt.fee}</div>
                        </button>
                    ))}
                </div>

                <div className="px-8 pb-3">
                    {suggestedPartner ? (
                        <p className="text-xs text-gray-500">Auto-suggested <span className="font-semibold text-violet-700">Partner</span> (lead marital status: {lead?.marital_status}).</p>
                    ) : (
                        <p className="text-xs text-gray-400">Default <span className="font-semibold text-gray-600">Single</span> — change if applicant has a partner.</p>
                    )}
                </div>

                <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/60 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={generating}
                        className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm(variant)}
                        disabled={generating}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        {generating ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Generating PDF…
                            </>
                        ) : (
                            <>
                                <Wand2 size={13} /> Generate {variant === 'partner' ? 'Partner' : 'Single'} variant
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    ), document.body);
}

const NOTE_KIND_META = {
    general:      { label: 'General',       chip: 'bg-gray-100 text-gray-700 border-gray-200' },
    pre_screen:   { label: 'Pre-screening', chip: 'bg-amber-100 text-amber-800 border-amber-200' },
    goal_setting: { label: 'Goal-setting',  chip: 'bg-purple-100 text-purple-800 border-purple-200' },
};
const GOAL_STATUS_OPTS = ['Consultation Done', 'For Proposal', 'Proposal Sent', 'No Show'];
// Pre-screeners are real staff users — sourced from the staffOptions
// dropdown filtered to roles that legitimately pre-screen leads.
const PRESCREEN_ROLES = ['sales', 'education', 'admin'];

function NotesPanel({ leadId, notes, currentUser, staffOptions = [] }) {
    const [body, setBody] = useState('');
    const [pinned, setPinned] = useState(false);
    const [kind, setKind] = useState('general');
    const [preScreenedBy, setPreScreenedBy] = useState('');
    const [preScreenMode, setPreScreenMode] = useState('');
    const [preScreenDate, setPreScreenDate] = useState('');
    const [goalStatus, setGoalStatus] = useState('');
    const [goalBy, setGoalBy] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editBody, setEditBody] = useState('');

    const reset = () => {
        setBody(''); setPinned(false); setKind('general');
        setPreScreenedBy(''); setPreScreenMode(''); setPreScreenDate('');
        setGoalStatus(''); setGoalBy('');
    };

    const submit = (e) => {
        e.preventDefault();
        if (!body.trim()) return;
        setSubmitting(true);
        const payload = {
            body: body.trim(),
            pinned,
            kind,
            pre_screened_by:     kind === 'pre_screen'   ? (preScreenedBy || null) : null,
            pre_screen_mode:     kind === 'pre_screen'   ? (preScreenMode || null) : null,
            pre_screen_date:     kind === 'pre_screen'   ? (preScreenDate || null) : null,
            goal_setting_status: kind === 'goal_setting' ? (goalStatus    || null) : null,
            goal_setting_by:     kind === 'goal_setting' ? (goalBy        || null) : null,
        };
        router.post(`/admin/leads/${leadId}/notes`, payload, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: reset,
            onFinish: () => setSubmitting(false),
        });
    };

    const togglePin = (note) => router.post(`/admin/leads/${leadId}/notes/${note.id}`,
        { pinned: !note.pinned },
        { preserveScroll: true, preserveState: true });

    const saveEdit = (note) => {
        if (!editBody.trim()) return;
        router.post(`/admin/leads/${leadId}/notes/${note.id}`,
            { body: editBody.trim() },
            { preserveScroll: true, preserveState: true, onSuccess: () => setEditingId(null) });
    };

    const remove = (note) => {
        confirm('Delete this note?')
            ? router.delete(`/admin/leads/${leadId}/notes/${note.id}`, { preserveScroll: true, preserveState: true })
            : null;
    };

    const fmt = (iso) => iso
        ? new Date(iso).toLocaleString("en-NZ", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : '';

    return (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <Edit size={15} className="text-gray-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">Internal notes</h2>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {notes.length} note{notes.length === 1 ? "" : "s"}
                </span>
            </div>

            {/* Compose */}
            <form onSubmit={submit} className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 space-y-4">
                {/* Kind selector */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500 mr-1">Type</p>
                    {Object.entries(NOTE_KIND_META).map(([k, meta]) => (
                        <button
                            key={k}
                            type="button"
                            onClick={() => setKind(k)}
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all ${
                                kind === k ? meta.chip : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {meta.label}
                        </button>
                    ))}
                </div>

                {/* Kind-specific fields */}
                {kind === 'pre_screen' && (
                    <div className="space-y-3.5">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500 mb-1.5">Pre-screened by</p>
                            {(() => {
                                const prescreeners = staffOptions.filter((u) => PRESCREEN_ROLES.includes(u.role));
                                if (prescreeners.length === 0) {
                                    return (
                                        <p className="text-[11px] text-gray-400 italic">
                                            No sales / education staff on file. Set a user&apos;s role to <span className="font-mono">sales</span>, <span className="font-mono">education</span>, or <span className="font-mono">admin</span> in Admin → Users.
                                        </p>
                                    );
                                }
                                return (
                                    <select
                                        value={preScreenedBy}
                                        onChange={(e) => setPreScreenedBy(e.target.value)}
                                        className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-xs bg-white outline-none focus:border-gray-900"
                                    >
                                        <option value="">— Select staff —</option>
                                        {prescreeners.map((u) => (
                                            <option key={u.id} value={u.name}>{u.name} · {u.role}</option>
                                        ))}
                                    </select>
                                );
                            })()}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {/* Mode — Google Meet vs phone call. */}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500 mb-1.5">Mode</p>
                                <div className="flex gap-1.5">
                                    {[
                                        { k: 'gmeet', label: 'Google Meet' },
                                        { k: 'call',  label: 'Phone Call' },
                                    ].map((m) => {
                                        const active = preScreenMode === m.k;
                                        return (
                                            <button
                                                key={m.k}
                                                type="button"
                                                onClick={() => setPreScreenMode(active ? '' : m.k)}
                                                className={`flex-1 px-3 py-1.5 rounded-md text-[11px] font-bold border transition-all ${
                                                    active ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                }`}
                                            >
                                                {m.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Date the pre-screen happened. */}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500 mb-1.5">Date</p>
                                <input
                                    type="date"
                                    value={preScreenDate}
                                    onChange={(e) => setPreScreenDate(e.target.value)}
                                    className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-xs bg-white outline-none focus:border-gray-900"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {kind === 'goal_setting' && (
                    <div className="space-y-3.5">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500 mb-1.5">Goal-setting status</p>
                            <div className="flex flex-wrap gap-1.5">
                                {GOAL_STATUS_OPTS.map((s) => {
                                    const active = goalStatus === s;
                                    return (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setGoalStatus(active ? '' : s)}
                                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all ${
                                                active ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500 mb-1.5">Goal-setting by</p>
                            <select
                                value={goalBy}
                                onChange={(e) => setGoalBy(e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-xs bg-white outline-none focus:border-gray-900"
                            >
                                <option value="">— Select staff —</option>
                                {staffOptions.map((u) => (
                                    <option key={u.id} value={u.name}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Type here"
                    rows={2}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-gray-900 transition-colors resize-none"
                />
                <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={pinned}
                            onChange={(e) => setPinned(e.target.checked)}
                            className="rounded border-gray-300"
                        />
                        Pin to top
                    </label>
                    <button
                        type="submit"
                        disabled={submitting || !body.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Saving' : 'Add note'}
                    </button>
                </div>
            </form>

            {/* List */}
            {notes.length === 0 ? (
                <div className="px-5 py-10 text-center text-xs text-gray-400">
                    No notes yet. Capture call context, family situation, blockers — anything that helps the next teammate.
                </div>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {notes.map((n) => {
                        const canEdit = currentUser && (currentUser.is_admin || currentUser.id === n.user_id);
                        const isEditing = editingId === n.id;
                        return (
                            <li key={n.id} className={`px-5 py-4 ${n.pinned ? 'bg-amber-50/40' : ''}`}>
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-6 h-6 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                            {(n.author_name || 'S').slice(0, 1).toUpperCase()}
                                        </div>
                                        <span className="text-xs font-semibold text-gray-900 truncate">{n.author_name}</span>
                                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold truncate">· {n.author_role}</span>
                                        {n.kind && n.kind !== 'general' && NOTE_KIND_META[n.kind] && (
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${NOTE_KIND_META[n.kind].chip}`}>
                                                {NOTE_KIND_META[n.kind].label}
                                            </span>
                                        )}
                                        {n.pinned && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                                                Pinned
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{fmt(n.created_at)}</span>
                                </div>

                                {/* Kind-specific meta — pre-screener name,
                                    mode, date, goal status + assigned staff,
                                    rendered as small chips above the body. */}
                                {(n.pre_screened_by || n.pre_screen_mode || n.pre_screen_date || n.goal_setting_status || n.goal_setting_by) && (
                                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                        {n.pre_screened_by && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                                By {n.pre_screened_by}
                                            </span>
                                        )}
                                        {n.pre_screen_mode && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                                {n.pre_screen_mode === 'gmeet' ? 'Google Meet' : 'Phone Call'}
                                            </span>
                                        )}
                                        {n.pre_screen_date && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wide bg-amber-50/60 text-amber-700 border border-amber-200 tabular-nums">
                                                {new Date(String(n.pre_screen_date).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        )}
                                        {n.goal_setting_status && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                                                {n.goal_setting_status}
                                            </span>
                                        )}
                                        {n.goal_setting_by && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wide bg-gray-50 text-gray-600 border border-gray-200">
                                                with {n.goal_setting_by}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {isEditing ? (
                                    <div>
                                        <textarea
                                            value={editBody}
                                            onChange={(e) => setEditBody(e.target.value)}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-gray-900 resize-none"
                                            autoFocus
                                        />
                                        <div className="flex items-center justify-end gap-2 mt-2">
                                            <button type="button" onClick={() => setEditingId(null)} className="text-[10px] uppercase tracking-widest font-bold text-gray-500 px-2 py-1">Cancel</button>
                                            <button type="button" onClick={() => saveEdit(n)} className="text-[10px] uppercase tracking-widest font-bold text-white bg-gray-900 hover:bg-gray-800 px-3 py-1.5 rounded-md">Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{n.body}</p>
                                        <div className="flex items-center gap-3 mt-2 text-[10px] uppercase tracking-widest font-bold">
                                            <button type="button" onClick={() => togglePin(n)} className="text-gray-400 hover:text-amber-600 transition-colors">
                                                {n.pinned ? 'Unpin' : 'Pin'}
                                            </button>
                                            {canEdit && (
                                                <>
                                                    <button type="button" onClick={() => { setEditingId(n.id); setEditBody(n.body); }} className="text-gray-400 hover:text-gray-900 transition-colors">Edit</button>
                                                    <button type="button" onClick={() => remove(n)} className="text-gray-400 hover:text-red-600 transition-colors">Delete</button>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}

// ── Sources panel — every form this lead has filled ──────────────────────

const SOURCE_KIND_STYLE = {
    origin:   { chip: "bg-[#436235]/10 text-[#436235] border-[#436235]/30", label: "Origin" },
    booking:  { chip: "bg-blue-50 text-blue-700 border-blue-200",           label: "Booking" },
    event:    { chip: "bg-purple-50 text-purple-700 border-purple-200",     label: "Event" },
    resubmit: { chip: "bg-amber-50 text-amber-700 border-amber-200",        label: "Resubmit" },
};

function SourcesPanel({ sources = [] }) {
    const fmt = (iso) => iso
        ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" })
        : "—";

    return (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <FileText size={15} className="text-gray-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">Sources</h2>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {sources.length} touchpoint{sources.length === 1 ? "" : "s"}
                </span>
            </div>

            {sources.length === 0 ? (
                <div className="px-5 py-8 text-center text-xs text-gray-400">
                    No sources recorded.
                </div>
            ) : (
                <ol className="divide-y divide-gray-100">
                    {sources.map((s, i) => {
                        const style = SOURCE_KIND_STYLE[s.kind] || SOURCE_KIND_STYLE.resubmit;
                        return (
                            <li key={i} className="px-5 py-3 flex items-center gap-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider w-[80px] justify-center flex-shrink-0 ${style.chip}`}>
                                    {style.label}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{s.label}</p>
                                    {s.detail && (
                                        <p className="text-[11px] text-gray-500 mt-0.5 truncate">{s.detail}</p>
                                    )}
                                </div>
                                <div className="flex flex-col items-end text-right flex-shrink-0">
                                    {s.reference && (
                                        <span className="text-[10px] font-mono text-gray-400">{s.reference}</span>
                                    )}
                                    <span className="text-[11px] text-gray-500">{fmt(s.date)}</span>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            )}
        </section>
    );
}

function formatVal(v) {
    if (v === null || v === undefined || v === '') return '(empty)';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (typeof v === 'object') {
        const s = JSON.stringify(v);
        return s.length > 60 ? s.slice(0, 60) + '…' : s;
    }
    const s = String(v);
    return s.length > 60 ? s.slice(0, 60) + '…' : s;
}
