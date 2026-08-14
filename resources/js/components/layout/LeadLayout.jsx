import DashboardLayout from "./DashboardLayout";
import { usePage, router } from "@inertiajs/react";
import { LayoutDashboard, User, Users, FileText, Eye, ClipboardList } from "lucide-react";

// Lead Portal sidebar. Documents = the tracker's checklist view; Dashboard =
// overview; Family = dependants. Profile sits with Settings in the account
// group at the foot of the sidebar.
const LEAD_NAV = [
    { name: "Dashboard",  href: "/portal/lead/dashboard",    icon: <LayoutDashboard size={20} /> },
    { name: "Forms",      href: "/portal/lead/forms",        icon: <ClipboardList size={20} /> },
    { name: "Documents",  href: "/portal/lead/requirements", icon: <FileText size={20} /> },
    { name: "Family",     href: "/portal/lead/family",       icon: <Users size={20} /> },
];

// Account links pinned to the bottom, directly above Settings.
const LEAD_FOOTER_NAV = [
    { name: "Profile", href: "/portal/lead/profile", icon: <User size={18} /> },
];

export default function LeadLayout({ children }) {
    const preview = usePage().props?.leadPortalPreview;
    return (
        <DashboardLayout
            brand="ePathways."
            subtitle={preview?.active ? "Client Portal (preview)" : "Your Portal"}
            accent="bg-[#009688]"
            nav={LEAD_NAV}
            footerNav={LEAD_FOOTER_NAV}
            settingsHref="/portal/lead/settings"
        >
            {preview?.active && <PreviewBanner preview={preview} />}
            {children}
        </DashboardLayout>
    );
}

// Shown only to staff previewing the client portal. Read-only; a picker lets
// them switch which client's portal they're looking at.
function PreviewBanner({ preview }) {
    const switchClient = (id) => {
        if (!id) return;
        // Reload the current page with the chosen client as preview context.
        router.get(window.location.pathname, { preview_lead: id }, { preserveScroll: true });
    };
    return (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-amber-800">
                <Eye size={14} /> Staff preview — read only
            </span>
            <span className="text-[12.5px] text-amber-700">
                Viewing <span className="font-semibold">{preview.name}</span>'s portal. Changes are disabled.
            </span>
            {preview.candidates?.length > 0 && (
                <select
                    value={preview.current_id || ""}
                    onChange={(e) => switchClient(e.target.value)}
                    className="ml-auto text-[12px] rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-amber-900 focus:outline-none focus:border-amber-500"
                >
                    {!preview.current_id && <option value="">Choose a client…</option>}
                    {preview.candidates.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            )}
        </div>
    );
}
