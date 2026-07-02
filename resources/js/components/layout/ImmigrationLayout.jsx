import DashboardLayout from "./DashboardLayout";
import { usePage } from "@inertiajs/react";
import {
    LayoutDashboard, ClipboardCheck, UserSquare2, Globe, FolderOpen,
    Calendar, FileBadge, CalendarDays, FileText, ListChecks, LineChart,
    User, Bell, CheckSquare, Ticket, Mail,
} from "lucide-react";

export default function ImmigrationLayout({ children }) {
    const { props } = usePage();
    const badges = props?.sidebarBadges?.immigration || {};

    const NAV = [
        { name: "Dashboard", href: "/portal/immigration/dashboard", icon: <LayoutDashboard size={20} /> },

        { name: "Work", section: true },
        { name: "Visa Assessment", href: "/portal/immigration/assessments",  icon: <ClipboardCheck size={20} />, badge: badges.new_assessments, badgeTone: "default" },
        { name: "Leads",        href: "/portal/immigration/leads",        icon: <UserSquare2 size={20} />,    badge: badges.new_leads_today, badgeTone: "default" },
        { name: "Cases",        href: "/portal/immigration/cases",        icon: <Globe size={20} />,          badge: badges.active_cases, badgeTone: "default" },
        { name: "Documents",    href: "/portal/immigration/documents",    icon: <FolderOpen size={20} />,     badge: badges.docs_pending_review, badgeTone: "warning" },
        { name: "Task Board",   href: "/portal/immigration/tasks",        icon: <CheckSquare size={20} /> },
        { name: "Appointments", href: "/portal/immigration/appointments", icon: <Calendar size={20} /> },

        { name: "Setup", section: true },
        { name: "Visas",               href: "/portal/immigration/visa-types",          icon: <FileBadge size={20} /> },
        { name: "Intakes",             href: "/portal/immigration/intakes",             icon: <CalendarDays size={20} /> },
        { name: "INZ Forms",           href: "/portal/immigration/inz-forms",           icon: <FileText size={20} /> },
        { name: "Checklist Templates", href: "/portal/immigration/checklist-templates", icon: <ListChecks size={20} /> },
        { name: "Email Templates",     href: "/portal/immigration/email-templates",     icon: <Mail size={20} /> },

        { name: "Reports", href: "/portal/immigration/reports", icon: <LineChart size={20} /> },

        { name: "Account", section: true },
        { name: "My Profile",    href: "/portal/immigration/profile",       icon: <User size={20} /> },
        { name: "Notifications", href: "/portal/immigration/notifications", icon: <Bell size={20} />, badge: badges.notifications_unread, badgeTone: "warning" },
        { name: "My Tickets",    href: "/portal/tickets",                  icon: <Ticket size={20} /> },
    ];

    return (
        <DashboardLayout brand="ePathways." subtitle="Immigration Portal" accent="bg-amber-600" nav={NAV}>
            {children}
        </DashboardLayout>
    );
}
