import { Head } from "@inertiajs/react";
import { Send } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import ComingSoonPanel from "@/components/portal/ComingSoonPanel";

export default function SalesBulkEmail() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <Head title="Bulk Email — Sales" />
            <PortalPageHeader
                eyebrow="Outreach"
                title="Bulk Email"
                description="Send personalised emails to a list of leads — one off, or scheduled."
            />
            <ComingSoonPanel
                icon={<Send size={22} />}
                title="Compose · Schedule · History"
                lines={[
                    "Compose flow — pick recipients from a saved segment or tick leads from a list.",
                    "Template picker with live personalisation preview (e.g. {{first_name}}, {{stage}}).",
                    "Send immediately or schedule for later — queued worker dispatches at the chosen time.",
                    "Full history of past sends with status (sent / failed / scheduled).",
                ]}
            />
        </div>
    );
}
