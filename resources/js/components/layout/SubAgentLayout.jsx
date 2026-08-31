import DashboardLayout from "./DashboardLayout";
import { usePage } from "@inertiajs/react";
import { LayoutDashboard, Users, CalendarClock, User } from "lucide-react";

// Sub-agent portal — a sales-lite pipeline scoped to one agent's referrals.
export default function SubAgentLayout({ children }) {
    const badges = usePage().props?.sidebarBadges?.["sub-agent"] || {};

    const NAV = [
        { name: "Daily work", section: true },
        { name: "Dashboard", href: "/portal/sub-agent/dashboard", icon: <LayoutDashboard size={20} /> },
        { name: "Referral Leads", href: "/portal/sub-agent/leads", icon: <Users size={20} />, badge: badges.needs_follow_up, badgeTone: "default" },
        // Overdue follow-ups are the one thing on this portal worth shouting about.
        { name: "Follow-ups", href: "/portal/sub-agent/follow-ups", icon: <CalendarClock size={20} />, badge: badges.follow_ups_due, badgeTone: "danger" },

        { name: "Account", section: true },
        { name: "My Profile", href: "/portal/sub-agent/profile", icon: <User size={20} /> },
    ];

    return (
        <DashboardLayout brand="ePathways." subtitle="Sub-agent Portal" accent="bg-purple-600" nav={NAV}>
            {children}
        </DashboardLayout>
    );
}
