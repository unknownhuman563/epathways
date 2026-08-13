import { Head } from "@inertiajs/react";
import ImmigrationCases from "@/pages/portal/immigration/Cases";

// Adviser "Cases" / "My Cases" — the exact manager List of Cases UI/UX, under
// the adviser chrome. All data comes from the manager's shared casesPayload(),
// so the two lists never drift.
export default function AdviserCases({ pageTitle = "Cases", pageSubtitle = "", ...props }) {
    return (
        <div className="space-y-4">
            <Head title={pageTitle} />
            <div className="max-w-[1400px] mx-auto">
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{pageTitle}</h1>
                {pageSubtitle && <p className="text-sm text-gray-500 mt-1">{pageSubtitle}</p>}
            </div>
            <ImmigrationCases {...props} />
        </div>
    );
}
