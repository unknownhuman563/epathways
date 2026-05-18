import DashboardLayout from "./DashboardLayout";
import { LayoutDashboard, GraduationCap, Users, FileText } from "lucide-react";

const EDUCATION_NAV = [
    { name: "Dashboard", href: "/portal/education/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Programs", href: "/portal/education/programs", icon: <GraduationCap size={20} /> },
    { name: "Students", href: "/portal/education/students", icon: <Users size={20} /> },
    { name: "Applications", href: "/portal/education/applications", icon: <FileText size={20} /> },
];

export default function EducationLayout({ children }) {
    return (
        <DashboardLayout brand="ePathways." subtitle="Education Portal" accent="bg-indigo-600" nav={EDUCATION_NAV}>
            {children}
        </DashboardLayout>
    );
}
