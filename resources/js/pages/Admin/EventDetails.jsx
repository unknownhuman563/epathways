import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { 
    ArrowLeft, Calendar, MapPin, Users, Globe, 
    FileText, Download, Edit, Search, CheckCircle2, XCircle, Tag, Clock
} from 'lucide-react';

export default function EventDetails({ event, leads }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLeads = leads.filter(lead => {
        const full = `${lead.first_name} ${lead.last_name}`.toLowerCase();
        const email = lead.email.toLowerCase();
        const s = searchTerm.toLowerCase();
        return full.includes(s) || email.includes(s);
    });

    const getStatusStyle = (status) => {
        const s = (status || '').toLowerCase();
        switch(s) {
            case 'upcoming':  return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'ongoing':   return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'completed': return 'bg-gray-100 text-gray-600 border-gray-200';
            case 'cancelled': return 'bg-red-100 text-red-600 border-red-200';
            default:          return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch(e) { return dateStr; }
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            <Head title={`Event Details - ${event.name}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col gap-2">
                    <Link href="/admin/events" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors w-max">
                        <ArrowLeft size={16} /> Back to Events
                    </Link>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            {event.name}
                        </h1>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${getStatusStyle(event.status)}`}>
                            {event.status}
                        </span>
                        <span className="text-xs text-indigo-700 font-bold bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md uppercase tracking-wider">
                            {event.mode || 'In-Person'}
                        </span>
                        <span className="text-xs text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded-md">CODE: {event.event_code}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-colors shadow-sm">
                        <Download size={16} /> Export Registrants
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 text-sm font-semibold transition-colors shadow-sm">
                        <Edit size={16} /> Edit Event
                    </button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Users size={20} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 font-medium">Registrants</p>
                        <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 font-medium">Date Range</p>
                        <p className="text-sm font-bold text-gray-900 leading-tight mt-1">
                            {formatDate(event.date_from)} {event.date_to ? ` - ${formatDate(event.date_to)}` : ''}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Tag size={20} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 font-medium">Event Type</p>
                        <p className="text-sm font-bold text-gray-900 mt-1">{event.type}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        {String(event.mode).toLowerCase() === 'online' ? <Globe size={20} /> : <MapPin size={20} />}
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 font-medium">Location</p>
                        <p className="text-sm font-bold text-gray-900 line-clamp-2 mt-1">{String(event.mode).toLowerCase() === 'online' ? 'Online / Webinar' : 'Multiple / Venue'}</p>
                    </div>
                </div>
            </div>

            {/* Description & Banner */}
            {(event.description || event.banner_image_url) && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
                    {event.banner_image_url && (
                        <div className="md:w-1/3 bg-gray-100 flex-shrink-0">
                            <img src={event.banner_image_url} alt="Event Banner" className="w-full h-full object-cover min-h-[200px]" />
                        </div>
                    )}
                    <div className="p-6 flex-1">
                        <h3 className="text-sm font-bold text-gray-900 mb-2">Event Description</h3>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                            {event.description || 'No description provided.'}
                        </p>
                        {event.notes && (
                            <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Internal Notes</h4>
                                <p className="text-sm text-amber-900">{event.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Registrants Table Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Registrants</h2>
                        <p className="text-xs text-gray-600 mt-1">People who have signed up directly for this event.</p>
                    </div>
                    <div className="w-full sm:w-72 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Search name or email..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Name & Contact</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Interest / Study Plan</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Registered</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <Users className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                                        <p className="font-semibold text-gray-600 mb-1">No registrants found</p>
                                        <p className="text-sm">No one has registered for this event yet.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredLeads.map(lead => (
                                    <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                                                    {lead.first_name?.charAt(0)}{lead.last_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{lead.first_name} {lead.last_name}</p>
                                                    <p className="text-xs text-gray-600">{lead.email}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{lead.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-semibold text-gray-800">{lead.stage || 'N/A'}</span>
                                                <span className="text-xs text-gray-600">{lead.study_plans?.[0]?.qualification_level || lead.education_exps?.[0]?.level || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                                {lead.status || 'New'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-700">{formatDate(lead.created_at)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/admin/leads/${lead.id}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline">
                                                View Lead
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
