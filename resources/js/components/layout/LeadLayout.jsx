import DashboardLayout from "./DashboardLayout";
import { LayoutDashboard, User, Users, FileText } from "lucide-react";

// Lead Portal sidebar. Documents = the tracker's checklist view; Dashboard =
// overview; Family = dependants. Profile sits with Settings in the account
// group at the foot of the sidebar.
const LEAD_NAV = [
    { name: "Dashboard", href: "/portal/lead/dashboard",    icon: <LayoutDashboard size={20} /> },
    { name: "Documents", href: "/portal/lead/requirements", icon: <FileText size={20} /> },
    { name: "Family",    href: "/portal/lead/family",       icon: <Users size={20} /> },
];

// Account links pinned to the bottom, directly above Settings.
const LEAD_FOOTER_NAV = [
    { name: "Profile", href: "/portal/lead/profile", icon: <User size={18} /> },
];

export default function LeadLayout({ children }) {
    return (
        <DashboardLayout
            brand="ePathways."
            subtitle="Your Portal"
            accent="bg-[#009688]"
            nav={LEAD_NAV}
            footerNav={LEAD_FOOTER_NAV}
            settingsHref="/portal/lead/settings"
        >
            {children}
        </DashboardLayout>
    );
}
