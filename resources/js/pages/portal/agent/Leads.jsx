// Re-export of the sales Leads screen — resolved under portal/agent/ so app.jsx
// wraps it in AgentLayout. AgentController scopes the query to the agent's own
// referrals and passes portal="agent", which switches off every pipeline write
// the agent portal has no endpoint for (stage, visa, notes, import, kanban,
// bulk assign/delete). Same pattern as portal/education|immigration/Leads.
export { default } from '@/pages/portal/sales/Leads';
