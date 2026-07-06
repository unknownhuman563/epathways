import DashboardLayout from "./DashboardLayout";
import { usePage } from "@inertiajs/react";
import { LayoutDashboard, Users, Bell, Ticket } from "lucide-react";

// Agent Portal sidebar — deliberately lean. Recruiting agents add leads and
// edit their info; they don't run the pipeline, so no bookings/reports/etc.
// Badges come from the globally-shared `sidebarBadges` prop.
export default function AgentLayout({ children }) {
    const { props } = usePage();
    const badges = props?.sidebarBadges?.agent || {};

    const AGENT_NAV = [
        { name: "Dashboard", href: "/portal/agent/dashboard", icon: <LayoutDashboard size={20} /> },

        { name: "Work", section: true },
        { name: "My Leads", href: "/portal/agent/leads", icon: <Users size={20} />, badge: badges.new_leads_today, badgeTone: "default" },

        { name: "Account", section: true },
        { name: "Notifications", href: "/portal/agent/notifications", icon: <Bell size={20} />, badge: badges.notifications_unread, badgeTone: "warning" },
        { name: "My Tickets", href: "/portal/tickets", icon: <Ticket size={20} /> },
    ];

    return (
        <DashboardLayout brand="ePathways." subtitle="Agent Portal" accent="bg-teal-600" nav={AGENT_NAV}>
            {children}
        </DashboardLayout>
    );
}
