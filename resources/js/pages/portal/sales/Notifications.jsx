import { Head } from "@inertiajs/react";
import { Bell } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import ComingSoonPanel from "@/components/portal/ComingSoonPanel";

export default function SalesNotifications() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <Head title="Notifications — Sales" />
            <PortalPageHeader
                eyebrow="Account"
                title="Notifications"
                description="Inbox of activity from your leads, plus preferences."
            />
            <ComingSoonPanel
                icon={<Bell size={22} />}
                title="Inbox + preferences"
                lines={[
                    "Activity feed — lead resubmitted assessment, lead signed agreement, document approved, etc.",
                    "Per-channel preferences (email / in-portal) for each event type.",
                    "Mark-as-read + bulk-clear so the badge actually means something.",
                ]}
            />
        </div>
    );
}
