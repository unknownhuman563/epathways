import { useEffect, useMemo, useState } from "react";
import { Head, usePage } from "@inertiajs/react";
import CaseProfileHeader from "@/components/immigration/case-profile/CaseProfileHeader";
import OverviewTab from "@/components/immigration/case-profile/tabs/OverviewTab";
import PersonalTab from "@/components/immigration/case-profile/tabs/PersonalTab";
import DocumentsTab from "@/components/immigration/case-profile/tabs/DocumentsTab";
import CommunicationsTab from "@/components/immigration/case-profile/tabs/CommunicationsTab";
import AIHealthTab from "@/components/immigration/case-profile/tabs/AIHealthTab";
import ProcessTab from "@/components/immigration/case-profile/tabs/ProcessTab";
import NotesTab from "@/components/immigration/case-profile/tabs/NotesTab";
import FinancialsTab from "@/components/immigration/case-profile/tabs/FinancialsTab";
import DependantsTab from "@/components/immigration/case-profile/tabs/DependantsTab";
import AiRecordAssistant from "@/components/ai/AiRecordAssistant";
import {
    FileText, MessageSquare, Sparkles, StickyNote, User, Workflow, DollarSign, Users, LayoutDashboard,
} from "lucide-react";

// Build 11.D — Case Profile page. Six-tab workspace for an immigration case.
// Distinct from admin/LeadDetails.jsx (which continues to serve sales leads).
// Visual basis: the IntakeDetails profile (gray + white CRM theme).

const TABS = [
    { key: "overview",       label: "Overview",           icon: LayoutDashboard, Comp: OverviewTab },
    { key: "personal",       label: "Personal",           icon: User,          Comp: PersonalTab },
    { key: "dependants",     label: "Family",             icon: Users,         Comp: DependantsTab },
    { key: "documents",      label: "Documents",          icon: FileText,      Comp: DocumentsTab },
    { key: "communications", label: "Communications",     icon: MessageSquare, Comp: CommunicationsTab },
    { key: "ai_health",      label: "AI Health",       icon: Sparkles,        Comp: AIHealthTab },
    { key: "notes",          label: "Notes & Activity", icon: StickyNote,     Comp: NotesTab },
];

const VALID_TABS = new Set(TABS.map((t) => t.key));

export default function CaseProfile() {
    const { props } = usePage();
    const {
        lead = {}, intake = null, documents = [], documentRequests = [], checklist = { items: [] },
        checklistGrouped = {}, unstructuredDocuments = [],
        checklistProgress = { required_total: 0, required_approved: 0, total: 0, approved: 0 },
        communications = [], agreements = [], notes = [], activity = [],
        findings = { items: [], evaluated_at: null, couldnt_verify: [] },
        process = { started: false, steps: [], payment: null, partner: null },
        threads = [], caseStaff = [], attention = null,
        financials = { record: null, payments: [], totals: {}, referred_by: null },
        inzForms = [], dependents = [], vif = null, caseOptions = [], tiedTo = null, visaTypes = [],
        assessmentCompleteness = null, engagement = {}, tasks = { items: [] },
    } = props;

    // Deep-link tab via ?tab=…  — preserved from the legacy
    // /portal/immigration/leads/{id}?tab=documents convert-redirect URL.
    const initialTab = useMemo(() => {
        if (typeof window === "undefined") return "overview";
        const t = new URLSearchParams(window.location.search).get("tab");
        return t && VALID_TABS.has(t) ? t : "overview";
    }, []);
    const [activeTab, setActiveTab] = useState(initialTab);

    // Navigating between two case profiles reuses this same page component
    // (Inertia doesn't remount it), so reset the tab whenever the case changes
    // — a fresh case opens on Overview unless the URL asks for a specific tab.
    useEffect(() => {
        const t = typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("tab")
            : null;
        setActiveTab(t && VALID_TABS.has(t) ? t : "overview");
    }, [lead.id]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const url = new URL(window.location.href);
        if (url.searchParams.get("tab") === activeTab) return;
        url.searchParams.set("tab", activeTab);
        window.history.replaceState({}, "", url);
    }, [activeTab]);

    const tabProps = {
        lead, intake, documents, documentRequests, checklist, checklistGrouped, unstructuredDocuments, checklistProgress,
        communications, agreements, notes, activity, findings, process, threads, caseStaff, financials, inzForms, dependents, vif, caseOptions, visaTypes,
        assessmentCompleteness, engagement, attention, tasks,
        onNavigate: setActiveTab,
    };
    const ActiveTab = TABS.find((t) => t.key === activeTab)?.Comp ?? PersonalTab;

    const fullName = `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim() || lead.lead_id || "Case";

    return (
        <div className="max-w-[1300px] mx-auto pb-12 space-y-5">
            <Head title={`${fullName} — Case profile`} />

            <CaseProfileHeader lead={lead} intake={intake} attention={attention} tiedTo={tiedTo} engagement={engagement} visaTypes={visaTypes} />

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                <nav className="flex items-stretch min-w-max">
                    {TABS.map(({ key, label, icon: Icon }) => {
                        const active = key === activeTab;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setActiveTab(key)}
                                className={`inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                                    active
                                        ? "border-gray-900 text-gray-900"
                                        : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                }`}
                            >
                                <Icon size={15} className={active ? "text-gray-900" : "text-gray-400"} />
                                {label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Overview is its own dashboard of cards on the page background;
                every other tab keeps the single white-card frame. */}
            {activeTab === "overview" ? (
                <ActiveTab {...tabProps} />
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <ActiveTab {...tabProps} />
                </div>
            )}

            <AiRecordAssistant subjectId={lead.id} label={`${fullName} · immigration case`} immigration />
        </div>
    );
}
