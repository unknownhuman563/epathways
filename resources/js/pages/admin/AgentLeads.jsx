// Admin per-agent leads — reuses the sales AgentLeads screen. Resolved under
// admin/ so app.jsx wraps it in AdminLayout; SalesController::agentLeadsPage
// feeds portalBase="/admin" so every row action targets the /admin routes.
//
// A thin wrapper (not a re-export) so this page gets its own layout binding,
// independent of the sales/education copies that share the same view.
import AgentLeadsView from '@/pages/portal/sales/AgentLeads';

export default function AdminAgentLeads(props) {
    return <AgentLeadsView {...props} />;
}
