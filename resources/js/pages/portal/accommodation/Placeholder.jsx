import { Head } from "@inertiajs/react";
import { Construction } from "lucide-react";

/**
 * Generic "coming soon" stub for accommodation portal sections that are
 * scaffolded in the sidebar but not yet built. Driven entirely by props so a
 * single component backs every placeholder route (see routes/web.php).
 */
export default function AccommodationPlaceholder({ title = "Coming soon", description = "" }) {
    return (
        <div className="max-w-3xl mx-auto">
            <Head title={`${title} — Accommodation`} />

            <div className="bg-white rounded-3xl border border-gray-50 shadow-sm px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1F5A8B]/10 text-[#1F5A8B]">
                    <Construction size={26} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
                <span className="mt-5 inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                    Coming soon
                </span>
            </div>
        </div>
    );
}
