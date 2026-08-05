import DashboardLayout from "./DashboardLayout";
import { LayoutDashboard, ListChecks, User } from "lucide-react";

// Lead Portal sidebar — the three tracker views, one per sidebar item. Each
// route renders the tracker (TrackingPage) at a fixed tab: Dashboard = Overview,
// Requirements = the checklist, My Profile = the applicant's details.
const LEAD_NAV = [
    { name: "Dashboard",    href: "/portal/lead/dashboard",    icon: <LayoutDashboard size={20} /> },
    { name: "Requirements", href: "/portal/lead/requirements", icon: <ListChecks size={20} /> },
    { name: "My Profile",   href: "/portal/lead/profile",      icon: <User size={20} /> },
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
