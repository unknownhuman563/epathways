// Re-export of the admin Lead Details page — same component, but resolving
// the page name under `portal/sales/` causes app.jsx to auto-wrap it in
// SalesLayout instead of AdminLayout. Identical pattern to the immigration
// portal's UserReviews re-export.
export { default } from '@/pages/admin/LeadDetails';
