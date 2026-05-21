import { Head } from "@inertiajs/react";
import { FileText } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import ComingSoonPanel from "@/components/portal/ComingSoonPanel";

export default function SalesEmailTemplates() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <Head title="Email Templates — Sales" />
            <PortalPageHeader
                eyebrow="Outreach"
                title="Email Templates"
                description="Reusable email templates grouped by stage of the sales cycle."
            />
            <ComingSoonPanel
                icon={<FileText size={22} />}
                title="Template library"
                lines={[
                    "Categories — Initial Response, Follow-up, Document Request, Proposal, Closing.",
                    "Create, edit, archive templates with personalisation variables.",
                    "Preview each template with sample lead data before saving.",
                ]}
            />
        </div>
    );
}
