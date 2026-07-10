import React, { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { format } from 'date-fns';
import { Home, Calendar, Clock, ChevronDown } from 'lucide-react';
import { useViewingBooking } from './useViewingBooking';
import { ACCENT, RDP_STYLE, Success, PropertyMini, ContactFields } from './ViewingBits';

// Property-viewing booking for the accommodation landing page. A slim row of
// "pills" (Property · Date · Time), each opening a popover directly beneath
// itself. Once all three are set, the chosen property previews above the form.
export default function PropertyViewingBooking(props) {
    const b = useViewingBooking(props);
    const [pop, setPop] = useState(null); // 'property' | 'date' | 'time'
    const ref = useRef(null);
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setPop(null); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);
    if (b.success) return <div className="bg-white rounded-2xl border border-gray-200 shadow-sm max-w-xl mx-auto"><Success selected={b.selected} onReset={b.reset} /></div>;

    // Each pill is its own relative anchor so its popover drops right under it.
    const Field = ({ id, icon, label, value, children, panelCls = '' }) => (
        <div className="relative flex-1 min-w-0">
            <button type="button" onClick={() => setPop(pop === id ? null : id)} className={`w-full flex items-center gap-2 px-4 py-3 text-left rounded-xl transition ${pop === id ? 'bg-[#1F5A8B]/5 ring-1 ring-[#1F5A8B]/30' : 'hover:bg-gray-50'}`}>
                {icon}
                <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
                    <span className={`block text-sm truncate ${value ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{value || 'Choose'}</span>
                </span>
                <ChevronDown size={14} className="text-gray-300 shrink-0" />
            </button>
            {pop === id && (
                <div className={`absolute z-30 top-full mt-2 bg-white rounded-2xl border border-gray-200 shadow-xl ${panelCls}`}>
                    {children}
                </div>
            )}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-4" ref={ref}>
            <div className="text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: ACCENT }}>Book a viewing</p>
                <h3 className="text-xl font-bold text-gray-900">Find a place to see in person</h3>
            </div>

            {/* Pill bar */}
            <div className="flex flex-col sm:flex-row items-stretch bg-white rounded-2xl border border-gray-200 shadow-sm divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                <Field id="property" icon={<Home size={16} className="text-gray-400 shrink-0" />} label="Property" value={b.selected?.name} panelCls="left-0 w-[320px] max-w-[85vw] p-2 max-h-80 overflow-y-auto">
                    {props.properties.map((p) => (
                        <button key={p.id} type="button" onClick={() => { b.onChange({ propertyId: String(p.id) }); setPop('date'); }} className={`w-full text-left p-2 rounded-xl hover:bg-gray-50 ${String(p.id) === b.info.propertyId ? 'bg-[#1F5A8B]/5' : ''}`}>
                            <PropertyMini p={p} dense />
                        </button>
                    ))}
                </Field>

                <Field id="date" icon={<Calendar size={16} className="text-gray-400 shrink-0" />} label="Date" value={b.info.appointmentDate && format(new Date(`${b.info.appointmentDate}T00:00:00`), 'EEE d MMM')} panelCls="left-0 p-3">
                    <DayPicker mode="single" selected={b.day} onSelect={(d) => { b.pickDay(d); setPop('time'); }} startMonth={b.today} disabled={[{ before: b.today }, { dayOfWeek: b.disabledDays }]} style={RDP_STYLE} />
                </Field>

                <Field id="time" icon={<Clock size={16} className="text-gray-400 shrink-0" />} label="Time" value={b.info.appointmentTime && b.localTimeLabel} panelCls="right-0 w-72 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">{b.day ? format(b.day, 'EEE, d MMM') : 'Pick a date first'}</p>
                    {!b.day ? <p className="text-xs text-gray-400">Choose a date first.</p> : b.slots.length === 0 ? <p className="text-xs text-gray-400">No times this day.</p> : (
                        <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                            {b.slots.map((s) => {
                                const active = b.info.appointmentAt === s.utc;
                                return <button key={s.utc} type="button" onClick={() => { b.pickSlot(s); setPop(null); }} className={`px-1 py-1.5 rounded-lg text-xs font-medium border ${active ? 'text-white' : 'text-gray-700 bg-white border-gray-200 hover:border-[#1F5A8B]'}`} style={active ? { background: ACCENT, borderColor: ACCENT } : {}}>{s.localLabel}</button>;
                            })}
                        </div>
                    )}
                </Field>
            </div>

            {/* Details — revealed once a slot is chosen. Chosen property + schedule
                preview sits between the pills and the contact form. */}
            {b.info.appointmentTime && (
                <div className="space-y-4">
                    {b.selected && (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                            <PropertyMini p={b.selected} />
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
                                <span className="inline-flex items-center gap-1.5"><Calendar size={14} className="text-gray-400" />{format(new Date(`${b.info.appointmentDate}T00:00:00`), 'EEEE, d MMMM yyyy')}</span>
                                <span className="inline-flex items-center gap-1.5"><Clock size={14} className="text-gray-400" />{b.localTimeLabel}{b.showBoth && <span className="text-gray-400"> (NZ {b.info.appointmentTime})</span>}</span>
                            </div>
                        </div>
                    )}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                        <ContactFields info={b.info} onChange={b.onChange} />
                        {b.error && <p className="text-sm text-rose-600">{b.error}</p>}
                        <button onClick={b.submit} disabled={!b.canConfirm} className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition" style={{ background: ACCENT }}>
                            {b.isSubmitting ? 'Booking…' : 'Confirm viewing'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
