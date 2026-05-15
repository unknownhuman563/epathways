import DashboardLayout from "./DashboardLayout";
import {
    Home, Users, UserCog, History, Calendar as CalendarIcon, BookOpen,
    GraduationCap, Video, Globe, FileText, Star, LayoutDashboard,
    Briefcase, Languages, Building2,
} from "lucide-react";

const ADMIN_NAV = [
    { name: "Dashboard", href: "/admin/dashboard", icon: <Home size={20} /> },
    { name: "Leads", href: "/admin/leads", icon: <Users size={20} /> },
    { name: "Events", href: "/admin/events", icon: <CalendarIcon size={20} /> },
    { name: "Bookings", href: "/admin/booking", icon: <BookOpen size={20} /> },
    { name: "Programs", href: "/admin/programs", icon: <GraduationCap size={20} /> },
    { name: "Facebook Live", href: "/admin/facebook-live", icon: <Video size={20} /> },
    {
        name: "Immigration",
        icon: <Globe size={20} />,
        children: [
            { name: "Resident Visa Intake", href: "/admin/immigration/resident-intakes", icon: <FileText size={16} /> },
            { name: "User Reviews", href: "/admin/immigration/user-reviews", icon: <Star size={16} /> },
        ],
    },
    {
        // Cross-portal view — admin can open any role's dashboard.
        name: "Portals",
        icon: <LayoutDashboard size={20} />,
        children: [
            { name: "Sales Portal", href: "/portal/sales/dashboard", icon: <Briefcase size={16} /> },
            { name: "Education Portal", href: "/portal/education/dashboard", icon: <GraduationCap size={16} /> },
            { name: "English Portal", href: "/portal/english/dashboard", icon: <Languages size={16} /> },
            { name: "Immigration Portal", href: "/portal/immigration/dashboard", icon: <Globe size={16} /> },
            { name: "Accommodation Portal", href: "/portal/accommodation/dashboard", icon: <Building2 size={16} /> },
        ],
    },
    { name: "User Management", href: "/admin/users", icon: <UserCog size={20} /> },
    { name: "Activity Log", href: "/admin/activity-logs", icon: <History size={20} /> },
];

export default function AdminLayout({ children }) {
    return (
        <DashboardLayout
            brand="ePathways."
            subtitle="Admin Panel"
            accent="bg-gray-900"
            nav={ADMIN_NAV}
            settingsHref="/admin/settings"
        >
            {children}
        </DashboardLayout>
    );
}
