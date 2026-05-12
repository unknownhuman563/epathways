import DashboardLayout from "./DashboardLayout";
import {
    Home, Users, UserCog, History, Calendar as CalendarIcon, BookOpen,
    GraduationCap, Video, Globe, FileText, Star,
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
