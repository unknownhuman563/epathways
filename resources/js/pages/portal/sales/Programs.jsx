import { Head } from "@inertiajs/react";
import ProgramsManager from "@/components/programs/ProgramsManager";

export default function SalesPrograms({ programs = [], schools = [] }) {
    return (
        <>
            <Head title="Programs — Sales" />
            <ProgramsManager
                programs={programs}
                schools={schools}
                portalBase="/portal/sales"
                description="The NZ programs you pitch to leads — the shared catalogue."
            />
        </>
    );
}
