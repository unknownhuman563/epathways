import { usePage } from "@inertiajs/react";
import AdminLayout from "./AdminLayout";
import SalesLayout from "./SalesLayout";
import EducationLayout from "./EducationLayout";
import EnglishLayout from "./EnglishLayout";
import ImmigrationLayout from "./ImmigrationLayout";
import AccommodationLayout from "./AccommodationLayout";
import FinanceLayout from "./FinanceLayout";
import AgentLayout from "./AgentLayout";
import LeadLayout from "./LeadLayout";

// Layout chooser for role-agnostic authenticated pages (e.g. the AI Assistant)
// that are reachable from every portal. The URL is the same for everyone, so we
// pick the chrome from the signed-in user's role — that way the page keeps the
// same sidebar the user sees everywhere else.
const BY_ROLE = {
    super_admin: AdminLayout,
    admin: AdminLayout,
    sales: SalesLayout,
    education: EducationLayout,
    english: EnglishLayout,
    immigration: ImmigrationLayout,
    immigration_manager: ImmigrationLayout,
    immigration_adviser: ImmigrationLayout,
    accommodation: AccommodationLayout,
    finance: FinanceLayout,
    agent: AgentLayout,
    lead: LeadLayout,
};

export default function RoleLayout({ children }) {
    const { props } = usePage();
    const role = props?.auth?.user?.role;
    const Layout = BY_ROLE[role] || AdminLayout;

    return <Layout>{children}</Layout>;
}
