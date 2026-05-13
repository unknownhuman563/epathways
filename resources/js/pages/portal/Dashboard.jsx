import { Head } from "@inertiajs/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { LayoutDashboard, Users, GraduationCap, Languages, Globe, Home } from "lucide-react";

// Per-portal presentation for the scaffold dashboards (education / english /
// immigration / accommodation). Sales has its own dedicated pages.
const PORTALS = {
    education: {
        label: "Education", subtitle: "Education Portal", accent: "bg-indigo-600", icon: <GraduationCap size={20} />,
        stats: ["Active students", "Applications", "Offers issued", "Enrolments"],
        blurb: "Scaffold for the education team — wire up programmes, student applications, offers and enrolments here.",
    },
    english: {
        label: "English", subtitle: "English Portal", accent: "bg-emerald-600", icon: <Languages size={20} />,
        stats: ["Active learners", "Classes running", "Assessments due", "Completions"],
        blurb: "Scaffold for the English language team — wire up learners, class schedules, assessments and completions here.",
    },
    immigration: {
        label: "Immigration", subtitle: "Immigration Portal", accent: "bg-amber-600", icon: <Globe size={20} />,
        stats: ["Open cases", "Resident intakes", "Awaiting documents", "Approved"],
        blurb: "Scaffold for the immigration team — wire up visa cases, resident intakes, document tracking and approvals here.",
    },
    accommodation: {
        label: "Accommodation", subtitle: "Accommodation Portal", accent: "bg-rose-600", icon: <Home size={20} />,
        stats: ["Listings", "Pending placements", "Move-ins this month", "Occupancy"],
        blurb: "Scaffold for the accommodation team — wire up listings, placements, move-ins and occupancy here.",
    },
};

export default function PortalDashboard({ portal }) {
    const cfg = PORTALS[portal] || {
        label: portal, subtitle: "Portal", accent: "bg-gray-800", icon: <LayoutDashboard size={20} />, stats: [], blurb: "",
    };
    const nav = [{ name: "Dashboard", href: `/portal/${portal}/dashboard`, icon: <LayoutDashboard size={20} /> }];

    return (
        <DashboardLayout brand="ePathways." subtitle={cfg.subtitle} accent={cfg.accent} nav={nav}>
            <Head title={`${cfg.label} Dashboard`} />

            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {cfg.stats.map((label) => (
                        <div key={label} className="bg-white rounded-3xl border border-gray-50 shadow-sm p-6">
                            <p className="text-sm text-gray-500">{label}</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900 tracking-tight">—</p>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-3xl border border-gray-50 shadow-sm p-8">
                    <div className="flex items-center gap-3">
                        <span className={`p-2 rounded-xl ${cfg.accent} text-white`}>{cfg.icon}</span>
                        <h2 className="text-lg font-bold text-gray-900">{cfg.label} portal</h2>
                    </div>
                    <p className="mt-3 text-sm text-gray-500 max-w-2xl">{cfg.blurb}</p>
                    <p className="mt-4 text-xs text-gray-400">resources/js/pages/portal/Dashboard.jsx</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
