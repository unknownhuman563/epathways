// Re-export of the immigration "List of Cases" board — resolved under
// portal/agent/ so app.jsx wraps it in AgentLayout. AgentController::cases()
// scopes the payload to this agent's own referrals and passes readOnly=true,
// which the board honours by hiding every write control and the case-profile
// link. Same re-export pattern as portal/agent/Students.
export { default } from '@/pages/portal/immigration/Cases';
