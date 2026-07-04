// Reusable staff / user avatar. Shows the uploaded profile photo when an
// `src` (User.avatar_url) is provided, otherwise falls back to colored
// initials derived from the name. Use this everywhere a staff avatar shows so
// an uploaded picture appears consistently across the app (task board, lists,
// pickers, menus, …).

const PALETTE = [
    'bg-slate-700', 'bg-indigo-600', 'bg-emerald-600', 'bg-rose-600',
    'bg-amber-600', 'bg-cyan-700', 'bg-violet-600', 'bg-fuchsia-600',
    'bg-teal-600', 'bg-blue-600',
];

export const avatarInitials = (name = '') => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    const first = parts[0][0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
};

const colorFor = (key = '') => {
    const s = String(key);
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return PALETTE[h % PALETTE.length];
};

/**
 * @param {string}  name      - display name (for initials + alt/title)
 * @param {string}  src       - image URL (avatar_url); when set, shows the photo
 * @param {any}     colorKey  - stable key for the fallback colour (e.g. user id)
 * @param {number}  size      - pixel size (width == height)
 * @param {boolean} ring      - white ring (for overlapping stacks)
 */
export default function Avatar({ name = '', src = null, colorKey, size = 28, className = '', ring = false, title }) {
    const px = typeof size === 'number' ? `${size}px` : size;
    const ringCls = ring ? 'ring-2 ring-white' : '';

    if (src) {
        return (
            <img
                src={src}
                alt={name || ''}
                title={title ?? name}
                style={{ width: px, height: px }}
                className={`rounded-full object-cover bg-gray-100 ${ringCls} ${className}`}
            />
        );
    }

    return (
        <span
            title={title ?? name}
            style={{ width: px, height: px, fontSize: `calc(${px} * 0.4)`, lineHeight: 1 }}
            className={`inline-flex items-center justify-center rounded-full text-white font-bold shrink-0 ${colorFor(colorKey ?? name)} ${ringCls} ${className}`}
        >
            {avatarInitials(name)}
        </span>
    );
}
