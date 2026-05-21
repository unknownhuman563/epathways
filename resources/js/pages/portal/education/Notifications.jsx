import { Head } from "@inertiajs/react";
import { Bell } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import ComingSoonPanel from "@/components/portal/ComingSoonPanel";

export default function EducationNotifications() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <Head title="Notifications — Education" />
            <PortalPageHeader eyebrow="Account" title="Notifications" description="Activity from your students plus delivery preferences." />
            <ComingSoonPanel
                icon={<Bell size={22} />}
                title="Inbox + preferences"
                lines={[
                    "Activity feed — student uploaded a document, section submitted, agreement signed.",
                    "Per-channel preferences (email / in-portal) for each event type.",
                    "Mark-as-read + bulk-clear so the badge actually means something.",
                ]}
            />
        </div>
    );
}
