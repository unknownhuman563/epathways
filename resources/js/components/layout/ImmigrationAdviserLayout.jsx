import DashboardLayout from "./DashboardLayout";
import { usePage } from "@inertiajs/react";
import {
    LayoutDashboard, Globe, UserCheck, BadgeCheck, LineChart, User, ClipboardCheck,
    FileSignature, ReceiptText, FileText, FileBadge, CheckSquare, UserSquare2, GraduationCap,
} from "lucide-react";

// Portal for the Licensed Immigration Adviser (LIA). Distinct from the manager's
// full immigration portal — focused on the adviser's licensed work: cases, the
// documents referred to them for verification, reports, and their profile.
export default function ImmigrationAdviserLayout({ children }) {
    const { props } = usePage();
    const badges = props?.sidebarBadges?.["immigration-adviser"] || {};

    const NAV = [
        { name: "Dashboard", href: "/portal/immigration-adviser/dashboard", icon: <LayoutDashboard size={20} /> },

        { name: "Casework", section: true },
        { name: "Visa Assessment", href: "/portal/immigration-adviser/assessments", icon: <ClipboardCheck size={20} /> },
        { name: "Leads", href: "/portal/immigration-adviser/leads", icon: <UserSquare2 size={20} /> },
        { name: "Students", href: "/portal/immigration-adviser/students", icon: <GraduationCap size={20} /> },
        { name: "Cases", href: "/portal/immigration-adviser/cases", icon: <Globe size={20} /> },
        { name: "My Cases", href: "/portal/immigration-adviser/my-cases", icon: <UserCheck size={20} />, badge: badges.my_cases, badgeTone: "default" },
        { name: "Task Board", href: "/portal/immigration-adviser/tasks", icon: <CheckSquare size={20} /> },
        { name: "Verification", href: "/portal/immigration-adviser/verification", icon: <BadgeCheck size={20} />, badge: badges.pending_verification, badgeTone: "teal" },
        { name: "Reports", href: "/portal/immigration-adviser/reports", icon: <LineChart size={20} /> },

        { name: "Setup", section: true },
        { name: "Visas", href: "/portal/immigration-adviser/visas", icon: <FileBadge size={20} /> },

        { name: "Documents", section: true },
        { name: "Engagement", href: "/portal/immigration-adviser/engagement", icon: <FileSignature size={20} /> },
        { name: "Invoice", href: "/portal/immigration-adviser/invoice", icon: <ReceiptText size={20} /> },
        { name: "INZ Forms", href: "/portal/immigration-adviser/inz-forms", icon: <FileText size={20} /> },

        { name: "Account", section: true },
        { name: "My Profile", href: "/portal/immigration-adviser/profile", icon: <User size={20} /> },
    ];

    return (
        <DashboardLayout brand="ePathways." subtitle="Adviser Portal" accent="bg-[#009688]" nav={NAV}>
            {children}
        </DashboardLayout>
    );
}
