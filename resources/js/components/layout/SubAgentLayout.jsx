import DashboardLayout from "./DashboardLayout";
import { LayoutDashboard, Users, User } from "lucide-react";

// Sub-agent portal — a sales-lite pipeline scoped to one agent's referrals.
const SUB_AGENT_NAV = [
    { name: "Dashboard", href: "/portal/sub-agent/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Referral Leads", href: "/portal/sub-agent/leads", icon: <Users size={20} /> },
    { name: "My Profile", href: "/portal/sub-agent/profile", icon: <User size={20} /> },
];

export default function SubAgentLayout({ children }) {
    return (
        <DashboardLayout brand="ePathways." subtitle="Sub-agent Portal" accent="bg-purple-600" nav={SUB_AGENT_NAV}>
            {children}
        </DashboardLayout>
    );
}
