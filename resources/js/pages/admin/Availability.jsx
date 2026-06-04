import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { Calendar, Plus, Trash2, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY = {
    day_of_week: 1,
    start_time: '10:00',
    end_time: '16:00',
    slot_minutes: 30,
    user_id: '',
    active: true,
    label: '',
};

const SLOT_OPTIONS = [15, 30, 45, 60, 90, 120];

export default function Availability({ rules, staff, days }) {
    const { props } = usePage();
    const [showForm, setShowForm] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm(EMPTY);

    React.useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
    }, [props.flash?.success]);

    const submit = (e) => {
        e.preventDefault();
        post('/admin/availability', {
            preserveScroll: true,
            onSuccess: () => { reset(); setShowForm(false); },
        });
    };

    const toggleActive = (rule) => {
        router.post(`/admin/availability/${rule.id}`, {
            ...rule,
            active: !rule.active,
        }, { preserveScroll: true });
    };

    const remove = (rule) => {
        if (!confirm(`Delete the ${days[rule.day_of_week]} ${rule.start_time}–${rule.end_time} rule?`)) return;
        router.delete(`/admin/availability/${rule.id}`, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Availability rules" />
            <div className="max-w-4xl mx-auto p-6">
                <header className="mb-8 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <Calendar size={20} className="text-gray-700" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Availability rules</h1>
                            <p className="text-sm text-gray-500 max-w-xl">
                                Weekly recurring windows the booking page slices into slots. Clients only see times that aren't already booked.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowForm((s) => !s)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition"
                    >
                        <Plus size={15} /> {showForm ? 'Cancel' : 'New rule'}
                    </button>
                </header>

                {showForm && (
                    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Day</label>
                                <select
                                    value={data.day_of_week}
                                    onChange={(e) => setData('day_of_week', parseInt(e.target.value, 10))}
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                                >
                                    {Object.entries(days).map(([num, name]) => (
                                        <option key={num} value={num}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Slot length</label>
                                <select
                                    value={data.slot_minutes}
                                    onChange={(e) => setData('slot_minutes', parseInt(e.target.value, 10))}
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                                >
                                    {SLOT_OPTIONS.map((m) => <option key={m} value={m}>{m} min</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Start time</label>
                                <input
                                    type="time"
                                    value={data.start_time}
                                    onChange={(e) => setData('start_time', e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                                />
                                {errors.start_time && <p className="text-xs text-red-500 mt-1">{errors.start_time}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">End time</label>
                                <input
                                    type="time"
                                    value={data.end_time}
                                    onChange={(e) => setData('end_time', e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                                />
                                {errors.end_time && <p className="text-xs text-red-500 mt-1">{errors.end_time}</p>}
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Consultant (optional)</label>
                                <select
                                    value={data.user_id}
                                    onChange={(e) => setData('user_id', e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                                >
                                    <option value="">Any consultant</option>
                                    {staff.map((u) => (
                                        <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Label (optional)</label>
                                <input
                                    type="text"
                                    value={data.label}
                                    onChange={(e) => setData('label', e.target.value)}
                                    placeholder="e.g. Morning block, English-speaking only"
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900">Cancel</button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex items-center gap-2 px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-60"
                            >
                                {processing ? 'Saving…' : 'Create rule'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {rules.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-sm font-semibold text-gray-700">No availability rules yet</p>
                            <p className="text-xs text-gray-500 mt-1">Add one to expose bookable slots on the resident-intake page.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50/60 border-b border-gray-100">
                                <tr className="text-left text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
                                    <th className="px-6 py-3">Day</th>
                                    <th className="px-3 py-3">Window</th>
                                    <th className="px-3 py-3">Slot</th>
                                    <th className="px-3 py-3">Consultant</th>
                                    <th className="px-3 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rules.map((r) => (
                                    <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40">
                                        <td className="px-6 py-3 font-semibold text-gray-900">{days[r.day_of_week]}</td>
                                        <td className="px-3 py-3 text-gray-700">{r.start_time}–{r.end_time}</td>
                                        <td className="px-3 py-3 text-gray-700">{r.slot_minutes}min</td>
                                        <td className="px-3 py-3 text-gray-500">{r.user?.name || 'Any'}</td>
                                        <td className="px-3 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${r.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {r.active ? 'Active' : 'Paused'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleActive(r)}
                                                    className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                                                    title={r.active ? 'Pause rule' : 'Activate rule'}
                                                >
                                                    {r.active ? <PowerOff size={14} /> : <Power size={14} />}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => remove(r)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                                                    title="Delete rule"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}
