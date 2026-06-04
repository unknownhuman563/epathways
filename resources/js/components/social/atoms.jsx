import React from 'react';
import { Globe } from 'lucide-react';
import { PLATFORM_BY_ID, SERVICE_BY_ID } from './constants';

// ─── Tiny shared atoms ──────────────────────────────────────────────────

export function Skeleton({ className = '' }) {
    return <div className={`bg-gray-100 animate-pulse rounded-lg ${className}`} />;
}

export function PlatformIcon({ id, size = 14 }) {
    const Cmp = PLATFORM_BY_ID[id]?.icon || Globe;
    return <Cmp size={size} />;
}

export function ServiceChip({ service }) {
    const meta = SERVICE_BY_ID[service];
    if (!meta) return null;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${meta.chip}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
        </span>
    );
}

export function Label({ children, required }) {
    return (
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            {children}{required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
    );
}

export function Input(props) {
    return (
        <input
            {...props}
            className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all placeholder-gray-500 ${props.className || ''}`}
        />
    );
}

export function Textarea({ className, rows = 3, ...rest }) {
    return (
        <textarea
            {...rest}
            rows={rows}
            className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all placeholder-gray-500 resize-y min-h-[80px] ${className || ''}`}
        />
    );
}

export function Select({ children, ...rest }) {
    return (
        <select
            {...rest}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all cursor-pointer"
        >{children}</select>
    );
}

export function EmptyState({ icon, title, body }) {
    return (
        <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-100 mb-4">{icon}</div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">{title}</h3>
            <p className="text-xs text-gray-700 max-w-sm mx-auto leading-relaxed">{body}</p>
        </div>
    );
}
