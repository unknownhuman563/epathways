import { Head } from "@inertiajs/react";
import { BarChart3 } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import ComingSoonPanel from "@/components/portal/ComingSoonPanel";

export default function SalesCampaigns() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <Head title="Campaigns — Sales" />
            <PortalPageHeader
                eyebrow="Outreach"
                title="Campaigns"
                description="Analytics on bulk-email campaigns you've sent."
            />
            <ComingSoonPanel
                icon={<BarChart3 size={22} />}
                title="Per-campaign analytics"
                lines={[
                    "Sent · Opened · Clicked · Bounced · Unsubscribed counts per campaign.",
                    "Drill into per-recipient detail to see who engaged.",
                    "Open + click tracking via the email provider's webhooks (Mailgun / Postmark).",
                ]}
            />
        </div>
    );
}
