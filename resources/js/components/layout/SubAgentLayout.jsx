import DashboardLayout from "./DashboardLayout";
import { usePage } from "@inertiajs/react";
import { LayoutDashboard, Users, CalendarClock, User, GraduationCap } from "lucide-react";

// Hide a nav item whose `module` hasn't been granted to this user. `modules` is
// auth.modules — the granted-key list from User::grantedModules(); super admins
// get every key. Mirrors gateNav in AdminLayout; a section header with nothing
// left under it is dropped so the sidebar doesn't show an empty group.
function gateNav(items, modules) {
    const kept = items.filter((it) => !it.module || modules.includes(it.module));

    return kept.filter((it, i) => {
        if (!it.section) return true;
        const next = kept[i + 1];

        return next && !next.section;
    });
}

// Sub-agent portal — a sales-lite pipeline scoped to one agent's referrals.
export default function SubAgentLayout({ children }) {
    const { props } = usePage();
    const badges = props?.sidebarBadges?.["sub-agent"] || {};
    const modules = props?.auth?.modules || [];

    const NAV = [
        { name: "Daily work", section: true },
        { name: "Dashboard", href: "/portal/sub-agent/dashboard", icon: <LayoutDashboard size={20} /> },
        { name: "Referral Leads", href: "/portal/sub-agent/leads", icon: <Users size={20} />, badge: badges.needs_follow_up, badgeTone: "default" },
        // Read-only view of the students the parent agent's referrals became.
        // Ships hidden — granted per user as `referral_students` from Module
        // Management. The route carries the same gate.
        { name: "Students", href: "/portal/sub-agent/students", icon: <GraduationCap size={20} />, module: "referral_students" },
        // Overdue follow-ups are the one thing on this portal worth shouting about.
        { name: "Follow-ups", href: "/portal/sub-agent/follow-ups", icon: <CalendarClock size={20} />, badge: badges.follow_ups_due, badgeTone: "danger" },

        { name: "Account", section: true },
        { name: "My Profile", href: "/portal/sub-agent/profile", icon: <User size={20} /> },
    ];

    return (
        <DashboardLayout brand="ePathways." subtitle="Sub-agent Portal" accent="bg-purple-600" nav={gateNav(NAV, modules)}>
            {children}
        </DashboardLayout>
    );
}
