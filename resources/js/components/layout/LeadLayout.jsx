import DashboardLayout from "./DashboardLayout";
import { LayoutDashboard, FileText, User } from "lucide-react";

// Lead Portal sidebar — minimal v1. Documents page lands in Phase B.
const LEAD_NAV = [
    { name: "Dashboard", href: "/portal/lead/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Documents", href: "/portal/lead/documents", icon: <FileText size={20} /> },
    { name: "My details", href: "/portal/lead/dashboard", icon: <User size={20} /> },
];

export default function LeadLayout({ children }) {
    return (
        <DashboardLayout
            brand="ePathways."
            subtitle="Your Portal"
            accent="bg-[#436235]"
            nav={LEAD_NAV}
            settingsHref={null}
        >
            {children}
        </DashboardLayout>
    );
}
