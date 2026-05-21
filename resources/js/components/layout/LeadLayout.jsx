import DashboardLayout from "./DashboardLayout";
import {
    LayoutDashboard, Route, FileText, ListChecks, FileSpreadsheet,
    Calendar, FileCheck, FileSignature, CreditCard, MessageSquare,
    Megaphone, CalendarDays, User,
} from "lucide-react";

// Lead Portal sidebar — same clean grouped style as Sales. Plain text
// section headers, no accordions, every item one click away.
const LEAD_NAV = [
    { name: "Work", section: true },
    { name: "Dashboard",  href: "/portal/lead/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "My Journey", href: "/portal/lead/journey",   icon: <Route size={20} /> },

    { name: "Submit", section: true },
    { name: "Documents",  href: "/portal/lead/documents",  icon: <FileText size={20} /> },
    { name: "Checklist",  href: "/portal/lead/checklist",  icon: <ListChecks size={20} /> },
    { name: "Visa Forms", href: "/portal/lead/visa-forms", icon: <FileSpreadsheet size={20} /> },

    { name: "Engage", section: true },
    { name: "Appointments", href: "/portal/lead/appointments", icon: <Calendar size={20} /> },
    { name: "Proposals",    href: "/portal/lead/proposals",    icon: <FileCheck size={20} /> },
    { name: "Agreements",   href: "/portal/lead/agreements",   icon: <FileSignature size={20} /> },
    { name: "Payments",     href: "/portal/lead/payments",     icon: <CreditCard size={20} /> },

    { name: "Stay in touch", section: true },
    { name: "Messages",    href: "/portal/lead/messages",      icon: <MessageSquare size={20} /> },
    { name: "News & Tips", href: "/portal/lead/announcements", icon: <Megaphone size={20} /> },
    { name: "Events",      href: "/portal/lead/activities",    icon: <CalendarDays size={20} /> },

    { name: "Account", section: true },
    { name: "My Profile", href: "/portal/lead/profile", icon: <User size={20} /> },
];

export default function LeadLayout({ children }) {
    return (
        <DashboardLayout
            brand="ePathways."
            subtitle="Your Portal"
            accent="bg-[#436235]"
            nav={LEAD_NAV}
            settingsHref="/portal/lead/settings"
        >
            {children}
        </DashboardLayout>
    );
}
