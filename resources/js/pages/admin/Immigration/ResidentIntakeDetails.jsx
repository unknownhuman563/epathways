// Re-export of the unified IntakeDetails page so the Resident detail
// view shares the same professional-profile layout as Work / Student /
// Visitor. The page resolver name still starts with `admin/` so the
// page auto-wraps in AdminLayout (preserves the existing URL +
// sidebar chrome at /admin/immigration/resident-intakes/{id}).
export { default } from '@/pages/portal/immigration/IntakeDetails';
