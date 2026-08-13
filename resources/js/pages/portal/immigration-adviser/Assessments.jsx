import { Head } from "@inertiajs/react";
import ImmigrationAssessments from "@/pages/portal/immigration/Assessments";

// Adviser "Visa Assessment" — the same manager Assessments UI/UX, under the
// adviser chrome. Data comes from the manager's shared assessmentsPayload().
export default function AdviserAssessments(props) {
    return (
        <div className="space-y-4">
            <Head title="Visa Assessment" />
            <div className="max-w-[1400px] mx-auto">
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Visa Assessment</h1>
                <p className="text-sm text-gray-500 mt-1">Incoming visa assessment intakes.</p>
            </div>
            <ImmigrationAssessments {...props} />
        </div>
    );
}
