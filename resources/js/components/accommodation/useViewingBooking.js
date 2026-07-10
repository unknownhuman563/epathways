import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { TZDate } from '@date-fns/tz';

// Mon–Fri 9–5 fallback when no staff availability is configured.
export const DEFAULT_AVAILABILITY = {
    mon: { start: '09:00', end: '17:00' }, tue: { start: '09:00', end: '17:00' },
    wed: { start: '09:00', end: '17:00' }, thu: { start: '09:00', end: '17:00' },
    fri: { start: '09:00', end: '17:00' },
};
const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const slotsBetween = (start, end) => {
    const [sh] = start.split(':').map(Number);
    const [eh] = end.split(':').map(Number);
    const out = [];
    for (let h = sh; h < eh; h++) out.push(`${String(h).padStart(2, '0')}:00`);
    return out;
};

export const money = (v) => (v == null ? null : `$${Number(v).toFixed(0)}`);

export function splitIncludes(text) {
    if (!text) return [];
    const items = [];
    let depth = 0, current = '';
    for (const ch of text) {
        if (ch === '(') depth++;
        else if (ch === ')') depth = Math.max(0, depth - 1);
        if (ch === ',' && depth === 0) { if (current.trim()) items.push(current.trim()); current = ''; }
        else current += ch;
    }
    if (current.trim()) items.push(current.trim());
    return items;
}

// All the state + logic for a property-viewing booking, shared by every UI
// variant so they differ only in layout/markup.
export function useViewingBooking({ properties = [], availability = {}, businessTz = 'Pacific/Auckland' }) {
    const [info, setInfo] = useState({
        propertyId: '', firstName: '', lastName: '', email: '', phoneNumber: '',
        country: '', message: '', appointmentDate: '', appointmentTime: '', appointmentAt: '',
    });
    const [day, setDay] = useState(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const onChange = (patch) => setInfo((prev) => ({ ...prev, ...patch }));

    const avail = availability && Object.keys(availability).length ? availability : DEFAULT_AVAILABILITY;
    const disabledDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => !avail[DOW[d]]);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const showBoth = clientTz !== businessTz;
    const fmtIn = (date, tz) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz });

    const dayAvail = day ? avail[DOW[day.getDay()]] : null;
    const slots = useMemo(() => {
        if (!day || !dayAvail) return [];
        return slotsBetween(dayAvail.start, dayAvail.end).map((t) => {
            const [hh] = t.split(':').map(Number);
            const utc = new Date(new TZDate(day.getFullYear(), day.getMonth(), day.getDate(), hh, 0, 0, businessTz).getTime());
            return { nzLabel: fmtIn(utc, businessTz), localLabel: fmtIn(utc, clientTz), utc: utc.toISOString() };
        });
    }, [day, dayAvail, businessTz, clientTz]);

    const pickDay = (d) => {
        setDay(d);
        onChange({ appointmentDate: d ? format(d, 'yyyy-MM-dd') : '', appointmentTime: '', appointmentAt: '' });
    };
    const pickSlot = (s) => onChange({ appointmentTime: s.nzLabel, appointmentAt: s.utc });

    const selected = properties.find((p) => String(p.id) === String(info.propertyId)) || null;
    const localTimeLabel = info.appointmentAt ? fmtIn(new Date(info.appointmentAt), clientTz) : info.appointmentTime;
    const canConfirm = info.propertyId && info.firstName?.trim() && info.email?.trim() && info.appointmentDate && info.appointmentTime && !isSubmitting;

    const reset = () => {
        setInfo({ propertyId: '', firstName: '', lastName: '', email: '', phoneNumber: '', country: '', message: '', appointmentDate: '', appointmentTime: '', appointmentAt: '' });
        setDay(undefined); setSuccess(false); setError(null);
    };

    const submit = async () => {
        if (!canConfirm) return;
        setError(null);
        setIsSubmitting(true);
        try {
            const response = await fetch('/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                },
                body: JSON.stringify({
                    first_name: info.firstName.trim(),
                    last_name: info.lastName || null,
                    email: info.email.trim(),
                    phone: info.phoneNumber || null,
                    current_country: info.country || null,
                    service_type: 'Accommodation Viewing',
                    property_id: info.propertyId,
                    consultant_name: 'Accommodation Team',
                    appointment_date: info.appointmentDate,
                    appointment_time: info.appointmentTime,
                    appointment_at: info.appointmentAt || null,
                    client_timezone: clientTz,
                    message: info.message || null,
                    platform: 'In-System',
                }),
            });
            if (response.ok) setSuccess(true);
            else {
                const data = await response.json().catch(() => ({}));
                setError(data.message || 'Could not book your viewing. Please try again.');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        info, onChange, day, pickDay, slots, pickSlot, selected, localTimeLabel,
        isSubmitting, error, success, canConfirm, submit, reset,
        today, disabledDays, clientTz, showBoth,
    };
}
