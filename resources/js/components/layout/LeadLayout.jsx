import DashboardLayout from "./DashboardLayout";
import {
    LayoutDashboard, Route, FileText, ListChecks, FileSpreadsheet,
    Calendar, FileCheck, FileSignature, CreditCard, MessageSquare,
    Megaphone, CalendarDays, User, Radar,
} from "lucide-react";

// Lead Portal sidebar — intentionally minimal for now: only the Application
// Tracker and the client's Profile. The rest are hidden (commented out below),
// so restoring the full menu is a one-line un-comment. NOTE: hiding here is
// cosmetic — the routes still exist; it does not restrict URL access.
const LEAD_NAV = [
    { name: "Application Tracker", href: "/portal/lead/tracker", icon: <Radar size={20} /> },
    { name: "My Profile",          href: "/portal/lead/profile", icon: <User size={20} /> },

    // ── Hidden for now — un-comment to bring back the full client portal ──
    // { name: "Dashboard",  href: "/portal/lead/dashboard", icon: <LayoutDashboard size={20} /> },
    // { name: "Work", section: true },
    // { name: "My Journey", href: "/portal/lead/journey",   icon: <Route size={20} /> },
    // { name: "Submit", section: true },
    // { name: "Documents",  href: "/portal/lead/documents",  icon: <FileText size={20} /> },
    // { name: "Checklist",  href: "/portal/lead/checklist",  icon: <ListChecks size={20} /> },
    // { name: "Visa Forms", href: "/portal/lead/visa-forms", icon: <FileSpreadsheet size={20} /> },
    // { name: "Engage", section: true },
    // { name: "Appointments", href: "/portal/lead/appointments", icon: <Calendar size={20} /> },
    // { name: "Proposals",    href: "/portal/lead/proposals",    icon: <FileCheck size={20} /> },
    // { name: "Agreements",   href: "/portal/lead/agreements",   icon: <FileSignature size={20} /> },
    // { name: "Payments",     href: "/portal/lead/payments",     icon: <CreditCard size={20} /> },
    // { name: "Stay in touch", section: true },
    // { name: "Messages",    href: "/portal/lead/messages",      icon: <MessageSquare size={20} /> },
    // { name: "News & Tips", href: "/portal/lead/announcements", icon: <Megaphone size={20} /> },
    // { name: "Events",      href: "/portal/lead/activities",    icon: <CalendarDays size={20} /> },
    // { name: "Account", section: true },
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
