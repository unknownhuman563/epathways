import DashboardLayout from "./DashboardLayout";
import { LayoutDashboard, User, Users, FileText } from "lucide-react";

// Lead Portal sidebar. Documents = the tracker's checklist view; Dashboard =
// overview; Profile = the applicant's details; Family = dependants.
const LEAD_NAV = [
    { name: "Dashboard", href: "/portal/lead/dashboard",    icon: <LayoutDashboard size={20} /> },
    { name: "Documents", href: "/portal/lead/requirements", icon: <FileText size={20} /> },
    { name: "Family",    href: "/portal/lead/family",       icon: <Users size={20} /> },
    { name: "Profile",   href: "/portal/lead/profile",      icon: <User size={20} /> },
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
