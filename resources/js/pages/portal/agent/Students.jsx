// Re-export of the Education Students screen — resolved under portal/agent/ so
// app.jsx wraps it in AgentLayout. The controller scopes the rows to this
// portal's own referrals and sets `readOnly`, which switches off every write
// on the screen. Same pattern as portal/sales/Students.
export { default } from '@/pages/portal/education/Students';
