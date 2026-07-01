import { useEffect, useMemo, useState } from "react";
import { Head, usePage } from "@inertiajs/react";
import CaseProfileHeader from "@/components/immigration/case-profile/CaseProfileHeader";
import PersonalTab from "@/components/immigration/case-profile/tabs/PersonalTab";
import AssessmentTab from "@/components/immigration/case-profile/tabs/AssessmentTab";
import DocumentsTab from "@/components/immigration/case-profile/tabs/DocumentsTab";
import AgreementTab from "@/components/immigration/case-profile/tabs/AgreementTab";
import CommunicationsTab from "@/components/immigration/case-profile/tabs/CommunicationsTab";
import AIHealthTab from "@/components/immigration/case-profile/tabs/AIHealthTab";
import NotesTab from "@/components/immigration/case-profile/tabs/NotesTab";
import {
    ClipboardList, FileText, FileSignature, MessageSquare, Sparkles, StickyNote, User,
} from "lucide-react";

// Build 11.D — Case Profile page. Six-tab workspace for an immigration case.
// Distinct from admin/LeadDetails.jsx (which continues to serve sales leads).
// Visual basis: the IntakeDetails profile (gray + white CRM theme).

const TABS = [
    { key: "personal",       label: "Personal",        icon: User,            Comp: PersonalTab },
    { key: "assessment",     label: "Assessment",      icon: ClipboardList,   Comp: AssessmentTab },
    { key: "documents",      label: "Documents",       icon: FileText,        Comp: DocumentsTab },
    { key: "agreement",      label: "Agreement",       icon: FileSignature,   Comp: AgreementTab },
    { key: "communications", label: "Communications",  icon: MessageSquare,   Comp: CommunicationsTab },
    { key: "ai_health",      label: "AI Health",       icon: Sparkles,        Comp: AIHealthTab },
    { key: "notes",          label: "Notes & Activity", icon: StickyNote,     Comp: NotesTab },
];

const VALID_TABS = new Set(TABS.map((t) => t.key));

export default function CaseProfile() {
    const { props } = usePage();
    const {
        lead = {}, intake = null, documents = [], checklist = { items: [] },
        checklistGrouped = {}, unstructuredDocuments = [],
        checklistProgress = { required_total: 0, required_approved: 0, total: 0, approved: 0 },
        communications = [], agreements = [], notes = [], activity = [],
    } = props;

    // Deep-link tab via ?tab=…  — preserved from the legacy
    // /portal/immigration/leads/{id}?tab=documents convert-redirect URL.
    const initialTab = useMemo(() => {
        if (typeof window === "undefined") return "assessment";
        const t = new URLSearchParams(window.location.search).get("tab");
        return t && VALID_TABS.has(t) ? t : "assessment";
    }, []);
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const url = new URL(window.location.href);
        if (url.searchParams.get("tab") === activeTab) return;
        url.searchParams.set("tab", activeTab);
        window.history.replaceState({}, "", url);
    }, [activeTab]);

    const tabProps = {
        lead, intake, documents, checklist, checklistGrouped, unstructuredDocuments, checklistProgress,
        communications, agreements, notes, activity,
    };
    const ActiveTab = TABS.find((t) => t.key === activeTab)?.Comp ?? AssessmentTab;

    const fullName = `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim() || lead.lead_id || "Case";

    return (
        <div className="max-w-[1300px] mx-auto pb-12 space-y-5">
            <Head title={`${fullName} — Case profile`} />

            <CaseProfileHeader lead={lead} intake={intake} />

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 overflow-x-auto">
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

                <div className="p-6">
                    <ActiveTab {...tabProps} />
                </div>
            </div>
        </div>
    );
}
