import { Head } from "@inertiajs/react";
import { ListChecks } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import ComingSoonPanel from "@/components/portal/ComingSoonPanel";

export default function EducationChecklistTemplates() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <Head title="Checklist Templates — Education" />
            <PortalPageHeader
                eyebrow="Setup"
                title="Checklist Templates"
                description="Reusable document-checklist templates applied to students based on their pathway."
            />
            <ComingSoonPanel
                icon={<ListChecks size={22} />}
                title="Pathway-scoped templates"
                lines={[
                    "Today the checklist is one hard-coded list in the frontend. Lift it into a checklist_templates table so each template is editable.",
                    "Templates per pathway — Standard Student Visa, Master's Applicant, Partner of Student, etc.",
                    "Each student gets a template applied at engagement. Staff can swap templates from the student detail page.",
                    "When a template changes, existing students keep their applied snapshot — they don't get re-flowed.",
                ]}
            />
        </div>
    );
}
