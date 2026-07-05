import SalesLeads from "@/pages/portal/sales/Leads";

// Admin Leads reuses the sales Leads experience (opportunities table, kanban,
// events, inline stage editing) under the admin layout. The controller passes
// portal="sales" so the shared component's actions hit the sales routes, which
// admins may access; results flash back to /admin/leads.
export default function AdminLeads(props) {
    return <SalesLeads {...props} />;
}
