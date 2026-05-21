// Shared header for lead-portal pages — eyebrow + title + description.
// Keeps page tops visually consistent across the 14 sidebar sections.
export default function PortalPageHeader({ eyebrow, title, description, action = null }) {
    return (
        <header className="flex items-end justify-between gap-4 flex-wrap mb-6">
            <div>
                {eyebrow && (
                    <p className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.32em] mb-1.5">
                        {eyebrow}
                    </p>
                )}
                <h1 className="text-2xl sm:text-3xl font-medium text-[#282728] tracking-tight">{title}</h1>
                {description && (
                    <p className="text-sm text-gray-500 font-light mt-1.5 max-w-2xl leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </header>
    );
}
