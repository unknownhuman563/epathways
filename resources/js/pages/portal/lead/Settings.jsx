import { Head } from "@inertiajs/react";
import { Settings as Cog } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import ComingSoonPanel from "@/components/portal/ComingSoonPanel";

export default function LeadSettings({ lead }) {
    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <Head title="Settings" />
            <PortalPageHeader
                eyebrow="Account"
                title="Settings"
                description="Notification preferences, language, timezone, and data controls."
            />
            <ComingSoonPanel
                icon={<Cog size={22} />}
                title="Settings will appear here"
                lines={[
                    "Notification preferences — per channel (email, in-portal) and per event.",
                    "Language and timezone.",
                    "Export all your data as a download.",
                    "Request account deletion.",
                ]}
            />
        </div>
    );
}
