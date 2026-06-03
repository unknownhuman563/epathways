// Shared lookup tables for the Social section. Kept in plain JS (no JSX) so
// every sub-page can import without dragging in React. Icons referenced
// here are lucide-react components — consumed by PlatformIcon in ./atoms.

import {
    Facebook, Instagram, Linkedin, Youtube, Music2, Bookmark,
} from 'lucide-react';

export const PLATFORMS = [
    { id: 'instagram', label: 'Instagram', icon: Instagram },
    { id: 'facebook',  label: 'Facebook',  icon: Facebook },
    { id: 'tiktok',    label: 'TikTok',    icon: Music2 },
    { id: 'linkedin',  label: 'LinkedIn',  icon: Linkedin },
    { id: 'youtube',   label: 'YouTube',   icon: Youtube },
    { id: 'pinterest', label: 'Pinterest', icon: Bookmark },
];
export const PLATFORM_BY_ID = Object.fromEntries(PLATFORMS.map((p) => [p.id, p]));

export const SERVICES = [
    { id: 'education',     label: 'Education',     dot: 'bg-indigo-500',  chip: 'bg-indigo-50 text-indigo-700 border-indigo-200',   accent: '#6366f1' },
    { id: 'immigration',   label: 'Immigration',   dot: 'bg-rose-500',    chip: 'bg-rose-50 text-rose-700 border-rose-200',          accent: '#f43f5e' },
    { id: 'accommodation', label: 'Accommodation', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', accent: '#10b981' },
];
export const SERVICE_BY_ID = Object.fromEntries(SERVICES.map((s) => [s.id, s]));

export const TONES = ['Friendly', 'Professional', 'Urgent', 'Inspirational'];

// Smart platform defaults per service — the user can still override.
export const DEFAULT_PLATFORMS_BY_SERVICE = {
    education:     ['instagram', 'tiktok', 'youtube'],
    immigration:   ['facebook',  'linkedin', 'youtube'],
    accommodation: ['instagram', 'pinterest'],
};

export const MODEL_LABELS = { claude: 'Claude', gpt: 'GPT', gemini: 'Gemini' };
