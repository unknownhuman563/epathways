import DashboardLayout from "./DashboardLayout";
import { Clock, LayoutDashboard, ClipboardList } from "lucide-react";

const FINANCE_NAV = [
    { name: "Dashboard", href: "/portal/finance/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Task Board", href: "/portal/finance/tasks", icon: <ClipboardList size={20} /> },
    { name: "Daily Time Record", href: "/portal/finance/dtr", icon: <Clock size={20} /> },
];

export default function FinanceLayout({ children }) {
    return (
        <DashboardLayout brand="ePathways." subtitle="Finance Portal" accent="bg-indigo-600" nav={FINANCE_NAV}>
            {children}
        </DashboardLayout>
    );
}
