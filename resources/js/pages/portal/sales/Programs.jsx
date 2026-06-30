import { Head } from "@inertiajs/react";
import ProgramsManager from "@/components/programs/ProgramsManager";

export default function SalesPrograms({ programs = [] }) {
    return (
        <>
            <Head title="Programs — Sales" />
            <ProgramsManager
                programs={programs}
                portalBase="/portal/sales"
                description="The NZ programs you pitch to leads — the shared catalogue."
            />
        </>
    );
}
