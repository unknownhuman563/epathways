import { Head } from "@inertiajs/react";
import { GraduationCap } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import ComingSoonPanel from "@/components/portal/ComingSoonPanel";

export default function EducationPrograms() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <Head title="Programs — Education" />
            <PortalPageHeader
                eyebrow="Setup"
                title="Programs"
                description="The NZ programs you advise on — create, edit, and publish from one place."
            />
            <ComingSoonPanel
                icon={<GraduationCap size={22} />}
                title="Programs management"
                lines={[
                    "Lift the existing admin Programs CRUD into this portal so Education staff own it directly.",
                    "Same list, create/edit/archive flow, plus a 'students enrolled in this program' summary.",
                    "Already lives at /admin/programs — wire it through the existing ProgramController.",
                ]}
            />
        </div>
    );
}
