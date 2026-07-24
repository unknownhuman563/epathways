/**
 * Priority presentation, shared by every staff table that draws a profile
 * photo (Sales/Education Leads, Students, Immigration Cases).
 *
 * The ring around an avatar is the only place priority shows once a lead has
 * uploaded a face image, so the colours must not drift between screens —
 * hence one definition rather than a copy per page.
 *
 * Covers both scales: the general lead priority (urgent | medium | low) and
 * the immigration case scale, which adds `high` and `done`.
 *
 * Class names are written out in full — Tailwind's JIT scans source text, so
 * a computed string like `ring-${colour}-500` would never be generated.
 */
export const priorityRing = (priority) => ({
    urgent: 'ring-red-500',
    high:   'ring-orange-500',
    medium: 'ring-yellow-400',
    low:    'ring-emerald-500',
    done:   'ring-emerald-600',
}[priority] || 'ring-gray-300');

/** Sort weight: urgent → high → medium → low → done → no priority set. */
export const priorityRank = (priority) => ({
    urgent: 0,
    high:   1,
    medium: 2,
    low:    3,
    done:   4,
}[priority] ?? 5);
