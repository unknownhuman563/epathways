import DashboardLayout from "./DashboardLayout";
import { LayoutDashboard, FileText, Star } from "lucide-react";

const IMMIGRATION_NAV = [
    { name: "Dashboard", href: "/portal/immigration/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Resident Visa Intakes", href: "/admin/immigration/resident-intakes", icon: <FileText size={20} /> },
    { name: "User Reviews", href: "/admin/immigration/user-reviews", icon: <Star size={20} /> },
];

export default function ImmigrationLayout({ children }) {
    return (
        <DashboardLayout
            brand="ePathways."
            subtitle="Immigration Portal"
            accent="bg-[#00A693]"
            nav={IMMIGRATION_NAV}
        >
            {children}
        </DashboardLayout>
    );
}
