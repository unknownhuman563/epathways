import DashboardLayout from "./DashboardLayout";
import {
    Home, Users, UserCog, History, Calendar as CalendarIcon, BookOpen,
    GraduationCap, Video, Globe, FileText, Star, LayoutDashboard,
    Briefcase, Languages, Building2, KeyRound, Sparkles, Tag,
    Radio, PenLine, CalendarDays, Inbox, Megaphone, BarChart3,
    CheckSquare, Clock,
} from "lucide-react";

const ADMIN_NAV = [
    { name: "Dashboard", href: "/admin/dashboard", icon: <Home size={20} /> },
    { name: "Leads", href: "/admin/leads", icon: <Users size={20} /> },
    { name: "Portal Invitations", href: "/admin/portal-invitations", icon: <KeyRound size={20} /> },
    { name: "Events", href: "/admin/events", icon: <CalendarIcon size={20} /> },
    { name: "Bookings", href: "/admin/booking", icon: <BookOpen size={20} /> },
    { name: "Availability", href: "/admin/availability", icon: <Clock size={20} /> },
    { name: "Programs", href: "/admin/programs", icon: <GraduationCap size={20} /> },
    { name: "Promotions", href: "/admin/promos", icon: <Tag size={20} /> },
    { name: "Facebook Live", href: "/admin/facebook-live", icon: <Video size={20} /> },
    {
        name: "Social",
        icon: <Radio size={20} />,
        children: [
            { name: "Compose",     href: "/social/compose",     icon: <PenLine size={16} /> },
            { name: "Scheduled",   href: "/social/scheduled",   icon: <CalendarDays size={16} /> },
            { name: "Inbox",       href: "/social/inbox",       icon: <Inbox size={16} /> },
            { name: "Ads",         href: "/social/ads",         icon: <Megaphone size={16} /> },
            { name: "Performance", href: "/social/performance", icon: <BarChart3 size={16} /> },
            { name: "Accounts",    href: "/social/accounts",    icon: <Users size={16} /> },
        ],
    },
    // Single User Reviews page — tabs between Immigration and Education
    // inside the page so staff doesn't have to bounce between sidebar links.
    { name: "User Reviews", href: "/admin/user-reviews", icon: <Star size={20} /> },
    {
        name: "Immigration",
        icon: <Globe size={20} />,
        children: [
            { name: "Dashboard", href: "/portal/immigration/dashboard", icon: <LayoutDashboard size={16} /> },
            { name: "Resident Visa Intake", href: "/admin/immigration/resident-intakes", icon: <FileText size={16} /> },
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
    { name: "All Tasks", href: "/admin/tasks", icon: <CheckSquare size={20} /> },
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
