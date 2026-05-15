import DashboardLayout from "./DashboardLayout";
import { LayoutDashboard, Globe, FileText, Star, FolderCheck } from "lucide-react";

const IMMIGRATION_NAV = [
    { name: "Dashboard", href: "/portal/immigration/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Cases", href: "/portal/immigration/cases", icon: <Globe size={20} /> },
    { name: "Resident Intakes", href: "/portal/immigration/resident-intakes", icon: <FileText size={20} /> },
    { name: "Documents", href: "/portal/immigration/documents", icon: <FolderCheck size={20} /> },
    { name: "User Reviews", href: "/portal/immigration/user-reviews", icon: <Star size={20} /> },
];

export default function ImmigrationLayout({ children }) {
    return (
        <DashboardLayout brand="ePathways." subtitle="Immigration Portal" accent="bg-amber-600" nav={IMMIGRATION_NAV}>
            {children}
        </DashboardLayout>
    );
}
