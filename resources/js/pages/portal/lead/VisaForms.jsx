import { Head } from "@inertiajs/react";
import { FileSpreadsheet } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import ComingSoonPanel from "@/components/portal/ComingSoonPanel";

export default function LeadVisaForms({ lead }) {
    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <Head title="Visa Forms" />
            <PortalPageHeader
                eyebrow="Application"
                title="Visa Forms"
                description="Multi-section forms required for your New Zealand student visa, with save-as-draft per section."
            />
            <ComingSoonPanel
                icon={<FileSpreadsheet size={22} />}
                title="Your visa forms will live here"
                lines={[
                    "Six sections: Personal, Education, Work, English, Family, Visa-specific.",
                    "Save your draft any time — pick up where you left off.",
                    "Per-field validation and inline document uploads where requested.",
                    "Final review screen before submission to your Immigration adviser.",
                ]}
            />
        </div>
    );
}
