// Re-export of the Education Assessments page — same component, but
// living under portal/sales/ makes app.jsx wrap it with SalesLayout so
// sales staff see their own sidebar chrome. Detail URLs are scoped via
// the controller (SalesController::assessmentRows uses /portal/sales/...).
export { default } from '@/pages/portal/education/Assessments';
