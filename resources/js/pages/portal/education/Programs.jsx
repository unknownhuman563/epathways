import { Head } from "@inertiajs/react";
import ProgramsManager from "@/components/programs/ProgramsManager";

export default function EducationPrograms({ programs = [] }) {
    return (
        <>
            <Head title="Programs — Education" />
            <ProgramsManager
                programs={programs}
                portalBase="/portal/education"
                description="The NZ programs you advise on — the same catalogue admin maintains."
            />
        </>
    );
}
