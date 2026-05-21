import { Head } from "@inertiajs/react";
import { MessageSquare } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import ComingSoonPanel from "@/components/portal/ComingSoonPanel";

export default function LeadMessages({ lead }) {
    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <Head title="Messages" />
            <PortalPageHeader
                eyebrow="Stay in touch"
                title="Messages"
                description="Conversations with your assigned ePathways team."
            />
            <ComingSoonPanel
                icon={<MessageSquare size={22} />}
                title="Your message threads will live here"
                lines={[
                    "Thread per staff member (Sales / Education / Immigration).",
                    "Compose with attachments, see the full conversation history.",
                    "Not real-time — staff respond in business hours; we'll notify you when they reply.",
                ]}
            />
        </div>
    );
}
