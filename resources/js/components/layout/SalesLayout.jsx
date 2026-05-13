import DashboardLayout from "./DashboardLayout";
import { LayoutDashboard, Users, CalendarCheck } from "lucide-react";

const SALES_NAV = [
    { name: "Dashboard", href: "/portal/sales/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Leads", href: "/portal/sales/leads", icon: <Users size={20} /> },
    { name: "Bookings", href: "/portal/sales/bookings", icon: <CalendarCheck size={20} /> },
];

export default function SalesLayout({ children }) {
    return (
        <DashboardLayout brand="ePathways." subtitle="Sales Portal" accent="bg-blue-600" nav={SALES_NAV}>
            {children}
        </DashboardLayout>
    );
}
