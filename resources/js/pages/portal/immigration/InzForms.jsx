import { Head } from "@inertiajs/react";
import { FileText } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import ComingSoonPanel from "@/components/portal/ComingSoonPanel";

export default function ImmigrationInzForms() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <Head title="INZ Forms — Immigration" />
            <PortalPageHeader eyebrow="Setup" title="INZ Forms" description="Latest INZ form templates and reference materials." />
            <ComingSoonPanel icon={<FileText size={22} />} title="INZ form library" lines={[
                "Versioned PDF library of INZ1012 / 1014 / 1226 / 1027 etc.",
                "Auto-fill from case data where possible — generates a pre-filled PDF you can review.",
                "Surfaces 'this form version was superseded on DATE' warnings when INZ updates.",
            ]} />
        </div>
    );
}
