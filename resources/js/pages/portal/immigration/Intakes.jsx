import { Head } from "@inertiajs/react";
import { CalendarDays } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import ComingSoonPanel from "@/components/portal/ComingSoonPanel";

export default function ImmigrationIntakes() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <Head title="Intakes — Immigration" />
            <PortalPageHeader eyebrow="Setup" title="Intakes" description="Study intake calendar — referenced by Education, owned by Immigration." />
            <ComingSoonPanel icon={<CalendarDays size={22} />} title="Intake calendar" lines={[
                "Per-institution intake dates (Feb, Jul, Nov 2026; Feb 2027 …).",
                "Backs the 'preferred intake' selector on the student conversion modal.",
                "Visible from Education read-only; Immigration owns the source of truth.",
            ]} />
        </div>
    );
}
