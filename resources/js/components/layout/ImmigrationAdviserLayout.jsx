import DashboardLayout from "./DashboardLayout";
import { usePage } from "@inertiajs/react";
import {
    LayoutDashboard, Globe, ShieldCheck, Bell, User, Ticket,
} from "lucide-react";

// Portal for the Licensed Immigration Adviser (LIA). Distinct from the manager's
// full immigration portal — focused on the adviser's licensed work: their own
// cases, the sign-off / approval queue, and their profile (licence details).
export default function ImmigrationAdviserLayout({ children }) {
    const { props } = usePage();
    const badges = props?.sidebarBadges?.["immigration-adviser"] || {};

    const NAV = [
        { name: "Dashboard", href: "/portal/immigration-adviser/dashboard", icon: <LayoutDashboard size={20} /> },

        { name: "Casework", section: true },
        { name: "My Cases", href: "/portal/immigration-adviser/cases", icon: <Globe size={20} />, badge: badges.my_cases, badgeTone: "default" },
        { name: "Sign-off Queue", href: "/portal/immigration-adviser/sign-off", icon: <ShieldCheck size={20} />, badge: badges.pending_signoff, badgeTone: "teal" },

        { name: "Account", section: true },
        { name: "Notifications", href: "/portal/immigration-adviser/notifications", icon: <Bell size={20} />, badge: badges.notifications_unread, badgeTone: "teal" },
        { name: "My Profile", href: "/portal/immigration-adviser/profile", icon: <User size={20} /> },
        { name: "My Tickets", href: "/portal/tickets", icon: <Ticket size={20} /> },
    ];

    return (
        <DashboardLayout brand="ePathways." subtitle="Adviser Portal" accent="bg-[#009688]" nav={NAV}>
            {children}
        </DashboardLayout>
    );
}
