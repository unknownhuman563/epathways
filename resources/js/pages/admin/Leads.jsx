// Admin Leads — reuses the full sales pipeline UI (tabbed table / kanban,
// stage picker, filters, add-lead, agents & events tabs). Resolved under
// admin/ so app.jsx wraps it in AdminLayout; LeadController::index() feeds
// the same rich props the department portals use, plus portalBase="/admin"
// so every row action targets the /admin routes.
export { default } from '@/pages/portal/sales/Leads';
