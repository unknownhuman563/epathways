import { Head } from "@inertiajs/react";
import { FileSignature } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import ComingSoonPanel from "@/components/portal/ComingSoonPanel";

export default function LeadAgreements({ lead }) {
    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <Head title="Agreements" />
            <PortalPageHeader
                eyebrow="Sign & continue"
                title="Agreements"
                description="Consultancy and Immigration engagement agreements awaiting your signature."
            />
            <ComingSoonPanel
                icon={<FileSignature size={22} />}
                title="Your agreements will appear here"
                lines={[
                    "Read the full agreement text in-browser, no download needed.",
                    "Sign electronically — your signature is captured and stored.",
                    "Download your signed copy at any time.",
                    "Request clarification from your adviser before signing.",
                ]}
            />
        </div>
    );
}
