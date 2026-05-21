import { Head } from "@inertiajs/react";
import { FileCheck } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import ComingSoonPanel from "@/components/portal/ComingSoonPanel";

export default function LeadProposals({ lead }) {
    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <Head title="Proposals" />
            <PortalPageHeader
                eyebrow="Decision"
                title="Proposals"
                description="Pathway proposals your adviser has prepared for you to review and decide on."
            />
            <ComingSoonPanel
                icon={<FileCheck size={22} />}
                title="Your proposals will appear here"
                lines={[
                    "View each proposal in-browser or download as PDF.",
                    "Decide: Happy to proceed · Still thinking · Will not pursue (with reason).",
                    "Your decision is shared instantly with your adviser.",
                ]}
            />
        </div>
    );
}
