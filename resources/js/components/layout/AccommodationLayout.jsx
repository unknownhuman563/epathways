import DashboardLayout from "./DashboardLayout";
import { LayoutDashboard, Home } from "lucide-react";

const ACCOMMODATION_NAV = [
    { name: "Dashboard", href: "/portal/accommodation/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Properties", href: "/portal/accommodation/properties", icon: <Home size={20} /> },
];

export default function AccommodationLayout({ children }) {
    return (
        <DashboardLayout brand="ePathways." subtitle="Accommodation Portal" accent="bg-rose-600" nav={ACCOMMODATION_NAV}>
            {children}
        </DashboardLayout>
    );
}
