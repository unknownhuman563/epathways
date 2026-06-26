import DashboardLayout from "./DashboardLayout";
import {
    LayoutDashboard, Home, Users, Workflow, Receipt, Wallet,
    CalendarDays, ClipboardList, Flame, MessageSquare, MessageSquareWarning, BarChart3, User, Bell, Ticket,
} from "lucide-react";

const ACCOMMODATION_NAV = [
    { name: "Dashboard", href: "/portal/accommodation/dashboard", icon: <LayoutDashboard size={20} /> },

    { name: "Work", section: true },
    { name: "Tenants", href: "/portal/accommodation/tenants", icon: <Users size={20} /> },
    { name: "Onboarding", href: "/portal/accommodation/onboarding", icon: <Workflow size={20} /> },
    { name: "Calendar", href: "/portal/accommodation/calendar", icon: <CalendarDays size={20} /> },
    { name: "Rent & Utilities", href: "/portal/accommodation/rent-utilities", icon: <Receipt size={20} /> },
    { name: "PM Payment Schedule", href: "/portal/accommodation/payment-schedule", icon: <Wallet size={20} /> },
    { name: "Task Tracker", href: "/portal/accommodation/tasks", icon: <ClipboardList size={20} /> },
    { name: "Gas Delivery Tracker", href: "/portal/accommodation/gas-delivery", icon: <Flame size={20} /> },
    { name: "Message Templates", href: "/portal/accommodation/message-templates", icon: <MessageSquare size={20} /> },
    { name: "Concerns", href: "/portal/accommodation/concerns", icon: <MessageSquareWarning size={20} /> },

    { name: "Setup", section: true },
    { name: "Properties", href: "/portal/accommodation/properties", icon: <Home size={20} /> },

    { name: "Reports", section: true },
    { name: "Reports", href: "/portal/accommodation/reports", icon: <BarChart3 size={20} /> },

    { name: "Account", section: true },
    { name: "My Profile", href: "/portal/accommodation/profile", icon: <User size={20} /> },
    { name: "Notifications", href: "/portal/accommodation/notifications", icon: <Bell size={20} /> },
    { name: "My Tickets", href: "/portal/tickets", icon: <Ticket size={20} /> },
];

export default function AccommodationLayout({ children }) {
    return (
        <DashboardLayout brand="ePathways." subtitle="Accommodation Portal" accent="bg-[#1F5A8B]" nav={ACCOMMODATION_NAV}>
            {children}
        </DashboardLayout>
    );
}
