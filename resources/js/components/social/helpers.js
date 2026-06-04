// Shared date / calendar helpers for the Social section.
// Plain JS (no JSX, no React) so any sub-page can import without ceremony.

export function formatHuman(iso) {
    const d = new Date(iso);
    return d.toLocaleString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

export function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}

// Monday-start week (NZ business convention).
export function startOfWeek(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    const day = (x.getDay() + 6) % 7; // 0 = Monday
    x.setDate(x.getDate() - day);
    return x;
}

export function toLocalInput(d) {
    // datetime-local needs "YYYY-MM-DDTHH:mm" in the user's local TZ.
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function gradientForService(svc) {
    switch (svc) {
        case 'education':     return 'bg-gradient-to-br from-indigo-400 to-indigo-700';
        case 'immigration':   return 'bg-gradient-to-br from-rose-400 to-rose-700';
        case 'accommodation': return 'bg-gradient-to-br from-emerald-400 to-emerald-700';
        default:              return 'bg-gradient-to-br from-gray-400 to-gray-700';
    }
}
