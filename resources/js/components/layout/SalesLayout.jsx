import DashboardLayout from "./DashboardLayout";
import { usePage } from "@inertiajs/react";
import {
    LayoutDashboard, Users, CalendarCheck, CheckSquare,
    Send, FileText, BarChart3, User, Bell, LineChart, Tag, ClipboardCheck, Ticket,
} from "lucide-react";

// Sales Portal sidebar — grouped into WORK / OUTREACH / ACCOUNT. Sidebar
// badges (open tasks, new leads today, etc.) come from the `sidebarBadges`
// prop shared globally by HandleInertiaRequests, so every page in the portal
// gets them for free.
export default function SalesLayout({ children }) {
    const { props } = usePage();
    const badges = props?.sidebarBadges?.sales || {};

    const SALES_NAV = [
        { name: "Dashboard", href: "/portal/sales/dashboard", icon: <LayoutDashboard size={20} /> },

        { name: "Work", section: true },
        { name: "Leads",     href: "/portal/sales/leads",     icon: <Users size={20} />,        badge: badges.new_leads_today, badgeTone: "default" },
        { name: "Task Board", href: "/portal/sales/tasks", icon: <CheckSquare size={20} />, badge: badges.tasks_open, badgeTone: badges.tasks_overdue > 0 ? "danger" : "default" },
        { name: "Assessments", href: "/portal/sales/assessments", icon: <ClipboardCheck size={20} /> },
        { name: "Bookings",  href: "/portal/sales/bookings",  icon: <CalendarCheck size={20} />, badge: badges.bookings_this_week, badgeTone: "default" },
        { name: "Reports",   href: "/portal/sales/reports",   icon: <LineChart size={20} /> },

        { name: "Outreach", section: true },
        { name: "Promotions",      href: "/admin/promos",                 icon: <Tag size={20} /> },
        { name: "Bulk Email",      href: "/portal/sales/bulk-email",      icon: <Send size={20} /> },
        { name: "Email Templates", href: "/portal/sales/email-templates", icon: <FileText size={20} /> },
        { name: "Campaigns",       href: "/portal/sales/campaigns",       icon: <BarChart3 size={20} /> },

        { name: "Account", section: true },
        { name: "My Profile",    href: "/portal/sales/profile",       icon: <User size={20} /> },
        { name: "Notifications", href: "/portal/sales/notifications", icon: <Bell size={20} />, badge: badges.notifications_unread, badgeTone: "warning" },
        { name: "My Tickets",    href: "/portal/tickets",             icon: <Ticket size={20} /> },
    ];

    return (
        <DashboardLayout brand="ePathways." subtitle="Sales Portal" accent="bg-blue-600" nav={SALES_NAV}>
            {children}
        </DashboardLayout>
    );
}
