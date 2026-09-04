import React from 'react';

/**
 * Program "sections" fields (entry_requirements, employment_outcomes,
 * other_benefits) have accumulated four shapes over the life of the data, and
 * every one of them is still in the table:
 *
 *   1. `{ intro, bullets: [] }`                — a single section
 *   2. `[{ intro, bullets: [] }, …]`           — the current structured shape
 *   3. `{ paragraph, sections: [] }`           — the legacy shape a migration left behind
 *   4. `"plain string"` / `["a", "b"]`         — the oldest, free-text entries
 *
 * `normaliseSections` collapses all four into shape 2 so callers only ever
 * handle one. Kept in one place because the public program page and the
 * tracker's program modal must agree — a client reading the modal and a
 * visitor reading the website should see the same content from the same row.
 */
export function normaliseSections(value) {
    let sections = [];

    if (value && typeof value === 'object' && !Array.isArray(value)) {
        if ('paragraph' in value || 'sections' in value) {
            const legacySections = Array.isArray(value.sections) ? value.sections : [];
            const paragraph = typeof value.paragraph === 'string' ? value.paragraph.trim() : '';
            sections = paragraph ? [{ intro: paragraph, bullets: [] }, ...legacySections] : legacySections;
        } else if ('intro' in value || 'bullets' in value) {
            sections = [value];
        }
    } else if (Array.isArray(value)) {
        const first = value[0];
        if (value.length > 0 && first && typeof first === 'object' && !Array.isArray(first) && ('intro' in first || 'bullets' in first)) {
            sections = value;
        } else {
            const items = value.filter((b) => b && String(b).trim());
            if (items.length === 1) sections = [{ intro: items[0], bullets: [] }];
            else if (items.length > 1) sections = [{ intro: '', bullets: items }];
        }
    } else if (typeof value === 'string' && value.trim()) {
        sections = [{ intro: value, bullets: [] }];
    }

    return sections
        .map((s) => ({
            intro: typeof s?.intro === 'string' ? s.intro.trim() : '',
            bullets: Array.isArray(s?.bullets) ? s.bullets.filter((b) => b && String(b).trim()) : [],
        }))
        .filter((s) => s.intro || s.bullets.length > 0);
}

/** True when a sections field has anything worth rendering a card for. */
export function hasSections(value) {
    return normaliseSections(value).length > 0;
}

/**
 * Render a sections field. `markerClass` colours the bullet markers so each
 * surface can keep its own palette (the public page is olive, the tracker is
 * neutral) without forking the normalisation above.
 */
export function renderSections(value, fallback, markerClass = 'marker:text-[#436235]') {
    const sections = normaliseSections(value);

    if (sections.length === 0) {
        return <p className="text-sm text-gray-500">{fallback}</p>;
    }

    return (
        <div className="space-y-4">
            {sections.map((section, idx) => (
                <div key={idx}>
                    {section.intro && <p>{section.intro}</p>}
                    {section.bullets.length > 0 && (
                        <ul className={`list-disc pl-5 space-y-1.5 ${markerClass} ${section.intro ? 'mt-2' : ''}`}>
                            {section.bullets.map((b, i) => <li key={i}>{b}</li>)}
                        </ul>
                    )}
                </div>
            ))}
        </div>
    );
}
