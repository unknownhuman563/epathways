import DashboardLayout from "./DashboardLayout";
import { LayoutDashboard, Languages, Users, ClipboardCheck } from "lucide-react";

const ENGLISH_NAV = [
    { name: "Dashboard", href: "/portal/english/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Classes", href: "/portal/english/classes", icon: <Languages size={20} /> },
    { name: "Learners", href: "/portal/english/learners", icon: <Users size={20} /> },
    { name: "Assessments", href: "/portal/english/assessments", icon: <ClipboardCheck size={20} /> },
];

export default function EnglishLayout({ children }) {
    return (
        <DashboardLayout brand="ePathways." subtitle="English Portal" accent="bg-emerald-600" nav={ENGLISH_NAV}>
            {children}
        </DashboardLayout>
    );
}
