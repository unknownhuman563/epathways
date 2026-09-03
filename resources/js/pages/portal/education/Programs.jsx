// Education portal Programs — same module + UI as the admin Programs page.
// Rendered under portal/education/* so app.jsx wraps it in EducationLayout;
// portalBase points the create / edit / delete actions at the education
// routes (which map to the shared ProgramController CRUD).
import AdminPrograms from "@/pages/admin/Programs";

export default function EducationPrograms({ programs = [], schools = [] }) {
    return (
        <AdminPrograms
            programs={programs}
            schools={schools}
            portalBase="/portal/education"
        />
    );
}
