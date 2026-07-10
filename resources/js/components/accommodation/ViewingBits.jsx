import React from 'react';
import { CheckCircle2, Home, MapPin, BedDouble, Bath } from 'lucide-react';
import { money, splitIncludes } from './useViewingBooking';

export const ACCENT = '#1F5A8B';
export const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#1F5A8B]/25 focus:border-[#1F5A8B] transition';

// Inline DayPicker styling — set here (not in a stylesheet) because
// react-day-picker's own style.css imports after app.css and would otherwise
// win the cascade. Compact sizes keep the calendar inside narrow cards/modals
// without clipping the Sun–Mon columns.
export const RDP_STYLE = {
    '--rdp-accent-color': ACCENT,
    '--rdp-accent-background-color': '#1F5A8B15',
    '--rdp-day-width': '38px',
    '--rdp-day-height': '38px',
    '--rdp-day_button-width': '38px',
    '--rdp-day_button-height': '38px',
    '--rdp-nav_button-width': '30px',
    '--rdp-nav_button-height': '30px',
    fontSize: '0.8rem',
};

// Shared "viewing requested" confirmation panel.
export function Success({ selected, onReset }) {
    return (
        <div className="text-center p-8">
            <div className="w-14 h-14 rounded-full bg-[#1F5A8B]/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-[#1F5A8B]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Viewing requested</h3>
            <p className="text-sm text-gray-500 mt-2">
                We've saved your viewing{selected ? <> for <span className="font-semibold text-gray-700">{selected.name}</span></> : ''}. We'll email you to confirm.
            </p>
            <button onClick={onReset} className="mt-5 text-sm font-semibold text-[#1F5A8B] hover:underline">Book another</button>
        </div>
    );
}

// Compact property preview (photo + key facts). `dense` trims to one line.
export function PropertyMini({ p, dense = false }) {
    if (!p) return null;
    const includes = splitIncludes(p.includes);
    return (
        <div className="flex gap-3 items-start">
            <div className={`${dense ? 'w-14 h-14' : 'w-20 h-20'} rounded-xl overflow-hidden bg-gray-100 shrink-0`}>
                {p.cover_image
                    ? <img src={p.cover_image} alt={p.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-300"><Home size={20} /></div>}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5 text-[11px] text-gray-500">
                    {(p.suburb || p.location) && <span className="inline-flex items-center gap-1"><MapPin size={11} />{p.suburb || p.location}</span>}
                    {p.room_type && <span className="inline-flex items-center gap-1"><BedDouble size={11} />{p.room_type}</span>}
                    {p.bathroom_type && <span className="inline-flex items-center gap-1"><Bath size={11} />{p.bathroom_type}</span>}
                </div>
                {(p.rent_single || p.rent_couple) && (
                    <p className="text-xs font-semibold text-[#1F5A8B] mt-1">
                        {money(p.rent_single)}{p.rent_single && p.rent_couple ? ' – ' : ''}{p.rent_couple ? money(p.rent_couple) : ''}
                        <span className="font-normal text-gray-400"> / wk</span>
                    </p>
                )}
                {!dense && includes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                        {includes.slice(0, 4).map((it, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-[10px] text-gray-600">{it}</span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Contact-detail inputs — shared across variants.
export function ContactFields({ info, onChange, compact = false }) {
    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3`}>
            <input className={inputCls} placeholder="First name *" value={info.firstName} onChange={(e) => onChange({ firstName: e.target.value })} />
            <input className={inputCls} placeholder="Last name" value={info.lastName} onChange={(e) => onChange({ lastName: e.target.value })} />
            <input className={inputCls} type="email" placeholder="Email *" value={info.email} onChange={(e) => onChange({ email: e.target.value })} />
            <input className={inputCls} placeholder="Phone" value={info.phoneNumber} onChange={(e) => onChange({ phoneNumber: e.target.value })} />
            {!compact && <input className={`${inputCls} sm:col-span-2`} placeholder="Current country" value={info.country} onChange={(e) => onChange({ country: e.target.value })} />}
            {!compact && <textarea className={`${inputCls} sm:col-span-2 resize-y`} rows={2} placeholder="Anything we should know (optional)" value={info.message} onChange={(e) => onChange({ message: e.target.value })} />}
        </div>
    );
}
