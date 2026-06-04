import { Link } from "@inertiajs/react";

// Renders Laravel paginator `links` ([{ url, label, active }]) as Inertia links.
// Hidden when there's only a single page (links = prev + "1" + next = 3 entries).
export default function Pagination({ links = [], className = "" }) {
    if (!links || links.length <= 3) return null;

    return (
        <nav className={`flex flex-wrap items-center justify-center gap-1 ${className}`}>
            {links.map((link, i) =>
                link.url ? (
                    <Link
                        key={i}
                        href={link.url}
                        preserveScroll
                        preserveState
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                            link.active
                                ? "bg-rose-600 text-white"
                                : "text-gray-600 hover:bg-gray-100"
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <span
                        key={i}
                        className="px-3 py-1.5 text-sm text-gray-300"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                )
            )}
        </nav>
    );
}
