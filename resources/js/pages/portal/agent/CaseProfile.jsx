// Re-export of the immigration Case Profile — resolved under portal/agent/ so
// app.jsx wraps it in AgentLayout. AgentController::caseProfile row-scopes the
// case to this agent's own referral, and the page's endpoints are portal-relative
// (resources/js/lib/caseRoutes.js) so its writes post to the agent-portal case
// routes. Same re-export pattern as portal/agent/Cases.
export { default } from '@/pages/portal/immigration/CaseProfile';
