import DashboardLayout from "./DashboardLayout";
import { usePage } from "@inertiajs/react";
import {
    LayoutDashboard, UserSquare2, Users, FolderOpen, GraduationCap,
    ListChecks, LineChart, User, Bell, Tag, Star,
} from "lucide-react";

export default function EducationLayout({ children }) {
    const { props } = usePage();
    const badges = props?.sidebarBadges?.education || {};

    const EDUCATION_NAV = [
        { name: "Dashboard", href: "/portal/education/dashboard", icon: <LayoutDashboard size={20} /> },

        { name: "Work", section: true },
        { name: "Leads",     href: "/portal/education/leads",     icon: <UserSquare2 size={20} />, badge: badges.new_leads_today, badgeTone: "default" },
        { name: "Students",  href: "/portal/education/students",  icon: <Users size={20} /> },
        { name: "Documents", href: "/portal/education/documents", icon: <FolderOpen size={20} />, badge: badges.docs_pending_review, badgeTone: "warning" },
        { name: "User Reviews", href: "/admin/education/user-reviews", icon: <Star size={20} /> },

        { name: "Setup", section: true },
        { name: "Programs",            href: "/portal/education/programs",            icon: <GraduationCap size={20} /> },
        { name: "Promotions",          href: "/admin/promos",                         icon: <Tag size={20} /> },
        { name: "Checklist Templates", href: "/portal/education/checklist-templates", icon: <ListChecks size={20} /> },

        { name: "Reports", href: "/portal/education/reports", icon: <LineChart size={20} /> },

        { name: "Account", section: true },
        { name: "My Profile",    href: "/portal/education/profile",       icon: <User size={20} /> },
        { name: "Notifications", href: "/portal/education/notifications", icon: <Bell size={20} />, badge: badges.notifications_unread, badgeTone: "warning" },
    ];

    return (
        <DashboardLayout brand="ePathways." subtitle="Education Portal" accent="bg-indigo-600" nav={EDUCATION_NAV}>
            {children}
        </DashboardLayout>
    );
}
