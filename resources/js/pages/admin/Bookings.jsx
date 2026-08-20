import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { 
    Search, Filter, Plus, MoreVertical, Eye, Edit2, 
    MessageSquare, Calendar, FileText, Mail, Trash2,
    ChevronDown, Clock, CheckSquare, FileSpreadsheet,
    Globe, GraduationCap, Home
} from 'lucide-react';
// Shared stage → pill-colour map, so the STAGE dropdown here reads exactly
// like the coloured stage pills in the Leads list.
import { stageClass } from '@/pages/portal/sales/Leads';

export default function Bookings({ bookings: backendBookings, stages = [] }) {
    const [bookings, setBookings] = useState(() => {
        if (backendBookings && backendBookings.length > 0) {
            return backendBookings.map(booking => ({
                id: booking.id,
                name: `${booking.first_name || ''} ${booking.last_name || ''}`.trim(),
                email: booking.email || '—',
                phone: booking.phone || '—',
                service: booking.service_type || '—',
                consultant: booking.consultant_name || '—',
                platform: booking.platform || 'Google Calendar',
                status: booking.status || 'Pending',
                message: booking.message || '',
                createdAt: new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                lead_id: booking.lead?.lead_id || null,
                lead_internal_id: booking.lead?.id || null,
                stage: booking.lead?.status || null,
                // Kept whole so the View Details modal can surface every field
                // (client, appointment, intake) without a second request.
                lead: booking.lead || null,
                raw: booking,
                currentCountry: booking.current_country || '—',
                appointmentDate: booking.appointment_date ? new Date(booking.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null,
                appointmentTime: booking.appointment_time || null,
                rawDate: booking.appointment_date || '',
            }));
        }
        return [];
    });

    const [selectedBookings, setSelectedBookings] = useState([]);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingData, setEditingData] = useState({ id: null, date: '', time: '', status: '' });
    const [viewingBooking, setViewingBooking] = useState(null);

    // Tabs to split consultation bookings by service line.
    const [tab, setTab] = useState("all");
    const matchesTab = (b, t) => (t === "all" ? true : (b.service || "").toLowerCase().includes(t));
    const filteredBookings = bookings.filter((b) => matchesTab(b, tab));
    const tabCount = (t) => bookings.filter((b) => matchesTab(b, t)).length;

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedBookings(filteredBookings.map(b => b.id));
        } else {
            setSelectedBookings([]);
        }
    };

    // Inline pipeline-stage change straight from the Bookings table — hits
    // the same endpoint the Leads list uses so the two stay in lockstep.
    // Optimistic: update the row immediately, roll back if the POST fails.
    const changeStage = (booking, newStatus) => {
        if (! booking.lead_internal_id || newStatus === booking.stage) return;
        const previous = booking.stage;
        setBookings((bs) => bs.map((b) => b.id === booking.id ? { ...b, stage: newStatus } : b));
        import('@inertiajs/react').then(({ router }) => {
            router.post(`/admin/leads/${booking.lead_internal_id}/stage`, { status: newStatus }, {
                preserveScroll: true,
                preserveState: true,
                onError: () => setBookings((bs) => bs.map((b) => b.id === booking.id ? { ...b, stage: previous } : b)),
            });
        });
    };

    // Convert a standalone booking into a pipeline lead (education flow).
    // Only offered for bookings not yet linked to a lead. On success the row
    // is updated in place so the CONVERT button disappears and the stage
    // dropdown becomes live.
    const [convertingId, setConvertingId] = useState(null);
    const convertToLead = (booking) => {
        if (booking.lead_internal_id || convertingId === booking.id) return;
        setConvertingId(booking.id);
        fetch(`/admin/bookings/${booking.id}/convert`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
            },
        })
            .then((r) => (r.ok ? r.json() : Promise.reject(r)))
            .then((data) => {
                const lead = data.lead || {};
                setBookings((bs) => bs.map((b) => b.id === booking.id
                    ? { ...b, lead_internal_id: lead.id, lead_id: lead.lead_id, stage: lead.status || 'Booking Confirmation' }
                    : b));
            })
            .catch(() => { /* leave the button so staff can retry */ })
            .finally(() => setConvertingId(null));
    };

    // Delete a booking (admin cleanup). Confirms, then removes the row and
    // drops it from the table on success.
    const deleteBooking = (booking) => {
        setActiveDropdown(null);
        if (! confirm(`Delete this booking for ${booking.name || 'this client'}? This can't be undone.`)) return;
        import('@inertiajs/react').then(({ router }) => {
            router.delete(`/admin/bookings/${booking.id}`, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setBookings((bs) => bs.filter((b) => b.id !== booking.id)),
            });
        });
    };

    const handleUpdateSubmit = (e) => {
        e.preventDefault();
        import('@inertiajs/react').then(({ router }) => {
            router.post(`/admin/bookings/${editingData.id}`, {
                appointment_date: editingData.date,
                appointment_time: editingData.time,
                status: editingData.status,
            }, {
                onSuccess: () => setIsEditModalOpen(false),
            });
        });
    };

    const toggleSelect = (id) => {
        if (selectedBookings.includes(id)) {
            setSelectedBookings(selectedBookings.filter(bid => bid !== id));
        } else {
            setSelectedBookings([...selectedBookings, id]);
        }
    };

    const getStatusStyle = (status) => {
        switch(status.toLowerCase()) {
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getServiceIcon = (service) => {
        const s = service.toLowerCase();
        if (s.includes('education')) return <GraduationCap size={14} className="text-blue-500" />;
        if (s.includes('immigration')) return <Globe size={14} className="text-emerald-500" />;
        if (s.includes('accommodation')) return <Home size={14} className="text-orange-500" />;
        return <Calendar size={14} className="text-gray-600" />;
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
            <Head title="Bookings Management" />

            {/* Page Header & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hidden lg:flex mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Consultation Bookings</h1>
                    <p className="text-sm text-gray-600 mt-1">Manage and track all professional consultation requests.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold shadow-sm">
                        <FileSpreadsheet size={16} className="text-emerald-600" />
                        Export Bookings
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 text-sm font-semibold transition-colors shadow-sm">
                        <Plus size={16} />
                        Log Manual Booking
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="w-full lg:w-96 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-500 group-focus-within:text-[#436235] transition-colors" />
                    </div>
                    <input 
                        type="text" 
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#436235] focus:border-[#436235] sm:text-sm transition-all" 
                        placeholder="Search bookings..." 
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    <select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-[#436235] focus:border-[#436235] block p-2.5 outline-none hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                        <option value="">All Services</option>
                        <option value="education">Education</option>
                        <option value="immigration">Immigration</option>
                        <option value="accommodation">Accommodation</option>
                    </select>

                    <select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-[#436235] focus:border-[#436235] block p-2.5 outline-none hover:bg-gray-50 transition-colors shadow-sm cursor-pointer border-[#436235]/20">
                        <option value="">All Platforms</option>
                        <option value="google">Google Calendar</option>
                        <option value="whatsapp">WhatsApp</option>
                    </select>

                    {selectedBookings.length > 0 && (
                        <div className="flex items-center gap-2 animate-fade-in ml-4">
                            <span className="text-sm font-bold text-gray-700 mr-2 bg-green-50 px-3 py-1 rounded-lg text-green-700">
                                {selectedBookings.length} Selected
                            </span>
                            <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Service tabs — All / Education / Immigration */}
            <div className="flex items-center gap-1 border-b border-gray-100">
                {[
                    { key: "all", label: "All Bookings" },
                    { key: "education", label: "Education" },
                    { key: "immigration", label: "Immigration" },
                ].map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === t.key ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700"}`}
                    >
                        {t.label} <span className="ml-1 text-xs text-gray-400">{tabCount(t.key)}</span>
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 w-10">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 text-[#436235] bg-gray-100 border-gray-300 rounded focus:ring-[#436235] cursor-pointer" 
                                        onChange={toggleSelectAll}
                                        checked={filteredBookings.length > 0 && filteredBookings.every(b => selectedBookings.includes(b.id))}
                                    />
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Stage</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Service & Consultant</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Platform</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Requested On</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">Appointment</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">Country</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredBookings.map((booking) => (
                                <tr 
                                    key={booking.id} 
                                    className={`hover:bg-[#436235]/5 transition-colors ${selectedBookings.includes(booking.id) ? 'bg-[#436235]/5' : ''}`}
                                >
                                    <td className="px-6 py-4">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 text-[#436235] bg-gray-100 border-gray-300 rounded focus:ring-[#436235] cursor-pointer"
                                            checked={selectedBookings.includes(booking.id)}
                                            onChange={() => toggleSelect(booking.id)}
                                        />
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900 text-sm">{booking.name}</span>
                                                {booking.lead_id && (
                                                    <Link 
                                                        href={`/admin/leads?id=${booking.lead_internal_id}`}
                                                        className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold hover:bg-blue-100 transition-colors"
                                                    >
                                                        {booking.lead_id}
                                                    </Link>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-600">{booking.email}</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        {booking.lead_internal_id ? (
                                            <div className="relative inline-block">
                                                <select
                                                    value={booking.stage || ''}
                                                    onChange={(e) => changeStage(booking, e.target.value)}
                                                    title="Change pipeline stage"
                                                    style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', backgroundImage: 'none' }}
                                                    className={`appearance-none max-w-[210px] truncate text-[11px] font-bold uppercase tracking-wide rounded-full border pl-3 pr-7 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300 transition-colors ${stageClass(booking.stage)}`}
                                                >
                                                    {! booking.stage && <option value="" disabled>Set stage…</option>}
                                                    {stages.map((s) => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-60" />
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                {getServiceIcon(booking.service)}
                                                <span className="text-sm font-semibold text-gray-800">{booking.service}</span>
                                            </div>
                                            <span className="text-xs text-[#436235] font-medium ml-5">{booking.consultant}</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {booking.platform === 'WhatsApp' ? (
                                                <MessageSquare size={14} className="text-green-500" />
                                            ) : (
                                                <Calendar size={14} className="text-blue-500" />
                                            )}
                                            <span className="text-xs font-medium text-gray-700">{booking.platform}</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-900">{booking.createdAt}</span>
                                            <span className="text-[10px] text-gray-500 font-medium">Recorded</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        {booking.appointmentDate ? (
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-900">{booking.appointmentDate}</span>
                                                <span className="text-xs text-blue-600 font-medium">{booking.appointmentTime}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-500 italic">TBD (Check Calendar)</span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 capitalize font-medium text-gray-700 text-xs bg-gray-50 px-2 py-1 rounded border border-gray-100 w-max">
                                            <Globe size={12} className="text-gray-500" />
                                            {booking.currentCountry}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 text-right pr-6 relative">
                                        <div className="inline-flex items-center gap-2">
                                            {! booking.lead_internal_id && (
                                                <button
                                                    onClick={() => convertToLead(booking)}
                                                    disabled={convertingId === booking.id}
                                                    title="Convert this client into a pipeline lead"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                                >
                                                    <Globe size={13} /> {convertingId === booking.id ? 'Converting…' : 'Convert'}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setActiveDropdown(activeDropdown === booking.id ? null : booking.id)}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                                            >
                                                Actions <ChevronDown size={14} className="text-gray-500" />
                                            </button>
                                        </div>

                                        {activeDropdown === booking.id && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)}></div>
                                                <div className="absolute right-6 top-12 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2 divide-y divide-gray-50">
                                                    <div className="px-1 py-1">
                                                        <button
                                                            onClick={() => { setViewingBooking(booking); setActiveDropdown(null); }}
                                                            className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                                                        >
                                                            <Eye size={16} className="text-gray-500" /> View Details
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                setEditingData({
                                                                    id: booking.id,
                                                                    date: booking.rawDate,
                                                                    time: booking.appointmentTime || '',
                                                                    status: booking.status
                                                                });
                                                                setIsEditModalOpen(true);
                                                                setActiveDropdown(null);
                                                            }}
                                                            className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                                                        >
                                                            <Edit2 size={16} className="text-gray-500" /> Edit Booking
                                                        </button>
                                                    </div>
                                                    <div className="px-1 py-1">
                                                        <button
                                                            onClick={() => deleteBooking(booking)}
                                                            className="flex w-full items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                                                        >
                                                            <Trash2 size={16} /> Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {bookings.length === 0 && (
                                <tr>
                                    <td colSpan="9" className="px-6 py-12 text-center text-gray-600">
                                        No bookings found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style jsx>{`
                .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
            
            {/* View Details Modal */}
            {viewingBooking && (() => {
                const vb = viewingBooking;
                const lead = vb.lead || {};
                const raw = vb.raw || {};
                const Row = ({ label, value }) => (
                    <div className="flex justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
                        <span className="text-sm text-gray-800 text-right">{value || <span className="text-gray-300">—</span>}</span>
                    </div>
                );
                const Section = ({ title, children }) => (
                    <div>
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">{title}</h4>
                        <div>{children}</div>
                    </div>
                );
                const yesNo = (v) => (v === true || v === 1 || v === '1' || v === 'Yes' ? 'Yes' : (v === false || v === 0 || v === '0' || v === 'No' ? 'No' : null));
                return (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setViewingBooking(null)}>
                        <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-white/20 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                            <div className="bg-[#436235] p-6 text-white flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-3"><Eye size={22} /> {vb.name || 'Booking Details'}</h3>
                                    <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{vb.service}{vb.consultant ? ` · ${vb.consultant}` : ''}</p>
                                </div>
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(vb.status)}`}>{vb.status}</span>
                            </div>

                            <div className="p-8 space-y-6 overflow-y-auto">
                                <Section title="Appointment">
                                    <Row label="Date" value={vb.appointmentDate} />
                                    <Row label="Time" value={vb.appointmentTime} />
                                    <Row label="Time Zone" value={raw.client_timezone} />
                                    <Row label="Platform" value={vb.platform} />
                                    <Row label="Stage" value={vb.stage} />
                                    <Row label="Requested On" value={vb.createdAt} />
                                    {raw.meet_link && (
                                        <div className="flex justify-between gap-4 py-2 border-b border-gray-50">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Meet Link</span>
                                            <a href={raw.meet_link} target="_blank" rel="noopener noreferrer" className="text-sm text-[#436235] hover:underline text-right break-all">{raw.meet_link}</a>
                                        </div>
                                    )}
                                </Section>

                                <Section title="Client">
                                    <Row label="Email" value={vb.email} />
                                    <Row label="Phone" value={vb.phone} />
                                    <Row label="Country" value={vb.currentCountry} />
                                    <Row label="City" value={lead.residence_city} />
                                    <Row label="Age" value={lead.age} />
                                    <Row label="Gender" value={lead.gender} />
                                    <Row label="Civil Status" value={lead.marital_status} />
                                </Section>

                                {(lead.has_children != null || lead.number_of_children != null || lead.has_dependent_partner != null || lead.partner_in_nz != null) && (
                                    <Section title="Family">
                                        <Row label="Has Partner/Dependents" value={yesNo(lead.supports_partner_or_dependents ?? lead.has_dependent_partner)} />
                                        <Row label="Partner in NZ" value={yesNo(lead.partner_in_nz)} />
                                        <Row label="Has Children" value={yesNo(lead.has_children)} />
                                        <Row label="Number of Children" value={lead.number_of_children} />
                                        <Row label="Children Notes" value={lead.dependent_children_notes} />
                                    </Section>
                                )}

                                {raw.intake && Object.keys(raw.intake).length > 0 && (
                                    <Section title="Intake Form">
                                        {Object.entries(raw.intake)
                                            .filter(([, v]) => v !== null && v !== '' && v !== undefined)
                                            .map(([k, v]) => (
                                                <Row
                                                    key={k}
                                                    label={k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                                    value={typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}
                                                />
                                            ))}
                                    </Section>
                                )}

                                {vb.message && (
                                    <Section title="Message / Notes">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{vb.message}</p>
                                    </Section>
                                )}
                            </div>

                            <div className="p-5 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                                {vb.lead_internal_id ? (
                                    <Link href={`/admin/leads?id=${vb.lead_internal_id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#436235] hover:underline">
                                        <FileText size={15} /> Open full lead profile
                                    </Link>
                                ) : <span />}
                                <button onClick={() => setViewingBooking(null)} className="px-5 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black transition-colors">Close</button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Edit Booking Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-white/20">
                        <form onSubmit={handleUpdateSubmit}>
                            <div className="bg-[#436235] p-6 text-white">
                                <h3 className="text-xl font-bold flex items-center gap-3">
                                    <Edit2 size={24} /> Edit Appointment
                                </h3>
                                <p className="text-[#436235]/60 mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Update consultation timing and status.</p>
                            </div>
                            
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Appointment Date</label>
                                        <input 
                                            type="date" 
                                            value={editingData.date}
                                            onChange={(e) => setEditingData({...editingData, date: e.target.value})}
                                            className="w-full bg-gray-50 border-gray-200 rounded-xl focus:ring-[#436235] focus:border-[#436235] transition-all p-3"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Appointment Time</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. 9:00 AM - 11:00 AM"
                                            value={editingData.time}
                                            onChange={(e) => setEditingData({...editingData, time: e.target.value})}
                                            className="w-full bg-gray-50 border-gray-200 rounded-xl focus:ring-[#436235] focus:border-[#436235] transition-all p-3"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Status</label>
                                    <select 
                                        value={editingData.status}
                                        onChange={(e) => setEditingData({...editingData, status: e.target.value})}
                                        className="w-full bg-gray-50 border-gray-200 rounded-xl focus:ring-[#436235] focus:border-[#436235] transition-all p-3"
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="Cancelled">Cancelled</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="p-6 bg-gray-50 flex items-center justify-end gap-3 px-8">
                                <button 
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-8 py-2.5 bg-[#436235] text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:bg-black transition-all"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
