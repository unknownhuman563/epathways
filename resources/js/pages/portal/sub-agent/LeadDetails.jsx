// Re-export of the admin Lead Details page — same component, but resolving
// the page name under `portal/sub-agent/` makes app.jsx wrap it in SubAgentLayout
// instead of AdminLayout, so opening a lead never swaps the sidebar out from
// under the user. Same pattern as portal/sales/LeadDetails.
export { default } from '@/pages/admin/LeadDetails';
