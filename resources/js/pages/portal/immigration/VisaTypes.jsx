import { Head } from "@inertiajs/react";
import { FileBadge } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import ComingSoonPanel from "@/components/portal/ComingSoonPanel";

export default function ImmigrationVisaTypes() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <Head title="Visa Types — Immigration" />
            <PortalPageHeader eyebrow="Setup" title="Visa Types" description="NZ visa categories you work with, with default processing windows." />
            <ComingSoonPanel icon={<FileBadge size={22} />} title="Visa-type library" lines={[
                "Each visa type: name, INZ form references, expected processing time, default checklist template.",
                "Drives the INZ pipeline chart's aging buckets on the dashboard.",
                "Editable per visa type — flag when INZ changes published processing times.",
            ]} />
        </div>
    );
}
