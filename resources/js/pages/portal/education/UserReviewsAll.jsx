// Re-export of the unified admin User Reviews page. Living under
// portal/education/ makes app.jsx wrap it with EducationLayout, so education
// staff see their own sidebar chrome — same React component as the admin
// page, different layout.
export { default } from '@/pages/admin/UserReviewsAll';
