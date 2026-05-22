import { Head } from "@inertiajs/react";
import { ListChecks } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import ComingSoonPanel from "@/components/portal/ComingSoonPanel";

export default function ImmigrationChecklistTemplates() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <Head title="Checklist Templates — Immigration" />
            <PortalPageHeader eyebrow="Setup" title="Checklist Templates" description="Document-checklist templates scoped per visa type." />
            <ComingSoonPanel icon={<ListChecks size={22} />} title="Per-visa-type templates" lines={[
                "Student Visa, Skilled Migrant, Partner of NZer, Work Visa templates — each with its own document set.",
                "Templates apply to a case at engagement; staff can swap mid-case if visa pathway changes.",
                "Shared template engine with Education — same checklist_templates table, scoped by visa_type vs program.",
            ]} />
        </div>
    );
}
