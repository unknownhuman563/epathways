import DashboardLayout from "./DashboardLayout";
import { usePage } from "@inertiajs/react";
import {
    LayoutDashboard, ClipboardCheck, UserSquare2, Globe, FolderOpen,
    Calendar, FileBadge, CalendarDays, FileText, ListChecks, LineChart,
    User, Bell, CheckSquare, Ticket, Mail,
    PenLine, Megaphone, Smartphone, MessageSquare,
    FileSignature, ReceiptText, GraduationCap, Award,
} from "lucide-react";

export default function ImmigrationLayout({ children }) {
    const { props } = usePage();
    const badges = props?.sidebarBadges?.immigration || {};

    // Grouped into single-open collapsible sections so the whole menu fits
    // without scrolling. Only Dashboard stays as a top-level link; everything
    // else lives in a group. Item badges roll up onto their group header while
    // collapsed (see DashboardLayout), so pending counts are never hidden.
    const NAV = [
        { name: "Dashboard", href: "/portal/immigration/dashboard", icon: <LayoutDashboard size={20} /> },
        {
            name: "Pipeline",
            icon: <UserSquare2 size={20} />,
            children: [
                { name: "Visa Assessment",       href: "/portal/immigration/assessments",                icon: <ClipboardCheck size={16} />, badge: badges.new_assessments, badgeTone: "default" },
                { name: "List of Leads",         href: "/portal/immigration/leads",                      icon: <UserSquare2 size={16} />,    badge: badges.new_leads_today, badgeTone: "default" },
                { name: "Proposal & Agreements", href: "/portal/immigration/leads/proposals-agreements", icon: <FileText size={16} /> },
                { name: "List of Cases",         href: "/portal/immigration/cases",                      icon: <Globe size={16} />,          badge: badges.active_cases,    badgeTone: "default" },
                { name: "Engagement",            href: "/portal/immigration/cases/engagement",           icon: <FileSignature size={16} /> },
                { name: "Invoice",               href: "/portal/immigration/cases/invoice",              icon: <ReceiptText size={16} /> },
            ],
        },
        {
            name: "Clients",
            icon: <FolderOpen size={20} />,
            children: [
                // Shared with Education + Sales — same screen, this portal's layout.
                { name: "Students",     href: "/portal/immigration/students",     icon: <GraduationCap size={16} /> },
                { name: "Documents",    href: "/portal/immigration/documents",    icon: <FolderOpen size={16} />, badge: badges.docs_pending_review, badgeTone: "warning" },
                { name: "Task Board",   href: "/portal/immigration/tasks",        icon: <CheckSquare size={16} /> },
                { name: "Appointments", href: "/portal/immigration/appointments", icon: <Calendar size={16} /> },
            ],
        },
        {
            name: "Setup",
            icon: <FileBadge size={20} />,
            children: [
                { name: "Visas",               href: "/portal/immigration/visa-types",          icon: <FileBadge size={16} /> },
                { name: "Intakes",             href: "/portal/immigration/intakes",             icon: <CalendarDays size={16} /> },
                { name: "INZ Forms",           href: "/portal/immigration/inz-forms",           icon: <FileText size={16} /> },
                { name: "Checklist Templates", href: "/portal/immigration/checklist-templates", icon: <ListChecks size={16} /> },
            ],
        },
        {
            name: "Communications",
            icon: <Mail size={20} />,
            children: [
                { name: "Templates", href: "/portal/immigration/email-templates", icon: <PenLine size={16} /> },
                { name: "Bulk Mail", href: "/portal/immigration/bulk-email",      icon: <Megaphone size={16} /> },
                { name: "SMS",       href: "/portal/immigration/sms",             icon: <Smartphone size={16} /> },
                { name: "Replies",   href: "/portal/immigration/email/replies",   icon: <MessageSquare size={16} /> },
            ],
        },
        {
            name: "Insights",
            icon: <LineChart size={20} />,
            children: [
                { name: "Reports",       href: "/portal/immigration/reports", icon: <LineChart size={16} /> },
                { name: "Visa Approved", href: "/admin/visa-approvals",       icon: <Award size={16} /> },
            ],
        },
        {
            name: "Account",
            icon: <User size={20} />,
            children: [
                { name: "My Profile",    href: "/portal/immigration/profile",       icon: <User size={16} /> },
                { name: "Notifications", href: "/portal/immigration/notifications", icon: <Bell size={16} />, badge: badges.notifications_unread, badgeTone: "warning" },
                { name: "My Tickets",    href: "/portal/tickets",                  icon: <Ticket size={16} /> },
            ],
        },
    ];

    return (
        <DashboardLayout brand="ePathways." subtitle="Immigration Portal" accent="bg-amber-600" nav={NAV}>
            {children}
        </DashboardLayout>
    );
}
