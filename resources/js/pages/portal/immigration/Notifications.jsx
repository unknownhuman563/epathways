import { Head } from "@inertiajs/react";
import { Bell } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import ComingSoonPanel from "@/components/portal/ComingSoonPanel";

export default function ImmigrationNotifications() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <Head title="Notifications — Immigration" />
            <PortalPageHeader eyebrow="Account" title="Notifications" description="Activity on your cases plus delivery preferences." />
            <ComingSoonPanel icon={<Bell size={22} />} title="Inbox + preferences" lines={[
                "Activity feed — INZ status change, document uploaded, info request received, agreement signed.",
                "Per-channel preferences (email / in-portal) for each event type.",
                "IAA-compliance alerts (licence expiry, mandatory agreements pending) escalated separately.",
            ]} />
        </div>
    );
}
